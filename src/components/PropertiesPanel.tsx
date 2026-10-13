import React, { useState } from 'react';
import { FlowNode, FlowEdge, NodeType } from '../types/flowchart';
import { DiagramComment } from '../services/diagramService';
import { AlignmentType, DistributionType } from '../utils/alignment';
import {
  Trash2,
  Copy,
  Sliders,
  Type,
  Palette,
  ArrowRight,
  Maximize2,
  Box,
  Layers,
  Sparkles,
  MessageSquare,
  Send,
  CheckCircle2,
  Circle,
  ExternalLink,
  Clock,
  Loader2,
  AlertTriangle,
  User,
  Settings,
  Database,
  Cloud,
  Shield,
  Lock,
  Unlock,
  Bell,
  Zap,
  Info,
  Flame,
  Star,
  Server,
  Tag,
  Globe,
  Key,
  Ban,
  Search,
  X,
  Smile,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  ArrowUp,
  ArrowDown,
  LayoutGrid,
  Grid,
  MoveHorizontal,
  MoveVertical,
  Check,
  ZoomIn,
  ZoomOut,
  Compass,
  Ruler,
  Home,
  DoorClosed,
} from 'lucide-react';

export interface PredefinedIconOverlay {
  id: string;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string; style?: React.CSSProperties }>;
  category?: 'alert' | 'actor' | 'system' | 'general';
}

export const PREDEFINED_ICON_OVERLAYS: PredefinedIconOverlay[] = [
  { id: 'Warning', label: 'Warning', icon: AlertTriangle, category: 'alert' },
  { id: 'User', label: 'User', icon: User, category: 'actor' },
  { id: 'Clock', label: 'Clock', icon: Clock, category: 'general' },
  { id: 'Settings', label: 'Settings', icon: Settings, category: 'system' },
  { id: 'CheckCircle', label: 'Success', icon: CheckCircle2, category: 'alert' },
  { id: 'Info', label: 'Info', icon: Info, category: 'alert' },
  { id: 'Shield', label: 'Shield', icon: Shield, category: 'system' },
  { id: 'Database', label: 'Database', icon: Database, category: 'system' },
  { id: 'Cloud', label: 'Cloud', icon: Cloud, category: 'system' },
  { id: 'Server', label: 'Server', icon: Server, category: 'system' },
  { id: 'Lock', label: 'Lock', icon: Lock, category: 'system' },
  { id: 'Bell', label: 'Bell', icon: Bell, category: 'alert' },
  { id: 'Zap', label: 'Fast', icon: Zap, category: 'general' },
  { id: 'Flame', label: 'Priority', icon: Flame, category: 'alert' },
  { id: 'Star', label: 'Star', icon: Star, category: 'general' },
  { id: 'Tag', label: 'Tag', icon: Tag, category: 'general' },
  { id: 'Globe', label: 'Network', icon: Globe, category: 'system' },
  { id: 'Key', label: 'Security', icon: Key, category: 'system' },
];

export interface PropertiesPanelProps {
  selectedNode: FlowNode | null;
  selectedEdge: FlowEdge | null;
  selectedNodeIds?: string[];
  allNodes?: FlowNode[];
  diagramTitle: string;
  diagramDescription?: string;
  canvasBg?: string;
  gridType?: 'dots' | 'lines' | 'none' | 'blueprint' | 'engineering';
  pageView?: boolean;
  snapToGrid?: boolean;
  totalNodes: number;
  totalEdges: number;
  onUpdateNode: (updated: Partial<FlowNode>) => void;
  onDeleteNode: (id: string) => void;
  onDuplicateNode: (id: string) => void;
  onUpdateEdge: (updated: Partial<FlowEdge>) => void;
  onDeleteEdge: (id: string) => void;
  onUpdateDiagramInfo: (title: string, desc?: string) => void;
  onUpdateCanvasProps?: (props: {
    canvasBg?: string;
    gridType?: 'dots' | 'lines' | 'none' | 'blueprint' | 'engineering';
    pageView?: boolean;
    snapToGrid?: boolean;
  }) => void;
  onAlignNodes?: (alignment: AlignmentType) => void;
  onDistributeNodes?: (distribution: DistributionType) => void;
  onReorderNodes?: (action: 'bring-front' | 'send-back') => void;
  nodeComments?: DiagramComment[];
  onAddNodeComment?: (nodeId: string, content: string) => Promise<void>;
  onToggleResolveComment?: (commentId: string, currentResolved: boolean) => Promise<void>;
  onDeleteComment?: (commentId: string) => Promise<void>;
  onOpenCommentsDrawer?: () => void;
}

const PRESET_COLORS = [
  { name: 'Blue', hex: '#3B82F6' },
  { name: 'Emerald', hex: '#10B981' },
  { name: 'Amber', hex: '#F59E0B' },
  { name: 'Violet', hex: '#8B5CF6' },
  { name: 'Rose', hex: '#EF4444' },
  { name: 'Sky', hex: '#0EA5E9' },
  { name: 'Cyan', hex: '#06B6D4' },
  { name: 'Slate', hex: '#64748B' },
  { name: 'Dark', hex: '#1E293B' },
];

const CANVAS_THEMES = [
  { name: 'Clean Slate', hex: '#F8FAFC' },
  { name: 'Pure White', hex: '#FFFFFF' },
  { name: 'Dark Studio', hex: '#0F172A' },
  { name: 'Blueprint', hex: '#0C4A6E' },
  { name: 'Warm Cream', hex: '#FEF3C7' },
];

export const PropertiesPanel: React.FC<PropertiesPanelProps> = ({
  selectedNode,
  selectedEdge,
  selectedNodeIds = [],
  allNodes = [],
  diagramTitle,
  diagramDescription,
  canvasBg = '#F8FAFC',
  gridType = 'dots',
  pageView = false,
  snapToGrid = true,
  totalNodes,
  totalEdges,
  onUpdateNode,
  onDeleteNode,
  onDuplicateNode,
  onUpdateEdge,
  onDeleteEdge,
  onUpdateDiagramInfo,
  onUpdateCanvasProps,
  onAlignNodes,
  onDistributeNodes,
  onReorderNodes,
  nodeComments = [],
  onAddNodeComment,
  onToggleResolveComment,
  onDeleteComment,
  onOpenCommentsDrawer,
}) => {
  const [activeTab, setActiveTab] = useState<'style' | 'text' | 'arrange' | 'comments'>('style');
  const [quickCommentText, setQuickCommentText] = useState('');
  const [isPostingComment, setIsPostingComment] = useState(false);
  const [iconSearch, setIconSearch] = useState('');

  const isMultiSelect = selectedNodeIds.length > 1;

  const handlePostQuickComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedNode || !quickCommentText.trim() || !onAddNodeComment || isPostingComment) return;
    try {
      setIsPostingComment(true);
      await onAddNodeComment(selectedNode.id, quickCommentText.trim());
      setQuickCommentText('');
    } catch (err) {
      console.error('Failed to post comment from panel:', err);
    } finally {
      setIsPostingComment(false);
    }
  };

  const commentsForThisNode = selectedNode
    ? nodeComments.filter((c) => c.nodeId === selectedNode.id)
    : [];

  return (
    <aside className="w-full lg:w-72 border-l border-slate-200/90 bg-white flex flex-col h-full select-none shrink-0 z-20 text-xs shadow-xs overflow-hidden">
      {/* 1. MULTI-SELECTION ARRANGE INSPECTOR */}
      {isMultiSelect && (
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <div className="flex items-center gap-1.5 font-bold text-slate-800">
              <LayoutGrid size={15} className="text-blue-600" />
              <span>Multiple Selected ({selectedNodeIds.length})</span>
            </div>
            <button
              onClick={() => {
                selectedNodeIds.forEach((id) => onDeleteNode(id));
              }}
              className="p-1 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded transition-colors cursor-pointer"
              title="Delete all selected"
            >
              <Trash2 size={13} />
            </button>
          </div>

          {/* Alignment Tools */}
          {onAlignNodes && (
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-2">
                Align Selection
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  onClick={() => onAlignNodes('align-left')}
                  className="flex items-center justify-center gap-1.5 p-2 bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded-lg text-slate-700 hover:text-blue-700 font-medium transition-all cursor-pointer"
                  title="Align Left"
                >
                  <AlignLeft size={13} />
                  <span>Left</span>
                </button>
                <button
                  onClick={() => onAlignNodes('align-center')}
                  className="flex items-center justify-center gap-1.5 p-2 bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded-lg text-slate-700 hover:text-blue-700 font-medium transition-all cursor-pointer"
                  title="Align Center"
                >
                  <AlignCenter size={13} />
                  <span>Center</span>
                </button>
                <button
                  onClick={() => onAlignNodes('align-right')}
                  className="flex items-center justify-center gap-1.5 p-2 bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded-lg text-slate-700 hover:text-blue-700 font-medium transition-all cursor-pointer"
                  title="Align Right"
                >
                  <AlignRight size={13} />
                  <span>Right</span>
                </button>
                <button
                  onClick={() => onAlignNodes('align-top')}
                  className="flex items-center justify-center gap-1.5 p-2 bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded-lg text-slate-700 hover:text-blue-700 font-medium transition-all cursor-pointer"
                  title="Align Top"
                >
                  <ArrowUp size={13} />
                  <span>Top</span>
                </button>
                <button
                  onClick={() => onAlignNodes('align-middle')}
                  className="flex items-center justify-center gap-1.5 p-2 bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded-lg text-slate-700 hover:text-blue-700 font-medium transition-all cursor-pointer"
                  title="Align Middle"
                >
                  <AlignJustify size={13} />
                  <span>Middle</span>
                </button>
                <button
                  onClick={() => onAlignNodes('align-bottom')}
                  className="flex items-center justify-center gap-1.5 p-2 bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded-lg text-slate-700 hover:text-blue-700 font-medium transition-all cursor-pointer"
                  title="Align Bottom"
                >
                  <ArrowDown size={13} />
                  <span>Bottom</span>
                </button>
              </div>
            </div>
          )}

          {/* Distribute Tools */}
          {onDistributeNodes && (
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-2">
                Distribute Spacing
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => onDistributeNodes('distribute-horizontal')}
                  className="flex items-center justify-center gap-1.5 p-2 bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded-lg text-slate-700 hover:text-blue-700 font-medium transition-all cursor-pointer"
                  title="Distribute Horizontal Spacing"
                >
                  <MoveHorizontal size={13} />
                  <span>Horizontally</span>
                </button>
                <button
                  onClick={() => onDistributeNodes('distribute-vertical')}
                  className="flex items-center justify-center gap-1.5 p-2 bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded-lg text-slate-700 hover:text-blue-700 font-medium transition-all cursor-pointer"
                  title="Distribute Vertical Spacing"
                >
                  <MoveVertical size={13} />
                  <span>Vertically</span>
                </button>
              </div>
            </div>
          )}

          {/* Layer Ordering */}
          {onReorderNodes && (
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-2">
                Layer Depth
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => onReorderNodes('bring-front')}
                  className="flex items-center justify-center gap-1.5 p-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-700 font-medium cursor-pointer"
                >
                  <Layers size={13} />
                  <span>Bring to Front</span>
                </button>
                <button
                  onClick={() => onReorderNodes('send-back')}
                  className="flex items-center justify-center gap-1.5 p-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-700 font-medium cursor-pointer"
                >
                  <Layers size={13} className="rotate-180" />
                  <span>Send to Back</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 2. SINGLE NODE INSPECTOR */}
      {!isMultiSelect && selectedNode && (
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-3 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-1.5 font-bold text-slate-800">
              <Box size={14} className="text-blue-600" />
              <span className="truncate max-w-[140px]">{selectedNode.label || 'Node Inspector'}</span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => onUpdateNode({ isLocked: !selectedNode.isLocked })}
                className={`p-1 rounded transition-colors cursor-pointer ${
                  selectedNode.isLocked
                    ? 'bg-amber-100 text-amber-700'
                    : 'hover:bg-slate-100 text-slate-400 hover:text-slate-700'
                }`}
                title={selectedNode.isLocked ? 'Unlock node' : 'Lock node'}
              >
                {selectedNode.isLocked ? <Lock size={13} /> : <Unlock size={13} />}
              </button>
              <button
                onClick={() => onDuplicateNode(selectedNode.id)}
                className="p-1 hover:bg-slate-100 rounded text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                title="Duplicate node"
              >
                <Copy size={13} />
              </button>
              <button
                onClick={() => onDeleteNode(selectedNode.id)}
                className="p-1 hover:bg-rose-50 rounded text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                title="Delete node"
              >
                <Trash2 size={13} />
              </button>
            </div>
          </div>

          {/* Sub-tab Navigator (Style | Text | Arrange | Comments) */}
          <div className="flex border-b border-slate-200/90 bg-slate-100/70 p-1 gap-1">
            <button
              onClick={() => setActiveTab('style')}
              className={`flex-1 py-1 text-[11px] font-medium rounded-md transition-all cursor-pointer ${
                activeTab === 'style'
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Style
            </button>
            <button
              onClick={() => setActiveTab('text')}
              className={`flex-1 py-1 text-[11px] font-medium rounded-md transition-all cursor-pointer ${
                activeTab === 'text'
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Text
            </button>
            <button
              onClick={() => setActiveTab('arrange')}
              className={`flex-1 py-1 text-[11px] font-medium rounded-md transition-all cursor-pointer ${
                activeTab === 'arrange'
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Arrange
            </button>
            <button
              onClick={() => setActiveTab('comments')}
              className={`flex-1 py-1 text-[11px] font-medium rounded-md transition-all cursor-pointer relative ${
                activeTab === 'comments'
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Chat
              {commentsForThisNode.length > 0 && (
                <span className="ml-1 px-1 rounded-full text-[9px] bg-blue-600 text-white font-bold">
                  {commentsForThisNode.length}
                </span>
              )}
            </button>
          </div>

          {/* Scrollable Tab Body */}
          <div className="flex-1 overflow-y-auto p-3.5 space-y-3.5">
            {/* TAB: STYLE */}
            {activeTab === 'style' && (
              <>
                {/* Shape Type */}
                <div>
                  <label className="block text-[10.5px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Shape Geometry
                  </label>
                  <select
                    value={selectedNode.type}
                    onChange={(e) => onUpdateNode({ type: e.target.value as NodeType })}
                    className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1.5 focus:ring-blue-500 text-slate-700 bg-white capitalize cursor-pointer text-xs"
                  >
                    <option value="process">Process (Rectangle)</option>
                    <option value="decision">Decision (Diamond)</option>
                    <option value="start_end">Start / End (Pill)</option>
                    <option value="database">Database (Cylinder)</option>
                    <option value="server">Server / Compute Node</option>
                    <option value="cloud">Cloud / API Gateway</option>
                    <option value="queue">Message Queue (FIFO)</option>
                    <option value="actor">Actor / User Persona</option>
                    <option value="table">Entity Schema Table</option>
                    <option value="frame">Container / Swimlane Frame</option>
                    <option value="io">Input / Output (Parallelogram)</option>
                    <option value="document">Document (Report)</option>
                    <option value="subprocess">Subprocess (Double-bar)</option>
                    <option value="hexagon">Hexagon (Preparation)</option>
                    <option value="triangle">Triangle (Merge / Yield)</option>
                    <option value="note">Sticky Note</option>
                    <option value="text">Text Box (Transparent)</option>
                    <optgroup label="Architecture & CAD Primitives">
                      <option value="arch_wall">Wall (Civil/Layout)</option>
                      <option value="arch_door">Swing Door (CAD)</option>
                      <option value="arch_window">Glazed Window</option>
                      <option value="arch_room">Room Zone (Auto Area)</option>
                      <option value="arch_dimension">Linear Dimension</option>
                      <option value="arch_column">Structural Column (Pillar)</option>
                      <option value="arch_stair">Staircase Flight</option>
                      <option value="arch_furniture">Bed / Fixture Block</option>
                      <option value="arch_titleblock">Drawing Title Block</option>
                    </optgroup>
                  </select>
                </div>

                {/* 2D CAD & Architectural Drafting Section */}
                <div className="pt-2 border-t border-slate-100 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[10.5px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                      <Compass size={12} className="text-blue-600" />
                      <span>CAD Drafting & Rotation</span>
                    </label>
                    <span className="text-[10px] text-blue-600 font-mono font-bold">
                      {selectedNode.rotation || 0}°
                    </span>
                  </div>

                  {/* 4-way Quick Rotation Controls */}
                  <div className="grid grid-cols-4 gap-1">
                    {[0, 90, 180, 270].map((deg) => (
                      <button
                        key={deg}
                        type="button"
                        onClick={() => onUpdateNode({ rotation: deg })}
                        className={`py-1 text-xs font-mono font-bold rounded-md border transition-all cursor-pointer ${
                          (selectedNode.rotation || 0) === deg
                            ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {deg}°
                      </button>
                    ))}
                  </div>

                  {/* Real-World CAD Measurement Readout */}
                  <div className="p-2 bg-blue-50/70 border border-blue-100 rounded-lg flex items-center justify-between text-xs font-mono">
                    <span className="text-blue-900 font-semibold">Scale (1:50)</span>
                    <span className="text-blue-700 font-bold">
                      {(selectedNode.width / 50).toFixed(2)}m × {(selectedNode.height / 50).toFixed(2)}m
                    </span>
                  </div>

                  {/* Wall Specific Controls */}
                  {selectedNode.type === 'arch_wall' && (
                    <div className="space-y-1.5 pt-1">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase">
                        Wall Thickness
                      </label>
                      <div className="grid grid-cols-3 gap-1">
                        {[
                          { label: '4" / 100mm', h: 12 },
                          { label: '6" / 150mm', h: 18 },
                          { label: '9" / 230mm', h: 26 },
                        ].map((w) => (
                          <button
                            key={w.h}
                            type="button"
                            onClick={() => onUpdateNode({ height: w.h })}
                            className={`py-1 px-1 text-[10px] rounded border font-semibold ${
                              selectedNode.height === w.h
                                ? 'bg-slate-900 text-white border-slate-900'
                                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                            }`}
                          >
                            {w.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Room Zone Preset Controls */}
                  {selectedNode.type === 'arch_room' && (
                    <div className="space-y-1.5 pt-1">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase">
                        Room Preset Name
                      </label>
                      <div className="grid grid-cols-3 gap-1 text-[10px]">
                        {['Living Room', 'Master Bed', 'Kitchen', 'Bath', 'Office', 'Balcony'].map((rm) => (
                          <button
                            key={rm}
                            type="button"
                            onClick={() => onUpdateNode({ label: rm })}
                            className={`py-1 px-1 rounded border font-semibold truncate ${
                              selectedNode.label === rm
                                ? 'bg-blue-600 text-white border-blue-600'
                                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                            }`}
                          >
                            {rm}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Dimension Text Input */}
                  {selectedNode.type === 'arch_dimension' && (
                    <div className="space-y-1 pt-1">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase">
                        Dimension Callout
                      </label>
                      <input
                        type="text"
                        value={selectedNode.dimensionText || `${(selectedNode.width / 50).toFixed(2)} m`}
                        onChange={(e) => onUpdateNode({ dimensionText: e.target.value })}
                        className="w-full px-2 py-1 border border-slate-200 rounded text-xs font-mono bg-white"
                        placeholder="e.g. 4.50 m or 14' 9&quot;"
                      />
                    </div>
                  )}
                </div>

                {/* Node Size & Dimensions */}
                <div className="pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[10.5px] font-bold text-slate-500 uppercase tracking-wider">
                      Size & Dimensions (px)
                    </label>
                    <span className="text-[10px] text-slate-400 font-mono font-semibold">
                      {selectedNode.width} × {selectedNode.height}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mb-2">
                    <div>
                      <span className="block text-[9.5px] text-slate-400 font-semibold mb-0.5">Width</span>
                      <input
                        type="number"
                        min="60"
                        max="800"
                        step="10"
                        value={selectedNode.width}
                        onChange={(e) => onUpdateNode({ width: Math.max(60, Number(e.target.value) || 60) })}
                        className="w-full px-2 py-1 border border-slate-200 rounded-md text-slate-700 text-xs font-mono bg-slate-50 focus:bg-white"
                      />
                    </div>
                    <div>
                      <span className="block text-[9.5px] text-slate-400 font-semibold mb-0.5">Height</span>
                      <input
                        type="number"
                        min="40"
                        max="600"
                        step="5"
                        value={selectedNode.height}
                        onChange={(e) => onUpdateNode({ height: Math.max(40, Number(e.target.value) || 40) })}
                        className="w-full px-2 py-1 border border-slate-200 rounded-md text-slate-700 text-xs font-mono bg-slate-50 focus:bg-white"
                      />
                    </div>
                  </div>

                  {/* Quick Scale Buttons */}
                  <div className="grid grid-cols-3 gap-1 mb-2">
                    <button
                      type="button"
                      onClick={() =>
                        onUpdateNode({
                          width: Math.max(60, Math.round(selectedNode.width * 0.8)),
                          height: Math.max(40, Math.round(selectedNode.height * 0.8)),
                        })
                      }
                      className="px-1.5 py-1 text-[10px] font-semibold bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded text-slate-600 transition-colors cursor-pointer flex items-center justify-center gap-1"
                      title="Shrink Node by 20%"
                    >
                      <ZoomOut size={10} />
                      <span>-20%</span>
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        onUpdateNode({
                          width: Math.min(800, Math.round(selectedNode.width * 1.25)),
                          height: Math.min(600, Math.round(selectedNode.height * 1.25)),
                        })
                      }
                      className="px-1.5 py-1 text-[10px] font-semibold bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded text-blue-700 transition-colors cursor-pointer flex items-center justify-center gap-1"
                      title="Enlarge Node by 25%"
                    >
                      <ZoomIn size={10} />
                      <span>+25%</span>
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        onUpdateNode({
                          width: Math.min(800, Math.round(selectedNode.width * 1.5)),
                          height: Math.min(600, Math.round(selectedNode.height * 1.5)),
                        })
                      }
                      className="px-1.5 py-1 text-[10px] font-semibold bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded text-indigo-700 transition-colors cursor-pointer flex items-center justify-center gap-1"
                      title="Enlarge Node by 50%"
                    >
                      <ZoomIn size={10} />
                      <span>+50%</span>
                    </button>
                  </div>

                  {/* Size Presets */}
                  <div className="flex items-center gap-1">
                    {[
                      { label: 'S (150×65)', w: 150, h: 65 },
                      { label: 'M (210×75)', w: 210, h: 75 },
                      { label: 'L (280×100)', w: 280, h: 100 },
                    ].map((preset) => (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => onUpdateNode({ width: preset.w, height: preset.h })}
                        className={`flex-1 py-0.5 text-[9.5px] rounded border transition-colors cursor-pointer ${
                          selectedNode.width === preset.w && selectedNode.height === preset.h
                            ? 'bg-blue-600 text-white border-blue-600 font-bold'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Fill Type */}
                <div>
                  <label className="block text-[10.5px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Fill Background
                  </label>
                  <div className="grid grid-cols-3 gap-1">
                    {(
                      [
                        { id: 'solid', label: 'Solid' },
                        { id: 'gradient', label: 'Gradient' },
                        { id: 'none', label: 'No Fill' },
                      ] as const
                    ).map((f) => (
                      <button
                        key={f.id}
                        onClick={() => onUpdateNode({ fillType: f.id })}
                        className={`py-1 text-[11px] rounded border font-medium transition-colors cursor-pointer ${
                          (selectedNode.fillType || 'solid') === f.id
                            ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Theme Palette */}
                <div>
                  <label className="block text-[10.5px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Accent Color
                  </label>
                  <div className="grid grid-cols-5 gap-1.5">
                    {PRESET_COLORS.map((col) => (
                      <button
                        key={col.hex}
                        onClick={() => onUpdateNode({ color: col.hex, borderColor: col.hex })}
                        className={`h-6 rounded-md border transition-transform cursor-pointer ${
                          selectedNode.color === col.hex
                            ? 'ring-2 ring-blue-500 scale-105 border-transparent'
                            : 'border-slate-200 hover:scale-105'
                        }`}
                        style={{ backgroundColor: col.hex }}
                        title={col.name}
                      />
                    ))}
                  </div>
                  <div className="mt-2 flex items-center gap-1.5">
                    <span className="text-[10px] text-slate-400">Hex:</span>
                    <input
                      type="text"
                      value={selectedNode.color}
                      onChange={(e) => onUpdateNode({ color: e.target.value })}
                      className="w-24 px-1.5 py-0.5 border border-slate-200 rounded text-[11px] font-mono text-slate-700"
                    />
                  </div>
                </div>

                {/* Border & Stroke */}
                <div className="pt-2 border-t border-slate-100 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[10.5px] font-bold text-slate-500 uppercase tracking-wider">
                      Border Style
                    </label>
                    <select
                      value={selectedNode.borderStyle || 'solid'}
                      onChange={(e) =>
                        onUpdateNode({
                          borderStyle: e.target.value as 'solid' | 'dashed' | 'dotted',
                        })
                      }
                      className="px-2 py-0.5 border border-slate-200 rounded text-[11px] text-slate-700 bg-white"
                    >
                      <option value="solid">Solid</option>
                      <option value="dashed">Dashed</option>
                      <option value="dotted">Dotted</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-between">
                    <label className="text-[10.5px] font-bold text-slate-500 uppercase tracking-wider">
                      Border Width
                    </label>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4].map((bw) => (
                        <button
                          key={bw}
                          onClick={() => onUpdateNode({ borderWidth: bw })}
                          className={`w-6 h-6 rounded border text-[10px] font-bold transition-colors cursor-pointer ${
                            (selectedNode.borderWidth || 2) === bw
                              ? 'bg-blue-600 text-white border-blue-600'
                              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          {bw}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Corner Radius */}
                  <div className="flex items-center justify-between">
                    <label className="text-[10.5px] font-bold text-slate-500 uppercase tracking-wider">
                      Corner Radius
                    </label>
                    <div className="flex items-center gap-1">
                      {[
                        { r: 0, l: '0' },
                        { r: 6, l: '6' },
                        { r: 12, l: '12' },
                        { r: 24, l: '24' },
                      ].map((rad) => (
                        <button
                          key={rad.r}
                          onClick={() => onUpdateNode({ borderRadius: rad.r })}
                          className={`w-6 h-6 rounded border text-[10px] font-bold transition-colors cursor-pointer ${
                            (selectedNode.borderRadius ?? 10) === rad.r
                              ? 'bg-blue-600 text-white border-blue-600'
                              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          {rad.l}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Opacity & Shadow */}
                  <div className="flex items-center justify-between pt-1">
                    <label className="text-[10.5px] font-bold text-slate-500 uppercase tracking-wider">
                      Elevation Shadow
                    </label>
                    <button
                      onClick={() => onUpdateNode({ shadow: !selectedNode.shadow })}
                      className={`px-2 py-0.5 rounded text-[10.5px] font-bold transition-colors cursor-pointer border ${
                        selectedNode.shadow
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-slate-100 text-slate-600 border-slate-200'
                      }`}
                    >
                      {selectedNode.shadow ? 'On' : 'Off'}
                    </button>
                  </div>
                </div>

                {/* Predefined Icon Overlays */}
                <div className="pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="flex items-center gap-1.5 text-[10.5px] font-bold text-slate-500 uppercase tracking-wider">
                      <Smile size={12} className="text-blue-600" />
                      <span>Icon Overlay</span>
                    </label>
                    {selectedNode.icon && (
                      <button
                        type="button"
                        onClick={() => onUpdateNode({ icon: undefined })}
                        className="text-[10px] text-rose-500 hover:text-rose-700 hover:underline cursor-pointer"
                      >
                        Clear
                      </button>
                    )}
                  </div>

                  {/* Search Input for Icon Overlays */}
                  <div className="relative mb-2">
                    <Search size={11} className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={iconSearch}
                      onChange={(e) => setIconSearch(e.target.value)}
                      placeholder="Search overlay icons..."
                      className="w-full pl-6 pr-5 py-1 bg-slate-50 border border-slate-200 rounded-md text-[11px] text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                    {iconSearch && (
                      <button
                        type="button"
                        onClick={() => setIconSearch('')}
                        className="absolute right-1.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        <X size={11} />
                      </button>
                    )}
                  </div>

                  {/* Overlays Grid */}
                  <div className="grid grid-cols-4 gap-1.5 max-h-36 overflow-y-auto p-1.5 bg-slate-50/70 border border-slate-200 rounded-lg">
                    <button
                      type="button"
                      onClick={() => onUpdateNode({ icon: undefined })}
                      className={`flex flex-col items-center justify-center p-1 rounded border transition-all cursor-pointer ${
                        !selectedNode.icon
                          ? 'bg-blue-600 text-white border-blue-600 shadow-2xs font-semibold'
                          : 'bg-white border-slate-200 hover:bg-slate-100 text-slate-600'
                      }`}
                      title="No icon overlay"
                    >
                      <Ban size={13} />
                      <span className="text-[8.5px] mt-0.5 truncate">None</span>
                    </button>

                    {PREDEFINED_ICON_OVERLAYS.filter(
                      (item) =>
                        !iconSearch ||
                        item.label.toLowerCase().includes(iconSearch.toLowerCase()) ||
                        item.id.toLowerCase().includes(iconSearch.toLowerCase())
                    ).map((item) => {
                      const isSelected =
                        selectedNode.icon === item.id ||
                        (item.id === 'Warning' && selectedNode.icon === 'AlertTriangle');
                      const IconComp = item.icon;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() =>
                            onUpdateNode({ icon: isSelected ? undefined : item.id })
                          }
                          className={`flex flex-col items-center justify-center p-1 rounded border transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-blue-600 text-white border-blue-600 shadow-2xs font-semibold'
                              : 'bg-white border-slate-200 hover:bg-slate-100 text-slate-700'
                          }`}
                          title={item.label}
                        >
                          <IconComp size={13} className={isSelected ? 'text-white' : 'text-slate-600'} />
                          <span className="text-[8.5px] mt-0.5 truncate max-w-full">
                            {item.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </>
            )}

            {/* TAB: TEXT */}
            {activeTab === 'text' && (
              <>
                <div>
                  <label className="block text-[10.5px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Primary Label
                  </label>
                  <input
                    type="text"
                    value={selectedNode.label}
                    onChange={(e) => onUpdateNode({ label: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1.5 focus:ring-blue-500 font-medium text-slate-800 text-xs"
                    placeholder="Node title"
                  />
                </div>

                <div>
                  <label className="block text-[10.5px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Subtitle / Detail
                  </label>
                  <input
                    type="text"
                    value={selectedNode.sublabel || ''}
                    onChange={(e) => onUpdateNode({ sublabel: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1.5 focus:ring-blue-500 text-slate-600 text-xs"
                    placeholder="e.g. 5 req/s, Port 443"
                  />
                </div>

                {/* Font Size & Family */}
                <div className="pt-2 border-t border-slate-100 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[10.5px] font-bold text-slate-500 uppercase tracking-wider">
                      Font Family
                    </label>
                    <select
                      value={selectedNode.fontFamily || 'sans'}
                      onChange={(e) =>
                        onUpdateNode({
                          fontFamily: e.target.value as 'sans' | 'mono' | 'serif' | 'handwriting',
                        })
                      }
                      className="px-2 py-0.5 border border-slate-200 rounded text-[11px] text-slate-700 bg-white"
                    >
                      <option value="sans">Inter (Modern Sans)</option>
                      <option value="mono">Mono (Technical)</option>
                      <option value="serif">Serif (Editorial)</option>
                      <option value="handwriting">Handwritten (Sketch)</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-between">
                    <label className="text-[10.5px] font-bold text-slate-500 uppercase tracking-wider">
                      Font Size
                    </label>
                    <div className="flex items-center gap-1">
                      {[10, 12, 14, 16, 20].map((fs) => (
                        <button
                          key={fs}
                          onClick={() => onUpdateNode({ fontSize: fs })}
                          className={`w-6 h-6 rounded border text-[10px] font-bold transition-colors cursor-pointer ${
                            (selectedNode.fontSize || 12) === fs
                              ? 'bg-blue-600 text-white border-blue-600'
                              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          {fs}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Alignment & Weight */}
                  <div className="flex items-center justify-between">
                    <label className="text-[10.5px] font-bold text-slate-500 uppercase tracking-wider">
                      Text Align
                    </label>
                    <div className="flex items-center gap-1">
                      {(['left', 'center', 'right'] as const).map((align) => (
                        <button
                          key={align}
                          onClick={() => onUpdateNode({ textAlign: align })}
                          className={`px-2 py-0.5 rounded border text-[10px] capitalize font-medium transition-colors cursor-pointer ${
                            (selectedNode.textAlign || 'center') === align
                              ? 'bg-blue-600 text-white border-blue-600'
                              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          {align}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <label className="text-[10.5px] font-bold text-slate-500 uppercase tracking-wider">
                      Formatting
                    </label>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() =>
                          onUpdateNode({
                            fontWeight: selectedNode.fontWeight === 'bold' ? 'normal' : 'bold',
                          })
                        }
                        className={`w-6 h-6 rounded border text-xs font-bold transition-colors cursor-pointer ${
                          selectedNode.fontWeight === 'bold'
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-white border-slate-200 text-slate-700'
                        }`}
                      >
                        B
                      </button>
                      <button
                        onClick={() =>
                          onUpdateNode({
                            fontStyle: selectedNode.fontStyle === 'italic' ? 'normal' : 'italic',
                          })
                        }
                        className={`w-6 h-6 rounded border text-xs italic font-serif transition-colors cursor-pointer ${
                          selectedNode.fontStyle === 'italic'
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-white border-slate-200 text-slate-700'
                        }`}
                      >
                        I
                      </button>
                    </div>
                  </div>

                  {/* Text Color */}
                  <div>
                    <label className="block text-[10.5px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      Text Color
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={selectedNode.textColor || '#0F172A'}
                        onChange={(e) => onUpdateNode({ textColor: e.target.value })}
                        className="w-7 h-7 rounded border border-slate-200 cursor-pointer p-0"
                      />
                      <input
                        type="text"
                        value={selectedNode.textColor || '#0F172A'}
                        onChange={(e) => onUpdateNode({ textColor: e.target.value })}
                        className="w-24 px-1.5 py-0.5 border border-slate-200 rounded text-[11px] font-mono text-slate-700"
                      />
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* TAB: ARRANGE */}
            {activeTab === 'arrange' && (
              <>
                {/* Dimensions */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[10.5px] font-bold text-slate-500 uppercase tracking-wider">
                      Dimensions & Scale
                    </label>
                    <span className="text-[10px] text-slate-400 font-mono font-semibold">
                      {selectedNode.width} × {selectedNode.height}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mb-2">
                    <div>
                      <span className="block text-[9.5px] text-slate-400 font-semibold mb-0.5">Width (px)</span>
                      <input
                        type="number"
                        min="60"
                        max="800"
                        step="10"
                        value={selectedNode.width}
                        onChange={(e) => onUpdateNode({ width: Math.max(60, Number(e.target.value) || 60) })}
                        className="w-full px-2 py-1 border border-slate-200 rounded-md text-slate-700 text-xs font-mono bg-slate-50 focus:bg-white"
                      />
                    </div>
                    <div>
                      <span className="block text-[9.5px] text-slate-400 font-semibold mb-0.5">Height (px)</span>
                      <input
                        type="number"
                        min="40"
                        max="600"
                        step="5"
                        value={selectedNode.height}
                        onChange={(e) => onUpdateNode({ height: Math.max(40, Number(e.target.value) || 40) })}
                        className="w-full px-2 py-1 border border-slate-200 rounded-md text-slate-700 text-xs font-mono bg-slate-50 focus:bg-white"
                      />
                    </div>
                  </div>

                  {/* Quick Scale Buttons */}
                  <div className="grid grid-cols-3 gap-1 mb-2">
                    <button
                      type="button"
                      onClick={() =>
                        onUpdateNode({
                          width: Math.max(60, Math.round(selectedNode.width * 0.8)),
                          height: Math.max(40, Math.round(selectedNode.height * 0.8)),
                        })
                      }
                      className="px-1.5 py-1 text-[10px] font-semibold bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded text-slate-600 transition-colors cursor-pointer flex items-center justify-center gap-1"
                      title="Shrink Node by 20%"
                    >
                      <ZoomOut size={10} />
                      <span>-20%</span>
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        onUpdateNode({
                          width: Math.min(800, Math.round(selectedNode.width * 1.25)),
                          height: Math.min(600, Math.round(selectedNode.height * 1.25)),
                        })
                      }
                      className="px-1.5 py-1 text-[10px] font-semibold bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded text-blue-700 transition-colors cursor-pointer flex items-center justify-center gap-1"
                      title="Enlarge Node by 25%"
                    >
                      <ZoomIn size={10} />
                      <span>+25%</span>
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        onUpdateNode({
                          width: Math.min(800, Math.round(selectedNode.width * 1.5)),
                          height: Math.min(600, Math.round(selectedNode.height * 1.5)),
                        })
                      }
                      className="px-1.5 py-1 text-[10px] font-semibold bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded text-indigo-700 transition-colors cursor-pointer flex items-center justify-center gap-1"
                      title="Enlarge Node by 50%"
                    >
                      <ZoomIn size={10} />
                      <span>+50%</span>
                    </button>
                  </div>

                  {/* Size Presets */}
                  <div className="flex items-center gap-1">
                    {[
                      { label: 'S (150×65)', w: 150, h: 65 },
                      { label: 'M (210×75)', w: 210, h: 75 },
                      { label: 'L (280×100)', w: 280, h: 100 },
                    ].map((preset) => (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => onUpdateNode({ width: preset.w, height: preset.h })}
                        className={`flex-1 py-0.5 text-[9.5px] rounded border transition-colors cursor-pointer ${
                          selectedNode.width === preset.w && selectedNode.height === preset.h
                            ? 'bg-blue-600 text-white border-blue-600 font-bold'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Layer Depth */}
                {onReorderNodes && (
                  <div className="pt-2 border-t border-slate-100">
                    <label className="block text-[10.5px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                      Z-Index Layer
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => onReorderNodes('bring-front')}
                        className="flex items-center justify-center gap-1.5 p-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-700 font-medium cursor-pointer"
                      >
                        <Layers size={13} />
                        <span>Bring to Front</span>
                      </button>
                      <button
                        onClick={() => onReorderNodes('send-back')}
                        className="flex items-center justify-center gap-1.5 p-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-700 font-medium cursor-pointer"
                      >
                        <Layers size={13} className="rotate-180" />
                        <span>Send to Back</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Lock Node */}
                <div className="pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between p-2 bg-slate-50 rounded-lg border border-slate-200">
                    <div>
                      <div className="font-semibold text-slate-800 text-xs">Lock Position</div>
                      <div className="text-[10px] text-slate-400">Prevent accidental moves & edits</div>
                    </div>
                    <button
                      onClick={() => onUpdateNode({ isLocked: !selectedNode.isLocked })}
                      className={`px-2.5 py-1 rounded-md font-semibold text-xs transition-colors cursor-pointer border ${
                        selectedNode.isLocked
                          ? 'bg-amber-600 text-white border-amber-600'
                          : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      {selectedNode.isLocked ? 'Locked' : 'Unlocked'}
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* TAB: COMMENTS */}
            {activeTab === 'comments' && (
              <div className="space-y-2.5">
                {onAddNodeComment && (
                  <form onSubmit={handlePostQuickComment} className="space-y-1.5">
                    <div className="flex items-center gap-1">
                      <input
                        type="text"
                        value={quickCommentText}
                        onChange={(e) => setQuickCommentText(e.target.value)}
                        placeholder="Add comment to this node..."
                        className="flex-1 px-2.5 py-1.5 border border-slate-200 rounded-lg text-[11px] focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-800"
                      />
                      <button
                        type="submit"
                        disabled={!quickCommentText.trim() || isPostingComment}
                        className="p-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 text-white disabled:text-slate-400 rounded-lg transition-colors cursor-pointer shrink-0"
                      >
                        {isPostingComment ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
                      </button>
                    </div>
                  </form>
                )}

                <div className="space-y-2 max-h-56 overflow-y-auto pr-0.5">
                  {commentsForThisNode.length === 0 ? (
                    <div className="p-3 bg-slate-50 border border-dashed border-slate-200 rounded-lg text-center text-[10px] text-slate-400">
                      No comments on this node yet
                    </div>
                  ) : (
                    commentsForThisNode.map((cmt) => (
                      <div
                        key={cmt.id}
                        className={`p-2 rounded-lg border text-[11px] space-y-1 transition-all ${
                          cmt.resolved
                            ? 'bg-emerald-50/30 border-emerald-200 text-slate-500'
                            : 'bg-white border-slate-200 text-slate-700 shadow-2xs'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1 text-[10px]">
                          <span className="font-semibold text-slate-800 truncate">{cmt.authorName}</span>
                          <div className="flex items-center gap-1">
                            {onToggleResolveComment && (
                              <button
                                type="button"
                                onClick={() => onToggleResolveComment(cmt.id, Boolean(cmt.resolved))}
                                className="p-0.5 text-slate-400 hover:text-emerald-600 cursor-pointer"
                              >
                                {cmt.resolved ? <CheckCircle2 size={12} className="text-emerald-600" /> : <Circle size={12} />}
                              </button>
                            )}
                            {onDeleteComment && (
                              <button
                                type="button"
                                onClick={() => onDeleteComment(cmt.id)}
                                className="p-0.5 text-slate-400 hover:text-rose-600 cursor-pointer"
                              >
                                <Trash2 size={11} />
                              </button>
                            )}
                          </div>
                        </div>
                        <p className="leading-snug break-words whitespace-pre-wrap">{cmt.content}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. EDGE CONNECTION INSPECTOR */}
      {!isMultiSelect && !selectedNode && selectedEdge && (
        <div className="p-4 space-y-4 flex-1 overflow-y-auto">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <div className="flex items-center gap-1.5 font-bold text-slate-800">
              <ArrowRight size={14} className="text-blue-600" />
              <span>Connection Line</span>
            </div>
            <button
              onClick={() => onDeleteEdge(selectedEdge.id)}
              className="p-1 hover:bg-rose-50 rounded text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
              title="Delete connection"
            >
              <Trash2 size={13} />
            </button>
          </div>

          <div>
            <label className="block text-[10.5px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Branch / Line Label
            </label>
            <input
              type="text"
              value={selectedEdge.label || ''}
              onChange={(e) => onUpdateEdge({ label: e.target.value })}
              className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1.5 focus:ring-blue-500 font-medium text-slate-800 text-xs"
              placeholder="e.g. Yes, No, 200 OK, Retry"
            />
          </div>

          <div>
            <label className="block text-[10.5px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Routing Style
            </label>
            <select
              value={selectedEdge.curveType || 'orthogonal'}
              onChange={(e) =>
                onUpdateEdge({
                  curveType: e.target.value as 'orthogonal' | 'smooth' | 'straight',
                })
              }
              className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1.5 focus:ring-blue-500 text-slate-700 bg-white cursor-pointer text-xs"
            >
              <option value="orthogonal">Orthogonal (Elbow / 90°)</option>
              <option value="smooth">Smooth (Bezier Curve)</option>
              <option value="straight">Straight Line</option>
            </select>
          </div>

          <div>
            <label className="block text-[10.5px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Line Pattern
            </label>
            <select
              value={selectedEdge.style || 'solid'}
              onChange={(e) =>
                onUpdateEdge({
                  style: e.target.value as 'solid' | 'dashed' | 'dotted',
                })
              }
              className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1.5 focus:ring-blue-500 text-slate-700 bg-white cursor-pointer text-xs"
            >
              <option value="solid">Solid Line</option>
              <option value="dashed">Dashed (Async / Fallback)</option>
              <option value="dotted">Dotted (Reference)</option>
            </select>
          </div>

          {/* Stroke Width */}
          <div>
            <label className="block text-[10.5px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              Stroke Width
            </label>
            <div className="flex items-center gap-1.5">
              {[1, 2, 3, 4, 5].map((w) => (
                <button
                  key={w}
                  onClick={() => onUpdateEdge({ strokeWidth: w })}
                  className={`w-7 h-7 rounded-md border text-xs font-bold transition-colors cursor-pointer ${
                    (selectedEdge.strokeWidth || 2) === w
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {w}px
                </button>
              ))}
            </div>
          </div>

          {/* Arrow Head */}
          <div>
            <label className="block text-[10.5px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              Arrowheads
            </label>
            <div className="grid grid-cols-3 gap-1">
              {(
                [
                  { id: 'end', label: 'End Arrow' },
                  { id: 'both', label: 'Both Ends' },
                  { id: 'none', label: 'None' },
                ] as const
              ).map((arr) => (
                <button
                  key={arr.id}
                  onClick={() => onUpdateEdge({ arrow: arr.id })}
                  className={`py-1 text-[11px] rounded border font-medium transition-colors cursor-pointer ${
                    (selectedEdge.arrow || 'end') === arr.id
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {arr.label}
                </button>
              ))}
            </div>
          </div>

          {/* Line Color */}
          <div>
            <label className="block text-[10.5px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              Line Color
            </label>
            <div className="grid grid-cols-5 gap-1.5">
              {PRESET_COLORS.map((col) => (
                <button
                  key={col.hex}
                  onClick={() => onUpdateEdge({ color: col.hex })}
                  className={`h-6 rounded-md border transition-transform cursor-pointer ${
                    selectedEdge.color === col.hex
                      ? 'ring-2 ring-blue-500 scale-105 border-transparent'
                      : 'border-slate-200 hover:scale-105'
                  }`}
                  style={{ backgroundColor: col.hex }}
                  title={col.name}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 4. CANVAS / DIAGRAM OVERVIEW (When nothing selected) */}
      {!isMultiSelect && !selectedNode && !selectedEdge && (
        <div className="p-4 space-y-4 flex-1 overflow-y-auto">
          <div className="flex items-center gap-1.5 font-bold text-slate-800 border-b border-slate-100 pb-2.5">
            <Sliders size={14} className="text-blue-600" />
            <span>Canvas & Document</span>
          </div>

          <div>
            <label className="block text-[10.5px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Diagram Title
            </label>
            <input
              type="text"
              value={diagramTitle}
              onChange={(e) => onUpdateDiagramInfo(e.target.value, diagramDescription)}
              className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1.5 focus:ring-blue-500 text-slate-800 font-semibold text-xs"
              placeholder="Flowchart Title"
            />
          </div>

          <div>
            <label className="block text-[10.5px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Description
            </label>
            <textarea
              rows={2}
              value={diagramDescription || ''}
              onChange={(e) => onUpdateDiagramInfo(diagramTitle, e.target.value)}
              className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1.5 focus:ring-blue-500 text-slate-600 resize-none text-xs"
              placeholder="Describe the workflow or architecture..."
            />
          </div>

          {/* Canvas Paper Color */}
          {onUpdateCanvasProps && (
            <div className="pt-2 border-t border-slate-100 space-y-2">
              <label className="block text-[10.5px] font-bold text-slate-500 uppercase tracking-wider">
                Canvas Paper Color
              </label>
              <div className="grid grid-cols-5 gap-1.5">
                {CANVAS_THEMES.map((th) => (
                  <button
                    key={th.hex}
                    onClick={() => onUpdateCanvasProps({ canvasBg: th.hex })}
                    className={`h-6 rounded-md border transition-transform cursor-pointer ${
                      canvasBg === th.hex
                        ? 'ring-2 ring-blue-500 scale-105 border-transparent'
                        : 'border-slate-300 hover:scale-105'
                    }`}
                    style={{ backgroundColor: th.hex }}
                    title={th.name}
                  />
                ))}
              </div>

              {/* Grid Mode */}
              <div className="flex items-center justify-between pt-1">
                <label className="text-[10.5px] font-bold text-slate-500 uppercase tracking-wider">
                  Grid Pattern
                </label>
                <div className="flex items-center gap-1 p-0.5 bg-slate-100 rounded-md">
                  {(['dots', 'lines', 'blueprint', 'none'] as const).map((g) => (
                    <button
                      key={g}
                      onClick={() => onUpdateCanvasProps({ gridType: g })}
                      className={`px-2 py-0.5 rounded text-[10.5px] capitalize font-medium transition-all cursor-pointer ${
                        gridType === g
                          ? 'bg-white text-slate-900 shadow-xs font-semibold'
                          : 'text-slate-500 hover:text-slate-900'
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>

              {/* Page View Mode */}
              <div className="flex items-center justify-between pt-1">
                <label className="text-[10.5px] font-bold text-slate-500 uppercase tracking-wider">
                  Print Page Border
                </label>
                <button
                  onClick={() => onUpdateCanvasProps({ pageView: !pageView })}
                  className={`px-2.5 py-0.5 rounded text-[10.5px] font-semibold border transition-all cursor-pointer ${
                    pageView
                      ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {pageView ? 'Active' : 'Off'}
                </button>
              </div>
            </div>
          )}

          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
            <div className="bg-slate-50/70 p-2.5 rounded-md border border-slate-200/90">
              <div className="text-[10px] text-slate-400 uppercase font-semibold">Total Nodes</div>
              <div className="text-base font-bold text-slate-900">{totalNodes}</div>
            </div>
            <div className="bg-slate-50/70 p-2.5 rounded-md border border-slate-200/90">
              <div className="text-[10px] text-slate-400 uppercase font-semibold">Connections</div>
              <div className="text-base font-bold text-slate-900">{totalEdges}</div>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};
