import * as THREE from 'three';
import { DieCastingMachine } from '../../types/machine';
import { DieModel } from '../../types/die';
import { RobotModelSpec, ToolCenterPoint, FactoryEquipmentConfig, RobotMountType, TopMountStyle, RobotMountConfig, EoatType, SprayNozzleConfig, CellCyclePhase } from '../../types/robot';
import { buildRobotKinematicModel } from '../../utils/kinematics/robotModelBuilder';
import { Matrix4Tuple } from '../../types/kinematics';
import { loadGp50CadParts, attachGp50CadParts } from '../../utils/gp50CadLoader';

// Material Cache to avoid recreating shaders every frame
export const MAT = {
  toyoGreen: new THREE.MeshStandardMaterial({ color: 0x24332c, metalness: 0.55, roughness: 0.4 }), // Toyo Industrial Green-Grey
  toyoGrey: new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.75, roughness: 0.35 }), // Cast Platen Charcoal
  platenSteel: new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.85, roughness: 0.28 }),
  chromeTieBar: new THREE.MeshStandardMaterial({ color: 0xf8fafc, metalness: 0.96, roughness: 0.08 }),
  dieSteelH13: new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.88, roughness: 0.22 }),
  cavityDarkEDM: new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.92, roughness: 0.18 }),
  partingBevel: new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.9, roughness: 0.15 }),
  brass: new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.8, roughness: 0.25 }),
  copper: new THREE.MeshStandardMaterial({ color: 0xb45309, metalness: 0.85, roughness: 0.25 }),
  jointDark: new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.85, roughness: 0.2 }),
  aluminumPart: new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.9, roughness: 0.25 }),
  castRecess: new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.8, roughness: 0.8 }),
  safetyYellow: new THREE.MeshStandardMaterial({ color: 0xfacc15, metalness: 0.4, roughness: 0.4 }),
  safetyFenceMesh: new THREE.MeshStandardMaterial({ color: 0x475569, wireframe: true, transparent: true, opacity: 0.55 }),
  cabinetGrey: new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.6, roughness: 0.4 }),
  screenGlass: new THREE.MeshStandardMaterial({ color: 0x0284c7, emissive: 0x0284c7, emissiveIntensity: 0.5, roughness: 0.2 }),
  furnaceRefractory: new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.4, roughness: 0.7 }),
  conduitBlack: new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.2, roughness: 0.85 }),
  quenchWater: new THREE.MeshStandardMaterial({ color: 0x0284c7, transparent: true, opacity: 0.65, roughness: 0.1 }),
  toolBlue: new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.75, roughness: 0.28 }),
  alertRed: new THREE.MeshStandardMaterial({ color: 0xef4444, emissive: 0xef4444, emissiveIntensity: 0.6, roughness: 0.2 }),
  alertAmber: new THREE.MeshStandardMaterial({ color: 0xf59e0b, emissive: 0xf59e0b, emissiveIntensity: 0.6, roughness: 0.2 }),
  alertGreen: new THREE.MeshStandardMaterial({ color: 0x10b981, emissive: 0x10b981, emissiveIntensity: 0.7, roughness: 0.2 }),
  fanucYellow: new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.55, roughness: 0.38 }),
  yaskawaBlue: new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.68, roughness: 0.32 }),
  abbWhite: new THREE.MeshStandardMaterial({ color: 0xf8fafc, metalness: 0.65, roughness: 0.28 }),
  kukaOrange: new THREE.MeshStandardMaterial({ color: 0xea580c, metalness: 0.62, roughness: 0.35 }),
  moltenMetal: new THREE.MeshStandardMaterial({ color: 0xff5500, emissive: 0xff3300, emissiveIntensity: 2.2, metalness: 0.3, roughness: 0.25 }),
  ejectorPinSteel: new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.95, roughness: 0.12 }),
  gripperBody: new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.75, roughness: 0.35 }),
  gripperPneumatic: new THREE.MeshStandardMaterial({ color: 0xea580c, metalness: 0.45, roughness: 0.4 }),
  gripperJaw: new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.88, roughness: 0.22 }),
  gripperSensorGreen: new THREE.MeshStandardMaterial({ color: 0x10b981, emissive: 0x10b981, emissiveIntensity: 1.0, roughness: 0.2 })
};

export interface DcmKinematicsHandle {
  movingAssemblyGroup: THREE.Group;
  ejectorPinsGroup: THREE.Group;
  plungerRodMesh: THREE.Mesh;
  moltenCavityFillMesh: THREE.Mesh;
  moltenCavityMaterial: THREE.MeshStandardMaterial;
  quenchPartMesh?: THREE.Mesh;
  closedMovPlatenZ: number;
  fixedPlatenZ: number;
  depth: number;
  updateKinematics: (
    platenOpenPct: number,
    platenOpenDistMm: number,
    ejectorMm: number,
    injectionFillPct: number,
    currentPhase: CellCyclePhase
  ) => void;
  dispose: () => void;
}

export interface ExtractorRobotRig {
  group: THREE.Group;
  gripperFlangeGroup: THREE.Group;
  gripperJaws: THREE.Mesh[];
  partMeshHolder: THREE.Group;
  partMesh: THREE.Mesh;
  updateExtractionKinematics: (
    phase: CellCyclePhase,
    progress: number,
    isPartGripped: boolean,
    targetCavityWorldPos?: THREE.Vector3,
    quenchDropWorldPos?: THREE.Vector3
  ) => void;
  dispose: () => void;
}

/**
 * Builds the realistic Toyo BD-V7EX Die Casting Machine (Backwards compatible helper)
 */
export function buildToyoMachine(
  group: THREE.Group,
  machine: DieCastingMachine,
  die: DieModel
) {
  const movGroup = new THREE.Group();
  group.add(movGroup);
  buildDcmDigitalTwin(group, movGroup, machine, die);
}

/**
 * Builds the Full Digital Twin DCM with Kinematics Handle
 */
export function buildDcmDigitalTwin(
  machineGroup: THREE.Group,
  movingAssemblyGroup: THREE.Group,
  machine: DieCastingMachine,
  die: DieModel
): DcmKinematicsHandle {
  while (machineGroup.children.length > 0) {
    machineGroup.remove(machineGroup.children[0]);
  }
  while (movingAssemblyGroup.children.length > 0) {
    movingAssemblyGroup.remove(movingAssemblyGroup.children[0]);
  }

  const platenW = machine.platenWidth;
  const platenH = machine.platenHeight;
  const platenThick = Math.max(180, Math.min(320, platenW * 0.18));
  const movPlatenW = machine.movablePlatenWidth || platenW;
  const movPlatenH = machine.movablePlatenHeight || platenH;
  const depth = die.dimensions.depth;

  const fixedDieZ = die.fixedDieOffsetZ;
  const fixedPlatenZ = fixedDieZ - depth / 2 - platenThick / 2;
  const closedMovPlatenZ = fixedDieZ + depth / 2 + platenThick / 2;
  const shotSleeveY = machine.injectionAxisOffsetY;
  const shotSleeveLen = (machine.plungerStroke || 500) + 350;

  // 1. STATIONARY FIXED PLATEN
  const fixedPlaten = new THREE.Mesh(
    new THREE.BoxGeometry(platenW, platenH, platenThick),
    MAT.toyoGrey
  );
  fixedPlaten.position.set(0, 0, fixedPlatenZ);
  fixedPlaten.castShadow = true;
  fixedPlaten.receiveShadow = true;
  machineGroup.add(fixedPlaten);

  // Platen Top Machined Robot Mounting Shelf
  const topShelf = new THREE.Mesh(
    new THREE.BoxGeometry(platenW * 0.78, 45, platenThick * 1.5),
    MAT.platenSteel
  );
  topShelf.position.set(0, platenH / 2 + 22, fixedPlatenZ);
  topShelf.castShadow = true;
  machineGroup.add(topShelf);

  // Cast Pockets on Fixed Platen
  [-1, 1].forEach(side => {
    const pocket = new THREE.Mesh(
      new THREE.BoxGeometry(18, platenH * 0.28, platenThick * 0.6),
      MAT.castRecess
    );
    pocket.position.set(side * (platenW / 2 - 8), platenH * 0.22, fixedPlatenZ);
    machineGroup.add(pocket);

    const pocketB = new THREE.Mesh(
      new THREE.BoxGeometry(18, platenH * 0.28, platenThick * 0.6),
      MAT.castRecess
    );
    pocketB.position.set(side * (platenW / 2 - 8), -platenH * 0.22, fixedPlatenZ);
    machineGroup.add(pocketB);
  });

  // Center Shot Sleeve Bore (Pour hole)
  const shotHole = new THREE.Mesh(
    new THREE.CylinderGeometry(
      machine.standardPlungerDia ? machine.standardPlungerDia / 2 + 15 : 60,
      machine.standardPlungerDia ? machine.standardPlungerDia / 2 + 15 : 60,
      platenThick + 8,
      24
    ),
    MAT.castRecess
  );
  shotHole.rotation.x = Math.PI / 2;
  shotHole.position.set(0, shotSleeveY, fixedPlatenZ);
  machineGroup.add(shotHole);

  // Shot Sleeve Cylinder
  const shotSleeve = new THREE.Mesh(
    new THREE.CylinderGeometry(65, 70, shotSleeveLen, 24),
    MAT.jointDark
  );
  shotSleeve.rotation.x = Math.PI / 2;
  shotSleeve.position.set(0, shotSleeveY, fixedPlatenZ - shotSleeveLen / 2);
  machineGroup.add(shotSleeve);

  // Shot Sleeve Pouring Port (Molten metal ladle pour port)
  const pourPort = new THREE.Mesh(
    new THREE.CylinderGeometry(40, 40, 45, 16),
    MAT.platenSteel
  );
  pourPort.position.set(0, shotSleeveY + 65, fixedPlatenZ - 280);
  machineGroup.add(pourPort);

  // Injection Plunger Rod (advances during 02_INJECTION)
  const plungerRodMesh = new THREE.Mesh(
    new THREE.CylinderGeometry(
      machine.standardPlungerDia ? machine.standardPlungerDia / 2 : 45,
      machine.standardPlungerDia ? machine.standardPlungerDia / 2 : 45,
      shotSleeveLen * 0.65,
      20
    ),
    MAT.chromeTieBar
  );
  plungerRodMesh.rotation.x = Math.PI / 2;
  plungerRodMesh.position.set(0, shotSleeveY, fixedPlatenZ - shotSleeveLen + 150);
  machineGroup.add(plungerRodMesh);

  // 4 Chrome Tie-Bars spanning the machine
  const halfH = machine.tieBarClearanceH / 2;
  const halfV = machine.tieBarClearanceV / 2;
  const tbRadius = machine.tieBarDiameter / 2;
  const tbTotalLength = Math.max(3000, (machine.machineLengthMm || 6000) * 0.55);

  const tbGeo = new THREE.CylinderGeometry(tbRadius, tbRadius, tbTotalLength, 24);
  tbGeo.rotateX(Math.PI / 2);

  const tbCenterH = halfH + tbRadius;
  const tbCenterV = halfV + tbRadius;

  const corners: [number, number][] = [
    [-tbCenterH, -tbCenterV],
    [tbCenterH, -tbCenterV],
    [tbCenterH, tbCenterV],
    [-tbCenterH, tbCenterV]
  ];

  corners.forEach(([tx, ty]) => {
    const tb = new THREE.Mesh(tbGeo, MAT.chromeTieBar);
    tb.position.set(tx, ty, fixedPlatenZ + tbTotalLength * 0.4);
    tb.castShadow = true;
    machineGroup.add(tb);

    // Front Clamping Tie-Bar Nut
    const nutF = new THREE.Mesh(
      new THREE.CylinderGeometry(tbRadius * 1.5, tbRadius * 1.5, 75, 6),
      MAT.jointDark
    );
    nutF.rotation.x = Math.PI / 2;
    nutF.position.set(tx, ty, fixedPlatenZ - platenThick / 2 - 38);
    machineGroup.add(nutF);

    // Rear Clamping Nut
    const nutR = new THREE.Mesh(
      new THREE.CylinderGeometry(tbRadius * 1.5, tbRadius * 1.5, 75, 6),
      MAT.jointDark
    );
    nutR.rotation.x = Math.PI / 2;
    nutR.position.set(tx, ty, fixedPlatenZ + tbTotalLength * 0.85);
    machineGroup.add(nutR);
  });

  // Machine Base Bed & Slide Rails
  const bedWidth = platenW * 0.95;
  const bedHeight = 220;
  const bedLength = Math.max(3800, (machine.machineLengthMm || 6500) * 0.7);
  const bedY = -platenH / 2 - bedHeight / 2 - 10;
  const bedZ = fixedPlatenZ + bedLength * 0.4;

  const bed = new THREE.Mesh(
    new THREE.BoxGeometry(bedWidth, bedHeight, bedLength),
    MAT.toyoGreen
  );
  bed.position.set(0, bedY, bedZ);
  bed.receiveShadow = true;
  machineGroup.add(bed);

  // Machine Bed Rails
  [-1, 1].forEach(side => {
    const rail = new THREE.Mesh(
      new THREE.BoxGeometry(90, 25, bedLength * 0.95),
      MAT.platenSteel
    );
    rail.position.set(side * (bedWidth * 0.38), bedY + bedHeight / 2 + 12, bedZ);
    machineGroup.add(rail);
  });

  // Scrap Chute
  const chute = new THREE.Mesh(
    new THREE.BoxGeometry(bedWidth * 0.6, 60, 600),
    MAT.castRecess
  );
  chute.position.set(0, bedY + bedHeight / 2 - 10, fixedDieZ + 350);
  machineGroup.add(chute);

  // Accumulator Bottles
  const bottleCount = machine.clampingForceTons > 600 ? 3 : 2;
  for (let i = 0; i < bottleCount; i++) {
    const bX = (i - (bottleCount - 1) / 2) * 180;
    const bottle = new THREE.Mesh(
      new THREE.CylinderGeometry(75, 75, 750, 20),
      MAT.toyoGreen
    );
    bottle.position.set(bX, shotSleeveY + 280, fixedPlatenZ - shotSleeveLen - 200);
    machineGroup.add(bottle);

    const bGauge = new THREE.Mesh(
      new THREE.CylinderGeometry(18, 18, 12, 16),
      MAT.brass
    );
    bGauge.position.set(bX, shotSleeveY + 680, fixedPlatenZ - shotSleeveLen - 200);
    machineGroup.add(bGauge);
  }

  // Plunger Lubricator Unit
  const lubeUnitX = 140;
  const lubeUnitY = shotSleeveY + 200;
  const lubeUnitZ = fixedPlatenZ - 280;

  const lubeBracket = new THREE.Mesh(
    new THREE.BoxGeometry(80, 160, 90),
    MAT.jointDark
  );
  lubeBracket.position.set(lubeUnitX, lubeUnitY, lubeUnitZ);
  machineGroup.add(lubeBracket);

  const lubeTank = new THREE.Mesh(
    new THREE.CylinderGeometry(35, 35, 120, 16),
    MAT.screenGlass
  );
  lubeTank.position.set(lubeUnitX, lubeUnitY + 110, lubeUnitZ);
  machineGroup.add(lubeTank);

  // Operator Console HMI
  const consoleX = platenW * 0.5 + 400;
  const consoleY = -200;
  const consoleZ = fixedPlatenZ + 150;

  const hmiCabinet = new THREE.Mesh(
    new THREE.BoxGeometry(320, 1200, 240),
    MAT.cabinetGrey
  );
  hmiCabinet.position.set(consoleX, consoleY, consoleZ);
  machineGroup.add(hmiCabinet);

  const hmiScreen = new THREE.Mesh(
    new THREE.BoxGeometry(20, 260, 200),
    MAT.screenGlass
  );
  hmiScreen.position.set(consoleX - 160, consoleY + 240, consoleZ);
  machineGroup.add(hmiScreen);

  // Fixed Die Half (bolted to Fixed Platen)
  const fixedDieBlock = new THREE.Mesh(
    new THREE.BoxGeometry(die.dimensions.width, die.dimensions.height, depth),
    MAT.dieSteelH13
  );
  fixedDieBlock.position.set(0, 0, fixedDieZ - depth / 2);
  fixedDieBlock.castShadow = true;
  machineGroup.add(fixedDieBlock);

  const fixedParting = new THREE.Mesh(
    new THREE.BoxGeometry(die.dimensions.width * 0.96, die.dimensions.height * 0.96, 6),
    MAT.partingBevel
  );
  fixedParting.position.set(0, 0, fixedDieZ - 3);
  machineGroup.add(fixedParting);

  // Fixed Die Sprue Bushing
  const sprueBush = new THREE.Mesh(
    new THREE.CylinderGeometry(48, 48, depth + 8, 24),
    MAT.cavityDarkEDM
  );
  sprueBush.rotation.x = Math.PI / 2;
  sprueBush.position.set(0, shotSleeveY, fixedDieZ - depth / 2);
  machineGroup.add(sprueBush);

  // =========================================================================
  // B. DYNAMIC TRAVELING ASSEMBLY (movingAssemblyGroup)
  // =========================================================================
  movingAssemblyGroup.position.set(0, 0, closedMovPlatenZ);

  // Movable Platen Block
  const movPlaten = new THREE.Mesh(
    new THREE.BoxGeometry(movPlatenW, movPlatenH, platenThick),
    MAT.toyoGrey
  );
  movPlaten.position.set(0, 0, 0);
  movPlaten.castShadow = true;
  movPlaten.receiveShadow = true;
  movingAssemblyGroup.add(movPlaten);

  // Movable Platen Top Shelf Deck
  const movShelf = new THREE.Mesh(
    new THREE.BoxGeometry(movPlatenW * 0.78, 45, platenThick * 1.5),
    MAT.platenSteel
  );
  movShelf.position.set(0, movPlatenH / 2 + 22, 0);
  movingAssemblyGroup.add(movShelf);

  // Bronze Guide Shoes
  [-1, 1].forEach(side => {
    const shoe = new THREE.Mesh(
      new THREE.BoxGeometry(110, 45, platenThick * 1.2),
      MAT.brass
    );
    shoe.position.set(side * (movPlatenW * 0.38), -movPlatenH / 2 - 20, 0);
    movingAssemblyGroup.add(shoe);
  });

  // 4 Tie-Bar Guide Bushings
  corners.forEach(([tx, ty]) => {
    const bushing = new THREE.Mesh(
      new THREE.CylinderGeometry(tbRadius * 1.45, tbRadius * 1.45, platenThick + 16, 20),
      MAT.brass
    );
    bushing.rotation.x = Math.PI / 2;
    bushing.position.set(tx, ty, 0);
    movingAssemblyGroup.add(bushing);
  });

  // Ejector Hydraulic Cylinder
  const ejectorCyl = new THREE.Mesh(
    new THREE.CylinderGeometry(85, 85, machine.ejectorStroke + 180, 24),
    MAT.jointDark
  );
  ejectorCyl.rotation.x = Math.PI / 2;
  ejectorCyl.position.set(0, 0, platenThick / 2 + (machine.ejectorStroke + 180) / 2);
  movingAssemblyGroup.add(ejectorCyl);

  // Movable Die Half (Bolted to Movable Platen)
  const movDieRelZ = -platenThick / 2 - depth / 2;
  const movDieBlock = new THREE.Mesh(
    new THREE.BoxGeometry(die.dimensions.width, die.dimensions.height, depth),
    MAT.dieSteelH13
  );
  movDieBlock.position.set(0, 0, movDieRelZ);
  movDieBlock.castShadow = true;
  movingAssemblyGroup.add(movDieBlock);

  const movParting = new THREE.Mesh(
    new THREE.BoxGeometry(die.dimensions.width * 0.96, die.dimensions.height * 0.96, 6),
    MAT.partingBevel
  );
  movParting.position.set(0, 0, movDieRelZ + depth / 2 - 3);
  movingAssemblyGroup.add(movParting);

  // Ejector Pins Sub-Assembly
  const ejectorPinsGroup = new THREE.Group();
  ejectorPinsGroup.name = 'DCM_Ejector_Pins';
  movingAssemblyGroup.add(ejectorPinsGroup);

  // Corner and center ejector pins
  const pinCornerOffsets: [number, number][] = [
    [-die.dimensions.width * 0.28, -die.dimensions.height * 0.28],
    [die.dimensions.width * 0.28, -die.dimensions.height * 0.28],
    [die.dimensions.width * 0.28, die.dimensions.height * 0.28],
    [-die.dimensions.width * 0.28, die.dimensions.height * 0.28],
    [0, shotSleeveY]
  ];

  pinCornerOffsets.forEach(([px, py]) => {
    const pin = new THREE.Mesh(
      new THREE.CylinderGeometry(8, 8, depth * 1.25, 16),
      MAT.ejectorPinSteel
    );
    pin.rotation.x = Math.PI / 2;
    pin.position.set(px, py, movDieRelZ);
    ejectorPinsGroup.add(pin);
  });

  // Ejector Hydraulic Piston Rod
  const ejectorRod = new THREE.Mesh(
    new THREE.CylinderGeometry(40, 40, machine.ejectorStroke + 120, 20),
    MAT.chromeTieBar
  );
  ejectorRod.rotation.x = Math.PI / 2;
  ejectorRod.position.set(0, 0, platenThick / 2 + 50);
  ejectorPinsGroup.add(ejectorRod);

  // =========================================================================
  // C. DYNAMIC MOLTEN METAL CAVITY FILL MESH
  // =========================================================================
  const moltenCavityMaterial = MAT.moltenMetal.clone();
  const fillGroup = new THREE.Group();
  fillGroup.name = 'DCM_Molten_Fill';

  const biscuit = new THREE.Mesh(
    new THREE.CylinderGeometry(45, 48, 28, 24),
    moltenCavityMaterial
  );
  biscuit.rotation.x = Math.PI / 2;
  biscuit.position.set(0, shotSleeveY, 0);
  fillGroup.add(biscuit);

  const runner = new THREE.Mesh(
    new THREE.BoxGeometry(die.dimensions.width * 0.45, 24, 20),
    moltenCavityMaterial
  );
  runner.position.set(0, shotSleeveY * 0.5, 0);
  fillGroup.add(runner);

  const castPartPlate = new THREE.Mesh(
    new THREE.BoxGeometry(die.dimensions.width * 0.55, die.dimensions.height * 0.48, 28),
    moltenCavityMaterial
  );
  castPartPlate.position.set(0, 0, 0);
  fillGroup.add(castPartPlate);

  const moltenCavityFillMesh = fillGroup as unknown as THREE.Mesh;
  moltenCavityFillMesh.position.set(0, 0, fixedDieZ);
  moltenCavityFillMesh.visible = false;
  machineGroup.add(fillGroup);

  // =========================================================================
  // D. KINEMATICS UPDATE HANDLER
  // =========================================================================
  const updateKinematics = (
    platenOpenPct: number,
    platenOpenDistMm: number,
    ejectorMm: number,
    injectionFillPct: number,
    currentPhase: CellCyclePhase
  ) => {
    // 1. Moving Platen Z position
    const openOffsetZ = (Math.max(0, Math.min(100, platenOpenPct)) / 100) * platenOpenDistMm;
    movingAssemblyGroup.position.z = closedMovPlatenZ + openOffsetZ;

    // 2. Ejector Pins along Z (extends towards negative local Z)
    ejectorPinsGroup.position.z = -Math.max(0, Math.min(65, ejectorMm));

    // 3. Injection Plunger Stroke inside shot sleeve during 02_INJECTION
    if (currentPhase === '02_INJECTION') {
      const pProg = Math.max(0, Math.min(1, injectionFillPct / 100));
      const strokeDist = 280;
      plungerRodMesh.position.z = fixedPlatenZ - shotSleeveLen + 150 + pProg * strokeDist;
    } else if (currentPhase === '01_MOLD_CLOSE') {
      plungerRodMesh.position.z = fixedPlatenZ - shotSleeveLen + 150;
    }

    // 4. Molten Metal Fill Mesh Animation
    const movPartingZ = movingAssemblyGroup.position.z - platenThick / 2 - depth / 2 + depth / 2;

    if (currentPhase === '01_MOLD_CLOSE') {
      moltenCavityFillMesh.visible = false;
      moltenCavityMaterial.emissiveIntensity = 0;
    } else if (currentPhase === '02_INJECTION') {
      moltenCavityFillMesh.visible = true;
      moltenCavityFillMesh.position.set(0, 0, fixedDieZ);
      const fillProg = injectionFillPct / 100;

      if (fillProg < 0.99) {
        // Fast injection: bright emissive orange
        const s = 0.2 + fillProg * 0.8;
        moltenCavityFillMesh.scale.set(s, s, 1);
        moltenCavityMaterial.color.setHex(0xff5500);
        moltenCavityMaterial.emissive.setHex(0xff3300);
        moltenCavityMaterial.emissiveIntensity = 2.4;
      } else {
        // Solidification & dwell cooling
        moltenCavityFillMesh.scale.set(1, 1, 1);
        const coolProg = Math.max(0, Math.min(1, (injectionFillPct - 80) / 20));
        moltenCavityMaterial.emissiveIntensity = Math.max(0, 2.4 * (1 - coolProg));
        moltenCavityMaterial.color.lerpColors(
          new THREE.Color(0xff5500),
          new THREE.Color(0xd1d5db),
          coolProg
        );
      }
    } else if (currentPhase === '03_MOLD_OPEN' || currentPhase === '04_SPRAY_LUBE') {
      moltenCavityFillMesh.visible = true;
      moltenCavityFillMesh.scale.set(1, 1, 1);
      moltenCavityMaterial.color.setHex(0xd1d5db);
      moltenCavityMaterial.emissiveIntensity = 0;
      moltenCavityFillMesh.position.set(0, 0, movPartingZ - ejectorMm);
    } else if (currentPhase === '05_PART_EXTRACTION') {
      const isExtracted = ejectorMm === 0;
      moltenCavityFillMesh.visible = !isExtracted;
      moltenCavityFillMesh.position.set(0, 0, movPartingZ - ejectorMm);
    } else {
      moltenCavityFillMesh.visible = false;
      moltenCavityMaterial.emissiveIntensity = 0;
    }
  };

  const dispose = () => {
    moltenCavityMaterial.dispose();
  };

  return {
    movingAssemblyGroup,
    ejectorPinsGroup,
    plungerRodMesh,
    moltenCavityFillMesh,
    moltenCavityMaterial,
    closedMovPlatenZ,
    fixedPlatenZ,
    depth,
    updateKinematics,
    dispose
  };
}

/**
 * Creates 6-Axis Extractor Floor Robot Rig with Pneumatic Part Gripper EOAT
 */
export function createExtractorRobotRig(
  armGroup: THREE.Group,
  machine: DieCastingMachine,
  die: DieModel
): ExtractorRobotRig {
  while (armGroup.children.length > 0) {
    armGroup.remove(armGroup.children[0]);
  }

  const platenW = machine.platenWidth;
  const platenH = machine.platenHeight;
  const daylightCenterZ = (die.fixedDieOffsetZ + die.movableDieOffsetZ) / 2;

  // Base Pedestal on floor beside tie bars
  const basePos = new THREE.Vector3(
    platenW * 0.52 + 380,
    -platenH * 0.5 - 20,
    daylightCenterZ + 180
  );

  // 1. Floor Pedestal Structure
  const pedestalGroup = new THREE.Group();
  pedestalGroup.position.copy(basePos);
  armGroup.add(pedestalGroup);

  const basePlate = new THREE.Mesh(
    new THREE.BoxGeometry(520, 35, 520),
    MAT.jointDark
  );
  pedestalGroup.add(basePlate);

  const hazardBorder = new THREE.Mesh(
    new THREE.BoxGeometry(540, 10, 540),
    MAT.safetyYellow
  );
  hazardBorder.position.y = -18;
  pedestalGroup.add(hazardBorder);

  const riser = new THREE.Mesh(
    new THREE.CylinderGeometry(130, 145, 480, 24),
    MAT.cabinetGrey
  );
  riser.position.y = 250;
  pedestalGroup.add(riser);

  // Robot Base Turn Table (J1)
  const j1Group = new THREE.Group();
  j1Group.position.set(basePos.x, basePos.y + 490, basePos.z);
  armGroup.add(j1Group);

  const j1Base = new THREE.Mesh(
    new THREE.CylinderGeometry(150, 160, 110, 24),
    MAT.fanucYellow
  );
  j1Group.add(j1Base);

  // Robot Shoulder (J2)
  const j2Group = new THREE.Group();
  j2Group.position.set(0, 95, 0);
  j1Group.add(j2Group);

  const j2Shoulder = new THREE.Mesh(
    new THREE.BoxGeometry(190, 180, 200),
    MAT.fanucYellow
  );
  j2Group.add(j2Shoulder);

  // Upper Arm Link (J3)
  const j3Group = new THREE.Group();
  j3Group.position.set(0, 90, 0);
  j2Group.add(j3Group);

  const upperArm = new THREE.Mesh(
    new THREE.BoxGeometry(130, 480, 140),
    MAT.fanucYellow
  );
  upperArm.position.y = 240;
  j3Group.add(upperArm);

  // Forearm & Elbow (J4)
  const j4Group = new THREE.Group();
  j4Group.position.set(0, 480, 0);
  j3Group.add(j4Group);

  const elbow = new THREE.Mesh(
    new THREE.SphereGeometry(85, 20, 20),
    MAT.jointDark
  );
  j4Group.add(elbow);

  const forearm = new THREE.Mesh(
    new THREE.CylinderGeometry(65, 75, 450, 20),
    MAT.fanucYellow
  );
  forearm.position.y = 225;
  j4Group.add(forearm);

  // Wrist Pitch Link (J5)
  const j5Group = new THREE.Group();
  j5Group.position.set(0, 450, 0);
  j4Group.add(j5Group);

  const wrist = new THREE.Mesh(
    new THREE.BoxGeometry(110, 90, 110),
    MAT.jointDark
  );
  j5Group.add(wrist);

  // Wrist Roll Flange (J6) & Gripper EOAT
  const j6Group = new THREE.Group();
  j6Group.position.set(0, 45, 0);
  j5Group.add(j6Group);

  // Pneumatic Part Gripper EOAT
  const gripperBody = new THREE.Mesh(
    new THREE.BoxGeometry(320, 55, 75),
    MAT.gripperBody
  );
  j6Group.add(gripperBody);

  [-1, 1].forEach(side => {
    const cyl = new THREE.Mesh(
      new THREE.CylinderGeometry(22, 22, 90, 16),
      MAT.gripperPneumatic
    );
    cyl.rotation.z = Math.PI / 2;
    cyl.position.set(side * 85, 0, -45);
    j6Group.add(cyl);
  });

  const jaw1 = new THREE.Mesh(
    new THREE.BoxGeometry(25, 75, 55),
    MAT.gripperJaw
  );
  jaw1.position.set(-60, 35, 0);
  j6Group.add(jaw1);

  const jaw2 = new THREE.Mesh(
    new THREE.BoxGeometry(25, 75, 55),
    MAT.gripperJaw
  );
  jaw2.position.set(60, 35, 0);
  j6Group.add(jaw2);

  const gripperJaws = [jaw1, jaw2];

  // Part Present Sensor LED
  const sensorLed = new THREE.Mesh(
    new THREE.SphereGeometry(9, 12, 12),
    MAT.gripperSensorGreen
  );
  sensorLed.position.set(0, 30, 40);
  sensorLed.visible = false;
  j6Group.add(sensorLed);

  // Extracted Part Mesh attached to Gripper
  const partMeshHolder = new THREE.Group();
  partMeshHolder.name = 'Gripper_Part_Holder';
  partMeshHolder.position.set(0, 45, 0);
  j6Group.add(partMeshHolder);

  const partMesh = new THREE.Mesh(
    new THREE.BoxGeometry(180, 140, 26),
    MAT.aluminumPart
  );
  partMesh.visible = false;
  partMeshHolder.add(partMesh);

  // Kinematics Update
  const updateExtractionKinematics = (
    phase: CellCyclePhase,
    progress: number,
    isPartGripped: boolean
  ) => {
    if (phase === '05_PART_EXTRACTION') {
      const p = Math.max(0, Math.min(1, progress));

      if (p < 0.28) {
        // Entering daylight between tie bars
        const s = p / 0.28;
        j1Group.rotation.y = -1.3 + s * 1.15; // -75 deg to -9 deg
        j2Group.rotation.z = -0.6 + s * 1.15;
        j3Group.rotation.z = 0.95 - s * 1.3;
        j4Group.rotation.y = 0;
        j5Group.rotation.z = -0.4 + s * 0.2;
        jaw1.position.x = -65;
        jaw2.position.x = 65;
        sensorLed.visible = false;
        partMesh.visible = false;
      } else if (p < 0.38) {
        // Gripping part
        const s = (p - 0.28) / 0.10;
        jaw1.position.x = -65 + s * 40;
        jaw2.position.x = 65 - s * 40;
        sensorLed.visible = true;
        partMesh.visible = isPartGripped;
      } else if (p < 0.65) {
        // Retracting part out of die and clearing tie bars
        const s = (p - 0.38) / 0.27;
        j1Group.rotation.y = -0.15 - s * 0.8;
        j2Group.rotation.z = 0.55 - s * 0.4;
        j3Group.rotation.z = -0.35 + s * 0.7;
        j5Group.rotation.z = -0.2 - s * 0.2;
        jaw1.position.x = -25;
        jaw2.position.x = 25;
        sensorLed.visible = true;
        partMesh.visible = true;
      } else if (p < 0.88) {
        // Swing over quench water tank / drop table
        const s = (p - 0.65) / 0.23;
        j1Group.rotation.y = -0.95 - s * 1.1; // -120 deg
        j2Group.rotation.z = 0.15 + s * 0.35;
        j3Group.rotation.z = 0.35 - s * 0.5;
        j5Group.rotation.z = -0.4 + s * 0.1;
        jaw1.position.x = -25;
        jaw2.position.x = 25;
        sensorLed.visible = true;
        partMesh.visible = true;
      } else {
        // Drop part and begin folding arm back
        const s = (p - 0.88) / 0.12;
        jaw1.position.x = -25 - s * 40;
        jaw2.position.x = 25 + s * 40;
        sensorLed.visible = false;
        partMesh.visible = false;
        j1Group.rotation.y = -2.05 + s * 0.75;
        j2Group.rotation.z = 0.5 - s * 1.1;
        j3Group.rotation.z = -0.15 + s * 1.1;
      }
    } else {
      // HOME_STANDBY: arm tucked outside tie-bar envelope
      j1Group.rotation.y = -1.3;
      j2Group.rotation.z = -0.6;
      j3Group.rotation.z = 0.95;
      j4Group.rotation.y = 0;
      j5Group.rotation.z = -0.4;
      jaw1.position.x = -65;
      jaw2.position.x = 65;
      sensorLed.visible = false;
      partMesh.visible = false;
    }
  };

  const dispose = () => {
    while (armGroup.children.length > 0) {
      armGroup.remove(armGroup.children[0]);
    }
  };

  return {
    group: armGroup,
    gripperFlangeGroup: j6Group,
    gripperJaws,
    partMeshHolder,
    partMesh,
    updateExtractionKinematics,
    dispose
  };
}

/**
 * Builds Taiwanese Factory Automation Equipment
 */
export function buildFactoryEquipment(
  group: THREE.Group,
  config: FactoryEquipmentConfig,
  machine: DieCastingMachine,
  die: DieModel
) {
  while (group.children.length > 0) {
    group.remove(group.children[0]);
  }

  if (!config.realFactoryMode) return;

  const platenW = machine.platenWidth;
  const platenH = machine.platenHeight;
  const fixedZ = die.fixedDieOffsetZ - 180;
  const movZ = die.movableDieOffsetZ + 180;
  const daylightCenterZ = (die.fixedDieOffsetZ + die.movableDieOffsetZ) / 2;

  // 1. AUTOMATIC STROKE DOSING FURNACE (頂出式定量爐)
  if (config.showDosingFurnace) {
    const furnaceX = - (platenW * 0.5 + 850);
    const furnaceY = -250;
    const furnaceZ = fixedZ - 420;

    // Cylindrical Refractory Insulated Body
    const furnaceBody = new THREE.Mesh(
      new THREE.CylinderGeometry(480, 520, 1100, 32),
      MAT.furnaceRefractory
    );
    furnaceBody.position.set(furnaceX, furnaceY, furnaceZ);
    furnaceBody.castShadow = true;
    group.add(furnaceBody);

    // Top Charging Lid & Heating Coil Housing
    const furnaceLid = new THREE.Mesh(
      new THREE.CylinderGeometry(540, 540, 90, 32),
      MAT.jointDark
    );
    furnaceLid.position.set(furnaceX, furnaceY + 590, furnaceZ);
    group.add(furnaceLid);

    // Pneumatic Dosing Cylinder on Furnace Top
    const doseCyl = new THREE.Mesh(
      new THREE.CylinderGeometry(55, 55, 360, 16),
      MAT.platenSteel
    );
    doseCyl.position.set(furnaceX + 120, furnaceY + 800, furnaceZ);
    group.add(doseCyl);

    // Heated Ceramic Dosing Launder / Pouring Spout leading to Shot Sleeve
    try {
      const spoutCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(furnaceX + 240, furnaceY + 540, furnaceZ),
        new THREE.Vector3(furnaceX * 0.4, furnaceY + 280, fixedZ - 300),
        new THREE.Vector3(0, machine.injectionAxisOffsetY + 110, fixedZ - 280)
      ]);
      const spout = new THREE.Mesh(
        new THREE.TubeGeometry(spoutCurve, 16, 28, 12, false),
        MAT.furnaceRefractory
      );
      group.add(spout);
    } catch (e) {
      // Ignore
    }
  }

  // 2. EXTRACTOR ROBOT (取件機器人)
  // Intentionally disabled in the primary simulation scene to prevent visual confusion.
  // The simulation scene maintains ONE authoritative primary 6-axis spray robot.
  // The data model flag config.showExtractorRobot is preserved for compatibility.

  // 3. QUENCH WATER TANK & WIRE-MESH FLIGHT CONVEYOR (冷卻水槽輸送帶)
  if (config.showQuenchConveyor) {
    const convX = platenW * 0.5 + 750;
    const convY = -620;
    const convZ = daylightCenterZ + 300;

    // Stainless Quench Water Tank
    const tank = new THREE.Mesh(
      new THREE.BoxGeometry(650, 360, 1200),
      MAT.platenSteel
    );
    tank.position.set(convX, convY, convZ);
    tank.castShadow = true;
    group.add(tank);

    // Water Surface
    const water = new THREE.Mesh(
      new THREE.BoxGeometry(620, 20, 1160),
      MAT.quenchWater
    );
    water.position.set(convX, convY + 160, convZ);
    group.add(water);

    // Inclined Slat Flight Conveyor
    const conveyorBelt = new THREE.Mesh(
      new THREE.BoxGeometry(450, 40, 1500),
      MAT.conduitBlack
    );
    conveyorBelt.rotation.x = -0.32;
    conveyorBelt.position.set(convX, convY + 220, convZ + 550);
    group.add(conveyorBelt);

    // Drive Motor Reducer
    const driveMotor = new THREE.Mesh(
      new THREE.CylinderGeometry(55, 55, 180, 16),
      MAT.jointDark
    );
    driveMotor.position.set(convX + 260, convY + 420, convZ + 1200);
    group.add(driveMotor);
  }

  // 4. HYDRAULIC 4-PILLAR TRIM PRESS (油壓切邊機)
  if (config.showTrimPress) {
    const pressX = platenW * 0.5 + 850;
    const pressY = -200;
    const pressZ = daylightCenterZ + 1900;

    // Base Bed
    const pressBed = new THREE.Mesh(
      new THREE.BoxGeometry(850, 240, 750),
      MAT.toyoGreen
    );
    pressBed.position.set(pressX, pressY - 480, pressZ);
    group.add(pressBed);

    // Top Crown
    const pressCrown = new THREE.Mesh(
      new THREE.BoxGeometry(850, 220, 750),
      MAT.toyoGreen
    );
    pressCrown.position.set(pressX, pressY + 540, pressZ);
    group.add(pressCrown);

    // Hydraulic Main Ram Cylinder
    const pressCyl = new THREE.Mesh(
      new THREE.CylinderGeometry(110, 110, 360, 20),
      MAT.jointDark
    );
    pressCyl.position.set(pressX, pressY + 760, pressZ);
    group.add(pressCyl);

    // 4 Guide Pillars
    [-340, 340].forEach(px => {
      [-280, 280].forEach(pz => {
        const pillar = new THREE.Mesh(
          new THREE.CylinderGeometry(35, 35, 960, 16),
          MAT.chromeTieBar
        );
        pillar.position.set(pressX + px, pressY + 30, pressZ + pz);
        group.add(pillar);
      });
    });

    // Moving Upper Trim Die Platen
    const movingPlaten = new THREE.Mesh(
      new THREE.BoxGeometry(720, 120, 620),
      MAT.platenSteel
    );
    movingPlaten.position.set(pressX, pressY + 120, pressZ);
    group.add(movingPlaten);
  }

  // 5. SCRAP & RUNNER HOPPER BIN (廢料回爐箱)
  if (config.showScrapBin) {
    const binX = platenW * 0.5 + 280;
    const binY = -680;
    const binZ = daylightCenterZ + 1850;

    const scrapBin = new THREE.Mesh(
      new THREE.BoxGeometry(540, 380, 650),
      MAT.toyoGreen
    );
    scrapBin.position.set(binX, binY, binZ);
    group.add(scrapBin);

    // Forklift Skid Channels on bottom
    [-180, 180].forEach(bx => {
      const channel = new THREE.Mesh(
        new THREE.BoxGeometry(70, 50, 660),
        MAT.jointDark
      );
      channel.position.set(binX + bx, binY - 210, binZ);
      group.add(channel);
    });

    // Aluminum Trimmings Scrap inside
    const scraps = new THREE.Mesh(
      new THREE.BoxGeometry(460, 60, 580),
      MAT.aluminumPart
    );
    scraps.position.set(binX, binY + 140, binZ);
    group.add(scraps);
  }

  // 6. PRESSURIZED DIE LUBE MIXING & DOSING TANK STATION (離型劑配比壓送系統)
  if (config.showReleaseAgentTank) {
    const tankX = - (platenW * 0.5 + 460);
    const tankY = -450;
    const tankZ = daylightCenterZ - 900;

    // Dual Stainless Cylindrical Pressure Vessels (Tank A & Tank B)
    [-110, 110].forEach((tx, idx) => {
      const vessel = new THREE.Mesh(
        new THREE.CylinderGeometry(85, 85, 580, 20),
        MAT.platenSteel
      );
      vessel.position.set(tankX + tx, tankY + 140, tankZ);
      group.add(vessel);

      // Pressure Gauge
      const pGauge = new THREE.Mesh(
        new THREE.CylinderGeometry(16, 16, 10, 16),
        MAT.brass
      );
      pGauge.position.set(tankX + tx, tankY + 460, tankZ);
      group.add(pGauge);
    });

    // Mixing Proportional Pump Cabinet
    const mixCabinet = new THREE.Mesh(
      new THREE.BoxGeometry(320, 480, 260),
      MAT.toyoGreen
    );
    mixCabinet.position.set(tankX, tankY - 180, tankZ);
    group.add(mixCabinet);

    // Main Supply Umbilical Conduit running from tank up to platen top / robot
    try {
      const hoseCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(tankX, tankY + 420, tankZ),
        new THREE.Vector3(tankX * 0.6, platenH * 0.2, tankZ),
        new THREE.Vector3(0, platenH / 2 + 100, fixedZ - 120)
      ]);
      const feedHose = new THREE.Mesh(
        new THREE.TubeGeometry(hoseCurve, 16, 14, 8, false),
        MAT.conduitBlack
      );
      group.add(feedHose);
    } catch (e) {
      // Ignore
    }
  }

  // 7. MOLD TEMPERATURE CONTROLLER & WATER MANIFOLD (模溫機與水排)
  if (config.showMoldCoolingWater) {
    const tcuX = - (platenW * 0.5 + 380);
    const tcuY = -420;
    const tcuZ = daylightCenterZ + 450;

    // Dual-Zone Mold Temperature Controller (TCU)
    const tcuBox = new THREE.Mesh(
      new THREE.BoxGeometry(340, 680, 480),
      MAT.cabinetGrey
    );
    tcuBox.position.set(tcuX, tcuY, tcuZ);
    group.add(tcuBox);

    // Digital Temperature Displays
    const tcuDisplay = new THREE.Mesh(
      new THREE.BoxGeometry(10, 80, 140),
      MAT.screenGlass
    );
    tcuDisplay.position.set(tcuX + 172, tcuY + 180, tcuZ);
    group.add(tcuDisplay);

    // Water Manifold Bar with Multi-Port Quick Disconnects
    const manifoldBar = new THREE.Mesh(
      new THREE.BoxGeometry(45, 320, 60),
      MAT.aluminumPart
    );
    manifoldBar.position.set(tcuX + 180, tcuY - 60, tcuZ);
    group.add(manifoldBar);

    // Braided Hoses to Die Cavity
    [-80, -20, 40, 100].forEach(hy => {
      const hose = new THREE.Mesh(
        new THREE.CylinderGeometry(8, 8, 220, 8),
        MAT.conduitBlack
      );
      hose.rotation.z = Math.PI / 2;
      hose.position.set(tcuX + 280, tcuY + hy, tcuZ);
      group.add(hose);
    });
  }

  // 8. INTERLOCKED PERIMETER SAFETY FENCING & LIGHT CURTAIN (安全防護圍籬)
  if (config.showSafetyFence) {
    const fenceH = 1400;
    const fenceY = -850 + fenceH / 2;
    const cellW = platenW * 2.8;
    const cellD = 5500;
    const cellCenterX = 0;
    const cellCenterZ = daylightCenterZ + 300;

    const fenceMat = MAT.safetyFenceMesh;
    const postMat = MAT.safetyYellow;

    // Boundary Fence Panels (Left, Back, Right)
    const backFence = new THREE.Mesh(
      new THREE.BoxGeometry(cellW, fenceH, 20),
      fenceMat
    );
    backFence.position.set(cellCenterX, fenceY, cellCenterZ - cellD / 2);
    group.add(backFence);

    const leftFence = new THREE.Mesh(
      new THREE.BoxGeometry(20, fenceH, cellD),
      fenceMat
    );
    leftFence.position.set(cellCenterX - cellW / 2, fenceY, cellCenterZ);
    group.add(leftFence);

    const rightFence = new THREE.Mesh(
      new THREE.BoxGeometry(20, fenceH, cellD),
      fenceMat
    );
    rightFence.position.set(cellCenterX + cellW / 2, fenceY, cellCenterZ);
    group.add(rightFence);

    // Safety Posts at Corners
    const postCorners: [number, number][] = [
      [cellCenterX - cellW / 2, cellCenterZ - cellD / 2],
      [cellCenterX + cellW / 2, cellCenterZ - cellD / 2],
      [cellCenterX - cellW / 2, cellCenterZ + cellD / 2],
      [cellCenterX + cellW / 2, cellCenterZ + cellD / 2]
    ];

    postCorners.forEach(([cx, cz]) => {
      const post = new THREE.Mesh(
        new THREE.BoxGeometry(60, fenceH + 40, 60),
        postMat
      );
      post.position.set(cx, fenceY, cz);
      group.add(post);
    });

    // Front Operator Access Light Curtain Columns (Infrared Safety Sensor)
    [-platenW * 0.7, platenW * 0.7].forEach(lx => {
      const optoPost = new THREE.Mesh(
        new THREE.BoxGeometry(45, 950, 45),
        MAT.safetyYellow
      );
      optoPost.position.set(lx, fenceY - 200, cellCenterZ + cellD / 2);
      group.add(optoPost);

      // Optical emitter lens strip
      const lens = new THREE.Mesh(
        new THREE.BoxGeometry(8, 850, 16),
        MAT.alertRed
      );
      lens.position.set(lx > 0 ? lx - 24 : lx + 24, fenceY - 200, cellCenterZ + cellD / 2);
      group.add(lens);
    });
  }
}

/**
 * Flexible input format for robot pose updates:
 * Either the 6 joint angles [j1, j2, j3, j4, j5, j6] in degrees (authoritative source of truth)
 * or a joint positions object for backwards compatibility.
 */
export type RobotArmPoseInput =
  | [number, number, number, number, number, number]
  | {
      base: [number, number, number];
      shoulder?: [number, number, number];
      elbow?: [number, number, number];
      wristPitch?: [number, number, number];
      wristYaw?: [number, number, number];
      tcp?: [number, number, number];
      jointsDeg?: [number, number, number, number, number, number];
    };

/**
 * Real-time spray emission state interface for EOAT manifold plumes
 */
export interface SprayEmissionState {
  isSpraying: boolean;
  action: 'LUBE_SPRAY' | 'AIR_BLOW' | 'LUBE_AND_AIR' | 'TRANSIT' | 'WAIT';
  targetFace?: 'FIXED_DIE' | 'MOVABLE_DIE' | 'BOTH';
  flowRateMlPerSec?: number;
  showSprayCone?: boolean;
}

/**
 * Authoritative Kinematic Robot Arm Rig Interface
 */
export interface RobotArmRig {
  armGroup: THREE.Group;
  baseGroup: THREE.Group;
  tcpGroup: THREE.Group;
  flangeGroup: THREE.Group;
  jointGroups: [THREE.Group, THREE.Group, THREE.Group, THREE.Group, THREE.Group, THREE.Group];
  sprayEmitterGroup?: THREE.Group;
  updatePose: (
    pose: RobotArmPoseInput,
    tcpMatrix?: number[],
    jointsDegFallback?: [number, number, number, number, number, number]
  ) => void;
  updateSprayEmission?: (state: SprayEmissionState) => void;
  dispose: () => void;
}

/**
 * Builds the static mounting structure (pedestal, gantry, shelf, or deck)
 * Only rebuilt when mount configuration or machine dimensions change.
 */
export function buildRobotMountStructure(
  group: THREE.Group,
  mountConfig: {
    type: RobotMountType;
    topMountStyle?: TopMountStyle;
  },
  robot: RobotModelSpec,
  machine: DieCastingMachine,
  basePos?: [number, number, number]
) {
  while (group.children.length > 0) {
    group.remove(group.children[0]);
  }

  const mountType = mountConfig.type || robot.mountOrientation;
  const base = basePos || (robot.baseOffset ? [robot.baseOffset[0], robot.baseOffset[1], robot.baseOffset[2]] as [number, number, number] : [0, 1600, 0]);

  if (mountType === 'top' || mountType === 'top_machine_mount') {
    const platenThick = Math.max(180, Math.min(320, machine.platenWidth * 0.18));
    const platenH = machine.platenHeight;
    const shelfTopY = platenH / 2 + 45;

    if (mountConfig.topMountStyle === 'platen_direct') {
      // --- WOLLIN PLATEN DIRECT TOP DECK (Rigidly bolted to stationary fixed platen top) ---
      const deckWidth = machine.platenWidth * 0.65;
      const deckDepth = Math.max(480, platenThick * 1.6);
      const deckThick = 45;

      // Machined Steel Riser Turret with bolt flange (Interface between robot base turntable and deck)
      const riserTurretH = 85;
      const riserTurret = new THREE.Mesh(
        new THREE.CylinderGeometry(240, 270, riserTurretH, 32),
        MAT.jointDark
      );
      riserTurret.position.set(base[0], base[1] + riserTurretH / 2, base[2]);
      riserTurret.castShadow = true;
      group.add(riserTurret);

      // Heavy welded structural mounting deck plate (Above riser turret, supporting dosing unit and conduits)
      const deckY = base[1] + riserTurretH + deckThick / 2;
      const mountDeck = new THREE.Mesh(
        new THREE.BoxGeometry(deckWidth, deckThick, deckDepth),
        MAT.toyoGrey
      );
      mountDeck.position.set(base[0], deckY, base[2]);
      mountDeck.castShadow = true;
      group.add(mountDeck);

      // Heavy Structural Support Stanchions anchored directly onto the fixed platen top shelf
      const deckBottomY = base[1] + riserTurretH;
      const stanchionH = Math.max(25, deckBottomY - shelfTopY);
      const stanchionY = shelfTopY + stanchionH / 2;
      [-1, 1].forEach(side => {
        const stanchion = new THREE.Mesh(
          new THREE.BoxGeometry(110, stanchionH, platenThick * 1.1),
          MAT.toyoGrey
        );
        stanchion.position.set(base[0] + side * (deckWidth * 0.35), stanchionY, base[2]);
        stanchion.castShadow = true;
        group.add(stanchion);

        // Bolting clamp flanges with M30 high-tensile hardware
        const boltFlange = new THREE.Mesh(
          new THREE.BoxGeometry(140, 22, platenThick * 1.25),
          MAT.jointDark
        );
        boltFlange.position.set(base[0] + side * (deckWidth * 0.35), shelfTopY + 11, base[2]);
        group.add(boltFlange);
      });

      // Gusset Rib Braces into rear reinforcement ribs of stationary fixed platen (-Z side)
      [-1, 1].forEach(side => {
        const gusset = new THREE.Mesh(new THREE.BoxGeometry(32, 180, 180), MAT.toyoGrey);
        gusset.position.set(base[0] + side * (deckWidth * 0.42), deckY - 90, base[2] - platenThick * 0.55);
        group.add(gusset);
      });

      // Media Dosing Supply Unit mounted on the deck beside robot (Wollin dosing unit)
      const cabinetW = 220;
      const cabinetH = 680;
      const cabinetD = 220;
      const cabX = base[0] + 360;
      const cabY = deckY + deckThick / 2 + cabinetH / 2;
      const cabZ = base[2] - 40;

      const mediaCab = new THREE.Mesh(new THREE.BoxGeometry(cabinetW, cabinetH, cabinetD), MAT.cabinetGrey);
      mediaCab.position.set(cabX, cabY, cabZ);
      mediaCab.castShadow = true;
      group.add(mediaCab);

      // Wollin Signature Turquoise Brand Band
      const brandBand = new THREE.Mesh(new THREE.BoxGeometry(cabinetW + 4, 38, cabinetD + 4), MAT.toolBlue);
      brandBand.position.set(cabX, cabY + 200, cabZ);
      group.add(brandBand);

      // Dual Pressure Gauges
      [-36, 36].forEach(gx => {
        const gauge = new THREE.Mesh(new THREE.CylinderGeometry(18, 18, 10, 16), MAT.platenSteel);
        gauge.rotation.x = Math.PI / 2;
        gauge.position.set(cabX + gx, cabY + 110, cabZ + cabinetD / 2 + 6);
        group.add(gauge);
      });
    } else {
      // Overhead Gantry Bridge Frame (Stationary structure anchored to floor & frame)
      const gantryW = machine.platenWidth * 1.35;
      const gantryBeam = new THREE.Mesh(
        new THREE.BoxGeometry(gantryW, 150, 420),
        MAT.toyoGrey
      );
      gantryBeam.position.set(0, base[1] + 75, base[2]);
      gantryBeam.castShadow = true;
      group.add(gantryBeam);

      const pillarH = (base[1] + 75) - (-850);
      [-1, 1].forEach(side => {
        const pillar = new THREE.Mesh(
          new THREE.BoxGeometry(160, pillarH, 160),
          MAT.toyoGrey
        );
        pillar.position.set(side * (gantryW * 0.48), -850 + pillarH / 2, base[2]);
        group.add(pillar);

        // Foundation foot plate
        const foot = new THREE.Mesh(
          new THREE.BoxGeometry(300, 30, 300),
          MAT.jointDark
        );
        foot.position.set(side * (gantryW * 0.48), -850 + 15, base[2]);
        group.add(foot);
      });
    }
  } else if (mountType === 'floor') {
    // --- FLOOR-ANCHORED HEAVY PEDESTAL ---
    const floorY = -850;
    const pedHeight = Math.max(100, base[1] - floorY);
    const pedRadius = 240;

    // Cylindrical Structural Steel Pedestal
    const pedestal = new THREE.Mesh(
      new THREE.CylinderGeometry(pedRadius, pedRadius * 1.25, pedHeight, 32),
      MAT.toyoGrey
    );
    pedestal.position.set(base[0], floorY + pedHeight / 2, base[2]);
    pedestal.castShadow = true;
    group.add(pedestal);

    // Floor Anchoring Base Flange with M24 Anchor Studs
    const floorFlange = new THREE.Mesh(
      new THREE.CylinderGeometry(pedRadius * 1.5, pedRadius * 1.5, 45, 32),
      MAT.jointDark
    );
    floorFlange.position.set(base[0], floorY + 22, base[2]);
    group.add(floorFlange);

    // 8 Concrete Foundation Anchor Bolts
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const bx = base[0] + Math.cos(angle) * (pedRadius * 1.35);
      const bz = base[2] + Math.sin(angle) * (pedRadius * 1.35);
      const bolt = new THREE.Mesh(new THREE.CylinderGeometry(14, 14, 25, 12), MAT.platenSteel);
      bolt.position.set(bx, floorY + 50, bz);
      group.add(bolt);
    }
  } else if (mountType === 'side') {
    // --- MACHINE BED SIDE FRAME SHELF ---
    const shelfLen = 650;
    const shelfWidth = 550;
    const sideShelf = new THREE.Mesh(
      new THREE.BoxGeometry(shelfLen, 50, shelfWidth),
      MAT.toyoGrey
    );
    sideShelf.position.set(base[0] + 120, base[1] - 25, base[2]);
    group.add(sideShelf);

    // Diagonal Heavy Gussets into Machine Bed
    [-150, 150].forEach(gz => {
      const gusset = new THREE.Mesh(new THREE.BoxGeometry(45, 320, 45), MAT.toyoGrey);
      gusset.rotation.z = -0.6;
      gusset.position.set(base[0] + 200, base[1] - 180, base[2] + gz);
      group.add(gusset);
    });
  } else {
    // REAR CANTILEVER BRACKET
    const rearBeam = new THREE.Mesh(new THREE.BoxGeometry(380, 80, 750), MAT.toyoGrey);
    rearBeam.position.set(base[0], base[1] - 40, base[2] + 320);
    group.add(rearBeam);
  }
}

/**
 * Creates a persistent RobotArmRig that instantiates Three.js geometries ONCE,
 * updating joint transforms efficiently at 60 FPS without scene graph rebuilds.
 */
/**
 * Helper to populate Three.js Matrix4 from row-major 4x4 matrix tuple
 */
function setThreeMatrix4FromRowMajor(target: THREE.Matrix4, m: Matrix4Tuple | number[]) {
  target.set(
    m[0], m[1], m[2], m[3],
    m[4], m[5], m[6], m[7],
    m[8], m[9], m[10], m[11],
    m[12], m[13], m[14], m[15]
  );
}

/**
 * Creates an authoritative kinematic RobotArmRig using a proper Three.js hierarchy:
 * Machine / World frame (armGroup)
 *  └── baseGroup (stationary robot base anchor, positioned and oriented by model.baseTransform.matrix)
 *       ├── [stationary base meshes: mounting flange, bolt ring, connector box]
 *       └── j1Group (rotates about local Z by th1)
 *            ├── [J1 turntable, cast shoulder fork turret, J1 motor housing]
 *            └── j2Group (at [a1, 0, d1], rotates about local Y by th2)
 *                 ├── [J2 shoulder knuckle, counter-torque servo, upper arm link [0, 0, l2]]
 *                 └── j3Group (at [0, 0, l2], rotates about local Y by th3)
 *                      ├── [J3 elbow knuckle, J3/J4 drive housing, forearm link [0, 0, l3]]
 *                      └── j4Group (at [0, 0, l3], rotates about local Z by th4)
 *                           ├── [J4 wrist roll collar]
 *                           └── j5Group (at [0, 0, 0], rotates about local Y by th5)
 *                                ├── [J5 wrist pitch knuckle, link barrel]
 *                                └── j6Group (at [0, 0, 0], rotates about local Z by th6)
 *                                     ├── [J6 flange roll plate]
 *                                     └── flangeGroup (at [0, 0, l4])
 *                                          ├── [ISO 9409-1 tool adapter plate, rigid tool stem]
 *                                          └── tcpGroup (at model.toolTransform.matrix)
 *                                               └── [Rigid tool manifold & nozzles]
 */
export function createRobotArmRig(
  armGroup: THREE.Group,
  robot: RobotModelSpec,
  tool: ToolCenterPoint,
  mountConfig: RobotMountConfig | RobotMountType = 'top'
): RobotArmRig {
  while (armGroup.children.length > 0) {
    armGroup.remove(armGroup.children[0]);
  }

  // Authoritative kinematic model specification
  const mountConfigObj: RobotMountConfig =
    typeof mountConfig === 'string'
      ? {
          type: mountConfig,
          heightMm: robot.baseOffset ? robot.baseOffset[1] : 1600,
          distanceMm: 0,
          lateralMm: 0,
          rotationDeg: 0,
        }
      : mountConfig;

  const model = buildRobotKinematicModel(robot, tool, mountConfigObj);
  const { baseHeightMm: d1, shoulderOffsetMm: a1, upperArmMm: l2, forearmMm: l3, flangeMm: l4 } = model.links;

  // Track all created geometries for clean zero-leak disposal
  const geometries: THREE.BufferGeometry[] = [];
  const trackGeo = <T extends THREE.BufferGeometry>(g: T): T => {
    geometries.push(g);
    return g;
  };

  // Manufacturer Coating (authentic industrial robot paint schemes)
  let castMat: THREE.Material = MAT.yaskawaBlue;
  if (robot.manufacturer === 'FANUC') {
    castMat = MAT.fanucYellow;
  } else if (robot.manufacturer === 'ABB') {
    castMat = MAT.abbWhite;
  } else if (robot.manufacturer === 'KUKA') {
    castMat = MAT.kukaOrange;
  }

  // =========================================================================
  // 1. KINEMATIC THREE.JS HIERARCHY SETUP
  // =========================================================================

  // Robot Base Anchor Group (Stationary in World Coordinates)
  const baseGroup = new THREE.Group();
  baseGroup.name = 'Robot_Base_Anchor';
  baseGroup.matrixAutoUpdate = false;
  setThreeMatrix4FromRowMajor(baseGroup.matrix, model.baseTransform.matrix);
  baseGroup.matrixWorld.copy(baseGroup.matrix);
  armGroup.add(baseGroup);

  // Joint 1: Turntable (rotates about local Z by th1)
  const j1Group = new THREE.Group();
  j1Group.name = 'Robot_J1_Turntable';
  baseGroup.add(j1Group);

  // Joint 2: Shoulder (offset by [a1, 0, d1], rotates about local Y by th2)
  const j2Group = new THREE.Group();
  j2Group.name = 'Robot_J2_Shoulder';
  j2Group.position.set(a1, 0, d1);
  j1Group.add(j2Group);

  // Joint 3: Elbow (offset along upper arm by [0, 0, l2], rotates about local Y by th3)
  const j3Group = new THREE.Group();
  j3Group.name = 'Robot_J3_Elbow';
  j3Group.position.set(0, 0, l2);
  j2Group.add(j3Group);

  // Joint 4: Forearm Roll (offset along forearm by [0, 0, l3], rotates about local Z by th4)
  const j4Group = new THREE.Group();
  j4Group.name = 'Robot_J4_ForearmRoll';
  j4Group.position.set(0, 0, l3);
  j3Group.add(j4Group);

  // Joint 5: Wrist Pitch (coincident at wrist center, rotates about local Y by th5)
  const j5Group = new THREE.Group();
  j5Group.name = 'Robot_J5_WristPitch';
  j4Group.add(j5Group);

  // Joint 6: Flange Roll (coincident at wrist center, rotates about local Z by th6)
  const j6Group = new THREE.Group();
  j6Group.name = 'Robot_J6_FlangeRoll';
  j5Group.add(j6Group);

  // Tool Flange (offset from J6 along approach vector +Z by flange length l4)
  const flangeGroup = new THREE.Group();
  flangeGroup.name = 'Robot_Flange';
  flangeGroup.position.set(0, 0, l4);
  j6Group.add(flangeGroup);

  // Tool TCP Group (Positioned & oriented relative to flange by toolTransform)
  const tcpGroup = new THREE.Group();
  tcpGroup.name = 'Robot_Tool_TCP';
  tcpGroup.matrixAutoUpdate = false;
  setThreeMatrix4FromRowMajor(tcpGroup.matrix, model.toolTransform.matrix);
  flangeGroup.add(tcpGroup);

  // CAD-measured chain (Yaskawa GP50): pivots, flange pose and joint axes come straight from the
  // CAD, replacing the proportional a1/d1/l2/l3/l4 layout above. FK/IK use the same chain.
  const cad = model.cadChain;
  const cadAxes: THREE.Vector3[] = [];
  const cadSigns: number[] = [];
  const allJointGroups = [j1Group, j2Group, j3Group, j4Group, j5Group, j6Group];
  if (cad) {
    cad.joints.forEach((cj, i) => {
      allJointGroups[i].position.set(cj.offsetMm[0], cj.offsetMm[1], cj.offsetMm[2]);
      cadAxes.push(new THREE.Vector3(cj.axis[0], cj.axis[1], cj.axis[2]).normalize());
      cadSigns.push(cj.sign);
    });
    flangeGroup.position.set(cad.flangeOffsetMm[0], cad.flangeOffsetMm[1], cad.flangeOffsetMm[2]);
    const fm = new THREE.Matrix4();
    setThreeMatrix4FromRowMajor(fm, cad.flangeRotation);
    flangeGroup.quaternion.setFromRotationMatrix(fm);
  }

  // =========================================================================
  // 2. INDUSTRIAL ROBOT 3D MESH GEOMETRIES & ATTACHMENTS
  // =========================================================================

  // GP50 is CAD-only: procedural arm geometry is never attached when a measured CAD chain exists.
  // Other robot families retain the existing procedural geometry path.
  const addProcedural = <T extends THREE.Object3D>(parent: THREE.Object3D, mesh: T): T => {
    if (cad) return mesh;
    parent.add(mesh);
    return mesh;
  };

  // --- Base Anchor Meshes (Stationary mounting interface) ---
  const baseFlangeGeo = trackGeo(new THREE.CylinderGeometry(230, 250, 48, 32));
  baseFlangeGeo.rotateX(Math.PI / 2);
  baseFlangeGeo.translate(0, 0, 24);
  const baseFlangeMesh = new THREE.Mesh(baseFlangeGeo, MAT.jointDark);
  baseFlangeMesh.castShadow = true;
  addProcedural(baseGroup, baseFlangeMesh);

  const boltRingGeo = trackGeo(new THREE.CylinderGeometry(245, 245, 14, 32));
  boltRingGeo.rotateX(Math.PI / 2);
  boltRingGeo.translate(0, 0, 10);
  const boltRingMesh = new THREE.Mesh(boltRingGeo, MAT.platenSteel);
  addProcedural(baseGroup, boltRingMesh);

  const baseHousingGeo = trackGeo(new THREE.CylinderGeometry(205, 225, 36, 32));
  baseHousingGeo.rotateX(Math.PI / 2);
  baseHousingGeo.translate(0, 0, 48 + 18);
  const baseHousingMesh = new THREE.Mesh(baseHousingGeo, castMat);
  baseHousingMesh.castShadow = true;
  addProcedural(baseGroup, baseHousingMesh);

  const junctionBoxGeo = trackGeo(new THREE.BoxGeometry(110, 75, 55));
  const junctionBox = new THREE.Mesh(junctionBoxGeo, MAT.jointDark);
  junctionBox.position.set(0, -180, 45);
  addProcedural(baseGroup, junctionBox);

  // --- J1 Turntable & Shoulder Fork Meshes ---
  const j1TurntableGeo = trackGeo(new THREE.CylinderGeometry(195, 205, 32, 32));
  j1TurntableGeo.rotateX(Math.PI / 2);
  j1TurntableGeo.translate(0, 0, 84 + 16);
  const j1TurntableMesh = new THREE.Mesh(j1TurntableGeo, castMat);
  addProcedural(j1Group, j1TurntableMesh);

  const forkH = Math.max(80, d1 - 100);
  const forkColGeo = trackGeo(new THREE.BoxGeometry(200, 220, forkH));
  const forkColMesh = new THREE.Mesh(forkColGeo, castMat);
  forkColMesh.position.set(a1 * 0.45, 0, 100 + forkH / 2);
  forkColMesh.castShadow = true;
  addProcedural(j1Group, forkColMesh);

  [-1, 1].forEach(side => {
    const earGeo = trackGeo(new THREE.BoxGeometry(160, 42, 170));
    const earMesh = new THREE.Mesh(earGeo, castMat);
    earMesh.position.set(a1, side * 115, d1);
    earMesh.castShadow = true;
    addProcedural(j1Group, earMesh);

    const capGeo = trackGeo(new THREE.CylinderGeometry(60, 60, 16, 24));
    const capMesh = new THREE.Mesh(capGeo, MAT.jointDark);
    capMesh.position.set(a1, side * 138, d1);
    addProcedural(j1Group, capMesh);
  });

  const j1MotorGeo = trackGeo(new THREE.CylinderGeometry(70, 70, 180, 24));
  j1MotorGeo.rotateX(Math.PI / 2);
  const j1MotorMesh = new THREE.Mesh(j1MotorGeo, MAT.jointDark);
  j1MotorMesh.position.set(-70, 0, 100 + forkH * 0.45);
  addProcedural(j1Group, j1MotorMesh);

  // --- J2 Shoulder & Upper Arm Meshes ---
  const shoulderHubGeo = trackGeo(new THREE.CylinderGeometry(95, 95, 230, 24));
  const shoulderHubMesh = new THREE.Mesh(shoulderHubGeo, MAT.jointDark);
  shoulderHubMesh.castShadow = true;
  addProcedural(j2Group, shoulderHubMesh);

  const j2MotorGeo = trackGeo(new THREE.CylinderGeometry(68, 68, 140, 20));
  j2MotorGeo.rotateX(Math.PI / 2);
  const j2MotorMesh = new THREE.Mesh(j2MotorGeo, MAT.jointDark);
  j2MotorMesh.position.set(-65, 0, -45);
  addProcedural(j2Group, j2MotorMesh);

  const upperArmGeo = trackGeo(new THREE.CylinderGeometry(76, 92, l2, 24));
  upperArmGeo.rotateX(Math.PI / 2);
  upperArmGeo.translate(0, 0, l2 / 2);
  const upperArmMesh = new THREE.Mesh(upperArmGeo, castMat);
  upperArmMesh.castShadow = true;
  addProcedural(j2Group, upperArmMesh);

  const ribGeo = trackGeo(new THREE.BoxGeometry(32, 28, l2 * 0.85));
  const ribMesh = new THREE.Mesh(ribGeo, MAT.jointDark);
  ribMesh.position.set(55, 0, l2 * 0.5);
  addProcedural(j2Group, ribMesh);

  const trimGeo = trackGeo(new THREE.BoxGeometry(36, 6, 140));
  const trimMesh = new THREE.Mesh(trimGeo, MAT.aluminumPart);
  trimMesh.position.set(0, 78, l2 * 0.5);
  addProcedural(j2Group, trimMesh);

  // --- J3 Elbow & Forearm Meshes ---
  const elbowHubGeo = trackGeo(new THREE.CylinderGeometry(85, 85, 210, 24));
  const elbowHubMesh = new THREE.Mesh(elbowHubGeo, MAT.jointDark);
  elbowHubMesh.castShadow = true;
  addProcedural(j3Group, elbowHubMesh);

  const elbowMotorGeo = trackGeo(new THREE.CylinderGeometry(62, 62, 90, 20));
  const elbowMotorMesh = new THREE.Mesh(elbowMotorGeo, MAT.jointDark);
  elbowMotorMesh.position.set(0, 115, 0);
  addProcedural(j3Group, elbowMotorMesh);

  const forearmGeo = trackGeo(new THREE.CylinderGeometry(58, 74, l3, 24));
  forearmGeo.rotateX(Math.PI / 2);
  forearmGeo.translate(0, 0, l3 / 2);
  const forearmMesh = new THREE.Mesh(forearmGeo, castMat);
  forearmMesh.castShadow = true;
  addProcedural(j3Group, forearmMesh);

  const conduitGeo = trackGeo(new THREE.BoxGeometry(24, 20, l3 * 0.8));
  const conduitMesh = new THREE.Mesh(conduitGeo, MAT.jointDark);
  conduitMesh.position.set(0, 52, l3 * 0.5);
  addProcedural(j3Group, conduitMesh);

  // --- J4 Forearm Roll Meshes ---
  const j4CollarGeo = trackGeo(new THREE.CylinderGeometry(60, 64, 60, 24));
  j4CollarGeo.rotateX(Math.PI / 2);
  j4CollarGeo.translate(0, 0, -25);
  const j4CollarMesh = new THREE.Mesh(j4CollarGeo, MAT.jointDark);
  j4CollarMesh.castShadow = true;
  addProcedural(j4Group, j4CollarMesh);

  // --- J5 Wrist Pitch Meshes ---
  const j5KnuckleGeo = trackGeo(new THREE.CylinderGeometry(52, 52, 130, 20));
  const j5KnuckleMesh = new THREE.Mesh(j5KnuckleGeo, MAT.jointDark);
  j5KnuckleMesh.castShadow = true;
  addProcedural(j5Group, j5KnuckleMesh);

  const j5BarrelGeo = trackGeo(new THREE.CylinderGeometry(46, 50, l4 * 0.7, 20));
  j5BarrelGeo.rotateX(Math.PI / 2);
  j5BarrelGeo.translate(0, 0, l4 * 0.35);
  const j5BarrelMesh = new THREE.Mesh(j5BarrelGeo, castMat);
  j5BarrelMesh.castShadow = true;
  addProcedural(j5Group, j5BarrelMesh);

  // --- J6 Flange Roll Meshes ---
  const j6SpindleGeo = trackGeo(new THREE.CylinderGeometry(48, 48, 20, 24));
  j6SpindleGeo.rotateX(Math.PI / 2);
  j6SpindleGeo.translate(0, 0, l4 - 10);
  const j6SpindleMesh = new THREE.Mesh(j6SpindleGeo, MAT.jointDark);
  addProcedural(j6Group, j6SpindleMesh);

  // --- Flange Adapter Meshes ---
  const flangePlateGeo = trackGeo(new THREE.CylinderGeometry(75, 75, 18, 24));
  flangePlateGeo.rotateX(Math.PI / 2);
  flangePlateGeo.translate(0, 0, 9);
  const flangePlateMesh = new THREE.Mesh(flangePlateGeo, MAT.platenSteel);
  flangePlateMesh.castShadow = true;
  if (!cad) flangeGroup.add(flangePlateMesh); // the CAD T-axis already contains the flange

  const toolDistZ = tool.z || 220;
  const stemH = Math.max(20, toolDistZ - 30);
  const toolStemGeo = trackGeo(new THREE.CylinderGeometry(28, 34, stemH, 16));
  toolStemGeo.rotateX(Math.PI / 2);
  toolStemGeo.translate(0, 0, stemH / 2 + 18);
  const toolStemMesh = new THREE.Mesh(toolStemGeo, MAT.platenSteel);
  flangeGroup.add(toolStemMesh);

  // --- Tool TCP Manifold Meshes (Rigidly parented to tcpGroup) ---
  const mWidth = tool.dimensions?.width || tool.manifoldWidthMm || 360;
  const mHeight = tool.dimensions?.height || 140;
  const mDepth = tool.dimensions?.depth || 90;

  // Resolve EOAT tooling archetype
  let activeEoatType: EoatType = 'MONOBLOCK';
  if (tool.eoatType) {
    activeEoatType = tool.eoatType;
  } else if (tool.eoatSpec?.type) {
    activeEoatType = tool.eoatSpec.type;
  } else if (tool.sprayHeadType === 'MODULAR' || tool.sprayHeadType === 'modular_extension' || tool.manifoldType === 'modular_frame') {
    activeEoatType = 'MODULAR';
  } else if (tool.sprayHeadType === 'MATRIX' || tool.sprayHeadType === 'contour_frame' || tool.manifoldType === 'matrix_grid' || tool.manifoldType === 'dual_sided_matrix') {
    activeEoatType = 'MATRIX';
  } else if (tool.sprayHeadType === 'MICRO_DOSING' || tool.sprayHeadType === 'micro_spray' || tool.manifoldType === 'micro_dosing') {
    activeEoatType = 'MICRO_DOSING';
  } else {
    activeEoatType = 'MONOBLOCK';
  }

  if (activeEoatType === 'MONOBLOCK') {
    // =========================================================================
    // 1. MONOBLOCK EOAT: CNC Machined Billet 6061-T6 Manifold, Internal Galleries
    // =========================================================================
    // Main monolithic machined billet block
    const blockH = Math.min(130, mHeight * 0.85);
    const blockD = Math.min(85, mDepth * 0.85);
    const billetGeo = trackGeo(new THREE.BoxGeometry(mWidth, blockH, blockD));
    const billetMesh = new THREE.Mesh(billetGeo, MAT.aluminumPart);
    billetMesh.castShadow = true;
    tcpGroup.add(billetMesh);

    // Beveled machined chamfer edges (top and bottom)
    [-1, 1].forEach(sideY => {
      const chamfer = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(mWidth * 0.98, 10, blockD * 0.7)), MAT.platenSteel);
      chamfer.position.set(0, sideY * (blockH / 2 + 3), 0);
      tcpGroup.add(chamfer);
    });

    // Circular gun-drilled internal channel inspection port hex plugs on lateral sides
    [-1, 1].forEach(sideX => {
      [-25, 0, 25].forEach(offsetY => {
        const plug = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(7, 7, 5, 6)), MAT.jointDark);
        plug.rotation.z = Math.PI / 2;
        plug.position.set(sideX * (mWidth / 2 + 2), offsetY, 0);
        tcpGroup.add(plug);
      });
    });

    // Back ISO 9409-1 direct mounting flange hub with socket head bolt pattern
    const isoCollar = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(55, 60, 24, 16)), MAT.platenSteel);
    isoCollar.rotation.x = Math.PI / 2;
    isoCollar.position.set(0, 0, blockD / 2 + 10);
    tcpGroup.add(isoCollar);

    for (let b = 0; b < 6; b++) {
      const angle = (b / 6) * Math.PI * 2;
      const bolt = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(3.5, 3.5, 6, 6)), MAT.jointDark);
      bolt.rotation.x = Math.PI / 2;
      bolt.position.set(Math.cos(angle) * 42, Math.sin(angle) * 42, blockD / 2 + 22);
      tcpGroup.add(bolt);
    }

    // Fixed Die Spray Face (-Z) & Moving Die Spray Face (+Z)
    [-1, 1].forEach(dirZ => {
      // Recessed machined pocket strip
      const pocket = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(mWidth * 0.88, blockH * 0.55, 6)), MAT.jointDark);
      pocket.position.set(0, 0, dirZ * (blockD / 2 + 2));
      tcpGroup.add(pocket);

      // 5 Machined brass nozzles with hex collars and conical tips
      const nozzleXs = [-mWidth * 0.35, -mWidth * 0.175, 0, mWidth * 0.175, mWidth * 0.35];
      nozzleXs.forEach(nx => {
        const hexBase = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(7, 7, 10, 6)), MAT.brass);
        hexBase.rotation.x = Math.PI / 2;
        hexBase.position.set(nx, 0, dirZ * (blockD / 2 + 8));
        tcpGroup.add(hexBase);

        const tip = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(3.5, 6.5, 12, 12)), MAT.brass);
        tip.rotation.x = dirZ < 0 ? -Math.PI / 2 : Math.PI / 2;
        tip.position.set(nx, 0, dirZ * (blockD / 2 + 18));
        tcpGroup.add(tip);
      });
    });

    // High-Velocity Slotted Air Knife on bottom edge
    const airKnife = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(mWidth * 0.9, 14, 22)), MAT.platenSteel);
    airKnife.position.set(0, -blockH / 2 - 8, 0);
    tcpGroup.add(airKnife);

    const slit = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(mWidth * 0.82, 3, 24)), MAT.castRecess);
    slit.position.set(0, -blockH / 2 - 13, 0);
    tcpGroup.add(slit);

    // Top direct rigid stainless fluid inlet nipples (clean, zero external hoses)
    [-mWidth * 0.22, mWidth * 0.22].forEach(px => {
      const nipple = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(9, 9, 28, 12)), MAT.chromeTieBar);
      nipple.position.set(px, blockH / 2 + 14, 0);
      tcpGroup.add(nipple);
    });

  } else if (activeEoatType === 'MODULAR') {
    // =========================================================================
    // 2. MODULAR EOAT: Dual T-Slot Extruded Rails, Adjustable Sliders & Visible Hoses
    // =========================================================================
    const railW = Math.max(420, mWidth);
    const railSpacingY = 56;

    // Dual Extruded Structural Aluminum Profile Rails (40x40 Profile)
    [-1, 1].forEach(sideY => {
      const rail = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(railW, 26, 32)), MAT.platenSteel);
      rail.position.set(0, sideY * railSpacingY, 0);
      rail.castShadow = true;
      tcpGroup.add(rail);

      // Dark T-slot groove in center
      const slot = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(railW + 2, 7, 5)), MAT.jointDark);
      slot.position.set(0, sideY * railSpacingY, 15);
      tcpGroup.add(slot);

      const slotBack = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(railW + 2, 7, 5)), MAT.jointDark);
      slotBack.position.set(0, sideY * railSpacingY, -15);
      tcpGroup.add(slotBack);
    });

    // End Plates tying the two rails
    [-1, 1].forEach(sideX => {
      const endPlate = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(10, railSpacingY * 2 + 34, 38)), MAT.platenSteel);
      endPlate.position.set(sideX * (railW / 2 - 5), 0, 0);
      tcpGroup.add(endPlate);
    });

    // Central Distribution Junction Manifold Block
    const hub = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(90, railSpacingY * 2 + 20, 68)), MAT.toolBlue);
    hub.castShadow = true;
    tcpGroup.add(hub);

    // Miniature Dial Pressure Gauge on top of Hub
    const gaugeBody = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(15, 15, 8, 16)), MAT.cabinetGrey);
    gaugeBody.position.set(0, railSpacingY + 22, 10);
    tcpGroup.add(gaugeBody);

    const gaugeGlass = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(12, 12, 1, 16)), MAT.screenGlass);
    gaugeGlass.position.set(0, railSpacingY + 26.5, 10);
    tcpGroup.add(gaugeGlass);

    // 4 Independently Clamped Slider Carriages along Rails
    const sliderXs = [-railW * 0.35, -railW * 0.16, railW * 0.16, railW * 0.35];
    sliderXs.forEach((sx, idx) => {
      const isTop = idx % 2 === 0;
      const sy = isTop ? railSpacingY : -railSpacingY;

      // Sliding Clamp Block with lock screw
      const clampBlock = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(38, 48, 42)), MAT.aluminumPart);
      clampBlock.position.set(sx, sy, 0);
      tcpGroup.add(clampBlock);

      const lockScrew = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(4, 4, 8, 6)), MAT.brass);
      lockScrew.position.set(sx, sy + (isTop ? 26 : -26), 0);
      tcpGroup.add(lockScrew);

      // Swivel Knuckle (Ball Joint)
      const swivelBall = new THREE.Mesh(trackGeo(new THREE.SphereGeometry(10, 12, 12)), MAT.brass);
      swivelBall.position.set(sx, sy, -24);
      tcpGroup.add(swivelBall);

      // Stainless Steel Extension Tube / Lance reaching toward Fixed cavity
      const lanceLen = 85 + (idx % 2) * 35;
      const lance = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(5, 5, lanceLen, 12)), MAT.chromeTieBar);
      lance.rotation.x = Math.PI / 2;
      lance.rotation.y = (idx - 1.5) * 0.12; // Articulated fan-out
      lance.position.set(sx, sy, -24 - lanceLen / 2);
      tcpGroup.add(lance);

      // Brass Nozzle Tip
      const brassTip = new THREE.Mesh(trackGeo(new THREE.ConeGeometry(7, 14, 12)), MAT.brass);
      brassTip.rotation.x = -Math.PI / 2;
      brassTip.position.set(sx, sy, -24 - lanceLen);
      tcpGroup.add(brassTip);

      // Opposing Wand reaching toward Moving cavity (+Z)
      const lanceMov = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(5, 5, lanceLen, 12)), MAT.chromeTieBar);
      lanceMov.rotation.x = Math.PI / 2;
      lanceMov.position.set(sx, sy, 24 + lanceLen / 2);
      tcpGroup.add(lanceMov);

      const brassTipMov = new THREE.Mesh(trackGeo(new THREE.ConeGeometry(7, 14, 12)), MAT.brass);
      brassTipMov.rotation.x = Math.PI / 2;
      brassTipMov.position.set(sx, sy, 24 + lanceLen);
      tcpGroup.add(brassTipMov);

      // Brass 90° Push-In Elbow Fitting on Carriage
      const elbow = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(4.5, 4.5, 12, 8)), MAT.brass);
      elbow.position.set(sx, sy + 18, 0);
      tcpGroup.add(elbow);

      // Visible Polyurethane Fluid & Air Hoses connecting from Hub to Carriage
      const hoseColor = idx % 2 === 0 ? MAT.toolBlue : MAT.conduitBlack;
      const hoseSpanX = Math.abs(sx) - 40;
      if (hoseSpanX > 10) {
        const hoseH = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(3.5, 3.5, hoseSpanX, 8)), hoseColor);
        hoseH.rotation.z = Math.PI / 2;
        hoseH.position.set(sx > 0 ? 45 + hoseSpanX / 2 : -45 - hoseSpanX / 2, sy + 16, 22);
        tcpGroup.add(hoseH);
      }
    });

  } else if (activeEoatType === 'MATRIX') {
    // =========================================================================
    // 3. MATRIX EOAT: Large Flat Grid Array (6x4 Nozzle Array) for Structural Dies
    // =========================================================================
    const gridW = Math.max(540, mWidth);
    const gridH = Math.max(340, mHeight);

    // Heavy Structural Perimeter Box-Truss Frame
    const topBeam = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(gridW, 26, 32)), MAT.toolBlue);
    topBeam.position.set(0, gridH / 2 - 13, 0);
    topBeam.castShadow = true;
    tcpGroup.add(topBeam);

    const botBeam = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(gridW, 26, 32)), MAT.toolBlue);
    botBeam.position.set(0, -gridH / 2 + 13, 0);
    botBeam.castShadow = true;
    tcpGroup.add(botBeam);

    const leftCol = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(26, gridH, 32)), MAT.toolBlue);
    leftCol.position.set(-gridW / 2 + 13, 0, 0);
    tcpGroup.add(leftCol);

    const rightCol = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(26, gridH, 32)), MAT.toolBlue);
    rightCol.position.set(gridW / 2 - 13, 0, 0);
    tcpGroup.add(rightCol);

    // Center Vertical Structural Rib Spine
    const centerRib = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(32, gridH - 52, 34)), MAT.platenSteel);
    centerRib.position.set(0, 0, 0);
    tcpGroup.add(centerRib);

    // Diagonal Corner Gusset Stiffeners
    [[-1, 1], [1, 1], [-1, -1], [1, -1]].forEach(([gx, gy]) => {
      const gusset = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(45, 45, 12)), MAT.platenSteel);
      gusset.rotation.z = Math.PI / 4;
      gusset.position.set(gx * (gridW / 2 - 40), gy * (gridH / 2 - 40), 0);
      tcpGroup.add(gusset);
    });

    // Central Perforated Grid Mounting Bed
    const gridPlate = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(gridW - 56, gridH - 56, 8)), MAT.aluminumPart);
    gridPlate.position.set(0, 0, 0);
    tcpGroup.add(gridPlate);

    // Dual High-Volume Stainless Steel Supply Header Manifolds (Top & Bottom)
    [-1, 1].forEach(sideY => {
      const header = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(15, 15, gridW - 40, 16)), MAT.chromeTieBar);
      header.rotation.z = Math.PI / 2;
      header.position.set(0, sideY * (gridH / 2 - 28), 0);
      tcpGroup.add(header);
    });

    // Uniform 4-Column x 3-Row Twin-Fluid Brass Nozzle Matrix (12 Fixed Die / 12 Moving Die = 24 Nozzles)
    const cols = [-gridW * 0.32, -gridW * 0.11, gridW * 0.11, gridW * 0.32];
    const rows = [gridH * 0.25, 0, -gridH * 0.25];

    [-1, 1].forEach(dirZ => {
      cols.forEach(cx => {
        rows.forEach(ry => {
          // Hex Base Collar
          const nzBase = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(7, 7, 10, 6)), MAT.brass);
          nzBase.rotation.x = Math.PI / 2;
          nzBase.position.set(cx, ry, dirZ * 16);
          tcpGroup.add(nzBase);

          // Standardized Atomizing Air Nozzle Cap
          const nzCap = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(4.5, 6.5, 12, 12)), MAT.brass);
          nzCap.rotation.x = dirZ < 0 ? -Math.PI / 2 : Math.PI / 2;
          nzCap.position.set(cx, ry, dirZ * 26);
          tcpGroup.add(nzCap);
        });
      });
    });

    // Heavy Braided Stainless Steel Supply Umbilicals from Flange to Headers
    [-1, 1].forEach(sideY => {
      const hoseLoop = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(14, 14, gridH * 0.38, 12)), MAT.chromeTieBar);
      hoseLoop.position.set(0, sideY * (gridH * 0.2), 35);
      tcpGroup.add(hoseLoop);

      // Flanged Swivel Joint with Bolt Ring
      const swivel = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(20, 20, 12, 16)), MAT.jointDark);
      swivel.position.set(0, sideY * (gridH / 2 - 28), 35);
      tcpGroup.add(swivel);
    });

    // Full-Width Air Curtain Knives (Top & Bottom)
    [-1, 1].forEach(sideY => {
      const airCurtain = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(gridW - 20, 10, 18)), MAT.platenSteel);
      airCurtain.position.set(0, sideY * (gridH / 2 + 5), 0);
      tcpGroup.add(airCurtain);
    });

  } else {
    // =========================================================================
    // 4. MICRO_DOSING EOAT: Surgical Hard-Anodized Manifold, Pulse Solenoids, Suck-Back
    // =========================================================================
    const microW = Math.min(300, mWidth);
    const microH = Math.min(110, mHeight);
    const microD = Math.min(75, mDepth);

    // Precision CNC Hard-Anodized Manifold Core
    const microCore = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(microW, microH * 0.65, microD * 0.8)), MAT.jointDark);
    microCore.castShadow = true;
    tcpGroup.add(microCore);

    // Beveled corner casing accents in anodized silver
    [-1, 1].forEach(sideX => {
      const cap = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(10, microH * 0.62, microD * 0.78)), MAT.aluminumPart);
      cap.position.set(sideX * (microW / 2 + 5), 0, 0);
      tcpGroup.add(cap);
    });

    // Bank of 8 Precision Micro-Dosing Solenoid Valves (4 Fixed Side / 4 Moving Side)
    const valveXs = [-microW * 0.32, -microW * 0.11, microW * 0.11, microW * 0.32];
    [-1, 1].forEach(dirZ => {
      valveXs.forEach(vx => {
        // Cylindrical Solenoid Actuator Body
        const solenoid = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(10, 10, 36, 16)), MAT.platenSteel);
        solenoid.position.set(vx, 22, dirZ * 18);
        tcpGroup.add(solenoid);

        // Active Status Green LED Ring on Top
        const ledRing = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(10.5, 10.5, 4, 16)), MAT.alertGreen);
        ledRing.position.set(vx, 41, dirZ * 18);
        tcpGroup.add(ledRing);

        // Zero-Drip Suck-Back Diaphragm Chamber (Bottom)
        const suckBackChamber = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(13, 13, 10, 16)), MAT.aluminumPart);
        suckBackChamber.position.set(vx, -22, dirZ * 18);
        tcpGroup.add(suckBackChamber);

        // Micro-Orifice Needle Injector Nozzle
        const needle = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(2.5, 2.5, 18, 12)), MAT.brass);
        needle.rotation.x = Math.PI / 2;
        needle.position.set(vx, 0, dirZ * (microD / 2 + 10));
        tcpGroup.add(needle);

        // Fine Atomizing Air Cone Tip
        const airTip = new THREE.Mesh(trackGeo(new THREE.ConeGeometry(5, 10, 12)), MAT.brass);
        airTip.rotation.x = dirZ < 0 ? -Math.PI / 2 : Math.PI / 2;
        airTip.position.set(vx, 0, dirZ * (microD / 2 + 20));
        tcpGroup.add(airTip);
      });
    });

    // Dual Digital Pressure Transducers with Display Screen
    const transducerBox = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(46, 32, 26)), MAT.platenSteel);
    transducerBox.position.set(0, 0, microD / 2 + 14);
    tcpGroup.add(transducerBox);

    const digitalScreen = new THREE.Mesh(trackGeo(new THREE.PlaneGeometry(36, 16)), MAT.screenGlass);
    digitalScreen.position.set(0, 0, microD / 2 + 27.5);
    tcpGroup.add(digitalScreen);

    // Micro-Bore 3mm Polished Stainless Fluid Lines and M12 Electrical Connector
    const m12Plug = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(7, 7, 18, 16)), MAT.jointDark);
    m12Plug.position.set(-microW * 0.36, -microH * 0.38, 0);
    tcpGroup.add(m12Plug);

    const m12GoldRing = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(7.5, 7.5, 4, 16)), MAT.brass);
    m12GoldRing.position.set(-microW * 0.36, -microH * 0.38 + 6, 0);
    tcpGroup.add(m12GoldRing);
  }

  // =========================================================================
  // 2.5 EOAT MANIFOLD MULTI-NOZZLE SPRAY EMITTER PLUMES
  // =========================================================================
  const sprayEmitterGroup = new THREE.Group();
  sprayEmitterGroup.name = 'EOAT_SprayEmitterGroup';
  sprayEmitterGroup.visible = false;
  tcpGroup.add(sprayEmitterGroup);

  const materials: THREE.Material[] = [];
  const trackMat = <T extends THREE.Material>(m: T): T => {
    materials.push(m);
    return m;
  };

  interface NozzlePlumeEmitter {
    mesh: THREE.Mesh;
    nozzle: SprayNozzleConfig;
    targetFaceDir: 'FIXED' | 'MOVABLE' | 'OMNI';
    coneLength: number;
    coneRadius: number;
  }

  const nozzlePlumes: NozzlePlumeEmitter[] = [];
  const rawNozzles = tool.nozzles || tool.eoatSpec?.nozzles || [];

  const nozzlesToEmit: SprayNozzleConfig[] = rawNozzles.length > 0 ? rawNozzles : [
    { id: 'def-fixed', name: 'Default Fixed Nozzle', offsetMm: [0, 0, 20], directionVector: [0, 0, -1], sprayAngleDeg: 65, type: 'combined', flowRatio: 1.0, sprayWidthMm: 180 },
    { id: 'def-movable', name: 'Default Movable Nozzle', offsetMm: [0, 0, -20], directionVector: [0, 0, 1], sprayAngleDeg: 65, type: 'combined', flowRatio: 1.0, sprayWidthMm: 180 }
  ];

  const isMicro = activeEoatType === 'MICRO_DOSING';
  const defaultPlumeLength = isMicro ? 150 : 230;

  nozzlesToEmit.forEach(nz => {
    const halfAngleRad = ((nz.sprayAngleDeg || 60) / 2) * (Math.PI / 180);
    const plumeLen = defaultPlumeLength;
    const plumeRad = Math.max(15, Math.tan(halfAngleRad) * plumeLen);

    const coneGeo = trackGeo(new THREE.ConeGeometry(plumeRad, plumeLen, 16, 1, true));
    coneGeo.translate(0, -plumeLen / 2, 0);
    coneGeo.rotateX(-Math.PI / 2);

    const plumeMat = trackMat(new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.32,
      side: THREE.DoubleSide,
      depthWrite: false
    }));

    const coneMesh = new THREE.Mesh(coneGeo, plumeMat);
    coneMesh.position.set(nz.offsetMm[0], nz.offsetMm[1], nz.offsetMm[2]);

    const dir = new THREE.Vector3(nz.directionVector[0], nz.directionVector[1], nz.directionVector[2]);
    if (dir.lengthSq() > 0.001) {
      dir.normalize();
      const targetLook = new THREE.Vector3(
        nz.offsetMm[0] + dir.x * 100,
        nz.offsetMm[1] + dir.y * 100,
        nz.offsetMm[2] + dir.z * 100
      );
      coneMesh.lookAt(targetLook);
    }

    sprayEmitterGroup.add(coneMesh);

    const dirZ = nz.directionVector[2];
    const targetFaceDir = dirZ < -0.05 ? 'FIXED' : dirZ > 0.05 ? 'MOVABLE' : 'OMNI';

    nozzlePlumes.push({
      mesh: coneMesh,
      nozzle: nz,
      targetFaceDir,
      coneLength: plumeLen,
      coneRadius: plumeRad
    });
  });

  const updateSprayEmission = (options: SprayEmissionState) => {
    if (!options.isSpraying || options.showSprayCone === false) {
      sprayEmitterGroup.visible = false;
      return;
    }

    sprayEmitterGroup.visible = true;
    const isAirBlow = options.action === 'AIR_BLOW';
    const isLubeAndAir = options.action === 'LUBE_AND_AIR';

    nozzlePlumes.forEach(p => {
      // Filter by target die face
      if (options.targetFace === 'FIXED_DIE' && p.targetFaceDir === 'MOVABLE') {
        p.mesh.visible = false;
        return;
      }
      if (options.targetFace === 'MOVABLE_DIE' && p.targetFaceDir === 'FIXED') {
        p.mesh.visible = false;
        return;
      }

      p.mesh.visible = true;
      const mat = p.mesh.material as THREE.MeshBasicMaterial;

      if (isAirBlow) {
        mat.color.setHex(0xe0f2fe);
        mat.opacity = 0.22;
      } else if (isLubeAndAir) {
        mat.color.setHex(0x06b6d4);
        mat.opacity = 0.38;
      } else if (isMicro) {
        mat.color.setHex(0x38bdf8);
        mat.opacity = 0.28;
      } else {
        mat.color.setHex(0x0ea5e9);
        mat.opacity = 0.34;
      }
    });
  };

  // =========================================================================
  // 3. ZERO-ALLOCATION FAST 60FPS JOINT POSE UPDATE
  // =========================================================================
  let lastJointsDeg: [number, number, number, number, number, number] = [0, 0, 0, 0, 0, 0];
  const DEG2RAD = Math.PI / 180;

  const updatePose = (
    pose: RobotArmPoseInput,
    _tcpMatrix?: number[],
    jointsDegFallback?: [number, number, number, number, number, number]
  ) => {
    let jDeg: [number, number, number, number, number, number];

    if (Array.isArray(pose) && pose.length === 6) {
      jDeg = pose as [number, number, number, number, number, number];
    } else if (jointsDegFallback && jointsDegFallback.length === 6) {
      jDeg = jointsDegFallback;
    } else if (pose && typeof pose === 'object' && 'jointsDeg' in pose && Array.isArray((pose as any).jointsDeg)) {
      jDeg = (pose as any).jointsDeg;
    } else {
      jDeg = lastJointsDeg;
    }

    lastJointsDeg = jDeg;

    const [j1, j2, j3, j4, j5, j6] = jDeg;

    if (cad) {
      // Rotate each CAD joint about its measured axis (same chain as FK/IK)
      const angles = [j1, j2, j3, j4, j5, j6];
      for (let i = 0; i < 6; i++) {
        allJointGroups[i].quaternion.setFromAxisAngle(cadAxes[i], cadSigns[i] * angles[i] * DEG2RAD);
      }
      baseGroup.updateMatrixWorld(true);
      return;
    }

    // Apply exact joint rotations in local joint frames
    j1Group.rotation.set(0, 0, j1 * DEG2RAD, 'ZYX');
    j2Group.rotation.set(0, j2 * DEG2RAD, 0, 'ZYX');
    j3Group.rotation.set(0, j3 * DEG2RAD, 0, 'ZYX');
    j4Group.rotation.set(0, 0, j4 * DEG2RAD, 'ZYX');
    j5Group.rotation.set(0, j5 * DEG2RAD, 0, 'ZYX');
    j6Group.rotation.set(0, 0, j6 * DEG2RAD, 'ZYX');

    // Propagate matrices down the authoritative kinematic hierarchy
    baseGroup.updateMatrixWorld(true);
  };

  const dispose = () => {
    geometries.forEach(g => g.dispose());
    geometries.length = 0;
    materials.forEach(m => m.dispose());
    materials.length = 0;
  };

  const rig: RobotArmRig = {
    armGroup,
    baseGroup,
    tcpGroup,
    flangeGroup,
    jointGroups: [j1Group, j2Group, j3Group, j4Group, j5Group, j6Group],
    sprayEmitterGroup,
    updatePose,
    updateSprayEmission,
    dispose
  };

  // Yaskawa GP50: load the real CAD asset directly. There is deliberately no procedural
  // fallback; a missing/invalid asset is surfaced through the GP50 CAD status event.
  if (cad) {
    loadGp50CadParts()
      .then(parts => {
        attachGp50CadParts(baseGroup, allJointGroups, parts);
        updatePose(lastJointsDeg);
      })
      .catch(error => {
        console.error('[GP50 CAD] Direct CAD asset load failed:', error);
      });
  }

  return rig;
}

/**
 * Backwards compatible helper function
 */
export function buildRealisticRobotArm(
  group: THREE.Group,
  robot: RobotModelSpec,
  joints: {
    base: [number, number, number];
    shoulder: [number, number, number];
    elbow: [number, number, number];
    wristPitch: [number, number, number];
    wristYaw: [number, number, number];
    tcp: [number, number, number];
  },
  tool: ToolCenterPoint,
  mountConfig: {
    type: RobotMountType;
    topMountStyle?: TopMountStyle;
  },
  machine: DieCastingMachine
) {
  while (group.children.length > 0) {
    group.remove(group.children[0]);
  }
  const mountGroup = new THREE.Group();
  group.add(mountGroup);
  buildRobotMountStructure(mountGroup, mountConfig, robot, machine, joints.base);

  const armSubGroup = new THREE.Group();
  group.add(armSubGroup);
  const rig = createRobotArmRig(armSubGroup, robot, tool, mountConfig.type);
  rig.updatePose(joints);
}
