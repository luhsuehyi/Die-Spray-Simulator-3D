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

export interface Gp50Manifest {
  robotModel: string;
  pivots: Record<'J1' | 'J2' | 'J3' | 'J4' | 'J5' | 'J6', [number, number, number]>;
  axes: Record<'J1' | 'J2' | 'J3' | 'J4' | 'J5' | 'J6', [number, number, number]>;
  flangeOffset: [number, number, number];
  materials: {
    YaskawaBlue: string;
    AccentSilver: string;
    DarkGrey: string;
  };
}

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

/** Parse CAD node names, apply the manifest material scheme, and enable shadows. */
export function buildGp50CadHierarchy(gltfScene: THREE.Group, manifest: Gp50Manifest): THREE.Group {
  const blue = new THREE.MeshStandardMaterial({
    color: manifest.materials.YaskawaBlue,
    metalness: 0.25,
    roughness: 0.42
  });
  const silver = new THREE.MeshStandardMaterial({
    color: manifest.materials.AccentSilver,
    metalness: 0.45,
    roughness: 0.32
  });
  const dark = new THREE.MeshStandardMaterial({
    color: manifest.materials.DarkGrey,
    metalness: 0.55,
    roughness: 0.38
  });

  gltfScene.traverse((object) => {
    const mesh = object as THREE.Mesh;
    if (!mesh.isMesh) return;

    const name = object.name.toUpperCase();
    const isBlueLink =
      name.startsWith('L_') || name.startsWith('U_') || name.startsWith('S_') ||
      name.endsWith('_L') || name.endsWith('_U') || name.endsWith('_S');
    const isSilverLink =
      name.startsWith('R_') || name.startsWith('B_') || name.startsWith('T_') ||
      name.endsWith('_R') || name.endsWith('_B') || name.endsWith('_T');

    if (isBlueLink) mesh.material = blue;
    else if (isSilverLink) mesh.material = silver;
    else if (name === 'BASE' || name.startsWith('BASE_')) mesh.material = dark;

    mesh.castShadow = true;
    mesh.receiveShadow = true;
  });

  return gltfScene;
}

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
  /** Manifest used to build and render this CAD hierarchy. */
  manifest: Gp50Manifest;
  triangleCount: number;
}

let cachedParts: Promise<Gp50CadParts> | null = null;

async function loadFromUrl(url: string, manifest: Gp50Manifest): Promise<Gp50CadParts> {
  const gltf = await new GLTFLoader().loadAsync(url);
  buildGp50CadHierarchy(gltf.scene, manifest);
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
  return { geometry, manifest, triangleCount };
}

/** Loads (once) the 7 CAD part geometries. Rejects with a descriptive error; never falls back to generic geometry. */
export function loadGp50CadParts(): Promise<Gp50CadParts> {
  if (cachedParts) return cachedParts;
  emitStatus('loading');
  cachedParts = (async () => {
    const manifestBase = ((import.meta as any)?.env?.BASE_URL ?? '/').replace(/\/$/, '');
    const manifestUrl = `${manifestBase}/models/gp50/gp50_manifest.json`;
    const manifestResponse = await fetch(manifestUrl);
    if (!manifestResponse.ok) {
      throw new Error(`Failed to load GP50 manifest (${manifestResponse.status} ${manifestResponse.statusText})`);
    }
    const manifest = (await manifestResponse.json()) as Gp50Manifest;

    const errors: string[] = [];
    for (const url of candidateUrls()) {
      try {
        const parts = await loadFromUrl(url, manifest);
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

const materialCache = new Map<string, THREE.MeshStandardMaterial>();
function materialFor(color: string | number): THREE.MeshStandardMaterial {
  const key = String(color);
  let m = materialCache.get(key);
  if (!m) {
    m = new THREE.MeshStandardMaterial({ color, metalness: 0.25, roughness: 0.42 });
    materialCache.set(key, m);
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
    const materialColor = name === 'BASE'
      ? parts.manifest.materials.DarkGrey
      : ['J1_S', 'J2_L', 'J3_U'].includes(name)
        ? parts.manifest.materials.YaskawaBlue
        : parts.manifest.materials.AccentSilver;
    const mesh = new THREE.Mesh(parts.geometry[name], materialFor(materialColor));
    mesh.name = `GP50_CAD_${name}_mesh`;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    holder.add(mesh);
    parent.add(holder);
    holders.push(holder);
  });
  return holders;
}
