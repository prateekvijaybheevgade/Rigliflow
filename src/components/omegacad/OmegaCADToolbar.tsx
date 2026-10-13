import React, { useState } from 'react';
import {
  Compass,
  Download,
  Sparkles,
  Undo2,
  Redo2,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Layers,
  FileCode,
  FileText,
  ChevronDown,
  LayoutDashboard,
  Home,
  Sliders,
  Grid,
  Lock,
  Eye,
  Check,
  Building2,
  Upload,
} from 'lucide-react';
import { CadDrawing, CadScale, CadUnit } from '../../types/omegacad';
import { downloadDxf } from '../../utils/dxfExport';

interface OmegaCADToolbarProps {
  drawing: CadDrawing;
  onUpdateDrawing: (updater: (prev: CadDrawing) => CadDrawing) => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomReset: () => void;
  onZoomFit: () => void;
  orthoMode: boolean;
  onToggleOrtho: () => void;
  onOpenScanModal: () => void;
  onToggleLayerPanel: () => void;
  isLayerPanelOpen: boolean;
  onBackToDashboard: () => void;
  onBackToHome: () => void;
}

export const OmegaCADToolbar: React.FC<OmegaCADToolbarProps> = ({
  drawing,
  onUpdateDrawing,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  zoom,
  onZoomIn,
  onZoomOut,
  onZoomReset,
  onZoomFit,
  orthoMode,
  onToggleOrtho,
  onOpenScanModal,
  onToggleLayerPanel,
  isLayerPanelOpen,
  onBackToDashboard,
  onBackToHome,
}) => {
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState(drawing.title);

  const handleTitleSubmit = () => {
    setIsEditingTitle(false);
    if (titleInput.trim()) {
      onUpdateDrawing((prev) => ({ ...prev, title: titleInput.trim() }));
    } else {
      setTitleInput(drawing.title);
    }
  };

  const handleExportDxf = () => {
    setIsExportOpen(false);
    downloadDxf(drawing);
  };

  return (
    <header className="h-14 bg-slate-950 border-b border-slate-800 text-slate-200 px-4 flex items-center justify-between gap-3 select-none z-30 shrink-0">
      {/* 1. BRAND & NAVIGATION */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-cyan-950 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-sm shadow-cyan-950">
            <Compass size={18} />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-sm tracking-tight text-white">
                OmegaCAD <span className="text-cyan-400">Plus</span>
              </span>
              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-cyan-900/60 text-cyan-300 border border-cyan-500/30">
                PRO 15.0
              </span>
            </div>
            <span className="text-[10px] text-slate-400 -mt-0.5 font-mono">
              2D Civil & Architectural Drafting Engine
            </span>
          </div>
        </div>

        <div className="h-5 w-px bg-slate-800 mx-1 hidden sm:block" />

        {/* Home & Dashboard Quick Switch */}
        <div className="hidden sm:flex items-center gap-1">
          <button
            onClick={onBackToHome}
            className="p-1.5 rounded-md hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
            title="Return to Flowlify Home"
          >
            <Home size={15} />
          </button>
          <button
            onClick={onBackToDashboard}
            className="p-1.5 rounded-md hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer flex items-center gap-1 text-xs"
            title="Workspace Dashboard"
          >
            <LayoutDashboard size={15} />
            <span className="text-[11px] hidden md:inline">Dashboard</span>
          </button>
        </div>
      </div>

      {/* 2. DRAWING TITLE & SCALE CONTROLS */}
      <div className="flex items-center gap-2 min-w-0 max-w-xs md:max-w-md">
        {isEditingTitle ? (
          <input
            type="text"
            value={titleInput}
            onChange={(e) => setTitleInput(e.target.value)}
            onBlur={handleTitleSubmit}
            onKeyDown={(e) => e.key === 'Enter' && handleTitleSubmit()}
            autoFocus
            className="bg-slate-900 border border-cyan-500/50 rounded px-2 py-0.5 text-xs text-white focus:outline-none w-48 font-medium"
          />
        ) : (
          <button
            onClick={() => {
              setTitleInput(drawing.title);
              setIsEditingTitle(true);
            }}
            className="text-xs font-semibold text-slate-200 hover:text-cyan-400 px-2 py-1 rounded hover:bg-slate-900 truncate transition-colors text-left cursor-pointer"
            title="Click to rename blueprint"
          >
            {drawing.title}
          </button>
        )}

        {/* Scale Picker */}
        <div className="hidden lg:flex items-center gap-1 bg-slate-900 px-2 py-1 rounded-md border border-slate-800 text-[11px]">
          <span className="text-slate-400 font-mono text-[10px]">SCALE:</span>
          <select
            value={drawing.scale}
            onChange={(e) =>
              onUpdateDrawing((prev) => ({
                ...prev,
                scale: e.target.value as CadScale,
              }))
            }
            className="bg-transparent text-cyan-300 font-semibold focus:outline-none cursor-pointer"
          >
            <option value="1:20" className="bg-slate-900 text-white">1:20 (Detail)</option>
            <option value="1:50" className="bg-slate-900 text-white">1:50 (Standard)</option>
            <option value="1:100" className="bg-slate-900 text-white">1:100 (Site)</option>
            <option value="1:200" className="bg-slate-900 text-white">1:200 (Master)</option>
          </select>
        </div>

        {/* Units Picker */}
        <div className="hidden xl:flex items-center gap-1 bg-slate-900 px-2 py-1 rounded-md border border-slate-800 text-[11px]">
          <span className="text-slate-400 font-mono text-[10px]">UNITS:</span>
          <select
            value={drawing.unit}
            onChange={(e) =>
              onUpdateDrawing((prev) => ({
                ...prev,
                unit: e.target.value as CadUnit,
              }))
            }
            className="bg-transparent text-slate-200 font-semibold focus:outline-none cursor-pointer"
          >
            <option value="mm" className="bg-slate-900 text-white">Millimeters (mm)</option>
            <option value="m" className="bg-slate-900 text-white">Meters (m)</option>
            <option value="in" className="bg-slate-900 text-white">Inches (in)</option>
            <option value="ft" className="bg-slate-900 text-white">Feet (ft)</option>
          </select>
        </div>
      </div>

      {/* 3. DRAFTING MODES, ZOOM, & EXPORT */}
      <div className="flex items-center gap-1.5">
        {/* Ortho Lock Toggle (<kbd>F8</kbd>) */}
        <button
          onClick={onToggleOrtho}
          className={`px-2.5 py-1 rounded-md text-xs font-mono font-bold transition-all border cursor-pointer ${
            orthoMode
              ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-xs shadow-cyan-950'
              : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
          }`}
          title="Toggle Orthogonal 90° Snap (F8 / Shift)"
        >
          ORTHO {orthoMode ? 'ON' : 'OFF'}
        </button>

        {/* Undo / Redo */}
        <div className="flex items-center bg-slate-900 rounded-md border border-slate-800 p-0.5">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className="p-1.5 rounded hover:bg-slate-800 disabled:opacity-30 text-slate-300 hover:text-white transition-colors cursor-pointer"
            title="Undo (Ctrl+Z)"
          >
            <Undo2 size={14} />
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            className="p-1.5 rounded hover:bg-slate-800 disabled:opacity-30 text-slate-300 hover:text-white transition-colors cursor-pointer"
            title="Redo (Ctrl+Y)"
          >
            <Redo2 size={14} />
          </button>
        </div>

        {/* Zoom Controls */}
        <div className="hidden md:flex items-center bg-slate-900 rounded-md border border-slate-800 p-0.5">
          <button
            onClick={onZoomOut}
            className="p-1.5 rounded hover:bg-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer"
            title="Zoom Out"
          >
            <ZoomOut size={14} />
          </button>
          <button
            onClick={onZoomReset}
            className="px-2 py-1 text-[11px] font-mono text-slate-300 hover:text-white cursor-pointer"
            title="Reset Zoom (100%)"
          >
            {Math.round(zoom * 100)}%
          </button>
          <button
            onClick={onZoomIn}
            className="p-1.5 rounded hover:bg-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer"
            title="Zoom In"
          >
            <ZoomIn size={14} />
          </button>
          <button
            onClick={onZoomFit}
            className="p-1.5 rounded hover:bg-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer"
            title="Zoom to Fit Floor Plan"
          >
            <Maximize2 size={14} />
          </button>
        </div>

        {/* AI Sketch-to-CAD Scanner Button */}
        <button
          onClick={onOpenScanModal}
          className="flex items-center gap-1.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg shadow-sm shadow-cyan-950 transition-all cursor-pointer"
          title="Reverse engineer hand-drawn sketch to CAD with Gemini Vision"
        >
          <Sparkles size={14} className="text-cyan-200" />
          <span className="hidden sm:inline">AI Sketch-to-CAD</span>
          <span className="sm:hidden">AI</span>
        </button>

        {/* Layer Panel Inspector Toggle */}
        <button
          onClick={onToggleLayerPanel}
          className={`p-1.5 rounded-lg border text-xs transition-colors cursor-pointer flex items-center gap-1.5 ${
            isLayerPanelOpen
              ? 'bg-slate-800 text-cyan-300 border-cyan-500/40'
              : 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800'
          }`}
          title="Toggle CAD Layer Stack & Properties Inspector"
        >
          <Layers size={15} />
          <span className="hidden xl:inline text-[11px]">Layers</span>
        </button>

        {/* EXPORT DROPDOWN */}
        <div className="relative">
          <button
            onClick={() => setIsExportOpen(!isExportOpen)}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-100 text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-700 transition-all cursor-pointer"
          >
            <Download size={14} className="text-cyan-400" />
            <span className="hidden sm:inline">Export</span>
            <ChevronDown size={13} className="text-slate-400" />
          </button>

          {isExportOpen && (
            <div className="absolute right-0 top-full mt-2 w-64 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
              <div className="px-3 py-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Professional CAD Formats
              </div>
              <button
                onClick={handleExportDxf}
                className="w-full flex items-start gap-2.5 p-2 rounded-lg hover:bg-slate-800 text-left transition-colors group cursor-pointer"
              >
                <div className="w-8 h-8 rounded-md bg-cyan-950 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0 group-hover:scale-105 transition-transform">
                  <FileCode size={16} />
                </div>
                <div>
                  <div className="text-xs font-semibold text-white group-hover:text-cyan-300 flex items-center gap-1.5">
                    <span>AutoCAD / IntelliCAD (.DXF)</span>
                    <span className="text-[9px] bg-cyan-500/20 text-cyan-300 px-1 rounded">CAD</span>
                  </div>
                  <div className="text-[10px] text-slate-400">
                    AC1015 metric vector drawing with layers
                  </div>
                </div>
              </button>

              <div className="border-t border-slate-800 my-1" />

              <div className="px-3 py-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Plotting & Documents
              </div>
              <button
                onClick={() => {
                  setIsExportOpen(false);
                  window.print();
                }}
                className="w-full flex items-start gap-2.5 p-2 rounded-lg hover:bg-slate-800 text-left transition-colors cursor-pointer"
              >
                <div className="w-8 h-8 rounded-md bg-slate-800 flex items-center justify-center text-slate-300 shrink-0">
                  <FileText size={16} />
                </div>
                <div>
                  <div className="text-xs font-semibold text-white">Engineering PDF Plot</div>
                  <div className="text-[10px] text-slate-400">
                    Scaled 1:50 vector print with title block
                  </div>
                </div>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
