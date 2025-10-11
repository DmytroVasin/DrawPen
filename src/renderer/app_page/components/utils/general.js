import { LazyBrush } from "lazy-brush";
import { widthList, SNAP_ANGLE } from '../constants.js'

// https://github.com/steveruizok/perfect-freehand/tree/main
export const getSvgPathFromStroke = (stroke) => {
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

// Remove points that are too close to each other
export const filterClosePoints = (points) => {
  if (points.length <= 1) { return points }

  const minDistance = 2;
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

export const getMouseCoordinates = (event) => {
  return {
    x: event.nativeEvent.pageX,
    y: event.nativeEvent.pageY,
  };
}

export const distanceBetweenPoints = (pointA, pointB) => {
  const [startX, startY] = pointA
  const [endX, endY] = pointB

  return Math.sqrt((endX - startX) ** 2 + (endY - startY) ** 2)
}

export const calculateCanvasTextWidth = (text, widthIndex) => {
  const dummyCanvas = document.createElement('canvas');
  const dummyCanvasCtx = dummyCanvas.getContext('2d');

  const fontSize = widthList[widthIndex].font_size
  const font_line_height_compensation = widthList[widthIndex].font_line_height_compensation

  dummyCanvasCtx.font = `${fontSize}px Excalifont`;

  const lines = text.split('\n');

  // Width Detection:
  const maxLineWidth = Math.max(...lines.map(line => dummyCanvasCtx.measureText(line).width));

  // Height Detection:
  const standardText = "bpgyЯФ" // єталонний текст!
  const standardMetrics = dummyCanvasCtx.measureText(standardText);

  const lineHeight = standardMetrics.actualBoundingBoxAscent
                      + standardMetrics.actualBoundingBoxDescent
                      + font_line_height_compensation

  const totalHeight = lines.length * lineHeight;

  return [maxLineWidth, totalHeight]
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

export function applySoftSnap(startX, startY, x, y) {
  const dx = x - startX;
  const dy = y - startY;

  const dist = Math.hypot(dx, dy);
  if (dist < 30) { // Minimum distance to apply snapping
    return { x, y }
  }

  const angle = Math.atan2(dy, dx);
  const nearest = Math.round(angle / SNAP_ANGLE) * SNAP_ANGLE;
  const diff = Math.abs(angle - nearest);

  if (diff >= 0.15) { // ~9°
    return { x, y }
  }

  return {
    x: startX + dist * Math.cos(nearest),
    y: startY + dist * Math.sin(nearest),
  };
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
