/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  KinematicIKResult,
  Matrix4Tuple,
  RobotKinematicModel,
  Vector3Tuple
} from '../../types/kinematics';
import { DEG2RAD, Matrix4Utils, normalizeAngleDeg, RAD2DEG } from './matrix4';
import { solveChainInverseKinematics } from './cadChainKinematics';

/**
 * Analytical closed-form Inverse Kinematics solver for 6-axis industrial articulated robots.
 * Decouples position (first 3 joints) and orientation (spherical wrist joints 4, 5, 6) using
 * Pieper's kinematic decoupling.
 *
 * Operates in the canonical robot base frame via mounting transforms.
 * Strictly checks reachability, singularities, and joint limits without silent clamping.
 */
export function solveInverseKinematicsAnalytical(
  targetTcpPos: Vector3Tuple,
  targetTcpEulerDeg: Vector3Tuple,
  model: RobotKinematicModel,
  seedJointsDeg: [number, number, number, number, number, number] = [0, 0, 0, 0, 0, 0]
): KinematicIKResult {
  // CAD-measured chain (e.g. Yaskawa GP50): numerical IK on the exact same chain used by FK.
  if (model.cadChain) return solveChainInverseKinematics(targetTcpPos, targetTcpEulerDeg, model, seedJointsDeg);

  // 1. Build World TCP 4x4 matrix
  const tWorldTcp = Matrix4Utils.fromTranslationAndEuler(targetTcpPos, targetTcpEulerDeg);

  // 2. Transform into canonical robot base frame: T_base_tcp = T_mount^-1 * T_world_tcp
  const tMountInv = Matrix4Utils.invertRigid(model.baseTransform.matrix);
  const tBaseTcp = Matrix4Utils.multiply(tMountInv, tWorldTcp);

  // 3. Remove Tool/TCP offset to find Flange pose: T_base_flange = T_base_tcp * T_tool^-1
  const tToolInv = Matrix4Utils.invertRigid(model.toolTransform.matrix);
  const tBaseFlange = Matrix4Utils.multiply(tBaseTcp, tToolInv);

  // Flange position and approach vector (+Z_6 in flange frame)
  const pFlange: Vector3Tuple = [tBaseFlange[3], tBaseFlange[7], tBaseFlange[11]];
  const approachVec: Vector3Tuple = [tBaseFlange[2], tBaseFlange[6], tBaseFlange[10]];

  // 4. Wrist center position W = pFlange - l4 * approachVec
  const { baseHeightMm: d1, shoulderOffsetMm: a1, upperArmMm: l2, forearmMm: l3, flangeMm: l4 } = model.links;
  const pWrist: Vector3Tuple = [
    pFlange[0] - l4 * approachVec[0],
    pFlange[1] - l4 * approachVec[1],
    pFlange[2] - l4 * approachVec[2]
  ];

  const wx = pWrist[0];
  const wy = pWrist[1];
  const wz = pWrist[2];

  let isSingular = false;
  let singularityType: 'wrist' | 'elbow' | 'shoulder' | 'boundary' | 'none' = 'none';

  // 5. Joint 1: Base Turntable
  const rxy = Math.hypot(wx, wy);
  let th1 = 0;

  if (rxy < 1.0) {
    // Shoulder Singularity: Wrist center on J1 vertical axis
    isSingular = true;
    singularityType = 'shoulder';
    th1 = seedJointsDeg[0] * DEG2RAD;
  } else {
    th1 = Math.atan2(wy, wx);
  }

  // 6. Planar reach for Joints 2 & 3
  const r = rxy - a1;
  const z = wz - d1;
  const dArm = Math.hypot(r, z);

  const maxReach = l2 + l3;
  const minReach = Math.abs(l2 - l3);

  // 5. Evaluate all 8 analytical branches (Shoulder front/back, Elbow up/down, Wrist pos/neg)
  // to ensure clearance of all joint limits and proximity to seed angles
  interface BranchCandidate {
    joints: [number, number, number, number, number, number];
    isValid: boolean;
    violatedIdx?: number;
    validationMsg?: string;
    isSingular: boolean;
    singularityType: 'wrist' | 'elbow' | 'shoulder' | 'boundary' | 'none';
    score: number;
    dArm: number;
  }

  const candidates: BranchCandidate[] = [];

  const th1_options = rxy < 1.0
    ? [seedJointsDeg[0] * DEG2RAD]
    : [Math.atan2(wy, wx), Math.atan2(wy, wx) + Math.PI];

  for (let sIdx = 0; sIdx < th1_options.length; sIdx++) {
    const th1 = th1_options[sIdx];
    const r = sIdx === 0 ? rxy - a1 : -rxy - a1;
    const z = wz - d1;
    const dArm = Math.hypot(r, z);

    if (dArm > maxReach + 1.0 || dArm < minReach - 1.0) continue;

    let isBranchSingular = false;
    let branchSingularity: 'wrist' | 'elbow' | 'shoulder' | 'boundary' | 'none' = 'none';

    if (rxy < 1.0) {
      isBranchSingular = true;
      branchSingularity = 'shoulder';
    } else if (Math.abs(dArm - maxReach) < 4.0 || Math.abs(dArm - minReach) < 4.0) {
      isBranchSingular = true;
      branchSingularity = 'elbow';
    }

    const cosElbow = Math.max(-1, Math.min(1, (dArm * dArm - l2 * l2 - l3 * l3) / (2 * l2 * l3)));
    const elbowAngle = Math.acos(cosElbow);

    for (const th3 of [elbowAngle, -elbowAngle]) {
      const k1 = l2 + l3 * Math.cos(th3);
      const k2 = l3 * Math.sin(th3);
      const th2 = Math.atan2(k1 * r - k2 * z, k2 * r + k1 * z);

      const th23 = th2 + th3;
      const r1Mat = Matrix4Utils.fromRotZ(th1);
      const r3Mat = Matrix4Utils.multiply(r1Mat, Matrix4Utils.fromRotY(th23));

      // (R_0_3)^T * R_flange
      const r03_00 = r3Mat[0], r03_01 = r3Mat[1], r03_02 = r3Mat[2];
      const r03_10 = r3Mat[4], r03_11 = r3Mat[5], r03_12 = r3Mat[6];
      const r03_20 = r3Mat[8], r03_21 = r3Mat[9], r03_22 = r3Mat[10];

      const rf_00 = tBaseFlange[0], rf_01 = tBaseFlange[1], rf_02 = tBaseFlange[2];
      const rf_10 = tBaseFlange[4], rf_11 = tBaseFlange[5], rf_12 = tBaseFlange[6];
      const rf_20 = tBaseFlange[8], rf_21 = tBaseFlange[9], rf_22 = tBaseFlange[10];

      const r36_00 = r03_00 * rf_00 + r03_10 * rf_10 + r03_20 * rf_20;
      const r36_02 = r03_00 * rf_02 + r03_10 * rf_12 + r03_20 * rf_22;
      const r36_10 = r03_01 * rf_00 + r03_11 * rf_10 + r03_21 * rf_20;
      const r36_12 = r03_01 * rf_02 + r03_11 * rf_12 + r03_21 * rf_22;
      const r36_20 = r03_02 * rf_00 + r03_12 * rf_10 + r03_22 * rf_20;
      const r36_21 = r03_02 * rf_01 + r03_12 * rf_11 + r03_22 * rf_21;
      const r36_22 = r03_02 * rf_02 + r03_12 * rf_12 + r03_22 * rf_22;

      const cos5 = Math.max(-1, Math.min(1, r36_22));
      const th5_base = Math.acos(cos5);

      for (const th5 of [th5_base, -th5_base]) {
        let th4 = 0;
        let th6 = 0;
        let wristSingular = false;

        if (Math.abs(Math.abs(cos5) - 1.0) < 0.0002) {
          wristSingular = true;
          th4 = seedJointsDeg[3] * DEG2RAD;
          th6 = Math.atan2(r36_10, r36_00) - th4;
        } else if (th5 >= 0) {
          th4 = Math.atan2(r36_12, r36_02);
          th6 = Math.atan2(r36_21, -r36_20);
        } else {
          th4 = Math.atan2(-r36_12, -r36_02);
          th6 = Math.atan2(-r36_21, r36_20);
        }

        let deg1 = normalizeAngleDeg(th1 * RAD2DEG);
        let deg2 = normalizeAngleDeg(th2 * RAD2DEG);
        let deg3 = normalizeAngleDeg(th3 * RAD2DEG);
        let deg4 = normalizeAngleDeg(th4 * RAD2DEG);
        let deg5 = normalizeAngleDeg(th5 * RAD2DEG);
        let deg6 = normalizeAngleDeg(th6 * RAD2DEG);

        deg4 = unwrapToSeed(deg4, seedJointsDeg[3]);
        deg6 = unwrapToSeed(deg6, seedJointsDeg[5]);

        const candidateJoints: [number, number, number, number, number, number] = [
          deg1, deg2, deg3, deg4, deg5, deg6
        ];

        let isValid = true;
        let violatedIdx: number | undefined;
        let valMsg: string | undefined;
        let penalty = 0;

        for (let j = 0; j < 6; j++) {
          const lim = model.joints[j]?.limits;
          if (lim) {
            if (candidateJoints[j] < lim.minDeg || candidateJoints[j] > lim.maxDeg) {
              isValid = false;
              if (violatedIdx === undefined) {
                violatedIdx = j;
                valMsg = `Joint J${j + 1} limit violation: angle ${candidateJoints[j].toFixed(1)}° outside [${lim.minDeg}°, ${lim.maxDeg}°].`;
              }
              penalty += Math.max(0, lim.minDeg - candidateJoints[j]) + Math.max(0, candidateJoints[j] - lim.maxDeg);
            }
          }
        }

        // Proximity score to seed angles
        let distToSeed = 0;
        for (let j = 0; j < 6; j++) {
          const diff = candidateJoints[j] - seedJointsDeg[j];
          distToSeed += diff * diff;
        }

        const score = (isValid ? 0 : 1000000 + penalty * 1000) + distToSeed;
        candidates.push({
          joints: candidateJoints,
          isValid,
          violatedIdx,
          validationMsg: valMsg,
          isSingular: isBranchSingular || wristSingular,
          singularityType: wristSingular ? 'wrist' : branchSingularity,
          score,
          dArm
        });
      }
    }
  }

  candidates.sort((a, b) => a.score - b.score);
  const best = candidates[0];

  if (!best) {
    const dArmApprox = Math.hypot(rxy - a1, wz - d1);
    return {
      jointAnglesDeg: seedJointsDeg,
      tcpPositionMm: targetTcpPos,
      tcpEulerDeg: targetTcpEulerDeg,
      isReachable: false,
      isSingular: true,
      singularityType: 'boundary',
      hasJointLimitViolation: true,
      violatedJointIndex: undefined,
      validationMessage: `Target unreachable: required arm extension ${dArmApprox.toFixed(1)}mm outside envelope [${minReach.toFixed(1)}mm, ${maxReach.toFixed(1)}mm].`,
      reachDistanceMm: Math.round(dArmApprox * 10) / 10,
      maxReachMm: maxReach
    };
  }

  return {
    jointAnglesDeg: best.joints,
    tcpPositionMm: targetTcpPos,
    tcpEulerDeg: targetTcpEulerDeg,
    isReachable: true,
    isSingular: best.isSingular,
    singularityType: best.singularityType,
    hasJointLimitViolation: !best.isValid,
    violatedJointIndex: best.violatedIdx,
    validationMessage: best.validationMsg,
    reachDistanceMm: Math.round(best.dArm * 10) / 10,
    maxReachMm: maxReach
  };
}

function unwrapToSeed(angleDeg: number, seedDeg: number): number {
  let diff = angleDeg - seedDeg;
  while (diff > 180) {
    angleDeg -= 360;
    diff -= 360;
  }
  while (diff < -180) {
    angleDeg += 360;
    diff += 360;
  }
  return Math.round(angleDeg * 100) / 100;
}
