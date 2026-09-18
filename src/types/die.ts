export interface DieDimension {
  width: number;  // mm (X-axis)
  height: number; // mm (Y-axis)
  depth: number;  // mm (Z-axis, cavity depth)
}

export interface CavityFeature {
  id: string;
  name: string;
  type: 'pocket' | 'rib' | 'core_pin' | 'gate' | 'overflow' | 'ejector_boss';
  position: [number, number, number]; // relative to die center [x, y, z] mm
  dimensions: [number, number, number]; // [w, h, d]
  targetThicknessMicrons: number; // target lubricant thickness in µm (e.g. 15-40 µm)
  criticality: 'high' | 'medium' | 'normal';
}

export interface DieModel {
  id: string;
  name: string;
  category: 'automotive' | 'aerospace' | 'electronics' | 'energy';
  dimensions: DieDimension;
  material: string; // e.g. 'H13 Tool Steel (1.2344)'
  operatingTempCelsius: number; // e.g. 260 - 320 °C
  features: CavityFeature[];
  fixedDieOffsetZ: number; // mm
  movableDieOffsetZ: number; // mm
  dieOpeningDistance: number; // mm (daylight stroke)
  customMeshUrl?: string;
  previewThumbnail?: string;
}

export interface SurfaceCell {
  x: number;
  y: number;
  z: number;
  normal: [number, number, number];
  area: number; // mm^2
  targetThickness: number; // µm
  currentThickness: number; // µm
  temperature: number; // °C
  coolingRate: number; // °C/sec
  targetSurface: 'fixed' | 'movable' | 'slider';
}
