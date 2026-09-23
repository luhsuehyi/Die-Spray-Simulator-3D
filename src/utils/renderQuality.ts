/**
 * WebGL render quality tiers for the die-spray digital twin viewport.
 * Controls pixel ratio, shadows, mist density, and secondary grid.
 */

export type RenderQualityLevel = 'low' | 'medium' | 'high';

export interface RenderQualitySettings {
  level: RenderQualityLevel;
  /** Cap on devicePixelRatio */
  maxPixelRatio: number;
  antialias: boolean;
  shadowsEnabled: boolean;
  shadowMapSize: number;
  softShadows: boolean;
  mistParticleCount: number;
  showSubGrid: boolean;
  /** Skip frames when camera/scene idle (saves GPU) */
  idleSkipEnabled: boolean;
  /** Orbit delta below this = settled */
  orbitSettleEpsilon: number;
}

const PRESETS: Record<RenderQualityLevel, Omit<RenderQualitySettings, 'level'>> = {
  low: {
    maxPixelRatio: 1,
    antialias: false,
    shadowsEnabled: false,
    shadowMapSize: 512,
    softShadows: false,
    mistParticleCount: 64,
    showSubGrid: false,
    idleSkipEnabled: true,
    orbitSettleEpsilon: 0.0008
  },
  medium: {
    maxPixelRatio: 1.25,
    antialias: true,
    shadowsEnabled: true,
    shadowMapSize: 1024,
    softShadows: false,
    mistParticleCount: 120,
    showSubGrid: false,
    idleSkipEnabled: true,
    orbitSettleEpsilon: 0.0005
  },
  high: {
    maxPixelRatio: 2,
    antialias: true,
    shadowsEnabled: true,
    shadowMapSize: 2048,
    softShadows: true,
    mistParticleCount: 240,
    showSubGrid: true,
    idleSkipEnabled: true,
    orbitSettleEpsilon: 0.00035
  }
};

let currentLevel: RenderQualityLevel = 'medium';
const listeners = new Set<() => void>();

function detectDefaultLevel(): RenderQualityLevel {
  if (typeof navigator === 'undefined') return 'medium';
  const cores = navigator.hardwareConcurrency || 4;
  const mem = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
  // Prefer medium on typical laptops; high only when clearly capable
  if (cores <= 4 || (mem !== undefined && mem <= 4)) return 'low';
  if (cores >= 8 && (mem === undefined || mem >= 8)) return 'high';
  return 'medium';
}

export function getRenderQualityLevel(): RenderQualityLevel {
  return currentLevel;
}

export function getRenderQualitySettings(): RenderQualitySettings {
  return { level: currentLevel, ...PRESETS[currentLevel] };
}

export function setRenderQualityLevel(level: RenderQualityLevel): void {
  if (level === currentLevel) return;
  currentLevel = level;
  try {
    localStorage.setItem('die-spray-render-quality', level);
  } catch {
    /* ignore */
  }
  listeners.forEach((fn) => fn());
}

export function initRenderQualityFromStorage(): RenderQualityLevel {
  try {
    const saved = localStorage.getItem('die-spray-render-quality') as RenderQualityLevel | null;
    if (saved === 'low' || saved === 'medium' || saved === 'high') {
      currentLevel = saved;
      return currentLevel;
    }
  } catch {
    /* ignore */
  }
  currentLevel = detectDefaultLevel();
  return currentLevel;
}

export function subscribeRenderQuality(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/** Apply static renderer + shadow flags (call when quality changes or on init). */
export function applyRendererQuality(
  renderer: {
    setPixelRatio: (n: number) => void;
    shadowMap: { enabled: boolean; type: number; mapSize?: { set: (w: number, h: number) => void } };
  },
  THREE: { PCFShadowMap: number; PCFSoftShadowMap: number; BasicShadowMap: number },
  keyLight?: { shadow: { mapSize: { set: (w: number, h: number) => void } } } | null
): RenderQualitySettings {
  const q = getRenderQualitySettings();
  const dpr =
    typeof window !== 'undefined'
      ? Math.min(window.devicePixelRatio || 1, q.maxPixelRatio)
      : q.maxPixelRatio;
  renderer.setPixelRatio(dpr);
  renderer.shadowMap.enabled = q.shadowsEnabled;
  if (q.shadowsEnabled) {
    renderer.shadowMap.type = q.softShadows ? THREE.PCFSoftShadowMap : THREE.PCFShadowMap;
  } else {
    renderer.shadowMap.type = THREE.BasicShadowMap;
  }
  if (keyLight && q.shadowsEnabled) {
    keyLight.shadow.mapSize.set(q.shadowMapSize, q.shadowMapSize);
  }
  return q;
}
