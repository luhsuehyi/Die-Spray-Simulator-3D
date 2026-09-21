/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { JointLimit, RobotManufacturer, RobotMountType, TopMountStyle } from './robot';

export type Matrix4Tuple = [
  number, number, number, number,
  number, number, number, number,
  number, number, number, number,
  number, number, number, number
];

export type Vector3Tuple = [number, number, number];

export interface JointKinematicSpec {
  index: number; // 0 to 5 for J1..J6
  name: string; // 'J1', 'J2', etc.
  type: 'revolute' | 'prismatic';
  axis: Vector3Tuple; // Axis of rotation in local link frame, e.g. [0, 0, 1]
  limits: JointLimit; // minDeg, maxDeg, maxVelocityDegPerSec
  homeDeg: number;
}

export interface LinkKinematicSpec {
  index: number;
  name: string;
  lengthMm: number;
  offsetMm?: Vector3Tuple;
}

export interface RobotMountingTransform {
  type: RobotMountType;
  topMountStyle?: TopMountStyle;
  position: Vector3Tuple; // [x, y, z] in world mm
  rotationEulerDeg: Vector3Tuple; // [rx, ry, rz] in degrees
  matrix: Matrix4Tuple;
}

export interface ToolTransformSpec {
  offsetMm: Vector3Tuple; // [x, y, z] from flange
  rotationEulerDeg: Vector3Tuple; // [rx, ry, rz] in degrees
  matrix: Matrix4Tuple;
  weightKg?: number;
}

/**
 * One joint of a CAD-derived kinematic chain. The chain is expressed in the canonical robot base
 * frame (+Z up, +X forward at zero pose). Every joint frame is axis-aligned with the base frame at
 * zero pose, so a joint is fully described by the offset of its pivot from the previous pivot,
 * its rotation axis, and the sign of its positive direction.
 */
export interface CadChainJoint {
  name: string;
  offsetMm: Vector3Tuple; // pivot position relative to the previous joint pivot (zero pose)
  axis: Vector3Tuple;     // unit rotation axis in the joint frame
  sign: 1 | -1;          // +1: positive angle is right-handed about `axis`; -1: left-handed
}

/**
 * Kinematic chain measured from the manufacturer CAD (not a proportional approximation).
 * FK/IK and the rendered CAD parts are both driven by this single description, so the
 * displayed robot cannot disagree with the TCP used for paths, coverage and code export.
 */
export interface CadKinematicChain {
  source: string;
  joints: [CadChainJoint, CadChainJoint, CadChainJoint, CadChainJoint, CadChainJoint, CadChainJoint];
  flangeOffsetMm: Vector3Tuple; // flange origin relative to the J6 pivot (zero pose)
  flangeRotation: Matrix4Tuple; // flange frame orientation at zero pose (+Z = tool approach)
}

export interface RobotKinematicModel {
  id: string;
  name: string;
  manufacturer: RobotManufacturer;
  payloadKg: number;
  reachMm: number;
  repeatabilityMm: number;
  degreesOfFreedom: number;
  joints: [
    JointKinematicSpec,
    JointKinematicSpec,
    JointKinematicSpec,
    JointKinematicSpec,
    JointKinematicSpec,
    JointKinematicSpec
  ];
  links: {
    baseHeightMm: number; // d1 (shoulder height from base plate)
    shoulderOffsetMm: number; // a1 (horizontal offset)
    upperArmMm: number; // l2 / a2 (shoulder to elbow)
    forearmMm: number; // l3 / d4 (elbow to wrist center)
    flangeMm: number; // l4 / d6 (wrist center to tool mount flange)
  };
  baseTransform: RobotMountingTransform;
  toolTransform: ToolTransformSpec;
  /** When present, FK/IK use this CAD-measured chain instead of the generic proportional model. */
  cadChain?: CadKinematicChain;
}

export interface JointPositions3D {
  base: Vector3Tuple;
  shoulder: Vector3Tuple;
  elbow: Vector3Tuple;
  wristPitch: Vector3Tuple;
  wristYaw: Vector3Tuple;
  flange?: Vector3Tuple;
  tcp: Vector3Tuple;
}

export interface KinematicFKResult {
  jointAnglesDeg: [number, number, number, number, number, number];
  tcpPosition: Vector3Tuple;
  tcpEuler: Vector3Tuple;
  tcpMatrix: Matrix4Tuple;
  flangePosition: Vector3Tuple;
  flangeEuler: Vector3Tuple;
  flangeMatrix: Matrix4Tuple;
  jointTransforms: Matrix4Tuple[];
  jointPositions: JointPositions3D;
}

export interface KinematicIKResult {
  jointAnglesDeg: [number, number, number, number, number, number];
  tcpPositionMm: Vector3Tuple;
  tcpEulerDeg: Vector3Tuple;
  isReachable: boolean;
  isSingular: boolean;
  singularityType?: 'wrist' | 'elbow' | 'shoulder' | 'boundary' | 'none';
  hasJointLimitViolation: boolean;
  violatedJointIndex?: number;
  validationMessage?: string;
  reachDistanceMm?: number;
  maxReachMm?: number;
}

export interface FkIkConsistencyReport {
  pass: boolean;
  initialJointsDeg: [number, number, number, number, number, number];
  fkInitialTcpPosition: Vector3Tuple;
  fkInitialTcpEuler: Vector3Tuple;
  ikSolvedJointsDeg: [number, number, number, number, number, number];
  fkFinalTcpPosition: Vector3Tuple;
  fkFinalTcpEuler: Vector3Tuple;
  positionErrorMm: number;
  orientationErrorDeg: number;
  isReachable: boolean;
  isSingular: boolean;
  hasJointLimitViolation: boolean;
  violatedJointIndex?: number;
  toleranceMm: number;
  toleranceDeg: number;
}
