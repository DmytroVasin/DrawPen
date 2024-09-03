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

  // Dot product AP . AB
  const AB_AB = ABx * ABx + ABy * ABy;
  const AP_AB = APx * ABx + APy * ABy;

  // Project point P onto line AB, computing parameterized position d
  const d = AP_AB / AB_AB;

  if (d < 0) {
    // P projects outside the segment, on the side of A
    return Math.sqrt(APx * APx + APy * APy);
  } else if (d > 1) {
    // P projects outside the segment, on the side of B
    return Math.sqrt(BPx * BPx + BPy * BPy);
  } else {
    // P projects onto the line, calculate the projection
    const projx = x1 + d * ABx;
    const projy = y1 + d * ABy;

    const dx = px - projx;
    const dy = py - projy;

    return Math.sqrt(dx * dx + dy * dy);
  }
}

// Remove points that are too close to each other
export const filterClosePoints = (points) => {
  if (points.length <= 1) { return points }

  const result = [points[0]]

  for (let i = 1; i < points.length - 1; i++) {
    const lastPoint = result[result.length - 1];
    const currentPoint = points[i];

    const lastSum = lastPoint[0] + lastPoint[1];
    const currentSum = currentPoint[0] + currentPoint[1];

    if (Math.abs(currentSum - lastSum) > 1) {
      result.push(currentPoint);
    }
  }

  return result
}
