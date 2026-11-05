import { getStroke } from "perfect-freehand";
import { LazyBrush } from "lazy-brush";
import { widthList, SNAP_ANGLE, dotTextMargin, lineHeightMultiplier, minArrowLength, arrowSetup } from '../constants.js'

export function getPerfectPath2D(points, strokeOptions) {
  const stroke = getStroke(points, strokeOptions);

  const pathData = getSvgPathFromStroke(stroke);
  return new Path2D(pathData);
}

// https://github.com/steveruizok/perfect-freehand/tree/main
const getSvgPathFromStroke = (stroke) => {
  if (!stroke.length) return ''

  const d = stroke.reduce(
    (acc, [x0, y0], i, arr) => {
      const [x1, y1] = arr[(i + 1) % arr.length]
      acc.push(x0, y0, (x0 + x1) / 2, (y0 + y1) / 2)
      return acc
    },
    ['M', ...stroke[0], 'Q']
  )

  d.push('Z')
  return d.join(' ')
}

export const getLazyPoints = (points, options = {}) => {
  const radius = Math.min(options.size / 2, 6)

  const startPoint = points[0]
  let lazyPoints = [startPoint]

  if (startPoint === undefined) return points

  const lazy = new LazyBrush({
    enabled: true,
    radius: radius,
    initialPoint: { x: startPoint[0], y: startPoint[1] },
    friction: 0.2,
  });

  points.forEach((point, index) => {
    if (index === 0) return;

    lazy.update({ x: point[0], y: point[1] })

    if (lazy.brushHasMoved()) {
      const brush = lazy.getBrushCoordinates()

      lazyPoints.push([brush.x, brush.y])
    }
  })

  return lazyPoints
}

// https://en.wikipedia.org/wiki/Distance_from_a_point_to_a_line
// Distance from a point to a line
export const pointToSegmentDistance = (px, py, pointA, pointB) => {
  const [x1, y1] = pointA;
  const [x2, y2] = pointB;

  // Vector AB
  const ABx = x2 - x1;
  const ABy = y2 - y1;

  // Vector AP
  const APx = px - x1;
  const APy = py - y1;

  // Vector BP
  const BPx = px - x2;
  const BPy = py - y2;

  // A and B are the same point
  if (ABx === 0 && ABy === 0) {
    return Math.hypot(APx, APy);
  }

  // Dot product AP . AB
  const AB_AB = ABx * ABx + ABy * ABy;
  const AP_AB = APx * ABx + APy * ABy;

  // Project point P onto line AB, computing parameterized position d
  const d = AP_AB / AB_AB;

  if (d < 0) {
    // P projects outside the segment, on the side of A
    return Math.hypot(APx, APy);
  } else if (d > 1) {
    // P projects outside the segment, on the side of B
    return Math.hypot(BPx, BPy);
  } else {
    // P projects onto the line, calculate the projection
    const projx = x1 + d * ABx;
    const projy = y1 + d * ABy;

    const dx = px - projx;
    const dy = py - projy;

    return Math.hypot(dx, dy);
  }
}

export const getMouseCoordinates = (event) => {
  return {
    x: event.nativeEvent.pageX,
    y: event.nativeEvent.pageY,
  };
}

// Remove points that are too close to each other
export const filterClosePoints = (points, widthIndex) => {
  if (points.length <= 1) { return points }

  const minDistance = widthList[widthIndex].close_point_distance;

  const result = [points[0]]
  let basePoint = result[0]

  for (let i = 1; i < points.length - 1; i++) {
    const [x1, y1] = basePoint;
    const [x2, y2] = points[i];
    const distance = Math.hypot(x2 - x1, y2 - y1);

    if (distance > minDistance) {
      result.push(points[i])
      basePoint = points[i]
    }
  }

  const lastPoint = points[points.length - 1];
  result.push(lastPoint);

  return result
}

export const distanceBetweenPoints = (pointA, pointB) => {
  const [startX, startY] = pointA
  const [endX, endY] = pointB

  return Math.hypot(endX - startX, endY - startY)
}

// Reusable 2D canvas context used only for measuring text dimensions.
let textMeasurementContext;

const getTextMeasurementContext = (widthIndex) => {
  if (!textMeasurementContext) {
    const canvas = document.createElement('canvas');
    textMeasurementContext = canvas.getContext('2d');
  }

  const fontSize = widthList[widthIndex].font_size;

  textMeasurementContext.font = `${fontSize}px Excalifont`;

  return textMeasurementContext;
};

const calculateTextLineHeight = (widthIndex) => {
  const fontSize = widthList[widthIndex].font_size;

  return fontSize * lineHeightMultiplier;
};

export const calculateCanvasTextWidth = (text, widthIndex) => {
  const dummyCanvasCtx = getTextMeasurementContext(widthIndex);

  const lines = text.split('\n');

  // Width Detection:
  const maxLineWidth = Math.max(...lines.map(line => dummyCanvasCtx.measureText(line).width));

  // Height Detection:
  const lineHeight = calculateTextLineHeight(widthIndex);

  const totalHeight = lines.length * lineHeight;

  return [maxLineWidth, totalHeight]
}

export const calculateCanvasTextMinWidth = (widthIndex) => {
  const [width, _height] = calculateCanvasTextWidth('W', widthIndex);

  return width;
}

export const calculateCanvasWrappedTextHeight = (text, widthIndex, textAreaWidth) => {
  const wrappedLines = getWrappedTextLines(text, widthIndex, textAreaWidth);

  const lineHeight = calculateTextLineHeight(widthIndex);

  const totalHeight = wrappedLines.length * lineHeight;

  return totalHeight;
}

const splitStringToFitWidth = (dummyCanvasCtx, string, textAreaWidth) => {
  const result = [];
  let currentPart = '';

  for (const character of string) {
    const nextPart = `${currentPart}${character}`;

    const nextPartWidth = dummyCanvasCtx.measureText(nextPart).width;

    if (currentPart && nextPartWidth > textAreaWidth) {
      result.push(currentPart);
      currentPart = character;
      continue;
    }

    currentPart = nextPart;
  }

  if (currentPart) {
    result.push(currentPart);
  }

  return result;
}

export const getWrappedTextLines = (text, widthIndex, textAreaWidth) => {
  const dummyCanvasCtx = getTextMeasurementContext(widthIndex);

  const lines = text.split('\n');

  const wrappedLines = [];

  lines.forEach(line => {
    const tokens = line.split(/(\s+)/).filter(Boolean);

    let currentLine = '';
    let pendingSpaces = '';

    tokens.forEach(token => {
      if (/^\s+$/.test(token)) {
        pendingSpaces += token;
        return;
      }

      const nextLine = currentLine + pendingSpaces + token;

      const nextLineWidth = dummyCanvasCtx.measureText(nextLine).width;

      if (nextLineWidth <= textAreaWidth) {
        currentLine = nextLine;
        pendingSpaces = '';
        return;
      }

      if (currentLine) {
        wrappedLines.push(currentLine + pendingSpaces);
        pendingSpaces = '';
      } else if (pendingSpaces) {
        wrappedLines.push(pendingSpaces);
        pendingSpaces = '';
      }

      const wrappedWordParts = splitStringToFitWidth(dummyCanvasCtx, token, textAreaWidth);

      wrappedLines.push(...wrappedWordParts.slice(0, -1));
      currentLine = wrappedWordParts.at(-1) || '';
    });

    wrappedLines.push(currentLine);
  });

  return wrappedLines;
}

// https://en.m.wikipedia.org/wiki/Intersection_(geometry)#Two_line_segments
export const segmentsIntersect = (p1, p2, q1, q2) => {
  const cross = (a, b, c) =>
    (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);

  const o1 = cross(p1, p2, q1);
  const o2 = cross(p1, p2, q2);
  const o3 = cross(q1, q2, p1);
  const o4 = cross(q1, q2, p2);

  return (o1 * o2 < 0) && (o3 * o4 < 0);
}

export function calculateAngleSnap(startX, startY, x, y, angleStep = SNAP_ANGLE) {
  const dx = x - startX;
  const dy = y - startY;
  const distance = Math.hypot(dx, dy);
  const angle = Math.atan2(dy, dx);
  const nearest = Math.round(angle / angleStep) * angleStep;

  return {
    x: startX + distance * Math.cos(nearest),
    y: startY + distance * Math.sin(nearest),
    distance: distance,
    angleDifference: Math.abs(angle - nearest),
  };
}

export function applySoftSnap(startX, startY, x, y) {
  const result = calculateAngleSnap(startX, startY, x, y);

  if (result.distance < 30) { // Minimum distance to apply snapping
    return { x: x, y: y }
  }

  if (result.angleDifference >= 0.15) { // ~9°
    return { x: x, y: y }
  }

  return { x: result.x, y: result.y };
}

export function applyAspectRatioLock(startX, startY, x, y, ratio) {
  const EPS = 0.01;
  let dx = x - startX;
  let dy = y - startY;

  if (Math.abs(dx) < EPS) { dx = EPS }
  if (Math.abs(dy) < EPS) { dy = EPS }

  const absDx = Math.abs(dx);
  const absDy = Math.abs(dy);
  const signX = Math.sign(dx);
  const signY = Math.sign(dy);

  const adjustedY = startY + signY * (absDx / ratio); // Варіант 1: фіксуємо ширину, обчислюємо висоту за ratio
  const adjustedX = startX + signX * (absDy * ratio); // Варіант 2: фіксуємо висоту, обчислюємо ширину за ratio

  const useWidthLock = (absDy <= (absDx / ratio)); // Якщо поточна висота курсора менша/рівна дозволеній при цій ширині,

  if (useWidthLock) {
    return { x: x, y: adjustedY } // тримаємо X курсора на вертикальній грані, підганяємо Y за ratio.
  }

  return { x: adjustedX, y: y }; // Інакше тримаємо Y курсора на горизонтальній грані, підганяємо X за ratio.
}

export const calcPointsArrow = (points, widthIndex) => {
  const arrow = arrowSetup[widthIndex]

  // ---

  const [pointA, pointB] = points;
  const [startX, startY] = pointA;
  const [endX, endY] = pointB;

  const diffX = endX - startX;
  const diffY = endY - startY;
  const rawLength = Math.hypot(diffX, diffY) || 1;

  const cos = diffX / rawLength;
  const sin = diffY / rawLength;

  const length = Math.max(rawLength, minArrowLength);
  const scaleFactor = Math.min(length / arrow.max_scale_length, 1)

  // ---

  const d1 = [0,                                      0]
  const d2 = [length - arrow.d2_x * scaleFactor,      arrow.d2_y * scaleFactor]
  const d3 = [length - arrow.d3_x * scaleFactor,      arrow.d3_y * scaleFactor]
  const d4 = [length,                                 0]
  const d5 = [d3[0],                                  d3[1] * -1]
  const d6 = [d2[0],                                  d2[1] * -1]

  function transformPoint([x, y]) {
    return [
      startX + x * cos - y * sin,
      startY + x * sin + y * cos
    ];
  }

  const figurePoints = [d1, d2, d3, d4, d5, d6].map(transformPoint)

  return figurePoints
}

export const calcSegmentsFlatArrow = (points, widthIndex) => {
  const minArrowLength = 20;
  const arrowSetup = [
    { max_scale_length: 70,  max_head_len: 17, max_head_half: 8 },
    { max_scale_length: 92,  max_head_len: 24, max_head_half: 11 },
    { max_scale_length: 121, max_head_len: 33, max_head_half: 15 },
    { max_scale_length: 150, max_head_len: 42, max_head_half: 19 },
    { max_scale_length: 179, max_head_len: 51, max_head_half: 23 },
  ]

  const arrow = arrowSetup[widthIndex]

  const [pointA, pointB] = points;
  const [startX, startY] = pointA;
  const [endX, endY] = pointB;

  const diffX = endX - startX;
  const diffY = endY - startY;
  const rawLength = Math.hypot(diffX, diffY) || 1;

  const cos = diffX / rawLength;
  const sin = diffY / rawLength;

  const length = Math.max(rawLength, minArrowLength);
  const scaleFactor = Math.min(length / arrow.max_scale_length, 1)

  const headLen = arrow.max_head_len * scaleFactor
  const headHalf = arrow.max_head_half * scaleFactor
  const headBaseX = length - headLen

  function transformPoint([x, y]) {
    return [
      startX + x * cos - y * sin,
      startY + x * sin + y * cos
    ];
  }

  const shaftStart = transformPoint([0, 0]);
  const tip        = transformPoint([length, 0]);
  const headTop    = transformPoint([headBaseX, -headHalf]);
  const headBottom = transformPoint([headBaseX, headHalf]);

  return [
    [shaftStart, tip],
    [tip, headTop],
    [tip, headBottom],
  ];
}

export const getCornersWithMargin = (pointA, pointB) => {
  const directionX = pointA[0] <= pointB[0] ? 1 : -1;
  const directionY = pointA[1] <= pointB[1] ? 1 : -1;

  const pointAwithMargin = [
    pointA[0] - directionX * dotTextMargin,
    pointA[1] - directionY * dotTextMargin,
  ];

  const pointBwithMargin = [
    pointB[0] + directionX * dotTextMargin,
    pointB[1] + directionY * dotTextMargin,
  ];

  const pointCwithMargin = [
    pointAwithMargin[0],
    pointBwithMargin[1],
  ];

  const pointDwithMargin = [
    pointBwithMargin[0],
    pointAwithMargin[1],
  ];

  return {
    pointAwithMargin,
    pointBwithMargin,
    pointCwithMargin,
    pointDwithMargin,
  };
}

export const getTextAutoResizeHandle = (figure) => {
  const { points: [startAt], width, height, scale } = figure;
  const [startX, startY] = startAt;

  const textAutoResizeHandleSize = 16;

  const scaledWidth = width * scale;
  const scaledHeight = height * scale;

  if (textAutoResizeHandleSize > scaledHeight * 0.8) {
    return null;
  }

  const handleX = startX + scaledWidth + dotTextMargin * 3;
  const handleY = startY + scaledHeight / 2;

  return {
    startAt: [handleX, handleY - (textAutoResizeHandleSize / 2)],
    endAt:   [handleX, handleY + (textAutoResizeHandleSize / 2)],
  };
}
