/**
 * Demo cinematic camera shots — orbit (theta/phi/radius) + lookAt target in world mm.
 * Framed so each phase clearly shows the die cavity, open daylight, and spray robot path.
 */

export interface DemoCameraShot {
  theta: number;
  phi: number;
  radius: number;
  lookAt: { x: number; y: number; z: number };
}

/**
 * @param phase 0..5 demo phase index
 * @param platenWidth machine platen width (mm) — scales wide establishing shots
 */
export function getDemoCameraShot(phase: number, platenWidth: number): DemoCameraShot {
  const cellR = Math.max(2200, platenWidth * 2.4);

  // Open-die parting / cavity center (daylight between fixed & movable halves)
  const cavity = { x: 0, y: 60, z: 120 };
  // Top-mount robot approach corridor above the die
  const robotCorridor = { x: 80, y: 420, z: 40 };

  switch (phase) {
    case 0:
      // Establishing — high wide 3/4 of the full cell
      return {
        theta: Math.PI * 0.28,
        phi: Math.PI / 3.4,
        radius: cellR * 1.15,
        lookAt: { x: 0, y: 120, z: 80 }
      };
    case 1:
      // Approach — medium angle into open platen daylight + descending arm
      return {
        theta: Math.PI * 0.18,
        phi: Math.PI / 2.55,
        radius: 1450,
        lookAt: { ...robotCorridor }
      };
    case 2:
      // Spray — close-up on EOAT nozzle + die face
      return {
        theta: Math.PI * 0.08,
        phi: Math.PI / 2.25,
        radius: 780,
        lookAt: { x: 0, y: 40, z: 90 }
      };
    case 3:
      // Coverage — into cavity faces (fixed + movable)
      return {
        theta: -Math.PI * 0.06,
        phi: Math.PI / 2.12,
        radius: 980,
        lookAt: { ...cavity }
      };
    case 4:
      // Retract — pull back along robot exit path
      return {
        theta: Math.PI * 0.35,
        phi: Math.PI / 2.7,
        radius: 1580,
        lookAt: { x: 40, y: 280, z: 60 }
      };
    case 5:
      // Final overview — opposite high 3/4 of complete cell
      return {
        theta: Math.PI * 0.68,
        phi: Math.PI / 3.25,
        radius: cellR * 1.08,
        lookAt: { x: 0, y: 140, z: 60 }
      };
    default:
      return {
        theta: Math.PI / 4,
        phi: Math.PI / 3.2,
        radius: cellR,
        lookAt: { x: 0, y: 80, z: 0 }
      };
  }
}
