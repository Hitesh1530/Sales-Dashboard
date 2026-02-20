/**
 * generate-logos.mjs
 * Converts logo.svg → logo-512.png, logo-192.png, logo-64.png, logo-32.png, logo-16.png
 * Uses the 'sharp' library. Run with: node generate-logos.mjs
 */

import sharp from 'sharp';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const svgPath = join(__dirname, 'logo.svg');
const svgBuffer = readFileSync(svgPath);

const sizes = [
    { size: 512, name: 'logo-512.png' },
    { size: 192, name: 'logo-192.png' },
    { size: 64, name: 'logo-64.png' },
    { size: 32, name: 'logo-32.png' },
    { size: 16, name: 'logo-16.png' },
];

for (const { size, name } of sizes) {
    const outPath = join(__dirname, name);
    await sharp(svgBuffer)
        .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .png({ compressionLevel: 9 })
        .toFile(outPath);
    console.log(`✅ ${name} (${size}×${size})`);
}

console.log('\n🎉 All logo exports complete → frontend/public/');
