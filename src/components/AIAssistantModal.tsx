import React, { useState } from 'react';
import { Sparkles, X, ArrowRight, Loader2, AlertCircle, Wand2 } from 'lucide-react';
import { DiagramData } from '../types/flowchart';

interface AIAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentDiagram: DiagramData;
  onApplyDiagram: (newDiagram: DiagramData) => void;
}

const EXAMPLE_PROMPTS = [
  'OAuth 2.0 PKCE flow with Authorization Server, Token Exchange, and Refresh Token',
  'E-Commerce Return & Refund Dispute Resolution workflow with customer support review',
  'Microservice CI/CD deployment pipeline with Docker build, automated testing, canary rollout, and rollback',
  'AI Retrieval-Augmented Generation (RAG) query lifecycle with vector search and reranking',
];

export const AIAssistantModal: React.FC<AIAssistantModalProps> = ({
  isOpen,
  onClose,
  currentDiagram,
  onApplyDiagram,
}) => {
  const [prompt, setPrompt] = useState('');
  const [mode, setMode] = useState<'create' | 'refine'>('create');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!prompt.trim()) return;

    setIsLoading(true);
    setErrorMsg(null);

    try {
      const endpoint = mode === 'create' ? '/api/generate-flowchart' : '/api/refine-flowchart';
      const body =
        mode === 'create'
          ? { prompt }
          : { currentDiagram, request: prompt };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to process AI flowchart request');
      }

      const generated: DiagramData = {
        title: data.diagram.title || (mode === 'create' ? prompt.slice(0, 30) : currentDiagram.title),
        description: data.diagram.description || '',
        direction: data.diagram.direction || 'top-down',
        nodes: data.diagram.nodes || [],
        edges: data.diagram.edges || [],
        originalImageUrl: currentDiagram.originalImageUrl,
      };

      onApplyDiagram(generated);
      onClose();
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Error communicating with AI engine. Please retry.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200/90 w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center text-white shadow-xs">
              <Sparkles size={15} className="text-amber-400" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900 text-sm">
                AI Flowchart Architect
              </h2>
              <p className="text-[11px] text-slate-500">
                Generate flows or expand existing diagrams with AI
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {errorMsg && (
            <div className="flex items-center gap-2 p-3 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-xl">
              <AlertCircle size={15} className="shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Mode Switcher */}
          <div className="flex bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setMode('create')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                mode === 'create'
                  ? 'bg-white text-slate-800 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Generate New Flow
            </button>
            <button
              onClick={() => setMode('refine')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                mode === 'refine'
                  ? 'bg-white text-slate-800 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Refine / Expand Current Flow
            </button>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              {mode === 'create'
                ? 'Describe the process, workflow, or architecture to build:'
                : 'What would you like to modify or add to the current flowchart?'}
            </label>
            <textarea
              rows={4}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={
                mode === 'create'
                  ? 'e.g. Design a robust Stripe subscription lifecycle with webhook handling, invoice failure retries, and dunning email notifications...'
                  : 'e.g. Add an SMS 2FA verification step after password check, and add a retry loop with max 3 attempts...'
              }
              className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-700 resize-none"
            />
          </div>

          {/* Quick Ideas */}
          {mode === 'create' && (
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                Quick Prompts to try
              </span>
              <div className="flex flex-col gap-1.5">
                {EXAMPLE_PROMPTS.map((ex, idx) => (
                  <button
                    key={idx}
                    onClick={() => setPrompt(ex)}
                    className="text-left text-[11px] text-slate-600 hover:text-indigo-600 bg-slate-50 hover:bg-indigo-50/60 p-2 rounded-lg border border-slate-200/60 transition-colors line-clamp-1 cursor-pointer"
                  >
                    💡 {ex}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-100 bg-slate-50/60 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!prompt.trim() || isLoading}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-5 py-2 rounded-xl shadow-sm disabled:opacity-50 transition-all cursor-pointer"
          >
            {isLoading ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                <span>Generating...</span>
              </>
            ) : (
              <>
                <Wand2 size={14} />
                <span>{mode === 'create' ? 'Create Flowchart' : 'Apply Changes'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
