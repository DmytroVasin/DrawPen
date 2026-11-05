import {
  erasedFigureColor,
  eraserAlpha,
  outlinedFigureBgColor,
  outlinedFigureDarkBgColor,
  outlinedFigureEdgeColor,
  outlinedFigureInnerBorderWidthList,
  minArrowLength,
  arrowSetup,
} from '../../constants.js';
import { calcPointsArrow, distanceBetweenPoints } from '../../utils/general.js';
import { createGradient } from './figures.js';

// White Background: 1px at minArrowLength, 2/2/3/4/5px at max_scale_length, Gray Background: 1px
const getArrowBorderWidths = (widthIndex, arrowLength) => {
  const maxScaleLength = arrowSetup[widthIndex].max_scale_length;

  const scaleFactor = Math.min(Math.max((arrowLength - minArrowLength) / (maxScaleLength - minArrowLength), 0), 1);
  const innerBorderWidth = 1 + (outlinedFigureInnerBorderWidthList[widthIndex] - 1) * scaleFactor;

  return {
    outerBorderWidth: innerBorderWidth + 2,
    innerBorderWidth,
  };
};

const createArrowPath = (arrowPoints) => {
  return new Path2D(`M ${arrowPoints.join(' L ')} Z`);
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
  const { points, widthIndex } = figure;

  const [color, backgroundColor] = detectArrowColors(ctx, figure, updateRainbowColorDeg, colorList);

  ctx.save();
  // ctx.translate(...pointA);
  // ctx.rotate(angle); // points are in correct direction - so we do not need this
  ctx.lineJoin = 'round';

  drawArrowPath(ctx, points, color, backgroundColor, widthIndex);
  ctx.restore();
};

const drawArrowPath = (ctx, points, color, backgroundColor, widthIndex) => {
  const arrowPoints = calcPointsArrow(points, widthIndex);
  const path = createArrowPath(arrowPoints);

  const arrowLength = distanceBetweenPoints(arrowPoints[0], arrowPoints[3]);

  const { outerBorderWidth, innerBorderWidth } = getArrowBorderWidths(widthIndex, arrowLength);

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
