import './Application.scss';

import React, { useCallback, useState, useEffect, useRef } from 'react';
import { throttle, debounce } from 'lodash';
import DrawDesk from './components/DrawDesk.js';
import ToolBar from './components/ToolBar.js';
import CuteCursor from './components/CuteCursor.js';
import RippleEffect from './components/RippleEffect.js';
import Toast from './components/Toast.js';
import TextEditor from './components/TextEditor.js';
import {
  filterClosePoints,
  getMouseCoordinates,
  distanceBetweenPoints,
  calculateCanvasTextWidth,
  applySoftSnap,
  applyAspectRatioLock,
} from './utils/general.js';
import {
  isOnFigure,
  isOverFigure,
  areFiguresIntersecting,
  getDotNameOnFigure,
  dragFigure,
  resizeFigure,
  moveToCoordinates,
  calculateAspectRatio,
} from './utils/figureDetection.js';
import { FaPaintBrush, FaHighlighter, FaRegSquare, FaRegCircle, FaArrowRight, FaEraser } from "react-icons/fa";
import { AiOutlineLine } from "react-icons/ai";
import { GiLaserburn } from "react-icons/gi";
import { MdOutlineCancel } from "react-icons/md";
import { FaFont } from "react-icons/fa6";
import FaMagicPaintBrush from "./components/icons/FaMagicPaintBrush.js";

import {
  fadeOutDestroyAfterMs,
  eraserTime,
  brushList,
  shapeList,
  colorList,
  widthList,
  minObjectDistance,
  pastCooldownMs,
  escDoubleTapMs,
} from './constants.js'

const Icons = {
  FaPaintBrush,
  FaMagicPaintBrush,
  FaRegSquare,
  FaRegCircle,
  FaArrowRight,
  AiOutlineLine,
  GiLaserburn,
  MdOutlineCancel,
  FaEraser,
  FaHighlighter,
  FaFont,
};

const Application = (settings) => {
  // console.log('App render');

  const initialColorDeg = Math.random() * 360
  const initialActiveTool = settings.tool_bar_active_tool
  const initialActiveColor = settings.tool_bar_active_color_index
  const initialActiveWidth = settings.tool_bar_active_weight_index
  const initialShowToolbar = settings.show_tool_bar
  const initialShowWhiteboard = settings.show_whiteboard
  const initialShowDrawingBorder = settings.show_drawing_border
  const initialShowCuteCursor = settings.show_cute_cursor
  const initialToolbarDefaultBrush = settings.tool_bar_default_brush
  const initialToolbarDefaultFigure = settings.tool_bar_default_figure
  const initialToolbarPosition = { x: settings.tool_bar_x, y: settings.tool_bar_y }
  const [initialMainColorIndex, initialSecondaryColorIndex] = settings.swap_colors_indexes
  const initialLaserTime = settings.laser_time
  const initialFadeDisappearAfterMs = settings.fade_disappear_after_ms
  const initialFadeOutDurationTimeMs = settings.fade_out_duration_time_ms

  const key_show_hide_toolbar       = settings.key_binding_show_hide_toolbar
  const key_show_hide_whiteboard    = settings.key_binding_show_hide_whiteboard
  const key_clear_desk              = settings.key_binding_clear_desk
  const key_binding_open_settings   = settings.key_binding_open_settings
  const key_binding_make_screenshot = settings.key_binding_make_screenshot

  let initialFigures = []



const TEMPLATE_POINTS = [
  // tail (goes into negative x)
  [-60, 0],
  [-40, 0],
  [-20, 0],

  // arrowHeadSetup (0..100)
    [0, 0],
    [25, 0],
    [48, 0],
    [55, -2],
    [58, -5],
    [55, -7],
    [48, -10],
    [0, -30],
    [0, -30],
    [0, -30],
    [93, -5],
    [98, -3],
    [100, 0],
    [100, 0],
    [100, 0],
    [98, 3],
    [93, 5],
    [25, 25],
    [18, 28],
];

const makeArrowFigure = (start, end, opts = {}) => {
  const [sx, sy] = start;
  const [ex, ey] = end;

  const dx = ex - sx;
  const dy = ey - sy;
  const targetLen = Math.hypot(dx, dy);

  if (targetLen === 0) {
    // Дегенеративний кейс — просто повернемо шаблон біля start
    return {
      id: opts.id ?? Date.now(),
      type: 'pen',
      colorIndex: opts.colorIndex ?? 1,
      widthIndex: opts.widthIndex ?? 0,
      rainbowColorDeg: (Math.random() * 360),
      points: [start, end],
    };
  }

  // Якір шаблону: "хвіст" = перша точка
  const [tx0, ty0] = TEMPLATE_POINTS[0];

  // "Голова" шаблону: точка найдальша від хвоста (стабільніше, ніж брати last)
  let headIdx = 0;
  let bestD2 = -1;
  for (let i = 0; i < TEMPLATE_POINTS.length; i++) {
    const [x, y] = TEMPLATE_POINTS[i];
    const ddx = x - tx0;
    const ddy = y - ty0;
    const d2 = ddx * ddx + ddy * ddy;
    if (d2 > bestD2) { bestD2 = d2; headIdx = i; }
  }
  const [txh, tyh] = TEMPLATE_POINTS[headIdx];

  const templateVecX = txh - tx0;
  const templateVecY = tyh - ty0;
  const templateLen = Math.hypot(templateVecX, templateVecY) || 1;

  const scale = targetLen / templateLen;

  // Кут повороту: templateVec -> targetVec
  const angTemplate = Math.atan2(templateVecY, templateVecX);
  const angTarget = Math.atan2(dy, dx);
  const ang = angTarget - angTemplate;

  const cos = Math.cos(ang);
  const sin = Math.sin(ang);

  const points = TEMPLATE_POINTS.map(([x, y]) => {
    // у координати відносно хвоста
    let px = x - tx0;
    let py = y - ty0;

    // масштаб
    px *= scale;
    py *= scale;

    // поворот
    const rx = px * cos - py * sin;
    const ry = px * sin + py * cos;

    // перенос у start
    return [Math.round(rx + sx), Math.round(ry + sy)];
  });

  return {
    id: Date.now(),
    type: 'pen',
    colorIndex: opts.colorIndex ?? 1,
    widthIndex: opts.widthIndex ?? 0,
    rainbowColorDeg: (Math.random() * 360),
    points,
  };
}




  if (process.env.NODE_ENV === 'development') {
    // const myPoints = [
    //   [120, 520], [140, 520], [160, 520], [180, 520], [200, 520], [220, 520],
    //   [240, 520], [260, 520], [280, 520], [300, 520], [320, 520], [340, 520],
    //   [360, 520], [380, 520], [400, 520], [420, 520], [440, 520], [460, 520],
    //   [440, 500], [460, 520], [440, 540]
    // ]

    initialFigures = [
      // { id: Date.now() + 0, type: 'arrow',     colorIndex: 1, widthIndex: 0, points: [[200, 200], [600, 200]], rainbowColorDeg: (Math.random() * 360) },
      // { id: Date.now() + 1, type: 'arrow',     colorIndex: 2, widthIndex: 1, points: [[200, 300], [600, 300]], rainbowColorDeg: (Math.random() * 360) },
      // { id: Date.now() + 2, type: 'arrow',     colorIndex: 3, widthIndex: 2, points: [[200, 400], [600, 400]], rainbowColorDeg: (Math.random() * 360) },
      // { id: Date.now() + 3, type: 'arrow',     colorIndex: 4, widthIndex: 3, points: [[200, 500], [600, 500]], rainbowColorDeg: (Math.random() * 360) },
      // { id: Date.now() + 1, type: 'line',      colorIndex: 0, widthIndex: 2, points: [[100, 200], [400, 200]], rainbowColorDeg: 250 },
      // { id: Date.now() + 2, type: 'rectangle', colorIndex: 0, widthIndex: 2, points: [[70, 150], [450, 250]],  rainbowColorDeg: (Math.random() * 360), ratio: 1 },
      // { id: Date.now() + 3, type: 'oval',      colorIndex: 0, widthIndex: 2, points: [[100, 300], [400, 450]], rainbowColorDeg: (Math.random() * 360), ratio: 1 },
      // { id: Date.now() + 4, type: 'text',      colorIndex: 2, widthIndex: 2, points: [[152, 118]],             rainbowColorDeg: (Math.random() * 360), text: 'Hello World', width: 400, height: 150, scale: 1 },



      // {
      //   id: 1771081297885,
      //   type: 'pen',
      //   colorIndex: 1,
      //   widthIndex: 0,
      //   rainbowColorDeg: 123.05765013683666,
      //   ratio: 1,
      //   points: [
      //     [89, 380],
      //     [91, 377],
      //     [101, 364],
      //     [107, 357],
      //     [118, 345],
      //     [128, 334],
      //     [137, 325],
      //     [148, 313],
      //     [160, 303],
      //     [170, 294],
      //     [175, 289],
      //     [179, 284],
      //     [183, 280],
      //     [186, 277],
      //     [188, 274],
      //     [190, 271],
      //     [191, 269],
      //     [191, 268],
      //     [191, 267],
      //     [191, 265],
      //     [190, 265],
      //     [188, 265],
      //     [185, 265],
      //     [181, 266],
      //     [176, 268],
      //     [171, 271],
      //     [163, 276],
      //     [160, 279],
      //     [158, 280],
      //     [156, 282],
      //     [154, 283],
      //     [153, 284],
      //     [154, 284],
      //     [158, 281],
      //     [164, 276],
      //     [171, 271],
      //     [188, 260],
      //     [202, 251],
      //     [207, 248],
      //     [211, 246],
      //     [214, 244],
      //     [217, 242],
      //     [220, 241],
      //     [223, 240],
      //     [222, 242],
      //     [220, 245],
      //     [217, 249],
      //     [209, 260],
      //     [205, 267],
      //     [202, 273],
      //     [198, 284],
      //     [194, 294],
      //     [193, 300],
      //     [191, 306],
      //     [190, 310],
      //     [189, 313],
      //     [189, 316],
      //     [189, 317]
      //   ]
      // },
      // {
      //   id: 1771081301451,
      //   type: 'pen',
      //   colorIndex: 1,
      //   widthIndex: 0,
      //   rainbowColorDeg: 123.05765013683666,
      //   ratio: 1,
      //   points: [
      //     [178, 413],
      //     [187, 406],
      //     [196, 398],
      //     [205, 391],
      //     [215, 380],
      //     [228, 368],
      //     [241, 355],
      //     [249, 347],
      //     [256, 339],
      //     [263, 331],
      //     [268, 324],
      //     [273, 318],
      //     [277, 312],
      //     [278, 310],
      //     [277, 309],
      //     [275, 310],
      //     [265, 315],
      //     [260, 318],
      //     [255, 321],
      //     [251, 325],
      //     [248, 328],
      //     [241, 334],
      //     [240, 335],
      //     [238, 336],
      //     [237, 337],
      //     [236, 338],
      //     [239, 335],
      //     [246, 327],
      //     [254, 319],
      //     [264, 310],
      //     [275, 301],
      //     [286, 293],
      //     [296, 285],
      //     [304, 280],
      //     [312, 274],
      //     [317, 270],
      //     [322, 267],
      //     [323, 266],
      //     [323, 268],
      //     [320, 272],
      //     [317, 277],
      //     [308, 289],
      //     [303, 296],
      //     [299, 302],
      //     [294, 310],
      //     [290, 316],
      //     [286, 321],
      //     [283, 327],
      //     [281, 332],
      //     [278, 338],
      //     [277, 340]
      //   ]
      // },


      { id: Date.now() + 1, type: 'arrow',     colorIndex: 1, widthIndex: 0, points: [[200, 500], [220, 500]], rainbowColorDeg: (Math.random() * 360) },
      { id: Date.now() + 2, type: 'arrow',     colorIndex: 1, widthIndex: 0, points: [[200, 530], [250, 530]], rainbowColorDeg: (Math.random() * 360) },
      { id: Date.now() + 3, type: 'arrow',     colorIndex: 1, widthIndex: 0, points: [[200, 560], [275, 560]], rainbowColorDeg: (Math.random() * 360) },
      { id: Date.now() + 4, type: 'arrow',     colorIndex: 1, widthIndex: 0, points: [[200, 590], [300, 590]], rainbowColorDeg: (Math.random() * 360) },

      { id: Date.now() + 5, type: 'arrow',     colorIndex: 1, widthIndex: 1, points: [[200, 620], [220, 620]], rainbowColorDeg: (Math.random() * 360) },
      { id: Date.now() + 6, type: 'arrow',     colorIndex: 1, widthIndex: 1, points: [[200, 650], [250, 650]], rainbowColorDeg: (Math.random() * 360) },
      { id: Date.now() + 7, type: 'arrow',     colorIndex: 1, widthIndex: 1, points: [[200, 680], [275, 680]], rainbowColorDeg: (Math.random() * 360) },
      { id: Date.now() + 8, type: 'arrow',     colorIndex: 1, widthIndex: 1, points: [[200, 710], [300, 710]], rainbowColorDeg: (Math.random() * 360) },

      { id: Date.now() + 9, type: 'arrow',     colorIndex: 1, widthIndex: 2, points: [[200, 740], [220, 740]], rainbowColorDeg: (Math.random() * 360) },
      { id: Date.now() + 10, type: 'arrow',     colorIndex: 1, widthIndex: 2, points: [[200, 770], [250, 770]], rainbowColorDeg: (Math.random() * 360) },
      { id: Date.now() + 11, type: 'arrow',     colorIndex: 1, widthIndex: 2, points: [[200, 800], [275, 800]], rainbowColorDeg: (Math.random() * 360) },
      { id: Date.now() + 12, type: 'arrow',     colorIndex: 1, widthIndex: 2, points: [[200, 830], [300, 830]], rainbowColorDeg: (Math.random() * 360) },

      { id: Date.now() + 13, type: 'arrow',     colorIndex: 1, widthIndex: 3, points: [[200, 860], [220, 860]], rainbowColorDeg: (Math.random() * 360) },
      { id: Date.now() + 14, type: 'arrow',     colorIndex: 1, widthIndex: 3, points: [[200, 890], [250, 890]], rainbowColorDeg: (Math.random() * 360) },
      { id: Date.now() + 15, type: 'arrow',     colorIndex: 1, widthIndex: 3, points: [[200, 920], [275, 920]], rainbowColorDeg: (Math.random() * 360) },
      { id: Date.now() + 16, type: 'arrow',     colorIndex: 1, widthIndex: 3, points: [[200, 950], [300, 950]], rainbowColorDeg: (Math.random() * 360) },



      { id: Date.now() + 17, type: 'arrow',     colorIndex: 1, widthIndex: 0, points: [[200, 1000], [800, 1000]], rainbowColorDeg: (Math.random() * 360) },
      { id: Date.now() + 18, type: 'arrow',     colorIndex: 1, widthIndex: 1, points: [[200, 1050], [800, 1050]], rainbowColorDeg: (Math.random() * 360) },
      { id: Date.now() + 19, type: 'arrow',     colorIndex: 1, widthIndex: 2, points: [[200, 1120], [800, 1120]], rainbowColorDeg: (Math.random() * 360) },
      { id: Date.now() + 20, type: 'arrow',     colorIndex: 1, widthIndex: 3, points: [[200, 1225], [800, 1225]], rainbowColorDeg: (Math.random() * 360) },







    ]

    initialFigures.push(makeArrowFigure([0, 0], [0, 0], { widthIndex: 0 }));
    initialFigures.push(makeArrowFigure([0, 0], [100, 0], { widthIndex: 0 }));
    initialFigures.push(makeArrowFigure([100, 200], [200, 200], { widthIndex: 0 }));
    initialFigures.push(makeArrowFigure([100, 250], [400, 250], { widthIndex: 0 }));
    initialFigures.push(makeArrowFigure([100, 300], [400, 300], { widthIndex: 0 }));

    TEMPLATE_POINTS.forEach((point, index) => {
      initialFigures.push({
        id: Date.now() + 6 + index,
        type: 'line',
        colorIndex: 2,
        widthIndex: 0,
        points: [[500 + point[0] * 4, 400 + point[1] * 4], [500 + point[0] * 4, 401 + point[1] * 4]],
        rainbowColorDeg: 250
      });
    });

  }

  const [rainbowColorDeg, updateRainbowColorDeg] = useState(initialColorDeg);
  const [mouseCoordinates, setMouseCoordinates] = useState({ x: 0, y: 0 });
  const [allFigures, setAllFigures] = useState(initialFigures);
  const [allLaserFigures, setLaserFigure] = useState([]);
  const [allEraserFigures, setEraserFigure] = useState([]);
  const [allFadeFigures, setFadeFigures] = useState([]);
  const [activeTool, setActiveTool] = useState(initialActiveTool);
  const [activeFigureInfo, setActiveFigureInfo] = useState(null);
  const [activeColorIndex, setActiveColorIndex] = useState(initialActiveColor);
  const [activeWidthIndex, setActiveWidthIndex] = useState(initialActiveWidth);
  const [isDrawing, setIsDrawing] = useState(false);
  const [textEditorContainer, setTextEditorContainer] = useState(null);
  const [cursorType, setCursorType] = useState('crosshair');
  const [showToolbar, setShowToolbar] = useState(initialShowToolbar);
  const [showWhiteboard, setShowWhiteboard] = useState(initialShowWhiteboard);
  const [toolbarLastActiveBrush, setToolbarLastActiveBrush] = useState(initialToolbarDefaultBrush);
  const [toolbarLastActiveFigure, setToolbarLastActiveFigure] = useState(initialToolbarDefaultFigure);
  const [toolbarPosition, setToolbarPosition] = useState(initialToolbarPosition);
  const [rippleEffects, setRippleEffects] = useState([]);
  const [undoStackFigures, setUndoStackFigures] = useState([]);
  const [redoStackFigures, setRedoStackFigures] = useState([]);
  const [clipboardFigure, setClipboardFigure] = useState(null);
  const [isShiftPressed, setIsShiftPressed] = useState(false);
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  const [isFadeDrawing, setIsFadeDrawing] = useState(false);
  const [showDrawingBorder, setShowDrawingBorder] = useState(initialShowDrawingBorder);
  const [showCuteCursor, setShowCuteCursor] = useState(initialShowCuteCursor);
  const [mainColorIndex, setMainColorIndex] = useState(initialMainColorIndex);
  const [secondaryColorIndex, setSecondaryColorIndex] = useState(initialSecondaryColorIndex);
  const [toastInfo, setToastInfo] = useState(null);
  const [fadeOpacity, setFadeOpacity] = useState(1.0);
  useEffect(() => {
    console.log('All Figures: ', allFigures);
  }, [allFigures]);
  useEffect(() => {
    window.electronAPI.onResetScreen(handleReset);
    window.electronAPI.onToggleToolbar(handleToggleToolbar);
    window.electronAPI.onToggleWhiteboard(handleToggleWhiteboard);
    window.electronAPI.onRefreshSettings(handleRefreshSettings);
    window.electronAPI.onShowNotification(handleShowNotification);
  }, []);

  const lastPasteAtRef = useRef(0);
  const lastEscapeAtRef = useRef(0);

  const handleKeyDown = useCallback((event) => {
    const eventKey = (event.key || '').toLowerCase();
    const eventCode = (event.code || '').toLowerCase();
    const ctrlOrMeta = event.ctrlKey || event.metaKey;
    const shiftKey = event.shiftKey;
    const eventRepeat = event.repeat;

    const direction = shiftKey ? -1 : 1;

    if (textEditorContainer) {
      return
    }

    if (eventKey === 'shift' && !eventRepeat) {
      setIsShiftPressed(true);
    }

    if (eventCode === 'space' && !eventRepeat) {
      setIsSpacePressed(true);
    }

    if (isDrawing || isActiveFigureMoving()) {
      return
    }

    // Dynamic keyboard shortcuts
    if (eventMatches(event, key_show_hide_toolbar)) {
      event.preventDefault();
      handleToggleToolbar();
      return
    }
    if (eventMatches(event, key_show_hide_whiteboard)) {
      event.preventDefault();
      handleToggleWhiteboard();
      return
    }
    if (eventMatches(event, key_clear_desk)) {
      event.preventDefault();
      handleReset();
      return
    }
    if (eventMatches(event, key_binding_open_settings)) {
      event.preventDefault();
      invokeOpenSettings();
      return
    }
    if (eventMatches(event, key_binding_make_screenshot)) {
      event.preventDefault();
      invokeMakeScreenshot();
      return
    }

    // Static keyboard shortcuts
    switch (eventKey) {
      case 'v': {
        if (ctrlOrMeta) {
          if (clipboardFigure) {
            const now = Date.now();
            if (now - lastPasteAtRef.current < pastCooldownMs) return;
            lastPasteAtRef.current = now;

            const { x, y } = mouseCoordinates;

            const newFigure = {
              ...clipboardFigure,
              id: Date.now(),
              points: moveToCoordinates(clipboardFigure, x, y),
            };

            setActiveFigureInfo({ id: newFigure.id, x, y });
            setAllFigures(prevAllFigures => [...prevAllFigures, newFigure]);

            setUndoStackFigures(prevUndoStack => [...prevUndoStack, { type: 'add', figures: [newFigure] }]);
            setRedoStackFigures([]);
          }
        }

        break;
      }
      case 'c': {
        if (ctrlOrMeta) {
          if (activeFigureInfo) {
            const activeFigure = findActiveFigure();

            setClipboardFigure({
              ...activeFigure,
              points: activeFigure.points.map(p => [...p]) // Avoid mutation
            });
          }
        }

        break;
      }
      case 'z': {
        if (ctrlOrMeta) {
          if (activeFigureInfo) {
            setActiveFigureInfo(null);
            break;
          }

          // REDO:
          if (shiftKey) {
            if (redoStackFigures.length > 0) {
              const lastAction = redoStackFigures.at(-1);
              let newActiveFigures

              if (lastAction.type === 'add') {
                newActiveFigures = [...allFigures, ...lastAction.figures];
              }

              if (lastAction.type === 'remove') {
                newActiveFigures = allFigures.filter(figure => !lastAction.figures.some(f => f.id === figure.id))
              }

              setAllFigures(newActiveFigures);
              setUndoStackFigures(prevUndoStack => [...prevUndoStack, lastAction]);
              setRedoStackFigures(prevRedoStack => prevRedoStack.slice(0, -1));
            }

            break;
          }

          // UNDO:
          if (undoStackFigures.length > 0) {
            const lastAction = undoStackFigures.at(-1);
            let newActiveFigures

            if (lastAction.type === 'add') {
              newActiveFigures = allFigures.filter(figure => !lastAction.figures.some(f => f.id === figure.id))
            }

            if (lastAction.type === 'remove') {
              newActiveFigures = [...allFigures, ...lastAction.figures];
            }

            setAllFigures(newActiveFigures);
            setUndoStackFigures(prevUndoStack => prevUndoStack.slice(0, -1));
            setRedoStackFigures(prevRedoStack => [...prevRedoStack, lastAction]);
          }
        }
        break;
      }
      case 'arrowleft':
      case 'arrowright':
      case 'arrowup':
      case 'arrowdown': {
        if (activeFigureInfo) {
          const activeFigure = findActiveFigure()

          let offset = 2;
          if (shiftKey) { offset *= 5 }

          const directionMap = {
            arrowleft:  [-offset, 0],
            arrowright: [offset, 0],
            arrowup:    [0, -offset],
            arrowdown:  [0, offset],
          };

          const [dx, dy] = directionMap[eventKey];

          activeFigure.points.forEach((point) => {
            point[0] += dx;
            point[1] += dy;
          });

          setAllFigures([...allFigures]);
        }
        break;
      }
      case 'delete':
      case 'backspace': {
        if (activeFigureInfo) {
          const figureToRemove = allFigures.find(figure => figure.id === activeFigureInfo.id);
          const newActiveFigures = allFigures.filter(figure => figure.id !== activeFigureInfo.id)

          setActiveFigureInfo(null);
          setAllFigures(newActiveFigures);

          setUndoStackFigures(prevUndoStack => [...prevUndoStack, { type: 'remove', figures: [figureToRemove] }]);
          setRedoStackFigures([]);
        }
        break;
      }
      case 'enter': {
        if (activeFigureInfo) {
          const activeFigure = findActiveFigure()

          if (activeFigure.type === 'text') {
            activateTextEditor(activeFigure);

            event.preventDefault();
          }
        }
        break;
      }
      case 'escape': {
        if (eventRepeat) break;

        if (activeFigureInfo) {
          setActiveFigureInfo(null);
          break;
        }

        const now = Date.now();
        if (now - lastEscapeAtRef.current < escDoubleTapMs) {
          lastEscapeAtRef.current = 0;
          invokeHideApp();
        } else {
          lastEscapeAtRef.current = now;
        }

        break;
      }
      case 'e': {
        handleChangeTool('eraser');
        break;
      }
      case 'x': {
        if (['eraser', 'laser'].includes(activeTool)) {
          break;
        }

        if (activeColorIndex !== mainColorIndex) {
          handleChangeColor(mainColorIndex);
          break;
        }

        if (activeColorIndex !== secondaryColorIndex) {
          handleChangeColor(secondaryColorIndex);
          break;
        }

        break;
      }
    }

    switch (eventCode) {
      case 'digit1': {
        let nextBrush = toolbarLastActiveBrush;

        if (activeTool === toolbarLastActiveBrush) {
          const activeBrushIndex = brushList.indexOf(activeTool);
          const nextBrushIndex = (activeBrushIndex + direction + brushList.length) % brushList.length;

          nextBrush = brushList[nextBrushIndex];
        }

        handleChangeTool(nextBrush);
        break;
      }
      case 'digit2': {
        let nextShape = toolbarLastActiveFigure;

        if (activeTool === toolbarLastActiveFigure) {
          const activeShapeIndex = shapeList.indexOf(activeTool);
          const nextShapeIndex = (activeShapeIndex + direction + shapeList.length) % shapeList.length;

          nextShape = shapeList[nextShapeIndex];
        }

        handleChangeTool(nextShape);
        break;
      }
      case 'digit3': {
        handleChangeTool('text');
        break;
      }
      case 'digit4': {
        handleChangeTool('highlighter');
        break;
      }
      case 'digit5': {
        handleChangeTool('laser');
        break;
      }
      case 'digit6': {
        handleChangeTool('eraser');
        break;
      }
      case 'digit7': {
        if (['eraser', 'laser'].includes(activeTool)) {
          break;
        }
        const nextColorIndex = (activeColorIndex + direction + colorList.length) % colorList.length;

        handleChangeColor(nextColorIndex);
        break;
      }
      case 'digit8': {
        const nextWidthIndex = (activeWidthIndex + direction + widthList.length) % widthList.length;

        handleChangeWidth(nextWidthIndex);
        break;
      }
    }
  }, [allFigures, undoStackFigures, redoStackFigures, clipboardFigure, isDrawing, activeFigureInfo, activeTool, activeColorIndex, activeWidthIndex, toolbarLastActiveBrush, toolbarLastActiveFigure, textEditorContainer, mouseCoordinates, mainColorIndex, secondaryColorIndex]);

  const handleKeyUp = useCallback((event) => {
    const eventKey = (event.key || '').toLowerCase();
    const eventCode = (event.code || '').toLowerCase();

    if (textEditorContainer) {
      return
    }

    if (eventKey === 'shift') {
      setIsShiftPressed(false);
    }

    if (eventCode === 'space') {
      setIsSpacePressed(false);

      event.preventDefault();
    }
  }, [textEditorContainer]);

  const parseAccelerator = (shortcut) => {
    if (!shortcut) return null
    if (shortcut === '[NULL]') return null

    const keyParts = shortcut.split('+')
    let mainKey = keyParts[keyParts.length - 1].toUpperCase();

    if (mainKey.length === 1 && mainKey >= '0' && mainKey <= '9') {
      mainKey = `DIGIT${mainKey}`;
    }

    return {
      wantMeta: keyParts.includes('Meta'),
      wantCtrl: keyParts.includes('Control'),
      wantAlt: keyParts.includes('Alt'),
      wantShift: keyParts.includes('Shift'),
      mainKey: mainKey,
    };
  }

  const eventMatches = (event, shortcut) => {
    const eventKey = (event.key || '').toUpperCase()
    const eventCode = (event.code || '').toUpperCase()
    const ctrlKey = event.ctrlKey
    const metaKey = event.metaKey
    const shiftKey = event.shiftKey
    const eventRepeat = event.repeat

    if (eventRepeat) return false;

    const accelOptions = parseAccelerator(shortcut);
    if (!accelOptions) return false;

    const pressedKey = eventCode.startsWith('DIGIT') ? eventCode : eventKey;

    return (
      (accelOptions.mainKey === pressedKey) &&
      (accelOptions.wantMeta === metaKey) &&
      (accelOptions.wantCtrl === ctrlKey) &&
      (accelOptions.wantShift === shiftKey) &&
      (accelOptions.wantAlt === event.altKey)
    )
  };

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleKeyDown, handleKeyUp]);

  const firstLaunch = useRef(true);
  useEffect(() => {
    if (firstLaunch.current) {
      firstLaunch.current = false;
      return;
    }

    if (activeTool === 'eraser') {
      return;
    }

    const debouncedUpdateSettings = debounce(() => {
      invokeSetSettings({
        show_whiteboard: showWhiteboard,
        show_tool_bar: showToolbar,
        tool_bar_active_tool: activeTool,
        tool_bar_active_color_index: activeColorIndex,
        tool_bar_active_weight_index: activeWidthIndex,
        tool_bar_default_brush: toolbarLastActiveBrush,
        tool_bar_default_figure: toolbarLastActiveFigure,
        tool_bar_x: toolbarPosition.x,
        tool_bar_y: toolbarPosition.y,
      });
    }, 300);

    debouncedUpdateSettings();

    return () => {
      debouncedUpdateSettings.cancel();
    };
  }, [showWhiteboard, showToolbar, activeTool, activeColorIndex, activeWidthIndex, toolbarLastActiveBrush, toolbarLastActiveFigure, toolbarPosition]);

  useEffect(() => {
    if (!activeFigureInfo) { return }

    const activeFigure = findActiveFigure();

    setActiveColorIndex(activeFigure.colorIndex)
    setActiveWidthIndex(activeFigure.widthIndex)
  }, [activeFigureInfo])

  const allLasersFiguresByRef = useRef(null)
  useEffect(() => {
    allLasersFiguresByRef.current = allLaserFigures;
  }, [allLaserFigures]);

  const allErasersFiguresByRef = useRef(null)
  useEffect(() => {
    allErasersFiguresByRef.current = allEraserFigures;
  }, [allEraserFigures]);

  const idleTimerRef = useRef(null);
  const fadeRafRef = useRef(null);
  const allFadeFiguresByRef = useRef(null)
  useEffect(() => {
    allFadeFiguresByRef.current = allFadeFigures;
  }, [allFadeFigures]);

  useEffect(() => {
    const fadePaused = isSpacePressed || isFadeDrawing;

    if (fadePaused) {
      resetFadeTimer();
    }

    if (!fadePaused && allFadeFiguresByRef.current.length > 0) {
      startIdleTimer();
    }
  }, [isSpacePressed, isFadeDrawing]);

  const startIdleTimer = () => {
    resetFadeTimer();

    idleTimerRef.current = setTimeout(() => {
      idleTimerRef.current = null;
      startFading();
    }, initialFadeDisappearAfterMs);
  }

  const resetFadeTimer = () => {
    setFadeOpacity(1.0);

    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
      idleTimerRef.current = null;
    }

    if (fadeRafRef.current) {
      cancelAnimationFrame(fadeRafRef.current);
      fadeRafRef.current = null;
    }
  }

  const getFadeOpacity = (elapsedMs, opacityDuration) => {
    let progress = 1 - (elapsedMs / opacityDuration);

    if (progress < 0) progress = 0; // clamp to 0..1
    if (progress > 1) progress = 1;

    return Math.round(progress * 100) / 100; // round to 0.01
  };

  const startFading = () => {
    const fadeStartAt = Date.now();
    let memoLastOpacity = null;

    const tick = () => {
      if (!fadeRafRef.current) return;

      const now = Date.now();
      const elapsedMs = now - fadeStartAt;
      const opacity = getFadeOpacity(elapsedMs, initialFadeOutDurationTimeMs)

      if (memoLastOpacity !== opacity) {
        memoLastOpacity = opacity;

        setFadeOpacity(opacity);
      }

      if (elapsedMs >= (initialFadeOutDurationTimeMs + fadeOutDestroyAfterMs)) {
        setFadeFigures([]);

        fadeRafRef.current = null;
        return;
      }

      fadeRafRef.current = requestAnimationFrame(tick);
    };

    fadeRafRef.current = requestAnimationFrame(tick);
  }

  const isActiveFigureMoving = () => {
    return activeFigureInfo && (activeFigureInfo.dragging || activeFigureInfo.resizing)
  }

  const findActiveFigure = () => {
    return allFigures.find((figure) => figure.id === activeFigureInfo.id);
  }

  const scheduleClearLaserTail = (id) => {
    // https://felixgerschau.com/react-hooks-settimeout/
    setTimeout(() => {
      const updatedLaserFigures = clearTail(id, allLasersFiguresByRef.current);

      setLaserFigure([...updatedLaserFigures])
    }, initialLaserTime)
  }

  const scheduleClearEraserTail = (id) => {
    setTimeout(() => {
      const updatedEraserFigures = clearTail(id, allErasersFiguresByRef.current);

      setEraserFigure([...updatedEraserFigures])
    }, eraserTime)
  }

  const clearTail = (id, figures) => {
    const figure = figures.find(figure => figure.id === id);
    if (figure) {
      figure.points.shift();
    }

    return figures
  }

  const handleChangeColor = (newColorIndex) => {
    if (activeFigureInfo) {
      const activeFigure = findActiveFigure()

      activeFigure.colorIndex = newColorIndex
    }

    setActiveColorIndex(newColorIndex);
    setAllFigures([...allFigures]);
  };

  const handleChangeWidth = (newWidthIndex) => {
    if (activeFigureInfo) {
      const activeFigure = findActiveFigure()

      activeFigure.widthIndex = newWidthIndex

      if (activeFigure.type === 'text') {
        const [width, height] = calculateCanvasTextWidth(activeFigure.text, activeFigure.widthIndex);

        activeFigure.width = width;
        activeFigure.height = height;
        activeFigure.scale = 1;
      }
    }

    setActiveWidthIndex(newWidthIndex);
    setAllFigures([...allFigures]);
  };

  const handleChangeTool = (toolName) => {
    if (activeTool === toolName) {
      return
    }

    setActiveFigureInfo(null);
    setActiveTool(toolName);

    if (brushList.includes(toolName)) {
      setToolbarLastActiveBrush(toolName);
    }

    if (shapeList.includes(toolName)) {
      setToolbarLastActiveFigure(toolName);
    }
  };

  const moveFigureToTop = (figureId) => {
    setAllFigures(figures => {
      const target = figures.find(figure => figure.id === figureId);
      if (!target) return figures;

      const others = figures.filter(figure => figure.id !== figureId);

      return [...others, target];
    });
  };

  const getFigureAtMousePosition = (x, y) => {
    return allFigures.findLast((figure) => isOnFigure(x, y, figure))
  };

  const getDotNameAtMousePosition = (x, y) => {
    const activeFigure = findActiveFigure()

    return getDotNameOnFigure(x, y, activeFigure)
  }

  const setMouseCursor = (x, y) => {
    if (activeFigureInfo) {
      const activeFigure = findActiveFigure()
      const resizingDotName = getDotNameAtMousePosition(x, y);

      if (resizingDotName) {
        setCursorType('move');
        return
      }

      if (isOverFigure(x, y, activeFigure)) {
        setCursorType('move');
        return
      }
    }

    if ([...brushList, ...shapeList, 'text'].includes(activeTool)) {
      const selectedFigure = getFigureAtMousePosition(x, y);

      if (selectedFigure) {
        setCursorType('move');
        return
      }
    }

    setCursorType('crosshair');
  };
  const setMouseCursorThrottle = throttle(setMouseCursor, 100);

  const eraseOnIntersection = (eraserFigure) => (prevFigures) => {
    let hasChanges = false;

    const updatedFigures = prevFigures.map((figure) => {
      if (!figure.erased && areFiguresIntersecting(eraserFigure, figure)) {
        hasChanges = true;
        return { ...figure, erased: true };
      }
      return figure;
    });

    return hasChanges ? updatedFigures : prevFigures;
  };

  const eraseFiguresOnIntersection = (eraserFigure) => {
    setAllFigures(eraseOnIntersection(eraserFigure));
    setFadeFigures(eraseOnIntersection(eraserFigure));
  }

  const handleMouseDown = ({ x, y }) => {
    // Diactivate text editor
    if (textEditorContainer) {
      setTextEditorContainer({ ...textEditorContainer, isActive: false });
    }

    // With Active Figure
    if (activeFigureInfo) {
      // Click on dots of the active figure
      const activeFigure = findActiveFigure()
      const resizingDotName = getDotNameAtMousePosition(x, y);

      if (resizingDotName) {
        setActiveFigureInfo({ ...activeFigureInfo, resizing: true, resizingDotName: resizingDotName });
        return;
      }

      if (isOverFigure(x, y, activeFigure)) {
        setActiveFigureInfo({ ...activeFigureInfo, dragging: true, x, y });
        return;
      }

      // Diactivate active figure
      setActiveFigureInfo(null);
    }

    // Click on the figure
    if ([...brushList, ...shapeList, 'text'].includes(activeTool)) {
      const selectedFigure = getFigureAtMousePosition(x, y);

      if (selectedFigure) {
        moveFigureToTop(selectedFigure.id)
        setActiveFigureInfo({ id: selectedFigure.id, dragging: true, x, y });
        return;
      }
    }

    if (activeTool === 'laser') {
      let laserFigure = {
        id: Date.now(),
        type: 'laser',
        widthIndex: activeWidthIndex,
        points: [[x, y]],
      };

      setLaserFigure([...allLaserFigures, laserFigure]);
      scheduleClearLaserTail(laserFigure.id)
      setIsDrawing(true);
      return;
    }

    if (activeTool === 'eraser') {
      let eraserFigure = {
        id: Date.now(),
        type: 'eraser',
        widthIndex: activeWidthIndex,
        points: [[x, y]],
      };

      eraseFiguresOnIntersection(eraserFigure);
      setEraserFigure([...allEraserFigures, eraserFigure]);
      scheduleClearEraserTail(eraserFigure.id)
      setIsDrawing(true);
      return;
    }

    if (activeTool === 'text') {
      if (!textEditorContainer) {
        const newTextEditor = {
          id: Date.now(),
          isActive: true,
          startAt: [x, y],
          colorIndex: activeColorIndex,
          widthIndex: activeWidthIndex,
          rainbowColorDeg: rainbowColorDeg,
          text: '',
          scale: 1,
        };

        setTextEditorContainer(newTextEditor);
      }

      return;
    }

    let newFigure = {
      id: Date.now(),
      type: activeTool,
      colorIndex: activeColorIndex,
      widthIndex: activeWidthIndex,
      points: [[x, y]],
      rainbowColorDeg: rainbowColorDeg,
      ratio: 1,
    };

    if (shapeList.includes(newFigure.type)) {
      newFigure.points.push([x, y]);
    }

    if (activeTool === 'fadepen') {
      setIsFadeDrawing(true);
      setFadeFigures(prevFadeFigures => [...prevFadeFigures, newFigure]);
      setIsDrawing(true);
      return;
    }

    setAllFigures(prevAllFigures => [...prevAllFigures, newFigure]);
    setIsDrawing(true);
  };

  const handleMouseMove = ({ x, y }) => {
    if (isActiveFigureMoving()) {
      const activeFigure = findActiveFigure()

      if (activeFigureInfo.dragging) {
        dragFigure(activeFigure, { x: activeFigureInfo.x, y: activeFigureInfo.y }, { x, y })
      }

      if (activeFigureInfo.resizing) {
        resizeFigure(activeFigure, activeFigureInfo.resizingDotName, { x, y, isShiftPressed })
      }

      setActiveFigureInfo({ ...activeFigureInfo, x, y });
      setAllFigures([...allFigures]);
      return
    }

    if (isDrawing) {
      if (activeTool === 'laser') {
        const currentLaser = allLaserFigures[allLaserFigures.length - 1];

        currentLaser.points = [...currentLaser.points, [x, y]];

        setLaserFigure([...allLaserFigures]);
        scheduleClearLaserTail(currentLaser.id)
        return;
      }

      if (activeTool === 'eraser') {
        const currentEraser = allEraserFigures[allEraserFigures.length - 1];

        currentEraser.points = [...currentEraser.points, [x, y]];

        eraseFiguresOnIntersection(currentEraser);
        setEraserFigure([...allEraserFigures]);
        scheduleClearEraserTail(currentEraser.id)
        return;
      }

      if (activeTool === 'fadepen') {
        const currentFigure = allFadeFigures[allFadeFigures.length - 1];

        currentFigure.points = [...currentFigure.points, [x, y]];

        setFadeFigures([...allFadeFigures]);
        return;
      }

      if (['pen', 'highlighter'].includes(activeTool)) {
        const currentFigure = allFigures[allFigures.length - 1];

        currentFigure.points = [...currentFigure.points, [x, y]];

        setAllFigures([...allFigures]);
        return
      }

      if (shapeList.includes(activeTool)) {
        const currentFigure = allFigures[allFigures.length - 1];

        if (isShiftPressed) {
          if (['line', 'arrow'].includes(currentFigure.type)) {
            const startPoint = currentFigure.points[0];

            const result = applySoftSnap(startPoint[0], startPoint[1], x, y);
            x = result.x;
            y = result.y;
          }

          if (['rectangle', 'oval'].includes(currentFigure.type)) {
            const startPoint = currentFigure.points[0];

            const result = applyAspectRatioLock(startPoint[0], startPoint[1], x, y, currentFigure.ratio);
            x = result.x;
            y = result.y;
          }
        }

        currentFigure.points[1] = [x, y];

        setAllFigures([...allFigures]);
        return
      }
    }

    setMouseCursorThrottle(x, y)
  };

  const handleMouseUp = ({ x, y }) => {
    if (isDrawing) {
      const upPoint = [x, y];

      if (activeTool === 'laser') {
        const currentLaser = allLaserFigures[allLaserFigures.length - 1];
        const amountOfPoints = currentLaser.points.length;

        let laserDistance = 0;
        if (amountOfPoints > 0) {
          laserDistance = distanceBetweenPoints(currentLaser.points[0], upPoint);
        }

        if (laserDistance < minObjectDistance && amountOfPoints < 10) {
          const ripple = {
            id: Date.now(),
            points: upPoint,
          };

          setRippleEffects([...rippleEffects, ripple]);

          currentLaser.points = [];
          setLaserFigure([...allLaserFigures]);
        }
      }

      if (activeTool === 'eraser') {
        const figuresToRemove = allFigures.filter(figure => figure.erased).map(figure => ({ ...figure, erased: false }));
        const fadeFiguresToRemove = allFadeFigures.filter(figure => figure.erased).map(figure => ({ ...figure, erased: false }));

        if (figuresToRemove.length > 0) {
          setUndoStackFigures(prevUndoStack => [...prevUndoStack, { type: 'remove', figures: figuresToRemove }]);
          setRedoStackFigures([]);

          setAllFigures(allFigures.filter(figure => !figure.erased));
        }

        if (fadeFiguresToRemove.length > 0) {
          setFadeFigures(allFadeFigures.filter(figure => !figure.erased));
        }
      }

      if (activeTool === 'highlighter') {
        const currentFigure = allFigures.at(-1);

        setUndoStackFigures(prevUndoStack => [...prevUndoStack, { type: 'add', figures: [currentFigure] }]);
        setRedoStackFigures([]);
      }

      if (activeTool === 'fadepen') {
        const currentFigure = allFadeFigures.at(-1);

        if (colorList[currentFigure.colorIndex].name !== 'color_rainbow') {
          currentFigure.points = [...filterClosePoints(currentFigure.points, currentFigure.widthIndex)];
        }

        setFadeFigures([...allFadeFigures]);
        setIsFadeDrawing(false);
      }

      if (activeTool === 'pen') {
        const currentFigure = allFigures.at(-1);

        if (colorList[currentFigure.colorIndex].name !== 'color_rainbow') {
          currentFigure.points = [...filterClosePoints(currentFigure.points, currentFigure.widthIndex)];
        }

        setUndoStackFigures(prevUndoStack => [...prevUndoStack, { type: 'add', figures: [currentFigure] }]);
        setRedoStackFigures([]);

        setAllFigures([...allFigures]);
      }

      if (shapeList.includes(activeTool)) {
        const currentFigure = allFigures.at(-1);
        const shapeDistance = distanceBetweenPoints(currentFigure.points[0], upPoint);

        if (['rectangle', 'oval'].includes(currentFigure.type)) {
          currentFigure.ratio = calculateAspectRatio(currentFigure);
        }

        if (shapeDistance < minObjectDistance) {
          setAllFigures(allFigures => allFigures.slice(0, -1));
        } else {
          setUndoStackFigures(prevUndoStack => [...prevUndoStack, { type: 'add', figures: [currentFigure] }]);
          setRedoStackFigures([]);
          setAllFigures([...allFigures]);
        }
      }
    }

    if (isActiveFigureMoving()) {
      const activeFigure = findActiveFigure()

      if (activeFigureInfo.resizing) {
        if (['rectangle', 'oval'].includes(activeFigure.type)) {
          activeFigure.ratio = calculateAspectRatio(activeFigure);

          setAllFigures([...allFigures]);
        }
      }

      setActiveFigureInfo({ id: activeFigureInfo.id });
    }

    setIsDrawing(false);
  };

  const handleDoubleClick = ({ x, y }) => {
    if (activeFigureInfo) {
      const activeFigure = findActiveFigure()

      if (activeFigure.type === 'text') {
        activateTextEditor(activeFigure);
      }
    }
  };

  const handleMousePosition = (event) => {
    setMouseCoordinates(getMouseCoordinates(event));
  }

  const handleContextMenu = (_event) => {
    invokeHideApp();
  }

  const handleCloseToolBar = () => {
    invokeHideApp();
  }

  const invokeOpenSettings = () => {
    console.log('Renderer -> Main: Invoke Open Settings');

    window.electronAPI.invokeOpenSettings();
  }

  const invokeMakeScreenshot = () => {
    console.log('Renderer -> Main: Invoke Make Screenshot');

    window.electronAPI.invokeMakeScreenshot();
  }

  const invokeOpenNotification = (info) => {
    console.log('Renderer -> Main: Invoke Open Notification');

    window.electronAPI.invokeOpenNotification(info);
  }

  const invokeHideApp = () => {
    console.log('Renderer -> Main: Invoke Hide App');

    window.electronAPI.invokeHideApp();
  }

  const handleReset = () => {
    console.log('Main -> Renderer: Handle Reset');

    setIsDrawing(false);
    setActiveFigureInfo(null);
    setAllFigures([]);
    setFadeFigures([]);
    resetFadeTimer();
    setLaserFigure([]);
    setEraserFigure([]);
    setRippleEffects([]);
    setTextEditorContainer(null);
    setUndoStackFigures([]);
    setRedoStackFigures([]);
    setClipboardFigure(null);
  };

  const handleToggleToolbar = () => {
    console.log('Main -> Renderer: Toggle Toolbar');

    setShowToolbar((prevShowToolbar) => !prevShowToolbar);
  };

  const handleToggleWhiteboard = () => {
    console.log('Main -> Renderer: Toggle Whiteboard');

    setShowWhiteboard((prevShowWhiteboard) => !prevShowWhiteboard);
  };

  const handleRefreshSettings = (_, newSettings) => {
    console.log('Main -> Renderer: Refresh Settings');

    setShowDrawingBorder(newSettings.show_drawing_border);
    setShowCuteCursor(newSettings.show_cute_cursor);
    setMainColorIndex(newSettings.swap_colors_indexes[0]);
    setSecondaryColorIndex(newSettings.swap_colors_indexes[1]);
  };

  const handleShowNotification = (_, data) => {
    console.log('Main -> Renderer: Show Notification');

    setToastInfo({
      title: data.title,
      body: data.body,
      button_label: data.button_label,
      button_action: data.button_action,
      button_data: data.button_data
    });
  };

  const invokeSetSettings = (settings) => {
    console.log('Renderer -> Main: Invoke Set Settings');

    window.electronAPI.invokeSetSettings(settings);
  };

  const handleToastClicked = () => {
    invokeOpenNotification({
      action: toastInfo.button_action,
      data: toastInfo.button_data,
    });

    setToastInfo(null);
  };

  const handleTextEditorBlur = (text) => {
    const cleanedText = text.replace(/[\s\u200B\u200C\u200D\uFEFF]+$/g, ''); // прибираємо сміття з кінця

    if (cleanedText === '') {
      setTextEditorContainer(null);
      return;
    }

    const [width, height] = calculateCanvasTextWidth(cleanedText, activeWidthIndex);

    const textFigure = {
      id: Date.now(),
      type: 'text',
      colorIndex: textEditorContainer.colorIndex,
      widthIndex: textEditorContainer.widthIndex,
      rainbowColorDeg: textEditorContainer.rainbowColorDeg,
      text: cleanedText,
      points: [textEditorContainer.startAt],
      scale: textEditorContainer.scale,
      width: width,
      height: height,
    };

    setAllFigures([...allFigures, textFigure]);
    setTextEditorContainer(null);

    setUndoStackFigures(prevUndoStack => [...prevUndoStack, { type: 'add', figures: [textFigure] }]);
    setRedoStackFigures([]);
  };

  const activateTextEditor = (pickedFigure) => {
    const newTextEditor = {
      isActive: true,
      startAt: pickedFigure.points[0],
      colorIndex: pickedFigure.colorIndex,
      widthIndex: pickedFigure.widthIndex,
      rainbowColorDeg: pickedFigure.rainbowColorDeg,
      text: pickedFigure.text,
      scale: pickedFigure.scale,
    };

    setTextEditorContainer(newTextEditor);
    setActiveFigureInfo(null);
    setAllFigures(allFigures.filter(figure => figure.id !== pickedFigure.id));

    setUndoStackFigures(prevUndoStack => [...prevUndoStack, { type: 'remove', figures: [pickedFigure] }]);
    setRedoStackFigures([]);
  }

  const manipulation = (isDrawing || isActiveFigureMoving()) ? "manipulation_mode" : "";

  return (
    <div id="root_wrapper" className={manipulation} onPointerMove={handleMousePosition} onContextMenu={handleContextMenu}>

      {
        showDrawingBorder &&
        <div id="zone_borders"></div>
      }

      {
        toastInfo &&
          <Toast
            info={toastInfo}
            handleToastClicked={handleToastClicked}
          />
      }

      {
        showWhiteboard &&
        <div id="whiteboard"></div>
      }

      {
        rippleEffects &&
          <RippleEffect
            rippleEffects={rippleEffects}
          />
      }

      {
        textEditorContainer &&
          <TextEditor
            textEditorContainer={textEditorContainer}
            handleTextEditorBlur={handleTextEditorBlur}
          />
      }

      {
        showCuteCursor &&
          <CuteCursor
            mouseCoordinates={mouseCoordinates}
            activeColorIndex={activeColorIndex}
            activeWidthIndex={activeWidthIndex}
            activeTool={activeTool}
            Icons={Icons}
          />
      }

      <DrawDesk
        allFigures={allFigures}
        allFadeFigures={allFadeFigures}
        allLaserFigures={allLaserFigures}
        allEraserFigures={allEraserFigures}
        fadeOpacity={fadeOpacity}
        activeFigureInfo={activeFigureInfo}
        cursorType={cursorType}
        handleMouseDown={handleMouseDown}
        handleMouseMove={handleMouseMove}
        handleMouseUp={handleMouseUp}
        handleDoubleClick={handleDoubleClick}
        updateRainbowColorDeg={updateRainbowColorDeg}
        activeTool={activeTool}
        handleChangeTool={handleChangeTool}
      />

      {
        showToolbar &&
          <ToolBar
            position={toolbarPosition}
            setPosition={setToolbarPosition}
            lastActiveBrush={toolbarLastActiveBrush}
            lastActiveFigure={toolbarLastActiveFigure}
            activeTool={activeTool}
            activeColorIndex={activeColorIndex}
            activeWidthIndex={activeWidthIndex}
            handleCloseToolBar={handleCloseToolBar}
            handleChangeColor={handleChangeColor}
            handleChangeWidth={handleChangeWidth}
            handleChangeTool={handleChangeTool}
            Icons={Icons}
          />
      }
    </div>
  );
};

export default Application;
