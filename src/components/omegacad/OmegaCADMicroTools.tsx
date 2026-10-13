import React, { useState } from 'react';
import {
  Ruler,
  Copy,
  FlipHorizontal,
  FlipVertical,
  Grid,
  Maximize2,
  Calculator,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  RotateCw,
  Eye,
  Layers,
  Sparkles,
  Check,
  ChevronDown,
  Compass,
  ArrowRight,
  Move,
  Sliders,
} from 'lucide-react';
import { CadEntity, CadDrawing } from '../../types/omegacad';

interface OmegaCADMicroToolsProps {
  drawing: CadDrawing;
  selectedEntity: CadEntity | null;
  onOffsetEntity?: (distanceMm: number) => void;
  onMirrorEntity?: (axis: 'horizontal' | 'vertical') => void;
  onArrayEntity?: (count: number, spacingMm: number) => void;
  onAutoDimension?: () => void;
  onRotateEntity?: (deg: number) => void;
  onIsolateLayer?: (layerId: string) => void;
  onRestoreAllLayers?: () => void;
  activeMeasureMode: boolean;
  onToggleMeasureMode: () => void;
}

export const OmegaCADMicroTools: React.FC<OmegaCADMicroToolsProps> = ({
  drawing,
  selectedEntity,
  onOffsetEntity,
  onMirrorEntity,
  onArrayEntity,
  onAutoDimension,
  onRotateEntity,
  onIsolateLayer,
  onRestoreAllLayers,
  activeMeasureMode,
  onToggleMeasureMode,
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showAreaCalc, setShowAreaCalc] = useState(false);
  const [showArrayModal, setShowArrayModal] = useState(false);
  const [arrayCount, setArrayCount] = useState(3);
  const [arraySpacing, setArraySpacing] = useState(1500);

  // Calculate live area stats for selected room or entire floor plan
  const areaStats = React.useMemo(() => {
    if (selectedEntity) {
      const wMeters = (selectedEntity.width * 10) / 1000;
      const hMeters = (selectedEntity.height * 10) / 1000;
      const sqMeters = wMeters * hMeters;
      const sqFeet = sqMeters * 10.7639;
      return {
        target: selectedEntity.label,
        sqMeters: sqMeters.toFixed(2),
        sqFeet: Math.round(sqFeet),
        spanM: wMeters.toFixed(2),
        depthM: hMeters.toFixed(2),
        perimeterM: ((wMeters + hMeters) * 2).toFixed(2),
      };
    }

    // Overall floor plan total rooms sum
    const rooms = drawing.entities.filter((e) => e.type === 'arch_room');
    let totalSqM = 0;
    rooms.forEach((r) => {
      totalSqM += ((r.width * 10) / 1000) * ((r.height * 10) / 1000);
    });
    return {
      target: 'Entire Floor Plan Built-up',
      sqMeters: totalSqM.toFixed(1),
      sqFeet: Math.round(totalSqM * 10.7639),
      roomsCount: rooms.length,
    };
  }, [selectedEntity, drawing.entities]);

  return (
    <div className="absolute top-3 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1 bg-white/95 backdrop-blur-md px-2 py-1 rounded-xl border border-slate-200/90 shadow-md text-xs select-none">
      {/* 1. Interactive Tape Measure Tool */}
      <button
        onClick={onToggleMeasureMode}
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
          activeMeasureMode
            ? 'bg-blue-600 text-white shadow-xs'
            : 'text-slate-700 hover:text-blue-600 hover:bg-slate-100'
        }`}
        title="Interactive Measure Tape Tool (Click 2 points on canvas)"
      >
        <Ruler size={13} />
        <span>Measure</span>
      </button>

      <div className="h-4 w-px bg-slate-200 mx-0.5" />

      {/* 2. Parallel Offset Micro-Tool */}
      <div className="relative group">
        <button
          disabled={!selectedEntity}
          className="flex items-center gap-1 px-2 py-1 rounded-lg text-slate-700 hover:text-blue-600 hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-transparent font-medium cursor-pointer transition-colors"
          title="Parallel Wall Offset (115mm / 230mm / 300mm)"
        >
          <Move size={13} className="text-slate-500" />
          <span>Offset</span>
          <ChevronDown size={10} className="text-slate-400" />
        </button>

        {selectedEntity && (
          <div className="absolute left-0 top-full mt-1 w-44 bg-white border border-slate-200 rounded-xl shadow-xl p-1 z-50 hidden group-hover:block animate-in fade-in zoom-in-95 duration-100">
            <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Offset Distance
            </div>
            <button
              onClick={() => onOffsetEntity && onOffsetEntity(115)}
              className="w-full text-left px-2 py-1.5 hover:bg-blue-50 text-slate-700 hover:text-blue-700 rounded-lg text-xs font-medium flex items-center justify-between cursor-pointer"
            >
              <span>4.5" Partition</span>
              <span className="font-mono text-[10px] text-slate-400">115 mm</span>
            </button>
            <button
              onClick={() => onOffsetEntity && onOffsetEntity(230)}
              className="w-full text-left px-2 py-1.5 hover:bg-blue-50 text-slate-700 hover:text-blue-700 rounded-lg text-xs font-medium flex items-center justify-between cursor-pointer"
            >
              <span>9" Main Wall</span>
              <span className="font-mono text-[10px] text-slate-400">230 mm</span>
            </button>
            <button
              onClick={() => onOffsetEntity && onOffsetEntity(300)}
              className="w-full text-left px-2 py-1.5 hover:bg-blue-50 text-slate-700 hover:text-blue-700 rounded-lg text-xs font-medium flex items-center justify-between cursor-pointer"
            >
              <span>12" Cavity Wall</span>
              <span className="font-mono text-[10px] text-slate-400">300 mm</span>
            </button>
          </div>
        )}
      </div>

      {/* 3. Mirror Reflection Tool */}
      <div className="flex items-center gap-0.5">
        <button
          onClick={() => onMirrorEntity && onMirrorEntity('horizontal')}
          disabled={!selectedEntity}
          className="p-1.5 rounded-lg text-slate-700 hover:text-blue-600 hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-transparent transition-colors cursor-pointer"
          title="Mirror Horizontal (Flip X)"
        >
          <FlipHorizontal size={13} />
        </button>
        <button
          onClick={() => onMirrorEntity && onMirrorEntity('vertical')}
          disabled={!selectedEntity}
          className="p-1.5 rounded-lg text-slate-700 hover:text-blue-600 hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-transparent transition-colors cursor-pointer"
          title="Mirror Vertical (Flip Y)"
        >
          <FlipVertical size={13} />
        </button>
      </div>

      {/* 4. Array / Linear Pattern Tool */}
      <button
        onClick={() => {
          if (selectedEntity && onArrayEntity) {
            onArrayEntity(3, 1500);
          }
        }}
        disabled={!selectedEntity}
        className="flex items-center gap-1 px-2 py-1 rounded-lg text-slate-700 hover:text-blue-600 hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-transparent font-medium cursor-pointer transition-colors"
        title="Linear Repeat Array (Duplicate 3x with 1.5m spacing)"
      >
        <Grid size={13} className="text-slate-500" />
        <span className="hidden sm:inline">Array (3×)</span>
      </button>

      {/* 5. Auto-Dimension Micro-Tool */}
      <button
        onClick={onAutoDimension}
        className="flex items-center gap-1 px-2 py-1 rounded-lg text-slate-700 hover:text-blue-600 hover:bg-slate-100 font-medium cursor-pointer transition-colors"
        title="Auto-Dimension (Generates overall span dimensions around blueprint)"
      >
        <Sparkles size={13} className="text-amber-500" />
        <span className="hidden md:inline">Auto-Dim</span>
      </button>

      <div className="h-4 w-px bg-slate-200 mx-0.5" />

      {/* 6. Area Calculator Popover */}
      <div className="relative">
        <button
          onClick={() => setShowAreaCalc(!showAreaCalc)}
          className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            showAreaCalc
              ? 'bg-blue-50 text-blue-700 border border-blue-200'
              : 'text-slate-700 hover:text-blue-600 hover:bg-slate-100'
          }`}
          title="Area Calculator (m² / sq ft live breakdown)"
        >
          <Calculator size={13} className="text-blue-600" />
          <span>Area Calc</span>
        </button>

        {showAreaCalc && (
          <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-64 bg-white border border-slate-200 rounded-xl shadow-xl p-3 z-50 animate-in fade-in zoom-in-95 duration-100">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-2">
              <span className="text-[11px] font-bold text-slate-800 uppercase tracking-wider">
                Precision Area Readout
              </span>
              <button
                onClick={() => setShowAreaCalc(false)}
                className="text-slate-400 hover:text-slate-700 p-0.5 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="text-[11px] font-semibold text-slate-600 truncate">
                {areaStats.target}
              </div>

              <div className="grid grid-cols-2 gap-2 bg-blue-50/60 p-2 rounded-lg border border-blue-100">
                <div>
                  <div className="text-[10px] text-slate-400 font-medium">Metric Area</div>
                  <div className="text-sm font-bold text-blue-700">{areaStats.sqMeters} m²</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 font-medium">Imperial Area</div>
                  <div className="text-sm font-bold text-blue-700">{areaStats.sqFeet} sq ft</div>
                </div>
              </div>

              {selectedEntity && (
                <div className="space-y-1 text-[11px] text-slate-500 pt-1">
                  <div className="flex justify-between">
                    <span>Span (Width):</span>
                    <span className="font-mono font-semibold text-slate-800">{areaStats.spanM} m</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Depth (Height):</span>
                    <span className="font-mono font-semibold text-slate-800">{areaStats.depthM} m</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Perimeter:</span>
                    <span className="font-mono font-semibold text-slate-800">{areaStats.perimeterM} m</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 7. Layer Isolate / Restore */}
      {selectedEntity && (
        <button
          onClick={() => onIsolateLayer && onIsolateLayer(selectedEntity.layerId)}
          className="p-1.5 rounded-lg text-slate-600 hover:text-blue-600 hover:bg-slate-100 transition-colors cursor-pointer"
          title={`Isolate Layer (${selectedEntity.layerId})`}
        >
          <Layers size={13} />
        </button>
      )}

      {onRestoreAllLayers && (
        <button
          onClick={onRestoreAllLayers}
          className="p-1.5 rounded-lg text-slate-600 hover:text-blue-600 hover:bg-slate-100 transition-colors cursor-pointer"
          title="Restore / Unhide All Layers"
        >
          <Eye size={13} />
        </button>
      )}
    </div>
  );
};
