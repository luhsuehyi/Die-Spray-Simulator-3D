/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  CadKinematicChain,
  KinematicFKResult,
  KinematicIKResult,
  Matrix4Tuple,
  RobotKinematicModel,
  Vector3Tuple
} from '../../types/kinematics';
import { DEG2RAD, Matrix4Utils, RAD2DEG } from './matrix4';

type Joints6 = [number, number, number, number, number, number];

/** Right-handed rotation of `angRad` about unit `axis`, as a row-major 4x4. */
export function rotationAboutAxis(axis: Vector3Tuple, angRad: number): Matrix4Tuple {
  const n = Math.hypot(axis[0], axis[1], axis[2]) || 1;
  const x = axis[0] / n, y = axis[1] / n, z = axis[2] / n;
  const c = Math.cos(angRad), s = Math.sin(angRad), t = 1 - c;
  return [
    t * x * x + c, t * x * y - s * z, t * x * z + s * y, 0,
    t * x * y + s * z, t * y * y + c, t * y * z - s * x, 0,
    t * x * z - s * y, t * y * z + s * x, t * z * z + c, 0,
    0, 0, 0, 1
  ];
}

export interface ChainFrames {
  /** Joint pivot positions in the robot base frame (before/at rotation; the pivot is on the axis). */
  pivots: Vector3Tuple[];
  /** Joint axes (unit, robot base frame) including the joint's positive sense. */
  axes: Vector3Tuple[];
  /** Frame of each link after its joint rotation (robot base frame). */
  linkFrames: Matrix4Tuple[];
  /** Flange frame in the robot base frame (+Z = tool approach). */
  flange: Matrix4Tuple;
}

/** Forward kinematics of the chain in the robot base frame. */
export function chainForward(jointsDeg: readonly number[], chain: CadKinematicChain): ChainFrames {
  let T: Matrix4Tuple = Matrix4Utils.identity();
  const pivots: Vector3Tuple[] = [];
  const axes: Vector3Tuple[] = [];
  const linkFrames: Matrix4Tuple[] = [];

  for (let i = 0; i < 6; i++) {
    const j = chain.joints[i];
    T = Matrix4Utils.multiply(T, Matrix4Utils.fromTranslation(j.offsetMm[0], j.offsetMm[1], j.offsetMm[2]));
    pivots.push([T[3], T[7], T[11]]);
    const a = j.axis;
    axes.push([
      (T[0] * a[0] + T[1] * a[1] + T[2] * a[2]) * j.sign,
      (T[4] * a[0] + T[5] * a[1] + T[6] * a[2]) * j.sign,
      (T[8] * a[0] + T[9] * a[1] + T[10] * a[2]) * j.sign
    ]);
    T = Matrix4Utils.multiply(T, rotationAboutAxis(a, j.sign * (jointsDeg[i] || 0) * DEG2RAD));
    linkFrames.push(T);
  }

  const f = chain.flangeOffsetMm;
  T = Matrix4Utils.multiply(T, Matrix4Utils.fromTranslation(f[0], f[1], f[2]));
  const flange = Matrix4Utils.multiply(T, chain.flangeRotation);
  return { pivots, axes, linkFrames, flange };
}

/** FK in the `KinematicFKResult` shape used by the rest of the simulator. */
export function computeChainForwardKinematics(jointsDeg: Joints6, model: RobotKinematicModel): KinematicFKResult {
  const chain = model.cadChain!;
  const fr = chainForward(jointsDeg, chain);
  const tMount = model.baseTransform.matrix;

  const tBaseFlange = fr.flange;
  const tBaseTcp = Matrix4Utils.multiply(tBaseFlange, model.toolTransform.matrix);
  const tWorldFlange = Matrix4Utils.multiply(tMount, tBaseFlange);
  const tWorldTcp = Matrix4Utils.multiply(tMount, tBaseTcp);

  const w = (p: Vector3Tuple) => Matrix4Utils.transformPoint(tMount, p);
  const worldElbow = w(fr.pivots[2]);
  const worldWristCenter = w(fr.pivots[4]);
  const worldFlangePos = Matrix4Utils.getTranslation(tWorldFlange);
  const worldTcpPos = Matrix4Utils.getTranslation(tWorldTcp);

  const worldJointTransforms: Matrix4Tuple[] = [];
  for (let i = 0; i < 5; i++) worldJointTransforms.push(Matrix4Utils.multiply(tMount, fr.linkFrames[i]));
  worldJointTransforms.push(tWorldFlange);

  return {
    jointAnglesDeg: [...jointsDeg] as Joints6,
    tcpPosition: worldTcpPos,
    tcpEuler: Matrix4Utils.toEulerDeg(tWorldTcp),
    tcpMatrix: tWorldTcp,
    flangePosition: worldFlangePos,
    flangeEuler: Matrix4Utils.toEulerDeg(tWorldFlange),
    flangeMatrix: tWorldFlange,
    jointTransforms: worldJointTransforms,
    jointPositions: {
      base: Matrix4Utils.transformPoint(tMount, [0, 0, 0]),
      shoulder: w(fr.pivots[1]),
      elbow: worldElbow,
      wristPitch: [
        (worldElbow[0] + worldWristCenter[0]) / 2,
        (worldElbow[1] + worldWristCenter[1]) / 2,
        (worldElbow[2] + worldWristCenter[2]) / 2
      ],
      wristYaw: worldWristCenter,
      flange: worldFlangePos,
      tcp: worldTcpPos
    }
  };
}

// ---------------------------------------------------------------------------------------------
// Inverse kinematics: damped-least-squares on the exact chain, multi-start, limit-aware.
// ---------------------------------------------------------------------------------------------

const ROT_WEIGHT_MM_PER_RAD = 400; // balances orientation vs position error in the 6-vector
const POS_TOL_MM = 0.005;
const ROT_TOL_RAD = 0.002 * DEG2RAD; // tool lever arms (~0.3 m) turn 0.002° into ~0.01 mm at the TCP

/** Rotation vector (axis * angle) of the rotation matrix part of `m`. */
function rotationVector(m: Matrix4Tuple): Vector3Tuple {
  const tr = m[0] + m[5] + m[10];
  const cosT = Math.max(-1, Math.min(1, (tr - 1) / 2));
  const theta = Math.acos(cosT);
  const kx = m[9] - m[6], ky = m[2] - m[8], kz = m[4] - m[1];
  if (theta < 1e-9) return [0.5 * kx, 0.5 * ky, 0.5 * kz];
  if (Math.PI - theta < 1e-6) {
    // Near 180°: axis from the symmetric part (R + I)/2 = a a^T
    const xx = (m[0] + 1) / 2, yy = (m[5] + 1) / 2, zz = (m[10] + 1) / 2;
    let ax: Vector3Tuple;
    if (xx >= yy && xx >= zz) { const x = Math.sqrt(Math.max(xx, 1e-12)); ax = [x, (m[1] + m[4]) / (4 * x), (m[2] + m[8]) / (4 * x)]; }
    else if (yy >= zz) { const y = Math.sqrt(Math.max(yy, 1e-12)); ax = [(m[1] + m[4]) / (4 * y), y, (m[6] + m[9]) / (4 * y)]; }
    else { const z = Math.sqrt(Math.max(zz, 1e-12)); ax = [(m[2] + m[8]) / (4 * z), (m[6] + m[9]) / (4 * z), z]; }
    return [ax[0] * theta, ax[1] * theta, ax[2] * theta];
  }
  const k = theta / (2 * Math.sin(theta));
  return [k * kx, k * ky, k * kz];
}

/** Solves A x = b (n×n) by Gaussian elimination with partial pivoting. Returns null if singular. */
function solveLinear(A: number[][], b: number[]): number[] | null {
  const n = b.length;
  const M = A.map((row, i) => [...row, b[i]]);
  for (let c = 0; c < n; c++) {
    let piv = c;
    for (let r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[piv][c])) piv = r;
    if (Math.abs(M[piv][c]) < 1e-12) return null;
    if (piv !== c) [M[piv], M[c]] = [M[c], M[piv]];
    for (let r = c + 1; r < n; r++) {
      const f = M[r][c] / M[c][c];
      for (let k = c; k <= n; k++) M[r][k] -= f * M[c][k];
    }
  }
  const x = new Array(n).fill(0);
  for (let r = n - 1; r >= 0; r--) {
    let s = M[r][n];
    for (let k = r + 1; k < n; k++) s -= M[r][k] * x[k];
    x[r] = s / M[r][r];
  }
  return x;
}

interface DlsResult { q: number[]; posErr: number; rotErr: number; converged: boolean }

function dlsSolve(target: Matrix4Tuple, chain: CadKinematicChain, q0Deg: readonly number[], maxIter = 80): DlsResult {
  const q = q0Deg.map(v => v * DEG2RAD);
  let posErr = Infinity, rotErr = Infinity;
  let lambda = 12;

  for (let iter = 0; iter < maxIter; iter++) {
    const fr = chainForward(q.map(v => v * RAD2DEG), chain);
    const pe: Vector3Tuple = [fr.flange[3], fr.flange[7], fr.flange[11]];
    const dp: Vector3Tuple = [target[3] - pe[0], target[7] - pe[1], target[11] - pe[2]];

    // R_err = R_target * R_current^T  (only rotation parts)
    const Rc = fr.flange, Rt = target;
    const Rerr: Matrix4Tuple = [
      Rt[0] * Rc[0] + Rt[1] * Rc[1] + Rt[2] * Rc[2], Rt[0] * Rc[4] + Rt[1] * Rc[5] + Rt[2] * Rc[6], Rt[0] * Rc[8] + Rt[1] * Rc[9] + Rt[2] * Rc[10], 0,
      Rt[4] * Rc[0] + Rt[5] * Rc[1] + Rt[6] * Rc[2], Rt[4] * Rc[4] + Rt[5] * Rc[5] + Rt[6] * Rc[6], Rt[4] * Rc[8] + Rt[5] * Rc[9] + Rt[6] * Rc[10], 0,
      Rt[8] * Rc[0] + Rt[9] * Rc[1] + Rt[10] * Rc[2], Rt[8] * Rc[4] + Rt[9] * Rc[5] + Rt[10] * Rc[6], Rt[8] * Rc[8] + Rt[9] * Rc[9] + Rt[10] * Rc[10], 0,
      0, 0, 0, 1
    ];
    const dr = rotationVector(Rerr);

    posErr = Math.hypot(dp[0], dp[1], dp[2]);
    rotErr = Math.hypot(dr[0], dr[1], dr[2]);
    if (posErr < POS_TOL_MM && rotErr < ROT_TOL_RAD) return { q: q.map(v => v * RAD2DEG), posErr, rotErr, converged: true };

    const e = [dp[0], dp[1], dp[2], dr[0] * ROT_WEIGHT_MM_PER_RAD, dr[1] * ROT_WEIGHT_MM_PER_RAD, dr[2] * ROT_WEIGHT_MM_PER_RAD];

    // Geometric Jacobian (6x6): columns = [w x (p_e - p_i); w * rotWeight]
    const J: number[][] = Array.from({ length: 6 }, () => new Array(6).fill(0));
    for (let i = 0; i < 6; i++) {
      const w = fr.axes[i], p = fr.pivots[i];
      const r: Vector3Tuple = [pe[0] - p[0], pe[1] - p[1], pe[2] - p[2]];
      J[0][i] = w[1] * r[2] - w[2] * r[1];
      J[1][i] = w[2] * r[0] - w[0] * r[2];
      J[2][i] = w[0] * r[1] - w[1] * r[0];
      J[3][i] = w[0] * ROT_WEIGHT_MM_PER_RAD;
      J[4][i] = w[1] * ROT_WEIGHT_MM_PER_RAD;
      J[5][i] = w[2] * ROT_WEIGHT_MM_PER_RAD;
    }

    // dq = J^T (J J^T + lambda^2 I)^-1 e
    const A: number[][] = Array.from({ length: 6 }, (_, r) =>
      Array.from({ length: 6 }, (_, c) => {
        let s = 0;
        for (let k = 0; k < 6; k++) s += J[r][k] * J[c][k];
        return s + (r === c ? lambda * lambda : 0);
      })
    );
    const y = solveLinear(A, e);
    if (!y) break;
    const dq = new Array(6).fill(0);
    for (let i = 0; i < 6; i++) for (let k = 0; k < 6; k++) dq[i] += J[k][i] * y[k];

    const maxStep = Math.max(...dq.map(Math.abs));
    const scale = maxStep > 0.35 ? 0.35 / maxStep : 1;
    for (let i = 0; i < 6; i++) q[i] += dq[i] * scale;
    lambda = Math.max(2, lambda * 0.7); // relax damping as we approach the solution
  }
  return { q: q.map(v => v * RAD2DEG), posErr, rotErr, converged: false };
}

/** Wraps `angleDeg` by multiples of 360° into [min,max] closest to the seed; reports violation. */
function wrapIntoLimits(angleDeg: number, minDeg: number, maxDeg: number, seedDeg: number): { value: number; violation: number } {
  let best = angleDeg, bestViol = Infinity, bestDist = Infinity;
  for (let k = -3; k <= 3; k++) {
    const a = angleDeg + 360 * k;
    const viol = Math.max(0, minDeg - a, a - maxDeg);
    const dist = Math.abs(a - seedDeg);
    if (viol < bestViol - 1e-9 || (Math.abs(viol - bestViol) <= 1e-9 && dist < bestDist)) {
      best = a; bestViol = viol; bestDist = dist;
    }
  }
  return { value: Math.round(best * 10000) / 10000, violation: bestViol };
}

const CANONICAL_SEEDS: Joints6[] = (() => {
  const out: Joints6[] = [];
  const j1s = [0, 90, -90, 180];
  const arm: Array<[number, number, number]> = [
    [0, 0, 0], [30, 45, 0], [-20, 60, 40], [60, -20, -40], [40, 80, 60], [-30, 30, -50]
  ];
  for (const a of j1s) for (const [b, c, d] of arm) out.push([a, b, c, 0, d, 0]);
  return out;
})();

/**
 * Inverse kinematics for a CAD-measured chain. Solves the exact same chain that FK and the
 * rendered CAD use, so FK(IK(x)) == x to sub-0.05 mm. No silent clamping: limit violations and
 * unreachable targets are reported.
 */
export function solveChainInverseKinematics(
  targetTcpPos: Vector3Tuple,
  targetTcpEulerDeg: Vector3Tuple,
  model: RobotKinematicModel,
  seedJointsDeg: Joints6 = [0, 0, 0, 0, 0, 0]
): KinematicIKResult {
  const chain = model.cadChain!;
  const tWorldTcp = Matrix4Utils.fromTranslationAndEuler(targetTcpPos, targetTcpEulerDeg);
  const tBaseTcp = Matrix4Utils.multiply(Matrix4Utils.invertRigid(model.baseTransform.matrix), tWorldTcp);
  const tBaseFlange = Matrix4Utils.multiply(tBaseTcp, Matrix4Utils.invertRigid(model.toolTransform.matrix));

  const limits = model.joints.map(j => j.limits);
  const evaluate = (qDeg: number[]) => {
    const joints: number[] = [];
    let violation = 0, violatedIdx: number | undefined, msg: string | undefined;
    for (let i = 0; i < 6; i++) {
      const w = wrapIntoLimits(qDeg[i], limits[i].minDeg, limits[i].maxDeg, seedJointsDeg[i]);
      joints.push(w.value);
      if (w.violation > 1e-6) {
        violation += w.violation;
        if (violatedIdx === undefined) {
          violatedIdx = i;
          msg = `Joint J${i + 1} limit violation: angle ${w.value.toFixed(1)}° outside [${limits[i].minDeg}°, ${limits[i].maxDeg}°].`;
        }
      }
    }
    let dist = 0;
    for (let i = 0; i < 6; i++) dist += (joints[i] - seedJointsDeg[i]) ** 2;
    return { joints: joints as Joints6, violation, violatedIdx, msg, dist };
  };

  type Cand = ReturnType<typeof evaluate> & { posErr: number };
  let best: Cand | null = null;
  const consider = (r: DlsResult) => {
    if (!r.converged) return;
    const ev = evaluate(r.q);
    const cand: Cand = { ...ev, posErr: r.posErr };
    const score = (c: Cand) => (c.violation > 0 ? 1e6 + c.violation * 1e3 : 0) + c.dist;
    if (!best || score(cand) < score(best)) best = cand;
  };

  // Fast path: solve from the caller's seed (continuity with the previous pose).
  consider(dlsSolve(tBaseFlange, chain, seedJointsDeg));
  // Fall back to multi-start only when the fast path failed or violates joint limits.
  if (!best || (best as Cand).violation > 0) {
    for (const s of CANONICAL_SEEDS) {
      consider(dlsSolve(tBaseFlange, chain, s, 60));
      if (best && (best as Cand).violation === 0 && (best as Cand).dist < 1e-6) break;
    }
  }

  // Reach diagnostics (wrist centre = flange - flangeOffset along approach axis)
  const approach: Vector3Tuple = [tBaseFlange[2], tBaseFlange[6], tBaseFlange[10]];
  const flangeLen = Math.hypot(chain.flangeOffsetMm[0], chain.flangeOffsetMm[1], chain.flangeOffsetMm[2]);
  const wc: Vector3Tuple = [
    tBaseFlange[3] - flangeLen * approach[0],
    tBaseFlange[7] - flangeLen * approach[1],
    tBaseFlange[11] - flangeLen * approach[2]
  ];
  const zero = chainForward([0, 0, 0, 0, 0, 0], chain);
  const sh = zero.pivots[1];
  const l2 = Math.hypot(zero.pivots[2][0] - sh[0], zero.pivots[2][1] - sh[1], zero.pivots[2][2] - sh[2]);
  const l3 = Math.hypot(zero.pivots[4][0] - zero.pivots[2][0], zero.pivots[4][1] - zero.pivots[2][1], zero.pivots[4][2] - zero.pivots[2][2]);
  const maxReach = l2 + l3;
  const reachDist = Math.hypot(Math.hypot(wc[0], wc[1]) - sh[0], wc[2] - sh[2]);

  if (!best) {
    return {
      jointAnglesDeg: seedJointsDeg,
      tcpPositionMm: targetTcpPos,
      tcpEulerDeg: targetTcpEulerDeg,
      isReachable: false,
      isSingular: true,
      singularityType: 'boundary',
      hasJointLimitViolation: true,
      validationMessage: `Target unreachable: no joint solution for the GP50 chain (wrist centre ${reachDist.toFixed(0)} mm from shoulder axis, envelope ≤ ${maxReach.toFixed(0)} mm).`,
      reachDistanceMm: Math.round(reachDist * 10) / 10,
      maxReachMm: Math.round(maxReach * 10) / 10
    };
  }

  const b = best as Cand;
  let singular = false;
  let singularityType: KinematicIKResult['singularityType'] = 'none';
  if (Math.abs(Math.sin(b.joints[4] * DEG2RAD)) < 0.002) { singular = true; singularityType = 'wrist'; }
  else if (Math.hypot(wc[0], wc[1]) - sh[0] < 1 && Math.hypot(wc[0], wc[1]) - sh[0] > -1) { singular = true; singularityType = 'shoulder'; }
  else if (maxReach - reachDist < 4) { singular = true; singularityType = 'elbow'; }

  return {
    jointAnglesDeg: b.joints,
    tcpPositionMm: targetTcpPos,
    tcpEulerDeg: targetTcpEulerDeg,
    isReachable: true,
    isSingular: singular,
    singularityType,
    hasJointLimitViolation: b.violation > 0,
    violatedJointIndex: b.violatedIdx,
    validationMessage: b.msg,
    reachDistanceMm: Math.round(reachDist * 10) / 10,
    maxReachMm: Math.round(maxReach * 10) / 10
  };
}
