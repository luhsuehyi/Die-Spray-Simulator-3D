export type Language = 'en' | 'zh-TW' | 'zh-CN' | 'ja' | 'de';

export interface Translations {
  appTitle: string;
  appSubtitle: string;
  // Navigation & Actions
  simulation: string;
  play: string;
  pause: string;
  reset: string;
  stepForward: string;
  stepBackward: string;
  speed: string;
  viewMode: string;
  perspective3D: string;
  top2D: string;
  sideView: string;
  frontView: string;
  resetCamera: string;
  // Panels
  waypointSequencer: string;
  robotKinematics: string;
  sprayProcess: string;
  dieMachineSpecs: string;
  coverageAnalysis: string;
  collisionAudit: string;
  // Tooling & Actions
  addWaypoint: string;
  deleteWaypoint: string;
  duplicateWaypoint: string;
  autoSweep: string;
  aiOptimize: string;
  exportCode: string;
  importCad: string;
  runAudit: string;
  report: string;
  // Parameters
  motionType: string;
  action: string;
  feedSpeed: string;
  dwellTime: string;
  lubePressure: string;
  airPressure: string;
  flowRate: string;
  standoffDist: string;
  blendRadius: string;
  // Metrics & Stats
  cycleTime: string;
  lubeVolume: string;
  airVolume: string;
  coveragePercent: string;
  uniformityScore: string;
  collisionStatus: string;
  safe: string;
  warning: string;
  danger: string;
  // Robot & Machine
  robotModel: string;
  machineTonnage: string;
  dieOpening: string;
  tieBarClearance: string;
  jointAngles: string;
  reachability: string;
  singularity: string;
  // Coverage Heatmap
  heatmapToggle: string;
  filmThickness: string;
  temperatureDrop: string;
  targetFace: string;
  fixedDie: string;
  movableDie: string;
  bothDies: string;
  transit: string;
}

export const translations: Record<Language, Translations> = {
  'en': {
    appTitle: 'Die Spray Simulator 3D',
    appSubtitle: 'Die Casting Spray Robot Trajectory & Process Optimization',
    simulation: 'Simulation',
    play: 'Play',
    pause: 'Pause',
    reset: 'Reset',
    stepForward: 'Step +',
    stepBackward: 'Step -',
    speed: 'Speed',
    viewMode: 'View Mode',
    perspective3D: '3D Orbit',
    top2D: '2D Top Layout',
    sideView: 'Side View',
    frontView: 'Front View',
    resetCamera: 'Reset Cam',
    waypointSequencer: 'Trajectory Waypoints',
    robotKinematics: 'Robot Kinematics',
    sprayProcess: 'Spray Process Physics',
    dieMachineSpecs: 'Die & Machine Setup',
    coverageAnalysis: 'Coverage & Film Thickness',
    collisionAudit: 'Interference Audit',
    addWaypoint: 'Add Waypoint',
    deleteWaypoint: 'Delete',
    duplicateWaypoint: 'Clone',
    autoSweep: 'Auto Sweep Pattern',
    aiOptimize: 'AI Trajectory Optimizer',
    exportCode: 'Export Robot Code',
    importCad: 'Import Die CAD',
    runAudit: 'Check Collisions',
    report: 'Coverage Report',
    motionType: 'Motion Type',
    action: 'Spray Action',
    feedSpeed: 'Feed Velocity',
    dwellTime: 'Dwell Time',
    lubePressure: 'Lube Pressure',
    airPressure: 'Atomization Air',
    flowRate: 'Flow Rate',
    standoffDist: 'Standoff Distance',
    blendRadius: 'Zone / Blend',
    cycleTime: 'Cycle Time',
    lubeVolume: 'Lube Volume',
    airVolume: 'Air Volume',
    coveragePercent: 'Coverage Area',
    uniformityScore: 'Uniformity Index',
    collisionStatus: 'Collision Status',
    safe: 'CLEAR / SAFE',
    warning: 'CLEARANCE WARNING',
    danger: 'COLLISION DETECTED',
    robotModel: 'Robot Model',
    machineTonnage: 'Clamping Force',
    dieOpening: 'Die Daylight Stroke',
    tieBarClearance: 'Tie Bar Spacing',
    jointAngles: 'Joint Angles (J1 - J6)',
    reachability: 'Reachability',
    singularity: 'Singularity Guard',
    heatmapToggle: 'Surface Film Heatmap',
    filmThickness: 'Film Thickness (µm)',
    temperatureDrop: 'Surface ΔT (°C)',
    targetFace: 'Target Die Half',
    fixedDie: 'Fixed Die (Cavity)',
    movableDie: 'Movable Die (Core)',
    bothDies: 'Both Sides (Bilateral)',
    transit: 'Transit (Off)',
  },
  'zh-TW': {
    appTitle: '壓鑄噴霧機器人3D模擬系統',
    appSubtitle: '高壓壓鑄模具離型劑噴塗路徑規劃與製程優化平台',
    simulation: '模擬運行',
    play: '播放',
    pause: '暫停',
    reset: '重置',
    stepForward: '單步向前',
    stepBackward: '單步後退',
    speed: '倍速',
    viewMode: '視圖模式',
    perspective3D: '3D透視軌道',
    top2D: '2D工程平面',
    sideView: '側面視圖',
    frontView: '正視圖',
    resetCamera: '視角歸位',
    waypointSequencer: '噴塗路徑航點清單',
    robotKinematics: '機械手臂運動學',
    sprayProcess: '噴霧製程與霧化物理',
    dieMachineSpecs: '模具與壓鑄機參數',
    coverageAnalysis: '塗層覆蓋率與膜厚',
    collisionAudit: '模具干涉碰撞檢測',
    addWaypoint: '新增航點',
    deleteWaypoint: '刪除航點',
    duplicateWaypoint: '複製航點',
    autoSweep: '自動掃描路徑',
    aiOptimize: 'AI路徑智慧優化',
    exportCode: '匯出機器人程式碼',
    importCad: '匯入模具CAD',
    runAudit: '干涉檢查',
    report: '覆蓋分析報告',
    motionType: '插補模式',
    action: '噴霧動作',
    feedSpeed: '移動速度',
    dwellTime: '駐留時間',
    lubePressure: '離型劑壓力',
    airPressure: '霧化吹氣壓力',
    flowRate: '流量速率',
    standoffDist: '噴嘴靶距',
    blendRadius: '拐角平滑區',
    cycleTime: '噴塗週期',
    lubeVolume: '離型劑耗量',
    airVolume: '氣體耗量',
    coveragePercent: '模面覆蓋率',
    uniformityScore: '均勻度指標',
    collisionStatus: '干涉狀態',
    safe: '安全通暢 (CLEAR)',
    warning: '接近安全邊界 (WARNING)',
    danger: '偵測到干涉碰撞 (DANGER)',
    robotModel: '噴霧機器人型號',
    machineTonnage: '鎖模力噸位',
    dieOpening: '開模開距 (行程)',
    tieBarClearance: '哥林柱內距',
    jointAngles: '各軸關節角度 (J1-J6)',
    reachability: '可達性驗證',
    singularity: '奇異點保護',
    heatmapToggle: '模面膜厚熱力圖',
    filmThickness: '皮膜厚度 (µm)',
    temperatureDrop: '模面溫降 ΔT (°C)',
    targetFace: '噴塗目標模面',
    fixedDie: '定模側 (母模/外觀面)',
    movableDie: '動模側 (公模/頂出銷面)',
    bothDies: '雙向同步噴塗',
    transit: '過渡空走 (關閉閥門)',
  },
  'zh-CN': {
    appTitle: '压铸喷雾机器人3D仿真系统',
    appSubtitle: '高压压铸模具脱模剂喷涂轨迹规划与工艺优化平台',
    simulation: '仿真运行',
    play: '运行',
    pause: '暂停',
    reset: '重置',
    stepForward: '单步前行',
    stepBackward: '单步后退',
    speed: '仿真速度',
    viewMode: '视图模式',
    perspective3D: '3D轨道透视',
    top2D: '2D平面布局',
    sideView: '侧视图',
    frontView: '正视图',
    resetCamera: '重置视角',
    waypointSequencer: '路径示教点序列',
    robotKinematics: '机器人运动学',
    sprayProcess: '喷雾雾化工艺',
    dieMachineSpecs: '压铸机与模具规格',
    coverageAnalysis: '涂层覆盖与膜厚',
    collisionAudit: '干涉碰撞审计',
    addWaypoint: '添加示教点',
    deleteWaypoint: '删除点',
    duplicateWaypoint: '复制点',
    autoSweep: '自动扫描轨迹',
    aiOptimize: 'AI智能轨迹优化',
    exportCode: '导出机器人代码',
    importCad: '导入模具CAD',
    runAudit: '碰撞干涉审核',
    report: '喷涂覆盖报告',
    motionType: '运动指令',
    action: '喷雾动作',
    feedSpeed: '运动速度',
    dwellTime: '停留时间',
    lubePressure: '脱模剂压力',
    airPressure: '雾化吹气压力',
    flowRate: '喷雾流量',
    standoffDist: '喷嘴靶距',
    blendRadius: '转角过渡区',
    cycleTime: '喷雾周期',
    lubeVolume: '脱模剂消耗',
    airVolume: '压缩空气耗量',
    coveragePercent: '有效覆盖率',
    uniformityScore: '厚度均匀性',
    collisionStatus: '干涉碰撞状态',
    safe: '安全正常',
    warning: '间隙预警',
    danger: '干涉报警',
    robotModel: '喷涂机器人',
    machineTonnage: '合模力吨位',
    dieOpening: '开模行程',
    tieBarClearance: '拉杆内间距',
    jointAngles: '关节轴角度 (J1-J6)',
    reachability: '工作空间可达性',
    singularity: '奇异点检测',
    heatmapToggle: '模具膜厚热力分布',
    filmThickness: '膜厚 (µm)',
    temperatureDrop: '模面温降 (°C)',
    targetFace: '作业目标模面',
    fixedDie: '定模 (型腔)',
    movableDie: '动模 (型芯)',
    bothDies: '两侧同喷',
    transit: '空走过渡',
  },
  'ja': {
    appTitle: 'ダイカスト離型剤スプレーロボット3Dシミュレータ',
    appSubtitle: '高圧鋳造金型スプレー軌跡生成・膜厚最適化プラットフォーム',
    simulation: 'シミュレーション',
    play: '再生',
    pause: '一時停止',
    reset: 'リセット',
    stepForward: 'ステップ進む',
    stepBackward: 'ステップ戻る',
    speed: '速度',
    viewMode: '表示モード',
    perspective3D: '3D軌道表示',
    top2D: '2D配置図',
    sideView: '側面図',
    frontView: '正面図',
    resetCamera: 'カメラ復帰',
    waypointSequencer: '教示点シーケンス',
    robotKinematics: 'ロボット運動学',
    sprayProcess: 'スプレー・霧化プロセス',
    dieMachineSpecs: '鋳造機・金型諸元',
    coverageAnalysis: '皮膜厚み・被覆率',
    collisionAudit: '干渉・衝突診断',
    addWaypoint: '点追加',
    deleteWaypoint: '削除',
    duplicateWaypoint: '複製',
    autoSweep: '自動スキャン軌跡',
    aiOptimize: 'AI最適化エンジン',
    exportCode: 'ロボット言語出力',
    importCad: '金型CAD取込',
    runAudit: '干渉チェック',
    report: '塗布レポート',
    motionType: '補間方式',
    action: 'スプレー動作',
    feedSpeed: '送り速度',
    dwellTime: '停止時間',
    lubePressure: '離型剤圧',
    airPressure: '微粒化エアー圧',
    flowRate: '吐出流量',
    standoffDist: 'スプレー距離',
    blendRadius: 'コーナーR',
    cycleTime: '塗布サイクル',
    lubeVolume: '離型剤消費量',
    airVolume: 'エアー消費量',
    coveragePercent: '型面被覆率',
    uniformityScore: '均一性スコア',
    collisionStatus: '干渉ステータス',
    safe: '干渉なし (安全)',
    warning: 'クリアランス注意',
    danger: '干渉発生 (異常停止)',
    robotModel: 'ロボット形式',
    machineTonnage: '型締力トン数',
    dieOpening: '型開きストローク',
    tieBarClearance: 'タイバー内法間隔',
    jointAngles: '各軸角度 (J1-J6)',
    reachability: '動作領域到達性',
    singularity: '特異点監視',
    heatmapToggle: '膜厚ヒートマップ',
    filmThickness: '皮膜厚み (µm)',
    temperatureDrop: '型面降温 ΔT (°C)',
    targetFace: '対象金型',
    fixedDie: '固定型 (キャビティ)',
    movableDie: '可動型 (コア)',
    bothDies: '両面同時スプレー',
    transit: '移動 (非噴霧)',
  },
  'de': {
    appTitle: 'Druckguss Sprühroboter 3D-Simulator',
    appSubtitle: 'Werkzeug-Schmiermittel-Trajektorien & Prozessoptimierung',
    simulation: 'Simulation',
    play: 'Start',
    pause: 'Pause',
    reset: 'Zurücksetzen',
    stepForward: 'Schritt +',
    stepBackward: 'Schritt -',
    speed: 'Geschwindigkeit',
    viewMode: 'Ansicht',
    perspective3D: '3D Orbit',
    top2D: '2D Layout',
    sideView: 'Seitenansicht',
    frontView: 'Vorderansicht',
    resetCamera: 'Kamera Reset',
    waypointSequencer: 'Wegpunkt-Sequenz',
    robotKinematics: 'Roboter-Kinematik',
    sprayProcess: 'Sprühprozessphysik',
    dieMachineSpecs: 'Maschinen- & Werkzeugdaten',
    coverageAnalysis: 'Schichtdicken- & Abdeckung',
    collisionAudit: 'Kollisionsprüfung',
    addWaypoint: 'Wegpunkt +',
    deleteWaypoint: 'Löschen',
    duplicateWaypoint: 'Duplizieren',
    autoSweep: 'Auto-Rasterbahn',
    aiOptimize: 'KI-Optimierer',
    exportCode: 'Roboter-Code Export',
    importCad: 'CAD Importieren',
    runAudit: 'Kollision testen',
    report: 'Sprühbericht',
    motionType: 'Bewegungsart',
    action: 'Sprühaktion',
    feedSpeed: 'Geschwindigkeit',
    dwellTime: 'Verweilzeit',
    lubePressure: 'Trennmitteldruck',
    airPressure: 'Zerstäuberluft',
    flowRate: 'Durchflussrate',
    standoffDist: 'Sprühabstand',
    blendRadius: 'Überschleifradius',
    cycleTime: 'Zykluszeit',
    lubeVolume: 'Trennmittelvolumen',
    airVolume: 'Luftvolumen',
    coveragePercent: 'Benetzungsgrad',
    uniformityScore: 'Homogenitätsindex',
    collisionStatus: 'Kollisionsstatus',
    safe: 'FREI (SICHER)',
    warning: 'ABSTANDSWARNUNG',
    danger: 'KOLLISION ERKANNT',
    robotModel: 'Robotermodell',
    machineTonnage: 'Schließkraft (t)',
    dieOpening: 'Öffnungshub',
    tieBarClearance: 'Holmabstand',
    jointAngles: 'Achs-Winkel (A1-A6)',
    reachability: 'Erreichbarkeit',
    singularity: 'Singularitätsprüfung',
    heatmapToggle: 'Schichtdicken-Heatmap',
    filmThickness: 'Filmdicke (µm)',
    temperatureDrop: 'Formkühlung ΔT (°C)',
    targetFace: 'Zielformhälfte',
    fixedDie: 'Feste Formhälfte',
    movableDie: 'Bewegliche Formhälfte',
    bothDies: 'Beidseitig synchron',
    transit: 'Leerfahrt (Aus)',
  }
};
