import {
  getPerfectPath2D,
  getLazyPoints,
  distanceBetweenPoints,
  calcPointsArrow,
  calcSegmentsFlatArrow,
  buildArrowArcSegments,
  isSmallArrowFigure,
  getCornersWithMargin,
  getWrappedTextLines,
  getTextAutoResizeHandle,
} from '../../utils/general.js';
import {
  widthList,
  penVariantList,
  rainbowScaleFactor,
  dotRadius,
  dotStrokeWidth,
  dotHoverRadius,
  dotBorderColor,
  dotHoverColor,
  activeSelectionBoxLineWidth,
  erasedFigureColor,
  eraserTailColor,
  highlighterAlpha,
  eraserAlpha,
  lineHeightMultiplier,
} from '../../constants.js';

export const hslColor = (degree) => {
  return `hsl(${degree % 360}, 70%, 60%)`
}

const strokeSettings = (stroke, width) => {
  // [довжина штриха, довжина проміжку]
  if (stroke === 1) return [width * 3, width * 2];
  if (stroke === 2) return [0,         width * 2];

  return [];
};

function fadeAlpha(opacity) {
  return Math.round(opacity * 255).toString(16).padStart(2, '0');
}

const drawDot = (ctx, point, isHovered) => {
  const [x, y] = point;

  if (isHovered) {
    ctx.beginPath();
    ctx.arc(x, y, dotHoverRadius, 0, Math.PI * 2, true);
    ctx.fillStyle = dotHoverColor;
    ctx.fill();
  }

  ctx.beginPath();
  ctx.arc(x, y, dotRadius, 0, Math.PI * 2, true);
  ctx.fillStyle = '#FFF';
  ctx.fill();
  ctx.lineWidth = dotStrokeWidth;
  ctx.strokeStyle = dotBorderColor;
  ctx.stroke();
}

export const createGradient = (ctx, pointA, pointB, rainbowColorDeg, scale) => {
  const [distance, hslStops] = hslTextGradientStops(pointA, pointB, rainbowColorDeg, scale)

  if (hslStops.length === 1) {
    return [hslStops[0], distance];
  }

  const gradient = ctx.createLinearGradient(...pointA, ...pointB);

  hslStops.forEach((color, index) => {
    gradient.addColorStop(index / (hslStops.length - 1), color)
  })

  return [gradient, distance];
}

export const hslTextGradientStops = (pointA, pointB, colorDeg, scale) => {
  const actualScale = scale ?? 1;

  const distance = distanceBetweenPoints(pointA, pointB) * rainbowScaleFactor / actualScale

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

const detectColorAndWidth = (ctx, figure, updateRainbowColorDeg, colorList) => {
  const { points: [pointA, pointB], colorIndex, widthIndex, rainbowColorDeg, erased } = figure

  let color = colorList[colorIndex].color
  const width = widthList[widthIndex].figure_width

  if (colorList[colorIndex].isRainbow) {
    const [gradientColor, distance] = createGradient(ctx, pointA, pointB, rainbowColorDeg);
    color = gradientColor;

    updateRainbowColorDeg(currentDeg => Math.max(currentDeg, rainbowColorDeg + distance));
  }

  if (erased) {
    color = erasedFigureColor + fadeAlpha(eraserAlpha);
  }

  return [color, width]
}

const detectColorAndFontSize = (ctx, figure, updateRainbowColorDeg, colorList) => {
  const { points: [pointA], colorIndex, widthIndex, rainbowColorDeg, height, scale, erased } = figure;

  let color = colorList[colorIndex].color
  const fontSize = widthList[widthIndex].font_size
  let font_y_offset_compensation = widthList[widthIndex].font_y_offset_compensation

  const dpr = (window.devicePixelRatio || 1);
  if (dpr > 1) {
    font_y_offset_compensation = widthList[widthIndex].font_y_offset_compensation_retina
  }

  if (colorList[colorIndex].isRainbow) {
    const pointB = [pointA[0], pointA[1] + height * scale] // Vertical Gradient

    const [gradientColor, distance] = createGradient(ctx, pointA, pointB, rainbowColorDeg, scale);
    color = gradientColor;

    updateRainbowColorDeg(currentDeg => Math.max(currentDeg, rainbowColorDeg + distance));
  }

  if (erased) {
    color = erasedFigureColor + fadeAlpha(eraserAlpha);
  }

  return [color, fontSize, font_y_offset_compensation]
}

export const getCursorColor = (colorList, colorIndex, rainbowColorDeg) => {
  const colorInfo = colorList[colorIndex]

  if (colorInfo.isRainbow) {
    return hslColor(rainbowColorDeg)
  }

  return colorInfo.color
}

export const drawPen = (ctx, figure, colorList, options = {}) => {
  const { points, colorIndex, widthIndex } = figure;
  const { fadeOpacity = 1 } = options;

  const colorInfo = colorList[colorIndex]
  const widthInfo = widthList[widthIndex]

  let penColor = colorInfo.color

  if (figure.erased) {
    penColor = erasedFigureColor + fadeAlpha(Math.min(eraserAlpha, fadeOpacity));
  } else if (fadeOpacity < 1) {
    penColor = colorInfo.color + fadeAlpha(fadeOpacity);
  }

  const strokeOptions = {
    size: widthInfo.pen_pressure_width
  };

  if (penVariantList.includes(figure.type)) {
    strokeOptions.size = widthInfo.pen_fixed_width;
    strokeOptions.simulatePressure = false;
    strokeOptions.thinning = 0.0;
    strokeOptions.last = true;
  }

  const path2DData = getPerfectPath2D(points, strokeOptions);

  ctx.fillStyle = penColor;
  ctx.fill(path2DData);
}

export const drawRainbowPen = (ctx, offscreenCanvas, figure, updateRainbowColorDeg, fadeOpacity = 1) => {
  const { widthIndex } = figure;

  const offCtx = offscreenCanvas.getContext('2d');
  offCtx.clearRect(0, 0, offscreenCanvas.width, offscreenCanvas.height);

  const widthInfo = widthList[widthIndex]

  drawLazyRainbowLine(offCtx, figure, updateRainbowColorDeg, widthInfo.pen_fixed_width)

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
    } else if (distance < 0.5) { // Less than 0.5° hue change (~17 px between points).
      color = hslColor(colorDeg + distance / 2);
    } else  {
      const [gradientColor, _distance] = createGradient(ctx, pointA, pointB, colorDeg);
      color = gradientColor;
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

export const drawHighlighter = (ctx, figure, colorList) => {
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

export const drawArrow = (ctx, figure, updateRainbowColorDeg, colorList) => {
  const { points, widthIndex } = figure;

  const isSmallArrow = isSmallArrowFigure(points, widthIndex);
  const figurePoints = calcPointsArrow(points, widthIndex);
  const arcSegments = buildArrowArcSegments(figurePoints, widthIndex);

  const [color] = detectColorAndWidth(ctx, figure, updateRainbowColorDeg, colorList)
  const shadowColor = '#222';
  const shadowBlur = 2;
  const shadowOffsetX = 1;
  const shadowOffsetY = 2;

  ctx.fillStyle = color;
  ctx.shadowColor = shadowColor;
  ctx.shadowBlur = shadowBlur;
  ctx.shadowOffsetX = shadowOffsetX;
  ctx.shadowOffsetY = shadowOffsetY;

  if (figure.erased) {
    ctx.shadowColor = 'transparent';
  }

  ctx.beginPath();
  ctx.moveTo(...figurePoints[0]);

  arcSegments.forEach(({ entryPoint, cornerPoint, exitPoint, arcRadius }) => {
    if (isSmallArrow) {
      ctx.lineTo(...cornerPoint);
      return;
    }

    ctx.lineTo(...entryPoint);
    ctx.arcTo(cornerPoint[0], cornerPoint[1], exitPoint[0], exitPoint[1], arcRadius);
  });

  ctx.closePath();
  ctx.fill();

  ctx.shadowBlur = 0;
  ctx.shadowColor = 'transparent'; // Reset shadows
}

export const drawArrowActive = (ctx, figure, hoveredDot) => {
  const [pointA, pointB] = figure.points

  drawTwoDots(ctx, pointA, pointB, hoveredDot)
}

export const drawFlatArrow = (ctx, figure, updateRainbowColorDeg, colorList) => {
  const [color, width] = detectColorAndWidth(ctx, figure, updateRainbowColorDeg, colorList)
  const segments = calcSegmentsFlatArrow(figure.points, figure.widthIndex)
  const stroke = figure.strokeIndex

  segments.forEach(([pointA, pointB]) => {
    drawLineSkeleton(ctx, pointA, pointB, color, width, stroke)
  })
}

export const drawFlatArrowActive = (ctx, figure, hoveredDot) => {
  const [pointA, pointB] = figure.points

  drawTwoDots(ctx, pointA, pointB, hoveredDot)
}

export const drawStampActive = (ctx, figure, hoveredDot) => {
  const [, pointB] = figure.points;

  drawDot(ctx, pointB, hoveredDot === 'pointB');
};

export const drawLine = (ctx, figure, updateRainbowColorDeg, colorList) => {
  const { points: [pointA, pointB] } = figure
  const [color, width] = detectColorAndWidth(ctx, figure, updateRainbowColorDeg, colorList)
  const stroke = figure.strokeIndex

  drawLineSkeleton(ctx, pointA, pointB, color, width, stroke)
}

export const drawLineActive = (ctx, figure, hoveredDot) => {
  const [pointA, pointB] = figure.points

  drawTwoDots(ctx, pointA, pointB, hoveredDot)
}

const drawLineSkeleton = (ctx, pointA, pointB, color, width, stroke) => {
  const [startX, startY] = pointA;
  const [endX, endY] = pointB;
  const lineDashPattern = strokeSettings(stroke, width);

  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  ctx.setLineDash(lineDashPattern);

  ctx.beginPath();
  ctx.moveTo(startX, startY);
  ctx.lineTo(endX, endY);
  ctx.stroke();
  ctx.restore();
};

export const drawOval = (ctx, figure, updateRainbowColorDeg, colorList) => {
  const { points: [pointA, pointB] } = figure
  const [color, width] = detectColorAndWidth(ctx, figure, updateRainbowColorDeg, colorList)
  const stroke = figure.strokeIndex

  drawOvalSkeleton(ctx, pointA, pointB, color, width, stroke)
}

export const drawOvalActive = (ctx, figure, hoveredDot) => {
  const [pointA, pointB] = figure.points

  drawSelectionBoxWithDots(ctx, pointA, pointB, hoveredDot)
}

const drawOvalSkeleton = (ctx, pointA, pointB, color, width, stroke) => {
  const [startX, startY] = pointA;
  const [endX, endY] = pointB;
  const lineDashPattern = strokeSettings(stroke, width);

  const radiusX = Math.abs(endX - startX) / 2;
  const radiusY = Math.abs(endY - startY) / 2;
  const centerX = Math.min(startX, endX) + radiusX;
  const centerY = Math.min(startY, endY) + radiusY;

  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.setLineDash(lineDashPattern);

  ctx.beginPath();
  ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

export const drawRectangle = (ctx, figure, updateRainbowColorDeg, colorList) => {
  const { points: [pointA, pointB] } = figure
  const [color, width] = detectColorAndWidth(ctx, figure, updateRainbowColorDeg, colorList)
  const stroke = figure.strokeIndex
  const edge = figure.edgeIndex

  drawRectangleSkeleton(ctx, pointA, pointB, color, width, stroke, edge)
}

export const drawRectangleActive = (ctx, figure, hoveredDot) => {
  const [pointA, pointB] = figure.points

  drawSelectionBoxWithDots(ctx, pointA, pointB, hoveredDot)
}

const drawRectangleSkeleton = (ctx, pointA, pointB, color, width, stroke, edge) => {
  const [startX, startY] = pointA;
  const [endX, endY] = pointB;
  const lineDashPattern = strokeSettings(stroke, width);

  const left   = Math.min(startX, endX);
  const right  = Math.max(startX, endX);
  const top    = Math.min(startY, endY);
  const bottom = Math.max(startY, endY);

  const length = right - left;
  const height = bottom - top;

  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.setLineDash(lineDashPattern);

  ctx.beginPath();

  if (edge === 0) {
    ctx.moveTo(left, top);

    ctx.lineTo(right, top);
    ctx.lineTo(right, bottom);
    ctx.lineTo(left, bottom);
  } else {
    const radius = Math.min(Math.min(length, height) * 0.25, 32);

    ctx.moveTo(left + radius, top);

    ctx.lineTo(right - radius, top);
    ctx.quadraticCurveTo(right, top, right, top + radius);

    ctx.lineTo(right, bottom - radius);
    ctx.quadraticCurveTo(right, bottom, right - radius, bottom);

    ctx.lineTo(left + radius, bottom);
    ctx.quadraticCurveTo(left, bottom, left, bottom - radius);

    ctx.lineTo(left, top + radius);
    ctx.quadraticCurveTo(left, top, left + radius, top);
  }

  ctx.closePath();
  ctx.stroke();
  ctx.restore();
}

export const drawDiamond = (ctx, figure, updateRainbowColorDeg, colorList) => {
  const { points: [pointA, pointB] } = figure
  const [color, width] = detectColorAndWidth(ctx, figure, updateRainbowColorDeg, colorList)
  const stroke = figure.strokeIndex
  const edge = figure.edgeIndex

  drawDiamondSkeleton(ctx, pointA, pointB, color, width, stroke, edge)
}

export const drawDiamondActive = (ctx, figure, hoveredDot) => {
  const [pointA, pointB] = figure.points

  drawSelectionBoxWithDots(ctx, pointA, pointB, hoveredDot)
}

const drawDiamondSkeleton = (ctx, pointA, pointB, color, width, stroke, edge) => {
  const [startX, startY] = pointA;
  const [endX, endY] = pointB;
  const lineDashPattern = strokeSettings(stroke, width);

  const centerX = (startX + endX) / 2;
  const centerY = (startY + endY) / 2;

  const topCorner    = [centerX, Math.min(startY, endY)];
  const rightCorner  = [Math.max(startX, endX), centerY];
  const bottomCorner = [centerX, Math.max(startY, endY)];
  const leftCorner   = [Math.min(startX, endX), centerY];

  const offsetX = (rightCorner[0] - leftCorner[0]) / 8;
  const offsetY = (bottomCorner[1] - topCorner[1]) / 8;

  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.setLineDash(lineDashPattern);

  ctx.beginPath();

  if (edge === 0) {
    ctx.moveTo(...topCorner);

    ctx.lineTo(...rightCorner);
    ctx.lineTo(...bottomCorner);
    ctx.lineTo(...leftCorner);
  } else {
    ctx.moveTo(topCorner[0] + offsetX, topCorner[1] + offsetY);

    ctx.lineTo(rightCorner[0] - offsetX, rightCorner[1] - offsetY);
    ctx.bezierCurveTo(...rightCorner, ...rightCorner, rightCorner[0] - offsetX, rightCorner[1] + offsetY);

    ctx.lineTo(bottomCorner[0] + offsetX, bottomCorner[1] - offsetY);
    ctx.bezierCurveTo(...bottomCorner, ...bottomCorner, bottomCorner[0] - offsetX, bottomCorner[1] - offsetY);

    ctx.lineTo(leftCorner[0] + offsetX, leftCorner[1] + offsetY);
    ctx.bezierCurveTo(...leftCorner, ...leftCorner, leftCorner[0] + offsetX, leftCorner[1] - offsetY);

    ctx.lineTo(topCorner[0] - offsetX, topCorner[1] + offsetY);
    ctx.bezierCurveTo(...topCorner, ...topCorner, topCorner[0] + offsetX, topCorner[1] + offsetY);
  }

  ctx.closePath();
  ctx.stroke();
  ctx.restore();
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
  const width = widthList[widthIndex].pen_fixed_width

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

export const drawText = (ctx, figure, updateRainbowColorDeg, isActive, hoveredDot, colorList) => {
  const { points: [startAt], text, scale, width, height, widthIndex } = figure;

  const [color, fontSize, font_y_offset_compensation] = detectColorAndFontSize(ctx, figure, updateRainbowColorDeg, colorList)

  drawTextSkeleton(ctx, startAt, text, color, fontSize, font_y_offset_compensation, scale, width, widthIndex)

  if (isActive) {
    const endAt = [
      startAt[0] + width * scale,
      startAt[1] + height * scale,
    ];

    drawSelectionBoxWithDots(ctx, startAt, endAt, hoveredDot)
    drawTextAutoResizeHandle(ctx, figure);

    // FOR DEV: Обведення прямокутника
    // ctx.strokeStyle = "red";
    // ctx.lineWidth = 1;
    // ctx.strokeRect(...startAt, width * scale, height * scale);
  }
}

const drawTextAutoResizeHandle = (ctx, figure) => {
  if (figure.autoResize) return;

  const handle = getTextAutoResizeHandle(figure);
  if (!handle) return;

  ctx.lineWidth = dotStrokeWidth;
  ctx.strokeStyle = dotBorderColor;
  ctx.lineCap = 'round';

  ctx.beginPath();
  ctx.moveTo(...handle.startAt);
  ctx.lineTo(...handle.endAt);
  ctx.stroke();
}

const drawTextSkeleton = (ctx, [startX, startY], text, color, fontSize, font_y_offset_compensation, scale, width, widthIndex) => {
  ctx.save();
  ctx.translate(startX, startY);
  ctx.scale(scale, scale);

  ctx.textBaseline = "top";
  ctx.font = `${fontSize}px Excalifont`;
  ctx.fillStyle = color;

  const lines = getWrappedTextLines(text, widthIndex, width);

  const lineHeight = fontSize * lineHeightMultiplier;

  lines.forEach((line, index) => {
    ctx.fillText(line, 0, index * lineHeight + font_y_offset_compensation);
  });

  ctx.restore();
}

const drawSelectionBox = (ctx, startX, startY, endX, endY) => {
  ctx.strokeStyle = dotBorderColor;
  ctx.lineWidth = activeSelectionBoxLineWidth;
  ctx.strokeRect(startX, startY, endX - startX, endY - startY);
}

const drawTwoDots = (ctx, pointA, pointB, hoveredDot) => {
  drawDot(ctx, pointA, hoveredDot === 'pointA')
  drawDot(ctx, pointB, hoveredDot === 'pointB')
}

const drawSelectionBoxWithDots = (ctx, pointA, pointB, hoveredDot) => {
  const { pointAwithMargin, pointBwithMargin, pointCwithMargin, pointDwithMargin } = getCornersWithMargin(pointA, pointB)

  drawSelectionBox(ctx, ...pointAwithMargin, ...pointBwithMargin)

  drawDot(ctx, pointAwithMargin, hoveredDot === 'pointA')
  drawDot(ctx, pointBwithMargin, hoveredDot === 'pointB')
  drawDot(ctx, pointCwithMargin, hoveredDot === 'pointC')
  drawDot(ctx, pointDwithMargin, hoveredDot === 'pointD')
}
