/**
 * Realistic Cast-Part Geometry Presets for Taiwanese Die Casting Foundry Applications
 */

import { CastPartModel, GripCandidate, GeometricFeature, ManufacturingProcessStep } from '../types/castPart';


/**
 * Representative Taiwanese HPDC sample library.
 * Generic engineering examples only; not customer-specific parts.
 * Tonnages use only the Toyo BD-V7EX family modeled by this application.
 */
const TAIWAN_HPDC_SAMPLE_PARTS: CastPartModel[] = [
  {
    id: 'part-scooter-cvt-case', name: 'Scooter CVT / Transmission Case', taiwaneseIndustryName: '速克達 CVT 傳動箱體',
    alloyGrade: 'ADC12', category: 'automotive', recommendedMachineTonnage: 250, visualMeshType: 'generic_hpdc',
    dimensions: { lengthMm: 360, widthMm: 300, heightMm: 125, wallThicknessMinMm: 2.5, wallThicknessMaxMm: 5.5, volumeCm3: 780, estimatedMassKg: 2.11, shotWeightWithRunnerKg: 2.85 },
    moldOpeningDirection: [0, 0, 1], extractionDirection: [0, 0, 1],
    features: [
      { id: 'cvt-pocket', name: 'Primary Belt / Gear Cavity', category: 'deep_pocket', position: [20, 0, -20], dimensions: [250, 210, 90], draftAngleDeg: 2, isCosmetic: false, notes: 'Deep cavity around rotating transmission components.' },
      { id: 'cvt-rib', name: 'Perimeter Reinforcement Ribs', category: 'rib', position: [0, -80, 0], dimensions: [280, 70, 30], draftAngleDeg: 2.5, isCosmetic: false, notes: 'Typical thin-wall scooter transmission reinforcement.' },
      { id: 'cvt-bearing', name: 'Bearing Boss', category: 'boss', position: [100, 35, 10], dimensions: [90, 90, 65], draftAngleDeg: 2, isCosmetic: false, notes: 'Structural boss suitable for contour jaws.' },
      { id: 'cvt-runner', name: 'Runner / Biscuit', category: 'runner_biscuit', position: [0, -170, -15], dimensions: [100, 55, 65], draftAngleDeg: 5, isCosmetic: false, notes: 'Sacrificial extraction grip area.' }
    ],
    gripCandidates: [
      { id: 'cvt-grip-runner', label: 'A', name: 'Runner / Biscuit Clamp', location: [0, -170, 15], approachDirection: [0, 1, 0], gripWidthMm: 70, recommendedEoatType: 'runner_clamp', stabilityScore: 96, clearanceScore: 94, cosmeticRisk: 'LOW', status: 'RECOMMENDED', description: 'Sacrificial runner grip.', mitigation: 'Verify runner break-off load.' },
      { id: 'cvt-grip-boss', label: 'B', name: 'Bearing Boss Contour Jaw', location: [100, 35, 25], approachDirection: [1, 0, 0], gripWidthMm: 85, recommendedEoatType: 'custom_contour_jaw', stabilityScore: 86, clearanceScore: 82, cosmeticRisk: 'MEDIUM', status: 'ACCEPTABLE', description: 'Structural boss grip.', mitigation: 'Use compliant jaw pads.' }
    ],
    suggestedProcess: [
      { id: 'cvt-cast', order: 1, name: 'HPDC', category: 'casting', stationName: 'Toyo BD-250V7EX', cycleTimeSec: 9.5, enabled: true, confidence: 'HIGH', factType: 'AUTOMATION_INFERENCE', description: 'Representative ADC12 scooter transmission casting.', equipmentRequired: 'Toyo BD-250V7EX + aluminum dosing furnace' },
      { id: 'cvt-extract', order: 2, name: 'Robot Extraction', category: 'extraction', stationName: 'Die Daylight', cycleTimeSec: 3.5, enabled: true, confidence: 'HIGH', factType: 'AUTOMATION_INFERENCE', description: 'Runner clamp extraction with die-clear interlock.', equipmentRequired: '50 kg class 6-axis robot' },
      { id: 'cvt-trim', order: 3, name: 'Trim / Degate', category: 'trimming', stationName: 'Trim Press', cycleTimeSec: 3, enabled: true, confidence: 'MEDIUM', factType: 'ENGINEER_CONFIRMATION_REQUIRED', description: 'Remove runner and parting flash.', equipmentRequired: '15T hydraulic trim press' }
    ]
  },
  {
    id: 'part-e-bike-drive-unit', name: 'E-Bike Drive Unit Housing', taiwaneseIndustryName: '電動自行車中置馬達驅動箱體',
    alloyGrade: 'ADC12 / AlSi9Cu3', category: 'ev_powertrain', recommendedMachineTonnage: 250, visualMeshType: 'generic_hpdc',
    dimensions: { lengthMm: 310, widthMm: 260, heightMm: 145, wallThicknessMinMm: 2.2, wallThicknessMaxMm: 5.8, volumeCm3: 620, estimatedMassKg: 1.67, shotWeightWithRunnerKg: 2.30 },
    moldOpeningDirection: [0, 0, 1], extractionDirection: [0, 0, 1],
    features: [
      { id: 'ebike-bore', name: 'Motor Stator Bore', category: 'deep_pocket', position: [0, 0, -20], dimensions: [180, 180, 95], draftAngleDeg: 1.5, isCosmetic: true, notes: 'Precision cylindrical motor interface.' },
      { id: 'ebike-boss', name: 'Bearing Bosses', category: 'boss', position: [80, 30, 20], dimensions: [65, 65, 55], draftAngleDeg: 2, isCosmetic: false, notes: 'Bearing support and gripping region.' },
      { id: 'ebike-ribs', name: 'Housing Stiffening Ribs', category: 'rib', position: [-80, -55, 0], dimensions: [130, 90, 30], draftAngleDeg: 2.5, isCosmetic: false, notes: 'Thin ribs common to compact motor housings.' },
      { id: 'ebike-runner', name: 'Side Runner', category: 'runner_biscuit', position: [0, -150, -15], dimensions: [90, 45, 55], draftAngleDeg: 5, isCosmetic: false, notes: 'Sacrificial runner.' }
    ],
    gripCandidates: [
      { id: 'ebike-runner-grip', label: 'A', name: 'Side Runner Clamp', location: [0, -150, 15], approachDirection: [0, 1, 0], gripWidthMm: 65, recommendedEoatType: 'runner_clamp', stabilityScore: 94, clearanceScore: 92, cosmeticRisk: 'LOW', status: 'RECOMMENDED', description: 'Runner-only grip protects motor bore.', mitigation: 'Confirm runner geometry.' },
      { id: 'ebike-boss-grip', label: 'B', name: 'Bearing Boss Jaw', location: [80, 30, 25], approachDirection: [1, 0, 0], gripWidthMm: 60, recommendedEoatType: 'custom_contour_jaw', stabilityScore: 84, clearanceScore: 80, cosmeticRisk: 'MEDIUM', status: 'ACCEPTABLE', description: 'Compact contour grip on structural boss.', mitigation: 'Protect machined interface.' }
    ],
    suggestedProcess: [
      { id: 'ebike-cast', order: 1, name: 'HPDC', category: 'casting', stationName: 'Toyo BD-250V7EX', cycleTimeSec: 8.5, enabled: true, confidence: 'HIGH', factType: 'AUTOMATION_INFERENCE', description: 'Representative compact e-mobility housing.', equipmentRequired: 'Toyo BD-250V7EX' },
      { id: 'ebike-extract', order: 2, name: 'Robot Extraction', category: 'extraction', stationName: 'Die Daylight', cycleTimeSec: 3.2, enabled: true, confidence: 'HIGH', factType: 'AUTOMATION_INFERENCE', description: 'Runner-first extraction.', equipmentRequired: '25–50 kg 6-axis robot' },
      { id: 'ebike-cool', order: 3, name: 'Controlled Cooling', category: 'cooling', stationName: 'Air / Water Cooling', cycleTimeSec: 4, enabled: true, confidence: 'MEDIUM', factType: 'ENGINEER_CONFIRMATION_REQUIRED', description: 'Cool housing before trim and machining.', equipmentRequired: 'Cooling station' }
    ]
  },
  {
    id: 'part-automotive-oil-pan', name: 'Automotive Aluminum Oil Pan', taiwaneseIndustryName: '汽車引擎油底殼 / 油盤',
    alloyGrade: 'ADC12', category: 'automotive', recommendedMachineTonnage: 350, visualMeshType: 'generic_hpdc',
    dimensions: { lengthMm: 520, widthMm: 340, heightMm: 105, wallThicknessMinMm: 2.0, wallThicknessMaxMm: 4.5, volumeCm3: 910, estimatedMassKg: 2.46, shotWeightWithRunnerKg: 3.45 },
    moldOpeningDirection: [0, 0, 1], extractionDirection: [0, 0, 1],
    features: [
      { id: 'oil-floor', name: 'Large Sealing Floor', category: 'planar_surface', position: [0, 0, 35], dimensions: [480, 300, 20], draftAngleDeg: 1.5, isCosmetic: true, notes: 'Machined sealing surface; avoid jaw contact.' },
      { id: 'oil-ribs', name: 'Sump Reinforcement Ribs', category: 'rib', position: [0, -20, -20], dimensions: [400, 220, 35], draftAngleDeg: 2.5, isCosmetic: false, notes: 'Thin internal ribs require balanced cooling.' },
      { id: 'oil-boss', name: 'Drain Plug Boss', category: 'boss', position: [170, -90, 5], dimensions: [65, 65, 45], draftAngleDeg: 2, isCosmetic: false, notes: 'Structural feature; protect machined region.' },
      { id: 'oil-runner', name: 'Perimeter Runner', category: 'runner_biscuit', position: [0, -210, -10], dimensions: [120, 50, 55], draftAngleDeg: 5, isCosmetic: false, notes: 'Trimmed after extraction.' }
    ],
    gripCandidates: [
      { id: 'oil-grip-runner', label: 'A', name: 'Perimeter Runner Clamp', location: [0, -210, 20], approachDirection: [0, 1, 0], gripWidthMm: 75, recommendedEoatType: 'runner_clamp', stabilityScore: 95, clearanceScore: 90, cosmeticRisk: 'LOW', status: 'RECOMMENDED', description: 'Sacrificial runner grip.', mitigation: 'Check trim die access.' },
      { id: 'oil-grip-wall', label: 'B', name: 'Outer Wall Parallel Jaw', location: [-170, 80, 0], approachDirection: [1, 0, 0], gripWidthMm: 80, recommendedEoatType: '2_finger_parallel', stabilityScore: 78, clearanceScore: 85, cosmeticRisk: 'MEDIUM', status: 'ACCEPTABLE', description: 'Outer wall grip for runner-free extraction.', mitigation: 'Use soft pads.' }
    ],
    suggestedProcess: [
      { id: 'oil-cast', order: 1, name: 'HPDC', category: 'casting', stationName: 'Toyo BD-350V7EX', cycleTimeSec: 10.5, enabled: true, confidence: 'HIGH', factType: 'AUTOMATION_INFERENCE', description: 'Representative thin-wall automotive pan.', equipmentRequired: 'Toyo BD-350V7EX' },
      { id: 'oil-extract', order: 2, name: 'Robot Extraction', category: 'extraction', stationName: 'Die Daylight', cycleTimeSec: 3.8, enabled: true, confidence: 'HIGH', factType: 'AUTOMATION_INFERENCE', description: 'Runner clamp and controlled retract.', equipmentRequired: '50 kg class robot' },
      { id: 'oil-trim', order: 3, name: 'Trim Press', category: 'trimming', stationName: 'Hydraulic Trim Press', cycleTimeSec: 3.5, enabled: true, confidence: 'MEDIUM', factType: 'ENGINEER_CONFIRMATION_REQUIRED', description: 'Remove perimeter runner and flash.', equipmentRequired: '20T trim press' }
    ]
  },
  {
    id: 'part-eps-steering-housing', name: 'EPS Steering Gear Housing', taiwaneseIndustryName: '電動輔助轉向 EPS 齒輪箱體',
    alloyGrade: 'ADC12', category: 'automotive', recommendedMachineTonnage: 350, visualMeshType: 'generic_hpdc',
    dimensions: { lengthMm: 380, widthMm: 300, heightMm: 190, wallThicknessMinMm: 2.5, wallThicknessMaxMm: 6.0, volumeCm3: 830, estimatedMassKg: 2.24, shotWeightWithRunnerKg: 3.10 },
    moldOpeningDirection: [0, 0, 1], extractionDirection: [0, 0, 1],
    features: [
      { id: 'eps-bore', name: 'Worm Gear Bore', category: 'deep_pocket', position: [0, 0, -20], dimensions: [170, 130, 120], draftAngleDeg: 1.5, isCosmetic: true, notes: 'Machined bearing and gear interface.' },
      { id: 'eps-boss', name: 'Bearing Boss', category: 'boss', position: [120, 20, 20], dimensions: [80, 80, 70], draftAngleDeg: 2, isCosmetic: false, notes: 'Structural gripping feature.' },
      { id: 'eps-rib', name: 'Gearbox Rib Web', category: 'rib', position: [-80, -80, 0], dimensions: [180, 100, 40], draftAngleDeg: 2.5, isCosmetic: false, notes: 'Stiffening web around gear cavity.' },
      { id: 'eps-runner', name: 'Runner Hub', category: 'runner_biscuit', position: [0, -180, -20], dimensions: [100, 55, 60], draftAngleDeg: 5, isCosmetic: false, notes: 'Sacrificial grip point.' }
    ],
    gripCandidates: [
      { id: 'eps-runner-grip', label: 'A', name: 'Runner Hub Clamp', location: [0, -180, 15], approachDirection: [0, 1, 0], gripWidthMm: 70, recommendedEoatType: 'runner_clamp', stabilityScore: 94, clearanceScore: 93, cosmeticRisk: 'LOW', status: 'RECOMMENDED', description: 'Protects bearing and gear interfaces.', mitigation: 'Verify runner break-off force.' },
      { id: 'eps-boss-grip', label: 'B', name: 'Bearing Boss Jaw', location: [120, 20, 30], approachDirection: [1, 0, 0], gripWidthMm: 75, recommendedEoatType: 'custom_contour_jaw', stabilityScore: 86, clearanceScore: 84, cosmeticRisk: 'MEDIUM', status: 'ACCEPTABLE', description: 'Structural boss grip.', mitigation: 'Keep jaws off machined bore.' }
    ],
    suggestedProcess: [
      { id: 'eps-cast', order: 1, name: 'HPDC', category: 'casting', stationName: 'Toyo BD-350V7EX', cycleTimeSec: 11, enabled: true, confidence: 'HIGH', factType: 'AUTOMATION_INFERENCE', description: 'Representative steering gear housing.', equipmentRequired: 'Toyo BD-350V7EX' },
      { id: 'eps-extract', order: 2, name: 'Robot Extraction', category: 'extraction', stationName: 'Die Daylight', cycleTimeSec: 4, enabled: true, confidence: 'HIGH', factType: 'AUTOMATION_INFERENCE', description: 'Controlled extraction with bore protection.', equipmentRequired: '50 kg class robot' }
    ]
  },
  {
    id: 'part-hvac-compressor', name: 'HVAC Compressor Housing', taiwaneseIndustryName: '車用空調壓縮機殼體',
    alloyGrade: 'ADC12 / AlSi9Cu3', category: 'automotive', recommendedMachineTonnage: 250, visualMeshType: 'generic_hpdc',
    dimensions: { lengthMm: 320, widthMm: 280, heightMm: 220, wallThicknessMinMm: 2.8, wallThicknessMaxMm: 7.0, volumeCm3: 760, estimatedMassKg: 2.05, shotWeightWithRunnerKg: 2.95 },
    moldOpeningDirection: [0, 0, 1], extractionDirection: [0, 0, 1],
    features: [
      { id: 'hvac-bore', name: 'Compressor Rotor Bore', category: 'deep_pocket', position: [0, 0, -35], dimensions: [180, 180, 150], draftAngleDeg: 1.5, isCosmetic: true, notes: 'Deep cylindrical bore requiring careful release-agent coverage.' },
      { id: 'hvac-boss', name: 'Mounting Boss Cluster', category: 'boss', position: [110, -60, 20], dimensions: [70, 70, 60], draftAngleDeg: 2, isCosmetic: false, notes: 'Rigid gripping features.' },
      { id: 'hvac-runner', name: 'Runner Biscuit', category: 'runner_biscuit', position: [0, -170, -20], dimensions: [95, 55, 65], draftAngleDeg: 5, isCosmetic: false, notes: 'Primary extraction grip.' }
    ],
    gripCandidates: [
      { id: 'hvac-runner-grip', label: 'A', name: 'Runner Biscuit Clamp', location: [0, -170, 20], approachDirection: [0, 1, 0], gripWidthMm: 70, recommendedEoatType: 'runner_clamp', stabilityScore: 96, clearanceScore: 92, cosmeticRisk: 'LOW', status: 'RECOMMENDED', description: 'Sacrificial runner grip.', mitigation: 'Confirm runner strength at casting temperature.' },
      { id: 'hvac-boss-grip', label: 'B', name: 'Mount Boss Jaw', location: [110, -60, 30], approachDirection: [1, 0, 0], gripWidthMm: 65, recommendedEoatType: 'custom_contour_jaw', stabilityScore: 82, clearanceScore: 80, cosmeticRisk: 'MEDIUM', status: 'ACCEPTABLE', description: 'Structural boss grip.', mitigation: 'Avoid sealing/machined faces.' }
    ],
    suggestedProcess: [
      { id: 'hvac-cast', order: 1, name: 'HPDC', category: 'casting', stationName: 'Toyo BD-250V7EX', cycleTimeSec: 10, enabled: true, confidence: 'HIGH', factType: 'AUTOMATION_INFERENCE', description: 'Representative automotive compressor casting.', equipmentRequired: 'Toyo BD-250V7EX' },
      { id: 'hvac-extract', order: 2, name: 'Robot Extraction', category: 'extraction', stationName: 'Die Daylight', cycleTimeSec: 3.5, enabled: true, confidence: 'HIGH', factType: 'AUTOMATION_INFERENCE', description: 'Runner-first extraction.', equipmentRequired: '50 kg class robot' }
    ]
  },
  {
    id: 'part-water-pump-housing', name: 'Water Pump Housing', taiwaneseIndustryName: '汽車 / 工業水泵浦殼體',
    alloyGrade: 'ADC12', category: 'industrial', recommendedMachineTonnage: 200, visualMeshType: 'generic_hpdc',
    dimensions: { lengthMm: 290, widthMm: 250, heightMm: 175, wallThicknessMinMm: 2.4, wallThicknessMaxMm: 5.5, volumeCm3: 510, estimatedMassKg: 1.38, shotWeightWithRunnerKg: 1.95 },
    moldOpeningDirection: [0, 0, 1], extractionDirection: [0, 0, 1],
    features: [
      { id: 'pump-volute', name: 'Volute Cavity', category: 'deep_pocket', position: [0, 0, -30], dimensions: [180, 180, 100], draftAngleDeg: 2, isCosmetic: false, notes: 'Deep fluid cavity.' },
      { id: 'pump-flange', name: 'Mounting Flange', category: 'planar_surface', position: [0, 0, 45], dimensions: [260, 220, 18], draftAngleDeg: 1.5, isCosmetic: true, notes: 'Machined sealing surface.' },
      { id: 'pump-boss', name: 'Shaft Bearing Boss', category: 'boss', position: [0, 0, 25], dimensions: [75, 75, 65], draftAngleDeg: 2, isCosmetic: false, notes: 'Rigid center boss.' },
      { id: 'pump-runner', name: 'Runner Biscuit', category: 'runner_biscuit', position: [0, -145, -15], dimensions: [85, 45, 55], draftAngleDeg: 5, isCosmetic: false, notes: 'Sacrificial grip point.' }
    ],
    gripCandidates: [{ id: 'pump-runner-grip', label: 'A', name: 'Runner Clamp', location: [0, -145, 15], approachDirection: [0, 1, 0], gripWidthMm: 60, recommendedEoatType: 'runner_clamp', stabilityScore: 95, clearanceScore: 94, cosmeticRisk: 'LOW', status: 'RECOMMENDED', description: 'Runner-only grip.', mitigation: 'Confirm runner strength.' }],
    suggestedProcess: [
      { id: 'pump-cast', order: 1, name: 'HPDC', category: 'casting', stationName: 'Toyo BD-200V7EX', cycleTimeSec: 8.5, enabled: true, confidence: 'HIGH', factType: 'AUTOMATION_INFERENCE', description: 'Representative pump housing.', equipmentRequired: 'Toyo BD-200V7EX' },
      { id: 'pump-extract', order: 2, name: 'Robot Extraction', category: 'extraction', stationName: 'Die Daylight', cycleTimeSec: 3.2, enabled: true, confidence: 'HIGH', factType: 'AUTOMATION_INFERENCE', description: 'Runner-first extraction.', equipmentRequired: '25–50 kg class robot' }
    ]
  },
  {
    id: 'part-inverter-housing', name: 'EV Inverter / Power Electronics Housing', taiwaneseIndustryName: '電動車逆變器 / 功率電子殼體',
    alloyGrade: 'AlSi10MnMg', category: 'ev_powertrain', recommendedMachineTonnage: 500, visualMeshType: 'generic_hpdc',
    dimensions: { lengthMm: 620, widthMm: 420, heightMm: 150, wallThicknessMinMm: 2.5, wallThicknessMaxMm: 6.5, volumeCm3: 1280, estimatedMassKg: 3.46, shotWeightWithRunnerKg: 4.75 },
    moldOpeningDirection: [0, 0, 1], extractionDirection: [0, 0, 1],
    features: [
      { id: 'inv-bay', name: 'Electronics Cavity', category: 'deep_pocket', position: [0, 0, -25], dimensions: [520, 320, 95], draftAngleDeg: 1.5, isCosmetic: true, notes: 'Large shallow electronics cavity with sealing perimeter.' },
      { id: 'inv-cooling', name: 'Cooling Rib Matrix', category: 'rib', position: [0, 80, -10], dimensions: [500, 120, 40], draftAngleDeg: 2.5, isCosmetic: false, notes: 'Thermal management ribs.' },
      { id: 'inv-boss', name: 'Connector / Mount Bosses', category: 'boss', position: [220, -100, 15], dimensions: [70, 70, 55], draftAngleDeg: 2, isCosmetic: false, notes: 'Structural grip locations.' },
      { id: 'inv-runner', name: 'Dual Runner Bar', category: 'runner_biscuit', position: [0, -250, -20], dimensions: [180, 55, 65], draftAngleDeg: 5, isCosmetic: false, notes: 'Sacrificial dual-ingate runner.' }
    ],
    gripCandidates: [
      { id: 'inv-runner-grip', label: 'A', name: 'Dual Runner Clamp', location: [0, -250, 20], approachDirection: [0, 1, 0], gripWidthMm: 120, recommendedEoatType: 'runner_clamp', stabilityScore: 97, clearanceScore: 92, cosmeticRisk: 'LOW', status: 'RECOMMENDED', description: 'Runner-first extraction.', mitigation: 'Use dual-point clamp.' },
      { id: 'inv-vacuum-grip', label: 'B', name: 'Planar Vacuum Assist', location: [0, 70, 45], approachDirection: [0, 0, 1], gripWidthMm: 250, recommendedEoatType: 'vacuum_planar_cup', stabilityScore: 90, clearanceScore: 88, cosmeticRisk: 'LOW', status: 'ACCEPTABLE', description: 'Distributed support across broad housing surface.', mitigation: 'Use high-temperature cups and vacuum monitoring.' }
    ],
    suggestedProcess: [
      { id: 'inv-cast', order: 1, name: 'HPDC', category: 'casting', stationName: 'Toyo BD-500V7EX', cycleTimeSec: 13, enabled: true, confidence: 'HIGH', factType: 'AUTOMATION_INFERENCE', description: 'Representative EV power electronics housing.', equipmentRequired: 'Toyo BD-500V7EX' },
      { id: 'inv-extract', order: 2, name: 'Robot Extraction', category: 'extraction', stationName: 'Die Daylight', cycleTimeSec: 4.8, enabled: true, confidence: 'HIGH', factType: 'AUTOMATION_INFERENCE', description: 'Dual runner extraction with vacuum assist option.', equipmentRequired: '50 kg class robot' },
      { id: 'inv-cool', order: 3, name: 'Controlled Cooling', category: 'cooling', stationName: 'Air / Water Cooling', cycleTimeSec: 5, enabled: true, confidence: 'MEDIUM', factType: 'ENGINEER_CONFIRMATION_REQUIRED', description: 'Cool electronics housing before downstream operations.', equipmentRequired: 'Cooling station' }
    ]
  },
  {
    id: 'part-5g-radio-enclosure', name: '5G Outdoor Radio Unit Enclosure', taiwaneseIndustryName: '5G 戶外基地台 RRH / AAU 散熱殼體',
    alloyGrade: 'ADC12', category: 'telecom_5g', recommendedMachineTonnage: 500, visualMeshType: 'generic_hpdc',
    dimensions: { lengthMm: 560, widthMm: 330, heightMm: 145, wallThicknessMinMm: 2.0, wallThicknessMaxMm: 5.0, volumeCm3: 1120, estimatedMassKg: 3.02, shotWeightWithRunnerKg: 4.20 },
    moldOpeningDirection: [0, 0, 1], extractionDirection: [0, 0, 1],
    features: [
      { id: 'rrh-seal', name: 'Perimeter IP Sealing Flange', category: 'planar_surface', position: [0, 0, 45], dimensions: [520, 295, 18], draftAngleDeg: 1.5, isCosmetic: true, notes: 'Precision sealing face; avoid jaw contact.' },
      { id: 'rrh-fins', name: 'Longitudinal Cooling Fins', category: 'rib', position: [0, 40, -25], dimensions: [500, 250, 65], draftAngleDeg: 2.5, isCosmetic: true, notes: 'Thin external thermal fins.' },
      { id: 'rrh-boss', name: 'PCB Mount Bosses', category: 'boss', position: [190, -90, 15], dimensions: [55, 55, 45], draftAngleDeg: 2, isCosmetic: false, notes: 'Internal electronics mounting bosses.' },
      { id: 'rrh-runner', name: 'Side Runner', category: 'runner_biscuit', position: [0, -225, -20], dimensions: [150, 50, 60], draftAngleDeg: 5, isCosmetic: false, notes: 'Sacrificial runner.' }
    ],
    gripCandidates: [
      { id: 'rrh-runner-grip', label: 'A', name: 'Side Runner Clamp', location: [0, -225, 20], approachDirection: [0, 1, 0], gripWidthMm: 100, recommendedEoatType: 'runner_clamp', stabilityScore: 94, clearanceScore: 91, cosmeticRisk: 'LOW', status: 'RECOMMENDED', description: 'Keeps jaws away from sealing flange and cooling fins.', mitigation: 'Verify fin clearance.' },
      { id: 'rrh-vacuum-grip', label: 'B', name: 'Planar Vacuum Support', location: [0, 80, 35], approachDirection: [0, 0, 1], gripWidthMm: 220, recommendedEoatType: 'vacuum_planar_cup', stabilityScore: 88, clearanceScore: 86, cosmeticRisk: 'LOW', status: 'ACCEPTABLE', description: 'Distributed support for thin enclosure walls.', mitigation: 'Monitor vacuum at high temperature.' }
    ],
    suggestedProcess: [
      { id: 'rrh-cast', order: 1, name: 'HPDC', category: 'casting', stationName: 'Toyo BD-500V7EX', cycleTimeSec: 12.5, enabled: true, confidence: 'HIGH', factType: 'AUTOMATION_INFERENCE', description: 'Representative telecom die-cast enclosure.', equipmentRequired: 'Toyo BD-500V7EX' },
      { id: 'rrh-extract', order: 2, name: 'Robot Extraction', category: 'extraction', stationName: 'Die Daylight', cycleTimeSec: 4.5, enabled: true, confidence: 'HIGH', factType: 'AUTOMATION_INFERENCE', description: 'Runner-first extraction.', equipmentRequired: '50 kg class robot' }
    ]
  },
  {
    id: 'part-servo-motor-housing', name: 'Industrial Servo Motor Housing', taiwaneseIndustryName: '工業伺服馬達殼體',
    alloyGrade: 'ADC12 / AlSi9Cu3', category: 'industrial', recommendedMachineTonnage: 350, visualMeshType: 'generic_hpdc',
    dimensions: { lengthMm: 390, widthMm: 330, heightMm: 230, wallThicknessMinMm: 2.5, wallThicknessMaxMm: 6.5, volumeCm3: 980, estimatedMassKg: 2.65, shotWeightWithRunnerKg: 3.70 },
    moldOpeningDirection: [0, 0, 1], extractionDirection: [0, 0, 1],
    features: [
      { id: 'servo-bore', name: 'Stator Bore', category: 'deep_pocket', position: [0, 0, -30], dimensions: [240, 240, 150], draftAngleDeg: 1.5, isCosmetic: true, notes: 'Precision bore for motor stack.' },
      { id: 'servo-rib', name: 'External Cooling Ribs', category: 'rib', position: [0, 0, 30], dimensions: [340, 250, 45], draftAngleDeg: 2.5, isCosmetic: true, notes: 'Thermal fins around motor shell.' },
      { id: 'servo-boss', name: 'Bearing End Boss', category: 'boss', position: [0, 0, 45], dimensions: [90, 90, 65], draftAngleDeg: 2, isCosmetic: false, notes: 'Rigid axial feature.' },
      { id: 'servo-runner', name: 'Runner Biscuit', category: 'runner_biscuit', position: [0, -195, -20], dimensions: [100, 50, 60], draftAngleDeg: 5, isCosmetic: false, notes: 'Sacrificial extraction grip.' }
    ],
    gripCandidates: [
      { id: 'servo-runner-grip', label: 'A', name: 'Runner Biscuit Clamp', location: [0, -195, 20], approachDirection: [0, 1, 0], gripWidthMm: 70, recommendedEoatType: 'runner_clamp', stabilityScore: 96, clearanceScore: 92, cosmeticRisk: 'LOW', status: 'RECOMMENDED', description: 'Protects stator bore and cooling ribs.', mitigation: 'Confirm runner strength.' },
      { id: 'servo-boss-grip', label: 'B', name: 'End Boss Contour Jaw', location: [0, 0, 50], approachDirection: [1, 0, 0], gripWidthMm: 80, recommendedEoatType: 'custom_contour_jaw', stabilityScore: 83, clearanceScore: 80, cosmeticRisk: 'MEDIUM', status: 'ACCEPTABLE', description: 'Structural end boss grip.', mitigation: 'Keep jaw away from bearing seat.' }
    ],
    suggestedProcess: [
      { id: 'servo-cast', order: 1, name: 'HPDC', category: 'casting', stationName: 'Toyo BD-350V7EX', cycleTimeSec: 11.5, enabled: true, confidence: 'HIGH', factType: 'AUTOMATION_INFERENCE', description: 'Representative industrial motor housing.', equipmentRequired: 'Toyo BD-350V7EX' },
      { id: 'servo-extract', order: 2, name: 'Robot Extraction', category: 'extraction', stationName: 'Die Daylight', cycleTimeSec: 4, enabled: true, confidence: 'HIGH', factType: 'AUTOMATION_INFERENCE', description: 'Runner-first extraction.', equipmentRequired: '50 kg class robot' }
    ]
  },
  {
    id: 'part-automation-gearbox', name: 'Automation Gearbox Housing', taiwaneseIndustryName: '自動化設備減速機 / 齒輪箱體',
    alloyGrade: 'ADC12', category: 'industrial', recommendedMachineTonnage: 500, visualMeshType: 'generic_hpdc',
    dimensions: { lengthMm: 480, widthMm: 390, heightMm: 210, wallThicknessMinMm: 2.5, wallThicknessMaxMm: 7.0, volumeCm3: 1250, estimatedMassKg: 3.38, shotWeightWithRunnerKg: 4.65 },
    moldOpeningDirection: [0, 0, 1], extractionDirection: [0, 0, 1],
    features: [
      { id: 'gear-cavity', name: 'Gear Chamber', category: 'deep_pocket', position: [0, 0, -30], dimensions: [330, 290, 140], draftAngleDeg: 2, isCosmetic: false, notes: 'Deep enclosed gear cavity.' },
      { id: 'gear-flange', name: 'Machined Cover Flange', category: 'planar_surface', position: [0, 0, 50], dimensions: [440, 350, 20], draftAngleDeg: 1.5, isCosmetic: true, notes: 'Sealing face.' },
      { id: 'gear-boss', name: 'Output Bearing Boss', category: 'boss', position: [150, -20, 25], dimensions: [110, 110, 80], draftAngleDeg: 2, isCosmetic: false, notes: 'Primary structural grip candidate.' },
      { id: 'gear-runner', name: 'Runner Hub', category: 'runner_biscuit', position: [0, -235, -15], dimensions: [120, 60, 70], draftAngleDeg: 5, isCosmetic: false, notes: 'Sacrificial runner.' }
    ],
    gripCandidates: [
      { id: 'gear-runner-grip', label: 'A', name: 'Runner Hub Clamp', location: [0, -235, 20], approachDirection: [0, 1, 0], gripWidthMm: 85, recommendedEoatType: 'runner_clamp', stabilityScore: 97, clearanceScore: 93, cosmeticRisk: 'LOW', status: 'RECOMMENDED', description: 'Sacrificial runner grip.', mitigation: 'Verify runner break-off.' },
      { id: 'gear-boss-grip', label: 'B', name: 'Output Boss Jaw', location: [150, -20, 35], approachDirection: [1, 0, 0], gripWidthMm: 100, recommendedEoatType: 'custom_contour_jaw', stabilityScore: 88, clearanceScore: 84, cosmeticRisk: 'MEDIUM', status: 'ACCEPTABLE', description: 'Rigid output boss grip.', mitigation: 'Protect bearing seat.' }
    ],
    suggestedProcess: [
      { id: 'gear-cast', order: 1, name: 'HPDC', category: 'casting', stationName: 'Toyo BD-500V7EX', cycleTimeSec: 13.5, enabled: true, confidence: 'HIGH', factType: 'AUTOMATION_INFERENCE', description: 'Representative automation gearbox housing.', equipmentRequired: 'Toyo BD-500V7EX' },
      { id: 'gear-extract', order: 2, name: 'Robot Extraction', category: 'extraction', stationName: 'Die Daylight', cycleTimeSec: 4.8, enabled: true, confidence: 'HIGH', factType: 'AUTOMATION_INFERENCE', description: 'Runner-first extraction.', equipmentRequired: '50 kg class robot' }
    ]
  },
  {
    id: 'part-led-heatsink', name: 'LED / Industrial Lighting Heat Sink', taiwaneseIndustryName: 'LED 工業照明散熱器 / 散熱底座',
    alloyGrade: 'ADC12', category: 'industrial', recommendedMachineTonnage: 200, visualMeshType: 'generic_hpdc',
    dimensions: { lengthMm: 360, widthMm: 280, heightMm: 95, wallThicknessMinMm: 1.8, wallThicknessMaxMm: 4.0, volumeCm3: 470, estimatedMassKg: 1.27, shotWeightWithRunnerKg: 1.85 },
    moldOpeningDirection: [0, 0, 1], extractionDirection: [0, 0, 1],
    features: [
      { id: 'led-base', name: 'LED Mounting Plane', category: 'planar_surface', position: [0, 0, 35], dimensions: [320, 240, 18], draftAngleDeg: 1.2, isCosmetic: true, notes: 'Flat thermal interface surface.' },
      { id: 'led-fins', name: 'Dense Cooling Fin Array', category: 'rib', position: [0, 0, -20], dimensions: [320, 240, 60], draftAngleDeg: 3, isCosmetic: true, notes: 'Thin fins need controlled spray and careful handling.' },
      { id: 'led-runner', name: 'Side Runner Bar', category: 'runner_biscuit', position: [0, -155, -10], dimensions: [100, 45, 50], draftAngleDeg: 5, isCosmetic: false, notes: 'Sacrificial runner.' }
    ],
    gripCandidates: [
      { id: 'led-runner-grip', label: 'A', name: 'Side Runner Clamp', location: [0, -155, 15], approachDirection: [0, 1, 0], gripWidthMm: 70, recommendedEoatType: 'runner_clamp', stabilityScore: 92, clearanceScore: 90, cosmeticRisk: 'LOW', status: 'RECOMMENDED', description: 'Keeps jaws away from thermal fins.', mitigation: 'Check fin clearance.' },
      { id: 'led-vacuum-grip', label: 'B', name: 'Planar Vacuum Cup', location: [0, 0, 40], approachDirection: [0, 0, 1], gripWidthMm: 160, recommendedEoatType: 'vacuum_planar_cup', stabilityScore: 86, clearanceScore: 88, cosmeticRisk: 'LOW', status: 'ACCEPTABLE', description: 'Broad planar support.', mitigation: 'Use high-temperature cup.' }
    ],
    suggestedProcess: [
      { id: 'led-cast', order: 1, name: 'HPDC', category: 'casting', stationName: 'Toyo BD-200V7EX', cycleTimeSec: 8, enabled: true, confidence: 'HIGH', factType: 'AUTOMATION_INFERENCE', description: 'Representative thin-fin thermal casting.', equipmentRequired: 'Toyo BD-200V7EX' },
      { id: 'led-extract', order: 2, name: 'Robot Extraction', category: 'extraction', stationName: 'Die Daylight', cycleTimeSec: 3, enabled: true, confidence: 'HIGH', factType: 'AUTOMATION_INFERENCE', description: 'Runner clamp extraction.', equipmentRequired: '25 kg class robot' }
    ]
  },
  {
    id: 'part-3c-router-enclosure', name: '3C Networking / Router Enclosure', taiwaneseIndustryName: '3C 網通設備鋁合金機殼',
    alloyGrade: 'ADC12', category: 'telecom_5g', recommendedMachineTonnage: 250, visualMeshType: 'generic_hpdc',
    dimensions: { lengthMm: 420, widthMm: 260, heightMm: 75, wallThicknessMinMm: 1.8, wallThicknessMaxMm: 3.8, volumeCm3: 520, estimatedMassKg: 1.40, shotWeightWithRunnerKg: 2.05 },
    moldOpeningDirection: [0, 0, 1], extractionDirection: [0, 0, 1],
    features: [
      { id: 'router-seal', name: 'Perimeter Sealing Flange', category: 'planar_surface', position: [0, 0, 25], dimensions: [390, 230, 16], draftAngleDeg: 1.2, isCosmetic: true, notes: 'Precision cover interface.' },
      { id: 'router-ribs', name: 'Internal Electronics Ribs', category: 'rib', position: [0, 0, -10], dimensions: [350, 190, 30], draftAngleDeg: 2.5, isCosmetic: false, notes: 'Thin internal thermal and structural ribs.' },
      { id: 'router-boss', name: 'PCB Mount Bosses', category: 'boss', position: [150, 80, 10], dimensions: [45, 45, 35], draftAngleDeg: 2, isCosmetic: false, notes: 'Internal mounting bosses.' },
      { id: 'router-runner', name: 'Runner Gate', category: 'runner_biscuit', position: [0, -150, -10], dimensions: [100, 40, 45], draftAngleDeg: 5, isCosmetic: false, notes: 'Sacrificial gate/runner.' }
    ],
    gripCandidates: [
      { id: 'router-runner-grip', label: 'A', name: 'Runner Gate Clamp', location: [0, -150, 15], approachDirection: [0, 1, 0], gripWidthMm: 65, recommendedEoatType: 'runner_clamp', stabilityScore: 90, clearanceScore: 92, cosmeticRisk: 'LOW', status: 'RECOMMENDED', description: 'Protects thin enclosure surfaces.', mitigation: 'Use low clamp force.' },
      { id: 'router-vacuum-grip', label: 'B', name: 'Vacuum Planar Grip', location: [0, 0, 35], approachDirection: [0, 0, 1], gripWidthMm: 180, recommendedEoatType: 'vacuum_planar_cup', stabilityScore: 88, clearanceScore: 86, cosmeticRisk: 'LOW', status: 'ACCEPTABLE', description: 'Distributed grip for thin housing.', mitigation: 'Monitor vacuum.' }
    ],
    suggestedProcess: [
      { id: 'router-cast', order: 1, name: 'HPDC', category: 'casting', stationName: 'Toyo BD-250V7EX', cycleTimeSec: 8.5, enabled: true, confidence: 'HIGH', factType: 'AUTOMATION_INFERENCE', description: 'Representative 3C die-cast enclosure.', equipmentRequired: 'Toyo BD-250V7EX' },
      { id: 'router-extract', order: 2, name: 'Robot Extraction', category: 'extraction', stationName: 'Die Daylight', cycleTimeSec: 3.2, enabled: true, confidence: 'HIGH', factType: 'AUTOMATION_INFERENCE', description: 'Gentle runner extraction for thin wall enclosure.', equipmentRequired: '25–50 kg class robot' }
    ]
  },
  {
    id: 'part-pneumatic-valve-body', name: 'Pneumatic Valve / Manifold Body', taiwaneseIndustryName: '氣動閥體 / 歧管本體',
    alloyGrade: 'ADC12', category: 'industrial', recommendedMachineTonnage: 125, visualMeshType: 'generic_hpdc',
    dimensions: { lengthMm: 240, widthMm: 170, heightMm: 130, wallThicknessMinMm: 2.5, wallThicknessMaxMm: 6.0, volumeCm3: 310, estimatedMassKg: 0.84, shotWeightWithRunnerKg: 1.25 },
    moldOpeningDirection: [0, 0, 1], extractionDirection: [0, 0, 1],
    features: [
      { id: 'valve-bore', name: 'Valve Bore', category: 'through_hole', position: [0, 0, 0], dimensions: [55, 55, 120], draftAngleDeg: 1.5, isCosmetic: true, notes: 'Through-bore requires core protection.' },
      { id: 'valve-boss', name: 'Port Bosses', category: 'boss', position: [80, 0, 15], dimensions: [55, 55, 55], draftAngleDeg: 2, isCosmetic: false, notes: 'Threaded ports are machined downstream.' },
      { id: 'valve-runner', name: 'Runner Biscuit', category: 'runner_biscuit', position: [0, -115, -10], dimensions: [75, 40, 45], draftAngleDeg: 5, isCosmetic: false, notes: 'Sacrificial grip point.' }
    ],
    gripCandidates: [{ id: 'valve-runner-grip', label: 'A', name: 'Runner Clamp', location: [0, -115, 15], approachDirection: [0, 1, 0], gripWidthMm: 50, recommendedEoatType: 'runner_clamp', stabilityScore: 94, clearanceScore: 95, cosmeticRisk: 'LOW', status: 'RECOMMENDED', description: 'Protects machined ports and bores.', mitigation: 'Verify runner strength.' }],
    suggestedProcess: [
      { id: 'valve-cast', order: 1, name: 'HPDC', category: 'casting', stationName: 'Toyo BD-125V7EX', cycleTimeSec: 7.5, enabled: true, confidence: 'HIGH', factType: 'AUTOMATION_INFERENCE', description: 'Representative small industrial valve casting.', equipmentRequired: 'Toyo BD-125V7EX' },
      { id: 'valve-extract', order: 2, name: 'Robot Extraction', category: 'extraction', stationName: 'Die Daylight', cycleTimeSec: 2.8, enabled: true, confidence: 'HIGH', factType: 'AUTOMATION_INFERENCE', description: 'Compact runner extraction.', equipmentRequired: '12–25 kg class robot' }
    ]
  },
  {
    id: 'part-brake-caliper', name: 'Automotive Brake Caliper Body', taiwaneseIndustryName: '汽車 / 機車煞車卡鉗本體',
    alloyGrade: 'A380 / ADC12', category: 'automotive', recommendedMachineTonnage: 350, visualMeshType: 'generic_hpdc',
    dimensions: { lengthMm: 300, widthMm: 190, heightMm: 120, wallThicknessMinMm: 3.0, wallThicknessMaxMm: 8.0, volumeCm3: 690, estimatedMassKg: 1.86, shotWeightWithRunnerKg: 2.60 },
    moldOpeningDirection: [0, 0, 1], extractionDirection: [0, 0, 1],
    features: [
      { id: 'caliper-bore', name: 'Piston Bore Cluster', category: 'through_hole', position: [0, 0, 0], dimensions: [55, 120, 80], draftAngleDeg: 1.5, isCosmetic: true, notes: 'Precision piston bores are protected from gripping.' },
      { id: 'caliper-rib', name: 'Caliper Bridge Ribs', category: 'rib', position: [0, 40, 10], dimensions: [240, 100, 50], draftAngleDeg: 2.5, isCosmetic: false, notes: 'Structural ribs around piston cavity.' },
      { id: 'caliper-runner', name: 'Ingate Runner', category: 'runner_biscuit', position: [0, -135, -15], dimensions: [90, 45, 55], draftAngleDeg: 5, isCosmetic: false, notes: 'Sacrificial extraction point.' }
    ],
    gripCandidates: [{ id: 'caliper-runner-grip', label: 'A', name: 'Ingate Runner Clamp', location: [0, -135, 20], approachDirection: [0, 1, 0], gripWidthMm: 60, recommendedEoatType: 'runner_clamp', stabilityScore: 95, clearanceScore: 91, cosmeticRisk: 'LOW', status: 'RECOMMENDED', description: 'Keeps jaws clear of piston bores.', mitigation: 'Confirm ingate strength.' }],
    suggestedProcess: [
      { id: 'caliper-cast', order: 1, name: 'HPDC', category: 'casting', stationName: 'Toyo BD-350V7EX', cycleTimeSec: 9.5, enabled: true, confidence: 'MEDIUM', factType: 'ENGINEER_CONFIRMATION_REQUIRED', description: 'Representative brake housing; alloy/process depends on required properties.', equipmentRequired: 'Toyo BD-350V7EX' },
      { id: 'caliper-extract', order: 2, name: 'Robot Extraction', category: 'extraction', stationName: 'Die Daylight', cycleTimeSec: 3.5, enabled: true, confidence: 'HIGH', factType: 'AUTOMATION_INFERENCE', description: 'Runner-first extraction.', equipmentRequired: '50 kg class robot' }
    ]
  },
  {
    id: 'part-camera-gimbal-housing', name: 'Camera / Gimbal Motor Housing', taiwaneseIndustryName: '攝影機雲台馬達鋁合金殼體',
    alloyGrade: 'ADC12', category: 'industrial', recommendedMachineTonnage: 125, visualMeshType: 'generic_hpdc',
    dimensions: { lengthMm: 190, widthMm: 150, heightMm: 110, wallThicknessMinMm: 1.8, wallThicknessMaxMm: 4.0, volumeCm3: 210, estimatedMassKg: 0.57, shotWeightWithRunnerKg: 0.90 },
    moldOpeningDirection: [0, 0, 1], extractionDirection: [0, 0, 1],
    features: [
      { id: 'gimbal-bore', name: 'Motor Bearing Bore', category: 'through_hole', position: [0, 0, 0], dimensions: [42, 42, 90], draftAngleDeg: 1.2, isCosmetic: true, notes: 'Small precision bearing interface.' },
      { id: 'gimbal-boss', name: 'Motor Mount Bosses', category: 'boss', position: [55, 20, 10], dimensions: [38, 38, 35], draftAngleDeg: 2, isCosmetic: false, notes: 'Structural mounting bosses.' },
      { id: 'gimbal-runner', name: 'Gate Runner', category: 'runner_biscuit', position: [0, -90, -10], dimensions: [60, 35, 40], draftAngleDeg: 5, isCosmetic: false, notes: 'Small sacrificial runner.' }
    ],
    gripCandidates: [{ id: 'gimbal-runner-grip', label: 'A', name: 'Gate Runner Clamp', location: [0, -90, 15], approachDirection: [0, 1, 0], gripWidthMm: 40, recommendedEoatType: 'runner_clamp', stabilityScore: 90, clearanceScore: 94, cosmeticRisk: 'LOW', status: 'RECOMMENDED', description: 'Compact runner grip.', mitigation: 'Limit clamp force.' }],
    suggestedProcess: [
      { id: 'gimbal-cast', order: 1, name: 'HPDC', category: 'casting', stationName: 'Toyo BD-125V7EX', cycleTimeSec: 6.5, enabled: true, confidence: 'HIGH', factType: 'AUTOMATION_INFERENCE', description: 'Representative compact precision enclosure.', equipmentRequired: 'Toyo BD-125V7EX' },
      { id: 'gimbal-extract', order: 2, name: 'Robot Extraction', category: 'extraction', stationName: 'Die Daylight', cycleTimeSec: 2.5, enabled: true, confidence: 'HIGH', factType: 'AUTOMATION_INFERENCE', description: 'Low-force runner extraction.', equipmentRequired: '12–25 kg class robot' }
    ]
  }
];


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
  },
  ...TAIWAN_HPDC_SAMPLE_PARTS
];