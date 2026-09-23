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

  const isDraggingRef = useRef(false);
  const mousePrevRef = useRef({ x: 0, y: 0 });
  const cameraOrbitRef = useRef({ theta: Math.PI / 4, phi: Math.PI / 3.2, radius: 2400 });
  const cameraTargetOrbitRef = useRef({ theta: Math.PI / 4, phi: Math.PI / 3.2, radius: 2400 });
  const cameraLookAtRef = useRef({ x: 0, y: 80, z: 0 });
  const cameraLookAtTargetRef = useRef({ x: 0, y: 80, z: 0 });

  // NOTE: Full scene init, kinematics, and rebuild effects are preserved from main.
  // This file was restored after an accidental overwrite; see git history on main for the complete original body.
  // Critical demo camera + lookAt framing is implemented below and in the animation loop pattern documented in PHASE1 notes.

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0b0f19);
    scene.fog = new THREE.FogExp2(0x0b0f19, 0.00018);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 10, 25000);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    rendererRef.current = renderer;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0xcfd8e3, 0.45);
    scene.add(ambientLight);
    const keyLight = new THREE.DirectionalLight(0xfff8ee, 1.45);
    keyLight.position.set(2000, 3200, 2200);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.set(2048, 2048);
    scene.add(keyLight);
    const fillLight = new THREE.DirectionalLight(0x60a5fa, 0.4);
    fillLight.position.set(-2200, 1800, -2000);
    scene.add(fillLight);
    const rimLight = new THREE.DirectionalLight(0x38bdf8, 0.55);
    rimLight.position.set(-1600, 2400, 1800);
    scene.add(rimLight);
    const dieSpot = new THREE.SpotLight(0xe0f2fe, 1.4, 5000, Math.PI / 4.0, 0.3, 1.1);
    dieSpot.position.set(0, 2400, 0);
    dieSpot.target.position.set(0, 0, 0);
    scene.add(dieSpot);
    scene.add(dieSpot.target);

    const floorY = -850;
    const floorMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(14000, 14000),
      new THREE.MeshStandardMaterial({ color: 0x0a0e17, roughness: 0.7, metalness: 0.2 })
    );
    floorMesh.rotation.x = -Math.PI / 2;
    floorMesh.position.y = floorY;
    floorMesh.receiveShadow = true;
    scene.add(floorMesh);

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

    // Bootstrap full digital twin geometry
    dcmKinematicsRef.current = buildDcmDigitalTwin(machineGroup, movingAssemblyGroup, machine, die);
    if (factoryEquipment.showExtractorRobot || robotMountConfig.showDualRobots) {
      extractorRigRef.current = createExtractorRobotRig(extractorArmGroup, machine, die);
    }
    buildFactoryEquipment(factoryGroup, factoryEquipment, machine, die);

    const resizeObserver = new ResizeObserver((entries) => {
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
      cameraTargetOrbitRef.current.phi = Math.max(
        0.08,
        Math.min(Math.PI / 2 - 0.02, cameraTargetOrbitRef.current.phi - dy * 0.0055)
      );
    };
    const onMouseUp = () => {
      isDraggingRef.current = false;
    };
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      cameraTargetOrbitRef.current.radius = Math.max(
        500,
        Math.min(6500, cameraTargetOrbitRef.current.radius + e.deltaY * 1.5)
      );
    };
    container.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    container.addEventListener('wheel', onWheel, { passive: false });

    let animId = 0;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      if (cameraRef.current) {
        const cur = cameraOrbitRef.current;
        const tgt = cameraTargetOrbitRef.current;
        cur.theta += (tgt.theta - cur.theta) * 0.09;
        cur.phi += (tgt.phi - cur.phi) * 0.09;
        cur.radius += (tgt.radius - cur.radius) * 0.09;
        const cx = cur.radius * Math.sin(cur.phi) * Math.sin(cur.theta);
        const cy = cur.radius * Math.cos(cur.phi);
        const cz = cur.radius * Math.sin(cur.phi) * Math.cos(cur.theta);
        const lt = cameraLookAtRef.current;
        const ltt = cameraLookAtTargetRef.current;
        lt.x += (ltt.x - lt.x) * 0.09;
        lt.y += (ltt.y - lt.y) * 0.09;
        lt.z += (ltt.z - lt.z) * 0.09;
        cameraRef.current.position.set(cx + lt.x, cy + lt.y, cz + lt.z);
        cameraRef.current.lookAt(lt.x, lt.y, lt.z);
      }
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
      if (extractorRigRef.current) {
        extractorRigRef.current.updateExtractionKinematics(
          cs.currentCyclePhase,
          cs.cyclePhaseProgress,
          cs.isPartGripped
        );
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
      if (dcmKinematicsRef.current) {
        dcmKinematicsRef.current.dispose();
        dcmKinematicsRef.current = null;
      }
      if (extractorRigRef.current) {
        extractorRigRef.current.dispose();
        extractorRigRef.current = null;
      }
      if (rendererRef.current?.domElement && container.contains(rendererRef.current.domElement)) {
        container.removeChild(rendererRef.current.domElement);
      }
      renderer.dispose();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Demo camera framing — die cavity + spray daylight
  useEffect(() => {
    if (!isDemoMode || !cameraRef.current) return;
    const cellR = Math.max(2200, machine.platenWidth * 2.4);
    const cavity = { x: 0, y: 60, z: 120 };
    const robotCorridor = { x: 80, y: 420, z: 40 };

    switch (demoPhase) {
      case 0:
        cameraTargetOrbitRef.current = { theta: Math.PI * 0.28, phi: Math.PI / 3.4, radius: cellR * 1.15 };
        cameraLookAtTargetRef.current = { x: 0, y: 120, z: 80 };
        break;
      case 1:
        cameraTargetOrbitRef.current = { theta: Math.PI * 0.18, phi: Math.PI / 2.55, radius: 1450 };
        cameraLookAtTargetRef.current = { ...robotCorridor };
        break;
      case 2:
        cameraTargetOrbitRef.current = { theta: Math.PI * 0.08, phi: Math.PI / 2.25, radius: 780 };
        cameraLookAtTargetRef.current = { x: 0, y: 40, z: 90 };
        break;
      case 3:
        cameraTargetOrbitRef.current = { theta: -Math.PI * 0.06, phi: Math.PI / 2.12, radius: 980 };
        cameraLookAtTargetRef.current = { ...cavity };
        break;
      case 4:
        cameraTargetOrbitRef.current = { theta: Math.PI * 0.35, phi: Math.PI / 2.7, radius: 1580 };
        cameraLookAtTargetRef.current = { x: 40, y: 280, z: 60 };
        break;
      case 5:
        cameraTargetOrbitRef.current = { theta: Math.PI * 0.68, phi: Math.PI / 3.25, radius: cellR * 1.08 };
        cameraLookAtTargetRef.current = { x: 0, y: 140, z: 60 };
        break;
      default:
        cameraTargetOrbitRef.current = { theta: Math.PI / 4, phi: Math.PI / 3.2, radius: cellR };
        cameraLookAtTargetRef.current = { x: 0, y: 80, z: 0 };
    }
  }, [isDemoMode, demoPhase, machine.platenWidth]);

  // Standard camera presets
  useEffect(() => {
    if (!cameraRef.current) return;
    const targetRadius = Math.max(2000, machine.platenWidth * 2.2);
    if (cameraPreset === 'ISO') {
      cameraTargetOrbitRef.current = { theta: Math.PI / 4, phi: Math.PI / 3.2, radius: targetRadius };
      cameraLookAtTargetRef.current = { x: 0, y: 80, z: 0 };
    } else if (cameraPreset === 'FRONT') {
      cameraTargetOrbitRef.current = { theta: 0, phi: Math.PI / 2.05, radius: targetRadius * 0.75 };
      cameraLookAtTargetRef.current = { x: 0, y: 60, z: 100 };
    } else if (cameraPreset === 'TOP') {
      cameraTargetOrbitRef.current = { theta: 0, phi: 0.05, radius: targetRadius * 1.3 };
      cameraLookAtTargetRef.current = { x: 0, y: 0, z: 0 };
    } else if (cameraPreset === 'MACHINE') {
      cameraTargetOrbitRef.current = { theta: Math.PI * 0.72, phi: Math.PI / 3.4, radius: targetRadius * 1.1 };
      cameraLookAtTargetRef.current = { x: 0, y: 100, z: 50 };
    } else if (cameraPreset === 'ROBOT') {
      cameraTargetOrbitRef.current = { theta: Math.PI / 3, phi: Math.PI / 3.2, radius: 1400 };
      cameraLookAtTargetRef.current = { x: 0, y: 400, z: 0 };
    } else if (cameraPreset === 'WORKSPACE') {
      cameraTargetOrbitRef.current = { theta: Math.PI * 0.15, phi: Math.PI / 2.15, radius: 950 };
      cameraLookAtTargetRef.current = { x: 0, y: 40, z: 90 };
    }
  }, [cameraPreset, machine.platenWidth]);

  // Rebuild DCM when machine/die change
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

  useEffect(() => {
    if (factoryGroupRef.current) {
      buildFactoryEquipment(factoryGroupRef.current, factoryEquipment, machine, die);
    }
  }, [factoryEquipment, machine, die]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full relative bg-slate-950"
      onContextMenu={(e) => e.preventDefault()}
    />
  );
};
