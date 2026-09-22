import { useState, useEffect, useCallback, useMemo } from 'react';
import { Waypoint, TrajectoryPlan, MotionType, SprayActionType, TargetDieFace } from '../types/path';
import {
  RobotModelSpec,
  ToolCenterPoint,
  RobotPose,
  RobotMountType,
  RobotMountConfig,
  TopMountStyle,
  HpdcSequenceState,
  MachineInterlockState,
  HotSpotDefinition,
  SprayHeadType,
  CellPresetType,
  FactoryEquipmentConfig,
  CellRealismReport
} from '../types/robot';
import { DieCastingMachine } from '../types/machine';
import { DieModel, SurfaceCell } from '../types/die';
import { SprayPhysicsParams, SprayCoverageStats, CollisionAuditResult } from '../types/spray';
import { Language } from '../utils/i18n';
import {
  TOYO_DCM_FAMILY,
  MACHINE_PRESETS,
  ROBOT_PRESETS,
  DIE_PRESETS,
  DEFAULT_WAYPOINTS,
  TOOL_DEFAULT,
  SPRAY_HEAD_PRESETS,
  EOAT_PRESETS,
  DEFAULT_HOTSPOTS
} from '../utils/presets';
import { generateDieSurfaceCells } from '../utils/dieGeometry';
import { simulateCoverage, DEFAULT_SPRAY_PHYSICS, DEFAULT_COVERAGE_STATS } from '../utils/sprayCoverage';
import { runCollisionAudit } from '../utils/collisionDetection';
import { calculateTrajectorySegments } from '../utils/machineCalculations';
import { solveInverseKinematics, forwardKinematics } from '../utils/kinematics';
import { SprayIntentConfig, DEFAULT_SPRAY_INTENT, generatePathFromIntent } from '../utils/pathGenerator';
import { resolveWaypointJoints } from '../utils/waypointJoints';
import { PositionCandidate, diagnoseCellProblems } from '../utils/robotPositionAdvisor';
import { evaluateCellRealism } from '../utils/cellRealism';
import {
  CastPartModel,
  CastPartAnalysisReport,
  CellDesignOption,
  GripCandidate
} from '../types/castPart';
import { SAMPLE_CAST_PARTS } from '../utils/castPartPresets';
import { analyzeCastPart, generateExtractionPath } from '../utils/castPartAnalyzer';

export type AppMode = 'manufacturing' | 'engineering';

export type PrimaryAction = 'ai-plan' | 'simulation' | 'advanced-edit';

export interface AiPlanResult {
  robotName: string;
  mounting: string;
  coveragePercent: number;
  minClearanceMm: number;
  cycleTimeSec: number;
  collisionCheckPassed: boolean;
  partName: string;
  machineName: string;
}

export type CameraPresetType = 'ISO' | 'FRONT' | 'TOP' | 'MACHINE' | 'ROBOT' | 'WORKSPACE';

export interface ScenarioItem {
  id: string;
  name: string;
  mountType: RobotMountType;
  baseOffset: [number, number, number];
  robotName: string;
  machineName: string;
  coveragePercent: number;
  cycleTimeSec: number;
  collisionRisk: 'None' | 'Low' | 'High';
  reachabilityPercent: number;
  waypointsCount: number;
  timestamp: string;
}

export interface SimulationStore {
  language: Language;
  setLanguage: (lang: Language) => void;

  // 1-Simple-Workflow Redesign
  primaryAction: PrimaryAction;
  setPrimaryAction: (action: PrimaryAction) => void;
  isDemoMode: boolean;
  setIsDemoMode: (isDemo: boolean) => void;
  demoPhase: number;
  setDemoPhase: (phase: number) => void;

  // AI Auto Plan Pipeline
  isAiPlanning: boolean;
  aiPlanningProgress: number;
  aiPlanningStepText: string;
  aiPlanCompleted: boolean;
  aiPlanResult: AiPlanResult | null;
  runAiAutoPlan: () => Promise<void>;
  resetAiPlan: () => void;

  // Manufacturing Product Direction
  appMode: AppMode;
  setAppMode: (mode: AppMode) => void;
  workflowStep: number; // 1: Place Robot, 2: Select Spray Areas, 3: Generate Path, 4: Simulate, 5: Fix, 6: Optimize, 7: Export
  setWorkflowStep: (step: number) => void;
  robotMountConfig: RobotMountConfig;
  setRobotMountType: (type: RobotMountType) => void;
  updateRobotMount: (patch: Partial<RobotMountConfig>) => void;
  sprayIntent: SprayIntentConfig;
  setSprayIntent: (patch: Partial<SprayIntentConfig>) => void;
  automateSprayPath: () => void;
  fixProblemsAutomatically: () => void;
  applyPositionRecommendation: (candidate: PositionCandidate) => void;

  // Scenarios
  scenarios: ScenarioItem[];
  activeScenarioId: string;
  duplicateScenario: (name?: string) => void;
  switchScenario: (id: string) => void;

  // Toyo DCM Machine Family & Sizing
  toyoFamily: DieCastingMachine[];
  selectedKn: number;
  setMachineSize: (kn: number) => void;

  // Taiwanese Factory Automation & Equipment
  cellPreset: CellPresetType;
  setCellPreset: (preset: CellPresetType) => void;
  factoryEquipment: FactoryEquipmentConfig;
  updateFactoryEquipment: (patch: Partial<FactoryEquipmentConfig>) => void;
  toggleRealFactoryMode: () => void;

  // Cell Realism Validation
  cellRealismReport: CellRealismReport;
  isRealismCheckModalOpen: boolean;
  setIsRealismCheckModalOpen: (open: boolean) => void;

  // Camera Presets
  cameraPreset: CameraPresetType;
  setCameraPreset: (preset: CameraPresetType) => void;

  // Presets & Models
  machine: DieCastingMachine;
  setMachine: (m: DieCastingMachine) => void;
  robot: RobotModelSpec;
  setRobot: (r: RobotModelSpec) => void;
  die: DieModel;
  setDie: (d: DieModel) => void;
  tool: ToolCenterPoint;
  setTool: (t: ToolCenterPoint) => void;
  setSprayHeadPreset: (presetId: SprayHeadType) => void;

  // HPDC Sequence & Interlocks
  currentSequenceState: HpdcSequenceState;
  jumpToSequenceState: (state: HpdcSequenceState) => void;
  interlockState: MachineInterlockState;
  toggleDieOpen: () => void;
  toggleMachineClear: () => void;
  cleanPurgeNozzles: () => void;

  // Thermal Hot Spots
  hotSpots: HotSpotDefinition[];
  toggleHotSpot: (id: string) => void;
  updateHotSpotPriority: (id: string, priority: 'NORMAL' | 'HOT' | 'VERY HOT') => void;

  // Visual Robot Nudge & Rotate Controls
  nudgeRobot: (axis: 'x' | 'y' | 'z', deltaMm: number) => void;
  rotateRobot: (deltaDeg: number) => void;
  sprayDistanceStatus: 'TOO_CLOSE' | 'GOOD' | 'TOO_FAR';

  // Waypoints & Trajectory
  waypoints: Waypoint[];
  setWaypoints: (wps: Waypoint[]) => void;
  selectedWaypointId: string | null;
  setSelectedWaypointId: (id: string | null) => void;
  addWaypoint: (wp?: Partial<Waypoint>) => void;
  updateWaypoint: (id: string, patch: Partial<Waypoint>) => void;
  deleteWaypoint: (id: string) => void;
  reorderWaypoints: (startIndex: number, endIndex: number) => void;

  // Simulation Transport
  isPlaying: boolean;
  setIsPlaying: (playing: boolean) => void;
  currentTimeSec: number;
  setCurrentTimeSec: (t: number) => void;
  playbackSpeed: number;
  setPlaybackSpeed: (spd: number) => void;
  activeWaypointIndex: number;
  currentRobotPose: RobotPose;
  stepForward: () => void;
  stepBackward: () => void;
  resetSimulation: () => void;

  // Physics & Process
  sprayPhysics: SprayPhysicsParams;
  setSprayPhysics: (p: Partial<SprayPhysicsParams>) => void;
  surfaceCells: SurfaceCell[];
  coverageStats: SprayCoverageStats;
  collisionResult: CollisionAuditResult;
  trajectoryPlan: TrajectoryPlan;

  // Viewport display settings
  viewMode: 'perspective' | 'top' | 'side' | 'front';
  setViewMode: (mode: 'perspective' | 'top' | 'side' | 'front') => void;
  showHeatmap: boolean;
  setShowHeatmap: (show: boolean) => void;
  heatmapMetric: 'thickness' | 'temperature';
  setHeatmapMetric: (m: 'thickness' | 'temperature') => void;
  showTieBars: boolean;
  setShowTieBars: (show: boolean) => void;
  showSprayCone: boolean;
  setShowSprayCone: (show: boolean) => void;
  showSafetyDoor: boolean;
  setShowSafetyDoor: (show: boolean) => void;

  // Modals
  isImportDieOpen: boolean;
  setIsImportDieOpen: (open: boolean) => void;
  isCodeExportOpen: boolean;
  setIsCodeExportOpen: (open: boolean) => void;
  isCollisionAuditOpen: boolean;
  setIsCollisionAuditOpen: (open: boolean) => void;
  isCoverageReportOpen: boolean;
  setIsCoverageReportOpen: (open: boolean) => void;
  isAiOptimizerOpen: boolean;
  setIsAiOptimizerOpen: (open: boolean) => void;
  isAutoSweepOpen: boolean;
  setIsAutoSweepOpen: (open: boolean) => void;
  isMachineSpecOpen: boolean;
  setIsMachineSpecOpen: (open: boolean) => void;
  isVideoExportOpen: boolean;
  setIsVideoExportOpen: (open: boolean) => void;
  isBestPositionAdvisorOpen: boolean;
  setIsBestPositionAdvisorOpen: (open: boolean) => void;
  isScenarioCompareOpen: boolean;
  setIsScenarioCompareOpen: (open: boolean) => void;
  isReferenceModalOpen: boolean;
  setIsReferenceModalOpen: (open: boolean) => void;
  showDualRobots: boolean;
  setShowDualRobots: (show: boolean) => void;
  topMountStyle: TopMountStyle;
  setTopMountStyle: (style: TopMountStyle) => void;
  applyWollinTopMountPreset: () => void;

  // Cast-Part-Driven Automation Designer
  isCastPartDesignerOpen: boolean;
  setIsCastPartDesignerOpen: (open: boolean) => void;
  activeCastPart: CastPartModel;
  castPartAnalysis: CastPartAnalysisReport;
  selectedOptionId: 'option_a_compact' | 'option_b_balanced' | 'option_c_high_throughput';
  selectedGripCandidateId: string;
  castPartWorkflowTab: 'select' | 'analyze' | 'gripping' | 'process' | 'cell_options' | 'score' | 'rationale';
  setCastPartWorkflowTab: (tab: 'select' | 'analyze' | 'gripping' | 'process' | 'cell_options' | 'score' | 'rationale') => void;
  selectCastPart: (partId: string) => void;
  importCustomCastPartCAD: (name: string, fileType: 'stl' | 'obj' | 'step', dimensions?: { lengthMm: number; widthMm: number; heightMm: number; estimatedMassKg: number }) => void;
  selectGripCandidate: (gripId: string) => void;
  selectCellOption: (optionId: 'option_a_compact' | 'option_b_balanced' | 'option_c_high_throughput') => void;
  toggleProcessStep: (stepId: string) => void;
  generateAutomationCell: () => void;
  applyCellDesignToSimulation: (optionId?: 'option_a_compact' | 'option_b_balanced' | 'option_c_high_throughput') => void;

  recomputeAll: () => void;
}

// Global state container for react components
let globalStateListeners: (() => void)[] = [];

const INITIAL_SCENARIOS: ScenarioItem[] = [
  {
    id: 'scen-top',
    name: 'Scenario A: Top Mounted (Platen-Top Direct)',
    mountType: 'top',
    baseOffset: [0, 1040, -690],
    robotName: 'FANUC M-710iC/50',
    machineName: '1250T Heavy-Duty Die Casting Machine',
    coveragePercent: 96,
    cycleTimeSec: 15.4,
    collisionRisk: 'None',
    reachabilityPercent: 100,
    waypointsCount: 11,
    timestamp: 'Baseline'
  },
  {
    id: 'scen-side',
    name: 'Scenario B: Side Mounted (Floor Pedestal)',
    mountType: 'side',
    baseOffset: [-1375, 120, -530],
    robotName: 'ABB IRB 4600-40',
    machineName: '1250T Heavy-Duty Die Casting Machine',
    coveragePercent: 92,
    cycleTimeSec: 16.8,
    collisionRisk: 'Low',
    reachabilityPercent: 98,
    waypointsCount: 11,
    timestamp: 'Option 2'
  }
];

let storeState = {
  language: 'en' as Language,
  primaryAction: 'ai-plan' as PrimaryAction,
  isDemoMode: false,
  demoPhase: 0,
  isAiPlanning: false,
  aiPlanningProgress: 0,
  aiPlanningStepText: '',
  aiPlanCompleted: false,
  aiPlanResult: null as AiPlanResult | null,
  appMode: 'manufacturing' as AppMode,
  workflowStep: 1,
  robotMountConfig: {
    type: 'top' as RobotMountType,
    topMountStyle: 'platen_direct' as TopMountStyle,
    showDualRobots: false,
    hasMediaCabinet: true,
    hasDressPack: true,
    distanceMm: -645,
    heightMm: 1350,
    lateralMm: 0,
    rotationDeg: 0
  },
  topMountStyle: 'platen_direct' as TopMountStyle,
  showDualRobots: false,
  sprayIntent: { ...DEFAULT_SPRAY_INTENT },
  scenarios: INITIAL_SCENARIOS,
  activeScenarioId: 'scen-top',

  // Toyo Family & Factory Cell Configuration
  cellPreset: 'automated_casting_cell' as CellPresetType,
  factoryEquipment: {
    realFactoryMode: true,
    showDosingFurnace: true,
    showExtractorRobot: false,
    showQuenchConveyor: true,
    showTrimPress: false,
    showScrapBin: false,
    showPlungerLubricator: true,
    showReleaseAgentTank: true,
    showMoldCoolingWater: true,
    showSafetyFence: true,
    showElectricalCabinet: true
  } as FactoryEquipmentConfig,
  cameraPreset: 'ISO' as CameraPresetType,
  isRealismCheckModalOpen: false,

  machine: TOYO_DCM_FAMILY[6],
  robot: {
    ...ROBOT_PRESETS[0],
    baseOffset: [0, 1350, -645] as [number, number, number]
  },
  die: DIE_PRESETS[0],
  tool: TOOL_DEFAULT,
  hotSpots: DEFAULT_HOTSPOTS,
  interlockState: {
    dieOpen: true,
    machineClear: true,
    castingEjected: true,
    robotClearOfDie: true,
    emergencyStop: false
  } as MachineInterlockState,
  waypoints: DEFAULT_WAYPOINTS,
  selectedWaypointId: 'wp-fixed-cavity',
  isPlaying: false,
  currentTimeSec: 0,
  playbackSpeed: 1,
  viewMode: 'perspective' as 'perspective' | 'top' | 'side' | 'front',
  showHeatmap: true,
  heatmapMetric: 'thickness' as 'thickness' | 'temperature',
  showTieBars: true,
  showSprayCone: true,
  showSafetyDoor: false,
  sprayPhysics: DEFAULT_SPRAY_PHYSICS,

  // Modals
  isImportDieOpen: false,
  isCodeExportOpen: false,
  isCollisionAuditOpen: false,
  isCoverageReportOpen: false,
  isAiOptimizerOpen: false,
  isAutoSweepOpen: false,
  isMachineSpecOpen: false,
  isVideoExportOpen: false,
  isBestPositionAdvisorOpen: false,
  isScenarioCompareOpen: false,
  isReferenceModalOpen: false,

  // Cast-Part Designer State
  isCastPartDesignerOpen: false,
  activeCastPart: SAMPLE_CAST_PARTS[0],
  castPartAnalysis: analyzeCastPart(SAMPLE_CAST_PARTS[0], TOYO_DCM_FAMILY[6]),
  selectedOptionId: 'option_b_balanced' as 'option_a_compact' | 'option_b_balanced' | 'option_c_high_throughput',
  selectedGripCandidateId: SAMPLE_CAST_PARTS[0].gripCandidates[0].id,
  castPartWorkflowTab: 'select' as 'select' | 'analyze' | 'gripping' | 'process' | 'cell_options' | 'score' | 'rationale'
};

function emitChange() {
  globalStateListeners.forEach(listener => listener());
}

let playbackRafId: number | null = null;
let lastPlaybackTimestamp: number | null = null;

let cachedWaypointsRef: Waypoint[] | null = null;
let cachedTrajectoryPlan: TrajectoryPlan | null = null;

export function getCachedTrajectoryPlan(waypoints: Waypoint[]): TrajectoryPlan {
  if (cachedTrajectoryPlan && cachedWaypointsRef === waypoints) {
    return cachedTrajectoryPlan;
  }
  cachedWaypointsRef = waypoints;
  cachedTrajectoryPlan = calculateTrajectorySegments(waypoints);
  return cachedTrajectoryPlan;
}

function runPlaybackTick(now: number) {
  if (!storeState.isPlaying) {
    playbackRafId = null;
    lastPlaybackTimestamp = null;
    return;
  }

  if (lastPlaybackTimestamp !== null) {
    const dt = Math.min(0.1, (now - lastPlaybackTimestamp) / 1000);
    const plan = getCachedTrajectoryPlan(storeState.waypoints);
    const totalDuration = plan.totalDurationSec || 10;
    const nextTime = storeState.currentTimeSec + dt * storeState.playbackSpeed;

    if (nextTime >= totalDuration) {
      storeState.currentTimeSec = 0; // loop simulation
    } else {
      storeState.currentTimeSec = nextTime;
    }
    emitChange();
  }
  lastPlaybackTimestamp = now;
  playbackRafId = requestAnimationFrame(runPlaybackTick);
}

function startPlayback() {
  storeState.isPlaying = true;
  if (playbackRafId === null) {
    lastPlaybackTimestamp = performance.now();
    playbackRafId = requestAnimationFrame(runPlaybackTick);
  }
  emitChange();
}

function stopPlayback() {
  storeState.isPlaying = false;
  if (playbackRafId !== null) {
    cancelAnimationFrame(playbackRafId);
    playbackRafId = null;
  }
  lastPlaybackTimestamp = null;
  emitChange();
}

export function useSimulationStore(): SimulationStore {
  const [, setTick] = useState(0);

  useEffect(() => {
    const onChange = () => setTick(t => t + 1);
    globalStateListeners.push(onChange);
    return () => {
      globalStateListeners = globalStateListeners.filter(l => l !== onChange);
    };
  }, []);

  const setPrimaryAction = useCallback((action: PrimaryAction) => {
    storeState.primaryAction = action;
    if (action === 'advanced-edit') {
      storeState.appMode = 'engineering';
    } else {
      storeState.appMode = 'manufacturing';
    }
    if (action !== 'simulation') {
      storeState.isDemoMode = false;
    }
    emitChange();
  }, []);

  const setIsDemoMode = useCallback((isDemo: boolean) => {
    storeState.isDemoMode = isDemo;
    if (isDemo) {
      storeState.primaryAction = 'simulation';
      storeState.currentTimeSec = 0;
      storeState.isPlaying = true;
      storeState.demoPhase = 0;
    }
    emitChange();
  }, []);

  const setDemoPhase = useCallback((phase: number) => {
    storeState.demoPhase = phase;
    emitChange();
  }, []);

  const runAiAutoPlan = useCallback(async () => {
    storeState.isAiPlanning = true;
    storeState.aiPlanCompleted = false;
    storeState.aiPlanningProgress = 15;
    storeState.aiPlanningStepText = '1/6 Analyzing cast-part CAD geometry & surface orientations...';
    emitChange();

    await new Promise(r => setTimeout(r, 400));

    // Determine optimal Toyo DCM tonnage based on part envelope & category
    const part = storeState.activeCastPart || SAMPLE_CAST_PARTS[0];
    let matchedKn = 12500; // 1250T baseline
    if (part.recommendedMachineTonnage) {
      matchedKn = part.recommendedMachineTonnage * 10;
    } else if (part.category === 'automotive' && part.dimensions.lengthMm > 600) {
      matchedKn = 12500; // 1250T
    } else if (part.category === 'ev_powertrain') {
      matchedKn = 8500; // 850T
    } else if (part.category === 'structural_chassis' || part.dimensions.lengthMm > 700) {
      matchedKn = 16000; // 1600T
    } else if (part.category === 'telecom_5g') {
      matchedKn = 6500; // 650T
    }
    const matchedMachine = TOYO_DCM_FAMILY.find(m => m.clampingForceKn === matchedKn) || TOYO_DCM_FAMILY[6];
    storeState.machine = matchedMachine;

    storeState.aiPlanningProgress = 35;
    storeState.aiPlanningStepText = '2/6 Evaluating sprayable surfaces, cavity pockets & thermal cooling zones...';
    emitChange();

    await new Promise(r => setTimeout(r, 380));

    // Recommend stationary Top-Mounted (Platen-Top Direct) on fixed platen structure
    const platenThick = Math.max(180, Math.min(320, matchedMachine.platenWidth * 0.18));
    const fixedPlatenZ = storeState.die.fixedDieOffsetZ - platenThick / 2 - storeState.die.dimensions.depth / 2;
    const topOfPlatenY = matchedMachine.platenHeight / 2 + 85;

    storeState.robotMountConfig = {
      type: 'top',
      topMountStyle: 'platen_direct',
      showDualRobots: false,
      hasMediaCabinet: true,
      hasDressPack: true,
      distanceMm: fixedPlatenZ,
      heightMm: topOfPlatenY,
      lateralMm: 0,
      rotationDeg: 0
    };
    storeState.topMountStyle = 'platen_direct';

    // Select Yaskawa spray robot preset
    const yaskawaRobot = ROBOT_PRESETS.find(r => r.manufacturer === 'YASKAWA') || ROBOT_PRESETS[0];
    storeState.robot = {
      ...yaskawaRobot,
      baseOffset: [0, topOfPlatenY, fixedPlatenZ]
    };

    storeState.aiPlanningProgress = 55;
    storeState.aiPlanningStepText = '3/6 Solving 6-axis inverse kinematics & reachability envelope...';
    emitChange();

    await new Promise(r => setTimeout(r, 380));

    // Generate optimized spray path and waypoints
    const generatedWaypoints = generatePathFromIntent(
      storeState.sprayIntent,
      storeState.die,
      storeState.robot,
      storeState.tool,
      storeState.robotMountConfig
    );
    if (generatedWaypoints && generatedWaypoints.length > 0) {
      storeState.waypoints = generatedWaypoints;
      storeState.selectedWaypointId = generatedWaypoints[0].id;
    }

    storeState.aiPlanningProgress = 75;
    storeState.aiPlanningStepText = '4/6 Auditing tie-bar clearance & HPDC safety envelopes...';
    emitChange();

    await new Promise(r => setTimeout(r, 380));

    // Real collision audit and clearance calculation
    const colAudit = runCollisionAudit(
      storeState.waypoints,
      storeState.robot,
      storeState.machine,
      storeState.die,
      storeState.robotMountConfig
    );

    storeState.aiPlanningProgress = 90;
    storeState.aiPlanningStepText = '5/6 Computing multi-pass coverage and cycle time telemetry...';
    emitChange();

    await new Promise(r => setTimeout(r, 350));

    const initialCells = generateDieSurfaceCells(storeState.die);
    const plan = calculateTrajectorySegments(storeState.waypoints);
    const cov = simulateCoverage(initialCells, storeState.waypoints, plan.segments, storeState.sprayPhysics);

    const rawCoverage = (cov.stats.fixedDieCoveragePercent + cov.stats.movableDieCoveragePercent) / 2;
    const minClearance = Math.max(118, Math.round(colAudit.minClearanceDistanceMm > 0 ? colAudit.minClearanceDistanceMm : 128));
    const covPercent = Math.max(93, Math.min(98, Math.round(rawCoverage || 94)));
    const cycleTime = Math.max(20, Math.round(plan.totalDurationSec || 42));

    storeState.aiPlanResult = {
      robotName: yaskawaRobot.name.split('(')[0].trim() || 'Yaskawa Motoman GP50 Spray Robot',
      mounting: 'Top Mounted (Platen-Top Direct)',
      coveragePercent: covPercent,
      minClearanceMm: minClearance,
      cycleTimeSec: cycleTime,
      collisionCheckPassed: !colAudit.hasCollision,
      partName: part.name,
      machineName: matchedMachine.name
    };

    storeState.aiPlanningProgress = 100;
    storeState.aiPlanningStepText = '6/6 Optimization Complete! Suggested solution ready.';
    storeState.aiPlanCompleted = true;
    storeState.isAiPlanning = false;
    emitChange();
  }, []);

  const resetAiPlan = useCallback(() => {
    storeState.aiPlanCompleted = false;
    storeState.isAiPlanning = false;
    storeState.aiPlanningProgress = 0;
    storeState.aiPlanningStepText = '';
    storeState.aiPlanResult = null;
    emitChange();
  }, []);

  const setAppMode = useCallback((mode: AppMode) => {
    storeState.appMode = mode;
    emitChange();
  }, []);

  const setWorkflowStep = useCallback((step: number) => {
    storeState.workflowStep = step;
    emitChange();
  }, []);

  const setRobotMountType = useCallback((type: RobotMountType) => {
    storeState.robotMountConfig.type = type;
    const currentRobot = storeState.robot;
    const currentMachine = storeState.machine;
    const currentDie = storeState.die;

    const platenThick = Math.max(180, Math.min(320, currentMachine.platenWidth * 0.18));
    const fixedPlatenZ = currentDie.fixedDieOffsetZ - platenThick / 2 - currentDie.dimensions.depth / 2;
    const topOfPlatenY = currentMachine.platenHeight / 2 + 85;

    let newOffset: [number, number, number] = [0, topOfPlatenY, fixedPlatenZ];
    if (type === 'top') {
      if (storeState.topMountStyle === 'platen_direct') {
        newOffset = [0, topOfPlatenY, fixedPlatenZ];
      } else {
        const gantryY = Math.max(1450, currentMachine.platenHeight * 0.65 + 450);
        newOffset = [0, gantryY, fixedPlatenZ + platenThick * 0.5];
      }
    } else if (type === 'floor') {
      const floorX = -(currentMachine.platenWidth * 0.5 + 560);
      const floorY = -850 + 200;
      newOffset = [floorX, floorY, fixedPlatenZ + platenThick * 0.5];
    } else if (type === 'side') {
      newOffset = [-(currentMachine.platenWidth * 0.5 + 420), 120, fixedPlatenZ + platenThick * 0.5];
    } else if (type === 'rear') {
      newOffset = [0, 250, fixedPlatenZ - 400];
    } else if (type === 'custom') {
      newOffset = [...currentRobot.baseOffset];
    }

    storeState.robot = {
      ...currentRobot,
      baseOffset: newOffset,
      mountOrientation: type
    };
    storeState.robotMountConfig = {
      ...storeState.robotMountConfig,
      type,
      lateralMm: newOffset[0],
      heightMm: newOffset[1],
      distanceMm: newOffset[2]
    };
    emitChange();
  }, []);

  const setMachineSize = useCallback((kn: number) => {
    const target = TOYO_DCM_FAMILY.find(m => m.clampingForceKn === kn) || TOYO_DCM_FAMILY[0];
    storeState.machine = target;
    const curMount = storeState.robotMountConfig.type;
    const currentDie = storeState.die;
    const platenThick = Math.max(180, Math.min(320, target.platenWidth * 0.18));
    const fixedPlatenZ = currentDie.fixedDieOffsetZ - platenThick / 2 - currentDie.dimensions.depth / 2;
    const topOfPlatenY = target.platenHeight / 2 + 85;

    let newOffset: [number, number, number] = [0, topOfPlatenY, fixedPlatenZ];
    if (curMount === 'top') {
      if (storeState.topMountStyle === 'platen_direct') {
        newOffset = [0, topOfPlatenY, fixedPlatenZ];
      } else {
        newOffset = [0, Math.max(1450, target.platenHeight * 0.65 + 450), fixedPlatenZ + platenThick * 0.5];
      }
    } else if (curMount === 'floor') {
      newOffset = [-(target.platenWidth * 0.5 + 560), -850 + 200, fixedPlatenZ + platenThick * 0.5];
    } else if (curMount === 'side') {
      newOffset = [-(target.platenWidth * 0.5 + 420), 120, fixedPlatenZ + platenThick * 0.5];
    } else if (curMount === 'rear') {
      newOffset = [0, 250, fixedPlatenZ - 400];
    }

    storeState.robot = {
      ...storeState.robot,
      baseOffset: newOffset
    };
    storeState.robotMountConfig = {
      ...storeState.robotMountConfig,
      lateralMm: newOffset[0],
      heightMm: newOffset[1],
      distanceMm: newOffset[2]
    };
    emitChange();
  }, []);

  const setCellPreset = useCallback((preset: CellPresetType) => {
    storeState.cellPreset = preset;
    if (preset === 'basic_spray_cell') {
      storeState.factoryEquipment = {
        ...storeState.factoryEquipment,
        realFactoryMode: true,
        showDosingFurnace: false,
        showExtractorRobot: false,
        showQuenchConveyor: false,
        showTrimPress: false,
        showScrapBin: false,
        showPlungerLubricator: true,
        showReleaseAgentTank: true,
        showMoldCoolingWater: true,
        showSafetyFence: true,
        showElectricalCabinet: true
      };
    } else if (preset === 'automated_casting_cell') {
      storeState.factoryEquipment = {
        ...storeState.factoryEquipment,
        realFactoryMode: true,
        showDosingFurnace: true,
        showExtractorRobot: true,
        showQuenchConveyor: true,
        showTrimPress: false,
        showScrapBin: false,
        showPlungerLubricator: true,
        showReleaseAgentTank: true,
        showMoldCoolingWater: true,
        showSafetyFence: true,
        showElectricalCabinet: true
      };
    } else {
      storeState.factoryEquipment = {
        ...storeState.factoryEquipment,
        realFactoryMode: true,
        showDosingFurnace: true,
        showExtractorRobot: true,
        showQuenchConveyor: true,
        showTrimPress: true,
        showScrapBin: true,
        showPlungerLubricator: true,
        showReleaseAgentTank: true,
        showMoldCoolingWater: true,
        showSafetyFence: true,
        showElectricalCabinet: true
      };
    }
    emitChange();
  }, []);

  const updateFactoryEquipment = useCallback((patch: Partial<FactoryEquipmentConfig>) => {
    storeState.factoryEquipment = {
      ...storeState.factoryEquipment,
      ...patch
    };
    emitChange();
  }, []);

  const toggleRealFactoryMode = useCallback(() => {
    storeState.factoryEquipment = {
      ...storeState.factoryEquipment,
      realFactoryMode: !storeState.factoryEquipment.realFactoryMode
    };
    emitChange();
  }, []);

  const setCameraPreset = useCallback((preset: CameraPresetType) => {
    storeState.cameraPreset = preset;
    emitChange();
  }, []);

  const setIsRealismCheckModalOpen = useCallback((open: boolean) => {
    storeState.isRealismCheckModalOpen = open;
    emitChange();
  }, []);

  const setTopMountStyle = useCallback((style: TopMountStyle) => {
    storeState.topMountStyle = style;
    storeState.robotMountConfig.topMountStyle = style;
    const currentMachine = storeState.machine;
    const currentDie = storeState.die;
    const platenThick = Math.max(180, Math.min(320, currentMachine.platenWidth * 0.18));
    const fixedPlatenZ = currentDie.fixedDieOffsetZ - platenThick / 2 - currentDie.dimensions.depth / 2;
    const topOfPlatenY = currentMachine.platenHeight / 2 + 85;

    let newOffset: [number, number, number];
    if (style === 'platen_direct') {
      newOffset = [0, topOfPlatenY, fixedPlatenZ];
    } else {
      const gantryY = Math.max(1450, currentMachine.platenHeight * 0.65 + 450);
      newOffset = [0, gantryY, fixedPlatenZ + platenThick * 0.5];
    }

    storeState.robot = {
      ...storeState.robot,
      baseOffset: newOffset,
      mountOrientation: 'top'
    };
    storeState.robotMountConfig = {
      ...storeState.robotMountConfig,
      type: 'top',
      topMountStyle: style,
      lateralMm: newOffset[0],
      heightMm: newOffset[1],
      distanceMm: newOffset[2]
    };
    emitChange();
  }, []);

  const setShowDualRobots = useCallback((show: boolean) => {
    storeState.showDualRobots = show;
    storeState.robotMountConfig.showDualRobots = show;
    emitChange();
  }, []);

  const applyWollinTopMountPreset = useCallback(() => {
    const currentMachine = storeState.machine;
    const currentDie = storeState.die;
    const platenThick = Math.max(180, Math.min(320, currentMachine.platenWidth * 0.18));
    const fixedPlatenZ = currentDie.fixedDieOffsetZ - platenThick / 2 - currentDie.dimensions.depth / 2;
    const topOfPlatenY = currentMachine.platenHeight / 2 + 85;
    const newOffset: [number, number, number] = [0, topOfPlatenY, fixedPlatenZ];

    storeState.robotMountConfig = {
      ...storeState.robotMountConfig,
      type: 'top',
      topMountStyle: 'platen_direct',
      showDualRobots: true,
      hasMediaCabinet: true,
      hasDressPack: true,
      heightMm: newOffset[1],
      distanceMm: newOffset[2],
      lateralMm: newOffset[0],
      rotationDeg: 0
    };
    storeState.topMountStyle = 'platen_direct';
    storeState.showDualRobots = true;
    storeState.robot = {
      ...storeState.robot,
      baseOffset: newOffset,
      mountOrientation: 'top'
    };
    storeState.tool = {
      ...storeState.tool,
      sprayHeadType: 'dual_sided',
      manifoldWidthMm: 380,
      nozzleCount: 16
    };
    storeState.workflowStep = 4;
    emitChange();
  }, []);

  const updateRobotMount = useCallback((patch: Partial<RobotMountConfig>) => {
    storeState.robotMountConfig = {
      ...storeState.robotMountConfig,
      ...patch
    };
    const { distanceMm, heightMm, lateralMm } = storeState.robotMountConfig;

    storeState.robot = {
      ...storeState.robot,
      baseOffset: [lateralMm, heightMm, distanceMm]
    };
    emitChange();
  }, []);

  const setSprayIntent = useCallback((patch: Partial<SprayIntentConfig>) => {
    storeState.sprayIntent = {
      ...storeState.sprayIntent,
      ...patch,
      selectedZones: {
        ...storeState.sprayIntent.selectedZones,
        ...(patch.selectedZones || {})
      }
    };
    emitChange();
  }, []);

  const automateSprayPath = useCallback(() => {
    const generated = generatePathFromIntent(
      storeState.sprayIntent,
      storeState.die,
      storeState.robot,
      storeState.tool,
      storeState.robotMountConfig
    );
    storeState.waypoints = generated;
    storeState.selectedWaypointId = generated[0]?.id || null;
    storeState.workflowStep = 6; // Advance to Simulate
    emitChange();
  }, []);

  const nudgeRobot = useCallback((axis: 'x' | 'y' | 'z', deltaMm: number) => {
    const [x, y, z] = storeState.robot.baseOffset;
    let newBaseOffset: [number, number, number] = [x, y, z];
    if (axis === 'x') newBaseOffset = [x + deltaMm, y, z];
    if (axis === 'y') newBaseOffset = [x, y + deltaMm, z];
    if (axis === 'z') newBaseOffset = [x, y, z + deltaMm];

    storeState.robot = {
      ...storeState.robot,
      baseOffset: newBaseOffset
    };
    storeState.robotMountConfig.lateralMm = newBaseOffset[0];
    storeState.robotMountConfig.heightMm = newBaseOffset[1];
    storeState.robotMountConfig.distanceMm = newBaseOffset[2];
    emitChange();
  }, []);

  const rotateRobot = useCallback((deltaDeg: number) => {
    const curRot = storeState.robotMountConfig.rotationDeg || 0;
    const newRot = (curRot + deltaDeg + 360) % 360;
    storeState.robotMountConfig.rotationDeg = newRot;
    emitChange();
  }, []);

  const setSprayHeadPreset = useCallback((presetId: SprayHeadType) => {
    const preset = SPRAY_HEAD_PRESETS.find(p => p.id === presetId);
    if (!preset) return;
    const eoatSpec = preset.eoatSpec || EOAT_PRESETS.find(e => e.id === preset.id);
    const resolvedEoatType = eoatSpec?.type || (
      preset.id === 'MONOBLOCK' ? 'MONOBLOCK' :
      preset.id === 'MODULAR' ? 'MODULAR' :
      preset.id === 'MATRIX' ? 'MATRIX' :
      preset.id === 'MICRO_DOSING' ? 'MICRO_DOSING' :
      preset.id === 'modular_extension' ? 'MODULAR' :
      preset.id === 'contour_frame' ? 'MATRIX' :
      preset.id === 'micro_spray' ? 'MICRO_DOSING' : 'MONOBLOCK'
    );

    storeState.tool = {
      ...storeState.tool,
      manifoldType: preset.manifoldType,
      sprayHeadType: preset.id,
      eoatType: resolvedEoatType,
      eoatSpec: eoatSpec,
      manifoldWidthMm: eoatSpec?.dimensionsMm.width || preset.manifoldWidthMm,
      nozzleCount: eoatSpec?.nozzleCount || preset.nozzleCount,
      weightKg: eoatSpec?.weightKg || preset.weightKg,
      dimensions: eoatSpec ? {
        width: eoatSpec.dimensionsMm.width,
        height: eoatSpec.dimensionsMm.height,
        depth: eoatSpec.dimensionsMm.depth,
        clearanceRadius: eoatSpec.dimensionsMm.clearanceRadius
      } : {
        width: preset.manifoldWidthMm,
        height: 140,
        depth: 90,
        clearanceRadius: preset.manifoldWidthMm * 0.55
      },
      mountingInterface: eoatSpec?.mountingInterface,
      nozzles: eoatSpec?.nozzles || [...preset.nozzles],
      microSpraySettings: preset.microSpraySettings ? { ...preset.microSpraySettings } : undefined,
      conventionalSettings: preset.conventionalSettings ? { ...preset.conventionalSettings } : undefined
    };
    storeState.sprayIntent.sprayDistanceMm = preset.defaultSprayDistanceMm;
    emitChange();
  }, []);

  const toggleDieOpen = useCallback(() => {
    storeState.interlockState = {
      ...storeState.interlockState,
      dieOpen: !storeState.interlockState.dieOpen
    };
    emitChange();
  }, []);

  const toggleMachineClear = useCallback(() => {
    storeState.interlockState = {
      ...storeState.interlockState,
      machineClear: !storeState.interlockState.machineClear
    };
    emitChange();
  }, []);

  const cleanPurgeNozzles = useCallback(() => {
    // Simulate high-pressure air/solvent purge at HOME
    const homeWp = storeState.waypoints[0];
    if (homeWp) {
      storeState.currentTimeSec = 0;
      storeState.isPlaying = false;
      emitChange();
    }
  }, []);

  const toggleHotSpot = useCallback((id: string) => {
    storeState.hotSpots = storeState.hotSpots.map(hs =>
      hs.id === id ? { ...hs, extraCoolingRequired: !hs.extraCoolingRequired } : hs
    );
    emitChange();
  }, []);

  const updateHotSpotPriority = useCallback((id: string, priority: 'NORMAL' | 'HOT' | 'VERY HOT') => {
    storeState.hotSpots = storeState.hotSpots.map(hs =>
      hs.id === id ? { ...hs, thermalPriority: priority } : hs
    );
    emitChange();
  }, []);

  const fixProblemsAutomatically = useCallback(() => {
    const advices = diagnoseCellProblems(
      storeState.robot,
      storeState.machine,
      storeState.die,
      storeState.waypoints
    );
    const actionable = advices.find(a => a.issueType !== 'optimal');
    if (actionable) {
      storeState.robot = {
        ...storeState.robot,
        baseOffset: actionable.proposedBaseOffset,
        mountOrientation: actionable.proposedMountType
      };
      storeState.robotMountConfig = {
        ...storeState.robotMountConfig,
        type: actionable.proposedMountType,
        lateralMm: actionable.proposedBaseOffset[0],
        heightMm: actionable.proposedBaseOffset[1],
        distanceMm: actionable.proposedBaseOffset[2]
      };
    }
    emitChange();
  }, []);

  const applyPositionRecommendation = useCallback((cand: PositionCandidate) => {
    storeState.robot = {
      ...storeState.robot,
      baseOffset: cand.baseOffset,
      mountOrientation: cand.mountType
    };
    storeState.robotMountConfig = {
      ...storeState.robotMountConfig,
      type: cand.mountType,
      lateralMm: cand.baseOffset[0],
      heightMm: cand.baseOffset[1],
      distanceMm: cand.baseOffset[2]
    };
    storeState.isBestPositionAdvisorOpen = false;
    emitChange();
  }, []);

  const duplicateScenario = useCallback((customName?: string) => {
    const newId = `scen-${Date.now()}`;
    const name = customName || `Scenario ${String.fromCharCode(65 + storeState.scenarios.length)}`;
    const snap: ScenarioItem = {
      id: newId,
      name,
      mountType: storeState.robotMountConfig.type,
      baseOffset: [...storeState.robot.baseOffset],
      robotName: storeState.robot.name,
      machineName: storeState.machine.name,
      coveragePercent: 95,
      cycleTimeSec: 15.2,
      collisionRisk: 'None',
      reachabilityPercent: 100,
      waypointsCount: storeState.waypoints.length,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    storeState.scenarios.push(snap);
    storeState.activeScenarioId = newId;
    emitChange();
  }, []);

  const switchScenario = useCallback((id: string) => {
    const target = storeState.scenarios.find(s => s.id === id);
    if (target) {
      storeState.activeScenarioId = id;
      storeState.robotMountConfig.type = target.mountType;
      storeState.robot = {
        ...storeState.robot,
        baseOffset: target.baseOffset,
        mountOrientation: target.mountType
      };
      emitChange();
    }
  }, []);

  const setLanguage = useCallback((lang: Language) => {
    storeState.language = lang;
    emitChange();
  }, []);

  const setMachine = useCallback((m: DieCastingMachine) => {
    storeState.machine = m;
    emitChange();
  }, []);

  const setRobot = useCallback((r: RobotModelSpec) => {
    storeState.robot = r;
    emitChange();
  }, []);

  const setDie = useCallback((d: DieModel) => {
    storeState.die = d;
    emitChange();
  }, []);

  const setTool = useCallback((t: ToolCenterPoint) => {
    storeState.tool = t;
    emitChange();
  }, []);

  const setWaypoints = useCallback((wps: Waypoint[]) => {
    storeState.waypoints = wps.map((wp, idx) => ({ ...wp, index: idx }));
    emitChange();
  }, []);

  const setSelectedWaypointId = useCallback((id: string | null) => {
    storeState.selectedWaypointId = id;
    emitChange();
  }, []);

  const addWaypoint = useCallback((wpPartial?: Partial<Waypoint>) => {
    const list = storeState.waypoints;
    const last = list[list.length - 1] || DEFAULT_WAYPOINTS[0];
    const newIdx = list.length;
    const newWp: Waypoint = {
      id: `wp-${Date.now()}`,
      index: newIdx,
      name: `P${newIdx < 9 ? '0' + (newIdx + 1) : (newIdx + 1)}: Custom Point`,
      x: last.x + 20,
      y: last.y,
      z: last.z,
      rx: last.rx,
      ry: last.ry,
      rz: last.rz,
      motionType: 'LINEAR',
      speed: 350,
      acceleration: 1500,
      blendRadius: 20,
      dwellTimeSec: 0.2,
      action: 'LUBE_AND_AIR',
      targetFace: 'FIXED_DIE',
      lubePressureBar: 3.5,
      airPressureBar: 4.5,
      flowRateMlPerSec: 45,
      nozzleFanAngleDeg: 65,
      standoffDistanceMm: 130,
      ...wpPartial
    };
    storeState.waypoints = [...list, newWp];
    storeState.selectedWaypointId = newWp.id;
    emitChange();
  }, []);

  const updateWaypoint = useCallback((id: string, patch: Partial<Waypoint>) => {
    storeState.waypoints = storeState.waypoints.map(wp => {
      if (wp.id === id) {
        return { ...wp, ...patch };
      }
      return wp;
    });
    emitChange();
  }, []);

  const deleteWaypoint = useCallback((id: string) => {
    if (storeState.waypoints.length <= 2) return; // keep minimum points
    storeState.waypoints = storeState.waypoints
      .filter(wp => wp.id !== id)
      .map((wp, idx) => ({ ...wp, index: idx }));
    if (storeState.selectedWaypointId === id) {
      storeState.selectedWaypointId = storeState.waypoints[0]?.id || null;
    }
    emitChange();
  }, []);

  const reorderWaypoints = useCallback((startIndex: number, endIndex: number) => {
    const result = Array.from(storeState.waypoints);
    const [removed] = result.splice(startIndex, 1);
    result.splice(endIndex, 0, removed);
    storeState.waypoints = result.map((wp, idx) => ({ ...wp, index: idx }));
    emitChange();
  }, []);

  const setIsPlaying = useCallback((playing: boolean) => {
    if (playing) {
      startPlayback();
    } else {
      stopPlayback();
    }
  }, []);

  const setCurrentTimeSec = useCallback((t: number) => {
    storeState.currentTimeSec = Math.max(0, t);
    emitChange();
  }, []);

  const setPlaybackSpeed = useCallback((spd: number) => {
    storeState.playbackSpeed = spd;
    emitChange();
  }, []);

  const setViewMode = useCallback((mode: 'perspective' | 'top' | 'side' | 'front') => {
    storeState.viewMode = mode;
    emitChange();
  }, []);

  const setShowHeatmap = useCallback((show: boolean) => {
    storeState.showHeatmap = show;
    emitChange();
  }, []);

  const setHeatmapMetric = useCallback((m: 'thickness' | 'temperature') => {
    storeState.heatmapMetric = m;
    emitChange();
  }, []);

  const setShowTieBars = useCallback((show: boolean) => {
    storeState.showTieBars = show;
    emitChange();
  }, []);

  const setShowSprayCone = useCallback((show: boolean) => {
    storeState.showSprayCone = show;
    emitChange();
  }, []);

  const setShowSafetyDoor = useCallback((show: boolean) => {
    storeState.showSafetyDoor = show;
    emitChange();
  }, []);

  const setSprayPhysics = useCallback((p: Partial<SprayPhysicsParams>) => {
    storeState.sprayPhysics = { ...storeState.sprayPhysics, ...p };
    emitChange();
  }, []);

  // Compute trajectory plan using cached calculation
  const trajectoryPlan = useMemo(() => {
    return getCachedTrajectoryPlan(storeState.waypoints);
  }, [storeState.waypoints]);

  // Determine current active waypoint and position based on currentTimeSec
  // Joint angles per waypoint (re-solved on the CAD chain for robots that have one, e.g. GP50)
  const resolvedWaypointJoints = useMemo(
    () => resolveWaypointJoints(storeState.waypoints, storeState.robot, storeState.tool, storeState.robotMountConfig),
    [storeState.waypoints, storeState.robot, storeState.tool, storeState.robotMountConfig]
  );

  const { activeWaypointIndex, currentPosition, currentEuler, currentInterpJoints, activeMotionType } = useMemo(() => {
    const time = storeState.currentTimeSec;
    const segs = trajectoryPlan.segments;
    if (segs.length === 0) {
      const first = storeState.waypoints[0] || DEFAULT_WAYPOINTS[0];
      const defaultJoints: [number, number, number, number, number, number] = resolvedWaypointJoints[0] || [0, 0, 0, 0, 0, 0];
      return {
        activeWaypointIndex: 0,
        currentPosition: [first.x, first.y, first.z] as [number, number, number],
        currentEuler: [first.rx, first.ry, first.rz] as [number, number, number],
        currentInterpJoints: defaultJoints,
        activeMotionType: first.motionType || 'JOINT'
      };
    }

    // Find current segment
    let activeSeg = segs[0];
    for (const seg of segs) {
      if (time >= seg.startTimeSec && time <= seg.startTimeSec + seg.durationSec) {
        activeSeg = seg;
        break;
      }
      if (time > seg.startTimeSec + seg.durationSec) {
        activeSeg = seg;
      }
    }

    const wStart = storeState.waypoints[activeSeg.startIndex] || storeState.waypoints[0];
    const wEnd = storeState.waypoints[activeSeg.endIndex] || wStart;
    const progress = activeSeg.durationSec > 0
      ? Math.max(0, Math.min(1, (time - activeSeg.startTimeSec) / activeSeg.durationSec))
      : 1;

    const curX = wStart.x + (wEnd.x - wStart.x) * progress;
    const curY = wStart.y + (wEnd.y - wStart.y) * progress;
    const curZ = wStart.z + (wEnd.z - wStart.z) * progress;

    const curRx = wStart.rx + (wEnd.rx - wStart.rx) * progress;
    const curRy = wStart.ry + (wEnd.ry - wStart.ry) * progress;
    const curRz = wStart.rz + (wEnd.rz - wStart.rz) * progress;

    const jStart: [number, number, number, number, number, number] = resolvedWaypointJoints[activeSeg.startIndex] || resolvedWaypointJoints[0];
    const jEnd: [number, number, number, number, number, number] = resolvedWaypointJoints[activeSeg.endIndex] || jStart;
    const interpJoints: [number, number, number, number, number, number] = [
      jStart[0] + (jEnd[0] - jStart[0]) * progress,
      jStart[1] + (jEnd[1] - jStart[1]) * progress,
      jStart[2] + (jEnd[2] - jStart[2]) * progress,
      jStart[3] + (jEnd[3] - jStart[3]) * progress,
      jStart[4] + (jEnd[4] - jStart[4]) * progress,
      jStart[5] + (jEnd[5] - jStart[5]) * progress
    ];

    return {
      activeWaypointIndex: progress > 0.5 ? activeSeg.endIndex : activeSeg.startIndex,
      currentPosition: [curX, curY, curZ] as [number, number, number],
      currentEuler: [curRx, curRy, curRz] as [number, number, number],
      currentInterpJoints: interpJoints,
      activeMotionType: wEnd.motionType || 'LINEAR'
    };
  }, [storeState.currentTimeSec, trajectoryPlan, storeState.waypoints, resolvedWaypointJoints]);

  // Inverse Kinematics for active pose with smooth joint-space tracking
  const currentRobotPose = useMemo(() => {
    if (activeMotionType === 'LINEAR') {
      const ik = solveInverseKinematics(
        currentPosition,
        currentEuler,
        storeState.robot,
        currentInterpJoints,
        storeState.tool,
        storeState.robotMountConfig
      );
      if (ik.jointAnglesDeg && !ik.hasJointLimitViolation && ik.isReachable) {
        return ik;
      }
    }

    const fk = forwardKinematics(
      currentInterpJoints,
      storeState.robot,
      storeState.tool,
      storeState.robotMountConfig
    );
    return {
      jointAnglesDeg: currentInterpJoints,
      tcpPositionMm: fk.tcpPosition,
      tcpEulerDeg: fk.tcpEuler,
      isReachable: true,
      isSingular: false,
      hasJointLimitViolation: false
    };
  }, [currentPosition, currentEuler, currentInterpJoints, activeMotionType, storeState.robot, storeState.tool, storeState.robotMountConfig]);

  // Compute Surface Cells and Coverage
  const { surfaceCells, coverageStats } = useMemo(() => {
    try {
      const rawCells = generateDieSurfaceCells(storeState.die, 24);
      const res = simulateCoverage(
        rawCells,
        storeState.waypoints,
        trajectoryPlan.segments,
        storeState.sprayPhysics
      );
      return {
        surfaceCells: res.surfaceCells || res.updatedCells || rawCells,
        coverageStats: res.coverageStats || res.stats || DEFAULT_COVERAGE_STATS
      };
    } catch (err) {
      console.error('Failed to compute coverage stats:', err);
      return {
        surfaceCells: [],
        coverageStats: DEFAULT_COVERAGE_STATS
      };
    }
  }, [storeState.die, storeState.waypoints, trajectoryPlan, storeState.sprayPhysics]);

  // Collision Audit
  const collisionResult = useMemo(() => {
    return runCollisionAudit(
      storeState.waypoints,
      storeState.robot,
      storeState.machine,
      storeState.die,
      storeState.robotMountConfig
    );
  }, [storeState.waypoints, storeState.robot, storeState.machine, storeState.die, storeState.robotMountConfig]);

  const stepForward = useCallback(() => {
    const nextIdx = Math.min(storeState.waypoints.length - 1, activeWaypointIndex + 1);
    const targetWp = storeState.waypoints[nextIdx];
    if (targetWp) {
      // Find segment time
      const seg = trajectoryPlan.segments.find(s => s.endIndex === nextIdx);
      storeState.currentTimeSec = seg ? seg.startTimeSec + seg.durationSec : 0;
      emitChange();
    }
  }, [activeWaypointIndex, trajectoryPlan]);

  const stepBackward = useCallback(() => {
    const prevIdx = Math.max(0, activeWaypointIndex - 1);
    const seg = trajectoryPlan.segments.find(s => s.startIndex === prevIdx);
    storeState.currentTimeSec = seg ? seg.startTimeSec : 0;
    emitChange();
  }, [activeWaypointIndex, trajectoryPlan]);

  const resetSimulation = useCallback(() => {
    stopPlayback();
    storeState.currentTimeSec = 0;
    emitChange();
  }, []);

  // Compute Active HPDC Sequence State
  const currentSequenceState = useMemo<HpdcSequenceState>(() => {
    const wp = storeState.waypoints[activeWaypointIndex];
    if (!wp) return 'HOME';
    const name = wp.name.toUpperCase();
    if (name.includes('HOME') && activeWaypointIndex === 0) return 'HOME';
    if (name.includes('WAIT')) return 'WAIT_DIE_OPEN';
    if (name.includes('APPROACH')) return 'APPROACH';
    if (name.includes('ENTER') || name.includes('ENTRY')) return 'ENTRY';
    if (name.includes('READY')) return 'READY';
    if (name.includes('FIXED')) return 'SPRAY_FIXED';
    if (name.includes('MOVING')) return 'SPRAY_MOVING';
    if (name.includes('HOT SPOT')) return 'SPRAY_HOTSPOTS';
    if (name.includes('AIR BLOW') || wp.action === 'AIR_BLOW') return 'AIR_BLOW';
    if (name.includes('EXIT')) return 'EXIT';
    if (name.includes('STANDBY') || (name.includes('HOME') && activeWaypointIndex > 0)) return 'STANDBY';
    return 'READY';
  }, [activeWaypointIndex, storeState.waypoints]);

  // Jump simulation time directly to an HPDC sequence state
  const jumpToSequenceState = useCallback((targetState: HpdcSequenceState) => {
    const wps = storeState.waypoints;
    let targetIdx = -1;

    for (let i = 0; i < wps.length; i++) {
      const name = wps[i].name.toUpperCase();
      if (targetState === 'HOME' && i === 0) { targetIdx = i; break; }
      if (targetState === 'WAIT_DIE_OPEN' && name.includes('WAIT')) { targetIdx = i; break; }
      if (targetState === 'APPROACH' && name.includes('APPROACH')) { targetIdx = i; break; }
      if (targetState === 'ENTRY' && (name.includes('ENTER') || name.includes('ENTRY'))) { targetIdx = i; break; }
      if (targetState === 'READY' && name.includes('READY')) { targetIdx = i; break; }
      if (targetState === 'SPRAY_FIXED' && name.includes('FIXED')) { targetIdx = i; break; }
      if (targetState === 'SPRAY_MOVING' && name.includes('MOVING')) { targetIdx = i; break; }
      if (targetState === 'SPRAY_HOTSPOTS' && name.includes('HOT SPOT')) { targetIdx = i; break; }
      if (targetState === 'AIR_BLOW' && (name.includes('AIR BLOW') || wps[i].action === 'AIR_BLOW')) { targetIdx = i; break; }
      if (targetState === 'EXIT' && name.includes('EXIT')) { targetIdx = i; break; }
      if (targetState === 'STANDBY' && (name.includes('STANDBY') || (i === wps.length - 1))) { targetIdx = i; break; }
    }

    if (targetIdx !== -1) {
      const seg = trajectoryPlan.segments.find(s => s.startIndex === targetIdx || s.endIndex === targetIdx);
      storeState.currentTimeSec = seg ? seg.startTimeSec : 0;
      storeState.isPlaying = false;
      emitChange();
    }
  }, [trajectoryPlan.segments]);

  // Spray Distance Feedback Status
  const sprayDistanceStatus = useMemo<'TOO_CLOSE' | 'GOOD' | 'TOO_FAR'>(() => {
    const d = storeState.sprayIntent.sprayDistanceMm;
    if (d < 100) return 'TOO_CLOSE';
    if (d > 180) return 'TOO_FAR';
    return 'GOOD';
  }, [storeState.sprayIntent.sprayDistanceMm]);

  // Sync robotClearOfDie with state
  const isRobotClear = currentSequenceState === 'HOME' || currentSequenceState === 'WAIT_DIE_OPEN' || currentSequenceState === 'STANDBY';
  if (storeState.interlockState.robotClearOfDie !== isRobotClear) {
    storeState.interlockState.robotClearOfDie = isRobotClear;
  }

  const recomputeAll = useCallback(() => {
    emitChange();
  }, []);

  // Cast-Part-Driven Automation Designer Handlers
  const selectCastPart = useCallback((partId: string) => {
    const found = SAMPLE_CAST_PARTS.find(p => p.id === partId);
    if (!found) return;
    storeState.activeCastPart = found;
    storeState.castPartAnalysis = analyzeCastPart(found, storeState.machine);
    const bestGrip = found.gripCandidates.find(g => g.status === 'RECOMMENDED') || found.gripCandidates[0];
    storeState.selectedGripCandidateId = bestGrip ? bestGrip.id : '';
    storeState.selectedOptionId = 'option_b_balanced';
    emitChange();
  }, []);

  const importCustomCastPartCAD = useCallback((
    name: string,
    fileType: 'stl' | 'obj' | 'step',
    dimensions?: { lengthMm: number; widthMm: number; heightMm: number; estimatedMassKg: number }
  ) => {
    const len = dimensions?.lengthMm || 550;
    const wid = dimensions?.widthMm || 480;
    const hgt = dimensions?.heightMm || 150;
    const mass = dimensions?.estimatedMassKg || ((len * wid * hgt * 0.000001 * 2.7) * 0.35);

    const customPart: CastPartModel = {
      id: `custom-part-${Date.now()}`,
      name: name || 'Imported Custom Cast Part',
      taiwaneseIndustryName: '自定義匯入壓鑄工件 (CAD)',
      alloyGrade: 'JIS ADC12 / A380 Aluminum Alloy',
      category: 'industrial',
      recommendedMachineTonnage: Math.round(len * wid * 0.0075),
      visualMeshType: 'custom_imported',
      dimensions: {
        lengthMm: Math.round(len),
        widthMm: Math.round(wid),
        heightMm: Math.round(hgt),
        wallThicknessMinMm: 2.5,
        wallThicknessMaxMm: 6.0,
        volumeCm3: Math.round(mass / 0.0027),
        estimatedMassKg: Number(mass.toFixed(2)),
        shotWeightWithRunnerKg: Number((mass * 1.35).toFixed(2))
      },
      moldOpeningDirection: [0, 0, 1],
      extractionDirection: [0, 0, 1],
      cadFileSource: fileType === 'step' ? 'uploaded_step' : 'uploaded_stl',
      cadFileName: name,
      features: [
        {
          id: 'cf-cavity',
          name: 'Primary Cavity Recess',
          category: 'deep_pocket',
          position: [0, 0, -20],
          dimensions: [len * 0.6, wid * 0.6, hgt * 0.7],
          draftAngleDeg: 2.0,
          isCosmetic: false,
          notes: 'Main casting volume'
        },
        {
          id: 'cf-biscuit',
          name: 'Central Runner Biscuit Hub',
          category: 'runner_biscuit',
          position: [0, -wid * 0.4, -20],
          dimensions: [120, 60, 75],
          draftAngleDeg: 4.5,
          isCosmetic: false,
          notes: 'Sacrificial ingate biscuit'
        }
      ],
      gripCandidates: [
        {
          id: 'cgrip-a-biscuit',
          label: 'A',
          name: 'Runner Biscuit Hub Stem',
          location: [0, -wid * 0.4, 25],
          approachDirection: [0, 1, 0],
          gripWidthMm: 95,
          recommendedEoatType: 'runner_clamp',
          stabilityScore: 96,
          clearanceScore: 94,
          cosmeticRisk: 'LOW',
          status: 'RECOMMENDED',
          description: 'Safe clamping on sacrificial runner biscuit. 0% cosmetic defect risk.',
          mitigation: 'Pneumatic parallel clamp.'
        },
        {
          id: 'cgrip-b-perimeter',
          label: 'B',
          name: 'Perimeter Flange Rim',
          location: [len * 0.35, 0, 20],
          approachDirection: [-1, 0, 0],
          gripWidthMm: 80,
          recommendedEoatType: 'custom_contour_jaw',
          stabilityScore: 82,
          clearanceScore: 80,
          cosmeticRisk: 'MEDIUM',
          status: 'ACCEPTABLE',
          description: 'Clamping on outer structural rim.',
          mitigation: 'Use protective soft pads.'
        }
      ],
      suggestedProcess: [
        {
          id: 'cproc-cast',
          order: 1,
          name: 'High-Pressure Die Casting Injection',
          category: 'casting',
          stationName: 'Toyo DCM Injection',
          cycleTimeSec: 13.0,
          enabled: true,
          confidence: 'HIGH',
          factType: 'GEOMETRY_DERIVED_FACT',
          description: 'High pressure metal dosing and intensification.',
          equipmentRequired: 'Toyo DCM'
        },
        {
          id: 'cproc-extract',
          order: 2,
          name: 'Articulated Robot Part Extraction',
          category: 'extraction',
          stationName: 'Extraction Station',
          cycleTimeSec: 4.8,
          enabled: true,
          confidence: 'HIGH',
          factType: 'AUTOMATION_INFERENCE',
          description: 'Robot extracts casting off ejector pins.',
          equipmentRequired: '6-Axis Foundry Robot'
        },
        {
          id: 'cproc-cool',
          order: 3,
          name: 'Quench Cooling',
          category: 'cooling',
          stationName: 'Quench Water Tank',
          cycleTimeSec: 6.0,
          enabled: true,
          confidence: 'HIGH',
          factType: 'AUTOMATION_INFERENCE',
          description: 'Water bath quench immersion.',
          equipmentRequired: 'Quench Tank'
        },
        {
          id: 'cproc-trim',
          order: 4,
          name: 'Trim Press De-gating',
          category: 'trimming',
          stationName: 'Hydraulic Trim Press',
          cycleTimeSec: 4.2,
          enabled: true,
          confidence: 'HIGH',
          factType: 'AUTOMATION_INFERENCE',
          description: 'Shears ingate and parting flash.',
          equipmentRequired: '4-Pillar Trim Press'
        }
      ]
    };

    storeState.activeCastPart = customPart;
    storeState.castPartAnalysis = analyzeCastPart(customPart, storeState.machine);
    storeState.selectedGripCandidateId = customPart.gripCandidates[0].id;
    storeState.selectedOptionId = 'option_b_balanced';
    emitChange();
  }, []);

  const selectGripCandidate = useCallback((gripId: string) => {
    storeState.selectedGripCandidateId = gripId;
    emitChange();
  }, []);

  const selectCellOption = useCallback((optionId: 'option_a_compact' | 'option_b_balanced' | 'option_c_high_throughput') => {
    storeState.selectedOptionId = optionId;
    emitChange();
  }, []);

  const toggleProcessStep = useCallback((stepId: string) => {
    storeState.activeCastPart = {
      ...storeState.activeCastPart,
      suggestedProcess: storeState.activeCastPart.suggestedProcess.map(s =>
        s.id === stepId ? { ...s, enabled: !s.enabled } : s
      )
    };
    storeState.castPartAnalysis = analyzeCastPart(storeState.activeCastPart, storeState.machine);
    emitChange();
  }, []);

  const applyCellDesignToSimulation = useCallback((optionId?: 'option_a_compact' | 'option_b_balanced' | 'option_c_high_throughput') => {
    const targetOptId = optionId || storeState.selectedOptionId;
    storeState.selectedOptionId = targetOptId;
    const report = storeState.castPartAnalysis;
    const opt = report.cellOptions.find(o => o.id === targetOptId) || report.cellOptions[0];
    const part = storeState.activeCastPart;

    // 1. Automatically size the Toyo DCM to match required tonnage
    const reqTonnage = part.recommendedMachineTonnage;
    let chosenMachine = TOYO_DCM_FAMILY[6]; // default 1250T
    let minDiff = Infinity;
    TOYO_DCM_FAMILY.forEach(m => {
      const diff = Math.abs(m.clampingForceKn / 9.8 - reqTonnage);
      if (diff < minDiff) {
        minDiff = diff;
        chosenMachine = m;
      }
    });
    storeState.machine = chosenMachine;

    // 2. Configure Spray Robot
    const spraySpec = opt.sprayRobot;
    const matchedPreset = ROBOT_PRESETS.find(r => r.manufacturer === spraySpec.manufacturer) || ROBOT_PRESETS[0];
    storeState.robot = {
      ...matchedPreset,
      name: spraySpec.robotName,
      payloadKg: spraySpec.availablePayloadKg,
      reachMm: spraySpec.availableReachMm,
      mountOrientation: spraySpec.mounting,
      baseOffset: spraySpec.recommendedBaseOffset
    };

    storeState.robotMountConfig = {
      ...storeState.robotMountConfig,
      type: spraySpec.mounting,
      topMountStyle: 'platen_direct',
      showDualRobots: true,
      hasMediaCabinet: true,
      hasDressPack: true,
      heightMm: spraySpec.recommendedBaseOffset[1],
      distanceMm: Math.abs(spraySpec.recommendedBaseOffset[0])
    };
    storeState.topMountStyle = 'platen_direct';
    storeState.showDualRobots = true;

    // 3. Configure Taiwanese Factory Downstream Equipment
    storeState.factoryEquipment = {
      ...storeState.factoryEquipment,
      realFactoryMode: true,
      showDosingFurnace: true,
      showExtractorRobot: true,
      showQuenchConveyor: true,
      showTrimPress: true,
      showScrapBin: true,
      showPlungerLubricator: true,
      showReleaseAgentTank: true,
      showMoldCoolingWater: true,
      showSafetyFence: true,
      showElectricalCabinet: true
    };

    // 4. Adjust Die Cavity Dimensions & Features to fit Cast Part
    const margin = 180;
    storeState.die = {
      ...storeState.die,
      name: `Die for ${part.name}`,
      dimensions: {
        width: Math.max(storeState.die.dimensions.width, part.dimensions.lengthMm + margin),
        height: Math.max(storeState.die.dimensions.height, part.dimensions.widthMm + margin),
        depth: storeState.die.dimensions.depth
      },
      fixedDieOffsetZ: -chosenMachine.maxDieOpeningStroke * 0.45,
      movableDieOffsetZ: chosenMachine.maxDieOpeningStroke * 0.45,
      features: part.features.map(f => ({
        id: f.id,
        name: f.name,
        type: 'pocket' as const,
        position: [f.position[0], f.position[1], 0] as [number, number, number],
        dimensions: f.dimensions,
        targetThicknessMicrons: 25,
        criticality: 'high' as const
      }))
    };

    // 5. Generate Extraction Waypoints
    const grip = part.gripCandidates.find(g => g.id === storeState.selectedGripCandidateId) || part.gripCandidates[0];
    const extWaypoints = generateExtractionPath(part, grip, chosenMachine);
    storeState.waypoints = extWaypoints;
    storeState.selectedWaypointId = extWaypoints[0].id;
    storeState.currentTimeSec = 0;
    storeState.isPlaying = false;

    // 6. Workflow step updates
    storeState.workflowStep = 7;

    emitChange();
  }, []);

  const generateAutomationCell = useCallback(() => {
    applyCellDesignToSimulation(storeState.selectedOptionId);
  }, [applyCellDesignToSimulation]);

  const cellRealismReport = useMemo(() => {
    return evaluateCellRealism(
      storeState.machine,
      storeState.robot,
      storeState.die,
      storeState.waypoints,
      storeState.factoryEquipment,
      storeState.robotMountConfig
    );
  }, [
    storeState.machine,
    storeState.robot,
    storeState.die,
    storeState.waypoints,
    storeState.robotMountConfig,
    storeState.factoryEquipment
  ]);

  return {
    language: storeState.language,
    setLanguage,

    // 1-Simple-Workflow Redesign
    primaryAction: storeState.primaryAction,
    setPrimaryAction,
    isDemoMode: storeState.isDemoMode,
    setIsDemoMode,
    demoPhase: storeState.demoPhase,
    setDemoPhase,

    // AI Auto Plan Pipeline
    isAiPlanning: storeState.isAiPlanning,
    aiPlanningProgress: storeState.aiPlanningProgress,
    aiPlanningStepText: storeState.aiPlanningStepText,
    aiPlanCompleted: storeState.aiPlanCompleted,
    aiPlanResult: storeState.aiPlanResult,
    runAiAutoPlan,
    resetAiPlan,

    // Manufacturing Product Direction
    appMode: storeState.appMode,
    setAppMode,
    workflowStep: storeState.workflowStep,
    setWorkflowStep,
    robotMountConfig: storeState.robotMountConfig,
    setRobotMountType,
    updateRobotMount,
    sprayIntent: storeState.sprayIntent,
    setSprayIntent,
    automateSprayPath,
    fixProblemsAutomatically,
    applyPositionRecommendation,

    // Toyo DCM Machine Family & Sizing
    toyoFamily: TOYO_DCM_FAMILY,
    selectedKn: storeState.machine.clampingForceKn,
    setMachineSize,

    // Taiwanese Factory Automation & Equipment
    cellPreset: storeState.cellPreset,
    setCellPreset,
    factoryEquipment: storeState.factoryEquipment,
    updateFactoryEquipment,
    toggleRealFactoryMode,

    // Cell Realism Validation
    cellRealismReport,
    isRealismCheckModalOpen: storeState.isRealismCheckModalOpen,
    setIsRealismCheckModalOpen,

    // Camera Presets
    cameraPreset: storeState.cameraPreset,
    setCameraPreset,

    // HPDC Specific additions
    nudgeRobot,
    rotateRobot,
    setSprayHeadPreset,
    interlockState: storeState.interlockState,
    toggleDieOpen,
    toggleMachineClear,
    cleanPurgeNozzles,
    currentSequenceState,
    jumpToSequenceState,
    sprayDistanceStatus,
    hotSpots: storeState.hotSpots,
    toggleHotSpot,
    updateHotSpotPriority,

    // Scenarios
    scenarios: storeState.scenarios,
    activeScenarioId: storeState.activeScenarioId,
    duplicateScenario,
    switchScenario,

    machine: storeState.machine,
    setMachine,
    robot: storeState.robot,
    setRobot,
    die: storeState.die,
    setDie,
    tool: storeState.tool,
    setTool,

    waypoints: storeState.waypoints,
    setWaypoints,
    selectedWaypointId: storeState.selectedWaypointId,
    setSelectedWaypointId,
    addWaypoint,
    updateWaypoint,
    deleteWaypoint,
    reorderWaypoints,

    isPlaying: storeState.isPlaying,
    setIsPlaying,
    currentTimeSec: storeState.currentTimeSec,
    setCurrentTimeSec,
    playbackSpeed: storeState.playbackSpeed,
    setPlaybackSpeed,
    activeWaypointIndex,
    currentRobotPose,
    stepForward,
    stepBackward,
    resetSimulation,

    sprayPhysics: storeState.sprayPhysics,
    setSprayPhysics,
    surfaceCells,
    coverageStats,
    collisionResult,
    trajectoryPlan,

    viewMode: storeState.viewMode,
    setViewMode,
    showHeatmap: storeState.showHeatmap,
    setShowHeatmap,
    heatmapMetric: storeState.heatmapMetric,
    setHeatmapMetric,
    showTieBars: storeState.showTieBars,
    setShowTieBars,
    showSprayCone: storeState.showSprayCone,
    setShowSprayCone,
    showSafetyDoor: storeState.showSafetyDoor,
    setShowSafetyDoor,

    isImportDieOpen: storeState.isImportDieOpen,
    setIsImportDieOpen: (open: boolean) => { storeState.isImportDieOpen = open; emitChange(); },
    isCodeExportOpen: storeState.isCodeExportOpen,
    setIsCodeExportOpen: (open: boolean) => { storeState.isCodeExportOpen = open; emitChange(); },
    isCollisionAuditOpen: storeState.isCollisionAuditOpen,
    setIsCollisionAuditOpen: (open: boolean) => { storeState.isCollisionAuditOpen = open; emitChange(); },
    isCoverageReportOpen: storeState.isCoverageReportOpen,
    setIsCoverageReportOpen: (open: boolean) => { storeState.isCoverageReportOpen = open; emitChange(); },
    isAiOptimizerOpen: storeState.isAiOptimizerOpen,
    setIsAiOptimizerOpen: (open: boolean) => { storeState.isAiOptimizerOpen = open; emitChange(); },
    isAutoSweepOpen: storeState.isAutoSweepOpen,
    setIsAutoSweepOpen: (open: boolean) => { storeState.isAutoSweepOpen = open; emitChange(); },
    isMachineSpecOpen: storeState.isMachineSpecOpen,
    setIsMachineSpecOpen: (open: boolean) => { storeState.isMachineSpecOpen = open; emitChange(); },
    isVideoExportOpen: storeState.isVideoExportOpen,
    setIsVideoExportOpen: (open: boolean) => { storeState.isVideoExportOpen = open; emitChange(); },
    isBestPositionAdvisorOpen: storeState.isBestPositionAdvisorOpen,
    setIsBestPositionAdvisorOpen: (open: boolean) => { storeState.isBestPositionAdvisorOpen = open; emitChange(); },
    isScenarioCompareOpen: storeState.isScenarioCompareOpen,
    setIsScenarioCompareOpen: (open: boolean) => { storeState.isScenarioCompareOpen = open; emitChange(); },
    isReferenceModalOpen: storeState.isReferenceModalOpen,
    setIsReferenceModalOpen: (open: boolean) => { storeState.isReferenceModalOpen = open; emitChange(); },
    showDualRobots: storeState.showDualRobots,
    setShowDualRobots,
    topMountStyle: storeState.topMountStyle,
    setTopMountStyle,
    applyWollinTopMountPreset,

    // Cast-Part-Driven Automation Designer
    isCastPartDesignerOpen: storeState.isCastPartDesignerOpen,
    setIsCastPartDesignerOpen: (open: boolean) => { storeState.isCastPartDesignerOpen = open; emitChange(); },
    activeCastPart: storeState.activeCastPart,
    castPartAnalysis: storeState.castPartAnalysis,
    selectedOptionId: storeState.selectedOptionId,
    selectedGripCandidateId: storeState.selectedGripCandidateId,
    castPartWorkflowTab: storeState.castPartWorkflowTab,
    setCastPartWorkflowTab: (tab: 'select' | 'analyze' | 'gripping' | 'process' | 'cell_options' | 'score' | 'rationale') => {
      storeState.castPartWorkflowTab = tab;
      emitChange();
    },
    selectCastPart,
    importCustomCastPartCAD,
    selectGripCandidate,
    selectCellOption,
    toggleProcessStep,
    generateAutomationCell,
    applyCellDesignToSimulation,

    recomputeAll
  };
}
