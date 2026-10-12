import { FlowNode } from '../types/flowchart';

export type AlignmentType =
  | 'align-left'
  | 'align-center'
  | 'align-right'
  | 'align-top'
  | 'align-middle'
  | 'align-bottom';

export type DistributionType = 'distribute-horizontal' | 'distribute-vertical';

/**
 * Align selected nodes based on alignment type
 */
export function alignNodes(
  allNodes: FlowNode[],
  selectedIds: string[],
  alignment: AlignmentType
): FlowNode[] {
  if (selectedIds.length < 2) return allNodes;

  const selectedNodes = allNodes.filter((n) => selectedIds.includes(n.id));
  if (selectedNodes.length < 2) return allNodes;

  const minX = Math.min(...selectedNodes.map((n) => n.x));
  const maxX = Math.max(...selectedNodes.map((n) => n.x + n.width));
  const minY = Math.min(...selectedNodes.map((n) => n.y));
  const maxY = Math.max(...selectedNodes.map((n) => n.y + n.height));

  const centerX = (minX + maxX) / 2;
  const centerY = (minY + maxY) / 2;

  const updatedMap = new Map<string, { x?: number; y?: number }>();

  selectedNodes.forEach((node) => {
    switch (alignment) {
      case 'align-left':
        updatedMap.set(node.id, { x: minX });
        break;
      case 'align-center':
        updatedMap.set(node.id, { x: Math.round(centerX - node.width / 2) });
        break;
      case 'align-right':
        updatedMap.set(node.id, { x: maxX - node.width });
        break;
      case 'align-top':
        updatedMap.set(node.id, { y: minY });
        break;
      case 'align-middle':
        updatedMap.set(node.id, { y: Math.round(centerY - node.height / 2) });
        break;
      case 'align-bottom':
        updatedMap.set(node.id, { y: maxY - node.height });
        break;
    }
  });

  return allNodes.map((node) => {
    const update = updatedMap.get(node.id);
    if (!update) return node;
    return {
      ...node,
      x: update.x !== undefined ? update.x : node.x,
      y: update.y !== undefined ? update.y : node.y,
    };
  });
}

/**
 * Evenly distribute spacing between selected nodes
 */
export function distributeNodes(
  allNodes: FlowNode[],
  selectedIds: string[],
  distribution: DistributionType
): FlowNode[] {
  if (selectedIds.length < 3) return allNodes;

  const selectedNodes = allNodes.filter((n) => selectedIds.includes(n.id));
  if (selectedNodes.length < 3) return allNodes;

  const updatedMap = new Map<string, { x?: number; y?: number }>();

  if (distribution === 'distribute-horizontal') {
    const sorted = [...selectedNodes].sort((a, b) => a.x - b.x);
    const first = sorted[0];
    const last = sorted[sorted.length - 1];

    const totalWidth = sorted.slice(1, -1).reduce((sum, n) => sum + n.width, 0);
    const span = last.x - (first.x + first.width);
    const gap = (span - totalWidth) / (sorted.length - 1);

    let currentX = first.x + first.width + gap;
    for (let i = 1; i < sorted.length - 1; i++) {
      const node = sorted[i];
      updatedMap.set(node.id, { x: Math.round(currentX) });
      currentX += node.width + gap;
    }
  } else {
    const sorted = [...selectedNodes].sort((a, b) => a.y - b.y);
    const first = sorted[0];
    const last = sorted[sorted.length - 1];

    const totalHeight = sorted.slice(1, -1).reduce((sum, n) => sum + n.height, 0);
    const span = last.y - (first.y + first.height);
    const gap = (span - totalHeight) / (sorted.length - 1);

    let currentY = first.y + first.height + gap;
    for (let i = 1; i < sorted.length - 1; i++) {
      const node = sorted[i];
      updatedMap.set(node.id, { y: Math.round(currentY) });
      currentY += node.height + gap;
    }
  }

  return allNodes.map((node) => {
    const update = updatedMap.get(node.id);
    if (!update) return node;
    return {
      ...node,
      x: update.x !== undefined ? update.x : node.x,
      y: update.y !== undefined ? update.y : node.y,
    };
  });
}

/**
 * Reorder layer depth of selected nodes
 */
export function reorderNodes(
  allNodes: FlowNode[],
  selectedIds: string[],
  action: 'bring-front' | 'send-back'
): FlowNode[] {
  const selected = allNodes.filter((n) => selectedIds.includes(n.id));
  const unselected = allNodes.filter((n) => !selectedIds.includes(n.id));

  if (action === 'bring-front') {
    return [...unselected, ...selected];
  } else {
    return [...selected, ...unselected];
  }
}
