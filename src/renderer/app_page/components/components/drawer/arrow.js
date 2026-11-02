import {
  erasedFigureColor,
  eraserAlpha,
  outlinedFigureBgColor,
  outlinedFigureDarkBgColor,
  outlinedFigureEdgeColor,
  outlinedFigureInnerBorderWidthList,
} from '../../constants.js';
import {
  calcPointsArrow,
  distanceBetweenPoints,
} from '../../utils/general.js';
import { createGradient } from './figures.js';

// White Background: 2/2/3/4/5px, Gray Background: 1px
const arrowBorderWidthList = outlinedFigureInnerBorderWidthList.map((innerBorderWidth) => {
  return {
    outerBorderWidth: innerBorderWidth + 2,
    innerBorderWidth,
  };
});

const createArrowPath = (figure) => {
  const { points, widthIndex } = figure;

  const arrowPoints = calcPointsArrow(points, widthIndex);

  const cornerOffset = [2, 3, 4, 5, 6][widthIndex];

  const corners = arrowPoints.map((cornerPoint, index) => {
    const prevPoint = arrowPoints[(index - 1 + arrowPoints.length) % arrowPoints.length];
    const nextPoint = arrowPoints[(index + 1) % arrowPoints.length];

    const prevLength = distanceBetweenPoints(cornerPoint, prevPoint);
    const nextLength = distanceBetweenPoints(cornerPoint, nextPoint);
    const safeOffset = Math.min(cornerOffset, prevLength * 0.35, nextLength * 0.35);

    const entryPoint = [
      cornerPoint[0] + (prevPoint[0] - cornerPoint[0]) * safeOffset / prevLength,
      cornerPoint[1] + (prevPoint[1] - cornerPoint[1]) * safeOffset / prevLength,
    ];
    const exitPoint = [
      cornerPoint[0] + (nextPoint[0] - cornerPoint[0]) * safeOffset / nextLength,
      cornerPoint[1] + (nextPoint[1] - cornerPoint[1]) * safeOffset / nextLength,
    ];

    return { entryPoint, cornerPoint, exitPoint };
  });

  // SVG-контур зі скругленням кутів без виходу за межі сусідніх сторін.
  const pathData = corners.map(({ entryPoint, cornerPoint, exitPoint }) => {
    return `L ${entryPoint} Q ${cornerPoint} ${exitPoint}`;
  }).join(' ');

  return new Path2D(`M ${corners.at(-1).exitPoint} ${pathData} Z`);
};

const detectArrowColors = (ctx, figure, updateRainbowColorDeg, colorList) => {
  const { points: [pointA, pointB], colorIndex, rainbowColorDeg, erased } = figure;

  let color = colorList[colorIndex].color;
  let backgroundColor = outlinedFigureBgColor;

  if (colorList[colorIndex].isLightColor) {
    backgroundColor = outlinedFigureDarkBgColor;
  }

  if (colorList[colorIndex].isRainbow) {
    const [gradientColor, distance] = createGradient(ctx, pointA, pointB, rainbowColorDeg);
    color = gradientColor;

    updateRainbowColorDeg(currentDeg => Math.max(currentDeg, rainbowColorDeg + distance));
  }

  if (erased) {
    color = erasedFigureColor;
    backgroundColor = outlinedFigureBgColor;
  }

  return [color, backgroundColor];
};

export const drawArrow = (ctx, offscreenCanvas, figure, updateRainbowColorDeg, colorList) => {
  if (figure.erased) {
    const offCtx = offscreenCanvas.getContext('2d');
    offCtx.clearRect(0, 0, offscreenCanvas.width, offscreenCanvas.height);

    drawArrowBody(offCtx, figure, updateRainbowColorDeg, colorList);

    // Прозорість застосовується до всієї стрілки після складання її частин.
    ctx.save();
    ctx.globalAlpha = eraserAlpha;
    ctx.resetTransform();
    ctx.drawImage(offscreenCanvas, 0, 0);
    ctx.restore();
    return;
  }

  drawArrowBody(ctx, figure, updateRainbowColorDeg, colorList);
};

const drawArrowBody = (ctx, figure, updateRainbowColorDeg, colorList) => {
  const { widthIndex } = figure;

  const [color, backgroundColor] = detectArrowColors(ctx, figure, updateRainbowColorDeg, colorList);

  const arrowPath = createArrowPath(figure);

  ctx.save();
  // ctx.translate(...pointA);
  // ctx.rotate(angle); // points are in correct direction - so we do not need this
  ctx.lineJoin = 'round';

  drawArrowPath(ctx, arrowPath, color, backgroundColor, widthIndex);
  ctx.restore();
};

const drawArrowPath = (ctx, path, color, backgroundColor, widthIndex) => {
  const { outerBorderWidth, innerBorderWidth } = arrowBorderWidthList[widthIndex];

  // Малюємо зовнішню сіру обводку.
  ctx.strokeStyle = outlinedFigureEdgeColor;
  ctx.lineWidth = outerBorderWidth;
  ctx.stroke(path);

  // Заповнюємо внутрішню частину контуру.
  // Заливка перекриває внутрішню половину сірої обводки.
  ctx.fillStyle = color;
  ctx.fill(path);

  // Малюємо внутрішню білу або темну обводку.
  ctx.strokeStyle = backgroundColor;
  ctx.lineWidth = innerBorderWidth;
  ctx.stroke(path);
};
