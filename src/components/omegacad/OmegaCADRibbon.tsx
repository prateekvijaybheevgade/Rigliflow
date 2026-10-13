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
  Zap,
  Bath,
  Trees,
  Sliders,
  Check,
  Tag,
  Lightbulb,
  Droplet,
  Compass,
} from 'lucide-react';
import { CadEntityType } from '../../types/omegacad';
import { CAD_TOOLKITS, CadToolItem } from '../../data/cadToolkits';

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
    wallHatch?: any;
    doorSwing?: any;
    doorWidth?: number;
    windowType?: any;
    roomArea?: string;
    roomType?: any;
    dimensionText?: string;
    columnShape?: any;
    stairType?: any;
    furnitureType?: any;
    sanitaryType?: any;
    electricalType?: any;
    siteType?: any;
    scheduleType?: any;
  }) => void;
  onOpenScanModal?: () => void;
}

type RibbonCategory =
  | 'all'
  | 'walls'
  | 'doors'
  | 'windows'
  | 'structure'
  | 'rooms'
  | 'furniture'
  | 'sanitary'
  | 'electrical'
  | 'site'
  | 'annotate';

const CATEGORY_TABS = [
  { id: 'all' as RibbonCategory, label: 'All', count: CAD_TOOLKITS.length },
  { id: 'walls' as RibbonCategory, label: 'Walls', count: 14 },
  { id: 'doors' as RibbonCategory, label: 'Doors', count: 12 },
  { id: 'windows' as RibbonCategory, label: 'Windows', count: 10 },
  { id: 'structure' as RibbonCategory, label: 'Structure', count: 12 },
  { id: 'rooms' as RibbonCategory, label: 'Rooms', count: 12 },
  { id: 'furniture' as RibbonCategory, label: 'Interior', count: 16 },
  { id: 'sanitary' as RibbonCategory, label: 'Plumbing', count: 10 },
  { id: 'electrical' as RibbonCategory, label: 'MEP/Elec', count: 12 },
  { id: 'site' as RibbonCategory, label: 'Site/Civil', count: 10 },
  { id: 'annotate' as RibbonCategory, label: 'Anno/Dims', count: 15 },
];

export const OmegaCADRibbon: React.FC<OmegaCADRibbonProps> = ({
  onAddCadEntity,
  onOpenScanModal,
}) => {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<RibbonCategory>('all');

  const filteredTools = useMemo(() => {
    return CAD_TOOLKITS.filter((tool) => {
      const matchesCategory =
        activeCategory === 'all' || tool.category === activeCategory;
      if (!matchesCategory) return false;

      if (!search.trim()) return true;
      const q = search.toLowerCase().trim();
      return (
        tool.label.toLowerCase().includes(q) ||
        tool.sub.toLowerCase().includes(q) ||
        tool.category.toLowerCase().includes(q) ||
        (tool.badge && tool.badge.toLowerCase().includes(q))
      );
    });
  }, [activeCategory, search]);

  const getToolIcon = (tool: CadToolItem) => {
    switch (tool.category) {
      case 'walls':
        return Square;
      case 'doors':
        return DoorOpen;
      case 'windows':
        return Split;
      case 'structure':
        return Columns;
      case 'rooms':
        return Home;
      case 'furniture':
        return Armchair;
      case 'sanitary':
        return Bath;
      case 'electrical':
        return Zap;
      case 'site':
        return Trees;
      case 'annotate':
        return Ruler;
      default:
        return Square;
    }
  };

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
            placeholder="Search 100+ CAD blocks..."
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

        {/* Scrollable Tool Categories Tabs */}
        <div className="flex items-center gap-1 p-0.5 bg-slate-100 rounded-lg overflow-x-auto scrollbar-none py-1">
          {CATEGORY_TABS.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`text-[11px] py-1 px-2 rounded-md font-medium whitespace-nowrap transition-all cursor-pointer flex items-center gap-1 shrink-0 ${
                activeCategory === cat.id
                  ? 'bg-white text-slate-900 shadow-xs font-bold'
                  : 'text-slate-500 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <span>{cat.label}</span>
              <span
                className={`text-[9.5px] px-1 py-0.2 rounded-full font-mono ${
                  activeCategory === cat.id
                    ? 'bg-blue-100 text-blue-700 font-bold'
                    : 'bg-slate-200/60 text-slate-500'
                }`}
              >
                {cat.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* 3. CAD Blocks List Header */}
      <div className="px-3 pt-2.5 pb-1 flex items-center justify-between text-[10.5px] font-semibold text-slate-400">
        <span className="uppercase tracking-wider">
          {activeCategory.toUpperCase()} BLOCKS ({filteredTools.length})
        </span>
        <span className="text-[10px] text-slate-400">Click to place</span>
      </div>

      {/* 4. Blocks List (100+ functioning tools) */}
      <div className="flex-1 overflow-y-auto px-2 space-y-1.5 py-1">
        {filteredTools.length === 0 ? (
          <div className="text-center py-8 px-3 text-xs text-slate-400">
            No tools match &ldquo;{search}&rdquo;
          </div>
        ) : (
          filteredTools.map((tool) => {
            const Icon = getToolIcon(tool);
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
                    doorSwing: tool.doorSwing,
                    doorWidth: tool.doorWidth,
                    windowType: tool.windowType,
                    roomArea: tool.roomArea,
                    roomType: tool.roomType,
                    dimensionText: tool.dimensionText,
                    columnShape: tool.columnShape,
                    stairType: tool.stairType,
                    furnitureType: tool.furnitureType,
                    sanitaryType: tool.sanitaryType,
                    electricalType: tool.electricalType,
                    siteType: tool.siteType,
                    scheduleType: tool.scheduleType,
                  })
                }
                className="w-full text-left p-2 rounded-lg border border-slate-200 hover:border-blue-400 hover:bg-blue-50/20 bg-white shadow-xs transition-all cursor-pointer group flex items-center justify-between gap-2.5"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 group-hover:bg-blue-50 group-hover:text-blue-600 text-slate-600 flex items-center justify-center shrink-0 transition-colors">
                    <Icon size={15} />
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
                    <span className="text-[9px] font-medium text-slate-500 bg-slate-100 group-hover:bg-blue-100 group-hover:text-blue-700 px-1.5 py-0.5 rounded transition-colors font-mono">
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
