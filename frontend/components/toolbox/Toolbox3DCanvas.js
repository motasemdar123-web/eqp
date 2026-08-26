'use client';

import { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import * as THREE from 'three';

// Category color mappings for 3D neon glow
const CATEGORY_COLORS = {
  sockets: { hex: 0x06b6d4, css: '#06b6d4', glow: 'rgba(6, 182, 212, 0.4)' }, // Cyan
  combination_wrenches: { hex: 0xf59e0b, css: '#f59e0b', glow: 'rgba(245, 158, 11, 0.4)' }, // Amber
  open_wrenches: { hex: 0xf97316, css: '#f97316', glow: 'rgba(249, 115, 22, 0.4)' }, // Orange
  torx_keys: { hex: 0x8b5cf6, css: '#8b5cf6', glow: 'rgba(139, 92, 246, 0.4)' }, // Purple
  hex_keys: { hex: 0x3b82f6, css: '#3b82f6', glow: 'rgba(59, 130, 246, 0.4)' }, // Blue
  screwdrivers: { hex: 0xec4899, css: '#ec4899', glow: 'rgba(236, 72, 153, 0.4)' }, // Pink
  snap_rings: { hex: 0x14b8a6, css: '#14b8a6', glow: 'rgba(20, 184, 166, 0.4)' }, // Teal
  files: { hex: 0xa855f7, css: '#a855f7', glow: 'rgba(168, 85, 247, 0.4)' }, // Violet
  ratchets_extensions: { hex: 0x10b981, css: '#10b981', glow: 'rgba(16, 185, 129, 0.4)' }, // Emerald
  pliers_cutters: { hex: 0xef4444, css: '#ef4444', glow: 'rgba(239, 68, 68, 0.4)' }, // Red
  hammers_saws: { hex: 0xe11d48, css: '#e11d48', glow: 'rgba(225, 29, 72, 0.4)' }, // Rose
  electrical_measuring: { hex: 0x6366f1, css: '#6366f1', glow: 'rgba(99, 102, 241, 0.4)' }, // Indigo
  storage: { hex: 0x64748b, css: '#64748b', glow: 'rgba(100, 116, 139, 0.4)' }, // Slate
  specialty_tools: { hex: 0x0ea5e9, css: '#0ea5e9', glow: 'rgba(14, 165, 233, 0.4)' }, // Sky
  general_tools: { hex: 0x94a3b8, css: '#94a3b8', glow: 'rgba(148, 163, 184, 0.4)' },
};

const STATUS_COLORS = {
  good: { hex: 0x22c55e, css: '#22c55e' }, // Green
  damaged: { hex: 0xeab308, css: '#eab308' }, // Yellow
  missing: { hex: 0xef4444, css: '#ef4444' }, // Red
  not_delivered: { hex: 0xa855f7, css: '#a855f7' }, // Purple
};

const THEMES = {
  cobalt: { name: 'Cobalt Blue', body: 0x1d4ed8, bodyHex: '#1d4ed8', lid: 0x1e40af, dark: 0x0f172a, chrome: 0xe2e8f0 },
  crimson: { name: 'Crimson Red', body: 0xdc2626, bodyHex: '#dc2626', lid: 0xb91c1c, dark: 0x18181b, chrome: 0xf1f5f9 },
  stealth: { name: 'Stealth Black', body: 0x1e293b, bodyHex: '#1e293b', lid: 0x0f172a, dark: 0x090d16, chrome: 0xf59e0b },
  dewalt: { name: 'Industrial Yellow', body: 0xeab308, bodyHex: '#eab308', lid: 0xca8a04, dark: 0x1e293b, chrome: 0x334155 },
  emerald: { name: 'Workshop Green', body: 0x059669, bodyHex: '#059669', lid: 0x047857, dark: 0x064e3b, chrome: 0xe2e8f0 },
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
  const [explosionDistance, setExplosionDistance] = useState(1.0);
  const [canvasError, setCanvasError] = useState(null);

  // References for three.js internal animation loop
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const animFrameIdRef = useRef(null);
  const controlsRef = useRef({
    isDragging: false,
    prevMousePos: { x: 0, y: 0 },
    rotation: { x: 0.35, y: -0.6 },
    targetRotation: { x: 0.35, y: -0.6 },
    distance: 14,
    targetDistance: 14,
    pan: { x: 0, y: 0.5 },
    targetPan: { x: 0, y: 0.5 },
  });

  // 3D Objects refs
  const toolboxPartsRef = useRef({
    base: null,
    lidLeft: null,
    lidRight: null,
    trayLeft: null,
    trayRight: null,
    latches: [],
    openProgress: isOpen ? 1 : 0,
    targetOpenProgress: isOpen ? 1 : 0,
  });

  const toolNodesRef = useRef([]);
  const raycasterRef = useRef(new THREE.Raycaster());
  const mousePosNormRef = useRef(new THREE.Vector2(-999, -999));

  // Filter tools based on search / category / status
  const filteredTools = useMemo(() => {
    return tools.filter((t) => {
      if (activeCategory !== 'ALL' && t.category !== activeCategory) return false;
      if (statusFilter !== 'ALL' && t.status !== statusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = (t.name || '').toLowerCase().includes(q);
        const matchEn = (t.nameEn || '').toLowerCase().includes(q);
        const matchCat = (t.categoryAr || '').toLowerCase().includes(q);
        const matchSpec = (t.specification || '').toLowerCase().includes(q);
        if (!matchName && !matchEn && !matchCat && !matchSpec) return false;
      }
      return true;
    });
  }, [tools, activeCategory, statusFilter, searchQuery]);

  // Update target open progress when prop changes
  useEffect(() => {
    toolboxPartsRef.current.targetOpenProgress = isOpen ? 1 : 0;
  }, [isOpen]);

  // Create sprite texture for tool node
  const createToolSprite = useCallback((tool) => {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');

    const catColor = CATEGORY_COLORS[tool.category]?.css || '#38bdf8';
    const statusColor = STATUS_COLORS[tool.status]?.css || '#22c55e';

    // Rounded card background
    ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
    ctx.strokeStyle = catColor;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.roundRect(6, 6, 244, 116, 16);
    ctx.fill();
    ctx.stroke();

    // Top Category Header bar
    ctx.fillStyle = catColor;
    ctx.beginPath();
    ctx.roundRect(6, 6, 244, 28, [16, 16, 0, 0]);
    ctx.fill();

    // Category Text
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText((tool.categoryEn || tool.categoryAr || '').toUpperCase().slice(0, 24), 128, 26);

    // Tool Name
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 18px sans-serif';
    ctx.textAlign = 'center';
    const cleanName = tool.name.length > 20 ? tool.name.slice(0, 18) + '..' : tool.name;
    ctx.fillText(cleanName, 128, 64);

    // Spec / English sub-label
    ctx.fillStyle = '#94a3b8';
    ctx.font = '13px sans-serif';
    const subText = tool.specification ? `Size: ${tool.specification}mm` : (tool.nameEn || '').slice(0, 22);
    ctx.fillText(subText, 128, 86);

    // Status indicator pill
    ctx.fillStyle = statusColor;
    ctx.beginPath();
    ctx.roundRect(16, 96, 12, 12, 6);
    ctx.fill();

    ctx.fillStyle = '#cbd5e1';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(tool.statusLabelEn || 'Operational', 34, 107);

    // Quantity pill on right
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    ctx.beginPath();
    ctx.roundRect(188, 94, 52, 20, 10);
    ctx.fill();
    ctx.fillStyle = '#f8fafc';
    ctx.textAlign = 'center';
    ctx.fillText(`QTY: ${tool.quantity}`, 214, 108);

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    return texture;
  }, []);

  // Initialize Three.js Scene
  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;
    const width = container.clientWidth || 800;
    const height = container.clientHeight || 550;

    // 1. Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0f1d);
    scene.fog = new THREE.FogExp2(0x0a0f1d, 0.025);
    sceneRef.current = scene;

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 6, 14);
    cameraRef.current = camera;

    // 3. Renderer
    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.1;
      container.replaceChildren(renderer.domElement);
      rendererRef.current = renderer;
    } catch (e) {
      setCanvasError('WebGL is not supported or encountered an error.');
      return;
    }

    // 4. Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 2.5);
    keyLight.position.set(8, 16, 12);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 2048;
    keyLight.shadow.mapSize.height = 2048;
    keyLight.shadow.bias = -0.0001;
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0x38bdf8, 1.2);
    fillLight.position.set(-10, 8, -6);
    scene.add(fillLight);

    const rimLight = new THREE.PointLight(0xa855f7, 2.0, 20);
    rimLight.position.set(0, 10, -8);
    scene.add(rimLight);

    // 5. Studio Workbench Floor
    const gridHelper = new THREE.GridHelper(30, 30, 0x1e293b, 0x0f172a);
    gridHelper.position.y = -2.0;
    scene.add(gridHelper);

    const floorGeo = new THREE.PlaneGeometry(50, 50);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x070b14,
      roughness: 0.85,
      metalness: 0.2,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -2.01;
    floor.receiveShadow = true;
    scene.add(floor);

    // Glowing stage circle
    const ringGeo = new THREE.RingGeometry(4.2, 4.35, 64);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, side: THREE.DoubleSide });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = -1.99;
    scene.add(ring);

    // 6. Build Procedural 3D Cantilever Toolbox Model
    const currentTheme = THEMES[themeKey] || THEMES.cobalt;
    const toolboxGroup = new THREE.Group();
    toolboxGroup.position.y = -1.0;
    scene.add(toolboxGroup);

    // Materials
    const bodyMat = new THREE.MeshStandardMaterial({
      color: currentTheme.body,
      roughness: 0.35,
      metalness: 0.75,
    });
    const interiorMat = new THREE.MeshStandardMaterial({
      color: currentTheme.dark,
      roughness: 0.7,
      metalness: 0.4,
    });
    const chromeMat = new THREE.MeshStandardMaterial({
      color: currentTheme.chrome,
      roughness: 0.15,
      metalness: 0.95,
    });
    const rubberMat = new THREE.MeshStandardMaterial({
      color: 0x09090b,
      roughness: 0.9,
    });
    const goldMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      roughness: 0.2,
      metalness: 0.9,
    });

    // --- Bottom Tub Base ---
    const baseGeo = new THREE.BoxGeometry(5.4, 2.0, 2.8);
    const baseMesh = new THREE.Mesh(baseGeo, bodyMat);
    baseMesh.castShadow = true;
    baseMesh.receiveShadow = true;
    baseMesh.position.y = 0;
    toolboxGroup.add(baseMesh);

    // Rubber Feet
    const footGeo = new THREE.CylinderGeometry(0.2, 0.25, 0.15, 16);
    [
      [-2.4, -1.05, -1.1],
      [2.4, -1.05, -1.1],
      [-2.4, -1.05, 1.1],
      [2.4, -1.05, 1.1],
    ].forEach(([x, y, z]) => {
      const foot = new THREE.Mesh(footGeo, rubberMat);
      foot.position.set(x, y, z);
      toolboxGroup.add(foot);
    });

    // Side Handles
    const sideHandleGeo = new THREE.TorusGeometry(0.35, 0.08, 12, 24, Math.PI);
    const handleL = new THREE.Mesh(sideHandleGeo, chromeMat);
    handleL.position.set(-2.75, 0.2, 0);
    handleL.rotation.y = -Math.PI / 2;
    handleL.rotation.z = Math.PI / 2;
    toolboxGroup.add(handleL);

    const handleR = new THREE.Mesh(sideHandleGeo, chromeMat);
    handleR.position.set(2.75, 0.2, 0);
    handleR.rotation.y = Math.PI / 2;
    handleR.rotation.z = Math.PI / 2;
    toolboxGroup.add(handleR);

    // Front Metal Nameplate
    const plateGeo = new THREE.BoxGeometry(2.4, 0.6, 0.05);
    const plateMesh = new THREE.Mesh(plateGeo, goldMat);
    plateMesh.position.set(0, 0.2, 1.43);
    toolboxGroup.add(plateMesh);

    // --- Left Cantilever Upper Tray ---
    const trayGeo = new THREE.BoxGeometry(2.4, 0.7, 2.6);
    const trayLeft = new THREE.Mesh(trayGeo, interiorMat);
    trayLeft.position.set(-1.25, 0.6, 0);
    trayLeft.castShadow = true;
    toolboxGroup.add(trayLeft);

    // Tray Left Dividers
    const divGeo = new THREE.BoxGeometry(0.06, 0.6, 2.5);
    [-0.6, 0, 0.6].forEach((dx) => {
      const div = new THREE.Mesh(divGeo, bodyMat);
      div.position.set(dx, 0.05, 0);
      trayLeft.add(div);
    });

    // --- Right Cantilever Upper Tray ---
    const trayRight = new THREE.Mesh(trayGeo, interiorMat);
    trayRight.position.set(1.25, 0.6, 0);
    trayRight.castShadow = true;
    toolboxGroup.add(trayRight);

    // Tray Right Dividers
    [-0.6, 0, 0.6].forEach((dx) => {
      const div = new THREE.Mesh(divGeo, bodyMat);
      div.position.set(dx, 0.05, 0);
      trayRight.add(div);
    });

    // --- Dual Top Lids with Pivot Hinges ---
    // Left Lid Pivot
    const pivotL = new THREE.Group();
    pivotL.position.set(-2.7, 1.0, 0);
    toolboxGroup.add(pivotL);

    const lidGeo = new THREE.BoxGeometry(2.7, 0.35, 2.84);
    const lidL = new THREE.Mesh(lidGeo, bodyMat);
    lidL.position.set(1.35, 0.175, 0);
    lidL.castShadow = true;
    pivotL.add(lidL);

    // Right Lid Pivot
    const pivotR = new THREE.Group();
    pivotR.position.set(2.7, 1.0, 0);
    toolboxGroup.add(pivotR);

    const lidR = new THREE.Mesh(lidGeo, bodyMat);
    lidR.position.set(-1.35, 0.175, 0);
    lidR.castShadow = true;
    pivotR.add(lidR);

    // Top Center Carry Handle (on right lid)
    const topHandleGeo = new THREE.CylinderGeometry(0.12, 0.12, 2.2, 16);
    const topHandle = new THREE.Mesh(topHandleGeo, chromeMat);
    topHandle.rotation.z = Math.PI / 2;
    topHandle.position.set(-1.35, 0.6, 0);
    pivotR.add(topHandle);

    // Latches
    const latchGeo = new THREE.BoxGeometry(0.2, 0.4, 0.1);
    const latch1 = new THREE.Mesh(latchGeo, chromeMat);
    latch1.position.set(-1.2, 0.85, 1.45);
    toolboxGroup.add(latch1);

    const latch2 = new THREE.Mesh(latchGeo, chromeMat);
    latch2.position.set(1.2, 0.85, 1.45);
    toolboxGroup.add(latch2);

    toolboxPartsRef.current = {
      base: baseMesh,
      lidLeft: pivotL,
      lidRight: pivotR,
      trayLeft,
      trayRight,
      latches: [latch1, latch2],
      openProgress: isOpen ? 1 : 0,
      targetOpenProgress: isOpen ? 1 : 0,
    };

    // 7. Mouse and Touch Interaction Handlers
    const onPointerDown = (e) => {
      controlsRef.current.isDragging = true;
      controlsRef.current.prevMousePos = { x: e.clientX, y: e.clientY };
    };

    const onPointerMove = (e) => {
      const rect = container.getBoundingClientRect();
      mousePosNormRef.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mousePosNormRef.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      if (!controlsRef.current.isDragging) return;
      const deltaX = e.clientX - controlsRef.current.prevMousePos.x;
      const deltaY = e.clientY - controlsRef.current.prevMousePos.y;

      controlsRef.current.targetRotation.y += deltaX * 0.008;
      controlsRef.current.targetRotation.x = Math.max(
        0.05,
        Math.min(Math.PI / 2 - 0.05, controlsRef.current.targetRotation.x + deltaY * 0.008)
      );

      controlsRef.current.prevMousePos = { x: e.clientX, y: e.clientY };
    };

    const onPointerUp = () => {
      controlsRef.current.isDragging = false;
    };

    const onWheel = (e) => {
      e.preventDefault();
      controlsRef.current.targetDistance = Math.max(
        6,
        Math.min(26, controlsRef.current.targetDistance + e.deltaY * 0.015)
      );
    };

    const onClick = (e) => {
      // Raycasting for tools
      if (!cameraRef.current || !sceneRef.current) return;
      raycasterRef.current.setFromCamera(mousePosNormRef.current, cameraRef.current);
      const meshes = toolNodesRef.current.map((n) => n.mesh);
      const intersects = raycasterRef.current.intersectObjects(meshes, true);

      if (intersects.length > 0) {
        const hit = intersects[0];
        let parent = hit.object;
        while (parent && !parent.userData.tool && parent.parent) {
          parent = parent.parent;
        }
        if (parent?.userData?.tool) {
          const tool = parent.userData.tool;
          if (onSelectTool) onSelectTool(tool);
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
      const newW = container.clientWidth;
      const newH = container.clientHeight;
      cameraRef.current.aspect = newW / newH;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(newW, newH);
    };
    window.addEventListener('resize', onResize);

    // 9. Animation Loop
    let clock = new THREE.Clock();

    const animate = () => {
      animFrameIdRef.current = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const elapsed = clock.getElapsedTime();

      // Smooth camera orbit lerping
      const ctrl = controlsRef.current;
      if (autoRotate && !ctrl.isDragging) {
        ctrl.targetRotation.y += delta * 0.35;
      }

      ctrl.rotation.x += (ctrl.targetRotation.x - ctrl.rotation.x) * 0.1;
      ctrl.rotation.y += (ctrl.targetRotation.y - ctrl.rotation.y) * 0.1;
      ctrl.distance += (ctrl.targetDistance - ctrl.distance) * 0.1;
      ctrl.pan.x += (ctrl.targetPan.x - ctrl.pan.x) * 0.1;
      ctrl.pan.y += (ctrl.targetPan.y - ctrl.pan.y) * 0.1;

      const camX = ctrl.distance * Math.sin(ctrl.rotation.y) * Math.cos(ctrl.rotation.x) + ctrl.pan.x;
      const camY = ctrl.distance * Math.sin(ctrl.rotation.x) + ctrl.pan.y;
      const camZ = ctrl.distance * Math.cos(ctrl.rotation.y) * Math.cos(ctrl.rotation.x);

      camera.position.set(camX, camY, camZ);
      camera.lookAt(ctrl.pan.x, ctrl.pan.y, 0);

      // Smooth Toolbox Opening / Closing Animation
      const parts = toolboxPartsRef.current;
      parts.openProgress += (parts.targetOpenProgress - parts.openProgress) * 0.08;
      const op = parts.openProgress;

      // Lid rotation (-115 deg)
      if (parts.lidLeft) parts.lidLeft.rotation.z = op * (Math.PI * 0.65);
      if (parts.lidRight) parts.lidRight.rotation.z = -op * (Math.PI * 0.65);

      // Cantilever Tray slide out laterally
      if (parts.trayLeft) {
        parts.trayLeft.position.x = -1.25 - op * 1.5;
        parts.trayLeft.position.y = 0.6 + op * 0.4;
      }
      if (parts.trayRight) {
        parts.trayRight.position.x = 1.25 + op * 1.5;
        parts.trayRight.position.y = 0.6 + op * 0.4;
      }

      // Latches drop
      if (parts.latches) {
        parts.latches.forEach((l) => {
          l.rotation.x = op * Math.PI * 0.4;
        });
      }

      // Floating Tools Physics & Animation
      toolNodesRef.current.forEach((node, i) => {
        const { group, basePos, orbitRadius, orbitAngle, orbitHeight, phase } = node;

        if (op < 0.05) {
          // Collapsed inside box
          group.scale.setScalar(0.001);
          group.position.set(0, 0, 0);
        } else {
          // Dynamic Floating Galaxy
          const wave = Math.sin(elapsed * 2.0 + phase) * 0.25;
          const rotWave = Math.sin(elapsed * 1.2 + phase) * 0.15;

          const targetX = basePos.x * op * explosionDistance;
          const targetY = (basePos.y + wave) * op * explosionDistance;
          const targetZ = basePos.z * op * explosionDistance;

          group.position.x += (targetX - group.position.x) * 0.1;
          group.position.y += (targetY - group.position.y) * 0.1;
          group.position.z += (targetZ - group.position.z) * 0.1;

          group.scale.setScalar(Math.min(1.0, op * 1.1));

          // Billboarding: Tool Sprite faces camera
          group.quaternion.copy(camera.quaternion);
        }
      });

      // Hover Raycasting
      raycasterRef.current.setFromCamera(mousePosNormRef.current, camera);
      const meshes = toolNodesRef.current.map((n) => n.mesh);
      const intersects = raycasterRef.current.intersectObjects(meshes, true);

      if (intersects.length > 0) {
        let parent = intersects[0].object;
        while (parent && !parent.userData.tool && parent.parent) {
          parent = parent.parent;
        }
        if (parent?.userData?.tool) {
          setHoveredTool(parent.userData.tool);
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
      cancelAnimationFrame(animFrameIdRef.current);
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
  }, [themeKey, autoRotate, explosionDistance, isOpen, onSelectTool]);

  // Re-generate floating tool 3D nodes when filteredTools changes
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
    const maxNodes = Math.min(filteredTools.length, 64);
    const stepAngle = (Math.PI * 2) / Math.max(1, maxNodes);

    filteredTools.slice(0, maxNodes).forEach((tool, idx) => {
      const group = new THREE.Group();

      // Calculate 3D Orbital Coordinates
      const tier = idx % 4; // 4 vertical tiers
      const ringRadius = 4.2 + (tier % 2) * 2.2 + (idx % 3) * 0.8;
      const angle = idx * stepAngle + (tier * 0.4);
      const height = 1.2 + tier * 1.5 + (idx % 2) * 0.4;

      const posX = Math.cos(angle) * ringRadius;
      const posY = height;
      const posZ = Math.sin(angle) * ringRadius;

      // Sprite Plane Mesh
      const texture = createToolSprite(tool);
      const spriteGeo = new THREE.PlaneGeometry(1.8, 0.9);
      const spriteMat = new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        side: THREE.DoubleSide,
        depthWrite: false,
      });

      const spriteMesh = new THREE.Mesh(spriteGeo, spriteMat);
      spriteMesh.userData = { tool };
      group.add(spriteMesh);

      // Glowing Neon Ring Base
      const catHex = CATEGORY_COLORS[tool.category]?.hex || 0x38bdf8;
      const auraGeo = new THREE.RingGeometry(0.9, 0.98, 32);
      const auraMat = new THREE.MeshBasicMaterial({
        color: catHex,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.6,
      });
      const aura = new THREE.Mesh(auraGeo, auraMat);
      aura.position.z = -0.02;
      group.add(aura);

      // Initial position
      group.position.set(posX, posY, posZ);
      group.userData = { tool };
      scene.add(group);

      toolNodesRef.current.push({
        group,
        mesh: spriteMesh,
        tool,
        basePos: new THREE.Vector3(posX, posY, posZ),
        orbitRadius: ringRadius,
        orbitAngle: angle,
        orbitHeight: height,
        phase: (idx * 0.5) % (Math.PI * 2),
      });
    });
  }, [filteredTools, createToolSprite]);

  // Preset Camera Angles
  const setCameraPreset = (preset) => {
    const ctrl = controlsRef.current;
    if (preset === 'front') {
      ctrl.targetRotation = { x: 0.15, y: 0 };
      ctrl.targetDistance = 11;
      ctrl.targetPan = { x: 0, y: 0.2 };
    } else if (preset === 'iso') {
      ctrl.targetRotation = { x: 0.45, y: -0.65 };
      ctrl.targetDistance = 13;
      ctrl.targetPan = { x: 0, y: 0.5 };
    } else if (preset === 'top') {
      ctrl.targetRotation = { x: 1.35, y: 0 };
      ctrl.targetDistance = 14;
      ctrl.targetPan = { x: 0, y: 0 };
    } else if (preset === 'orbit') {
      ctrl.targetRotation = { x: 0.3, y: -0.9 };
      ctrl.targetDistance = 17;
      ctrl.targetPan = { x: 0, y: 1.5 };
    }
  };

  return (
    <div className="relative w-full h-full min-h-[520px] bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 rounded-2xl overflow-hidden border border-slate-800 shadow-2xl">
      {/* 3D WebGL Canvas Mount */}
      <div ref={mountRef} className="w-full h-full min-h-[520px]" />

      {/* Top Floating Overlay - HUD Controls */}
      <div className="absolute top-4 left-4 right-4 flex flex-wrap items-center justify-between gap-3 pointer-events-none">
        {/* Left: Technician Info Badge */}
        <div className="flex items-center gap-3 bg-slate-900/85 backdrop-blur-md px-4 py-2.5 rounded-xl border border-slate-700/60 shadow-lg pointer-events-auto">
          <div className="w-9 h-9 rounded-lg bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-400 font-bold text-base">
            🧰
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-white font-bold text-sm">{technician?.name || 'Technician Toolbox'}</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-medium">
                {technician?.stats?.operationalRate || 100}% Ready
              </span>
            </div>
            <span className="text-xs text-slate-400">{technician?.nameEn} • {technician?.stats?.totalQuantity || 0} Total Tools</span>
          </div>
        </div>

        {/* Right: 3D Interaction Control Hub */}
        <div className="flex items-center gap-2 bg-slate-900/85 backdrop-blur-md p-1.5 rounded-xl border border-slate-700/60 shadow-lg pointer-events-auto">
          <button
            onClick={onToggleOpen}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              isOpen
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/30'
                : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
            }`}
          >
            {isOpen ? '🔓 Opened (Exploded)' : '🔒 Closed'}
          </button>

          <button
            onClick={() => setAutoRotate(!autoRotate)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              autoRotate ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            🔄 {autoRotate ? 'Rotating' : 'Auto Rotate'}
          </button>

          <div className="h-5 w-px bg-slate-700 mx-0.5" />

          {/* Camera Angles */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCameraPreset('iso')}
              className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all"
              title="Isometric View"
            >
              Isometric
            </button>
            <button
              onClick={() => setCameraPreset('front')}
              className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all"
              title="Front View"
            >
              Front
            </button>
            <button
              onClick={() => setCameraPreset('top')}
              className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all"
              title="Top View"
            >
              Top-Down
            </button>
            <button
              onClick={() => setCameraPreset('orbit')}
              className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all"
              title="Floating Orbit Cloud"
            >
              Orbit Cloud
            </button>
          </div>
        </div>
      </div>

      {/* Floating Tools Density Slider */}
      <div className="absolute bottom-4 left-4 flex items-center gap-3 bg-slate-900/85 backdrop-blur-md px-3.5 py-2 rounded-xl border border-slate-700/60 shadow-lg pointer-events-auto">
        <span className="text-xs font-medium text-slate-400">Floating Explosion:</span>
        <input
          type="range"
          min="0.5"
          max="2.0"
          step="0.1"
          value={explosionDistance}
          onChange={(e) => setExplosionDistance(parseFloat(e.target.value))}
          className="w-24 h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-400"
        />
        <span className="text-xs text-cyan-400 font-mono font-bold">{Math.round(explosionDistance * 100)}%</span>
      </div>

      {/* Hovered Tool Quick HUD Card */}
      {hoveredTool && (
        <div className="absolute bottom-4 right-4 max-w-sm bg-slate-900/95 backdrop-blur-xl p-4 rounded-xl border border-cyan-500/50 shadow-2xl shadow-cyan-500/20 animate-in fade-in slide-in-from-bottom-2 duration-150 pointer-events-auto">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: STATUS_COLORS[hoveredTool.status]?.css }}
                />
                <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider">
                  {hoveredTool.categoryEn || hoveredTool.categoryAr}
                </span>
              </div>
              <h4 className="text-white font-bold text-base leading-snug">{hoveredTool.name}</h4>
              <p className="text-xs text-slate-300 mt-0.5">{hoveredTool.nameEn}</p>
            </div>
            <span className="px-2 py-1 rounded-md bg-slate-800 border border-slate-700 text-xs text-slate-200 font-mono">
              Qty: {hoveredTool.quantity}
            </span>
          </div>

          <div className="mt-3 pt-2.5 border-t border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-400">
              Spec: <strong className="text-slate-200">{hoveredTool.specification ? `${hoveredTool.specification}mm` : 'Standard'}</strong>
            </span>
            <button
              onClick={() => onSelectTool && onSelectTool(hoveredTool)}
              className="text-cyan-400 hover:text-cyan-300 font-bold flex items-center gap-1"
            >
              Inspect Details →
            </button>
          </div>
        </div>
      )}

      {/* Error Fallback */}
      {canvasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-950/90 text-center p-6">
          <div className="max-w-md bg-slate-900 p-6 rounded-2xl border border-red-500/30">
            <div className="text-3xl mb-2">⚠️</div>
            <h3 className="text-white font-bold text-lg mb-1">3D View Notice</h3>
            <p className="text-slate-400 text-sm mb-4">{canvasError}</p>
            <p className="text-xs text-slate-500">You can still use the 2.5D Tray Organizer and Inventory views.</p>
          </div>
        </div>
      )}
    </div>
  );
}
