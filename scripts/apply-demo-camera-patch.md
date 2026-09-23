# Demo camera + recorder fixes

## 1. videoRecorder.ts (already on branch)
Native MediaRecorder + WebM via `canvas.captureStream(30)`. No server H.264 encode — downloads `demo-recording-YYYY-MM-DD.webm` on stop.

## 2. SimulationCanvas.tsx camera framing

Apply these changes on top of `main`'s SimulationCanvas (or recover from git):

### A. After `cameraTargetOrbitRef`, add:
```ts
  const cameraLookAtRef = useRef({ x: 0, y: 80, z: 0 });
  const cameraLookAtTargetRef = useRef({ x: 0, y: 80, z: 0 });
```

### B. In the animate loop, replace lookAt(0,100,0) with:
```ts
        const lt = cameraLookAtRef.current;
        const ltt = cameraLookAtTargetRef.current;
        lt.x += (ltt.x - lt.x) * 0.09;
        lt.y += (ltt.y - lt.y) * 0.09;
        lt.z += (ltt.z - lt.z) * 0.09;
        cameraRef.current.position.set(cx + lt.x, cy + lt.y, cz + lt.z);
        cameraRef.current.lookAt(lt.x, lt.y, lt.z);
```

### C. Replace the demoPhase switch with look-at targets:
- Phase 0 Establishing: high 3/4, lookAt (0,120,80), radius cellR*1.15
- Phase 1 Approach: theta 0.18π, phi π/2.55, r 1450, lookAt robot corridor (80,420,40)
- Phase 2 Spray: theta 0.08π, phi π/2.25, r 780, lookAt (0,40,90)
- Phase 3 Coverage: theta -0.06π, phi π/2.12, r 980, lookAt cavity (0,60,120)
- Phase 4 Retract: theta 0.35π, phi π/2.7, r 1580, lookAt (40,280,60)
- Phase 5 Overview: theta 0.68π, phi π/3.25, r cellR*1.08, lookAt (0,140,60)

Full patched file is available in the conversation artifacts as `SimulationCanvas.restored.tsx`.

### Recover full canvas from main if branch was damaged:
```bash
git checkout main -- src/components/viewport/SimulationCanvas.tsx
# then apply A/B/C above
```
