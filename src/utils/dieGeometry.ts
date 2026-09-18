import { DieModel, SurfaceCell } from '../types/die';

export function generateDieSurfaceCells(die: DieModel, resolution: number = 24): SurfaceCell[] {
  const cells: SurfaceCell[] = [];
  const { width, height } = die.dimensions;
  const stepX = width / resolution;
  const stepY = height / resolution;
  const halfW = width / 2;
  const halfH = height / 2;

  // Fixed Die Surface (facing +Z in mold coordinates, offset at fixedDieOffsetZ)
  for (let ix = 0; ix < resolution; ix++) {
    for (let iy = 0; iy < resolution; iy++) {
      const x = -halfW + (ix + 0.5) * stepX;
      const y = -halfH + (iy + 0.5) * stepY;

      // Base cavity depth with pockets
      let cavityZ = die.fixedDieOffsetZ;
      let targetMicrons = 25;
      let baseTemp = die.operatingTempCelsius;

      // Check features
      for (const feat of die.features) {
        const [fx, fy] = feat.position;
        const [fw, fh, fd] = feat.dimensions;
        if (Math.abs(x - fx) < fw / 2 && Math.abs(y - fy) < fh / 2) {
          cavityZ += (die.fixedDieOffsetZ < 0 ? -fd * 0.4 : fd * 0.4);
          targetMicrons = feat.targetThicknessMicrons;
          baseTemp += 35; // thermal hotspot in deep cavity
          break;
        }
      }

      cells.push({
        x,
        y,
        z: cavityZ,
        normal: [0, 0, 1],
        area: stepX * stepY,
        targetThickness: targetMicrons,
        currentThickness: 0,
        temperature: baseTemp,
        coolingRate: 0,
        targetSurface: 'fixed'
      });
    }
  }

  // Movable Die Surface (facing -Z, offset at movableDieOffsetZ)
  for (let ix = 0; ix < resolution; ix++) {
    for (let iy = 0; iy < resolution; iy++) {
      const x = -halfW + (ix + 0.5) * stepX;
      const y = -halfH + (iy + 0.5) * stepY;

      let cavityZ = die.movableDieOffsetZ;
      let targetMicrons = 28;
      let baseTemp = die.operatingTempCelsius + 15; // movable core often runs hotter

      // Core pin & ejector features
      for (const feat of die.features) {
        const [fx, fy] = feat.position;
        const [fw, fh, fd] = feat.dimensions;
        if (Math.abs(x - fx) < fw / 2 && Math.abs(y - fy) < fh / 2) {
          cavityZ += (die.movableDieOffsetZ > 0 ? -fd * 0.3 : fd * 0.3);
          targetMicrons = feat.targetThicknessMicrons + 5;
          baseTemp += 25;
          break;
        }
      }

      cells.push({
        x,
        y,
        z: cavityZ,
        normal: [0, 0, -1],
        area: stepX * stepY,
        targetThickness: targetMicrons,
        currentThickness: 0,
        temperature: baseTemp,
        coolingRate: 0,
        targetSurface: 'movable'
      });
    }
  }

  return cells;
}
