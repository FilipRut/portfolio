import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
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
    MOUSE_FORCE:     0.8,
    INERTIA_FORCE:   1.5,
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
    // ── Renderer: photorealistic PBR ──
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.shadowMap.enabled = false;
    globalContainer.appendChild(renderer.domElement);

    // ── Environment: RoomEnvironment HDRI (studio reflections on acrylic) ──
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    // ── Lighting: soft diffused + strong backlight ──

    // Ambient — slightly higher for softer overall fill
    scene.add(new THREE.AmbientLight(0xffffff, 0.5));

    // BACKLIGHT — stronger, further back — refracts through resin for inner glow
    const backLight = new THREE.DirectionalLight(0xffffff, 6.0);
    backLight.position.set(-2, 5, -8);
    backLight.castShadow = false;
    scene.add(backLight);

    // KEY LIGHT — RectAreaLight for soft, wide panel reflections (not sharp points)
    const keyLight = new THREE.RectAreaLight(0xffeedd, 2.5, 4, 4);
    keyLight.position.set(5, 4, 3);
    keyLight.lookAt(0, 0, 0);
    scene.add(keyLight);

    // FILL — RectAreaLight from opposite side, cool
    const fillLight = new THREE.RectAreaLight(0xddeeff, 1.5, 3, 3);
    fillLight.position.set(-4, 2, 2);
    fillLight.lookAt(0, 0, 0);
    scene.add(fillLight);

    // RIM — SpotLight with max penumbra for soft edge glow
    const rimLight = new THREE.SpotLight(0xffffff, 4.0);
    rimLight.position.set(-5, 0, 2);
    rimLight.angle = Math.PI / 4;
    rimLight.penumbra = 1.0;
    scene.add(rimLight);

    const mainGroup = new THREE.Group();
    scene.add(mainGroup);
    camera.position.z = 10;


    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.7/');
    const loader = new GLTFLoader();
    loader.setDRACOLoader(dracoLoader);
    const basePath = '/assets/models/parts-opt/';

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

    RAPIER.init({}).then(() => {
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
        const TOTAL = 1 + RINGS.length + 1; // carabiner + rings (from single load) + charm
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

        // Orange charm — translucent tinted resin (Beer-Lambert volumetric absorption)
        loader.load(basePath + 'Orange.glb', (gltf) => {
            charmGroup = new THREE.Group();
            const mesh = gltf.scene;

            // ── Polished acrylic — beer-lambert orange resin ──
            const resinMat = new THREE.MeshPhysicalMaterial({
                color: 0xffffff,
                transmission: 1.0,
                opacity: 1.0,
                transparent: true,
                roughness: 0.35,            // frosted — soft diffused reflections
                metalness: 0.0,
                ior: 1.5,
                thickness: 2.5,
                attenuationColor: new THREE.Color('#ff7700'),
                attenuationDistance: 1.5,
                dispersion: 1.5,
                side: THREE.DoubleSide,
            });

            // Apply material — peg is already centered in original mesh
            mesh.traverse(child => {
                const m = child as THREE.Mesh;
                if (m.isMesh) m.material = resinMat;
            });


            // ── Inner glowing core (cube within cube) ──
            // Frosted transmission box inside the resin shell.
            // Sits inside the mesh — moves and rotates with it.
            const innerGeo = new THREE.BoxGeometry(0.5, 0.55, 0.22);
            const innerMat = new THREE.MeshPhysicalMaterial({
                color: 0xffcc00,
                roughness: 0.6,
                transmission: 0.7,
                transparent: true,
                thickness: 1.0,
                ior: 1.4,
                attenuationColor: new THREE.Color('#ff8800'),
                attenuationDistance: 1.0,
                depthWrite: false,
                side: THREE.DoubleSide,
            });
            const innerCore = new THREE.Mesh(innerGeo, innerMat);
            innerCore.position.set(0, -0.48, 0.05);
            mesh.add(innerCore);

            // PointLight inside — feeds the glow through outer shell
            const innerGlow = new THREE.PointLight(0xffaa44, 2.5, 2.0, 2);
            innerGlow.position.set(0, -0.48, 0.05);
            mesh.add(innerGlow);

            mesh.position.y = 0.456;
            mesh.position.z = -0.093;

            charmGroup.add(mesh);
            mainGroup.add(charmGroup);
            onLoaded();
        });

        // Ring visuals — load CircleBig.glb once, clone for each ring
        loader.load(basePath + 'CircleBig.glb', (gltf) => {
            RINGS.forEach((ring, i) => {
                const group = new THREE.Group();
                const mesh = gltf.scene.clone();

                if (ring.plane === 'yz') {
                    mesh.rotation.y = Math.PI / 2;
                }
                mesh.position.y = -0.41 * ring.scale;
                mesh.scale.setScalar(ring.scale);

                group.add(mesh);
                mainGroup.add(group);
                chainGroups[i] = group;
                onLoaded();
            });
        });
    });

    // ── Projection (pre-allocated vectors to avoid per-frame GC) ──
    const _projV = new THREE.Vector3();
    const _projResult = new THREE.Vector3();
    function screenToWorld(x: number, y: number) {
        _projV.set((x / window.innerWidth) * 2 - 1, -(y / window.innerHeight) * 2 + 1, 0.5);
        _projV.unproject(camera); _projV.sub(camera.position).normalize();
        return _projResult.copy(camera.position).add(_projV.multiplyScalar(-camera.position.z / _projV.z));
    }

    const animState = { progress: 0 };
    gsap.to(animState, { progress: 1, scrollTrigger: { trigger: '#intro', start: 'top top', end: 'bottom bottom', scrub: 0.15 } });

    let mouseX = 0, mouseY = 0;
    window.addEventListener('mousemove', (e) => { mouseX = (e.clientX / window.innerWidth) - 0.5; mouseY = (e.clientY / window.innerHeight) - 0.5; });

    let isDragging = false, dragRotY = 0, dragVelocity = 0, lastDragX = 0, isHovering = false, touchActive = false, touchStartX = 0;

    // Cached screen-space bounding rect of the 3D model, updated once per frame in animate()
    let hitX0 = 0, hitY0 = 0, hitX1 = 0, hitY1 = 0;
    const _hitBox = new THREE.Box3();
    const _hitCorner = new THREE.Vector3();
    function updateHitBounds() {
        if (!modelLoaded) return;
        _hitBox.setFromObject(mainGroup);
        const mn = _hitBox.min, mx = _hitBox.max;
        let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
        for (let i = 0; i < 8; i++) {
            _hitCorner.set(i & 1 ? mx.x : mn.x, i & 2 ? mx.y : mn.y, i & 4 ? mx.z : mn.z);
            _hitCorner.project(camera);
            const sx = (_hitCorner.x * .5 + .5) * innerWidth;
            const sy = (-_hitCorner.y * .5 + .5) * innerHeight;
            x0 = Math.min(x0, sx); y0 = Math.min(y0, sy);
            x1 = Math.max(x1, sx); y1 = Math.max(y1, sy);
        }
        const px = (x1 - x0) * .2, py = (y1 - y0) * .2;
        hitX0 = x0 - px; hitY0 = y0 - py; hitX1 = x1 + px; hitY1 = y1 + py;
    }

    function hitTest(cx: number, cy: number): boolean {
        if (!modelLoaded) return false;
        return cx >= hitX0 && cx <= hitX1 && cy >= hitY0 && cy <= hitY1;
    }

    window.addEventListener('mousedown', (e) => { if (hitTest(e.clientX,e.clientY)) { isDragging=true; lastDragX=e.clientX; dragVelocity=0; document.body.style.cursor='grabbing'; e.preventDefault(); } });
    window.addEventListener('mousemove', (e) => { if (isDragging) { const d=e.clientX-lastDragX; dragRotY+=d*.008; dragVelocity=d*.008; lastDragX=e.clientX; } else { const o=hitTest(e.clientX,e.clientY); if(o!==isHovering){isHovering=o;document.body.style.cursor=o?'grab':'';} } });
    window.addEventListener('mouseup', () => { if (isDragging) { isDragging=false; document.body.style.cursor=isHovering?'grab':''; } });
    window.addEventListener('wheel', (e) => { if (!hitTest(e.clientX,e.clientY)) return; if (Math.abs(e.deltaX)>Math.abs(e.deltaY)) { const d=e.deltaX*.003; if(Math.abs(d)>.001){e.preventDefault();dragRotY+=d;dragVelocity=d;} } else if(e.ctrlKey) e.preventDefault(); }, { passive: false });
    window.addEventListener('touchstart', (e) => { if (e.touches.length===2) { touchActive=true; touchStartX=(e.touches[0].clientX+e.touches[1].clientX)/2; dragVelocity=0; } }, { passive: true });
    window.addEventListener('touchmove', (e) => { if (touchActive&&e.touches.length===2) { const cx=(e.touches[0].clientX+e.touches[1].clientX)/2; const d=cx-touchStartX; dragRotY+=d*.006; dragVelocity=d*.006; touchStartX=cx; } }, { passive: true });
    window.addEventListener('touchend', () => { touchActive=false; });

    // Smoothed position/scale — always lerp, never snap (except first frame)
    let smoothX = 0, smoothY = 0, smoothScale = 0.34;
    let firstFrame = true;

    // No anchor — object follows placeholder live when pinned, detaches at 30%

    // Hit bounds throttle — every 3rd frame is enough for hover detection
    let hitBoundsCounter = 0;

    function animate() {
        requestAnimationFrame(animate);
        if (!modelLoaded || !world) return;

        const time = Date.now() * 0.001;

        if (!isDragging && !touchActive) { dragRotY += dragVelocity; dragVelocity *= 0.95; if (Math.abs(dragVelocity) < .0001) dragVelocity = 0; }
        // Idle spin: ramps in after detach (progress > 0.3), always apply drag
        const spinAmount = animState.progress <= 0.3 ? 0 : Math.min((animState.progress - 0.3) / 0.2, 1);
        mainGroup.rotation.y += 0.0013 * spinAmount + dragVelocity;

        mainRotVelocity = mainGroup.rotation.y - prevMainRotY;
        prevMainRotY = mainGroup.rotation.y;

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
            const lastRingBody = chainBodies[chainBodies.length - 1];
            if (lastRingBody) {
                const r = lastRingBody.rotation();
                charmGroup.quaternion.set(r.x, r.y, r.z, r.w);
            }
        }

        // Live placeholder position in world space (scrolls with document)
        const rect = placeholder!.getBoundingClientRect();
        const sp = screenToWorld(rect.left + rect.width / 2, rect.top + rect.height / 2);

        // Remap progress: 0–30% of scroll = follow placeholder (t=0), 30–100% = fly to center (t 0→1)
        const DETACH_AT = 0.2;
        const t = animState.progress <= DETACH_AT ? 0 : (animState.progress - DETACH_AT) / (1 - DETACH_AT);

        const tgtScale = gsap.utils.interpolate(0.34, 1.47, t);
        const tgtX = gsap.utils.interpolate(sp.x, 0, t);
        const tgtYPos = gsap.utils.interpolate(sp.y, 1.8, t);

        // Lerp speed blends smoothly: fast (0.5) when pinned → slow (0.1) when fully detached
        // No hard branch — eliminates snap/jump at the transition boundary
        const lerp = 0.5 - t * 0.4; // t=0 → 0.5, t=1 → 0.1
        if (firstFrame) {
            smoothX = tgtX; smoothY = tgtYPos; smoothScale = tgtScale;
            firstFrame = false;
        } else {
            smoothX += (tgtX - smoothX) * lerp;
            smoothY += (tgtYPos - smoothY) * lerp;
            smoothScale += (tgtScale - smoothScale) * lerp;
        }

        // Levitation only when detached — pinned mode is rock-solid on placeholder
        const levAmount = Math.min(t * 3, 1); // 0 when pinned, ramps to 1 over first ~33% of detach
        const levY = Math.sin(time * 0.8) * 0.04 * levAmount;
        const levTiltX = Math.sin(time * 0.5) * 0.03 * levAmount;
        const levTiltZ = Math.cos(time * 0.7) * 0.02 * levAmount;

        mainGroup.scale.setScalar(smoothScale);
        mainGroup.position.set(smoothX, smoothY + levY, 0);
        mainGroup.rotation.x = levTiltX;
        mainGroup.rotation.z = levTiltZ;

        // Update hit bounds every 3rd frame (saves traversing scene graph)
        if (++hitBoundsCounter >= 3) {
            hitBoundsCounter = 0;
            updateHitBounds();
        }

        renderer.render(scene, camera);

    }
    animate();

    window.addEventListener('resize', () => {
        camera.aspect = innerWidth / innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(innerWidth, innerHeight);
        firstFrame = true; // re-snap position on resize
    });
}
