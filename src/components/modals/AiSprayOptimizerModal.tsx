import React, { useState, useMemo } from 'react';
import { X, Sparkles, Check, ArrowRight, Zap, TrendingDown, Clock, Droplets } from 'lucide-react';
import { useSimulationStore } from '../../store/simulationStore';
import { translations } from '../../utils/i18n';
import { optimizeSprayTrajectory } from '../../utils/aiSprayOptimizer';

export const AiSprayOptimizerModal: React.FC = () => {
  const {
    language,
    isAiOptimizerOpen,
    setIsAiOptimizerOpen,
    waypoints,
    setWaypoints,
    die,
    robot
  } = useSimulationStore();

  const t = translations[language] || translations['en'];
  const [applied, setApplied] = useState(false);

  const optimization = useMemo(() => {
    return optimizeSprayTrajectory(waypoints, die, robot);
  }, [waypoints, die, robot]);

  if (!isAiOptimizerOpen) return null;

  const handleApply = () => {
    setWaypoints(optimization.optimizedWaypoints);
    setApplied(true);
    setTimeout(() => {
      setApplied(false);
      setIsAiOptimizerOpen(false);
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 select-none">
      <div className="bg-slate-900 border border-slate-700/80 rounded-xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden text-slate-200 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-800 flex items-center justify-between bg-purple-950/40">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-purple-600/30 text-purple-300 rounded-lg">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">{t.aiOptimize}</h2>
              <p className="text-xs text-purple-300">Intelligent Trajectory Smoothing & Cycle-Time Compression</p>
            </div>
          </div>
          <button
            onClick={() => setIsAiOptimizerOpen(false)}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Highlight Metrics */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-slate-950 p-3 rounded-lg border border-purple-500/30">
              <div className="text-[11px] text-purple-300 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                Cycle Time Reduction
              </div>
              <div className="text-xl font-bold text-emerald-400 font-mono mt-1">
                -{optimization.cycleTimeSavedSec}s
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                {optimization.originalCycleTimeSec}s → {optimization.newCycleTimeSec}s
              </div>
            </div>

            <div className="bg-slate-950 p-3 rounded-lg border border-purple-500/30">
              <div className="text-[11px] text-purple-300 flex items-center gap-1">
                <Droplets className="w-3.5 h-3.5" />
                Agent Saved / Shift
              </div>
              <div className="text-xl font-bold text-blue-400 font-mono mt-1">
                ~{Math.round(optimization.lubeSavedMl * 0.8)} L
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                Reduced mist bounce & overspray
              </div>
            </div>

            <div className="bg-slate-950 p-3 rounded-lg border border-purple-500/30">
              <div className="text-[11px] text-purple-300 flex items-center gap-1">
                <Zap className="w-3.5 h-3.5" />
                Uniformity Boost
              </div>
              <div className="text-xl font-bold text-purple-400 font-mono mt-1">
                +{optimization.uniformityGainPercent}%
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                Adaptive velocity profiling
              </div>
            </div>
          </div>

          {/* AI Recommendations List */}
          <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 space-y-2">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Optimization Plan Summary
            </h3>
            <div className="space-y-2 text-xs">
              {optimization.summaryRecommendations.map((rec, idx) => (
                <div key={idx} className="flex items-start gap-2 text-slate-300">
                  <span className="w-4 h-4 rounded-full bg-purple-900/60 text-purple-300 flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <span>{rec}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-950/70 flex items-center justify-between">
          <button
            onClick={() => setIsAiOptimizerOpen(false)}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg transition"
          >
            Cancel
          </button>

          <button
            id="apply-ai-optimization-btn"
            onClick={handleApply}
            className="flex items-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold rounded-lg transition shadow-md cursor-pointer"
          >
            {applied ? <Check className="w-4 h-4 text-emerald-300" /> : <Sparkles className="w-4 h-4" />}
            {applied ? 'Optimized Waypoints Applied!' : 'Apply Optimized Trajectory'}
          </button>
        </div>
      </div>
    </div>
  );
};
