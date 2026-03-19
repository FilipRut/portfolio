# Keychain 3D — Guide for Agents

## Stack
- **Three.js** v0.183.2 — rendering
- **Rapier3D** (`@dimforge/rapier3d-compat`) — WASM physics engine
- **GSAP + ScrollTrigger** — scroll animation
- **Astro** v6 — build system

## Architecture

Scene file: `src/scripts/threeScene.ts`
Parts directory: `public/assets/models/parts-clean/`

### Available GLB Parts
| File | Content | Geometry Center |
|---|---|---|
| `Carabiner.glb` | Karabińczyk (oval loop) | Y=0.05, height 1.69 |
| `CircleBig.glb` | Duże kółko (flat in Z, XY plane) | Y=0.41, diameter 0.58 |
| `CircleSmall.glb` | Małe kółko (flat in X, YZ plane) | Y=0.06, diameter 0.20 |
| `Orange.glb` | Charm Orange | Y=-0.46, height 0.94, peg at bottom |
| `Wella.glb` | Charm Wella | single mesh |
| `Zabka.glb` | Charm Żabka | single mesh |
| `HP.glb` | Charm HP | single mesh |
| `Lidl.glb` | Charm Lidl | single mesh |
| `Selgros.glb` | Charm Selgros | single mesh |
| `Enea.glb` | Charm Enea | single mesh |

## How to Create a Chain Link (Ring)

### Physics Body

```typescript
// 1. Create dynamic body at calculated Y position
const body = world.createRigidBody(
    RAPIER.RigidBodyDesc.dynamic()
        .setTranslation(0, centerY, 0)
        .setLinearDamping(2.0)
        .setAngularDamping(8.0)
        .setCcdEnabled(true)
);

// 2. Add compound sphere colliders (ring of spheres in YZ plane)
const CHAIN_GROUP = (0x0001 << 16) | 0xFFFE; // all chain = group 1, no self-collision
for (let i = 0; i < N; i++) {
    const a = (i / N) * Math.PI * 2;
    world.createCollider(
        RAPIER.ColliderDesc.ball(tubeR)
            .setTranslation(0, Math.cos(a) * R, Math.sin(a) * R)
            .setCollisionGroups(CHAIN_GROUP)
            .setDensity(1.5),
        body,
    );
}

// 3. Connect to parent with spherical joint
world.createImpulseJoint(
    RAPIER.JointData.spherical(
        parentBottomLocal,                    // parent's bottom pivot (local space)
        { x: 0, y: ring.pivotTop, z: 0 },   // this ring's top pivot (local space)
    ),
    parentBody, body, true,
);
```

### Visual Mesh

```typescript
loader.load(basePath + 'CircleBig.glb', (gltf) => {
    const group = new THREE.Group();
    const mesh = gltf.scene;
    mesh.rotation.y = Math.PI / 2;          // XY plane → YZ plane
    mesh.position.y = -0.41 * scale;        // center offset (scaled)
    mesh.scale.setScalar(scale);             // size relative to original
    group.add(mesh);
    mainGroup.add(group);
});
```

### Sync (in animate loop)

```typescript
const p = body.translation();
const r = body.rotation();
group.position.set(p.x, p.y, p.z);
group.quaternion.set(r.x, r.y, r.z, r.w);
```

## Ring Parameters

Defined in the `RINGS` array at the top of `threeScene.ts`:

```typescript
{ name, R, tubeR, scale, N, pivotTop, pivotBot }
```

| Param | Meaning |
|---|---|
| `R` | Physics ring radius (circle of spheres) |
| `tubeR` | Radius of each collision sphere (tube thickness) |
| `scale` | Visual scale multiplier (1.0 = original CircleBig size) |
| `N` | Number of collision spheres around the ring |
| `pivotTop` | Joint offset from body center to top connection point |
| `pivotBot` | Joint offset from body center to bottom connection point |

## How to Add a Charm at Chain End

1. Load the charm GLB
2. Create a dynamic Rapier body with a box or convex hull collider
3. Connect to the last ring via spherical joint:
   - Parent pivot: last ring's bottom `{ x: 0, y: -ring.pivotBot, z: 0 }`
   - Charm pivot: charm's hook/peg position in local space
4. Bake any mesh rotation directly into geometry if needed (Euler rotations get overwritten by quaternion sync)
5. Apply impulse forces on the charm body (bottom of chain) for mouse/drag interaction

## Critical Rules

1. **No Trimesh on dynamic bodies** — Rapier doesn't support Trimesh-vs-Trimesh collision on dynamic bodies. Use compound spheres or convex hull.
2. **Collision disabled between chain elements** — use `CHAIN_GROUP` bitmask. Joint handles topology, collision causes jitter.
3. **Use `applyImpulse` not `addForce`** — `addForce` causes Rapier WASM "recursive aliasing" error.
4. **High angular damping (8.0)** — prevents spinning from collision forces.
5. **Spawn position must not overlap** with parent colliders or physics explodes.
6. **Bake rotations into geometry** (`geometry.applyMatrix4(...)`) if quaternion sync overwrites mesh rotation.
7. **CircleBig.glb center is at Y=0.41** — always offset by `-0.41 * scale` after loading.
8. **Visual rotation**: `mesh.rotation.y = PI/2` converts ring from XY to YZ plane (matching physics).

## Current Chain Structure

```
Anchor (fixed, Y=0.89)
  └─ Carabiner (dynamic, joint at top)
       └─ BigRing (R=0.27, scale=1.0, joint at carabiner bottom Y=-0.75)
            └─ MediumRing (R=0.18, scale=0.67)
                 └─ SmallRing (R=0.12, scale=0.44)
                      └─ [CHARM GOES HERE]
```

## Physics Tuning (`PHYS` object)

| Param | Value | Effect |
|---|---|---|
| `GRAVITY` | -9.82 | Realistic gravity |
| `LINEAR_DAMPING` | 2.0 | High — bodies settle fast |
| `ANGULAR_DAMPING` | 8.0 | Very high — kills spinning |
| `MOUSE_FORCE` | 0.3 | Gentle mouse influence |
| `INERTIA_FORCE` | 0.5 | Gentle drag swing |
| `FRICTION` | 0.0 | No tangential collision forces |
| `RESTITUTION` | 0.0 | No bounce |
