import * as THREE from 'three';
import gsap from 'gsap';

/**
 * Trumpet3D: Masterpiece Bb Brass Trumpet modeled precisely after media_1788372470040.png:
 * - Flared bell on the left (-X) with smooth exponential flare and rolled rim
 * - Bell pipe running along the top tier to the rear U-bend on the right (+X)
 * - Mouthpiece & receiver on the upper right (+X)
 * - 3 vertical valve casings in the center with bottom knurled caps, top washer caps,
 *   moving silver piston stems, and gold finger buttons with pearl inlays
 * - 1st valve slide to the right of valves with U-shaped thumb saddle on top
 * - 2nd valve slide extending sideways from the middle valve
 * - 3rd valve slide extending left under the bell with silver finger ring and water key
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
    // Angled gracefully so the bell faces downstage-left towards the audience
    this.group.rotation.set(0.06, Math.PI * 0.12, 0.06);

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

    // Central mast
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

    const tr = 0.0068; // Tube radius (13.6mm diameter)

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
        new THREE.CylinderGeometry(0.014, 0.014, 0.115, 18),
        this.brassMaterial
      );
      casing.position.set(vx, 0, 0);
      casing.castShadow = true;
      body.add(casing);

      // Top threaded cap
      const topCap = new THREE.Mesh(
        new THREE.CylinderGeometry(0.016, 0.016, 0.010, 18),
        this.brassMaterial
      );
      topCap.position.set(vx, 0.058, 0);
      body.add(topCap);

      // Black felt washer on top cap
      const felt = new THREE.Mesh(
        new THREE.CylinderGeometry(0.014, 0.014, 0.004, 16),
        this.feltMaterial
      );
      felt.position.set(vx, 0.064, 0);
      body.add(felt);

      // Bottom knurled valve cap
      const botCap = new THREE.Mesh(
        new THREE.CylinderGeometry(0.015, 0.015, 0.012, 18),
        this.brassMaterial
      );
      botCap.position.set(vx, -0.058, 0);
      body.add(botCap);

      // Moving Piston Valve
      const pistonGroup = new THREE.Group();
      pistonGroup.position.set(vx, 0.066, 0);

      // Thin silver stem
      const stem = new THREE.Mesh(
        new THREE.CylinderGeometry(0.0032, 0.0032, 0.055, 8),
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

    // Smooth Exponential Bell Flare using LatheGeometry
    // Starts at x = -0.08 and expands out to x = -0.28 (20cm flare)
    const flarePoints = [];
    const segments = 22;
    const flareStartR = tr;   // 0.0068 (exact match with bell pipe)
    const flareEndR = 0.066;  // 13.2cm authentic bell diameter
    const flareLength = 0.20;

    for (let j = 0; j <= segments; j++) {
      const t = j / segments;
      // Exponential flare profile
      const r = flareStartR + (flareEndR - flareStartR) * Math.pow(t, 2.5);
      const x = t * flareLength;
      flarePoints.push(new THREE.Vector2(r, x));
    }

    const bellFlareGeom = new THREE.LatheGeometry(flarePoints, 32);
    // Rotate so opening faces -X (left)
    bellFlareGeom.rotateZ(Math.PI / 2);

    const bellOuter = new THREE.Mesh(bellFlareGeom, this.brassMaterial);
    bellOuter.position.set(-0.08, bellY, bellZ);
    bellOuter.castShadow = true;
    body.add(bellOuter);
    this.bellMesh = bellOuter;

    // Inner gold bell lining
    const bellInner = new THREE.Mesh(bellFlareGeom, this.innerBellMaterial);
    bellInner.position.set(-0.08, bellY, bellZ);
    body.add(bellInner);

    // Rolled Bell Rim Bead (Outer brass ring at opening x = -0.28)
    const bellRim = new THREE.Mesh(
      new THREE.TorusGeometry(flareEndR, 0.0026, 10, 36).rotateY(Math.PI / 2),
      this.brassMaterial
    );
    bellRim.position.set(-0.08 - flareLength, bellY, bellZ);
    body.add(bellRim);

    // Continuous Upper Bell Pipe running from bell start (x = -0.08) -> passes above valves -> rear U-bow (x = 0.24) -> returns to Valve 1!
    const bellPipeCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.08, bellY, bellZ),
      new THREE.Vector3(0.00, bellY, bellZ),
      new THREE.Vector3(0.08, bellY, bellZ),
      new THREE.Vector3(0.18, bellY, bellZ),
      new THREE.Vector3(0.24, bellY - 0.008, bellZ),
      new THREE.Vector3(0.26, bellY - 0.026, bellZ), // Rear U-bow apex on right
      new THREE.Vector3(0.24, bellY - 0.045, bellZ),
      new THREE.Vector3(0.18, -0.015, bellZ),
      new THREE.Vector3(0.08, -0.015, bellZ),
      new THREE.Vector3(valveSpacing, -0.015, -0.006) // Enters Valve 1 casing cleanly!
    ]);

    const bellPipeMesh = new THREE.Mesh(
      new THREE.TubeGeometry(bellPipeCurve, 42, tr, 12, false),
      this.brassMaterial
    );
    bellPipeMesh.castShadow = true;
    body.add(bellPipeMesh);

    // ==========================================
    // 3. LEADPIPE & SILVER MOUTHPIECE (Top Right +X)
    // ==========================================
    const leadY = 0.038;
    const leadZ = 0.014;

    // Straight leadpipe tube running from receiver (x = 0.23) to left of valves (x = -0.04)
    const leadpipeGeom = new THREE.CylinderGeometry(tr, tr, 0.27, 12).rotateZ(Math.PI / 2);
    const leadpipe = new THREE.Mesh(leadpipeGeom, this.brassMaterial);
    leadpipe.position.set(0.095, leadY, leadZ);
    body.add(leadpipe);

    // Mouthpiece Receiver Collar at x = 0.23
    const receiver = new THREE.Mesh(
      new THREE.CylinderGeometry(tr * 1.35, tr * 1.2, 0.035, 14).rotateZ(Math.PI / 2),
      this.brassMaterial
    );
    receiver.position.set(0.23, leadY, leadZ);
    body.add(receiver);

    // Silver Mouthpiece
    const mpGroup = new THREE.Group();
    mpGroup.position.set(0.245, leadY, leadZ);

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
    body.add(mpGroup);

    // Pinky Finger Hook on the leadpipe near Valve 3
    const pinkyHook = new THREE.Mesh(
      new THREE.TorusGeometry(0.009, 0.0022, 8, 16, Math.PI * 0.75).rotateY(Math.PI / 2),
      this.brassMaterial
    );
    pinkyHook.position.set(-0.022, leadY + 0.016, leadZ);
    pinkyHook.rotation.z = 0.2;
    body.add(pinkyHook);

    // ==========================================
    // 4. MAIN TUNING SLIDE (Lower Left under Bell, with Water Key)
    // ==========================================
    // Tube loops down from leadpipe at x = -0.04 -> runs left to x = -0.16 -> U-bow -> returns to Valve 3!
    const tuneCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.04, leadY, leadZ),
      new THREE.Vector3(-0.06, 0.020, leadZ),
      new THREE.Vector3(-0.08, -0.020, leadZ),
      new THREE.Vector3(-0.14, -0.020, leadZ),
      new THREE.Vector3(-0.17, -0.028, leadZ), // Apex of U-bow
      new THREE.Vector3(-0.17, -0.042, leadZ),
      new THREE.Vector3(-0.14, -0.050, leadZ),
      new THREE.Vector3(-0.06, -0.050, leadZ),
      new THREE.Vector3(-valveSpacing, -0.025, 0.000) // Enters Valve 3 cleanly!
    ]);

    const tuneMesh = new THREE.Mesh(
      new THREE.TubeGeometry(tuneCurve, 36, tr, 12, false),
      this.brassMaterial
    );
    body.add(tuneMesh);

    // Water key on Main Tuning bow apex
    const tuneWaterKey = this._createWaterKey();
    tuneWaterKey.position.set(-0.172, -0.035, leadZ);
    tuneWaterKey.rotation.y = -Math.PI / 2;
    body.add(tuneWaterKey);

    // Vertical Cross Brace connecting bell pipe and tuning slide
    this._addPipeBrace(body, -0.06, bellY, -0.020, (bellZ + leadZ) / 2);

    // Rear Cross Brace connecting upper and lower pipes on right
    this._addPipeBrace(body, 0.16, bellY, -0.015, bellZ);

    // ==========================================
    // 5. 1ST VALVE SLIDE (To the RIGHT of valves, with U-shaped Thumb Saddle)
    // ==========================================
    const v1X = valveSpacing; // Valve 1 is at x = +0.034
    const slide1Curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(v1X, 0.010, 0.012),
      new THREE.Vector3(v1X + 0.035, 0.010, 0.016),
      new THREE.Vector3(v1X + 0.075, 0.005, 0.016),
      new THREE.Vector3(v1X + 0.090, 0.000, 0.016), // U-turn apex
      new THREE.Vector3(v1X + 0.075, -0.005, 0.016),
      new THREE.Vector3(v1X + 0.035, -0.010, 0.016),
      new THREE.Vector3(v1X, -0.010, 0.012)
    ]);
    const slide1Mesh = new THREE.Mesh(
      new THREE.TubeGeometry(slide1Curve, 24, tr * 0.88, 10, false),
      this.brassMaterial
    );
    body.add(slide1Mesh);

    // U-shaped Thumb Saddle mounted on top of 1st valve slide (exactly as in photo!)
    const thumbSaddle = new THREE.Mesh(
      new THREE.TorusGeometry(0.010, 0.0022, 8, 16, Math.PI),
      this.brassMaterial
    );
    thumbSaddle.position.set(v1X + 0.055, 0.022, 0.016);
    thumbSaddle.rotation.z = Math.PI; // Opening points upwards
    body.add(thumbSaddle);

    // ==========================================
    // 6. 2ND VALVE SLIDE (Middle valve, pointing forward +Z)
    // ==========================================
    const v2X = 0.000;
    const slide2Curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(v2X, 0.008, 0.012),
      new THREE.Vector3(v2X, 0.008, 0.034),
      new THREE.Vector3(v2X, 0.000, 0.042),
      new THREE.Vector3(v2X, -0.008, 0.034),
      new THREE.Vector3(v2X, -0.008, 0.012)
    ]);
    const slide2Mesh = new THREE.Mesh(
      new THREE.TubeGeometry(slide2Curve, 20, tr * 0.88, 10, false),
      this.brassMaterial
    );
    body.add(slide2Mesh);

    // ==========================================
    // 7. 3RD VALVE SLIDE (To the LEFT under bell, with Finger Ring & Water Key)
    // ==========================================
    const v3X = -valveSpacing; // Valve 3 is at x = -0.034
    const slide3Curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(v3X, 0.010, -0.012),
      new THREE.Vector3(v3X - 0.045, 0.010, -0.016),
      new THREE.Vector3(v3X - 0.090, 0.005, -0.016),
      new THREE.Vector3(v3X - 0.115, 0.000, -0.016), // U-turn apex
      new THREE.Vector3(v3X - 0.090, -0.005, -0.016),
      new THREE.Vector3(v3X - 0.045, -0.010, -0.016),
      new THREE.Vector3(v3X, -0.010, -0.012)
    ]);
    const slide3Mesh = new THREE.Mesh(
      new THREE.TubeGeometry(slide3Curve, 28, tr * 0.88, 10, false),
      this.brassMaterial
    );
    body.add(slide3Mesh);

    // Silver Finger Ring on 3rd slide (vertical ring as shown in reference photo!)
    const fingerRing = new THREE.Mesh(
      new THREE.TorusGeometry(0.012, 0.0024, 8, 20).rotateY(Math.PI / 2),
      this.brassMaterial
    );
    fingerRing.position.set(v3X - 0.055, 0.024, -0.016);
    body.add(fingerRing);

    // Water key on 3rd slide U-bend
    const slide3WaterKey = this._createWaterKey();
    slide3WaterKey.position.set(v3X - 0.118, 0.000, -0.016);
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
    // Smooth reset
  }

  update(delta) {
    // Idle gentle stage breathing
    if (this.trumpetBody) {
      this.trumpetBody.rotation.y = Math.sin(Date.now() * 0.0018) * 0.015;
    }
  }
}
