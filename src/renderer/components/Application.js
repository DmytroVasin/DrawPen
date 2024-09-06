import './Application.scss';

import React, { useState, useEffect, useRef } from 'react';
import { throttle } from 'lodash';
import DrawDesk from './components/DrawDesk.js';
import ToolBar from './components/ToolBar.js';
import CuteCursor from './components/CuteCursor.js';
import { filterClosePoints, getMouseCoordinates } from './utils/general.js';
import {
  IsOnCurve,
  IsOnLine,
  IsOnArrow,
  IsOnOval,
  IsOnRectangle,
  IsOnTwoDots,
  IsOnFourDots,
} from './utils/figureDetection.js';
import { FaPaintBrush, FaRegSquare, FaRegCircle, FaArrowRight } from "react-icons/fa";
import { AiOutlineLine } from "react-icons/ai";
import { GiLaserburn } from "react-icons/gi";
import { MdOutlineCancel } from "react-icons/md";

import {
  laserTime,
} from './constants.js'

const Icons = {
  FaPaintBrush,
  FaRegSquare,
  FaRegCircle,
  FaArrowRight,
  AiOutlineLine,
  GiLaserburn,
  MdOutlineCancel
};

const Application = () => {
  // console.log('App render');

  const [mouseCoordinates, setMouseCoordinates] = useState({ x: 0, y: 0 });
  const [allFigures, setAllFigures] = useState([{ id: 1, type: 'pen', colorIndex: 0, widthIndex: 1, points: [[140, 221], [283, 221]] }]);
  const [allLaserFigures, setLaserFigure] = useState([]);
  const [activeTool, setActiveTool] = useState('pen');
  const [activeFigureInfo, setActiveFigureInfo] = useState(null);
  const [activeColorIndex, setActiveColorIndex] = useState(0);
  const [activeWidthIndex, setActiveWidthIndex] = useState(2);
  const [isDrawing, setIsDrawing] = useState(false);
  const [cursorType, setCursorType] = useState('crosshair');
  const [showToolbar, setShowToolbar] = useState(true);
  const [showWhiteboard, setShowWhiteboard] = useState(false);

  useEffect(() => {
    window.electronAPI.onResetScreen(() => {
      handleReset();
      console.log('Handle Reset');
    });

    window.electronAPI.onToggleToolbar(() => {
      handleToggleToolbar()
      console.log('Toggle Toolbar');
    });

    window.electronAPI.onToggleWhiteboard(() => {
      handleToggleWhiteboard()
      console.log('Toggle Whiteboard');
    });
  }, []);

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

  const isActiveFigureMoving = () => {
    return activeFigureInfo && (activeFigureInfo.dragging || activeFigureInfo.resizing)
  }

  const findActiveFigure = () => {
    return allFigures.find((figure) => figure.id === activeFigureInfo.id);
  }

  const scheduleClearLaserTail = (id) => {
    // We first create a new reference with the useRef hook and then use useEffect to listen to changes of the message variable.
    // Use a ref to access the current allLaserFigures value in an async callback
    // Синхронізуємо реф зі станом при кожному рендерінгу

    // https://felixgerschau.com/react-hooks-settimeout/
    setTimeout(() => {
      const updatedLaserFigures = clearLaserTail(id, allLasersFiguresByRef.current);

      setLaserFigure([...updatedLaserFigures])
    }, laserTime)
  }

  const clearLaserTail = (id, figures) => {
    const figure = figures.find(figure => figure.id === id);
    if (figure) {
      figure.points.shift();
    }

    return figures.filter(figure => figure.points.length > 0);
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
    }

    setActiveWidthIndex(newWidthIndex);
    setAllFigures([...allFigures]);
  };

  const handleChangeTool = (toolName) => {
    setActiveTool(toolName);
  };

  const moveFigureToTop = (figureId) => {
    const figureIndex = allFigures.findIndex((figure) => figure.id === figureId)
    const [figure] = allFigures.splice(figureIndex, 1)

    setAllFigures([...allFigures, figure]);
  };

  const isOnFigure = (x, y, figure) => {
    switch (figure.type) {
      case 'pen':
        return IsOnCurve(x, y, figure.points)
      case 'line':
        return IsOnLine(x, y, figure.points)
      case 'arrow':
        return IsOnArrow(x, y, figure.points)
      case 'oval':
        return IsOnOval(x, y, figure.points)
      case 'rectangle':
        return IsOnRectangle(x, y, figure.points)
      default:
        return false
    }
  };

  const getFigureAtMousePosition = (x, y) => {
    return allFigures.findLast((figure) => isOnFigure(x, y, figure));
  };

  const getDotNameAtMousePosition = (x, y) => {
    const activeFigure = findActiveFigure()

    switch (activeFigure.type) {
      case 'line':
      case 'arrow':
        return IsOnTwoDots(x, y, activeFigure.points) // ['pointA', 'pointB', null]
      case 'oval':
      case 'rectangle':
        return IsOnFourDots(x, y, activeFigure.points) // ['pointA', 'pointB', 'pointC', 'pointD', null]
    }
  }

  const setMouseCursor = (x, y) => {
    if (getFigureAtMousePosition(x, y)) {
      setCursorType('move');
    } else {
      setCursorType('crosshair');
    }
  };
  const setMouseCursorThrottle = throttle(setMouseCursor, 50);

  const dragFigure = (figure, oldCoordinates, newCoordinates) => {
    const offsetX = newCoordinates.x - oldCoordinates.x;
    const offsetY = newCoordinates.y - oldCoordinates.y;

    figure.points.forEach((point) => {
      point[0] += offsetX
      point[1] += offsetY
    })
  }

  const resizeFigure = (figure, resizingDotName, { x, y }) => {
    switch (resizingDotName) {
      case 'pointA':
        figure.points[0][0] = x
        figure.points[0][1] = y
        break;
      case 'pointB':
        figure.points[1][0] = x
        figure.points[1][1] = y
        break;
      case 'pointC':
        figure.points[0][0] = x
        figure.points[1][1] = y
        break;
      case 'pointD':
        figure.points[1][0] = x
        figure.points[0][1] = y
        break;
    }
  }

  const handleMouseDown = ({ x, y }) => {
    // Click on dots of the active figure
    if (activeFigureInfo) {
      const resizingDotName = getDotNameAtMousePosition(x, y);
      if (resizingDotName) {
        setActiveFigureInfo({ ...activeFigureInfo, resizing: true, resizingDotName: resizingDotName });
        return;
      }
    }

    // Click on the figure
    const selectedFigure = getFigureAtMousePosition(x, y);
    if (selectedFigure) {
      moveFigureToTop(selectedFigure.id)
      setActiveFigureInfo({ id: selectedFigure.id, dragging: true, x, y });
      return;
    }

    // Click out of figure
    if (activeFigureInfo) {
      setActiveFigureInfo(null);
      return;
    }

    if (activeTool === 'laser') {
      let laserFigure = {
        id: Date.now(),
        type: activeTool,
        points: [[x, y]],
      };

      setLaserFigure([...allLaserFigures, laserFigure]);
      scheduleClearLaserTail(laserFigure.id)
      setIsDrawing(true);
      return;
    }

    let newFigure = {
      id: Date.now(),
      type: activeTool,
      colorIndex: activeColorIndex,
      widthIndex: activeWidthIndex,
      points: [[x, y]],
    };

    if (['line', 'arrow', 'oval', 'rectangle'].includes(newFigure.type)) {
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

      if (activeTool === 'pen') {
        const currentFigure = allFigures[allFigures.length - 1];

        currentFigure.points = [...currentFigure.points, [x, y]];

        setAllFigures([...allFigures]);
        return
      }

      if (['line', 'arrow', 'oval', 'rectangle'].includes(activeTool)) {
        const currentFigure = allFigures[allFigures.length - 1];

        currentFigure.points[1] = [x, y];

        setAllFigures([...allFigures]);
        return
      }
    }

    setMouseCursorThrottle(x, y);
  };

  const handleMouseUp = () => {
    if (isDrawing) {
      if (activeTool === 'pen') {
        const currentFigure = allFigures[allFigures.length - 1];

        currentFigure.points = [...filterClosePoints(currentFigure.points)];

        if (currentFigure.points.length < 3) { // Min number of points to draw a curve
          currentFigure.points = [];
        }

        setAllFigures([...allFigures]);
      }
    }

    if (isActiveFigureMoving()) {
      setActiveFigureInfo({ id: activeFigureInfo.id });
    }

    setIsDrawing(false);
  };

  const handleMousePosition = (event) => {
    setMouseCoordinates(getMouseCoordinates(event));
  }

  // TOOD: Create IPC module
  // TOOD: Move to a IPC module
  const handleCloseToolBar = () => {
    window.electronAPI.invokeCloseToolBar();
  }

  const handleReset = () => {
    setActiveFigureInfo(null);
    setAllFigures([]);
  };

  const handleToggleToolbar = () => {
    setShowToolbar((prevShowToolbar) => !prevShowToolbar);
  };

  const handleToggleWhiteboard = () => {
    setShowWhiteboard((prevShowWhiteboard) => !prevShowWhiteboard);
  };

  return (
    <div id="root_wrapper" onMouseMove={handleMousePosition}>
      <div id="zone_borders"></div>

      {
        showWhiteboard &&
        <div id="whiteboard"></div>
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
        activeFigureInfo={activeFigureInfo}
        cursorType={cursorType}
        handleMouseDown={handleMouseDown}
        handleMouseMove={handleMouseMove}
        handleMouseUp={handleMouseUp}
      />

      {
        showToolbar &&
          <ToolBar
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
