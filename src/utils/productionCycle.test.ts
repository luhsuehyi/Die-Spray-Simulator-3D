import assert from 'node:assert/strict';
import { getProductionCycle } from './productionCycle';
import { CellCycleConfig } from '../types/robot';
const cfg = { moldCloseTimeSec: 2, injectionDwellTimeSec: 3, moldOpenTimeSec: 2, partExtractionTimeSec: 4, sprayLubeTimeSec: 6, cycleResetTimeSec: 1 } as CellCycleConfig;
const expected = [[0,'01_MOLD_CLOSE'],[2,'02_INJECTION'],[5,'03_MOLD_OPEN'],[7,'04_PART_EXTRACTION'],[11,'05_SPRAY_LUBE'],[17,'06_CYCLE_RESET'],[18,'01_MOLD_CLOSE']] as const;
for (const [t, phase] of expected) assert.equal(getProductionCycle(t, cfg).phase, phase);
for (let t=0; t<18; t+=0.01) {
 const c = getProductionCycle(t,cfg);
 assert.ok(!(c.extractorInDaylight && c.sprayerInDaylight));
 if(c.extractorInDaylight || c.sprayerInDaylight) assert.equal(c.platenOpenPct,100);
 if(c.phase === '05_SPRAY_LUBE') { assert.equal(c.fillPct,0); assert.equal(c.ejectorMm,0); }
 assert.ok(c.phaseProg>=0 && c.phaseProg<=1);
}
assert.equal(getProductionCycle(18*5+11,cfg).phase,'05_SPRAY_LUBE');
console.log('Production cycle: phase boundaries, extraction before spray, open-mold motion, and wraparound passed.');
