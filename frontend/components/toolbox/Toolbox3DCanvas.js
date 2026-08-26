'use client';

import { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import * as THREE from 'three';

// Category color mappings with vibrant neon accents
const CATEGORY_THEMES = {
  sockets: { hex: 0x00f2fe, css: '#00f2fe', name: 'Sockets & Bits', nameAr: 'بكسات وبوكسات' },
  combination_wrenches: { hex: 0xffa000, css: '#ffa000', name: 'Spanners & Wrenches', nameAr: 'مفاتيح شق-رنج' },
  open_wrenches: { hex: 0xff6b00, css: '#ff6b00', name: 'Open Wrenches', nameAr: 'مفاتيح شق' },
  torx_keys: { hex: 0x9d4edd, css: '#9d4edd', name: 'Torx & Star Keys', nameAr: 'مفاتيح ومشرشر Torx' },
  hex_keys: { hex: 0x3a86ff, css: '#3a86ff', name: 'Hex Allen Keys', nameAr: 'مفاتيح ألنكيه' },
  screwdrivers: { hex: 0xf72585, css: '#f72585', name: 'Screwdrivers', nameAr: 'مفكات متنوعة' },
  snap_rings: { hex: 0x06d6a0, css: '#06d6a0', name: 'Snap Ring Pliers', nameAr: 'طقم سناب رنج' },
  files: { hex: 0xb5179e, css: '#b5179e', name: 'Files Set', nameAr: 'طقم مبارد' },
  ratchets_extensions: { hex: 0x10b981, css: '#10b981', name: 'Ratchets & Extensions', nameAr: 'يدات ووصلات' },
  pliers_cutters: { hex: 0xef4444, css: '#ef4444', name: 'Pliers & Cutters', nameAr: 'زراديات وبنس' },
  hammers_saws: { hex: 0xf43f5e, css: '#f43f5e', name: 'Hammers & Saws', nameAr: 'مطارق ومناشير' },
  electrical_measuring: { hex: 0x6366f1, css: '#6366f1', name: 'Measurement & Power', nameAr: 'قياس وكهرباء' },
  storage: { hex: 0x64748b, css: '#64748b', name: 'Storage & Boxes', nameAr: 'صناديق وحقائب' },
  specialty_tools: { hex: 0x0284c7, css: '#0284c7', name: 'Specialty Tools', nameAr: 'أدوات متخصصة' },
  general_tools: { hex: 0x94a3b8, css: '#94a3b8', name: 'General Tools', nameAr: 'أدوات عامة' },
};

const STATUS_THEMES = {
  good: { hex: 0x10b981, css: '#10b981', label: 'Operational', labelAr: 'سليم' },
  damaged: { hex: 0xf59e0b, css: '#f59e0b', label: 'Damaged', labelAr: 'تالف' },
  missing: { hex: 0xef4444, css: '#ef4444', label: 'Missing', labelAr: 'مفقود' },
  not_delivered: { hex: 0x8b5cf6, css: '#8b5cf6', label: 'Pending Delivery', labelAr: 'لم يتم التسليم' },
};

const TOOLBOX_THEMES = {
  cobalt: {
    name: 'Cobalt Pro Blue',
    body: 0x1e3a8a,
    lid: 0x172554,
    tray: 0x0f172a,
    accent: 0x38bdf8,
    metalness: 0.85,
    roughness: 0.25,
  },
  crimson: {
    name: 'Crimson Racing Red',
    body: 0xb91c1c,
    lid: 0x7f1d1d,
    tray: 0x18181b,
    accent: 0xf87171,
    metalness: 0.8,
    roughness: 0.3,
  },
  stealth: {
    name: 'Stealth Carbon Black',
    body: 0x18181b,
    lid: 0x09090b,
    tray: 0x27272a,
    accent: 0xf59e0b,
    metalness: 0.9,
    roughness: 0.2,
  },
  dewalt: {
    name: 'Industrial Yellow',
    body: 0xca8a04,
    lid: 0xa16207,
    tray: 0x1e293b,
    accent: 0x0f172a,
    metalness: 0.75,
    roughness: 0.35,
  },
  emerald: {
    name: 'Titanium Green',
    body: 0x047857,
    lid: 0x064e3b,
    tray: 0x0f172a,
    accent: 0x34d399,
    metalness: 0.85,
    roughness: 0.25,
  },
};

export default function Toolbox3DCanvas({
  technician,
  tools = [],
  selectedTool = null,
  onSelectTool,
  isOpen = true,
  onToggleOpen,
  activeCategory = 'ALL',
  statusFilter = 'ALL',
  searchQuery = '',
  themeKey = 'cobalt',
}) {
  const mountRef = useRef(null);
  const [hoveredTool, setHoveredTool] = useState(null);
  const [autoRotate, setAutoRotate] = useState(false);
  const [explosionHeight, setExplosionHeight] = useState(1.0);
  const [activePreset, setActivePreset] = useState('iso');

  // Three.js References
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const animFrameRef = useRef(null);
  const toolNodesRef = useRef([]);
  const raycasterRef = useRef(new THREE.Raycaster());
  const mousePosRef = useRef(new THREE.Vector2(-999, -999));

  // Dynamic Camera Controls State
  const controlsRef = useRef({
    isDragging: false,
    prevMousePos: { x: 0, y: 0 },
    rotation: { x: 0.38, y: -0.55 },
    targetRotation: { x: 0.38, y: -0.55 },
    distance: 13.5,
    targetDistance: 13.5,
    pan: { x: 0, y: 0.6 },
    targetPan: { x: 0, y: 0.6 },
  });

  // Toolbox Mechanism Parts
  const partsRef = useRef({
    chassis: null,
    lidLeftPivot: null,
    lidRightPivot: null,
    trayLeft: null,
    trayRight: null,
    scissorArms: [],
    latches: [],
    openProgress: isOpen ? 1 : 0,
    targetOpenProgress: isOpen ? 1 : 0,
  });

  // Filter tools
  const filteredTools = useMemo(() => {
    return tools.filter((t) => {
      if (activeCategory !== 'ALL' && t.category !== activeCategory) return false;
      if (statusFilter !== 'ALL' && t.status !== statusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const mName = (t.name || '').toLowerCase().includes(q);
        const mEn = (t.nameEn || '').toLowerCase().includes(q);
        const mCat = (t.categoryAr || '').toLowerCase().includes(q);
        const mSpec = (t.specification || '').toLowerCase().includes(q);
        if (!mName && !mEn && !mCat && !mSpec) return false;
      }
      return true;
    });
  }, [tools, activeCategory, statusFilter, searchQuery]);

  // Sync open state
  useEffect(() => {
    partsRef.current.targetOpenProgress = isOpen ? 1 : 0;
  }, [isOpen]);

  // High-DPI Canvas Sprite Texture Generator
  const createToolTexture = useCallback((tool, isHovered, isSelected) => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    const catTheme = CATEGORY_THEMES[tool.category] || CATEGORY_THEMES.general_tools;
    const statusTheme = STATUS_THEMES[tool.status] || STATUS_THEMES.good;

    // Background Card with Glassmorphic Gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, 256);
    bgGrad.addColorStop(0, isSelected ? 'rgba(30, 58, 138, 0.95)' : isHovered ? 'rgba(15, 23, 42, 0.96)' : 'rgba(10, 15, 29, 0.92)');
    bgGrad.addColorStop(1, isSelected ? 'rgba(15, 23, 42, 0.98)' : 'rgba(5, 8, 16, 0.95)');

    ctx.fillStyle = bgGrad;
    ctx.strokeStyle = isSelected ? '#38bdf8' : isHovered ? catTheme.css : 'rgba(255, 255, 255, 0.18)';
    ctx.lineWidth = isSelected ? 8 : isHovered ? 6 : 3;

    ctx.beginPath();
    ctx.roundRect(10, 10, 492, 236, 28);
    ctx.fill();
    ctx.stroke();

    // Top Category Accent Banner
    ctx.fillStyle = catTheme.css;
    ctx.beginPath();
    ctx.roundRect(10, 10, 492, 48, [28, 28, 0, 0]);
    ctx.fill();

    // Category Label
    ctx.fillStyle = '#090d16';
    ctx.font = '900 22px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText((tool.categoryEn || tool.categoryAr || '').toUpperCase(), 256, 42);

    // Primary Tool Name
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 36px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    const cleanName = tool.name.length > 22 ? tool.name.slice(0, 20) + '...' : tool.name;
    ctx.fillText(cleanName, 256, 115);

    // English Name / Transliteration
    ctx.fillStyle = '#94a3b8';
    ctx.font = '500 22px system-ui, -apple-system, sans-serif';
    const cleanEn = (tool.nameEn || '').length > 30 ? (tool.nameEn || '').slice(0, 28) + '...' : tool.nameEn;
    ctx.fillText(cleanEn || '', 256, 150);

    // Bottom Badges Line
    // Left: Status Badge
    ctx.fillStyle = statusTheme.css;
    ctx.beginPath();
    ctx.roundRect(32, 180, 20, 20, 10);
    ctx.fill();

    ctx.fillStyle = '#e2e8f0';
    ctx.font = 'bold 20px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(statusTheme.label, 62, 196);

    // Center / Right: Specification Badge
    if (tool.specification) {
      ctx.fillStyle = 'rgba(56, 189, 248, 0.18)';
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(260, 172, 110, 36, 10);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 20px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`${tool.specification} mm`, 315, 197);
    }

    // Right: Quantity Badge
    ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.beginPath();
    ctx.roundRect(385, 172, 95, 36, 10);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 20px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`x${tool.quantity}`, 432, 197);

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    texture.generateMipmaps = false;
    return texture;
  }, []);

  // Initialize Three.js WebGL Engine
  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;
    const width = container.clientWidth || 900;
    const height = container.clientHeight || 580;

    // 1. Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x060913);
    scene.fog = new THREE.FogExp2(0x060913, 0.022);
    sceneRef.current = scene;

    // 2. Camera setup
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    camera.position.set(0, 5.5, 13.5);
    cameraRef.current = camera;

    // 3. Renderer with high dynamic range and shadows
    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance',
      });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.15;
      container.replaceChildren(renderer.domElement);
      rendererRef.current = renderer;
    } catch (e) {
      console.error(e);
      return;
    }

    // 4. Studio Lighting Design
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.4);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 2.8);
    keyLight.position.set(10, 18, 12);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 2048;
    keyLight.shadow.mapSize.height = 2048;
    keyLight.shadow.bias = -0.0001;
    scene.add(keyLight);

    const cyanRim = new THREE.PointLight(0x00f2fe, 3.2, 25);
    cyanRim.position.set(-9, 8, -6);
    scene.add(cyanRim);

    const amberFill = new THREE.DirectionalLight(0xffa000, 1.2);
    amberFill.position.set(8, -2, -8);
    scene.add(amberFill);

    // 5. Studio Workbench & Circular Neon Stage
    const floorGeo = new THREE.PlaneGeometry(60, 60);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x05070e,
      roughness: 0.85,
      metalness: 0.1,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -2.1;
    floor.receiveShadow = true;
    scene.add(floor);

    // Holographic Grid Rings
    const grid = new THREE.GridHelper(32, 32, 0x1e293b, 0x090d16);
    grid.position.y = -2.09;
    scene.add(grid);

    const ringGeo1 = new THREE.RingGeometry(4.6, 4.75, 64);
    const ringMat1 = new THREE.MeshBasicMaterial({ color: 0x00f2fe, side: THREE.DoubleSide });
    const ring1 = new THREE.Mesh(ringGeo1, ringMat1);
    ring1.rotation.x = -Math.PI / 2;
    ring1.position.y = -2.08;
    scene.add(ring1);

    const ringGeo2 = new THREE.RingGeometry(6.2, 6.25, 64);
    const ringMat2 = new THREE.MeshBasicMaterial({ color: 0x3b82f6, side: THREE.DoubleSide, opacity: 0.5, transparent: true });
    const ring2 = new THREE.Mesh(ringGeo2, ringMat2);
    ring2.rotation.x = -Math.PI / 2;
    ring2.position.y = -2.08;
    scene.add(ring2);

    // 6. Build Ultra-Realistic 3D Cantilever Toolbox Model
    const currentTheme = TOOLBOX_THEMES[themeKey] || TOOLBOX_THEMES.cobalt;
    const toolboxRoot = new THREE.Group();
    toolboxRoot.position.y = -1.1;
    scene.add(toolboxRoot);

    // Materials
    const bodyMat = new THREE.MeshStandardMaterial({
      color: currentTheme.body,
      metalness: currentTheme.metalness,
      roughness: currentTheme.roughness,
    });

    const darkInteriorMat = new THREE.MeshStandardMaterial({
      color: currentTheme.tray,
      metalness: 0.3,
      roughness: 0.7,
    });

    const chromeMat = new THREE.MeshStandardMaterial({
      color: 0xf1f5f9,
      metalness: 0.95,
      roughness: 0.1,
    });

    const goldMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      metalness: 0.9,
      roughness: 0.2,
    });

    const rubberMat = new THREE.MeshStandardMaterial({
      color: 0x09090b,
      roughness: 0.9,
    });

    // --- Main Bottom Tub Chassis ---
    const tubGeo = new THREE.BoxGeometry(5.6, 2.1, 2.9);
    const tubMesh = new THREE.Mesh(tubGeo, bodyMat);
    tubMesh.castShadow = true;
    tubMesh.receiveShadow = true;
    toolboxRoot.add(tubMesh);

    // Rubber Corner Bumpers
    const bumperGeo = new THREE.BoxGeometry(0.3, 2.15, 0.3);
    [
      [-2.75, 0, -1.4],
      [2.75, 0, -1.4],
      [-2.75, 0, 1.4],
      [2.75, 0, 1.4],
    ].forEach(([x, y, z]) => {
      const b = new THREE.Mesh(bumperGeo, rubberMat);
      b.position.set(x, y, z);
      toolboxRoot.add(b);
    });

    // Rubber Feet
    const footGeo = new THREE.CylinderGeometry(0.25, 0.3, 0.18, 16);
    [
      [-2.4, -1.1, -1.1],
      [2.4, -1.1, -1.1],
      [-2.4, -1.1, 1.1],
      [2.4, -1.1, 1.1],
    ].forEach(([x, y, z]) => {
      const foot = new THREE.Mesh(footGeo, rubberMat);
      foot.position.set(x, y, z);
      toolboxRoot.add(foot);
    });

    // Side Handles
    const sideHandleGeo = new THREE.TorusGeometry(0.4, 0.09, 12, 24, Math.PI);
    const hLeft = new THREE.Mesh(sideHandleGeo, chromeMat);
    hLeft.position.set(-2.85, 0.2, 0);
    hLeft.rotation.y = -Math.PI / 2;
    hLeft.rotation.z = Math.PI / 2;
    toolboxRoot.add(hLeft);

    const hRight = new THREE.Mesh(sideHandleGeo, chromeMat);
    hRight.position.set(2.85, 0.2, 0);
    hRight.rotation.y = Math.PI / 2;
    hRight.rotation.z = Math.PI / 2;
    toolboxRoot.add(hRight);

    // Brass Technician Engraved Nameplate
    const nameplateGeo = new THREE.BoxGeometry(2.6, 0.65, 0.06);
    const nameplate = new THREE.Mesh(nameplateGeo, goldMat);
    nameplate.position.set(0, 0.2, 1.48);
    toolboxRoot.add(nameplate);

    // --- Left Upper Cantilever Tray ---
    const trayGeo = new THREE.BoxGeometry(2.5, 0.75, 2.7);
    const trayLeft = new THREE.Mesh(trayGeo, darkInteriorMat);
    trayLeft.position.set(-1.3, 0.65, 0);
    trayLeft.castShadow = true;
    toolboxRoot.add(trayLeft);

    // Tray Dividers
    const divGeo = new THREE.BoxGeometry(0.08, 0.65, 2.6);
    [-0.65, 0, 0.65].forEach((dx) => {
      const div = new THREE.Mesh(divGeo, bodyMat);
      div.position.set(dx, 0.05, 0);
      trayLeft.add(div);
    });

    // --- Right Upper Cantilever Tray ---
    const trayRight = new THREE.Mesh(trayGeo, darkInteriorMat);
    trayRight.position.set(1.3, 0.65, 0);
    trayRight.castShadow = true;
    toolboxRoot.add(trayRight);

    [-0.65, 0, 0.65].forEach((dx) => {
      const div = new THREE.Mesh(divGeo, bodyMat);
      div.position.set(dx, 0.05, 0);
      trayRight.add(div);
    });

    // --- Scissor Linkages (Cantilever Arms) ---
    const armGeo = new THREE.BoxGeometry(0.08, 1.4, 0.08);
    const scissorArmL1 = new THREE.Mesh(armGeo, chromeMat);
    scissorArmL1.position.set(-2.6, 0.4, 1.4);
    toolboxRoot.add(scissorArmL1);

    const scissorArmR1 = new THREE.Mesh(armGeo, chromeMat);
    scissorArmR1.position.set(2.6, 0.4, 1.4);
    toolboxRoot.add(scissorArmR1);

    // --- Dual Top Lids with Pivot Hinges ---
    const lidLeftPivot = new THREE.Group();
    lidLeftPivot.position.set(-2.8, 1.05, 0);
    toolboxRoot.add(lidLeftPivot);

    const lidGeo = new THREE.BoxGeometry(2.8, 0.38, 2.92);
    const lidMeshL = new THREE.Mesh(lidGeo, bodyMat);
    lidMeshL.position.set(1.4, 0.19, 0);
    lidMeshL.castShadow = true;
    lidLeftPivot.add(lidMeshL);

    const lidRightPivot = new THREE.Group();
    lidRightPivot.position.set(2.8, 1.05, 0);
    toolboxRoot.add(lidRightPivot);

    const lidMeshR = new THREE.Mesh(lidGeo, bodyMat);
    lidMeshR.position.set(-1.4, 0.19, 0);
    lidMeshR.castShadow = true;
    lidRightPivot.add(lidMeshR);

    // Center Heavy Aluminum Handle (Mounted on right lid)
    const handleBarGeo = new THREE.CylinderGeometry(0.14, 0.14, 2.4, 16);
    const handleBar = new THREE.Mesh(handleBarGeo, chromeMat);
    handleBar.rotation.z = Math.PI / 2;
    handleBar.position.set(-1.4, 0.68, 0);
    lidRightPivot.add(handleBar);

    // Front Chrome Toggle Latches
    const latchGeo = new THREE.BoxGeometry(0.24, 0.45, 0.12);
    const latch1 = new THREE.Mesh(latchGeo, chromeMat);
    latch1.position.set(-1.3, 0.9, 1.5);
    toolboxRoot.add(latch1);

    const latch2 = new THREE.Mesh(latchGeo, chromeMat);
    latch2.position.set(1.3, 0.9, 1.5);
    toolboxRoot.add(latch2);

    partsRef.current = {
      chassis: tubMesh,
      lidLeftPivot,
      lidRightPivot,
      trayLeft,
      trayRight,
      scissorArms: [scissorArmL1, scissorArmR1],
      latches: [latch1, latch2],
      openProgress: isOpen ? 1 : 0,
      targetOpenProgress: isOpen ? 1 : 0,
    };

    // 7. Interactive Mouse / Touch Handlers
    const onPointerDown = (e) => {
      controlsRef.current.isDragging = true;
      controlsRef.current.prevMousePos = { x: e.clientX, y: e.clientY };
    };

    const onPointerMove = (e) => {
      const rect = container.getBoundingClientRect();
      mousePosRef.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mousePosRef.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      if (!controlsRef.current.isDragging) return;
      const deltaX = e.clientX - controlsRef.current.prevMousePos.x;
      const deltaY = e.clientY - controlsRef.current.prevMousePos.y;

      controlsRef.current.targetRotation.y += deltaX * 0.007;
      controlsRef.current.targetRotation.x = Math.max(
        0.05,
        Math.min(Math.PI / 2 - 0.05, controlsRef.current.targetRotation.x + deltaY * 0.007)
      );

      controlsRef.current.prevMousePos = { x: e.clientX, y: e.clientY };
    };

    const onPointerUp = () => {
      controlsRef.current.isDragging = false;
    };

    const onWheel = (e) => {
      e.preventDefault();
      controlsRef.current.targetDistance = Math.max(
        6.5,
        Math.min(24, controlsRef.current.targetDistance + e.deltaY * 0.012)
      );
    };

    const onClick = () => {
      if (!cameraRef.current || !sceneRef.current) return;
      raycasterRef.current.setFromCamera(mousePosRef.current, cameraRef.current);
      const meshes = toolNodesRef.current.map((n) => n.mesh);
      const intersects = raycasterRef.current.intersectObjects(meshes, true);

      if (intersects.length > 0) {
        let obj = intersects[0].object;
        while (obj && !obj.userData.tool && obj.parent) {
          obj = obj.parent;
        }
        if (obj?.userData?.tool) {
          const tool = obj.userData.tool;
          if (onSelectTool) onSelectTool(tool);

          // Smooth camera focus glide
          const targetNode = toolNodesRef.current.find((n) => n.tool.id === tool.id);
          if (targetNode) {
            controlsRef.current.targetPan = {
              x: targetNode.group.position.x * 0.5,
              y: targetNode.group.position.y * 0.5 + 0.2,
            };
          }
        }
      }
    };

    container.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    container.addEventListener('wheel', onWheel, { passive: false });
    container.addEventListener('click', onClick);

    // 8. Resize Handler
    const onResize = () => {
      if (!container || !rendererRef.current || !cameraRef.current) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    // 9. 60 FPS Render Loop
    let clock = new THREE.Clock();

    const animate = () => {
      animFrameRef.current = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const elapsed = clock.getElapsedTime();

      // Camera lerp
      const ctrl = controlsRef.current;
      if (autoRotate && !ctrl.isDragging) {
        ctrl.targetRotation.y += delta * 0.25;
      }

      ctrl.rotation.x += (ctrl.targetRotation.x - ctrl.rotation.x) * 0.08;
      ctrl.rotation.y += (ctrl.targetRotation.y - ctrl.rotation.y) * 0.08;
      ctrl.distance += (ctrl.targetDistance - ctrl.distance) * 0.08;
      ctrl.pan.x += (ctrl.targetPan.x - ctrl.pan.x) * 0.08;
      ctrl.pan.y += (ctrl.targetPan.y - ctrl.pan.y) * 0.08;

      const camX = ctrl.distance * Math.sin(ctrl.rotation.y) * Math.cos(ctrl.rotation.x) + ctrl.pan.x;
      const camY = ctrl.distance * Math.sin(ctrl.rotation.x) + ctrl.pan.y;
      const camZ = ctrl.distance * Math.cos(ctrl.rotation.y) * Math.cos(ctrl.rotation.x);

      camera.position.set(camX, camY, camZ);
      camera.lookAt(ctrl.pan.x, ctrl.pan.y, 0);

      // Smooth Toolbox Opening Mechanics
      const p = partsRef.current;
      p.openProgress += (p.targetOpenProgress - p.openProgress) * 0.07;
      const op = p.openProgress;

      // Lids swing open (-115 deg)
      if (p.lidLeftPivot) p.lidLeftPivot.rotation.z = op * (Math.PI * 0.64);
      if (p.lidRightPivot) p.lidRightPivot.rotation.z = -op * (Math.PI * 0.64);

      // Cantilever trays slide outward
      if (p.trayLeft) {
        p.trayLeft.position.x = -1.3 - op * 1.55;
        p.trayLeft.position.y = 0.65 + op * 0.45;
      }
      if (p.trayRight) {
        p.trayRight.position.x = 1.3 + op * 1.55;
        p.trayRight.position.y = 0.65 + op * 0.45;
      }

      // Latches unclamp
      if (p.latches) {
        p.latches.forEach((l) => {
          l.rotation.x = op * (Math.PI * 0.45);
        });
      }

      // Dynamic Holographic Tool Arc Explosion
      toolNodesRef.current.forEach((node) => {
        const { group, targetArcPos, phase } = node;

        if (op < 0.03) {
          group.scale.setScalar(0.001);
          group.position.set(0, 0, 0);
        } else {
          // Gentle floating sine wave
          const waveY = Math.sin(elapsed * 2.2 + phase) * 0.18;
          const waveX = Math.cos(elapsed * 1.5 + phase) * 0.08;

          const destX = targetArcPos.x * op;
          const destY = (targetArcPos.y + waveY) * op * explosionHeight;
          const destZ = (targetArcPos.z + waveX) * op;

          group.position.x += (destX - group.position.x) * 0.1;
          group.position.y += (destY - group.position.y) * 0.1;
          group.position.z += (destZ - group.position.z) * 0.1;

          group.scale.setScalar(Math.min(1.0, op * 1.05));

          // Billboarding: Tool card always faces camera with high clarity
          group.quaternion.copy(camera.quaternion);
        }
      });

      // Hover Raycasting Check
      raycasterRef.current.setFromCamera(mousePosRef.current, camera);
      const meshes = toolNodesRef.current.map((n) => n.mesh);
      const intersects = raycasterRef.current.intersectObjects(meshes, true);

      if (intersects.length > 0) {
        let obj = intersects[0].object;
        while (obj && !obj.userData.tool && obj.parent) {
          obj = obj.parent;
        }
        if (obj?.userData?.tool) {
          setHoveredTool(obj.userData.tool);
          container.style.cursor = 'pointer';
        }
      } else {
        setHoveredTool(null);
        container.style.cursor = 'grab';
      }

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animFrameRef.current);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      container.removeEventListener('pointerdown', onPointerDown);
      container.removeEventListener('wheel', onWheel);
      container.removeEventListener('click', onClick);
      if (rendererRef.current?.domElement) {
        rendererRef.current.dispose();
      }
    };
  }, [themeKey, autoRotate, explosionHeight, isOpen, onSelectTool]);

  // Re-generate Structured 3D Tool Fan Arcs
  useEffect(() => {
    if (!sceneRef.current) return;
    const scene = sceneRef.current;

    // Clean old tool nodes
    toolNodesRef.current.forEach((n) => {
      scene.remove(n.group);
      if (n.mesh?.material?.map) n.mesh.material.map.dispose();
      if (n.mesh?.material) n.mesh.material.dispose();
      if (n.mesh?.geometry) n.mesh.geometry.dispose();
    });
    toolNodesRef.current = [];

    // Limit floating nodes in 3D to maintain 60 FPS while keeping top tools
    const maxNodes = Math.min(filteredTools.length, 52);

    // Group tools into 3 physical drawer origins
    // 1. Sockets & Bits (Left Arc)
    // 2. Torx & Hex Keys (Right Arc)
    // 3. Spanners, Screwdrivers & Heavy Tools (Center High Arc)
    filteredTools.slice(0, maxNodes).forEach((tool, idx) => {
      const group = new THREE.Group();

      let originTray = 'center';
      if (['sockets', 'specialty_sets'].includes(tool.category)) originTray = 'left';
      else if (['torx_keys', 'hex_keys'].includes(tool.category)) originTray = 'right';

      let posX, posY, posZ;
      const countInGroup = maxNodes;
      const angle = (idx / countInGroup) * Math.PI * 1.6 - Math.PI * 0.8; // Fan between -145° and +145°
      const tier = idx % 3; // 3 vertical stadium tiers

      const radius = 4.2 + tier * 1.6;
      posX = Math.sin(angle) * radius;
      posY = 1.6 + tier * 1.4 + Math.cos(angle) * 0.6;
      posZ = Math.cos(angle) * (radius * 0.75);

      // Create high-res sprite
      const isSelected = selectedTool?.id === tool.id;
      const isHovered = hoveredTool?.id === tool.id;
      const texture = createToolTexture(tool, isHovered, isSelected);

      const spriteGeo = new THREE.PlaneGeometry(2.0, 1.0);
      const spriteMat = new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        side: THREE.DoubleSide,
        depthWrite: false,
      });

      const spriteMesh = new THREE.Mesh(spriteGeo, spriteMat);
      spriteMesh.userData = { tool };
      group.add(spriteMesh);

      // Category Halo Ring
      const catHex = CATEGORY_THEMES[tool.category]?.hex || 0x00f2fe;
      const haloGeo = new THREE.RingGeometry(1.0, 1.08, 32);
      const haloMat = new THREE.MeshBasicMaterial({
        color: catHex,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.5,
      });
      const halo = new THREE.Mesh(haloGeo, haloMat);
      halo.position.z = -0.01;
      group.add(halo);

      group.position.set(posX, posY, posZ);
      group.userData = { tool };
      scene.add(group);

      toolNodesRef.current.push({
        group,
        mesh: spriteMesh,
        tool,
        targetArcPos: new THREE.Vector3(posX, posY, posZ),
        phase: (idx * 0.4) % (Math.PI * 2),
      });
    });
  }, [filteredTools, selectedTool, hoveredTool, createToolTexture]);

  // Preset Camera Angles
  const setCameraPreset = (preset) => {
    setActivePreset(preset);
    const ctrl = controlsRef.current;
    if (preset === 'front') {
      ctrl.targetRotation = { x: 0.15, y: 0 };
      ctrl.targetDistance = 11.5;
      ctrl.targetPan = { x: 0, y: 0.3 };
    } else if (preset === 'iso') {
      ctrl.targetRotation = { x: 0.38, y: -0.55 };
      ctrl.targetDistance = 13.5;
      ctrl.targetPan = { x: 0, y: 0.6 };
    } else if (preset === 'top') {
      ctrl.targetRotation = { x: 1.35, y: 0 };
      ctrl.targetDistance = 14;
      ctrl.targetPan = { x: 0, y: 0 };
    } else if (preset === 'cloud') {
      ctrl.targetRotation = { x: 0.3, y: -0.9 };
      ctrl.targetDistance = 18;
      ctrl.targetPan = { x: 0, y: 1.8 };
    }
  };

  return (
    <div className="relative w-full h-full min-h-[580px] bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 rounded-3xl overflow-hidden border border-slate-800 shadow-2xl">
      {/* 3D Canvas Mount */}
      <div ref={mountRef} className="w-full h-full min-h-[580px]" />

      {/* Top Glassmorphic Control Bar */}
      <div className="absolute top-4 left-4 right-4 flex flex-wrap items-center justify-between gap-3 pointer-events-none">
        {/* Technician Badge */}
        <div className="flex items-center gap-3 bg-slate-900/90 backdrop-blur-xl px-4 py-2.5 rounded-2xl border border-slate-700/80 shadow-2xl pointer-events-auto">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white text-lg shadow-md shadow-cyan-500/20">
            🧰
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-white font-bold text-sm tracking-tight">{technician?.name}</span>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                {technician?.stats?.operationalRate}% Ready
              </span>
            </div>
            <span className="text-xs text-slate-400 font-medium">
              {technician?.nameEn} • {technician?.stats?.totalQuantity} Tools Total
            </span>
          </div>
        </div>

        {/* Studio Controls */}
        <div className="flex items-center gap-2 bg-slate-900/90 backdrop-blur-xl p-1.5 rounded-2xl border border-slate-700/80 shadow-2xl pointer-events-auto">
          {/* Latch Open/Close Toggle */}
          <button
            onClick={onToggleOpen}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              isOpen
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 shadow-md shadow-cyan-500/30'
                : 'bg-slate-800 text-slate-200 hover:bg-slate-750'
            }`}
          >
            <span>{isOpen ? '🔓' : '🔒'}</span>
            <span>{isOpen ? 'Toolbox Open (Exploded)' : 'Toolbox Closed'}</span>
          </button>

          <button
            onClick={() => setAutoRotate(!autoRotate)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              autoRotate ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-800 text-slate-300 hover:bg-slate-750'
            }`}
          >
            <span>🔄</span>
            <span>{autoRotate ? 'Rotating' : 'Auto Rotate'}</span>
          </button>

          <div className="h-5 w-px bg-slate-700 mx-1" />

          {/* Camera Preset Pills */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCameraPreset('iso')}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                activePreset === 'iso' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold' : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              Isometric
            </button>
            <button
              onClick={() => setCameraPreset('front')}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                activePreset === 'front' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold' : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              Front
            </button>
            <button
              onClick={() => setCameraPreset('top')}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                activePreset === 'top' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold' : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              Top-Down
            </button>
            <button
              onClick={() => setCameraPreset('cloud')}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                activePreset === 'cloud' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold' : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              Orbit Fan
            </button>
          </div>
        </div>
      </div>

      {/* Floating Tools Density Slider */}
      <div className="absolute bottom-4 left-4 flex items-center gap-3 bg-slate-900/90 backdrop-blur-xl px-4 py-2.5 rounded-2xl border border-slate-700/80 shadow-2xl pointer-events-auto">
        <span className="text-xs font-bold text-slate-300">Explosion Fan Radius:</span>
        <input
          type="range"
          min="0.5"
          max="2.0"
          step="0.1"
          value={explosionHeight}
          onChange={(e) => setExplosionHeight(parseFloat(e.target.value))}
          className="w-28 h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-400"
        />
        <span className="text-xs text-cyan-400 font-mono font-bold">{Math.round(explosionHeight * 100)}%</span>
      </div>

      {/* Quick Hover Tool Card Overlay */}
      {hoveredTool && (
        <div className="absolute bottom-4 right-4 max-w-sm bg-slate-900/95 backdrop-blur-2xl p-4 rounded-2xl border border-cyan-500/60 shadow-2xl shadow-cyan-950/60 animate-in fade-in slide-in-from-bottom-2 duration-150 pointer-events-auto">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: STATUS_THEMES[hoveredTool.status]?.css }}
                />
                <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider">
                  {hoveredTool.categoryEn || hoveredTool.categoryAr}
                </span>
              </div>
              <h4 className="text-white font-black text-base leading-tight">{hoveredTool.name}</h4>
              <p className="text-xs text-slate-400 mt-0.5">{hoveredTool.nameEn}</p>
            </div>
            <span className="px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-xs text-cyan-300 font-mono font-bold">
              x{hoveredTool.quantity}
            </span>
          </div>

          <div className="mt-3 pt-2.5 border-t border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-400">
              Size: <strong className="text-slate-200">{hoveredTool.specification ? `${hoveredTool.specification}mm` : 'Standard'}</strong>
            </span>
            <button
              onClick={() => onSelectTool && onSelectTool(hoveredTool)}
              className="text-cyan-400 hover:text-cyan-300 font-bold flex items-center gap-1"
            >
              Open Inspector →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
