/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  FkIkConsistencyReport,
  JointPositions3D,
  KinematicFKResult,
  KinematicIKResult,
  RobotKinematicModel,
  RobotMountingTransform,
  ToolTransformSpec
} from '../types/kinematics';
import { RobotModelSpec, RobotMountConfig, RobotPose, ToolCenterPoint } from '../types/robot';
import { validateFkIkConsistency } from './kinematics/consistencyValidator';
import { computeForwardKinematics } from './kinematics/forwardKinematics';
import { solveInverseKinematicsAnalytical } from './kinematics/inverseKinematics';
import { Matrix4Utils } from './kinematics/matrix4';
import {
  buildMountTransform,
  buildRobotKinematicModel,
  buildToolTransform
} from './kinematics/robotModelBuilder';

export {
  buildRobotKinematicModel,
  buildMountTransform,
  buildToolTransform,
  computeForwardKinematics,
  solveInverseKinematicsAnalytical,
  validateFkIkConsistency,
  Matrix4Utils
};

export type { JointPositions3D, RobotKinematicModel, KinematicFKResult, KinematicIKResult, FkIkConsistencyReport };

/**
 * Computes forward kinematics for an industrial 6-DOF robot arm.
 * Uses a single unified kinematic model with mounting and tool offsets represented by 4x4 transforms.
 *
 * Backward-compatible wrapper for existing call sites.
 */
export function forwardKinematics(
  jointsDeg: [number, number, number, number, number, number],
  spec: RobotModelSpec,
  tool?: ToolCenterPoint,
  mountConfig?: RobotMountConfig
): {
  tcpPosition: [number, number, number];
  tcpEuler: [number, number, number];
  jointPositions: JointPositions3D;
  flangePosition: [number, number, number];
  flangeEuler: [number, number, number];
} {
  const model = buildRobotKinematicModel(spec, tool, mountConfig);
  const result = computeForwardKinematics(jointsDeg, model);

  return {
    tcpPosition: result.tcpPosition,
    tcpEuler: result.tcpEuler,
    jointPositions: result.jointPositions,
    flangePosition: result.flangePosition,
    flangeEuler: result.flangeEuler
  };
}

/**
 * Analytical inverse kinematics solver for 6-axis industrial manipulator.
 * Operates on the canonical robot definition and uses base mounting transforms.
 *
 * Checks reachability, singularities, and joint limits without silent clamping.
 * Backward-compatible wrapper for existing call sites.
 */
export function solveInverseKinematics(
  targetPos: [number, number, number],
  targetEuler: [number, number, number],
  spec: RobotModelSpec,
  seedJoints: [number, number, number, number, number, number] = [0, 0, 0, 0, 0, 0],
  tool?: ToolCenterPoint,
  mountConfig?: RobotMountConfig
): RobotPose {
  const model = buildRobotKinematicModel(spec, tool, mountConfig);
  const ikResult = solveInverseKinematicsAnalytical(targetPos, targetEuler, model, seedJoints);

  return {
    jointAnglesDeg: ikResult.jointAnglesDeg,
    tcpPositionMm: ikResult.tcpPositionMm,
    tcpEulerDeg: ikResult.tcpEulerDeg,
    isReachable: ikResult.isReachable,
    isSingular: ikResult.isSingular,
    hasJointLimitViolation: ikResult.hasJointLimitViolation,
    violatedJointIndex: ikResult.violatedJointIndex
  };
}
