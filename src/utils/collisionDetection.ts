import { Waypoint } from '../types/path';
import { RobotModelSpec, RobotMountConfig } from '../types/robot';
import { DieCastingMachine } from '../types/machine';
import { DieModel } from '../types/die';
import { CollisionAuditResult } from '../types/spray';
import { forwardKinematics } from './kinematics';

export function runCollisionAudit(
  waypoints: Waypoint[],
  robotSpec: RobotModelSpec,
  machine: DieCastingMachine,
  die: DieModel,
  mountConfig?: RobotMountConfig
): CollisionAuditResult {
  const collisionPairs: CollisionAuditResult['collisionPairs'] = [];
  let minClearance = 9999;
  let hasCollision = false;

  // Machine tie bar positions in XY plane (centered at origin)
  // tieBarClearanceH and tieBarClearanceV define the inner clearance (daylight) between columns.
  // Center of each column is offset by the column radius from the clearance opening.
  const halfH = machine.tieBarClearanceH / 2;
  const halfV = machine.tieBarClearanceV / 2;
  const tieBarRadius = machine.tieBarDiameter / 2;
  const tbCenterH = halfH + tieBarRadius;
  const tbCenterV = halfV + tieBarRadius;

  const tieBarCenters: [number, number][] = [
    [-tbCenterH, -tbCenterV],
    [tbCenterH, -tbCenterV],
    [tbCenterH, tbCenterV],
    [-tbCenterH, tbCenterV]
  ];

  for (const wp of waypoints) {
    const fk = forwardKinematics(wp.jointAnglesDeg || [0, 0, 0, 0, 0, 0], robotSpec, undefined, mountConfig);
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
        // Signed clearance: positive = clearance, zero = contact, negative = penetration
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

      // Check if point is within XY projected footprint of die and platen
      const inDieXY = Math.abs(pt.pos[0]) <= (die.dimensions.width / 2 + pt.radius) &&
                      Math.abs(pt.pos[1]) <= (die.dimensions.height / 2 + pt.radius);
      const inPlatenXY = Math.abs(pt.pos[0]) <= (machine.platenWidth / 2 + pt.radius) &&
                         Math.abs(pt.pos[1]) <= (machine.platenHeight / 2 + pt.radius);

      if (inDieXY || inPlatenXY) {
        // 2. Check collision with Fixed Platen / Die Block
        // Fixed parting surface is at die.fixedDieOffsetZ.
        // Closest point of robot sphere to fixed surface is pt.pos[2] - pt.radius.
        // Signed clearance: positive = clearance, zero = contact, negative = penetration.
        const distToFixedDie = pt.pos[2] - pt.radius - die.fixedDieOffsetZ;

        if (distToFixedDie < minClearance) {
          minClearance = distToFixedDie;
        }

        if (distToFixedDie < 0) {
          hasCollision = true;
          collisionPairs.push({
            partA: pt.name,
            partB: inDieXY ? 'Fixed Die Steel Face' : 'Fixed Platen Face',
            clearanceMm: Math.round(distToFixedDie * 10) / 10,
            waypointIndex: wp.index,
            location: pt.pos,
            severity: 'danger'
          });
        } else if (distToFixedDie < 45) {
          collisionPairs.push({
            partA: pt.name,
            partB: inDieXY ? 'Fixed Die Clearance Margin' : 'Fixed Platen Margin',
            clearanceMm: Math.round(distToFixedDie * 10) / 10,
            waypointIndex: wp.index,
            location: pt.pos,
            severity: 'warning'
          });
        }

        // 3. Check collision with Movable Die Block
        // Movable parting surface is at die.movableDieOffsetZ.
        // Closest point of robot sphere to movable surface is pt.pos[2] + pt.radius.
        // Signed clearance: positive = clearance, zero = contact, negative = penetration.
        const distToMovableDie = die.movableDieOffsetZ - (pt.pos[2] + pt.radius);

        if (distToMovableDie < minClearance) {
          minClearance = distToMovableDie;
        }

        if (distToMovableDie < 0) {
          hasCollision = true;
          collisionPairs.push({
            partA: pt.name,
            partB: inDieXY ? 'Movable Die Core Face' : 'Movable Platen Face',
            clearanceMm: Math.round(distToMovableDie * 10) / 10,
            waypointIndex: wp.index,
            location: pt.pos,
            severity: 'danger'
          });
        } else if (distToMovableDie < 45) {
          collisionPairs.push({
            partA: pt.name,
            partB: inDieXY ? 'Movable Die Clearance Margin' : 'Movable Platen Margin',
            clearanceMm: Math.round(distToMovableDie * 10) / 10,
            waypointIndex: wp.index,
            location: pt.pos,
            severity: 'warning'
          });
        }
      }
    }
  }

  return {
    hasCollision,
    totalInterferences: collisionPairs.filter(p => p.severity === 'danger').length,
    minClearanceDistanceMm: Math.round(minClearance * 10) / 10,
    collisionPairs,
    isSafeToExecute: !hasCollision
  };
}
