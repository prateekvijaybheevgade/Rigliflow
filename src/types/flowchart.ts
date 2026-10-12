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
  | 'cylinder';

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
  gridType?: 'dots' | 'lines' | 'none';
  pageView?: boolean;
  originalImageUrl?: string;
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
