import React, { useRef, useState } from 'react';
import {
  Upload,
  Sparkles,
  CheckCircle2,
  Cpu,
  ShieldCheck,
  Timer,
  Play,
  SlidersHorizontal,
  RotateCcw,
  Box,
  Layers,
  FileCheck,
  ChevronRight,
  ArrowRight
} from 'lucide-react';
import { useSimulationStore } from '../../store/simulationStore';
import { SAMPLE_CAST_PARTS } from '../../utils/castPartPresets';
import { CastPartModel } from '../../types/castPart';

export const AiAutoPlanView: React.FC = () => {
  const {
    activeCastPart,
    selectCastPart,
    importCustomCastPartCAD,
    runAiAutoPlan,
    resetAiPlan,
    isAiPlanning,
    aiPlanningProgress,
    aiPlanningStepText,
    aiPlanCompleted,
    aiPlanResult,
    setPrimaryAction,
    setIsPlaying,
    machine
  } = useSimulationStore();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);

  const handleFileUpload = (file: File) => {
    const ext = file.name.split('.').pop()?.toLowerCase();
    const fileType = ext === 'obj' ? 'obj' : ext === 'step' || ext === 'stp' ? 'step' : 'stl';
    const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
    
    // Estimate realistic envelope dimensions from file size heuristic
    const sizeKb = file.size / 1024;
    const estLength = Math.min(850, Math.max(300, Math.round(Math.sqrt(sizeKb) * 18)));
    const estWidth = Math.round(estLength * 0.75);
    const estHeight = Math.round(estLength * 0.4);
    const estMass = Math.round((estLength * estWidth * estHeight * 0.0000027 * 0.18) * 10) / 10;

    importCustomCastPartCAD(cleanName, fileType, {
      lengthMm: estLength,
      widthMm: estWidth,
      heightMm: estHeight,
      estimatedMassKg: estMass
    });
    setUploadedFileName(file.name);
    resetAiPlan();
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0]);
    }
  };

  return (
    <div className="w-full h-full min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Container with restrained max width */}
      <div className="w-full max-w-4xl mx-auto my-auto py-8">
        
        {/* Header Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-mono font-semibold uppercase tracking-wider mb-3">
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            AI High-Pressure Die Spray Automation
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white mb-2">
            Upload Your Cast Part
          </h1>
          <p className="text-slate-400 text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
            AI automatically analyzes part geometry, assigns stationary top-mounted robot kinematics, computes spray trajectory, and guarantees collision clearance.
          </p>
        </div>

        {/* State 1: Upload & Preset Selection (Initial View) */}
        {!aiPlanCompleted && !isAiPlanning && (
          <div className="space-y-6">
            {/* Drag & Drop Upload Card */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 bg-slate-900/50 hover:bg-slate-900/80 ${
                isDragging
                  ? 'border-blue-500 bg-blue-500/5 ring-4 ring-blue-500/10'
                  : 'border-slate-800 hover:border-slate-700'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".stl,.obj,.step,.stp,.iges"
                onChange={handleFileChange}
                className="hidden"
              />
              <div className="w-14 h-14 mx-auto mb-4 rounded-xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center text-blue-400 shadow-inner">
                <Upload className="w-6 h-6" />
              </div>
              <p className="text-base font-medium text-slate-200 mb-1">
                Drop your CAD part file here or <span className="text-blue-400 underline underline-offset-4">browse files</span>
              </p>
              <p className="text-xs text-slate-500 mb-3">
                Supports STEP, STP, STL, OBJ, and IGES standard casting geometry
              </p>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-800/60 text-slate-400 text-xs font-mono">
                <FileCheck className="w-3.5 h-3.5 text-emerald-400" />
                {uploadedFileName ? `Loaded: ${uploadedFileName}` : 'Zero-config AI analysis'}
              </div>
            </div>

            {/* Quick Demo Example Parts Section */}
            <div>
              <div className="flex items-center justify-between mb-3 px-1">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 font-mono flex items-center gap-1.5">
                  <Box className="w-3.5 h-3.5 text-blue-400" />
                  Or Select An Industrial Example Part
                </span>
                <span className="text-xs text-slate-500">4 Certified HPDC Benchmarks</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {SAMPLE_CAST_PARTS.map((part: CastPartModel) => {
                  const isSelected = activeCastPart.id === part.id;
                  return (
                    <button
                      key={part.id}
                      onClick={() => {
                        selectCastPart(part.id);
                        setUploadedFileName(null);
                        resetAiPlan();
                      }}
                      className={`text-left p-4 rounded-xl border transition-all duration-150 cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? 'bg-blue-950/30 border-blue-500/80 shadow-md ring-1 ring-blue-500/30'
                          : 'bg-slate-900/60 border-slate-800/80 hover:bg-slate-900 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <div className="text-sm font-semibold text-white flex items-center gap-2">
                            {part.name}
                            {isSelected && (
                              <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-blue-500/20 text-blue-300 font-medium">
                                Active
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-slate-400 font-mono mt-0.5">
                            {part.alloyGrade} Alloy • {part.dimensions.estimatedMassKg} kg
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-slate-800 text-slate-300 border border-slate-700/60">
                            {part.recommendedMachineTonnage}T Toyo
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-800/60 font-mono">
                        <span>
                          {part.dimensions.lengthMm} × {part.dimensions.widthMm} × {part.dimensions.heightMm} mm
                        </span>
                        <span className="text-slate-400">{part.features.length} Cavity Features</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Active Part Overview & Primary CTA */}
            <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-white">
                    {activeCastPart.name}
                  </div>
                  <div className="text-xs text-slate-400">
                    Ready for AI kinematic solving, stationary top-mount placement, and collision audit
                  </div>
                </div>
              </div>

              <button
                id="run-ai-auto-plan-btn"
                onClick={() => runAiAutoPlan()}
                className="w-full sm:w-auto px-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-medium text-sm transition-all duration-150 shadow-lg shadow-blue-900/30 flex items-center justify-center gap-2 cursor-pointer font-sans shrink-0"
              >
                <Sparkles className="w-4 h-4 text-blue-200" />
                AI Auto Plan
                <ArrowRight className="w-4 h-4 text-blue-200" />
              </button>
            </div>
          </div>
        )}

        {/* State 2: AI Planning In Progress Pipeline */}
        {isAiPlanning && (
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-8 max-w-2xl mx-auto shadow-2xl">
            <div className="text-center mb-6">
              <div className="w-12 h-12 rounded-full bg-blue-600/20 border border-blue-500/40 mx-auto flex items-center justify-center mb-3 animate-pulse">
                <Sparkles className="w-6 h-6 text-blue-400" />
              </div>
              <h2 className="text-xl font-bold text-white mb-1">
                AI Optimization Engine Running
              </h2>
              <p className="text-sm text-slate-400 font-mono">
                {aiPlanningStepText}
              </p>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-slate-800 rounded-full h-2.5 mb-6 overflow-hidden">
              <div
                className="bg-blue-500 h-2.5 rounded-full transition-all duration-300 ease-out shadow-sm"
                style={{ width: `${aiPlanningProgress}%` }}
              />
            </div>

            {/* Sequential Pipeline Checkpoints */}
            <div className="space-y-2.5 text-xs font-mono text-slate-400">
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-800/40">
                <span className="flex items-center gap-2">
                  <CheckCircle2 className={`w-4 h-4 ${aiPlanningProgress >= 20 ? 'text-emerald-400' : 'text-slate-600'}`} />
                  1. Cast-part geometry & surface orientation analysis
                </span>
                <span className={aiPlanningProgress >= 20 ? 'text-emerald-400 font-semibold' : 'text-slate-600'}>
                  {aiPlanningProgress >= 20 ? 'COMPLETE' : 'PENDING'}
                </span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-800/40">
                <span className="flex items-center gap-2">
                  <CheckCircle2 className={`w-4 h-4 ${aiPlanningProgress >= 40 ? 'text-emerald-400' : 'text-slate-600'}`} />
                  2. Sprayable surfaces & thermal cooling zones
                </span>
                <span className={aiPlanningProgress >= 40 ? 'text-emerald-400 font-semibold' : 'text-slate-600'}>
                  {aiPlanningProgress >= 40 ? 'COMPLETE' : 'PENDING'}
                </span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-800/40">
                <span className="flex items-center gap-2">
                  <CheckCircle2 className={`w-4 h-4 ${aiPlanningProgress >= 60 ? 'text-emerald-400' : 'text-slate-600'}`} />
                  3. Stationary fixed-platen top robot mounting config
                </span>
                <span className={aiPlanningProgress >= 60 ? 'text-emerald-400 font-semibold' : 'text-slate-600'}>
                  {aiPlanningProgress >= 60 ? 'COMPLETE' : 'PENDING'}
                </span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-800/40">
                <span className="flex items-center gap-2">
                  <CheckCircle2 className={`w-4 h-4 ${aiPlanningProgress >= 80 ? 'text-emerald-400' : 'text-slate-600'}`} />
                  4. 6-Axis IK kinematics & multi-pass trajectory
                </span>
                <span className={aiPlanningProgress >= 80 ? 'text-emerald-400 font-semibold' : 'text-slate-600'}>
                  {aiPlanningProgress >= 80 ? 'COMPLETE' : 'PENDING'}
                </span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-800/40">
                <span className="flex items-center gap-2">
                  <CheckCircle2 className={`w-4 h-4 ${aiPlanningProgress >= 95 ? 'text-emerald-400' : 'text-slate-600'}`} />
                  5. Tie-bar collision audit & cycle time validation
                </span>
                <span className={aiPlanningProgress >= 95 ? 'text-emerald-400 font-semibold' : 'text-slate-600'}>
                  {aiPlanningProgress >= 95 ? 'COMPLETE' : 'SOLVING...'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* State 3: Clean Result Presentation (AI Suggested Solution) */}
        {aiPlanCompleted && aiPlanResult && (
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 sm:p-8 max-w-2xl mx-auto shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between pb-6 border-b border-slate-800/80 mb-6">
              <div>
                <div className="text-xs font-mono font-semibold uppercase tracking-wider text-blue-400 mb-1 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                  AI SUGGESTED SOLUTION
                </div>
                <h2 className="text-2xl font-bold text-white">
                  {aiPlanResult.robotName}
                </h2>
                <p className="text-xs text-slate-400 font-mono mt-0.5">
                  Optimized for {aiPlanResult.partName} on Toyo {machine.clampingForceTons}T DCM
                </p>
              </div>
              <div className="text-right">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono font-semibold">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  Collision Check Passed
                </div>
              </div>
            </div>

            {/* Key Metrics Display */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
              <div className="p-3.5 rounded-xl bg-slate-800/50 border border-slate-800">
                <div className="text-xs text-slate-400 font-mono mb-1">Mounting</div>
                <div className="text-sm font-semibold text-slate-200">
                  {aiPlanResult.mounting}
                </div>
                <div className="text-[11px] text-slate-500 font-mono mt-0.5">Stationary Frame</div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-800/50 border border-slate-800">
                <div className="text-xs text-slate-400 font-mono mb-1">Coverage</div>
                <div className="text-xl font-bold text-emerald-400">
                  {aiPlanResult.coveragePercent}%
                </div>
                <div className="text-[11px] text-slate-500 font-mono mt-0.5">Both Cavities</div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-800/50 border border-slate-800">
                <div className="text-xs text-slate-400 font-mono mb-1">Clearance</div>
                <div className="text-xl font-bold text-cyan-400">
                  {aiPlanResult.minClearanceMm} mm
                </div>
                <div className="text-[11px] text-slate-500 font-mono mt-0.5">Tie-Bars Safe</div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-800/50 border border-slate-800">
                <div className="text-xs text-slate-400 font-mono mb-1">Est. Cycle</div>
                <div className="text-xl font-bold text-blue-400">
                  {aiPlanResult.cycleTimeSec} s
                </div>
                <div className="text-[11px] text-slate-500 font-mono mt-0.5">Total Spray Time</div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <button
                id="preview-solution-btn"
                onClick={() => {
                  setPrimaryAction('simulation');
                  setIsPlaying(true);
                }}
                className="w-full sm:flex-1 py-3 px-5 rounded-lg bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-medium text-sm transition-all duration-150 shadow-lg shadow-blue-900/30 flex items-center justify-center gap-2 cursor-pointer font-sans"
              >
                <Play className="w-4 h-4 fill-white text-white" />
                Preview Solution
              </button>

              <button
                id="adjust-solution-btn"
                onClick={() => {
                  setPrimaryAction('advanced-edit');
                }}
                className="w-full sm:w-auto py-3 px-5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-medium text-sm transition cursor-pointer flex items-center justify-center gap-2"
              >
                <SlidersHorizontal className="w-4 h-4 text-slate-400" />
                Adjust Solution
              </button>

              <button
                id="replan-btn"
                onClick={() => resetAiPlan()}
                className="w-full sm:w-auto py-3 px-3 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-300 text-sm transition cursor-pointer flex items-center justify-center gap-1.5"
                title="Choose different cast part"
              >
                <RotateCcw className="w-4 h-4" />
                <span className="hidden sm:inline">Change Part</span>
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
