import * as THREE from 'three';
import gsap from 'gsap';

/**
 * Recorder3D: Authentic Soprano Recorder (Flauta Dulce Soprano Barroca)
 * Inspired by the classic ivory-white ABS acoustic resin soprano recorder
 * (Yamaha YRS-24B / Aileen Baroque Soprano Recorder).
 * 
 * Anatomy & Features:
 * - Lustrous warm-ivory / cream acoustic polymer resin with clearcoat specular sheen.
 * - Precision-turned Baroque 3-piece silhouette: Headjoint (cabeza), Middle body (cuerpo), Footjoint (pie).
 * - Carved ergonomic beak (pico de pato) with windway slit and cedar plug block.
 * - Carved rectangular sound window (labium / ventana) with sharp beveled voicing wedge (el bisel).
 * - Stamped metallic gold brand emblem & ornate baroque crest below the labium.
 * - Sculpted bulbous Baroque ornamental collars (collar abombado) with stepped accent beads.
 * - 8 Baroque tone holes including authentic TWIN DOUBLE HOLES at Hole 6 and Hole 7.
 * - Rear octave register thumb-hole (portavoz).
 * - Dynamic glowing acoustic resonance gemstones upon active MIDI notes.
 * - Half-hole chromatic voicing animation for double holes (C#, D#, F#).
 * - Concentric acoustic soundwaves emitting from the flared bell.
 * - Ethereal breath condensation vortices spiraling from the voicing window.
 * - Professional weighted chrome studio floor stand with bell-mount support.
 */

export class Recorder3D {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();

    // Stage placement default (standing eye-level at front-right wind section)
    this.group.position.set(1.60, 1.28, 1.80);

    this.keys = [];
    this.breathParticles = [];
    this.airOutputRings = [];
    this.activeNote = null;
    this.resonancePhase = 0;

    this._buildMaterials();
    this._buildStand();
    this._buildRecorder();
    this._buildToneHoles();
    this._buildBreathDynamics();

    this.scene.add(this.group);
  }

  /* ------------------------------------------------------------------ */
  /*  MATERIALS                                                         */
  /* ------------------------------------------------------------------ */

  _buildMaterials() {
    // 1. Polished Acoustic Ivory ABS Resin
    this.ivoryMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xF7EFE0,        // Warm ivory / eggshell cream
      emissive: 0x2A241A,     // Subtle warm subsurface depth
      emissiveIntensity: 0.05,
      roughness: 0.18,        // Silky smooth molded polymer
      metalness: 0.02,
      clearcoat: 0.65,        // High-gloss protective acoustic lacquer
      clearcoatRoughness: 0.10,
      sheen: 0.35,
      sheenColor: 0xFFF8EE,
      ior: 1.54,              // Refractive index of polished ABS plastic
      side: THREE.DoubleSide
    });

    // 2. Dark Acoustic Bore & Hole Cavities
    this.boreMaterial = new THREE.MeshBasicMaterial({
      color: 0x12100E
    });

    // 3. Aromatic Red Cedar Windway Plug Block (El Bloque de madera interior)
    this.cedarMaterial = new THREE.MeshStandardMaterial({
      color: 0xC07E4A,
      roughness: 0.65,
      metalness: 0.02
    });

    // 4. Stamped Metallic Gold Brand Emblem
    this.goldEmblemMaterial = new THREE.MeshStandardMaterial({
      color: 0xE5BC45,
      emissive: 0x3E2D08,
      emissiveIntensity: 0.15,
      roughness: 0.22,
      metalness: 0.90
    });

    // 5. Active Playing Resonance Gemstones (Warm luminous amber glow)
    this.holeGlowMaterial = new THREE.MeshStandardMaterial({
      color: 0xFFD044,
      emissive: 0xFFA008,
      emissiveIntensity: 2.4,
      transparent: true,
      opacity: 0,
      roughness: 0.18,
      metalness: 0.20
    });

    // 6. Polished Mirror-Chrome Studio Stand (matching flute, trumpet, and harmonica)
    this.chromeStandMaterial = new THREE.MeshStandardMaterial({
      color: 0xF2F5F8,
      roughness: 0.18,
      metalness: 0.88
    });

    // 7. Machined Brass Accent Ring on Clutch Collar
    this.brassAccentMaterial = new THREE.MeshStandardMaterial({
      color: 0xF0C058,
      roughness: 0.22,
      metalness: 0.85
    });

    // 8. Non-Slip Protective Rubber / Velvet Footing
    this.rubberMaterial = new THREE.MeshStandardMaterial({
      color: 0x18181A,
      roughness: 0.88,
      metalness: 0.02
    });
  }

  /* ------------------------------------------------------------------ */
  /*  STUDIO PEDESTAL STAND (Matching Flute, Trumpet & Harmonica)       */
  /* ------------------------------------------------------------------ */

  _buildStand() {
    const stand = new THREE.Group();
    // Reaches from stage floor (-1.28)
    // Offset stand slightly behind the recorder (Z = -0.055) so the downward air/sound exit
    // from the bell (at Z = +0.0223, Y = -0.158) is 100% free and unobstructed
    stand.position.set(0, -1.28, -0.055);

    // 1. Heavy studio cast round silver chrome base with beveled rim (matching flute, trumpet, harmonica)
    const basePlate = new THREE.Mesh(
      new THREE.CylinderGeometry(0.18, 0.21, 0.032, 32),
      this.chromeStandMaterial
    );
    basePlate.position.y = 0.016;
    basePlate.castShadow = true;
    basePlate.receiveShadow = true;
    stand.add(basePlate);

    // Machined outer chamfer / decorative stepped chrome ring
    const baseStep = new THREE.Mesh(
      new THREE.CylinderGeometry(0.150, 0.176, 0.010, 32),
      this.chromeStandMaterial
    );
    baseStep.position.y = 0.033;
    stand.add(baseStep);

    // Outer rim bevel ring (torus catch light)
    const baseRim = new THREE.Mesh(
      new THREE.TorusGeometry(0.178, 0.006, 12, 32),
      this.chromeStandMaterial
    );
    baseRim.rotation.x = Math.PI * 0.5;
    baseRim.position.y = 0.031;
    stand.add(baseRim);

    // 3 Non-slip black rubber feet underneath spaced at 120°
    for (let i = 0; i < 3; i++) {
      const angle = (i * Math.PI * 2) / 3;
      const foot = new THREE.Mesh(
        new THREE.CylinderGeometry(0.016, 0.016, 0.008, 16),
        this.rubberMaterial
      );
      foot.position.set(Math.cos(angle) * 0.17, 0.004, Math.sin(angle) * 0.17);
      stand.add(foot);
    }

    // 2. Telescoping central column with machined locking collar & brass accent
    const lowerMastHeight = 0.64;
    const lowerMast = new THREE.Mesh(
      new THREE.CylinderGeometry(0.013, 0.013, lowerMastHeight, 16),
      this.chromeStandMaterial
    );
    lowerMast.position.y = 0.036 + lowerMastHeight * 0.5;
    lowerMast.castShadow = true;
    stand.add(lowerMast);

    // Machined clutch collar in chrome
    const collarY = 0.036 + lowerMastHeight;
    const clutch = new THREE.Mesh(
      new THREE.CylinderGeometry(0.019, 0.019, 0.038, 20),
      this.chromeStandMaterial
    );
    clutch.position.y = collarY;
    clutch.castShadow = true;
    stand.add(clutch);

    // Brass knurled accent ring on the clutch collar
    const brassRing = new THREE.Mesh(
      new THREE.CylinderGeometry(0.0196, 0.0196, 0.009, 20),
      this.brassAccentMaterial
    );
    brassRing.position.y = collarY;
    stand.add(brassRing);

    // Locking T-screw knob on the collar
    const screwKnob = new THREE.Group();
    screwKnob.position.set(0.019, collarY, 0);
    const screwStem = new THREE.Mesh(
      new THREE.CylinderGeometry(0.004, 0.004, 0.014, 8),
      this.chromeStandMaterial
    );
    screwStem.rotation.z = Math.PI * 0.5;
    screwStem.position.x = 0.007;
    screwKnob.add(screwStem);

    const screwHandle = new THREE.Mesh(
      new THREE.BoxGeometry(0.008, 0.024, 0.008),
      this.chromeStandMaterial
    );
    screwHandle.position.x = 0.014;
    screwKnob.add(screwHandle);
    stand.add(screwKnob);

    // Upper chrome mast extending to the cantilever joint
    const upperMastHeight = 0.46;
    const upperMast = new THREE.Mesh(
      new THREE.CylinderGeometry(0.009, 0.009, upperMastHeight, 16),
      this.chromeStandMaterial
    );
    upperMast.position.y = collarY + 0.019 + upperMastHeight * 0.5;
    upperMast.castShadow = true;
    stand.add(upperMast);

    // 3. Cantilever Arm & Waist Suspension Ring (Leaving bottom bell & air exit 100% unobstructed)
    const mastTopY = collarY + 0.019 + upperMastHeight; // 1.165 in stand space = -0.115 in group space

    // Top elbow joint collar
    const elbowCollar = new THREE.Mesh(
      new THREE.CylinderGeometry(0.012, 0.012, 0.022, 16),
      this.chromeStandMaterial
    );
    elbowCollar.position.y = mastTopY;
    stand.add(elbowCollar);

    // Forward cantilever support arm reaching from the rear mast to the recorder waist
    const armLength = 0.073;
    const armGeo = new THREE.CylinderGeometry(0.006, 0.006, armLength, 14);
    armGeo.rotateX(Math.PI * 0.5); // align along Z axis
    const cantileverArm = new THREE.Mesh(armGeo, this.chromeStandMaterial);
    // Center of arm halfway between Z=0 and Z=0.073
    cantileverArm.position.set(0, mastTopY - 0.005, armLength * 0.5);
    stand.add(cantileverArm);

    // Sleek chrome suspension ring holding the recorder around its narrow waist (Y = -0.124 in group)
    // The ring holds the recorder waist securely without obstructing the bottom bell opening!
    const targetZ = armLength;
    const targetY = mastTopY - 0.009; // 1.156 in stand space = -0.124 in group space
    const supportRing = new THREE.Mesh(
      new THREE.TorusGeometry(0.0135, 0.0028, 12, 32),
      this.chromeStandMaterial
    );
    supportRing.position.set(0, targetY, targetZ);
    // Tilt to match the recorder's -0.14 rad backward tilt
    supportRing.rotation.x = Math.PI * 0.5 - 0.14;
    stand.add(supportRing);

    this.group.add(stand);
  }

  /* ------------------------------------------------------------------ */
  /*  RECORDER MODEL (HEADJOINT, BODY, FOOTJOINT, BEAK & LABIUM)        */
  /* ------------------------------------------------------------------ */

  _buildRecorder() {
    const recorderGroup = new THREE.Group();
    // Gentle 8-degree ergonomic tilt backwards for ideal viewing perspective
    recorderGroup.rotation.x = -0.14;
    this.recorderGroup = recorderGroup;

    // --- FULL ANATOMICAL PROFILE (LatheGeometry with 48 radial segments) ---
    // Y runs from -0.160 (Bell bottom lip) to +0.165 (Beak opening)
    const points = [
      // 1. Bell inner bore lip
      new THREE.Vector2(0.0075, -0.160),
      new THREE.Vector2(0.0075, -0.145),
      // 2. Bell outer flared lip with stepped rounded bead
      new THREE.Vector2(0.0165, -0.160),
      new THREE.Vector2(0.0172, -0.157),
      new THREE.Vector2(0.0170, -0.150),
      new THREE.Vector2(0.0152, -0.145),
      // 3. Flared bell waist
      new THREE.Vector2(0.0125, -0.138),
      new THREE.Vector2(0.0110, -0.126),
      new THREE.Vector2(0.0112, -0.115),
      // 4. Footjoint body (Double hole 7 at Y = -0.088)
      new THREE.Vector2(0.0116, -0.098),
      new THREE.Vector2(0.0118, -0.088), // Double hole 7
      new THREE.Vector2(0.0120, -0.078),
      // 5. Footjoint upper socket collar (collar abombado entre cuerpo y pie)
      new THREE.Vector2(0.0135, -0.074),
      new THREE.Vector2(0.0148, -0.068), // Crest of lower collar
      new THREE.Vector2(0.0146, -0.064),
      new THREE.Vector2(0.0130, -0.061), // Joint seam groove
      new THREE.Vector2(0.0132, -0.059), // Joint accent bead
      // 6. Middle Joint Body (Holes 6 to 1)
      new THREE.Vector2(0.0112, -0.054),
      new THREE.Vector2(0.0110, -0.046), // Hole 6 (Double)
      new THREE.Vector2(0.0109, -0.022), // Hole 5
      new THREE.Vector2(0.0110,  0.004), // Hole 4
      new THREE.Vector2(0.0112,  0.028), // Hole 3
      new THREE.Vector2(0.0114,  0.048), // Hole 2
      new THREE.Vector2(0.0116,  0.068), // Hole 1
      new THREE.Vector2(0.0118,  0.075),
      // 9. Large Baroque Joint Collar (Gran collar abombado barroco)
      new THREE.Vector2(0.0125,  0.077),
      new THREE.Vector2(0.0146,  0.082),
      new THREE.Vector2(0.0165,  0.088), // Crest of big collar
      new THREE.Vector2(0.0160,  0.095),
      new THREE.Vector2(0.0135,  0.098), // Upper groove
      new THREE.Vector2(0.0138,  0.101), // Accent bead
      new THREE.Vector2(0.0130,  0.103), // Headjoint seam line
      // 10. Headjoint Casing (Brand logo & labium window)
      new THREE.Vector2(0.0131,  0.106),
      new THREE.Vector2(0.0133,  0.114), // Golden logo
      new THREE.Vector2(0.0135,  0.124), // Labium window bottom
      new THREE.Vector2(0.0135,  0.134)  // Seamless transition to sculpted non-circular beak
    ];

    const latheGeo = new THREE.LatheGeometry(points, 48);
    const bodyMesh = new THREE.Mesh(latheGeo, this.ivoryMaterial);
    bodyMesh.castShadow = true;
    bodyMesh.receiveShadow = true;
    recorderGroup.add(bodyMesh);

    // --- CARVED LABIUM WINDOW & BEVELED VOICING EDGE (Ventana y Bisel) ---
    // Positioned on the front (+Z) face at Y in [0.124, 0.134]
    const windowGroup = new THREE.Group();
    windowGroup.position.set(0, 0.129, 0.0130);

    // 1. Dark rectangular acoustic window cut
    const windowCutGeo = new THREE.BoxGeometry(0.0092, 0.0046, 0.0040);
    const windowCut = new THREE.Mesh(windowCutGeo, this.boreMaterial);
    windowCut.position.set(0, 0, -0.0010);
    windowGroup.add(windowCut);

    // 2. Sharp Beveled Voicing Wedge (El Bisel)
    // Slopes downward and inward into the airstream splitting the windway
    const wedgeShape = new THREE.Shape();
    wedgeShape.moveTo(-0.0045, -0.0023);
    wedgeShape.lineTo(0.0045, -0.0023);
    wedgeShape.lineTo(0.0045, 0.0005);
    wedgeShape.lineTo(-0.0045, 0.0005);
    wedgeShape.closePath();

    const rampGeo = new THREE.ExtrudeGeometry(wedgeShape, {
      depth: 0.0035,
      bevelEnabled: true,
      bevelSegments: 2,
      steps: 1,
      bevelSize: 0.0004,
      bevelThickness: 0.0004
    });
    rampGeo.rotateX(Math.PI * 0.45);
    const rampMesh = new THREE.Mesh(rampGeo, this.ivoryMaterial);
    rampMesh.position.set(0, -0.0020, 0.0008);
    windowGroup.add(rampMesh);

    // 3. Aromatic Red Cedar Block visible inside the window
    const cedarBlock = new THREE.Mesh(
      new THREE.BoxGeometry(0.0086, 0.0035, 0.0025),
      this.cedarMaterial
    );
    cedarBlock.position.set(0, 0.0018, -0.0020);
    windowGroup.add(cedarBlock);

    recorderGroup.add(windowGroup);

    // --- SCULPTED NON-CIRCULAR BEAK (BOQUILLA ANATÓMICA NO REDONDA) ---
    // Follows authentic Baroque recorder geometry (media_1789136250735.png & media_1789136293962.png):
    // - Lateral taper (width tapers from 27mm at base down to ~15.5mm at tip)
    // - Smooth aerodynamic convex arch on front (+Z)
    // - Angled lip-rest bevel cut on rear (-Z) slicing up at ~30 deg towards tip
    // - Exposed parabolic cedar wood plug on the cut plane
    // - Rectangular windway blowing slit at the top tip
    const Y_BASE = 0.134;
    const Y_TIP = 0.168;
    const R_BASE = 0.0135;

    const M = 40;
    const N = 48;

    const positions = [];
    const uvs = [];
    const indices = [];

    const Y_CUT_START = 0.1415;
    const Z_CUT_START = -0.0136;
    const Z_CUT_TIP = -0.0014;

    for (let i = 0; i <= M; i++) {
      const v = i / M;
      const y = Y_BASE + v * (Y_TIP - Y_BASE);

      // Subtle Baroque barrel swell
      const swell = 1.0 + 0.065 * Math.sin(Math.PI * Math.min(1.0, v / 0.65));

      // Lateral half-width (tapers smoothly toward tip)
      const wx = R_BASE * swell * (1.0 - 0.40 * Math.pow(v, 1.15));

      // Front depth (+Z)
      const wzFront = R_BASE * swell * (1.0 - 0.36 * Math.pow(v, 1.25));

      // Rear depth (-Z)
      const wzRearBase = R_BASE * swell * (1.0 - 0.22 * v);

      // Bevel cut Z limit
      let zCutPlane = -999;
      if (y >= Y_CUT_START) {
        const cutT = (y - Y_CUT_START) / (Y_TIP - Y_CUT_START);
        zCutPlane = THREE.MathUtils.lerp(Z_CUT_START, Z_CUT_TIP, cutT);
      }

      for (let j = 0; j <= N; j++) {
        const u = j / N;
        const phi = u * Math.PI * 2; // Outward-facing normals

        const sinP = Math.sin(phi);
        const cosP = Math.cos(phi);

        let x = wx * sinP;
        let z = 0;

        if (cosP >= 0) {
          z = wzFront * cosP;
        } else {
          const naturalZ = wzRearBase * cosP;
          if (y >= Y_CUT_START && naturalZ < zCutPlane) {
            z = zCutPlane;

            const maxCutWidth = wx * Math.sqrt(Math.max(0, 1.0 - Math.pow(zCutPlane / wzRearBase, 2)));
            if (Math.abs(x) > maxCutWidth) {
              x = Math.sign(x) * maxCutWidth;
            }
          } else {
            z = naturalZ;
          }
        }

        positions.push(x, y, z);
        uvs.push(u, v);
      }
    }

    for (let i = 0; i < M; i++) {
      for (let j = 0; j < N; j++) {
        const a = i * (N + 1) + j;
        const b = (i + 1) * (N + 1) + j;
        const c = (i + 1) * (N + 1) + (j + 1);
        const d = i * (N + 1) + (j + 1);

        indices.push(a, d, b);
        indices.push(b, d, c);
      }
    }

    const beakShellGeo = new THREE.BufferGeometry();
    beakShellGeo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    beakShellGeo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    beakShellGeo.setIndex(indices);
    beakShellGeo.computeVertexNormals();

    const beakShellMesh = new THREE.Mesh(beakShellGeo, this.ivoryMaterial);
    beakShellMesh.castShadow = true;
    beakShellMesh.receiveShadow = true;
    recorderGroup.add(beakShellMesh);

    // --- EXPOSED CEDAR WOOD PLUG ON REAR BEVEL CUT (TAPÓN DE CEDRO) ---
    // Parabolic wooden face visible inside the beak bevel as in media_1789136250735.png
    const plugRows = 24;
    const plugCols = 16;
    const plugPos = [];
    const plugNorms = [];
    const plugUvs = [];
    const plugIndices = [];

    const dy = Y_TIP - Y_CUT_START;
    const dz = Z_CUT_TIP - Z_CUT_START;
    const planeLen = Math.sqrt(dy * dy + dz * dz);
    const nx = 0;
    const ny = dz / planeLen;
    const nz = -dy / planeLen; // Points toward rear (-Z)

    for (let r = 0; r <= plugRows; r++) {
      const t = 0.08 + (r / plugRows) * 0.92;
      const py = Y_CUT_START + t * dy;
      const pz = (Z_CUT_START + t * dz) - 0.00015;

      const tNorm = (t - 0.08) / 0.92;
      const maxHalfW = 0.0052;
      const curHalfW = maxHalfW * Math.sqrt(Math.max(0, tNorm));

      for (let c = 0; c <= plugCols; c++) {
        const s = (c / plugCols) * 2.0 - 1.0;
        const px = s * curHalfW;

        plugPos.push(px, py, pz);
        plugNorms.push(nx, ny, nz);
        plugUvs.push(s * 0.5 + 0.5, t);
      }
    }

    for (let r = 0; r < plugRows; r++) {
      for (let c = 0; c < plugCols; c++) {
        const a = r * (plugCols + 1) + c;
        const b = (r + 1) * (plugCols + 1) + c;
        const cc = (r + 1) * (plugCols + 1) + (c + 1);
        const d = r * (plugCols + 1) + (c + 1);

        plugIndices.push(a, b, d);
        plugIndices.push(b, cc, d);
      }
    }

    const plugGeo = new THREE.BufferGeometry();
    plugGeo.setAttribute('position', new THREE.Float32BufferAttribute(plugPos, 3));
    plugGeo.setAttribute('normal', new THREE.Float32BufferAttribute(plugNorms, 3));
    plugGeo.setAttribute('uv', new THREE.Float32BufferAttribute(plugUvs, 2));
    plugGeo.setIndex(plugIndices);

    const plugMesh = new THREE.Mesh(plugGeo, this.cedarMaterial);
    recorderGroup.add(plugMesh);

    // --- BEAK TIP TOP RIM & RECTANGULAR WINDWAY SLIT (CANAL DE VIENTO) ---
    const tipGroup = new THREE.Group();
    tipGroup.position.set(0, Y_TIP, 0);

    // Windway blowing entrance slit (narrow rectangular slot at top)
    const windwaySlit = new THREE.Mesh(
      new THREE.BoxGeometry(0.0092, 0.0040, 0.0016),
      this.boreMaterial
    );
    windwaySlit.position.set(0, -0.0012, 0.0018);
    tipGroup.add(windwaySlit);

    // Cedar floor inside the windway slot
    const windwayFloor = new THREE.Mesh(
      new THREE.BoxGeometry(0.0088, 0.0030, 0.0014),
      this.cedarMaterial
    );
    windwayFloor.position.set(0, -0.0015, 0.0006);
    tipGroup.add(windwayFloor);

    // Top Rim Cap closing the beak shell around the slit
    const topLipShape = new THREE.Shape();
    topLipShape.moveTo(-0.0078, -0.0014);
    topLipShape.lineTo(0.0078, -0.0014);
    topLipShape.quadraticCurveTo(0.0080, 0.0055, 0.0, 0.0055);
    topLipShape.quadraticCurveTo(-0.0080, 0.0055, -0.0078, -0.0014);

    const holePath = new THREE.Path();
    holePath.moveTo(-0.0046, 0.0010);
    holePath.lineTo(0.0046, 0.0010);
    holePath.lineTo(0.0046, 0.0026);
    holePath.lineTo(-0.0046, 0.0026);
    holePath.closePath();
    topLipShape.holes.push(holePath);

    const topCapGeo = new THREE.ExtrudeGeometry(topLipShape, {
      depth: 0.0012,
      bevelEnabled: true,
      bevelSegments: 2,
      bevelSize: 0.0003,
      bevelThickness: 0.0003
    });
    topCapGeo.rotateX(Math.PI * 0.5);
    const topCapMesh = new THREE.Mesh(topCapGeo, this.ivoryMaterial);
    topCapMesh.position.set(0, 0.0006, 0);
    tipGroup.add(topCapMesh);

    recorderGroup.add(tipGroup);

    // --- STAMPED METALLIC GOLD BRAND EMBLEM & SCRIPT ---
    // Below the labium window at Y = 0.114
    const emblemGroup = new THREE.Group();
    emblemGroup.position.set(0, 0.114, 0.0134);

    // 1. Central ornate Baroque crown / crest emblem
    const crownGeo = new THREE.CylinderGeometry(0.0012, 0.0020, 0.0032, 5);
    const crown = new THREE.Mesh(crownGeo, this.goldEmblemMaterial);
    crown.rotation.x = Math.PI * 0.5;
    crown.position.y = 0.0035;
    emblemGroup.add(crown);

    // 2. Elegant stamped brand lettering bar ("Aileen" script mark)
    const brandBar = new THREE.Mesh(
      new THREE.BoxGeometry(0.0075, 0.0018, 0.0006),
      this.goldEmblemMaterial
    );
    brandBar.position.set(0, 0.0005, 0.0002);
    emblemGroup.add(brandBar);

    // 3. Delicate flanking filigree scroll flourishes
    [-0.0042, 0.0042].forEach(x => {
      const flourish = new THREE.Mesh(
        new THREE.TorusGeometry(0.0010, 0.0003, 6, 12, Math.PI * 1.5),
        this.goldEmblemMaterial
      );
      flourish.position.set(x, 0.0005, 0.0002);
      flourish.rotation.z = x > 0 ? 0.4 : -0.4;
      emblemGroup.add(flourish);
    });

    recorderGroup.add(emblemGroup);

    // --- BOTTOM BELL CAVITY INTERIOR ---
    const bellCavity = new THREE.Mesh(
      new THREE.ConeGeometry(0.0080, 0.040, 24, 1, true),
      this.boreMaterial
    );
    bellCavity.position.set(0, -0.145, 0);
    recorderGroup.add(bellCavity);

    this.group.add(recorderGroup);
  }

  /* ------------------------------------------------------------------ */
  /*  AUTHENTIC TONE HOLES & TWIN DOUBLE HOLES                          */
  /* ------------------------------------------------------------------ */

  _buildToneHoles() {
    this.keys = [];

    // Authentic Baroque Soprano Layout:
    // Holes 1, 2, 3 (Left hand)
    // Holes 4, 5 (Right hand)
    // Hole 6: DOUBLE HOLE (Twin small side-by-side holes for Eb/E)
    // Hole 7: DOUBLE HOLE (Twin small side-by-side holes on foot for C/C#)
    // Thumb: Octave key on rear (-Z)
    const holeConfigs = [
      {
        id: 'Thumb',
        name: 'Thumb (Octave)',
        y: 0.072,
        z: -0.0118,
        radius: 0.0028,
        isDouble: false,
        isRear: true,
        role: 'left'
      },
      {
        id: 'L1',
        name: 'Hole 1 (L1)',
        y: 0.068,
        z: 0.0116,
        radius: 0.0026,
        isDouble: false,
        isRear: false,
        role: 'left'
      },
      {
        id: 'L2',
        name: 'Hole 2 (L2)',
        y: 0.048,
        z: 0.0114,
        radius: 0.0026,
        isDouble: false,
        isRear: false,
        role: 'left'
      },
      {
        id: 'L3',
        name: 'Hole 3 (L3)',
        y: 0.028,
        z: 0.0112,
        radius: 0.0026,
        isDouble: false,
        isRear: false,
        role: 'left'
      },
      {
        id: 'R1',
        name: 'Hole 4 (R1)',
        y: 0.004,
        z: 0.0110,
        radius: 0.0026,
        isDouble: false,
        isRear: false,
        role: 'right'
      },
      {
        id: 'R2',
        name: 'Hole 5 (R2)',
        y: -0.022,
        z: 0.0109,
        radius: 0.0026,
        isDouble: false,
        isRear: false,
        role: 'right'
      },
      {
        id: 'R3',
        name: 'Hole 6 (Double R3)',
        y: -0.046,
        z: 0.0110,
        radius: 0.0016, // Twin apertures
        isDouble: true,
        leftX: -0.0024,
        rightX: 0.0022,
        leftRadius: 0.0016,
        rightRadius: 0.0012,
        isRear: false,
        role: 'right'
      },
      {
        id: 'R4',
        name: 'Hole 7 (Double R4 Foot)',
        y: -0.088,
        z: 0.0118,
        radius: 0.0017, // Twin apertures
        isDouble: true,
        leftX: -0.0025,
        rightX: 0.0022,
        leftRadius: 0.0017,
        rightRadius: 0.0013,
        isRear: false,
        role: 'right'
      }
    ];

    holeConfigs.forEach((cfg, idx) => {
      const holeGroup = new THREE.Group();
      holeGroup.position.set(0, cfg.y, cfg.z);

      let auraMesh = null;
      let secondaryAura = null;

      if (!cfg.isDouble) {
        // --- SINGLE TONE HOLE ---
        // 1. Dark acoustic cavity disc
        const holeAperture = new THREE.Mesh(
          new THREE.CircleGeometry(cfg.radius, 20),
          this.boreMaterial
        );
        if (cfg.isRear) {
          holeAperture.rotation.y = Math.PI;
          holeAperture.position.z = -0.0004;
        } else {
          holeAperture.position.z = 0.0004;
        }
        holeGroup.add(holeAperture);

        // 2. Molded chamfered bezel ring around the hole
        const bezel = new THREE.Mesh(
          new THREE.TorusGeometry(cfg.radius + 0.0004, 0.0005, 8, 20),
          this.ivoryMaterial
        );
        if (cfg.isRear) bezel.rotation.y = Math.PI;
        bezel.position.z = cfg.isRear ? -0.0002 : 0.0002;
        holeGroup.add(bezel);

        // 3. Dynamic glowing resonance gemstone indicator
        const glowMat = this.holeGlowMaterial.clone();
        auraMesh = new THREE.Mesh(
          new THREE.CircleGeometry(cfg.radius * 1.05, 16),
          glowMat
        );
        if (cfg.isRear) auraMesh.rotation.y = Math.PI;
        auraMesh.position.z = cfg.isRear ? -0.0006 : 0.0006;
        holeGroup.add(auraMesh);

      } else {
        // --- AUTHENTIC BAROQUE TWIN DOUBLE HOLE ---
        // Left twin aperture (main tone hole)
        const leftHole = new THREE.Mesh(
          new THREE.CircleGeometry(cfg.leftRadius, 16),
          this.boreMaterial
        );
        leftHole.position.set(cfg.leftX, 0, 0.0004);
        holeGroup.add(leftHole);

        const leftBezel = new THREE.Mesh(
          new THREE.TorusGeometry(cfg.leftRadius + 0.0003, 0.0004, 6, 16),
          this.ivoryMaterial
        );
        leftBezel.position.set(cfg.leftX, 0, 0.0002);
        holeGroup.add(leftBezel);

        // Right twin aperture (chromatic half-hole)
        const rightHole = new THREE.Mesh(
          new THREE.CircleGeometry(cfg.rightRadius, 14),
          this.boreMaterial
        );
        rightHole.position.set(cfg.rightX, 0, 0.0004);
        holeGroup.add(rightHole);

        const rightBezel = new THREE.Mesh(
          new THREE.TorusGeometry(cfg.rightRadius + 0.0003, 0.0004, 6, 14),
          this.ivoryMaterial
        );
        rightBezel.position.set(cfg.rightX, 0, 0.0002);
        holeGroup.add(rightBezel);

        // Glowing resonance indicators
        const leftGlowMat = this.holeGlowMaterial.clone();
        auraMesh = new THREE.Mesh(
          new THREE.CircleGeometry(cfg.leftRadius * 1.1, 16),
          leftGlowMat
        );
        auraMesh.position.set(cfg.leftX, 0, 0.0006);
        holeGroup.add(auraMesh);

        const rightGlowMat = this.holeGlowMaterial.clone();
        secondaryAura = new THREE.Mesh(
          new THREE.CircleGeometry(cfg.rightRadius * 1.1, 14),
          rightGlowMat
        );
        secondaryAura.position.set(cfg.rightX, 0, 0.0006);
        holeGroup.add(secondaryAura);
      }

      this.recorderGroup.add(holeGroup);

      this.keys.push({
        id: cfg.id,
        name: cfg.name,
        group: holeGroup,
        aura: auraMesh,
        secondaryAura,
        isDouble: cfg.isDouble,
        index: idx,
        role: cfg.role,
        isCovered: false
      });
    });
  }

  /* ------------------------------------------------------------------ */
  /*  ACOUSTIC SOUNDWAVES & BREATH DYNAMICS                             */
  /* ------------------------------------------------------------------ */

  _buildBreathDynamics() {
    this.breathParticles = [];
    this.airOutputRings = [];

    // 1. Mouthpiece breath inflow rings/stream converging into the boquilla tip (Y = 0.168)
    const breathCount = 12;
    for (let i = 0; i < breathCount; i++) {
      const geom = new THREE.TorusGeometry(0.0036 + i * 0.0004, 0.0006, 8, 20);
      geom.rotateX(Math.PI * 0.5); // Horizontal ring entering the vertical boquilla
      const mat = new THREE.MeshBasicMaterial({
        color: 0x6FE3FF,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      });
      const ring = new THREE.Mesh(geom, mat);
      ring.scale.set(1.35, 1.0, 0.65); // Elliptical profile matching the rectangular windway slot
      ring.position.set(0, 0.168, 0.0018);
      this.recorderGroup.add(ring);

      this.breathParticles.push({
        mesh: ring,
        material: mat,
        baseScale: 0.55 + i * 0.07,
        offsetTime: (i / breathCount) * 1.0,
        active: false
      });
    }

    // 2. Concentric acoustic pressure soundwaves pulsing downwards from the bell
    const ringCount = 8;
    for (let i = 0; i < ringCount; i++) {
      const geom = new THREE.TorusGeometry(0.016, 0.0012, 8, 28);
      geom.rotateX(Math.PI * 0.5);
      const mat = new THREE.MeshBasicMaterial({
        color: 0x88D8FF,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      });
      const ring = new THREE.Mesh(geom, mat);
      ring.position.set(0, -0.160, 0);
      this.recorderGroup.add(ring);

      this.airOutputRings.push({
        mesh: ring,
        material: mat,
        baseScale: 0.90 + i * 0.05,
        offsetTime: (i / ringCount) * 1.0,
        active: false
      });
    }
  }

  /* ------------------------------------------------------------------ */
  /*  AUTHENTIC BAROQUE RECORDER FINGERING ENGINE                       */
  /* ------------------------------------------------------------------ */

  /**
   * Baroque Soprano Fingering Engine: Map MIDI pitch (C5 = 72 to C7 = 96)
   * to realistic tone-hole coverage states.
   * Returns a Map where key is hole id ('Thumb', 'L1', 'L2', 'L3', 'R1', 'R2', 'R3', 'R4')
   * and value is { covered: boolean, halfHole: boolean } for twin double holes.
   */
  _getBaroqueFingering(midiPitch) {
    const pitch = Math.max(72, Math.min(98, midiPitch));
    const semitonesFromC = (pitch - 72) % 12;
    const isHighOctave = pitch >= 84;

    const fingerState = new Map();
    const setAll = (holes, half = null) => {
      holes.forEach(h => fingerState.set(h, { covered: true, halfHole: false }));
      if (half) fingerState.set(half, { covered: true, halfHole: true });
    };

    switch (semitonesFromC) {
      case 0: // C5 / C6: All holes closed (low C requires both twins on R4)
        setAll(['Thumb', 'L1', 'L2', 'L3', 'R1', 'R2', 'R3', 'R4']);
        break;
      case 1: // C#5: Half-hole on R4 double-hole (only one twin closed)
        setAll(['Thumb', 'L1', 'L2', 'L3', 'R1', 'R2', 'R3'], 'R4');
        break;
      case 2: // D5: R4 open, R3 closed
        setAll(['Thumb', 'L1', 'L2', 'L3', 'R1', 'R2', 'R3']);
        break;
      case 3: // D#5 / Eb5: Half-hole on R3 double-hole
        setAll(['Thumb', 'L1', 'L2', 'L3', 'R1', 'R2'], 'R3');
        break;
      case 4: // E5: R1, R2 closed
        setAll(['Thumb', 'L1', 'L2', 'L3', 'R1', 'R2']);
        break;
      case 5: // F5: English Baroque fork fingering (R1, R3, R4 closed, R2 open)
        setAll(['Thumb', 'L1', 'L2', 'L3', 'R1', 'R3', 'R4']);
        break;
      case 6: // F#5: Fork fingering (R2 closed, R1 and R3 open)
        setAll(['Thumb', 'L1', 'L2', 'L3', 'R2']);
        break;
      case 7: // G5: Left hand closed (Thumb, L1, L2, L3)
        setAll(['Thumb', 'L1', 'L2', 'L3']);
        break;
      case 8: // G#5 / Ab5: Fork fingering (Thumb, L1, L2, R1, R2)
        setAll(['Thumb', 'L1', 'L2', 'R1', 'R2']);
        break;
      case 9: // A5: Thumb, L1, L2
        setAll(['Thumb', 'L1', 'L2']);
        break;
      case 10: // A#5 / Bb5: Fork fingering (Thumb, L1, L3, R1)
        setAll(['Thumb', 'L1', 'L3', 'R1']);
        break;
      case 11: // B5: Thumb, L1
        setAll(['Thumb', 'L1']);
        break;
    }

    if (isHighOctave && pitch > 84) {
      // Pinching thumb technique for upper octave register
      if (!fingerState.has('Thumb')) {
        fingerState.set('Thumb', { covered: true, halfHole: true });
      }
    }

    return fingerState;
  }

  /* ------------------------------------------------------------------ */
  /*  PLAYING EVENTS & ANIMATIONS                                       */
  /* ------------------------------------------------------------------ */

  onNoteOn(midiPitch, velocity = 0.8, eventTime = null, trackIndex = null, duration = 0.5) {
    const vel = Math.max(0.3, Math.min(1.0, velocity));
    let noteDur = 0.5;
    if (typeof duration === 'number' && duration > 0.05) {
      noteDur = duration;
    } else if (typeof eventTime === 'number' && eventTime > 0.05 && trackIndex === undefined) {
      noteDur = eventTime;
    }

    this.activeNote = {
      midiPitch,
      velocity: vel,
      duration: noteDur,
      elapsed: 0,
      active: true
    };

    // 1. Update Baroque tone hole lighting & half-hole double twin states
    const fingering = this._getBaroqueFingering(midiPitch);

    this.keys.forEach(k => {
      const state = fingering.get(k.id);
      const isCovered = !!state;
      k.isCovered = isCovered;

      if (k.aura) {
        gsap.killTweensOf(k.aura.material);
        if (isCovered) {
          gsap.to(k.aura.material, {
            opacity: 0.85 * vel,
            duration: 0.06,
            ease: 'power2.out'
          });
        } else {
          gsap.to(k.aura.material, {
            opacity: 0,
            duration: 0.12,
            ease: 'power2.out'
          });
        }
      }

      if (k.secondaryAura) {
        gsap.killTweensOf(k.secondaryAura.material);
        // For double holes, secondary twin only lights if full note (not half-hole)
        const secondaryOn = isCovered && !state.halfHole;
        if (secondaryOn) {
          gsap.to(k.secondaryAura.material, {
            opacity: 0.85 * vel,
            duration: 0.06,
            ease: 'power2.out'
          });
        } else {
          gsap.to(k.secondaryAura.material, {
            opacity: 0,
            duration: 0.12,
            ease: 'power2.out'
          });
        }
      }
    });

    // 2. Activate acoustic airflow swirls & soundwave rings
    this.breathParticles.forEach(bp => { bp.active = true; });
    this.airOutputRings.forEach(ring => { ring.active = true; });

    // 3. Resonant ivory body luster flash
    if (this.ivoryMaterial) {
      this.ivoryMaterial.emissiveIntensity = 0.25 * vel;
      gsap.killTweensOf(this.ivoryMaterial);
      gsap.to(this.ivoryMaterial, {
        emissiveIntensity: 0.05,
        duration: 0.35,
        ease: 'power2.out'
      });
    }
  }

  onNoteOff(midiPitch, force = false) {
    if (this.activeNote && (this.activeNote.midiPitch === midiPitch || force)) {
      this.activeNote.active = false;

      // Extinguish tone-hole glows
      this.keys.forEach(k => {
        k.isCovered = false;
        if (k.aura) {
          gsap.to(k.aura.material, { opacity: 0, duration: 0.18, ease: 'power2.out' });
        }
        if (k.secondaryAura) {
          gsap.to(k.secondaryAura.material, { opacity: 0, duration: 0.18, ease: 'power2.out' });
        }
      });

      // Fade out breath dynamics
      this.breathParticles.forEach(bp => {
        bp.active = false;
        gsap.to(bp.material, { opacity: 0, duration: 0.22, ease: 'power2.in' });
      });
      this.airOutputRings.forEach(ring => {
        ring.active = false;
        gsap.to(ring.material, { opacity: 0, duration: 0.25, ease: 'power2.in' });
      });
    }
  }

  /* ------------------------------------------------------------------ */
  /*  PER-FRAME RENDER LOOP                                             */
  /* ------------------------------------------------------------------ */

  update(delta) {
    const dt = Math.min(0.1, Math.max(0.001, delta));
    this.resonancePhase += dt * 32.0;

    if (this.activeNote && this.activeNote.active) {
      this.activeNote.elapsed += dt;

      const vel = this.activeNote.velocity;
      const breathSpeed = 1.35;

      // 1. Animate Mouthpiece Breath Inflow into the Boquilla (Y = 0.168)
      this.breathParticles.forEach(bp => {
        const progress = ((this.activeNote.elapsed * breathSpeed + bp.offsetTime) % 1.0);

        // Inflow streams downwards from Y ≈ 0.235 directly into the boquilla aperture at Y = 0.168
        const startY = 0.235;
        const endY = 0.168;
        const curY = THREE.MathUtils.lerp(startY, endY, progress);

        // Convergence factor (1.0 high above, 0.0 at the boquilla entrance)
        const convergence = 1.0 - progress;

        // Organic undulating wave flow matching the user's sketch
        const waveFreq = 3.2;
        const wavePhase = (this.activeNote.elapsed * 6.0) + bp.offsetTime * Math.PI * 2.0;
        const waveX = Math.sin(progress * Math.PI * waveFreq + wavePhase) * 0.0035 * convergence;
        const waveZ = Math.cos(progress * Math.PI * waveFreq * 0.75 + wavePhase) * 0.0022 * convergence;

        bp.mesh.position.set(
          waveX,
          curY,
          0.0018 + waveZ
        );

        // Condenses from a broader airflow cloud down into the narrow windway slit
        const currentScale = bp.baseScale * (0.42 + convergence * 1.6);
        bp.mesh.scale.set(currentScale * 1.35, currentScale, currentScale * 0.65);
        bp.mesh.rotation.y = Math.sin(wavePhase * 0.5) * 0.25;

        // Fades in at the top, stays bright as it descends, and fades into the mouth of the boquilla
        let alpha = 0;
        if (progress < 0.20) {
          alpha = (progress / 0.20) * 0.70 * vel;
        } else if (progress > 0.85) {
          alpha = ((1.0 - progress) / 0.15) * 0.70 * vel; // Enters the windway slit
        } else {
          alpha = 0.70 * vel;
        }
        bp.material.opacity = alpha;
      });

      // 2. Animate Concentric Soundwave Waves Emitting Downwards from Bell
      this.airOutputRings.forEach(ring => {
        const progress = ((this.activeNote.elapsed * breathSpeed + ring.offsetTime) % 1.0);
        const downwardTravel = progress * 0.18;

        ring.mesh.position.y = -0.160 - downwardTravel;
        const scale = ring.baseScale * (1.0 + progress * 3.2);
        ring.mesh.scale.set(scale, scale, scale);

        ring.material.opacity = progress < 0.15
          ? (progress / 0.15) * 0.55 * vel
          : (1.0 - (progress - 0.15) / 0.85) * 0.55 * vel;
      });

      // 3. Resonant Vibrato Pulsation in Ivory Luster
      const vibratoWave = Math.sin(this.resonancePhase) * 0.03 * vel;
      if (this.ivoryMaterial) {
        this.ivoryMaterial.emissiveIntensity = 0.05 + Math.max(0, vibratoWave);
      }

      // 4. Note duration expiration
      if (this.activeNote.elapsed >= this.activeNote.duration) {
        this.onNoteOff(this.activeNote.midiPitch);
      }
    } else {
      // Idle state decay
      if (this.ivoryMaterial && this.ivoryMaterial.emissiveIntensity > 0.05) {
        this.ivoryMaterial.emissiveIntensity = THREE.MathUtils.lerp(
          this.ivoryMaterial.emissiveIntensity, 0.05, dt * 6.0
        );
      }
    }
  }
}
