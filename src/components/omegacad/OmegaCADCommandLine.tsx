import React, { useState, useRef, useEffect } from 'react';
import { Terminal, Send, HelpCircle } from 'lucide-react';

interface OmegaCADCommandLineProps {
  onExecuteCommand: (cmd: string) => void;
  lastMessage?: string;
}

export const OmegaCADCommandLine: React.FC<OmegaCADCommandLineProps> = ({
  onExecuteCommand,
  lastMessage,
}) => {
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<string[]>([
    'OmegaCAD Plus 15.0 Active. Type a command or press shortcut key.',
  ]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (lastMessage) {
      setHistory((prev) => [...prev.slice(-4), lastMessage]);
    }
  }, [lastMessage]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed) return;

    setHistory((prev) => [...prev.slice(-4), `Command: ${trimmed}`]);
    onExecuteCommand(trimmed);
    setInput('');
  };

  const quickCommands = [
    { label: 'WALL', cmd: 'WALL', desc: 'Add Wall' },
    { label: 'DOOR', cmd: 'DOOR', desc: 'Add Door' },
    { label: 'WIN', cmd: 'WINDOW', desc: 'Add Window' },
    { label: 'COL', cmd: 'COL', desc: 'Add Column' },
    { label: 'ROOM', cmd: 'ROOM', desc: 'Add Room' },
    { label: 'DIM', cmd: 'DIM', desc: 'Add Dimension' },
    { label: 'RO', cmd: 'ROTATE', desc: 'Rotate 90°' },
    { label: 'FIT', cmd: 'FIT', desc: 'Zoom Fit' },
    { label: 'DXF', cmd: 'DXF', desc: 'Export DXF' },
  ];

  return (
    <div className="bg-slate-950/95 border-t border-slate-800 text-slate-200 px-3 py-1.5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 z-20 shrink-0 font-mono text-xs select-none">
      {/* Command prompt & input */}
      <form onSubmit={handleSubmit} className="flex items-center gap-2 flex-1 min-w-0">
        <div className="flex items-center gap-1.5 text-cyan-400 font-bold shrink-0">
          <Terminal size={14} />
          <span className="text-[11px]">Command:</span>
        </div>
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type command (WALL, DOOR, WIN, DIM, RO, DXF, HELP)..."
          className="flex-1 bg-slate-900 border border-slate-800 hover:border-slate-700 focus:border-cyan-500 rounded px-2.5 py-1 text-xs text-white focus:outline-none font-mono"
        />
        <button
          type="submit"
          className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-cyan-400 hover:text-cyan-300 transition-colors cursor-pointer shrink-0"
        >
          <Send size={13} />
        </button>
      </form>

      {/* Quick Command Chips */}
      <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
        {quickCommands.map((q) => (
          <button
            key={q.label}
            type="button"
            onClick={() => onExecuteCommand(q.cmd)}
            className="px-2 py-0.5 rounded bg-slate-900 hover:bg-cyan-950 border border-slate-800 hover:border-cyan-500/50 text-[10px] text-slate-300 hover:text-cyan-300 transition-colors cursor-pointer shrink-0 font-mono"
            title={q.desc}
          >
            {q.label}
          </button>
        ))}
      </div>
    </div>
  );
};
