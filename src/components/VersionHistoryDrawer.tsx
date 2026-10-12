import React, { useState, useEffect } from 'react';
import {
  History,
  X,
  Clock,
  RotateCcw,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Eye,
  Workflow,
  Sparkles,
  ArrowRight,
  Layers,
  Calendar,
  Tag,
  Loader2,
} from 'lucide-react';
import { DiagramData } from '../types/flowchart';
import {
  DiagramVersion,
  subscribeToDiagramVersions,
  saveDiagramVersion,
  deleteDiagramVersion,
} from '../services/diagramService';
import { useAuth } from '../context/AuthContext';

interface VersionHistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentDiagram: DiagramData;
  onRestoreVersion: (version: DiagramVersion) => void;
}

export const VersionHistoryDrawer: React.FC<VersionHistoryDrawerProps> = ({
  isOpen,
  onClose,
  currentDiagram,
  onRestoreVersion,
}) => {
  const { user } = useAuth();
  const [versions, setVersions] = useState<DiagramVersion[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSavingSnapshot, setIsSavingSnapshot] = useState<boolean>(false);
  const [customNote, setCustomNote] = useState<string>('');
  const [previewVersionId, setPreviewVersionId] = useState<string | null>(null);
  const [confirmRestoreId, setConfirmRestoreId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Subscribe to real-time versions from Firestore
  useEffect(() => {
    if (!isOpen || !user || !currentDiagram.id) {
      setVersions([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const unsubscribe = subscribeToDiagramVersions(user.uid, currentDiagram.id, (loadedVersions) => {
      setVersions(loadedVersions);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [isOpen, user, currentDiagram.id]);

  if (!isOpen) return null;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleCreateSnapshot = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!user || !currentDiagram.id) return;

    setIsSavingSnapshot(true);
    try {
      const note = customNote.trim() || `Manual snapshot (${currentDiagram.nodes.length} nodes)`;
      await saveDiagramVersion(user.uid, currentDiagram.id, currentDiagram, note);
      setCustomNote('');
      showToast('Version snapshot recorded successfully!');
    } catch (err) {
      console.error('Failed to create version snapshot:', err);
      showToast('Error saving version snapshot');
    } finally {
      setIsSavingSnapshot(false);
    }
  };

  const handleDelete = async (versionId: string) => {
    if (!user || !currentDiagram.id) return;
    try {
      await deleteDiagramVersion(user.uid, currentDiagram.id, versionId);
      if (previewVersionId === versionId) setPreviewVersionId(null);
      if (confirmRestoreId === versionId) setConfirmRestoreId(null);
      showToast('Version snapshot deleted');
    } catch (err) {
      console.error('Failed to delete version:', err);
    }
  };

  const handleConfirmRestore = (ver: DiagramVersion) => {
    onRestoreVersion(ver);
    setConfirmRestoreId(null);
    showToast(`Restored version from ${formatDate(ver.createdAt)}`);
  };

  const formatDate = (timestamp: any): string => {
    if (!timestamp) return 'Just now';
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      });
    } catch {
      return 'Recent';
    }
  };

  const previewVersion = versions.find((v) => v.id === previewVersionId);

  return (
    <div className="fixed inset-y-0 right-0 z-50 flex shadow-2xl animate-in slide-in-from-right duration-200">
      {/* Background Backdrop for mobile/tablet */}
      <div
        className="fixed inset-0 bg-slate-900/30 backdrop-blur-2xs -z-10"
        onClick={onClose}
      />

      <div className="w-[420px] max-w-[95vw] bg-white h-full flex flex-col border-l border-slate-200 select-none text-slate-800">
        {/* 1. Header */}
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
              <History size={17} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-slate-900">Version History</h3>
                <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-blue-100 text-blue-700">
                  {versions.length} {versions.length === 1 ? 'version' : 'versions'}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 truncate max-w-[240px]">
                {currentDiagram.title || 'Untitled Flowchart'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
            title="Close version history"
          >
            <X size={16} />
          </button>
        </div>

        {/* Toast alert notice */}
        {toastMessage && (
          <div className="bg-emerald-600 text-white text-xs font-semibold px-4 py-2 flex items-center gap-2 animate-in fade-in duration-150">
            <CheckCircle2 size={14} />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* 2. Create Named Snapshot Form */}
        <div className="p-4 border-b border-slate-200 bg-white shrink-0">
          <form onSubmit={handleCreateSnapshot} className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Tag size={12} className="text-blue-600" />
                <span>Save New Snapshot</span>
              </label>
              <span className="text-[10px] text-slate-400">
                {currentDiagram.nodes.length} nodes · {currentDiagram.edges.length} wires
              </span>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={customNote}
                onChange={(e) => setCustomNote(e.target.value)}
                placeholder="e.g. Before refactoring checkout logic..."
                maxLength={120}
                className="flex-1 px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:ring-1 focus:ring-blue-500 text-slate-800"
              />

              <button
                type="submit"
                disabled={isSavingSnapshot || !currentDiagram.id}
                className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg shadow-2xs transition-colors cursor-pointer disabled:opacity-50 shrink-0"
              >
                {isSavingSnapshot ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : (
                  <Plus size={13} />
                )}
                <span>Record</span>
              </button>
            </div>

            {!currentDiagram.id && (
              <p className="text-[10px] text-amber-600 flex items-center gap-1 pt-0.5">
                <AlertCircle size={11} />
                <span>Save diagram to cloud once to activate version snapshots</span>
              </p>
            )}
          </form>
        </div>

        {/* 3. Versions List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#F8FAFC]">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-2">
              <Loader2 size={24} className="animate-spin text-blue-600" />
              <span className="text-xs font-medium">Loading version timeline...</span>
            </div>
          ) : versions.length === 0 ? (
            <div className="text-center py-12 px-4 space-y-2 border border-dashed border-slate-300 rounded-2xl bg-white">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
                <Clock size={20} />
              </div>
              <h4 className="font-bold text-xs text-slate-800">No previous versions yet</h4>
              <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
                Snapshots are automatically created when you save this flowchart to your cloud workspace, or you can record a manual checkpoint above.
              </p>
            </div>
          ) : (
            versions.map((ver, idx) => {
              const isSelectedPreview = previewVersionId === ver.id;
              const isConfirming = confirmRestoreId === ver.id;
              const isLatest = idx === 0;

              return (
                <div
                  key={ver.id}
                  className={`bg-white rounded-xl border transition-all p-3.5 space-y-2.5 ${
                    isSelectedPreview
                      ? 'border-blue-500 shadow-sm ring-1 ring-blue-500/30'
                      : 'border-slate-200 hover:border-slate-300 shadow-2xs'
                  }`}
                >
                  {/* Version Title & Time */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                          v{versions.length - idx}
                        </span>
                        {isLatest && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700">
                            Current
                          </span>
                        )}
                        <span className="text-[11px] text-slate-400 font-medium">
                          {formatDate(ver.createdAt)}
                        </span>
                      </div>

                      <h4 className="text-xs font-bold text-slate-900 truncate">
                        {ver.versionNote || ver.title}
                      </h4>
                    </div>

                    <button
                      onClick={() => handleDelete(ver.id)}
                      className="p-1 rounded text-slate-300 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer shrink-0"
                      title="Delete this version"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>

                  {/* Nodes Summary Strip */}
                  <div className="flex items-center gap-2 text-[10px] text-slate-500 bg-slate-50 p-1.5 rounded-lg border border-slate-100">
                    <span className="font-semibold text-slate-700 flex items-center gap-1">
                      <Workflow size={11} className="text-blue-600" />
                      {ver.nodeCount} Nodes
                    </span>
                    <span>·</span>
                    <span className="font-semibold text-slate-700 flex items-center gap-1">
                      <ArrowRight size={11} className="text-indigo-600" />
                      {ver.edgeCount} Wires
                    </span>
                    <span>·</span>
                    <span className="capitalize text-slate-500">
                      {ver.direction || 'top-down'}
                    </span>
                  </div>

                  {/* Preview of Node labels */}
                  {ver.nodes && ver.nodes.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-0.5">
                      {ver.nodes.slice(0, 3).map((n, i) => (
                        <span
                          key={i}
                          className="text-[9px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-medium truncate max-w-[100px]"
                        >
                          {n.label}
                        </span>
                      ))}
                      {ver.nodes.length > 3 && (
                        <span className="text-[9px] text-slate-400 font-semibold self-center">
                          +{ver.nodes.length - 3} more
                        </span>
                      )}
                    </div>
                  )}

                  {/* Restore Confirmation Gate */}
                  {isConfirming ? (
                    <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg space-y-2 animate-in fade-in duration-150">
                      <p className="text-[11px] font-semibold text-amber-900 leading-snug">
                        Restore this version? Your current canvas will be updated with this snapshot (Undo will remain available).
                      </p>
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setConfirmRestoreId(null)}
                          className="px-2.5 py-1 text-[11px] font-medium text-slate-600 hover:bg-amber-100/60 rounded cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleConfirmRestore(ver)}
                          className="flex items-center gap-1 bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-bold px-3 py-1 rounded shadow-2xs cursor-pointer"
                        >
                          <RotateCcw size={11} />
                          <span>Confirm Restore</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* Default Actions Bar */
                    <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                      <button
                        onClick={() =>
                          setPreviewVersionId(isSelectedPreview ? null : ver.id)
                        }
                        className="flex items-center gap-1 text-[11px] font-medium text-slate-600 hover:text-blue-600 cursor-pointer"
                      >
                        <Eye size={12} />
                        <span>{isSelectedPreview ? 'Hide Details' : 'View Details'}</span>
                      </button>

                      <button
                        onClick={() => setConfirmRestoreId(ver.id)}
                        className="flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                      >
                        <RotateCcw size={12} />
                        <span>Restore This State</span>
                      </button>
                    </div>
                  )}

                  {/* Expanded Inspector when 'View Details' is clicked */}
                  {isSelectedPreview && (
                    <div className="p-2 bg-slate-50 rounded-lg border border-slate-200 space-y-1.5 text-[10px] animate-in fade-in duration-150">
                      <div className="font-bold text-slate-700">Nodes in this version:</div>
                      <div className="space-y-1 max-h-32 overflow-y-auto pr-1">
                        {ver.nodes.map((node, i) => (
                          <div
                            key={i}
                            className="flex items-center justify-between p-1 bg-white rounded border border-slate-200"
                          >
                            <span className="font-medium text-slate-800 truncate">
                              {node.label}
                            </span>
                            <span className="text-[9px] text-slate-400 capitalize shrink-0 ml-1">
                              {node.type}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* 4. Footer */}
        <div className="p-3 border-t border-slate-200 bg-white flex items-center justify-between text-[11px] text-slate-500 shrink-0">
          <span>Protected with secure access control</span>
          <button
            onClick={onClose}
            className="font-semibold text-slate-700 hover:text-slate-900 cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
