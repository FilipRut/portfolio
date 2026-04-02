import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import RAPIER from '@dimforge/rapier3d-compat';
import gsap from 'gsap';
import 'gsap/ScrollTrigger';
// Debug tool — always imported for isDebugMode checks in animate loop,
// but lil-gui/TransformControls/OrbitControls only loaded when D is pressed (lazy in keychainDebug.ts)
import { initKeychainDebug, updateDebug, isPhysPaused, isDebugMode } from './keychainDebug';

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
    MOUSE_FORCE:     1.6,
    INERTIA_FORCE:   1.5,
    FRICTION:        0.0,
    RESTITUTION:     0.0,
};

// ╔══════════════════════════════════════════════════════════════╗
// ║  ORANGE — ringi łańcucha (od karabińczyka do charmu)       ║
// ║                                                            ║
// ║  R         = rozmiar ringa (promień okręgu fizycznego)      ║
// ║  scale     = skala wizualna modelu 3D                      ║
// ║  pivotTop  = zanurzenie W GÓRĘ w parent (mniej = wyżej)    ║
// ║  pivotBot  = punkt zaczepienia DZIECKA pod ringiem          ║
// ║  plane     = orientacja: 'yz' = widoczny z przodu,          ║
// ║              'xy' = widoczny z boku (naprzemiennie)         ║
// ╚══════════════════════════════════════════════════════════════╝
const ORANGE_RINGS = [
    { name: 'big',    R: 0.27, tubeR: 0.03,  scale: 1.0,  N: 20,
      pivotTop: 0.19,  pivotBot: 0.20,  plane: 'yz' as const,
      rotY: 0, meshRot: [102.2, -14.1, 159.6] as [number,number,number],
      meshPos: [0.614, 0.503, 0.175] as [number,number,number] },
    { name: 'medium', R: 0.18, tubeR: 0.025, scale: 0.67, N: 16,
      pivotTop: 0.20,  pivotBot: 0.12,  plane: 'xy' as const,
      rotY: 0, meshRot: [39.4, 10.1, 121.8] as [number,number,number],
      meshPos: [1.008, 1.040, -0.297] as [number,number,number] },
    { name: 'small',  R: 0.12, tubeR: 0.02,  scale: 0.44, N: 12,
      pivotTop: 0.07,  pivotBot: 0.10,  plane: 'yz' as const,
      rotY: 0, meshRot: [-112.2, 22.5, 75.6] as [number,number,number],
      meshPos: [1.117, 1.001, -0.440] as [number,number,number] },
];

// ╔══════════════════════════════════════════════════════════════╗
// ║  ŻABKA — ringi łańcucha (od karabińczyka do charmu)        ║
// ╚══════════════════════════════════════════════════════════════╝
const ZABKA_RINGS = [
    { name: 'zbig',   R: 0.20, tubeR: 0.025, scale: 0.74, N: 16,
      pivotTop: 0.14,  pivotBot: 0.16,  plane: 'yz' as const,
      rotY: 0, meshRot: [-93.5, 1.0, -135.5] as [number,number,number],
      meshPos: [-0.714, 0.505, -0.039] as [number,number,number] },
    { name: 'zsmall', R: 0.14, tubeR: 0.02,  scale: 0.52, N: 12,
      pivotTop: 0.10,  pivotBot: 0.07,  plane: 'xy' as const,
      rotY: 0, meshRot: [-125.8, 29.2, -126.3] as [number,number,number],
      meshPos: [-0.888, 0.812, -0.186] as [number,number,number] },
];

// ╔══════════════════════════════════════════════════════════════╗
// ║  HP — ringi łańcucha (od karabińczyka do charmu)           ║
// ╚══════════════════════════════════════════════════════════════╝
const HP_RINGS = [
    { name: 'hbig',   R: 0.20, tubeR: 0.025, scale: 0.74, N: 16,
      pivotTop: 0.14,  pivotBot: 0.14,  plane: 'yz' as const,
      rotY: 0, meshRot: [121.3, 75.9, -131.7] as [number,number,number],
      meshPos: [-0.139, -0.261, 0.285] as [number,number,number] },
    { name: 'hsmall', R: 0.14, tubeR: 0.02,  scale: 0.52, N: 12,
      pivotTop: 0.08,  pivotBot: 0.06,  plane: 'xy' as const,
      rotY: 0, meshRot: [-64.8, 21.5, 19.2] as [number,number,number],
      meshPos: [0.038, 0.146, 0.695] as [number,number,number] },
];

// ╔══════════════════════════════════════════════════════════════╗
// ║  WELLA — ringi łańcucha (od karabińczyka do charmu)        ║
// ╚══════════════════════════════════════════════════════════════╝
const WELLA_RINGS = [
    { name: 'wbig',   R: 0.20, tubeR: 0.025, scale: 0.74, N: 16,
      pivotTop: 0.14,  pivotBot: 0.14,  plane: 'yz' as const,
      rotY: 0, meshRot: [57.2, -34.8, 54.4] as [number,number,number],
      meshPos: [0.713, -0.077, -0.158] as [number,number,number] },
    { name: 'wsmall', R: 0.14, tubeR: 0.02,  scale: 0.52, N: 12,
      pivotTop: 0.08,  pivotBot: 0.06,  plane: 'xy' as const,
      rotY: 0, meshRot: [-143.4, -30.1, 158.3] as [number,number,number],
      meshPos: [0.530, 0.131, -0.474] as [number,number,number] },
];

// ╔══════════════════════════════════════════════════════════════╗
// ║  LIDL — 1 ring, podpięty do dużego ringa Welli             ║
// ╚══════════════════════════════════════════════════════════════╝
const LIDL_RINGS = [
    { name: 'lring',  R: 0.14, tubeR: 0.02,  scale: 0.52, N: 12,
      pivotTop: 0.08,  pivotBot: 0.06,  plane: 'xy' as const,
      rotY: 0, meshRot: [162.4, 9.2, 129.2] as [number,number,number],
      meshPos: [0.916, 0.110, 0.017] as [number,number,number] },
];

// ╔══════════════════════════════════════════════════════════════╗
// ║  SELGROS — 2 ringi na karabińczyku → charm Selgros          ║
// ╚══════════════════════════════════════════════════════════════╝
const SELGROS_RINGS = [
    { name: 'sbig',   R: 0.20, tubeR: 0.025, scale: 0.74, N: 16,
      pivotTop: 0.14,  pivotBot: 0.14,  plane: 'yz' as const,
      rotY: 0, meshRot: [115.0, 28.5, -127.0] as [number,number,number],
      meshPos: [-0.627, 0.044, 0.055] as [number,number,number] },
    { name: 'ssmall', R: 0.14, tubeR: 0.02,  scale: 0.52, N: 12,
      pivotTop: 0.08,  pivotBot: 0.06,  plane: 'xy' as const,
      rotY: 0, meshRot: [4.7, 57.5, -55.6] as [number,number,number],
      meshPos: [-0.658, 0.183, 0.237] as [number,number,number] },
];

// ╔══════════════════════════════════════════════════════════════╗
// ║  ENEA — 1 ring łączący z charmu Selgros → charm Enea        ║
// ╚══════════════════════════════════════════════════════════════╝
const ENEA_RINGS = [
    { name: 'ering',  R: 0.14, tubeR: 0.02,  scale: 0.52, N: 12,
      pivotTop: 0.08,  pivotBot: 0.06,  plane: 'yz' as const,
      rotY: 0, meshRot: [125.0, -88.5, -151.5] as [number,number,number],
      meshPos: [-1.365, 0.651, 0.728] as [number,number,number] },
];

// Module-level ref for programmatic exit
let _exitState: { progress: number } | null = null;
let _mainGroup: THREE.Group | null = null;

/** Force the keychain to drop out of view (called by "Show more") */
export function forceKeychainExit(): Promise<void> {
    if (!_exitState || !_mainGroup) return Promise.resolve();
    return new Promise(resolve => {
        gsap.to(_exitState, {
            progress: 1,
            duration: 0.6,
            ease: 'power3.in',
            onComplete: () => {
                if (_mainGroup) _mainGroup.visible = false;
                resolve();
            },
        });
    });
}

export function initThreeScene() {
    const globalContainer = document.getElementById('global-three-container');
    const placeholder = document.getElementById('keychain-container');
    if (!globalContainer || !placeholder) return;

    const isMobile = window.innerWidth < 768;
    const SCENE_FOV = isMobile ? 55 : 40;
    const CENTERED_SCALE = isMobile ? 0.95 : 1.47;
    const CENTERED_Y = isMobile ? 1.2 : 1.8;
    const PINNED_SCALE = isMobile ? 0.24 : 0.34;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(SCENE_FOV, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1.5 : 2));
    // ── Renderer: photorealistic PBR ──
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.85;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.shadowMap.enabled = false;
    globalContainer.appendChild(renderer.domElement);

    // ── Environment: RoomEnvironment HDRI (studio reflections on acrylic) ──
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    // ── Lighting: soft diffused + strong backlight ──
    // Using environment map as primary lighting source; only add directional lights
    // to shape highlights. RectAreaLights and SpotLights removed — environment
    // map already provides soft studio reflections at zero per-frame cost.

    scene.add(new THREE.AmbientLight(0xffffff, 0.3));

    // BACKLIGHT — refracts through resin for inner glow
    const backLight = new THREE.DirectionalLight(0xffffff, 3.5);
    backLight.position.set(-2, 5, -8);
    backLight.castShadow = false;
    scene.add(backLight);

    // KEY LIGHT — primary shaping light
    const keyLight = new THREE.DirectionalLight(0xffeedd, 1.8);
    keyLight.position.set(5, 4, 3);
    scene.add(keyLight);

    // FILL — cool side fill for depth
    const fillLight = new THREE.DirectionalLight(0xddeeff, 0.8);
    fillLight.position.set(-4, 2, 2);
    scene.add(fillLight);

    // PRIMARY ACCENT — red point light for brand color warmth
    const accentLight = new THREE.PointLight(0xe53e3e, 2.5, 15, 1.5);
    accentLight.position.set(2, -2, 4);
    scene.add(accentLight);

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

    // Orange chain (rings + charm)
    const orangeBodies: RAPIER.RigidBody[] = [];
    const orangeGroups: THREE.Group[] = [];
    let orangeCharmBody: RAPIER.RigidBody;
    let orangeCharmGroup: THREE.Group;

    // Zabka chain (rings + charm)
    const zabkaBodies: RAPIER.RigidBody[] = [];
    const zabkaGroups: THREE.Group[] = [];
    let zabkaCharmBody: RAPIER.RigidBody;
    let zabkaCharmGroup: THREE.Group;

    // HP chain (rings + charm)
    const hpBodies: RAPIER.RigidBody[] = [];
    const hpGroups: THREE.Group[] = [];
    let hpCharmBody: RAPIER.RigidBody;
    let hpCharmGroup: THREE.Group;

    // Wella chain (rings + charm)
    const wellaBodies: RAPIER.RigidBody[] = [];
    const wellaGroups: THREE.Group[] = [];
    let wellaCharmBody: RAPIER.RigidBody;
    let wellaCharmGroup: THREE.Group;

    // Lidl chain (1 ring, hangs from Wella big ring)
    const lidlBodies: RAPIER.RigidBody[] = [];
    const lidlGroups: THREE.Group[] = [];
    let lidlCharmBody: RAPIER.RigidBody;
    let lidlCharmGroup: THREE.Group;

    // Selgros chain (2 rings on carabiner → charm)
    const selgrosBodies: RAPIER.RigidBody[] = [];
    const selgrosGroups: THREE.Group[] = [];
    let selgrosCharmBody: RAPIER.RigidBody;
    let selgrosCharmGroup: THREE.Group;

    // Enea chain (1 ring from Selgros charm → Enea charm)
    const eneaBodies: RAPIER.RigidBody[] = [];
    const eneaGroups: THREE.Group[] = [];
    let eneaCharmBody: RAPIER.RigidBody;
    let eneaCharmGroup: THREE.Group;

    let modelLoaded = false;
    mainGroup.rotation.y = Math.PI;
    let prevMainRotY = Math.PI;
    let mainRotVelocity = 0;

    // Collision groups — no inter-chain collisions (directional gravity separates them)
    const CARABINER_GROUP = (0x0004 << 16) | 0x0000; // no collisions
    const ORANGE_GROUP    = (0x0001 << 16) | 0x0000; // no collisions (intra-chain handled by joints)
    const ZABKA_GROUP     = (0x0002 << 16) | 0x0000; // no collisions
    const HP_GROUP        = (0x0008 << 16) | 0x0000; // no collisions
    const WELLA_GROUP     = (0x0010 << 16) | 0x0000; // no collisions
    const LIDL_GROUP      = (0x0020 << 16) | 0x0000; // no collisions
    const SELGROS_GROUP   = (0x0040 << 16) | 0x0000; // no collisions
    const ENEA_GROUP      = (0x0080 << 16) | 0x0000; // no collisions

    function addCarabinerColliders(body: RAPIER.RigidBody) {
        const N = 28, semiA = 0.35, semiB = 0.80, tubeR = 0.055, centerY = 0.05;
        for (let i = 0; i < N; i++) {
            const a = (i / N) * Math.PI * 2;
            world.createCollider(
                RAPIER.ColliderDesc.ball(tubeR)
                    .setTranslation(Math.cos(a) * semiA, Math.sin(a) * semiB + centerY, 0)
                    .setCollisionGroups(CARABINER_GROUP)
                    .setDensity(2.0)
                    .setFriction(0.0)
                    .setRestitution(0.0),
                body,
            );
        }
    }

    function addRingColliders(body: RAPIER.RigidBody, R: number, tubeR: number, N: number, plane: 'yz' | 'xy', group: number) {
        // Perimeter spheres (visual tube shape)
        for (let i = 0; i < N; i++) {
            const a = (i / N) * Math.PI * 2;
            const x = plane === 'xy' ? Math.cos(a) * R : 0;
            const y = Math.sin(a) * R;
            const z = plane === 'yz' ? Math.cos(a) * R : 0;
            world.createCollider(
                RAPIER.ColliderDesc.ball(tubeR)
                    .setTranslation(x, y, z)
                    .setCollisionGroups(group)
                    .setDensity(1.5)
                    .setFriction(0.0)
                    .setRestitution(0.0),
                body,
            );
        }
        // Center blocker — prevents other chain's rings from passing through the middle
        world.createCollider(
            RAPIER.ColliderDesc.ball(R * 0.55)
                .setTranslation(0, 0, 0)
                .setCollisionGroups(group)
                .setDensity(0.1)
                .setFriction(0.0)
                .setRestitution(0.0),
            body,
        );
    }

    RAPIER.init({}).then(() => {
        world = new RAPIER.World({ x: 0, y: 0, z: 0 }); // zero gravity — applied per-body with directional pull

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

        // ── Create ring chain (reusable for multiple chains) ──
        function createRingChain(
            rings: typeof ORANGE_RINGS,
            parentBody: RAPIER.RigidBody,
            attachLocal: { x: number; y: number; z: number },
            bodies: RAPIER.RigidBody[],
            collisionGroup: number,
        ) {
            let curParent = parentBody;
            let curBottom = attachLocal;

            rings.forEach((ring) => {
                const parentPos = curParent.translation();
                const jointWorldY = parentPos.y + curBottom.y;
                const centerY = jointWorldY - ring.pivotTop;
                const centerX = parentPos.x + (curBottom.x || 0);

                const body = world.createRigidBody(
                    RAPIER.RigidBodyDesc.dynamic()
                        .setTranslation(centerX, centerY, 0)
                        .setLinearDamping(PHYS.LINEAR_DAMPING)
                        .setAngularDamping(PHYS.ANGULAR_DAMPING)
                        .setCcdEnabled(true)
                );
                addRingColliders(body, ring.R, ring.tubeR, ring.N, ring.plane, collisionGroup);

                world.createImpulseJoint(
                    RAPIER.JointData.spherical(
                        curBottom,
                        { x: 0, y: ring.pivotTop, z: 0 },
                    ),
                    curParent, body, true,
                );

                bodies.push(body);
                curParent = body;
                curBottom = { x: 0, y: -ring.pivotBot, z: 0 };
            });
        }

        // ╔══════════════════════════════════════════════════════════════╗
        // ║  PUNKTY ZACZEPIENIA łańcuchów na karabińczyku               ║
        // ║                                                            ║
        // ║  x = lewo(-) / prawo(+) na karabińczyku                    ║
        // ║      zakres: -0.35 (skrajnie lewo) do +0.35 (skrajnie prawo)║
        // ║  y = wysokość na karabińczyku                               ║
        // ║      -0.75 = sam dół, -0.40 = bok, 0.0 = środek            ║
        // ╚══════════════════════════════════════════════════════════════╝
        createRingChain(ORANGE_RINGS, carabinerBody,
            { x: -0.15, y: -0.69, z: 0.08 },  // ← Orange: lewo, dół, lekko do przodu
            orangeBodies, ORANGE_GROUP);

        createRingChain(ZABKA_RINGS, carabinerBody,
            { x: 0.23, y: -0.46, z: -0.08 },  // ← Żabka: prawo, wyżej, lekko do tyłu
            zabkaBodies, ZABKA_GROUP);

        // ╔══════════════════════════════════════════════════════════════╗
        // ║  CHARM ORANGE — odległość charmu od ostatniego ringa        ║
        // ║  Mniejsza wartość = charm bliżej ringa (wyżej)             ║
        // ║  Większa wartość = charm dalej od ringa (niżej)             ║
        // ╚══════════════════════════════════════════════════════════════╝
        const ORANGE_PEG_OFFSET = 0.46;  // ← odległość peg→centrum charmu
        {
            const lastRing = ORANGE_RINGS[ORANGE_RINGS.length - 1];
            const lastBody = orangeBodies[orangeBodies.length - 1];
            const lastPos = lastBody.translation();
            const jointWorldY = lastPos.y + (-lastRing.pivotBot);
            const charmCenterY = jointWorldY - ORANGE_PEG_OFFSET;

            orangeCharmBody = world.createRigidBody(
                RAPIER.RigidBodyDesc.dynamic()
                    .setTranslation(lastPos.x, charmCenterY, 0)
                    .setLinearDamping(PHYS.LINEAR_DAMPING)
                    .setAngularDamping(PHYS.ANGULAR_DAMPING)
                    .setCcdEnabled(true)
            );
            world.createCollider(
                RAPIER.ColliderDesc.cuboid(0.44, 0.47, 0.19)
                    .setCollisionGroups(ORANGE_GROUP)
                    .setDensity(1.0)
                    .setFriction(0.0)
                    .setRestitution(0.0),
                orangeCharmBody,
            );
            world.createImpulseJoint(
                RAPIER.JointData.spherical(
                    { x: 0, y: -lastRing.pivotBot, z: 0 },
                    { x: 0, y: ORANGE_PEG_OFFSET, z: 0 },
                ),
                lastBody, orangeCharmBody, true,
            );
        }

        // ╔══════════════════════════════════════════════════════════════╗
        // ║  CHARM ŻABKA — odległość charmu od ostatniego ringa         ║
        // ╚══════════════════════════════════════════════════════════════╝
        const ZABKA_PEG_OFFSET = 0.63;   // ← odległość peg→centrum charmu
        {
            const lastRing = ZABKA_RINGS[ZABKA_RINGS.length - 1];
            const lastBody = zabkaBodies[zabkaBodies.length - 1];
            const lastPos = lastBody.translation();
            const jointWorldY = lastPos.y + (-lastRing.pivotBot);
            const charmCenterY = jointWorldY - ZABKA_PEG_OFFSET;

            zabkaCharmBody = world.createRigidBody(
                RAPIER.RigidBodyDesc.dynamic()
                    .setTranslation(lastPos.x, charmCenterY, 0)
                    .setLinearDamping(PHYS.LINEAR_DAMPING)
                    .setAngularDamping(PHYS.ANGULAR_DAMPING)
                    .setCcdEnabled(true)
            );
            world.createCollider(
                RAPIER.ColliderDesc.cuboid(0.66, 0.63, 0.10)
                    .setCollisionGroups(ZABKA_GROUP)
                    .setDensity(1.0)
                    .setFriction(0.0)
                    .setRestitution(0.0),
                zabkaCharmBody,
            );
            world.createImpulseJoint(
                RAPIER.JointData.spherical(
                    { x: 0, y: -lastRing.pivotBot, z: 0 },
                    { x: 0, y: ZABKA_PEG_OFFSET, z: 0 },
                ),
                lastBody, zabkaCharmBody, true,
            );
        }

        // ── HP chain: 2 rings, bottom-center of carabiner ──
        // HP chain: 2 rings, center-bottom of carabiner, behind (Z separation)
        createRingChain(HP_RINGS, carabinerBody,
            { x: 0.05, y: -0.72, z: -0.15 },
            hpBodies, HP_GROUP);

        // ╔══════════════════════════════════════════════════════════════╗
        // ║  CHARM HP — odległość charmu od ostatniego ringa            ║
        // ╚══════════════════════════════════════════════════════════════╝
        const HP_PEG_OFFSET = 0.99;
        {
            const lastRing = HP_RINGS[HP_RINGS.length - 1];
            const lastBody = hpBodies[hpBodies.length - 1];
            const lastPos = lastBody.translation();
            const jointWorldY = lastPos.y + (-lastRing.pivotBot);
            const charmCenterY = jointWorldY - HP_PEG_OFFSET;

            hpCharmBody = world.createRigidBody(
                RAPIER.RigidBodyDesc.dynamic()
                    .setTranslation(lastPos.x, charmCenterY, 0)
                    .setLinearDamping(PHYS.LINEAR_DAMPING)
                    .setAngularDamping(PHYS.ANGULAR_DAMPING)
                    .setCcdEnabled(true)
            );
            world.createCollider(
                RAPIER.ColliderDesc.cuboid(0.42, 0.99, 0.05)
                    .setCollisionGroups(HP_GROUP)
                    .setDensity(1.0)
                    .setFriction(0.0)
                    .setRestitution(0.0),
                hpCharmBody,
            );
            world.createImpulseJoint(
                RAPIER.JointData.spherical(
                    { x: 0, y: -lastRing.pivotBot, z: 0 },
                    { x: 0, y: HP_PEG_OFFSET, z: 0 },
                ),
                lastBody, hpCharmBody, true,
            );
        }

        // ── Wella chain: 2 rings, left side of carabiner ──
        createRingChain(WELLA_RINGS, carabinerBody,
            { x: -0.25, y: -0.52, z: 0.05 },
            wellaBodies, WELLA_GROUP);

        const WELLA_PEG_OFFSET = 0.42;
        {
            const lastRing = WELLA_RINGS[WELLA_RINGS.length - 1];
            const lastBody = wellaBodies[wellaBodies.length - 1];
            const lastPos = lastBody.translation();
            const jointWorldY = lastPos.y + (-lastRing.pivotBot);
            const charmCenterY = jointWorldY - WELLA_PEG_OFFSET;

            wellaCharmBody = world.createRigidBody(
                RAPIER.RigidBodyDesc.dynamic()
                    .setTranslation(lastPos.x, charmCenterY, 0)
                    .setLinearDamping(PHYS.LINEAR_DAMPING)
                    .setAngularDamping(PHYS.ANGULAR_DAMPING)
                    .setCcdEnabled(true)
            );
            world.createCollider(
                RAPIER.ColliderDesc.cuboid(0.66, 0.42, 0.05)
                    .setCollisionGroups(WELLA_GROUP)
                    .setDensity(1.0)
                    .setFriction(0.0)
                    .setRestitution(0.0),
                wellaCharmBody,
            );
            world.createImpulseJoint(
                RAPIER.JointData.spherical(
                    { x: 0, y: -lastRing.pivotBot, z: 0 },
                    { x: 0, y: WELLA_PEG_OFFSET, z: 0 },
                ),
                lastBody, wellaCharmBody, true,
            );
        }

        // ── Lidl chain: 1 ring, attached to Wella big ring (wellaBodies[0]) ──
        createRingChain(LIDL_RINGS, wellaBodies[0],
            { x: 0, y: -WELLA_RINGS[0].pivotBot, z: 0 },  // bottom of Wella big ring
            lidlBodies, LIDL_GROUP);

        const LIDL_PEG_OFFSET = 0.88;
        {
            const lastRing = LIDL_RINGS[LIDL_RINGS.length - 1];
            const lastBody = lidlBodies[lidlBodies.length - 1];
            const lastPos = lastBody.translation();
            const jointWorldY = lastPos.y + (-lastRing.pivotBot);
            const charmCenterY = jointWorldY - LIDL_PEG_OFFSET;

            lidlCharmBody = world.createRigidBody(
                RAPIER.RigidBodyDesc.dynamic()
                    .setTranslation(lastPos.x, charmCenterY, 0)
                    .setLinearDamping(PHYS.LINEAR_DAMPING)
                    .setAngularDamping(PHYS.ANGULAR_DAMPING)
                    .setCcdEnabled(true)
            );
            world.createCollider(
                RAPIER.ColliderDesc.cuboid(0.51, 0.88, 0.07)
                    .setCollisionGroups(LIDL_GROUP)
                    .setDensity(1.0)
                    .setFriction(0.0)
                    .setRestitution(0.0),
                lidlCharmBody,
            );
            world.createImpulseJoint(
                RAPIER.JointData.spherical(
                    { x: 0, y: -lastRing.pivotBot, z: 0 },
                    { x: 0, y: LIDL_PEG_OFFSET, z: 0 },
                ),
                lastBody, lidlCharmBody, true,
            );
        }

        // ── Selgros chain: 2 rings on carabiner ──
        createRingChain(SELGROS_RINGS, carabinerBody,
            { x: 0.15, y: -0.65, z: 0.12 },
            selgrosBodies, SELGROS_GROUP);

        const SELGROS_PEG_OFFSET = 0.784;
        {
            const lastRing = SELGROS_RINGS[SELGROS_RINGS.length - 1];
            const lastBody = selgrosBodies[selgrosBodies.length - 1];
            const lastPos = lastBody.translation();
            const jointWorldY = lastPos.y + (-lastRing.pivotBot);
            const charmCenterY = jointWorldY - SELGROS_PEG_OFFSET;

            selgrosCharmBody = world.createRigidBody(
                RAPIER.RigidBodyDesc.dynamic()
                    .setTranslation(lastPos.x, charmCenterY, 0)
                    .setLinearDamping(PHYS.LINEAR_DAMPING)
                    .setAngularDamping(PHYS.ANGULAR_DAMPING)
                    .setCcdEnabled(true)
            );
            world.createCollider(
                RAPIER.ColliderDesc.cuboid(0.46, 0.78, 0.06)
                    .setCollisionGroups(SELGROS_GROUP)
                    .setDensity(1.0).setFriction(0.0).setRestitution(0.0),
                selgrosCharmBody,
            );
            world.createImpulseJoint(
                RAPIER.JointData.spherical(
                    { x: 0, y: -lastRing.pivotBot, z: 0 },
                    { x: 0, y: SELGROS_PEG_OFFSET, z: 0 },
                ),
                lastBody, selgrosCharmBody, true,
            );
        }

        // ── Enea: 1 ring hanging from Selgros CHARM body (bottom) ──
        createRingChain(ENEA_RINGS, selgrosCharmBody,
            { x: 0, y: -0.784, z: 0 },  // bottom of Selgros charm
            eneaBodies, ENEA_GROUP);

        const ENEA_PEG_OFFSET = 0.582;
        {
            const lastRing = ENEA_RINGS[ENEA_RINGS.length - 1];
            const lastBody = eneaBodies[eneaBodies.length - 1];
            const lastPos = lastBody.translation();
            const jointWorldY = lastPos.y + (-lastRing.pivotBot);
            const charmCenterY = jointWorldY - ENEA_PEG_OFFSET;

            eneaCharmBody = world.createRigidBody(
                RAPIER.RigidBodyDesc.dynamic()
                    .setTranslation(lastPos.x, charmCenterY, 0)
                    .setLinearDamping(PHYS.LINEAR_DAMPING)
                    .setAngularDamping(PHYS.ANGULAR_DAMPING)
                    .setCcdEnabled(true)
            );
            world.createCollider(
                RAPIER.ColliderDesc.cuboid(0.58, 0.58, 0.04)
                    .setCollisionGroups(ENEA_GROUP)
                    .setDensity(1.0).setFriction(0.0).setRestitution(0.0),
                eneaCharmBody,
            );
            world.createImpulseJoint(
                RAPIER.JointData.spherical(
                    { x: 0, y: -lastRing.pivotBot, z: 0 },
                    { x: 0, y: ENEA_PEG_OFFSET, z: 0 },
                ),
                lastBody, eneaCharmBody, true,
            );
        }

        // ── Load visuals ──
        const TOTAL = 1 + ORANGE_RINGS.length + ZABKA_RINGS.length + HP_RINGS.length + WELLA_RINGS.length + LIDL_RINGS.length + SELGROS_RINGS.length + ENEA_RINGS.length + 7; // carabiner + all rings + 7 charms
        let loadCount = 0;
        function onLoaded() {
            if (++loadCount === TOTAL) {
                modelLoaded = true;
                console.log(`[keychain] ${TOTAL} parts loaded — chain ready`);

                // Init debug tool (press D to activate)
                const selectables: { label: string; group: THREE.Group; mesh: THREE.Object3D }[] = [];
                if (carabinerGroup) selectables.push({ label: 'Karabińczyk', group: carabinerGroup, mesh: carabinerGroup.children[0], body: carabinerBody });
                orangeGroups.forEach((g, i) => g && selectables.push({ label: `Orange ring ${ORANGE_RINGS[i].name}`, group: g, mesh: g.children[0], body: orangeBodies[i] }));
                zabkaGroups.forEach((g, i) => g && selectables.push({ label: `Żabka ring ${ZABKA_RINGS[i].name}`, group: g, mesh: g.children[0], body: zabkaBodies[i] }));
                hpGroups.forEach((g, i) => g && selectables.push({ label: `HP ring ${HP_RINGS[i].name}`, group: g, mesh: g.children[0], body: hpBodies[i] }));
                wellaGroups.forEach((g, i) => g && selectables.push({ label: `Wella ring ${WELLA_RINGS[i].name}`, group: g, mesh: g.children[0], body: wellaBodies[i] }));
                lidlGroups.forEach((g, i) => g && selectables.push({ label: `Lidl ring ${LIDL_RINGS[i].name}`, group: g, mesh: g.children[0], body: lidlBodies[i] }));
                selgrosGroups.forEach((g, i) => g && selectables.push({ label: `Selgros ring ${SELGROS_RINGS[i].name}`, group: g, mesh: g.children[0], body: selgrosBodies[i] }));
                eneaGroups.forEach((g, i) => g && selectables.push({ label: `Enea ring ${ENEA_RINGS[i].name}`, group: g, mesh: g.children[0], body: eneaBodies[i] }));
                if (orangeCharmGroup) selectables.push({ label: 'Orange charm', group: orangeCharmGroup, mesh: orangeCharmGroup.children[0], body: orangeCharmBody });
                if (zabkaCharmGroup) selectables.push({ label: 'Żabka charm', group: zabkaCharmGroup, mesh: zabkaCharmGroup.children[0], body: zabkaCharmBody });
                if (hpCharmGroup) selectables.push({ label: 'HP charm', group: hpCharmGroup, mesh: hpCharmGroup.children[0], body: hpCharmBody });
                if (wellaCharmGroup) selectables.push({ label: 'Wella charm', group: wellaCharmGroup, mesh: wellaCharmGroup.children[0], body: wellaCharmBody });
                if (lidlCharmGroup) selectables.push({ label: 'Lidl charm', group: lidlCharmGroup, mesh: lidlCharmGroup.children[0], body: lidlCharmBody });
                if (selgrosCharmGroup) selectables.push({ label: 'Selgros charm', group: selgrosCharmGroup, mesh: selgrosCharmGroup.children[0], body: selgrosCharmBody });
                if (eneaCharmGroup) selectables.push({ label: 'Enea charm', group: eneaCharmGroup, mesh: eneaCharmGroup.children[0], body: eneaCharmBody });
                initKeychainDebug({ scene, camera, renderer, mainGroup, selectables });
            }
        }

        // Carabiner visual
        loader.load(basePath + 'Carabiner.glb', (gltf) => {
            carabinerGroup = new THREE.Group();
            gltf.scene.rotation.y = -150 * Math.PI / 180;  // ← obrót karabińczyka
            carabinerGroup.add(gltf.scene);
            mainGroup.add(carabinerGroup);
            onLoaded();
        });

        // Orange charm — translucent tinted resin (Beer-Lambert volumetric absorption)
        loader.load(basePath + 'Orange.glb', (gltf) => {
            orangeCharmGroup = new THREE.Group();
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
                dispersion: 0,  // Dispersion requires chromatic aberration pass — disabled for perf
                side: THREE.DoubleSide,
            });

            // Apply material — peg is already centered in original mesh
            mesh.traverse(child => {
                const m = child as THREE.Mesh;
                if (m.isMesh) m.material = resinMat;
            });


            // ── Inner glowing core (cube within cube) ──
            // MeshStandardMaterial with emissive instead of second transmission pass.
            // Visually similar warm glow, but avoids expensive double-transmission render.
            const innerGeo = new THREE.BoxGeometry(0.5, 0.55, 0.22);
            const innerMat = new THREE.MeshStandardMaterial({
                color: 0xffcc00,
                roughness: 0.6,
                transparent: true,
                opacity: 0.55,
                emissive: new THREE.Color('#ff8800'),
                emissiveIntensity: 0.6,
                depthWrite: false,
                side: THREE.DoubleSide,
            });
            const innerCore = new THREE.Mesh(innerGeo, innerMat);
            innerCore.position.set(0, -0.48, 0.05);
            mesh.add(innerCore);

            // ── Pozycja i obrót wizualny charmu Orange ──
            mesh.position.set(1.025, 1.520, -0.586);
            mesh.rotation.set(-15.2 * Math.PI/180, 14.9 * Math.PI/180, 67.7 * Math.PI/180);

            orangeCharmGroup.add(mesh);
            mainGroup.add(orangeCharmGroup);
            onLoaded();
        });

        // Zabka charm — matte rubber
        loader.load(basePath + 'Zabka.glb', (gltf) => {
            zabkaCharmGroup = new THREE.Group();
            const mesh = gltf.scene;

            // Keep original palette textures from GLB — just tweak for rubber look
            mesh.traverse(child => {
                const m = child as THREE.Mesh;
                if (!m.isMesh) return;
                const mats = Array.isArray(m.material) ? m.material : [m.material];
                mats.forEach(mat => {
                    if (mat && 'roughness' in mat) {
                        (mat as THREE.MeshStandardMaterial).roughness = 0.85;
                        (mat as THREE.MeshStandardMaterial).metalness = 0.0;
                        (mat as THREE.MeshStandardMaterial).side = THREE.DoubleSide;
                    }
                });
            });

            // ── Pozycja i obrót wizualny charmu Żabka ──
            mesh.position.set(-0.829, 1.561, -0.096);
            mesh.rotation.set(-52.5 * Math.PI/180, -32.8 * Math.PI/180, -123.2 * Math.PI/180);

            zabkaCharmGroup.add(mesh);
            mainGroup.add(zabkaCharmGroup);
            onLoaded();
        });

        // HP charm — brushed metal (keep original materials from GLB)
        loader.load(basePath + 'HP.glb', (gltf) => {
            hpCharmGroup = new THREE.Group();
            const mesh = gltf.scene;

            // Keep original Metal + Metal_Inside materials from GLB
            // Just ensure double-sided rendering
            mesh.traverse(child => {
                const m = child as THREE.Mesh;
                if (!m.isMesh) return;
                const mats = Array.isArray(m.material) ? m.material : [m.material];
                mats.forEach(mat => {
                    if (mat) (mat as THREE.MeshStandardMaterial).side = THREE.DoubleSide;
                });
            });

            // ── Pozycja i obrót wizualny charmu HP ──
            mesh.position.set(0.038, 1.230, 0.590);
            mesh.rotation.set(159.4 * Math.PI/180, 61.8 * Math.PI/180, 139.6 * Math.PI/180);

            hpCharmGroup.add(mesh);
            mainGroup.add(hpCharmGroup);
            onLoaded();
        });

        // Wella charm — keep original Gold Ore + Dirty red plastic materials
        loader.load(basePath + 'Wella.glb', (gltf) => {
            wellaCharmGroup = new THREE.Group();
            const mesh = gltf.scene;
            mesh.traverse(child => {
                const m = child as THREE.Mesh;
                if (!m.isMesh) return;
                const mats = Array.isArray(m.material) ? m.material : [m.material];
                mats.forEach(mat => { if (mat) (mat as THREE.MeshStandardMaterial).side = THREE.DoubleSide; });
            });
            // ── Pozycja i obrót wizualny charmu Wella ──
            mesh.position.set(0.474, 0.609, -0.394);
            mesh.rotation.set(53.8 * Math.PI/180, -30.3 * Math.PI/180, 0.6 * Math.PI/180);
            wellaCharmGroup.add(mesh);
            mainGroup.add(wellaCharmGroup);
            onLoaded();
        });

        // Lidl charm — keep original materials (yellow logo, red border, blue leather)
        loader.load(basePath + 'Lidl.glb', (gltf) => {
            lidlCharmGroup = new THREE.Group();
            const mesh = gltf.scene;
            mesh.traverse(child => {
                const m = child as THREE.Mesh;
                if (!m.isMesh) return;
                const mats = Array.isArray(m.material) ? m.material : [m.material];
                mats.forEach(mat => { if (mat) (mat as THREE.MeshStandardMaterial).side = THREE.DoubleSide; });
            });
            // ── Pozycja i obrót wizualny charmu Lidl ──
            mesh.position.set(0.860, 1.074, 0.013);
            mesh.rotation.set(96.0 * Math.PI/180, -34.6 * Math.PI/180, 111.6 * Math.PI/180);
            lidlCharmGroup.add(mesh);
            mainGroup.add(lidlCharmGroup);
            onLoaded();
        });

        // Selgros charm — keep original materials
        loader.load(basePath + 'Selgros.glb', (gltf) => {
            selgrosCharmGroup = new THREE.Group();
            const mesh = gltf.scene;
            mesh.traverse(child => {
                const m = child as THREE.Mesh;
                if (!m.isMesh) return;
                const mats = Array.isArray(m.material) ? m.material : [m.material];
                mats.forEach(mat => { if (mat) (mat as THREE.MeshStandardMaterial).side = THREE.DoubleSide; });
            });
            mesh.position.set(-0.614, 1.091, 0.189);
            mesh.rotation.set(-22.5 * Math.PI/180, -8.5 * Math.PI/180, -32.0 * Math.PI/180);
            selgrosCharmGroup.add(mesh);
            mainGroup.add(selgrosCharmGroup);
            onLoaded();
        });

        // Enea charm — keep original Metal + Metal_Inside materials
        loader.load(basePath + 'Enea.glb', (gltf) => {
            eneaCharmGroup = new THREE.Group();
            const mesh = gltf.scene;
            mesh.traverse(child => {
                const m = child as THREE.Mesh;
                if (!m.isMesh) return;
                const mats = Array.isArray(m.material) ? m.material : [m.material];
                mats.forEach(mat => { if (mat) (mat as THREE.MeshStandardMaterial).side = THREE.DoubleSide; });
            });
            mesh.position.set(-1.329, 1.244, 0.511);
            mesh.rotation.set(-46.0 * Math.PI/180, 15.0 * Math.PI/180, -46.0 * Math.PI/180);
            mesh.scale.setScalar(0.80);
            eneaCharmGroup.add(mesh);
            mainGroup.add(eneaCharmGroup);
            onLoaded();
        });

        // Ring visuals — load CircleBig.glb once, clone for all chains
        loader.load(basePath + 'CircleBig.glb', (gltf) => {
            // Helper: load ring visual from definition
            function loadRingVisual(ring: typeof ORANGE_RINGS[0], groups: THREE.Group[], i: number) {
                const group = new THREE.Group();
                const mesh = gltf.scene.clone();
                const d2r = Math.PI / 180;
                // If meshRot provided, use full euler. Otherwise plane+rotY.
                if ('meshRot' in ring && (ring as any).meshRot) {
                    const mr = (ring as any).meshRot as [number,number,number];
                    mesh.rotation.set(mr[0] * d2r, mr[1] * d2r, mr[2] * d2r);
                } else {
                    if (ring.plane === 'yz') mesh.rotation.y = Math.PI / 2;
                    if (ring.rotY) mesh.rotation.y += ring.rotY * d2r;
                }
                mesh.position.set(ring.meshPos[0], ring.meshPos[1], ring.meshPos[2]);
                mesh.scale.setScalar(ring.scale);
                group.add(mesh);
                mainGroup.add(group);
                groups[i] = group;
                onLoaded();
            }

            ORANGE_RINGS.forEach((ring, i) => loadRingVisual(ring, orangeGroups, i));
            ZABKA_RINGS.forEach((ring, i) => loadRingVisual(ring, zabkaGroups, i));
            HP_RINGS.forEach((ring, i) => loadRingVisual(ring, hpGroups, i));
            WELLA_RINGS.forEach((ring, i) => loadRingVisual(ring, wellaGroups, i));
            LIDL_RINGS.forEach((ring, i) => loadRingVisual(ring, lidlGroups, i));
            SELGROS_RINGS.forEach((ring, i) => loadRingVisual(ring, selgrosGroups, i));
            ENEA_RINGS.forEach((ring, i) => loadRingVisual(ring, eneaGroups, i));
        });
    });

    // Pre-allocated quaternion for Zabka 90° rotation
    // Zabka charm rotation baked into mesh.rotation.y at load time (-40.5°)

    // ── Projection (pre-allocated vectors to avoid per-frame GC) ──
    const _projV = new THREE.Vector3();
    const _projResult = new THREE.Vector3();
    function screenToWorld(x: number, y: number) {
        _projV.set((x / window.innerWidth) * 2 - 1, -(y / window.innerHeight) * 2 + 1, 0.5);
        _projV.unproject(camera); _projV.sub(camera.position).normalize();
        return _projResult.copy(camera.position).add(_projV.multiplyScalar(-camera.position.z / _projV.z));
    }

    // Phase 1: placeholder → fly to center + scale up (first 20% of intro scroll)
    const animState = { progress: 0 };
    gsap.to(animState, { progress: 1, scrollTrigger: { trigger: '#intro', start: 'top top', end: '20% top', scrub: 0.15 } });

    // Phase 2: hold at center (20%–40%) — showcase moment, brelok alone on screen
    // (no animation needed — just holds position)

    // Phase 3: slide down through intro + ft-section (keychain travels with sticky title)
    const slideState = { progress: 0 };
    gsap.to(slideState, { progress: 1, scrollTrigger: { trigger: '#intro', start: '25% top', endTrigger: '#ft-section', end: 'bottom top', scrub: 0.15 } });

    // Phase 4: exit — fade out before Process section
    const exitState = { progress: 0 };
    _exitState = exitState;
    _mainGroup = mainGroup;
    gsap.to(exitState, { progress: 1, scrollTrigger: { trigger: '#process', start: 'top bottom', end: 'top 40%', scrub: 0.15 } });

    const keychainAnchor = document.getElementById('ft-section') || document.getElementById('keychain-anchor');

    let mouseX = 0, mouseY = 0;
    if (!isMobile) {
        window.addEventListener('mousemove', (e) => { mouseX = (e.clientX / window.innerWidth) - 0.5; mouseY = (e.clientY / window.innerHeight) - 0.5; });
    }

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

    const lastTile = document.querySelector('.project-tile:last-child');
    function hitTest(cx: number, cy: number): boolean {
        if (!modelLoaded) return false;
        // Only allow interaction below the last portfolio tile
        if (lastTile) {
            const tileBottom = lastTile.getBoundingClientRect().bottom;
            if (cy < tileBottom) return false;
        }
        return cx >= hitX0 && cx <= hitX1 && cy >= hitY0 && cy <= hitY1;
    }

    window.addEventListener('mousedown', (e) => { if (isDebugMode) return; if (hitTest(e.clientX,e.clientY)) { isDragging=true; lastDragX=e.clientX; dragVelocity=0; document.body.style.cursor='grabbing'; e.preventDefault(); } });
    window.addEventListener('mousemove', (e) => { if (isDebugMode) return; if (isDragging) { const d=e.clientX-lastDragX; dragRotY+=d*.008; dragVelocity=d*.008; lastDragX=e.clientX; } else { const o=hitTest(e.clientX,e.clientY); if(o!==isHovering){isHovering=o;document.body.style.cursor=o?'grab':'';} } });
    window.addEventListener('mouseup', () => { if (isDebugMode) return; if (isDragging) { isDragging=false; document.body.style.cursor=isHovering?'grab':''; } });
    window.addEventListener('wheel', (e) => { if (isDebugMode) return; if (!hitTest(e.clientX,e.clientY)) return; if (Math.abs(e.deltaX)>Math.abs(e.deltaY)) { const d=e.deltaX*.003; if(Math.abs(d)>.001){e.preventDefault();dragRotY+=d;dragVelocity=d;} } else if(e.ctrlKey) e.preventDefault(); }, { passive: false });
    window.addEventListener('touchstart', (e) => { if (isDebugMode) return; if (e.touches.length===2) { touchActive=true; touchStartX=(e.touches[0].clientX+e.touches[1].clientX)/2; dragVelocity=0; } }, { passive: true });
    window.addEventListener('touchmove', (e) => { if (isDebugMode) return; if (touchActive&&e.touches.length===2) { const cx=(e.touches[0].clientX+e.touches[1].clientX)/2; const d=cx-touchStartX; dragRotY+=d*.006; dragVelocity=d*.006; touchStartX=cx; } }, { passive: true });
    window.addEventListener('touchend', () => { if (isDebugMode) return; touchActive=false; });

    // Smoothed position/scale — always lerp, never snap (except first frame)
    let smoothX = 0, smoothY = 0, smoothScale = 0.34;
    let firstFrame = true;

    // No anchor — object follows placeholder live when pinned, detaches at 30%

    // Hit bounds throttle — every 3rd frame is enough for hover detection
    let hitBoundsCounter = 0;

    // Visibility-based rendering — pause when 3D container is off-screen
    let sceneVisible = true;
    const visObserver = new IntersectionObserver(
        (entries) => { sceneVisible = entries[0].isIntersecting; },
        { threshold: 0 }
    );
    visObserver.observe(globalContainer);

    function animate() {
        requestAnimationFrame(animate);
        if (!modelLoaded || !world) return;
        // Skip physics + render when completely off-screen (but not in debug mode)
        if (!sceneVisible && !isDebugMode) return;

        const time = Date.now() * 0.001;

        // ── Drag/spin + mouse impulse (disabled in debug mode) ──
        if (!isDebugMode) {
            if (!isDragging && !touchActive) { dragRotY += dragVelocity; dragVelocity *= 0.95; if (Math.abs(dragVelocity) < .0001) dragVelocity = 0; }
            const spinAmount = animState.progress <= 0.3 ? 0 : Math.min((animState.progress - 0.3) / 0.2, 1);
            mainGroup.rotation.y += 0.0013 * spinAmount + dragVelocity;
            mainRotVelocity = mainGroup.rotation.y - prevMainRotY;
            prevMainRotY = mainGroup.rotation.y;
            const ix = (mouseX * PHYS.MOUSE_FORCE - mainRotVelocity * PHYS.INERTIA_FORCE) * (1/60);
            const iz = mouseY * PHYS.MOUSE_FORCE * (1/60);
            if (orangeCharmBody) orangeCharmBody.applyImpulse({ x: ix, y: 0, z: iz }, true);
            if (zabkaCharmBody) zabkaCharmBody.applyImpulse({ x: ix, y: 0, z: iz }, true);
        }

        // ── Gravity with 3D spread (ALWAYS — same in debug and normal) ──
        {
            const G = 9.82 * (1/60);

            // Orange: lewo + do przodu
            const OA = -15 * Math.PI / 180;
            const og = { x: Math.sin(OA) * G, y: -Math.cos(OA) * G, z: 0.02 * G };
            orangeBodies.forEach(b => { const m = b.mass(); b.applyImpulse({ x: og.x*m, y: og.y*m, z: og.z*m }, true); });
            if (orangeCharmBody) { const m = orangeCharmBody.mass(); orangeCharmBody.applyImpulse({ x: og.x*m, y: og.y*m, z: og.z*m }, true); }

            // Zabka: prawo + do przodu
            const ZA = 30 * Math.PI / 180;
            const zg = { x: Math.sin(ZA) * G, y: -Math.cos(ZA) * G, z: -0.02 * G };
            zabkaBodies.forEach(b => { const m = b.mass(); b.applyImpulse({ x: zg.x*m, y: zg.y*m, z: zg.z*m }, true); });
            if (zabkaCharmBody) { const m = zabkaCharmBody.mass(); zabkaCharmBody.applyImpulse({ x: zg.x*m, y: zg.y*m, z: zg.z*m }, true); }

            // HP: lekko prawo + do tyłu (Z separation od Orange i Zabka)
            const HA = 5 * Math.PI / 180;
            const hg = { x: Math.sin(HA) * G, y: -Math.cos(HA) * G, z: -0.06 * G };
            hpBodies.forEach(b => { const m = b.mass(); b.applyImpulse({ x: hg.x*m, y: hg.y*m, z: hg.z*m }, true); });
            if (hpCharmBody) { const m = hpCharmBody.mass(); hpCharmBody.applyImpulse({ x: hg.x*m, y: hg.y*m, z: hg.z*m }, true); }

            // Wella: lewo + do przodu
            const WA = -25 * Math.PI / 180;
            const wg = { x: Math.sin(WA) * G, y: -Math.cos(WA) * G, z: 0.04 * G };
            wellaBodies.forEach(b => { const m = b.mass(); b.applyImpulse({ x: wg.x*m, y: wg.y*m, z: wg.z*m }, true); });
            if (wellaCharmBody) { const m = wellaCharmBody.mass(); wellaCharmBody.applyImpulse({ x: wg.x*m, y: wg.y*m, z: wg.z*m }, true); }
            // Lidl shares Wella's gravity direction
            lidlBodies.forEach(b => { const m = b.mass(); b.applyImpulse({ x: wg.x*m, y: wg.y*m, z: wg.z*m }, true); });
            if (lidlCharmBody) { const m = lidlCharmBody.mass(); lidlCharmBody.applyImpulse({ x: wg.x*m, y: wg.y*m, z: wg.z*m }, true); }

            // Selgros + Enea: right + slightly back
            const SA = 15 * Math.PI / 180;
            const sg = { x: Math.sin(SA) * G, y: -Math.cos(SA) * G, z: -0.03 * G };
            selgrosBodies.forEach(b => { const m = b.mass(); b.applyImpulse({ x: sg.x*m, y: sg.y*m, z: sg.z*m }, true); });
            if (selgrosCharmBody) { const m = selgrosCharmBody.mass(); selgrosCharmBody.applyImpulse({ x: sg.x*m, y: sg.y*m, z: sg.z*m }, true); }
            eneaBodies.forEach(b => { const m = b.mass(); b.applyImpulse({ x: sg.x*m, y: sg.y*m, z: sg.z*m }, true); });
            if (eneaCharmBody) { const m = eneaCharmBody.mass(); eneaCharmBody.applyImpulse({ x: sg.x*m, y: sg.y*m, z: sg.z*m }, true); }

            if (carabinerBody) { const m = carabinerBody.mass(); carabinerBody.applyImpulse({ x: 0, y: -G * m, z: 0 }, true); }
        }

        // ── Physics step + sync (ALWAYS — same in debug and normal) ──
        world.timestep = 1 / 60;
        world.step();

        if (carabinerBody && carabinerGroup) {
            const p = carabinerBody.translation(); const r = carabinerBody.rotation();
            carabinerGroup.position.set(p.x, p.y, p.z); carabinerGroup.quaternion.set(r.x, r.y, r.z, r.w);
        }
        orangeBodies.forEach((body, i) => {
            const group = orangeGroups[i]; if (!group) return;
            const p = body.translation(); const r = body.rotation();
            group.position.set(p.x, p.y, p.z); group.quaternion.set(r.x, r.y, r.z, r.w);
        });
        if (orangeCharmBody && orangeCharmGroup) {
            const p = orangeCharmBody.translation(); orangeCharmGroup.position.set(p.x, p.y, p.z);
            const lastBody = orangeBodies[orangeBodies.length - 1];
            if (lastBody) { const r = lastBody.rotation(); orangeCharmGroup.quaternion.set(r.x, r.y, r.z, r.w); }
        }
        zabkaBodies.forEach((body, i) => {
            const group = zabkaGroups[i]; if (!group) return;
            const p = body.translation(); const r = body.rotation();
            group.position.set(p.x, p.y, p.z); group.quaternion.set(r.x, r.y, r.z, r.w);
        });
        if (zabkaCharmBody && zabkaCharmGroup) {
            const p = zabkaCharmBody.translation(); zabkaCharmGroup.position.set(p.x, p.y, p.z);
            const lastBody = zabkaBodies[zabkaBodies.length - 1];
            if (lastBody) { const r = lastBody.rotation(); zabkaCharmGroup.quaternion.set(r.x, r.y, r.z, r.w); }
        }
        // Sync HP chain
        hpBodies.forEach((body, i) => {
            const group = hpGroups[i]; if (!group) return;
            const p = body.translation(); const r = body.rotation();
            group.position.set(p.x, p.y, p.z); group.quaternion.set(r.x, r.y, r.z, r.w);
        });
        if (hpCharmBody && hpCharmGroup) {
            const p = hpCharmBody.translation(); hpCharmGroup.position.set(p.x, p.y, p.z);
            const lastBody = hpBodies[hpBodies.length - 1];
            if (lastBody) { const r = lastBody.rotation(); hpCharmGroup.quaternion.set(r.x, r.y, r.z, r.w); }
        }
        // Sync Wella chain
        wellaBodies.forEach((body, i) => {
            const group = wellaGroups[i]; if (!group) return;
            const p = body.translation(); const r = body.rotation();
            group.position.set(p.x, p.y, p.z); group.quaternion.set(r.x, r.y, r.z, r.w);
        });
        if (wellaCharmBody && wellaCharmGroup) {
            const p = wellaCharmBody.translation(); wellaCharmGroup.position.set(p.x, p.y, p.z);
            const lastBody = wellaBodies[wellaBodies.length - 1];
            if (lastBody) { const r = lastBody.rotation(); wellaCharmGroup.quaternion.set(r.x, r.y, r.z, r.w); }
        }
        // Sync Lidl chain (hangs from Wella big ring)
        lidlBodies.forEach((body, i) => {
            const group = lidlGroups[i]; if (!group) return;
            const p = body.translation(); const r = body.rotation();
            group.position.set(p.x, p.y, p.z); group.quaternion.set(r.x, r.y, r.z, r.w);
        });
        if (lidlCharmBody && lidlCharmGroup) {
            const p = lidlCharmBody.translation(); lidlCharmGroup.position.set(p.x, p.y, p.z);
            const lastBody = lidlBodies[lidlBodies.length - 1];
            if (lastBody) { const r = lastBody.rotation(); lidlCharmGroup.quaternion.set(r.x, r.y, r.z, r.w); }
        }
        // Sync Selgros chain
        selgrosBodies.forEach((body, i) => {
            const group = selgrosGroups[i]; if (!group) return;
            const p = body.translation(); const r = body.rotation();
            group.position.set(p.x, p.y, p.z); group.quaternion.set(r.x, r.y, r.z, r.w);
        });
        if (selgrosCharmBody && selgrosCharmGroup) {
            const p = selgrosCharmBody.translation(); selgrosCharmGroup.position.set(p.x, p.y, p.z);
            const lastBody = selgrosBodies[selgrosBodies.length - 1];
            if (lastBody) { const r = lastBody.rotation(); selgrosCharmGroup.quaternion.set(r.x, r.y, r.z, r.w); }
        }
        // Sync Enea chain (hangs from Selgros charm)
        eneaBodies.forEach((body, i) => {
            const group = eneaGroups[i]; if (!group) return;
            const p = body.translation(); const r = body.rotation();
            group.position.set(p.x, p.y, p.z); group.quaternion.set(r.x, r.y, r.z, r.w);
        });
        if (eneaCharmBody && eneaCharmGroup) {
            const p = eneaCharmBody.translation(); eneaCharmGroup.position.set(p.x, p.y, p.z);
            const lastBody = eneaBodies[eneaBodies.length - 1];
            if (lastBody) { const r = lastBody.rotation(); eneaCharmGroup.quaternion.set(r.x, r.y, r.z, r.w); }
        }

        // ── Scroll positioning + visuals (disabled in debug mode) ──
        if (!isDebugMode) {
        const t = animState.progress;
        const s = slideState.progress;
        let tgtX: number, tgtYPos: number, tgtScale: number;

        if (s > 0 && keychainAnchor) {
            const anchorRect = keychainAnchor.getBoundingClientRect();
            if (anchorRect.width > 0 && anchorRect.height > 0) {
                // Target: top of ft-section (not center), clamped to stay in viewport
                const anchorWorld = screenToWorld(anchorRect.left + anchorRect.width / 2, Math.min(anchorRect.top, window.innerHeight * 0.65));
                const anchorOffset = 0.6 * CENTERED_SCALE;
                mainGroup.visible = true;
                tgtScale = CENTERED_SCALE;
                tgtX = gsap.utils.interpolate(0, anchorWorld.x, s);
                tgtYPos = gsap.utils.interpolate(CENTERED_Y, anchorWorld.y + anchorOffset, s);
            } else {
                mainGroup.visible = true;
                tgtScale = CENTERED_SCALE;
                tgtX = 0;
                tgtYPos = CENTERED_Y;
            }
        } else if (t >= 1) {
            mainGroup.visible = true;
            tgtScale = CENTERED_SCALE;
            tgtX = 0;
            tgtYPos = CENTERED_Y;
        } else {
            const rect = placeholder!.getBoundingClientRect();
            if (rect.width === 0 && rect.height === 0) {
                mainGroup.visible = false;
                renderer.render(scene, camera);
                return;
            }
            mainGroup.visible = true;
            const sp = screenToWorld(rect.left + rect.width / 2, rect.top + rect.height / 2);
            const pinnedOffset = 0.6 * PINNED_SCALE;
            tgtScale = gsap.utils.interpolate(PINNED_SCALE, CENTERED_SCALE, t);
            tgtX = gsap.utils.interpolate(sp.x, 0, t);
            tgtYPos = gsap.utils.interpolate(sp.y + pinnedOffset, CENTERED_Y, t);
        }

        if (firstFrame) {
            smoothX = tgtX; smoothY = tgtYPos; smoothScale = tgtScale;
            firstFrame = false;
        } else {
            smoothX += (tgtX - smoothX) * 0.5;
            smoothY += (tgtYPos - smoothY) * 0.5;
            smoothScale += (tgtScale - smoothScale) * 0.5;
        }

        const levAmount = Math.min(t * 3, 1);
        const levY = Math.sin(time * 0.8) * 0.04 * levAmount;
        const levTiltX = Math.sin(time * 0.5) * 0.03 * levAmount;
        const levTiltZ = Math.cos(time * 0.7) * 0.02 * levAmount;

        const ex = exitState.progress;
        const exitY = ex * 5;
        const exitScale = 1 - ex * 0.4;

        mainGroup.scale.setScalar(smoothScale * exitScale);
        mainGroup.position.set(smoothX, smoothY + levY + exitY, 0);
        mainGroup.rotation.x = levTiltX;
        mainGroup.rotation.z = levTiltZ;

        if (ex >= 1) { mainGroup.visible = false; }
        else if (t > 0 || ex === 0) { mainGroup.visible = true; }

        if (++hitBoundsCounter >= 3) {
            hitBoundsCounter = 0;
            updateHitBounds();
        }
        } // end if (!isDebugMode)

        updateDebug();
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
