# Wire die-cavity camera framing into SimulationCanvas

`src/utils/demoCameraPresets.ts` is already on this branch.

Apply these **4 small edits** to `src/components/viewport/SimulationCanvas.tsx`:

## 1. Import

After `import { buildCastPartMesh } from './castPartSceneBuilder';` add:

```ts
import { getDemoCameraShot } from '../../utils/demoCameraPresets';
```

## 2. Refs (after `cameraTargetOrbitRef`)

```ts
  const cameraLookAtRef = useRef({ x: 0, y: 80, z: 0 });
  const cameraLookAtTargetRef = useRef({ x: 0, y: 80, z: 0 });
```

## 3. In the animation loop, replace

```ts
        cameraRef.current.position.set(cx, cy, cz);
        cameraRef.current.lookAt(0, 100, 0);
```

with:

```ts
        const lt = cameraLookAtRef.current;
        const ltt = cameraLookAtTargetRef.current;
        lt.x += (ltt.x - lt.x) * 0.09;
        lt.y += (ltt.y - lt.y) * 0.09;
        lt.z += (ltt.z - lt.z) * 0.09;
        cameraRef.current.position.set(cx + lt.x, cy + lt.y, cz + lt.z);
        cameraRef.current.lookAt(lt.x, lt.y, lt.z);
```

## 4. Replace the whole demo `switch (demoPhase) { ... }` useEffect with:

```ts
  useEffect(() => {
    if (!isDemoMode || !cameraRef.current) return;
    const shot = getDemoCameraShot(demoPhase, machine.platenWidth);
    cameraTargetOrbitRef.current = {
      theta: shot.theta,
      phi: shot.phi,
      radius: shot.radius
    };
    cameraLookAtTargetRef.current = { ...shot.lookAt };
  }, [isDemoMode, demoPhase, machine.platenWidth]);
```

## Shots

| Phase | Focus |
|-------|--------|
| 0 Establishing | High wide cell |
| 1 Approach | Robot corridor into daylight |
| 2 Spray | EOAT + die face |
| 3 Coverage | Cavity faces |
| 4 Retract | Exit path |
| 5 Overview | Full cell opposite angle |
