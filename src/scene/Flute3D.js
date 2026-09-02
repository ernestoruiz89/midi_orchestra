import * as THREE from 'three';
import gsap from 'gsap';

/**
 * Flute3D: Concert Grand Concert Flute with:
 * - Polished sterling silver body, headjoint, lip plate, and footjoint.
 * - 10 animated silver key cups with padded arms.
 * - Shimmering acoustic breath rings emitted on note-on.
 */
export class Flute3D {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();
    // Positioned front-right inner stage
    this.group.position.set(1.6, 1.30, 1.8);
    this.group.rotation.set(-0.04, -Math.PI * 0.12, -0.04);

    this.keys = [];
    this.breathRings = [];

    this._buildMaterials();
    this._buildStand();
    this._buildFluteBody();
    this._buildKeyCups();
    this._buildBreathRings();

    this.scene.add(this.group);
  }

  _buildMaterials() {
    this.silverMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xe6e8ea,
      roughness: 0.10,
      metalness: 0.96,
      clearcoat: 1.0,
      clearcoatRoughness: 0.05
    });

    this.goldPlateMaterial = new THREE.MeshStandardMaterial({
      color: 0xf5c33b,
      roughness: 0.15,
      metalness: 0.9
    });

    this.chromeStandMaterial = new THREE.MeshStandardMaterial({
      color: 0x999999,
      roughness: 0.25,
      metalness: 0.8
    });
  }

  _buildStand() {
    const stand = new THREE.Group();
    stand.position.set(0, -1.30, 0);

    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.20, 0.20, 0.03, 16), this.chromeStandMaterial);
    stand.add(base);

    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.010, 0.010, 1.28, 8), this.chromeStandMaterial);
    pole.position.y = 0.64;
    stand.add(pole);

    // Padded U-bracket holding flute underneath
    const cradle = new THREE.Mesh(new THREE.TorusGeometry(0.025, 0.008, 8, 12, Math.PI), this.chromeStandMaterial);
    cradle.position.y = 1.28;
    cradle.rotation.x = Math.PI / 2;
    stand.add(cradle);

    this.group.add(stand);
  }

  _buildFluteBody() {
    const bodyGroup = new THREE.Group();

    // Main Tube (Horizontal cylinder, length 0.67m, diameter 0.019m)
    const tubeGeom = new THREE.CylinderGeometry(0.0095, 0.0095, 0.67, 24);
    tubeGeom.rotateZ(Math.PI / 2);
    const tube = new THREE.Mesh(tubeGeom, this.silverMaterial);
    tube.castShadow = true;
    bodyGroup.add(tube);

    // Crown at headjoint left tip
    const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.011, 0.011, 0.018, 16), this.goldPlateMaterial);
    crown.rotation.z = Math.PI / 2;
    crown.position.set(-0.34, 0, 0);
    bodyGroup.add(crown);

    // Lip Plate & Embouchure Hole
    const lipPlate = new THREE.Mesh(new THREE.BoxGeometry(0.024, 0.005, 0.018), this.goldPlateMaterial);
    lipPlate.position.set(-0.25, 0.011, 0);
    bodyGroup.add(lipPlate);

    const hole = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.006, 12), new THREE.MeshBasicMaterial({ color: 0x111111 }));
    hole.position.set(-0.25, 0.013, 0);
    bodyGroup.add(hole);

    this.group.add(bodyGroup);
  }

  _buildKeyCups() {
    // 10 silver key cups spaced along middle and footjoint
    const startX = -0.15;
    const spacing = 0.042;

    for (let i = 0; i < 10; i++) {
      const x = startX + i * spacing;
      const keyGroup = new THREE.Group();
      keyGroup.position.set(x, 0.012, 0);

      const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.007, 0.007, 0.004, 12), this.silverMaterial);
      keyGroup.add(cup);

      const arm = new THREE.Mesh(new THREE.BoxGeometry(0.003, 0.004, 0.014), this.silverMaterial);
      arm.position.set(0, -0.002, 0.008);
      keyGroup.add(arm);

      this.group.add(keyGroup);
      this.keys.push({
        group: keyGroup,
        baseY: 0.012,
        index: i
      });
    }
  }

  _buildBreathRings() {
    for (let i = 0; i < 4; i++) {
      const geom = new THREE.RingGeometry(0.02, 0.05, 16);
      geom.rotateY(Math.PI / 2);
      const mat = new THREE.MeshBasicMaterial({
        color: 0x88ffff,
        transparent: true,
        opacity: 0,
        side: THREE.DoubleSide
      });
      const ring = new THREE.Mesh(geom, mat);
      ring.position.set(0.34, 0, 0);
      this.group.add(ring);
      this.breathRings.push(ring);
    }
  }

  onNoteOn(midiPitch, velocity = 0.8) {
    const vel = Math.max(0.3, Math.min(1.0, velocity));

    // 1. Depress Keys based on pitch
    const keyCount = (midiPitch % 10) + 1;
    this.keys.forEach((k, idx) => {
      const pressed = idx < keyCount;
      const targetY = pressed ? k.baseY - 0.006 : k.baseY;
      gsap.killTweensOf(k.group.position);
      gsap.to(k.group.position, {
        y: targetY,
        duration: 0.04,
        ease: 'power2.out'
      });
    });

    // 2. Breath Ring Emission from open end
    const ring = this.breathRings.find(r => r.material.opacity <= 0.05) || this.breathRings[0];
    if (ring) {
      ring.position.set(0.34, 0, 0);
      ring.scale.set(0.8, 0.8, 0.8);
      ring.material.opacity = 0.8 * vel;

      gsap.killTweensOf(ring.position);
      gsap.killTweensOf(ring.scale);
      gsap.killTweensOf(ring.material);

      gsap.to(ring.position, {
        x: 0.95,
        duration: 0.45,
        ease: 'power1.out'
      });
      gsap.to(ring.scale, {
        y: 2.8,
        z: 2.8,
        duration: 0.45,
        ease: 'power1.out'
      });
      gsap.to(ring.material, {
        opacity: 0,
        duration: 0.45,
        ease: 'power2.in'
      });
    }

    // 3. Silver Shimmer Flash
    this.silverMaterial.emissive = new THREE.Color(0x003344);
    this.silverMaterial.emissiveIntensity = 0.6 * vel;
    gsap.to(this.silverMaterial, {
      emissiveIntensity: 0,
      duration: 0.3
    });
  }

  onNoteOff(midiPitch) {
    this.keys.forEach(k => {
      gsap.to(k.group.position, {
        y: k.baseY,
        duration: 0.08,
        ease: 'power1.out'
      });
    });
  }

  update(delta) {}
}
