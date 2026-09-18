import { Waypoint } from '../types/path';
import { RobotModelSpec } from '../types/robot';
import { DieCastingMachine } from '../types/machine';
import { DieModel } from '../types/die';
import { CollisionAuditResult } from '../types/spray';
import { forwardKinematics } from './kinematics';

export function runCollisionAudit(
  waypoints: Waypoint[],
  robotSpec: RobotModelSpec,
  machine: DieCastingMachine,
  die: DieModel
): CollisionAuditResult {
  const collisionPairs: CollisionAuditResult['collisionPairs'] = [];
  let minClearance = 9999;
  let hasCollision = false;

  // Machine tie bar positions in XY plane (centered at origin)
  const halfH = machine.tieBarClearanceH / 2;
  const halfV = machine.tieBarClearanceV / 2;
  const tieBarRadius = machine.tieBarDiameter / 2;

  const tieBarCenters: [number, number][] = [
    [-halfH, -halfV],
    [halfH, -halfV],
    [halfH, halfV],
    [-halfH, halfV]
  ];

  // Platen Z boundaries
  const fixedPlatenZ = die.fixedDieOffsetZ - 100;
  const movablePlatenZ = die.movableDieOffsetZ + 100;

  for (const wp of waypoints) {
    const fk = forwardKinematics(wp.jointAnglesDeg || [0, 0, 0, 0, 0, 0], robotSpec);
    const tcp = [wp.x, wp.y, wp.z] as [number, number, number];
    const wrist = fk.jointPositions.wristYaw;
    const elbow = fk.jointPositions.elbow;

    const criticalPoints: { name: string; pos: [number, number, number]; radius: number }[] = [
      { name: 'Spray Manifold Tooling', pos: tcp, radius: 95 },
      { name: 'Robot Wrist Axis', pos: wrist, radius: 110 },
      { name: 'Robot Elbow Joint', pos: elbow, radius: 140 }
    ];

    for (const pt of criticalPoints) {
      // 1. Check clearance to the 4 Tie Bars
      for (let tbIdx = 0; tbIdx < tieBarCenters.length; tbIdx++) {
        const [tbX, tbY] = tieBarCenters[tbIdx];
        const distXY = Math.hypot(pt.pos[0] - tbX, pt.pos[1] - tbY);
        const clearance = distXY - (tieBarRadius + pt.radius);

        if (clearance < minClearance) {
          minClearance = clearance;
        }

        if (clearance < 0) {
          hasCollision = true;
          collisionPairs.push({
            partA: pt.name,
            partB: `Tie Bar #${tbIdx + 1} (${tbX > 0 ? 'Right' : 'Left'} ${tbY > 0 ? 'Top' : 'Bottom'})`,
            clearanceMm: Math.round(clearance * 10) / 10,
            waypointIndex: wp.index,
            location: pt.pos,
            severity: 'danger'
          });
        } else if (clearance < 50) {
          collisionPairs.push({
            partA: pt.name,
            partB: `Tie Bar #${tbIdx + 1}`,
            clearanceMm: Math.round(clearance * 10) / 10,
            waypointIndex: wp.index,
            location: pt.pos,
            severity: 'warning'
          });
        }
      }

      // 2. Check collision with Fixed Platen / Die Block
      const distToFixedDie = pt.pos[2] - (die.fixedDieOffsetZ + pt.radius);
      if (distToFixedDie < -20) {
        hasCollision = true;
        collisionPairs.push({
          partA: pt.name,
          partB: 'Fixed Die Steel Face',
          clearanceMm: Math.round(distToFixedDie * 10) / 10,
          waypointIndex: wp.index,
          location: pt.pos,
          severity: 'danger'
        });
      } else if (distToFixedDie < 40 && distToFixedDie >= -20) {
        if (distToFixedDie < minClearance) minClearance = distToFixedDie;
        collisionPairs.push({
          partA: pt.name,
          partB: 'Fixed Die Clearance Margin',
          clearanceMm: Math.round(distToFixedDie * 10) / 10,
          waypointIndex: wp.index,
          location: pt.pos,
          severity: 'warning'
        });
      }

      // 3. Check collision with Movable Die Block
      const distToMovableDie = (die.movableDieOffsetZ - pt.radius) - pt.pos[2];
      if (distToMovableDie < -20) {
        hasCollision = true;
        collisionPairs.push({
          partA: pt.name,
          partB: 'Movable Die Core Face',
          clearanceMm: Math.round(distToMovableDie * 10) / 10,
          waypointIndex: wp.index,
          location: pt.pos,
          severity: 'danger'
        });
      } else if (distToMovableDie < 40 && distToMovableDie >= -20) {
        if (distToMovableDie < minClearance) minClearance = distToMovableDie;
        collisionPairs.push({
          partA: pt.name,
          partB: 'Movable Die Clearance Margin',
          clearanceMm: Math.round(distToMovableDie * 10) / 10,
          waypointIndex: wp.index,
          location: pt.pos,
          severity: 'warning'
        });
      }
    }
  }

  return {
    hasCollision,
    totalInterferences: collisionPairs.filter(p => p.severity === 'danger').length,
    minClearanceDistanceMm: Math.max(0, Math.round(minClearance * 10) / 10),
    collisionPairs,
    isSafeToExecute: !hasCollision
  };
}
