#!/usr/bin/env node
/** Reconstruct src/components/viewport/SimulationCanvas.tsx from base64 parts. */
import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const parts = [0, 1, 2].map((i) =>
  readFileSync(join(__dirname, `canvas-b64-part-${i}.txt`), 'utf8').trim()
);
const buf = Buffer.from(parts.join(''), 'base64');
const out = join(__dirname, '../src/components/viewport/SimulationCanvas.tsx');
writeFileSync(out, buf);
console.log('Restored', out, '(' + buf.length + ' bytes)');
