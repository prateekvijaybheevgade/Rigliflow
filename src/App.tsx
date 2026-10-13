import React, { useState, useEffect, useCallback } from 'react';
import {
  DiagramData,
  FlowNode,
  FlowEdge,
  NodeType,
  Point,
  DiagramPage,
} from './types/flowchart';
import { Canvas } from './components/Canvas';
import { Toolbar } from './components/Toolbar';
import { Sidebar } from './components/Sidebar';
import { PropertiesPanel } from './components/PropertiesPanel';
import { UploadModal } from './components/UploadModal';
import { AIAssistantModal } from './components/AIAssistantModal';
import { OriginalImageDrawer } from './components/OriginalImageDrawer';
import { CloudDiagramsDrawer } from './components/CloudDiagramsDrawer';
import { LandingPage } from './components/LandingPage';
import { WorkspaceDashboard } from './components/WorkspaceDashboard';
import { AuthModal } from './components/AuthModal';
import { VersionHistoryDrawer } from './components/VersionHistoryDrawer';
import { CommentsDrawer } from './components/CommentsDrawer';
import { KeyboardShortcutsModal } from './components/KeyboardShortcutsModal';
import { Box, Sliders, X, LayoutGrid } from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext';
import {
  saveDiagramToFirestore,
  subscribeToUserDiagrams,
  deleteDiagramFromFirestore,
  DiagramVersion,
  DiagramComment,
  addNodeComment,
  updateNodeComment,
  deleteNodeComment,
  subscribeToDiagramComments,
} from './services/diagramService';
import { SAMPLE_DIAGRAMS, SampleTemplate } from './utils/samples';
import { autoLayoutDiagram } from './utils/layout';
import {
  alignNodes,
  distributeNodes,
  reorderNodes,
  AlignmentType,
  DistributionType,
} from './utils/alignment';
import {
  generateSvgString,
  downloadSvg,
  downloadPdf,
  downloadPng,
  downloadJson,
} from './utils/export';
import { getDiagramBounds } from './utils/geometry';

type AppView = 'landing' | 'dashboard' | 'editor';

function FlowlifyApp() {
  const { user } = useAuth();

  // Navigation View: 'landing', 'dashboard', or 'editor'
  const [currentView, setCurrentView] = useState<AppView>('landing');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);

  // Responsive Mobile / Tablet Layout States
  const [isMobileOrTablet, setIsMobileOrTablet] = useState<boolean>(
    typeof window !== 'undefined' ? window.innerWidth < 1024 : false
  );
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState<boolean>(false);
  const [mobilePropertiesOpen, setMobilePropertiesOpen] = useState<boolean>(false);

  useEffect(() => {
    const handleResize = () => {
      const isSmall = window.innerWidth < 1024;
      setIsMobileOrTablet(isSmall);
      if (!isSmall) {
        setMobileSidebarOpen(false);
        setMobilePropertiesOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // When user authenticates, transition from landing to dashboard
  useEffect(() => {
    if (user && currentView === 'landing') {
      setCurrentView('dashboard');
    } else if (!user && currentView !== 'landing') {
      setCurrentView('landing');
    }
  }, [user]);

  // Main diagram state in Studio
  const [diagram, setDiagram] = useState<DiagramData>(() => SAMPLE_DIAGRAMS[0].diagram);

  // Cloud persisted diagrams for authenticated user
  const [savedDiagrams, setSavedDiagrams] = useState<DiagramData[]>([]);
  const [isSavingToCloud, setIsSavingToCloud] = useState<boolean>(false);
  const [cloudSavedSuccess, setCloudSavedSuccess] = useState<boolean>(false);
  const [isCloudDrawerOpen, setIsCloudDrawerOpen] = useState<boolean>(false);

  // History stack for Undo/Redo
  const [history, setHistory] = useState<DiagramData[]>([]);
  const [future, setFuture] = useState<DiagramData[]>([]);

  // Selection
  const [selectedNodeIds, setSelectedNodeIds] = useState<string[]>([]);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);

  // Canvas Viewport (Zoom & Pan)
  const [zoom, setZoom] = useState<number>(0.95);
  const [pan, setPan] = useState<Point>({ x: 80, y: 40 });
  const [snapToGrid, setSnapToGrid] = useState<boolean>(true);

  // Modals & Panels
  const [isUploadModalOpen, setIsUploadModalOpen] = useState<boolean>(false);
  const [isAIPromptModalOpen, setIsAIPromptModalOpen] = useState<boolean>(false);
  const [isCompareDrawerOpen, setIsCompareDrawerOpen] = useState<boolean>(false);
  const [isVersionHistoryOpen, setIsVersionHistoryOpen] = useState<boolean>(false);
  const [isCommentsDrawerOpen, setIsCommentsDrawerOpen] = useState<boolean>(false);
  const [isKeyboardShortcutsOpen, setIsKeyboardShortcutsOpen] = useState<boolean>(false);

  // Diagram Node Collaboration Comments
  const [comments, setComments] = useState<DiagramComment[]>([]);

  // Real-time synchronization of diagram comments sub-collection
  useEffect(() => {
    if (!user || !diagram.id) {
      setComments([]);
      return;
    }

    const unsubscribe = subscribeToDiagramComments(user.uid, diagram.id, (loadedComments) => {
      setComments(loadedComments);
    });

    return () => unsubscribe();
  }, [user, diagram.id]);

  // Real-time synchronization with Firestore when user is signed in
  useEffect(() => {
    if (!user) {
      setSavedDiagrams([]);
      return;
    }

    const unsubscribe = subscribeToUserDiagrams(user.uid, (diagrams) => {
      setSavedDiagrams(diagrams);
    });

    return () => unsubscribe();
  }, [user]);

  // Push new state to history stack before mutating
  const pushHistory = useCallback(
    (current: DiagramData) => {
      setHistory((prev) => [...prev.slice(-30), JSON.parse(JSON.stringify(current))]);
      setFuture([]);
    },
    []
  );

  // Undo
  const handleUndo = useCallback(() => {
    if (history.length === 0) return;
    const previous = history[history.length - 1];
    setHistory((prev) => prev.slice(0, prev.length - 1));
    setFuture((prev) => [JSON.parse(JSON.stringify(diagram)), ...prev]);
    setDiagram(previous);
    setSelectedNodeIds([]);
    setSelectedEdgeId(null);
  }, [history, diagram]);

  // Redo
  const handleRedo = useCallback(() => {
    if (future.length === 0) return;
    const next = future[0];
    setFuture((prev) => prev.slice(1));
    setHistory((prev) => [...prev, JSON.parse(JSON.stringify(diagram))]);
    setDiagram(next);
    setSelectedNodeIds([]);
    setSelectedEdgeId(null);
  }, [future, diagram]);

  // Save active diagram to Firestore
  const handleSaveToCloud = async () => {
    if (!user) {
      setIsAuthModalOpen(true);
      return;
    }

    setIsSavingToCloud(true);
    try {
      const savedId = await saveDiagramToFirestore(user.uid, diagram);
      if (!diagram.id) {
        setDiagram((prev) => ({ ...prev, id: savedId }));
      }
      setCloudSavedSuccess(true);
      setTimeout(() => setCloudSavedSuccess(false), 2500);
    } catch (err) {
      console.error('Failed to save to Firestore:', err);
    } finally {
      setIsSavingToCloud(false);
    }
  };

  // Keyboard Shortcuts in Editor
  useEffect(() => {
    if (currentView !== 'editor') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      // Toggle Keyboard Shortcuts Help Modal
      if (e.key === '?' || (e.shiftKey && e.key === '/')) {
        e.preventDefault();
        setIsKeyboardShortcutsOpen((prev) => !prev);
        return;
      }

      // Quick Save Diagram to Cloud
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        handleSaveToCloud();
        return;
      }

      // Undo
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
        return;
      }

      // Redo
      if (
        ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') ||
        ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'z')
      ) {
        e.preventDefault();
        handleRedo();
        return;
      }

      // Delete
      if (e.key === 'Backspace' || e.key === 'Delete') {
        if (selectedNodeIds.length > 0) {
          e.preventDefault();
          handleDeleteSelectedNodes();
        } else if (selectedEdgeId) {
          e.preventDefault();
          handleDeleteEdge(selectedEdgeId);
        }
        return;
      }

      // Select All
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        setSelectedNodeIds(diagram.nodes.map((n) => n.id));
        setSelectedEdgeId(null);
        return;
      }

      // Deselect or close shortcuts modal
      if (e.key === 'Escape') {
        if (isKeyboardShortcutsOpen) {
          setIsKeyboardShortcutsOpen(false);
        }
        setSelectedNodeIds([]);
        setSelectedEdgeId(null);
        return;
      }

      // Duplicate
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd') {
        if (selectedNodeIds.length === 1) {
          e.preventDefault();
          handleDuplicateNode(selectedNodeIds[0]);
        }
        return;
      }

      // Zoom Controls (Ctrl/Cmd + Plus/Minus/0)
      if ((e.ctrlKey || e.metaKey) && (e.key === '=' || e.key === '+')) {
        e.preventDefault();
        setZoom((z) => Math.min(2.5, z + 0.15));
        return;
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === '-' || e.key === '_')) {
        e.preventDefault();
        setZoom((z) => Math.max(0.25, z - 0.15));
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key === '0') {
        e.preventDefault();
        setZoom(1);
        setPan({ x: 80, y: 60 });
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    diagram,
    selectedNodeIds,
    selectedEdgeId,
    handleUndo,
    handleRedo,
    currentView,
    isKeyboardShortcutsOpen,
  ]);

  // Selection handlers
  const handleSelectNode = (nodeId: string, multi: boolean) => {
    setSelectedEdgeId(null);
    if (multi) {
      setSelectedNodeIds((prev) =>
        prev.includes(nodeId) ? prev.filter((id) => id !== nodeId) : [...prev, nodeId]
      );
    } else {
      setSelectedNodeIds([nodeId]);
    }
  };

  const handleSelectEdge = (edgeId: string) => {
    setSelectedNodeIds([]);
    setSelectedEdgeId(edgeId);
  };

  const handleClearSelection = () => {
    setSelectedNodeIds([]);
    setSelectedEdgeId(null);
  };

  // Add Node
  const handleAddNode = (type: NodeType, targetX?: number, targetY?: number) => {
    pushHistory(diagram);

    const canvasCenterX =
      targetX !== undefined
        ? targetX
        : Math.round((-pan.x + window.innerWidth / 2 - 100) / zoom);
    const canvasCenterY =
      targetY !== undefined
        ? targetY
        : Math.round((-pan.y + window.innerHeight / 2 - 50) / zoom);

    const defaultColors: Record<NodeType, string> = {
      process: '#3B82F6',
      decision: '#F59E0B',
      start_end: '#10B981',
      database: '#8B5CF6',
      cloud: '#0EA5E9',
      io: '#14B8A6',
      document: '#EC4899',
      subprocess: '#6366F1',
      note: '#FEF3C7',
      hexagon: '#06B6D4',
      triangle: '#F43F5E',
      server: '#2563EB',
      queue: '#6366F1',
      actor: '#059669',
      table: '#334155',
      frame: '#8B5CF6',
      text: '#475569',
      cylinder: '#8B5CF6',
      // Architectural & CAD Primitives
      arch_wall: '#334155',
      arch_door: '#2563EB',
      arch_window: '#0284C7',
      arch_room: '#3B82F6',
      arch_dimension: '#2563EB',
      arch_column: '#1E293B',
      arch_stair: '#475569',
      arch_furniture: '#64748B',
      arch_titleblock: '#0F172A',
    };

    const defaultLabels: Record<NodeType, string> = {
      process: 'New Process Step',
      decision: 'Condition Valid?',
      start_end: 'Start / End Point',
      database: 'Data Store / DB',
      cylinder: 'Database Cylinder',
      cloud: 'Cloud Service / API',
      io: 'User Input / Payload',
      document: 'Report / Document',
      subprocess: 'Sub-Pipeline Flow',
      note: 'Sticky Note Remark',
      hexagon: 'Preparation Setup',
      triangle: 'Merge / Yield',
      server: 'Server / Compute Node',
      queue: 'Message Queue (FIFO)',
      actor: 'Actor / User Role',
      table: 'Entity Schema Table',
      frame: 'Group Boundary / Subnet',
      text: 'Text Annotation',
      // Architectural & CAD Primitives
      arch_wall: 'Wall Segment',
      arch_door: 'Swing Door',
      arch_window: 'Glazed Window',
      arch_room: 'Living Room',
      arch_dimension: '4.50 m',
      arch_column: 'Column C1',
      arch_stair: 'Main Staircase',
      arch_furniture: 'Master Bed',
      arch_titleblock: 'ARCHITECTURAL BLUEPRINT',
    };

    const defaultWidths: Partial<Record<NodeType, number>> = {
      decision: 180,
      actor: 130,
      hexagon: 190,
      triangle: 170,
      frame: 320,
      table: 220,
      text: 160,
      arch_wall: 240,
      arch_door: 90,
      arch_window: 120,
      arch_room: 320,
      arch_dimension: 220,
      arch_column: 45,
      arch_stair: 140,
      arch_furniture: 140,
      arch_titleblock: 420,
    };

    const defaultHeights: Partial<Record<NodeType, number>> = {
      decision: 95,
      actor: 120,
      hexagon: 80,
      triangle: 95,
      frame: 220,
      table: 110,
      text: 45,
      arch_wall: 18,
      arch_door: 90,
      arch_window: 24,
      arch_room: 240,
      arch_dimension: 35,
      arch_column: 45,
      arch_stair: 240,
      arch_furniture: 160,
      arch_titleblock: 85,
    };

    const newNode: FlowNode = {
      id: `node_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      type,
      label: defaultLabels[type] || 'New Node',
      sublabel: type === 'decision' ? 'Branch condition' : undefined,
      x: canvasCenterX,
      y: canvasCenterY,
      width: defaultWidths[type] || 210,
      height: defaultHeights[type] || 75,
      color: defaultColors[type] || '#3B82F6',
    };

    setDiagram((prev) => ({
      ...prev,
      nodes: [...prev.nodes, newNode],
    }));

    setSelectedNodeIds([newNode.id]);
    setSelectedEdgeId(null);
  };

  // Duplicate Node
  const handleDuplicateNode = (nodeId: string) => {
    const node = diagram.nodes.find((n) => n.id === nodeId);
    if (!node) return;

    pushHistory(diagram);

    const duplicated: FlowNode = {
      ...JSON.parse(JSON.stringify(node)),
      id: `node_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      x: node.x + 40,
      y: node.y + 40,
      label: `${node.label} (Copy)`,
    };

    setDiagram((prev) => ({
      ...prev,
      nodes: [...prev.nodes, duplicated],
    }));

    setSelectedNodeIds([duplicated.id]);
  };

  // Delete selected nodes
  const handleDeleteSelectedNodes = () => {
    if (selectedNodeIds.length === 0) return;
    pushHistory(diagram);

    setDiagram((prev) => ({
      ...prev,
      nodes: prev.nodes.filter((n) => !selectedNodeIds.includes(n.id)),
      edges: prev.edges.filter(
        (e) => !selectedNodeIds.includes(e.from) && !selectedNodeIds.includes(e.to)
      ),
    }));

    setSelectedNodeIds([]);
  };

  // Node position update
  const handleUpdateNodePosition = (nodeId: string, x: number, y: number) => {
    setDiagram((prev) => ({
      ...prev,
      nodes: prev.nodes.map((n) => (n.id === nodeId ? { ...n, x, y } : n)),
    }));
  };

  const handleBatchUpdateNodePositions = (positions: { id: string; x: number; y: number }[]) => {
    const posMap = new Map(positions.map((p) => [p.id, p]));
    setDiagram((prev) => ({
      ...prev,
      nodes: prev.nodes.map((n) => {
        const update = posMap.get(n.id);
        return update ? { ...n, x: update.x, y: update.y } : n;
      }),
    }));
  };

  // Node dimensions resize update
  const handleUpdateNodeDimensions = (
    nodeId: string,
    width: number,
    height: number,
    x: number,
    y: number
  ) => {
    setDiagram((prev) => ({
      ...prev,
      nodes: prev.nodes.map((n) =>
        n.id === nodeId ? { ...n, width, height, x, y } : n
      ),
    }));
  };

  // Update Node text
  const handleUpdateNodeText = (nodeId: string, label: string, sublabel?: string) => {
    pushHistory(diagram);
    setDiagram((prev) => ({
      ...prev,
      nodes: prev.nodes.map((n) => (n.id === nodeId ? { ...n, label, sublabel } : n)),
    }));
  };

  // Update Node partial properties
  const handleUpdateNode = (updated: Partial<FlowNode>) => {
    if (selectedNodeIds.length === 0) return;
    const targetId = selectedNodeIds[0];

    pushHistory(diagram);
    setDiagram((prev) => ({
      ...prev,
      nodes: prev.nodes.map((n) => (n.id === targetId ? { ...n, ...updated } : n)),
    }));
  };

  // Rotate node by degrees (0, 90, 180, 270)
  const handleRotateNode = (nodeId: string, angle: number) => {
    pushHistory(diagram);
    setDiagram((prev) => ({
      ...prev,
      nodes: prev.nodes.map((n) => (n.id === nodeId ? { ...n, rotation: angle } : n)),
    }));
  };

  // Edge operations
  const handleAddEdge = (newEdgeData: Omit<FlowEdge, 'id'>) => {
    pushHistory(diagram);
    const newEdge: FlowEdge = {
      ...newEdgeData,
      id: `edge_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    };

    setDiagram((prev) => ({
      ...prev,
      edges: [...prev.edges, newEdge],
    }));

    setSelectedEdgeId(newEdge.id);
  };

  const handleDeleteEdge = (edgeId: string) => {
    pushHistory(diagram);
    setDiagram((prev) => ({
      ...prev,
      edges: prev.edges.filter((e) => e.id !== edgeId),
    }));
    if (selectedEdgeId === edgeId) {
      setSelectedEdgeId(null);
    }
  };

  const handleUpdateEdgeLabel = (edgeId: string, label: string) => {
    pushHistory(diagram);
    setDiagram((prev) => ({
      ...prev,
      edges: prev.edges.map((e) => (e.id === edgeId ? { ...e, label } : e)),
    }));
  };

  const handleUpdateEdge = (updated: Partial<FlowEdge>) => {
    if (!selectedEdgeId) return;
    pushHistory(diagram);
    setDiagram((prev) => ({
      ...prev,
      edges: prev.edges.map((e) => (e.id === selectedEdgeId ? { ...e, ...updated } : e)),
    }));
  };

  // Auto Layout
  const handleAutoLayout = (direction: 'top-down' | 'left-right') => {
    pushHistory(diagram);
    const reorderedNodes = autoLayoutDiagram(diagram.nodes, diagram.edges, direction);
    setDiagram((prev) => ({
      ...prev,
      direction,
      nodes: reorderedNodes,
    }));
    handleZoomFit();
  };

  // Align nodes
  const handleAlignNodes = (alignment: AlignmentType) => {
    if (selectedNodeIds.length < 2) return;
    pushHistory(diagram);
    const updated = alignNodes(diagram.nodes, selectedNodeIds, alignment);
    setDiagram((prev) => ({ ...prev, nodes: updated }));
  };

  // Distribute nodes
  const handleDistributeNodes = (distribution: DistributionType) => {
    if (selectedNodeIds.length < 3) return;
    pushHistory(diagram);
    const updated = distributeNodes(diagram.nodes, selectedNodeIds, distribution);
    setDiagram((prev) => ({ ...prev, nodes: updated }));
  };

  // Reorder node depth
  const handleReorderNodes = (action: 'bring-front' | 'send-back') => {
    if (selectedNodeIds.length === 0) return;
    pushHistory(diagram);
    const updated = reorderNodes(diagram.nodes, selectedNodeIds, action);
    setDiagram((prev) => ({ ...prev, nodes: updated }));
  };

  // Canvas props update
  const handleUpdateCanvasProps = (props: {
    canvasBg?: string;
    gridType?: 'dots' | 'lines' | 'none';
    pageView?: boolean;
    snapToGrid?: boolean;
  }) => {
    if (props.snapToGrid !== undefined) {
      setSnapToGrid(props.snapToGrid);
    }
    setDiagram((prev) => ({
      ...prev,
      ...props,
    }));
  };

  // Multi-page management (Draw.io feature)
  const currentPages: DiagramPage[] =
    diagram.pages && diagram.pages.length > 0
      ? diagram.pages
      : [{ id: 'page-1', name: 'Page 1', nodes: diagram.nodes, edges: diagram.edges }];

  const activePageIndex = diagram.activePageIndex ?? 0;

  const handleSelectPage = (index: number) => {
    if (index === activePageIndex || index < 0 || index >= currentPages.length) return;
    const updatedPages = currentPages.map((p, idx) =>
      idx === activePageIndex ? { ...p, nodes: diagram.nodes, edges: diagram.edges } : p
    );
    const targetPage = updatedPages[index];
    setDiagram((prev) => ({
      ...prev,
      pages: updatedPages,
      activePageIndex: index,
      nodes: targetPage.nodes,
      edges: targetPage.edges,
    }));
    setSelectedNodeIds([]);
    setSelectedEdgeId(null);
  };

  const handleAddPage = () => {
    const updatedPages = currentPages.map((p, idx) =>
      idx === activePageIndex ? { ...p, nodes: diagram.nodes, edges: diagram.edges } : p
    );
    const newPageNum = updatedPages.length + 1;
    const newPage: DiagramPage = {
      id: `page_${Date.now()}`,
      name: `Page ${newPageNum}`,
      nodes: [],
      edges: [],
    };
    const nextPages = [...updatedPages, newPage];
    setDiagram((prev) => ({
      ...prev,
      pages: nextPages,
      activePageIndex: nextPages.length - 1,
      nodes: [],
      edges: [],
    }));
    setSelectedNodeIds([]);
    setSelectedEdgeId(null);
  };

  const handleRenamePage = (index: number, newName: string) => {
    const updatedPages = currentPages.map((p, idx) =>
      idx === index ? { ...p, name: newName } : p
    );
    setDiagram((prev) => ({
      ...prev,
      pages: updatedPages,
    }));
  };

  const handleDeletePage = (index: number) => {
    if (currentPages.length <= 1) return;
    const remainingPages = currentPages.filter((_, idx) => idx !== index);
    const nextActive = Math.min(activePageIndex, remainingPages.length - 1);
    const activePage = remainingPages[nextActive];
    setDiagram((prev) => ({
      ...prev,
      pages: remainingPages,
      activePageIndex: nextActive,
      nodes: activePage.nodes,
      edges: activePage.edges,
    }));
    setSelectedNodeIds([]);
    setSelectedEdgeId(null);
  };

  const handleDuplicatePage = (index: number) => {
    const sourcePage = currentPages[index];
    if (!sourcePage) return;
    const duplicatedPage: DiagramPage = {
      id: `page_${Date.now()}`,
      name: `${sourcePage.name} (Copy)`,
      nodes: JSON.parse(JSON.stringify(index === activePageIndex ? diagram.nodes : sourcePage.nodes)),
      edges: JSON.parse(JSON.stringify(index === activePageIndex ? diagram.edges : sourcePage.edges)),
    };
    const nextPages = [...currentPages, duplicatedPage];
    setDiagram((prev) => ({
      ...prev,
      pages: nextPages,
      activePageIndex: nextPages.length - 1,
      nodes: duplicatedPage.nodes,
      edges: duplicatedPage.edges,
    }));
    setSelectedNodeIds([]);
    setSelectedEdgeId(null);
  };

  // Toggle Studio Mode: Flowchart Logic vs Architecture CAD
  const handleToggleStudioMode = (mode: 'flowchart' | 'architecture') => {
    pushHistory(diagram);
    if (mode === 'architecture') {
      setDiagram((prev) => ({
        ...prev,
        studioMode: 'architecture',
        gridType: 'blueprint',
        canvasBg: '#0B1E36',
      }));
    } else {
      setDiagram((prev) => ({
        ...prev,
        studioMode: 'flowchart',
        gridType: 'dots',
        canvasBg: '#F8FAFC',
      }));
    }
  };

  // Import JSON diagram project file
  const handleImportJson = (imported: DiagramData) => {
    pushHistory(diagram);
    setDiagram(imported);
    setSelectedNodeIds([]);
    setSelectedEdgeId(null);
    setTimeout(() => handleZoomFit(), 100);
  };

  // Zoom controls
  const handleZoomIn = () => setZoom((z) => Math.min(2.5, z + 0.15));
  const handleZoomOut = () => setZoom((z) => Math.max(0.25, z - 0.15));
  const handleZoomReset = () => {
    setZoom(1);
    setPan({ x: 80, y: 60 });
  };

  const handleZoomFit = () => {
    const bounds = getDiagramBounds(diagram.nodes, 100);
    const containerW = window.innerWidth - 240 - 260;
    const containerH = window.innerHeight - 60;

    const scaleX = containerW / bounds.width;
    const scaleY = containerH / bounds.height;
    const newZoom = Math.min(1.4, Math.max(0.3, Math.min(scaleX, scaleY)));

    const newPanX = (containerW - bounds.width * newZoom) / 2 - bounds.minX * newZoom;
    const newPanY = (containerH - bounds.height * newZoom) / 2 - bounds.minY * newZoom;

    setZoom(newZoom);
    setPan({ x: newPanX, y: newPanY });
  };

  // Exports
  const handleExportSvg = () => downloadSvg(diagram);

  const handleExportPdf = async () => {
    try {
      await downloadPdf(diagram);
    } catch (err) {
      console.error('PDF export failed:', err);
    }
  };

  const handleExportPng = async () => {
    try {
      await downloadPng(diagram);
    } catch (err) {
      console.error('PNG export failed:', err);
    }
  };

  const handleExportJson = () => downloadJson(diagram);

  const handleCopySvg = async () => {
    const svgCode = generateSvgString(diagram);
    await navigator.clipboard.writeText(svgCode);
  };

  // Load Preset Template
  const handleLoadSample = (sample: SampleTemplate) => {
    if (!user) {
      setIsAuthModalOpen(true);
      return;
    }
    pushHistory(diagram);
    setDiagram({
      ...sample.diagram,
      id: undefined,
      originalImageUrl: sample.thumbnailSvgUrl,
    });
    setSelectedNodeIds([]);
    setSelectedEdgeId(null);
    setCurrentView('editor');
    setIsCompareDrawerOpen(true);
    setTimeout(() => handleZoomFit(), 100);
  };

  // Create New Blank Diagram
  const handleNewDiagram = () => {
    if (!user) {
      setIsAuthModalOpen(true);
      return;
    }
    pushHistory(diagram);
    const newEmptyDiagram: DiagramData = {
      title: 'New Blank Flowchart',
      description: '',
      direction: 'top-down',
      nodes: [
        {
          id: `start_${Date.now()}`,
          type: 'start_end',
          label: 'Start Flow',
          x: 400,
          y: 100,
          width: 200,
          height: 70,
          color: '#10B981',
          icon: 'Play',
        },
      ],
      edges: [],
    };
    setDiagram(newEmptyDiagram);
    setSelectedNodeIds([]);
    setSelectedEdgeId(null);
    setCurrentView('editor');
    setTimeout(() => handleZoomFit(), 100);
  };

  // Open existing diagram in studio
  const handleOpenDiagram = (targetDiagram: DiagramData) => {
    pushHistory(diagram);
    setDiagram(targetDiagram);
    setSelectedNodeIds([]);
    setSelectedEdgeId(null);
    setCurrentView('editor');
    setTimeout(() => handleZoomFit(), 100);
  };

  // Open existing diagram and immediately show its version history
  const handleOpenDiagramWithHistory = (targetDiagram: DiagramData) => {
    handleOpenDiagram(targetDiagram);
    setIsVersionHistoryOpen(true);
  };

  // Open existing diagram and immediately show its node comments
  const handleOpenDiagramWithComments = (targetDiagram: DiagramData) => {
    handleOpenDiagram(targetDiagram);
    setIsCommentsDrawerOpen(true);
  };

  // Restore selected historical snapshot version from Firestore
  const handleRestoreVersion = (version: DiagramVersion) => {
    pushHistory(diagram);
    setDiagram({
      id: version.diagramId,
      title: version.title,
      description: version.description,
      direction: version.direction,
      nodes: version.nodes || [],
      edges: version.edges || [],
      originalImageUrl: diagram.originalImageUrl,
    });
    setSelectedNodeIds([]);
    setSelectedEdgeId(null);
    setTimeout(() => handleZoomFit(), 100);
  };

  // Delete diagram from Firestore
  const handleDeleteDiagram = async (diagramId: string) => {
    if (!user) return;
    try {
      await deleteDiagramFromFirestore(user.uid, diagramId);
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  // Duplicate diagram
  const handleDuplicateDiagram = async (sourceDiagram: DiagramData) => {
    if (!user) return;
    try {
      const duplicated: DiagramData = {
        ...JSON.parse(JSON.stringify(sourceDiagram)),
        id: undefined,
        title: `${sourceDiagram.title} (Copy)`,
      };
      await saveDiagramToFirestore(user.uid, duplicated);
    } catch (err) {
      console.error('Duplicate error:', err);
    }
  };

  // Success handler from Image upload AI recognition
  const handleUploadSuccess = (newDiagram: DiagramData, originalImageUrl: string) => {
    pushHistory(diagram);
    setDiagram({
      ...newDiagram,
      originalImageUrl,
    });
    setSelectedNodeIds([]);
    setSelectedEdgeId(null);
    setCurrentView('editor');
    setIsCompareDrawerOpen(true);
    setTimeout(() => handleZoomFit(), 150);
  };

  // Collaboration Node Comments Handlers
  const handleAddComment = async (nodeId: string, content: string) => {
    if (!user) {
      setIsAuthModalOpen(true);
      return;
    }

    let targetDiagramId = diagram.id;
    if (!targetDiagramId) {
      // Auto-save diagram first so it exists in cloud storage
      setIsSavingToCloud(true);
      try {
        targetDiagramId = await saveDiagramToFirestore(
          user.uid,
          diagram,
          'Initial cloud save with comments'
        );
        setDiagram((prev) => ({ ...prev, id: targetDiagramId }));
      } finally {
        setIsSavingToCloud(false);
      }
    }

    await addNodeComment(user.uid, targetDiagramId, {
      nodeId,
      authorName: user.displayName || user.email?.split('@')[0] || 'Flowlify Member',
      authorPhotoURL: user.photoURL || undefined,
      content,
    });
  };

  const handleToggleResolveComment = async (commentId: string, currentResolved: boolean) => {
    if (!user || !diagram.id) return;
    await updateNodeComment(user.uid, diagram.id, commentId, {
      resolved: !currentResolved,
    });
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!user || !diagram.id) return;
    await deleteNodeComment(user.uid, diagram.id, commentId);
  };

  const handleOpenNodeComments = (nodeId: string) => {
    setSelectedNodeIds([nodeId]);
    setSelectedEdgeId(null);
    setIsCommentsDrawerOpen(true);
  };

  const commentsCountByNodeId = React.useMemo(() => {
    const map: Record<string, number> = {};
    comments.forEach((c) => {
      map[c.nodeId] = (map[c.nodeId] || 0) + 1;
    });
    return map;
  }, [comments]);

  const hasUnresolvedCommentsByNodeId = React.useMemo(() => {
    const map: Record<string, boolean> = {};
    comments.forEach((c) => {
      if (!c.resolved) {
        map[c.nodeId] = true;
      }
    });
    return map;
  }, [comments]);

  const unresolvedCommentsTotal = React.useMemo(
    () => comments.filter((c) => !c.resolved).length,
    [comments]
  );

  const selectedNode =
    selectedNodeIds.length === 1
      ? diagram.nodes.find((n) => n.id === selectedNodeIds[0]) || null
      : null;

  const selectedEdge = selectedEdgeId
    ? diagram.edges.find((e) => e.id === selectedEdgeId) || null
    : null;

  // VIEW 1: PUBLIC MARKETING & PRODUCT WEBSITE (Gated)
  if (currentView === 'landing') {
    return (
      <>
        <LandingPage
          onLaunchPlatform={() => {
            if (user) {
              setCurrentView('dashboard');
            } else {
              setIsAuthModalOpen(true);
            }
          }}
          onOpenAuthModal={() => setIsAuthModalOpen(true)}
          onGoToEditor={() => setCurrentView('editor')}
        />
        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
        />
      </>
    );
  }

  // VIEW 2: WORKSPACE DASHBOARD (Signed In User Hub)
  if (currentView === 'dashboard') {
    return (
      <>
        <WorkspaceDashboard
          savedDiagrams={savedDiagrams}
          activeDiagramTitle={diagram.title}
          onOpenDiagram={handleOpenDiagram}
          onOpenDiagramWithHistory={handleOpenDiagramWithHistory}
          onOpenDiagramWithComments={handleOpenDiagramWithComments}
          onNewDiagram={handleNewDiagram}
          onOpenUploadModal={() => setIsUploadModalOpen(true)}
          onDeleteDiagram={handleDeleteDiagram}
          onDuplicateDiagram={handleDuplicateDiagram}
          onLoadSample={handleLoadSample}
          onGoToLanding={() => setCurrentView('landing')}
          onGoToEditor={() => setCurrentView('editor')}
        />

        <UploadModal
          isOpen={isUploadModalOpen}
          onClose={() => setIsUploadModalOpen(false)}
          onSuccess={handleUploadSuccess}
          initialMode={diagram.studioMode || 'flowchart'}
        />
      </>
    );
  }

  // VIEW 3: FLOWLIFY STUDIO (Interactive Drag-and-Drop Editor)
  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-100 font-sans text-slate-800 antialiased">
      {/* Top Application Toolbar */}
      <Toolbar
        diagram={diagram}
        onUpdateTitle={(title) => setDiagram((prev) => ({ ...prev, title }))}
        onOpenUploadModal={() => setIsUploadModalOpen(true)}
        onOpenAIPromptModal={() => setIsAIPromptModalOpen(true)}
        onAutoLayout={handleAutoLayout}
        onUndo={handleUndo}
        onRedo={handleRedo}
        canUndo={history.length > 0}
        canRedo={future.length > 0}
        zoom={zoom}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onZoomReset={handleZoomReset}
        onZoomFit={handleZoomFit}
        snapToGrid={snapToGrid}
        onToggleSnapToGrid={() => setSnapToGrid(!snapToGrid)}
        onExportSvg={handleExportSvg}
        onExportPdf={handleExportPdf}
        onExportPng={handleExportPng}
        onExportJson={handleExportJson}
        onImportJson={handleImportJson}
        onCopySvg={handleCopySvg}
        hasOriginalImage={Boolean(diagram.originalImageUrl)}
        isCompareDrawerOpen={isCompareDrawerOpen}
        onToggleCompareDrawer={() => setIsCompareDrawerOpen(!isCompareDrawerOpen)}
        onLoadSample={handleLoadSample}
        onSaveToCloud={handleSaveToCloud}
        isSavingToCloud={isSavingToCloud}
        cloudSavedSuccess={cloudSavedSuccess}
        onOpenCloudDrawer={() => setIsCloudDrawerOpen(true)}
        onOpenVersionHistory={() => setIsVersionHistoryOpen(true)}
        onOpenCommentsDrawer={() => setIsCommentsDrawerOpen(true)}
        commentsCount={comments.length}
        unresolvedCommentsCount={unresolvedCommentsTotal}
        savedDiagramsCount={savedDiagrams.length}
        onBackToDashboard={() => setCurrentView('dashboard')}
        onOpenKeyboardShortcuts={() => setIsKeyboardShortcutsOpen(true)}
        selectedNodeIds={selectedNodeIds}
        onAlignNodes={handleAlignNodes}
        onDistributeNodes={handleDistributeNodes}
        onReorderNodes={handleReorderNodes}
        isMobileOrTablet={isMobileOrTablet}
        onToggleMobileSidebar={() => setMobileSidebarOpen(!mobileSidebarOpen)}
        onToggleMobileProperties={() => setMobilePropertiesOpen(!mobilePropertiesOpen)}
        mobileSidebarOpen={mobileSidebarOpen}
        mobilePropertiesOpen={mobilePropertiesOpen}
        onToggleStudioMode={handleToggleStudioMode}
      />

      {/* Main Studio Work Area */}
      <div className="flex flex-1 h-[calc(100vh-3.5rem)] relative overflow-hidden">
        {/* Left Sidebar: Shape Library (Docked on desktop >= 1024px, slide-over drawer on mobile/tablet) */}
        {!isMobileOrTablet ? (
          <Sidebar
            onAddNode={handleAddNode}
            onOpenUploadModal={() => setIsUploadModalOpen(true)}
            onOpenAIPromptModal={() => setIsAIPromptModalOpen(true)}
          />
        ) : (
          mobileSidebarOpen && (
            <div className="fixed inset-0 z-50 flex">
              <div
                className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
                onClick={() => setMobileSidebarOpen(false)}
              />
              <div className="relative z-50 w-72 max-w-[85vw] h-full bg-white shadow-2xl flex flex-col animate-in slide-in-from-left duration-200">
                <div className="p-3 bg-slate-900 text-white flex items-center justify-between">
                  <span className="font-bold text-xs flex items-center gap-2">
                    <Box size={14} className="text-blue-400" />
                    Shape Library
                  </span>
                  <button
                    onClick={() => setMobileSidebarOpen(false)}
                    className="p-1 hover:bg-slate-800 rounded text-slate-300 hover:text-white cursor-pointer"
                  >
                    <X size={16} />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto">
                  <Sidebar
                    onAddNode={(type) => {
                      handleAddNode(type);
                      setMobileSidebarOpen(false);
                    }}
                    onOpenUploadModal={() => {
                      setIsUploadModalOpen(true);
                      setMobileSidebarOpen(false);
                    }}
                    onOpenAIPromptModal={() => {
                      setIsAIPromptModalOpen(true);
                      setMobileSidebarOpen(false);
                    }}
                  />
                </div>
              </div>
            </div>
          )
        )}

        {/* Center: Interactive Drag-and-Drop Canvas (Full 100% width on tablet/mobile) */}
        <main className="flex-1 h-full relative w-full">
          <Canvas
            nodes={diagram.nodes}
            edges={diagram.edges}
            selectedNodeIds={selectedNodeIds}
            selectedEdgeId={selectedEdgeId}
            onSelectNode={handleSelectNode}
            onSelectEdge={handleSelectEdge}
            onClearSelection={handleClearSelection}
            onUpdateNodePosition={handleUpdateNodePosition}
            onBatchUpdateNodePositions={handleBatchUpdateNodePositions}
            onUpdateNodeText={handleUpdateNodeText}
            onUpdateNodeDimensions={handleUpdateNodeDimensions}
            onDuplicateNode={handleDuplicateNode}
            onDeleteNode={(id) => {
              setSelectedNodeIds([id]);
              handleDeleteSelectedNodes();
            }}
            onOpenProperties={() => {
              if (isMobileOrTablet) {
                setMobilePropertiesOpen(true);
              }
            }}
            onZoomFit={handleZoomFit}
            onAddEdge={handleAddEdge}
            onDeleteEdge={handleDeleteEdge}
            onUpdateEdgeLabel={handleUpdateEdgeLabel}
            zoom={zoom}
            pan={pan}
            onPanChange={setPan}
            onZoomChange={setZoom}
            snapToGrid={snapToGrid}
            canvasBg={diagram.canvasBg || '#F8FAFC'}
            gridType={diagram.gridType || 'dots'}
            pageView={Boolean(diagram.pageView)}
            commentsCountByNodeId={commentsCountByNodeId}
            hasUnresolvedCommentsByNodeId={hasUnresolvedCommentsByNodeId}
            onOpenNodeComments={handleOpenNodeComments}
            pages={currentPages}
            activePageIndex={activePageIndex}
            onSelectPage={handleSelectPage}
            onAddPage={handleAddPage}
            onRenamePage={handleRenamePage}
            onDeletePage={handleDeletePage}
            onDuplicatePage={handleDuplicatePage}
            onAddNodeAt={(type, x, y) => handleAddNode(type, x, y)}
            onRotateNode={handleRotateNode}
          />

          {/* Floating Mobile Bottom Action Dock */}
          {isMobileOrTablet && (
            <div className="absolute bottom-11 left-1/2 -translate-x-1/2 z-35 flex items-center gap-1.5 bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-full shadow-xl border border-slate-700/80 text-white text-xs select-none">
              <button
                onClick={() => setMobileSidebarOpen(true)}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full hover:bg-slate-800 text-slate-200 active:bg-slate-700 transition-colors font-medium cursor-pointer"
              >
                <Box size={13} className="text-blue-400" />
                <span>Shapes</span>
              </button>
              <div className="w-px h-4 bg-slate-700" />
              <button
                onClick={() => setMobilePropertiesOpen(true)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full transition-colors font-medium cursor-pointer ${
                  selectedNodeIds.length > 0
                    ? 'bg-blue-600 text-white font-semibold'
                    : 'text-slate-200 hover:bg-slate-800'
                }`}
              >
                <Sliders
                  size={13}
                  className={selectedNodeIds.length > 0 ? 'text-white' : 'text-slate-400'}
                />
                <span>Inspector {selectedNodeIds.length > 0 ? `(${selectedNodeIds.length})` : ''}</span>
              </button>
              <div className="w-px h-4 bg-slate-700" />
              <button
                onClick={() => handleAutoLayout('top-down')}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full hover:bg-slate-800 text-slate-200 active:bg-slate-700 transition-colors font-medium cursor-pointer"
                title="Auto Layout"
              >
                <LayoutGrid size={13} className="text-amber-400" />
                <span>Layout</span>
              </button>
            </div>
          )}
        </main>

        {/* Right: Properties Inspector Panel (Docked on desktop >= 1024px, slide-over drawer on mobile/tablet) */}
        {!isMobileOrTablet ? (
          <PropertiesPanel
            selectedNode={selectedNode}
            selectedEdge={selectedEdge}
            selectedNodeIds={selectedNodeIds}
            allNodes={diagram.nodes}
            diagramTitle={diagram.title}
            diagramDescription={diagram.description}
            canvasBg={diagram.canvasBg || '#F8FAFC'}
            gridType={diagram.gridType || 'dots'}
            pageView={Boolean(diagram.pageView)}
            snapToGrid={snapToGrid}
            totalNodes={diagram.nodes.length}
            totalEdges={diagram.edges.length}
            onUpdateNode={handleUpdateNode}
            onDeleteNode={(id) => {
              setSelectedNodeIds([id]);
              handleDeleteSelectedNodes();
            }}
            onDuplicateNode={handleDuplicateNode}
            onUpdateEdge={handleUpdateEdge}
            onDeleteEdge={handleDeleteEdge}
            onUpdateDiagramInfo={(title, desc) =>
              setDiagram((prev) => ({ ...prev, title, description: desc }))
            }
            onUpdateCanvasProps={handleUpdateCanvasProps}
            onAlignNodes={handleAlignNodes}
            onDistributeNodes={handleDistributeNodes}
            onReorderNodes={handleReorderNodes}
            nodeComments={comments}
            onAddNodeComment={handleAddComment}
            onToggleResolveComment={handleToggleResolveComment}
            onDeleteComment={handleDeleteComment}
            onOpenCommentsDrawer={() => setIsCommentsDrawerOpen(true)}
          />
        ) : (
          mobilePropertiesOpen && (
            <div className="fixed inset-0 z-50 flex justify-end">
              <div
                className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
                onClick={() => setMobilePropertiesOpen(false)}
              />
              <div className="relative z-50 w-80 max-w-[90vw] h-full bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
                <div className="p-3 bg-slate-900 text-white flex items-center justify-between">
                  <span className="font-bold text-xs flex items-center gap-2">
                    <Sliders size={14} className="text-blue-400" />
                    Inspector & Style
                  </span>
                  <button
                    onClick={() => setMobilePropertiesOpen(false)}
                    className="p-1 hover:bg-slate-800 rounded text-slate-300 hover:text-white cursor-pointer"
                  >
                    <X size={16} />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto">
                  <PropertiesPanel
                    selectedNode={selectedNode}
                    selectedEdge={selectedEdge}
                    selectedNodeIds={selectedNodeIds}
                    allNodes={diagram.nodes}
                    diagramTitle={diagram.title}
                    diagramDescription={diagram.description}
                    canvasBg={diagram.canvasBg || '#F8FAFC'}
                    gridType={diagram.gridType || 'dots'}
                    pageView={Boolean(diagram.pageView)}
                    snapToGrid={snapToGrid}
                    totalNodes={diagram.nodes.length}
                    totalEdges={diagram.edges.length}
                    onUpdateNode={handleUpdateNode}
                    onDeleteNode={(id) => {
                      setSelectedNodeIds([id]);
                      handleDeleteSelectedNodes();
                    }}
                    onDuplicateNode={handleDuplicateNode}
                    onUpdateEdge={handleUpdateEdge}
                    onDeleteEdge={handleDeleteEdge}
                    onUpdateDiagramInfo={(title, desc) =>
                      setDiagram((prev) => ({ ...prev, title, description: desc }))
                    }
                    onUpdateCanvasProps={handleUpdateCanvasProps}
                    onAlignNodes={handleAlignNodes}
                    onDistributeNodes={handleDistributeNodes}
                    onReorderNodes={handleReorderNodes}
                    nodeComments={comments}
                    onAddNodeComment={handleAddComment}
                    onToggleResolveComment={handleToggleResolveComment}
                    onDeleteComment={handleDeleteComment}
                    onOpenCommentsDrawer={() => setIsCommentsDrawerOpen(true)}
                  />
                </div>
              </div>
            </div>
          )
        )}
      </div>

      {/* Image Upload & AI Flowchart Vision Modal */}
      <UploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onSuccess={handleUploadSuccess}
        initialMode={diagram.studioMode || 'flowchart'}
      />

      {/* AI Assistant Modal for prompt generation & refinement */}
      <AIAssistantModal
        isOpen={isAIPromptModalOpen}
        onClose={() => setIsAIPromptModalOpen(false)}
        currentDiagram={diagram}
        onApplyDiagram={(newD) => {
          pushHistory(diagram);
          setDiagram(newD);
          setTimeout(() => handleZoomFit(), 100);
        }}
      />

      {/* Picture-in-Picture Original Uploaded Sketch Comparison Drawer */}
      <OriginalImageDrawer
        imageUrl={diagram.originalImageUrl || null}
        isOpen={isCompareDrawerOpen}
        onClose={() => setIsCompareDrawerOpen(false)}
      />

      {/* Cloud Firestore Diagrams Drawer */}
      <CloudDiagramsDrawer
        isOpen={isCloudDrawerOpen}
        onClose={() => setIsCloudDrawerOpen(false)}
        savedDiagrams={savedDiagrams}
        currentDiagramId={diagram.id}
        onSelectDiagram={handleOpenDiagram}
        onDeleteDiagram={handleDeleteDiagram}
        onNewDiagram={handleNewDiagram}
      />

      {/* Version History & State Restore Drawer */}
      <VersionHistoryDrawer
        isOpen={isVersionHistoryOpen}
        onClose={() => setIsVersionHistoryOpen(false)}
        currentDiagram={diagram}
        onRestoreVersion={handleRestoreVersion}
      />

      {/* Node Collaboration Comments Drawer */}
      <CommentsDrawer
        isOpen={isCommentsDrawerOpen}
        onClose={() => setIsCommentsDrawerOpen(false)}
        comments={comments}
        nodes={diagram.nodes}
        selectedNodeId={selectedNodeIds.length === 1 ? selectedNodeIds[0] : null}
        onSelectNode={(nodeId) => {
          setSelectedNodeIds([nodeId]);
          setSelectedEdgeId(null);
        }}
        onAddComment={handleAddComment}
        onToggleResolveComment={handleToggleResolveComment}
        onDeleteComment={handleDeleteComment}
        isSavingToCloud={isSavingToCloud}
      />

      {/* Keyboard Shortcuts Help Modal */}
      <KeyboardShortcutsModal
        isOpen={isKeyboardShortcutsOpen}
        onClose={() => setIsKeyboardShortcutsOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <FlowlifyApp />
    </AuthProvider>
  );
}
