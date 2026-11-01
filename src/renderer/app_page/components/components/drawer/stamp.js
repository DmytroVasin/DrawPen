import {
  widthList,
  erasedFigureColor,
  eraserAlpha,
  stampLightBackgroundColor,
  stampDarkBackgroundColor,
  stampEdgeColor,
} from '../../constants.js';
import { createGradient } from './figures.js';

// Local geometry, scaled to the selected Stamp radius when drawing.
export const stampSVG = {
  outerCircleRadius: 200,
  innerCircleRadius: 130,
  arrowWidth: 220,
  arrowBodyLength: 260,
  arrowLength: 360,
  arrowPointRatio: 360/200
};

// Товщини в координатах SVG, у порядку розмірів widthList.
const stampBorderWidthList = [
  { outerBorderWidth: 42, innerBorderWidth: 20 }, // gray: 1.1 px,    white: 2 px
  { outerBorderWidth: 32, innerBorderWidth: 16 }, // gray: 1 px,      white: 2 px
  { outerBorderWidth: 33, innerBorderWidth: 20 }, // gray: 0.975 px,  white: 3 px
  { outerBorderWidth: 34, innerBorderWidth: 23 }, // gray: 0.9625 px, white: 4.025 px
  { outerBorderWidth: 35, innerBorderWidth: 25 }, // gray: 1 px,      white: 5 px
];

const createStampCirclePath = (radius) => {
  return new Path2D(`
    M ${-radius} 0
    A ${radius} ${radius} 0 1 0 ${radius} 0
    A ${radius} ${radius} 0 1 0 ${-radius} 0
    Z
  `);
};

const stampArrowPoints = [
  [0,                        -stampSVG.arrowWidth / 2],
  [stampSVG.arrowBodyLength, -stampSVG.arrowWidth / 2],
  [stampSVG.arrowLength,     0],
  [stampSVG.arrowBodyLength, stampSVG.arrowWidth / 2],
  [0,                        stampSVG.arrowWidth / 2],
  [0,                        -stampSVG.arrowWidth / 2],
];

const stampOuterCirclePath = createStampCirclePath(stampSVG.outerCircleRadius);
const stampInnerCirclePath = createStampCirclePath(stampSVG.innerCircleRadius);
const stampArrowPath = new Path2D(`M ${stampArrowPoints.slice(0, -1).join(' L ')} Z`);

// Font Awesome Free SVG paths (CC BY 4.0), matching react-icons/fa6.
// https://fontawesome.com/ — https://creativecommons.org/licenses/by/4.0/
// Sized for the Stamp template radius of 200 and centered at [0, 0].
const exclamationMark = new Path2D('M11.25 -67.5 c0 -6.22265625 -5.02734375 -11.25 -11.25 -11.25 S-11.25 -73.72265625 -11.25 -67.5 l0 90 c0 6.22265625 5.02734375 11.25 11.25 11.25 s11.25 -5.02734375 11.25 -11.25 L11.25 -67.5 z M0 78.75 a14.0625 14.0625 0 1 0 0 -28.125 14.0625 14.0625 0 1 0 0 28.125 z');
const questionMark    = new Path2D('M-28.125 -33.75 c0 -12.41015625 10.08984375 -22.5 22.5 -22.5 l11.25 0 c12.41015625 0 22.5 10.08984375 22.5 22.5 l0 1.265625 c0 7.6640625 -3.90234375 14.80078125 -10.3359375 18.9140625 l-14.8359375 9.52734375 c-8.859375 5.6953125 -14.203125 15.50390625 -14.203125 26.015625 l0 0.4921875 c0 6.22265625 5.02734375 11.25 11.25 11.25 s11.25 -5.02734375 11.25 -11.25 l0 -0.4921875 c0 -2.8828125 1.4765625 -5.5546875 3.8671875 -7.1015625 l14.8359375 -9.52734375 c12.8671875 -8.296875 20.671875 -22.53515625 20.671875 -37.86328125 l0 -1.265625 c0 -24.85546875 -20.14453125 -45 -45 -45 l-11.25 0 C-30.48046875 -78.75 -50.625 -58.60546875 -50.625 -33.75 c0 6.22265625 5.02734375 11.25 11.25 11.25 s11.25 -5.02734375 11.25 -11.25 z m28.125 112.5 a14.0625 14.0625 0 1 0 0 -28.125 14.0625 14.0625 0 1 0 0 28.125 z');
const checkMark       = new Path2D('M75.4453125 -52.9453125 c4.39453125 4.39453125 4.39453125 11.53125 0 15.92578125 l-90 90 c-4.39453125 4.39453125 -11.53125 4.39453125 -15.92578125 0 l-45 -45 c-4.39453125 -4.39453125 -4.39453125 -11.53125 0 -15.92578125 s11.53125 -4.39453125 15.92578125 0 L-22.5 29.07421875 59.5546875 -52.9453125 c4.39453125 -4.39453125 11.53125 -4.39453125 15.92578125 0 z');
const crossMark       = new Path2D('M52.9453125 -37.0546875 c4.39453125 -4.39453125 4.39453125 -11.53125 0 -15.92578125 s-11.53125 -4.39453125 -15.92578125 0 L0 -15.92578125 -37.0546875 -52.9453125 c-4.39453125 -4.39453125 -11.53125 -4.39453125 -15.92578125 0 s-4.39453125 11.53125 0 15.92578125 L-15.92578125 0 -52.9453125 37.0546875 c-4.39453125 4.39453125 -4.39453125 11.53125 0 15.92578125 s11.53125 4.39453125 15.92578125 0 L0 15.92578125 37.0546875 52.9453125 c4.39453125 4.39453125 11.53125 4.39453125 15.92578125 0 s4.39453125 -11.53125 0 -15.92578125 L15.92578125 0 52.9453125 -37.0546875 z');

const getStampMark = (figure) => {
  switch (figure.stampStyle) {
    case 'exclamation':
      return exclamationMark;
    case 'question':
      return questionMark;
    case 'check':
      return checkMark;
    default:
      return crossMark;
  }
};

const getStampGeometry = (figure) => {
  const { points: [center, pointB], widthIndex } = figure;

  const dx = pointB[0] - center[0];
  const dy = pointB[1] - center[1];

  const radius = widthList[widthIndex].stamp_radius;

  const scale = radius / stampSVG.outerCircleRadius;
  const angle = Math.atan2(dy, dx);
  const isPointerVisible = Math.hypot(dx, dy) > radius + 1;

  return { center, radius, scale, angle, isPointerVisible, widthIndex };
};

const detectStampColors = (ctx, figure, updateRainbowColorDeg, colorList) => {
  const { colorIndex, rainbowColorDeg, erased, widthIndex } = figure;

  const radius = widthList[widthIndex].stamp_radius;
  let color = colorList[colorIndex].color;
  let backgroundColor = stampLightBackgroundColor;

  if (colorList[colorIndex].isLightColor) {
    backgroundColor = stampDarkBackgroundColor;
  }

  if (colorList[colorIndex].isRainbow) {
    const startAt = [-stampSVG.outerCircleRadius, 0];
    const endAt   = [stampSVG.arrowLength, 0];
    const gradientScale = stampSVG.outerCircleRadius / radius;

    const [gradientColor, distance] = createGradient(ctx, startAt, endAt, rainbowColorDeg, gradientScale);
    color = gradientColor;

    updateRainbowColorDeg(currentDeg => Math.max(currentDeg, rainbowColorDeg + distance));
  }

  if (erased) {
    color = erasedFigureColor;
    backgroundColor = stampLightBackgroundColor;
  }

  return [color, backgroundColor];
};

export const drawStamp = (ctx, offscreenCanvas, figure, updateRainbowColorDeg, colorList) => {
  const { center, scale, angle, isPointerVisible, widthIndex } = getStampGeometry(figure);

  const offCtx = offscreenCanvas.getContext('2d');
  offCtx.clearRect(0, 0, offscreenCanvas.width, offscreenCanvas.height);

  const [color, backgroundColor] = detectStampColors(offCtx, figure, updateRainbowColorDeg, colorList);
  const markPath = getStampMark(figure);

  offCtx.save();
  offCtx.translate(...center);
  offCtx.scale(scale, scale);
  offCtx.lineJoin = 'round';

  if (isPointerVisible) {
    offCtx.save();
    offCtx.rotate(angle);
    drawStampPath(offCtx, stampArrowPath, color, backgroundColor, widthIndex);
    offCtx.restore();
  }

  drawStampPath(offCtx, stampOuterCirclePath, color, backgroundColor, widthIndex);

  // Заповнюємо внутрішнє коло.
  offCtx.fillStyle = backgroundColor;
  offCtx.fill(stampInnerCirclePath);

  // Малювання символу всередині Stamp
  offCtx.fillStyle = color;
  offCtx.fill(markPath);
  offCtx.restore();

  // Переносимо з допоміжного canvas на основний
  let alpha = 1;

  if (figure.erased) {
    alpha = eraserAlpha;
  }

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.resetTransform();
  ctx.drawImage(offscreenCanvas, 0, 0);
  ctx.restore();
}

const drawStampPath = (ctx, path, color, backgroundColor, widthIndex) => {
  const { outerBorderWidth, innerBorderWidth } = stampBorderWidthList[widthIndex];

  // Малюємо зовнішню сіру обводку.
  ctx.strokeStyle = stampEdgeColor;
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
}

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
