import { RobotModelSpec, RobotMountType } from '../types/robot';
import { DieCastingMachine } from '../types/machine';
import { DieModel } from '../types/die';
import { Waypoint } from '../types/path';
import { solveInverseKinematics } from './kinematics';
import { runCollisionAudit } from './collisionDetection';

export interface PositionCandidate {
  id: string;
  mountType: RobotMountType;
  name: string;
  baseOffset: [number, number, number];
  description: string;
  reachabilityPercent: number;
  minClearanceMm: number;
  hasCollision: boolean;
  estimatedCoveragePercent: number;
  estimatedCycleTimeSec: number;
  score: number;
  reasons: string[];
}

export interface PositionFixAdvice {
  issueType: 'reachability' | 'collision' | 'optimal';
  headline: string;
  details: string;
  suggestedAction: string;
  proposedBaseOffset: [number, number, number];
  proposedMountType: RobotMountType;
}

/**
 * Evaluates candidate robot placement positions (Top, Side, Rear)
 * and ranks them based on reachability, collision safety, and cycle time.
 */
export function evaluateRobotPositions(
  machine: DieCastingMachine,
  die: DieModel,
  robot: RobotModelSpec,
  waypoints: Waypoint[]
): {
  recommended: PositionCandidate;
  candidates: PositionCandidate[];
} {
  const topY = Math.max(1400, machine.platenHeight * 0.65 + 450);
  const sideX = -(machine.platenWidth * 0.5 + 420);
  const oppSideX = (machine.platenWidth * 0.5 + 420);
  const rearZ = die.fixedDieOffsetZ - 750;

  const rawCandidates: {
    id: string;
    mountType: RobotMountType;
    name: string;
    baseOffset: [number, number, number];
    description: string;
  }[] = [
    {
      id: 'cand-top-center',
      mountType: 'top',
      name: 'Top Mounted (Overhead Gantry)',
      baseOffset: [0, topY, 0],
      description: 'Suspended from an overhead bridge frame above the die opening. Provides optimal vertical reach into deep cavities with zero tie-bar interference.'
    },
    {
      id: 'cand-side-operator',
      mountType: 'side',
      name: 'Side Mounted (Pedestal Stand)',
      baseOffset: [sideX, 150, 0],
      description: 'Mounted beside the machine bed on a heavy-duty floor riser pedestal. Easy floor maintenance access, excellent reach into both fixed and moving platens.'
    },
    {
      id: 'cand-side-opposite',
      mountType: 'side',
      name: 'Side Mounted (Service Side)',
      baseOffset: [oppSideX, 150, 0],
      description: 'Mounted on the rear service side opposite the operator door. Keeps the operator loading door completely clear.'
    },
    {
      id: 'cand-rear-bracket',
      mountType: 'rear',
      name: 'Rear Shelf Mounted',
      baseOffset: [0, 300, rearZ],
      description: 'Mounted on a reinforced shelf behind the fixed platen. Compact cell footprint, ideal for restricted factory aisles.'
    }
  ];

  const evaluated: PositionCandidate[] = rawCandidates.map(cand => {
    const testSpec: RobotModelSpec = {
      ...robot,
      baseOffset: cand.baseOffset,
      mountOrientation: cand.mountType
    };

    // 1. Evaluate reachability
    let reachableCount = 0;
    for (const wp of waypoints) {
      const ik = solveInverseKinematics([wp.x, wp.y, wp.z], [wp.rx, wp.ry, wp.rz], testSpec);
      if (ik.isReachable && !ik.hasJointLimitViolation) {
        reachableCount++;
      }
    }
    const reachabilityPercent = waypoints.length > 0
      ? Math.round((reachableCount / waypoints.length) * 100)
      : 100;

    // 2. Evaluate collisions
    const audit = runCollisionAudit(waypoints, testSpec, machine, die);
    const minClearanceMm = Math.round(audit.minClearanceDistanceMm);
    const hasCollision = audit.hasCollision || minClearanceMm < 50;

    // 3. Score calculation
    let score = 0;
    score += reachabilityPercent * 0.55;
    score += hasCollision ? 0 : Math.min(30, (minClearanceMm / 150) * 30);
    if (cand.mountType === 'top') score += 15; // Overhead is preferred in modern high-pressure die casting
    if (cand.mountType === 'side') score += 10;

    const reasons: string[] = [];
    if (reachabilityPercent === 100) {
      reasons.push('100% Waypoints reachable without joint limit warnings');
    } else {
      reasons.push(`${100 - reachabilityPercent}% of positions exceed arm reach`);
    }

    if (!hasCollision && minClearanceMm > 120) {
      reasons.push(`Generous ${minClearanceMm}mm safety clearance from tie bars`);
    } else if (hasCollision) {
      reasons.push('Risk of mechanical interference with tie bars');
    }

    if (cand.mountType === 'top') {
      reasons.push('Direct line-of-sight into deep cavity features');
    }

    return {
      ...cand,
      reachabilityPercent,
      minClearanceMm,
      hasCollision,
      estimatedCoveragePercent: Math.min(98, Math.max(75, Math.round(reachabilityPercent * 0.96))),
      estimatedCycleTimeSec: cand.mountType === 'top' ? 14.8 : 16.2,
      score: Math.min(100, Math.max(10, Math.round(score))),
      reasons
    };
  });

  evaluated.sort((a, b) => b.score - a.score);

  return {
    recommended: evaluated[0],
    candidates: evaluated
  };
}

/**
 * Diagnoses problems and provides human-readable actionable fixes
 */
export function diagnoseCellProblems(
  robot: RobotModelSpec,
  machine: DieCastingMachine,
  die: DieModel,
  waypoints: Waypoint[]
): PositionFixAdvice[] {
  const advices: PositionFixAdvice[] = [];

  // Check reachability
  const unreachableWps = waypoints.filter(wp => {
    const ik = solveInverseKinematics([wp.x, wp.y, wp.z], [wp.rx, wp.ry, wp.rz], robot);
    return !ik.isReachable || ik.hasJointLimitViolation;
  });

  if (unreachableWps.length > 0) {
    const isTop = robot.mountOrientation === 'top';
    const suggestedOffset: [number, number, number] = isTop
      ? [0, Math.max(1250, robot.baseOffset[1] - 150), 0]
      : [robot.baseOffset[0] > 0 ? robot.baseOffset[0] - 120 : robot.baseOffset[0] + 120, robot.baseOffset[1], 0];

    advices.push({
      issueType: 'reachability',
      headline: `Robot cannot reach ${unreachableWps.length} spray positions.`,
      details: `The robot arm is fully extended or encountering joint limits at ${unreachableWps.map(w => w.name).slice(0, 2).join(', ')}.`,
      suggestedAction: isTop
        ? 'Lower the overhead gantry by 150mm to bring spray nozzles closer to the die cavity.'
        : 'Move the side riser pedestal 120mm closer to the machine centerline.',
      proposedBaseOffset: suggestedOffset,
      proposedMountType: robot.mountOrientation === 'top' ? 'top' : 'side'
    });
  }

  // Check collision
  const audit = runCollisionAudit(waypoints, robot, machine, die);
  if (audit.hasCollision || audit.minClearanceDistanceMm < 80) {
    const isTop = robot.mountOrientation === 'top';
    const proposedOffset: [number, number, number] = isTop
      ? [robot.baseOffset[0], robot.baseOffset[1] + 80, 0]
      : [robot.baseOffset[0] < 0 ? robot.baseOffset[0] - 80 : robot.baseOffset[0] + 80, robot.baseOffset[1] + 50, 0];

    advices.push({
      issueType: 'collision',
      headline: 'Robot arm or spray manifold interferes with machine tie bars.',
      details: `Minimum clearance is only ${Math.round(audit.minClearanceDistanceMm)}mm (safe standard is ≥120mm).`,
      suggestedAction: 'Re-align the robot mounting stand with +80mm offset to maintain a safe clearance envelope.',
      proposedBaseOffset: proposedOffset,
      proposedMountType: robot.mountOrientation === 'top' ? 'top' : 'side'
    });
  }

  if (advices.length === 0) {
    advices.push({
      issueType: 'optimal',
      headline: 'Cell configuration is safe and fully reachable.',
      details: 'All waypoints are within robot kinematic reach with safe tie bar clearance.',
      suggestedAction: 'No mechanical repositioning required. Ready for spray simulation.',
      proposedBaseOffset: robot.baseOffset,
      proposedMountType: (robot.mountOrientation as RobotMountType) || 'top'
    });
  }

  return advices;
}
