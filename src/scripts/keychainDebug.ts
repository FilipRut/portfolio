/**
 * Keychain Debug Tool — dev-only
 * D = toggle | T/R/S = gizmo mode | ESC = deselect
 */
import * as THREE from 'three';
import { TransformControls } from 'three/addons/controls/TransformControls.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import GUI from 'lil-gui';

interface Selectable { label: string; group: THREE.Group; mesh: THREE.Object3D; body?: any; /* RAPIER.RigidBody */ }
interface DebugContext { scene: THREE.Scene; camera: THREE.PerspectiveCamera; renderer: THREE.WebGLRenderer; mainGroup: THREE.Group; selectables: Selectable[]; }

let active = false, gui: GUI | null = null, tc: TransformControls | null = null;
let orbit: OrbitControls | null = null;
let boxHelper: THREE.BoxHelper | null = null, selected: Selectable | null = null;
let ctx: DebugContext, physPaused = false, propsFolder: GUI | null = null;
let savedCamPos = new THREE.Vector3(), savedCamRot = new THREE.Euler();

export let isDebugMode = false;
export const isPhysPaused = () => physPaused;

// ── Undo/Redo system ──
interface StateSnapshot {
    entries: { meshPos: THREE.Vector3; meshRot: THREE.Euler; meshScale: THREE.Vector3; groupPos: THREE.Vector3 }[];
}
const undoStack: StateSnapshot[] = [];
const redoStack: StateSnapshot[] = [];
const MAX_UNDO = 50;

function captureState(): StateSnapshot {
    return {
        entries: ctx.selectables.map(e => ({
            meshPos: e.mesh.position.clone(),
            meshRot: e.mesh.rotation.clone(),
            meshScale: e.mesh.scale.clone(),
            groupPos: e.group.position.clone(),
        })),
    };
}

function restoreState(snap: StateSnapshot) {
    snap.entries.forEach((s, i) => {
        const e = ctx.selectables[i];
        if (!e) return;
        e.mesh.position.copy(s.meshPos);
        e.mesh.rotation.copy(s.meshRot);
        e.mesh.scale.copy(s.meshScale);
        e.group.position.copy(s.groupPos);
    });
    // Re-snapshot children if something is selected
    if (selected) resnapChildren();
}

function pushUndo() {
    undoStack.push(captureState());
    if (undoStack.length > MAX_UNDO) undoStack.shift();
    redoStack.length = 0; // clear redo on new action
}

function undo() {
    if (!undoStack.length) return;
    redoStack.push(captureState());
    restoreState(undoStack.pop()!);
}

function redo() {
    if (!redoStack.length) return;
    undoStack.push(captureState());
    restoreState(redoStack.pop()!);
}

// Debounce: only push undo once per "gesture" (drag start or first slider change)
let undoPushedForGesture = false;
function ensureUndoPushed() {
    if (!undoPushedForGesture) {
        pushUndo();
        undoPushedForGesture = true;
    }
}
function endGesture() { undoPushedForGesture = false; }

// ── Snapshot system: record children state at select, enforce offsets every frame ──
interface ChildSnapshot {
    entry: Selectable;
    worldPosOffset: THREE.Vector3;
    initialParentWorldQuat: THREE.Quaternion;
    initialChildWorldQuat: THREE.Quaternion;
    initialParentScale: THREE.Vector3;
    initialChildScale: THREE.Vector3;
    // Saved originals to restore on deselect
    savedMeshPos: THREE.Vector3;
    savedMeshRot: THREE.Euler;
    savedMeshScale: THREE.Vector3;
}
let childSnapshots: ChildSnapshot[] = [];

function getMeshWorldPos(entry: Selectable): THREE.Vector3 {
    entry.group.updateMatrixWorld(true);
    const wp = entry.mesh.position.clone();
    entry.group.localToWorld(wp);
    return wp;
}

function getMeshWorldQuat(entry: Selectable): THREE.Quaternion {
    entry.group.updateMatrixWorld(true);
    const groupQ = entry.group.getWorldQuaternion(new THREE.Quaternion());
    const meshQ = new THREE.Quaternion().setFromEuler(entry.mesh.rotation);
    return groupQ.multiply(meshQ);
}

export function initKeychainDebug(context: DebugContext) {
    ctx = context;
    window.addEventListener('keydown', (e) => {
        if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
        if (e.key === 'd' || e.key === 'D') { active = !active; isDebugMode = active; active ? activate() : deactivate(); }
        if (!active) return;
        if (e.key === 't') tc?.setMode('translate');
        if (e.key === 'r') tc?.setMode('rotate');
        if (e.key === 's') tc?.setMode('scale');
        if (e.key === 'Escape') deselect();
        // Undo: Ctrl+Z / Cmd+Z
        if (e.key === 'z' && (e.ctrlKey || e.metaKey) && !e.shiftKey) { e.preventDefault(); undo(); }
        // Redo: Ctrl+Shift+Z / Cmd+Shift+Z
        if (e.key === 'z' && (e.ctrlKey || e.metaKey) && e.shiftKey) { e.preventDefault(); redo(); }
    });
    console.log('[keychain-debug] Ready. Press D to toggle.');
}

function activate() {
    physPaused = false; // physics runs normally — what you see = what you get
    ctx.mainGroup.visible = true;
    savedCamPos.copy(ctx.camera.position);
    savedCamRot.copy(ctx.camera.rotation);
    // Enable pointer events on canvas (normally disabled to not block page)
    ctx.renderer.domElement.style.pointerEvents = 'auto';
    ctx.renderer.domElement.parentElement!.style.pointerEvents = 'auto';

    gui = new GUI({ title: '🔧 Keychain Debug', width: 320 });
    gui.domElement.style.cssText = 'position:fixed;top:10px;right:10px;z-index:99999;';
    gui.add({ exportAll }, 'exportAll').name('📋 Kopiuj wszystkie wartości');
    const labels = ctx.selectables.map(s => s.label);
    gui.add({ el: '(brak)' }, 'el', ['(brak)', ...labels]).name('🎯 Element').onChange((v: string) => {
        if (v === '(brak)') deselect(); else { const e = ctx.selectables.find(s => s.label === v); if (e) selectEntry(e); }
    });
    gui.add({ paused: physPaused }, 'paused').name('⏸ Pauza fizyki').onChange((v: boolean) => { physPaused = v; });

    // TransformControls (gizmo)
    tc = new TransformControls(ctx.camera, ctx.renderer.domElement);
    tc.setSize(0.8);
    tc.setSpace('local'); // strzałki wyrównane do obiektu, nie do sceny
    ctx.scene.add(tc.getHelper());

    // OrbitControls (rotate/zoom model with mouse)
    orbit = new OrbitControls(ctx.camera, ctx.renderer.domElement);
    orbit.enablePan = true;
    orbit.enableZoom = true;
    orbit.enableDamping = false;
    // Target = point the camera is already looking at (no jump)
    const lookDir = new THREE.Vector3(0, 0, -1).applyQuaternion(ctx.camera.quaternion);
    orbit.target.copy(ctx.camera.position).add(lookDir.multiplyScalar(10));
    orbit.update();

    // Disable orbit while dragging gizmo + push undo on drag start
    tc.addEventListener('dragging-changed', (e: any) => {
        if (orbit) orbit.enabled = !e.value;
        if (e.value) ensureUndoPushed();
        else endGesture();
    });

    // Gizmo attached to mesh — changes persist (physics sync only touches group, not mesh)

    ctx.renderer.domElement.addEventListener('click', onClick);

    const badge = document.createElement('div'); badge.id = 'debug-badge';
    badge.textContent = '🔧 DEBUG (D=zamknij, LMB=orbit, T/R/S=gizmo, ⌘Z/⌘⇧Z=undo/redo)';
    badge.style.cssText = 'position:fixed;top:10px;left:50%;transform:translateX(-50%);background:#e53e3e;color:#fff;padding:6px 16px;border-radius:20px;font:600 13px/1 sans-serif;z-index:99999;pointer-events:none;';
    document.body.appendChild(badge);
}

function deactivate() {
    physPaused = false; deselect();
    undoStack.length = 0; redoStack.length = 0;
    // Restore camera and pointer events
    ctx.camera.position.copy(savedCamPos);
    ctx.camera.rotation.copy(savedCamRot);
    ctx.renderer.domElement.style.pointerEvents = '';
    ctx.renderer.domElement.parentElement!.style.pointerEvents = '';
    gui?.destroy(); gui = null;
    if (tc) { ctx.scene.remove(tc.getHelper()); tc.dispose(); tc = null; }
    if (orbit) { orbit.dispose(); orbit = null; }
    ctx.renderer.domElement.removeEventListener('click', onClick);
    document.getElementById('debug-badge')?.remove();
}

function onClick(e: MouseEvent) {
    if (!active || !ctx || tc?.dragging) return;
    if ((e.target as HTMLElement).closest('.lil-gui')) return;
    const rect = ctx.renderer.domElement.getBoundingClientRect();
    const mouse = new THREE.Vector2(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1);
    const ray = new THREE.Raycaster(); ray.setFromCamera(mouse, ctx.camera);
    const all: { mesh: THREE.Mesh; entry: Selectable }[] = [];
    for (const entry of ctx.selectables) entry.group.traverse(c => { if ((c as THREE.Mesh).isMesh) all.push({ mesh: c as THREE.Mesh, entry }); });
    const hits = ray.intersectObjects(all.map(m => m.mesh), false);
    if (hits.length > 0) { const m = all.find(a => a.mesh === hits[0].object); if (m) { selectEntry(m.entry); return; } }
    deselect();
}

// ── SELECT ──
function selectEntry(entry: Selectable) {
    deselect();
    selected = entry;

    // Snapshot: record world-space offsets (position + rotation)
    const parentWorldPos = getMeshWorldPos(entry);
    const parentWorldQuat = getMeshWorldQuat(entry);
    const children = getChainChildren(entry);
    childSnapshots = children.map(child => ({
        entry: child,
        worldPosOffset: getMeshWorldPos(child).sub(parentWorldPos),
        initialParentWorldQuat: parentWorldQuat.clone(),
        initialChildWorldQuat: getMeshWorldQuat(child),
        initialParentScale: entry.mesh.scale.clone(),
        initialChildScale: child.mesh.scale.clone(),
        savedMeshPos: child.mesh.position.clone(),
        savedMeshRot: child.mesh.rotation.clone(),
        savedMeshScale: child.mesh.scale.clone(),
    }));

    boxHelper = new THREE.BoxHelper(entry.group, 0xe53e3e);
    ctx.scene.add(boxHelper);
    tc?.attach(entry.mesh); // attach to MESH (not group) — changes persist after physics sync

    if (!gui) return;
    propsFolder = gui.addFolder(`📦 ${entry.label}`);
    propsFolder.open();
    const mesh = entry.mesh;

    // Helper: add undo tracking via onFinishChange only (doesn't override onChange)
    function tracked(ctrl: any) {
        return ctrl.onFinishChange(() => { ensureUndoPushed(); endGesture(); });
    }

    // Position
    const pf = propsFolder.addFolder('Pozycja (mesh)');
    tracked(pf.add(mesh.position, 'x', -2, 2, 0.001).name('x ← lewo / prawo →'));
    tracked(pf.add(mesh.position, 'y', -2, 2, 0.001).name('y ↓ dół / góra ↑'));
    tracked(pf.add(mesh.position, 'z', -2, 2, 0.001).name('z ← tył / przód →'));
    pf.open();

    // Rotation (degrees proxy)
    const rf = propsFolder.addFolder('Obrót (mesh)');
    const rp = { x: r2d(mesh.rotation.x), y: r2d(mesh.rotation.y), z: r2d(mesh.rotation.z) };
    tracked(rf.add(rp, 'x', -180, 180, 0.5).name('x°').onChange((v: number) => { mesh.rotation.x = d2r(v); }));
    tracked(rf.add(rp, 'y', -180, 180, 0.5).name('y°').onChange((v: number) => { mesh.rotation.y = d2r(v); }));
    tracked(rf.add(rp, 'z', -180, 180, 0.5).name('z°').onChange((v: number) => { mesh.rotation.z = d2r(v); }));
    rf.open();

    // Scale
    const sf = propsFolder.addFolder('Skala');
    tracked(sf.add(mesh.scale, 'x', 0.1, 3, 0.01).name('X'));
    tracked(sf.add(mesh.scale, 'y', 0.1, 3, 0.01).name('Y'));
    tracked(sf.add(mesh.scale, 'z', 0.1, 3, 0.01).name('Z'));

    propsFolder.add({ copy: () => copyOne(entry) }, 'copy').name('📋 Kopiuj ten element');
}

function resnapChildren() {
    if (!selected) return;
    const parentWorldPos = getMeshWorldPos(selected);
    const parentWorldQuat = getMeshWorldQuat(selected);
    const children = getChainChildren(selected);
    childSnapshots = children.map(child => ({
        entry: child,
        worldPosOffset: getMeshWorldPos(child).sub(parentWorldPos),
        initialParentWorldQuat: parentWorldQuat.clone(),
        initialChildWorldQuat: getMeshWorldQuat(child),
        initialParentScale: selected!.mesh.scale.clone(),
        initialChildScale: child.mesh.scale.clone(),
    }));
}

function deselect() {
    // Children keep their propagated values (physics runs live, values are correct)
    if (boxHelper) { ctx.scene.remove(boxHelper); boxHelper.dispose(); boxHelper = null; }
    tc?.detach(); propsFolder?.destroy(); propsFolder = null; selected = null; childSnapshots = [];
}

// ── UPDATE — called every frame in animate loop ──
export function updateDebug() {
    if (orbit) orbit.update();
    if (boxHelper) boxHelper.update();
    if (!selected || !childSnapshots.length) return;

    const parentWorldPos = getMeshWorldPos(selected);
    const parentWorldQuat = getMeshWorldQuat(selected);

    // Rotation delta: how much parent rotated since selection
    const rotDelta = parentWorldQuat.clone().multiply(snap_quatInv(childSnapshots[0].initialParentWorldQuat));

    childSnapshots.forEach(snap => {
        // ── Position: rotate offset around parent, then apply ──
        const rotatedOffset = snap.worldPosOffset.clone().applyQuaternion(rotDelta);
        const targetWorldPos = parentWorldPos.clone().add(rotatedOffset);
        snap.entry.group.updateMatrixWorld(true);
        snap.entry.mesh.position.copy(snap.entry.group.worldToLocal(targetWorldPos));

        // ── Rotation: apply parent's rotation delta to child ──
        const targetWorldQuat = rotDelta.clone().multiply(snap.initialChildWorldQuat);
        const groupWorldQuat = snap.entry.group.getWorldQuaternion(new THREE.Quaternion());
        const localQuat = groupWorldQuat.clone().invert().multiply(targetWorldQuat);
        snap.entry.mesh.rotation.setFromQuaternion(localQuat);

        // ── Scale: ratio from parent ──
        const ps = selected!.mesh.scale;
        const ips = snap.initialParentScale;
        snap.entry.mesh.scale.set(
            snap.initialChildScale.x * (ips.x > 0.001 ? ps.x / ips.x : 1),
            snap.initialChildScale.y * (ips.y > 0.001 ? ps.y / ips.y : 1),
            snap.initialChildScale.z * (ips.z > 0.001 ? ps.z / ips.z : 1),
        );
    });
}

function snap_quatInv(q: THREE.Quaternion): THREE.Quaternion {
    return q.clone().invert();
}

// ── HELPERS ──
const r2d = THREE.MathUtils.radToDeg;
const d2r = THREE.MathUtils.degToRad;

function getChainChildren(entry: Selectable): Selectable[] {
    const items = ctx.selectables, idx = items.indexOf(entry), label = entry.label;
    if (label.includes('Karabińczyk')) return items.filter((_, i) => i !== idx);

    // Determine which chain this element belongs to
    const chainId = label.includes('Orange') ? 'Orange'
        : (label.includes('Żabka') || label.includes('zabka')) ? 'Żabka'
        : label.includes('HP') ? 'HP'
        : label.includes('Wella') ? 'Wella'
        : label.includes('Lidl') ? 'Lidl'
        : label.includes('Selgros') ? 'Selgros'
        : label.includes('Enea') ? 'Enea'
        : null;
    if (!chainId) return [];

    const ch: Selectable[] = [];
    let found = false;
    for (let i = 0; i < items.length; i++) {
        if (i === idx) { found = true; continue; }
        if (!found) continue;
        const l = items[i].label;
        const match = chainId === 'Orange' ? l.includes('Orange')
            : chainId === 'Żabka' ? (l.includes('Żabka') || l.includes('zabka'))
            : chainId === 'HP' ? l.includes('HP')
            : chainId === 'Wella' ? l.includes('Wella')
            : chainId === 'Lidl' ? l.includes('Lidl')
            : chainId === 'Selgros' ? (l.includes('Selgros') || l.includes('Enea'))
            : chainId === 'Enea' ? l.includes('Enea')
            : false;
        if (match) ch.push(items[i]);
    }
    return ch;
}

function formatEntry(e: Selectable): string {
    const p = e.mesh.position, r = e.mesh.rotation, s = e.mesh.scale;
    const gp = e.group.position;
    return `${e.label}:\n  mesh.pos: (${p.x.toFixed(3)}, ${p.y.toFixed(3)}, ${p.z.toFixed(3)})\n  mesh.rot: (${r2d(r.x).toFixed(1)}°, ${r2d(r.y).toFixed(1)}°, ${r2d(r.z).toFixed(1)}°)\n  mesh.scale: (${s.x.toFixed(2)}, ${s.y.toFixed(2)}, ${s.z.toFixed(2)})\n  group.pos: (${gp.x.toFixed(3)}, ${gp.y.toFixed(3)}, ${gp.z.toFixed(3)})`;
}
function copyOne(e: Selectable) { const t = formatEntry(e); navigator.clipboard?.writeText(t); console.log('[debug]', t); }
function exportAll() { const t = ctx.selectables.map(formatEntry).join('\n\n'); navigator.clipboard?.writeText(t); console.log('[debug] ALL:\n' + t); }
