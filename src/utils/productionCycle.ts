import { CellCycleConfig, CellCyclePhase } from '../types/robot';

export function getProductionCycle(timeSec: number, cfg: CellCycleConfig) {
    // One shared clock for viewport and operator guidance.
    const t0 = 0;
    const t1 = t0 + (cfg.moldCloseTimeSec || 2.5);
    const t2 = t1 + (cfg.injectionDwellTimeSec || 3.5);
    const t3 = t2 + (cfg.moldOpenTimeSec || 2.5);
    const t4 = t3 + (cfg.partExtractionTimeSec || 4.5);
    const t5 = t4 + (cfg.sprayLubeTimeSec || 6.0);
    const t6 = t5 + (cfg.cycleResetTimeSec || 1.0);
    const totalDuration = Math.max(1, t6);

    const curTime = ((timeSec % totalDuration) + totalDuration) % totalDuration;
    const totalProg = curTime / totalDuration;

    let phase: CellCyclePhase = '01_MOLD_CLOSE';
    let phaseProg = 0;
    let platenOpenPct = 0;
    let ejectorMm = 0;
    let fillPct = 0;
    let sprayerInDaylight = false;
    let extractorInDaylight = false;
    let partGripped = false;

    if (curTime < t1) {
      phase = '01_MOLD_CLOSE';
      phaseProg = (curTime - t0) / Math.max(0.01, t1 - t0);
      platenOpenPct = Math.max(0, Math.min(100, (1 - phaseProg) * 100));
      ejectorMm = 0;
      fillPct = 0;
    } else if (curTime < t2) {
      phase = '02_INJECTION';
      phaseProg = (curTime - t1) / Math.max(0.01, t2 - t1);
      platenOpenPct = 0;
      ejectorMm = 0;
      fillPct = phaseProg < 0.4 ? (phaseProg / 0.4) * 100 : 100;
    } else if (curTime < t3) {
      phase = '03_MOLD_OPEN';
      phaseProg = (curTime - t2) / Math.max(0.01, t3 - t2);
      platenOpenPct = Math.max(0, Math.min(100, phaseProg * 100));
      fillPct = 100;
      ejectorMm = phaseProg > 0.65 ? Math.min(65, ((phaseProg - 0.65) / 0.35) * 65) : 0;
    } else if (curTime < t4) {
      phase = '04_PART_EXTRACTION';
      phaseProg = (curTime - t3) / Math.max(0.01, t4 - t3);
      platenOpenPct = 100;
      fillPct = 100;
      extractorInDaylight = phaseProg > 0.08 && phaseProg < 0.72;
      if (phaseProg < 0.28) {
        ejectorMm = 65;
        partGripped = false;
      } else if (phaseProg < 0.38) {
        ejectorMm = 65;
        partGripped = true;
      } else if (phaseProg < 0.65) {
        ejectorMm = Math.max(0, 65 * (1 - (phaseProg - 0.38) / 0.15));
        partGripped = true;
      } else if (phaseProg < 0.88) {
        ejectorMm = 0;
        partGripped = true;
      } else {
        ejectorMm = 0;
        partGripped = false;
      }
    } else if (curTime < t5) {
      phase = '05_SPRAY_LUBE';
      phaseProg = (curTime - t4) / Math.max(0.01, t5 - t4);
      platenOpenPct = 100;
      fillPct = 0;
      ejectorMm = 0;
      sprayerInDaylight = phaseProg > 0.08 && phaseProg < 0.92;
    } else {
      phase = '06_CYCLE_RESET';
      phaseProg = (curTime - t5) / Math.max(0.01, t6 - t5);
      platenOpenPct = 100;
      ejectorMm = 0;
      fillPct = 0;
    }

    return {
      phase,
      phaseProg: Math.max(0, Math.min(1, phaseProg)),
      totalProg: Math.max(0, Math.min(1, totalProg)),
      totalDuration,
      platenOpenPct,
      ejectorMm,
      fillPct,
      sprayerInDaylight,
      extractorInDaylight,
      partGripped,
      phaseTimeBoundaries: { t0, t1, t2, t3, t4, t5, t6 }
    };
}
