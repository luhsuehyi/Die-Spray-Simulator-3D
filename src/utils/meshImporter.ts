import { DieModel } from '../types/die';

export interface ParsedMeshData {
  positions: Float32Array;
  normals: Float32Array;
  vertexCount: number;
  triangleCount: number;
  boundingBox: {
    min: [number, number, number];
    max: [number, number, number];
    size: [number, number, number];
  };
}

export function parseSTL(buffer: ArrayBuffer): ParsedMeshData {
  const isBinary = checkIsBinarySTL(buffer);
  if (isBinary) {
    return parseBinarySTL(buffer);
  } else {
    const text = new TextDecoder().decode(buffer);
    return parseAsciiSTL(text);
  }
}

function checkIsBinarySTL(buffer: ArrayBuffer): boolean {
  if (buffer.byteLength < 84) return false;
  const view = new DataView(buffer);
  const expectedTriangles = view.getUint32(80, true);
  const calculatedSize = 84 + expectedTriangles * 50;
  return Math.abs(buffer.byteLength - calculatedSize) < 100;
}

function parseBinarySTL(buffer: ArrayBuffer): ParsedMeshData {
  const view = new DataView(buffer);
  const triangleCount = view.getUint32(80, true);
  const vertexCount = triangleCount * 3;
  const positions = new Float32Array(vertexCount * 3);
  const normals = new Float32Array(vertexCount * 3);

  let offset = 84;
  let posIdx = 0;
  let normIdx = 0;

  let minX = Infinity, minY = Infinity, minZ = Infinity;
  let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;

  for (let i = 0; i < triangleCount; i++) {
    if (offset + 50 > buffer.byteLength) break;
    const nx = view.getFloat32(offset, true);
    const ny = view.getFloat32(offset + 4, true);
    const nz = view.getFloat32(offset + 8, true);
    offset += 12;

    for (let v = 0; v < 3; v++) {
      const vx = view.getFloat32(offset, true);
      const vy = view.getFloat32(offset + 4, true);
      const vz = view.getFloat32(offset + 8, true);
      offset += 12;

      positions[posIdx++] = vx;
      positions[posIdx++] = vy;
      positions[posIdx++] = vz;

      normals[normIdx++] = nx;
      normals[normIdx++] = ny;
      normals[normIdx++] = nz;

      if (vx < minX) minX = vx;
      if (vx > maxX) maxX = vx;
      if (vy < minY) minY = vy;
      if (vy > maxY) maxY = vy;
      if (vz < minZ) minZ = vz;
      if (vz > maxZ) maxZ = vz;
    }

    offset += 2; // attribute byte count
  }

  return {
    positions,
    normals,
    vertexCount,
    triangleCount,
    boundingBox: {
      min: [minX, minY, minZ],
      max: [maxX, maxY, maxZ],
      size: [maxX - minX, maxY - minY, maxZ - minZ]
    }
  };
}

function parseAsciiSTL(text: string): ParsedMeshData {
  const posArr: number[] = [];
  const normArr: number[] = [];
  const lines = text.split('\n');

  let currentNormal = [0, 0, 1];
  let minX = Infinity, minY = Infinity, minZ = Infinity;
  let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (line.startsWith('facet normal')) {
      const parts = line.split(/\s+/).slice(2).map(Number);
      currentNormal = [parts[0] || 0, parts[1] || 0, parts[2] || 1];
    } else if (line.startsWith('vertex')) {
      const p = line.split(/\s+/).slice(1).map(Number);
      const x = p[0] || 0;
      const y = p[1] || 0;
      const z = p[2] || 0;

      posArr.push(x, y, z);
      normArr.push(currentNormal[0], currentNormal[1], currentNormal[2]);

      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
      if (z < minZ) minZ = z;
      if (z > maxZ) maxZ = z;
    }
  }

  return {
    positions: new Float32Array(posArr),
    normals: new Float32Array(normArr),
    vertexCount: posArr.length / 3,
    triangleCount: posArr.length / 9,
    boundingBox: {
      min: [minX, minY, minZ],
      max: [maxX, maxY, maxZ],
      size: [maxX - minX, maxY - minY, maxZ - minZ]
    }
  };
}

export function createCustomDieModel(name: string, mesh: ParsedMeshData): DieModel {
  const size = mesh.boundingBox.size;
  const w = Math.max(300, Math.round(size[0] || 600));
  const h = Math.max(300, Math.round(size[1] || 500));
  const d = Math.max(100, Math.round(size[2] || 180));

  return {
    id: `custom-cad-${Date.now()}`,
    name: name.replace(/\.[^/.]+$/, ''),
    category: 'automotive',
    material: 'Custom Die Steel (CAD Imported)',
    operatingTempCelsius: 275,
    dimensions: {
      width: w,
      height: h,
      depth: d
    },
    fixedDieOffsetZ: -Math.round(d * 1.5),
    movableDieOffsetZ: Math.round(d * 1.5),
    dieOpeningDistance: Math.round(d * 3.5),
    features: [
      {
        id: 'cust-1',
        name: 'Imported Cavity Pocket',
        type: 'pocket',
        position: [0, 0, -20],
        dimensions: [w * 0.7, h * 0.7, d * 0.5],
        targetThicknessMicrons: 30,
        criticality: 'high'
      }
    ]
  };
}
