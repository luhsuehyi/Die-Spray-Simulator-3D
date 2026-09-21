import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { RobotArmRig } from '../components/viewport/cellSceneBuilder';

export interface Gp50NodeClassification {
  base?: THREE.Object3D;
  sAxis?: THREE.Object3D;
  lAxis?: THREE.Object3D;
  uAxis?: THREE.Object3D;
  rAxis?: THREE.Object3D;
  bAxis?: THREE.Object3D;
  tlAxis?: THREE.Object3D;
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
let loadPromise: Promise<THREE.Group | null> | null = null;

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

type Gp50Role = 'BASE' | 'J1' | 'J2' | 'J3' | 'J4' | 'J5' | 'J6' | null;

function classifyNodeName(rawName: string): Gp50Role {
  const clean = rawName.toLowerCase().replace(/[^a-z0-9]/g, '');

  if (clean.includes('tlaxis') || clean.includes('taxis') || clean.includes('joint6') || clean.includes('axis6') || clean === 'j6' || clean.endsWith('j6')) return 'J6';
  if (clean.includes('baxis') || clean.includes('joint5') || clean.includes('axis5') || clean === 'j5' || clean.endsWith('j5')) return 'J5';
  if (clean.includes('raxis') || clean.includes('joint4') || clean.includes('axis4') || clean === 'j4' || clean.endsWith('j4')) return 'J4';
  if (clean.includes('uaxis') || clean.includes('joint3') || clean.includes('axis3') || clean === 'j3' || clean.endsWith('j3')) return 'J3';
  if (clean.includes('laxis') || clean.includes('joint2') || clean.includes('axis2') || clean === 'j2' || clean.endsWith('j2')) return 'J2';
  if (clean.includes('saxis') || clean.includes('joint1') || clean.includes('axis1') || clean === 'j1' || clean.endsWith('j1')) return 'J1';
  if (clean.includes('base') || clean.includes('pedestal')) return 'BASE';
  return null;
}

function isCanonicalAxisName(name: string, role: Exclude<Gp50Role, 'BASE' | null>): boolean {
  const clean = name.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (role === 'J1') return clean === 'saxis';
  if (role === 'J2') return clean === 'laxis';
  if (role === 'J3') return clean === 'uaxis';
  if (role === 'J4') return clean === 'raxis';
  if (role === 'J5') return clean === 'baxis';
  return clean === 'taxis' || clean === 'tlaxis';
}

function chooseRepresentative(nodes: THREE.Object3D[], role: Exclude<Gp50Role, null>): THREE.Object3D | undefined {
  if (!nodes.length) return undefined;
  if (role !== 'BASE') {
    const exact = nodes.find(n => isCanonicalAxisName(n.name, role as Exclude<Gp50Role, 'BASE' | null>));
    if (exact) return exact;
  }
  return [...nodes].sort((a, b) => a.name.length - b.name.length)[0];
}

function collectRoleNodes(scene: THREE.Object3D): Record<Exclude<Gp50Role, null>, THREE.Object3D[]> {
  const groups: Record<Exclude<Gp50Role, null>, THREE.Object3D[]> = {
    BASE: [], J1: [], J2: [], J3: [], J4: [], J5: [], J6: []
  };
  scene.traverse(node => {
    const role = classifyNodeName(node.name);
    if (role) groups[role].push(node);
  });
  return groups;
}

function removeFromParent(node: THREE.Object3D) {
  if (node.parent) node.parent.remove(node);
}

function applyGp50Materials(scene: THREE.Object3D) {
  scene.traverse(node => {
    if (!(node as THREE.Mesh).isMesh) return;
    const mesh = node as THREE.Mesh;
    const role = classifyNodeName(node.name);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    if (role === 'J6') mesh.material = MAT_FLANGE_STEEL;
    else if (role === 'J4' || role === 'J5' || role === 'BASE') mesh.material = MAT_DARK_DRIVE;
    else if (role === 'J1' || role === 'J2' || role === 'J3') mesh.material = MAT_YASKAWA_BLUE;
  });
}

/**
 * Loads the real GP50 CAD assembly. The CAD hierarchy is inspected but is NOT
 * flattened into one mesh; the original node transforms remain available for
 * kinematic binding.
 */
export async function loadGp50CadModel(): Promise<{ scene: THREE.Group; report: Gp50HierarchyReport } | null> {
  if (cachedGltfScene && cachedReport) return { scene: cachedGltfScene, report: cachedReport };
  if (loadPromise) {
    const scene = await loadPromise;
    return scene && cachedReport ? { scene, report: cachedReport } : null;
  }

  loadPromise = (async () => {
    const loader = new GLTFLoader();
    for (const url of ['/models/gp50/GP50.glb', '/models/gp50/gp50.glb', 'models/gp50/GP50.glb', 'models/gp50/gp50.glb']) {
      try {
        const gltf = await new Promise<any>((resolve, reject) => loader.load(url, resolve, undefined, reject));
        if (!gltf?.scene) continue;

        const scene = gltf.scene as THREE.Group;
        const rawBbox = new THREE.Box3().setFromObject(scene);
        const rawSize = rawBbox.getSize(new THREE.Vector3());
        const maxDim = Math.max(rawSize.x, rawSize.y, rawSize.z);
        const detectedScale = maxDim > 0 && maxDim < 10 ? 1000 : 1;
        if (detectedScale !== 1) scene.scale.setScalar(detectedScale);
        scene.updateMatrixWorld(true);

        const bbox = new THREE.Box3().setFromObject(scene);
        const size = bbox.getSize(new THREE.Vector3());
        const nodeList: Gp50HierarchyReport['nodeList'] = [];
        const mapping: Gp50HierarchyReport['mapping'] = {
          base: null, sAxis_J1: null, lAxis_J2: null, uAxis_J3: null,
          rAxis_J4: null, bAxis_J5: null, tlAxis_J6: null
        };

        scene.traverse(node => {
          const role = classifyNodeName(node.name);
          nodeList.push({
            name: node.name,
            type: node.type,
            parentName: node.parent?.name || null,
            position: [node.position.x, node.position.y, node.position.z],
            assignedJoint: role
          });
        });

        const roleNodes = collectRoleNodes(scene);
        mapping.base = chooseRepresentative(roleNodes.BASE, 'BASE')?.name || null;
        mapping.sAxis_J1 = chooseRepresentative(roleNodes.J1, 'J1')?.name || null;
        mapping.lAxis_J2 = chooseRepresentative(roleNodes.J2, 'J2')?.name || null;
        mapping.uAxis_J3 = chooseRepresentative(roleNodes.J3, 'J3')?.name || null;
        mapping.rAxis_J4 = chooseRepresentative(roleNodes.J4, 'J4')?.name || null;
        mapping.bAxis_J5 = chooseRepresentative(roleNodes.J5, 'J5')?.name || null;
        mapping.tlAxis_J6 = chooseRepresentative(roleNodes.J6, 'J6')?.name || null;

        applyGp50Materials(scene);
        cachedReport = {
          loaded: true,
          filePath: url,
          detectedScale,
          boundingBox: {
            min: [bbox.min.x, bbox.min.y, bbox.min.z],
            max: [bbox.max.x, bbox.max.y, bbox.max.z],
            size: [size.x, size.y, size.z]
          },
          nodeList,
          mapping
        };
        cachedGltfScene = scene;
        console.info('[GP50 CAD] Loaded real assembly', mapping);
        return scene;
      } catch (error) {
        console.warn('[GP50 CAD] Load attempt failed:', url, error);
      }
    }
    return null;
  })();

  const scene = await loadPromise;
  return scene && cachedReport ? { scene, report: cachedReport } : null;
}

/**
 * Binds the real CAD parts to the existing kinematic rig without the previous
 * "first matching node + attach()" behavior.
 *
 * Every GP50 axis is represented by a real CAD pivot node. All CAD parts
 * classified for that axis are placed on the corresponding kinematic level,
 * so downstream axes inherit upstream motion.
 */
export function bindGp50CadToKinematicRig(
  rig: RobotArmRig,
  cadScene: THREE.Group,
  hideProceduralMeshes?: () => void
): boolean {
  try {
    cadScene.updateMatrixWorld(true);
    const roleNodes = collectRoleNodes(cadScene);
    const reps = {
      J1: chooseRepresentative(roleNodes.J1, 'J1'),
      J2: chooseRepresentative(roleNodes.J2, 'J2'),
      J3: chooseRepresentative(roleNodes.J3, 'J3'),
      J4: chooseRepresentative(roleNodes.J4, 'J4'),
      J5: chooseRepresentative(roleNodes.J5, 'J5'),
      J6: chooseRepresentative(roleNodes.J6, 'J6'),
    };

    if (!reps.J1 || !reps.J2 || !reps.J3 || !reps.J4 || !reps.J5 || !reps.J6) {
      console.error('[GP50 CAD] Missing one or more real axis pivot nodes', reps);
      return false;
    }

    hideProceduralMeshes?.();

    const [j1, j2, j3, j4, j5, j6] = rig.jointGroups;

    // Use the CAD axis origins as the actual zero-pose joint centers.
    const pivotsWorld = [reps.J1, reps.J2, reps.J3, reps.J4, reps.J5, reps.J6]
      .map(node => node.getWorldPosition(new THREE.Vector3()));

    const base = rig.baseGroup;
    const pBase = pivotsWorld.map(p => base.worldToLocal(p.clone()));

    j1.position.copy(pBase[0]);
    j2.position.copy(j1.worldToLocal(pBase[1].clone()));
    j3.position.copy(j2.worldToLocal(pBase[2].clone()));
    j4.position.copy(j3.worldToLocal(pBase[3].clone()));
    j5.position.copy(j4.worldToLocal(pBase[4].clone()));
    j6.position.copy(j5.worldToLocal(pBase[5].clone()));

    // Preserve the CAD zero orientation as a baseline for each joint. The
    // pose updater multiplies the commanded joint rotation onto this basis.
    const jointBases: THREE.Quaternion[] = [];
    const joints = [j1, j2, j3, j4, j5, j6];
    for (let i = 0; i < joints.length; i++) {
      const worldQ = reps[(['J1','J2','J3','J4','J5','J6'] as const)[i]]!.getWorldQuaternion(new THREE.Quaternion());
      const parent = i === 0 ? base : joints[i - 1];
      parent.updateMatrixWorld(true);
      const parentWorldQ = parent.getWorldQuaternion(new THREE.Quaternion());
      jointBases.push(parentWorldQ.invert().multiply(worldQ));
    }
    // The CAD assembly's zero pose is the visual reference. Wrap the existing
    // kinematic updater so FK/IK remains the source of truth, while the CAD
    // assembly uses the real joint-frame orientation.
    const originalUpdatePose = rig.updatePose;
    rig.updatePose = (...args) => {
      originalUpdatePose(...args);
      const pose: any = args[0];
      let values: number[] | null = null;
      if (Array.isArray(pose) && pose.length === 6) values = pose;
      else if (pose && Array.isArray(pose.jointsDeg)) values = pose.jointsDeg;
      else if (Array.isArray(args[2])) values = args[2];
      if (!values || values.length !== 6) return;

      const axes: THREE.Vector3[] = [
        new THREE.Vector3(0, 0, 1),
        new THREE.Vector3(0, 1, 0),
        new THREE.Vector3(0, 1, 0),
        new THREE.Vector3(0, 0, 1),
        new THREE.Vector3(0, 1, 0),
        new THREE.Vector3(0, 0, 1),
      ];
      const q = new THREE.Quaternion();
      for (let i = 0; i < 6; i++) {
        q.setFromAxisAngle(axes[i], values[i] * Math.PI / 180);
        joints[i].quaternion.copy(jointBases[i]).multiply(q);
      }
      base.updateMatrixWorld(true);
    };

    // The GLB often contains CAD objects as siblings. Move only top-level
    // classified objects so children are not detached twice. World transforms
    // are preserved by Object3D.attach().
    const classified = roleNodes;
    const roleToGroup: Record<Exclude<Gp50Role, null>, THREE.Object3D> = {
      BASE: base, J1: j1, J2: j2, J3: j3, J4: j4, J5: j5, J6: j6
    };

    const alreadyMoved = new Set<THREE.Object3D>();
    (Object.keys(classified) as Array<Exclude<Gp50Role, null>>).forEach(role => {
      for (const node of classified[role]) {
        if (alreadyMoved.has(node)) continue;
        let ancestor = node.parent;
        let ownedBySameRoleAncestor = false;
        while (ancestor && ancestor !== cadScene) {
          if (classifyNodeName(ancestor.name) === role) {
            ownedBySameRoleAncestor = true;
            break;
          }
          ancestor = ancestor.parent;
        }
        if (ownedBySameRoleAncestor) continue;
        // If the node is nested under a different axis assembly, detach it
        // into its own joint group so the downstream axis can move independently.
        roleToGroup[role].attach(node);
        alreadyMoved.add(node);
      }
    });

    // Anything not classified is retained as a rigid part of the base.
    const leftovers: THREE.Object3D[] = [];
    cadScene.traverse(node => {
      if (node === cadScene || alreadyMoved.has(node)) return;
      if (!classifyNodeName(node.name) && (node as THREE.Mesh).isMesh) leftovers.push(node);
    });
    leftovers.forEach(node => base.attach(node));

    cadScene.removeFromParent();
    base.updateMatrixWorld(true);

    console.info('[GP50 CAD] Bound CAD pivots to real GP50 axis centers', {
      pivots: pivotsWorld.map(p => p.toArray()),
      mapping: cachedReport?.mapping
    });
    return true;
  } catch (error) {
    console.error('[GP50 CAD] Failed to bind real CAD hierarchy:', error);
    return false;
  }
}
