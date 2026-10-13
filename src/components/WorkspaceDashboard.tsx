import React, { useState } from 'react';
import {
  Plus,
  Upload,
  Search,
  Cloud,
  FileCode,
  FileText,
  Trash2,
  Copy,
  ExternalLink,
  Layers,
  Sparkles,
  LogOut,
  FolderOpen,
  ArrowRight,
  Filter,
  CheckCircle2,
  Clock,
  Compass,
  Tag,
  Eye,
  X,
  Workflow,
  Sparkle,
  History,
  MessageSquare,
  ChevronRight,
  Home,
  Layout,
  Menu,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { UserButton } from '@clerk/react';
import { DiagramData } from '../types/flowchart';
import { SAMPLE_DIAGRAMS, SampleTemplate } from '../utils/samples';
import { downloadSvg, downloadPdf } from '../utils/export';

interface WorkspaceDashboardProps {
  savedDiagrams: DiagramData[];
  onOpenDiagram: (diagram: DiagramData) => void;
  onOpenDiagramWithHistory?: (diagram: DiagramData) => void;
  onOpenDiagramWithComments?: (diagram: DiagramData) => void;
  onNewDiagram: () => void;
  onOpenUploadModal: () => void;
  onDeleteDiagram: (diagramId: string) => void;
  onDuplicateDiagram: (diagram: DiagramData) => void;
  onLoadSample: (sample: SampleTemplate) => void;
  onGoToLanding: () => void;
  onGoToEditor?: () => void;
  onGoToOmegaCad?: () => void;
  activeDiagramTitle?: string;
}

// Helper component to highlight matching search query keywords
function HighlightText({ text, query }: { text: string; query: string }) {
  if (!query.trim() || !text) return <>{text}</>;
  const words = query
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  if (words.length === 0) return <>{text}</>;

  const regex = new RegExp(`(${words.join('|')})`, 'gi');
  const parts = text.split(regex);

  return (
    <>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <mark
            key={i}
            className="bg-amber-200 text-amber-950 font-semibold px-0.5 rounded-xs"
          >
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </>
  );
}

export const WorkspaceDashboard: React.FC<WorkspaceDashboardProps> = ({
  savedDiagrams,
  onOpenDiagram,
  onOpenDiagramWithHistory,
  onOpenDiagramWithComments,
  onNewDiagram,
  onOpenUploadModal,
  onDeleteDiagram,
  onDuplicateDiagram,
  onLoadSample,
  onGoToLanding,
  onGoToEditor,
  onGoToOmegaCad,
  activeDiagramTitle,
}) => {
  const { user, logout } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeNav, setActiveNav] = useState<'all' | 'templates'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [previewTemplate, setPreviewTemplate] = useState<SampleTemplate | null>(null);
  const [showNewMenu, setShowNewMenu] = useState<boolean>(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState<boolean>(false);
  const searchInputRef = React.useRef<HTMLInputElement>(null);

  // Keyboard shortcut listener: press '/' to focus search, 'Escape' to clear
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === '/' &&
        document.activeElement?.tagName !== 'INPUT' &&
        document.activeElement?.tagName !== 'TEXTAREA'
      ) {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (e.key === 'Escape' && document.activeElement === searchInputRef.current) {
        setSearchQuery('');
        searchInputRef.current?.blur();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Filter saved diagrams by title, description, or node keywords
  const filteredDiagrams = React.useMemo(() => {
    const raw = searchQuery.trim().toLowerCase();
    if (!raw) return savedDiagrams;

    const keywords = raw.split(/\s+/).filter(Boolean);

    return savedDiagrams.filter((d) => {
      const titleLower = (d.title || '').toLowerCase();
      const descLower = (d.description || '').toLowerCase();
      const nodeLabelsLower = (d.nodes || [])
        .map((n) => `${n.label || ''} ${n.sublabel || ''}`.toLowerCase())
        .join(' ');

      // Each keyword must match either title, description, or any node content
      return keywords.every(
        (kw) =>
          titleLower.includes(kw) ||
          descLower.includes(kw) ||
          nodeLabelsLower.includes(kw)
      );
    });
  }, [savedDiagrams, searchQuery]);

  // Filter templates
  const templateCategories = [
    'All',
    'Product & UX',
    'Architecture',
    'Agile & DevOps',
    'Security & Auth',
    'E-Commerce',
    'AI & Data',
  ];

  const filteredTemplates = SAMPLE_DIAGRAMS.filter((t) => {
    const matchesCategory =
      selectedCategory === 'All' || t.category === selectedCategory;
    const matchesSearch =
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.tags?.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const totalNodes = savedDiagrams.reduce((acc, d) => acc + (d.nodes?.length || 0), 0);
  const totalEdges = savedDiagrams.reduce((acc, d) => acc + (d.edges?.length || 0), 0);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#F8FAFC] select-none text-slate-800 antialiased font-sans">
      {/* Mobile Backdrop */}
      {isMobileNavOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-35 md:hidden"
          onClick={() => setIsMobileNavOpen(false)}
        />
      )}

      {/* 1. DASHBOARD SIDEBAR */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 border-r border-slate-200 bg-white flex flex-col justify-between shrink-0 transition-transform duration-200 md:static md:translate-x-0 ${
          isMobileNavOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        }`}
      >
        <div>
          {/* Brand */}
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <img
                src="/flowify.png"
                alt="Flowlify"
                className="w-8 h-8 rounded-lg object-contain shadow-xs border border-slate-100"
              />
              <div>
                <span className="font-extrabold text-sm tracking-tight text-slate-900 block">
                  Flowlify
                </span>
                <span className="text-[10px] text-slate-400 font-medium">
                  Workspace Console
                </span>
              </div>
            </div>
            <button
              onClick={onGoToLanding}
              className="flex items-center gap-1 text-[11px] font-medium text-slate-400 hover:text-slate-800 px-2 py-1 rounded-md hover:bg-slate-100 transition-colors cursor-pointer"
              title="Return to Product Overview"
            >
              <Home size={12} />
              <span>Overview</span>
            </button>
          </div>

          {/* Quick Create CTA with Dropdown */}
          <div className="p-3 relative">
            <button
              onClick={() => setShowNewMenu(!showNewMenu)}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs py-2.5 rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <Plus size={15} />
              <span>Create New Diagram</span>
            </button>

            {showNewMenu && (
              <div
                className="absolute left-3 right-3 mt-1.5 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 text-xs animate-in fade-in zoom-in-95 duration-150"
                onClick={() => setShowNewMenu(false)}
              >
                <button
                  onClick={onNewDiagram}
                  className="w-full text-left px-3.5 py-2 hover:bg-blue-50 text-slate-700 hover:text-blue-700 flex items-center gap-2.5 transition-colors cursor-pointer"
                >
                  <Workflow size={14} className="text-blue-600" />
                  <div>
                    <span className="font-semibold block text-slate-900">Blank Canvas</span>
                    <span className="text-[10px] text-slate-400">Start with empty diagram</span>
                  </div>
                </button>

                <button
                  onClick={() => setActiveNav('templates')}
                  className="w-full text-left px-3.5 py-2 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 flex items-center gap-2.5 transition-colors cursor-pointer"
                >
                  <Compass size={14} className="text-indigo-600" />
                  <div>
                    <span className="font-semibold block text-slate-900">Browse Template Library</span>
                    <span className="text-[10px] text-slate-400">6 pre-built architecture flows</span>
                  </div>
                </button>

                <button
                  onClick={onOpenUploadModal}
                  className="w-full text-left px-3.5 py-2 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 flex items-center gap-2.5 transition-colors cursor-pointer border-t border-slate-100"
                >
                  <Upload size={14} className="text-emerald-600" />
                  <div>
                    <span className="font-semibold block text-slate-900">Import Sketch / Image</span>
                    <span className="text-[10px] text-slate-400">Visual AI reverse-engineers it</span>
                  </div>
                </button>
              </div>
            )}
          </div>

          {/* Navigation Items */}
          <nav className="px-2 space-y-1 text-xs">
            {/* Active Studio Canvas link */}
            {onGoToEditor && (
              <button
                onClick={onGoToEditor}
                className="w-full flex items-center justify-between px-3 py-2 rounded-lg font-medium transition-colors text-slate-700 hover:bg-blue-50/60 hover:text-blue-700 cursor-pointer group"
                title="Switch to active Studio editor"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="relative flex h-2 w-2 shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span className="font-semibold truncate">
                    {activeDiagramTitle ? `Studio: ${activeDiagramTitle}` : 'Active Studio Canvas'}
                  </span>
                </div>
                <ArrowRight size={13} className="text-slate-400 group-hover:text-blue-600 shrink-0 transition-transform group-hover:translate-x-0.5" />
              </button>
            )}

            {/* OmegaCAD Plus CAD Studio Launcher */}
            {onGoToOmegaCad && (
              <button
                onClick={onGoToOmegaCad}
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-cyan-900 bg-cyan-50/90 hover:bg-cyan-100 border border-cyan-200 transition-colors cursor-pointer group my-1 shadow-xs"
                title="Launch OmegaCAD Plus 2D CAD & Architectural Studio"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Compass size={15} className="text-cyan-600 group-hover:rotate-45 transition-transform shrink-0" />
                  <span className="truncate">OmegaCAD Plus Studio</span>
                </div>
                <span className="text-[9px] font-bold bg-cyan-600 text-white px-1.5 py-0.2 rounded shrink-0">
                  CAD
                </span>
              </button>
            )}

            <button
              onClick={() => setActiveNav('all')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg font-medium transition-colors cursor-pointer ${
                activeNav === 'all'
                  ? 'bg-blue-50 text-blue-700 font-semibold'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <FolderOpen size={16} />
                <span>My Flowcharts</span>
              </div>
              <span className="text-[11px] font-bold px-1.5 py-0.5 rounded bg-slate-200/60 text-slate-600">
                {savedDiagrams.length}
              </span>
            </button>

            <button
              onClick={() => setActiveNav('templates')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg font-medium transition-colors cursor-pointer ${
                activeNav === 'templates'
                  ? 'bg-blue-50 text-blue-700 font-semibold'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Compass size={16} />
                <span>Template Library</span>
              </div>
              <span className="text-[11px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-700">
                {SAMPLE_DIAGRAMS.length}
              </span>
            </button>
          </nav>
        </div>

        {/* User Profile & Cloud Status at Bottom */}
        <div className="p-3 border-t border-slate-200 bg-slate-50/60">
          <div className="flex items-center gap-1.5 text-[10px] text-emerald-600 font-semibold mb-2 px-1">
            <Cloud size={12} />
            <span>Cloud Workspace Connected</span>
          </div>

          <div className="flex items-center justify-between bg-white p-2 rounded-xl border border-slate-200/80 shadow-2xs">
            <div className="flex items-center gap-2 min-w-0">
              <UserButton
                appearance={{
                  elements: {
                    avatarBox: 'w-7 h-7 rounded-full border border-slate-200 shrink-0',
                  },
                }}
              />
              <div className="min-w-0">
                <p className="font-semibold text-xs text-slate-800 truncate">
                  {user?.displayName || 'User'}
                </p>
                <p className="text-[10px] text-slate-400 truncate">{user?.email}</p>
              </div>
            </div>

            <button
              onClick={logout}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
              title="Sign Out"
            >
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </aside>

      {/* 2. MAIN DASHBOARD CONTENT */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Top Header Bar */}
        <header className="h-16 border-b border-slate-200 bg-white px-4 sm:px-6 flex items-center justify-between gap-4 shrink-0">
          {/* Interactive Breadcrumb Trail & Mobile Menu Button */}
          <div className="flex items-center gap-2 text-xs">
            <button
              onClick={() => setIsMobileNavOpen(!isMobileNavOpen)}
              className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 md:hidden cursor-pointer mr-1"
              title="Open Navigation"
            >
              <Menu size={16} />
            </button>
            <button
              onClick={onGoToLanding}
              className="text-slate-400 hover:text-blue-600 transition-colors font-medium cursor-pointer"
            >
              Home
            </button>
            <ChevronRight size={12} className="text-slate-300" />
            <button
              onClick={() => setActiveNav('all')}
              className="text-slate-400 hover:text-blue-600 transition-colors font-medium cursor-pointer"
            >
              Workspace
            </button>
            <ChevronRight size={12} className="text-slate-300" />
            <span className="font-bold text-slate-800">
              {activeNav === 'all' ? 'All Flowcharts' : 'Template Library'}
            </span>
          </div>

          {/* Search & Actions */}
          <div className="flex items-center gap-3">
            <div className="relative w-72 hidden sm:block">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={
                  activeNav === 'all'
                    ? 'Search by title, description, or node...'
                    : 'Search templates (e.g. Journey, Sprint)...'
                }
                className="w-full pl-9 pr-8 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800 transition-all placeholder:text-slate-400"
              />
              {searchQuery ? (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    searchInputRef.current?.focus();
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                  title="Clear search (Esc)"
                >
                  <X size={12} />
                </button>
              ) : (
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-mono font-medium text-slate-400 bg-slate-200/60 px-1 py-0.5 rounded border border-slate-200 pointer-events-none">
                  /
                </span>
              )}
            </div>

            {onGoToEditor && (
              <button
                onClick={onGoToEditor}
                className="hidden md:flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold px-3 py-2 rounded-lg transition-colors cursor-pointer"
                title="Return to canvas editor"
              >
                <Layout size={13} className="text-blue-600" />
                <span>Open Canvas Studio</span>
              </button>
            )}

            <button
              onClick={onOpenUploadModal}
              className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold px-3 py-2 rounded-lg transition-colors cursor-pointer"
            >
              <Upload size={13} />
              <span className="hidden sm:inline">Upload Sketch</span>
            </button>

            <button
              onClick={onNewDiagram}
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-3.5 py-2 rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              <Plus size={14} />
              <span>Blank Canvas</span>
            </button>
          </div>
        </header>

        {/* Mobile Search Row (visible on mobile only) */}
        <div className="sm:hidden px-4 py-2.5 bg-white border-b border-slate-200">
          <div className="relative w-full">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by title, description, or node..."
              className="w-full pl-9 pr-8 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:ring-1 focus:ring-blue-500 text-slate-800"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400"
              >
                <X size={12} />
              </button>
            )}
          </div>
        </div>

        {/* Dashboard Viewport */}
        <main className="flex-1 overflow-y-auto p-6 lg:p-8 space-y-6">
          {/* Metrics Strip */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                Total Flowcharts
              </span>
              <span className="text-2xl font-extrabold text-slate-900 tabular-nums">
                {savedDiagrams.length}
              </span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                Nodes Modeled
              </span>
              <span className="text-2xl font-extrabold text-blue-600 tabular-nums">
                {totalNodes}
              </span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                Connections Active
              </span>
              <span className="text-2xl font-extrabold text-indigo-600 tabular-nums">
                {totalEdges}
              </span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                Cloud Sync Status
              </span>
              <div className="flex items-center gap-1.5 text-sm font-bold text-emerald-600">
                <CheckCircle2 size={16} />
                <span>100% Up to Date</span>
              </div>
            </div>
          </div>

          {/* VIEW A: ALL USER FLOWCHARTS */}
          {activeNav === 'all' && (
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                <div className="flex items-center gap-2.5">
                  <h3 className="font-bold text-sm text-slate-800">
                    Your Saved Flowcharts
                  </h3>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                    {filteredDiagrams.length}
                    {searchQuery ? ` of ${savedDiagrams.length}` : ''}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setActiveNav('templates')}
                    className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 font-semibold cursor-pointer"
                  >
                    <Compass size={14} />
                    <span>Browse Pre-Built Templates →</span>
                  </button>
                </div>
              </div>

              {/* Active Search Filter Banner */}
              {searchQuery && (
                <div className="flex flex-wrap items-center justify-between gap-2.5 p-3 bg-blue-50/70 border border-blue-200/80 rounded-xl mb-5 text-xs">
                  <div className="flex items-center gap-2 text-slate-700">
                    <Search size={14} className="text-blue-600 shrink-0" />
                    <span>
                      Showing results matching{' '}
                      <strong className="text-blue-900 font-bold bg-white px-1.5 py-0.5 rounded border border-blue-200">
                        &ldquo;{searchQuery}&rdquo;
                      </strong>{' '}
                      ({filteredDiagrams.length}{' '}
                      {filteredDiagrams.length === 1 ? 'diagram' : 'diagrams'})
                    </span>
                  </div>

                  <button
                    onClick={() => setSearchQuery('')}
                    className="flex items-center gap-1 text-[11px] font-semibold text-blue-700 hover:text-blue-900 bg-white hover:bg-blue-100/60 px-2.5 py-1 rounded-lg border border-blue-200 transition-colors cursor-pointer shadow-2xs"
                  >
                    <X size={12} />
                    <span>Clear Search Filter</span>
                  </button>
                </div>
              )}

              {filteredDiagrams.length === 0 ? (
                <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center max-w-lg mx-auto my-8 space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
                    {searchQuery ? <Search size={22} /> : <Layers size={24} />}
                  </div>
                  <h4 className="font-bold text-sm text-slate-800">
                    {searchQuery
                      ? `No flowcharts matching "${searchQuery}"`
                      : 'No flowcharts in your workspace yet'}
                  </h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    {searchQuery
                      ? 'No diagrams matched your search query in titles, descriptions, or node labels. Try different keywords or reset the filter.'
                      : 'Create a new flowchart from scratch, start from a pre-built template, or upload a sketch to reverse engineer.'}
                  </p>
                  <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                    {searchQuery ? (
                      <button
                        onClick={() => setSearchQuery('')}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs px-4 py-2 rounded-xl transition-colors cursor-pointer"
                      >
                        Clear Search Filter
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={onNewDiagram}
                          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs px-4 py-2 rounded-xl transition-colors cursor-pointer"
                        >
                          + Start Blank Canvas
                        </button>
                        <button
                          onClick={() => setActiveNav('templates')}
                          className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-xs px-4 py-2 rounded-xl transition-colors cursor-pointer"
                        >
                          Browse Pre-Built Templates
                        </button>
                        <button
                          onClick={onOpenUploadModal}
                          className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs px-4 py-2 rounded-xl transition-colors cursor-pointer"
                        >
                          Upload Sketch
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {filteredDiagrams.map((diag) => {
                    // Check if search matched on node labels
                    const matchingNodes = searchQuery
                      ? (diag.nodes || []).filter((n) =>
                          searchQuery
                            .toLowerCase()
                            .split(/\s+/)
                            .filter(Boolean)
                            .some(
                              (kw) =>
                                (n.label || '').toLowerCase().includes(kw) ||
                                (n.sublabel || '').toLowerCase().includes(kw)
                            )
                        )
                      : [];

                    return (
                      <div
                        key={diag.id}
                        className="bg-white rounded-xl border border-slate-200/90 hover:border-slate-300 hover:shadow-sm transition-all p-4.5 flex flex-col justify-between group"
                      >
                        <div>
                          {/* Card Header */}
                          <div className="flex items-start justify-between gap-2 mb-1.5">
                            <h4 className="font-semibold text-sm text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1">
                              <HighlightText text={diag.title} query={searchQuery} />
                            </h4>
                            <span className="text-[11px] text-slate-400 font-medium capitalize shrink-0">
                              {diag.direction || 'top-down'}
                            </span>
                          </div>

                          {diag.description && (
                            <p className="text-xs text-slate-500 line-clamp-2 mb-3">
                              <HighlightText
                                text={diag.description}
                                query={searchQuery}
                              />
                            </p>
                          )}

                          {/* Matching node keyword indicator */}
                          {matchingNodes.length > 0 &&
                            !diag.title.toLowerCase().includes(searchQuery.toLowerCase()) && (
                              <div className="flex items-center gap-1.5 text-[10px] text-blue-700 bg-blue-50/80 px-2 py-1 rounded-md border border-blue-100 mb-3">
                                <Search size={11} className="shrink-0 text-blue-500" />
                                <span className="truncate">
                                  Matched node:{' '}
                                  <strong>{matchingNodes[0].label}</strong>
                                </span>
                              </div>
                            )}

                          {/* Node Elements Preview Strip */}
                          <div className="h-18 bg-slate-50/70 rounded-lg border border-slate-100 mb-3.5 p-2 flex items-center justify-center gap-1.5 overflow-hidden">
                            {diag.nodes?.slice(0, 3).map((node, i) => (
                              <div
                                key={i}
                                className="px-2 py-1 rounded-md text-[9.5px] font-medium truncate max-w-[90px] border shadow-xs"
                                style={{
                                  backgroundColor: `${node.color}10`,
                                  borderColor: `${node.color}40`,
                                  color: '#0F172A',
                                }}
                              >
                                {node.label}
                              </div>
                            ))}
                            {diag.nodes && diag.nodes.length > 3 && (
                              <span className="text-[10px] text-slate-400 font-medium">
                                +{diag.nodes.length - 3}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Card Footer (Clean Typographic Metadata) */}
                        <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                          <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                            <span>{diag.nodes?.length || 0} nodes</span>
                            <span aria-hidden="true">·</span>
                            <span>{diag.edges?.length || 0} wires</span>
                          </div>

                          <div className="flex items-center gap-1">
                            {onOpenDiagramWithComments && (
                              <button
                                onClick={() => onOpenDiagramWithComments(diag)}
                                className="p-1.5 rounded-md text-slate-400 hover:text-blue-600 hover:bg-slate-100 transition-colors cursor-pointer"
                                title="View & Add Node Comments"
                              >
                                <MessageSquare size={13} />
                              </button>
                            )}

                            <button
                              onClick={() => {
                                if (onOpenDiagramWithHistory) {
                                  onOpenDiagramWithHistory(diag);
                                } else {
                                  onOpenDiagram(diag);
                                }
                              }}
                              className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                              title="View Version History"
                            >
                              <History size={13} />
                            </button>

                            <button
                              onClick={() => {
                                if (diag.id) onDeleteDiagram(diag.id);
                              }}
                              className="p-1.5 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                              title="Delete Flowchart"
                            >
                              <Trash2 size={13} />
                            </button>

                            <button
                              onClick={() => onOpenDiagram(diag)}
                              className="flex items-center gap-1 font-medium text-xs text-white bg-slate-900 hover:bg-slate-800 px-2.5 py-1.5 rounded-md transition-colors cursor-pointer shadow-xs ml-1"
                            >
                              <span>Open</span>
                              <ArrowRight size={12} />
                            </button>
                          </div>
                        </div>
                      </div>
                  );
                })}
              </div>
            )}
            </div>
          )}

          {/* VIEW B: TEMPLATES LIBRARY */}
          {activeNav === 'templates' && (
            <div className="space-y-6">
              {/* Header & Category Filter Tabs */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h3 className="font-extrabold text-base text-slate-900 mb-1">
                    Pre-Built Flowchart Template Library
                  </h3>
                  <p className="text-xs text-slate-500">
                    Production-grade templates for user journeys, technical architecture, agile sprint cycles, and cloud pipelines.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">
                    Showing {filteredTemplates.length} templates
                  </span>
                </div>
              </div>

              {/* Segmented Category Filter Bar */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 p-1 bg-slate-200/60 rounded-xl">
                {templateCategories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                      selectedCategory === cat
                        ? 'bg-white text-blue-700 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Templates Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredTemplates.map((template) => (
                  <div
                    key={template.id}
                    className="bg-white rounded-2xl border border-slate-200 p-5 hover:border-blue-400 hover:shadow-lg transition-all flex flex-col justify-between group"
                  >
                    <div>
                      {/* Thumbnail Preview Area */}
                      <div className="h-44 bg-slate-50 rounded-xl border border-slate-100 mb-3 overflow-hidden p-2 flex items-center justify-center relative group-hover:bg-blue-50/20 transition-colors">
                        <img
                          src={template.thumbnailSvgUrl}
                          alt={template.title}
                          className="w-full h-full object-contain group-hover:scale-102 transition-transform"
                        />
                        <button
                          onClick={() => setPreviewTemplate(template)}
                          className="absolute bottom-2 right-2 p-1.5 rounded-lg bg-white/90 backdrop-blur border border-slate-200 text-slate-600 hover:text-blue-600 shadow-xs opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                          title="Quick Preview"
                        >
                          <Eye size={13} />
                        </button>
                      </div>

                      {/* Category Label */}
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">
                          {template.category}
                        </span>
                        <span className="text-[10px] text-slate-400 capitalize">
                          {template.diagram.direction}
                        </span>
                      </div>

                      {/* Title */}
                      <h4 className="font-bold text-sm text-slate-900 mb-1.5 group-hover:text-blue-700 transition-colors">
                        {template.title}
                      </h4>

                      {/* Description */}
                      <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mb-3">
                        {template.description}
                      </p>

                      {/* Tags */}
                      {template.tags && (
                        <div className="flex flex-wrap gap-1 mb-4">
                          {template.tags.slice(0, 3).map((tag, i) => (
                            <span
                              key={i}
                              className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-medium"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Action Bar */}
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                      <div className="text-[11px] text-slate-400">
                        <span>{template.diagram.nodes.length} nodes</span>
                        <span className="mx-1.5">·</span>
                        <span>{template.diagram.edges.length} edges</span>
                      </div>

                      <button
                        onClick={() => onLoadSample(template)}
                        className="flex items-center gap-1.5 font-bold text-xs text-white bg-blue-600 hover:bg-blue-700 px-3.5 py-1.5 rounded-xl shadow-xs transition-colors cursor-pointer"
                      >
                        <span>Use Template</span>
                        <ArrowRight size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* 3. TEMPLATE PREVIEW MODAL */}
      {previewTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div>
                <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">
                  {previewTemplate.category}
                </span>
                <h3 className="font-bold text-slate-900 text-base">
                  {previewTemplate.title}
                </h3>
              </div>
              <button
                onClick={() => setPreviewTemplate(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Preview Image */}
            <div className="p-6 bg-[#F8FAFC] flex items-center justify-center border-b border-slate-100">
              <img
                src={previewTemplate.thumbnailSvgUrl}
                alt={previewTemplate.title}
                className="max-h-[300px] w-auto object-contain rounded-xl shadow-sm border border-slate-200 bg-white"
              />
            </div>

            {/* Info & Nodes Summary */}
            <div className="p-5 space-y-3">
              <p className="text-xs text-slate-600 leading-relaxed">
                {previewTemplate.description}
              </p>

              <div className="flex items-center gap-4 text-xs text-slate-500 pt-1">
                <span className="flex items-center gap-1 font-semibold text-slate-700">
                  <Workflow size={13} className="text-blue-600" />
                  {previewTemplate.diagram.nodes.length} Nodes Modeled
                </span>
                <span className="flex items-center gap-1 font-semibold text-slate-700">
                  <ArrowRight size={13} className="text-indigo-600" />
                  {previewTemplate.diagram.edges.length} Wire Connections
                </span>
                <span className="text-slate-400">
                  Direction: {previewTemplate.diagram.direction}
                </span>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-2">
              <button
                onClick={() => setPreviewTemplate(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onLoadSample(previewTemplate);
                  setPreviewTemplate(null);
                }}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-5 py-2 rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                <span>Start Diagram with this Template</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
