import React from 'react';
import {
  Globe,
  Sparkles,
  Play,
  SlidersHorizontal,
  Video,
  MonitorPlay,
  Cpu
} from 'lucide-react';
import { useSimulationStore } from '../../store/simulationStore';
import { Language, translations, persistLanguage } from '../../utils/i18n';

export const HeaderNavbar: React.FC = () => {
  const {
    language,
    setLanguage,
    primaryAction,
    setPrimaryAction,
    isDemoMode,
    setIsDemoMode,
    setIsVideoExportOpen,
    setIsPlaying
  } = useSimulationStore();

  const t = translations[language] || translations.en;

  return (
    <header className="h-13 bg-slate-950/95 backdrop-blur-md border-b border-slate-800/80 flex items-center justify-between px-4 z-20 shrink-0 select-none text-slate-200">
      {/* 1. Left: Brand Title */}
      <div className="flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
          <Cpu className="w-4 h-4" />
        </div>
        <div className="flex items-baseline gap-2">
          <h1 className="text-xs sm:text-sm font-bold tracking-tight text-white font-mono uppercase">
            Tovonn AI Die Spray 3D
          </h1>
          <span className="hidden md:inline px-1.5 py-0.2 text-[9px] font-mono font-semibold bg-blue-950/60 text-blue-400 border border-blue-800/60 rounded">
            HPDC TWIN
          </span>
        </div>
      </div>

      {/* 2. Center: 3 Primary Actions: AI Auto Plan | Simulation | Advanced Edit */}
      <nav className="flex items-center bg-slate-900/90 border border-slate-800 rounded-xl p-1 shadow-inner">
        {/* Action 1: AI Auto Plan */}
        <button
          id="nav-ai-auto-plan-btn"
          onClick={() => {
            setPrimaryAction('ai-plan');
          }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
            primaryAction === 'ai-plan'
              ? 'bg-blue-600 text-white font-semibold shadow-md shadow-blue-900/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>{t.aiAutoPlan}</span>
        </button>

        {/* Action 2: Simulation */}
        <button
          id="nav-simulation-btn"
          onClick={() => {
            setPrimaryAction('simulation');
          }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
            primaryAction === 'simulation'
              ? 'bg-blue-600 text-white font-semibold shadow-md shadow-blue-900/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <Play className="w-3.5 h-3.5" />
          <span>{t.simulation}</span>
        </button>

        {/* Action 3: Advanced Edit */}
        <button
          id="nav-advanced-edit-btn"
          onClick={() => {
            setPrimaryAction('advanced-edit');
          }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
            primaryAction === 'advanced-edit'
              ? 'bg-blue-600 text-white font-semibold shadow-md shadow-blue-900/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span>{t.advancedEdit}</span>
        </button>
      </nav>

      {/* 3. Right: Demo Mode, Record Video & Language */}
      <div className="flex items-center gap-2">
        {/* Demo Mode Button */}
        <button
          id="header-demo-mode-btn"
          onClick={() => {
            setPrimaryAction('simulation');
            setIsDemoMode(true);
            setIsPlaying(true);
          }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition cursor-pointer ${
            isDemoMode
              ? 'bg-blue-500/20 text-blue-300 border-blue-500/40 font-semibold'
              : 'bg-slate-900/80 hover:bg-slate-800 text-slate-300 border-slate-800'
          }`}
          title={t.demoMode}
        >
          <MonitorPlay className="w-3.5 h-3.5 text-blue-400" />
          <span className="hidden sm:inline">{t.demoMode}</span>
        </button>

        {/* Record Video button */}
        <button
          id="header-video-export-btn"
          onClick={() => setIsVideoExportOpen(true)}
          className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-900/80 hover:bg-slate-800 border border-slate-800 rounded-lg text-xs font-medium text-slate-300 transition cursor-pointer"
          title={t.recordDemoVideo}
        >
          <Video className="w-3.5 h-3.5 text-rose-400" />
          <span className="hidden sm:inline">{t.record}</span>
        </button>

        {/* Internationalization Language Switcher */}
        <div className="flex items-center gap-1 bg-slate-900/80 border border-slate-800 rounded-lg px-2 py-1 text-xs">
          <Globe className="w-3 h-3 text-slate-400" />
          <select
            id="app-language-selector"
            value={language}
            onChange={e => { const next = e.target.value as Language; setLanguage(next); persistLanguage(next); }}
            className="bg-transparent text-slate-200 focus:outline-none cursor-pointer text-xs"
          >
            <option value="en" className="bg-slate-900">EN</option>
            <option value="zh-TW" className="bg-slate-900">繁中</option>
          </select>
        </div>
      </div>
    </header>
  );
};
