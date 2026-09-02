import * as THREE from 'three';
import gsap from 'gsap';

/**
 * Saxophone3D: Photorealistic Tenor/Alto Saxophone with:
 * - Hand-hammered polished gold brass body and flared bell.
 * - S-curved neck (tudel) with ebonite mouthpiece, ligature, and cane reed.
 * - U-bow bottom bend with structural guard braces.
 * - 6 animated mother-of-pearl key cups that press down on note-on.
 * - Dynamic bell recoil and acoustic shockwave rings expanding outwards.
 */
export class Saxophone3D {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();
    // Positioned front-right stage (spaced from guitar and trumpet)
    this.group.position.set(3.8, 1.25, 1.4);
    this.group.rotation.set(0.08, -Math.PI * 0.22, 0.12);

    this.keyPads = [];
    this.bellMesh = null;
    this.shockwaveRings = [];

    this._buildMaterials();
    this._buildStand();
    this._buildSaxophoneBody();
    this._buildKeyMechanisms();
    this._buildShockwaveRings();

    this.scene.add(this.group);
  }

  _buildMaterials() {
    this.brassMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xf3c035, // Radiant gold brass
      roughness: 0.14,
      metalness: 0.94,
      clearcoat: 0.8,
      clearcoatRoughness: 0.08
    });

    this.pearlMaterial = new THREE.MeshStandardMaterial({
      color: 0xfffcf6,
      roughness: 0.25,
      metalness: 0.1
    });

    this.chromeMaterial = new THREE.MeshStandardMaterial({
      color: 0xcccccc,
      roughness: 0.15,
      metalness: 0.9
    });

    this.eboniteMaterial = new THREE.MeshStandardMaterial({
      color: 0x111113,
      roughness: 0.4,
      metalness: 0.1
    });

    this.reedMaterial = new THREE.MeshStandardMaterial({
      color: 0xdeb887,
      roughness: 0.6,
      metalness: 0.05
    });
  }

  _buildStand() {
    const standGroup = new THREE.Group();
    standGroup.position.set(0, -1.30, 0);

    const base = new THREE.Mesh(new THREE.ConeGeometry(0.32, 0.10, 16), this.chromeMaterial);
    standGroup.add(base);

    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 1.25, 8), this.chromeMaterial);
    pole.position.y = 0.62;
    standGroup.add(pole);

    const cradle = new THREE.Mesh(new THREE.TorusGeometry(0.09, 0.016, 8, 16, Math.PI), this.chromeMaterial);
    cradle.position.y = 1.22;
    cradle.rotation.x = Math.PI / 2;
    standGroup.add(cradle);

    this.group.add(standGroup);
  }

  _buildSaxophoneBody() {
    const bodyGroup = new THREE.Group();

    // 1. Conical Main Tube (Body tube running downwards)
    const mainBodyGeom = new THREE.CylinderGeometry(0.038, 0.065, 0.85, 20);
    const mainBody = new THREE.Mesh(mainBodyGeom, this.brassMaterial);
    mainBody.position.set(0, 0, 0);
    mainBody.castShadow = true;
    bodyGroup.add(mainBody);

    // 2. Lower U-Bow Bend (U-turn at bottom connecting body to bell)
    const bowGeom = new THREE.TorusGeometry(0.11, 0.042, 12, 24, Math.PI);
    const bowMesh = new THREE.Mesh(bowGeom, this.brassMaterial);
    bowMesh.rotation.y = Math.PI / 2;
    bowMesh.position.set(0, -0.42, 0.11);
    bowMesh.castShadow = true;
    bodyGroup.add(bowMesh);

    // 3. Upturned Bell Tube (Pointing up and forward)
    const bellTubeGeom = new THREE.CylinderGeometry(0.075, 0.045, 0.45, 20);
    const bellTube = new THREE.Mesh(bellTubeGeom, this.brassMaterial);
    bellTube.position.set(0, -0.22, 0.22);
    bellTube.rotation.x = 0.22;
    bellTube.castShadow = true;
    bodyGroup.add(bellTube);

    // 4. Flared Saxophone Bell Rim
    const bellRimGeom = new THREE.ConeGeometry(0.17, 0.22, 28, 1, true);
    bellRimGeom.rotateX(-Math.PI * 0.42);
    const bellRim = new THREE.Mesh(bellRimGeom, this.brassMaterial);
    bellRim.position.set(0, -0.05, 0.28);
    bellRim.castShadow = true;
    bodyGroup.add(bellRim);
    this.bellMesh = bellRim;

    // 5. Curved Neck (Tudel) at top
    const neckCurve = new THREE.TorusGeometry(0.09, 0.022, 10, 16, Math.PI * 0.55);
    const neckMesh = new THREE.Mesh(neckCurve, this.brassMaterial);
    neckMesh.position.set(0, 0.45, -0.05);
    neckMesh.rotation.z = Math.PI * 0.45;
    bodyGroup.add(neckMesh);

    // 6. Mouthpiece & Reed
    const mpMesh = new THREE.Mesh(new THREE.ConeGeometry(0.022, 0.09, 12), this.eboniteMaterial);
    mpMesh.rotation.x = -Math.PI * 0.45;
    mpMesh.position.set(0, 0.52, -0.14);
    bodyGroup.add(mpMesh);

    // Brass Ligature Ring
    const lig = new THREE.Mesh(new THREE.CylinderGeometry(0.023, 0.023, 0.028, 12), this.brassMaterial);
    lig.rotation.x = -Math.PI * 0.45;
    lig.position.set(0, 0.51, -0.13);
    bodyGroup.add(lig);

    this.group.add(bodyGroup);
  }

  _buildKeyMechanisms() {
    // 6 pearl key cups down the front of the body
    const keyYPositions = [0.28, 0.20, 0.12, -0.04, -0.12, -0.20];

    keyYPositions.forEach((y, idx) => {
      const keyGroup = new THREE.Group();
      keyGroup.position.set(0.045, y, -0.02);

      // Pearl button
      const pearl = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.006, 12), this.pearlMaterial);
      pearl.rotation.z = Math.PI / 2;
      keyGroup.add(pearl);

      // Brass key cup
      const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.008, 12), this.brassMaterial);
      cup.rotation.z = Math.PI / 2;
      cup.position.x = -0.005;
      keyGroup.add(cup);

      this.group.add(keyGroup);
      this.keyPads.push({
        group: keyGroup,
        baseX: keyGroup.position.x,
        index: idx
      });
    });
  }

  _buildShockwaveRings() {
    for (let i = 0; i < 4; i++) {
      const geom = new THREE.RingGeometry(0.08, 0.13, 24);
      geom.rotateX(-Math.PI * 0.42);
      const mat = new THREE.MeshBasicMaterial({
        color: 0xffcc00,
        transparent: true,
        opacity: 0,
        side: THREE.DoubleSide
      });
      const ring = new THREE.Mesh(geom, mat);
      ring.position.set(0, -0.05, 0.28);
      this.group.add(ring);
      this.shockwaveRings.push(ring);
    }
  }

  onNoteOn(midiPitch, velocity = 0.8) {
    const vel = Math.max(0.3, Math.min(1.0, velocity));

    // 1. Animate Key Pads depression
    const pressedKeys = (midiPitch % 6) + 1;
    this.keyPads.forEach((k, idx) => {
      const pressed = idx < pressedKeys;
      const targetX = pressed ? k.baseX - 0.015 : k.baseX;
      gsap.killTweensOf(k.group.position);
      gsap.to(k.group.position, {
        x: targetX,
        duration: 0.05,
        ease: 'power2.out'
      });
    });

    // 2. Bell Recoil
    if (this.bellMesh) {
      gsap.killTweensOf(this.bellMesh.scale);
      gsap.timeline()
        .to(this.bellMesh.scale, { x: 1.14, y: 1.14, z: 1.14, duration: 0.04, ease: 'power2.out' })
        .to(this.bellMesh.scale, { x: 1.0, y: 1.0, z: 1.0, duration: 0.18, ease: 'elastic.out(1, 0.4)' });
    }

    // 3. Acoustic Sonic Shockwave Ring
    this._emitShockwave(vel);

    // 4. Brass Body Flash
    this.brassMaterial.emissive = new THREE.Color(0xaa7700);
    this.brassMaterial.emissiveIntensity = 0.6 * vel;
    gsap.to(this.brassMaterial, {
      emissiveIntensity: 0,
      duration: 0.3
    });
  }

  onNoteOff(midiPitch) {
    // Release keys back to unpressed
    this.keyPads.forEach(k => {
      gsap.to(k.group.position, {
        x: k.baseX,
        duration: 0.1,
        ease: 'power1.out'
      });
    });
  }

  _emitShockwave(velocity) {
    const ring = this.shockwaveRings.find(r => r.material.opacity <= 0.05) || this.shockwaveRings[0];
    if (!ring) return;

    ring.position.set(0, -0.05, 0.28);
    ring.scale.set(0.6, 0.6, 0.6);
    ring.material.opacity = 0.85 * velocity;

    gsap.killTweensOf(ring.position);
    gsap.killTweensOf(ring.scale);
    gsap.killTweensOf(ring.material);

    gsap.to(ring.position, {
      y: 0.35,
      z: 1.10,
      duration: 0.45,
      ease: 'power1.out'
    });
    gsap.to(ring.scale, {
      x: 3.2,
      y: 3.2,
      z: 3.2,
      duration: 0.45,
      ease: 'power1.out'
    });
    gsap.to(ring.material, {
      opacity: 0,
      duration: 0.45,
      ease: 'power2.in'
    });
  }

  update(delta) {}
}
