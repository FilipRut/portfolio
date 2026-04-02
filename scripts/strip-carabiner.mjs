import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { prune, cloneDocument } from '@gltf-transform/functions';
import draco3d from 'draco3dgltf';

async function main() {
    const io = new NodeIO()
        .registerExtensions(ALL_EXTENSIONS)
        .registerDependencies({
            'draco3d.decoder': await draco3d.createDecoderModule(),
            'draco3d.encoder': await draco3d.createEncoderModule(),
        });

    const doc = await io.read('public/assets/models/parts/Carabiner.glb');
    const scene = doc.getRoot().listScenes()[0];

    // Find and remove all children of Carabiner (Circle, Cylinder, Plane)
    scene.traverse((node) => {
        const name = node.getName();
        if (name && name !== 'Carabiner') {
            console.log('Removing:', name);
            node.detach();
        }
    });

    // Also clear Carabiner's children list
    const carabiner = scene.listChildren().find(n => n.getName() === 'Carabiner');
    if (carabiner) {
        for (const child of carabiner.listChildren()) {
            child.detach();
        }
    }

    await doc.transform(prune());
    await io.write('public/assets/models/parts/Carabiner.glb', doc);

    const { statSync } = await import('fs');
    const size = statSync('public/assets/models/parts/Carabiner.glb').size;
    console.log(`Carabiner.glb: ${(size / 1024).toFixed(0)}KB`);
}

main().catch(console.error);
