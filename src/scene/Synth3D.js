import * as THREE from 'three';
import gsap from 'gsap';

/**
 * Synth3D: Multi-Tier Electronic Synthesizer Workstation matching MIDIJam:
 * - 61-key velocity-reactive synthesizer with cyber-neon underglow.
 * - 16 RGB performance trigger pads in 2x8 matrix.
 * - Animated LCD frequency spectrum screen and pitch/mod wheels.
 * - Tier 1 (Lower Synth): Brushed dark titanium chassis on steel dual-tier X-stand.
 * - Tier 2: Anodized violet/magenta chassis stacked directly above on upper tier.
 * - Tier 3: Electric amber/gold chassis with orange LEDs.
 * - Tier 4: Matrix cyber green chassis with lime LEDs.
 * - Multi-track stacking: supports up to 4 stacked tiers on the stand!
 */
export class Synth3D {
  constructor(scene, options = {}) {
    this.scene = scene;
    this.tier = options.tier || 1;
    this.hasStand = options.hasStand !== undefined ? options.hasStand : (this.tier === 1);

    this.group = new THREE.Group();
    // Positioned front-left stage
    this.group.position.set(-4.0, 0.95, 2.0);
    this.group.rotation.set(0.04, Math.PI * 0.18, 0);

    this.keys = {};
    this.rgbPads = [];
    this.pitchWheel = null;
    this.spectrumBars = [];

    this._buildMaterials();

    // Body container with tier height and tilt
    this.bodyGroup = new THREE.Group();
    const tierConfigs = {
      1: { y: 0, z: 0, rotX: 0 },
      2: { y: 0.28, z: -0.16, rotX: 0.16 },
      3: { y: 0.56, z: -0.32, rotX: 0.26 },
      4: { y: 0.84, z: -0.48, rotX: 0.36 }
    };
    const cfg = tierConfigs[this.tier] || tierConfigs[1];
    this.bodyGroup.position.set(0, cfg.y, cfg.z);
    this.bodyGroup.rotation.x = cfg.rotX;

    this._buildChassis();
    this._buildPerformancePadsAndScreen();
    this._buildSynthKeys();
    this.group.add(this.bodyGroup);

    if (this.hasStand) {
      this._buildXStand();
    } else if (this.tier >= 3) {
      this._buildTierRisers();
    }

    this.scene.add(this.group);
  }

  _buildMaterials() {
    // Chassis Body
    this.chassisMaterial = new THREE.MeshStandardMaterial({
      color: 0x18181c,
      roughness: 0.35,
      metalness: 0.6
    });

    // Side Panels (Cheeks) for all 4 tiers
    const cheekColors = {
      1: 0x4a4a54, // Tier 1: Brushed Titanium / Dark Chrome
      2: 0x5a1846, // Tier 2: Anodized Neon Violet / Magenta
      3: 0x8a5510, // Tier 3: Electric Cyber Amber / Gold
      4: 0x15552a  // Tier 4: Matrix Cyber Green
    };
    const cheekColor = cheekColors[this.tier] || 0x4a4a54;
    this.cheekMaterial = new THREE.MeshStandardMaterial({
      color: cheekColor,
      roughness: 0.25,
      metalness: 0.75
    });

    this.whiteKeyMaterial = new THREE.MeshStandardMaterial({
      color: 0xf5f5f7,
      roughness: 0.2
    });

    this.blackKeyMaterial = new THREE.MeshStandardMaterial({
      color: 0x121214,
      roughness: 0.4
    });

    const screenColors = {
      1: 0x002233,
      2: 0x240033,
      3: 0x331a00,
      4: 0x002e11
    };
    this.lcdScreenMaterial = new THREE.MeshBasicMaterial({
      color: screenColors[this.tier] || 0x002233
    });

    this.pitchWheelMaterial = new THREE.MeshStandardMaterial({
      color: 0x222226,
      roughness: 0.5,
      metalness: 0.3
    });

    this.standMaterial = new THREE.MeshStandardMaterial({
      color: 0x202024,
      roughness: 0.55,
      metalness: 0.6
    });

    this.rubberMaterial = new THREE.MeshStandardMaterial({
      color: 0x121214,
      roughness: 0.85,
      metalness: 0.05
    });
  }

  _buildXStand() {
    const stand = new THREE.Group();
    stand.position.set(0, -0.95, 0);

    const tubeRadius = 0.015;

    [-0.38, 0.38].forEach(x => {
      // Bottom Foot Tube
      const foot = new THREE.Mesh(
        new THREE.CylinderGeometry(tubeRadius, tubeRadius, 0.46, 12),
        this.standMaterial
      );
      foot.rotation.x = Math.PI / 2;
      foot.position.set(x, 0.02, 0);
      foot.castShadow = true;
      stand.add(foot);

      // Rubber caps
      [-0.23, 0.23].forEach(z => {
        const cap = new THREE.Mesh(
          new THREE.CylinderGeometry(tubeRadius + 0.004, tubeRadius + 0.004, 0.04, 12),
          this.rubberMaterial
        );
        cap.rotation.x = Math.PI / 2;
        cap.position.set(x, 0.02, z);
        stand.add(cap);
      });

      // Top Support Arm holding Tier 1 Synth
      const topArm = new THREE.Mesh(
        new THREE.CylinderGeometry(tubeRadius, tubeRadius, 0.38, 12),
        this.standMaterial
      );
      topArm.rotation.x = Math.PI / 2;
      topArm.position.set(x, 0.94, 0);
      topArm.castShadow = true;
      stand.add(topArm);

      // Diagonal Cross Tube 1
      const leg1 = new THREE.Mesh(
        new THREE.CylinderGeometry(tubeRadius, tubeRadius, 1.15, 12),
        this.standMaterial
      );
      leg1.position.set(x, 0.48, 0);
      leg1.rotation.x = 0.46;
      leg1.castShadow = true;
      stand.add(leg1);

      // Diagonal Cross Tube 2
      const leg2 = new THREE.Mesh(
        new THREE.CylinderGeometry(tubeRadius, tubeRadius, 1.15, 12),
        this.standMaterial
      );
      leg2.position.set(x, 0.48, 0);
      leg2.rotation.x = -0.46;
      leg2.castShadow = true;
      stand.add(leg2);

      // Center Joint Knob
      const joint = new THREE.Mesh(
        new THREE.CylinderGeometry(0.024, 0.024, 0.035, 14),
        this.rubberMaterial
      );
      joint.rotation.z = Math.PI / 2;
      joint.position.set(x, 0.48, 0);
      stand.add(joint);

      // Tier 2 Riser Arm (holds upper synth - empty space when only 1 synth)
      const riser = new THREE.Mesh(
        new THREE.CylinderGeometry(tubeRadius * 0.85, tubeRadius * 0.85, 0.36, 12),
        this.standMaterial
      );
      riser.position.set(x, 1.10, -0.10);
      riser.rotation.x = -0.48;
      riser.castShadow = true;
      stand.add(riser);

      // Tier 2 Angled Support Arm
      const tier2Arm = new THREE.Mesh(
        new THREE.CylinderGeometry(tubeRadius * 0.85, tubeRadius * 0.85, 0.30, 12),
        this.standMaterial
      );
      tier2Arm.rotation.x = Math.PI / 2 + 0.16;
      tier2Arm.position.set(x, 1.22, -0.16);
      tier2Arm.castShadow = true;
      stand.add(tier2Arm);
    });

    // Horizontal crossbar
    const crossBar = new THREE.Mesh(
      new THREE.CylinderGeometry(tubeRadius * 0.8, tubeRadius * 0.8, 0.76, 12),
      this.standMaterial
    );
    crossBar.rotation.z = Math.PI / 2;
    crossBar.position.set(0, 0.48, 0);
    stand.add(crossBar);

    this.group.add(stand);
  }

  _buildTierRisers() {
    const riserGroup = new THREE.Group();
    const tubeRadius = 0.013;

    const rPrevY = 0.27 + (this.tier - 3) * 0.28;
    const rPrevZ = -0.16 - (this.tier - 3) * 0.16;
    const rCurrY = rPrevY + 0.28;
    const rCurrZ = rPrevZ - 0.16;

    [-0.38, 0.38].forEach(x => {
      const dy = rCurrY - rPrevY;
      const dz = rCurrZ - rPrevZ;
      const len = Math.sqrt(dy * dy + dz * dz);
      const angle = Math.atan2(dz, dy);

      const tube = new THREE.Mesh(
        new THREE.CylinderGeometry(tubeRadius, tubeRadius, len, 12),
        this.standMaterial
      );
      tube.position.set(x, (rPrevY + rCurrY) / 2, (rPrevZ + rCurrZ) / 2);
      tube.rotation.x = angle;
      tube.castShadow = true;
      riserGroup.add(tube);

      const arm = new THREE.Mesh(
        new THREE.CylinderGeometry(tubeRadius, tubeRadius, 0.30, 12),
        this.standMaterial
      );
      arm.rotation.x = Math.PI / 2 + 0.16 + (this.tier - 2) * 0.10;
      arm.position.set(x, rCurrY, rCurrZ);
      arm.castShadow = true;
      riserGroup.add(arm);
    });

    this.group.add(riserGroup);
  }

  _buildChassis() {
    const chassis = new THREE.Group();

    // Main angled case
    const body = new THREE.Mesh(new THREE.BoxGeometry(1.05, 0.08, 0.38), this.chassisMaterial);
    body.position.set(0, 0, 0);
    body.castShadow = true;
    chassis.add(body);

    // Aluminum / Anodized Side Panels (Cheeks)
    [-0.53, 0.53].forEach(cx => {
      const cheek = new THREE.Mesh(new THREE.BoxGeometry(0.024, 0.09, 0.39), this.cheekMaterial);
      cheek.position.set(cx, 0, 0);
      cheek.castShadow = true;
      chassis.add(cheek);
    });

    // Pitch Bend & Modulation Wheels (On left panel)
    const wheelGroup = new THREE.Group();
    wheelGroup.position.set(-0.44, 0.045, 0.08);

    const pbWheelGeom = new THREE.CylinderGeometry(0.026, 0.026, 0.016, 16);
    pbWheelGeom.rotateZ(Math.PI / 2);
    const pbWheel = new THREE.Mesh(pbWheelGeom, this.pitchWheelMaterial);
    wheelGroup.add(pbWheel);
    this.pitchWheel = pbWheel;

    const modWheel = new THREE.Mesh(pbWheelGeom, this.pitchWheelMaterial);
    modWheel.position.x = 0.035;
    wheelGroup.add(modWheel);

    chassis.add(wheelGroup);
    this.bodyGroup.add(chassis);
  }

  _buildPerformancePadsAndScreen() {
    // 16 RGB Trigger Pads (2x8 Matrix) on upper control panel
    const padStartX = -0.32;
    const padStartZ = -0.06;

    const padColors = {
      1: 0x00f0ff,
      2: 0xff00aa,
      3: 0xff8800,
      4: 0x00ff66
    };
    const padEmissiveColor = padColors[this.tier] || 0x00f0ff;

    for (let r = 0; r < 2; r++) {
      for (let c = 0; c < 8; c++) {
        const padGeom = new THREE.BoxGeometry(0.028, 0.008, 0.028);
        const padMat = new THREE.MeshStandardMaterial({
          color: 0x22222a,
          emissive: padEmissiveColor,
          emissiveIntensity: 0.15,
          roughness: 0.4
        });
        const pad = new THREE.Mesh(padGeom, padMat);
        pad.position.set(padStartX + c * 0.038, 0.045, padStartZ - r * 0.038);
        this.bodyGroup.add(pad);
        this.rgbPads.push(pad);
      }
    }

    // LCD Display Screen
    const screen = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.004, 0.07), this.lcdScreenMaterial);
    screen.position.set(0.15, 0.044, -0.08);
    this.bodyGroup.add(screen);

    // Mini spectrum bars on screen
    const barColors = {
      1: 0x00ffcc,
      2: 0xff33aa,
      3: 0xffaa00,
      4: 0x33ff88
    };
    const barColor = barColors[this.tier] || 0x00ffcc;
    for (let b = 0; b < 10; b++) {
      const barGeom = new THREE.BoxGeometry(0.010, 0.006, 0.04);
      const barMat = new THREE.MeshBasicMaterial({ color: barColor });
      const bar = new THREE.Mesh(barGeom, barMat);
      bar.position.set(0.08 + b * 0.015, 0.048, -0.08);
      this.bodyGroup.add(bar);
      this.spectrumBars.push(bar);
    }
  }

  _buildSynthKeys() {
    const keybedGroup = new THREE.Group();
    keybedGroup.position.set(0, 0.035, 0.09);

    const totalWhite = 28; // 4 octaves
    const keyWidth = 0.021;
    const keyLen = 0.135;
    const startX = -(totalWhite * keyWidth) / 2 + (keyWidth / 2);

    let whiteIdx = 0;
    const whitePositions = {};

    // White keys
    for (let midi = 36; midi <= 84; midi++) {
      const isBlack = [1, 3, 6, 8, 10].includes(midi % 12);
      if (!isBlack) {
        const x = startX + whiteIdx * keyWidth;
        whitePositions[midi] = x;

        const geom = new THREE.BoxGeometry(keyWidth * 0.92, 0.018, keyLen);
        const mat = this.whiteKeyMaterial.clone();
        const mesh = new THREE.Mesh(geom, mat);
        mesh.position.set(x, 0.009, keyLen / 2);
        mesh.castShadow = true;
        keybedGroup.add(mesh);

        this.keys[midi] = { mesh, material: mat, isBlack: false, baseY: 0.009 };
        whiteIdx++;
      }
    }

    // Black keys
    for (let midi = 36; midi <= 84; midi++) {
      const isBlack = [1, 3, 6, 8, 10].includes(midi % 12);
      if (isBlack && whitePositions[midi - 1] !== undefined && whitePositions[midi + 1] !== undefined) {
        const x = (whitePositions[midi - 1] + whitePositions[midi + 1]) / 2;
        const geom = new THREE.BoxGeometry(0.011, 0.016, 0.085);
        const mat = this.blackKeyMaterial.clone();
        const mesh = new THREE.Mesh(geom, mat);
        mesh.position.set(x, 0.020, 0.085 / 2);
        mesh.castShadow = true;
        keybedGroup.add(mesh);

        this.keys[midi] = { mesh, material: mat, isBlack: true, baseY: 0.020 };
      }
    }

    this.bodyGroup.add(keybedGroup);
  }

  onNoteOn(midiPitch, velocity = 0.8) {
    const vel = Math.max(0.3, Math.min(1.0, velocity));

    // 1. Key LED Glow & Press
    const key = this.keys[midiPitch] || this.keys[60];
    if (key) {
      gsap.killTweensOf(key.mesh.position);
      gsap.killTweensOf(key.material);

      const isDepressed = key.mesh.position.y < key.baseY - 0.002;
      const tl = gsap.timeline();
      if (isDepressed) {
        tl.to(key.mesh.position, { y: key.baseY, duration: 0.018, ease: 'power2.out' });
      }
      tl.to(key.mesh.position, { y: key.baseY - 0.009 * vel, duration: 0.028, ease: 'power2.out' })
        .to(key.mesh.position, { y: key.baseY, duration: 0.12, ease: 'power1.out' });

      const ledColors = {
        1: 0x00f0ff,
        2: 0xff00aa,
        3: 0xff8800,
        4: 0x00ff66
      };
      const emissiveColor = ledColors[this.tier] || 0x00f0ff;
      key.material.emissive = new THREE.Color(emissiveColor);
      key.material.emissiveIntensity = 2.6;
      gsap.to(key.material, {
        emissiveIntensity: 0,
        duration: 0.45,
        ease: 'power2.out'
      });
    }

    // 2. Trigger Random Performance Pad
    const padIdx = Math.floor(Math.random() * this.rgbPads.length);
    const pad = this.rgbPads[padIdx];
    if (pad) {
      pad.material.emissiveIntensity = 3.0 * vel;
      gsap.killTweensOf(pad.material);
      gsap.to(pad.material, {
        emissiveIntensity: 0.15,
        duration: 0.4
      });
    }

    // 3. Pitch Wheel slight rotational twitch
    if (this.pitchWheel) {
      gsap.killTweensOf(this.pitchWheel.rotation);
      gsap.timeline()
        .to(this.pitchWheel.rotation, { x: 0.35, duration: 0.05 })
        .to(this.pitchWheel.rotation, { x: 0, duration: 0.18, ease: 'elastic.out(1, 0.5)' });
    }

    // 4. Spectrum Screen Bars Dance
    this.spectrumBars.forEach(b => {
      gsap.to(b.scale, {
        z: 0.3 + Math.random() * 1.5 * vel,
        duration: 0.08,
        ease: 'power1.out'
      });
    });
  }

  onNoteOff(midiPitch) {}

  update(delta) {}
}
