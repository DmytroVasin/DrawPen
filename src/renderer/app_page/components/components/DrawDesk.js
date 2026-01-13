import './DrawDesk.scss';

import React, { useEffect, useRef } from 'react';
import { getMouseCoordinates } from '../utils/general.js';
import {
  drawFigure,
  drawFigureActive,

  drawPen,
  drawHighlighter,
  drawArrow,
  drawArrowActive,
  drawLaser,
  drawEraserTail,
  drawText,
} from './drawer/figures.js';

const DrawDesk = ({
  allFigures,
  allLaserFigures,
  allEraserFigures,
  activeFigureInfo,
  cursorType,
  handleMouseDown,
  handleMouseMove,
  handleMouseUp,
  handleDoubleClick,
  updateRainbowColorDeg,
}) => {
  // console.log('DrawDesk render');
  const canvasRef = useRef(null);
  const dpr = window.devicePixelRatio || 1;

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    canvas.width = Math.floor(window.innerWidth * dpr);
    canvas.height = Math.floor(window.innerHeight * dpr);

    ctx.scale(dpr, dpr);

    canvas.style.width = `${window.innerWidth}px`;
    canvas.style.height = `${window.innerHeight}px`;
  }, []);

  useEffect(() => {
    draw(allFigures, allLaserFigures, allEraserFigures, activeFigureInfo)
  }, [allFigures, allLaserFigures, allEraserFigures, activeFigureInfo]);

  const isFigureActiveAndStatic = (figure) => {
    return activeFigureInfo &&
           figure.id === activeFigureInfo.id &&
           !activeFigureInfo.dragging &&
           !activeFigureInfo.resizing;
  }

  const draw = (allFigures, allLaserFigures, allEraserFigures, activeFigureInfo) => {
    const ctx = canvasRef.current.getContext('2d');
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

    allFigures.forEach((figure) => {
      if (figure.type === 'pen') {
        drawPen(ctx, figure, updateRainbowColorDeg)
      }

      if (figure.type === 'highlighter') {
        drawHighlighter(ctx, figure)
      }

      if (figure.type === 'arrow') {
        drawArrow(ctx, figure, updateRainbowColorDeg)

        if (isFigureActiveAndStatic(figure)) {
          drawArrowActive(ctx, figure)
        }
      }

      if (['rectangle', 'oval', 'line'].includes(figure.type)) {
        drawFigure(ctx, figure, updateRainbowColorDeg)

        if (isFigureActiveAndStatic(figure)) {
          drawFigureActive(ctx, figure)
        }
      }

      if (figure.type === 'text') {
        let isActive = false;

        if (isFigureActiveAndStatic(figure)) {
          isActive = true;
        }

        drawText(ctx, figure, updateRainbowColorDeg, isActive)
      }
    })

    allLaserFigures.forEach((figure) => {
      drawLaser(ctx, figure)
    })

    allEraserFigures.forEach((figure) => {
      drawEraserTail(ctx, figure)
    })
  };

  const onPointerDown = (event) => {
    event.preventDefault(); // NOTE: Required for Text figure

    if(event.pointerType === 'mouse' && event.button === 2) return;

    event.currentTarget.setPointerCapture(event.pointerId);

    const coordinates = getMouseCoordinates(event)
    handleMouseDown(coordinates);
  }

  const onPointerMove = (event) => {
    const coordinates = getMouseCoordinates(event)

    handleMouseMove(coordinates);
  }

  const onPointerUp = (event) => {
    const coordinates = getMouseCoordinates(event)

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    handleMouseUp(coordinates);
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
