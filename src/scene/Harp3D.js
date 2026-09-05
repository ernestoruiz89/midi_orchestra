import * as THREE from 'three';
import gsap from 'gsap';
import { createHarpBodyGeometry } from './HarpGeometry.js';

// Exact scale data from midis2jam2 Harp.json (MidiJam.exe calibration)
const RAW_SCALES = [
  69.010002, 68.606003, 68.093002, 67.471001, 66.876999, 65.849998, 64.686996, 63.417,
  62.335999, 61.146999, 60.012001, 59.066002, 58.362999, 57.551998, 56.958, 56.417,
  55.876999, 55.417, 55.039001, 54.687, 54.282001, 53.903999, 53.551998, 53.174,
  52.876999, 52.632999, 52.335999, 52.201, 52.066002, 51.958, 51.931, 51.985001,
  52.034, 52.094002, 52.194, 52.313999, 52.414001, 52.694, 52.973999, 53.254002,
  53.613998, 54.153999, 54.594002, 54.894001, 55.133999, 55.113998, 55.113998
];

const HARP_SCALES = RAW_SCALES.map((fl, index) => fl - (index / 47.0 * 4.5 + 1.0));

// Diatonic mapping table (MIDI pitch % 12 -> 0..6)
const DIATONIC_INDEX = { 0: 0, 2: 1, 4: 2, 5: 3, 7: 4, 9: 5, 11: 6 };
const BLACK_KEY_CLASSES = new Set([1, 3, 6, 8, 10]);

/**
 * Harp3D: Authentic midis2jam2 / MidiJam Concert Harp
 * Features:
 * - 100% faithful 3D model from midis2jam2 (Harp.obj & HarpSkin texture).
 * - Full 47-string array with midis2jam2 calibrated string lengths (Harp.json).
 * - Authentic string coloration: C = Red, F = Blue, Naturals = White/Gut.
 * - Reactive string plucking oscillation and golden spark bloom FX.
 */
export class Harp3D {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();

    // Stage Left Classical Section position
    this.group.position.set(-4.20, 0.0, -0.40);
    // Classical stage orientation (pillar facing front, body extending rearward)
    this.group.rotation.y = 0.0;

    this.strings = [];
    this.sparkPool = [];
    this.activeNotes = new Map();

    // Scale factor to convert midis2jam2 units (~80 units = ~1.85m) to meters
    this.modelScale = 0.0232;

    this._buildMaterials();
    this._buildModel();
    this._buildStrings();
    this._buildPluckSparkFX();

    this.scene.add(this.group);
  }

  _buildMaterials() {
    // 1. Authentic midis2jam2 Wood Texture
    const textureLoader = new THREE.TextureLoader();
    this.skinTexture = textureLoader.load('/models/harp/HarpSkin.png');
    this.skinTexture.colorSpace = THREE.SRGBColorSpace;

    this.bodyMaterial = new THREE.MeshStandardMaterial({
      map: this.skinTexture,
      roughness: 0.38,
      metalness: 0.04
    });

    // 2. String Materials (International Color Code)
    this.stringRedMaterial = new THREE.MeshStandardMaterial({
      color: 0xd81c2d,
      emissive: 0x3d060a,
      emissiveIntensity: 0.25,
      roughness: 0.32,
      metalness: 0.18
    });

    this.stringBlueMaterial = new THREE.MeshStandardMaterial({
      color: 0x1b54bc,
      emissive: 0x051a3d,
      emissiveIntensity: 0.25,
      roughness: 0.32,
      metalness: 0.18
    });

    this.stringWhiteMaterial = new THREE.MeshStandardMaterial({
      color: 0xfdfaf0,
      emissive: 0x221e16,
      emissiveIntensity: 0.12,
      roughness: 0.38,
      metalness: 0.06
    });

    // 3. Pluck Glow Spark Material
    this.pluckGlowMaterial = new THREE.MeshBasicMaterial({
      color: 0xffea88,
      transparent: true,
      opacity: 0.0,
      blending: THREE.AdditiveBlending
    });
  }

  _buildModel() {
    // Inner scaled group so model and strings share identical coordinate space
    this.innerGroup = new THREE.Group();
    this.innerGroup.scale.set(this.modelScale, this.modelScale, this.modelScale);

    // Bounding box minY of Harp.obj is -3.591; offsetting +3.591 sets the base flush on stage floor
    this.innerGroup.position.y = 3.591 * this.modelScale;

    // Build Harp Body Mesh from HarpGeometry
    const bodyGeom = createHarpBodyGeometry();
    const bodyMesh = new THREE.Mesh(bodyGeom, this.bodyMaterial);
    bodyMesh.castShadow = true;
    bodyMesh.receiveShadow = true;
    this.innerGroup.add(bodyMesh);

    this.group.add(this.innerGroup);
  }

  _buildStrings() {
    this.stringContainer = new THREE.Group();

    for (let i = 0; i < 47; i++) {
      // midis2jam2 string placement formula:
      // loc = (0, i / 47.0 * 42.0 + 4.738, -i * 0.75 - 4.0)
      // rot = (4 deg in X)
      // height = ((1.0 - i / 47.0) * 42.0 + HARP_SCALES[i] - 42.0)
      const locY = (i / 47.0) * 42.0 + 4.738;
      const locZ = -i * 0.75 - 4.0;
      const height = ((1.0 - i / 47.0) * 42.0 + HARP_SCALES[i] - 42.0);

      // Color coding:
      // i % 7 === 0 -> Red (C)
      // i % 7 === 3 -> Blue (F)
      // else -> White / Natural
      let mat = this.stringWhiteMaterial;
      const isC = (i % 7 === 0);
      const isF = (i % 7 === 3);
      if (isC) mat = this.stringRedMaterial;
      else if (isF) mat = this.stringBlueMaterial;

      // String radius: slightly thicker at bass (0.12) down to treble (0.055) in model units
      const radius = THREE.MathUtils.lerp(0.12, 0.055, i / 46.0);

      // Create cylinder with origin at bottom base so it extends upward
      const geom = new THREE.CylinderGeometry(radius, radius, height, 8);
      geom.translate(0, height * 0.5, 0);

      const mesh = new THREE.Mesh(geom, mat);
      mesh.position.set(0, locY, locZ);
      mesh.rotation.x = THREE.MathUtils.degToRad(4);
      mesh.castShadow = true;

      this.stringContainer.add(mesh);

      // Calculate world midpoint for pluck spark FX
      const midY = (locY + (height * 0.5) * Math.cos(THREE.MathUtils.degToRad(4))) * this.modelScale + this.innerGroup.position.y;
      const midZ = (locZ - (height * 0.5) * Math.sin(THREE.MathUtils.degToRad(4))) * this.modelScale;

      this.strings.push({
        index: i,
        mesh,
        restPos: mesh.position.clone(),
        midPointWorld: new THREE.Vector3(0, midY, midZ),
        length: height * this.modelScale,
        material: mat,
        isC,
        isF
      });
    }

    this.innerGroup.add(this.stringContainer);
  }

  _buildPluckSparkFX() {
    this.fxGroup = new THREE.Group();
    for (let i = 0; i < 12; i++) {
      const sparkGeom = new THREE.RingGeometry(0.008, 0.040, 16);
      const sparkMesh = new THREE.Mesh(sparkGeom, this.pluckGlowMaterial.clone());
      sparkMesh.visible = false;
      this.fxGroup.add(sparkMesh);
      this.sparkPool.push(sparkMesh);
    }
    this.group.add(this.fxGroup);
  }

  _triggerPluckFX(pos) {
    const spark = this.sparkPool.find(s => !s.visible) || this.sparkPool[0];
    if (!spark) return;

    spark.position.copy(pos);
    spark.scale.set(0.2, 0.2, 0.2);
    spark.material.opacity = 0.95;
    spark.visible = true;

    gsap.killTweensOf(spark.scale);
    gsap.killTweensOf(spark.material);

    gsap.to(spark.scale, {
      x: 1.8,
      y: 1.8,
      duration: 0.35,
      ease: 'power2.out'
    });

    gsap.to(spark.material, {
      opacity: 0,
      duration: 0.35,
      ease: 'power2.out',
      onComplete: () => {
        spark.visible = false;
      }
    });
  }

  /**
   * Maps MIDI note (24..103) to midis2jam2 string index (0..46)
   */
  _midiToStringIndex(midiPitch) {
    let note = Math.max(24, Math.min(103, midiPitch));
    const noteClass = note % 12;

    // Black keys map to the white key below (harp pedal equivalent)
    if (BLACK_KEY_CLASSES.has(noteClass)) {
      note--;
    }

    const diatonicIdx = DIATONIC_INDEX[note % 12] ?? 0;
    const stringIdx = Math.floor((note - 24) / 12) * 7 + diatonicIdx;
    return Math.max(0, Math.min(46, stringIdx));
  }

  onNoteOn(midiPitch, velocity = 0.8) {
    const vel = Math.max(0.2, Math.min(1.0, velocity));
    const stringIdx = this._midiToStringIndex(midiPitch);
    const bestString = this.strings[stringIdx] || this.strings[0];
    if (!bestString) return;

    // 1. String Lateral Oscillation
    gsap.killTweensOf(bestString.mesh.position);
    // In model coordinates (~80 units tall):
    const pluckAmplitude = 0.25 + vel * 0.45;
    const pluckDir = (bestString.index % 2 === 0 ? 1 : -1);

    bestString.mesh.position.x = bestString.restPos.x + pluckAmplitude * pluckDir;

    const decayDuration = THREE.MathUtils.lerp(1.20, 0.30, bestString.index / 46.0);

    gsap.to(bestString.mesh.position, {
      x: bestString.restPos.x,
      duration: decayDuration,
      ease: 'elastic.out(2.4, 0.16)'
    });

    // 2. Pluck Flare Bloom FX
    this._triggerPluckFX(bestString.midPointWorld);

    this.activeNotes.set(midiPitch, {
      string: bestString,
      time: performance.now()
    });
  }

  onNoteOff(midiPitch, force = false) {
    const noteData = this.activeNotes.get(midiPitch);
    if (!noteData) return;

    if (force && noteData.string?.mesh) {
      gsap.killTweensOf(noteData.string.mesh.position);
      noteData.string.mesh.position.copy(noteData.string.restPos);
    }
    this.activeNotes.delete(midiPitch);
  }

  update(delta) {
    // Sustained update loop
  }
}
