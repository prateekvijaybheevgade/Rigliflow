export type CadEntityType =
  | 'arch_wall'
  | 'arch_door'
  | 'arch_window'
  | 'arch_room'
  | 'arch_column'
  | 'arch_stair'
  | 'arch_beam'
  | 'arch_dimension'
  | 'arch_furniture'
  | 'arch_sanitary'
  | 'arch_electrical'
  | 'arch_site'
  | 'arch_schedule'
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
  wallThickness?: number; // e.g. 75, 115 (4.5"), 150, 230 (9"), 300
  wallHatch?: 'concrete' | 'brick' | 'solid' | 'cavity' | 'glass' | 'drywall';
  doorSwing?: 'left-in' | 'right-in' | 'left-out' | 'right-out' | 'double' | 'pocket' | 'bifold' | 'garage' | 'revolving';
  doorWidth?: number; // e.g. 750, 900, 1000, 1800, 2400
  doorAngle?: number; // 90 or 180
  windowType?: 'standard' | 'bay' | 'slider' | 'casement' | 'clerestory' | 'louver' | 'picture' | 'corner' | 'skylight';
  roomArea?: string; // e.g. "21.5 m² (231 sq ft)"
  roomType?: 'living' | 'bedroom' | 'kitchen' | 'bathroom' | 'office' | 'balcony' | 'terrace' | 'dining' | 'foyer' | 'garage' | 'utility';
  dimensionText?: string;
  columnShape?: 'square' | 'circle' | 'ibeam' | 'pier';
  stairType?: 'straight' | 'l-shape' | 'u-shape' | 'spiral' | 'elevator';
  furnitureType?:
    | 'bed'
    | 'sofa'
    | 'dining'
    | 'toilet'
    | 'desk'
    | 'sectional'
    | 'armchair'
    | 'coffee'
    | 'island'
    | 'counter'
    | 'sink'
    | 'wardrobe'
    | 'bookcase'
    | 'tv';
  sanitaryType?: 'toilet' | 'sink' | 'bathtub' | 'shower' | 'urinal' | 'washer' | 'double-sink';
  electricalType?: 'light' | 'switch' | 'socket' | 'panel' | 'fan' | 'ac' | 'sensor' | 'cctv' | 'wifi' | 'chandelier';
  siteType?: 'tree' | 'palm' | 'shrub' | 'pool' | 'paving' | 'boundary' | 'parking';
  scheduleType?: 'doors-windows' | 'room-finish' | 'notes' | 'key-plan';
  mepRating?: string;
}

export interface CadLayer {
  id: string;
  name: string; // e.g. "A-WALL", "A-DOOR", "A-GLAZ", "A-DIMS", "P-FIXT", "E-LITE"
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
  canvasBg: string; // '#F8FAFC' (Light) or '#0B1E36' (Blueprint Navy)
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
    description: 'Swing, Sliding & French Doors',
    color: '#F59E0B',
    visible: true,
    locked: false,
    lineWeight: 0.25,
  },
  {
    id: 'layer_window',
    name: 'A-GLAZ',
    description: 'Windows, Glazing & Storefronts',
    color: '#0284C7',
    visible: true,
    locked: false,
    lineWeight: 0.25,
  },
  {
    id: 'layer_column',
    name: 'S-COLS',
    description: 'Reinforced Columns, Pillars & Piers',
    color: '#F43F5E',
    visible: true,
    locked: false,
    lineWeight: 0.7,
  },
  {
    id: 'layer_stair',
    name: 'S-CIRC',
    description: 'Stairs, Risers & Elevator Cores',
    color: '#D97706',
    visible: true,
    locked: false,
    lineWeight: 0.35,
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
    id: 'layer_furniture',
    name: 'A-FURN',
    description: 'Interior Furnishings & Millwork',
    color: '#94A3B8',
    visible: true,
    locked: false,
    lineWeight: 0.25,
  },
  {
    id: 'layer_sanitary',
    name: 'P-FIXT',
    description: 'Plumbing & Sanitary Fixtures',
    color: '#06B6D4',
    visible: true,
    locked: false,
    lineWeight: 0.25,
  },
  {
    id: 'layer_electrical',
    name: 'E-LITE',
    description: 'Electrical, Lighting & Power',
    color: '#EAB308',
    visible: true,
    locked: false,
    lineWeight: 0.25,
  },
  {
    id: 'layer_site',
    name: 'C-SITE',
    description: 'Civil, Site, Trees & Landscaping',
    color: '#10B981',
    visible: true,
    locked: false,
    lineWeight: 0.35,
  },
  {
    id: 'layer_dimension',
    name: 'A-DIMS',
    description: 'Linear Metric Dimensions & Levels',
    color: '#60A5FA',
    visible: true,
    locked: false,
    lineWeight: 0.18,
  },
  {
    id: 'layer_title',
    name: 'A-ANNO',
    description: 'Title Blocks, Grids & Drawing Stamps',
    color: '#64748B',
    visible: true,
    locked: false,
    lineWeight: 0.35,
  },
];
