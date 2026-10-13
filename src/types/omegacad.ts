export type CadEntityType =
  | 'arch_wall'
  | 'arch_door'
  | 'arch_window'
  | 'arch_room'
  | 'arch_column'
  | 'arch_dimension'
  | 'arch_furniture'
  | 'arch_titleblock';

export interface CadEntity {
  id: string;
  type: CadEntityType;
  layerId: string;
  label: string;
  sublabel?: string;
  x: number; // in millimeters or canvas mm units
  y: number;
  width: number;
  height: number;
  rotation?: number; // 0, 90, 180, 270
  color?: string;

  // Architectural CAD specifics
  wallThickness?: number; // e.g. 115 (4.5") or 230 (9")
  wallHatch?: 'concrete' | 'brick' | 'solid' | 'hollow';
  doorSwing?: 'left-in' | 'right-in' | 'left-out' | 'right-out';
  doorWidth?: number; // e.g. 750, 900, 1000, 1800
  doorAngle?: number; // 90 or 180
  windowType?: 'standard' | 'bay' | 'slider';
  roomArea?: string; // e.g. "21.5 m² (231 sq ft)"
  roomType?: 'living' | 'bedroom' | 'kitchen' | 'bathroom' | 'office' | 'balcony';
  dimensionText?: string;
  columnShape?: 'square' | 'circle';
  furnitureType?: 'bed' | 'sofa' | 'dining' | 'toilet' | 'desk';
}

export interface CadLayer {
  id: string;
  name: string; // e.g. "A-WALL", "A-DOOR", "A-GLAZ", "A-DIMS"
  description: string;
  color: string;
  visible: boolean;
  locked: boolean;
  lineWeight?: number; // in mm, e.g. 0.35, 0.50
}

export type CadUnit = 'mm' | 'm' | 'in' | 'ft';
export type CadScale = '1:20' | '1:50' | '1:100' | '1:200';

export interface CadDrawing {
  id?: string;
  title: string;
  projectNumber?: string;
  clientName?: string;
  dateCreated?: string;
  scale: CadScale;
  unit: CadUnit;
  canvasBg: string; // default '#0B1E36' (Blueprint Navy) or '#121824' (Charcoal CAD)
  gridSize: number; // in mm, default 100
  layers: CadLayer[];
  entities: CadEntity[];
  originalImageUrl?: string;
}

export const DEFAULT_CAD_LAYERS: CadLayer[] = [
  {
    id: 'layer_wall',
    name: 'A-WALL',
    description: 'Structural & Partition Walls',
    color: '#38BDF8',
    visible: true,
    locked: false,
    lineWeight: 0.5,
  },
  {
    id: 'layer_door',
    name: 'A-DOOR',
    description: 'Swing & Sliding Doors',
    color: '#F59E0B',
    visible: true,
    locked: false,
    lineWeight: 0.25,
  },
  {
    id: 'layer_window',
    name: 'A-GLAZ',
    description: 'Windows & Glazing Units',
    color: '#0284C7',
    visible: true,
    locked: false,
    lineWeight: 0.25,
  },
  {
    id: 'layer_room',
    name: 'A-AREA',
    description: 'Room Zones & Area Calculations',
    color: '#818CF8',
    visible: true,
    locked: false,
    lineWeight: 0.18,
  },
  {
    id: 'layer_column',
    name: 'S-COLS',
    description: 'Reinforced Concrete Columns',
    color: '#F43F5E',
    visible: true,
    locked: false,
    lineWeight: 0.7,
  },
  {
    id: 'layer_dimension',
    name: 'A-DIMS',
    description: 'Linear Metric Dimensions',
    color: '#60A5FA',
    visible: true,
    locked: false,
    lineWeight: 0.18,
  },
  {
    id: 'layer_furniture',
    name: 'A-FURN',
    description: 'Fixtures & Interior Furnishings',
    color: '#94A3B8',
    visible: true,
    locked: false,
    lineWeight: 0.25,
  },
  {
    id: 'layer_title',
    name: 'A-ANNO',
    description: 'Title Block & Drawing Info',
    color: '#F8FAFC',
    visible: true,
    locked: false,
    lineWeight: 0.35,
  },
];
