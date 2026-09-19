import React from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  SkipBack,
  SkipForward,
  Wand2,
  Sparkles,
  Code2,
  ShieldCheck,
  FileBarChart,
  Video
} from 'lucide-react';
import { useSimulationStore } from '../../store/simulationStore';
import { translations } from '../../utils/i18n';

export const BottomControlBar: React.FC = () => {
  const {
    language,
    isPlaying,
    setIsPlaying,
    currentTimeSec,
    setCurrentTimeSec,
    playbackSpeed,
    setPlaybackSpeed,
    stepForward,
    stepBackward,
    resetSimulation,
    trajectoryPlan,
    setIsAutoSweepOpen,
    setIsAiOptimizerOpen,
    setIsCollisionAuditOpen,
    setIsCoverageReportOpen,
    setIsCodeExportOpen,
    setIsVideoExportOpen
  } = useSimulationStore();

  const t = translations[language] || translations['en'];
  const totalDuration = trajectoryPlan.totalDurationSec || 10;

  const formatTime = (sec: number) => {
    const s = Math.floor(sec);
    const ms = Math.floor((sec - s) * 10);
    return `${s < 10 ? '0' + s : s}.${ms}s`;
  };

  return (
    <footer className="h-11 bg-slate-950 border-t border-slate-800 flex items-center justify-between px-3 z-20 shrink-0 text-slate-200 select-none gap-3">
      {/* 1. Left: Simulation Transport Controls */}
      <div className="flex items-center gap-1.5 shrink-0">
        <button
          id="sim-reset-btn"
          onClick={resetSimulation}
          title={t.reset}
          className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-850 rounded transition cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
        <button
          id="sim-step-prev-btn"
          onClick={stepBackward}
          title={t.stepBackward}
          className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-850 rounded transition cursor-pointer"
        >
          <SkipBack className="w-3.5 h-3.5" />
        </button>

        <button
          id="sim-play-pause-btn"
          onClick={() => setIsPlaying(!isPlaying)}
          title={isPlaying ? t.pause : t.play}
          className="w-7 h-7 bg-blue-600 hover:bg-blue-500 text-white rounded flex items-center justify-center shadow-xs transition active:scale-95 cursor-pointer"
        >
          {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 ml-0.5 fill-current" />}
        </button>

        <button
          id="sim-step-next-btn"
          onClick={stepForward}
          title={t.stepForward}
          className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-850 rounded transition cursor-pointer"
        >
          <SkipForward className="w-3.5 h-3.5" />
        </button>

        {/* Speed Multipliers */}
        <div className="flex items-center bg-slate-900 border border-slate-800 rounded p-0.5 text-[10px] font-mono ml-1">
          {[0.5, 1, 2, 4].map(spd => (
            <button
              key={spd}
              id={`sim-speed-${spd}x-btn`}
              onClick={() => setPlaybackSpeed(spd)}
              className={`px-1.5 py-0.5 rounded transition cursor-pointer ${
                playbackSpeed === spd
                  ? 'bg-blue-600 text-white font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {spd}x
            </button>
          ))}
        </div>
      </div>

      {/* 2. Center: Precision Timeline Scrubber */}
      <div className="flex-1 max-w-2xl flex items-center gap-2.5">
        <span className="text-[11px] font-mono text-cyan-400 font-bold shrink-0 min-w-10 text-right">
          {formatTime(currentTimeSec)}
        </span>

        <div className="relative flex-1 flex items-center py-1">
          <input
            id="sim-timeline-scrubber"
            type="range"
            min="0"
            max={totalDuration}
            step="0.05"
            value={currentTimeSec}
            onChange={e => {
              setCurrentTimeSec(Number(e.target.value));
              if (isPlaying) setIsPlaying(false);
            }}
            className="w-full h-1.5 bg-slate-850 rounded appearance-none cursor-pointer accent-cyan-400"
          />

          {/* Segment Tick Markers */}
          <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 pointer-events-none flex justify-between px-1">
            {trajectoryPlan.segments.map((seg, idx) => {
              const segProgress = (seg.startTimeSec / totalDuration) * 100;
              return (
                <div
                  key={idx}
                  className="absolute w-0.5 h-2 bg-slate-700/90 rounded"
                  style={{ left: `${segProgress}%` }}
                />
              );
            })}
          </div>
        </div>

        <span className="text-[11px] font-mono text-slate-500 shrink-0 min-w-10">
          {formatTime(totalDuration)}
        </span>
      </div>

      {/* 3. Right: Studio Actions & Reports Toolbar */}
      <div className="flex items-center gap-1 shrink-0">
        <button
          id="action-auto-sweep-btn"
          onClick={() => setIsAutoSweepOpen(true)}
          className="flex items-center gap-1 px-2 py-1 bg-slate-900 hover:bg-slate-800 text-slate-300 text-[11px] font-medium rounded border border-slate-800 transition cursor-pointer"
          title={t.autoSweep}
        >
          <Wand2 className="w-3 h-3 text-cyan-400" />
          <span className="hidden xl:inline">{t.autoSweep}</span>
        </button>

        <button
          id="action-ai-optimizer-btn"
          onClick={() => setIsAiOptimizerOpen(true)}
          className="flex items-center gap-1 px-2 py-1 bg-slate-900 hover:bg-slate-800 text-slate-300 text-[11px] font-medium rounded border border-slate-800 transition cursor-pointer"
          title={t.aiOptimize}
        >
          <Sparkles className="w-3 h-3 text-amber-400" />
          <span className="hidden xl:inline">{t.aiOptimize}</span>
        </button>

        <button
          id="action-collision-audit-btn"
          onClick={() => setIsCollisionAuditOpen(true)}
          className="flex items-center gap-1 px-2 py-1 bg-slate-900 hover:bg-slate-800 text-slate-300 text-[11px] font-medium rounded border border-slate-800 transition cursor-pointer"
          title={t.collisionAudit}
        >
          <ShieldCheck className="w-3 h-3 text-emerald-400" />
          <span className="hidden lg:inline">{t.collisionAudit}</span>
        </button>

        <button
          id="action-coverage-report-btn"
          onClick={() => setIsCoverageReportOpen(true)}
          className="flex items-center gap-1 px-2 py-1 bg-slate-900 hover:bg-slate-800 text-slate-300 text-[11px] font-medium rounded border border-slate-800 transition cursor-pointer"
          title={t.report}
        >
          <FileBarChart className="w-3 h-3 text-blue-400" />
          <span className="hidden lg:inline">{t.report}</span>
        </button>

        <button
          id="action-export-code-btn"
          onClick={() => setIsCodeExportOpen(true)}
          className="flex items-center gap-1 px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-semibold rounded transition shadow-xs cursor-pointer ml-0.5"
        >
          <Code2 className="w-3 h-3" />
          <span>{t.exportCode}</span>
        </button>
      </div>
    </footer>
  );
};
