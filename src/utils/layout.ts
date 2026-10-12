import { FlowNode, FlowEdge } from '../types/flowchart';

/**
 * Auto-layout flowchart using hierarchical topological layering
 */
export function autoLayoutDiagram(
  nodes: FlowNode[],
  edges: FlowEdge[],
  direction: 'top-down' | 'left-right' = 'top-down',
  startX = 100,
  startY = 80
): FlowNode[] {
  if (nodes.length === 0) return [];

  const nodeMap = new Map<string, FlowNode>();
  nodes.forEach((n) => nodeMap.set(n.id, { ...n }));

  // Build in-degree and adjacency
  const inDegree = new Map<string, number>();
  const outEdges = new Map<string, string[]>();

  nodes.forEach((n) => {
    inDegree.set(n.id, 0);
    outEdges.set(n.id, []);
  });

  edges.forEach((e) => {
    if (nodeMap.has(e.from) && nodeMap.has(e.to) && e.from !== e.to) {
      inDegree.set(e.to, (inDegree.get(e.to) || 0) + 1);
      outEdges.get(e.from)?.push(e.to);
    }
  });

  // Assign layers using BFS / longest path from roots
  const layers: string[][] = [];
  const assigned = new Set<string>();

  // Find root nodes (inDegree === 0)
  let currentLayer = nodes.filter((n) => (inDegree.get(n.id) || 0) === 0).map((n) => n.id);

  if (currentLayer.length === 0) {
    // If cycle exists, pick the first node
    currentLayer = [nodes[0].id];
  }

  while (currentLayer.length > 0) {
    layers.push(currentLayer);
    currentLayer.forEach((id) => assigned.add(id));

    const nextLayerSet = new Set<string>();
    currentLayer.forEach((id) => {
      const children = outEdges.get(id) || [];
      children.forEach((childId) => {
        if (!assigned.has(childId)) {
          nextLayerSet.add(childId);
        }
      });
    });

    currentLayer = Array.from(nextLayerSet);
  }

  // Any unassigned nodes (disconnected components)
  const remaining = nodes.filter((n) => !assigned.has(n.id)).map((n) => n.id);
  if (remaining.length > 0) {
    layers.push(remaining);
  }

  // Position nodes per layer
  const updatedNodes = [...nodes];
  const isTopDown = direction === 'top-down';

  const xSpacing = 260;
  const ySpacing = 160;

  layers.forEach((layerNodeIds, layerIndex) => {
    const layerSize = layerNodeIds.length;

    layerNodeIds.forEach((id, itemIndex) => {
      const nodeIndex = updatedNodes.findIndex((n) => n.id === id);
      if (nodeIndex === -1) return;

      const node = updatedNodes[nodeIndex];

      if (isTopDown) {
        // Center the layer horizontally around startX + offset
        const totalLayerWidth = (layerSize - 1) * xSpacing;
        const layerStartX = startX + 350 - totalLayerWidth / 2;
        const posX = Math.max(80, layerStartX + itemIndex * xSpacing - node.width / 2);
        const posY = startY + layerIndex * ySpacing;

        updatedNodes[nodeIndex] = {
          ...node,
          x: Math.round(posX),
          y: Math.round(posY),
        };
      } else {
        // Left to right
        const totalLayerHeight = (layerSize - 1) * ySpacing;
        const layerStartY = startY + 250 - totalLayerHeight / 2;
        const posX = startX + layerIndex * xSpacing;
        const posY = Math.max(60, layerStartY + itemIndex * ySpacing - node.height / 2);

        updatedNodes[nodeIndex] = {
          ...node,
          x: Math.round(posX),
          y: Math.round(posY),
        };
      }
    });
  });

  return updatedNodes;
}
