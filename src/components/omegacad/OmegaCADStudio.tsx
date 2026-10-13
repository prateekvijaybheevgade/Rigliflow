import React, { useState, useCallback } from 'react';
import {
  CadDrawing,
  CadEntity,
  DEFAULT_CAD_LAYERS,
  CadEntityType,
} from '../../types/omegacad';
import { OmegaCADToolbar } from './OmegaCADToolbar';
import { OmegaCADRibbon } from './OmegaCADRibbon';
import { OmegaCADCanvas } from './OmegaCADCanvas';
import { OmegaCADLayerPanel } from './OmegaCADLayerPanel';
import { OmegaCADCommandLine } from './OmegaCADCommandLine';
import { UploadModal } from '../UploadModal';
import { DiagramData } from '../../types/flowchart';
import { downloadDxf } from '../../utils/dxfExport';
import { OmegaCAD3DViewer } from './OmegaCAD3DViewer';

interface OmegaCADStudioProps {
  onBackToHome: () => void;
  onBackToDashboard: () => void;
}

export const OmegaCADStudio: React.FC<OmegaCADStudioProps> = ({
  onBackToHome,
  onBackToDashboard,
}) => {
  // Initial 2BHK Architectural Floor Plan CAD Blueprint
  const [drawing, setDrawing] = useState<CadDrawing>({
    title: '2BHK Residential Floor Plan & CAD Blueprint',
    projectNumber: 'C-2026-A101',
    scale: '1:50',
    unit: 'mm',
    canvasBg: '#F8FAFC',
    gridSize: 100,
    layers: DEFAULT_CAD_LAYERS,
    entities: [
      // Boundary Walls (9" Exterior Concrete)
      { id: 'w_north', type: 'arch_wall', layerId: 'layer_wall', label: 'North Boundary Wall (9.0m)', x: 180, y: 100, width: 720, height: 22, color: '#334155', wallThickness: 230, wallHatch: 'concrete' },
      { id: 'w_south', type: 'arch_wall', layerId: 'layer_wall', label: 'South Boundary Wall (9.0m)', x: 180, y: 620, width: 720, height: 22, color: '#334155', wallThickness: 230, wallHatch: 'concrete' },
      { id: 'w_west', type: 'arch_wall', layerId: 'layer_wall', label: 'West Wall (5.2m)', x: 180, y: 122, width: 22, height: 498, color: '#334155', wallThickness: 230, wallHatch: 'concrete' },
      { id: 'w_east', type: 'arch_wall', layerId: 'layer_wall', label: 'East Wall (5.2m)', x: 878, y: 122, width: 22, height: 498, color: '#334155', wallThickness: 230, wallHatch: 'concrete' },
      // Interior Partition Walls (4.5" Brick)
      { id: 'w_div_vert', type: 'arch_wall', layerId: 'layer_wall', label: 'Bedroom Partition Wall', x: 550, y: 122, width: 14, height: 350, color: '#475569', wallThickness: 115, wallHatch: 'brick' },
      { id: 'w_div_horiz', type: 'arch_wall', layerId: 'layer_wall', label: 'Kitchen Partition Wall', x: 202, y: 470, width: 348, height: 14, color: '#475569', wallThickness: 115, wallHatch: 'brick' },
      // Rooms
      { id: 'room_living', type: 'arch_room', layerId: 'layer_room', label: 'Living & Dining Hall', sublabel: 'Polished Vitrified Tile', x: 210, y: 130, width: 330, height: 330, color: '#3B82F6', roomArea: '22.5 m² (242 sq ft)' },
      { id: 'room_bed', type: 'arch_room', layerId: 'layer_room', label: 'Master Bedroom Suite', sublabel: 'Hardwood Timber Floor', x: 574, y: 130, width: 294, height: 330, color: '#6366F1', roomArea: '18.2 m² (196 sq ft)' },
      { id: 'room_kit', type: 'arch_room', layerId: 'layer_room', label: 'Modular Kitchen & Utility', sublabel: 'Granite Countertop', x: 210, y: 494, width: 240, height: 116, color: '#0D9488', roomArea: '7.2 m² (78 sq ft)' },
      { id: 'room_bath', type: 'arch_room', layerId: 'layer_room', label: 'Ensuite Bathroom', sublabel: 'Anti-skid Ceramic Tiles', x: 574, y: 494, width: 160, height: 116, color: '#0284C7', roomArea: '4.5 m² (48 sq ft)' },
      // Swing Doors
      { id: 'door_main', type: 'arch_door', layerId: 'layer_door', label: 'Main Entry Door D1 (1000mm)', x: 320, y: 80, width: 80, height: 80, color: '#2563EB' },
      { id: 'door_bed', type: 'arch_door', layerId: 'layer_door', label: 'Bedroom Door D2 (900mm)', x: 520, y: 390, width: 70, height: 70, color: '#2563EB' },
      { id: 'door_bath', type: 'arch_door', layerId: 'layer_door', label: 'Bath Door D3 (750mm)', x: 580, y: 450, width: 65, height: 65, color: '#2563EB' },
      // Glazed Windows
      { id: 'win_living', type: 'arch_window', layerId: 'layer_window', label: 'Bay Window W1 (1800mm)', x: 420, y: 94, width: 110, height: 24, color: '#0284C7' },
      { id: 'win_bed', type: 'arch_window', layerId: 'layer_window', label: 'Glazed Window W2 (1200mm)', x: 700, y: 94, width: 90, height: 24, color: '#0284C7' },
      // Structural Columns
      { id: 'col_nw', type: 'arch_column', layerId: 'layer_column', label: 'C1', x: 168, y: 88, width: 36, height: 36, color: '#0F172A' },
      { id: 'col_ne', type: 'arch_column', layerId: 'layer_column', label: 'C2', x: 878, y: 88, width: 36, height: 36, color: '#0F172A' },
      { id: 'col_mid', type: 'arch_column', layerId: 'layer_column', label: 'C3', x: 538, y: 88, width: 36, height: 36, color: '#0F172A' },
      { id: 'col_sw', type: 'arch_column', layerId: 'layer_column', label: 'C4', x: 168, y: 616, width: 36, height: 36, color: '#0F172A' },
      { id: 'col_se', type: 'arch_column', layerId: 'layer_column', label: 'C5', x: 878, y: 616, width: 36, height: 36, color: '#0F172A' },
      // Dimension Lines
      { id: 'dim_total', type: 'arch_dimension', layerId: 'layer_dimension', label: '9.00 m (29\' 6")', dimensionText: 'TOTAL OVERALL SPAN: 9.00 m (29\' 6")', x: 180, y: 50, width: 720, height: 35, color: '#2563EB' },
      // Furniture
      { id: 'furn_bed', type: 'arch_furniture', layerId: 'layer_furniture', label: 'King Bed (1800×2000)', x: 670, y: 190, width: 130, height: 150, color: '#64748B', furnitureType: 'bed' },
      // Title Block
      { id: 'titleblock', type: 'arch_titleblock', layerId: 'layer_title', label: 'OMEGACAD PLUS • 2BHK RESIDENTIAL SUITE', sublabel: 'SHEET A-101 • SCALE 1:50 METRIC', x: 460, y: 660, width: 440, height: 80, color: '#0F172A' },
    ],
  });

  // History stack for Undo/Redo
  const [history, setHistory] = useState<CadDrawing[]>([]);
  const [future, setFuture] = useState<CadDrawing[]>([]);

  // Selection & Viewport State
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);
  const [zoom, setZoom] = useState<number>(0.9);
  const [orthoMode, setOrthoMode] = useState<boolean>(true);
  const [canvasTheme, setCanvasTheme] = useState<'light' | 'blueprint'>('light');
  const [isLayerPanelOpen, setIsLayerPanelOpen] = useState<boolean>(true);
  const [isScanModalOpen, setIsScanModalOpen] = useState<boolean>(false);
  const [cliMessage, setCliMessage] = useState<string | undefined>();
  const [viewMode, setViewMode] = useState<'2d' | 'split' | '3d'>('2d');

  const pushHistory = useCallback(
    (current: CadDrawing) => {
      setHistory((prev) => [...prev.slice(-30), JSON.parse(JSON.stringify(current))]);
      setFuture([]);
    },
    []
  );

  const handleUndo = () => {
    if (history.length === 0) return;
    const previous = history[history.length - 1];
    setHistory((prev) => prev.slice(0, prev.length - 1));
    setFuture((prev) => [JSON.parse(JSON.stringify(drawing)), ...prev]);
    setDrawing(previous);
    setSelectedEntityId(null);
  };

  const handleRedo = () => {
    if (future.length === 0) return;
    const next = future[0];
    setFuture((prev) => prev.slice(1));
    setHistory((prev) => [...prev, JSON.parse(JSON.stringify(drawing))]);
    setDrawing(next);
    setSelectedEntityId(null);
  };

  // Add entity from ribbon or command line
  const handleAddEntity = (preset: any) => {
    pushHistory(drawing);

    const newEntity: CadEntity = {
      ...preset,
      id: `cad_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      x: 350 + Math.floor(Math.random() * 80),
      y: 250 + Math.floor(Math.random() * 80),
      rotation: 0,
    };

    setDrawing((prev) => ({
      ...prev,
      entities: [...prev.entities, newEntity],
    }));
    setSelectedEntityId(newEntity.id);
    setCliMessage(`Added ${preset.label} [ID: ${newEntity.id}]`);
  };

  // Update entity position
  const handleUpdateEntityPosition = (id: string, x: number, y: number) => {
    setDrawing((prev) => ({
      ...prev,
      entities: prev.entities.map((e) => (e.id === id ? { ...e, x, y } : e)),
    }));
  };

  // Update entity dimensions
  const handleUpdateEntityDimensions = (id: string, width: number, height: number) => {
    setDrawing((prev) => ({
      ...prev,
      entities: prev.entities.map((e) => (e.id === id ? { ...e, width, height } : e)),
    }));
  };

  // Rotate entity 90 degrees
  const handleRotateEntity = (id: string) => {
    pushHistory(drawing);
    setDrawing((prev) => ({
      ...prev,
      entities: prev.entities.map((e) => {
        if (e.id === id) {
          const nextRot = ((e.rotation || 0) + 90) % 360;
          return { ...e, rotation: nextRot };
        }
        return e;
      }),
    }));
  };

  // Duplicate entity
  const handleDuplicateEntity = (id: string) => {
    const target = drawing.entities.find((e) => e.id === id);
    if (!target) return;
    pushHistory(drawing);

    const dup: CadEntity = {
      ...JSON.parse(JSON.stringify(target)),
      id: `cad_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      x: target.x + 40,
      y: target.y + 40,
      label: `${target.label} (Copy)`,
    };

    setDrawing((prev) => ({
      ...prev,
      entities: [...prev.entities, dup],
    }));
    setSelectedEntityId(dup.id);
  };

  // Delete entity
  const handleDeleteEntity = (id: string) => {
    pushHistory(drawing);
    setDrawing((prev) => ({
      ...prev,
      entities: prev.entities.filter((e) => e.id !== id),
    }));
    if (selectedEntityId === id) {
      setSelectedEntityId(null);
    }
  };

  // ==========================================
  // MICRO-TOOLS IMPLEMENTATION
  // ==========================================

  // 1. Parallel Offset Tool
  const handleOffsetEntity = (distanceMm: number) => {
    const target = drawing.entities.find((e) => e.id === selectedEntityId);
    if (!target) return;
    pushHistory(drawing);

    const offsetPx = Math.round(distanceMm / 10);
    const offsetClone: CadEntity = {
      ...JSON.parse(JSON.stringify(target)),
      id: `cad_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      x: target.x + offsetPx,
      y: target.y + offsetPx,
      label: `${target.label} (Offset ${distanceMm}mm)`,
    };

    setDrawing((prev) => ({
      ...prev,
      entities: [...prev.entities, offsetClone],
    }));
    setSelectedEntityId(offsetClone.id);
    setCliMessage(`Offset entity parallel by ${distanceMm}mm`);
  };

  // 2. Mirror Tool
  const handleMirrorEntity = (axis: 'horizontal' | 'vertical') => {
    const target = drawing.entities.find((e) => e.id === selectedEntityId);
    if (!target) return;
    pushHistory(drawing);

    const mirrored: CadEntity = {
      ...JSON.parse(JSON.stringify(target)),
      id: `cad_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      x: axis === 'horizontal' ? target.x + target.width + 40 : target.x,
      y: axis === 'vertical' ? target.y + target.height + 40 : target.y,
      rotation: ((target.rotation || 0) + (axis === 'horizontal' ? 180 : 0)) % 360,
      label: `${target.label} (Mirrored)`,
    };

    setDrawing((prev) => ({
      ...prev,
      entities: [...prev.entities, mirrored],
    }));
    setSelectedEntityId(mirrored.id);
    setCliMessage(`Mirrored entity along ${axis} axis`);
  };

  // 3. Array Repeat Tool
  const handleArrayEntity = (count: number, spacingMm: number) => {
    const target = drawing.entities.find((e) => e.id === selectedEntityId);
    if (!target) return;
    pushHistory(drawing);

    const spacingPx = Math.round(spacingMm / 10);
    const newCopies: CadEntity[] = [];

    for (let i = 1; i < count; i++) {
      newCopies.push({
        ...JSON.parse(JSON.stringify(target)),
        id: `cad_${Date.now()}_arr_${i}_${Math.random().toString(36).slice(2, 6)}`,
        x: target.x + spacingPx * i,
        y: target.y,
        label: `${target.label} [Array ${i + 1}]`,
      });
    }

    setDrawing((prev) => ({
      ...prev,
      entities: [...prev.entities, ...newCopies],
    }));
    setCliMessage(`Created linear array of ${count} entities with ${spacingMm}mm spacing`);
  };

  // 4. Auto-Dimensioning Tool
  const handleAutoDimension = () => {
    const target = drawing.entities.find((e) => e.id === selectedEntityId);
    pushHistory(drawing);

    if (target) {
      // Auto-dimension specific selected entity
      const spanDim: CadEntity = {
        id: `dim_span_${Date.now()}`,
        type: 'arch_dimension',
        layerId: 'layer_dimension',
        label: `Width: ${((target.width * 10) / 1000).toFixed(2)}m`,
        dimensionText: `${((target.width * 10) / 1000).toFixed(2)} m (${Math.round((target.width * 10) / 304.8)}' 0")`,
        x: target.x,
        y: Math.max(20, target.y - 45),
        width: target.width,
        height: 35,
        color: '#2563EB',
      };

      const heightDim: CadEntity = {
        id: `dim_depth_${Date.now()}`,
        type: 'arch_dimension',
        layerId: 'layer_dimension',
        label: `Height: ${((target.height * 10) / 1000).toFixed(2)}m`,
        dimensionText: `${((target.height * 10) / 1000).toFixed(2)} m`,
        x: Math.max(20, target.x - 45),
        y: target.y,
        width: 35,
        height: target.height,
        color: '#2563EB',
        rotation: 90,
      };

      setDrawing((prev) => ({
        ...prev,
        entities: [...prev.entities, spanDim, heightDim],
      }));
      setCliMessage(`Auto-dimensioned ${target.label} span & height`);
    } else {
      // Auto-dimension overall bounding box
      let minX = Infinity;
      let maxX = -Infinity;
      let minY = Infinity;
      let maxY = -Infinity;

      drawing.entities.forEach((e) => {
        if (e.type !== 'arch_dimension') {
          minX = Math.min(minX, e.x);
          maxX = Math.max(maxX, e.x + e.width);
          minY = Math.min(minY, e.y);
          maxY = Math.max(maxY, e.y + e.height);
        }
      });

      if (minX !== Infinity && maxX !== -Infinity) {
        const overallW = maxX - minX;
        const totalSpanDim: CadEntity = {
          id: `dim_total_span_${Date.now()}`,
          type: 'arch_dimension',
          layerId: 'layer_dimension',
          label: `Overall Width: ${((overallW * 10) / 1000).toFixed(2)}m`,
          dimensionText: `TOTAL OVERALL SPAN: ${((overallW * 10) / 1000).toFixed(2)} m`,
          x: minX,
          y: Math.max(20, minY - 50),
          width: overallW,
          height: 35,
          color: '#2563EB',
        };

        setDrawing((prev) => ({
          ...prev,
          entities: [...prev.entities, totalSpanDim],
        }));
        setCliMessage(`Generated total overall floor plan span dimension (${((overallW * 10) / 1000).toFixed(2)}m)`);
      }
    }
  };

  // 5. Layer Isolation & Restoration
  const handleIsolateLayer = (layerId: string) => {
    setDrawing((prev) => ({
      ...prev,
      layers: prev.layers.map((l) => ({
        ...l,
        visible: l.id === layerId,
      })),
    }));
    setCliMessage(`Isolated layer: ${layerId}`);
  };

  const handleRestoreAllLayers = () => {
    setDrawing((prev) => ({
      ...prev,
      layers: prev.layers.map((l) => ({ ...l, visible: true })),
    }));
    setCliMessage('Restored visibility of all CAD layers');
  };

  // Command Line Prompt Executer
  const handleExecuteCommand = (rawCmd: string) => {
    const cmd = rawCmd.toUpperCase().trim();

    if (cmd === 'WALL' || cmd === 'W') {
      handleAddEntity({
        type: 'arch_wall',
        layerId: 'layer_wall',
        label: 'Wall Segment (230mm)',
        width: 480,
        height: 22,
        color: '#334155',
        wallThickness: 230,
        wallHatch: 'concrete',
      });
    } else if (cmd === 'DOOR' || cmd === 'D') {
      handleAddEntity({
        type: 'arch_door',
        layerId: 'layer_door',
        label: 'Door (900mm)',
        width: 80,
        height: 80,
        color: '#2563EB',
      });
    } else if (cmd === 'WINDOW' || cmd === 'WIN') {
      handleAddEntity({
        type: 'arch_window',
        layerId: 'layer_window',
        label: 'Window (1200mm)',
        width: 90,
        height: 24,
        color: '#0284C7',
      });
    } else if (cmd === 'COL' || cmd === 'COLUMN' || cmd === 'C') {
      handleAddEntity({
        type: 'arch_column',
        layerId: 'layer_column',
        label: 'Column C (300×300)',
        width: 36,
        height: 36,
        color: '#0F172A',
      });
    } else if (cmd === 'STAIR' || cmd === 'ST') {
      handleAddEntity({
        type: 'arch_stair',
        layerId: 'layer_stair',
        label: 'Staircase Flight (10 Treads)',
        width: 100,
        height: 240,
        color: '#D97706',
        stairType: 'straight',
      });
    } else if (cmd === 'ROOM' || cmd === 'R') {
      handleAddEntity({
        type: 'arch_room',
        layerId: 'layer_room',
        label: 'New Room Space',
        width: 260,
        height: 220,
        color: '#3B82F6',
        roomArea: '14.5 m² (156 sq ft)',
      });
    } else if (cmd === 'DIM' || cmd === 'DIMENSION') {
      handleAddEntity({
        type: 'arch_dimension',
        layerId: 'layer_dimension',
        label: 'Dimension Callout',
        width: 320,
        height: 35,
        color: '#2563EB',
        dimensionText: '3.20 m (10\' 6")',
      });
    } else if (cmd === 'WC' || cmd === 'TOILET') {
      handleAddEntity({
        type: 'arch_sanitary',
        layerId: 'layer_sanitary',
        label: 'Water Closet WC',
        width: 45,
        height: 65,
        color: '#06B6D4',
        sanitaryType: 'toilet',
      });
    } else if (cmd === 'LIGHT' || cmd === 'ELEC') {
      handleAddEntity({
        type: 'arch_electrical',
        layerId: 'layer_electrical',
        label: 'Recessed Downlight',
        width: 25,
        height: 25,
        color: '#EAB308',
        electricalType: 'light',
      });
    } else if (cmd === 'TREE' || cmd === 'SITE') {
      handleAddEntity({
        type: 'arch_site',
        layerId: 'layer_site',
        label: 'Landscape Tree',
        width: 100,
        height: 100,
        color: '#10B981',
        siteType: 'tree',
      });
    } else if (cmd === 'OFFSET' || cmd === 'O') {
      handleOffsetEntity(115);
    } else if (cmd === 'MIRROR' || cmd === 'MI') {
      handleMirrorEntity('horizontal');
    } else if (cmd === 'ARRAY' || cmd === 'AR') {
      handleArrayEntity(3, 1500);
    } else if (cmd === 'AUTODIM' || cmd === 'AD') {
      handleAutoDimension();
    } else if (cmd === 'ROTATE' || cmd === 'RO') {
      if (selectedEntityId) {
        handleRotateEntity(selectedEntityId);
        setCliMessage('Rotated selected entity 90°');
      } else {
        setCliMessage('Select an entity first to rotate');
      }
    } else if (cmd === 'ORTHO') {
      setOrthoMode((prev) => !prev);
      setCliMessage(`Ortho mode: ${!orthoMode ? 'ON' : 'OFF'}`);
    } else if (cmd === 'FIT' || cmd === 'ZOOM FIT') {
      setZoom(0.85);
      setCliMessage('Zoomed to fit floor plan');
    } else if (cmd === 'DXF') {
      downloadDxf(drawing);
      setCliMessage('Exported AutoCAD AC1015 DXF blueprint!');
    } else if (cmd === '3D' || cmd === 'RENDER' || cmd === 'VIEW3D') {
      setViewMode('3d');
      setCliMessage('Switched to 3D Holographic Digital Twin View');
    } else if (cmd === 'SPLIT' || cmd === 'DUAL') {
      setViewMode('split');
      setCliMessage('Activated Split 2D Drafting + 3D Holographic Twin Mode');
    } else if (cmd === '2D' || cmd === 'PLAN') {
      setViewMode('2d');
      setCliMessage('Switched to 2D Precision Drafting Plan');
    } else if (cmd === 'HELP' || cmd === '?') {
      setCliMessage('Commands: WALL, DOOR, WIN, COL, STAIR, ROOM, DIM, WC, LIGHT, TREE, OFFSET, MIRROR, ARRAY, AUTODIM, ROTATE, DXF');
    } else {
      setCliMessage(`Unknown command: "${rawCmd}". Type HELP for available commands.`);
    }
  };

  // Handle AI Sketch-to-CAD extraction
  const handleScanSuccess = (analyzedDiagram: DiagramData) => {
    setIsScanModalOpen(false);

    if (!analyzedDiagram.nodes || analyzedDiagram.nodes.length === 0) return;

    pushHistory(drawing);

    const newEntities: CadEntity[] = analyzedDiagram.nodes.map((node) => ({
      id: node.id,
      type: (node.type?.startsWith('arch_') ? node.type : 'arch_wall') as CadEntityType,
      layerId:
        node.type === 'arch_wall'
          ? 'layer_wall'
          : node.type === 'arch_door'
          ? 'layer_door'
          : node.type === 'arch_window'
          ? 'layer_window'
          : node.type === 'arch_room'
          ? 'layer_room'
          : node.type === 'arch_column'
          ? 'layer_column'
          : node.type === 'arch_dimension'
          ? 'layer_dimension'
          : node.type === 'arch_furniture'
          ? 'layer_furniture'
          : 'layer_title',
      label: node.label,
      sublabel: node.sublabel,
      x: node.x,
      y: node.y,
      width: node.width,
      height: node.height,
      rotation: node.rotation || 0,
      color: node.color,
      wallThickness: node.wallThickness,
      wallHatch: node.wallHatch as any,
      roomArea: node.roomArea,
      dimensionText: node.dimensionText,
      furnitureType: node.furnitureType as any,
    }));

    setDrawing((prev) => ({
      ...prev,
      title: analyzedDiagram.title || 'Extracted CAD Blueprint',
      entities: newEntities,
      originalImageUrl: analyzedDiagram.originalImageUrl,
    }));
    setSelectedEntityId(null);
    setCliMessage(`AI reverse engineered ${newEntities.length} CAD entities from sketch!`);
  };

  const selectedEntity = drawing.entities.find((e) => e.id === selectedEntityId) || null;

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-100 font-sans text-slate-800 antialiased select-none">
      {/* 1. TOP APPLICATION TOOLBAR (Flowlify Executive Styling) */}
      <OmegaCADToolbar
        drawing={drawing}
        onUpdateDrawing={setDrawing}
        onUndo={handleUndo}
        onRedo={handleRedo}
        canUndo={history.length > 0}
        canRedo={future.length > 0}
        zoom={zoom}
        onZoomIn={() => setZoom((z) => Math.min(3.0, z + 0.15))}
        onZoomOut={() => setZoom((z) => Math.max(0.2, z - 0.15))}
        onZoomReset={() => setZoom(1.0)}
        onZoomFit={() => setZoom(0.85)}
        orthoMode={orthoMode}
        onToggleOrtho={() => setOrthoMode(!orthoMode)}
        onOpenScanModal={() => setIsScanModalOpen(true)}
        onToggleLayerPanel={() => setIsLayerPanelOpen(!isLayerPanelOpen)}
        isLayerPanelOpen={isLayerPanelOpen}
        onBackToDashboard={onBackToDashboard}
        onBackToHome={onBackToHome}
        canvasTheme={canvasTheme}
        onToggleCanvasTheme={() =>
          setCanvasTheme((t) => (t === 'light' ? 'blueprint' : 'light'))
        }
        viewMode={viewMode}
        onToggleViewMode={setViewMode}
      />

      {/* 2. MAIN CAD WORKSPACE (2D Drafting Plan, Split 2D+3D, or Full 3D Twin) */}
      {viewMode === '3d' ? (
        <div className="flex-1 w-full h-[calc(100vh-3.5rem)] relative overflow-hidden">
          <OmegaCAD3DViewer
            drawing={drawing}
            onBackTo2D={() => setViewMode('2d')}
          />
        </div>
      ) : viewMode === 'split' ? (
        <div className="flex flex-1 h-[calc(100vh-3.5rem)] relative overflow-hidden">
          {/* Left Split: 2D Ribbon + Precision CAD Drafting Canvas */}
          <div className="w-1/2 h-full flex relative border-r border-slate-300 overflow-hidden">
            <OmegaCADRibbon
              onAddCadEntity={handleAddEntity}
              onOpenScanModal={() => setIsScanModalOpen(true)}
            />
            <OmegaCADCanvas
              drawing={drawing}
              selectedEntityId={selectedEntityId}
              onSelectEntity={setSelectedEntityId}
              onUpdateEntityPosition={handleUpdateEntityPosition}
              onUpdateEntityDimensions={handleUpdateEntityDimensions}
              onRotateEntity={handleRotateEntity}
              onDuplicateEntity={handleDuplicateEntity}
              onDeleteEntity={handleDeleteEntity}
              zoom={zoom * 0.85}
              onZoomChange={setZoom}
              orthoMode={orthoMode}
              canvasTheme={canvasTheme}
              onZoomFit={() => setZoom(0.85)}
              onOffsetEntity={handleOffsetEntity}
              onMirrorEntity={handleMirrorEntity}
              onArrayEntity={handleArrayEntity}
              onAutoDimension={handleAutoDimension}
              onIsolateLayer={handleIsolateLayer}
              onRestoreAllLayers={handleRestoreAllLayers}
            />
          </div>

          {/* Right Split: Live Synchronized 3D Holographic Twin */}
          <div className="w-1/2 h-full relative overflow-hidden">
            <OmegaCAD3DViewer
              drawing={drawing}
              onBackTo2D={() => setViewMode('2d')}
              isSplitView={true}
            />
          </div>
        </div>
      ) : (
        <>
          <div className="flex flex-1 h-[calc(100vh-3.5rem-2.25rem)] relative overflow-hidden">
            {/* Left: Tool Ribbon & 100+ CAD Blocks Library */}
            <OmegaCADRibbon
              onAddCadEntity={handleAddEntity}
              onOpenScanModal={() => setIsScanModalOpen(true)}
            />

            {/* Center: Precision CAD Drafting Canvas with Floating Micro-Tools */}
            <OmegaCADCanvas
              drawing={drawing}
              selectedEntityId={selectedEntityId}
              onSelectEntity={setSelectedEntityId}
              onUpdateEntityPosition={handleUpdateEntityPosition}
              onUpdateEntityDimensions={handleUpdateEntityDimensions}
              onRotateEntity={handleRotateEntity}
              onDuplicateEntity={handleDuplicateEntity}
              onDeleteEntity={handleDeleteEntity}
              zoom={zoom}
              onZoomChange={setZoom}
              orthoMode={orthoMode}
              canvasTheme={canvasTheme}
              onZoomFit={() => setZoom(0.85)}
              onOffsetEntity={handleOffsetEntity}
              onMirrorEntity={handleMirrorEntity}
              onArrayEntity={handleArrayEntity}
              onAutoDimension={handleAutoDimension}
              onIsolateLayer={handleIsolateLayer}
              onRestoreAllLayers={handleRestoreAllLayers}
            />

            {/* Right: Layer Manager & Entity Inspector Panel */}
            {isLayerPanelOpen && (
              <OmegaCADLayerPanel
                drawing={drawing}
                selectedEntity={selectedEntity}
                onUpdateDrawing={setDrawing}
                onUpdateEntity={(id, partial) =>
                  setDrawing((prev) => ({
                    ...prev,
                    entities: prev.entities.map((e) => (e.id === id ? { ...e, ...partial } : e)),
                  }))
                }
                onDeleteEntity={handleDeleteEntity}
                onClose={() => setIsLayerPanelOpen(false)}
              />
            )}
          </div>

          {/* 3. AUTOCAD COMMAND LINE & STATUS BAR (Flowlify Footer) */}
          <OmegaCADCommandLine
            onExecuteCommand={handleExecuteCommand}
            lastMessage={cliMessage}
            orthoMode={orthoMode}
          />
        </>
      )}

      {/* 4. AI SKETCH-TO-CAD SCANNER MODAL */}
      <UploadModal
        isOpen={isScanModalOpen}
        onClose={() => setIsScanModalOpen(false)}
        onSuccess={handleScanSuccess}
        initialMode="architecture"
      />
    </div>
  );
};
