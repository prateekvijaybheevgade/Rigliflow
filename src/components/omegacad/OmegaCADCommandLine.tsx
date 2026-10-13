import React, { useState, useRef, useEffect } from 'react';
import { Terminal, Send, Check } from 'lucide-react';

interface OmegaCADCommandLineProps {
  onExecuteCommand: (cmd: string) => void;
  lastMessage?: string;
  orthoMode?: boolean;
}

export const OmegaCADCommandLine: React.FC<OmegaCADCommandLineProps> = ({
  onExecuteCommand,
  lastMessage,
  orthoMode = true,
}) => {
  const [input, setInput] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (lastMessage) {
      setFeedback(lastMessage);
      const timer = setTimeout(() => setFeedback(null), 3500);
      return () => clearTimeout(timer);
    }
  }, [lastMessage]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed) return;

    onExecuteCommand(trimmed);
    setInput('');
  };

  const quickCommands = [
    { label: 'WALL', cmd: 'WALL', desc: 'Add Wall' },
    { label: 'DOOR', cmd: 'DOOR', desc: 'Add Door' },
    { label: 'WIN', cmd: 'WINDOW', desc: 'Add Window' },
    { label: 'COL', cmd: 'COL', desc: 'Add Column' },
    { label: 'STAIR', cmd: 'STAIR', desc: 'Add Staircase' },
    { label: 'ROOM', cmd: 'ROOM', desc: 'Add Room' },
    { label: 'DIM', cmd: 'DIM', desc: 'Add Dimension' },
    { label: 'OFFSET', cmd: 'OFFSET', desc: 'Parallel Wall Offset' },
    { label: 'MIRROR', cmd: 'MIRROR', desc: 'Mirror Flip' },
    { label: 'ARRAY', cmd: 'ARRAY', desc: 'Linear Repeat Array' },
    { label: 'AUTODIM', cmd: 'AUTODIM', desc: 'Auto-Dimension Floor Plan' },
    { label: 'DXF', cmd: 'DXF', desc: 'Export AutoCAD DXF' },
  ];

  return (
    <footer className="h-9 bg-white/95 backdrop-blur-md border-t border-slate-200/90 px-3 flex items-center justify-between z-30 select-none shadow-[0_-1px_2px_rgba(0,0,0,0.02)] text-xs text-slate-600 gap-3">
      {/* 1. Command Input Field */}
      <form onSubmit={handleSubmit} className="flex items-center gap-2 flex-1 min-w-0 max-w-xl">
        <div className="flex items-center gap-1.5 text-blue-600 font-bold shrink-0">
          <Terminal size={13} />
          <span className="text-[11px] font-mono">CAD:</span>
        </div>
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type command (WALL, DOOR, WIN, COL, STAIR, OFFSET, MIRROR, ARRAY, AUTODIM, DXF, HELP)..."
          className="flex-1 bg-transparent text-xs text-slate-800 placeholder-slate-400 focus:outline-none font-mono min-w-0"
        />
        <button
          type="submit"
          className="p-1 rounded text-slate-400 hover:text-blue-600 transition-colors cursor-pointer shrink-0"
          title="Execute Command (Enter)"
        >
          <Send size={12} />
        </button>
      </form>

      {/* 2. Feedback Notification or Quick Command Chips */}
      <div className="flex items-center gap-1.5 shrink-0">
        {feedback ? (
          <div className="flex items-center gap-1.5 bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded text-[10.5px] font-medium animate-in fade-in duration-150">
            <Check size={11} className="text-blue-600" />
            <span>{feedback}</span>
          </div>
        ) : (
          <div className="hidden lg:flex items-center gap-1 overflow-x-auto scrollbar-none py-0.5">
            {quickCommands.map((q) => (
              <button
                key={q.label}
                type="button"
                onClick={() => onExecuteCommand(q.cmd)}
                className="px-1.5 py-0.5 rounded bg-slate-100 hover:bg-blue-50 hover:text-blue-700 border border-slate-200/80 text-[10px] font-mono text-slate-600 transition-colors cursor-pointer shrink-0 font-medium"
                title={q.desc}
              >
                {q.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 3. Live Drafting Status */}
      <div className="hidden md:flex items-center gap-2 text-[11px] text-slate-400 font-mono shrink-0">
        <span className={orthoMode ? 'text-blue-600 font-bold' : 'text-slate-400'}>
          ORTHO: {orthoMode ? 'ON' : 'OFF'}
        </span>
        <span aria-hidden="true">·</span>
        <span>SNAP: 10mm</span>
        <span aria-hidden="true">·</span>
        <span className="text-slate-600 font-medium">100+ CAD Tools Active</span>
      </div>
    </footer>
  );
};
