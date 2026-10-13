import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import {
  Compass,
  Layers,
  RotateCcw,
  Camera,
  Sun,
  Maximize,
  Mountain,
  Grid,
  Sliders,
  Sparkles,
  Play,
  Pause,
  Box,
  Eye,
  Check,
  ChevronDown,
  ArrowLeft,
  Download,
  Info,
} from 'lucide-react';
import { CadDrawing, CadEntity } from '../../types/omegacad';

export type ShadingStyle = 'holographic' | 'cyber' | 'bim' | 'xray';

interface OmegaCAD3DViewerProps {
  drawing: CadDrawing;
  onBackTo2D: () => void;
}

export const OmegaCAD3DViewer: React.FC<OmegaCAD3DViewerProps> = ({
  drawing,
  onBackTo2D,
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);

  // 3D View Settings & HUD States
  const [shadingStyle, setShadingStyle] = useState<ShadingStyle>('holographic');
  const [showTerrain, setShowTerrain] = useState<boolean>(true);
  const [showGrid, setShowGrid] = useState<boolean>(true);
  const [showGeologicalCore, setShowGeologicalCore] = useState<boolean>(true);
  const [showCadWalls, setShowCadWalls] = useState<boolean>(true);
  const [showContours, setShowContours] = useState<boolean>(true);
  const [showFloors, setShowFloors] = useState<boolean>(true);
  const [autoRotate, setAutoRotate] = useState<boolean>(false);
  const [wallHeight, setWallHeight] = useState<number>(140); // mm scale in 3D scene
  const [terrainElevationScale, setTerrainElevationScale] = useState<number>(1.0);
  const [sunAngle, setSunAngle] = useState<number>(45);
  const [isControlsExpanded, setIsControlsExpanded] = useState<boolean>(true);
  const [isStyleMenuOpen, setIsStyleMenuOpen] = useState<boolean>(false);

  // Three.js References to dynamically mutate scene objects without full reconstruction
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const terrainMeshRef = useRef<THREE.Mesh | null>(null);
  const contourMeshRef = useRef<THREE.LineSegments | null>(null);
  const gridHelperRef = useRef<THREE.GridHelper | null>(null);
  const geologicalGroupRef = useRef<THREE.Group | null>(null);
  const cadBuildingGroupRef = useRef<THREE.Group | null>(null);
  const dirLightRef = useRef<THREE.DirectionalLight | null>(null);
  const originalTerrainPositionsRef = useRef<Float32Array | null>(null);

  // Bounding center of 2D CAD entities to center the building on the terrain plateau
  const cadCenter = useMemo(() => {
    if (!drawing.entities || drawing.entities.length === 0) {
      return { x: 500, y: 400 };
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
    };
  }, [drawing.entities]);

  // INITIALIZE THREE.JS SCENE
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    // 1. Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x011b20);
    scene.fog = new THREE.FogExp2(0x012328, 0.00065);

    // 2. Camera (Perspective view matching the user's reference image angle)
    const camera = new THREE.PerspectiveCamera(42, width / height, 10, 8000);
    camera.position.set(520, 480, 880);
    cameraRef.current = camera;

    // 3. Renderer
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

    // 4. Orbit Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.maxPolarAngle = Math.PI / 2 + 0.08; // Allow viewing slightly beneath horizon
    controls.minDistance = 60;
    controls.maxDistance = 3500;
    controls.target.set(0, 30, -30);
    controlsRef.current = controls;

    // 5. Lighting System
    const ambientLight = new THREE.AmbientLight(0x0e3b43, 1.2);
    scene.add(ambientLight);

    const hemiLight = new THREE.HemisphereLight(0x38bdf8, 0x064e3b, 0.8);
    scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight(0xe0f2fe, 1.8);
    dirLight.position.set(400, 700, 500);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.camera.near = 50;
    dirLight.shadow.camera.far = 2500;
    const d = 800;
    dirLight.shadow.camera.left = -d;
    dirLight.shadow.camera.right = d;
    dirLight.shadow.camera.top = d;
    dirLight.shadow.camera.bottom = -d;
    scene.add(dirLight);
    dirLightRef.current = dirLight;

    // Cyan Neon Accent Light
    const cyanPointLight = new THREE.PointLight(0x00f5d4, 2.5, 1200);
    cyanPointLight.position.set(0, 120, 50);
    scene.add(cyanPointLight);

    // 6. BUILD CYAN PERSPECTIVE COORDINATE GRID
    // Matches the neon cyan coordinate ground plane from the screenshot
    const gridHelper = new THREE.GridHelper(3000, 50, 0x00f5d4, 0x0891b2);
    gridHelper.position.y = 8;
    const gridMaterial = gridHelper.material as THREE.LineBasicMaterial;
    gridMaterial.transparent = true;
    gridMaterial.opacity = 0.82;
    gridMaterial.depthWrite = false;
    scene.add(gridHelper);
    gridHelperRef.current = gridHelper;

    // 7. BUILD TOPOLOGICAL RELIEF TERRAIN (Emerald Green & Cyan Gradient)
    const terrainGeo = new THREE.PlaneGeometry(3000, 3000, 120, 120);
    terrainGeo.rotateX(-Math.PI / 2);

    const posAttr = terrainGeo.attributes.position;
    const originalPositions = new Float32Array(posAttr.array);
    originalTerrainPositionsRef.current = originalPositions;

    const colors = new Float32Array(posAttr.count * 3);

    for (let i = 0; i < posAttr.count; i++) {
      const x = posAttr.getX(i);
      const z = posAttr.getZ(i);

      // Distance from center (where CAD building sits)
      const distFromCenter = Math.sqrt(x * x + z * z);

      // Site plateau factor: smoothly flatten the center zone so CAD building rests on flat ground
      let plateauFactor = 1.0;
      if (distFromCenter < 380) {
        plateauFactor = Math.pow(distFromCenter / 380, 2) * 0.08;
      } else if (distFromCenter < 650) {
        plateauFactor = 0.08 + ((distFromCenter - 380) / 270) * 0.92;
      }

      // Procedural Topography Harmonics:
      // High green ridges to the north/east, rolling coastal shelf to the south/west
      const wave1 = Math.sin(x * 0.0022 + 0.4) * Math.cos(z * 0.002) * 190;
      const wave2 = Math.sin(x * 0.0055 - z * 0.0042) * 70;
      const wave3 = Math.cos(x * 0.011 + z * 0.009) * 35;
      const ridge = Math.abs(Math.sin((x * 0.7 + z) * 0.0028)) * 140;
      const shelfBias = (z - 100) * 0.08;

      let y = (wave1 + wave2 + wave3 + ridge + shelfBias) * plateauFactor;

      // Shoreline dip
      if (y < -30) y = -30 + Math.sin(x * 0.01) * 5;

      posAttr.setY(i, y);

      // Vertex color gradient matching the user's screenshot:
      // Low/water: Cyan / teal (0x06b6d4)
      // Shoreline: Turquoise (0x00f5d4)
      // Low terrain: Emerald green (0x10b981)
      // Mid slopes: Deep lush emerald (0x059669)
      // Peaks: Lime emerald (0x4ade80)
      let r = 0.06, g = 0.72, b = 0.51; // emerald default

      if (y < 5) {
        // Water/bathymetry: cyan/teal
        r = 0.02; g = 0.52; b = 0.65;
      } else if (y < 40) {
        // Shoreline / low contour: glowing turquoise
        const t = (y - 5) / 35;
        r = 0.0 + t * 0.06;
        g = 0.95 - t * 0.22;
        b = 0.82 - t * 0.31;
      } else if (y < 120) {
        // Lush emerald slopes
        const t = (y - 40) / 80;
        r = 0.06 + t * 0.02;
        g = 0.73 - t * 0.14;
        b = 0.51 - t * 0.22;
      } else if (y < 220) {
        // Deep forest emerald
        const t = (y - 120) / 100;
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

    // Contour wireframe overlay (topological contour lines from screenshot)
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

    // Animated Translucent Water Surface at sea level
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

    // 8. BUILD VOLUMETRIC CRYSTALLINE GEOLOGICAL CORE (Iceberg / Massing from screenshot)
    // In the user's reference image, a large multi-faceted translucent crystalline polyhedron
    // cuts through the grid plane with glowing wireframe facets and edges.
    const geologicalGroup = new THREE.Group();
    geologicalGroup.position.set(0, 35, -40);

    // Create a sculpted faceted polygonal volume
    const crystalGeo = new THREE.IcosahedronGeometry(110, 1);
    const crystalPos = crystalGeo.attributes.position;
    // Sculpt vertices to give it the natural iceberg / jagged geological look from the picture
    for (let i = 0; i < crystalPos.count; i++) {
      const vx = crystalPos.getX(i);
      const vy = crystalPos.getY(i);
      const vz = crystalPos.getZ(i);

      let stretchY = vy;
      // Jagged summit above, faceted flat plateau below
      if (vy > 0) {
        stretchY = vy * 1.55 + Math.sin(vx * 0.05) * 18;
      } else {
        stretchY = vy * 1.15;
      }
      const scaleX = vx * (1.1 + Math.cos(vy * 0.04) * 0.25);
      const scaleZ = vz * (1.2 + Math.sin(vx * 0.03) * 0.2);

      crystalPos.setXYZ(i, scaleX, stretchY, scaleZ);
    }
    crystalGeo.computeVertexNormals();

    // Translucent glowing crystalline facets
    const crystalFacetMat = new THREE.MeshPhysicalMaterial({
      color: 0xe0f2fe,
      transparent: true,
      opacity: 0.52,
      roughness: 0.15,
      metalness: 0.1,
      transmission: 0.65,
      ior: 1.35,
      flatShading: true,
    });
    const crystalMesh = new THREE.Mesh(crystalGeo, crystalFacetMat);
    crystalMesh.castShadow = true;
    crystalMesh.receiveShadow = true;
    geologicalGroup.add(crystalMesh);

    // Crisp Glowing Wireframe Edges (Exactly matching the white-cyan neon outline in the screenshot)
    const crystalEdgesGeo = new THREE.EdgesGeometry(crystalGeo, 15);
    const crystalEdgesMat = new THREE.LineBasicMaterial({
      color: 0xffffff,
      linewidth: 2,
    });
    const crystalEdges = new THREE.LineSegments(crystalEdgesGeo, crystalEdgesMat);
    geologicalGroup.add(crystalEdges);

    // Inner glow core
    const innerLight = new THREE.PointLight(0x67e8f9, 3, 300);
    innerLight.position.set(0, 20, 0);
    geologicalGroup.add(innerLight);

    scene.add(geologicalGroup);
    geologicalGroupRef.current = geologicalGroup;

    // 9. ANIMATION LOOP
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      const elapsedTime = clock.getElapsedTime();

      // Gentle pulsating glow on geological core
      if (innerLight) {
        innerLight.intensity = 2.2 + Math.sin(elapsedTime * 2.5) * 0.8;
      }

      // Auto-rotation when activated
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

  // UPDATE CAD BLUEPRINT 3D EXTRUSION (BIM Architecture in 3D)
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    // Remove previous CAD building group
    if (cadBuildingGroupRef.current) {
      scene.remove(cadBuildingGroupRef.current);
      cadBuildingGroupRef.current.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.geometry.dispose();
          if (Array.isArray(child.material)) {
            child.material.forEach((m) => m.dispose());
          } else {
            child.material.dispose();
          }
        }
      });
    }

    const buildingGroup = new THREE.Group();
    // Position on central plateau
    buildingGroup.position.set(0, 10, 0);

    const cx = cadCenter.x;
    const cy = cadCenter.y;
    // Scale factor: 1 CAD unit = 0.7 scene unit for optimal proportions
    const scale = 0.72;

    drawing.entities.forEach((entity) => {
      // 2D Coordinates translated to 3D center (X and Z ground plane)
      const ex = (entity.x + (entity.width || 0) / 2 - cx) * scale;
      const ez = (entity.y + (entity.height || 0) / 2 - cy) * scale;
      const w = Math.max(entity.width * scale, 6);
      const d = Math.max(entity.height * scale, 6);

      // 1. ARCHITECTURAL WALLS (3D Solid Extrusion with Edge Wireframes)
      if (entity.type === 'arch_wall') {
        const wallH = wallHeight;
        const wallGeo = new THREE.BoxGeometry(w, wallH, d);

        let wallMat: THREE.Material;
        if (shadingStyle === 'holographic') {
          // Futuristic translucent holographic cyan-slate
          wallMat = new THREE.MeshStandardMaterial({
            color: 0x0284c7,
            roughness: 0.25,
            metalness: 0.3,
            transparent: true,
            opacity: 0.88,
          });
        } else if (shadingStyle === 'cyber') {
          wallMat = new THREE.MeshStandardMaterial({
            color: 0x6366f1,
            emissive: 0x312e81,
            roughness: 0.3,
            metalness: 0.5,
          });
        } else if (shadingStyle === 'xray') {
          wallMat = new THREE.MeshPhysicalMaterial({
            color: 0x38bdf8,
            transparent: true,
            opacity: 0.35,
            roughness: 0.1,
            metalness: 0.1,
            transmission: 0.85,
          });
        } else {
          // BIM Solid architectural concrete
          wallMat = new THREE.MeshStandardMaterial({
            color: 0x475569,
            roughness: 0.7,
            metalness: 0.1,
          });
        }

        const wallMesh = new THREE.Mesh(wallGeo, wallMat);
        wallMesh.position.set(ex, wallH / 2, ez);
        wallMesh.castShadow = true;
        wallMesh.receiveShadow = true;
        buildingGroup.add(wallMesh);

        // Glowing Wireframe Edges
        const edgesGeo = new THREE.EdgesGeometry(wallGeo);
        const edgesMat = new THREE.LineBasicMaterial({
          color: shadingStyle === 'holographic' ? 0x00f5d4 : 0x94a3b8,
          transparent: true,
          opacity: 0.85,
        });
        const edges = new THREE.LineSegments(edgesGeo, edgesMat);
        edges.position.copy(wallMesh.position);
        buildingGroup.add(edges);
      }

      // 2. STRUCTURAL COLUMNS (Reinforced Pillars)
      else if (entity.type === 'arch_column') {
        const colH = wallHeight * 1.15;
        const colGeo = new THREE.BoxGeometry(w, colH, d);
        const colMat = new THREE.MeshStandardMaterial({
          color: shadingStyle === 'holographic' ? 0x00f5d4 : 0x0f172a,
          emissive: shadingStyle === 'holographic' ? 0x0369a1 : 0x000000,
          roughness: 0.2,
          metalness: 0.7,
        });
        const colMesh = new THREE.Mesh(colGeo, colMat);
        colMesh.position.set(ex, colH / 2, ez);
        colMesh.castShadow = true;
        buildingGroup.add(colMesh);

        // Column crown / beveled cap
        const capGeo = new THREE.BoxGeometry(w * 1.25, 6, d * 1.25);
        const capMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8 });
        const capMesh = new THREE.Mesh(capGeo, capMat);
        capMesh.position.set(ex, colH + 3, ez);
        buildingGroup.add(capMesh);
      }

      // 3. ROOM FLOOR TILES (Color-coded Zones)
      else if (entity.type === 'arch_room') {
        if (showFloors) {
          const floorGeo = new THREE.BoxGeometry(w, 3, d);
          const roomHex = entity.color ? parseInt(entity.color.replace('#', '0x'), 16) : 0x3b82f6;

          const floorMat = new THREE.MeshStandardMaterial({
            color: roomHex,
            roughness: 0.3,
            metalness: 0.2,
            transparent: true,
            opacity: 0.75,
          });
          const floorMesh = new THREE.Mesh(floorGeo, floorMat);
          floorMesh.position.set(ex, 1.5, ez);
          floorMesh.receiveShadow = true;
          buildingGroup.add(floorMesh);

          // Glowing room boundary
          const floorEdgesGeo = new THREE.EdgesGeometry(floorGeo);
          const floorEdgesMat = new THREE.LineBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.6,
          });
          const floorEdges = new THREE.LineSegments(floorEdgesGeo, floorEdgesMat);
          floorEdges.position.copy(floorMesh.position);
          buildingGroup.add(floorEdges);
        }
      }

      // 4. DOORS (3D Glazed Leaf & Threshold)
      else if (entity.type === 'arch_door') {
        const doorH = wallHeight * 0.85;
        const doorGeo = new THREE.BoxGeometry(w, doorH, 4);
        const doorMat = new THREE.MeshStandardMaterial({
          color: 0x2563eb,
          roughness: 0.3,
          metalness: 0.2,
          transparent: true,
          opacity: 0.8,
        });
        const doorMesh = new THREE.Mesh(doorGeo, doorMat);
        doorMesh.position.set(ex, doorH / 2, ez);
        buildingGroup.add(doorMesh);
      }

      // 5. WINDOWS (Glazed Translucent Glass Panels)
      else if (entity.type === 'arch_window') {
        const winH = wallHeight * 0.5;
        const winGeo = new THREE.BoxGeometry(w, winH, 6);
        const winMat = new THREE.MeshPhysicalMaterial({
          color: 0x38bdf8,
          transparent: true,
          opacity: 0.45,
          roughness: 0.05,
          metalness: 0.1,
          transmission: 0.9,
        });
        const winMesh = new THREE.Mesh(winGeo, winMat);
        winMesh.position.set(ex, wallHeight * 0.4 + winH / 2, ez);
        buildingGroup.add(winMesh);
      }

      // 6. FURNITURE (e.g. Bed, Desks)
      else if (entity.type === 'arch_furniture') {
        const furnH = 26;
        const furnGeo = new THREE.BoxGeometry(w, furnH, d);
        const furnMat = new THREE.MeshStandardMaterial({
          color: 0x64748b,
          roughness: 0.5,
        });
        const furnMesh = new THREE.Mesh(furnGeo, furnMat);
        furnMesh.position.set(ex, furnH / 2 + 3, ez);
        buildingGroup.add(furnMesh);
      }
    });

    buildingGroup.visible = showCadWalls;
    scene.add(buildingGroup);
    cadBuildingGroupRef.current = buildingGroup;
  }, [drawing.entities, cadCenter, wallHeight, shadingStyle, showCadWalls, showFloors]);

  // TOGGLES VISIBILITY & SHADING UPDATES
  useEffect(() => {
    if (terrainMeshRef.current) {
      terrainMeshRef.current.visible = showTerrain;
    }
    if (contourMeshRef.current) {
      contourMeshRef.current.visible = showTerrain && showContours;
    }
    if (gridHelperRef.current) {
      gridHelperRef.current.visible = showGrid;
    }
    if (geologicalGroupRef.current) {
      geologicalGroupRef.current.visible = showGeologicalCore;
    }
    if (cadBuildingGroupRef.current) {
      cadBuildingGroupRef.current.visible = showCadWalls;
    }
  }, [showTerrain, showGrid, showGeologicalCore, showCadWalls, showContours]);

  // UPDATE TERRAIN ELEVATION SCALE
  useEffect(() => {
    if (!terrainMeshRef.current || !originalTerrainPositionsRef.current) return;
    const geo = terrainMeshRef.current.geometry;
    const pos = geo.attributes.position;
    const orig = originalTerrainPositionsRef.current;

    for (let i = 0; i < pos.count; i++) {
      const origY = orig[i * 3 + 1];
      pos.setY(i, origY * terrainElevationScale);
    }
    pos.needsUpdate = true;
    geo.computeVertexNormals();

    if (contourMeshRef.current) {
      contourMeshRef.current.geometry.dispose();
      contourMeshRef.current.geometry = new THREE.WireframeGeometry(geo);
    }
  }, [terrainElevationScale]);

  // UPDATE SUN LIGHT ANGLE
  useEffect(() => {
    if (!dirLightRef.current) return;
    const rad = (sunAngle * Math.PI) / 180;
    const radius = 850;
    dirLightRef.current.position.set(
      Math.cos(rad) * radius,
      680,
      Math.sin(rad) * radius
    );
  }, [sunAngle]);

  // UPDATE SHADING STYLE ATMOSPHERE & BACKGROUND
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    if (shadingStyle === 'holographic') {
      // Screenshot exact theme: Deep teal ocean haze, emerald hillshades
      scene.background = new THREE.Color(0x011b20);
      scene.fog = new THREE.FogExp2(0x012328, 0.00065);
      if (gridHelperRef.current) {
        (gridHelperRef.current.material as THREE.LineBasicMaterial).color.setHex(0x00f5d4);
      }
    } else if (shadingStyle === 'cyber') {
      // Cyber Synthwave Neon
      scene.background = new THREE.Color(0x0a0518);
      scene.fog = new THREE.FogExp2(0x0a0518, 0.00075);
      if (gridHelperRef.current) {
        (gridHelperRef.current.material as THREE.LineBasicMaterial).color.setHex(0xf43f5e);
      }
    } else if (shadingStyle === 'bim') {
      // BIM Realistic Daylight
      scene.background = new THREE.Color(0xdbeafe);
      scene.fog = new THREE.FogExp2(0xdbeafe, 0.0004);
      if (gridHelperRef.current) {
        (gridHelperRef.current.material as THREE.LineBasicMaterial).color.setHex(0x94a3b8);
      }
    } else if (shadingStyle === 'xray') {
      // High-Tech X-Ray Glass
      scene.background = new THREE.Color(0x020617);
      scene.fog = new THREE.FogExp2(0x020617, 0.0008);
      if (gridHelperRef.current) {
        (gridHelperRef.current.material as THREE.LineBasicMaterial).color.setHex(0x38bdf8);
      }
    }
  }, [shadingStyle]);

  // CAMERA PRESETS
  const setCameraPreset = (preset: 'isometric' | 'top' | 'front' | 'hero') => {
    if (!cameraRef.current || !controlsRef.current) return;
    const camera = cameraRef.current;
    const controls = controlsRef.current;

    if (preset === 'hero') {
      // Exactly matches the user's uploaded screenshot angle
      camera.position.set(520, 480, 880);
      controls.target.set(0, 30, -30);
    } else if (preset === 'isometric') {
      camera.position.set(750, 600, 750);
      controls.target.set(0, 40, 0);
    } else if (preset === 'top') {
      camera.position.set(0, 1400, 10);
      controls.target.set(0, 0, 0);
    } else if (preset === 'front') {
      camera.position.set(0, 160, 1100);
      controls.target.set(0, 50, 0);
    }
    controls.update();
  };

  // HIGH-RES 4K SNAPSHOT
  const handleTakeSnapshot = () => {
    if (!rendererRef.current) return;
    const dataUrl = rendererRef.current.domElement.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `${drawing.title.replace(/\s+/g, '_')}_3D_Render.png`;
    link.href = dataUrl;
    link.click();
  };

  return (
    <div className="relative w-full h-full bg-[#011b20] overflow-hidden select-none font-sans">
      {/* 1. 3D WebGL Canvas Viewport */}
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* 2. TOP EXECUTIVE HUD BAR */}
      <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none z-20">
        {/* Left: Back to 2D Blueprint & Digital Twin Info */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <button
            onClick={onBackTo2D}
            className="flex items-center gap-2 bg-slate-900/90 hover:bg-slate-800 text-white text-xs font-semibold px-3 py-2 rounded-xl border border-cyan-500/30 backdrop-blur-md shadow-lg shadow-cyan-950/40 transition-all cursor-pointer group hover:border-cyan-400"
          >
            <ArrowLeft size={14} className="text-cyan-400 group-hover:-translate-x-0.5 transition-transform" />
            <span>2D Drafting Plan</span>
          </button>

          <div className="hidden sm:flex items-center gap-2 bg-slate-900/85 text-white px-3.5 py-1.5 rounded-xl border border-slate-700/60 backdrop-blur-md shadow-md text-xs">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-bold tracking-wide text-cyan-300">
              OmegaCAD <span className="text-emerald-400">3D Holographic Twin</span>
            </span>
            <span className="text-[10px] text-slate-400 border-l border-slate-700 pl-2">
              Topological BIM Elevation
            </span>
          </div>
        </div>

        {/* Center: Quick Shading Style Switcher */}
        <div className="pointer-events-auto flex items-center bg-slate-900/90 p-1 rounded-xl border border-cyan-500/20 backdrop-blur-md shadow-xl text-xs gap-1">
          <button
            onClick={() => setShadingStyle('holographic')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
              shadingStyle === 'holographic'
                ? 'bg-gradient-to-r from-emerald-600 to-cyan-600 text-white shadow-sm font-bold'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
            }`}
            title="Holographic Emerald Terrain & Glowing Cyan Wireframe (Screenshot Style)"
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

      {/* 3. FLOATING CAMERA ORIENTATION & VIEW ANGLE CONTROLS (Bottom-Left) */}
      <div className="absolute bottom-4 left-4 z-20 flex flex-col gap-2 pointer-events-auto">
        <div className="bg-slate-900/90 border border-cyan-500/25 rounded-2xl p-1.5 backdrop-blur-md shadow-2xl flex flex-col gap-1 text-slate-300">
          <button
            onClick={() => setCameraPreset('hero')}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs hover:bg-cyan-950/60 hover:text-cyan-300 transition-colors text-left font-medium"
            title="Hero Holographic Perspective (Screenshot View)"
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
          <span>Drag to orbit • Right-click to pan • Scroll to zoom</span>
        </div>
      </div>

      {/* 4. EXPANDABLE 3D LAYERS & GENERATION INSPECTOR (Right HUD) */}
      <div className="absolute top-16 right-4 z-20 pointer-events-auto">
        <div className="bg-slate-900/90 border border-cyan-500/25 rounded-2xl backdrop-blur-md shadow-2xl p-3 w-72 text-slate-200 transition-all">
          {/* Header */}
          <div className="flex items-center justify-between pb-2 border-b border-slate-700/70 mb-2.5">
            <div className="flex items-center gap-2">
              <Sliders size={14} className="text-cyan-400" />
              <span className="text-xs font-bold text-white tracking-wide">3D Viewport Controls</span>
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
            <div className="flex flex-col gap-3 text-xs">
              {/* Layer Toggles */}
              <div className="flex flex-col gap-1.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Visual Components
                </span>

                {/* Emerald Topo Terrain */}
                <label className="flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-slate-800/60 cursor-pointer">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50" />
                    <span>Topological Terrain</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={showTerrain}
                    onChange={(e) => setShowTerrain(e.target.checked)}
                    className="accent-cyan-500 cursor-pointer"
                  />
                </label>

                {/* Cyan Coordinate Grid */}
                <label className="flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-slate-800/60 cursor-pointer">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-sm shadow-cyan-400/50" />
                    <span>Perspective Grid Plane</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={showGrid}
                    onChange={(e) => setShowGrid(e.target.checked)}
                    className="accent-cyan-500 cursor-pointer"
                  />
                </label>

                {/* Crystalline Massing Core (The "Iceberg" in screenshot) */}
                <label className="flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-slate-800/60 cursor-pointer">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-white shadow-sm shadow-white/50" />
                    <span>Geological Core / Massing</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={showGeologicalCore}
                    onChange={(e) => setShowGeologicalCore(e.target.checked)}
                    className="accent-cyan-500 cursor-pointer"
                  />
                </label>

                {/* 3D Extruded CAD Walls */}
                <label className="flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-slate-800/60 cursor-pointer">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-sm shadow-blue-500/50" />
                    <span>Extruded CAD Walls ({drawing.entities.filter((e) => e.type === 'arch_wall').length})</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={showCadWalls}
                    onChange={(e) => setShowCadWalls(e.target.checked)}
                    className="accent-cyan-500 cursor-pointer"
                  />
                </label>

                {/* Topo Contours */}
                <label className="flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-slate-800/60 cursor-pointer">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-teal-400" />
                    <span>Contour Wireframe Lines</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={showContours}
                    onChange={(e) => setShowContours(e.target.checked)}
                    className="accent-cyan-500 cursor-pointer"
                  />
                </label>

                {/* Room Floor Slabs */}
                <label className="flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-slate-800/60 cursor-pointer">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-indigo-400" />
                    <span>Room Floor Slabs</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={showFloors}
                    onChange={(e) => setShowFloors(e.target.checked)}
                    className="accent-cyan-500 cursor-pointer"
                  />
                </label>
              </div>

              {/* Sliders: Wall Height & Terrain Relief */}
              <div className="pt-2 border-t border-slate-700/60 flex flex-col gap-2.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Geometric Scales
                </span>

                {/* Wall Height */}
                <div className="flex flex-col gap-1">
                  <div className="flex justify-between text-[11px] text-slate-300">
                    <span>Wall Extrusion Height</span>
                    <span className="text-cyan-400 font-mono font-bold">
                      {(wallHeight / 50).toFixed(1)} m
                    </span>
                  </div>
                  <input
                    type="range"
                    min={50}
                    max={260}
                    value={wallHeight}
                    onChange={(e) => setWallHeight(Number(e.target.value))}
                    className="w-full accent-cyan-400 h-1.5 bg-slate-700 rounded-lg cursor-pointer"
                  />
                </div>

                {/* Terrain Elevation Relief */}
                <div className="flex flex-col gap-1">
                  <div className="flex justify-between text-[11px] text-slate-300">
                    <span>Elevation Exaggeration</span>
                    <span className="text-emerald-400 font-mono font-bold">
                      {terrainElevationScale.toFixed(1)}x
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0.2}
                    max={2.2}
                    step={0.1}
                    value={terrainElevationScale}
                    onChange={(e) => setTerrainElevationScale(Number(e.target.value))}
                    className="w-full accent-emerald-400 h-1.5 bg-slate-700 rounded-lg cursor-pointer"
                  />
                </div>

                {/* Sun Light Azimuth */}
                <div className="flex flex-col gap-1">
                  <div className="flex justify-between text-[11px] text-slate-300">
                    <span className="flex items-center gap-1">
                      <Sun size={12} className="text-amber-400" />
                      <span>Sun Direction</span>
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

              {/* 3D Blueprint Stats */}
              <div className="bg-slate-950/60 rounded-xl p-2.5 border border-cyan-500/10 text-[11px] text-slate-400 flex flex-col gap-1">
                <div className="flex justify-between">
                  <span>Project</span>
                  <span className="text-slate-200 font-medium truncate max-w-[140px]">
                    {drawing.title}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>CAD Entities in 3D</span>
                  <span className="text-cyan-300 font-mono font-semibold">
                    {drawing.entities.length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Engine</span>
                  <span className="text-emerald-300 font-mono">WebGL Three.js</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
