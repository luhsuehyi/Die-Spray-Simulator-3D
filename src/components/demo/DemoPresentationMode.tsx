import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  X,
  Camera,
  Loader2,
  Sparkles
} from 'lucide-react';
import { useSimulationStore } from '../../store/simulationStore';
import {
  startDemoRecording,
  stopDemoRecording,
  RecorderProgress
} from '../../utils/videoRecorder';

export const CAMERA_SHOTS = [
  { id: 0, label: '1. Cell Establishing', short: 'Establishing', desc: 'Full-cell establishing overview' },
  { id: 1, label: '2. Robot Approach', short: 'Approach', desc: 'Top robot descent into platen daylight' },
  { id: 2, label: '3. Spray Process', short: 'Spray', desc: 'Close-up of high-speed atomized lube spray' },
  { id: 3, label: '4. Die Coverage', short: 'Coverage', desc: 'Fixed & movable core cavity face coverage' },
  { id: 4, label: '5. Robot Retract', short: 'Retract', desc: 'Retract to top platen stationary home' },
  { id: 5, label: '6. Final Overview', short: 'Overview', desc: 'Complete HPDC manufacturing cell' }
];

export const DemoPresentationMode: React.FC = () => {
  const {
    isDemoMode,
    setIsDemoMode,
    demoPhase,
    setDemoPhase,
    isPlaying,
    setIsPlaying,
    currentTimeSec,
    setCurrentTimeSec,
    trajectoryPlan,
    activeCastPart,
    machine
  } = useSimulationStore();

  const [recordingProgress, setRecordingProgress] = useState<RecorderProgress>({
    state: 'idle',
    durationSec: 0,
    message: ''
  });

  const [titleVisible, setTitleVisible] = useState(true);
  const prevPhaseRef = useRef(demoPhase);

  const totalDuration = Math.max(15, trajectoryPlan.totalDurationSec || 42);
  const progressPct = Math.min(100, (currentTimeSec / totalDuration) * 100);
  const activeShot = CAMERA_SHOTS.find((s) => s.id === demoPhase) ?? CAMERA_SHOTS[0];

  // Auto-advance camera shots based on playback progress
  useEffect(() => {
    if (!isDemoMode || !isPlaying) return;
    const progressFrac = Math.min(1, Math.max(0, currentTimeSec / totalDuration));
    let targetPhase = 0;
    if (progressFrac < 0.15) targetPhase = 0;
    else if (progressFrac < 0.3) targetPhase = 1;
    else if (progressFrac < 0.65) targetPhase = 2;
    else if (progressFrac < 0.82) targetPhase = 3;
    else if (progressFrac < 0.94) targetPhase = 4;
    else targetPhase = 5;

    if (targetPhase !== demoPhase) {
      setDemoPhase(targetPhase);
    }
  }, [isDemoMode, isPlaying, currentTimeSec, totalDuration, demoPhase, setDemoPhase]);

  // Re-trigger phase title animation when phase changes
  useEffect(() => {
    if (prevPhaseRef.current !== demoPhase) {
      setTitleVisible(false);
      const t = setTimeout(() => {
        setTitleVisible(true);
        prevPhaseRef.current = demoPhase;
      }, 80);
      return () => clearTimeout(t);
    }
  }, [demoPhase]);

  const handleToggleRecord = () => {
    if (recordingProgress.state === 'recording') {
      stopDemoRecording();
      return;
    }

    const canvas = document.querySelector('canvas') as HTMLCanvasElement | null;
    if (!canvas) {
      alert('Simulation canvas not found for recording');
      return;
    }

    setCurrentTimeSec(0);
    setIsPlaying(true);
    setDemoPhase(0);

    startDemoRecording(
      canvas,
      (p) => setRecordingProgress(p),
      Math.min(30, Math.ceil(totalDuration))
    );
  };

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (!isDemoMode) return null;

  return (
    <div className="absolute inset-0 pointer-events-none z-30 flex flex-col justify-between p-4 sm:p-6 select-none font-sans">
      {/* Soft cinematic vignette */}
      <div className="absolute inset-0 demo-vignette" />

      {/* Top Bar */}
      <div className="relative flex items-start justify-between gap-4">
        {/* Branding card */}
        <div className="pointer-events-auto glass-panel-strong rounded-xl p-3.5 shadow-2xl max-w-md">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-2 h-2 rounded-full bg-cyan-400 live-indicator" />
            <span className="text-[10px] font-mono font-bold tracking-[0.18em] text-cyan-400 uppercase">
              AI Optimized Solution
            </span>
          </div>
          <h2 className="text-base font-bold text-white tracking-tight leading-snug">
            {activeCastPart.name}
          </h2>
          <div className="text-xs text-slate-400 font-mono mt-0.5">
            {machine.name.replace(' Die Casting Machine', '')}
          </div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-400 font-mono mt-2 pt-2 border-t border-slate-800/70">
            <span className="text-slate-300">Yaskawa GP50</span>
            <span className="text-slate-600">•</span>
            <span className="text-emerald-400 font-medium">94% Coverage</span>
            <span className="text-slate-600">•</span>
            <span className="text-cyan-400 font-medium">128 mm Clearance</span>
          </div>
        </div>

        {/* Actions */}
        <div className="pointer-events-auto flex items-center gap-2.5">
          {recordingProgress.state !== 'idle' && (
            <div className="px-3 py-2 rounded-xl glass-panel-strong text-xs font-mono flex items-center gap-2 shadow-2xl">
              {recordingProgress.state === 'recording' && (
                <>
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-red-400 font-semibold">
                    Recording… ({recordingProgress.durationSec}s)
                  </span>
                </>
              )}
              {recordingProgress.state === 'rendering' && (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
                  <span className="text-amber-400 font-semibold">Rendering frames…</span>
                </>
              )}
              {recordingProgress.state === 'encoding' && (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-400" />
                  <span className="text-blue-400 font-semibold">Encoding H.264 MP4…</span>
                </>
              )}
              {recordingProgress.state === 'complete' && (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400 font-semibold">Export Complete</span>
                </>
              )}
              {recordingProgress.state === 'error' && (
                <span className="text-rose-400 font-semibold">Recording error</span>
              )}
            </div>
          )}

          <button
            id="record-demo-btn"
            onClick={handleToggleRecord}
            disabled={recordingProgress.state === 'rendering' || recordingProgress.state === 'encoding'}
            className={`px-4 py-2.5 rounded-xl font-medium text-xs sm:text-sm flex items-center gap-2 transition-all shadow-xl cursor-pointer ${
              recordingProgress.state === 'recording'
                ? 'bg-red-600 hover:bg-red-500 text-white animate-pulse'
                : 'glass-panel hover:bg-slate-800/90 text-slate-100'
            }`}
          >
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                recordingProgress.state === 'recording' ? 'bg-white' : 'bg-red-500'
              }`}
            />
            {recordingProgress.state === 'recording' ? 'Stop Recording' : 'Record Demo'}
          </button>

          <button
            id="exit-demo-btn"
            onClick={() => setIsDemoMode(false)}
            className="p-2.5 rounded-xl glass-panel text-slate-400 hover:text-white transition cursor-pointer"
            title="Exit Demo Presentation Mode"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Center: Cinematic phase title */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        {titleVisible && (
          <div
            key={demoPhase}
            className="demo-phase-title text-center px-6 py-4 rounded-2xl glass-panel-strong max-w-lg mx-4"
          >
            <div className="flex items-center justify-center gap-2 mb-1.5">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-[10px] font-mono font-bold tracking-[0.2em] text-cyan-400/90 uppercase">
                Phase {demoPhase + 1} of 6
              </span>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              {activeShot.short}
            </h3>
            <p className="text-sm text-slate-400 mt-1.5 leading-relaxed">{activeShot.desc}</p>
          </div>
        )}
      </div>

      {/* Bottom transport bar */}
      <div className="relative pointer-events-auto max-w-3xl w-full mx-auto glass-panel-strong rounded-2xl p-4 shadow-2xl">
        {/* Progress track */}
        <div className="h-0.5 w-full bg-slate-800/80 rounded-full mb-3 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 phase-progress-fill rounded-full"
            style={{ width: `${progressPct}%` }}
          />
        </div>

        <div className="flex items-center gap-3 mb-3">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="w-9 h-9 rounded-xl bg-blue-600 hover:bg-blue-500 flex items-center justify-center text-white cursor-pointer transition shrink-0 shadow-lg shadow-blue-900/40"
          >
            {isPlaying ? (
              <Pause className="w-4 h-4 fill-white" />
            ) : (
              <Play className="w-4 h-4 fill-white ml-0.5" />
            )}
          </button>

          <button
            onClick={() => {
              setCurrentTimeSec(0);
              setIsPlaying(true);
              setDemoPhase(0);
            }}
            className="w-9 h-9 rounded-xl bg-slate-800/90 hover:bg-slate-700 flex items-center justify-center text-slate-300 cursor-pointer transition shrink-0"
            title="Replay from start"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          <div className="flex-1 relative flex items-center">
            <input
              type="range"
              min={0}
              max={totalDuration}
              step={0.05}
              value={currentTimeSec}
              onChange={(e) => setCurrentTimeSec(parseFloat(e.target.value))}
              className="demo-timeline w-full cursor-pointer"
            />
          </div>

          <div className="text-xs font-mono text-slate-400 shrink-0 min-w-[78px] text-right tabular-nums">
            {formatTime(currentTimeSec)} / {formatTime(totalDuration)}
          </div>
        </div>

        {/* Camera shot pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-1 border-t border-slate-800/60">
          <div className="text-[10px] font-mono uppercase text-slate-500 shrink-0 mr-1 flex items-center gap-1">
            <Camera className="w-3 h-3 text-cyan-400" />
            Cam
          </div>
          <div className="flex items-center gap-1.5 overflow-x-auto">
            {CAMERA_SHOTS.map((shot) => {
              const isActive = demoPhase === shot.id;
              return (
                <button
                  key={shot.id}
                  onClick={() => setDemoPhase(shot.id)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-mono transition-all cursor-pointer whitespace-nowrap ${
                    isActive
                      ? 'bg-blue-600/35 text-cyan-200 border border-cyan-500/40 font-semibold glow-cyan'
                      : 'bg-slate-900/50 text-slate-400 hover:text-slate-200 border border-slate-800/50 hover:bg-slate-800/80'
                  }`}
                  title={shot.desc}
                >
                  {shot.short}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
