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
  ChevronRight,
  Sparkles,
  Cpu
} from 'lucide-react';
import { useSimulationStore } from '../../store/simulationStore';

const STEPS = [
  { step: 0, label: 'Cast Part', icon: Layers, desc: 'Part Input & Auto-Design' },
  { step: 1, label: 'Cell & Machine', icon: Factory, desc: 'Tonnage & Platens' },
  { step: 2, label: 'Robot Position', icon: Compass, desc: 'Top vs Side Mount' },
  { step: 3, label: 'Robot Model', icon: Bot, desc: 'Payload & Reach' },
  { step: 4, label: 'Spray Head', icon: SprayIcon, desc: 'Tooling & Nozzles' },
  { step: 5, label: 'Spray Areas', icon: CheckSquare, desc: 'Surfaces & Hotspots' },
  { step: 6, label: 'Sequence', icon: Clock, desc: 'HPDC Dwells & Timing' },
  { step: 7, label: 'Simulate', icon: Play, desc: 'Twin Playback' },
  { step: 8, label: 'Optimize', icon: Wrench, desc: 'Clearance & Coverage' },
  { step: 9, label: 'Export Code', icon: FileCode, desc: 'Robot Program' }
];

export const ManufacturingWorkflowBar: React.FC = () => {
  const {
    workflowStep,
    setWorkflowStep,
    automateSprayPath,
    setIsCodeExportOpen,
    setIsCastPartDesignerOpen,
    activeCastPart
  } = useSimulationStore();

  return (
    <div className="bg-slate-900/90 backdrop-blur border-b border-slate-800 px-3 py-1.5 flex items-center justify-between overflow-x-auto select-none gap-2">
      {/* Workflow Steps Indicator */}
      <div className="flex items-center gap-1 min-w-max">
        {STEPS.map((item, index) => {
          const Icon = item.icon;
          const isActive = workflowStep === item.step;
          const isCompleted = workflowStep > item.step;

          return (
            <React.Fragment key={item.step}>
              <button
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
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition cursor-pointer ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm ring-1 ring-blue-400/50'
                    : isCompleted
                    ? 'bg-slate-800/80 text-emerald-400 hover:bg-slate-800'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold ${
                    isActive
                      ? 'bg-white text-blue-600'
                      : isCompleted
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                      : 'bg-slate-800 text-slate-400 border border-slate-700'
                  }`}
                >
                  {isCompleted ? '✓' : item.step}
                </div>
                <span className="leading-tight text-[11px] whitespace-nowrap">{item.label}</span>
              </button>

              {index < STEPS.length - 1 && (
                <ChevronRight className="w-3 h-3 text-slate-700 shrink-0" />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Primary Action Buttons */}
      <div className="flex items-center gap-2 pl-3 border-l border-slate-800 shrink-0">
        {/* Cast Part Auto-Design Primary Button */}
        <button
          id="workflow-generate-cell-btn"
          onClick={() => setIsCastPartDesignerOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-extrabold rounded-lg text-xs shadow-md shadow-amber-500/20 transition cursor-pointer"
          title="Synthesize complete automation cell from cast part geometry"
        >
          <Cpu className="w-3.5 h-3.5 text-slate-950" />
          <span>⚡ GENERATE AUTOMATION CELL</span>
        </button>

        {/* # AUTOMATE THIS TASK spray button */}
        <button
          id="workflow-automate-task-btn"
          onClick={() => automateSprayPath()}
          className="flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-lg text-xs font-bold shadow-md shadow-blue-500/20 transition cursor-pointer"
          title="Automatically creates robot placement, approach path, entry path, spray positions, spray orientation, exit path, air-blow path"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-300" />
          <span># AUTOMATE SPRAY PATH</span>
        </button>
      </div>
    </div>
  );
};
