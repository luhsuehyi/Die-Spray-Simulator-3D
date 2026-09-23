# CRITICAL: Restore SimulationCanvas.tsx

Merging the WebGL perf PR accidentally left `main` with a **stub** canvas (no 3D scene).

## Fix on phone (5 minutes)

1. Open the **good** file (full code):
   https://github.com/luhsuehyi/Die-Spray-Simulator-3D/blob/deaf2e0493f428e76eaebe9a7dfc3ffcbbe2d1aa/src/components/viewport/SimulationCanvas.tsx

2. Menu **⋯** → **Edit file** → Select all → **Copy**

3. Open **main** version:
   https://github.com/luhsuehyi/Die-Spray-Simulator-3D/blob/main/src/components/viewport/SimulationCanvas.tsx

4. **⋯** → **Edit file** → Select all → **Paste** → **Commit** to `main`

You should see hundreds of lines again (`WebGLRenderer`, `buildDcmDigitalTwin`, etc.).

## After that (optional wiring)

- GPU quality: `docs/WEBGL_PERF.md`
- Demo cameras: `docs/DEMO_CAMERA_WIRING.md`

Helpers already on main:
- `src/utils/renderQuality.ts`
- `src/components/viewport/RenderQualityControl.tsx`
- `src/utils/demoCameraPresets.ts`
