import React from 'react';
import {
  Layers,
  X,
  Plus,
  Check,
  ArrowRight,
  TrendingDown,
  TrendingUp,
  ShieldCheck,
  AlertTriangle,
  Clock,
  Droplets,
  Maximize2
} from 'lucide-react';
import { useSimulationStore } from '../../store/simulationStore';

export const ScenarioCompareModal: React.FC = () => {
  const {
    isScenarioCompareOpen,
    setIsScenarioCompareOpen,
    scenarios,
    activeScenarioId,
    duplicateScenario,
    switchScenario
  } = useSimulationStore();

  if (!isScenarioCompareOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 select-none">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                <span>Cell Scenario Comparison</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/40">
                  Side-by-Side Trade-off Matrix
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Compare Top Mounted vs Side Mounted kinematics, cycle times, and floor footprints
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsScenarioCompareOpen(false)}
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Comparison Table */}
        <div className="p-6 overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold text-slate-300">
              Active Configurations ({scenarios.length})
            </span>
            <button
              onClick={() => duplicateScenario()}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Snapshot Current Setup as New Scenario</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {scenarios.map((scen, idx) => {
              const isActive = scen.id === activeScenarioId;
              const isTop = scen.mountType === 'top';

              return (
                <div
                  key={scen.id}
                  className={`rounded-xl border p-5 transition flex flex-col justify-between ${
                    isActive
                      ? 'bg-blue-950/20 border-blue-500/80 shadow-lg ring-1 ring-blue-500/40'
                      : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div>
                    {/* Scenario Title Header */}
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold font-mono text-blue-400">
                            Scenario {String.fromCharCode(65 + idx)}
                          </span>
                          {isTop && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                              ⭐ TOP MOUNT RECOMMENDED
                            </span>
                          )}
                          {isActive && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                              Active in 3D Viewport
                            </span>
                          )}
                        </div>
                        <h3 className="text-sm font-bold text-white mt-1">
                          {scen.name}
                        </h3>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          {scen.robotName} on {scen.machineName}
                        </p>
                      </div>

                      <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center font-bold text-xs text-slate-300">
                        {isTop ? '⬆' : '⬅'}
                      </div>
                    </div>

                    {/* Metric Comparison Cards */}
                    <div className="mt-4 grid grid-cols-2 gap-2.5 text-xs">
                      <div className="bg-slate-900 border border-slate-800/80 rounded-lg p-2.5">
                        <span className="text-[10px] text-slate-400 block">Reachability</span>
                        <span className="text-sm font-bold text-emerald-400 font-mono">
                          {scen.reachabilityPercent}%
                        </span>
                        <span className="text-[9px] text-slate-500 block mt-0.5">
                          {scen.reachabilityPercent === 100 ? 'Zero joint stalls' : 'Minor wrist reach limit'}
                        </span>
                      </div>

                      <div className="bg-slate-900 border border-slate-800/80 rounded-lg p-2.5">
                        <span className="text-[10px] text-slate-400 block">Cycle Time</span>
                        <span className="text-sm font-bold text-blue-400 font-mono">
                          {scen.cycleTimeSec}s
                        </span>
                        <span className="text-[9px] text-slate-500 block mt-0.5">
                          {isTop ? 'Direct vertical plunge' : 'Horizontal sweep'}
                        </span>
                      </div>

                      <div className="bg-slate-900 border border-slate-800/80 rounded-lg p-2.5">
                        <span className="text-[10px] text-slate-400 block">Die Coverage</span>
                        <span className="text-sm font-bold text-emerald-400 font-mono">
                          {scen.coveragePercent}%
                        </span>
                        <span className="text-[9px] text-slate-500 block mt-0.5">
                          Cavity & core target
                        </span>
                      </div>

                      <div className="bg-slate-900 border border-slate-800/80 rounded-lg p-2.5">
                        <span className="text-[10px] text-slate-400 block">Shop Floor Footprint</span>
                        <span className="text-sm font-bold text-slate-200 font-mono">
                          {isTop ? '0.0 m² (Zero)' : '2.4 m² (Pedestal)'}
                        </span>
                        <span className="text-[9px] text-slate-500 block mt-0.5">
                          {isTop ? 'Overhead gantry mounted' : 'Floor aisle space required'}
                        </span>
                      </div>
                    </div>

                    {/* Highlights */}
                    <div className="mt-3.5 space-y-1 text-xs text-slate-300">
                      <div className="flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Tie-Bar Clearance: {isTop ? '160mm (Ample safe zone)' : '42mm (Borderline clearance)'}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Operator Access: {isTop ? 'Loading door 100% unobstructed' : 'Blocks side maintenance access'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Activate Button */}
                  <div className="mt-5 pt-3 border-t border-slate-800/80">
                    <button
                      disabled={isActive}
                      onClick={() => switchScenario(scen.id)}
                      className={`w-full py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                        isActive
                          ? 'bg-slate-800 text-slate-400 cursor-default'
                          : 'bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-500/20'
                      }`}
                    >
                      {isActive ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Currently Active</span>
                        </>
                      ) : (
                        <>
                          <span>Activate Scenario in Cell</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between text-xs text-slate-400">
          <span>Comparative performance metrics calculated automatically based on cell digital twin.</span>
          <button
            onClick={() => setIsScenarioCompareOpen(false)}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium rounded-lg transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
