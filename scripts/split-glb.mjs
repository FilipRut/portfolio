import { NodeIO, Document } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import draco3d from 'draco3dgltf';

const GROUPS = {
    'Carabiner': ['Carabiner', 'Circle.002', 'Circle.003', 'Cylinder.001', 'Plane', 'Plane.001', 'Plane.002'],
    'Enea': ['Enea_Keychain', 'KeychainBigHolder', 'KeychainSmallHolder'],
    'HP': ['HP_Keychain', 'KeychainBigHolder.001', 'KeychainSmallHolder1'],
    'Lidl': ['Lidl_Keychain', 'Lidl logo', 'Lidl text', 'KeychainBigHolder.002', 'KeychainSmallHolder1.001'],
    'Orange': ['Orange_KeyChain', 'KeychainBigHolder.003', 'KeychainSmallHolder1.002'],
    'Selgros': ['Selgros_Keychain', 'Selgros logo', 'Selgros text', 'Retailworks', 'KeychainBigHolder.004', 'KeychainSmallHolder1.003'],
    'Wella': ['Wella_Keychain', 'Wella text', 'wella keychain', 'KeychainBigHolder.005', 'KeychainSmallHolder2'],
    'Zabka': ['Zabka_Keychain', 'Zabka Head', 'KeychainSmallHolder3'],
};

async function main() {
    const io = new NodeIO()
        .registerExtensions(ALL_EXTENSIONS)
        .registerDependencies({ 'draco3d.decoder': await draco3d.createDecoderModule() });

    const doc = await io.read('public/assets/models/Keychain.glb');
    const root = doc.getRoot();
    const scene = root.listScenes()[0];

    // Build name→node map
    const allNodes = new Map();
    scene.traverse((node) => {
        if (node.getName()) allNodes.set(node.getName(), node);
    });

    console.log(`Loaded ${allNodes.size} named nodes`);

    for (const [groupName, nodeNames] of Object.entries(GROUPS)) {
        // Clone the document for this group
        const { cloneDocument } = await import('@gltf-transform/functions');
        const groupDoc = cloneDocument(doc);
        const groupRoot = groupDoc.getRoot();
        const groupScene = groupRoot.listScenes()[0];

        // Build name map for cloned doc
        const clonedNodes = new Map();
        groupScene.traverse((node) => {
            if (node.getName()) clonedNodes.set(node.getName(), node);
        });

        // Collect names to keep
        const keepSet = new Set(nodeNames);

        // Remove nodes NOT in this group (from the Carabiner's children)
        const carabiner = clonedNodes.get('Carabiner');
        if (carabiner) {
            const children = carabiner.listChildren();
            for (const child of children) {
                const name = child.getName();
                if (!keepSet.has(name)) {
                    child.detach();
                }
            }
            // If this is not the Carabiner group, remove the Carabiner mesh
            if (!keepSet.has('Carabiner')) {
                carabiner.setMesh(null);
            }
        }

        // Prune unused resources
        groupDoc.transform(
            (await import('@gltf-transform/functions')).prune()
        );

        const outPath = `public/assets/models/parts/${groupName}.glb`;
        await io.write(outPath, groupDoc);

        // Get file size
        const { statSync } = await import('fs');
        const size = statSync(outPath).size;
        console.log(`${groupName}: ${nodeNames.length} nodes → ${(size / 1024).toFixed(0)}KB`);
    }

    console.log('Done!');
}

main().catch(console.error);
