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
    // Front face tilted upwards towards the camera
    this.guitarModel.rotation.set(-0.28, 0.10, -1.35);
    this.group.add(this.guitarModel);

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
  }

  _buildGuitarBody() {
    const shape = new THREE.Shape();
    // Bottom strap button
    shape.moveTo(0, -0.34);
    // Treble lower bout
    shape.bezierCurveTo(0.13, -0.34, 0.16, -0.25, 0.15, -0.15);
    // Treble waist
    shape.bezierCurveTo(0.14, -0.06, 0.11, -0.02, 0.10, 0.05);
    // Treble horn cutaway (reaches y = 0.25)
    shape.bezierCurveTo(0.10, 0.12, 0.12, 0.20, 0.11, 0.25);
    // Treble horn tip rounded
    shape.bezierCurveTo(0.10, 0.27, 0.075, 0.26, 0.06, 0.20);
    // Cutaway into treble neck pocket
    shape.bezierCurveTo(0.05, 0.15, 0.04, 0.14, 0.035, 0.14);
    // Neck pocket
    shape.lineTo(-0.035, 0.14);
    // Cutaway from bass neck pocket to upper horn
    shape.bezierCurveTo(-0.04, 0.14, -0.05, 0.17, -0.065, 0.22);
    // Upper bass horn (reaches y = 0.31)
    shape.bezierCurveTo(-0.075, 0.26, -0.095, 0.30, -0.11, 0.31);
    // Upper horn tip rounded
    shape.bezierCurveTo(-0.125, 0.31, -0.13, 0.28, -0.12, 0.22);
    // Outer contour of upper horn
    shape.bezierCurveTo(-0.115, 0.14, -0.105, 0.06, -0.105, 0.02);
    // Bass waist
    shape.bezierCurveTo(-0.115, -0.06, -0.14, -0.10, -0.155, -0.15);
    // Bass lower bout
    shape.bezierCurveTo(-0.17, -0.25, -0.13, -0.34, 0, -0.34);

    const extrudeSettings = {
      depth: 0.032,
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
    bodyMesh.position.set(0, 0, -0.040);
    this.guitarModel.add(bodyMesh);

    // Chrome Neck Plate on back
    const plateGeom = new THREE.BoxGeometry(0.048, 0.060, 0.003);
    const neckPlate = new THREE.Mesh(plateGeom, this.chromeMaterial);
    neckPlate.position.set(0, 0.08, -0.042);
    this.guitarModel.add(neckPlate);

    // Strap Buttons
    const strapUpper = new THREE.Mesh(
      new THREE.CylinderGeometry(0.006, 0.005, 0.014, 12),
      this.chromeMaterial
    );
    strapUpper.position.set(-0.11, 0.30, -0.020);
    strapUpper.rotation.z = -0.5;
    this.guitarModel.add(strapUpper);

    const strapLower = new THREE.Mesh(
      new THREE.CylinderGeometry(0.006, 0.005, 0.014, 12),
      this.chromeMaterial
    );
    strapLower.position.set(0, -0.35, -0.020);
    this.guitarModel.add(strapLower);
  }

  _buildPickguardAndHardware() {
    // 1. Contoured 3-Ply Stratocaster Pickguard (compact shield matching MIDIJam)
    const pgShape = new THREE.Shape();
    pgShape.moveTo(0.04, -0.22);
    pgShape.bezierCurveTo(0.09, -0.22, 0.095, -0.15, 0.085, -0.08);
    pgShape.bezierCurveTo(0.08, 0.00, 0.07, 0.08, 0.05, 0.12);
    pgShape.lineTo(0.035, 0.14);
    pgShape.lineTo(-0.035, 0.14);
    pgShape.bezierCurveTo(-0.05, 0.14, -0.065, 0.10, -0.065, 0.05);
    pgShape.bezierCurveTo(-0.065, -0.02, -0.060, -0.08, -0.055, -0.14);
    pgShape.bezierCurveTo(-0.05, -0.20, -0.01, -0.22, 0.04, -0.22);

    const pgGeom = new THREE.ExtrudeGeometry(pgShape, {
      depth: 0.003,
      bevelEnabled: true,
      bevelSize: 0.001,
      bevelThickness: 0.001,
      bevelSegments: 2
    });
    const pickguard = new THREE.Mesh(pgGeom, this.pickguardMaterial);
    pickguard.position.set(0, 0, 0.001);
    this.guitarModel.add(pickguard);

    // 2. Three Single-Coil Pickups
    const pickupYs = [0.06, -0.02, -0.10];
    pickupYs.forEach((py, idx) => {
      const puGroup = new THREE.Group();
      puGroup.position.set(0, py, 0.005);

      if (idx === 2) {
        puGroup.rotation.z = -0.15; // Slanted bridge pickup
      }

      const cover = new THREE.Mesh(
        new THREE.BoxGeometry(0.064, 0.015, 0.009),
        this.creamPlasticMaterial
      );
      cover.castShadow = true;
      puGroup.add(cover);

      for (let p = 0; p < 6; p++) {
        const pole = new THREE.Mesh(
          new THREE.CylinderGeometry(0.0022, 0.0022, 0.004, 12),
          this.chromeMaterial
        );
        pole.rotation.x = Math.PI / 2;
        const poleSpacing = 0.0092;
        pole.position.set(-0.023 + p * poleSpacing, 0, 0.005);
        puGroup.add(pole);
      }

      [-0.035, 0.035].forEach(sx => {
        const screw = new THREE.Mesh(
          new THREE.CylinderGeometry(0.0015, 0.0015, 0.003, 8),
          this.chromeMaterial
        );
        screw.rotation.x = Math.PI / 2;
        screw.position.set(sx, 0, 0.004);
        puGroup.add(screw);
      });

      this.guitarModel.add(puGroup);
    });

    // 3. Tremolo Bridge
    const bridgeBase = new THREE.Mesh(
      new THREE.BoxGeometry(0.070, 0.034, 0.004),
      this.chromeMaterial
    );
    bridgeBase.position.set(0, -0.18, 0.005);
    this.guitarModel.add(bridgeBase);

    for (let s = 0; s < 6; s++) {
      const saddle = new THREE.Mesh(
        new THREE.BoxGeometry(0.009, 0.018, 0.005),
        this.chromeMaterial
      );
      const staggeredOffset = (s === 1 || s === 2 || s === 5) ? -0.003 : 0.0;
      saddle.position.set(-0.023 + s * 0.0092, -0.18 + staggeredOffset, 0.008);
      this.guitarModel.add(saddle);
    }

    // Tremolo Arm
    const tremArmGroup = new THREE.Group();
    tremArmGroup.position.set(0.032, -0.19, 0.008);

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

    // 4. Knobs
    const knobCoords = [
      { x: 0.055, y: -0.07 },
      { x: 0.065, y: -0.13 },
      { x: 0.062, y: -0.19 }
    ];
    knobCoords.forEach(pos => {
      const knob = new THREE.Mesh(
        new THREE.CylinderGeometry(0.009, 0.011, 0.009, 16),
        this.creamPlasticMaterial
      );
      knob.rotation.x = Math.PI / 2;
      knob.position.set(pos.x, pos.y, 0.008);
      this.guitarModel.add(knob);
    });

    // 5. Switch
    const switchSlot = new THREE.Mesh(
      new THREE.BoxGeometry(0.003, 0.028, 0.002),
      new THREE.MeshBasicMaterial({ color: 0x111111 })
    );
    switchSlot.position.set(0.038, -0.22, 0.005);
    switchSlot.rotation.z = -0.38;
    this.guitarModel.add(switchSlot);

    const switchTip = new THREE.Mesh(
      new THREE.CylinderGeometry(0.0025, 0.0012, 0.012, 10),
      this.creamPlasticMaterial
    );
    switchTip.position.set(0.038, -0.22, 0.010);
    switchTip.rotation.z = -0.38;
    this.guitarModel.add(switchTip);

    // 6. Jack Plate
    const jackPlate = new THREE.Mesh(
      new THREE.CylinderGeometry(0.018, 0.018, 0.003, 16),
      this.chromeMaterial
    );
    jackPlate.scale.set(0.65, 1.35, 1.0);
    jackPlate.position.set(0.085, -0.30, -0.006);
    jackPlate.rotation.z = 0.55;
    jackPlate.rotation.x = 0.35;
    this.guitarModel.add(jackPlate);

    const jackNut = new THREE.Mesh(
      new THREE.CylinderGeometry(0.005, 0.005, 0.004, 6),
      this.chromeMaterial
    );
    jackNut.position.set(0.085, -0.30, -0.004);
    jackNut.rotation.z = 0.55;
    jackNut.rotation.x = 0.35;
    this.guitarModel.add(jackNut);
  }

  _buildNeckAndHeadstock() {
    const neckLength = 0.44;
    const neckStartY = 0.14;
    const nutY = 0.52;
    this.fretYPositions[0] = nutY;

    // 1. Sleek Maple Neck Back (narrower at 0.044 so it never protrudes past fretboard)
    const neckBackGeom = new THREE.BoxGeometry(0.044, neckLength, 0.016);
    const neckBack = new THREE.Mesh(neckBackGeom, this.mapleNeckMaterial);
    neckBack.position.set(0, (neckStartY + nutY) * 0.5, -0.008);
    neckBack.castShadow = true;
    this.guitarModel.add(neckBack);

    // 2. Dark Indian Rosewood Fretboard Slab (clean 0.046 width, sitting prominently on front)
    const fretboardGeom = new THREE.BoxGeometry(0.046, neckLength, 0.004);
    const fretboard = new THREE.Mesh(fretboardGeom, this.rosewoodMaterial);
    fretboard.position.set(0, (neckStartY + nutY) * 0.5, 0.002);
    this.guitarModel.add(fretboard);

    // 3. Bone Nut
    const nut = new THREE.Mesh(
      new THREE.BoxGeometry(0.046, 0.006, 0.006),
      new THREE.MeshStandardMaterial({ color: 0xf4efe4, roughness: 0.4 })
    );
    nut.position.set(0, nutY, 0.006);
    this.guitarModel.add(nut);

    // 4. 21 Nickel-Silver Frets (sitting clearly above the rosewood fretboard)
    const fretWireMat = new THREE.MeshStandardMaterial({
      color: 0xd8d8e2,
      roughness: 0.25,
      metalness: 0.85
    });
    for (let f = 1; f <= 21; f++) {
      const dist = 0.38 * (1 - Math.pow(2, -f / 12));
      const fretY = nutY - dist;
      this.fretYPositions[f] = fretY;

      const fretGeom = new THREE.BoxGeometry(0.045, 0.002, 0.0018);
      const fret = new THREE.Mesh(fretGeom, fretWireMat);
      fret.position.set(0, fretY, 0.0049);
      this.guitarModel.add(fret);
    }

    // 5. Pearloid Inlay Dots
    const inlayFrets = [3, 5, 7, 9, 12, 15, 17, 19, 21];
    inlayFrets.forEach(f => {
      const dotY = (this.fretYPositions[f - 1] + this.fretYPositions[f]) * 0.5;

      if (f === 12) {
        [-0.010, 0.010].forEach(dx => {
          const dot = new THREE.Mesh(new THREE.CircleGeometry(0.0025, 16), this.pearlMaterial);
          dot.position.set(dx, dotY, 0.0050);
          this.guitarModel.add(dot);
        });
      } else {
        const dot = new THREE.Mesh(new THREE.CircleGeometry(0.003, 16), this.pearlMaterial);
        dot.position.set(0, dotY, 0.0050);
        this.guitarModel.add(dot);
      }
    });

    // 6. Stratocaster Headstock (Natural maple wood with 6 inline tuners on top edge at -X)
    const headShape = new THREE.Shape();
    headShape.moveTo(-0.023, 0);
    // Tuner edge (upper edge at -X)
    headShape.bezierCurveTo(-0.030, 0.06, -0.038, 0.13, -0.036, 0.17);
    // Ball scroll tip
    headShape.bezierCurveTo(-0.028, 0.20, -0.006, 0.20, 0.006, 0.17);
    // Lower curve
    headShape.bezierCurveTo(0.016, 0.15, 0.020, 0.11, 0.023, 0.07);
    headShape.lineTo(0.023, 0);
    headShape.closePath();

    const headGeom = new THREE.ExtrudeGeometry(headShape, { depth: 0.012, bevelEnabled: false });
    const headMesh = new THREE.Mesh(headGeom, this.mapleNeckMaterial);
    headMesh.position.set(0, nutY, -0.008);
    this.guitarModel.add(headMesh);

    // 6 In-Line Chrome Tuners (on upper edge at -X)
    for (let t = 0; t < 6; t++) {
      const ty = nutY + 0.022 + t * 0.024;
      const post = new THREE.Mesh(
        new THREE.CylinderGeometry(0.0025, 0.0025, 0.018, 12),
        this.chromeMaterial
      );
      post.rotation.x = Math.PI / 2;
      post.position.set(-0.018, ty, 0.002);
      this.guitarModel.add(post);

      const washer = new THREE.Mesh(
        new THREE.CylinderGeometry(0.0042, 0.0042, 0.002, 12),
        this.chromeMaterial
      );
      washer.rotation.x = Math.PI / 2;
      washer.position.set(-0.018, ty, 0.005);
      this.guitarModel.add(washer);

      const key = new THREE.Mesh(
        new THREE.BoxGeometry(0.0032, 0.013, 0.009),
        this.chromeMaterial
      );
      key.position.set(-0.033, ty, -0.004);
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

      markerGroup.position.set(0, 0, 0.008);
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
    const bridgeY = -0.18;
    const nutY = 0.52;
    const length = nutY - bridgeY;

    // Authentic Fender Gauges:
    // s=0 (Low E / Grave, TOP edge): 0.0042 (thickest wound string)
    // s=1 (A / Grave): 0.0034 (wound)
    // s=2 (D / Grave): 0.0026 (wound)
    // s=3 (G / Aguda): 0.0020 (plain steel)
    // s=4 (B / Aguda): 0.0015 (plain steel)
    // s=5 (High E / Fina, BOTTOM edge): 0.0012 (thinnest string)
    const gauges = [0.0042, 0.0034, 0.0026, 0.0020, 0.0015, 0.0012];
    const bridgeSpacing = 0.0092;
    const nutSpacing = 0.0065;

    for (let s = 0; s < stringCount; s++) {
      // s=0 is at -X (top edge in playing angle), s=5 is at +X (bottom edge)
      const bridgeX = -0.023 + s * bridgeSpacing;
      const nutX = -0.016 + s * nutSpacing;
      const midX = (bridgeX + nutX) * 0.5;
      const angleZ = Math.atan2(nutX - bridgeX, length);

      const geom = new THREE.CylinderGeometry(gauges[s], gauges[s], length, 8);
      const isWound = s <= 2;
      const mat = new THREE.MeshStandardMaterial({
        color: isWound ? 0xd6d6de : 0xf2f2f8,
        metalness: 0.95,
        roughness: isWound ? 0.22 : 0.06,
        emissive: 0x000000,
        emissiveIntensity: 0
      });

      const mesh = new THREE.Mesh(geom, mat);
      mesh.position.set(midX, (bridgeY + nutY) * 0.5, 0.008);
      mesh.rotation.z = -angleZ;
      mesh.castShadow = true;
      this.guitarModel.add(mesh);

      this.strings.push({
        mesh: mesh,
        material: mat,
        baseX: midX,
        baseZ: 0.008,
        vibrationAmp: 0,
        vibrationSpeed: 40 + s * 14,
        phase: Math.random() * Math.PI * 2
      });
    }
  }

  _getStringXAtY(stringIndex, y) {
    const bridgeY = -0.18;
    const nutY = 0.52;
    const bridgeX = -0.023 + stringIndex * 0.0092;
    const nutX = -0.016 + stringIndex * 0.0065;
    const t = (y - bridgeY) / (nutY - bridgeY);
    return bridgeX + t * (nutX - bridgeX);
  }

  _buildFloatingPlectrum() {
    const pGroup = new THREE.Group();
    pGroup.position.set(0, -0.13, 0.020);

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
      const stringX = this._getStringXAtY(bestString, -0.13);
      this.strumDir = -this.strumDir;
      gsap.killTweensOf(this.plectrumGroup.position);
      gsap.killTweensOf(this.plectrumGroup.rotation);
      gsap.timeline()
        .to(this.plectrumGroup.position, {
          x: stringX,
          y: -0.13 + this.strumDir * 0.008,
          z: 0.014,
          duration: 0.035,
          ease: 'power2.in'
        })
        .to(this.plectrumGroup.rotation, {
          z: this.strumDir * 0.38,
          duration: 0.035,
          ease: 'power2.in'
        }, 0)
        .to(this.plectrumGroup.position, {
          y: -0.13,
          z: 0.020,
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
        ease: 'power2.out'
      });

      str.vibrationAmp = 0.014 * vel;
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

        marker.group.position.set(fretX, fretY, 0.008);
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
