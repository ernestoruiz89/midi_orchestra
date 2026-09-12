import * as THREE from 'three';
import gsap from 'gsap';
import { AirIntakeEffect } from './AirIntakeEffect.js';

/**
 * Trombone3D: Master-crafted Bb Tenor Trombone
 * Modeled 1:1 after reference wireframe media_1789189338047.png:
 * 
 * - Co-planar, mathematical 3-tier architecture (all elements centered at Z = 0):
 *   * Tier 1 (Top, Y = 0.160): Bell flare (X = -0.10 to -0.38), bell pipe, upper tuning slide pipe.
 *   * Tier 2 (Middle, Y = 0.040): Upper slide tube, mouthpiece (facing +X), lower tuning slide pipe.
 *   * Tier 3 (Bottom, Y = -0.040): Lower slide tube.
 * 
 * - Complete clearance: Bell rim bottom is at Y = +0.062, slide tube is at Y = +0.040.
 *   Result: ZERO penetration/clipping through the bell cone!
 * - Perfectly joined vertical braces with end collar ferrules (ZERO floating tubes).
 * - Authentic 7-position slide mechanics mapped to MIDI pitches.
 */
export class Trombone3D {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();

    // Positioned in the brass section on stage right, next to trumpet & french horn
    this.group.position.set(4.55, 1.40, 1.05);
    // Angled towards audience: -X local points towards audience/downstage
    this.group.rotation.set(0.06, Math.PI * 0.32, 0.06);

    this.tromboneBody = null;
    this.slideAssembly = null;
    this.slideGroup = null;
    this.slideAngle = Math.PI * 0.5; // +90° horizontal plane
    this.bellMesh = null;
    this.shockwaveRings = [];
    this.airIntake = null;
    this.idleReturnTimer = null;

    // Slide extension distances (meters along local -X) for positions 1 to 7
    this.positionExtensions = [
      0.00,  // Pos 1 (closed)
      0.08,  // Pos 2
      0.16,  // Pos 3
      0.25,  // Pos 4
      0.34,  // Pos 5
      0.43,  // Pos 6
      0.52   // Pos 7 (fully extended)
    ];

    // Canonical Tenor Trombone slide positions for MIDI pitches 36 (C2) to 84 (C6)
    this.pitchToPosition = {
      36: 6, 37: 5, 38: 4, 39: 3, 40: 7, 41: 6, 42: 5, 43: 4, 44: 3, 45: 2, 46: 1, // C2 - Bb2
      47: 7, 48: 6, 49: 5, 50: 4, 51: 3, 52: 2, 53: 1, 54: 5, 55: 4, 56: 3, 57: 2, 58: 1, // B2 - Bb3
      59: 7, 60: 1, 61: 5, 62: 4, 63: 3, 64: 2, 65: 1, 66: 5, 67: 4, 68: 3, 69: 2, 70: 1, // B3 - Bb4
      71: 4, 72: 3, 73: 2, 74: 1, 75: 3, 76: 2, 77: 1, 78: 3, 79: 2, 80: 1, 81: 2, 82: 1  // B4 - Bb5
    };

    this._buildMaterials();
    this._buildStand();
    this._buildTrombone();
    this._buildShockwaveRings();

    this.scene.add(this.group);
  }

  _buildMaterials() {
    // Rich, warm polished orchestral gold brass lacquer
    this.brassMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xedba32,
      roughness: 0.13,
      metalness: 0.90,
      clearcoat: 0.85,
      clearcoatRoughness: 0.05
    });

    // Darker warm inner bell shade for acoustic depth
    this.innerBellMaterial = new THREE.MeshStandardMaterial({
      color: 0xc48c1a,
      roughness: 0.28,
      metalness: 0.82,
      side: THREE.BackSide
    });

    // Nickel-plated silver for inner slide tubes, mouthpiece, and medallion accents
    this.silverMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xebedf2,
      roughness: 0.10,
      metalness: 0.95,
      clearcoat: 0.90,
      clearcoatRoughness: 0.04
    });

    // Mouthpiece cup interior depth material
    this.cupInteriorMaterial = new THREE.MeshStandardMaterial({
      color: 0x8a8e96,
      roughness: 0.40,
      metalness: 0.85
    });

    // Heavy studio cast chrome base
    this.chromeMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xe6e9ee,
      roughness: 0.12,
      metalness: 0.95,
      clearcoat: 0.90,
      clearcoatRoughness: 0.06
    });

    // Rubber feet, bumpers, and velvet stand cone
    this.rubberMaterial = new THREE.MeshStandardMaterial({
      color: 0x161618,
      roughness: 0.75,
      metalness: 0.15
    });
  }

  _buildStand() {
    const stand = new THREE.Group();
    // Base rests on stage floor (world y = 0, group y = -1.40)
    stand.position.set(0, -1.40, 0);

    // 1. Heavy cast round chrome base with beveled edge
    const base = new THREE.Mesh(
      new THREE.CylinderGeometry(0.18, 0.21, 0.032, 28),
      this.chromeMaterial
    );
    base.position.y = 0.016;
    base.castShadow = true;
    stand.add(base);

    // 3 Black rubber floor feet
    for (let i = 0; i < 3; i++) {
      const angle = (i * Math.PI * 2) / 3;
      const foot = new THREE.Mesh(
        new THREE.CylinderGeometry(0.018, 0.018, 0.008, 14),
        this.rubberMaterial
      );
      foot.position.set(Math.cos(angle) * 0.17, -0.004, Math.sin(angle) * 0.17);
      stand.add(foot);
    }

    // 2. Telescopic central vertical chrome mast
    const lowerMast = new THREE.Mesh(
      new THREE.CylinderGeometry(0.016, 0.016, 0.70, 16),
      this.chromeMaterial
    );
    lowerMast.position.set(0.30, 0.38, 0);
    stand.add(lowerMast);

    // Locking collar
    const collar = new THREE.Mesh(
      new THREE.CylinderGeometry(0.022, 0.022, 0.040, 16),
      this.rubberMaterial
    );
    collar.position.set(0.30, 0.73, 0);
    stand.add(collar);

    const upperMast = new THREE.Mesh(
      new THREE.CylinderGeometry(0.012, 0.012, 0.65, 16),
      this.chromeMaterial
    );
    upperMast.position.set(0.30, 1.05, 0);
    stand.add(upperMast);

    // 3. Padded support cradle resting safely under the middle frame tube at Y = 0.040
    // Group y is -1.40, so Y = 0.040 in group corresponds to Y = 1.44 in stand
    const cradleGroup = new THREE.Group();
    cradleGroup.position.set(0.30, 1.36, 0);

    const supportCone = new THREE.Mesh(
      new THREE.ConeGeometry(0.030, 0.07, 20),
      this.rubberMaterial
    );
    supportCone.position.y = 0.035;
    cradleGroup.add(supportCone);

    const topPad = new THREE.Mesh(
      new THREE.SphereGeometry(0.010, 12, 12),
      this.rubberMaterial
    );
    topPad.position.y = 0.075;
    cradleGroup.add(topPad);

    stand.add(cradleGroup);
    this.group.add(stand);
  }

  _buildTrombone() {
    const body = new THREE.Group();
    this.tromboneBody = body;

    // Tube radii
    const tr = 0.0075;       // Standard tubing outer radius (15mm OD)
    const trInner = 0.0062;  // Inner slide radius (12.4mm OD)
    const trOuter = 0.0078;  // Outer slide radius (15.6mm OD)
    const ferruleR = 0.0098; // Raised collar/ferrule radius

    // Vertical Y levels along X:
    const yBell = 0.170;         // Upper Level: Bell flare, bell pipe, upper tuning slide
    const yTuningLower = 0.090;  // Tuning Lower Level: Lower tuning slide pipe
    const ySlideUpper = 0.040;   // Slide Upper Level: Leadpipe with mouthpiece
    const ySlideLower = -0.040;  // Slide Lower Level: Lower slide tube

    // Helper: Add straight horizontal tube along X
    const addXTube = (parent, xStart, xEnd, y, radius = tr, material = this.brassMaterial) => {
      const length = Math.abs(xEnd - xStart);
      const geom = new THREE.CylinderGeometry(radius, radius, length, 18);
      geom.rotateZ(Math.PI / 2);
      const mesh = new THREE.Mesh(geom, material);
      mesh.position.set((xStart + xEnd) / 2, y, 0);
      mesh.castShadow = true;
      parent.add(mesh);
      return mesh;
    };

    // Helper: Add 180° planar semicircular bend in XY plane at Z = 0
    const addXYBend = (parent, centerX, y1, y2, isLeftBend = false, radius = tr, material = this.brassMaterial) => {
      const bendR = Math.abs(y1 - y2) / 2;
      const centerY = (y1 + y2) / 2;
      const geom = new THREE.TorusGeometry(bendR, radius, 14, 28, Math.PI);
      geom.rotateZ(isLeftBend ? Math.PI / 2 : -Math.PI / 2);
      const mesh = new THREE.Mesh(geom, material);
      mesh.position.set(centerX, centerY, 0);
      mesh.castShadow = true;
      parent.add(mesh);
      return mesh;
    };

    // Helper: Add decorative ferrule / collar ring around horizontal tube
    const addFerrule = (parent, x, y, r = ferruleR, len = 0.014, material = this.brassMaterial) => {
      const geom = new THREE.CylinderGeometry(r, r, len, 16);
      geom.rotateZ(Math.PI / 2);
      const mesh = new THREE.Mesh(geom, material);
      mesh.position.set(x, y, 0);
      parent.add(mesh);
      return mesh;
    };

    // Helper: Add strictly vertical brace between two levels with end collar ferrules
    const addVerticalBrace = (parent, x, y1, y2, radius = 0.0045, material = this.brassMaterial) => {
      const length = Math.abs(y2 - y1);
      const geom = new THREE.CylinderGeometry(radius, radius, length, 16);
      const mesh = new THREE.Mesh(geom, material);
      mesh.position.set(x, (y1 + y2) / 2, 0);
      mesh.castShadow = true;
      parent.add(mesh);

      // Collar sleeves wrapping around horizontal pipes at joints
      const collarGeom = new THREE.CylinderGeometry(radius * 1.5, radius * 1.5, 0.014, 16);
      collarGeom.rotateZ(Math.PI / 2);

      const collarTop = new THREE.Mesh(collarGeom, material);
      collarTop.position.set(x, y1, 0);
      parent.add(collarTop);

      const collarBot = new THREE.Mesh(collarGeom, material);
      collarBot.position.set(x, y2, 0);
      parent.add(collarBot);

      return mesh;
    };

    // =========================================================================
    // 1. BELL SECTION (Y = 0.170): EXPONENTIAL FLARE & BELL PIPE
    // =========================================================================
    // Exponentially flared bell cone (opening pointing along -X)
    // Bell rim bottom is at Y = 0.170 - 0.095 = +0.075.
    // Upper slide tube is at Y = +0.040 (top surface at +0.048).
    // Result: ~2.7 cm of clean daylight space, ZERO clipping/penetration!
    const flarePoints = [];
    const segments = 32;
    const flareStartR = tr;   // 0.0075
    const flareEndR = 0.095;  // 19.0cm bell diameter
    const flareLength = 0.28;
    const bellThroatX = -0.100; // Throat starts at X = -0.100 and flares to X = -0.380

    for (let j = 0; j <= segments; j++) {
      const t = j / segments;
      // Smooth exponential flare curve matching reference photo media_1789189945850.png
      const r = flareStartR + (flareEndR - flareStartR) * Math.pow(t, 2.7);
      const x = t * flareLength;
      flarePoints.push(new THREE.Vector2(r, x));
    }

    const bellGeom = new THREE.LatheGeometry(flarePoints, 44);
    bellGeom.rotateZ(Math.PI / 2); // Opening points towards -X

    const bellOuter = new THREE.Mesh(bellGeom, this.brassMaterial);
    bellOuter.position.set(bellThroatX, yBell, 0);
    bellOuter.castShadow = true;
    body.add(bellOuter);
    this.bellMesh = bellOuter;

    const bellInner = new THREE.Mesh(bellGeom, this.innerBellMaterial);
    bellInner.position.set(bellThroatX, yBell, 0);
    body.add(bellInner);

    // Rolled rim bead at the bell opening (X = -0.380)
    const rimGeom = new THREE.TorusGeometry(flareEndR, 0.0035, 12, 44);
    rimGeom.rotateY(Math.PI / 2);
    const rim = new THREE.Mesh(rimGeom, this.brassMaterial);
    rim.position.set(bellThroatX - flareLength, yBell, 0);
    body.add(rim);

    // Bell Pipe running straight back from throat (X = -0.100) to rear tuning slide (X = 0.500)
    addXTube(body, bellThroatX, 0.280, yBell);
    addFerrule(body, 0.280, yBell);
    addXTube(body, 0.280, 0.500, yBell);

    // =========================================================================
    // 2. REAR TUNING SLIDE (FAR RIGHT, X = 0.060 to 0.500)
    // =========================================================================
    // The Middle Tube (Y = ySlideUpper = 0.040) is the continuous straight tube that connects
    // the rear tuning crook directly to the stationary inner slide tube!
    // NO GOOSENECK: Tube runs completely straight from X = 0.500 to X = 0.060 (gold brass)
    // and continues from X = 0.060 to X = -0.650 (nickel-silver inner slide tube).
    addXTube(body, 0.060, 0.280, ySlideUpper);
    addFerrule(body, 0.280, ySlideUpper);
    addXTube(body, 0.280, 0.500, ySlideUpper);

    // Rear 180° Semicircular Tuning Bow connecting Bell pipe (Y = 0.170) and Middle tube (Y = 0.040) at X = 0.500
    addXYBend(body, 0.500, yBell, ySlideUpper, false);

    // Rear Tuning Slide Vertical Braces (inside rear loop, matching reference render)
    addVerticalBrace(body, 0.440, yBell, ySlideUpper, 0.0042);
    addVerticalBrace(body, 0.340, yBell, ySlideUpper, 0.0042);

    // Counterweight Medallion (Circular Disc on rear brace at X = 0.440)
    const cwYCenter = (yBell + ySlideUpper) / 2; // Y = 0.105
    const cwDisc = new THREE.Mesh(
      new THREE.CylinderGeometry(0.024, 0.024, 0.008, 28),
      this.brassMaterial
    );
    cwDisc.position.set(0.440, cwYCenter, 0);
    cwDisc.rotateX(Math.PI / 2);
    body.add(cwDisc);

    // Silver inner bezel ring on counterweight
    const cwBezel = new THREE.Mesh(
      new THREE.TorusGeometry(0.016, 0.0020, 10, 28),
      this.silverMaterial
    );
    cwBezel.position.set(0.440, cwYCenter, 0.0045);
    body.add(cwBezel);

    // =========================================================================
    // 3. BRACES & JUNCTION SUPPORTS
    // =========================================================================
    // Main Bell Support Brace connecting Bell Pipe (Y = 0.170) to Middle tube (Y = 0.040) under the bell throat at X = 0.060
    addVerticalBrace(body, 0.060, yBell, ySlideUpper, 0.0050);

    // =========================================================================
    // 4. SLIDE ASSEMBLY (Rotated around Middle Tube axis: Y = 0.040, Z = 0)
    // =========================================================================
    // The slide plane is rotated around the middle tube axis by +90° (Math.PI * 0.5)
    // so that the leadpipe and mouthpiece lie in the horizontal plane (Y = 0.040, Z = -0.080)
    // matching user requirement and reference media_1789197626656.png with zero cone penetration.
    const slideDist = Math.abs(ySlideUpper - ySlideLower); // 0.080m spacing
    const slideAssembly = new THREE.Group();
    slideAssembly.position.set(0, ySlideUpper, 0);
    this.slideAssembly = slideAssembly;

    this.slideAngle = Math.PI * 0.5; // +90° horizontal plane
    slideAssembly.rotation.x = this.slideAngle;

    // B. Inner Slide Brace at X = 0.020 connecting Upper slide tube (y = 0) and Lower slide tube (y = -slideDist)
    addVerticalBrace(slideAssembly, 0.020, 0, -slideDist, 0.0045, this.silverMaterial);

    // =========================================================================
    // 5. MOUTHPIECE (BOQUILLA) - INCRUSTADA EN EL TUBO DE LA VARA (LEADPIPE)
    // =========================================================================
    // The Lower Slide Tube ends at X = 0.060 with a brass receiver collar ferrule.
    // The silver mouthpiece is inserted directly ("incrustada") into this collar pointing rearward (+X).
    // Completely unobstructed space behind the rim for AirIntakeEffect.
    const mpReceiver = new THREE.Mesh(
      new THREE.CylinderGeometry(tr * 1.35, tr * 1.18, 0.024, 16).rotateZ(Math.PI / 2),
      this.brassMaterial
    );
    mpReceiver.position.set(0.060, -slideDist, 0);
    slideAssembly.add(mpReceiver);

    const mpGroup = new THREE.Group();
    mpGroup.position.set(0.060, -slideDist, 0);

    // Mouthpiece Shank inserted into the receiver
    const mpShank = new THREE.Mesh(
      new THREE.CylinderGeometry(0.0068, 0.0060, 0.028, 16).rotateZ(-Math.PI / 2),
      this.silverMaterial
    );
    mpShank.position.x = 0.014;
    mpGroup.add(mpShank);

    // Throat collar ring
    const mpRing = new THREE.Mesh(
      new THREE.TorusGeometry(0.0078, 0.0016, 8, 18).rotateY(Math.PI / 2),
      this.silverMaterial
    );
    mpRing.position.x = 0.028;
    mpGroup.add(mpRing);

    // Flared Cup (Copa profunda de trombón tenor)
    const mpCupGeom = new THREE.CylinderGeometry(0.0185, 0.0078, 0.026, 24);
    mpCupGeom.rotateZ(-Math.PI / 2);
    const mpCup = new THREE.Mesh(mpCupGeom, this.silverMaterial);
    mpCup.position.x = 0.041;
    mpGroup.add(mpCup);

    // Rounded comfortable mouthpiece rim facing +X
    const mpRim = new THREE.Mesh(
      new THREE.TorusGeometry(0.0175, 0.0035, 12, 24).rotateY(Math.PI / 2),
      this.silverMaterial
    );
    mpRim.position.x = 0.054;
    mpGroup.add(mpRim);

    // Cup interior depth cone
    const cupInterior = new THREE.Mesh(
      new THREE.ConeGeometry(0.0145, 0.020, 18).rotateZ(Math.PI / 2),
      this.cupInteriorMaterial
    );
    cupInterior.position.x = 0.044;
    mpGroup.add(cupInterior);

    // Air intake particles emanating from the mouthpiece rim facing outward (+X towards player)
    this.airIntake = new AirIntakeEffect(mpGroup, {
      origin: new THREE.Vector3(0.054, 0, 0),
      outwardDirection: new THREE.Vector3(1, 0, 0),
      distance: 0.16
    });
    slideAssembly.add(mpGroup);

    // =========================================================================
    // 6. STATIONARY INNER SLIDE (Nickel-Silver Tubes, X = 0.060 to -0.650)
    // =========================================================================
    // Upper inner slide tube (at rotation axis y = 0)
    addXTube(slideAssembly, 0.060, -0.650, 0, trInner, this.silverMaterial);
    addFerrule(slideAssembly, 0.060, 0, ferruleR, 0.016);

    // Lower inner slide tube (Leadpipe, y = -slideDist)
    addXTube(slideAssembly, 0.060, -0.650, -slideDist, trInner, this.silverMaterial);

    // =========================================================================
    // 7. MOVING OUTER SLIDE (Gold Brass Telescoping Slide)
    // =========================================================================
    this.slideGroup = new THREE.Group();

    // In 1st position (closed), outer slide extends from X = -0.020 down to X = -0.680
    // Upper outer tube (y = 0)
    addXTube(this.slideGroup, -0.020, -0.680, 0, trOuter, this.brassMaterial);
    addFerrule(this.slideGroup, -0.020, 0, ferruleR, 0.014);

    // Lower outer tube (y = -slideDist)
    addXTube(this.slideGroup, -0.020, -0.680, -slideDist, trOuter, this.brassMaterial);
    addFerrule(this.slideGroup, -0.020, -slideDist, ferruleR, 0.014);

    // Outer Slide 180° Semicircular U-Bow at the far front (X = -0.680)
    addXYBend(this.slideGroup, -0.680, 0, -slideDist, true, trOuter, this.brassMaterial);
    addFerrule(this.slideGroup, -0.672, 0, ferruleR, 0.012);
    addFerrule(this.slideGroup, -0.672, -slideDist, ferruleR, 0.012);

    // Rubber protective bumper tip at the very apex of the slide bow
    const slideBumper = new THREE.Mesh(
      new THREE.SphereGeometry(0.010, 12, 12),
      this.rubberMaterial
    );
    const slideBowApex = -0.680 - (slideDist / 2) - 0.004;
    slideBumper.position.set(slideBowApex, -slideDist / 2, 0);
    this.slideGroup.add(slideBumper);

    // Water Key (Llave de desagüe / spit valve) on the front slide bow
    const waterKeyArm = new THREE.Mesh(
      new THREE.CylinderGeometry(0.0018, 0.0018, 0.022, 10),
      this.brassMaterial
    );
    waterKeyArm.position.set(slideBowApex + 0.008, -slideDist - 0.008, 0);
    waterKeyArm.rotateZ(Math.PI / 4);
    this.slideGroup.add(waterKeyArm);

    // Moving Outer Slide Grip Brace at X = -0.060 (where trombonist grips the slide)
    addVerticalBrace(this.slideGroup, -0.060, 0, -slideDist, 0.0050);

    slideAssembly.add(this.slideGroup);
    body.add(slideAssembly);
    this.group.add(body);
  }

  setSlideAngle(angleInRadians) {
    this.slideAngle = angleInRadians;
    if (this.slideAssembly) {
      this.slideAssembly.rotation.x = angleInRadians;
    }
  }

  _buildShockwaveRings() {
    for (let r = 0; r < 4; r++) {
      const ringGeom = new THREE.TorusGeometry(0.10, 0.009, 8, 28);
      ringGeom.rotateY(Math.PI / 2);
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0xffe270,
        transparent: true,
        opacity: 0
      });
      const ring = new THREE.Mesh(ringGeom, ringMat);
      // Located at the opening of the bell flare at X = -0.380, Y = 0.170, Z = 0
      ring.position.set(-0.380, 0.170, 0);
      this.group.add(ring);
      this.shockwaveRings.push(ring);
    }
  }

  /**
   * Note On handler with realistic slide positioning and acoustic physics
   */
  onNoteOn(midiPitch, velocity = 0.8) {
    const vel = Math.max(0.3, Math.min(1.0, velocity));
    this.airIntake?.start(vel);

    if (this.idleReturnTimer) {
      clearTimeout(this.idleReturnTimer);
      this.idleReturnTimer = null;
    }

    // Determine target slide position (1 to 7)
    let pos = this.pitchToPosition[midiPitch];
    if (!pos) {
      // Fallback calculation for notes outside table
      pos = 1 + ((Math.abs(midiPitch - 58)) % 7);
    }
    const ext = this.positionExtensions[pos - 1] || 0.0;

    // Slide extension animation (slides forward along local -X)
    if (this.slideGroup) {
      gsap.killTweensOf(this.slideGroup.position);
      gsap.to(this.slideGroup.position, {
        x: -ext,
        duration: 0.11,
        ease: 'power2.out'
      });
    }

    // Bell & Instrument Body Acoustic Recoil Kick
    if (this.tromboneBody) {
      gsap.killTweensOf(this.tromboneBody.position);
      gsap.killTweensOf(this.tromboneBody.rotation);

      gsap.to(this.tromboneBody.position, {
        x: 0.024 * vel, // Recoil backwards away from bell flare (-X)
        y: 0.008 * vel,
        duration: 0.05,
        ease: 'power2.out',
        yoyo: true,
        repeat: 1
      });

      gsap.to(this.tromboneBody.rotation, {
        z: -0.028 * vel,
        duration: 0.06,
        ease: 'power2.out',
        yoyo: true,
        repeat: 1
      });
    }

    // Acoustic Shockwave Ring Emission from the bell
    const idleRing = this.shockwaveRings.find(r => r.material.opacity <= 0.05);
    if (idleRing) {
      idleRing.position.set(-0.380, 0.170, 0);
      idleRing.scale.set(1, 1, 1);
      idleRing.material.opacity = 0.85 * vel;

      gsap.killTweensOf(idleRing.position);
      gsap.killTweensOf(idleRing.scale);
      gsap.killTweensOf(idleRing.material);

      gsap.to(idleRing.position, {
        x: -1.6,
        duration: 0.60,
        ease: 'power1.out'
      });
      gsap.to(idleRing.scale, {
        x: 3.6,
        y: 3.6,
        z: 3.6,
        duration: 0.60,
        ease: 'power1.out'
      });
      gsap.to(idleRing.material, {
        opacity: 0,
        duration: 0.60,
        ease: 'power2.in'
      });
    }
  }

  onNoteOff(midiPitch) {
    this.airIntake?.stop();

    // After brief rest without notes, return slide gently to Position 1
    if (this.idleReturnTimer) clearTimeout(this.idleReturnTimer);
    this.idleReturnTimer = setTimeout(() => {
      if (this.slideGroup) {
        gsap.to(this.slideGroup.position, {
          x: 0.0,
          duration: 0.35,
          ease: 'power1.inOut'
        });
      }
    }, 450);
  }

  update(delta) {
    this.airIntake?.update(delta);
    // Subtle idle breathing sway on stand
    if (this.tromboneBody) {
      this.tromboneBody.rotation.y = Math.sin(Date.now() * 0.0016) * 0.012;
    }
  }
}
