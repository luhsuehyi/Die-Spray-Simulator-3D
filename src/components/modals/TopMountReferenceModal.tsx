import React, { useState } from 'react';
import {
  X,
  Camera,
  CheckCircle2,
  Sparkles,
  Layers,
  ArrowRight,
  ShieldCheck,
  Zap,
  Info,
  Sliders,
  Maximize2,
  Wrench,
  Compass,
  CornerDownRight,
  Eye
} from 'lucide-react';
import { useSimulationStore } from '../../store/simulationStore';

export const TopMountReferenceModal: React.FC = () => {
  const {
    isReferenceModalOpen,
    setIsReferenceModalOpen,
    robotMountConfig,
    setRobotMountType,
    topMountStyle,
    setTopMountStyle,
    showDualRobots,
    setShowDualRobots,
    applyWollinTopMountPreset,
    machine
  } = useSimulationStore();

  const [activeTab, setActiveTab] = useState<'cell_architecture' | 'robot_closeup' | 'specs_matrix'>('cell_architecture');
  const [selectedCallout, setSelectedCallout] = useState<number | null>(1);

  if (!isReferenceModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 select-none animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-5xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-950/70 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-inner">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-tight">
                  Top-Mounted 6-Axis Robot Reference
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/25 text-cyan-300 border border-cyan-500/40 uppercase tracking-wider">
                  Wollin OEM Architecture
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Real-world HPDC platen-top installation analysis from reference images
              </p>
            </div>
          </div>
          <button
            id="close-reference-modal-btn"
            onClick={() => setIsReferenceModalOpen(false)}
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="px-6 pt-3 border-b border-slate-800 bg-slate-900 flex gap-2">
          <button
            id="ref-tab-cell-arch"
            onClick={() => { setActiveTab('cell_architecture'); setSelectedCallout(1); }}
            className={`pb-3 px-3 text-xs font-semibold border-b-2 transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'cell_architecture'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Image 1: Dual Platen-Top Cell Architecture</span>
          </button>
          <button
            id="ref-tab-robot-detail"
            onClick={() => { setActiveTab('robot_closeup'); setSelectedCallout(2); }}
            className={`pb-3 px-3 text-xs font-semibold border-b-2 transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'robot_closeup'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Wrench className="w-4 h-4" />
            <span>Image 2: 6-Axis Robot & Umbilical Dress Pack</span>
          </button>
          <button
            id="ref-tab-specs"
            onClick={() => setActiveTab('specs_matrix')}
            className={`pb-3 px-3 text-xs font-semibold border-b-2 transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'specs_matrix'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Engineering Placement & Clearances</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeTab === 'cell_architecture' && (
            <div className="space-y-5">
              {/* Technical Schematic Graphic */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 overflow-hidden relative shadow-inner">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-[11px] font-mono text-cyan-400 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                    <span>HPDC CELL ELEVATION SCHEMATIC (WOLLIN DUAL PLATEN MOUNT)</span>
                  </div>
                  <span className="text-[10px] text-slate-400">Click callouts (1–6) to inspect details</span>
                </div>

                {/* Interactive SVG Diagram representing Reference Image 1 */}
                <svg
                  viewBox="0 0 920 380"
                  className="w-full h-auto bg-slate-950/80 rounded-lg border border-slate-800/60"
                  style={{ maxHeight: '340px' }}
                >
                  <defs>
                    <linearGradient id="tieBarGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#94a3b8" />
                      <stop offset="50%" stopColor="#f1f5f9" />
                      <stop offset="100%" stopColor="#64748b" />
                    </linearGradient>
                    <linearGradient id="platenGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#334155" />
                      <stop offset="100%" stopColor="#1e293b" />
                    </linearGradient>
                    <linearGradient id="wollinTurquoise" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#06b6d4" />
                      <stop offset="100%" stopColor="#0891b2" />
                    </linearGradient>
                    <pattern id="gridPattern" width="20" height="20" patternUnits="userSpaceOnUse">
                      <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#1e293b" strokeWidth="0.5" />
                    </pattern>
                  </defs>

                  {/* Grid background */}
                  <rect width="920" height="380" fill="url(#gridPattern)" />

                  {/* Machine Floor / Base Bed */}
                  <rect x="100" y="320" width="720" height="35" rx="4" fill="#0f172a" stroke="#334155" strokeWidth="2" />
                  <line x1="80" y1="355" x2="840" y2="355" stroke="#475569" strokeWidth="3" strokeDasharray="6 6" />

                  {/* Fixed Platen (Stationary Die) */}
                  <rect x="220" y="140" width="130" height="180" rx="3" fill="url(#platenGrad)" stroke="#475569" strokeWidth="2" />
                  {/* Fixed Platen Cast Windows (as in Image 1) */}
                  <rect x="235" y="160" width="100" height="55" rx="2" fill="#090d16" stroke="#1e293b" />
                  <rect x="235" y="235" width="100" height="65" rx="2" fill="#090d16" stroke="#1e293b" />
                  <text x="285" y="195" fill="#64748b" fontSize="10" textAnchor="middle" fontFamily="monospace">STATIONARY</text>
                  <text x="285" y="275" fill="#64748b" fontSize="10" textAnchor="middle" fontFamily="monospace">PLATEN</text>

                  {/* Movable Platen (Ejector Die) */}
                  <rect x="560" y="140" width="130" height="180" rx="3" fill="url(#platenGrad)" stroke="#475569" strokeWidth="2" />
                  <rect x="575" y="160" width="100" height="55" rx="2" fill="#090d16" stroke="#1e293b" />
                  <rect x="575" y="235" width="100" height="65" rx="2" fill="#090d16" stroke="#1e293b" />
                  <text x="625" y="195" fill="#64748b" fontSize="10" textAnchor="middle" fontFamily="monospace">MOVABLE</text>
                  <text x="625" y="275" fill="#64748b" fontSize="10" textAnchor="middle" fontFamily="monospace">PLATEN</text>

                  {/* Die Blocks Inside Daylight */}
                  <rect x="350" y="170" width="40" height="130" fill="#475569" stroke="#64748b" />
                  <rect x="520" y="170" width="40" height="130" fill="#475569" stroke="#64748b" />
                  <text x="455" y="305" fill="#38bdf8" fontSize="10" textAnchor="middle" fontFamily="monospace">DIE DAYLIGHT SPACE</text>

                  {/* Upper Tie Bar (Front & Rear) */}
                  <rect x="150" y="150" width="610" height="18" rx="9" fill="url(#tieBarGrad)" stroke="#334155" />
                  <text x="455" y="142" fill="#94a3b8" fontSize="9" textAnchor="middle">TOP TIE-BAR CLEARANCE CORRIDOR</text>

                  {/* Lower Tie Bar */}
                  <rect x="150" y="300" width="610" height="18" rx="9" fill="url(#tieBarGrad)" stroke="#334155" />

                  {/* 1. ROBOT 1 (SPRAY ROBOT - FIXED PLATEN TOP) */}
                  {/* Mounting Shelf Deck */}
                  <rect x="210" y="125" width="150" height="15" rx="2" fill="#64748b" stroke="#94a3b8" />
                  {/* Riser Pedestal */}
                  <rect x="270" y="105" width="50" height="20" rx="3" fill="#1e293b" stroke="#475569" />
                  {/* Robot Base & Shoulder */}
                  <circle cx="295" cy="98" r="14" fill="#0284c7" stroke="#38bdf8" strokeWidth="2" />
                  {/* Upper Arm Joint & Link */}
                  <line x1="295" y1="98" x2="360" y2="60" stroke="#0284c7" strokeWidth="12" strokeLinecap="round" />
                  <circle cx="360" cy="60" r="10" fill="#0f172a" stroke="#38bdf8" strokeWidth="2" />
                  {/* Forearm Link Plunging Downward Between Tie-Bars */}
                  <line x1="360" y1="60" x2="435" y2="210" stroke="#0284c7" strokeWidth="9" strokeLinecap="round" />
                  <circle cx="435" cy="210" r="8" fill="#0f172a" stroke="#38bdf8" strokeWidth="2" />
                  {/* Spray Tool Head (Dual-Sided Matrix) */}
                  <rect x="425" y="215" width="20" height="45" rx="2" fill="#f59e0b" stroke="#d97706" strokeWidth="1.5" />
                  {/* Spray Cones into Cavities */}
                  <polygon points="425,230 390,200 390,260" fill="rgba(56, 189, 248, 0.35)" stroke="#38bdf8" strokeWidth="1" strokeDasharray="3 3" />
                  <polygon points="445,230 480,200 480,260" fill="rgba(56, 189, 248, 0.35)" stroke="#38bdf8" strokeWidth="1" strokeDasharray="3 3" />

                  {/* Wollin Media Dosing Tower beside Robot 1 */}
                  <rect x="220" y="45" width="40" height="80" rx="3" fill="#cbd5e1" stroke="#64748b" />
                  <rect x="220" y="60" width="40" height="12" fill="url(#wollinTurquoise)" />
                  <text x="240" y="69" fill="#ffffff" fontSize="7" fontWeight="bold" textAnchor="middle">WOLLIN</text>
                  <circle cx="232" cy="85" r="4" fill="#ffffff" stroke="#334155" />
                  <circle cx="248" cy="85" r="4" fill="#ffffff" stroke="#334155" />

                  {/* Arched Flexible Hose Conduit (Dress Pack) */}
                  <path
                    d="M 240 45 Q 280 20 360 55 T 435 210"
                    fill="none"
                    stroke="#020617"
                    strokeWidth="7"
                    strokeDasharray="4 2"
                    strokeLinecap="round"
                  />

                  {/* 2. ROBOT 2 (EXTRACTOR ROBOT - MOVABLE PLATEN TOP, Reference Image 1) */}
                  <rect x="550" y="125" width="150" height="15" rx="2" fill="#64748b" stroke="#94a3b8" />
                  <rect x="590" y="105" width="50" height="20" rx="3" fill="#1e293b" stroke="#475569" />
                  <circle cx="615" cy="98" r="14" fill="#64748b" stroke="#94a3b8" strokeWidth="2" />
                  <line x1="615" y1="98" x2="570" y2="55" stroke="#64748b" strokeWidth="12" strokeLinecap="round" />
                  <circle cx="570" cy="55" r="10" fill="#0f172a" stroke="#94a3b8" strokeWidth="2" />
                  <line x1="570" y1="55" x2="510" y2="180" stroke="#64748b" strokeWidth="9" strokeLinecap="round" />
                  <circle cx="510" cy="180" r="8" fill="#0f172a" stroke="#94a3b8" strokeWidth="2" />
                  {/* Extractor Gripper Jaws & Cast Part */}
                  <rect x="495" y="185" width="16" height="25" rx="2" fill="#10b981" stroke="#059669" />
                  <path d="M 490 205 L 515 205 L 512 225 L 493 225 Z" fill="#94a3b8" stroke="#475569" />

                  {/* CALLOUT PINS (1 to 6) */}
                  {/* Pin 1: Platen Top Mount */}
                  <g
                    className="cursor-pointer"
                    onClick={() => setSelectedCallout(1)}
                    transform="translate(285, 125)"
                  >
                    <circle cx="0" cy="0" r="11" fill={selectedCallout === 1 ? '#06b6d4' : '#1e293b'} stroke="#38bdf8" strokeWidth="2" />
                    <text x="0" y="4" fill="#ffffff" fontSize="10" fontWeight="bold" textAnchor="middle">1</text>
                  </g>

                  {/* Pin 2: Wollin Dosing Tower */}
                  <g
                    className="cursor-pointer"
                    onClick={() => setSelectedCallout(2)}
                    transform="translate(240, 45)"
                  >
                    <circle cx="0" cy="0" r="11" fill={selectedCallout === 2 ? '#06b6d4' : '#1e293b'} stroke="#38bdf8" strokeWidth="2" />
                    <text x="0" y="4" fill="#ffffff" fontSize="10" fontWeight="bold" textAnchor="middle">2</text>
                  </g>

                  {/* Pin 3: Flexible Conduit Dress Pack */}
                  <g
                    className="cursor-pointer"
                    onClick={() => setSelectedCallout(3)}
                    transform="translate(325, 30)"
                  >
                    <circle cx="0" cy="0" r="11" fill={selectedCallout === 3 ? '#06b6d4' : '#1e293b'} stroke="#38bdf8" strokeWidth="2" />
                    <text x="0" y="4" fill="#ffffff" fontSize="10" fontWeight="bold" textAnchor="middle">3</text>
                  </g>

                  {/* Pin 4: Between-Tie-Bar Entry */}
                  <g
                    className="cursor-pointer"
                    onClick={() => setSelectedCallout(4)}
                    transform="translate(420, 148)"
                  >
                    <circle cx="0" cy="0" r="11" fill={selectedCallout === 4 ? '#06b6d4' : '#1e293b'} stroke="#38bdf8" strokeWidth="2" />
                    <text x="0" y="4" fill="#ffffff" fontSize="10" fontWeight="bold" textAnchor="middle">4</text>
                  </g>

                  {/* Pin 5: Matrix Spray Head */}
                  <g
                    className="cursor-pointer"
                    onClick={() => setSelectedCallout(5)}
                    transform="translate(450, 235)"
                  >
                    <circle cx="0" cy="0" r="11" fill={selectedCallout === 5 ? '#06b6d4' : '#1e293b'} stroke="#38bdf8" strokeWidth="2" />
                    <text x="0" y="4" fill="#ffffff" fontSize="10" fontWeight="bold" textAnchor="middle">5</text>
                  </g>

                  {/* Pin 6: Dual Extractor Robot */}
                  <g
                    className="cursor-pointer"
                    onClick={() => setSelectedCallout(6)}
                    transform="translate(615, 95)"
                  >
                    <circle cx="0" cy="0" r="11" fill={selectedCallout === 6 ? '#06b6d4' : '#1e293b'} stroke="#38bdf8" strokeWidth="2" />
                    <text x="0" y="4" fill="#ffffff" fontSize="10" fontWeight="bold" textAnchor="middle">6</text>
                  </g>
                </svg>
              </div>

              {/* Callout Detail Inspector Cards */}
              <div className="grid grid-cols-3 gap-3">
                <div
                  onClick={() => setSelectedCallout(1)}
                  className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                    selectedCallout === 1
                      ? 'bg-cyan-950/40 border-cyan-400 ring-1 ring-cyan-500/50'
                      : 'bg-slate-950/50 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-5 h-5 rounded-full bg-cyan-500 text-slate-950 font-bold text-xs flex items-center justify-center">1</span>
                    <span className="text-xs font-bold text-white">Platen-Top Direct Mount</span>
                  </div>
                  <p className="text-[10px] text-slate-400 leading-relaxed">
                    Robot sits on the stationary platen top deck. Zero floor footprint. Inherits machine frame thermal stability.
                  </p>
                </div>

                <div
                  onClick={() => setSelectedCallout(2)}
                  className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                    selectedCallout === 2
                      ? 'bg-cyan-950/40 border-cyan-400 ring-1 ring-cyan-500/50'
                      : 'bg-slate-950/50 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-5 h-5 rounded-full bg-cyan-500 text-slate-950 font-bold text-xs flex items-center justify-center">2</span>
                    <span className="text-xs font-bold text-white">Wollin Dosing Media Tower</span>
                  </div>
                  <p className="text-[10px] text-slate-400 leading-relaxed">
                    Compact media unit on the platen platform. Minimizes fluid hose distance, preventing drool and line pressure drop.
                  </p>
                </div>

                <div
                  onClick={() => setSelectedCallout(3)}
                  className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                    selectedCallout === 3
                      ? 'bg-cyan-950/40 border-cyan-400 ring-1 ring-cyan-500/50'
                      : 'bg-slate-950/50 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-5 h-5 rounded-full bg-cyan-500 text-slate-950 font-bold text-xs flex items-center justify-center">3</span>
                    <span className="text-xs font-bold text-white">Heavy Umbilical Dress Pack</span>
                  </div>
                  <p className="text-[10px] text-slate-400 leading-relaxed">
                    High-flex corrugated conduit running arched over Axis 2 and clamped along Axis 3/4. Protects release lines up to 250°C.
                  </p>
                </div>

                <div
                  onClick={() => setSelectedCallout(4)}
                  className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                    selectedCallout === 4
                      ? 'bg-cyan-950/40 border-cyan-400 ring-1 ring-cyan-500/50'
                      : 'bg-slate-950/50 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-5 h-5 rounded-full bg-cyan-500 text-slate-950 font-bold text-xs flex items-center justify-center">4</span>
                    <span className="text-xs font-bold text-white">Between-Tie-Bar Plunge</span>
                  </div>
                  <p className="text-[10px] text-slate-400 leading-relaxed">
                    Arm plunges vertically between top tie-bars ({machine.tieBarClearanceH}mm corridor). Quickest path into parting line.
                  </p>
                </div>

                <div
                  onClick={() => setSelectedCallout(5)}
                  className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                    selectedCallout === 5
                      ? 'bg-cyan-950/40 border-cyan-400 ring-1 ring-cyan-500/50'
                      : 'bg-slate-950/50 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-5 h-5 rounded-full bg-cyan-500 text-slate-950 font-bold text-xs flex items-center justify-center">5</span>
                    <span className="text-xs font-bold text-white">Dual-Sided Matrix Head</span>
                  </div>
                  <p className="text-[10px] text-slate-400 leading-relaxed">
                    Simultaneous spray on fixed cavity and movable ejector face. Wollin high-impact atomization nozzles.
                  </p>
                </div>

                <div
                  onClick={() => setSelectedCallout(6)}
                  className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                    selectedCallout === 6
                      ? 'bg-cyan-950/40 border-cyan-400 ring-1 ring-cyan-500/50'
                      : 'bg-slate-950/50 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-5 h-5 rounded-full bg-cyan-500 text-slate-950 font-bold text-xs flex items-center justify-center">6</span>
                    <span className="text-xs font-bold text-white">Dual-Robot Coordination</span>
                  </div>
                  <p className="text-[10px] text-slate-400 leading-relaxed">
                    Second top-mounted robot on movable platen acts as casting part extractor. Hardware safety handshake interlock.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'robot_closeup' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {/* Mechanical Breakdown Card */}
                <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 space-y-3">
                  <h3 className="text-xs font-bold text-white flex items-center gap-2">
                    <Wrench className="w-4 h-4 text-cyan-400" />
                    <span>6-Axis Kinematics & Platen Deck Interface</span>
                  </h3>
                  <div className="space-y-2 text-[11px] text-slate-300">
                    <div className="p-2.5 rounded bg-slate-900/80 border border-slate-800/80">
                      <div className="font-semibold text-cyan-300">1. Base Mounting Pad</div>
                      <p className="text-[10.5px] text-slate-400 mt-0.5">
                        Machined steel riser welded or bolted to the stationary platen top flange. Heavy 8x M24 grade 10.9 anchor bolts handle dynamic plunging moments.
                      </p>
                    </div>
                    <div className="p-2.5 rounded bg-slate-900/80 border border-slate-800/80">
                      <div className="font-semibold text-cyan-300">2. Foundry-Plus IP67 Protection</div>
                      <p className="text-[10.5px] text-slate-400 mt-0.5">
                        High-temperature seals, pressurized motor cavities, and PTFE/viton protective bellows resist corrosive die lubricant overspray and 450°C aluminum radiant heat.
                      </p>
                    </div>
                    <div className="p-2.5 rounded bg-slate-900/80 border border-slate-800/80">
                      <div className="font-semibold text-cyan-300">3. Inverted Articulation Corridor</div>
                      <p className="text-[10.5px] text-slate-400 mt-0.5">
                        J1 base rotation is constrained within ±60° towards the die daylight. J2 & J3 articulate the wrist straight downward past the upper tie bars.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Wollin Dosing & Dress Pack Card */}
                <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 space-y-3">
                  <h3 className="text-xs font-bold text-white flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-cyan-400" />
                    <span>Wollin Media Dosing & Conduit Dress Pack</span>
                  </h3>
                  <div className="space-y-2 text-[11px] text-slate-300">
                    <div className="p-2.5 rounded bg-slate-900/80 border border-slate-800/80">
                      <div className="font-semibold text-cyan-300">1. Co-Located Media Unit</div>
                      <p className="text-[10.5px] text-slate-400 mt-0.5">
                        The media cabinet is mounted directly adjacent to the robot base on the platen. High-pressure air and diluted release agent are controlled by quick-response pneumatic valves.
                      </p>
                    </div>
                    <div className="p-2.5 rounded bg-slate-900/80 border border-slate-800/80">
                      <div className="font-semibold text-cyan-300">2. Umbilical Dress Pack (Min Radius = 240mm)</div>
                      <p className="text-[10.5px] text-slate-400 mt-0.5">
                        Corrugated high-tensile conduit houses separate internal tubes: Release Agent 1, Release Agent 2, High-Volume Blow-Off Air, and Sensor lines.
                      </p>
                    </div>
                    <div className="p-2.5 rounded bg-slate-900/80 border border-slate-800/80">
                      <div className="font-semibold text-cyan-300">3. Swivel Bracket Retention</div>
                      <p className="text-[10.5px] text-slate-400 mt-0.5">
                        Axis 3 and Axis 4 have low-friction aluminum swivels that prevent cable fatigue or kinking during rapid wrist rotations in tight die cavities.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'specs_matrix' && (
            <div className="space-y-4">
              <div className="overflow-x-auto border border-slate-800 rounded-xl">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-950 text-slate-300 border-b border-slate-800">
                      <th className="p-3 font-semibold">Engineering Metric</th>
                      <th className="p-3 font-semibold text-cyan-400">Platen-Top Mount (Wollin OEM)</th>
                      <th className="p-3 font-semibold text-slate-400">Overhead Free Gantry</th>
                      <th className="p-3 font-semibold text-slate-400">Floor Pedestal (Side)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-300">
                    <tr className="hover:bg-slate-800/30">
                      <td className="p-3 font-medium">Floor Footprint Required</td>
                      <td className="p-3 text-emerald-400 font-bold">0 m² (100% saved)</td>
                      <td className="p-3 text-slate-300">4–6 m² (Pillars)</td>
                      <td className="p-3 text-rose-400">8–12 m² (Safety zone)</td>
                    </tr>
                    <tr className="hover:bg-slate-800/30">
                      <td className="p-3 font-medium">Parting Line Entry Distance</td>
                      <td className="p-3 text-emerald-400 font-bold">Shortest (~1,250 mm)</td>
                      <td className="p-3 text-slate-300">Medium (~1,600 mm)</td>
                      <td className="p-3 text-amber-400">Long (~2,200 mm)</td>
                    </tr>
                    <tr className="hover:bg-slate-800/30">
                      <td className="p-3 font-medium">Cycle Time Contribution</td>
                      <td className="p-3 text-emerald-400 font-bold">Fastest (2.5–3.8s spray)</td>
                      <td className="p-3 text-slate-300">Fast (3.0–4.2s spray)</td>
                      <td className="p-3 text-rose-400">Slower (4.5–6.2s spray)</td>
                    </tr>
                    <tr className="hover:bg-slate-800/30">
                      <td className="p-3 font-medium">Thermal Drift Compensation</td>
                      <td className="p-3 text-emerald-400 font-bold">Zero relative drift (bolted to die)</td>
                      <td className="p-3 text-amber-400">Independent frame expansion</td>
                      <td className="p-3 text-amber-400">Floor-to-machine expansion</td>
                    </tr>
                    <tr className="hover:bg-slate-800/30">
                      <td className="p-3 font-medium">Overhead Crane Clearance</td>
                      <td className="p-3 text-amber-400">Requires crane safe-zone interlock</td>
                      <td className="p-3 text-amber-400">Gantry beam below crane</td>
                      <td className="p-3 text-emerald-400">No crane interference</td>
                    </tr>
                    <tr className="hover:bg-slate-800/30">
                      <td className="p-3 font-medium">Operator Die Access / Maintenance</td>
                      <td className="p-3 text-emerald-400 font-bold">Unobstructed side access</td>
                      <td className="p-3 text-slate-300">Pillars may restrict access</td>
                      <td className="p-3 text-rose-400">Blocked by robot on operator side</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer with One-Click 3D Action Controls */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400">Current Cell Setup:</span>
            <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-blue-500/20 text-blue-300 border border-blue-500/40">
              {robotMountConfig.type.toUpperCase()} ({topMountStyle === 'platen_direct' ? 'Platen-Top Direct' : 'Overhead Gantry'})
            </span>
            {showDualRobots && (
              <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                Dual Robot Active
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Toggle Dual Robots */}
            <button
              id="toggle-dual-robots-btn"
              onClick={() => setShowDualRobots(!showDualRobots)}
              className={`px-3 py-2 rounded-lg text-xs font-semibold border transition cursor-pointer flex items-center gap-1.5 ${
                showDualRobots
                  ? 'bg-emerald-600/30 border-emerald-500 text-emerald-200'
                  : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>{showDualRobots ? 'Hide Extractor Robot' : 'Show Dual Robots (Spray + Extractor)'}</span>
            </button>

            {/* Apply Wollin Preset Button */}
            <button
              id="apply-wollin-preset-btn"
              onClick={() => {
                applyWollinTopMountPreset();
                setIsReferenceModalOpen(false);
              }}
              className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold rounded-lg text-xs shadow-lg flex items-center gap-1.5 transition cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-slate-950" />
              <span>Apply Wollin Platen-Top Setup in 3D</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
