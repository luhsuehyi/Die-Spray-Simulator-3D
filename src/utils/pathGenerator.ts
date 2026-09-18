import { Waypoint } from '../types/path';
import { DieModel } from '../types/die';
import { RobotModelSpec, RobotMountType, ToolCenterPoint, HpdcSequenceState } from '../types/robot';

export interface SprayIntentConfig {
  selectedZones: {
    fixedCavity: boolean;
    movableCore: boolean;
    slide: boolean;
    core: boolean;
    gateArea: boolean;
    hotSpots: boolean;
    deepPockets?: boolean;
    runnerSprue?: boolean;
    partingLine?: boolean;
  };
  sprayDistanceMm: number; // e.g. 140mm
  spraySpeedMmS: number; // e.g. 350mm/s
  sprayAngleDeg: number; // e.g. 0° perpendicular or 15°
  passes: number; // 1 or 2 passes
  airBlowSec: number; // e.g. 1.2s
  airBlowMode: 'follow_spray' | 'dedicated_path' | 'custom_dwell';
}

export const DEFAULT_SPRAY_INTENT: SprayIntentConfig = {
  selectedZones: {
    fixedCavity: true,
    movableCore: true,
    slide: true,
    core: true,
    gateArea: true,
    hotSpots: true,
    deepPockets: true,
    runnerSprue: true,
    partingLine: false
  },
  sprayDistanceMm: 140,
  spraySpeedMmS: 350,
  sprayAngleDeg: 0,
  passes: 1,
  airBlowSec: 1.2,
  airBlowMode: 'dedicated_path'
};

export interface HpdcWaypointMeta {
  hpdcState: HpdcSequenceState;
  stateLabel: string;
}

/**
 * Generates an automated, production-grade HPDC spray sequence.
 * Full 10-state sequence:
 * 1. HOME / PURGE
 * 2. STANDBY / WAIT
 * 3. APPROACH
 * 4. ENTRY
 * 5. READY / ALIGN
 * 6. SPRAY FIXED DIE
 * 7. SPRAY MOVING DIE
 * 8. SPRAY HOT SPOTS
 * 9. AIR BLOW / DRYING
 * 10. EXIT DIE
 * 11. STANDBY / HOME
 */
export function generatePathFromIntent(
  intent: SprayIntentConfig,
  die: DieModel,
  robot: RobotModelSpec,
  tool?: ToolCenterPoint
): Waypoint[] {
  const waypoints: Waypoint[] = [];
  let index = 0;

  const isTop = robot.mountOrientation === 'top';
  const mountType: RobotMountType = (robot.mountOrientation as RobotMountType) || 'top';
  const isDualSided = tool?.sprayHeadType === 'dual_sided' || tool?.manifoldType === 'dual_sided_matrix';

  const fixedFaceZ = die.fixedDieOffsetZ;
  const movableFaceZ = die.movableDieOffsetZ;
  const daylightOpeningMm = Math.abs(movableFaceZ - fixedFaceZ);
  const cavityDepth = die.dimensions.depth * 0.45;

  // Standoff Z coordinates
  const fixedSprayZ = fixedFaceZ + intent.sprayDistanceMm;
  const movableSprayZ = movableFaceZ - intent.sprayDistanceMm;
  const transitZ = (fixedFaceZ + movableFaceZ) / 2;

  // 1. HOME / PURGE: Safe starting position outside envelope
  const homePos: [number, number, number] = isTop
    ? [0, robot.baseOffset[1] - 320, 0]
    : [robot.baseOffset[0] * 0.82, 220, transitZ];

  waypoints.push({
    id: `wp-${Date.now()}-${index}`,
    index: index++,
    name: '1. HOME / PURGE (Safe Standby)',
    x: homePos[0],
    y: homePos[1],
    z: homePos[2],
    rx: isTop ? 90 : 0,
    ry: 0,
    rz: 0,
    motionType: 'JOINT',
    speed: 1200,
    acceleration: 2500,
    blendRadius: 0,
    dwellTimeSec: 0.5,
    action: 'MICRO_PURGE',
    targetFace: 'TRANSIT',
    lubePressureBar: 3.5,
    airPressureBar: 4.5,
    flowRateMlPerSec: 10,
    nozzleFanAngleDeg: 60,
    standoffDistanceMm: 500
  });

  // 2. STANDBY / WAIT: Near clearance boundary waiting for die to open
  const standbyY = isTop ? die.dimensions.height * 0.65 + 320 : 0;
  const standbyX = isTop ? 0 : -(die.dimensions.width * 0.65 + 350);

  waypoints.push({
    id: `wp-${Date.now()}-${index}`,
    index: index++,
    name: '2. WAIT FOR DIE OPEN (Boundary)',
    x: standbyX,
    y: standbyY,
    z: transitZ,
    rx: isTop ? 85 : 0,
    ry: 0,
    rz: 0,
    motionType: 'JOINT',
    speed: 900,
    acceleration: 2200,
    blendRadius: 30,
    dwellTimeSec: 0.2,
    action: 'NONE',
    targetFace: 'TRANSIT',
    lubePressureBar: 0,
    airPressureBar: 0,
    flowRateMlPerSec: 0,
    nozzleFanAngleDeg: 60,
    standoffDistanceMm: 400
  });

  // 3. APPROACH: Moving toward the open mold daylight
  const approachY = isTop ? die.dimensions.height * 0.5 + 160 : 0;
  const approachX = isTop ? 0 : -(die.dimensions.width * 0.5 + 160);

  waypoints.push({
    id: `wp-${Date.now()}-${index}`,
    index: index++,
    name: '3. APPROACH (Toward Open Daylight)',
    x: approachX,
    y: approachY,
    z: transitZ,
    rx: isTop ? 80 : 0,
    ry: 0,
    rz: 0,
    motionType: 'LINEAR',
    speed: 850,
    acceleration: 2200,
    blendRadius: 35,
    dwellTimeSec: 0,
    action: 'NONE',
    targetFace: 'TRANSIT',
    lubePressureBar: 0,
    airPressureBar: 0,
    flowRateMlPerSec: 0,
    nozzleFanAngleDeg: 60,
    standoffDistanceMm: 300
  });

  // 4. ENTRY: Moving into the space between die halves (Clearance Zone)
  waypoints.push({
    id: `wp-${Date.now()}-${index}`,
    index: index++,
    name: '4. ENTER DIE (Safety Clearance Zone)',
    x: 0,
    y: die.dimensions.height * 0.35,
    z: transitZ,
    rx: isTop ? 80 : 0,
    ry: 0,
    rz: 0,
    motionType: 'LINEAR',
    speed: 650,
    acceleration: 1800,
    blendRadius: 25,
    dwellTimeSec: 0,
    action: 'NONE',
    targetFace: 'TRANSIT',
    lubePressureBar: 0,
    airPressureBar: 0,
    flowRateMlPerSec: 0,
    nozzleFanAngleDeg: 60,
    standoffDistanceMm: 220
  });

  // 5. READY / ALIGN: Tool oriented and aligned to spray
  waypoints.push({
    id: `wp-${Date.now()}-${index}`,
    index: index++,
    name: '5. READY TO SPRAY (Center Aligned)',
    x: 0,
    y: 0,
    z: fixedSprayZ,
    rx: intent.sprayAngleDeg,
    ry: 0,
    rz: 0,
    motionType: 'LINEAR',
    speed: 500,
    acceleration: 1500,
    blendRadius: 20,
    dwellTimeSec: 0.1,
    action: 'NONE',
    targetFace: 'FIXED_DIE',
    lubePressureBar: 0,
    airPressureBar: 0,
    flowRateMlPerSec: 0,
    nozzleFanAngleDeg: 70,
    standoffDistanceMm: intent.sprayDistanceMm
  });

  // 6. SPRAY FIXED DIE (Cover Side Stationary Half)
  if (intent.selectedZones.fixedCavity) {
    // Upper Pass
    waypoints.push({
      id: `wp-${Date.now()}-${index}`,
      index: index++,
      name: '6a. SPRAY FIXED DIE (Top Pass)',
      x: -die.dimensions.width * 0.22,
      y: die.dimensions.height * 0.22,
      z: fixedSprayZ,
      rx: intent.sprayAngleDeg,
      ry: 0,
      rz: 0,
      motionType: 'LINEAR',
      speed: intent.spraySpeedMmS,
      acceleration: 1800,
      blendRadius: 30,
      dwellTimeSec: 0.15,
      action: 'LUBE_SPRAY',
      targetFace: 'FIXED_DIE',
      lubePressureBar: 4.2,
      airPressureBar: 5.5,
      flowRateMlPerSec: 45,
      nozzleFanAngleDeg: 75,
      standoffDistanceMm: intent.sprayDistanceMm
    });

    // Lower Pass
    waypoints.push({
      id: `wp-${Date.now()}-${index}`,
      index: index++,
      name: '6b. SPRAY FIXED DIE (Bottom Pass)',
      x: die.dimensions.width * 0.22,
      y: -die.dimensions.height * 0.2,
      z: fixedSprayZ,
      rx: intent.sprayAngleDeg,
      ry: 0,
      rz: 0,
      motionType: 'LINEAR',
      speed: intent.spraySpeedMmS,
      acceleration: 1800,
      blendRadius: 30,
      dwellTimeSec: 0.2,
      action: 'LUBE_SPRAY',
      targetFace: 'FIXED_DIE',
      lubePressureBar: 4.2,
      airPressureBar: 5.5,
      flowRateMlPerSec: 45,
      nozzleFanAngleDeg: 75,
      standoffDistanceMm: intent.sprayDistanceMm
    });
  }

  // 7. SPRAY MOVING DIE (Ejector Side Core Face)
  if (intent.selectedZones.movableCore) {
    // Note: If dual-sided, tool already has nozzles facing moving die
    const wristAngle = isDualSided ? intent.sprayAngleDeg : 180 + intent.sprayAngleDeg;

    waypoints.push({
      id: `wp-${Date.now()}-${index}`,
      index: index++,
      name: '7a. SPRAY MOVING DIE (Ejector Pin Area)',
      x: -die.dimensions.width * 0.2,
      y: die.dimensions.height * 0.1,
      z: movableSprayZ,
      rx: wristAngle,
      ry: 0,
      rz: 0,
      motionType: 'LINEAR',
      speed: intent.spraySpeedMmS,
      acceleration: 1800,
      blendRadius: 35,
      dwellTimeSec: 0.25,
      action: 'LUBE_SPRAY',
      targetFace: 'MOVABLE_DIE',
      lubePressureBar: 4.0,
      airPressureBar: 5.5,
      flowRateMlPerSec: 42,
      nozzleFanAngleDeg: 75,
      standoffDistanceMm: intent.sprayDistanceMm
    });

    waypoints.push({
      id: `wp-${Date.now()}-${index}`,
      index: index++,
      name: '7b. SPRAY MOVING DIE (Core Base Sweep)',
      x: die.dimensions.width * 0.18,
      y: -die.dimensions.height * 0.15,
      z: movableSprayZ,
      rx: wristAngle,
      ry: 0,
      rz: 0,
      motionType: 'LINEAR',
      speed: intent.spraySpeedMmS,
      acceleration: 1800,
      blendRadius: 35,
      dwellTimeSec: 0.2,
      action: 'LUBE_SPRAY',
      targetFace: 'MOVABLE_DIE',
      lubePressureBar: 4.0,
      airPressureBar: 5.5,
      flowRateMlPerSec: 42,
      nozzleFanAngleDeg: 75,
      standoffDistanceMm: intent.sprayDistanceMm
    });
  }

  // 8. SPRAY HOT SPOTS (Biscuit, Runner Gate, Core Pins, Thick Bosses)
  if (intent.selectedZones.hotSpots || intent.selectedZones.gateArea || intent.selectedZones.core || intent.selectedZones.slide) {
    // 8a. Biscuit & Ingate High Thermal Priority
    waypoints.push({
      id: `wp-${Date.now()}-${index}`,
      index: index++,
      name: '8a. SPRAY HOT SPOT (Biscuit & Ingate)',
      x: 0,
      y: -die.dimensions.height * 0.32,
      z: fixedSprayZ - 15,
      rx: -15,
      ry: 0,
      rz: 0,
      motionType: 'LINEAR',
      speed: Math.max(120, intent.spraySpeedMmS * 0.6),
      acceleration: 1400,
      blendRadius: 20,
      dwellTimeSec: 0.45,
      action: 'LUBE_AND_AIR',
      targetFace: 'FIXED_DIE',
      lubePressureBar: 4.8,
      airPressureBar: 6.2,
      flowRateMlPerSec: 58,
      nozzleFanAngleDeg: 65,
      standoffDistanceMm: Math.max(90, intent.sprayDistanceMm - 25)
    });

    // 8b. Core Pin Deep Pocket / Slider Interface
    if (intent.selectedZones.core || intent.selectedZones.slide) {
      waypoints.push({
        id: `wp-${Date.now()}-${index}`,
        index: index++,
        name: '8b. SPRAY HOT SPOT (Core Pin & Slide)',
        x: die.dimensions.width * 0.15,
        y: die.dimensions.height * 0.18,
        z: fixedSprayZ - cavityDepth * 0.35,
        rx: 12,
        ry: 0,
        rz: 0,
        motionType: 'LINEAR',
        speed: Math.max(140, intent.spraySpeedMmS * 0.7),
        acceleration: 1500,
        blendRadius: 20,
        dwellTimeSec: 0.35,
        action: 'LUBE_AND_AIR',
        targetFace: 'FIXED_DIE',
        lubePressureBar: 4.6,
        airPressureBar: 6.0,
        flowRateMlPerSec: 50,
        nozzleFanAngleDeg: 60,
        standoffDistanceMm: Math.max(90, intent.sprayDistanceMm - 20)
      });
    }
  }

  // 9. AIR BLOW / DRYING: Liquid off, air on. Flash drying and excess pooling removal
  waypoints.push({
    id: `wp-${Date.now()}-${index}`,
    index: index++,
    name: '9. AIR BLOW (Drying & Vent Clear)',
    x: 0,
    y: 0,
    z: transitZ,
    rx: 90,
    ry: 0,
    rz: 0,
    motionType: 'LINEAR',
    speed: 650,
    acceleration: 2000,
    blendRadius: 30,
    dwellTimeSec: intent.airBlowSec,
    action: 'AIR_BLOW',
    targetFace: 'BOTH',
    lubePressureBar: 0,
    airPressureBar: 6.5,
    flowRateMlPerSec: 0,
    nozzleFanAngleDeg: 85,
    standoffDistanceMm: 180
  });

  // 10. EXIT DIE: Controlled retract trajectory through daylight opening
  waypoints.push({
    id: `wp-${Date.now()}-${index}`,
    index: index++,
    name: '10. EXIT DIE (Controlled Retract)',
    x: approachX,
    y: approachY,
    z: transitZ,
    rx: isTop ? 80 : 0,
    ry: 0,
    rz: 0,
    motionType: 'LINEAR',
    speed: 950,
    acceleration: 2400,
    blendRadius: 40,
    dwellTimeSec: 0,
    action: 'NONE',
    targetFace: 'TRANSIT',
    lubePressureBar: 0,
    airPressureBar: 0,
    flowRateMlPerSec: 0,
    nozzleFanAngleDeg: 60,
    standoffDistanceMm: 350
  });

  // 11. STANDBY / HOME: Machine clear signal emitted, ready for die closing
  waypoints.push({
    id: `wp-${Date.now()}-${index}`,
    index: index++,
    name: '11. HOME STANDBY (Robot Clear)',
    x: homePos[0],
    y: homePos[1],
    z: homePos[2],
    rx: isTop ? 90 : 0,
    ry: 0,
    rz: 0,
    motionType: 'JOINT',
    speed: 1200,
    acceleration: 2500,
    blendRadius: 0,
    dwellTimeSec: 0,
    action: 'NONE',
    targetFace: 'TRANSIT',
    lubePressureBar: 0,
    airPressureBar: 0,
    flowRateMlPerSec: 0,
    nozzleFanAngleDeg: 60,
    standoffDistanceMm: 500
  });

  return waypoints;
}
