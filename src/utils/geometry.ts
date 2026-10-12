import { FlowNode, FlowEdge, PortPosition, Point } from '../types/flowchart';

/**
 * Get coordinates of a port on a node
 */
export function getPortCoordinates(node: FlowNode, port: PortPosition): Point {
  const { x, y, width, height } = node;

  switch (port) {
    case 'top':
      return { x: x + width / 2, y: y };
    case 'right':
      return { x: x + width, y: y + height / 2 };
    case 'bottom':
      return { x: x + width / 2, y: y + height };
    case 'left':
      return { x: x, y: y + height / 2 };
  }
}

/**
 * Returns outward normal vector for a given port
 */
export function getPortNormal(port: PortPosition): Point {
  switch (port) {
    case 'top':
      return { x: 0, y: -1 };
    case 'right':
      return { x: 1, y: 0 };
    case 'bottom':
      return { x: 0, y: 1 };
    case 'left':
      return { x: -1, y: 0 };
  }
}

/**
 * Generate SVG Path string for edge
 */
export function calculateEdgePath(
  start: Point,
  end: Point,
  fromPort: PortPosition,
  toPort: PortPosition,
  curveType: 'orthogonal' | 'smooth' | 'straight' = 'orthogonal'
): { path: string; labelPoint: Point } {
  if (curveType === 'straight') {
    return {
      path: `M ${start.x} ${start.y} L ${end.x} ${end.y}`,
      labelPoint: { x: (start.x + end.x) / 2, y: (start.y + end.y) / 2 },
    };
  }

  if (curveType === 'smooth') {
    const dx = Math.abs(end.x - start.x);
    const dy = Math.abs(end.y - start.y);
    const offset = Math.max(40, Math.min(180, (dx + dy) * 0.35));

    const n1 = getPortNormal(fromPort);
    const n2 = getPortNormal(toPort);

    const cp1 = { x: start.x + n1.x * offset, y: start.y + n1.y * offset };
    const cp2 = { x: end.x + n2.x * offset, y: end.y + n2.y * offset };

    const path = `M ${start.x} ${start.y} C ${cp1.x} ${cp1.y}, ${cp2.x} ${cp2.y}, ${end.x} ${end.y}`;

    // Approximate midpoint on bezier curve at t = 0.5
    const midX = 0.125 * start.x + 0.375 * cp1.x + 0.375 * cp2.x + 0.125 * end.x;
    const midY = 0.125 * start.y + 0.375 * cp1.y + 0.375 * cp2.y + 0.125 * end.y;

    return { path, labelPoint: { x: midX, y: midY } };
  }

  // Orthogonal (elbow / right-angle path with neat routing)
  const n1 = getPortNormal(fromPort);
  const n2 = getPortNormal(toPort);

  const stub = 24;
  const p1 = { x: start.x + n1.x * stub, y: start.y + n1.y * stub };
  const p2 = { x: end.x + n2.x * stub, y: end.y + n2.y * stub };

  let midPoints: Point[] = [];

  // Routing heuristics
  if (n1.y !== 0 && n2.y !== 0) {
    // Both vertical (e.g. bottom -> top)
    const midY = (p1.y + p2.y) / 2;
    midPoints = [
      { x: p1.x, y: midY },
      { x: p2.x, y: midY },
    ];
  } else if (n1.x !== 0 && n2.x !== 0) {
    // Both horizontal (e.g. right -> left)
    const midX = (p1.x + p2.x) / 2;
    midPoints = [
      { x: midX, y: p1.y },
      { x: midX, y: p2.y },
    ];
  } else if (n1.x !== 0 && n2.y !== 0) {
    // Horizontal start, vertical end
    midPoints = [{ x: p2.x, y: p1.y }];
  } else {
    // Vertical start, horizontal end
    midPoints = [{ x: p1.x, y: p2.y }];
  }

  const allPoints = [start, p1, ...midPoints, p2, end];

  // Build clean path with rounded corners
  const radius = 8;
  let d = `M ${allPoints[0].x} ${allPoints[0].y}`;

  for (let i = 1; i < allPoints.length - 1; i++) {
    const prev = allPoints[i - 1];
    const curr = allPoints[i];
    const next = allPoints[i + 1];

    const d1x = curr.x - prev.x;
    const d1y = curr.y - prev.y;
    const len1 = Math.hypot(d1x, d1y);

    const d2x = next.x - curr.x;
    const d2y = next.y - curr.y;
    const len2 = Math.hypot(d2x, d2y);

    const r = Math.min(radius, len1 / 2, len2 / 2);

    if (r > 1 && (d1x !== 0 || d1y !== 0) && (d2x !== 0 || d2y !== 0)) {
      const u1x = d1x / len1;
      const u1y = d1y / len1;
      const u2x = d2x / len2;
      const u2y = d2y / len2;

      const pBefore = { x: curr.x - u1x * r, y: curr.y - u1y * r };
      const pAfter = { x: curr.x + u2x * r, y: curr.y + u2y * r };

      d += ` L ${pBefore.x} ${pBefore.y} Q ${curr.x} ${curr.y} ${pAfter.x} ${pAfter.y}`;
    } else {
      d += ` L ${curr.x} ${curr.y}`;
    }
  }

  d += ` L ${end.x} ${end.y}`;

  // Find midpoint along the segments for the label
  const totalPoints = allPoints.length;
  const midIndex = Math.floor(totalPoints / 2);
  const labelPoint = {
    x: (allPoints[midIndex - 1].x + allPoints[midIndex].x) / 2,
    y: (allPoints[midIndex - 1].y + allPoints[midIndex].y) / 2,
  };

  return { path: d, labelPoint };
}

/**
 * Calculate bounding box of diagram
 */
export function getDiagramBounds(nodes: FlowNode[], padding = 60) {
  if (nodes.length === 0) {
    return { minX: 0, minY: 0, maxX: 1200, maxY: 800, width: 1200, height: 800 };
  }

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const node of nodes) {
    if (node.x < minX) minX = node.x;
    if (node.y < minY) minY = node.y;
    if (node.x + node.width > maxX) maxX = node.x + node.width;
    if (node.y + node.height > maxY) maxY = node.y + node.height;
  }

  minX -= padding;
  minY -= padding;
  maxX += padding;
  maxY += padding;

  return {
    minX,
    minY,
    maxX,
    maxY,
    width: Math.max(400, maxX - minX),
    height: Math.max(300, maxY - minY),
  };
}
