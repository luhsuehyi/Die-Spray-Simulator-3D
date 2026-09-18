import { TOYO_DCM_FAMILY, DIE_PRESETS, ROBOT_PRESETS } from './src/utils/presets';
import { buildRobotKinematicModel } from './src/utils/kinematics/robotModelBuilder';
import { Matrix4Utils, DEG2RAD, RAD2DEG, normalizeAngleDeg } from './src/utils/kinematics/matrix4';
import { Vector3Tuple, KinematicIKResult, RobotKinematicModel } from './src/types/kinematics';
import { generateAutoSweepPattern } from './src/utils/aiSprayOptimizer';

function solveIKFull(
  targetTcpPos: Vector3Tuple,
  targetTcpEulerDeg: Vector3Tuple,
  model: RobotKinematicModel,
  seedJointsDeg: [number, number, number, number, number, number] = [0, 0, 0, 0, 0, 0]
): KinematicIKResult {
  const tWorldTcp = Matrix4Utils.fromTranslationAndEuler(targetTcpPos, targetTcpEulerDeg);
  const tMountInv = Matrix4Utils.invertRigid(model.baseTransform.matrix);
  const tBaseTcp = Matrix4Utils.multiply(tMountInv, tWorldTcp);
  const tToolInv = Matrix4Utils.invertRigid(model.toolTransform.matrix);
  const tBaseFlange = Matrix4Utils.multiply(tBaseTcp, tToolInv);

  const pFlange: Vector3Tuple = [tBaseFlange[3], tBaseFlange[7], tBaseFlange[11]];
  const approachVec: Vector3Tuple = [tBaseFlange[2], tBaseFlange[6], tBaseFlange[10]];
  const { baseHeightMm: d1, shoulderOffsetMm: a1, upperArmMm: l2, forearmMm: l3, flangeMm: l4 } = model.links;

  const pWrist: Vector3Tuple = [
    pFlange[0] - l4 * approachVec[0],
    pFlange[1] - l4 * approachVec[1],
    pFlange[2] - l4 * approachVec[2]
  ];
  const wx = pWrist[0], wy = pWrist[1], wz = pWrist[2];
  const rxy = Math.hypot(wx, wy);

  const maxReach = l2 + l3;
  const minReach = Math.abs(l2 - l3);

  // 8 Branch candidates
  const candidates: {
    joints: [number, number, number, number, number, number];
    isValid: boolean;
    violatedIdx?: number;
    score: number;
    dArm: number;
  }[] = [];

  const th1_options = rxy < 1.0
    ? [seedJointsDeg[0] * DEG2RAD]
    : [Math.atan2(wy, wx), Math.atan2(wy, wx) + Math.PI];

  for (let sIdx = 0; sIdx < th1_options.length; sIdx++) {
    const th1 = th1_options[sIdx];
    const r = sIdx === 0 ? rxy - a1 : -rxy - a1;
    const z = wz - d1;
    const dArm = Math.hypot(r, z);

    if (dArm > maxReach + 1.0 || dArm < minReach - 1.0) continue;

    const cosElbow = Math.max(-1, Math.min(1, (dArm * dArm - l2 * l2 - l3 * l3) / (2 * l2 * l3)));
    const elbowAngle = Math.acos(cosElbow);

    for (const th3 of [elbowAngle, -elbowAngle]) {
      const k1 = l2 + l3 * Math.cos(th3);
      const k2 = l3 * Math.sin(th3);
      const th2 = Math.atan2(k1 * r - k2 * z, k2 * r + k1 * z);

      const th23 = th2 + th3;
      const r1Mat = Matrix4Utils.fromRotZ(th1);
      const r3Mat = Matrix4Utils.multiply(r1Mat, Matrix4Utils.fromRotY(th23));

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
        let th4 = 0, th6 = 0;
        if (Math.abs(Math.sin(th5)) < 1e-4) {
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

        let unwrap4 = deg4 - seedJointsDeg[3];
        while (unwrap4 > 180) { deg4 -= 360; unwrap4 -= 360; }
        while (unwrap4 < -180) { deg4 += 360; unwrap4 += 360; }

        let unwrap6 = deg6 - seedJointsDeg[5];
        while (unwrap6 > 180) { deg6 -= 360; unwrap6 -= 360; }
        while (unwrap6 < -180) { deg6 += 360; unwrap6 += 360; }

        const candidateJoints: [number, number, number, number, number, number] = [
          deg1, deg2, deg3, deg4, deg5, deg6
        ];

        let isValid = true;
        let violatedIdx: number | undefined;
        let penalty = 0;

        for (let j = 0; j < 6; j++) {
          const lim = model.joints[j]?.limits;
          if (lim) {
            if (candidateJoints[j] < lim.minDeg || candidateJoints[j] > lim.maxDeg) {
              isValid = false;
              if (violatedIdx === undefined) violatedIdx = j;
              penalty += Math.max(0, lim.minDeg - candidateJoints[j]) + Math.max(0, candidateJoints[j] - lim.maxDeg);
            }
          }
        }

        // Distance to seed
        let distToSeed = 0;
        for (let j = 0; j < 6; j++) {
          const diff = candidateJoints[j] - seedJointsDeg[j];
          distToSeed += diff * diff;
        }

        const score = (isValid ? 0 : 1e6 + penalty * 1000) + distToSeed;
        candidates.push({ joints: candidateJoints, isValid, violatedIdx, score, dArm });
      }
    }
  }

  candidates.sort((a, b) => a.score - b.score);
  const best = candidates[0];

  if (!best) {
    return {
      jointAnglesDeg: seedJointsDeg,
      tcpPositionMm: targetTcpPos,
      tcpEulerDeg: targetTcpEulerDeg,
      isReachable: false,
      isSingular: true,
      singularityType: 'boundary',
      hasJointLimitViolation: true,
      validationMessage: 'Target unreachable by any kinematic branch',
      reachDistanceMm: 0,
      maxReachMm: maxReach
    };
  }

  return {
    jointAnglesDeg: best.joints,
    tcpPositionMm: targetTcpPos,
    tcpEulerDeg: targetTcpEulerDeg,
    isReachable: true,
    isSingular: false,
    singularityType: 'none',
    hasJointLimitViolation: !best.isValid,
    violatedJointIndex: best.violatedIdx,
    reachDistanceMm: Math.round(best.dArm * 10) / 10,
    maxReachMm: maxReach
  };
}

const die = DIE_PRESETS[0];
for (const robotPreset of ROBOT_PRESETS) {
  const robot = {
    ...robotPreset,
    baseOffset: robotPreset.mountOrientation === 'side' ? ([-1050, 0, 0] as [number, number, number]) : ([0, 898, -160] as [number, number, number])
  };
  const model = buildRobotKinematicModel(robot);
  const path = generateAutoSweepPattern(die, 'BOTH');
  let invalidCount = 0;
  let prevJoints: [number, number, number, number, number, number] = [0, 0, 0, 0, 0, 0];

  path.forEach((wp, i) => {
    const ik = solveIKFull([wp.x, wp.y, wp.z], [wp.rx, wp.ry, wp.rz], model, prevJoints);
    if (!ik.isReachable || ik.hasJointLimitViolation) {
      invalidCount++;
    } else {
      prevJoints = ik.jointAnglesDeg;
    }
  });
  console.log(`Robot ${robotPreset.modelName} (${robotPreset.mountOrientation}): ${invalidCount} invalid out of ${path.length}`);
}
