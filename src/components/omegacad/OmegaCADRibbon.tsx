import React, { useState, useMemo } from 'react';
import {
  Square,
  DoorOpen,
  Split,
  Columns,
  Home,
  Ruler,
  Armchair,
  FileSpreadsheet,
  Plus,
  Search,
  X,
  Sparkles,
  ChevronRight,
  Maximize2,
  Table,
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
  onOpenScanModal?: () => void;
}

type RibbonCategory = 'all' | 'walls' | 'openings' | 'columns' | 'rooms' | 'annotate';

interface CadToolPreset {
  id: string;
  label: string;
  sub: string;
  category: 'walls' | 'openings' | 'columns' | 'rooms' | 'annotate';
  type: CadEntityType;
  layerId: string;
  width: number;
  height: number;
  color: string;
  wallThickness?: number;
  wallHatch?: 'concrete' | 'brick' | 'solid';
  roomArea?: string;
  dimensionText?: string;
  furnitureType?: 'bed' | 'sofa' | 'dining' | 'toilet' | 'desk';
  icon: React.ComponentType<{ size?: number; className?: string }>;
  badge?: string;
}

const CAD_TOOL_PRESETS: CadToolPreset[] = [
  // Walls
  {
    id: 'wall-ext',
    label: '9" Exterior Wall',
    sub: '230mm Load-bearing Concrete',
    category: 'walls',
    type: 'arch_wall',
    layerId: 'layer_wall',
    width: 720,
    height: 22,
    color: '#334155',
    wallThickness: 230,
    wallHatch: 'concrete',
    icon: Square,
    badge: '230mm',
  },
  {
    id: 'wall-part',
    label: '4.5" Partition Wall',
    sub: '115mm Brick Divider',
    category: 'walls',
    type: 'arch_wall',
    layerId: 'layer_wall',
    width: 380,
    height: 14,
    color: '#475569',
    wallThickness: 115,
    wallHatch: 'brick',
    icon: Square,
    badge: '115mm',
  },
  // Openings (Doors & Windows)
  {
    id: 'door-swing-900',
    label: 'Swing Door (900mm)',
    sub: 'Standard Room / Bedroom Entry',
    category: 'openings',
    type: 'arch_door',
    layerId: 'layer_door',
    width: 80,
    height: 80,
    color: '#F59E0B',
    icon: DoorOpen,
    badge: '90° Swing',
  },
  {
    id: 'door-double-1800',
    label: 'Double Door (1800mm)',
    sub: 'Grand Foyer Entryway',
    category: 'openings',
    type: 'arch_door',
    layerId: 'layer_door',
    width: 120,
    height: 100,
    color: '#F59E0B',
    icon: DoorOpen,
    badge: 'Foyer',
  },
  {
    id: 'win-glazed-1500',
    label: 'Glazed Window (1500mm)',
    sub: 'Double Glazed Sill Opening',
    category: 'openings',
    type: 'arch_window',
    layerId: 'layer_window',
    width: 110,
    height: 24,
    color: '#0284C7',
    icon: Split,
    badge: 'Glazed',
  },
  {
    id: 'win-bay-2000',
    label: 'Bay Window (2000mm)',
    sub: 'Panoramic Living Room Glazing',
    category: 'openings',
    type: 'arch_window',
    layerId: 'layer_window',
    width: 140,
    height: 28,
    color: '#0284C7',
    icon: Split,
    badge: 'Bay',
  },
  // Structural Columns
  {
    id: 'col-c1-300',
    label: 'Column C1 (300×300)',
    sub: 'Reinforced Concrete Pillar',
    category: 'columns',
    type: 'arch_column',
    layerId: 'layer_column',
    width: 36,
    height: 36,
    color: '#0F172A',
    icon: Columns,
    badge: 'RCC',
  },
  {
    id: 'col-c2-400',
    label: 'Column C2 (400×400)',
    sub: 'Heavy Foundation Pillar',
    category: 'columns',
    type: 'arch_column',
    layerId: 'layer_column',
    width: 44,
    height: 44,
    color: '#0F172A',
    icon: Columns,
    badge: 'Heavy',
  },
  // Rooms
  {
    id: 'room-living',
    label: 'Living & Dining Hall',
    sub: 'Zone 22.5 m² (242 sq ft)',
    category: 'rooms',
    type: 'arch_room',
    layerId: 'layer_room',
    width: 330,
    height: 330,
    color: '#3B82F6',
    roomArea: '22.5 m² (242 sq ft)',
    icon: Home,
    badge: 'Living',
  },
  {
    id: 'room-bed',
    label: 'Master Bedroom Suite',
    sub: 'Zone 18.2 m² (196 sq ft)',
    category: 'rooms',
    type: 'arch_room',
    layerId: 'layer_room',
    width: 294,
    height: 330,
    color: '#6366F1',
    roomArea: '18.2 m² (196 sq ft)',
    icon: Home,
    badge: 'Master',
  },
  {
    id: 'room-kit',
    label: 'Modular Kitchen & Utility',
    sub: 'Zone 7.2 m² (78 sq ft)',
    category: 'rooms',
    type: 'arch_room',
    layerId: 'layer_room',
    width: 240,
    height: 116,
    color: '#0D9488',
    roomArea: '7.2 m² (78 sq ft)',
    icon: Home,
    badge: 'Kitchen',
  },
  {
    id: 'room-bath',
    label: 'Ensuite Bathroom',
    sub: 'Zone 4.5 m² (48 sq ft)',
    category: 'rooms',
    type: 'arch_room',
    layerId: 'layer_room',
    width: 160,
    height: 116,
    color: '#0284C7',
    roomArea: '4.5 m² (48 sq ft)',
    icon: Home,
    badge: 'Bath',
  },
  // Annotations & Furniture
  {
    id: 'dim-span',
    label: 'Linear Dimension Span',
    sub: 'Linear Callout with Witness Lines',
    category: 'annotate',
    type: 'arch_dimension',
    layerId: 'layer_dimension',
    width: 300,
    height: 35,
    color: '#3B82F6',
    dimensionText: '3.00 m (9\' 10")',
    icon: Ruler,
    badge: 'Dim',
  },
  {
    id: 'furn-bed',
    label: 'King Bed Block',
    sub: '1800×2000mm Bed Contour',
    category: 'annotate',
    type: 'arch_furniture',
    layerId: 'layer_furniture',
    width: 130,
    height: 150,
    color: '#64748B',
    furnitureType: 'bed',
    icon: Armchair,
    badge: 'Block',
  },
  {
    id: 'furn-sofa',
    label: '3-Seater Sofa Block',
    sub: '2100×850mm Living Seating',
    category: 'annotate',
    type: 'arch_furniture',
    layerId: 'layer_furniture',
    width: 150,
    height: 70,
    color: '#64748B',
    furnitureType: 'sofa',
    icon: Armchair,
    badge: 'Block',
  },
  {
    id: 'titleblock',
    label: 'Engineering Title Block',
    sub: 'Architectural Sheet Stamp A-101',
    category: 'annotate',
    type: 'arch_titleblock',
    layerId: 'layer_title',
    width: 440,
    height: 80,
    color: '#0F172A',
    icon: Table,
    badge: 'Stamp',
  },
];

export const OmegaCADRibbon: React.FC<OmegaCADRibbonProps> = ({
  onAddCadEntity,
  onOpenScanModal,
}) => {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<RibbonCategory>('all');

  const filteredTools = useMemo(() => {
    return CAD_TOOL_PRESETS.filter((tool) => {
      const matchesCategory =
        activeCategory === 'all' || tool.category === activeCategory;
      if (!matchesCategory) return false;

      if (!search.trim()) return true;
      const q = search.toLowerCase().trim();
      return (
        tool.label.toLowerCase().includes(q) ||
        tool.sub.toLowerCase().includes(q) ||
        tool.category.toLowerCase().includes(q)
      );
    });
  }, [activeCategory, search]);

  return (
    <aside className="w-64 border-r border-slate-200/90 bg-white flex flex-col h-full select-none shrink-0 z-20 shadow-[1px_0_2px_rgba(0,0,0,0.02)]">
      {/* 1. Quick Action Banner */}
      {onOpenScanModal && (
        <div className="p-2.5 border-b border-slate-100 bg-slate-50/50">
          <button
            onClick={onOpenScanModal}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white rounded-md py-1.5 px-2.5 text-xs font-medium flex items-center justify-between shadow-xs transition-colors cursor-pointer group"
          >
            <div className="flex items-center gap-2">
              <Sparkles size={13} className="text-amber-400 group-hover:rotate-12 transition-transform" />
              <span>AI Sketch to CAD</span>
            </div>
            <ChevronRight size={13} className="text-slate-400 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      )}

      {/* 2. Search & Segmented Categories Filter */}
      <div className="p-2.5 border-b border-slate-100 space-y-2">
        <div className="relative">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search CAD tools & blocks..."
            className="w-full pl-8 pr-7 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-slate-300 focus:bg-white text-slate-800 transition-all font-sans"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
            >
              <X size={12} />
            </button>
          )}
        </div>

        {/* Segmented Filter Pills */}
        <div className="flex items-center gap-0.5 p-0.5 bg-slate-100 rounded-lg overflow-x-auto scrollbar-none">
          {(
            [
              { id: 'all', label: 'All' },
              { id: 'walls', label: 'Walls' },
              { id: 'openings', label: 'Doors' },
              { id: 'columns', label: 'Cols' },
              { id: 'rooms', label: 'Rooms' },
              { id: 'annotate', label: 'Anno' },
            ] as const
          ).map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`flex-1 text-[11px] py-1 px-1.5 rounded-md font-medium text-center whitespace-nowrap transition-all cursor-pointer ${
                activeCategory === cat.id
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-500 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* 3. CAD Blocks List Header */}
      <div className="px-3 pt-2.5 pb-1 flex items-center justify-between text-[10.5px] font-semibold text-slate-400">
        <span className="uppercase tracking-wider">CAD Library ({filteredTools.length})</span>
        <span className="text-[10px] text-slate-400">Click to add</span>
      </div>

      {/* 4. Blocks List */}
      <div className="flex-1 overflow-y-auto px-2 space-y-1 py-1">
        {filteredTools.length === 0 ? (
          <div className="text-center py-8 px-3 text-xs text-slate-400">
            No tools match &ldquo;{search}&rdquo;
          </div>
        ) : (
          filteredTools.map((tool) => {
            const Icon = tool.icon;
            return (
              <button
                key={tool.id}
                onClick={() =>
                  onAddCadEntity({
                    type: tool.type,
                    layerId: tool.layerId,
                    label: tool.label,
                    sublabel: tool.sub,
                    width: tool.width,
                    height: tool.height,
                    color: tool.color,
                    wallThickness: tool.wallThickness,
                    wallHatch: tool.wallHatch,
                    roomArea: tool.roomArea,
                    dimensionText: tool.dimensionText,
                    furnitureType: tool.furnitureType,
                  })
                }
                className="w-full text-left p-2 rounded-lg border border-slate-200 hover:border-blue-400 hover:bg-blue-50/20 bg-white shadow-xs transition-all cursor-pointer group flex items-center justify-between gap-2.5"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 group-hover:bg-blue-50 group-hover:text-blue-600 text-slate-600 flex items-center justify-center shrink-0 transition-colors">
                    <Icon size={16} />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-slate-800 group-hover:text-blue-600 truncate transition-colors">
                      {tool.label}
                    </div>
                    <div className="text-[10.5px] text-slate-400 truncate">
                      {tool.sub}
                    </div>
                  </div>
                </div>

                <div className="shrink-0 flex items-center gap-1">
                  {tool.badge && (
                    <span className="text-[9.5px] font-medium text-slate-500 bg-slate-100 group-hover:bg-blue-100 group-hover:text-blue-700 px-1.5 py-0.5 rounded transition-colors">
                      {tool.badge}
                    </span>
                  )}
                  <div className="opacity-0 group-hover:opacity-100 text-blue-600 transition-opacity p-0.5">
                    <Plus size={13} />
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>
    </aside>
  );
};
