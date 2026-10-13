import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import {
  Mountain,
  Box,
  Eye,
  Sliders,
  Sparkles,
  Play,
  Pause,
  ChevronDown,
  ArrowLeft,
  Camera,
  Sun,
  Maximize,
  Info,
  Maximize2,
  Columns,
  Layers,
  Check,
} from 'lucide-react';
import { CadDrawing, CadEntity } from '../../types/omegacad';

export type ShadingStyle = 'holographic' | 'cyber' | 'bim' | 'xray';

interface OmegaCAD3DViewerProps {
  drawing: CadDrawing;
  onBackTo2D: () => void;
  isSplitView?: boolean;
}

// Helper: Generate a high-contrast floating 3D text badge sprite
function createBillboardText(
  title: string,
  subtitle?: string,
  accentColor: string = '#00f5d4',
  bgColor: string = 'rgba(2, 27, 32, 0.88)'
): THREE.Sprite {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 140;
  const ctx = canvas.getContext('2d')!;

  // Background rounded badge with neon border
  ctx.fillStyle = bgColor;
  ctx.strokeStyle = accentColor;
  ctx.lineWidth = 4;
  ctx.beginPath();
  if (typeof ctx.roundRect === 'function') {
    ctx.roundRect(12, 12, 488, 116, 24);
  } else {
    ctx.rect(12, 12, 488, 116);
  }
  ctx.fill();
  ctx.stroke();

  // Glow line accent
  ctx.fillStyle = accentColor;
  ctx.fillRect(40, 118, 432, 4);

  // Title Text
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 34px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(title, 256, 52);

  // Subtitle / Area
  if (subtitle) {
    ctx.fillStyle = accentColor;
    ctx.font = 'bold 22px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText(subtitle, 256, 92);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  const spriteMat = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthWrite: false,
  });
  const sprite = new THREE.Sprite(spriteMat);
  sprite.scale.set(90, 25, 1);
  return sprite;
}

export const OmegaCAD3DViewer: React.FC<OmegaCAD3DViewerProps> = ({
  drawing,
  onBackTo2D,
  isSplitView = false,
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);

  // 3D View Settings & HUD States
  const [shadingStyle, setShadingStyle] = useState<ShadingStyle>('holographic');
  const [showTerrain, setShowTerrain] = useState<boolean>(true);
  const [showGrid, setShowGrid] = useState<boolean>(true);
  const [show2DBlueprint, setShow2DBlueprint] = useState<boolean>(true); // Ground Blueprint Trace
  const [showWalls, setShowWalls] = useState<boolean>(true);
  const [showDoorsWindows, setShowDoorsWindows] = useState<boolean>(true);
  const [showFurniture, setShowFurniture] = useState<boolean>(true);
  const [showRoomFloors, setShowRoomFloors] = useState<boolean>(true);
  const [showRoomLabels, setShowRoomLabels] = useState<boolean>(true);
  const [showSiteLandscape, setShowSiteLandscape] = useState<boolean>(true);
  const [showDimensions, setShowDimensions] = useState<boolean>(true);
  const [autoRotate, setAutoRotate] = useState<boolean>(false);

  // 2D to 3D Extrusion Height and Lift Progress (0% = flat 2D blueprint, 100% = full 3D building)
  const [liftProgress, setLiftProgress] = useState<number>(1.0); // 0.0 to 1.0
  const [maxWallHeight, setMaxWallHeight] = useState<number>(150); // mm scale in 3D scene (equiv ~2.8m)
  const [sunAngle, setSunAngle] = useState<number>(55);
  const [isControlsExpanded, setIsControlsExpanded] = useState<boolean>(!isSplitView);

  // Three.js Scene References
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const terrainMeshRef = useRef<THREE.Mesh | null>(null);
  const contourMeshRef = useRef<THREE.LineSegments | null>(null);
  const gridHelperRef = useRef<THREE.GridHelper | null>(null);
  const dirLightRef = useRef<THREE.DirectionalLight | null>(null);
  const cadBuildingGroupRef = useRef<THREE.Group | null>(null);
  const blueprintFloorGroupRef = useRef<THREE.Group | null>(null);

  // Bounding center of 2D CAD entities to center the building on the terrain plateau
  const cadCenter = useMemo(() => {
    if (!drawing.entities || drawing.entities.length === 0) {
      return { x: 500, y: 400, spanX: 800, spanY: 600 };
    }
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    drawing.entities.forEach((e) => {
      minX = Math.min(minX, e.x);
      maxX = Math.max(maxX, e.x + (e.width || 0));
      minY = Math.min(minY, e.y);
      maxY = Math.max(maxY, e.y + (e.height || 0));
    });
    return {
      x: (minX + maxX) / 2,
      y: (minY + maxY) / 2,
      spanX: maxX - minX,
      spanY: maxY - minY,
    };
  }, [drawing.entities]);

  // INITIALIZE THREE.JS SCENE
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    // 1. Scene with Deep Teal Holographic Atmosphere
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x011b20);
    scene.fog = new THREE.FogExp2(0x012328, 0.0006);

    // 2. Camera: Perspective view matching the user's reference image angle
    const camera = new THREE.PerspectiveCamera(42, width / height, 10, 8000);
    camera.position.set(500, 460, 820);
    cameraRef.current = camera;

    // 3. WebGL Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      preserveDrawingBuffer: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;
    container.replaceChildren(renderer.domElement);

    // 4. Orbit Controls (Smooth damping, rotation & pan)
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.maxPolarAngle = Math.PI / 2 + 0.05;
    controls.minDistance = 50;
    controls.maxDistance = 3500;
    controls.target.set(0, 35, 0);
    controlsRef.current = controls;

    // 5. High-Tech Holographic Lighting System
    const ambientLight = new THREE.AmbientLight(0x0a333c, 1.2);
    scene.add(ambientLight);

    const hemiLight = new THREE.HemisphereLight(0x38bdf8, 0x064e3b, 0.9);
    scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight(0xe0f2fe, 1.9);
    dirLight.position.set(400, 700, 500);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.camera.near = 50;
    dirLight.shadow.camera.far = 2500;
    const d = 750;
    dirLight.shadow.camera.left = -d;
    dirLight.shadow.camera.right = d;
    dirLight.shadow.camera.top = d;
    dirLight.shadow.camera.bottom = -d;
    scene.add(dirLight);
    dirLightRef.current = dirLight;

    // Cyan Neon Digital Twin Accent Light
    const cyanPointLight = new THREE.PointLight(0x00f5d4, 2.4, 1400);
    cyanPointLight.position.set(0, 140, 80);
    scene.add(cyanPointLight);

    // 6. BUILD CYAN PERSPECTIVE COORDINATE GROUND PLANE
    // Matches the neon cyan coordinate grid extending across the digital twin horizon
    const gridHelper = new THREE.GridHelper(3000, 54, 0x00f5d4, 0x0891b2);
    gridHelper.position.y = 8;
    const gridMaterial = gridHelper.material as THREE.LineBasicMaterial;
    gridMaterial.transparent = true;
    gridMaterial.opacity = 0.82;
    gridMaterial.depthWrite = false;
    scene.add(gridHelper);
    gridHelperRef.current = gridHelper;

    // 7. BUILD TOPOLOGICAL RELIEF TERRAIN (Emerald Mountains & Coastal Contours)
    const terrainGeo = new THREE.PlaneGeometry(3000, 3000, 110, 110);
    terrainGeo.rotateX(-Math.PI / 2);

    const posAttr = terrainGeo.attributes.position;
    const colors = new Float32Array(posAttr.count * 3);

    for (let i = 0; i < posAttr.count; i++) {
      const x = posAttr.getX(i);
      const z = posAttr.getZ(i);

      // Distance from center where CAD building sits
      const distFromCenter = Math.sqrt(x * x + z * z);

      // Site excavation plateau: Smoothly flat in the center for the 2D CAD blueprint
      let plateauFactor = 1.0;
      if (distFromCenter < 400) {
        plateauFactor = Math.pow(distFromCenter / 400, 2) * 0.05;
      } else if (distFromCenter < 680) {
        plateauFactor = 0.05 + ((distFromCenter - 400) / 280) * 0.95;
      }

      // Procedural Topography Harmonics:
      // High emerald ridges to north/east, coastal shelf to south/west
      const wave1 = Math.sin(x * 0.0022 + 0.5) * Math.cos(z * 0.002) * 190;
      const wave2 = Math.sin(x * 0.0055 - z * 0.004) * 65;
      const wave3 = Math.cos(x * 0.011 + z * 0.009) * 35;
      const ridge = Math.abs(Math.sin((x * 0.75 + z) * 0.0028)) * 135;
      const shelfBias = (z - 100) * 0.08;

      let y = (wave1 + wave2 + wave3 + ridge + shelfBias) * plateauFactor;
      if (y < -30) y = -30;

      posAttr.setY(i, y);

      // Emerald & Cyan Vertex Color Gradient (Matching screenshot)
      let r = 0.06, g = 0.72, b = 0.51; // emerald default
      if (y < 6) {
        // Water/bathymetry: cyan/teal
        r = 0.02; g = 0.52; b = 0.65;
      } else if (y < 42) {
        // Shoreline / low contour: glowing turquoise
        const t = (y - 6) / 36;
        r = 0.0 + t * 0.06;
        g = 0.95 - t * 0.22;
        b = 0.82 - t * 0.31;
      } else if (y < 125) {
        // Lush emerald slopes
        const t = (y - 42) / 83;
        r = 0.06 + t * 0.02;
        g = 0.73 - t * 0.14;
        b = 0.51 - t * 0.22;
      } else if (y < 220) {
        // Deep forest emerald
        const t = (y - 125) / 95;
        r = 0.08 + t * 0.12;
        g = 0.59 + t * 0.20;
        b = 0.29 + t * 0.05;
      } else {
        // Bright lime peaks
        r = 0.26; g = 0.84; b = 0.45;
      }

      colors[i * 3] = r;
      colors[i * 3 + 1] = g;
      colors[i * 3 + 2] = b;
    }

    terrainGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    terrainGeo.computeVertexNormals();

    const terrainMat = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.85,
      metalness: 0.1,
      flatShading: true,
    });
    const terrainMesh = new THREE.Mesh(terrainGeo, terrainMat);
    terrainMesh.receiveShadow = true;
    terrainMesh.castShadow = true;
    scene.add(terrainMesh);
    terrainMeshRef.current = terrainMesh;

    // Contour wireframe overlay (Topological contour lines)
    const contourGeo = new THREE.WireframeGeometry(terrainGeo);
    const contourMat = new THREE.LineBasicMaterial({
      color: 0x00f5d4,
      transparent: true,
      opacity: 0.18,
      depthWrite: false,
    });
    const contourLines = new THREE.LineSegments(contourGeo, contourMat);
    scene.add(contourLines);
    contourMeshRef.current = contourLines;

    // Water Surface
    const waterGeo = new THREE.PlaneGeometry(3000, 3000);
    waterGeo.rotateX(-Math.PI / 2);
    const waterMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      transparent: true,
      opacity: 0.45,
      roughness: 0.1,
      metalness: 0.8,
    });
    const waterMesh = new THREE.Mesh(waterGeo, waterMat);
    waterMesh.position.y = 4;
    scene.add(waterMesh);

    // 8. ANIMATION LOOP
    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      if (controlsRef.current) {
        if (autoRotate) {
          controlsRef.current.autoRotate = true;
          controlsRef.current.autoRotateSpeed = 1.2;
        } else {
          controlsRef.current.autoRotate = false;
        }
        controlsRef.current.update();
      }

      renderer.render(scene, camera);
    };

    animate();

    // Resize Handler
    const handleResize = () => {
      if (!container || !rendererRef.current || !cameraRef.current) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      if (container) {
        container.replaceChildren();
      }
    };
  }, []);

  // BUILD 2D GROUND BLUEPRINT PROJECTION (GHOST BLUEPRINT ON SITE PAD)
  // This visually connects the 2D CAD map with the 3D structures rising above it!
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    if (blueprintFloorGroupRef.current) {
      scene.remove(blueprintFloorGroupRef.current);
    }

    const blueprintGroup = new THREE.Group();
    blueprintGroup.position.set(0, 9.5, 0); // Sits right on top of site plateau

    const cx = cadCenter.x;
    const cy = cadCenter.y;
    const scale = 0.72;

    // Base Architectural Paper Plaque
    const padW = (cadCenter.spanX + 180) * scale;
    const padD = (cadCenter.spanY + 180) * scale;
    const padGeo = new THREE.PlaneGeometry(padW, padD);
    padGeo.rotateX(-Math.PI / 2);
    const padMat = new THREE.MeshBasicMaterial({
      color: 0x021d24,
      transparent: true,
      opacity: 0.75,
      depthWrite: false,
    });
    const padMesh = new THREE.Mesh(padGeo, padMat);
    blueprintGroup.add(padMesh);

    // Border line around 2D Blueprint Pad
    const padBorderGeo = new THREE.EdgesGeometry(padGeo);
    const padBorderMat = new THREE.LineBasicMaterial({
      color: 0x00f5d4,
      transparent: true,
      opacity: 0.65,
    });
    const padBorder = new THREE.LineSegments(padBorderGeo, padBorderMat);
    blueprintGroup.add(padBorder);

    // Render 2D CAD entities as flat glowing laser blueprint lines on the floor
    drawing.entities.forEach((entity) => {
      const ex = (entity.x + (entity.width || 0) / 2 - cx) * scale;
      const ez = (entity.y + (entity.height || 0) / 2 - cy) * scale;
      const w = Math.max(entity.width * scale, 4);
      const d = Math.max(entity.height * scale, 4);

      if (entity.type === 'arch_wall') {
        // 2D Wall footprint outline
        const rectGeo = new THREE.PlaneGeometry(w, d);
        rectGeo.rotateX(-Math.PI / 2);
        const rectMat = new THREE.MeshBasicMaterial({
          color: 0x0284c7,
          transparent: true,
          opacity: 0.45,
          depthWrite: false,
        });
        const rectMesh = new THREE.Mesh(rectGeo, rectMat);
        rectMesh.position.set(ex, 0.4, ez);
        blueprintGroup.add(rectMesh);

        const borderGeo = new THREE.EdgesGeometry(rectGeo);
        const borderMat = new THREE.LineBasicMaterial({ color: 0x38bdf8, linewidth: 2 });
        const border = new THREE.LineSegments(borderGeo, borderMat);
        border.position.set(ex, 0.5, ez);
        blueprintGroup.add(border);
      } else if (entity.type === 'arch_door') {
        // 2D Swing Arc on floor
        const arcPoints = [];
        const radius = Math.min(w, d);
        for (let a = 0; a <= Math.PI / 2; a += 0.1) {
          arcPoints.push(new THREE.Vector3(Math.cos(a) * radius - radius / 2, 0.5, Math.sin(a) * radius - radius / 2));
        }
        const arcGeo = new THREE.BufferGeometry().setFromPoints(arcPoints);
        const arcMat = new THREE.LineBasicMaterial({ color: 0x60a5fa });
        const arc = new THREE.Line(arcGeo, arcMat);
        arc.position.set(ex, 0.5, ez);
        blueprintGroup.add(arc);
      } else if (entity.type === 'arch_room') {
        // Room perimeter dashed line
        const rGeo = new THREE.PlaneGeometry(w, d);
        rGeo.rotateX(-Math.PI / 2);
        const rMat = new THREE.MeshBasicMaterial({
          color: entity.color ? parseInt(entity.color.replace('#', '0x'), 16) : 0x0ea5e9,
          transparent: true,
          opacity: 0.15,
          depthWrite: false,
        });
        const rMesh = new THREE.Mesh(rGeo, rMat);
        rMesh.position.set(ex, 0.2, ez);
        blueprintGroup.add(rMesh);
      }
    });

    blueprintGroup.visible = show2DBlueprint;
    scene.add(blueprintGroup);
    blueprintFloorGroupRef.current = blueprintGroup;
  }, [drawing.entities, cadCenter, show2DBlueprint]);

  // BUILD REAL 3D EXTRUSION OF ALL 2D CAD ELEMENTS
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    if (cadBuildingGroupRef.current) {
      scene.remove(cadBuildingGroupRef.current);
    }

    const buildingGroup = new THREE.Group();
    buildingGroup.position.set(0, 10, 0);

    const cx = cadCenter.x;
    const cy = cadCenter.y;
    const scale = 0.72;

    // Current Extrusion Height modulated by the 2D-to-3D liftProgress slider
    const currentWallHeight = Math.max(maxWallHeight * liftProgress, 2);

    drawing.entities.forEach((entity) => {
      const ex = (entity.x + (entity.width || 0) / 2 - cx) * scale;
      const ez = (entity.y + (entity.height || 0) / 2 - cy) * scale;
      const w = Math.max(entity.width * scale, 6);
      const d = Math.max(entity.height * scale, 6);

      // =========================================================================
      // 1. ARCHITECTURAL WALLS (Extruded 3D Concrete / Brick / Glass with Wireframe Glow)
      // =========================================================================
      if (entity.type === 'arch_wall') {
        if (!showWalls) return;

        const wallH = currentWallHeight;
        const wallGeo = new THREE.BoxGeometry(w, wallH, d);

        let wallMat: THREE.Material;
        if (shadingStyle === 'holographic') {
          // Colorful holographic cyan-slate with glowing facets matching user screenshot
          wallMat = new THREE.MeshStandardMaterial({
            color: 0x0284c7,
            roughness: 0.2,
            metalness: 0.35,
            transparent: true,
            opacity: 0.88,
          });
        } else if (shadingStyle === 'cyber') {
          wallMat = new THREE.MeshStandardMaterial({
            color: 0x6366f1,
            emissive: 0x312e81,
            roughness: 0.3,
            metalness: 0.6,
          });
        } else if (shadingStyle === 'xray') {
          wallMat = new THREE.MeshPhysicalMaterial({
            color: 0x38bdf8,
            transparent: true,
            opacity: 0.32,
            roughness: 0.08,
            transmission: 0.9,
          });
        } else {
          // BIM Solid concrete
          wallMat = new THREE.MeshStandardMaterial({
            color: 0x475569,
            roughness: 0.75,
            metalness: 0.1,
          });
        }

        const wallMesh = new THREE.Mesh(wallGeo, wallMat);
        wallMesh.position.set(ex, wallH / 2, ez);
        wallMesh.castShadow = true;
        wallMesh.receiveShadow = true;
        buildingGroup.add(wallMesh);

        // Glowing Wireframe Edges (The crisp neon lines from the reference image)
        const edgesGeo = new THREE.EdgesGeometry(wallGeo);
        const edgesMat = new THREE.LineBasicMaterial({
          color: shadingStyle === 'holographic' ? 0x00f5d4 : 0xffffff,
          transparent: true,
          opacity: 0.85,
        });
        const edges = new THREE.LineSegments(edgesGeo, edgesMat);
        edges.position.copy(wallMesh.position);
        buildingGroup.add(edges);
      }

      // =========================================================================
      // 2. STRUCTURAL COLUMNS (Reinforced Concrete / Steel Pillars)
      // =========================================================================
      else if (entity.type === 'arch_column') {
        const colH = currentWallHeight * 1.15;
        const colGeo = new THREE.BoxGeometry(w, colH, d);
        const colMat = new THREE.MeshStandardMaterial({
          color: shadingStyle === 'holographic' ? 0x00f5d4 : 0x0f172a,
          emissive: shadingStyle === 'holographic' ? 0x0284c7 : 0x000000,
          roughness: 0.2,
          metalness: 0.8,
        });
        const colMesh = new THREE.Mesh(colGeo, colMat);
        colMesh.position.set(ex, colH / 2, ez);
        colMesh.castShadow = true;
        buildingGroup.add(colMesh);

        // Column Crown Capital
        const capGeo = new THREE.BoxGeometry(w * 1.3, 6, d * 1.3);
        const capMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8 });
        const capMesh = new THREE.Mesh(capGeo, capMat);
        capMesh.position.set(ex, colH + 3, ez);
        buildingGroup.add(capMesh);
      }

      // =========================================================================
      // 3. DOORS (3D Door Frame, Open Leaf & Lever Hardware)
      // =========================================================================
      else if (entity.type === 'arch_door') {
        if (!showDoorsWindows) return;

        const doorH = currentWallHeight * 0.85;
        // Outer Door Frame
        const frameGeo = new THREE.BoxGeometry(w, doorH, 8);
        const frameMat = new THREE.MeshStandardMaterial({
          color: 0x1e293b,
          roughness: 0.4,
        });
        const frameMesh = new THREE.Mesh(frameGeo, frameMat);
        frameMesh.position.set(ex, doorH / 2, ez);
        buildingGroup.add(frameMesh);

        // 3D Door Leaf Pane (Pivoted open at 45° angle)
        const leafGeo = new THREE.BoxGeometry(w * 0.9, doorH * 0.96, 4);
        const leafMat = new THREE.MeshStandardMaterial({
          color: 0x3b82f6,
          roughness: 0.3,
          metalness: 0.2,
          transparent: true,
          opacity: 0.85,
        });
        const leafMesh = new THREE.Mesh(leafGeo, leafMat);
        // Angle open
        leafMesh.position.set(ex - w * 0.2, doorH / 2, ez + w * 0.25);
        leafMesh.rotation.y = Math.PI / 4;
        buildingGroup.add(leafMesh);

        // Brass / Silver Lever Handle
        const handleGeo = new THREE.CylinderGeometry(1.2, 1.2, 8);
        const handleMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.9 });
        const handleMesh = new THREE.Mesh(handleGeo, handleMat);
        handleMesh.rotation.z = Math.PI / 2;
        handleMesh.position.set(ex - w * 0.1, doorH * 0.48, ez + w * 0.35);
        buildingGroup.add(handleMesh);
      }

      // =========================================================================
      // 4. WINDOWS (Glazed Translucent Cyan Panes & Outer Sill)
      // =========================================================================
      else if (entity.type === 'arch_window') {
        if (!showDoorsWindows) return;

        const winH = currentWallHeight * 0.55;
        const sillElevation = currentWallHeight * 0.35;

        // Window Frame Sill
        const winFrameGeo = new THREE.BoxGeometry(w, winH, 10);
        const winFrameMat = new THREE.MeshStandardMaterial({ color: 0x0f172a });
        const winFrameMesh = new THREE.Mesh(winFrameGeo, winFrameMat);
        winFrameMesh.position.set(ex, sillElevation + winH / 2, ez);
        buildingGroup.add(winFrameMesh);

        // Translucent Glowing Glazing Pane
        const glassGeo = new THREE.BoxGeometry(w * 0.92, winH * 0.9, 4);
        const glassMat = new THREE.MeshPhysicalMaterial({
          color: 0x38bdf8,
          transparent: true,
          opacity: 0.45,
          roughness: 0.05,
          transmission: 0.9,
          ior: 1.45,
        });
        const glassMesh = new THREE.Mesh(glassGeo, glassMat);
        glassMesh.position.set(ex, sillElevation + winH / 2, ez);
        buildingGroup.add(glassMesh);

        // Glowing Window Edge Frame
        const glassEdges = new THREE.LineSegments(
          new THREE.EdgesGeometry(glassGeo),
          new THREE.LineBasicMaterial({ color: 0x00f5d4, opacity: 0.8, transparent: true })
        );
        glassEdges.position.copy(glassMesh.position);
        buildingGroup.add(glassEdges);
      }

      // =========================================================================
      // 5. ROOMS (Color-coded Floor Slabs & Floating 3D Holographic Badges)
      // =========================================================================
      else if (entity.type === 'arch_room') {
        const roomHex = entity.color ? parseInt(entity.color.replace('#', '0x'), 16) : 0x3b82f6;

        if (showRoomFloors) {
          const floorGeo = new THREE.BoxGeometry(w, 4, d);
          const floorMat = new THREE.MeshStandardMaterial({
            color: roomHex,
            roughness: 0.3,
            metalness: 0.2,
            transparent: true,
            opacity: 0.78,
          });
          const floorMesh = new THREE.Mesh(floorGeo, floorMat);
          floorMesh.position.set(ex, 2, ez);
          floorMesh.receiveShadow = true;
          buildingGroup.add(floorMesh);

          // Glowing Room Edge
          const floorEdges = new THREE.LineSegments(
            new THREE.EdgesGeometry(floorGeo),
            new THREE.LineBasicMaterial({ color: 0xffffff, opacity: 0.5, transparent: true })
          );
          floorEdges.position.copy(floorMesh.position);
          buildingGroup.add(floorEdges);
        }

        // Floating 3D Holographic Room Name & Area Badge
        if (showRoomLabels && liftProgress > 0.2) {
          const badgeY = currentWallHeight + 35;
          const roomBadge = createBillboardText(
            entity.label,
            entity.roomArea || entity.sublabel || 'Zone',
            entity.color || '#00f5d4'
          );
          roomBadge.position.set(ex, badgeY, ez);
          buildingGroup.add(roomBadge);

          // Laser tether line from floor to badge
          const tetherPoints = [new THREE.Vector3(ex, 2, ez), new THREE.Vector3(ex, badgeY - 12, ez)];
          const tetherGeo = new THREE.BufferGeometry().setFromPoints(tetherPoints);
          const tetherMat = new THREE.LineDashedMaterial({
            color: roomHex,
            dashSize: 6,
            gapSize: 4,
            transparent: true,
            opacity: 0.6,
          });
          const tetherLine = new THREE.Line(tetherGeo, tetherMat);
          tetherLine.computeLineDistances();
          buildingGroup.add(tetherLine);
        }
      }

      // =========================================================================
      // 6. FURNITURE (3D Beds, Sofas, Dining Tables, Desks, Counters)
      // =========================================================================
      else if (entity.type === 'arch_furniture') {
        if (!showFurniture) return;

        const fType = entity.furnitureType || 'bed';

        if (fType === 'bed') {
          // 3D Bed Frame, Mattress, Pillows & Headboard
          const frameH = 14;
          const bedFrameGeo = new THREE.BoxGeometry(w, frameH, d);
          const bedFrameMat = new THREE.MeshStandardMaterial({ color: 0x334155 });
          const bedFrame = new THREE.Mesh(bedFrameGeo, bedFrameMat);
          bedFrame.position.set(ex, frameH / 2, ez);
          buildingGroup.add(bedFrame);

          // Mattress with soft bedding
          const mattH = 16;
          const mattGeo = new THREE.BoxGeometry(w * 0.94, mattH, d * 0.92);
          const mattMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0 });
          const matt = new THREE.Mesh(mattGeo, mattMat);
          matt.position.set(ex, frameH + mattH / 2, ez + d * 0.02);
          buildingGroup.add(matt);

          // Dual Pillows
          const pilGeo = new THREE.BoxGeometry(w * 0.38, 6, d * 0.22);
          const pilMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8 });
          const pil1 = new THREE.Mesh(pilGeo, pilMat);
          pil1.position.set(ex - w * 0.24, frameH + mattH + 3, ez - d * 0.32);
          const pil2 = new THREE.Mesh(pilGeo, pilMat);
          pil2.position.set(ex + w * 0.24, frameH + mattH + 3, ez - d * 0.32);
          buildingGroup.add(pil1, pil2);

          // Headboard
          const headH = 45;
          const headGeo = new THREE.BoxGeometry(w * 1.04, headH, 8);
          const headMat = new THREE.MeshStandardMaterial({ color: 0x1e293b });
          const headboard = new THREE.Mesh(headGeo, headMat);
          headboard.position.set(ex, headH / 2, ez - d / 2 + 4);
          buildingGroup.add(headboard);
        } else if (fType === 'sofa') {
          // 3D Sectional / Couch with cushions & armrests
          const seatH = 18;
          const seatGeo = new THREE.BoxGeometry(w, seatH, d * 0.85);
          const sofaMat = new THREE.MeshStandardMaterial({ color: 0x0284c7 });
          const seat = new THREE.Mesh(seatGeo, sofaMat);
          seat.position.set(ex, seatH / 2, ez + d * 0.05);
          buildingGroup.add(seat);

          // Backrest
          const backH = 34;
          const backGeo = new THREE.BoxGeometry(w, backH, d * 0.25);
          const back = new THREE.Mesh(backGeo, sofaMat);
          back.position.set(ex, backH / 2, ez - d * 0.35);
          buildingGroup.add(back);
        } else if (fType === 'dining' || fType === 'desk') {
          // 3D Table Top & 4 Legs
          const topH = 6;
          const topGeo = new THREE.BoxGeometry(w, topH, d);
          const topMat = new THREE.MeshStandardMaterial({ color: 0x475569 });
          const top = new THREE.Mesh(topGeo, topMat);
          const tableHeight = 32;
          top.position.set(ex, tableHeight, ez);
          buildingGroup.add(top);

          // 4 Legs
          const legGeo = new THREE.CylinderGeometry(2, 2, tableHeight);
          const legMat = new THREE.MeshStandardMaterial({ color: 0x0f172a });
          const legOffsets = [
            [-w / 2 + 6, -d / 2 + 6],
            [w / 2 - 6, -d / 2 + 6],
            [-w / 2 + 6, d / 2 - 6],
            [w / 2 - 6, d / 2 - 6],
          ];
          legOffsets.forEach(([ox, oz]) => {
            const leg = new THREE.Mesh(legGeo, legMat);
            leg.position.set(ex + ox, tableHeight / 2, ez + oz);
            buildingGroup.add(leg);
          });
        } else {
          // Modular Counter / Cabinet
          const boxH = 36;
          const boxGeo = new THREE.BoxGeometry(w, boxH, d);
          const boxMat = new THREE.MeshStandardMaterial({ color: 0x0d9488 });
          const box = new THREE.Mesh(boxGeo, boxMat);
          box.position.set(ex, boxH / 2, ez);
          buildingGroup.add(box);
        }
      }

      // =========================================================================
      // 7. SANITARY FIXTURES (3D Toilet, Wash Basin, Bathtub)
      // =========================================================================
      else if (entity.type === 'arch_sanitary') {
        const sanH = 28;
        const bowlGeo = new THREE.CylinderGeometry(w * 0.35, w * 0.25, sanH, 16);
        const sanMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.1 });
        const bowl = new THREE.Mesh(bowlGeo, sanMat);
        bowl.position.set(ex, sanH / 2, ez);
        buildingGroup.add(bowl);

        // Water Cistern Tank
        const tankGeo = new THREE.BoxGeometry(w * 0.8, sanH * 1.2, d * 0.35);
        const tank = new THREE.Mesh(tankGeo, sanMat);
        tank.position.set(ex, sanH * 0.6, ez - d * 0.3);
        buildingGroup.add(tank);
      }

      // =========================================================================
      // 8. MEP ELECTRICAL (Ceiling Downlights Emitting Spotlights)
      // =========================================================================
      else if (entity.type === 'arch_electrical') {
        const fixtureGeo = new THREE.CylinderGeometry(5, 5, 3, 12);
        const fixtureMat = new THREE.MeshBasicMaterial({ color: 0xfacc15 });
        const fixture = new THREE.Mesh(fixtureGeo, fixtureMat);
        fixture.position.set(ex, currentWallHeight - 2, ez);
        buildingGroup.add(fixture);

        // Downward Light Cone
        if (liftProgress > 0.4) {
          const coneGeo = new THREE.ConeGeometry(24, currentWallHeight - 4, 16, 1, true);
          const coneMat = new THREE.MeshBasicMaterial({
            color: 0xfef08a,
            transparent: true,
            opacity: 0.14,
            depthWrite: false,
          });
          const cone = new THREE.Mesh(coneGeo, coneMat);
          cone.position.set(ex, (currentWallHeight - 4) / 2, ez);
          cone.rotation.x = Math.PI;
          buildingGroup.add(cone);
        }
      }

      // =========================================================================
      // 9. SITE LANDSCAPE & TREES (3D Faceted Trees with Glowing Wireframe)
      // =========================================================================
      else if (entity.type === 'arch_site') {
        if (!showSiteLandscape) return;

        // Trunk
        const trunkH = 35;
        const trunkGeo = new THREE.CylinderGeometry(4, 6, trunkH, 8);
        const trunkMat = new THREE.MeshStandardMaterial({ color: 0x78350f });
        const trunk = new THREE.Mesh(trunkGeo, trunkMat);
        trunk.position.set(ex, trunkH / 2, ez);
        buildingGroup.add(trunk);

        // 3D Faceted Emerald Canopy (Low-poly foliage with glowing edges from screenshot)
        const canH = 80;
        const canGeo = new THREE.ConeGeometry(w * 0.6, canH, 7);
        const canMat = new THREE.MeshStandardMaterial({
          color: 0x10b981,
          roughness: 0.3,
          flatShading: true,
        });
        const canopy = new THREE.Mesh(canGeo, canMat);
        canopy.position.set(ex, trunkH + canH / 2, ez);
        canopy.castShadow = true;
        buildingGroup.add(canopy);

        // Glowing cyan wireframe on tree foliage
        const canopyEdges = new THREE.LineSegments(
          new THREE.EdgesGeometry(canGeo),
          new THREE.LineBasicMaterial({ color: 0x00f5d4, opacity: 0.9, transparent: true })
        );
        canopyEdges.position.copy(canopy.position);
        buildingGroup.add(canopyEdges);
      }

      // =========================================================================
      // 10. 3D DIMENSION CALLOUTS (Laser Holographic Distance Line & Text)
      // =========================================================================
      else if (entity.type === 'arch_dimension') {
        if (!showDimensions) return;

        const dimH = currentWallHeight + 15;
        const dimPoints = [
          new THREE.Vector3(ex - w / 2, dimH, ez),
          new THREE.Vector3(ex + w / 2, dimH, ez),
        ];
        const dimGeo = new THREE.BufferGeometry().setFromPoints(dimPoints);
        const dimMat = new THREE.LineBasicMaterial({ color: 0x00f5d4, linewidth: 2 });
        const dimLine = new THREE.Line(dimGeo, dimMat);
        buildingGroup.add(dimLine);

        // Holographic Dimension Badge
        const dimBadge = createBillboardText(
          entity.label,
          'Dimension Span',
          '#00f5d4',
          'rgba(2, 27, 32, 0.9)'
        );
        dimBadge.scale.set(70, 20, 1);
        dimBadge.position.set(ex, dimH + 14, ez);
        buildingGroup.add(dimBadge);
      }
    });

    scene.add(buildingGroup);
    cadBuildingGroupRef.current = buildingGroup;
  }, [
    drawing.entities,
    cadCenter,
    liftProgress,
    maxWallHeight,
    shadingStyle,
    showWalls,
    showDoorsWindows,
    showFurniture,
    showRoomFloors,
    showRoomLabels,
    showSiteLandscape,
    showDimensions,
  ]);

  // UPDATE TERRAIN, CONTOURS, GRID VISIBILITY
  useEffect(() => {
    if (terrainMeshRef.current) terrainMeshRef.current.visible = showTerrain;
    if (contourMeshRef.current) contourMeshRef.current.visible = showTerrain;
    if (gridHelperRef.current) gridHelperRef.current.visible = showGrid;
    if (blueprintFloorGroupRef.current) blueprintFloorGroupRef.current.visible = show2DBlueprint;
  }, [showTerrain, showGrid, show2DBlueprint]);

  // UPDATE SUN LIGHT DIRECTION
  useEffect(() => {
    if (!dirLightRef.current) return;
    const rad = (sunAngle * Math.PI) / 180;
    const radius = 800;
    dirLightRef.current.position.set(Math.cos(rad) * radius, 680, Math.sin(rad) * radius);
  }, [sunAngle]);

  // CAMERA PRESETS
  const setCameraPreset = (preset: 'hero' | 'isometric' | 'top' | 'front') => {
    if (!cameraRef.current || !controlsRef.current) return;
    const camera = cameraRef.current;
    const controls = controlsRef.current;

    if (preset === 'hero') {
      camera.position.set(500, 460, 820);
      controls.target.set(0, 35, 0);
    } else if (preset === 'isometric') {
      camera.position.set(750, 600, 750);
      controls.target.set(0, 40, 0);
    } else if (preset === 'top') {
      camera.position.set(0, 1350, 5);
      controls.target.set(0, 0, 0);
    } else if (preset === 'front') {
      camera.position.set(0, 180, 1050);
      controls.target.set(0, 50, 0);
    }
    controls.update();
  };

  // 4K PNG SNAPSHOT
  const handleTakeSnapshot = () => {
    if (!rendererRef.current) return;
    const dataUrl = rendererRef.current.domElement.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `${drawing.title.replace(/\s+/g, '_')}_3D_DigitalTwin.png`;
    link.href = dataUrl;
    link.click();
  };

  return (
    <div className="relative w-full h-full bg-[#011b20] overflow-hidden select-none font-sans">
      {/* 1. 3D WebGL Canvas Viewport */}
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* 2. TOP EXECUTIVE HUD BAR */}
      <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none z-20">
        {/* Left: 2D Plan Switcher & Status */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {!isSplitView && (
            <button
              onClick={onBackTo2D}
              className="flex items-center gap-2 bg-slate-900/90 hover:bg-slate-800 text-white text-xs font-semibold px-3 py-2 rounded-xl border border-cyan-500/30 backdrop-blur-md shadow-lg shadow-cyan-950/40 transition-all cursor-pointer group hover:border-cyan-400"
            >
              <ArrowLeft size={14} className="text-cyan-400 group-hover:-translate-x-0.5 transition-transform" />
              <span>2D Drafting Plan</span>
            </button>
          )}

          <div className="flex items-center gap-2 bg-slate-900/85 text-white px-3.5 py-1.5 rounded-xl border border-slate-700/60 backdrop-blur-md shadow-md text-xs">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-bold tracking-wide text-cyan-300">
              OmegaCAD <span className="text-emerald-400">2D-to-3D Live Twin</span>
            </span>
            <span className="text-[10px] text-slate-400 border-l border-slate-700 pl-2 hidden sm:inline">
              {drawing.entities.length} CAD Elements Synced
            </span>
          </div>
        </div>

        {/* Center: Style Switcher */}
        <div className="pointer-events-auto flex items-center bg-slate-900/90 p-1 rounded-xl border border-cyan-500/20 backdrop-blur-md shadow-xl text-xs gap-1">
          <button
            onClick={() => setShadingStyle('holographic')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
              shadingStyle === 'holographic'
                ? 'bg-gradient-to-r from-emerald-600 to-cyan-600 text-white shadow-sm font-bold'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
            }`}
            title="Holographic Emerald Terrain & Glowing Cyan Wireframe"
          >
            <Sparkles size={13} className="text-cyan-300" />
            <span className="hidden md:inline">Holographic Topo</span>
            <span className="md:hidden">Holo</span>
          </button>

          <button
            onClick={() => setShadingStyle('cyber')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
              shadingStyle === 'cyber'
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-sm font-bold'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
            }`}
            title="Cyberpunk Synthwave Neon Wireframe"
          >
            <span className="hidden md:inline">Cyber Neon</span>
            <span className="md:hidden">Cyber</span>
          </button>

          <button
            onClick={() => setShadingStyle('bim')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
              shadingStyle === 'bim'
                ? 'bg-white text-slate-900 shadow-sm font-bold'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
            }`}
            title="Realistic Architectural BIM Daylighting"
          >
            <span className="hidden md:inline">BIM Solid</span>
            <span className="md:hidden">BIM</span>
          </button>

          <button
            onClick={() => setShadingStyle('xray')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
              shadingStyle === 'xray'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 font-bold'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
            }`}
            title="X-Ray Structural Glass & Frame"
          >
            <span className="hidden md:inline">X-Ray Glass</span>
            <span className="md:hidden">X-Ray</span>
          </button>
        </div>

        {/* Right: Camera Snapshot & Auto-Rotate */}
        <div className="flex items-center gap-1.5 pointer-events-auto">
          <button
            onClick={() => setAutoRotate(!autoRotate)}
            className={`p-2 rounded-xl border backdrop-blur-md transition-all cursor-pointer ${
              autoRotate
                ? 'bg-cyan-500/30 border-cyan-400 text-cyan-300'
                : 'bg-slate-900/90 border-slate-700/60 text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
            title={autoRotate ? 'Pause 360° Orbit' : 'Play 360° Smooth Orbit'}
          >
            {autoRotate ? <Pause size={14} /> : <Play size={14} />}
          </button>

          <button
            onClick={handleTakeSnapshot}
            className="flex items-center gap-1.5 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold px-3 py-2 rounded-xl shadow-lg shadow-cyan-900/50 transition-all cursor-pointer"
            title="Download 4K Snapshot Render of 3D Scene"
          >
            <Camera size={14} />
            <span className="hidden sm:inline">Render PNG</span>
          </button>
        </div>
      </div>

      {/* 3. BOTTOM-LEFT FLOATING CAMERA PRESET PILLS */}
      <div className="absolute bottom-4 left-4 z-20 flex flex-col gap-2 pointer-events-auto">
        <div className="bg-slate-900/90 border border-cyan-500/25 rounded-2xl p-1.5 backdrop-blur-md shadow-2xl flex flex-col gap-1 text-slate-300">
          <button
            onClick={() => setCameraPreset('hero')}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs hover:bg-cyan-950/60 hover:text-cyan-300 transition-colors text-left font-medium"
            title="Perspective Digital Twin View"
          >
            <Mountain size={14} className="text-emerald-400 shrink-0" />
            <span>Digital Twin Topo</span>
          </button>

          <button
            onClick={() => setCameraPreset('isometric')}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs hover:bg-cyan-950/60 hover:text-cyan-300 transition-colors text-left"
            title="Isometric 45° Architectural View"
          >
            <Box size={14} className="text-cyan-400 shrink-0" />
            <span>Isometric 3D</span>
          </button>

          <button
            onClick={() => setCameraPreset('top')}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs hover:bg-cyan-950/60 hover:text-cyan-300 transition-colors text-left"
            title="Top-Down Aerial Ortho View"
          >
            <Maximize size={14} className="text-blue-400 shrink-0" />
            <span>Aerial Plan</span>
          </button>

          <button
            onClick={() => setCameraPreset('front')}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs hover:bg-cyan-950/60 hover:text-cyan-300 transition-colors text-left"
            title="Front Elevation Eye-Level"
          >
            <Eye size={14} className="text-purple-400 shrink-0" />
            <span>Front Elevation</span>
          </button>
        </div>

        {/* Orbit Helper Tip */}
        <div className="bg-slate-900/80 border border-slate-700/60 rounded-xl px-3 py-1.5 backdrop-blur-md text-[10px] text-slate-400 flex items-center gap-2">
          <Info size={12} className="text-cyan-400" />
          <span>Left-click drag to orbit • Right-click to pan • Scroll to zoom</span>
        </div>
      </div>

      {/* 4. EXPANDABLE RIGHT HUD: 2D-TO-3D ELEMENT INSPECTOR & EXTRUSION CONTROLS */}
      <div className="absolute top-16 right-4 z-20 pointer-events-auto">
        <div className="bg-slate-900/90 border border-cyan-500/25 rounded-2xl backdrop-blur-md shadow-2xl p-3 w-80 text-slate-200 transition-all">
          {/* Header */}
          <div className="flex items-center justify-between pb-2 border-b border-slate-700/70 mb-2.5">
            <div className="flex items-center gap-2">
              <Sliders size={14} className="text-cyan-400" />
              <span className="text-xs font-bold text-white tracking-wide">2D-to-3D Live Controls</span>
            </div>
            <button
              onClick={() => setIsControlsExpanded(!isControlsExpanded)}
              className="text-slate-400 hover:text-white cursor-pointer"
            >
              <ChevronDown
                size={14}
                className={`transition-transform duration-200 ${isControlsExpanded ? '' : '-rotate-90'}`}
              />
            </button>
          </div>

          {isControlsExpanded && (
            <div className="flex flex-col gap-3 text-xs max-h-[calc(100vh-140px)] overflow-y-auto pr-1">
              {/* KEY FEATURE: 2D to 3D Extrusion Slider */}
              <div className="bg-cyan-950/50 p-2.5 rounded-xl border border-cyan-500/30 flex flex-col gap-2">
                <div className="flex justify-between items-center text-[11px]">
                  <span className="font-bold text-cyan-300">2D → 3D Lift Progress</span>
                  <span className="text-white font-mono font-bold bg-cyan-900/80 px-2 py-0.5 rounded text-[10px]">
                    {Math.round(liftProgress * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.02}
                  value={liftProgress}
                  onChange={(e) => setLiftProgress(Number(e.target.value))}
                  className="w-full accent-cyan-400 h-2 bg-slate-800 rounded-lg cursor-pointer"
                />
                <span className="text-[10px] text-slate-400 leading-tight">
                  {liftProgress === 0
                    ? 'Flat 2D Blueprint on ground'
                    : liftProgress < 1
                    ? 'Extruding 2D plan elements up into 3D...'
                    : 'Full 3D Architectural Digital Twin'}
                </span>
              </div>

              {/* 2D CAD Elements in 3D */}
              <div className="flex flex-col gap-1.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  2D Design Elements in 3D
                </span>

                {/* Ground Blueprint Trace */}
                <label className="flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-slate-800/60 cursor-pointer">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-sm shadow-cyan-400/50" />
                    <span>2D Blueprint Floor Trace</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={show2DBlueprint}
                    onChange={(e) => setShow2DBlueprint(e.target.checked)}
                    className="accent-cyan-500 cursor-pointer"
                  />
                </label>

                {/* Extruded CAD Walls */}
                <label className="flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-slate-800/60 cursor-pointer">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                    <span>Extruded Walls ({drawing.entities.filter((e) => e.type === 'arch_wall').length})</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={showWalls}
                    onChange={(e) => setShowWalls(e.target.checked)}
                    className="accent-cyan-500 cursor-pointer"
                  />
                </label>

                {/* Doors & Windows */}
                <label className="flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-slate-800/60 cursor-pointer">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-sky-400" />
                    <span>Doors & Glazed Windows</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={showDoorsWindows}
                    onChange={(e) => setShowDoorsWindows(e.target.checked)}
                    className="accent-cyan-500 cursor-pointer"
                  />
                </label>

                {/* 3D Furniture Pieces */}
                <label className="flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-slate-800/60 cursor-pointer">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-indigo-400" />
                    <span>3D Furniture & Sanitary Fixtures</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={showFurniture}
                    onChange={(e) => setShowFurniture(e.target.checked)}
                    className="accent-cyan-500 cursor-pointer"
                  />
                </label>

                {/* Room Floor Slabs */}
                <label className="flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-slate-800/60 cursor-pointer">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-teal-400" />
                    <span>Room Floor Slabs</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={showRoomFloors}
                    onChange={(e) => setShowRoomFloors(e.target.checked)}
                    className="accent-cyan-500 cursor-pointer"
                  />
                </label>

                {/* Floating Room Badges */}
                <label className="flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-slate-800/60 cursor-pointer">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                    <span>Holographic Room Labels</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={showRoomLabels}
                    onChange={(e) => setShowRoomLabels(e.target.checked)}
                    className="accent-cyan-500 cursor-pointer"
                  />
                </label>

                {/* Landscape & Trees */}
                <label className="flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-slate-800/60 cursor-pointer">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    <span>Site Trees & Landscape</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={showSiteLandscape}
                    onChange={(e) => setShowSiteLandscape(e.target.checked)}
                    className="accent-cyan-500 cursor-pointer"
                  />
                </label>

                {/* 3D Dimension Laser Lines */}
                <label className="flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-slate-800/60 cursor-pointer">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-cyan-300" />
                    <span>3D Dimension Markers</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={showDimensions}
                    onChange={(e) => setShowDimensions(e.target.checked)}
                    className="accent-cyan-500 cursor-pointer"
                  />
                </label>
              </div>

              {/* Environmental Site Context Toggles */}
              <div className="pt-2 border-t border-slate-700/60 flex flex-col gap-1.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Site Context & Terrain
                </span>

                <label className="flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-slate-800/60 cursor-pointer">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
                    <span>Topological Relief Terrain</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={showTerrain}
                    onChange={(e) => setShowTerrain(e.target.checked)}
                    className="accent-cyan-500 cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-slate-800/60 cursor-pointer">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
                    <span>Cyan Ground Matrix</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={showGrid}
                    onChange={(e) => setShowGrid(e.target.checked)}
                    className="accent-cyan-500 cursor-pointer"
                  />
                </label>
              </div>

              {/* Sliders: Wall Height & Sun Direction */}
              <div className="pt-2 border-t border-slate-700/60 flex flex-col gap-2.5">
                <div className="flex flex-col gap-1">
                  <div className="flex justify-between text-[11px] text-slate-300">
                    <span>Full Wall Height</span>
                    <span className="text-cyan-400 font-mono font-bold">
                      {(maxWallHeight / 50).toFixed(1)} m
                    </span>
                  </div>
                  <input
                    type="range"
                    min={60}
                    max={260}
                    value={maxWallHeight}
                    onChange={(e) => setMaxWallHeight(Number(e.target.value))}
                    className="w-full accent-cyan-400 h-1.5 bg-slate-700 rounded-lg cursor-pointer"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <div className="flex justify-between text-[11px] text-slate-300">
                    <span className="flex items-center gap-1">
                      <Sun size={12} className="text-amber-400" />
                      <span>Sun Azimuth</span>
                    </span>
                    <span className="text-amber-300 font-mono">{sunAngle}°</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={360}
                    value={sunAngle}
                    onChange={(e) => setSunAngle(Number(e.target.value))}
                    className="w-full accent-amber-400 h-1.5 bg-slate-700 rounded-lg cursor-pointer"
                  />
                </div>
              </div>

              {/* Summary Stats */}
              <div className="bg-slate-950/70 rounded-xl p-2.5 border border-cyan-500/15 text-[11px] text-slate-400 flex flex-col gap-1">
                <div className="flex justify-between">
                  <span>Project</span>
                  <span className="text-white font-medium truncate max-w-[140px]">
                    {drawing.title}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>2D Entities Extruded</span>
                  <span className="text-cyan-300 font-mono font-semibold">
                    {drawing.entities.length}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
