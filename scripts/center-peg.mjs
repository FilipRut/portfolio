import { execSync } from 'child_process';
import { readFileSync, writeFileSync } from 'fs';

const INPUT = '/tmp/orange-original.glb'; // git-restored original
const TEMP = '/tmp/orange-clean.glb';
const OUTPUT = 'public/assets/models/parts-opt/Orange.glb';

// Decompress Draco
console.log('Decompressing...');
execSync(`npx --yes @gltf-transform/cli copy ${INPUT} ${TEMP}`);

const buf = readFileSync(TEMP);
const jsonLen = buf.readUInt32LE(12);
const json = JSON.parse(buf.slice(20, 20 + jsonLen).toString());
const binStart = 20 + jsonLen + 8;
const binData = Buffer.from(buf.slice(binStart));

const posAcc = json.accessors[json.meshes[0].primitives[0].attributes.POSITION];
const posBV = json.bufferViews[posAcc.bufferView];
const stride = (posBV.byteStride || 12) / 4;
const allF = new Float32Array(binData.buffer, binData.byteOffset + posBV.byteOffset, posBV.byteLength / 4);

// Peg = narrow protrusion: X[-0.02, 0.04], Z[-0.056, -0.006], Y > -0.06
// Full peg including base where it meets the cube top surface
const BODY_CENTER_Z = (posAcc.min[2] + posAcc.max[2]) / 2;

let pegN = 0, pegSumZ = 0;
for (let i = 0; i < posAcc.count; i++) {
    const x = allF[i * stride], y = allF[i * stride + 1], z = allF[i * stride + 2];
    if (y > -0.06 && x > -0.025 && x < 0.045 && z > -0.07 && z < 0.01) {
        pegSumZ += z;
        pegN++;
    }
}
const pegCentroidZ = pegSumZ / pegN;
const shift = BODY_CENTER_Z - pegCentroidZ;

console.log(`Body center Z: ${BODY_CENTER_Z.toFixed(3)}`);
console.log(`Peg centroid Z: ${pegCentroidZ.toFixed(3)} (${pegN} verts)`);
console.log(`Shift: ${shift.toFixed(3)}`);

// Shift ALL peg vertices (including base)
for (let i = 0; i < posAcc.count; i++) {
    const x = allF[i * stride], y = allF[i * stride + 1], z = allF[i * stride + 2];
    if (y > -0.06 && x > -0.025 && x < 0.045 && z > -0.07 && z < 0.01) {
        allF[i * stride + 2] = z + shift;
    }
}

// Write GLB
const newJson = JSON.stringify(json);
const jsonPad = newJson + ' '.repeat((4 - (newJson.length % 4)) % 4);
const jsonBuf = Buffer.from(jsonPad, 'utf8');
const binPad = (4 - (binData.length % 4)) % 4;
const binBuf = binPad > 0 ? Buffer.concat([binData, Buffer.alloc(binPad)]) : binData;

const total = 12 + 8 + jsonBuf.length + 8 + binBuf.length;
const out = Buffer.alloc(total);
out.writeUInt32LE(0x46546C67, 0);
out.writeUInt32LE(2, 4);
out.writeUInt32LE(total, 8);
out.writeUInt32LE(jsonBuf.length, 12);
out.writeUInt32LE(0x4E4F534A, 16);
jsonBuf.copy(out, 20);
out.writeUInt32LE(binBuf.length, 20 + jsonBuf.length);
out.writeUInt32LE(0x004E4942, 24 + jsonBuf.length);
binBuf.copy(out, 28 + jsonBuf.length);

writeFileSync(OUTPUT, out);
console.log(`✅ ${OUTPUT} (${out.length} bytes) — peg shifted ${shift.toFixed(3)} in Z, ${pegN} verts only`);
