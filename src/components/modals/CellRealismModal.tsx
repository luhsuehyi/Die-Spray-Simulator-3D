import React from 'react';
import {
  ShieldCheck,
  AlertTriangle,
  XCircle,
  Wrench,
  Factory,
  CheckCircle,
  X,
  Layers,
  Activity,
  Cpu,
  Zap
} from 'lucide-react';
import { useSimulationStore } from '../../store/simulationStore';

export const CellRealismModal: React.FC = () => {
  const {
    isRealismCheckModalOpen,
    setIsRealismCheckModalOpen,
    cellRealismReport,
    machine,
    robot,
    robotMountConfig,
    factoryEquipment,
    setCellPreset,
    applyWollinTopMountPreset
  } = useSimulationStore();

  if (!isRealismCheckModalOpen) return null;

  const { overallScore, isViableRealCell, categoryScores, issues, recommendations } = cellRealismReport;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30">
              <Factory className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-100 flex items-center gap-2">
                Taiwanese Die-Casting Cell Realism Audit
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-mono font-medium ${
                    isViableRealCell
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  }`}
                >
                  {isViableRealCell ? 'REALISTIC FACTORY DESIGN' : 'ACTION NEEDED'}
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Evaluation of {machine.name} with {robot.manufacturer} {robot.modelName}
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsRealismCheckModalOpen(false)}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Score Hero */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-slate-950 border border-slate-800/80">
            <div>
              <div className="text-xs font-medium text-slate-400">Realism Index</div>
              <div className="text-3xl font-bold text-slate-100 font-mono flex items-baseline gap-1.5 mt-0.5">
                {overallScore}
                <span className="text-sm font-normal text-slate-500">/ 100</span>
              </div>
              <div className="text-xs text-slate-400 mt-1">
                Based on Taiwanese aluminum foundry operations & safety codes.
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  applyWollinTopMountPreset();
                  setCellPreset('full_automated_cell');
                }}
                className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition flex items-center gap-1.5 shadow-md shadow-blue-900/40"
              >
                <Wrench className="w-4 h-4" />
                Auto-Configure Real Turnkey Cell
              </button>
            </div>
          </div>

          {/* Category Scores */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Engineering Domain Scores
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-slate-800/60 border border-slate-700/60">
                <div className="flex justify-between items-center text-xs mb-1.5">
                  <span className="text-slate-300 font-medium">Mounting & Structural Rigidity</span>
                  <span className="font-mono text-blue-400">{categoryScores.mountingScore}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-slate-950 overflow-hidden">
                  <div
                    className="h-full bg-blue-500 transition-all duration-300"
                    style={{ width: `${categoryScores.mountingScore}%` }}
                  />
                </div>
              </div>

              <div className="p-3 rounded-lg bg-slate-800/60 border border-slate-700/60">
                <div className="flex justify-between items-center text-xs mb-1.5">
                  <span className="text-slate-300 font-medium">Tie-Bar & Mold Clearance</span>
                  <span className="font-mono text-emerald-400">{categoryScores.clearanceScore}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-slate-950 overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 transition-all duration-300"
                    style={{ width: `${categoryScores.clearanceScore}%` }}
                  />
                </div>
              </div>

              <div className="p-3 rounded-lg bg-slate-800/60 border border-slate-700/60">
                <div className="flex justify-between items-center text-xs mb-1.5">
                  <span className="text-slate-300 font-medium">Foundry Equipment & Peripherals</span>
                  <span className="font-mono text-purple-400">{categoryScores.equipmentScore}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-slate-950 overflow-hidden">
                  <div
                    className="h-full bg-purple-500 transition-all duration-300"
                    style={{ width: `${categoryScores.equipmentScore}%` }}
                  />
                </div>
              </div>

              <div className="p-3 rounded-lg bg-slate-800/60 border border-slate-700/60">
                <div className="flex justify-between items-center text-xs mb-1.5">
                  <span className="text-slate-300 font-medium">Utilities & Safety Fencing</span>
                  <span className="font-mono text-amber-400">{categoryScores.utilitiesScore}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-slate-950 overflow-hidden">
                  <div
                    className="h-full bg-amber-500 transition-all duration-300"
                    style={{ width: `${categoryScores.utilitiesScore}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Recommendations / Best Practices */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-blue-400" />
              Real Taiwanese Plant Guidelines
            </h3>
            <div className="space-y-2">
              {recommendations.map((rec, i) => (
                <div
                  key={i}
                  className="p-3 rounded-lg bg-slate-800/40 border border-slate-700/40 text-xs text-slate-300 flex items-start gap-2.5"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 shrink-0" />
                  <span>{rec}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Detected Issues */}
          {issues.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                Detected Optimization Points
              </h3>
              <div className="space-y-2">
                {issues.map((iss, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-lg bg-amber-950/30 border border-amber-800/40 text-xs text-amber-200 flex items-start gap-2.5"
                  >
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-semibold text-amber-100">{iss.description}</div>
                      <div className="text-amber-300/80 mt-0.5">{iss.mitigation}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-950/60">
          <div className="text-xs text-slate-500 font-mono">
            Toyo BD-V7EX Series Reference Database v2.4
          </div>
          <button
            onClick={() => setIsRealismCheckModalOpen(false)}
            className="px-4 py-2 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition"
          >
            Close Audit
          </button>
        </div>
      </div>
    </div>
  );
};
