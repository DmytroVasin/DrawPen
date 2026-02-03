import {
  pointToSegmentDistance,
  segmentsIntersect,
  applySoftSnap,
  applyAspectRatioLock,
  calcPointsArrow,
} from './general.js';

import { dotMargin, figureMinScale, widthList } from '../constants.js'

const withinRadius = (x, y) => {
  const radius = 10

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

const isOnLine = (x, y, figure) => {
  const { points, widthIndex } = figure

  const baseTolerance = 5;
  const tolerance = baseTolerance + widthList[widthIndex].figure_size / 2

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

  const { figurePoints } = calcPointsArrow(points, widthIndex)

  return isOnPolygon(x, y, figurePoints)
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
  const { points, widthIndex } = figure

  const baseTolerance = 5;
  const tolerance = baseTolerance + widthList[widthIndex].figure_size / 2

  const [startX, startY] = points[0];
  const [endX, endY] = points[1];

  const minX = Math.min(startX, endX);
  const maxX = Math.max(startX, endX);
  const minY = Math.min(startY, endY);
  const maxY = Math.max(startY, endY);

  const distLeft   = Math.abs(x - minX);
  const distRight  = Math.abs(x - maxX);
  const distTop    = Math.abs(y - minY);
  const distBottom = Math.abs(y - maxY);

  const withinHorizontalBounds = x >= minX && x <= maxX;
  const withinVerticalBounds = y >= minY && y <= maxY;

  const closeToTopEdge    = distTop <= tolerance && withinHorizontalBounds;
  const closeToBottomEdge = distBottom <= tolerance && withinHorizontalBounds;
  const closeToLeftEdge   = distLeft <= tolerance && withinVerticalBounds;
  const closeToRightEdge  = distRight <= tolerance && withinVerticalBounds;

  if (closeToTopEdge || closeToBottomEdge || closeToLeftEdge || closeToRightEdge) {
    return true;
  }

  return false
}

const isOverText = (x, y, figure) => {
  const { points, width, height, scale } = figure
  const startAt = points[0]

  const minX = startAt[0] - dotMargin;
  const maxX = startAt[0] + width * scale + dotMargin;
  const minY = startAt[1] - dotMargin;
  const maxY = startAt[1] + height * scale + dotMargin;

  const withinHorizontalBounds = x >= minX && x <= maxX;
  const withinVerticalBounds = y >= minY && y <= maxY;

  if (withinHorizontalBounds && withinVerticalBounds) {
    return true
  }

  return false
}

const isOnTwoDots = (x, y, figure) => {
  const { points } = figure
  const [a, b] = points

  const inRadius = withinRadius(x, y)

  if (inRadius(a)) return 'pointA'
  if (inRadius(b)) return 'pointB'

  return null
}

const isOnFourDots = (x, y, figure) => {
  const { points } = figure

  const [startX, startY] = points[0];
  const [endX, endY] = points[1];

  const inRadius = withinRadius(x, y)

  if (inRadius([startX, startY])) return 'pointA'
  if (inRadius([endX, endY])) return 'pointB'
  if (inRadius([startX, endY])) return 'pointC'
  if (inRadius([endX, startY])) return 'pointD'

  return null
}

const isOnTextDots = (x, y, figure) => {
  const { points, width, height, scale } = figure
  const startAt = points[0];

  const startX = startAt[0] - dotMargin
  const startY = startAt[1] - dotMargin
  const endX = startAt[0] + width * scale + dotMargin
  const endY = startAt[1] + height * scale + dotMargin

  const inRadius = withinRadius(x, y)

  if (inRadius([startX, startY])) return 'pointAScale'
  if (inRadius([endX, endY])) return 'pointBScale'
  if (inRadius([startX, endY])) return 'pointCScale'
  if (inRadius([endX, startY])) return 'pointDScale'

  return null
}

export const isOnFigure = (x, y, figure) => {
  switch (figure.type) {
    case 'arrow':
      return isOnArrow(x, y, figure)
    case 'rectangle':
      return isOnRectangle(x, y, figure)
    case 'oval':
      return isOnOval(x, y, figure)
    case 'line':
      return isOnLine(x, y, figure)
    case 'text':
      return isOverText(x, y, figure)
    default:
      return false
  }
}

const isOverRectangle = (x, y, figure) => {
  const [startX, startY] = figure.points[0];
  const [endX, endY] = figure.points[1];

  const minX = Math.min(startX, endX);
  const maxX = Math.max(startX, endX);
  const minY = Math.min(startY, endY);
  const maxY = Math.max(startY, endY);

  const withinHorizontalBounds = x >= minX && x <= maxX;
  const withinVerticalBounds = y >= minY && y <= maxY;

  if (withinHorizontalBounds && withinVerticalBounds) {
    return true
  }

  return false
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

export const isOverFigure = (x, y, figure) => {
  switch (figure.type) {
    case 'rectangle':
      return isOverRectangle(x, y, figure)
    case 'oval':
      return isOverOval(x, y, figure)
    // case 'text':
    //   return isOverText(x, y, figure)
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

  const { figurePoints } = calcPointsArrow(points, figure.widthIndex)

  return isSegmentIntersectCurve(segmentPoints, figurePoints)
}

const isSegmentTouchRectangle = (segmentPoints, figure) => {
  const { points } = figure
  const [eraseAtX, eraseAtY] = segmentPoints.at(-1);

  if (isOnRectangle(eraseAtX, eraseAtY, figure)) {
    return true
  }

  const [startX, startY] = points[0];
  const [endX, endY] = points[1];

  const allRectPoints = [
    [startX, startY],
    [endX, startY],
    [endX, endY],
    [startX, endY],
    [startX, startY],
  ];

  return isSegmentIntersectCurve(segmentPoints, allRectPoints)
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

export const areFiguresIntersecting = (eraserFigure, figure) => {
  switch (figure.type) {
    case 'pen':
    case 'highlighter':
    case 'fadepen':
      return isSegmentTouchCurve(eraserFigure.points, figure)
    case 'arrow':
      return isSegmentTouchArrow(eraserFigure.points, figure)
    case 'rectangle':
      return isSegmentTouchRectangle(eraserFigure.points, figure)
    case 'oval':
      return isSegmentTouchOval(eraserFigure.points, figure)
    case 'line':
      return isSegmentTouchLine(eraserFigure.points, figure)
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
      return isOnTwoDots(x, y, figure) // ['pointA', 'pointB', null]
    case 'oval':
    case 'rectangle':
      return isOnFourDots(x, y, figure) // ['pointA', 'pointB', 'pointC', 'pointD', null]
    case 'text':
      return isOnTextDots(x, y, figure) // ['pointA', 'pointB', 'pointC', 'pointD', null]
    default:
      return false
  }
};

export const dragFigure = (figure, oldCoordinates, newCoordinates) => {
  const offsetX = newCoordinates.x - oldCoordinates.x;
  const offsetY = newCoordinates.y - oldCoordinates.y;

  figure.points.forEach((point) => {
    point[0] += offsetX
    point[1] += offsetY
  })
}

const anchorPoints = {
  pointAScale: (f) => [
    f.points[0][0] - dotMargin,
    f.points[0][1] - dotMargin
  ],
  pointBScale: (f) => [
    f.points[0][0] + f.width * f.scale + dotMargin,
    f.points[0][1] + f.height * f.scale + dotMargin
  ],
  pointCScale: (f) => [
    f.points[0][0] - dotMargin,
    f.points[0][1] + f.height * f.scale + dotMargin
  ],
  pointDScale: (f) => [
    f.points[0][0] + f.width * f.scale + dotMargin,
    f.points[0][1] - dotMargin
  ],
};

export const resizeFigure = (figure, resizingDotName, { x, y, isShiftPressed }) => {
  if (isShiftPressed) {
    if (['line', 'arrow'].includes(figure.type)) {
      let pointA = figure.points[0];
      let pointB = figure.points[1];

      let startPoint

      if (resizingDotName === 'pointA') { startPoint = pointB; }
      if (resizingDotName === 'pointB') { startPoint = pointA; }

      const result = applySoftSnap(startPoint[0], startPoint[1], x, y);

      x = result.x;
      y = result.y;
    }

    if (['rectangle', 'oval'].includes(figure.type)) {
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
    case 'pointAScale': {
      const [anchorX, anchorY] = anchorPoints.pointAScale(figure);

      const dx = (anchorX - x) / figure.width;
      const dy = (anchorY - y) / figure.height;

      const delta = Math.max(dx, dy);
      const newScale = Math.max(figureMinScale, figure.scale + delta);

      const scaleDiff = newScale - figure.scale;

      figure.points[0][0] -= figure.width * scaleDiff;
      figure.points[0][1] -= figure.height * scaleDiff;
      figure.scale = newScale;
      break;
    }
    case 'pointBScale': {
      const [anchorX, anchorY] = anchorPoints.pointBScale(figure);

      const dx = (x - anchorX) / figure.width;
      const dy = (y - anchorY) / figure.height;

      const delta = Math.max(dx, dy);
      const newScale = Math.max(figureMinScale, figure.scale + delta);

      figure.scale = newScale
      break;
    }
    case 'pointCScale': {
      const [anchorX, anchorY] = anchorPoints.pointCScale(figure);

      const dx = (anchorX - x) / figure.width;
      const dy = (y - anchorY) / figure.height;

      const delta = Math.max(dx, dy);
      const newScale = Math.max(figureMinScale, figure.scale + delta);

      const scaleDiff = newScale - figure.scale;

      figure.points[0][0] -= figure.width * scaleDiff;
      figure.scale = newScale;
      break;
    }
    case 'pointDScale': {
      const [anchorX, anchorY] = anchorPoints.pointDScale(figure);

      const dx = (x - anchorX) / figure.width;
      const dy = (anchorY - y) / figure.height;

      const delta = Math.max(dx, dy);
      const newScale = Math.max(figureMinScale, figure.scale + delta);

      const scaleDiff = newScale - figure.scale;

      figure.points[0][1] -= figure.height * scaleDiff;
      figure.scale = newScale;
      break;
    }
  }
}

const getPointsCenter = (figure) => {
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

  return Math.min(Math.max(Math.abs(dx / dy), 0.02), 50);
}
