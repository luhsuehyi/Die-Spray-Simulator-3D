# Phase 1 Visual Enrichment

## Landed on branch `feature/visual-enrichment-phase1`

### 1. `src/index.css`
- Design tokens (palette, glass, accents)
- Glass panel utilities (`.glass-panel`, `.glass-panel-strong`)
- Cinematic animations: `demo-title-in/out`, `pulse-soft`, `glow-breathe`
- Demo timeline range slider polish
- Soft vignette (`.demo-vignette`)
- Phase progress transition

### 2. `src/components/demo/DemoPresentationMode.tsx`
- Soft vignette overlay
- Animated center phase title cards (Phase N of 6 + short name + description)
- Glass-panel branding card with live indicator
- Gradient progress bar under timeline
- Refined camera shot pills with glow on active
- Cleaner record / exit actions

### 3. Lighting tweaks (apply to `SimulationCanvas.tsx` if not yet merged)
```
scene.fog density: 0.00018 → 0.00022
toneMappingExposure: 1.1 → 1.18
ambient intensity: 0.45 → 0.38
key light: warmer + 1.45 → 1.55
fill: 0.4 → 0.48 | rim: 0.55 → 0.62
die spot: warmer, 1.4 → 1.65, slightly wider
spray cone opacity: 0.35 → 0.28
mist: size 5.2, opacity 0.78, sizeAttenuation
```

## How to preview
```bash
git fetch origin
git checkout feature/visual-enrichment-phase1
npm install # or bun
npm run dev
```
Open Demo Mode from the header.
