import React, { useEffect, useState } from 'react';
import {
  getRenderQualityLevel,
  setRenderQualityLevel,
  subscribeRenderQuality,
  initRenderQualityFromStorage,
  RenderQualityLevel
} from '../../utils/renderQuality';

const LEVELS: { id: RenderQualityLevel; label: string; title: string }[] = [
  { id: 'low', label: 'Low', title: 'Fast: no soft shadows, 1x pixel ratio' },
  { id: 'medium', label: 'Med', title: 'Balanced shadows + 1.25x pixel ratio' },
  { id: 'high', label: 'High', title: 'Best quality: soft shadows, up to 2x DPR' }
];

/** Compact quality switch for the viewport corner. */
export const RenderQualityControl: React.FC = () => {
  const [level, setLevel] = useState<RenderQualityLevel>(() => initRenderQualityFromStorage());

  useEffect(() => {
    return subscribeRenderQuality(() => setLevel(getRenderQualityLevel()));
  }, []);

  return (
    <div
      className="absolute bottom-3 right-3 z-20 pointer-events-auto flex items-center gap-1 rounded-lg bg-slate-950/80 border border-slate-700/60 px-1.5 py-1 shadow-lg backdrop-blur-sm"
      title="WebGL render quality"
    >
      <span className="text-[9px] font-mono uppercase tracking-wider text-slate-500 px-1">GPU</span>
      {LEVELS.map((l) => (
        <button
          key={l.id}
          type="button"
          title={l.title}
          onClick={() => setRenderQualityLevel(l.id)}
          className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold transition cursor-pointer ${
            level === l.id
              ? 'bg-cyan-600/40 text-cyan-200 border border-cyan-500/40'
              : 'text-slate-400 hover:text-slate-200 border border-transparent hover:bg-slate-800/80'
          }`}
        >
          {l.label}
        </button>
      ))}
    </div>
  );
};
