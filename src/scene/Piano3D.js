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
    this.pedalTongue = null;
    this.activeNoteCount = 0;
    this.pressedWhiteColor = new THREE.Color(0x00b9d4);
    this.displayCanvas = null;
    this.displayContext = null;
    this.displayTexture = null;
    this.midiProgramLabel = 'CONCERT GRAND 88';

    this._buildMaterials();
    this._buildKeyboardChassis();
    this._build88Keys();

    if (this.hasStand) {
      this._buildDoubleTierXStand();
      if (this.tier === 1) {
        this._buildSustainPedal();

        // Subtle floor accent for sustain pedal & cable (avoiding harsh glare)
        const pedalLight = new THREE.PointLight(0xffeedd, 0.8, 1.4, 2.0);
        pedalLight.position.set(0.14, 0.35, 0.30);
        this.group.add(pedalLight);
      }
    } else if (this.tier >= 3) {
      this._buildTierRisers();
    }

    this.scene.add(this.group);
  }

  _buildMaterials() {
    // Top Fascia Finish for all 4 tiers:
    // Tier 1 MUST BE NEGRO: High-Gloss Piano Black Lacquer (Concert Ebony)
    const tierColors = {
      1: 0x141418, // Tier 1: Deep Gloss Ebony Piano Black (#141418)
      2: 0x82161c, // Tier 2: Deep Crimson Wine / Burgundy Velvet (#82161c)
      3: 0x0e3268, // Tier 3: Midnight Cobalt Sapphire Blue (#0e3268)
      4: 0xe8e6e0  // Tier 4: Alpine Pearl Platinum / Ivory (#e8e6e0)
    };
    const fasciaColor = tierColors[this.tier] || 0x141418;

    // 1. Luxurious High-Gloss Piano Lacquer with deep clearcoat
    this.fasciaMaterial = new THREE.MeshPhysicalMaterial({
      color: fasciaColor,
      roughness: 0.12,
      metalness: 0.14,
      clearcoat: 1.0,
      clearcoatRoughness: 0.03,
      reflectivity: 0.90
    });

    // 2. High-Gloss Ebony Black for main chassis body and side cheeks
    this.pianoBlackMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x141418,
      roughness: 0.14,
      metalness: 0.12,
      clearcoat: 0.98,
      clearcoatRoughness: 0.04
    });

    // 3. Satin Dark Charcoal for chassis base plate & inner structure
    this.chassisDarkMaterial = new THREE.MeshStandardMaterial({
      color: 0x121216,
      roughness: 0.40,
      metalness: 0.30
    });

    // 4. Dark Brushed Anodized Aluminum Console Surface
    this.panelSurfaceMaterial = new THREE.MeshStandardMaterial({
      color: 0x1e1e24,
      roughness: 0.30,
      metalness: 0.68
    });

    // 5. Mirror Polished Chrome Trim & Hardware (screws, jacks, pedal lever, knobs)
    this.chromeMaterial = new THREE.MeshStandardMaterial({
      color: 0xf2f4f7,
      roughness: 0.08,
      metalness: 0.98
    });

    // 6. Brushed Gold Brand Nameplate Badge
    this.goldBadgeMaterial = new THREE.MeshStandardMaterial({
      color: 0xd4af37,
      roughness: 0.24,
      metalness: 0.90
    });

    // 7. Matte Black Powder-Coated Tubular Steel Stand
    this.standMaterial = new THREE.MeshStandardMaterial({
      color: 0x141418,
      roughness: 0.45,
      metalness: 0.75
    });

    // 8. High-Density Ribbed Rubber Feet, End Caps & Grip Sleeves
    this.rubberMaterial = new THREE.MeshStandardMaterial({
      color: 0x0e0e10,
      roughness: 0.85,
      metalness: 0.05
    });

    // 9. Pitch Bend & Modulation Wheels (Ribbed texturized rubber)
    this.wheelMaterial = new THREE.MeshStandardMaterial({
      color: 0x222228,
      roughness: 0.40,
      metalness: 0.30
    });

    // 10. Soft Cyan Backlit Interior Slot Glow
    this.wheelGlowMaterial = new THREE.MeshBasicMaterial({
      color: 0x00d4ff
    });

    // 11. White Key Material (Authentic Mineral Ivory with soft satin finish - avoids glare blowout)
    this.whiteKeyMaterial = new THREE.MeshStandardMaterial({
      color: 0xdcdad4,
      roughness: 0.44,
      metalness: 0.0
    });

    // 12. Dark Key Separation Side Material (Creates crisp, photorealistic gap seams between keys)
    this.keySideMaterial = new THREE.MeshStandardMaterial({
      color: 0x16161a,
      roughness: 0.65,
      metalness: 0.05
    });

    // 13. Black Key Material (Matte Ebony with delicate tactile texture)
    this.blackKeyMaterial = new THREE.MeshStandardMaterial({
      color: 0x111114,
      roughness: 0.45,
      metalness: 0.04
    });

    // 14. Rich Crimson Red Baize Acoustic Felt Bushing Strip behind keys
    this.feltMaterial = new THREE.MeshStandardMaterial({
      color: 0xa81422,
      roughness: 0.92,
      metalness: 0.0
    });
  }

  _createDisplayTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    this.displayCanvas = canvas;
    this.displayContext = ctx;

    // Deep OLED dark navy background
    ctx.fillStyle = '#040914';
    ctx.fillRect(0, 0, 512, 128);

    // Fine display scanlines add the character of an OLED panel without
    // covering the preset lettering.
    ctx.fillStyle = 'rgba(0, 200, 255, 0.03)';
    for (let y = 0; y < 128; y += 4) ctx.fillRect(0, y, 512, 2);

    // Top status line
    ctx.fillStyle = '#4da6ff';
    ctx.font = 'bold 16px "Courier New", monospace';
    ctx.fillText('MIDI CH: 01   TEMPO: 120   TRANS: 0', 16, 24);

    // Main MIDI preset name (updated when the assigned track is known).
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 30px "Segoe UI", sans-serif';
    ctx.fillText(this.midiProgramLabel, 16, 68);

    // Subtitle / Settings
    ctx.fillStyle = '#00ffcc';
    ctx.font = '18px "Segoe UI", sans-serif';
    ctx.fillText('DYNAMIC STEREO  |  REV: 28%  |  TOUCH: HEAVY', 16, 104);

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    this.displayTexture = texture;
    return texture;
  }

  setMidiProgramName(name, programNumber = null, channel = null) {
    const label = String(name || 'CONCERT GRAND 88').toUpperCase().slice(0, 24);
    this.midiProgramLabel = label;
    const ctx = this.displayContext;
    const canvas = this.displayCanvas;
    if (!ctx || !canvas) return;
    ctx.fillStyle = '#040914';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'rgba(0, 200, 255, 0.03)';
    for (let y = 0; y < 128; y += 4) ctx.fillRect(0, y, 512, 2);
    ctx.fillStyle = '#4da6ff';
    ctx.font = 'bold 16px "Courier New", monospace';
    const midiChannel = Number.isInteger(channel) ? String(channel + 1).padStart(2, '0') : '01';
    ctx.fillText(`MIDI CH: ${midiChannel}   PROGRAM: ${Number.isInteger(programNumber) ? String(programNumber + 1).padStart(3, '0') : '---'}`, 16, 24);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 30px "Segoe UI", sans-serif';
    ctx.fillText(label, 16, 68);
    ctx.fillStyle = '#00ffcc';
    ctx.font = '18px "Segoe UI", sans-serif';
    ctx.fillText('GENERAL MIDI PRESET  |  DYNAMIC STEREO', 16, 104);
    if (this.displayTexture) this.displayTexture.needsUpdate = true;
  }

  _createBadgeTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 96;
    const ctx = canvas.getContext('2d');

    // Brushed gold metallic gradient
    const grad = ctx.createLinearGradient(0, 0, 512, 96);
    grad.addColorStop(0, '#9a711c');
    grad.addColorStop(0.2, '#f6e298');
    grad.addColorStop(0.5, '#d4af37');
    grad.addColorStop(0.8, '#fdf4d0');
    grad.addColorStop(1, '#8e6513');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 96);

    // Beveled plaque double frame
    ctx.strokeStyle = '#4e3305';
    ctx.lineWidth = 6;
    ctx.strokeRect(6, 6, 500, 84);
    ctx.strokeStyle = '#fff8e0';
    ctx.lineWidth = 3;
    ctx.strokeRect(12, 12, 488, 72);

    // Brand nameplate lettering
    ctx.font = 'bold 36px "Georgia", "Times New Roman", serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.fillText('•  CONCERT GRAND 88  •', 256, 50);
    ctx.fillStyle = '#201302';
    ctx.fillText('•  CONCERT GRAND 88  •', 256, 47);

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    return texture;
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
    const depth = 0.34;
    const height = 0.088;

    // 1. Lower Main Chassis Case (High-Gloss Ebony Piano Black)
    const baseBox = new THREE.Mesh(
      new THREE.BoxGeometry(totalWidth, height, depth),
      this.pianoBlackMaterial
    );
    baseBox.position.set(0, height / 2, 0);
    baseBox.castShadow = true;
    baseBox.receiveShadow = true;
    this.keyboardBody.add(baseBox);

    // Front Keybed Apron Lip (The authentic front rail below the white keys)
    const frontLipGeom = new THREE.BoxGeometry(1.23, 0.024, 0.038);
    const frontLip = new THREE.Mesh(frontLipGeom, this.pianoBlackMaterial);
    frontLip.position.set(0.045, height - 0.012, depth / 2 - 0.019);
    frontLip.castShadow = true;
    this.keyboardBody.add(frontLip);

    // 2. Slanted Top Fascia Panel (Glossy Piano Black for Tier 1!)
    const fasciaWidth = totalWidth - 0.04;
    const fasciaDepth = 0.175;
    const fasciaHeight = 0.048;

    const fasciaBox = new THREE.Mesh(
      new THREE.BoxGeometry(fasciaWidth, fasciaHeight, fasciaDepth),
      this.fasciaMaterial
    );
    fasciaBox.position.set(0, height + fasciaHeight / 2 - 0.005, -depth / 2 + fasciaDepth / 2 + 0.012);
    fasciaBox.rotation.x = -0.11; // Slanted gently towards the player
    fasciaBox.castShadow = true;
    this.keyboardBody.add(fasciaBox);

    // Slender Mirror-Chrome Inset Trim Strip along the fascia seam
    const trimStripGeom = new THREE.BoxGeometry(fasciaWidth, 0.003, 0.004);
    const trimStrip = new THREE.Mesh(trimStripGeom, this.chromeMaterial);
    trimStrip.position.set(0, height + 0.004, -depth / 2 + fasciaDepth + 0.010);
    this.keyboardBody.add(trimStrip);

    // 3. Console Gold Brand Nameplate Badge (Embossed "CONCERT GRAND 88")
    const badgeWidth = 0.20;
    const badgeHeight = 0.040;
    const badgeBackGeom = new THREE.BoxGeometry(badgeWidth + 0.008, 0.004, badgeHeight + 0.006);
    const badgeBack = new THREE.Mesh(badgeBackGeom, this.chassisDarkMaterial);
    badgeBack.position.set(0.40, height + fasciaHeight + 0.004, -depth / 2 + fasciaDepth / 2 + 0.012);
    badgeBack.rotation.x = -0.11;
    this.keyboardBody.add(badgeBack);

    const badgeTex = this._createBadgeTexture();
    const badgeGeom = new THREE.PlaneGeometry(badgeWidth, badgeHeight);
    const badgeMat = new THREE.MeshStandardMaterial({
      map: badgeTex,
      metalness: 0.88,
      roughness: 0.18,
      emissive: 0x443010,
      emissiveIntensity: 0.45,
      side: THREE.DoubleSide
    });
    const badge = new THREE.Mesh(badgeGeom, badgeMat);
    badge.position.set(0.40, height + fasciaHeight + 0.007, -depth / 2 + fasciaDepth / 2 + 0.012);
    badge.rotation.x = -Math.PI / 2 - 0.11;
    this.keyboardBody.add(badge);

    // 4. Control Panel Surface (Brushed Dark Metal Console)
    const panelWidth = fasciaWidth * 0.88;
    const controlStrip = new THREE.Mesh(
      new THREE.BoxGeometry(panelWidth, 0.006, 0.125),
      this.panelSurfaceMaterial
    );
    controlStrip.position.set(0, height + fasciaHeight + 0.002, -depth / 2 + fasciaDepth / 2 + 0.012);
    controlStrip.rotation.x = -0.11;
    this.keyboardBody.add(controlStrip);

    // High-Resolution Graphic OLED Display Screen
    const screenWidth = 0.16;
    const screenDepth = 0.055;
    const screenGeom = new THREE.BoxGeometry(screenWidth, 0.004, screenDepth);
    const displayTex = this._createDisplayTexture();
    const screenMat = new THREE.MeshBasicMaterial({ map: displayTex });
    const screenMesh = new THREE.Mesh(screenGeom, screenMat);
    screenMesh.position.set(0, height + fasciaHeight + 0.006, -depth / 2 + fasciaDepth / 2 + 0.012);
    screenMesh.rotation.x = -0.11;
    this.keyboardBody.add(screenMesh);

    // Display Bezel Frame (Polished chrome border)
    const bezelGeom = new THREE.BoxGeometry(screenWidth + 0.008, 0.003, screenDepth + 0.008);
    const bezel = new THREE.Mesh(bezelGeom, this.chromeMaterial);
    bezel.position.set(0, height + fasciaHeight + 0.0045, -depth / 2 + fasciaDepth / 2 + 0.012);
    bezel.rotation.x = -0.11;
    this.keyboardBody.add(bezel);

    // Precision Machined Aluminum Knobs (Volume, EQ Low, Mid, High, Reverb, Chorus)
    [-0.32, -0.26, -0.20, 0.20, 0.26, 0.32].forEach(kx => {
      const knobGeom = new THREE.CylinderGeometry(0.011, 0.011, 0.013, 16);
      const knob = new THREE.Mesh(knobGeom, this.chromeMaterial);
      knob.position.set(kx, height + fasciaHeight + 0.011, -depth / 2 + fasciaDepth / 2 + 0.012);
      knob.rotation.x = -0.11;
      this.keyboardBody.add(knob);

      // Indicator Pointer Notch
      const pointerGeom = new THREE.BoxGeometry(0.002, 0.002, 0.008);
      const pointerMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
      const pointer = new THREE.Mesh(pointerGeom, pointerMat);
      pointer.position.set(kx, height + fasciaHeight + 0.018, -depth / 2 + fasciaDepth / 2 + 0.008);
      pointer.rotation.x = -0.11;
      this.keyboardBody.add(pointer);
    });

    // Tactile Backlit Sound Category Buttons (Piano, E-Piano, Clav, Synth, Strings, Organ)
    [-0.14, -0.10, 0.10, 0.14].forEach((bx, idx) => {
      const btnGeom = new THREE.BoxGeometry(0.016, 0.006, 0.014);
      const btnMat = new THREE.MeshStandardMaterial({
        color: 0x1e2430,
        emissive: idx === 0 ? 0x00d4ff : 0x0a1622,
        emissiveIntensity: idx === 0 ? 0.9 : 0.2,
        roughness: 0.4
      });
      const btn = new THREE.Mesh(btnGeom, btnMat);
      btn.position.set(bx, height + fasciaHeight + 0.007, -depth / 2 + fasciaDepth / 2 + 0.012);
      btn.rotation.x = -0.11;
      this.keyboardBody.add(btn);
    });

    // 5. Sculptured Cheek Blocks (Left and Right ends in Ebony Piano Finish with Allen Bolts)
    [-totalWidth / 2 + 0.016, totalWidth / 2 - 0.016].forEach((x, isRight) => {
      const cheekGeom = new THREE.BoxGeometry(0.032, height * 1.34, depth * 1.02);
      const cheek = new THREE.Mesh(cheekGeom, this.pianoBlackMaterial);
      cheek.position.set(x, height * 0.70, 0);
      cheek.castShadow = true;
      this.keyboardBody.add(cheek);

      // Stainless Steel Allen Hex Bolts on side cheek
      [-0.08, 0.08].forEach(bz => {
        const boltGeom = new THREE.CylinderGeometry(0.0045, 0.0045, 0.004, 12);
        boltGeom.rotateZ(Math.PI / 2);
        const bolt = new THREE.Mesh(boltGeom, this.chromeMaterial);
        bolt.position.set(x + (isRight ? 0.016 : -0.016), height * 0.70, bz);
        this.keyboardBody.add(bolt);
      });
    });

    // 6. Left Controller Bay: Pitch Bend & Modulation Wheels
    const wheelBayX = -totalWidth / 2 + 0.058;
    [-0.024, 0.024].forEach((offsetZ, idx) => {
      // Recessed Well
      const wellGeom = new THREE.BoxGeometry(0.022, 0.014, 0.072);
      const well = new THREE.Mesh(wellGeom, this.chassisDarkMaterial);
      well.position.set(wheelBayX, height + 0.002, 0.05 + offsetZ);
      this.keyboardBody.add(well);

      // Soft Cyan LED Underglow Strip inside wheel slot
      const glowGeom = new THREE.PlaneGeometry(0.014, 0.055);
      const glow = new THREE.Mesh(glowGeom, this.wheelGlowMaterial);
      glow.rotation.x = -Math.PI / 2;
      glow.position.set(wheelBayX, height - 0.004, 0.05 + offsetZ);
      this.keyboardBody.add(glow);

      // Ribbed Rubber Wheel
      const wheelGeom = new THREE.CylinderGeometry(0.026, 0.026, 0.014, 20);
      const wheel = new THREE.Mesh(wheelGeom, this.wheelMaterial);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(wheelBayX, height + 0.012, 0.05 + offsetZ);
      this.keyboardBody.add(wheel);

      // Chrome Center Pivot Disc
      const discGeom = new THREE.CylinderGeometry(0.008, 0.008, 0.015, 16);
      discGeom.rotateZ(Math.PI / 2);
      const disc = new THREE.Mesh(discGeom, this.chromeMaterial);
      disc.position.set(wheelBayX, height + 0.012, 0.05 + offsetZ);
      this.keyboardBody.add(disc);
    });

    // 7. Rear Connection Panel (Audio Outs, MIDI DIN Ports, Damper Jack, USB, Power Switch)
    const rearY = height * 0.55;
    const rearZ = -depth / 2 - 0.001;

    // Output L / R Chrome Jacks
    [-0.22, -0.17].forEach(jx => {
      const jackGeom = new THREE.CylinderGeometry(0.006, 0.006, 0.006, 12);
      jackGeom.rotateX(Math.PI / 2);
      const jack = new THREE.Mesh(jackGeom, this.chromeMaterial);
      jack.position.set(jx, rearY, rearZ);
      this.keyboardBody.add(jack);
    });

    // 3 MIDI DIN Sockets (In, Out, Thru)
    [-0.08, -0.04, 0.0].forEach(mx => {
      const midiGeom = new THREE.CylinderGeometry(0.008, 0.008, 0.005, 12);
      midiGeom.rotateX(Math.PI / 2);
      const midiPort = new THREE.Mesh(midiGeom, this.chassisDarkMaterial);
      midiPort.position.set(mx, rearY, rearZ);
      this.keyboardBody.add(midiPort);
    });

    // Damper / Sustain Pedal Jack
    const damperJackGeom = new THREE.CylinderGeometry(0.006, 0.006, 0.006, 12);
    damperJackGeom.rotateX(Math.PI / 2);
    const damperJack = new THREE.Mesh(damperJackGeom, this.chromeMaterial);
    damperJack.position.set(0.14, rearY, rearZ);
    this.keyboardBody.add(damperJack);

    // Red Power Rocker Switch
    const switchGeom = new THREE.BoxGeometry(0.018, 0.012, 0.006);
    const switchMat = new THREE.MeshStandardMaterial({ color: 0xc81822, roughness: 0.3 });
    const pwrSwitch = new THREE.Mesh(switchGeom, switchMat);
    pwrSwitch.position.set(0.35, rearY, rearZ);
    this.keyboardBody.add(pwrSwitch);

    // 8. Crimson Red Acoustic Felt Strip along keybed rear edge
    const felt = new THREE.Mesh(
      new THREE.BoxGeometry(1.22, 0.010, 0.018),
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

    // Deep matte black bedliner cavity directly underneath keys
    const bedlinerGeom = new THREE.BoxGeometry(totalWhiteKeys * whiteKeyWidth + 0.012, 0.004, whiteKeyLength + 0.012);
    const bedlinerMat = new THREE.MeshBasicMaterial({ color: 0x08080a });
    const bedliner = new THREE.Mesh(bedlinerGeom, bedlinerMat);
    bedliner.position.set(0, -0.002, whiteKeyLength / 2);
    keybedGroup.add(bedliner);

    let whiteKeyIndex = 0;
    const whiteKeyPositions = {};

    // 1. Create 52 White Keys with crisp dark side seams
    for (let midi = 21; midi <= 108; midi++) {
      const noteInOctave = midi % 12;
      const isBlack = [1, 3, 6, 8, 10].includes(noteInOctave);

      if (!isBlack) {
        const xPos = keyboardStartX + (whiteKeyIndex * whiteKeyWidth);
        whiteKeyPositions[midi] = xPos;

        const pivotGroup = new THREE.Group();
        pivotGroup.position.set(xPos, 0, 0);

        const keyGeom = new THREE.BoxGeometry(whiteKeyWidth * 0.94, whiteKeyHeight, whiteKeyLength);
        const keyMat = this.whiteKeyMaterial.clone();

        // 6-face multi-material: sides (+X, -X) are dark charcoal to prevent visual merging;
        // top (+Y) and front (+Z) are mineral ivory; under faces are dark.
        const keyMesh = new THREE.Mesh(keyGeom, [
          this.keySideMaterial, // +X (right side seam)
          this.keySideMaterial, // -X (left side seam)
          keyMat,               // +Y (top ivory playing surface)
          this.keySideMaterial, // -Y (bottom)
          keyMat,               // +Z (front ivory apron face)
          this.keySideMaterial  // -Z (rear)
        ]);
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
   * Builds the authentic double-tier tubular steel X-stand with Quick-Lok clamping disc
   */
  _buildDoubleTierXStand() {
    const standGroup = new THREE.Group();
    const tubeRadius = 0.016;

    // Left and Right X-Cross Assemblies
    [-0.46, 0.46].forEach(x => {
      // Bottom Foot Tube resting on floor
      const foot = new THREE.Mesh(
        new THREE.CylinderGeometry(tubeRadius, tubeRadius, 0.54, 12),
        this.standMaterial
      );
      foot.rotation.x = Math.PI / 2;
      foot.position.set(x, 0.02, 0);
      foot.castShadow = true;
      standGroup.add(foot);

      // Ribbed Rubber end caps on bottom foot
      [-0.27, 0.27].forEach(z => {
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
        new THREE.CylinderGeometry(tubeRadius, tubeRadius, 0.44, 12),
        this.standMaterial
      );
      topArm.rotation.x = Math.PI / 2;
      topArm.position.set(x, 0.77, 0.05);
      topArm.castShadow = true;
      standGroup.add(topArm);

      // Ribbed Rubber Sleeves on top support arm
      [-0.14, 0.14].forEach(z => {
        const sleeve = new THREE.Mesh(
          new THREE.CylinderGeometry(tubeRadius + 0.004, tubeRadius + 0.004, 0.05, 12),
          this.rubberMaterial
        );
        sleeve.rotation.x = Math.PI / 2;
        sleeve.position.set(x, 0.77, 0.05 + z);
        standGroup.add(sleeve);
      });

      // Diagonal Cross Tube 1 (Front Bottom to Back Top)
      const leg1 = new THREE.Mesh(
        new THREE.CylinderGeometry(tubeRadius, tubeRadius, 0.98, 12),
        this.standMaterial
      );
      leg1.position.set(x, 0.39, 0.03);
      leg1.rotation.x = 0.44;
      leg1.castShadow = true;
      standGroup.add(leg1);

      // Diagonal Cross Tube 2 (Back Bottom to Front Top)
      const leg2 = new THREE.Mesh(
        new THREE.CylinderGeometry(tubeRadius, tubeRadius, 0.98, 12),
        this.standMaterial
      );
      leg2.position.set(x, 0.39, 0.03);
      leg2.rotation.x = -0.44;
      leg2.castShadow = true;
      standGroup.add(leg2);

      // Central Quick-Lok Clamping Disc with 360-degree tooth rim
      const discGeom = new THREE.CylinderGeometry(0.036, 0.036, 0.042, 24);
      discGeom.rotateZ(Math.PI / 2);
      const disc = new THREE.Mesh(discGeom, this.standMaterial);
      disc.position.set(x, 0.39, 0.03);
      standGroup.add(disc);

      // Chrome T-Handle Quick-Lock Tightening Knob
      const knobShaft = new THREE.Mesh(
        new THREE.CylinderGeometry(0.006, 0.006, 0.024, 12),
        this.chromeMaterial
      );
      knobShaft.rotation.z = Math.PI / 2;
      knobShaft.position.set(x + 0.028, 0.39, 0.03);
      standGroup.add(knobShaft);

      const knobTBar = new THREE.Mesh(
        new THREE.CylinderGeometry(0.005, 0.005, 0.045, 12),
        this.chromeMaterial
      );
      knobTBar.position.set(x + 0.040, 0.39, 0.03);
      standGroup.add(knobTBar);

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
   * Builds the Grand Piano Sustain Pedal unit resting on the stage floor with mirror-chrome pedal
   */
  _buildSustainPedal() {
    const pedalGroup = new THREE.Group();
    // Positioned on the floor directly under player's right foot
    const pedalX = 0.14;
    const pedalZ = 0.22;
    pedalGroup.position.set(pedalX, 0, pedalZ);

    // 1. High-Density Heavy Non-Slip Rubber Base Pad
    // Sits flat on the floor with beveled perimeter and heel pad extension
    const baseWidth = 0.102;
    const baseLength = 0.27;
    const basePadGeom = new THREE.BoxGeometry(baseWidth, 0.006, baseLength);
    const basePad = new THREE.Mesh(basePadGeom, this.rubberMaterial);
    basePad.position.set(0, 0.003, 0.015);
    basePad.castShadow = true;
    basePad.receiveShadow = true;
    pedalGroup.add(basePad);

    // Molded rubber side grip treads along the base
    for (let i = -3; i <= 3; i++) {
      const ribGeom = new THREE.BoxGeometry(baseWidth + 0.006, 0.004, 0.008);
      const rib = new THREE.Mesh(ribGeom, this.rubberMaterial);
      rib.position.set(0, 0.004, 0.015 + i * 0.032);
      pedalGroup.add(rib);
    }

    // Textured Heel Rest Pad at front of base plate
    const heelPlateGeom = new THREE.BoxGeometry(baseWidth - 0.012, 0.003, 0.055);
    const heelPlate = new THREE.Mesh(heelPlateGeom, this.rubberMaterial);
    heelPlate.position.set(0, 0.007, 0.115);
    pedalGroup.add(heelPlate);

    // 2. Sculpted Die-Cast Metal Pedal Enclosure (Dark Gunmetal Powder-Coat)
    // Rear Casing Body (houses pivot, spring, and cable port)
    const rearHousingWidth = 0.084;
    const rearHousingLength = 0.125;
    const rearHousingHeight = 0.042;
    const rearHousingGeom = new THREE.BoxGeometry(rearHousingWidth, rearHousingHeight, rearHousingLength);
    const rearHousing = new THREE.Mesh(rearHousingGeom, this.chassisDarkMaterial);
    rearHousing.position.set(0, rearHousingHeight / 2 + 0.004, -0.055);
    rearHousing.castShadow = true;
    pedalGroup.add(rearHousing);

    // Beveled Sloped Top Hood on rear casing
    const hoodGeom = new THREE.BoxGeometry(rearHousingWidth - 0.008, 0.010, rearHousingLength - 0.02);
    const hood = new THREE.Mesh(hoodGeom, this.panelSurfaceMaterial);
    hood.position.set(0, rearHousingHeight + 0.004, -0.058);
    hood.rotation.x = -0.06;
    pedalGroup.add(hood);

    // Brushed Gold / Silver Metallic Brand Badge ("PIANO / SUSTAIN")
    const badgeGeom = new THREE.BoxGeometry(0.044, 0.002, 0.022);
    const badge = new THREE.Mesh(badgeGeom, this.goldBadgeMaterial);
    badge.position.set(0, rearHousingHeight + 0.009, -0.058);
    badge.rotation.x = -0.06;
    pedalGroup.add(badge);

    // 3. Front U-Channel Guide Walls (form the open well where the lever moves)
    const wallWidth = 0.012;
    const wallHeight = 0.022;
    const wallLength = 0.105;
    [-0.036, 0.036].forEach((wx) => {
      const wallGeom = new THREE.BoxGeometry(wallWidth, wallHeight, wallLength);
      const wall = new THREE.Mesh(wallGeom, this.chassisDarkMaterial);
      wall.position.set(wx, wallHeight / 2 + 0.004, 0.055);
      wall.castShadow = true;
      pedalGroup.add(wall);

      // Chrome cap trim on side rail
      const capGeom = new THREE.BoxGeometry(wallWidth + 0.002, 0.003, wallLength);
      const cap = new THREE.Mesh(capGeom, this.chromeMaterial);
      cap.position.set(wx, wallHeight + 0.005, 0.055);
      pedalGroup.add(cap);
    });

    // Acoustic Damping Felt Cushion inside the channel floor
    const feltBedGeom = new THREE.BoxGeometry(0.052, 0.004, wallLength);
    const feltBedMat = new THREE.MeshStandardMaterial({
      color: 0x6e1218, // Deep burgundy acoustic damper felt
      roughness: 0.90,
      metalness: 0.0
    });
    const feltBed = new THREE.Mesh(feltBedGeom, feltBedMat);
    feltBed.position.set(0, 0.008, 0.055);
    pedalGroup.add(feltBed);

    // 4. Internal Mechanics: Transverse Chrome Pivot Pin & Recoil Spring
    const pivotPinGeom = new THREE.CylinderGeometry(0.004, 0.004, 0.058, 12);
    pivotPinGeom.rotateZ(Math.PI / 2);
    const pivotPin = new THREE.Mesh(pivotPinGeom, this.chromeMaterial);
    pivotPin.position.set(0, 0.026, 0.002);
    pedalGroup.add(pivotPin);

    // Chrome End Bushing Nuts on pivot pin
    [-0.030, 0.030].forEach((px) => {
      const nutGeom = new THREE.CylinderGeometry(0.006, 0.006, 0.004, 12);
      nutGeom.rotateZ(Math.PI / 2);
      const nut = new THREE.Mesh(nutGeom, this.chromeMaterial);
      nut.position.set(px, 0.026, 0.002);
      pedalGroup.add(nut);
    });

    // Visible Heavy-Duty Coiled Steel Recoil Spring under pivot
    const springGeom = new THREE.CylinderGeometry(0.007, 0.007, 0.016, 12);
    const spring = new THREE.Mesh(springGeom, this.chromeMaterial);
    spring.position.set(0, 0.016, -0.014);
    pedalGroup.add(spring);

    // 5. Mirror-Polished Chrome Pedal Lever Tongue with Ergonomic Curved Lip
    const pivot = new THREE.Group();
    // Pivot axis positioned inside the housing throat
    pivot.position.set(0, 0.026, 0.002);

    const leverGroup = new THREE.Group();

    // A. Main Neck / Arm (connecting pivot to foot paddle)
    const neckGeom = new THREE.BoxGeometry(0.034, 0.011, 0.065);
    const neck = new THREE.Mesh(neckGeom, this.chromeMaterial);
    neck.position.set(0, 0, 0.032);
    neck.castShadow = true;
    leverGroup.add(neck);

    // B. Ergonomic Flared Foot Paddle (wide tread plate extending forward)
    const paddleGeom = new THREE.BoxGeometry(0.048, 0.010, 0.088);
    const paddle = new THREE.Mesh(paddleGeom, this.chromeMaterial);
    paddle.position.set(0, 0.003, 0.100);
    paddle.castShadow = true;
    leverGroup.add(paddle);

    // C. Sculpted Raised Front Toe Lip (Classic Yamaha / Steinway upturned curve)
    const lipGeom = new THREE.CylinderGeometry(0.010, 0.010, 0.048, 16, 1, false, 0, Math.PI);
    lipGeom.rotateZ(Math.PI / 2);
    const lip = new THREE.Mesh(lipGeom, this.chromeMaterial);
    lip.position.set(0, 0.010, 0.144);
    lip.castShadow = true;
    leverGroup.add(lip);

    // D. Longitudinal Black Rubber Anti-Slip Grip Tread Strips on top of pedal
    [-0.014, 0, 0.014].forEach((tx) => {
      const treadGeom = new THREE.BoxGeometry(0.0045, 0.0025, 0.072);
      const tread = new THREE.Mesh(treadGeom, this.rubberMaterial);
      tread.position.set(tx, 0.009, 0.100);
      leverGroup.add(tread);
    });

    // E. Molded Under-Pedal Rubber Damper Bumper
    const bumperGeom = new THREE.BoxGeometry(0.026, 0.005, 0.030);
    const bumper = new THREE.Mesh(bumperGeom, this.rubberMaterial);
    bumper.position.set(0, -0.005, 0.090);
    leverGroup.add(bumper);

    pivot.add(leverGroup);

    // Initial poise angle (elevated upward ~8.6 deg)
    pivot.rotation.x = -0.15;
    pedalGroup.add(pivot);
    this.pedalTongue = pivot;

    // 6. Rear Strain Relief Boot (Ribbed Conical Rubber Grommet)
    const bootGeom = new THREE.CylinderGeometry(0.005, 0.009, 0.026, 12);
    bootGeom.rotateX(Math.PI / 2);
    const boot = new THREE.Mesh(bootGeom, this.rubberMaterial);
    boot.position.set(0, 0.020, -0.125);
    pedalGroup.add(boot);

    pedalGroup.castShadow = true;
    this.group.add(pedalGroup);

    // 7. Realistic Flexible Audio Cable with Professional Stage Routing
    // Exits rear boot -> drops with gravity to floor -> snakes neatly toward X-stand ->
    // climbs rear tubular stand leg (held by cable strap) -> curves into Damper Jack port!
    const standLegX = 0.35;
    const cablePoints = [
      new THREE.Vector3(pedalX, 0.020, pedalZ - 0.138),                 // Exit strain relief boot
      new THREE.Vector3(pedalX + 0.018, 0.012, pedalZ - 0.180),        // Drop naturally toward stage floor
      new THREE.Vector3(pedalX + 0.055, 0.010, pedalZ - 0.240),        // Smooth curve along floor
      new THREE.Vector3(standLegX - 0.050, 0.012, -0.080),             // Lead to base of rear stand leg
      new THREE.Vector3(standLegX - 0.010, 0.040, -0.065),             // Begin climb up the leg
      new THREE.Vector3(standLegX, 0.180, -0.030),                     // Follow incline of rear X-stand leg
      new THREE.Vector3(standLegX, 0.390, 0.010),                      // Secured by cable strap at cross joint
      new THREE.Vector3(0.25, 0.640, -0.070),                          // Graceful curve toward keyboard underside
      new THREE.Vector3(0.14, 0.810, -0.155),                          // Aligning straight into damper jack
      new THREE.Vector3(0.14, 0.828, -0.170)                           // Damper Jack port center
    ];
    const cableCurve = new THREE.CatmullRomCurve3(cablePoints);
    const cableGeom = new THREE.TubeGeometry(cableCurve, 48, 0.0032, 8, false);
    const cable = new THREE.Mesh(cableGeom, this.rubberMaterial);
    cable.castShadow = true;
    this.group.add(cable);

    // Cable Fastening Strap (Velcro / Plastic Tie) on the stand leg
    const strapGeom = new THREE.CylinderGeometry(0.018, 0.018, 0.020, 14);
    const strap = new THREE.Mesh(strapGeom, this.rubberMaterial);
    strap.position.set(standLegX, 0.390, 0.010);
    strap.rotation.x = -0.44;
    this.group.add(strap);

    // 1/4" Phone Jack Metal Plug Body at Piano Back Panel
    const plugGroup = new THREE.Group();
    plugGroup.position.set(0.14, 0.828, -0.170);

    const plugBarrelGeom = new THREE.CylinderGeometry(0.006, 0.006, 0.028, 14);
    plugBarrelGeom.rotateX(Math.PI / 2);
    const plugBarrel = new THREE.Mesh(plugBarrelGeom, this.chromeMaterial);
    plugBarrel.position.z = 0.014;
    plugGroup.add(plugBarrel);

    const plugBootGeom = new THREE.CylinderGeometry(0.0045, 0.006, 0.014, 12);
    plugBootGeom.rotateX(Math.PI / 2);
    const plugBoot = new THREE.Mesh(plugBootGeom, this.rubberMaterial);
    plugBoot.position.z = 0.032;
    plugGroup.add(plugBoot);

    this.group.add(plugGroup);
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
  onNoteOn(midiPitch, velocity = 0.8, eventTime = null, trackIndex = null, duration = 0.5) {
    const keyData = this.keyMeshes[midiPitch];
    if (!keyData) return;

    keyData.activeCount++;
    this.activeNoteCount++;
    const vel = THREE.MathUtils.clamp(velocity, 0, 1);

    // Responsive mechanical downward key rotation
    const maxDepressAngle = keyData.isBlack ? 0.065 : 0.075;
    const targetAngle = maxDepressAngle * (0.75 + 0.25 * vel);
    const attackTime = THREE.MathUtils.clamp(duration * 0.4, 0.012, 0.03);

    // Cancel the previous release, including its light/color fade. A repeated
    // pitch must get a fresh stroke even when its note envelopes overlap.
    gsap.killTweensOf([keyData.pivot.rotation, keyData.mat, keyData.mat.color]);
    keyData.pivot.rotation.x *= 0.18;
    gsap.to(keyData.pivot.rotation, {
      x: targetAngle,
      duration: attackTime,
      ease: 'power2.out'
    });

    // Glow highlight on key
    const emissiveColor = 0x00b9d4;
    keyData.mat.emissive.setHex(emissiveColor);
    keyData.mat.color.setHex(keyData.baseColor);
    if (!keyData.isBlack) {
      // Match the black keys' cyan highlight while keeping ivory keys distinct.
      keyData.mat.color.copy(this.pressedWhiteColor);
    }
    keyData.mat.emissiveIntensity = 0.24 + 0.3 * vel;
    gsap.to(keyData.mat, {
      emissiveIntensity: 0.12 + 0.16 * vel,
      duration: 0.07,
      ease: 'power1.out'
    });

    // Sustain pedal reactive foot depression on floor
    if (this.pedalTongue) {
      gsap.killTweensOf(this.pedalTongue.rotation);
      gsap.to(this.pedalTongue.rotation, {
        x: 0.02,
        duration: 0.04,
        ease: 'power2.out'
      });
    }
  }

  // Note-Off Event Trigger
  onNoteOff(midiPitch, force = false) {
    const keyData = this.keyMeshes[midiPitch];
    if (!keyData) return;

    const releasedCount = force ? keyData.activeCount : Math.min(1, keyData.activeCount);
    keyData.activeCount -= releasedCount;
    this.activeNoteCount = Math.max(0, this.activeNoteCount - releasedCount);

    if (keyData.activeCount === 0) {
      gsap.killTweensOf([keyData.pivot.rotation, keyData.mat, keyData.mat.color]);
      if (force) {
        keyData.pivot.rotation.x = 0;
        keyData.mat.emissiveIntensity = 0;
        keyData.mat.color.setHex(keyData.baseColor);
      } else {
        // A damped return leaves a clear gap between staccato notes.
        gsap.to(keyData.pivot.rotation, { x: 0, duration: 0.055, ease: 'power2.out' });
        gsap.to(keyData.mat, { emissiveIntensity: 0, duration: 0.055, ease: 'power2.out' });
        const base = new THREE.Color(keyData.baseColor);
        gsap.to(keyData.mat.color, { r: base.r, g: base.g, b: base.b, duration: 0.055, ease: 'power2.out' });
      }
    }

    // Release sustain pedal when all notes end
    if (this.pedalTongue && this.activeNoteCount === 0) {
      gsap.killTweensOf(this.pedalTongue.rotation);
      gsap.to(this.pedalTongue.rotation, {
        x: -0.15,
        duration: 0.12,
        ease: 'back.out(1.4)'
      });
    }
  }

  update() {}
}
