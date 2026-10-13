import React, { useState } from 'react';
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
  Maximize2,
  Compass,
  X,
  Copy,
  Check,
  Palette,
  Square,
  Home,
  DoorOpen,
  Split,
  Columns,
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
  const [activeTab, setActiveTab] = useState<'layers' | 'inspector'>(
    selectedEntity ? 'inspector' : 'layers'
  );

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
    <aside className="w-72 border-l border-slate-200/90 bg-white flex flex-col h-full select-none shrink-0 z-20 shadow-[-1px_0_2px_rgba(0,0,0,0.02)]">
      {/* 1. Header */}
      <div className="p-3 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers size={15} className="text-blue-600" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
            CAD Layer Stack & Inspector
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          title="Close panel"
        >
          <X size={14} />
        </button>
      </div>

      {/* 2. Sub-tab Navigator (Flowlify PropertiesPanel style) */}
      <div className="flex border-b border-slate-200/90 bg-slate-100/70 p-1 gap-1">
        <button
          onClick={() => setActiveTab('layers')}
          className={`flex-1 py-1 text-[11px] font-medium rounded-md transition-all cursor-pointer ${
            activeTab === 'layers'
              ? 'bg-white text-slate-900 shadow-xs font-semibold'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          Layers ({drawing.layers.length})
        </button>
        <button
          onClick={() => setActiveTab('inspector')}
          className={`flex-1 py-1 text-[11px] font-medium rounded-md transition-all cursor-pointer ${
            activeTab === 'inspector'
              ? 'bg-white text-slate-900 shadow-xs font-semibold'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          {selectedEntity ? 'Entity Inspector' : 'Drawing Info'}
        </button>
      </div>

      {/* 3. Panel Body */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {/* --- TAB 1: CAD LAYERS --- */}
        {activeTab === 'layers' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider">
                Drawing Layers
              </span>
              <span className="text-[9.5px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded font-mono">
                ISO 13567 Standard
              </span>
            </div>

            <div className="space-y-1.5">
              {drawing.layers.map((layer) => {
                const entityCount = drawing.entities.filter(
                  (e) => e.layerId === layer.id
                ).length;
                return (
                  <div
                    key={layer.id}
                    className={`flex items-center justify-between p-2 rounded-lg border text-xs transition-all ${
                      layer.visible
                        ? 'bg-white border-slate-200/90 hover:border-slate-300 shadow-xs'
                        : 'bg-slate-50 border-slate-200/60 opacity-60'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0 shadow-xs ring-1 ring-black/5"
                        style={{ backgroundColor: layer.color }}
                      />
                      <div className="min-w-0">
                        <div className="font-semibold text-xs text-slate-800 truncate font-mono">
                          {layer.name}
                        </div>
                        <div className="text-[10px] text-slate-400 truncate">
                          {layer.description}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <span className="text-[10px] font-medium text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-full">
                        {entityCount}
                      </span>
                      <button
                        onClick={() => toggleLayerLock(layer.id)}
                        className="p-1 rounded-md hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                        title={layer.locked ? 'Unlock Layer' : 'Lock Layer'}
                      >
                        {layer.locked ? (
                          <Lock size={12} className="text-amber-500" />
                        ) : (
                          <Unlock size={12} />
                        )}
                      </button>
                      <button
                        onClick={() => toggleLayerVisibility(layer.id)}
                        className="p-1 rounded-md hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                        title={layer.visible ? 'Hide Layer' : 'Show Layer'}
                      >
                        {layer.visible ? (
                          <Eye size={13} className="text-blue-600" />
                        ) : (
                          <EyeOff size={13} className="text-slate-400" />
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* --- TAB 2: ENTITY INSPECTOR --- */}
        {activeTab === 'inspector' && (
          <div>
            {selectedEntity ? (
              <div className="space-y-3.5">
                {/* Header with Type & Quick Actions */}
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Selected Block
                    </span>
                    <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                      {selectedEntity.type.replace('arch_', '')}
                    </span>
                  </div>
                  <div className="flex items-center gap-0.5">
                    <button
                      onClick={() =>
                        onUpdateEntity(selectedEntity.id, {
                          rotation: ((selectedEntity.rotation || 0) + 90) % 360,
                        })
                      }
                      className="p-1 hover:bg-slate-100 rounded-md text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                      title="Rotate 90°"
                    >
                      <RotateCw size={13} />
                    </button>
                    <button
                      onClick={() => onDeleteEntity(selectedEntity.id)}
                      className="p-1 hover:bg-rose-50 rounded-md text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                      title="Delete CAD entity"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                {/* Entity Label */}
                <div>
                  <label className="block text-[10.5px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Entity Label
                  </label>
                  <input
                    type="text"
                    value={selectedEntity.label}
                    onChange={(e) =>
                      onUpdateEntity(selectedEntity.id, { label: e.target.value })
                    }
                    className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white focus:border-slate-300 font-medium transition-all"
                  />
                </div>

                {/* Sublabel / Description */}
                <div>
                  <label className="block text-[10.5px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Annotation / Specification
                  </label>
                  <input
                    type="text"
                    value={selectedEntity.sublabel || ''}
                    onChange={(e) =>
                      onUpdateEntity(selectedEntity.id, { sublabel: e.target.value })
                    }
                    placeholder="e.g. 230mm RCC or Timber Floor..."
                    className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white focus:border-slate-300 transition-all"
                  />
                </div>

                {/* Layer Assignment */}
                <div>
                  <label className="block text-[10.5px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    CAD Layer
                  </label>
                  <select
                    value={selectedEntity.layerId}
                    onChange={(e) =>
                      onUpdateEntity(selectedEntity.id, { layerId: e.target.value })
                    }
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer font-medium"
                  >
                    {drawing.layers.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.name} — {l.description}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Span & Depth Geometry (mm) */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10.5px] font-bold text-slate-500 uppercase tracking-wider mb-1">
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
                      className="w-full px-2 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-mono focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10.5px] font-bold text-slate-500 uppercase tracking-wider mb-1">
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
                      className="w-full px-2 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-mono focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Orthogonal Rotation */}
                <div>
                  <label className="block text-[10.5px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Orthogonal Angle
                  </label>
                  <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200/80">
                    {[0, 90, 180, 270].map((deg) => (
                      <button
                        key={deg}
                        onClick={() => onUpdateEntity(selectedEntity.id, { rotation: deg })}
                        className={`flex-1 py-1 text-xs font-medium rounded transition-all cursor-pointer ${
                          (selectedEntity.rotation || 0) === deg
                            ? 'bg-white text-slate-900 font-bold shadow-xs'
                            : 'text-slate-500 hover:text-slate-900'
                        }`}
                      >
                        {deg}°
                      </button>
                    ))}
                  </div>
                </div>

                {/* Wall Specific Properties */}
                {selectedEntity.type === 'arch_wall' && (
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 space-y-2">
                    <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      Wall Architecture
                    </span>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-600 font-medium">Hatch Pattern:</span>
                      <select
                        value={selectedEntity.wallHatch || 'concrete'}
                        onChange={(e) =>
                          onUpdateEntity(selectedEntity.id, {
                            wallHatch: e.target.value as any,
                          })
                        }
                        className="bg-white border border-slate-200 rounded px-2 py-0.5 text-xs text-slate-800 focus:outline-none cursor-pointer"
                      >
                        <option value="concrete">Concrete Cross-Hatch</option>
                        <option value="brick">Masonry Brick Hatch</option>
                        <option value="solid">Solid Infill</option>
                      </select>
                    </div>
                  </div>
                )}

                {/* Room Specific Area */}
                {selectedEntity.type === 'arch_room' && (
                  <div className="p-2.5 rounded-lg bg-blue-50/50 border border-blue-200 space-y-1.5">
                    <span className="block text-[10px] font-bold text-blue-700 uppercase tracking-wider">
                      Room Area Calculation
                    </span>
                    <input
                      type="text"
                      value={selectedEntity.roomArea || ''}
                      onChange={(e) =>
                        onUpdateEntity(selectedEntity.id, { roomArea: e.target.value })
                      }
                      placeholder="e.g. 22.5 m² (242 sq ft)"
                      className="w-full px-2 py-1 text-xs bg-white border border-blue-200 rounded font-semibold text-blue-900 focus:outline-none"
                    />
                  </div>
                )}
              </div>
            ) : (
              /* When no entity selected: Drawing Overview */
              <div className="space-y-3.5">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <div className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Blueprint Overview
                  </div>
                  <div className="text-xs text-slate-600 space-y-1">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Scale:</span>
                      <span className="font-semibold text-slate-800">{drawing.scale}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Drafting Unit:</span>
                      <span className="font-semibold text-slate-800">{drawing.unit}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Total Entities:</span>
                      <span className="font-semibold text-blue-600">{drawing.entities.length} items</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Active Layers:</span>
                      <span className="font-semibold text-slate-800">{drawing.layers.length} layers</span>
                    </div>
                  </div>
                </div>

                <div className="text-center py-6 px-3 bg-white rounded-xl border border-dashed border-slate-200">
                  <Sliders size={20} className="mx-auto text-slate-300 mb-1.5" />
                  <div className="text-xs font-semibold text-slate-600">No Entity Selected</div>
                  <div className="text-[10.5px] text-slate-400 mt-0.5">
                    Click any wall, door, room, or column on the canvas to inspect its CAD properties.
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </aside>
  );
};
