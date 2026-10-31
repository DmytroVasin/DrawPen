import {
  pointToSegmentDistance,
  distanceBetweenPoints,
  segmentsIntersect,
  applySoftSnap,
  applyAspectRatioLock,
  calcPointsArrow,
  calcSegmentsFlatArrow,
  getCornersWithMargin,
  calculateCanvasTextMinWidth,
  calculateCanvasWrappedTextHeight,
  getTextAutoResizeHandle,
} from './general.js';

import { stampSVG, getStampParts } from '../components/drawer/stamp.js';
import {
  dotTextMargin,
  figureMinScale,
  widthList,
  dotHoverRadius,
  sideHoverTolerance,
} from '../constants.js'

const withinRadius = (x, y) => {
  const radius = dotHoverRadius

  return (point) => {
    const [pointX, pointY] = point;

    return Math.hypot(pointX - x, pointY - y) <= radius;
  }
}

const isOnCurve = (x, y, points, tolerance) => {
  for (let i = 0; i < points.length - 1; i++) {
    const pointA = points[i];
    const pointB = points[i + 1];

    const distance = pointToSegmentDistance(x, y, pointA, pointB);

    if (distance <= tolerance) {
      return true;
    }
  }

  return false
}

const sampleQuadraticCurve = (startPoint, controlPoint, endPoint) => {
  const steps = 6;
  const points = [];

  for (let step = 1; step <= steps; step++) {
    const t = step / steps;
    const oneMinusT = 1 - t;

    points.push([
      oneMinusT ** 2 * startPoint[0] + 2 * oneMinusT * t * controlPoint[0] + t ** 2 * endPoint[0],
      oneMinusT ** 2 * startPoint[1] + 2 * oneMinusT * t * controlPoint[1] + t ** 2 * endPoint[1],
    ]);
  }

  return points;
}

const sampleCubicCurve = (startPoint, firstControlPoint, secondControlPoint, endPoint) => {
  const steps = 6;
  const points = [];

  for (let step = 1; step <= steps; step++) {
    const t = step / steps;
    const oneMinusT = 1 - t;

    points.push([
      oneMinusT ** 3 * startPoint[0] + 3 * oneMinusT ** 2 * t * firstControlPoint[0] + 3 * oneMinusT * t ** 2 * secondControlPoint[0] + t ** 3 * endPoint[0],
      oneMinusT ** 3 * startPoint[1] + 3 * oneMinusT ** 2 * t * firstControlPoint[1] + 3 * oneMinusT * t ** 2 * secondControlPoint[1] + t ** 3 * endPoint[1],
    ]);
  }

  return points;
}

const getRectanglePoints = (figure) => {
  const { points: [pointA, pointB], edgeIndex } = figure

  const [startX, startY] = pointA;
  const [endX, endY] = pointB;

  const left   = Math.min(startX, endX);
  const right  = Math.max(startX, endX);
  const top    = Math.min(startY, endY);
  const bottom = Math.max(startY, endY);

  const topLeftCorner     = [left, top];
  const topRightCorner    = [right, top];
  const bottomRightCorner = [right, bottom];
  const bottomLeftCorner  = [left, bottom];

  if (edgeIndex === 0) {
    return [
      topLeftCorner,
      topRightCorner,
      bottomRightCorner,
      bottomLeftCorner,
      topLeftCorner,
    ];
  }

  const radius = Math.min(Math.min(right - left, bottom - top) * 0.25, 32);

  const topLeftCornerStart     = [left,          top + radius];
  const topLeftCornerEnd       = [left + radius, top];

  const topRightCornerStart    = [right - radius, top];
  const topRightCornerEnd      = [right,          top + radius];

  const bottomRightCornerStart = [right,          bottom - radius];
  const bottomRightCornerEnd   = [right - radius, bottom];

  const bottomLeftCornerStart  = [left + radius, bottom];
  const bottomLeftCornerEnd    = [left,          bottom - radius];

  return [
    topLeftCornerEnd,
    topRightCornerStart,
    ...sampleQuadraticCurve(topRightCornerStart, topRightCorner, topRightCornerEnd),
    bottomRightCornerStart,
    ...sampleQuadraticCurve(bottomRightCornerStart, bottomRightCorner, bottomRightCornerEnd),
    bottomLeftCornerStart,
    ...sampleQuadraticCurve(bottomLeftCornerStart, bottomLeftCorner, bottomLeftCornerEnd),
    topLeftCornerStart,
    ...sampleQuadraticCurve(topLeftCornerStart, topLeftCorner, topLeftCornerEnd),
  ];
}

const getDiamondPoints = (figure) => {
  const { points: [pointA, pointB], edgeIndex } = figure

  const [startX, startY] = pointA;
  const [endX, endY] = pointB;

  const centerX = (startX + endX) / 2;
  const centerY = (startY + endY) / 2;

  const topCorner    = [centerX, Math.min(startY, endY)];
  const rightCorner  = [Math.max(startX, endX), centerY];
  const bottomCorner = [centerX, Math.max(startY, endY)];
  const leftCorner   = [Math.min(startX, endX), centerY];

  if (edgeIndex === 0) {
    return [
      topCorner,
      rightCorner,
      bottomCorner,
      leftCorner,
      topCorner
    ];
  }

  const offsetX = (rightCorner[0] - leftCorner[0]) / 8;
  const offsetY = (bottomCorner[1] - topCorner[1]) / 8;

  const topCornerStart    = [topCorner[0] - offsetX, topCorner[1] + offsetY];
  const topCornerEnd      = [topCorner[0] + offsetX, topCorner[1] + offsetY];

  const rightCornerStart  = [rightCorner[0] - offsetX, rightCorner[1] - offsetY];
  const rightCornerEnd    = [rightCorner[0] - offsetX, rightCorner[1] + offsetY];

  const bottomCornerStart = [bottomCorner[0] + offsetX, bottomCorner[1] - offsetY];
  const bottomCornerEnd   = [bottomCorner[0] - offsetX, bottomCorner[1] - offsetY];

  const leftCornerStart   = [leftCorner[0] + offsetX, leftCorner[1] + offsetY];
  const leftCornerEnd     = [leftCorner[0] + offsetX, leftCorner[1] - offsetY];

  return [
    topCornerEnd,
    rightCornerStart,
    ...sampleCubicCurve(rightCornerStart, rightCorner, rightCorner, rightCornerEnd),
    bottomCornerStart,
    ...sampleCubicCurve(bottomCornerStart, bottomCorner, bottomCorner, bottomCornerEnd),
    leftCornerStart,
    ...sampleCubicCurve(leftCornerStart, leftCorner, leftCorner, leftCornerEnd),
    topCornerStart,
    ...sampleCubicCurve(topCornerStart, topCorner, topCorner, topCornerEnd),
  ];
}

const isOnLine = (x, y, figure) => {
  const { points, widthIndex } = figure

  const baseTolerance = 5;
  const tolerance = baseTolerance + widthList[widthIndex].figure_width / 2

  return isOnCurve(x, y, points, tolerance)
}

const isOnPolygon = (x, y, points) => {
  let isInside = false
  const total = points.length

  for (let current = 0; current < total; current++) {
    const prev = current === 0 ? total - 1 : current - 1

    const currPoint = points[current]
    const prevPoint = points[prev]

    const cx = currPoint[0]
    const cy = currPoint[1]
    const px = prevPoint[0]
    const py = prevPoint[1]

    const crossesRay = (cy > y) !== (py > y)
    if (!crossesRay) continue

    const intersectX = ((px - cx) * (y - cy)) / (py - cy) + cx

    if (x < intersectX) {
      isInside = !isInside
    }
  }

  return isInside
}

const isOnArrow = (x, y, figure) => {
  const { points, widthIndex } = figure

  const figurePoints = calcPointsArrow(points, widthIndex)

  return isOnPolygon(x, y, figurePoints)
}

const isOnFlatArrow = (x, y, figure) => {
  const { points, widthIndex } = figure

  const baseTolerance = 5;
  const tolerance = baseTolerance + widthList[widthIndex].figure_width / 2

  const [shaftSegment, headTopSegment, headBottomSegment] = calcSegmentsFlatArrow(points, widthIndex)

  const shaftDistance      = pointToSegmentDistance(x, y, shaftSegment[0], shaftSegment[1]);
  const headTopDistance    = pointToSegmentDistance(x, y, headTopSegment[0], headTopSegment[1]);
  const headBottomDistance = pointToSegmentDistance(x, y, headBottomSegment[0], headBottomSegment[1]);

  const closeToShaft      = shaftDistance <= tolerance;
  const closeToHeadTop    = headTopDistance <= tolerance;
  const closeToHeadBottom = headBottomDistance <= tolerance;

  return (closeToShaft || closeToHeadTop || closeToHeadBottom)
}

const isOnOval = (x, y, figure) => {
  const { points } = figure

  const [startX, startY] = points[0];
  const [endX, endY] = points[1];

  const radiusX = Math.abs(endX - startX) / 2;
  const radiusY = Math.abs(endY - startY) / 2;
  const centerX = Math.min(startX, endX) + radiusX;
  const centerY = Math.min(startY, endY) + radiusY;

  // If the oval is too narrow, treat it as a line
  if (radiusX < 5 || radiusY < 5) {
    return isOnLine(x, y, figure)
  }

  const normalizedX = (x - centerX) / radiusX;
  const normalizedY = (y - centerY) / radiusY;

  const ellipseValue = normalizedX * normalizedX + normalizedY * normalizedY;

  const distance = Math.abs(ellipseValue - 1);
  const tolerance = 0.15;

  if (distance <= tolerance) {
    return true
  }

  return false
}

const isOnRectangle = (x, y, figure) => {
  const { widthIndex } = figure

  const baseTolerance = 5;
  const tolerance = baseTolerance + widthList[widthIndex].figure_width / 2

  const rectanglePoints = getRectanglePoints(figure);

  return isOnCurve(x, y, rectanglePoints, tolerance);
}

const isOnDiamond = (x, y, figure) => {
  const baseTolerance = 5;
  const tolerance = baseTolerance + widthList[figure.widthIndex].figure_width / 2;

  const diamondPoints = getDiamondPoints(figure);

  return isOnCurve(x, y, diamondPoints, tolerance);
}

const isOverText = (x, y, figure) => {
  const { points, width, height, scale } = figure
  const startAt = points[0]

  const minX = startAt[0] - dotTextMargin;
  const maxX = startAt[0] + width * scale + dotTextMargin;
  const minY = startAt[1] - dotTextMargin;
  const maxY = startAt[1] + height * scale + dotTextMargin;

  const withinHorizontalBounds = x >= minX && x <= maxX;
  const withinVerticalBounds = y >= minY && y <= maxY;

  if (withinHorizontalBounds && withinVerticalBounds) {
    return true
  }

  return false
}

const isOnOneDot = (x, y, figure) => {
  const [, pointB] = figure.points;

  const inRadius = withinRadius(x, y)

  if (inRadius(pointB)) return 'pointB'

  return null
}

const isOnTwoDots = (x, y, figure) => {
  const [pointA, pointB] = figure.points;

  const inRadius = withinRadius(x, y)

  if (inRadius(pointA)) return 'pointA'
  if (inRadius(pointB)) return 'pointB'

  return null
}

const isOnFourDots = (x, y, figure) => {
  const [pointA, pointB] = figure.points;

  return getDotNameByPoints(x, y, pointA, pointB);
}

const isOnTextDots = (x, y, figure) => {
  const { points, width, height, scale } = figure
  const startAt = points[0];

  const endAt = [
    startAt[0] + width * scale,
    startAt[1] + height * scale,
  ];

  return getDotNameByPoints(x, y, startAt, endAt)
}

const getDotNameByPoints = (x, y, pointA, pointB) => {
  const { pointAwithMargin, pointBwithMargin, pointCwithMargin, pointDwithMargin } = getCornersWithMargin(pointA, pointB)

  const inRadius = withinRadius(x, y)

  if (inRadius(pointAwithMargin)) return 'pointA'
  if (inRadius(pointBwithMargin)) return 'pointB'
  if (inRadius(pointCwithMargin)) return 'pointC'
  if (inRadius(pointDwithMargin)) return 'pointD'

  return null
}

const getSideNameByPoints = (x, y, pointA, pointB) => {
  const [startX, startY] = pointA;
  const [endX, endY] = pointB;

  const minX = Math.min(startX, endX) - dotTextMargin;
  const maxX = Math.max(startX, endX) + dotTextMargin;
  const minY = Math.min(startY, endY) - dotTextMargin;
  const maxY = Math.max(startY, endY) + dotTextMargin;

  const distLeft   = Math.abs(x - minX);
  const distRight  = Math.abs(x - maxX);
  const distTop    = Math.abs(y - minY);
  const distBottom = Math.abs(y - maxY);

  const withinHorizontalBounds = x >= minX && x <= maxX;
  const withinVerticalBounds = y >= minY && y <= maxY;

  const closeToTopEdge    = distTop <= sideHoverTolerance && withinHorizontalBounds;
  const closeToBottomEdge = distBottom <= sideHoverTolerance && withinHorizontalBounds;
  const closeToLeftEdge   = distLeft <= sideHoverTolerance && withinVerticalBounds;
  const closeToRightEdge  = distRight <= sideHoverTolerance && withinVerticalBounds;

  if (closeToTopEdge)    return 'TopSide'
  if (closeToBottomEdge) return 'BottomSide'
  if (closeToLeftEdge)   return 'LeftSide'
  if (closeToRightEdge)  return 'RightSide'

  return null
}

const isOnFigureSide = (x, y, figure) => {
  const [pointA, pointB] = figure.points;

  return getSideNameByPoints(x, y, pointA, pointB);
}

const isOnTextSide = (x, y, figure) => {
  const { points, width, height, scale } = figure;
  const startAt = points[0];

  const endAt = [
    startAt[0] + width * scale,
    startAt[1] + height * scale,
  ];

  return getSideNameByPoints(x, y, startAt, endAt);
}

export const isOnFigure = (x, y, figure) => {
  switch (figure.type) {
    case 'arrow':
      return isOnArrow(x, y, figure)
    case 'flat_arrow':
      return isOnFlatArrow(x, y, figure)
    case 'rectangle':
      return isOnRectangle(x, y, figure)
    case 'diamond':
      return isOnDiamond(x, y, figure)
    case 'oval':
      return isOnOval(x, y, figure)
    case 'line':
      return isOnLine(x, y, figure)
    case 'stamp':
      return isOverStamp(x, y, figure);
    case 'text':
      return isOverText(x, y, figure)
    default:
      return false
  }
}

export const isOnTextAutoResizeHandle = (x, y, figure) => {
  if (figure.type !== 'text') return false;
  if (figure.autoResize) return false;

  const handle = getTextAutoResizeHandle(figure);
  if (!handle) return false;

  return isOnCurve(x, y, [handle.startAt, handle.endAt], sideHoverTolerance);
}

const isOverRectangle = (x, y, figure) => {
  const rectanglePoints = getRectanglePoints(figure);

  return isOnPolygon(x, y, rectanglePoints);
}

const isOverDiamond = (x, y, figure) => {
  const diamondPoints = getDiamondPoints(figure);

  return isOnPolygon(x, y, diamondPoints);
}

const isOverOval = (x, y, figure) => {
  const { points } = figure

  const [startX, startY] = points[0];
  const [endX, endY] = points[1];

  const radiusX = Math.abs(endX - startX) / 2;
  const radiusY = Math.abs(endY - startY) / 2;
  const centerX = Math.min(startX, endX) + radiusX;
  const centerY = Math.min(startY, endY) + radiusY;

  const normalizedX = (x - centerX) / radiusX;
  const normalizedY = (y - centerY) / radiusY;

  const ellipseValue = normalizedX * normalizedX + normalizedY * normalizedY;

  return ellipseValue <= 1;
}

const isOverStamp = (x, y, figure) => {
  const { center, radius, arrowStampPoints } = getStampParts(figure);

  const [centerX, centerY] = center;

  const overStampCircle = Math.hypot(x - centerX, y - centerY) <= radius + sideHoverTolerance;
  const overStampArrow  = isOnPolygon(x, y, arrowStampPoints);

  return overStampCircle || overStampArrow;
};

export const isOverFigure = (x, y, figure) => {
  switch (figure.type) {
    case 'rectangle':
      return isOverRectangle(x, y, figure)
    case 'diamond':
      return isOverDiamond(x, y, figure)
    case 'oval':
      return isOverOval(x, y, figure)
    case 'stamp':
      return isOverStamp(x, y, figure);
    case 'text':
      return isOverText(x, y, figure)
    default:
      return false
  }
}

const isSegmentIntersectCurve = (segmentPoints, points) => {
  if (segmentPoints.length < 2) {
    return false
  }

  const [startAt, endAt] = segmentPoints.slice(-2);

  for (let i = 0; i < points.length - 1; i++) {
    const pointA = points[i];
    const pointB = points[i + 1];

    if (segmentsIntersect(startAt, endAt, pointA, pointB)) {
      return true;
    }
  }

  return false;
}

const isSegmentIntersectCircle = (segmentPoints, center, radius) => {
  if (segmentPoints.length < 2) {
    return false
  }

  const [startAt, endAt] = segmentPoints.slice(-2);

  return pointToSegmentDistance(...center, startAt, endAt) <= radius;
}

const isSegmentTouchCurve = (segmentPoints, figure) => {
  const { points } = figure
  const [eraseAtX, eraseAtY] = segmentPoints.at(-1);

  const tolerance = 10

  if (points.length < 2) {
    const [pointX, pointY] = points[0];

    const distance = Math.hypot(eraseAtX - pointX, eraseAtY - pointY);

    return distance <= tolerance
  }

  if (isOnCurve(eraseAtX, eraseAtY, points, tolerance)) {
    return true
  }

  return isSegmentIntersectCurve(segmentPoints, points)
}

const isSegmentTouchLine = (segmentPoints, figure) => {
  const { points } = figure
  const [eraseAtX, eraseAtY] = segmentPoints.at(-1);

  if (isOnLine(eraseAtX, eraseAtY, figure)) {
    return true
  }

  return isSegmentIntersectCurve(segmentPoints, points)
}

const isSegmentTouchArrow = (segmentPoints, figure) => {
  const { points } = figure
  const [eraseAtX, eraseAtY] = segmentPoints.at(-1);

  if (isOnArrow(eraseAtX, eraseAtY, figure)) {
    return true
  }

  const figurePoints = calcPointsArrow(points, figure.widthIndex)

  return isSegmentIntersectCurve(segmentPoints, figurePoints)
}

const isSegmentTouchFlatArrow = (segmentPoints, figure) => {
  const [eraseAtX, eraseAtY] = segmentPoints.at(-1);

  if (isOnFlatArrow(eraseAtX, eraseAtY, figure)) {
    return true
  }

  const [shaftSegment, headTopSegment, headBottomSegment] = calcSegmentsFlatArrow(figure.points, figure.widthIndex)

  return isSegmentIntersectCurve(segmentPoints, shaftSegment) ||
         isSegmentIntersectCurve(segmentPoints, headTopSegment) ||
         isSegmentIntersectCurve(segmentPoints, headBottomSegment)
}

const isSegmentTouchRectangle = (segmentPoints, figure) => {
  const [eraseAtX, eraseAtY] = segmentPoints.at(-1);

  if (isOnRectangle(eraseAtX, eraseAtY, figure)) {
    return true
  }

  const rectanglePoints = getRectanglePoints(figure);

  return isSegmentIntersectCurve(segmentPoints, rectanglePoints)
}

const isSegmentTouchText = (segmentPoints, figure) => {
  const [eraseAtX, eraseAtY] = segmentPoints.at(-1);

  if (isOverText(eraseAtX, eraseAtY, figure)) {
    return true
  }

  const { points, width, height, scale } = figure
  const startAt = points[0];

  const rectPoints = [
    [startAt[0],                 startAt[1]],
    [startAt[0] + width * scale, startAt[1]],
    [startAt[0] + width * scale, startAt[1] + height * scale],
    [startAt[0],                 startAt[1] + height * scale],
    [startAt[0],                 startAt[1]],
  ];

  return isSegmentIntersectCurve(segmentPoints, rectPoints)
}

const isSegmentTouchOval = (segmentPoints, figure) => {
  const { points } = figure
  const [eraseAtX, eraseAtY] = segmentPoints.at(-1);

  if (isOnOval(eraseAtX, eraseAtY, figure)) {
    return true
  }

  const [startX, startY] = points[0];
  const [endX, endY] = points[1];

  const numPoints = 32;
  const ovalPoints = [];

  const radiusX = Math.abs(endX - startX) / 2;
  const radiusY = Math.abs(endY - startY) / 2;
  const centerX = Math.min(startX, endX) + radiusX;
  const centerY = Math.min(startY, endY) + radiusY;

  for (let i = 0; i < numPoints; i++) {
    const angle = (i / numPoints) * 2 * Math.PI;
    const x = centerX + radiusX * Math.cos(angle);
    const y = centerY + radiusY * Math.sin(angle);
    ovalPoints.push([x, y]);
  }

  ovalPoints.push(ovalPoints[0]);

  return isSegmentIntersectCurve(segmentPoints, ovalPoints)
}

const isSegmentTouchDiamond = (segmentPoints, figure) => {
  const [eraseAtX, eraseAtY] = segmentPoints.at(-1);

  if (isOnDiamond(eraseAtX, eraseAtY, figure)) {
    return true
  }

  const diamondPoints = getDiamondPoints(figure);

  return isSegmentIntersectCurve(segmentPoints, diamondPoints)
}

const isSegmentTouchStamp = (segmentPoints, figure) => {
  const [eraseAtX, eraseAtY] = segmentPoints.at(-1);

  if (isOverStamp(eraseAtX, eraseAtY, figure)) {
    return true;
  }

  const { center, radius, arrowStampPoints } = getStampParts(figure);

  return isSegmentIntersectCircle(segmentPoints, center, radius + sideHoverTolerance) ||
         isSegmentIntersectCurve(segmentPoints, arrowStampPoints);
}

export const areFiguresIntersecting = (eraserFigure, figure) => {
  switch (figure.type) {
    case 'brush':
    case 'pen':
    case 'fadepen':
    case 'highlighter':
      return isSegmentTouchCurve(eraserFigure.points, figure)
    case 'arrow':
      return isSegmentTouchArrow(eraserFigure.points, figure)
    case 'flat_arrow':
      return isSegmentTouchFlatArrow(eraserFigure.points, figure)
    case 'rectangle':
      return isSegmentTouchRectangle(eraserFigure.points, figure)
    case 'diamond':
      return isSegmentTouchDiamond(eraserFigure.points, figure)
    case 'oval':
      return isSegmentTouchOval(eraserFigure.points, figure)
    case 'line':
      return isSegmentTouchLine(eraserFigure.points, figure)
    case 'stamp':
      return isSegmentTouchStamp(eraserFigure.points, figure);
    case 'text':
      return isSegmentTouchText(eraserFigure.points, figure)
    default:
      return false
  }
}

export const getDotNameOnFigure = (x, y, figure) => {
  switch (figure.type) {
    case 'line':
    case 'arrow':
    case 'flat_arrow':
      return isOnTwoDots(x, y, figure) // ['pointA', 'pointB', null]
    case 'rectangle':
    case 'diamond':
    case 'oval':
      return isOnFourDots(x, y, figure) // ['pointA', 'pointB', 'pointC', 'pointD', null]
    case 'stamp':
      return isOnOneDot(x, y, figure) // ['pointB', null]
    case 'text':
      return isOnTextDots(x, y, figure) // ['pointA', 'pointB', 'pointC', 'pointD', null]
    default:
      return null
  }
};

export const getSideNameOnFigure = (x, y, figure) => {
  switch (figure.type) {
    case 'rectangle':
    case 'diamond':
    case 'oval':
      return isOnFigureSide(x, y, figure) // ['TopSide', 'BottomSide', 'LeftSide', 'RightSide', null]
    case 'text':
      return isOnTextSide(x, y, figure) // ['TopSide', 'BottomSide', 'LeftSide', 'RightSide', null]
    default:
      return null
  }
};

const getDotCoordinates = (figure, dotName) => {
  if (['line', 'arrow', 'flat_arrow', 'stamp'].includes(figure.type)) {
    if (dotName === 'pointA') return figure.points[0];
    if (dotName === 'pointB') return figure.points[1];
  }

  if (['rectangle', 'diamond', 'oval'].includes(figure.type)) {
    const [pointA, pointB] = figure.points;

    if (dotName === 'pointA') return pointA;
    if (dotName === 'pointB') return pointB;
    if (dotName === 'pointC') return [pointA[0], pointB[1]];
    if (dotName === 'pointD') return [pointB[0], pointA[1]];
  }

  if (['text'].includes(figure.type)) {
    const startAt = figure.points[0];
    const startX = startAt[0];
    const startY = startAt[1];
    const endX = startAt[0] + figure.width * figure.scale;
    const endY = startAt[1] + figure.height * figure.scale;

    if (dotName === 'pointA') return [startX, startY];
    if (dotName === 'pointB') return [endX, endY];
    if (dotName === 'pointC') return [startX, endY];
    if (dotName === 'pointD') return [endX, startY];
  }

  return null;
}

export const getDotOffsetCoordinates = (figure, dotName, x, y) => {
  const dotCoordinates = getDotCoordinates(figure, dotName);

  if (!dotCoordinates) {
    return {
      offsetX: 0,
      offsetY: 0,
    };
  }

  return {
    offsetX: x - dotCoordinates[0],
    offsetY: y - dotCoordinates[1],
  };
}

export const getSidePointName = (figure, sideName) => {
  if (['text'].includes(figure.type)) {
    if (sideName === 'TopSide')    return 'pointAScale'
    if (sideName === 'BottomSide') return 'pointBScale'
    if (sideName === 'LeftSide')   return 'pointAWidth'
    if (sideName === 'RightSide')  return 'pointBWidth'

    return null;
  }

  if (['rectangle', 'diamond', 'oval'].includes(figure.type)) {
    const [pointA, pointB] = figure.points;

    if (sideName === 'TopSide')    return pointA[1] <= pointB[1] ? 'pointA' : 'pointB';
    if (sideName === 'BottomSide') return pointA[1] <= pointB[1] ? 'pointB' : 'pointA';
    if (sideName === 'LeftSide')   return pointA[0] <= pointB[0] ? 'pointA' : 'pointB';
    if (sideName === 'RightSide')  return pointA[0] <= pointB[0] ? 'pointB' : 'pointA';
  }

  return null;
}

export const getSideOffsetCoordinates = (figure, sideName, sidePointName, x, y) => {
  if (!sidePointName) {
    return {
      offsetX: 0,
      offsetY: 0,
    };
  }

  if (['text'].includes(figure.type)) {
    const { points: [startAt], scale, width, height } = figure;

    const [startX, startY] = startAt;

    const endX = startX + width * scale;
    const endY = startY + height * scale;

    if (sidePointName === 'pointAScale') {
      return {
        offsetX: 0,
        offsetY: y - startY,
      };
    }

    if (sidePointName === 'pointBScale') {
      return {
        offsetX: 0,
        offsetY: y - endY,
      };
    }

    if (sidePointName === 'pointAWidth') {
      return {
        offsetX: x - startX,
        offsetY: 0,
      };
    }

    if (sidePointName === 'pointBWidth') {
      return {
        offsetX: x - endX,
        offsetY: 0,
      };
    }
  }

  if (['rectangle', 'diamond', 'oval'].includes(figure.type)) {
    const sidePoint = sidePointName === 'pointA' ? figure.points[0] : figure.points[1];

    if (['TopSide', 'BottomSide'].includes(sideName)) {
      return {
        offsetX: 0,
        offsetY: y - sidePoint[1],
      };
    }

    if (['LeftSide', 'RightSide'].includes(sideName)) {
      return {
        offsetX: x - sidePoint[0],
        offsetY: 0,
      };
    }
  }

  return {
    offsetX: 0,
    offsetY: 0,
  };
}

export const dragFigure = (figure, oldCoordinates, newCoordinates) => {
  const offsetX = newCoordinates.x - oldCoordinates.x;
  const offsetY = newCoordinates.y - oldCoordinates.y;

  figure.points.forEach((point) => {
    point[0] += offsetX
    point[1] += offsetY
  })
}

const textPointCoordinates = {
  pointA: (f) => [
    f.points[0][0],
    f.points[0][1],
  ],
  pointB: (f) => [
    f.points[0][0] + f.width * f.scale,
    f.points[0][1] + f.height * f.scale,
  ],
  pointC: (f) => [
    f.points[0][0],
    f.points[0][1] + f.height * f.scale,
  ],
  pointD: (f) => [
    f.points[0][0] + f.width * f.scale,
    f.points[0][1]
  ],
};

const resizeLineByDots = (figure, activeFigureInfo, { x, y, isShiftPressed }) => {
  const { resizingDotName } = activeFigureInfo;

  if (isShiftPressed) {
    let pointA = figure.points[0];
    let pointB = figure.points[1];

    let startPoint

    if (resizingDotName === 'pointA') { startPoint = pointB; }
    if (resizingDotName === 'pointB') { startPoint = pointA; }

    const result = applySoftSnap(startPoint[0], startPoint[1], x, y);

    x = result.x;
    y = result.y;
  }

  switch (resizingDotName) {
    case 'pointA':
      figure.points[0][0] = x
      figure.points[0][1] = y
      break;
    case 'pointB':
      figure.points[1][0] = x
      figure.points[1][1] = y
      break;
  }
}

const resizeShapeByDots = (figure, activeFigureInfo, { x, y, isShiftPressed }) => {
  const { resizingDotName } = activeFigureInfo;

  if (isShiftPressed) {
    let pointA = figure.points[0];
    let pointB = figure.points[1];
    let pointC = [figure.points[0][0], figure.points[1][1]];
    let pointD = [figure.points[1][0], figure.points[0][1]];

    let startPoint

    if (resizingDotName === 'pointA') { startPoint = pointB; }
    if (resizingDotName === 'pointB') { startPoint = pointA; }
    if (resizingDotName === 'pointC') { startPoint = pointD; }
    if (resizingDotName === 'pointD') { startPoint = pointC; }

    const result = applyAspectRatioLock(startPoint[0], startPoint[1], x, y, figure.ratio);

    x = result.x;
    y = result.y;
  }

  switch (resizingDotName) {
    case 'pointA':
      figure.points[0][0] = x
      figure.points[0][1] = y
      break;
    case 'pointB':
      figure.points[1][0] = x
      figure.points[1][1] = y
      break;
    case 'pointC':
      figure.points[0][0] = x
      figure.points[1][1] = y
      break;
    case 'pointD':
      figure.points[1][0] = x
      figure.points[0][1] = y
      break;
  }
}

const resizeStampByDot = (figure, { x, y }) => {
  figure.points[1] = [x, y];
}

const resizeTextByDots = (figure, activeFigureInfo, { x, y, isShiftPressed }) => {
  const { resizingDotName } = activeFigureInfo;

  switch (resizingDotName) {
    case 'pointA': {
      const [pointX, pointY] = textPointCoordinates.pointA(figure);

      const dx = (pointX - x) / figure.width;
      const dy = (pointY - y) / figure.height;

      const delta = Math.max(dx, dy);
      const newScale = Math.max(figureMinScale, figure.scale + delta);

      const scaleDiff = newScale - figure.scale;

      figure.points[0][0] -= figure.width * scaleDiff;
      figure.points[0][1] -= figure.height * scaleDiff;
      figure.scale = newScale;
      break;
    }
    case 'pointB': {
      const [pointX, pointY] = textPointCoordinates.pointB(figure);

      const dx = (x - pointX) / figure.width;
      const dy = (y - pointY) / figure.height;

      const delta = Math.max(dx, dy);
      const newScale = Math.max(figureMinScale, figure.scale + delta);

      figure.scale = newScale
      break;
    }
    case 'pointC': {
      const [pointX, pointY] = textPointCoordinates.pointC(figure);

      const dx = (pointX - x) / figure.width;
      const dy = (y - pointY) / figure.height;

      const delta = Math.max(dx, dy);
      const newScale = Math.max(figureMinScale, figure.scale + delta);

      const scaleDiff = newScale - figure.scale;

      figure.points[0][0] -= figure.width * scaleDiff;
      figure.scale = newScale;
      break;
    }
    case 'pointD': {
      const [pointX, pointY] = textPointCoordinates.pointD(figure);

      const dx = (x - pointX) / figure.width;
      const dy = (pointY - y) / figure.height;

      const delta = Math.max(dx, dy);
      const newScale = Math.max(figureMinScale, figure.scale + delta);

      const scaleDiff = newScale - figure.scale;

      figure.points[0][1] -= figure.height * scaleDiff;
      figure.scale = newScale;
      break;
    }
  }
}

const resizeFigureByDot = (figure, activeFigureInfo, { x, y, isShiftPressed }) => {
  if (['line', 'arrow', 'flat_arrow'].includes(figure.type)) {
    resizeLineByDots(figure, activeFigureInfo, { x, y, isShiftPressed });
    return;
  }

  if (['rectangle', 'diamond', 'oval'].includes(figure.type)) {
    resizeShapeByDots(figure, activeFigureInfo, { x, y, isShiftPressed });
    return;
  }

  if (['stamp'].includes(figure.type)) {
    resizeStampByDot(figure, { x, y });
    return;
  }

  if (['text'].includes(figure.type)) {
    resizeTextByDots(figure, activeFigureInfo, { x, y, isShiftPressed });
    return;
  }
}

const resizeTextBySide = (figure, activeFigureInfo, { x, y }) => {
  const { resizingSidePointName } = activeFigureInfo;

  // Зберігаємо bottom-right на місці
  if (resizingSidePointName === 'pointAScale') {
    const [, anchorY] = textPointCoordinates.pointB(figure);

    const dy = (anchorY - y) / figure.height;

    const newScale = Math.max(figureMinScale, dy);

    const scaleDiff = newScale - figure.scale;

    figure.points[0][0] -= figure.width * scaleDiff;
    figure.points[0][1] -= figure.height * scaleDiff;
    figure.scale = newScale;
    return;
  }

  // Зберігаємо top-left на місці
  if (resizingSidePointName === 'pointBScale') {
    const [, anchorY] = textPointCoordinates.pointA(figure);

    const dy = (y - anchorY) / figure.height;

    const newScale = Math.max(figureMinScale, dy);

    figure.scale = newScale;
    return;
  }

  if (resizingSidePointName === 'pointAWidth') {
    const [anchorX] = textPointCoordinates.pointB(figure);

    const dx = (anchorX - x) / figure.scale;

    const minWidth = calculateCanvasTextMinWidth(figure.widthIndex);

    const newWidth = Math.max(minWidth, dx);
    const newHeight = calculateCanvasWrappedTextHeight(figure.text, figure.widthIndex, newWidth);

    figure.points[0][0] = anchorX - newWidth * figure.scale;
    figure.width = newWidth;
    figure.height = newHeight;
    figure.autoResize = false;
    return;
  }

  if (resizingSidePointName === 'pointBWidth') {
    const [anchorX] = textPointCoordinates.pointA(figure);

    const dx = (x - anchorX) / figure.scale;

    const minWidth = calculateCanvasTextMinWidth(figure.widthIndex);

    const newWidth = Math.max(minWidth, dx);
    const newHeight = calculateCanvasWrappedTextHeight(figure.text, figure.widthIndex, newWidth);

    figure.width = newWidth;
    figure.height = newHeight;
    figure.autoResize = false;
    return;
  }
}

const resizeShapeBySide = (figure, activeFigureInfo, { x, y, isShiftPressed }) => {
  const { resizingSideName, resizingSidePointName } = activeFigureInfo;

  const [pointA, pointB] = figure.points;
  const resizingPoint = resizingSidePointName === 'pointA' ? pointA : pointB;

  if (['TopSide', 'BottomSide'].includes(resizingSideName)) {
    resizingPoint[1] = y;

    if (isShiftPressed) {
      const centerX = (pointA[0] + pointB[0]) / 2;
      const directionX = pointA[0] <= pointB[0] ? 1 : -1;
      const width = Math.abs(pointB[1] - pointA[1]) * figure.ratio;

      pointA[0] = centerX - directionX * width / 2;
      pointB[0] = centerX + directionX * width / 2;
    }

    return;
  }

  if (['LeftSide', 'RightSide'].includes(resizingSideName)) {
    resizingPoint[0] = x;

    if (isShiftPressed) {
      const centerY = (pointA[1] + pointB[1]) / 2;
      const directionY = pointA[1] <= pointB[1] ? 1 : -1;
      const height = Math.abs(pointB[0] - pointA[0]) / figure.ratio;

      pointA[1] = centerY - directionY * height / 2;
      pointB[1] = centerY + directionY * height / 2;
    }

    return;
  }
};

const resizeFigureBySide = (figure, activeFigureInfo, { x, y, isShiftPressed }) => {
  if (['rectangle', 'diamond', 'oval'].includes(figure.type)) {
    resizeShapeBySide(figure, activeFigureInfo, { x, y, isShiftPressed });
    return;
  }

  if (['text'].includes(figure.type)) {
    resizeTextBySide(figure, activeFigureInfo, { x, y, isShiftPressed });
    return;
  }
}

export const resizeFigure = (figure, activeFigureInfo, { x, y, isShiftPressed }) => {
  const {
    resizingDotName,
    resizingSideName,
    resizingSidePointName,
    resizingPointerOffset,
  } = activeFigureInfo;

  const coordinates = {
    x: x - resizingPointerOffset.offsetX,
    y: y - resizingPointerOffset.offsetY,
    isShiftPressed,
  };

  if (resizingDotName) {
    resizeFigureByDot(figure, activeFigureInfo, coordinates);
    return;
  }

  if (resizingSideName && resizingSidePointName) {
    resizeFigureBySide(figure, activeFigureInfo, coordinates);
    return;
  }
}

const getPointsCenter = (figure) => {
  if (figure.type === 'stamp') {
    return figure.points[0];
  }

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const [x, y] of figure.points) {
    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;
  }

  if (figure.type === 'text') {
    maxX += figure.width * figure.scale
    maxY += figure.height * figure.scale
  }

  return [(minX + maxX) / 2, (minY + maxY) / 2];
};

export const moveToCoordinates = (figure, cursorX, cursorY) => {
  const [centerX, centerY] = getPointsCenter(figure);

  return figure.points.map(([pointX, pointY]) => [pointX + cursorX - centerX, pointY + cursorY - centerY]);
};

export function calculateAspectRatio(figure) {
  const [x1, y1] = figure.points[0];
  const [x2, y2] = figure.points[1];

  const dx = x2 - x1;
  const dy = y2 - y1;

  if (dx === 0 && dy === 0) {
    return figure.ratio;
  }

  return Math.min(Math.max(Math.abs(dx / dy), 0.02), 50);
}

const calculateStampAngle = (figure) => {
  const [pointA, pointB] = figure.points;
  const dx = pointB[0] - pointA[0];
  const dy = pointB[1] - pointA[1];

  return Math.atan2(dy, dx);
};

export const calculateStampArrowPoint = (figure) => {
  const { points: [pointA, pointB], widthIndex } = figure;

  const radius = widthList[widthIndex].stamp_radius;
  const angle = calculateStampAngle(figure);
  const isPointerVisible = distanceBetweenPoints(pointA, pointB) > radius + 1;

  let distance = radius;

  if (isPointerVisible) {
    distance = radius * stampSVG.arrowPointRatio;
  }

  return [
    pointA[0] + Math.cos(angle) * distance,
    pointA[1] + Math.sin(angle) * distance,
  ];
};

export const getFigureBounds = (figure) => {
  if (figure.type === 'stamp') {
    return getStampBounds(figure);
  }

  if (figure.type === 'text') {
    const [x, y] = figure.points[0];

    return {
      left:   x,
      top:    y,
      right:  x + figure.width * figure.scale,
      bottom: y + figure.height * figure.scale,
    };
  }

  const { points: [pointA, pointB] } = figure;

  const [startX, startY] = pointA;
  const [endX, endY] = pointB;

  return {
    left:   Math.min(startX, endX),
    top:    Math.min(startY, endY),
    right:  Math.max(startX, endX),
    bottom: Math.max(startY, endY),
  };
};

const getStampBounds = (figure) => {
  const { center, radius, arrowStampPoints } = getStampParts(figure);
  const [centerX, centerY] = center;

  let minX = centerX - radius;
  let minY = centerY - radius;
  let maxX = centerX + radius;
  let maxY = centerY + radius;

  for (const [x, y] of arrowStampPoints) {
    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;
  }

  return {
    left:   minX,
    top:    minY,
    right:  maxX,
    bottom: maxY,
  };
};
