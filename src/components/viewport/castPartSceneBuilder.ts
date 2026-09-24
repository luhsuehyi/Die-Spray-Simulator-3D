/**
 * 3D Visualization Builder for Cast Part, Grip Candidates, and Automated Cell Peripherals
 */

import * as THREE from 'three';
import { CastPartModel, GripCandidate } from '../../types/castPart';

const AL_CAST_MAT = new THREE.MeshStandardMaterial({
  color: 0xc8d1dc, // Industrial A380/ADC12 cast aluminum
  metalness: 0.85,
  roughness: 0.28
});

const RUNNER_MAT = new THREE.MeshStandardMaterial({
  color: 0x94a3b8,
  metalness: 0.9,
  roughness: 0.35
});

const GASKET_FACE_MAT = new THREE.MeshStandardMaterial({
  color: 0xe2e8f0,
  metalness: 0.92,
  roughness: 0.18
});

/**
 * Builds realistic 3D representation of the active cast part inside the die daylight
 */
export function buildCastPartMesh(
  group: THREE.Group,
  part: CastPartModel,
  daylightCenterZ: number,
  selectedGripId?: string
) {
  while (group.children.length > 0) {
    group.remove(group.children[0]);
  }

  const dim = part.dimensions;
  const partCenterZ = daylightCenterZ;

  const partRoot = new THREE.Group();
  partRoot.position.set(0, 0, partCenterZ);
  group.add(partRoot);

  // 1. Render geometry based on specific visual mesh archetype
  switch (part.visualMeshType) {
    case 'transmission_case': {
      // Main deep housing shell
      const mainShell = new THREE.Mesh(
        new THREE.BoxGeometry(dim.lengthMm * 0.85, dim.widthMm * 0.75, dim.heightMm * 0.8),
        AL_CAST_MAT
      );
      mainShell.castShadow = true;
      mainShell.receiveShadow = true;
      partRoot.add(mainShell);

      // Planetary Gear Cavity Recess
      const gearCav = new THREE.Mesh(
        new THREE.CylinderGeometry(130, 110, dim.heightMm * 0.9, 32),
        AL_CAST_MAT
      );
      gearCav.rotation.x = Math.PI / 2;
      gearCav.position.set(-60, 20, 0);
      partRoot.add(gearCav);

      // Precision Gasket Sealing Rim
      const gasketRim = new THREE.Mesh(
        new THREE.BoxGeometry(dim.lengthMm * 0.95, dim.widthMm * 0.88, 16),
        GASKET_FACE_MAT
      );
      gasketRim.position.set(0, 0, dim.heightMm * 0.4);
      partRoot.add(gasketRim);

      // Shaft Bearing Boss
      const boss = new THREE.Mesh(
        new THREE.CylinderGeometry(65, 75, 80, 24),
        AL_CAST_MAT
      );
      boss.rotation.x = Math.PI / 2;
      boss.position.set(110, -40, 20);
      partRoot.add(boss);

      // Reinforcement Stiffening Ribs
      [-50, 0, 50].forEach(rx => {
        const rib = new THREE.Mesh(new THREE.BoxGeometry(12, 140, 30), AL_CAST_MAT);
        rib.position.set(rx, -110, -15);
        partRoot.add(rib);
      });

      // Sacrificial Runner Biscuit Hub & Ingate Chutes
      const biscuit = new THREE.Mesh(
        new THREE.CylinderGeometry(55, 60, 75, 24),
        RUNNER_MAT
      );
      biscuit.rotation.x = Math.PI / 2;
      biscuit.position.set(0, -240, -10);
      partRoot.add(biscuit);

      // Dual Ingate Runner Arms
      [-70, 70].forEach(ix => {
        const ingate = new THREE.Mesh(new THREE.BoxGeometry(45, 120, 24), RUNNER_MAT);
        ingate.rotation.z = ix > 0 ? 0.35 : -0.35;
        ingate.position.set(ix * 0.6, -180, -10);
        partRoot.add(ingate);
      });
      break;
    }

    case 'ev_motor_casing': {
      // Cylindrical Stator Outer Shell
      const outerCyl = new THREE.Mesh(
        new THREE.CylinderGeometry(dim.lengthMm * 0.45, dim.lengthMm * 0.45, dim.heightMm * 0.85, 36),
        AL_CAST_MAT
      );
      outerCyl.rotation.x = Math.PI / 2;
      outerCyl.castShadow = true;
      partRoot.add(outerCyl);

      // Precision Stator Inner Bore Hole
      const innerBore = new THREE.Mesh(
        new THREE.CylinderGeometry(145, 145, dim.heightMm * 0.9, 32),
        GASKET_FACE_MAT
      );
      innerBore.rotation.x = Math.PI / 2;
      partRoot.add(innerBore);

      // Central Bearing Hub
      const centerHub = new THREE.Mesh(
        new THREE.CylinderGeometry(45, 45, 60, 24),
        AL_CAST_MAT
      );
      centerHub.rotation.x = Math.PI / 2;
      centerHub.position.set(0, 0, 45);
      partRoot.add(centerHub);

      // 12 Peripheral Inverter Mounting Flange Lugs
      for (let i = 0; i < 12; i++) {
        const angle = (i / 12) * Math.PI * 2;
        const lx = Math.cos(angle) * (dim.lengthMm * 0.46);
        const ly = Math.sin(angle) * (dim.lengthMm * 0.46);
        const lug = new THREE.Mesh(new THREE.CylinderGeometry(18, 18, 22, 12), AL_CAST_MAT);
        lug.rotation.x = Math.PI / 2;
        lug.position.set(lx, ly, dim.heightMm * 0.35);
        partRoot.add(lug);
      }

      // Center Sprued Runner Biscuit
      const biscuit = new THREE.Mesh(
        new THREE.CylinderGeometry(45, 50, 70, 20),
        RUNNER_MAT
      );
      biscuit.rotation.x = Math.PI / 2;
      biscuit.position.set(0, -180, -20);
      partRoot.add(biscuit);
      break;
    }

    case 'shock_tower': {
      // Main Structural Suspension Dome
      const dome = new THREE.Mesh(
        new THREE.SphereGeometry(130, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.65),
        AL_CAST_MAT
      );
      dome.rotation.x = -Math.PI / 2;
      dome.position.set(0, 60, -40);
      dome.castShadow = true;
      partRoot.add(dome);

      // Longitudinal Rail Mounting Flanges
      const railPad = new THREE.Mesh(
        new THREE.BoxGeometry(260, 180, 28),
        AL_CAST_MAT
      );
      railPad.position.set(-140, -110, -10);
      partRoot.add(railPad);

      // Stiffener Web Network
      [-90, 0, 90].forEach(wx => {
        const web = new THREE.Mesh(new THREE.BoxGeometry(10, 220, 70), AL_CAST_MAT);
        web.position.set(wx, 0, -20);
        partRoot.add(web);
      });

      // Heavy Biscuit Tree
      const biscuit = new THREE.Mesh(
        new THREE.CylinderGeometry(60, 65, 90, 24),
        RUNNER_MAT
      );
      biscuit.rotation.x = Math.PI / 2;
      biscuit.position.set(0, -260, -25);
      partRoot.add(biscuit);
      break;
    }

    case 'heatsink_enclosure': {
      // Base Planar Plate
      const basePlate = new THREE.Mesh(
        new THREE.BoxGeometry(dim.lengthMm * 0.9, dim.widthMm * 0.85, 25),
        AL_CAST_MAT
      );
      basePlate.castShadow = true;
      partRoot.add(basePlate);

      // Pin-Fin Matrix (Realistic cluster of pin fins)
      const finGroup = new THREE.Group();
      const finGeo = new THREE.CylinderGeometry(3.5, 4.5, 48, 8);
      finGeo.rotateX(Math.PI / 2);
      for (let x = -150; x <= 150; x += 30) {
        for (let y = -120; y <= 120; y += 30) {
          const pin = new THREE.Mesh(finGeo, AL_CAST_MAT);
          pin.position.set(x, y, -32);
          finGroup.add(pin);
        }
      }
      partRoot.add(finGroup);

      // Side Fan-Gate Biscuit
      const biscuit = new THREE.Mesh(
        new THREE.BoxGeometry(110, 40, 55),
        RUNNER_MAT
      );
      biscuit.position.set(0, -190, -10);
      partRoot.add(biscuit);
      break;
    }

    case 'generic_hpdc': {
      // Parametric representative geometry for the sample library.
      // It is intentionally generic: dimensions and feature metadata remain the source of truth.
      const body = new THREE.Mesh(
        new THREE.BoxGeometry(dim.lengthMm * 0.86, dim.widthMm * 0.82, dim.heightMm * 0.72),
        AL_CAST_MAT
      );
      body.castShadow = true;
      body.receiveShadow = true;
      partRoot.add(body);

      const topFace = new THREE.Mesh(
        new THREE.BoxGeometry(dim.lengthMm * 0.92, dim.widthMm * 0.88, Math.max(10, dim.heightMm * 0.08)),
        GASKET_FACE_MAT
      );
      topFace.position.z = dim.heightMm * 0.34;
      partRoot.add(topFace);

      part.features.forEach(feature => {
        const [fx, fy, fz] = feature.position;
        const [fw, fh, fd] = feature.dimensions;

        if (feature.category === 'boss') {
          const boss = new THREE.Mesh(
            new THREE.CylinderGeometry(Math.max(10, Math.min(fw, fh) * 0.42), Math.max(12, Math.min(fw, fh) * 0.48), Math.max(15, fd), 20),
            AL_CAST_MAT
          );
          boss.rotation.x = Math.PI / 2;
          boss.position.set(fx, fy, fz);
          partRoot.add(boss);
        } else if (feature.category === 'rib') {
          const rib = new THREE.Mesh(
            new THREE.BoxGeometry(Math.max(8, fw), Math.max(8, fh), Math.max(8, fd * 0.55)),
            AL_CAST_MAT
          );
          rib.position.set(fx, fy, fz);
          partRoot.add(rib);
        } else if (feature.category === 'deep_pocket') {
          const pocket = new THREE.Mesh(
            new THREE.BoxGeometry(Math.max(20, fw * 0.72), Math.max(20, fh * 0.72), Math.max(10, Math.min(fd, dim.heightMm * 0.55))),
            new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.7, roughness: 0.4 })
          );
          pocket.position.set(fx, fy, fz - Math.max(5, fd * 0.18));
          partRoot.add(pocket);
        } else if (feature.category === 'through_hole') {
          const hole = new THREE.Mesh(
            new THREE.CylinderGeometry(Math.max(8, Math.min(fw, fh) * 0.38), Math.max(8, Math.min(fw, fh) * 0.38), Math.max(20, fd), 20),
            new THREE.MeshStandardMaterial({ color: 0x111827, metalness: 0.3, roughness: 0.8 })
          );
          hole.rotation.x = Math.PI / 2;
          hole.position.set(fx, fy, fz);
          partRoot.add(hole);
        } else if (feature.category === 'planar_surface') {
          const face = new THREE.Mesh(
            new THREE.BoxGeometry(Math.max(20, fw), Math.max(20, fh), Math.max(8, fd * 0.35)),
            GASKET_FACE_MAT
          );
          face.position.set(fx, fy, fz);
          partRoot.add(face);
        }
      });

      // Generic sacrificial runner/biscuit is always visible when the preset declares one.
      const runner = part.features.find(f => f.category === 'runner_biscuit');
      if (runner) {
        const [rx, ry, rz] = runner.position;
        const [rw, rh, rd] = runner.dimensions;
        const biscuit = new THREE.Mesh(
          new THREE.BoxGeometry(Math.max(25, rw), Math.max(20, rh), Math.max(20, rd)),
          RUNNER_MAT
        );
        biscuit.position.set(rx, ry, rz);
        biscuit.castShadow = true;
        partRoot.add(biscuit);
      }
      break;
    }

    case 'battery_tray': {
      // Large Planar Floor Tray
      const trayFloor = new THREE.Mesh(
        new THREE.BoxGeometry(dim.lengthMm * 0.85, dim.widthMm * 0.85, 20),
        AL_CAST_MAT
      );
      trayFloor.castShadow = true;
      partRoot.add(trayFloor);

      // Perimeter Crash Structure Frames
      const crashFrame = new THREE.Mesh(
        new THREE.BoxGeometry(dim.lengthMm * 0.92, dim.widthMm * 0.92, 45),
        AL_CAST_MAT
      );
      crashFrame.position.set(0, 0, 15);
      partRoot.add(crashFrame);

      // Battery Cell Bay Separator Ribs
      [-220, 0, 220].forEach(sx => {
        const sep = new THREE.Mesh(new THREE.BoxGeometry(16, dim.widthMm * 0.8, 35), AL_CAST_MAT);
        sep.position.set(sx, 0, 15);
        partRoot.add(sep);
      });

      // Dual Biscuit Hubs
      const biscuit = new THREE.Mesh(
        new THREE.BoxGeometry(220, 60, 80),
        RUNNER_MAT
      );
      biscuit.position.set(0, -360, -15);
      partRoot.add(biscuit);
      break;
    }

    default: {
      // Default Automotive Steering Knuckle / General Casting
      const mainBody = new THREE.Mesh(
        new THREE.BoxGeometry(dim.lengthMm * 0.75, dim.widthMm * 0.75, dim.heightMm * 0.7),
        AL_CAST_MAT
      );
      mainBody.castShadow = true;
      partRoot.add(mainBody);

      const hub = new THREE.Mesh(
        new THREE.CylinderGeometry(70, 70, 85, 24),
        AL_CAST_MAT
      );
      hub.rotation.x = Math.PI / 2;
      partRoot.add(hub);

      const biscuit = new THREE.Mesh(
        new THREE.CylinderGeometry(50, 55, 65, 20),
        RUNNER_MAT
      );
      biscuit.rotation.x = Math.PI / 2;
      biscuit.position.set(0, -140, -15);
      partRoot.add(biscuit);
      break;
    }
  }

  // 2. Render 3D Interactive Grip Candidate Markers
  part.gripCandidates.forEach(cand => {
    const isSelected = cand.id === selectedGripId;
    const [gx, gy, gz] = cand.location;

    const candGroup = new THREE.Group();
    candGroup.position.set(gx, gy, gz);
    partRoot.add(candGroup);

    // Color code based on status:
    // RECOMMENDED = Emerald Green (0x10b981)
    // ACCEPTABLE = Amber Yellow (0xf59e0b)
    // NOT_RECOMMENDED = Rose Red (0xf43f5e)
    let markerColor = 0x10b981;
    if (cand.status === 'ACCEPTABLE') markerColor = 0xf59e0b;
    if (cand.status === 'NOT_RECOMMENDED') markerColor = 0xf43f5e;

    // Glowing Target Sphere
    const sphereGeo = new THREE.SphereGeometry(isSelected ? 26 : 18, 16, 16);
    const sphereMat = new THREE.MeshStandardMaterial({
      color: markerColor,
      emissive: markerColor,
      emissiveIntensity: isSelected ? 0.9 : 0.4,
      roughness: 0.2
    });
    const sphereMesh = new THREE.Mesh(sphereGeo, sphereMat);
    candGroup.add(sphereMesh);

    // Pulsing Outer Ring for Selected Candidate
    if (isSelected) {
      const ringGeo = new THREE.RingGeometry(32, 38, 32);
      const ringMat = new THREE.MeshBasicMaterial({
        color: markerColor,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.8
      });
      const ringMesh = new THREE.Mesh(ringGeo, ringMat);
      candGroup.add(ringMesh);
    }

    // Approach Direction Arrow Indicator
    const [ax, ay, az] = cand.approachDirection;
    const arrowDir = new THREE.Vector3(ax, ay, az).normalize();
    const arrowLen = 65;
    const arrow = new THREE.ArrowHelper(arrowDir, new THREE.Vector3(0, 0, 0), arrowLen, markerColor, 20, 12);
    candGroup.add(arrow);
  });
}
