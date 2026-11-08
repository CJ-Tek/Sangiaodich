// Regenerates app icons from public/brand/vbnb-mark.svg.
// Run: node scripts/generate-brand-icons.mjs
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const root = path.resolve(import.meta.dirname, '..');
const markSvg = await readFile(path.join(root, 'public/brand/vbnb-mark.svg'));
const BACKGROUND = '#FFFFFF';

/**
 * `markWidth` is the mark's share of the canvas width. Solid icons keep the
 * mark inside the maskable safe zone (centre circle, 80% diameter).
 */
async function renderIcon(size, { markWidth, background }) {
  const width = Math.round(size * markWidth);
  const mark = await sharp(markSvg, { density: 1200 })
    .resize({ width, fit: 'inside' })
    .png()
    .toBuffer();

  return sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: background ?? { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([{ input: mark, gravity: 'centre' }])
    .png({ compressionLevel: 9 })
    .toBuffer();
}

function buildIco(pngs) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(pngs.length, 4);

  const entries = [];
  let offset = 6 + pngs.length * 16;
  for (const { size, data } of pngs) {
    const entry = Buffer.alloc(16);
    entry.writeUInt8(size >= 256 ? 0 : size, 0);
    entry.writeUInt8(size >= 256 ? 0 : size, 1);
    entry.writeUInt16LE(1, 4);
    entry.writeUInt16LE(32, 6);
    entry.writeUInt32LE(data.length, 8);
    entry.writeUInt32LE(offset, 12);
    entries.push(entry);
    offset += data.length;
  }

  return Buffer.concat([header, ...entries, ...pngs.map((p) => p.data)]);
}

const transparent = { markWidth: 0.96 };
const solid = { markWidth: 0.62, background: BACKGROUND };

const outputs = [
  ['public/icons/favicon-32.png', await renderIcon(32, transparent)],
  ['public/icons/apple-touch-icon.png', await renderIcon(180, { markWidth: 0.7, background: BACKGROUND })],
  ['public/icons/icon-192.png', await renderIcon(192, solid)],
  ['public/icons/icon-512.png', await renderIcon(512, solid)],
];

const icoSizes = [16, 32, 48];
const icoPngs = await Promise.all(
  icoSizes.map(async (size) => ({ size, data: await renderIcon(size, transparent) }))
);
outputs.push(['app/[locale]/favicon.ico', buildIco(icoPngs)]);

for (const [relative, data] of outputs) {
  await writeFile(path.join(root, relative), data);
  console.log(`${relative} (${data.length} bytes)`);
}
