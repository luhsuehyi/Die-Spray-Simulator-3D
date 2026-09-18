import React, { useState } from 'react';
import {
  Compass,
  Layers,
  AlertTriangle,
  CheckCircle2,
  Droplets,
  Wind,
  Gauge,
  Eye,
  Factory,
  Camera,
  ShieldAlert,
  ChevronDown
} from 'lucide-react';
import { useSimulationStore, CameraPresetType } from '../../store/simulationStore';
import { CellPresetType } from '../../types/robot';
import { translations } from '../../utils/i18n';

export const ViewportOverlay: React.FC = () => {
  const {
    language,
    viewMode,
    setViewMode,
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
    collisionResult
  } = useSimulationStore();

  const [isMachineMenuOpen, setIsMachineMenuOpen] = useState(false);
  const [isPresetMenuOpen, setIsPresetMenuOpen] = useState(false);

  const t = translations[language] || translations['en'];
  const activeWp = waypoints[activeWaypointIndex];
  const [x, y, z] = currentRobotPose.tcpPositionMm;
  const [j1, j2, j3, j4, j5, j6] = currentRobotPose.jointAnglesDeg;

  const cameraOptions: { id: CameraPresetType; label: string }[] = [
    { id: 'ISO', label: 'Iso View' },
    { id: 'FRONT', label: 'Front (Daylight)' },
    { id: 'TOP', label: 'Top Plan' },
    { id: 'MACHINE', label: 'Toyo DCM' },
    { id: 'ROBOT', label: 'Robot Mount' },
    { id: 'WORKSPACE', label: 'Cavity' }
  ];

  return (
    <div className="pointer-events-none absolute inset-0 p-4 flex flex-col justify-between select-none">
      {/* Top Header HUD Bar */}
      <div className="flex items-center justify-between gap-4">
        {/* Left: Camera Views & Machine Selector */}
        <div className="flex items-center gap-2">
          {/* Camera Preset Quick Buttons */}
          <div className="pointer-events-auto flex items-center bg-slate-900/90 backdrop-blur-md border border-slate-700/70 rounded-lg p-1 shadow-lg">
            <span className="px-2 py-1 text-[11px] font-semibold text-slate-400 flex items-center gap-1 border-r border-slate-700/60 mr-1">
              <Camera className="w-3.5 h-3.5 text-blue-400" />
              Cam
            </span>
            {cameraOptions.map(opt => (
              <button
                key={opt.id}
                id={`cam-preset-${opt.id.toLowerCase()}-btn`}
                onClick={() => setCameraPreset(opt.id)}
                className={`px-2 py-1 text-xs font-medium rounded transition ${
                  cameraPreset === opt.id
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Toyo DCM Machine Family Selector */}
          <div className="relative pointer-events-auto">
            <button
              id="toyo-machine-selector-btn"
              onClick={() => setIsMachineMenuOpen(!isMachineMenuOpen)}
              className="flex items-center gap-2 bg-slate-900/90 hover:bg-slate-850 backdrop-blur-md border border-slate-700/70 text-slate-200 px-3 py-1.5 rounded-lg text-xs font-medium shadow-lg transition"
            >
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-semibold text-white">{machine.name}</span>
              <span className="text-slate-400">({machine.clampingForceTons}T)</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {isMachineMenuOpen && (
              <div className="absolute top-full left-0 mt-1.5 w-72 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl py-1 z-50 max-h-72 overflow-y-auto">
                <div className="px-3 py-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800">
                  Toyo BD-V7EX Machine Family
                </div>
                {toyoFamily.map(m => (
                  <button
                    key={m.id}
                    onClick={() => {
                      setMachineSize(m.clampingForceKn);
                      setIsMachineMenuOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-800 transition ${
                      m.clampingForceKn === machine.clampingForceKn
                        ? 'bg-blue-600/20 text-blue-400 font-semibold'
                        : 'text-slate-300'
                    }`}
                  >
                    <span>{m.name}</span>
                    <span className="text-[11px] font-mono text-slate-400">{m.clampingForceTons} Tons</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: Taiwanese Cell Realism & Factory Automation HUD */}
        <div className="flex items-center gap-2.5">
          {/* Real Factory Mode Toggle */}
          <div className="relative pointer-events-auto flex items-center bg-slate-900/90 backdrop-blur-md border border-slate-700/70 rounded-lg p-1 shadow-lg">
            <button
              id="toggle-real-factory-mode-btn"
              onClick={toggleRealFactoryMode}
              className={`px-2.5 py-1 text-xs font-semibold rounded flex items-center gap-1.5 transition ${
                factoryEquipment.realFactoryMode
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Factory className="w-3.5 h-3.5" />
              Real Factory: {factoryEquipment.realFactoryMode ? 'ON' : 'OFF'}
            </button>

            {factoryEquipment.realFactoryMode && (
              <div className="flex items-center pl-1 border-l border-slate-700/60 ml-1">
                <button
                  id="cell-preset-select-btn"
                  onClick={() => setIsPresetMenuOpen(!isPresetMenuOpen)}
                  className="px-2 py-1 text-xs text-slate-300 hover:text-white flex items-center gap-1 rounded hover:bg-slate-800"
                >
                  <span className="capitalize">{cellPreset.replace(/_/g, ' ')}</span>
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                </button>

                {isPresetMenuOpen && (
                  <div className="absolute top-full right-0 mt-1.5 w-56 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl py-1 z-50">
                    <button
                      onClick={() => {
                        setCellPreset('basic_spray_cell');
                        setIsPresetMenuOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 text-xs text-slate-300 hover:bg-slate-800 hover:text-white"
                    >
                      <div className="font-medium">Basic Spray Cell</div>
                      <div className="text-[10px] text-slate-400">Plunger lube + spray lube tank + TCU</div>
                    </button>
                    <button
                      onClick={() => {
                        setCellPreset('automated_casting_cell');
                        setIsPresetMenuOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 text-xs text-slate-300 hover:bg-slate-800 hover:text-white"
                    >
                      <div className="font-medium">Automated Casting Cell</div>
                      <div className="text-[10px] text-slate-400">Dosing furnace + extractor + quench</div>
                    </button>
                    <button
                      onClick={() => {
                        setCellPreset('full_automated_cell');
                        setIsPresetMenuOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 text-xs text-slate-300 hover:bg-slate-800 hover:text-white"
                    >
                      <div className="font-medium">Full Automated Turnkey</div>
                      <div className="text-[10px] text-slate-400">All equipment + trim press + scrap tote</div>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Cell Realism Index Badge */}
          <button
            id="open-cell-realism-btn"
            onClick={() => setIsRealismCheckModalOpen(true)}
            className="pointer-events-auto flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900/90 hover:bg-slate-800 border border-blue-500/40 text-xs font-semibold text-blue-300 backdrop-blur shadow-lg transition"
          >
            <ShieldAlert className="w-4 h-4 text-blue-400" />
            <span>Cell Realism: {cellRealismReport.overallScore}%</span>
          </button>

          {/* Collision Safety Indicator */}
          <div
            id="collision-badge-indicator"
            className={`pointer-events-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium backdrop-blur shadow-md ${
              collisionResult.hasCollision
                ? 'bg-red-950/85 border-red-500 text-red-300'
                : collisionResult.minClearanceDistanceMm < 60
                ? 'bg-amber-950/85 border-amber-500 text-amber-300'
                : 'bg-emerald-950/85 border-emerald-500/60 text-emerald-300'
            }`}
          >
            {collisionResult.hasCollision ? (
              <>
                <AlertTriangle className="w-4 h-4 text-red-400 animate-bounce" />
                <span>Interference: {collisionResult.minClearanceDistanceMm < 0 ? `${collisionResult.minClearanceDistanceMm}mm` : `${collisionResult.totalInterferences} pts`}</span>
              </>
            ) : collisionResult.minClearanceDistanceMm < 60 ? (
              <>
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <span>Clearance: +{collisionResult.minClearanceDistanceMm}mm</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Clearance: +{collisionResult.minClearanceDistanceMm}mm</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Center Left: Live Kinematics Telemetry Overlay */}
      <div className="flex flex-col gap-2 max-w-xs">
        <div className="pointer-events-auto bg-slate-900/85 backdrop-blur-md border border-slate-700/60 rounded-lg p-3 text-xs text-slate-300 shadow-xl space-y-2">
          <div className="flex items-center justify-between border-b border-slate-700/60 pb-1.5 font-semibold text-slate-100">
            <span className="flex items-center gap-1.5">
              <Gauge className="w-3.5 h-3.5 text-blue-400" />
              TCP & Axis Coordinates
            </span>
            <span className="text-[10px] text-blue-400 font-mono">
              Step {activeWaypointIndex + 1}/{waypoints.length}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-1.5 font-mono text-[11px]">
            <div className="bg-slate-800/80 px-2 py-1 rounded">X: {Math.round(x)} mm</div>
            <div className="bg-slate-800/80 px-2 py-1 rounded">Y: {Math.round(y)} mm</div>
            <div className="bg-slate-800/80 px-2 py-1 rounded">Z: {Math.round(z)} mm</div>
          </div>

          <div className="grid grid-cols-3 gap-1 text-[10px] font-mono text-slate-400 pt-1">
            <div>J1: {j1}°</div>
            <div>J2: {j2}°</div>
            <div>J3: {j3}°</div>
            <div>J4: {j4}°</div>
            <div>J5: {j5}°</div>
            <div>J6: {j6}°</div>
          </div>

          {currentRobotPose.isSingular && (
            <div className="text-[11px] text-amber-400 font-medium flex items-center gap-1 pt-1">
              <AlertTriangle className="w-3.5 h-3.5" />
              Wrist Singularity Proximity!
            </div>
          )}
        </div>
      </div>

      {/* Bottom Floating Control Toggles */}
      <div className="flex items-end justify-between">
        {/* Heatmap Legend */}
        {showHeatmap && (
          <div className="pointer-events-auto bg-slate-900/85 backdrop-blur-md border border-slate-700/60 rounded-lg p-2.5 text-xs text-slate-300 shadow-xl space-y-1.5">
            <div className="flex items-center justify-between gap-4 text-[11px] font-medium text-slate-200">
              <span className="flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-emerald-400" />
                {heatmapMetric === 'thickness' ? t.filmThickness : t.temperatureDrop}
              </span>
              <button
                id="toggle-heatmap-metric-btn"
                onClick={() => setHeatmapMetric(heatmapMetric === 'thickness' ? 'temperature' : 'thickness')}
                className="text-[10px] text-blue-400 hover:underline cursor-pointer"
              >
                Switch Metric
              </button>
            </div>

            {/* Gradient Bar */}
            <div className="h-2.5 w-48 rounded bg-gradient-to-r from-blue-600 via-emerald-400 via-amber-400 to-rose-500 shadow-inner" />

            <div className="flex justify-between text-[10px] font-mono text-slate-400">
              {heatmapMetric === 'thickness' ? (
                <>
                  <span>0 µm (Dry)</span>
                  <span>25 µm (Ideal)</span>
                  <span>&gt;50 µm (Puddle)</span>
                </>
              ) : (
                <>
                  <span>180 °C (Cooled)</span>
                  <span>260 °C (Target)</span>
                  <span>320+ °C (Hot)</span>
                </>
              )}
            </div>
          </div>
        )}

        {/* Viewport Layers Toggle Bar */}
        <div className="pointer-events-auto flex items-center gap-2 bg-slate-900/85 backdrop-blur-md border border-slate-700/60 rounded-lg p-1.5 shadow-xl">
          <button
            id="toggle-heatmap-btn"
            onClick={() => setShowHeatmap(!showHeatmap)}
            className={`px-2.5 py-1 text-xs rounded transition flex items-center gap-1.5 ${
              showHeatmap
                ? 'bg-emerald-600 text-white font-medium shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            {t.heatmapToggle}
          </button>

          <button
            id="toggle-spray-cone-btn"
            onClick={() => setShowSprayCone(!showSprayCone)}
            className={`px-2.5 py-1 text-xs rounded transition flex items-center gap-1.5 ${
              showSprayCone
                ? 'bg-blue-600 text-white font-medium shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            Spray Mist
          </button>

          <button
            id="toggle-tie-bars-btn"
            onClick={() => setShowTieBars(!showTieBars)}
            className={`px-2.5 py-1 text-xs rounded transition ${
              showTieBars
                ? 'bg-slate-700 text-white font-medium'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Tie Bars
          </button>
        </div>
      </div>
    </div>
  );
};
