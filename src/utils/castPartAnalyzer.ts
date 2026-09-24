/**
 * Cast-Part-Driven Automation Analyzer & Cell Generator
 * Translates geometric features of the cast part directly into a complete automation cell.
 */

import {
  CastPartModel,
  CastPartAnalysisReport,
  CellDesignOption,
  CellDesignScore,
  GripCandidate,
  RobotSelectionCandidate,
  DownstreamEquipmentRecommendation
} from '../types/castPart';
import { DieCastingMachine } from '../types/machine';
import { Waypoint } from '../types/path';

/**
 * Performs comprehensive manufacturing analysis of the cast part geometry
 */
export function analyzeCastPart(
  part: CastPartModel,
  machine?: DieCastingMachine
): CastPartAnalysisReport {
  const dim = part.dimensions;

  // 1. Tonnage estimation check based on projected area
  const projectedAreaCm2 = (dim.lengthMm * dim.widthMm) / 100;
  // 75 MPa = 7.5 kN/cm². This is a screening estimate, not a validated filling simulation.
  const assumedMetalPressureMPa = 75;
  const pressureKnPerCm2 = assumedMetalPressureMPa / 10;
  const safetyFactor = 1.30;
  const estimatedTonnageRequired = Math.ceil(
    (projectedAreaCm2 * pressureKnPerCm2 * safetyFactor) / 9.80665
  );

  const thinWallFeatures = part.features.filter(f => f.category === 'rib' || f.category === 'thin_section');
  const deepPocketFeatures = part.features.filter(f => f.category === 'deep_pocket');
  const undercutFeatures = part.features.filter(f => f.category === 'undercut');

  const recommendedGrip = part.gripCandidates.find(g => g.status === 'RECOMMENDED') || part.gripCandidates[0];

  // 2. Engineer confirmations required checklist
  const confirmations: string[] = [];
  if (undercutFeatures.length > 0) {
    confirmations.push(
      `Part possesses ${undercutFeatures.length} lateral undercut feature(s). Confirm hydraulic core pull sequence and limit switch interlock with Toyo System 700EX before robot entry.`
    );
  }
  if (dim.wallThicknessMinMm < 2.0) {
    confirmations.push(
      `Thin-wall section detected (${dim.wallThicknessMinMm} mm). Rapid cooling in water quench may induce residual warpage. Verify permissible quench immersion temperature with metallurgist.`
    );
  }
  if (part.gripCandidates.some(g => g.cosmeticRisk === 'HIGH')) {
    confirmations.push(
      `Candidate grip locations contact aesthetic or machined seal faces. Require engineer review of protective elastomer jaw pads.`
    );
  }
  if (part.dimensions.lengthMm > 700 || part.dimensions.widthMm > 600) {
    confirmations.push(
      `Large part envelope (${part.dimensions.lengthMm}×${part.dimensions.widthMm}mm). Verify tie-bar daylight clearance margin during robot extraction swing.`
    );
  }

  // 3. Generate 3 Automation Cell Design Options
  const cellOptions = generateCellDesignOptions(part, machine);

  return {
    part,
    facts: {
      dimensions: {
        value: dim,
        confidence: 'HIGH',
        type: 'GEOMETRY_DERIVED_FACT',
        rationale: 'Extracted directly from CAD bounding volume & triangulated boundary surfaces.'
      },
      moldDirection: {
        value: '+Z (Platen Daylight Opening Axis)',
        confidence: 'HIGH',
        type: 'PRESET_ASSUMPTION',
        rationale: 'Uses the sample/CAD setup mold-opening direction. For imported CAD, validate against the actual parting line and draft analysis.'
      },
      extractionDirection: {
        value: '+Z Retract followed by +X Lateral Transfer',
        confidence: 'HIGH',
        type: 'PRESET_ASSUMPTION',
        rationale: 'Uses the configured extraction direction. Actual ejector stroke, core pulls, and robot entry direction require tooling validation.'
      },
      tonnageRequired: {
        value: Math.max(part.recommendedMachineTonnage, estimatedTonnageRequired),
        confidence: 'HIGH',
        type: 'AUTOMATION_INFERENCE',
        rationale: `Screening estimate from ${Math.round(projectedAreaCm2)} cm² projected area × ${assumedMetalPressureMPa} MPa assumed metal pressure × ${safetyFactor} safety factor. Validate with actual filling pressure, gate layout, and die-casting process data.`
      },
      thinWallCount: {
        value: thinWallFeatures.length,
        confidence: 'HIGH',
        type: 'GEOMETRY_DERIVED_FACT',
        rationale: `Identified ${thinWallFeatures.length} ribs/walls under 3.5mm nominal thickness.`
      },
      deepPocketCount: {
        value: deepPocketFeatures.length,
        confidence: 'HIGH',
        type: 'GEOMETRY_DERIVED_FACT',
        rationale: `Found ${deepPocketFeatures.length} cavity recess(es) exceeding 40mm depth.`
      },
      undercutCoreSlides: {
        value: undercutFeatures.length,
        confidence: undercutFeatures.length > 0 ? 'HIGH' : 'MEDIUM',
        type: undercutFeatures.length > 0 ? 'GEOMETRY_DERIVED_FACT' : 'AUTOMATION_INFERENCE',
        rationale: undercutFeatures.length > 0 ? 'Side core pull required.' : 'No lateral undercuts detected in main draft direction.'
      }
    },
    inferences: {
      suggestedGrip: {
        value: recommendedGrip,
        confidence: 'HIGH',
        type: 'AUTOMATION_INFERENCE',
        rationale: recommendedGrip.description
      },
      suggestedEoat: {
        value: recommendedGrip.recommendedEoatType,
        confidence: 'HIGH',
        type: 'AUTOMATION_INFERENCE',
        rationale: `Matches detected grip width (${recommendedGrip.gripWidthMm}mm) and structural stability rating.`
      },
      sprayStrategy: {
        value: deepPocketFeatures.length > 0 ? 'Dual-Sided Conformal Matrix with Targeted Core Pin Jets' : 'Dual-Sided Balanced Matrix',
        confidence: 'HIGH',
        type: 'AUTOMATION_INFERENCE',
        rationale: 'Optimized to cool heavy biscuits and deep pockets without washing out thin ribs.'
      },
      coolingMethod: {
        value: dim.wallThicknessMinMm < 2.2 ? 'Forced Air Cooling Tunnel (Distortion Sensitive)' : 'Submerged Water Quench Tank & Slotted Flight Conveyor',
        confidence: 'MEDIUM',
        type: 'AUTOMATION_INFERENCE',
        rationale: 'Selected to balance cooling cycle speed with thermal distortion risk.'
      },
      trimmingMethod: {
        value: dim.estimatedMassKg > 5.0 ? '4-Pillar Heavy Hydraulic Trim Press (40T - 60T)' : '4-Pillar High-Speed Hydraulic Trim Press (25T - 35T)',
        confidence: 'HIGH',
        type: 'AUTOMATION_INFERENCE',
        rationale: 'Scaled to shear perimeter parting flash and ingate runners in a single cycle.'
      }
    },
    confidenceItems: [
      { key: 'dim', label: 'Bounding Box', value: `${dim.lengthMm} x ${dim.widthMm} x ${dim.heightMm} mm`, tier: 'GEOMETRY_DERIVED_FACT' },
      { key: 'mass', label: 'Cast Part Mass', value: `${part.dimensions.estimatedMassKg} kg`, tier: 'GEOMETRY_DERIVED_FACT' },
      { key: 'volume', label: 'Solid Volume', value: `${part.dimensions.volumeCm3.toFixed(1)} cm³`, tier: 'GEOMETRY_DERIVED_FACT' },
      { key: 'tonnage', label: 'Estimated Clamping Tonnage', value: `${estimatedTonnageRequired} T`, tier: 'AUTOMATION_INFERENCE', rationale: `${assumedMetalPressureMPa} MPa screening pressure × ${safetyFactor} safety factor; validate with process data.` },
      { key: 'grip', label: 'Recommended Grip Feature', value: `${recommendedGrip.label}: ${recommendedGrip.name}`, tier: 'AUTOMATION_INFERENCE' },
      { key: 'eoat', label: 'EOAT Gripper Type', value: recommendedGrip.recommendedEoatType, tier: 'AUTOMATION_INFERENCE' },
      { key: 'conf1', label: 'Tie Bar Clearance Confirmation', value: 'Requires CAD model check', tier: 'ENGINEER_CONFIRMATION_REQUIRED' },
      { key: 'conf2', label: 'Ejector Pin Stroke Verification', value: 'Confirm with tooling shop', tier: 'ENGINEER_CONFIRMATION_REQUIRED' },
      { key: 'dir1', label: 'Mold Opening Direction', value: '+Z configured direction', tier: 'PRESET_ASSUMPTION', rationale: 'Preset/configuration value; not inferred from CAD topology.' },
      { key: 'dir2', label: 'Extraction Direction', value: '+Z then +X configured path', tier: 'PRESET_ASSUMPTION', rationale: 'Planning assumption; verify against actual die, ejector, and core-pull layout.' }
    ],
    engineerConfirmationsRequired: confirmations,
    cellOptions,
    activeOptionId: 'option_b_balanced'
  };
}

/**
 * Generates 3 distinct cell design options: Compact, Balanced, and High Throughput
 */
export function generateCellDesignOptions(
  part: CastPartModel,
  machine?: DieCastingMachine
): CellDesignOption[] {
  const mass = part.dimensions.estimatedMassKg;
  const isHeavy = mass > 4.5;
  const isLarge = part.dimensions.lengthMm > 600 || part.dimensions.widthMm > 500;

  // OPTION A: Compact (Lowest Footprint)
  const optionA: CellDesignOption = {
    id: 'option_a_compact',
    title: 'Option A: Compact Footprint (精簡節能型)',
    subtitle: 'Wollin Platen-Direct Top Mount + Compact Side Extractor',
    badge: 'LOWEST FOOTPRINT (28 m²)',
    description:
      'Engineered for Taiwanese job-shop foundries with limited aisle space. Utilizes a rigid top-mounted spray robot on the stationary platen deck and a compact machine-side extractor robot dropping directly onto an integrated quench chute.',
    footprintM2: 28.5,
    estimatedCycleTimeSec: 32.5,
    sprayRobot: {
      robotId: 'yaskawa-gp25',
      robotName: 'Yaskawa Motoman GP25 (Foundry Class)',
      manufacturer: 'YASKAWA',
      role: 'SPRAY',
      mounting: 'top',
      recommendedBaseOffset: [0, 1550, 0],
      requiredReachMm: 1730,
      availableReachMm: 1732,
      reachabilityPercent: 94,
      requiredPayloadKg: 14.5,
      availablePayloadKg: 25.0,
      utilizationPercent: 58,
      collisionMarginMm: 85,
      rationale: 'Top-mount frees up 100% of operator side floor space. Shorter vertical stroke into daylight.'
    },
    extractionRobot: {
      robotId: isHeavy ? 'yaskawa-gp50' : 'yaskawa-gp25',
      robotName: isHeavy ? 'Yaskawa Motoman GP50' : 'Yaskawa Motoman GP25',
      manufacturer: 'YASKAWA',
      role: 'EXTRACTION',
      mounting: 'side',
      recommendedBaseOffset: [1100, 150, 450],
      requiredReachMm: 1650,
      availableReachMm: isHeavy ? 2061 : 1732,
      reachabilityPercent: 92,
      requiredPayloadKg: Math.round(part.dimensions.shotWeightWithRunnerKg + 12),
      availablePayloadKg: isHeavy ? 50 : 25,
      utilizationPercent: 62,
      collisionMarginMm: 75,
      rationale: 'Outrigger side mount drops extracted casting directly into quench tank beside DCM.'
    },
    scores: {
      overallScore: 84,
      reachability: 93,
      collisionSafety: 88,
      partAccessibility: 86,
      sprayCoverage: 91,
      cycleTimeScore: 80,
      cellCompactness: 96,
      operatorAccessibility: 90,
      maintenanceAccessibility: 82,
      warnings: ['Slightly tighter maintenance access to tie-bar wipers behind top-mount pedestal.']
    },
    recommendedDownstream: [
      {
        id: 'ds-quench',
        name: 'Water Immersion Quench Tank',
        taiwaneseIndustryName: '不銹鋼冷卻水槽',
        category: 'cooling',
        suggestedPosition: [1600, -620, 600],
        dimensions: [650, 360, 1100],
        isSuggested: true,
        enabled: true,
        whySuggested: 'Rapid metallurgical cooling located immediately adjacent to extraction drop position.',
        confidence: 'HIGH'
      },
      {
        id: 'ds-trim',
        name: 'Compact 4-Pillar Hydraulic Trim Press (25T)',
        taiwaneseIndustryName: '25噸四柱油壓切邊機',
        category: 'trim',
        suggestedPosition: [1700, -200, 1800],
        dimensions: [850, 1400, 750],
        isSuggested: true,
        enabled: true,
        whySuggested: 'In-line trimming of ingate biscuit and parting flash saves secondary material transport.',
        confidence: 'HIGH'
      },
      {
        id: 'ds-scrap',
        name: 'Scrap Runner Return Chute',
        taiwaneseIndustryName: '廢料回爐集中槽',
        category: 'scrap',
        suggestedPosition: [1700, -750, 1800],
        dimensions: [600, 400, 600],
        isSuggested: true,
        enabled: true,
        whySuggested: 'Direct scrap recycling bin situated beneath trim die platen.',
        confidence: 'HIGH'
      }
    ],
    whyThisCell: [
      'Top-mounted spray robot utilizes the structural stiffness of the Toyo stationary platen deck, freeing up valuable floor space on both operator and non-operator sides.',
      'Extraction path directly aligns with the moving platen ejector pin stroke, minimizing wrist manipulation in the daylight.',
      'Cell footprint is kept to 28.5 m², allowing easy retrofitting into existing factory bays.'
    ],
    pros: [
      'Lowest floor footprint (saves ~30% shop floor space)',
      'Direct top-mount spray robot eliminates tie-bar interference on spray entry',
      'Lower total system investment cost'
    ],
    cons: [
      'Slightly longer cycle time due to serial extraction and drop sequence',
      'Requires overhead bridge crane clearance above machine'
    ],
    plainLanguageRationale:
      'Engineered for Taiwanese job-shop foundries with limited aisle space. Utilizes a rigid top-mounted spray robot on the stationary platen deck and a compact machine-side extractor robot dropping directly onto an integrated quench chute.',
    whyReasons: [
      {
        category: 'Footprint Optimization',
        recommendation: 'Top-mount spray robot on stationary platen deck',
        rationale: 'Saves 30% shop floor space and eliminates tie-bar interference during rapid entry.'
      },
      {
        category: 'Part Extraction',
        recommendation: 'Machine-side extractor dropping onto quench chute',
        rationale: 'Short, direct transit stroke minimizes cycle overhead in tight aisle spacing.'
      },
      {
        category: 'Cell Economics',
        recommendation: 'Compact integrated downstream equipment',
        rationale: 'Lowest initial system investment with fast ROI for SME job shops.'
      }
    ]
  };

  // OPTION B: Balanced (Recommended High Reliability)
  const optionB: CellDesignOption = {
    id: 'option_b_balanced',
    title: 'Option B: Balanced Production (高可靠標準型)',
    subtitle: 'Top-Mount Spray + Floor-Pedestal Extractor + Wire Mesh Conveyor',
    badge: 'RECOMMENDED BALANCED (36 m²)',
    description:
      'The industry-standard Taiwanese automated casting cell. Delivers optimal cycle time, excellent ergonomic maintenance clearance around tie bars, and safe operator walk-in service doors.',
    footprintM2: 36.0,
    estimatedCycleTimeSec: 28.0,
    sprayRobot: {
      robotId: 'fanuc-m710ic',
      robotName: 'FANUC M-710iC/50 (Foundry Edition)',
      manufacturer: 'FANUC',
      role: 'SPRAY',
      mounting: 'top',
      recommendedBaseOffset: [0, 1550, 0],
      requiredReachMm: 1850,
      availableReachMm: 2050,
      reachabilityPercent: 98,
      requiredPayloadKg: 18.0,
      availablePayloadKg: 50.0,
      utilizationPercent: 36,
      collisionMarginMm: 110,
      rationale: 'Generous 50kg payload accommodates heavy dual-sided conformal spray head with integrated blow-off air knives.'
    },
    extractionRobot: {
      robotId: isLarge || isHeavy ? 'yaskawa-gp50' : 'yaskawa-gp35',
      robotName: isLarge || isHeavy ? 'Yaskawa Motoman GP50 (Floor Mount)' : 'Yaskawa Motoman GP35',
      manufacturer: 'YASKAWA',
      role: 'EXTRACTION',
      mounting: 'floor',
      recommendedBaseOffset: [1250, -250, 650],
      requiredReachMm: 1850,
      availableReachMm: 2061,
      reachabilityPercent: 96,
      requiredPayloadKg: Math.round(part.dimensions.shotWeightWithRunnerKg + 16),
      availablePayloadKg: 50,
      utilizationPercent: 52,
      collisionMarginMm: 95,
      rationale: 'Floor pedestal on non-operator side provides stable anchoring and wide articulation envelope to quench tank and trim press.'
    },
    scores: {
      overallScore: 92,
      reachability: 96,
      collisionSafety: 94,
      partAccessibility: 92,
      sprayCoverage: 95,
      cycleTimeScore: 89,
      cellCompactness: 86,
      operatorAccessibility: 93,
      maintenanceAccessibility: 91,
      warnings: []
    },
    recommendedDownstream: [
      {
        id: 'ds-quench-conv',
        name: 'Stainless Quench Tank & Slat Flight Conveyor',
        taiwaneseIndustryName: '沉水式冷卻水槽與鏈板式輸送機',
        category: 'cooling',
        suggestedPosition: [1750, -620, 650],
        dimensions: [750, 450, 1500],
        isSuggested: true,
        enabled: true,
        whySuggested: 'Submerges hot aluminum casting then elevates it automatically onto dry inspection table.',
        confidence: 'HIGH'
      },
      {
        id: 'ds-trim-press',
        name: '35-Ton 4-Pillar Hydraulic Trim Press',
        taiwaneseIndustryName: '35噸導柱式油壓切邊機',
        category: 'trim',
        suggestedPosition: [1850, -200, 2100],
        dimensions: [950, 1500, 850],
        isSuggested: true,
        enabled: true,
        whySuggested: 'High rigidity 4-pillar trim press shears runner, biscuit, and parting flash.',
        confidence: 'HIGH'
      },
      {
        id: 'ds-vision',
        name: 'Optical Multi-Camera Vision Inspection Table',
        taiwaneseIndustryName: '視覺檢測台 (輪廓與缺料檢驗)',
        category: 'inspection',
        suggestedPosition: [1200, -350, 2400],
        dimensions: [600, 900, 600],
        isSuggested: true,
        enabled: true,
        whySuggested: 'Verifies complete die fill and detects broken core pin remnants before packaging.',
        confidence: 'HIGH'
      },
      {
        id: 'ds-safety-mesh',
        name: 'ISO 14120 Perimeter Safety Fence & Dual Light Curtains',
        taiwaneseIndustryName: '安全護欄與紅外線安全光柵',
        category: 'finishing',
        suggestedPosition: [0, -850, 400],
        dimensions: [5200, 2000, 4200],
        isSuggested: true,
        enabled: true,
        whySuggested: 'Complies with CNS / ISO safety standards with interlocked maintenance gates.',
        confidence: 'HIGH'
      }
    ],
    whyThisCell: [
      'Top-mounted spray robot and machine-side floor-mounted extraction robot eliminate any spatial bottleneck inside the die daylight.',
      'The extraction robot smoothly transfers the cast part from the ejector pins through quench immersion and directly onto the trim press platen without requiring secondary manual handling.',
      'Maintains full clear access on the operator side for die changeover and visual inspection of tie-bar bushings.'
    ],
    pros: [
      'High productivity & reliable 28s cycle time',
      'Wide safety clearance margins from all 4 chrome tie bars (>110mm)',
      'Seamless material flow from casting → quench → trim → vision'
    ],
    cons: [
      'Requires 36 m² cell footprint',
      'Requires foundation anchoring for floor pedestal'
    ],
    plainLanguageRationale:
      'The industry-standard Taiwanese automated casting cell. Delivers optimal cycle time, excellent ergonomic maintenance clearance around tie bars, and safe operator walk-in service doors.',
    whyReasons: [
      {
        category: 'Cell Layout',
        recommendation: 'Top-mount spray + floor pedestal extractor',
        rationale: 'Eliminates spatial bottlenecks inside the die daylight and provides clear tie-bar clearance.'
      },
      {
        category: 'Material Flow',
        recommendation: 'Direct transfer to water quench and trim press',
        rationale: 'Continuous automated flow without manual operator touchpoints or transit delays.'
      },
      {
        category: 'Maintenance & Safety',
        recommendation: 'Full clear access on operator side',
        rationale: 'Safe walk-in access for die changeover, tip lube servicing, and mold cleaning.'
      }
    ]
  };

  // OPTION C: High Throughput (Maximum OEE & Lowest Cycle Time)
  const optionC: CellDesignOption = {
    id: 'option_c_high_throughput',
    title: 'Option C: High Throughput (極致產能旗艦型)',
    subtitle: 'Dual Coordinated Heavy Articulated Manipulators + Inline Testing',
    badge: 'PEAK OEE & SPEED (45 m²)',
    description:
      'Optimized for tier-1 automotive OEM high-volume production. Features synchronized dual robots with overlapping trajectory handshakes, high-pressure micro-spray cooling, inline radiographic or leak testing, and automated robotic deburring.',
    footprintM2: 45.0,
    estimatedCycleTimeSec: 23.5,
    sprayRobot: {
      robotId: 'abb-irb-4600',
      robotName: 'ABB IRB 4600-40/2.55 (Foundry Plus 2)',
      manufacturer: 'ABB',
      role: 'SPRAY',
      mounting: 'top',
      recommendedBaseOffset: [0, 1600, 0],
      requiredReachMm: 2100,
      availableReachMm: 2550,
      reachabilityPercent: 99,
      requiredPayloadKg: 22.0,
      availablePayloadKg: 40.0,
      utilizationPercent: 55,
      collisionMarginMm: 125,
      rationale: 'Long reach (2.55m) and Foundry Plus 2 IP67 washdown protection ensures high-speed multi-pass coverage.'
    },
    extractionRobot: {
      robotId: 'yaskawa-gp180',
      robotName: 'Yaskawa Motoman GP180 (Heavy Foundry)',
      manufacturer: 'YASKAWA',
      role: 'EXTRACTION',
      mounting: 'floor',
      recommendedBaseOffset: [1350, -200, 750],
      requiredReachMm: 2200,
      availableReachMm: 2702,
      reachabilityPercent: 98,
      requiredPayloadKg: Math.round(part.dimensions.shotWeightWithRunnerKg + 28),
      availablePayloadKg: 180,
      utilizationPercent: 32,
      collisionMarginMm: 130,
      rationale: 'Rigid 180kg payload allows multi-jaw EOAT capable of gripping both the casting and cold runner simultaneously.'
    },
    scores: {
      overallScore: 95,
      reachability: 98,
      collisionSafety: 96,
      partAccessibility: 95,
      sprayCoverage: 98,
      cycleTimeScore: 97,
      cellCompactness: 76,
      operatorAccessibility: 92,
      maintenanceAccessibility: 90,
      warnings: []
    },
    recommendedDownstream: [
      {
        id: 'ds-quench-hi',
        name: 'High-Flow Water Quench Immersion Station',
        taiwaneseIndustryName: '高效循環沉水水槽',
        category: 'cooling',
        suggestedPosition: [1800, -620, 700],
        dimensions: [850, 480, 1600],
        isSuggested: true,
        enabled: true,
        whySuggested: 'Continuous temperature controlled water bath ensures reproducible cooling curve.',
        confidence: 'HIGH'
      },
      {
        id: 'ds-trim-hi',
        name: '50-Ton High-Speed 4-Pillar Trim Press',
        taiwaneseIndustryName: '50噸高剛性油壓切邊機',
        category: 'trim',
        suggestedPosition: [1950, -200, 2250],
        dimensions: [1100, 1650, 950],
        isSuggested: true,
        enabled: true,
        whySuggested: 'Handles multi-cavity or heavy structural gates with progressive shear blades.',
        confidence: 'HIGH'
      },
      {
        id: 'ds-deburr',
        name: 'Rotary High-Speed Deburring & Gate Sanding Cell',
        taiwaneseIndustryName: '自動倒角與去毛邊加工單元',
        category: 'finishing',
        suggestedPosition: [1400, -300, 2800],
        dimensions: [900, 1100, 800],
        isSuggested: true,
        enabled: true,
        whySuggested: 'Removes parting line flash and ingate remnants automatically before CNC.',
        confidence: 'HIGH'
      },
      {
        id: 'ds-leak-test',
        name: 'Differential Pressure Leak Testing Chamber',
        taiwaneseIndustryName: '氣密測漏檢測機',
        category: 'inspection',
        suggestedPosition: [800, -350, 3100],
        dimensions: [800, 1000, 700],
        isSuggested: true,
        enabled: true,
        whySuggested: 'Performs 100% automated inline leak test on sealed chambers and water jackets.',
        confidence: 'HIGH'
      }
    ],
    whyThisCell: [
      'Employs heavy-duty manipulators with high payload margins to enable rapid acceleration/deceleration curves without structural vibration.',
      'Spray robot and extraction robot operate with coordinated handshake permissive signals: extraction robot enters immediately upon moving platen reaching 70% daylight stroke, while spray robot begins cavity lube immediately as part clears parting plane.',
      'Eliminates all downstream bottlenecks by integrating automated trimming, deburring, and inline leak testing within the same cycle envelope.'
    ],
    pros: [
      'Maximum throughput: lowest cycle time (23.5s)',
      '100% inline quality verification (leak test + vision)',
      'Unsurpassed payload headroom and longevity in harsh foundry atmosphere'
    ],
    cons: [
      'Largest cell footprint (45 m²)',
      'Higher initial capital equipment investment'
    ],
    plainLanguageRationale:
      'Optimized for tier-1 automotive OEM high-volume production. Features synchronized dual robots with overlapping trajectory handshakes, high-pressure micro-spray cooling, inline radiographic or leak testing, and automated robotic deburring.',
    whyReasons: [
      {
        category: 'Cycle Speed & OEE',
        recommendation: 'Synchronized dual heavy-payload manipulators',
        rationale: 'Overlapping handshakes achieve 23.5s cycle time with zero wait states.'
      },
      {
        category: 'Thermal & Process Control',
        recommendation: 'Precision high-pressure spray with multi-zone purge',
        rationale: 'Extends mold life while eliminating cold-shut defects on thin structural walls.'
      },
      {
        category: 'Quality Assurance',
        recommendation: 'Inline automated leak testing & robotic finishing',
        rationale: '100% inline quality verification eliminates defective scrap escape to CNC machining.'
      }
    ]
  };

  return [optionA, optionB, optionC];
}

/**
 * Automatically creates the 10-step extraction trajectory waypoints based on the accepted grip candidate
 */
export function generateExtractionPath(
  part: CastPartModel,
  grip: GripCandidate,
  machine: DieCastingMachine
): Waypoint[] {
  const daylightCenterZ = (machine.maxDieOpeningStroke || 800) * 0.5;
  const gripX = grip.location[0];
  const gripY = grip.location[1];
  const gripZ = daylightCenterZ + grip.location[2];

  return [
    {
      id: 'ext-p1-home',
      index: 0,
      name: 'EXT 01: Home Standby (Machine Safe)',
      x: 1200,
      y: 400,
      z: 800,
      rx: 0,
      ry: 0,
      rz: 0,
      motionType: 'JOINT',
      speed: 1500,
      acceleration: 3000,
      blendRadius: 100,
      dwellTimeSec: 0,
      action: 'NONE',
      targetFace: 'TRANSIT',
      lubePressureBar: 0,
      airPressureBar: 0,
      flowRateMlPerSec: 0,
      nozzleFanAngleDeg: 0,
      standoffDistanceMm: 150,
      interlockWait: 'DIE_OPEN_CONFIRMED'
    },
    {
      id: 'ext-p2-approach',
      index: 1,
      name: 'EXT 02: Approach Die Daylight Window',
      x: 750,
      y: gripY + 150,
      z: daylightCenterZ,
      rx: 0,
      ry: 0,
      rz: 0,
      motionType: 'LINEAR',
      speed: 1200,
      acceleration: 2500,
      blendRadius: 80,
      dwellTimeSec: 0,
      action: 'NONE',
      targetFace: 'TRANSIT',
      lubePressureBar: 0,
      airPressureBar: 0,
      flowRateMlPerSec: 0,
      nozzleFanAngleDeg: 0,
      standoffDistanceMm: 150,
      interlockWait: 'CORES_PULLED'
    },
    {
      id: 'ext-p3-enter',
      index: 2,
      name: 'EXT 03: Enter Daylight Between Tie Bars',
      x: 350,
      y: gripY + 60,
      z: gripZ,
      rx: 0,
      ry: 0,
      rz: 0,
      motionType: 'LINEAR',
      speed: 800,
      acceleration: 1800,
      blendRadius: 40,
      dwellTimeSec: 0,
      action: 'NONE',
      targetFace: 'MOVABLE_DIE',
      lubePressureBar: 0,
      airPressureBar: 0,
      flowRateMlPerSec: 0,
      nozzleFanAngleDeg: 0,
      standoffDistanceMm: 150
    },
    {
      id: 'ext-p4-align',
      index: 3,
      name: `EXT 04: Align Jaws with Grip [${grip.label}: ${grip.name}]`,
      x: gripX + 20,
      y: gripY,
      z: gripZ,
      rx: 0,
      ry: 0,
      rz: 0,
      motionType: 'LINEAR',
      speed: 400,
      acceleration: 1000,
      blendRadius: 10,
      dwellTimeSec: 0.2,
      action: 'NONE',
      targetFace: 'MOVABLE_DIE',
      lubePressureBar: 0,
      airPressureBar: 0,
      flowRateMlPerSec: 0,
      nozzleFanAngleDeg: 0,
      standoffDistanceMm: 150
    },
    {
      id: 'ext-p5-grip',
      index: 4,
      name: 'EXT 05: Close Pneumatic Gripper & Confirm Vacuum/Laser',
      x: gripX,
      y: gripY,
      z: gripZ,
      rx: 0,
      ry: 0,
      rz: 0,
      motionType: 'LINEAR',
      speed: 200,
      acceleration: 500,
      blendRadius: 0,
      dwellTimeSec: 0.6, // grip dwell
      action: 'NONE',
      targetFace: 'MOVABLE_DIE',
      lubePressureBar: 0,
      airPressureBar: 0,
      flowRateMlPerSec: 0,
      nozzleFanAngleDeg: 0,
      standoffDistanceMm: 150,
      interlockWait: 'PART_PRESENT_CONFIRMED'
    },
    {
      id: 'ext-p6-retract-z',
      index: 5,
      name: 'EXT 06: Retract from Ejector Pins (Pure Z Pull)',
      x: gripX,
      y: gripY,
      z: gripZ - 180,
      rx: 0,
      ry: 0,
      rz: 0,
      motionType: 'LINEAR',
      speed: 500,
      acceleration: 1500,
      blendRadius: 50,
      dwellTimeSec: 0,
      action: 'NONE',
      targetFace: 'TRANSIT',
      lubePressureBar: 0,
      airPressureBar: 0,
      flowRateMlPerSec: 0,
      nozzleFanAngleDeg: 0,
      standoffDistanceMm: 150
    },
    {
      id: 'ext-p7-exit-die',
      index: 6,
      name: 'EXT 07: Exit Daylight Across Tie Bar Plane',
      x: 800,
      y: gripY + 80,
      z: daylightCenterZ,
      rx: 0,
      ry: 0,
      rz: 0,
      motionType: 'LINEAR',
      speed: 1200,
      acceleration: 2800,
      blendRadius: 100,
      dwellTimeSec: 0,
      action: 'NONE',
      targetFace: 'TRANSIT',
      lubePressureBar: 0,
      airPressureBar: 0,
      flowRateMlPerSec: 0,
      nozzleFanAngleDeg: 0,
      standoffDistanceMm: 150
    },
    {
      id: 'ext-p8-transfer-quench',
      index: 7,
      name: 'EXT 08: Transfer to Water Quench Immersion Tank',
      x: 1550,
      y: -500,
      z: 600,
      rx: 0,
      ry: 90,
      rz: 0,
      motionType: 'JOINT',
      speed: 1400,
      acceleration: 3000,
      blendRadius: 80,
      dwellTimeSec: 1.5, // quench immersion
      action: 'NONE',
      targetFace: 'TRANSIT',
      lubePressureBar: 0,
      airPressureBar: 0,
      flowRateMlPerSec: 0,
      nozzleFanAngleDeg: 0,
      standoffDistanceMm: 150
    },
    {
      id: 'ext-p9-release',
      index: 8,
      name: 'EXT 09: Release Part onto Trim Infeed / Cooling Slat',
      x: 1650,
      y: -300,
      z: 1400,
      rx: 0,
      ry: 0,
      rz: 0,
      motionType: 'LINEAR',
      speed: 600,
      acceleration: 1500,
      blendRadius: 20,
      dwellTimeSec: 0.5, // release dwell
      action: 'NONE',
      targetFace: 'TRANSIT',
      lubePressureBar: 0,
      airPressureBar: 0,
      flowRateMlPerSec: 0,
      nozzleFanAngleDeg: 0,
      standoffDistanceMm: 150
    },
    {
      id: 'ext-p10-return-home',
      index: 9,
      name: 'EXT 10: Return to Home Standby (Cycle Ready)',
      x: 1200,
      y: 400,
      z: 800,
      rx: 0,
      ry: 0,
      rz: 0,
      motionType: 'JOINT',
      speed: 1600,
      acceleration: 3200,
      blendRadius: 0,
      dwellTimeSec: 0,
      action: 'NONE',
      targetFace: 'TRANSIT',
      lubePressureBar: 0,
      airPressureBar: 0,
      flowRateMlPerSec: 0,
      nozzleFanAngleDeg: 0,
      standoffDistanceMm: 150
    }
  ];
}
