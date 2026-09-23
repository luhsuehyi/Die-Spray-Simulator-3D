import { SurfaceCell } from '../types/die';
import { Waypoint, TrajectorySegment } from '../types/path';
import { SprayPhysicsParams, SprayCoverageStats } from '../types/spray';
import { ToolCenterPoint } from '../types/robot';
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
 * Simulates spray application along trajectory and updates surface cells.
 * Takes the active EOAT manifold tool configuration and individual nozzle parameters into account.
 */
export function simulateCoverage(
  cells: SurfaceCell[],
  waypoints: Waypoint[],
  segments: TrajectorySegment[],
  physics: SprayPhysicsParams = DEFAULT_SPRAY_PHYSICS,
  tool?: ToolCenterPoint
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

  // Resolve EOAT manifold nozzles
  const rawNozzles = tool?.nozzles || tool?.eoatSpec?.nozzles || [];
  const hasManifoldNozzles = rawNozzles.length > 0;
  const dropletSize = tool?.eoatSpec?.dropletSizeUm || physics.dropletSauterMeanDiameterUm || 52;
  const isMicroDosing = tool?.eoatType === 'MICRO_DOSING' || tool?.sprayHeadType === 'MICRO_DOSING';

  // Effective impingement based on droplet atomization
  const baseImpingement = isMicroDosing ? 0.94 : (physics.impingementEfficiency || 0.82);

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
      const defaultConeHalfAngleRad = (fanAngle / 2) * (Math.PI / 180);
      const sprayTargetFace = wpEnd.targetFace;

      // Compute actual physical tool/nozzle orientation vector from interpolated TCP orientation
      const prx = (wpStart.rx ?? 0) + ((wpEnd.rx ?? 0) - (wpStart.rx ?? 0)) * alpha;
      const pry = (wpStart.ry ?? 0) + ((wpEnd.ry ?? 0) - (wpStart.ry ?? 0)) * alpha;
      const prz = (wpStart.rz ?? 0) + ((wpEnd.rz ?? 0) - (wpStart.rz ?? 0)) * alpha;

      const rot = Matrix4Utils.fromEulerDeg(prx, pry, prz);

      // Determine active emitters for this step
      interface ActiveEmitter {
        posX: number;
        posY: number;
        posZ: number;
        dirX: number;
        dirY: number;
        dirZ: number;
        coneHalfAngleRad: number;
        flowShare: number;
        isLubeActive: boolean;
        isAirActive: boolean;
      }

      const emitters: ActiveEmitter[] = [];

      if (hasManifoldNozzles) {
        // Filter nozzles active for this action and target face
        const eligibleNozzles = rawNozzles.filter(nz => {
          if (isSpraying && (nz.type === 'lube' || nz.type === 'combined')) return true;
          if (isBlowing && (nz.type === 'air' || nz.type === 'combined')) return true;
          return false;
        });

        // Filter by target die face orientation
        const faceMatchedNozzles = eligibleNozzles.filter(nz => {
          // In tool local frame, directionVector indicates pointing (+Z = Moving die, -Z = Fixed die)
          const localDz = nz.directionVector[2];
          if (sprayTargetFace === 'FIXED_DIE') return localDz < 0;
          if (sprayTargetFace === 'MOVABLE_DIE') return localDz > 0;
          return true;
        });

        const activeList = faceMatchedNozzles.length > 0 ? faceMatchedNozzles : eligibleNozzles;
        const totalFlowRatio = activeList.reduce((acc, nz) => acc + (nz.flowRatio || 1.0), 0) || 1;

        for (const nz of activeList) {
          const [nx, ny, nzOff] = nz.offsetMm;
          const [ndx, ndy, ndz] = nz.directionVector;

          // Rotate local nozzle offset to world
          const worldOffX = rot[0] * nx + rot[1] * ny + rot[2] * nzOff;
          const worldOffY = rot[4] * nx + rot[5] * ny + rot[6] * nzOff;
          const worldOffZ = rot[8] * nx + rot[9] * ny + rot[10] * nzOff;

          // Rotate nozzle pointing direction to world
          let dirX = rot[0] * ndx + rot[1] * ndy + rot[2] * ndz;
          let dirY = rot[4] * ndx + rot[5] * ndy + rot[6] * ndz;
          let dirZ = rot[8] * ndx + rot[9] * ndy + rot[10] * ndz;

          const dirLen = Math.hypot(dirX, dirY, dirZ) || 1;
          dirX /= dirLen;
          dirY /= dirLen;
          dirZ /= dirLen;

          const halfAngle = ((nz.sprayAngleDeg || fanAngle) / 2) * (Math.PI / 180);
          const flowShare = (nz.flowRatio || 1.0) / totalFlowRatio;

          emitters.push({
            posX: px + worldOffX,
            posY: py + worldOffY,
            posZ: pz + worldOffZ,
            dirX,
            dirY,
            dirZ,
            coneHalfAngleRad: halfAngle,
            flowShare,
            isLubeActive: isSpraying && (nz.type === 'lube' || nz.type === 'combined'),
            isAirActive: isBlowing && (nz.type === 'air' || nz.type === 'combined')
          });
        }
      }

      // Fallback single central emitter if no manifold nozzles matched
      if (emitters.length === 0) {
        let dirX = rot[2];
        let dirY = rot[6];
        let dirZ = rot[10];

        if (sprayTargetFace === 'FIXED_DIE' && dirZ > 0) {
          dirX = -dirX; dirY = -dirY; dirZ = -dirZ;
        } else if (sprayTargetFace === 'MOVABLE_DIE' && dirZ < 0) {
          dirX = -dirX; dirY = -dirY; dirZ = -dirZ;
        }

        const dirLen = Math.hypot(dirX, dirY, dirZ) || 1;
        emitters.push({
          posX: px,
          posY: py,
          posZ: pz,
          dirX: dirX / dirLen,
          dirY: dirY / dirLen,
          dirZ: dirZ / dirLen,
          coneHalfAngleRad: defaultConeHalfAngleRad,
          flowShare: 1.0,
          isLubeActive: isSpraying,
          isAirActive: isBlowing
        });
      }

      // Apply each emitter to cells
      for (const emitter of emitters) {
        const emitterLubeMl = emitter.isLubeActive ? flowRate * emitter.flowShare * dt : 0;
        totalLubeAppliedMl += emitterLubeMl;

        for (const cell of updated) {
          if (sprayTargetFace === 'FIXED_DIE' && cell.targetSurface !== 'fixed') continue;
          if (sprayTargetFace === 'MOVABLE_DIE' && cell.targetSurface !== 'movable') continue;

          const vx = cell.x - emitter.posX;
          const vy = cell.y - emitter.posY;
          const vz = cell.z - emitter.posZ;
          const distance = Math.hypot(vx, vy, vz);

          // Standoff distance envelope: 15mm to 420mm
          if (distance > 420 || distance < 15) continue;

          const dot = vx * emitter.dirX + vy * emitter.dirY + vz * emitter.dirZ;
          const cosAngle = dot / distance;

          if (cosAngle < Math.cos(emitter.coneHalfAngleRad)) {
            continue; // outside spray cone
          }

          const angleFromAxis = Math.acos(Math.max(-1, Math.min(1, cosAngle)));
          const normalizedRadialDist = Math.sin(angleFromAxis) / Math.sin(emitter.coneHalfAngleRad);
          const intensity = Math.exp(-2.2 * normalizedRadialDist * normalizedRadialDist);

          if (emitter.isLubeActive && emitterLubeMl > 0) {
            const leidenfrostFactor = cell.temperature > physics.leidenfrostTempCelsius
              ? Math.max(0.25, 1 - (cell.temperature - physics.leidenfrostTempCelsius) / 100)
              : 1.0;

            const coneArea = Math.PI * Math.pow(distance * Math.tan(emitter.coneHalfAngleRad), 2);
            const depositedMlPerMm2 = (emitterLubeMl * intensity * baseImpingement * leidenfrostFactor) / (coneArea || 1);

            // Emulsion solids concentration (standard ~12%, MQL concentrate ~85%)
            const solidConcentration = isMicroDosing ? 0.85 : 0.12;
            const addedMicrons = depositedMlPerMm2 * 1000000 * solidConcentration;

            cell.currentThickness += addedMicrons;

            // Cooling: MQL uses pure micro aerosol (low water thermal extraction but zero puddling);
            // conventional water-based extracts ~2.26 kJ/g
            const coolingEfficiency = isMicroDosing ? 0.18 : 0.45;
            const coolingDelta = (addedMicrons * coolingEfficiency) * leidenfrostFactor;
            cell.temperature = Math.max(160, cell.temperature - coolingDelta);
          }

          if (emitter.isAirActive) {
            if (cell.currentThickness > cell.targetThickness * 1.6) {
              const excess = cell.currentThickness - cell.targetThickness * 1.2;
              cell.currentThickness -= excess * 0.4;
              totalWastedLubeMl += 0.03 * emitter.flowShare;
            }
            cell.temperature = Math.max(150, cell.temperature - 0.2);
          }
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
