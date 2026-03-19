/**
 * Extract individual nodes from "parts manual" GLB files.
 *
 * For each *_Model.glb:
 *   - Extract CircleSmall_* → only once (as CircleSmall.glb)
 *   - Extract CircleBig_*   → only once (as CircleBig.glb)
 *   - Extract *_Model (charm without circles) → CharmName.glb
 *
 * Also copies Holder_Model.glb (carabiner) as-is.
 *
 * Uses Three.js + GLTFExporter + GLTFLoader from node_modules.
 */

import { readFileSync, writeFileSync, readdirSync } from 'fs';

const SRC = 'public/assets/models/parts manual';
const DST = 'public/assets/models/parts-clean';

// We can't easily use Three.js GLTFExporter in pure Node without a full
// WebGL context. Instead we'll do binary GLB surgery — extract nodes by
// rewriting the JSON chunk to include only the desired node + its mesh +
// accessors + bufferViews, while keeping the binary chunk intact.

function readGlb(path) {
    const buf = readFileSync(path);
    // GLB header: magic(4) version(4) length(4)
    // Chunk 0 (JSON): length(4) type(4) data(length)
    const jsonLen = buf.readUInt32LE(12);
    const json = JSON.parse(buf.slice(20, 20 + jsonLen).toString());
    // Chunk 1 (BIN): starts at 20 + jsonLen (aligned to 4)
    const binOffset = 20 + jsonLen;
    const binLen = buf.readUInt32LE(binOffset);
    const bin = buf.slice(binOffset + 8, binOffset + 8 + binLen);
    return { json, bin };
}

function writeGlb(path, json, bin) {
    const jsonStr = JSON.stringify(json);
    // Pad JSON to 4-byte alignment with spaces
    const jsonPadded = jsonStr + ' '.repeat((4 - (jsonStr.length % 4)) % 4);
    const jsonBuf = Buffer.from(jsonPadded, 'utf8');

    // Pad binary to 4-byte alignment with zeros
    const binPad = (4 - (bin.length % 4)) % 4;
    const binBuf = binPad > 0 ? Buffer.concat([bin, Buffer.alloc(binPad)]) : bin;

    const totalLen = 12 + 8 + jsonBuf.length + 8 + binBuf.length;
    const out = Buffer.alloc(totalLen);

    // GLB header
    out.writeUInt32LE(0x46546C67, 0); // magic "glTF"
    out.writeUInt32LE(2, 4);           // version
    out.writeUInt32LE(totalLen, 8);    // total length

    // JSON chunk
    out.writeUInt32LE(jsonBuf.length, 12);
    out.writeUInt32LE(0x4E4F534A, 16); // type "JSON"
    jsonBuf.copy(out, 20);

    // BIN chunk
    const binChunkOffset = 20 + jsonBuf.length;
    out.writeUInt32LE(binBuf.length, binChunkOffset);
    out.writeUInt32LE(0x004E4942, binChunkOffset + 4); // type "BIN\0"
    binBuf.copy(out, binChunkOffset + 8);

    writeFileSync(path, out);
    console.log(`  → ${path} (${Math.round(out.length / 1024)}KB)`);
}

function extractNode(glb, nodeName, outPath) {
    const { json, bin } = glb;

    // Find target node
    const nodeIdx = json.nodes.findIndex(n => n.name === nodeName);
    if (nodeIdx === -1) {
        console.log(`  ⚠ Node "${nodeName}" not found, skipping`);
        return false;
    }

    const node = json.nodes[nodeIdx];

    // Collect all nodes to keep (target + its children recursively)
    const keepNodes = new Set();
    function collectChildren(idx) {
        keepNodes.add(idx);
        const n = json.nodes[idx];
        if (n.children) n.children.forEach(c => collectChildren(c));
    }
    collectChildren(nodeIdx);

    // Collect meshes, materials, textures, images, samplers used by kept nodes
    const keepMeshes = new Set();
    const keepMaterials = new Set();
    const keepTextures = new Set();
    const keepImages = new Set();
    const keepSamplers = new Set();
    const keepAccessors = new Set();
    const keepBufferViews = new Set();

    for (const ni of keepNodes) {
        const n = json.nodes[ni];
        if (n.mesh !== undefined) {
            keepMeshes.add(n.mesh);
            const mesh = json.meshes[n.mesh];
            for (const prim of mesh.primitives) {
                // Attributes
                for (const acc of Object.values(prim.attributes)) {
                    keepAccessors.add(acc);
                }
                if (prim.indices !== undefined) keepAccessors.add(prim.indices);
                if (prim.material !== undefined) keepMaterials.add(prim.material);

                // Morph targets
                if (prim.targets) {
                    for (const target of prim.targets) {
                        for (const acc of Object.values(target)) {
                            keepAccessors.add(acc);
                        }
                    }
                }
            }
        }
    }

    // Materials → textures → images/samplers
    for (const mi of keepMaterials) {
        const mat = json.materials[mi];
        const texRefs = [];
        if (mat.pbrMetallicRoughness) {
            if (mat.pbrMetallicRoughness.baseColorTexture) texRefs.push(mat.pbrMetallicRoughness.baseColorTexture.index);
            if (mat.pbrMetallicRoughness.metallicRoughnessTexture) texRefs.push(mat.pbrMetallicRoughness.metallicRoughnessTexture.index);
        }
        if (mat.normalTexture) texRefs.push(mat.normalTexture.index);
        if (mat.occlusionTexture) texRefs.push(mat.occlusionTexture.index);
        if (mat.emissiveTexture) texRefs.push(mat.emissiveTexture.index);
        for (const ti of texRefs) {
            keepTextures.add(ti);
            const tex = json.textures[ti];
            if (tex.source !== undefined) keepImages.add(tex.source);
            if (tex.sampler !== undefined) keepSamplers.add(tex.sampler);
        }
    }

    // Accessors → bufferViews
    for (const ai of keepAccessors) {
        const acc = json.accessors[ai];
        if (acc.bufferView !== undefined) keepBufferViews.add(acc.bufferView);
    }
    // Images → bufferViews
    for (const ii of keepImages) {
        const img = json.images[ii];
        if (img.bufferView !== undefined) keepBufferViews.add(img.bufferView);
    }

    // Build remapping tables (old index → new index)
    const remap = (keepSet, arr) => {
        const sorted = [...keepSet].sort((a, b) => a - b);
        const map = new Map();
        sorted.forEach((old, i) => map.set(old, i));
        return { map, items: sorted.map(i => JSON.parse(JSON.stringify(arr[i]))) };
    };

    const nodeRemap = remap(keepNodes, json.nodes);
    const meshRemap = remap(keepMeshes, json.meshes);
    const matRemap = remap(keepMaterials, json.materials || []);
    const texRemap = remap(keepTextures, json.textures || []);
    const imgRemap = remap(keepImages, json.images || []);
    const sampRemap = remap(keepSamplers, json.samplers || []);
    const accRemap = remap(keepAccessors, json.accessors);
    const bvRemap = remap(keepBufferViews, json.bufferViews);

    // Apply remapping
    const newNodes = nodeRemap.items.map(n => {
        const nn = { ...n };
        if (nn.mesh !== undefined) nn.mesh = meshRemap.map.get(nn.mesh);
        if (nn.children) nn.children = nn.children.filter(c => nodeRemap.map.has(c)).map(c => nodeRemap.map.get(c));
        if (nn.children && nn.children.length === 0) delete nn.children;
        return nn;
    });

    const newMeshes = meshRemap.items.map(m => ({
        ...m,
        primitives: m.primitives.map(p => {
            const np = { ...p };
            const newAttrs = {};
            for (const [k, v] of Object.entries(p.attributes)) {
                newAttrs[k] = accRemap.map.get(v);
            }
            np.attributes = newAttrs;
            if (np.indices !== undefined) np.indices = accRemap.map.get(np.indices);
            if (np.material !== undefined) np.material = matRemap.map.get(np.material);
            if (np.targets) {
                np.targets = np.targets.map(t => {
                    const nt = {};
                    for (const [k, v] of Object.entries(t)) nt[k] = accRemap.map.get(v);
                    return nt;
                });
            }
            return np;
        }),
    }));

    const newMaterials = matRemap.items.map(m => {
        const nm = JSON.parse(JSON.stringify(m));
        const remapTex = (obj, key) => { if (obj && obj[key]) obj[key].index = texRemap.map.get(obj[key].index); };
        if (nm.pbrMetallicRoughness) {
            remapTex(nm.pbrMetallicRoughness, 'baseColorTexture');
            remapTex(nm.pbrMetallicRoughness, 'metallicRoughnessTexture');
        }
        remapTex(nm, 'normalTexture');
        remapTex(nm, 'occlusionTexture');
        remapTex(nm, 'emissiveTexture');
        return nm;
    });

    const newTextures = texRemap.items.map(t => {
        const nt = { ...t };
        if (nt.source !== undefined) nt.source = imgRemap.map.get(nt.source);
        if (nt.sampler !== undefined) nt.sampler = sampRemap.map.get(nt.sampler);
        return nt;
    });

    const newImages = imgRemap.items.map(img => {
        const ni = { ...img };
        if (ni.bufferView !== undefined) ni.bufferView = bvRemap.map.get(ni.bufferView);
        return ni;
    });

    const newAccessors = accRemap.items.map(a => {
        const na = { ...a };
        if (na.bufferView !== undefined) na.bufferView = bvRemap.map.get(na.bufferView);
        return na;
    });

    const newBufferViews = bvRemap.items.map(bv => ({ ...bv, buffer: 0 }));

    // Build new JSON
    const newJson = {
        asset: json.asset,
        scene: 0,
        scenes: [{ nodes: [nodeRemap.map.get(nodeIdx)] }],
        nodes: newNodes,
        meshes: newMeshes,
        accessors: newAccessors,
        bufferViews: newBufferViews,
        buffers: [{ byteLength: bin.length }],
    };
    if (newMaterials.length > 0) newJson.materials = newMaterials;
    if (newTextures.length > 0) newJson.textures = newTextures;
    if (newImages.length > 0) newJson.images = newImages;
    if (sampRemap.items.length > 0) newJson.samplers = sampRemap.items;

    // Keep binary chunk as-is (bufferViews still point to correct offsets)
    writeGlb(outPath, newJson, bin);
    return true;
}

// ── Main ──
console.log('Extracting parts from "parts manual/"...\n');

const files = readdirSync(SRC).filter(f => f.endsWith('.glb'));

let circleSmallDone = false;
let circleBigDone = false;

for (const file of files) {
    const filePath = `${SRC}/${file}`;
    console.log(`\n📦 ${file}:`);
    const glb = readGlb(filePath);
    const nodes = glb.json.nodes;

    for (const node of nodes) {
        if (!node.name) continue;

        // Extract one CircleSmall (from first file that has it)
        if (node.name.startsWith('CircleSmall_') && !circleSmallDone) {
            extractNode(glb, node.name, `${DST}/CircleSmall.glb`);
            circleSmallDone = true;
        }

        // Extract one CircleBig (from first file that has it)
        if (node.name.startsWith('CircleBig_') && !circleBigDone) {
            extractNode(glb, node.name, `${DST}/CircleBig.glb`);
            circleBigDone = true;
        }

        // Extract charm model (the *_Model node, not Circle*)
        if (node.name.endsWith('_Model') && !node.name.startsWith('Circle')) {
            // Name: "Wella_Model" → "Wella.glb"
            const charmName = node.name.replace('_Model', '');
            extractNode(glb, node.name, `${DST}/${charmName}.glb`);
        }

        // Extract Carabiner
        if (node.name === 'Carabiner') {
            extractNode(glb, node.name, `${DST}/Carabiner.glb`);
        }
    }
}

console.log('\n✅ Done! Output in:', DST);
console.log('\nFiles:');
readdirSync(DST).filter(f => f.endsWith('.glb')).forEach(f => {
    const stat = readFileSync(`${DST}/${f}`);
    console.log(`  ${f} (${Math.round(stat.length / 1024)}KB)`);
});
