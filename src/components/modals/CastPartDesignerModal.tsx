import React, { useState } from 'react';
import {
  Cpu,
  Layers,
  Sparkles,
  Bot,
  Factory,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  Maximize2,
  ShieldCheck,
  Scale,
  ArrowRight,
  Upload,
  FileCode,
  Crosshair,
  Gauge,
  ThermometerSnowflake,
  Timer,
  Eye,
  Sliders,
  X,
  Play,
  Check,
  Building2
} from 'lucide-react';
import { useSimulationStore } from '../../store/simulationStore';
import { SAMPLE_CAST_PARTS } from '../../utils/castPartPresets';
import { CastPartModel, GripCandidate, CellDesignOption } from '../../types/castPart';

export const CastPartDesignerModal: React.FC = () => {
  const {
    isCastPartDesignerOpen,
    setIsCastPartDesignerOpen,
    activeCastPart,
    castPartAnalysis,
    selectedOptionId,
    selectedGripCandidateId,
    castPartWorkflowTab,
    setCastPartWorkflowTab,
    selectCastPart,
    importCustomCastPartCAD,
    selectGripCandidate,
    selectCellOption,
    toggleProcessStep,
    applyCellDesignToSimulation
  } = useSimulationStore();

  // Custom CAD Dimension state if user enters manual specs
  const [manualName, setManualName] = useState('Custom Cast Aluminum Housing');
  const [manualLength, setManualLength] = useState(520);
  const [manualWidth, setManualWidth] = useState(460);
  const [manualHeight, setManualHeight] = useState(160);
  const [manualMass, setManualMass] = useState(9.5);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);

  if (!isCastPartDesignerOpen) return null;

  const currentOption = castPartAnalysis.cellOptions.find(o => o.id === selectedOptionId) || castPartAnalysis.cellOptions[0];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFileName(file.name);
      importCustomCastPartCAD(file.name, file.name.endsWith('.step') || file.name.endsWith('.stp') ? 'step' : 'stl', {
        lengthMm: manualLength,
        widthMm: manualWidth,
        heightMm: manualHeight,
        estimatedMassKg: manualMass
      });
    }
  };

  const handleApplyDesign = () => {
    applyCellDesignToSimulation(selectedOptionId);
    setIsCastPartDesignerOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-slate-950 border border-slate-800 rounded-2xl w-full max-w-6xl max-h-[92vh] flex flex-col shadow-2xl shadow-blue-500/10 overflow-hidden text-slate-100">
        
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-900 via-slate-950 to-blue-950/40 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/25">
              <Sparkles className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-tight">
                  Cast-Part-Driven Automation Designer
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  AUTONOMOUS HPDC CELL SYNTHESIZER
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Provide cast part geometry &rarr; Simulator understands the part &rarr; Simulator proposes complete automation cell
              </p>
            </div>
          </div>

          <button
            id="close-cast-part-designer-modal"
            onClick={() => setIsCastPartDesignerOpen(false)}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="px-6 py-2 bg-slate-900/90 border-b border-slate-800 flex items-center gap-2 overflow-x-auto select-none shrink-0">
          {[
            { id: 'select', label: '1. Select Cast Part', icon: Layers },
            { id: 'analyze', label: '2. Geometry & Confidence', icon: Crosshair },
            { id: 'gripping', label: '3. Grip Candidate Analysis', icon: Bot },
            { id: 'process', label: '4. Manufacturing Operations', icon: Factory },
            { id: 'cell_options', label: '5. Proposed Cell Options', icon: Building2 },
            { id: 'score', label: '6. 8-Factor Cell Scoring', icon: Gauge },
            { id: 'rationale', label: '7. "Why This Cell?" Rationale', icon: HelpCircle }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = castPartWorkflowTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`cast-part-tab-${tab.id}`}
                onClick={() => setCastPartWorkflowTab(tab.id as any)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm ring-1 ring-blue-400/40'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Modal Main Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* TAB 1: SELECT / IMPORT CAST PART */}
          {castPartWorkflowTab === 'select' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-bold text-white mb-1">
                  Select Cast Part from Taiwanese Foundry Reference Library or Import Custom CAD
                </h3>
                <p className="text-xs text-slate-400">
                  The simulator extracts volumetric projections, parting lines, extraction draw strokes, and thermal mass directly from the part model.
                </p>
              </div>

              {/* Preset Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {SAMPLE_CAST_PARTS.map(part => {
                  const isSelected = activeCastPart.id === part.id;
                  return (
                    <div
                      key={part.id}
                      onClick={() => selectCastPart(part.id)}
                      className={`p-4 rounded-xl border transition cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? 'bg-blue-950/40 border-blue-500 ring-1 ring-blue-500/50 shadow-md shadow-blue-500/10'
                          : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-cyan-400 border border-slate-700 uppercase">
                            {part.category}
                          </span>
                          <span className="text-[11px] font-mono text-amber-400 font-bold">
                            {part.recommendedMachineTonnage}T DCM Req.
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-white leading-snug">
                          {part.name}
                        </h4>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {part.taiwaneseIndustryName}
                        </p>
                        <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] font-mono bg-slate-950/80 p-2 rounded-lg border border-slate-800/80">
                          <div>
                            <span className="text-slate-500">Bounding:</span>
                            <p className="text-slate-200">{part.dimensions.lengthMm} &times; {part.dimensions.widthMm} &times; {part.dimensions.heightMm} mm</p>
                          </div>
                          <div>
                            <span className="text-slate-500">Part Mass:</span>
                            <p className="text-slate-200">{part.dimensions.estimatedMassKg} kg ({part.alloyGrade.split('/')[0]})</p>
                          </div>
                        </div>
                      </div>

                      <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
                        <span className="text-slate-400 text-[11px]">{part.gripCandidates.length} Grip Candidates Identified</span>
                        {isSelected ? (
                          <span className="text-blue-400 font-bold flex items-center gap-1">
                            <Check className="w-3.5 h-3.5" /> Selected
                          </span>
                        ) : (
                          <span className="text-slate-500 hover:text-slate-300">Click to Select</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Custom CAD / Bounding Input Accordion */}
              <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Upload className="w-4 h-4 text-blue-400" />
                    <h4 className="text-xs font-bold text-white uppercase tracking-wide">
                      Upload Custom CAD (STEP / STL / OBJ) or Enter Bounding Dimensions
                    </h4>
                  </div>
                  {uploadedFileName && (
                    <span className="text-[11px] text-emerald-400 font-mono flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> {uploadedFileName}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Part Name</label>
                    <input
                      type="text"
                      value={manualName}
                      onChange={e => setManualName(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Dimensions (L &times; W &times; H mm)</label>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        value={manualLength}
                        onChange={e => setManualLength(Number(e.target.value))}
                        className="w-1/3 bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-white font-mono"
                        placeholder="L"
                      />
                      <input
                        type="number"
                        value={manualWidth}
                        onChange={e => setManualWidth(Number(e.target.value))}
                        className="w-1/3 bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-white font-mono"
                        placeholder="W"
                      />
                      <input
                        type="number"
                        value={manualHeight}
                        onChange={e => setManualHeight(Number(e.target.value))}
                        className="w-1/3 bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-white font-mono"
                        placeholder="H"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Estimated Net Mass (kg)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={manualMass}
                      onChange={e => setManualMass(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono"
                    />
                  </div>
                  <div className="flex items-end gap-2">
                    <label className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold cursor-pointer border border-slate-700 transition">
                      <Upload className="w-3.5 h-3.5 text-blue-400" />
                      <span>Choose CAD File</span>
                      <input type="file" accept=".stl,.step,.stp,.obj" onChange={handleFileUpload} className="hidden" />
                    </label>
                    <button
                      onClick={() => {
                        importCustomCastPartCAD(manualName, 'stl', {
                          lengthMm: manualLength,
                          widthMm: manualWidth,
                          heightMm: manualHeight,
                          estimatedMassKg: manualMass
                        });
                      }}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition cursor-pointer"
                    >
                      Synthesize
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setCastPartWorkflowTab('analyze')}
                  className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold shadow-md shadow-blue-500/20 transition cursor-pointer"
                >
                  <span>Continue to Geometry & Confidence Analysis</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: GEOMETRY & CONFIDENCE REPORT */}
          {castPartWorkflowTab === 'analyze' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white mb-1">
                    Automated Geometry Feature Extraction & 3-Tier Confidence Report
                  </h3>
                  <p className="text-xs text-slate-400">
                    Distinguishing what is derived from CAD geometry, inferred for automation, and what requires engineer confirmation.
                  </p>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-mono text-[10px]">
                    FACT: {castPartAnalysis.confidenceItems.filter(i => i.tier === 'GEOMETRY_DERIVED_FACT').length}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30 font-mono text-[10px]">
                    INFERRED: {castPartAnalysis.confidenceItems.filter(i => i.tier === 'AUTOMATION_INFERENCE').length}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30 font-mono text-[10px]">
                    CONFIRMATION: {castPartAnalysis.confidenceItems.filter(i => i.tier === 'ENGINEER_CONFIRMATION_REQUIRED').length}
                  </span>
                </div>
              </div>

              {/* Confidence Matrix Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                
                {/* 1. Geometry-Derived Facts */}
                <div className="p-4 bg-emerald-950/20 border border-emerald-500/30 rounded-xl space-y-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <h4 className="text-xs font-bold text-emerald-300 uppercase tracking-wide">
                      Geometry-Derived Facts
                    </h4>
                  </div>
                  <p className="text-[11px] text-emerald-200/70">
                    Calculated mathematically from part mesh boundaries, solid volume, and projections.
                  </p>

                  <div className="space-y-2">
                    {castPartAnalysis.confidenceItems
                      .filter(item => item.tier === 'GEOMETRY_DERIVED_FACT')
                      .map(item => (
                        <div key={item.key} className="p-2.5 bg-slate-900/80 rounded-lg border border-slate-800 text-xs">
                          <div className="flex items-center justify-between font-mono">
                            <span className="text-slate-400">{item.label}:</span>
                            <span className="text-white font-bold">{item.value}</span>
                          </div>
                          <p className="text-[11px] text-slate-400 mt-1">{item.rationale}</p>
                        </div>
                      ))}
                  </div>
                </div>

                {/* 2. Automation Inferences */}
                <div className="p-4 bg-blue-950/20 border border-blue-500/30 rounded-xl space-y-3">
                  <div className="flex items-center gap-2">
                    <Bot className="w-4 h-4 text-blue-400" />
                    <h4 className="text-xs font-bold text-blue-300 uppercase tracking-wide">
                      Automation Inferences
                    </h4>
                  </div>
                  <p className="text-[11px] text-blue-200/70">
                    Determined algorithmically using Taiwanese HPDC foundry tooling standards.
                  </p>

                  <div className="space-y-2">
                    {castPartAnalysis.confidenceItems
                      .filter(item => item.tier === 'AUTOMATION_INFERENCE')
                      .map(item => (
                        <div key={item.key} className="p-2.5 bg-slate-900/80 rounded-lg border border-slate-800 text-xs">
                          <div className="flex items-center justify-between font-mono">
                            <span className="text-slate-400">{item.label}:</span>
                            <span className="text-blue-300 font-bold">{item.value}</span>
                          </div>
                          <p className="text-[11px] text-slate-400 mt-1">{item.rationale}</p>
                        </div>
                      ))}
                  </div>
                </div>

                {/* 3. Engineer Confirmation Required */}
                <div className="p-4 bg-amber-950/20 border border-amber-500/30 rounded-xl space-y-3">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                    <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wide">
                      Engineer Confirmation Required
                    </h4>
                  </div>
                  <p className="text-[11px] text-amber-200/70">
                    High-risk manufacturing boundaries requiring sign-off by tooling engineers.
                  </p>

                  <div className="space-y-2">
                    {castPartAnalysis.confidenceItems
                      .filter(item => item.tier === 'ENGINEER_CONFIRMATION_REQUIRED')
                      .map(item => (
                        <div key={item.key} className="p-2.5 bg-slate-900/80 rounded-lg border border-slate-800 text-xs">
                          <div className="flex items-center justify-between font-mono">
                            <span className="text-slate-400">{item.label}:</span>
                            <span className="text-amber-300 font-bold">{item.value}</span>
                          </div>
                          <p className="text-[11px] text-slate-400 mt-1">{item.rationale}</p>
                        </div>
                      ))}
                  </div>
                </div>

              </div>

              <div className="flex justify-between pt-2">
                <button
                  onClick={() => setCastPartWorkflowTab('select')}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold"
                >
                  Back
                </button>
                <button
                  onClick={() => setCastPartWorkflowTab('gripping')}
                  className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold shadow-md shadow-blue-500/20"
                >
                  <span>Evaluate Grip Candidates</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: GRIP CANDIDATE ANALYSIS */}
          {castPartWorkflowTab === 'gripping' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-bold text-white mb-1">
                  Robot Extractor Gripping Candidate Evaluation
                </h3>
                <p className="text-xs text-slate-400">
                  Select a candidate gripping location. The simulator checks die daylight clearance, thermal stability, and cosmetic marring risk.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {activeCastPart.gripCandidates.map(cand => {
                  const isSelected = cand.id === selectedGripCandidateId;
                  const isRecommended = cand.status === 'RECOMMENDED';
                  const isAcceptable = cand.status === 'ACCEPTABLE';

                  return (
                    <div
                      key={cand.id}
                      onClick={() => selectGripCandidate(cand.id)}
                      className={`p-4 rounded-xl border transition cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? 'bg-blue-950/40 border-blue-500 ring-1 ring-blue-500/50 shadow-lg'
                          : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${
                              isRecommended ? 'bg-emerald-500 text-slate-950' : isAcceptable ? 'bg-amber-500 text-slate-950' : 'bg-rose-500 text-white'
                            }`}>
                              {cand.label}
                            </span>
                            <span className="text-xs font-bold text-white">{cand.name}</span>
                          </div>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            isRecommended ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                            isAcceptable ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                            'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          }`}>
                            {cand.status}
                          </span>
                        </div>

                        <p className="text-xs text-slate-300 mt-2">
                          {cand.description}
                        </p>

                        {/* Scores & Clearances */}
                        <div className="mt-4 space-y-2 bg-slate-950/80 p-3 rounded-lg border border-slate-800 text-xs font-mono">
                          <div className="flex justify-between items-center">
                            <span className="text-slate-400">Clearance Score:</span>
                            <span className="text-cyan-400 font-bold">{cand.clearanceScore} / 100</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-slate-400">Stability Score:</span>
                            <span className="text-emerald-400 font-bold">{cand.stabilityScore} / 100</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-slate-400">Cosmetic Defect Risk:</span>
                            <span className={`font-bold ${
                              cand.cosmeticRisk === 'LOW' ? 'text-emerald-400' :
                              cand.cosmeticRisk === 'MEDIUM' ? 'text-amber-400' : 'text-rose-400'
                            }`}>
                              {cand.cosmeticRisk} RISK
                            </span>
                          </div>
                          <div className="flex justify-between items-center pt-1 border-t border-slate-800">
                            <span className="text-slate-400">Recommended EOAT:</span>
                            <span className="text-slate-200 capitalize">{cand.recommendedEoatType.replace('_', ' ')}</span>
                          </div>
                        </div>

                        {/* Mitigation */}
                        <div className="mt-3 p-2 bg-slate-900 rounded border border-slate-800 text-[11px] text-slate-400">
                          <span className="text-amber-300 font-semibold">Recommended Tooling: </span>
                          {cand.mitigation}
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                        <span className="text-slate-400 text-[11px]">Jaw Span: {cand.gripWidthMm} mm</span>
                        {isSelected ? (
                          <span className="text-blue-400 font-bold flex items-center gap-1">
                            <Check className="w-3.5 h-3.5" /> Active in 3D
                          </span>
                        ) : (
                          <span className="text-slate-500 hover:text-slate-300">Select Gripping</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-between pt-2">
                <button
                  onClick={() => setCastPartWorkflowTab('analyze')}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold"
                >
                  Back
                </button>
                <button
                  onClick={() => setCastPartWorkflowTab('process')}
                  className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold shadow-md shadow-blue-500/20"
                >
                  <span>Verify Manufacturing Operations</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* TAB 4: PROCESS INTENT CHECKLIST */}
          {castPartWorkflowTab === 'process' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-bold text-white mb-1">
                  Manufacturing Process Intent & Sequence Allocation
                </h3>
                <p className="text-xs text-slate-400">
                  Toggle downstream operations required for this cast part. The cell generator automatically routes conveyors, robots, and stations.
                </p>
              </div>

              <div className="space-y-2">
                {activeCastPart.suggestedProcess.map(step => (
                  <div
                    key={step.id}
                    onClick={() => toggleProcessStep(step.id)}
                    className={`p-3.5 rounded-xl border flex items-center justify-between transition cursor-pointer ${
                      step.enabled
                        ? 'bg-slate-900/80 border-slate-700 text-slate-100'
                        : 'bg-slate-950/40 border-slate-900 text-slate-500 opacity-60'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded flex items-center justify-center border ${
                        step.enabled ? 'bg-blue-600 border-blue-500 text-white' : 'border-slate-700 bg-slate-900'
                      }`}>
                        {step.enabled && <Check className="w-3.5 h-3.5" />}
                      </div>
                      <span className="text-xs font-mono text-slate-400 w-6">#{step.order}</span>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-bold text-white">{step.name}</h4>
                          <span className="px-1.5 py-0.2 rounded text-[10px] bg-slate-800 text-slate-300 border border-slate-700 font-mono">
                            {step.stationName}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5">{step.description}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-xs font-mono">
                      <span className="text-slate-400">Takt: <strong className="text-emerald-400">{step.cycleTimeSec}s</strong></span>
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] text-slate-400 border border-slate-700">
                        {step.equipmentRequired}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-between pt-2">
                <button
                  onClick={() => setCastPartWorkflowTab('gripping')}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold"
                >
                  Back
                </button>
                <button
                  onClick={() => setCastPartWorkflowTab('cell_options')}
                  className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold shadow-md shadow-blue-500/20"
                >
                  <span>Synthesize Cell Options</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* TAB 5: CELL OPTIONS GENERATION */}
          {castPartWorkflowTab === 'cell_options' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-bold text-white mb-1">
                  Proposed Automation Cell Architectures
                </h3>
                <p className="text-xs text-slate-400">
                  The synthesizer generated 3 viable foundry layout archetypes tailored to {activeCastPart.name}.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {castPartAnalysis.cellOptions.map(opt => {
                  const isSelected = opt.id === selectedOptionId;
                  return (
                    <div
                      key={opt.id}
                      onClick={() => selectCellOption(opt.id)}
                      className={`p-4 rounded-xl border transition cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? 'bg-blue-950/40 border-blue-500 ring-2 ring-blue-500/60 shadow-xl'
                          : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-cyan-400 border border-slate-700 uppercase">
                            {opt.id.replace('option_', '').replace('_', ' ')}
                          </span>
                          <span className="text-xs font-mono font-bold text-emerald-400">
                            Score: {opt.scores.overallScore} / 100
                          </span>
                        </div>

                        <h4 className="text-sm font-bold text-white">{opt.title}</h4>
                        <p className="text-xs text-slate-300 mt-1">{opt.tagline}</p>

                        {/* Specs */}
                        <div className="mt-4 space-y-2 bg-slate-950/80 p-3 rounded-lg border border-slate-800 text-xs font-mono">
                          <div className="flex justify-between items-center">
                            <span className="text-slate-400">Cycle Time:</span>
                            <span className="text-amber-400 font-bold">{opt.cycleTimeTotalSec}s / shot</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-slate-400">Throughput:</span>
                            <span className="text-white font-bold">{opt.throughputPph} parts/hr</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-slate-400">Footprint:</span>
                            <span className="text-slate-300">{opt.cellFootprintMeters[0]} &times; {opt.cellFootprintMeters[1]} m</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-slate-400">Spray Robot:</span>
                            <span className="text-cyan-400">{opt.sprayRobot.robotName} ({opt.sprayRobot.mounting})</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-slate-400">Extractor:</span>
                            <span className="text-slate-200">{opt.extractorRobot.robotName}</span>
                          </div>
                        </div>

                        <div className="mt-3 text-[11px] text-slate-400">
                          <strong className="text-slate-300">Downstream: </strong>
                          {opt.downstreamEquipment.map(d => d.name).join(', ')}
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                        <span className="text-slate-500 font-mono text-[11px]">{opt.budgetCategory.toUpperCase()} CAPEX</span>
                        {isSelected ? (
                          <span className="text-blue-400 font-bold flex items-center gap-1">
                            <Check className="w-3.5 h-3.5" /> Selected Option
                          </span>
                        ) : (
                          <span className="text-slate-400 hover:text-white">Choose This Option</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-between pt-2">
                <button
                  onClick={() => setCastPartWorkflowTab('process')}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold"
                >
                  Back
                </button>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCastPartWorkflowTab('score')}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold"
                  >
                    Inspect 8-Factor Score
                  </button>
                  <button
                    id="apply-cell-design-btn"
                    onClick={handleApplyDesign}
                    className="flex items-center gap-1.5 px-5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-lg text-xs font-bold shadow-lg shadow-blue-500/25 cursor-pointer"
                  >
                    <Play className="w-4 h-4 fill-white" />
                    <span>APPLY TO 3D DIGITAL TWIN & SIMULATE</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: 8-FACTOR CELL SCORING */}
          {castPartWorkflowTab === 'score' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white mb-1">
                    8-Factor Automation Engineering Scoring ({currentOption.title})
                  </h3>
                  <p className="text-xs text-slate-400">
                    Comprehensive multi-objective verification against Taiwanese foundry operational standards.
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-bold font-mono text-emerald-400">
                    {currentOption.scores.overallScore}
                  </span>
                  <span className="text-xs text-slate-400"> / 100 Overall</span>
                </div>
              </div>

              {/* 8 Factor Bars */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { label: 'Reachability & Joint Margin', score: currentOption.scores.reachabilityScore, desc: 'Avoids wrist singuarities and axis limits during die penetration.' },
                  { label: 'Die Clearance & Collision Safety', score: currentOption.scores.clearanceSafetyScore, desc: 'Safe gap around tie bars, ejector pins, and moving platen.' },
                  { label: 'Cycle Time & Takt Adherence', score: currentOption.scores.cycleTimeScore, desc: 'Balance between cooling dwell and maximum machine shots/hour.' },
                  { label: 'Thermal Cooling & Quench Quality', score: currentOption.scores.thermalEfficiencyScore, desc: 'Sufficient heat dissipation to prevent core soldering.' },
                  { label: 'Footprint & Factory Integration', score: currentOption.scores.footprintScore, desc: 'Efficient layout fit within typical Taiwanese plant bays.' },
                  { label: 'Cosmetic Surface Protection', score: currentOption.scores.cosmeticProtectionScore, desc: 'Grip pressure and clamp placement preserves Class-A surfaces.' },
                  { label: 'Foundry Standard Compliance', score: currentOption.scores.taiwaneseStandardCompliance, desc: 'Interlock wiring, CE/safety fence, and grease lubrication standard.' },
                  { label: 'Capital Efficiency (ROI)', score: currentOption.scores.capexRoiScore, desc: 'Return on automation investment within 14-18 months.' }
                ].map(factor => (
                  <div key={factor.label} className="p-3.5 bg-slate-900/60 rounded-xl border border-slate-800 space-y-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-slate-200">{factor.label}</span>
                      <span className="font-mono font-bold text-cyan-400">{factor.score} / 100</span>
                    </div>
                    <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full transition-all duration-500"
                        style={{ width: `${factor.score}%` }}
                      />
                    </div>
                    <p className="text-[11px] text-slate-400">{factor.desc}</p>
                  </div>
                ))}
              </div>

              <div className="flex justify-between pt-2">
                <button
                  onClick={() => setCastPartWorkflowTab('cell_options')}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold"
                >
                  Back
                </button>
                <button
                  onClick={() => setCastPartWorkflowTab('rationale')}
                  className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold shadow-md shadow-blue-500/20"
                >
                  <span>Read "Why This Cell?" Rationale</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* TAB 7: WHY THIS CELL RATIONALE */}
          {castPartWorkflowTab === 'rationale' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-bold text-white mb-1">
                  Plain-Language Engineering Rationale & Synthesis Justification
                </h3>
                <p className="text-xs text-slate-400">
                  Why this specific machine tonnage, robot mounting, and tooling were selected for {activeCastPart.name}.
                </p>
              </div>

              <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl text-xs text-slate-300 leading-relaxed font-sans">
                <h4 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-blue-400" />
                  Executive Cell Synthesis Rationale
                </h4>
                <p>{currentOption.plainLanguageRationale}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {currentOption.whyReasons.map((reason, idx) => (
                  <div key={idx} className="p-3.5 bg-slate-900/60 rounded-xl border border-slate-800 space-y-1">
                    <div className="flex items-center gap-2 text-xs font-bold text-white">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>{reason.category}</span>
                    </div>
                    <p className="text-xs text-slate-300 font-semibold">{reason.recommendation}</p>
                    <p className="text-[11px] text-slate-400">{reason.rationale}</p>
                  </div>
                ))}
              </div>

              <div className="flex justify-between pt-2">
                <button
                  onClick={() => setCastPartWorkflowTab('score')}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold"
                >
                  Back
                </button>
                <button
                  onClick={handleApplyDesign}
                  className="flex items-center gap-1.5 px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-lg text-xs font-bold shadow-lg shadow-blue-500/25 cursor-pointer"
                >
                  <Play className="w-4 h-4 fill-white" />
                  <span>APPLY TO 3D DIGITAL TWIN & SIMULATE</span>
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Footer Bar */}
        <div className="px-6 py-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between shrink-0 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-400">Current Part:</span>
            <span className="text-white font-bold">{activeCastPart.name}</span>
            <span className="text-slate-600">|</span>
            <span className="text-slate-400">Selected Layout:</span>
            <span className="text-blue-400 font-bold">{currentOption.title}</span>
          </div>

          <button
            id="modal-apply-quick-btn"
            onClick={handleApplyDesign}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold shadow-md transition cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-white" />
            <span>Apply to Simulation</span>
          </button>
        </div>

      </div>
    </div>
  );
};
