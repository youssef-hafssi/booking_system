import { Resvg } from '@resvg/resvg-js';
import { readFile, writeFile } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function resolvePathMaybeRelative(p) {
  if (!p) return null;
  return path.isAbsolute(p) ? p : path.resolve(__dirname, p);
}

const argSvg = process.argv[2] || '../ARCHITECTURE_MVC.svg';
const argPng = process.argv[3] || null;
const argJpg = process.argv[4] || null;

const svgPath = resolvePathMaybeRelative(argSvg);
const parsed = path.parse(svgPath);
const outPng = resolvePathMaybeRelative(argPng) || path.join(parsed.dir, `${parsed.name}.png`);
const outJpg = resolvePathMaybeRelative(argJpg) || path.join(parsed.dir, `${parsed.name}.jpg`);

try {
  const svg = await readFile(svgPath, 'utf-8');

  const resvg = new Resvg(svg, {
    fitTo: { mode: 'width', value: 2800 },
    font: {
      loadSystemFonts: true,
      defaultFontFamily: 'Segoe UI'
    },
    background: 'white'
  });

  const pngData = resvg.render();
  const pngBuffer = pngData.asPng();

  await writeFile(outPng, pngBuffer);

  const jpgBuffer = await sharp(pngBuffer).jpeg({ quality: 92 }).toBuffer();
  await writeFile(outJpg, jpgBuffer);

  console.log('OK Exported files:', outPng, 'and', outJpg);
} catch (err) {
  console.error('Export failed:', err);
  process.exit(1);
} 