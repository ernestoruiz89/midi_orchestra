import * as THREE from 'three';
import gsap from 'gsap';

/**
 * Tambourine3D: Professional Concert Studio Tambourine
 * - Steam-bent multi-ply maple hoop with carved ergonomic grip
 * - Dual row of 8 pairs of hammered chrome jingles (zils) on steel pins
 * - Natural translucent calfskin head with low-profile chrome counterhoop
 * - Floating beside the drum kit (hi-hat / left wing)
 * - Dynamic physical strike/shake animation, jingle oscillation, and sparkle bursts
 */
export class Tambourine3D {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();

    // Floating left wing alongside drum kit
    this.group.position.set(-1.15, 1.08, 0.10);
    this.group.rotation.set(0.32, 0.22, -0.18);

    this.tambourineModel = null;
    this.jingles = [];
    this.sparkleParticles = [];

    this._buildMaterials();
    this._buildTambourine();
    this._buildParticles();

    this.scene.add(this.group);
  }

  _buildMaterials() {
    // 1. Steam-bent polished blonde maple hardwood
    this.woodMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xd69f62,
      roughness: 0.26,
      metalness: 0.04,
      clearcoat: 0.70,
      clearcoatRoughness: 0.08
    });

    // 2. Mirror-polished hammered chrome jingles (zils)
    this.jingleMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xf0f4f8,
      roughness: 0.08,
      metalness: 0.98,
      clearcoat: 1.0,
      clearcoatRoughness: 0.02
    });

    // 3. Steel pins & tension hardware
    this.steelMaterial = new THREE.MeshStandardMaterial({
      color: 0xd0d4dc,
      roughness: 0.20,
      metalness: 0.90
    });

    // 4. Natural translucent calfskin head
    this.headMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xf4eee4,
      roughness: 0.45,
      metalness: 0.02,
      transmission: 0.35,
      opacity: 0.92,
      transparent: true
    });
  }

  _buildTambourine() {
    const root = new THREE.Group();
    this.tambourineModel = root;

    const radius = 0.14;
    const hoopHeight = 0.052;
    const hoopThickness = 0.009;

    // A. Main steam-bent wood hoop
    const hoopGeom = new THREE.CylinderGeometry(
      radius,
      radius,
      hoopHeight,
      48,
      1,
      true
    );
    const outerHoop = new THREE.Mesh(hoopGeom, this.woodMaterial);
    outerHoop.castShadow = true;
    outerHoop.receiveShadow = true;
    root.add(outerHoop);

    // Inner rim
    const innerHoopGeom = new THREE.CylinderGeometry(
      radius - hoopThickness,
      radius - hoopThickness,
      hoopHeight * 0.98,
      48,
      1,
      true
    );
    const innerHoop = new THREE.Mesh(innerHoopGeom, this.woodMaterial);
    root.add(innerHoop);

    // B. Natural calfskin head over top
    const headGeom = new THREE.CircleGeometry(radius - 0.002, 36);
    const head = new THREE.Mesh(headGeom, this.headMaterial);
    head.rotation.x = -Math.PI / 2;
    head.position.y = hoopHeight / 2;
    head.receiveShadow = true;
    root.add(head);

    // Head counterhoop rim (chrome band)
    const rimGeom = new THREE.TorusGeometry(radius + 0.002, 0.0035, 8, 48);
    const rim = new THREE.Mesh(rimGeom, this.steelMaterial);
    rim.rotation.x = Math.PI / 2;
    rim.position.y = hoopHeight / 2;
    rim.castShadow = true;
    root.add(rim);

    // C. 8 Jingles Slots around perimeter (leaving grip area at bottom/rear)
    const jingleSlots = 8;
    const slotAngleSpan = Math.PI * 1.55;
    const startAngle = Math.PI * 0.22;

    for (let i = 0; i < jingleSlots; i++) {
      const angle = startAngle + (i * slotAngleSpan) / (jingleSlots - 1);
      const slotGroup = new THREE.Group();
      slotGroup.rotation.y = angle;

      // Vertical steel pin
      const pinGeom = new THREE.CylinderGeometry(0.0018, 0.0018, hoopHeight * 0.72, 8);
      const pin = new THREE.Mesh(pinGeom, this.steelMaterial);
      pin.position.set(radius - hoopThickness / 2, 0, 0);
      slotGroup.add(pin);

      // Pair of jingles (top and bottom zil)
      [-0.009, 0.009].forEach(yOff => {
        const zilGeom = new THREE.CylinderGeometry(0.021, 0.017, 0.0016, 16);
        const zil = new THREE.Mesh(zilGeom, this.jingleMaterial);
        zil.position.set(radius - hoopThickness / 2, yOff, 0);
        zil.castShadow = true;
        slotGroup.add(zil);
        this.jingles.push({ mesh: zil, baseY: yOff, baseRot: 0 });
      });

      root.add(slotGroup);
    }

    // D. Ergonomic carved hand grip section at the open arc
    const gripRadius = radius - hoopThickness / 2;
    const gripGeom = new THREE.CylinderGeometry(0.012, 0.012, 0.065, 12);
    const grip = new THREE.Mesh(gripGeom, this.woodMaterial);
    grip.rotation.z = Math.PI / 2;
    grip.position.set(0, -0.005, -gripRadius);
    root.add(grip);

    this.group.add(root);
  }

  _buildParticles() {
    const pCount = 14;
    const pGeom = new THREE.SphereGeometry(0.004, 6, 6);
    const pMat = new THREE.MeshBasicMaterial({
      color: 0xfff2aa,
      transparent: true,
      opacity: 0
    });

    for (let i = 0; i < pCount; i++) {
      const p = new THREE.Mesh(pGeom, pMat.clone());
      p.visible = false;
      this.group.add(p);
      this.sparkleParticles.push({
        mesh: p,
        vel: new THREE.Vector3()
      });
    }
  }

  onNoteOn(midiPitch = 54, velocity = 0.8) {
    const vel = Math.max(0.2, Math.min(1.0, velocity));

    if (this.tambourineModel) {
      gsap.killTweensOf(this.tambourineModel.position);
      gsap.killTweensOf(this.tambourineModel.rotation);

      // Dynamic strike tilt & wrist shake
      const shakeAngle = 0.28 * vel;
      const strikeDip = 0.035 * vel;

      gsap.timeline()
        .to(this.tambourineModel.position, {
          y: -strikeDip,
          z: -strikeDip * 0.5,
          duration: 0.045,
          ease: 'power4.in'
        })
        .to(this.tambourineModel.rotation, {
          x: -shakeAngle * 0.8,
          z: shakeAngle,
          duration: 0.045,
          ease: 'power4.in'
        }, '<')
        .to(this.tambourineModel.position, {
          y: strikeDip * 0.7,
          z: strikeDip * 0.3,
          duration: 0.09,
          ease: 'power2.out'
        })
        .to(this.tambourineModel.rotation, {
          x: shakeAngle * 0.5,
          z: -shakeAngle * 0.6,
          duration: 0.09,
          ease: 'power2.out'
        }, '<')
        .to(this.tambourineModel.position, {
          y: 0,
          z: 0,
          duration: 0.22,
          ease: 'elastic.out(1.2, 0.4)'
        })
        .to(this.tambourineModel.rotation, {
          x: 0,
          z: 0,
          duration: 0.22,
          ease: 'elastic.out(1.2, 0.4)'
        }, '<');
    }

    // Jingles rattle animation
    this.jingles.forEach((j, idx) => {
      gsap.killTweensOf(j.mesh.position);
      gsap.killTweensOf(j.mesh.rotation);

      const offset = (Math.random() - 0.5) * 0.005 * vel;
      const rot = (Math.random() - 0.5) * 0.45 * vel;

      gsap.to(j.mesh.position, {
        y: j.baseY + offset,
        duration: 0.06,
        yoyo: true,
        repeat: 3,
        ease: 'power1.inOut'
      });
      gsap.to(j.mesh.rotation, {
        x: rot,
        y: rot,
        duration: 0.06,
        yoyo: true,
        repeat: 3,
        ease: 'power1.inOut'
      });
    });

    // Trigger bright sparkle burst from jingles
    this._triggerSparkles(vel);
  }

  onNoteOff() {
    // Staccato auxiliary instrument
  }

  _triggerSparkles(vel) {
    this.sparkleParticles.forEach((p, idx) => {
      const angle = (idx / this.sparkleParticles.length) * Math.PI * 2 + Math.random() * 0.3;
      const r = 0.14 + Math.random() * 0.04;
      p.mesh.position.set(
        Math.cos(angle) * r,
        (Math.random() - 0.5) * 0.03,
        Math.sin(angle) * r
      );
      p.mesh.material.opacity = 0.85 * vel;
      p.mesh.visible = true;

      p.vel.set(
        Math.cos(angle) * (0.04 + Math.random() * 0.06),
        0.04 + Math.random() * 0.06,
        Math.sin(angle) * (0.04 + Math.random() * 0.06)
      );

      gsap.killTweensOf(p.mesh.material);
      gsap.to(p.mesh.material, {
        opacity: 0,
        duration: 0.35 + Math.random() * 0.15,
        ease: 'power2.out',
        onComplete: () => {
          p.mesh.visible = false;
        }
      });
    });
  }

  update(delta) {
    this.sparkleParticles.forEach(p => {
      if (p.mesh.visible) {
        p.mesh.position.addScaledVector(p.vel, delta * 2.0);
      }
    });
  }
}
