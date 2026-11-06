import { widthList } from '../constants.js';

// Local geometry, scaled to the selected Stamp radius when drawing.
export const stampSVG = {
  outerCircleRadius: 200,
  innerCircleRadius: 130,
  arrowWidth: 220,
  arrowBodyLength: 260,
  arrowLength: 360,
  arrowPointRatio: 360/200
};

export const stampArrowPoints = [
  [0,                        -stampSVG.arrowWidth / 2],
  [stampSVG.arrowBodyLength, -stampSVG.arrowWidth / 2],
  [stampSVG.arrowLength,     0],
  [stampSVG.arrowBodyLength, stampSVG.arrowWidth / 2],
  [0,                        stampSVG.arrowWidth / 2],
  [0,                        -stampSVG.arrowWidth / 2],
];

export const getStampGeometry = (figure) => {
  const { points: [center], widthIndex, angle, isPointerVisible } = figure;

  const radius = widthList[widthIndex].stamp_radius;

  const scale = radius / stampSVG.outerCircleRadius;

  return { center, radius, scale, angle, isPointerVisible, widthIndex };
};

export const getStampHandlePoint = (figure) => {
  const { center, radius, angle, isPointerVisible } = getStampGeometry(figure);

  let distance = radius;

  if (isPointerVisible) {
    distance = radius * stampSVG.arrowPointRatio;
  }

  return [
    center[0] + Math.cos(angle) * distance,
    center[1] + Math.sin(angle) * distance,
  ];
};

export const updateStampAngle = (figure, x, y) => {
  const { center, radius } = getStampGeometry(figure);
  const dx = x - center[0];
  const dy = y - center[1];

  figure.angle = Math.atan2(dy, dx);
  figure.isPointerVisible = Math.hypot(dx, dy) > radius + 1;
};

export const getStampParts = (figure) => {
  const { center, radius, scale, angle, isPointerVisible } = getStampGeometry(figure);

  const [centerX, centerY] = center;

  const cos = Math.cos(angle);
  const sin = Math.sin(angle);

  const rotatePoint = ([x, y]) => [
    centerX + (x * cos - y * sin) * scale,
    centerY + (x * sin + y * cos) * scale,
  ];

  let arrowStampPoints = []
  if (isPointerVisible) {
    arrowStampPoints = stampArrowPoints.map(rotatePoint)
  }

  return { center, radius, arrowStampPoints };
};
