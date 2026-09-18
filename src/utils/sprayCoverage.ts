import { SurfaceCell } from '../types/die';
import { Waypoint, TrajectorySegment } from '../types/path';
import { SprayPhysicsParams, SprayCoverageStats } from '../types/spray';
import { Matrix4Utils } from './kinematics/matrix4';

export const DEFAULT_SPRAY_PHYSICS: SprayPhysicsParams = {
  dilutionRatio: 80, // 1:80 water to concentrate
  lubeTemperatureCelsius: 24,
  atomizationAirFlowNm3PerMin: 1.8,
  dropletSauterMeanDiameterUm: 52,
  sprayPattern: 'full_cone',
  impingementEfficiency: 0.82,
  leidenfrostTempCelsius: 235
};

export const DEFAULT_COVERAGE_STATS: SprayCoverageStats = {
  fixedDieCoveragePercent: 0,
  movableDieCoveragePercent: 0,
  averageThicknessMicrons: 0,
  minThicknessMicrons: 0,
  maxThicknessMicrons: 0,
  uniformityIndex: 0,
  drySpotAreaMm2: 0,
  overSprayVolumeMl: 0,
  wastedAgentPercent: 0,
  averageTempReductionCelsius: 0,
  coolingUniformityScore: 0
};

/**
 * Simulates spray application along trajectory and updates surface cells
 */
export function simulateCoverage(
  cells: SurfaceCell[],
  waypoints: Waypoint[],
  segments: TrajectorySegment[],
  physics: SprayPhysicsParams = DEFAULT_SPRAY_PHYSICS
): {
  updatedCells: SurfaceCell[];
  stats: SprayCoverageStats;
  surfaceCells: SurfaceCell[];
  coverageStats: SprayCoverageStats;
} {
  // Clone cells for pure functional computation
  const updated = cells.map(c => ({ ...c }));

  let totalLubeAppliedMl = 0;
  let totalWastedLubeMl = 0;

  for (const seg of segments) {
    const wpStart = waypoints[seg.startIndex];
    const wpEnd = waypoints[seg.endIndex];
    if (!wpStart || !wpEnd) continue;

    const action = seg.action;
    const isSpraying = action === 'LUBE_SPRAY' || action === 'LUBE_AND_AIR';
    const isBlowing = action === 'AIR_BLOW' || action === 'LUBE_AND_AIR';

    if (!isSpraying && !isBlowing) continue;

    // Sample along points in segment
    const sampleCount = Math.max(seg.points.length, 6);
    const dt = seg.durationSec / sampleCount;

    for (let pIdx = 0; pIdx < sampleCount; pIdx++) {
      const alpha = pIdx / (sampleCount - 1);
      const px = wpStart.x + (wpEnd.x - wpStart.x) * alpha;
      const py = wpStart.y + (wpEnd.y - wpStart.y) * alpha;
      const pz = wpStart.z + (wpEnd.z - wpStart.z) * alpha;

      const flowRate = wpStart.flowRateMlPerSec + (wpEnd.flowRateMlPerSec - wpStart.flowRateMlPerSec) * alpha;
      const fanAngle = (wpStart.nozzleFanAngleDeg + wpEnd.nozzleFanAngleDeg) / 2;
      const coneHalfAngleRad = (fanAngle / 2) * (Math.PI / 180);
      const sprayTargetFace = wpEnd.targetFace;

      // Compute actual physical tool/nozzle orientation vector from interpolated TCP orientation
      const prx = (wpStart.rx ?? 0) + ((wpEnd.rx ?? 0) - (wpStart.rx ?? 0)) * alpha;
      const pry = (wpStart.ry ?? 0) + ((wpEnd.ry ?? 0) - (wpStart.ry ?? 0)) * alpha;
      const prz = (wpStart.rz ?? 0) + ((wpEnd.rz ?? 0) - (wpStart.rz ?? 0)) * alpha;

      const rot = Matrix4Utils.fromEulerDeg(prx, pry, prz);
      // Tool Z-axis in world frame: column 2 of rotation matrix (indices 2, 6, 10 in row-major)
      let dirX = rot[2];
      let dirY = rot[6];
      let dirZ = rot[10];

      // Align active nozzle direction with target die face
      if (sprayTargetFace === 'FIXED_DIE') {
        // Must point towards fixed die (-Z direction)
        if (dirZ > 0) {
          dirX = -dirX;
          dirY = -dirY;
          dirZ = -dirZ;
        }
      } else if (sprayTargetFace === 'MOVABLE_DIE') {
        // Must point towards movable die (+Z direction)
        if (dirZ < 0) {
          dirX = -dirX;
          dirY = -dirY;
          dirZ = -dirZ;
        }
      }

      const dirLen = Math.hypot(dirX, dirY, dirZ) || 1;
      dirX /= dirLen;
      dirY /= dirLen;
      dirZ /= dirLen;

      const currentLubeMl = isSpraying ? flowRate * dt : 0;
      totalLubeAppliedMl += currentLubeMl;

      // Project onto cells
      for (const cell of updated) {
        // Match target face
        if (sprayTargetFace === 'FIXED_DIE' && cell.targetSurface !== 'fixed') continue;
        if (sprayTargetFace === 'MOVABLE_DIE' && cell.targetSurface !== 'movable') continue;

        // Vector from nozzle to cell
        const vx = cell.x - px;
        const vy = cell.y - py;
        const vz = cell.z - pz;
        const distance = Math.hypot(vx, vy, vz);

        // Typical standoff distance range 20mm - 380mm
        if (distance > 380 || distance < 20) continue;

        // Angle between nozzle pointing axis and cell vector
        const dot = vx * dirX + vy * dirY + vz * dirZ;
        const cosAngle = dot / distance;

        if (cosAngle < Math.cos(coneHalfAngleRad)) {
          continue; // outside spray cone
        }

        // True radial angular deviation from cone axis
        const angleFromAxis = Math.acos(Math.max(-1, Math.min(1, cosAngle)));
        const normalizedRadialDist = Math.sin(angleFromAxis) / Math.sin(coneHalfAngleRad);
        const intensity = Math.exp(-2.2 * normalizedRadialDist * normalizedRadialDist);

        if (isSpraying && currentLubeMl > 0) {
          // Leidenfrost wetting reduction factor
          const leidenfrostFactor = cell.temperature > physics.leidenfrostTempCelsius
            ? Math.max(0.25, 1 - (cell.temperature - physics.leidenfrostTempCelsius) / 100)
            : 1.0;

          // Film deposition in microns (1 ml over 1 mm2 = 1,000,000 µm; with ~12% active solids in emulsion concentrate)
          const depositedMlPerMm2 = (currentLubeMl * intensity * physics.impingementEfficiency * leidenfrostFactor) / (Math.PI * Math.pow(distance * Math.tan(coneHalfAngleRad), 2));
          const addedMicrons = depositedMlPerMm2 * 1000000 * 0.12;

          cell.currentThickness += addedMicrons;

          // Evaporative cooling effect: 1g water evaporation extracts ~2.26 kJ heat
          const coolingDelta = (addedMicrons * 0.45) * leidenfrostFactor;
          cell.temperature = Math.max(160, cell.temperature - coolingDelta);
        }

        // Air blow effect: dries puddles, smooths thick film
        if (isBlowing) {
          if (cell.currentThickness > cell.targetThickness * 1.6) {
            // Blow off excess puddle
            const excess = cell.currentThickness - cell.targetThickness * 1.2;
            cell.currentThickness -= excess * 0.4;
            totalWastedLubeMl += 0.05;
          }
          // Air forced convection cooling
          cell.temperature = Math.max(150, cell.temperature - 0.2);
        }
      }
    }
  }

  // Calculate statistics
  const fixedCells = updated.filter(c => c.targetSurface === 'fixed');
  const movableCells = updated.filter(c => c.targetSurface === 'movable');

  const minFilmThreshold = 6.0; // Effective release barrier threshold (µm)
  const coveredFixed = fixedCells.filter(c => c.currentThickness >= Math.min(c.targetThickness * 0.35, minFilmThreshold)).length;
  const coveredMovable = movableCells.filter(c => c.currentThickness >= Math.min(c.targetThickness * 0.35, minFilmThreshold)).length;

  const fixedCoveragePercent = fixedCells.length > 0 ? (coveredFixed / fixedCells.length) * 100 : 0;
  const movableCoveragePercent = movableCells.length > 0 ? (coveredMovable / movableCells.length) * 100 : 0;

  const allThicknesses = updated.map(c => c.currentThickness);
  const avgThickness = allThicknesses.reduce((a, b) => a + b, 0) / (allThicknesses.length || 1);
  const minThickness = Math.min(...allThicknesses);
  const maxThickness = Math.max(...allThicknesses);

  // Uniformity: 1 - Normalized standard deviation
  const variance = allThicknesses.reduce((acc, val) => acc + Math.pow(val - avgThickness, 2), 0) / (allThicknesses.length || 1);
  const stdDev = Math.sqrt(variance);
  const uniformity = Math.max(0, Math.min(1, 1 - stdDev / (avgThickness || 1)));

  // Dry spots (below 8 µm)
  const dryCells = updated.filter(c => c.currentThickness < 8);
  const drySpotArea = dryCells.reduce((acc, c) => acc + c.area, 0);

  const initialAvgTemp = cells.reduce((a, b) => a + b.temperature, 0) / (cells.length || 1);
  const finalAvgTemp = updated.reduce((a, b) => a + b.temperature, 0) / (updated.length || 1);

  const stats: SprayCoverageStats = {
    fixedDieCoveragePercent: Math.round(fixedCoveragePercent * 10) / 10,
    movableDieCoveragePercent: Math.round(movableCoveragePercent * 10) / 10,
    averageThicknessMicrons: Math.round(avgThickness * 10) / 10,
    minThicknessMicrons: Math.round(minThickness * 10) / 10,
    maxThicknessMicrons: Math.round(maxThickness * 10) / 10,
    uniformityIndex: Math.round(uniformity * 100) / 100,
    drySpotAreaMm2: Math.round(drySpotArea),
    overSprayVolumeMl: Math.round((totalLubeAppliedMl * (1 - physics.impingementEfficiency) + totalWastedLubeMl) * 10) / 10,
    wastedAgentPercent: Math.round((1 - physics.impingementEfficiency) * 100),
    averageTempReductionCelsius: Math.round((initialAvgTemp - finalAvgTemp) * 10) / 10,
    coolingUniformityScore: Math.round(uniformity * 95)
  };

  return {
    updatedCells: updated,
    stats,
    surfaceCells: updated,
    coverageStats: stats
  };
}
