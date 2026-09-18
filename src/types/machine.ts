export type ToyoModelCode =
  | 'BD-125V7EX'
  | 'BD-200V7EX'
  | 'BD-250V7EX'
  | 'BD-350V7EX'
  | 'BD-500V7EX'
  | 'BD-650V7EX'
  | 'BD-800V7EX'
  | 'BD-1000V7EX'
  | 'BD-1250V7EX';

export interface DieCastingMachine {
  id: string;
  name: string;
  modelCode?: ToyoModelCode;
  modelSeries?: string;
  manufacturer?: 'TOYO' | 'OTHER';
  clampingForceKn: number;     // 1250 to 12500 kN
  clampingForceTons: number;   // 125 to 1250 Tons
  tieBarClearanceH: number;    // mm (horizontal)
  tieBarClearanceV: number;    // mm (vertical)
  tieBarDiameter: number;      // mm
  platenWidth: number;         // mm (Stationary)
  platenHeight: number;        // mm (Stationary)
  movablePlatenWidth?: number; // mm (Movable)
  movablePlatenHeight?: number;// mm (Movable)
  maxDieOpeningStroke: number; // mm (die stroke max)
  minDieHeight: number;        // mm
  maxDieHeight: number;        // mm
  minDieThickness?: number;    // mm
  maxDieThickness?: number;    // mm
  ejectorStroke: number;       // mm
  injectionAxisOffsetY: number;// mm (non-center injection offset)
  safetyEnclosureDepth: number;// mm
  // Extended Toyo Specifications
  plungerLubricatorModel?: string; // 'DM05/DC-TY-B1' | 'DM10/DC-TY-B1' | 'L-15'
  plungerStroke?: number;      // mm
  standardPlungerDia?: number; // mm
  machineLengthMm?: number;    // mm
  machineWidthMm?: number;     // mm
  machineHeightMm?: number;    // mm
  machineWeightTons?: number;  // metric tons (e.g. 5.5, 8, 19, 32, 66)
  dryCycleTimeSec?: number;    // dry cycle time (s)
  controlSystem?: string;      // 'SYSTEM 700EX'
  pumpMotorPower?: string;     // e.g. '37kW 6P AC200V'
  oilTankCapacityL?: number;   // liters
}

export interface MachineState {
  currentDieOpeningMm: number; // 0 (closed) to maxDieOpeningStroke (fully open)
  ejectorExtendedMm: number;
  safetyDoorOpen: boolean;
  robotInterlockClear: boolean;
}
