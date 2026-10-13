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
    canvasBg: '#0B1E36',
    gridSize: 100,
    layers: DEFAULT_CAD_LAYERS,
    entities: [
      // Boundary Walls (9" Exterior Concrete)
      { id: 'w_north', type: 'arch_wall', layerId: 'layer_wall', label: 'North Boundary Wall (9.0m)', x: 180, y: 100, width: 720, height: 22, color: '#38BDF8', wallThickness: 230, wallHatch: 'concrete' },
      { id: 'w_south', type: 'arch_wall', layerId: 'layer_wall', label: 'South Boundary Wall (9.0m)', x: 180, y: 620, width: 720, height: 22, color: '#38BDF8', wallThickness: 230, wallHatch: 'concrete' },
      { id: 'w_west', type: 'arch_wall', layerId: 'layer_wall', label: 'West Wall (5.2m)', x: 180, y: 122, width: 22, height: 498, color: '#38BDF8', wallThickness: 230, wallHatch: 'concrete' },
      { id: 'w_east', type: 'arch_wall', layerId: 'layer_wall', label: 'East Wall (5.2m)', x: 878, y: 122, width: 22, height: 498, color: '#38BDF8', wallThickness: 230, wallHatch: 'concrete' },
      // Interior Partition Walls (4.5" Brick)
      { id: 'w_div_vert', type: 'arch_wall', layerId: 'layer_wall', label: 'Bedroom Partition Wall', x: 550, y: 122, width: 14, height: 350, color: '#475569', wallThickness: 115, wallHatch: 'brick' },
      { id: 'w_div_horiz', type: 'arch_wall', layerId: 'layer_wall', label: 'Kitchen Partition Wall', x: 202, y: 470, width: 348, height: 14, color: '#475569', wallThickness: 115, wallHatch: 'brick' },
      // Rooms
      { id: 'room_living', type: 'arch_room', layerId: 'layer_room', label: 'Living & Dining Hall', sublabel: 'Polished Vitrified Tile', x: 210, y: 130, width: 330, height: 330, color: '#818CF8', roomArea: '22.5 m² (242 sq ft)' },
      { id: 'room_bed', type: 'arch_room', layerId: 'layer_room', label: 'Master Bedroom Suite', sublabel: 'Hardwood Timber Floor', x: 574, y: 130, width: 294, height: 330, color: '#818CF8', roomArea: '18.2 m² (196 sq ft)' },
      { id: 'room_kit', type: 'arch_room', layerId: 'layer_room', label: 'Modular Kitchen & Utility', sublabel: 'Granite Countertop', x: 210, y: 494, width: 240, height: 116, color: '#0D9488', roomArea: '7.2 m² (78 sq ft)' },
      { id: 'room_bath', type: 'arch_room', layerId: 'layer_room', label: 'Ensuite Bathroom', sublabel: 'Anti-skid Ceramic Tiles', x: 574, y: 494, width: 160, height: 116, color: '#0284C7', roomArea: '4.5 m² (48 sq ft)' },
      // Swing Doors
      { id: 'door_main', type: 'arch_door', layerId: 'layer_door', label: 'Main Entry Door D1 (1000mm)', x: 320, y: 80, width: 80, height: 80, color: '#F59E0B' },
      { id: 'door_bed', type: 'arch_door', layerId: 'layer_door', label: 'Bedroom Door D2 (900mm)', x: 520, y: 390, width: 70, height: 70, color: '#F59E0B' },
      { id: 'door_bath', type: 'arch_door', layerId: 'layer_door', label: 'Bath Door D3 (750mm)', x: 580, y: 450, width: 65, height: 65, color: '#F59E0B' },
      // Glazed Windows
      { id: 'win_living', type: 'arch_window', layerId: 'layer_window', label: 'Bay Window W1 (1800mm)', x: 420, y: 94, width: 110, height: 24, color: '#0284C7' },
      { id: 'win_bed', type: 'arch_window', layerId: 'layer_window', label: 'Glazed Window W2 (1200mm)', x: 700, y: 94, width: 90, height: 24, color: '#0284C7' },
      // Structural Columns
      { id: 'col_nw', type: 'arch_column', layerId: 'layer_column', label: 'C1', x: 168, y: 88, width: 36, height: 36, color: '#F43F5E' },
      { id: 'col_ne', type: 'arch_column', layerId: 'layer_column', label: 'C2', x: 878, y: 88, width: 36, height: 36, color: '#F43F5E' },
      { id: 'col_mid', type: 'arch_column', layerId: 'layer_column', label: 'C3', x: 538, y: 88, width: 36, height: 36, color: '#F43F5E' },
      { id: 'col_sw', type: 'arch_column', layerId: 'layer_column', label: 'C4', x: 168, y: 616, width: 36, height: 36, color: '#F43F5E' },
      { id: 'col_se', type: 'arch_column', layerId: 'layer_column', label: 'C5', x: 878, y: 616, width: 36, height: 36, color: '#F43F5E' },
      // Dimension Lines
      { id: 'dim_total', type: 'arch_dimension', layerId: 'layer_dimension', label: '9.00 m (29\' 6")', dimensionText: 'TOTAL OVERALL SPAN: 9.00 m (29\' 6")', x: 180, y: 50, width: 720, height: 35, color: '#60A5FA' },
      // Furniture
      { id: 'furn_bed', type: 'arch_furniture', layerId: 'layer_furniture', label: 'King Bed (1800×2000)', x: 670, y: 190, width: 130, height: 150, color: '#94A3B8', furnitureType: 'bed' },
      // Title Block
      { id: 'titleblock', type: 'arch_titleblock', layerId: 'layer_title', label: 'OMEGACAD PLUS • 2BHK RESIDENTIAL SUITE', sublabel: 'SHEET A-101 • SCALE 1:50 METRIC', x: 460, y: 660, width: 440, height: 80, color: '#F8FAFC' },
    ],
  });

  // History stack for Undo/Redo
  const [history, setHistory] = useState<CadDrawing[]>([]);
  const [future, setFuture] = useState<CadDrawing[]>([]);

  // Selection & Viewport State
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);
  const [zoom, setZoom] = useState<number>(0.9);
  const [orthoMode, setOrthoMode] = useState<boolean>(true);
  const [isLayerPanelOpen, setIsLayerPanelOpen] = useState<boolean>(true);
  const [isScanModalOpen, setIsScanModalOpen] = useState<boolean>(false);
  const [cliMessage, setCliMessage] = useState<string | undefined>();

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
  const handleAddEntity = (preset: {
    type: CadEntityType;
    layerId: string;
    label: string;
    sublabel?: string;
    width: number;
    height: number;
    color: string;
    wallThickness?: number;
    wallHatch?: 'concrete' | 'brick' | 'solid';
    roomArea?: string;
    dimensionText?: string;
    furnitureType?: 'bed' | 'sofa' | 'dining' | 'toilet' | 'desk';
  }) => {
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

  // Command Line Prompt Executer
  const handleExecuteCommand = (rawCmd: string) => {
    const cmd = rawCmd.toUpperCase().trim();

    if (cmd === 'WALL' || cmd === 'W') {
      handleAddEntity({
        type: 'arch_wall',
        layerId: 'layer_wall',
        label: 'Wall Segment',
        width: 480,
        height: 20,
        color: '#38BDF8',
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
        color: '#F59E0B',
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
        label: 'Column C',
        width: 36,
        height: 36,
        color: '#F43F5E',
      });
    } else if (cmd === 'ROOM' || cmd === 'R') {
      handleAddEntity({
        type: 'arch_room',
        layerId: 'layer_room',
        label: 'Room Enclosure',
        width: 320,
        height: 260,
        color: '#818CF8',
        roomArea: '18.0 m² (194 sq ft)',
      });
    } else if (cmd === 'DIM' || cmd === 'DIMENSION') {
      handleAddEntity({
        type: 'arch_dimension',
        layerId: 'layer_dimension',
        label: 'Dimension Span',
        dimensionText: '5.00 m (16\' 4")',
        width: 500,
        height: 35,
        color: '#60A5FA',
      });
    } else if (cmd === 'RO' || cmd === 'ROTATE') {
      if (selectedEntityId) {
        handleRotateEntity(selectedEntityId);
        setCliMessage('Rotated selected entity 90°');
      } else {
        setCliMessage('Select an entity first to rotate.');
      }
    } else if (cmd === 'FIT' || cmd === 'ZOOMFIT') {
      setZoom(0.85);
      setCliMessage('Zoom fitted to floor plan extents.');
    } else if (cmd === 'DXF' || cmd === 'EXPORT') {
      downloadDxf(drawing);
      setCliMessage('Exported AutoCAD / IntelliCAD DXF (.dxf).');
    } else if (cmd === 'ORTHO') {
      setOrthoMode((prev) => !prev);
      setCliMessage(`Ortho mode set to ${!orthoMode ? 'ON' : 'OFF'}`);
    } else {
      setCliMessage(`Unknown command "${rawCmd}". Available: WALL, DOOR, WIN, COL, ROOM, DIM, RO, FIT, DXF, ORTHO`);
    }
  };

  // AI Reverse-engineering success handler
  const handleScanSuccess = (analyzedDiagram: DiagramData) => {
    pushHistory(drawing);

    // Map analyzed nodes into CadEntity format
    const newEntities: CadEntity[] = analyzedDiagram.nodes.map((node) => ({
      id: node.id,
      type: (node.type.startsWith('arch_') ? node.type : 'arch_wall') as CadEntityType,
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
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-950 font-sans text-slate-200 antialiased select-none">
      {/* 1. TOP TOOLBAR */}
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
      />

      {/* 2. MAIN CAD WORKSPACE */}
      <div className="flex flex-1 h-[calc(100vh-3.5rem-2rem)] relative overflow-hidden">
        {/* Left: Tool Ribbon */}
        <OmegaCADRibbon onAddCadEntity={handleAddEntity} />

        {/* Center: Precision CAD Viewport Canvas */}
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

      {/* 3. AUTOCAD COMMAND LINE (CLI) */}
      <OmegaCADCommandLine
        onExecuteCommand={handleExecuteCommand}
        lastMessage={cliMessage}
      />

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
