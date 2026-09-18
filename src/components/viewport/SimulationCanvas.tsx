import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { useSimulationStore } from '../../store/simulationStore';
import { forwardKinematics } from '../../utils/kinematics';
import {
  buildToyoMachine,
  buildFactoryEquipment,
  buildRealisticRobotArm
} from './cellSceneBuilder';
import { buildCastPartMesh } from './castPartSceneBuilder';

export const SimulationCanvas: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const store = useSimulationStore();
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
    surfaceCells
  } = store;

  // Scene references for updates
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const machineGroupRef = useRef<THREE.Group | null>(null);
  const factoryGroupRef = useRef<THREE.Group | null>(null);
  const dieMeshGroupRef = useRef<THREE.Group | null>(null);
  const robotGroupRef = useRef<THREE.Group | null>(null);
  const castPartGroupRef = useRef<THREE.Group | null>(null);
  const sprayConeRef = useRef<THREE.Mesh | null>(null);
  const mistParticlesRef = useRef<THREE.Points | null>(null);
  const waypointsGroupRef = useRef<THREE.Group | null>(null);

  // Mouse orbit state
  const isDraggingRef = useRef(false);
  const mousePrevRef = useRef({ x: 0, y: 0 });
  const cameraOrbitRef = useRef({ theta: Math.PI / 4, phi: Math.PI / 3.2, radius: 2400 });

  // 1. Scene Initialization
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0e131f); // Dark industrial slate
    scene.fog = new THREE.FogExp2(0x0e131f, 0.00025);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 10, 20000);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // Industrial Lighting Setup
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xfff5ea, 1.4);
    dirLight1.position.set(1600, 2600, 1800);
    dirLight1.castShadow = true;
    dirLight1.shadow.mapSize.width = 2048;
    dirLight1.shadow.mapSize.height = 2048;
    dirLight1.shadow.camera.near = 100;
    dirLight1.shadow.camera.far = 8000;
    const d = 2600;
    dirLight1.shadow.camera.left = -d;
    dirLight1.shadow.camera.right = d;
    dirLight1.shadow.camera.top = d;
    dirLight1.shadow.camera.bottom = -d;
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0x88bbff, 0.7);
    dirLight2.position.set(-1800, -1000, -1500);
    scene.add(dirLight2);

    // Workshop Grid Floor
    const grid = new THREE.GridHelper(8000, 80, 0x334155, 0x1e293b);
    grid.position.y = -850;
    scene.add(grid);

    // Major 3D Groups
    const machineGroup = new THREE.Group();
    machineGroupRef.current = machineGroup;
    scene.add(machineGroup);

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

    const waypointsGroup = new THREE.Group();
    waypointsGroupRef.current = waypointsGroup;
    scene.add(waypointsGroup);

    // Spray Cone & Mist
    const coneGeo = new THREE.ConeGeometry(80, 240, 24, 1, true);
    coneGeo.rotateX(-Math.PI / 2);
    coneGeo.translate(0, 0, 120);
    const coneMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.4,
      side: THREE.DoubleSide,
      depthWrite: false
    });
    const sprayCone = new THREE.Mesh(coneGeo, coneMat);
    sprayConeRef.current = sprayCone;
    scene.add(sprayCone);

    // Mist Particles
    const particleCount = 200;
    const partGeo = new THREE.BufferGeometry();
    const partPos = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount * 3; i++) {
      partPos[i] = (Math.random() - 0.5) * 80;
    }
    partGeo.setAttribute('position', new THREE.BufferAttribute(partPos, 3));
    const partMat = new THREE.PointsMaterial({
      color: 0xbae6fd,
      size: 4.5,
      transparent: true,
      opacity: 0.6
    });
    const mistParticles = new THREE.Points(partGeo, partMat);
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

    // Mouse Interaction
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

      cameraOrbitRef.current.theta -= dx * 0.005;
      cameraOrbitRef.current.phi = Math.max(0.08, Math.min(Math.PI - 0.08, cameraOrbitRef.current.phi - dy * 0.005));
    };

    const onMouseUp = () => {
      isDraggingRef.current = false;
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      cameraOrbitRef.current.radius = Math.max(500, Math.min(6500, cameraOrbitRef.current.radius + e.deltaY * 1.5));
    };

    container.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    container.addEventListener('wheel', onWheel, { passive: false });

    // Render Loop
    let animId: number;
    const animate = () => {
      animId = requestAnimationFrame(animate);

      if (cameraRef.current) {
        const { theta, phi, radius } = cameraOrbitRef.current;
        const cx = radius * Math.sin(phi) * Math.sin(theta);
        const cy = radius * Math.cos(phi);
        const cz = radius * Math.sin(phi) * Math.cos(theta);
        cameraRef.current.position.set(cx, cy, cz);
        cameraRef.current.lookAt(0, 0, 0);
      }

      if (mistParticlesRef.current && mistParticlesRef.current.visible) {
        const positions = mistParticlesRef.current.geometry.attributes.position.array as Float32Array;
        for (let i = 0; i < positions.length; i += 3) {
          positions[i] += (Math.random() - 0.5) * 3.5;
          positions[i + 1] += (Math.random() - 0.5) * 3.5;
          positions[i + 2] += (Math.random() - 0.5) * 3.5;
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
      if (rendererRef.current?.domElement && container.contains(rendererRef.current.domElement)) {
        container.removeChild(rendererRef.current.domElement);
      }
      renderer.dispose();
    };
  }, []);

  // 2. Camera Preset Views
  useEffect(() => {
    if (!cameraRef.current) return;
    const targetRadius = Math.max(2000, machine.platenWidth * 2.2);
    if (cameraPreset === 'ISO') {
      cameraOrbitRef.current = { theta: Math.PI / 4, phi: Math.PI / 3.2, radius: targetRadius };
    } else if (cameraPreset === 'FRONT') {
      cameraOrbitRef.current = { theta: 0, phi: Math.PI / 2.05, radius: targetRadius * 0.75 };
    } else if (cameraPreset === 'TOP') {
      cameraOrbitRef.current = { theta: 0, phi: 0.05, radius: targetRadius * 1.3 };
    } else if (cameraPreset === 'MACHINE') {
      cameraOrbitRef.current = { theta: Math.PI * 0.72, phi: Math.PI / 3.4, radius: targetRadius * 1.1 };
    } else if (cameraPreset === 'ROBOT') {
      cameraOrbitRef.current = { theta: Math.PI / 3, phi: Math.PI / 3.2, radius: 1400 };
    } else if (cameraPreset === 'WORKSPACE') {
      cameraOrbitRef.current = { theta: Math.PI * 0.15, phi: Math.PI / 2.15, radius: 950 };
    }
  }, [cameraPreset, machine.platenWidth]);

  // Backward compatibility view mode
  useEffect(() => {
    if (!cameraRef.current) return;
    if (viewMode === 'top') {
      cameraOrbitRef.current = { theta: 0, phi: 0.05, radius: 2500 };
    } else if (viewMode === 'side') {
      cameraOrbitRef.current = { theta: Math.PI / 2, phi: Math.PI / 2, radius: 2300 };
    } else if (viewMode === 'front') {
      cameraOrbitRef.current = { theta: 0, phi: Math.PI / 2, radius: 2300 };
    }
  }, [viewMode]);

  // 3. Rebuild Toyo DCM Machine Model
  useEffect(() => {
    if (machineGroupRef.current) {
      buildToyoMachine(machineGroupRef.current, machine, die);
    }
  }, [machine, die]);

  // 4. Rebuild Taiwanese Factory Automation Equipment
  useEffect(() => {
    if (factoryGroupRef.current) {
      buildFactoryEquipment(factoryGroupRef.current, factoryEquipment, machine, die);
    }
  }, [factoryEquipment, machine, die]);

  // 5. Render Die Cavity Geometry & Heatmap Surface
  useEffect(() => {
    const group = dieMeshGroupRef.current;
    if (!group) return;

    while (group.children.length > 0) {
      group.remove(group.children[0]);
    }

    const { width, height, depth } = die.dimensions;
    const steelMat = new THREE.MeshStandardMaterial({
      color: 0x475569,
      metalness: 0.85,
      roughness: 0.25
    });

    // Fixed Die Block
    const fixedDieBlock = new THREE.Mesh(
      new THREE.BoxGeometry(width, height, depth),
      steelMat
    );
    fixedDieBlock.position.set(0, 0, die.fixedDieOffsetZ - depth / 2);
    fixedDieBlock.castShadow = true;
    fixedDieBlock.receiveShadow = true;
    group.add(fixedDieBlock);

    // Movable Die Block
    const movableDieBlock = new THREE.Mesh(
      new THREE.BoxGeometry(width, height, depth),
      steelMat
    );
    movableDieBlock.position.set(0, 0, die.movableDieOffsetZ + depth / 2);
    movableDieBlock.castShadow = true;
    movableDieBlock.receiveShadow = true;
    group.add(movableDieBlock);

    // Cavity Pockets & Features
    const cavityMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      metalness: 0.9,
      roughness: 0.2
    });

    die.features.forEach(feat => {
      const [fx, fy] = feat.position;
      const [fw, fh, fd] = feat.dimensions;

      const fGeom = new THREE.BoxGeometry(fw, fh, fd * 0.7);
      const fMesh = new THREE.Mesh(fGeom, cavityMat);
      fMesh.position.set(fx, fy, die.fixedDieOffsetZ - fd * 0.35);
      group.add(fMesh);

      const mMesh = new THREE.Mesh(fGeom, cavityMat);
      mMesh.position.set(fx, fy, die.movableDieOffsetZ + fd * 0.35);
      group.add(mMesh);
    });

    // Thermal Hot Spot Discs
    store.hotSpots.forEach(hs => {
      if (!hs.extraCoolingRequired) return;
      const [hx, hy] = hs.location;
      const spotColor = hs.thermalPriority === 'VERY HOT' ? 0xf43f5e : hs.thermalPriority === 'HOT' ? 0xf59e0b : 0x06b6d4;
      const spotMat = new THREE.MeshStandardMaterial({
        color: spotColor,
        emissive: spotColor,
        emissiveIntensity: 0.7,
        roughness: 0.3
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
          const tRatio = Math.max(0, Math.min(1, (c.temperature - 180) / 140));
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

  // 5.5 Update 3D Cast Part Mesh & Grip Candidates in Daylight
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

  // 6. Update Robot 3D Position, RoboDK-Style Geometry, and Spraying Mist
  useEffect(() => {
    const group = robotGroupRef.current;
    if (!group) return;

    const fk = forwardKinematics(currentRobotPose.jointAnglesDeg, robot, tool, robotMountConfig);
    const { tcp } = fk.jointPositions;

    buildRealisticRobotArm(
      group,
      robot,
      fk.jointPositions,
      tool,
      robotMountConfig,
      machine
    );

    // Active Spray Cone & Mist Orientation
    if (sprayConeRef.current && mistParticlesRef.current) {
      const activeWp = waypoints[activeWaypointIndex];
      const isSpraying = activeWp && (activeWp.action === 'LUBE_SPRAY' || activeWp.action === 'AIR_BLOW' || activeWp.action === 'LUBE_AND_AIR');

      if (isSpraying && showSprayCone) {
        sprayConeRef.current.visible = true;
        mistParticlesRef.current.visible = true;
        sprayConeRef.current.position.set(...tcp);
        mistParticlesRef.current.position.set(...tcp);

        const targetFace = activeWp.targetFace;
        const dir = targetFace === 'FIXED_DIE' ? new THREE.Vector3(0, 0, -1) : new THREE.Vector3(0, 0, 1);
        sprayConeRef.current.lookAt(tcp[0] + dir.x * 200, tcp[1] + dir.y * 200, tcp[2] + dir.z * 200);

        if (activeWp.action === 'AIR_BLOW') {
          (sprayConeRef.current.material as THREE.MeshBasicMaterial).color.setHex(0xe0f2fe);
          (sprayConeRef.current.material as THREE.MeshBasicMaterial).opacity = 0.25;
        } else {
          (sprayConeRef.current.material as THREE.MeshBasicMaterial).color.setHex(0x38bdf8);
          (sprayConeRef.current.material as THREE.MeshBasicMaterial).opacity = 0.45;
        }
      } else {
        sprayConeRef.current.visible = false;
        mistParticlesRef.current.visible = false;
      }
    }
  }, [
    currentRobotPose,
    robot,
    tool,
    robotMountConfig,
    machine,
    activeWaypointIndex,
    showSprayCone,
    waypoints
  ]);

  // 7. Update Trajectory Ribbon & Waypoint Markers
  useEffect(() => {
    const group = waypointsGroupRef.current;
    if (!group) return;

    while (group.children.length > 0) {
      group.remove(group.children[0]);
    }

    const pts = waypoints.map(wp => new THREE.Vector3(wp.x, wp.y, wp.z));
    if (pts.length > 1) {
      const curve = new THREE.CatmullRomCurve3(pts);
      const curvePoints = curve.getPoints(Math.max(50, waypoints.length * 12));
      const lineGeo = new THREE.BufferGeometry().setFromPoints(curvePoints);
      const lineMat = new THREE.LineBasicMaterial({
        color: 0x38bdf8,
        linewidth: 2,
        transparent: true,
        opacity: 0.8
      });
      const pathLine = new THREE.Line(lineGeo, lineMat);
      group.add(pathLine);
    }

    waypoints.forEach((wp, idx) => {
      const isSelected = wp.id === selectedWaypointId;
      const isActive = idx === activeWaypointIndex;

      let wpColor = 0x64748b;
      if (wp.action === 'LUBE_SPRAY' || wp.action === 'LUBE_AND_AIR') {
        wpColor = 0x0284c7;
      } else if (wp.action === 'AIR_BLOW') {
        wpColor = 0x38bdf8;
      }

      if (isActive) wpColor = 0x10b981;
      if (isSelected) wpColor = 0xf59e0b;

      const size = isSelected || isActive ? 26 : 18;
      const sphereGeo = new THREE.SphereGeometry(size, 16, 16);
      const sphereMat = new THREE.MeshStandardMaterial({
        color: wpColor,
        emissive: isSelected || isActive ? wpColor : 0x000000,
        emissiveIntensity: 0.5,
        roughness: 0.3
      });
      const sphere = new THREE.Mesh(sphereGeo, sphereMat);
      sphere.position.set(wp.x, wp.y, wp.z);
      sphere.userData = { waypointId: wp.id };
      group.add(sphere);
    });
  }, [waypoints, selectedWaypointId, activeWaypointIndex]);

  return (
    <div
      ref={containerRef}
      id="simulation-3d-canvas-container"
      className="relative w-full h-full cursor-grab active:cursor-grabbing select-none overflow-hidden"
    />
  );
};
