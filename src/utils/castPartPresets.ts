/**
 * Realistic Cast-Part Geometry Presets for Taiwanese Die Casting Foundry Applications
 */

import { CastPartModel, GripCandidate, GeometricFeature, ManufacturingProcessStep } from '../types/castPart';

export const SAMPLE_CAST_PARTS: CastPartModel[] = [
  {
    id: 'part-transmission-case',
    name: 'Automotive V6 Transmission Housing',
    taiwaneseIndustryName: 'V6 汽車自動變速箱殼體 (高壓鑄造)',
    alloyGrade: 'JIS ADC12 / A380 Aluminum Alloy',
    category: 'automotive',
    recommendedMachineTonnage: 1250,
    visualMeshType: 'transmission_case',
    dimensions: {
      lengthMm: 620,
      widthMm: 540,
      heightMm: 195,
      wallThicknessMinMm: 2.5,
      wallThicknessMaxMm: 6.8,
      volumeCm3: 1780,
      estimatedMassKg: 4.81,
      shotWeightWithRunnerKg: 6.54
    },
    moldOpeningDirection: [0, 0, 1], // +Z daylight opening
    extractionDirection: [0, 0, 1],
    features: [
      {
        id: 'f-gear-cav',
        name: 'Main Planetary Gear Chamber',
        category: 'deep_pocket',
        position: [-60, 20, -35],
        dimensions: [240, 220, 110],
        draftAngleDeg: 2.0,
        isCosmetic: false,
        notes: 'Deep pocket requiring high-pressure micro-spray cooling & lubricity'
      },
      {
        id: 'f-gasket-flange',
        name: 'Perimeter Gasket Sealing Flange',
        category: 'planar_surface',
        position: [0, 0, 15],
        dimensions: [580, 500, 22],
        draftAngleDeg: 1.5,
        isCosmetic: true,
        notes: 'Precision machined planar gasket face; strictly avoid robot gripper jaw contact'
      },
      {
        id: 'f-bearing-boss',
        name: 'Heavy Output Shaft Bearing Boss',
        category: 'boss',
        position: [110, -40, -20],
        dimensions: [130, 130, 85],
        draftAngleDeg: 2.5,
        isCosmetic: false,
        notes: 'Heavy structural boss; ideal mechanical gripping location'
      },
      {
        id: 'f-stiffener-ribs',
        name: 'Oil Sump Reinforcement Rib Grid',
        category: 'rib',
        position: [-110, -110, -10],
        dimensions: [160, 100, 35],
        draftAngleDeg: 3.0,
        isCosmetic: false,
        notes: 'Thin ribs (2.8mm) susceptible to thermal cracking if over-cooled'
      },
      {
        id: 'f-undercut-slide',
        name: 'Lateral Reverse Shift Shaft Port',
        category: 'undercut',
        position: [260, 40, -10],
        dimensions: [75, 75, 80],
        draftAngleDeg: 2.0,
        isCosmetic: false,
        notes: 'Requires hydraulic core pull slide interlock before part ejection'
      },
      {
        id: 'f-runner-biscuit',
        name: 'Ingate Runner Tree & Shot Biscuit',
        category: 'runner_biscuit',
        position: [0, -240, -25],
        dimensions: [140, 65, 80],
        draftAngleDeg: 5.0,
        isCosmetic: false,
        notes: 'Heavy sacrificial runner hub; primary extraction grip point'
      }
    ],
    gripCandidates: [
      {
        id: 'grip-a-biscuit',
        label: 'A',
        name: 'Ingate Runner Hub & Biscuit Stem',
        location: [0, -240, 20],
        approachDirection: [0, 1, 0],
        gripWidthMm: 95,
        recommendedEoatType: 'runner_clamp',
        stabilityScore: 98,
        clearanceScore: 95,
        cosmeticRisk: 'LOW',
        status: 'RECOMMENDED',
        description: 'Grips onto sacrificial aluminum biscuit stem. 0% cosmetic risk to finished housing, maximum mechanical stability, safe tie-bar clearance.',
        mitigation: 'Verify clamping cylinder force (min 1.2 kN) before platen open limit.'
      },
      {
        id: 'grip-b-boss',
        label: 'B',
        name: 'Heavy Output Shaft Bearing Boss Flange',
        location: [110, -40, 30],
        approachDirection: [1, 0, 0],
        gripWidthMm: 125,
        recommendedEoatType: 'custom_contour_jaw',
        stabilityScore: 86,
        clearanceScore: 82,
        cosmeticRisk: 'MEDIUM',
        status: 'ACCEPTABLE',
        description: 'Direct grip on external structural boss. Good stability, but requires protective polyurethane jaw pads to avoid marring.',
        mitigation: 'Use sensor-monitored compliant soft jaws.'
      },
      {
        id: 'grip-c-pocket',
        label: 'C',
        name: 'Deep Gear Chamber Internal Rib',
        location: [-60, 20, -10],
        approachDirection: [0, 0, 1],
        gripWidthMm: 80,
        recommendedEoatType: '2_finger_parallel',
        stabilityScore: 54,
        clearanceScore: 48,
        cosmeticRisk: 'HIGH',
        status: 'NOT_RECOMMENDED',
        description: 'Gripping inside deep cavity risks contacting internal bearing surfaces and risks collision with fixed die core pins.',
        mitigation: 'Not recommended for production. Risk of die daylight interference.'
      }
    ],
    suggestedProcess: [
      {
        id: 'proc-cast',
        order: 1,
        name: 'High-Pressure Die Casting',
        category: 'casting',
        stationName: 'Toyo BD-1250V7EX Injection & Solidification',
        cycleTimeSec: 14.5,
        enabled: true,
        confidence: 'HIGH',
        factType: 'GEOMETRY_DERIVED_FACT',
        description: 'Molten aluminum alloy injected at 45 m/s with 80 MPa intensification pressure; dwell 8.5s for thick boss solidification.',
        equipmentRequired: 'Toyo BD-1250V7EX DCM + StrikoWestofen Dosing Furnace'
      },
      {
        id: 'proc-open',
        order: 2,
        name: 'Die Opening & Hydraulic Core Slide Retraction',
        category: 'casting',
        stationName: 'Movable Platen Daylight Stroke',
        cycleTimeSec: 3.8,
        enabled: true,
        confidence: 'HIGH',
        factType: 'GEOMETRY_DERIVED_FACT',
        description: 'Movable platen retracts 850mm. Dual hydraulic slide cores pull out lateral shaft ports. Ejector pins advance 75mm.',
        equipmentRequired: 'Toyo System 700EX Core Pull Interlock'
      },
      {
        id: 'proc-extract',
        order: 3,
        name: 'Articulated Robot Part Extraction',
        category: 'extraction',
        stationName: 'Daylight Extraction Stance',
        cycleTimeSec: 5.2,
        enabled: true,
        confidence: 'HIGH',
        factType: 'AUTOMATION_INFERENCE',
        description: '6-axis extraction robot enters die daylight, locks pneumatic contour jaws on biscuit stem, confirms part presence via laser sensor, and extracts clear of tie bars.',
        equipmentRequired: 'Heavy Extraction Robot (Yaskawa GP50 / Motoman GP180)'
      },
      {
        id: 'proc-cool',
        order: 4,
        name: 'Water Immersion Quench & Steam Exhaust',
        category: 'cooling',
        stationName: 'Stainless Steel Water Quench Tank',
        cycleTimeSec: 6.0,
        enabled: true,
        confidence: 'HIGH',
        factType: 'AUTOMATION_INFERENCE',
        description: 'Submerges cast housing in 45°C water bath for controlled metallurgical cooling to prevent thermal distortion before trimming.',
        equipmentRequired: 'Immersion Quench Tank & Vapor Extraction Hood'
      },
      {
        id: 'proc-trim',
        order: 5,
        name: 'Hydraulic Trim Press (De-gating & Flash Removal)',
        category: 'trimming',
        stationName: '4-Pillar Hydraulic Trim Press (油壓切邊機)',
        cycleTimeSec: 4.5,
        enabled: true,
        confidence: 'HIGH',
        factType: 'AUTOMATION_INFERENCE',
        description: 'Trim die shears ingate runner, overflows, and parting flash in a single stroke. Slugs fall into lower scrap return chute.',
        equipmentRequired: '35-Ton 4-Pillar Hydraulic Trim Press'
      },
      {
        id: 'proc-deburr',
        order: 6,
        name: 'Robotic Deburring & Edge Chamfering',
        category: 'deburring',
        stationName: 'Spindle Deburring Station',
        cycleTimeSec: 6.5,
        enabled: false,
        confidence: 'MEDIUM',
        factType: 'ENGINEER_CONFIRMATION_REQUIRED',
        description: 'Rotary diamond brush deflashes perimeter gasket parting line to eliminate aluminum burrs before CNC machining.',
        equipmentRequired: 'Dual-Spindle Deburring Cell'
      },
      {
        id: 'proc-inspect',
        order: 7,
        name: 'Vision Defect & Dimensional Inspection',
        category: 'inspection',
        stationName: 'Multi-Camera Optical Vision Table',
        cycleTimeSec: 2.5,
        enabled: true,
        confidence: 'HIGH',
        factType: 'AUTOMATION_INFERENCE',
        description: '4 high-resolution cameras verify complete fill, inspect core-pin presence, check for cold-shuts, and detect flash remnants.',
        equipmentRequired: 'Keyence Vision Optical Inspection Station'
      },
      {
        id: 'proc-pack',
        order: 8,
        name: 'Finished Part Conveyor & Tote Packing',
        category: 'packaging',
        stationName: 'Outfeed Gravity Roller Table',
        cycleTimeSec: 3.0,
        enabled: true,
        confidence: 'HIGH',
        factType: 'GEOMETRY_DERIVED_FACT',
        description: 'Parts unloaded onto outfeed conveyor for transport to secondary CNC milling or operator quality audit.',
        equipmentRequired: 'Motorized Outfeed Slat Conveyor'
      }
    ]
  },
  {
    id: 'part-ev-motor-housing',
    name: 'EV Motor Stator Housing / End-Bell',
    taiwaneseIndustryName: '電動車驅動馬達端蓋殼體 (一體成型冷卻水路)',
    alloyGrade: 'AlSi10Mg High Thermal Conductivity Alloy',
    category: 'ev_powertrain',
    recommendedMachineTonnage: 850,
    visualMeshType: 'ev_motor_casing',
    dimensions: {
      lengthMm: 460,
      widthMm: 460,
      heightMm: 165,
      wallThicknessMinMm: 2.8,
      wallThicknessMaxMm: 8.5,
      volumeCm3: 1350,
      estimatedMassKg: 3.65,
      shotWeightWithRunnerKg: 5.12
    },
    moldOpeningDirection: [0, 0, 1],
    extractionDirection: [0, 0, 1],
    features: [
      {
        id: 'f-stator-bore',
        name: 'Central Stator Fitting Bore',
        category: 'deep_pocket',
        position: [0, 0, -20],
        dimensions: [290, 290, 120],
        draftAngleDeg: 1.5,
        isCosmetic: true,
        notes: 'Tight-tolerance cylindrical bore; must maintain precise circularity'
      },
      {
        id: 'f-spiral-cooling',
        name: 'Spiral Water Jacket Rib Channels',
        category: 'rib',
        position: [0, 0, -10],
        dimensions: [360, 360, 45],
        draftAngleDeg: 2.0,
        isCosmetic: false,
        notes: 'High heat zone requiring intensive micro-spray cooling'
      },
      {
        id: 'f-bearing-pocket',
        name: 'Rotor Shaft Center Bearing Recess',
        category: 'boss',
        position: [0, 0, 40],
        dimensions: [90, 90, 60],
        draftAngleDeg: 2.5,
        isCosmetic: false,
        notes: 'Rigid central cylindrical boss; prime 3-finger gripper target'
      },
      {
        id: 'f-mounting-flange',
        name: 'Perimeter Inverter Mounting Lugs (12 Holes)',
        category: 'planar_surface',
        position: [0, 0, 60],
        dimensions: [440, 440, 18],
        draftAngleDeg: 2.0,
        isCosmetic: true,
        notes: 'Peripheral mounting face with through holes'
      },
      {
        id: 'f-ev-runner',
        name: 'Center Sprued Runner Biscuit',
        category: 'runner_biscuit',
        position: [0, -180, -30],
        dimensions: [110, 60, 75],
        draftAngleDeg: 4.5,
        isCosmetic: false,
        notes: 'Sub-runner junction hub'
      }
    ],
    gripCandidates: [
      {
        id: 'grip-ev-biscuit',
        label: 'A',
        name: 'Runner Biscuit Hub Stem',
        location: [0, -180, 20],
        approachDirection: [0, 1, 0],
        gripWidthMm: 85,
        recommendedEoatType: 'runner_clamp',
        stabilityScore: 96,
        clearanceScore: 94,
        cosmeticRisk: 'LOW',
        status: 'RECOMMENDED',
        description: 'Grips onto sacrificial runner. Eliminates any contact with precision stator bore, safe daylight clearance.',
        mitigation: 'Standard pneumatic toggle gripper with serrated steel jaws.'
      },
      {
        id: 'grip-ev-center-bore',
        label: 'B',
        name: 'Rotor Center Bearing Boss (Internal 3-Finger Expansion)',
        location: [0, 0, 35],
        approachDirection: [0, 0, 1],
        gripWidthMm: 90,
        recommendedEoatType: '3_finger_centering',
        stabilityScore: 91,
        clearanceScore: 89,
        cosmeticRisk: 'MEDIUM',
        status: 'ACCEPTABLE',
        description: 'Internal 3-finger self-centering radial expansion inside bearing hub. Perfect balance and center-of-gravity alignment.',
        mitigation: 'Use brass/polyurethane expansion pads to prevent bearing bore indentation.'
      },
      {
        id: 'grip-ev-outer-rim',
        label: 'C',
        name: 'Outer Perimeter Inverter Flange Rim',
        location: [210, 0, 50],
        approachDirection: [-1, 0, 0],
        gripWidthMm: 65,
        recommendedEoatType: '2_finger_parallel',
        stabilityScore: 68,
        clearanceScore: 60,
        cosmeticRisk: 'HIGH',
        status: 'NOT_RECOMMENDED',
        description: 'Single-sided rim gripping creates cantilever bending moment on hot casting; risks bending thin mounting lugs.',
        mitigation: 'Avoid single-sided outer rim gripping.'
      }
    ],
    suggestedProcess: [
      {
        id: 'proc-ev-cast',
        order: 1,
        name: 'High-Pressure Die Casting',
        category: 'casting',
        stationName: 'Toyo BD-850V7EX Injection',
        cycleTimeSec: 12.0,
        enabled: true,
        confidence: 'HIGH',
        factType: 'GEOMETRY_DERIVED_FACT',
        description: 'High thermal conductivity alloy injected under vacuum assist to minimize gas porosity in cooling channels.',
        equipmentRequired: 'Toyo BD-850V7EX DCM + Fondarex Vacuum Unit'
      },
      {
        id: 'proc-ev-open',
        order: 2,
        name: 'Die Opening & Core Slide Release',
        category: 'casting',
        stationName: 'Daylight Opening',
        cycleTimeSec: 3.2,
        enabled: true,
        confidence: 'HIGH',
        factType: 'GEOMETRY_DERIVED_FACT',
        description: 'Platen opens 720mm. Core pins extract from stator water jacket ports.',
        equipmentRequired: 'Toyo System 700EX Platen Control'
      },
      {
        id: 'proc-ev-extract',
        order: 3,
        name: 'Robot Part Extraction',
        category: 'extraction',
        stationName: 'Robot Extraction',
        cycleTimeSec: 4.8,
        enabled: true,
        confidence: 'HIGH',
        factType: 'AUTOMATION_INFERENCE',
        description: 'Robot grips central bearing boss or runner hub; smoothly pulls casting off moving core pins.',
        equipmentRequired: 'Yaskawa GP35 / GP50 6-Axis Robot'
      },
      {
        id: 'proc-ev-cool',
        order: 4,
        name: 'Air Cooling Conveyor (No-Quench Distortion Control)',
        category: 'cooling',
        stationName: 'High-Volume Blower Cooling Tunnel',
        cycleTimeSec: 18.0,
        enabled: true,
        confidence: 'MEDIUM',
        factType: 'ENGINEER_CONFIRMATION_REQUIRED',
        description: 'Controlled forced-air cooling prevents quench thermal shock from distorting the precision stator bore.',
        equipmentRequired: 'Multi-Fan Air Cooling Tunnel'
      },
      {
        id: 'proc-ev-trim',
        order: 5,
        name: 'Trim Press De-gating & Overflow Cut',
        category: 'trimming',
        stationName: '25-Ton Hydraulic Trim Press',
        cycleTimeSec: 4.2,
        enabled: true,
        confidence: 'HIGH',
        factType: 'AUTOMATION_INFERENCE',
        description: 'Precision trimming of parting flash and biscuit.',
        equipmentRequired: '25T Trim Press with Floating Guide Bushings'
      },
      {
        id: 'proc-ev-leak',
        order: 6,
        name: 'Helium / Air Decay Leak Testing',
        category: 'inspection',
        stationName: 'Differential Pressure Leak Station',
        cycleTimeSec: 5.5,
        enabled: true,
        confidence: 'HIGH',
        factType: 'AUTOMATION_INFERENCE',
        description: 'Pressurizes water jacket to 3.5 bar to verify 0.0 cm3/min air leakage across internal cooling circuit.',
        equipmentRequired: 'Cosmo Air Decay Leak Tester'
      }
    ]
  },
  {
    id: 'part-shock-tower',
    name: 'Front Shock Tower Mega-Casting',
    taiwaneseIndustryName: '前避震塔一體化車身結構件 (超大型鋁合金壓鑄)',
    alloyGrade: 'Castasil-37 / AlMg5Si2Mn High Ductility Alloy',
    category: 'structural_chassis',
    recommendedMachineTonnage: 2000,
    visualMeshType: 'shock_tower',
    dimensions: {
      lengthMm: 720,
      widthMm: 640,
      heightMm: 270,
      wallThicknessMinMm: 2.2,
      wallThicknessMaxMm: 5.0,
      volumeCm3: 2150,
      estimatedMassKg: 5.8,
      shotWeightWithRunnerKg: 8.9
    },
    moldOpeningDirection: [0, 0, 1],
    extractionDirection: [0, 0, 1],
    features: [
      {
        id: 'f-spring-dome',
        name: 'Deep Draw Suspension Spring Dome',
        category: 'deep_pocket',
        position: [0, 60, -65],
        dimensions: [260, 260, 170],
        draftAngleDeg: 1.8,
        isCosmetic: false,
        notes: 'Deep cavity draw; high risk of soldering to die steel if spray is uneven'
      },
      {
        id: 'f-longitudinal-rail',
        name: 'Front Longitudinal Rail Joining Lugs',
        category: 'boss',
        position: [-180, -140, -20],
        dimensions: [160, 95, 60],
        draftAngleDeg: 2.0,
        isCosmetic: false,
        notes: 'Thick structural joining pad for self-piercing riveting (SPR)'
      },
      {
        id: 'f-strut-biscuit',
        name: 'Heavy Dual-Branch Biscuit & Ingate',
        category: 'runner_biscuit',
        position: [0, -260, -35],
        dimensions: [180, 80, 90],
        draftAngleDeg: 5.0,
        isCosmetic: false,
        notes: 'Massive biscuit (diameter 110mm); primary structural clamping zone'
      }
    ],
    gripCandidates: [
      {
        id: 'grip-st-biscuit',
        label: 'A',
        name: 'Massive Dual Ingate Biscuit',
        location: [0, -260, 30],
        approachDirection: [0, 1, 0],
        gripWidthMm: 140,
        recommendedEoatType: 'runner_clamp',
        stabilityScore: 97,
        clearanceScore: 96,
        cosmeticRisk: 'LOW',
        status: 'RECOMMENDED',
        description: 'Strong grip on heavy biscuit. Easily holds 8.9 kg shot mass without deflecting thin sheet walls.',
        mitigation: 'Dual hydraulic wedge clamp.'
      },
      {
        id: 'grip-st-dome-rim',
        label: 'B',
        name: 'Spring Dome Rim Stiffener Flange',
        location: [0, 60, 45],
        approachDirection: [0, -1, 0],
        gripWidthMm: 110,
        recommendedEoatType: 'custom_contour_jaw',
        stabilityScore: 84,
        clearanceScore: 78,
        cosmeticRisk: 'MEDIUM',
        status: 'ACCEPTABLE',
        description: 'Grips dome perimeter flange. Good center of gravity, but requires deep reach into die daylight.',
        mitigation: 'Verify clearance to upper tie bars.'
      }
    ],
    suggestedProcess: [
      {
        id: 'proc-st-cast',
        order: 1,
        name: 'Mega-Vacuum Die Casting',
        category: 'casting',
        stationName: 'Toyo BD-2000V7EX Mega DCM',
        cycleTimeSec: 22.0,
        enabled: true,
        confidence: 'HIGH',
        factType: 'GEOMETRY_DERIVED_FACT',
        description: '2,000-ton clamping force, multi-channel high-vacuum (<30 mbar) for crash-ductile performance.',
        equipmentRequired: 'Toyo BD-2000V7EX + Multi-Port Vacuum'
      },
      {
        id: 'proc-st-open',
        order: 2,
        name: 'Die Daylight Opening',
        category: 'casting',
        stationName: 'Daylight Opening',
        cycleTimeSec: 4.8,
        enabled: true,
        confidence: 'HIGH',
        factType: 'GEOMETRY_DERIVED_FACT',
        description: '1,100mm opening stroke to clear deep spring dome.',
        equipmentRequired: 'Toyo Movable Platen'
      },
      {
        id: 'proc-st-extract',
        order: 3,
        name: 'Heavy Robot Extraction',
        category: 'extraction',
        stationName: 'Robot Extraction',
        cycleTimeSec: 6.5,
        enabled: true,
        confidence: 'HIGH',
        factType: 'AUTOMATION_INFERENCE',
        description: 'Yaskawa Motoman GP180 or Fanuc R-2000iC extracts 8.9kg part with heavy-duty biscuit gripper.',
        equipmentRequired: 'Heavy Industrial Robot (GP180/R-2000iC)'
      },
      {
        id: 'proc-st-cool',
        order: 4,
        name: 'Submerged Water Quench',
        category: 'cooling',
        stationName: 'High-Capacity Quench Tank',
        cycleTimeSec: 8.0,
        enabled: true,
        confidence: 'HIGH',
        factType: 'AUTOMATION_INFERENCE',
        description: 'Immediate water quench to freeze supersaturated solid solution for subsequent T6/T7 heat treatment.',
        equipmentRequired: 'Large Stainless Quench Tank & Vapor Extraction'
      },
      {
        id: 'proc-st-trim',
        order: 5,
        name: '50-Ton 4-Pillar Trim Press',
        category: 'trimming',
        stationName: '50T Trim Press',
        cycleTimeSec: 5.5,
        enabled: true,
        confidence: 'HIGH',
        factType: 'AUTOMATION_INFERENCE',
        description: 'Trims heavy runner biscuit, flash, and 8 perimeter overflows.',
        equipmentRequired: '50T Heavy Trim Press'
      },
      {
        id: 'proc-st-xray',
        order: 6,
        name: 'Inline X-Ray / CT Porosity Audit',
        category: 'inspection',
        stationName: 'Radiographic Inspection Chamber',
        cycleTimeSec: 12.0,
        enabled: true,
        confidence: 'HIGH',
        factType: 'AUTOMATION_INFERENCE',
        description: 'Verifies zero critical porosity in safety-critical SPR rivet zones.',
        equipmentRequired: 'Automated 2D X-Ray / CT System'
      }
    ]
  },
  {
    id: 'part-heatsink-5g',
    name: '5G Telecom Base Station Pin-Fin Heat Sink',
    taiwaneseIndustryName: '5G 通訊基地台高散熱針狀鰭片外殼',
    alloyGrade: 'AlSi9Cu3 / High Thermal Transfer Grade',
    category: 'telecom_5g',
    recommendedMachineTonnage: 500,
    visualMeshType: 'heatsink_enclosure',
    dimensions: {
      lengthMm: 480,
      widthMm: 420,
      heightMm: 95,
      wallThicknessMinMm: 1.8,
      wallThicknessMaxMm: 4.2,
      volumeCm3: 890,
      estimatedMassKg: 2.4,
      shotWeightWithRunnerKg: 3.3
    },
    moldOpeningDirection: [0, 0, 1],
    extractionDirection: [0, 0, 1],
    features: [
      {
        id: 'f-fin-matrix',
        name: 'High-Density Pin-Fin Matrix (480 Pins)',
        category: 'rib',
        position: [0, 0, -22],
        dimensions: [380, 340, 55],
        draftAngleDeg: 1.2,
        isCosmetic: true,
        notes: 'Ultra-dense pin fins; requires micro-spray lubricant to prevent fin soldering'
      },
      {
        id: 'f-rf-pocket',
        name: 'RF Shielding Cavity Pockets',
        category: 'deep_pocket',
        position: [0, -40, 15],
        dimensions: [320, 260, 30],
        draftAngleDeg: 1.5,
        isCosmetic: false,
        notes: 'Isolated RF circuit pockets'
      },
      {
        id: 'f-heatsink-biscuit',
        name: 'Side Fan-Gate Runner Biscuit',
        category: 'runner_biscuit',
        position: [0, -190, -15],
        dimensions: [120, 45, 60],
        draftAngleDeg: 4.0,
        isCosmetic: false,
        notes: 'Fan gate runner'
      }
    ],
    gripCandidates: [
      {
        id: 'grip-hs-biscuit',
        label: 'A',
        name: 'Side Fan-Gate Biscuit Stem',
        location: [0, -190, 15],
        approachDirection: [0, 1, 0],
        gripWidthMm: 75,
        recommendedEoatType: 'runner_clamp',
        stabilityScore: 95,
        clearanceScore: 96,
        cosmeticRisk: 'LOW',
        status: 'RECOMMENDED',
        description: 'Safely clamps onto fan gate runner. 0% contact with delicate pin fins.',
        mitigation: 'Pneumatic parallel clamp.'
      },
      {
        id: 'grip-hs-flange',
        label: 'B',
        name: 'Rear Housing Perimeter Gasket Flange',
        location: [220, 0, 20],
        approachDirection: [-1, 0, 0],
        gripWidthMm: 50,
        recommendedEoatType: '2_finger_parallel',
        stabilityScore: 82,
        clearanceScore: 84,
        cosmeticRisk: 'MEDIUM',
        status: 'ACCEPTABLE',
        description: 'Gripping outer flange edge.',
        mitigation: 'Soft elastomer jaw pads.'
      }
    ],
    suggestedProcess: [
      {
        id: 'proc-hs-cast',
        order: 1,
        name: 'Fast-Shot HPDC Injection',
        category: 'casting',
        stationName: 'Toyo BD-500V7EX DCM',
        cycleTimeSec: 9.5,
        enabled: true,
        confidence: 'HIGH',
        factType: 'GEOMETRY_DERIVED_FACT',
        description: 'High injection plunger speed (6.5 m/s) to fill 480 pin fins before metal freezing.',
        equipmentRequired: 'Toyo BD-500V7EX High-Speed DCM'
      },
      {
        id: 'proc-hs-extract',
        order: 2,
        name: 'Robot Part Extraction',
        category: 'extraction',
        stationName: 'Extraction Robot',
        cycleTimeSec: 3.8,
        enabled: true,
        confidence: 'HIGH',
        factType: 'AUTOMATION_INFERENCE',
        description: 'Fast extraction of lightweight heat sink casting.',
        equipmentRequired: 'Yaskawa GP25 6-Axis Robot'
      },
      {
        id: 'proc-hs-cool',
        order: 3,
        name: 'Air Cooling Conveyor',
        category: 'cooling',
        stationName: 'Air Cooling Slat Conveyor',
        cycleTimeSec: 15.0,
        enabled: true,
        confidence: 'HIGH',
        factType: 'AUTOMATION_INFERENCE',
        description: 'Gradual air cooling prevents pin-fin thermal shock bending.',
        equipmentRequired: 'Enclosed Blower Conveyor'
      },
      {
        id: 'proc-hs-trim',
        order: 4,
        name: 'Trim Press Gate Shearing',
        category: 'trimming',
        stationName: '15-Ton Hydraulic Trim Press',
        cycleTimeSec: 3.5,
        enabled: true,
        confidence: 'HIGH',
        factType: 'AUTOMATION_INFERENCE',
        description: 'Shears fan-gate runner and overflow chill blocks.',
        equipmentRequired: '15T High-Speed Trim Press'
      }
    ]
  },
  {
    id: 'part-steering-knuckle',
    name: 'Automotive Steering Knuckle / Wheel Carrier',
    taiwaneseIndustryName: '汽車底盤高強韌轉向節 (轉向羊角)',
    alloyGrade: 'AlSi7Mg0.3 Structural Alloy',
    category: 'structural_chassis',
    recommendedMachineTonnage: 650,
    visualMeshType: 'steering_knuckle',
    dimensions: {
      lengthMm: 390,
      widthMm: 310,
      heightMm: 155,
      wallThicknessMinMm: 4.5,
      wallThicknessMaxMm: 16.0,
      volumeCm3: 1120,
      estimatedMassKg: 3.02,
      shotWeightWithRunnerKg: 4.65
    },
    moldOpeningDirection: [0, 0, 1],
    extractionDirection: [0, 0, 1],
    features: [
      {
        id: 'f-wheel-bearing',
        name: 'Central Wheel Bearing Hub Ring',
        category: 'boss',
        position: [0, 0, 0],
        dimensions: [140, 140, 90],
        draftAngleDeg: 2.0,
        isCosmetic: false,
        notes: 'High-rigidity central hub ring'
      },
      {
        id: 'f-brake-caliper-lug',
        name: 'Brake Caliper Mounting Ears',
        category: 'boss',
        position: [130, 70, 10],
        dimensions: [90, 60, 45],
        draftAngleDeg: 2.5,
        isCosmetic: false,
        notes: 'Thick structural lugs'
      },
      {
        id: 'f-knuckle-biscuit',
        name: 'Central Ingate Runner Biscuit',
        category: 'runner_biscuit',
        position: [0, -140, -25],
        dimensions: [100, 60, 70],
        draftAngleDeg: 4.5,
        isCosmetic: false,
        notes: 'Center ingate hub'
      }
    ],
    gripCandidates: [
      {
        id: 'grip-kn-biscuit',
        label: 'A',
        name: 'Runner Biscuit Stem Hub',
        location: [0, -140, 25],
        approachDirection: [0, 1, 0],
        gripWidthMm: 90,
        recommendedEoatType: 'runner_clamp',
        stabilityScore: 98,
        clearanceScore: 96,
        cosmeticRisk: 'LOW',
        status: 'RECOMMENDED',
        description: 'Safe clamping on sacrificial runner biscuit.',
        mitigation: 'Dual pneumatic clamp.'
      },
      {
        id: 'grip-kn-hub',
        label: 'B',
        name: 'Central Bearing Bore Outer Shell',
        location: [0, 0, 30],
        approachDirection: [0, 0, 1],
        gripWidthMm: 120,
        recommendedEoatType: 'custom_contour_jaw',
        stabilityScore: 92,
        clearanceScore: 88,
        cosmeticRisk: 'LOW',
        status: 'ACCEPTABLE',
        description: 'Robust grip on center hub.',
        mitigation: 'Machined steel jaws.'
      }
    ],
    suggestedProcess: [
      {
        id: 'proc-kn-cast',
        order: 1,
        name: 'High-Integrity Die Casting',
        category: 'casting',
        stationName: 'Toyo BD-650V7EX DCM',
        cycleTimeSec: 13.5,
        enabled: true,
        confidence: 'HIGH',
        factType: 'GEOMETRY_DERIVED_FACT',
        description: 'High intensification squeeze for thick bearing sections.',
        equipmentRequired: 'Toyo BD-650V7EX DCM'
      },
      {
        id: 'proc-kn-extract',
        order: 2,
        name: 'Robot Part Extraction',
        category: 'extraction',
        stationName: 'Extraction Robot',
        cycleTimeSec: 4.5,
        enabled: true,
        confidence: 'HIGH',
        factType: 'AUTOMATION_INFERENCE',
        description: 'Robot pulls heavy knuckle off ejector pins.',
        equipmentRequired: 'Yaskawa GP35 Robot'
      },
      {
        id: 'proc-kn-quench',
        order: 3,
        name: 'Water Quench Immersion',
        category: 'cooling',
        stationName: 'Quench Tank',
        cycleTimeSec: 6.0,
        enabled: true,
        confidence: 'HIGH',
        factType: 'AUTOMATION_INFERENCE',
        description: 'Rapid quench prepares alloy for subsequent T6 precipitation hardening.',
        equipmentRequired: 'Water Quench Tank'
      },
      {
        id: 'proc-kn-trim',
        order: 4,
        name: 'Trim Press Flash Shearing',
        category: 'trimming',
        stationName: '30-Ton Trim Press',
        cycleTimeSec: 4.2,
        enabled: true,
        confidence: 'HIGH',
        factType: 'AUTOMATION_INFERENCE',
        description: 'Trim die removes heavy ingates and overflows.',
        equipmentRequired: '30T Trim Press'
      }
    ]
  },
  {
    id: 'part-battery-tray',
    name: 'EV Lower Battery Enclosure Tray',
    taiwaneseIndustryName: '電動車底盤電池包模組托盤 (大面積結構件)',
    alloyGrade: 'AlSi10MnMg High-Formability Structural Alloy',
    category: 'ev_powertrain',
    recommendedMachineTonnage: 2500,
    visualMeshType: 'battery_tray',
    dimensions: {
      lengthMm: 980,
      widthMm: 780,
      heightMm: 110,
      wallThicknessMinMm: 2.2,
      wallThicknessMaxMm: 4.8,
      volumeCm3: 2850,
      estimatedMassKg: 7.7,
      shotWeightWithRunnerKg: 11.2
    },
    moldOpeningDirection: [0, 0, 1],
    extractionDirection: [0, 0, 1],
    features: [
      {
        id: 'f-bat-cells',
        name: 'Battery Module Bays (3 Compartments)',
        category: 'planar_surface',
        position: [0, 0, -15],
        dimensions: [880, 680, 50],
        draftAngleDeg: 1.5,
        isCosmetic: true,
        notes: 'Large planar cooling floor; requires vacuum suction assist for safe extraction'
      },
      {
        id: 'f-crash-perimeter',
        name: 'Perimeter Crash Hollow Cross-Members',
        category: 'rib',
        position: [0, 0, 20],
        dimensions: [940, 740, 45],
        draftAngleDeg: 2.0,
        isCosmetic: false,
        notes: 'Crash absorption frame'
      },
      {
        id: 'f-bat-biscuit',
        name: 'Dual Ingate Biscuit Bar',
        category: 'runner_biscuit',
        position: [0, -360, -30],
        dimensions: [240, 70, 95],
        draftAngleDeg: 5.0,
        isCosmetic: false,
        notes: 'Multi-port ingate runner'
      }
    ],
    gripCandidates: [
      {
        id: 'grip-bat-hybrid',
        label: 'A',
        name: 'Hybrid Mechanical Clamp + Vacuum Suction Matrix',
        location: [0, 0, 40],
        approachDirection: [0, 0, 1],
        gripWidthMm: 600,
        recommendedEoatType: 'vacuum_planar_cup',
        stabilityScore: 98,
        clearanceScore: 92,
        cosmeticRisk: 'LOW',
        status: 'RECOMMENDED',
        description: 'Large frame EOAT with dual mechanical runner clamps and 6 high-temperature silicone suction cups to distribute weight across large planar surface.',
        mitigation: 'Requires multi-venturi vacuum generator.'
      },
      {
        id: 'grip-bat-biscuit-only',
        label: 'B',
        name: 'Dual Ingate Biscuit Hubs Only',
        location: [0, -360, 30],
        approachDirection: [0, 1, 0],
        gripWidthMm: 220,
        recommendedEoatType: 'runner_clamp',
        stabilityScore: 74,
        clearanceScore: 90,
        cosmeticRisk: 'LOW',
        status: 'ACCEPTABLE',
        description: 'Clamping on runner only causes 980mm long thin sheet to sag / vibrate during fast robot swing.',
        mitigation: 'Reduce robot swing velocity by 40%.'
      }
    ],
    suggestedProcess: [
      {
        id: 'proc-bat-cast',
        order: 1,
        name: 'Large-Tonnage Structural HPDC',
        category: 'casting',
        stationName: 'Toyo BD-2500V7EX DCM',
        cycleTimeSec: 26.0,
        enabled: true,
        confidence: 'HIGH',
        factType: 'GEOMETRY_DERIVED_FACT',
        description: 'High vacuum casting with multi-stage shot velocity.',
        equipmentRequired: 'Toyo BD-2500V7EX Giga-Caster'
      },
      {
        id: 'proc-bat-extract',
        order: 2,
        name: 'Heavy Dual-Robot Extraction',
        category: 'extraction',
        stationName: 'Extraction Station',
        cycleTimeSec: 7.5,
        enabled: true,
        confidence: 'HIGH',
        factType: 'AUTOMATION_INFERENCE',
        description: 'Heavy articulated robot with vacuum assist frame extracts large battery tray.',
        equipmentRequired: 'Motoman GP180 or Fanuc M-900iB'
      },
      {
        id: 'proc-bat-quench',
        order: 3,
        name: 'Controlled Submerged Quench',
        category: 'cooling',
        stationName: 'Immersion Quench Tank',
        cycleTimeSec: 10.0,
        enabled: true,
        confidence: 'HIGH',
        factType: 'AUTOMATION_INFERENCE',
        description: 'Submerged quench prevents heat buildup.',
        equipmentRequired: 'Large Immersion Tank'
      },
      {
        id: 'proc-bat-trim',
        order: 4,
        name: '60-Ton Multi-Slide Trim Press',
        category: 'trimming',
        stationName: '60T Hydraulic Trim Press',
        cycleTimeSec: 6.0,
        enabled: true,
        confidence: 'HIGH',
        factType: 'AUTOMATION_INFERENCE',
        description: 'Heavy trim die shears perimeter flash and biscuits.',
        equipmentRequired: '60T Trim Press'
      }
    ]
  }
];
