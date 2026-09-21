/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { CadKinematicChain, Matrix4Tuple, Vector3Tuple } from '../../types/kinematics';
import { RobotModelSpec } from '../../types/robot';

/**
 * Yaskawa MOTOMAN GP50 kinematic chain, measured from the supplied STEP assembly
 * (gp50_asm.stp, Yaskawa Pro/E export) — NOT a proportional approximation.
 *
 * Source of every number below: the exact analytic CYLINDRICAL_SURFACE axes of the STEP B-rep
 * (coaxial bearing bores/covers of the neighbouring parts), see public/models/gp50/gp50_manifest.json.
 *
 * CAD frame (as authored by Yaskawa): +Y up, +X forward (forearm direction at zero pose), mm.
 * Robot frame used by the simulator:  +Z up, +X forward.   robot = (X, -Z, Y) of CAD.
 *
 * Zero pose (identical in the CAD and in this chain): upper arm vertical, forearm horizontal (+X),
 * flange facing +X.
 */

/** CAD pivots (mm, CAD frame). J4/J5/J6 axes intersect at the wrist centre (spherical wrist). */
export const GP50_CAD_PIVOTS: Record<'J1' | 'J2' | 'J3' | 'J4' | 'J5' | 'J6', Vector3Tuple> = {
  J1: [0, 0, 0],
  J2: [144, 540, 0],
  J3: [144, 1410, 0],
  J4: [1170, 1620, 0],
  J5: [1170, 1620, 0],
  J6: [1170, 1620, 0]
};

/** CAD rotation axes (CAD frame). */
export const GP50_CAD_AXES: Record<'J1' | 'J2' | 'J3' | 'J4' | 'J5' | 'J6', Vector3Tuple> = {
  J1: [0, 1, 0],
  J2: [0, 0, 1],
  J3: [0, 0, 1],
  J4: [1, 0, 0],
  J5: [0, 0, 1],
  J6: [1, 0, 0]
};

/** Tool mounting face measured on the T-axis part (X = 1345 mm), i.e. 175 mm from the wrist centre. */
export const GP50_CAD_FLANGE: Vector3Tuple = [1345, 1620, 0];

/**
 * Positive rotation direction of each joint, expressed against the right-handed CAD axis above
 * (robot-frame axis = cadToRobot(CAD axis)):
 *   J1 +CCW seen from above, J2 +forward lean, J3 +forearm pitches down, J4 +right-handed roll about +X,
 *   J5 +flange pitches down, J6 +right-handed roll about the flange axis.
 * ASSUMPTION (to confirm on the pendant): matches the simulator's existing pitch conventions.
 * If the real U/B axes turn out opposite, flip the entries here — this is the single place.
 */
export const GP50_POSITIVE_SENSE: [1 | -1, 1 | -1, 1 | -1, 1 | -1, 1 | -1, 1 | -1] = [1, -1, -1, 1, -1, 1];

/** CAD frame (+Y up) -> robot frame (+Z up):  (X, Y, Z) -> (X, -Z, Y). Proper rotation (+90° about X). */
export function cadToRobot(v: Vector3Tuple): Vector3Tuple {
  return [v[0], -v[2], v[1]];
}

const sub = (a: Vector3Tuple, b: Vector3Tuple): Vector3Tuple => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];

const names = ['J1 (S)', 'J2 (L)', 'J3 (U)', 'J4 (R)', 'J5 (B)', 'J6 (T)'];
const keys = ['J1', 'J2', 'J3', 'J4', 'J5', 'J6'] as const;

/** Flange frame at zero pose: +Z = flange normal (+X of robot), i.e. Ry(+90°). Row-major. */
const FLANGE_ROTATION: Matrix4Tuple = [
  0, 0, 1, 0,
  0, 1, 0, 0,
  -1, 0, 0, 0,
  0, 0, 0, 1
];

export const GP50_CAD_CHAIN: CadKinematicChain = {
  source: 'Yaskawa GP50 STEP (gp50_asm.stp) — exact cylinder axes',
  joints: keys.map((k, i) => {
    const prev: Vector3Tuple = i === 0 ? [0, 0, 0] : GP50_CAD_PIVOTS[keys[i - 1]];
    return {
      name: names[i],
      offsetMm: cadToRobot(sub(GP50_CAD_PIVOTS[k], prev)),
      axis: cadToRobot(GP50_CAD_AXES[k]),
      sign: GP50_POSITIVE_SENSE[i]
    };
  }) as CadKinematicChain['joints'],
  flangeOffsetMm: cadToRobot(sub(GP50_CAD_FLANGE, GP50_CAD_PIVOTS.J6)),
  flangeRotation: FLANGE_ROTATION
};

/** Returns the CAD-measured chain for robots that have one (currently the Yaskawa GP50). */
export function getCadChainForRobot(spec: Pick<RobotModelSpec, 'id'>): CadKinematicChain | undefined {
  return spec.id === 'yaskawa-gp50' ? GP50_CAD_CHAIN : undefined;
}
