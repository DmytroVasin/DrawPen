import './Application.scss';

import React, { useCallback, useState, useEffect, useRef } from 'react';
import { throttle, debounce } from 'lodash';
import DrawDesk from './components/DrawDesk.js';
import ToolBar from './components/ToolBar.js';
import CuteCursor from './components/CuteCursor.js';
import RippleEffect from './components/RippleEffect.js';
import DisableZoom from './components/DisableZoom.js';
import TextEditor from './components/TextEditor.js';
import {
  filterClosePoints,
  getMouseCoordinates,
  distanceBetweenPoints,
  calculateCanvasTextWidth,
} from './utils/general.js';
import {
  isOnFigure,
  areFiguresIntersecting,
  getDotNameOnFigure,
  dragFigure,
  resizeFigure,
  moveToCoordinates,
} from './utils/figureDetection.js';
import { FaPaintBrush, FaRegSquare, FaRegCircle, FaArrowRight, FaEraser } from "react-icons/fa";
import { AiOutlineLine } from "react-icons/ai";
import { GiLaserburn } from "react-icons/gi";
import { MdOutlineCancel } from "react-icons/md";
import { FaFont } from "react-icons/fa6";

import {
  laserTime,
  eraserTime,
  shapeList,
  colorList,
  widthList,
  minObjectDistance,
} from './constants.js'

const Icons = {
  FaPaintBrush,
  FaRegSquare,
  FaRegCircle,
  FaArrowRight,
  AiOutlineLine,
  GiLaserburn,
  MdOutlineCancel,
  FaEraser,
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
  const initialToolbarDefaultFigure = settings.tool_bar_default_figure
  const initialToolbarPosition = { x: settings.tool_bar_x, y: settings.tool_bar_y }
  let initialFigures = []

  if (process.env.NODE_ENV === 'development') {
    initialFigures = [
      { id: 0, type: 'arrow',     colorIndex: 0, widthIndex: 2, points: [[100, 100], [400, 100]], rainbowColorDeg: (Math.random() * 360) },
      { id: 1, type: 'line',      colorIndex: 0, widthIndex: 2, points: [[100, 200], [400, 200]], rainbowColorDeg: 250 },
      { id: 2, type: 'rectangle', colorIndex: 0, widthIndex: 2, points: [[70, 150], [450, 250]],  rainbowColorDeg: (Math.random() * 360) },
      { id: 3, type: 'oval',      colorIndex: 0, widthIndex: 2, points: [[100, 300], [400, 450]], rainbowColorDeg: (Math.random() * 360) },
      { id: 4, type: 'text',      colorIndex: 2, widthIndex: 2, points: [[152, 118]],             rainbowColorDeg: (Math.random() * 360), text: 'Hello World', width: 400, height: 150, scale: 1 },
    ]
  }

  const [rainbowColorDeg, updateRainbowColorDeg] = useState(initialColorDeg);
  const [mouseCoordinates, setMouseCoordinates] = useState({ x: 0, y: 0 });
  const [allFigures, setAllFigures] = useState(initialFigures);
  const [allLaserFigures, setLaserFigure] = useState([]);
  const [allEraserFigures, setEraserFigure] = useState([]);
  const [activeTool, setActiveTool] = useState(initialActiveTool);
  const [activeFigureInfo, setActiveFigureInfo] = useState(null);
  const [activeColorIndex, setActiveColorIndex] = useState(initialActiveColor);
  const [activeWidthIndex, setActiveWidthIndex] = useState(initialActiveWidth);
  const [isDrawing, setIsDrawing] = useState(false);
  const [textEditorContainer, setTextEditorContainer] = useState(null);
  const [cursorType, setCursorType] = useState('crosshair');
  const [showToolbar, setShowToolbar] = useState(initialShowToolbar);
  const [showWhiteboard, setShowWhiteboard] = useState(initialShowWhiteboard);
  const [toolbarLastActiveFigure, setToolbarLastActiveFigure] = useState(initialToolbarDefaultFigure);
  const [toolbarPosition, setToolbarPosition] = useState(initialToolbarPosition);
  const [rippleEffects, setRippleEffects] = useState([]);
  const [undoStackFigures, setUndoStackFigures] = useState([]);
  const [redoStackFigures, setRedoStackFigures] = useState([]);
  const [clipboardFigure, setClipboardFigure] = useState(null);

  useEffect(() => {
    window.electronAPI.onResetScreen(handleReset);
    window.electronAPI.onToggleToolbar(handleToggleToolbar);
    window.electronAPI.onToggleWhiteboard(handleToggleWhiteboard);
  }, []);

  // useEffect(() => {
  //   console.log('Clipboard Figure: ', clipboardFigure);
  // }, [clipboardFigure]);

  // useEffect(() => {
  //   console.log('All Figures: ', allFigures);
  // }, [allFigures]);

  // useEffect(() => {
  //   console.log('activeFigureInfo: ', activeFigureInfo);
  // }, [activeFigureInfo]);

  // useEffect(() => {
  //   console.log('UNDO: ', undoStackFigures);
  // }, [undoStackFigures]);

  // useEffect(() => {
  //   console.log('REDO: ', redoStackFigures);
  // }, [redoStackFigures]);

  const lastPasteAtRef = useRef(null);
  const PASTE_COOLDOWN_MS = 300;

  const handleKeyPress = useCallback((event) => {
    if (isDrawing || textEditorContainer || isActiveFigureMoving()) {
      return
    }

    switch (event.key) {
      case 'v':
      case 'V':
        if (event.ctrlKey || event.metaKey) {
          if (clipboardFigure) {
            const now = Date.now();
            if (now - lastPasteAtRef.current < PASTE_COOLDOWN_MS) return;
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
      case 'c':
      case 'C':
        if (event.ctrlKey || event.metaKey) {
          if (activeFigureInfo) {
            const activeFigure = findActiveFigure();

            setClipboardFigure({
              ...activeFigure,
              points: activeFigure.points.map(p => [...p]) // Avoid mutation
            });
          }
        }

        break;
      case 'z':
      case 'Z':
        if (event.ctrlKey || event.metaKey) {
          if (activeFigureInfo) {
            setActiveFigureInfo(null);
            break;
          }

          // REDO:
          if (event.shiftKey) {
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
      case 'ArrowUp':
      case 'ArrowDown':
      case 'ArrowLeft':
      case 'ArrowRight':
        if (activeFigureInfo) {
          const activeFigure = findActiveFigure()
          const offset = 2;

          const directionMap = {
            ArrowLeft:  [-offset, 0],
            ArrowRight: [offset, 0],
            ArrowUp:    [0, -offset],
            ArrowDown:  [0, offset],
          };

          const [dx, dy] = directionMap[event.key];

          activeFigure.points.forEach((point) => {
            point[0] += dx;
            point[1] += dy;
          });

          setAllFigures([...allFigures]);
        }
        break;
      case 'Delete':
      case 'Backspace':
        if (activeFigureInfo) {
          const figureToRemove = allFigures.find(figure => figure.id === activeFigureInfo.id);
          const newActiveFigures = allFigures.filter(figure => figure.id !== activeFigureInfo.id)

          setActiveFigureInfo(null);
          setAllFigures(newActiveFigures);

          setUndoStackFigures(prevUndoStack => [...prevUndoStack, { type: 'remove', figures: [figureToRemove] }]);
          setRedoStackFigures([]);
        }
        break;
      case 'Enter':
        if (activeFigureInfo) {
          const activeFigure = findActiveFigure()

          if (activeFigure.type === 'text') {
            activateTextEditor(activeFigure);

            event.preventDefault();
          }
        }
        break;
      case 'Escape':
        if (activeFigureInfo) {
          setActiveFigureInfo(null);
        }
        break;
      case '1':
        handleChangeTool('pen');
        break;
      case '2':
        let nextShape = toolbarLastActiveFigure;

        if (activeTool === toolbarLastActiveFigure) {
          const activeShapeIndex = shapeList.indexOf(activeTool);
          const nextShapeIndex = (activeShapeIndex + 1) % shapeList.length;

          nextShape = shapeList[nextShapeIndex];
        }

        handleChangeTool(nextShape);
        break;
      case '3':
        handleChangeTool('text');
        break;
      case '4':
        handleChangeTool('laser');
        break;
      case '5':
        handleChangeTool('eraser');
        break;
      case '6':
        if (['eraser', 'laser'].includes(activeTool)) {
          break;
        }

        handleChangeColor((activeColorIndex + 1) % colorList.length);

        break;
      case '7':
        handleChangeWidth((activeWidthIndex + 1) % widthList.length);
        break;
    }
  }, [allFigures, undoStackFigures, redoStackFigures, clipboardFigure, isDrawing, activeFigureInfo, activeTool, activeColorIndex, activeWidthIndex, toolbarLastActiveFigure, textEditorContainer, mouseCoordinates]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress);

    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, [handleKeyPress]);

  useEffect(() => {
    const debouncedUpdateSettings = debounce(() => {
      invokeSetSettings({
        show_whiteboard: showWhiteboard,
        show_tool_bar: showToolbar,
        tool_bar_active_tool: activeTool,
        tool_bar_active_color_index: activeColorIndex,
        tool_bar_active_weight_index: activeWidthIndex,
        tool_bar_default_figure: toolbarLastActiveFigure,
        tool_bar_x: toolbarPosition.x,
        tool_bar_y: toolbarPosition.y,
      });
    }, 300);

    debouncedUpdateSettings();

    return () => {
      debouncedUpdateSettings.cancel();
    };
  }, [showWhiteboard, showToolbar, activeTool, activeColorIndex, activeWidthIndex, toolbarLastActiveFigure, toolbarPosition]);

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
    }, laserTime)
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

    if (shapeList.includes(toolName)) {
      setToolbarLastActiveFigure(toolName);
    }
  };

  const moveFigureToTop = (figureId) => {
    const figureIndex = allFigures.findIndex((figure) => figure.id === figureId)
    const [figure] = allFigures.splice(figureIndex, 1)

    setAllFigures([...allFigures, figure]);
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
      const resizingDotName = getDotNameAtMousePosition(x, y);

      if (resizingDotName) {
        setCursorType('move');
        return
      }
    }

    if (!['eraser', 'laser'].includes(activeTool) && getFigureAtMousePosition(x, y)) {
      setCursorType('move');
      return
    }

    setCursorType('crosshair');
  };
  const setMouseCursorThrottle = throttle(setMouseCursor, 50);

  const eraseFiguresOnIntersection = (eraserFigure) => {
    setAllFigures(prevFigures => {
      let hasChanges = false;

      const updatedFigures = prevFigures.map(figure => {
        if (!figure.erased && areFiguresIntersecting(eraserFigure, figure)) {
          hasChanges = true;

          return { ...figure, erased: true };
        }

        return figure;
      });

      return hasChanges ? updatedFigures : prevFigures;
    });
  }

  const handleMouseDown = ({ x, y }) => {
    // Diactivate text editor
    if (textEditorContainer) {
      setTextEditorContainer({ ...textEditorContainer, isActive: false });
    }

    // With Active Figure
    if (activeFigureInfo) {
      // Click on dots of the active figure
      const resizingDotName = getDotNameAtMousePosition(x, y);
      if (resizingDotName) {
        setActiveFigureInfo({ ...activeFigureInfo, resizing: true, resizingDotName: resizingDotName });
        return;
      }
      // Diactivate active figure
      setActiveFigureInfo(null);
    }

    // Click on the figure
    if (!['eraser', 'laser'].includes(activeTool)) {
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
        type: activeTool,
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
        type: activeTool,
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
    };

    if (shapeList.includes(newFigure.type)) {
      newFigure.points.push([x, y]);
    }

    setAllFigures([...allFigures, newFigure]);
    setIsDrawing(true);
  };

  const handleMouseMove = ({ x, y }) => {
    if (isActiveFigureMoving()) {
      const activeFigure = findActiveFigure()

      if (activeFigureInfo.dragging) {
        dragFigure(activeFigure, { x: activeFigureInfo.x, y: activeFigureInfo.y }, { x, y })
      }

      if (activeFigureInfo.resizing) {
        resizeFigure(activeFigure, activeFigureInfo.resizingDotName, { x, y })
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

      if (activeTool === 'pen') {
        const currentFigure = allFigures[allFigures.length - 1];

        currentFigure.points = [...currentFigure.points, [x, y]];

        setAllFigures([...allFigures]);
        return
      }

      if (shapeList.includes(activeTool)) {
        const currentFigure = allFigures[allFigures.length - 1];

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

        if (figuresToRemove.length > 0) {
          setUndoStackFigures(prevUndoStack => [...prevUndoStack, { type: 'remove', figures: figuresToRemove }]);
          setRedoStackFigures([]);

          setAllFigures(allFigures.filter(figure => !figure.erased));
        }
      }

      if (activeTool === 'pen') {
        const currentFigure = allFigures.at(-1);

        if (currentFigure.colorIndex !== 0) { // Not Rainbow
          currentFigure.points = [...filterClosePoints(currentFigure.points)];
        }

        setUndoStackFigures(prevUndoStack => [...prevUndoStack, { type: 'add', figures: [currentFigure] }]);
        setRedoStackFigures([]);

        setAllFigures([...allFigures]);
      }

      if (shapeList.includes(activeTool)) {
        const currentFigure = allFigures.at(-1);
        const shapeDistance = distanceBetweenPoints(currentFigure.points[0], upPoint);

        if (shapeDistance < minObjectDistance) {
          setAllFigures(allFigures => allFigures.slice(0, -1));
        } else {
          setUndoStackFigures(prevUndoStack => [...prevUndoStack, { type: 'add', figures: [currentFigure] }]);
          setRedoStackFigures([]);
        }
      }
    }

    if (isActiveFigureMoving()) {
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

  const invokeHideApp = () => {
    console.log('Renderer -> Main: Invoke Hide App');

    window.electronAPI.invokeHideApp();
  }

  const handleReset = () => {
    console.log('Main -> Renderer: Handle Reset');

    setIsDrawing(false);
    setActiveFigureInfo(null);
    setAllFigures([]);
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

  const invokeSetSettings = (settings) => {
    console.log('Renderer -> Main: Invoke Set Settings');

    window.electronAPI.invokeSetSettings(settings);
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
    <div id="root_wrapper" className={manipulation} onMouseMove={handleMousePosition} onContextMenu={handleContextMenu}>
      <div id="zone_borders"></div>

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

      <CuteCursor
        mouseCoordinates={mouseCoordinates}
        activeColorIndex={activeColorIndex}
        activeWidthIndex={activeWidthIndex}
        activeTool={activeTool}
        Icons={Icons}
      />

      <DrawDesk
        allFigures={allFigures}
        allLaserFigures={allLaserFigures}
        allEraserFigures={allEraserFigures}
        activeFigureInfo={activeFigureInfo}
        cursorType={cursorType}
        handleMouseDown={handleMouseDown}
        handleMouseMove={handleMouseMove}
        handleMouseUp={handleMouseUp}
        handleDoubleClick={handleDoubleClick}
        updateRainbowColorDeg={updateRainbowColorDeg}
      />

      {
        showToolbar &&
          <ToolBar
            position={toolbarPosition}
            setPosition={setToolbarPosition}
            lastActiveFigure={toolbarLastActiveFigure}
            activeTool={activeTool}
            activeColorIndex={activeColorIndex}
            activeWidthIndex={activeWidthIndex}
            handleCloseToolBar={handleCloseToolBar}
            handleChangeColor={handleChangeColor}
            handleChangeWidth={handleChangeWidth}
            handleChangeTool={handleChangeTool}
            handleReset={handleReset}
            Icons={Icons}
          />
      }

      <DisableZoom />
    </div>
  );
};

export default Application;
