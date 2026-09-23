# Quick recovery (GitHub website)

If `SimulationCanvas.tsx` was broken on a feature branch:

1. Open: https://github.com/luhsuehyi/Die-Spray-Simulator-3D
2. Switch branch dropdown to **main** (top left, usually says "main").
3. Go to `src/components/viewport/SimulationCanvas.tsx`.
4. That file on **main** is the good full version.
5. To use the video fix: checkout branch `feature/visual-enrichment-phase1` only for `src/utils/videoRecorder.ts` — or merge carefully after restoring canvas from main.

## Recommended: restore canvas on feature branch via website

1. Open main file:
   https://github.com/luhsuehyi/Die-Spray-Simulator-3D/blob/main/src/components/viewport/SimulationCanvas.tsx
2. Click **Raw** → Select all (Ctrl+A) → Copy.
3. Switch to branch `feature/visual-enrichment-phase1`.
4. Open the same path on that branch → Edit (pencil) → Select all → Paste → Commit.

## Video recorder

Already fixed on `feature/visual-enrichment-phase1` in `src/utils/videoRecorder.ts` (WebM download, no encode freeze).
