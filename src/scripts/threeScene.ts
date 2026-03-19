import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import RAPIER from '@dimforge/rapier3d-compat';
import gsap from 'gsap';
import 'gsap/ScrollTrigger';

/*
 * Keychain chain: Anchor → Carabiner → BigRing → MediumRing → SmallRing
 *
 * Each link connected by spherical joint (top of child → bottom of parent).
 * Collision disabled between chain elements (joint handles topology).
 * All rings use CircleBig.glb at different scales.
 */

const PHYS = {
    GRAVITY:        -9.82,
    LINEAR_DAMPING:  2.0,
    ANGULAR_DAMPING: 8.0,
    MOUSE_FORCE:     0.3,
    INERTIA_FORCE:   0.5,
    FRICTION:        0.0,
    RESTITUTION:     0.0,
};

// Ring definitions: name, physics radius, tube radius, visual scale, sphere count
// Rings alternate orientation: YZ → XZ → YZ (like a real chain)
// pivotTop < R → ring overlaps INTO parent (interlocking chain look)
// pivotBot < R → child overlaps into this ring
const RINGS = [
    { name: 'big',    R: 0.27, tubeR: 0.03,  scale: 1.0,  N: 20, pivotTop: 0.20, pivotBot: 0.20, plane: 'yz' as const },
    { name: 'medium', R: 0.18, tubeR: 0.025, scale: 0.67, N: 16, pivotTop: 0.18, pivotBot: 0.12, plane: 'xy' as const },
    { name: 'small',  R: 0.12, tubeR: 0.02,  scale: 0.44, N: 12, pivotTop: 0.07, pivotBot: 0.10, plane: 'yz' as const },
];

export function initThreeScene() {
    const globalContainer = document.getElementById('global-three-container');
    const placeholder = document.getElementById('keychain-container');
    if (!globalContainer || !placeholder) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    globalContainer.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0xffffff, 1.5));
    const ml = new THREE.DirectionalLight(0xffffff, 2); ml.position.set(5, 8, 5); scene.add(ml);
    const fl = new THREE.DirectionalLight(0xffffff, 0.8); fl.position.set(-3, 2, -3); scene.add(fl);

    const mainGroup = new THREE.Group();
    scene.add(mainGroup);
    camera.position.z = 10;

    const loader = new GLTFLoader();
    const basePath = '/assets/models/parts-clean/';

    let world: RAPIER.World;
    let carabinerBody: RAPIER.RigidBody;
    let carabinerGroup: THREE.Group;

    // Chain links (rings + charm)
    const chainBodies: RAPIER.RigidBody[] = [];
    const chainGroups: THREE.Group[] = [];
    let charmBody: RAPIER.RigidBody;
    let charmGroup: THREE.Group;

    let modelLoaded = false;
    let prevMainRotY = -Math.PI / 4;
    let mainRotVelocity = 0;

    // Collision groups — all chain elements in same group, don't collide with each other
    const CHAIN_GROUP = (0x0001 << 16) | 0xFFFE; // member=1, filter=NOT group 1

    function addCarabinerColliders(body: RAPIER.RigidBody) {
        const N = 28, semiA = 0.35, semiB = 0.80, tubeR = 0.055, centerY = 0.05;
        for (let i = 0; i < N; i++) {
            const a = (i / N) * Math.PI * 2;
            world.createCollider(
                RAPIER.ColliderDesc.ball(tubeR)
                    .setTranslation(Math.cos(a) * semiA, Math.sin(a) * semiB + centerY, 0)
                    .setCollisionGroups(CHAIN_GROUP)
                    .setDensity(2.0),
                body,
            );
        }
    }

    function addRingColliders(body: RAPIER.RigidBody, R: number, tubeR: number, N: number, plane: 'yz' | 'xy') {
        for (let i = 0; i < N; i++) {
            const a = (i / N) * Math.PI * 2;
            // YZ plane: ring in Y-Z, flat in X (perpendicular to camera)
            // XY plane: ring in X-Y, flat in Z (facing camera)
            const x = plane === 'xy' ? Math.cos(a) * R : 0;
            const y = Math.sin(a) * R; // both planes extend in Y
            const z = plane === 'yz' ? Math.cos(a) * R : 0;
            world.createCollider(
                RAPIER.ColliderDesc.ball(tubeR)
                    .setTranslation(x, y, z)
                    .setCollisionGroups(CHAIN_GROUP)
                    .setDensity(1.5),
                body,
            );
        }
    }

    RAPIER.init().then(() => {
        world = new RAPIER.World({ x: 0, y: PHYS.GRAVITY, z: 0 });

        const ANCHOR_Y = 0.89;
        const CARABINER_BOT_Y = -0.75;

        // Fixed anchor
        const anchorBody = world.createRigidBody(
            RAPIER.RigidBodyDesc.fixed().setTranslation(0, ANCHOR_Y, 0)
        );

        // ── Carabiner ──
        carabinerBody = world.createRigidBody(
            RAPIER.RigidBodyDesc.dynamic()
                .setTranslation(0, 0, 0)
                .setLinearDamping(PHYS.LINEAR_DAMPING)
                .setAngularDamping(PHYS.ANGULAR_DAMPING)
                .setCcdEnabled(true)
        );
        addCarabinerColliders(carabinerBody);

        // Anchor → Carabiner top
        world.createImpulseJoint(
            RAPIER.JointData.spherical(
                { x: 0, y: 0, z: 0 },
                { x: 0, y: ANCHOR_Y, z: 0 },
            ),
            anchorBody, carabinerBody, true,
        );

        // ── Create ring chain ──
        // Each ring connects: parent bottom → this ring top
        let parentBody: RAPIER.RigidBody = carabinerBody;
        let parentBottomLocal = { x: 0, y: CARABINER_BOT_Y, z: 0 }; // carabiner bottom

        RINGS.forEach((ring) => {
            // Body center positioned so top pivot aligns with parent's bottom pivot
            // Joint will be: parentBody@parentBottomLocal → ringBody@(0, pivotTop, 0)
            // So ringBody center Y = parentBottomWorldY - pivotTop
            const parentPos = parentBody.translation();
            const jointWorldY = parentPos.y + parentBottomLocal.y;
            const centerY = jointWorldY - ring.pivotTop;

            const body = world.createRigidBody(
                RAPIER.RigidBodyDesc.dynamic()
                    .setTranslation(0, centerY, 0)
                    .setLinearDamping(PHYS.LINEAR_DAMPING)
                    .setAngularDamping(PHYS.ANGULAR_DAMPING)
                    .setCcdEnabled(true)
            );
            addRingColliders(body, ring.R, ring.tubeR, ring.N, ring.plane);

            // Joint: parent bottom → ring top
            world.createImpulseJoint(
                RAPIER.JointData.spherical(
                    parentBottomLocal,
                    { x: 0, y: ring.pivotTop, z: 0 },
                ),
                parentBody, body, true,
            );

            chainBodies.push(body);

            // Next ring connects to this ring's bottom
            parentBody = body;
            parentBottomLocal = { x: 0, y: -ring.pivotBot, z: 0 };
        });

        // ── Orange charm body ──
        // Orange mesh: peg at bottom Y=-0.924, top face Y=0.012, center Y=-0.456
        // We flip it (bake rotation) so peg is at top: Y=+0.924 from flipped center +0.456
        // Peg tip is 0.468 above body center (0.924 - 0.456)
        // Connect peg to last ring's bottom pivot
        const CHARM_PEG_OFFSET = 0.46; // close to peg tip (0.468) — minimal gap
        const lastRing = RINGS[RINGS.length - 1];
        {
            const lastRingBody = chainBodies[chainBodies.length - 1];
            const lastRingPos = lastRingBody.translation();
            const jointWorldY = lastRingPos.y + (-lastRing.pivotBot);
            const charmCenterY = jointWorldY - CHARM_PEG_OFFSET;

            charmBody = world.createRigidBody(
                RAPIER.RigidBodyDesc.dynamic()
                    .setTranslation(0, charmCenterY, 0)
                    .setLinearDamping(PHYS.LINEAR_DAMPING)
                    .setAngularDamping(PHYS.ANGULAR_DAMPING)
                    .setCcdEnabled(true)
            );

            // Box collider approximating the cube (0.88 x 0.94 x 0.39)
            // After flip, same dimensions — use half-extents
            world.createCollider(
                RAPIER.ColliderDesc.cuboid(0.44, 0.47, 0.19)
                    .setCollisionGroups(CHAIN_GROUP)
                    .setDensity(1.0),
                charmBody,
            );

            // Joint: last ring bottom → charm peg (top of flipped charm)
            world.createImpulseJoint(
                RAPIER.JointData.spherical(
                    { x: 0, y: -lastRing.pivotBot, z: 0 },    // last ring's bottom
                    { x: 0, y: CHARM_PEG_OFFSET, z: 0 },       // charm's peg (top)
                ),
                lastRingBody, charmBody, true,
            );
        }

        // ── Load visuals ──
        const TOTAL = 1 + RINGS.length + 1; // carabiner + rings + charm
        let loadCount = 0;
        function onLoaded() {
            if (++loadCount === TOTAL) {
                modelLoaded = true;
                console.log(`[keychain] ${TOTAL} parts loaded — chain ready`);
            }
        }

        // Carabiner visual
        loader.load(basePath + 'Carabiner.glb', (gltf) => {
            carabinerGroup = new THREE.Group();
            carabinerGroup.add(gltf.scene);
            mainGroup.add(carabinerGroup);
            onLoaded();
        });

        // Orange charm visual — peg is ALREADY at top in original mesh (Y≈0.012)
        // No flip needed! Original orientation: peg up, cube body below.
        loader.load(basePath + 'Orange.glb', (gltf) => {
            charmGroup = new THREE.Group();
            const mesh = gltf.scene;

            // Original center at Y=-0.456, shift up so group origin = body center
            mesh.position.y = 0.456;
            // Nudge so peg hole aligns with ring center
            mesh.position.x = -0.025;

            charmGroup.add(mesh);
            mainGroup.add(charmGroup);
            onLoaded();
        });

        // Ring visuals — CircleBig.glb at different scales, alternating orientation
        RINGS.forEach((ring, i) => {
            loader.load(basePath + 'CircleBig.glb', (gltf) => {
                const group = new THREE.Group();
                const mesh = gltf.scene;

                // Original ring is in XY plane, center at Y=0.41
                // YZ plane: rotate 90° around Y → perpendicular to camera
                // XY plane: no rotation needed → faces camera
                if (ring.plane === 'yz') {
                    mesh.rotation.y = Math.PI / 2;
                }
                // Center offset always in Y (both planes are vertical)
                mesh.position.y = -0.41 * ring.scale;
                mesh.scale.setScalar(ring.scale);

                group.add(mesh);
                mainGroup.add(group);
                chainGroups[i] = group;
                onLoaded();
            });
        });
    });

    // ── Projection ──
    function screenToWorld(x: number, y: number) {
        const v = new THREE.Vector3((x / window.innerWidth) * 2 - 1, -(y / window.innerHeight) * 2 + 1, 0.5);
        v.unproject(camera); v.sub(camera.position).normalize();
        return camera.position.clone().add(v.multiplyScalar(-camera.position.z / v.z));
    }

    const animState = { progress: 0 };
    gsap.to(animState, { progress: 1, scrollTrigger: { trigger: '#intro', start: 'top top', end: 'bottom bottom', scrub: 0.8 } });

    let mouseX = 0, mouseY = 0;
    window.addEventListener('mousemove', (e) => { mouseX = (e.clientX / window.innerWidth) - 0.5; mouseY = (e.clientY / window.innerHeight) - 0.5; });

    let isDragging = false, dragRotY = 0, dragVelocity = 0, lastDragX = 0, isHovering = false, touchActive = false, touchStartX = 0;

    function hitTest(cx: number, cy: number): boolean {
        if (!modelLoaded) return false;
        const box = new THREE.Box3().setFromObject(mainGroup);
        const toS = (v: THREE.Vector3) => { v.project(camera); return { x: (v.x * .5 + .5) * innerWidth, y: (-v.y * .5 + .5) * innerHeight }; };
        const mn = box.min, mx = box.max;
        let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
        [new THREE.Vector3(mn.x,mn.y,mn.z),new THREE.Vector3(mx.x,mn.y,mn.z),new THREE.Vector3(mn.x,mx.y,mn.z),new THREE.Vector3(mx.x,mx.y,mn.z),
         new THREE.Vector3(mn.x,mn.y,mx.z),new THREE.Vector3(mx.x,mn.y,mx.z),new THREE.Vector3(mn.x,mx.y,mx.z),new THREE.Vector3(mx.x,mx.y,mx.z)]
        .forEach(c => { const s = toS(c); x0 = Math.min(x0,s.x); y0 = Math.min(y0,s.y); x1 = Math.max(x1,s.x); y1 = Math.max(y1,s.y); });
        const px = (x1-x0)*.2, py = (y1-y0)*.2;
        return cx >= x0-px && cx <= x1+px && cy >= y0-py && cy <= y1+py;
    }

    window.addEventListener('mousedown', (e) => { if (hitTest(e.clientX,e.clientY)) { isDragging=true; lastDragX=e.clientX; dragVelocity=0; document.body.style.cursor='grabbing'; e.preventDefault(); } });
    window.addEventListener('mousemove', (e) => { if (isDragging) { const d=e.clientX-lastDragX; dragRotY+=d*.008; dragVelocity=d*.008; lastDragX=e.clientX; } else { const o=hitTest(e.clientX,e.clientY); if(o!==isHovering){isHovering=o;document.body.style.cursor=o?'grab':'';} } });
    window.addEventListener('mouseup', () => { if (isDragging) { isDragging=false; document.body.style.cursor=isHovering?'grab':''; } });
    window.addEventListener('wheel', (e) => { if (!hitTest(e.clientX,e.clientY)) return; if (Math.abs(e.deltaX)>Math.abs(e.deltaY)) { const d=e.deltaX*.003; if(Math.abs(d)>.001){e.preventDefault();dragRotY+=d;dragVelocity=d;} } else if(e.ctrlKey) e.preventDefault(); }, { passive: false });
    window.addEventListener('touchstart', (e) => { if (e.touches.length===2) { touchActive=true; touchStartX=(e.touches[0].clientX+e.touches[1].clientX)/2; dragVelocity=0; } }, { passive: true });
    window.addEventListener('touchmove', (e) => { if (touchActive&&e.touches.length===2) { const cx=(e.touches[0].clientX+e.touches[1].clientX)/2; const d=cx-touchStartX; dragRotY+=d*.006; dragVelocity=d*.006; touchStartX=cx; } }, { passive: true });
    window.addEventListener('touchend', () => { touchActive=false; });

    function animate() {
        requestAnimationFrame(animate);
        if (!modelLoaded || !world) return;

        const time = Date.now() * 0.001;

        if (!isDragging && !touchActive) { dragRotY += dragVelocity; dragVelocity *= 0.95; if (Math.abs(dragVelocity) < .0001) dragVelocity = 0; }
        const baseRotY = -Math.PI / 4, breathe = Math.sin(time * .15) * .06;
        const tgtY = baseRotY + breathe + (isDragging ? 0 : mouseX * .15) + dragRotY;
        mainGroup.rotation.y += (tgtY - mainGroup.rotation.y) * (isDragging ? .15 : .015);

        mainRotVelocity = mainGroup.rotation.y - prevMainRotY;
        prevMainRotY = mainGroup.rotation.y;

        // Impulse on charm (bottom of chain — cascades up through joints)
        if (charmBody) {
            const ix = (mouseX * PHYS.MOUSE_FORCE - mainRotVelocity * PHYS.INERTIA_FORCE) * (1/60);
            const iz = mouseY * PHYS.MOUSE_FORCE * (1/60);
            charmBody.applyImpulse({ x: ix, y: 0, z: iz }, true);
        }

        world.timestep = 1 / 60;
        world.step();

        // Sync all bodies → Three.js
        if (carabinerBody && carabinerGroup) {
            const p = carabinerBody.translation();
            const r = carabinerBody.rotation();
            carabinerGroup.position.set(p.x, p.y, p.z);
            carabinerGroup.quaternion.set(r.x, r.y, r.z, r.w);
        }
        chainBodies.forEach((body, i) => {
            const group = chainGroups[i];
            if (!group) return;
            const p = body.translation();
            const r = body.rotation();
            group.position.set(p.x, p.y, p.z);
            group.quaternion.set(r.x, r.y, r.z, r.w);
        });
        if (charmBody && charmGroup) {
            const p = charmBody.translation();
            charmGroup.position.set(p.x, p.y, p.z);
            // Counter-rotate mainGroup so charm always faces camera
            charmGroup.rotation.y = -mainGroup.rotation.y;
        }

        const rect = placeholder!.getBoundingClientRect();
        const sp = screenToWorld(rect.left + rect.width / 2, rect.top + rect.height / 2);
        const sc = gsap.utils.interpolate(0.34, 1.47, animState.progress);
        mainGroup.scale.set(sc, sc, sc);
        mainGroup.position.set(
            gsap.utils.interpolate(sp.x, 0, animState.progress),
            gsap.utils.interpolate(sp.y, 1.8, animState.progress), 0);

        renderer.render(scene, camera);
    }
    animate();

    window.addEventListener('resize', () => { camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth, innerHeight); });
}
