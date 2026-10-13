import React, { useState, useRef } from 'react';
import {
  Upload,
  Download,
  Sparkles,
  Undo2,
  Redo2,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Grid,
  FileCode,
  FileText,
  Image as ImageIcon,
  FolderOpen,
  Eye,
  LayoutGrid,
  ChevronDown,
  ChevronRight,
  Layers,
  Check,
  Copy,
  Cloud,
  Loader2,
  History,
  MessageSquare,
  LayoutDashboard,
  Home,
  Pencil,
  HelpCircle,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  ArrowUp,
  ArrowDown,
  MoveHorizontal,
  MoveVertical,
  FileInput,
  Box,
  Sliders,
  Compass,
  Camera,
} from 'lucide-react';
import { DiagramData } from '../types/flowchart';
import { SAMPLE_DIAGRAMS, SampleTemplate } from '../utils/samples';
import { AlignmentType, DistributionType } from '../utils/alignment';
import { AuthButton } from './AuthButton';

interface ToolbarProps {
  diagram: DiagramData;
  onUpdateTitle: (title: string) => void;
  onOpenUploadModal: (tab?: 'upload' | 'camera') => void;
  onOpenAIPromptModal: () => void;
  onAutoLayout: (direction: 'top-down' | 'left-right') => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomReset: () => void;
  onZoomFit: () => void;
  snapToGrid: boolean;
  onToggleSnapToGrid: () => void;
  onExportSvg: () => void;
  onExportPdf: () => void;
  onExportPng: () => void;
  onExportJson: () => void;
  onImportJson?: (data: DiagramData) => void;
  onCopySvg: () => void;
  hasOriginalImage: boolean;
  isCompareDrawerOpen: boolean;
  onToggleCompareDrawer: () => void;
  onLoadSample: (sample: SampleTemplate) => void;
  onSaveToCloud: () => void;
  isSavingToCloud: boolean;
  cloudSavedSuccess: boolean;
  onOpenCloudDrawer: () => void;
  onOpenVersionHistory?: () => void;
  onOpenCommentsDrawer?: () => void;
  commentsCount?: number;
  unresolvedCommentsCount?: number;
  savedDiagramsCount: number;
  onBackToDashboard?: () => void;
  onOpenKeyboardShortcuts?: () => void;
  selectedNodeIds?: string[];
  onAlignNodes?: (alignment: AlignmentType) => void;
  onDistributeNodes?: (distribution: DistributionType) => void;
  onReorderNodes?: (action: 'bring-front' | 'send-back') => void;
  isMobileOrTablet?: boolean;
  onToggleMobileSidebar?: () => void;
  onToggleMobileProperties?: () => void;
  mobileSidebarOpen?: boolean;
  mobilePropertiesOpen?: boolean;
  onToggleStudioMode?: (mode: 'flowchart' | 'architecture') => void;
  onGoToOmegaCad?: () => void;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  diagram,
  onUpdateTitle,
  onOpenUploadModal,
  onOpenAIPromptModal,
  onAutoLayout,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  zoom,
  onZoomIn,
  onZoomOut,
  onZoomReset,
  onZoomFit,
  snapToGrid,
  onToggleSnapToGrid,
  onExportSvg,
  onExportPdf,
  onExportPng,
  onExportJson,
  onImportJson,
  onCopySvg,
  hasOriginalImage,
  isCompareDrawerOpen,
  onToggleCompareDrawer,
  onLoadSample,
  onSaveToCloud,
  isSavingToCloud,
  cloudSavedSuccess,
  onOpenCloudDrawer,
  onOpenVersionHistory,
  onOpenCommentsDrawer,
  commentsCount = 0,
  unresolvedCommentsCount = 0,
  savedDiagramsCount,
  onBackToDashboard,
  onOpenKeyboardShortcuts,
  selectedNodeIds = [],
  onAlignNodes,
  onDistributeNodes,
  onReorderNodes,
  isMobileOrTablet = false,
  onToggleMobileSidebar,
  onToggleMobileProperties,
  mobileSidebarOpen = false,
  mobilePropertiesOpen = false,
  onToggleStudioMode,
  onGoToOmegaCad,
}) => {
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isSamplesOpen, setIsSamplesOpen] = useState(false);
  const [isLayoutOpen, setIsLayoutOpen] = useState(false);
  const [isArrangeOpen, setIsArrangeOpen] = useState(false);
  const [isNavMenuOpen, setIsNavMenuOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCopySvg = () => {
    onCopySvg();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !onImportJson) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text) as DiagramData;
        if (parsed && Array.isArray(parsed.nodes)) {
          onImportJson(parsed);
        }
      } catch (err) {
        console.error('Failed to parse diagram JSON:', err);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <header className="h-14 border-b border-slate-200/90 bg-white/95 backdrop-blur-md px-3 sm:px-4 flex items-center justify-between select-none z-30 shadow-[0_1px_2px_rgba(0,0,0,0.03)] gap-3">
      {/* Zone 1: Professional Breadcrumb Navigation & Document Title */}
      <div className="flex items-center gap-2 sm:gap-2.5 shrink-0 min-w-0">
        {/* App Switcher Menu */}
        <div className="relative">
          <button
            onClick={() => setIsNavMenuOpen(!isNavMenuOpen)}
            className="flex items-center gap-1.5 p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer group"
            title="Flowcraft Studio Navigation"
          >
            <img
              src="/flowify.png"
              alt="Flowlify"
              className="w-7 h-7 rounded-lg object-contain shadow-xs border border-slate-200"
            />
            <ChevronDown size={11} className="text-slate-400 group-hover:text-slate-700 transition-colors hidden sm:block" />
          </button>

          {isNavMenuOpen && (
            <div
              className="absolute left-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 text-xs animate-in fade-in zoom-in-95 duration-100"
              onClick={() => setIsNavMenuOpen(false)}
            >
              <div className="px-3 py-1 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Workspace Navigation
              </div>
              {onBackToDashboard && (
                <button
                  onClick={onBackToDashboard}
                  className="w-full text-left px-3 py-2 hover:bg-slate-50 text-slate-700 hover:text-blue-600 flex items-center gap-2.5 transition-colors cursor-pointer"
                >
                  <LayoutDashboard size={14} className="text-blue-600" />
                  <div>
                    <span className="font-semibold block text-slate-900">Workspace Dashboard</span>
                    <span className="text-[10px] text-slate-400">View all diagrams & templates</span>
                  </div>
                </button>
              )}
              <button
                onClick={onOpenCloudDrawer}
                className="w-full text-left px-3 py-2 hover:bg-slate-50 text-slate-700 flex items-center gap-2.5 transition-colors cursor-pointer"
              >
                <FolderOpen size={14} className="text-indigo-600" />
                <div className="flex items-center justify-between flex-1">
                  <div>
                    <span className="font-semibold block text-slate-900">Cloud Flowcharts</span>
                    <span className="text-[10px] text-slate-400">Saved in cloud workspace</span>
                  </div>
                  {savedDiagramsCount > 0 && (
                    <span className="text-[10px] bg-slate-100 text-slate-600 font-bold px-1.5 py-0.5 rounded-md">
                      {savedDiagramsCount}
                    </span>
                  )}
                </div>
              </button>
              <div className="border-t border-slate-100 my-1" />
              <button
                onClick={() => onOpenUploadModal('upload')}
                className="w-full text-left px-3 py-1.5 hover:bg-slate-50 text-slate-700 flex items-center gap-2.5 transition-colors cursor-pointer"
              >
                <Upload size={13} className="text-slate-500" />
                <span>Upload Diagram Image</span>
              </button>
            </div>
          )}
        </div>

        {/* Breadcrumb Separator */}
        <ChevronRight size={13} className="text-slate-300 shrink-0" />

        {/* Clickable Workspace Breadcrumb */}
        {onBackToDashboard ? (
          <button
            onClick={onBackToDashboard}
            className="hidden sm:flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors cursor-pointer hover:bg-slate-100/80 px-2 py-1 rounded-md"
            title="Navigate to Workspace Dashboard"
          >
            <span>Workspace</span>
          </button>
        ) : (
          <span className="hidden sm:inline text-xs font-medium text-slate-400">
            Workspace
          </span>
        )}

        <ChevronRight size={13} className="text-slate-300 shrink-0 hidden sm:block" />

        {/* Editable Diagram Title & Inline Edit Indicator */}
        <div className="flex items-center gap-2 min-w-0">
          <div className="relative flex items-center group">
            <input
              type="text"
              value={diagram.title}
              onChange={(e) => onUpdateTitle(e.target.value)}
              className="font-semibold text-xs sm:text-sm text-slate-900 bg-transparent hover:bg-slate-100/70 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-slate-300 rounded-lg px-2 py-1 border border-transparent w-20 xs:w-28 sm:w-44 md:w-56 truncate transition-all"
              placeholder="Untitled Flowchart"
              title="Click to rename flowchart"
            />
            <Pencil size={11} className="text-slate-300 group-hover:text-slate-500 absolute right-2 pointer-events-none transition-colors opacity-0 group-hover:opacity-100 hidden md:block" />
          </div>

          {/* Real-time Cloud Sync Quiet Status (Anti-Slop Clean Typography) */}
          <div className="hidden lg:flex items-center text-xs">
            {isSavingToCloud ? (
              <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-blue-600">
                <Loader2 size={11} className="animate-spin text-blue-600" />
                <span>Saving...</span>
              </span>
            ) : cloudSavedSuccess ? (
              <button
                onClick={onOpenCloudDrawer}
                className="inline-flex items-center gap-1.5 text-[11px] font-medium text-slate-500 hover:text-slate-800 transition-colors cursor-pointer group"
                title="Synced to cloud. Click to view versions."
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 ring-2 ring-emerald-100" />
                <span className="text-slate-500 group-hover:text-slate-700">Saved</span>
              </button>
            ) : (
              <button
                onClick={onSaveToCloud}
                className="inline-flex items-center gap-1.5 text-[11px] font-medium text-slate-500 hover:text-blue-600 px-2 py-0.5 rounded-md hover:bg-slate-100 transition-colors cursor-pointer"
                title="Save flowchart to Cloud (Ctrl+S)"
              >
                <Cloud size={12} className="text-slate-400" />
                <span>Save to Cloud</span>
              </button>
            )}

            {/* Studio Mode Switcher: Flowchart vs Architecture CAD */}
            {onToggleStudioMode && (
              <div className="flex items-center p-0.5 bg-slate-100 rounded-lg border border-slate-200/90 ml-1.5">
                <button
                  type="button"
                  onClick={() => onToggleStudioMode('flowchart')}
                  className={`px-2 py-0.5 text-[10.5px] font-semibold rounded-md transition-all cursor-pointer ${
                    diagram.studioMode !== 'architecture'
                      ? 'bg-white text-blue-700 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                  title="Logic & System Flowcharts"
                >
                  Flowchart
                </button>
                <button
                  type="button"
                  onClick={() => onToggleStudioMode('architecture')}
                  className={`px-2 py-0.5 text-[10.5px] font-semibold rounded-md transition-all cursor-pointer flex items-center gap-1 ${
                    diagram.studioMode === 'architecture'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                  title="Civil, 2D Floor Plans & CAD Blueprints"
                >
                  <Compass size={11} className={diagram.studioMode === 'architecture' ? 'text-amber-300' : 'text-slate-400'} />
                  <span>Architecture</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Zone 2: Creation & Collaboration Action Bar */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Mobile / Tablet Drawer Buttons */}
        {isMobileOrTablet && (
          <div className="flex items-center gap-1">
            {onToggleMobileSidebar && (
              <button
                onClick={onToggleMobileSidebar}
                className={`flex items-center gap-1 text-xs font-semibold px-2 py-1.5 rounded-lg border transition-all cursor-pointer ${
                  mobileSidebarOpen
                    ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                    : 'bg-white text-slate-700 hover:text-slate-900 border-slate-200 hover:bg-slate-50'
                }`}
                title="Shapes Library"
              >
                <Box size={13} className={mobileSidebarOpen ? 'text-white' : 'text-blue-600'} />
                <span className="hidden sm:inline">Shapes</span>
              </button>
            )}
            {onToggleMobileProperties && (
              <button
                onClick={onToggleMobileProperties}
                className={`flex items-center gap-1 text-xs font-semibold px-2 py-1.5 rounded-lg border transition-all cursor-pointer ${
                  mobilePropertiesOpen
                    ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                    : 'bg-white text-slate-700 hover:text-slate-900 border-slate-200 hover:bg-slate-50'
                }`}
                title="Inspector / Properties"
              >
                <Sliders size={13} className={mobilePropertiesOpen ? 'text-white' : 'text-blue-600'} />
                <span className="hidden sm:inline">Inspector</span>
              </button>
            )}
          </div>
        )}

        {/* Creation Tools Segmented Control */}
        <div className="flex items-center bg-slate-100/80 p-0.5 rounded-lg border border-slate-200/80 shadow-[inset_0_1px_1px_rgba(0,0,0,0.02)]">
          {/* Upload Image / Sketch */}
          <button
            onClick={() => onOpenUploadModal('upload')}
            className={`flex items-center gap-1.5 bg-white hover:bg-slate-50 text-slate-800 text-xs font-semibold px-2.5 sm:px-3 py-1.5 rounded-md shadow-xs border transition-all cursor-pointer ${
              diagram.studioMode === 'architecture'
                ? 'border-cyan-300 text-cyan-900 hover:border-cyan-400 bg-cyan-50/40'
                : 'border-slate-200/90 hover:border-slate-300'
            }`}
            title={
              diagram.studioMode === 'architecture'
                ? 'Scan floor plan sketch, paper blueprint or civil CAD drawing'
                : 'Upload photo, whiteboard sketch or architecture diagram'
            }
          >
            {diagram.studioMode === 'architecture' ? (
              <Compass size={13} className="text-cyan-600 stroke-[2.2]" />
            ) : (
              <Upload size={13} className="text-blue-600 stroke-[2.2]" />
            )}
            <span className="hidden sm:inline">
              {diagram.studioMode === 'architecture' ? 'Scan Blueprint' : 'Upload Sketch'}
            </span>
            <span className="sm:hidden">
              {diagram.studioMode === 'architecture' ? 'Scan' : 'Upload'}
            </span>
          </button>

          {/* Quick Camera Snap Rough Sketch Button */}
          <button
            onClick={() => onOpenUploadModal('camera')}
            className="flex items-center gap-1.5 text-slate-700 hover:text-slate-900 hover:bg-white text-xs font-medium px-2 py-1.5 rounded-md transition-all cursor-pointer"
            title="Snap a photo of your paper sketch or whiteboard with camera"
          >
            <Camera size={13} className="text-amber-500" />
            <span className="hidden sm:inline">Camera</span>
          </button>

          {/* AI Prompt Architect */}
          <button
            onClick={onOpenAIPromptModal}
            className="hidden md:flex items-center gap-1.5 text-slate-700 hover:text-slate-900 hover:bg-white text-xs font-medium px-2.5 py-1.5 rounded-md transition-all cursor-pointer"
            title="Generate flows using visual prompt architect"
          >
            <Sparkles size={13} className="text-indigo-600" />
            <span>AI Prompt</span>
          </button>

          {/* OmegaCAD Plus CAD Studio Switcher */}
          {onGoToOmegaCad && (
            <button
              onClick={onGoToOmegaCad}
              className="hidden lg:flex items-center gap-1.5 text-cyan-900 hover:text-cyan-950 bg-cyan-50/80 hover:bg-cyan-100 text-xs font-semibold px-2.5 py-1.5 rounded-md border border-cyan-200/80 transition-all cursor-pointer shadow-2xs group"
              title="Open OmegaCAD Plus 2D CAD & Architectural Studio"
            >
              <Compass size={13} className="text-cyan-600 group-hover:rotate-45 transition-transform" />
              <span>OmegaCAD Plus</span>
            </button>
          )}

          {/* Template Gallery Dropdown */}
          <div className="relative hidden xl:block">
            <button
              onClick={() => {
                setIsSamplesOpen(!isSamplesOpen);
                setIsExportOpen(false);
                setIsLayoutOpen(false);
              }}
              className="flex items-center gap-1.5 text-xs font-medium text-slate-700 hover:text-slate-900 hover:bg-white px-2.5 py-1.5 rounded-lg transition-all cursor-pointer"
            >
              <Layers size={13} className="text-slate-500" />
              <span>Templates</span>
              <ChevronDown size={11} className="text-slate-400" />
            </button>

            {isSamplesOpen && (
              <div
                className="absolute left-0 mt-1.5 w-64 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 text-xs animate-in fade-in zoom-in-95 duration-100"
                onClick={() => setIsSamplesOpen(false)}
              >
                <div className="px-3 py-1 font-semibold text-slate-400 text-[10px] uppercase tracking-wider">
                  Preset Flows & Sketches
                </div>
                {SAMPLE_DIAGRAMS.map((sample) => (
                  <button
                    key={sample.id}
                    onClick={() => onLoadSample(sample)}
                    className="w-full text-left px-3 py-2 hover:bg-blue-50 text-slate-700 hover:text-blue-700 flex flex-col gap-0.5 transition-colors cursor-pointer"
                  >
                    <span className="font-semibold text-slate-800">{sample.title}</span>
                    <span className="text-[10px] text-slate-500 line-clamp-1">
                      {sample.description}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Collaboration Tools Divider */}
        <div className="h-5 w-px bg-slate-200/80 mx-0.5 hidden sm:block" />

        {/* Node Collaboration Comments Trigger */}
        {onOpenCommentsDrawer && (
          <button
            onClick={onOpenCommentsDrawer}
            className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-md border transition-all cursor-pointer ${
              commentsCount > 0
                ? 'bg-blue-50/80 text-blue-700 border-blue-200 hover:bg-blue-100/80'
                : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200/90'
            }`}
            title="Collaborate with node comments"
          >
            <MessageSquare size={13} className="text-blue-600" />
            <span className="hidden md:inline">Comments</span>
            {commentsCount > 0 && (
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  unresolvedCommentsCount > 0
                    ? 'bg-amber-500 text-white'
                    : 'bg-blue-600 text-white'
                }`}
              >
                {commentsCount}
              </span>
            )}
          </button>
        )}

        {/* Version History Drawer Trigger */}
        {onOpenVersionHistory && (
          <button
            onClick={onOpenVersionHistory}
            className="hidden sm:flex items-center gap-1.5 text-xs font-medium bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/90 px-2.5 py-1.5 rounded-md transition-colors cursor-pointer shadow-xs"
            title="View saved versions & restore history"
          >
            <History size={13} className="text-slate-600" />
            <span className="hidden lg:inline">Versions</span>
          </button>
        )}

        {/* Compare with Original Uploaded Image */}
        {hasOriginalImage && (
          <button
            onClick={onToggleCompareDrawer}
            className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-md border transition-all cursor-pointer ${
              isCompareDrawerOpen
                ? 'bg-blue-50 text-blue-700 border-blue-300'
                : 'bg-white text-slate-700 hover:text-slate-900 border-slate-200 hover:bg-slate-50'
            }`}
            title="View original uploaded sketch side-by-side"
          >
            <Eye size={13} className="text-blue-600" />
            <span className="hidden xl:inline">Sketch</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          </button>
        )}
      </div>

      {/* Zone 3: Canvas Utilities, Unified Export & User Account */}
      <div className="flex items-center gap-1.5 shrink-0">
        {/* Undo / Redo */}
        <div className="hidden sm:flex items-center bg-slate-100/90 rounded-lg p-0.5 border border-slate-200/80">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className={`p-1.5 rounded-md hover:bg-white text-slate-700 disabled:opacity-30 disabled:hover:bg-transparent transition-all ${
              canUndo ? 'cursor-pointer hover:shadow-2xs' : 'cursor-not-allowed'
            }`}
            title="Undo (Ctrl+Z)"
          >
            <Undo2 size={13} />
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            className={`p-1.5 rounded-md hover:bg-white text-slate-700 disabled:opacity-30 disabled:hover:bg-transparent transition-all ${
              canRedo ? 'cursor-pointer hover:shadow-2xs' : 'cursor-not-allowed'
            }`}
            title="Redo (Ctrl+Y)"
          >
            <Redo2 size={13} />
          </button>
        </div>

        {/* Auto Layout Menu */}
        <div className="relative hidden md:block">
          <button
            onClick={() => {
              setIsLayoutOpen(!isLayoutOpen);
              setIsArrangeOpen(false);
              setIsExportOpen(false);
              setIsSamplesOpen(false);
            }}
            className="flex items-center gap-1 p-1.5 text-xs text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer border border-transparent hover:border-slate-200"
            title="Auto-organize layout"
          >
            <LayoutGrid size={14} />
            <ChevronDown size={10} className="text-slate-400" />
          </button>

          {isLayoutOpen && (
            <div
              className="absolute right-0 mt-1.5 w-44 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 text-xs animate-in fade-in zoom-in-95 duration-100"
              onClick={() => setIsLayoutOpen(false)}
            >
              <div className="px-3 py-1 font-semibold text-slate-400 text-[10px] uppercase">
                Auto-Align Nodes
              </div>
              <button
                onClick={() => onAutoLayout('top-down')}
                className="w-full text-left px-3 py-1.5 hover:bg-slate-50 text-slate-700 flex items-center justify-between cursor-pointer"
              >
                <span>Top-to-Bottom Flow</span>
                <span className="text-[10px] text-slate-400">Vertical</span>
              </button>
              <button
                onClick={() => onAutoLayout('left-right')}
                className="w-full text-left px-3 py-1.5 hover:bg-slate-50 text-slate-700 flex items-center justify-between cursor-pointer"
              >
                <span>Left-to-Right Flow</span>
                <span className="text-[10px] text-slate-400">Horizontal</span>
              </button>
            </div>
          )}
        </div>

        {/* Arrange Dropdown (Draw.io style alignment & distribution) */}
        {selectedNodeIds.length > 0 && onAlignNodes && (
          <div className="relative hidden lg:block">
            <button
              onClick={() => {
                setIsArrangeOpen(!isArrangeOpen);
                setIsLayoutOpen(false);
                setIsExportOpen(false);
                setIsSamplesOpen(false);
              }}
              className="flex items-center gap-1.5 px-2 py-1 text-xs font-semibold text-blue-700 bg-blue-50/80 hover:bg-blue-100/80 border border-blue-200 rounded-lg transition-colors cursor-pointer"
              title="Arrange & Align Selected Nodes"
            >
              <AlignLeft size={13} />
              <span>Arrange ({selectedNodeIds.length})</span>
              <ChevronDown size={10} className="text-blue-500" />
            </button>

            {isArrangeOpen && (
              <div
                className="absolute right-0 mt-1.5 w-52 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 text-xs animate-in fade-in zoom-in-95 duration-100"
                onClick={() => setIsArrangeOpen(false)}
              >
                <div className="px-3 py-1 font-semibold text-slate-400 text-[10px] uppercase tracking-wider">
                  Alignment
                </div>
                <button
                  onClick={() => onAlignNodes('align-left')}
                  className="w-full text-left px-3 py-1.5 hover:bg-slate-50 text-slate-700 flex items-center gap-2 cursor-pointer"
                >
                  <AlignLeft size={13} />
                  <span>Align Left</span>
                </button>
                <button
                  onClick={() => onAlignNodes('align-center')}
                  className="w-full text-left px-3 py-1.5 hover:bg-slate-50 text-slate-700 flex items-center gap-2 cursor-pointer"
                >
                  <AlignCenter size={13} />
                  <span>Align Center</span>
                </button>
                <button
                  onClick={() => onAlignNodes('align-right')}
                  className="w-full text-left px-3 py-1.5 hover:bg-slate-50 text-slate-700 flex items-center gap-2 cursor-pointer"
                >
                  <AlignRight size={13} />
                  <span>Align Right</span>
                </button>
                <button
                  onClick={() => onAlignNodes('align-top')}
                  className="w-full text-left px-3 py-1.5 hover:bg-slate-50 text-slate-700 flex items-center gap-2 cursor-pointer"
                >
                  <ArrowUp size={13} />
                  <span>Align Top</span>
                </button>
                <button
                  onClick={() => onAlignNodes('align-middle')}
                  className="w-full text-left px-3 py-1.5 hover:bg-slate-50 text-slate-700 flex items-center gap-2 cursor-pointer"
                >
                  <AlignJustify size={13} />
                  <span>Align Middle</span>
                </button>
                <button
                  onClick={() => onAlignNodes('align-bottom')}
                  className="w-full text-left px-3 py-1.5 hover:bg-slate-50 text-slate-700 flex items-center gap-2 cursor-pointer"
                >
                  <ArrowDown size={13} />
                  <span>Align Bottom</span>
                </button>

                {onDistributeNodes && selectedNodeIds.length > 2 && (
                  <>
                    <div className="border-t border-slate-100 my-1" />
                    <div className="px-3 py-1 font-semibold text-slate-400 text-[10px] uppercase tracking-wider">
                      Distribute Spacing
                    </div>
                    <button
                      onClick={() => onDistributeNodes('distribute-horizontal')}
                      className="w-full text-left px-3 py-1.5 hover:bg-slate-50 text-slate-700 flex items-center gap-2 cursor-pointer"
                    >
                      <MoveHorizontal size={13} />
                      <span>Distribute Horizontally</span>
                    </button>
                    <button
                      onClick={() => onDistributeNodes('distribute-vertical')}
                      className="w-full text-left px-3 py-1.5 hover:bg-slate-50 text-slate-700 flex items-center gap-2 cursor-pointer"
                    >
                      <MoveVertical size={13} />
                      <span>Distribute Vertically</span>
                    </button>
                  </>
                )}

                {onReorderNodes && (
                  <>
                    <div className="border-t border-slate-100 my-1" />
                    <div className="px-3 py-1 font-semibold text-slate-400 text-[10px] uppercase tracking-wider">
                      Layer Ordering
                    </div>
                    <button
                      onClick={() => onReorderNodes('bring-front')}
                      className="w-full text-left px-3 py-1.5 hover:bg-slate-50 text-slate-700 flex items-center gap-2 cursor-pointer"
                    >
                      <Layers size={13} />
                      <span>Bring to Front</span>
                    </button>
                    <button
                      onClick={() => onReorderNodes('send-back')}
                      className="w-full text-left px-3 py-1.5 hover:bg-slate-50 text-slate-700 flex items-center gap-2 cursor-pointer"
                    >
                      <Layers size={13} className="rotate-180" />
                      <span>Send to Back</span>
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {/* Grid Snap Toggle */}
        <button
          onClick={onToggleSnapToGrid}
          className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer hidden sm:block ${
            snapToGrid
              ? 'bg-blue-50 text-blue-600 border border-blue-200'
              : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100 border border-transparent'
          }`}
          title={snapToGrid ? 'Snap to grid: Enabled' : 'Snap to grid: Disabled'}
        >
          <Grid size={14} />
        </button>

        {/* Zoom Controls Stepper */}
        <div className="hidden xl:flex items-center bg-slate-100/90 rounded-lg p-0.5 border border-slate-200/80">
          <button
            onClick={onZoomOut}
            className="p-1 rounded-md hover:bg-white text-slate-600 transition-colors cursor-pointer hover:shadow-2xs"
            title="Zoom out"
          >
            <ZoomOut size={12} />
          </button>
          <button
            onClick={onZoomReset}
            className="px-1.5 text-[11px] font-semibold text-slate-700 hover:bg-white rounded-md transition-colors cursor-pointer hover:shadow-2xs"
            title="Reset zoom to 100%"
          >
            {Math.round(zoom * 100)}%
          </button>
          <button
            onClick={onZoomIn}
            className="p-1 rounded-md hover:bg-white text-slate-600 transition-colors cursor-pointer hover:shadow-2xs"
            title="Zoom in"
          >
            <ZoomIn size={12} />
          </button>
          <button
            onClick={onZoomFit}
            className="p-1 rounded-md hover:bg-white text-slate-600 transition-colors cursor-pointer hover:shadow-2xs"
            title="Fit diagram to screen"
          >
            <Maximize2 size={12} />
          </button>
        </div>

        {/* Unified Export Menu Button */}
        <div className="relative">
          <button
            onClick={() => {
              setIsExportOpen(!isExportOpen);
              setIsSamplesOpen(false);
              setIsLayoutOpen(false);
            }}
            className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold px-2.5 sm:px-3 py-1.5 rounded-lg shadow-sm hover:shadow transition-all cursor-pointer"
          >
            <Download size={13} />
            <span className="hidden sm:inline">Export</span>
            <ChevronDown size={11} className="text-slate-300" />
          </button>

          {isExportOpen && (
            <div
              className="absolute right-0 mt-1.5 w-60 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 text-xs animate-in fade-in zoom-in-95 duration-100"
              onClick={() => setIsExportOpen(false)}
            >
              <div className="px-3 py-1 font-semibold text-slate-400 text-[10px] uppercase tracking-wider">
                Export Flowchart
              </div>

              {/* Vector SVG */}
              <button
                onClick={onExportSvg}
                className="w-full text-left px-3 py-2 hover:bg-blue-50 text-slate-700 hover:text-blue-700 flex items-center gap-2.5 transition-colors cursor-pointer"
              >
                <div className="w-6 h-6 rounded bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-[10px]">
                  SVG
                </div>
                <div className="flex flex-col">
                  <span className="font-semibold text-slate-800">Export as SVG</span>
                  <span className="text-[10px] text-slate-500">
                    Clean vector format for web & editing
                  </span>
                </div>
              </button>

              {/* Vector PDF */}
              <button
                onClick={onExportPdf}
                className="w-full text-left px-3 py-2 hover:bg-rose-50 text-slate-700 hover:text-rose-700 flex items-center gap-2.5 transition-colors cursor-pointer"
              >
                <div className="w-6 h-6 rounded bg-rose-100 text-rose-700 flex items-center justify-center font-bold text-[10px]">
                  PDF
                </div>
                <div className="flex flex-col">
                  <span className="font-semibold text-slate-800">Export as PDF</span>
                  <span className="text-[10px] text-slate-500">
                    Print-ready document with high DPI
                  </span>
                </div>
              </button>

              {/* High-res PNG */}
              <button
                onClick={onExportPng}
                className="w-full text-left px-3 py-2 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 flex items-center gap-2.5 transition-colors cursor-pointer"
              >
                <div className="w-6 h-6 rounded bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-[10px]">
                  PNG
                </div>
                <div className="flex flex-col">
                  <span className="font-semibold text-slate-800">Export as PNG</span>
                  <span className="text-[10px] text-slate-500">
                    High resolution image snapshot
                  </span>
                </div>
              </button>

              <div className="border-t border-slate-100 my-1" />

              {/* Copy SVG markup */}
              <button
                onClick={handleCopySvg}
                className="w-full text-left px-3 py-1.5 hover:bg-slate-50 text-slate-700 flex items-center gap-2 transition-colors cursor-pointer"
              >
                {copied ? (
                  <Check size={13} className="text-emerald-600" />
                ) : (
                  <Copy size={13} className="text-slate-400" />
                )}
                <span>{copied ? 'SVG Copied!' : 'Copy SVG Markup'}</span>
              </button>

              {/* Save JSON state */}
              <button
                onClick={onExportJson}
                className="w-full text-left px-3 py-1.5 hover:bg-slate-50 text-slate-700 flex items-center gap-2 transition-colors cursor-pointer"
              >
                <FileCode size={13} className="text-slate-400" />
                <span>Save Project (JSON)</span>
              </button>

              {/* Import JSON state */}
              {onImportJson && (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full text-left px-3 py-1.5 hover:bg-blue-50 text-slate-700 hover:text-blue-700 flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <FileInput size={13} className="text-blue-500" />
                  <span>Open Diagram File (.json)</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Hidden File Input for Importing Diagram JSON */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".json,application/json"
          onChange={handleFileImport}
          className="hidden"
        />

        {/* Keyboard Shortcuts Help Button ('?' Icon) */}
        <button
          onClick={onOpenKeyboardShortcuts}
          className="flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 border border-slate-200/80 hover:border-slate-300 transition-all cursor-pointer shadow-2xs group"
          title="Keyboard Shortcuts (?)"
          aria-label="Keyboard Shortcuts"
        >
          <HelpCircle size={15} className="group-hover:scale-110 text-slate-500 group-hover:text-blue-600 transition-all" />
        </button>

        {/* User Account / Auth */}
        <div className="border-l border-slate-200/80 pl-1.5 sm:pl-2 ml-0.5">
          <AuthButton />
        </div>
      </div>
    </header>
  );
};

