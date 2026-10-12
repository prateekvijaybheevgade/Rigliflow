import React, { useState } from 'react';
import { X, ZoomIn, ZoomOut, Maximize2, Minimize2, Move } from 'lucide-react';

interface OriginalImageDrawerProps {
  imageUrl: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export const OriginalImageDrawer: React.FC<OriginalImageDrawerProps> = ({
  imageUrl,
  isOpen,
  onClose,
}) => {
  const [zoom, setZoom] = useState(1);
  const [opacity, setOpacity] = useState(1);
  const [isExpanded, setIsExpanded] = useState(false);

  if (!isOpen || !imageUrl) return null;

  return (
    <div
      className={`fixed bottom-4 right-4 z-40 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col transition-all duration-200 ${
        isExpanded ? 'w-[640px] h-[520px]' : 'w-80 h-72 sm:w-96 sm:h-80'
      }`}
    >
      {/* Drawer Header */}
      <div className="px-3.5 py-2.5 bg-slate-100 border-b border-slate-200 flex items-center justify-between select-none">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-semibold text-xs text-slate-800">
            Original Uploaded Sketch
          </span>
        </div>
        <div className="flex items-center gap-1">
          {/* Zoom controls */}
          <button
            onClick={() => setZoom((z) => Math.max(0.5, z - 0.2))}
            className="p-1 rounded hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer"
            title="Zoom out"
          >
            <ZoomOut size={13} />
          </button>
          <button
            onClick={() => setZoom(1)}
            className="px-1 text-[10px] font-mono text-slate-600 cursor-pointer"
            title="Reset zoom"
          >
            {Math.round(zoom * 100)}%
          </button>
          <button
            onClick={() => setZoom((z) => Math.min(2.5, z + 0.2))}
            className="p-1 rounded hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer"
            title="Zoom in"
          >
            <ZoomIn size={13} />
          </button>

          {/* Expand / Minimize */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 rounded hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer ml-1"
            title={isExpanded ? 'Collapse' : 'Expand preview'}
          >
            {isExpanded ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
          </button>

          {/* Close */}
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-rose-100 text-slate-500 hover:text-rose-600 transition-colors cursor-pointer"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Image Preview Container */}
      <div className="flex-1 bg-slate-900/5 relative overflow-auto p-2 flex items-center justify-center">
        <div
          className="transition-transform origin-center flex items-center justify-center"
          style={{
            transform: `scale(${zoom})`,
            opacity,
          }}
        >
          <img
            src={imageUrl}
            alt="Original Diagram Sketch"
            className="max-w-full max-h-full object-contain rounded-lg shadow-sm border border-slate-200 bg-white"
          />
        </div>
      </div>

      {/* Drawer Footer with Opacity Slider */}
      <div className="px-3.5 py-1.5 bg-white border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
        <span>Side-by-side reference</span>
        <div className="flex items-center gap-2">
          <span>Opacity:</span>
          <input
            type="range"
            min="0.2"
            max="1"
            step="0.05"
            value={opacity}
            onChange={(e) => setOpacity(parseFloat(e.target.value))}
            className="w-16 h-1 accent-blue-600 cursor-pointer"
          />
        </div>
      </div>
    </div>
  );
};
