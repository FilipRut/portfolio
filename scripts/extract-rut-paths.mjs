import opentype from 'opentype.js';
import { readFileSync } from 'fs';

const buf = readFileSync('/tmp/InterTight-Medium.ttf');
const font = opentype.parse(buf.buffer);
const SIZE = 100; // units for path extraction

const letters = ['R', 'U', 'T'];
const GAP = 8; // gap between letters

let x = 0;
const paths = [];

for (const ch of letters) {
    const glyph = font.charToGlyph(ch);
    const path = glyph.getPath(x, SIZE * 0.82, SIZE); // baseline at 82% of size
    const adv = (glyph.advanceWidth / font.unitsPerEm) * SIZE;

    // Get SVG path data
    const d = path.toPathData(2);
    const name = `logo-${ch.toLowerCase()}`;

    paths.push({ char: ch, name, d, x, width: adv });
    x += adv + GAP;
}

const totalW = x - GAP;
const viewBox = `0 0 ${Math.ceil(totalW)} ${SIZE}`;

console.log(`viewBox="${viewBox}"\n`);
for (const p of paths) {
    console.log(`<!-- ${p.char} -->`);
    console.log(`<path class="${p.name}" d="${p.d}"/>`);
    console.log();
}
