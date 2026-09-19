import React from 'react';
import {
  Factory,
  Compass,
  Bot,
  SprayCan as SprayIcon,
  CheckSquare,
  Flame,
  Wind,
  Layers,
  Sparkles,
  Play,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  Wrench,
  Sliders,
  ChevronDown,
  Info,
  Scale,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  RotateCw,
  RotateCcw as RotateCounterCw,
  Camera,
  Eye,
  Cpu
} from 'lucide-react';
import { useSimulationStore } from '../../store/simulationStore';
import { MACHINE_PRESETS, ROBOT_PRESETS, SPRAY_HEAD_PRESETS } from '../../utils/presets';
import { SAMPLE_CAST_PARTS } from '../../utils/castPartPresets';
import { diagnoseCellProblems } from '../../utils/robotPositionAdvisor';
import { SprayHeadType, RobotMountType } from '../../types/robot';

export const ManufacturingPanel: React.FC = () => {
  const {
    workflowStep,
    setWorkflowStep,
    robotMountConfig,
    setRobotMountType,
    updateRobotMount,
    nudgeRobot,
    rotateRobot,
    sprayIntent,
    setSprayIntent,
    automateSprayPath,
    fixProblemsAutomatically,
    machine,
    setMachine,
    robot,
    setRobot,
    die,
    tool,
    setTool,
    setSprayHeadPreset,
    hotSpots,
    toggleHotSpot,
    updateHotSpotPriority,
    sprayDistanceStatus,
    coverageStats,
    trajectoryPlan,
    collisionResult,
    waypoints,
    isPlaying,
    setIsPlaying,
    resetSimulation,
    setIsBestPositionAdvisorOpen,
    setIsScenarioCompareOpen,
    isReferenceModalOpen,
    setIsReferenceModalOpen,
    topMountStyle,
    setTopMountStyle,
    showDualRobots,
    setShowDualRobots,
    applyWollinTopMountPreset,
    activeCastPart,
    castPartAnalysis,
    selectedOptionId,
    selectedGripCandidateId,
    setIsCastPartDesignerOpen,
    selectCastPart,
    selectGripCandidate,
    selectCellOption,
    applyCellDesignToSimulation
  } = useSimulationStore();

  const problems = diagnoseCellProblems(robot, machine, die, waypoints);
  const actionableProblems = problems.filter(p => p.issueType !== 'optimal');
  const isHealthy = actionableProblems.length === 0;

  return (
    <aside className="w-80 h-full bg-slate-900 border-r border-slate-800 flex flex-col z-10 shrink-0 text-slate-200 select-none overflow-y-auto divide-y divide-slate-800 scrollbar-thin">
      {/* 1. Header Banner */}
      <div className="p-3 bg-slate-950/90 flex items-center justify-between">
        <div>
          <div className="text-xs font-bold text-white flex items-center gap-1.5">
            <span>HPDC Automation Cell Designer</span>
            <span className="px-1.5 py-0.2 text-[9px] font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded">
              Manufacturing Mode
            </span>
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5">
            Automatic robotics planning for die casting engineers
          </p>
        </div>
        <button
          id="compare-top-side-panel-btn"
          onClick={() => setIsScenarioCompareOpen(true)}
          className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-semibold rounded border border-slate-700 flex items-center gap-1 cursor-pointer transition"
          title="Compare Top-Mounted vs Side-Mounted Robot performance"
        >
          <Scale className="w-3 h-3 text-cyan-400" />
          <span>Top vs Side</span>
        </button>
      </div>

      {/* 1.5 Step 0: Cast Part & Intelligent Automation Designer */}
      <div className={`p-3 transition ${workflowStep === 0 ? 'bg-amber-950/20 border-b border-amber-500/30' : 'bg-slate-900/80'}`}>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-amber-400" />
            <span>0. Cast Part & Intelligent Designer</span>
          </label>
          <span className="text-[10px] font-mono text-amber-400 bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-800/50">
            {activeCastPart.recommendedMachineTonnage}T Req.
          </span>
        </div>

        {/* Current Part Summary Card */}
        <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-bold text-white text-xs">{activeCastPart.name}</span>
            <span className="text-[10px] font-mono text-cyan-400">{activeCastPart.dimensions.estimatedMassKg} kg</span>
          </div>
          <p className="text-[10.5px] text-slate-400 mt-0.5">{activeCastPart.taiwaneseIndustryName}</p>

          <div className="mt-2 flex items-center justify-between text-[10px] font-mono text-slate-400 pt-1.5 border-t border-slate-900">
            <span>Dim: {activeCastPart.dimensions.lengthMm}×{activeCastPart.dimensions.widthMm}×{activeCastPart.dimensions.heightMm}mm</span>
            <span className="text-emerald-400 font-bold">{activeCastPart.gripCandidates.length} Grips</span>
          </div>
        </div>

        {/* Grip Candidate Quick Toggles */}
        <div className="mt-2">
          <div className="text-[10.5px] font-semibold text-slate-400 mb-1 flex items-center justify-between">
            <span>Extractor Grip Location:</span>
            <span className="text-[9.5px] text-slate-500">Live in 3D</span>
          </div>
          <div className="grid grid-cols-3 gap-1">
            {activeCastPart.gripCandidates.map(cand => {
              const isSelected = cand.id === selectedGripCandidateId;
              return (
                <button
                  key={cand.id}
                  id={`grip-cand-quick-btn-${cand.id}`}
                  onClick={() => selectGripCandidate(cand.id)}
                  className={`px-2 py-1 rounded text-[10px] font-mono font-bold transition cursor-pointer flex items-center justify-center gap-1 ${
                    isSelected
                      ? 'bg-blue-600 text-white shadow-sm ring-1 ring-blue-400'
                      : cand.status === 'RECOMMENDED'
                      ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-800/60 hover:bg-emerald-900/40'
                      : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-slate-200'
                  }`}
                >
                  <span>Grip {cand.label}</span>
                  {cand.status === 'RECOMMENDED' && <span className="text-[8px]">★</span>}
                </button>
              );
            })}
          </div>
        </div>

        {/* Synthesizer Action Buttons */}
        <div className="mt-2.5 flex items-center gap-1.5">
          <button
            id="panel-open-cast-designer-btn"
            onClick={() => setIsCastPartDesignerOpen(true)}
            className="flex-1 py-1.5 px-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-bold rounded-lg text-xs flex items-center justify-center gap-1 shadow-md shadow-amber-500/20 transition cursor-pointer"
          >
            <Cpu className="w-3 h-3 text-slate-950" />
            <span>Open Part Designer</span>
          </button>
          <button
            id="panel-apply-cell-fast-btn"
            onClick={() => applyCellDesignToSimulation()}
            className="py-1.5 px-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg text-xs transition cursor-pointer"
            title="Auto-configure Toyo DCM, Robot, Gripper and Downstream equipment"
          >
            <span>Apply Cell</span>
          </button>
        </div>
      </div>

      {/* 2. Step 1: Choose Cell / Machine Size */}
      <div className={`p-3 transition ${workflowStep === 1 ? 'bg-blue-950/20' : ''}`}>
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
            <Factory className="w-3.5 h-3.5 text-blue-400" />
            <span>1. Die Casting Machine</span>
          </label>
          <span className="text-[10px] font-mono text-blue-400 bg-blue-950/60 px-1.5 py-0.5 rounded border border-blue-800/50">
            {machine.clampingForceTons} Tons Clamping
          </span>
        </div>

        <div className="mt-2 grid grid-cols-2 gap-1.5">
          {MACHINE_PRESETS.map(m => (
            <button
              key={m.id}
              id={`machine-preset-btn-${m.id}`}
              onClick={() => setMachine(m)}
              className={`p-2 rounded-lg border text-left text-xs transition cursor-pointer ${
                machine.id === m.id
                  ? 'bg-blue-600/20 border-blue-500 text-white shadow-sm'
                  : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              <div className="font-semibold text-slate-200">{m.clampingForceTons}T Machine</div>
              <div className="text-[9.5px] text-slate-400 mt-0.5">{m.tieBarClearanceH}×{m.tieBarClearanceV}mm Daylight</div>
            </button>
          ))}
        </div>
      </div>

      {/* 3. Step 2: Choose Robot Position [ TOP ] vs [ SIDE ] */}
      <div className={`p-3 transition ${workflowStep === 2 ? 'bg-blue-950/20' : ''}`}>
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
            <Compass className="w-3.5 h-3.5 text-blue-400" />
            <span>2. Robot Position Preset</span>
          </label>
          <div className="flex items-center gap-1.5">
            <button
              id="open-wollin-ref-btn"
              onClick={() => setIsReferenceModalOpen(true)}
              className="px-2 py-0.5 bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-white font-bold rounded text-[9.5px] shadow-sm flex items-center gap-1 cursor-pointer transition"
              title="View Wollin 6-Axis Top-Mount Reference Images & Schematics"
            >
              <Camera className="w-2.5 h-2.5" />
              <span>Wollin Top-Mount Ref</span>
            </button>
            <button
              id="open-advisor-btn"
              onClick={() => setIsBestPositionAdvisorOpen(true)}
              className="px-2 py-0.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded text-[9.5px] shadow-sm flex items-center gap-1 cursor-pointer"
            >
              <Sparkles className="w-2.5 h-2.5 text-slate-950" />
              <span>Advisor</span>
            </button>
          </div>
        </div>

        <p className="text-[10px] text-slate-400 mt-1">
          Top-mounted enters downward into die daylight. Side-mounted enters horizontally from floor pedestal.
        </p>

        {/* Primary Presets: TOP vs SIDE */}
        <div className="mt-2 grid grid-cols-2 gap-2">
          {/* Preset 1: Top Mounted (Gantry or Platen Top) */}
          <button
            id="mount-preset-top-btn"
            onClick={() => setRobotMountType('top')}
            className={`p-2.5 rounded-lg border text-left transition cursor-pointer flex flex-col justify-between gap-1.5 ${
              robotMountConfig.type === 'top'
                ? 'bg-blue-600/25 border-blue-400 text-white shadow-md ring-1 ring-blue-500/50'
                : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-100 flex items-center gap-1">
                <span>⬆ TOP MOUNTED</span>
              </span>
              <span className="text-[9px] bg-blue-500/20 text-blue-300 px-1 py-0.2 rounded font-mono">Recommended</span>
            </div>
            <p className="text-[9.5px] text-slate-400 leading-tight">
              {topMountStyle === 'platen_direct' ? 'Wollin platen-top mount. Zero floor space.' : 'Overhead gantry structure. Tie-bar clearance.'}
            </p>
          </button>

          {/* Preset 2: Side Mounted (Floor Pedestal) */}
          <button
            id="mount-preset-side-btn"
            onClick={() => setRobotMountType('side')}
            className={`p-2.5 rounded-lg border text-left transition cursor-pointer flex flex-col justify-between gap-1.5 ${
              robotMountConfig.type === 'side'
                ? 'bg-blue-600/25 border-blue-400 text-white shadow-md ring-1 ring-blue-500/50'
                : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-100 flex items-center gap-1">
                <span>⬅ SIDE MOUNTED</span>
              </span>
            </div>
            <p className="text-[9.5px] text-slate-400 leading-tight">
              Floor pedestal riser. Faster maintenance, low ceiling cells.
            </p>
          </button>
        </div>

        {/* Top-Mount Style Sub-Configuration */}
        {robotMountConfig.type === 'top' && (
          <div className="mt-2 bg-slate-950/70 border border-slate-800 rounded-lg p-2 space-y-2">
            <div className="flex items-center justify-between text-[10px]">
              <span className="font-semibold text-cyan-300 flex items-center gap-1">
                <Wrench className="w-3 h-3 text-cyan-400" />
                <span>Top Mount Style (Ref Images):</span>
              </span>
              <button
                id="view-ref-images-link"
                onClick={() => setIsReferenceModalOpen(true)}
                className="text-cyan-400 hover:text-cyan-300 underline font-mono text-[9px] cursor-pointer"
              >
                View Schematics
              </button>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                id="style-platen-direct-btn"
                onClick={() => setTopMountStyle('platen_direct')}
                className={`py-1 px-2 rounded text-[10.5px] font-medium border text-left transition cursor-pointer ${
                  topMountStyle === 'platen_direct'
                    ? 'bg-cyan-950/60 border-cyan-400 text-cyan-200 font-semibold ring-1 ring-cyan-500/40'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="font-bold flex items-center justify-between">
                  <span>Platen-Top Direct</span>
                  {topMountStyle === 'platen_direct' && <span className="text-[8px] bg-cyan-500/20 text-cyan-300 px-1 rounded">OEM</span>}
                </div>
                <div className="text-[8.5px] text-slate-400">Wollin style + Dosing unit</div>
              </button>

              <button
                id="style-overhead-gantry-btn"
                onClick={() => setTopMountStyle('overhead_gantry')}
                className={`py-1 px-2 rounded text-[10.5px] font-medium border text-left transition cursor-pointer ${
                  topMountStyle === 'overhead_gantry'
                    ? 'bg-blue-950/60 border-blue-400 text-blue-200 font-semibold ring-1 ring-blue-500/40'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="font-bold">Overhead Gantry</div>
                <div className="text-[8.5px] text-slate-400">Steel bridge frame</div>
              </button>
            </div>

            {/* Dual Robot Toggle */}
            <div className="pt-1.5 border-t border-slate-800/80 flex items-center justify-between text-[10.5px]">
              <span className="text-slate-300 flex items-center gap-1">
                <Eye className="w-3 h-3 text-emerald-400" />
                <span>Dual Robots (Image 1 Extractor):</span>
              </span>
              <button
                id="toggle-dual-robots-panel-btn"
                onClick={() => setShowDualRobots(!showDualRobots)}
                className={`px-2 py-0.5 rounded text-[10px] font-bold border transition cursor-pointer ${
                  showDualRobots
                    ? 'bg-emerald-600/30 border-emerald-500 text-emerald-300'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {showDualRobots ? 'Active (Dual)' : 'Off (Single)'}
              </button>
            </div>
          </div>
        )}

        {/* Visual Robot Position Controls (Nudge & Rotate) */}
        <div className="mt-2.5 bg-slate-950/60 border border-slate-800/80 rounded-lg p-2 space-y-2">
          <div className="flex items-center justify-between text-[10px] text-slate-400">
            <span className="font-semibold text-slate-300">Visual Placement Controls</span>
            <span>Nudge: 50mm / 15°</span>
          </div>

          <div className="flex items-center justify-between gap-2">
            {/* Directional Nudge Pad */}
            <div className="flex items-center gap-1">
              <button
                id="nudge-robot-left"
                onClick={() => nudgeRobot('x', -50)}
                className="w-7 h-7 bg-slate-800 hover:bg-slate-700 active:bg-blue-600 rounded flex items-center justify-center text-slate-300 transition cursor-pointer"
                title="Move Robot Left"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
              </button>
              <div className="flex flex-col gap-1">
                <button
                  id="nudge-robot-up"
                  onClick={() => nudgeRobot('y', 50)}
                  className="w-7 h-7 bg-slate-800 hover:bg-slate-700 active:bg-blue-600 rounded flex items-center justify-center text-slate-300 transition cursor-pointer"
                  title="Move Robot Up"
                >
                  <ArrowUp className="w-3.5 h-3.5" />
                </button>
                <button
                  id="nudge-robot-down"
                  onClick={() => nudgeRobot('y', -50)}
                  className="w-7 h-7 bg-slate-800 hover:bg-slate-700 active:bg-blue-600 rounded flex items-center justify-center text-slate-300 transition cursor-pointer"
                  title="Move Robot Down"
                >
                  <ArrowDown className="w-3.5 h-3.5" />
                </button>
              </div>
              <button
                id="nudge-robot-right"
                onClick={() => nudgeRobot('x', 50)}
                className="w-7 h-7 bg-slate-800 hover:bg-slate-700 active:bg-blue-600 rounded flex items-center justify-center text-slate-300 transition cursor-pointer"
                title="Move Robot Right"
              >
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Rotation Controls */}
            <div className="flex items-center gap-1">
              <button
                id="rotate-robot-ccw"
                onClick={() => rotateRobot(-15)}
                className="px-2 py-1.5 bg-slate-800 hover:bg-slate-700 active:bg-blue-600 rounded text-[10px] font-semibold text-slate-300 flex items-center gap-1 transition cursor-pointer"
                title="Rotate Robot Base Counter-Clockwise"
              >
                <RotateCounterCw className="w-3 h-3" />
                <span>↺ 15°</span>
              </button>
              <button
                id="rotate-robot-cw"
                onClick={() => rotateRobot(15)}
                className="px-2 py-1.5 bg-slate-800 hover:bg-slate-700 active:bg-blue-600 rounded text-[10px] font-semibold text-slate-300 flex items-center gap-1 transition cursor-pointer"
                title="Rotate Robot Base Clockwise"
              >
                <RotateCw className="w-3 h-3" />
                <span>↻ 15°</span>
              </button>
            </div>
          </div>

          {/* Simple Sliders for Distance & Height */}
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between text-[9.5px] text-slate-400">
              <span>Distance From Machine</span>
              <span className="font-mono text-slate-200">
                {robotMountConfig.type === 'top' ? robot.baseOffset[1] : Math.abs(robot.baseOffset[0])} mm
              </span>
            </div>
            <input
              type="range"
              min={robotMountConfig.type === 'top' ? 1200 : 700}
              max={robotMountConfig.type === 'top' ? 2200 : 1600}
              step={25}
              value={robotMountConfig.type === 'top' ? robot.baseOffset[1] : Math.abs(robot.baseOffset[0])}
              onChange={e => {
                const val = Number(e.target.value);
                if (robotMountConfig.type === 'top') {
                  updateRobotMount({ heightMm: val });
                } else {
                  updateRobotMount({ distanceMm: val });
                }
              }}
              className="w-full accent-blue-500 cursor-pointer h-1 bg-slate-800 rounded"
            />
          </div>
        </div>
      </div>

      {/* 4. Step 3: Choose Robot Model */}
      <div className={`p-3 transition ${workflowStep === 3 ? 'bg-blue-950/20' : ''}`}>
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
            <Bot className="w-3.5 h-3.5 text-blue-400" />
            <span>3. Robot Model</span>
          </label>
          <span className="text-[10px] text-slate-400 font-mono">
            {robot.reachMm}mm Reach • {robot.payloadKg}kg
          </span>
        </div>

        <select
          id="robot-model-selector"
          value={robot.id}
          onChange={e => {
            const found = ROBOT_PRESETS.find(r => r.id === e.target.value);
            if (found) {
              setRobot({
                ...found,
                baseOffset: [...robot.baseOffset],
                mountOrientation: robotMountConfig.type
              });
            }
          }}
          className="w-full mt-2 bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 font-medium"
        >
          {ROBOT_PRESETS.map(r => (
            <option key={r.id} value={r.id}>
              {r.name} ({r.payloadKg}kg payload / {r.reachMm}mm reach)
            </option>
          ))}
        </select>
      </div>

      {/* 5. Step 4: Choose Spray Head (6 Tooling Types) */}
      <div className={`p-3 transition ${workflowStep === 4 ? 'bg-blue-950/20' : ''}`}>
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
            <SprayIcon className="w-3.5 h-3.5 text-blue-400" />
            <span>4. Spray Head Tooling</span>
          </label>
          <span className="text-[10px] text-cyan-400 font-mono">
            {tool.nozzleCount} Nozzles • {tool.manifoldWidthMm}mm Width
          </span>
        </div>

        <p className="text-[10px] text-slate-400 mt-1">
          Select spray head geometry engineered for HPDC daylight and parting lines.
        </p>

        {/* 6 Spray Head Type Selector */}
        <div className="mt-2 space-y-1.5">
          {SPRAY_HEAD_PRESETS.map(preset => {
            const isSelected = tool.sprayHeadType === preset.id;
            return (
              <button
                key={preset.id}
                id={`sprayhead-preset-${preset.id}`}
                onClick={() => setSprayHeadPreset(preset.id)}
                className={`w-full p-2 rounded-lg border text-left text-xs transition cursor-pointer flex flex-col gap-1 ${
                  isSelected
                    ? 'bg-blue-600/20 border-blue-500 text-white shadow-sm ring-1 ring-blue-500/50'
                    : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-100">{preset.name}</span>
                  <span className="text-[9px] font-mono text-slate-400">
                    {preset.nozzleCount} Noz • {preset.weightKg}kg
                  </span>
                </div>
                <p className="text-[9.5px] text-slate-400 leading-tight">
                  {preset.description}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* 6. Step 5: Select What You Want to Spray (Surfaces & Hot Spots) */}
      <div className={`p-3 transition ${workflowStep === 5 ? 'bg-blue-950/20' : ''}`}>
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
            <CheckSquare className="w-3.5 h-3.5 text-blue-400" />
            <span>5. Surfaces & Thermal Hot Spots</span>
          </label>
          <span className="text-[10px] text-slate-400">Select Targets</span>
        </div>

        <p className="text-[10px] text-slate-400 mt-1">
          Check areas requiring release agent coating. The robot path will be created automatically.
        </p>

        {/* Surface Checkboxes */}
        <div className="mt-2 grid grid-cols-2 gap-1.5 text-xs">
          {[
            { key: 'fixedCavity', label: 'Fixed Die Half', desc: 'Cover side' },
            { key: 'movableCore', label: 'Moving Die Half', desc: 'Ejector side' },
            { key: 'slide', label: 'Slider Split Faces', desc: 'Side actions' },
            { key: 'core', label: 'Deep Cores & Pins', desc: 'Core pulls' },
            { key: 'gateArea', label: 'Gate & Runner Area', desc: 'Metal inrush' },
            { key: 'partingLine', label: 'Parting Line Perimeter', desc: 'Vent clearing' }
          ].map(zone => {
            const isChecked = (sprayIntent.selectedZones as any)[zone.key];
            return (
              <label
                key={zone.key}
                className={`flex items-start gap-2 p-1.5 rounded border text-xs cursor-pointer transition ${
                  isChecked
                    ? 'bg-blue-600/10 border-blue-500/50 text-slate-200'
                    : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={e =>
                    setSprayIntent({
                      selectedZones: {
                        ...sprayIntent.selectedZones,
                        [zone.key]: e.target.checked
                      }
                    })
                  }
                  className="mt-0.5 w-3.5 h-3.5 rounded text-blue-600 bg-slate-900 border-slate-700"
                />
                <div>
                  <span className="font-semibold block text-[10.5px]">{zone.label}</span>
                  <span className="text-[8.5px] text-slate-500">{zone.desc}</span>
                </div>
              </label>
            );
          })}
        </div>

        {/* Hot Spots & Estimated Thermal Priority */}
        <div className="mt-3">
          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-300">
            <span className="flex items-center gap-1">
              <Flame className="w-3 h-3 text-rose-400" />
              <span>Die Thermal Hot Spots</span>
            </span>
            <span className="text-[9px] text-slate-400">Extra cooling dwell</span>
          </div>

          <div className="mt-1.5 space-y-1">
            {hotSpots.map(hs => (
              <div
                key={hs.id}
                className={`p-1.5 rounded border flex items-center justify-between text-xs transition ${
                  hs.extraCoolingRequired
                    ? 'bg-rose-950/20 border-rose-800/40 text-slate-200'
                    : 'bg-slate-950/40 border-slate-800 text-slate-400'
                }`}
              >
                <label className="flex items-center gap-2 cursor-pointer flex-1">
                  <input
                    type="checkbox"
                    checked={hs.extraCoolingRequired}
                    onChange={() => toggleHotSpot(hs.id)}
                    className="w-3.5 h-3.5 rounded text-rose-600 bg-slate-900 border-slate-700"
                  />
                  <div>
                    <span className="text-[10.5px] font-semibold block">{hs.name}</span>
                    <span className="text-[8.5px] text-slate-400">
                      +{hs.extraPasses} pass • {Math.round(hs.slowerSpeedFactor * 100)}% speed
                    </span>
                  </div>
                </label>

                {/* Thermal Priority Badge */}
                <select
                  value={hs.thermalPriority}
                  onChange={e => updateHotSpotPriority(hs.id, e.target.value as any)}
                  className={`text-[9.5px] font-bold px-1.5 py-0.5 rounded border cursor-pointer ${
                    hs.thermalPriority === 'VERY HOT'
                      ? 'bg-rose-600/30 text-rose-300 border-rose-500/50'
                      : hs.thermalPriority === 'HOT'
                      ? 'bg-amber-600/30 text-amber-300 border-amber-500/50'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}
                >
                  <option value="NORMAL">NORMAL</option>
                  <option value="HOT">HOT</option>
                  <option value="VERY HOT">VERY HOT</option>
                </select>
              </div>
            ))}
          </div>
        </div>

        {/* Spray Distance Setting with Real-Time Feedback */}
        <div className="mt-3 bg-slate-950/60 border border-slate-800 rounded-lg p-2 space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-300">Spray Distance</span>
            <div className="flex items-center gap-1.5">
              <span className="font-mono font-bold text-slate-100">
                {sprayIntent.sprayDistanceMm} mm
              </span>
              <span
                className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                  sprayDistanceStatus === 'GOOD'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : sprayDistanceStatus === 'TOO_CLOSE'
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                }`}
              >
                {sprayDistanceStatus === 'GOOD'
                  ? 'GOOD SPRAY DISTANCE'
                  : sprayDistanceStatus === 'TOO_CLOSE'
                  ? 'TOO CLOSE (<100mm)'
                  : 'TOO FAR (>180mm)'}
              </span>
            </div>
          </div>

          <input
            type="range"
            min={80}
            max={240}
            step={5}
            value={sprayIntent.sprayDistanceMm}
            onChange={e => setSprayIntent({ sprayDistanceMm: Number(e.target.value) })}
            className="w-full accent-blue-500 cursor-pointer h-1.5 bg-slate-800 rounded"
          />

          <div className="flex items-center justify-between text-[9px] text-slate-500">
            <span>Too Close (Collision Risk)</span>
            <span className="font-semibold text-slate-400">Typical Starting Range: 100-180 mm</span>
            <span>Too Far (Mist Overspray)</span>
          </div>
        </div>

        {/* Air Blow Mode */}
        <div className="mt-2.5 flex items-center justify-between bg-slate-950/50 border border-slate-800 p-1.5 rounded-lg text-xs">
          <span className="text-[10px] text-slate-400 flex items-center gap-1">
            <Wind className="w-3 h-3 text-cyan-400" />
            <span>Air Blow Drying Mode:</span>
          </span>
          <select
            value={sprayIntent.airBlowMode}
            onChange={e => setSprayIntent({ airBlowMode: e.target.value as any })}
            className="bg-slate-900 border border-slate-700 text-slate-200 rounded px-2 py-0.5 text-[10px] font-medium"
          >
            <option value="follow_spray">Follow Spray Path</option>
            <option value="dedicated_path">Dedicated Air Path</option>
            <option value="custom_dwell">Center Air Dwell</option>
          </select>
        </div>

        {/* Primary CTA: # AUTOMATE THIS TASK */}
        <button
          id="intent-generate-path-btn"
          onClick={() => automateSprayPath()}
          className="w-full mt-3 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-lg text-xs font-bold shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 cursor-pointer transition active:scale-[0.98]"
        >
          <Sparkles className="w-4 h-4 text-amber-300" />
          <span># AUTOMATE THIS TASK</span>
        </button>
      </div>

      {/* 7. Step 6: Simulate & Cycle Review */}
      <div className={`p-3 transition ${workflowStep === 6 ? 'bg-blue-950/20' : ''}`}>
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
            <Play className="w-3.5 h-3.5 text-blue-400" />
            <span>6. Simulation & Metrics</span>
          </label>
          <span className="text-[10px] text-emerald-400 font-mono">
            {coverageStats.fixedDieCoveragePercent}% Coverage
          </span>
        </div>

        <div className="mt-2 grid grid-cols-3 gap-1.5 text-center">
          <div className="bg-slate-950/60 border border-slate-800 p-1.5 rounded-lg">
            <span className="text-[9px] text-slate-400 block">Coverage</span>
            <span className="text-xs font-bold text-emerald-400 font-mono">
              {coverageStats.fixedDieCoveragePercent}%
            </span>
          </div>

          <div className="bg-slate-950/60 border border-slate-800 p-1.5 rounded-lg">
            <span className="text-[9px] text-slate-400 block">Cycle Time</span>
            <span className="text-xs font-bold text-blue-400 font-mono">
              {trajectoryPlan.totalDurationSec}s
            </span>
          </div>

          <div className="bg-slate-950/60 border border-slate-800 p-1.5 rounded-lg">
            <span className="text-[9px] text-slate-400 block">Min Clearance</span>
            <span className={`text-xs font-bold font-mono ${
              collisionResult.minClearanceDistanceMm < 0
                ? 'text-rose-400'
                : collisionResult.minClearanceDistanceMm > 100
                ? 'text-emerald-400'
                : 'text-amber-400'
            }`}>
              {collisionResult.minClearanceDistanceMm < 0
                ? `${Math.round(collisionResult.minClearanceDistanceMm)}mm`
                : `+${Math.round(collisionResult.minClearanceDistanceMm)}mm`}
            </span>
          </div>
        </div>

        {/* Playback Button in Panel */}
        <div className="mt-2 flex gap-1.5">
          <button
            id="panel-play-pause-btn"
            onClick={() => setIsPlaying(!isPlaying)}
            className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
              isPlaying
                ? 'bg-amber-600 hover:bg-amber-500 text-white'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white'
            }`}
          >
            <Play className="w-3.5 h-3.5" />
            <span>{isPlaying ? 'Pause Simulation' : 'Run Cycle'}</span>
          </button>
          <button
            id="panel-reset-btn"
            onClick={() => resetSimulation()}
            className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium cursor-pointer"
            title="Reset Simulation"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 8. Step 7 & 8: Explain This ("WHY?" & "HOW TO FIX IT") */}
      <div className={`p-3 transition ${workflowStep === 7 || workflowStep === 8 ? 'bg-blue-950/20' : ''}`}>
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
            <Wrench className="w-3.5 h-3.5 text-blue-400" />
            <span>Safety Diagnostics & "Explain This"</span>
          </label>
          {isHealthy ? (
            <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-semibold">
              <CheckCircle2 className="w-3 h-3" /> Ready
            </span>
          ) : (
            <span className="text-[10px] text-amber-400 flex items-center gap-1 font-semibold">
              <AlertTriangle className="w-3 h-3" /> Needs Fix
            </span>
          )}
        </div>

        <div className="mt-2 space-y-2">
          {isHealthy ? (
            <div className="p-2 bg-emerald-950/30 border border-emerald-800/40 rounded-lg text-xs text-emerald-300">
              <div className="font-semibold flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Cell is production-safe!</span>
              </div>
              <p className="text-[10px] text-emerald-400/80 mt-0.5">
                No collision detected. Tie bar clearance is safe ({Math.round(collisionResult.minClearanceDistanceMm)}mm). All spray points are within robot reach.
              </p>
            </div>
          ) : (
            actionableProblems.map((prob, idx) => (
              <div key={idx} className="p-2 bg-amber-950/30 border border-amber-800/50 rounded-lg text-xs text-amber-200 space-y-1.5">
                <div className="font-semibold flex items-center gap-1.5 text-amber-300">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>{prob.headline}</span>
                </div>

                {/* "WHY?" Explanation */}
                <div className="bg-amber-950/50 rounded p-1.5 border border-amber-900/50">
                  <div className="text-[9.5px] font-bold text-amber-400 flex items-center gap-1">
                    <HelpCircle className="w-2.5 h-2.5" />
                    <span>WHY THIS HAPPENED:</span>
                  </div>
                  <p className="text-[10px] text-amber-200/90 leading-relaxed mt-0.5">
                    {prob.details}
                  </p>
                </div>

                {/* "HOW TO FIX IT" */}
                <div className="text-[10px] text-slate-300">
                  <span className="font-bold text-emerald-400">HOW TO FIX IT: </span>
                  <span>{prob.suggestedAction}</span>
                </div>
              </div>
            ))
          )}

          {/* Fix Automatically Button */}
          {!isHealthy && (
            <button
              id="fix-problems-auto-btn"
              onClick={() => fixProblemsAutomatically()}
              className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shadow-md shadow-emerald-500/20 flex items-center justify-center gap-1.5 cursor-pointer transition"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-200" />
              <span>✨ Fix Automatically</span>
            </button>
          )}
        </div>
      </div>
    </aside>
  );
};
