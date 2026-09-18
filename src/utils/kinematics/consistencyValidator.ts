/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { FkIkConsistencyReport, RobotKinematicModel } from '../../types/kinematics';
import { RobotModelSpec, RobotMountConfig, ToolCenterPoint } from '../../types/robot';
import { computeForwardKinematics } from './forwardKinematics';
import { solveInverseKinematicsAnalytical } from './inverseKinematics';
import { angularDifferenceDeg, distance3D } from './matrix4';
import { buildRobotKinematicModel } from './robotModelBuilder';

/**
 * Validates consistency between Forward Kinematics and Inverse Kinematics:
 * Initial Joints -> FK -> TCP -> IK -> Solved Joints -> FK -> Final TCP
 *
 * Compares final TCP with original TCP.
 * Reports position error (mm), orientation error (deg), limit violations, singularities, PASS/FAIL.
 */
export function validateFkIkConsistency(
  jointsDeg: [number, number, number, number, number, number],
  modelOrSpec: RobotKinematicModel | RobotModelSpec,
  tool?: ToolCenterPoint,
  mountConfig?: RobotMountConfig,
  toleranceMm: number = 0.5,
  toleranceDeg: number = 0.5
): FkIkConsistencyReport {
  const model: RobotKinematicModel = 'joints' in modelOrSpec
    ? modelOrSpec
    : buildRobotKinematicModel(modelOrSpec, tool, mountConfig);

  // 1. Initial Forward Kinematics
  const fkInitial = computeForwardKinematics(jointsDeg, model);

  // 2. Inverse Kinematics from initial TCP
  const ikResult = solveInverseKinematicsAnalytical(
    fkInitial.tcpPosition,
    fkInitial.tcpEuler,
    model,
    jointsDeg
  );

  // 3. Final Forward Kinematics from solved joints
  const fkFinal = computeForwardKinematics(ikResult.jointAnglesDeg, model);

  // 4. Calculate Errors
  const posError = distance3D(fkInitial.tcpPosition, fkFinal.tcpPosition);
  const oriError = angularDifferenceDeg(fkInitial.tcpEuler, fkFinal.tcpEuler);

  const pass =
    ikResult.isReachable &&
    !ikResult.hasJointLimitViolation &&
    posError <= toleranceMm &&
    oriError <= toleranceDeg;

  return {
    pass,
    initialJointsDeg: [...jointsDeg],
    fkInitialTcpPosition: fkInitial.tcpPosition,
    fkInitialTcpEuler: fkInitial.tcpEuler,
    ikSolvedJointsDeg: ikResult.jointAnglesDeg,
    fkFinalTcpPosition: fkFinal.tcpPosition,
    fkFinalTcpEuler: fkFinal.tcpEuler,
    positionErrorMm: Math.round(posError * 1000) / 1000,
    orientationErrorDeg: Math.round(oriError * 1000) / 1000,
    isReachable: ikResult.isReachable,
    isSingular: ikResult.isSingular,
    hasJointLimitViolation: ikResult.hasJointLimitViolation,
    violatedJointIndex: ikResult.violatedJointIndex,
    toleranceMm,
    toleranceDeg
  };
}
