import React, { useState } from 'react';
import { X, Wand2, ArrowRight, Grid, Compass } from 'lucide-react';
import { useSimulationStore } from '../../store/simulationStore';
import { translations } from '../../utils/i18n';
import { generateAutoSweepPattern } from '../../utils/aiSprayOptimizer';

export const AutoSweepModal: React.FC = () => {
  const {
    language,
    isAutoSweepOpen,
    setIsAutoSweepOpen,
    setWaypoints,
    die
  } = useSimulationStore();

  const t = translations[language] || translations['en'];

  const [targetFace, setTargetFace] = useState<'FIXED_DIE' | 'MOVABLE_DIE' | 'BOTH'>('BOTH');
  const [rowPitchMm, setRowPitchMm] = useState<number>(75);
  const [speedMmPerSec, setSpeedMmPerSec] = useState<number>(350);
  const [standoffMm, setStandoffMm] = useState<number>(135);

  if (!isAutoSweepOpen) return null;

  const handleGenerate = () => {
    const sweep = generateAutoSweepPattern(die, targetFace, rowPitchMm, speedMmPerSec, standoffMm);
    setWaypoints(sweep);
    setIsAutoSweepOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 select-none">
      <div className="bg-slate-900 border border-slate-700/80 rounded-xl shadow-2xl w-full max-w-lg overflow-hidden text-slate-200 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-cyan-600/20 text-cyan-400 rounded-lg">
              <Wand2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">{t.autoSweep}</h2>
              <p className="text-xs text-slate-400">Generate Serpentine / Raster Spray Paths Automatically</p>
            </div>
          </div>
          <button
            onClick={() => setIsAutoSweepOpen(false)}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 text-xs">
          {/* Target Face */}
          <div>
            <label className="text-slate-300 font-medium block mb-1.5">Target Die Face</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { key: 'FIXED_DIE', label: 'Fixed Die Only' },
                { key: 'MOVABLE_DIE', label: 'Movable Die Only' },
                { key: 'BOTH', label: 'Both (Synchronized)' }
              ].map(opt => (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => setTargetFace(opt.key as any)}
                  className={`p-2 rounded border text-center font-medium transition cursor-pointer ${
                    targetFace === opt.key
                      ? 'bg-blue-600 border-blue-500 text-white shadow'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Row Pitch */}
          <div>
            <div className="flex justify-between text-slate-300 font-medium mb-1">
              <span>Raster Row Spacing (Pitch)</span>
              <span className="font-mono text-blue-400">{rowPitchMm} mm</span>
            </div>
            <input
              type="range"
              min="40"
              max="140"
              step="5"
              value={rowPitchMm}
              onChange={e => setRowPitchMm(Number(e.target.value))}
              className="w-full accent-blue-500 cursor-pointer"
            />
          </div>

          {/* Standoff Distance */}
          <div>
            <div className="flex justify-between text-slate-300 font-medium mb-1">
              <span>Nozzle Standoff Distance</span>
              <span className="font-mono text-blue-400">{standoffMm} mm</span>
            </div>
            <input
              type="range"
              min="90"
              max="220"
              step="5"
              value={standoffMm}
              onChange={e => setStandoffMm(Number(e.target.value))}
              className="w-full accent-blue-500 cursor-pointer"
            />
          </div>

          {/* Feed Velocity */}
          <div>
            <div className="flex justify-between text-slate-300 font-medium mb-1">
              <span>Spray Feed Velocity</span>
              <span className="font-mono text-blue-400">{speedMmPerSec} mm/s</span>
            </div>
            <input
              type="range"
              min="150"
              max="800"
              step="25"
              value={speedMmPerSec}
              onChange={e => setSpeedMmPerSec(Number(e.target.value))}
              className="w-full accent-blue-500 cursor-pointer"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-950/70 flex items-center justify-between">
          <button
            onClick={() => setIsAutoSweepOpen(false)}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg transition"
          >
            Cancel
          </button>

          <button
            id="generate-sweep-pattern-btn"
            onClick={handleGenerate}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg transition shadow-md cursor-pointer"
          >
            <Wand2 className="w-4 h-4" />
            Generate Sweep Pattern
          </button>
        </div>
      </div>
    </div>
  );
};
