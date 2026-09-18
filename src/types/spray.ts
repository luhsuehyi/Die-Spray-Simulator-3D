export interface SprayPhysicsParams {
  dilutionRatio: number; // e.g. 1:80 or 1:120 (ratio of water to release agent concentrate)
  lubeTemperatureCelsius: number; // typically 20 - 30 °C
  atomizationAirFlowNm3PerMin: number; // air volume
  dropletSauterMeanDiameterUm: number; // SMD / D32 droplet size in microns (e.g. 35 - 75 µm)
  sprayPattern: 'full_cone' | 'flat_fan' | 'hollow_cone' | 'matrix_micro';
  impingementEfficiency: number; // 0.6 to 0.95 depending on distance and angle
  leidenfrostTempCelsius: number; // ~220 - 240 °C where Leidenfrost vapor film forms
}

export interface SprayCoverageStats {
  fixedDieCoveragePercent: number;
  movableDieCoveragePercent: number;
  averageThicknessMicrons: number;
  minThicknessMicrons: number;
  maxThicknessMicrons: number;
  uniformityIndex: number; // 0.0 to 1.0 (1.0 is perfectly uniform)
  drySpotAreaMm2: number;
  overSprayVolumeMl: number;
  wastedAgentPercent: number;
  averageTempReductionCelsius: number;
  coolingUniformityScore: number;
}

export interface CollisionAuditResult {
  hasCollision: boolean;
  totalInterferences: number;
  minClearanceDistanceMm: number;
  collisionPairs: {
    partA: string;
    partB: string;
    clearanceMm: number;
    waypointIndex: number;
    location: [number, number, number];
    severity: 'danger' | 'warning' | 'nominal';
  }[];
  isSafeToExecute: boolean;
}
