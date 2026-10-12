import React, { useState } from 'react';
import { FlowEdge, FlowNode } from '../types/flowchart';
import { getPortCoordinates, calculateEdgePath } from '../utils/geometry';
import { Trash2 } from 'lucide-react';

interface EdgeComponentProps {
  edge: FlowEdge;
  fromNode: FlowNode;
  toNode: FlowNode;
  isSelected: boolean;
  onSelect: (edgeId: string) => void;
  onDelete: (edgeId: string) => void;
  onUpdateLabel: (edgeId: string, label: string) => void;
}

export const EdgeComponent: React.FC<EdgeComponentProps> = ({
  edge,
  fromNode,
  toNode,
  isSelected,
  onSelect,
  onDelete,
  onUpdateLabel,
}) => {
  const [isEditingLabel, setIsEditingLabel] = useState(false);
  const [labelVal, setLabelVal] = useState(edge.label || '');

  const start = getPortCoordinates(fromNode, edge.fromPort);
  const end = getPortCoordinates(toNode, edge.toPort);

  const { path, labelPoint } = calculateEdgePath(
    start,
    end,
    edge.fromPort,
    edge.toPort,
    edge.curveType || 'orthogonal'
  );

  const strokeColor = isSelected ? '#2563EB' : edge.color || '#64748B';
  const strokeDash =
    edge.style === 'dashed' ? '6,5' : edge.style === 'dotted' ? '3,3' : undefined;
  const strokeWidth = isSelected ? 2.5 : edge.strokeWidth || 2;

  const handleFinishEditing = () => {
    setIsEditingLabel(false);
    onUpdateLabel(edge.id, labelVal);
  };

  return (
    <g className="cursor-pointer group">
      {/* Invisible wider hit-target for effortless selection */}
      <path
        d={path}
        fill="none"
        stroke="transparent"
        strokeWidth="18"
        onClick={(e) => {
          e.stopPropagation();
          onSelect(edge.id);
        }}
      />

      {/* Selected glow */}
      {isSelected && (
        <path
          d={path}
          fill="none"
          stroke="#93C5FD"
          strokeWidth="6"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.6"
        />
      )}

      {/* Visible Path */}
      <path
        d={path}
        fill="none"
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        strokeDasharray={strokeDash}
        strokeLinecap="round"
        strokeLinejoin="round"
        markerEnd={`url(#arrow-head-${edge.id})`}
        onClick={(e) => {
          e.stopPropagation();
          onSelect(edge.id);
        }}
      />

      {/* Edge Arrowhead Marker */}
      <defs>
        <marker
          id={`arrow-head-${edge.id}`}
          viewBox="0 0 10 10"
          refX="7"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto-start-reverse"
        >
          <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill={strokeColor} />
        </marker>
      </defs>

      {/* Label Badge */}
      {edge.label && !isEditingLabel && (
        <g
          transform={`translate(${labelPoint.x}, ${labelPoint.y})`}
          onClick={(e) => {
            e.stopPropagation();
            onSelect(edge.id);
          }}
          onDoubleClick={(e) => {
            e.stopPropagation();
            setIsEditingLabel(true);
            setLabelVal(edge.label || '');
          }}
        >
          <rect
            x={-(edge.label.length * 4 + 10)}
            y="-11"
            width={edge.label.length * 8 + 20}
            height="22"
            rx="11"
            fill="#FFFFFF"
            stroke={isSelected ? '#3B82F6' : '#E2E8F0'}
            strokeWidth={isSelected ? 1.5 : 1}
            className="filter drop-shadow-sm"
          />
          <text
            x="0"
            y="4"
            textAnchor="middle"
            fill={isSelected ? '#1D4ED8' : '#334155'}
            fontSize="11"
            fontWeight="600"
            fontFamily="system-ui, sans-serif"
            className="select-none pointer-events-none"
          >
            {edge.label}
          </text>
        </g>
      )}

      {/* Inline Label Editing Form */}
      {isEditingLabel && (
        <foreignObject
          x={labelPoint.x - 70}
          y={labelPoint.y - 15}
          width="140"
          height="32"
          className="overflow-visible"
        >
          <div className="flex items-center gap-1 bg-white p-1 rounded-full shadow-md border border-blue-500">
            <input
              type="text"
              autoFocus
              value={labelVal}
              onChange={(e) => setLabelVal(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleFinishEditing();
                if (e.key === 'Escape') setIsEditingLabel(false);
              }}
              onBlur={handleFinishEditing}
              className="text-xs px-2 py-0.5 w-full rounded focus:outline-none text-slate-800 font-medium"
              placeholder="Edge label"
            />
          </div>
        </foreignObject>
      )}

      {/* Quick Delete Badge on Selection */}
      {isSelected && !isEditingLabel && (
        <g
          transform={`translate(${labelPoint.x + 28}, ${labelPoint.y - 12})`}
          onClick={(e) => {
            e.stopPropagation();
            onDelete(edge.id);
          }}
          className="cursor-pointer hover:scale-110 transition-transform"
        >
          <circle cx="0" cy="0" r="10" fill="#EF4444" />
          <path
            d="M -3 -3 L 3 3 M 3 -3 L -3 3"
            stroke="#FFFFFF"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </g>
      )}
    </g>
  );
};
