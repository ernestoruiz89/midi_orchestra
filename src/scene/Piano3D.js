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
    this.grandDamperPedal = null;
    this.isGrandPiano = false;
    this.grandPianoGroup = null;
    this.standGroup = null;
    this.floorPedalGroup = null;
    this.cableMesh = null;
    this.strapMesh = null;
    this.plugGroup = null;
    this.tierRiserGroup = null;
    this.pedalLight = null;
    this.keybedGroup = null;
    this.activeNoteCount = 0;
    this.pressedWhiteColor = new THREE.Color(0x00b9d4);
    this.displayCanvas = null;
    this.displayContext = null;
    this.displayTexture = null;
    this.midiProgramLabel = 'CONCERT GRAND 88';

    this._buildMaterials();
    this._buildKeyboardChassis();
    this._build88Keys();

    if (this.tier === 1) {
      this._buildGrandPiano();
    }

    if (this.hasStand) {
      this._buildDoubleTierXStand();
      if (this.tier === 1) {
        this._buildSustainPedal();

        // Subtle floor accent for sustain pedal & cable (avoiding harsh glare)
        const pedalLight = new THREE.PointLight(0xffeedd, 0.8, 1.4, 2.0);
        pedalLight.position.set(0.14, 0.35, 0.30);
        this.group.add(pedalLight);
        this.pedalLight = pedalLight;
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

    // 15. Concert Grand Piano Materials:
    // High-Gloss Concert Ebony Black Lacquer (Rim, Lid, Case, Legs)
    this.grandEbonyMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x08080c,
      roughness: 0.10,
      metalness: 0.12,
      clearcoat: 1.0,
      clearcoatRoughness: 0.02,
      reflectivity: 0.95
    });

    // Resonant Solid Spruce Soundboard
    this.spruceSoundboardMaterial = new THREE.MeshStandardMaterial({
      color: 0xc9944d,
      roughness: 0.58,
      metalness: 0.05,
      side: THREE.DoubleSide
    });

    // Gilded Cast-Iron Frame / Harp
    this.castIronHarpMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xd4af37,
      roughness: 0.28,
      metalness: 0.88,
      clearcoat: 0.4
    });

    // Solid Polished Brass (pedals, casters, ferrules, hinges)
    this.grandBrassMaterial = new THREE.MeshStandardMaterial({
      color: 0xdfb94a,
      roughness: 0.20,
      metalness: 0.92
    });

    // Polished High-Tensile Steel Wire Strings
    this.steelStringMaterial = new THREE.MeshStandardMaterial({
      color: 0xccd0d8,
      roughness: 0.22,
      metalness: 0.95
    });

    // Wound Copper Bass Strings
    this.copperStringMaterial = new THREE.MeshStandardMaterial({
      color: 0xb56535,
      roughness: 0.35,
      metalness: 0.88
    });

    // Concert Artist Tufted Leather Bench
    this.leatherBenchMaterial = new THREE.MeshStandardMaterial({
      color: 0x16161a,
      roughness: 0.72,
      metalness: 0.08
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
    this.keybedGroup = keybedGroup;

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
    this.standGroup = standGroup;
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
    this.floorPedalGroup = pedalGroup;

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
    this.cableMesh = cable;

    // Cable Fastening Strap (Velcro / Plastic Tie) on the stand leg
    const strapGeom = new THREE.CylinderGeometry(0.018, 0.018, 0.020, 14);
    const strap = new THREE.Mesh(strapGeom, this.rubberMaterial);
    strap.position.set(standLegX, 0.390, 0.010);
    strap.rotation.x = -0.44;
    this.group.add(strap);
    this.strapMesh = strap;

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
    this.plugGroup = plugGroup;
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
    this.tierRiserGroup = riserGroup;
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

    // Reactive pedal animation with note playing (if not currently controlled by explicit MIDI CC64)
    if (!this.ccSustainActive) {
      this.setSustainPedal(true, vel);
    }
    // Una corda soft pedal animation for pianissimo notes
    if (vel < 0.45 && !this.ccSustainActive) {
      this.setUnaCordaPedal(true);
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

    // Release pedal when all active notes end (if not held by CC64)
    if (!this.ccSustainActive && this.activeNoteCount === 0) {
      this.setSustainPedal(false);
      this.setUnaCordaPedal(false);
    }
  }

  // Animates the sustain / damper pedal and lifting rod
  setSustainPedal(isDown, vel = 0.8) {
    this.isSustainDown = isDown;

    // 1. Electronic stage keyboard pedal lever on floor
    if (this.pedalTongue) {
      gsap.killTweensOf(this.pedalTongue.rotation);
      gsap.to(this.pedalTongue.rotation, {
        x: isDown ? 0.03 : -0.15,
        duration: isDown ? 0.04 : 0.12,
        ease: isDown ? 'power2.out' : 'back.out(1.4)'
      });
    }

    // 2. Grand Piano brass damper pedal (pivots down ~8.5 degrees with mechanical displacement)
    if (this.grandDamperPedal) {
      gsap.killTweensOf(this.grandDamperPedal.rotation);
      gsap.to(this.grandDamperPedal.rotation, {
        x: isDown ? (0.13 + 0.03 * vel) : 0,
        duration: isDown ? 0.04 : 0.12,
        ease: 'power2.out'
      });
    }

    // 3. Vertical brass lifting rod (pushes upward through bottom of keybed)
    if (this.grandPedalRods && this.grandPedalRods[2]) {
      gsap.killTweensOf(this.grandPedalRods[2].position);
      gsap.to(this.grandPedalRods[2].position, {
        y: isDown ? 0.364 : 0.350,
        duration: isDown ? 0.04 : 0.12,
        ease: 'power2.out'
      });
    }
  }

  // Animates the soft pedal (Una Corda, leftmost pedal)
  setUnaCordaPedal(isDown) {
    if (this.grandUnaCordaPedal) {
      gsap.killTweensOf(this.grandUnaCordaPedal.rotation);
      gsap.to(this.grandUnaCordaPedal.rotation, {
        x: isDown ? 0.11 : 0,
        duration: isDown ? 0.06 : 0.14,
        ease: 'power2.out'
      });
    }
    if (this.grandPedalRods && this.grandPedalRods[0]) {
      gsap.killTweensOf(this.grandPedalRods[0].position);
      gsap.to(this.grandPedalRods[0].position, {
        y: isDown ? 0.360 : 0.350,
        duration: isDown ? 0.06 : 0.14,
        ease: 'power2.out'
      });
    }
  }

  // Handles MIDI Control Change events (CC64 Damper/Sustain, CC67 Soft Pedal)
  onControlChange(controller, value) {
    if (controller === 64) {
      const isDown = value >= 64;
      this.ccSustainActive = isDown;
      this.setSustainPedal(isDown);
    } else if (controller === 67) {
      const isDown = value >= 64;
      this.setUnaCordaPedal(isDown);
    }
  }

  _createFallboardTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');

    // Deep ebony black background
    ctx.fillStyle = '#08080c';
    ctx.fillRect(0, 0, 1024, 128);

    // Fine gold filigree double-rule border
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.45)';
    ctx.lineWidth = 2;
    ctx.strokeRect(30, 20, 964, 88);

    // Gold gradient lettering
    const grad = ctx.createLinearGradient(0, 0, 1024, 0);
    grad.addColorStop(0.3, '#d4af37');
    grad.addColorStop(0.5, '#fff5d0');
    grad.addColorStop(0.7, '#d4af37');
    ctx.fillStyle = grad;

    // Brand Nameplate
    ctx.font = 'bold 42px "Times New Roman", "Georgia", serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('STEINWAY  &  SONS', 512, 58);

    ctx.font = '16px "Georgia", serif';
    ctx.fillStyle = '#b89728';
    ctx.fillText('•  CONCERT GRAND MODEL D  •', 512, 90);

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    return texture;
  }

  _createSheetMusicTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    // Warm ivory / parchment paper
    ctx.fillStyle = '#f8f4e6';
    ctx.fillRect(0, 0, 512, 256);

    // Book spine center shadow
    const spineGrad = ctx.createLinearGradient(240, 0, 272, 0);
    spineGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
    spineGrad.addColorStop(0.5, 'rgba(80, 60, 40, 0.25)');
    spineGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = spineGrad;
    ctx.fillRect(240, 0, 32, 256);

    // Draw staves (5 lines per staff)
    const drawStaff = (x, y, w) => {
      ctx.strokeStyle = '#333';
      ctx.lineWidth = 1;
      for (let i = 0; i < 5; i++) {
        ctx.beginPath();
        ctx.moveTo(x, y + i * 5);
        ctx.lineTo(x + w, y + i * 5);
        ctx.stroke();
      }
    };

    // Title on left page
    ctx.fillStyle = '#111';
    ctx.font = 'bold 15px "Times New Roman", serif';
    ctx.textAlign = 'center';
    ctx.fillText('Concerto No. 2 in C Minor', 128, 24);
    ctx.font = 'italic 10px "Times New Roman", serif';
    ctx.fillText('Op. 18 - S. Rachmaninoff', 128, 38);

    // Title on right page
    ctx.font = 'bold 13px "Times New Roman", serif';
    ctx.fillText('Moderato maestoso', 384, 28);

    // Left Page Staves
    drawStaff(20, 55, 215);
    drawStaff(20, 88, 215);
    drawStaff(20, 130, 215);
    drawStaff(20, 163, 215);
    drawStaff(20, 205, 215);

    // Right Page Staves
    drawStaff(275, 55, 215);
    drawStaff(275, 88, 215);
    drawStaff(275, 130, 215);
    drawStaff(275, 163, 215);
    drawStaff(275, 205, 215);

    // Clefs and musical note heads
    ctx.fillStyle = '#111';
    [20, 275].forEach(pageLeft => {
      [55, 130].forEach(topY => {
        ctx.font = '24px serif';
        ctx.textAlign = 'left';
        ctx.fillText('𝄞', pageLeft + 4, topY + 18);
        ctx.fillText('𝄢', pageLeft + 4, topY + 50);

        for (let n = 0; n < 8; n++) {
          const nx = pageLeft + 42 + n * 20;
          const ny = topY + 5 + (n % 4) * 4;
          ctx.beginPath();
          ctx.ellipse(nx, ny, 3.5, 2.5, -0.3, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillRect(nx + 2.5, ny - 14, 1.2, 14);
          if (n % 2 === 0) {
            ctx.fillRect(nx + 2.5, ny - 14, 20, 2);
          }
        }
      });
    });

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    return texture;
  }

  _buildGrandPiano() {
    this.grandPianoGroup = new THREE.Group();

    const t = 0.035; // Rim wall thickness (3.5 cm)

    // 1. Curved Rim (High-Gloss Concert Ebony Lacquer)
    // Runs along left spine, around tail, and along right bentside.
    // Notice: Leaves the front (between left and right cheek blocks) completely OPEN for the keyboard!
    const rimShape = new THREE.Shape();
    // Outer perimeter:
    rimShape.moveTo(-0.74, 0.20);
    rimShape.lineTo(-0.74, -1.55);
    rimShape.bezierCurveTo(-0.74, -1.85, -0.40, -1.95, -0.08, -1.88);
    rimShape.bezierCurveTo(0.25, -1.82, 0.44, -1.50, 0.48, -1.15);
    rimShape.bezierCurveTo(0.52, -0.75, 0.74, -0.30, 0.74, 0.20);
    // Front right cheek step inward:
    rimShape.lineTo(0.74 - t, 0.20);
    // Inner perimeter:
    rimShape.bezierCurveTo(0.74 - t, -0.30, 0.52 - t, -0.75, 0.48 - t, -1.15);
    rimShape.bezierCurveTo(0.44 - t, -1.50, 0.25 - t, -1.82 + t, -0.08, -1.88 + t);
    rimShape.bezierCurveTo(-0.40 + t, -1.95 + t, -0.74 + t, -1.85, -0.74 + t, -1.55);
    rimShape.lineTo(-0.74 + t, 0.20);
    // Front left cheek step outward to close:
    rimShape.lineTo(-0.74, 0.20);

    const rimGeom = new THREE.ExtrudeGeometry(rimShape, {
      depth: 0.24,
      bevelEnabled: true,
      bevelSegments: 2,
      steps: 1,
      bevelSize: 0.005,
      bevelThickness: 0.005
    });
    rimGeom.rotateX(Math.PI / 2);
    const rimMesh = new THREE.Mesh(rimGeom, this.grandEbonyMaterial);
    rimMesh.position.y = 0.95;
    rimMesh.castShadow = true;
    rimMesh.receiveShadow = true;
    this.grandPianoGroup.add(rimMesh);

    // 2. Base Plate (Under-belly support and keybed base)
    const baseShape = new THREE.Shape();
    baseShape.moveTo(-0.74, 0.20);
    baseShape.lineTo(-0.74, -1.55);
    baseShape.bezierCurveTo(-0.74, -1.85, -0.40, -1.95, -0.08, -1.88);
    baseShape.bezierCurveTo(0.25, -1.82, 0.44, -1.50, 0.48, -1.15);
    baseShape.bezierCurveTo(0.52, -0.75, 0.74, -0.30, 0.74, 0.20);
    baseShape.lineTo(-0.74, 0.20);
    const baseGeom = new THREE.ExtrudeGeometry(baseShape, { depth: 0.024, bevelEnabled: false });
    baseGeom.rotateX(Math.PI / 2);
    const baseMesh = new THREE.Mesh(baseGeom, this.grandEbonyMaterial);
    baseMesh.position.y = 0.69;
    baseMesh.castShadow = true;
    baseMesh.receiveShadow = true;
    this.grandPianoGroup.add(baseMesh);

    // Stretcher Bar (Transverse casing beam connecting left & right rim beneath the music desk)
    const stretcherGeom = new THREE.BoxGeometry(1.41, 0.055, 0.035);
    const stretcher = new THREE.Mesh(stretcherGeom, this.grandEbonyMaterial);
    stretcher.position.set(0, 0.875, -0.010);
    stretcher.castShadow = true;
    this.grandPianoGroup.add(stretcher);

    // 3. Resonant Solid Spruce Soundboard
    const soundboardShape = new THREE.Shape();
    const st = 0.038;
    soundboardShape.moveTo(-0.74 + st, -0.05);
    soundboardShape.lineTo(-0.74 + st, -1.55);
    soundboardShape.bezierCurveTo(-0.74 + st, -1.85, -0.40 + st, -1.94, -0.08, -1.87);
    soundboardShape.bezierCurveTo(0.24, -1.81, 0.43 - st, -1.49, 0.47 - st, -1.14);
    soundboardShape.bezierCurveTo(0.51 - st, -0.74, 0.73 - st, -0.30, 0.73 - st, -0.05);
    soundboardShape.lineTo(-0.74 + st, -0.05);
    const sbGeom = new THREE.ShapeGeometry(soundboardShape);
    sbGeom.rotateX(Math.PI / 2);
    const soundboardMesh = new THREE.Mesh(sbGeom, this.spruceSoundboardMaterial);
    soundboardMesh.position.y = 0.742;
    soundboardMesh.receiveShadow = true;
    this.grandPianoGroup.add(soundboardMesh);

    // 4. Curved Long Bridge & Bass Bridge
    const bridgeCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.55, 0.748, -0.25),
      new THREE.Vector3(0.38, 0.748, -0.65),
      new THREE.Vector3(0.18, 0.748, -1.05),
      new THREE.Vector3(-0.05, 0.748, -1.40),
      new THREE.Vector3(-0.25, 0.748, -1.65)
    ]);
    const bridgeGeom = new THREE.TubeGeometry(bridgeCurve, 32, 0.014, 8, false);
    const bridgeMesh = new THREE.Mesh(bridgeGeom, this.spruceSoundboardMaterial);
    this.grandPianoGroup.add(bridgeMesh);

    const bassBridgeCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.45, 0.755, -0.55),
      new THREE.Vector3(-0.48, 0.755, -0.95),
      new THREE.Vector3(-0.52, 0.755, -1.35)
    ]);
    const bassBridgeGeom = new THREE.TubeGeometry(bassBridgeCurve, 16, 0.014, 8, false);
    const bassBridgeMesh = new THREE.Mesh(bassBridgeGeom, this.spruceSoundboardMaterial);
    this.grandPianoGroup.add(bassBridgeMesh);

    // 5. Cast-Iron Frame / Harp (Arpa Dorada)
    const harpGroup = new THREE.Group();
    harpGroup.position.set(0, 0.760, 0);

    // Pinblock / front plate transverse bar
    const pinblockGeom = new THREE.BoxGeometry(1.36, 0.022, 0.12);
    const pinblockMesh = new THREE.Mesh(pinblockGeom, this.castIronHarpMaterial);
    pinblockMesh.position.set(0, 0, -0.06);
    harpGroup.add(pinblockMesh);

    // Tuning Pins along front
    for (let p = -0.58; p <= 0.58; p += 0.038) {
      const pinGeom = new THREE.CylinderGeometry(0.003, 0.003, 0.018, 8);
      const pinMesh = new THREE.Mesh(pinGeom, this.steelStringMaterial);
      pinMesh.position.set(p, 0.012, -0.05 + ((p * 100) % 3) * 0.015);
      harpGroup.add(pinMesh);
    }

    // 4 Diagonal Structural Cast-Iron Struts
    const struts = [
      { start: new THREE.Vector3(-0.62, 0.01, -0.12), end: new THREE.Vector3(-0.62, 0.01, -1.50) },
      { start: new THREE.Vector3(-0.25, 0.01, -0.12), end: new THREE.Vector3(-0.15, 0.01, -1.75) },
      { start: new THREE.Vector3(0.18, 0.01, -0.12), end: new THREE.Vector3(0.32, 0.01, -1.30) },
      { start: new THREE.Vector3(0.55, 0.01, -0.12), end: new THREE.Vector3(0.52, 0.01, -0.52) }
    ];
    struts.forEach(s => {
      const diff = s.end.clone().sub(s.start);
      const len = diff.length();
      const strutGeom = new THREE.BoxGeometry(0.032, 0.024, len);
      const strutMesh = new THREE.Mesh(strutGeom, this.castIronHarpMaterial);
      strutMesh.position.copy(s.start).add(diff.clone().multiplyScalar(0.5));
      strutMesh.rotation.y = Math.atan2(diff.x, diff.z);
      strutMesh.castShadow = true;
      harpGroup.add(strutMesh);
    });

    // Circular Sound Holes in harp web (properly contained within plate, none protruding through rim)
    [-0.20, 0.10].forEach((hx, idx) => {
      const holeRingGeom = new THREE.TorusGeometry(0.042 + idx * 0.006, 0.008, 8, 24);
      holeRingGeom.rotateX(Math.PI / 2);
      const holeRing = new THREE.Mesh(holeRingGeom, this.castIronHarpMaterial);
      holeRing.position.set(hx, 0.012, -0.85 - idx * 0.35);
      harpGroup.add(holeRing);
    });

    this.grandPianoGroup.add(harpGroup);

    // 6. Overstrung Strings (Copper Bass + Steel Treble)
    const stringsGroup = new THREE.Group();
    stringsGroup.position.set(0, 0.762, 0);

    // Bass strings (wound copper) angled from front-left to rear-right
    for (let b = 0; b < 14; b++) {
      const tNorm = b / 13;
      const startX = -0.58 + tNorm * 0.28;
      const startZ = -0.10;
      const endX = -0.46 + tNorm * 0.35;
      const endZ = -1.45 + tNorm * 0.40;
      const strGeom = new THREE.CylinderGeometry(0.0022, 0.0022, Math.hypot(endX - startX, endZ - startZ), 4);
      strGeom.rotateX(Math.PI / 2);
      const strMesh = new THREE.Mesh(strGeom, this.copperStringMaterial);
      strMesh.position.set((startX + endX) / 2, 0.016, (startZ + endZ) / 2);
      strMesh.rotation.y = Math.atan2(endX - startX, endZ - startZ);
      stringsGroup.add(strMesh);
    }

    // Treble strings (polished steel wire)
    for (let tr = 0; tr < 38; tr++) {
      const tNorm = tr / 37;
      const startX = -0.32 + tNorm * 0.92;
      const startZ = -0.10;
      const endX = -0.22 + tNorm * 0.85;
      const endZ = -1.65 + Math.pow(tNorm, 0.6) * 1.35;
      const len = Math.hypot(endX - startX, endZ - startZ);
      const strGeom = new THREE.CylinderGeometry(0.0012, 0.0012, len, 4);
      strGeom.rotateX(Math.PI / 2);
      const strMesh = new THREE.Mesh(strGeom, this.steelStringMaterial);
      strMesh.position.set((startX + endX) / 2, 0.005, (startZ + endZ) / 2);
      strMesh.rotation.y = Math.atan2(endX - startX, endZ - startZ);
      stringsGroup.add(strMesh);

      // Red felt damper wedges on treble strings
      if (tr % 3 === 0) {
        const damperGeom = new THREE.BoxGeometry(0.015, 0.018, 0.022);
        const damper = new THREE.Mesh(damperGeom, this.feltMaterial);
        damper.position.set((startX + endX) / 2, 0.016, (startZ * 0.7 + endZ * 0.3));
        stringsGroup.add(damper);
      }
    }
    this.grandPianoGroup.add(stringsGroup);

    // 7. Sculptured Cheek Blocks (flanking the keyboard on left and right)
    const cheekGeom = new THREE.BoxGeometry(0.125, 0.10, 0.19);
    const leftCheek = new THREE.Mesh(cheekGeom, this.grandEbonyMaterial);
    leftCheek.position.set(-0.675, 0.745, 0.105);
    leftCheek.castShadow = true;
    this.grandPianoGroup.add(leftCheek);

    const rightCheek = new THREE.Mesh(cheekGeom, this.grandEbonyMaterial);
    rightCheek.position.set(0.675, 0.745, 0.105);
    rightCheek.castShadow = true;
    this.grandPianoGroup.add(rightCheek);

    // Front Key Slip (protective rail in front of the white keys, below playing level)
    const keySlipGeom = new THREE.BoxGeometry(1.224, 0.034, 0.018);
    const keySlip = new THREE.Mesh(keySlipGeom, this.grandEbonyMaterial);
    keySlip.position.set(0, 0.707, 0.195);
    keySlip.castShadow = true;
    this.grandPianoGroup.add(keySlip);

    // Fallboard (angled ebony panel with golden brand lettering, sitting directly behind keys)
    const fallboardGeom = new THREE.BoxGeometry(1.22, 0.11, 0.022);
    const fallboardTex = this._createFallboardTexture();
    const fallboardMat = new THREE.MeshStandardMaterial({
      map: fallboardTex,
      roughness: 0.14,
      metalness: 0.35
    });
    const fallboard = new THREE.Mesh(fallboardGeom, [
      this.grandEbonyMaterial,
      this.grandEbonyMaterial,
      this.grandEbonyMaterial,
      this.grandEbonyMaterial,
      fallboardMat, // front face with brand text
      this.grandEbonyMaterial
    ]);
    fallboard.position.set(0, 0.785, 0.038);
    fallboard.rotation.x = -0.22; // Slanted back ~12.6 degrees
    fallboard.castShadow = true;
    this.grandPianoGroup.add(fallboard);

    // Crimson Red Acoustic Felt Strip along the keybed rear crease
    const feltStripGeom = new THREE.BoxGeometry(1.21, 0.008, 0.014);
    const feltStrip = new THREE.Mesh(feltStripGeom, this.feltMaterial);
    feltStrip.position.set(0, 0.740, 0.044);
    this.grandPianoGroup.add(feltStrip);

    // 8. Concert Music Desk with Classical Sheet Music Score
    const deskGroup = new THREE.Group();
    deskGroup.position.set(0, 0.925, 0.010);

    // A. Bottom Shelf / Ledge (where the sheet music rests)
    const shelfGeom = new THREE.BoxGeometry(0.68, 0.018, 0.055);
    const shelf = new THREE.Mesh(shelfGeom, this.grandEbonyMaterial);
    shelf.position.set(0, 0.009, 0.015);
    shelf.castShadow = true;
    deskGroup.add(shelf);

    // Front lip on the shelf to prevent music from sliding
    const lipGeom = new THREE.BoxGeometry(0.68, 0.016, 0.008);
    const lip = new THREE.Mesh(lipGeom, this.grandEbonyMaterial);
    lip.position.set(0, 0.022, 0.040);
    deskGroup.add(lip);

    // B. Back Rack / Music Stand Panel (angled back ~16 degrees)
    const rackTilt = -0.28;
    const rackGeom = new THREE.BoxGeometry(0.66, 0.25, 0.014);
    const rack = new THREE.Mesh(rackGeom, this.grandEbonyMaterial);
    rack.position.set(0, 0.125, -0.018);
    rack.rotation.x = rackTilt;
    rack.castShadow = true;
    deskGroup.add(rack);

    // C. Sheet Music Score (Rests directly on the shelf, tilted against the rack)
    const scoreTex = this._createSheetMusicTexture();
    const scoreGeom = new THREE.PlaneGeometry(0.50, 0.22);
    const scoreMat = new THREE.MeshStandardMaterial({
      map: scoreTex,
      roughness: 0.98,
      metalness: 0.0,
      emissive: 0x33302a,
      emissiveIntensity: 0.18,
      side: THREE.DoubleSide
    });
    const score = new THREE.Mesh(scoreGeom, scoreMat);
    score.position.set(0, 0.128, -0.010);
    score.rotation.x = rackTilt;
    deskGroup.add(score);

    this.grandPianoGroup.add(deskGroup);

    // 9. Grand Lid & Prop Sticks (Hinged along left spine, tilted open ~32 deg)
    const lidGroup = new THREE.Group();
    lidGroup.position.set(-0.74, 0.95, 0);

    const lidShape = new THREE.Shape();
    lidShape.moveTo(0, 0.015);
    lidShape.lineTo(0, -1.55);
    lidShape.bezierCurveTo(0, -1.85, 0.34, -1.95, 0.66, -1.88);
    lidShape.bezierCurveTo(0.99, -1.82, 1.18, -1.50, 1.22, -1.15);
    lidShape.bezierCurveTo(1.26, -0.75, 1.48, -0.30, 1.48, 0.015);
    lidShape.lineTo(0, 0.015);
    const lidGeom = new THREE.ExtrudeGeometry(lidShape, {
      depth: 0.022,
      bevelEnabled: true,
      bevelSegments: 2,
      bevelSize: 0.005,
      bevelThickness: 0.005
    });
    lidGeom.rotateX(Math.PI / 2);
    const lidMesh = new THREE.Mesh(lidGeom, this.grandEbonyMaterial);
    lidMesh.castShadow = true;
    lidMesh.receiveShadow = true;
    lidGroup.add(lidMesh);

    // Folded front flap on lid (rests folded back on top of the main lid)
    const flapShape = new THREE.Shape();
    flapShape.moveTo(0, -0.15);
    flapShape.lineTo(1.48, -0.15);
    flapShape.lineTo(1.48, -0.45);
    flapShape.lineTo(0, -0.45);
    flapShape.lineTo(0, -0.15);
    const flapGeom = new THREE.ExtrudeGeometry(flapShape, {
      depth: 0.020,
      bevelEnabled: true,
      bevelSegments: 2,
      bevelSize: 0.004,
      bevelThickness: 0.004
    });
    flapGeom.rotateX(Math.PI / 2);
    const flapMesh = new THREE.Mesh(flapGeom, this.grandEbonyMaterial);
    flapMesh.position.set(0, 0.024, 0);
    flapMesh.castShadow = true;
    lidGroup.add(flapMesh);

    // Brass hinges along left edge
    [-0.30, -0.80, -1.35].forEach(hz => {
      const hingeGeom = new THREE.CylinderGeometry(0.005, 0.005, 0.05, 8);
      const hinge = new THREE.Mesh(hingeGeom, this.grandBrassMaterial);
      hinge.position.set(0.003, 0.012, hz);
      lidGroup.add(hinge);
    });

    // Support cup blocks on underside of lid (tacos de apoyo con cazoleta de latón)
    // Primary cup block for long concert prop stick (full concert open)
    const mainCupGroup = new THREE.Group();
    mainCupGroup.position.set(1.18, -0.022, -0.46);
    const cupBlockGeom = new THREE.BoxGeometry(0.064, 0.018, 0.048);
    const cupBlock = new THREE.Mesh(cupBlockGeom, this.grandEbonyMaterial);
    cupBlock.position.y = -0.009;
    mainCupGroup.add(cupBlock);
    const cupSocketGeom = new THREE.CylinderGeometry(0.012, 0.009, 0.012, 16);
    const cupSocket = new THREE.Mesh(cupSocketGeom, this.grandBrassMaterial);
    cupSocket.position.y = -0.016;
    mainCupGroup.add(cupSocket);
    lidGroup.add(mainCupGroup);

    // Secondary cup block for short prop stick (half-stick position)
    const shortCupGroup = new THREE.Group();
    shortCupGroup.position.set(0.96, -0.022, -0.54);
    const shortCupBlock = new THREE.Mesh(cupBlockGeom, this.grandEbonyMaterial);
    shortCupBlock.position.y = -0.009;
    shortCupGroup.add(shortCupBlock);
    const shortCupSocket = new THREE.Mesh(cupSocketGeom, this.grandBrassMaterial);
    shortCupSocket.position.y = -0.016;
    shortCupGroup.add(shortCupSocket);
    lidGroup.add(shortCupGroup);

    lidGroup.rotation.z = 0.56; // Tilted open UPWARDS ~32 degrees
    this.grandPianoGroup.add(lidGroup);

    // 10. Lid Prop Sticks & Rim Pivot Mount (Soporte de la tapa y varillas)
    // Hinge bracket mounted securely to the inside right rim
    const rimHingePos = new THREE.Vector3(0.620, 0.940, -0.38);
    const rimMountGroup = new THREE.Group();
    rimMountGroup.position.copy(rimHingePos);

    // Solid wood mounting block shaped to inner rim
    const rimMountBlockGeom = new THREE.BoxGeometry(0.038, 0.016, 0.075);
    const rimMountBlock = new THREE.Mesh(rimMountBlockGeom, this.grandEbonyMaterial);
    rimMountBlock.position.set(0.008, -0.008, 0);
    rimMountGroup.add(rimMountBlock);

    // Brass mounting plate on inner rim shelf
    const mountPlateGeom = new THREE.BoxGeometry(0.028, 0.008, 0.065);
    const mountPlate = new THREE.Mesh(mountPlateGeom, this.grandBrassMaterial);
    mountPlate.position.set(0, 0.004, 0);
    rimMountGroup.add(mountPlate);

    // Brass hinge knuckle & pivot pin
    const knuckleGeom = new THREE.CylinderGeometry(0.006, 0.006, 0.024, 12);
    knuckleGeom.rotateX(Math.PI / 2);
    const knuckle = new THREE.Mesh(knuckleGeom, this.grandBrassMaterial);
    knuckle.position.set(0, 0.012, 0);
    rimMountGroup.add(knuckle);

    this.grandPianoGroup.add(rimMountGroup);

    // Compute exact connection points in grandPianoGroup space
    mainCupGroup.updateMatrix();
    lidGroup.updateMatrix();
    rimMountGroup.updateMatrix();

    // Position of cup socket in grandPianoGroup space
    const lidCupGP = cupSocket.position.clone()
      .applyMatrix4(mainCupGroup.matrix)
      .applyMatrix4(lidGroup.matrix);

    // Position of rim knuckle in grandPianoGroup space
    const rimHingeGP = knuckle.position.clone()
      .applyMatrix4(rimMountGroup.matrix);

    // Long Concert Prop Stick extending from rim hinge directly into lid cup socket
    const stickVector = new THREE.Vector3().subVectors(lidCupGP, rimHingeGP);
    const stickLength = stickVector.length();
    const stickDir = stickVector.clone().normalize();
    const stickMid = new THREE.Vector3().addVectors(rimHingeGP, lidCupGP).multiplyScalar(0.5);

    const propStickGroup = new THREE.Group();
    propStickGroup.position.copy(stickMid);
    propStickGroup.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), stickDir);

    // Main wooden prop shaft (ebony concert lacquer, rectangular with rounded bevel)
    const shaftGeom = new THREE.BoxGeometry(0.022, stickLength - 0.024, 0.014);
    const shaftMesh = new THREE.Mesh(shaftGeom, this.grandEbonyMaterial);
    shaftMesh.castShadow = true;
    propStickGroup.add(shaftMesh);

    // Brass hinge knuckle at bottom of stick
    const bottomKnuckleGeom = new THREE.CylinderGeometry(0.006, 0.006, 0.020, 12);
    bottomKnuckleGeom.rotateX(Math.PI / 2);
    const bottomKnuckle = new THREE.Mesh(bottomKnuckleGeom, this.grandBrassMaterial);
    bottomKnuckle.position.set(0, -stickLength / 2 + 0.006, 0);
    propStickGroup.add(bottomKnuckle);

    // Brass ferrule & tip pin inserting into lid cup
    const topFerruleGeom = new THREE.CylinderGeometry(0.008, 0.008, 0.020, 14);
    const topFerrule = new THREE.Mesh(topFerruleGeom, this.grandBrassMaterial);
    topFerrule.position.set(0, stickLength / 2 - 0.010, 0);
    propStickGroup.add(topFerrule);

    const topPinGeom = new THREE.CylinderGeometry(0.0045, 0.0045, 0.016, 12);
    const topPin = new THREE.Mesh(topPinGeom, this.grandBrassMaterial);
    topPin.position.set(0, stickLength / 2 + 0.006, 0);
    propStickGroup.add(topPin);

    this.grandPianoGroup.add(propStickGroup);

    // 10. 3 Sculpted Concert Legs with Solid Brass Dual Casters
    const legPositions = [
      { x: -0.62, z: 0.04 },  // Front Left
      { x: 0.62, z: 0.04 },   // Front Right
      { x: -0.15, z: -1.65 }  // Rear Tail
    ];

    legPositions.forEach(lp => {
      const leg = new THREE.Group();
      leg.position.set(lp.x, 0, lp.z);

      // Top square mounting block
      const topBlockGeom = new THREE.BoxGeometry(0.13, 0.12, 0.13);
      const topBlock = new THREE.Mesh(topBlockGeom, this.grandEbonyMaterial);
      topBlock.position.y = 0.63;
      topBlock.castShadow = true;
      leg.add(topBlock);

      // Sculpted concert pillar
      const pillarGeom = new THREE.CylinderGeometry(0.046, 0.036, 0.52, 16);
      const pillar = new THREE.Mesh(pillarGeom, this.grandEbonyMaterial);
      pillar.position.y = 0.32;
      pillar.castShadow = true;
      leg.add(pillar);

      // Solid brass spade ferrule collar
      const ferruleGeom = new THREE.CylinderGeometry(0.038, 0.042, 0.05, 16);
      const ferrule = new THREE.Mesh(ferruleGeom, this.grandBrassMaterial);
      ferrule.position.y = 0.085;
      leg.add(ferrule);

      // Dual Solid Brass Caster Wheels resting on stage floor (Y = 0)
      [-0.018, 0.018].forEach(cx => {
        const wheelGeom = new THREE.CylinderGeometry(0.028, 0.028, 0.016, 16);
        wheelGeom.rotateZ(Math.PI / 2);
        const wheel = new THREE.Mesh(wheelGeom, this.grandBrassMaterial);
        wheel.position.set(cx, 0.028, 0);
        wheel.castShadow = true;
        leg.add(wheel);
      });

      this.grandPianoGroup.add(leg);
    });

    // 11. Grand Lyre & 3 Brass Concert Pedals
    const lyreGroup = new THREE.Group();
    lyreGroup.position.set(0, 0, 0.10);

    // Top mounting block under keybed
    const lyreTopGeom = new THREE.BoxGeometry(0.24, 0.04, 0.08);
    const lyreTop = new THREE.Mesh(lyreTopGeom, this.grandEbonyMaterial);
    lyreTop.position.y = 0.67;
    lyreGroup.add(lyreTop);

    // Bottom pedal box resting right above stage floor (Y = 0)
    const pedalBoxGeom = new THREE.BoxGeometry(0.26, 0.048, 0.095);
    const pedalBox = new THREE.Mesh(pedalBoxGeom, this.grandEbonyMaterial);
    pedalBox.position.y = 0.034;
    pedalBox.castShadow = true;
    lyreGroup.add(pedalBox);

    // Two vertical fluted posts connecting top block to pedal box
    [-0.085, 0.085].forEach(px => {
      const postGeom = new THREE.CylinderGeometry(0.018, 0.018, 0.592, 16);
      const post = new THREE.Mesh(postGeom, this.grandEbonyMaterial);
      post.position.set(px, 0.354, 0);
      post.castShadow = true;
      lyreGroup.add(post);
    });

    // 3 Solid Brass Pedals: [0] Una Corda, [1] Sostenuto, [2] Damper
    const pedalPivots = [];
    const pedalRods = [];
    [-0.065, 0.0, 0.065].forEach((pedX) => {
      const pedPivot = new THREE.Group();
      pedPivot.position.set(pedX, 0.036, 0.035);

      const pedGeom = new THREE.BoxGeometry(0.026, 0.013, 0.09);
      const ped = new THREE.Mesh(pedGeom, this.grandBrassMaterial);
      ped.position.set(0, 0, 0.042);
      ped.castShadow = true;
      pedPivot.add(ped);

      // Upturned front toe curve
      const toeGeom = new THREE.CylinderGeometry(0.009, 0.009, 0.026, 12);
      toeGeom.rotateZ(Math.PI / 2);
      const toe = new THREE.Mesh(toeGeom, this.grandBrassMaterial);
      toe.position.set(0, 0.006, 0.086);
      toe.castShadow = true;
      pedPivot.add(toe);

      lyreGroup.add(pedPivot);
      pedalPivots.push(pedPivot);

      // Vertical brass pedal rod extending upward to keybed
      const rodGeom = new THREE.CylinderGeometry(0.004, 0.004, 0.60, 8);
      const rod = new THREE.Mesh(rodGeom, this.grandBrassMaterial);
      rod.position.set(pedX, 0.35, -0.01);
      lyreGroup.add(rod);
      pedalRods.push(rod);
    });
    this.grandUnaCordaPedal = pedalPivots[0]; // Left pedal (Una Corda / soft)
    this.grandSostenutoPedal = pedalPivots[1]; // Center pedal (Sostenuto)
    this.grandDamperPedal = pedalPivots[2]; // Rightmost pedal (Damper / sustain)
    this.grandPedalRods = pedalRods;

    this.grandPianoGroup.add(lyreGroup);

    // 12. Concert Artist Leather Bench (Banqueta de concierto)
    const benchGroup = new THREE.Group();
    benchGroup.position.set(0, 0, 0.62);

    // Tufted leather cushion top
    const cushionGeom = new THREE.BoxGeometry(0.72, 0.075, 0.34);
    const cushion = new THREE.Mesh(cushionGeom, this.leatherBenchMaterial);
    cushion.position.y = 0.485;
    cushion.castShadow = true;
    benchGroup.add(cushion);

    // Tufting buttons
    for (let bx = -0.28; bx <= 0.28; bx += 0.095) {
      for (let bz = -0.10; bz <= 0.10; bz += 0.10) {
        const btnGeom = new THREE.SphereGeometry(0.007, 8, 6);
        const btn = new THREE.Mesh(btnGeom, this.leatherBenchMaterial);
        btn.position.set(bx, 0.523, bz);
        benchGroup.add(btn);
      }
    }

    // Wood skirt frame
    const skirtGeom = new THREE.BoxGeometry(0.70, 0.045, 0.32);
    const skirt = new THREE.Mesh(skirtGeom, this.grandEbonyMaterial);
    skirt.position.y = 0.435;
    skirt.castShadow = true;
    benchGroup.add(skirt);

    // 4 Square Tapered Concert Spade Legs
    [
      { x: -0.31, z: -0.12 },
      { x: 0.31, z: -0.12 },
      { x: -0.31, z: 0.12 },
      { x: 0.31, z: 0.12 }
    ].forEach(bp => {
      const bLegGeom = new THREE.CylinderGeometry(0.022, 0.015, 0.41, 4);
      bLegGeom.rotateY(Math.PI / 4);
      const bLeg = new THREE.Mesh(bLegGeom, this.grandEbonyMaterial);
      bLeg.position.set(bp.x, 0.205, bp.z);
      bLeg.castShadow = true;
      benchGroup.add(bLeg);
    });

    // Dual brass height adjustment knobs on left and right sides
    [-0.37, 0.37].forEach((kx) => {
      const knobGeom = new THREE.CylinderGeometry(0.022, 0.022, 0.035, 16);
      knobGeom.rotateZ(Math.PI / 2);
      const knob = new THREE.Mesh(knobGeom, this.grandBrassMaterial);
      knob.position.set(kx, 0.435, 0);
      benchGroup.add(knob);
    });

    this.grandPianoGroup.add(benchGroup);

    // Initially hidden until solo piano mode is enabled
    this.grandPianoGroup.visible = false;
    this.group.add(this.grandPianoGroup);
  }

  setGrandPianoMode(isGrand) {
    if (this.tier !== 1) return;
    this.isGrandPiano = isGrand;
    this.group.userData.isGrandPiano = isGrand;

    if (isGrand) {
      // Hide electronic stage keyboard workstation & stand
      if (this.keyboardBody) this.keyboardBody.visible = false;
      if (this.standGroup) this.standGroup.visible = false;
      if (this.floorPedalGroup) this.floorPedalGroup.visible = false;
      if (this.pedalLight) this.pedalLight.visible = false;
      if (this.cableMesh) this.cableMesh.visible = false;
      if (this.strapMesh) this.strapMesh.visible = false;
      if (this.plugGroup) this.plugGroup.visible = false;
      if (this.tierRiserGroup) this.tierRiserGroup.visible = false;

      // Show Grand Piano
      if (this.grandPianoGroup) {
        this.grandPianoGroup.visible = true;
        // Mount 88 keys flush into Grand Piano keybed
        if (this.keybedGroup) {
          this.grandPianoGroup.add(this.keybedGroup);
          this.keybedGroup.position.set(0.0, 0.730, 0.045);
          this.keybedGroup.rotation.set(0, 0, 0);
        }
      }

      this.group.rotation.y = 0.28;
    } else {
      // Show electronic stage keyboard workstation & stand
      if (this.keyboardBody) this.keyboardBody.visible = true;
      if (this.standGroup) this.standGroup.visible = true;
      if (this.floorPedalGroup) this.floorPedalGroup.visible = true;
      if (this.pedalLight) this.pedalLight.visible = true;
      if (this.cableMesh) this.cableMesh.visible = true;
      if (this.strapMesh) this.strapMesh.visible = true;
      if (this.plugGroup) this.plugGroup.visible = true;
      if (this.tierRiserGroup) this.tierRiserGroup.visible = true;

      // Hide Grand Piano
      if (this.grandPianoGroup) {
        this.grandPianoGroup.visible = false;
      }

      // Return 88 keys to electronic keyboard chassis shelf
      if (this.keybedGroup && this.keyboardBody) {
        this.keyboardBody.add(this.keybedGroup);
        this.keybedGroup.position.set(0.045, 0.085, 0.005);
        this.keybedGroup.rotation.set(0, 0, 0);
      }

      this.group.rotation.y = Math.PI * 0.14;
    }
  }

  update() {}
}
