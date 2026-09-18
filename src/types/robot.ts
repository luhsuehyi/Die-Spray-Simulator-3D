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

export type SprayHeadType =
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
}

export interface ToolCenterPoint {
  x: number; // offset mm
  y: number;
  z: number;
  rx: number; // tool orientation deg
  ry: number;
  rz: number;
  manifoldType: 'single_nozzle' | 'dual_sided_matrix' | 'multi_head_linear' | 'micro_spray';
  sprayHeadType?: SprayHeadType;
  nozzleCount: number;
  manifoldWidthMm: number;
  weightKg: number;
  nozzles?: SprayNozzleConfig[];
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
