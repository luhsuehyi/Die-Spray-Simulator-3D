export type Language = 'en' | 'zh-TW';

export interface Translations {
  appTitle: string;
  appSubtitle: string;
  aiAutoPlan: string;
  simulation: string;
  advancedEdit: string;
  demoMode: string;
  record: string;
  recordDemoVideo: string;
  digitalTwin3D: string;
  layoutPlan2D: string;
  // Navigation & Actions
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

const en: Translations = {
  appTitle: 'Tovonn AI Die Spray 3D',
  appSubtitle: 'Die Casting Spray Robot Trajectory & Process Optimization',
  aiAutoPlan: 'AI Auto Plan',
  simulation: 'Simulation',
  advancedEdit: 'Advanced Edit',
  demoMode: 'Demo Mode',
  record: 'Record',
  recordDemoVideo: 'Record Demo Video (H.264 MP4)',
  digitalTwin3D: '3D Digital Twin',
  layoutPlan2D: '2D Layout Plan',
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
  resetCamera: 'Reset Camera',
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
};

const zhTW: Translations = {
  appTitle: 'Tovonn AI 壓鑄噴霧 3D',
  appSubtitle: '高壓壓鑄噴霧機器人軌跡與製程優化平台',
  aiAutoPlan: 'AI 自動規劃',
  simulation: '模擬運行',
  advancedEdit: '進階編輯',
  demoMode: '展示模式',
  record: '錄製',
  recordDemoVideo: '錄製展示影片（H.264 MP4）',
  digitalTwin3D: '3D 數位孿生',
  layoutPlan2D: '2D 配置平面圖',
  play: '播放',
  pause: '暫停',
  reset: '重置',
  stepForward: '單步向前',
  stepBackward: '單步後退',
  speed: '倍速',
  viewMode: '視圖模式',
  perspective3D: '3D 透視',
  top2D: '2D 頂視配置',
  sideView: '側視圖',
  frontView: '正視圖',
  resetCamera: '視角歸位',
  waypointSequencer: '軌跡航點',
  robotKinematics: '機器人運動學',
  sprayProcess: '噴塗製程物理',
  dieMachineSpecs: '模具與壓鑄機設定',
  coverageAnalysis: '覆蓋率與膜厚',
  collisionAudit: '干涉碰撞檢查',
  addWaypoint: '新增航點',
  deleteWaypoint: '刪除',
  duplicateWaypoint: '複製',
  autoSweep: '自動掃描路徑',
  aiOptimize: 'AI 軌跡優化',
  exportCode: '匯出機器人程式',
  importCad: '匯入模具 CAD',
  runAudit: '執行碰撞檢查',
  report: '覆蓋率報告',
  motionType: '運動類型',
  action: '噴塗動作',
  feedSpeed: '移動速度',
  dwellTime: '駐留時間',
  lubePressure: '離型劑壓力',
  airPressure: '霧化空氣壓力',
  flowRate: '流量',
  standoffDist: '噴嘴靶距',
  blendRadius: '平滑半徑',
  cycleTime: '週期時間',
  lubeVolume: '離型劑用量',
  airVolume: '空氣用量',
  coveragePercent: '覆蓋率',
  uniformityScore: '均勻度指標',
  collisionStatus: '碰撞狀態',
  safe: '安全通暢',
  warning: '間隙警告',
  danger: '偵測到碰撞',
  robotModel: '機器人型號',
  machineTonnage: '鎖模力',
  dieOpening: '開模行程',
  tieBarClearance: '哥林柱間距',
  jointAngles: '關節角度（J1-J6）',
  reachability: '可達性',
  singularity: '奇異點保護',
  heatmapToggle: '模面膜厚熱力圖',
  filmThickness: '膜厚（µm）',
  temperatureDrop: '模面溫降 ΔT（°C）',
  targetFace: '目標模面',
  fixedDie: '定模側（型腔）',
  movableDie: '動模側（型芯）',
  bothDies: '雙側同步噴塗',
  transit: '過渡移動（關閉噴塗）',
};

export const translations: Record<Language, Translations> = {
  en,
  'zh-TW': zhTW,
};

export const DEFAULT_LANGUAGE: Language = 'en';

export const getStoredLanguage = (): Language => {
  if (typeof window === 'undefined') return DEFAULT_LANGUAGE;
  const stored = window.localStorage.getItem('tovonn-language');
  return stored === 'zh-TW' ? 'zh-TW' : DEFAULT_LANGUAGE;
};

export const persistLanguage = (language: Language): void => {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem('tovonn-language', language);
    document.documentElement.lang = language === 'zh-TW' ? 'zh-TW' : 'en';
  }
};
