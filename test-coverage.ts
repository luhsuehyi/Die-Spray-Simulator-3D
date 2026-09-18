import { DIE_PRESETS } from './src/utils/presets';
import { generateDieSurfaceCells } from './src/utils/dieGeometry';
import { generateAutoSweepPattern } from './src/utils/aiSprayOptimizer';
import { simulateCoverage } from './src/utils/sprayCoverage';
import { calculateTrajectorySegments } from './src/utils/machineCalculations';

const die = DIE_PRESETS[0];
const cells = generateDieSurfaceCells(die, 24);
const path = generateAutoSweepPattern(die, 'BOTH', 70, 620, 125);
const trajectoryPlan = calculateTrajectorySegments(path);

console.log('Path length:', path.length);
console.log('Total trajectory duration:', trajectoryPlan.totalDurationSec, 's (Limit: 24.8 s)');

const res = simulateCoverage(cells, path, trajectoryPlan.segments);
console.log('Fixed Coverage:', res.stats.fixedDieCoveragePercent, '%');
console.log('Movable Coverage:', res.stats.movableDieCoveragePercent, '%');
console.log('Average Thickness:', res.stats.averageThicknessMicrons, 'µm');
console.log('Uniformity Index:', res.stats.uniformityIndex);
