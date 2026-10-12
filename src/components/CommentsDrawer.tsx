import React, { useState, useMemo } from 'react';
import {
  MessageSquare,
  X,
  CheckCircle2,
  Circle,
  Trash2,
  Send,
  Loader2,
  Filter,
  Layers,
  Clock,
  User,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { DiagramComment } from '../services/diagramService';
import { FlowNode } from '../types/flowchart';
import { useAuth } from '../context/AuthContext';

interface CommentsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  comments: DiagramComment[];
  nodes: FlowNode[];
  selectedNodeId: string | null;
  onSelectNode: (nodeId: string) => void;
  onAddComment: (nodeId: string, content: string) => Promise<void>;
  onToggleResolveComment: (commentId: string, currentResolved: boolean) => Promise<void>;
  onDeleteComment: (commentId: string) => Promise<void>;
  isSavingToCloud?: boolean;
}

export const CommentsDrawer: React.FC<CommentsDrawerProps> = ({
  isOpen,
  onClose,
  comments,
  nodes,
  selectedNodeId,
  onSelectNode,
  onAddComment,
  onToggleResolveComment,
  onDeleteComment,
  isSavingToCloud,
}) => {
  const { user, loginWithGoogle } = useAuth();
  const [filterMode, setFilterMode] = useState<'all' | 'selected' | 'unresolved' | 'resolved'>('all');
  const [targetNodeId, setTargetNodeId] = useState<string>(selectedNodeId || (nodes[0]?.id || ''));
  const [commentText, setCommentText] = useState<string>('');
  const [isPosting, setIsPosting] = useState<boolean>(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [resolvingId, setResolvingId] = useState<string | null>(null);

  // Keep targetNodeId in sync when selectedNodeId changes
  React.useEffect(() => {
    if (selectedNodeId) {
      setTargetNodeId(selectedNodeId);
    } else if (nodes.length > 0 && !targetNodeId) {
      setTargetNodeId(nodes[0].id);
    }
  }, [selectedNodeId, nodes]);

  // Create lookup for node names & info
  const nodeMap = useMemo(() => {
    const map = new Map<string, FlowNode>();
    nodes.forEach((n) => map.set(n.id, n));
    return map;
  }, [nodes]);

  // Filter comments
  const filteredComments = useMemo(() => {
    return comments.filter((c) => {
      if (filterMode === 'selected') {
        return c.nodeId === (selectedNodeId || targetNodeId);
      }
      if (filterMode === 'unresolved') {
        return !c.resolved;
      }
      if (filterMode === 'resolved') {
        return c.resolved;
      }
      return true;
    });
  }, [comments, filterMode, selectedNodeId, targetNodeId]);

  const unresolvedCount = useMemo(() => comments.filter((c) => !c.resolved).length, [comments]);
  const resolvedCount = useMemo(() => comments.filter((c) => c.resolved).length, [comments]);
  const selectedNodeCommentsCount = useMemo(() => {
    const nId = selectedNodeId || targetNodeId;
    return comments.filter((c) => c.nodeId === nId).length;
  }, [comments, selectedNodeId, targetNodeId]);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!commentText.trim() || !targetNodeId || isPosting) return;

    if (!user) {
      loginWithGoogle();
      return;
    }

    try {
      setIsPosting(true);
      await onAddComment(targetNodeId, commentText.trim());
      setCommentText('');
    } catch (err) {
      console.error('Failed to add comment:', err);
    } finally {
      setIsPosting(false);
    }
  };

  const handleToggleResolve = async (commentId: string, currentResolved: boolean) => {
    try {
      setResolvingId(commentId);
      await onToggleResolveComment(commentId, currentResolved);
    } catch (err) {
      console.error('Failed to toggle comment resolution:', err);
    } finally {
      setResolvingId(null);
    }
  };

  const handleDelete = async (commentId: string) => {
    try {
      setDeletingId(commentId);
      await onDeleteComment(commentId);
    } catch (err) {
      console.error('Failed to delete comment:', err);
    } finally {
      setDeletingId(null);
    }
  };

  const formatTimestamp = (timestamp: any) => {
    if (!timestamp) return 'Just now';
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      const diffMs = Date.now() - date.getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays < 7) return `${diffDays}d ago`;
      return date.toLocaleDateString();
    } catch {
      return 'Recently';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden select-none pointer-events-auto">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/30 backdrop-blur-2xs transition-opacity"
        onClick={onClose}
      />

      {/* Drawer Container */}
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col border-l border-slate-200">
          {/* 1. Header */}
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-blue-50/70 via-indigo-50/50 to-white">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-xs">
                <MessageSquare size={16} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-bold text-slate-800 text-sm">Node Collaboration</h2>
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700">
                    {comments.length}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Add reviews, notes, and discussion threads to flowchart nodes
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

          {/* 2. Filter Pills */}
          <div className="px-4 py-2.5 border-b border-slate-100 bg-slate-50 flex items-center gap-1.5 overflow-x-auto text-xs">
            <Filter size={12} className="text-slate-400 shrink-0 mr-1" />
            <button
              onClick={() => setFilterMode('all')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer shrink-0 ${
                filterMode === 'all'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              All ({comments.length})
            </button>
            <button
              onClick={() => setFilterMode('selected')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer shrink-0 ${
                filterMode === 'selected'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              Selected Node ({selectedNodeCommentsCount})
            </button>
            <button
              onClick={() => setFilterMode('unresolved')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer shrink-0 ${
                filterMode === 'unresolved'
                  ? 'bg-amber-600 text-white shadow-2xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              Open ({unresolvedCount})
            </button>
            <button
              onClick={() => setFilterMode('resolved')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer shrink-0 ${
                filterMode === 'resolved'
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              Resolved ({resolvedCount})
            </button>
          </div>

          {/* 3. Add Comment Input Box */}
          <div className="p-4 border-b border-slate-200 bg-white">
            <form onSubmit={handleSubmit} className="space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <label className="font-semibold text-slate-700 flex items-center gap-1.5">
                  <Layers size={13} className="text-blue-600" />
                  <span>Attach Comment to Node:</span>
                </label>
                {nodes.length > 0 && (
                  <select
                    value={targetNodeId}
                    onChange={(e) => {
                      setTargetNodeId(e.target.value);
                      onSelectNode(e.target.value);
                    }}
                    className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 max-w-[180px] truncate text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    {nodes.map((n) => (
                      <option key={n.id} value={n.id}>
                        {n.label || 'Untitled Node'}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {nodes.length === 0 ? (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-center gap-2">
                  <AlertCircle size={15} className="shrink-0" />
                  <span>Add at least one node to the canvas before commenting.</span>
                </div>
              ) : (
                <>
                  <div className="relative">
                    <textarea
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                          handleSubmit();
                        }
                      }}
                      placeholder={`Add a note, question, or review for "${nodeMap.get(targetNodeId)?.label || 'this node'}"...`}
                      rows={2}
                      maxLength={1500}
                      className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 text-slate-800 resize-none transition-all"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-0.5">
                    <span className="text-[10px] text-slate-400">
                      Press <kbd className="px-1 py-0.5 bg-slate-100 rounded border border-slate-200">Ctrl+Enter</kbd> to post
                    </span>

                    <button
                      type="submit"
                      disabled={!commentText.trim() || isPosting || isSavingToCloud}
                      className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 text-white disabled:text-slate-400 text-xs font-semibold px-3 py-1.5 rounded-lg shadow-xs transition-colors cursor-pointer disabled:cursor-not-allowed"
                    >
                      {isPosting ? (
                        <>
                          <Loader2 size={13} className="animate-spin" />
                          <span>Posting...</span>
                        </>
                      ) : (
                        <>
                          <Send size={12} />
                          <span>Post Comment</span>
                        </>
                      )}
                    </button>
                  </div>
                </>
              )}
            </form>
          </div>

          {/* 4. Comments List Feed */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#F8FAFC]">
            {filteredComments.length === 0 ? (
              <div className="text-center py-12 px-4 space-y-2 border border-dashed border-slate-200 rounded-2xl bg-white">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
                  <MessageSquare size={20} />
                </div>
                <h4 className="font-bold text-xs text-slate-800">
                  {filterMode === 'selected'
                    ? 'No comments on this node'
                    : filterMode === 'unresolved'
                    ? 'No open comments'
                    : filterMode === 'resolved'
                    ? 'No resolved comments'
                    : 'No comments yet'}
                </h4>
                <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
                  {filterMode === 'selected'
                    ? `Be the first to leave feedback or questions on "${nodeMap.get(targetNodeId)?.label || 'this node'}".`
                    : 'Select any node on the canvas to attach notes and collaborate with your team.'}
                </p>
              </div>
            ) : (
              filteredComments.map((comment) => {
                const node = nodeMap.get(comment.nodeId);
                const isTargetSelected = (selectedNodeId || targetNodeId) === comment.nodeId;
                const isResolving = resolvingId === comment.id;
                const isDeleting = deletingId === comment.id;

                return (
                  <div
                    key={comment.id}
                    className={`bg-white rounded-xl border transition-all p-3.5 space-y-2 shadow-2xs ${
                      comment.resolved
                        ? 'border-emerald-200 bg-emerald-50/20'
                        : isTargetSelected
                        ? 'border-blue-300 ring-1 ring-blue-500/20'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {/* Header: Node Chip + Actions */}
                    <div className="flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setTargetNodeId(comment.nodeId);
                          onSelectNode(comment.nodeId);
                        }}
                        className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-700 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 px-2 py-0.5 rounded-md transition-colors cursor-pointer max-w-[200px] truncate"
                        title="Click to jump and select this node"
                      >
                        <Layers size={11} className="text-blue-600 shrink-0" />
                        <span className="truncate">{node?.label || 'Node (deleted)'}</span>
                      </button>

                      <div className="flex items-center gap-1">
                        {/* Resolve toggle */}
                        <button
                          type="button"
                          onClick={() => handleToggleResolve(comment.id, Boolean(comment.resolved))}
                          disabled={isResolving}
                          className={`flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md transition-colors cursor-pointer ${
                            comment.resolved
                              ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                          title={comment.resolved ? 'Mark as open' : 'Mark as resolved'}
                        >
                          {isResolving ? (
                            <Loader2 size={10} className="animate-spin" />
                          ) : comment.resolved ? (
                            <CheckCircle2 size={11} className="text-emerald-600" />
                          ) : (
                            <Circle size={11} className="text-slate-400" />
                          )}
                          <span>{comment.resolved ? 'Resolved' : 'Resolve'}</span>
                        </button>

                        {/* Delete comment */}
                        <button
                          type="button"
                          onClick={() => handleDelete(comment.id)}
                          disabled={isDeleting}
                          className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Delete comment"
                        >
                          {isDeleting ? (
                            <Loader2 size={12} className="animate-spin text-rose-500" />
                          ) : (
                            <Trash2 size={12} />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Author & Timestamp */}
                    <div className="flex items-center gap-2 pt-0.5">
                      {comment.authorPhotoURL ? (
                        <img
                          src={comment.authorPhotoURL}
                          alt={comment.authorName}
                          className="w-5 h-5 rounded-full border border-slate-200 object-cover"
                        />
                      ) : (
                        <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 font-bold text-[10px] flex items-center justify-center">
                          {comment.authorName?.[0] || 'U'}
                        </div>
                      )}
                      <span className="font-semibold text-xs text-slate-800">
                        {comment.authorName}
                      </span>
                      <span className="text-[10px] text-slate-400 flex items-center gap-1">
                        <Clock size={10} />
                        {formatTimestamp(comment.createdAt)}
                      </span>
                    </div>

                    {/* Comment Content */}
                    <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap pl-7">
                      {comment.content}
                    </p>
                  </div>
                );
              })
            )}
          </div>

          {/* 5. Footer */}
          <div className="p-3 border-t border-slate-200 bg-white flex items-center justify-between text-[11px] text-slate-500 shrink-0">
            <span>Real-time node comments synced</span>
            <button
              onClick={onClose}
              className="font-semibold text-slate-700 hover:text-slate-900 cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
