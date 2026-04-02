---
name: 3D keychain scene working state
description: Working 3D scene loads scene-opt.glb (354KB) with correct ring/charm positions, no reparenting. Groups animated directly.
type: project
---

Working state achieved: scene-opt.glb loaded as single file, zero reparenting, animate existing group nodes directly.

**Why:** Previous attempts to reparent meshes into pivot groups broke vertex positions. The scene.glb from Blender has all rings/charms correctly interlocked with baked vertex data at position (0,0,0).

**How to apply:** Never reparent meshes from scene-opt.glb. Animate rotation on existing group nodes (Orange_Model.glb, Wella and Zabka, Hp and Lidl, Selgros and Enea). The file is at public/assets/models/scene-opt.glb (354KB, Draco+WebP compressed).
