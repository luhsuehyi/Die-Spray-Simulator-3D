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
