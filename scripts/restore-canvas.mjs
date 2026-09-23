#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const dir = __dirname;
const parts = [];
for (let i = 0; i < 16; i++) {
  const f = path.join(dir, `canvas-restore-part-${i}.b64`);
  if (!fs.existsSync(f)) break;
  parts.push(fs.readFileSync(f, 'utf8').trim());
}
if (!parts.length) {
  console.error('No canvas-restore-part-*.b64 files found');
  process.exit(1);
}
const buf = Buffer.from(parts.join(''), 'base64');
const out = path.join(dir, '../src/components/viewport/SimulationCanvas.tsx');
fs.writeFileSync(out, buf);
console.log('Restored', out, buf.length, 'bytes');
