# WebGL performance (feature/webgl-perf)

## Added modules

- `src/utils/renderQuality.ts` — Low / Medium / High presets + localStorage
- `src/components/viewport/RenderQualityControl.tsx` — corner GPU quality switch

## Wire into SimulationCanvas (summary)

1. Import quality helpers + control.
2. On init: `initRenderQualityFromStorage()`, apply pixel ratio / shadow map size from preset.
3. Mist: use `getRenderQualitySettings().mistParticleCount` instead of hard-coded 240.
4. Sub-grid: only add when `showSubGrid`.
5. Animate loop: track orbit delta; if idle and not playing/spraying, skip `renderer.render` (still rAF for responsiveness).
6. Subscribe to quality changes → re-apply `setPixelRatio` / shadows / particle budget.
7. Mount `<RenderQualityControl />` next to the canvas container.

## Presets

| | Low | Medium | High |
|--|-----|--------|------|
| Pixel ratio cap | 1 | 1.25 | 2 |
| Shadows | off | 1024 PCF | 2048 soft |
| Mist particles | 64 | 120 | 240 |
| Sub-grid | no | no | yes |
| Idle skip | yes | yes | yes |
