import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { player } from './player.js';
import { state, saveState, updateUI, playClick, initGames } from './logic.js';

const PLAYER_HEIGHT = 1.6;
const ROTATION_SPEED = 3.0;
const WORLD_SIZE = 20;
const MAX_SPEED = 6.0;
const ACCELERATION = 10.0;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0b0b1a);
scene.fog = new THREE.Fog(0x0b0b1a, 20, 60);

const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 100);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
document.body.prepend(renderer.domElement);

scene.add(new THREE.AmbientLight(0x404060, 0.6));
const sun = new THREE.DirectionalLight(0xffeedd, 1.2);
sun.position.set(10, 20, 5);
sun.castShadow = true;
sun.shadow.mapSize.set(1024, 1024);
scene.add(sun);

const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(80, 80),
    new THREE.MeshStandardMaterial({ color: 0x1a1a2e, roughness: 0.8 })
);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);
scene.add(new THREE.GridHelper(80, 40, 0x444466, 0x222244).translateY(0.01));

const casino = new THREE.Group();
const roomW = 10, roomD = 10, roomH = 5;
const wallMat = new THREE.MeshStandardMaterial({ color: 0x444455, roughness: 0.7 });
new THREE.TextureLoader().load('https://loliapi.com/acg', (tex) => {
    wallMat.map = tex;
    wallMat.needsUpdate = true;
});

const intFloor = new THREE.Mesh(new THREE.PlaneGeometry(roomW - 0.4, roomD - 0.4), new THREE.MeshStandardMaterial({ color: 0x2a2a3e }));
intFloor.rotation.x = -Math.PI / 2;
intFloor.position.y = 0.01;
intFloor.receiveShadow = true;
casino.add(intFloor);

const backWall = new THREE.Mesh(new THREE.BoxGeometry(roomW, roomH, 0.3), wallMat);
backWall.position.set(0, roomH/2, -roomD/2);
casino.add(backWall);

const leftWall = new THREE.Mesh(new THREE.BoxGeometry(0.3, roomH, roomD), wallMat);
leftWall.position.set(-roomW/2, roomH/2, 0);
casino.add(leftWall);

const rightWall = new THREE.Mesh(new THREE.BoxGeometry(0.3, roomH, roomD), wallMat);
rightWall.position.set(roomW/2, roomH/2, 0);
casino.add(rightWall);

const frontLeft = new THREE.Mesh(new THREE.BoxGeometry(3, roomH, 0.3), wallMat);
frontLeft.position.set(-3.5, roomH/2, roomD/2);
casino.add(frontLeft);

const frontRight = new THREE.Mesh(new THREE.BoxGeometry(3, roomH, 0.3), wallMat);
frontRight.position.set(3.5, roomH/2, roomD/2);
casino.add(frontRight);

const frontTop = new THREE.Mesh(new THREE.BoxGeometry(4, 1.5, 0.3), wallMat);
frontTop.position.set(0, roomH - 0.75, roomD/2);
casino.add(frontTop);

const roof = new THREE.Mesh(new THREE.BoxGeometry(roomW + 1, 0.3, roomD + 1), new THREE.MeshStandardMaterial({ color: 0x1a1a2e }));
roof.position.set(0, roomH + 0.15, 0);
casino.add(roof);

const doorFrame = new THREE.Mesh(new THREE.BoxGeometry(4.2, 3.7, 0.1), new THREE.MeshStandardMaterial({ color: 0x4ecdc4, emissive: 0x4ecdc4, emissiveIntensity: 0.5 }));
doorFrame.position.set(0, 1.85, roomD/2 + 0.15);
casino.add(doorFrame);

const cvs = document.createElement('canvas'); cvs.width = 256; cvs.height = 64;
const ctx = cvs.getContext('2d');
ctx.fillStyle = '#0b0b1a'; ctx.fillRect(0, 0, 256, 64);
ctx.strokeStyle = '#ffd700'; ctx.lineWidth = 3; ctx.strokeRect(3, 3, 250, 58);
ctx.fillStyle = '#ffd700'; ctx.font = 'bold 36px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
ctx.fillText('9MAYA', 128, 32);
const sign = new THREE.Mesh(new THREE.PlaneGeometry(5, 1.2), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(cvs) }));
sign.position.set(0, roomH + 0.5, roomD/2 + 0.2);
casino.add(sign);

const intLight = new THREE.PointLight(0xffaa00, 1.5, 15);
intLight.position.set(0, 4, 0);
casino.add(intLight);
const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 8), new THREE.MeshBasicMaterial({ color: 0xffaa00 }));
bulb.position.set(0, 4, 0);
casino.add(bulb);

const table = new THREE.Mesh(new THREE.BoxGeometry(3, 0.8, 1.5), new THREE.MeshStandardMaterial({ color: 0x5C4033 }));
table.position.set(-2, 0.4, -3);
table.castShadow = true;
casino.add(table);

const monStand = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.15, 0.4, 8), new THREE.MeshStandardMaterial({ color: 0x333333 }));
monStand.position.set(-2, 1, -3);
casino.add(monStand);

const monFrame = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.8, 0.1), new THREE.MeshStandardMaterial({ color: 0x222222 }));
monFrame.position.set(-2, 1.5, -3);
casino.add(monFrame);

const mCvs = document.createElement('canvas'); mCvs.width = 256; mCvs.height = 192;
const mCtx = mCvs.getContext('2d');
mCtx.fillStyle = '#0b0b1a'; mCtx.fillRect(0, 0, 256, 192);
mCtx.fillStyle = '#4ecdc4'; mCtx.font = 'bold 20px Arial'; mCtx.textAlign = 'center';
mCtx.fillText('9MAYA CASINO', 128, 80);
mCtx.fillStyle = '#ffd700'; mCtx.font = '14px Arial'; mCtx.fillText('ONLINE', 128, 110);
const monScreen = new THREE.Mesh(new THREE.PlaneGeometry(1, 0.7), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(mCvs) }));
monScreen.position.set(-2, 1.5, -2.95);
casino.add(monScreen);

const bedFrame = new THREE.Mesh(new THREE.BoxGeometry(3, 0.4, 4), new THREE.MeshStandardMaterial({ color: 0x4a3c2a }));
bedFrame.position.set(2.5, 0.2, -1);
bedFrame.castShadow = true;
casino.add(bedFrame);

const mattress = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.2, 3.8), new THREE.MeshStandardMaterial({ color: 0x8B4513 }));
mattress.position.set(2.5, 0.5, -1);
casino.add(mattress);

const pillow = new THREE.Mesh(new THREE.BoxGeometry(1, 0.15, 0.6), new THREE.MeshStandardMaterial({ color: 0xffffff }));
pillow.position.set(2.5, 0.61, 0.8);
casino.add(pillow);

const pCvs = document.createElement('canvas'); pCvs.width = 200; pCvs.height = 250;
const pCtx = pCvs.getContext('2d');
pCtx.fillStyle = '#1a1a2e'; pCtx.fillRect(0, 0, 200, 250);
pCtx.fillStyle = '#ffd700'; pCtx.font = 'bold 24px Arial'; pCtx.textAlign = 'center';
pCtx.fillText('9MAYA', 100, 100);
pCtx.font = '16px Arial'; pCtx.fillText('CASINO', 100, 140);
const poster = new THREE.Mesh(new THREE.PlaneGeometry(2, 2.5), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(pCvs) }));
poster.position.set(-roomW/2 + 0.16, 2.5, 1);
poster.rotation.y = Math.PI / 2;
casino.add(poster);

scene.add(casino);

const world = new CANNON.World();
world.gravity.set(0, -9.82, 0);
world.broadphase = new CANNON.SAPBroadphase(world);

const gBody = new CANNON.Body({ mass: 0 });
gBody.addShape(new CANNON.Plane());
gBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
world.addBody(gBody);

function addWallBody(x, z, w, h, d) {
    const body = new CANNON.Body({ mass: 0 });
    body.addShape(new CANNON.Box(new CANNON.Vec3(w/2, h/2, d/2)));
    body.position.set(x, h/2, z);
    world.addBody(body);
}

addWallBody(0, -40, 80, 3, 1);
addWallBody(0, 40, 80, 3, 1);
addWallBody(-40, 0, 1, 3, 80);
addWallBody(40, 0, 1, 3, 80);
addWallBody(0, -roomD/2, roomW, roomH, 0.3);
addWallBody(-roomW/2, 0, 0.3, roomH, roomD);
addWallBody(roomW/2, 0, 0.3, roomH, roomD);
addWallBody(-3.5, roomD/2, 3, roomH, 0.3);
addWallBody(3.5, roomD/2, 3, roomH, 0.3);
addWallBody(0, roomD/2, 4, 1.5, 0.3);

const playerBody = new CANNON.Body({ mass: 1 });
playerBody.addShape(new CANNON.Sphere(0.35));
playerBody.position.set(0, PLAYER_HEIGHT, 12);
playerBody.linearDamping = 0.85;
playerBody.angularDamping = 0.9;
playerBody.fixedRotation = true;
world.addBody(playerBody);

player.body = playerBody;
const playerMesh = player.createMesh();
scene.add(playerMesh);

let yaw = 0, pitch = 0;
const pitchMin = -Math.PI / 2.2, pitchMax = Math.PI / 2.2;

class Joystick {
    constructor(el, knob) {
        this.el = el; this.knob = knob; this.active = false; this.touchId = null;
        this.data = { x: 0, y: 0 }; this.maxDist = el.offsetWidth / 2 - 5;
        this.setup();
    }
    setup() {
        const el = this.el;
        const start = (e) => {
            e.preventDefault();
            const t = e.changedTouches ? e.changedTouches[0] : e;
            this.touchId = t.identifier !== undefined ? t.identifier : 'mouse';
            this.active = true; this.update(t.clientX, t.clientY);
        };
        const move = (e) => {
            if (!this.active) return; e.preventDefault();
            let t = null;
            if (e.changedTouches) { for (let ct of e.changedTouches) { if (ct.identifier === this.touchId) { t = ct; break; } } }
            else { t = e; }
            if (t) this.update(t.clientX, t.clientY);
        };
        const end = (e) => {
            if (!this.active) return;
            let found = false;
            if (e.changedTouches) { for (let ct of e.changedTouches) { if (ct.identifier === this.touchId) { found = true; break; } } }
            else { found = true; }
            if (found) { this.active = false; this.touchId = null; this.reset(); }
        };
        el.addEventListener('mousedown', start); window.addEventListener('mousemove', move); window.addEventListener('mouseup', end);
        el.addEventListener('touchstart', start, { passive: false }); window.addEventListener('touchmove', move, { passive: false });
        window.addEventListener('touchend', end); window.addEventListener('touchcancel', end);
    }
    update(cx, cy) {
        const rect = this.el.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2; const centerY = rect.top + rect.height / 2;
        let dx = cx - centerX; let dy = cy - centerY;
        const dist = Math.sqrt(dx*dx + dy*dy);
        if (dist > this.maxDist) { dx = (dx/dist)*this.maxDist; dy = (dy/dist)*this.maxDist; }
        this.data.x = dx / this.maxDist; this.data.y = dy / this.maxDist;
        this.knob.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
    }
    reset() { this.data.x = 0; this.data.y = 0; this.knob.style.transform = 'translate(-50%, -50%)'; }
}

const leftJoy = new Joystick(document.getElementById('joystick-left'), document.getElementById('leftKnob'));
const rightJoy = new Joystick(document.getElementById('joystick-right'), document.getElementById('rightKnob'));

let uiOpen = false, isInside = false, nearEntrance = false, nearComputer = false;
const hintEl = document.getElementById('interact-hint');

document.getElementById('uiClose').addEventListener('click', () => {
    document.getElementById('casino-ui').classList.remove('active');
    uiOpen = false;
    playClick();
});

document.getElementById('exitBtn').addEventListener('click', () => {
    playerBody.position.set(0, PLAYER_HEIGHT, 12);
    playerBody.velocity.set(0, 0, 0);
    isInside = false;
    uiOpen = false;
    document.getElementById('casino-ui').classList.remove('active');
    saveState();
    window.location.href = 'index.html';
});

document.getElementById('clearHistory').addEventListener('click', () => {
    state.history = [];
    saveState();
    updateUI();
    playClick();
});

document.getElementById('clickerBtn').addEventListener('click', (e) => {
    state.balance += 1;
    playClick();
    updateUI();
    saveState();
    const p = document.createElement('div');
    p.style.cssText = `position:fixed; left:${e.clientX}px; top:${e.clientY}px; color:#4ecdc4; font-size:14px; font-weight:bold; pointer-events:none; z-index:200; animation: particleFall 1s ease-out forwards;`;
    p.textContent = '+1';
    document.body.appendChild(p);
    setTimeout(() => p.remove(), 1000);
});

const style = document.createElement('style');
style.textContent = `@keyframes particleFall { 0% { opacity:1; transform:translateY(0); } 100% { opacity:0; transform:translateY(-50px); } }`;
document.head.appendChild(style);

document.querySelectorAll('.game-card').forEach(card => {
    card.addEventListener('click', () => {
        document.getElementById('modal-' + card.dataset.game).classList.add('active');
        playClick();
    });
});

document.querySelectorAll('[data-close]').forEach(btn => {
    btn.addEventListener('click', () => {
        btn.closest('.game-modal').classList.remove('active');
        playClick();
    });
});

renderer.domElement.addEventListener('click', () => {
    if (nearEntrance && !isInside && !uiOpen) {
        playerBody.position.set(0, PLAYER_HEIGHT, 0);
        playerBody.velocity.set(0, 0, 0);
        yaw = 0; pitch = 0;
        isInside = true; nearEntrance = false;
        playClick();
    } else if (isInside && nearComputer && !uiOpen) {
        document.getElementById('casino-ui').classList.add('active');
        uiOpen = true;
        playClick();
    }
});

renderer.domElement.addEventListener('touchstart', (e) => {
    if ((nearEntrance && !isInside) || (isInside && nearComputer)) {
        if (!e.target.id.includes('joystick') && !e.target.classList.contains('knob')) {
            if (nearEntrance && !isInside) {
                playerBody.position.set(0, PLAYER_HEIGHT, 0);
                playerBody.velocity.set(0, 0, 0);
                yaw = 0; pitch = 0;
                isInside = true; nearEntrance = false;
            } else {
                document.getElementById('casino-ui').classList.add('active');
                uiOpen = true;
            }
            playClick();
        }
    }
}, { passive: true });

const clock = new THREE.Clock();
let frames = 0, lastFps = 0;

updateUI();
initGames();

function animate() {
    const dt = Math.min(clock.getDelta(), 0.05);

    if (!uiOpen) {
        const moveX = leftJoy.data.x; const moveZ = leftJoy.data.y;
        const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
        const right = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion);
        const dir = new THREE.Vector3().addScaledVector(right, moveX).addScaledVector(forward, -moveZ);
        dir.y = 0; if (dir.length() > 0) dir.normalize();

        playerBody.applyForce(new CANNON.Vec3(dir.x * ACCELERATION, 0, dir.z * ACCELERATION), playerBody.position);
        const vel = playerBody.velocity; const spd = Math.sqrt(vel.x*vel.x + vel.z*vel.z);
        if (spd > MAX_SPEED) { const r = MAX_SPEED / spd; vel.x *= r; vel.z *= r; }

        yaw -= rightJoy.data.x * ROTATION_SPEED * dt; pitch -= rightJoy.data.y * ROTATION_SPEED * dt;
        pitch = Math.max(pitchMin, Math.min(pitchMax, pitch));
    }

    camera.quaternion.setFromEuler(new THREE.Euler(pitch, yaw, 0, 'YXZ'));
    world.step(1/60, dt, 3);

    const p = playerBody.position;
    p.x = Math.max(-38, Math.min(38, p.x)); p.z = Math.max(-38, Math.min(38, p.z));

    playerMesh.position.copy(p); playerMesh.position.y -= 0.3;
    const vel = playerBody.velocity;
    if (Math.abs(vel.x) > 0.1 || Math.abs(vel.z) > 0.1) {
        playerMesh.rotation.y = Math.atan2(vel.x, vel.z);
    }

    camera.position.copy(p); camera.position.y += PLAYER_HEIGHT;

    const distToEntrance = p.distanceTo(new CANNON.Vec3(0, PLAYER_HEIGHT, roomD/2));
    const distToComputer = p.distanceTo(new CANNON.Vec3(-2, PLAYER_HEIGHT, -3));

    if (!isInside && distToEntrance < 2.5) {
        nearEntrance = true;
        hintEl.textContent = 'Нажми чтобы ВОЙТИ';
        hintEl.style.display = 'block';
    } else if (isInside && distToComputer < 2.5) {
        nearComputer = true;
        hintEl.textContent = 'Нажми на комп чтобы играть';
        hintEl.style.display = 'block';
    } else {
        nearEntrance = false; nearComputer = false;
        hintEl.style.display = 'none';
    }

    frames++;
    if (performance.now() - lastFps > 1000) {
        document.getElementById('fpsVal').textContent = frames; frames = 0; lastFps = performance.now();
    }

    renderer.render(scene, camera);
    requestAnimationFrame(animate);
}

animate();

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

console.log('%c 9MAYA 3D CASINO ЗАГРУЖЕН ', 'background: #ffd700; color: #000; font-size: 14px; font-weight: bold;');