import { getStroke } from 'perfect-freehand';
import { getSvgPathFromStroke, getLazyPoints, distanceBetweenPoints } from '../../utils/general.js';
import { colorList, widthList, rainbowScaleFactor } from '../../constants.js'

const hslColor = (degree) => {
  return `hsl(${degree % 360}, 70%, 60%)`
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
  let colorDeg = rainbowColorDeg

  const distance = distanceBetweenPoints(pointA, pointB) * rainbowScaleFactor

  const amountOfColorChanges = Math.round(distance)

  if (amountOfColorChanges === 0) {
    return hslColor(colorDeg)
  }

  const gradient = ctx.createLinearGradient(...pointA, ...pointB);

  for (let i = 0; i <= amountOfColorChanges; i++) {
    let color = hslColor(colorDeg + i)

    gradient.addColorStop(i / amountOfColorChanges, color)
  }

  updateRainbowColorDeg(rainbowColorDeg + distance)
  return gradient
}

const activeColorAndWidth = () => {
  return ['#FFF', 1]
}

const detectColorAndWidth = (ctx, pointA, pointB, colorIndex, widthIndex, rainbowColorDeg, updateRainbowColorDeg) => {
  let color = colorList[colorIndex].color
  const width = widthList[widthIndex].figure_size

  if (colorList[colorIndex].name === 'color_rainbow') {
    color = createGradient(ctx, pointA, pointB, rainbowColorDeg, updateRainbowColorDeg)
  }

  return [color, width]
}

export const drawPen = (ctx, figure, updateRainbowColorDeg) => {
  const { points, colorIndex, widthIndex, rainbowColorDeg } = figure;

  const colorInfo = colorList[colorIndex]
  const widthInfo = widthList[widthIndex]

  if (colorInfo.name === 'color_rainbow') {
    drawLazyPen(ctx, points, widthInfo.rainbow_pen_width, rainbowColorDeg, updateRainbowColorDeg)
    return;
  }

  drawPerfectPen(ctx, points, colorInfo.color, widthInfo.pen_width)
}

const drawLazyPen = (ctx, points, width, rainbowColorDeg, updateRainbowColorDeg) => {
  points = getLazyPoints(points, { size: width })

  let colorDeg = rainbowColorDeg

  points.forEach((point, index) => {
    if (index === 0) return;

    const pointA = points[index-1]
    const pointB = point

    const distance = distanceBetweenPoints(pointA, pointB) * rainbowScaleFactor

    const amountOfColorChanges = Math.round(distance)

    let color
    if (amountOfColorChanges === 0) {
      color = hslColor(colorDeg)
    } else {
      const gradient = ctx.createLinearGradient(...pointA, ...pointB);

      gradient.addColorStop(0, hslColor(colorDeg))
      gradient.addColorStop(1, hslColor(colorDeg + distance))

      color = gradient
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

const drawPerfectPen = (ctx, points, color, width) => {
  const myStroke = getStroke(points, { size: width });
  const pathData = getSvgPathFromStroke(myStroke);

  ctx.fillStyle = color;
  ctx.fill(new Path2D(pathData));
}

const getArrowParams = (pointA, pointB, widthIndex) => {
  const minArrowLength = 20;
  const minTailSize = 1;
  const arrowSetup = [
    { max_scale_length: 100, d1_y: 2, d2_y: 7,  d3_y: 21, d2_x: 18, d3_x: 20 },
    { max_scale_length: 200, d1_y: 3, d2_y: 12, d3_y: 36, d2_x: 38, d3_x: 40 },
    { max_scale_length: 300, d1_y: 4, d2_y: 17, d3_y: 51, d2_x: 58, d3_x: 60 },
  ]

  const arrow = arrowSetup[widthIndex]

  // ---

  const [startX, startY] = pointA;
  const [endX, endY] = pointB;

  const diffX = endX - startX;
  const diffY = endY - startY;
  let length = Math.sqrt(diffX ** 2 + diffY ** 2);

  const cos = diffX / length;
  const sin = diffY / length;

  length = Math.max(length, minArrowLength);
  let scaleFactor = Math.min(length / arrow.max_scale_length, 1)

  // ---

  const d1 = [0,                                      Math.max(arrow.d1_y * scaleFactor, minTailSize)]
  const d2 = [length - arrow.d2_x * scaleFactor,      arrow.d2_y * scaleFactor]
  const d3 = [length - arrow.d3_x * scaleFactor,      arrow.d3_y * scaleFactor]
  const d4 = [length,                                 0]
  const d5 = [d3[0],                                  d3[1] * -1]
  const d6 = [d2[0],                                  d2[1] * -1]
  const d7 = [d1[0],                                  d1[1] * -1]

  const t1 = [ -2 * d1[1],                            d7[1]]
  const t2 = [ -2 * d1[1],                            d1[1]]

  function transformPoint([x, y]) {
    return [
      startX + x * cos - y * sin,
      startY + x * sin + y * cos
    ];
  }

  const figurePoints = [d1, d2, d3, d4, d5, d6, d7].map(transformPoint)
  const tailPoints = [t1, t2].map(transformPoint)

  return { figurePoints, tailPoints }
}

export const drawArrow = (ctx, figure, updateRainbowColorDeg) => {
  const { points: [pointA, pointB], colorIndex, widthIndex, rainbowColorDeg } = figure;
  const { figurePoints, tailPoints } = getArrowParams(pointA, pointB, widthIndex);

  let fillStyle = colorList[colorIndex].color
  let shadowColor = '#777';
  let shadowBlur = 4;
  let shadowOffsetX = 1;
  let shadowOffsetY = 2;

  if (colorList[colorIndex].name === 'color_rainbow') {
    const color = createGradient(ctx, pointA, pointB, rainbowColorDeg, updateRainbowColorDeg)

    fillStyle = color;
    shadowColor = '#CCC';
    shadowBlur = 1;
    shadowOffsetX = 0;
    shadowOffsetY = 1;
  }

  ctx.fillStyle = fillStyle;
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
  const [pointA, pointB] = figure.points

  drawDot(ctx, pointA)
  drawDot(ctx, pointB)
}

export const drawLine = (ctx, figure, updateRainbowColorDeg) => {
  const { points: [pointA, pointB], colorIndex, widthIndex, rainbowColorDeg } = figure
  const [color, width] = detectColorAndWidth(ctx, pointA, pointB, colorIndex, widthIndex, rainbowColorDeg, updateRainbowColorDeg)

  drawLineSkeleton(ctx, pointA, pointB, color, width)
}

export const drawLineActive = (ctx, figure) => {
  const [pointA, pointB] = figure.points
  const [color, width] = activeColorAndWidth()

  drawLineSkeleton(ctx, pointA, pointB, color, width)

  drawDot(ctx, pointA)
  drawDot(ctx, pointB)
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
  const { points: [pointA, pointB], colorIndex, widthIndex, rainbowColorDeg } = figure
  const [color, width] = detectColorAndWidth(ctx, pointA, pointB, colorIndex, widthIndex, rainbowColorDeg, updateRainbowColorDeg)

  drawOvalSkeleton(ctx, pointA, pointB, color, width)
}

export const drawOvalActive = (ctx, figure) => {
  const [pointA, pointB] = figure.points
  const [color, width] = activeColorAndWidth()

  drawOvalSkeleton(ctx, pointA, pointB, color, width)

  const [startX, startY] = pointA;
  const [endX, endY] = pointB;

  drawDot(ctx, pointA)
  drawDot(ctx, pointB)
  drawDot(ctx, [startX, endY])
  drawDot(ctx, [endX, startY])
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
  const { points: [pointA, pointB], colorIndex, widthIndex, rainbowColorDeg } = figure
  const [color, width] = detectColorAndWidth(ctx, pointA, pointB, colorIndex, widthIndex, rainbowColorDeg, updateRainbowColorDeg)

  drawRectangleSkeleton(ctx, pointA, pointB, color, width)
}

export const drawRectangleActive = (ctx, figure) => {
  const [pointA, pointB] = figure.points
  const [color, width] = activeColorAndWidth()

  drawRectangleSkeleton(ctx, pointA, pointB, color, width)

  const [startX, startY] = pointA;
  const [endX, endY] = pointB;

  drawDot(ctx, pointA)
  drawDot(ctx, pointB)
  drawDot(ctx, [startX, endY])
  drawDot(ctx, [endX, startY])
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

  ctx.shadowBlur = 10;
  ctx.shadowColor = '#FF2D21';
  ctx.fillStyle = '#EA3323CC';
  const myStroke1 = getStroke(points, {
    size: otherWidth,
    simulatePressure: false,
    start: { taper: true, cap: true },
  });
  const pathData1 = getSvgPathFromStroke(myStroke1);
  ctx.fill(new Path2D(pathData1));

  ctx.fillStyle = '#FFF';
  const myStroke2 = getStroke(points, {
    size: innerWidth,
    simulatePressure: false,
    start: { taper: true, cap: true },
  });
  const pathData2 = getSvgPathFromStroke(myStroke2);
  ctx.fill(new Path2D(pathData2));
  ctx.shadowBlur = 0;
  ctx.shadowColor = 'transparent'; // Reset shadows
}
