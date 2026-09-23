import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { useSimulationStore } from '../../store/simulationStore';
import { forwardKinematics } from '../../utils/kinematics';
import { GP50_CAD_STATUS_EVENT, Gp50CadStatus } from '../../utils/gp50CadLoader';
import {
  buildToyoMachine,
  buildDcmDigitalTwin,
  DcmKinematicsHandle,
  createExtractorRobotRig,
  ExtractorRobotRig,
  buildFactoryEquipment,
  buildRobotMountStructure,
  createRobotArmRig,
  RobotArmRig,
  MAT
} from './cellSceneBuilder';
import { buildCastPartMesh } from './castPartSceneBuilder';

interface MistSeed {
  t: number;
  angle: number;
  speed: number;
  radiusFrac: number;
}

export const SimulationCanvas: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const store = useSimulationStore();

  // Visible status for the GP50 CAD asset (there is deliberately no procedural fallback robot)
  const [cadStatus, setCadStatus] = useState<{ status: Gp50CadStatus; message?: string }>({ status: 'ready' });
  useEffect(() => {
    const onStatus = (e: Event) => setCadStatus((e as CustomEvent).detail);
    window.addEventListener(GP50_CAD_STATUS_EVENT, onStatus);
    return () => window.removeEventListener(GP50_CAD_STATUS_EVENT, onStatus);
  }, []);
  const {
    machine,
    die,
    robot,
    tool,
    robotMountConfig,
    factoryEquipment,
    cameraPreset,
    waypoints,
    selectedWaypointId,
    activeWaypointIndex,
    currentRobotPose,
    viewMode,
    showHeatmap,
    heatmapMetric,
    showTieBars,
    showSprayCone,
    surfaceCells,
    isDemoMode,
    demoPhase,

    // Digital Twin Synchronized Cycle State
    cycleConfig,
    currentCyclePhase,
    cyclePhaseProgress,
    totalCycleProgress,
    platenOpenPercent,
    ejectorStrokeMm,
    injectionFillPercent,
    isSprayerInDaylight,
    isExtractorInDaylight,
    isPartGripped
  } = store;

  // Scene references
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const machineGroupRef = useRef<THREE.Group | null>(null);
  const movingAssemblyGroupRef = useRef<THREE.Group | null>(null);
  const dcmKinematicsRef = useRef<DcmKinematicsHandle | null>(null);
  const factoryGroupRef = useRef<THREE.Group | null>(null);
  const dieMeshGroupRef = useRef<THREE.Group | null>(null);
  const robotGroupRef = useRef<THREE.Group | null>(null);
  const robotMountGroupRef = useRef<THREE.Group | null>(null);
  const robotArmGroupRef = useRef<THREE.Group | null>(null);
  const armRigRef = useRef<RobotArmRig | null>(null);
  const extractorArmGroupRef = useRef<THREE.Group | null>(null);
  const extractorRigRef = useRef<ExtractorRobotRig | null>(null);
  const castPartGroupRef = useRef<THREE.Group | null>(null);
  const sprayConeRef = useRef<THREE.Mesh | null>(null);
  const mistParticlesRef = useRef<THREE.Points | null>(null);
  const waypointsGroupRef = useRef<THREE.Group | null>(null);

  // Directional spray tracking
  const currentSprayDirRef = useRef<THREE.Vector3>(new THREE.Vector3(0, 0, -1));
  const currentTcpPosRef = useRef<THREE.Vector3>(new THREE.Vector3(0, 0, 0));
  const mistSeedsRef = useRef<MistSeed[]>([]);
  const activeWorldNozzlesRef = useRef<Array<{
    worldPos: THREE.Vector3;
    worldDir: THREE.Vector3;
    uVec: THREE.Vector3;
    vVec: THREE.Vector3;
    coneLength: number;
    coneRadius: number;
  }>>([]);

  // Ref tracking latest cycle state for 60FPS render loop
  const cycleStateRef = useRef({
    currentCyclePhase,
    cyclePhaseProgress,
    platenOpenPercent,
    platenOpenDistanceMm: cycleConfig.platenOpenDistanceMm || 650,
    ejectorStrokeMm,
    injectionFillPercent,
    isSprayerInDaylight,
    isExtractorInDaylight,
    isPartGripped
  });

  useEffect(() => {
    cycleStateRef.current = {
      currentCyclePhase,
      cyclePhaseProgress,
      platenOpenPercent,
      platenOpenDistanceMm: cycleConfig.platenOpenDistanceMm || 650,
      ejectorStrokeMm,
      injectionFillPercent,
      isSprayerInDaylight,
      isExtractorInDaylight,
      isPartGripped
    };
  }, [
    currentCyclePhase,
    cyclePhaseProgress,
    platenOpenPercent,
    cycleConfig.platenOpenDistanceMm,
    ejectorStrokeMm,
    injectionFillPercent,
    isSprayerInDaylight,
    isExtractorInDaylight,
    isPartGripped
  ]);

  // Smooth camera orbit state with damping
  const isDraggingRef = useRef(false);
  const mousePrevRef = useRef({ x: 0, y: 0 });
  const cameraOrbitRef = useRef({ theta: Math.PI / 4, phi: Math.PI / 3.2, radius: 2400 });
  const cameraTargetOrbitRef = useRef({ theta: Math.PI / 4, phi: Math.PI / 3.2, radius: 2400 });

  // 1. Scene Initialization
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0b0f19); // Crisp deep industrial slate
    scene.fog = new THREE.FogExp2(0x0b0f19, 0.00018);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 10, 25000);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance'
    });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    rendererRef.current = renderer;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // Balanced High-Bay Industrial Lighting Rig
    const ambientLight = new THREE.AmbientLight(0xcfd8e3, 0.45);
    scene.add(ambientLight);

    // Primary High-Bay Key Light with crisp contact shadow
    const keyLight = new THREE.DirectionalLight(0xfff8ee, 1.45);
    keyLight.position.set(2000, 3200, 2200);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 2048;
    keyLight.shadow.mapSize.height = 2048;
    keyLight.shadow.camera.near = 100;
    keyLight.shadow.camera.far = 9000;
    keyLight.shadow.bias = -0.0007;
    const d = 2800;
    keyLight.shadow.camera.left = -d;
    keyLight.shadow.camera.right = d;
    keyLight.shadow.camera.top = d;
    keyLight.shadow.camera.bottom = -d;
    scene.add(keyLight);

    // Cool High-Bay Fill Light
    const fillLight = new THREE.DirectionalLight(0x60a5fa, 0.4);
    fillLight.position.set(-2200, 1800, -2000);
    scene.add(fillLight);

    // Cyan Rim / Silhouette Light to cleanly separate robot and machine from background
    const rimLight = new THREE.DirectionalLight(0x38bdf8, 0.55);
    rimLight.position.set(-1600, 2400, 1800);
    scene.add(rimLight);

    // Die Platen Daylight Inspection Spotlight
    const dieSpot = new THREE.SpotLight(0xe0f2fe, 1.4, 5000, Math.PI / 4.0, 0.3, 1.1);
    dieSpot.position.set(0, 2400, 0);
    dieSpot.target.position.set(0, 0, 0);
    scene.add(dieSpot);
    scene.add(dieSpot.target);

    // Contact Shadow Receiver Floor (Realistic epoxy factory coating with soft sheen)
    const floorY = -850;
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x0a0e17,
      roughness: 0.7,
      metalness: 0.2
    });
    const floorMesh = new THREE.Mesh(new THREE.PlaneGeometry(14000, 14000), floorMat);
    floorMesh.rotation.x = -Math.PI / 2;
    floorMesh.position.y = floorY;
    floorMesh.receiveShadow = true;
    scene.add(floorMesh);

    // Dual-Tone Precision Workshop Grid (Subtle and non-distracting)
    const mainGrid = new THREE.GridHelper(8000, 80, 0x1e293b, 0x111827);
    mainGrid.position.y = floorY + 1;
    scene.add(mainGrid);

    const subGrid = new THREE.GridHelper(2400, 48, 0x334155, 0x1e293b);
    subGrid.position.y = floorY + 2;
    scene.add(subGrid);

    // Structural Scene Groups
    const machineGroup = new THREE.Group();
    machineGroupRef.current = machineGroup;
    scene.add(machineGroup);

    const movingAssemblyGroup = new THREE.Group();
    movingAssemblyGroupRef.current = movingAssemblyGroup;
    scene.add(movingAssemblyGroup);

    const extractorArmGroup = new THREE.Group();
    extractorArmGroupRef.current = extractorArmGroup;
    scene.add(extractorArmGroup);

    const factoryGroup = new THREE.Group();
    factoryGroupRef.current = factoryGroup;
    scene.add(factoryGroup);

    const dieMeshGroup = new THREE.Group();
    dieMeshGroupRef.current = dieMeshGroup;
    scene.add(dieMeshGroup);

    const castPartGroup = new THREE.Group();
    castPartGroupRef.current = castPartGroup;
    scene.add(castPartGroup);

    const robotGroup = new THREE.Group();
    robotGroupRef.current = robotGroup;
    scene.add(robotGroup);

    const mountGroup = new THREE.Group();
    robotMountGroupRef.current = mountGroup;
    robotGroup.add(mountGroup);

    const armGroup = new THREE.Group();
    robotArmGroupRef.current = armGroup;
    robotGroup.add(armGroup);

    const waypointsGroup = new THREE.Group();
    waypointsGroupRef.current = waypointsGroup;
    scene.add(waypointsGroup);

    // Spray Cone Geometry: Apex at (0, 0, 0), expanding along +Z to length 260
    const coneRadius = 85;
    const coneLength = 260;
    const coneGeo = new THREE.ConeGeometry(coneRadius, coneLength, 28, 1, true);
    coneGeo.translate(0, -coneLength / 2, 0);
    coneGeo.rotateX(-Math.PI / 2);

    const coneMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.35,
      side: THREE.DoubleSide,
      depthWrite: false
    });
    const sprayCone = new THREE.Mesh(coneGeo, coneMat);
    sprayCone.visible = false;
    sprayConeRef.current = sprayCone;
    scene.add(sprayCone);

    // Directional Mist Particles streaming from TCP along spray cone
    const particleCount = 240;
    const partGeo = new THREE.BufferGeometry();
    const partPos = new Float32Array(particleCount * 3);
    const seeds: MistSeed[] = [];
    for (let i = 0; i < particleCount; i++) {
      seeds.push({
        t: Math.random(),
        angle: Math.random() * Math.PI * 2,
        speed: 0.02 + Math.random() * 0.03,
        radiusFrac: Math.sqrt(Math.random())
      });
      partPos[i * 3] = 0;
      partPos[i * 3 + 1] = 0;
      partPos[i * 3 + 2] = 0;
    }
    mistSeedsRef.current = seeds;
    partGeo.setAttribute('position', new THREE.BufferAttribute(partPos, 3));

    const partMat = new THREE.PointsMaterial({
      color: 0xbae6fd,
      size: 4.5,
      transparent: true,
      opacity: 0.7,
      depthWrite: false
    });
    const mistParticles = new THREE.Points(partGeo, partMat);
    mistParticles.visible = false;
    mistParticlesRef.current = mistParticles;
    scene.add(mistParticles);

    // Resize Observer
    const resizeObserver = new ResizeObserver(entries => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0 && cameraRef.current && rendererRef.current) {
          cameraRef.current.aspect = width / height;
          cameraRef.current.updateProjectionMatrix();
          rendererRef.current.setSize(width, height);
        }
      }
    });
    resizeObserver.observe(container);

    // Mouse Controls
    const onMouseDown = (e: MouseEvent) => {
      if (e.button === 0 || e.button === 2) {
        isDraggingRef.current = true;
        mousePrevRef.current = { x: e.clientX, y: e.clientY };
      }
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current) return;
      const dx = e.clientX - mousePrevRef.current.x;
      const dy = e.clientY - mousePrevRef.current.y;
      mousePrevRef.current = { x: e.clientX, y: e.clientY };

      cameraTargetOrbitRef.current.theta -= dx * 0.0055;
      cameraTargetOrbitRef.current.phi = Math.max(0.08, Math.min(Math.PI / 2 - 0.02, cameraTargetOrbitRef.current.phi - dy * 0.0055));
    };

    const onMouseUp = () => {
      isDraggingRef.current = false;
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      cameraTargetOrbitRef.current.radius = Math.max(500, Math.min(6500, cameraTargetOrbitRef.current.radius + e.deltaY * 1.5));
    };

    container.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    container.addEventListener('wheel', onWheel, { passive: false });

    // Pre-allocated vectors for particle updates
    const uVec = new THREE.Vector3();
    const vVec = new THREE.Vector3();
    const upRef = new THREE.Vector3(0, 1, 0);

    // Animation & Render Loop
    let animId: number;
    const animate = () => {
      animId = requestAnimationFrame(animate);

      // Smooth Camera Transitions via Exponential Lerp Damping
      if (cameraRef.current) {
        const cur = cameraOrbitRef.current;
        const tgt = cameraTargetOrbitRef.current;
        cur.theta += (tgt.theta - cur.theta) * 0.09;
        cur.phi += (tgt.phi - cur.phi) * 0.09;
        cur.radius += (tgt.radius - cur.radius) * 0.09;

        const cx = cur.radius * Math.sin(cur.phi) * Math.sin(cur.theta);
        const cy = cur.radius * Math.cos(cur.phi);
        const cz = cur.radius * Math.sin(cur.phi) * Math.cos(cur.theta);
        cameraRef.current.position.set(cx, cy, cz);
        cameraRef.current.lookAt(0, 100, 0);
      }

      // Update DCM Digital Twin Kinematics (Moving platen Z, tie bars, ejector pins, molten cavity fill, shot sleeve plunger)
      const cs = cycleStateRef.current;
      if (dcmKinematicsRef.current) {
        dcmKinematicsRef.current.updateKinematics(
          cs.platenOpenPercent,
          cs.platenOpenDistanceMm,
          cs.ejectorStrokeMm,
          cs.injectionFillPercent,
          cs.currentCyclePhase
        );
      }

      // Update Extractor Floor Robot Kinematics (coordinated entry, part gripping, extraction, quench drop)
      if (extractorRigRef.current) {
        extractorRigRef.current.updateExtractionKinematics(
          cs.currentCyclePhase,
          cs.cyclePhaseProgress,
          cs.isPartGripped
        );
      }

      // Directional Spray Particles Animation across active EOAT manifold nozzles
      if (mistParticlesRef.current && mistParticlesRef.current.visible) {
        const positions = mistParticlesRef.current.geometry.attributes.position.array as Float32Array;
        const seedsList = mistSeedsRef.current;
        const nozzles = activeWorldNozzlesRef.current;

        if (nozzles && nozzles.length > 0) {
          for (let i = 0; i < seedsList.length; i++) {
            const s = seedsList[i];
            s.t = (s.t + s.speed) % 1.0;

            const nz = nozzles[i % nozzles.length];
            const dist = s.t * nz.coneLength;
            const spread = s.t * nz.coneRadius * s.radiusFrac;
            const cosA = Math.cos(s.angle);
            const sinA = Math.sin(s.angle);

            positions[i * 3] = nz.worldPos.x + nz.worldDir.x * dist + (nz.uVec.x * cosA + nz.vVec.x * sinA) * spread;
            positions[i * 3 + 1] = nz.worldPos.y + nz.worldDir.y * dist + (nz.uVec.y * cosA + nz.vVec.y * sinA) * spread;
            positions[i * 3 + 2] = nz.worldPos.z + nz.worldDir.z * dist + (nz.uVec.z * cosA + nz.vVec.z * sinA) * spread;
          }
        } else {
          const tcp = currentTcpPosRef.current;
          const dir = currentSprayDirRef.current;

          if (Math.abs(dir.y) > 0.95) {
            upRef.set(1, 0, 0);
          } else {
            upRef.set(0, 1, 0);
          }
          uVec.crossVectors(dir, upRef).normalize();
          vVec.crossVectors(dir, uVec).normalize();

          for (let i = 0; i < seedsList.length; i++) {
            const s = seedsList[i];
            s.t = (s.t + s.speed) % 1.0;

            const dist = s.t * coneLength;
            const spread = s.t * coneRadius * s.radiusFrac;
            const cosA = Math.cos(s.angle);
            const sinA = Math.sin(s.angle);

            positions[i * 3] = tcp.x + dir.x * dist + (uVec.x * cosA + vVec.x * sinA) * spread;
            positions[i * 3 + 1] = tcp.y + dir.y * dist + (uVec.y * cosA + vVec.y * sinA) * spread;
            positions[i * 3 + 2] = tcp.z + dir.z * dist + (uVec.z * cosA + vVec.z * sinA) * spread;
          }
        }
        mistParticlesRef.current.geometry.attributes.position.needsUpdate = true;
      }

      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    };
    animate();

    return () => {
      cancelAnimationFrame(animId);
      resizeObserver.disconnect();
      container.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      container.removeEventListener('wheel', onWheel);
      if (armRigRef.current) {
        armRigRef.current.dispose();
        armRigRef.current = null;
      }
      if (rendererRef.current?.domElement && container.contains(rendererRef.current.domElement)) {
        container.removeChild(rendererRef.current.domElement);
      }
      renderer.dispose();
    };
  }, []);

  // 2. Camera Preset Views (Glides smoothly into view)
  useEffect(() => {
    if (!cameraRef.current) return;
    const targetRadius = Math.max(2000, machine.platenWidth * 2.2);
    if (cameraPreset === 'ISO') {
      cameraTargetOrbitRef.current = { theta: Math.PI / 4, phi: Math.PI / 3.2, radius: targetRadius };
    } else if (cameraPreset === 'FRONT') {
      cameraTargetOrbitRef.current = { theta: 0, phi: Math.PI / 2.05, radius: targetRadius * 0.75 };
    } else if (cameraPreset === 'TOP') {
      cameraTargetOrbitRef.current = { theta: 0, phi: 0.05, radius: targetRadius * 1.3 };
    } else if (cameraPreset === 'MACHINE') {
      cameraTargetOrbitRef.current = { theta: Math.PI * 0.72, phi: Math.PI / 3.4, radius: targetRadius * 1.1 };
    } else if (cameraPreset === 'ROBOT') {
      cameraTargetOrbitRef.current = { theta: Math.PI / 3, phi: Math.PI / 3.2, radius: 1400 };
    } else if (cameraPreset === 'WORKSPACE') {
      cameraTargetOrbitRef.current = { theta: Math.PI * 0.15, phi: Math.PI / 2.15, radius: 950 };
    }
  }, [cameraPreset, machine.platenWidth]);

  // Demo Presentation Mode: Smooth Cinematic Camera Shots
  useEffect(() => {
    if (!isDemoMode || !cameraRef.current) return;
    const targetRadius = Math.max(2000, machine.platenWidth * 2.2);
    switch (demoPhase) {
      case 0: // 1. Full-cell establishing shot
        cameraTargetOrbitRef.current = { theta: Math.PI / 3.8, phi: Math.PI / 3.1, radius: targetRadius * 1.35 };
        break;
      case 1: // 2. Robot approach
        cameraTargetOrbitRef.current = { theta: Math.PI / 3.2, phi: Math.PI / 2.8, radius: 1550 };
        break;
      case 2: // 3. Close-up of spray process
        cameraTargetOrbitRef.current = { theta: Math.PI * 0.12, phi: Math.PI / 2.15, radius: 900 };
        break;
      case 3: // 4. Die / part coverage view
        cameraTargetOrbitRef.current = { theta: -0.05, phi: Math.PI / 2.08, radius: 1180 };
        break;
      case 4: // 5. Robot retract
        cameraTargetOrbitRef.current = { theta: Math.PI * 0.42, phi: Math.PI / 2.9, radius: 1650 };
        break;
      case 5: // 6. Final full-cell shot
        cameraTargetOrbitRef.current = { theta: Math.PI * 0.72, phi: Math.PI / 3.4, radius: targetRadius * 1.2 };
        break;
    }
  }, [isDemoMode, demoPhase, machine.platenWidth]);

  // Backward compatibility view mode
  useEffect(() => {
    if (!cameraRef.current) return;
    if (viewMode === 'top') {
      cameraTargetOrbitRef.current = { theta: 0, phi: 0.05, radius: 2500 };
    } else if (viewMode === 'side') {
      cameraTargetOrbitRef.current = { theta: Math.PI / 2, phi: Math.PI / 2, radius: 2300 };
    } else if (viewMode === 'front') {
      cameraTargetOrbitRef.current = { theta: 0, phi: Math.PI / 2, radius: 2300 };
    }
  }, [viewMode]);

  // 3. Rebuild DCM Digital Twin Machine Model (Only on machine or die changes)
  useEffect(() => {
    if (machineGroupRef.current && movingAssemblyGroupRef.current) {
      if (dcmKinematicsRef.current) {
        dcmKinematicsRef.current.dispose();
        dcmKinematicsRef.current = null;
      }
      dcmKinematicsRef.current = buildDcmDigitalTwin(
        machineGroupRef.current,
        movingAssemblyGroupRef.current,
        machine,
        die
      );
    }
  }, [machine, die]);

  // 3B. Rebuild Extractor Floor Robot (Robot B)
  useEffect(() => {
    const extractorGroup = extractorArmGroupRef.current;
    if (!extractorGroup) return;

    if (extractorRigRef.current) {
      extractorRigRef.current.dispose();
      extractorRigRef.current = null;
    }

    if (factoryEquipment.showExtractorRobot || robotMountConfig.showDualRobots) {
      extractorRigRef.current = createExtractorRobotRig(extractorGroup, machine, die);
    }
  }, [factoryEquipment.showExtractorRobot, robotMountConfig.showDualRobots, machine, die]);

  // 4. Rebuild Factory Automation Equipment
  useEffect(() => {
    if (factoryGroupRef.current) {
      buildFactoryEquipment(factoryGroupRef.current, factoryEquipment, machine, die);
    }
  }, [factoryEquipment, machine, die]);

  // 5. Render Die Cavity Geometry & Thermal Hot Spots
  useEffect(() => {
    const group = dieMeshGroupRef.current;
    if (!group) return;

    while (group.children.length > 0) {
      group.remove(group.children[0]);
    }

    // Deep Recessed Mold Cavity Pockets (Dark Electrical Discharge Machining / EDM Texture)
    die.features.forEach(feat => {
      const [fx, fy] = feat.position;
      const [fw, fh, fd] = feat.dimensions;

      // Fixed die cavity pocket
      const fGeom = new THREE.BoxGeometry(fw, fh, fd * 0.7);
      const fMesh = new THREE.Mesh(fGeom, MAT.cavityDarkEDM);
      fMesh.position.set(fx, fy, die.fixedDieOffsetZ - fd * 0.35);
      fMesh.castShadow = true;
      group.add(fMesh);

      // Movable die cavity pocket
      const mMesh = new THREE.Mesh(fGeom, MAT.cavityDarkEDM);
      mMesh.position.set(fx, fy, die.movableDieOffsetZ + fd * 0.35);
      mMesh.castShadow = true;
      group.add(mMesh);

      // Runner gate transition bevel
      const runnerBevel = new THREE.Mesh(new THREE.BoxGeometry(fw * 0.35, 18, 12), MAT.copper);
      runnerBevel.position.set(fx, fy - fh * 0.45, die.fixedDieOffsetZ - 4);
      group.add(runnerBevel);
    });

    // Thermal Hot Spot Discs
    store.hotSpots.forEach(hs => {
      if (!hs.extraCoolingRequired) return;
      const [hx, hy] = hs.location;
      const spotColor = hs.thermalPriority === 'VERY HOT' ? 0xf43f5e : hs.thermalPriority === 'HOT' ? 0xf59e0b : 0x06b6d4;
      const spotMat = new THREE.MeshStandardMaterial({
        color: spotColor,
        emissive: spotColor,
        emissiveIntensity: 0.75,
        roughness: 0.25
      });

      const spotDisc = new THREE.Mesh(new THREE.CylinderGeometry(35, 35, 6, 24), spotMat);
      spotDisc.rotation.x = Math.PI / 2;
      spotDisc.position.set(hx, hy, die.fixedDieOffsetZ + 2);
      group.add(spotDisc);

      const spotDiscM = new THREE.Mesh(new THREE.CylinderGeometry(35, 35, 6, 24), spotMat);
      spotDiscM.rotation.x = Math.PI / 2;
      spotDiscM.position.set(hx, hy, die.movableDieOffsetZ - 2);
      group.add(spotDiscM);
    });

    // Heatmap Surface Points
    if (showHeatmap && surfaceCells.length > 0) {
      const cellPointsGeo = new THREE.BufferGeometry();
      const positions = new Float32Array(surfaceCells.length * 3);
      const colors = new Float32Array(surfaceCells.length * 3);

      surfaceCells.forEach((c, idx) => {
        positions[idx * 3] = c.x;
        positions[idx * 3 + 1] = c.y;
        positions[idx * 3 + 2] = c.z;

        let r = 0, g = 0, b = 0;
        if (heatmapMetric === 'thickness') {
          const ratio = Math.min(1.5, c.currentThickness / (c.targetThickness || 25));
          if (ratio < 0.2) {
            r = 0.1; g = 0.2; b = 0.9;
          } else if (ratio < 0.8) {
            r = 0.1; g = 0.8; b = 0.8;
          } else if (ratio <= 1.2) {
            r = 0.1; g = 0.95; b = 0.2;
          } else {
            r = 0.95; g = 0.2; b = 0.1;
          }
        } else {
          const tRatio = Math.max(0, Math.min(1, (c.temperature - 120) / (320 - 120)));
          r = tRatio;
          g = Math.sin(tRatio * Math.PI);
          b = 1 - tRatio;
        }

        colors[idx * 3] = r;
        colors[idx * 3 + 1] = g;
        colors[idx * 3 + 2] = b;
      });

      cellPointsGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      cellPointsGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

      const heatMapPoints = new THREE.Points(
        cellPointsGeo,
        new THREE.PointsMaterial({
          size: 16,
          vertexColors: true,
          transparent: true,
          opacity: 0.85
        })
      );
      group.add(heatMapPoints);
    }
  }, [die.id, showHeatmap, heatmapMetric, surfaceCells]);

  // 5.5 Update 3D Cast Part Mesh & Grip Candidates
  useEffect(() => {
    const group = castPartGroupRef.current;
    if (!group) return;
    if (!store.activeCastPart) {
      while (group.children.length > 0) {
        group.remove(group.children[0]);
      }
      return;
    }
    const daylightCenterZ = (die.fixedDieOffsetZ + die.movableDieOffsetZ) / 2;
    buildCastPartMesh(group, store.activeCastPart, daylightCenterZ, store.selectedGripCandidateId);
  }, [store.activeCastPart, store.selectedGripCandidateId, die.fixedDieOffsetZ, die.movableDieOffsetZ]);

  // 6A. Rebuild Robot Static Mount & Persist Arm Rig Geometry ONCE
  // (Only rebuilt on robot model, tool type, or mounting change)
  useEffect(() => {
    const mountGroup = robotMountGroupRef.current;
    const armGroup = robotArmGroupRef.current;
    if (!mountGroup || !armGroup) return;

    // Perform forward kinematics to determine authoritative base anchor position
    const fk = forwardKinematics(currentRobotPose.jointAnglesDeg, robot, tool, robotMountConfig);

    // Build static pedestal / gantry / deck firmly anchored to machine frame at base position
    buildRobotMountStructure(mountGroup, robotMountConfig, robot, machine, fk.jointPositions.base);

    // Recreate persistent 60FPS RobotArmRig with authoritative kinematic hierarchy
    if (armRigRef.current) {
      armRigRef.current.dispose();
      armRigRef.current = null;
    }
    armRigRef.current = createRobotArmRig(armGroup, robot, tool, robotMountConfig);
    armRigRef.current.updatePose(currentRobotPose.jointAnglesDeg, fk.tcpMatrix);
  }, [robot, tool, robotMountConfig, machine]);

  // 6B. Zero-Allocation Fast 60FPS Robot Pose & Spray Cone Orientation Update
  useEffect(() => {
    const fk = forwardKinematics(currentRobotPose.jointAnglesDeg, robot, tool, robotMountConfig);
    const { tcp } = fk.jointPositions;

    // 1. Update persistent robot arm transforms (Zero allocations)
    if (armRigRef.current) {
      armRigRef.current.updatePose(currentRobotPose.jointAnglesDeg, fk.tcpMatrix);
    }

    // 2. Active Spray Cone & Mist Orientation
    const activeWp = waypoints[activeWaypointIndex];
    const isSpraying = !!(
      currentCyclePhase === '04_SPRAY_LUBE' &&
      isSprayerInDaylight &&
      activeWp &&
      (activeWp.action === 'LUBE_SPRAY' || activeWp.action === 'AIR_BLOW' || activeWp.action === 'LUBE_AND_AIR')
    );

    // Trigger EOAT manifold multi-nozzle spray plumes directly on the robot rig
    armRigRef.current?.updateSprayEmission?.({
      isSpraying,
      action: activeWp ? activeWp.action : 'WAIT',
      targetFace: activeWp ? activeWp.targetFace : 'BOTH',
      flowRateMlPerSec: activeWp?.flowRateMlPerSec,
      showSprayCone
    });

    if (mistParticlesRef.current) {
      if (isSpraying && showSprayCone && activeWp) {
        mistParticlesRef.current.visible = true;

        const targetFace = activeWp.targetFace;
        const rawNozzles = tool.nozzles || tool.eoatSpec?.nozzles || [];

        // Compute rotation matrix from TCP matrix or default
        const m = fk.tcpMatrix && fk.tcpMatrix.length === 16 ? fk.tcpMatrix : null;
        const rotMat = m ? new THREE.Matrix4().fromArray(m) : new THREE.Matrix4().makeRotationFromEuler(
          new THREE.Euler(
            (currentRobotPose.tcpEulerDeg[0] || 0) * (Math.PI / 180),
            (currentRobotPose.tcpEulerDeg[1] || 0) * (Math.PI / 180),
            (currentRobotPose.tcpEulerDeg[2] || 0) * (Math.PI / 180),
            'ZYX'
          )
        );

        // Filter nozzles for current target face
        const eligible = rawNozzles.filter(nz => {
          if (activeWp.action === 'AIR_BLOW' && nz.type === 'lube') return false;
          if (activeWp.action === 'LUBE_SPRAY' && nz.type === 'air') return false;
          return true;
        });

        const faceMatched = eligible.filter(nz => {
          if (targetFace === 'FIXED_DIE') return nz.directionVector[2] < 0;
          if (targetFace === 'MOVABLE_DIE') return nz.directionVector[2] > 0;
          return true;
        });

        const nozzlesToUse = faceMatched.length > 0 ? faceMatched : eligible;

        const worldNozzles: Array<{
          worldPos: THREE.Vector3;
          worldDir: THREE.Vector3;
          uVec: THREE.Vector3;
          vVec: THREE.Vector3;
          coneLength: number;
          coneRadius: number;
        }> = [];

        const isMicro = tool.eoatType === 'MICRO_DOSING' || tool.sprayHeadType === 'MICRO_DOSING';
        const defaultLen = isMicro ? 150 : 230;

        if (nozzlesToUse.length > 0) {
          const rotOnly = new THREE.Matrix3().setFromMatrix4(rotMat);
          nozzlesToUse.forEach(nz => {
            const localPos = new THREE.Vector3(nz.offsetMm[0], nz.offsetMm[1], nz.offsetMm[2]);
            const worldPos = localPos.applyMatrix4(rotMat).add(new THREE.Vector3(tcp[0], tcp[1], tcp[2]));

            const localDir = new THREE.Vector3(nz.directionVector[0], nz.directionVector[1], nz.directionVector[2]).normalize();
            const worldDir = localDir.applyMatrix3(rotOnly).normalize();

            const halfAngleRad = ((nz.sprayAngleDeg || 60) / 2) * (Math.PI / 180);
            const cLen = defaultLen;
            const cRad = Math.max(15, Math.tan(halfAngleRad) * cLen);

            const up = Math.abs(worldDir.y) > 0.95 ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(0, 1, 0);
            const u = new THREE.Vector3().crossVectors(worldDir, up).normalize();
            const v = new THREE.Vector3().crossVectors(worldDir, u).normalize();

            worldNozzles.push({
              worldPos,
              worldDir,
              uVec: u,
              vVec: v,
              coneLength: cLen,
              coneRadius: cRad
            });
          });
        }

        // Fallback if no manifold nozzles
        if (worldNozzles.length === 0) {
          let sprayDir = new THREE.Vector3(0, 0, targetFace === 'MOVABLE_DIE' ? 1 : -1);
          if (m) {
            sprayDir.set(m[2], m[6], m[10]);
            if (targetFace === 'FIXED_DIE' && sprayDir.z > 0) sprayDir.negate();
            if (targetFace === 'MOVABLE_DIE' && sprayDir.z < 0) sprayDir.negate();
          }
          sprayDir.normalize();

          const up = Math.abs(sprayDir.y) > 0.95 ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(0, 1, 0);
          const u = new THREE.Vector3().crossVectors(sprayDir, up).normalize();
          const v = new THREE.Vector3().crossVectors(sprayDir, u).normalize();

          worldNozzles.push({
            worldPos: new THREE.Vector3(tcp[0], tcp[1], tcp[2]),
            worldDir: sprayDir,
            uVec: u,
            vVec: v,
            coneLength: 260,
            coneRadius: 90
          });
        }

        activeWorldNozzlesRef.current = worldNozzles;
        currentTcpPosRef.current.set(tcp[0], tcp[1], tcp[2]);
        if (worldNozzles.length > 0) {
          currentSprayDirRef.current.copy(worldNozzles[0].worldDir);
        }

        // Mist particle color
        const partMat = mistParticlesRef.current.material as THREE.PointsMaterial;
        if (activeWp.action === 'AIR_BLOW') {
          partMat.color.setHex(0xf0f9ff);
          partMat.size = 3.5;
        } else if (isMicro) {
          partMat.color.setHex(0x38bdf8);
          partMat.size = 2.8;
        } else {
          partMat.color.setHex(0x7dd3fc);
          partMat.size = 4.5;
        }

        // Standalone central spray cone only visible if arm rig has no built-in plumes
        if (sprayConeRef.current) {
          if (!armRigRef.current?.sprayEmitterGroup) {
            sprayConeRef.current.visible = true;
            sprayConeRef.current.position.set(tcp[0], tcp[1], tcp[2]);
            const targetLook = new THREE.Vector3(
              tcp[0] + worldNozzles[0].worldDir.x * 260,
              tcp[1] + worldNozzles[0].worldDir.y * 260,
              tcp[2] + worldNozzles[0].worldDir.z * 260
            );
            sprayConeRef.current.lookAt(targetLook);
          } else {
            sprayConeRef.current.visible = false;
          }
        }
      } else {
        mistParticlesRef.current.visible = false;
        activeWorldNozzlesRef.current = [];
        if (sprayConeRef.current) {
          sprayConeRef.current.visible = false;
        }
      }
    }
  }, [
    currentRobotPose,
    robot,
    tool,
    robotMountConfig,
    activeWaypointIndex,
    showSprayCone,
    waypoints
  ]);

  // 7. Update Trajectory Ribbon & Waypoint Markers
  // Distinguishes spray (cyan), air-blow (ice white), transit (amber dashed), and active TCP path (emerald)
  useEffect(() => {
    const group = waypointsGroupRef.current;
    if (!group) return;

    while (group.children.length > 0) {
      group.remove(group.children[0]);
    }

    if (waypoints.length > 1) {
      // Draw professional segmented trajectory paths
      for (let i = 0; i < waypoints.length - 1; i++) {
        const wpA = waypoints[i];
        const wpB = waypoints[i + 1];
        const isCurrentSegment = i === activeWaypointIndex - 1;

        const pA = new THREE.Vector3(wpA.x, wpA.y, wpA.z);
        const pB = new THREE.Vector3(wpB.x, wpB.y, wpB.z);

        const curve = new THREE.CatmullRomCurve3([pA, pB]);
        const pts = curve.getPoints(16);
        const lineGeo = new THREE.BufferGeometry().setFromPoints(pts);

        let lineMat: THREE.LineBasicMaterial | THREE.LineDashedMaterial;

        if (isCurrentSegment) {
          // Highlight active TCP transit segment with vibrant emerald
          lineMat = new THREE.LineBasicMaterial({
            color: 0x10b981,
            linewidth: 3,
            transparent: true,
            opacity: 0.95
          });
        } else if (wpB.action === 'LUBE_SPRAY' || wpB.action === 'LUBE_AND_AIR') {
          // Spray segment: Solid vivid electric cyan
          lineMat = new THREE.LineBasicMaterial({
            color: 0x0284c7,
            linewidth: 2,
            transparent: true,
            opacity: 0.9
          });
        } else if (wpB.action === 'AIR_BLOW') {
          // Air-blow segment: Arctic icy sky-blue
          lineMat = new THREE.LineDashedMaterial({
            color: 0x7dd3fc,
            linewidth: 2,
            dashSize: 18,
            gapSize: 10,
            transparent: true,
            opacity: 0.85
          });
        } else {
          // Transit segment: Industrial amber dashed
          lineMat = new THREE.LineDashedMaterial({
            color: 0xf59e0b,
            linewidth: 1,
            dashSize: 16,
            gapSize: 12,
            transparent: true,
            opacity: 0.75
          });
        }

        const segmentLine = new THREE.Line(lineGeo, lineMat);
        if ('computeLineDistances' in segmentLine) {
          segmentLine.computeLineDistances();
        }
        group.add(segmentLine);
      }
    }

    // Render Waypoint Markers
    waypoints.forEach((wp, idx) => {
      const isSelected = wp.id === selectedWaypointId;
      const isActive = idx === activeWaypointIndex;

      let wpColor = 0x64748b; // Transit default
      if (wp.action === 'LUBE_SPRAY' || wp.action === 'LUBE_AND_AIR') {
        wpColor = 0x0284c7; // Spray cyan
      } else if (wp.action === 'AIR_BLOW') {
        wpColor = 0x38bdf8; // Air sky blue
      }

      if (isActive) wpColor = 0x10b981; // Active vibrant emerald
      if (isSelected) wpColor = 0xf59e0b; // Selected golden amber

      const size = isActive ? 24 : isSelected ? 22 : 16;
      const sphereGeo = new THREE.SphereGeometry(size, 18, 18);
      const sphereMat = new THREE.MeshStandardMaterial({
        color: wpColor,
        emissive: isActive ? 0x10b981 : isSelected ? 0xf59e0b : 0x000000,
        emissiveIntensity: isActive || isSelected ? 0.75 : 0.0,
        metalness: 0.7,
        roughness: 0.3
      });
      const sphere = new THREE.Mesh(sphereGeo, sphereMat);
      sphere.position.set(wp.x, wp.y, wp.z);
      sphere.userData = { waypointId: wp.id };
      group.add(sphere);

      // Active Target Waypoint Indicator Ring
      if (isActive) {
        const ringGeo = new THREE.RingGeometry(size * 1.4, size * 1.8, 24);
        const ringMat = new THREE.MeshBasicMaterial({
          color: 0x34d399,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.8
        });
        const ringMesh = new THREE.Mesh(ringGeo, ringMat);
        ringMesh.position.set(wp.x, wp.y, wp.z);
        ringMesh.rotation.x = Math.PI / 2;
        group.add(ringMesh);

        // Direction indicator arrow towards target face
        const arrowDir = wp.targetFace === 'MOVABLE_DIE' ? new THREE.Vector3(0, 0, 1) : new THREE.Vector3(0, 0, -1);
        const arrowHelper = new THREE.ArrowHelper(arrowDir, new THREE.Vector3(wp.x, wp.y, wp.z), 90, 0x10b981, 28, 16);
        group.add(arrowHelper);
      }

      // Selected Waypoint Golden Focus Ring
      if (isSelected && !isActive) {
        const selRing = new THREE.Mesh(
          new THREE.RingGeometry(size * 1.35, size * 1.65, 24),
          new THREE.MeshBasicMaterial({ color: 0xfbbf24, side: THREE.DoubleSide, transparent: true, opacity: 0.7 })
        );
        selRing.position.set(wp.x, wp.y, wp.z);
        selRing.rotation.x = Math.PI / 2;
        group.add(selRing);
      }
    });
  }, [waypoints, selectedWaypointId, activeWaypointIndex]);

  return (
    <div
      ref={containerRef}
      id="simulation-3d-canvas-container"
      className="relative w-full h-full cursor-grab active:cursor-grabbing select-none overflow-hidden"
    >
      {store.robot.id === 'yaskawa-gp50' && cadStatus.status !== 'ready' && (
        <div
          className={`absolute left-3 top-3 z-20 max-w-[520px] rounded-md px-3 py-2 text-xs font-mono pointer-events-none ${
            cadStatus.status === 'failed' ? 'bg-red-700/90 text-white' : 'bg-slate-800/80 text-slate-100'
          }`}
        >
          {cadStatus.status === 'failed'
            ? `GP50 CAD model failed to load — no substitute robot is drawn. ${cadStatus.message ?? ''}`
            : 'Loading Yaskawa GP50 CAD model…'}
        </div>
      )}
    </div>
  );
};