import './Application.scss';

import React, { useCallback, useState, useEffect, useLayoutEffect, useRef } from 'react';
import { throttle, debounce } from 'lodash';
import DrawDesk from './components/DrawDesk.js';
import ToolBar from './components/ToolBar.js';
import FigureToolbar from './components/FigureToolbar.js';
import CuteCursor from './components/CuteCursor.js';
import RippleEffect from './components/RippleEffect.js';
import Toast from './components/Toast.js';
import TextEditor from './components/TextEditor.js';
import Whiteboard from './components/Whiteboard.js';
import ZoomLayer from './components/ZoomLayer.js';
import ZoomBackground from './components/ZoomBackground.js';
import {
  filterClosePoints,
  getMouseCoordinates,
  distanceBetweenPoints,
  calculateCanvasTextWidth,
  calculateCanvasWrappedTextHeight,
  applySoftSnap,
  applyAspectRatioLock,
} from './utils/general.js';
import {
  isOnFigure,
  isOnTextAutoResizeHandle,
  isOverFigure,
  areFiguresIntersecting,
  getDotNameOnFigure,
  getSideNameOnFigure,
  getDotOffsetCoordinates,
  getSideOffsetCoordinates,
  getSidePointName,
  dragFigure,
  resizeFigure,
  moveToCoordinates,
  calculateAspectRatio,
} from './utils/figureDetection.js';
import { FaPaintBrush, FaPencilAlt, FaHighlighter, FaRegSquare, FaRegCircle, FaArrowRight, FaLongArrowAltRight, FaEraser, FaRegTrashAlt, FaAngleLeft, FaAngleRight } from "react-icons/fa";
import { AiOutlineLine } from "react-icons/ai";
import { GiLaserburn } from "react-icons/gi";
import { MdOutlineClose } from "react-icons/md";
import { FaFont } from "react-icons/fa6";
import { LuSquareMousePointer } from "react-icons/lu";
import FaMagicPencilAlt from "./components/icons/FaMagicPencilAlt.js";
import FaRegDiamond from "./components/icons/FaRegDiamond.js";

import {
  fadeOutDestroyAfterMs,
  eraserTime,
  penVariantList,
  drawingToolList,
  shapeList,
  arrowVariantList,
  createApplicationColorList,
  widthList,
  minObjectDistance,
  pastCooldownMs,
  escDoubleTapMs,
  updateStoreDelay,
  initialZoomIndex,
} from './constants.js';

const Icons = {
  DrawModeEnabled: LuSquareMousePointer,
  Close: MdOutlineClose,
  Brush: FaPaintBrush,
  Pen: FaPencilAlt,
  MagicPen: FaMagicPencilAlt,
  Arrow: FaArrowRight,
  FlatArrow: FaLongArrowAltRight,
  Rectangle: FaRegSquare,
  Diamond: FaRegDiamond,
  Oval: FaRegCircle,
  Line: AiOutlineLine,
  Text: FaFont,
  Highlighter: FaHighlighter,
  Laser: GiLaserburn,
  Eraser: FaEraser,
  Trash: FaRegTrashAlt,
  AngleLeft: FaAngleLeft,
  AngleRight: FaAngleRight,
};

const Application = (settings) => {
  // console.log('App render');

  const initialColorDeg = Math.random() * 360
  const initialActiveTool = settings.tool_bar_active_tool
  const initialActiveColor = settings.tool_bar_active_color_index
  const initialActiveWidth = settings.tool_bar_active_weight_index
  const initialShowToolbar = settings.show_tool_bar
  const initialShowWhiteboard = settings.show_whiteboard
  const initialWhiteboardTheme = settings.whiteboard_color
  const initialWhiteboardLayout = settings.whiteboard_layout
  const initialWhiteboardOpacity = settings.whiteboard_opacity
  const initialWhiteboardStyle = settings.whiteboard_style
  const initialWhiteboardSpacing = settings.whiteboard_spacing
  const initialShowDrawingBorder = settings.show_drawing_border
  const initialCuteCursorMode = settings.cute_cursor_mode
  const initialPenSmoothing = settings.pen_smoothing
  const initialClearDrawingsOnHide = settings.clear_drawings_on_hide
  const initialToolbarDefaultBrush = settings.tool_bar_default_brush
  const initialToolbarDefaultFigure = settings.tool_bar_default_figure
  const initialToolbarOrientation = settings.tool_bar_orientation
  const initialToolbarCollapsed = settings.tool_bar_collapsed
  const initialToolbarPosition = { x: settings.tool_bar_x, y: settings.tool_bar_y }
  const [initialMainColorIndex, initialSecondaryColorIndex] = settings.swap_colors_indexes
  const initialLaserTime = settings.laser_time
  const initialFadeDisappearAfterMs = settings.fade_disappear_after_ms
  const initialFadeOutDurationTimeMs = settings.fade_out_duration_time_ms
  const initialLastActivePen = [initialActiveTool, initialToolbarDefaultBrush].find(tool => penVariantList.includes(tool)) || penVariantList[0]
  const initialLastActiveArrow = [initialActiveTool, initialToolbarDefaultFigure].find(tool => arrowVariantList.includes(tool)) || arrowVariantList[0]

  const key_show_hide_toolbar       = settings.key_binding_show_hide_toolbar
  const key_show_hide_whiteboard    = settings.key_binding_show_hide_whiteboard
  const key_clear_desk              = settings.key_binding_clear_desk
  const key_binding_open_settings   = settings.key_binding_open_settings
  const key_binding_make_screenshot = settings.key_binding_make_screenshot
  const key_binding_start_zoom      = settings.key_binding_start_zoom

  let initialFigures = []

  if (process.env.NODE_ENV === 'development') {
    initialFigures = [
      { id: Date.now() + 0, type: 'arrow',     colorIndex: 0, widthIndex: 2, points: [[100, 100], [400, 100]], rainbowColorDeg: (Math.random() * 360) },
      { id: Date.now() + 1, type: 'line',      colorIndex: 0, widthIndex: 2, points: [[100, 200], [400, 200]], rainbowColorDeg: 250 },
      { id: Date.now() + 2, type: 'rectangle', colorIndex: 0, widthIndex: 2, points: [[70, 150], [450, 250]],  rainbowColorDeg: (Math.random() * 360), ratio: 1, strokeIndex: 1 },
      { id: Date.now() + 3, type: 'oval',      colorIndex: 0, widthIndex: 3, points: [[100, 300], [400, 450]], rainbowColorDeg: (Math.random() * 360), ratio: 1 },
      { id: Date.now() + 4, type: 'text',      colorIndex: 2, widthIndex: 2, points: [[152, 118]],             rainbowColorDeg: (Math.random() * 360), text: 'Hello World', width: 400, height: 150, scale: 1 },
    ]
  }

  const [colorList, setColorList] = useState(() => createApplicationColorList(settings.tool_bar_color_palette));
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
  const [whiteboardTheme, setWhiteboardTheme] = useState(initialWhiteboardTheme);
  const [whiteboardLayout, setWhiteboardLayout] = useState(initialWhiteboardLayout);
  const [whiteboardOpacity, setWhiteboardOpacity] = useState(initialWhiteboardOpacity);
  const [whiteboardPatternStyle, setWhiteboardPatternStyle] = useState(initialWhiteboardStyle);
  const [whiteboardSpacing, setWhiteboardSpacing] = useState(initialWhiteboardSpacing);
  const [toolbarLastActiveBrush, setToolbarLastActiveBrush] = useState(initialToolbarDefaultBrush);
  const [toolbarLastActiveFigure, setToolbarLastActiveFigure] = useState(initialToolbarDefaultFigure);
  const [lastActivePen, setLastActivePen] = useState(initialLastActivePen);
  const [lastActiveArrow, setLastActiveArrow] = useState(initialLastActiveArrow);
  const [toolbarCollapsed, setToolbarCollapsed] = useState(initialToolbarCollapsed);
  const [toolbarPosition, setToolbarPosition] = useState(initialToolbarPosition);
  const [toolbarSlide, setToolbarSlide] = useState('main-slide');
  const [rippleEffects, setRippleEffects] = useState([]);
  const [undoStackFigures, setUndoStackFigures] = useState([]);
  const [redoStackFigures, setRedoStackFigures] = useState([]);
  const [clipboardFigure, setClipboardFigure] = useState(null);
  const [isShiftPressed, setIsShiftPressed] = useState(false);
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  const [isFadeDrawing, setIsFadeDrawing] = useState(false);
  const [showDrawingBorder, setShowDrawingBorder] = useState(initialShowDrawingBorder);
  const [cuteCursorMode, setCuteCursorMode] = useState(initialCuteCursorMode);
  const [isDocumentVisible, setIsDocumentVisible] = useState(true);
  const [penSmoothing, setPenSmoothing] = useState(initialPenSmoothing);
  const [clearDrawingsOnHide, setClearDrawingsOnHide] = useState(initialClearDrawingsOnHide);
  const [mainColorIndex, setMainColorIndex] = useState(initialMainColorIndex);
  const [secondaryColorIndex, setSecondaryColorIndex] = useState(initialSecondaryColorIndex);
  const [showScreenshotFlash, setShowScreenshotFlash] = useState(false);
  const [zoomInfo, setZoomInfo] = useState({ status: 'inactive' }); // 'inactive', 'capturing', 'zooming', 'drawing', 'resuming', 'exiting'
  const [toastInfo, setToastInfo] = useState(null);
  const [fadeOpacity, setFadeOpacity] = useState(1.0);

  const drawingInProgressRef = useRef(false);
  useLayoutEffect(() => {
    drawingInProgressRef.current = isDrawing || isActiveFigureMoving();
  }, [isDrawing, activeFigureInfo]);

  useEffect(() => {
    window.electronAPI.onResetScreen(handleReset);
    window.electronAPI.onToggleToolbar(handleToggleToolbar);
    window.electronAPI.onToggleWhiteboard(handleToggleWhiteboard);
    window.electronAPI.onRefreshSettings(handleRefreshSettings);
    window.electronAPI.onUpdateToolbarPosition(handleUpdateToolbarPosition);
    window.electronAPI.onScreenshotFlash(handleScreenshotFlash);
    window.electronAPI.onShowNotification(handleShowNotification);
    window.electronAPI.onPrepareZoomCapture(handlePrepareZoomCapture);
    window.electronAPI.onShowZoom(handleShowZoom);
    window.electronAPI.onRequestExitZoom(handleRequestExitZoom);
    window.electronAPI.onStopZoom(handleStopZoom);
  }, []);

  const lastPasteAtRef = useRef(0);
  const lastEscapeAtRef = useRef(0);
  const lastZoomShortcutAtRef = useRef(0);

  useEffect(() => {
    if (zoomInfo.status !== 'capturing') return;

    // Capture only after a frame without drawings or UI has been rendered.
    let frameId = requestAnimationFrame(() => {
      frameId = requestAnimationFrame(() => {
        window.electronAPI.invokeCaptureZoomImage();
      });
    });

    return () => {
      cancelAnimationFrame(frameId);
    };
  }, [zoomInfo.status]);

  const handleKeyDown = useCallback((event) => {
    if (zoomInfo.status === 'capturing' || zoomInfo.status === 'exiting') {
      event.preventDefault();
      return;
    }

    const eventKey = (event.key || '').toLowerCase();
    const eventCode = (event.code || '').toLowerCase();
    const ctrlOrMeta = event.ctrlKey || event.metaKey;
    const shiftKey = event.shiftKey;
    const eventRepeat = event.repeat;

    const direction = shiftKey ? -1 : 1;

    const getNextVariant = (variantList, activeVariant, direction = 1) => {
      const activeVariantIndex = variantList.indexOf(activeVariant);

      if (activeVariantIndex === -1) {
        return variantList[0];
      }

      return variantList[(activeVariantIndex + direction + variantList.length) % variantList.length];
    };

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

    if (eventMatches(event, key_binding_start_zoom)) {
      event.preventDefault();
      handleToggleZoom();
      return
    }

    if (zoomInfo.status === 'zooming' || zoomInfo.status === 'resuming') {
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
    if (ctrlOrMeta && !['c', 'v', 'z', 'd', 'x'].includes(eventKey)) {
      return
    }

    if (eventCode === 'keyx' && !ctrlOrMeta) {
      if (['eraser', 'laser'].includes(activeTool)) {
        return;
      }

      if (activeColorIndex !== mainColorIndex) {
        handleChangeColor(mainColorIndex);
        return;
      }

      if (activeColorIndex !== secondaryColorIndex) {
        handleChangeColor(secondaryColorIndex);
        return;
      }

      return;
    }

    // Static keyboard shortcuts
    switch (eventKey) {
      case 'v': {
        if (ctrlOrMeta) {
          if (eventRepeat) break;

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
          if (eventRepeat) break;

          handleCopyActiveFigure();
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
      case 'x': {
        if (ctrlOrMeta) {
          if (eventRepeat) break;

          handleCopyActiveFigure();
          handleDeleteActiveFigure();
        }

        break;
      }
      case 'd': {
        if (ctrlOrMeta) {
          if (eventRepeat) break;

          if (activeFigureInfo) {
            const now = Date.now();
            if (now - lastPasteAtRef.current < pastCooldownMs) return;
            lastPasteAtRef.current = now;

            const activeFigure = findActiveFigure();

            const newFigure = {
              ...activeFigure,
              id: Date.now(),
              points: activeFigure.points.map(([x, y]) => [x + 10, y + 10]),
            };

            setActiveFigureInfo({ id: newFigure.id });
            setAllFigures(prevAllFigures => [...prevAllFigures, newFigure]);

            setUndoStackFigures(prevUndoStack => [...prevUndoStack, { type: 'add', figures: [newFigure] }]);
            setRedoStackFigures([]);
          }

          break;
        }

        handleChangeTool('diamond');
        break;
      }
      case 'b': {
        handleChangeTool('brush');
        break;
      }
      case 'p': {
        if (penVariantList.includes(activeTool)) {
          handleChangeTool(getNextVariant(penVariantList, activeTool));
        } else {
          handleChangeTool(lastActivePen);
        }
        break;
      }
      case 'a': {
        if (arrowVariantList.includes(activeTool)) {
          handleChangeTool(getNextVariant(arrowVariantList, activeTool));
        } else {
          handleChangeTool(lastActiveArrow);
        }
        break;
      }
      case 'r': {
        handleChangeTool('rectangle');
        break;
      }
      case 'o': {
        handleChangeTool('oval');
        break;
      }
      case 't': {
        handleChangeTool('text');
        break;
      }
      case 'h': {
        handleChangeTool('highlighter');
        break;
      }
      case 'l': {
        handleChangeTool('laser');
        break;
      }
      case 'e': {
        handleChangeTool('eraser');
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
        handleDeleteActiveFigure();
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

        if (toolbarSlide !== 'main-slide') {
          setToolbarSlide('main-slide');
          break;
        }

        if (zoomInfo.status === 'drawing') {
          event.preventDefault();
          handleStartExitZoom();
          break;
        }

        const now = Date.now();
        if (now - lastEscapeAtRef.current < escDoubleTapMs) {
          lastEscapeAtRef.current = 0;
          invokePointerMode();
        } else {
          lastEscapeAtRef.current = now;
        }

        break;
      }
    }

    if (toolbarSlide === 'main-slide') {
      switch (eventCode) {
        case 'digit1': {
          let nextBrush = toolbarLastActiveBrush;

          if (activeTool === toolbarLastActiveBrush) {
            nextBrush = getNextVariant(drawingToolList, activeTool, direction);
          }

          handleChangeTool(nextBrush);
          break;
        }
        case 'digit2': {
          let nextShape = toolbarLastActiveFigure;

          if (activeTool === toolbarLastActiveFigure) {
            nextShape = getNextVariant(shapeList, activeTool, direction);
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

      return;
    }

    let digitIndex = null;
    if (eventCode === 'digit1') digitIndex = 0;
    if (eventCode === 'digit2') digitIndex = 1;
    if (eventCode === 'digit3') digitIndex = 2;
    if (eventCode === 'digit4') digitIndex = 3;
    if (eventCode === 'digit5') digitIndex = 4;
    if (eventCode === 'digit6') digitIndex = 5;
    if (eventCode === 'digit7') digitIndex = 6;
    if (eventCode === 'digit8') digitIndex = 7;
    if (eventCode === 'digit9') digitIndex = 8;
    if (digitIndex === null) return;

    switch (toolbarSlide) {
      case 'brush-slide': {
        if (digitIndex < drawingToolList.length) {
          handleChangeTool(drawingToolList[digitIndex]);
          setToolbarSlide("main-slide");
        }
        break;
      }

      case 'tool-slide':
        if (digitIndex < shapeList.length) {
          handleChangeTool(shapeList[digitIndex]);
          setToolbarSlide("main-slide");
        }
        break;

      case 'color-slide':
        if (digitIndex < colorList.length) {
          handleChangeColor(digitIndex);
          setToolbarSlide("main-slide");
        }
        break;

      case 'width-slide':
        if (digitIndex < widthList.length) {
          handleChangeWidth(digitIndex);
          setToolbarSlide("main-slide");
        }
        break;
    }
  }, [allFigures, undoStackFigures, redoStackFigures, clipboardFigure, isDrawing, activeFigureInfo, activeTool, activeColorIndex, activeWidthIndex, toolbarLastActiveBrush, toolbarLastActiveFigure, lastActivePen, lastActiveArrow, toolbarSlide, textEditorContainer, mouseCoordinates, mainColorIndex, secondaryColorIndex, colorList, zoomInfo]);

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

    if (mainKey.length === 1 && mainKey >= 'A' && mainKey <= 'Z') {
      mainKey = `KEY${mainKey}`;
    }

    const punctuation = {
      '-': 'MINUS',
      '=': 'EQUAL',
      '[': 'BRACKETLEFT',
      ']': 'BRACKETRIGHT',
      ';': 'SEMICOLON',
      "'": 'QUOTE',
      '`': 'BACKQUOTE',
      ',': 'COMMA',
      '.': 'PERIOD',
      '/': 'SLASH',
    };

    if (punctuation[mainKey]) {
      mainKey = punctuation[mainKey];
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
    const eventCode = (event.code || '').toUpperCase()

    const ctrlKey = event.ctrlKey
    const metaKey = event.metaKey
    const shiftKey = event.shiftKey
    const eventRepeat = event.repeat

    if (eventRepeat) return false;

    const accelOptions = parseAccelerator(shortcut);
    if (!accelOptions) return false;

    return (
      (accelOptions.mainKey === eventCode) &&
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

  useEffect(() => {
    setToolbarSlide('main-slide');
  }, [activeTool, activeColorIndex, activeWidthIndex]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsDocumentVisible(!document.hidden);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

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
        tool_bar_collapsed: toolbarCollapsed,
      });
    }, updateStoreDelay);

    debouncedUpdateSettings();

    return () => {
      debouncedUpdateSettings.cancel();
    };
  }, [showWhiteboard, showToolbar, activeTool, activeColorIndex, activeWidthIndex, toolbarLastActiveBrush, toolbarLastActiveFigure, toolbarCollapsed]);

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
    setActiveColorIndex(newColorIndex);
  };

  const handleChangeWidth = (newWidthIndex) => {
    setActiveWidthIndex(newWidthIndex);
  };

  const handleChangeFigureColor = (newColorIndex) => {
    if (!activeFigureInfo) return;

    const activeFigure = findActiveFigure()

    activeFigure.colorIndex = newColorIndex

    setAllFigures([...allFigures]);
  };

  const handleChangeFigureWidth = (newWidthIndex) => {
    if (!activeFigureInfo) return;

    setAllFigures(prevAllFigures => {
      return prevAllFigures.map((figure) => {
        if (figure.id !== activeFigureInfo.id) return figure;

        if (figure.type === 'text') {
          const [width, height] = calculateCanvasTextWidth(figure.text, newWidthIndex);

          return {
            ...figure,
            widthIndex: newWidthIndex,
            width:      width,
            height:     height,
            scale:      1,
            autoResize: true,
          };
        }

        return {
          ...figure,
          widthIndex: newWidthIndex
        };
      });
    });
  };

  const handleChangeFigureStroke = (newStrokeIndex) => {
    if (!activeFigureInfo) return;

    const activeFigure = findActiveFigure()

    activeFigure.strokeIndex = newStrokeIndex

    setAllFigures([...allFigures]);
  };

  const handleChangeFigureEdges = (newEdgeIndex) => {
    if (!activeFigureInfo) return;

    const activeFigure = findActiveFigure()

    activeFigure.edgeIndex = newEdgeIndex

    setAllFigures([...allFigures]);
  };

  const handleCopyActiveFigure = () => {
    if (!activeFigureInfo) return;

    const activeFigure = findActiveFigure()

    setClipboardFigure({
      ...activeFigure,
      points: activeFigure.points.map(p => [...p]) // Avoid mutation
    });
  };

  const handleDeleteActiveFigure = () => {
    if (!activeFigureInfo) return;

    const activeFigure = findActiveFigure()

    setActiveFigureInfo(null);
    setAllFigures(allFigures.filter((figure) => figure.id !== activeFigureInfo.id));
    setUndoStackFigures((prevUndoStack) => [...prevUndoStack, { type: 'remove', figures: [activeFigure] }]);
    setRedoStackFigures([]);
  };

  const handleChangeTool = (toolName) => {
    if (activeTool === toolName) {
      return
    }

    setActiveFigureInfo(null);
    setActiveTool(toolName);

    if (drawingToolList.includes(toolName)) {
      setToolbarLastActiveBrush(toolName);
    }

    if (shapeList.includes(toolName)) {
      setToolbarLastActiveFigure(toolName);
    }

    if (penVariantList.includes(toolName)) {
      setLastActivePen(toolName);
    }

    if (arrowVariantList.includes(toolName)) {
      setLastActiveArrow(toolName);
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

  const setActiveHoveredDotName = (hoveredDotName) => {
    setActiveFigureInfo(prev => {
      if (!prev) return prev;
      if (prev.hoveredDotName === hoveredDotName) return prev;

      return { ...prev, hoveredDotName };
    });
  }

  const getResizeCursorByFigure = (figure, resizingDotName) => {
    if (['line', 'arrow', 'flat_arrow'].includes(figure.type)) {
      return 'pointer';
    }

    if (['rectangle', 'diamond', 'oval'].includes(figure.type)) {
      const [pointA, pointB] = figure.points;
      const cornersByDotName = {
        pointA,
        pointB,
        pointC: [pointA[0], pointB[1]],
        pointD: [pointB[0], pointA[1]],
      };

      const activeCorner = cornersByDotName[resizingDotName];
      const minX = Math.min(pointA[0], pointB[0]);
      const minY = Math.min(pointA[1], pointB[1]);
      const isLeft = activeCorner[0] === minX;
      const isTop = activeCorner[1] === minY;

      const isPrimaryDiagonal = isLeft === isTop; // top-left (true,true), bottom-right (false,false)

      return isPrimaryDiagonal ? 'nwse-resize' : 'nesw-resize';
    }

    if (['text'].includes(figure.type)) {
      if (['pointA', 'pointB'].includes(resizingDotName)) return 'nwse-resize';
      if (['pointC', 'pointD'].includes(resizingDotName)) return 'nesw-resize';
    }

    return 'crosshair';
  }

  const getResizeCursorBySide = (resizingSideName) => {
    if (['TopSide', 'BottomSide'].includes(resizingSideName)) return 'ns-resize';
    if (['LeftSide', 'RightSide'].includes(resizingSideName)) return 'ew-resize';

    return 'crosshair';
  }

  const setMouseCursor = (x, y) => {
    if (activeFigureInfo) {
      const activeFigure = findActiveFigure()

      const resizingDotName = getDotNameOnFigure(x, y, activeFigure);
      const resizingSideName = getSideNameOnFigure(x, y, activeFigure);

      if (resizingDotName) {
        setActiveHoveredDotName(resizingDotName);
        setCursorType(getResizeCursorByFigure(activeFigure, resizingDotName));
        return
      }

      if (resizingSideName) {
        setActiveHoveredDotName(null);
        setCursorType(getResizeCursorBySide(resizingSideName));
        return
      }

      if (isOverFigure(x, y, activeFigure)) {
        setActiveHoveredDotName(null);
        setCursorType('move');
        return
      }

      if (isOnTextAutoResizeHandle(x, y, activeFigure)) {
        setActiveHoveredDotName(null);
        setCursorType('pointer');
        return
      }

      setActiveHoveredDotName(null);
    }

    if ([...drawingToolList, ...shapeList, 'text'].includes(activeTool)) {
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

      const resizingDotName = getDotNameOnFigure(x, y, activeFigure);
      const resizingSideName = getSideNameOnFigure(x, y, activeFigure);

      if (resizingDotName) {
        const resizingPointerOffset = getDotOffsetCoordinates(activeFigure, resizingDotName, x, y);

        setActiveFigureInfo(prev => {
          if (!prev) return prev;

          return {
            ...prev,
            resizing: true,
            resizingDotName: resizingDotName,
            resizingPointerOffset: resizingPointerOffset,
            hoveredDotName: null
          };
        });
        return;
      }

      if (resizingSideName) {
        const resizingSidePointName = getSidePointName(activeFigure, resizingSideName);
        const resizingPointerOffset = getSideOffsetCoordinates(activeFigure, resizingSideName, resizingSidePointName, x, y);

        setActiveFigureInfo(prev => {
          if (!prev) return prev;

          return {
            ...prev,
            resizing: true,
            resizingSideName: resizingSideName,
            resizingSidePointName: resizingSidePointName,
            resizingPointerOffset: resizingPointerOffset,
            hoveredDotName: null,
          };
        });
        return;
      }

      if (isOverFigure(x, y, activeFigure)) {
        setActiveFigureInfo(prev => {
          if (!prev) return prev;

          return {
            ...prev,
            dragging: true,
            x: x,
            y: y,
            hoveredDotName: null
          };
        });

        return;
      }

      if (isOnTextAutoResizeHandle(x, y, activeFigure)) {
        const [width, height] = calculateCanvasTextWidth(activeFigure.text, activeFigure.widthIndex);

        setAllFigures(prevAllFigures => {
          return prevAllFigures.map((figure) => {
            if (figure.id !== activeFigureInfo.id) return figure;

            return {
              ...figure,
              width: width,
              height: height,
              autoResize: true
            };
          });
        });

        return;
      }

      // Diactivate active figure
      setActiveFigureInfo(null);
    }

    // Click on the figure
    if ([...drawingToolList, ...shapeList, 'text'].includes(activeTool)) {
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
        const [, height] = calculateCanvasTextWidth('', activeWidthIndex);

        const newTextEditor = {
          id: Date.now(),
          isActive: true,
          startAt: [x, y - (height / 2)],
          colorIndex: activeColorIndex,
          widthIndex: activeWidthIndex,
          rainbowColorDeg: rainbowColorDeg,
          text: '',
          scale: 1,
          autoResize: true,
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
        resizeFigure(activeFigure, activeFigureInfo, { x, y, isShiftPressed })
      }

      setActiveFigureInfo(prev => ({ ...prev, x, y }));
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

      if (['brush', 'pen', 'highlighter'].includes(activeTool)) {
        const currentFigure = allFigures[allFigures.length - 1];

        currentFigure.points = [...currentFigure.points, [x, y]];

        setAllFigures([...allFigures]);
        return
      }

      if (shapeList.includes(activeTool)) {
        const currentFigure = allFigures[allFigures.length - 1];

        if (isShiftPressed) {
          if (['line', 'arrow', 'flat_arrow'].includes(currentFigure.type)) {
            const startPoint = currentFigure.points[0];

            const result = applySoftSnap(startPoint[0], startPoint[1], x, y);
            x = result.x;
            y = result.y;
          }

          if (['rectangle', 'diamond', 'oval'].includes(currentFigure.type)) {
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

        if (penSmoothing && !colorList[currentFigure.colorIndex].isRainbow) {
          currentFigure.points = [...filterClosePoints(currentFigure.points, currentFigure.widthIndex)];
        }

        setFadeFigures([...allFadeFigures]);
        setIsFadeDrawing(false);
      }

      if (['brush', 'pen'].includes(activeTool)) {
        const currentFigure = allFigures.at(-1);

        if (penSmoothing && !colorList[currentFigure.colorIndex].isRainbow) {
          currentFigure.points = [...filterClosePoints(currentFigure.points, currentFigure.widthIndex)];
        }

        setUndoStackFigures(prevUndoStack => [...prevUndoStack, { type: 'add', figures: [currentFigure] }]);
        setRedoStackFigures([]);

        setAllFigures([...allFigures]);
      }

      if (shapeList.includes(activeTool)) {
        const currentFigure = allFigures.at(-1);
        const shapeDistance = distanceBetweenPoints(currentFigure.points[0], upPoint);

        if (['rectangle', 'diamond', 'oval'].includes(currentFigure.type)) {
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
        if (['rectangle', 'diamond', 'oval'].includes(activeFigure.type)) {
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

  const handleContextMenu = (event) => {
    event.preventDefault();

    if (isDrawing) return;
    if (isActiveFigureMoving()) return;

    if (activeFigureInfo) {
      setActiveFigureInfo(null);
      return;
    }

    if (clearDrawingsOnHide) {
      handleReset();
    }

    invokePointerMode();
  }

  const handleEnablePointerMode = () => {
    if (clearDrawingsOnHide) {
      handleReset();
    }

    invokePointerMode();
  };

  const handleCloseToolBar = () => {
    invokeCloseApp();
  }

  const handleExitZoom = () => {
    handleReset();
    setZoomInfo({ status: 'inactive' });

    invokeExitZoom();
  }

  const handleStartExitZoom = () => {
    setZoomInfo((currentZoomInfo) => {
      if (currentZoomInfo.status === 'zooming' || currentZoomInfo.status === 'drawing' || currentZoomInfo.status === 'resuming') {
        return {
          ...currentZoomInfo,
          status: 'exiting',
          animateEntry: false,
        };
      }

      return currentZoomInfo;
    });
  };

  const handleLockZoom = ({ zoomIndex, focusPoint }) => {
    setMouseCoordinates(focusPoint);

    setZoomInfo({
      ...zoomInfo,
      focusPoint: focusPoint,
      resumeFocusPoint: null,
      status: 'drawing',
      zoomIndex: zoomIndex,
      animateEntry: false,
    });
  };

  const handleResumeZoom = (event) => {
    event.preventDefault();

    if (isDrawing) return;
    if (isActiveFigureMoving()) return;

    if (activeFigureInfo) {
      setActiveFigureInfo(null);
      return;
    }

    handleReset();

    setZoomInfo({
      ...zoomInfo,
      resumeFocusPoint: getMouseCoordinates(event),
      status: 'resuming',
    });
  };

  const handleResumeZoomEnd = () => {
    setZoomInfo((currentZoomInfo) => {
      if (currentZoomInfo.status === 'resuming') {
        return {
          ...currentZoomInfo,
          resumeFocusPoint: null,
          status: 'zooming',
        };
      }

      return currentZoomInfo;
    });
  };

  const handleToggleZoom = () => {
    const now = Date.now();

    if (now - lastZoomShortcutAtRef.current < pastCooldownMs) return;
    lastZoomShortcutAtRef.current = now;

    if (zoomInfo.status === 'inactive') {
      invokeRequestZoomStart();
      return;
    }

    handleStartExitZoom();
  }

  const invokeRequestZoomStart = () => {
    console.log('Renderer -> Main: Request Zoom Start');

    window.electronAPI.invokeRequestZoomStart();
  }

  const invokeRejectZoomStart = () => {
    console.log('Renderer -> Main: Invoke Reject Zoom Start');

    window.electronAPI.invokeRejectZoomStart();
  }

  const invokeExitZoom = () => {
    console.log('Renderer -> Main: Invoke Exit Zoom');

    window.electronAPI.invokeExitZoom();
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

  const invokePointerMode = () => {
    console.log('Renderer -> Main: Invoke Pointer Mode');

    window.electronAPI.invokePointerMode();
  }

  const invokeCloseApp = () => {
    console.log('Renderer -> Main: Invoke Close App');

    window.electronAPI.invokeCloseApp();
  }

  const handleReset = () => {
    console.log('Main -> Renderer: Handle Reset');

    setIsDrawing(false);
    setIsFadeDrawing(false);
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
    setShowScreenshotFlash(false);
    setToastInfo(null);
  };

  const handleToggleToolbar = () => {
    console.log('Main -> Renderer: Toggle Toolbar');

    setShowToolbar((prevShowToolbar) => !prevShowToolbar);
  };

  const handleToggleWhiteboard = () => {
    console.log('Main -> Renderer: Toggle Whiteboard');

    setShowWhiteboard((prevShowWhiteboard) => !prevShowWhiteboard);
  };

  const handleRefreshSettings = (newSettings) => {
    console.log('Main -> Renderer: Refresh Settings');

    setColorList(createApplicationColorList(newSettings.tool_bar_color_palette));
    setWhiteboardTheme(newSettings.whiteboard_color);
    setWhiteboardLayout(newSettings.whiteboard_layout);
    setWhiteboardOpacity(newSettings.whiteboard_opacity);
    setWhiteboardPatternStyle(newSettings.whiteboard_style);
    setWhiteboardSpacing(newSettings.whiteboard_spacing);
    setShowDrawingBorder(newSettings.show_drawing_border);
    setCuteCursorMode(newSettings.cute_cursor_mode);
    setPenSmoothing(newSettings.pen_smoothing);
    setClearDrawingsOnHide(newSettings.clear_drawings_on_hide);
    setMainColorIndex(newSettings.swap_colors_indexes[0]);
    setSecondaryColorIndex(newSettings.swap_colors_indexes[1]);
  };

  const handleUpdateToolbarPosition = (newSettings) => {
    console.log('Main -> Renderer: Update Toolbar Position');

    setToolbarPosition({
      x: newSettings.tool_bar_x,
      y: newSettings.tool_bar_y,
    });
  };

  const handleScreenshotFlash = () => {
    console.log('Main -> Renderer: Show Screenshot Flash');

    setShowScreenshotFlash(true);
  };

  const handleScreenshotFlashAnimationEnd = () => {
    setShowScreenshotFlash(false);
  };

  const handleShowNotification = (data) => {
    console.log('Main -> Renderer: Show Notification');

    setToastInfo({
      title: data.title,
      body: data.body,
      button_label: data.button_label,
      button_action: data.button_action,
      button_data: data.button_data
    });
  };

  const handleShowZoom = (info) => {
    console.log('Main -> Renderer: Show Zoom');

    setShowScreenshotFlash(false);
    setToastInfo(null);

    setZoomInfo({
      imageDataUrl: info.imageDataUrl,
      focusPoint: info.initialZoomPoint,
      status: 'zooming',
      zoomIndex: initialZoomIndex,
      animateEntry: true,
    });
  };

  const handlePrepareZoomCapture = () => {
    console.log('Main -> Renderer: Prepare Zoom Capture');

    if (drawingInProgressRef.current) {
      invokeRejectZoomStart();
      return;
    }

    handleReset();

    setZoomInfo({
      status: 'capturing',
    });
  };

  const handleRequestExitZoom = () => {
    console.log('Main -> Renderer: Request Exit Zoom');

    handleStartExitZoom();
  };

  const handleStopZoom = () => {
    console.log('Main -> Renderer: Stop Zoom');

    handleReset();
    setZoomInfo({ status: 'inactive' });
  };

  const invokeSetSettings = (settings) => {
    console.log('Renderer -> Main: Invoke Set Settings');

    window.electronAPI.invokeSetSettings(settings);
  };

  const invokeCommitToolbarPosition = useCallback((position) => {
    console.log('Renderer -> Main: Invoke Commit Toolbar Position');

    window.electronAPI.invokeCommitToolbarPosition({
      tool_bar_x: position.x,
      tool_bar_y: position.y,
    });
  }, []);

  const handleChangeWhiteboardTheme = (theme) => {
    setWhiteboardTheme(theme);
    invokeSetSettings({ whiteboard_color: theme });
  };

  const handleChangeWhiteboardOpacity = (opacity) => {
    setWhiteboardOpacity(opacity);
    invokeSetSettings({ whiteboard_opacity: opacity });
  };

  const handleChangeWhiteboardPatternStyle = (style) => {
    setWhiteboardPatternStyle(style);
    invokeSetSettings({ whiteboard_style: style });
  };

  const handleChangeWhiteboardSpacing = (spacing) => {
    setWhiteboardSpacing(spacing);
    invokeSetSettings({ whiteboard_spacing: spacing });
  };

  const handleChangeWhiteboardLayout = (layout, saveToStore = false) => {
    setWhiteboardLayout(layout);

    if (saveToStore) {
      invokeSetSettings({ whiteboard_layout: layout });
    }
  };

  const handleToastClicked = () => {
    invokeOpenNotification({
      action: toastInfo.button_action,
      data: toastInfo.button_data,
    });

    setToastInfo(null);
  };

  const handleToastHidden = () => {
    setToastInfo(null);
  };

  const handleTextEditorBlur = (text) => {
    const cleanedText = text.replace(/[\s\u200B\u200C\u200D\uFEFF]+$/g, ''); // прибираємо сміття з кінця

    if (cleanedText === '') {
      setTextEditorContainer(null);
      return;
    }

    let [width, height] = calculateCanvasTextWidth(cleanedText, textEditorContainer.widthIndex);

    if (!textEditorContainer.autoResize) {
      width = textEditorContainer.width;
      height = calculateCanvasWrappedTextHeight(cleanedText, textEditorContainer.widthIndex, width);
    }

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
      autoResize: textEditorContainer.autoResize,
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
      width: pickedFigure.width,
      autoResize: pickedFigure.autoResize,
    };

    setTextEditorContainer(newTextEditor);
    setActiveFigureInfo(null);
    setAllFigures(allFigures.filter(figure => figure.id !== pickedFigure.id));

    setUndoStackFigures(prevUndoStack => [...prevUndoStack, { type: 'remove', figures: [pickedFigure] }]);
    setRedoStackFigures([]);
  }

  const manipulation = (isDrawing || isActiveFigureMoving()) ? "manipulation_mode" : "";
  const canvasCursorType = cuteCursorMode === 'dot' && cursorType === 'crosshair' ? 'default' : cursorType;
  const isCuteCursorVisible =
    isDocumentVisible &&
    ['permanent', 'fade', 'dot'].includes(cuteCursorMode) &&
    !(cuteCursorMode === 'dot' && canvasCursorType !== 'default');

  const activeFigure = activeFigureInfo && findActiveFigure();
  const showSubToolbar = activeFigure && !isActiveFigureMoving();

  const drawingContent = (
    <>
      {
        showScreenshotFlash &&
          <div
            className="screenshot-flash"
            onAnimationEnd={handleScreenshotFlashAnimationEnd}
          />
      }

      {
        zoomInfo.status === 'inactive' && showWhiteboard &&
        <Whiteboard
          theme={whiteboardTheme}
          layout={whiteboardLayout}
          opacity={whiteboardOpacity}
          patternStyle={whiteboardPatternStyle}
          spacing={whiteboardSpacing}
          onChangeTheme={handleChangeWhiteboardTheme}
          onChangeOpacity={handleChangeWhiteboardOpacity}
          onChangePatternStyle={handleChangeWhiteboardPatternStyle}
          onChangeSpacing={handleChangeWhiteboardSpacing}
          onChangeLayout={handleChangeWhiteboardLayout}
        />
      }

      {
        zoomInfo.status === 'inactive' && showDrawingBorder &&
        <div id="zone_borders"></div>
      }

      {
        toastInfo &&
          <Toast
            info={toastInfo}
            handleToastClicked={handleToastClicked}
            handleToastHidden={handleToastHidden}
          />
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
            colorList={colorList}
          />
      }

      {
        isCuteCursorVisible &&
          <CuteCursor
            key={`${activeTool}:${activeColorIndex}:${activeWidthIndex}`}
            mouseCoordinates={mouseCoordinates}
            activeColorIndex={activeColorIndex}
            activeWidthIndex={activeWidthIndex}
            activeTool={activeTool}
            Icons={Icons}
            colorList={colorList}
            rainbowColorDeg={rainbowColorDeg}
            cuteCursorMode={cuteCursorMode}
          />
      }

      <DrawDesk
        allFigures={allFigures}
        allFadeFigures={allFadeFigures}
        allLaserFigures={allLaserFigures}
        allEraserFigures={allEraserFigures}
        fadeOpacity={fadeOpacity}
        activeFigureInfo={activeFigureInfo}
        cursorType={canvasCursorType}
        handleMouseDown={handleMouseDown}
        handleMouseMove={handleMouseMove}
        handleMouseUp={handleMouseUp}
        handleDoubleClick={handleDoubleClick}
        updateRainbowColorDeg={updateRainbowColorDeg}
        activeTool={activeTool}
        handleChangeTool={handleChangeTool}
        colorList={colorList}
      />

      {
        showSubToolbar &&
          <FigureToolbar
            key={activeFigure.id}
            figure={activeFigure}
            colorList={colorList}
            onChangeColor={handleChangeFigureColor}
            onChangeWidth={handleChangeFigureWidth}
            onChangeStroke={handleChangeFigureStroke}
            onChangeEdges={handleChangeFigureEdges}
            onDelete={handleDeleteActiveFigure}
            Icons={Icons}
          />
      }

      {
        showToolbar &&
          <ToolBar
            orientation={initialToolbarOrientation}
            position={toolbarPosition}
            setPosition={setToolbarPosition}
            toolbarSlide={toolbarSlide}
            setToolbarSlide={setToolbarSlide}
            isCollapsed={toolbarCollapsed}
            setIsCollapsed={setToolbarCollapsed}
            shortcutHintsDisabled={Boolean(textEditorContainer)}
            clearDeskShortcut={key_clear_desk}
            lastActiveBrush={toolbarLastActiveBrush}
            lastActiveFigure={toolbarLastActiveFigure}
            activeTool={activeTool}
            activeColorIndex={activeColorIndex}
            activeWidthIndex={activeWidthIndex}
            handleCloseToolBar={handleCloseToolBar}
            handleChangeColor={handleChangeColor}
            handleChangeWidth={handleChangeWidth}
            handleChangeTool={handleChangeTool}
            handleClearDesk={handleReset}
            handleEnablePointerMode={handleEnablePointerMode}
            handlePositionCommit={invokeCommitToolbarPosition}
            Icons={Icons}
            colorList={colorList}
          />
      }
    </>
  );

  if (zoomInfo.status === 'capturing') {
    return <div id="root_wrapper" />;
  }

  if (zoomInfo.status === 'zooming' || zoomInfo.status === 'resuming' || zoomInfo.status === 'exiting') {
    return (
      <div id="root_wrapper">
        <ZoomLayer
          imageDataUrl={zoomInfo.imageDataUrl}
          currentFocusPoint={zoomInfo.focusPoint}
          resumeFocusPoint={zoomInfo.resumeFocusPoint}
          currentZoomIndex={zoomInfo.zoomIndex}
          animateEntry={zoomInfo.animateEntry}
          isResuming={zoomInfo.status === 'resuming'}
          isExiting={zoomInfo.status === 'exiting'}
          onLockZoom={handleLockZoom}
          onResumeZoomEnd={handleResumeZoomEnd}
          onStartExitZoom={handleStartExitZoom}
          onExitZoom={handleExitZoom}
        />
      </div>
    );
  }

  if (zoomInfo.status === 'drawing') {
    return (
      <div
        id="root_wrapper"
        className={manipulation}
        onPointerMove={handleMousePosition}
        onContextMenu={handleResumeZoom}
      >
        <ZoomBackground
          imageDataUrl={zoomInfo.imageDataUrl}
          currentFocusPoint={zoomInfo.focusPoint}
          currentZoomIndex={zoomInfo.zoomIndex}
          onStartExitZoom={handleStartExitZoom}
        />

        {drawingContent}
      </div>
    );
  }

  return (
    <div
      id="root_wrapper"
      className={manipulation}
      onPointerMove={handleMousePosition}
      onContextMenu={handleContextMenu}
    >
      {drawingContent}
    </div>
  );
};

export default Application;
