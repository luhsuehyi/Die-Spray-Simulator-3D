export type RobotManufacturer = 'YASKAWA' | 'FANUC' | 'ABB' | 'KUKA' | 'LINEAR_RECIPROCATOR';

export type RobotMountType = 'top' | 'side' | 'floor' | 'rear' | 'shelf' | 'top_machine_mount' | 'custom';
export type TopMountStyle = 'platen_direct' | 'overhead_gantry';

export type CellPresetType = 'basic_spray_cell' | 'automated_casting_cell' | 'full_automated_cell';

export interface FactoryEquipmentConfig {
  realFactoryMode: boolean;
  showDosingFurnace: boolean;     // Stroke dosing furnace (頂出式定量爐)
  showExtractorRobot: boolean;     // Part removal robot on movable platen or floor (取件機器人)
  showQuenchConveyor: boolean;     // Cooling water bath & wire-mesh conveyor (冷卻水槽輸送帶)
  showTrimPress: boolean;          // 4-pillar hydraulic trim press (油壓切邊機)
  showScrapBin: boolean;           // Runner & biscuit scrap bin (廢料回爐箱)
  showPlungerLubricator: boolean;  // Toyo DM05/DM10/L-15 plunger lubricator (料管潤滑機)
  showReleaseAgentTank: boolean;   // Dosing & mixing pressurized lube tank (離型劑調配供料系統)
  showMoldCoolingWater: boolean;   // Water manifold with flow meters (模具冷卻水排與模溫機)
  showSafetyFence: boolean;        // Interlocked perimeter safety fencing (安全圍籬與互鎖門)
  showElectricalCabinet: boolean;  // Toyo SYSTEM 700EX cabinet & console (電控箱與操作面板)
}

export interface CellRealismItem {
  category: 'mounting' | 'clearance' | 'kinematics' | 'utilities' | 'workflow';
  title: string;
  status: 'PASS' | 'WARNING' | 'ERROR';
  description: string;
}

export interface CellRealismReport {
  overallStatus: 'PASS' | 'WARNING' | 'ERROR';
  score: number; // 0 - 100
  overallScore: number;
  isViableRealCell: boolean;
  categoryScores: {
    mountingScore: number;
    clearanceScore: number;
    equipmentScore: number;
    utilitiesScore: number;
  };
  issues: { description: string; mitigation: string }[];
  recommendations: string[];
  items: CellRealismItem[];
}

export interface RobotMountConfig {
  type: RobotMountType;
  topMountStyle?: TopMountStyle; // 'platen_direct' (Wollin style on platen deck) vs 'overhead_gantry'
  showDualRobots?: boolean; // Show second extractor robot on movable platen (Reference Image 1)
  hasMediaCabinet?: boolean; // Wollin dosing & media supply cabinet
  hasDressPack?: boolean; // Heavy black flexible hose conduit
  distanceMm: number;
  heightMm: number;
  lateralMm: number;
  rotationDeg: number;
}

export interface JointLimit {
  minDeg: number;
  maxDeg: number;
  maxVelocityDegPerSec: number;
}

export interface DHParameter {
  a: number;     // Link length (mm)
  alpha: number; // Link twist (radians)
  d: number;     // Link offset (mm)
  thetaOffset: number; // Joint angle offset (radians)
}

export interface RobotModelSpec {
  id: string;
  name: string;
  modelName?: string;
  manufacturer: RobotManufacturer;
  payloadKg: number;
  reachMm: number;
  repeatabilityMm: number;
  degreesOfFreedom: number;
  jointLimits: JointLimit[];
  dhParams: DHParameter[];
  baseOffset: [number, number, number]; // [x, y, z] relative to machine cell origin
  mountOrientation: 'floor' | 'shelf' | 'top_machine_mount' | 'top' | 'side' | 'rear' | 'custom';
}

export type EoatType = 'MONOBLOCK' | 'MODULAR' | 'MATRIX' | 'MICRO_DOSING';

export type SprayHeadType =
  | 'MONOBLOCK'
  | 'MODULAR'
  | 'MATRIX'
  | 'MICRO_DOSING'
  | 'dual_sided'
  | 'contour_frame'
  | 'modular_extension'
  | 'micro_spray'
  | 'conventional_water'
  | 'hybrid_head';

export interface SprayNozzleConfig {
  id: string;
  name: string;
  offsetMm: [number, number, number]; // [x, y, z] relative to tool TCP
  directionVector: [number, number, number]; // [dx, dy, dz]
  sprayAngleDeg: number;
  type: 'lube' | 'air' | 'combined';
  flowRatio: number; // 0.1 to 1.5
  sprayWidthMm: number;
  rotationDeg?: number; // visual tilt/rotation
  isAdjustable?: boolean;
  swivelAngleDeg?: number;
}

export interface FluidAirSupplyConfig {
  lubePressure: string;
  airPressure: string;
  lubeFlowRate: string;
  airConsumptionNlPerMin: number;
  connectionInterfaces: string;
  lubricantPressureBar?: number;
  airPressureBar?: number;
  antiDripSuckBack?: boolean;
  airKnifeIntegrated?: boolean;
}

export interface ValveControlConfig {
  valveType: 'solenoid_pwm' | 'pneumatic_pinch' | 'proportional_needle' | 'piezo_pulse';
  responseFrequencyHz?: number;
  antiDripSuckBack: boolean;
  individualNozzleControl: boolean;
  independentAirLubeSequencing: boolean;
  zones?: Array<{
    id: string;
    name: string;
    nozzleIds: string[];
    targetFace: 'FIXED_DIE' | 'MOVABLE_DIE' | 'BOTH';
  }>;
}

export interface EOATSpec {
  id: string;
  type: EoatType;
  name: string;
  subtitle: string;
  category: string;
  description: string;
  weightKg: number;
  dimensionsMm: {
    width: number;
    height: number;
    depth: number;
    clearanceRadius: number;
  };
  mountingInterface: string; // e.g. "ISO 9409-1-100-6-M8"
  fluidMode: 'internal_cross_drilled' | 'modular_twin_fluid' | 'matrix_array' | 'mql_micro_pulse';
  fluidModeLabel: string;
  sprayPattern: 'flat_fan' | 'full_cone' | 'wide_matrix' | 'micro_aerosol_pulse';
  sprayPatternLabel: string;
  coverageWidthMm: number;
  adjustability: 'fixed_drilled' | 'independently_adjustable' | 'fixed_grid' | 'precision_fixed';
  adjustabilityLabel: string;
  nozzleAdjustabilityDetails: string;
  nozzleCount: number;
  nozzleLayout: string;
  nozzles: SprayNozzleConfig[];
  operatingPressureBar: {
    lubeMin: number;
    lubeMax: number;
    airMin: number;
    airMax: number;
  };
  fluidAirSupply: FluidAirSupplyConfig;
  valveControls?: ValveControlConfig;
  cycleTimeAdvantageSec: number;
  cycleTimeNote: string;
  costTier: 'STANDARD' | 'MID_RANGE' | 'PREMIUM' | 'HIGH_END';
  costTierLabel: string;
  maintenanceComplexity: 'LOW' | 'MEDIUM' | 'HIGH';
  maintenanceNotes: string;
  keyFeatures: string[];
  recommendedDcmRangeTons: [number, number];
  defaultSprayDistanceMm: number;
  dropletSizeUm: number;
  lubeSavingsPercent: number;
}

export interface ToolCenterPoint {
  x: number; // offset mm
  y: number;
  z: number;
  rx: number; // tool orientation deg
  ry: number;
  rz: number;
  manifoldType: 'single_nozzle' | 'dual_sided_matrix' | 'multi_head_linear' | 'micro_spray' | 'monoblock' | 'modular_frame' | 'matrix_grid' | 'micro_dosing';
  sprayHeadType?: SprayHeadType;
  eoatType?: EoatType;
  eoatSpec?: EOATSpec;
  nozzleCount: number;
  manifoldWidthMm: number;
  weightKg: number;
  dimensions?: {
    width: number;
    height: number;
    depth: number;
    clearanceRadius: number;
  };
  mountingInterface?: string;
  nozzles?: SprayNozzleConfig[];
  fluidAirSupply?: FluidAirSupplyConfig;
  valveControls?: ValveControlConfig;
  microSpraySettings?: {
    fineSpray: boolean;
    sprayWidthMm: number;
    applicationRateMlPerSec: number;
  };
  conventionalSettings?: {
    liquidFlowMlPerSec: number;
    airPressureBar: number;
    sprayWidthMm: number;
  };
}

export type CellCyclePhase =
  | '01_MOLD_CLOSE'
  | '02_INJECTION'
  | '03_MOLD_OPEN'
  | '04_SPRAY_LUBE'
  | '05_PART_EXTRACTION'
  | '06_CYCLE_RESET';

export interface CellCycleConfig {
  moldCloseTimeSec: number;
  injectionDwellTimeSec: number;
  moldOpenTimeSec: number;
  sprayLubeTimeSec: number;
  partExtractionTimeSec: number;
  cycleResetTimeSec: number;
  platenOpenDistanceMm: number;
  clampingForceTons: number;
}

export type HpdcSequenceState =
  | 'HOME'
  | 'WAIT_DIE_OPEN'
  | 'APPROACH'
  | 'ENTRY'
  | 'READY'
  | 'SPRAY_FIXED'
  | 'SPRAY_MOVING'
  | 'SPRAY_HOTSPOTS'
  | 'AIR_BLOW'
  | 'EXIT'
  | 'STANDBY';

export interface MachineInterlockState {
  dieOpen: boolean;
  machineClear: boolean;
  castingEjected: boolean;
  robotClearOfDie: boolean;
  emergencyStop: boolean;
}

export interface HotSpotDefinition {
  id: string;
  name: string;
  type: 'biscuit' | 'runner' | 'main_gate' | 'thick_section' | 'core_pin' | 'slide' | 'custom';
  location: [number, number, number];
  thermalPriority: 'NORMAL' | 'HOT' | 'VERY HOT';
  extraCoolingRequired: boolean;
  extraPasses: number;
  slowerSpeedFactor: number;
  surfaceAreaMm2?: number;
}

export interface RobotPose {
  jointAnglesDeg: [number, number, number, number, number, number];
  tcpPositionMm: [number, number, number];
  tcpEulerDeg: [number, number, number];
  isReachable: boolean;
  isSingular: boolean;
  hasJointLimitViolation: boolean;
  violatedJointIndex?: number;
}
