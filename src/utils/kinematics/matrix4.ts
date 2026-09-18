/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Matrix4Tuple, Vector3Tuple } from '../../types/kinematics';

export const DEG2RAD = Math.PI / 180;
export const RAD2DEG = 180 / Math.PI;

/**
 * 4x4 Row-Major Transformation Matrix representation:
 * [ m00, m01, m02, m03 ] -> [ 0,  1,  2,  3 ]
 * [ m10, m11, m12, m13 ] -> [ 4,  5,  6,  7 ]
 * [ m20, m21, m22, m23 ] -> [ 8,  9, 10, 11 ]
 * [ m30, m31, m32, m33 ] -> [ 12, 13, 14, 15 ]
 */
export class Matrix4Utils {
  static identity(): Matrix4Tuple {
    return [
      1, 0, 0, 0,
      0, 1, 0, 0,
      0, 0, 1, 0,
      0, 0, 0, 1
    ];
  }

  static fromTranslation(x: number, y: number, z: number): Matrix4Tuple {
    return [
      1, 0, 0, x,
      0, 1, 0, y,
      0, 0, 1, z,
      0, 0, 0, 1
    ];
  }

  static fromRotX(rad: number): Matrix4Tuple {
    const c = Math.cos(rad);
    const s = Math.sin(rad);
    return [
      1, 0,  0, 0,
      0, c, -s, 0,
      0, s,  c, 0,
      0, 0,  0, 1
    ];
  }

  static fromRotY(rad: number): Matrix4Tuple {
    const c = Math.cos(rad);
    const s = Math.sin(rad);
    return [
       c, 0, s, 0,
       0, 1, 0, 0,
      -s, 0, c, 0,
       0, 0, 0, 1
    ];
  }

  static fromRotZ(rad: number): Matrix4Tuple {
    const c = Math.cos(rad);
    const s = Math.sin(rad);
    return [
      c, -s, 0, 0,
      s,  c, 0, 0,
      0,  0, 1, 0,
      0,  0, 0, 1
    ];
  }

  /**
   * Intrinsic or Extrinsic Euler XYZ rotation matrix
   * R = R_x(rx) * R_y(ry) * R_z(rz)
   */
  static fromEulerDeg(rxDeg: number, ryDeg: number, rzDeg: number): Matrix4Tuple {
    const rx = rxDeg * DEG2RAD;
    const ry = ryDeg * DEG2RAD;
    const rz = rzDeg * DEG2RAD;

    const cx = Math.cos(rx);
    const sx = Math.sin(rx);
    const cy = Math.cos(ry);
    const sy = Math.sin(ry);
    const cz = Math.cos(rz);
    const sz = Math.sin(rz);

    return [
      cy * cz, -cy * sz, sy, 0,
      sx * sy * cz + cx * sz, -sx * sy * sz + cx * cz, -sx * cy, 0,
      -cx * sy * cz + sx * sz, cx * sy * sz + sx * cz, cx * cy, 0,
      0, 0, 0, 1
    ];
  }

  static fromTranslationAndEuler(
    pos: Vector3Tuple,
    eulerDeg: Vector3Tuple
  ): Matrix4Tuple {
    const rot = this.fromEulerDeg(eulerDeg[0], eulerDeg[1], eulerDeg[2]);
    rot[3] = pos[0];
    rot[7] = pos[1];
    rot[11] = pos[2];
    return rot;
  }

  static multiply(a: Matrix4Tuple, b: Matrix4Tuple): Matrix4Tuple {
    const out = new Array(16) as unknown as Matrix4Tuple;
    for (let row = 0; row < 4; row++) {
      const r = row * 4;
      for (let col = 0; col < 4; col++) {
        out[r + col] =
          a[r + 0] * b[0 * 4 + col] +
          a[r + 1] * b[1 * 4 + col] +
          a[r + 2] * b[2 * 4 + col] +
          a[r + 3] * b[3 * 4 + col];
      }
    }
    return out;
  }

  /**
   * Fast exact inversion for rigid body transformation matrix [R, p; 0, 1]
   * Inv = [R^T, -R^T * p; 0, 1]
   */
  static invertRigid(m: Matrix4Tuple): Matrix4Tuple {
    // R^T
    const r00 = m[0], r01 = m[4], r02 = m[8];
    const r10 = m[1], r11 = m[5], r12 = m[9];
    const r20 = m[2], r21 = m[6], r22 = m[10];

    // p
    const px = m[3], py = m[7], pz = m[11];

    // -R^T * p
    const tx = -(r00 * px + r01 * py + r02 * pz);
    const ty = -(r10 * px + r11 * py + r12 * pz);
    const tz = -(r20 * px + r21 * py + r22 * pz);

    return [
      r00, r01, r02, tx,
      r10, r11, r12, ty,
      r20, r21, r22, tz,
      0,   0,   0,   1
    ];
  }

  static transformPoint(m: Matrix4Tuple, p: Vector3Tuple): Vector3Tuple {
    const x = m[0] * p[0] + m[1] * p[1] + m[2] * p[2] + m[3];
    const y = m[4] * p[0] + m[5] * p[1] + m[6] * p[2] + m[7];
    const z = m[8] * p[0] + m[9] * p[1] + m[10] * p[2] + m[11];
    return [x, y, z];
  }

  static transformVector(m: Matrix4Tuple, v: Vector3Tuple): Vector3Tuple {
    const x = m[0] * v[0] + m[1] * v[1] + m[2] * v[2];
    const y = m[4] * v[0] + m[5] * v[1] + m[6] * v[2];
    const z = m[8] * v[0] + m[9] * v[1] + m[10] * v[2];
    return [x, y, z];
  }

  static getTranslation(m: Matrix4Tuple): Vector3Tuple {
    return [m[3], m[7], m[11]];
  }

  /**
   * Extracts Euler angles in degrees (XYZ order) from rotation matrix
   */
  static toEulerDeg(m: Matrix4Tuple): Vector3Tuple {
    // R = [
    //   [cy*cz, -cy*sz, sy],
    //   [sx*sy*cz + cx*sz, -sx*sy*sz + cx*cz, -sx*cy],
    //   [-cx*sy*cz + sx*sz, cx*sy*sz + sx*cz, cx*cy]
    // ]
    const sy = Math.max(-1, Math.min(1, m[2]));
    let rx: number;
    let ry: number;
    let rz: number;

    if (Math.abs(sy) < 0.999999) {
      ry = Math.asin(sy);
      rx = Math.atan2(-m[6], m[10]);
      rz = Math.atan2(-m[1], m[0]);
    } else {
      // Gimbal lock
      ry = sy > 0 ? Math.PI / 2 : -Math.PI / 2;
      rx = Math.atan2(m[9], m[5]);
      rz = 0;
    }

    return [
      normalizeAngleDeg(rx * RAD2DEG),
      normalizeAngleDeg(ry * RAD2DEG),
      normalizeAngleDeg(rz * RAD2DEG)
    ];
  }

  /**
   * Standard Denavit-Hartenberg (DH) 4x4 transformation matrix:
   * RotZ(theta) * TransZ(d) * TransX(a) * RotX(alpha)
   */
  static fromDH(a: number, alphaRad: number, d: number, thetaRad: number): Matrix4Tuple {
    const ct = Math.cos(thetaRad);
    const st = Math.sin(thetaRad);
    const ca = Math.cos(alphaRad);
    const sa = Math.sin(alphaRad);

    return [
      ct, -st * ca,  st * sa, a * ct,
      st,  ct * ca, -ct * sa, a * st,
      0,   sa,       ca,      d,
      0,   0,        0,       1
    ];
  }
}

export function distance3D(p1: Vector3Tuple, p2: Vector3Tuple): number {
  const dx = p1[0] - p2[0];
  const dy = p1[1] - p2[1];
  const dz = p1[2] - p2[2];
  return Math.hypot(dx, dy, dz);
}

export function normalizeAngleDeg(deg: number): number {
  let angle = deg % 360;
  if (angle > 180) angle -= 360;
  if (angle <= -180) angle += 360;
  return Math.round(angle * 1000) / 1000;
}

export function angularDifferenceDeg(a: Vector3Tuple, b: Vector3Tuple): number {
  const diffX = Math.abs(normalizeAngleDeg(a[0] - b[0]));
  const diffY = Math.abs(normalizeAngleDeg(a[1] - b[1]));
  const diffZ = Math.abs(normalizeAngleDeg(a[2] - b[2]));
  return Math.sqrt(diffX * diffX + diffY * diffY + diffZ * diffZ);
}
