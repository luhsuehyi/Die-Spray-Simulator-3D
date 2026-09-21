/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  JointKinematicSpec,
  Matrix4Tuple,
  RobotKinematicModel,
  RobotMountingTransform,
  ToolTransformSpec,
  Vector3Tuple
} from '../../types/kinematics';
import { RobotModelSpec, RobotMountConfig, ToolCenterPoint } from '../../types/robot';
import { DEG2RAD, Matrix4Utils, RAD2DEG } from './matrix4';
import { getCadChainForRobot } from './gp50CadChain';

/**
 * Derives the 4x4 mounting transformation matrix T_base for any mount configuration.
 * World coordinates:
 * +X: Lateral machine axis
 * +Y: Vertical axis (upwards)
 * +Z: Longitudinal machine clamping axis (Z<0 fixed die, Z>0 movable die)
 */
export function buildMountTransform(
  spec: RobotModelSpec,
  mountConfig?: RobotMountConfig
): RobotMountingTransform {
  const mountType = mountConfig?.type || spec.mountOrientation || 'top';
  const hasSpecOffset = spec.baseOffset && (spec.baseOffset[0] !== 0 || spec.baseOffset[1] !== 0 || spec.baseOffset[2] !== 0);

  // Authoritative Base World Position [X, Y, Z]
  // In HPDC cells, the robot base is physically stationary relative to the machine frame.
  const pos: Vector3Tuple = hasSpecOffset
    ? [spec.baseOffset[0], spec.baseOffset[1], spec.baseOffset[2]]
    : mountConfig
      ? [
          mountType === 'top' ? (mountConfig.lateralMm || 0) : -(mountConfig.distanceMm || 0),
          mountConfig.heightMm || 0,
          mountType === 'top' ? (mountConfig.distanceMm !== undefined ? mountConfig.distanceMm : 0) : (mountConfig.lateralMm || 0)
        ]
      : [...spec.baseOffset];

  const rotDeg = mountConfig?.rotationDeg || 0;
  const psi = rotDeg * DEG2RAD;

  let mat: Matrix4Tuple;
  let eulerDeg: Vector3Tuple;

  switch (mountType) {
    case 'top':
    case 'top_machine_mount': {
      // Inverted overhead gantry / top platen mount:
      // Base normal Z_0 points DOWNWARDS into cell (-Y)
      // X_0 points along [cos(psi), 0, sin(psi)]
      // Y_0 points along [-sin(psi), 0, cos(psi)]
      // X_0 x Y_0 = [0, -1, 0] = Z_0
      const cp = Math.cos(psi);
      const sp = Math.sin(psi);
      mat = [
        cp, -sp,  0, pos[0],
         0,   0, -1, pos[1],
        sp,  cp,  0, pos[2],
         0,   0,  0, 1
      ];
      eulerDeg = Matrix4Utils.toEulerDeg(mat);
      break;
    }

    case 'floor': {
      // Floor-anchored upright pedestal:
      // Z_0 points UPWARDS (+Y in world)
      // X_0 points along [cos(psi), 0, -sin(psi)]
      // Y_0 points along [-sin(psi), 0, -cos(psi)]
      // X_0 x Y_0 = [0, 1, 0] = Z_0 (orthonormal, det = +1)
      const cp = Math.cos(psi);
      const sp = Math.sin(psi);
      mat = [
         cp, -sp, 0, pos[0],
          0,   0, 1, pos[1],
        -sp, -cp, 0, pos[2],
          0,   0, 0, 1
      ];
      eulerDeg = Matrix4Utils.toEulerDeg(mat);
      break;
    }

    case 'side': {
      // Side frame shelf: Upright base facing die centerline
      const cp = Math.cos(psi);
      const sp = Math.sin(psi);
      mat = [
         0, -sp, cp, pos[0],
         1,   0,  0, pos[1],
         0,  cp, sp, pos[2],
         0,   0,  0, 1
      ];
      eulerDeg = Matrix4Utils.toEulerDeg(mat);
      break;
    }

    case 'rear': {
      // Rear cantilever shelf: Upright facing forward along +Z
      const cp = Math.cos(psi);
      const sp = Math.sin(psi);
      mat = [
        cp, -sp, 0, pos[0],
         0,   0, 1, pos[1],
       -sp, -cp, 0, pos[2],
         0,   0, 0, 1
      ];
      eulerDeg = Matrix4Utils.toEulerDeg(mat);
      break;
    }

    default: {
      mat = Matrix4Utils.fromTranslation(pos[0], pos[1], pos[2]);
      eulerDeg = [0, 0, 0];
      break;
    }
  }

  return {
    type: mountType,
    topMountStyle: mountConfig?.topMountStyle,
    position: pos,
    rotationEulerDeg: eulerDeg,
    matrix: mat
  };
}

/**
 * Builds the 4x4 Tool/TCP transformation matrix T_tool relative to the tool mount flange.
 */
export function buildToolTransform(tool?: ToolCenterPoint): ToolTransformSpec {
  if (!tool) {
    // Default spray tool offset (220mm along tool flange Z axis)
    const defaultOffset: Vector3Tuple = [0, 0, 220];
    const defaultEuler: Vector3Tuple = [0, 0, 0];
    return {
      offsetMm: defaultOffset,
      rotationEulerDeg: defaultEuler,
      matrix: Matrix4Utils.fromTranslation(0, 0, 220),
      weightKg: 15
    };
  }

  const toolAny = tool as any;
  const offset: Vector3Tuple = [
    tool.x ?? toolAny?.offsetMm?.[0] ?? 0,
    tool.y ?? toolAny?.offsetMm?.[1] ?? 0,
    tool.z ?? toolAny?.offsetMm?.[2] ?? 220
  ];
  const euler: Vector3Tuple = [
    tool.rx ?? toolAny?.rotationDeg?.[0] ?? 0,
    tool.ry ?? toolAny?.rotationDeg?.[1] ?? 0,
    tool.rz ?? toolAny?.rotationDeg?.[2] ?? 0
  ];
  const mat = Matrix4Utils.fromTranslationAndEuler(offset, euler);

  return {
    offsetMm: offset,
    rotationEulerDeg: euler,
    matrix: mat,
    weightKg: tool.weightKg || 15
  };
}

/**
 * Builds a clean, complete RobotKinematicModel from a RobotModelSpec.
 */
export function buildRobotKinematicModel(
  spec: RobotModelSpec,
  tool?: ToolCenterPoint,
  mountConfig?: RobotMountConfig
): RobotKinematicModel {
  // Keep the analytical model conservative and GP50-specific. The real CAD
  // assembly supplies the visual joint centers at runtime; these values are
  // only the mathematical fallback used before CAD calibration is attached.
  const reach = spec.reachMm || 2061;
  const d1 = 450;
  const a1 = 0;
  const l2 = Math.round(reach * 0.42 * 10) / 10;
  const l3 = Math.round(reach * 0.40 * 10) / 10;
  const l4 = 200;

  const defaultLimits = [
    { minDeg: -180, maxDeg: 180, maxVelocityDegPerSec: 180 },
    { minDeg: -90, maxDeg: 135, maxVelocityDegPerSec: 178 },
    { minDeg: -80, maxDeg: 206, maxVelocityDegPerSec: 178 },
    { minDeg: -360, maxDeg: 360, maxVelocityDegPerSec: 250 },
    { minDeg: -125, maxDeg: 125, maxVelocityDegPerSec: 250 },
    { minDeg: -360, maxDeg: 360, maxVelocityDegPerSec: 360 }
  ];

  const joints: [
    JointKinematicSpec,
    JointKinematicSpec,
    JointKinematicSpec,
    JointKinematicSpec,
    JointKinematicSpec,
    JointKinematicSpec
  ] = [
    {
      index: 0,
      name: 'J1 (Base Turntable)',
      type: 'revolute',
      axis: [0, 0, 1], // Z rotation
      limits: spec.jointLimits?.[0] || defaultLimits[0],
      homeDeg: 0
    },
    {
      index: 1,
      name: 'J2 (Shoulder Pitch)',
      type: 'revolute',
      axis: [0, 1, 0], // Y rotation
      limits: spec.jointLimits?.[1] || defaultLimits[1],
      homeDeg: 0
    },
    {
      index: 2,
      name: 'J3 (Elbow Pitch)',
      type: 'revolute',
      axis: [0, 1, 0], // Y rotation
      limits: spec.jointLimits?.[2] || defaultLimits[2],
      homeDeg: 0
    },
    {
      index: 3,
      name: 'J4 (Forearm Roll)',
      type: 'revolute',
      axis: [0, 0, 1], // Forearm axial roll
      limits: spec.jointLimits?.[3] || defaultLimits[3],
      homeDeg: 0
    },
    {
      index: 4,
      name: 'J5 (Wrist Pitch)',
      type: 'revolute',
      axis: [0, 1, 0], // Wrist pitch
      limits: spec.jointLimits?.[4] || defaultLimits[4],
      homeDeg: 0
    },
    {
      index: 5,
      name: 'J6 (Flange Roll)',
      type: 'revolute',
      axis: [0, 0, 1], // Flange normal roll
      limits: spec.jointLimits?.[5] || defaultLimits[5],
      homeDeg: 0
    }
  ];

  const baseTransform = buildMountTransform(spec, mountConfig);
  const toolTransform = buildToolTransform(tool);

  // Robots with a CAD-measured chain (Yaskawa GP50) use it for FK/IK and rendering.
  // `links` is then informational only (derived from the CAD pivots), never a proportional guess.
  const cadChain = getCadChainForRobot(spec);
  let links = {
    baseHeightMm: d1,
    shoulderOffsetMm: a1,
    upperArmMm: l2,
    forearmMm: l3,
    flangeMm: l4
  };
  if (cadChain) {
    const [j1, j2, j3, j4] = cadChain.joints;
    void j1;
    links = {
      baseHeightMm: j2.offsetMm[2],
      shoulderOffsetMm: j2.offsetMm[0],
      upperArmMm: Math.hypot(j3.offsetMm[0], j3.offsetMm[1], j3.offsetMm[2]),
      forearmMm: Math.hypot(j4.offsetMm[0], j4.offsetMm[1], j4.offsetMm[2]),
      flangeMm: Math.hypot(cadChain.flangeOffsetMm[0], cadChain.flangeOffsetMm[1], cadChain.flangeOffsetMm[2])
    };
    for (let i = 0; i < 6; i++) {
      const cj = cadChain.joints[i];
      joints[i].axis = [cj.axis[0] * cj.sign, cj.axis[1] * cj.sign, cj.axis[2] * cj.sign];
    }
  }

  return {
    id: spec.id,
    name: spec.name,
    manufacturer: spec.manufacturer,
    payloadKg: spec.payloadKg,
    reachMm: spec.reachMm,
    repeatabilityMm: spec.repeatabilityMm,
    degreesOfFreedom: 6,
    joints,
    links,
    baseTransform,
    toolTransform,
    ...(cadChain ? { cadChain } : {})
  };
}
