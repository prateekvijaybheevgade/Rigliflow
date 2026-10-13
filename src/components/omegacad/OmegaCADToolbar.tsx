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
  Check,
  Upload,
  Pencil,
  Sun,
  Moon,
  Image as ImageIcon,
  Box,
  Mountain,
  Columns,
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
  canvasTheme?: 'light' | 'blueprint';
  onToggleCanvasTheme?: () => void;
  viewMode?: '2d' | 'split' | '3d';
  onToggleViewMode?: (mode: '2d' | 'split' | '3d') => void;
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
  canvasTheme = 'light',
  onToggleCanvasTheme,
  viewMode = '2d',
  onToggleViewMode,
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

  const handleExportSvg = () => {
    setIsExportOpen(false);
    // Trigger SVG export via DOM element if available
    const svgElem = document.getElementById('cad-vector-blueprint');
    if (!svgElem) {
      alert('Generating CAD SVG export...');
      return;
    }
    const svgData = new XMLSerializer().serializeToString(svgElem);
    const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${drawing.title.replace(/\s+/g, '_')}.svg`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <header className="h-14 border-b border-slate-200/90 bg-white/95 backdrop-blur-md px-3 sm:px-4 flex items-center justify-between select-none z-30 shadow-[0_1px_2px_rgba(0,0,0,0.03)] gap-3">
      {/* 1. BRAND & NAVIGATION (Flowlify executive styling) */}
      <div className="flex items-center gap-2.5 shrink-0 min-w-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-xs">
            <Compass size={17} />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-sm tracking-tight text-slate-900">
                OmegaCAD <span className="text-blue-600 font-extrabold">Plus</span>
              </span>
            </div>
            <span className="text-[10px] text-slate-500 -mt-0.5 font-medium hidden sm:inline">
              2D Civil & Architectural Drafting Engine
            </span>
          </div>
        </div>

        <div className="h-5 w-px bg-slate-200 mx-1 hidden sm:block" />

        {/* Home & Dashboard Quick Switch */}
        <div className="hidden sm:flex items-center gap-1">
          <button
            onClick={onBackToHome}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
            title="Return to Flowlify Home"
          >
            <Home size={15} />
          </button>
          <button
            onClick={onBackToDashboard}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-medium"
            title="Return to Workspace Dashboard"
          >
            <LayoutDashboard size={15} />
            <span className="text-[11px] hidden md:inline">Dashboard</span>
          </button>
        </div>
      </div>

      {/* 2. DRAWING TITLE, SCALE & UNITS */}
      <div className="flex items-center gap-2 min-w-0 max-w-xs md:max-w-md">
        {isEditingTitle ? (
          <input
            type="text"
            value={titleInput}
            onChange={(e) => setTitleInput(e.target.value)}
            onBlur={handleTitleSubmit}
            onKeyDown={(e) => e.key === 'Enter' && handleTitleSubmit()}
            autoFocus
            className="bg-white border border-blue-500 rounded-md px-2.5 py-1 text-xs text-slate-900 focus:outline-none w-56 font-semibold shadow-xs"
          />
        ) : (
          <button
            onClick={() => {
              setTitleInput(drawing.title);
              setIsEditingTitle(true);
            }}
            className="group flex items-center gap-1.5 text-xs font-semibold text-slate-800 hover:text-blue-600 px-2 py-1 rounded-md hover:bg-slate-100 truncate transition-colors text-left cursor-pointer"
            title="Click to rename blueprint"
          >
            <span className="truncate max-w-[160px] md:max-w-[220px]">{drawing.title}</span>
            <Pencil size={11} className="text-slate-400 group-hover:text-blue-600 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
        )}

        {/* Scale Selector */}
        <div className="hidden lg:flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-md border border-slate-200 text-[11px]">
          <span className="text-slate-400 font-semibold text-[10px]">SCALE:</span>
          <select
            value={drawing.scale}
            onChange={(e) =>
              onUpdateDrawing((prev) => ({
                ...prev,
                scale: e.target.value as CadScale,
              }))
            }
            className="bg-transparent text-slate-800 font-semibold focus:outline-none cursor-pointer text-xs"
          >
            <option value="1:20">1:20 (Detail)</option>
            <option value="1:50">1:50 (Standard)</option>
            <option value="1:100">1:100 (Site)</option>
            <option value="1:200">1:200 (Master)</option>
          </select>
        </div>

        {/* Units Selector */}
        <div className="hidden xl:flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-md border border-slate-200 text-[11px]">
          <span className="text-slate-400 font-semibold text-[10px]">UNITS:</span>
          <select
            value={drawing.unit}
            onChange={(e) =>
              onUpdateDrawing((prev) => ({
                ...prev,
                unit: e.target.value as CadUnit,
              }))
            }
            className="bg-transparent text-slate-800 font-semibold focus:outline-none cursor-pointer text-xs"
          >
            <option value="mm">Millimeters (mm)</option>
            <option value="m">Meters (m)</option>
            <option value="in">Inches (in)</option>
            <option value="ft">Feet (ft)</option>
          </select>
        </div>
      </div>

      {/* 3. DRAFTING MODES, ZOOM, AI & EXPORT (Flowlify executive buttons) */}
      <div className="flex items-center gap-1.5 shrink-0">
        {/* Ortho Lock Toggle (<kbd>F8</kbd>) */}
        <button
          onClick={onToggleOrtho}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition-all border cursor-pointer ${
            orthoMode
              ? 'bg-blue-50 text-blue-700 border-blue-200 shadow-xs'
              : 'bg-white text-slate-500 border-slate-200 hover:text-slate-800 hover:bg-slate-50'
          }`}
          title="Toggle Orthogonal 90° Axis Lock (F8)"
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              orthoMode ? 'bg-blue-600 animate-pulse' : 'bg-slate-300'
            }`}
          />
          <span>ORTHO {orthoMode ? 'ON' : 'OFF'}</span>
        </button>

        {/* Canvas Theme Toggle (Light Drafting vs Blueprint Blue) */}
        {onToggleCanvasTheme && (
          <button
            onClick={onToggleCanvasTheme}
            className={`p-1.5 rounded-md border text-xs transition-colors cursor-pointer flex items-center gap-1 ${
              canvasTheme === 'blueprint'
                ? 'bg-slate-900 text-white border-slate-800'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-900'
            }`}
            title={canvasTheme === 'blueprint' ? 'Switch to Light Drafting View' : 'Switch to Blueprint Blue View'}
          >
            {canvasTheme === 'blueprint' ? (
              <Moon size={14} className="text-cyan-400" />
            ) : (
              <Sun size={14} className="text-amber-500" />
            )}
            <span className="hidden 2xl:inline text-[11px] font-medium">
              {canvasTheme === 'blueprint' ? 'Blueprint' : 'Light Grid'}
            </span>
          </button>
        )}

        {/* Undo / Redo */}
        <div className="flex items-center bg-slate-100 rounded-md p-0.5 border border-slate-200/80">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className="p-1.5 rounded hover:bg-white disabled:opacity-30 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
            title="Undo (Ctrl+Z)"
          >
            <Undo2 size={13} />
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            className="p-1.5 rounded hover:bg-white disabled:opacity-30 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
            title="Redo (Ctrl+Y)"
          >
            <Redo2 size={13} />
          </button>
        </div>

        {/* Zoom Controls */}
        <div className="hidden md:flex items-center bg-slate-100 rounded-md p-0.5 border border-slate-200/80">
          <button
            onClick={onZoomOut}
            className="p-1.5 rounded hover:bg-white text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
            title="Zoom Out"
          >
            <ZoomOut size={13} />
          </button>
          <button
            onClick={onZoomReset}
            className="px-2 py-0.5 text-[11px] font-bold text-slate-700 hover:bg-white rounded transition-colors cursor-pointer"
            title="Reset Zoom (100%)"
          >
            {Math.round(zoom * 100)}%
          </button>
          <button
            onClick={onZoomIn}
            className="p-1.5 rounded hover:bg-white text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
            title="Zoom In"
          >
            <ZoomIn size={13} />
          </button>
          <button
            onClick={onZoomFit}
            className="p-1.5 rounded hover:bg-white text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
            title="Fit to Screen"
          >
            <Maximize2 size={13} />
          </button>
        </div>

        {/* 2D / Split / 3D Holographic View Mode Segmented Switcher */}
        {onToggleViewMode && (
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
            <button
              onClick={() => onToggleViewMode('2d')}
              className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                viewMode === '2d'
                  ? 'bg-white text-blue-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="2D Precision CAD Drafting Blueprint"
            >
              <span>2D Plan</span>
            </button>
            <button
              onClick={() => onToggleViewMode('split')}
              className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                viewMode === 'split'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xs'
                  : 'text-slate-700 hover:text-blue-600'
              }`}
              title="Live Side-by-Side: 2D Blueprint Drafting (Left) + Realtime 3D Hologram (Right)"
            >
              <Columns size={12} className={viewMode === 'split' ? 'text-white' : 'text-blue-600'} />
              <span className="hidden sm:inline">Split 2D+3D</span>
              <span className="sm:hidden">Split</span>
            </button>
            <button
              onClick={() => onToggleViewMode('3d')}
              className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                viewMode === '3d'
                  ? 'bg-gradient-to-r from-emerald-600 to-cyan-600 text-white shadow-xs'
                  : 'text-slate-700 hover:text-emerald-600'
              }`}
              title="Full 3D Holographic Digital Twin & Topological Elevation View"
            >
              <Mountain size={12} className={viewMode === '3d' ? 'text-white' : 'text-emerald-600'} />
              <span className="hidden sm:inline">3D Hologram</span>
              <span className="sm:hidden">3D</span>
            </button>
          </div>
        )}

        {/* AI Sketch-to-CAD Scanner Button (Matching Flowlify Studio Dark Pill) */}
        <button
          onClick={onOpenScanModal}
          className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold px-3 py-1.5 rounded-lg shadow-xs transition-all cursor-pointer group"
          title="Reverse engineer hand-drawn sketch to CAD with Gemini Vision"
        >
          <Sparkles size={13} className="text-amber-400 group-hover:rotate-12 transition-transform" />
          <span className="hidden sm:inline">AI Sketch to CAD</span>
          <span className="sm:hidden">AI</span>
        </button>

        {/* Layer Panel Inspector Toggle */}
        <button
          onClick={onToggleLayerPanel}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-colors cursor-pointer ${
            isLayerPanelOpen
              ? 'bg-blue-50 text-blue-700 border-blue-300 shadow-xs'
              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
          }`}
          title="Toggle CAD Layer Stack & Properties Inspector"
        >
          <Layers size={14} className={isLayerPanelOpen ? 'text-blue-600' : 'text-slate-500'} />
          <span className="hidden xl:inline">Layers</span>
        </button>

        {/* EXPORT DROPDOWN */}
        <div className="relative">
          <button
            onClick={() => setIsExportOpen(!isExportOpen)}
            className="flex items-center gap-1.5 bg-white hover:bg-slate-50 text-slate-800 text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-200 shadow-xs transition-all cursor-pointer"
          >
            <Download size={13} className="text-slate-600" />
            <span className="hidden sm:inline">Export</span>
            <ChevronDown size={12} className="text-slate-400" />
          </button>

          {isExportOpen && (
            <div
              className="absolute right-0 top-full mt-2 w-64 bg-white border border-slate-200 rounded-xl shadow-xl p-1.5 z-50 text-xs animate-in fade-in zoom-in-95 duration-100"
              onClick={() => setIsExportOpen(false)}
            >
              <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Industry CAD Formats
              </div>
              <button
                onClick={handleExportDxf}
                className="w-full flex items-start gap-2.5 p-2 rounded-lg hover:bg-blue-50 text-left transition-colors group cursor-pointer"
              >
                <div className="w-8 h-8 rounded-md bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <FileCode size={16} />
                </div>
                <div>
                  <div className="text-xs font-semibold text-slate-900 group-hover:text-blue-700 flex items-center gap-1.5">
                    <span>AutoCAD DXF (.DXF)</span>
                    <span className="text-[9px] bg-blue-100 text-blue-700 font-bold px-1 rounded">2D CAD</span>
                  </div>
                  <div className="text-[10px] text-slate-500">
                    AC1015 metric drawing with layers
                  </div>
                </div>
              </button>

              <button
                onClick={handleExportSvg}
                className="w-full flex items-start gap-2.5 p-2 rounded-lg hover:bg-slate-50 text-left transition-colors cursor-pointer"
              >
                <div className="w-8 h-8 rounded-md bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <FileCode size={16} />
                </div>
                <div>
                  <div className="text-xs font-semibold text-slate-900">Scalable Vector (.SVG)</div>
                  <div className="text-[10px] text-slate-500">
                    Crisp architectural vector graphic
                  </div>
                </div>
              </button>

              <div className="border-t border-slate-100 my-1" />

              <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Plotting & Print
              </div>
              <button
                onClick={() => {
                  setIsExportOpen(false);
                  window.print();
                }}
                className="w-full flex items-start gap-2.5 p-2 rounded-lg hover:bg-slate-50 text-left transition-colors cursor-pointer"
              >
                <div className="w-8 h-8 rounded-md bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
                  <FileText size={16} />
                </div>
                <div>
                  <div className="text-xs font-semibold text-slate-900">Architectural PDF Plot</div>
                  <div className="text-[10px] text-slate-500">
                    Scaled 1:50 printout with title block
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
