import * as THREE from 'three';
import gsap from 'gsap';
import { AirIntakeEffect } from './AirIntakeEffect.js';

/**
 * FrenchHorn3D: Double French Horn in F/Bb
 * - Simplified, cohesive brass tubing architecture matching reference design
 * - Authentic exponentially flared bell cone ("trompa/pavillon") with rolled bead rim
 * - Studio concert floor stand with heavy cast round chrome base matching flute and violin
 * - 3 rotary valves with linkage spatulas, U-slide loops, and cross braces
 * - Interactive note-on animations with valve depression, subtle body recoil, and shockwave rings
 */
export class FrenchHorn3D {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();

    // Positioned in the brass section (stage right, behind trumpet)
    this.group.position.set(4.1, 1.35, 1.2);
    // Angled towards the audience and center-stage, matching the trumpet's projection
    this.group.rotation.set(0.04, -0.22, 0.02);

    this.valves = [];
    this.bellMesh = null;
    this.bellLipOffset = 0;
    this.hornBody = null;
    this.shockwaveRings = [];
    this.airIntake = null;

    this._buildMaterials();
    this._buildStand();
    this._buildFrenchHorn();
    this._buildShockwaveRings();

    this.scene.add(this.group);
  }

  _buildMaterials() {
    // Polished orchestral gold brass with warm clearcoat
    this.brassMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xe8b835,
      roughness: 0.14,
      metalness: 0.88,
      clearcoat: 0.85,
      clearcoatRoughness: 0.06
    });

    // Darker warm inner bell shade for acoustic depth
    this.innerBellMaterial = new THREE.MeshStandardMaterial({
      color: 0xc9921e,
      roughness: 0.28,
      metalness: 0.82,
      side: THREE.BackSide
    });

    // Chrome / Nickel-silver hardware (valve caps, rotor spindles, levers, ferrules)
    this.silverMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xebedf2,
      roughness: 0.10,
      metalness: 0.94,
      clearcoat: 0.90
    });

    // Heavy studio cast chrome base matching flute and violin
    this.chromeMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xe6e9ee,
      roughness: 0.12,
      metalness: 0.95,
      clearcoat: 0.90,
      clearcoatRoughness: 0.06
    });

    // Velvet / rubber padding material for feet and cradle
    this.standMaterial = new THREE.MeshStandardMaterial({
      color: 0x141416,
      roughness: 0.80,
      metalness: 0.20
    });
  }

  _buildStand() {
    const stand = new THREE.Group();
    // Base rests on floor (world y = 0, group y = -1.35)
    stand.position.set(0, -1.35, 0);

    // 1. Heavy cast round chrome base with beveled edge matching flute and violin
    const base = new THREE.Mesh(
      new THREE.CylinderGeometry(0.18, 0.21, 0.032, 28),
      this.chromeMaterial
    );
    base.position.y = 0.016;
    stand.add(base);

    // 3 Black rubber feet underneath
    for (let i = 0; i < 3; i++) {
      const angle = (i * Math.PI * 2) / 3;
      const foot = new THREE.Mesh(
        new THREE.CylinderGeometry(0.016, 0.016, 0.008, 12),
        this.standMaterial
      );
      foot.position.set(Math.cos(angle) * 0.17, -0.004, Math.sin(angle) * 0.17);
      stand.add(foot);
    }

    // 2. Telescopic central chrome mast with locking collar
    const lowerPole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.013, 0.013, 0.65, 14),
      this.chromeMaterial
    );
    lowerPole.position.y = 0.34;
    stand.add(lowerPole);

    const collar = new THREE.Mesh(
      new THREE.CylinderGeometry(0.020, 0.020, 0.040, 16),
      this.chromeMaterial
    );
    collar.position.y = 0.67;
    stand.add(collar);

    const upperPole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.009, 0.009, 0.54, 14),
      this.chromeMaterial
    );
    upperPole.position.y = 0.94;
    stand.add(upperPole);

    // Mast top collar
    const topCollar = new THREE.Mesh(
      new THREE.CylinderGeometry(0.016, 0.016, 0.035, 14),
      this.chromeMaterial
    );
    topCollar.position.y = 1.18;
    stand.add(topCollar);

    // Padded cradle yoke cupping the bottom of the outer coil
    // Horn center is at (0, 0, 0), bottom of outer coil is at y = -0.16
    // In stand coordinates: y = -0.16 - (-1.35) = 1.19
    const cradleGroup = new THREE.Group();
    cradleGroup.position.set(0, 1.19, 0);

    const cradleYoke = new THREE.Mesh(
      new THREE.TorusGeometry(0.080, 0.012, 10, 24, Math.PI),
      this.standMaterial
    );
    // Opens upward in the XY plane
    cradleYoke.rotation.z = Math.PI;
    cradleGroup.add(cradleYoke);

    // Protective chrome end balls
    for (let s = -1; s <= 1; s += 2) {
      const tip = new THREE.Mesh(
        new THREE.SphereGeometry(0.010, 12, 12),
        this.chromeMaterial
      );
      tip.position.set(s * 0.080, 0, 0);
      cradleGroup.add(tip);
    }

    stand.add(cradleGroup);
    this.group.add(stand);
  }

  _buildFrenchHorn() {
    const horn = new THREE.Group();
    this.hornBody = horn;
    horn.position.set(0, 0, 0);

    const tubeRadius = 0.009;
    const coilRadius = 0.16;

    // 1. Outer Coil Loop (Main Body Circular Hoop in XY plane)
    const outerCoil = new THREE.Mesh(
      new THREE.TorusGeometry(coilRadius, tubeRadius, 16, 48),
      this.brassMaterial
    );
    horn.add(outerCoil);

    // 2. Inner Secondary Coil Loop (F-attachment branch)
    const innerCoil = new THREE.Mesh(
      new THREE.TorusGeometry(coilRadius * 0.72, tubeRadius * 0.90, 16, 40),
      this.brassMaterial
    );
    innerCoil.position.set(0.012, -0.010, -0.006);
    horn.add(innerCoil);

    // 3. Third Inner Loop
    const thirdCoil = new THREE.Mesh(
      new THREE.TorusGeometry(coilRadius * 0.48, tubeRadius * 0.85, 14, 32),
      this.brassMaterial
    );
    thirdCoil.position.set(-0.010, -0.018, 0.006);
    horn.add(thirdCoil);

    // 4. Leadpipe & Conical Mouthpiece (runs up the left side towards 10 o'clock)
    const leadCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.04, 0.02, 0.010),
      new THREE.Vector3(-0.10, 0.07, 0.015),
      new THREE.Vector3(-0.16, 0.12, 0.020),
      new THREE.Vector3(-0.21, 0.16, 0.025)
    ]);
    const leadpipe = new THREE.Mesh(
      new THREE.TubeGeometry(leadCurve, 20, 0.0075, 14, false),
      this.brassMaterial
    );
    horn.add(leadpipe);

    // Conical French Horn Mouthpiece pointing up and left
    const mpGroup = new THREE.Group();
    mpGroup.position.set(-0.21, 0.16, 0.025);
    mpGroup.rotation.z = 0.68;
    mpGroup.rotation.x = -0.15;

    // Conical cup
    const mpCup = new THREE.Mesh(
      new THREE.CylinderGeometry(0.012, 0.0055, 0.035, 16),
      this.silverMaterial
    );
    mpCup.position.y = 0.018;
    mpGroup.add(mpCup);

    // Mouthpiece Rim
    const mpRim = new THREE.Mesh(
      new THREE.TorusGeometry(0.012, 0.0025, 8, 16),
      this.silverMaterial
    );
    mpRim.position.y = 0.035;
    mpRim.rotation.x = Math.PI / 2;
    mpGroup.add(mpRim);
    this.airIntake = new AirIntakeEffect(mpGroup, {
      origin: new THREE.Vector3(0, 0.035, 0),
      outwardDirection: new THREE.Vector3(0, 1, 0),
      distance: 0.14
    });

    // Shank
    const mpShank = new THREE.Mesh(
      new THREE.CylinderGeometry(0.0050, 0.0042, 0.025, 14),
      this.silverMaterial
    );
    mpShank.position.y = -0.012;
    mpGroup.add(mpShank);

    horn.add(mpGroup);

    // 5. Rotary Valve Cluster (3 rotary valves inside the upper-left of the hoop)
    const valveCluster = new THREE.Group();
    valveCluster.position.set(-0.02, 0.02, 0.0);

    for (let i = 0; i < 3; i++) {
      const vGroup = new THREE.Group();
      const xOff = (i - 1) * 0.032;
      const yOff = -(i - 1) * 0.012;
      vGroup.position.set(xOff, yOff, 0);

      // Cylindrical rotor casing oriented along Z
      const rotorCasing = new THREE.Mesh(
        new THREE.CylinderGeometry(0.014, 0.014, 0.022, 18).rotateX(Math.PI / 2),
        this.brassMaterial
      );
      vGroup.add(rotorCasing);

      // Silver rotor end caps with spindle screws
      const capFront = new THREE.Mesh(
        new THREE.CylinderGeometry(0.011, 0.011, 0.003, 16).rotateX(Math.PI / 2),
        this.silverMaterial
      );
      capFront.position.z = 0.012;
      vGroup.add(capFront);

      const capBack = new THREE.Mesh(
        new THREE.CylinderGeometry(0.011, 0.011, 0.003, 16).rotateX(Math.PI / 2),
        this.silverMaterial
      );
      capBack.position.z = -0.012;
      vGroup.add(capBack);

      // Spatula lever extending upwards towards 11 o'clock
      const spatulaGroup = new THREE.Group();
      spatulaGroup.position.set(0, 0.018, 0);

      const spatulaStem = new THREE.Mesh(
        new THREE.CylinderGeometry(0.0022, 0.0022, 0.038, 8),
        this.silverMaterial
      );
      spatulaStem.position.set(-0.006, 0.018, 0.006);
      spatulaStem.rotation.z = 0.35;
      spatulaGroup.add(spatulaStem);

      // Oval paddle button for finger
      const spatulaPaddle = new THREE.Mesh(
        new THREE.BoxGeometry(0.012, 0.003, 0.016),
        this.silverMaterial
      );
      spatulaPaddle.position.set(-0.012, 0.038, 0.008);
      spatulaPaddle.rotation.z = 0.35;
      spatulaGroup.add(spatulaPaddle);

      vGroup.add(spatulaGroup);

      // Valve slide U-tube extending downward
      const slideU = new THREE.Mesh(
        new THREE.TorusGeometry(0.022 + i * 0.006, 0.0055, 8, 16, Math.PI),
        this.brassMaterial
      );
      slideU.position.set(0, -0.026, 0);
      vGroup.add(slideU);

      valveCluster.add(vGroup);
      this.valves.push({
        group: spatulaGroup,
        baseY: 0.018
      });
    }

    horn.add(valveCluster);

    // Cross braces connecting the coils in the XY plane
    const brace1 = new THREE.Mesh(
      new THREE.CylinderGeometry(0.0028, 0.0028, 0.045, 8).rotateZ(0.5),
      this.silverMaterial
    );
    brace1.position.set(-0.11, -0.08, 0);
    horn.add(brace1);

    const brace2 = new THREE.Mesh(
      new THREE.CylinderGeometry(0.0028, 0.0028, 0.045, 8).rotateZ(-0.5),
      this.silverMaterial
    );
    brace2.position.set(0.09, -0.09, 0);
    horn.add(brace2);

    // 6. Bell Branch & Flared Bell ("solo era corregir el cono")
    const rBranch = tubeRadius * 1.35; // ~0.012
    // Curves smoothly from top of outer coil (12 o'clock) around to the right and forward (+Z) towards the audience
    const bellCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, coilRadius, 0.005),
      new THREE.Vector3(0.10, coilRadius * 0.90, 0.040),
      new THREE.Vector3(0.16, coilRadius * 0.50, 0.120),
      new THREE.Vector3(0.17, 0.06, 0.220)
    ]);
    const bellBranch = new THREE.Mesh(
      new THREE.TubeGeometry(bellCurve, 24, rBranch, 16, false),
      this.brassMaterial
    );
    horn.add(bellBranch);

    // Flared Bell ("Trompa / Pavillon"):
    // Seamlessly aligned with the end tangent of bellBranch, flaring forward into an authentic French horn bell
    const endPoint = bellCurve.getPointAt(1);
    const endTangent = bellCurve.getTangentAt(1).normalize();

    const bellFlareGroup = new THREE.Group();
    bellFlareGroup.position.copy(endPoint);
    // Align local +Y axis directly along endTangent (projecting forward towards audience):
    bellFlareGroup.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), endTangent);

    // Profile curve for authentic exponential bell flare:
    // Starts at rBranch (seamless connection) and curves smoothly into wide 29cm flare
    const bellLength = 0.19;
    this.bellLipOffset = bellLength;
    const rRim = 0.145;
    const bellProfilePoints = [];
    const bellSegments = 32;

    for (let s = 0; s <= bellSegments; s++) {
      const t = s / bellSegments; // 0 to 1 along length
      // Exponential flare: gentle expansion in throat, dramatic flare at rim
      const r = rBranch + (rRim - rBranch) * Math.pow(t, 3.4);
      const y = t * bellLength;
      bellProfilePoints.push(new THREE.Vector2(r, y));
    }

    // Outer bell lathe geometry (double-sided reflective brass)
    const bellGeom = new THREE.LatheGeometry(bellProfilePoints, 40);
    const bellOuter = new THREE.Mesh(bellGeom, this.brassMaterial);
    bellFlareGroup.add(bellOuter);

    // Inner bell lining with warm darker gold for acoustic cavity depth
    const innerPoints = bellProfilePoints.map(p => new THREE.Vector2(Math.max(0.002, p.x - 0.0012), p.y));
    const bellInnerGeom = new THREE.LatheGeometry(innerPoints, 40);
    const bellInner = new THREE.Mesh(bellInnerGeom, this.innerBellMaterial);
    bellFlareGroup.add(bellInner);

    // Traditional rolled wire bead rim at the lip of the bell
    const rim = new THREE.Mesh(
      new THREE.TorusGeometry(rRim, 0.0045, 12, 40),
      this.brassMaterial
    );
    rim.position.y = bellLength;
    rim.rotation.x = Math.PI / 2;
    bellFlareGroup.add(rim);

    this.bellMesh = bellFlareGroup;
    horn.add(bellFlareGroup);

    this.group.add(horn);
  }

  _buildShockwaveRings() {
    for (let i = 0; i < 4; i++) {
      const ring = new THREE.Mesh(
        new THREE.RingGeometry(0.035, 0.065, 24),
        new THREE.MeshBasicMaterial({
          color: 0xffe680,
          transparent: true,
          opacity: 0,
          side: THREE.DoubleSide
        })
      );
      // RingGeometry faces local +Z. Rotate it so its normal follows the
      // bell's local +Y axis, then parent it to the bell itself. This keeps
      // the wave centered on the lip even while the horn recoils or rotates.
      ring.rotation.x = -Math.PI / 2;
      ring.position.set(0, this.bellLipOffset + 0.012, 0);
      this.bellMesh.add(ring);
      this.shockwaveRings.push(ring);
    }
  }

  onNoteOn(midiPitch, velocity = 0.8, eventTime = null, trackIndex = null, duration = 0.5) {
    const vel = Math.min(1.0, Math.max(0.2, velocity));
    this.airIntake?.start(vel);
    const pitchInOctave = midiPitch % 12;

    // Authentic French horn fingering simulation:
    // Lever 1, Lever 2, Lever 3
    const valveStates = [
      [0, 2, 5, 7, 10].includes(pitchInOctave),
      [1, 2, 6, 7, 11].includes(pitchInOctave),
      [3, 4, 8, 9, 10].includes(pitchInOctave)
    ];

    this.valves.forEach((v, idx) => {
      const isDown = valveStates[idx] || (idx === 0 && Math.random() > 0.4);
      const targetY = isDown ? v.baseY - 0.012 : v.baseY;

      gsap.killTweensOf(v.group.position);
      gsap.to(v.group.position, {
        y: targetY,
        duration: 0.04,
        ease: 'power2.out',
        onComplete: () => {
          gsap.to(v.group.position, {
            y: v.baseY,
            duration: 0.14,
            delay: 0.06,
            ease: 'power1.in'
          });
        }
      });
    });

    // Acoustic Recoil Kick on note attack
    if (this.hornBody) {
      gsap.killTweensOf(this.hornBody.position);
      gsap.killTweensOf(this.hornBody.rotation);

      gsap.to(this.hornBody.position, {
        x: -0.010 * vel,
        z: -0.008 * vel,
        y: 0.006 * vel,
        duration: 0.05,
        ease: 'power2.out',
        yoyo: true,
        repeat: 1
      });

      gsap.to(this.hornBody.rotation, {
        y: 0.018 * vel,
        duration: 0.06,
        ease: 'power2.out',
        yoyo: true,
        repeat: 1
      });
    }

    // Acoustic Shockwave Ring Emission from the wide bell
    const idleRing = this.shockwaveRings.find(r => r.material.opacity <= 0.05);
    if (idleRing && this.bellMesh) {
      const ringStartY = this.bellLipOffset + 0.012;
      idleRing.position.set(0, ringStartY, 0);
      idleRing.scale.set(1, 1, 1);
      idleRing.material.opacity = 0.80 * vel;

      gsap.killTweensOf(idleRing.position);
      gsap.killTweensOf(idleRing.scale);
      gsap.killTweensOf(idleRing.material);

      gsap.to(idleRing.position, {
        y: ringStartY + 0.48,
        duration: 0.58,
        ease: 'power1.out'
      });
      gsap.to(idleRing.scale, {
        x: 3.5,
        y: 3.5,
        z: 3.5,
        duration: 0.58,
        ease: 'power1.out'
      });
      gsap.to(idleRing.material, {
        opacity: 0,
        duration: 0.58,
        ease: 'power2.in'
      });
    }
  }

  onNoteOff(midiPitch, force = false) {
    this.airIntake?.stop();
    // Return valves smoothly
    this.valves.forEach(v => {
      gsap.to(v.group.position, {
        y: v.baseY,
        duration: 0.12,
        ease: 'power1.out'
      });
    });
  }

  update(delta) {
    this.airIntake?.update(delta);
    // Idle gentle orchestral stage breathing
    if (this.hornBody) {
      this.hornBody.rotation.x = Math.sin(Date.now() * 0.0016) * 0.010;
    }
  }
}
