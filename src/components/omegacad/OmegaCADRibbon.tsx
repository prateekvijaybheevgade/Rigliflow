import React from 'react';
import {
  Square,
  DoorOpen,
  Split,
  Columns,
  Maximize,
  Ruler,
  Armchair,
  FileSpreadsheet,
  Plus,
} from 'lucide-react';
import { CadEntityType } from '../../types/omegacad';

interface OmegaCADRibbonProps {
  onAddCadEntity: (preset: {
    type: CadEntityType;
    layerId: string;
    label: string;
    sublabel?: string;
    width: number;
    height: number;
    color: string;
    wallThickness?: number;
    wallHatch?: 'concrete' | 'brick' | 'solid';
    roomArea?: string;
    dimensionText?: string;
    furnitureType?: 'bed' | 'sofa' | 'dining' | 'toilet' | 'desk';
  }) => void;
}

export const OmegaCADRibbon: React.FC<OmegaCADRibbonProps> = ({ onAddCadEntity }) => {
  const toolCategories = [
    {
      name: 'Walls & Partitions',
      tools: [
        {
          label: '9" Exterior Wall',
          sub: '230mm Concrete',
          type: 'arch_wall' as CadEntityType,
          layerId: 'layer_wall',
          width: 720,
          height: 22,
          color: '#334155',
          wallThickness: 230,
          wallHatch: 'concrete' as const,
          icon: Square,
        },
        {
          label: '4.5" Partition Wall',
          sub: '115mm Divider',
          type: 'arch_wall' as CadEntityType,
          layerId: 'layer_wall',
          width: 380,
          height: 14,
          color: '#475569',
          wallThickness: 115,
          wallHatch: 'brick' as const,
          icon: Square,
        },
      ],
    },
    {
      name: 'Openings & Glazing',
      tools: [
        {
          label: 'Swing Door (900mm)',
          sub: 'Bedroom / Entry',
          type: 'arch_door' as CadEntityType,
          layerId: 'layer_door',
          width: 80,
          height: 80,
          color: '#F59E0B',
          icon: DoorOpen,
        },
        {
          label: 'Double Door (1800mm)',
          sub: 'Grand Foyer Entry',
          type: 'arch_door' as CadEntityType,
          layerId: 'layer_door',
          width: 120,
          height: 100,
          color: '#F59E0B',
          icon: DoorOpen,
        },
        {
          label: 'Glazed Window (1500mm)',
          sub: 'Double Glazed Sill',
          type: 'arch_window' as CadEntityType,
          layerId: 'layer_window',
          width: 110,
          height: 24,
          color: '#0284C7',
          icon: Split,
        },
      ],
    },
    {
      name: 'Structural Elements',
      tools: [
        {
          label: 'Column C1 (300×300)',
          sub: 'Reinforced Pillar',
          type: 'arch_column' as CadEntityType,
          layerId: 'layer_column',
          width: 36,
          height: 36,
          color: '#0F172A',
          icon: Columns,
        },
      ],
    },
    {
      name: 'Room Enclosures',
      tools: [
        {
          label: 'Living & Dining Hall',
          sub: 'Zone 22.5 m²',
          type: 'arch_room' as CadEntityType,
          layerId: 'layer_room',
          width: 360,
          height: 300,
          color: '#3B82F6',
          roomArea: '22.5 m² (242 sq ft)',
          icon: Maximize,
        },
        {
          label: 'Master Bedroom',
          sub: 'Zone 18.0 m²',
          type: 'arch_room' as CadEntityType,
          layerId: 'layer_room',
          width: 320,
          height: 280,
          color: '#6366F1',
          roomArea: '18.0 m² (194 sq ft)',
          icon: Maximize,
        },
        {
          label: 'Kitchen & Utility',
          sub: 'Zone 7.5 m²',
          type: 'arch_room' as CadEntityType,
          layerId: 'layer_room',
          width: 240,
          height: 160,
          color: '#0D9488',
          roomArea: '7.5 m² (81 sq ft)',
          icon: Maximize,
        },
        {
          label: 'Ensuite Bathroom',
          sub: 'Zone 4.5 m²',
          type: 'arch_room' as CadEntityType,
          layerId: 'layer_room',
          width: 180,
          height: 140,
          color: '#0284C7',
          roomArea: '4.5 m² (48 sq ft)',
          icon: Maximize,
        },
      ],
    },
    {
      name: 'Annotations & Blocks',
      tools: [
        {
          label: 'Dimension Line',
          sub: 'Linear Span Callout',
          type: 'arch_dimension' as CadEntityType,
          layerId: 'layer_dimension',
          width: 480,
          height: 35,
          color: '#60A5FA',
          dimensionText: 'SPAN: 6.00 m (19\' 8")',
          icon: Ruler,
        },
        {
          label: 'King Bed Block',
          sub: '1800×2000 mm',
          type: 'arch_furniture' as CadEntityType,
          layerId: 'layer_furniture',
          width: 140,
          height: 160,
          color: '#64748B',
          furnitureType: 'bed' as const,
          icon: Armchair,
        },
        {
          label: 'Engineering Title Block',
          sub: 'Drawing Stamp A-101',
          type: 'arch_titleblock' as CadEntityType,
          layerId: 'layer_title',
          width: 440,
          height: 80,
          color: '#0F172A',
          icon: FileSpreadsheet,
        },
      ],
    },
  ];

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col h-full text-slate-200 select-none shrink-0 z-20">
      <div className="p-3 border-b border-slate-800 flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">
          CAD Tools & Blocks
        </span>
        <span className="text-[10px] text-slate-400 font-mono">AutoCAD / ITC</span>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-4">
        {toolCategories.map((cat) => (
          <div key={cat.name}>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 mb-1.5">
              {cat.name}
            </div>
            <div className="space-y-1">
              {cat.tools.map((t) => {
                const Icon = t.icon;
                return (
                  <button
                    key={t.label}
                    onClick={() =>
                      onAddCadEntity({
                        type: t.type,
                        layerId: t.layerId,
                        label: t.label,
                        sublabel: t.sub,
                        width: t.width,
                        height: t.height,
                        color: t.color,
                        wallThickness: (t as any).wallThickness,
                        wallHatch: (t as any).wallHatch,
                        roomArea: (t as any).roomArea,
                        dimensionText: (t as any).dimensionText,
                        furnitureType: (t as any).furnitureType,
                      })
                    }
                    className="w-full flex items-center gap-2.5 p-2 rounded-lg bg-slate-950/60 hover:bg-slate-800/80 border border-slate-800/80 hover:border-cyan-500/40 text-left transition-all group cursor-pointer"
                  >
                    <div className="w-7 h-7 rounded-md bg-slate-900 border border-slate-700/80 flex items-center justify-center text-cyan-400 group-hover:scale-105 group-hover:border-cyan-400 transition-all shrink-0">
                      <Icon size={14} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-semibold text-slate-200 group-hover:text-cyan-300 truncate">
                        {t.label}
                      </div>
                      <div className="text-[10px] text-slate-400 truncate font-mono">
                        {t.sub}
                      </div>
                    </div>
                    <Plus size={12} className="text-slate-500 group-hover:text-cyan-400 shrink-0" />
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
};
