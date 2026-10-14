/**
 * HANDVERSE AI — TEMPLE RUN 3D JUNGLE ADVENTURE
 * Complete Playable Endless Runner with Real MediaPipe Webcam Hand Controls
 * Featuring:
 * - Upright & Grounded Realistic Female Adventurer with Jump Physics & Slide Mechanics
 * - Ancient Jungle-Temple Environment: Stone Flagstone Path, Carved Ruins, Pillars, Arches & Palms
 * - Collectible Rotating Gold Coins & Glowing Energy Crystals
 * - Low Obstacles (Jump Over), High Stone Arches (Slide Under), Monoliths (Steer Around)
 * - Single-Action Hand Tracking: Left, Right, Pinch-Jump, and Fist/Downward Slide with Rearm
 * - Dark Neon Theme UI with Retry and Home Navigation
 */

import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

/* ==========================================================================
   1. GLOBAL GAME CONFIGURATION
   ========================================================================== */
const CONFIG = {
  lanes: [-2.4, 0.0, 2.4],
  baseSpeed: 5.5,          // Comfortable, beginner-friendly running speed
  maxSpeed: 12.0,          // Balanced max speed after long survival
  speedAccel: 0.04,        // Very gradual acceleration over distance
  gravity: -22.0,          // Gravity for realistic floaty jump arc
  jumpStrength: 8.8,       // Jump strength giving ~0.8s duration
  slideDuration: 0.75,     // Duration of crouch slide
  chunkLength: 100,        // Corridor chunk length in meters
  activeChunks: 3,         // Active recycling chunks
  fogColor: 0x141026,      // Deep jungle-temple purple/indigo mist
  sunColor: 0xffeed1       // Warm golden morning sunlight
};

/* ==========================================================================
   2. PROCEDURAL SYNTHESIZER AUDIO ENGINE (Zero External Audio Dependencies)
   ========================================================================== */
class AudioEngine {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.muted = false;
    this.initialized = false;
  }

  init() {
    if (this.initialized) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.4, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
      this.initialized = true;
      this.startAmbientJungle();
    } catch (e) {
      console.warn('AudioContext failed to initialize:', e);
    }
  }

  resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.muted ? 0 : 0.4, this.ctx.currentTime);
    }
    return !this.muted;
  }

  playJump() {
    if (!this.initialized || this.muted) return;
    this.resume();
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(220, t);
    osc.frequency.exponentialRampToValueAtTime(620, t + 0.22);
    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.25);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.25);
  }

  playSlide() {
    if (!this.initialized || this.muted) return;
    this.resume();
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(280, t);
    osc.frequency.exponentialRampToValueAtTime(70, t + 0.28);
    gain.gain.setValueAtTime(0.35, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.30);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.30);
  }

  playCoin() {
    if (!this.initialized || this.muted) return;
    this.resume();
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(987.77, t); // B5
    osc.frequency.setValueAtTime(1318.51, t + 0.06); // E6
    gain.gain.setValueAtTime(0.25, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.35);
  }

  playCrystal() {
    if (!this.initialized || this.muted) return;
    this.resume();
    const t = this.ctx.currentTime;
    [1046.5, 1318.5, 1567.98].forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t + i * 0.04);
      gain.gain.setValueAtTime(0.25, t + i * 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.04 + 0.4);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(t + i * 0.04);
      osc.stop(t + i * 0.04 + 0.4);
    });
  }

  playHit() {
    if (!this.initialized || this.muted) return;
    this.resume();
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(140, t);
    osc.frequency.exponentialRampToValueAtTime(35, t + 0.35);
    gain.gain.setValueAtTime(0.5, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.35);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.35);
  }

  playMilestone() {
    if (!this.initialized || this.muted) return;
    this.resume();
    const t = this.ctx.currentTime;
    [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t + idx * 0.08);
      gain.gain.setValueAtTime(0.28, t + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.08 + 0.6);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(t + idx * 0.08);
      osc.stop(t + idx * 0.08 + 0.6);
    });
  }

  playGameOver() {
    if (!this.initialized || this.muted) return;
    this.resume();
    const t = this.ctx.currentTime;
    [392.00, 349.23, 311.13, 261.63].forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t + idx * 0.18);
      gain.gain.setValueAtTime(0.3, t + idx * 0.18);
      gain.gain.exponentialRampToValueAtTime(0.01, t + idx * 0.18 + 0.55);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(t + idx * 0.18);
      osc.stop(t + idx * 0.18 + 0.55);
    });
  }

  startAmbientJungle() {
    if (!this.initialized) return;
    try {
      const bufferSize = this.ctx.sampleRate * 2;
      const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }
      const whiteNoise = this.ctx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;
      whiteNoise.loop = true;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(320, this.ctx.currentTime);

      const breezeGain = this.ctx.createGain();
      breezeGain.gain.setValueAtTime(0.04, this.ctx.currentTime);

      whiteNoise.connect(filter);
      filter.connect(breezeGain);
      breezeGain.connect(this.masterGain);
      whiteNoise.start();
    } catch (e) {
      console.warn('Ambient audio error:', e);
    }
  }
}

const audio = new AudioEngine();

/* ==========================================================================
   3. PROCEDURAL PBR TEXTURES (Ancient Temple Stone & Tropical Jungle Foliage)
   ========================================================================== */
class TextureGenerator {
  static createStonePathTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // Ancient temple soil base
    ctx.fillStyle = '#1e1927';
    ctx.fillRect(0, 0, 512, 512);

    // Carved flagstone pathway center
    const grad = ctx.createLinearGradient(0, 0, 512, 0);
    grad.addColorStop(0.0, 'rgba(28, 38, 25, 0.95)');   // jungle verge
    grad.addColorStop(0.20, 'rgba(65, 58, 80, 0.95)');  // carved stone curb
    grad.addColorStop(0.25, 'rgba(90, 82, 105, 0.98)'); // flagstones
    grad.addColorStop(0.50, 'rgba(105, 96, 122, 1.0)'); // main temple path
    grad.addColorStop(0.75, 'rgba(90, 82, 105, 0.98)'); // flagstones
    grad.addColorStop(0.80, 'rgba(65, 58, 80, 0.95)');  // carved stone curb
    grad.addColorStop(1.0, 'rgba(28, 38, 25, 0.95)');   // jungle verge
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 512);

    // Flagstone grid joints
    ctx.strokeStyle = 'rgba(25, 20, 35, 0.65)';
    ctx.lineWidth = 4;
    for (let y = 0; y < 512; y += 64) {
      ctx.beginPath();
      ctx.moveTo(110, y);
      ctx.lineTo(402, y);
      ctx.stroke();
    }
    for (let x = 110; x <= 402; x += 97) {
      for (let y = 0; y < 512; y += 64) {
        ctx.beginPath();
        ctx.moveTo(x + (Math.sin(y) * 10), y);
        ctx.lineTo(x + (Math.sin(y) * 10), y + 64);
        ctx.stroke();
      }
    }

    // Weathering, moss specks & stone noise
    for (let i = 0; i < 1800; i++) {
      const x = Math.random() * 512;
      const y = Math.random() * 512;
      const s = 1 + Math.random() * 3.5;
      ctx.fillStyle = Math.random() > 0.4 ? 'rgba(35, 55, 30, 0.28)' : 'rgba(200, 190, 220, 0.15)';
      ctx.fillRect(x, y, s, s);
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(2, 8);
    return tex;
  }

  static createAncientStoneTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#534d61';
    ctx.fillRect(0, 0, 256, 256);

    for (let i = 0; i < 700; i++) {
      const x = Math.random() * 256;
      const y = Math.random() * 256;
      const s = 2 + Math.random() * 5;
      ctx.fillStyle = Math.random() > 0.5 ? 'rgba(30, 25, 38, 0.35)' : 'rgba(120, 110, 140, 0.25)';
      ctx.fillRect(x, y, s, s);
    }

    // Ancient moss patches
    for (let i = 0; i < 80; i++) {
      const x = Math.random() * 256;
      const y = Math.random() * 256;
      const r = 3 + Math.random() * 10;
      ctx.fillStyle = 'rgba(40, 70, 35, 0.35)';
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    return tex;
  }

  static createBarkTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#2b1f18';
    ctx.fillRect(0, 0, 512, 512);

    for (let i = 0; i < 900; i++) {
      const x = Math.random() * 512;
      const w = 2 + Math.random() * 5;
      const h = 30 + Math.random() * 120;
      const y = Math.random() * 512;
      const alpha = 0.15 + Math.random() * 0.35;
      ctx.fillStyle = Math.random() > 0.5 ? `rgba(65, 45, 30, ${alpha})` : `rgba(20, 12, 8, ${alpha})`;
      ctx.fillRect(x, y, w, h);
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(1, 3);
    return tex;
  }
}

/* ==========================================================================
   4. WORLD RENDERER & JUNGLE-TEMPLE LIGHTING
   ========================================================================== */
class WorldRenderer {
  constructor() {
    this.canvas = document.getElementById('game-canvas');
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(CONFIG.fogColor);
    this.scene.fog = new THREE.FogExp2(CONFIG.fogColor, 0.016);

    this.camera = new THREE.PerspectiveCamera(
      52,
      window.innerWidth / window.innerHeight,
      0.1,
      250
    );
    this.camera.position.set(0, 3.2, 5.8);

    this.setupLighting();
    this.setupFloatingParticles();

    window.addEventListener('resize', () => this.onWindowResize());
  }

  setupLighting() {
    const hemiLight = new THREE.HemisphereLight(0xb49fcc, 0x1e1528, 1.3);
    this.scene.add(hemiLight);

    this.sunLight = new THREE.DirectionalLight(CONFIG.sunColor, 2.3);
    this.sunLight.position.set(18, 35, 15);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.width = 2048;
    this.sunLight.shadow.mapSize.height = 2048;
    this.sunLight.shadow.camera.near = 1;
    this.sunLight.shadow.camera.far = 80;
    const d = 16;
    this.sunLight.shadow.camera.left = -d;
    this.sunLight.shadow.camera.right = d;
    this.sunLight.shadow.camera.top = d;
    this.sunLight.shadow.camera.bottom = -d;
    this.sunLight.shadow.bias = -0.0006;
    this.scene.add(this.sunLight);
    this.scene.add(this.sunLight.target);

    // Translucent angled Sun Shafts
    const godrayGeo = new THREE.CylinderGeometry(0.8, 4.0, 32, 8, 1, true);
    const godrayMat = new THREE.MeshBasicMaterial({
      color: 0xffe2b8,
      transparent: true,
      opacity: 0.10,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });

    for (let i = 0; i < 5; i++) {
      const shaft = new THREE.Mesh(godrayGeo, godrayMat);
      shaft.position.set((Math.random() - 0.5) * 20, 14, -20 - Math.random() * 50);
      shaft.rotation.z = 0.35 + (Math.random() - 0.5) * 0.15;
      shaft.rotation.x = -0.25;
      this.scene.add(shaft);
    }
  }

  setupFloatingParticles() {
    const count = 300;
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      positions[i * 3 + 0] = (Math.random() - 0.5) * 32;
      positions[i * 3 + 1] = 0.5 + Math.random() * 9;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 70;
    }

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.PointsMaterial({
      color: 0xf5d0fe,
      size: 0.16,
      transparent: true,
      opacity: 0.65,
      blending: THREE.AdditiveBlending
    });

    this.particles = new THREE.Points(geo, mat);
    this.scene.add(this.particles);
  }

  updateParticles(dt, playerZ) {
    const pos = this.particles.geometry.attributes.position.array;
    for (let i = 0; i < pos.length; i += 3) {
      pos[i + 1] += Math.sin(pos[i] + pos[i + 2] + Date.now() * 0.001) * 0.005;
      if (pos[i + 2] > playerZ + 15) {
        pos[i + 2] = playerZ - 55;
      } else if (pos[i + 2] < playerZ - 55) {
        pos[i + 2] = playerZ + 15;
      }
    }
    this.particles.geometry.attributes.position.needsUpdate = true;

    this.sunLight.position.z = playerZ + 15;
    this.sunLight.target.position.z = playerZ - 10;
    this.sunLight.target.updateMatrixWorld();
  }

  onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }
}

/* ==========================================================================
   5. JUNGLE-TEMPLE ENVIRONMENT & TEMPLE RUN OBSTACLES & COINS
   ========================================================================== */
class JungleTempleManager {
  constructor(scene) {
    this.scene = scene;
    this.chunks = [];
    this.obstacles = [];
    this.collectibles = [];
    this.nextObstacleZ = -35;

    this.stonePathTex = TextureGenerator.createStonePathTexture();
    this.ancientStoneTex = TextureGenerator.createAncientStoneTexture();
    this.barkTex = TextureGenerator.createBarkTexture();

    this.stonePathMat = new THREE.MeshStandardMaterial({
      map: this.stonePathTex,
      roughness: 0.85,
      metalness: 0.1
    });

    this.templeStoneMat = new THREE.MeshStandardMaterial({
      map: this.ancientStoneTex,
      roughness: 0.88,
      bumpScale: 0.08
    });

    this.barkMat = new THREE.MeshStandardMaterial({
      map: this.barkTex,
      roughness: 0.85
    });

    this.jungleFoliageMat1 = new THREE.MeshStandardMaterial({
      color: 0x164e26,
      roughness: 0.75,
      flatShading: true
    });

    this.jungleFoliageMat2 = new THREE.MeshStandardMaterial({
      color: 0x226b34,
      roughness: 0.70,
      flatShading: true
    });

    // Aztec / Temple Shiny Gold Coin Material
    this.coinMat = new THREE.MeshStandardMaterial({
      color: 0xfbbf24,
      metalness: 0.85,
      roughness: 0.22,
      emissive: 0xd97706,
      emissiveIntensity: 0.4
    });

    // Glowing Cyan Crystal Material
    this.crystalMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 0.85,
      roughness: 0.15,
      metalness: 0.6
    });

    for (let i = 0; i < CONFIG.activeChunks; i++) {
      this.createChunk(-i * CONFIG.chunkLength);
    }
  }

  createTempleColumn() {
    const group = new THREE.Group();
    // Base pedestal
    const base = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.6, 1.2), this.templeStoneMat);
    base.position.y = 0.3;
    base.castShadow = true;
    group.add(base);

    // Fluted shaft
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.46, 5.8, 10), this.templeStoneMat);
    shaft.position.y = 3.5;
    shaft.castShadow = true;
    group.add(shaft);

    // Carved capital
    const cap = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.5, 1.1), this.templeStoneMat);
    cap.position.y = 6.6;
    cap.castShadow = true;
    group.add(cap);

    return group;
  }

  createJunglePalm() {
    const group = new THREE.Group();
    const trunkHeight = 10 + Math.random() * 3;
    const trunkGeo = new THREE.CylinderGeometry(0.28, 0.45, trunkHeight, 7);
    const trunk = new THREE.Mesh(trunkGeo, this.barkMat);
    trunk.position.y = trunkHeight / 2;
    trunk.rotation.z = (Math.random() - 0.5) * 0.15;
    trunk.castShadow = true;
    group.add(trunk);

    // Fan fronds
    const frondGeo = new THREE.PlaneGeometry(0.8, 3.8);
    for (let i = 0; i < 9; i++) {
      const frond = new THREE.Mesh(frondGeo, this.jungleFoliageMat2);
      frond.position.set(0, trunkHeight, 0);
      frond.rotation.y = (i / 9) * Math.PI * 2;
      frond.rotation.x = 0.65;
      frond.castShadow = true;
      group.add(frond);
    }
    return group;
  }

  createChunk(startZ) {
    const chunkGroup = new THREE.Group();
    chunkGroup.position.z = startZ;

    // Temple Path Floor with carved relief
    const groundGeo = new THREE.PlaneGeometry(36, CONFIG.chunkLength, 24, 24);
    const pos = groundGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      if (Math.abs(x) > 3.6) {
        pos.setZ(i, (Math.abs(x) - 3.6) * 0.35 + Math.sin(x * 0.8) * 0.25);
      }
    }
    groundGeo.computeVertexNormals();

    const ground = new THREE.Mesh(groundGeo, this.stonePathMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = 0;
    ground.position.z = -CONFIG.chunkLength / 2;
    ground.receiveShadow = true;
    chunkGroup.add(ground);

    // Carved Raised Stone Curbs lining the pathway
    const curbGeo = new THREE.BoxGeometry(0.5, 0.35, CONFIG.chunkLength);
    const leftCurb = new THREE.Mesh(curbGeo, this.templeStoneMat);
    leftCurb.position.set(-3.7, 0.17, -CONFIG.chunkLength / 2);
    leftCurb.castShadow = true;
    leftCurb.receiveShadow = true;
    chunkGroup.add(leftCurb);

    const rightCurb = new THREE.Mesh(curbGeo, this.templeStoneMat);
    rightCurb.position.set(3.7, 0.17, -CONFIG.chunkLength / 2);
    rightCurb.castShadow = true;
    rightCurb.receiveShadow = true;
    chunkGroup.add(rightCurb);

    // Decorate along the trail with Temple Columns, Palms, and Banyan trees
    const spacing = 12.0;
    for (let z = 0; z > -CONFIG.chunkLength; z -= spacing) {
      // Left side temple architecture
      const colL = this.createTempleColumn();
      colL.position.set(-4.8, 0, z);
      chunkGroup.add(colL);

      const palmL = this.createJunglePalm();
      palmL.position.set(-7.5 - Math.random() * 4, 0, z + (Math.random() - 0.5) * 4);
      chunkGroup.add(palmL);

      // Right side temple architecture
      const colR = this.createTempleColumn();
      colR.position.set(4.8, 0, z);
      chunkGroup.add(colR);

      const palmR = this.createJunglePalm();
      palmR.position.set(7.5 + Math.random() * 4, 0, z + (Math.random() - 0.5) * 4);
      chunkGroup.add(palmR);
    }

    this.scene.add(chunkGroup);
    this.chunks.push({ group: chunkGroup, z: startZ });
  }

  update(playerZ, currentSpeed) {
    const oldest = this.chunks[0];
    if (playerZ < oldest.z - CONFIG.chunkLength) {
      this.chunks.shift();
      const newest = this.chunks[this.chunks.length - 1];
      const nextZ = newest.z - CONFIG.chunkLength;
      oldest.group.position.z = nextZ;
      oldest.z = nextZ;
      this.chunks.push(oldest);
    }

    while (this.nextObstacleZ > playerZ - 120) {
      this.spawnRow(this.nextObstacleZ);
      const spacing = 28 + Math.random() * 10;
      this.nextObstacleZ -= spacing;
    }

    // Spin rotating gold coins and floating crystals
    for (let i = this.collectibles.length - 1; i >= 0; i--) {
      const c = this.collectibles[i];
      c.mesh.rotation.y += 0.05;
      if (c.type === 'coin') {
        c.mesh.rotation.z = Math.sin(Date.now() * 0.003 + c.mesh.position.z) * 0.2;
      }
      c.mesh.position.y = c.baseY + Math.sin(Date.now() * 0.005 + c.mesh.position.z) * 0.15;

      if (c.mesh.position.z > playerZ + 15) {
        this.scene.remove(c.mesh);
        this.collectibles.splice(i, 1);
      }
    }

    // Clean up passed obstacles
    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      const obs = this.obstacles[i];
      if (obs.mesh.position.z > playerZ + 15) {
        this.scene.remove(obs.mesh);
        this.obstacles.splice(i, 1);
      }
    }
  }

  spawnRow(z) {
    const randType = Math.random();

    if (randType < 0.35) {
      // 1. HIGH OBSTACLE: Ancient Carved Stone Temple Arch (MUST SLIDE / DUCK)
      const archGroup = new THREE.Group();
      archGroup.position.set(0, 0, z);

      // Left Pillar
      const leftPillar = new THREE.Mesh(new THREE.BoxGeometry(0.8, 3.2, 0.8), this.templeStoneMat);
      leftPillar.position.set(-3.2, 1.6, 0);
      leftPillar.castShadow = true;
      archGroup.add(leftPillar);

      // Right Pillar
      const rightPillar = new THREE.Mesh(new THREE.BoxGeometry(0.8, 3.2, 0.8), this.templeStoneMat);
      rightPillar.position.set(3.2, 1.6, 0);
      rightPillar.castShadow = true;
      archGroup.add(rightPillar);

      // Carved Horizontal Lintel Crossbar across all 3 lanes (bottom at y = 1.25, top at y = 2.05)
      const lintel = new THREE.Mesh(new THREE.BoxGeometry(7.2, 0.8, 0.9), this.templeStoneMat);
      lintel.position.set(0, 1.65, 0);
      lintel.castShadow = true;
      lintel.receiveShadow = true;
      archGroup.add(lintel);

      this.scene.add(archGroup);
      this.obstacles.push({
        mesh: archGroup,
        type: 'arch',
        lane: -1,
        requiresSlide: true
      });

      // Line of sliding reward coins under arch
      this.spawnCoinTrail(CONFIG.lanes[1], 0.45, z);

    } else if (randType < 0.70) {
      // 2. LOW OBSTACLE: Fallen Ancient Temple Column / Mossy Log (MUST JUMP)
      const openLane = Math.floor(Math.random() * 3);
      const lanesToBlock = [0, 1, 2].filter(l => l !== openLane);
      const blockCount = Math.random() > 0.5 ? 2 : 1;

      for (let i = 0; i < blockCount; i++) {
        const laneIdx = lanesToBlock[i];
        const posX = CONFIG.lanes[laneIdx];
        const colGeo = new THREE.CylinderGeometry(0.38, 0.44, 2.3, 9);
        const col = new THREE.Mesh(colGeo, this.templeStoneMat);
        col.rotation.z = Math.PI / 2;
        col.position.set(posX, 0.38, z);
        col.castShadow = true;
        col.receiveShadow = true;
        this.scene.add(col);
        this.obstacles.push({
          mesh: col,
          type: 'log',
          lane: laneIdx,
          box: new THREE.Box3(),
          canJumpOver: true
        });
      }

      // Elevated jump reward coin hovering over the hurdle
      this.spawnSingleCoin(CONFIG.lanes[lanesToBlock[0]], 2.1, z);

    } else {
      // 3. LANE BLOCKER: Massive Ancient Carved Temple Monolith (MUST STEER LEFT/RIGHT)
      const openLane = Math.floor(Math.random() * 3);
      const lanesToBlock = [0, 1, 2].filter(l => l !== openLane);
      const blockCount = Math.random() > 0.4 ? 2 : 1;

      for (let i = 0; i < blockCount; i++) {
        const laneIdx = lanesToBlock[i];
        const posX = CONFIG.lanes[laneIdx];
        const rockGeo = new THREE.DodecahedronGeometry(0.85, 1);
        const rock = new THREE.Mesh(rockGeo, this.templeStoneMat);
        rock.scale.set(1.3, 1.0, 1.1);
        rock.position.set(posX, 0.85, z);
        rock.castShadow = true;
        rock.receiveShadow = true;
        this.scene.add(rock);
        this.obstacles.push({
          mesh: rock,
          type: 'rock',
          lane: laneIdx,
          box: new THREE.Box3()
        });
      }

      // Trail of coins through the safe lane
      this.spawnCoinTrail(CONFIG.lanes[openLane], 0.9, z);
    }
  }

  spawnSingleCoin(x, y, z) {
    const coinGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.08, 16);
    const coin = new THREE.Mesh(coinGeo, this.coinMat);
    coin.rotation.x = Math.PI / 2;
    coin.position.set(x, y, z);
    coin.castShadow = true;
    this.scene.add(coin);
    this.collectibles.push({
      mesh: coin,
      type: 'coin',
      baseY: y,
      collected: false
    });
  }

  spawnCoinTrail(x, y, z) {
    [-1.8, 0, 1.8].forEach((offsetZ) => {
      this.spawnSingleCoin(x, y, z + offsetZ);
    });
  }

  reset() {
    this.obstacles.forEach(o => this.scene.remove(o.mesh));
    this.collectibles.forEach(c => this.scene.remove(c.mesh));
    this.obstacles = [];
    this.collectibles = [];
    this.nextObstacleZ = -35;
  }
}

/* ==========================================================================
   6. REALISTIC FEMALE ADVENTURER (Upright, Grounded, Jump & Slide Physics)
   ========================================================================== */
class AdventurerCharacter {
  constructor(scene) {
    this.scene = scene;
    this.root = new THREE.Group();
    this.scene.add(this.root);

    // Isolated pivot group: holds model, faces forward along -Z
    this.pivot = new THREE.Group();
    this.root.add(this.pivot);

    this.characterModel = null;
    this.bones = {};
    this.isModelLoaded = false;
    this.isProcedural = false;

    // Movement & Lane Physics
    this.currentLane = 1; // 0: Left, 1: Center, 2: Right
    this.targetX = CONFIG.lanes[1];
    this.posX = CONFIG.lanes[1];
    this.posY = 0;
    this.posZ = 0;
    this.velY = 0;
    this.isGrounded = true;
    this.isSliding = false;
    this.slideTimer = 0;
    this.bankAngle = 0;
    this.runCycle = 0;
    this.landingTimer = 0;

    this.limbs = {};
    this.loadCharacter();
  }

  loadCharacter() {
    const loader = new GLTFLoader();
    const updateLoader = (pct, text) => {
      const fill = document.getElementById('loader-progress');
      const label = document.getElementById('loader-status');
      if (fill) fill.style.width = `${pct}%`;
      if (label) label.textContent = text;
    };

    updateLoader(25, 'Loading Adventurer Michelle...');

    loader.load(
      'assets/models/michelle.glb',
      (gltf) => {
        updateLoader(70, 'Configuring Skeletal Rig...');
        const michelle = gltf.scene;

        // Priority 3, Item 8: Report animation clips clearly and honestly
        const clipNames = gltf.animations ? gltf.animations.map(a => a.name) : [];
        console.log('Michelle 3D model loaded successfully. Native clips in GLB:', clipNames);
        console.log('Notice: Native clips are [' + clipNames.join(', ') + ']. Native Run/Jump/Slide clips are absent in file. Deploying precision kinematic skeletal engine directly on Michelle 65 Mixamo bones.');

        // Natural human scale (~1.72m tall)
        michelle.scale.set(1.0, 1.0, 1.0);

        michelle.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
            if (child.material) {
              child.material.roughness = 0.65;
            }
          }
          if (child.isBone) {
            const name = child.name;
            if (name.includes('Hips')) this.bones.hips = child;
            else if (name.includes('Spine2')) this.bones.spine2 = child;
            else if (name.includes('Spine1')) this.bones.spine1 = child;
            else if (name.includes('Spine')) this.bones.spine = child;
            else if (name.includes('Neck')) this.bones.neck = child;
            else if (name.includes('Head')) this.bones.head = child;
            else if (name.includes('LeftUpLeg')) this.bones.leftUpLeg = child;
            else if (name.includes('LeftLeg')) this.bones.leftLeg = child;
            else if (name.includes('LeftFoot')) this.bones.leftFoot = child;
            else if (name.includes('LeftToeBase')) this.bones.leftToe = child;
            else if (name.includes('RightUpLeg')) this.bones.rightUpLeg = child;
            else if (name.includes('RightLeg')) this.bones.rightLeg = child;
            else if (name.includes('RightFoot')) this.bones.rightFoot = child;
            else if (name.includes('RightToeBase')) this.bones.rightToe = child;
            else if (name.includes('LeftArm')) this.bones.leftArm = child;
            else if (name.includes('LeftForeArm')) this.bones.leftForeArm = child;
            else if (name.includes('LeftHand')) this.bones.leftHand = child;
            else if (name.includes('RightArm')) this.bones.rightArm = child;
            else if (name.includes('RightForeArm')) this.bones.rightForeArm = child;
            else if (name.includes('RightHand')) this.bones.rightHand = child;

            // Cache native rest quaternions & rest translations
            child.userData.restQuat = child.quaternion.clone();
            child.userData.restPos = child.position.clone();
          }
        });

        this.characterModel = michelle;
        this.pivot.add(michelle);

        // Michelle's native rest rotation is IDENTITY:
        // Root Character node (+90 deg X) and Hips node (-90 deg X) cancel each other out.
        // Rotate pivot by Math.PI around Y so she faces forward along -Z (running direction).
        this.pivot.rotation.set(0, Math.PI, 0);

        // Grounding alignment: pin lowest foot to exactly y = 0.0
        this.root.updateMatrixWorld(true);
        const footWorld = new THREE.Vector3();
        if (this.bones.leftFoot) {
          this.bones.leftFoot.getWorldPosition(footWorld);
          michelle.position.y = -footWorld.y + 0.08;
        } else {
          michelle.position.y = 0;
        }

        this.isModelLoaded = true;
        updateLoader(100, 'Temple Ready!');
        setTimeout(() => {
          const overlay = document.getElementById('loader-overlay');
          if (overlay) overlay.classList.add('hidden');
        }, 350);
      },
      undefined,
      (err) => {
        console.warn('Michelle GLB fallback to procedural rig:', err);
        this.buildProceduralAdventurer();
        updateLoader(100, 'Ready!');
        setTimeout(() => {
          const overlay = document.getElementById('loader-overlay');
          if (overlay) overlay.classList.add('hidden');
        }, 350);
      }
    );
  }

  buildProceduralAdventurer() {
    this.isProcedural = true;
    const group = new THREE.Group();

    const skinMat = new THREE.MeshStandardMaterial({ color: 0xdfab8e, roughness: 0.6 });
    const hairMat = new THREE.MeshStandardMaterial({ color: 0x3d2314, roughness: 0.8 });
    const vestMat = new THREE.MeshStandardMaterial({ color: 0x34533a, roughness: 0.7 });
    const shirtMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.8 });
    const pantsMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.85 });
    const bootMat = new THREE.MeshStandardMaterial({ color: 0x1e1511, roughness: 0.6 });

    const pelvis = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.22, 0.25, 8), pantsMat);
    pelvis.position.y = 0.95;
    pelvis.castShadow = true;
    group.add(pelvis);
    this.limbs.pelvis = pelvis;

    const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.22, 0.5, 8), vestMat);
    torso.position.y = 1.32;
    torso.castShadow = true;
    group.add(torso);
    this.limbs.torso = torso;

    const head = new THREE.Mesh(new THREE.SphereGeometry(0.18, 12, 12), skinMat);
    head.position.y = 1.72;
    head.castShadow = true;
    group.add(head);

    const hair = new THREE.Mesh(new THREE.SphereGeometry(0.2, 12, 12), hairMat);
    hair.position.set(0, 1.76, -0.04);
    group.add(hair);

    const ponytail = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.45, 6), hairMat);
    ponytail.position.set(0, 1.74, -0.26);
    ponytail.rotation.x = -0.55;
    group.add(ponytail);
    this.limbs.ponytail = ponytail;

    const createLeg = (x) => {
      const legGroup = new THREE.Group();
      legGroup.position.set(x, 0.9, 0);

      const upper = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.08, 0.46), pantsMat);
      upper.position.y = -0.23;
      upper.castShadow = true;
      legGroup.add(upper);

      const lower = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.07, 0.45), pantsMat);
      lower.position.y = -0.65;
      lower.castShadow = true;
      legGroup.add(lower);

      const boot = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 0.25), bootMat);
      boot.position.set(0, -0.88, 0.06);
      boot.castShadow = true;
      legGroup.add(boot);

      group.add(legGroup);
      return legGroup;
    };

    this.limbs.leftLeg = createLeg(-0.16);
    this.limbs.rightLeg = createLeg(0.16);

    const createArm = (x) => {
      const armGroup = new THREE.Group();
      armGroup.position.set(x, 1.5, 0);

      const upper = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.06, 0.38), shirtMat);
      upper.position.y = -0.19;
      upper.castShadow = true;
      armGroup.add(upper);

      const lower = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.05, 0.36), skinMat);
      lower.position.y = -0.52;
      lower.castShadow = true;
      armGroup.add(lower);

      group.add(armGroup);
      return armGroup;
    };

    this.limbs.leftArm = createArm(-0.35);
    this.limbs.rightArm = createArm(0.35);

    group.rotation.y = Math.PI; // Face forward along -Z
    this.pivot.add(group);
    this.isModelLoaded = true;
  }

  setBoneDelta(bone, rx, ry, rz) {
    if (!bone || !bone.userData.restQuat) return;
    const euler = new THREE.Euler(rx, ry, rz, 'XYZ');
    const deltaQ = new THREE.Quaternion().setFromEuler(euler);
    bone.quaternion.copy(bone.userData.restQuat).multiply(deltaQ);
  }

  jump() {
    // Prevent repeated jumps while airborne
    if (this.isGrounded) {
      this.velY = CONFIG.jumpStrength;
      this.isGrounded = false;
      this.isSliding = false; // Jump cancels slide immediately
      this.slideTimer = 0;
      audio.playJump();
    }
  }

  slide() {
    if (this.isGrounded && !this.isSliding) {
      this.isSliding = true;
      this.slideTimer = CONFIG.slideDuration;
      audio.playSlide();
    }
  }

  moveLeft() {
    if (this.currentLane > 0) {
      this.currentLane--;
      this.targetX = CONFIG.lanes[this.currentLane];
    }
  }

  moveRight() {
    if (this.currentLane < CONFIG.lanes.length - 1) {
      this.currentLane++;
      this.targetX = CONFIG.lanes[this.currentLane];
    }
  }

  update(dt, currentSpeed, isRunning) {
    if (!this.isModelLoaded) return;

    // Responsive lateral lane shift with athletic banking
    const dx = this.targetX - this.posX;
    this.posX += dx * 13.0 * dt;
    this.bankAngle = THREE.MathUtils.lerp(this.bankAngle, -dx * 0.28, 12 * dt);

    // Slide timer
    if (this.isSliding) {
      this.slideTimer -= dt;
      if (this.slideTimer <= 0) {
        this.isSliding = false;
      }
    }

    // Landing shock timer
    if (this.landingTimer > 0) {
      this.landingTimer -= dt;
    }

    // REAL JUMP PHYSICS: Ascent, Apex, Descent, Ground Contact
    if (!this.isGrounded) {
      this.velY += CONFIG.gravity * dt;
      this.posY += this.velY * dt;
      if (this.posY <= 0) {
        this.posY = 0;
        this.velY = 0;
        this.isGrounded = true; // Landed!
        this.landingTimer = 0.16; // 160ms knee compression shock absorption
      }
    }

    if (isRunning) {
      this.posZ -= currentSpeed * dt;
    }

    this.root.position.set(this.posX, this.posY, this.posZ);
    this.root.rotation.z = this.bankAngle;

    // -------------------------------------------------------------
    // REALISTIC FEMALE SKELETAL KINEMATICS (Direct Michelle Bones)
    // -------------------------------------------------------------
    if (this.characterModel && Object.keys(this.bones).length > 0) {
      if (isRunning && this.isGrounded && !this.isSliding) {
        // RUN LOCOMOTION
        const cadence = (currentSpeed / CONFIG.baseSpeed) * 11.5;
        this.runCycle += dt * cadence;
        const phi = this.runCycle;

        this.pivot.position.y = 0;
        this.pivot.rotation.x = 0;

        // Legs: rhythmic athletic stride
        const legSwing = Math.sin(phi) * 0.65;
        this.setBoneDelta(this.bones.leftUpLeg, legSwing, 0, 0);
        this.setBoneDelta(this.bones.rightUpLeg, -legSwing, 0, 0);

        // Knees: bend on backswing, straighten forward
        const leftKnee = Math.max(0, -Math.sin(phi)) * 0.85;
        const rightKnee = Math.max(0, Math.sin(phi)) * 0.85;
        this.setBoneDelta(this.bones.leftLeg, leftKnee, 0, 0);
        this.setBoneDelta(this.bones.rightLeg, rightKnee, 0, 0);

        // Feet: keep soles level with ground during contact
        this.setBoneDelta(this.bones.leftFoot, -leftKnee * 0.45, 0, 0);
        this.setBoneDelta(this.bones.rightFoot, -rightKnee * 0.45, 0, 0);

        // Arms: counter-swing with bent elbows
        const armSwing = Math.sin(phi) * 0.55;
        this.setBoneDelta(this.bones.leftArm, -armSwing, 0, 0.15);
        this.setBoneDelta(this.bones.rightArm, armSwing, 0, -0.15);
        this.setBoneDelta(this.bones.leftForeArm, 1.1 + Math.sin(phi) * 0.2, 0, 0);
        this.setBoneDelta(this.bones.rightForeArm, 1.1 - Math.sin(phi) * 0.2, 0, 0);

        // Spine: athletic forward pitch + subtle torso twist
        this.setBoneDelta(this.bones.spine, 0.12, Math.sin(phi) * 0.06, 0);
        this.setBoneDelta(this.bones.spine1, 0.05, 0, 0);
        this.setBoneDelta(this.bones.head, -0.08, 0, 0);

        // Hips: subtle vertical stride bounce
        if (this.bones.hips && this.bones.hips.userData.restPos) {
          const bounce = Math.sin(phi * 2) * 1.5;
          this.bones.hips.position.y = this.bones.hips.userData.restPos.y + bounce;
        }

      } else if (!this.isGrounded) {
        // JUMP / LEAP POSTURE
        this.pivot.position.y = 0;
        this.pivot.rotation.x = 0;

        // Thighs lifted, knees tucked for hurdle clearance
        this.setBoneDelta(this.bones.leftUpLeg, 0.55, 0, 0.1);
        this.setBoneDelta(this.bones.rightUpLeg, 0.45, 0, -0.1);
        this.setBoneDelta(this.bones.leftLeg, 0.85, 0, 0);
        this.setBoneDelta(this.bones.rightLeg, 0.75, 0, 0);

        // Arms raised upward/outward for flight balance
        this.setBoneDelta(this.bones.leftArm, -0.85, 0, 0.4);
        this.setBoneDelta(this.bones.rightArm, -0.85, 0, -0.4);
        this.setBoneDelta(this.bones.leftForeArm, 0.65, 0, 0);
        this.setBoneDelta(this.bones.rightForeArm, 0.65, 0, 0);

        // Spine extended
        this.setBoneDelta(this.bones.spine, -0.1, 0, 0);
        this.setBoneDelta(this.bones.head, -0.15, 0, 0);

      } else if (this.landingTimer > 0) {
        // LANDING IMPACT COMPRESSION
        const comp = (this.landingTimer / 0.16) * 0.45;
        this.pivot.position.y = -comp * 0.2;
        this.setBoneDelta(this.bones.leftUpLeg, comp, 0, 0);
        this.setBoneDelta(this.bones.rightUpLeg, comp, 0, 0);
        this.setBoneDelta(this.bones.leftLeg, comp * 1.5, 0, 0);
        this.setBoneDelta(this.bones.rightLeg, comp * 1.5, 0, 0);

      } else if (this.isSliding) {
        // SLIDE / DUCK POSTURE (Passes safely under stone lintel archways)
        this.pivot.position.y = -0.42;
        this.pivot.rotation.x = -0.35; // Recline body backward

        // Lead leg forward, trail leg tucked under
        this.setBoneDelta(this.bones.leftUpLeg, 0.65, 0, 0.2);
        this.setBoneDelta(this.bones.leftLeg, 1.25, 0, 0);
        this.setBoneDelta(this.bones.rightUpLeg, -0.65, 0, -0.1);
        this.setBoneDelta(this.bones.rightLeg, 0.25, 0, 0);

        // Arms braced low to sides
        this.setBoneDelta(this.bones.leftArm, 0.35, 0, 0.3);
        this.setBoneDelta(this.bones.rightArm, 0.35, 0, -0.3);
        this.setBoneDelta(this.bones.leftForeArm, 0.5, 0, 0);
        this.setBoneDelta(this.bones.rightForeArm, 0.5, 0, 0);

        this.setBoneDelta(this.bones.spine, -0.35, 0, 0);
        this.setBoneDelta(this.bones.head, 0.3, 0, 0);

      } else {
        // IDLE / WAITING POSTURE
        this.pivot.position.y = 0;
        this.pivot.rotation.x = 0;
        const breath = Math.sin(Date.now() * 0.003) * 0.04;
        this.setBoneDelta(this.bones.spine, breath, 0, 0);
        this.setBoneDelta(this.bones.leftUpLeg, 0, 0, 0);
        this.setBoneDelta(this.bones.rightUpLeg, 0, 0, 0);
        this.setBoneDelta(this.bones.leftLeg, 0, 0, 0);
        this.setBoneDelta(this.bones.rightLeg, 0, 0, 0);
        this.setBoneDelta(this.bones.leftArm, 0.05, 0, 0.05);
        this.setBoneDelta(this.bones.rightArm, 0.05, 0, -0.05);
        this.setBoneDelta(this.bones.leftForeArm, 0.25, 0, 0);
        this.setBoneDelta(this.bones.rightForeArm, 0.25, 0, 0);
      }

    } else if (this.isProcedural && isRunning) {
      // PROCEDURAL RIG FALLBACK
      const runCycle = Date.now() * 0.010 * (currentSpeed / CONFIG.baseSpeed);
      if (this.isSliding) {
        this.limbs.pelvis.position.y = 0.45;
        this.limbs.torso.rotation.x = 0.6;
        this.limbs.leftLeg.rotation.x = -1.2;
        this.limbs.rightLeg.rotation.x = 0.9;
        this.limbs.leftArm.rotation.x = -0.8;
        this.limbs.rightArm.rotation.x = -0.8;
      } else if (this.isGrounded) {
        this.limbs.pelvis.position.y = 0.95;
        this.limbs.torso.rotation.x = 0;
        this.limbs.leftLeg.rotation.x = Math.sin(runCycle) * 0.75;
        this.limbs.rightLeg.rotation.x = -Math.sin(runCycle) * 0.75;
        this.limbs.leftArm.rotation.x = -Math.sin(runCycle) * 0.75;
        this.limbs.rightArm.rotation.x = Math.sin(runCycle) * 0.75;
        this.limbs.ponytail.rotation.x = -0.55 + Math.sin(runCycle * 2) * 0.18;
      } else {
        // Jump pose in air
        this.limbs.pelvis.position.y = 0.95;
        this.limbs.torso.rotation.x = -0.2;
        this.limbs.leftLeg.rotation.x = 0.4;
        this.limbs.rightLeg.rotation.x = -0.3;
        this.limbs.leftArm.rotation.x = 0.9;
        this.limbs.rightArm.rotation.x = 0.9;
      }
    }
  }

  reset() {
    this.currentLane = 1;
    this.targetX = CONFIG.lanes[1];
    this.posX = CONFIG.lanes[1];
    this.posY = 0;
    this.posZ = 0;
    this.velY = 0;
    this.isGrounded = true;
    this.isSliding = false;
    this.slideTimer = 0;
    this.bankAngle = 0;
    this.runCycle = 0;
    this.landingTimer = 0;
    this.root.position.set(this.posX, 0, 0);
  }
}

/* ==========================================================================
   7. THIRD-PERSON CINEMATIC CAMERA CONTROLLER
   ========================================================================== */
class CinematicCameraController {
  constructor(camera) {
    this.camera = camera;
    this.offset = new THREE.Vector3(0, 3.2, 5.8);
    this.lookTarget = new THREE.Vector3(0, 1.4, -4.0);
    this.shake = 0;
  }

  addTrauma(amount) {
    this.shake = Math.min(this.shake + amount, 0.7);
  }

  update(dt, character, currentSpeed) {
    const runBob = Math.sin(Date.now() * 0.010 * (currentSpeed / CONFIG.baseSpeed)) * 0.03;

    const targetCamX = character.posX * 0.65;
    const targetCamY = (character.isSliding ? 2.5 : character.posY * 0.5 + this.offset.y) + runBob;
    const targetCamZ = character.posZ + this.offset.z;

    this.camera.position.x = THREE.MathUtils.lerp(this.camera.position.x, targetCamX, 9 * dt);
    this.camera.position.y = THREE.MathUtils.lerp(this.camera.position.y, targetCamY, 10 * dt);
    this.camera.position.z = THREE.MathUtils.lerp(this.camera.position.z, targetCamZ, 12 * dt);

    if (this.shake > 0.01) {
      this.camera.position.x += (Math.random() - 0.5) * this.shake * 0.4;
      this.camera.position.y += (Math.random() - 0.5) * this.shake * 0.4;
      this.shake = THREE.MathUtils.lerp(this.shake, 0, 8 * dt);
    }

    const lookAtX = character.posX * 0.45;
    const lookAtY = character.posY * 0.5 + this.lookTarget.y;
    const lookAtZ = character.posZ + this.lookTarget.z;

    this.camera.lookAt(lookAtX, lookAtY, lookAtZ);
  }
}

/* ==========================================================================
   8. COMPUTER VISION: WEBCAM HAND TRACKING WITH DIRECT GAME CONTROL
   ========================================================================== */
class HandVisionTracker {
  constructor(onGesture) {
    this.onGesture = onGesture;
    this.video = document.getElementById('webcam-video');
    this.canvas = document.getElementById('hand-canvas');
    this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
    this.dot = document.getElementById('tracker-dot');
    this.stateText = document.getElementById('tracker-state-text');
    this.badge = document.getElementById('gesture-badge');
    this.hudPrompt = document.getElementById('gesture-hud-prompt');
    this.hudPromptText = document.getElementById('gesture-hud-text');
    this.hudPromptIcon = document.getElementById('gesture-hud-icon');
    this.hudPromptSub = document.getElementById('gesture-hud-sub');

    // Debug panel DOM elements
    this.dbgTracking = document.getElementById('dbg-tracking');
    this.dbgPos = document.getElementById('dbg-pos');
    this.dbgPinch = document.getElementById('dbg-pinch');
    this.dbgGesture = document.getElementById('dbg-gesture');
    this.dbgLastAction = document.getElementById('dbg-last-action');

    this.hands = null;
    this.isEnabled = false;
    this.isStarting = false;
    this.isProcessing = false;
    this.handActive = false;
    this.animFrameId = null;

    // Smoothed landmarks coordinates (mirrored: 0 = left screen, 1 = right screen)
    this.smoothX = 0.5;
    this.smoothY = 0.5;

    // Rearm states and debouncing
    this.steeringArmed = true;   // Rearms when hand returns to center neutral [0.42, 0.58]
    this.pinchArmed = true;      // Rearms when fingers release (pinchDist > 0.46)
    this.slideArmed = true;      // Rearms when hand is raised / opened (y < 0.58)
    this.lastActionTime = 0;
    this.actionCooldownMs = 260; // 260ms cooldown between consecutive actions
    this.promptTimeout = null;

    this.initMediaPipe();
  }

  setStatus(type, text) {
    if (this.stateText) this.stateText.textContent = text;
    if (this.dot) {
      this.dot.className = `tracker-status-dot ${type}`;
    }
  }

  initMediaPipe() {
    if (typeof window.Hands === 'undefined') {
      console.warn('MediaPipe Hands script offline. Keyboard mode ready.');
      this.setStatus('ready', 'KEYBOARD MODE');
      if (this.dbgTracking) this.dbgTracking.textContent = 'MediaPipe Offline';
      return;
    }

    try {
      this.hands = new window.Hands({
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1675469240/${file}`
      });

      this.hands.setOptions({
        maxNumHands: 1,
        modelComplexity: 0, // Lightweight, fast, robust CPU/WASM execution
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5
      });

      this.hands.onResults((results) => this.onResults(results));
    } catch (e) {
      console.warn('MediaPipe initialization caught:', e);
      this.setStatus('error', 'INIT ERROR');
    }
  }

  async toggle() {
    if (this.isEnabled) {
      this.stop();
      return false;
    } else {
      return await this.start();
    }
  }

  async start() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      this.setStatus('error', 'NO WEBCAM SUPPORT');
      alert('Webcam access is not supported in this browser.');
      return false;
    }

    if (this.isEnabled || this.isStarting) return true;
    this.isStarting = true;

    try {
      this.setStatus('starting', 'CAMERA STARTING...');
      if (this.badge) this.badge.textContent = 'Requesting camera access...';

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        },
        audio: false
      });

      this.video.srcObject = stream;
      this.video.playsInline = true;
      this.video.muted = true;
      this.video.autoplay = true;

      // Ensure video is ready to play
      await new Promise((resolve) => {
        if (this.video.readyState >= 2) {
          resolve();
        } else {
          this.video.onloadeddata = () => resolve();
        }
      });

      await this.video.play();

      this.isEnabled = true;
      this.setStatus('ready', 'CAMERA READY (NO HAND)');
      if (this.badge) this.badge.textContent = 'Place hand in camera view';
      if (this.dbgTracking) this.dbgTracking.textContent = 'Awaiting Hand';

      // Pre-initialize MediaPipe graph if possible
      if (this.hands && typeof this.hands.initialize === 'function') {
        try {
          await this.hands.initialize();
        } catch (initErr) {
          console.warn('MediaPipe async initialize note:', initErr);
        }
      }

      // Single-threaded frame pump
      const frameLoop = async () => {
        if (!this.isEnabled) return;
        if (this.hands && this.video && this.video.readyState >= 2 && !this.isProcessing) {
          this.isProcessing = true;
          try {
            await this.hands.send({ image: this.video });
          } catch (sendErr) {
            console.warn('Frame processing dropped:', sendErr);
            this.setStatus('error', 'TRACKING ERROR');
          } finally {
            this.isProcessing = false;
          }
        }
        this.animFrameId = requestAnimationFrame(frameLoop);
      };

      this.animFrameId = requestAnimationFrame(frameLoop);
      this.isStarting = false;
      return true;

    } catch (err) {
      this.isStarting = false;
      console.error('Camera startup error:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        this.setStatus('denied', 'CAMERA PERMISSION DENIED');
        if (this.badge) this.badge.textContent = 'Camera blocked by browser';
        alert('Webcam permission was denied. Please click the camera/lock icon in your browser URL bar and allow camera access.');
      } else {
        this.setStatus('error', 'CAMERA ERROR');
        if (this.badge) this.badge.textContent = err.message || 'Camera failed to start';
      }
      return false;
    }
  }

  stop() {
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    if (this.video && this.video.srcObject) {
      this.video.srcObject.getTracks().forEach((t) => t.stop());
      this.video.srcObject = null;
    }
    this.isEnabled = false;
    this.isStarting = false;
    this.isProcessing = false;
    this.handActive = false;
    this.setStatus('ready', 'STANDBY');
    if (this.badge) {
      this.badge.className = 'gesture-badge';
      this.badge.textContent = 'Keyboard Mode Active';
    }
    if (this.ctx && this.canvas) {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
    if (this.dbgTracking) this.dbgTracking.textContent = 'Not Detected';
    if (this.dbgPos) this.dbgPos.textContent = 'X: -- | Y: --';
    if (this.dbgPinch) this.dbgPinch.textContent = '--';
    if (this.dbgGesture) this.dbgGesture.textContent = 'None';
  }

  showActionFeedback(type, icon, label, subText) {
    if (!this.hudPrompt) return;

    this.hudPromptIcon.textContent = icon;
    this.hudPromptText.textContent = label;
    if (this.hudPromptSub) {
      this.hudPromptSub.textContent = subText || 'ACTION TRIGGERED';
    }
    this.hudPrompt.className = `gesture-hud-prompt show ${type}`;

    if (this.promptTimeout) clearTimeout(this.promptTimeout);
    this.promptTimeout = setTimeout(() => {
      this.hudPrompt.classList.remove('show');
    }, 450);
  }

  onResults(results) {
    if (!this.canvas || !this.ctx) return;
    const w = this.canvas.width;
    const h = this.canvas.height;
    this.ctx.clearRect(0, 0, w, h);

    // Draw active zone dividers on canvas
    this.drawZoneOverlay(w, h);

    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
      this.handActive = true;
      this.setStatus('active', 'HAND DETECTED');
      const landmarks = results.multiHandLandmarks[0];

      // Draw mirrored hand skeleton on top of live mirrored video
      this.drawHandSkeleton(landmarks, w, h);

      // Key Landmark Points
      const wrist = landmarks[0];
      const thumbTip = landmarks[4];
      const indexTip = landmarks[8];
      const middleKnuckle = landmarks[9];
      const middleTip = landmarks[12];
      const ringTip = landmarks[16];
      const pinkyTip = landmarks[20];

      const palmScale = Math.hypot(wrist.x - middleKnuckle.x, wrist.y - middleKnuckle.y) || 0.25;

      // Mirrored horizontal position: User moves hand left -> cursor on left
      const rawX = 1.0 - middleKnuckle.x;
      const rawY = middleKnuckle.y;
      this.smoothX = this.smoothX * 0.65 + rawX * 0.35;
      this.smoothY = this.smoothY * 0.65 + rawY * 0.35;

      // Draw smoothed hand tracking cursor dot
      this.drawHandCursor(this.smoothX, this.smoothY, w, h);

      // 1. PINCH-TO-JUMP GESTURE
      const pinchDist = Math.hypot(thumbTip.x - indexTip.x, thumbTip.y - indexTip.y) / palmScale;

      // Release rearm
      if (pinchDist > 0.46) {
        this.pinchArmed = true;
      }

      // 2. FIST OR DOWNWARD HAND -> SLIDE / DUCK
      const f1 = Math.hypot(indexTip.x - wrist.x, indexTip.y - wrist.y) / palmScale;
      const f2 = Math.hypot(middleTip.x - wrist.x, middleTip.y - wrist.y) / palmScale;
      const f3 = Math.hypot(ringTip.x - wrist.x, ringTip.y - wrist.y) / palmScale;
      const f4 = Math.hypot(pinkyTip.x - wrist.x, pinkyTip.y - wrist.y) / palmScale;
      const isFist = (f1 < 0.95 && f2 < 0.95 && f3 < 0.95 && f4 < 0.95);
      const isLowHand = (this.smoothY > 0.68);

      // Slide rearm: hand raised / opened
      if (!isFist && this.smoothY < 0.58) {
        this.slideArmed = true;
      }

      // Check Actions with Cooldown
      const now = performance.now();
      const canTrigger = (now - this.lastActionTime) > this.actionCooldownMs;
      let currentGesture = 'Neutral';

      if (pinchDist < 0.32) {
        currentGesture = 'Pinch (Jump)';
        if (this.pinchArmed && canTrigger) {
          this.pinchArmed = false;
          this.lastActionTime = now;
          this.badge.className = 'gesture-badge jump';
          this.badge.textContent = '⚡ JUMP TRIGGERED';
          this.showActionFeedback('jump', '⚡', 'JUMP', `PINCH (${pinchDist.toFixed(2)})`);
          this.logDebugAction('JUMP (PINCH)');
          this.onGesture('jump');
        }
      } else if (isFist || isLowHand) {
        currentGesture = isFist ? 'Fist (Slide)' : 'Hand Low (Slide)';
        if (this.slideArmed && canTrigger) {
          this.slideArmed = false;
          this.lastActionTime = now;
          this.badge.className = 'gesture-badge slide';
          this.badge.textContent = '🔽 SLIDE / DUCK';
          this.showActionFeedback('slide', '🔽', 'SLIDE', isFist ? 'FIST DUCK' : 'DOWNWARD HAND');
          this.logDebugAction('SLIDE (DUCK)');
          this.onGesture('slide');
        }
      } else if (this.smoothX < 0.36) {
        currentGesture = 'Left Lane';
        if (this.steeringArmed && canTrigger) {
          this.steeringArmed = false;
          this.lastActionTime = now;
          this.badge.className = 'gesture-badge left';
          this.badge.textContent = '◀ STEERING LEFT';
          this.showActionFeedback('left', '◀', 'LEFT LANE', `HAND X: ${(this.smoothX * 100).toFixed(0)}%`);
          this.logDebugAction('LEFT LANE');
          this.onGesture('left');
        }
      } else if (this.smoothX > 0.64) {
        currentGesture = 'Right Lane';
        if (this.steeringArmed && canTrigger) {
          this.steeringArmed = false;
          this.lastActionTime = now;
          this.badge.className = 'gesture-badge right';
          this.badge.textContent = 'STEERING RIGHT ▶';
          this.showActionFeedback('right', '▶', 'RIGHT LANE', `HAND X: ${(this.smoothX * 100).toFixed(0)}%`);
          this.logDebugAction('RIGHT LANE');
          this.onGesture('right');
        }
      } else if (this.smoothX >= 0.42 && this.smoothX <= 0.58) {
        currentGesture = 'Center Neutral';
        if (!this.steeringArmed) {
          this.steeringArmed = true; // Rearmed!
          this.badge.className = 'gesture-badge';
          this.badge.textContent = '● Center Neutral (Ready)';
        }
      }

      // Update Debug Panel in real time
      if (this.dbgTracking) this.dbgTracking.textContent = '21 Landmarks (Live)';
      if (this.dbgPos) this.dbgPos.textContent = `X: ${(this.smoothX * 100).toFixed(0)}% | Y: ${(this.smoothY * 100).toFixed(0)}%`;
      if (this.dbgPinch) this.dbgPinch.textContent = `${pinchDist.toFixed(2)} (${this.pinchArmed ? 'Armed' : 'Active'})`;
      if (this.dbgGesture) this.dbgGesture.textContent = currentGesture;

    } else {
      // No hand in view
      this.handActive = false;
      this.setStatus('searching', 'NO HAND DETECTED');
      this.badge.className = 'gesture-badge';
      this.badge.textContent = 'Hold hand up in view';

      // Visual prompt ribbon on canvas
      this.ctx.fillStyle = 'rgba(15, 11, 28, 0.75)';
      this.ctx.fillRect(10, h / 2 - 16, w - 20, 32);
      this.ctx.strokeStyle = 'rgba(168, 85, 247, 0.4)';
      this.ctx.strokeRect(10, h / 2 - 16, w - 20, 32);

      this.ctx.fillStyle = '#ec4899';
      this.ctx.font = 'bold 11px sans-serif';
      this.ctx.textAlign = 'center';
      this.ctx.fillText('NO HAND DETECTED', w / 2, h / 2 - 2);

      this.ctx.fillStyle = '#cbd5e1';
      this.ctx.font = '9px sans-serif';
      this.ctx.fillText('Raise hand in front of webcam', w / 2, h / 2 + 11);

      if (this.dbgTracking) this.dbgTracking.textContent = 'Awaiting Hand...';
      if (this.dbgPos) this.dbgPos.textContent = 'X: -- | Y: --';
      if (this.dbgPinch) this.dbgPinch.textContent = '--';
      if (this.dbgGesture) this.dbgGesture.textContent = 'None';
    }
  }

  logDebugAction(actionName) {
    if (this.dbgLastAction) {
      const now = new Date();
      const timeStr = now.toTimeString().split(' ')[0];
      this.dbgLastAction.textContent = `${actionName} (${timeStr})`;
    }
  }

  drawZoneOverlay(w, h) {
    this.ctx.save();
    this.ctx.strokeStyle = 'rgba(168, 85, 247, 0.35)';
    this.ctx.lineWidth = 1;
    this.ctx.setLineDash([4, 4]);

    // Left Lane Divider (x = 0.36)
    this.ctx.beginPath();
    this.ctx.moveTo(w * 0.36, 0);
    this.ctx.lineTo(w * 0.36, h);
    this.ctx.stroke();

    // Right Lane Divider (x = 0.64)
    this.ctx.beginPath();
    this.ctx.moveTo(w * 0.64, 0);
    this.ctx.lineTo(w * 0.64, h);
    this.ctx.stroke();

    // Slide Lower Zone Divider (y = 0.68)
    this.ctx.strokeStyle = 'rgba(52, 211, 153, 0.35)';
    this.ctx.beginPath();
    this.ctx.moveTo(0, h * 0.68);
    this.ctx.lineTo(w, h * 0.68);
    this.ctx.stroke();

    this.ctx.setLineDash([]);
    this.ctx.font = 'bold 9px sans-serif';
    this.ctx.fillStyle = 'rgba(236, 72, 153, 0.85)';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('LEFT', w * 0.18, 14);
    this.ctx.fillText('CENTER', w * 0.50, 14);
    this.ctx.fillText('RIGHT', w * 0.82, 14);

    this.ctx.fillStyle = 'rgba(52, 211, 153, 0.85)';
    this.ctx.textAlign = 'right';
    this.ctx.fillText('SLIDE ZONE', w - 8, h * 0.68 - 4);
    this.ctx.restore();
  }

  drawHandCursor(normX, normY, w, h) {
    this.ctx.save();
    const cx = normX * w;
    const cy = normY * h;
    this.ctx.fillStyle = this.steeringArmed ? '#ec4899' : '#a855f7';
    this.ctx.beginPath();
    this.ctx.arc(cx, cy, 6, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.strokeStyle = '#ffffff';
    this.ctx.lineWidth = 2;
    this.ctx.stroke();
    this.ctx.restore();
  }

  drawHandSkeleton(landmarks, w, h) {
    const connections = [
      [0,1],[1,2],[2,3],[3,4],
      [0,5],[5,6],[6,7],[7,8],
      [5,9],[9,10],[10,11],[11,12],
      [9,13],[13,14],[14,15],[15,16],
      [13,17],[17,18],[18,19],[19,20],[0,17]
    ];

    // Coordinate mapping: horizontally mirrored to match scaleX(-1) video
    const mapPt = (pt) => ({
      x: (1.0 - pt.x) * w,
      y: pt.y * h
    });

    this.ctx.lineWidth = 2.5;
    this.ctx.strokeStyle = '#a855f7';
    this.ctx.shadowColor = '#ec4899';
    this.ctx.shadowBlur = 6;

    connections.forEach(([i, j]) => {
      const p1 = mapPt(landmarks[i]);
      const p2 = mapPt(landmarks[j]);
      this.ctx.beginPath();
      this.ctx.moveTo(p1.x, p1.y);
      this.ctx.lineTo(p2.x, p2.y);
      this.ctx.stroke();
    });

    // Special line between Thumb tip (4) and Index tip (8) indicating pinch distance
    const pThumb = mapPt(landmarks[4]);
    const pIndex = mapPt(landmarks[8]);
    this.ctx.strokeStyle = '#ec4899';
    this.ctx.lineWidth = 1.5;
    this.ctx.beginPath();
    this.ctx.moveTo(pThumb.x, pThumb.y);
    this.ctx.lineTo(pIndex.x, pIndex.y);
    this.ctx.stroke();

    this.ctx.shadowBlur = 0;
    landmarks.forEach((pt, idx) => {
      const p = mapPt(pt);
      this.ctx.fillStyle = (idx === 4 || idx === 8) ? '#ec4899' : '#38bdf8';
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, idx === 4 || idx === 8 ? 4.5 : 3, 0, Math.PI * 2);
      this.ctx.fill();
    });
  }
}

/* ==========================================================================
   9. MASTER GAME STATE ENGINE
   ========================================================================== */
class GameEngine {
  constructor() {
    this.renderer = new WorldRenderer();
    this.temple = new JungleTempleManager(this.renderer.scene);
    this.character = new AdventurerCharacter(this.renderer.scene);
    this.camCtrl = new CinematicCameraController(this.renderer.camera);

    this.state = 'START';
    this.distance = 0;
    this.score = 0;
    this.coins = 0;
    this.crystals = 0;
    this.lives = 3;
    this.speed = CONFIG.baseSpeed;
    this.invulnerableTimer = 0;
    this.lastMilestone = 0;
    this.highScore = parseInt(localStorage.getItem('handverse_highscore') || '0', 10);

    this.hudDist = document.getElementById('hud-distance');
    this.hudScore = document.getElementById('hud-score');
    this.hudCoins = document.getElementById('hud-coins-val');
    this.hudCrystals = document.getElementById('hud-crystals');
    this.startScreen = document.getElementById('start-screen');
    this.pauseScreen = document.getElementById('pause-screen');
    this.gameOverScreen = document.getElementById('gameover-screen');
    this.milestoneBanner = document.getElementById('milestone-banner');
    this.damageVignette = document.getElementById('damage-vignette');
    this.highScoreText = document.getElementById('high-score-text');

    this.clock = new THREE.Clock();
    this.handTracker = new HandVisionTracker((action) => this.onGestureInput(action));

    this.bindEvents();
    this.updateHUD();

    requestAnimationFrame((t) => this.loop(t));
  }

  bindEvents() {
    window.addEventListener('keydown', (e) => {
      audio.init();

      if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
        if (this.state === 'RUNNING') {
          this.character.moveLeft();
          this.handTracker.showActionFeedback('left', '◀', 'LEFT LANE', 'KEYBOARD A/LEFT');
        }
      } else if (e.code === 'ArrowRight' || e.code === 'KeyD') {
        if (this.state === 'RUNNING') {
          this.character.moveRight();
          this.handTracker.showActionFeedback('right', '▶', 'RIGHT LANE', 'KEYBOARD D/RIGHT');
        }
      } else if (e.code === 'ArrowUp' || e.code === 'KeyW' || e.code === 'Space') {
        if (this.state === 'RUNNING') {
          this.character.jump();
          this.handTracker.showActionFeedback('jump', '⚡', 'JUMP', 'KEYBOARD W/SPACE');
        }
      } else if (e.code === 'ArrowDown' || e.code === 'KeyS') {
        if (this.state === 'RUNNING') {
          this.character.slide();
          this.handTracker.showActionFeedback('slide', '🔽', 'SLIDE', 'KEYBOARD S/DOWN');
        }
      } else if (e.code === 'KeyP' || e.code === 'Escape') {
        this.togglePause();
      } else if (e.code === 'KeyM') {
        this.toggleSound();
      } else if (e.code === 'KeyC') {
        this.toggleCamera();
      } else if (e.code === 'KeyF') {
        this.toggleFullscreen();
      }
    });

    document.getElementById('btn-start').addEventListener('click', async () => {
      audio.init();
      if (!this.handTracker.isEnabled) {
        await this.handTracker.start();
      }
      this.startGame();
    });

    document.getElementById('btn-enable-camera').addEventListener('click', async () => {
      audio.init();
      await this.toggleCamera();
    });

    document.getElementById('btn-resume').addEventListener('click', () => this.resumeGame());
    document.getElementById('btn-restart-pause').addEventListener('click', () => this.restartGame());
    document.getElementById('btn-restart').addEventListener('click', () => this.restartGame());
    document.getElementById('btn-home').addEventListener('click', () => this.goHome());

    document.getElementById('btn-sound').addEventListener('click', () => this.toggleSound());
    document.getElementById('btn-camera').addEventListener('click', () => this.toggleCamera());
    document.getElementById('btn-pause').addEventListener('click', () => this.togglePause());
    document.getElementById('btn-fullscreen').addEventListener('click', () => this.toggleFullscreen());
  }

  onGestureInput(action) {
    if (this.state !== 'RUNNING') return;
    if (action === 'left') {
      this.character.moveLeft();
    } else if (action === 'right') {
      this.character.moveRight();
    } else if (action === 'jump') {
      this.character.jump();
    } else if (action === 'slide') {
      this.character.slide();
    }
  }

  startGame() {
    this.state = 'RUNNING';
    this.startScreen.classList.add('hidden');
    this.pauseScreen.classList.add('hidden');
    this.gameOverScreen.classList.add('hidden');
  }

  togglePause() {
    if (this.state === 'RUNNING') {
      this.state = 'PAUSED';
      this.pauseScreen.classList.remove('hidden');
    } else if (this.state === 'PAUSED') {
      this.resumeGame();
    }
  }

  resumeGame() {
    this.state = 'RUNNING';
    this.pauseScreen.classList.add('hidden');
  }

  goHome() {
    this.state = 'START';
    this.character.reset();
    this.temple.reset();
    this.distance = 0;
    this.score = 0;
    this.coins = 0;
    this.crystals = 0;
    this.lives = 3;
    this.updateHUD();

    this.gameOverScreen.classList.add('hidden');
    this.pauseScreen.classList.add('hidden');
    this.startScreen.classList.remove('hidden');
  }

  restartGame() {
    this.distance = 0;
    this.score = 0;
    this.coins = 0;
    this.crystals = 0;
    this.lives = 3;
    this.speed = CONFIG.baseSpeed;
    this.invulnerableTimer = 0;
    this.lastMilestone = 0;

    this.character.reset();
    this.temple.reset();
    this.updateHUD();

    this.startScreen.classList.add('hidden');
    this.pauseScreen.classList.add('hidden');
    this.gameOverScreen.classList.add('hidden');
    this.state = 'RUNNING';
  }

  toggleSound() {
    const isUnmuted = audio.toggleMute();
    const btn = document.getElementById('btn-sound');
    btn.textContent = isUnmuted ? '🔊' : '🔇';
    btn.classList.toggle('active', isUnmuted);
  }

  async toggleCamera() {
    const active = await this.handTracker.toggle();
    const btn = document.getElementById('btn-camera');
    if (btn) btn.classList.toggle('active', active);
    const testBtn = document.getElementById('btn-enable-camera');
    if (testBtn) {
      testBtn.innerHTML = active ? '<span>🟢 Camera Active — Testing Hand</span>' : '<span>📷 Test &amp; Preview Camera</span>';
    }
  }

  toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  }

  triggerMilestone(dist) {
    audio.playMilestone();
    this.score += 500;
    this.milestoneBanner.textContent = `🌟 TEMPLE MILESTONE: ${dist}M DEEP! +500 PTS`;
    this.milestoneBanner.classList.add('show');
    setTimeout(() => {
      this.milestoneBanner.classList.remove('show');
    }, 2800);
  }

  showPopupText(text) {
    const popup = document.createElement('div');
    popup.className = 'popup-score';
    popup.textContent = text;
    popup.style.left = `${window.innerWidth / 2}px`;
    popup.style.top = `${window.innerHeight / 2 - 40}px`;
    document.body.appendChild(popup);
    setTimeout(() => popup.remove(), 900);
  }

  checkCollisions() {
    const pBox = new THREE.Box3();
    const pPos = this.character.root.position;

    // Character Bounding Box (height reduced by 65% when sliding!)
    if (this.character.isSliding) {
      pBox.min.set(pPos.x - 0.35, 0.05, pPos.z - 0.4);
      pBox.max.set(pPos.x + 0.35, 0.65, pPos.z + 0.4);
    } else {
      pBox.min.set(pPos.x - 0.35, pPos.y + 0.1, pPos.z - 0.4);
      pBox.max.set(pPos.x + 0.35, 1.8, pPos.z + 0.4);
    }

    // 1. Obstacle Collisions
    if (this.invulnerableTimer <= 0) {
      for (let i = 0; i < this.temple.obstacles.length; i++) {
        const obs = this.temple.obstacles[i];

        if (obs.type === 'arch') {
          // If character is sliding, height is <= 0.65 -> Passes safely underneath arch!
          if (this.character.isSliding) {
            continue;
          }
          const crossbarBox = new THREE.Box3(
            new THREE.Vector3(-3.2, 1.25, obs.mesh.position.z - 0.45),
            new THREE.Vector3(3.2, 2.05, obs.mesh.position.z + 0.45)
          );
          if (pBox.intersectsBox(crossbarBox)) {
            this.onPlayerHit();
            break;
          }
        } else if (obs.type === 'log') {
          if (pPos.y > 0.75) {
            continue; // Clean jump over fallen pillar!
          }
          obs.box.setFromObject(obs.mesh);
          if (pBox.intersectsBox(obs.box)) {
            this.onPlayerHit();
            break;
          }
        } else {
          // Boulder / Monolith
          obs.box.setFromObject(obs.mesh);
          if (pBox.intersectsBox(obs.box)) {
            this.onPlayerHit();
            break;
          }
        }
      }
    }

    // 2. Collectibles (Coins & Crystals)
    for (let i = 0; i < this.temple.collectibles.length; i++) {
      const c = this.temple.collectibles[i];
      if (c.collected) continue;

      const cPos = c.mesh.position;
      const dist = Math.hypot(pPos.x - cPos.x, pPos.y - cPos.y, pPos.z - cPos.z);
      if (dist < 1.35) {
        c.collected = true;
        this.renderer.scene.remove(c.mesh);

        if (c.type === 'coin') {
          this.coins++;
          this.score += 25;
          audio.playCoin();
          this.showPopupText('+25 🪙');
        } else {
          this.crystals++;
          this.score += 50;
          audio.playCrystal();
          this.showPopupText('+50 💎');
        }
        this.updateHUD();
      }
    }
  }

  onPlayerHit() {
    this.lives--;
    this.invulnerableTimer = 1.6;
    audio.playHit();
    this.camCtrl.addTrauma(0.5);

    this.damageVignette.classList.add('flash');
    setTimeout(() => this.damageVignette.classList.remove('flash'), 180);

    this.updateHUD();

    if (this.lives <= 0) {
      this.gameOver();
    }
  }

  gameOver() {
    this.state = 'GAMEOVER';
    audio.playGameOver();

    if (this.score > this.highScore) {
      this.highScore = this.score;
      localStorage.setItem('handverse_highscore', this.highScore);
    }

    document.getElementById('res-distance').textContent = `${Math.floor(this.distance)} m`;
    document.getElementById('res-coins').textContent = this.coins;
    document.getElementById('res-crystals').textContent = this.crystals;
    document.getElementById('res-score').textContent = this.score;
    this.highScoreText.textContent = `🏆 Record High Score: ${this.highScore} pts`;

    this.gameOverScreen.classList.remove('hidden');
  }

  updateHUD() {
    this.hudDist.textContent = `${Math.floor(this.distance)} m`;
    this.hudScore.textContent = this.score;
    if (this.hudCoins) this.hudCoins.textContent = this.coins;
    this.hudCrystals.textContent = this.crystals;

    for (let i = 1; i <= 3; i++) {
      const heart = document.getElementById(`heart-${i}`);
      if (heart) {
        heart.classList.toggle('lost', i > this.lives);
      }
    }
  }

  loop() {
    requestAnimationFrame(() => this.loop());

    const dt = Math.min(this.clock.getDelta(), 0.08);

    if (this.state === 'RUNNING') {
      this.speed = Math.min(CONFIG.maxSpeed, this.speed + CONFIG.speedAccel * dt);
      this.distance += this.speed * dt;
      this.score += Math.floor(this.speed * dt * 2.0);

      const currentMilestone = Math.floor(this.distance / 250) * 250;
      if (currentMilestone > this.lastMilestone && currentMilestone > 0) {
        this.lastMilestone = currentMilestone;
        this.triggerMilestone(currentMilestone);
      }

      if (this.invulnerableTimer > 0) {
        this.invulnerableTimer -= dt;
        this.character.root.visible = Math.floor(Date.now() / 80) % 2 === 0;
      } else {
        this.character.root.visible = true;
      }

      this.character.update(dt, this.speed, true);
      this.temple.update(this.character.posZ, this.speed);
      this.checkCollisions();
      this.updateHUD();
    } else {
      this.character.update(dt, this.speed, false);
    }

    this.camCtrl.update(dt, this.character, this.speed);
    this.renderer.updateParticles(dt, this.character.posZ);
    this.renderer.renderer.render(this.renderer.scene, this.renderer.camera);
  }
}

/* ==========================================================================
   10. LAUNCH ENGINE ON PAGE LOAD
   ========================================================================== */
window.addEventListener('DOMContentLoaded', () => {
  new GameEngine();
});
