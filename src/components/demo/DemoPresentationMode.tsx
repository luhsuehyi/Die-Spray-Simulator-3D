import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Video,
  CheckCircle2,
  X,
  Camera,
  Loader2,
  Download,
  Sparkles,
  ShieldCheck,
  Maximize2
} from 'lucide-react';
import { useSimulationStore } from '../../store/simulationStore';
import {
  startDemoRecording,
  stopDemoRecording,
  RecorderProgress,
  RecordingState
} from '../../utils/videoRecorder';

export const CAMERA_SHOTS = [
  { id: 0, label: '1. Cell Establishing', desc: 'Full-cell establishing overview' },
  { id: 1, label: '2. Robot Approach', desc: 'Top robot descent into platen daylight' },
  { id: 2, label: '3. Spray Process', desc: 'Close-up of high-speed atomized lube spray' },
  { id: 3, label: '4. Die Coverage', desc: 'Fixed & movable core cavity face coverage' },
  { id: 4, label: '5. Robot Retract', desc: 'Retract to top platen stationary home' },
  { id: 5, label: '6. Final Overview', desc: 'Complete HPDC manufacturing cell' }
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
    machine,
    aiPlanResult
  } = useSimulationStore();

  const [recordingProgress, setRecordingProgress] = useState<RecorderProgress>({
    state: 'idle',
    durationSec: 0,
    message: ''
  });

  const totalDuration = Math.max(15, trajectoryPlan.totalDurationSec || 42);

  // Auto-advance camera shots smoothly based on simulation playback progress in Demo Mode
  useEffect(() => {
    if (!isDemoMode || !isPlaying) return;
    const progressFrac = Math.min(1, Math.max(0, currentTimeSec / totalDuration));
    let targetPhase = 0;
    if (progressFrac < 0.15) {
      targetPhase = 0;
    } else if (progressFrac < 0.30) {
      targetPhase = 1;
    } else if (progressFrac < 0.65) {
      targetPhase = 2;
    } else if (progressFrac < 0.82) {
      targetPhase = 3;
    } else if (progressFrac < 0.94) {
      targetPhase = 4;
    } else {
      targetPhase = 5;
    }

    if (targetPhase !== demoPhase) {
      setDemoPhase(targetPhase);
    }
  }, [isDemoMode, isPlaying, currentTimeSec, totalDuration, demoPhase, setDemoPhase]);

  const handleToggleRecord = () => {
    if (recordingProgress.state === 'recording') {
      stopDemoRecording();
      return;
    }

    // Find main ThreeJS canvas element
    const canvas = document.querySelector('canvas') as HTMLCanvasElement | null;
    if (!canvas) {
      alert('Simulation canvas not found for recording');
      return;
    }

    // Reset simulation to beginning and play for clean recording
    setCurrentTimeSec(0);
    setIsPlaying(true);
    setDemoPhase(0);

    startDemoRecording(
      canvas,
      (p) => {
        setRecordingProgress(p);
      },
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
      
      {/* Top Bar: Minimal AI Optimized Solution Title & Recording CTA */}
      <div className="flex items-start justify-between gap-4">
        {/* Left minimal branding overlay */}
        <div className="pointer-events-auto bg-slate-950/80 backdrop-blur-md border border-slate-800/80 rounded-xl p-3.5 shadow-2xl">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping" />
            <span className="text-[11px] font-mono font-bold tracking-widest text-blue-400 uppercase">
              AI OPTIMIZED SOLUTION
            </span>
          </div>
          <h2 className="text-base font-bold text-white tracking-tight">
            {activeCastPart.name} • {machine.name.replace(' Die Casting Machine', '')}
          </h2>
          <div className="flex items-center gap-3 text-xs text-slate-400 font-mono mt-1">
            <span>Yaskawa GP50 Top-Mounted</span>
            <span>•</span>
            <span className="text-emerald-400 font-medium">94% Coverage</span>
            <span>•</span>
            <span className="text-cyan-400 font-medium">128mm Clearance</span>
          </div>
        </div>

        {/* Right Action buttons: Record Demo & Exit */}
        <div className="pointer-events-auto flex items-center gap-2.5">
          {/* Export / Recording Status Badge if not idle */}
          {recordingProgress.state !== 'idle' && (
            <div className="px-3 py-2 rounded-xl bg-slate-950/90 border border-slate-800 text-xs font-mono flex items-center gap-2 shadow-2xl">
              {recordingProgress.state === 'recording' && (
                <>
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-red-400 font-semibold">Recording... ({recordingProgress.durationSec}s)</span>
                </>
              )}
              {recordingProgress.state === 'rendering' && (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
                  <span className="text-amber-400 font-semibold">Rendering frames...</span>
                </>
              )}
              {recordingProgress.state === 'encoding' && (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-400" />
                  <span className="text-blue-400 font-semibold">Encoding H.264 MP4...</span>
                </>
              )}
              {recordingProgress.state === 'complete' && (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400 font-semibold">Export Complete!</span>
                </>
              )}
              {recordingProgress.state === 'error' && (
                <span className="text-rose-400 font-semibold">Recording error</span>
              )}
            </div>
          )}

          {/* Record Demo Button */}
          <button
            id="record-demo-btn"
            onClick={handleToggleRecord}
            disabled={recordingProgress.state === 'rendering' || recordingProgress.state === 'encoding'}
            className={`px-4 py-2.5 rounded-xl font-medium text-xs sm:text-sm flex items-center gap-2 transition-all shadow-xl cursor-pointer ${
              recordingProgress.state === 'recording'
                ? 'bg-red-600 hover:bg-red-500 text-white animate-pulse'
                : 'bg-slate-900/90 hover:bg-slate-800 text-slate-100 border border-slate-700/80'
            }`}
          >
            <span className={`w-2.5 h-2.5 rounded-full ${recordingProgress.state === 'recording' ? 'bg-white' : 'bg-red-500'}`} />
            {recordingProgress.state === 'recording' ? 'Stop Recording' : '● Record Demo (MP4)'}
          </button>

          {/* Exit Demo Mode */}
          <button
            id="exit-demo-btn"
            onClick={() => {
              setIsDemoMode(false);
            }}
            className="p-2.5 rounded-xl bg-slate-950/80 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 shadow-2xl transition cursor-pointer"
            title="Exit Demo Presentation Mode"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Bottom Floating Bar: Compact Playback Timeline & Camera Shot Selector */}
      <div className="pointer-events-auto max-w-3xl w-full mx-auto bg-slate-950/85 backdrop-blur-md border border-slate-800/80 rounded-2xl p-4 shadow-2xl">
        {/* Timeline Slider */}
        <div className="flex items-center gap-3 mb-3">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="w-8 h-8 rounded-lg bg-blue-600 hover:bg-blue-500 flex items-center justify-center text-white cursor-pointer transition shrink-0"
          >
            {isPlaying ? <Pause className="w-4 h-4 fill-white" /> : <Play className="w-4 h-4 fill-white ml-0.5" />}
          </button>

          <button
            onClick={() => {
              setCurrentTimeSec(0);
              setIsPlaying(true);
              setDemoPhase(0);
            }}
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300 cursor-pointer transition shrink-0"
            title="Replay from start"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          <div className="flex-1 relative flex items-center">
            <input
              type="range"
              min="0"
              max={totalDuration}
              step="0.05"
              value={currentTimeSec}
              onChange={(e) => setCurrentTimeSec(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
          </div>

          <div className="text-xs font-mono text-slate-400 shrink-0 min-w-[75px] text-right">
            {formatTime(currentTimeSec)} / {formatTime(totalDuration)}
          </div>
        </div>

        {/* Camera Shot Selector Pills */}
        <div className="flex items-center justify-between gap-1.5 overflow-x-auto pt-1 border-t border-slate-800/60">
          <div className="text-[10px] font-mono uppercase text-slate-500 shrink-0 mr-1 flex items-center gap-1">
            <Camera className="w-3 h-3 text-blue-400" />
            Camera
          </div>
          <div className="flex items-center gap-1.5 overflow-x-auto">
            {CAMERA_SHOTS.map((shot) => {
              const isActive = demoPhase === shot.id;
              return (
                <button
                  key={shot.id}
                  onClick={() => setDemoPhase(shot.id)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-all cursor-pointer whitespace-nowrap ${
                    isActive
                      ? 'bg-blue-600/30 text-blue-300 border border-blue-500/50 font-semibold'
                      : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800/60 hover:bg-slate-800'
                  }`}
                  title={shot.desc}
                >
                  {shot.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

    </div>
  );
};
