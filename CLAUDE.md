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
| File | Content | Geometry Center | Notes |
|---|---|---|---|
| `Carabiner.glb` | Karabińczyk (oval loop) | Y=0.05, height 1.69 | Top Y=0.89, bottom Y=-0.79 |
| `CircleBig.glb` | Ring (flat in Z, XY plane) | Y=0.41, diameter 0.58 | Used for all rings at different scales |
| `CircleSmall.glb` | Small ring (flat in X, YZ plane) | Y=0.06, diameter 0.20 | Not currently used |
| `Orange.glb` | Charm Orange | Y=-0.456, 0.88w×0.94h×0.39d | Peg at TOP (Y≈0.012), body below |
| `Wella.glb` | Charm Wella | single mesh | Not yet integrated |
| `Zabka.glb` | Charm Żabka | single mesh | Not yet integrated |
| `HP.glb` | Charm HP | single mesh | Not yet integrated |
| `Lidl.glb` | Charm Lidl | single mesh | Not yet integrated |
| `Selgros.glb` | Charm Selgros | single mesh | Not yet integrated |
| `Enea.glb` | Charm Enea | single mesh | Not yet integrated |

## Current Chain Structure

```
Anchor (fixed, Y=0.89)
  └─ Carabiner (dynamic, ellipse of 28 spheres in XY plane)
       │  joint: anchor(0,0,0) → carabiner(0, 0.89, 0)
       └─ BigRing (R=0.27, scale=1.0, YZ plane, 20 spheres)
            │  joint: carabiner(0, -0.75, 0) → bigRing(0, 0.20, 0)
            └─ MediumRing (R=0.18, scale=0.67, XY plane, 16 spheres)
                 │  joint: bigRing(0, -0.20, 0) → mediumRing(0, 0.18, 0)
                 └─ SmallRing (R=0.12, scale=0.44, YZ plane, 12 spheres)
                      │  joint: mediumRing(0, -0.12, 0) → smallRing(0, 0.07, 0)
                      └─ Orange Charm (cuboid 0.44×0.47×0.19)
                           joint: smallRing(0, -0.10, 0) → charm(0, 0.46, 0)
```

## Ring Orientations (Chain Pattern)

Rings alternate between two VERTICAL planes (like a real chain):
- **YZ plane**: ring extends in Y (up-down) and Z (depth) — seen as oval from front
- **XY plane**: ring extends in X (left-right) and Y (up-down) — seen edge-on from front

Pattern: `YZ → XY → YZ → XY...`

This creates the interlocking chain visual from any angle.

## How to Create a Ring

### 1. Define in RINGS array

```typescript
{ name: 'myring', R: 0.15, tubeR: 0.02, scale: 0.55, N: 14, pivotTop: 0.12, pivotBot: 0.10, plane: 'yz' as const }
```

| Param | Meaning |
|---|---|
| `R` | Physics ring radius (circle of compound spheres) |
| `tubeR` | Radius of each collision sphere (visual tube thickness) |
| `scale` | Visual scale (1.0 = original CircleBig.glb size) |
| `N` | Number of collision spheres around the ring |
| `pivotTop` | Joint offset from center to top connection. Closer to R = tighter chain |
| `pivotBot` | Joint offset from center to bottom connection |
| `plane` | `'yz'` or `'xy'` — alternate for chain pattern |

### 2. Physics colliders (handled automatically by addRingColliders)

```typescript
// YZ plane: spheres in Y-Z
const x = 0, y = sin(a) * R, z = cos(a) * R;
// XY plane: spheres in X-Y
const x = cos(a) * R, y = sin(a) * R, z = 0;
```

### 3. Visual mesh

```typescript
// YZ plane: rotate original XY mesh by 90° around Y
mesh.rotation.y = Math.PI / 2;
// XY plane: no rotation needed (original orientation)
// Both: offset Y to center
mesh.position.y = -0.41 * scale;
mesh.scale.setScalar(scale);
```

### 4. Sync in animate loop

```typescript
// Rings: full sync (position + quaternion)
group.position.set(p.x, p.y, p.z);
group.quaternion.set(r.x, r.y, r.z, r.w);
```

## How to Add a Charm

### 1. Physics body

```typescript
const charmBody = world.createRigidBody(
    RAPIER.RigidBodyDesc.dynamic()
        .setTranslation(0, centerY, 0)
        .setLinearDamping(2.0)
        .setAngularDamping(8.0)
        .setCcdEnabled(true)
);
// Cuboid collider approximating the charm shape
world.createCollider(
    RAPIER.ColliderDesc.cuboid(halfW, halfH, halfD)
        .setCollisionGroups(CHAIN_GROUP)
        .setDensity(1.0),
    charmBody,
);
```

### 2. Joint to last ring

```typescript
world.createImpulseJoint(
    RAPIER.JointData.spherical(
        { x: 0, y: -lastRing.pivotBot, z: 0 },  // last ring's bottom
        { x: 0, y: PEG_OFFSET, z: 0 },           // charm's peg/hook position
    ),
    lastRingBody, charmBody, true,
);
```

### 3. Visual mesh

```typescript
loader.load(basePath + 'CharmName.glb', (gltf) => {
    charmGroup = new THREE.Group();
    const mesh = gltf.scene;
    mesh.position.y = CENTER_OFFSET;  // center mesh on group origin
    mesh.position.x = X_NUDGE;       // align peg hole with ring
    charmGroup.add(mesh);
    mainGroup.add(charmGroup);
});
```

### 4. Sync — position only, counter-rotate to face camera

```typescript
// In animate loop:
const p = charmBody.translation();
charmGroup.position.set(p.x, p.y, p.z);
charmGroup.rotation.y = -mainGroup.rotation.y; // always face camera
```

### 5. Impulse on charm (bottom of chain)

```typescript
charmBody.applyImpulse({ x: ix, y: 0, z: iz }, true);
```

## Critical Rules

1. **No Trimesh-vs-Trimesh** — Rapier doesn't support it on dynamic bodies. Use compound spheres or convex hull.
2. **Collision disabled between chain elements** — `CHAIN_GROUP = (0x0001 << 16) | 0xFFFE`. Joint handles topology, collision causes jitter/spinning.
3. **Use `applyImpulse` not `addForce`** — `addForce` causes Rapier WASM "recursive aliasing" error.
4. **High angular damping (8.0)** — prevents wild spinning.
5. **Spawn position must not overlap** with parent colliders or physics explodes.
6. **Don't sync quaternion on charms** — physics quaternion rotates charm to wrong orientation. Use `charmGroup.rotation.y = -mainGroup.rotation.y` to always face camera.
7. **DO sync quaternion on rings** — rings should tilt naturally when swinging.
8. **Orange peg is at TOP** of original mesh (Y≈0.012) — NO flip needed. `mesh.position.y = 0.456` centers it.
9. **Peg hole alignment** — use `mesh.position.x` to nudge charm so peg hole aligns with ring center.
10. **All rings use CircleBig.glb** at different scales — consistent geometry, just scaled.

## Physics Tuning (`PHYS` object, line ~15)

| Param | Value | Effect |
|---|---|---|
| `GRAVITY` | -9.82 | Realistic gravity |
| `LINEAR_DAMPING` | 2.0 | High — bodies settle fast |
| `ANGULAR_DAMPING` | 8.0 | Very high — kills spinning |
| `MOUSE_FORCE` | 0.3 | Subtle mouse influence |
| `INERTIA_FORCE` | 0.5 | Gentle drag swing |
| `FRICTION` | 0.0 | No tangential collision forces |
| `RESTITUTION` | 0.0 | No bounce |

## Positioning Cheat Sheet

| Element | World Y (approx) | Connected to |
|---|---|---|
| Anchor | 0.89 | fixed |
| Carabiner center | 0.0 | anchor at top |
| Carabiner bottom | -0.75 | big ring |
| BigRing center | -0.95 | carabiner bottom |
| MediumRing center | -1.33 | big ring bottom |
| SmallRing center | -1.52 | medium ring bottom |
| Orange center | -2.08 | small ring bottom |
