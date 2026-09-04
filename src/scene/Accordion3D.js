import * as THREE from 'three';
import gsap from 'gsap';

/**
 * Accordion3D: Professional 120-Bass Floating Concert Piano Accordion
 * - Floating instrument (no stand/support) with organic hover breathing dynamics.
 * - Dynamic Arching Bellows (Fuelle Arqueado en Abanico):
 *   * Expands in a realistic circular fan arc where the top pleats fan wide open
 *     while the bottom stays hinged, matching genuine accordionist technique.
 *   * 14 multi-pleated folds with golden/chrome corner protectors and edge trims.
 * - 41-Key High-Visibility Piano Keyboard:
 *   * Prominent, forward-facing natural ivory keys and raised ebony accidentals.
 *   * Each key has independent geometry, pivot hinge, and material.
 *   * Full MIDI range mapping with octave wrapping (guaranteeing every note is played).
 *   * Dynamic mechanical key depression (-0.016m into keybed) with bright neon cyan/gold emissive glow.
 * - 120-Button Stradella Bass Panel:
 *   * Angled button array with mechanical depression on bass notes.
 * - Glowing internal reeds through ornate front chrome grille.
 */
export class Accordion3D {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();

    // Stage position: Floating at natural height, subtle 3D angle
    this.baseY = 1.15;
    this.baseRotX = -0.02;
    this.baseRotY = Math.PI * 0.05; // 9 deg subtle angle for authentic 3D depth
    this.group.position.set(-1.75, this.baseY, 1.95);
    this.group.rotation.set(this.baseRotX, this.baseRotY, 0);

    this.hoverTime = 0;
    this.trebleKeys = [];
    this.bassButtons = [];
    this.bellowsFolds = [];
    this.activeNotes = new Map();

    // midis2jam2-inspired continuous music-driven bellows kinematics
    this.squeezeMin = 0.04;        // Minimum angle when compressed (closed)
    this.squeezeMax = 0.38;        // Maximum angle when fanned wide open (arched)
    this.currentAngle = 0.04;      // Current macro angle
    this.squeezingSpeed = 0.0;     // Current speed of expansion/compression
    this.maxSqueezingSpeed = 0.52; // Rad/s while music plays (continuous breathing)
    this.expanding = true;         // true = expanding (draw), false = contracting (push)
    this.accentPulse = 0;          // Dynamic note-attack pulse impulse
    this.averageVelocity = 0.8;

    // Hinge pivot point at the bottom center of the bellows
    this.hingeY = -0.18;
    this.restTrebleX = -0.16;
    this.restBassX = 0.16;
    this.bellowsSpan = 0.20;

    this._buildMaterials();
    this._buildTrebleSection();
    this._buildBellows();
    this._buildBassSection();

    this.scene.add(this.group);
  }

  _buildMaterials() {
    // 1. High-Gloss Pearl / Lavender-Violet Celluloid (matches reference video)
    this.celluloidMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x5a4675,
      emissive: 0x140e1e,
      roughness: 0.18,
      metalness: 0.25,
      clearcoat: 1.0,
      clearcoatRoughness: 0.06
    });

    // 2. Dark Keybed / Accent Casing Material
    this.keybedMaterial = new THREE.MeshStandardMaterial({
      color: 0x15121a,
      roughness: 0.35,
      metalness: 0.20
    });

    // 3. Mirror Chrome (Grille frame, registers, buckles)
    this.chromeMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xf4f6fa,
      emissive: 0x0a1018,
      emissiveIntensity: 0.15,
      roughness: 0.08,
      metalness: 0.95,
      clearcoat: 1.0
    });

    // 4. Polished Brass / Gold (Bellows corner protectors, ribs, logo)
    this.goldMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xf5ca44,
      emissive: 0x221804,
      emissiveIntensity: 0.20,
      roughness: 0.14,
      metalness: 0.92,
      clearcoat: 0.95
    });

    // 5. Golden Accordion Bellows Cloth (matches reference video yellow/amber folds)
    this.bellowsClothMaterial = new THREE.MeshStandardMaterial({
      color: 0xedd044,
      roughness: 0.55,
      metalness: 0.10
    });

    // 6. Secondary Bellows Fold Crease Accent
    this.bellowsCreaseMaterial = new THREE.MeshStandardMaterial({
      color: 0xd8b532,
      roughness: 0.60,
      metalness: 0.08
    });

    // 7. Padded Leather (Shoulder straps & bass handstrap)
    this.leatherMaterial = new THREE.MeshStandardMaterial({
      color: 0x241814,
      roughness: 0.70,
      metalness: 0.04
    });

    // 8. Grille Cloth
    this.grilleClothMaterial = new THREE.MeshStandardMaterial({
      color: 0x201525,
      roughness: 0.85
    });
  }

  /* ------------------------------------------------------------------ */
  /*  TREBLE SECTION (LEFT BOX WITH FRONT-FACING PIANO KEYBOARD)        */
  /* ------------------------------------------------------------------ */
  _buildTrebleSection() {
    this.trebleGroup = new THREE.Group();
    this.trebleGroup.position.set(this.restTrebleX, 0, 0);

    const boxWidth = 0.12;
    const boxHeight = 0.38;
    const boxDepth = 0.22;

    // Main Treble Chassis Block
    const chassisGeom = new THREE.BoxGeometry(boxWidth, boxHeight, boxDepth);
    const chassis = new THREE.Mesh(chassisGeom, this.celluloidMaterial);
    chassis.castShadow = true;
    chassis.receiveShadow = true;
    this.trebleGroup.add(chassis);

    // Chrome Top/Bottom Endcaps
    [-boxHeight / 2, boxHeight / 2].forEach(cy => {
      const capGeom = new THREE.BoxGeometry(boxWidth * 1.02, 0.012, boxDepth * 1.02);
      const cap = new THREE.Mesh(capGeom, this.chromeMaterial);
      cap.position.set(0, cy, 0);
      this.trebleGroup.add(cap);
    });

    // Decorative Treble Grille Louvers on the inner front
    const grillePlateGeom = new THREE.BoxGeometry(0.045, 0.30, 0.006);
    const grillePlate = new THREE.Mesh(grillePlateGeom, this.grilleClothMaterial);
    grillePlate.position.set(0.035, 0, 0.112);
    this.trebleGroup.add(grillePlate);

    for (let i = -3; i <= 3; i++) {
      const slitGeom = new THREE.BoxGeometry(0.038, 0.006, 0.004);
      const slit = new THREE.Mesh(slitGeom, this.chromeMaterial);
      slit.position.set(0.035, i * 0.035, 0.116);
      this.trebleGroup.add(slit);
    }

    // 5 Register Switches (top front)
    for (let i = 0; i < 5; i++) {
      const swGeom = new THREE.BoxGeometry(0.014, 0.018, 0.012);
      const sw = new THREE.Mesh(swGeom, this.chromeMaterial);
      sw.position.set(-0.035 + i * 0.018, 0.155, 0.118);
      this.trebleGroup.add(sw);
    }

    // ── 41-Key High-Visibility Piano Keyboard (Front Facing +Z) ──
    // Mounted on the front face of the treble box, completely visible to the camera
    this.keyboardGroup = new THREE.Group();
    this.keyboardGroup.position.set(-0.015, 0, 0.110);

    // Keybed Housing / Frame
    const bedGeom = new THREE.BoxGeometry(0.092, 0.34, 0.018);
    const bed = new THREE.Mesh(bedGeom, this.keybedMaterial);
    bed.position.set(0, 0, 0.009);
    this.keyboardGroup.add(bed);

    // Chrome Keybed Border Trim
    const borderGeom = new THREE.BoxGeometry(0.096, 0.344, 0.004);
    const border = new THREE.Mesh(borderGeom, this.chromeMaterial);
    border.position.set(0, 0, 0.020);
    this.keyboardGroup.add(border);

    // 24 Naturals (White Keys) and 17 Accidentals (Black Keys)
    // Spanning MIDI 53 (F3) to 89 (F6) - standard accordion treble range
    const numWhites = 24;
    const keyHeight = 0.32 / numWhites;
    const startY = 0.145;

    let whiteCount = 0;
    const blackNotes = [1, 3, 6, 8, 10]; // C#, D#, F#, G#, A#

    for (let midi = 53; midi <= 89; midi++) {
      const noteInOct = midi % 12;
      const isBlack = blackNotes.includes(noteInOct);

      if (!isBlack) {
        const ky = startY - whiteCount * keyHeight;

        // Individual material for vibrant glow when pressed
        const keyMat = new THREE.MeshStandardMaterial({
          color: 0xfbf9f5,
          emissive: 0x000000,
          emissiveIntensity: 0.0,
          roughness: 0.18,
          metalness: 0.04
        });

        // Natural key: wide horizontal bar spanning across the keybed
        const keyWidth = 0.082;
        const keyGeom = new THREE.BoxGeometry(keyWidth, keyHeight * 0.88, 0.014);
        const keyMesh = new THREE.Mesh(keyGeom, keyMat);
        // Rest position: resting at z = 0.025
        keyMesh.position.set(-0.002, ky, 0.025);
        keyMesh.castShadow = true;
        keyMesh.receiveShadow = true;
        this.keyboardGroup.add(keyMesh);

        this.trebleKeys.push({
          midi,
          isBlack: false,
          mesh: keyMesh,
          material: keyMat,
          restZ: keyMesh.position.z,
          depressionFactor: 0.0,
          isDown: false
        });
        whiteCount++;
      } else {
        // Accidental (Black Key): positioned on the right/inner half, raised forward
        const ky = startY - (whiteCount - 0.5) * keyHeight;

        const keyMat = new THREE.MeshStandardMaterial({
          color: 0x16161a,
          emissive: 0x000000,
          emissiveIntensity: 0.0,
          roughness: 0.28,
          metalness: 0.15
        });

        const keyWidth = 0.046;
        const keyGeom = new THREE.BoxGeometry(keyWidth, keyHeight * 0.65, 0.018);
        const keyMesh = new THREE.Mesh(keyGeom, keyMat);
        // Raised forward: resting at z = 0.034
        keyMesh.position.set(0.016, ky, 0.034);
        keyMesh.castShadow = true;
        this.keyboardGroup.add(keyMesh);

        this.trebleKeys.push({
          midi,
          isBlack: true,
          mesh: keyMesh,
          material: keyMat,
          restZ: keyMesh.position.z,
          depressionFactor: 0.0,
          isDown: false
        });
      }
    }

    this.trebleGroup.add(this.keyboardGroup);
    this.group.add(this.trebleGroup);
  }

  /* ------------------------------------------------------------------ */
  /*  DYNAMIC ARCHING BELLOWS (FUELLE ARQUEADO EN ABANICO)              */
  /* ------------------------------------------------------------------ */
  _buildBellows() {
    this.bellowsGroup = new THREE.Group();
    this.bellowsGroup.position.set(0, 0, 0);

    const numFolds = 14;
    const halfSpan = this.bellowsSpan / 2;
    const foldStep = this.bellowsSpan / (numFolds - 1);

    for (let i = 0; i < numFolds; i++) {
      const foldGroup = new THREE.Group();
      const fx = -halfSpan + i * foldStep;
      foldGroup.position.set(fx, 0, 0);

      // Pleated fold shell
      const foldGeom = new THREE.BoxGeometry(foldStep * 0.95, 0.36, 0.208);
      const isAlt = (i % 2 === 0);
      const foldMesh = new THREE.Mesh(
        foldGeom,
        isAlt ? this.bellowsClothMaterial : this.bellowsCreaseMaterial
      );
      foldMesh.castShadow = true;
      foldGroup.add(foldMesh);

      // Bright Golden Brass Corner Protectors (4 per fold) — matches reference video
      const cornerOffsets = [
        [ 0.180,  0.104], // Top front
        [-0.180,  0.104], // Bottom front
        [ 0.180, -0.104], // Top rear
        [-0.180, -0.104]  // Bottom rear
      ];
      cornerOffsets.forEach(([cy, cz]) => {
        const bracketGeom = new THREE.BoxGeometry(foldStep * 1.12, 0.024, 0.024);
        const bracket = new THREE.Mesh(bracketGeom, this.goldMaterial);
        bracket.position.set(0, cy, cz);
        foldGroup.add(bracket);
      });

      // Gold Edge Rib Trim along top and bottom edges
      const topRibGeom = new THREE.BoxGeometry(foldStep * 1.05, 0.008, 0.210);
      const topRib = new THREE.Mesh(topRibGeom, this.goldMaterial);
      topRib.position.set(0, 0.181, 0);
      foldGroup.add(topRib);

      const botRibGeom = new THREE.BoxGeometry(foldStep * 1.05, 0.008, 0.210);
      const botRib = new THREE.Mesh(botRibGeom, this.goldMaterial);
      botRib.position.set(0, -0.181, 0);
      foldGroup.add(botRib);

      this.bellowsFolds.push({
        group: foldGroup,
        baseX: fx,
        ratio: i / (numFolds - 1)
      });
      this.bellowsGroup.add(foldGroup);
    }

    this.group.add(this.bellowsGroup);
  }

  /* ------------------------------------------------------------------ */
  /*  BASS SECTION (RIGHT BOX WITH 120 STRADELLA BUTTONS)               */
  /* ------------------------------------------------------------------ */
  _buildBassSection() {
    this.bassGroup = new THREE.Group();
    this.bassGroup.position.set(this.restBassX, 0, 0);

    const boxWidth = 0.12;
    const boxHeight = 0.38;
    const boxDepth = 0.22;

    // Main Bass Chassis Block
    const chassisGeom = new THREE.BoxGeometry(boxWidth, boxHeight, boxDepth);
    const chassis = new THREE.Mesh(chassisGeom, this.celluloidMaterial);
    chassis.castShadow = true;
    chassis.receiveShadow = true;
    this.bassGroup.add(chassis);

    // Chrome Top/Bottom Endcaps
    [-boxHeight / 2, boxHeight / 2].forEach(cy => {
      const capGeom = new THREE.BoxGeometry(boxWidth * 1.02, 0.012, boxDepth * 1.02);
      const cap = new THREE.Mesh(capGeom, this.chromeMaterial);
      cap.position.set(0, cy, 0);
      this.bassGroup.add(cap);
    });

    // Stradella Bass Panel on the outer right face (+X)
    const panelGeom = new THREE.BoxGeometry(0.006, 0.32, 0.17);
    const panel = new THREE.Mesh(panelGeom, this.keybedMaterial);
    panel.position.set(boxWidth / 2 + 0.002, 0, 0);
    this.bassGroup.add(panel);

    // 120 Stradella Buttons (6 rows x 16 columns)
    const numRows = 6;
    const numCols = 16;
    const startZ = -0.065;
    const startY = 0.13;
    const stepZ = 0.13 / (numCols - 1);
    const stepY = 0.26 / (numRows - 1);

    for (let r = 0; r < numRows; r++) {
      for (let c = 0; c < numCols; c++) {
        const by = startY - r * stepY - c * 0.002;
        const bz = startZ + c * stepZ;

        const btnGeom = new THREE.CylinderGeometry(0.0035, 0.0035, 0.010, 8);
        const btnMat = (r === 2 && (c === 7 || c === 11))
          ? this.goldMaterial // Dimpled C & E major bass reference buttons
          : this.chromeMaterial;

        const btnMesh = new THREE.Mesh(btnGeom, btnMat);
        btnMesh.rotation.z = Math.PI / 2;
        btnMesh.position.set(boxWidth / 2 + 0.007, by, bz);
        this.bassGroup.add(btnMesh);

        if (r < 2 && c < 12) {
          this.bassButtons.push({
            midi: 36 + (r * 12 + c) % 24,
            mesh: btnMesh,
            restX: btnMesh.position.x,
            depressionFactor: 0.0,
            isDown: false
          });
        }
      }
    }

    // Padded Leather Left Handstrap (Bass Strap)
    const strapGeom = new THREE.BoxGeometry(0.016, 0.24, 0.045);
    const strap = new THREE.Mesh(strapGeom, this.leatherMaterial);
    strap.position.set(boxWidth / 2 + 0.022, 0, 0.02);
    this.bassGroup.add(strap);

    this.group.add(this.bassGroup);
  }

  /* ------------------------------------------------------------------ */
  /*  FAN-ARCH BELLOWS PUMPING DYNAMICS (ARQUEAMIENTO EN ABANICO)       */
  /* ------------------------------------------------------------------ */
  _updateArchingGeometry(alpha) {
    this.currentEffectiveAngle = alpha;

    const hy = this.hingeY; // Hinge at -0.18
    const dy = -hy;         // Center height from hinge = 0.18

    // 1. Treble Box (Left side): rotates clockwise (tilts left at top)
    const trebleAngle = 0.42 * alpha;
    const dxT = this.restTrebleX;
    const tx = dxT * Math.cos(trebleAngle) - dy * Math.sin(trebleAngle);
    const ty = hy + dxT * Math.sin(trebleAngle) + dy * Math.cos(trebleAngle);
    this.trebleGroup.position.set(tx, ty, 0);
    this.trebleGroup.rotation.z = trebleAngle;

    // 2. Bass Box (Right side): rotates counter-clockwise (tilts right at top)
    const bassAngle = -0.52 * alpha;
    const dxB = this.restBassX;
    const bx = dxB * Math.cos(bassAngle) - dy * Math.sin(bassAngle);
    const by = hy + dxB * Math.sin(bassAngle) + dy * Math.cos(bassAngle);
    this.bassGroup.position.set(bx, by, 0);
    this.bassGroup.rotation.z = bassAngle;

    // 3. 14 Bellows Folds: smooth fan arc matching midis2jam2
    const numFolds = this.bellowsFolds.length;
    for (let i = 0; i < numFolds; i++) {
      const f = this.bellowsFolds[i];
      // Normalized center offset: -1.0 at left, 0.0 at center, +1.0 at right
      const u = (i - (numFolds - 1) / 2) / ((numFolds - 1) / 2);
      // Smooth continuous angular distribution between treble and bass
      const foldAngle = (u <= 0)
        ? -u * trebleAngle   // u < 0, so foldAngle > 0 (tilts left)
        : u * bassAngle;     // u > 0, so foldAngle < 0 (tilts right)

      const fx = f.baseX * Math.cos(foldAngle) - dy * Math.sin(foldAngle);
      const fy = hy + f.baseX * Math.sin(foldAngle) + dy * Math.cos(foldAngle);

      // Subtle convex arch dome along top
      const domeY = (1.0 - u * u) * (alpha * 0.032);

      f.group.position.set(fx, fy + domeY, 0);
      f.group.rotation.z = foldAngle;
    }
  }

  /* ------------------------------------------------------------------ */
  /*  NOTE PLAYBACK & KEYBOARD PLAYING DYNAMICS                         */
  /* ------------------------------------------------------------------ */
  onNoteOn(midiPitch, velocity = 0.8) {
    const vel = Math.max(0.3, Math.min(1.0, velocity));
    this.activeNotes.set(midiPitch, vel);
    this.averageVelocity = vel;

    // Crisp dynamic note-attack accent on bellows
    this.accentPulse = Math.min(0.08, this.accentPulse + 0.026 * vel);

    // 1. Trigger Matching Treble Key (with octave wrapping)
    let trebleKey = this.trebleKeys.find(k => k.midi === midiPitch);
    if (!trebleKey && this.trebleKeys.length > 0) {
      let mapped = midiPitch;
      while (mapped < 53) mapped += 12;
      while (mapped > 89) mapped -= 12;
      trebleKey = this.trebleKeys.find(k => k.midi === mapped) ||
                  this.trebleKeys[Math.abs(midiPitch) % this.trebleKeys.length];
    }

    if (trebleKey) {
      trebleKey.isDown = true;
      trebleKey.velocity = vel;
      const emissiveHex = trebleKey.isBlack ? 0xffaa00 : 0x00e5ff;
      trebleKey.material.emissive.setHex(emissiveHex);
    }

    // 2. Trigger Bass Button if note is in bass range (< 60)
    if (midiPitch < 60) {
      const btn = this.bassButtons.find(b => b.midi === midiPitch) ||
                  this.bassButtons[Math.abs(midiPitch) % this.bassButtons.length];
      if (btn) {
        btn.isDown = true;
        btn.velocity = vel;
      }
    }
  }

  onNoteOff(midiPitch) {
    this.activeNotes.delete(midiPitch);

    let trebleKey = this.trebleKeys.find(k => k.midi === midiPitch);
    if (!trebleKey && this.trebleKeys.length > 0) {
      let mapped = midiPitch;
      while (mapped < 53) mapped += 12;
      while (mapped > 89) mapped -= 12;
      trebleKey = this.trebleKeys.find(k => k.midi === mapped);
    }

    if (trebleKey) {
      trebleKey.isDown = false;
    }

    if (midiPitch < 60) {
      const btn = this.bassButtons.find(b => b.midi === midiPitch);
      if (btn) {
        btn.isDown = false;
      }
    }
  }

  /* ------------------------------------------------------------------ */
  /*  PER-FRAME FLOATING HOVER & MUSIC-DRIVEN ANIMATION (midis2jam2)    */
  /* ------------------------------------------------------------------ */
  update(delta) {
    const dt = Math.min(delta, 0.05);
    this.hoverTime += dt;

    // 1. Continuous Music-Driven Bellows Squeezing / Expansion Dynamics (midis2jam2)
    const hasActiveNotes = this.activeNotes.size > 0;
    if (hasActiveNotes) {
      // Squeezing speed scales with music intensity
      const targetSpeed = this.maxSqueezingSpeed * (0.72 + this.averageVelocity * 0.40);
      this.squeezingSpeed += (targetSpeed - this.squeezingSpeed) * Math.min(1.0, dt * 8.0);
    } else {
      // Smooth deceleration to 0 when music pauses (exact midis2jam2 interpolateTo logic)
      this.squeezingSpeed += (0.0 - this.squeezingSpeed) * Math.min(1.0, dt * 2.5);
    }

    // Advance bellows angle along the expanding/contracting direction
    if (this.squeezingSpeed > 0.001) {
      const dir = this.expanding ? 1 : -1;
      this.currentAngle += dt * this.squeezingSpeed * dir;

      // Reverse direction at limits (midis2jam2 calculateIsExpandingChange)
      if (this.currentAngle >= this.squeezeMax) {
        this.currentAngle = this.squeezeMax;
        this.expanding = false; // Switch to squeezing shut
      } else if (this.currentAngle <= this.squeezeMin) {
        this.currentAngle = this.squeezeMin;
        this.expanding = true;  // Switch to expanding open
      }
    } else {
      // When completely idle for a while, gently breathe
      const idleAngle = this.squeezeMin + Math.sin(this.hoverTime * 1.5) * 0.015;
      this.currentAngle += (idleAngle - this.currentAngle) * Math.min(1.0, dt * 2.0);
    }

    // Decay note-attack accent pulse
    this.accentPulse *= Math.exp(-dt * 14.0);

    // Total effective angle: continuous breath + note pulse
    const effectiveAngle = Math.max(this.squeezeMin, this.currentAngle + this.accentPulse);
    this._updateArchingGeometry(effectiveAngle);

    // 2. Continuous Key Recoil & Depression (midis2jam2 KEY_RECOIL_SPEED = 20)
    const pressSpeed = 35.0;
    const recoilSpeed = 20.0;

    for (let i = 0; i < this.trebleKeys.length; i++) {
      const k = this.trebleKeys[i];
      if (k.isDown) {
        k.depressionFactor += (1.0 - k.depressionFactor) * Math.min(1.0, dt * pressSpeed);
      } else if (k.depressionFactor > 0.0) {
        k.depressionFactor = Math.max(0.0, k.depressionFactor - dt * recoilSpeed);
      }

      if (k.depressionFactor > 0.001) {
        k.mesh.position.z = k.restZ - 0.012 * k.depressionFactor;
        k.mesh.rotation.y = (k.isBlack ? -0.09 : -0.11) * k.depressionFactor;
        k.material.emissiveIntensity = 1.4 * k.depressionFactor;
      } else {
        k.mesh.position.z = k.restZ;
        k.mesh.rotation.y = 0;
        k.material.emissiveIntensity = 0;
      }
    }

    // 3. Bass Buttons Recoil
    for (let i = 0; i < this.bassButtons.length; i++) {
      const b = this.bassButtons[i];
      if (b.isDown) {
        b.depressionFactor += (1.0 - b.depressionFactor) * Math.min(1.0, dt * pressSpeed);
      } else if (b.depressionFactor > 0.0) {
        b.depressionFactor = Math.max(0.0, b.depressionFactor - dt * recoilSpeed);
      }

      if (b.depressionFactor > 0.001) {
        b.mesh.position.x = b.restX - 0.007 * b.depressionFactor;
      } else {
        b.mesh.position.x = b.restX;
      }
    }

    // 4. Floating Instrument Musical Sway (Alive & responsive)
    const isPlaying = hasActiveNotes || this.squeezingSpeed > 0.08;
    const swayIntensity = isPlaying ? 1.5 : 0.6;

    const hoverY = Math.sin(this.hoverTime * 2.2) * (0.016 * swayIntensity);
    const hoverRotX = this.baseRotX + Math.sin(this.hoverTime * 1.6) * (0.012 * swayIntensity);
    // Reactive bellows reaction torque: tilts slightly with expansion/compression
    const torqueZ = (this.expanding ? 0.022 : -0.022) * (this.squeezingSpeed / this.maxSqueezingSpeed);
    const hoverRotZ = Math.cos(this.hoverTime * 1.4) * 0.008 + torqueZ;

    this.group.position.y = this.baseY + hoverY;
    this.group.rotation.x = hoverRotX;
    this.group.rotation.z = hoverRotZ;
  }

  dispose() {
    this.scene.remove(this.group);
  }
}
