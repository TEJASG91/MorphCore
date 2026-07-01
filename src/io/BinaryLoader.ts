import type { TargetData } from '../morph/types';

/**
 * The on-disk format for baked particle targets. From M3 the offline asset pipeline writes
 * these `.bin` files and the runtime only ever READS them. Float32 binary, not JSON:
 * smaller, parses instantly, uploads straight to the GPU.
 *
 * The header is VERSIONED so the baking algorithm can evolve without silently corrupting
 * already-baked assets — the loader rejects a mismatched format version instead of
 * misreading it. `boundsMin/Max` let a scene frame/scale without scanning every point;
 * `generatorVersion` lets tooling detect stale bakes.
 *
 * Layout (little-endian):
 *   [magic u32 'PTGT'][formatVersion u32][generatorVersion u32][count u32]   (16 bytes)
 *   [boundsMin x,y,z f32][boundsMax x,y,z f32]                                (24 bytes)
 *   [positions f32 × count*3][colors f32 × count*3][sizes f32 × count]
 */
const MAGIC = 0x54475450; // 'PTGT'
export const FORMAT_VERSION = 2;
const HEADER_BYTES = 40;

export interface TargetMeta {
  formatVersion: number;
  generatorVersion: number;
  count: number;
  boundsMin: [number, number, number];
  boundsMax: [number, number, number];
}

export function encodeTargets(data: TargetData, generatorVersion = 1): ArrayBuffer {
  const c = data.count;

  let minX = Infinity,
    minY = Infinity,
    minZ = Infinity;
  let maxX = -Infinity,
    maxY = -Infinity,
    maxZ = -Infinity;
  for (let i = 0; i < c; i++) {
    const x = data.positions[i * 3],
      y = data.positions[i * 3 + 1],
      z = data.positions[i * 3 + 2];
    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (z < minZ) minZ = z;
    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;
    if (z > maxZ) maxZ = z;
  }

  const buf = new ArrayBuffer(HEADER_BYTES + c * 7 * 4);
  const dv = new DataView(buf);
  dv.setUint32(0, MAGIC, true);
  dv.setUint32(4, FORMAT_VERSION, true);
  dv.setUint32(8, generatorVersion, true);
  dv.setUint32(12, c, true);
  dv.setFloat32(16, minX, true);
  dv.setFloat32(20, minY, true);
  dv.setFloat32(24, minZ, true);
  dv.setFloat32(28, maxX, true);
  dv.setFloat32(32, maxY, true);
  dv.setFloat32(36, maxZ, true);

  const f = new Float32Array(buf, HEADER_BYTES);
  f.set(data.positions.subarray(0, c * 3), 0);
  f.set(data.colors.subarray(0, c * 3), c * 3);
  f.set(data.sizes.subarray(0, c), c * 6);
  return buf;
}

export function decodeTargets(buf: ArrayBuffer): { data: TargetData; meta: TargetMeta } {
  const dv = new DataView(buf);
  if (dv.getUint32(0, true) !== MAGIC) throw new Error('Not a PTGT target file');

  const formatVersion = dv.getUint32(4, true);
  if (formatVersion !== FORMAT_VERSION) {
    throw new Error(
      `Unsupported PTGT format v${formatVersion} (loader expects v${FORMAT_VERSION}). Re-bake the asset.`,
    );
  }
  const generatorVersion = dv.getUint32(8, true);
  const count = dv.getUint32(12, true);
  const boundsMin: [number, number, number] = [
    dv.getFloat32(16, true),
    dv.getFloat32(20, true),
    dv.getFloat32(24, true),
  ];
  const boundsMax: [number, number, number] = [
    dv.getFloat32(28, true),
    dv.getFloat32(32, true),
    dv.getFloat32(36, true),
  ];

  const f = new Float32Array(buf, HEADER_BYTES);
  const data: TargetData = {
    count,
    positions: f.slice(0, count * 3),
    colors: f.slice(count * 3, count * 6),
    sizes: f.slice(count * 6, count * 7),
  };
  return { data, meta: { formatVersion, generatorVersion, count, boundsMin, boundsMax } };
}

/** Runtime path (M3+): fetch a pre-baked .bin and decode it. */
export async function loadTargets(url: string): Promise<{ data: TargetData; meta: TargetMeta }> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to load ${url}: ${res.status}`);
  return decodeTargets(await res.arrayBuffer());
}
