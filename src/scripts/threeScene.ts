import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import RAPIER from '@dimforge/rapier3d-compat';
import gsap from 'gsap';
import 'gsap/ScrollTrigger';

/*
 * Keychain — Carabiner + Ring, Rapier3D with compound sphere colliders.
 *
 * WHY compound spheres instead of Trimesh:
 *   Rapier (like cannon-es) does NOT support Trimesh-vs-Trimesh on dynamic bodies.
 *   Compound spheres give reliable sphere-vs-sphere collision.
 *
 * WHY Rapier over cannon-es:
 *   - CCD (continuous collision detection) prevents tunneling
 *   - Better PGS solver = more stable contacts
 *   - Substep support for smoother simulation
 */

const PHYS = {
    GRAVITY:        -9.82,
    SUBSTEPS:        4,
    LINEAR_DAMPING:  2.0,
    ANGULAR_DAMPING: 8.0,    // very high — kills spinning fast
    MOUSE_FORCE:     0.3,
    INERTIA_FORCE:   0.5,
    FRICTION:        0.0,    // zero friction — no tangential forces from collision
    RESTITUTION:     0.0,
};

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
    let carabinerRigidBody: RAPIER.RigidBody;
    let ringRigidBody: RAPIER.RigidBody;
    let carabinerGroup: THREE.Group;
    let ringGroup: THREE.Group;
    let modelLoaded = false;
    let prevMainRotY = -Math.PI / 4;
    let mainRotVelocity = 0;

    // ── Compound shape builders ──

    // Carabiner: ellipse of spheres in XY plane
    // Bounding box: 0.77w × 1.69h → semi-axes 0.35 (X), 0.80 (Y)
    /*
     * Collision groups (Rapier bitmask):
     * - Group 1 (0x0001): carabiner
     * - Group 2 (0x0002): ring
     * - Carabiner collides with group 2+ (NOT itself, NOT ring → 0xFFFC filter)
     * - Ring collides with group 1+ (NOT itself, NOT carabiner → 0xFFFC filter)
     * - Actually: just disable carabiner↔ring collision entirely.
     *   membership=group, filter=what it collides WITH
     */
    // Carabiner: member of group 1, collides with groups 4+ (NOT ring group 2)
    const CARABINER_GROUP = (0x0001 << 16) | 0xFFFC;
    // Ring: member of group 2, collides with groups 4+ (NOT carabiner group 1)
    const RING_GROUP      = (0x0002 << 16) | 0xFFFC;

    function addCarabinerColliders(body: RAPIER.RigidBody) {
        const N = 28;
        const semiA = 0.35, semiB = 0.80;
        const tubeR = 0.055;
        const centerY = 0.05;

        for (let i = 0; i < N; i++) {
            const a = (i / N) * Math.PI * 2;
            const desc = RAPIER.ColliderDesc.ball(tubeR)
                .setTranslation(Math.cos(a) * semiA, Math.sin(a) * semiB + centerY, 0)
                .setCollisionGroups(CARABINER_GROUP)
                .setDensity(2.0);
            world.createCollider(desc, body);
        }
    }

    function addRingColliders(body: RAPIER.RigidBody) {
        const N = 20;
        const R = 0.27;
        const tubeR = 0.03;

        for (let i = 0; i < N; i++) {
            const a = (i / N) * Math.PI * 2;
            const desc = RAPIER.ColliderDesc.ball(tubeR)
                .setTranslation(0, Math.cos(a) * R, Math.sin(a) * R)
                .setCollisionGroups(RING_GROUP)
                .setDensity(1.5);
            world.createCollider(desc, body);
        }
    }

    // ── Init Rapier ──
    RAPIER.init().then(() => {
        world = new RAPIER.World({ x: 0, y: PHYS.GRAVITY, z: 0 });

        const ANCHOR_Y = 0.89;

        // Fixed anchor
        const anchorBody = world.createRigidBody(
            RAPIER.RigidBodyDesc.fixed().setTranslation(0, ANCHOR_Y, 0)
        );

        // ── Carabiner body ──
        carabinerRigidBody = world.createRigidBody(
            RAPIER.RigidBodyDesc.dynamic()
                .setTranslation(0, 0, 0)
                .setLinearDamping(PHYS.LINEAR_DAMPING)
                .setAngularDamping(PHYS.ANGULAR_DAMPING)
                .setCcdEnabled(true)  // prevent tunneling
        );
        addCarabinerColliders(carabinerRigidBody);

        // Spherical joint: anchor → carabiner top
        world.createImpulseJoint(
            RAPIER.JointData.spherical(
                { x: 0, y: 0, z: 0 },
                { x: 0, y: ANCHOR_Y, z: 0 },
            ),
            anchorBody, carabinerRigidBody, true,
        );

        // ── Ring body ──
        // Carabiner bottom at Y=-0.75. Ring hangs from that point.
        const CARABINER_BOT_Y = -0.75;
        ringRigidBody = world.createRigidBody(
            RAPIER.RigidBodyDesc.dynamic()
                .setTranslation(0, CARABINER_BOT_Y - 0.22, 0)  // center = bottom - pivot offset
                .setLinearDamping(PHYS.LINEAR_DAMPING)
                .setAngularDamping(PHYS.ANGULAR_DAMPING)
                .setCcdEnabled(true)
        );
        addRingColliders(ringRigidBody);

        // Spherical joint: carabiner bottom → ring TOP
        // Pivot at ring's top edge (Y=+0.27 in ring local space),
        // so the ring hangs FROM its top and visually touches the carabiner bottom.
        world.createImpulseJoint(
            RAPIER.JointData.spherical(
                { x: 0, y: CARABINER_BOT_Y, z: 0 },  // carabiner's bottom
                { x: 0, y: 0.22, z: 0 },               // above ring center, below top — ring sits higher
            ),
            carabinerRigidBody, ringRigidBody, true,
        );

        // ── Load visual meshes ──
        let loadCount = 0;
        function onLoaded() {
            if (++loadCount === 2) {
                modelLoaded = true;
                console.log('[keychain] Rapier ready — compound sphere collision + CCD');
            }
        }

        loader.load(basePath + 'Carabiner.glb', (gltf) => {
            carabinerGroup = new THREE.Group();
            carabinerGroup.add(gltf.scene);
            mainGroup.add(carabinerGroup);
            onLoaded();
        });

        loader.load(basePath + 'CircleBig.glb', (gltf) => {
            ringGroup = new THREE.Group();
            const mesh = gltf.scene;
            // Original: ring in XY plane, center at Y=0.41
            // Rotate 90° around Y → ring in YZ plane (matches physics colliders)
            mesh.rotation.y = Math.PI / 2;
            // Center is still at Y=0.41 after Y rotation, shift to origin
            mesh.position.y = -0.41;
            ringGroup.add(mesh);
            mainGroup.add(ringGroup);
            onLoaded();
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

        // Apply impulse (not force) — avoids Rapier WASM aliasing issue
        if (ringRigidBody) {
            const ix = (mouseX * PHYS.MOUSE_FORCE - mainRotVelocity * PHYS.INERTIA_FORCE) * (1/60);
            const iz = mouseY * PHYS.MOUSE_FORCE * (1/60);
            ringRigidBody.applyImpulse({ x: ix, y: 0, z: iz }, true);
        }

        // Single step with small timestep (Rapier handles internal substeps)
        world.timestep = 1 / 60;
        world.step();

        // Sync Rapier → Three.js
        if (carabinerRigidBody && carabinerGroup) {
            const p = carabinerRigidBody.translation();
            const r = carabinerRigidBody.rotation();
            carabinerGroup.position.set(p.x, p.y, p.z);
            carabinerGroup.quaternion.set(r.x, r.y, r.z, r.w);
        }
        if (ringRigidBody && ringGroup) {
            const p = ringRigidBody.translation();
            const r = ringRigidBody.rotation();
            ringGroup.position.set(p.x, p.y, p.z);
            ringGroup.quaternion.set(r.x, r.y, r.z, r.w);
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
