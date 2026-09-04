import * as THREE from 'three';
import gsap from 'gsap';

/**
 * Clarinet3D: Professional Concert Bb Clarinet (Boehm System)
 * - Premium African Blackwood / Grenadilla body with satin wood sheen
 * - 5 authentic sections: Mouthpiece, Barrel, Upper Joint, Lower Joint, and Flared Bell
 * - Polished silver-plated Boehm keywork (rings, rods, posts, pads, trill levers)
 * - Gold brass ligature with adjustment screws and natural cane reed
 * - Concert floor stand with velvet-cushioned cradle
 * - Pitch-sensitive key depression engine and acoustic bell resonance
 */
export class Clarinet3D {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();

    // Positioned in the woodwind section (stage right, adjacent to flute and sax)
    this.group.position.set(2.4, 1.25, 2.2);
    // Stand tripod sits flat on stage floor, rotated to face conductor / audience
    this.group.rotation.set(0, Math.PI * 0.12, 0);

    this.keys = [];
    this.clarinetBody = null;
    this.bellMesh = null;
    this.resonanceRings = [];

    this._buildMaterials();
    this._buildStand();
    this._buildClarinet();
    this._buildResonanceRings();

    this.scene.add(this.group);
  }

  _buildMaterials() {
    // Dense African Blackwood / Grenadilla with subtle dark woodgrain sheen
    this.woodMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x1a1816,
      roughness: 0.35,
      metalness: 0.08,
      clearcoat: 0.30,
      clearcoatRoughness: 0.15
    });

    // Mirror-polished Silver Plating (Boehm keys, rings, posts, rods)
    this.silverMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xf2f4f8,
      roughness: 0.10,
      metalness: 0.95,
      clearcoat: 0.92,
      clearcoatRoughness: 0.05
    });

    // Polished Gold Brass (Ligature, ligature screws)
    this.goldMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xedba32,
      roughness: 0.16,
      metalness: 0.88,
      clearcoat: 0.85
    });

    // Black Ebonite / Hard Rubber (Mouthpiece)
    this.eboniteMaterial = new THREE.MeshStandardMaterial({
      color: 0x0a0a0c,
      roughness: 0.22,
      metalness: 0.10
    });

    // Natural Cane Reed
    this.reedMaterial = new THREE.MeshStandardMaterial({
      color: 0xddc085,
      roughness: 0.55,
      metalness: 0.02
    });

    // White leather key pads
    this.padMaterial = new THREE.MeshStandardMaterial({
      color: 0xfffaf0,
      roughness: 0.65,
      metalness: 0.02
    });

    // Stand materials: Heavy studio cast chrome base matching flute and violin
    this.chromeMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xe8ecf2,
      roughness: 0.12,
      metalness: 0.95,
      clearcoat: 0.90,
      clearcoatRoughness: 0.05
    });

    this.standMaterial = new THREE.MeshStandardMaterial({
      color: 0x18181c,
      roughness: 0.85,
      metalness: 0.05
    });
  }

  _buildStand() {
    const stand = new THREE.Group();
    stand.position.set(0, -1.25, 0);

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
    lowerPole.position.y = 0.35;
    stand.add(lowerPole);

    const collar = new THREE.Mesh(
      new THREE.CylinderGeometry(0.020, 0.020, 0.040, 16),
      this.chromeMaterial
    );
    collar.position.y = 0.675;
    stand.add(collar);

    const upperPole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.009, 0.009, 0.50, 14),
      this.chromeMaterial
    );
    upperPole.position.y = 0.925;
    stand.add(upperPole);

    // Mast top swivel collar
    const topCollar = new THREE.Mesh(
      new THREE.CylinderGeometry(0.016, 0.016, 0.035, 14),
      this.chromeMaterial
    );
    topCollar.position.y = 1.08;
    stand.add(topCollar);

    // Tightening adjustment screw
    const screw = new THREE.Mesh(
      new THREE.CylinderGeometry(0.005, 0.005, 0.024, 10).rotateZ(Math.PI / 2),
      this.chromeMaterial
    );
    screw.position.set(0.016, 1.08, 0);
    stand.add(screw);

    // Angled support neck extending forward to cradle clarinet at 37° angle
    const supportArm = new THREE.Mesh(
      new THREE.CylinderGeometry(0.007, 0.007, 0.13, 12),
      this.chromeMaterial
    );
    supportArm.position.set(0, 1.12, 0.046);
    supportArm.rotation.x = -0.80;
    stand.add(supportArm);

    // Velvet-padded U-cradle supporting lower joint
    const cradleGroup = new THREE.Group();
    cradleGroup.position.set(0, 1.154, 0.093);
    cradleGroup.rotation.x = -0.65;

    const cradle = new THREE.Mesh(
      new THREE.TorusGeometry(0.026, 0.006, 8, 20, Math.PI),
      this.standMaterial
    );
    cradle.rotation.z = Math.PI; // U-shape cupping upwards
    cradleGroup.add(cradle);

    // Protective chrome tips on cradle ends
    for (const side of [-1, 1]) {
      const tip = new THREE.Mesh(
        new THREE.SphereGeometry(0.007, 10, 10),
        this.chromeMaterial
      );
      tip.position.set(side * 0.026, 0, 0);
      cradleGroup.add(tip);
    }
    stand.add(cradleGroup);

    // Lower bell brace bracket
    const lowerBrace = new THREE.Mesh(
      new THREE.CylinderGeometry(0.006, 0.006, 0.14, 12),
      this.chromeMaterial
    );
    lowerBrace.position.set(0, 1.025, 0.08);
    lowerBrace.rotation.x = -1.05;
    stand.add(lowerBrace);

    const bellCushion = new THREE.Mesh(
      new THREE.CylinderGeometry(0.018, 0.018, 0.012, 16),
      this.standMaterial
    );
    bellCushion.position.set(0, 1.055, 0.138);
    bellCushion.rotation.x = -0.65;
    stand.add(bellCushion);

    this.group.add(stand);
  }

  _buildClarinet() {
    const cl = new THREE.Group();
    this.clarinetBody = cl;
    // Angled forward at ~37° in natural playing posture (mouthpiece up/back, bell down/forward)
    cl.position.set(0, 0, 0.02);
    cl.rotation.x = -0.65;

    const rTube = 0.0145; // ~29mm outer diameter
    let currY = -0.32;

    // 1. Flared Bell (Campana) at the bottom
    const bellHeight = 0.115;
    const bellGroup = new THREE.Group();
    bellGroup.position.y = currY + bellHeight / 2;

    // Tapered expanding bell cone
    const bellMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(rTube * 1.02, 0.039, bellHeight, 28),
      this.woodMaterial
    );
    bellGroup.add(bellMesh);

    // Inner bell cavity
    const bellInner = new THREE.Mesh(
      new THREE.CylinderGeometry(rTube * 0.75, 0.035, bellHeight * 0.98, 24),
      this.woodMaterial
    );
    bellGroup.add(bellInner);

    // Bottom silver rim band
    const bellRing = new THREE.Mesh(
      new THREE.CylinderGeometry(0.040, 0.040, 0.012, 28),
      this.silverMaterial
    );
    bellRing.position.y = -bellHeight / 2 + 0.006;
    bellGroup.add(bellRing);

    this.bellMesh = bellGroup;
    cl.add(bellGroup);
    currY += bellHeight;

    // Joint ring between bell and lower joint
    const ring1 = new THREE.Mesh(
      new THREE.CylinderGeometry(rTube * 1.08, rTube * 1.08, 0.008, 24),
      this.silverMaterial
    );
    ring1.position.y = currY + 0.004;
    cl.add(ring1);
    currY += 0.008;

    // 2. Lower Joint (Corps du Bas)
    const lowerJointHeight = 0.225;
    const lowerJoint = new THREE.Mesh(
      new THREE.CylinderGeometry(rTube, rTube, lowerJointHeight, 28),
      this.woodMaterial
    );
    lowerJoint.position.y = currY + lowerJointHeight / 2;
    cl.add(lowerJoint);
    currY += lowerJointHeight;

    // Joint ring between lower and upper joints
    const ring2 = new THREE.Mesh(
      new THREE.CylinderGeometry(rTube * 1.08, rTube * 1.08, 0.008, 24),
      this.silverMaterial
    );
    ring2.position.y = currY + 0.004;
    cl.add(ring2);
    currY += 0.008;

    // 3. Upper Joint (Corps du Haut)
    const upperJointHeight = 0.215;
    const upperJoint = new THREE.Mesh(
      new THREE.CylinderGeometry(rTube, rTube, upperJointHeight, 28),
      this.woodMaterial
    );
    upperJoint.position.y = currY + upperJointHeight / 2;
    cl.add(upperJoint);
    currY += upperJointHeight;

    // Joint ring between upper joint and barrel
    const ring3 = new THREE.Mesh(
      new THREE.CylinderGeometry(rTube * 1.09, rTube * 1.09, 0.008, 24),
      this.silverMaterial
    );
    ring3.position.y = currY + 0.004;
    cl.add(ring3);
    currY += 0.008;

    // 4. Barrel (Barrilete)
    const barrelHeight = 0.065;
    const barrel = new THREE.Mesh(
      new THREE.CylinderGeometry(rTube * 1.05, rTube * 1.05, barrelHeight, 26),
      this.woodMaterial
    );
    barrel.position.y = currY + barrelHeight / 2;
    cl.add(barrel);
    currY += barrelHeight;

    // Top barrel ring
    const ring4 = new THREE.Mesh(
      new THREE.CylinderGeometry(rTube * 1.09, rTube * 1.09, 0.008, 24),
      this.silverMaterial
    );
    ring4.position.y = currY + 0.004;
    cl.add(ring4);
    currY += 0.008;

    // 5. Mouthpiece (Bec), Ligature & Reed
    const mpHeight = 0.088;
    const mp = new THREE.Mesh(
      new THREE.CylinderGeometry(rTube * 0.85, rTube, mpHeight, 24),
      this.eboniteMaterial
    );
    mp.position.y = currY + mpHeight / 2;
    cl.add(mp);

    // Beveled wedge beak on front/top of mouthpiece
    const beak = new THREE.Mesh(
      new THREE.CylinderGeometry(0.004, rTube * 0.85, 0.035, 16),
      this.eboniteMaterial
    );
    beak.position.set(0, currY + mpHeight - 0.015, -0.003);
    beak.rotation.x = -0.22;
    cl.add(beak);

    // Natural cane reed on flat back face
    const reed = new THREE.Mesh(
      new THREE.BoxGeometry(0.011, mpHeight * 0.72, 0.0025),
      this.reedMaterial
    );
    reed.position.set(0, currY + mpHeight * 0.44, rTube * 0.88);
    cl.add(reed);

    // Gold brass ligature collar
    const ligature = new THREE.Mesh(
      new THREE.CylinderGeometry(rTube * 1.06, rTube * 1.08, 0.026, 20),
      this.goldMaterial
    );
    ligature.position.y = currY + 0.028;
    cl.add(ligature);

    // Ligature adjustment screws
    for (let s = 0; s < 2; s++) {
      const screw = new THREE.Mesh(
        new THREE.CylinderGeometry(0.003, 0.003, 0.009, 10).rotateZ(Math.PI / 2),
        this.goldMaterial
      );
      screw.position.set(rTube * 1.10, currY + 0.020 + s * 0.012, 0);
      cl.add(screw);
    }

    // 6. Silver Boehm Keywork Mechanism (Rods, Posts & Animated Key Cups)
    this._buildKeywork(cl, rTube);

    this.group.add(cl);
  }

  _buildKeywork(parent, rTube) {
    const keyPositions = [
      // Upper Joint Keys (Left hand): Tone holes and keys
      { id: 'key_LH1', y: 0.28, z: rTube + 0.004, scale: 0.012 },
      { id: 'key_LH2', y: 0.24, z: rTube + 0.004, scale: 0.012 },
      { id: 'key_LH3', y: 0.20, z: rTube + 0.004, scale: 0.012 },
      { id: 'key_trill1', y: 0.26, z: rTube + 0.003, x: 0.012, scale: 0.009 },
      { id: 'key_trill2', y: 0.22, z: rTube + 0.003, x: 0.012, scale: 0.009 },

      // Lower Joint Keys (Right hand)
      { id: 'key_RH1', y: 0.08, z: rTube + 0.004, scale: 0.012 },
      { id: 'key_RH2', y: 0.04, z: rTube + 0.004, scale: 0.012 },
      { id: 'key_RH3', y: 0.00, z: rTube + 0.004, scale: 0.012 },
      { id: 'key_pinky1', y: -0.05, z: rTube + 0.003, x: 0.014, scale: 0.011 },
      { id: 'key_pinky2', y: -0.09, z: rTube + 0.003, x: -0.014, scale: 0.011 }
    ];

    // Longitudinal silver axle rods running along the body
    for (let r = 0; r < 2; r++) {
      const rodX = (r === 0 ? 1 : -1) * (rTube + 0.003);
      const rod = new THREE.Mesh(
        new THREE.CylinderGeometry(0.0018, 0.0018, 0.44, 10),
        this.silverMaterial
      );
      rod.position.set(rodX, 0.12, 0.002);
      parent.add(rod);

      // Support posts mounting rods into the wood
      for (let p = 0; p < 5; p++) {
        const post = new THREE.Mesh(
          new THREE.CylinderGeometry(0.0022, 0.0022, 0.007, 8).rotateZ(Math.PI / 2),
          this.silverMaterial
        );
        post.position.set(rodX * 0.9, -0.08 + p * 0.10, 0.002);
        parent.add(post);
      }
    }

    // Animated Key Cups with finger rings and pads
    keyPositions.forEach((k) => {
      const keyGroup = new THREE.Group();
      const posX = k.x || 0;
      keyGroup.position.set(posX, k.y, k.z);

      // Circular key cup
      const cup = new THREE.Mesh(
        new THREE.CylinderGeometry(k.scale, k.scale, 0.003, 16).rotateX(Math.PI / 2),
        this.silverMaterial
      );
      keyGroup.add(cup);

      // White leather cushion pad underneath
      const pad = new THREE.Mesh(
        new THREE.CylinderGeometry(k.scale * 0.90, k.scale * 0.90, 0.002, 14).rotateX(Math.PI / 2),
        this.padMaterial
      );
      pad.position.z = -0.002;
      keyGroup.add(pad);

      // Open finger ring for primary tone holes
      if (k.id.includes('LH') || k.id.includes('RH')) {
        const ring = new THREE.Mesh(
          new THREE.TorusGeometry(k.scale * 0.65, 0.0016, 8, 16),
          this.silverMaterial
        );
        ring.position.z = 0.0025;
        keyGroup.add(ring);
      }

      parent.add(keyGroup);
      this.keys.push({
        id: k.id,
        group: keyGroup,
        baseZ: k.z,
        baseRotX: 0
      });
    });
  }

  _buildResonanceRings() {
    for (let i = 0; i < 4; i++) {
      const ring = new THREE.Mesh(
        new THREE.RingGeometry(0.02, 0.048, 20),
        new THREE.MeshBasicMaterial({
          color: 0x99e6ff,
          transparent: true,
          opacity: 0,
          side: THREE.DoubleSide
        })
      );
      ring.position.set(0, -0.32, 0);
      ring.rotation.x = Math.PI / 2;
      this.clarinetBody.add(ring);
      this.resonanceRings.push(ring);
    }
  }

  onNoteOn(midiPitch, velocity = 0.8, eventTime = null, trackIndex = null, duration = 0.5) {
    const vel = Math.min(1.0, Math.max(0.2, velocity));
    const pitchInOctave = midiPitch % 12;

    // Authentic woodwind fingering: higher notes open more tone holes, lower notes close them
    // E.g. lower pitches depress more lower keys
    const lowerDepressed = midiPitch < 65;
    const midDepressed = midiPitch < 72;

    this.keys.forEach((k, idx) => {
      let isDown = false;
      if (idx < 3) isDown = true; // Top keys usually pressed
      else if (idx < 6) isDown = midDepressed || (pitchInOctave % 2 === 0);
      else isDown = lowerDepressed || (pitchInOctave > 4);

      const targetZ = isDown ? k.baseZ - 0.004 : k.baseZ;

      gsap.killTweensOf(k.group.position);
      gsap.to(k.group.position, {
        z: targetZ,
        duration: 0.04,
        ease: 'power2.out',
        onComplete: () => {
          gsap.to(k.group.position, {
            z: k.baseZ,
            duration: 0.12,
            delay: 0.06,
            ease: 'power1.in'
          });
        }
      });
    });

    // Soft acoustic resonance emission from bell
    const idleRing = this.resonanceRings.find(r => r.material.opacity <= 0.05);
    if (idleRing && this.bellMesh) {
      idleRing.position.set(0, -0.32, 0);
      idleRing.scale.set(1, 1, 1);
      idleRing.material.opacity = 0.75 * vel;

      gsap.killTweensOf(idleRing.position);
      gsap.killTweensOf(idleRing.scale);
      gsap.killTweensOf(idleRing.material);

      gsap.to(idleRing.position, {
        y: -0.58,
        duration: 0.50,
        ease: 'power1.out'
      });
      gsap.to(idleRing.scale, {
        x: 2.8,
        y: 2.8,
        z: 2.8,
        duration: 0.50,
        ease: 'power1.out'
      });
      gsap.to(idleRing.material, {
        opacity: 0,
        duration: 0.50,
        ease: 'power2.in'
      });
    }
  }

  onNoteOff(midiPitch, force = false) {
    this.keys.forEach(k => {
      gsap.to(k.group.position, {
        z: k.baseZ,
        duration: 0.10,
        ease: 'power1.out'
      });
    });
  }

  update(delta) {
    // Gentle idle concert stage sway
    if (this.clarinetBody) {
      this.clarinetBody.rotation.z = Math.sin(Date.now() * 0.0018) * 0.008;
    }
  }
}
