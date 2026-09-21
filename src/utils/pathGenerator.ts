import { Waypoint } from '../types/path';
import { DieModel } from '../types/die';
import { RobotModelSpec, RobotMountType, ToolCenterPoint, HpdcSequenceState, RobotMountConfig } from '../types/robot';
import { solveInverseKinematics } from './kinematics';
import { getDefaultSeedJoints } from './waypointJoints';

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
 * Full 12-state sequence:
 * 1. HOME / PURGE
 * 2. WAIT FOR DIE OPEN (Boundary)
 * 3. APPROACH (Toward Open Daylight)
 * 4. ENTER DIE (Safety Clearance Zone)
 * 5. READY TO SPRAY (Center Aligned)
 * 6. SPRAY FIXED DIE (Top & Bottom Passes)
 * 7. TRANSITION (Center Cross Daylight)
 * 8. SPRAY MOVING DIE (Top & Bottom Passes)
 * 9. SPRAY HOT SPOTS (Biscuit & Ingate)
 * 10. AIR BLOW (Drying & Vent Clear)
 * 11. EXIT DIE (Controlled Retract)
 * 12. CLEAR MACHINE (Safety Boundary)
 * 13. HOME STANDBY (Robot Clear)
 */
export function generatePathFromIntent(
  intent: SprayIntentConfig,
  die: DieModel,
  robot: RobotModelSpec,
  tool?: ToolCenterPoint,
  mountConfig?: RobotMountConfig
): Waypoint[] {
  const waypoints: Waypoint[] = [];
  let index = 0;

  const mountType: RobotMountType = mountConfig?.type || (robot.mountOrientation as RobotMountType) || 'top';
  const isTop = mountType === 'top' || mountType === 'top_machine_mount';

  const fixedFaceZ = die.fixedDieOffsetZ;
  const movableFaceZ = die.movableDieOffsetZ;
  const transitZ = (fixedFaceZ + movableFaceZ) / 2;

  // Standoff Z coordinates
  const fixedSprayZ = fixedFaceZ + intent.sprayDistanceMm;
  const movableSprayZ = movableFaceZ - intent.sprayDistanceMm;

  // Standard vertical lance orientation for top-mounted robot:
  // In top-mount, [90, 0, 90] extends the tool lance vertically downward into the die daylight.
  const baseRx = isTop ? 90 : 0;
  const baseRz = isTop ? 90 : 0;
  const sprayTilt = Math.max(-15, Math.min(15, intent.sprayAngleDeg || 0));

  // 1. HOME / PURGE: Safe starting position outside envelope
  const homePos: [number, number, number] = isTop
    ? [0, 240, -195]
    : [robot.baseOffset[0] * 0.82, 220, transitZ];

  waypoints.push({
    id: `wp-${Date.now()}-${index}`,
    index: index++,
    name: '1. HOME / PURGE (Safe Standby)',
    x: homePos[0],
    y: homePos[1],
    z: homePos[2],
    rx: baseRx,
    ry: 0,
    rz: baseRz,
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

  // 2. WAIT FOR DIE OPEN (Boundary)
  const waitPos: [number, number, number] = isTop
    ? [0, 165, -79]
    : [-(die.dimensions.width * 0.65 + 350), 0, transitZ];

  waypoints.push({
    id: `wp-${Date.now()}-${index}`,
    index: index++,
    name: '2. WAIT FOR DIE OPEN (Boundary)',
    x: waitPos[0],
    y: waitPos[1],
    z: waitPos[2],
    rx: baseRx,
    ry: 0,
    rz: baseRz,
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

  // 3. APPROACH: Moving toward the open mold daylight above the top tie bars
  const approachPos: [number, number, number] = isTop
    ? [0, 96, -10]
    : [-(die.dimensions.width * 0.5 + 160), 0, transitZ];

  waypoints.push({
    id: `wp-${Date.now()}-${index}`,
    index: index++,
    name: '3. APPROACH (Toward Open Daylight)',
    x: approachPos[0],
    y: approachPos[1],
    z: approachPos[2],
    rx: baseRx,
    ry: 0,
    rz: baseRz,
    motionType: 'JOINT',
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

  // 4. ENTER DIE (Safety Clearance Zone)
  const enterPos: [number, number, number] = isTop
    ? [0, 50, transitZ]
    : [-(die.dimensions.width * 0.35), 0, transitZ];

  waypoints.push({
    id: `wp-${Date.now()}-${index}`,
    index: index++,
    name: '4. ENTER DIE (Safety Clearance Zone)',
    x: enterPos[0],
    y: enterPos[1],
    z: enterPos[2],
    rx: baseRx,
    ry: 0,
    rz: baseRz,
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

  // 5. READY TO SPRAY (Center Aligned)
  waypoints.push({
    id: `wp-${Date.now()}-${index}`,
    index: index++,
    name: '5. READY TO SPRAY (Center Aligned)',
    x: 0,
    y: 20,
    z: fixedSprayZ,
    rx: baseRx,
    ry: 0,
    rz: baseRz,
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

  // 6. SPRAY FIXED DIE (Top Pass & Bottom Pass)
  if (intent.selectedZones.fixedCavity) {
    const sweepX = Math.min(120, die.dimensions.width * 0.2);
    const sweepY = Math.min(80, die.dimensions.height * 0.2);

    waypoints.push({
      id: `wp-${Date.now()}-${index}`,
      index: index++,
      name: '6a. SPRAY FIXED DIE (Top Pass)',
      x: -sweepX,
      y: sweepY,
      z: fixedSprayZ,
      rx: baseRx + sprayTilt,
      ry: 0,
      rz: baseRz,
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

    waypoints.push({
      id: `wp-${Date.now()}-${index}`,
      index: index++,
      name: '6b. SPRAY FIXED DIE (Bottom Pass)',
      x: sweepX,
      y: -sweepY,
      z: fixedSprayZ,
      rx: baseRx + sprayTilt,
      ry: 0,
      rz: baseRz,
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

  // 7. TRANSITION (Cross Daylight from Fixed to Movable side)
  waypoints.push({
    id: `wp-${Date.now()}-${index}`,
    index: index++,
    name: '7. TRANSITION (Cross Daylight)',
    x: 0,
    y: 0,
    z: transitZ,
    rx: baseRx,
    ry: 0,
    rz: baseRz,
    motionType: 'LINEAR',
    speed: 600,
    acceleration: 2000,
    blendRadius: 30,
    dwellTimeSec: 0,
    action: 'NONE',
    targetFace: 'TRANSIT',
    lubePressureBar: 0,
    airPressureBar: 0,
    flowRateMlPerSec: 0,
    nozzleFanAngleDeg: 60,
    standoffDistanceMm: 250
  });

  // 8. SPRAY MOVING DIE (Top Pass & Bottom Pass)
  if (intent.selectedZones.movableCore) {
    const sweepX = Math.min(120, die.dimensions.width * 0.2);
    const sweepY = Math.min(80, die.dimensions.height * 0.2);

    waypoints.push({
      id: `wp-${Date.now()}-${index}`,
      index: index++,
      name: '8a. SPRAY MOVING DIE (Top Pass)',
      x: -sweepX,
      y: sweepY,
      z: movableSprayZ,
      rx: baseRx - sprayTilt,
      ry: 0,
      rz: baseRz,
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
      name: '8b. SPRAY MOVING DIE (Bottom Pass)',
      x: sweepX,
      y: -sweepY,
      z: movableSprayZ,
      rx: baseRx - sprayTilt,
      ry: 0,
      rz: baseRz,
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

  // 9. SPRAY HOT SPOTS (Biscuit, Runner Gate, Core Pins)
  if (intent.selectedZones.hotSpots || intent.selectedZones.gateArea) {
    waypoints.push({
      id: `wp-${Date.now()}-${index}`,
      index: index++,
      name: '9a. SPRAY HOT SPOT (Biscuit & Ingate)',
      x: 0,
      y: -Math.min(120, die.dimensions.height * 0.3),
      z: fixedSprayZ - 15,
      rx: baseRx - 5,
      ry: 0,
      rz: baseRz,
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
  }

  // 10. AIR BLOW / DRYING: Flash drying and excess pooling removal
  waypoints.push({
    id: `wp-${Date.now()}-${index}`,
    index: index++,
    name: '10. AIR BLOW (Drying & Vent Clear)',
    x: 0,
    y: 0,
    z: transitZ,
    rx: baseRx,
    ry: 0,
    rz: baseRz,
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

  // 11. EXIT DIE: Controlled retract trajectory through daylight opening
  waypoints.push({
    id: `wp-${Date.now()}-${index}`,
    index: index++,
    name: '11. EXIT DIE (Controlled Retract)',
    x: approachPos[0],
    y: approachPos[1],
    z: approachPos[2],
    rx: baseRx,
    ry: 0,
    rz: baseRz,
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

  // 12. CLEAR MACHINE: Safety Boundary reached above top tie bars
  waypoints.push({
    id: `wp-${Date.now()}-${index}`,
    index: index++,
    name: '12. CLEAR MACHINE (Safety Boundary)',
    x: waitPos[0],
    y: waitPos[1],
    z: waitPos[2],
    rx: baseRx,
    ry: 0,
    rz: baseRz,
    motionType: 'JOINT',
    speed: 1000,
    acceleration: 2400,
    blendRadius: 30,
    dwellTimeSec: 0,
    action: 'NONE',
    targetFace: 'TRANSIT',
    lubePressureBar: 0,
    airPressureBar: 0,
    flowRateMlPerSec: 0,
    nozzleFanAngleDeg: 60,
    standoffDistanceMm: 450
  });

  // 13. HOME STANDBY: Machine clear signal emitted, ready for die closing
  waypoints.push({
    id: `wp-${Date.now()}-${index}`,
    index: index++,
    name: '13. HOME STANDBY (Robot Clear)',
    x: homePos[0],
    y: homePos[1],
    z: homePos[2],
    rx: baseRx,
    ry: 0,
    rz: baseRz,
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

  // Precompute authoritative, continuous, collision-free joint angles for every waypoint
  const effectiveMount: RobotMountConfig = mountConfig || {
    type: mountType,
    topMountStyle: 'platen_direct',
    heightMm: robot.baseOffset[1] || 1350,
    distanceMm: robot.baseOffset[2] || -645,
    lateralMm: robot.baseOffset[0] || 0,
    rotationDeg: 0
  };

  let seedJoints: [number, number, number, number, number, number] = getDefaultSeedJoints(robot, isTop);

  for (const wp of waypoints) {
    const ik = solveInverseKinematics(
      [wp.x, wp.y, wp.z],
      [wp.rx, wp.ry, wp.rz],
      robot,
      seedJoints,
      tool,
      effectiveMount
    );

    if (ik.jointAnglesDeg && !ik.hasJointLimitViolation) {
      wp.jointAnglesDeg = ik.jointAnglesDeg;
      seedJoints = ik.jointAnglesDeg;
    } else if (ik.jointAnglesDeg) {
      wp.jointAnglesDeg = ik.jointAnglesDeg;
    }
  }

  return waypoints;
}

