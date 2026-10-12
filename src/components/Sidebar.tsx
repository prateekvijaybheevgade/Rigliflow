import React, { useState, useMemo } from 'react';
import { NodeType } from '../types/flowchart';
import {
  Square,
  Diamond,
  Circle,
  Database,
  Cloud,
  Layers,
  FileText,
  StickyNote,
  Plus,
  PlayCircle,
  Keyboard,
  ChevronRight,
  Sparkles,
  Search,
  Server,
  Hexagon,
  Triangle,
  Table,
  User,
  Type,
  Box,
  Split,
  X,
  Compass,
} from 'lucide-react';

interface SidebarProps {
  onAddNode: (type: NodeType) => void;
  onOpenUploadModal: () => void;
  onOpenAIPromptModal: () => void;
  onOpenTemplates?: () => void;
}

type ShapeCategory = 'all' | 'general' | 'flowchart' | 'cloud' | 'uml';

interface ShapeItem {
  type: NodeType;
  name: string;
  category: 'general' | 'flowchart' | 'cloud' | 'uml';
  desc: string;
  icon: React.ReactNode;
  defaultColor: string;
  tags?: string[];
}

const ALL_SHAPES: ShapeItem[] = [
  // General & Flowchart
  {
    type: 'process',
    name: 'Process / Step',
    category: 'general',
    desc: 'Standard action or task',
    icon: <Square size={15} className="text-blue-600" />,
    defaultColor: '#3B82F6',
    tags: ['box', 'rectangle', 'action', 'step'],
  },
  {
    type: 'decision',
    name: 'Decision',
    category: 'flowchart',
    desc: 'Condition or branch point',
    icon: <Diamond size={15} className="text-amber-500" />,
    defaultColor: '#F59E0B',
    tags: ['condition', 'if', 'branch', 'rhombus'],
  },
  {
    type: 'start_end',
    name: 'Start / End',
    category: 'flowchart',
    desc: 'Terminal or entrypoint',
    icon: <Circle size={15} className="text-emerald-600" />,
    defaultColor: '#10B981',
    tags: ['terminal', 'circle', 'entry', 'exit'],
  },
  {
    type: 'hexagon',
    name: 'Preparation / Hexagon',
    category: 'flowchart',
    desc: 'Setup step or microservice',
    icon: <Hexagon size={15} className="text-cyan-600" />,
    defaultColor: '#06B6D4',
    tags: ['hex', 'prep', 'setup', 'microservice'],
  },
  {
    type: 'triangle',
    name: 'Merge / Triangle',
    category: 'flowchart',
    desc: 'Yield, warning, or merge',
    icon: <Triangle size={15} className="text-rose-500" />,
    defaultColor: '#F43F5E',
    tags: ['yield', 'warning', 'join', 'delta'],
  },
  {
    type: 'io',
    name: 'Input / Output',
    category: 'flowchart',
    desc: 'Data payload or user entry',
    icon: <PlayCircle size={15} className="text-teal-600" />,
    defaultColor: '#14B8A6',
    tags: ['data', 'io', 'payload', 'input'],
  },
  {
    type: 'document',
    name: 'Document / Report',
    category: 'general',
    desc: 'Invoice, file, PDF, report',
    icon: <FileText size={15} className="text-pink-500" />,
    defaultColor: '#EC4899',
    tags: ['file', 'report', 'page', 'doc'],
  },
  {
    type: 'subprocess',
    name: 'Subprocess',
    category: 'flowchart',
    desc: 'Predefined external flow',
    icon: <Layers size={15} className="text-indigo-600" />,
    defaultColor: '#6366F1',
    tags: ['routine', 'subflow', 'external'],
  },
  {
    type: 'note',
    name: 'Sticky Note',
    category: 'general',
    desc: 'Annotation or quick remark',
    icon: <StickyNote size={15} className="text-amber-600" />,
    defaultColor: '#FEF3C7',
    tags: ['note', 'memo', 'comment'],
  },
  {
    type: 'text',
    name: 'Text Label',
    category: 'general',
    desc: 'Floating text annotation',
    icon: <Type size={15} className="text-slate-600" />,
    defaultColor: '#64748B',
    tags: ['label', 'annotation', 'title'],
  },
  {
    type: 'frame',
    name: 'Container Frame',
    category: 'general',
    desc: 'Group boundary / swimlane',
    icon: <Box size={15} className="text-violet-500" />,
    defaultColor: '#8B5CF6',
    tags: ['group', 'boundary', 'swimlane', 'vpc'],
  },

  // Cloud & Infrastructure
  {
    type: 'server',
    name: 'Server / Compute',
    category: 'cloud',
    desc: 'VM, node, or rack server',
    icon: <Server size={15} className="text-blue-600" />,
    defaultColor: '#2563EB',
    tags: ['host', 'compute', 'vm', 'linux', 'cluster'],
  },
  {
    type: 'cloud',
    name: 'Cloud / Gateway',
    category: 'cloud',
    desc: 'External API or SaaS service',
    icon: <Cloud size={15} className="text-sky-500" />,
    defaultColor: '#0EA5E9',
    tags: ['aws', 'gcp', 'azure', 'saas', 'internet'],
  },
  {
    type: 'database',
    name: 'Database / Store',
    category: 'cloud',
    desc: 'SQL, NoSQL, or Redis cache',
    icon: <Database size={15} className="text-purple-600" />,
    defaultColor: '#8B5CF6',
    tags: ['sql', 'postgres', 'mongo', 'storage', 'cylinder'],
  },
  {
    type: 'queue',
    name: 'Message Queue',
    category: 'cloud',
    desc: 'Kafka, RabbitMQ, SQS buffer',
    icon: <Split size={15} className="text-indigo-500" />,
    defaultColor: '#6366F1',
    tags: ['kafka', 'sqs', 'rabbitmq', 'fifo', 'event'],
  },

  // UML & Modeling
  {
    type: 'actor',
    name: 'Actor / User',
    category: 'uml',
    desc: 'Human actor or user persona',
    icon: <User size={15} className="text-emerald-600" />,
    defaultColor: '#059669',
    tags: ['person', 'user', 'role', 'customer'],
  },
  {
    type: 'table',
    name: 'Entity Table',
    category: 'uml',
    desc: 'Database table / schema entity',
    icon: <Table size={15} className="text-slate-700" />,
    defaultColor: '#334155',
    tags: ['erd', 'schema', 'entity', 'model'],
  },
];

export const Sidebar: React.FC<SidebarProps> = ({
  onAddNode,
  onOpenUploadModal,
  onOpenAIPromptModal,
  onOpenTemplates,
}) => {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<ShapeCategory>('all');
  const [showShortcuts, setShowShortcuts] = useState(false);

  const filteredShapes = useMemo(() => {
    return ALL_SHAPES.filter((shape) => {
      const matchesCategory =
        activeCategory === 'all' || shape.category === activeCategory;
      if (!matchesCategory) return false;

      if (!search.trim()) return true;
      const query = search.toLowerCase().trim();
      const nameMatch = shape.name.toLowerCase().includes(query);
      const descMatch = shape.desc.toLowerCase().includes(query);
      const tagMatch = shape.tags?.some((t) => t.toLowerCase().includes(query));
      return nameMatch || descMatch || tagMatch;
    });
  }, [activeCategory, search]);

  return (
    <aside className="w-full lg:w-60 border-r border-slate-200/90 bg-white flex flex-col h-full select-none shrink-0 z-20 shadow-[1px_0_2px_rgba(0,0,0,0.02)]">
      {/* Studio Quick Action */}
      <div className="p-2.5 border-b border-slate-100 bg-slate-50/50">
        <button
          onClick={onOpenUploadModal}
          className="w-full bg-slate-900 hover:bg-slate-800 text-white rounded-md py-1.5 px-2.5 text-xs font-medium flex items-center justify-between shadow-xs transition-colors cursor-pointer group"
        >
          <div className="flex items-center gap-2">
            <Sparkles size={13} className="text-amber-400 group-hover:rotate-12 transition-transform" />
            <span>AI Sketch to Diagram</span>
          </div>
          <ChevronRight size={13} className="text-slate-400 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>

      {/* Shape Library Search */}
      <div className="p-2.5 border-b border-slate-100">
        <div className="relative">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search shapes (e.g. server, db)..."
            className="w-full pl-8 pr-7 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-slate-300 focus:bg-white text-slate-800 transition-all"
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

        {/* Segmented Category Control (Anti-Slop Pro Tabs) */}
        <div className="flex items-center gap-0.5 mt-2 p-0.5 bg-slate-100 rounded-lg overflow-x-auto scrollbar-none">
          {(
            [
              { id: 'all', label: 'All' },
              { id: 'general', label: 'General' },
              { id: 'flowchart', label: 'Flow' },
              { id: 'cloud', label: 'Cloud' },
              { id: 'uml', label: 'UML' },
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

      {/* Header Info */}
      <div className="px-3 pt-2.5 pb-1 flex items-center justify-between text-[10.5px] font-semibold text-slate-400">
        <span className="uppercase tracking-wider">Shapes ({filteredShapes.length})</span>
        <span className="text-[10px] text-slate-400">Click to add</span>
      </div>

      {/* Shapes Grid List */}
      <div className="flex-1 overflow-y-auto px-2 space-y-1 py-1">
        {filteredShapes.length === 0 ? (
          <div className="text-center py-8 px-3 text-xs text-slate-400">
            No shapes match &ldquo;{search}&rdquo;
          </div>
        ) : (
          filteredShapes.map((shape) => (
            <button
              key={shape.type}
              onClick={() => onAddNode(shape.type)}
              className="w-full flex items-center gap-2.5 px-2 py-1.5 rounded-md text-left hover:bg-slate-50 group transition-all text-xs cursor-pointer border border-transparent hover:border-slate-200/90 hover:shadow-xs"
            >
              <div
                className="w-7 h-7 rounded-md bg-white border border-slate-200/90 flex items-center justify-center shrink-0 group-hover:scale-105 group-hover:border-slate-300 transition-all shadow-[0_1px_2px_rgba(0,0,0,0.02)]"
              >
                {shape.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-slate-700 group-hover:text-slate-900 truncate text-[11.5px]">
                  {shape.name}
                </div>
                <div className="text-[10px] text-slate-400 truncate">
                  {shape.desc}
                </div>
              </div>
              <Plus
                size={12}
                className="text-slate-400 opacity-0 group-hover:opacity-100 group-hover:text-blue-600 transition-opacity"
              />
            </button>
          ))
        )}
      </div>

      {/* Keyboard Shortcuts & Quick Tips */}
      <div className="p-2.5 border-t border-slate-200/80 bg-slate-50/50 text-[11px]">
        <button
          onClick={() => setShowShortcuts(!showShortcuts)}
          className="w-full flex items-center justify-between text-slate-600 hover:text-slate-900 font-medium cursor-pointer"
        >
          <span className="flex items-center gap-1.5">
            <Keyboard size={13} className="text-slate-500" />
            Tips & Gestures
          </span>
          <ChevronRight
            size={12}
            className={`transition-transform ${showShortcuts ? 'rotate-90' : ''}`}
          />
        </button>

        {showShortcuts && (
          <div className="mt-2 space-y-1.5 text-[10px] text-slate-500 bg-white p-2 rounded-md border border-slate-200 shadow-xs">
            <div className="flex justify-between items-center">
              <span className="text-slate-600 font-medium">Pan Canvas:</span>
              <kbd className="bg-slate-100 px-1 py-0.5 rounded border border-slate-200 font-mono text-[9px]">Space + Drag</kbd>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-600 font-medium">Connect Ports:</span>
              <kbd className="bg-slate-100 px-1 py-0.5 rounded border border-slate-200 font-mono text-[9px]">Drag Port Dot</kbd>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-600 font-medium">Edit Label:</span>
              <kbd className="bg-slate-100 px-1 py-0.5 rounded border border-slate-200 font-mono text-[9px]">Double Click</kbd>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-600 font-medium">Duplicate:</span>
              <kbd className="bg-slate-100 px-1 py-0.5 rounded border border-slate-200 font-mono text-[9px]">Ctrl + D</kbd>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-600 font-medium">Shortcuts:</span>
              <kbd className="bg-slate-100 px-1 py-0.5 rounded border border-slate-200 font-mono text-[9px]">?</kbd>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};

