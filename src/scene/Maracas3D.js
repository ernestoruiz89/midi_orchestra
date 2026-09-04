import * as THREE from 'three';
import gsap from 'gsap';

/**
 * Maracas3D: Professional Concert Latin Maracas Pair
 * - Left and Right matched pair of authentic Latin hardwood/gourd maracas
 * - Turned mahogany handles with brass ferrules and pommel caps
 * - Bulbous gourd heads with vibrant Latin folkloric lacquer stripes
 * - Floating on the right wing alongside the drum kit (floor toms side)
 * - Alternating left/right crisp wrist shake animation and golden sparkle bursts
 */
export class Maracas3D {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();

    // Floating right wing alongside drum kit (symmetrical to Cabasa)
    this.group.position.set(1.18, 1.05, 0.50);
    this.group.rotation.set(0.20, -0.18, 0.12);

    this.leftMaraca = null;
    this.rightMaraca = null;
    this.currentHand = 'left';
    this.sparkleParticles = [];

    this._buildMaterials();
    this._buildMaracas();
    this._buildParticles();

    this.scene.add(this.group);
  }

  _buildMaterials() {
    // 1. Polished turned mahogany handle
    this.handleMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x5c2414,
      roughness: 0.28,
      metalness: 0.04,
      clearcoat: 0.85,
      clearcoatRoughness: 0.06
    });

    // 2. Warm golden wood lacquer body
    this.bodyMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xdf9a38,
      roughness: 0.22,
      metalness: 0.08,
      clearcoat: 0.90,
      clearcoatRoughness: 0.05
    });

    // 3. Crimson stripe band
    this.redStripeMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xc42828,
      roughness: 0.20,
      metalness: 0.06,
      clearcoat: 0.85
    });

    // 4. Emerald green stripe band
    this.greenStripeMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x228b45,
      roughness: 0.20,
      metalness: 0.06,
      clearcoat: 0.85
    });

    // 5. Polished brass ferrule and pin
    this.brassMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xd4af37,
      roughness: 0.18,
      metalness: 0.92,
      clearcoat: 0.95
    });
  }

  _buildMaracas() {
    // Left Maraca
    this.leftMaraca = this._createSingleMaraca(-0.075, 0.08);
    this.group.add(this.leftMaraca.group);

    // Right Maraca
    this.rightMaraca = this._createSingleMaraca(0.075, -0.08);
    this.group.add(this.rightMaraca.group);
  }

  _createSingleMaraca(xPos, tiltZ) {
    const root = new THREE.Group();
    root.position.set(xPos, 0, 0);
    root.rotation.set(0, 0, tiltZ);

    // A. Turned wooden handle
    const handleLength = 0.16;
    const handleGeom = new THREE.CylinderGeometry(0.009, 0.013, handleLength, 16);
    const handle = new THREE.Mesh(handleGeom, this.handleMaterial);
    handle.position.y = -0.08;
    handle.castShadow = true;
    root.add(handle);

    // Pommel bulb at handle base
    const pommelGeom = new THREE.SphereGeometry(0.015, 16, 16);
    const pommel = new THREE.Mesh(pommelGeom, this.handleMaterial);
    pommel.position.y = -handleLength;
    pommel.scale.set(1.0, 1.25, 1.0);
    root.add(pommel);

    // Brass ferrule collar between handle and gourd head
    const ferruleGeom = new THREE.CylinderGeometry(0.014, 0.011, 0.018, 16);
    const ferrule = new THREE.Mesh(ferruleGeom, this.brassMaterial);
    ferrule.position.y = 0.005;
    root.add(ferrule);

    // B. Bulbous Maraca Head (Egg / Gourd shape)
    const headGroup = new THREE.Group();
    headGroup.position.y = 0.09;

    const gourdGeom = new THREE.SphereGeometry(0.052, 28, 24);
    const gourd = new THREE.Mesh(gourdGeom, this.bodyMaterial);
    gourd.scale.set(1.0, 1.42, 1.0);
    gourd.castShadow = true;
    headGroup.add(gourd);

    // Decorative equatorial color rings
    const redRingGeom = new THREE.TorusGeometry(0.0522, 0.004, 8, 28);
    const redRing = new THREE.Mesh(redRingGeom, this.redStripeMaterial);
    redRing.rotation.x = Math.PI / 2;
    redRing.position.y = 0.012;
    headGroup.add(redRing);

    const greenRingGeom = new THREE.TorusGeometry(0.0522, 0.004, 8, 28);
    const greenRing = new THREE.Mesh(greenRingGeom, this.greenStripeMaterial);
    greenRing.rotation.x = Math.PI / 2;
    greenRing.position.y = -0.012;
    headGroup.add(greenRing);

    // Brass top cap pin
    const topPinGeom = new THREE.CylinderGeometry(0.003, 0.003, 0.015, 8);
    const topPin = new THREE.Mesh(topPinGeom, this.brassMaterial);
    topPin.position.y = 0.052 * 1.42;
    headGroup.add(topPin);

    root.add(headGroup);

    return {
      group: root,
      head: headGroup,
      baseX: xPos,
      baseRotZ: tiltZ
    };
  }

  _buildParticles() {
    const pCount = 16;
    const pGeom = new THREE.SphereGeometry(0.0035, 6, 6);
    const pMat = new THREE.MeshBasicMaterial({
      color: 0xffdc68,
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

  onNoteOn(midiPitch = 70, velocity = 0.8) {
    const vel = Math.max(0.2, Math.min(1.0, velocity));

    // Alternate hands on continuous hits, or shake both on forte hits
    const activeMaraca = this.currentHand === 'left' ? this.leftMaraca : this.rightMaraca;
    this.currentHand = this.currentHand === 'left' ? 'right' : 'left';

    const sign = activeMaraca === this.leftMaraca ? -1 : 1;
    const shakeAngle = 0.32 * vel;
    const shakeY = 0.04 * vel;

    gsap.killTweensOf(activeMaraca.group.position);
    gsap.killTweensOf(activeMaraca.group.rotation);

    gsap.timeline()
      // 1. Sharp wrist flick upwards & forward
      .to(activeMaraca.group.position, {
        y: shakeY,
        z: -0.02 * vel,
        duration: 0.045,
        ease: 'power3.out'
      })
      .to(activeMaraca.group.rotation, {
        x: -shakeAngle * 0.7,
        z: activeMaraca.baseRotZ + sign * shakeAngle,
        duration: 0.045,
        ease: 'power3.out'
      }, '<')
      // 2. Sharp downward snap (beads impact internal wall)
      .to(activeMaraca.group.position, {
        y: -shakeY * 0.6,
        z: 0.015 * vel,
        duration: 0.06,
        ease: 'power4.in'
      })
      .to(activeMaraca.group.rotation, {
        x: shakeAngle * 0.4,
        z: activeMaraca.baseRotZ - sign * shakeAngle * 0.3,
        duration: 0.06,
        ease: 'power4.in'
      }, '<')
      // 3. Elastic settle into resting posture
      .to(activeMaraca.group.position, {
        x: activeMaraca.baseX,
        y: 0,
        z: 0,
        duration: 0.20,
        ease: 'elastic.out(1.2, 0.45)'
      })
      .to(activeMaraca.group.rotation, {
        x: 0,
        y: 0,
        z: activeMaraca.baseRotZ,
        duration: 0.20,
        ease: 'elastic.out(1.2, 0.45)'
      }, '<');

    // Scatter golden rattle sparkles from active maraca
    this._triggerSparkles(activeMaraca.baseX, vel);
  }

  onNoteOff() {
    // Staccato auxiliary instrument
  }

  _triggerSparkles(originX, vel) {
    this.sparkleParticles.forEach((p, idx) => {
      const angle = (idx / this.sparkleParticles.length) * Math.PI * 2 + Math.random() * 0.4;
      const r = 0.03 + Math.random() * 0.06;
      p.mesh.position.set(
        originX + Math.cos(angle) * r,
        0.09 + (Math.random() - 0.5) * 0.04,
        Math.sin(angle) * r
      );
      p.mesh.material.opacity = 0.9 * vel;
      p.mesh.visible = true;

      p.vel.set(
        Math.cos(angle) * (0.03 + Math.random() * 0.05),
        0.05 + Math.random() * 0.07,
        Math.sin(angle) * (0.03 + Math.random() * 0.05)
      );

      gsap.killTweensOf(p.mesh.material);
      gsap.to(p.mesh.material, {
        opacity: 0,
        duration: 0.32 + Math.random() * 0.12,
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
