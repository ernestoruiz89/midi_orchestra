import * as THREE from 'three';
import gsap from 'gsap';
import { AirIntakeEffect } from './AirIntakeEffect.js';

/**
 * Trumpet3D: Precision Engineered Bb Brass Trumpet
 * Modeled 1:1 after reference photo media_1788372470040.png with pure geometric precision:
 * - Parallel horizontal straight brass tubes (no distorted spline bends!)
 * - Exact 180° semicircular elbows (U-bends) joining pipes with zero gaps
 * - Flared bell on the left (-X) with smooth exponential flare and rolled rim
 * - Bell pipe running along the top tier to the rear U-bend on the right (+X)
 * - Leadpipe & mouthpiece on the upper right (+X)
 * - 3 vertical valve casings in the center with knurled caps, washers, silver stems, and pearl buttons
 * - 1st valve slide to the right with U-shaped thumb saddle on top
 * - 2nd valve slide extending forward from the middle valve
 * - 3rd valve slide to the left under the bell with vertical finger ring and spit valve
 * - Main tuning slide under the bell with spit valve and vertical cross braces
 * - Pinky hook on the top leadpipe near the valves
 * - Sturdy stage tripod stand
 */
export class Trumpet3D {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();
    // Positioned on stage right
    this.group.position.set(4.4, 1.40, 0.4);
    // Bell angled towards downstage-center and audience matching saxophone: -X local → center-stage/audience
    this.group.rotation.set(0.06, Math.PI * 0.32, 0.06);

    this.valves = []; // 3 valve piston groups
    this.bellMesh = null;
    this.trumpetBody = null;
    this.shockwaveRings = [];
    this.airIntake = null;

    this._buildMaterials();
    this._buildStand();
    this._buildTrumpet();
    this._buildShockwaveRings();

    this.scene.add(this.group);
  }

  _buildMaterials() {
    // Rich, warm polished gold brass lacquer with high clearcoat
    this.brassMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xedba32,
      roughness: 0.14,
      metalness: 0.90,
      clearcoat: 0.85,
      clearcoatRoughness: 0.06
    });

    // Darker warm inner bell shade
    this.innerBellMaterial = new THREE.MeshStandardMaterial({
      color: 0xd2981c,
      roughness: 0.28,
      metalness: 0.85,
      side: THREE.BackSide
    });

    // Silver-plated hardware (mouthpiece, pistons, finger ring, thumb saddle)
    this.silverMaterial = new THREE.MeshStandardMaterial({
      color: 0xe8e8ea,
      roughness: 0.12,
      metalness: 0.95
    });

    // Mother-of-pearl finger button inlays
    this.pearlMaterial = new THREE.MeshStandardMaterial({
      color: 0xfffcf6,
      roughness: 0.25,
      metalness: 0.05
    });

    // Black valve felt washers
    this.feltMaterial = new THREE.MeshStandardMaterial({
      color: 0x1a1a1a,
      roughness: 0.85,
      metalness: 0.0
    });

    // Satin black stand
    this.standMaterial = new THREE.MeshStandardMaterial({
      color: 0x1c1c20,
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

    // Heavy cast base matching the flute and violin studio stands.
    const base = new THREE.Mesh(
      new THREE.CylinderGeometry(0.18, 0.21, 0.032, 24),
      this.chromeMaterial
    );
    stand.add(base);

    for (let i = 0; i < 3; i++) {
      const angle = (i * Math.PI * 2) / 3;
      const foot = new THREE.Mesh(
        new THREE.CylinderGeometry(0.016, 0.016, 0.008, 12),
        this.standMaterial
      );
      foot.position.set(Math.cos(angle) * 0.17, -0.018, Math.sin(angle) * 0.17);
      stand.add(foot);
    }

    // Two-piece telescopic chrome mast with a visible locking collar.
    const lowerPole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.013, 0.013, 0.70, 12),
      this.chromeMaterial
    );
    lowerPole.position.y = 0.35;
    stand.add(lowerPole);

    const collar = new THREE.Mesh(
      new THREE.CylinderGeometry(0.020, 0.020, 0.04, 16),
      this.chromeMaterial
    );
    collar.position.y = 0.70;
    stand.add(collar);

    const upperPole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.009, 0.009, 0.62, 12),
      this.chromeMaterial
    );
    upperPole.position.y = 1.01;
    stand.add(upperPole);

    // Compact padded bell cone and shoulder cradle.
    const crossbar = new THREE.Mesh(
      new THREE.BoxGeometry(0.20, 0.012, 0.016),
      this.chromeMaterial
    );
    crossbar.position.y = 1.31;
    stand.add(crossbar);

    [-0.075, 0.075].forEach((x) => {
      const pad = new THREE.Mesh(
        new THREE.CylinderGeometry(0.007, 0.007, 0.055, 10),
        this.standMaterial
      );
      pad.position.set(x, 1.335, 0.018);
      pad.rotation.x = Math.PI * 0.18;
      stand.add(pad);
    });

    const cradleCone = new THREE.Mesh(
      new THREE.ConeGeometry(0.035, 0.12, 16),
      this.standMaterial
    );
    cradleCone.position.y = 1.37;
    stand.add(cradleCone);

    this.group.add(stand);
  }

  _buildTrumpet() {
    const body = new THREE.Group();
    this.trumpetBody = body;

    const tr = 0.0062; // Standard trumpet pipe radius (12.4mm diameter)

    // Helper to add a straight horizontal pipe along X
    const addXTube = (x1, x2, y, z, mat = this.brassMaterial, radius = tr) => {
      const len = Math.abs(x2 - x1);
      const geom = new THREE.CylinderGeometry(radius, radius, len, 14);
      geom.rotateZ(Math.PI / 2);
      const mesh = new THREE.Mesh(geom, mat);
      mesh.position.set((x1 + x2) / 2, y, z);
      mesh.castShadow = true;
      body.add(mesh);
      return mesh;
    };

    // Helper to add a 180° U-bend in the XY plane
    // facingLeft = true means curve extends towards -X; false means extends towards +X
    const addXYBend = (x, y1, y2, z, facingLeft = true, mat = this.brassMaterial, radius = tr) => {
      const R = Math.abs(y2 - y1) / 2;
      const midY = (y1 + y2) / 2;
      const geom = new THREE.TorusGeometry(R, radius, 12, 28, Math.PI);
      if (facingLeft) {
        geom.rotateZ(Math.PI / 2);
      } else {
        geom.rotateZ(-Math.PI / 2);
      }
      const mesh = new THREE.Mesh(geom, mat);
      mesh.position.set(x, midY, z);
      mesh.castShadow = true;
      body.add(mesh);
      return mesh;
    };

    // ==========================================
    // 1. THREE VERTICAL VALVE CASINGS (Centered along X)
    // ==========================================
    // Valve 3 (front/left towards bell): x = -0.034
    // Valve 2 (middle): x = 0.000
    // Valve 1 (rear/right towards mouthpiece): x = +0.034
    const valveSpacing = 0.034;
    for (let i = 0; i < 3; i++) {
      const vx = (i - 1) * valveSpacing;

      // Outer Brass Valve Casing
      const casing = new THREE.Mesh(
        new THREE.CylinderGeometry(0.0135, 0.0135, 0.115, 18),
        this.brassMaterial
      );
      casing.position.set(vx, 0, 0);
      casing.castShadow = true;
      body.add(casing);

      // Top threaded cap
      const topCap = new THREE.Mesh(
        new THREE.CylinderGeometry(0.0155, 0.0155, 0.010, 18),
        this.brassMaterial
      );
      topCap.position.set(vx, 0.058, 0);
      body.add(topCap);

      // Black felt washer on top cap
      const felt = new THREE.Mesh(
        new THREE.CylinderGeometry(0.0135, 0.0135, 0.004, 16),
        this.feltMaterial
      );
      felt.position.set(vx, 0.064, 0);
      body.add(felt);

      // Bottom knurled valve cap
      const botCap = new THREE.Mesh(
        new THREE.CylinderGeometry(0.0145, 0.0145, 0.012, 18),
        this.brassMaterial
      );
      botCap.position.set(vx, -0.058, 0);
      body.add(botCap);

      // Moving Piston Valve
      const pistonGroup = new THREE.Group();
      pistonGroup.position.set(vx, 0.066, 0);

      // Thin silver stem
      const stem = new THREE.Mesh(
        new THREE.CylinderGeometry(0.003, 0.003, 0.055, 8),
        this.silverMaterial
      );
      stem.position.y = 0.028;
      pistonGroup.add(stem);

      // Gold knurled finger button
      const button = new THREE.Mesh(
        new THREE.CylinderGeometry(0.012, 0.012, 0.006, 16),
        this.brassMaterial
      );
      button.position.y = 0.056;
      pistonGroup.add(button);

      // Pearl inlay
      const pearl = new THREE.Mesh(
        new THREE.CylinderGeometry(0.010, 0.010, 0.003, 16),
        this.pearlMaterial
      );
      pearl.position.y = 0.059;
      pistonGroup.add(pearl);

      body.add(pistonGroup);

      this.valves.push({
        group: pistonGroup,
        baseY: 0.066,
        isPressed: false
      });
    }

    // Connective knuckles between valve casings
    const knuckle1 = new THREE.Mesh(new THREE.BoxGeometry(0.010, 0.045, 0.016), this.brassMaterial);
    knuckle1.position.set(-valveSpacing / 2, 0, 0);
    body.add(knuckle1);

    const knuckle2 = new THREE.Mesh(new THREE.BoxGeometry(0.010, 0.045, 0.016), this.brassMaterial);
    knuckle2.position.set(valveSpacing / 2, 0, 0);
    body.add(knuckle2);

    // ==========================================
    // 2. BELL (Flaring to the LEFT at -X) & UPPER BELL PIPE
    // ==========================================
    const bellY = 0.038;
    const bellZ = -0.014;

    // A. Flared Bell (from x = -0.080 down to x = -0.280)
    const flarePoints = [];
    const segments = 24;
    const flareStartR = tr;   // 0.0062 (exact match with straight pipe!)
    const flareEndR = 0.066;  // 13.2cm bell diameter
    const flareLength = 0.20;

    for (let j = 0; j <= segments; j++) {
      const t = j / segments;
      // Authentic exponential trumpet bell curve
      const r = flareStartR + (flareEndR - flareStartR) * Math.pow(t, 2.6);
      const x = t * flareLength;
      flarePoints.push(new THREE.Vector2(r, x));
    }

    const bellFlareGeom = new THREE.LatheGeometry(flarePoints, 36);
    // Rotate so opening points along -X
    bellFlareGeom.rotateZ(Math.PI / 2);

    const bellOuter = new THREE.Mesh(bellFlareGeom, this.brassMaterial);
    bellOuter.position.set(-0.080, bellY, bellZ);
    bellOuter.castShadow = true;
    body.add(bellOuter);
    this.bellMesh = bellOuter;

    const bellInner = new THREE.Mesh(bellFlareGeom, this.innerBellMaterial);
    bellInner.position.set(-0.080, bellY, bellZ);
    body.add(bellInner);

    // Rolled Rim Bead at opening
    const bellRim = new THREE.Mesh(
      new THREE.TorusGeometry(flareEndR, 0.0026, 10, 36).rotateY(Math.PI / 2),
      this.brassMaterial
    );
    bellRim.position.set(-0.080 - flareLength, bellY, bellZ);
    body.add(bellRim);

    // B. Straight Bell Pipe running across the top from x = -0.080 to x = 0.220
    addXTube(-0.080, 0.220, bellY, bellZ);

    // C. Rear 180° Semicircular U-Bow on the Far Right (+X)
    // Connects upper bell pipe (y = 0.038) to lower return pipe (y = -0.014)
    addXYBend(0.220, bellY, -0.014, bellZ, false);

    // D. Lower Return Pipe from x = 0.034 (Valve 1) to x = 0.220
    addXTube(0.034, 0.220, -0.014, bellZ);

    // ==========================================
    // 3. LEADPIPE & SILVER MOUTHPIECE (Top Right +X)
    // ==========================================
    const leadY = 0.038;
    const leadZ = 0.014;

    // Straight Leadpipe running from x = -0.050 to x = 0.220
    addXTube(-0.050, 0.220, leadY, leadZ);

    // Mouthpiece Receiver Collar at x = 0.220
    const receiver = new THREE.Mesh(
      new THREE.CylinderGeometry(tr * 1.35, tr * 1.20, 0.035, 14).rotateZ(Math.PI / 2),
      this.brassMaterial
    );
    receiver.position.set(0.220, leadY, leadZ);
    body.add(receiver);

    // Silver Mouthpiece
    const mpGroup = new THREE.Group();
    mpGroup.position.set(0.235, leadY, leadZ);

    const mpShank = new THREE.Mesh(
      new THREE.CylinderGeometry(tr * 0.95, tr * 0.80, 0.045, 12).rotateZ(Math.PI / 2),
      this.silverMaterial
    );
    mpShank.position.x = 0.020;
    mpGroup.add(mpShank);

    const mpCup = new THREE.Mesh(
      new THREE.ConeGeometry(0.015, 0.025, 16).rotateZ(Math.PI / 2),
      this.silverMaterial
    );
    mpCup.position.x = 0.050;
    mpGroup.add(mpCup);

    const mpRim = new THREE.Mesh(
      new THREE.TorusGeometry(0.014, 0.0035, 8, 16).rotateY(Math.PI / 2),
      this.silverMaterial
    );
    mpRim.position.x = 0.063;
    mpGroup.add(mpRim);
    this.airIntake = new AirIntakeEffect(mpGroup, {
      origin: new THREE.Vector3(0.063, 0, 0),
      outwardDirection: new THREE.Vector3(1, 0, 0),
      distance: 0.14
    });
    body.add(mpGroup);

    // Pinky Hook near Valve 3 on top of leadpipe
    const pinkyHook = new THREE.Mesh(
      new THREE.TorusGeometry(0.009, 0.0022, 8, 16, Math.PI * 0.75).rotateY(Math.PI / 2),
      this.brassMaterial
    );
    pinkyHook.position.set(-0.020, leadY + 0.015, leadZ);
    pinkyHook.rotation.z = 0.2;
    body.add(pinkyHook);

    // ==========================================
    // 4. MAIN TUNING SLIDE (Lower Left under Bell, with Water Key)
    // ==========================================
    // Parallel straight tubes:
    // Upper tube from x = -0.050 to x = -0.160 at y = leadY (0.038), z = leadZ (0.014)
    addXTube(-0.160, -0.050, leadY, leadZ);

    // 180° Semicircular U-Bow at x = -0.160 connecting y = 0.038 to y = -0.014
    addXYBend(-0.160, leadY, -0.014, leadZ, true);

    // Lower tube from x = -0.160 to x = -0.034 (enters Valve 3) at y = -0.014, z = leadZ (0.014)
    addXTube(-0.160, -0.034, -0.014, leadZ);

    // Water key on Main Tuning U-Bow
    const tuneWaterKey = this._createWaterKey();
    tuneWaterKey.position.set(-0.186, 0.012, leadZ);
    tuneWaterKey.rotation.y = -Math.PI / 2;
    body.add(tuneWaterKey);

    // Cross Braces (Clean vertical cylinders with solder collars)
    this._addPipeBrace(body, -0.070, bellY, -0.014, (bellZ + leadZ) / 2);
    this._addPipeBrace(body, 0.160, bellY, -0.014, bellZ);

    // ==========================================
    // 5. 1ST VALVE SLIDE (To the RIGHT of valves, with U-shaped Thumb Saddle)
    // ==========================================
    const v1X = valveSpacing; // +0.034
    const s1Y_top = 0.010;
    const s1Y_bot = -0.010;
    const s1Z = 0.006;
    const s1X_end = v1X + 0.075; // 0.109

    // Two parallel horizontal tubes
    addXTube(v1X, s1X_end, s1Y_top, s1Z, this.brassMaterial, tr * 0.9);
    addXTube(v1X, s1X_end, s1Y_bot, s1Z, this.brassMaterial, tr * 0.9);

    // 180° U-bend connecting them
    addXYBend(s1X_end, s1Y_top, s1Y_bot, s1Z, false, this.brassMaterial, tr * 0.9);

    // U-shaped Thumb Saddle on the upper tube
    const thumbSaddle = new THREE.Mesh(
      new THREE.TorusGeometry(0.010, 0.0022, 8, 16, Math.PI),
      this.brassMaterial
    );
    thumbSaddle.position.set(v1X + 0.045, s1Y_top + 0.012, s1Z);
    thumbSaddle.rotation.z = Math.PI; // Opening points upwards
    body.add(thumbSaddle);

    // ==========================================
    // 6. 2ND VALVE SLIDE (Middle valve, pointing forward +Z)
    // ==========================================
    const v2X = 0.000;
    const s2Y_top = 0.008;
    const s2Y_bot = -0.008;
    const s2Z_start = 0.010;
    const s2Z_end = 0.036;

    // Upper and lower forward tubes along Z
    const addZTube = (z1, z2, x, y) => {
      const len = Math.abs(z2 - z1);
      const geom = new THREE.CylinderGeometry(tr * 0.9, tr * 0.9, len, 12);
      geom.rotateX(Math.PI / 2);
      const mesh = new THREE.Mesh(geom, this.brassMaterial);
      mesh.position.set(x, y, (z1 + z2) / 2);
      mesh.castShadow = true;
      body.add(mesh);
    };
    addZTube(s2Z_start, s2Z_end, v2X, s2Y_top);
    addZTube(s2Z_start, s2Z_end, v2X, s2Y_bot);

    // 180° U-bend in YZ plane
    const s2R = Math.abs(s2Y_top - s2Y_bot) / 2;
    const s2BendGeom = new THREE.TorusGeometry(s2R, tr * 0.9, 10, 20, Math.PI);
    s2BendGeom.rotateY(Math.PI / 2);
    s2BendGeom.rotateZ(Math.PI / 2);
    const s2Bend = new THREE.Mesh(s2BendGeom, this.brassMaterial);
    s2Bend.position.set(v2X, 0, s2Z_end);
    body.add(s2Bend);

    // ==========================================
    // 7. 3RD VALVE SLIDE (To the LEFT under bell, with Finger Ring & Spit Valve)
    // ==========================================
    const v3X = -valveSpacing; // -0.034
    const s3Y_top = -0.006;
    const s3Y_bot = -0.026;
    const s3Z = -0.006;
    const s3X_end = v3X - 0.095; // -0.129

    // Two parallel horizontal tubes
    addXTube(v3X, s3X_end, s3Y_top, s3Z, this.brassMaterial, tr * 0.9);
    addXTube(v3X, s3X_end, s3Y_bot, s3Z, this.brassMaterial, tr * 0.9);

    // 180° U-bend connecting them
    addXYBend(s3X_end, s3Y_top, s3Y_bot, s3Z, true, this.brassMaterial, tr * 0.9);

    // Vertical Finger Ring on the upper tube
    const fingerRing = new THREE.Mesh(
      new THREE.TorusGeometry(0.012, 0.0024, 8, 20).rotateY(Math.PI / 2),
      this.brassMaterial
    );
    fingerRing.position.set(v3X - 0.045, s3Y_top + 0.014, s3Z);
    body.add(fingerRing);

    // Water key on 3rd slide U-bend
    const slide3WaterKey = this._createWaterKey();
    slide3WaterKey.position.set(s3X_end - 0.012, s3Y_bot, s3Z);
    slide3WaterKey.rotation.y = -Math.PI / 2;
    body.add(slide3WaterKey);

    this.group.add(body);
  }

  /**
   * Creates a detailed miniature brass water key (spit valve lever with spring and cork pad)
   */
  _createWaterKey() {
    const group = new THREE.Group();

    // Lever arm
    const lever = new THREE.Mesh(
      new THREE.BoxGeometry(0.004, 0.018, 0.005),
      this.silverMaterial
    );
    lever.position.y = -0.006;
    group.add(lever);

    // Pivot mount
    const pivot = new THREE.Mesh(
      new THREE.CylinderGeometry(0.003, 0.003, 0.006, 8).rotateZ(Math.PI / 2),
      this.brassMaterial
    );
    group.add(pivot);

    // Cork pad
    const cork = new THREE.Mesh(
      new THREE.CylinderGeometry(0.0035, 0.0035, 0.003, 8),
      new THREE.MeshStandardMaterial({ color: 0xc8a165, roughness: 0.8 })
    );
    cork.position.y = 0.004;
    group.add(cork);

    return group;
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
      new THREE.CylinderGeometry(0.0028, 0.0028, h, 8),
      this.brassMaterial
    );
    braceGroup.add(rod);

    // Collar on top pipe
    const topCollar = new THREE.Mesh(
      new THREE.CylinderGeometry(0.0055, 0.0055, 0.008, 10),
      this.brassMaterial
    );
    topCollar.position.y = h / 2;
    braceGroup.add(topCollar);

    // Collar on bottom pipe
    const botCollar = new THREE.Mesh(
      new THREE.CylinderGeometry(0.0055, 0.0055, 0.008, 10),
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
      // Located at the opening of the bell flare at x = -0.28
      ring.position.set(-0.28, 0.038, -0.014);
      this.group.add(ring);
      this.shockwaveRings.push(ring);
    }
  }

  onNoteOn(midiPitch, velocity = 0.8) {
    const vel = Math.max(0.3, Math.min(1.0, velocity));
    this.airIntake?.start(vel);

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
        x: 0.018 * vel, // Recoil backwards away from bell (-X)
        y: 0.008 * vel,
        duration: 0.05,
        ease: 'power2.out',
        yoyo: true,
        repeat: 1
      });

      gsap.to(this.trumpetBody.rotation, {
        z: -0.025 * vel,
        duration: 0.06,
        ease: 'power2.out',
        yoyo: true,
        repeat: 1
      });
    }

    // Acoustic Shockwave Ring Emission
    const idleRing = this.shockwaveRings.find(r => r.material.opacity <= 0.05);
    if (idleRing) {
      idleRing.position.set(-0.28, 0.038, -0.014);
      idleRing.scale.set(1, 1, 1);
      idleRing.material.opacity = 0.85 * vel;

      gsap.killTweensOf(idleRing.position);
      gsap.killTweensOf(idleRing.scale);
      gsap.killTweensOf(idleRing.material);

      gsap.to(idleRing.position, {
        x: -1.3,
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
    this.airIntake?.stop();
  }

  update(delta) {
    this.airIntake?.update(delta);
    // Idle gentle stage breathing
    if (this.trumpetBody) {
      this.trumpetBody.rotation.y = Math.sin(Date.now() * 0.0018) * 0.015;
    }
  }
}
