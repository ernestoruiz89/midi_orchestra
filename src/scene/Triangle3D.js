import * as THREE from 'three';
import gsap from 'gsap';

/**
 * Triangle3D: Professional Concert Orchestral Triangle with Dedicated Striker
 * - Solid forged stainless steel triangle with authentic open corner
 * - Suspended by clear nylon monofilament loop
 * - Dedicated solid steel striker (beater) with textured rubber grip
 * - Floating left wing elevated beside left crash/cymbal area
 * - Dynamic striking downstroke, pendulum wobble resonance, and crystalline sparkle bursts
 */
export class Triangle3D {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();

    // Floating left wing elevated beside left cymbals
    this.group.position.set(-1.05, 1.28, -0.28);
    this.group.rotation.set(0.15, 0.25, -0.06);

    this.triangleMesh = null;
    this.strikerPivot = null;
    this.sparkleParticles = [];

    this._buildMaterials();
    this._buildTriangle();
    this._buildStriker();
    this._buildParticles();

    this.scene.add(this.group);
  }

  _buildMaterials() {
    // 1. Mirror-polished resonant forged stainless steel
    this.steelMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xf2f5f8,
      roughness: 0.08,
      metalness: 0.98,
      clearcoat: 1.0,
      clearcoatRoughness: 0.02
    });

    // 2. Black rubber/molded striker grip
    this.gripMaterial = new THREE.MeshStandardMaterial({
      color: 0x181a1f,
      roughness: 0.85,
      metalness: 0.05
    });

    // 3. Braided hanging suspension cord
    this.cordMaterial = new THREE.MeshBasicMaterial({
      color: 0xdddddd
    });
  }

  _buildTriangle() {
    const triangleGroup = new THREE.Group();
    this.triangleMesh = triangleGroup;

    const sideLen = 0.20;
    const barRadius = 0.0055;
    const height = sideLen * (Math.sqrt(3) / 2); // ~0.173m

    // Top apex: (0, height / 2, 0)
    // Bottom left: (-sideLen / 2, -height / 2, 0)
    // Bottom right: (sideLen / 2, -height / 2, 0)

    // A. Left Bar (from bottom-left to top apex)
    const leftBarGeom = new THREE.CylinderGeometry(barRadius, barRadius, sideLen, 16);
    const leftBar = new THREE.Mesh(leftBarGeom, this.steelMaterial);
    leftBar.position.set(-sideLen / 4, 0, 0);
    leftBar.rotation.z = -Math.PI / 6; // 30 deg
    leftBar.castShadow = true;
    triangleGroup.add(leftBar);

    // B. Right Bar (from top apex towards bottom-right, leaving corner gap)
    const rightBarGeom = new THREE.CylinderGeometry(barRadius, barRadius, sideLen * 0.92, 16);
    const rightBar = new THREE.Mesh(rightBarGeom, this.steelMaterial);
    rightBar.position.set(sideLen / 4 - 0.006, 0.006, 0);
    rightBar.rotation.z = Math.PI / 6; // -30 deg
    rightBar.castShadow = true;
    triangleGroup.add(rightBar);

    // C. Bottom Horizontal Bar (with corner open gap at bottom-right)
    const bottomBarGeom = new THREE.CylinderGeometry(barRadius, barRadius, sideLen * 0.90, 16);
    const bottomBar = new THREE.Mesh(bottomBarGeom, this.steelMaterial);
    bottomBar.rotation.z = Math.PI / 2;
    bottomBar.position.set(-0.010, -height / 2, 0);
    bottomBar.castShadow = true;
    triangleGroup.add(bottomBar);

    // Rounded corner caps
    const cornerGeom = new THREE.SphereGeometry(barRadius, 14, 14);
    const topCorner = new THREE.Mesh(cornerGeom, this.steelMaterial);
    topCorner.position.set(0, height / 2, 0);
    triangleGroup.add(topCorner);

    const leftCorner = new THREE.Mesh(cornerGeom, this.steelMaterial);
    leftCorner.position.set(-sideLen / 2, -height / 2, 0);
    triangleGroup.add(leftCorner);

    // Open gap tip rounded cap
    const rightEndCap = new THREE.Mesh(cornerGeom, this.steelMaterial);
    rightEndCap.position.set(sideLen / 2 - 0.014, -height / 2 + 0.016, 0);
    triangleGroup.add(rightEndCap);

    // D. Hanging Loop (suspended cord from top apex)
    const cordGeom = new THREE.TorusGeometry(0.016, 0.0012, 6, 20);
    const cord = new THREE.Mesh(cordGeom, this.cordMaterial);
    cord.position.set(0, height / 2 + 0.015, 0);
    triangleGroup.add(cord);

    this.group.add(triangleGroup);
  }

  _buildStriker() {
    const pivot = new THREE.Group();
    this.strikerPivot = pivot;

    // Resting position: striker hovering in front of the right bar
    pivot.position.set(0.085, -0.02, 0.035);
    pivot.rotation.set(0.20, 0.15, -0.35);

    const strikerLength = 0.20;
    const rodGeom = new THREE.CylinderGeometry(0.0035, 0.0035, strikerLength, 12);
    const rod = new THREE.Mesh(rodGeom, this.steelMaterial);
    rod.castShadow = true;
    pivot.add(rod);

    // Rubber grip at handle
    const gripGeom = new THREE.CylinderGeometry(0.007, 0.007, 0.075, 14);
    const grip = new THREE.Mesh(gripGeom, this.gripMaterial);
    grip.position.y = -strikerLength / 2 + 0.038;
    pivot.add(grip);

    // Rounded striking tip
    const tipGeom = new THREE.SphereGeometry(0.006, 12, 12);
    const tip = new THREE.Mesh(tipGeom, this.steelMaterial);
    tip.position.y = strikerLength / 2;
    pivot.add(tip);

    this.group.add(pivot);
  }

  _buildParticles() {
    const pCount = 14;
    const pGeom = new THREE.SphereGeometry(0.003, 6, 6);
    const pMat = new THREE.MeshBasicMaterial({
      color: 0xe0f6ff,
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

  onNoteOn(midiPitch = 81, velocity = 0.8) {
    const vel = Math.max(0.2, Math.min(1.0, velocity));
    const isOpen = (midiPitch === 81 || midiPitch % 2 !== 0);

    if (this.strikerPivot && this.triangleMesh) {
      gsap.killTweensOf(this.strikerPivot.position);
      gsap.killTweensOf(this.strikerPivot.rotation);
      gsap.killTweensOf(this.triangleMesh.rotation);

      // 1. Striker swift accelerating downstroke into the steel bar
      gsap.timeline()
        .to(this.strikerPivot.position, {
          x: 0.05,
          z: 0.008,
          duration: 0.038,
          ease: 'power4.in'
        })
        .to(this.strikerPivot.rotation, {
          z: -0.15,
          duration: 0.038,
          ease: 'power4.in'
        }, '<')
        // 2. Elastic rebound
        .to(this.strikerPivot.position, {
          x: 0.10,
          z: 0.045,
          duration: 0.08,
          ease: 'power3.out'
        })
        .to(this.strikerPivot.rotation, {
          z: -0.45,
          duration: 0.08,
          ease: 'power3.out'
        }, '<')
        // 3. Settle into ready hover
        .to(this.strikerPivot.position, {
          x: 0.085,
          z: 0.035,
          duration: 0.18,
          ease: 'power2.out'
        })
        .to(this.strikerPivot.rotation, {
          z: -0.35,
          duration: 0.18,
          ease: 'power2.out'
        }, '<');

      // 2. Triangle pendulum wobble & crystalline resonance
      const swingDuration = isOpen ? 1.4 : 0.25;
      const wobble = 0.12 * vel;

      gsap.to(this.triangleMesh.rotation, {
        y: wobble,
        z: wobble * 0.5,
        duration: 0.08,
        yoyo: true,
        repeat: isOpen ? 7 : 1,
        ease: 'power1.inOut',
        onComplete: () => {
          gsap.to(this.triangleMesh.rotation, {
            y: 0,
            z: 0,
            duration: 0.2
          });
        }
      });
    }

    this._triggerSparkles(vel);
  }

  onNoteOff() {
    // Staccato auxiliary instrument
  }

  _triggerSparkles(vel) {
    this.sparkleParticles.forEach((p, idx) => {
      const angle = (idx / this.sparkleParticles.length) * Math.PI * 2 + Math.random() * 0.3;
      const r = 0.02 + Math.random() * 0.04;
      p.mesh.position.set(
        0.05 + Math.cos(angle) * r,
        -0.02 + (Math.random() - 0.5) * 0.03,
        0.01 + Math.sin(angle) * r
      );
      p.mesh.material.opacity = 0.95 * vel;
      p.mesh.visible = true;

      p.vel.set(
        Math.cos(angle) * (0.04 + Math.random() * 0.06),
        0.03 + Math.random() * 0.06,
        Math.sin(angle) * (0.04 + Math.random() * 0.06)
      );

      gsap.killTweensOf(p.mesh.material);
      gsap.to(p.mesh.material, {
        opacity: 0,
        duration: 0.38 + Math.random() * 0.15,
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
