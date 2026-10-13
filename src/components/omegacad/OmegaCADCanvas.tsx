import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  CadDrawing,
  CadEntity,
} from '../../types/omegacad';
import {
  RotateCw,
  Copy,
  Trash2,
  Maximize2,
  ZoomIn,
  ZoomOut,
  Compass,
  Ruler,
  Sliders,
  Move,
  FlipHorizontal,
  FlipVertical,
  Grid,
} from 'lucide-react';
import { OmegaCADMicroTools } from './OmegaCADMicroTools';

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
  canvasTheme?: 'light' | 'blueprint';
  onZoomFit?: () => void;
  // Micro-tools callbacks
  onOffsetEntity?: (distanceMm: number) => void;
  onMirrorEntity?: (axis: 'horizontal' | 'vertical') => void;
  onArrayEntity?: (count: number, spacingMm: number) => void;
  onAutoDimension?: () => void;
  onIsolateLayer?: (layerId: string) => void;
  onRestoreAllLayers?: () => void;
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
  canvasTheme = 'light',
  onZoomFit,
  onOffsetEntity,
  onMirrorEntity,
  onArrayEntity,
  onAutoDimension,
  onIsolateLayer,
  onRestoreAllLayers,
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

  // Interactive Measurement Tape Mode
  const [measureMode, setMeasureMode] = useState(false);
  const [measureStart, setMeasureStart] = useState<{ x: number; y: number } | null>(null);

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

  // Track cursor position for crosshairs, HUD, and tape measure
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

      // Snap to 10px grid (100mm)
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
    // Measure tape click handler
    if (measureMode) {
      if (!measureStart) {
        setMeasureStart({ x: cursorPos.screenX, y: cursorPos.screenY });
      } else {
        // Measure finished
        setMeasureStart(null);
      }
      return;
    }

    // Middle click or canvas click pans canvas
    if (e.button === 1 || e.target === containerRef.current || (e.target as HTMLElement).id === 'cad-canvas-bg') {
      setIsPanning(true);
      setPanStart({
        x: pan.x,
        y: pan.y,
        startX: e.clientX,
        startY: e.clientY,
      });
      onSelectEntity(null);
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
    setDraggingEntityId(null);
    setResizingEntityId(null);
    setResizeHandle(null);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.08 : 0.92;
    const newZoom = Math.min(3.0, Math.max(0.25, zoom * zoomFactor));

    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    setPan((prev) => ({
      x: mouseX - (mouseX - prev.x) * (newZoom / zoom),
      y: mouseY - (mouseY - prev.y) * (newZoom / zoom),
    }));

    onZoomChange(newZoom);
  };

  // Keyboard Shortcuts (Delete, Esc)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedEntityId) {
        const active = document.activeElement;
        if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA')) return;
        onDeleteEntity(selectedEntityId);
      } else if (e.key === 'Escape') {
        if (measureMode) {
          setMeasureMode(false);
          setMeasureStart(null);
        } else {
          onSelectEntity(null);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedEntityId, onDeleteEntity, onSelectEntity, measureMode]);

  // Filter visible entities by layer visibility
  const visibleEntities = drawing.entities.filter((entity) => {
    const layer = drawing.layers.find((l) => l.id === entity.layerId);
    return layer ? layer.visible : true;
  });

  const isDark = canvasTheme === 'blueprint';
  const selectedEntity = drawing.entities.find((e) => e.id === selectedEntityId) || null;

  return (
    <div
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onWheel={handleWheel}
      className={`relative flex-1 h-full overflow-hidden select-none cursor-crosshair ${
        isDark ? 'bg-[#0B1E36]' : 'bg-[#F8FAFC]'
      }`}
      style={{
        backgroundImage: isDark
          ? `radial-gradient(circle, #1E3A5F 1px, transparent 1px)`
          : `radial-gradient(circle, #CBD5E1 1px, transparent 1px)`,
        backgroundSize: `${20 * zoom}px ${20 * zoom}px`,
        backgroundPosition: `${pan.x}px ${pan.y}px`,
      }}
    >
      {/* 1. SVG PATTERN DEFINITIONS */}
      <svg className="absolute w-0 h-0 pointer-events-none" aria-hidden="true">
        <defs>
          <pattern id="concreteHatchLight" width="16" height="16" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="16" stroke="#475569" strokeWidth="1.2" strokeOpacity="0.4" />
            <line x1="8" y1="0" x2="8" y2="16" stroke="#475569" strokeWidth="0.8" strokeOpacity="0.3" strokeDasharray="3,3" />
          </pattern>
          <pattern id="concreteHatchBlueprint" width="16" height="16" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="16" stroke="#38BDF8" strokeWidth="1.2" strokeOpacity="0.5" />
            <line x1="8" y1="0" x2="8" y2="16" stroke="#38BDF8" strokeWidth="0.8" strokeOpacity="0.3" strokeDasharray="3,3" />
          </pattern>
          <pattern id="brickHatchLight" width="20" height="10" patternUnits="userSpaceOnUse">
            <line x1="0" y1="0" x2="20" y2="0" stroke="#64748B" strokeWidth="1" strokeOpacity="0.4" />
            <line x1="0" y1="5" x2="20" y2="5" stroke="#64748B" strokeWidth="1" strokeOpacity="0.4" />
            <line x1="10" y1="5" x2="10" y2="10" stroke="#64748B" strokeWidth="1" strokeOpacity="0.4" />
          </pattern>
          <pattern id="poolWaveHatch" width="24" height="12" patternUnits="userSpaceOnUse">
            <path d="M 0 6 Q 6 0 12 6 T 24 6" fill="none" stroke="#0284C7" strokeWidth="1.2" strokeOpacity="0.5" />
          </pattern>
        </defs>
      </svg>

      {/* 2. PRECISION CAD CROSSHAIRS */}
      <div className="absolute inset-0 pointer-events-none z-10">
        <div
          className={`absolute left-0 right-0 h-px pointer-events-none ${
            isDark ? 'bg-cyan-400/25' : 'bg-blue-600/20'
          }`}
          style={{ top: `${cursorPos.screenY}px` }}
        />
        <div
          className={`absolute top-0 bottom-0 w-px pointer-events-none ${
            isDark ? 'bg-cyan-400/25' : 'bg-blue-600/20'
          }`}
          style={{ left: `${cursorPos.screenX}px` }}
        />
      </div>

      {/* 3. FLOATING MICRO-TOOLS PALETTE (Top Center) */}
      <OmegaCADMicroTools
        drawing={drawing}
        selectedEntity={selectedEntity}
        onOffsetEntity={onOffsetEntity}
        onMirrorEntity={onMirrorEntity}
        onArrayEntity={onArrayEntity}
        onAutoDimension={onAutoDimension}
        onRotateEntity={(deg) => selectedEntity && onRotateEntity(selectedEntity.id)}
        onIsolateLayer={onIsolateLayer}
        onRestoreAllLayers={onRestoreAllLayers}
        activeMeasureMode={measureMode}
        onToggleMeasureMode={() => {
          setMeasureMode(!measureMode);
          setMeasureStart(null);
        }}
      />

      {/* 4. INTERACTIVE TAPE MEASURE LIVE RULER */}
      {measureMode && measureStart && (
        <div className="absolute inset-0 pointer-events-none z-30">
          <svg className="w-full h-full">
            <line
              x1={measureStart.x}
              y1={measureStart.y}
              x2={cursorPos.screenX}
              y2={cursorPos.screenY}
              stroke="#2563EB"
              strokeWidth="2"
              strokeDasharray="5,4"
            />
            <circle cx={measureStart.x} cy={measureStart.y} r="4" fill="#2563EB" />
            <circle cx={cursorPos.screenX} cy={cursorPos.screenY} r="4" fill="#2563EB" />
          </svg>
          {(() => {
            const dx = (cursorPos.screenX - measureStart.x) / zoom * 10;
            const dy = (cursorPos.screenY - measureStart.y) / zoom * 10;
            const distMm = Math.round(Math.sqrt(dx * dx + dy * dy));
            const distM = (distMm / 1000).toFixed(2);
            const distFt = (distMm / 304.8).toFixed(1);
            const midX = (measureStart.x + cursorPos.screenX) / 2;
            const midY = (measureStart.y + cursorPos.screenY) / 2;

            return (
              <div
                className="absolute bg-blue-600 text-white font-mono text-xs font-bold px-2 py-1 rounded-md shadow-lg -translate-x-1/2 -translate-y-1/2 flex items-center gap-1.5"
                style={{ left: `${midX}px`, top: `${midY - 14}px` }}
              >
                <Ruler size={12} />
                <span>{distM} m ({distFt} ft)</span>
              </div>
            );
          })()}
        </div>
      )}

      {/* 5. CAD WORLD VIEWPORT CANVAS */}
      <div
        id="cad-canvas-bg"
        className="absolute origin-top-left"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          width: '5000px',
          height: '4000px',
        }}
      >
        {/* Origin (0,0) WCS Axis Marker */}
        <div className="absolute left-0 top-0 pointer-events-none">
          <div className="w-12 h-0.5 bg-red-500 shadow-xs" />
          <div className="h-12 w-0.5 bg-green-500 shadow-xs" />
          <span className="absolute left-2 top-2 text-[10px] font-mono font-bold text-red-500">X</span>
          <span className="absolute left-0 top-12 text-[10px] font-mono font-bold text-green-500">Y</span>
        </div>

        {/* ENTITIES RENDERER (100+ Professional CAD Elements) */}
        {visibleEntities.map((entity) => {
          const isSelected = entity.id === selectedEntityId;
          const rotation = entity.rotation || 0;

          return (
            <div
              key={entity.id}
              onClick={(e) => {
                e.stopPropagation();
                if (!measureMode) onSelectEntity(entity.id);
              }}
              onMouseDown={(e) => {
                if (measureMode || e.button !== 0) return;
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
                  ? 'ring-2 ring-blue-500 ring-offset-2 ring-offset-transparent z-20 cursor-move shadow-md'
                  : 'hover:ring-1 hover:ring-blue-400 cursor-pointer z-10'
              }`}
            >
              {/* === 1. ARCH WALL === */}
              {entity.type === 'arch_wall' && (
                <div
                  className={`w-full h-full relative overflow-hidden shadow-xs border ${
                    entity.wallHatch === 'glass'
                      ? 'border-sky-400 bg-sky-100/50'
                      : isDark
                      ? 'border-cyan-400 bg-slate-900'
                      : 'border-slate-800 bg-slate-700'
                  }`}
                >
                  <svg className="absolute inset-0 w-full h-full">
                    <rect
                      width="100%"
                      height="100%"
                      fill={
                        entity.wallHatch === 'brick'
                          ? 'url(#brickHatchLight)'
                          : isDark
                          ? 'url(#concreteHatchBlueprint)'
                          : 'url(#concreteHatchLight)'
                      }
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none px-1">
                    <span
                      className={`text-[9.5px] font-mono font-bold truncate max-w-[90%] px-1.5 py-0.2 rounded shadow-xs ${
                        isDark
                          ? 'bg-slate-950/90 text-cyan-200 border border-cyan-500/30'
                          : 'bg-white/95 text-slate-800 border border-slate-300'
                      }`}
                    >
                      {entity.label}
                    </span>
                  </div>
                </div>
              )}

              {/* === 2. ARCH DOOR === */}
              {entity.type === 'arch_door' && (
                <div className="w-full h-full relative">
                  <svg className="w-full h-full overflow-visible">
                    <rect x="0" y={entity.height - 8} width="6" height="8" fill={isDark ? '#F59E0B' : '#1E293B'} />
                    <rect x={entity.width - 6} y={entity.height - 8} width="6" height="8" fill={isDark ? '#F59E0B' : '#1E293B'} />
                    <line x1="0" y1={entity.height - 4} x2={entity.width} y2={entity.height - 4} stroke="#94A3B8" strokeWidth="1" strokeDasharray="3,3" />
                    <path
                      d={`M ${entity.width - 6} ${entity.height - 6} A ${entity.width - 12} ${entity.height - 12} 0 0 0 6 6`}
                      fill="none"
                      stroke={isDark ? '#F59E0B' : '#2563EB'}
                      strokeWidth="1.5"
                      strokeDasharray="4,3"
                    />
                    <line
                      x1="6"
                      y1={entity.height - 6}
                      x2="6"
                      y2="6"
                      stroke={isDark ? '#F59E0B' : '#2563EB'}
                      strokeWidth="3.5"
                      strokeLinecap="round"
                    />
                    <circle cx="6" cy={entity.height - 6} r="2.5" fill={isDark ? '#F59E0B' : '#1E293B'} />
                  </svg>
                  <span
                    className={`absolute left-2 top-2 text-[9.5px] font-mono font-bold px-1 rounded shadow-xs ${
                      isDark
                        ? 'bg-slate-950/80 text-amber-400'
                        : 'bg-white/90 text-blue-700 border border-blue-200'
                    }`}
                  >
                    {entity.label || 'D1'}
                  </span>
                </div>
              )}

              {/* === 3. ARCH WINDOW === */}
              {entity.type === 'arch_window' && (
                <div
                  className={`w-full h-full relative flex items-center justify-center border shadow-xs ${
                    isDark
                      ? 'bg-cyan-950/30 border-cyan-400'
                      : 'bg-sky-50 border-sky-500'
                  }`}
                >
                  <div className="w-full flex flex-col items-center justify-center gap-1">
                    <div className="w-full h-0.5 bg-sky-500 shadow-xs" />
                    <div className="w-full h-0.5 bg-sky-400 shadow-xs" />
                  </div>
                  <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-slate-800" />
                  <div className="absolute right-0 top-0 bottom-0 w-1.5 bg-slate-800" />
                  <span
                    className={`absolute -top-3 text-[9px] font-mono font-bold px-1 rounded shadow-xs ${
                      isDark
                        ? 'bg-slate-950 text-cyan-300 border border-cyan-500/40'
                        : 'bg-white text-sky-800 border border-sky-300'
                    }`}
                  >
                    {entity.label || 'W1'}
                  </span>
                </div>
              )}

              {/* === 4. ARCH COLUMN === */}
              {entity.type === 'arch_column' && (
                <div
                  className={`w-full h-full relative flex items-center justify-center shadow-md border ${
                    entity.columnShape === 'circle' ? 'rounded-full' : ''
                  } ${
                    isDark
                      ? 'bg-slate-950 border-rose-500'
                      : 'bg-slate-900 border-slate-950'
                  }`}
                >
                  {entity.columnShape !== 'circle' && (
                    <svg className="w-full h-full absolute inset-0">
                      <line x1="2" y1="2" x2={entity.width - 2} y2={entity.height - 2} stroke="#EF4444" strokeWidth="1.5" />
                      <line x1={entity.width - 2} y1="2" x2="2" y2={entity.height - 2} stroke="#EF4444" strokeWidth="1.5" />
                    </svg>
                  )}
                  <span
                    className={`absolute -bottom-3 text-[9px] font-mono font-bold px-1 rounded shadow-xs ${
                      isDark
                        ? 'bg-slate-950 text-rose-300 border border-rose-500/40'
                        : 'bg-white text-slate-800 border border-slate-300'
                    }`}
                  >
                    {entity.label || 'C1'}
                  </span>
                </div>
              )}

              {/* === 5. ARCH BEAM === */}
              {entity.type === 'arch_beam' && (
                <div className="w-full h-full border-2 border-dashed border-slate-500 bg-slate-400/10 flex items-center justify-center">
                  <span className="text-[9px] font-mono font-bold text-slate-600 bg-white/90 px-1 rounded">
                    {entity.label}
                  </span>
                </div>
              )}

              {/* === 6. ARCH STAIRCASE === */}
              {entity.type === 'arch_stair' && (
                <div className="w-full h-full relative border-2 border-amber-600 bg-amber-50/20 overflow-hidden flex flex-col justify-between p-1">
                  {/* Treads */}
                  <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-60">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
                      <div key={i} className="w-full h-px bg-amber-600" />
                    ))}
                  </div>
                  <div className="z-10 flex items-center justify-between">
                    <span className="text-[9px] font-bold text-amber-800 bg-white/90 px-1 rounded">
                      {entity.label}
                    </span>
                    <span className="text-[9px] font-bold text-amber-600">UP ↑</span>
                  </div>
                </div>
              )}

              {/* === 7. ARCH ROOM ZONE === */}
              {entity.type === 'arch_room' && (
                <div
                  className={`w-full h-full relative flex flex-col items-center justify-center p-3 text-center border-2 border-dashed transition-all ${
                    isDark
                      ? 'border-cyan-400/70 bg-cyan-950/15'
                      : 'border-blue-400/80 bg-blue-50/25 hover:bg-blue-50/40'
                  }`}
                >
                  <span
                    className={`text-xs font-bold truncate max-w-[95%] ${
                      isDark ? 'text-white drop-shadow-sm' : 'text-slate-900'
                    }`}
                  >
                    {entity.label}
                  </span>
                  {entity.roomArea && (
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded mt-1 shadow-xs ${
                        isDark
                          ? 'bg-slate-950/90 text-cyan-300 border border-cyan-500/30'
                          : 'bg-blue-50 text-blue-700 border border-blue-200'
                      }`}
                    >
                      {entity.roomArea}
                    </span>
                  )}
                  {entity.sublabel && (
                    <span
                      className={`text-[9.5px] mt-0.5 truncate max-w-[95%] ${
                        isDark ? 'text-slate-400' : 'text-slate-500'
                      }`}
                    >
                      {entity.sublabel}
                    </span>
                  )}
                </div>
              )}

              {/* === 8. ARCH SANITARY / PLUMBING === */}
              {entity.type === 'arch_sanitary' && (
                <div className="w-full h-full relative border-2 border-cyan-600 rounded bg-cyan-50/60 p-1 flex flex-col items-center justify-between shadow-xs">
                  {entity.sanitaryType === 'toilet' ? (
                    <>
                      <div className="w-3/4 h-3 bg-cyan-200 border border-cyan-600 rounded-sm" />
                      <div className="w-4/5 h-3/5 border-2 border-cyan-600 rounded-full bg-white flex items-center justify-center">
                        <div className="w-1.5 h-1.5 bg-cyan-600 rounded-full" />
                      </div>
                    </>
                  ) : entity.sanitaryType === 'bathtub' ? (
                    <div className="w-full h-full border-2 border-cyan-600 rounded-xl bg-white flex items-center justify-end pr-2">
                      <div className="w-2.5 h-2.5 rounded-full border border-cyan-600 bg-cyan-100" />
                    </div>
                  ) : (
                    <div className="w-full h-full border border-cyan-600 rounded bg-white flex flex-col items-center justify-center">
                      <div className="w-3/4 h-3/4 border border-cyan-500 rounded-full bg-cyan-50" />
                    </div>
                  )}
                  <span className="text-[8.5px] font-bold text-cyan-900 truncate max-w-[95%]">
                    {entity.label}
                  </span>
                </div>
              )}

              {/* === 9. ARCH ELECTRICAL / MEP === */}
              {entity.type === 'arch_electrical' && (
                <div className="w-full h-full relative border border-amber-500 rounded bg-amber-50/80 p-1 flex flex-col items-center justify-center shadow-xs">
                  <div className="w-3 h-3 rounded-full border-2 border-amber-600 bg-amber-300 flex items-center justify-center text-[8px] font-bold text-amber-900">
                    ⚡
                  </div>
                  <span className="text-[8px] font-bold text-amber-900 truncate max-w-[95%] mt-0.5">
                    {entity.label}
                  </span>
                </div>
              )}

              {/* === 10. ARCH SITE & LANDSCAPE === */}
              {entity.type === 'arch_site' && (
                <div
                  className={`w-full h-full relative border-2 border-emerald-600 ${
                    entity.siteType === 'tree' || entity.siteType === 'palm' ? 'rounded-full bg-emerald-50/50' : 'rounded bg-emerald-50/20'
                  } p-1 flex flex-col items-center justify-center shadow-xs overflow-hidden`}
                >
                  {entity.siteType === 'pool' ? (
                    <svg className="absolute inset-0 w-full h-full">
                      <rect width="100%" height="100%" fill="url(#poolWaveHatch)" />
                    </svg>
                  ) : null}
                  <span className="text-[9px] font-bold text-emerald-800 bg-white/90 px-1 rounded z-10 truncate max-w-[95%]">
                    {entity.label}
                  </span>
                </div>
              )}

              {/* === 11. ARCH SCHEDULE & NOTES === */}
              {entity.type === 'arch_schedule' && (
                <div className="w-full h-full border-2 border-slate-700 bg-white p-2 flex flex-col justify-between shadow-md text-xs">
                  <div className="font-bold text-slate-900 border-b pb-1 text-[10.5px]">
                    {entity.label}
                  </div>
                  <div className="space-y-1 text-[9px] text-slate-500 font-mono py-1">
                    <div className="flex justify-between border-b pb-0.5">
                      <span>MARK</span>
                      <span>SIZE (mm)</span>
                      <span>QTY</span>
                    </div>
                    <div className="flex justify-between">
                      <span>D1</span>
                      <span>1000 × 2100</span>
                      <span>1</span>
                    </div>
                    <div className="flex justify-between">
                      <span>W1</span>
                      <span>1800 × 1200</span>
                      <span>2</span>
                    </div>
                  </div>
                </div>
              )}

              {/* === 12. ARCH DIMENSION SPAN === */}
              {entity.type === 'arch_dimension' && (
                <div className="w-full h-full relative flex items-center justify-center pointer-events-none">
                  <svg className="w-full h-full overflow-visible">
                    <line x1="0" y1="0" x2="0" y2={entity.height} stroke={isDark ? '#38BDF8' : '#2563EB'} strokeWidth="1.2" />
                    <line x1={entity.width} y1="0" x2={entity.width} y2={entity.height} stroke={isDark ? '#38BDF8' : '#2563EB'} strokeWidth="1.2" />
                    <line
                      x1="0"
                      y1={entity.height / 2}
                      x2={entity.width}
                      y2={entity.height / 2}
                      stroke={isDark ? '#38BDF8' : '#2563EB'}
                      strokeWidth="1.5"
                    />
                    <line x1="-4" y1={entity.height / 2 + 4} x2="4" y2={entity.height / 2 - 4} stroke={isDark ? '#38BDF8' : '#2563EB'} strokeWidth="2" />
                    <line x1={entity.width - 4} y1={entity.height / 2 + 4} x2={entity.width + 4} y2={entity.height / 2 - 4} stroke={isDark ? '#38BDF8' : '#2563EB'} strokeWidth="2" />
                  </svg>
                  <span
                    className={`absolute text-[9.5px] font-mono font-bold px-2 py-0.5 rounded shadow-xs ${
                      isDark
                        ? 'bg-slate-950 text-cyan-300 border border-cyan-500/40'
                        : 'bg-white text-blue-700 border border-blue-300'
                    }`}
                  >
                    {entity.dimensionText || entity.label}
                  </span>
                </div>
              )}

              {/* === 13. ARCH FURNITURE === */}
              {entity.type === 'arch_furniture' && (
                <div
                  className={`w-full h-full relative border-2 rounded p-1 flex flex-col items-center justify-between shadow-xs ${
                    isDark
                      ? 'border-slate-500 bg-slate-900/60 text-slate-300'
                      : 'border-slate-400 bg-white text-slate-700'
                  }`}
                >
                  <div className="w-full flex gap-1 justify-center pt-1">
                    <div className="w-2/5 h-4 border border-slate-400 rounded-sm bg-slate-100" />
                    <div className="w-2/5 h-4 border border-slate-400 rounded-sm bg-slate-100" />
                  </div>
                  <span className="text-[9px] font-semibold text-center font-mono truncate max-w-[95%]">
                    {entity.label}
                  </span>
                  <div className="w-full border-t border-slate-300 pb-1" />
                </div>
              )}

              {/* === 14. ARCH TITLE BLOCK === */}
              {entity.type === 'arch_titleblock' && (
                <div
                  className={`w-full h-full border-2 p-2 flex flex-col justify-between shadow-md ${
                    isDark
                      ? 'border-cyan-400 bg-slate-950 text-slate-200'
                      : 'border-slate-800 bg-white text-slate-900'
                  }`}
                >
                  <div className="flex items-center justify-between border-b pb-1 border-slate-300">
                    <span className="text-xs font-bold tracking-wider">{entity.label}</span>
                    <span className="text-[10px] font-mono font-semibold px-1 rounded bg-blue-50 text-blue-700">NORTH ↑</span>
                  </div>
                  <div className="flex items-center justify-between text-[9px] text-slate-500 font-mono">
                    <span>{entity.sublabel || 'SHEET A-101 • SCALE 1:50'}</span>
                    <span className="font-bold text-slate-700">APPROVED FOR CONSTRUCTION</span>
                  </div>
                </div>
              )}

              {/* Resize Handles (When entity is selected) */}
              {isSelected && (
                <>
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
                      });
                    }}
                    className="absolute -right-1.5 -bottom-1.5 w-3.5 h-3.5 bg-blue-600 border-2 border-white rounded-full cursor-se-resize shadow-md"
                    title="Drag to resize span"
                  />
                  <div
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      setResizingEntityId(entity.id);
                      setResizeHandle('e');
                      setResizeStart({
                        w: entity.width,
                        h: entity.height,
                        x: entity.x,
                        y: entity.y,
                        startX: e.clientX,
                        startY: e.clientY,
                      });
                    }}
                    className="absolute -right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 bg-blue-600 border border-white rounded-xs cursor-e-resize shadow-xs"
                    title="Drag width"
                  />
                  <div
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      setResizingEntityId(entity.id);
                      setResizeHandle('s');
                      setResizeStart({
                        w: entity.width,
                        h: entity.height,
                        x: entity.x,
                        y: entity.y,
                        startX: e.clientX,
                        startY: e.clientY,
                      });
                    }}
                    className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-blue-600 border border-white rounded-xs cursor-s-resize shadow-xs"
                    title="Drag height"
                  />
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* 6. SELECTED ENTITY FLOATING QUICK ACTION DOCK */}
      {selectedEntity && (
        <div
          className="absolute z-30 flex items-center gap-1 bg-white/95 backdrop-blur-md px-2 py-1 rounded-xl border border-slate-200/90 shadow-lg text-xs select-none"
          style={{
            left: `${Math.max(16, selectedEntity.x * zoom + pan.x)}px`,
            top: `${Math.max(16, selectedEntity.y * zoom + pan.y - 42)}px`,
          }}
        >
          <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded font-mono">
            {selectedEntity.type.replace('arch_', '').toUpperCase()}
          </span>
          <div className="h-3 w-px bg-slate-200 mx-0.5" />
          <button
            onClick={() => onRotateEntity(selectedEntity.id)}
            className="p-1 hover:bg-slate-100 rounded text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
            title="Rotate 90° (R)"
          >
            <RotateCw size={13} />
          </button>
          <button
            onClick={() => onDuplicateEntity(selectedEntity.id)}
            className="p-1 hover:bg-slate-100 rounded text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
            title="Duplicate (D)"
          >
            <Copy size={13} />
          </button>
          <button
            onClick={() => onDeleteEntity(selectedEntity.id)}
            className="p-1 hover:bg-rose-50 rounded text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
            title="Delete (Del)"
          >
            <Trash2 size={13} />
          </button>
        </div>
      )}

      {/* 7. FLOATING CANVAS NAVIGATION DOCK (Bottom-Left matching Flowlify Canvas) */}
      <div className="absolute bottom-3 left-3 z-30 flex items-center gap-1 bg-white/95 backdrop-blur-md px-2 py-1.5 rounded-xl border border-slate-200/90 shadow-md text-xs select-none">
        <button
          onClick={() => onZoomChange(Math.max(0.25, zoom - 0.15))}
          className="p-1.5 hover:bg-slate-100 rounded text-slate-600 active:bg-slate-200 transition-colors cursor-pointer"
          title="Zoom Out"
        >
          <ZoomOut size={14} />
        </button>
        <button
          onClick={() => {
            onZoomChange(1);
            setPan({ x: 80, y: 60 });
          }}
          className="px-2 py-1 font-bold text-[11px] text-slate-700 hover:bg-slate-100 rounded active:bg-slate-200 transition-colors cursor-pointer"
          title="Reset to 100%"
        >
          {Math.round(zoom * 100)}%
        </button>
        <button
          onClick={() => onZoomChange(Math.min(3.0, zoom + 0.15))}
          className="p-1.5 hover:bg-slate-100 rounded text-slate-600 active:bg-slate-200 transition-colors cursor-pointer"
          title="Zoom In"
        >
          <ZoomIn size={14} />
        </button>
        {onZoomFit && (
          <button
            onClick={onZoomFit}
            className="p-1.5 hover:bg-slate-100 rounded text-slate-600 active:bg-slate-200 transition-colors cursor-pointer ml-0.5 border-l border-slate-200/80"
            title="Fit to Screen"
          >
            <Maximize2 size={13} />
          </button>
        )}
      </div>

      {/* 8. FLOATING LIVE COORDINATES HUD (Bottom-Center Pill) */}
      <div className="absolute bottom-3 right-3 z-30 hidden sm:flex items-center gap-2 bg-white/95 backdrop-blur-md px-3 py-1 rounded-xl border border-slate-200/90 shadow-md text-xs font-mono text-slate-600 select-none">
        <Compass size={13} className="text-blue-600" />
        <span>X: {cursorPos.cadX.toLocaleString()} mm</span>
        <span className="text-slate-300">|</span>
        <span>Y: {cursorPos.cadY.toLocaleString()} mm</span>
        <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-1 rounded">WCS</span>
      </div>
    </div>
  );
};
