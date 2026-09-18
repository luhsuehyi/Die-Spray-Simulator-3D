import React from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  ShieldAlert,
  ShieldCheck,
  Flame,
  Wind,
  Layers,
  ArrowRightCircle,
  Home,
  Clock,
  DoorOpen,
  ArrowDownToLine,
  CheckCircle2
} from 'lucide-react';
import { useSimulationStore } from '../../store/simulationStore';
import { HpdcSequenceState } from '../../types/robot';

interface StateStepMeta {
  state: HpdcSequenceState;
  shortLabel: string;
  subLabel: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

const SEQUENCE_STEPS: StateStepMeta[] = [
  { state: 'HOME', shortLabel: 'HOME', subLabel: 'Purge / Safe', icon: Home, color: 'text-slate-300' },
  { state: 'WAIT_DIE_OPEN', shortLabel: 'WAIT', subLabel: 'Die Opening', icon: Clock, color: 'text-amber-400' },
  { state: 'APPROACH', shortLabel: 'APPROACH', subLabel: 'Enter Daylight', icon: ArrowDownToLine, color: 'text-blue-400' },
  { state: 'ENTRY', shortLabel: 'ENTRY', subLabel: 'Clearance Box', icon: DoorOpen, color: 'text-indigo-400' },
  { state: 'READY', shortLabel: 'READY', subLabel: 'Align Spray', icon: ArrowRightCircle, color: 'text-cyan-400' },
  { state: 'SPRAY_FIXED', shortLabel: 'FIXED DIE', subLabel: 'Cover Half', icon: Layers, color: 'text-sky-400' },
  { state: 'SPRAY_MOVING', shortLabel: 'MOVING DIE', subLabel: 'Ejector Half', icon: Layers, color: 'text-teal-400' },
  { state: 'SPRAY_HOTSPOTS', shortLabel: 'HOT SPOTS', subLabel: 'Biscuit & Core', icon: Flame, color: 'text-rose-400' },
  { state: 'AIR_BLOW', shortLabel: 'AIR BLOW', subLabel: 'Drying Sweep', icon: Wind, color: 'text-blue-300' },
  { state: 'EXIT', shortLabel: 'EXIT DIE', subLabel: 'Retract Path', icon: ArrowDownToLine, color: 'text-purple-400' },
  { state: 'STANDBY', shortLabel: 'STANDBY', subLabel: 'Die Close OK', icon: CheckCircle2, color: 'text-emerald-400' }
];

export const SequenceTimelineBar: React.FC = () => {
  const {
    currentSequenceState,
    jumpToSequenceState,
    interlockState,
    toggleDieOpen,
    toggleMachineClear,
    cleanPurgeNozzles,
    isPlaying,
    setIsPlaying,
    resetSimulation,
    playbackSpeed,
    setPlaybackSpeed,
    currentTimeSec,
    trajectoryPlan
  } = useSimulationStore();

  const isRobotClear = interlockState.robotClearOfDie;
  const totalDuration = trajectoryPlan.totalDurationSec || 12;
  const progressPercent = Math.min(100, (currentTimeSec / totalDuration) * 100);

  return (
    <div className="bg-slate-950/95 border-t border-slate-800 px-3 py-2 flex flex-col gap-2 select-none shadow-xl">
      {/* Top Row: HPDC Interlock Safety Status & Machine Handshake */}
      <div className="flex items-center justify-between gap-2 flex-wrap text-xs">
        {/* Left: Die Safety Interlock Badge */}
        <div className="flex items-center gap-2">
          <div
            id="interlock-status-badge"
            className={`px-2.5 py-1 rounded-md text-[11px] font-bold flex items-center gap-1.5 transition border ${
              isRobotClear
                ? 'bg-emerald-950/70 border-emerald-500/50 text-emerald-300'
                : 'bg-amber-950/80 border-amber-500/60 text-amber-300 ring-1 ring-amber-500/40'
            }`}
          >
            {isRobotClear ? (
              <>
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>ROBOT CLEAR → DIE CAN CLOSE</span>
              </>
            ) : (
              <>
                <ShieldAlert className="w-3.5 h-3.5 text-amber-400 shrink-0 animate-pulse" />
                <span>ROBOT IN CELL — DIE LOCKED OPEN</span>
              </>
            )}
          </div>

          {/* Handshake Simulation Toggles */}
          <div className="flex items-center gap-1 bg-slate-900/90 border border-slate-800 rounded-md p-0.5 text-[10px]">
            <button
              id="toggle-die-open-btn"
              onClick={toggleDieOpen}
              className={`px-2 py-0.5 rounded font-semibold transition cursor-pointer ${
                interlockState.dieOpen
                  ? 'bg-blue-600/30 text-blue-300 border border-blue-500/40'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
              title="Simulate Die Open Signal from Machine PLC"
            >
              DIE OPEN: {interlockState.dieOpen ? 'YES' : 'NO'}
            </button>
            <button
              id="toggle-machine-clear-btn"
              onClick={toggleMachineClear}
              className={`px-2 py-0.5 rounded font-semibold transition cursor-pointer ${
                interlockState.machineClear
                  ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/40'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
              title="Simulate Machine Ejector Retracted & Part Cleared Signal"
            >
              MACHINE CLEAR: {interlockState.machineClear ? 'YES' : 'NO'}
            </button>
            <button
              id="purge-nozzles-btn"
              onClick={cleanPurgeNozzles}
              className="px-2 py-0.5 rounded font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer flex items-center gap-1"
              title="Execute nozzle purge & cleaning cycle at Home"
            >
              <Sparkles className="w-2.5 h-2.5 text-cyan-400" />
              <span>PURGE / CLEAN</span>
            </button>
          </div>
        </div>

        {/* Center: Play Cycle Transport */}
        <div className="flex items-center gap-2">
          <button
            id="hpdc-reset-btn"
            onClick={resetSimulation}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition cursor-pointer"
            title="Reset to HOME"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button
            id="hpdc-play-toggle-btn"
            onClick={() => setIsPlaying(!isPlaying)}
            className={`px-3 py-1 rounded-md text-xs font-bold transition flex items-center gap-1.5 shadow cursor-pointer ${
              isPlaying
                ? 'bg-amber-600 hover:bg-amber-500 text-white'
                : 'bg-blue-600 hover:bg-blue-500 text-white'
            }`}
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
            <span>{isPlaying ? 'Pause Cycle' : 'Run Cycle'}</span>
          </button>

          {/* Speed Buttons */}
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded p-0.5 text-[10px] font-mono">
            {[0.25, 0.5, 1, 2, 5].map(spd => (
              <button
                key={spd}
                id={`hpdc-speed-${spd}x`}
                onClick={() => setPlaybackSpeed(spd)}
                className={`px-1.5 py-0.5 rounded cursor-pointer transition ${
                  playbackSpeed === spd
                    ? 'bg-blue-600 text-white font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {spd}x
              </button>
            ))}
          </div>

          <span className="text-[11px] font-mono text-slate-400 ml-1">
            {currentTimeSec.toFixed(1)}s / {totalDuration.toFixed(1)}s
          </span>
        </div>
      </div>

      {/* Bottom Row: Clickable HPDC Sequence Steps Timeline */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1 pt-0.5 scrollbar-thin">
        {SEQUENCE_STEPS.map((step, idx) => {
          const Icon = step.icon;
          const isCurrent = currentSequenceState === step.state;

          return (
            <button
              key={step.state}
              id={`sequence-step-${step.state.toLowerCase()}`}
              onClick={() => jumpToSequenceState(step.state)}
              className={`flex-1 min-w-[82px] p-1.5 rounded-lg border text-left transition cursor-pointer relative flex flex-col justify-between ${
                isCurrent
                  ? 'bg-blue-600/25 border-blue-400 text-white shadow-md ring-1 ring-blue-500/50'
                  : 'bg-slate-900/60 border-slate-800/80 text-slate-400 hover:text-slate-200 hover:border-slate-700 hover:bg-slate-900'
              }`}
              title={`Jump robot directly to ${step.shortLabel} position`}
            >
              <div className="flex items-center justify-between w-full">
                <span className="text-[9px] font-mono text-slate-500 font-semibold">
                  {idx + 1 < 10 ? '0' + (idx + 1) : idx + 1}
                </span>
                <Icon className={`w-3 h-3 ${isCurrent ? 'text-blue-400 animate-pulse' : step.color}`} />
              </div>
              <div className="mt-0.5">
                <div className={`text-[10px] font-bold leading-tight ${isCurrent ? 'text-white' : 'text-slate-300'}`}>
                  {step.shortLabel}
                </div>
                <div className="text-[8.5px] text-slate-400 truncate leading-none mt-0.5">
                  {step.subLabel}
                </div>
              </div>
              {isCurrent && (
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-3 h-1 bg-blue-400 rounded-full" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
