import { TOYO_DCM_FAMILY, DIE_PRESETS, ROBOT_PRESETS } from './src/utils/presets';
import { generatePathFromIntent, DEFAULT_SPRAY_INTENT } from './src/utils/pathGenerator';
import { calculateTrajectorySegments } from './src/utils/machineCalculations';
import { forwardKinematics, solveInverseKinematics } from './src/utils/kinematics';

const machine = TOYO_DCM_FAMILY[6];
const die = DIE_PRESETS[0];
const robot = { ...ROBOT_PRESETS[0], mountOrientation: 'top' as const, baseOffset: [0, 898, -160] as [number, number, number] };
const path = generatePathFromIntent(DEFAULT_SPRAY_INTENT, die, robot);
const plan = calculateTrajectorySegments(path);

const halfH = machine.tieBarClearanceH / 2;
const halfV = machine.tieBarClearanceV / 2;
const tieBarRadius = machine.tieBarDiameter / 2;
const tieBarCenters = [
  [-halfH, -halfV],
  [halfH, -halfV],
  [halfH, halfV],
  [-halfH, halfV]
];

console.log('Total path waypoints:', path.length);
plan.segments.forEach((seg, sIdx) => {
  let minSegClear = 9999;
  seg.points.forEach((pt, pIdx) => {
    const t = pIdx / (seg.points.length - 1);
    const w1 = path[seg.startIndex];
    const w2 = path[seg.endIndex];
    const rx = w1.rx + (w2.rx - w1.rx) * t;
    const ry = w1.ry + (w2.ry - w1.ry) * t;
    const rz = w1.rz + (w2.rz - w1.rz) * t;
    const ik = solveInverseKinematics(pt, [rx, ry, rz], robot);
    const fk = forwardKinematics(ik.jointAnglesDeg, robot);
    const wrist = fk.jointPositions.wristYaw;
    const elbow = fk.jointPositions.elbow;

    const criticalPoints = [
      { name: 'Tool', pos: pt, radius: 95 },
      { name: 'Wrist', pos: wrist, radius: 110 },
      { name: 'Elbow', pos: elbow, radius: 140 }
    ];

    for (const cp of criticalPoints) {
      for (const [tbX, tbY] of tieBarCenters) {
        const dist = Math.hypot(cp.pos[0] - tbX, cp.pos[1] - tbY);
        const clearance = dist - (tieBarRadius + cp.radius);
        if (clearance < minSegClear) minSegClear = clearance;
      }
    }
  });
  console.log('Seg ' + sIdx + ' (' + path[seg.startIndex].name + ' -> ' + path[seg.endIndex].name + '): minClear = ' + minSegClear.toFixed(1) + 'mm');
});
