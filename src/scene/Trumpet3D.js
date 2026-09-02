import * as THREE from 'three';
import gsap from 'gsap';

/**
 * Trumpet3D: Realistic Bb Brass Trumpet with:
 * - Authentic compact proportions (~50cm length)
 * - 3 functional moving pistons with pearl inlay buttons and valve casings
 * - Main tuning slide with U-bend bow, water key, and dual support braces
 * - 1st, 2nd, and 3rd valve slides with thumb saddle and finger ring
 * - Smooth exponential bell flare with rolled rim bead
 * - Silver-plated mouthpiece and receiver
 * - Professional stage tripod stand
 * - Realistic valve fingering and dynamic acoustic bell recoil
 */
export class Trumpet3D {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();
    // Positioned front-right stage
    this.group.position.set(4.4, 1.40, 0.4);
    // Angled gracefully towards the audience
    this.group.rotation.set(0.06, -Math.PI * 0.38, 0.06);

    this.valves = []; // 3 valve piston groups
    this.bellMesh = null;
    this.trumpetBody = null;
    this.shockwaveRings = [];

    this._buildMaterials();
    this._buildStand();
    this._buildTrumpet();
    this._buildShockwaveRings();

    this.scene.add(this.group);
  }

  _buildMaterials() {
    // Gleaming gold brass lacquer
    this.brassMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xf3ba2e,
      roughness: 0.15,
      metalness: 0.90,
      clearcoat: 0.85,
      clearcoatRoughness: 0.08
    });

    // Darker inner bell shade
    this.innerBellMaterial = new THREE.MeshStandardMaterial({
      color: 0xd49b1e,
      roughness: 0.30,
      metalness: 0.85,
      side: THREE.BackSide
    });

    // Silver-plated chrome (mouthpiece, pistons, finger ring)
    this.silverMaterial = new THREE.MeshStandardMaterial({
      color: 0xeeeeee,
      roughness: 0.12,
      metalness: 0.95
    });

    // Mother of pearl finger buttons
    this.pearlMaterial = new THREE.MeshStandardMaterial({
      color: 0xfffcf5,
      roughness: 0.25,
      metalness: 0.05
    });

    // Satin black stand
    this.standMaterial = new THREE.MeshStandardMaterial({
      color: 0x1e1e24,
      roughness: 0.55,
      metalness: 0.25
    });

    // Chrome hardware
    this.chromeMaterial = new THREE.MeshStandardMaterial({
      color: 0xcccccc,
      roughness: 0.15,
      metalness: 0.90
    });
  }

  _buildStand() {
    const stand = new THREE.Group();
    stand.position.set(0, -1.40, 0);

    // Central column
    const pole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.014, 0.014, 1.35, 12),
      this.standMaterial
    );
    pole.position.y = 0.675;
    stand.add(pole);

    // Collar fitting
    const collar = new THREE.Mesh(
      new THREE.CylinderGeometry(0.022, 0.022, 0.04, 12),
      this.chromeMaterial
    );
    collar.position.y = 0.22;
    stand.add(collar);

    // 3 Folding Tripod Legs
    for (let i = 0; i < 3; i++) {
      const angle = (i * Math.PI * 2) / 3;
      const legGroup = new THREE.Group();
      legGroup.rotation.y = angle;

      const leg = new THREE.Mesh(
        new THREE.CylinderGeometry(0.009, 0.009, 0.42, 8),
        this.standMaterial
      );
      leg.position.set(0.18, 0.10, 0);
      leg.rotation.z = -Math.PI * 0.35;
      legGroup.add(leg);

      // Rubber foot
      const foot = new THREE.Mesh(
        new THREE.SphereGeometry(0.016, 8, 8),
        this.standMaterial
      );
      foot.position.set(0.34, 0.015, 0);
      legGroup.add(foot);

      stand.add(legGroup);
    }

    // Top Rubber Velvet Cradle Cone supporting the trumpet
    const cradleCone = new THREE.Mesh(
      new THREE.ConeGeometry(0.035, 0.12, 16),
      this.standMaterial
    );
    cradleCone.position.y = 1.34;
    stand.add(cradleCone);

    this.group.add(stand);
  }

  _buildTrumpet() {
    const body = new THREE.Group();
    this.trumpetBody = body;

    // Dimensions: Tube radius ~ 0.0075 (15mm pipe)
    const tr = 0.0075;

    // ==========================================
    // 1. VALVE BLOCK (Center at x = 0, y = 0, z = 0)
    // ==========================================
    const valveSpacing = 0.036;
    for (let i = 0; i < 3; i++) {
      const vx = (i - 1) * valveSpacing;

      // Outer Brass Casing
      const casing = new THREE.Mesh(
        new THREE.CylinderGeometry(0.015, 0.015, 0.12, 16),
        this.brassMaterial
      );
      casing.position.set(vx, 0, 0);
      body.add(casing);

      // Top threaded cap
      const topCap = new THREE.Mesh(
        new THREE.CylinderGeometry(0.017, 0.017, 0.012, 16),
        this.brassMaterial
      );
      topCap.position.set(vx, 0.062, 0);
      body.add(topCap);

      // Bottom valve cap
      const botCap = new THREE.Mesh(
        new THREE.CylinderGeometry(0.016, 0.016, 0.014, 16),
        this.brassMaterial
      );
      botCap.position.set(vx, -0.063, 0);
      body.add(botCap);

      // Moving Piston Valve
      const pistonGroup = new THREE.Group();
      pistonGroup.position.set(vx, 0.068, 0);

      // Thin silver stem
      const stem = new THREE.Mesh(
        new THREE.CylinderGeometry(0.0035, 0.0035, 0.06, 8),
        this.silverMaterial
      );
      stem.position.y = 0.03;
      pistonGroup.add(stem);

      // Knurled finger button with pearl inlay
      const button = new THREE.Mesh(
        new THREE.CylinderGeometry(0.013, 0.013, 0.006, 16),
        this.brassMaterial
      );
      button.position.y = 0.06;
      pistonGroup.add(button);

      const pearl = new THREE.Mesh(
        new THREE.CylinderGeometry(0.011, 0.011, 0.003, 16),
        this.pearlMaterial
      );
      pearl.position.y = 0.063;
      pistonGroup.add(pearl);

      body.add(pistonGroup);

      this.valves.push({
        group: pistonGroup,
        baseY: 0.068,
        isPressed: false
      });
    }

    // Connective casing knuckles between valves
    const knuckle1 = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.06, 0.018), this.brassMaterial);
    knuckle1.position.set(-valveSpacing / 2, 0, 0);
    body.add(knuckle1);

    const knuckle2 = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.06, 0.018), this.brassMaterial);
    knuckle2.position.set(valveSpacing / 2, 0, 0);
    body.add(knuckle2);

    // ==========================================
    // 2. LEADPIPE & MOUTHPIECE (Runs along right side)
    // ==========================================
    const leadZ = -0.022; // offset from valve center
    const leadY = -0.015;

    // Main Leadpipe tube running from x = -0.26 to x = 0.16
    const leadpipeGeom = new THREE.CylinderGeometry(tr, tr, 0.42, 12);
    leadpipeGeom.rotateZ(Math.PI / 2);
    const leadpipe = new THREE.Mesh(leadpipeGeom, this.brassMaterial);
    leadpipe.position.set(-0.05, leadY, leadZ);
    body.add(leadpipe);

    // Mouthpiece Receiver collar
    const receiver = new THREE.Mesh(
      new THREE.CylinderGeometry(tr * 1.35, tr * 1.2, 0.045, 12).rotateZ(Math.PI / 2),
      this.brassMaterial
    );
    receiver.position.set(-0.25, leadY, leadZ);
    body.add(receiver);

    // Silver Mouthpiece
    const mpGroup = new THREE.Group();
    mpGroup.position.set(-0.27, leadY, leadZ);

    // Shank
    const mpShank = new THREE.Mesh(
      new THREE.CylinderGeometry(tr * 0.95, tr * 0.8, 0.045, 12).rotateZ(Math.PI / 2),
      this.silverMaterial
    );
    mpShank.position.x = -0.022;
    mpGroup.add(mpShank);

    // Cup & Rim
    const mpCup = new THREE.Mesh(
      new THREE.ConeGeometry(0.015, 0.025, 16).rotateZ(-Math.PI / 2),
      this.silverMaterial
    );
    mpCup.position.x = -0.052;
    mpGroup.add(mpCup);

    const mpRim = new THREE.Mesh(
      new THREE.TorusGeometry(0.014, 0.0035, 8, 16).rotateY(Math.PI / 2),
      this.silverMaterial
    );
    mpRim.position.x = -0.065;
    mpGroup.add(mpRim);
    body.add(mpGroup);

    // ==========================================
    // 3. MAIN TUNING SLIDE (Front U-turn bow)
    // ==========================================
    const tuneX = 0.16;
    const tuneSpacing = 0.052; // distance between upper and lower pipes

    // U-turn bow
    const tuneBowGeom = new THREE.TorusGeometry(tuneSpacing / 2, tr, 10, 20, Math.PI);
    tuneBowGeom.rotateZ(-Math.PI / 2);
    const tuneBow = new THREE.Mesh(tuneBowGeom, this.brassMaterial);
    tuneBow.position.set(tuneX + 0.06, leadY + tuneSpacing / 2, leadZ);
    body.add(tuneBow);

    // Upper return pipe of tuning slide
    const tuneReturn = new THREE.Mesh(
      new THREE.CylinderGeometry(tr, tr, 0.10, 12).rotateZ(Math.PI / 2),
      this.brassMaterial
    );
    tuneReturn.position.set(tuneX + 0.01, leadY + tuneSpacing, leadZ);
    body.add(tuneReturn);

    // Water key (spit valve) on main bow
    const waterKey = new THREE.Mesh(
      new THREE.BoxGeometry(0.006, 0.012, 0.006),
      this.silverMaterial
    );
    waterKey.position.set(tuneX + 0.06 + tuneSpacing / 2, leadY + tuneSpacing / 2, leadZ);
    body.add(waterKey);

    // Dual Cross Braces connecting pipes
    const brace1 = new THREE.Mesh(
      new THREE.CylinderGeometry(0.003, 0.003, tuneSpacing, 8),
      this.brassMaterial
    );
    brace1.position.set(0.12, leadY + tuneSpacing / 2, leadZ);
    body.add(brace1);

    const brace2 = new THREE.Mesh(
      new THREE.CylinderGeometry(0.003, 0.003, tuneSpacing, 8),
      this.brassMaterial
    );
    brace2.position.set(-0.16, leadY + tuneSpacing / 2, leadZ);
    body.add(brace2);

    // ==========================================
    // 4. VALVE SLIDES (1st, 2nd, 3rd)
    // ==========================================
    // 1st Valve Slide (Curves backwards from valve 1)
    const slide1Bow = new THREE.Mesh(
      new THREE.TorusGeometry(0.018, tr * 0.9, 8, 16, Math.PI).rotateZ(Math.PI / 2),
      this.brassMaterial
    );
    slide1Bow.position.set(-valveSpacing - 0.045, 0.012, 0.022);
    body.add(slide1Bow);

    // 2nd Valve Slide (Short loop pointing outwards to the right)
    const slide2Bow = new THREE.Mesh(
      new THREE.TorusGeometry(0.016, tr * 0.9, 8, 16, Math.PI).rotateX(Math.PI / 2),
      this.brassMaterial
    );
    slide2Bow.position.set(0, 0, -0.038);
    body.add(slide2Bow);

    // 3rd Valve Slide (Longer loop extending forward towards bell)
    const slide3Bow = new THREE.Mesh(
      new THREE.TorusGeometry(0.022, tr * 0.9, 8, 16, Math.PI).rotateZ(-Math.PI / 2),
      this.brassMaterial
    );
    slide3Bow.position.set(valveSpacing + 0.08, -0.012, 0.024);
    body.add(slide3Bow);

    // 3rd Slide Finger Ring
    const fingerRing = new THREE.Mesh(
      new THREE.TorusGeometry(0.011, 0.0025, 8, 16).rotateY(Math.PI / 2),
      this.silverMaterial
    );
    fingerRing.position.set(valveSpacing + 0.08, 0.014, 0.024);
    body.add(fingerRing);

    // ==========================================
    // 5. BELL PIPE & ELEGANT BELL FLARE
    // ==========================================
    const bellZ = 0.022; // runs along player's left side
    const bellY = 0.036; // elevated above leadpipe

    // Rear U-turn bow behind valves connecting to bell pipe
    const rearBow = new THREE.Mesh(
      new THREE.TorusGeometry(0.024, tr, 10, 20, Math.PI).rotateZ(Math.PI / 2),
      this.brassMaterial
    );
    rearBow.position.set(-0.21, bellY, 0);
    rearBow.rotation.x = Math.PI / 2;
    body.add(rearBow);

    // Straight Bell Pipe from rear bow to start of flare: x = -0.21 to x = 0.08
    const bellStraight = new THREE.Mesh(
      new THREE.CylinderGeometry(tr, tr * 1.15, 0.29, 14).rotateZ(Math.PI / 2),
      this.brassMaterial
    );
    bellStraight.position.set(-0.065, bellY, bellZ);
    body.add(bellStraight);

    // Smooth Exponential Bell Flare using LatheGeometry
    // Lathe profile along Y, then rotated to face +X
    const flarePoints = [];
    const segments = 18;
    const flareStartR = tr * 1.15; // ~0.009
    const flareEndR = 0.068;      // 13.6cm bell diameter
    const flareLength = 0.24;

    for (let j = 0; j <= segments; j++) {
      const t = j / segments;
      // Exponential flare curve
      const r = flareStartR + (flareEndR - flareStartR) * Math.pow(t, 2.8);
      const x = t * flareLength;
      flarePoints.push(new THREE.Vector2(r, x));
    }

    const bellFlareGeom = new THREE.LatheGeometry(flarePoints, 32);
    // Rotate to point along +X
    bellFlareGeom.rotateZ(-Math.PI / 2);

    const bellOuter = new THREE.Mesh(bellFlareGeom, this.brassMaterial);
    bellOuter.position.set(0.08, bellY, bellZ);
    bellOuter.castShadow = true;
    body.add(bellOuter);
    this.bellMesh = bellOuter;

    // Darker inner bell lining
    const bellInner = new THREE.Mesh(bellFlareGeom, this.innerBellMaterial);
    bellInner.position.set(0.08, bellY, bellZ);
    body.add(bellInner);

    // Rolled Bell Rim Bead (Outer rim)
    const bellRim = new THREE.Mesh(
      new THREE.TorusGeometry(flareEndR, 0.0028, 10, 36).rotateY(Math.PI / 2),
      this.brassMaterial
    );
    bellRim.position.set(0.08 + flareLength, bellY, bellZ);
    body.add(bellRim);

    // Ergonomic Pinky Hook near 3rd valve
    const pinkyHook = new THREE.Mesh(
      new THREE.TorusGeometry(0.009, 0.0025, 8, 16, Math.PI * 0.75).rotateY(Math.PI / 2),
      this.brassMaterial
    );
    pinkyHook.position.set(valveSpacing + 0.015, bellY + 0.015, bellZ);
    body.add(pinkyHook);

    this.group.add(body);
  }

  _buildShockwaveRings() {
    for (let r = 0; r < 4; r++) {
      const ringGeom = new THREE.TorusGeometry(0.08, 0.008, 8, 24);
      ringGeom.rotateY(Math.PI / 2);
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0xffd700,
        transparent: true,
        opacity: 0
      });
      const ring = new THREE.Mesh(ringGeom, ringMat);
      ring.position.set(0.33, 0.036, 0.022);
      this.group.add(ring);
      this.shockwaveRings.push(ring);
    }
  }

  onNoteOn(midiPitch, velocity = 0.8) {
    const vel = Math.max(0.3, Math.min(1.0, velocity));

    // 1. Realistic Trumpet Valve Fingering
    // Standard chromatic trumpet valve logic:
    // Piston 1 = Whole step (2 semitones)
    // Piston 2 = Half step (1 semitone)
    // Piston 3 = Minor third (3 semitones)
    const pitchInOctave = midiPitch % 12;
    const valveStates = [
      [1, 3, 6, 8, 10].includes(pitchInOctave), // Valve 1
      [1, 2, 6, 7, 11].includes(pitchInOctave), // Valve 2
      [3, 4, 5, 8, 9].includes(pitchInOctave)   // Valve 3
    ];

    this.valves.forEach((v, idx) => {
      const isDown = valveStates[idx] || (idx === 0 && Math.random() > 0.4);
      const targetY = isDown ? v.baseY - 0.022 : v.baseY;

      gsap.killTweensOf(v.group.position);
      gsap.to(v.group.position, {
        y: targetY,
        duration: 0.04,
        ease: 'power2.out',
        onComplete: () => {
          gsap.to(v.group.position, {
            y: v.baseY,
            duration: 0.12,
            delay: 0.06,
            ease: 'power1.in'
          });
        }
      });
    });

    // 2. Bell Acoustic Recoil Kick
    if (this.trumpetBody) {
      gsap.killTweensOf(this.trumpetBody.position);
      gsap.killTweensOf(this.trumpetBody.rotation);

      gsap.to(this.trumpetBody.position, {
        x: -0.018 * vel,
        y: 0.008 * vel,
        duration: 0.05,
        ease: 'power2.out',
        yoyo: true,
        repeat: 1
      });

      gsap.to(this.trumpetBody.rotation, {
        z: 0.025 * vel,
        duration: 0.06,
        ease: 'power2.out',
        yoyo: true,
        repeat: 1
      });
    }

    // 3. Acoustic Shockwave Ring Emission
    const idleRing = this.shockwaveRings.find(r => r.material.opacity <= 0.05);
    if (idleRing) {
      idleRing.position.set(0.33, 0.036, 0.022);
      idleRing.scale.set(1, 1, 1);
      idleRing.material.opacity = 0.85 * vel;

      gsap.killTweensOf(idleRing.position);
      gsap.killTweensOf(idleRing.scale);
      gsap.killTweensOf(idleRing.material);

      gsap.to(idleRing.position, {
        x: 1.4,
        duration: 0.55,
        ease: 'power1.out'
      });
      gsap.to(idleRing.scale, {
        x: 3.5,
        y: 3.5,
        z: 3.5,
        duration: 0.55,
        ease: 'power1.out'
      });
      gsap.to(idleRing.material, {
        opacity: 0,
        duration: 0.55,
        ease: 'power2.in'
      });
    }
  }

  onNoteOff(midiPitch) {
    // Smooth reset
  }

  update(delta) {
    // Idle gentle stage breathing
    if (this.trumpetBody) {
      this.trumpetBody.rotation.y = Math.sin(Date.now() * 0.0018) * 0.015;
    }
  }
}
