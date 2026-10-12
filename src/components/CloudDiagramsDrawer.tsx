import React from 'react';
import { DiagramData } from '../types/flowchart';
import { Cloud, X, Plus, Trash2, ArrowRight, Calendar, Layers } from 'lucide-react';

interface CloudDiagramsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  savedDiagrams: DiagramData[];
  currentDiagramId?: string;
  onSelectDiagram: (diagram: DiagramData) => void;
  onDeleteDiagram: (diagramId: string) => void;
  onNewDiagram: () => void;
}

export const CloudDiagramsDrawer: React.FC<CloudDiagramsDrawerProps> = ({
  isOpen,
  onClose,
  savedDiagrams,
  currentDiagramId,
  onSelectDiagram,
  onDeleteDiagram,
  onNewDiagram,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-2xs">
      <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col border-l border-slate-200 animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-blue-50/70 to-indigo-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <Cloud size={16} />
            </div>
            <div>
              <h2 className="font-bold text-slate-800 text-sm">My Cloud Flowcharts</h2>
              <p className="text-[11px] text-slate-500">
                Stored securely in your cloud workspace
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Action: New Blank Flowchart */}
        <div className="p-3 border-b border-slate-100 bg-slate-50">
          <button
            onClick={() => {
              onNewDiagram();
              onClose();
            }}
            className="w-full flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold py-2 rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <Plus size={14} />
            <span>Create New Blank Flowchart</span>
          </button>
        </div>

        {/* List of Saved Diagrams */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {savedDiagrams.length === 0 ? (
            <div className="text-center py-12 px-4 space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                <Layers size={22} />
              </div>
              <h3 className="font-semibold text-xs text-slate-700">No flowcharts saved yet</h3>
              <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                Click "Save to Cloud" in the toolbar to save your current diagram to your cloud workspace.
              </p>
            </div>
          ) : (
            savedDiagrams.map((diag) => {
              const isCurrent = diag.id === currentDiagramId;
              return (
                <div
                  key={diag.id}
                  className={`p-3.5 rounded-xl border transition-all text-xs group ${
                    isCurrent
                      ? 'border-blue-500 bg-blue-50/40 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/60 bg-white'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <h4 className="font-bold text-slate-800 line-clamp-1 flex-1">
                      {diag.title}
                    </h4>
                    {isCurrent && (
                      <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 shrink-0">
                        Active
                      </span>
                    )}
                  </div>

                  {diag.description && (
                    <p className="text-[11px] text-slate-500 line-clamp-2 mb-2">
                      {diag.description}
                    </p>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100/80 text-[10px] text-slate-400">
                    <div className="flex items-center gap-2">
                      <span>{diag.nodes?.length || 0} nodes</span>
                      <span>•</span>
                      <span>{diag.edges?.length || 0} connections</span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          if (diag.id) onDeleteDiagram(diag.id);
                        }}
                        className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Delete diagram"
                      >
                        <Trash2 size={13} />
                      </button>
                      <button
                        onClick={() => {
                          onSelectDiagram(diag);
                          onClose();
                        }}
                        className="flex items-center gap-1 font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-md transition-colors cursor-pointer ml-1"
                      >
                        <span>Open</span>
                        <ArrowRight size={11} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
