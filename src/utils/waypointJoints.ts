/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Waypoint } from '../types/path';
import { RobotModelSpec, RobotMountConfig, ToolCenterPoint } from '../types/robot';
import { solveInverseKinematics } from './kinematics';
import { getCadChainForRobot } from './kinematics/gp50CadChain';

export type Joints6 = [number, number, number, number, number, number];

/** Legacy generic-model home posture for ceiling-mounted robots (proportional model only). */
const GENERIC_TOP_SEED: Joints6 = [90, 130, -145, 0, 15, 0];

/** True when the robot's FK/IK come from a CAD-measured chain (Yaskawa GP50). */
export function hasCadChain(robot: Pick<RobotModelSpec, 'id'>): boolean {
  return !!getCadChainForRobot(robot);
}

/**
 * Starting joint seed for IK. Generic robots keep their legacy seeds. CAD-chain robots start
 * from the CAD zero pose (upper arm vertical, forearm horizontal); the IK multi-start handles
 * the rest, so no generic-model joint values are ever fed to a CAD-chain robot.
 */
export function getDefaultSeedJoints(robot: Pick<RobotModelSpec, 'id'>, isTop: boolean): Joints6 {
  if (hasCadChain(robot)) return [0, 0, 0, 0, 0, 0];
  return isTop ? [...GENERIC_TOP_SEED] as Joints6 : [0, 0, 0, 0, 0, 0];
}

const cache = new WeakMap<Waypoint[], { robot: unknown; tool: unknown; mount: unknown; joints: Joints6[] }>();

/**
 * Joint angles for every waypoint.
 * - Generic robots: the stored `jointAnglesDeg` (unchanged behaviour).
 * - CAD-chain robots: stored angles were solved for a different kinematic model (presets ship
 *   generic-model angles), so they are ignored and re-solved on the CAD chain from the waypoint's
 *   TCP pose, sequentially so consecutive waypoints stay on the same solution branch.
 */
export function resolveWaypointJoints(
  waypoints: Waypoint[],
  robot: RobotModelSpec,
  tool?: ToolCenterPoint,
  mount?: RobotMountConfig
): Joints6[] {
  const isTop = mount?.type === 'top' || mount?.type === 'top_machine_mount' || robot.mountOrientation === 'top';
  if (!hasCadChain(robot)) {
    return waypoints.map(w => (w.jointAnglesDeg as Joints6 | undefined) || getDefaultSeedJoints(robot, isTop));
  }
  const hit = cache.get(waypoints);
  if (hit && hit.robot === robot && hit.tool === tool && hit.mount === mount) return hit.joints;

  let seed = getDefaultSeedJoints(robot, isTop);
  const out: Joints6[] = [];
  for (const wp of waypoints) {
    const ik = solveInverseKinematics([wp.x, wp.y, wp.z], [wp.rx, wp.ry, wp.rz], robot, seed, tool, mount);
    out.push(ik.jointAnglesDeg as Joints6);
    if (ik.isReachable && !ik.hasJointLimitViolation) seed = ik.jointAnglesDeg as Joints6;
  }
  cache.set(waypoints, { robot, tool, mount, joints: out });
  return out;
}
