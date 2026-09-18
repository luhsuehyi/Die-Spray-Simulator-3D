import React, { useMemo } from 'react';
import {
  Sparkles,
  X,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ShieldCheck,
  Maximize2,
  ChevronRight,
  TrendingUp,
  Award,
  ArrowRight
} from 'lucide-react';
import { useSimulationStore } from '../../store/simulationStore';
import { evaluateRobotPositions, PositionCandidate } from '../../utils/robotPositionAdvisor';

export const BestPositionAdvisorModal: React.FC = () => {
  const {
    isBestPositionAdvisorOpen,
    setIsBestPositionAdvisorOpen,
    machine,
    die,
    robot,
    waypoints,
    applyPositionRecommendation
  } = useSimulationStore();

  const { recommended, candidates } = useMemo(() => {
    return evaluateRobotPositions(machine, die, robot, waypoints);
  }, [machine, die, robot, waypoints]);

  if (!isBestPositionAdvisorOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 select-none">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                <span>Robot Mounting Advisor</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  AI Multi-Layout Analysis
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Automated kinematic & collision evaluation across candidate mounting locations
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsBestPositionAdvisorOpen(false)}
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Top Recommendation Highlight Card */}
          {recommended && (
            <div className="relative overflow-hidden bg-gradient-to-br from-blue-950/40 via-slate-900 to-indigo-950/30 border-2 border-blue-500/60 rounded-xl p-5 shadow-lg">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-500 text-white flex items-center gap-1">
                      <Award className="w-3 h-3" /> Best Recommended Position
                    </span>
                    <span className="text-xs font-mono font-bold text-blue-400">
                      Score {recommended.score}/100
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-white mt-1.5">
                    {recommended.name}
                  </h3>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed max-w-xl">
                    {recommended.description}
                  </p>
                </div>

                <button
                  id="apply-recommended-position-btn"
                  onClick={() => applyPositionRecommendation(recommended)}
                  className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-500/30 transition flex items-center gap-2 shrink-0 cursor-pointer active:scale-95"
                >
                  <span>Apply This Position</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              {/* Key Metrics Grid */}
              <div className="mt-4 grid grid-cols-4 gap-3">
                <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-2.5 text-center">
                  <span className="text-[10px] text-slate-400 block font-medium">Reachability</span>
                  <span className="text-sm font-bold text-emerald-400 font-mono">
                    {recommended.reachabilityPercent}%
                  </span>
                </div>
                <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-2.5 text-center">
                  <span className="text-[10px] text-slate-400 block font-medium">Tie Bar Clearance</span>
                  <span className="text-sm font-bold text-blue-400 font-mono">
                    {recommended.minClearanceMm} mm
                  </span>
                </div>
                <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-2.5 text-center">
                  <span className="text-[10px] text-slate-400 block font-medium">Est. Cycle Time</span>
                  <span className="text-sm font-bold text-slate-200 font-mono">
                    {recommended.estimatedCycleTimeSec}s
                  </span>
                </div>
                <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-2.5 text-center">
                  <span className="text-[10px] text-slate-400 block font-medium">Die Coverage</span>
                  <span className="text-sm font-bold text-emerald-400 font-mono">
                    {recommended.estimatedCoveragePercent}%
                  </span>
                </div>
              </div>

              {/* Bulleted Reasons */}
              <div className="mt-4 pt-3 border-t border-slate-800/80">
                <span className="text-[11px] font-semibold text-slate-300 block mb-1.5">
                  Why this layout is superior:
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {recommended.reasons.map((reason, idx) => (
                    <div key={idx} className="flex items-center gap-1.5 text-xs text-slate-300">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>{reason}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Alternative Candidates */}
          <div>
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
              Other Evaluated Mounting Layouts
            </h4>
            <div className="space-y-3">
              {candidates.filter(c => c.id !== recommended?.id).map(cand => (
                <div
                  key={cand.id}
                  className="bg-slate-950/60 border border-slate-800 hover:border-slate-700 rounded-xl p-4 flex items-center justify-between transition"
                >
                  <div className="space-y-1 max-w-lg">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white">{cand.name}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                        cand.score >= 80 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-400'
                      }`}>
                        Score {cand.score}/100
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400">{cand.description}</p>
                    <div className="flex items-center gap-4 text-[11px] text-slate-300 pt-1 font-mono">
                      <span>Reach: {cand.reachabilityPercent}%</span>
                      <span>Clearance: {cand.minClearanceMm}mm</span>
                      <span>Cycle: {cand.estimatedCycleTimeSec}s</span>
                    </div>
                  </div>

                  <button
                    onClick={() => applyPositionRecommendation(cand)}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition cursor-pointer border border-slate-700"
                  >
                    Select Layout
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between text-xs text-slate-400">
          <span>All candidates solved using exact analytical kinematics and 3D tie-bar bounding bounds.</span>
          <button
            onClick={() => setIsBestPositionAdvisorOpen(false)}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium rounded-lg transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
