/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

/**
 * Loads the real Yaskawa GP50 CAD (public/models/gp50/GP50_clean.glb) and mounts it on the
 * kinematic rig. The GLB is produced by tools/build_gp50_asset.py from the supplied
 * GP50.glb / STEP: one mesh per CAD part, upright (CAD frame), each part expressed relative to
 * its own joint pivot. No geometry is generated here — every visible robot triangle is CAD.
 *
 * Joint pivots/axes are NOT read from the GLB nodes; they come from GP50_CAD_CHAIN
 * (src/utils/kinematics/gp50CadChain.ts), the same chain FK/IK use, so the picture and the
 * numbers cannot diverge.
 */

export type Gp50PartName = 'BASE' | 'J1_S' | 'J2_L' | 'J3_U' | 'J4_R' | 'J5_B' | 'J6_T';

/** Rig part order = attach order: index 0 -> baseGroup, index i -> jointGroups[i-1]. */
export const GP50_PART_ORDER: Gp50PartName[] = ['BASE', 'J1_S', 'J2_L', 'J3_U', 'J4_R', 'J5_B', 'J6_T'];

/**
 * Paint scheme. The STEP/GLB carry NO colour data (0 style entries, a single grey material), so
 * colours are assigned per real CAD part: Yaskawa blue for the painted castings, machined steel
 * for the tool flange (T-axis). Edit here to adjust the look.
 */
export const GP50_PART_COLORS: Record<Gp50PartName, number> = {
  BASE: 0x02569b,
  J1_S: 0x02569b,
  J2_L: 0x02569b,
  J3_U: 0x02569b,
  J4_R: 0x02569b,
  J5_B: 0x02569b,
  J6_T: 0xb4b9c0
};

export type Gp50CadStatus = 'loading' | 'ready' | 'failed';
export const GP50_CAD_STATUS_EVENT = 'gp50-cad-status';

function emitStatus(status: Gp50CadStatus, message?: string) {
  if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
    window.dispatchEvent(new CustomEvent(GP50_CAD_STATUS_EVENT, { detail: { status, message } }));
  }
}

function candidateUrls(): string[] {
  const base: string = (import.meta as any)?.env?.BASE_URL ?? '/';
  const norm = base.endsWith('/') ? base : `${base}/`;
  return Array.from(new Set([`${norm}models/gp50/GP50_clean.glb`, 'models/gp50/GP50_clean.glb', './models/gp50/GP50_clean.glb']));
}

export interface Gp50CadParts {
  /** Geometry per CAD part, in CAD axes, relative to the part's own joint pivot. */
  geometry: Record<Gp50PartName, THREE.BufferGeometry>;
  triangleCount: number;
}

let cachedParts: Promise<Gp50CadParts> | null = null;

async function loadFromUrl(url: string): Promise<Gp50CadParts> {
  const gltf = await new GLTFLoader().loadAsync(url);
  const geometry = {} as Record<Gp50PartName, THREE.BufferGeometry>;
  let triangleCount = 0;
  for (const name of GP50_PART_ORDER) {
    const obj = gltf.scene.getObjectByName(name) as THREE.Mesh | undefined;
    if (!obj || !(obj as THREE.Mesh).isMesh) {
      throw new Error(`GP50 CAD asset is missing part "${name}" (expected 7 parts: ${GP50_PART_ORDER.join(', ')})`);
    }
    const g = obj.geometry;
    geometry[name] = g;
    triangleCount += (g.index ? g.index.count : g.getAttribute('position').count) / 3;
  }
  return { geometry, triangleCount };
}

/** Loads (once) the 7 CAD part geometries. Rejects with a descriptive error; never falls back to generic geometry. */
export function loadGp50CadParts(): Promise<Gp50CadParts> {
  if (cachedParts) return cachedParts;
  emitStatus('loading');
  cachedParts = (async () => {
    const errors: string[] = [];
    for (const url of candidateUrls()) {
      try {
        const parts = await loadFromUrl(url);
        emitStatus('ready');
        return parts;
      } catch (e: any) {
        errors.push(`${url}: ${e?.message ?? e}`);
      }
    }
    const message = `Yaskawa GP50 CAD model could not be loaded. Tried:\n${errors.join('\n')}`;
    console.error('[GP50 CAD]', message);
    emitStatus('failed', message);
    cachedParts = null; // allow a retry on the next rig build
    throw new Error(message);
  })();
  return cachedParts;
}

const materialCache = new Map<number, THREE.MeshStandardMaterial>();
function materialFor(color: number): THREE.MeshStandardMaterial {
  let m = materialCache.get(color);
  if (!m) {
    m = new THREE.MeshStandardMaterial({ color, metalness: 0.25, roughness: 0.42 });
    materialCache.set(color, m);
  }
  return m;
}

/** CAD frame (+Y up) -> robot frame (+Z up): +90° about X, i.e. (X, Y, Z) -> (X, -Z, Y). */
const CAD_TO_ROBOT_Q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI / 2);

/**
 * Mounts the CAD parts on the rig groups: BASE on the base anchor, S..T on J1..J6.
 * Each part sits in a holder rotated CAD->robot frame; the group itself sits at the joint pivot
 * and rotates about the measured axis, so the CAD articulates about its real mechanical axes.
 */
export function attachGp50CadParts(
  baseGroup: THREE.Object3D,
  jointGroups: THREE.Object3D[],
  parts: Gp50CadParts
): THREE.Object3D[] {
  const holders: THREE.Object3D[] = [];
  GP50_PART_ORDER.forEach((name, i) => {
    const parent = i === 0 ? baseGroup : jointGroups[i - 1];
    const holder = new THREE.Group();
    holder.name = `GP50_CAD_${name}`;
    holder.quaternion.copy(CAD_TO_ROBOT_Q);
    const mesh = new THREE.Mesh(parts.geometry[name], materialFor(GP50_PART_COLORS[name]));
    mesh.name = `GP50_CAD_${name}_mesh`;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    holder.add(mesh);
    parent.add(holder);
    holders.push(holder);
  });
  return holders;
}
