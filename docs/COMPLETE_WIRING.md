# Complete wiring (canvas restored on main)

Apply these changes to `src/components/viewport/SimulationCanvas.tsx` OR merge the PR that contains the fully wired file.

## Already on main
- Full 3D `SimulationCanvas`
- `src/utils/renderQuality.ts`
- `src/components/viewport/RenderQualityControl.tsx`
- `src/utils/demoCameraPresets.ts`
- WebM recorder + Demo UI

## Wire checklist
1. Import `RenderQualityControl`, `renderQuality` helpers, `getDemoCameraShot`
2. `cameraLookAtRef` + `needsRenderRef` + quality on renderer/keyLight/mist/subGrid
3. Demo phase uses `getDemoCameraShot(demoPhase, platenWidth)`
4. Mount `<RenderQualityControl />` beside canvas (host div separate from WebGL container)
5. Idle skip: only `renderer.render` when `needsRenderRef` or spray visible

## Verify
- Demo Mode → cameras frame die cavity (not empty sky)
- Bottom-right **GPU Low/Med/High**
- Record Demo → downloads `.webm`
