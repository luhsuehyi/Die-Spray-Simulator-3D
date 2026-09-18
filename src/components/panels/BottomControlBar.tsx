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
  Video,
  Layers
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
    activeWaypointIndex,
    waypoints,
    setIsAutoSweepOpen,
    setIsAiOptimizerOpen,
    setIsCollisionAuditOpen,
    setIsCoverageReportOpen,
    setIsCodeExportOpen,
    setIsVideoExportOpen
  } = useSimulationStore();

  const t = translations[language] || translations['en'];
  const totalDuration = trajectoryPlan.totalDurationSec || 10;
  const progressPercent = Math.min(100, (currentTimeSec / totalDuration) * 100);

  const formatTime = (sec: number) => {
    const s = Math.floor(sec);
    const ms = Math.floor((sec - s) * 10);
    return `${s < 10 ? '0' + s : s}.${ms}s`;
  };

  return (
    <footer className="h-16 bg-slate-950 border-t border-slate-800 flex items-center justify-between px-4 z-20 shrink-0 text-slate-200 select-none gap-4">
      {/* 1. Left: Transport Simulation Buttons */}
      <div className="flex items-center gap-2">
        <button
          id="sim-reset-btn"
          onClick={resetSimulation}
          title={t.reset}
          className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition cursor-pointer"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
        <button
          id="sim-step-prev-btn"
          onClick={stepBackward}
          title={t.stepBackward}
          className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition cursor-pointer"
        >
          <SkipBack className="w-4 h-4" />
        </button>

        <button
          id="sim-play-pause-btn"
          onClick={() => setIsPlaying(!isPlaying)}
          title={isPlaying ? t.pause : t.play}
          className="w-10 h-10 bg-blue-600 hover:bg-blue-500 text-white rounded-lg flex items-center justify-center shadow-lg transition transform active:scale-95 cursor-pointer"
        >
          {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
        </button>

        <button
          id="sim-step-next-btn"
          onClick={stepForward}
          title={t.stepForward}
          className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition cursor-pointer"
        >
          <SkipForward className="w-4 h-4" />
        </button>

        {/* Playback Speed Selector */}
        <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5 text-xs font-mono ml-1">
          {[0.5, 1, 2, 4].map(spd => (
            <button
              key={spd}
              id={`sim-speed-${spd}x-btn`}
              onClick={() => setPlaybackSpeed(spd)}
              className={`px-2 py-1 rounded transition cursor-pointer ${
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

      {/* 2. Center: Timeline Scrubber & Step Markers */}
      <div className="flex-1 max-w-2xl flex items-center gap-3">
        <span className="text-xs font-mono text-blue-400 font-bold shrink-0 min-w-12 text-right">
          {formatTime(currentTimeSec)}
        </span>

        <div className="relative flex-1 flex items-center py-2">
          {/* Timeline Bar Track */}
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
            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
          />

          {/* Waypoint Tick Marks along Timeline */}
          <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 pointer-events-none flex justify-between px-1">
            {trajectoryPlan.segments.map((seg, idx) => {
              const segProgress = (seg.startTimeSec / totalDuration) * 100;
              return (
                <div
                  key={idx}
                  className="absolute w-1 h-2 bg-slate-600/70 rounded"
                  style={{ left: `${segProgress}%` }}
                  title={`P${idx + 1}`}
                />
              );
            })}
          </div>
        </div>

        <span className="text-xs font-mono text-slate-500 shrink-0 min-w-12">
          {formatTime(totalDuration)}
        </span>
      </div>

      {/* 3. Right: Studio Modal Action Buttons */}
      <div className="flex items-center gap-2">
        {/* Auto Sweep */}
        <button
          id="action-auto-sweep-btn"
          onClick={() => setIsAutoSweepOpen(true)}
          className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg transition border border-slate-700/60 cursor-pointer shadow-sm"
        >
          <Wand2 className="w-3.5 h-3.5 text-cyan-400" />
          <span className="hidden md:inline">{t.autoSweep}</span>
        </button>

        {/* AI Optimizer */}
        <button
          id="action-ai-optimizer-btn"
          onClick={() => setIsAiOptimizerOpen(true)}
          className="flex items-center gap-1.5 px-2.5 py-1.5 bg-purple-950/70 hover:bg-purple-900 text-purple-200 text-xs font-medium rounded-lg transition border border-purple-500/50 cursor-pointer shadow-sm"
        >
          <Sparkles className="w-3.5 h-3.5 text-purple-400" />
          <span className="hidden md:inline">{t.aiOptimize}</span>
        </button>

        {/* Collision Audit */}
        <button
          id="action-collision-audit-btn"
          onClick={() => setIsCollisionAuditOpen(true)}
          className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg transition border border-slate-700/60 cursor-pointer shadow-sm"
        >
          <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
          <span className="hidden lg:inline">{t.collisionAudit}</span>
        </button>

        {/* Coverage Report */}
        <button
          id="action-coverage-report-btn"
          onClick={() => setIsCoverageReportOpen(true)}
          className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg transition border border-slate-700/60 cursor-pointer shadow-sm"
        >
          <FileBarChart className="w-3.5 h-3.5 text-emerald-400" />
          <span className="hidden lg:inline">{t.report}</span>
        </button>

        {/* Export Robot Code */}
        <button
          id="action-export-code-btn"
          onClick={() => setIsCodeExportOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg transition shadow-md cursor-pointer"
        >
          <Code2 className="w-3.5 h-3.5" />
          {t.exportCode}
        </button>
      </div>
    </footer>
  );
};
