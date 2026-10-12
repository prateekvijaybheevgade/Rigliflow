# 🌊 Flowlify (Rigliflow)

> **Next-Generation AI-Powered Diagramming & Flowchart Studio**  
> Turn hand-drawn whiteboard sketches, architecture drawings, and natural language prompts into interactive, fully editable vector diagrams — beautifully responsive across Desktop, Tablets, and Mobile.

[![React](https://img.shields.io/badge/React-19.0-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-8.3-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-v4-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Google Gemini](https://img.shields.io/badge/Google%20Gemini-2.4-4285F4?logo=google&logoColor=white)](https://ai.google.dev/)
[![Clerk](https://img.shields.io/badge/Clerk-Authentication-6C47FF?logo=clerk&logoColor=white)](https://clerk.com/)
[![Firebase](https://img.shields.io/badge/Firebase-Firestore-FFCA28?logo=firebase&logoColor=black)](https://firebase.google.com/)

---

## 🌟 Key Features

### 🤖 1. Multimodal AI Diagram Engine
- **Sketch / Image to Diagram**: Upload photos of hand-drawn whiteboards, paper napkin sketches, or architecture screenshots. Flowlify uses Google Gemini Multimodal AI to extract components, relationships, labels, and geometry into live editable nodes and connectors.
- **Natural Language Prompt to Flow**: Type descriptions like *"Microservices architecture with API Gateway, Kafka, and Redis caching"* to instantly generate complete, styled diagram graphs.
- **AI Auto-Complete & Optimization**: Enhance and expand existing diagrams with AI recommendations.

### 🎨 2. Professional Interactive Vector Canvas
- **17+ Rich Shape Geometries**:
  - Flowchart: Process, Decision, Start/End, Preparation (Hexagon), Merge/Yield (Triangle), Subprocess
  - Cloud & Architecture: API Gateway / Cloud, Compute Server, Database Cylinder, FIFO Queue, Container Frame
  - Data & UML: Entity Schema Table, Actor / Persona, Sticky Note, Document Report, Transparent Text Box
- **Smart Wire Routing**: 4 directional connection ports (`Top`, `Right`, `Bottom`, `Left`) with automatic orthogonal right-angle routing, bezier curves, and custom edge labels.
- **Marquee Multi-Selection**: Shift-drag box selection to group, move, align, or batch-delete elements.
- **Align & Distribute Suite**: Precision alignment (`Left`, `Center`, `Right`, `Top`, `Middle`, `Bottom`) and even spacing distribution (`Horizontal`, `Vertical`).

### 📱 3. Precision Multi-Device Gestures (Mobile, Tablet & Desktop)
- **4 Corner Resizing Handles**: Generous 32px hit-target areas centered on `NW`, `NE`, `SE`, and `SW` corners with smooth bounds checking and grid snapping.
- **Floating Quick-Action Node Pill**:
  - `Edit`: Double-click or single-tap inline text editing.
  - `-` / `+`: Instant one-tap node scaling (`-20%` shrink, `+25%` enlarge).
  - `Zoom`: One-tap node focus that centers the screen and zooms into the selected element (`1.35x`).
  - `Duplicate` / `Inspect` / `Delete`.
- **Touch Gesture Engine**:
  - **Pinch-to-Zoom**: Fluid two-finger pinch zoom and panning.
  - **Touch Separation**: 1 finger on a node drags the element; 1 finger on canvas space pans the canvas.
  - **Double-Tap Canvas**: Toggles between 1.0x standard zoom and 1.35x zoomed-in view.
  - **Responsive Layout**: Full-width studio canvas on smartphones with drawer sidebars and touch action docks.

### 🎛️ 4. In-Depth Properties & Styling Inspector
- **Dimensions & Scale**:
  - Live numeric Width and Height inputs with step adjustment.
  - Quick scale presets: `-20% Smaller`, `+25% Larger`, `+50% Bigger`.
  - Standard sizes: `S (150×65)`, `M (210×75)`, `L (280×100)`.
- **Color & Fill**: Curated modern palettes, gradient fills, opacity control, and stroke width/styles (solid, dashed, dotted).
- **Typography & Icon Badges**: Font families (Inter, JetBrains Mono, Serif, Handwriting), font sizes, text alignments, and system icon overlays (AWS, Cloud, DB, Security, Warning, User, etc.).

### 📂 5. Cloud Workspace, Multi-Page & Collaboration
- **Authentication**: Modern, secure user authentication and profile management powered by **Clerk**.
- **Cloud Persistence**: Seamless diagram synchronization to **Firebase Firestore**.
- **Multi-Page Tabs**: Multi-sheet diagramming support (draw.io style tabs) within a single file.
- **Collaboration Comments**: Pin threaded comment discussions to specific nodes with resolved/unresolved tracking.
- **Universal Export**: Export your work to **PNG** (High-Res), **SVG** (Scalable Vector), **PDF** (Printable Document), **JSON** (Flowlify schema), and **Mermaid.js** Markdown.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Core Framework** | React 19, TypeScript 5.8 |
| **Bundler & Tooling** | Vite 8.3, TSX, PostCSS |
| **Styling** | TailwindCSS v4, Lucide Icons, Motion |
| **AI Integration** | Google Gemini SDK (`@google/genai`) |
| **Authentication** | Clerk React (`@clerk/react`) |
| **Database & Sync** | Firebase Firestore 13 |
| **Export Engines** | jsPDF, html2canvas, DOMPurify, SVG Vector Pipeline |
| **Backend API** | Node.js, Express 4.21 |

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (version 18.0 or higher recommended)
- `npm` or `pnpm` or `yarn`

### 1. Clone the Repository
```bash
git clone https://github.com/prateekvijaybheevgade/Rigliflow.git
cd Rigliflow
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Create a `.env.local` file in the root directory:

```env
# Clerk Authentication Keys (From https://dashboard.clerk.com)
VITE_CLERK_PUBLISHABLE_KEY=pk_test_your_clerk_publishable_key
CLERK_SECRET_KEY=sk_test_your_clerk_secret_key

# Google Gemini AI API Key (From https://aistudio.google.com)
GEMINI_API_KEY=your_gemini_api_key

# Optional App URL
APP_URL=http://localhost:3000
```

> **Note**: For cloud persistence, ensure your Firebase applet configuration file (`firebase-applet-config.json` or Firebase environment config) is configured in your project root.

### 4. Run Development Server
```bash
npm run dev
```

The application will start at:
```
http://localhost:3000
```

### 5. Production Build
```bash
npm run build
```

To preview the built production bundle:
```bash
npm run preview
```

---

## 📁 Directory Structure

```
Flowlify/
├── public/                 # Static assets and favicon
├── src/
│   ├── components/         # Core application UI components
│   │   ├── Canvas.tsx          # Interactive Vector Drag-and-Drop canvas
│   │   ├── NodeComponent.tsx   # Node rendering, handles, pill & SVG shapes
│   │   ├── EdgeComponent.tsx   # Connection wires, labels & routing
│   │   ├── Sidebar.tsx         # Shape library, draggable items & AI tools
│   │   ├── Toolbar.tsx         # Canvas controls, zoom, export, undo/redo
│   │   ├── PropertiesPanel.tsx # Style, dimensions, text & arrange inspector
│   │   ├── WorkspaceDashboard.tsx # Cloud diagrams list & recents
│   │   └── UploadModal.tsx     # AI sketch-to-diagram upload modal
│   ├── lib/
│   │   └── firebase.ts     # Firebase Firestore client setup
│   ├── services/
│   │   ├── diagramService.ts # Diagram CRUD & comment threads
│   │   └── geminiService.ts  # Gemini API multimodal integration
│   ├── types/
│   │   └── flowchart.ts    # TypeScript definitions for nodes, edges, themes
│   ├── utils/
│   │   ├── geometry.ts     # Collision detection, port coordinates & pathing
│   │   ├── exportUtils.ts  # PNG, SVG, PDF, and Mermaid export engines
│   │   └── alignment.ts    # Multi-node alignment and distribution logic
│   ├── App.tsx             # Main Application root & state management
│   ├── main.tsx            # React root mount with Clerk Provider
│   └── index.css           # TailwindCSS tokens & canvas styling
├── server.ts               # Express backend proxy for Gemini AI endpoints
├── package.json            # Project dependencies and npm scripts
├── tsconfig.json           # TypeScript configuration
└── vite.config.ts          # Vite build and plugin configuration
```

---

## ⌨️ Shortcuts & Gesture Cheat Sheet

### Desktop Shortcuts
| Action | Key Combination |
|---|---|
| **Pan Canvas** | `Space + Drag` or `Middle Click + Drag` |
| **Zoom In / Out** | `Ctrl + Scroll Wheel` or `Zoom Buttons` |
| **Marquee Box Select** | `Shift + Drag on empty canvas` |
| **Duplicate Selection** | `Ctrl + D` |
| **Undo / Redo** | `Ctrl + Z` / `Ctrl + Y` |
| **Delete Node / Edge** | `Delete` or `Backspace` |
| **Edit Label Inline** | `Double Click on node` |
| **Connect Wires** | `Click & drag from port handle (blue dot)` |
| **Resize Node** | `Drag any of the 4 corner handles (NW, NE, SE, SW)` |

### Touch & Mobile Gestures
| Gesture | Action |
|---|---|
| **Two-Finger Pinch** | Zoom canvas in or out smoothly |
| **Two-Finger Pan** | Pan and navigate across the canvas |
| **Single-Finger Drag on Node** | Move node position |
| **Single-Finger Drag on Canvas** | Pan canvas |
| **Double-Tap on Node** | Open inline text editing |
| **Double-Tap on Canvas** | Toggle between 1.0x and 1.35x zoom |
| **Corner Handle Drag** | Smooth node resizing |
| **Floating Action Pill** | 1-tap size adjustment (`-` / `+`) and Focus (`Zoom`) |

---

## 🛡️ License

This project is licensed under the [MIT License](LICENSE).

---

<p align="center">
  Crafted with ❤️ by Prateek Vijay Bheevgade
</p>
