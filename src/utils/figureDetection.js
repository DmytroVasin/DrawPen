import { pointToSegmentDistance } from './general.js';

const withinRadius = (x, y) => {
  const radius = 10

  return (point) => {
    const [pointX, pointY] = point;

    return Math.hypot(pointX - x, pointY - y) <= radius;
  }
}

export const IsOnCurve = (x, y, figurePoints) => {
  const threshold = 10

  for (let i = 0; i < figurePoints.length - 1; i++) {
    const pointA = figurePoints[i];
    const pointB = figurePoints[i + 1];

    const distance = pointToSegmentDistance(x, y, pointA, pointB);

    if (distance <= threshold) {
      return true;
    }
  }

  return false
}

export const IsOnLine = (x, y, figurePoints) => {
  return IsOnCurve(x, y, figurePoints)
}

export const IsOnArrow = (x, y, figurePoints) => {
  return IsOnCurve(x, y, figurePoints)
}

export const IsOnOval = (x, y, figurePoints) => {
  const tolerance = 0.15;

  const [startX, startY] = figurePoints[0];
  const [endX, endY] = figurePoints[1];

  let radiusX = Math.abs(endX - startX) / 2;
  let radiusY = Math.abs(endY - startY) / 2;
  let centerX = Math.min(startX, endX) + radiusX;
  let centerY = Math.min(startY, endY) + radiusY;

  const normalizedX = (x - centerX) / radiusX;
  const normalizedY = (y - centerY) / radiusY;

  const distance = Math.abs(normalizedX * normalizedX + normalizedY * normalizedY - 1); // TODO: Rethink formula!

  if (distance <= tolerance) {
    return true
  }

  return false
}

export const IsOnRectangle = (x, y, figurePoints) => {
  const tolerance = 5;
  const [startX, startY] = figurePoints[0];
  const [endX, endY] = figurePoints[1];

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

export const IsOnTwoDots = (x, y, figurePoints) => {
  const [a, b] = figurePoints

  const inRadius = withinRadius(x, y)

  if (inRadius(a)) return 'pointA'
  if (inRadius(b)) return 'pointB'

  return null
}

export const IsOnFourDots = (x, y, figurePoints) => {
  const [startX, startY] = figurePoints[0];
  const [endX, endY] = figurePoints[1];

  const inRadius = withinRadius(x, y)

  if (inRadius([startX, startY])) return 'pointA'
  if (inRadius([endX, endY])) return 'pointB'
  if (inRadius([startX, endY])) return 'pointC'
  if (inRadius([endX, startY])) return 'pointD'

  return null
}
