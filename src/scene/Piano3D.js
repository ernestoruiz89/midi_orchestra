import * as THREE from 'three';
import gsap from 'gsap';

/**
 * Piano3D builds the iconic MIDIJam multi-tier stage keyboard workstation:
 * - 88-Key electronic stage piano / synthesizer with all 88 keys (MIDI 21 A0 to 108 C8).
 * - Authentic angular stage chassis with beveled cheek blocks and pitch/mod wheels.
 * - Tier 1 (Lower Keyboard): Warm Golden Amber metallic wood lacquer panel.
 * - Tier 2 (Upper Keyboard): Deep Crimson Mahogany / Cherry wood lacquer panel.
 * - Double-Tier black steel tubular X-stand with cross-bracing and upper riser arms.
 * - When multiple piano tracks exist, keyboards stack directly one above the other.
 * - High-speed mechanical key depression and emissive note feedback.
 */
export class Piano3D {
  constructor(scene, options = {}) {
    this.scene = scene;
    this.tier = options.tier || 1;
    this.hasStand = options.hasStand !== undefined ? options.hasStand : (this.tier === 1);

    this.group = new THREE.Group();
    // Base stage position on stage left
    this.group.position.set(-3.6, 0, 0.4);
    this.group.rotation.y = Math.PI * 0.14;

    this.keys = [];
    this.keyMeshes = {};

    this._buildMaterials();
    this._buildKeyboardChassis();
    this._build88Keys();

    if (this.hasStand) {
      this._buildDoubleTierXStand();
    } else if (this.tier >= 3) {
      this._buildTierRisers();
    }

    this.scene.add(this.group);
  }

  _buildMaterials() {
    // Top Fascia Finish for all 4 tiers:
    const tierColors = {
      1: 0xc49428, // Tier 1: Golden Amber metallic lacquer (#c49428)
      2: 0x7e1810, // Tier 2: Deep Crimson Mahogany wood lacquer (#7e1810)
      3: 0x14408e, // Tier 3: Royal Sapphire Cobalt Blue lacquer (#14408e)
      4: 0xe8e6df  // Tier 4: Alpine Pearl Ivory / Platinum lacquer (#e8e6df)
    };
    const fasciaColor = tierColors[this.tier] || 0xc49428;
    const fasciaRoughness = this.tier === 1 ? 0.22 : 0.18;

    this.fasciaMaterial = new THREE.MeshPhysicalMaterial({
      color: fasciaColor,
      roughness: fasciaRoughness,
      metalness: 0.35,
      clearcoat: 0.9,
      clearcoatRoughness: 0.08
    });

    // Dark Charcoal / Matte Black Side Cheeks & Base
    this.chassisDarkMaterial = new THREE.MeshStandardMaterial({
      color: 0x1a1a1e,
      roughness: 0.45,
      metalness: 0.25
    });

    // Control Panel Surface (brushed dark metal)
    this.panelSurfaceMaterial = new THREE.MeshStandardMaterial({
      color: 0x24242a,
      roughness: 0.35,
      metalness: 0.55
    });

    // Black Tubular Steel Stand
    this.standMaterial = new THREE.MeshStandardMaterial({
      color: 0x1e1e22,
      roughness: 0.50,
      metalness: 0.60
    });

    // Rubber Feet & End Caps
    this.rubberMaterial = new THREE.MeshStandardMaterial({
      color: 0x121214,
      roughness: 0.85,
      metalness: 0.05
    });

    // Pitch Bend & Mod Wheels
    this.wheelMaterial = new THREE.MeshStandardMaterial({
      color: 0x2b2b32,
      roughness: 0.30,
      metalness: 0.40
    });

    // White Key Material (Polished Ivory)
    this.whiteKeyMaterial = new THREE.MeshStandardMaterial({
      color: 0xfbfbfa,
      roughness: 0.18,
      metalness: 0.02
    });

    // Black Key Material (Matte Ebony)
    this.blackKeyMaterial = new THREE.MeshStandardMaterial({
      color: 0x141416,
      roughness: 0.32,
      metalness: 0.08
    });

    // Red Felt Bushing Strip behind keys
    this.feltMaterial = new THREE.MeshStandardMaterial({
      color: 0x8a0e1a,
      roughness: 0.90,
      metalness: 0.0
    });
  }

  _buildKeyboardChassis() {
    // Keyboard body container with tier height and tilt
    this.keyboardBody = new THREE.Group();

    const tierConfigs = {
      1: { y: 0.78, z: 0.05, rotX: 0.04 },
      2: { y: 1.06, z: -0.16, rotX: 0.18 },
      3: { y: 1.34, z: -0.37, rotX: 0.28 },
      4: { y: 1.62, z: -0.58, rotX: 0.38 }
    };
    const cfg = tierConfigs[this.tier] || tierConfigs[1];
    this.keyboardBody.position.set(0, cfg.y, cfg.z);
    this.keyboardBody.rotation.x = cfg.rotX;

    const totalWidth = 1.38;  // Fits 88 keys + left wheel controller + side cheeks
    const depth = 0.33;
    const height = 0.085;

    // 1. Lower Main Chassis Case
    const baseBox = new THREE.Mesh(
      new THREE.BoxGeometry(totalWidth, height, depth),
      this.chassisDarkMaterial
    );
    baseBox.position.set(0, height / 2, 0);
    baseBox.castShadow = true;
    baseBox.receiveShadow = true;
    this.keyboardBody.add(baseBox);

    // 2. Slanted Top Fascia Panel (The iconic Golden or Crimson wood accent from MIDIJam)
    const fasciaWidth = totalWidth - 0.04;
    const fasciaDepth = 0.17;
    const fasciaHeight = 0.045;

    const fasciaBox = new THREE.Mesh(
      new THREE.BoxGeometry(fasciaWidth, fasciaHeight, fasciaDepth),
      this.fasciaMaterial
    );
    fasciaBox.position.set(0, height + fasciaHeight / 2 - 0.005, -depth / 2 + fasciaDepth / 2 + 0.01);
    fasciaBox.rotation.x = -0.12; // Slanted towards the player
    fasciaBox.castShadow = true;
    this.keyboardBody.add(fasciaBox);

    // 3. Control Panel Stripe (Subtle sliders & display inset)
    const controlStrip = new THREE.Mesh(
      new THREE.BoxGeometry(fasciaWidth * 0.85, 0.006, 0.11),
      this.panelSurfaceMaterial
    );
    controlStrip.position.set(0, height + fasciaHeight + 0.002, -depth / 2 + fasciaDepth / 2 + 0.01);
    controlStrip.rotation.x = -0.12;
    this.keyboardBody.add(controlStrip);

    // Display Screen inset in center of control strip
    const screenGeom = new THREE.BoxGeometry(0.14, 0.004, 0.05);
    const screenMat = new THREE.MeshBasicMaterial({ color: 0x0a3055 });
    const screenMesh = new THREE.Mesh(screenGeom, screenMat);
    screenMesh.position.set(0, height + fasciaHeight + 0.006, -depth / 2 + fasciaDepth / 2 + 0.01);
    screenMesh.rotation.x = -0.12;
    this.keyboardBody.add(screenMesh);

    // 4. Angled Cheek Blocks (Left and Right ends)
    [-totalWidth / 2 + 0.015, totalWidth / 2 - 0.015].forEach(x => {
      const cheek = new THREE.Mesh(
        new THREE.BoxGeometry(0.03, height * 1.35, depth * 1.02),
        this.chassisDarkMaterial
      );
      cheek.position.set(x, height * 0.72, 0);
      cheek.castShadow = true;
      this.keyboardBody.add(cheek);
    });

    // 5. Left Controller Area: Pitch Bend and Modulation Wheels
    const wheelX = -totalWidth / 2 + 0.055;
    [-0.018, 0.018].forEach(offsetZ => {
      const wheelSlot = new THREE.Mesh(
        new THREE.BoxGeometry(0.018, 0.005, 0.06),
        this.chassisDarkMaterial
      );
      wheelSlot.position.set(wheelX, height + 0.002, 0.05 + offsetZ);
      this.keyboardBody.add(wheelSlot);

      const wheel = new THREE.Mesh(
        new THREE.CylinderGeometry(0.024, 0.024, 0.012, 16),
        this.wheelMaterial
      );
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(wheelX, height + 0.012, 0.05 + offsetZ);
      this.keyboardBody.add(wheel);
    });

    // 6. Red Felt Strip along keybed rear edge
    const felt = new THREE.Mesh(
      new THREE.BoxGeometry(1.22, 0.008, 0.015),
      this.feltMaterial
    );
    felt.position.set(0.045, height + 0.015, -0.002);
    this.keyboardBody.add(felt);

    this.group.add(this.keyboardBody);
  }

  _build88Keys() {
    const keybedGroup = new THREE.Group();
    // Placed right on the front shelf of keyboard body
    keybedGroup.position.set(0.045, 0.085, 0.005);
    this.keyboardBody.add(keybedGroup);

    const totalWhiteKeys = 52;
    const whiteKeyWidth = 0.0232;  // 23.2 mm (1.206 m span)
    const whiteKeyLength = 0.145;
    const whiteKeyHeight = 0.020;

    const blackKeyWidth = 0.0115;
    const blackKeyLength = 0.092;
    const blackKeyHeight = 0.018;

    const keyboardStartX = -(totalWhiteKeys * whiteKeyWidth) / 2 + (whiteKeyWidth / 2);

    let whiteKeyIndex = 0;
    const whiteKeyPositions = {};

    // 1. Create 52 White Keys
    for (let midi = 21; midi <= 108; midi++) {
      const noteInOctave = midi % 12;
      const isBlack = [1, 3, 6, 8, 10].includes(noteInOctave);

      if (!isBlack) {
        const xPos = keyboardStartX + (whiteKeyIndex * whiteKeyWidth);
        whiteKeyPositions[midi] = xPos;

        const pivotGroup = new THREE.Group();
        pivotGroup.position.set(xPos, 0, 0);

        const keyGeom = new THREE.BoxGeometry(whiteKeyWidth * 0.93, whiteKeyHeight, whiteKeyLength);
        const keyMat = this.whiteKeyMaterial.clone();
        const keyMesh = new THREE.Mesh(keyGeom, keyMat);
        keyMesh.position.set(0, whiteKeyHeight / 2, whiteKeyLength / 2);
        keyMesh.castShadow = true;
        keyMesh.receiveShadow = true;

        pivotGroup.add(keyMesh);
        keybedGroup.add(pivotGroup);

        this.keyMeshes[midi] = {
          pivot: pivotGroup,
          mesh: keyMesh,
          mat: keyMat,
          baseColor: keyMat.color.getHex(),
          isBlack: false,
          activeCount: 0
        };

        whiteKeyIndex++;
      }
    }

    // 2. Create 36 Black Keys
    for (let midi = 21; midi <= 108; midi++) {
      const noteInOctave = midi % 12;
      const isBlack = [1, 3, 6, 8, 10].includes(noteInOctave);

      if (isBlack) {
        const prevWhiteX = whiteKeyPositions[midi - 1];
        const nextWhiteX = whiteKeyPositions[midi + 1];
        const xPos = (prevWhiteX !== undefined && nextWhiteX !== undefined)
          ? (prevWhiteX + nextWhiteX) / 2
          : keyboardStartX;

        const pivotGroup = new THREE.Group();
        pivotGroup.position.set(xPos, whiteKeyHeight * 0.72, 0);

        const keyGeom = new THREE.BoxGeometry(blackKeyWidth, blackKeyHeight, blackKeyLength);
        const keyMat = this.blackKeyMaterial.clone();
        const keyMesh = new THREE.Mesh(keyGeom, keyMat);
        keyMesh.position.set(0, blackKeyHeight / 2, blackKeyLength / 2);
        keyMesh.castShadow = true;

        pivotGroup.add(keyMesh);
        keybedGroup.add(pivotGroup);

        this.keyMeshes[midi] = {
          pivot: pivotGroup,
          mesh: keyMesh,
          mat: keyMat,
          baseColor: keyMat.color.getHex(),
          isBlack: true,
          activeCount: 0
        };
      }
    }
  }

  /**
   * Builds the authentic double-tier tubular steel X-stand matching MIDIJam
   */
  _buildDoubleTierXStand() {
    const standGroup = new THREE.Group();
    const tubeRadius = 0.016;

    // Left and Right X-Cross Assemblies
    [-0.46, 0.46].forEach(x => {
      // Bottom Foot Tube resting on floor
      const foot = new THREE.Mesh(
        new THREE.CylinderGeometry(tubeRadius, tubeRadius, 0.52, 12),
        this.standMaterial
      );
      foot.rotation.x = Math.PI / 2;
      foot.position.set(x, 0.02, 0);
      foot.castShadow = true;
      standGroup.add(foot);

      // Rubber end caps on bottom foot
      [-0.26, 0.26].forEach(z => {
        const cap = new THREE.Mesh(
          new THREE.CylinderGeometry(tubeRadius + 0.005, tubeRadius + 0.005, 0.04, 12),
          this.rubberMaterial
        );
        cap.rotation.x = Math.PI / 2;
        cap.position.set(x, 0.02, z);
        standGroup.add(cap);
      });

      // Top Support Arm holding Tier 1 Keyboard
      const topArm = new THREE.Mesh(
        new THREE.CylinderGeometry(tubeRadius, tubeRadius, 0.42, 12),
        this.standMaterial
      );
      topArm.rotation.x = Math.PI / 2;
      topArm.position.set(x, 0.77, 0.05);
      topArm.castShadow = true;
      standGroup.add(topArm);

      // Diagonal Cross Tube 1 (Front Bottom to Back Top)
      const leg1 = new THREE.Mesh(
        new THREE.CylinderGeometry(tubeRadius, tubeRadius, 0.96, 12),
        this.standMaterial
      );
      leg1.position.set(x, 0.39, 0.03);
      leg1.rotation.x = 0.44;
      leg1.castShadow = true;
      standGroup.add(leg1);

      // Diagonal Cross Tube 2 (Back Bottom to Front Top)
      const leg2 = new THREE.Mesh(
        new THREE.CylinderGeometry(tubeRadius, tubeRadius, 0.96, 12),
        this.standMaterial
      );
      leg2.position.set(x, 0.39, 0.03);
      leg2.rotation.x = -0.44;
      leg2.castShadow = true;
      standGroup.add(leg2);

      // Central Joint Knob
      const joint = new THREE.Mesh(
        new THREE.CylinderGeometry(0.026, 0.026, 0.04, 16),
        this.rubberMaterial
      );
      joint.rotation.z = Math.PI / 2;
      joint.position.set(x, 0.39, 0.03);
      standGroup.add(joint);

      // Tier 2 Riser Arm (Extends up and back from rear of Tier 1 to hold Tier 2)
      const riser = new THREE.Mesh(
        new THREE.CylinderGeometry(tubeRadius * 0.85, tubeRadius * 0.85, 0.38, 12),
        this.standMaterial
      );
      riser.position.set(x, 0.92, -0.10);
      riser.rotation.x = -0.48;
      riser.castShadow = true;
      standGroup.add(riser);

      // Tier 2 Angled Support Arm
      const tier2Arm = new THREE.Mesh(
        new THREE.CylinderGeometry(tubeRadius * 0.85, tubeRadius * 0.85, 0.32, 12),
        this.standMaterial
      );
      tier2Arm.rotation.x = Math.PI / 2 + 0.18;
      tier2Arm.position.set(x, 1.05, -0.16);
      tier2Arm.castShadow = true;
      standGroup.add(tier2Arm);
    });

    // Horizontal Center Cross-Brace
    const crossBrace = new THREE.Mesh(
      new THREE.CylinderGeometry(tubeRadius * 0.8, tubeRadius * 0.8, 0.92, 12),
      this.standMaterial
    );
    crossBrace.rotation.z = Math.PI / 2;
    crossBrace.position.set(0, 0.39, 0.03);
    standGroup.add(crossBrace);

    this.group.add(standGroup);
  }

  /**
   * Builds riser extension tubes connecting this upper tier to the tier beneath it
   */
  _buildTierRisers() {
    const riserGroup = new THREE.Group();
    const tubeRadius = 0.013;

    const prevY = this.tier === 3 ? 1.05 : 1.33;
    const prevZ = this.tier === 3 ? -0.16 : -0.37;
    const currY = this.tier === 3 ? 1.33 : 1.61;
    const currZ = this.tier === 3 ? -0.37 : -0.58;

    [-0.46, 0.46].forEach(x => {
      const dy = currY - prevY;
      const dz = currZ - prevZ;
      const len = Math.sqrt(dy * dy + dz * dz);
      const angle = Math.atan2(dz, dy);

      // Connecting diagonal riser tube
      const tube = new THREE.Mesh(
        new THREE.CylinderGeometry(tubeRadius, tubeRadius, len, 12),
        this.standMaterial
      );
      tube.position.set(x, (prevY + currY) / 2, (prevZ + currZ) / 2);
      tube.rotation.x = angle;
      tube.castShadow = true;
      riserGroup.add(tube);

      // Support arm holding this tier's keyboard
      const arm = new THREE.Mesh(
        new THREE.CylinderGeometry(tubeRadius, tubeRadius, 0.32, 12),
        this.standMaterial
      );
      arm.rotation.x = Math.PI / 2 + (this.tier === 3 ? 0.28 : 0.38);
      arm.position.set(x, currY, currZ);
      arm.castShadow = true;
      riserGroup.add(arm);
    });

    this.group.add(riserGroup);
  }

  // Note-On Event Trigger
  onNoteOn(midiPitch, velocity = 0.8) {
    const keyData = this.keyMeshes[midiPitch];
    if (!keyData) return;

    keyData.activeCount++;
    const vel = Math.max(0.4, Math.min(1.0, velocity));

    // Responsive mechanical downward key rotation
    const maxDepressAngle = keyData.isBlack ? 0.055 : 0.068;
    const targetAngle = maxDepressAngle * (0.6 + 0.4 * vel);

    gsap.killTweensOf(keyData.pivot.rotation);
    gsap.to(keyData.pivot.rotation, {
      x: targetAngle,
      duration: 0.035,
      ease: 'power3.out'
    });

    // Glow highlight on key
    const emissiveColor = keyData.isBlack ? 0x00d4ff : 0x00f0ff;
    keyData.mat.emissive.setHex(emissiveColor);
    keyData.mat.emissiveIntensity = 0.85 * vel;
  }

  // Note-Off Event Trigger
  onNoteOff(midiPitch, force = false) {
    const keyData = this.keyMeshes[midiPitch];
    if (!keyData) return;

    if (force) {
      keyData.activeCount = 0;
    } else {
      keyData.activeCount = Math.max(0, keyData.activeCount - 1);
    }

    if (keyData.activeCount === 0) {
      gsap.killTweensOf(keyData.pivot.rotation);
      gsap.to(keyData.pivot.rotation, {
        x: 0,
        duration: 0.08,
        ease: 'elastic.out(1.2, 0.6)'
      });

      gsap.to(keyData.mat, {
        emissiveIntensity: 0,
        duration: 0.12,
        ease: 'power2.out'
      });
    }
  }

  update() {}
}
