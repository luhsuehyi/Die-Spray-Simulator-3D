/**
 * GP50 CAD-fidelity tests (run: npm run test:gp50)
 * 1. Asset: GP50_clean.glb is the deduplicated 7-part CAD (349,839 triangles), 7 meshes.
 * 2. Chain: pivots/axes/flange equal the values measured from the STEP.
 * 3. Motion: each joint rotates about its measured pivot in the expected direction.
 * 4. FK/IK: exact round trip on the same chain that renders the CAD.
 */
import fs from 'node:fs';
import path from 'node:path';
import { ROBOT_PRESETS } from '../presets';
import { buildRobotKinematicModel } from './robotModelBuilder';
import { computeForwardKinematics } from './forwardKinematics';
import { solveInverseKinematicsAnalytical } from './inverseKinematics';
import { chainForward } from './cadChainKinematics';
import { GP50_CAD_CHAIN, GP50_CAD_FLANGE, GP50_CAD_PIVOTS, cadToRobot } from './gp50CadChain';

let pass = 0, fail = 0;
function check(name: string, ok: boolean, detail = '') {
  ok ? pass++ : fail++;
  console.log(`${ok ? '✓ PASS' : '✗ FAIL'}: ${name}${!ok && detail ? ` (${detail})` : ''}`);
}
const near = (a: number[], b: number[], tol = 1e-6) => a.every((v, i) => Math.abs(v - b[i]) <= tol);

// ---- 1. Asset ----
{
  const file = path.resolve('public/models/gp50/GP50_clean.glb');
  const d = fs.readFileSync(file);
  const jl = d.readUInt32LE(12);
  const j = JSON.parse(d.subarray(20, 20 + jl).toString('utf8'));
  const names: string[] = j.nodes.map((n: any) => n.name);
  for (const n of ['BASE', 'J1_S', 'J2_L', 'J3_U', 'J4_R', 'J5_B', 'J6_T']) check(`asset has CAD part ${n}`, names.includes(n));
  check('asset has exactly 7 meshes (was 30,589 primitives)', j.meshes.length === 7 && j.meshes.every((m: any) => m.primitives.length === 1));
  const tris = j.accessors.filter((a: any) => a.type === 'SCALAR').reduce((s: number, a: any) => s + a.count / 3, 0);
  check('asset keeps all 349,839 unique CAD triangles', tris === 349839, `got ${tris}`);
  check('asset is a single un-duplicated assembly (< 15 MB)', d.length < 15e6, `${d.length} bytes`);
}

// ---- 2. Chain equals measured CAD ----
const spec = ROBOT_PRESETS.find(r => r.id === 'yaskawa-gp50')!;
const model = buildRobotKinematicModel(spec);
check('GP50 model uses the CAD chain', !!model.cadChain);
const zero = chainForward([0, 0, 0, 0, 0, 0], GP50_CAD_CHAIN);
(['J1', 'J2', 'J3', 'J4', 'J5', 'J6'] as const).forEach((k, i) =>
  check(`${k} pivot equals STEP-measured pivot`, near(zero.pivots[i], cadToRobot(GP50_CAD_PIVOTS[k]))));
check('flange at zero pose equals STEP flange face (X=1345)', near([zero.flange[3], zero.flange[7], zero.flange[11]], cadToRobot(GP50_CAD_FLANGE)));
check('flange approach axis is +X at zero pose (CAD zero pose)', near([zero.flange[2], zero.flange[6], zero.flange[10]], [1, 0, 0]));
check('derived links: d1=540 a1=144 upper arm=870 flange=175',
  model.links.baseHeightMm === 540 && model.links.shoulderOffsetMm === 144 && model.links.upperArmMm === 870 && model.links.flangeMm === 175);

// ---- 3. Joints rotate about their real pivots ----
{
  const p = (q: number[]) => chainForward(q, GP50_CAD_CHAIN);
  const a = p([0, 90, 0, 0, 0, 0]);
  check('J2 pivot fixed when J2 rotates', near(a.pivots[1], zero.pivots[1]));
  check('J2=+90 swings the upper arm forward: elbow = shoulder + 870 in +X', near(a.pivots[2], [144 + 870, 0, 540], 1e-6), `${a.pivots[2]}`);
  const b = p([0, 0, 90, 0, 0, 0]);
  check('J3 pivot fixed when J3 rotates', near(b.pivots[2], zero.pivots[2]));
  check('J3=+90 pitches the forearm down about the elbow (wrist centre drops)', b.pivots[4][2] < zero.pivots[4][2] - 500);
  const c = p([0, 0, 0, 77, 0, 0]);
  check('J4 roll leaves the flange on the forearm axis unchanged', near([c.flange[3], c.flange[7], c.flange[11]], [1345, 0, 1620], 1e-6));
  const e = p([0, 0, 0, 0, 0, 123]);
  check('J6 roll leaves the flange position unchanged', near([e.flange[3], e.flange[7], e.flange[11]], [1345, 0, 1620], 1e-6));
  const f = p([90, 0, 0, 0, 0, 0]);
  check('J1=+90 (about vertical axis through origin) moves flange from +X to +Y', near([f.flange[3], f.flange[7], f.flange[11]], [0, 1345, 1620], 1e-6));
}

// ---- 4. FK/IK exact round trip on the CAD chain ----
{
  let rnd = 987654321; const r = () => (rnd = (rnd * 1664525 + 1013904223) % 4294967296) / 4294967296;
  let worstPos = 0, worstRot = 0, bad = 0, n = 0;
  for (let i = 0; i < 400; i++) {
    const q = [(r() - .5) * 300, -40 + r() * 120, -60 + r() * 140, (r() - .5) * 200, (r() - .5) * 160, (r() - .5) * 200] as [number, number, number, number, number, number];
    const fk = computeForwardKinematics(q, model);
    const ik = solveInverseKinematicsAnalytical(fk.tcpPosition, fk.tcpEuler, model, q.map(v => v + 4) as any);
    n++;
    if (!ik.isReachable) { bad++; continue; }
    const fk2 = computeForwardKinematics(ik.jointAnglesDeg, model);
    worstPos = Math.max(worstPos, Math.hypot(fk.tcpPosition[0] - fk2.tcpPosition[0], fk.tcpPosition[1] - fk2.tcpPosition[1], fk.tcpPosition[2] - fk2.tcpPosition[2]));
    // orientation: compare rotation matrices
    const A = fk.tcpMatrix, B = fk2.tcpMatrix;
    const tr = A[0] * B[0] + A[1] * B[1] + A[2] * B[2] + A[4] * B[4] + A[5] * B[5] + A[6] * B[6] + A[8] * B[8] + A[9] * B[9] + A[10] * B[10];
    worstRot = Math.max(worstRot, Math.acos(Math.max(-1, Math.min(1, (tr - 1) / 2))) * 180 / Math.PI);
  }
  check(`IK round trip: ${n} random poses all solved`, bad === 0, `${bad} unreachable`);
  check('IK round trip position error < 0.05 mm', worstPos < 0.05, worstPos.toFixed(4));
  check('IK round trip orientation error < 0.05°', worstRot < 0.05, worstRot.toFixed(4));
  const far = solveInverseKinematicsAnalytical([0, 5000, 0], [0, 0, 0], model, [0, 0, 0, 0, 0, 0]);
  check('unreachable target is reported, not clamped', !far.isReachable);
}

console.log(`\nGP50 CAD tests: ${pass}/${pass + fail} passed.`);
if (fail > 0) process.exit(1);
