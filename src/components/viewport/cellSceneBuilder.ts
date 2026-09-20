import * as THREE from 'three';
import { DieCastingMachine } from '../../types/machine';
import { DieModel } from '../../types/die';
import { RobotModelSpec, ToolCenterPoint, FactoryEquipmentConfig, RobotMountType, TopMountStyle, RobotMountConfig } from '../../types/robot';
import { buildRobotKinematicModel } from '../../utils/kinematics/robotModelBuilder';
import { Matrix4Tuple } from '../../types/kinematics';

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
  kukaOrange: new THREE.MeshStandardMaterial({ color: 0xea580c, metalness: 0.62, roughness: 0.35 })
};

/**
 * Builds the realistic Toyo BD-V7EX Die Casting Machine
 */
export function buildToyoMachine(
  group: THREE.Group,
  machine: DieCastingMachine,
  die: DieModel
) {
  // Clear group
  while (group.children.length > 0) {
    group.remove(group.children[0]);
  }

  const platenW = machine.platenWidth;
  const platenH = machine.platenHeight;
  const platenThick = Math.max(180, Math.min(320, platenW * 0.18));
  const movPlatenW = machine.movablePlatenWidth || platenW;
  const movPlatenH = machine.movablePlatenHeight || platenH;

  const fixedPlatenZ = die.fixedDieOffsetZ - platenThick / 2 - die.dimensions.depth / 2;
  const movPlatenZ = die.movableDieOffsetZ + platenThick / 2 + die.dimensions.depth / 2;

  // 1. STATIONARY PLATEN (Fixed Platen)
  const fixedPlaten = new THREE.Mesh(
    new THREE.BoxGeometry(platenW, platenH, platenThick),
    MAT.toyoGrey
  );
  fixedPlaten.position.set(0, 0, fixedPlatenZ);
  fixedPlaten.castShadow = true;
  fixedPlaten.receiveShadow = true;
  group.add(fixedPlaten);

  // Platen Top Machined Robot Mounting Shelf
  const topShelf = new THREE.Mesh(
    new THREE.BoxGeometry(platenW * 0.78, 45, platenThick * 1.5),
    MAT.platenSteel
  );
  topShelf.position.set(0, platenH / 2 + 22, fixedPlatenZ);
  topShelf.castShadow = true;
  group.add(topShelf);

  // Cast Pockets on Fixed Platen
  [-1, 1].forEach(side => {
    const pocket = new THREE.Mesh(
      new THREE.BoxGeometry(18, platenH * 0.28, platenThick * 0.6),
      MAT.castRecess
    );
    pocket.position.set(side * (platenW / 2 - 8), platenH * 0.22, fixedPlatenZ);
    group.add(pocket);

    const pocketB = new THREE.Mesh(
      new THREE.BoxGeometry(18, platenH * 0.28, platenThick * 0.6),
      MAT.castRecess
    );
    pocketB.position.set(side * (platenW / 2 - 8), -platenH * 0.22, fixedPlatenZ);
    group.add(pocketB);
  });

  // Center Shot Sleeve Bore (Pour hole)
  const shotHole = new THREE.Mesh(
    new THREE.CylinderGeometry(machine.standardPlungerDia ? machine.standardPlungerDia / 2 + 15 : 60, machine.standardPlungerDia ? machine.standardPlungerDia / 2 + 15 : 60, platenThick + 4, 24),
    MAT.castRecess
  );
  shotHole.rotation.x = Math.PI / 2;
  shotHole.position.set(0, machine.injectionAxisOffsetY, fixedPlatenZ);
  group.add(shotHole);

  // 2. MOVABLE PLATEN
  const movPlaten = new THREE.Mesh(
    new THREE.BoxGeometry(movPlatenW, movPlatenH, platenThick),
    MAT.toyoGrey
  );
  movPlaten.position.set(0, 0, movPlatenZ);
  movPlaten.castShadow = true;
  movPlaten.receiveShadow = true;
  group.add(movPlaten);

  // Movable Platen Top Shelf Deck
  const movShelf = new THREE.Mesh(
    new THREE.BoxGeometry(movPlatenW * 0.78, 45, platenThick * 1.5),
    MAT.platenSteel
  );
  movShelf.position.set(0, movPlatenH / 2 + 22, movPlatenZ);
  movShelf.castShadow = true;
  group.add(movShelf);

  // Bronze Guide Shoes riding on bed ways
  [-1, 1].forEach(side => {
    const shoe = new THREE.Mesh(
      new THREE.BoxGeometry(110, 45, platenThick * 1.2),
      MAT.brass
    );
    shoe.position.set(side * (movPlatenW * 0.38), -movPlatenH / 2 - 20, movPlatenZ);
    group.add(shoe);
  });

  // Ejector Hydraulic Cylinder on Back of Movable Platen
  const ejectorCyl = new THREE.Mesh(
    new THREE.CylinderGeometry(85, 85, machine.ejectorStroke + 180, 24),
    MAT.jointDark
  );
  ejectorCyl.rotation.x = Math.PI / 2;
  ejectorCyl.position.set(0, 0, movPlatenZ + platenThick / 2 + (machine.ejectorStroke + 180) / 2);
  group.add(ejectorCyl);

  // 3. TIE-BARS (4 Chrome Precision Columns)
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
    tb.position.set(tx, ty, (fixedPlatenZ + movPlatenZ) / 2 + 200);
    tb.castShadow = true;
    group.add(tb);

    // Front clamping tie-bar nut on Fixed Platen
    const nutF = new THREE.Mesh(
      new THREE.CylinderGeometry(tbRadius * 1.5, tbRadius * 1.5, 75, 6),
      MAT.jointDark
    );
    nutF.rotation.x = Math.PI / 2;
    nutF.position.set(tx, ty, fixedPlatenZ - platenThick / 2 - 38);
    group.add(nutF);

    // Rear clamping tie-bar nut on Rear Platen / Movable stroke end
    const nutR = new THREE.Mesh(
      new THREE.CylinderGeometry(tbRadius * 1.5, tbRadius * 1.5, 75, 6),
      MAT.jointDark
    );
    nutR.rotation.x = Math.PI / 2;
    nutR.position.set(tx, ty, fixedPlatenZ + tbTotalLength * 0.6);
    group.add(nutR);
  });

  // 4. TOYO MACHINE BASE BED & SLIDE RAILS
  const bedWidth = platenW * 0.95;
  const bedHeight = 220;
  const bedLength = Math.max(3800, (machine.machineLengthMm || 6500) * 0.7);
  const bedY = -platenH / 2 - bedHeight / 2 - 10;
  const bedZ = (fixedPlatenZ + movPlatenZ) / 2 + 200;

  const bed = new THREE.Mesh(
    new THREE.BoxGeometry(bedWidth, bedHeight, bedLength),
    MAT.toyoGreen
  );
  bed.position.set(0, bedY, bedZ);
  bed.receiveShadow = true;
  group.add(bed);

  // Machine Bed Hardened Steel Way Rails
  [-1, 1].forEach(side => {
    const rail = new THREE.Mesh(
      new THREE.BoxGeometry(90, 25, bedLength * 0.95),
      MAT.platenSteel
    );
    rail.position.set(side * (bedWidth * 0.38), bedY + bedHeight / 2 + 12, bedZ);
    group.add(rail);
  });

  // Die Daylight Scrap / Slug Chute (Under parting line)
  const chute = new THREE.Mesh(
    new THREE.BoxGeometry(bedWidth * 0.6, 60, 600),
    MAT.castRecess
  );
  chute.position.set(0, bedY + bedHeight / 2 - 10, (die.fixedDieOffsetZ + die.movableDieOffsetZ) / 2);
  group.add(chute);

  // 5. INJECTION SYSTEM (Shot Sleeve, Injection Carriage, & Nitrogen Accumulator Bottles)
  const shotSleeveY = machine.injectionAxisOffsetY;
  const shotSleeveLen = (machine.plungerStroke || 500) + 350;
  const shotSleeve = new THREE.Mesh(
    new THREE.CylinderGeometry(65, 70, shotSleeveLen, 24),
    MAT.jointDark
  );
  shotSleeve.rotation.x = Math.PI / 2;
  shotSleeve.position.set(0, shotSleeveY, fixedPlatenZ - shotSleeveLen / 2);
  group.add(shotSleeve);

  // Shot Sleeve Pouring Port (Opening for Molten Metal Spoon / Launder)
  const pourPort = new THREE.Mesh(
    new THREE.CylinderGeometry(40, 40, 45, 16),
    MAT.platenSteel
  );
  pourPort.position.set(0, shotSleeveY + 65, fixedPlatenZ - 280);
  group.add(pourPort);

  // Injection Hydraulic Accumulator Bottles (Toyo Multi-Stage Accumulator System)
  const bottleCount = machine.clampingForceTons > 600 ? 3 : 2;
  for (let i = 0; i < bottleCount; i++) {
    const bX = (i - (bottleCount - 1) / 2) * 180;
    const bottle = new THREE.Mesh(
      new THREE.CylinderGeometry(75, 75, 750, 20),
      MAT.toyoGreen
    );
    bottle.position.set(bX, shotSleeveY + 280, fixedPlatenZ - shotSleeveLen - 200);
    group.add(bottle);

    // Pressure Gauge on top of bottle
    const bGauge = new THREE.Mesh(
      new THREE.CylinderGeometry(18, 18, 12, 16),
      MAT.brass
    );
    bGauge.position.set(bX, shotSleeveY + 680, fixedPlatenZ - shotSleeveLen - 200);
    group.add(bGauge);
  }

  // 6. TOYO PLUNGER LUBRICATOR UNIT (DM05 / DM10 / L-15)
  const lubeModel = machine.plungerLubricatorModel || 'DM05/DC-TY-B1';
  const lubeUnitX = 140;
  const lubeUnitY = shotSleeveY + 200;
  const lubeUnitZ = fixedPlatenZ - 280;

  const lubeBracket = new THREE.Mesh(
    new THREE.BoxGeometry(80, 160, 90),
    MAT.jointDark
  );
  lubeBracket.position.set(lubeUnitX, lubeUnitY, lubeUnitZ);
  group.add(lubeBracket);

  // Translucent Oil-Mist Reservoir Tank
  const lubeTank = new THREE.Mesh(
    new THREE.CylinderGeometry(35, 35, 120, 16),
    MAT.screenGlass
  );
  lubeTank.position.set(lubeUnitX, lubeUnitY + 110, lubeUnitZ);
  group.add(lubeTank);

  // Oil delivery nozzle tube into shot sleeve
  try {
    const lubeCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(lubeUnitX, lubeUnitY + 50, lubeUnitZ),
      new THREE.Vector3(lubeUnitX * 0.5, lubeUnitY + 20, lubeUnitZ),
      new THREE.Vector3(0, shotSleeveY + 80, lubeUnitZ)
    ]);
    const lubeTube = new THREE.Mesh(
      new THREE.TubeGeometry(lubeCurve, 12, 5, 8, false),
      MAT.copper
    );
    group.add(lubeTube);
  } catch (e) {
    // Ignore if geometry curve fails
  }

  // 7. TOYO SYSTEM 700EX OPERATOR CONSOLE & HMI
  const consoleX = platenW * 0.5 + 400;
  const consoleY = -200;
  const consoleZ = fixedPlatenZ + 150;

  const hmiCabinet = new THREE.Mesh(
    new THREE.BoxGeometry(320, 1200, 240),
    MAT.cabinetGrey
  );
  hmiCabinet.position.set(consoleX, consoleY, consoleZ);
  hmiCabinet.castShadow = true;
  group.add(hmiCabinet);

  // 15-inch Touchscreen Color Monitor
  const hmiScreen = new THREE.Mesh(
    new THREE.BoxGeometry(20, 260, 200),
    MAT.screenGlass
  );
  hmiScreen.position.set(consoleX - 160, consoleY + 240, consoleZ);
  group.add(hmiScreen);

  // Toyo Logo Badge Bar
  const toyoBadge = new THREE.Mesh(
    new THREE.BoxGeometry(18, 35, 200),
    MAT.alertRed
  );
  toyoBadge.position.set(consoleX - 160, consoleY + 390, consoleZ);
  group.add(toyoBadge);

  // Operator Emergency Stop & Push Buttons
  const eStop = new THREE.Mesh(
    new THREE.CylinderGeometry(18, 18, 20, 16),
    MAT.alertRed
  );
  eStop.rotation.z = Math.PI / 2;
  eStop.position.set(consoleX - 170, consoleY + 60, consoleZ - 50);
  group.add(eStop);

  // 3-Color Andon Signal Tower (Red / Amber / Green)
  const towerBase = new THREE.Mesh(
    new THREE.CylinderGeometry(15, 15, 220, 16),
    MAT.jointDark
  );
  towerBase.position.set(consoleX, consoleY + 700, consoleZ);
  group.add(towerBase);

  const lightR = new THREE.Mesh(new THREE.CylinderGeometry(20, 20, 32, 16), MAT.alertRed);
  lightR.position.set(consoleX, consoleY + 840, consoleZ);
  group.add(lightR);

  const lightA = new THREE.Mesh(new THREE.CylinderGeometry(20, 20, 32, 16), MAT.alertAmber);
  lightA.position.set(consoleX, consoleY + 805, consoleZ);
  group.add(lightA);

  const lightG = new THREE.Mesh(new THREE.CylinderGeometry(20, 20, 32, 16), MAT.alertGreen);
  lightG.position.set(consoleX, consoleY + 770, consoleZ);
  group.add(lightG);
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
 * Authoritative Kinematic Robot Arm Rig Interface
 */
export interface RobotArmRig {
  armGroup: THREE.Group;
  baseGroup: THREE.Group;
  tcpGroup: THREE.Group;
  flangeGroup: THREE.Group;
  jointGroups: [THREE.Group, THREE.Group, THREE.Group, THREE.Group, THREE.Group, THREE.Group];
  updatePose: (
    pose: RobotArmPoseInput,
    tcpMatrix?: number[],
    jointsDegFallback?: [number, number, number, number, number, number]
  ) => void;
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

  // =========================================================================
  // 2. INDUSTRIAL ROBOT 3D MESH GEOMETRIES & ATTACHMENTS
  // =========================================================================

  // --- Base Anchor Meshes (Stationary mounting interface) ---
  const baseFlangeGeo = trackGeo(new THREE.CylinderGeometry(230, 250, 48, 32));
  baseFlangeGeo.rotateX(Math.PI / 2);
  baseFlangeGeo.translate(0, 0, 24);
  const baseFlangeMesh = new THREE.Mesh(baseFlangeGeo, MAT.jointDark);
  baseFlangeMesh.castShadow = true;
  baseGroup.add(baseFlangeMesh);

  const boltRingGeo = trackGeo(new THREE.CylinderGeometry(245, 245, 14, 32));
  boltRingGeo.rotateX(Math.PI / 2);
  boltRingGeo.translate(0, 0, 10);
  const boltRingMesh = new THREE.Mesh(boltRingGeo, MAT.platenSteel);
  baseGroup.add(boltRingMesh);

  const baseHousingGeo = trackGeo(new THREE.CylinderGeometry(205, 225, 36, 32));
  baseHousingGeo.rotateX(Math.PI / 2);
  baseHousingGeo.translate(0, 0, 48 + 18);
  const baseHousingMesh = new THREE.Mesh(baseHousingGeo, castMat);
  baseHousingMesh.castShadow = true;
  baseGroup.add(baseHousingMesh);

  const junctionBoxGeo = trackGeo(new THREE.BoxGeometry(110, 75, 55));
  const junctionBox = new THREE.Mesh(junctionBoxGeo, MAT.jointDark);
  junctionBox.position.set(0, -180, 45);
  baseGroup.add(junctionBox);

  // --- J1 Turntable & Shoulder Fork Meshes ---
  const j1TurntableGeo = trackGeo(new THREE.CylinderGeometry(195, 205, 32, 32));
  j1TurntableGeo.rotateX(Math.PI / 2);
  j1TurntableGeo.translate(0, 0, 84 + 16);
  const j1TurntableMesh = new THREE.Mesh(j1TurntableGeo, castMat);
  j1Group.add(j1TurntableMesh);

  const forkH = Math.max(80, d1 - 100);
  const forkColGeo = trackGeo(new THREE.BoxGeometry(200, 220, forkH));
  const forkColMesh = new THREE.Mesh(forkColGeo, castMat);
  forkColMesh.position.set(a1 * 0.45, 0, 100 + forkH / 2);
  forkColMesh.castShadow = true;
  j1Group.add(forkColMesh);

  [-1, 1].forEach(side => {
    const earGeo = trackGeo(new THREE.BoxGeometry(160, 42, 170));
    const earMesh = new THREE.Mesh(earGeo, castMat);
    earMesh.position.set(a1, side * 115, d1);
    earMesh.castShadow = true;
    j1Group.add(earMesh);

    const capGeo = trackGeo(new THREE.CylinderGeometry(60, 60, 16, 24));
    const capMesh = new THREE.Mesh(capGeo, MAT.jointDark);
    capMesh.position.set(a1, side * 138, d1);
    j1Group.add(capMesh);
  });

  const j1MotorGeo = trackGeo(new THREE.CylinderGeometry(70, 70, 180, 24));
  j1MotorGeo.rotateX(Math.PI / 2);
  const j1MotorMesh = new THREE.Mesh(j1MotorGeo, MAT.jointDark);
  j1MotorMesh.position.set(-70, 0, 100 + forkH * 0.45);
  j1Group.add(j1MotorMesh);

  // --- J2 Shoulder & Upper Arm Meshes ---
  const shoulderHubGeo = trackGeo(new THREE.CylinderGeometry(95, 95, 230, 24));
  const shoulderHubMesh = new THREE.Mesh(shoulderHubGeo, MAT.jointDark);
  shoulderHubMesh.castShadow = true;
  j2Group.add(shoulderHubMesh);

  const j2MotorGeo = trackGeo(new THREE.CylinderGeometry(68, 68, 140, 20));
  j2MotorGeo.rotateX(Math.PI / 2);
  const j2MotorMesh = new THREE.Mesh(j2MotorGeo, MAT.jointDark);
  j2MotorMesh.position.set(-65, 0, -45);
  j2Group.add(j2MotorMesh);

  const upperArmGeo = trackGeo(new THREE.CylinderGeometry(76, 92, l2, 24));
  upperArmGeo.rotateX(Math.PI / 2);
  upperArmGeo.translate(0, 0, l2 / 2);
  const upperArmMesh = new THREE.Mesh(upperArmGeo, castMat);
  upperArmMesh.castShadow = true;
  j2Group.add(upperArmMesh);

  const ribGeo = trackGeo(new THREE.BoxGeometry(32, 28, l2 * 0.85));
  const ribMesh = new THREE.Mesh(ribGeo, MAT.jointDark);
  ribMesh.position.set(55, 0, l2 * 0.5);
  j2Group.add(ribMesh);

  const trimGeo = trackGeo(new THREE.BoxGeometry(36, 6, 140));
  const trimMesh = new THREE.Mesh(trimGeo, MAT.aluminumPart);
  trimMesh.position.set(0, 78, l2 * 0.5);
  j2Group.add(trimMesh);

  // --- J3 Elbow & Forearm Meshes ---
  const elbowHubGeo = trackGeo(new THREE.CylinderGeometry(85, 85, 210, 24));
  const elbowHubMesh = new THREE.Mesh(elbowHubGeo, MAT.jointDark);
  elbowHubMesh.castShadow = true;
  j3Group.add(elbowHubMesh);

  const elbowMotorGeo = trackGeo(new THREE.CylinderGeometry(62, 62, 90, 20));
  const elbowMotorMesh = new THREE.Mesh(elbowMotorGeo, MAT.jointDark);
  elbowMotorMesh.position.set(0, 115, 0);
  j3Group.add(elbowMotorMesh);

  const forearmGeo = trackGeo(new THREE.CylinderGeometry(58, 74, l3, 24));
  forearmGeo.rotateX(Math.PI / 2);
  forearmGeo.translate(0, 0, l3 / 2);
  const forearmMesh = new THREE.Mesh(forearmGeo, castMat);
  forearmMesh.castShadow = true;
  j3Group.add(forearmMesh);

  const conduitGeo = trackGeo(new THREE.BoxGeometry(24, 20, l3 * 0.8));
  const conduitMesh = new THREE.Mesh(conduitGeo, MAT.jointDark);
  conduitMesh.position.set(0, 52, l3 * 0.5);
  j3Group.add(conduitMesh);

  // --- J4 Forearm Roll Meshes ---
  const j4CollarGeo = trackGeo(new THREE.CylinderGeometry(60, 64, 60, 24));
  j4CollarGeo.rotateX(Math.PI / 2);
  j4CollarGeo.translate(0, 0, -25);
  const j4CollarMesh = new THREE.Mesh(j4CollarGeo, MAT.jointDark);
  j4CollarMesh.castShadow = true;
  j4Group.add(j4CollarMesh);

  // --- J5 Wrist Pitch Meshes ---
  const j5KnuckleGeo = trackGeo(new THREE.CylinderGeometry(52, 52, 130, 20));
  const j5KnuckleMesh = new THREE.Mesh(j5KnuckleGeo, MAT.jointDark);
  j5KnuckleMesh.castShadow = true;
  j5Group.add(j5KnuckleMesh);

  const j5BarrelGeo = trackGeo(new THREE.CylinderGeometry(46, 50, l4 * 0.7, 20));
  j5BarrelGeo.rotateX(Math.PI / 2);
  j5BarrelGeo.translate(0, 0, l4 * 0.35);
  const j5BarrelMesh = new THREE.Mesh(j5BarrelGeo, castMat);
  j5BarrelMesh.castShadow = true;
  j5Group.add(j5BarrelMesh);

  // --- J6 Flange Roll Meshes ---
  const j6SpindleGeo = trackGeo(new THREE.CylinderGeometry(48, 48, 20, 24));
  j6SpindleGeo.rotateX(Math.PI / 2);
  j6SpindleGeo.translate(0, 0, l4 - 10);
  const j6SpindleMesh = new THREE.Mesh(j6SpindleGeo, MAT.jointDark);
  j6Group.add(j6SpindleMesh);

  // --- Flange Adapter Meshes ---
  const flangePlateGeo = trackGeo(new THREE.CylinderGeometry(75, 75, 18, 24));
  flangePlateGeo.rotateX(Math.PI / 2);
  flangePlateGeo.translate(0, 0, 9);
  const flangePlateMesh = new THREE.Mesh(flangePlateGeo, MAT.platenSteel);
  flangePlateMesh.castShadow = true;
  flangeGroup.add(flangePlateMesh);

  const toolDistZ = tool.z || 220;
  const stemH = Math.max(20, toolDistZ - 30);
  const toolStemGeo = trackGeo(new THREE.CylinderGeometry(28, 34, stemH, 16));
  toolStemGeo.rotateX(Math.PI / 2);
  toolStemGeo.translate(0, 0, stemH / 2 + 18);
  const toolStemMesh = new THREE.Mesh(toolStemGeo, MAT.platenSteel);
  flangeGroup.add(toolStemMesh);

  // --- Tool TCP Manifold Meshes (Rigidly parented to tcpGroup) ---
  const mWidth = tool.manifoldWidthMm || 360;
  const headType = tool.sprayHeadType || 'dual_sided';

  if (headType === 'dual_sided') {
    // Dual-Sided Opposing Manifold
    const manifoldHub = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(mWidth, 60, 50)), MAT.toolBlue);
    manifoldHub.castShadow = true;
    tcpGroup.add(manifoldHub);

    // Fixed die spray face nozzles (local -Z)
    const fixedFace = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(mWidth * 0.88, 16, 14)), MAT.brass);
    fixedFace.position.set(0, 0, -32);
    tcpGroup.add(fixedFace);

    // Moving die spray face nozzles (local +Z)
    const movFace = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(mWidth * 0.88, 16, 14)), MAT.brass);
    movFace.position.set(0, 0, 32);
    tcpGroup.add(movFace);

    // Supply fittings
    [-1, 1].forEach(side => {
      const fitting = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(12, 12, 28, 12)), MAT.platenSteel);
      fitting.position.set(side * mWidth * 0.28, 38, 0);
      tcpGroup.add(fitting);
    });
  } else if (headType === 'contour_frame') {
    // Picture-Frame Rectangular Manifold
    const fTop = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(mWidth, 26, 32)), MAT.toolBlue);
    fTop.position.set(0, 75, 0);
    tcpGroup.add(fTop);

    const fBot = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(mWidth, 26, 32)), MAT.toolBlue);
    fBot.position.set(0, -75, 0);
    tcpGroup.add(fBot);

    const fLegL = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(26, 170, 32)), MAT.toolBlue);
    fLegL.position.set(-mWidth / 2 + 13, 0, 0);
    tcpGroup.add(fLegL);

    const fLegR = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(26, 170, 32)), MAT.toolBlue);
    fLegR.position.set(mWidth / 2 - 13, 0, 0);
    tcpGroup.add(fLegR);
  } else if (headType === 'modular_extension') {
    // Extended deep cavity lances
    const mBase = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(45, 50, 35, 16)), MAT.jointDark);
    tcpGroup.add(mBase);

    [-65, 65].forEach(lx => {
      const lance = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(8, 8, 240, 16)), MAT.platenSteel);
      lance.rotation.x = Math.PI / 2;
      lance.position.set(lx, 0, -120);
      tcpGroup.add(lance);

      const brassTip = new THREE.Mesh(trackGeo(new THREE.SphereGeometry(15, 12, 12)), MAT.brass);
      brassTip.position.set(lx, 0, -240);
      tcpGroup.add(brassTip);
    });
  } else {
    // Micro-Spray / Conventional Manifold
    const bar = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(mWidth, 48, 38)), MAT.platenSteel);
    tcpGroup.add(bar);

    const nozzleStrip = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(mWidth * 0.9, 10, 8)), MAT.brass);
    nozzleStrip.position.set(0, 0, -22);
    tcpGroup.add(nozzleStrip);
  }

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
  };

  return {
    armGroup,
    baseGroup,
    tcpGroup,
    flangeGroup,
    jointGroups: [j1Group, j2Group, j3Group, j4Group, j5Group, j6Group],
    updatePose,
    dispose
  };
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
