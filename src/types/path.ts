export type MotionType = 'LINEAR' | 'JOINT' | 'SPLINE';
export type SprayActionType = 'NONE' | 'LUBE_SPRAY' | 'AIR_BLOW' | 'LUBE_AND_AIR' | 'MICRO_PURGE';
export type TargetDieFace = 'FIXED_DIE' | 'MOVABLE_DIE' | 'BOTH' | 'TRANSIT';

export interface Waypoint {
  id: string;
  index: number;
  name: string;
  // Position in robot world coordinates (mm)
  x: number;
  y: number;
  z: number;
  // Tool orientation (Euler angles in degrees)
  rx: number;
  ry: number;
  rz: number;
  // Kinematics & motion parameters
  motionType: MotionType;
  speed: number; // mm/s (e.g. 50 - 1500 mm/s)
  acceleration: number; // mm/s^2
  blendRadius: number; // zone / blend radius in mm (e.g. 0 to 50 mm)
  dwellTimeSec: number; // dwell/pause time in seconds

  // Process & Spray parameters
  action: SprayActionType;
  targetFace: TargetDieFace;
  lubePressureBar: number; // bar (e.g. 2.0 - 5.0 bar)
  airPressureBar: number;  // bar (e.g. 3.0 - 6.0 bar)
  flowRateMlPerSec: number; // ml/s
  nozzleFanAngleDeg: number; // nozzle spray spread angle in deg (e.g. 45° - 80°)
  standoffDistanceMm: number; // estimated distance to mold surface
  interlockWait?: string;

  // Optional cached calculated data
  isValidKinematics?: boolean;
  jointAnglesDeg?: [number, number, number, number, number, number];
  collisionFlag?: boolean;
}

export interface TrajectorySegment {
  startIndex: number;
  endIndex: number;
  startTimeSec: number;
  durationSec: number;
  distanceMm: number;
  action: SprayActionType;
  points: [number, number, number][]; // sampled interpolation points for 3D visualization
}

export interface TrajectoryPlan {
  totalDurationSec: number;
  totalLubeVolumeMl: number;
  totalAirVolumeLiters: number;
  cycleTimeSec: number;
  sprayTimeSec: number;
  airBlowTimeSec: number;
  transitTimeSec: number;
  waypoints: Waypoint[];
  segments: TrajectorySegment[];
}
