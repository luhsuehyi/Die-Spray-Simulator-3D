import React from 'react';
import {
  Globe,
  SlidersHorizontal,
  Compass,
  Cpu,
  Layers,
  FileCode2,
  Video
} from 'lucide-react';
import { useSimulationStore } from '../../store/simulationStore';
import { Language, translations } from '../../utils/i18n';

export const HeaderNavbar: React.FC = () => {
  const {
    language,
    setLanguage,
    appMode,
    setAppMode,
    robot,
    trajectoryPlan,
    setIsScenarioCompareOpen,
    setIsBestPositionAdvisorOpen,
    setIsCodeExportOpen,
    setIsVideoExportOpen
  } = useSimulationStore();

  const t = translations[language] || translations['en'];

  return (
    <header className="h-12 bg-slate-950 border-b border-slate-800 flex items-center justify-between px-3 z-20 shrink-0 select-none text-slate-200">
      {/* 1. Left: Brand & Mode Toggle */}
      <div className="flex items-center gap-2.5">
        <div className="w-7 h-7 rounded bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center text-white shadow-xs">
          <Cpu className="w-4 h-4" />
        </div>
        <div className="flex items-baseline gap-2">
          <h1 className="text-xs font-bold tracking-tight text-white font-mono uppercase">
            {t.appTitle}
          </h1>
          <span className="hidden sm:inline px-1.5 py-0.2 text-[9.5px] font-mono font-semibold bg-blue-950 text-blue-400 border border-blue-850 rounded">
            PRO 3D
          </span>
        </div>

        {/* Primary Mode Switcher */}
        <div className="hidden sm:flex items-center bg-slate-900 border border-slate-800 rounded p-0.5 ml-2 text-xs">
          <button
            id="mode-manufacturing-btn"
            onClick={() => setAppMode('manufacturing')}
            className={`px-2 py-0.5 rounded text-[11px] font-medium transition cursor-pointer ${
              appMode === 'manufacturing'
                ? 'bg-blue-600 text-white font-semibold shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Manufacturing
          </button>
          <button
            id="mode-engineer-btn"
            onClick={() => setAppMode('engineering')}
            className={`px-2 py-0.5 rounded text-[11px] font-medium transition cursor-pointer flex items-center gap-1 ${
              appMode === 'engineering'
                ? 'bg-blue-600 text-white font-semibold shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <SlidersHorizontal className="w-2.5 h-2.5" />
            Engineer
          </button>
        </div>
      </div>

      {/* 2. Center: Quick Actions & Optimization */}
      <div className="hidden md:flex items-center gap-1.5">
        {/* Find Best Position Advisor Button */}
        <button
          id="header-find-position-btn"
          onClick={() => setIsBestPositionAdvisorOpen(true)}
          className="flex items-center gap-1 px-2.5 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded text-[11px] font-medium transition cursor-pointer"
        >
          <Compass className="w-3 h-3 text-amber-400" />
          <span>Robot Mount Advisor</span>
        </button>

        {/* Compare Scenarios Button */}
        <button
          id="header-compare-scenarios-btn"
          onClick={() => setIsScenarioCompareOpen(true)}
          className="flex items-center gap-1 px-2.5 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded text-[11px] font-medium text-slate-300 transition cursor-pointer"
        >
          <Layers className="w-3 h-3 text-blue-400" />
          <span>Compare Scenarios</span>
        </button>

        {/* Machine & Cycle Badges */}
        <div className="flex items-center gap-1.5 bg-slate-900/80 border border-slate-800/80 rounded px-2 py-0.5 text-[11px] font-mono text-slate-400">
          <span>MOUNT: <strong className="text-slate-200 uppercase">{robot.mountOrientation}</strong></span>
          <span className="text-slate-600">|</span>
          <span>CYCLE: <strong className="text-emerald-400">{trajectoryPlan.totalDurationSec}s</strong></span>
        </div>
      </div>

      {/* 3. Right: Media Export, Languages & Controls */}
      <div className="flex items-center gap-1.5">
        {/* Export Robot Code */}
        <button
          id="header-code-export-btn"
          onClick={() => setIsCodeExportOpen(true)}
          className="flex items-center gap-1 px-2 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded text-[11px] font-medium text-slate-300 transition cursor-pointer"
        >
          <FileCode2 className="w-3 h-3 text-emerald-400" />
          <span className="hidden sm:inline">Code</span>
        </button>

        {/* Media Record/Snapshot button */}
        <button
          id="header-video-export-btn"
          onClick={() => setIsVideoExportOpen(true)}
          className="flex items-center gap-1 px-2 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded text-[11px] font-medium text-slate-300 transition cursor-pointer"
          title="Record Video & Snapshot"
        >
          <Video className="w-3 h-3 text-rose-400" />
          <span className="hidden sm:inline">Media</span>
        </button>

        {/* Internationalization Language Switcher */}
        <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded px-1.5 py-0.5 text-[11px]">
          <Globe className="w-3 h-3 text-slate-400" />
          <select
            id="app-language-selector"
            value={language}
            onChange={e => setLanguage(e.target.value as Language)}
            className="bg-transparent text-slate-200 focus:outline-none cursor-pointer text-[11px]"
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
