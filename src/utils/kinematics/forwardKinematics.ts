/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  KinematicFKResult,
  Matrix4Tuple,
  RobotKinematicModel,
  Vector3Tuple
} from '../../types/kinematics';
import { DEG2RAD, Matrix4Utils } from './matrix4';
import { computeChainForwardKinematics } from './cadChainKinematics';

/**
 * Computes forward kinematics for a 6-DOF articulated industrial robot.
 * Completely deterministic, calculating:
 * - Every joint transform in base and world frames
 * - Every link position (base, shoulder, elbow, wrist knuckle, flange)
 * - Tool mount flange pose
 * - Tool Center Point (TCP) position & orientation
 */
export function computeForwardKinematics(
  jointsDeg: [number, number, number, number, number, number],
  model: RobotKinematicModel
): KinematicFKResult {
  // CAD-measured chain (e.g. Yaskawa GP50): exact FK on the measured pivots/axes.
  if (model.cadChain) return computeChainForwardKinematics(jointsDeg, model);

  const [j1, j2, j3, j4, j5, j6] = jointsDeg;
  const th1 = j1 * DEG2RAD;
  const th2 = j2 * DEG2RAD;
  const th3 = j3 * DEG2RAD;
  const th4 = j4 * DEG2RAD;
  const th5 = j5 * DEG2RAD;
  const th6 = j6 * DEG2RAD;

  const { baseHeightMm: d1, shoulderOffsetMm: a1, upperArmMm: l2, forearmMm: l3, flangeMm: l4 } = model.links;

  // 1. Joint 1 (Base Turntable): rotation about Z
  const c1 = Math.cos(th1);
  const s1 = Math.sin(th1);

  // Shoulder Position
  const pShoulder: Vector3Tuple = [a1 * c1, a1 * s1, d1];
  const r1Mat = Matrix4Utils.fromRotZ(th1);
  const t1 = Matrix4Utils.multiply(r1Mat, Matrix4Utils.fromTranslation(a1, 0, d1));

  // 2. Joint 2 (Shoulder Pitch): rotation about Y
  const th23 = th2 + th3;
  const r2Mat = Matrix4Utils.multiply(r1Mat, Matrix4Utils.fromRotY(th2));

  // Elbow Position
  const r2 = a1 + l2 * Math.sin(th2);
  const z2 = d1 + l2 * Math.cos(th2);
  const pElbow: Vector3Tuple = [r2 * c1, r2 * s1, z2];
  const t2: Matrix4Tuple = [
    r2Mat[0], r2Mat[1], r2Mat[2], pElbow[0],
    r2Mat[4], r2Mat[5], r2Mat[6], pElbow[1],
    r2Mat[8], r2Mat[9], r2Mat[10], pElbow[2],
    0,        0,        0,         1
  ];

  // 3. Joint 3 (Elbow Pitch): rotation about Y
  const r3Mat = Matrix4Utils.multiply(r1Mat, Matrix4Utils.fromRotY(th23));

  // Wrist Center Position (where J4, J5, J6 axes intersect)
  const r3 = r2 + l3 * Math.sin(th23);
  const z3 = z2 + l3 * Math.cos(th23);
  const pWristCenter: Vector3Tuple = [r3 * c1, r3 * s1, z3];
  const t3: Matrix4Tuple = [
    r3Mat[0], r3Mat[1], r3Mat[2], pWristCenter[0],
    r3Mat[4], r3Mat[5], r3Mat[6], pWristCenter[1],
    r3Mat[8], r3Mat[9], r3Mat[10], pWristCenter[2],
    0,        0,        0,         1
  ];

  // 4. Joint 4 (Forearm Roll): rotation about Z_3
  const r4Mat = Matrix4Utils.multiply(r3Mat, Matrix4Utils.fromRotZ(th4));
  const t4: Matrix4Tuple = [
    r4Mat[0], r4Mat[1], r4Mat[2], pWristCenter[0],
    r4Mat[4], r4Mat[5], r4Mat[6], pWristCenter[1],
    r4Mat[8], r4Mat[9], r4Mat[10], pWristCenter[2],
    0,        0,        0,         1
  ];

  // 5. Joint 5 (Wrist Pitch): rotation about Y_4
  const r5Mat = Matrix4Utils.multiply(r4Mat, Matrix4Utils.fromRotY(th5));
  const t5: Matrix4Tuple = [
    r5Mat[0], r5Mat[1], r5Mat[2], pWristCenter[0],
    r5Mat[4], r5Mat[5], r5Mat[6], pWristCenter[1],
    r5Mat[8], r5Mat[9], r5Mat[10], pWristCenter[2],
    0,        0,        0,         1
  ];

  // 6. Joint 6 (Flange Roll): rotation about Z_5
  const r6Mat = Matrix4Utils.multiply(r5Mat, Matrix4Utils.fromRotZ(th6));

  // Flange position offset along tool approach vector (+Z_6)
  const approachVec: Vector3Tuple = [r6Mat[2], r6Mat[6], r6Mat[10]];
  const pFlange: Vector3Tuple = [
    pWristCenter[0] + l4 * approachVec[0],
    pWristCenter[1] + l4 * approachVec[1],
    pWristCenter[2] + l4 * approachVec[2]
  ];

  const tBaseFlange: Matrix4Tuple = [
    r6Mat[0], r6Mat[1], r6Mat[2], pFlange[0],
    r6Mat[4], r6Mat[5], r6Mat[6], pFlange[1],
    r6Mat[8], r6Mat[9], r6Mat[10], pFlange[2],
    0,        0,        0,        1
  ];

  // 7. Tool TCP transform in base frame
  const tBaseTcp = Matrix4Utils.multiply(tBaseFlange, model.toolTransform.matrix);

  // 8. Transform to World Coordinates via Base Mounting Transform T_base
  const tMount = model.baseTransform.matrix;

  const tWorldFlange = Matrix4Utils.multiply(tMount, tBaseFlange);
  const tWorldTcp = Matrix4Utils.multiply(tMount, tBaseTcp);

  const worldBasePos = Matrix4Utils.transformPoint(tMount, [0, 0, 0]);
  const worldShoulderPos = Matrix4Utils.transformPoint(tMount, pShoulder);
  const worldElbowPos = Matrix4Utils.transformPoint(tMount, pElbow);
  const worldWristCenter = Matrix4Utils.transformPoint(tMount, pWristCenter);
  const worldFlangePos = Matrix4Utils.transformPoint(tMount, pFlange);
  const worldTcpPos = Matrix4Utils.getTranslation(tWorldTcp);

  const worldTcpEuler = Matrix4Utils.toEulerDeg(tWorldTcp);
  const worldFlangeEuler = Matrix4Utils.toEulerDeg(tWorldFlange);

  const worldJointTransforms = [
    Matrix4Utils.multiply(tMount, t1),
    Matrix4Utils.multiply(tMount, t2),
    Matrix4Utils.multiply(tMount, t3),
    Matrix4Utils.multiply(tMount, t4),
    Matrix4Utils.multiply(tMount, t5),
    tWorldFlange
  ];

  // Intermediate wrist pitch/yaw points for 3D link mesh placement
  const worldWristPitchPos: Vector3Tuple = [
    (worldElbowPos[0] + worldWristCenter[0]) / 2,
    (worldElbowPos[1] + worldWristCenter[1]) / 2,
    (worldElbowPos[2] + worldWristCenter[2]) / 2
  ];

  return {
    jointAnglesDeg: [...jointsDeg],
    tcpPosition: worldTcpPos,
    tcpEuler: worldTcpEuler,
    tcpMatrix: tWorldTcp,
    flangePosition: worldFlangePos,
    flangeEuler: worldFlangeEuler,
    flangeMatrix: tWorldFlange,
    jointTransforms: worldJointTransforms,
    jointPositions: {
      base: worldBasePos,
      shoulder: worldShoulderPos,
      elbow: worldElbowPos,
      wristPitch: worldWristPitchPos,
      wristYaw: worldWristCenter,
      flange: worldFlangePos,
      tcp: worldTcpPos
    }
  };
}
