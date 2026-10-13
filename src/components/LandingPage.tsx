import React, { useState } from 'react';
import {
  Sparkles,
  ArrowRight,
  Upload,
  Layers,
  Database,
  Cloud,
  Download,
  Check,
  MousePointer2,
  FileCode,
  FileText,
  Shield,
  Zap,
  Lock,
  ChevronRight,
  Maximize2,
  Menu,
  X,
  Layout,
  Compass,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { SignInButton, SignUpButton, UserButton, Show } from '@clerk/react';
import { SAMPLE_DIAGRAMS } from '../utils/samples';

interface LandingPageProps {
  onLaunchPlatform: () => void;
  onOpenAuthModal: () => void;
  onGoToEditor?: () => void;
  onGoToOmegaCad?: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onLaunchPlatform,
  onOpenAuthModal,
  onGoToEditor,
  onGoToOmegaCad,
}) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'flowchart' | 'whiteboard'>('flowchart');
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  const handleAction = () => {
    if (user) {
      onLaunchPlatform();
    } else {
      onOpenAuthModal();
    }
  };

  const scrollToSection = (id: string) => {
    setMobileMenuOpen(false);
    const element = document.querySelector(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#FAFAFC] text-slate-900 flex flex-col font-sans overflow-x-hidden">
      {/* 1. TOP BAR CONTRACT */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-6 lg:px-12 h-16 flex items-center justify-between gap-6">
        {/* Zone 1: Brand Wordmark */}
        <div className="flex items-center gap-2.5 shrink-0">
          <img
            src="/flowify.png"
            alt="Flowlify"
            className="w-9 h-9 rounded-xl object-contain shadow-xs border border-slate-100"
          />
          <span className="font-extrabold text-base tracking-tight text-slate-900">
            Flowlify
          </span>
        </div>

        {/* Zone 2: Navigation Links */}
        <nav className="hidden md:flex items-center gap-1 lg:gap-2 text-xs font-semibold text-slate-600">
          <button
            onClick={() => scrollToSection('#features')}
            className="px-3 py-1.5 rounded-lg hover:text-slate-900 hover:bg-slate-100 transition-colors whitespace-nowrap cursor-pointer"
          >
            Features
          </button>
          <button
            onClick={() => scrollToSection('#ai-vision')}
            className="px-3 py-1.5 rounded-lg hover:text-slate-900 hover:bg-slate-100 transition-colors whitespace-nowrap cursor-pointer"
          >
            Visual AI Engine
          </button>
          <button
            onClick={() => scrollToSection('#templates')}
            className="px-3 py-1.5 rounded-lg hover:text-slate-900 hover:bg-slate-100 transition-colors whitespace-nowrap cursor-pointer"
          >
            Templates
          </button>
          <button
            onClick={() => scrollToSection('#architecture')}
            className="px-3 py-1.5 rounded-lg hover:text-slate-900 hover:bg-slate-100 transition-colors whitespace-nowrap cursor-pointer"
          >
            OmegaCAD
          </button>
          <button
            onClick={() => scrollToSection('#pricing')}
            className="px-3 py-1.5 rounded-lg hover:text-slate-900 hover:bg-slate-100 transition-colors whitespace-nowrap cursor-pointer"
          >
            Pricing
          </button>
          <button
            onClick={onGoToOmegaCad}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-cyan-800 bg-cyan-50 hover:bg-cyan-100 border border-cyan-300 transition-all whitespace-nowrap cursor-pointer shadow-xs group"
          >
            <Compass size={14} className="text-cyan-600 group-hover:rotate-45 transition-transform" />
            <span className="font-bold">OmegaCAD Plus</span>
            <span className="text-[9px] font-bold bg-cyan-600 text-white px-1.5 py-0.2 rounded">
              CAD STUDIO
            </span>
          </button>
        </nav>

        {/* Zone 3: Primary Action */}
        <div className="hidden sm:flex items-center gap-2.5 shrink-0">
          <Show when="signed-out">
            <div className="flex items-center gap-2">
              <SignInButton mode="modal">
                <button className="text-xs font-semibold text-slate-600 hover:text-slate-900 px-3.5 py-2 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer">
                  Sign In
                </button>
              </SignInButton>
              <SignUpButton mode="modal">
                <button className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded-lg shadow-sm hover:shadow transition-all whitespace-nowrap cursor-pointer">
                  <span>Get Started Free</span>
                  <ArrowRight size={13} />
                </button>
              </SignUpButton>
            </div>
          </Show>

          <Show when="signed-in">
            <div className="flex items-center gap-2.5">
              {onGoToEditor && (
                <button
                  onClick={onGoToEditor}
                  className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold px-3 py-2 rounded-lg transition-colors cursor-pointer"
                >
                  <Layout size={13} className="text-blue-600" />
                  <span>Studio Canvas</span>
                </button>
              )}
              <button
                onClick={onLaunchPlatform}
                className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold px-4 py-2 rounded-lg shadow-sm transition-all whitespace-nowrap cursor-pointer"
              >
                <span>Dashboard</span>
                <ArrowRight size={13} />
              </button>
              <UserButton
                appearance={{
                  elements: {
                    avatarBox: 'w-8 h-8 rounded-full border border-slate-200',
                  },
                }}
              />
            </div>
          </Show>
        </div>

        {/* Mobile Menu Button */}
        <div className="flex sm:hidden items-center">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </header>

      {/* Mobile Navigation Dropdown Drawer */}
      {mobileMenuOpen && (
        <div className="sm:hidden fixed inset-x-0 top-16 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200 p-4 shadow-xl flex flex-col gap-2 text-xs font-medium animate-in slide-in-from-top-2 duration-150">
          <button
            onClick={() => scrollToSection('#features')}
            className="w-full text-left py-2 px-3 rounded-lg hover:bg-slate-50 text-slate-700 cursor-pointer"
          >
            Features
          </button>
          <button
            onClick={() => scrollToSection('#ai-vision')}
            className="w-full text-left py-2 px-3 rounded-lg hover:bg-slate-50 text-slate-700 cursor-pointer"
          >
            Visual AI Engine
          </button>
          <button
            onClick={() => scrollToSection('#templates')}
            className="w-full text-left py-2 px-3 rounded-lg hover:bg-slate-50 text-slate-700 cursor-pointer"
          >
            Template Library
          </button>
          <button
            onClick={() => scrollToSection('#architecture')}
            className="w-full text-left py-2 px-3 rounded-lg hover:bg-slate-50 text-slate-700 cursor-pointer"
          >
            Architecture
          </button>
          <button
            onClick={() => scrollToSection('#pricing')}
            className="w-full text-left py-2 px-3 rounded-lg hover:bg-slate-50 text-slate-700 cursor-pointer"
          >
            Pricing
          </button>

          <div className="border-t border-slate-100 my-1 pt-2 flex flex-col gap-2">
            {user ? (
              <>
                {onGoToEditor && (
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onGoToEditor();
                    }}
                    className="w-full flex items-center justify-center gap-2 bg-slate-100 text-slate-800 font-semibold py-2.5 rounded-lg text-xs"
                  >
                    <Layout size={14} className="text-blue-600" />
                    <span>Open Canvas Studio</span>
                  </button>
                )}
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onLaunchPlatform();
                  }}
                  className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white font-semibold py-2.5 rounded-lg text-xs shadow-xs"
                >
                  <span>Go to Workspace Dashboard</span>
                  <ArrowRight size={13} />
                </button>
              </>
            ) : (
              <div className="flex gap-2">
                <SignInButton mode="modal">
                  <button
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex-1 py-2 text-center text-xs font-semibold text-slate-700 bg-slate-100 rounded-lg cursor-pointer"
                  >
                    Sign In
                  </button>
                </SignInButton>
                <SignUpButton mode="modal">
                  <button
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex-1 py-2 text-center text-xs font-semibold text-white bg-blue-600 rounded-lg shadow-xs cursor-pointer"
                  >
                    Get Started Free
                  </button>
                </SignUpButton>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. HERO SECTION */}
      <section className="pt-16 pb-20 px-6 lg:px-12 max-w-7xl mx-auto w-full">
        <div className="text-center max-w-3xl mx-auto mb-12">
          {/* Unboxed Metadata Kicker */}
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-blue-600 mb-4 tracking-wide uppercase">
            <span>Next-Gen Visual Architecture</span>
            <span aria-hidden="true">·</span>
            <span>AI Diagram Reverse Engineering</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-950 mb-6 leading-[1.12] text-balance">
            Turn sketches and diagrams into production-grade flowcharts.
          </h1>

          <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto mb-8 text-balance">
            Flowlify analyzes whiteboard drawings, photos, and system sketches with proprietary visual AI, translating them into interactive drag-and-drop vector flowcharts with instant cloud sync.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5">
            <button
              onClick={handleAction}
              className="w-full sm:w-auto flex items-center justify-center gap-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-sm font-semibold px-6 py-3 rounded-xl shadow-md shadow-blue-600/20 hover:shadow-lg transition-all cursor-pointer"
            >
              <span>{user ? 'Open Flowlify Dashboard' : 'Sign Up & Launch Flowlify'}</span>
              <ArrowRight size={16} />
            </button>
            <a
              href="#interactive-demo"
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-white hover:bg-slate-50 text-slate-700 text-sm font-semibold px-6 py-3 rounded-xl border border-slate-200 transition-colors"
            >
              <span>See How It Works</span>
              <ChevronRight size={15} className="text-slate-400" />
            </a>
          </div>

          <div className="flex items-center justify-center gap-6 mt-8 text-xs text-slate-500">
            <span className="flex items-center gap-1.5">
              <Check size={14} className="text-emerald-500 stroke-[3]" />
              Free Google Sign-In
            </span>
            <span className="flex items-center gap-1.5">
              <Check size={14} className="text-emerald-500 stroke-[3]" />
              Enterprise Cloud Workspace
            </span>
            <span className="flex items-center gap-1.5">
              <Check size={14} className="text-emerald-500 stroke-[3]" />
              SVG & PDF Vector Export
            </span>
          </div>
        </div>

        {/* 3. INTERACTIVE HERO DEMO SHOWCASE */}
        <div id="interactive-demo" className="rounded-2xl border border-slate-200 bg-white shadow-xl overflow-hidden">
          {/* Demo Header Bar */}
          <div className="px-5 py-3.5 border-b border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 font-semibold text-slate-700">
              <div className="flex gap-1.5 mr-2">
                <span className="w-3 h-3 rounded-full bg-rose-400 inline-block" />
                <span className="w-3 h-3 rounded-full bg-amber-400 inline-block" />
                <span className="w-3 h-3 rounded-full bg-emerald-400 inline-block" />
              </div>
              <span>Flowlify Studio — User Authentication & 2FA Pipeline</span>
            </div>

            {/* Segmented Control */}
            <div className="flex items-center p-1 bg-slate-200/70 rounded-lg">
              <button
                onClick={() => setActiveTab('flowchart')}
                className={`px-3 py-1 font-semibold rounded-md transition-all cursor-pointer ${
                  activeTab === 'flowchart'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Interactive Flowchart
              </button>
              <button
                onClick={() => setActiveTab('whiteboard')}
                className={`px-3 py-1 font-semibold rounded-md transition-all cursor-pointer ${
                  activeTab === 'whiteboard'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Original Whiteboard Photo
              </button>
            </div>
          </div>

          {/* Demo Viewport Area */}
          <div className="min-h-[460px] bg-[#F8FAFC] relative overflow-hidden flex items-center justify-center p-4 sm:p-6">
            {activeTab === 'flowchart' ? (
              <div className="w-full h-full relative flex items-center justify-center">
                {/* Visual Simulation of Interactive Flowchart */}
                <svg viewBox="0 0 1020 400" preserveAspectRatio="xMidYMid meet" className="w-full h-auto max-h-[420px]">
                  <defs>
                    <pattern id="demo-grid" width="24" height="24" patternUnits="userSpaceOnUse">
                      <circle cx="12" cy="12" r="1" fill="#E2E8F0" />
                    </pattern>
                    <marker id="demo-arrow" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                      <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#64748B" />
                    </marker>
                    <marker id="demo-arrow-green" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                      <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#10B981" />
                    </marker>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#demo-grid)" />

                  {/* Orthogonal Edges */}
                  <path d="M 220 100 L 220 150 L 360 150 L 360 190" fill="none" stroke="#64748B" strokeWidth="2" markerEnd="url(#demo-arrow)" />
                  <path d="M 460 230 L 580 230" fill="none" stroke="#64748B" strokeWidth="2" markerEnd="url(#demo-arrow)" />
                  <path d="M 680 230 L 780 230" fill="none" stroke="#10B981" strokeWidth="2" markerEnd="url(#demo-arrow-green)" />
                  <path d="M 630 270 L 630 330 L 780 330" fill="none" stroke="#EF4444" strokeWidth="2" strokeDasharray="5,4" markerEnd="url(#demo-arrow)" />

                  {/* Edge Labels */}
                  <rect x="700" y="218" width="54" height="20" rx="10" fill="#FFFFFF" stroke="#E2E8F0" />
                  <text x="727" y="232" fill="#10B981" fontSize="10" fontWeight="bold" textAnchor="middle">Valid</text>

                  <rect x="670" y="320" width="60" height="20" rx="10" fill="#FFFFFF" stroke="#E2E8F0" />
                  <text x="700" y="334" fill="#EF4444" fontSize="10" fontWeight="bold" textAnchor="middle">Invalid</text>

                  {/* Node 1: Start Pill */}
                  <g transform="translate(120, 65)">
                    <rect width="200" height="65" rx="32" fill="#3B82F6" fillOpacity="0.12" stroke="#3B82F6" strokeWidth="2" />
                    <text x="100" y="32" fill="#0F172A" fontSize="12" fontWeight="bold" textAnchor="middle">User Submits Credentials</text>
                    <text x="100" y="48" fill="#64748B" fontSize="10" textAnchor="middle">HTTPS POST /api/auth/login</text>
                  </g>

                  {/* Node 2: Database Cylinder */}
                  <g transform="translate(260, 190)">
                    <rect width="200" height="75" rx="8" fill="#8B5CF6" fillOpacity="0.12" stroke="#8B5CF6" strokeWidth="2" />
                    <text x="100" y="36" fill="#0F172A" fontSize="12" fontWeight="bold" textAnchor="middle">PostgreSQL Hash Lookup</text>
                    <text x="100" y="52" fill="#64748B" fontSize="10" textAnchor="middle">Argon2id password verification</text>
                  </g>

                  {/* Node 3: Decision Diamond */}
                  <g transform="translate(550, 185)">
                    <polygon points="80,0 160,45 80,90 0,45" fill="#F59E0B" fillOpacity="0.12" stroke="#F59E0B" strokeWidth="2" />
                    <text x="80" y="44" fill="#0F172A" fontSize="11" fontWeight="bold" textAnchor="middle">Password Valid?</text>
                    <text x="80" y="58" fill="#64748B" fontSize="9" textAnchor="middle">Timing-safe compare</text>
                  </g>

                  {/* Node 4: Success End */}
                  <g transform="translate(780, 200)">
                    <rect width="200" height="65" rx="32" fill="#10B981" fillOpacity="0.12" stroke="#10B981" strokeWidth="2" />
                    <text x="100" y="32" fill="#0F172A" fontSize="12" fontWeight="bold" textAnchor="middle">Issue JWT & Session</text>
                    <text x="100" y="48" fill="#64748B" fontSize="10" textAnchor="middle">Set secure HttpOnly cookie</text>
                  </g>

                  {/* Node 5: Error End */}
                  <g transform="translate(780, 300)">
                    <rect width="200" height="65" rx="10" fill="#EF4444" fillOpacity="0.12" stroke="#EF4444" strokeWidth="2" />
                    <text x="100" y="32" fill="#0F172A" fontSize="12" fontWeight="bold" textAnchor="middle">Return 401 Unauthorized</text>
                    <text x="100" y="48" fill="#64748B" fontSize="10" textAnchor="middle">Trigger rate limit counter</text>
                  </g>
                </svg>

                {/* Overlay Floating Action Prompt */}
                <div className="absolute bottom-4 right-4 bg-white/95 backdrop-blur-md p-3 rounded-xl border border-slate-200 shadow-lg flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs">
                    AI
                  </div>
                  <div className="text-xs">
                    <p className="font-semibold text-slate-800">Reverse engineered in 1.4s</p>
                    <p className="text-[10px] text-slate-500">5 nodes · 4 connections · 100% editable</p>
                  </div>
                  <button
                    onClick={handleAction}
                    className="ml-2 text-xs font-semibold bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
                  >
                    Edit Live
                  </button>
                </div>
              </div>
            ) : (
              <div className="w-full h-full flex items-center justify-center p-2">
                <img
                  src={SAMPLE_DIAGRAMS[0].thumbnailSvgUrl}
                  alt="Original Whiteboard Sketch"
                  className="max-h-[380px] w-auto max-w-full object-contain rounded-xl shadow-md border border-slate-200 bg-white"
                />
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 4. FOUR PILLARS FEATURE SHOWCASE */}
      <section id="features" className="py-20 bg-white border-y border-slate-200 px-6 lg:px-12">
        <div className="max-w-7xl mx-auto">
          <div className="max-w-2xl mb-14">
            <h2 className="text-xs font-bold text-blue-600 tracking-wider uppercase mb-2">
              Capabilities
            </h2>
            <h3 className="text-3xl font-extrabold tracking-tight text-slate-900 mb-3">
              Built for software architects, systems engineers, and product teams.
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Every step from napkin sketch to vector architectural asset is streamlined with zero friction.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Feature 1 */}
            <div className="p-6 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:shadow-md transition-all">
              <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center mb-4">
                <Upload size={20} />
              </div>
              <h4 className="font-bold text-sm text-slate-900 mb-2">
                Image & Whiteboard Ingestion
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Upload photos of conference whiteboards, paper napkin sketches, or screenshots. Flowlify AI deciphers boxes, diamonds, and hand-drawn arrows.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-6 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:shadow-md transition-all">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center mb-4">
                <MousePointer2 size={20} />
              </div>
              <h4 className="font-bold text-sm text-slate-900 mb-2">
                Drag-and-Drop Vector Studio
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Magnetic connection ports, 90° orthogonal elbow routing, smooth Bezier curves, customizable node palettes, and instant auto-layout.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-6 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:shadow-md transition-all">
              <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center mb-4">
                <Cloud size={20} />
              </div>
              <h4 className="font-bold text-sm text-slate-900 mb-2">
                Encrypted Cloud Storage
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Sign in with Google to securely store all your system flowcharts in your private workspace with real-time sync across sessions and devices.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="p-6 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:shadow-md transition-all">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-4">
                <Download size={20} />
              </div>
              <h4 className="font-bold text-sm text-slate-900 mb-2">
                Multi-Format Vector Export
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Export standalone SVG files with embedded styles, print-ready high-DPI PDF documents via jsPDF, transparent PNGs, or raw project JSON.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. TEMPLATES GALLERY SECTION */}
      <section id="templates" className="py-20 px-6 lg:px-12 max-w-7xl mx-auto w-full">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
          <div>
            <h2 className="text-xs font-bold text-blue-600 tracking-wider uppercase mb-2">
              Ready-to-Use Architecture
            </h2>
            <h3 className="text-3xl font-extrabold tracking-tight text-slate-900">
              Curated Production Templates
            </h3>
          </div>
          <p className="text-xs text-slate-500 max-w-md">
            Start from proven cloud pipelines and business workflows or test your own custom designs.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {SAMPLE_DIAGRAMS.map((sample) => (
            <div
              key={sample.id}
              className="rounded-2xl border border-slate-200 bg-white p-5 hover:shadow-lg transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="h-44 rounded-xl bg-slate-50 border border-slate-100 overflow-hidden mb-4 flex items-center justify-center p-2">
                  <img
                    src={sample.thumbnailSvgUrl}
                    alt={sample.title}
                    className="w-full h-full object-contain group-hover:scale-105 transition-transform"
                  />
                </div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-blue-600 mb-1">
                  {sample.category}
                </div>
                <h4 className="font-bold text-sm text-slate-900 mb-2">{sample.title}</h4>
                <p className="text-xs text-slate-500 leading-relaxed mb-4">
                  {sample.description}
                </p>
              </div>

              <button
                onClick={handleAction}
                className="w-full py-2 px-3 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <span>Open in Flowlify</span>
                <ArrowRight size={13} />
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* 5.5 OMEGACAD PLUS ARCHITECTURAL & CIVIL SHOWCASE */}
      <section id="architecture" className="py-20 bg-[#0B1E36] text-white px-6 lg:px-12 border-t border-slate-800 relative overflow-hidden">
        {/* Background Cad Grid Subtle Accent */}
        <div className="absolute inset-0 opacity-15 pointer-events-none bg-[radial-gradient(#38BDF8_1px,transparent_1px)] [background-size:24px_24px]" />

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-10 mb-16">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950 border border-cyan-500/40 text-cyan-300 text-xs font-mono font-bold mb-4 shadow-sm">
                <Compass size={14} className="text-cyan-400" />
                <span>OMEGACAD PLUS 15.0 ENGINE</span>
              </div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white mb-4">
                Precision 2D CAD & Architectural Drafting in the Browser.
              </h2>
              <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                Reverse-engineer hand-drawn paper sketches, blueprints, and whiteboard floor plans into production-ready 2D CAD layouts in seconds. Features real-world millimeter scaling, ISO 13567 layers, orthogonal snap, and native AutoCAD/IntelliCAD DXF export.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <button
                onClick={onGoToOmegaCad}
                className="flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-sm px-6 py-3.5 rounded-xl shadow-lg shadow-cyan-950 hover:shadow-cyan-900 transition-all cursor-pointer"
              >
                <Compass size={18} />
                <span>Launch OmegaCAD Plus Studio</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>

          {/* 3 Value Columns */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-md space-y-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-950 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-bold">
                01
              </div>
              <h3 className="text-base font-bold text-white">AI Sketch-to-CAD Scanner</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Photograph any paper blueprint or napkin floor plan. Our Gemini Vision model automatically detects walls, doors, windows, room areas, and dimensions into editable CAD geometry.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-md space-y-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-950 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-bold">
                02
              </div>
              <h3 className="text-base font-bold text-white">AutoCAD & IntelliCAD .DXF Export</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                1-click download compliant ASCII DXF vector drawings organized into standard CAD layers (A-WALL, A-DOOR, A-DIMS). Open directly in AutoCAD, CMS IntelliCAD, Revit, or Rhino.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-md space-y-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-950 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-bold">
                03
              </div>
              <h3 className="text-base font-bold text-white">Infinite Crosshairs & ISO Layers</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Full-screen CAD crosshairs with real-time digital coordinate HUD (WCS), 90° Ortho mode locking (F8), wall hatch fills, and live metric m² / sq ft room area calculators.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. PRICING & TIERS */}
      <section id="pricing" className="py-20 bg-slate-50 border-t border-slate-200 px-6 lg:px-12">
        <div className="max-w-4xl mx-auto text-center mb-12">
          <h2 className="text-xs font-bold text-blue-600 tracking-wider uppercase mb-2">
            Pricing
          </h2>
          <h3 className="text-3xl font-extrabold tracking-tight text-slate-900 mb-3">
            Free to create, free to export.
          </h3>
          <p className="text-xs text-slate-500">
            Sign up with Google to start building diagrams with real-time cloud persistence.
          </p>
        </div>

        <div className="max-w-3xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Free Community Plan */}
          <div className="p-8 rounded-2xl border-2 border-blue-500 bg-white shadow-md flex flex-col justify-between">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-blue-600 mb-1">
                Community Edition
              </div>
              <div className="text-3xl font-extrabold text-slate-900 mb-1">$0</div>
              <p className="text-xs text-slate-500 mb-6">Free forever with Google Sign-in</p>

              <div className="space-y-3 text-xs text-slate-700 text-left mb-8">
                <div className="flex items-center gap-2.5">
                  <Check size={14} className="text-emerald-500" />
                  <span>Unlimited visual flowchart editing</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Check size={14} className="text-emerald-500" />
                  <span>Proprietary Visual AI diagram reverse engineering</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Check size={14} className="text-emerald-500" />
                  <span>Instant multi-device cloud persistence</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Check size={14} className="text-emerald-500" />
                  <span>Clean standalone SVG & high-DPI PDF export</span>
                </div>
              </div>
            </div>

            <button
              onClick={handleAction}
              className="w-full py-2.5 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              {user ? 'Open Dashboard' : 'Get Started Free'}
            </button>
          </div>

          {/* Pro Team Plan */}
          <div className="p-8 rounded-2xl border border-slate-200 bg-white flex flex-col justify-between">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                Enterprise & Teams
              </div>
              <div className="text-3xl font-extrabold text-slate-900 mb-1">Custom</div>
              <p className="text-xs text-slate-500 mb-6">For enterprise organizations</p>

              <div className="space-y-3 text-xs text-slate-700 text-left mb-8">
                <div className="flex items-center gap-2.5">
                  <Check size={14} className="text-emerald-500" />
                  <span>Dedicated VPC & custom LLM deployment</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Check size={14} className="text-emerald-500" />
                  <span>SAML / SSO multi-tenant authentication</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Check size={14} className="text-emerald-500" />
                  <span>Custom corporate shape & icon libraries</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Check size={14} className="text-emerald-500" />
                  <span>Priority 99.9% uptime SLA</span>
                </div>
              </div>
            </div>

            <button
              onClick={handleAction}
              className="w-full py-2.5 text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white rounded-xl transition-colors cursor-pointer"
            >
              Contact Sales
            </button>
          </div>
        </div>
      </section>

      {/* 7. FOOTER */}
      <footer className="mt-auto bg-white border-t border-slate-200 py-8 px-6 lg:px-12 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <img
              src="/flowify.png"
              alt="Flowlify"
              className="w-6 h-6 rounded-md object-contain"
            />
            <span className="font-bold text-slate-800">Flowlify</span>
            <span>·</span>
            <span>AI-Powered Visual Architecture Studio</span>
          </div>
          <div className="flex items-center gap-6">
            <span>Powered by Flowlify Intelligent Engine & Secure Cloud Workspace</span>
            <span>·</span>
            <span>© 2026 Flowlify</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
