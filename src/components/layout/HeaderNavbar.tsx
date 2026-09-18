import React from 'react';
import {
  Cpu,
  Layers,
  Globe,
  HelpCircle,
  Video,
  FileCode2,
  Sparkles,
  ShieldCheck,
  FolderOpen,
  Compass,
  SlidersHorizontal,
  Bot
} from 'lucide-react';
import { useSimulationStore } from '../../store/simulationStore';
import { translations, Language } from '../../utils/i18n';
import { DIE_PRESETS, MACHINE_PRESETS } from '../../utils/presets';

export const HeaderNavbar: React.FC = () => {
  const {
    language,
    setLanguage,
    appMode,
    setAppMode,
    machine,
    die,
    robot,
    trajectoryPlan,
    collisionResult,
    setDie,
    setMachine,
    setIsVideoExportOpen,
    setIsCodeExportOpen,
    setIsBestPositionAdvisorOpen,
    setIsScenarioCompareOpen
  } = useSimulationStore();

  const t = translations[language] || translations['en'];

  const handleLoadPreset = (dieId: string, machineId: string) => {
    const d = DIE_PRESETS.find(item => item.id === dieId);
    const m = MACHINE_PRESETS.find(item => item.id === machineId);
    if (d) setDie(d);
    if (m) setMachine(m);
  };

  return (
    <header className="h-14 bg-slate-950 border-b border-slate-800 flex items-center justify-between px-4 z-20 shrink-0 select-none text-slate-200">
      {/* 1. Left: Brand & Mode Toggle */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-cyan-400 flex items-center justify-center shadow-lg shadow-blue-500/20 text-white font-bold">
          <Cpu className="w-4 h-4" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-bold tracking-tight text-white">
              {t.appTitle}
            </h1>
            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">
              MANUFACTURING EDITION
            </span>
          </div>
          <p className="text-[10px] text-slate-400">
            {t.appSubtitle}
          </p>
        </div>

        {/* Primary Mode Toggle: Manufacturing vs Engineer */}
        <div className="hidden sm:flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5 ml-2">
          <button
            id="mode-manufacturing-btn"
            onClick={() => setAppMode('manufacturing')}
            className={`px-2.5 py-1 rounded text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
              appMode === 'manufacturing'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>Manufacturing Mode</span>
          </button>
          <button
            id="mode-engineer-btn"
            onClick={() => setAppMode('engineering')}
            className={`px-2.5 py-1 rounded text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
              appMode === 'engineering'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <SlidersHorizontal className="w-3 h-3" />
            <span>Engineer Mode</span>
          </button>
        </div>
      </div>

      {/* 2. Center: Quick Actions & Optimization */}
      <div className="hidden lg:flex items-center gap-2">
        {/* Find Best Position Advisor Button */}
        <button
          id="header-find-position-btn"
          onClick={() => setIsBestPositionAdvisorOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-amber-500/20 to-amber-600/20 hover:from-amber-500/30 hover:to-amber-600/30 text-amber-300 border border-amber-500/40 rounded-lg text-xs font-bold transition cursor-pointer shadow-sm"
        >
          <Compass className="w-3.5 h-3.5 text-amber-400" />
          <span>Find Best Robot Position</span>
        </button>

        {/* Compare Scenarios Button */}
        <button
          id="header-compare-scenarios-btn"
          onClick={() => setIsScenarioCompareOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700/80 rounded-lg text-xs font-semibold text-slate-200 transition cursor-pointer"
        >
          <Layers className="w-3.5 h-3.5 text-blue-400" />
          <span>Compare Scenarios</span>
        </button>

        {/* Machine & Cycle Badges */}
        <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-xs font-mono">
          <span className="text-slate-400 text-[10px]">ROBOT:</span>
          <span className="text-slate-200 font-semibold uppercase">{robot.mountOrientation}</span>
          <span className="text-slate-600">|</span>
          <span className="text-slate-400 text-[10px]">CYCLE:</span>
          <span className="text-emerald-400 font-semibold">{trajectoryPlan.totalDurationSec}s</span>
        </div>
      </div>

      {/* 3. Right: Media Export, Languages & Controls */}
      <div className="flex items-center gap-2">
        {/* Export Robot Code */}
        <button
          id="header-code-export-btn"
          onClick={() => setIsCodeExportOpen(true)}
          className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-xs font-semibold text-slate-300 transition cursor-pointer"
        >
          <FileCode2 className="w-3.5 h-3.5 text-emerald-400" />
          <span className="hidden sm:inline">Export Code</span>
        </button>

        {/* Media Record/Snapshot button */}
        <button
          id="header-video-export-btn"
          onClick={() => setIsVideoExportOpen(true)}
          className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-xs font-medium text-slate-300 transition cursor-pointer"
          title="Record Video & Snapshot"
        >
          <Video className="w-3.5 h-3.5 text-rose-400" />
          <span className="hidden sm:inline">Media</span>
        </button>

        {/* Internationalization Language Switcher */}
        <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-xs">
          <Globe className="w-3.5 h-3.5 text-slate-400" />
          <select
            id="app-language-selector"
            value={language}
            onChange={e => setLanguage(e.target.value as Language)}
            className="bg-transparent text-slate-200 focus:outline-none cursor-pointer text-xs"
          >
            <option value="en" className="bg-slate-900">EN</option>
            <option value="de" className="bg-slate-900">DE</option>
            <option value="ja" className="bg-slate-900">JA</option>
            <option value="zh-TW" className="bg-slate-900">ZH (繁)</option>
            <option value="zh-CN" className="bg-slate-900">ZH (简)</option>
          </select>
        </div>
      </div>
    </header>
  );
};
