import React, { useState, useRef, useEffect } from 'react';
import { FlowNode, PortPosition, Point } from '../types/flowchart';
import * as LucideIcons from 'lucide-react';
import {
  MessageSquare,
  Lock,
  Pencil,
  Copy,
  Trash2,
  Sliders,
  Check,
  ZoomIn,
  ZoomOut,
  Maximize2,
} from 'lucide-react';

interface NodeComponentProps {
  node: FlowNode;
  isSelected: boolean;
  onSelect: (nodeId: string, multi: boolean) => void;
  onDragStart: (e: React.MouseEvent, node: FlowNode) => void;
  onTouchDragStart?: (e: React.TouchEvent, node: FlowNode) => void;
  onResizeStart?: (
    e: React.MouseEvent | React.TouchEvent,
    handle: 'nw' | 'ne' | 'se' | 'sw',
    node: FlowNode
  ) => void;
  onPortMouseDown: (e: React.MouseEvent, nodeId: string, port: PortPosition) => void;
  onPortTouchStart?: (e: React.TouchEvent, nodeId: string, port: PortPosition) => void;
  onUpdateText: (nodeId: string, label: string, sublabel?: string) => void;
  onDuplicateNode?: (nodeId: string) => void;
  onDeleteNode?: (nodeId: string) => void;
  onOpenProperties?: (nodeId: string) => void;
  onScaleNode?: (nodeId: string, factor: number) => void;
  onFocusNode?: (node: FlowNode) => void;
  zoom: number;
  commentCount?: number;
  hasUnresolvedComments?: boolean;
  onOpenComments?: (nodeId: string) => void;
}

export const NodeComponent: React.FC<NodeComponentProps> = ({
  node,
  isSelected,
  onSelect,
  onDragStart,
  onTouchDragStart,
  onResizeStart,
  onPortMouseDown,
  onPortTouchStart,
  onUpdateText,
  onDuplicateNode,
  onDeleteNode,
  onOpenProperties,
  onScaleNode,
  onFocusNode,
  zoom,
  commentCount,
  hasUnresolvedComments,
  onOpenComments,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [labelVal, setLabelVal] = useState(node.label);
  const [sublabelVal, setSublabelVal] = useState(node.sublabel || '');
  const inputRef = useRef<HTMLInputElement>(null);
  const lastTouchTimeRef = useRef<number>(0);

  useEffect(() => {
    setLabelVal(node.label);
    setSublabelVal(node.sublabel || '');
  }, [node.label, node.sublabel]);

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isEditing]);

  const handleFinishEditing = () => {
    setIsEditing(false);
    onUpdateText(node.id, labelVal, sublabelVal);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleFinishEditing();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setLabelVal(node.label);
      setSublabelVal(node.sublabel || '');
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    e.stopPropagation();
    if (isEditing) return;
    const now = Date.now();
    const timeSinceLastTap = now - lastTouchTimeRef.current;
    lastTouchTimeRef.current = now;

    if (timeSinceLastTap < 320 && !node.isLocked) {
      e.preventDefault();
      setIsEditing(true);
      return;
    }

    onSelect(node.id, false);
    if (!node.isLocked && onTouchDragStart) {
      onTouchDragStart(e, node);
    }
  };

  // Resolve Lucide Icon with aliases (e.g. Warning -> AlertTriangle)
  const resolveIcon = (iconName?: string) => {
    if (!iconName) return null;
    const name = iconName.trim();
    if (name === 'Warning' || name === 'warning') {
      return (LucideIcons as any)['AlertTriangle'] || (LucideIcons as any)['AlertCircle'];
    }
    if (name === 'Check' || name === 'check') {
      return (LucideIcons as any)['CheckCircle2'] || (LucideIcons as any)['CheckCircle'];
    }
    return (LucideIcons as any)[name] || null;
  };

  const IconComponent = resolveIcon(node.icon);

  const color = node.color || '#3B82F6';
  const textColor = node.textColor || '#0F172A';
  const borderColor = node.borderColor || color;
  const strokeWidth = node.borderWidth ?? (isSelected ? 2.5 : 2);
  const dashArray =
    node.borderStyle === 'dashed'
      ? '6,4'
      : node.borderStyle === 'dotted'
      ? '2,3'
      : undefined;

  const fillOpacity =
    node.fillType === 'none'
      ? 0
      : node.fillType === 'gradient'
      ? 0.25
      : 0.12;
  const fillColor = node.fillType === 'none' ? 'none' : color;
  const nodeOpacity = node.opacity !== undefined ? node.opacity : 1;
  const rxRadius = node.borderRadius ?? 10;

  const w = node.width;
  const h = node.height;

  // Ports
  const ports: PortPosition[] = ['top', 'right', 'bottom', 'left'];

  const getPortStyle = (port: PortPosition): React.CSSProperties => {
    switch (port) {
      case 'top':
        return { top: -7, left: '50%', transform: 'translateX(-50%)' };
      case 'right':
        return { top: '50%', right: -7, transform: 'translateY(-50%)' };
      case 'bottom':
        return { bottom: -7, left: '50%', transform: 'translateX(-50%)' };
      case 'left':
        return { top: '50%', left: -7, transform: 'translateY(-50%)' };
    }
  };

  const fontFamily =
    node.fontFamily === 'mono'
      ? 'ui-monospace, monospace'
      : node.fontFamily === 'serif'
      ? 'ui-serif, Georgia, serif'
      : node.fontFamily === 'handwriting'
      ? 'Caveat, "Comic Sans MS", cursive'
      : 'inherit';

  const filterStyle = node.shadow
    ? isSelected
      ? 'drop-shadow(0 0 0 2px #3B82F6) drop-shadow(0 14px 24px rgba(0,0,0,0.2))'
      : 'drop-shadow(0 12px 20px rgba(0,0,0,0.15))'
    : isSelected
    ? 'drop-shadow(0 0 0 2px #3B82F6) drop-shadow(0 10px 15px rgba(0,0,0,0.1))'
    : 'drop-shadow(0 4px 6px rgba(0,0,0,0.05))';

  return (
    <div
      className={`group absolute select-none transition-shadow ${
        node.isLocked ? 'cursor-default' : 'cursor-move'
      } ${isSelected ? 'z-30' : 'z-20 hover:z-25'}`}
      style={{
        left: node.x,
        top: node.y,
        width: w,
        height: h,
        opacity: nodeOpacity,
        touchAction: 'none',
      }}
      onMouseDown={(e) => {
        if (isEditing) return;
        if (e.button === 0) {
          // Left click on node - prevent canvas from stealing selection & pan
          e.stopPropagation();
          onSelect(node.id, e.shiftKey || e.ctrlKey || e.metaKey);
          if (!node.isLocked) {
            onDragStart(e, node);
          }
        }
      }}
      onTouchStart={handleTouchStart}
      onDoubleClick={(e) => {
        if (node.isLocked) return;
        e.stopPropagation();
        setIsEditing(true);
      }}
    >
      {/* Background SVG Shape */}
      <svg
        className="absolute inset-0 pointer-events-none w-full h-full overflow-visible"
        style={{ filter: filterStyle }}
      >
        <defs>
          {node.fillType === 'gradient' && (
            <linearGradient id={`grad-${node.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={color} stopOpacity="0.35" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0.05" />
            </linearGradient>
          )}
        </defs>

        {node.type === 'start_end' && (
          <rect
            x="1"
            y="1"
            width={w - 2}
            height={h - 2}
            rx={(h - 2) / 2}
            fill={node.fillType === 'gradient' ? `url(#grad-${node.id})` : fillColor}
            fillOpacity={node.fillType === 'gradient' ? 1 : fillOpacity}
            stroke={borderColor}
            strokeWidth={strokeWidth}
            strokeDasharray={dashArray}
          />
        )}

        {node.type === 'decision' && (
          <polygon
            points={`${w / 2},2 ${w - 2},${h / 2} ${w / 2},${h - 2} 2,${h / 2}`}
            fill={node.fillType === 'gradient' ? `url(#grad-${node.id})` : fillColor}
            fillOpacity={node.fillType === 'gradient' ? 1 : fillOpacity}
            stroke={borderColor}
            strokeWidth={strokeWidth}
            strokeDasharray={dashArray}
          />
        )}

        {node.type === 'hexagon' && (
          <polygon
            points={`${w * 0.22},2 ${w * 0.78},2 ${w - 2},${h / 2} ${w * 0.78},${h - 2} ${w * 0.22},${h - 2} 2,${h / 2}`}
            fill={node.fillType === 'gradient' ? `url(#grad-${node.id})` : fillColor}
            fillOpacity={node.fillType === 'gradient' ? 1 : fillOpacity}
            stroke={borderColor}
            strokeWidth={strokeWidth}
            strokeDasharray={dashArray}
          />
        )}

        {node.type === 'triangle' && (
          <polygon
            points={`${w / 2},2 ${w - 2},${h - 2} 2,${h - 2}`}
            fill={node.fillType === 'gradient' ? `url(#grad-${node.id})` : fillColor}
            fillOpacity={node.fillType === 'gradient' ? 1 : fillOpacity}
            stroke={borderColor}
            strokeWidth={strokeWidth}
            strokeDasharray={dashArray}
          />
        )}

        {(node.type === 'database' || node.type === 'cylinder') && (
          <g>
            <path
              d={`M 2 12 L 2 ${h - 14} A ${w / 2 - 2} 12 0 0 0 ${w - 2} ${h - 14} L ${w - 2} 12 Z`}
              fill={node.fillType === 'gradient' ? `url(#grad-${node.id})` : fillColor}
              fillOpacity={node.fillType === 'gradient' ? 1 : fillOpacity}
              stroke={borderColor}
              strokeWidth={strokeWidth}
              strokeDasharray={dashArray}
            />
            <ellipse
              cx={w / 2}
              cy={12}
              rx={w / 2 - 2}
              ry={10}
              fill={color}
              fillOpacity="0.25"
              stroke={borderColor}
              strokeWidth={strokeWidth}
            />
            <ellipse
              cx={w / 2}
              cy={h - 14}
              rx={w / 2 - 2}
              ry={10}
              fill="none"
              stroke={borderColor}
              strokeWidth={strokeWidth}
            />
          </g>
        )}

        {node.type === 'server' && (
          <g>
            <rect
              x="2"
              y="2"
              width={w - 4}
              height={h - 4}
              rx={rxRadius}
              fill={node.fillType === 'gradient' ? `url(#grad-${node.id})` : fillColor}
              fillOpacity={node.fillType === 'gradient' ? 1 : fillOpacity}
              stroke={borderColor}
              strokeWidth={strokeWidth}
              strokeDasharray={dashArray}
            />
            <line x1="8" y1={h * 0.35} x2={w - 8} y2={h * 0.35} stroke={borderColor} strokeWidth="1" strokeOpacity="0.4" />
            <line x1="8" y1={h * 0.65} x2={w - 8} y2={h * 0.65} stroke={borderColor} strokeWidth="1" strokeOpacity="0.4" />
            <circle cx={w - 14} cy={h * 0.18} r="2.5" fill="#10B981" />
            <circle cx={w - 22} cy={h * 0.18} r="2.5" fill="#3B82F6" />
          </g>
        )}

        {node.type === 'queue' && (
          <g>
            <rect
              x="12"
              y="2"
              width={w - 24}
              height={h - 4}
              fill={node.fillType === 'gradient' ? `url(#grad-${node.id})` : fillColor}
              fillOpacity={node.fillType === 'gradient' ? 1 : fillOpacity}
              stroke={borderColor}
              strokeWidth={strokeWidth}
              strokeDasharray={dashArray}
            />
            <path
              d={`M ${w - 12} 2 A 10 ${(h - 4) / 2} 0 0 1 ${w - 12} ${h - 2}`}
              fill={node.fillType === 'gradient' ? `url(#grad-${node.id})` : fillColor}
              fillOpacity={node.fillType === 'gradient' ? 1 : fillOpacity}
              stroke={borderColor}
              strokeWidth={strokeWidth}
            />
            <path
              d={`M 12 2 A 10 ${(h - 4) / 2} 0 0 0 12 ${h - 2}`}
              fill={node.fillType === 'gradient' ? `url(#grad-${node.id})` : fillColor}
              fillOpacity={node.fillType === 'gradient' ? 1 : fillOpacity}
              stroke={borderColor}
              strokeWidth={strokeWidth}
            />
            <line x1={w * 0.35} y1="4" x2={w * 0.35} y2={h - 4} stroke={borderColor} strokeWidth="1" strokeOpacity="0.4" />
            <line x1={w * 0.65} y1="4" x2={w * 0.65} y2={h - 4} stroke={borderColor} strokeWidth="1" strokeOpacity="0.4" />
          </g>
        )}

        {node.type === 'actor' && (
          <g>
            <circle
              cx={w / 2}
              cy={h * 0.22}
              r={Math.min(w, h) * 0.15}
              fill={fillColor}
              fillOpacity={fillOpacity}
              stroke={borderColor}
              strokeWidth={strokeWidth}
            />
            <line x1={w / 2} y1={h * 0.37} x2={w / 2} y2={h * 0.72} stroke={borderColor} strokeWidth={strokeWidth} />
            <line x1={w * 0.2} y1={h * 0.5} x2={w * 0.8} y2={h * 0.5} stroke={borderColor} strokeWidth={strokeWidth} />
            <line x1={w * 0.2} y1={h * 0.5} x2={w * 0.8} y2={h * 0.5} stroke={borderColor} strokeWidth={strokeWidth} />
            <line x1={w / 2} y1={h * 0.72} x2={w * 0.28} y2={h - 4} stroke={borderColor} strokeWidth={strokeWidth} />
            <line x1={w / 2} y1={h * 0.72} x2={w * 0.72} y2={h - 4} stroke={borderColor} strokeWidth={strokeWidth} />
          </g>
        )}

        {node.type === 'table' && (
          <g>
            <rect
              x="2"
              y="2"
              width={w - 4}
              height={h - 4}
              rx={rxRadius}
              fill={node.fillType === 'gradient' ? `url(#grad-${node.id})` : fillColor}
              fillOpacity={node.fillType === 'gradient' ? 1 : fillOpacity}
              stroke={borderColor}
              strokeWidth={strokeWidth}
              strokeDasharray={dashArray}
            />
            <rect
              x="2"
              y="2"
              width={w - 4}
              height={26}
              rx={rxRadius}
              fill={borderColor}
              fillOpacity="0.25"
            />
            <line x1="2" y1="28" x2={w - 2} y2="28" stroke={borderColor} strokeWidth="1.5" />
          </g>
        )}

        {node.type === 'frame' && (
          <g>
            <rect
              x="2"
              y="2"
              width={w - 4}
              height={h - 4}
              rx={rxRadius}
              fill={fillColor}
              fillOpacity="0.04"
              stroke={borderColor}
              strokeWidth={strokeWidth}
              strokeDasharray="6,4"
            />
            <path
              d={`M 2 8 L 2 2 Q 2 2 8 2 L ${Math.min(w - 10, 110)} 2 Q ${Math.min(w - 2, 118)} 2 ${Math.min(w - 2, 118)} 8 L ${Math.min(w - 2, 118)} 22 L 2 22 Z`}
              fill={borderColor}
              fillOpacity="0.18"
            />
          </g>
        )}

        {node.type === 'text' && (
          <rect
            x="2"
            y="2"
            width={w - 4}
            height={h - 4}
            fill="transparent"
            stroke={isSelected ? '#3B82F6' : 'transparent'}
            strokeWidth="1"
            strokeDasharray="3,3"
          />
        )}

        {node.type === 'cloud' && (
          <rect
            x="2"
            y="2"
            width={w - 4}
            height={h - 4}
            rx={28}
            fill={node.fillType === 'gradient' ? `url(#grad-${node.id})` : fillColor}
            fillOpacity={node.fillType === 'gradient' ? 1 : fillOpacity}
            stroke={borderColor}
            strokeWidth={strokeWidth}
            strokeDasharray="5,2"
          />
        )}

        {node.type === 'io' && (
          <polygon
            points={`20,2 ${w - 2},2 ${w - 22},${h - 2} 2,${h - 2}`}
            fill={node.fillType === 'gradient' ? `url(#grad-${node.id})` : fillColor}
            fillOpacity={node.fillType === 'gradient' ? 1 : fillOpacity}
            stroke={borderColor}
            strokeWidth={strokeWidth}
            strokeDasharray={dashArray}
          />
        )}

        {node.type === 'document' && (
          <path
            d={`M 2 2 L ${w - 2} 2 L ${w - 2} ${h - 14} Q ${w * 0.75} ${h} ${w * 0.5} ${h - 8} Q ${w * 0.25} ${h - 16} 2 ${h - 6} Z`}
            fill={node.fillType === 'gradient' ? `url(#grad-${node.id})` : fillColor}
            fillOpacity={node.fillType === 'gradient' ? 1 : fillOpacity}
            stroke={borderColor}
            strokeWidth={strokeWidth}
            strokeDasharray={dashArray}
          />
        )}

        {node.type === 'subprocess' && (
          <g>
            <rect
              x="2"
              y="2"
              width={w - 4}
              height={h - 4}
              rx={rxRadius}
              fill={node.fillType === 'gradient' ? `url(#grad-${node.id})` : fillColor}
              fillOpacity={node.fillType === 'gradient' ? 1 : fillOpacity}
              stroke={borderColor}
              strokeWidth={strokeWidth}
              strokeDasharray={dashArray}
            />
            <line x1="14" y1="2" x2="14" y2={h - 2} stroke={borderColor} strokeWidth="1.5" />
            <line x1={w - 14} y1="2" x2={w - 14} y2={h - 2} stroke={borderColor} strokeWidth="1.5" />
          </g>
        )}

        {node.type === 'note' && (
          <g>
            <rect
              x="2"
              y="2"
              width={w - 4}
              height={h - 4}
              rx={4}
              fill="#FEF3C7"
              stroke="#F59E0B"
              strokeWidth={isSelected ? 2.5 : 1.5}
            />
            <polygon
              points={`${w - 14},2 ${w - 2},14 ${w - 14},14`}
              fill="#FDE68A"
              stroke="#F59E0B"
              strokeWidth="1"
            />
          </g>
        )}

        {node.type === 'process' && (
          <rect
            x="1"
            y="1"
            width={w - 2}
            height={h - 2}
            rx={rxRadius}
            fill={node.fillType === 'gradient' ? `url(#grad-${node.id})` : fillColor}
            fillOpacity={node.fillType === 'gradient' ? 1 : fillOpacity}
            stroke={borderColor}
            strokeWidth={strokeWidth}
            strokeDasharray={dashArray}
          />
        )}
      </svg>

      {/* Floating Quick Action Pill for Touch & Quick Edit (When Selected) */}
      {isSelected && !isEditing && (
        <div
          className="absolute -top-11 left-1/2 -translate-x-1/2 z-50 flex items-center gap-1 bg-slate-900/95 text-white px-2 py-1 rounded-full shadow-xl border border-slate-700/80 backdrop-blur-md text-xs pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
        >
          {!node.isLocked && (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-1 px-2 py-0.5 rounded-full hover:bg-slate-800 text-[11px] font-semibold text-blue-300 hover:text-white transition-colors cursor-pointer"
              title="Edit Text (Tap or Double-tap)"
            >
              <Pencil size={11} />
              <span>Edit</span>
            </button>
          )}

          {/* Quick Node Size Controls */}
          {onScaleNode && !node.isLocked && (
            <div className="flex items-center border-l border-slate-700/80 pl-1 ml-0.5 gap-0.5">
              <button
                type="button"
                onClick={() => onScaleNode(node.id, 0.8)}
                className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full hover:bg-slate-800 text-[11px] text-slate-300 hover:text-white transition-colors cursor-pointer"
                title="Decrease Node Size (-20%)"
              >
                <ZoomOut size={11} />
                <span className="text-[10px]">-</span>
              </button>
              <button
                type="button"
                onClick={() => onScaleNode(node.id, 1.25)}
                className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full hover:bg-slate-800 text-[11px] text-slate-300 hover:text-white transition-colors cursor-pointer"
                title="Increase Node Size (+25%)"
              >
                <ZoomIn size={11} />
                <span className="text-[10px]">+</span>
              </button>
            </div>
          )}

          {/* Zoom Canvas to Node Button */}
          {onFocusNode && (
            <button
              type="button"
              onClick={() => onFocusNode(node)}
              className="flex items-center gap-1 px-1.5 py-0.5 rounded-full hover:bg-slate-800 text-[11px] text-amber-300 hover:text-amber-200 transition-colors cursor-pointer border-l border-slate-700/80 pl-1"
              title="Zoom Canvas into Node"
            >
              <Maximize2 size={11} />
              <span className="text-[10px]">Zoom</span>
            </button>
          )}

          {onDuplicateNode && !node.isLocked && (
            <button
              onClick={() => onDuplicateNode(node.id)}
              className="flex items-center gap-1 px-1.5 py-0.5 rounded-full hover:bg-slate-800 text-[11px] text-slate-300 hover:text-white transition-colors cursor-pointer"
              title="Duplicate"
            >
              <Copy size={11} />
            </button>
          )}
          {onOpenProperties && (
            <button
              onClick={() => onOpenProperties(node.id)}
              className="flex items-center gap-1 px-1.5 py-0.5 rounded-full hover:bg-slate-800 text-[11px] text-slate-300 hover:text-white transition-colors cursor-pointer"
              title="Inspect / Style"
            >
              <Sliders size={11} />
            </button>
          )}
          {onDeleteNode && !node.isLocked && (
            <button
              onClick={() => onDeleteNode(node.id)}
              className="flex items-center gap-1 px-1.5 py-0.5 rounded-full hover:bg-rose-950 text-[11px] text-rose-300 hover:text-rose-200 transition-colors cursor-pointer"
              title="Delete"
            >
              <Trash2 size={11} />
            </button>
          )}
        </div>
      )}

      {/* 4 Interactive Corner Resizing Handles (NW, NE, SE, SW) - Enhanced for Mouse & Touch */}
      {isSelected && !node.isLocked && !isEditing && (
        <>
          {/* Top-Left Handle (NW) */}
          <div
            className="absolute flex items-center justify-center cursor-nwse-resize z-45 touch-none"
            style={{ top: -16, left: -16, width: 32, height: 32 }}
            title="Resize (Top-Left)"
            onMouseDown={(e) => {
              e.stopPropagation();
              e.preventDefault();
              onResizeStart?.(e, 'nw', node);
            }}
            onTouchStart={(e) => {
              e.stopPropagation();
              e.preventDefault();
              onResizeStart?.(e, 'nw', node);
            }}
          >
            <div className="w-3.5 h-3.5 rounded-full bg-white border-2 border-blue-600 shadow-md ring-2 ring-white/90 transition-transform hover:scale-125 active:scale-125" />
          </div>

          {/* Top-Right Handle (NE) */}
          <div
            className="absolute flex items-center justify-center cursor-nesw-resize z-45 touch-none"
            style={{ top: -16, right: -16, width: 32, height: 32 }}
            title="Resize (Top-Right)"
            onMouseDown={(e) => {
              e.stopPropagation();
              e.preventDefault();
              onResizeStart?.(e, 'ne', node);
            }}
            onTouchStart={(e) => {
              e.stopPropagation();
              e.preventDefault();
              onResizeStart?.(e, 'ne', node);
            }}
          >
            <div className="w-3.5 h-3.5 rounded-full bg-white border-2 border-blue-600 shadow-md ring-2 ring-white/90 transition-transform hover:scale-125 active:scale-125" />
          </div>

          {/* Bottom-Right Handle (SE) */}
          <div
            className="absolute flex items-center justify-center cursor-nwse-resize z-45 touch-none"
            style={{ bottom: -16, right: -16, width: 32, height: 32 }}
            title="Resize (Bottom-Right)"
            onMouseDown={(e) => {
              e.stopPropagation();
              e.preventDefault();
              onResizeStart?.(e, 'se', node);
            }}
            onTouchStart={(e) => {
              e.stopPropagation();
              e.preventDefault();
              onResizeStart?.(e, 'se', node);
            }}
          >
            <div className="w-3.5 h-3.5 rounded-full bg-white border-2 border-blue-600 shadow-md ring-2 ring-white/90 transition-transform hover:scale-125 active:scale-125" />
          </div>

          {/* Bottom-Left Handle (SW) */}
          <div
            className="absolute flex items-center justify-center cursor-nesw-resize z-45 touch-none"
            style={{ bottom: -16, left: -16, width: 32, height: 32 }}
            title="Resize (Bottom-Left)"
            onMouseDown={(e) => {
              e.stopPropagation();
              e.preventDefault();
              onResizeStart?.(e, 'sw', node);
            }}
            onTouchStart={(e) => {
              e.stopPropagation();
              e.preventDefault();
              onResizeStart?.(e, 'sw', node);
            }}
          >
            <div className="w-3.5 h-3.5 rounded-full bg-white border-2 border-blue-600 shadow-md ring-2 ring-white/90 transition-transform hover:scale-125 active:scale-125" />
          </div>
        </>
      )}

      {/* Node Content */}
      <div
        className="relative w-full h-full flex flex-col items-center justify-center px-3.5 py-2 pointer-events-none"
        style={{
          textAlign: node.textAlign || 'center',
          alignItems:
            node.textAlign === 'left'
              ? 'flex-start'
              : node.textAlign === 'right'
              ? 'flex-end'
              : 'center',
        }}
      >
        {isEditing ? (
          <div
            className="pointer-events-auto flex flex-col gap-1.5 w-[calc(100%+16px)] -mx-2 bg-white/98 backdrop-blur-md p-2.5 rounded-xl shadow-2xl border-2 border-blue-500 z-50 animate-in fade-in zoom-in-95 duration-100"
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
            onTouchMove={(e) => e.stopPropagation()}
            onTouchEnd={(e) => e.stopPropagation()}
          >
            <input
              ref={inputRef}
              type="text"
              value={labelVal}
              onChange={(e) => setLabelVal(e.target.value)}
              onKeyDown={handleKeyDown}
              className="text-xs font-bold px-2 py-1 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 bg-slate-50 focus:bg-white"
              placeholder="Primary Label"
            />
            <input
              type="text"
              value={sublabelVal}
              onChange={(e) => setSublabelVal(e.target.value)}
              onKeyDown={handleKeyDown}
              className="text-[11px] px-2 py-1 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-600 bg-slate-50 focus:bg-white"
              placeholder="Subtitle / detail (optional)"
            />
            <div className="flex items-center justify-between mt-0.5 pt-1 border-t border-slate-100">
              <span className="text-[10px] text-slate-400">Press Enter or Done</span>
              <button
                type="button"
                onClick={handleFinishEditing}
                className="text-[11px] bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold py-1 px-3 rounded-lg cursor-pointer shadow-sm flex items-center gap-1"
              >
                <Check size={12} />
                <span>Done</span>
              </button>
            </div>
          </div>
        ) : (
          <>
            <div
              className={`flex items-center gap-1.5 mb-0.5 max-w-full ${
                node.textAlign === 'left'
                  ? 'justify-start'
                  : node.textAlign === 'right'
                  ? 'justify-end'
                  : 'justify-center'
              }`}
            >
              {IconComponent && (
                <IconComponent
                  size={15}
                  style={{ color }}
                  className="shrink-0"
                />
              )}
              <span
                className="leading-snug line-clamp-2 max-w-[90%]"
                style={{
                  color: textColor,
                  fontSize: node.fontSize ? `${node.fontSize}px` : '12px',
                  fontFamily,
                  fontWeight: node.fontWeight || '600',
                  fontStyle: node.fontStyle || 'normal',
                }}
              >
                {node.label}
              </span>
            </div>

            {node.sublabel && (
              <span
                className="text-[10px] leading-tight text-slate-500 line-clamp-1 max-w-[95%]"
                style={{ fontFamily }}
              >
                {node.sublabel}
              </span>
            )}
          </>
        )}
      </div>

      {/* Lock Indicator */}
      {node.isLocked && (
        <div
          className="absolute top-1.5 right-1.5 z-35 flex items-center justify-center w-4 h-4 rounded bg-slate-800/70 text-white shadow-xs"
          title="Element is locked (cannot be dragged or edited)"
        >
          <Lock size={10} />
        </div>
      )}

      {/* Node Icon Overlay Badge */}
      {IconComponent && !isEditing && (
        <div
          className="absolute -top-2.5 -left-2 z-35 flex items-center justify-center w-6 h-6 rounded-full bg-white shadow-md border pointer-events-none group-hover:scale-110 transition-transform"
          title={`Overlay icon: ${node.icon}`}
          style={{ borderColor: `${color}80` }}
        >
          <IconComponent size={13} style={{ color }} />
        </div>
      )}

      {/* 4 Connection Ports (visible on hover or when selected, unless locked) */}
      {!isEditing &&
        !node.isLocked &&
        ports.map((port) => (
          <div
            key={port}
            className={`absolute w-3.5 h-3.5 rounded-full bg-white border-2 border-blue-500 cursor-crosshair transition-all shadow-sm z-40 ${
              isSelected
                ? 'opacity-100 scale-110 ring-2 ring-blue-400/40'
                : 'opacity-0 group-hover:opacity-100 hover:scale-125'
            }`}
            style={getPortStyle(port)}
            title={`Connect from ${port}`}
            onMouseDown={(e) => {
              e.stopPropagation();
              e.preventDefault();
              onPortMouseDown(e, node.id, port);
            }}
            onTouchStart={(e) => {
              e.stopPropagation();
              onPortTouchStart?.(e, node.id, port);
            }}
          >
            {/* Enlarged Touch Hit Area (28px) for Mobile & Tablets */}
            <div className="absolute -inset-2 bg-transparent rounded-full" />
          </div>
        ))}

      {/* Node Collaboration Comment Badge */}
      {onOpenComments && (
        <div
          className={`absolute -top-3 -right-2 z-50 transition-all ${
            (commentCount ?? 0) > 0
              ? 'opacity-100 scale-100'
              : 'opacity-0 group-hover:opacity-100 scale-90 group-hover:scale-100'
          }`}
        >
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpenComments(node.id);
            }}
            className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full shadow-md border cursor-pointer transition-transform hover:scale-110 active:scale-95 ${
              hasUnresolvedComments
                ? 'bg-amber-500 text-white border-amber-400 shadow-amber-500/30'
                : (commentCount ?? 0) > 0
                ? 'bg-blue-600 text-white border-blue-500 shadow-blue-600/30'
                : 'bg-white text-slate-600 hover:text-blue-600 border-slate-300 hover:border-blue-400'
            }`}
            title={
              (commentCount ?? 0) > 0
                ? `${commentCount} comment${(commentCount ?? 0) > 1 ? 's' : ''} on this node`
                : 'Add comment to this node'
            }
          >
            <MessageSquare size={10} className="fill-current" />
            {(commentCount ?? 0) > 0 ? <span>{commentCount}</span> : <span>+</span>}
          </button>
        </div>
      )}
    </div>
  );
};


