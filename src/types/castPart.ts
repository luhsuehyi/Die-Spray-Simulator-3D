/**
 * Types for Cast-Part-Driven Automation Designer
 */

import { RobotMountType } from './robot';

export type ConfidenceLevel = 'HIGH' | 'MEDIUM' | 'LOW';

export type FactType = 'GEOMETRY_DERIVED_FACT' | 'PRESET_ASSUMPTION' | 'AUTOMATION_INFERENCE' | 'ENGINEER_CONFIRMATION_REQUIRED';

export interface ConfidenceItem<T> {
  value: T;
  confidence: ConfidenceLevel;
  type: FactType;
  rationale: string;
}

export interface CastPartDimensions {
  lengthMm: number;  // X
  widthMm: number;   // Y
  heightMm: number;  // Z
  wallThicknessMinMm: number;
  wallThicknessMaxMm: number;
  volumeCm3: number;
  estimatedMassKg: number; // Aluminum ~2.7 g/cm3
  shotWeightWithRunnerKg: number; // includes biscuit & runners ~ 1.25x - 1.4x
}

export interface GeometricFeature {
  id: string;
  name: string;
  category: 'planar_surface' | 'deep_pocket' | 'rib' | 'boss' | 'through_hole' | 'undercut' | 'thin_section' | 'parting_line' | 'runner_biscuit';
  position: [number, number, number]; // [x, y, z] relative to part center
  dimensions: [number, number, number]; // [w, h, d]
  draftAngleDeg: number;
  isCosmetic: boolean;
  notes: string;
}

export interface GripCandidate {
  id: string;
  label: string; // 'A' | 'B' | 'C'
  name: string;
  location: [number, number, number]; // [x, y, z] mm
  approachDirection: [number, number, number]; // e.g. [0, 1, 0] or [1, 0, 0]
  gripWidthMm: number;
  recommendedEoatType: '2_finger_parallel' | '3_finger_centering' | 'custom_contour_jaw' | 'vacuum_planar_cup' | 'runner_clamp';
  stabilityScore: number; // 0 - 100
  clearanceScore: number; // 0 - 100
  cosmeticRisk: 'LOW' | 'MEDIUM' | 'HIGH';
  status: 'RECOMMENDED' | 'ACCEPTABLE' | 'NOT_RECOMMENDED';
  description: string;
  mitigation?: string;
}

export interface ManufacturingProcessStep {
  id: string;
  order: number;
  name: string;
  category: 'casting' | 'extraction' | 'separation' | 'cooling' | 'trimming' | 'deburring' | 'inspection' | 'packaging';
  stationName: string;
  cycleTimeSec: number;
  enabled: boolean;
  confidence: ConfidenceLevel;
  factType: FactType;
  description: string;
  equipmentRequired: string;
}

export interface RobotSelectionCandidate {
  robotId: string;
  robotName: string;
  manufacturer: string;
  role: 'EXTRACTION' | 'SPRAY';
  mounting: RobotMountType;
  recommendedBaseOffset: [number, number, number];
  requiredReachMm: number;
  availableReachMm: number;
  reachabilityPercent: number;
  requiredPayloadKg: number;
  availablePayloadKg: number;
  utilizationPercent: number;
  collisionMarginMm: number;
  rationale: string;
}

export interface DownstreamEquipmentRecommendation {
  id: string;
  name: string;
  taiwaneseIndustryName: string;
  category: 'cooling' | 'trim' | 'inspection' | 'finishing' | 'scrap';
  suggestedPosition: [number, number, number];
  dimensions: [number, number, number];
  isSuggested: boolean;
  enabled: boolean;
  whySuggested: string;
  confidence: ConfidenceLevel;
}

export interface CellDesignScore {
  overallScore: number; // 0 - 100
  reachability: number;
  collisionSafety: number;
  partAccessibility: number;
  sprayCoverage: number;
  cycleTimeScore: number;
  cellCompactness: number;
  operatorAccessibility: number;
  maintenanceAccessibility: number;
  warnings: string[];
  reachabilityScore?: number;
  clearanceSafetyScore?: number;
  thermalEfficiencyScore?: number;
  footprintScore?: number;
  cosmeticProtectionScore?: number;
  taiwaneseStandardCompliance?: number;
  capexRoiScore?: number;
}

export interface ConfidenceCardItem {
  key: string;
  label: string;
  value: string;
  tier: 'GEOMETRY_DERIVED_FACT' | 'PRESET_ASSUMPTION' | 'AUTOMATION_INFERENCE' | 'ENGINEER_CONFIRMATION_REQUIRED';
  rationale?: string;
}

export interface WhyReasonItem {
  category: string;
  recommendation: string;
  rationale: string;
}

export interface CellDesignOption {
  id: 'option_a_compact' | 'option_b_balanced' | 'option_c_high_throughput';
  title: string;
  subtitle: string;
  badge: string;
  description: string;
  footprintM2: number;
  estimatedCycleTimeSec: number;
  sprayRobot: RobotSelectionCandidate;
  extractionRobot: RobotSelectionCandidate;
  scores: CellDesignScore;
  recommendedDownstream: DownstreamEquipmentRecommendation[];
  whyThisCell: string[];
  pros: string[];
  cons: string[];
  tagline?: string;
  cycleTimeTotalSec?: number;
  throughputPph?: number;
  cellFootprintMeters?: [number, number];
  extractorRobot?: RobotSelectionCandidate;
  downstreamEquipment?: DownstreamEquipmentRecommendation[];
  budgetCategory?: string;
  plainLanguageRationale?: string;
  whyReasons?: WhyReasonItem[];
}

export interface CastPartModel {
  id: string;
  name: string;
  taiwaneseIndustryName: string;
  alloyGrade: string; // e.g. A380 / ADC12 / AlSi10MnMg
  category: 'automotive' | 'ev_powertrain' | 'structural_chassis' | 'telecom_5g' | 'industrial';
  dimensions: CastPartDimensions;
  features: GeometricFeature[];
  gripCandidates: GripCandidate[];
  recommendedMachineTonnage: number;
  moldOpeningDirection: [number, number, number];
  extractionDirection: [number, number, number];
  suggestedProcess: ManufacturingProcessStep[];
  cadFileSource?: 'preset' | 'uploaded_stl' | 'uploaded_step';
  cadFileName?: string;
  visualMeshType: 'transmission_case' | 'ev_motor_casing' | 'shock_tower' | 'heatsink_enclosure' | 'steering_knuckle' | 'battery_tray' | 'generic_hpdc' | 'custom_imported';
}

export interface CastPartAnalysisReport {
  part: CastPartModel;
  facts: {
    dimensions: ConfidenceItem<CastPartDimensions>;
    moldDirection: ConfidenceItem<string>;
    extractionDirection: ConfidenceItem<string>;
    tonnageRequired: ConfidenceItem<number>;
    thinWallCount: ConfidenceItem<number>;
    deepPocketCount: ConfidenceItem<number>;
    undercutCoreSlides: ConfidenceItem<number>;
  };
  inferences: {
    suggestedGrip: ConfidenceItem<GripCandidate>;
    suggestedEoat: ConfidenceItem<string>;
    sprayStrategy: ConfidenceItem<string>;
    coolingMethod: ConfidenceItem<string>;
    trimmingMethod: ConfidenceItem<string>;
  };
  engineerConfirmationsRequired: string[];
  cellOptions: CellDesignOption[];
  activeOptionId: 'option_a_compact' | 'option_b_balanced' | 'option_c_high_throughput';
  confidenceItems: ConfidenceCardItem[];
}
