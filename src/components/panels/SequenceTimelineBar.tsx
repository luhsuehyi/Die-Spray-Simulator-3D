import React from 'react';
import {
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
}

const SEQUENCE_STEPS: StateStepMeta[] = [
  { state: 'HOME', shortLabel: 'Home', subLabel: 'Safe Standby', icon: Home },
  { state: 'WAIT_DIE_OPEN', shortLabel: 'Wait', subLabel: 'Die Opening', icon: Clock },
  { state: 'APPROACH', shortLabel: 'Approach', subLabel: 'Enter Daylight', icon: ArrowDownToLine },
  { state: 'ENTRY', shortLabel: 'Entry', subLabel: 'Clearance Box', icon: DoorOpen },
  { state: 'READY', shortLabel: 'Ready', subLabel: 'Align Spray', icon: ArrowRightCircle },
  { state: 'SPRAY_FIXED', shortLabel: 'Fixed Die', subLabel: 'Cover Half', icon: Layers },
  { state: 'SPRAY_MOVING', shortLabel: 'Moving Die', subLabel: 'Ejector Half', icon: Layers },
  { state: 'SPRAY_HOTSPOTS', shortLabel: 'Hot Spots', subLabel: 'Biscuit & Core', icon: Flame },
  { state: 'AIR_BLOW', shortLabel: 'Air Blow', subLabel: 'Drying Sweep', icon: Wind },
  { state: 'EXIT', shortLabel: 'Exit', subLabel: 'Retract Path', icon: ArrowDownToLine },
  { state: 'STANDBY', shortLabel: 'Standby', subLabel: 'Die Close OK', icon: CheckCircle2 }
];

export const SequenceTimelineBar: React.FC = () => {
  const {
    currentSequenceState,
    jumpToSequenceState,
    interlockState,
    toggleDieOpen,
    toggleMachineClear,
    cleanPurgeNozzles
  } = useSimulationStore();

  const isRobotClear = interlockState.robotClearOfDie;

  return (
    <div className="bg-slate-950 border-t border-slate-800/80 px-3 py-1 flex items-center justify-between gap-2 select-none shrink-0 text-xs overflow-x-auto">
      {/* 1. Left: Machine Interlock & Signals Cluster */}
      <div className="flex items-center gap-1.5 shrink-0">
        {/* Die Safety Interlock Badge */}
        <div
          id="interlock-status-badge"
          className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold flex items-center gap-1.5 border transition ${
            isRobotClear
              ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
              : 'bg-amber-950/70 border-amber-500/50 text-amber-300'
          }`}
          title={isRobotClear ? 'Robot is outside die area. Safe for machine to clamp.' : 'Robot is inside daylight. Machine clamp is locked open.'}
        >
          {isRobotClear ? (
            <>
              <ShieldCheck className="w-3 h-3 text-emerald-400 shrink-0" />
              <span>ROBOT CLEAR</span>
            </>
          ) : (
            <>
              <ShieldAlert className="w-3 h-3 text-amber-400 shrink-0 animate-pulse" />
              <span>IN DAYLIGHT</span>
            </>
          )}
        </div>

        {/* PLC Signal Emulators */}
        <div className="flex items-center bg-slate-900 border border-slate-800 rounded p-0.5 text-[10px] font-mono">
          <button
            id="toggle-die-open-btn"
            onClick={toggleDieOpen}
            className={`px-1.5 py-0.5 rounded transition cursor-pointer ${
              interlockState.dieOpen
                ? 'bg-blue-600/30 text-blue-300 border border-blue-500/40 font-semibold'
                : 'text-slate-400 hover:text-white'
            }`}
            title="Toggle Die Open PLC confirmation signal"
          >
            DIE OPEN: {interlockState.dieOpen ? 'YES' : 'NO'}
          </button>
          <button
            id="toggle-machine-clear-btn"
            onClick={toggleMachineClear}
            className={`px-1.5 py-0.5 rounded transition cursor-pointer ml-0.5 ${
              interlockState.machineClear
                ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 font-semibold'
                : 'text-slate-400 hover:text-white'
            }`}
            title="Toggle Machine Part Cleared PLC signal"
          >
            PART CLEAR: {interlockState.machineClear ? 'YES' : 'NO'}
          </button>
          <button
            id="purge-nozzles-btn"
            onClick={cleanPurgeNozzles}
            className="px-1.5 py-0.5 rounded text-slate-400 hover:text-cyan-300 transition cursor-pointer flex items-center gap-1 ml-0.5 hover:bg-slate-800"
            title="Execute nozzle purge & cleaning cycle at Home"
          >
            <Sparkles className="w-2.5 h-2.5 text-cyan-400" />
            <span>PURGE</span>
          </button>
        </div>
      </div>

      {/* 2. Right: Connected HPDC Sequence Phase Ribbon */}
      <div className="flex items-center gap-0.5 min-w-max">
        <span className="text-[10px] font-mono text-slate-500 uppercase mr-1">
          PHASE:
        </span>
        <div className="flex items-center bg-slate-900 border border-slate-800 rounded-md p-0.5">
          {SEQUENCE_STEPS.map((step, idx) => {
            const Icon = step.icon;
            const isCurrent = currentSequenceState === step.state;

            return (
              <button
                key={step.state}
                id={`sequence-step-${step.state.toLowerCase()}`}
                onClick={() => jumpToSequenceState(step.state)}
                className={`px-2 py-0.5 rounded text-[10px] font-medium transition cursor-pointer flex items-center gap-1 ${
                  isCurrent
                    ? 'bg-blue-600 text-white font-bold shadow-xs'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
                title={`Jump robot directly to ${step.shortLabel} (${step.subLabel})`}
              >
                <Icon className={`w-2.5 h-2.5 ${isCurrent ? 'text-white' : 'text-slate-500'}`} />
                <span className="whitespace-nowrap">{step.shortLabel}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
