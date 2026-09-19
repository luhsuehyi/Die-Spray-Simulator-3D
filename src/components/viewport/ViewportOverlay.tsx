import React, { useState } from 'react';
import {
  Layers,
  AlertTriangle,
  CheckCircle2,
  Gauge,
  Eye,
  Factory,
  Camera,
  ShieldAlert,
  ChevronDown,
  ChevronUp,
  Sliders,
  Sparkles
} from 'lucide-react';
import { useSimulationStore, CameraPresetType } from '../../store/simulationStore';
import { translations } from '../../utils/i18n';

export const ViewportOverlay: React.FC = () => {
  const {
    language,
    cameraPreset,
    setCameraPreset,
    machine,
    toyoFamily,
    setMachineSize,
    cellPreset,
    setCellPreset,
    factoryEquipment,
    toggleRealFactoryMode,
    cellRealismReport,
    setIsRealismCheckModalOpen,
    showHeatmap,
    setShowHeatmap,
    heatmapMetric,
    setHeatmapMetric,
    showTieBars,
    setShowTieBars,
    showSprayCone,
    setShowSprayCone,
    currentRobotPose,
    activeWaypointIndex,
    waypoints,
    collisionResult,
    setIsCollisionAuditOpen
  } = useSimulationStore();

  const [isMachineMenuOpen, setIsMachineMenuOpen] = useState(false);
  const [isFactoryMenuOpen, setIsFactoryMenuOpen] = useState(false);
  const [isLayersMenuOpen, setIsLayersMenuOpen] = useState(false);
  const [isJointsExpanded, setIsJointsExpanded] = useState(false);

  const t = translations[language] || translations['en'];
  const [x, y, z] = currentRobotPose.tcpPositionMm;
  const [j1, j2, j3, j4, j5, j6] = currentRobotPose.jointAnglesDeg;

  const cameraOptions: { id: CameraPresetType; label: string }[] = [
    { id: 'ISO', label: 'ISO' },
    { id: 'FRONT', label: 'Front' },
    { id: 'TOP', label: 'Top' },
    { id: 'MACHINE', label: 'DCM' },
    { id: 'ROBOT', label: 'Robot' },
    { id: 'WORKSPACE', label: 'Cavity' }
  ];

  return (
    <div className="pointer-events-none absolute inset-0 p-3 flex flex-col justify-between select-none z-10">
      {/* 1. TOP HUD: Streamlined Camera & Machine Bar */}
      <div className="flex items-start justify-between gap-3">
        {/* Left: Camera & Machine Cluster */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Camera View Switcher */}
          <div className="pointer-events-auto flex items-center bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-md p-0.5 shadow-md">
            <span className="px-1.5 py-0.5 text-[10px] font-mono text-slate-400 flex items-center gap-1 border-r border-slate-800 mr-0.5">
              <Camera className="w-3 h-3 text-cyan-400" />
              VIEW
            </span>
            {cameraOptions.map(opt => (
              <button
                key={opt.id}
                id={`cam-preset-${opt.id.toLowerCase()}-btn`}
                onClick={() => setCameraPreset(opt.id)}
                className={`px-2 py-0.5 text-[11px] font-medium rounded transition cursor-pointer ${
                  cameraPreset === opt.id
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Machine Selector */}
          <div className="relative pointer-events-auto">
            <button
              id="toyo-machine-selector-btn"
              onClick={() => setIsMachineMenuOpen(!isMachineMenuOpen)}
              className="flex items-center gap-1.5 bg-slate-900/90 hover:bg-slate-850 backdrop-blur-md border border-slate-800 text-slate-200 px-2.5 py-1 rounded-md text-[11px] font-medium shadow-md transition cursor-pointer"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
              <span className="font-semibold text-slate-100">{machine.name}</span>
              <span className="text-slate-400 font-mono">({machine.clampingForceTons}T)</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {isMachineMenuOpen && (
              <div className="absolute top-full left-0 mt-1 w-64 bg-slate-900 border border-slate-700/80 rounded-lg shadow-2xl py-1 z-50 max-h-72 overflow-y-auto">
                <div className="px-2.5 py-1 text-[10px] font-mono text-slate-400 uppercase tracking-wider border-b border-slate-800">
                  Toyo BD-V7EX Machine Series
                </div>
                {toyoFamily.map(m => (
                  <button
                    key={m.id}
                    onClick={() => {
                      setMachineSize(m.clampingForceKn);
                      setIsMachineMenuOpen(false);
                    }}
                    className={`w-full text-left px-2.5 py-1.5 text-xs flex items-center justify-between hover:bg-slate-800 transition cursor-pointer ${
                      m.clampingForceKn === machine.clampingForceKn
                        ? 'bg-blue-600/20 text-blue-400 font-semibold'
                        : 'text-slate-300'
                    }`}
                  >
                    <span>{m.name}</span>
                    <span className="text-[11px] font-mono text-slate-400">{m.clampingForceTons}T</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: Clearance, Realism & Equipment Status */}
        <div className="flex items-center gap-1.5">
          {/* Collision Clearance Status Pill */}
          <button
            id="collision-badge-indicator"
            onClick={() => setIsCollisionAuditOpen(true)}
            className={`pointer-events-auto flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-[11px] font-mono backdrop-blur-md shadow-md transition cursor-pointer ${
              collisionResult.hasCollision
                ? 'bg-rose-950/90 border-rose-600 text-rose-300 ring-1 ring-rose-500/50'
                : collisionResult.minClearanceDistanceMm < 60
                ? 'bg-amber-950/80 border-amber-500/80 text-amber-300'
                : 'bg-slate-900/90 border-slate-800 text-emerald-400'
            }`}
            title="Click to view detailed 3D Collision Audit"
          >
            {collisionResult.hasCollision ? (
              <>
                <AlertTriangle className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
                <span className="font-bold">
                  {collisionResult.minClearanceDistanceMm < 0
                    ? `PENETRATION ${collisionResult.minClearanceDistanceMm}mm`
                    : `COLLISION (${collisionResult.totalInterferences})`}
                </span>
              </>
            ) : collisionResult.minClearanceDistanceMm < 60 ? (
              <>
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                <span>MARGIN +{collisionResult.minClearanceDistanceMm}mm</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>CLEARANCE +{collisionResult.minClearanceDistanceMm}mm</span>
              </>
            )}
          </button>

          {/* Cell Realism Badge */}
          <button
            id="open-cell-realism-btn"
            onClick={() => setIsRealismCheckModalOpen(true)}
            className="pointer-events-auto flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-900/90 hover:bg-slate-800 border border-slate-800 text-[11px] font-medium text-slate-300 backdrop-blur-md shadow-md transition cursor-pointer"
            title="Cell Engineering Realism Audit"
          >
            <ShieldAlert className="w-3.5 h-3.5 text-blue-400" />
            <span>Realism: <strong className="text-blue-300 font-mono">{cellRealismReport.overallScore}%</strong></span>
          </button>

          {/* Factory Automation Equipment Dropdown */}
          <div className="relative pointer-events-auto">
            <button
              id="cell-preset-select-btn"
              onClick={() => setIsFactoryMenuOpen(!isFactoryMenuOpen)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-[11px] font-medium backdrop-blur-md shadow-md transition cursor-pointer ${
                factoryEquipment.realFactoryMode
                  ? 'bg-slate-900/90 border-slate-700 text-slate-200'
                  : 'bg-slate-900/70 border-slate-800/80 text-slate-400'
              }`}
            >
              <Factory className="w-3.5 h-3.5 text-slate-400" />
              <span className="capitalize">{cellPreset.replace(/_/g, ' ')}</span>
              <ChevronDown className="w-3 h-3 text-slate-500" />
            </button>

            {isFactoryMenuOpen && (
              <div className="absolute top-full right-0 mt-1 w-60 bg-slate-900 border border-slate-700/80 rounded-lg shadow-2xl py-1 z-50">
                <div className="p-2 border-b border-slate-800 flex items-center justify-between">
                  <span className="text-[10px] font-mono text-slate-400 uppercase">Cell Equipment</span>
                  <button
                    id="toggle-real-factory-mode-btn"
                    onClick={toggleRealFactoryMode}
                    className={`px-2 py-0.5 text-[10px] font-bold rounded cursor-pointer ${
                      factoryEquipment.realFactoryMode
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {factoryEquipment.realFactoryMode ? 'Active' : 'Disabled'}
                  </button>
                </div>
                <button
                  onClick={() => {
                    setCellPreset('basic_spray_cell');
                    setIsFactoryMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-800 cursor-pointer"
                >
                  <div className="font-medium">Basic Spray Cell</div>
                  <div className="text-[10px] text-slate-500">Plunger lube + spray lube tank + TCU</div>
                </button>
                <button
                  onClick={() => {
                    setCellPreset('automated_casting_cell');
                    setIsFactoryMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-800 cursor-pointer"
                >
                  <div className="font-medium">Automated Casting Cell</div>
                  <div className="text-[10px] text-slate-500">Dosing furnace + extractor + quench</div>
                </button>
                <button
                  onClick={() => {
                    setCellPreset('full_automated_cell');
                    setIsFactoryMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-800 cursor-pointer"
                >
                  <div className="font-medium">Full Automated Turnkey</div>
                  <div className="text-[10px] text-slate-500">All equipment + trim press + scrap tote</div>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2. BOTTOM HUD: Progressive TCP Telemetry & Viewport Layers */}
      <div className="flex items-end justify-between gap-3">
        {/* Left: Compact Live TCP Telemetry with Optional Joint Expansion */}
        <div className="pointer-events-auto bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-md shadow-lg text-xs text-slate-300 overflow-hidden max-w-sm">
          <div className="px-2.5 py-1.5 flex items-center justify-between gap-3 bg-slate-950/60 border-b border-slate-800/80">
            <div className="flex items-center gap-1.5 font-mono text-[11px]">
              <Gauge className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-slate-400">TCP:</span>
              <span className="text-slate-100 font-bold">X:{Math.round(x)}</span>
              <span className="text-slate-100 font-bold">Y:{Math.round(y)}</span>
              <span className="text-slate-100 font-bold">Z:{Math.round(z)}</span>
              <span className="text-slate-500 text-[10px]">mm</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-mono text-blue-400 bg-blue-950/60 px-1.5 py-0.5 rounded border border-blue-900/50">
                P{activeWaypointIndex + 1}/{waypoints.length}
              </span>
              <button
                onClick={() => setIsJointsExpanded(!isJointsExpanded)}
                className="text-slate-400 hover:text-white p-0.5 rounded hover:bg-slate-800 transition cursor-pointer"
                title={isJointsExpanded ? 'Hide Joint Angles' : 'Show J1-J6 Joint Angles'}
              >
                {isJointsExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Collapsible Joint Angles Section */}
          {isJointsExpanded && (
            <div className="p-2 space-y-1.5 bg-slate-900/95">
              <div className="grid grid-cols-6 gap-1 text-[10px] font-mono text-center">
                <div className="bg-slate-950/80 px-1 py-0.5 rounded border border-slate-800/60 text-slate-300">
                  <span className="text-slate-500 block text-[9px]">J1</span>{j1}°
                </div>
                <div className="bg-slate-950/80 px-1 py-0.5 rounded border border-slate-800/60 text-slate-300">
                  <span className="text-slate-500 block text-[9px]">J2</span>{j2}°
                </div>
                <div className="bg-slate-950/80 px-1 py-0.5 rounded border border-slate-800/60 text-slate-300">
                  <span className="text-slate-500 block text-[9px]">J3</span>{j3}°
                </div>
                <div className="bg-slate-950/80 px-1 py-0.5 rounded border border-slate-800/60 text-slate-300">
                  <span className="text-slate-500 block text-[9px]">J4</span>{j4}°
                </div>
                <div className="bg-slate-950/80 px-1 py-0.5 rounded border border-slate-800/60 text-slate-300">
                  <span className="text-slate-500 block text-[9px]">J5</span>{j5}°
                </div>
                <div className="bg-slate-950/80 px-1 py-0.5 rounded border border-slate-800/60 text-slate-300">
                  <span className="text-slate-500 block text-[9px]">J6</span>{j6}°
                </div>
              </div>

              {currentRobotPose.isSingular && (
                <div className="text-[10px] text-amber-400 font-medium flex items-center gap-1 bg-amber-950/40 px-2 py-0.5 rounded border border-amber-800/50">
                  <AlertTriangle className="w-3 h-3 text-amber-400" />
                  Singularity Proximity Warning
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right: Consolidated Viewport Layers & Heatmap Controls */}
        <div className="relative pointer-events-auto flex items-center gap-1.5">
          {/* Quick Heatmap Status Badge (if active) */}
          {showHeatmap && (
            <div className="bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-md px-2 py-1 flex items-center gap-2 shadow-md">
              <div className="h-2 w-16 rounded bg-gradient-to-r from-blue-600 via-emerald-400 via-amber-400 to-rose-500" />
              <button
                id="toggle-heatmap-metric-btn"
                onClick={() => setHeatmapMetric(heatmapMetric === 'thickness' ? 'temperature' : 'thickness')}
                className="text-[10px] font-mono text-cyan-400 hover:underline cursor-pointer"
              >
                {heatmapMetric === 'thickness' ? 'µm (Film)' : '°C (Cooling)'}
              </button>
            </div>
          )}

          {/* Layers Popover Trigger */}
          <div className="relative">
            <button
              onClick={() => setIsLayersMenuOpen(!isLayersMenuOpen)}
              className="px-2.5 py-1 bg-slate-900/90 hover:bg-slate-800 backdrop-blur-md border border-slate-800 rounded-md text-xs font-medium text-slate-300 flex items-center gap-1.5 shadow-md transition cursor-pointer"
            >
              <Layers className="w-3.5 h-3.5 text-cyan-400" />
              <span>Layers</span>
              <ChevronDown className="w-3 h-3 text-slate-500" />
            </button>

            {isLayersMenuOpen && (
              <div className="absolute bottom-full right-0 mb-1.5 w-64 bg-slate-900 border border-slate-700/80 rounded-lg shadow-2xl p-2.5 z-50 space-y-2">
                <div className="text-[10px] font-mono text-slate-400 uppercase border-b border-slate-800 pb-1">
                  Viewport Visualizations
                </div>

                <div className="space-y-1.5">
                  {/* Heatmap Toggle */}
                  <div className="flex items-center justify-between">
                    <button
                      id="toggle-heatmap-btn"
                      onClick={() => setShowHeatmap(!showHeatmap)}
                      className="text-xs text-slate-300 flex items-center gap-1.5 hover:text-white cursor-pointer"
                    >
                      <Layers className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{t.heatmapToggle}</span>
                    </button>
                    <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${showHeatmap ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'text-slate-500'}`}>
                      {showHeatmap ? 'ON' : 'OFF'}
                    </span>
                  </div>

                  {/* Spray Mist Cone Toggle */}
                  <div className="flex items-center justify-between">
                    <button
                      id="toggle-spray-cone-btn"
                      onClick={() => setShowSprayCone(!showSprayCone)}
                      className="text-xs text-slate-300 flex items-center gap-1.5 hover:text-white cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5 text-blue-400" />
                      <span>Spray Mist Cone</span>
                    </button>
                    <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${showSprayCone ? 'bg-blue-950 text-blue-400 border border-blue-800' : 'text-slate-500'}`}>
                      {showSprayCone ? 'ON' : 'OFF'}
                    </span>
                  </div>

                  {/* Tie Bars Visibility Toggle */}
                  <div className="flex items-center justify-between">
                    <button
                      id="toggle-tie-bars-btn"
                      onClick={() => setShowTieBars(!showTieBars)}
                      className="text-xs text-slate-300 flex items-center gap-1.5 hover:text-white cursor-pointer"
                    >
                      <span className="w-3.5 text-center text-slate-400 font-mono font-bold">||</span>
                      <span>Tie Bars</span>
                    </button>
                    <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${showTieBars ? 'bg-slate-800 text-slate-300' : 'text-slate-500'}`}>
                      {showTieBars ? 'ON' : 'OFF'}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
