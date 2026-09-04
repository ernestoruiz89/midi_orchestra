import * as THREE from 'three';
import gsap from 'gsap';

/**
 * Whistle3D: Professional Concert Tri-Tone Samba Whistle (Apito de Samba)
 * - Nickel-plated brass cylindrical body with beveled mouthpiece fipple
 * - Dual side finger holes for authentic 3-tone samba calls
 * - Top chrome lanyard suspension ring
 * - Floating on the right wing elevated near the percussion set
 * - Dynamic blast recoil animation and expanding acoustic soundwave ring effects
 */
export class Whistle3D {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();

    // Floating right wing elevated beside right percussion / cymbals
    this.group.position.set(1.05, 1.25, -0.30);
    this.group.rotation.set(0.18, -0.28, 0.08);

    this.whistleBody = null;
    this.soundRings = [];

    this._buildMaterials();
    this._buildWhistle();
    this._buildSoundRings();

    this.scene.add(this.group);
  }

  _buildMaterials() {
    // 1. Mirror-polished nickel/chrome brass body
    this.nickelMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xe8ecf2,
      roughness: 0.10,
      metalness: 0.98,
      clearcoat: 1.0,
      clearcoatRoughness: 0.03
    });

    // 2. Brass accent rings & sound lip
    this.brassMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xd6b248,
      roughness: 0.20,
      metalness: 0.92,
      clearcoat: 0.85
    });

    // 3. Dark fipple / window cavity interior
    this.darkInteriorMaterial = new THREE.MeshBasicMaterial({
      color: 0x0a0c10
    });

    // 4. Acoustic soundwave ring material (cyan/white neon glow)
    this.soundRingMaterial = new THREE.MeshBasicMaterial({
      color: 0x70e4ff,
      transparent: true,
      opacity: 0,
      wireframe: true
    });
  }

  _buildWhistle() {
    const root = new THREE.Group();
    this.whistleBody = root;

    // A. Main barrel chamber
    const barrelRadius = 0.016;
    const barrelLength = 0.075;
    const barrelGeom = new THREE.CylinderGeometry(barrelRadius, barrelRadius, barrelLength, 24);
    const barrel = new THREE.Mesh(barrelGeom, this.nickelMaterial);
    barrel.rotation.z = Math.PI / 2;
    barrel.castShadow = true;
    root.add(barrel);

    // Decorative brass bands on barrel
    [-0.02, 0.02].forEach(bx => {
      const bandGeom = new THREE.TorusGeometry(barrelRadius + 0.001, 0.002, 8, 24);
      const band = new THREE.Mesh(bandGeom, this.brassMaterial);
      band.rotation.y = Math.PI / 2;
      band.position.x = bx;
      root.add(band);
    });

    // B. Mouthpiece / Fipple windway tube (at rear / -X)
    const mouthRadius = 0.011;
    const mouthLength = 0.045;
    const mouthGeom = new THREE.CylinderGeometry(mouthRadius, mouthRadius, mouthLength, 20);
    const mouth = new THREE.Mesh(mouthGeom, this.nickelMaterial);
    mouth.rotation.z = Math.PI / 2;
    mouth.position.x = -barrelLength / 2 - mouthLength / 2;
    mouth.castShadow = true;
    root.add(mouth);

    // Beveled fipple window opening on top of windway
    const windowGeom = new THREE.BoxGeometry(0.014, 0.008, 0.016);
    const windowSlot = new THREE.Mesh(windowGeom, this.darkInteriorMaterial);
    windowSlot.position.set(-barrelLength / 2 + 0.004, barrelRadius * 0.85, 0);
    root.add(windowSlot);

    // Sharp brass splitting labium edge
    const edgeGeom = new THREE.BoxGeometry(0.003, 0.005, 0.018);
    const edge = new THREE.Mesh(edgeGeom, this.brassMaterial);
    edge.position.set(-barrelLength / 2 + 0.011, barrelRadius * 0.92, 0);
    root.add(edge);

    // C. Flared front acoustic bell (at front / +X)
    const bellGeom = new THREE.CylinderGeometry(barrelRadius * 1.35, barrelRadius, 0.022, 24, 1, true);
    const bell = new THREE.Mesh(bellGeom, this.nickelMaterial);
    bell.rotation.z = -Math.PI / 2;
    bell.position.x = barrelLength / 2 + 0.011;
    root.add(bell);

    // D. Dual side tone finger holes (apito 3-tone stops)
    [-barrelRadius, barrelRadius].forEach(zPos => {
      const toneHoleGeom = new THREE.CylinderGeometry(0.004, 0.004, 0.006, 12);
      const toneHole = new THREE.Mesh(toneHoleGeom, this.darkInteriorMaterial);
      toneHole.rotation.x = Math.PI / 2;
      toneHole.position.set(0, 0, zPos);
      root.add(toneHole);
    });

    // E. Top chrome suspension ring / lanyard eyelet
    const eyeletGeom = new THREE.TorusGeometry(0.008, 0.002, 8, 18);
    const eyelet = new THREE.Mesh(eyeletGeom, this.nickelMaterial);
    eyelet.position.set(-0.015, barrelRadius + 0.007, 0);
    root.add(eyelet);

    this.group.add(root);
  }

  _buildSoundRings() {
    const ringCount = 5;
    for (let i = 0; i < ringCount; i++) {
      const ringGeom = new THREE.TorusGeometry(0.02, 0.0018, 6, 24);
      const ring = new THREE.Mesh(ringGeom, this.soundRingMaterial.clone());
      ring.rotation.y = Math.PI / 2;
      ring.position.x = 0.05;
      ring.visible = false;
      this.group.add(ring);

      this.soundRings.push({
        mesh: ring,
        scale: 1,
        active: false
      });
    }
  }

  onNoteOn(midiPitch = 71, velocity = 0.8) {
    const vel = Math.max(0.2, Math.min(1.0, velocity));
    const isLong = (midiPitch === 72 || midiPitch % 2 === 0);

    if (this.whistleBody) {
      gsap.killTweensOf(this.whistleBody.position);
      gsap.killTweensOf(this.whistleBody.rotation);

      // Sharp air pressure blast recoil (backwards along -X)
      const recoilDist = 0.035 * vel;
      const recoilTilt = 0.22 * vel;

      gsap.timeline()
        .to(this.whistleBody.position, {
          x: -recoilDist,
          y: 0.015 * vel,
          duration: 0.04,
          ease: 'power3.out'
        })
        .to(this.whistleBody.rotation, {
          z: recoilTilt,
          duration: 0.04,
          ease: 'power3.out'
        }, '<')
        .to(this.whistleBody.position, {
          x: 0,
          y: 0,
          duration: isLong ? 0.35 : 0.18,
          ease: 'elastic.out(1.2, 0.45)'
        })
        .to(this.whistleBody.rotation, {
          z: 0,
          duration: isLong ? 0.35 : 0.18,
          ease: 'elastic.out(1.2, 0.45)'
        }, '<');
    }

    // Trigger acoustic soundwave rings expanding from whistle mouth
    this._triggerSoundWaves(vel, isLong);
  }

  onNoteOff() {
    // Auxiliary percussion staccato
  }

  _triggerSoundWaves(vel, isLong) {
    const ringsToFire = isLong ? this.soundRings.length : 2;

    for (let i = 0; i < ringsToFire; i++) {
      const r = this.soundRings[i];
      if (!r) continue;

      r.mesh.visible = true;
      r.mesh.position.x = 0.05;
      r.mesh.scale.set(0.5, 0.5, 0.5);
      r.mesh.material.opacity = 0.95 * vel;

      gsap.killTweensOf(r.mesh.position);
      gsap.killTweensOf(r.mesh.scale);
      gsap.killTweensOf(r.mesh.material);

      const delay = i * (isLong ? 0.07 : 0.05);

      gsap.timeline({ delay })
        .to(r.mesh.position, {
          x: 0.28,
          duration: 0.42,
          ease: 'power2.out'
        })
        .to(r.mesh.scale, {
          x: 4.5,
          y: 4.5,
          z: 4.5,
          duration: 0.42,
          ease: 'power2.out'
        }, '<')
        .to(r.mesh.material, {
          opacity: 0,
          duration: 0.42,
          ease: 'power2.out',
          onComplete: () => {
            r.mesh.visible = false;
          }
        }, '<');
    }
  }

  update(delta) {
    // Soundwaves managed by GSAP timelines
  }
}
