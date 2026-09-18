import React from 'react';
import { X, Factory, Check, ShieldCheck, Cpu } from 'lucide-react';
import { useSimulationStore } from '../../store/simulationStore';
import { translations } from '../../utils/i18n';

export const MachineSpecModal: React.FC = () => {
  const {
    language,
    isMachineSpecOpen,
    setIsMachineSpecOpen,
    machine,
    setMachine,
    toyoFamily,
    setMachineSize
  } = useSimulationStore();

  const t = translations[language] || translations['en'];

  if (!isMachineSpecOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 select-none">
      <div className="bg-slate-900 border border-slate-700/80 rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden text-slate-200 animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600/20 text-blue-400 rounded-lg border border-blue-500/30">
              <Factory className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                {machine.name} Specifications
                <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-mono">
                  {machine.clampingForceTons} Tons ({machine.clampingForceKn.toLocaleString()} kN)
                </span>
              </h2>
              <p className="text-xs text-slate-400">Toyo Multi-Link Cold Chamber Die Casting Machine</p>
            </div>
          </div>
          <button
            onClick={() => setIsMachineSpecOpen(false)}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 overflow-y-auto">
          {/* Quick Family Model Switcher Bar */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-2">
              Select Toyo BD-V7EX Family Model:
            </label>
            <div className="flex flex-wrap gap-1.5">
              {toyoFamily.map(m => {
                const isSelected = m.clampingForceKn === machine.clampingForceKn;
                return (
                  <button
                    key={m.id}
                    onClick={() => setMachineSize(m.clampingForceKn)}
                    className={`px-2.5 py-1 text-xs rounded-lg font-medium transition ${
                      isSelected
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-750 hover:text-white'
                    }`}
                  >
                    {m.modelSeries || m.name.split(' ')[1]} ({m.clampingForceTons}T)
                  </button>
                );
              })}
            </div>
          </div>

          {/* Core Machine Parameters */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-lg">
              <div className="text-[11px] text-slate-400">Clamping Force</div>
              <div className="text-sm font-bold text-slate-100 font-mono mt-0.5">
                {machine.clampingForceTons} Tons
              </div>
              <div className="text-[10px] text-slate-500 font-mono">{machine.clampingForceKn} kN</div>
            </div>

            <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-lg">
              <div className="text-[11px] text-slate-400">Tie-Bar Clearance (H x V)</div>
              <div className="text-sm font-bold text-slate-100 font-mono mt-0.5">
                {machine.tieBarClearanceH} x {machine.tieBarClearanceV} mm
              </div>
              <div className="text-[10px] text-slate-500 font-mono">Dia: {machine.tieBarDiameter} mm</div>
            </div>

            <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-lg">
              <div className="text-[11px] text-slate-400">Stationary Platen (W x H)</div>
              <div className="text-sm font-bold text-slate-100 font-mono mt-0.5">
                {machine.platenWidth} x {machine.platenHeight} mm
              </div>
              <div className="text-[10px] text-slate-500 font-mono">
                Mov: {machine.movablePlatenWidth || machine.platenWidth} x {machine.movablePlatenHeight || machine.platenHeight}
              </div>
            </div>

            <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-lg">
              <div className="text-[11px] text-slate-400">Die Opening Stroke</div>
              <div className="text-sm font-bold text-slate-100 font-mono mt-0.5">
                {machine.maxDieOpeningStroke} mm
              </div>
              <div className="text-[10px] text-slate-500 font-mono">
                Die Thickness: {machine.minDieThickness} - {machine.maxDieThickness} mm
              </div>
            </div>

            <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-lg">
              <div className="text-[11px] text-slate-400">Injection & Lubricator</div>
              <div className="text-sm font-bold text-slate-100 font-mono mt-0.5">
                {machine.plungerLubricatorModel || 'DM05'}
              </div>
              <div className="text-[10px] text-slate-500 font-mono">
                Plunger Stroke: {machine.plungerStroke || 700} mm
              </div>
            </div>

            <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-lg">
              <div className="text-[11px] text-slate-400">Machine Footprint (L x W x H)</div>
              <div className="text-sm font-bold text-slate-100 font-mono mt-0.5">
                {(machine.machineLengthMm || 6000) / 1000} x {(machine.machineWidthMm || 2200) / 1000} m
              </div>
              <div className="text-[10px] text-slate-500 font-mono">
                Height: {(machine.machineHeightMm || 2800) / 1000} m
              </div>
            </div>
          </div>

          {/* Factory Integration Guidance */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs text-slate-300 space-y-2">
            <div className="font-semibold text-slate-200 flex items-center gap-1.5">
              <Cpu className="w-4 h-4 text-blue-400" />
              Toyo SYSTEM 700EX Electrical & Automation Notes
            </div>
            <p className="text-slate-400 leading-relaxed">
              Equipped with multi-stage injection velocity control, real-time servo shot profile feedback,
              and standard Euromap 67 / SPI robot interface. Top-mounted spray robots (such as Wollin / Yaskawa GP50)
              mount directly to the stationary platen top deck with rigid tie-rod gusset bracing.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/70 flex justify-end">
          <button
            onClick={() => setIsMachineSpecOpen(false)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
