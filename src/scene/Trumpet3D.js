import * as THREE from 'three';
import gsap from 'gsap';

/**
 * Trumpet3D: Fully Complete, 100% Continuous Brass Trumpet
 * - Every pneumatic pipe is a continuous, unbroken curve (no open ends, no floating loops!)
 * - Circuit 1: Leadpipe -> Front Main Tuning Slide -> Valve 1
 * - Circuit 2: 1st Valve Slide (complete U-loop into Valve 1 with thumb saddle)
 * - Circuit 3: 2nd Valve Slide (complete U-loop into Valve 2)
 * - Circuit 4: 3rd Valve Slide (complete U-loop into Valve 3 with finger ring)
 * - Circuit 5: Valve 3 -> Rear U-Bow -> Straight Bell Pipe -> Flared Bell
 * - 3 functional moving pistons with pearl inlay buttons and valve casings
 * - Solid solder-collar cross braces (fully bridging pipes, no floating pins)
 * - Professional stage tripod stand with padded support cone
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

      const foot = new THREE.Mesh(
        new THREE.SphereGeometry(0.016, 8, 8),
        this.standMaterial
      );
      foot.position.set(0.34, 0.015, 0);
      legGroup.add(foot);

      stand.add(legGroup);
    }

    // Top Rubber Velvet Cradle Cone supporting the trumpet securely
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

    const tr = 0.0072; // Standard trumpet tubing radius (14.4mm diameter)

    // ==========================================
    // 1. VALVE BLOCK (Center at x = 0, y = 0, z = 0)
    // ==========================================
    const valveSpacing = 0.034;
    for (let i = 0; i < 3; i++) {
      const vx = (i - 1) * valveSpacing;

      // Outer Brass Casing
      const casing = new THREE.Mesh(
        new THREE.CylinderGeometry(0.015, 0.015, 0.12, 18),
        this.brassMaterial
      );
      casing.position.set(vx, 0, 0);
      body.add(casing);

      // Top threaded cap
      const topCap = new THREE.Mesh(
        new THREE.CylinderGeometry(0.017, 0.017, 0.012, 18),
        this.brassMaterial
      );
      topCap.position.set(vx, 0.062, 0);
      body.add(topCap);

      // Bottom valve cap
      const botCap = new THREE.Mesh(
        new THREE.CylinderGeometry(0.016, 0.016, 0.014, 18),
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
    const knuckle1 = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.05, 0.018), this.brassMaterial);
    knuckle1.position.set(-valveSpacing / 2, 0, 0);
    body.add(knuckle1);

    const knuckle2 = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.05, 0.018), this.brassMaterial);
    knuckle2.position.set(valveSpacing / 2, 0, 0);
    body.add(knuckle2);

    // ==========================================
    // 2. MAIN LEADPIPE & TUNING SLIDE (Continuous Loop from Receiver to Valve 1!)
    // ==========================================
    const leadY = -0.016;
    const leadZ = -0.020;
    const tuneSpacing = 0.052; // distance between upper and lower pipes

    // 100% Continuous path: receiver -> straight leadpipe -> front U-bow -> return pipe -> enters Valve 1 casing!
    const mainTuningCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.25, leadY, leadZ),                     // Mouthpiece receiver entry
      new THREE.Vector3(-0.10, leadY, leadZ),                     // Passes Valve 1
      new THREE.Vector3(0.05, leadY, leadZ),                      // Passes Valve 3
      new THREE.Vector3(0.16, leadY, leadZ),                      // Enters tuning slide
      new THREE.Vector3(0.22, leadY + tuneSpacing * 0.15, leadZ), // Starts front bow curve
      new THREE.Vector3(0.24, leadY + tuneSpacing * 0.50, leadZ), // Apex of U-turn
      new THREE.Vector3(0.22, leadY + tuneSpacing * 0.85, leadZ), // Completes U-turn
      new THREE.Vector3(0.16, leadY + tuneSpacing, leadZ),        // Upper return pipe
      new THREE.Vector3(0.02, leadY + tuneSpacing, leadZ),        // Running back towards Valve 1
      new THREE.Vector3(-0.020, leadY + tuneSpacing * 0.80, -0.012),
      new THREE.Vector3(-valveSpacing, 0.018, -0.005)             // Directly penetrates and seals into Valve 1 casing!
    ]);

    const mainTuningMesh = new THREE.Mesh(
      new THREE.TubeGeometry(mainTuningCurve, 48, tr, 12, false),
      this.brassMaterial
    );
    mainTuningMesh.castShadow = true;
    body.add(mainTuningMesh);

    // Mouthpiece Receiver Collar
    const receiver = new THREE.Mesh(
      new THREE.CylinderGeometry(tr * 1.4, tr * 1.25, 0.040, 14).rotateZ(Math.PI / 2),
      this.brassMaterial
    );
    receiver.position.set(-0.25, leadY, leadZ);
    body.add(receiver);

    // Silver Mouthpiece firmly inserted into receiver
    const mpGroup = new THREE.Group();
    mpGroup.position.set(-0.265, leadY, leadZ);

    const mpShank = new THREE.Mesh(
      new THREE.CylinderGeometry(tr * 0.95, tr * 0.80, 0.045, 12).rotateZ(Math.PI / 2),
      this.silverMaterial
    );
    mpShank.position.x = -0.020;
    mpGroup.add(mpShank);

    const mpCup = new THREE.Mesh(
      new THREE.ConeGeometry(0.015, 0.025, 16).rotateZ(-Math.PI / 2),
      this.silverMaterial
    );
    mpCup.position.x = -0.050;
    mpGroup.add(mpCup);

    const mpRim = new THREE.Mesh(
      new THREE.TorusGeometry(0.014, 0.0035, 8, 16).rotateY(Math.PI / 2),
      this.silverMaterial
    );
    mpRim.position.x = -0.063;
    mpGroup.add(mpRim);
    body.add(mpGroup);

    // Water key (spit valve) on main tuning bow apex
    const waterKey = new THREE.Mesh(
      new THREE.BoxGeometry(0.007, 0.016, 0.008),
      this.silverMaterial
    );
    waterKey.position.set(0.242, leadY + tuneSpacing * 0.50, leadZ);
    body.add(waterKey);

    // Solid Cross Braces bridging upper and lower pipes
    this._addPipeBrace(body, 0.12, leadY, leadY + tuneSpacing, leadZ);
    this._addPipeBrace(body, -0.12, leadY, leadY + tuneSpacing, leadZ);

    // ==========================================
    // 3. 1ST VALVE SLIDE (Continuous U-loop sealed to Valve 1)
    // ==========================================
    const v1X = -valveSpacing;
    const slide1Curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(v1X, 0.010, 0.012),
      new THREE.Vector3(v1X - 0.035, 0.010, 0.018),
      new THREE.Vector3(v1X - 0.065, 0.005, 0.022),
      new THREE.Vector3(v1X - 0.080, 0.000, 0.022),
      new THREE.Vector3(v1X - 0.065, -0.005, 0.022),
      new THREE.Vector3(v1X - 0.035, -0.010, 0.018),
      new THREE.Vector3(v1X, -0.010, 0.012)
    ]);
    const slide1Mesh = new THREE.Mesh(
      new THREE.TubeGeometry(slide1Curve, 24, tr * 0.88, 10, false),
      this.brassMaterial
    );
    body.add(slide1Mesh);

    // Thumb Saddle on 1st slide
    const thumbSaddle = new THREE.Mesh(
      new THREE.TorusGeometry(0.008, 0.0025, 8, 16, Math.PI).rotateX(Math.PI / 2),
      this.silverMaterial
    );
    thumbSaddle.position.set(v1X - 0.055, 0.018, 0.020);
    body.add(thumbSaddle);

    // ==========================================
    // 4. 2ND VALVE SLIDE (Continuous U-loop sealed to Valve 2)
    // ==========================================
    const v2X = 0.000;
    const slide2Curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(v2X, 0.008, -0.012),
      new THREE.Vector3(v2X, 0.008, -0.032),
      new THREE.Vector3(v2X, 0.000, -0.042),
      new THREE.Vector3(v2X, -0.008, -0.032),
      new THREE.Vector3(v2X, -0.008, -0.012)
    ]);
    const slide2Mesh = new THREE.Mesh(
      new THREE.TubeGeometry(slide2Curve, 20, tr * 0.88, 10, false),
      this.brassMaterial
    );
    body.add(slide2Mesh);

    // ==========================================
    // 5. 3RD VALVE SLIDE (Continuous U-loop sealed to Valve 3 with Finger Ring)
    // ==========================================
    const v3X = valveSpacing;
    const slide3Curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(v3X, -0.012, 0.012),
      new THREE.Vector3(v3X + 0.045, -0.012, 0.018),
      new THREE.Vector3(v3X + 0.090, -0.006, 0.022),
      new THREE.Vector3(v3X + 0.115, 0.000, 0.022),
      new THREE.Vector3(v3X + 0.090, 0.006, 0.022),
      new THREE.Vector3(v3X + 0.045, 0.012, 0.018),
      new THREE.Vector3(v3X, 0.012, 0.012)
    ]);
    const slide3Mesh = new THREE.Mesh(
      new THREE.TubeGeometry(slide3Curve, 28, tr * 0.88, 10, false),
      this.brassMaterial
    );
    body.add(slide3Mesh);

    // 3rd Slide Finger Ring mounted firmly on the bow
    const fingerRing = new THREE.Mesh(
      new THREE.TorusGeometry(0.011, 0.0025, 8, 16).rotateY(Math.PI / 2),
      this.silverMaterial
    );
    fingerRing.position.set(v3X + 0.115, 0.014, 0.022);
    body.add(fingerRing);

    // ==========================================
    // 6. BELL CIRCUIT & ELEGANT EXPONENTIAL FLARE
    // ==========================================
    const bellY = 0.038;
    const bellZ = 0.022;

    // Continuous pipe from Valve 3 lower exit -> loops around rear bow behind Valve 1 -> straight bell pipe to flare!
    const bellCircuitCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(v3X, -0.025, 0.000),      // Exits Valve 3
      new THREE.Vector3(0.000, -0.025, 0.004),
      new THREE.Vector3(-0.110, -0.025, 0.010),
      new THREE.Vector3(-0.160, -0.015, 0.016),   // Rear U-bow starts
      new THREE.Vector3(-0.185, 0.010, 0.020),    // Rear U-bow apex behind valves
      new THREE.Vector3(-0.160, 0.032, 0.022),    // Rear U-bow return
      new THREE.Vector3(-0.080, bellY, bellZ),    // Straight bell pipe passes Valve 1
      new THREE.Vector3(0.000, bellY, bellZ),     // Passes Valve 2
      new THREE.Vector3(0.080, bellY, bellZ)      // Reaches exact start of bell flare!
    ]);

    const bellCircuitMesh = new THREE.Mesh(
      new THREE.TubeGeometry(bellCircuitCurve, 42, tr, 12, false),
      this.brassMaterial
    );
    bellCircuitMesh.castShadow = true;
    body.add(bellCircuitMesh);

    // Smooth Exponential Bell Flare using LatheGeometry
    // Starts at exactly x = 0.080, y = bellY, z = bellZ with radius tr!
    const flarePoints = [];
    const segments = 20;
    const flareStartR = tr;   // 0.0072 (exact match with bell pipe for seamless joint!)
    const flareEndR = 0.068;  // 13.6cm authentic bell flare diameter
    const flareLength = 0.24;

    for (let j = 0; j <= segments; j++) {
      const t = j / segments;
      // Natural exponential bell expansion curve
      const r = flareStartR + (flareEndR - flareStartR) * Math.pow(t, 2.6);
      const x = t * flareLength;
      flarePoints.push(new THREE.Vector2(r, x));
    }

    const bellFlareGeom = new THREE.LatheGeometry(flarePoints, 32);
    // Rotate to point along +X
    bellFlareGeom.rotateZ(-Math.PI / 2);

    const bellOuter = new THREE.Mesh(bellFlareGeom, this.brassMaterial);
    bellOuter.position.set(0.080, bellY, bellZ);
    bellOuter.castShadow = true;
    body.add(bellOuter);
    this.bellMesh = bellOuter;

    // Darker inner bell gold lining
    const bellInner = new THREE.Mesh(bellFlareGeom, this.innerBellMaterial);
    bellInner.position.set(0.080, bellY, bellZ);
    body.add(bellInner);

    // Rolled Bell Rim Bead (Outer brass ring)
    const bellRim = new THREE.Mesh(
      new THREE.TorusGeometry(flareEndR, 0.0028, 10, 36).rotateY(Math.PI / 2),
      this.brassMaterial
    );
    bellRim.position.set(0.080 + flareLength, bellY, bellZ);
    body.add(bellRim);

    // Ergonomic Pinky Hook near Valve 3 on the leadpipe
    const pinkyHook = new THREE.Mesh(
      new THREE.TorusGeometry(0.009, 0.0025, 8, 16, Math.PI * 0.75).rotateY(Math.PI / 2),
      this.brassMaterial
    );
    pinkyHook.position.set(v3X + 0.015, leadY + 0.018, leadZ);
    body.add(pinkyHook);

    this.group.add(body);
  }

  /**
   * Helper to build realistic cross braces with solder collars clamping both pipes
   */
  _addPipeBrace(parent, x, y1, y2, z) {
    const braceGroup = new THREE.Group();
    braceGroup.position.set(x, (y1 + y2) / 2, z);

    const h = Math.abs(y2 - y1);

    // Central rod
    const rod = new THREE.Mesh(
      new THREE.CylinderGeometry(0.003, 0.003, h, 8),
      this.brassMaterial
    );
    braceGroup.add(rod);

    // Collar on top pipe
    const topCollar = new THREE.Mesh(
      new THREE.CylinderGeometry(0.006, 0.006, 0.010, 10),
      this.brassMaterial
    );
    topCollar.position.y = h / 2;
    braceGroup.add(topCollar);

    // Collar on bottom pipe
    const botCollar = new THREE.Mesh(
      new THREE.CylinderGeometry(0.006, 0.006, 0.010, 10),
      this.brassMaterial
    );
    botCollar.position.y = -h / 2;
    braceGroup.add(botCollar);

    parent.add(braceGroup);
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
      ring.position.set(0.33, 0.038, 0.022);
      this.group.add(ring);
      this.shockwaveRings.push(ring);
    }
  }

  onNoteOn(midiPitch, velocity = 0.8) {
    const vel = Math.max(0.3, Math.min(1.0, velocity));

    // Realistic Trumpet Valve Fingering
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

    // Bell Acoustic Recoil Kick
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

    // Acoustic Shockwave Ring Emission
    const idleRing = this.shockwaveRings.find(r => r.material.opacity <= 0.05);
    if (idleRing) {
      idleRing.position.set(0.33, 0.038, 0.022);
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
