import * as THREE from 'three';

// Shared Materials Cache for High 60 FPS Performance
const MATERIALS = {
  chrome: new THREE.MeshStandardMaterial({
    color: 0xf1f5f9,
    metalness: 0.95,
    roughness: 0.12,
  }),
  chromeSatin: new THREE.MeshStandardMaterial({
    color: 0xdbeafe,
    metalness: 0.85,
    roughness: 0.25,
  }),
  blackPhosphate: new THREE.MeshStandardMaterial({
    color: 0x18181b,
    metalness: 0.6,
    roughness: 0.45,
  }),
  steelDark: new THREE.MeshStandardMaterial({
    color: 0x334155,
    metalness: 0.8,
    roughness: 0.35,
  }),
  rubberBlack: new THREE.MeshStandardMaterial({
    color: 0x09090b,
    metalness: 0.1,
    roughness: 0.85,
  }),
  rubberRed: new THREE.MeshStandardMaterial({
    color: 0xdc2626,
    metalness: 0.15,
    roughness: 0.7,
  }),
  rubberBlue: new THREE.MeshStandardMaterial({
    color: 0x2563eb,
    metalness: 0.15,
    roughness: 0.7,
  }),
  rubberYellow: new THREE.MeshStandardMaterial({
    color: 0xeab308,
    metalness: 0.15,
    roughness: 0.7,
  }),
  rubberCyan: new THREE.MeshStandardMaterial({
    color: 0x06b6d4,
    metalness: 0.15,
    roughness: 0.7,
  }),
  woodHickory: new THREE.MeshStandardMaterial({
    color: 0xb45309,
    metalness: 0.05,
    roughness: 0.75,
  }),
  brassGold: new THREE.MeshStandardMaterial({
    color: 0xf59e0b,
    metalness: 0.9,
    roughness: 0.2,
  }),
  lcdScreen: new THREE.MeshBasicMaterial({
    color: 0x064e3b,
  }),
};

/**
 * 1. Combination Wrench (مفتاح شق ورنج)
 * True shape: U-shaped open-end jaw on one side, I-beam handle with engraved size, 12-point offset box ring on other side.
 */
function createCombinationWrench(sizeMm = 14) {
  const group = new THREE.Group();
  const scale = Math.max(0.6, Math.min(1.5, sizeMm / 14));
  const length = 1.6 * scale;
  const width = 0.22 * scale;
  const thickness = 0.05 * scale;

  // I-Beam Handle Shaft
  const handleGeo = new THREE.BoxGeometry(width, thickness, length * 0.7);
  const handleMesh = new THREE.Mesh(handleGeo, MATERIALS.chrome);
  handleMesh.castShadow = true;
  group.add(handleMesh);

  // Recessed center panel on handle
  const recessGeo = new THREE.BoxGeometry(width * 0.65, thickness * 1.05, length * 0.55);
  const recessMesh = new THREE.Mesh(recessGeo, MATERIALS.chromeSatin);
  group.add(recessMesh);

  // Open-End Jaw (Extruded U-shape)
  const openShape = new THREE.Shape();
  const jawRadius = width * 1.1;
  openShape.absarc(0, 0, jawRadius, 0, Math.PI * 2, false);
  // Cut out U-slot
  const slotWidth = width * 0.7;
  const slotDepth = jawRadius * 1.1;
  const slotHole = new THREE.Path();
  slotHole.moveTo(-slotWidth / 2, slotDepth);
  slotHole.lineTo(-slotWidth / 2, 0);
  slotHole.absarc(0, 0, slotWidth / 2, Math.PI, 0, true);
  slotHole.lineTo(slotWidth / 2, slotDepth);
  slotHole.lineTo(-slotWidth / 2, slotDepth);
  openShape.holes.push(slotHole);

  const extrudeSettings = { depth: thickness * 1.2, bevelEnabled: true, bevelSegments: 2, steps: 1, bevelSize: 0.01, bevelThickness: 0.01 };
  const openJawGeo = new THREE.ExtrudeGeometry(openShape, extrudeSettings);
  const openJawMesh = new THREE.Mesh(openJawGeo, MATERIALS.chrome);
  openJawMesh.rotation.x = Math.PI / 2;
  openJawMesh.rotation.z = -Math.PI / 12; // 15-degree standard offset
  openJawMesh.position.set(0, thickness * 0.6, -length * 0.38);
  openJawMesh.castShadow = true;
  group.add(openJawMesh);

  // Box End (Ring with 12-point internal star/circle hole)
  const ringOuterGeo = new THREE.CylinderGeometry(width * 0.95, width * 0.95, thickness * 1.3, 24);
  const ringInnerGeo = new THREE.CylinderGeometry(width * 0.55, width * 0.55, thickness * 1.35, 12);
  const ringMesh = new THREE.Mesh(ringOuterGeo, MATERIALS.chrome);
  const ringHole = new THREE.Mesh(ringInnerGeo, MATERIALS.blackPhosphate);
  ringMesh.position.set(0, 0, length * 0.38);
  ringHole.position.set(0, 0, length * 0.38);
  ringMesh.rotation.x = Math.PI / 12; // 15-degree knuckle clearance
  ringHole.rotation.x = Math.PI / 12;
  ringMesh.castShadow = true;
  group.add(ringMesh);
  group.add(ringHole);

  return group;
}

/**
 * 2. Hex Socket (حبة بكس / سوكت)
 * True shape: Knurled cylinder, 6-point hex interior recess, 1/2" or 3/8" square drive on bottom.
 */
function createHexSocket(sizeMm = 17, isDeep = false) {
  const group = new THREE.Group();
  const radius = Math.max(0.12, Math.min(0.28, (sizeMm / 20) * 0.2));
  const height = isDeep ? 0.85 : 0.42;

  // Main Chrome Cylinder Body
  const bodyGeo = new THREE.CylinderGeometry(radius, radius * 0.95, height, 24);
  const bodyMesh = new THREE.Mesh(bodyGeo, MATERIALS.chrome);
  bodyMesh.castShadow = true;
  group.add(bodyMesh);

  // Center Knurled Grip Band
  const knurlGeo = new THREE.CylinderGeometry(radius * 1.02, radius * 1.02, height * 0.25, 24);
  const knurlMesh = new THREE.Mesh(knurlGeo, MATERIALS.chromeSatin);
  knurlMesh.position.y = 0;
  group.add(knurlMesh);

  // Hexagon Cavity on top
  const hexCavityGeo = new THREE.CylinderGeometry(radius * 0.65, radius * 0.65, 0.08, 6);
  const hexCavity = new THREE.Mesh(hexCavityGeo, MATERIALS.blackPhosphate);
  hexCavity.position.y = height * 0.48;
  group.add(hexCavity);

  // Square Drive hole on bottom
  const driveCavityGeo = new THREE.BoxGeometry(radius * 0.8, 0.08, radius * 0.8);
  const driveCavity = new THREE.Mesh(driveCavityGeo, MATERIALS.blackPhosphate);
  driveCavity.position.y = -height * 0.48;
  group.add(driveCavity);

  return group;
}

/**
 * 3. Ratchet Handle (يد ركلاج أوتوماتيك)
 * True shape: Ergonomic dual-compound handle, quick-release teardrop head, square drive anvil.
 */
function createRatchetWrench() {
  const group = new THREE.Group();

  // Ergonomic Rubber Handle
  const handleGeo = new THREE.CylinderGeometry(0.13, 0.1, 1.1, 16);
  const handleMesh = new THREE.Mesh(handleGeo, MATERIALS.rubberBlue);
  handleMesh.position.z = 0.6;
  handleMesh.rotation.x = Math.PI / 2;
  handleMesh.castShadow = true;
  group.add(handleMesh);

  // Black Rubber Ribbed Grip Overmold
  const ribGeo = new THREE.CylinderGeometry(0.135, 0.115, 0.7, 16);
  const ribMesh = new THREE.Mesh(ribGeo, MATERIALS.rubberBlack);
  ribMesh.position.z = 0.65;
  ribMesh.rotation.x = Math.PI / 2;
  group.add(ribMesh);

  // Chrome Shaft
  const shaftGeo = new THREE.CylinderGeometry(0.08, 0.09, 0.9, 16);
  const shaftMesh = new THREE.Mesh(shaftGeo, MATERIALS.chrome);
  shaftMesh.position.z = -0.2;
  shaftMesh.rotation.x = Math.PI / 2;
  shaftMesh.castShadow = true;
  group.add(shaftMesh);

  // Teardrop Ratchet Head
  const headGeo = new THREE.CylinderGeometry(0.24, 0.24, 0.18, 24);
  const headMesh = new THREE.Mesh(headGeo, MATERIALS.chrome);
  headMesh.position.z = -0.7;
  headMesh.castShadow = true;
  group.add(headMesh);

  // Quick Release Button on top
  const btnGeo = new THREE.CylinderGeometry(0.07, 0.07, 0.06, 16);
  const btnMesh = new THREE.Mesh(btnGeo, MATERIALS.chrome);
  btnMesh.position.set(0, 0.11, -0.7);
  group.add(btnMesh);

  // Reversing Lever
  const leverGeo = new THREE.BoxGeometry(0.06, 0.04, 0.14);
  const leverMesh = new THREE.Mesh(leverGeo, MATERIALS.blackPhosphate);
  leverMesh.position.set(0.08, 0.1, -0.62);
  leverMesh.rotation.y = Math.PI / 4;
  group.add(leverMesh);

  // 1/2" Square Drive Anvil
  const anvilGeo = new THREE.BoxGeometry(0.14, 0.16, 0.14);
  const anvilMesh = new THREE.Mesh(anvilGeo, MATERIALS.blackPhosphate);
  anvilMesh.position.set(0, -0.16, -0.7);
  group.add(anvilMesh);

  return group;
}

/**
 * 4. Screwdriver (مفك أصلي)
 * True shape: Fluted ergonomic handle, steel bolster, round shank, magnetic phillips / slotted tip.
 */
function createScrewdriver(isPhillips = false) {
  const group = new THREE.Group();

  // Contoured Fluted Handle
  const handleGeo = new THREE.CylinderGeometry(0.16, 0.12, 0.85, 8);
  const handleMesh = new THREE.Mesh(handleGeo, isPhillips ? MATERIALS.rubberRed : MATERIALS.rubberYellow);
  handleMesh.rotation.x = Math.PI / 2;
  handleMesh.position.z = 0.5;
  handleMesh.castShadow = true;
  group.add(handleMesh);

  // Black Rubber Comfort Inlays
  const inlayGeo = new THREE.CylinderGeometry(0.165, 0.13, 0.5, 8);
  const inlayMesh = new THREE.Mesh(inlayGeo, MATERIALS.rubberBlack);
  inlayMesh.rotation.x = Math.PI / 2;
  inlayMesh.position.z = 0.52;
  group.add(inlayMesh);

  // Chrome-Vanadium Round Shank
  const shankGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.9, 12);
  const shankMesh = new THREE.Mesh(shankGeo, MATERIALS.chrome);
  shankMesh.rotation.x = Math.PI / 2;
  shankMesh.position.z = -0.3;
  shankMesh.castShadow = true;
  group.add(shankMesh);

  // Magnetic Phosphate Tip
  if (isPhillips) {
    // Phillips Cross Tip
    const tipGeo1 = new THREE.BoxGeometry(0.07, 0.015, 0.1);
    const tipGeo2 = new THREE.BoxGeometry(0.015, 0.07, 0.1);
    const tip1 = new THREE.Mesh(tipGeo1, MATERIALS.blackPhosphate);
    const tip2 = new THREE.Mesh(tipGeo2, MATERIALS.blackPhosphate);
    tip1.position.z = -0.8;
    tip2.position.z = -0.8;
    group.add(tip1);
    group.add(tip2);
  } else {
    // Slotted Flat Tip
    const tipGeo = new THREE.BoxGeometry(0.08, 0.012, 0.1);
    const tipMesh = new THREE.Mesh(tipGeo, MATERIALS.blackPhosphate);
    tipMesh.position.z = -0.8;
    group.add(tipMesh);
  }

  return group;
}

/**
 * 5. Hex / Allen L-Key (مفتاح ألنكيه L-Shape)
 * True shape: 90-degree bent hexagonal rod with long arm and short arm.
 */
function createHexLKey(sizeMm = 8) {
  const group = new THREE.Group();
  const radius = Math.max(0.02, Math.min(0.07, (sizeMm / 10) * 0.05));
  const longLen = 0.9;
  const shortLen = 0.35;

  // Long Hex Arm
  const longArmGeo = new THREE.CylinderGeometry(radius, radius, longLen, 6);
  const longArm = new THREE.Mesh(longArmGeo, MATERIALS.blackPhosphate);
  longArm.position.set(0, longLen / 2, 0);
  longArm.castShadow = true;
  group.add(longArm);

  // 90-degree Corner Elbow
  const elbowGeo = new THREE.TorusGeometry(radius * 2, radius, 8, 12, Math.PI / 2);
  const elbow = new THREE.Mesh(elbowGeo, MATERIALS.blackPhosphate);
  elbow.rotation.y = -Math.PI / 2;
  elbow.position.set(0, 0, radius * 2);
  group.add(elbow);

  // Short Hex Arm
  const shortArmGeo = new THREE.CylinderGeometry(radius, radius, shortLen, 6);
  const shortArm = new THREE.Mesh(shortArmGeo, MATERIALS.blackPhosphate);
  shortArm.rotation.x = Math.PI / 2;
  shortArm.position.set(0, -radius * 2, shortLen / 2 + radius * 2);
  shortArm.castShadow = true;
  group.add(shortArm);

  group.rotation.x = -Math.PI / 2;
  return group;
}

/**
 * 6. Combination Pliers / Cutters (زرادية / قطاعة)
 * True shape: Dual curved handles, pivot rivet joint, serrated gripping jaws & wire cutter.
 */
function createPliers() {
  const group = new THREE.Group();

  // Dual Rubber Handles
  const handleGeo = new THREE.CylinderGeometry(0.08, 0.06, 0.9, 12);
  const handleL = new THREE.Mesh(handleGeo, MATERIALS.rubberBlue);
  handleL.position.set(-0.18, 0, 0.5);
  handleL.rotation.z = Math.PI / 14;
  handleL.rotation.x = Math.PI / 2;
  handleL.castShadow = true;
  group.add(handleL);

  const handleR = new THREE.Mesh(handleGeo, MATERIALS.rubberBlue);
  handleR.position.set(0.18, 0, 0.5);
  handleR.rotation.z = -Math.PI / 14;
  handleR.rotation.x = Math.PI / 2;
  handleR.castShadow = true;
  group.add(handleR);

  // Chrome Pivot Rivet
  const pivotGeo = new THREE.CylinderGeometry(0.15, 0.15, 0.1, 16);
  const pivotMesh = new THREE.Mesh(pivotGeo, MATERIALS.chrome);
  pivotMesh.position.set(0, 0, 0);
  group.add(pivotMesh);

  // Serrated Steel Jaws
  const jawGeoL = new THREE.BoxGeometry(0.1, 0.08, 0.45);
  const jawL = new THREE.Mesh(jawGeoL, MATERIALS.steelDark);
  jawL.position.set(-0.06, 0, -0.25);
  jawL.castShadow = true;
  group.add(jawL);

  const jawGeoR = new THREE.BoxGeometry(0.1, 0.08, 0.45);
  const jawR = new THREE.Mesh(jawGeoR, MATERIALS.steelDark);
  jawR.position.set(0.06, 0, -0.25);
  jawR.castShadow = true;
  group.add(jawR);

  return group;
}

/**
 * 7. Ball-Peen / Machinist Hammer (شاكوش حداد)
 * True shape: Contoured wood/fiberglass handle, steel head with flat face and round peen.
 */
function createMachinistHammer() {
  const group = new THREE.Group();

  // Wood Handle
  const handleGeo = new THREE.CylinderGeometry(0.06, 0.05, 1.4, 12);
  const handle = new THREE.Mesh(handleGeo, MATERIALS.woodHickory);
  handle.rotation.x = Math.PI / 2;
  handle.position.z = 0.5;
  handle.castShadow = true;
  group.add(handle);

  // Black Grip Wrap at base
  const gripGeo = new THREE.CylinderGeometry(0.065, 0.055, 0.4, 12);
  const grip = new THREE.Mesh(gripGeo, MATERIALS.rubberBlack);
  grip.rotation.x = Math.PI / 2;
  grip.position.z = 1.0;
  group.add(grip);

  // Forged Steel Hammer Head
  const headCenterGeo = new THREE.BoxGeometry(0.18, 0.18, 0.22);
  const headCenter = new THREE.Mesh(headCenterGeo, MATERIALS.steelDark);
  headCenter.position.set(0, 0, -0.2);
  group.add(headCenter);

  // Flat Strike Face
  const flatFaceGeo = new THREE.CylinderGeometry(0.09, 0.09, 0.22, 16);
  const flatFace = new THREE.Mesh(flatFaceGeo, MATERIALS.chrome);
  flatFace.rotation.z = Math.PI / 2;
  flatFace.position.set(-0.18, 0, -0.2);
  flatFace.castShadow = true;
  group.add(flatFace);

  // Round Ball Peen
  const ballPeenGeo = new THREE.SphereGeometry(0.085, 16, 16);
  const ballPeen = new THREE.Mesh(ballPeenGeo, MATERIALS.chrome);
  ballPeen.position.set(0.18, 0, -0.2);
  ballPeen.castShadow = true;
  group.add(ballPeen);

  return group;
}

/**
 * 8. Digital Multimeter (ساعة فحص كهرباء)
 * True shape: Yellow shockproof casing, LCD digital screen, rotary selection dial, test jacks.
 */
function createDigitalMultimeter() {
  const group = new THREE.Group();

  // Yellow Armor Holster
  const holsterGeo = new THREE.BoxGeometry(0.7, 0.18, 1.1);
  const holster = new THREE.Mesh(holsterGeo, MATERIALS.rubberYellow);
  holster.castShadow = true;
  group.add(holster);

  // Dark Inner Face
  const faceGeo = new THREE.BoxGeometry(0.62, 0.04, 1.02);
  const face = new THREE.Mesh(faceGeo, MATERIALS.rubberBlack);
  face.position.y = 0.08;
  group.add(face);

  // LCD Screen Display
  const lcdGeo = new THREE.BoxGeometry(0.48, 0.02, 0.28);
  const lcd = new THREE.Mesh(lcdGeo, MATERIALS.lcdScreen);
  lcd.position.set(0, 0.11, -0.32);
  group.add(lcd);

  // Rotary Selection Knob
  const knobGeo = new THREE.CylinderGeometry(0.14, 0.14, 0.08, 20);
  const knob = new THREE.Mesh(knobGeo, MATERIALS.rubberBlack);
  knob.position.set(0, 0.12, 0.08);
  group.add(knob);

  // Knob Pointer
  const pointerGeo = new THREE.BoxGeometry(0.03, 0.09, 0.12);
  const pointer = new THREE.Mesh(pointerGeo, MATERIALS.rubberRed);
  pointer.position.set(0, 0.13, 0.08);
  group.add(pointer);

  // 3 Terminal Jacks
  [-0.16, 0, 0.16].forEach((dx) => {
    const jackGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.04, 12);
    const jack = new THREE.Mesh(jackGeo, MATERIALS.blackPhosphate);
    jack.position.set(dx, 0.1, 0.42);
    group.add(jack);
  });

  return group;
}

/**
 * 9. Metal File (مبرد حديد)
 * True shape: Wooden/composite handle, brass ferrule, cross-hatched tapered steel rasp blade.
 */
function createFileTool() {
  const group = new THREE.Group();

  // Handle
  const handleGeo = new THREE.CylinderGeometry(0.09, 0.06, 0.65, 12);
  const handle = new THREE.Mesh(handleGeo, MATERIALS.woodHickory);
  handle.rotation.x = Math.PI / 2;
  handle.position.z = 0.45;
  handle.castShadow = true;
  group.add(handle);

  // Brass Ferrule
  const ferruleGeo = new THREE.CylinderGeometry(0.07, 0.07, 0.08, 16);
  const ferrule = new THREE.Mesh(ferruleGeo, MATERIALS.brassGold);
  ferrule.rotation.x = Math.PI / 2;
  ferrule.position.z = 0.1;
  group.add(ferrule);

  // Steel File Blade
  const bladeGeo = new THREE.BoxGeometry(0.14, 0.035, 1.0);
  const blade = new THREE.Mesh(bladeGeo, MATERIALS.steelDark);
  blade.position.z = -0.45;
  blade.castShadow = true;
  group.add(blade);

  return group;
}

/**
 * 10. Circlip / Snap Ring Pliers (بنسة سناب رنج)
 * True shape: Plier handles with fine needle-pin tips.
 */
function createSnapRingPliers() {
  const group = new THREE.Group();

  // Red Dipped Handles
  const handleGeo = new THREE.CylinderGeometry(0.06, 0.04, 0.8, 12);
  const h1 = new THREE.Mesh(handleGeo, MATERIALS.rubberRed);
  h1.position.set(-0.14, 0, 0.45);
  h1.rotation.z = Math.PI / 16;
  h1.rotation.x = Math.PI / 2;
  group.add(h1);

  const h2 = new THREE.Mesh(handleGeo, MATERIALS.rubberRed);
  h2.position.set(0.14, 0, 0.45);
  h2.rotation.z = -Math.PI / 16;
  h2.rotation.x = Math.PI / 2;
  group.add(h2);

  // Central Pivot
  const pivotGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.08, 16);
  const pivot = new THREE.Mesh(pivotGeo, MATERIALS.blackPhosphate);
  group.add(pivot);

  // Needle Tips
  const tipGeo = new THREE.CylinderGeometry(0.015, 0.03, 0.35, 8);
  const tip1 = new THREE.Mesh(tipGeo, MATERIALS.chrome);
  tip1.rotation.x = Math.PI / 2;
  tip1.position.set(-0.04, 0, -0.22);
  group.add(tip1);

  const tip2 = new THREE.Mesh(tipGeo, MATERIALS.chrome);
  tip2.rotation.x = Math.PI / 2;
  tip2.position.set(0.04, 0, -0.22);
  group.add(tip2);

  return group;
}

/**
 * 11. Master Procedural Tool Builder Factory
 * Maps any domain tool record to its authentic, detailed 3D mesh model.
 */
export function buildRealisticToolModel(tool) {
  const cat = tool.category || 'general_tools';
  const name = (tool.name || '').toLowerCase();
  const spec = parseFloat(tool.specification) || 14;

  let modelGroup;

  if (cat === 'combination_wrenches' || cat === 'open_wrenches' || name.includes('مفتاح') || name.includes('wrench')) {
    modelGroup = createCombinationWrench(spec);
  } else if (cat === 'sockets' || cat === 'specialty_sets' || name.includes('بكس') || name.includes('حبة') || name.includes('socket')) {
    const isDeep = name.includes('طويل') || name.includes('deep');
    modelGroup = createHexSocket(spec, isDeep);
  } else if (cat === 'ratchets_extensions' || name.includes('ركلاج') || name.includes('أوتوماتيك') || name.includes('ratchet')) {
    modelGroup = createRatchetWrench();
  } else if (cat === 'screwdrivers' || name.includes('مفك') || name.includes('screwdriver')) {
    const isPhillips = name.includes('مصلب') || name.includes('phillips') || name.includes('ph');
    modelGroup = createScrewdriver(isPhillips);
  } else if (cat === 'hex_keys' || cat === 'torx_keys' || name.includes('ألنكيه') || name.includes('torx') || name.includes('hex')) {
    modelGroup = createHexLKey(spec);
  } else if (cat === 'pliers_cutters' || name.includes('زرادية') || name.includes('قطاعة') || name.includes('بنسة') || name.includes('pliers')) {
    modelGroup = createPliers();
  } else if (cat === 'hammers_saws' || name.includes('مطرقة') || name.includes('شاكوش') || name.includes('hammer')) {
    modelGroup = createMachinistHammer();
  } else if (cat === 'electrical_measuring' || name.includes('ميتر') || name.includes('multimeter') || name.includes('قياس')) {
    modelGroup = createDigitalMultimeter();
  } else if (cat === 'files' || name.includes('مبرد') || name.includes('file')) {
    modelGroup = createFileTool();
  } else if (cat === 'snap_rings' || name.includes('سناب') || name.includes('circlip')) {
    modelGroup = createSnapRingPliers();
  } else {
    // Default high-precision machined tool bar
    modelGroup = createCombinationWrench(spec);
  }

  // Tag domain tool data on all child meshes for raycasting
  modelGroup.traverse((child) => {
    if (child.isMesh) {
      child.userData = { tool };
    }
  });
  modelGroup.userData = { tool };

  return modelGroup;
}
