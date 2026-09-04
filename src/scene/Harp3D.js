import * as THREE from 'three';
import gsap from 'gsap';

/**
 * Harp3D: Photorealistic Concert Grand Pedal Harp (Salvi / Lyon & Healy Style)
 * - Classical triangular architecture standing on stage deck.
 * - Solid mahogany pedestal with 7 brass modulation pedals and carved brass feet.
 * - Fluted classical column in polished 24k gold leaf with ornate scrolled capital.
 * - Sweeping S-curve harmonic neck (console) with dual brass action plates, tuning pins, and bridge bridge-pins.
 * - Slanted resonant soundbox with fine alpine spruce soundboard, rosewood string strip, and rear acoustic sound holes.
 * - Complete 40-string array with authentic international harp coloration:
 *   * Red strings for all C notes
 *   * Blue/Navy strings for all F notes
 *   * Natural translucent gut / nylon strings for D, E, G, A, B notes
 * - Physical animation: Real-time string plucking displacement with high-frequency elastic oscillation,
 *   golden pluck spark bloom, and soundboard acoustic resonance pulse.
 */
export class Harp3D {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();

    // Default stage position: Stage Left Classical Section (beside strings & piano)
    this.group.position.set(-4.20, 0.0, -0.40);
    // Classical harp playing angle: angled ~24 degrees toward conductor and audience
    this.group.rotation.y = Math.PI * 0.14;

    this.strings = [];
    this.sparkPool = [];
    this.activeNotes = new Map();
    this.resonancePhase = 0;

    this._buildMaterials();
    this._buildPedestal();
    this._buildPillar();
    this._buildHarmonicNeck();
    this._buildSoundbox();
    this._buildStrings();
    this._buildPluckSparkFX();

    this.scene.add(this.group);
  }

  _buildMaterials() {
    // 1. Polished Classical 24k Gold (Pillar, Capital, Crown, Pedals, Action Plates)
    this.goldMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xf6cb62,
      emissive: 0x241804,
      emissiveIntensity: 0.16,
      roughness: 0.12,
      metalness: 0.94,
      clearcoat: 1.0,
      clearcoatRoughness: 0.06
    });

    // 2. High-Gloss Dark Mahogany / French Walnut (Base, Neck Core, Soundbox Rim)
    this.woodMahoganyMaterial = new THREE.MeshStandardMaterial({
      color: 0x3d1d12,
      roughness: 0.28,
      metalness: 0.04
    });

    // 3. Premium Natural Alpine Spruce (Soundboard Tapa Armónica)
    this.spruceSoundboardMaterial = new THREE.MeshStandardMaterial({
      color: 0xf1dfc2,
      roughness: 0.42,
      metalness: 0.02
    });

    // 4. Dark Brazilian Rosewood (String Anchor Center Strip)
    this.rosewoodMaterial = new THREE.MeshStandardMaterial({
      color: 0x22110c,
      roughness: 0.35,
      metalness: 0.05
    });

    // 5. Polished Solid Brass (Tuning Pins, Bridge Pins, Pedals)
    this.brassPinMaterial = new THREE.MeshStandardMaterial({
      color: 0xe8c15a,
      roughness: 0.18,
      metalness: 0.92
    });

    // 6. String Materials (International Harp Color Standards)
    // Red String for C notes
    this.stringRedMaterial = new THREE.MeshStandardMaterial({
      color: 0xd62233,
      emissive: 0x3a080d,
      emissiveIntensity: 0.25,
      roughness: 0.35,
      metalness: 0.20
    });

    // Blue String for F notes
    this.stringBlueMaterial = new THREE.MeshStandardMaterial({
      color: 0x1f5ecc,
      emissive: 0x071b42,
      emissiveIntensity: 0.25,
      roughness: 0.35,
      metalness: 0.20
    });

    // Natural Gut / Nylon for D, E, G, A, B notes
    this.stringNaturalMaterial = new THREE.MeshStandardMaterial({
      color: 0xfdf7eb,
      emissive: 0x221f18,
      emissiveIntensity: 0.12,
      roughness: 0.40,
      metalness: 0.05
    });

    // 7. Pluck Glow Spark Material
    this.pluckGlowMaterial = new THREE.MeshBasicMaterial({
      color: 0xffea88,
      transparent: true,
      opacity: 0.0,
      blending: THREE.AdditiveBlending
    });
  }

  /* ------------------------------------------------------------------ */
  /*  PEDESTAL, PEDALS & FEET                                           */
  /* ------------------------------------------------------------------ */
  _buildPedestal() {
    this.pedestalGroup = new THREE.Group();

    // Main sculpted pedestal base block
    const baseGeom = new THREE.BoxGeometry(0.56, 0.12, 0.82);
    const baseMesh = new THREE.Mesh(baseGeom, this.woodMahoganyMaterial);
    baseMesh.position.set(0, 0.06, 0.05);
    baseMesh.castShadow = true;
    baseMesh.receiveShadow = true;
    this.pedestalGroup.add(baseMesh);

    // Molded decorative base plinth rim
    const plinthGeom = new THREE.BoxGeometry(0.60, 0.04, 0.86);
    const plinthMesh = new THREE.Mesh(plinthGeom, this.goldMaterial);
    plinthMesh.position.set(0, 0.02, 0.05);
    plinthMesh.castShadow = true;
    this.pedestalGroup.add(plinthMesh);

    // 4 Ornate Brass Feet (Lion-paw style scrolled brass pads)
    const footPositions = [
      [-0.24, -0.32],
      [ 0.24, -0.32],
      [-0.24,  0.42],
      [ 0.24,  0.42]
    ];
    footPositions.forEach(([fx, fz]) => {
      const footGeom = new THREE.CylinderGeometry(0.042, 0.055, 0.05, 12);
      const footMesh = new THREE.Mesh(footGeom, this.goldMaterial);
      footMesh.position.set(fx, 0.025, fz);
      footMesh.castShadow = true;
      this.pedestalGroup.add(footMesh);
    });

    // 7 Brass Modulation Foot Pedals (3 on left, 4 on right)
    // Left: D, C, B | Right: E, F, G, A
    const pedalConfigs = [
      { x: -0.16, z: -0.26, angle: -0.22 },
      { x: -0.11, z: -0.28, angle: -0.11 },
      { x: -0.06, z: -0.29, angle:  0.00 },
      { x:  0.06, z: -0.29, angle:  0.00 },
      { x:  0.11, z: -0.28, angle:  0.11 },
      { x:  0.16, z: -0.26, angle:  0.22 },
      { x:  0.21, z: -0.23, angle:  0.33 }
    ];

    pedalConfigs.forEach(p => {
      const pedalLeverGeom = new THREE.BoxGeometry(0.016, 0.018, 0.075);
      const pedalLever = new THREE.Mesh(pedalLeverGeom, this.goldMaterial);
      pedalLever.position.set(p.x, 0.055, p.z);
      pedalLever.rotation.y = p.angle;
      pedalLever.castShadow = true;
      this.pedestalGroup.add(pedalLever);

      const pedalPadGeom = new THREE.CylinderGeometry(0.018, 0.018, 0.012, 10);
      const pedalPad = new THREE.Mesh(pedalPadGeom, this.brassPinMaterial);
      pedalPad.rotation.x = Math.PI / 2;
      pedalPad.position.set(p.x, 0.055, p.z - 0.04);
      this.pedestalGroup.add(pedalPad);
    });

    this.group.add(this.pedestalGroup);
  }

  /* ------------------------------------------------------------------ */
  /*  CLASSICAL PILLAR / COLUMN                                         */
  /* ------------------------------------------------------------------ */
  _buildPillar() {
    this.pillarGroup = new THREE.Group();
    // Pillar stands vertically at the front of the pedestal: Z = 0.42
    this.pillarGroup.position.set(0, 0.12, 0.42);

    // Pillar Base Plinth (Turned gold pedestal ring)
    const baseRingGeom = new THREE.CylinderGeometry(0.075, 0.092, 0.08, 24);
    const baseRing = new THREE.Mesh(baseRingGeom, this.goldMaterial);
    baseRing.position.set(0, 0.04, 0);
    baseRing.castShadow = true;
    this.pillarGroup.add(baseRing);

    // Main Fluted Column Shaft (1.48m tall)
    const shaftGeom = new THREE.CylinderGeometry(0.052, 0.065, 1.48, 24);
    const shaft = new THREE.Mesh(shaftGeom, this.goldMaterial);
    shaft.position.set(0, 0.82, 0);
    shaft.castShadow = true;
    this.pillarGroup.add(shaft);

    // Longitudinal Fluting Accents (12 embossed vertical flutes around column)
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2;
      const r = 0.059;
      const fluteGeom = new THREE.CylinderGeometry(0.004, 0.005, 1.44, 8);
      const flute = new THREE.Mesh(fluteGeom, this.brassPinMaterial);
      flute.position.set(Math.cos(angle) * r, 0.82, Math.sin(angle) * r);
      this.pillarGroup.add(flute);
    }

    // Capital Neck Collar
    const collarGeom = new THREE.CylinderGeometry(0.072, 0.056, 0.06, 24);
    const collar = new THREE.Mesh(collarGeom, this.goldMaterial);
    collar.position.set(0, 1.58, 0);
    this.pillarGroup.add(collar);

    // Ornate Carved Capital with Classical Scrolls
    const capitalCoreGeom = new THREE.CylinderGeometry(0.095, 0.072, 0.14, 20);
    const capitalCore = new THREE.Mesh(capitalCoreGeom, this.goldMaterial);
    capitalCore.position.set(0, 1.68, 0);
    capitalCore.castShadow = true;
    this.pillarGroup.add(capitalCore);

    // Dual Golden Volute Scrolls at Top of Capital
    [-0.075, 0.075].forEach(vx => {
      const scrollGeom = new THREE.TorusGeometry(0.045, 0.016, 12, 20, Math.PI * 1.6);
      const scroll = new THREE.Mesh(scrollGeom, this.goldMaterial);
      scroll.position.set(vx, 1.72, 0);
      scroll.rotation.y = Math.PI / 2;
      this.pillarGroup.add(scroll);
    });

    // Top Crown Medallion
    const crownGeom = new THREE.SphereGeometry(0.055, 16, 12);
    const crown = new THREE.Mesh(crownGeom, this.goldMaterial);
    crown.scale.set(1.0, 1.25, 1.0);
    crown.position.set(0, 1.80, 0);
    this.pillarGroup.add(crown);

    this.group.add(this.pillarGroup);
  }

  /* ------------------------------------------------------------------ */
  /*  HARMONIC CURVE (NECK / CONSOLE)                                   */
  /* ------------------------------------------------------------------ */
  _buildHarmonicNeck() {
    this.neckGroup = new THREE.Group();

    const curvePoints = [];
    const numSegments = 24;
    for (let i = 0; i <= numSegments; i++) {
      const t = i / numSegments;
      const z = THREE.MathUtils.lerp(0.42, -0.32, t);
      const y = 1.80 - 0.28 * t + 0.10 * Math.sin(t * Math.PI * 1.8);
      curvePoints.push(new THREE.Vector3(0, y, z));
    }

    const neckPath = new THREE.CatmullRomCurve3(curvePoints);
    const neckGeom = new THREE.TubeGeometry(neckPath, 32, 0.042, 12, false);
    const neckMesh = new THREE.Mesh(neckGeom, this.woodMahoganyMaterial);
    neckMesh.castShadow = true;
    this.neckGroup.add(neckMesh);

    // Dual Brass Action Plates along both sides of the neck
    [-0.044, 0.044].forEach(px => {
      const plateGeom = new THREE.TubeGeometry(neckPath, 32, 0.014, 8, false);
      const plateMesh = new THREE.Mesh(plateGeom, this.goldMaterial);
      plateMesh.position.x = px;
      plateMesh.scale.set(0.35, 1.0, 1.0);
      plateMesh.castShadow = true;
      this.neckGroup.add(plateMesh);
    });

    this.group.add(this.neckGroup);
  }

  /* ------------------------------------------------------------------ */
  /*  SOUNDBOX (CAJA DE RESONANCIA & TAPA ARMÓNICA)                    */
  /* ------------------------------------------------------------------ */
  _buildSoundbox() {
    this.soundboxGroup = new THREE.Group();

    const sbBottom = new THREE.Vector3(0, 0.12, -0.12);
    const sbTop = new THREE.Vector3(0, 1.52, -0.32);
    const sbDir = new THREE.Vector3().subVectors(sbTop, sbBottom);
    const sbLen = sbDir.length();
    const sbMid = new THREE.Vector3().addVectors(sbBottom, sbTop).multiplyScalar(0.5);

    // Tapered Soundbox Shell: wide at base (0.42m), slim at top (0.13m)
    const shellGeom = new THREE.CylinderGeometry(0.065, 0.22, sbLen, 24, 1, false);
    const shellMesh = new THREE.Mesh(shellGeom, this.woodMahoganyMaterial);
    shellMesh.position.copy(sbMid);
    shellMesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), sbDir.clone().normalize());
    shellMesh.scale.set(1.0, 1.0, 1.35); // Elliptical cross section
    shellMesh.castShadow = true;
    shellMesh.receiveShadow = true;
    this.soundboxGroup.add(shellMesh);

    // Front Flat Soundboard (Tapa Armónica de Abeto)
    const sbBoardGeom = new THREE.BoxGeometry(0.24, sbLen * 0.96, 0.016);
    const sbBoardMesh = new THREE.Mesh(sbBoardGeom, this.spruceSoundboardMaterial);
    sbBoardMesh.position.copy(sbMid);
    sbBoardMesh.quaternion.copy(shellMesh.quaternion);
    sbBoardMesh.position.add(new THREE.Vector3(0, 0.02, 0.12).applyQuaternion(shellMesh.quaternion));
    sbBoardMesh.castShadow = true;
    this.soundboxGroup.add(sbBoardMesh);

    // Center Rosewood String Anchor Strip
    const stripGeom = new THREE.BoxGeometry(0.032, sbLen * 0.94, 0.018);
    const stripMesh = new THREE.Mesh(stripGeom, this.rosewoodMaterial);
    stripMesh.position.copy(sbBoardMesh.position);
    stripMesh.quaternion.copy(sbBoardMesh.quaternion);
    stripMesh.position.add(new THREE.Vector3(0, 0, 0.012).applyQuaternion(shellMesh.quaternion));
    stripMesh.castShadow = true;
    this.soundboxGroup.add(stripMesh);

    // Soundbox Rear Acoustic Sound Holes
    [0.28, 0.52, 0.74].forEach(t => {
      const holePos = new THREE.Vector3().lerpVectors(sbBottom, sbTop, t);
      holePos.add(new THREE.Vector3(0, 0, -0.16).applyQuaternion(shellMesh.quaternion));
      const holeGeom = new THREE.CylinderGeometry(0.028 + t * 0.015, 0.028 + t * 0.015, 0.05, 16);
      const holeMesh = new THREE.Mesh(holeGeom, new THREE.MeshBasicMaterial({ color: 0x0a0502 }));
      holeMesh.rotation.x = Math.PI / 2;
      holeMesh.position.copy(holePos);
      this.soundboxGroup.add(holeMesh);
    });

    this.group.add(this.soundboxGroup);
  }

  /* ------------------------------------------------------------------ */
  /*  AUTHENTIC 40-STRING ARRAY WITH REALISTIC PITCH COLORATION         */
  /* ------------------------------------------------------------------ */
  _buildStrings() {
    this.stringContainer = new THREE.Group();

    const numStrings = 40;
    const baseMidi = 36; // C2

    const sbBottomAnchor = new THREE.Vector3(0, 0.22, -0.06);
    const sbTopAnchor    = new THREE.Vector3(0, 1.44, -0.28);

    const neckRearAnchor  = new THREE.Vector3(0, 1.50, -0.30);
    const neckFrontAnchor = new THREE.Vector3(0, 1.74,  0.36);

    for (let i = 0; i < numStrings; i++) {
      const t = i / (numStrings - 1);
      const midi = baseMidi + Math.round(t * 52);

      const bPos = new THREE.Vector3().lerpVectors(sbBottomAnchor, sbTopAnchor, t);
      const nPos = new THREE.Vector3().lerpVectors(neckRearAnchor, neckFrontAnchor, t);
      nPos.y += Math.sin(t * Math.PI) * 0.12;

      const noteClass = midi % 12;
      let mat = this.stringNaturalMaterial;
      let isC = (noteClass === 0);
      let isF = (noteClass === 5);
      if (isC) mat = this.stringRedMaterial;
      else if (isF) mat = this.stringBlueMaterial;

      const radius = THREE.MathUtils.lerp(0.0028, 0.0009, t);
      const strDir = new THREE.Vector3().subVectors(nPos, bPos);
      const strLen = strDir.length();
      const strMid = new THREE.Vector3().addVectors(bPos, nPos).multiplyScalar(0.5);

      const strGeom = new THREE.CylinderGeometry(radius, radius, strLen, 6);
      const strMesh = new THREE.Mesh(strGeom, mat);
      strMesh.position.copy(strMid);
      strMesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), strDir.clone().normalize());

      // Tuning Pin on neck
      const pinGeom = new THREE.CylinderGeometry(0.0035, 0.0035, 0.045, 8);
      const pinMesh = new THREE.Mesh(pinGeom, this.brassPinMaterial);
      pinMesh.rotation.z = Math.PI / 2;
      pinMesh.position.copy(nPos);
      pinMesh.position.x += 0.038;
      this.stringContainer.add(pinMesh);

      // Soundboard Eyelet
      const eyeletGeom = new THREE.SphereGeometry(0.0042, 8, 6);
      const eyeletMesh = new THREE.Mesh(eyeletGeom, this.brassPinMaterial);
      eyeletMesh.position.copy(bPos);
      this.stringContainer.add(eyeletMesh);

      this.stringContainer.add(strMesh);

      this.strings.push({
        index: i,
        midi,
        mesh: strMesh,
        restPos: strMid.clone(),
        direction: strDir.clone().normalize(),
        length: strLen,
        midPoint: strMid.clone(),
        material: mat,
        isC,
        isF
      });
    }

    this.group.add(this.stringContainer);
  }

  /* ------------------------------------------------------------------ */
  /*  GOLDEN PLUCK FX (Bloom particles on note pluck)                   */
  /* ------------------------------------------------------------------ */
  _buildPluckSparkFX() {
    this.fxGroup = new THREE.Group();
    for (let i = 0; i < 8; i++) {
      const sparkGeom = new THREE.RingGeometry(0.008, 0.042, 16);
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
      duration: 0.38,
      ease: 'power2.out'
    });

    gsap.to(spark.material, {
      opacity: 0,
      duration: 0.38,
      ease: 'power2.out',
      onComplete: () => {
        spark.visible = false;
      }
    });
  }

  /* ------------------------------------------------------------------ */
  /*  NOTE PLAYBACK & STRING PLUCKING PHYSICS                           */
  /* ------------------------------------------------------------------ */
  onNoteOn(midiPitch, velocity = 0.8) {
    const vel = Math.max(0.2, Math.min(1.0, velocity));

    let bestString = this.strings[0];
    let minDiff = 999;
    for (const s of this.strings) {
      const diff = Math.abs(s.midi - midiPitch);
      if (diff < minDiff) {
        minDiff = diff;
        bestString = s;
      }
    }

    if (!bestString) return;

    // 1. Physical String Oscillation
    gsap.killTweensOf(bestString.mesh.position);
    const pluckAmplitude = (0.008 + vel * 0.012);
    const pluckDir = (bestString.index % 2 === 0 ? 1 : -1);

    bestString.mesh.position.x = bestString.restPos.x + pluckAmplitude * pluckDir;

    const decayDuration = THREE.MathUtils.lerp(1.1, 0.35, bestString.index / this.strings.length);

    gsap.to(bestString.mesh.position, {
      x: bestString.restPos.x,
      duration: decayDuration,
      ease: 'elastic.out(1.8, 0.22)'
    });

    // 2. Visual Pluck Bloom Glow
    this._triggerPluckFX(bestString.midPoint);

    // 3. Soundbox resonance pulse
    if (this.soundboxGroup) {
      gsap.killTweensOf(this.soundboxGroup.scale);
      this.soundboxGroup.scale.set(1.012, 1.0, 1.012);
      gsap.to(this.soundboxGroup.scale, {
        x: 1.0,
        y: 1.0,
        z: 1.0,
        duration: 0.32,
        ease: 'power2.out'
      });
    }

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
    if (!this.group.visible) return;
    this.resonancePhase += delta * 1.5;
  }
}
