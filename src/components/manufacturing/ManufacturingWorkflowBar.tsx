import React from 'react';
import {
  Layers,
  Factory,
  Compass,
  Bot,
  SprayCan as SprayIcon,
  CheckSquare,
  Clock,
  Play,
  Wrench,
  FileCode,
  Sparkles,
  Cpu
} from 'lucide-react';
import { useSimulationStore } from '../../store/simulationStore';

const STEPS = [
  { step: 0, label: 'Part', fullLabel: 'Cast Part', icon: Layers, desc: 'Part Input & Auto-Design' },
  { step: 1, label: 'Machine', fullLabel: 'Cell & Machine', icon: Factory, desc: 'Tonnage & Platens' },
  { step: 2, label: 'Mount', fullLabel: 'Robot Position', icon: Compass, desc: 'Top vs Side Mount' },
  { step: 3, label: 'Robot', fullLabel: 'Robot Model', icon: Bot, desc: 'Payload & Reach' },
  { step: 4, label: 'Tool', fullLabel: 'Spray Head', icon: SprayIcon, desc: 'Tooling & Nozzles' },
  { step: 5, label: 'Areas', fullLabel: 'Spray Areas', icon: CheckSquare, desc: 'Surfaces & Hotspots' },
  { step: 6, label: 'Sequence', fullLabel: 'HPDC Sequence', icon: Clock, desc: 'Timing & Interlocks' },
  { step: 7, label: 'Simulate', fullLabel: 'Digital Twin', icon: Play, desc: 'Twin Playback' },
  { step: 8, label: 'Optimize', fullLabel: 'Optimization', icon: Wrench, desc: 'Clearance & Coverage' },
  { step: 9, label: 'Export', fullLabel: 'Robot Program', icon: FileCode, desc: 'Program Code' }
];

export const ManufacturingWorkflowBar: React.FC = () => {
  const {
    workflowStep,
    setWorkflowStep,
    automateSprayPath,
    setIsCodeExportOpen,
    setIsCastPartDesignerOpen
  } = useSimulationStore();

  return (
    <div className="bg-slate-950 border-b border-slate-800/80 px-3 py-1 flex items-center justify-between overflow-x-auto select-none gap-2 text-xs shrink-0">
      {/* Workflow Steps Minimalist Stepper */}
      <div className="flex items-center gap-1 min-w-max">
        <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider mr-1">
          WORKFLOW:
        </span>
        <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5">
          {STEPS.map((item) => {
            const isActive = workflowStep === item.step;
            const isCompleted = workflowStep > item.step;

            return (
              <button
                key={item.step}
                id={`workflow-step-btn-${item.step}`}
                onClick={() => {
                  if (item.step === 0) {
                    setIsCastPartDesignerOpen(true);
                  } else if (item.step === 9) {
                    setIsCodeExportOpen(true);
                  } else {
                    setWorkflowStep(item.step);
                  }
                }}
                className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium transition cursor-pointer ${
                  isActive
                    ? 'bg-blue-600 text-white font-semibold shadow-xs'
                    : isCompleted
                    ? 'text-emerald-400 hover:text-emerald-300 hover:bg-slate-800'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
                title={`Step ${item.step}: ${item.fullLabel} (${item.desc})`}
              >
                <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] font-mono font-bold ${
                  isActive
                    ? 'bg-white text-blue-600'
                    : isCompleted
                    ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                    : 'bg-slate-800 text-slate-500'
                }`}>
                  {isCompleted ? '✓' : item.step}
                </span>
                <span className={`${isActive ? 'inline' : 'hidden xl:inline'} whitespace-nowrap`}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Primary Action Buttons - Refined Industrial Style */}
      <div className="flex items-center gap-1.5 shrink-0">
        <button
          id="workflow-generate-cell-btn"
          onClick={() => setIsCastPartDesignerOpen(true)}
          className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-md text-[11px] font-semibold transition cursor-pointer"
          title="Synthesize complete automation cell from cast part geometry"
        >
          <Cpu className="w-3.5 h-3.5 text-amber-400" />
          <span>Auto-Design Cell</span>
        </button>

        <button
          id="workflow-automate-task-btn"
          onClick={() => automateSprayPath()}
          className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-md text-[11px] font-semibold transition cursor-pointer shadow-xs"
          title="Generate collision-free entry, spray path, and exit"
        >
          <Sparkles className="w-3.5 h-3.5 text-blue-200" />
          <span>Automate Spray Path</span>
        </button>
      </div>
    </div>
  );
};
