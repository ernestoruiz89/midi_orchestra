import * as THREE from 'three';
import gsap from 'gsap';

/**
 * Trumpet3D builds a gleaming golden brass trumpet with 3 moving valve pistons,
 * realistic pitch fingering, bell acoustic recoil, and sonic shockwave rings.
 */
export class Trumpet3D {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();
    this.group.position.set(4.5, 1.5, 0.4);
    this.group.rotation.set(0.05, -Math.PI * 0.4, 0.05);

    this.valves = []; // 3 valve meshes
    this.bellMesh = null;
    this.shockwaveRings = [];

    this._buildMaterials();
    this._buildTrumpetStand();
    this._buildTrumpetBody();
    this._buildValves();
    this._buildShockwaveRings();

    this.scene.add(this.group);
  }

  _buildMaterials() {
    this.brassMaterial = new THREE.MeshStandardMaterial({
      color: 0xf5c33b, // Polished brass gold
      roughness: 0.15,
      metalness: 0.95
    });

    this.pearlMaterial = new THREE.MeshStandardMaterial({
      color: 0xfdfdfd,
      roughness: 0.3,
      metalness: 0.1
    });

    this.chromeMaterial = new THREE.MeshStandardMaterial({
      color: 0xcccccc,
      roughness: 0.1,
      metalness: 0.9
    });
  }

  _buildTrumpetStand() {
    const standGroup = new THREE.Group();
    standGroup.position.set(0, -1.5, 0);

    const baseCone = new THREE.Mesh(new THREE.ConeGeometry(0.35, 0.15, 16), this.chromeMaterial);
    standGroup.add(baseCone);

    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 1.4, 8), this.chromeMaterial);
    pole.position.y = 0.7;
    standGroup.add(pole);

    const cradle = new THREE.Mesh(new THREE.TorusGeometry(0.08, 0.015, 8, 16, Math.PI), this.chromeMaterial);
    cradle.position.y = 1.4;
    cradle.rotation.x = Math.PI / 2;
    standGroup.add(cradle);

    this.group.add(standGroup);
  }

  _buildTrumpetBody() {
    const bodyGroup = new THREE.Group();

    // Main Leadpipe (Cylinder running horizontally)
    const leadpipe = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 1.2, 16), this.brassMaterial);
    leadpipe.rotation.z = Math.PI / 2;
    leadpipe.position.set(-0.2, 0, 0);
    bodyGroup.add(leadpipe);

    // Mouthpiece
    const mouthpiece = new THREE.Mesh(new THREE.ConeGeometry(0.03, 0.12, 16), this.chromeMaterial);
    mouthpiece.rotation.z = -Math.PI / 2;
    mouthpiece.position.set(-0.85, 0, 0);
    bodyGroup.add(mouthpiece);

    // Tuning Slide Loop (Back U-turn)
    const slideTorus = new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.016, 12, 16, Math.PI), this.brassMaterial);
    slideTorus.rotation.y = Math.PI / 2;
    slideTorus.position.set(-0.7, 0.06, 0);
    bodyGroup.add(slideTorus);

    // Flared Trumpet Bell Pipe
    const bellPipe = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.05, 0.9, 20), this.brassMaterial);
    bellPipe.rotation.z = -Math.PI / 2;
    bellPipe.position.set(0.35, 0.12, 0);
    bodyGroup.add(bellPipe);

    // Flared Bell Flare Rim
    const bellFlareGeom = new THREE.ConeGeometry(0.24, 0.35, 32, 1, true);
    bellFlareGeom.rotateZ(Math.PI / 2);
    const bellFlare = new THREE.Mesh(bellFlareGeom, this.brassMaterial);
    bellFlare.position.set(0.9, 0.12, 0);
    bodyGroup.add(bellFlare);
    this.bellMesh = bellFlare;

    // Outer Rim Bead
    const bellRim = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.012, 12, 32), this.brassMaterial);
    bellRim.rotation.y = Math.PI / 2;
    bellRim.position.set(1.05, 0.12, 0);
    bodyGroup.add(bellRim);

    this.group.add(bodyGroup);
  }

  _buildValves() {
    const valveCasingGroup = new THREE.Group();
    valveCasingGroup.position.set(-0.05, 0.06, 0);

    for (let i = 0; i < 3; i++) {
      const vX = (i - 1) * 0.08;

      // Outer Casing
      const casing = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.032, 0.26, 16), this.brassMaterial);
      casing.position.set(vX, 0, 0);
      valveCasingGroup.add(casing);

      // Moving Piston Valve
      const pistonGroup = new THREE.Group();
      pistonGroup.position.set(vX, 0.12, 0);

      const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.16, 8), this.chromeMaterial);
      stem.position.y = 0.08;
      pistonGroup.add(stem);

      const button = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.015, 16), this.pearlMaterial);
      button.position.y = 0.16;
      pistonGroup.add(button);

      valveCasingGroup.add(pistonGroup);

      this.valves.push({
        group: pistonGroup,
        baseY: 0.12,
        isPressed: false
      });
    }

    this.group.add(valveCasingGroup);
  }

  _buildShockwaveRings() {
    for (let r = 0; r < 4; r++) {
      const ringGeom = new THREE.TorusGeometry(0.25, 0.02, 12, 24);
      ringGeom.rotateY(Math.PI / 2);

      const ringMat = new THREE.MeshBasicMaterial({
        color: 0xffd700,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending
      });

      const ring = new THREE.Mesh(ringGeom, ringMat);
      ring.position.set(1.1, 0.12, 0);
      this.group.add(ring);
      this.shockwaveRings.push(ring);
    }
  }

  // Trigger Note-On
  onNoteOn(midiPitch, velocity = 0.8) {
    const vel = Math.max(0.3, Math.min(1.0, velocity));

    // Get valve combination fingering (0 = open, 1 = pressed)
    const fingering = this._getTrumpetFingering(midiPitch);

    // Animate valve depressions
    this.valves.forEach((valve, idx) => {
      const pressed = fingering[idx] === 1;
      const targetY = pressed ? valve.baseY - 0.08 * vel : valve.baseY;

      gsap.killTweensOf(valve.group.position);
      gsap.to(valve.group.position, {
        y: targetY,
        duration: 0.04,
        ease: 'power2.out'
      });
    });

    // Bell Recoil & Glow
    if (this.bellMesh) {
      gsap.killTweensOf(this.bellMesh.scale);
      gsap.timeline()
        .to(this.bellMesh.scale, { x: 1.15, y: 1.15, z: 1.15, duration: 0.04, ease: 'power2.out' })
        .to(this.bellMesh.scale, { x: 1.0, y: 1.0, z: 1.0, duration: 0.15, ease: 'elastic.out(1, 0.3)' });
    }

    // Emit Sonic Shockwave Ring
    this._emitShockwave(vel);

    // Brass Emissive flash
    this.brassMaterial.emissive = new THREE.Color(0xffaa00);
    this.brassMaterial.emissiveIntensity = 0.6 * vel;
    gsap.to(this.brassMaterial, {
      emissiveIntensity: 0,
      duration: 0.25
    });
  }

  _emitShockwave(velocity) {
    const ring = this.shockwaveRings.find(r => r.material.opacity <= 0.05) || this.shockwaveRings[0];
    if (!ring) return;

    ring.position.set(1.1, 0.12, 0);
    ring.scale.set(0.8, 0.8, 0.8);
    ring.material.opacity = 0.9 * velocity;

    gsap.killTweensOf(ring.position);
    gsap.killTweensOf(ring.scale);
    gsap.killTweensOf(ring.material);

    gsap.to(ring.position, {
      x: 3.2,
      duration: 0.45,
      ease: 'power1.out'
    });

    gsap.to(ring.scale, {
      x: 3.5,
      y: 3.5,
      z: 3.5,
      duration: 0.45,
      ease: 'power1.out'
    });

    gsap.to(ring.material, {
      opacity: 0,
      duration: 0.45,
      ease: 'power2.in'
    });
  }

  _getTrumpetFingering(midiPitch) {
    // Standard chromatic brass trumpet fingering for pitches
    const semitone = midiPitch % 12;
    switch (semitone) {
      case 0: return [0, 0, 0]; // C (Open)
      case 1: return [1, 1, 1]; // C# (1-2-3)
      case 2: return [1, 0, 1]; // D (1-3)
      case 3: return [0, 1, 1]; // D# (2-3)
      case 4: return [1, 1, 0]; // E (1-2)
      case 5: return [1, 0, 0]; // F (1)
      case 6: return [0, 1, 0]; // F# (2)
      case 7: return [0, 0, 0]; // G (Open)
      case 8: return [0, 1, 1]; // G# (2-3)
      case 9: return [1, 1, 0]; // A (1-2)
      case 10: return [1, 0, 0]; // Bb (1)
      case 11: return [0, 1, 0]; // B (2)
      default: return [0, 0, 0];
    }
  }

  onNoteOff() {
    // Release all valves back up
    this.valves.forEach(valve => {
      gsap.killTweensOf(valve.group.position);
      gsap.to(valve.group.position, {
        y: valve.baseY,
        duration: 0.08,
        ease: 'power1.out'
      });
    });
  }
}
