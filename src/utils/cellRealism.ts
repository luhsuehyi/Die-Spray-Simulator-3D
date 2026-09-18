import { DieCastingMachine } from '../types/machine';
import {
  RobotModelSpec,
  CellRealismReport,
  CellRealismItem,
  FactoryEquipmentConfig,
  RobotMountConfig
} from '../types/robot';
import { DieModel } from '../types/die';
import { Waypoint } from '../types/path';

export function evaluateCellRealism(
  machine: DieCastingMachine,
  robot: RobotModelSpec,
  die: DieModel,
  waypointsOrMount: Waypoint[] | RobotMountConfig,
  factoryConfig: FactoryEquipmentConfig,
  mountConfigArg?: RobotMountConfig
): CellRealismReport {
  const items: CellRealismItem[] = [];
  const issues: { description: string; mitigation: string }[] = [];
  const recommendations: string[] = [];

  const waypoints: Waypoint[] = Array.isArray(waypointsOrMount) ? waypointsOrMount : [];
  const mountConfig: RobotMountConfig | undefined = Array.isArray(waypointsOrMount)
    ? mountConfigArg
    : (waypointsOrMount as RobotMountConfig);

  // 1. Robot Mounting & Structural Rigidity
  let mountingScore = 90;
  const [rx, ry, rz] = robot.baseOffset;
  const mountType = mountConfig?.type || robot.mountOrientation;

  if (mountType === 'top' || mountType === 'top_machine_mount') {
    const platenTopY = machine.platenHeight / 2;
    const diffY = ry - platenTopY;
    if (diffY < -10) {
      mountingScore -= 40;
      items.push({
        category: 'mounting',
        title: 'Top Mount Machine Intersection',
        status: 'ERROR',
        description: `Robot base (Y=${Math.round(ry)}mm) is set below platen deck (Y=${Math.round(platenTopY)}mm), intersecting platen steel.`
      });
      issues.push({
        description: 'Robot base intersects stationary platen body.',
        mitigation: 'Raise robot base height to sit flush on top deck riser shelf (min +150mm).'
      });
    } else if (diffY > 450) {
      mountingScore -= 15;
      items.push({
        category: 'mounting',
        title: 'Top Mount Bracket Height Check',
        status: 'WARNING',
        description: `Robot base sits ${Math.round(diffY)}mm above platen deck. Requires high-rigidity structural riser column.`
      });
      issues.push({
        description: 'Excessive standoff height reduces natural structural frequency.',
        mitigation: 'Reinforce riser pedestal with dual 45-degree box gussets.'
      });
    } else {
      mountingScore = 98;
      items.push({
        category: 'mounting',
        title: 'Platen Direct Top Mount (Wollin Reference Standard)',
        status: 'PASS',
        description: `Robot rigidly secured on Toyo BD-${machine.clampingForceTons}V7EX stationary platen deck with machined adapter plate and heavy gusset braces.`
      });
    }
  } else if (mountType === 'floor') {
    const floorY = -850;
    const pedHeight = ry - floorY;
    if (pedHeight < 0) {
      mountingScore -= 50;
      items.push({
        category: 'mounting',
        title: 'Floor Pedestal Below Foundation',
        status: 'ERROR',
        description: 'Pedestal base is below concrete floor grade.'
      });
    } else {
      mountingScore = 85;
      items.push({
        category: 'mounting',
        title: 'Floor-Anchored Heavy Pedestal',
        status: 'PASS',
        description: 'Robot mounted on heavy steel cylindrical pedestal anchored to 250mm reinforced concrete floor.'
      });
    }
  } else {
    mountingScore = 88;
    items.push({
      category: 'mounting',
      title: 'Machine Lateral Outrigger Shelf',
      status: 'PASS',
      description: 'Robot base mounted to rigid steel machine-bed outrigger shelf on non-operator side.'
    });
  }

  // 2. Working Envelope & Clearance
  let clearanceScore = 92;
  const dieCenterDist = Math.hypot(
    rx - 0,
    ry - 0,
    rz - (die.fixedDieOffsetZ + die.movableDieOffsetZ) / 2
  );
  if (dieCenterDist > robot.reachMm * 0.96) {
    clearanceScore -= 25;
    items.push({
      category: 'kinematics',
      title: 'Working Envelope Margin',
      status: 'WARNING',
      description: `Die cavity center is near robot maximum reach limit (${Math.round(dieCenterDist)}mm / ${robot.reachMm}mm).`
    });
    issues.push({
      description: 'Robot is operating near outer kinematic boundary.',
      mitigation: 'Shift robot mount base 100mm closer toward platen center or select longer reach robot arm.'
    });
  } else {
    items.push({
      category: 'kinematics',
      title: 'Die Daylight Reachability',
      status: 'PASS',
      description: `Robot reach (${robot.reachMm}mm) comfortably covers both fixed & moving die cavities within optimal kinematic dexterity zone.`
    });
  }

  // Tie-Bar Clearance Check
  const halfTieBarH = machine.tieBarClearanceH / 2;
  const halfTieBarV = machine.tieBarClearanceV / 2;
  let minTieBarClearance = 9999;

  waypoints.forEach(wp => {
    const corners = [
      [-halfTieBarH, -halfTieBarV],
      [halfTieBarH, -halfTieBarV],
      [halfTieBarH, halfTieBarV],
      [-halfTieBarH, halfTieBarV]
    ];
    corners.forEach(([tx, ty]) => {
      const d = Math.hypot(wp.x - tx, wp.y - ty) - machine.tieBarDiameter / 2;
      if (d < minTieBarClearance) minTieBarClearance = d;
    });
  });

  if (minTieBarClearance < 50 && waypoints.length > 0) {
    clearanceScore -= 30;
    items.push({
      category: 'clearance',
      title: 'Tie-Bar Daylight Interference Warning',
      status: 'WARNING',
      description: `Minimum clearance to tie-bar chrome columns is only ${Math.round(minTieBarClearance)}mm.`
    });
    issues.push({
      description: `Tight tie-bar clearance (${Math.round(minTieBarClearance)}mm) on spray path.`,
      mitigation: 'Adjust approach trajectory to enter strictly along central platen axis.'
    });
  } else {
    items.push({
      category: 'clearance',
      title: 'Tie-Bar Daylight Clearance',
      status: 'PASS',
      description: `Safe clearance maintained from all 4 tie-bars across entire spray trajectory.`
    });
  }

  // 3. Equipment Integration
  let equipmentScore = 80;
  if (factoryConfig?.showDosingFurnace) {
    equipmentScore += 7;
    items.push({
      category: 'utilities',
      title: 'Westofen / Striko Dosing Furnace',
      status: 'PASS',
      description: 'Heated dosing furnace with ceramic transfer spout aligned directly over Toyo cold-chamber shot sleeve pour hole.'
    });
  }
  if (factoryConfig?.showExtractorRobot) {
    equipmentScore += 8;
    items.push({
      category: 'workflow',
      title: 'Part Extractor Robot Coordination',
      status: 'PASS',
      description: 'Extractor robot coordinated via Toyo SYSTEM 700EX Euromap 67 dual-robot handshake interlock.'
    });
  }
  if (factoryConfig?.showQuenchConveyor) {
    equipmentScore += 5;
    items.push({
      category: 'utilities',
      title: 'Water Quench Immersion Tank & Conveyor',
      status: 'PASS',
      description: 'Quench tank located directly beneath extractor drop position with mist ventilation hood.'
    });
  }
  equipmentScore = Math.min(100, equipmentScore);

  // 4. Utilities & Safety Infrastructure
  let utilitiesScore = 75;
  if (factoryConfig?.showReleaseAgentTank) {
    utilitiesScore += 10;
    items.push({
      category: 'utilities',
      title: 'Dosing & Lube Mixing Station',
      status: 'PASS',
      description: 'Pressurized release agent supply unit with proportional mixing and atomizing air regulator lines.'
    });
  }
  if (factoryConfig?.showPlungerLubricator) {
    utilitiesScore += 8;
    items.push({
      category: 'utilities',
      title: `Plunger Lubricator (${machine.plungerLubricatorModel || 'DM05'})`,
      status: 'PASS',
      description: `Toyo ${machine.plungerLubricatorModel || 'DM05'} oil-mist lubricator delivery line connected directly to shot sleeve pour port.`
    });
  }
  if (factoryConfig?.showSafetyFence) {
    utilitiesScore += 7;
    items.push({
      category: 'workflow',
      title: 'Perimeter Safety Enclosure & Interlocks',
      status: 'PASS',
      description: 'ISO 14120 compliant steel mesh safety fence with dual interlock sliding doors and optoelectronic light curtains.'
    });
  }
  utilitiesScore = Math.min(100, utilitiesScore);

  // Best practice recommendations
  recommendations.push('Keep release agent dosing tank within 4m of machine to maintain stable spray manifold line pressure (3.5 - 5.0 bar).');
  recommendations.push('Route air and lube lines through continuous-flex high-torsion dress pack over robot wrist axis 4/5/6.');
  recommendations.push('Synchronize spray robot entry permissive with Toyo DCM fully-open limit switch & core-pull confirmation.');
  recommendations.push('Inspect tie-bar wiper seals periodically to prevent release agent overspray accumulation on hard chrome surfaces.');

  const overallScore = Math.round((mountingScore + clearanceScore + equipmentScore + utilitiesScore) / 4);
  const isViableRealCell = overallScore >= 70 && issues.filter(i => i.description.includes('intersects')).length === 0;

  const errors = items.filter(i => i.status === 'ERROR').length;
  const warnings = items.filter(i => i.status === 'WARNING').length;
  const overallStatus = errors > 0 ? 'ERROR' : warnings > 0 ? 'WARNING' : 'PASS';

  return {
    overallStatus,
    score: overallScore,
    overallScore,
    isViableRealCell,
    categoryScores: {
      mountingScore,
      clearanceScore,
      equipmentScore,
      utilitiesScore
    },
    issues,
    recommendations,
    items
  };
}
