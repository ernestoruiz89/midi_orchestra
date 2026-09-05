import * as THREE from 'three';
import gsap from 'gsap';

/**
 * Guitar3D: Multi-Instance Concert Electric Guitar matching MIDIJam:
 * - Positioned sideways in playing orientation (held across the body, neck angled up-right).
 * - Correct string order: Low E (grave/gruesa) on TOP, High E (fina/aguda) on BOTTOM.
 * - Slim, perfectly contoured neck with dark Indian Rosewood fretboard and natural maple back.
 * - Multi-track stacking: supports up to 4 guitars staggered diagonally across stage right.
 * - Colors matching MIDIJam: 1: Sky Blue, 2: Candy Red, 3: Olympic White, 4: Royal Blue.
 * - Dynamic vibrating strings with real-time acoustic wave harmonics.
 * - Luminous yellow/amber fretboard LED finger markers on note-on.
 * - Responsive floating 3D plectrum (púa) with alternate-picking animation.
 */
export class Guitar3D {
  constructor(scene, options = {}) {
    this.scene = scene;
    this.index = options.index || 1; // 1, 2, 3, 4
    this.group = new THREE.Group();

    this.strings = [];
    this.fretYPositions = [];
    this.fretMarkers = [];
    // Strings 0 to 5: Low E (grave) on TOP to High E (fina) on BOTTOM
    this.stringTuningMidi = [40, 45, 50, 55, 59, 64]; // E2, A2, D3, G3, B3, E4

    this._buildMaterials();

    // Container for all guitar meshes in playing position
    this.guitarModel = new THREE.Group();

    this._buildGuitarBody();
    this._buildNeckAndHeadstock();
    this._buildPickguardAndHardware();
    this._buildFretMarkers();
    this._buildStrings();
    this._buildFloatingPlectrum();

    // Rotate into authentic MIDIJam playing angle:
    // Neck points to the right (+X) inclined upwards by ~14°,
    // Upper horn is on TOP, lower horn is on BOTTOM,
    // Front face presents its full voluptuous curves directly to the camera
    this.guitarModel.position.set(0.24, 0.10, 0);
    this.guitarModel.rotation.set(-0.08, 0.08, -1.35);
    this.group.add(this.guitarModel);
    this._buildGuitarStand();

    this.scene.add(this.group);
  }

  _buildMaterials() {
    // 4 Stratocaster Colors matching MIDIJam:
    // 1: Sky / Sonic Blue (#4aa3df)
    // 2: Classic Candy Apple Red (#d11c1c)
    // 3: Vintage Olympic White (#f0ede4)
    // 4: Deep Royal / Lake Placid Blue (#1035a0)
    const guitarColors = {
      1: 0x4aa3df,
      2: 0xd11c1c,
      3: 0xf0ede4,
      4: 0x1035a0
    };
    const bodyColor = guitarColors[this.index] || 0x4aa3df;

    this.bodyMaterial = new THREE.MeshStandardMaterial({
      color: bodyColor,
      roughness: 0.35,
      metalness: 0.08
    });

    // 3-Ply White Pickguard (Classic Fender Parchment/White)
    this.pickguardMaterial = new THREE.MeshStandardMaterial({
      color: 0xf8f8f6,
      roughness: 0.25,
      metalness: 0.02
    });

    // Aged Cream Pickup Covers & Knobs
    this.creamPlasticMaterial = new THREE.MeshStandardMaterial({
      color: 0xfbf6ea,
      roughness: 0.35,
      metalness: 0.02
    });

    // Mirror Polished Chrome
    this.chromeMaterial = new THREE.MeshStandardMaterial({
      color: 0xfbfbfb,
      roughness: 0.08,
      metalness: 0.95
    });

    // Natural Canadian Hard Rock Maple Neck Back & Headstock
    this.mapleNeckMaterial = new THREE.MeshStandardMaterial({
      color: 0xd6b782,
      roughness: 0.55,
      metalness: 0.0
    });

    // Dark Indian Rosewood Fretboard Slab (Matte deep chocolate tone with no glare)
    this.rosewoodMaterial = new THREE.MeshStandardMaterial({
      color: 0x381f12,
      roughness: 0.88,
      metalness: 0.0
    });

    // Pearloid Inlay Dots
    this.pearlMaterial = new THREE.MeshStandardMaterial({
      color: 0xfbf9f5,
      roughness: 0.20,
      metalness: 0.15
    });

    // Tortoise Shell Floating Plectrum (Púa)
    this.pickMaterial = new THREE.MeshStandardMaterial({
      color: 0xb33010,
      roughness: 0.25,
      metalness: 0.1
    });

    this.standPaddingMaterial = new THREE.MeshStandardMaterial({
      color: 0x0c0d0f,
      roughness: 0.82,
      metalness: 0.02
    });
  }

  _buildGuitarStand() {
    const stand = new THREE.Group();

    // A compact weighted disc avoids the visual tangle produced by several
    // overlapping tripod legs when electric guitars share the same section.
    const base = new THREE.Mesh(
      new THREE.CylinderGeometry(0.14, 0.16, 0.04, 32),
      this.standPaddingMaterial
    );
    base.position.y = 0.02;
    base.castShadow = true;
    base.receiveShadow = true;
    stand.add(base);

    const mast = new THREE.Mesh(
      new THREE.CylinderGeometry(0.014, 0.017, 1, 12),
      this.chromeMaterial
    );
    mast.castShadow = true;
    stand.add(mast);

    const cradle = new THREE.Group();
    // Tilting the yoke downward to the right (-0.32 rad) mirrors the lower bout's
    // descent in playing pose so both padded arms securely support the body.
    cradle.rotation.z = -0.32;
    const cradleBar = new THREE.Mesh(
      new THREE.CylinderGeometry(0.012, 0.012, 0.32, 10),
      this.chromeMaterial
    );
    cradleBar.rotation.z = Math.PI / 2;
    cradleBar.position.z = -0.055;
    cradle.add(cradleBar);

    [-0.14, 0.14].forEach((x) => {
      const paddedArm = new THREE.Mesh(
        new THREE.CylinderGeometry(0.018, 0.018, 0.16, 12),
        this.standPaddingMaterial
      );
      paddedArm.rotation.x = Math.PI / 2;
      paddedArm.position.set(x, 0.025, 0.015);
      cradle.add(paddedArm);

      const stop = new THREE.Mesh(
        new THREE.SphereGeometry(0.024, 12, 8),
        this.standPaddingMaterial
      );
      stop.scale.set(0.8, 1.15, 0.8);
      stop.position.set(x, 0.025, 0.095);
      cradle.add(stop);
    });

    stand.add(cradle);
    this.standGroup = stand;
    this.standMast = mast;
    this.standCradle = cradle;
    this.group.add(stand);
    this._syncGuitarStand();
  }

  _syncGuitarStand() {
    if (!this.standGroup) return;

    const floorY = 0.04;
    const cradleY = Math.max(0.42, this.group.position.y - 0.035);
    const mastHeight = cradleY - floorY;

    // Cancel the instrument's changing vertical placement so the feet remain
    // at world y=0 while the cradle follows the lower edge of the guitar.
    this.standGroup.position.y = -this.group.position.y;
    this.standMast.scale.y = mastHeight;
    this.standMast.position.set(0, floorY + mastHeight * 0.5, -0.055);
    this.standCradle.position.y = cradleY;
  }

  _buildGuitarBody() {
    const shape = new THREE.Shape();
    // Start at bottom strap pin
    shape.moveTo(0, -0.32);

    // 1. Treble lower bout (wide, rounded, voluptuous)
    shape.bezierCurveTo(0.09, -0.32, 0.165, -0.27, 0.165, -0.19);
    // 2. Treble waist (graceful inward dip)
    shape.bezierCurveTo(0.165, -0.12, 0.135, -0.07, 0.118, -0.03);
    // 3. Treble cutaway horn (reaches y = 0.08, x = 0.125)
    shape.bezierCurveTo(0.110, 0.01, 0.125, 0.05, 0.125, 0.08);
    // Treble horn tip rounded
    shape.bezierCurveTo(0.125, 0.095, 0.108, 0.095, 0.095, 0.075);
    // Deep treble cutaway scoop into neck pocket
    shape.bezierCurveTo(0.078, 0.045, 0.055, 0.022, 0.028, 0.015);

    // 4. Neck pocket edge
    shape.lineTo(-0.028, 0.015);

    // 5. Bass cutaway scoop into upper horn
    shape.bezierCurveTo(-0.055, 0.022, -0.075, 0.060, -0.100, 0.110);
    // Upper bass horn: graceful flare and tip reaching y = 0.175, x = -0.148
    shape.bezierCurveTo(-0.118, 0.145, -0.140, 0.178, -0.148, 0.175);
    // Upper horn tip rounded
    shape.bezierCurveTo(-0.155, 0.170, -0.155, 0.145, -0.145, 0.115);
    // Upper horn outer flank sloping toward waist
    shape.bezierCurveTo(-0.135, 0.065, -0.125, 0.015, -0.120, -0.03);

    // 6. Bass waist (deep, sensual curve)
    shape.bezierCurveTo(-0.118, -0.07, -0.135, -0.12, -0.165, -0.19);

    // 7. Bass lower bout (wide, voluptuous curve)
    shape.bezierCurveTo(-0.175, -0.27, -0.09, -0.32, 0, -0.32);

    const extrudeSettings = {
      depth: 0.028,
      bevelEnabled: true,
      bevelSegments: 4,
      steps: 1,
      bevelSize: 0.008,
      bevelThickness: 0.008
    };

    const bodyGeom = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    const bodyMesh = new THREE.Mesh(bodyGeom, this.bodyMaterial);
    bodyMesh.castShadow = true;
    bodyMesh.receiveShadow = true;
    // Front face sits exactly at z = 0.000, back face at z = -0.044
    bodyMesh.position.set(0, 0, -0.036);
    this.guitarModel.add(bodyMesh);

    // Chrome Neck Plate on back
    const plateGeom = new THREE.BoxGeometry(0.050, 0.064, 0.003);
    const neckPlate = new THREE.Mesh(plateGeom, this.chromeMaterial);
    neckPlate.position.set(0, 0.06, -0.043);
    this.guitarModel.add(neckPlate);

    // Tremolo cavity cover plate on back
    const tremCoverGeom = new THREE.BoxGeometry(0.085, 0.135, 0.002);
    const tremCover = new THREE.Mesh(tremCoverGeom, this.pickguardMaterial);
    tremCover.position.set(0, -0.15, -0.043);
    this.guitarModel.add(tremCover);

    // Strap Buttons
    const strapUpper = new THREE.Mesh(
      new THREE.CylinderGeometry(0.006, 0.005, 0.014, 12),
      this.chromeMaterial
    );
    strapUpper.position.set(-0.148, 0.170, -0.020);
    strapUpper.rotation.z = -0.55;
    this.guitarModel.add(strapUpper);

    const strapLower = new THREE.Mesh(
      new THREE.CylinderGeometry(0.006, 0.005, 0.014, 12),
      this.chromeMaterial
    );
    strapLower.position.set(0, -0.328, -0.020);
    this.guitarModel.add(strapLower);
  }

  _buildPickguardAndHardware() {
    // 1. Contoured 3-Ply Fender Stratocaster Pickguard
    const pgShape = new THREE.Shape();
    // Neck pocket right corner (treble side)
    pgShape.moveTo(0.028, 0.015);
    // Treble cutaway scoop base (leaves treble horn in pure body paint)
    pgShape.bezierCurveTo(0.050, 0.025, 0.070, 0.015, 0.080, -0.02);
    // Treble waist margin
    pgShape.bezierCurveTo(0.088, -0.07, 0.100, -0.11, 0.118, -0.15);
    // Sweep around volume and tone controls
    pgShape.bezierCurveTo(0.115, -0.19, 0.105, -0.23, 0.075, -0.24);
    // Bottom under bridge
    pgShape.lineTo(0.042, -0.185);
    pgShape.lineTo(-0.042, -0.185);
    // Bass side below pickups
    pgShape.lineTo(-0.042, -0.120);
    // Curve into bass waist and upper horn
    pgShape.bezierCurveTo(-0.065, -0.08, -0.085, -0.03, -0.095, 0.02);
    pgShape.bezierCurveTo(-0.102, 0.06, -0.112, 0.09, -0.115, 0.115);
    // Upper horn beak tip (leaves top 6cm of horn in pure body paint)
    pgShape.bezierCurveTo(-0.118, 0.125, -0.108, 0.125, -0.100, 0.105);
    // Scoop back to bass neck pocket
    pgShape.bezierCurveTo(-0.085, 0.065, -0.060, 0.035, -0.028, 0.015);
    pgShape.closePath();

    const pgGeom = new THREE.ExtrudeGeometry(pgShape, {
      depth: 0.0024,
      bevelEnabled: true,
      bevelSize: 0.0006,
      bevelThickness: 0.0006,
      bevelSegments: 2
    });
    const pickguard = new THREE.Mesh(pgGeom, this.pickguardMaterial);
    // Sits flat on the body surface (z = 0.0006)
    pickguard.position.set(0, 0, 0.0006);
    pickguard.castShadow = true;
    pickguard.receiveShadow = true;
    this.guitarModel.add(pickguard);

    // 2. Three Single-Coil Pickups
    const pickupYs = [-0.01, -0.06, -0.11];
    pickupYs.forEach((py, idx) => {
      const puGroup = new THREE.Group();
      puGroup.position.set(0, py, 0.0035);

      if (idx === 2) {
        puGroup.rotation.z = -0.18; // Slanted bridge pickup
      }

      const cover = new THREE.Mesh(
        new THREE.BoxGeometry(0.068, 0.015, 0.006),
        this.creamPlasticMaterial
      );
      cover.position.z = 0.003;
      cover.castShadow = true;
      puGroup.add(cover);

      const poleSpacing = 0.0105;
      for (let p = 0; p < 6; p++) {
        const pole = new THREE.Mesh(
          new THREE.CylinderGeometry(0.0024, 0.0024, 0.004, 12),
          this.chromeMaterial
        );
        pole.rotation.x = Math.PI / 2;
        pole.position.set(-0.02625 + p * poleSpacing, 0, 0.006);
        puGroup.add(pole);
      }

      [-0.038, 0.038].forEach(sx => {
        const screw = new THREE.Mesh(
          new THREE.CylinderGeometry(0.0015, 0.0015, 0.003, 8),
          this.chromeMaterial
        );
        screw.rotation.x = Math.PI / 2;
        screw.position.set(sx, 0, 0.005);
        puGroup.add(screw);
      });

      this.guitarModel.add(puGroup);
    });

    // 3. Tremolo Bridge
    const bridgeBase = new THREE.Mesh(
      new THREE.BoxGeometry(0.076, 0.036, 0.003),
      this.chromeMaterial
    );
    bridgeBase.position.set(0, -0.155, 0.002);
    this.guitarModel.add(bridgeBase);

    const saddleSpacing = 0.0105;
    for (let s = 0; s < 6; s++) {
      const saddle = new THREE.Mesh(
        new THREE.BoxGeometry(0.010, 0.018, 0.005),
        this.chromeMaterial
      );
      const staggeredOffset = (s === 1 || s === 2 || s === 5) ? -0.003 : 0.0;
      saddle.position.set(-0.02625 + s * saddleSpacing, -0.15 + staggeredOffset, 0.006);
      this.guitarModel.add(saddle);
    }

    // Tremolo Arm
    const tremArmGroup = new THREE.Group();
    tremArmGroup.position.set(0.036, -0.165, 0.006);

    const tremPivot = new THREE.Mesh(
      new THREE.CylinderGeometry(0.0035, 0.0035, 0.010, 12),
      this.chromeMaterial
    );
    tremPivot.rotation.x = Math.PI / 2;
    tremArmGroup.add(tremPivot);

    const armShaft = new THREE.Mesh(
      new THREE.CylinderGeometry(0.0022, 0.0022, 0.11, 12),
      this.chromeMaterial
    );
    armShaft.position.set(0.007, 0.050, 0.016);
    armShaft.rotation.x = 0.35;
    armShaft.rotation.z = -0.15;
    tremArmGroup.add(armShaft);

    const armTip = new THREE.Mesh(
      new THREE.CylinderGeometry(0.0035, 0.0018, 0.022, 12),
      this.creamPlasticMaterial
    );
    armTip.position.set(0.016, 0.105, 0.034);
    armTip.rotation.x = 0.35;
    tremArmGroup.add(armTip);

    this.tremArm = tremArmGroup;
    this.guitarModel.add(tremArmGroup);

    // 4. Knobs (Volume, Tone 1, Tone 2)
    const knobCoords = [
      { x: 0.055, y: -0.08 },
      { x: 0.068, y: -0.13 },
      { x: 0.065, y: -0.18 }
    ];
    knobCoords.forEach(pos => {
      const knob = new THREE.Mesh(
        new THREE.CylinderGeometry(0.009, 0.011, 0.008, 16),
        this.creamPlasticMaterial
      );
      knob.rotation.x = Math.PI / 2;
      knob.position.set(pos.x, pos.y, 0.007);
      this.guitarModel.add(knob);
    });

    // 5. Switch
    const switchSlot = new THREE.Mesh(
      new THREE.BoxGeometry(0.003, 0.028, 0.002),
      new THREE.MeshBasicMaterial({ color: 0x111111 })
    );
    switchSlot.position.set(0.038, -0.20, 0.004);
    switchSlot.rotation.z = -0.45;
    this.guitarModel.add(switchSlot);

    const switchTip = new THREE.Mesh(
      new THREE.CylinderGeometry(0.0025, 0.0012, 0.012, 10),
      this.creamPlasticMaterial
    );
    switchTip.position.set(0.038, -0.20, 0.009);
    switchTip.rotation.z = -0.45;
    this.guitarModel.add(switchTip);

    // 6. Football Jack Plate
    const jackPlate = new THREE.Mesh(
      new THREE.CylinderGeometry(0.018, 0.018, 0.003, 16),
      this.chromeMaterial
    );
    jackPlate.scale.set(0.65, 1.35, 1.0);
    jackPlate.position.set(0.090, -0.26, 0.001);
    jackPlate.rotation.z = 0.55;
    jackPlate.rotation.x = 0.35;
    this.guitarModel.add(jackPlate);

    const jackNut = new THREE.Mesh(
      new THREE.CylinderGeometry(0.005, 0.005, 0.004, 6),
      this.chromeMaterial
    );
    jackNut.position.set(0.090, -0.26, 0.003);
    jackNut.rotation.z = 0.55;
    jackNut.rotation.x = 0.35;
    this.guitarModel.add(jackNut);
  }

  _buildNeckAndHeadstock() {
    const nutY = 0.48;
    const heelY = 0.015;
    const scaleLength = 0.63;
    this.fretYPositions[0] = nutY;

    // 1. Tapered Indian Rosewood Fretboard Slab
    const fbShape = new THREE.Shape();
    fbShape.moveTo(-0.028, heelY);
    fbShape.lineTo(0.028, heelY);
    fbShape.lineTo(0.0215, nutY);
    fbShape.lineTo(-0.0215, nutY);
    fbShape.closePath();

    const fbGeom = new THREE.ExtrudeGeometry(fbShape, { depth: 0.0055, bevelEnabled: false });
    const fretboard = new THREE.Mesh(fbGeom, this.rosewoodMaterial);
    fretboard.position.set(0, 0, 0.002);
    this.guitarModel.add(fretboard);

    // 2. Sleek Maple Neck Back
    const neckBackShape = new THREE.Shape();
    neckBackShape.moveTo(-0.027, heelY);
    neckBackShape.lineTo(0.027, heelY);
    neckBackShape.lineTo(0.0205, nutY);
    neckBackShape.lineTo(-0.0205, nutY);
    neckBackShape.closePath();

    const neckBackGeom = new THREE.ExtrudeGeometry(neckBackShape, {
      depth: 0.018,
      bevelEnabled: true,
      bevelSize: 0.004,
      bevelThickness: 0.004,
      bevelSegments: 3
    });
    const neckBack = new THREE.Mesh(neckBackGeom, this.mapleNeckMaterial);
    neckBack.position.set(0, 0, -0.016);
    neckBack.castShadow = true;
    this.guitarModel.add(neckBack);

    // 3. Bone Nut
    const nut = new THREE.Mesh(
      new THREE.BoxGeometry(0.043, 0.006, 0.006),
      new THREE.MeshStandardMaterial({ color: 0xf4efe4, roughness: 0.4 })
    );
    nut.position.set(0, nutY, 0.008);
    this.guitarModel.add(nut);

    // 4. 21 Nickel-Silver Frets (proper acoustic spacing with tapered width)
    const fretWireMat = new THREE.MeshStandardMaterial({
      color: 0xd8d8e2,
      roughness: 0.25,
      metalness: 0.85
    });
    for (let f = 1; f <= 21; f++) {
      const dist = scaleLength * (1 - Math.pow(2, -f / 12));
      const fretY = nutY - dist;
      this.fretYPositions[f] = fretY;

      const t = (fretY - heelY) / (nutY - heelY);
      const fretW = 0.056 - (0.056 - 0.043) * t;

      const fretGeom = new THREE.BoxGeometry(fretW, 0.0018, 0.0018);
      const fret = new THREE.Mesh(fretGeom, fretWireMat);
      fret.position.set(0, fretY, 0.0084);
      this.guitarModel.add(fret);
    }

    // 5. Pearloid Inlay Dots
    const inlayFrets = [3, 5, 7, 9, 12, 15, 17, 19, 21];
    inlayFrets.forEach(f => {
      const dotY = (this.fretYPositions[f - 1] + this.fretYPositions[f]) * 0.5;

      if (f === 12) {
        [-0.010, 0.010].forEach(dx => {
          const dot = new THREE.Mesh(new THREE.CircleGeometry(0.0025, 16), this.pearlMaterial);
          dot.position.set(dx, dotY, 0.0077);
          this.guitarModel.add(dot);
        });
      } else {
        const dot = new THREE.Mesh(new THREE.CircleGeometry(0.003, 16), this.pearlMaterial);
        dot.position.set(0, dotY, 0.0077);
        this.guitarModel.add(dot);
      }
    });

    // 6. Stratocaster Headstock (Natural maple wood with 6 inline tuners on bass edge at -X)
    const headShape = new THREE.Shape();
    headShape.moveTo(-0.0215, 0.48);
    headShape.lineTo(0.0215, 0.48);
    headShape.bezierCurveTo(0.023, 0.53, 0.021, 0.58, 0.018, 0.62);
    headShape.bezierCurveTo(0.016, 0.65, -0.005, 0.665, -0.028, 0.655);
    headShape.bezierCurveTo(-0.048, 0.645, -0.048, 0.615, -0.038, 0.59);
    headShape.bezierCurveTo(-0.032, 0.57, -0.034, 0.53, -0.032, 0.50);
    headShape.bezierCurveTo(-0.030, 0.485, -0.025, 0.48, -0.0215, 0.48);
    headShape.closePath();

    const headGeom = new THREE.ExtrudeGeometry(headShape, { depth: 0.013, bevelEnabled: false });
    const headMesh = new THREE.Mesh(headGeom, this.mapleNeckMaterial);
    headMesh.position.set(0, 0, -0.005);
    this.guitarModel.add(headMesh);

    // 6 In-Line Chrome Tuners (along bass edge at -X)
    for (let t = 0; t < 6; t++) {
      const ty = 0.505 + t * 0.024;
      const post = new THREE.Mesh(
        new THREE.CylinderGeometry(0.0025, 0.0025, 0.016, 12),
        this.chromeMaterial
      );
      post.rotation.x = Math.PI / 2;
      post.position.set(-0.018, ty, 0.005);
      this.guitarModel.add(post);

      const washer = new THREE.Mesh(
        new THREE.CylinderGeometry(0.0042, 0.0042, 0.002, 12),
        this.chromeMaterial
      );
      washer.rotation.x = Math.PI / 2;
      washer.position.set(-0.018, ty, 0.008);
      this.guitarModel.add(washer);

      const key = new THREE.Mesh(
        new THREE.BoxGeometry(0.0032, 0.013, 0.009),
        this.chromeMaterial
      );
      key.position.set(-0.033, ty, 0.002);
      this.guitarModel.add(key);
    }
  }

  _buildFretMarkers() {
    // 6 Active Finger Press Indicators with glowing yellow/amber tone (matching MIDIJam)
    for (let s = 0; s < 6; s++) {
      const markerGroup = new THREE.Group();
      markerGroup.visible = false;

      // 1. Fretboard Space Backing Glow
      const fretPad = new THREE.Mesh(
        new THREE.BoxGeometry(0.016, 0.018, 0.003),
        new THREE.MeshStandardMaterial({
          color: 0xffcc00,
          emissive: 0xffaa00,
          emissiveIntensity: 1.8,
          transparent: true,
          opacity: 0.85
        })
      );
      markerGroup.add(fretPad);

      // 2. Glowing Fingertip Press Jewel (on top of string)
      const jewel = new THREE.Mesh(
        new THREE.SphereGeometry(0.008, 16, 16),
        new THREE.MeshStandardMaterial({
          color: 0xffe600,
          emissive: 0xffcc00,
          emissiveIntensity: 3.2,
          roughness: 0.1,
          metalness: 0.8
        })
      );
      jewel.scale.set(1.0, 1.3, 0.6);
      jewel.position.z = 0.004;
      markerGroup.add(jewel);

      // 3. Expanding Sonic Halo Ring
      const halo = new THREE.Mesh(
        new THREE.RingGeometry(0.009, 0.018, 24),
        new THREE.MeshBasicMaterial({
          color: 0xffdd00,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.85
        })
      );
      halo.position.z = 0.005;
      markerGroup.add(halo);

      markerGroup.position.set(0, 0, 0.012);
      this.guitarModel.add(markerGroup);

      this.fretMarkers.push({
        group: markerGroup,
        fretPad: fretPad,
        jewel: jewel,
        halo: halo,
        active: false
      });
    }
  }

  _buildStrings() {
    const stringCount = 6;
    const bridgeY = -0.15;
    const nutY = 0.48;
    const length = nutY - bridgeY;

    // Realistic calibrated electric guitar gauges (scaled to match acoustic guitar refinement):
    // s=0 (Low E, TOP edge): wound nickel-plated steel
    // s=1 (A): wound nickel-plated steel
    // s=2 (D): wound nickel-plated steel
    // s=3 (G): plain steel
    // s=4 (B): plain steel
    // s=5 (High E, BOTTOM edge): plain steel
    const gauges = [0.0022, 0.0018, 0.00145, 0.00115, 0.00090, 0.00072];
    const bridgeSpacing = 0.0105;
    const nutSpacing = 0.0070;

    for (let s = 0; s < stringCount; s++) {
      // s=0 is at -X (top edge in playing angle), s=5 is at +X (bottom edge)
      const bridgeX = -0.02625 + s * bridgeSpacing;
      const nutX = -0.0175 + s * nutSpacing;
      const midX = (bridgeX + nutX) * 0.5;
      const angleZ = Math.atan2(nutX - bridgeX, length);

      const geom = new THREE.CylinderGeometry(gauges[s], gauges[s], length, 10);
      const isWound = s <= 2;

      // Authentic nickel-steel guitar string material:
      // - Realistic metallic specular highlights (no constant glowing wash)
      // - Wound strings (s <= 2): wound nickel-plated steel
      // - Plain strings (s >= 3): polished high-carbon steel
      const mat = new THREE.MeshStandardMaterial({
        color: isWound ? 0xd0d4de : 0xe2e6ee,
        metalness: isWound ? 0.82 : 0.88,
        roughness: isWound ? 0.28 : 0.20,
        emissive: 0x000000,
        emissiveIntensity: 0
      });

      const mesh = new THREE.Mesh(geom, mat);
      // Action height: 0.0125 (naturally clearing frets and resting on saddles and nut)
      mesh.position.set(midX, (bridgeY + nutY) * 0.5, 0.0125);
      mesh.rotation.z = -angleZ;
      mesh.castShadow = true;
      this.guitarModel.add(mesh);

      this.strings.push({
        mesh: mesh,
        material: mat,
        baseX: midX,
        baseZ: 0.0125,
        baseEmissiveColor: 0x000000,
        baseEmissiveIntensity: 0,
        vibrationAmp: 0,
        vibrationSpeed: 42 + s * 12,
        phase: Math.random() * Math.PI * 2
      });
    }
  }

  _getStringXAtY(stringIndex, y) {
    const bridgeY = -0.15;
    const nutY = 0.48;
    const bridgeX = -0.02625 + stringIndex * 0.0105;
    const nutX = -0.0175 + stringIndex * 0.0070;
    const t = (y - bridgeY) / (nutY - bridgeY);
    return bridgeX + t * (nutX - bridgeX);
  }

  _buildFloatingPlectrum() {
    const pGroup = new THREE.Group();
    pGroup.position.set(0, -0.11, 0.021);

    const pickShape = new THREE.Shape();
    pickShape.moveTo(0, -0.016);
    pickShape.bezierCurveTo(0.012, -0.004, 0.014, 0.010, 0.009, 0.016);
    pickShape.bezierCurveTo(0.004, 0.019, -0.004, 0.019, -0.009, 0.016);
    pickShape.bezierCurveTo(-0.014, 0.010, -0.012, -0.004, 0, -0.016);

    const pickGeom = new THREE.ExtrudeGeometry(pickShape, { depth: 0.0014, bevelEnabled: false });
    pickGeom.center();
    const pickMesh = new THREE.Mesh(pickGeom, this.pickMaterial);
    pGroup.add(pickMesh);

    this.plectrumGroup = pGroup;
    this.guitarModel.add(pGroup);
    this.strumDir = 1;
  }

  onNoteOn(midiPitch, velocity = 0.8) {
    const vel = Math.max(0.3, Math.min(1.0, velocity));

    let bestString = 0;
    let bestFret = 0;
    let minFretDiff = 999;

    // String 0 = Low E (40, TOP), String 5 = High E (64, BOTTOM)
    for (let s = 5; s >= 0; s--) {
      const openMidi = this.stringTuningMidi[s];
      const fret = midiPitch - openMidi;
      if (fret >= 0 && fret <= 21) {
        if (fret < minFretDiff) {
          minFretDiff = fret;
          bestString = s;
          bestFret = fret;
        }
      }
    }

    // Plectrum alternate picking animation
    if (this.plectrumGroup) {
      const stringX = this._getStringXAtY(bestString, -0.11);
      this.strumDir = -this.strumDir;
      gsap.killTweensOf(this.plectrumGroup.position);
      gsap.killTweensOf(this.plectrumGroup.rotation);
      gsap.timeline()
        .to(this.plectrumGroup.position, {
          x: stringX,
          y: -0.11 + this.strumDir * 0.008,
          z: 0.017,
          duration: 0.035,
          ease: 'power2.in'
        })
        .to(this.plectrumGroup.rotation, {
          z: this.strumDir * 0.38,
          duration: 0.035,
          ease: 'power2.in'
        }, 0)
        .to(this.plectrumGroup.position, {
          y: -0.11,
          z: 0.023,
          duration: 0.14,
          ease: 'power1.out'
        })
        .to(this.plectrumGroup.rotation, {
          z: 0,
          duration: 0.14,
          ease: 'power1.out'
        }, '-=0.14');
    }

    // 1. Vibrate & Glow the Active String with warm yellow/amber glow
    const str = this.strings[bestString];
    if (str) {
      str.material.emissive.setHex(0xffdd33);
      str.material.emissiveIntensity = 2.0 * vel;
      gsap.killTweensOf(str.material);
      gsap.to(str.material, {
        emissiveIntensity: 0,
        duration: 0.6 + vel * 0.3,
        ease: 'power2.out',
        onComplete: () => {
          str.material.emissive.setHex(0x000000);
        }
      });

      str.vibrationAmp = 0.008 * vel;
      gsap.killTweensOf(str);
      gsap.to(str, {
        vibrationAmp: 0,
        duration: 0.6 + vel * 0.4,
        ease: 'power2.out'
      });
    }

    // 2. Illuminate Fret Pressing Indicator (Glowing Yellow Dot like MIDIJam)
    const marker = this.fretMarkers[bestString];
    if (marker) {
      if (bestFret > 0) {
        const fretY = (this.fretYPositions[bestFret - 1] + this.fretYPositions[bestFret]) * 0.5;
        const fretX = this._getStringXAtY(bestString, fretY);

        marker.group.position.set(fretX, fretY, 0.012);
        marker.group.visible = true;
        marker.active = true;

        marker.group.scale.set(2.2, 2.2, 2.2);
        gsap.killTweensOf(marker.group.scale);
        gsap.to(marker.group.scale, {
          x: 1.0,
          y: 1.0,
          z: 1.0,
          duration: 0.16,
          ease: 'back.out(3.0)'
        });

        marker.jewel.material.emissiveIntensity = 3.2 * vel;
        marker.fretPad.material.emissiveIntensity = 1.8 * vel;
        marker.halo.material.opacity = 0.9 * vel;

        gsap.killTweensOf(marker.jewel.material);
        gsap.killTweensOf(marker.fretPad.material);
        gsap.killTweensOf(marker.halo.material);

        gsap.timeline()
          .to(marker.jewel.material, { emissiveIntensity: 1.4, duration: 0.28 })
          .to(marker.jewel.material, { emissiveIntensity: 0, duration: 0.38 })
          .call(() => {
            marker.group.visible = false;
            marker.active = false;
          });

        gsap.to(marker.fretPad.material, {
          emissiveIntensity: 0,
          duration: 0.6,
          ease: 'power2.out'
        });

        gsap.to(marker.halo.material, {
          opacity: 0,
          duration: 0.6,
          ease: 'power2.out'
        });
      }
    }

    // Subtle whammy arm twitch
    if (this.tremArm) {
      gsap.killTweensOf(this.tremArm.rotation);
      gsap.timeline()
        .to(this.tremArm.rotation, { x: 0.22 * vel, duration: 0.06 })
        .to(this.tremArm.rotation, { x: 0, duration: 0.25, ease: 'elastic.out(1, 0.5)' });
    }
  }

  onNoteOff(midiPitch) {}

  update(delta) {
    this._syncGuitarStand();

    // Physical harmonic oscillation of vibrating strings
    this.strings.forEach(str => {
      if (str.vibrationAmp > 0.0001) {
        str.phase += str.vibrationSpeed * delta;
        const offsetZ = Math.sin(str.phase) * str.vibrationAmp;
        str.mesh.position.z = str.baseZ + offsetZ;
      } else {
        str.mesh.position.z = str.baseZ;
      }
    });
  }
}
