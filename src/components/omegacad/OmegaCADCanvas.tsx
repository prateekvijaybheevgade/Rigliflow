import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  CadDrawing,
  CadEntity,
} from '../../types/omegacad';
import { RotateCw, Copy, Trash2, ArrowRight } from 'lucide-react';

interface OmegaCADCanvasProps {
  drawing: CadDrawing;
  selectedEntityId: string | null;
  onSelectEntity: (id: string | null) => void;
  onUpdateEntityPosition: (id: string, x: number, y: number) => void;
  onUpdateEntityDimensions: (id: string, width: number, height: number) => void;
  onRotateEntity: (id: string) => void;
  onDuplicateEntity: (id: string) => void;
  onDeleteEntity: (id: string) => void;
  zoom: number;
  onZoomChange: (z: number) => void;
  orthoMode: boolean;
}

export const OmegaCADCanvas: React.FC<OmegaCADCanvasProps> = ({
  drawing,
  selectedEntityId,
  onSelectEntity,
  onUpdateEntityPosition,
  onUpdateEntityDimensions,
  onRotateEntity,
  onDuplicateEntity,
  onDeleteEntity,
  zoom,
  onZoomChange,
  orthoMode,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [pan, setPan] = useState({ x: 80, y: 60 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState<{ x: number; y: number; startX: number; startY: number }>({
    x: 0,
    y: 0,
    startX: 0,
    startY: 0,
  });

  // Crosshair coordinates
  const [cursorPos, setCursorPos] = useState({ screenX: 0, screenY: 0, cadX: 0, cadY: 0 });

  // Entity Dragging
  const [draggingEntityId, setDraggingEntityId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [dragStartPos, setDragStartPos] = useState({ x: 0, y: 0 });

  // Entity Resizing
  const [resizingEntityId, setResizingEntityId] = useState<string | null>(null);
  const [resizeHandle, setResizeHandle] = useState<string | null>(null);
  const [resizeStart, setResizeStart] = useState<{
    w: number;
    h: number;
    x: number;
    y: number;
    startX: number;
    startY: number;
  }>({ w: 0, h: 0, x: 0, y: 0, startX: 0, startY: 0 });

  // Convert screen coordinates to CAD millimeter coordinates (1px = 10mm)
  const screenToCad = useCallback(
    (screenX: number, screenY: number) => {
      const x = Math.round((screenX - pan.x) / zoom) * 10;
      const y = Math.round((screenY - pan.y) / zoom) * 10;
      return { x, y };
    },
    [pan, zoom]
  );

  // Track cursor position for crosshairs and HUD
  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;
    const cadCoord = screenToCad(screenX, screenY);

    setCursorPos({
      screenX,
      screenY,
      cadX: cadCoord.x,
      cadY: cadCoord.y,
    });

    // Handle Viewport Pan
    if (isPanning) {
      setPan({
        x: panStart.x + (e.clientX - panStart.startX),
        y: panStart.y + (e.clientY - panStart.startY),
      });
      return;
    }

    // Handle Entity Drag
    if (draggingEntityId) {
      let rawX = (screenX - dragOffset.x) / zoom;
      let rawY = (screenY - dragOffset.y) / zoom;

      // Snap to 10px grid
      let nextX = Math.round(rawX / 10) * 10;
      let nextY = Math.round(rawY / 10) * 10;

      // Ortho mode constraint: lock to dominant axis
      if (orthoMode) {
        const dx = Math.abs(nextX - dragStartPos.x);
        const dy = Math.abs(nextY - dragStartPos.y);
        if (dx > dy) {
          nextY = dragStartPos.y;
        } else {
          nextX = dragStartPos.x;
        }
      }

      onUpdateEntityPosition(draggingEntityId, nextX, nextY);
      return;
    }

    // Handle Entity Resize
    if (resizingEntityId && resizeHandle) {
      const deltaX = (e.clientX - resizeStart.startX) / zoom;
      const deltaY = (e.clientY - resizeStart.startY) / zoom;

      let newW = resizeStart.w;
      let newH = resizeStart.h;

      if (resizeHandle.includes('e')) newW = Math.max(20, Math.round((resizeStart.w + deltaX) / 10) * 10);
      if (resizeHandle.includes('s')) newH = Math.max(14, Math.round((resizeStart.h + deltaY) / 10) * 10);

      onUpdateEntityDimensions(resizingEntityId, newW, newH);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    // Middle click or canvas click pans canvas
    if (e.button === 1 || (e.button === 0 && e.target === containerRef.current)) {
      setIsPanning(true);
      setPanStart({ x: pan.x, y: pan.y, startX: e.clientX, startY: e.clientY });
      onSelectEntity(null);
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
    setDraggingEntityId(null);
    setResizingEntityId(null);
    setResizeHandle(null);
  };

  // Zoom on wheel
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
    const nextZoom = Math.min(3.0, Math.max(0.2, zoom * zoomFactor));
    onZoomChange(nextZoom);
  };

  // Filter entities by visible layer
  const visibleLayersMap = new Map(drawing.layers.map((l) => [l.id, l.visible]));
  const visibleEntities = drawing.entities.filter((e) => visibleLayersMap.get(e.layerId) !== false);

  const selectedEntity = drawing.entities.find((e) => e.id === selectedEntityId) || null;

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onWheel={handleWheel}
      className="flex-1 h-full relative overflow-hidden bg-[#0B1E36] select-none cursor-crosshair"
      style={{ touchAction: 'none' }}
    >
      {/* 1. BACKGROUND SVG GRID PATTERN */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none">
        <defs>
          {/* Minor 100mm grid */}
          <pattern id="omegaCadMinor" width={10 * zoom} height={10 * zoom} patternUnits="userSpaceOnUse" x={pan.x} y={pan.y}>
            <path d={`M ${10 * zoom} 0 L 0 0 0 ${10 * zoom}`} fill="none" stroke="#1E3A8A" strokeWidth="0.5" opacity="0.3" />
          </pattern>
          {/* Major 500mm grid */}
          <pattern id="omegaCadMajor" width={50 * zoom} height={50 * zoom} patternUnits="userSpaceOnUse" x={pan.x} y={pan.y}>
            <rect width={50 * zoom} height={50 * zoom} fill="url(#omegaCadMinor)" />
            <path d={`M ${50 * zoom} 0 L 0 0 0 ${50 * zoom}`} fill="none" stroke="#0284C7" strokeWidth="0.8" opacity="0.5" />
          </pattern>
          {/* Hatch pattern for walls */}
          <pattern id="concreteHatch" width="8" height="8" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
            <line x1="0" y1="0" x2="0" y2="8" stroke="#38BDF8" strokeWidth="1" opacity="0.3" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#omegaCadMajor)" />
      </svg>

      {/* 2. INFINITE CAD CROSSHAIRS & HUD BADGE */}
      <div className="absolute inset-0 pointer-events-none z-10">
        {/* Horizontal crosshair */}
        <div
          className="absolute left-0 right-0 h-px bg-cyan-400/40 pointer-events-none"
          style={{ top: `${cursorPos.screenY}px` }}
        />
        {/* Vertical crosshair */}
        <div
          className="absolute top-0 bottom-0 w-px bg-cyan-400/40 pointer-events-none"
          style={{ left: `${cursorPos.screenX}px` }}
        />

        {/* Floating Digital Coordinate HUD */}
        <div
          className="absolute pointer-events-none px-2 py-0.5 rounded bg-slate-950/85 border border-cyan-500/40 text-[10px] font-mono text-cyan-300 shadow-lg whitespace-nowrap flex items-center gap-2"
          style={{
            left: `${Math.min(window.innerWidth - 320, cursorPos.screenX + 16)}px`,
            top: `${Math.min(window.innerHeight - 80, cursorPos.screenY + 16)}px`,
          }}
        >
          <span>X: {cursorPos.cadX.toLocaleString()} mm</span>
          <span className="text-slate-600">|</span>
          <span>Y: {cursorPos.cadY.toLocaleString()} mm</span>
          <span className="text-[9px] text-cyan-500 font-bold">WCS</span>
        </div>
      </div>

      {/* 3. CAD WORLD VIEWPORT CANVAS */}
      <div
        className="absolute origin-top-left"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          width: '5000px',
          height: '4000px',
        }}
      >
        {/* Origin (0,0) WCS Marker */}
        <div className="absolute left-0 top-0 pointer-events-none">
          <div className="w-12 h-0.5 bg-red-500" />
          <div className="h-12 w-0.5 bg-green-500" />
          <span className="absolute left-2 top-2 text-[10px] font-mono font-bold text-red-400">X</span>
          <span className="absolute left-0 top-12 text-[10px] font-mono font-bold text-green-400">Y</span>
        </div>

        {/* ENTITIES RENDERER */}
        {visibleEntities.map((entity) => {
          const isSelected = entity.id === selectedEntityId;
          const rotation = entity.rotation || 0;

          return (
            <div
              key={entity.id}
              onClick={(e) => {
                e.stopPropagation();
                onSelectEntity(entity.id);
              }}
              onMouseDown={(e) => {
                if (e.button !== 0) return;
                e.stopPropagation();
                onSelectEntity(entity.id);
                setDraggingEntityId(entity.id);
                setDragStartPos({ x: entity.x, y: entity.y });
                const rect = containerRef.current?.getBoundingClientRect();
                if (rect) {
                  setDragOffset({
                    x: e.clientX - rect.left - entity.x * zoom,
                    y: e.clientY - rect.top - entity.y * zoom,
                  });
                }
              }}
              style={{
                position: 'absolute',
                left: `${entity.x}px`,
                top: `${entity.y}px`,
                width: `${entity.width}px`,
                height: `${entity.height}px`,
                transform: `rotate(${rotation}deg)`,
                transformOrigin: 'center center',
              }}
              className={`transition-shadow group ${
                isSelected
                  ? 'ring-2 ring-cyan-400 ring-offset-2 ring-offset-slate-950 z-20 cursor-move'
                  : 'hover:ring-1 hover:ring-cyan-400/60 cursor-pointer z-10'
              }`}
            >
              {/* === ENTITY TYPE 1: ARCH WALL === */}
              {entity.type === 'arch_wall' && (
                <div className="w-full h-full relative border-2 border-cyan-400 bg-slate-900 overflow-hidden shadow-sm">
                  <svg className="absolute inset-0 w-full h-full">
                    <rect width="100%" height="100%" fill="url(#concreteHatch)" />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <span className="text-[10px] font-mono font-bold text-cyan-200 bg-slate-950/80 px-1.5 py-0.2 rounded border border-cyan-500/30 truncate max-w-[90%]">
                      {entity.label}
                    </span>
                  </div>
                </div>
              )}

              {/* === ENTITY TYPE 2: ARCH SWING DOOR === */}
              {entity.type === 'arch_door' && (
                <div className="w-full h-full relative">
                  <svg className="w-full h-full overflow-visible">
                    {/* 90 degree door swing arc */}
                    <path
                      d={`M 0 0 A ${entity.width} ${entity.width} 0 0 1 ${entity.width} ${entity.width}`}
                      fill="none"
                      stroke="#F59E0B"
                      strokeWidth="2"
                      strokeDasharray="4 3"
                    />
                    {/* Door frame jamb & open panel line */}
                    <line x1="0" y1="0" x2="0" y2={entity.width} stroke="#F59E0B" strokeWidth="4" />
                    {/* Hinge point */}
                    <circle cx="0" cy="0" r="3" fill="#F59E0B" />
                  </svg>
                  <span className="absolute left-2 top-2 text-[10px] font-mono font-bold text-amber-400 bg-slate-950/80 px-1 rounded">
                    {entity.label || 'D1'}
                  </span>
                </div>
              )}

              {/* === ENTITY TYPE 3: ARCH WINDOW === */}
              {entity.type === 'arch_window' && (
                <div className="w-full h-full relative bg-cyan-950/40 border-2 border-cyan-400 flex items-center justify-center">
                  {/* Center glazing mullion */}
                  <div className="w-full h-0.5 bg-white shadow-xs" />
                  <span className="absolute -top-3 text-[9px] font-mono font-bold text-cyan-300 bg-slate-950/90 px-1 rounded border border-cyan-500/40">
                    {entity.label || 'W1'}
                  </span>
                </div>
              )}

              {/* === ENTITY TYPE 4: STRUCTURAL COLUMN === */}
              {entity.type === 'arch_column' && (
                <div className="w-full h-full bg-slate-950 border-2 border-rose-500 flex items-center justify-center shadow-md">
                  <div className="w-2 h-2 bg-rose-500 rounded-full" />
                  <span className="absolute -bottom-3 text-[9px] font-mono font-bold text-rose-300 bg-slate-950 px-1 rounded border border-rose-500/40">
                    {entity.label || 'C1'}
                  </span>
                </div>
              )}

              {/* === ENTITY TYPE 5: ROOM ENCLOSURE === */}
              {entity.type === 'arch_room' && (
                <div className="w-full h-full relative border-2 border-dashed border-cyan-400/80 bg-cyan-950/20 flex flex-col items-center justify-center p-2 text-center">
                  <span className="text-xs font-mono font-bold text-white drop-shadow-sm truncate max-w-[95%]">
                    {entity.label}
                  </span>
                  {entity.roomArea && (
                    <span className="text-[10px] font-mono font-bold text-cyan-300 bg-slate-950/80 px-1.5 py-0.5 rounded border border-cyan-500/30 mt-1">
                      {entity.roomArea}
                    </span>
                  )}
                  {entity.sublabel && (
                    <span className="text-[9px] text-slate-400 font-mono mt-0.5 truncate max-w-[95%]">
                      {entity.sublabel}
                    </span>
                  )}
                </div>
              )}

              {/* === ENTITY TYPE 6: DIMENSION CALLOUT === */}
              {entity.type === 'arch_dimension' && (
                <div className="w-full h-full relative flex items-center justify-center">
                  <svg className="w-full h-full overflow-visible">
                    {/* Dimension line */}
                    <line x1="0" y1={entity.height / 2} x2={entity.width} y2={entity.height / 2} stroke="#60A5FA" strokeWidth="1.5" />
                    {/* Left 45 degree architectural tick */}
                    <line x1="-5" y1={entity.height / 2 - 8} x2="5" y2={entity.height / 2 + 8} stroke="#60A5FA" strokeWidth="2.5" />
                    {/* Right 45 degree architectural tick */}
                    <line x1={entity.width - 5} y1={entity.height / 2 - 8} x2={entity.width + 5} y2={entity.height / 2 + 8} stroke="#60A5FA" strokeWidth="2.5" />
                  </svg>
                  <span className="absolute -top-3 text-[10px] font-mono font-bold text-blue-200 bg-slate-950 px-2 py-0.2 rounded border border-blue-500/40">
                    {entity.dimensionText || entity.label}
                  </span>
                </div>
              )}

              {/* === ENTITY TYPE 7: FURNITURE BLOCK === */}
              {entity.type === 'arch_furniture' && (
                <div className="w-full h-full border border-slate-500/80 bg-slate-900/60 rounded flex flex-col items-center justify-center p-1 text-center">
                  <div className="w-8 h-4 border border-slate-400 rounded-sm mb-1 bg-slate-800" />
                  <span className="text-[10px] font-mono text-slate-300 truncate max-w-[95%]">
                    {entity.label}
                  </span>
                </div>
              )}

              {/* === ENTITY TYPE 8: TITLE BLOCK === */}
              {entity.type === 'arch_titleblock' && (
                <div className="w-full h-full border-2 border-white bg-slate-950 p-2 flex flex-col justify-between font-mono text-left">
                  <div className="flex justify-between items-start border-b border-slate-700 pb-1">
                    <div>
                      <div className="text-xs font-bold text-white uppercase">{entity.label}</div>
                      <div className="text-[9px] text-cyan-400 font-bold">{entity.sublabel || 'SHEET A-101 • SCALE 1:50'}</div>
                    </div>
                    <span className="text-[10px] font-bold text-cyan-300">NORTH ↑</span>
                  </div>
                  <div className="text-[8px] text-slate-500 flex justify-between">
                    <span>OMEGACAD PLUS 15.0</span>
                    <span>APPROVED FOR CONSTRUCTION</span>
                  </div>
                </div>
              )}

              {/* RESIZE HANDLE AT BOTTOM RIGHT (when selected) */}
              {isSelected && (
                <div
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    setResizingEntityId(entity.id);
                    setResizeHandle('se');
                    setResizeStart({
                      w: entity.width,
                      h: entity.height,
                      x: entity.x,
                      y: entity.y,
                      startX: e.clientX,
                      startY: e.clientY,
                    } as any);
                  }}
                  className="absolute -right-1.5 -bottom-1.5 w-3 h-3 bg-cyan-400 border border-slate-950 cursor-se-resize z-30"
                />
              )}
            </div>
          );
        })}
      </div>

      {/* 4. FLOATING QUICK-ACTION TOOLBAR FOR SELECTED ENTITY */}
      {selectedEntity && (
        <div
          className="absolute top-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1.5 bg-slate-950/95 border border-cyan-500/40 px-3 py-1.5 rounded-full shadow-2xl backdrop-blur-md text-xs font-mono select-none"
        >
          <span className="text-cyan-300 font-bold px-1 truncate max-w-[140px]">
            {selectedEntity.label}
          </span>
          <div className="w-px h-3.5 bg-slate-800" />
          <button
            onClick={() => onRotateEntity(selectedEntity.id)}
            className="flex items-center gap-1 px-2 py-1 rounded-md hover:bg-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer"
            title="Rotate 90 degrees"
          >
            <RotateCw size={13} className="text-cyan-400" />
            <span>Rotate 90°</span>
          </button>
          <button
            onClick={() => onDuplicateEntity(selectedEntity.id)}
            className="flex items-center gap-1 px-2 py-1 rounded-md hover:bg-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer"
            title="Duplicate"
          >
            <Copy size={13} />
            <span>Duplicate</span>
          </button>
          <button
            onClick={() => onDeleteEntity(selectedEntity.id)}
            className="flex items-center gap-1 px-2 py-1 rounded-md hover:bg-rose-950 text-rose-400 hover:text-rose-300 transition-colors cursor-pointer"
            title="Delete Entity"
          >
            <Trash2 size={13} />
            <span>Delete</span>
          </button>
        </div>
      )}
    </div>
  );
};
