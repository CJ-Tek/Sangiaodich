// Regenerates social share images (1200x630) in public/og/.
// Run: node scripts/generate-og-images.mjs
// Runs outside Next on purpose: next/og renders through sharp, which cannot load SVG
// inside the Windows dev server.
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { createElement as h } from 'react';
import { ImageResponse } from 'next/og.js';

const root = path.resolve(import.meta.dirname, '..');
const SITE_HOST = 'sangiaodich.vercel.app';

const copy = {
  vi: {
    title: 'Sàn giao dịch villa thông minh',
    subtitle: 'Kết nối Chủ villa, Sale & Khách hàng',
  },
  en: {
    title: 'Smart villa marketplace',
    subtitle: 'Connecting Owners, Sales & Guests',
  },
};

/** Satori needs TTF/OTF; Google serves TTF to clients without a browser UA. */
async function loadFont(text) {
  const cssUrl = `https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@700&text=${encodeURIComponent(text)}`;
  const css = await (await fetch(cssUrl)).text();
  const fontUrl = css.match(/src: url\((.+?)\) format\('(?:opentype|truetype)'\)/)?.[1];
  if (!fontUrl) throw new Error('Could not resolve Plus Jakarta Sans TTF from Google Fonts');
  return (await fetch(fontUrl)).arrayBuffer();
}

const logoSvg = await readFile(path.join(root, 'public/brand/vbnb-logo.svg'), 'utf8');
const logoSrc = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(logoSvg)}`;
const font = await loadFont(
  Object.values(copy).map((c) => c.title + c.subtitle).join('') + SITE_HOST
);

await mkdir(path.join(root, 'public/og'), { recursive: true });

for (const [locale, { title, subtitle }] of Object.entries(copy)) {
  const element = h(
    'div',
    {
      style: {
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '72px 80px',
        background: 'linear-gradient(135deg, #FFFFFF 0%, #FAFAF8 55%, #ECF7F6 100%)',
        fontFamily: 'Jakarta',
      },
    },
    h('img', { src: logoSrc, width: 374, height: 80 }),
    h(
      'div',
      { style: { display: 'flex', flexDirection: 'column', gap: 20 } },
      h(
        'div',
        { style: { fontSize: 72, color: '#161616', letterSpacing: '-0.03em', lineHeight: 1.1 } },
        title
      ),
      h('div', { style: { fontSize: 40, color: '#10A18E', lineHeight: 1.25 } }, subtitle)
    ),
    h(
      'div',
      { style: { display: 'flex', alignItems: 'center', gap: 16 } },
      h('div', { style: { width: 48, height: 6, borderRadius: 3, background: '#10A18E' } }),
      h('div', { style: { fontSize: 26, color: '#5F625D' } }, SITE_HOST)
    )
  );

  const response = new ImageResponse(element, {
    width: 1200,
    height: 630,
    fonts: [{ name: 'Jakarta', data: font, weight: 700, style: 'normal' }],
  });
  const file = path.join(root, `public/og/vbnb-og-${locale}.png`);
  await writeFile(file, Buffer.from(await response.arrayBuffer()));
  console.log(`public/og/vbnb-og-${locale}.png`);
}
