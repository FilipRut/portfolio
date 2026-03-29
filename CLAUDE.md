# Keychain 3D — Guide for Agents

## Stack
- **Three.js** v0.183.2 — rendering
- **Rapier3D** (`@dimforge/rapier3d-compat`) — WASM physics engine
- **GSAP + ScrollTrigger** — scroll animation
- **Astro** v6 — build system
- **lil-gui** (devDependency) — debug tool UI

## Architecture

Scene file: `src/scripts/threeScene.ts`
Debug tool: `src/scripts/keychainDebug.ts`
Parts directory: `public/assets/models/parts-opt/`

### Available GLB Parts
| File | Content | Geometry Center | Notes |
|---|---|---|---|
| `Carabiner.glb` | Karabińczyk (oval loop) | Y=0.05, height 1.69 | Top Y=0.89, bottom Y=-0.79 |
| `CircleBig.glb` | Ring (flat in Z, XY plane) | Y=0.41, diameter 0.58 | Used for all rings at different scales |
| `Orange.glb` | Charm Orange | Y=-0.456, 0.88w×0.94h×0.39d | Peg at TOP (Y≈0.012), Beer-Lambert resin |
| `Zabka.glb` | Charm Żabka | Y=-0.606, 1.31w×1.26h×0.09d | Peg at TOP (Y≈0.024), rubber material |
| `Wella.glb` | Charm Wella | single mesh | Not yet integrated |
| `HP.glb` | Charm HP | single mesh | Not yet integrated |
| `Lidl.glb` | Charm Lidl | single mesh | Not yet integrated |
| `Selgros.glb` | Charm Selgros | single mesh | Not yet integrated |
| `Enea.glb` | Charm Enea | single mesh | Not yet integrated |

## Current Chain Structure

```
Anchor (fixed, Y=0.89)
  └─ Carabiner (dynamic, ellipse of 28 spheres in XY plane)
       │  joint: anchor(0,0,0) → carabiner(0, 0.89, 0)
       │
       ├─ [Orange chain, attach (-0.15, -0.69, 0)]
       │  └─ BigRing (R=0.27, scale=1.0, YZ, 20 spheres, rotY=43°)
       │       └─ MediumRing (R=0.18, scale=0.67, XY, 16 spheres, rotY=-46°)
       │            └─ SmallRing (R=0.12, scale=0.44, YZ, 12 spheres, rotY=-19.5°)
       │                 └─ Orange Charm (cuboid 0.44×0.47×0.19, PEG_OFFSET=0.46)
       │
       └─ [Zabka chain, attach (0.23, -0.46, 0)]
          └─ ZBigRing (R=0.20, scale=0.74, YZ, 16 spheres, rotY=0°)
               └─ ZSmallRing (R=0.14, scale=0.52, XY, 12 spheres, rotY=-55.5°)
                    └─ Zabka Charm (cuboid 0.66×0.63×0.10, PEG_OFFSET=0.63)
```

## Multi-Chain Architecture

### Zero-gravity + per-chain directional pull
World gravity is `{ x: 0, y: 0, z: 0 }`. Each chain gets its own gravity direction via per-frame impulses:
- **Orange**: -15° from vertical (pulls left)
- **Żabka**: +30° from vertical (pulls right)
- **Carabiner**: straight down

### Collision groups (inter-chain collisions)
```typescript
const CARABINER_GROUP = (0x0004 << 16) | 0x0000; // no collisions (rings thread through)
const ORANGE_GROUP    = (0x0001 << 16) | 0x0002; // collides with Zabka only
const ZABKA_GROUP     = (0x0002 << 16) | 0x0001; // collides with Orange only
```
Each ring also has a **center blocker** sphere (R×0.55) to prevent other chain's rings from passing through the middle.

### Spawn position: X propagation
`createRingChain()` propagates parent X position: `centerX = parentPos.x + (curBottom.x || 0)`. This ensures all rings in a chain spawn at the correct X offset, not at x=0.

## How to Add a New Charm (Step by Step)

### Step 1: Analyze the GLB model
```bash
node -e "
const fs = require('fs');
const buf = fs.readFileSync('public/assets/models/parts-opt/CharmName.glb');
const jsonLen = buf.readUInt32LE(12);
const json = JSON.parse(buf.slice(20, 20 + jsonLen).toString());
json.meshes?.forEach((mesh, mi) => {
    mesh.primitives.forEach((prim, pi) => {
        const acc = json.accessors[prim.attributes.POSITION];
        console.log(mesh.name, 'min:', acc.min, 'max:', acc.max);
    });
});
"
```
Find: bounding box (halfW, halfH, halfD for cuboid collider), peg Y position, center Y.

### Step 2: Define a new RINGS array
```typescript
const NEWCHARM_RINGS = [
    { name: 'nbig', R: 0.20, tubeR: 0.025, scale: 0.74, N: 16,
      pivotTop: 0.14, pivotBot: 0.16, plane: 'yz' as const,
      rotY: 0,
      meshPos: [0, -0.303, 0] as [number,number,number] },
    // Add more rings as needed...
];
```

**Ring params explained:**
| Param | Meaning | Tuning |
|---|---|---|
| `R` | Physics ring radius | Larger = bigger ring |
| `tubeR` | Collision sphere radius | ~0.02-0.03 |
| `scale` | Visual scale of CircleBig.glb | Match R proportionally |
| `N` | Number of collision spheres | 12-20 |
| `pivotTop` | How deep ring sits IN parent | 0 = center at joint (deep), R = bottom at joint (shallow) |
| `pivotBot` | Where child attaches below | Controls gap to next element |
| `plane` | `'yz'` or `'xy'` — alternate! | YZ → XY → YZ pattern |
| `rotY` | Visual rotation in degrees | Tune in debug mode (D key) |
| `meshPos` | Visual position offset `[x,y,z]` | Tune in debug mode |
| `meshRotXZ` | Optional extra X/Z rotation `[x°,z°]` | Only if needed from propagation |

### Step 3: Add collision group
```typescript
const NEWCHARM_GROUP = (0x0004 << 16) | 0x0003; // member=4, filter=1+2 (collides with Orange+Zabka)
```
Update existing groups' filters to include the new group.

### Step 4: Add variables
```typescript
const newcharmBodies: RAPIER.RigidBody[] = [];
const newcharmGroups: THREE.Group[] = [];
let newcharmCharmBody: RAPIER.RigidBody;
let newcharmCharmGroup: THREE.Group;
```

### Step 5: Create ring chain
```typescript
createRingChain(NEWCHARM_RINGS, carabinerBody,
    { x: 0.XX, y: -0.YY, z: 0 },  // attach point on carabiner ellipse
    newcharmBodies, NEWCHARM_GROUP);
```
**Carabiner ellipse**: semiA=0.35 (X), semiB=0.80 (Y), centerY=0.05.
At angle θ from bottom: `x = 0.35·sin(θ)`, `y = 0.05 - 0.80·cos(θ)`.

### Step 6: Create charm physics body
```typescript
const NEWCHARM_PEG_OFFSET = 0.XX; // peg Y - center Y from GLB analysis
{
    const lastRing = NEWCHARM_RINGS[NEWCHARM_RINGS.length - 1];
    const lastBody = newcharmBodies[newcharmBodies.length - 1];
    const lastPos = lastBody.translation();
    const jointWorldY = lastPos.y + (-lastRing.pivotBot);
    const charmCenterY = jointWorldY - NEWCHARM_PEG_OFFSET;

    newcharmCharmBody = world.createRigidBody(
        RAPIER.RigidBodyDesc.dynamic()
            .setTranslation(lastPos.x, charmCenterY, 0)
            .setLinearDamping(PHYS.LINEAR_DAMPING)
            .setAngularDamping(PHYS.ANGULAR_DAMPING)
            .setCcdEnabled(true)
    );
    world.createCollider(
        RAPIER.ColliderDesc.cuboid(halfW, halfH, halfD)
            .setCollisionGroups(NEWCHARM_GROUP)
            .setDensity(1.0).setFriction(0.0).setRestitution(0.0),
        newcharmCharmBody,
    );
    world.createImpulseJoint(
        RAPIER.JointData.spherical(
            { x: 0, y: -lastRing.pivotBot, z: 0 },
            { x: 0, y: NEWCHARM_PEG_OFFSET, z: 0 },
        ),
        lastBody, newcharmCharmBody, true,
    );
}
```

### Step 7: Load visual + material
```typescript
loader.load(basePath + 'CharmName.glb', (gltf) => {
    newcharmCharmGroup = new THREE.Group();
    const mesh = gltf.scene;

    // Apply material (choose one):
    // A) Rubber/matte: MeshStandardMaterial({ color, roughness: 0.95, metalness: 0 })
    // B) Resin/transparent: MeshPhysicalMaterial({ transmission: 1, attenuationColor, ... })
    // C) Default from GLB: skip material assignment

    mesh.traverse(child => {
        const m = child as THREE.Mesh;
        if (m.isMesh) m.material = myMaterial;
    });

    // Position + rotation — tune these in debug mode (D key)
    mesh.position.set(0, CENTER_OFFSET, 0);
    // mesh.rotation.y = ANGLE; // if needed

    newcharmCharmGroup.add(mesh);
    mainGroup.add(newcharmCharmGroup);
    onLoaded();
});
```

### Step 8: Update TOTAL load count
```typescript
const TOTAL = 1 + ORANGE_RINGS.length + ZABKA_RINGS.length + NEWCHARM_RINGS.length + 3;
// carabiner + all ring chains + all charms
```

### Step 9: Add ring visuals in CircleBig.glb loader
```typescript
NEWCHARM_RINGS.forEach((ring, i) => {
    const group = new THREE.Group();
    const mesh = gltf.scene.clone();
    if (ring.plane === 'yz') mesh.rotation.y = Math.PI / 2;
    if (ring.rotY) mesh.rotation.y += ring.rotY * Math.PI / 180;
    if ('meshRotXZ' in ring && ring.meshRotXZ) {
        mesh.rotation.x = ring.meshRotXZ[0] * Math.PI / 180;
        mesh.rotation.z = ring.meshRotXZ[1] * Math.PI / 180;
    }
    mesh.position.set(ring.meshPos[0], ring.meshPos[1], ring.meshPos[2]);
    mesh.scale.setScalar(ring.scale);
    group.add(mesh);
    mainGroup.add(group);
    newcharmGroups[i] = group;
    onLoaded();
});
```

### Step 10: Add sync in animate loop
```typescript
// Sync new chain rings
newcharmBodies.forEach((body, i) => {
    const group = newcharmGroups[i]; if (!group) return;
    const p = body.translation(); const r = body.rotation();
    group.position.set(p.x, p.y, p.z); group.quaternion.set(r.x, r.y, r.z, r.w);
});
// Sync new charm
if (newcharmCharmBody && newcharmCharmGroup) {
    const p = newcharmCharmBody.translation(); newcharmCharmGroup.position.set(p.x, p.y, p.z);
    const lastBody = newcharmBodies[newcharmBodies.length - 1];
    if (lastBody) { const r = lastBody.rotation(); newcharmCharmGroup.quaternion.set(r.x, r.y, r.z, r.w); }
}
```

### Step 11: Add directional gravity
```typescript
const NEWCHARM_ANGLE = XX * Math.PI / 180; // choose angle to spread from other chains
const ngx = Math.sin(NEWCHARM_ANGLE) * G, ngy = -Math.cos(NEWCHARM_ANGLE) * G;
newcharmBodies.forEach(b => { const m = b.mass(); b.applyImpulse({ x: ngx * m, y: ngy * m, z: 0 }, true); });
if (newcharmCharmBody) { const m = newcharmCharmBody.mass(); newcharmCharmBody.applyImpulse({ x: ngx * m, y: ngy * m, z: 0 }, true); }
```

### Step 12: Register in debug tool
```typescript
newcharmGroups.forEach((g, i) => g && selectables.push({
    label: `NewCharm ring ${NEWCHARM_RINGS[i].name}`, group: g, mesh: g.children[0], body: newcharmBodies[i]
}));
if (newcharmCharmGroup) selectables.push({
    label: 'NewCharm charm', group: newcharmCharmGroup, mesh: newcharmCharmGroup.children[0], body: newcharmCharmBody
});
```

### Step 13: Tune with debug tool
1. Open page, press **D** to enter debug mode
2. Select elements from dropdown or click
3. Use **gizmo arrows** (T/R/S) or **sliders** to adjust mesh position/rotation
4. Press **📋 Kopiuj wszystkie wartości** to export
5. Implement `meshPos` and `rotY` values in code
6. **IMPORTANT**: Only `mesh.position` and `mesh.rotation.y` (as rotY) are reliably portable to code. `mesh.rotation.x/z` and `group.position` depend on physics state.

## Debug Tool (press D)

Full documentation: `memory/debug_tool.md`

Key points:
- **Physics runs normally** in debug mode — what you see = what you get
- **Gizmo operates on mesh** (not group) — changes persist after exit
- Disabled in debug: scroll positioning, mainGroup spin, mouse impulse
- Enabled: OrbitControls, gizmo (T/R/S in local space), GUI sliders, undo/redo (⌘Z/⌘⇧Z)
- Parent→children propagation: position (worldToLocal), rotation (quaternion delta), scale (ratio)

## Critical Rules

1. **No Trimesh-vs-Trimesh** — Rapier doesn't support it on dynamic bodies. Use compound spheres or convex hull.
2. **Inter-chain collisions, intra-chain disabled** — separate collision groups per chain. Carabiner has no collisions (rings thread through it).
3. **Use `applyImpulse` not `addForce`** — `addForce` causes Rapier WASM "recursive aliasing" error.
4. **High angular damping (8.0)** — prevents wild spinning.
5. **CCD enabled** — `setCcdEnabled(true)` on all bodies.
6. **Spawn position must not overlap** — use `createRingChain()` which propagates parent X to children.
7. **Charm quaternion from last ring** — sync charm's group.quaternion from the last ring body.
8. **DO sync quaternion on rings** — rings tilt naturally when swinging.
9. **Charm rotation on mesh, NOT on group** — bake rotation into `mesh.rotation` at load time. Do NOT multiply quaternion offsets in the sync loop (causes debug/normal mode mismatch).
10. **All rings use CircleBig.glb** at different scales.
11. **Collider densities** — carabiner: 2.0, rings: 1.5, charm: 1.0.
12. **Zero world gravity** — per-chain directional gravity via impulses in animate loop. Each chain gets its own pull angle.
13. **Friction 0, restitution 0** — on ALL colliders to prevent wild behavior on inter-chain contact.
14. **Center blocker on rings** — `R×0.55` sphere at ring center prevents other chains from passing through.

## Physics Tuning (`PHYS` object)

| Param | Value | Effect |
|---|---|---|
| `GRAVITY` | -9.82 | Used as magnitude for per-chain directional pull |
| `LINEAR_DAMPING` | 2.0 | High — bodies settle fast |
| `ANGULAR_DAMPING` | 8.0 | Very high — kills spinning |
| `MOUSE_FORCE` | 1.6 | Strong mouse influence |
| `INERTIA_FORCE` | 1.5 | Pronounced drag swing |
| `FRICTION` | 0.0 | No tangential collision forces |
| `RESTITUTION` | 0.0 | No bounce |
