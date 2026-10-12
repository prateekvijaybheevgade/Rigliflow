import React, { useState, useRef, useEffect } from 'react';
import {
  Upload,
  Sparkles,
  X,
  FileImage,
  AlertCircle,
  Loader2,
  CheckCircle2,
  ArrowRight,
  Layers,
} from 'lucide-react';
import { SAMPLE_DIAGRAMS, SampleTemplate } from '../utils/samples';
import { DiagramData } from '../types/flowchart';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (diagram: DiagramData, originalImageUrl: string) => void;
}

export const UploadModal: React.FC<UploadModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string>('image/png');
  const [fileName, setFileName] = useState<string>('');
  const [instructions, setInstructions] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Clipboard Paste support
  useEffect(() => {
    if (!isOpen) return;

    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith('image/')) {
          const file = items[i].getAsFile();
          if (file) {
            handleFile(file);
          }
          break;
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [isOpen]);

  // Loading steps animation
  useEffect(() => {
    let interval: any;
    if (isLoading) {
      setLoadingStep(0);
      interval = setInterval(() => {
        setLoadingStep((prev) => (prev < 3 ? prev + 1 : prev));
      }, 1500);
    }
    return () => clearInterval(interval);
  }, [isLoading]);

  if (!isOpen) return null;

  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setErrorMsg('Please upload a valid image file (PNG, JPG, WEBP, SVG).');
      return;
    }

    setErrorMsg(null);
    setMimeType(file.type);
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setSelectedImage(result);
    };
    reader.readAsDataURL(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleSelectSample = (sample: SampleTemplate) => {
    setSelectedImage(sample.thumbnailSvgUrl);
    setMimeType('image/svg+xml');
    setFileName(`${sample.title} (Sample Sketch)`);
  };

  const handleAnalyze = async () => {
    if (!selectedImage) return;

    setIsLoading(true);
    setErrorMsg(null);

    try {
      const response = await fetch('/api/analyze-diagram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: selectedImage,
          mimeType,
          additionalInstructions: instructions,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to analyze diagram image.');
      }

      const analyzedDiagram: DiagramData = {
        title: data.diagram.title || 'Extracted Flowchart',
        description: data.diagram.description || '',
        direction: data.diagram.direction || 'top-down',
        nodes: data.diagram.nodes || [],
        edges: data.diagram.edges || [],
        originalImageUrl: selectedImage,
      };

      onSuccess(analyzedDiagram, selectedImage);
      onClose();
    } catch (err: any) {
      console.error(err);
      setErrorMsg(
        err.message || 'Error communicating with AI vision engine. Please try again or test with another image.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200/90 w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center text-white shadow-xs">
              <Upload size={16} />
            </div>
            <div>
              <h2 className="font-bold text-slate-900 text-sm">
                Upload Image or Diagram
              </h2>
              <p className="text-[11px] text-slate-500">
                AI will reverse-engineer it into an interactive editable flowchart
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
        <div className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {errorMsg && (
            <div className="flex items-center gap-2 p-3 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-xl">
              <AlertCircle size={15} className="shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Upload Dropzone */}
          {!selectedImage ? (
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                dragActive
                  ? 'border-blue-500 bg-blue-50/60 scale-[1.01]'
                  : 'border-slate-300 hover:border-blue-400 hover:bg-slate-50/60 bg-slate-50/30'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
              />
              <div className="w-14 h-14 rounded-2xl bg-blue-100/70 text-blue-600 flex items-center justify-center mb-3 shadow-inner">
                <Upload size={26} />
              </div>
              <p className="font-semibold text-slate-800 text-sm mb-1">
                Drag & drop your diagram, sketch, or whiteboard photo
              </p>
              <p className="text-xs text-slate-500 mb-3">
                Supports PNG, JPG, WEBP, SVG • Or paste with{' '}
                <kbd className="px-1.5 py-0.5 rounded bg-slate-200 font-mono text-[10px]">
                  Ctrl + V
                </kbd>
              </p>
              <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-200/60 hover:bg-blue-100 transition-colors">
                Browse Files
              </span>
            </div>
          ) : (
            <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-16 h-16 rounded-lg overflow-hidden border border-slate-200 bg-white shrink-0">
                  <img
                    src={selectedImage}
                    alt="Upload Preview"
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-xs text-slate-800 truncate">
                    {fileName || 'Uploaded Diagram'}
                  </p>
                  <p className="text-[11px] text-emerald-600 font-medium flex items-center gap-1">
                    <CheckCircle2 size={12} /> Ready for reverse engineering
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedImage(null)}
                className="text-xs text-slate-500 hover:text-rose-600 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-rose-50 transition-colors cursor-pointer"
              >
                Change Image
              </button>
            </div>
          )}

          {/* Quick Preset Samples to try right away */}
          {!selectedImage && (
            <div>
              <div className="flex items-center gap-2 mb-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
                <Layers size={13} />
                <span>Or test with a sample sketch</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {SAMPLE_DIAGRAMS.map((sample) => (
                  <button
                    key={sample.id}
                    onClick={() => handleSelectSample(sample)}
                    className="text-left p-2.5 rounded-xl border border-slate-200 bg-white hover:border-blue-400 hover:bg-blue-50/30 transition-all group cursor-pointer"
                  >
                    <div className="h-16 rounded-lg bg-slate-100 mb-2 overflow-hidden border border-slate-100 flex items-center justify-center">
                      <img
                        src={sample.thumbnailSvgUrl}
                        alt={sample.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    </div>
                    <div className="font-semibold text-xs text-slate-800 group-hover:text-blue-700 truncate">
                      {sample.title}
                    </div>
                    <div className="text-[10px] text-slate-400 truncate">
                      {sample.category}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Additional Guidance / Instructions */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Optional Instructions for AI
            </label>
            <input
              type="text"
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="e.g. Include diamond decision branches, group by backend services, etc."
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-700"
            />
          </div>

          {/* Loading Animation Status */}
          {isLoading && (
            <div className="p-4 bg-blue-50/80 border border-blue-200 rounded-xl space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-blue-900">
                <span className="flex items-center gap-2">
                  <Loader2 size={14} className="animate-spin text-blue-600" />
                  Analyzing Diagram with Flowlify Vision AI...
                </span>
                <span>{Math.min(100, (loadingStep + 1) * 30)}%</span>
              </div>
              <div className="w-full bg-blue-200 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-blue-600 h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, (loadingStep + 1) * 33)}%` }}
                />
              </div>
              <p className="text-[11px] text-blue-700">
                {loadingStep === 0 && 'Scanning diagram lines, shapes, and contours...'}
                {loadingStep === 1 && 'Detecting nodes, database blocks, and text labels...'}
                {loadingStep === 2 && 'Mapping edge connections, decisions, and directions...'}
                {loadingStep >= 3 && 'Synthesizing responsive editable flowchart graph...'}
              </p>
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
            onClick={handleAnalyze}
            disabled={!selectedImage || isLoading}
            className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-semibold px-5 py-2 rounded-xl shadow-sm disabled:opacity-50 transition-all cursor-pointer"
          >
            {isLoading ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                <span>Generating Flowchart...</span>
              </>
            ) : (
              <>
                <span>Convert to Editable Flowchart</span>
                <ArrowRight size={14} />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
