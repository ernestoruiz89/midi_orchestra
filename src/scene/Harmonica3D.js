import * as THREE from 'three';
import gsap from 'gsap';

/**
 * Harmonica3D: Professional 10-Hole Diatonic Blues Harmonica
 * - Straight rectangular architecture with stepped cover plates and chamfered bevels.
 * - Dark gunmetal/graphite cover plates with polished chrome perimeter trim.
 * - Stamped side flanges with 4 precision socket-head hex fasteners (2 on each wing).
 * - Black ABS comb with 10 square blow/draw chamber holes and polished nickel reed plates.
 * - Heavy studio cast pedestal stand with telescopic mast, brass locking collar,
/**
 * Authentic 10-Hole Diatonic Harmonica Tuning Chart (Standard C Richter System)
 * Maps every chromatic MIDI note to its exact hole (0..9 -> Holes 1 to 10)
 * and articulation technique:
 * - 'blow': Soplado (air expelled forward through the reed out into the room)
 * - 'draw': Aspirado (air inhaled/drawn inward into the reed chamber)
 * - 'bend': Blues Draw/Blow Bend (characteristic blues micro-tonal bending)
 */
export const RICHTER_C_MAP = {
  // Octave 4 (Holes 1 to 3: Bass/Rhythm Register)
  60: { hole: 0, type: 'blow', label: 'Hole 1 Blow (C4)' },
  61: { hole: 0, type: 'bend', label: 'Hole 1 Draw Bend (C#4)' },
  62: { hole: 0, type: 'draw', label: 'Hole 1 Draw (D4)' },
  63: { hole: 1, type: 'draw', label: 'Hole 2 Draw Bend (Eb4)' },
  64: { hole: 1, type: 'blow', label: 'Hole 2 Blow (E4)' },
  65: { hole: 1, type: 'bend', label: 'Hole 2 Draw Bend (F4)' },
  66: { hole: 1, type: 'bend', label: 'Hole 2 Draw Bend (F#4)' },
  67: { hole: 1, type: 'draw', label: 'Hole 2 Draw (G4)' },
  68: { hole: 2, type: 'bend', label: 'Hole 3 Draw Bend (G#4)' },
  69: { hole: 2, type: 'bend', label: 'Hole 3 Draw Bend (A4)' },
  70: { hole: 2, type: 'bend', label: 'Hole 3 Draw Bend (Bb4)' },
  71: { hole: 2, type: 'draw', label: 'Hole 3 Draw (B4)' },

  // Octave 5 (Holes 4 to 6: Core Middle Solo Register)
  72: { hole: 3, type: 'blow', label: 'Hole 4 Blow (C5)' },
  73: { hole: 3, type: 'bend', label: 'Hole 4 Draw Bend (C#5)' },
  74: { hole: 3, type: 'draw', label: 'Hole 4 Draw (D5)' },
  75: { hole: 4, type: 'draw', label: 'Hole 5 Draw (Eb5)' },
  76: { hole: 4, type: 'blow', label: 'Hole 5 Blow (E5)' },
  77: { hole: 4, type: 'draw', label: 'Hole 5 Draw (F5)' },
  78: { hole: 4, type: 'bend', label: 'Hole 5 Draw Bend (F#5)' },
  79: { hole: 5, type: 'blow', label: 'Hole 6 Blow (G5)' },
  80: { hole: 5, type: 'bend', label: 'Hole 6 Draw Bend (G#5)' },
  81: { hole: 5, type: 'draw', label: 'Hole 6 Draw (A5)' },
  82: { hole: 5, type: 'bend', label: 'Hole 6 Draw Bend (Bb5)' },

  // Octave 6 (Holes 7 to 9: High Register - Blow/Draw inverts at Hole 7)
  83: { hole: 6, type: 'draw', label: 'Hole 7 Draw (B5)' },
  84: { hole: 6, type: 'blow', label: 'Hole 7 Blow (C6)' },
  85: { hole: 6, type: 'bend', label: 'Hole 7 Draw Bend (C#6)' },
  86: { hole: 7, type: 'draw', label: 'Hole 8 Draw (D6)' },
  87: { hole: 7, type: 'bend', label: 'Hole 8 Blow Bend (Eb6)' },
  88: { hole: 7, type: 'blow', label: 'Hole 8 Blow (E6)' },
  89: { hole: 8, type: 'draw', label: 'Hole 9 Draw (F6)' },
  90: { hole: 8, type: 'bend', label: 'Hole 9 Blow Bend (F#6)' },
  91: { hole: 8, type: 'blow', label: 'Hole 9 Blow (G6)' },
  92: { hole: 8, type: 'draw', label: 'Hole 9 Draw (Ab6)' },

  // Octave 7 (Hole 10: Top Octave)
  93: { hole: 9, type: 'draw', label: 'Hole 10 Draw (A6)' },
  94: { hole: 9, type: 'bend', label: 'Hole 10 Blow Bend (Bb6)' },
  95: { hole: 9, type: 'bend', label: 'Hole 10 Blow Bend (B6)' },
  96: { hole: 9, type: 'blow', label: 'Hole 10 Blow (C7)' }
};

export function getHarmonicaNoteInfo(midiPitch) {
  if (RICHTER_C_MAP[midiPitch]) {
    return RICHTER_C_MAP[midiPitch];
  }
  // Transpose into 60-96 Richter octave range
  let p = midiPitch;
  while (p < 60) p += 12;
  while (p > 96) p -= 12;
  if (RICHTER_C_MAP[p]) {
    return RICHTER_C_MAP[p];
  }
  const norm = Math.max(0, Math.min(1, (midiPitch - 55) / 45));
  const hole = Math.min(9, Math.floor(norm * 10));
  return { hole, type: midiPitch % 2 === 0 ? 'blow' : 'draw', label: `Hole ${hole + 1}` };
}

export class Harmonica3D {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();

    // Stage position: Front-right melodic wind section near acoustic guitar & flute
    this.group.position.set(1.15, 1.25, 2.30);
    // Vertical stage orientation facing audience and conductor
    this.group.rotation.set(0, -0.22, 0);

    // Instrument body container holds harmonica components with natural performance tilt
    this.instrumentBody = new THREE.Group();
    this.instrumentBody.rotation.set(0.10, 0, 0.02);
    this.group.add(this.instrumentBody);

    this.holes = [];
    this.breathRings = [];
    this.activeNotes = new Map();
    this.vibratoPhase = 0;

    this._buildMaterials();
    this._buildLighting();
    this._buildStand();
    this._buildHarmonicaModel();
    this._buildBreathRings();

    this.scene.add(this.group);
  }

  _buildLighting() {
    // Local warm studio key and fill illumination to make the gold body and trim gleam brilliantly
    const keyLight = new THREE.PointLight(0xfff4d6, 3.2, 3.5, 1.4);
    keyLight.position.set(0.25, 0.40, 0.45);
    this.group.add(keyLight);

    const fillLight = new THREE.PointLight(0xffeab0, 1.8, 3.0, 1.4);
    fillLight.position.set(-0.30, 0.25, 0.40);
    this.group.add(fillLight);
  }

  _buildMaterials() {
    // 1. Luxurious 24K Brushed/Satin Gold (Cover Plates)
    this.coverPlateMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xdfb538,
      roughness: 0.18,
      metalness: 0.94,
      clearcoat: 0.85,
      clearcoatRoughness: 0.06
    });

    // 2. Mirror-Polished 18K Gold (Perimeter Bevel Trim, Mouthpiece Guides & Reed Plates)
    this.chromeTrimMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xf5d05c,
      roughness: 0.08,
      metalness: 0.98,
      clearcoat: 1.0,
      clearcoatRoughness: 0.03
    });

    // 3. Deep Ebony Black ABS Comb (Peine with 10 square chambers)
    this.combMaterial = new THREE.MeshStandardMaterial({
      color: 0x0e1012,
      roughness: 0.55,
      metalness: 0.20
    });

    // 4. Acoustic Chamber Dark Interior
    this.chamberInteriorMaterial = new THREE.MeshBasicMaterial({
      color: 0x020304
    });

    // 5. Socket-Head Hex Screws / Fasteners (Black Oxide finish)
    this.fastenerMaterial = new THREE.MeshStandardMaterial({
      color: 0x16181b,
      roughness: 0.25,
      metalness: 0.90
    });

    // 6. Studio Stand Satin Chrome & Shockmount Rubber
    this.standChromeMaterial = new THREE.MeshStandardMaterial({
      color: 0xd8dee8,
      roughness: 0.22,
      metalness: 0.92
    });

    this.rubberMaterial = new THREE.MeshStandardMaterial({
      color: 0x161618,
      roughness: 0.92,
      metalness: 0.05
    });

    // 7. Machined Brass Collar Accent Ring
    this.brassMaterial = new THREE.MeshStandardMaterial({
      color: 0xe5bf54,
      roughness: 0.20,
      metalness: 0.88
    });

    // 8. Translucent Breath Wave Ring Material
    this.breathMaterial = new THREE.MeshBasicMaterial({
      color: 0x88ddff,
      transparent: true,
      opacity: 0.0,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending
    });

    // 9. Active Chamber Hole Glow Material
    this.glowMaterial = new THREE.MeshBasicMaterial({
      color: 0x66ccff,
      transparent: true,
      opacity: 0.0,
      blending: THREE.AdditiveBlending
    });
  }

  /* ------------------------------------------------------------------ */
  /*  STUDIO CAST PEDESTAL STAND (Matching Violin, Flute & Trumpet)     */
  /* ------------------------------------------------------------------ */
  _buildStand() {
    this.standGroup = new THREE.Group();
    // Stand extends from stage floor (y = -1.25) up to harmonica cradle (y = -0.02)
    const stand = new THREE.Group();
    stand.position.set(0, -1.25, 0);

    // 1. Heavy studio cast round chrome base with beveled rim (matching flute/violin/trumpet)
    const baseGeom = new THREE.CylinderGeometry(0.18, 0.21, 0.032, 24);
    const base = new THREE.Mesh(baseGeom, this.standChromeMaterial);
    base.position.y = 0.016;
    base.castShadow = true;
    base.receiveShadow = true;
    stand.add(base);

    // 3 Non-slip rubber feet underneath spaced at 120°
    for (let i = 0; i < 3; i++) {
      const angle = (i * Math.PI * 2) / 3;
      const foot = new THREE.Mesh(
        new THREE.CylinderGeometry(0.016, 0.016, 0.008, 12),
        this.rubberMaterial
      );
      foot.position.set(Math.cos(angle) * 0.17, 0.004, Math.sin(angle) * 0.17);
      stand.add(foot);
    }

    // 2. Telescopic lower mast (height 0.62m)
    const lowerPole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.013, 0.013, 0.62, 14),
      this.standChromeMaterial
    );
    lowerPole.position.y = 0.34;
    lowerPole.castShadow = true;
    stand.add(lowerPole);

    // Machined locking collar with brass accent ring
    const collar = new THREE.Mesh(
      new THREE.CylinderGeometry(0.019, 0.019, 0.038, 16),
      this.brassMaterial
    );
    collar.position.y = 0.66;
    collar.castShadow = true;
    stand.add(collar);

    // Tension lock knob on collar
    const lockKnob = new THREE.Mesh(
      new THREE.BoxGeometry(0.024, 0.008, 0.008),
      this.standChromeMaterial
    );
    lockKnob.position.set(0.018, 0.66, 0);
    stand.add(lockKnob);

    // Telescopic upper mast (height 0.50m)
    const upperPole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.009, 0.009, 0.50, 14),
      this.standChromeMaterial
    );
    upperPole.position.y = 0.92;
    upperPole.castShadow = true;
    stand.add(upperPole);

    // 3. Studio Swivel Knuckle & Non-Penetrating Isolation Cradle
    // Positioned at y = 1.18 relative to floor stand (y = -0.07 relative to group)
    const knuckleGroup = new THREE.Group();
    knuckleGroup.position.set(0, 1.18, 0);
    knuckleGroup.rotation.x = 0.10;

    // Swivel joint sphere
    const joint = new THREE.Mesh(
      new THREE.SphereGeometry(0.016, 16, 12),
      this.standChromeMaterial
    );
    knuckleGroup.add(joint);

    // Tilt adjuster wing-screw
    const wingScrew = new THREE.Mesh(
      new THREE.BoxGeometry(0.026, 0.007, 0.006),
      this.standChromeMaterial
    );
    wingScrew.position.set(0.018, 0, 0);
    knuckleGroup.add(wingScrew);

    // Horizontal chrome crossbar supporting dual isolation cradles
    const crossbar = new THREE.Mesh(
      new THREE.BoxGeometry(0.16, 0.008, 0.012),
      this.standChromeMaterial
    );
    crossbar.position.set(0, 0.016, 0);
    crossbar.castShadow = true;
    knuckleGroup.add(crossbar);

    // Dual padded cradle prongs supporting the harmonica strictly from underneath
    // Placed at [-0.065, 0.065] under the harmonica ends
    [-0.065, 0.065].forEach(cx => {
      const cradleGroup = new THREE.Group();
      cradleGroup.position.set(cx, 0.016, 0);

      // Vertical riser post up to the cradle shelf
      const post = new THREE.Mesh(
        new THREE.CylinderGeometry(0.004, 0.004, 0.034, 12),
        this.standChromeMaterial
      );
      post.position.y = 0.017;
      cradleGroup.add(post);

      // Horizontal chrome shelf plate
      const plate = new THREE.Mesh(
        new THREE.BoxGeometry(0.016, 0.004, 0.046),
        this.standChromeMaterial
      );
      plate.position.set(0, 0.034, 0);
      cradleGroup.add(plate);

      // Protective high-density rubber cushion pad directly supporting the underside
      const pad = new THREE.Mesh(
        new THREE.BoxGeometry(0.015, 0.004, 0.044),
        this.rubberMaterial
      );
      pad.position.set(0, 0.037, 0);
      cradleGroup.add(pad);

      // Low-profile front and rear retention lips
      // These rise only 4mm at the outer edges to gently cup the lower rim without ever penetrating
      [-0.022, 0.022].forEach(rz => {
        const lip = new THREE.Mesh(
          new THREE.BoxGeometry(0.015, 0.008, 0.004),
          this.rubberMaterial
        );
        lip.position.set(0, 0.040, rz);
        cradleGroup.add(lip);
      });

      knuckleGroup.add(cradleGroup);
    });

    stand.add(knuckleGroup);
    this.standGroup.add(stand);
    this.group.add(this.standGroup);
  }

  /* ------------------------------------------------------------------ */
  /*  RECTANGULAR 10-HOLE DIATONIC HARMONICA MODEL (Matching Reference)  */
  /* ------------------------------------------------------------------ */
  _buildHarmonicaModel() {
    this.bodyGroup = new THREE.Group();

    // Harmonica dimensions:
    // Total Width: 0.230m (23 cm)
    // Comb Depth: 0.050m (5.0 cm)
    // Comb Height: 0.016m (1.6 cm)

    // 1. Black ABS Comb (Peine)
    const combGeom = new THREE.BoxGeometry(0.230, 0.016, 0.050);
    const combMesh = new THREE.Mesh(combGeom, this.combMaterial);
    combMesh.castShadow = true;
    combMesh.receiveShadow = true;
    this.bodyGroup.add(combMesh);

    // 2. Top and Bottom Polished Nickel Reed Plates
    [-0.0089, 0.0089].forEach(ry => {
      const reedGeom = new THREE.BoxGeometry(0.232, 0.0018, 0.052);
      const reedMesh = new THREE.Mesh(reedGeom, this.chromeTrimMaterial);
      reedMesh.position.y = ry;
      reedMesh.castShadow = true;
      this.bodyGroup.add(reedMesh);
    });

    // 3. Top and Bottom Stepped Cover Plates with Chamfers and Fasteners
    [1, -1].forEach(sign => {
      const coverGroup = new THREE.Group();

      // Silver perimeter trim border plate (reveals fine chrome outline around cover)
      const trimGeom = new THREE.BoxGeometry(0.231, 0.0008, 0.051);
      const trimMesh = new THREE.Mesh(trimGeom, this.chromeTrimMaterial);
      trimMesh.position.y = sign * 0.0102;
      coverGroup.add(trimMesh);

      // Left Flange Wing (stepped down)
      const wingGeom = new THREE.BoxGeometry(0.038, 0.0026, 0.048);
      const leftWing = new THREE.Mesh(wingGeom, this.coverPlateMaterial);
      leftWing.position.set(-0.096, sign * 0.0115, 0);
      leftWing.castShadow = true;
      coverGroup.add(leftWing);

      // Right Flange Wing (stepped down)
      const rightWing = leftWing.clone();
      rightWing.position.x = 0.096;
      coverGroup.add(rightWing);

      // Socket-head fasteners (2 on each flange, matching reference image)
      [-0.096, 0.096].forEach(fx => {
        [-0.013, 0.013].forEach(fz => {
          // Outer screw head rim
          const screwGeom = new THREE.CylinderGeometry(0.0032, 0.0032, 0.0012, 14);
          const screw = new THREE.Mesh(screwGeom, this.fastenerMaterial);
          screw.position.set(fx, sign * 0.0130, fz);
          coverGroup.add(screw);

          // Recessed hex socket
          const socketGeom = new THREE.CylinderGeometry(0.0015, 0.0015, 0.0006, 6);
          const socket = new THREE.Mesh(socketGeom, this.chamberInteriorMaterial);
          socket.position.set(fx, sign * 0.0135, fz);
          coverGroup.add(socket);
        });
      });

      // Central Raised Acoustic Cover Body (covering the 10 holes)
      // Raised central block
      const centerMainGeom = new THREE.BoxGeometry(0.150, 0.0080, 0.046);
      const centerMain = new THREE.Mesh(centerMainGeom, this.coverPlateMaterial);
      centerMain.position.set(0, sign * 0.0150, 0);
      centerMain.castShadow = true;
      coverGroup.add(centerMain);

      // Top surface plate
      const centerTopGeom = new THREE.BoxGeometry(0.144, 0.0022, 0.042);
      const centerTop = new THREE.Mesh(centerTopGeom, this.coverPlateMaterial);
      centerTop.position.set(0, sign * 0.0195, 0);
      coverGroup.add(centerTop);

      // Left & Right Chamfer Steps (connecting raised body to side wings)
      [-1, 1].forEach(dir => {
        const chamferGeom = new THREE.BoxGeometry(0.006, 0.0065, 0.046);
        const chamfer = new THREE.Mesh(chamferGeom, this.coverPlateMaterial);
        chamfer.position.set(dir * 0.076, sign * 0.0145, 0);
        chamfer.rotation.z = dir * sign * (Math.PI / 4.5);
        coverGroup.add(chamfer);
      });

      // Front Chamfer Slope along mouthpiece edge
      const frontSlopeGeom = new THREE.BoxGeometry(0.148, 0.0040, 0.0050);
      const frontSlope = new THREE.Mesh(frontSlopeGeom, this.coverPlateMaterial);
      frontSlope.position.set(0, sign * 0.0180, 0.022);
      frontSlope.rotation.x = -sign * (Math.PI / 4);
      coverGroup.add(frontSlope);

      // Rear Chamfer Slope
      const rearSlope = frontSlope.clone();
      rearSlope.position.z = -0.022;
      rearSlope.rotation.x = sign * (Math.PI / 4);
      coverGroup.add(rearSlope);

      this.bodyGroup.add(coverGroup);
    });

    // 4. 10 Square Blow/Draw Chamber Holes along Front Mouthpiece Face (z = +0.025)
    const numHoles = 10;
    const holeSpan = 0.136;
    const startX = -holeSpan / 2;
    const stepX = holeSpan / (numHoles - 1);
    const holeW = 0.009;
    const holeH = 0.009;

    // Standard C Diatonic Richter Tuning (C4 to C7)
    const diatonicNotes = [60, 64, 67, 72, 76, 79, 84, 88, 91, 96];

    for (let i = 0; i < numHoles; i++) {
      const hx = startX + i * stepX;

      // Recessed dark chamber
      const holeGeom = new THREE.BoxGeometry(holeW, holeH, 0.006);
      const hole = new THREE.Mesh(holeGeom, this.chamberInteriorMaterial);
      hole.position.set(hx, 0, 0.024);
      this.bodyGroup.add(hole);

      // Mouthpiece separator tooth
      if (i < numHoles - 1) {
        const toothGeom = new THREE.BoxGeometry(stepX - holeW, holeH + 0.002, 0.004);
        const tooth = new THREE.Mesh(toothGeom, this.combMaterial);
        tooth.position.set(hx + stepX / 2, 0, 0.025);
        this.bodyGroup.add(tooth);
      }

      // Subtle active chamber glow disc
      const glowGeom = new THREE.PlaneGeometry(holeW * 1.1, holeH * 1.1);
      const glowMesh = new THREE.Mesh(glowGeom, this.glowMaterial.clone());
      glowMesh.position.set(hx, 0, 0.0255);
      glowMesh.visible = false;
      this.bodyGroup.add(glowMesh);

      const baseNote = diatonicNotes[i];

      this.holes.push({
        index: i,
        x: hx,
        baseNote,
        glowMesh,
        origin: new THREE.Vector3(hx, 0, 0.027)
      });
    }

    // Top and Bottom Mouthpiece Chrome Guide Bars along front edge
    [-0.006, 0.006].forEach(my => {
      const barGeom = new THREE.BoxGeometry(0.148, 0.0018, 0.003);
      const bar = new THREE.Mesh(barGeom, this.chromeTrimMaterial);
      bar.position.set(0, my, 0.0255);
      this.bodyGroup.add(bar);
    });

    this.instrumentBody.add(this.bodyGroup);
  }

  /* ------------------------------------------------------------------ */
  /*  ACOUSTIC BREATH WAVE EMISSION & INHALATION SYSTEM                */
  /* ------------------------------------------------------------------ */
  _buildBreathRings() {
    this.fxGroup = new THREE.Group();
    // Pool of 16 acoustic wave rings to support rapid blues runs, trills and chords
    for (let i = 0; i < 16; i++) {
      const ringGeom = new THREE.RingGeometry(0.007, 0.022, 20);
      const ringMesh = new THREE.Mesh(ringGeom, this.breathMaterial.clone());
      ringMesh.visible = false;
      this.fxGroup.add(ringMesh);
      this.breathRings.push(ringMesh);
    }
    this.instrumentBody.add(this.fxGroup);
  }

  _triggerBreathRing(holeObj, vel, type = 'blow') {
    const ring = this.breathRings.find(r => !r.visible) || this.breathRings[0];
    if (!ring) return;

    gsap.killTweensOf(ring.position);
    gsap.killTweensOf(ring.scale);
    gsap.killTweensOf(ring.material);

    const isBlow = type === 'blow';
    const isBend = type === 'bend';

    // Color differentiation:
    // - Soplado (Blow): Ámbar dorado cálido (aire exhalado a través de la lengüeta)
    // - Aspirado (Draw): Azul hielo / cian eléctrico (aire inhalado hacia la cámara)
    // - Blues Bend: Violeta resonante (aire comprimido en cavidad bucal)
    const colorHex = isBlow ? 0xffcc44 : (isBend ? 0xcc77ff : 0x38bdf8);
    ring.material.color.setHex(colorHex);
    ring.visible = true;

    if (isBlow) {
      // SOPLADO: El aire sale impulsado desde el orificio hacia el frente (+Z)
      ring.position.copy(holeObj.origin);
      ring.scale.set(0.22, 0.22, 0.22);
      ring.material.opacity = 0.92;

      gsap.to(ring.position, {
        z: holeObj.origin.z + 0.18 + vel * 0.12,
        y: holeObj.origin.y + (Math.random() - 0.5) * 0.012,
        duration: 0.38,
        ease: 'power1.out'
      });

      gsap.to(ring.scale, {
        x: 2.5 + vel * 1.2,
        y: 2.5 + vel * 1.2,
        duration: 0.38,
        ease: 'power2.out'
      });

      gsap.to(ring.material, {
        opacity: 0,
        duration: 0.38,
        ease: 'power2.out',
        onComplete: () => {
          ring.visible = false;
        }
      });
    } else {
      // ASPIRADO (Draw / Bend): El aire exterior es succionado hacia adentro del hoyo (-Z)
      ring.position.set(holeObj.origin.x, holeObj.origin.y, holeObj.origin.z + 0.14 + vel * 0.08);
      ring.scale.set(2.1 + vel * 0.7, 2.1 + vel * 0.7, 2.1 + vel * 0.7);
      ring.material.opacity = 0.88;

      gsap.to(ring.position, {
        z: holeObj.origin.z + 0.005,
        y: holeObj.origin.y,
        duration: 0.32,
        ease: 'power2.in'
      });

      gsap.to(ring.scale, {
        x: 0.22,
        y: 0.22,
        duration: 0.32,
        ease: 'power2.in'
      });

      gsap.to(ring.material, {
        opacity: 0,
        duration: 0.32,
        ease: 'power2.in',
        onComplete: () => {
          ring.visible = false;
        }
      });
    }
  }

  /* ------------------------------------------------------------------ */
  /*  NOTE PLAYBACK & BREATH DYNAMICS (Authentic Richter C Simulation)  */
  /* ------------------------------------------------------------------ */
  onNoteOn(midiPitch, velocity = 0.8, eventTime = null, trackIndex = null, duration = 0.5) {
    const vel = Math.max(0.2, Math.min(1.0, velocity));

    // 1. Mapeo exacto Richter: determina qué hoyo físico (1 a 10) y técnica (soplo/aspirado/bend)
    const noteInfo = getHarmonicaNoteInfo(midiPitch);
    const bestHole = this.holes[noteInfo.hole] || this.holes[0];

    // 2. Disparar onda de aliento física correspondiente (expulsión o succión)
    this._triggerBreathRing(bestHole, vel, noteInfo.type);

    // 3. Resplandor reactivo en la celda activa del peine
    if (bestHole.glowMesh) {
      bestHole.glowMesh.visible = true;
      const isBlow = noteInfo.type === 'blow';
      const isBend = noteInfo.type === 'bend';
      const glowColor = isBlow ? 0xffbb33 : (isBend ? 0xcc77ff : 0x38bdf8);
      bestHole.glowMesh.material.color.setHex(glowColor);
      bestHole.glowMesh.material.opacity = 0.95;

      gsap.killTweensOf(bestHole.glowMesh.material);
      gsap.to(bestHole.glowMesh.material, {
        opacity: 0,
        duration: Math.max(0.22, Math.min(0.5, (duration || 0.35) * 0.8)),
        ease: 'power2.out',
        onComplete: () => {
          bestHole.glowMesh.visible = false;
        }
      });
    }

    // 4. Inclinación y balanceo acústico de embocadura y efecto "Wah-Wah" de manos
    // Los hoyos graves (1-3) se tocan en el lado izquierdo; los agudos (8-10) en el derecho.
    if (this.instrumentBody) {
      gsap.killTweensOf(this.instrumentBody.rotation);

      // Inclinación lateral proporcional al hoyo activado (-1 en hoyo 1 a +1 en hoyo 10)
      const holeNorm = (noteInfo.hole - 4.5) / 4.5;
      const lateralTiltZ = 0.02 + holeNorm * 0.032 * vel;

      // Inclinación pitch sutil según retroceso de soplo vs succión de aspirado
      const pitchTiltX = 0.10 + (noteInfo.type === 'blow' ? 0.026 : -0.018) * vel;

      gsap.to(this.instrumentBody.rotation, {
        x: pitchTiltX,
        z: lateralTiltZ,
        duration: 0.07,
        ease: 'power2.out',
        onComplete: () => {
          gsap.to(this.instrumentBody.rotation, {
            x: 0.10,
            z: 0.02,
            duration: 0.35,
            ease: 'power2.out'
          });
        }
      });
    }

    this.activeNotes.set(midiPitch, {
      hole: bestHole,
      noteInfo,
      time: performance.now()
    });
  }

  onNoteOff(midiPitch) {
    this.activeNotes.delete(midiPitch);
  }

  update(delta) {
    if (!this.group.visible) return;
    this.vibratoPhase += delta * 2.0;
  }
}
