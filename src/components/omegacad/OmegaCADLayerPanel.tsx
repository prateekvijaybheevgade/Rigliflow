import React from 'react';
import {
  Layers,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  RotateCw,
  Trash2,
  Sliders,
  Ruler,
  Maximize,
  Compass,
  X,
} from 'lucide-react';
import { CadDrawing, CadEntity, CadLayer } from '../../types/omegacad';

interface OmegaCADLayerPanelProps {
  drawing: CadDrawing;
  selectedEntity: CadEntity | null;
  onUpdateDrawing: (updater: (prev: CadDrawing) => CadDrawing) => void;
  onUpdateEntity: (entityId: string, partial: Partial<CadEntity>) => void;
  onDeleteEntity: (entityId: string) => void;
  onClose: () => void;
}

export const OmegaCADLayerPanel: React.FC<OmegaCADLayerPanelProps> = ({
  drawing,
  selectedEntity,
  onUpdateDrawing,
  onUpdateEntity,
  onDeleteEntity,
  onClose,
}) => {
  const toggleLayerVisibility = (layerId: string) => {
    onUpdateDrawing((prev) => ({
      ...prev,
      layers: prev.layers.map((l) =>
        l.id === layerId ? { ...l, visible: !l.visible } : l
      ),
    }));
  };

  const toggleLayerLock = (layerId: string) => {
    onUpdateDrawing((prev) => ({
      ...prev,
      layers: prev.layers.map((l) =>
        l.id === layerId ? { ...l, locked: !l.locked } : l
      ),
    }));
  };

  return (
    <aside className="w-72 bg-slate-900 border-l border-slate-800 flex flex-col h-full text-slate-200 select-none shrink-0 z-20">
      {/* Panel Header */}
      <div className="p-3 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers size={15} className="text-cyan-400" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
            CAD Layer Stack
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X size={15} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-5">
        {/* 1. LAYER MANAGER */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Drawing Layers ({drawing.layers.length})
            </span>
            <span className="text-[10px] text-slate-400 font-mono">ISO 13567</span>
          </div>

          <div className="space-y-1 bg-slate-950/60 p-1.5 rounded-xl border border-slate-800">
            {drawing.layers.map((layer) => {
              const entityCount = drawing.entities.filter((e) => e.layerId === layer.id).length;
              return (
                <div
                  key={layer.id}
                  className={`flex items-center justify-between p-1.5 rounded-lg text-xs transition-colors ${
                    layer.visible ? 'hover:bg-slate-850' : 'opacity-50 hover:bg-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0 shadow-xs"
                      style={{ backgroundColor: layer.color }}
                    />
                    <div className="min-w-0">
                      <div className="font-mono font-semibold text-[11px] text-slate-200 truncate">
                        {layer.name}
                      </div>
                      <div className="text-[9px] text-slate-400 truncate">
                        {layer.description}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <span className="text-[10px] font-mono text-slate-400 px-1">
                      {entityCount}
                    </span>
                    <button
                      onClick={() => toggleLayerLock(layer.id)}
                      className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
                      title={layer.locked ? 'Unlock Layer' : 'Lock Layer'}
                    >
                      {layer.locked ? (
                        <Lock size={12} className="text-amber-400" />
                      ) : (
                        <Unlock size={12} />
                      )}
                    </button>
                    <button
                      onClick={() => toggleLayerVisibility(layer.id)}
                      className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
                      title={layer.visible ? 'Hide Layer' : 'Show Layer'}
                    >
                      {layer.visible ? (
                        <Eye size={13} className="text-cyan-400" />
                      ) : (
                        <EyeOff size={13} className="text-slate-500" />
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 2. SELECTED ENTITY PROPERTIES */}
        {selectedEntity ? (
          <div className="border-t border-slate-800 pt-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Sliders size={14} className="text-cyan-400" />
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Entity Inspector
                </span>
              </div>
              <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-cyan-900/60 text-cyan-300 border border-cyan-500/30">
                {selectedEntity.type.replace('arch_', '')}
              </span>
            </div>

            {/* Label */}
            <div>
              <label className="block text-[10px] text-slate-400 uppercase font-mono mb-1">
                Identifier / Label
              </label>
              <input
                type="text"
                value={selectedEntity.label}
                onChange={(e) =>
                  onUpdateEntity(selectedEntity.id, { label: e.target.value })
                }
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500"
              />
            </div>

            {/* Layer Assignment */}
            <div>
              <label className="block text-[10px] text-slate-400 uppercase font-mono mb-1">
                Assigned CAD Layer
              </label>
              <select
                value={selectedEntity.layerId}
                onChange={(e) =>
                  onUpdateEntity(selectedEntity.id, { layerId: e.target.value })
                }
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 cursor-pointer font-mono"
              >
                {drawing.layers.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name} — {l.description}
                  </option>
                ))}
              </select>
            </div>

            {/* Metric Dimensions (mm) */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] text-slate-400 uppercase font-mono mb-1">
                  Span (mm)
                </label>
                <input
                  type="number"
                  value={Math.round(selectedEntity.width * 10)}
                  onChange={(e) =>
                    onUpdateEntity(selectedEntity.id, {
                      width: Math.max(10, Math.round(Number(e.target.value) / 10)),
                    })
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-xs text-white font-mono"
                />
              </div>
              <div>
                <label className="block text-[10px] text-slate-400 uppercase font-mono mb-1">
                  Depth (mm)
                </label>
                <input
                  type="number"
                  value={Math.round(selectedEntity.height * 10)}
                  onChange={(e) =>
                    onUpdateEntity(selectedEntity.id, {
                      height: Math.max(10, Math.round(Number(e.target.value) / 10)),
                    })
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-xs text-white font-mono"
                />
              </div>
            </div>

            {/* Rotation Stepper */}
            <div>
              <label className="block text-[10px] text-slate-400 uppercase font-mono mb-1">
                Orthogonal Rotation
              </label>
              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
                {[0, 90, 180, 270].map((deg) => (
                  <button
                    key={deg}
                    onClick={() => onUpdateEntity(selectedEntity.id, { rotation: deg })}
                    className={`flex-1 py-1 text-xs font-mono rounded cursor-pointer transition-colors ${
                      (selectedEntity.rotation || 0) === deg
                        ? 'bg-cyan-500 text-slate-950 font-bold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {deg}°
                  </button>
                ))}
              </div>
            </div>

            {/* Room Area Specifics */}
            {selectedEntity.type === 'arch_room' && (
              <div>
                <label className="block text-[10px] text-slate-400 uppercase font-mono mb-1">
                  Calculated Floor Area
                </label>
                <input
                  type="text"
                  value={selectedEntity.roomArea || ''}
                  onChange={(e) =>
                    onUpdateEntity(selectedEntity.id, { roomArea: e.target.value })
                  }
                  placeholder="e.g. 21.5 m² (231 sq ft)"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-cyan-300 font-mono"
                />
              </div>
            )}

            {/* Dimension Text Specifics */}
            {selectedEntity.type === 'arch_dimension' && (
              <div>
                <label className="block text-[10px] text-slate-400 uppercase font-mono mb-1">
                  Dimension Text Callout
                </label>
                <input
                  type="text"
                  value={selectedEntity.dimensionText || ''}
                  onChange={(e) =>
                    onUpdateEntity(selectedEntity.id, { dimensionText: e.target.value })
                  }
                  placeholder="e.g. 6.00 m (19' 8&quot;)"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-blue-300 font-mono"
                />
              </div>
            )}

            {/* Delete Entity */}
            <button
              onClick={() => onDeleteEntity(selectedEntity.id)}
              className="w-full flex items-center justify-center gap-1.5 p-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-semibold transition-colors cursor-pointer mt-4"
            >
              <Trash2 size={13} />
              <span>Delete Entity</span>
            </button>
          </div>
        ) : (
          <div className="border-t border-slate-800 pt-6 text-center text-slate-500 text-xs space-y-1">
            <Compass size={24} className="mx-auto text-slate-600 mb-2" />
            <p className="font-semibold text-slate-400">No Entity Selected</p>
            <p className="text-[11px]">Click any wall, door, or room on the CAD canvas to inspect properties</p>
          </div>
        )}
      </div>
    </aside>
  );
};
