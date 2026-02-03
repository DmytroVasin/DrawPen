import './DrawDesk.scss';

import React, { useEffect, useRef } from 'react';
import { colorList } from '../constants.js'
import { getMouseCoordinates } from '../utils/general.js';
import {
  drawPen,
  drawRainbowPen,
  drawHighlighter,
  drawRainbowHighlighter,
  drawLine,
  drawLineActive,
  drawArrow,
  drawArrowActive,
  drawOval,
  drawOvalActive,
  drawRectangle,
  drawRectangleActive,
  drawLaser,
  drawEraserTail,
  drawText,
} from './drawer/figures.js';

const DrawDesk = ({
  allFigures,
  allFadeFigures,
  allLaserFigures,
  allEraserFigures,
  fadeOpacity,
  activeFigureInfo,
  cursorType,
  handleMouseDown,
  handleMouseMove,
  handleMouseUp,
  handleDoubleClick,
  updateRainbowColorDeg,
  activeTool,
  handleChangeTool,
}) => {

  const canvasRef = useRef(null);
  const offscreenCanvasRef = useRef(null);

  const prevToolRef = useRef(null);
  const simulateKeyDown = useRef(false);

  const dpr = window.devicePixelRatio || 1;

  useEffect(() => {
    // Main canvas layer setup
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    canvas.width = Math.floor(window.innerWidth * dpr);
    canvas.height = Math.floor(window.innerHeight * dpr);

    ctx.scale(dpr, dpr);

    canvas.style.width = `${window.innerWidth}px`;
    canvas.style.height = `${window.innerHeight}px`;

    // Offscreen canvas layer setup
    if (!offscreenCanvasRef.current) {
      offscreenCanvasRef.current = document.createElement('canvas');
    }

    const offscreenCanvas = offscreenCanvasRef.current;
    const offCtx = offscreenCanvas.getContext('2d');

    offscreenCanvas.width = canvas.width;
    offscreenCanvas.height = canvas.height;

    offCtx.scale(dpr, dpr);
  }, []);

  useEffect(() => {
    draw(allFigures, allFadeFigures, allLaserFigures, allEraserFigures, activeFigureInfo, fadeOpacity, offscreenCanvasRef.current);
  }, [allFigures, allFadeFigures, allLaserFigures, allEraserFigures, activeFigureInfo, fadeOpacity]);

  const draw = (allFigures, allFadeFigures, allLaserFigures, allEraserFigures, activeFigureInfo, fadeOpacity, offscreenCanvas) => {
    const ctx = canvasRef.current.getContext('2d');
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

    allFigures.forEach((figure) => {
      if (figure.type === 'pen') {
        if (colorList[figure.colorIndex].name === 'color_rainbow') {
          drawRainbowPen(ctx, offscreenCanvas, figure, updateRainbowColorDeg)
        } else {
          drawPen(ctx, figure)
        }
      }

      if (figure.type === 'highlighter') {
        if (colorList[figure.colorIndex].name === 'color_rainbow') {
          drawRainbowHighlighter(ctx, offscreenCanvas, figure, updateRainbowColorDeg)
        } else {
          drawHighlighter(ctx, figure)
        }
      }

      if (figure.type === 'arrow') {
        drawArrow(ctx, figure, updateRainbowColorDeg)

        if (activeFigureInfo && figure.id === activeFigureInfo.id) {
          drawArrowActive(ctx, figure)
        }
      }

      if (figure.type === 'line') {
        drawLine(ctx, figure, updateRainbowColorDeg)

        if (activeFigureInfo && figure.id === activeFigureInfo.id) {
          drawLineActive(ctx, figure)
        }
      }

      if (figure.type === 'rectangle') {
        drawRectangle(ctx, figure, updateRainbowColorDeg)

        if (activeFigureInfo && figure.id === activeFigureInfo.id) {
          drawRectangleActive(ctx, figure)
        }
      }

      if (figure.type === 'oval') {
        drawOval(ctx, figure, updateRainbowColorDeg)

        if (activeFigureInfo && figure.id === activeFigureInfo.id) {
          drawOvalActive(ctx, figure)
        }
      }

      if (figure.type === 'text') {
        let isActive = false;

        if (activeFigureInfo && figure.id === activeFigureInfo.id) {
          isActive = true;
        }

        drawText(ctx, figure, updateRainbowColorDeg, isActive)
      }
    })

    allFadeFigures.forEach((figure) => {
      if (figure.type === 'fadepen') {
        if (colorList[figure.colorIndex].name === 'color_rainbow') {
          drawRainbowPen(ctx, offscreenCanvas, figure, updateRainbowColorDeg, fadeOpacity)
        } else {
          drawPen(ctx, figure, fadeOpacity)
        }
      }
    })

    allLaserFigures.forEach((figure) => {
      drawLaser(ctx, figure)
    })

    allEraserFigures.forEach((figure) => {
      drawEraserTail(ctx, figure)
    })
  };

  const isPenEraser = (event) => {
    return (event.pointerType === 'pen' && event.button === 5) ||
           (event.pointerType === 'mouse' && event.button === 1);
  }

  const onPointerDown = (event) => {
    event.preventDefault(); // NOTE: Required for Text figure

    if(event.pointerType === 'mouse' && event.button === 2) return;

    if (isPenEraser(event) && activeTool !== 'eraser') {
      // Hard Trick! Rethink!
      prevToolRef.current = activeTool;
      simulateKeyDown.current = true;

      handleChangeTool('eraser');
      return
    }

    event.currentTarget.setPointerCapture(event.pointerId);

    const coordinates = getMouseCoordinates(event)
    handleMouseDown(coordinates);
  }

  const onPointerMove = (event) => {
    if (simulateKeyDown.current && activeTool === 'eraser') {
      simulateKeyDown.current = false;

      event.currentTarget.setPointerCapture(event.pointerId);

      const coordinates = getMouseCoordinates(event)
      handleMouseDown(coordinates);

      return;
    }

    const coordinates = getMouseCoordinates(event)

    handleMouseMove(coordinates);
  }

  const onPointerUp = (event) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    const coordinates = getMouseCoordinates(event)
    handleMouseUp(coordinates);

    if (prevToolRef.current) {
      handleChangeTool(prevToolRef.current);

      prevToolRef.current = null;
      simulateKeyDown.current = false;
    }
  }

  const onDoubleClick = (event) => {
    const coordinates = getMouseCoordinates(event);

    handleDoubleClick(coordinates);
  }

  return (
    <canvas
      id="canvas"
      ref={canvasRef}
      style={{ cursor: cursorType }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onDoubleClick={onDoubleClick}
    />
  );
};

export default DrawDesk;
