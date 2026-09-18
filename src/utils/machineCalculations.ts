import { Waypoint, TrajectorySegment, TrajectoryPlan } from '../types/path';

export function calculateTrajectorySegments(waypoints: Waypoint[]): TrajectoryPlan {
  const segments: TrajectorySegment[] = [];
  let totalTime = 0;
  let totalLubeMl = 0;
  let totalAirLiters = 0;
  let sprayTime = 0;
  let airTime = 0;
  let transitTime = 0;

  for (let i = 0; i < waypoints.length - 1; i++) {
    const w1 = waypoints[i];
    const w2 = waypoints[i + 1];

    const dx = w2.x - w1.x;
    const dy = w2.y - w1.y;
    const dz = w2.z - w1.z;
    const distance = Math.hypot(dx, dy, dz);

    const avgSpeed = Math.max(10, (w1.speed + w2.speed) / 2);
    const moveDuration = distance / avgSpeed;
    const dwellDuration = w1.dwellTimeSec || 0;
    const segDuration = moveDuration + dwellDuration;

    // Generate sampled 3D points for line ribbon rendering
    const pointCount = Math.max(5, Math.min(25, Math.ceil(distance / 25)));
    const pts: [number, number, number][] = [];
    for (let p = 0; p <= pointCount; p++) {
      const t = p / pointCount;
      pts.push([
        w1.x + dx * t,
        w1.y + dy * t,
        w1.z + dz * t
      ]);
    }

    const action = w2.action !== 'NONE' ? w2.action : w1.action;

    segments.push({
      startIndex: i,
      endIndex: i + 1,
      startTimeSec: totalTime,
      durationSec: segDuration,
      distanceMm: Math.round(distance),
      action: action,
      points: pts
    });

    totalTime += segDuration;

    if (action === 'LUBE_SPRAY' || action === 'LUBE_AND_AIR') {
      const avgFlow = (w1.flowRateMlPerSec + w2.flowRateMlPerSec) / 2;
      const applied = avgFlow * segDuration;
      totalLubeMl += applied;
      sprayTime += segDuration;
    }

    if (action === 'AIR_BLOW' || action === 'LUBE_AND_AIR') {
      const airPressure = Math.max(w1.airPressureBar, w2.airPressureBar);
      const airConsumptionRate = (airPressure * 12); // liters / sec
      totalAirLiters += airConsumptionRate * segDuration;
      airTime += segDuration;
    }

    if (action === 'NONE') {
      transitTime += segDuration;
    }
  }

  // Account for last waypoint dwell if any
  if (waypoints.length > 0) {
    totalTime += waypoints[waypoints.length - 1].dwellTimeSec || 0;
  }

  return {
    totalDurationSec: Math.round(totalTime * 10) / 10,
    totalLubeVolumeMl: Math.round(totalLubeMl * 10) / 10,
    totalAirVolumeLiters: Math.round(totalAirLiters),
    cycleTimeSec: Math.round(totalTime * 10) / 10,
    sprayTimeSec: Math.round(sprayTime * 10) / 10,
    airBlowTimeSec: Math.round(airTime * 10) / 10,
    transitTimeSec: Math.round(transitTime * 10) / 10,
    waypoints,
    segments
  };
}

export function calculateProcessCost(
  lubeMlPerShot: number,
  dilutionRatio: number = 80,
  concentrateCostPerLiter: number = 5.20,
  shotsPerHour: number = 65
) {
  // Pure concentrate volume
  const concentrateMl = lubeMlPerShot / (dilutionRatio + 1);
  const costPerShot = (concentrateMl / 1000) * concentrateCostPerLiter;
  const costPerHour = costPerShot * shotsPerHour;
  const annualCost = costPerHour * 16 * 260; // 2 shifts, 260 days

  return {
    costPerShot: Math.round(costPerShot * 1000) / 1000,
    costPerHour: Math.round(costPerHour * 100) / 100,
    annualCost: Math.round(annualCost),
    concentrateUsedPerShiftLiters: Math.round(((concentrateMl * shotsPerHour * 8) / 1000) * 10) / 10
  };
}
