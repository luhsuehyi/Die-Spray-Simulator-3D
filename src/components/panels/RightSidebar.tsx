import React, { useState } from 'react';
import {
  Factory,
  SlidersHorizontal,
  TrendingUp,
  Clock,
  Upload,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { useSimulationStore } from '../../store/simulationStore';
import { translations } from '../../utils/i18n';
import { MACHINE_PRESETS, ROBOT_PRESETS, DIE_PRESETS } from '../../utils/presets';
import { calculateProcessCost } from '../../utils/machineCalculations';

export const RightSidebar: React.FC = () => {
  const {
    language,
    machine,
    setMachine,
    robot,
    setRobot,
    die,
    setDie,
    sprayPhysics,
    setSprayPhysics,
    trajectoryPlan,
    coverageStats,
    setRobotMountType,
    setIsImportDieOpen,
    setIsMachineSpecOpen
  } = useSimulationStore();

  const [openSections, setOpenSections] = useState({
    cell: true,
    physics: true,
    coverage: true,
    cost: true
  });

  const toggleSection = (sec: 'cell' | 'physics' | 'coverage' | 'cost') => {
    setOpenSections(prev => ({ ...prev, [sec]: !prev[sec] }));
  };

  const t = translations[language] || translations['en'];
  const cost = calculateProcessCost(trajectoryPlan.totalLubeVolumeMl, sprayPhysics.dilutionRatio);

  return (
    <aside className="w-76 h-full bg-slate-900 border-l border-slate-800 flex flex-col z-10 shrink-0 text-slate-200 overflow-y-auto select-none divide-y divide-slate-800 text-xs">
      {/* 1. Machine & Cell Setup Section */}
      <div>
        <div
          onClick={() => toggleSection('cell')}
          className="p-2.5 flex items-center justify-between font-semibold text-slate-200 cursor-pointer hover:bg-slate-850/60 transition"
        >
          <span className="flex items-center gap-1.5 text-[11px]">
            <Factory className="w-3.5 h-3.5 text-cyan-400" />
            Cell & Tooling Setup
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsMachineSpecOpen(true);
              }}
              className="text-[10px] text-blue-400 hover:underline cursor-pointer"
            >
              Specs
            </button>
            {openSections.cell ? <ChevronUp className="w-3.5 h-3.5 text-slate-500" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-500" />}
          </div>
        </div>

        {openSections.cell && (
          <div className="px-3 pb-3 space-y-2.5">
            {/* Die Selector */}
            <div>
              <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                <span>DIE TOOLING</span>
                <button
                  id="open-cad-import-btn"
                  onClick={() => setIsImportDieOpen(true)}
                  className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer"
                >
                  <Upload className="w-2.5 h-2.5" />
                  CAD Import
                </button>
              </div>
              <select
                id="die-model-selector"
                value={die.id}
                onChange={e => {
                  const found = DIE_PRESETS.find(d => d.id === e.target.value);
                  if (found) setDie(found);
                }}
                className="w-full mt-0.5 bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-slate-200 focus:border-blue-500 focus:outline-none"
              >
                {DIE_PRESETS.map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
              <div className="mt-0.5 text-[9.5px] text-slate-400 flex justify-between font-mono">
                <span>{die.dimensions.width}x{die.dimensions.height}x{die.dimensions.depth}mm</span>
                <span>{die.operatingTempCelsius}°C</span>
              </div>
            </div>

            {/* DCM Machine Selector */}
            <div>
              <div className="text-[10px] text-slate-400 font-mono">CASTING MACHINE</div>
              <select
                id="machine-model-selector"
                value={machine.id}
                onChange={e => {
                  const found = MACHINE_PRESETS.find(m => m.id === e.target.value);
                  if (found) setMachine(found);
                }}
                className="w-full mt-0.5 bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-slate-200 focus:border-blue-500 focus:outline-none"
              >
                {MACHINE_PRESETS.map(m => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
              <div className="mt-0.5 text-[9.5px] text-slate-400 flex justify-between font-mono">
                <span>Tie-Bar: {machine.tieBarClearanceH}x{machine.tieBarClearanceV}mm</span>
                <span>Stroke: {machine.maxDieOpeningStroke}mm</span>
              </div>
            </div>

            {/* Robot Model Selector */}
            <div>
              <div className="text-[10px] text-slate-400 font-mono">SPRAY ROBOT</div>
              <select
                id="robot-model-selector"
                value={robot.id}
                onChange={e => {
                  const found = ROBOT_PRESETS.find(r => r.id === e.target.value);
                  if (found) {
                    setRobot({
                      ...found,
                      baseOffset: [...robot.baseOffset],
                      mountOrientation: robot.mountOrientation
                    });
                  }
                }}
                className="w-full mt-0.5 bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-slate-200 focus:border-blue-500 focus:outline-none"
              >
                {ROBOT_PRESETS.map(r => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
              <div className="mt-0.5 text-[9.5px] text-slate-400 flex justify-between font-mono">
                <span>Reach: {robot.reachMm}mm</span>
                <span>Payload: {robot.payloadKg}kg</span>
              </div>
            </div>

            {/* Robot Mount Orientation */}
            <div className="pt-1 border-t border-slate-800/60">
              <div className="text-[10px] text-slate-400 font-mono mb-1">MOUNT CONFIGURATION</div>
              <div className="grid grid-cols-3 gap-1">
                <button
                  onClick={() => setRobotMountType('top')}
                  className={`py-1 rounded text-[11px] font-medium border transition cursor-pointer ${
                    robot.mountOrientation === 'top' || robot.mountOrientation === 'top_machine_mount'
                      ? 'bg-blue-600 text-white border-blue-500 font-semibold'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Top Gantry
                </button>
                <button
                  onClick={() => setRobotMountType('side')}
                  className={`py-1 rounded text-[11px] font-medium border transition cursor-pointer ${
                    robot.mountOrientation === 'side'
                      ? 'bg-blue-600 text-white border-blue-500 font-semibold'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Side Pedestal
                </button>
                <button
                  onClick={() => setRobotMountType('rear')}
                  className={`py-1 rounded text-[11px] font-medium border transition cursor-pointer ${
                    robot.mountOrientation === 'rear'
                      ? 'bg-blue-600 text-white border-blue-500 font-semibold'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Rear Shelf
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 2. Spray Process Physics Section */}
      <div>
        <div
          onClick={() => toggleSection('physics')}
          className="p-2.5 flex items-center justify-between font-semibold text-slate-200 cursor-pointer hover:bg-slate-850/60 transition"
        >
          <span className="flex items-center gap-1.5 text-[11px]">
            <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-400" />
            Process Physics Engine
          </span>
          {openSections.physics ? <ChevronUp className="w-3.5 h-3.5 text-slate-500" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-500" />}
        </div>

        {openSections.physics && (
          <div className="px-3 pb-3 space-y-2">
            {/* Dilution Ratio */}
            <div>
              <div className="flex justify-between text-[11px] text-slate-400 font-mono">
                <span>Dilution Ratio</span>
                <span className="text-slate-100 font-bold">1:{sprayPhysics.dilutionRatio}</span>
              </div>
              <input
                type="range"
                min="40"
                max="160"
                step="5"
                value={sprayPhysics.dilutionRatio}
                onChange={e => setSprayPhysics({ dilutionRatio: Number(e.target.value) })}
                className="w-full mt-1 accent-cyan-400 cursor-pointer"
              />
            </div>

            {/* Leidenfrost Threshold */}
            <div>
              <div className="flex justify-between text-[11px] text-slate-400 font-mono">
                <span>Leidenfrost Limit</span>
                <span className="text-slate-100 font-bold">{sprayPhysics.leidenfrostTempCelsius}°C</span>
              </div>
              <input
                type="range"
                min="190"
                max="260"
                step="5"
                value={sprayPhysics.leidenfrostTempCelsius}
                onChange={e => setSprayPhysics({ leidenfrostTempCelsius: Number(e.target.value) })}
                className="w-full mt-1 accent-amber-400 cursor-pointer"
              />
            </div>

            {/* Impingement Efficiency */}
            <div>
              <div className="flex justify-between text-[11px] text-slate-400 font-mono">
                <span>Deposition Efficiency</span>
                <span className="text-slate-100 font-bold">{Math.round(sprayPhysics.impingementEfficiency * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="0.95"
                step="0.05"
                value={sprayPhysics.impingementEfficiency}
                onChange={e => setSprayPhysics({ impingementEfficiency: Number(e.target.value) })}
                className="w-full mt-1 accent-emerald-400 cursor-pointer"
              />
            </div>
          </div>
        )}
      </div>

      {/* 3. Real-time Coverage & Telemetry KPIs */}
      <div>
        <div
          onClick={() => toggleSection('coverage')}
          className="p-2.5 flex items-center justify-between font-semibold text-slate-200 cursor-pointer hover:bg-slate-850/60 transition"
        >
          <span className="flex items-center gap-1.5 text-[11px]">
            <TrendingUp className="w-3.5 h-3.5 text-blue-400" />
            Coverage & Die Film KPIs
          </span>
          {openSections.coverage ? <ChevronUp className="w-3.5 h-3.5 text-slate-500" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-500" />}
        </div>

        {openSections.coverage && (
          <div className="px-3 pb-3 space-y-2">
            <div className="grid grid-cols-2 gap-1.5 font-mono">
              <div className="bg-slate-950 p-2 rounded border border-slate-800">
                <div className="text-[9.5px] text-slate-400">Fixed Die (Cover)</div>
                <div className="text-sm font-bold text-emerald-400 mt-0.5">
                  {coverageStats?.fixedDieCoveragePercent ?? 0}%
                </div>
                <div className="w-full bg-slate-850 h-1 rounded-full mt-1 overflow-hidden">
                  <div
                    className="bg-emerald-500 h-full rounded-full"
                    style={{ width: `${Math.min(100, coverageStats?.fixedDieCoveragePercent ?? 0)}%` }}
                  />
                </div>
              </div>

              <div className="bg-slate-950 p-2 rounded border border-slate-800">
                <div className="text-[9.5px] text-slate-400">Movable (Core)</div>
                <div className="text-sm font-bold text-emerald-400 mt-0.5">
                  {coverageStats?.movableDieCoveragePercent ?? 0}%
                </div>
                <div className="w-full bg-slate-850 h-1 rounded-full mt-1 overflow-hidden">
                  <div
                    className="bg-emerald-500 h-full rounded-full"
                    style={{ width: `${Math.min(100, coverageStats?.movableDieCoveragePercent ?? 0)}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="bg-slate-950 p-2 rounded border border-slate-800 space-y-1 font-mono text-[11px]">
              <div className="flex justify-between">
                <span className="text-slate-400">Film Thickness:</span>
                <span className="text-slate-200 font-bold">{coverageStats?.averageThicknessMicrons ?? 0} µm</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Uniformity Score:</span>
                <span className="text-blue-400 font-bold">{Math.round((coverageStats?.uniformityIndex ?? 0) * 100)}/100</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Temp Reduction:</span>
                <span className="text-cyan-400 font-bold">-{coverageStats?.averageTempReductionCelsius ?? 0}°C</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Dry Spot Area:</span>
                <span className={`font-bold ${(coverageStats?.drySpotAreaMm2 ?? 0) > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                  {coverageStats?.drySpotAreaMm2 ?? 0} mm²
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 4. Cycle Time & Economics Cost Section */}
      <div>
        <div
          onClick={() => toggleSection('cost')}
          className="p-2.5 flex items-center justify-between font-semibold text-slate-200 cursor-pointer hover:bg-slate-850/60 transition"
        >
          <span className="flex items-center gap-1.5 text-[11px]">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            Cycle Time & Cost Analysis
          </span>
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-mono font-bold text-amber-400">{trajectoryPlan.totalDurationSec}s</span>
            {openSections.cost ? <ChevronUp className="w-3.5 h-3.5 text-slate-500" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-500" />}
          </div>
        </div>

        {openSections.cost && (
          <div className="px-3 pb-3 space-y-2">
            {/* Cycle Time Bar */}
            <div className="space-y-1">
              <div className="w-full h-2 bg-slate-950 rounded flex overflow-hidden border border-slate-800">
                <div
                  className="bg-blue-500 h-full"
                  style={{ width: `${(trajectoryPlan.sprayTimeSec / (trajectoryPlan.totalDurationSec || 1)) * 100}%` }}
                  title={`Spray: ${trajectoryPlan.sprayTimeSec}s`}
                />
                <div
                  className="bg-cyan-400 h-full"
                  style={{ width: `${(trajectoryPlan.airBlowTimeSec / (trajectoryPlan.totalDurationSec || 1)) * 100}%` }}
                  title={`Air Blow: ${trajectoryPlan.airBlowTimeSec}s`}
                />
                <div
                  className="bg-slate-600 h-full"
                  style={{ width: `${(trajectoryPlan.transitTimeSec / (trajectoryPlan.totalDurationSec || 1)) * 100}%` }}
                  title={`Transit: ${trajectoryPlan.transitTimeSec}s`}
                />
              </div>
              <div className="flex justify-between text-[9.5px] font-mono text-slate-400">
                <span className="text-blue-400">Spray {trajectoryPlan.sprayTimeSec}s</span>
                <span className="text-cyan-400">Air {trajectoryPlan.airBlowTimeSec}s</span>
                <span className="text-slate-400">Transit {trajectoryPlan.transitTimeSec}s</span>
              </div>
            </div>

            {/* Economics Metrics */}
            <div className="bg-slate-950 p-2 rounded border border-slate-800 space-y-1 font-mono text-[11px]">
              <div className="flex justify-between">
                <span className="text-slate-400">Lube Volume:</span>
                <span className="text-slate-200">{trajectoryPlan.totalLubeVolumeMl} ml/shot</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Air Volume:</span>
                <span className="text-slate-200">{trajectoryPlan.totalAirVolumeLiters} L/shot</span>
              </div>
              <div className="flex justify-between border-t border-slate-800/60 pt-1">
                <span className="text-slate-400">Cost / Shot:</span>
                <span className="text-emerald-400 font-bold">${cost.costPerShot}</span>
              </div>
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>Annual Cost (2-Shift):</span>
                <span>${cost.annualCost.toLocaleString()}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
