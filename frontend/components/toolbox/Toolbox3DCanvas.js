'use client';

import { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import * as THREE from 'three';
import { buildRealisticToolModel } from './proceduralTools';

const STATUS_COLORS = {
  good: { hex: 0x10b981, css: '#10b981', label: 'Operational' },
  damaged: { hex: 0xf59e0b, css: '#f59e0b', label: 'Damaged' },
  missing: { hex: 0xef4444, css: '#ef4444', label: 'Missing' },
  not_delivered: { hex: 0x8b5cf6, css: '#8b5cf6', label: 'Pending' },
};

const TOOLBOX_THEMES = {
  cobalt: {
    name: 'Cobalt Pro Blue',
    body: 0x1e3a8a,
    lid: 0x172554,
    tray: 0x0f172a,
    metalness: 0.8,
    roughness: 0.3,
  },
  crimson: {
    name: 'Crimson Red',
    body: 0xb91c1c,
    lid: 0x7f1d1d,
    tray: 0x18181b,
    metalness: 0.8,
    roughness: 0.3,
  },
  stealth: {
    name: 'Stealth Black',
    body: 0x18181b,
    lid: 0x09090b,
    tray: 0x27272a,
    metalness: 0.85,
    roughness: 0.25,
  },
  dewalt: {
    name: 'Industrial Yellow',
    body: 0xca8a04,
    lid: 0xa16207,
    tray: 0x1e293b,
    metalness: 0.75,
    roughness: 0.35,
  },
  emerald: {
    name: 'Titanium Green',
    body: 0x047857,
    lid: 0x064e3b,
    tray: 0x0f172a,
    metalness: 0.8,
    roughness: 0.3,
  },
};

export default function Toolbox3DCanvas({
  technician,
  tools = [],
  selectedTool = null,
  onSelectTool,
  activeCategory = 'ALL',
  activeDrawer = 'ALL',
  statusFilter = 'ALL',
  searchQuery = '',
  themeKey = 'cobalt',
  onResetCameraRef,
  onToggleExplodeRef,
}) {
  const mountRef = useRef(null);
  const [hoveredTool, setHoveredTool] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ x: -999, y: -999 });
  const [explodePreset, setExplodePreset] = useState('inspection'); // 'closed' | 'slight' | 'inspection' | 'exploded'
  const [explodeValue, setExplodeValue] = useState(0.5); // 0.0 -> 1.0
  const [activeCameraPreset, setActiveCameraPreset] = useState('iso');

  // Stable Refs
  const selectedToolRef = useRef(selectedTool);
  const onSelectToolRef = useRef(onSelectTool);
  const explodeValueRef = useRef(explodeValue);
  const lastHoveredIdRef = useRef(null);

  useEffect(() => {
    selectedToolRef.current = selectedTool;
  }, [selectedTool]);

  useEffect(() => {
    onSelectToolRef.current = onSelectTool;
  }, [onSelectTool]);

  useEffect(() => {
    explodeValueRef.current = explodeValue;
    if (partsRef.current) {
      partsRef.current.targetOpenProgress = explodeValue;
    }
  }, [explodeValue]);

  // Three.js References
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const animFrameRef = useRef(null);
  const toolNodesRef = useRef([]);
  const raycasterRef = useRef(new THREE.Raycaster());
  const mousePosRef = useRef(new THREE.Vector2(-999, -999));

  // Camera Controller State
  const controlsRef = useRef({
    isDragging: false,
    prevMousePos: { x: 0, y: 0 },
    rotation: { x: 0.45, y: -0.65 },
    targetRotation: { x: 0.45, y: -0.65 },
    distance: 14.5,
    targetDistance: 14.5,
    pan: { x: 0, y: 0.4 },
    targetPan: { x: 0, y: 0.4 },
  });

  // Toolbox Mechanism Parts
  const partsRef = useRef({
    chassis: null,
    lidLeftPivot: null,
    lidRightPivot: null,
    trayLeft: null,
    trayRight: null,
    latches: [],
    openProgress: 0.5,
    targetOpenProgress: 0.5,
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

  // Set Explode Preset
  const handleSetExplodePreset = useCallback((preset) => {
    setExplodePreset(preset);
    if (preset === 'closed') setExplodeValue(0.0);
    else if (preset === 'slight') setExplodeValue(0.25);
    else if (preset === 'inspection') setExplodeValue(0.5);
    else if (preset === 'exploded') setExplodeValue(1.0);
  }, []);

  // Camera presets
  const handleSetCameraPreset = useCallback((preset) => {
    setActiveCameraPreset(preset);
    const ctrl = controlsRef.current;
    if (preset === 'front') {
      ctrl.targetRotation = { x: 0.15, y: 0 };
      ctrl.targetDistance = 12.0;
      ctrl.targetPan = { x: 0, y: 0.3 };
    } else if (preset === 'iso') {
      ctrl.targetRotation = { x: 0.45, y: -0.65 };
      ctrl.targetDistance = 14.5;
      ctrl.targetPan = { x: 0, y: 0.4 };
    } else if (preset === 'top') {
      ctrl.targetRotation = { x: 1.45, y: 0 };
      ctrl.targetDistance = 15.0;
      ctrl.targetPan = { x: 0, y: 0 };
    }
  }, []);

  // Focus selected tool
  const focusTool = useCallback((tool) => {
    if (!tool) return;
    const node = toolNodesRef.current.find((n) => n.tool.id === tool.id);
    if (node) {
      const ctrl = controlsRef.current;
      ctrl.targetPan = {
        x: node.group.position.x * 0.6,
        y: node.group.position.y * 0.6 + 0.3,
      };
      ctrl.targetDistance = 10.0;
    }
  }, []);

  useEffect(() => {
    if (selectedTool) {
      focusTool(selectedTool);
    }
  }, [selectedTool, focusTool]);

  // Expose reset & explode handlers
  useEffect(() => {
    if (onResetCameraRef) onResetCameraRef.current = () => handleSetCameraPreset('iso');
    if (onToggleExplodeRef) {
      onToggleExplodeRef.current = () => {
        setExplodeValue((v) => (v > 0.3 ? 0.0 : 0.5));
      };
    }
  }, [onResetCameraRef, onToggleExplodeRef, handleSetCameraPreset]);

  // Keyboard Shortcuts Listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;

      if (e.key === 'r' || e.key === 'R') {
        handleSetCameraPreset('iso');
      } else if (e.key === 'f' || e.key === 'F') {
        if (selectedToolRef.current) focusTool(selectedToolRef.current);
      } else if (e.key === 'e' || e.key === 'E') {
        setExplodeValue((v) => (v > 0.3 ? 0.0 : 0.5));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [focusTool, handleSetCameraPreset]);

  // 1. Initialize WebGL Three.js Engine (Runs ONLY ONCE per theme)
  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;
    const width = container.clientWidth || 800;
    const height = container.clientHeight || 560;

    // Clean previous children if any
    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }

    // 1. Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x070c18);
    scene.fog = new THREE.FogExp2(0x070c18, 0.018);
    sceneRef.current = scene;

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    camera.position.set(0, 5.5, 14.5);
    cameraRef.current = camera;

    // 3. WebGL Renderer
    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: false,
        powerPreference: 'high-performance',
      });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.2;
      container.appendChild(renderer.domElement);
      rendererRef.current = renderer;
    } catch (e) {
      console.error('WebGL Initialization Error:', e);
      return;
    }

    // 4. Studio Lighting Design
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.8);
    scene.add(ambientLight);

    const mainKeyLight = new THREE.DirectionalLight(0xffffff, 2.8);
    mainKeyLight.position.set(10, 18, 12);
    mainKeyLight.castShadow = true;
    mainKeyLight.shadow.mapSize.width = 2048;
    mainKeyLight.shadow.mapSize.height = 2048;
    scene.add(mainKeyLight);

    const cyanRim = new THREE.PointLight(0x06b6d4, 3.0, 25);
    cyanRim.position.set(-9, 7, -6);
    scene.add(cyanRim);

    const amberFill = new THREE.DirectionalLight(0xf59e0b, 1.1);
    amberFill.position.set(8, -2, -8);
    scene.add(amberFill);

    // 5. Studio Floor Grid
    const floorGeo = new THREE.PlaneGeometry(60, 60);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x050811,
      roughness: 0.9,
      metalness: 0.1,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -2.1;
    floor.receiveShadow = true;
    scene.add(floor);

    const grid = new THREE.GridHelper(32, 32, 0x1e293b, 0x0b1329);
    grid.position.y = -2.09;
    scene.add(grid);

    // 6. Build Cantilever Steel Toolbox Model
    const currentTheme = TOOLBOX_THEMES[themeKey] || TOOLBOX_THEMES.cobalt;
    const toolboxRoot = new THREE.Group();
    toolboxRoot.position.y = -1.0;
    scene.add(toolboxRoot);

    const bodyMat = new THREE.MeshStandardMaterial({
      color: currentTheme.body,
      metalness: currentTheme.metalness,
      roughness: currentTheme.roughness,
    });

    const trayMat = new THREE.MeshStandardMaterial({
      color: currentTheme.tray,
      metalness: 0.3,
      roughness: 0.7,
    });

    const chromeMat = new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      metalness: 0.95,
      roughness: 0.12,
    });

    const rubberMat = new THREE.MeshStandardMaterial({
      color: 0x0a0a0c,
      roughness: 0.9,
    });

    const goldMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      metalness: 0.9,
      roughness: 0.2,
    });

    // Tub Chassis
    const tubGeo = new THREE.BoxGeometry(5.8, 2.1, 2.9);
    const tub = new THREE.Mesh(tubGeo, bodyMat);
    tub.castShadow = true;
    tub.receiveShadow = true;
    toolboxRoot.add(tub);

    // Corner Bumpers
    const bumperGeo = new THREE.BoxGeometry(0.3, 2.15, 0.3);
    [
      [-2.85, 0, -1.4],
      [2.85, 0, -1.4],
      [-2.85, 0, 1.4],
      [2.85, 0, 1.4],
    ].forEach(([x, y, z]) => {
      const b = new THREE.Mesh(bumperGeo, rubberMat);
      b.position.set(x, y, z);
      toolboxRoot.add(b);
    });

    // Rubber Feet
    const footGeo = new THREE.CylinderGeometry(0.24, 0.3, 0.18, 16);
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

    // Technician Engraved Brass Plate
    const plateGeo = new THREE.BoxGeometry(2.6, 0.65, 0.06);
    const plate = new THREE.Mesh(plateGeo, goldMat);
    plate.position.set(0, 0.2, 1.48);
    toolboxRoot.add(plate);

    // Left Cantilever Tray
    const trayGeo = new THREE.BoxGeometry(2.5, 0.75, 2.7);
    const trayLeft = new THREE.Mesh(trayGeo, trayMat);
    trayLeft.position.set(-1.3, 0.65, 0);
    trayLeft.castShadow = true;
    toolboxRoot.add(trayLeft);

    // Socket Rail Inserts on Left Tray
    [-0.7, 0, 0.7].forEach((dx) => {
      const railGeo = new THREE.BoxGeometry(0.12, 0.65, 2.5);
      const rail = new THREE.Mesh(railGeo, bodyMat);
      rail.position.set(dx, 0.05, 0);
      trayLeft.add(rail);
    });

    // Right Cantilever Tray
    const trayRight = new THREE.Mesh(trayGeo, trayMat);
    trayRight.position.set(1.3, 0.65, 0);
    trayRight.castShadow = true;
    toolboxRoot.add(trayRight);

    [-0.7, 0, 0.7].forEach((dx) => {
      const railGeo = new THREE.BoxGeometry(0.12, 0.65, 2.5);
      const rail = new THREE.Mesh(railGeo, bodyMat);
      rail.position.set(dx, 0.05, 0);
      trayRight.add(rail);
    });

    // Scissor Arms (Cantilever Linkages)
    const armGeo = new THREE.BoxGeometry(0.08, 1.4, 0.08);
    const armL = new THREE.Mesh(armGeo, chromeMat);
    armL.position.set(-2.7, 0.4, 1.4);
    toolboxRoot.add(armL);

    const armR = new THREE.Mesh(armGeo, chromeMat);
    armR.position.set(2.7, 0.4, 1.4);
    toolboxRoot.add(armR);

    // Dual Top Lids
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

    // Aluminum Handle
    const handleGeo = new THREE.CylinderGeometry(0.14, 0.14, 2.4, 16);
    const handle = new THREE.Mesh(handleGeo, chromeMat);
    handle.rotation.z = Math.PI / 2;
    handle.position.set(-1.4, 0.68, 0);
    lidRightPivot.add(handle);

    // Chrome Latches
    const latchGeo = new THREE.BoxGeometry(0.24, 0.45, 0.12);
    const latch1 = new THREE.Mesh(latchGeo, chromeMat);
    latch1.position.set(-1.3, 0.9, 1.5);
    toolboxRoot.add(latch1);

    const latch2 = new THREE.Mesh(latchGeo, chromeMat);
    latch2.position.set(1.3, 0.9, 1.5);
    toolboxRoot.add(latch2);

    partsRef.current = {
      chassis: tub,
      lidLeftPivot,
      lidRightPivot,
      trayLeft,
      trayRight,
      latches: [latch1, latch2],
      openProgress: explodeValueRef.current,
      targetOpenProgress: explodeValueRef.current,
    };

    // 7. Mouse / Pointer Controls
    const onPointerDown = (e) => {
      controlsRef.current.isDragging = true;
      controlsRef.current.prevMousePos = { x: e.clientX, y: e.clientY };
    };

    const onPointerMove = (e) => {
      const rect = container.getBoundingClientRect();
      const mouseX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const mouseY = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      mousePosRef.current.x = mouseX;
      mousePosRef.current.y = mouseY;

      setTooltipPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });

      if (!controlsRef.current.isDragging) return;
      const deltaX = e.clientX - controlsRef.current.prevMousePos.x;
      const deltaY = e.clientY - controlsRef.current.prevMousePos.y;

      controlsRef.current.targetRotation.y += deltaX * 0.006;
      controlsRef.current.targetRotation.x = Math.max(
        0.05,
        Math.min(Math.PI / 2 - 0.05, controlsRef.current.targetRotation.x + deltaY * 0.006)
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
      const interactiveObjects = toolNodesRef.current.map((n) => n.group);
      const intersects = raycasterRef.current.intersectObjects(interactiveObjects, true);

      if (intersects.length > 0) {
        let obj = intersects[0].object;
        while (obj && !obj.userData.tool && obj.parent) {
          obj = obj.parent;
        }
        if (obj?.userData?.tool) {
          const tool = obj.userData.tool;
          if (onSelectToolRef.current) {
            onSelectToolRef.current(tool);
          }
        }
      }
    };

    container.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    container.addEventListener('wheel', onWheel, { passive: false });
    container.addEventListener('click', onClick);

    // 8. ResizeObserver
    const resizeObserver = new ResizeObserver(() => {
      if (!container || !rendererRef.current || !cameraRef.current) return;
      const w = container.clientWidth || 800;
      const h = container.clientHeight || 560;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    });
    resizeObserver.observe(container);

    // 9. Continuous Animation Loop
    let clock = new THREE.Clock();

    const animate = () => {
      animFrameRef.current = requestAnimationFrame(animate);
      const delta = clock.getDelta();

      // Camera lerp
      const ctrl = controlsRef.current;
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

      // Toolbox Mechanics Lerp
      const p = partsRef.current;
      p.openProgress += (p.targetOpenProgress - p.openProgress) * 0.07;
      const op = p.openProgress;

      if (p.lidLeftPivot) p.lidLeftPivot.rotation.z = op * (Math.PI * 0.64);
      if (p.lidRightPivot) p.lidRightPivot.rotation.z = -op * (Math.PI * 0.64);

      if (p.trayLeft) {
        p.trayLeft.position.x = -1.3 - op * 1.55;
        p.trayLeft.position.y = 0.65 + op * 0.45;
      }
      if (p.trayRight) {
        p.trayRight.position.x = 1.3 + op * 1.55;
        p.trayRight.position.y = 0.65 + op * 0.45;
      }

      if (p.latches) {
        p.latches.forEach((l) => {
          l.rotation.x = op * (Math.PI * 0.45);
        });
      }

      // Tool Models Positioning & Dynamic Highlight
      const activeSelected = selectedToolRef.current;
      const hoveredId = lastHoveredIdRef.current;

      toolNodesRef.current.forEach((node) => {
        const { group, highlightRing, defaultPos, explodeOffset, tool } = node;

        const isSelected = activeSelected?.id === tool.id;
        const isHovered = hoveredId === tool.id;

        // Controlled Explode position
        const posX = defaultPos.x + explodeOffset.x * op;
        const posY = defaultPos.y + explodeOffset.y * op;
        const posZ = defaultPos.z + explodeOffset.z * op;

        group.position.set(posX, posY, posZ);

        // Highlight ring animation
        if (highlightRing) {
          highlightRing.visible = isSelected || isHovered;
          if (isSelected) {
            highlightRing.material.color.setHex(0x06b6d4);
            highlightRing.material.opacity = 0.95;
            highlightRing.rotation.z += delta * 2.5;
          } else if (isHovered) {
            highlightRing.material.color.setHex(0x38bdf8);
            highlightRing.material.opacity = 0.6;
          }
        }
      });

      // Raycast Hover Check
      raycasterRef.current.setFromCamera(mousePosRef.current, camera);
      const interactiveObjects = toolNodesRef.current.map((n) => n.group);
      const intersects = raycasterRef.current.intersectObjects(interactiveObjects, true);

      if (intersects.length > 0) {
        let obj = intersects[0].object;
        while (obj && !obj.userData.tool && obj.parent) {
          obj = obj.parent;
        }
        if (obj?.userData?.tool) {
          const t = obj.userData.tool;
          if (lastHoveredIdRef.current !== t.id) {
            lastHoveredIdRef.current = t.id;
            setHoveredTool(t);
          }
          container.style.cursor = 'pointer';
        }
      } else {
        if (lastHoveredIdRef.current !== null) {
          lastHoveredIdRef.current = null;
          setHoveredTool(null);
        }
        container.style.cursor = 'grab';
      }

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animFrameRef.current);
      resizeObserver.disconnect();
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      container.removeEventListener('pointerdown', onPointerDown);
      container.removeEventListener('wheel', onWheel);
      container.removeEventListener('click', onClick);
      if (rendererRef.current?.domElement) {
        rendererRef.current.dispose();
      }
    };
  }, [themeKey]);

  // 2. Build Realistic 3D Tool Geometries (Updates when filteredTools change)
  useEffect(() => {
    if (!sceneRef.current) return;
    const scene = sceneRef.current;

    // Clean old tool nodes
    toolNodesRef.current.forEach((n) => {
      scene.remove(n.group);
    });
    toolNodesRef.current = [];

    // Organize tools into authentic physical tray compartments
    // Tray 1 (Left Upper): Sockets & Bits (Arranged on socket rails)
    // Tray 2 (Right Upper): Hex & Torx L-Keys (Stepped holder)
    // Tray 3 (Middle Upper): Combination Spanners & Wrenches (Graduated 6mm -> 24mm)
    // Tray 4 (Middle Right): Screwdrivers (Parallel fluted handles)
    // Tray 5 (Deep Base): Heavy tools (Ratchet handles, Pliers, Multimeter, Hammers, Files, Snap rings)
    const sockets = filteredTools.filter((t) => ['sockets', 'specialty_sets'].includes(t.category));
    const keys = filteredTools.filter((t) => ['hex_keys', 'torx_keys'].includes(t.category));
    const wrenches = filteredTools.filter((t) => ['combination_wrenches', 'open_wrenches'].includes(t.category));
    const screwdrivers = filteredTools.filter((t) => t.category === 'screwdrivers');
    const heavyTools = filteredTools.filter(
      (t) => !['sockets', 'specialty_sets', 'hex_keys', 'torx_keys', 'combination_wrenches', 'open_wrenches', 'screwdrivers'].includes(t.category)
    );

    const placeToolList = (list, trayType) => {
      list.forEach((tool, idx) => {
        const model = buildRealisticToolModel(tool);
        let defX = 0, defY = 0, defZ = 0;
        let expX = 0, expY = 0, expZ = 0;

        if (trayType === 'sockets_left') {
          // Dual rows along socket rails
          const col = idx % 10;
          const row = Math.floor(idx / 10);
          defX = -1.3 + (row === 0 ? -0.4 : 0.4);
          defY = 0.8;
          defZ = (col - 4.5) * 0.24;

          expX = defX - 1.8;
          expY = 1.3 + (col % 2) * 0.15;
          expZ = defZ;
        } else if (trayType === 'keys_right') {
          // Stepped L-keys
          const col = idx % 10;
          const row = Math.floor(idx / 10);
          defX = 1.3 + (row === 0 ? -0.4 : 0.4);
          defY = 0.8;
          defZ = (col - 4.5) * 0.24;

          expX = defX + 1.8;
          expY = 1.3 + (col % 2) * 0.15;
          expZ = defZ;
        } else if (trayType === 'wrenches_middle') {
          // Graduated parallel spanners
          const col = idx % 12;
          defX = (col - 5.5) * 0.22;
          defY = 0.15;
          defZ = -0.45;

          expX = defX * 1.3;
          expY = 1.5 + Math.sin((col / 12) * Math.PI) * 0.35;
          expZ = -0.9;
        } else if (trayType === 'screwdrivers_middle') {
          // Screwdrivers
          const col = idx % 10;
          defX = (col - 4.5) * 0.25;
          defY = 0.15;
          defZ = 0.45;

          expX = defX * 1.3;
          expY = 1.5 + Math.cos((col / 10) * Math.PI) * 0.35;
          expZ = 0.9;
        } else {
          // Heavy tools in deep base
          const col = idx % 6;
          const row = Math.floor(idx / 6);
          defX = (col - 2.5) * 0.55;
          defY = -0.4;
          defZ = (row - 1.0) * 0.6;

          expX = defX * 1.2;
          expY = 0.4;
          expZ = defZ;
        }

        model.position.set(defX, defY, defZ);

        // Highlight ring on model root
        const ringGeo = new THREE.RingGeometry(0.35, 0.4, 32);
        const ringMat = new THREE.MeshBasicMaterial({
          color: 0x06b6d4,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.85,
        });
        const highlightRing = new THREE.Mesh(ringGeo, ringMat);
        highlightRing.rotation.x = -Math.PI / 2;
        highlightRing.position.y = -0.12;
        highlightRing.visible = false;
        model.add(highlightRing);

        scene.add(model);

        toolNodesRef.current.push({
          group: model,
          highlightRing,
          tool,
          defaultPos: new THREE.Vector3(defX, defY, defZ),
          explodeOffset: new THREE.Vector3(expX - defX, expY - defY, expZ - defZ),
        });
      });
    };

    placeToolList(sockets.slice(0, 24), 'sockets_left');
    placeToolList(keys.slice(0, 20), 'keys_right');
    placeToolList(wrenches.slice(0, 18), 'wrenches_middle');
    placeToolList(screwdrivers.slice(0, 12), 'screwdrivers_middle');
    placeToolList(heavyTools.slice(0, 12), 'heavy_base');
  }, [filteredTools]);

  return (
    <div className="relative w-full h-full min-h-[560px] bg-slate-950 rounded-3xl overflow-hidden border border-slate-800 shadow-2xl">
      {/* 3D Canvas Mount */}
      <div ref={mountRef} className="w-full h-full min-h-[560px]" />

      {/* Top Floating Control Bar */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none">
        {/* Left: Active Preset / Info Pill */}
        <div className="flex items-center gap-2 bg-slate-900/90 backdrop-blur-xl px-3 py-1.5 rounded-xl border border-slate-700/80 shadow-xl pointer-events-auto">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span className="text-xs font-bold text-white tracking-tight">
            {technician?.name}
          </span>
          <span className="text-[11px] text-slate-400 font-mono">
            ({filteredTools.length}/{tools.length} visible)
          </span>
        </div>

        {/* Right: Camera Presets & Explode Presets */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {/* Camera Presets */}
          <div className="flex items-center gap-1 bg-slate-900/90 backdrop-blur-xl p-1 rounded-xl border border-slate-700/80 shadow-xl">
            <button
              onClick={() => handleSetCameraPreset('iso')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
                activeCameraPreset === 'iso' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
              }`}
              title="Isometric Camera (Key: R)"
            >
              Iso
            </button>
            <button
              onClick={() => handleSetCameraPreset('front')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
                activeCameraPreset === 'front' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Front
            </button>
            <button
              onClick={() => handleSetCameraPreset('top')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
                activeCameraPreset === 'top' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Top
            </button>
          </div>

          {/* Explode Presets */}
          <div className="flex items-center gap-1 bg-slate-900/90 backdrop-blur-xl p-1 rounded-xl border border-slate-700/80 shadow-xl">
            <button
              onClick={() => handleSetExplodePreset('closed')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
                explodePreset === 'closed' ? 'bg-slate-700 text-white font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Closed
            </button>
            <button
              onClick={() => handleSetExplodePreset('inspection')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
                explodePreset === 'inspection' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
              }`}
              title="Inspection Explode (Key: E)"
            >
              Inspect
            </button>
            <button
              onClick={() => handleSetExplodePreset('exploded')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
                explodePreset === 'exploded' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Explode
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Explode Slider & Keyboard Shortcuts Hint */}
      <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between pointer-events-none">
        {/* Slider */}
        <div className="flex items-center gap-2.5 bg-slate-900/90 backdrop-blur-xl px-3.5 py-2 rounded-xl border border-slate-700/80 shadow-xl pointer-events-auto">
          <span className="text-[11px] font-bold text-slate-300">Explode Trays:</span>
          <input
            type="range"
            min="0.0"
            max="1.0"
            step="0.05"
            value={explodeValue}
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              setExplodeValue(val);
              if (val === 0) setExplodePreset('closed');
              else if (val < 0.35) setExplodePreset('slight');
              else if (val < 0.75) setExplodePreset('inspection');
              else setExplodePreset('exploded');
            }}
            className="w-24 h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-400"
          />
          <span className="text-[11px] text-cyan-400 font-mono font-bold">
            {Math.round(explodeValue * 100)}%
          </span>
        </div>

        {/* Shortcuts Pill */}
        <div className="hidden sm:flex items-center gap-2 bg-slate-900/90 backdrop-blur-xl px-3 py-1.5 rounded-xl border border-slate-700/80 text-[11px] text-slate-400 shadow-xl pointer-events-auto">
          <span><kbd className="font-mono font-bold text-slate-300">R</kbd> Reset</span>
          <span>•</span>
          <span><kbd className="font-mono font-bold text-slate-300">F</kbd> Focus Tool</span>
          <span>•</span>
          <span><kbd className="font-mono font-bold text-slate-300">E</kbd> Explode</span>
        </div>
      </div>

      {/* Progressive Disclosure Hover Tooltip */}
      {hoveredTool && (
        <div
          className="absolute z-20 pointer-events-none bg-slate-900/95 backdrop-blur-md border border-cyan-500/60 shadow-2xl p-2.5 rounded-xl text-xs space-y-1 transform -translate-x-1/2 -translate-y-full mb-3 animate-in fade-in duration-100"
          style={{
            left: Math.max(80, Math.min(tooltipPos.x, 700)),
            top: Math.max(60, tooltipPos.y - 12),
          }}
        >
          <div className="flex items-center gap-2">
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: STATUS_COLORS[hoveredTool.status]?.css }}
            />
            <span className="font-black text-white">{hoveredTool.name}</span>
            {hoveredTool.specification && (
              <span className="font-mono text-cyan-400 font-bold bg-slate-950 px-1.5 py-0.2 rounded border border-slate-800">
                {hoveredTool.specification}mm
              </span>
            )}
          </div>
          <div className="text-[10px] text-slate-400 flex items-center justify-between gap-3">
            <span>{hoveredTool.categoryEn || hoveredTool.categoryAr}</span>
            <span className="font-bold text-emerald-400">{hoveredTool.statusLabelEn || hoveredTool.status}</span>
          </div>
        </div>
      )}
    </div>
  );
}
