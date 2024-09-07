import { getStroke } from 'perfect-freehand';
import { getSvgPathFromStroke } from '../../utils/general.js';

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

export const drawPen = (ctx, points, color, width) => {
  const myStroke = getStroke(points, { size: width });
  const pathData = getSvgPathFromStroke(myStroke);

  ctx.fillStyle = color;
  ctx.fill(new Path2D(pathData));
}

export const drawLine = (ctx, pointA, pointB, color, width) => {
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

export const drawLineActive = (ctx, pointA, pointB) => {
  const color = '#FFF'
  const width = 2

  drawLine(ctx, pointA, pointB, color, width)

  drawDot(ctx, pointA)
  drawDot(ctx, pointB)
}

const getArrowParams = (pointA, pointB, width) => {
  const minArrowLength = 20;
  const minTailSize = 1;
  const arrowSetup = [
    { max_scale_length: 100, d1_y: 2, d2_y: 7,  d3_y: 21, d2_x: 18, d3_x: 20 },
    { max_scale_length: 200, d1_y: 3, d2_y: 12, d3_y: 36, d2_x: 38, d3_x: 40 },
    { max_scale_length: 300, d1_y: 4, d2_y: 17, d3_y: 51, d2_x: 58, d3_x: 60 },
  ]

  const arrow = arrowSetup[width]

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

  const t1 = [ -2 * d1[1],                          d7[1]]
  const t2 = [ -2 * d1[1],                          d1[1]]

  function transformPoint([x, y]) {
    return [
      startX + x * cos - y * sin,
      startY + x * sin + y * cos
    ];
  }

  const figurePoints = [d1, d2, d3, d4, d5, d6, d7].map(transformPoint)
  const tailPoints = [t1, t2].map(transformPoint)

  return { figurePoints, tailPoints }
};

export const drawArrow = (ctx, pointA, pointB, color, width) => {
  const { figurePoints, tailPoints } = getArrowParams(pointA, pointB, width);

  ctx.fillStyle = color;
  ctx.shadowColor = '#777';
  ctx.shadowBlur = 4;
  ctx.shadowOffsetX = 1;
  ctx.shadowOffsetY = 2;

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
};

export const drawArrowActive = (ctx, pointA, pointB) => {
  const [startX, startY] = pointA;
  const [endX, endY] = pointB;

  drawDot(ctx, [startX, startY])
  drawDot(ctx, [endX, endY])
}

export const drawOval = (ctx, pointA, pointB, color, width) => {
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

export const drawOvalActive = (ctx, pointA, pointB) => {
  const color = '#FFF'
  const width = 2

  drawOval(ctx, pointA, pointB, color, width)

  const [startX, startY] = pointA;
  const [endX, endY] = pointB;

  drawDot(ctx, [startX, startY])
  drawDot(ctx, [endX, endY])
  drawDot(ctx, [startX, endY])
  drawDot(ctx, [endX, startY])
}

export const drawRectangle = (ctx, pointA, pointB, color, width) => {
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

export const drawRectangleActive = (ctx, pointA, pointB) => {
  const color = '#FFF'
  const width = 2

  drawRectangle(ctx, pointA, pointB, color, width)

  const [startX, startY] = pointA;
  const [endX, endY] = pointB;

  drawDot(ctx, [startX, startY])
  drawDot(ctx, [endX, endY])
  drawDot(ctx, [startX, endY])
  drawDot(ctx, [endX, startY])
}

export const drawLaser = (ctx, points) => {
  ctx.shadowBlur = 10;
  ctx.shadowColor = '#FF2D21';
  ctx.fillStyle = '#EA3323CC';

  const myStroke1 = getStroke(points, {
    size: 18,
    simulatePressure: false,
    start: { taper: true, cap: true },
  });
  const pathData1 = getSvgPathFromStroke(myStroke1);
  ctx.fill(new Path2D(pathData1));

  ctx.fillStyle = '#FFF';
  const myStroke2 = getStroke(points, {
    size: 8,
    simulatePressure: false,
    start: { taper: true, cap: true },
  });
  const pathData2 = getSvgPathFromStroke(myStroke2);
  ctx.fill(new Path2D(pathData2));
  ctx.shadowBlur = 0;
  ctx.shadowColor = 'transparent'; // Reset shadows
}
