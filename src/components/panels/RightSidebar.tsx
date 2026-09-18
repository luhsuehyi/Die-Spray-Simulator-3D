import React from 'react';
import {
  Cpu,
  Boxes,
  Factory,
  SlidersHorizontal,
  Flame,
  Droplets,
  Wind,
  DollarSign,
  TrendingUp,
  Percent,
  CheckCircle,
  Clock,
  Upload
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

  const t = translations[language] || translations['en'];
  const cost = calculateProcessCost(trajectoryPlan.totalLubeVolumeMl, sprayPhysics.dilutionRatio);

  return (
    <aside className="w-84 h-full bg-slate-900 border-l border-slate-800 flex flex-col z-10 shrink-0 text-slate-200 overflow-y-auto select-none divide-y divide-slate-800">
      {/* 1. Machine & Die Setup Section */}
      <div className="p-3.5 space-y-3">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
          <span className="flex items-center gap-1.5">
            <Factory className="w-4 h-4 text-blue-400" />
            {t.dieMachineSpecs}
          </span>
          <button
            onClick={() => setIsMachineSpecOpen(true)}
            className="text-[11px] text-blue-400 hover:underline cursor-pointer"
          >
            Specs Detail
          </button>
        </div>

        {/* Die Selector */}
        <div>
          <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium">
            <span>Die Mold Model</span>
            <button
              id="open-cad-import-btn"
              onClick={() => setIsImportDieOpen(true)}
              className="text-blue-400 hover:text-blue-300 flex items-center gap-1 text-[10px]"
            >
              <Upload className="w-3 h-3" />
              {t.importCad}
            </button>
          </div>
          <select
            id="die-model-selector"
            value={die.id}
            onChange={e => {
              const found = DIE_PRESETS.find(d => d.id === e.target.value);
              if (found) setDie(found);
            }}
            className="w-full mt-1 bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-200"
          >
            {DIE_PRESETS.map(d => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
          <div className="mt-1 text-[10px] text-slate-400 flex justify-between font-mono">
            <span>Dim: {die.dimensions.width}x{die.dimensions.height}x{die.dimensions.depth}mm</span>
            <span>Temp: {die.operatingTempCelsius}°C</span>
          </div>
        </div>

        {/* Die Casting Machine Selector */}
        <div>
          <label className="text-[11px] text-slate-400 font-medium">{t.machineTonnage}</label>
          <select
            id="machine-model-selector"
            value={machine.id}
            onChange={e => {
              const found = MACHINE_PRESETS.find(m => m.id === e.target.value);
              if (found) setMachine(found);
            }}
            className="w-full mt-1 bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-200"
          >
            {MACHINE_PRESETS.map(m => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
          <div className="mt-1 text-[10px] text-slate-400 flex justify-between font-mono">
            <span>Tie-Bar: {machine.tieBarClearanceH}x{machine.tieBarClearanceV}mm</span>
            <span>Stroke: {machine.maxDieOpeningStroke}mm</span>
          </div>
        </div>

        {/* Robot Model Selector */}
        <div>
          <label className="text-[11px] text-slate-400 font-medium">{t.robotModel}</label>
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
            className="w-full mt-1 bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-200"
          >
            {ROBOT_PRESETS.map(r => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>
          <div className="mt-1 text-[10px] text-slate-400 flex justify-between font-mono">
            <span>Reach: {robot.reachMm}mm</span>
            <span>Payload: {robot.payloadKg}kg</span>
          </div>
        </div>

        {/* Robot Mounting Configuration */}
        <div className="pt-2 border-t border-slate-800/80">
          <label className="text-[11px] text-slate-400 font-medium block">Mounting Structure</label>
          <div className="grid grid-cols-3 gap-1.5 mt-1">
            <button
              onClick={() => setRobotMountType('top')}
              className={`py-1 px-1.5 rounded text-[11px] font-semibold border transition cursor-pointer ${
                robot.mountOrientation === 'top' || robot.mountOrientation === 'top_machine_mount'
                  ? 'bg-blue-600/30 border-blue-500 text-white'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              Top Gantry
            </button>
            <button
              onClick={() => setRobotMountType('side')}
              className={`py-1 px-1.5 rounded text-[11px] font-semibold border transition cursor-pointer ${
                robot.mountOrientation === 'side'
                  ? 'bg-blue-600/30 border-blue-500 text-white'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              Side Pedestal
            </button>
            <button
              onClick={() => setRobotMountType('rear')}
              className={`py-1 px-1.5 rounded text-[11px] font-semibold border transition cursor-pointer ${
                robot.mountOrientation === 'rear'
                  ? 'bg-blue-600/30 border-blue-500 text-white'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              Rear Shelf
            </button>
          </div>
          <div className="mt-1.5 text-[10px] text-slate-400 font-mono flex justify-between">
            <span>Base: [{Math.round(robot.baseOffset[0])}, {Math.round(robot.baseOffset[1])}, {Math.round(robot.baseOffset[2])}]</span>
            <span className="text-emerald-400">Orientation: {robot.mountOrientation}</span>
          </div>
        </div>
      </div>

      {/* 2. Spray Process Physics Section */}
      <div className="p-3.5 space-y-3">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
          <span className="flex items-center gap-1.5">
            <SlidersHorizontal className="w-4 h-4 text-emerald-400" />
            {t.sprayProcess}
          </span>
          <span className="text-[10px] font-mono text-emerald-400">Physics Engine</span>
        </div>

        {/* Dilution Ratio */}
        <div>
          <div className="flex justify-between text-[11px] text-slate-400">
            <span>Lubricant Dilution Ratio</span>
            <span className="font-mono text-slate-200">1:{sprayPhysics.dilutionRatio}</span>
          </div>
          <input
            type="range"
            min="40"
            max="160"
            step="5"
            value={sprayPhysics.dilutionRatio}
            onChange={e => setSprayPhysics({ dilutionRatio: Number(e.target.value) })}
            className="w-full mt-1.5 accent-blue-500 cursor-pointer"
          />
        </div>

        {/* Leidenfrost Threshold */}
        <div>
          <div className="flex justify-between text-[11px] text-slate-400">
            <span>Leidenfrost Point (°C)</span>
            <span className="font-mono text-slate-200">{sprayPhysics.leidenfrostTempCelsius} °C</span>
          </div>
          <input
            type="range"
            min="190"
            max="260"
            step="5"
            value={sprayPhysics.leidenfrostTempCelsius}
            onChange={e => setSprayPhysics({ leidenfrostTempCelsius: Number(e.target.value) })}
            className="w-full mt-1.5 accent-amber-500 cursor-pointer"
          />
        </div>

        {/* Impingement Efficiency */}
        <div>
          <div className="flex justify-between text-[11px] text-slate-400">
            <span>Deposition Efficiency</span>
            <span className="font-mono text-slate-200">{Math.round(sprayPhysics.impingementEfficiency * 100)}%</span>
          </div>
          <input
            type="range"
            min="0.5"
            max="0.95"
            step="0.05"
            value={sprayPhysics.impingementEfficiency}
            onChange={e => setSprayPhysics({ impingementEfficiency: Number(e.target.value) })}
            className="w-full mt-1.5 accent-emerald-500 cursor-pointer"
          />
        </div>
      </div>

      {/* 3. Real-time Coverage & Telemetry KPIs */}
      <div className="p-3.5 space-y-3">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
          <span className="flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-cyan-400" />
            {t.coverageAnalysis}
          </span>
          <span className="text-[10px] font-mono text-cyan-400">Real-Time</span>
        </div>

        {/* Coverage Cards Grid */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
            <div className="text-[10px] text-slate-400 font-medium">Fixed Die (Cavity)</div>
            <div className="text-base font-bold text-emerald-400 font-mono mt-0.5">
              {coverageStats?.fixedDieCoveragePercent ?? 0}%
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full mt-1.5 overflow-hidden">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                style={{ width: `${Math.min(100, coverageStats?.fixedDieCoveragePercent ?? 0)}%` }}
              />
            </div>
          </div>

          <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
            <div className="text-[10px] text-slate-400 font-medium">Movable Die (Core)</div>
            <div className="text-base font-bold text-emerald-400 font-mono mt-0.5">
              {coverageStats?.movableDieCoveragePercent ?? 0}%
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full mt-1.5 overflow-hidden">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                style={{ width: `${Math.min(100, coverageStats?.movableDieCoveragePercent ?? 0)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Thickness & Uniformity Details */}
        <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="text-slate-400">Avg Film Thickness:</span>
            <span className="font-mono font-bold text-slate-200">{coverageStats?.averageThicknessMicrons ?? 0} µm</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Film Uniformity Index:</span>
            <span className="font-mono font-bold text-blue-400">
              {Math.round((coverageStats?.uniformityIndex ?? 0) * 100)} / 100
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Mold Temp Drop (ΔT):</span>
            <span className="font-mono font-bold text-cyan-400">-{coverageStats?.averageTempReductionCelsius ?? 0} °C</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Dry Spot Area:</span>
            <span className={`font-mono font-bold ${(coverageStats?.drySpotAreaMm2 ?? 0) > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
              {coverageStats?.drySpotAreaMm2 ?? 0} mm²
            </span>
          </div>
        </div>
      </div>

      {/* 4. Cycle Time & Economics Cost Section */}
      <div className="p-3.5 space-y-3">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
          <span className="flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-amber-400" />
            Cycle Time & Cost Analysis
          </span>
          <span className="text-xs font-bold text-amber-400 font-mono">
            {trajectoryPlan.totalDurationSec}s
          </span>
        </div>

        {/* Cycle Breakdown Multi-Color Bar */}
        <div className="space-y-1 text-[11px]">
          <div className="flex justify-between text-slate-400">
            <span>Cycle Stage Breakdown</span>
            <span>Total: {trajectoryPlan.totalDurationSec}s</span>
          </div>
          <div className="w-full h-3 bg-slate-950 rounded-full flex overflow-hidden border border-slate-800">
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
          <div className="flex justify-between text-[10px] font-mono text-slate-400 pt-0.5">
            <span className="text-blue-400">● Spray: {trajectoryPlan.sprayTimeSec}s</span>
            <span className="text-cyan-400">● Air: {trajectoryPlan.airBlowTimeSec}s</span>
            <span className="text-slate-400">● Transit: {trajectoryPlan.transitTimeSec}s</span>
          </div>
        </div>

        {/* Economics Metrics */}
        <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 space-y-1.5 text-xs">
          <div className="flex justify-between">
            <span className="text-slate-400">Lube Volume / Shot:</span>
            <span className="font-mono text-slate-200">{trajectoryPlan.totalLubeVolumeMl} ml</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Air Volume / Shot:</span>
            <span className="font-mono text-slate-200">{trajectoryPlan.totalAirVolumeLiters} L</span>
          </div>
          <div className="flex justify-between border-t border-slate-800 pt-1">
            <span className="text-slate-400">Release Agent Cost:</span>
            <span className="font-mono text-emerald-400 font-bold">${cost.costPerShot} / shot</span>
          </div>
          <div className="flex justify-between text-[10px] text-slate-400">
            <span>Annual Expense (2-Shift):</span>
            <span className="font-mono font-medium">${cost.annualCost.toLocaleString()} / yr</span>
          </div>
        </div>
      </div>
    </aside>
  );
};
