import { RobotModelSpec, ToolCenterPoint, EOATSpec, EoatType } from '../types/robot';
import { DieCastingMachine } from '../types/machine';
import { DieModel } from '../types/die';

export interface EoatCompatibilityReport {
  eoatId: string;
  eoatName: string;
  eoatType: EoatType;
  robotName: string;
  machineName: string;

  // Payload Metrics
  robotPayloadRatingKg: number;
  eoatWeightKg: number;
  effectivePayloadKg: number;
  payloadUtilizationPercent: number;
  payloadStatus: 'OPTIMAL' | 'ACCEPTABLE' | 'OVERLOAD';
  payloadMessage: string;

  // Clearance Metrics (Tie Bars & Daylight)
  tieBarDaylightMinMm: number;
  eoatClearanceDiameterMm: number;
  tieBarClearanceMarginMm: number;
  daylightStatus: 'GENEROUS' | 'TIGHT' | 'COLLISION_RISK';
  daylightMessage: string;

  // Die Stroke & Daylight Metrics
  dieDaylightMm: number;
  eoatDepthMm: number;
  dieDaylightClearanceMarginMm: number;
  strokeStatus: 'GENEROUS' | 'TIGHT' | 'INSUFFICIENT';
  strokeMessage: string;

  // Reachability & Motion Dynamics
  robotReachMm: number;
  estimatedReachUtilizationPercent: number;
  reachStatus: 'GOOD' | 'MARGINAL';

  // Overall Viability Verdict
  isViable: boolean;
  overallStatus: 'OPTIMAL' | 'COMPATIBLE_WITH_CAUTION' | 'INCOMPATIBLE';
  compatibilityScore: number; // 0 - 100
  summary: string;
  recommendations: string[];
}

/**
 * Evaluates full kinematic and physical compatibility between Robot, EOAT, and DCM.
 * Keeps Robot, DCM, Die, and EOAT as independent parameters (no auto-scaling).
 */
export function evaluateEoatCompatibility(
  robot: RobotModelSpec,
  tool: ToolCenterPoint | EOATSpec,
  machine: DieCastingMachine,
  die?: DieModel
): EoatCompatibilityReport {
  // Extract or default EOAT properties
  const eoatType: EoatType = (tool as EOATSpec).type || (tool as ToolCenterPoint).eoatType || 'MONOBLOCK';
  const eoatId = (tool as any).id || eoatType;
  const eoatName = (tool as any).name || `${eoatType} Tooling`;
  const eoatWeightKg = tool.weightKg || 12.5;

  const dims = (tool as any).dimensionsMm || (tool as any).dimensions || {
    width: 340,
    height: 130,
    depth: 85,
    clearanceRadius: 190
  };

  const eoatDepthMm = dims.depth || 85;
  const clearanceRadius = dims.clearanceRadius || Math.hypot(dims.width / 2, dims.height / 2);
  const eoatClearanceDiameterMm = Math.round(clearanceRadius * 2);

  // 1. Robot Payload Evaluation (Yaskawa GP50 rated at 50 kg)
  // Add 2.0 kg for fluid lines, dresspack brackets, and internal lubricant fluid mass
  const effectivePayloadKg = Math.round((eoatWeightKg + 2.0) * 10) / 10;
  const payloadUtilizationPercent = Math.min(150, Math.round((effectivePayloadKg / robot.payloadKg) * 100));

  let payloadStatus: 'OPTIMAL' | 'ACCEPTABLE' | 'OVERLOAD' = 'OPTIMAL';
  let payloadMessage = `Payload utilization is ${payloadUtilizationPercent}% of ${robot.payloadKg}kg rating.`;

  if (payloadUtilizationPercent > 100) {
    payloadStatus = 'OVERLOAD';
    payloadMessage = `CRITICAL: Tool weight (${effectivePayloadKg}kg with media) exceeds ${robot.name} rated capacity (${robot.payloadKg}kg). High motor thermal trip risk!`;
  } else if (payloadUtilizationPercent > 70) {
    payloadStatus = 'ACCEPTABLE';
    payloadMessage = `Heavy payload utilization (${payloadUtilizationPercent}%). Accelerations on wrist axes J5/J6 should be limited to 70% max speed.`;
  } else {
    payloadStatus = 'OPTIMAL';
    payloadMessage = `Optimal payload margin (${payloadUtilizationPercent}%). Full 100% path trajectory velocity supported.`;
  }

  // 2. Machine Tie-Bar Daylight Evaluation
  const tieBarDaylightMinMm = Math.min(machine.tieBarClearanceH, machine.tieBarClearanceV);
  const tieBarClearanceMarginMm = Math.round((tieBarDaylightMinMm - eoatClearanceDiameterMm) / 2);

  let daylightStatus: 'GENEROUS' | 'TIGHT' | 'COLLISION_RISK' = 'GENEROUS';
  let daylightMessage = `Clearance margin to tie-bar columns: ${tieBarClearanceMarginMm}mm.`;

  if (tieBarClearanceMarginMm < 30) {
    daylightStatus = 'COLLISION_RISK';
    daylightMessage = `WARNING: EOAT diameter (${eoatClearanceDiameterMm}mm) is too wide for machine ${machine.name} tie-bar window (${tieBarDaylightMinMm}mm). Collision imminent without strict vertical entry!`;
  } else if (tieBarClearanceMarginMm < 85) {
    daylightStatus = 'TIGHT';
    daylightMessage = `Tight column daylight clearance (${tieBarClearanceMarginMm}mm margin). High-precision robotic approach required.`;
  } else {
    daylightStatus = 'GENEROUS';
    daylightMessage = `Ample tie-bar column clearance (${tieBarClearanceMarginMm}mm margin). Unrestricted robot swing clearance.`;
  }

  // 3. Die Daylight & Opening Stroke Evaluation
  const dieDaylightMm = die ? Math.abs(die.movableDieOffsetZ - die.fixedDieOffsetZ) : machine.maxDieOpeningStroke;
  const dieDaylightClearanceMarginMm = Math.round(dieDaylightMm - eoatDepthMm);

  let strokeStatus: 'GENEROUS' | 'TIGHT' | 'INSUFFICIENT' = 'GENEROUS';
  let strokeMessage = `Die parting daylight margin: ${dieDaylightClearanceMarginMm}mm.`;

  if (dieDaylightClearanceMarginMm < 60) {
    strokeStatus = 'INSUFFICIENT';
    strokeMessage = `CRITICAL: Die opening stroke (${dieDaylightMm}mm) cannot accommodate tool thickness (${eoatDepthMm}mm). Increase die stroke!`;
  } else if (dieDaylightClearanceMarginMm < 140) {
    strokeStatus = 'TIGHT';
    strokeMessage = `Restricted daylight space (${dieDaylightClearanceMarginMm}mm margin). Opposed nozzles face high risk of scraping die cavities if tilted.`;
  } else {
    strokeStatus = 'GENEROUS';
    strokeMessage = `Spacious die opening clearance (${dieDaylightClearanceMarginMm}mm margin). Safe multi-angle spray sweeps allowed.`;
  }

  // 4. Reachability Evaluation
  const robotReachMm = robot.reachMm;
  // Estimate distance from robot mounting to center of die
  const lateralDist = robot.baseOffset ? Math.abs(robot.baseOffset[0]) : 1200;
  const verticalDist = robot.baseOffset ? Math.abs(robot.baseOffset[1]) : 1400;
  const approxDistanceToDie = Math.hypot(lateralDist, verticalDist);
  const estimatedReachUtilizationPercent = Math.min(100, Math.round((approxDistanceToDie / robotReachMm) * 100));
  const reachStatus = estimatedReachUtilizationPercent > 85 ? 'MARGINAL' : 'GOOD';

  // 5. Aggregate Viability Score & Recommendation
  let compatibilityScore = 100;
  const recommendations: string[] = [];

  if (payloadStatus === 'OVERLOAD') compatibilityScore -= 45;
  else if (payloadStatus === 'ACCEPTABLE') compatibilityScore -= 12;

  if (daylightStatus === 'COLLISION_RISK') compatibilityScore -= 40;
  else if (daylightStatus === 'TIGHT') compatibilityScore -= 15;

  if (strokeStatus === 'INSUFFICIENT') compatibilityScore -= 40;
  else if (strokeStatus === 'TIGHT') compatibilityScore -= 12;

  compatibilityScore = Math.max(10, Math.min(100, compatibilityScore));

  const isViable = payloadStatus !== 'OVERLOAD' && daylightStatus !== 'COLLISION_RISK' && strokeStatus !== 'INSUFFICIENT';
  let overallStatus: 'OPTIMAL' | 'COMPATIBLE_WITH_CAUTION' | 'INCOMPATIBLE' = 'OPTIMAL';

  if (!isViable) {
    overallStatus = 'INCOMPATIBLE';
  } else if (compatibilityScore < 80) {
    overallStatus = 'COMPATIBLE_WITH_CAUTION';
  } else {
    overallStatus = 'OPTIMAL';
  }

  // Build targeted recommendations
  if (payloadStatus === 'OVERLOAD') {
    recommendations.push(`Select a higher-payload robot or switch to a lighter EOAT (e.g. Micro-Dosing at 7.2kg or Monoblock at 12.5kg).`);
  }
  if (daylightStatus === 'COLLISION_RISK') {
    recommendations.push(`EOAT width exceeds tie-bar spacing on ${machine.name}. Select a compact Monoblock or Micro-Dosing head, or use a larger tonnage machine.`);
  }
  if (strokeStatus === 'INSUFFICIENT') {
    recommendations.push(`Increase machine die opening stroke on DCM controller to at least ${eoatDepthMm + 120}mm.`);
  }
  if (eoatType === 'MATRIX' && machine.clampingForceTons < 650) {
    recommendations.push(`Matrix EOAT is designed for 800T+ structural machines; on smaller machines verify tie-bar clearance during entry.`);
  }
  if (eoatType === 'MICRO_DOSING') {
    recommendations.push(`Micro-Dosing requires pure concentrate or high dilution (1:5 - 1:15) with filtered supply line (< 50 micron filter).`);
  }
  if (recommendations.length === 0) {
    recommendations.push(`Configuration verified: ${robot.name} and ${eoatName} are well-balanced for the ${machine.name} cell.`);
  }

  const summary = isViable
    ? `${eoatName} is verified compatible with ${robot.name} on ${machine.name} (${compatibilityScore}/100 match score).`
    : `Compatibility issues detected for ${eoatName} on ${machine.name}. Review payload and tie-bar daylight constraints.`;

  return {
    eoatId,
    eoatName,
    eoatType,
    robotName: robot.name,
    machineName: machine.name,
    robotPayloadRatingKg: robot.payloadKg,
    eoatWeightKg,
    effectivePayloadKg,
    payloadUtilizationPercent,
    payloadStatus,
    payloadMessage,
    tieBarDaylightMinMm,
    eoatClearanceDiameterMm,
    tieBarClearanceMarginMm,
    daylightStatus,
    daylightMessage,
    dieDaylightMm,
    eoatDepthMm,
    dieDaylightClearanceMarginMm,
    strokeStatus,
    strokeMessage,
    robotReachMm,
    estimatedReachUtilizationPercent,
    reachStatus,
    isViable,
    overallStatus,
    compatibilityScore,
    summary,
    recommendations
  };
}
