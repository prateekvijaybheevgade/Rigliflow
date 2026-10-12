import React, { useRef, useState, useEffect } from 'react';
import {
  FlowNode,
  FlowEdge,
  PortPosition,
  Point,
  DraggingPortState,
  DiagramPage,
} from '../types/flowchart';
import { NodeComponent } from './NodeComponent';
import { EdgeComponent } from './EdgeComponent';
import { calculateEdgePath, getPortCoordinates } from '../utils/geometry';
import {
  Plus,
  Trash2,
  Copy,
  Pencil,
  Check,
  Maximize2,
  ZoomIn,
  ZoomOut,
  Map as MapIcon,
  Grid,
  FileText,
  ChevronRight,
  MoreVertical,
} from 'lucide-react';

interface CanvasProps {
  nodes: FlowNode[];
  edges: FlowEdge[];
  selectedNodeIds: string[];
  selectedEdgeId: string | null;
  onSelectNode: (nodeId: string, multi: boolean) => void;
  onSelectEdge: (edgeId: string) => void;
  onClearSelection: () => void;
  onUpdateNodePosition: (nodeId: string, x: number, y: number) => void;
  onBatchUpdateNodePositions: (positions: { id: string; x: number; y: number }[]) => void;
  onUpdateNodeText: (nodeId: string, label: string, sublabel?: string) => void;
  onAddEdge: (newEdge: Omit<FlowEdge, 'id'>) => void;
  onDeleteEdge: (edgeId: string) => void;
  onUpdateEdgeLabel: (edgeId: string, label: string) => void;
  zoom: number;
  pan: Point;
  onPanChange: (pan: Point) => void;
  onZoomChange: (zoom: number) => void;
  snapToGrid: boolean;
  gridSize?: number;
  canvasBg?: string;
  gridType?: 'dots' | 'lines' | 'none';
  pageView?: boolean;
  commentsCountByNodeId?: Record<string, number>;
  hasUnresolvedCommentsByNodeId?: Record<string, boolean>;
  onOpenNodeComments?: (nodeId: string) => void;

  // Multi-Page support (draw.io style)
  pages?: DiagramPage[];
  activePageIndex?: number;
  onSelectPage?: (index: number) => void;
  onAddPage?: () => void;
  onRenamePage?: (index: number, newName: string) => void;
  onDeletePage?: (index: number) => void;
  onDuplicatePage?: (index: number) => void;
}

export const Canvas: React.FC<CanvasProps> = ({
  nodes,
  edges,
  selectedNodeIds,
  selectedEdgeId,
  onSelectNode,
  onSelectEdge,
  onClearSelection,
  onUpdateNodePosition,
  onBatchUpdateNodePositions,
  onUpdateNodeText,
  onAddEdge,
  onDeleteEdge,
  onUpdateEdgeLabel,
  zoom,
  pan,
  onPanChange,
  onZoomChange,
  snapToGrid,
  gridSize = 16,
  canvasBg = '#F8FAFC',
  gridType = 'dots',
  pageView = false,
  commentsCountByNodeId,
  hasUnresolvedCommentsByNodeId,
  onOpenNodeComments,

  pages = [],
  activePageIndex = 0,
  onSelectPage,
  onAddPage,
  onRenamePage,
  onDeletePage,
  onDuplicatePage,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Dragging Nodes state
  const [isDraggingNode, setIsDraggingNode] = useState(false);
  const dragStartMousePos = useRef<Point>({ x: 0, y: 0 });
  const initialNodePositions = useRef<{ id: string; x: number; y: number }[]>([]);

  // Canvas Panning state
  const [isPanning, setIsPanning] = useState(false);
  const panStartMousePos = useRef<Point>({ x: 0, y: 0 });
  const initialPan = useRef<Point>({ x: 0, y: 0 });

  // Dragging connection wire from a port
  const [draggingPort, setDraggingPort] = useState<DraggingPortState | null>(null);
  const [hoveredTargetNodeId, setHoveredTargetNodeId] = useState<string | null>(null);

  // Mini-map open state
  const [isMiniMapOpen, setIsMiniMapOpen] = useState(false);

  // Page tab renaming state
  const [editingPageIndex, setEditingPageIndex] = useState<number | null>(null);
  const [editingPageTitle, setEditingPageTitle] = useState('');

  // Marquee box selection
  const [marqueeStart, setMarqueeStart] = useState<Point | null>(null);
  const [marqueeCurrent, setMarqueeCurrent] = useState<Point | null>(null);

  // Convert client mouse coords to canvas coords
  const screenToCanvas = (screenX: number, screenY: number): Point => {
    if (!containerRef.current) return { x: 0, y: 0 };
    const rect = containerRef.current.getBoundingClientRect();
    return {
      x: (screenX - rect.left - pan.x) / zoom,
      y: (screenY - rect.top - pan.y) / zoom,
    };
  };

  // Node Drag Start
  const handleNodeDragStart = (e: React.MouseEvent, clickedNode: FlowNode) => {
    e.stopPropagation();
    setIsDraggingNode(true);
    dragStartMousePos.current = { x: e.clientX, y: e.clientY };

    const isAlreadySelected = selectedNodeIds.includes(clickedNode.id);
    const activeIds = isAlreadySelected ? selectedNodeIds : [clickedNode.id];

    initialNodePositions.current = nodes
      .filter((n) => activeIds.includes(n.id))
      .map((n) => ({ id: n.id, x: n.x, y: n.y }));
  };

  // Port Mouse Down (Start connecting)
  const handlePortMouseDown = (e: React.MouseEvent, nodeId: string, port: PortPosition) => {
    const node = nodes.find((n) => n.id === nodeId);
    if (!node) return;

    const startPoint = getPortCoordinates(node, port);
    setDraggingPort({
      nodeId,
      port,
      startPoint,
      currentPoint: startPoint,
    });
  };

  // Global mouse move
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      // 1. Panning canvas
      if (isPanning) {
        const dx = e.clientX - panStartMousePos.current.x;
        const dy = e.clientY - panStartMousePos.current.y;
        onPanChange({
          x: initialPan.current.x + dx,
          y: initialPan.current.y + dy,
        });
        return;
      }

      // 2. Marquee selection
      if (marqueeStart) {
        const canvasPos = screenToCanvas(e.clientX, e.clientY);
        setMarqueeCurrent(canvasPos);
        return;
      }

      // 3. Dragging Nodes
      if (isDraggingNode && initialNodePositions.current.length > 0) {
        const dx = (e.clientX - dragStartMousePos.current.x) / zoom;
        const dy = (e.clientY - dragStartMousePos.current.y) / zoom;

        const updatedPositions = initialNodePositions.current.map((initial) => {
          let newX = initial.x + dx;
          let newY = initial.y + dy;

          if (snapToGrid) {
            newX = Math.round(newX / gridSize) * gridSize;
            newY = Math.round(newY / gridSize) * gridSize;
          }

          return { id: initial.id, x: newX, y: newY };
        });

        onBatchUpdateNodePositions(updatedPositions);
        return;
      }

      // 4. Dragging Port Connection Wire
      if (draggingPort) {
        const canvasPos = screenToCanvas(e.clientX, e.clientY);
        setDraggingPort((prev) => (prev ? { ...prev, currentPoint: canvasPos } : null));

        const targetNode = nodes.find(
          (n) =>
            n.id !== draggingPort.nodeId &&
            canvasPos.x >= n.x &&
            canvasPos.x <= n.x + n.width &&
            canvasPos.y >= n.y &&
            canvasPos.y <= n.y + n.height
        );
        setHoveredTargetNodeId(targetNode ? targetNode.id : null);
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (isPanning) {
        setIsPanning(false);
      }

      if (isDraggingNode) {
        setIsDraggingNode(false);
      }

      // Marquee selection end
      if (marqueeStart && marqueeCurrent) {
        const x1 = Math.min(marqueeStart.x, marqueeCurrent.x);
        const x2 = Math.max(marqueeStart.x, marqueeCurrent.x);
        const y1 = Math.min(marqueeStart.y, marqueeCurrent.y);
        const y2 = Math.max(marqueeStart.y, marqueeCurrent.y);

        const insideNodes = nodes.filter(
          (n) => n.x < x2 && n.x + n.width > x1 && n.y < y2 && n.y + n.height > y1
        );

        if (insideNodes.length > 0) {
          insideNodes.forEach((n, idx) => {
            onSelectNode(n.id, idx > 0);
          });
        }
        setMarqueeStart(null);
        setMarqueeCurrent(null);
      } else if (marqueeStart) {
        setMarqueeStart(null);
        setMarqueeCurrent(null);
      }

      if (draggingPort) {
        const canvasPos = screenToCanvas(e.clientX, e.clientY);

        const targetNode = nodes.find(
          (n) =>
            n.id !== draggingPort.nodeId &&
            canvasPos.x >= n.x - 24 &&
            canvasPos.x <= n.x + n.width + 24 &&
            canvasPos.y >= n.y - 24 &&
            canvasPos.y <= n.y + n.height + 24
        );

        if (targetNode) {
          const sourceNode = nodes.find((n) => n.id === draggingPort.nodeId);
          let toPort: PortPosition = 'top';

          if (sourceNode) {
            const dx = targetNode.x + targetNode.width / 2 - (sourceNode.x + sourceNode.width / 2);
            const dy = targetNode.y + targetNode.height / 2 - (sourceNode.y + sourceNode.height / 2);

            if (Math.abs(dx) > Math.abs(dy)) {
              toPort = dx > 0 ? 'left' : 'right';
            } else {
              toPort = dy > 0 ? 'top' : 'bottom';
            }
          }

          onAddEdge({
            from: draggingPort.nodeId,
            to: targetNode.id,
            fromPort: draggingPort.port,
            toPort,
            curveType: 'orthogonal',
            style: 'solid',
            color: '#64748B',
          });
        }

        setDraggingPort(null);
        setHoveredTargetNodeId(null);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [
    isPanning,
    isDraggingNode,
    draggingPort,
    marqueeStart,
    marqueeCurrent,
    zoom,
    pan,
    nodes,
    snapToGrid,
    gridSize,
    selectedNodeIds,
  ]);

  // Zoom with scroll wheel
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (e.ctrlKey || e.metaKey) {
      const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
      const newZoom = Math.min(2.5, Math.max(0.25, zoom * zoomFactor));

      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        const newPanX = mouseX - (mouseX - pan.x) * (newZoom / zoom);
        const newPanY = mouseY - (mouseY - pan.y) * (newZoom / zoom);

        onZoomChange(newZoom);
        onPanChange({ x: newPanX, y: newPanY });
      } else {
        onZoomChange(newZoom);
      }
    } else {
      onPanChange({
        x: pan.x - e.deltaX,
        y: pan.y - e.deltaY,
      });
    }
  };

  // Canvas Mouse Down
  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0) {
      if (e.shiftKey) {
        // Shift + Drag = Marquee Selection
        const canvasPos = screenToCanvas(e.clientX, e.clientY);
        setMarqueeStart(canvasPos);
        setMarqueeCurrent(canvasPos);
      } else {
        // Left click on empty space: clear selection & pan
        onClearSelection();
        setIsPanning(true);
        panStartMousePos.current = { x: e.clientX, y: e.clientY };
        initialPan.current = { ...pan };
      }
    } else if (e.button === 1) {
      // Middle click: pan
      setIsPanning(true);
      panStartMousePos.current = { x: e.clientX, y: e.clientY };
      initialPan.current = { ...pan };
    }
  };

  // Mini-map click to pan
  const handleMiniMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickXRatio = (e.clientX - rect.left) / rect.width;
    const clickYRatio = (e.clientY - rect.top) / rect.height;

    // Mini-map represents 3000x2000 virtual space
    const targetCanvasX = clickXRatio * 2400;
    const targetCanvasY = clickYRatio * 1800;

    if (containerRef.current) {
      const cRect = containerRef.current.getBoundingClientRect();
      const newPanX = cRect.width / 2 - targetCanvasX * zoom;
      const newPanY = cRect.height / 2 - targetCanvasY * zoom;
      onPanChange({ x: newPanX, y: newPanY });
    }
  };

  const nodeMap = new Map<string, FlowNode>();
  nodes.forEach((n) => nodeMap.set(n.id, n));

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full overflow-hidden select-none cursor-default"
      style={{ backgroundColor: canvasBg }}
      onWheel={handleWheel}
      onMouseDown={handleCanvasMouseDown}
    >
      {/* Dynamic Grid Background */}
      {gridType !== 'none' && (
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          <defs>
            {gridType === 'dots' ? (
              <pattern
                id="canvas-grid-dots"
                width={gridSize * zoom}
                height={gridSize * zoom}
                patternUnits="userSpaceOnUse"
                patternTransform={`translate(${pan.x % (gridSize * zoom)}, ${pan.y % (gridSize * zoom)})`}
              >
                <circle
                  cx={gridSize * zoom * 0.5}
                  cy={gridSize * zoom * 0.5}
                  r={1.2 * Math.max(0.6, zoom * 0.8)}
                  fill={canvasBg === '#0F172A' ? '#334155' : canvasBg === '#0C4A6E' ? '#0369A1' : '#CBD5E1'}
                />
              </pattern>
            ) : (
              <pattern
                id="canvas-grid-lines"
                width={gridSize * zoom}
                height={gridSize * zoom}
                patternUnits="userSpaceOnUse"
                patternTransform={`translate(${pan.x % (gridSize * zoom)}, ${pan.y % (gridSize * zoom)})`}
              >
                <path
                  d={`M ${gridSize * zoom} 0 L 0 0 0 ${gridSize * zoom}`}
                  fill="none"
                  stroke={canvasBg === '#0F172A' ? '#1E293B' : '#E2E8F0'}
                  strokeWidth="0.8"
                />
              </pattern>
            )}
          </defs>
          <rect
            width="100%"
            height="100%"
            fill={gridType === 'dots' ? 'url(#canvas-grid-dots)' : 'url(#canvas-grid-lines)'}
          />
        </svg>
      )}

      {/* Printable Page Boundary (draw.io Page View mode) */}
      {pageView && (
        <div
          className="absolute pointer-events-none border border-slate-300/80 bg-white shadow-lg"
          style={{
            transform: `translate(${pan.x + 80 * zoom}px, ${pan.y + 40 * zoom}px) scale(${zoom})`,
            width: '1280px',
            height: '880px',
            opacity: 0.85,
            zIndex: 1,
          }}
        >
          <div className="absolute top-2 left-3 text-[9px] font-bold uppercase tracking-wider text-slate-400">
            Page 1 [A4 / Landscape Frame]
          </div>
        </div>
      )}

      {/* Scaled & Translated Canvas Content Container */}
      <div
        className="absolute origin-top-left will-change-transform z-10"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          width: '4000px',
          height: '3000px',
        }}
      >
        {/* SVG Layer for Edges and Wire Connections */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none overflow-visible"
          style={{ pointerEvents: 'none' }}
        >
          {/* Permanent Flow Edges */}
          <g style={{ pointerEvents: 'auto' }}>
            {edges.map((edge) => {
              const fromNode = nodeMap.get(edge.from);
              const toNode = nodeMap.get(edge.to);
              if (!fromNode || !toNode) return null;

              return (
                <EdgeComponent
                  key={edge.id}
                  edge={edge}
                  fromNode={fromNode}
                  toNode={toNode}
                  isSelected={selectedEdgeId === edge.id}
                  onSelect={onSelectEdge}
                  onDelete={onDeleteEdge}
                  onUpdateLabel={onUpdateEdgeLabel}
                />
              );
            })}
          </g>

          {/* Live Dragging Connection Wire */}
          {draggingPort && (
            <g>
              {(() => {
                const { path } = calculateEdgePath(
                  draggingPort.startPoint,
                  draggingPort.currentPoint,
                  draggingPort.port,
                  'top',
                  'smooth'
                );
                return (
                  <>
                    <path
                      d={path}
                      fill="none"
                      stroke="#3B82F6"
                      strokeWidth="2.5"
                      strokeDasharray="6,4"
                      className="animate-pulse"
                    />
                    <circle
                      cx={draggingPort.currentPoint.x}
                      cy={draggingPort.currentPoint.y}
                      r="5"
                      fill="#3B82F6"
                    />
                  </>
                );
              })()}
            </g>
          )}

          {/* Live Marquee Box Selection */}
          {marqueeStart && marqueeCurrent && (
            <rect
              x={Math.min(marqueeStart.x, marqueeCurrent.x)}
              y={Math.min(marqueeStart.y, marqueeCurrent.y)}
              width={Math.abs(marqueeCurrent.x - marqueeStart.x)}
              height={Math.abs(marqueeCurrent.y - marqueeStart.y)}
              fill="rgba(59, 130, 246, 0.08)"
              stroke="#3B82F6"
              strokeWidth="1.5"
              strokeDasharray="4,3"
            />
          )}
        </svg>

        {/* Nodes Layer */}
        {nodes.map((node) => (
          <NodeComponent
            key={node.id}
            node={node}
            isSelected={selectedNodeIds.includes(node.id)}
            onSelect={onSelectNode}
            onDragStart={handleNodeDragStart}
            onPortMouseDown={handlePortMouseDown}
            onUpdateText={onUpdateNodeText}
            zoom={zoom}
            commentCount={commentsCountByNodeId ? commentsCountByNodeId[node.id] || 0 : undefined}
            hasUnresolvedComments={
              hasUnresolvedCommentsByNodeId ? hasUnresolvedCommentsByNodeId[node.id] : undefined
            }
            onOpenComments={onOpenNodeComments}
          />
        ))}

        {/* Target Node Drop Glow */}
        {hoveredTargetNodeId && (() => {
          const hoveredNode = nodeMap.get(hoveredTargetNodeId);
          if (!hoveredNode) return null;
          return (
            <div
              className="absolute pointer-events-none border-2 border-emerald-500 rounded-lg animate-pulse"
              style={{
                left: hoveredNode.x - 4,
                top: hoveredNode.y - 4,
                width: hoveredNode.width + 8,
                height: hoveredNode.height + 8,
              }}
            />
          );
        })()}
      </div>

      {/* Floating Canvas Quick Navigation Bar (Bottom Left) */}
      <div className="absolute bottom-11 left-3 z-30 flex items-center gap-1 bg-white/95 backdrop-blur-md px-2 py-1.5 rounded-xl border border-slate-200/90 shadow-sm text-xs select-none">
        <button
          onClick={() => onZoomChange(Math.max(0.25, zoom - 0.15))}
          className="p-1 hover:bg-slate-100 rounded text-slate-600 cursor-pointer"
          title="Zoom Out"
        >
          <ZoomOut size={13} />
        </button>
        <button
          onClick={() => {
            onZoomChange(1);
            onPanChange({ x: 80, y: 40 });
          }}
          className="px-1.5 font-bold text-[11px] text-slate-700 hover:bg-slate-100 rounded cursor-pointer"
          title="Reset to 100%"
        >
          {Math.round(zoom * 100)}%
        </button>
        <button
          onClick={() => onZoomChange(Math.min(2.5, zoom + 0.15))}
          className="p-1 hover:bg-slate-100 rounded text-slate-600 cursor-pointer"
          title="Zoom In"
        >
          <ZoomIn size={13} />
        </button>
      </div>

      {/* Floating Mini-Map / Navigator Radar (Bottom Right) */}
      <div className="absolute bottom-11 right-3 z-30 flex flex-col items-end gap-1.5 select-none">
        {isMiniMapOpen && (
          <div className="bg-white/95 backdrop-blur-md p-2 rounded-xl border border-slate-200 shadow-xl w-48 animate-in fade-in zoom-in-95 duration-100">
            <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-slate-100 text-[10.5px] font-bold text-slate-600">
              <span className="flex items-center gap-1">
                <MapIcon size={12} className="text-blue-600" />
                Navigator
              </span>
              <button
                onClick={() => setIsMiniMapOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-0.5 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Radar Canvas */}
            <div
              onClick={handleMiniMapClick}
              className="relative w-full h-28 bg-slate-50 border border-slate-200 rounded-lg overflow-hidden cursor-crosshair"
              title="Click on navigator to pan canvas"
            >
              {/* Miniature Node Boxes */}
              {nodes.map((n) => {
                const rx = (n.x / 2400) * 100;
                const ry = (n.y / 1800) * 100;
                const rw = Math.max(3, (n.width / 2400) * 100);
                const rh = Math.max(2, (n.height / 1800) * 100);
                return (
                  <div
                    key={n.id}
                    className="absolute rounded-[1px]"
                    style={{
                      left: `${rx}%`,
                      top: `${ry}%`,
                      width: `${rw}%`,
                      height: `${rh}%`,
                      backgroundColor: n.color || '#3B82F6',
                      opacity: 0.8,
                    }}
                  />
                );
              })}

              {/* Viewport Camera Box */}
              {containerRef.current && (() => {
                const cRect = containerRef.current.getBoundingClientRect();
                const camX = (-pan.x / (2400 * zoom)) * 100;
                const camY = (-pan.y / (1800 * zoom)) * 100;
                const camW = (cRect.width / (2400 * zoom)) * 100;
                const camH = (cRect.height / (1800 * zoom)) * 100;

                return (
                  <div
                    className="absolute border border-blue-500 bg-blue-500/15 pointer-events-none"
                    style={{
                      left: `${camX}%`,
                      top: `${camY}%`,
                      width: `${camW}%`,
                      height: `${camH}%`,
                    }}
                  />
                );
              })()}
            </div>
            <div className="mt-1 text-[9px] text-slate-400 text-center">
              Click radar to pan camera
            </div>
          </div>
        )}

        {/* Toggle Mini-Map Button */}
        <button
          onClick={() => setIsMiniMapOpen(!isMiniMapOpen)}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium shadow-xs transition-all cursor-pointer ${
            isMiniMapOpen
              ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
              : 'bg-white/95 backdrop-blur-md text-slate-600 hover:text-slate-900 border-slate-200/90 hover:border-slate-300'
          }`}
          title="Toggle Canvas Navigator Radar"
        >
          <MapIcon size={13} />
          <span className="hidden sm:inline">Navigator</span>
        </button>
      </div>

      {/* Multi-Page Bottom Tab Bar (Diagrams.net / Modern IDE Tab Style) */}
      <footer className="absolute bottom-0 inset-x-0 h-9 bg-white/95 backdrop-blur-md border-t border-slate-200/90 px-3 flex items-center justify-between z-30 select-none shadow-[0_-1px_2px_rgba(0,0,0,0.02)]">
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-none py-0.5">
          {pages.length === 0 ? (
            <div className="flex items-center gap-1.5 px-3 py-1 bg-white text-slate-900 font-semibold text-xs rounded-md border border-slate-200 shadow-xs">
              <FileText size={12} className="text-blue-600" />
              <span>Page 1</span>
            </div>
          ) : (
            pages.map((p, idx) => {
              const isActive = idx === activePageIndex;
              return (
                <div
                  key={p.id}
                  className={`group relative flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-md border transition-all cursor-pointer ${
                    isActive
                      ? 'bg-white text-slate-900 border-slate-200 font-semibold shadow-xs ring-1 ring-slate-900/5'
                      : 'bg-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100/70 border-transparent'
                  }`}
                  onClick={() => onSelectPage && onSelectPage(idx)}
                >
                  <FileText size={11} className={isActive ? 'text-blue-600' : 'text-slate-400'} />
                  {editingPageIndex === idx ? (
                    <input
                      type="text"
                      autoFocus
                      value={editingPageTitle}
                      onChange={(e) => setEditingPageTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          if (onRenamePage && editingPageTitle.trim()) {
                            onRenamePage(idx, editingPageTitle.trim());
                          }
                          setEditingPageIndex(null);
                        } else if (e.key === 'Escape') {
                          setEditingPageIndex(null);
                        }
                      }}
                      onBlur={() => {
                        if (onRenamePage && editingPageTitle.trim()) {
                          onRenamePage(idx, editingPageTitle.trim());
                        }
                        setEditingPageIndex(null);
                      }}
                      className="w-20 px-1 py-0.5 bg-slate-50 text-slate-900 border border-slate-300 rounded text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  ) : (
                    <span
                      onDoubleClick={(e) => {
                        e.stopPropagation();
                        setEditingPageIndex(idx);
                        setEditingPageTitle(p.name);
                      }}
                      title="Double click to rename page"
                    >
                      {p.name}
                    </span>
                  )}

                  {/* Actions dropdown button on hover */}
                  {isActive && !editingPageIndex && (
                    <div className="flex items-center gap-0.5 ml-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingPageIndex(idx);
                          setEditingPageTitle(p.name);
                        }}
                        className="p-0.5 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-700 transition-colors"
                        title="Rename page"
                      >
                        <Pencil size={10} />
                      </button>
                      {onDuplicatePage && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDuplicatePage(idx);
                          }}
                          className="p-0.5 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-700 transition-colors"
                          title="Duplicate page"
                        >
                          <Copy size={10} />
                        </button>
                      )}
                      {pages.length > 1 && onDeletePage && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeletePage(idx);
                          }}
                          className="p-0.5 hover:bg-rose-50 rounded text-slate-400 hover:text-rose-600 transition-colors"
                          title="Delete page"
                        >
                          <Trash2 size={10} />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}

          {/* Add Page Button */}
          {onAddPage && (
            <button
              onClick={onAddPage}
              className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-slate-500 hover:text-slate-800 hover:bg-slate-100/80 rounded-md transition-colors cursor-pointer"
              title="Add new diagram page"
            >
              <Plus size={12} />
              <span className="hidden sm:inline">Add Page</span>
            </button>
          )}
        </div>

        {/* Canvas Status info (Unboxed clean metadata with typographic separators) */}
        <div className="hidden md:flex items-center gap-2 text-xs text-slate-400">
          <span>{nodes.length} nodes</span>
          <span aria-hidden="true">·</span>
          <span>{edges.length} wires</span>
          <span aria-hidden="true">·</span>
          <span className="text-slate-600 font-medium">{pageView ? 'Page Mode' : 'Infinite'}</span>
        </div>
      </footer>
    </div>
  );
};
