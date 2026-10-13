export type NodeType =
  | 'process'
  | 'decision'
  | 'start_end'
  | 'database'
  | 'cloud'
  | 'io'
  | 'document'
  | 'subprocess'
  | 'note'
  | 'hexagon'
  | 'triangle'
  | 'server'
  | 'queue'
  | 'actor'
  | 'table'
  | 'frame'
  | 'text'
  | 'cylinder'
  // Architectural & CAD Primitives
  | 'arch_wall'
  | 'arch_door'
  | 'arch_window'
  | 'arch_room'
  | 'arch_dimension'
  | 'arch_column'
  | 'arch_stair'
  | 'arch_furniture'
  | 'arch_titleblock';

export type PortPosition = 'top' | 'right' | 'bottom' | 'left';

export interface Node {
  id: string;
  type: NodeType;
  label: string;
  sublabel?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  textColor?: string;
  borderColor?: string;
  borderStyle?: 'solid' | 'dashed' | 'dotted';
  borderWidth?: number;
  borderRadius?: number;
  fillType?: 'solid' | 'gradient' | 'none';
  opacity?: number;
  shadow?: boolean;
  icon?: string;
  fontSize?: number;
  fontFamily?: 'sans' | 'mono' | 'serif' | 'handwriting';
  fontWeight?: 'normal' | 'bold';
  fontStyle?: 'normal' | 'italic';
  textAlign?: 'left' | 'center' | 'right';
  isLocked?: boolean;

  // Architectural & 2D CAD Properties
  rotation?: number; // 0, 90, 180, 270 degrees
  wallThickness?: number;
  wallHatch?: 'solid' | 'concrete' | 'brick' | 'hollow';
  doorType?: 'single' | 'double' | 'sliding' | 'pocket';
  doorSwing?: 'left' | 'right';
  windowType?: 'standard' | 'double' | 'bay';
  roomType?: string;
  roomArea?: string;
  dimensionText?: string;
  columnShape?: 'square' | 'circle' | 'i_beam';
  furnitureType?: 'bed' | 'sofa' | 'table' | 'toilet' | 'sink' | 'desk';
  scaleUnit?: 'm' | 'mm' | 'ft' | 'in';
}

export interface FlowNode extends Node {
  icon?: string;
}

export interface FlowEdge {
  id: string;
  from: string;
  to: string;
  fromPort: PortPosition;
  toPort: PortPosition;
  label?: string;
  style?: 'solid' | 'dashed' | 'dotted';
  curveType?: 'orthogonal' | 'smooth' | 'straight';
  color?: string;
  arrow?: 'end' | 'both' | 'none';
  strokeWidth?: number;
}

export interface DiagramPage {
  id: string;
  name: string;
  nodes: FlowNode[];
  edges: FlowEdge[];
}

export interface DiagramData {
  id?: string;
  title: string;
  description?: string;
  direction?: 'top-down' | 'left-right';
  nodes: FlowNode[];
  edges: FlowEdge[];
  pages?: DiagramPage[];
  activePageIndex?: number;
  canvasBg?: string;
  gridType?: 'dots' | 'lines' | 'none' | 'blueprint' | 'engineering';
  pageView?: boolean;
  originalImageUrl?: string;
  studioMode?: 'flowchart' | 'architecture';
  measurementUnit?: 'metric' | 'imperial';
  scaleRatio?: number;
}

export interface Point {
  x: number;
  y: number;
}

export interface DraggingPortState {
  nodeId: string;
  port: PortPosition;
  startPoint: Point;
  currentPoint: Point;
}
