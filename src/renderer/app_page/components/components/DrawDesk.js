import './DrawDesk.scss';

import React, { useEffect, useRef } from 'react';
import { getMouseCoordinates } from '../utils/general.js';
import {
  drawPen,
  drawLine,
  drawLineActive,
  drawArrow,
  drawArrowActive,
  drawOval,
  drawOvalActive,
  drawRectangle,
  drawRectangleActive,
  drawLaser,
} from './drawer/figures.js';

const DrawDesk = ({
  allFigures,
  allLaserFigures,
  activeFigureInfo,
  cursorType,
  handleMouseDown,
  handleMouseMove,
  handleMouseUp,
  updateRainbowColorDeg,
}) => {
  // console.log('DrawDesk render');
  const canvasRef = useRef(null);

  useEffect(() => {
    canvasRef.current.width = window.innerWidth;
    canvasRef.current.height = window.innerHeight;
  }, []);

  useEffect(() => {
    draw(allFigures, allLaserFigures, activeFigureInfo)
  }, [allFigures, allLaserFigures, activeFigureInfo]);

  const draw = (allFigures, allLaserFigures, activeFigureInfo) => {
    const ctx = canvasRef.current.getContext('2d');
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

    allFigures.forEach((figure) => {
      if (figure.type === 'pen') {
        drawPen(ctx, figure, updateRainbowColorDeg)
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
    })

    allLaserFigures.forEach((figure) => {
      drawLaser(ctx, figure)
    })
  };

  const onMouseDown = (event) => {
    if(event.button === 2) return;

    const coordinates = getMouseCoordinates(event)

    handleMouseDown(coordinates);
  }

  const onMouseMove = (event) => {
    let coordinates = getMouseCoordinates(event)

    handleMouseMove(coordinates);
  }

  return (
    <canvas
      id="canvas"
      ref={canvasRef}
      style={{ cursor: cursorType }}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={handleMouseUp}
    />
  );
};

export default DrawDesk;
