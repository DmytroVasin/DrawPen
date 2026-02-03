import {
  getPerfectPath2D,
  getLazyPoints,
  distanceBetweenPoints,
  calcPointsArrow,
} from '../../utils/general.js';
import {
  colorList,
  widthList,
  rainbowScaleFactor,
  dotMargin,
  erasedFigureColor,
  eraserTailColor,
  highlighterAlpha,
  eraserAlpha,
} from '../../constants.js'

const hslColor = (degree) => {
  return `hsl(${degree % 360}, 70%, 60%)`
}

function fadeAlpha(opacity) {
  return Math.round(opacity * 255).toString(16).padStart(2, '0');
}

const drawDot = (ctx, point) => {
  const [x, y] = point;

  ctx.beginPath();
  ctx.arc(x, y, 9, 0, Math.PI*2, true);
  ctx.fillStyle = '#DDD';
  ctx.fill();

  ctx.beginPath();
  ctx.arc(x, y, 8, 0, Math.PI*2, true);
  ctx.fillStyle = '#FFF';
  ctx.fill();

  ctx.beginPath();
  ctx.arc(x, y, 6, 0, Math.PI*2, true);
  ctx.fillStyle = '#6CC3E2';
  ctx.fill();
}

const createGradient = (ctx, pointA, pointB, rainbowColorDeg, updateRainbowColorDeg) => {
  const [distance, hslStops] = hslTextGradientStops(pointA, pointB, rainbowColorDeg)

  if (hslStops.length === 1) {
    return hslStops[0]
  }

  const gradient = ctx.createLinearGradient(...pointA, ...pointB);

  hslStops.forEach((color, index) => {
    gradient.addColorStop(index / (hslStops.length - 1), color)
  })

  updateRainbowColorDeg(rainbowColorDeg + distance)
  return gradient
}

export const hslTextGradientStops = (pointA, pointB, colorDeg) => {
  const distance = distanceBetweenPoints(pointA, pointB) * rainbowScaleFactor

  const amountOfColorChanges = Math.round(distance)

  const hslStops = []
  for (let i = 0; i <= amountOfColorChanges; i++) {
    let color = hslColor(colorDeg + i)

    hslStops.push(color)
  }

  if (amountOfColorChanges === 0) {
    hslStops.push(hslColor(colorDeg))
  }

  return [distance, hslStops];
}

const activeColorAndWidth = (figure) => {
  const { colorIndex } = figure;
  const width = 2;

  if (colorList[colorIndex].name === 'color_white') {
    return ['#6CC3E2', width]
  }

  return ['#FFF', width]
}

const detectColorAndWidth = (ctx, figure, updateRainbowColorDeg) => {
  const { points: [pointA, pointB], colorIndex, widthIndex, rainbowColorDeg, erased } = figure

  let color = colorList[colorIndex].color
  const width = widthList[widthIndex].figure_size

  if (colorList[colorIndex].name === 'color_rainbow') {
    color = createGradient(ctx, pointA, pointB, rainbowColorDeg, updateRainbowColorDeg)
  }

  if (erased) {
    color = erasedFigureColor + fadeAlpha(eraserAlpha);
  }

  return [color, width]
}

const detectColorAndFontSize = (ctx, figure, updateRainbowColorDeg) => {
  const { points: [pointA], colorIndex, widthIndex, rainbowColorDeg, width, height, erased } = figure;

  let color = colorList[colorIndex].color
  const fontSize = widthList[widthIndex].font_size
  let font_y_offset_compensation = widthList[widthIndex].font_y_offset_compensation

  const dpr = (window.devicePixelRatio || 1);
  if (dpr > 1) {
    font_y_offset_compensation = widthList[widthIndex].font_y_offset_compensation_retina
  }

  if (colorList[colorIndex].name === 'color_rainbow') {
    const pointB = [pointA[0], pointA[1] + height] // Vertical Gradient

    color = createGradient(ctx, pointA, pointB, rainbowColorDeg, updateRainbowColorDeg)
  }

  if (erased) {
    color = erasedFigureColor + fadeAlpha(eraserAlpha);
  }

  return [color, fontSize, font_y_offset_compensation]
}

export const getCursorColor = (colorIndex, rainbowColorDeg) => {
  const colorInfo = colorList[colorIndex]

  if (colorInfo.name === 'color_rainbow') {
    return hslColor(rainbowColorDeg)
  }

  return colorInfo.color
}

export const drawPen = (ctx, figure, fadeOpacity = 1) => {
  const { points, colorIndex, widthIndex } = figure;

  const colorInfo = colorList[colorIndex]
  const widthInfo = widthList[widthIndex]

  let penColor = colorInfo.color

  if (figure.erased) {
    penColor = erasedFigureColor + fadeAlpha(Math.min(eraserAlpha, fadeOpacity));
  } else if (fadeOpacity < 1) {
    penColor = colorInfo.color + fadeAlpha(fadeOpacity);
  }

  const path2DData = getPerfectPath2D(points, { size: widthInfo.pen_width });

  ctx.fillStyle = penColor;
  ctx.fill(path2DData);
}

export const drawRainbowPen = (ctx, offscreenCanvas, figure, updateRainbowColorDeg, fadeOpacity = 1) => {
  const { widthIndex } = figure;

  const offCtx = offscreenCanvas.getContext('2d');
  offCtx.clearRect(0, 0, offscreenCanvas.width, offscreenCanvas.height);

  const widthInfo = widthList[widthIndex]

  drawLazyRainbowLine(offCtx, figure, updateRainbowColorDeg, widthInfo.rainbow_pen_width)

  let alpha = fadeOpacity;

  if (figure.erased) {
    alpha = Math.min(eraserAlpha, fadeOpacity);
  }

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.resetTransform();
  ctx.drawImage(offscreenCanvas, 0, 0);
  ctx.restore();
}

const drawLazyRainbowLine = (ctx, figure, updateRainbowColorDeg, width) => {
  const { points, rainbowColorDeg, erased } = figure;

  const lazyPoints = getLazyPoints(points, { size: width })
  let colorDeg = rainbowColorDeg

  lazyPoints.forEach((point, index) => {
    if (index === 0) return;

    const pointA = lazyPoints[index-1]
    const pointB = point

    const distance = distanceBetweenPoints(pointA, pointB) * rainbowScaleFactor

    let color
    if (erased) {
      color = erasedFigureColor
    } else  {
      color = hslColor(colorDeg + distance / 2);
    }

    ctx.beginPath()
    ctx.lineWidth = width
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.moveTo(pointA[0], pointA[1])
    ctx.lineTo(pointB[0], pointB[1]);

    ctx.strokeStyle = color
    ctx.stroke()

    colorDeg += distance
  })

  updateRainbowColorDeg(colorDeg)
}

export const drawHighlighter = (ctx, figure) => {
  const { points, colorIndex, widthIndex } = figure;

  const colorInfo = colorList[colorIndex]
  const widthInfo = widthList[widthIndex]

  let highlighterColor = colorInfo.color + fadeAlpha(highlighterAlpha);
  if (figure.erased) {
    highlighterColor = erasedFigureColor + fadeAlpha(highlighterAlpha);
  }

  const path2DData = getPerfectPath2D(points, {
    size: widthInfo.highlighter_width,
    simulatePressure: false,
    thinning: 0.0
  });

  ctx.fillStyle = highlighterColor;
  ctx.fill(path2DData);
}

export const drawRainbowHighlighter = (ctx, offscreenCanvas, figure, updateRainbowColorDeg) => {
  const { widthIndex } = figure;

  const offCtx = offscreenCanvas.getContext('2d');
  offCtx.clearRect(0, 0, offscreenCanvas.width, offscreenCanvas.height);

  const widthInfo = widthList[widthIndex]

  drawLazyRainbowLine(offCtx, figure, updateRainbowColorDeg, widthInfo.highlighter_width);

  let alpha = highlighterAlpha;

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.resetTransform();
  ctx.drawImage(offscreenCanvas, 0, 0);
  ctx.restore();
}

export const drawArrow = (ctx, figure, updateRainbowColorDeg) => {
  const { points, widthIndex } = figure;
  const { figurePoints, tailPoints } = calcPointsArrow(points, widthIndex);
  const [color, _width] = detectColorAndWidth(ctx, figure, updateRainbowColorDeg)

  let shadowColor = '#222';
  let shadowBlur = 4;
  let shadowOffsetX = 1;
  let shadowOffsetY = 2;

  ctx.fillStyle = color;
  ctx.shadowColor = shadowColor;
  ctx.shadowBlur = shadowBlur;
  ctx.shadowOffsetX = shadowOffsetX;
  ctx.shadowOffsetY = shadowOffsetY;

  ctx.beginPath();

  figurePoints.forEach((point, index) => {
    if (index === 0) {
      ctx.moveTo(...point)
      return
    }

    ctx.lineTo(...point)
  });

  ctx.bezierCurveTo(...tailPoints[0], ...tailPoints[1], ...figurePoints[0]);

  ctx.closePath();
  ctx.fill();

  ctx.shadowBlur = 0;
  ctx.shadowColor = 'transparent'; // Reset shadows
}

export const drawArrowActive = (ctx, figure) => {
  drawDotsForFigure(ctx, figure)
}

export const drawLine = (ctx, figure, updateRainbowColorDeg) => {
  const { points: [pointA, pointB] } = figure
  const [color, width] = detectColorAndWidth(ctx, figure, updateRainbowColorDeg)

  drawLineSkeleton(ctx, pointA, pointB, color, width)
}

export const drawLineActive = (ctx, figure) => {
  const [pointA, pointB] = figure.points
  const [color, width] = activeColorAndWidth(figure)

  drawLineSkeleton(ctx, pointA, pointB, color, width)

  drawDotsForFigure(ctx, figure)
}

const drawLineSkeleton = (ctx, pointA, pointB, color, width) => {
  const [startX, startY] = pointA;
  const [endX, endY] = pointB;

  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = 'round';

  ctx.beginPath();
  ctx.moveTo(startX, startY);
  ctx.lineTo(endX, endY);
  ctx.stroke();
};

export const drawOval = (ctx, figure, updateRainbowColorDeg) => {
  const { points: [pointA, pointB] } = figure
  const [color, width] = detectColorAndWidth(ctx, figure, updateRainbowColorDeg)

  drawOvalSkeleton(ctx, pointA, pointB, color, width)
}

export const drawOvalActive = (ctx, figure) => {
  const [pointA, pointB] = figure.points
  const [color, width] = activeColorAndWidth(figure)

  drawOvalSkeleton(ctx, pointA, pointB, color, width)

  drawDotsForFigure(ctx, figure)
}

const drawOvalSkeleton = (ctx, pointA, pointB, color, width) => {
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

export const drawRectangle = (ctx, figure, updateRainbowColorDeg) => {
  const { points: [pointA, pointB] } = figure
  const [color, width] = detectColorAndWidth(ctx, figure, updateRainbowColorDeg)

  drawRectangleSkeleton(ctx, pointA, pointB, color, width)
}

export const drawRectangleActive = (ctx, figure) => {
  const [pointA, pointB] = figure.points
  const [color, width] = activeColorAndWidth(figure)

  drawRectangleSkeleton(ctx, pointA, pointB, color, width)
  drawDotsForFigure(ctx, figure)
}

const drawRectangleSkeleton = (ctx, pointA, pointB, color, width) => {
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

export const drawLaser = (ctx, figure) => {
  const { points, widthIndex } = figure
  const [innerWidth, otherWidth] = widthList[widthIndex].laser_width;

  const path2DDataOther = getPerfectPath2D(points, {
    size: otherWidth,
    simulatePressure: false,
    start: { taper: true, cap: true },
  });

  const path2DDataInner = getPerfectPath2D(points, {
    size: innerWidth,
    simulatePressure: false,
    start: { taper: true, cap: true },
  });

  ctx.shadowBlur = 10;
  ctx.shadowColor = '#FF2D21';
  ctx.fillStyle = '#EA3323CC';

  ctx.fill(path2DDataOther);

  ctx.fillStyle = '#FFF';

  ctx.fill(path2DDataInner);

  ctx.shadowBlur = 0;
  ctx.shadowColor = 'transparent'; // Reset shadows
}

export const drawEraserTail = (ctx, figure) => {
  const { points, widthIndex } = figure
  const width = widthList[widthIndex].figure_size

  const path2DData = getPerfectPath2D(points, {
    size: width,
    simulatePressure: false,
    start: { taper: true, cap: true },
  });

  ctx.shadowBlur = 10;
  ctx.fillStyle = eraserTailColor;

  ctx.fill(path2DData);

  ctx.shadowBlur = 0;
}

export const drawText = (ctx, figure, updateRainbowColorDeg, isActive) => {
  const { points: [startAt], text, scale, width, height } = figure;

  const [color, fontSize, font_y_offset_compensation] = detectColorAndFontSize(ctx, figure, updateRainbowColorDeg)

  drawTextSkeleton(ctx, startAt, text, color, fontSize, font_y_offset_compensation, scale)

  if (isActive) {
    const [startX, startY] = startAt;
    const endX = startX + width * scale;
    const endY = startY + height * scale;

    const startXwithMargin = startX - dotMargin
    const startYwithMargin = startY - dotMargin
    const endXwithMargin = endX + dotMargin
    const endYwithMargin = endY + dotMargin

    drawSelectionBox(ctx, startXwithMargin, startYwithMargin, endXwithMargin, endYwithMargin)

    drawDot(ctx, [startXwithMargin, startYwithMargin])
    drawDot(ctx, [endXwithMargin,   endYwithMargin])
    drawDot(ctx, [startXwithMargin, endYwithMargin])
    drawDot(ctx, [endXwithMargin,   startYwithMargin])

    // FOR DEV: Обведення прямокутника
    // ctx.strokeStyle = "red";
    // ctx.lineWidth = 1;
    // ctx.strokeRect(startX, startY, width * scale, height * scale);
  }
}

const drawTextSkeleton = (ctx, [startX, startY], text, color, fontSize, font_y_offset_compensation, scale) => {
  ctx.save();
  ctx.translate(startX, startY);
  ctx.scale(scale, scale);

  ctx.textBaseline = "top";
  ctx.font = `${fontSize}px Excalifont`;
  ctx.fillStyle = color;

  const lineHeightMultiplier = 1.25;

  const lines = text.split('\n');
  const lineHeight = fontSize * lineHeightMultiplier;

  lines.forEach((line, index) => {
    ctx.fillText(line, 0, index * lineHeight + font_y_offset_compensation);
  });

  ctx.restore();
}

const drawSelectionBox = (ctx, startX, startY, endX, endY) => {
  ctx.strokeStyle = "#6CC3E2";
  ctx.lineWidth = 1;
  ctx.strokeRect(startX, startY, endX - startX, endY - startY);
}

const drawDotsForFigure = (ctx, figure) => {
  const [pointA, pointB] = figure.points

  drawDot(ctx, pointA)
  drawDot(ctx, pointB)

  if (['rectangle', 'oval'].includes(figure.type)) {
    const [startX, startY] = pointA;
    const [endX, endY] = pointB;

    drawDot(ctx, [startX, endY])
    drawDot(ctx, [endX, startY])
  }
}
