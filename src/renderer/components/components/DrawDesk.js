import './DrawDesk.css';

import React, { useEffect, useRef } from 'react';
import { getStroke } from 'perfect-freehand';
import { getSvgPathFromStroke, getMouseCoordinates } from '../utils/general.js';

import {
  colorList,
  widthList,
} from '../constants.js'

const DrawDesk = ({
  allFigures,
  allLaserFigures,
  activeFigureInfo,
  cursorType,
  handleMouseDown,
  handleMouseMove,
  handleMouseUp,
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
      const figureColor = colorList[figure.colorIndex].color
      const figureWidth = widthList[figure.widthIndex].width

      if (figure.type === 'pen') {
        drawPen(ctx, figure.points, figureColor, figureWidth)

        if (activeFigureInfo && figure.id === activeFigureInfo.id) {
          drawPenActive(ctx, figure.points)
        }
      }

      if (figure.type === 'arrow') {
        drawArrow(ctx, figure.points[0], figure.points[1], figureColor, figure.widthIndex)

        if (activeFigureInfo && figure.id === activeFigureInfo.id) {
          drawArrowActive(ctx, figure.points[0], figure.points[1])
        }
      }

      if (figure.type === 'line') {
        drawLine(ctx, figure.points[0], figure.points[1], figureColor, figureWidth)

        if (activeFigureInfo && figure.id === activeFigureInfo.id) {
          drawLineActive(ctx, figure.points[0], figure.points[1])
        }
      }

      if (figure.type === 'rectangle') {
        drawRectangle(ctx, figure.points[0], figure.points[1], figureColor, figureWidth)

        if (activeFigureInfo && figure.id === activeFigureInfo.id) {
          drawRectangleActive(ctx, figure.points[0], figure.points[1])
        }
      }

      if (figure.type === 'oval') {
        drawOval(ctx, figure.points[0], figure.points[1], figureColor, figureWidth)

        if (activeFigureInfo && figure.id === activeFigureInfo.id) {
          drawOvalActive(ctx, figure.points[0], figure.points[1])
        }
      }
    });

    allLaserFigures.forEach((figure) => {
      ctx.shadowBlur = 10;
      ctx.shadowColor = '#FF2D21';
      ctx.fillStyle = '#EA3323CC';

      const myStroke1 = getStroke(figure.points, {
        size: 18,
        simulatePressure: false,
        start: { taper: true, cap: true },
      });
      const pathData1 = getSvgPathFromStroke(myStroke1);
      ctx.fill(new Path2D(pathData1));

      ctx.fillStyle = '#FFF';
      const myStroke2 = getStroke(figure.points, {
        size: 8,
        simulatePressure: false,
        start: { taper: true, cap: true },
      });
      const pathData2 = getSvgPathFromStroke(myStroke2);
      ctx.fill(new Path2D(pathData2));
      ctx.shadowBlur = 0;
      ctx.shadowColor = 'transparent'; // Reset shadows
    })
  };

  const onMouseDown = (event) => {
    handleMouseDown(getMouseCoordinates(event));
  }

  const onMouseMove = (event) => {
    handleMouseMove(getMouseCoordinates(event));
  }

  // ========================== Canvas Drawing....
  const drawPen = (ctx, points, color, width) => {
    const myStroke = getStroke(points, { size: width });
    const pathData = getSvgPathFromStroke(myStroke);

    ctx.fillStyle = color;
    ctx.fill(new Path2D(pathData));
  }

  const drawPenActive = (ctx, points) => {
    const color = '#FFF'
    const width = 2

    drawPen(ctx, points, color, width)
  }

  const drawLine = (ctx, pointA, pointB, color, width) => {
    const [startX, startY] = pointA;
    const [endX, endY] = pointB;

    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';

    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.stroke();
    ctx.closePath();
  }

  const drawLineActive = (ctx, pointA, pointB) => {
    const color = '#FFF'
    const width = 2

    drawLine(ctx, pointA, pointB, color, width)

    resiableDot(ctx, pointA)
    resiableDot(ctx, pointB)
  }

  const resiableDot = (ctx, point) => {
    const [x, y] = point;

    ctx.beginPath();
    ctx.arc(x, y, 10, 0, Math.PI*2, true);
    ctx.fillStyle = '#fff';
    ctx.fill();

    ctx.beginPath();
    ctx.arc(x, y, 7, 0, Math.PI*2, true);
    ctx.fillStyle = '#6cc3e2';
    ctx.fill();
  }

  const getArrowParams = (pointA, pointB, width) => {
    const arrowWeights = [
      [[-18, 7], [-20, 24]],
      [[-38, 12], [-40, 36]],
      [[-58, 17], [-60, 48]],
    ];

    const maxScaleFactors = [0.8, 0.9, 1];

    const [startX, startY] = pointA;
    const [endX, endY] = pointB;

    let diffX = endX - startX;
    let diffY = endY - startY;
    let len = Math.sqrt(diffX ** 2 + diffY ** 2);

    let sin = diffX / len;
    let cos = diffY / len;

    const baseScaleFactor = len / 300;
    const maxScaleFactor = maxScaleFactors[width];
    const scaleFactor = Math.min(baseScaleFactor, maxScaleFactor);
    const pointWidth = [5, 7, 9]

    let arrowWidth = Math.max(0, scaleFactor * pointWidth[width]);
    let arrowPoints = [[0, -arrowWidth / 2]];

    const controlPoints = arrowWeights[width];
    controlPoints.forEach((control) => {
      let x = control[0] * scaleFactor;
      let y = control[1] * scaleFactor;
      arrowPoints.push([x < 0 ? len + x : x, -y]);
    });

    arrowPoints.push([len, 0]);
    controlPoints.reverse().forEach((control) => {
      let x = control[0] * scaleFactor;
      let y = control[1] * scaleFactor;
      arrowPoints.push([x < 0 ? len + x : x, y]);
    });

    arrowPoints.push([0, arrowWidth / 2]);

    let transformedPoints = arrowPoints.map(([x, y]) => {
      return [
        startX + x * sin - y * cos,
        startY + x * cos + y * sin
      ];
    });

    return { startX, startY, arrowWidth, angle: Math.atan2(diffY, diffX), transformedPoints };
  };

  const drawArrow = (ctx, pointA, pointB, color, width) => {
    const { startX, startY, arrowWidth, angle, transformedPoints } = getArrowParams(pointA, pointB, width);

    ctx.fillStyle = color;
    ctx.shadowColor = '#777';
    ctx.shadowBlur = 3;
    ctx.shadowOffsetX = 1;
    ctx.shadowOffsetY = 1;

    ctx.beginPath();

    transformedPoints.forEach((point, index) => {
      let [x, y] = point;

      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });

    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.shadowColor = 'transparent'; // Reset shadows

    ctx.beginPath();
    ctx.arc(startX, startY, arrowWidth / 2, angle - Math.PI / 2, angle + Math.PI / 2, true);
    ctx.closePath();
    ctx.fill();

    // if (active) {
    //   drawArrowOutline(ctx, transformedPoints, startX, startY, arrowWidth, angle)
    // }
  };

  // const drawArrowOutline = (ctx, points, startX, startY, arrowWidth, angle) => {
  //   ctx.strokeStyle = '#6cc3e2';
  //   ctx.lineWidth = 2;
  //   ctx.shadowBlur = 0;
  //   ctx.shadowColor = 'transparent';

  //   ctx.beginPath();

  //   points.forEach((point, index) => {
  //     let [x, y] = point;

  //     if (index === 0) {
  //       ctx.moveTo(x, y);
  //     } else {
  //       ctx.lineTo(x, y);
  //     }
  //   });

  //   ctx.closePath();
  //   ctx.stroke();

  //   ctx.beginPath();
  //   ctx.arc(startX, startY, arrowWidth / 2, angle - Math.PI / 2, angle + Math.PI / 2, true);
  //   ctx.closePath();
  //   ctx.stroke();
  // };

  const drawArrowActive = (ctx, pointA, pointB) => {
    const color = '#FFF'
    const width = 0 // Active color

    drawArrow(ctx, pointA, pointB, color, width)

    const [startX, startY] = pointA;
    const [endX, endY] = pointB;

    resiableDot(ctx, [startX, startY])
    resiableDot(ctx, [endX, endY])
  }

  const drawOval = (ctx, pointA, pointB, color, width) => {
    const [startX, startY] = pointA;
    const [endX, endY] = pointB;

    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.lineJoin = 'round';

    let radiusX = Math.abs(endX - startX) / 2;
    let radiusY = Math.abs(endY - startY) / 2;
    let centerX = Math.min(startX, endX) + radiusX;
    let centerY = Math.min(startY, endY) + radiusY;

    ctx.beginPath();
    ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, Math.PI * 2);
    ctx.stroke();
  }

  const drawOvalActive = (ctx, pointA, pointB) => {
    const color = '#FFF'
    const width = 2

    drawOval(ctx, pointA, pointB, color, width)

    const [startX, startY] = pointA;
    const [endX, endY] = pointB;

    resiableDot(ctx, [startX, startY])
    resiableDot(ctx, [endX, endY])
    resiableDot(ctx, [startX, endY])
    resiableDot(ctx, [endX, startY])
  }

  const drawRectangle = (ctx, pointA, pointB, color, width) => {
    const [startX, startY] = pointA;
    const [endX, endY] = pointB;

    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';

    let length = Math.abs(endX - startX);
    let height = Math.abs(endY - startY);
    let x = Math.min(startX, endX);
    let y = Math.min(startY, endY);

    let radius = 0;
    if (length > 20 && height > 20) radius = 10; // TODO: Adjust to be smooth

    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + length - radius, y);
    ctx.arc(x + length - radius, y + radius, radius, Math.PI * 1.5, Math.PI * 2);
    ctx.lineTo(x + length, y + height - radius);
    ctx.arc(x + length - radius, y + height - radius, radius, 0, Math.PI * 0.5);
    ctx.lineTo(x + radius, y + height);
    ctx.arc(x + radius, y + height - radius, radius, Math.PI * 0.5, Math.PI);
    ctx.lineTo(x, y + radius);
    ctx.arc(x + radius, y + radius, radius, Math.PI, Math.PI * 1.5);
    ctx.closePath();
    ctx.stroke();
  }

  const drawRectangleActive = (ctx, pointA, pointB) => {
    const color = '#FFF'
    const width = 2

    drawRectangle(ctx, pointA, pointB, color, width)

    const [startX, startY] = pointA;
    const [endX, endY] = pointB;

    resiableDot(ctx, [startX, startY])
    resiableDot(ctx, [endX, endY])
    resiableDot(ctx, [startX, endY])
    resiableDot(ctx, [endX, startY])
  }

  return (
    <canvas
      id="canvas"
      ref={canvasRef}
      style={{ cursor: cursorType }}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    />
  );
};

export default DrawDesk;
