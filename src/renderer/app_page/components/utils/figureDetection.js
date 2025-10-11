import {
  pointToSegmentDistance,
  segmentsIntersect,
  applySoftSnap,
  applyAspectRatioLock,
} from './general.js';

import { dotMargin, figureMinScale } from '../constants.js'

const withinRadius = (x, y) => {
  const radius = 10

  return (point) => {
    const [pointX, pointY] = point;

    return Math.hypot(pointX - x, pointY - y) <= radius;
  }
}

export const IsOnCurve = (x, y, points) => {
  const threshold = 10

  for (let i = 0; i < points.length - 1; i++) {
    const pointA = points[i];
    const pointB = points[i + 1];

    const distance = pointToSegmentDistance(x, y, pointA, pointB);

    if (distance <= threshold) {
      return true;
    }
  }

  return false
}

export const IsOnLine = (x, y, figure) => {
  const { points } = figure

  return IsOnCurve(x, y, points)
}

export const IsOnArrow = (x, y, figure) => {
  const { points } = figure

  // TODO: Make it smarter!
  return IsOnCurve(x, y, points)
}

export const IsOnOval = (x, y, figure) => {
  const { points } = figure
  const tolerance = 0.15;

  const [startX, startY] = points[0];
  const [endX, endY] = points[1];

  let radiusX = Math.abs(endX - startX) / 2;
  let radiusY = Math.abs(endY - startY) / 2;
  let centerX = Math.min(startX, endX) + radiusX;
  let centerY = Math.min(startY, endY) + radiusY;

  // If the oval is too narrow, treat it as a line
  if (radiusX < 5 || radiusY < 5) {
    return IsOnLine(x, y, figure)
  }

  const normalizedX = (x - centerX) / radiusX;
  const normalizedY = (y - centerY) / radiusY;

  const distance = Math.abs(normalizedX * normalizedX + normalizedY * normalizedY - 1); // TODO: Rethink formula!

  if (distance <= tolerance) {
    return true
  }

  return false
}

export const IsOnRectangle = (x, y, figure) => {
  const { points } = figure

  const tolerance = 5;
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

  if (closeToTopEdge || closeToBottomEdge || closeToLeftEdge || closeToRightEdge) { // TODO: Rethink formula!
    return true;
  }

  return false
}

export const IsOnText = (x, y, figure) => {
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

export const IsOnTwoDots = (x, y, figure) => {
  const { points } = figure
  const [a, b] = points

  const inRadius = withinRadius(x, y)

  if (inRadius(a)) return 'pointA'
  if (inRadius(b)) return 'pointB'

  return null
}

export const IsOnFourDots = (x, y, figure) => {
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

export const IsOnTextDots = (x, y, figure) => {
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
      return IsOnArrow(x, y, figure)
    case 'rectangle':
      return IsOnRectangle(x, y, figure)
    case 'oval':
      return IsOnOval(x, y, figure)
    case 'line':
      return IsOnLine(x, y, figure)
    case 'text':
      return IsOnText(x, y, figure)
    default:
      return false
  }
};

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

  if (points.length < 2) {
    const [pointX, pointY] = points[0];

    const threshold = 10
    const distance = Math.hypot(eraseAtX - pointX, eraseAtY - pointY);

    return distance <= threshold
  }

  if (IsOnCurve(eraseAtX, eraseAtY, points)) {
    return true
  }

  return isSegmentIntersectCurve(segmentPoints, points)
}

const isSegmentTouchLine = (segmentPoints, figure) => {
  const { points } = figure
  const [eraseAtX, eraseAtY] = segmentPoints.at(-1);

  if (IsOnLine(eraseAtX, eraseAtY, figure)) {
    return true
  }

  return isSegmentIntersectCurve(segmentPoints, points)
}

const isSegmentTouchRectangle = (segmentPoints, figure) => {
  const { points } = figure
  const [eraseAtX, eraseAtY] = segmentPoints.at(-1);

  if (IsOnRectangle(eraseAtX, eraseAtY, figure)) {
    return true
  }

  const [startX, startY] = points[0];
  const [endX, endY] = points[1];

  const allRectPoints = [
    [startX, startY],
    [endX, startY],
    [endX, endY],
    [startX, endY],
  ];

  return isSegmentIntersectCurve(segmentPoints, allRectPoints)
}

const isSegmentTouchText = (segmentPoints, figure) => {
  const [eraseAtX, eraseAtY] = segmentPoints.at(-1);

  if (IsOnText(eraseAtX, eraseAtY, figure)) {
    return true
  }

  const { points, width, height, scale } = figure
  const startAt = points[0];

  const rectPoints = [
    [startAt[0],                 startAt[1]],
    [startAt[0] + width * scale, startAt[1]],
    [startAt[0] + width * scale, startAt[1] + height * scale],
    [startAt[0],                 startAt[1] + height * scale],
  ];

  return isSegmentIntersectCurve(segmentPoints, rectPoints)
}

const isSegmentTouchOval = (segmentPoints, figure) => {
  const { points } = figure
  const [eraseAtX, eraseAtY] = segmentPoints.at(-1);

  if (IsOnOval(eraseAtX, eraseAtY, figure)) {
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
      return isSegmentTouchCurve(eraserFigure.points, figure)
    case 'arrow':
      return isSegmentTouchLine(eraserFigure.points, figure)
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
      return IsOnTwoDots(x, y, figure) // ['pointA', 'pointB', null]
    case 'oval':
    case 'rectangle':
      return IsOnFourDots(x, y, figure) // ['pointA', 'pointB', 'pointC', 'pointD', null]
    case 'text':
      return IsOnTextDots(x, y, figure) // ['pointA', 'pointB', 'pointC', 'pointD', null]
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
