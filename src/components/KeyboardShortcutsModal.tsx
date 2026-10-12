import React, { useState, useEffect } from 'react';
import {
  X,
  Keyboard,
  Search,
  MousePointer2,
  Move,
  Layers,
  Sparkles,
  Command,
  ZoomIn,
  Trash2,
  Copy,
  Undo2,
  Redo2,
  HelpCircle,
} from 'lucide-react';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ShortcutItem {
  id: string;
  category: 'nodes' | 'navigation' | 'general';
  action: string;
  keys: string[];
  description: string;
  icon?: React.ReactNode;
}

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'nodes' | 'navigation' | 'general'>('all');

  const isMac =
    typeof navigator !== 'undefined' &&
    (/Mac|iPod|iPhone|iPad/.test(navigator.platform) ||
      (navigator as any).userAgentData?.platform === 'macOS');

  const modKey = isMac ? '⌘' : 'Ctrl';

  const shortcuts: ShortcutItem[] = [
    // Node Management
    {
      id: 'delete-node',
      category: 'nodes',
      action: 'Delete Selected Node or Connection',
      keys: ['Delete', 'or', 'Backspace'],
      description: 'Removes active selection from the flowchart',
      icon: <Trash2 size={13} className="text-rose-500" />,
    },
    {
      id: 'duplicate-node',
      category: 'nodes',
      action: 'Duplicate Selected Node',
      keys: [modKey, '+', 'D'],
      description: 'Creates an instant copy with offset positioning',
      icon: <Copy size={13} className="text-blue-500" />,
    },
    {
      id: 'select-all',
      category: 'nodes',
      action: 'Select All Nodes',
      keys: [modKey, '+', 'A'],
      description: 'Selects every node across the canvas',
      icon: <Layers size={13} className="text-indigo-500" />,
    },
    {
      id: 'multi-select',
      category: 'nodes',
      action: 'Multi-Select Multiple Nodes',
      keys: ['Shift', '+', 'Click'],
      description: 'Add or remove specific nodes from current selection',
      icon: <MousePointer2 size={13} className="text-emerald-500" />,
    },
    {
      id: 'marquee-select',
      category: 'nodes',
      action: 'Marquee Box Selection',
      keys: ['Drag on Canvas'],
      description: 'Draw a selection rectangle across multiple nodes',
      icon: <MousePointer2 size={13} className="text-amber-500" />,
    },
    {
      id: 'connect-nodes',
      category: 'nodes',
      action: 'Connect Two Nodes',
      keys: ['Drag Handle Point'],
      description: 'Drag from any connection handle to a target node',
      icon: <Layers size={13} className="text-cyan-500" />,
    },
    {
      id: 'edit-node',
      category: 'nodes',
      action: 'Inspect & Edit Properties',
      keys: ['Click Node'],
      description: 'Opens right properties panel for label, color & shape styling',
      icon: <Layers size={13} className="text-violet-500" />,
    },

    // Navigation & Canvas
    {
      id: 'pan-canvas',
      category: 'navigation',
      action: 'Pan Across Canvas',
      keys: ['Space', '+', 'Drag', 'or', 'Drag Blank Canvas'],
      description: 'Glide seamlessly around your flowchart space',
      icon: <Move size={13} className="text-sky-500" />,
    },
    {
      id: 'zoom-scroll',
      category: 'navigation',
      action: 'Smooth Zoom In / Out',
      keys: ['Mouse Wheel', 'or', 'Pinch Trackpad'],
      description: 'Zooms viewport centered on your cursor pointer',
      icon: <ZoomIn size={13} className="text-teal-500" />,
    },
    {
      id: 'zoom-in',
      category: 'navigation',
      action: 'Zoom In Step',
      keys: [modKey, '+', '+'],
      description: 'Increases canvas magnification by 15%',
      icon: <ZoomIn size={13} className="text-blue-500" />,
    },
    {
      id: 'zoom-out',
      category: 'navigation',
      action: 'Zoom Out Step',
      keys: [modKey, '+', '-'],
      description: 'Decreases canvas magnification by 15%',
      icon: <ZoomIn size={13} className="text-slate-500" />,
    },
    {
      id: 'zoom-reset',
      category: 'navigation',
      action: 'Reset Zoom to 100%',
      keys: [modKey, '+', '0'],
      description: 'Restores default 1:1 view scale',
      icon: <Move size={13} className="text-indigo-500" />,
    },
    {
      id: 'deselect',
      category: 'navigation',
      action: 'Clear Selection / Close Panel',
      keys: ['Esc'],
      description: 'Deselects nodes or closes open drawers',
      icon: <X size={13} className="text-slate-500" />,
    },

    // General & History
    {
      id: 'undo',
      category: 'general',
      action: 'Undo Last Action',
      keys: [modKey, '+', 'Z'],
      description: 'Reverts your most recent canvas edit or move',
      icon: <Undo2 size={13} className="text-orange-500" />,
    },
    {
      id: 'redo',
      category: 'general',
      action: 'Redo Action',
      keys: [modKey, '+', 'Y', 'or', modKey, '+', 'Shift', '+', 'Z'],
      description: 'Restores the previously undone change',
      icon: <Redo2 size={13} className="text-orange-500" />,
    },
    {
      id: 'save-cloud',
      category: 'general',
      action: 'Save to Cloud Workspace',
      keys: [modKey, '+', 'S'],
      description: 'Persists active flowchart state to your account',
      icon: <Sparkles size={13} className="text-emerald-500" />,
    },
    {
      id: 'shortcuts-modal',
      category: 'general',
      action: 'Open Keyboard Shortcuts',
      keys: ['?'],
      description: 'Quickly display this reference guide anytime',
      icon: <HelpCircle size={13} className="text-purple-500" />,
    },
  ];

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filteredShortcuts = shortcuts.filter((item) => {
    const matchesTab = activeTab === 'all' || item.category === activeTab;
    const q = searchQuery.toLowerCase().trim();
    if (!q) return matchesTab;
    const matchesSearch =
      item.action.toLowerCase().includes(q) ||
      item.description.toLowerCase().includes(q) ||
      item.keys.some((k) => k.toLowerCase().includes(q));
    return matchesTab && matchesSearch;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="bg-white rounded-2xl shadow-2xl border border-slate-200/90 w-full max-w-2xl overflow-hidden flex flex-col max-h-[88vh] animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="shortcuts-title"
      >
        {/* Header */}
        <div className="px-5 sm:px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-50 via-white to-blue-50/30">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shadow-2xs">
              <Keyboard size={18} />
            </div>
            <div>
              <h2 id="shortcuts-title" className="text-base font-bold text-slate-800 flex items-center gap-2">
                Keyboard Shortcuts
                <span className="text-[11px] font-medium bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full border border-slate-200/80">
                  {isMac ? 'macOS' : 'Windows / Linux'}
                </span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Speed up diagram creation with quick node controls and canvas navigation
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            title="Close (Esc)"
          >
            <X size={18} />
          </button>
        </div>

        {/* Search & Category Filter Bar */}
        <div className="p-4 sm:px-6 border-b border-slate-100 bg-white space-y-3">
          <div className="relative">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              placeholder="Search shortcuts by action or key (e.g. duplicate, zoom, delete)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2 text-xs bg-slate-50 hover:bg-slate-100/70 focus:bg-white rounded-xl border border-slate-200 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all text-slate-700 placeholder-slate-400"
              autoFocus
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
              >
                <X size={13} />
              </button>
            )}
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
            {[
              { id: 'all', label: 'All Shortcuts', count: shortcuts.length },
              {
                id: 'nodes',
                label: 'Node Management',
                count: shortcuts.filter((s) => s.category === 'nodes').length,
              },
              {
                id: 'navigation',
                label: 'Navigation & Canvas',
                count: shortcuts.filter((s) => s.category === 'navigation').length,
              },
              {
                id: 'general',
                label: 'History & Workspace',
                count: shortcuts.filter((s) => s.category === 'general').length,
              },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === tab.id
                    ? 'bg-blue-50 text-blue-700 border border-blue-200 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-transparent'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    activeTab === tab.id
                      ? 'bg-blue-200/70 text-blue-800'
                      : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Shortcuts List Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-2">
          {filteredShortcuts.length === 0 ? (
            <div className="text-center py-12 px-4">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto text-slate-400 mb-3">
                <Search size={20} />
              </div>
              <h3 className="text-sm font-semibold text-slate-700">No shortcuts found</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                No shortcut matched "{searchQuery}". Try searching for keywords like "zoom", "node", or "delete".
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setActiveTab('all');
                }}
                className="mt-3 text-xs font-semibold text-blue-600 hover:text-blue-700 underline cursor-pointer"
              >
                Clear filter
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {filteredShortcuts.map((item) => (
                <div
                  key={item.id}
                  className="p-3 rounded-xl border border-slate-200/80 hover:border-slate-300 hover:bg-slate-50/60 transition-all flex flex-col justify-between group bg-white"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <div className="p-1 rounded-md bg-slate-100 text-slate-600 group-hover:bg-white group-hover:shadow-2xs transition-all">
                        {item.icon}
                      </div>
                      <span className="text-xs font-semibold text-slate-800 group-hover:text-blue-700 transition-colors">
                        {item.action}
                      </span>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-500 line-clamp-1 mb-2.5 pl-1">
                    {item.description}
                  </p>

                  <div className="flex items-center flex-wrap gap-1 self-start">
                    {item.keys.map((k, idx) => {
                      if (k === '+' || k === 'or') {
                        return (
                          <span
                            key={idx}
                            className="text-[10px] text-slate-400 font-medium px-0.5"
                          >
                            {k}
                          </span>
                        );
                      }
                      return (
                        <kbd
                          key={idx}
                          className="px-2 py-0.5 text-[11px] font-mono font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200/80 rounded-md border border-slate-300/80 shadow-2xs tracking-wide"
                        >
                          {k}
                        </kbd>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 sm:px-6 py-3 border-t border-slate-100 bg-slate-50/80 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-2 text-[11px]">
            <span>Tip: Press</span>
            <kbd className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-white text-slate-700 border border-slate-200 rounded shadow-2xs">
              ?
            </kbd>
            <span>anytime to toggle this help window</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs rounded-lg transition-colors cursor-pointer shadow-2xs"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};
