import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { RobotArmRig } from '../components/viewport/cellSceneBuilder';

export interface Gp50NodeClassification {
  base?: THREE.Object3D;
  sAxis?: THREE.Object3D; // J1
  lAxis?: THREE.Object3D; // J2
  uAxis?: THREE.Object3D; // J3
  rAxis?: THREE.Object3D; // J4
  bAxis?: THREE.Object3D; // J5
  tlAxis?: THREE.Object3D; // J6
  unassigned: THREE.Object3D[];
}

export interface Gp50HierarchyReport {
  loaded: boolean;
  filePath: string;
  detectedScale: number;
  boundingBox: {
    min: [number, number, number];
    max: [number, number, number];
    size: [number, number, number];
  };
  nodeList: Array<{
    name: string;
    type: string;
    parentName: string | null;
    position: [number, number, number];
    assignedJoint: string | null;
  }>;
  mapping: {
    base: string | null;
    sAxis_J1: string | null;
    lAxis_J2: string | null;
    uAxis_J3: string | null;
    rAxis_J4: string | null;
    bAxis_J5: string | null;
    tlAxis_J6: string | null;
  };
}

let cachedGltfScene: THREE.Group | null = null;
let cachedReport: Gp50HierarchyReport | null = null;
let isLoadAttempted = false;
let loadPromise: Promise<THREE.Group | null> | null = null;

// Premium Yaskawa Motoman factory finish materials
const MAT_YASKAWA_BLUE = new THREE.MeshStandardMaterial({
  color: 0x02569b,
  metalness: 0.25,
  roughness: 0.45,
});

const MAT_DARK_DRIVE = new THREE.MeshStandardMaterial({
  color: 0x24282c,
  metalness: 0.55,
  roughness: 0.35,
});

const MAT_FLANGE_STEEL = new THREE.MeshStandardMaterial({
  color: 0x9ca3af,
  metalness: 0.75,
  roughness: 0.2,
});

/**
 * Classifies a node name into one of the Yaskawa GP50 components.
 * Matches standard STEP assembly conventions: S_AXIS, L_AXIS, U_AXIS, R_AXIS, B_AXIS, TLAXIS
 */
function classifyNodeName(rawName: string): 'BASE' | 'J1' | 'J2' | 'J3' | 'J4' | 'J5' | 'J6' | null {
  const clean = rawName.toLowerCase().replace(/[^a-z0-9]/g, '');

  // J6: TLAXIS / TL_AXIS / T_AXIS / FLANGE
  if (
    clean.includes('tlaxis') ||
    clean.includes('tlax') ||
    clean.includes('taxis') ||
    clean.includes('joint6') ||
    clean.includes('axis6') ||
    clean === 'j6' ||
    clean.endsWith('j6')
  ) {
    return 'J6';
  }

  // J5: B_AXIS / BEND
  if (
    clean.includes('baxis') ||
    clean.includes('joint5') ||
    clean.includes('axis5') ||
    clean === 'j5' ||
    clean.endsWith('j5')
  ) {
    return 'J5';
  }

  // J4: R_AXIS / ROLL
  if (
    clean.includes('raxis') ||
    clean.includes('joint4') ||
    clean.includes('axis4') ||
    clean === 'j4' ||
    clean.endsWith('j4')
  ) {
    return 'J4';
  }

  // J3: U_AXIS / UPPER ARM
  if (
    clean.includes('uaxis') ||
    clean.includes('joint3') ||
    clean.includes('axis3') ||
    clean === 'j3' ||
    clean.endsWith('j3')
  ) {
    return 'J3';
  }

  // J2: L_AXIS / LOWER ARM
  if (
    clean.includes('laxis') ||
    clean.includes('joint2') ||
    clean.includes('axis2') ||
    clean === 'j2' ||
    clean.endsWith('j2')
  ) {
    return 'J2';
  }

  // J1: S_AXIS / SWIVEL / TURNTABLE
  if (
    clean.includes('saxis') ||
    clean.includes('joint1') ||
    clean.includes('axis1') ||
    clean === 'j1' ||
    clean.endsWith('j1')
  ) {
    return 'J1';
  }

  // BASE
  if (
    clean.includes('base') ||
    clean.includes('pedestal') ||
    clean.includes('housing') ||
    clean.includes('frame') ||
    clean === 'b'
  ) {
    return 'BASE';
  }

  return null;
}

/**
 * Loads the Yaskawa GP50 CAD GLB model from `public/models/gp50/GP50.glb`.
 * Inspects the scene hierarchy, determines actual node names and transforms,
 * and scales from meters to millimeters if necessary.
 */
export async function loadGp50CadModel(): Promise<{ scene: THREE.Group; report: Gp50HierarchyReport } | null> {
  if (cachedGltfScene && cachedReport) {
    return { scene: cachedGltfScene, report: cachedReport };
  }

  if (loadPromise) {
    const s = await loadPromise;
    if (s && cachedReport) return { scene: s, report: cachedReport };
    return null;
  }

  const pathsToTry = [
    '/models/gp50/GP50.glb',
    '/models/gp50/gp50.glb',
    'models/gp50/GP50.glb',
    'models/gp50/gp50.glb'
  ];

  loadPromise = (async () => {
    isLoadAttempted = true;
    const loader = new GLTFLoader();

    for (const url of pathsToTry) {
      try {
        const gltf = await new Promise<any>((resolve, reject) => {
          loader.load(url, resolve, undefined, reject);
        });

        if (gltf && gltf.scene) {
          console.log(`[GP50 CAD] Successfully loaded actual CAD geometry from: ${url}`);
          const scene: THREE.Group = gltf.scene;

          // 1. Inspect Bounding Box & Detect Scale
          const rawBbox = new THREE.Box3().setFromObject(scene);
          const rawSize = new THREE.Vector3();
          rawBbox.getSize(rawSize);
          const maxDim = Math.max(rawSize.x, rawSize.y, rawSize.z);

          // If exported in meters (reach ~2.06m), scale to millimeters (2061mm)
          let detectedScale = 1.0;
          if (maxDim > 0 && maxDim < 10) {
            detectedScale = 1000.0;
            console.log(`[GP50 CAD] Model dimensions detected in METERS (${maxDim.toFixed(2)}m). Scaling by 1000 to simulation millimeters.`);
            scene.scale.set(detectedScale, detectedScale, detectedScale);
            scene.updateMatrixWorld(true);
          } else {
            console.log(`[GP50 CAD] Model dimensions detected in MILLIMETERS (${maxDim.toFixed(1)}mm). Scale factor: 1.0`);
          }

          const scaledBbox = new THREE.Box3().setFromObject(scene);
          const scaledSize = new THREE.Vector3();
          scaledBbox.getSize(scaledSize);

          // 2. Deep Hierarchy Inspection & Node Logging
          console.log('================================================================');
          console.log('[GP50 CAD] ACTUAL GLB SCENE HIERARCHY INSPECTION:');
          console.log(`[GP50 CAD] Overall Bounding Box Size: [${scaledSize.x.toFixed(1)}, ${scaledSize.y.toFixed(1)}, ${scaledSize.z.toFixed(1)}] mm`);
          console.log('----------------------------------------------------------------');

          const nodeList: Gp50HierarchyReport['nodeList'] = [];
          const mapping: Gp50HierarchyReport['mapping'] = {
            base: null,
            sAxis_J1: null,
            lAxis_J2: null,
            uAxis_J3: null,
            rAxis_J4: null,
            bAxis_J5: null,
            tlAxis_J6: null,
          };

          scene.traverse((node) => {
            const role = classifyNodeName(node.name);
            nodeList.push({
              name: node.name,
              type: node.type,
              parentName: node.parent?.name || null,
              position: [node.position.x, node.position.y, node.position.z],
              assignedJoint: role,
            });

            console.log(
              `  • Node: "${node.name}" | Type: ${node.type} | Parent: "${node.parent?.name || 'ROOT'}" | Role: ${role || 'UNASSIGNED'} | Pos: [${node.position.x.toFixed(1)}, ${node.position.y.toFixed(1)}, ${node.position.z.toFixed(1)}]`
            );

            if (role === 'BASE' && !mapping.base) mapping.base = node.name;
            if (role === 'J1' && !mapping.sAxis_J1) mapping.sAxis_J1 = node.name;
            if (role === 'J2' && !mapping.lAxis_J2) mapping.lAxis_J2 = node.name;
            if (role === 'J3' && !mapping.uAxis_J3) mapping.uAxis_J3 = node.name;
            if (role === 'J4' && !mapping.rAxis_J4) mapping.rAxis_J4 = node.name;
            if (role === 'J5' && !mapping.bAxis_J5) mapping.bAxis_J5 = node.name;
            if (role === 'J6' && !mapping.tlAxis_J6) mapping.tlAxis_J6 = node.name;

            // Enable cast & receive shadows on all CAD meshes
            if ((node as THREE.Mesh).isMesh) {
              const mesh = node as THREE.Mesh;
              mesh.castShadow = true;
              mesh.receiveShadow = true;

              // Ensure high-grade visual finish
              if (role === 'J6') {
                mesh.material = MAT_FLANGE_STEEL;
              } else if (role === 'J4' || role === 'J5') {
                mesh.material = MAT_DARK_DRIVE;
              } else if (role === 'BASE') {
                mesh.material = MAT_DARK_DRIVE;
              } else if (role === 'J1' || role === 'J2' || role === 'J3') {
                mesh.material = MAT_YASKAWA_BLUE;
              }
            }
          });

          console.log('----------------------------------------------------------------');
          console.log('[GP50 CAD] JOINT MAPPING SUMMARY:');
          console.log(`  Base:       ${mapping.base || '(auto-group unassigned root meshes)'}`);
          console.log(`  J1 (S_AXIS): ${mapping.sAxis_J1 || 'NOT FOUND'}`);
          console.log(`  J2 (L_AXIS): ${mapping.lAxis_J2 || 'NOT FOUND'}`);
          console.log(`  J3 (U_AXIS): ${mapping.uAxis_J3 || 'NOT FOUND'}`);
          console.log(`  J4 (R_AXIS): ${mapping.rAxis_J4 || 'NOT FOUND'}`);
          console.log(`  J5 (B_AXIS): ${mapping.bAxis_J5 || 'NOT FOUND'}`);
          console.log(`  J6 (TLAXIS): ${mapping.tlAxis_J6 || 'NOT FOUND'}`);
          console.log('================================================================');

          cachedReport = {
            loaded: true,
            filePath: url,
            detectedScale,
            boundingBox: {
              min: [scaledBbox.min.x, scaledBbox.min.y, scaledBbox.min.z],
              max: [scaledBbox.max.x, scaledBbox.max.y, scaledBbox.max.z],
              size: [scaledSize.x, scaledSize.y, scaledSize.z],
            },
            nodeList,
            mapping,
          };

          cachedGltfScene = scene;
          return scene;
        }
      } catch (err: any) {
        console.warn(`[GP50 CAD] Notice while checking "${url}":`, err?.message || err);
      }
    }

    console.warn('[GP50 CAD] No actual CAD file found yet at public/models/gp50/GP50.glb.');
    return null;
  })();

  const res = await loadPromise;
  if (res && cachedReport) {
    return { scene: res, report: cachedReport };
  }
  return null;
}

/**
 * Binds the extracted GP50 CAD components to the authoritative kinematic RobotArmRig.
 * Preserves the FK/IK mathematical source of truth while replacing procedural arm geometry.
 */
export function bindGp50CadToKinematicRig(
  rig: RobotArmRig,
  cadScene: THREE.Group,
  hideProceduralMeshes?: () => void
): boolean {
  try {
    // 1. Find all axis components from the CAD scene
    const nodes: Gp50NodeClassification = {
      unassigned: [],
    };

    cadScene.traverse((node) => {
      const role = classifyNodeName(node.name);
      if (role === 'J1' && !nodes.sAxis) nodes.sAxis = node;
      else if (role === 'J2' && !nodes.lAxis) nodes.lAxis = node;
      else if (role === 'J3' && !nodes.uAxis) nodes.uAxis = node;
      else if (role === 'J4' && !nodes.rAxis) nodes.rAxis = node;
      else if (role === 'J5' && !nodes.bAxis) nodes.bAxis = node;
      else if (role === 'J6' && !nodes.tlAxis) nodes.tlAxis = node;
      else if (role === 'BASE' && !nodes.base) nodes.base = node;
    });

    // Make sure all global matrices are up to date
    cadScene.updateMatrixWorld(true);
    rig.baseGroup.updateMatrixWorld(true);

    const [j1, j2, j3, j4, j5, j6] = rig.jointGroups;

    // Attach Base CAD component (rigidly stationary on base anchor)
    if (nodes.base) {
      rig.baseGroup.attach(nodes.base);
    } else {
      // If base was not a separate named node, attach the remaining root of cadScene
      rig.baseGroup.attach(cadScene);
    }

    // Attach J1: S_AXIS
    if (nodes.sAxis) {
      j1.attach(nodes.sAxis);
    }

    // Attach J2: L_AXIS
    if (nodes.lAxis) {
      j2.attach(nodes.lAxis);
    }

    // Attach J3: U_AXIS
    if (nodes.uAxis) {
      j3.attach(nodes.uAxis);
    }

    // Attach J4: R_AXIS
    if (nodes.rAxis) {
      j4.attach(nodes.rAxis);
    }

    // Attach J5: B_AXIS
    if (nodes.bAxis) {
      j5.attach(nodes.bAxis);
    }

    // Attach J6: TLAXIS
    if (nodes.tlAxis) {
      j6.attach(nodes.tlAxis);
    }

    // 2. Hide or remove the procedural GP50 geometry so there is strictly ONE robot
    if (hideProceduralMeshes) {
      hideProceduralMeshes();
    }

    console.log('[GP50 CAD] Successfully bound CAD nodes: S_AXIS→J1, L_AXIS→J2, U_AXIS→J3, R_AXIS→J4, B_AXIS→J5, TLAXIS→J6');
    return true;
  } catch (err) {
    console.error('[GP50 CAD] Error binding CAD nodes to kinematic rig:', err);
    return false;
  }
}
