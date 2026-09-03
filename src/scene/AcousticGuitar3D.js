import * as THREE from 'three';
import gsap from 'gsap';

/**
 * AcousticGuitar3D is a compact steel-string acoustic guitar for the MIDI
 * stage.  The model is intentionally built from simple, warm materials so it
 * remains readable beside the larger drum kit while still showing the details
 * that identify an acoustic guitar: spruce top, dark sides, rosette, bridge,
 * pickguard, six strings and a slotted headstock.
 */
export class AcousticGuitar3D {
  constructor(scene, options = {}) {
    this.scene = scene;
    this.index = options.index || 1;
    this.group = new THREE.Group();
    this.guitarModel = new THREE.Group();
    this.strings = [];
    this.fretYPositions = [];
    this.stringTuningMidi = [40, 45, 50, 55, 59, 64];
    this.strumDir = 1;

    this._buildMaterials();
    this._buildBody();
    this._buildNeckAndHeadstock();
    this._buildHardware();
    this._buildStrings();
    this._buildFretMarkers();
    this._buildPick();

    // Same across-the-body playing orientation as the electric guitar, with
    // the spruce top tilted toward the audience.
    this.guitarModel.rotation.set(-0.25, 0.08, -1.35);
    this.group.add(this.guitarModel);
    this.scene.add(this.group);
  }

  _buildMaterials() {
    const variants = [0xe4ae72, 0xd79554, 0xc98a4b, 0xe9bd80];
    this.topMaterial = new THREE.MeshStandardMaterial({
      color: variants[(this.index - 1) % variants.length],
      roughness: 0.55,
      metalness: 0.0
    });
    this.edgeMaterial = new THREE.MeshStandardMaterial({
      color: 0x3a1c12,
      roughness: 0.72,
      metalness: 0.02
    });
    this.backMaterial = new THREE.MeshStandardMaterial({
      color: 0x6b321b,
      roughness: 0.68,
      metalness: 0.0
    });
    this.fretboardMaterial = new THREE.MeshStandardMaterial({
      color: 0x24130f,
      roughness: 0.86,
      metalness: 0.0
    });
    this.neckMaterial = new THREE.MeshStandardMaterial({
      color: 0xb87843,
      roughness: 0.63,
      metalness: 0.0
    });
    this.creamMaterial = new THREE.MeshStandardMaterial({
      color: 0xf2e1b7,
      roughness: 0.38,
      metalness: 0.02
    });
    this.rosetteMaterial = new THREE.MeshStandardMaterial({
      color: 0x6d2a14,
      roughness: 0.46,
      metalness: 0.06
    });
    this.blackMaterial = new THREE.MeshStandardMaterial({
      color: 0x161015,
      roughness: 0.48,
      metalness: 0.05
    });
    this.chromeMaterial = new THREE.MeshStandardMaterial({
      color: 0xd8dce6,
      roughness: 0.16,
      metalness: 0.9
    });
    this.stringMaterial = new THREE.MeshStandardMaterial({
      color: 0xf3e8d1,
      roughness: 0.17,
      metalness: 0.84,
      emissive: 0x000000,
      emissiveIntensity: 0
    });
    this.pickMaterial = new THREE.MeshStandardMaterial({
      color: 0xc43f22,
      roughness: 0.28,
      metalness: 0.08
    });
  }

  _bodyShape() {
    const shape = new THREE.Shape();
    shape.moveTo(0, -0.43);
    shape.bezierCurveTo(0.16, -0.43, 0.25, -0.33, 0.24, -0.20);
    shape.bezierCurveTo(0.23, -0.10, 0.15, -0.06, 0.145, 0.02);
    shape.bezierCurveTo(0.14, 0.08, 0.20, 0.14, 0.17, 0.23);
    shape.bezierCurveTo(0.14, 0.31, 0.055, 0.34, 0.04, 0.25);
    shape.lineTo(0.034, 0.15);
    shape.lineTo(-0.034, 0.15);
    shape.bezierCurveTo(-0.055, 0.34, -0.14, 0.31, -0.17, 0.23);
    shape.bezierCurveTo(-0.20, 0.14, -0.14, 0.08, -0.145, 0.02);
    shape.bezierCurveTo(-0.15, -0.06, -0.23, -0.10, -0.24, -0.20);
    shape.bezierCurveTo(-0.25, -0.33, -0.16, -0.43, 0, -0.43);
    return shape;
  }

  _buildBody() {
    const shape = this._bodyShape();
    const body = new THREE.Mesh(new THREE.ExtrudeGeometry(shape, {
      depth: 0.075,
      bevelEnabled: true,
      bevelSegments: 3,
      bevelSize: 0.012,
      bevelThickness: 0.012
    }), this.edgeMaterial);
    body.position.z = -0.045;
    body.castShadow = true;
    body.receiveShadow = true;
    this.guitarModel.add(body);

    // Thin spruce soundboard inset from the dark sides/back.
    const top = new THREE.Mesh(new THREE.ExtrudeGeometry(shape, {
      depth: 0.010,
      bevelEnabled: true,
      bevelSegments: 2,
      bevelSize: 0.004,
      bevelThickness: 0.002
    }), this.topMaterial);
    top.position.z = 0.032;
    top.scale.set(0.965, 0.965, 1);
    top.castShadow = true;
    this.guitarModel.add(top);

    const back = new THREE.Mesh(new THREE.ExtrudeGeometry(shape, { depth: 0.012, bevelEnabled: false }), this.backMaterial);
    back.position.z = -0.060;
    back.scale.set(0.965, 0.965, 1);
    this.guitarModel.add(back);

    // A subtle bridge-side grain pattern gives the top a more natural finish.
    for (let i = -2; i <= 2; i++) {
      const grain = new THREE.Mesh(
        new THREE.BoxGeometry(0.004, 0.46, 0.001),
        new THREE.MeshBasicMaterial({ color: 0x9a5a32, transparent: true, opacity: 0.14 })
      );
      grain.position.set(i * 0.045, -0.08, 0.044);
      grain.rotation.z = (i % 2) * 0.035;
      this.guitarModel.add(grain);
    }
  }

  _buildNeckAndHeadstock() {
    const neckStartY = 0.14;
    const nutY = 0.64;
    const neckLength = nutY - neckStartY;
    const neckBack = new THREE.Mesh(new THREE.BoxGeometry(0.060, neckLength, 0.028), this.neckMaterial);
    neckBack.position.set(0, (neckStartY + nutY) * 0.5, -0.010);
    neckBack.castShadow = true;
    this.guitarModel.add(neckBack);

    const fretboard = new THREE.Mesh(new THREE.BoxGeometry(0.067, neckLength, 0.008), this.fretboardMaterial);
    fretboard.position.set(0, (neckStartY + nutY) * 0.5, 0.017);
    this.guitarModel.add(fretboard);

    const fretWireMaterial = new THREE.MeshStandardMaterial({ color: 0xc9c6bd, roughness: 0.26, metalness: 0.8 });
    this.fretYPositions[0] = nutY;
    for (let fret = 1; fret <= 20; fret++) {
      const distance = 0.46 * (1 - Math.pow(2, -fret / 12));
      const y = nutY - distance;
      this.fretYPositions[fret] = y;
      const wire = new THREE.Mesh(new THREE.BoxGeometry(0.068, 0.0025, 0.003), fretWireMaterial);
      wire.position.set(0, y, 0.022);
      this.guitarModel.add(wire);
    }

    [3, 5, 7, 9, 12, 15, 17, 19].forEach(fret => {
      const y = (this.fretYPositions[fret - 1] + this.fretYPositions[fret]) * 0.5;
      const dot = new THREE.Mesh(new THREE.CircleGeometry(0.005, 14), this.creamMaterial);
      dot.position.set(fret === 12 ? 0.016 : 0, y, 0.024);
      this.guitarModel.add(dot);
    });

    const nut = new THREE.Mesh(new THREE.BoxGeometry(0.070, 0.009, 0.010), this.creamMaterial);
    nut.position.set(0, nutY, 0.022);
    this.guitarModel.add(nut);

    // Slotted headstock with 3 + 3 machine heads, as on the reference photo.
    const headShape = new THREE.Shape();
    headShape.moveTo(-0.034, 0);
    headShape.lineTo(-0.044, 0.17);
    headShape.bezierCurveTo(-0.035, 0.23, 0.035, 0.23, 0.044, 0.17);
    headShape.lineTo(0.034, 0);
    headShape.closePath();
    const head = new THREE.Mesh(new THREE.ExtrudeGeometry(headShape, { depth: 0.030, bevelEnabled: true, bevelSize: 0.004, bevelThickness: 0.003 }), this.neckMaterial);
    head.position.set(0, nutY, -0.010);
    this.guitarModel.add(head);

    [-1, 1].forEach(side => {
      for (let i = 0; i < 3; i++) {
        const y = nutY + 0.045 + i * 0.050;
        const post = new THREE.Mesh(new THREE.CylinderGeometry(0.003, 0.003, 0.025, 10), this.chromeMaterial);
        post.rotation.x = Math.PI / 2;
        post.position.set(side * 0.040, y, 0.010);
        this.guitarModel.add(post);
        const key = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.010, 0.006), this.chromeMaterial);
        key.position.set(side * 0.053, y, 0.010);
        this.guitarModel.add(key);
      }
    });
  }

  _buildHardware() {
    // Soundhole and decorative rosette.
    const soundhole = new THREE.Mesh(new THREE.CircleGeometry(0.092, 40), this.blackMaterial);
    soundhole.position.set(0, -0.045, 0.049);
    this.guitarModel.add(soundhole);
    [0.105, 0.118].forEach((radius, index) => {
      const ring = new THREE.Mesh(new THREE.RingGeometry(radius - 0.004, radius, 40), index === 0 ? this.rosetteMaterial : this.creamMaterial);
      ring.position.set(0, -0.045, 0.051 + index * 0.001);
      this.guitarModel.add(ring);
    });

    // Black teardrop pickguard on the treble side of the soundhole.
    const pickguard = new THREE.Mesh(new THREE.CircleGeometry(0.105, 32), this.blackMaterial);
    pickguard.position.set(0.105, -0.075, 0.050);
    pickguard.scale.set(0.62, 1.26, 1);
    this.guitarModel.add(pickguard);

    const bridge = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.034, 0.012), this.blackMaterial);
    bridge.position.set(0, -0.285, 0.050);
    this.guitarModel.add(bridge);
    const saddle = new THREE.Mesh(new THREE.BoxGeometry(0.098, 0.006, 0.006), this.creamMaterial);
    saddle.position.set(0, -0.285, 0.059);
    this.guitarModel.add(saddle);
    for (let pin = 0; pin < 6; pin++) {
      const pinMesh = new THREE.Mesh(new THREE.SphereGeometry(0.005, 10, 8), this.creamMaterial);
      pinMesh.position.set(-0.041 + pin * 0.0165, -0.298, 0.059);
      this.guitarModel.add(pinMesh);
    }
  }

  _buildStrings() {
    const bridgeY = -0.285;
    const nutY = 0.64;
    const length = nutY - bridgeY;
    const gauges = [0.0034, 0.0028, 0.0023, 0.0017, 0.00135, 0.0011];
    for (let s = 0; s < 6; s++) {
      const bridgeX = -0.042 + s * 0.0165;
      const nutX = -0.026 + s * 0.0105;
      const midX = (bridgeX + nutX) * 0.5;
      const angle = Math.atan2(nutX - bridgeX, length);
      const mesh = new THREE.Mesh(new THREE.CylinderGeometry(gauges[s], gauges[s], length, 8), this.stringMaterial.clone());
      mesh.position.set(midX, (bridgeY + nutY) * 0.5, 0.063);
      mesh.rotation.z = -angle;
      this.guitarModel.add(mesh);
      this.strings.push({ mesh, material: mesh.material, baseZ: 0.063, vibrationAmp: 0, vibrationSpeed: 42 + s * 11, phase: Math.random() * Math.PI * 2 });
    }
  }

  _buildFretMarkers() {
    // The electric guitar uses a small amber “finger press” on the fret. Use
    // the same visual language here, positioned just above the acoustic
    // fretboard so the note's fingering is easy to follow.
    this.fretMarkers = [];
    for (let stringIndex = 0; stringIndex < 6; stringIndex++) {
      const group = new THREE.Group();
      group.visible = false;

      const padMaterial = new THREE.MeshStandardMaterial({
        color: 0xffb300,
        emissive: 0xff8c00,
        emissiveIntensity: 1.8,
        transparent: true,
        opacity: 0.82
      });
      const pad = new THREE.Mesh(new THREE.BoxGeometry(0.016, 0.020, 0.004), padMaterial);
      group.add(pad);

      const jewelMaterial = new THREE.MeshStandardMaterial({
        color: 0xffeb63,
        emissive: 0xffc400,
        emissiveIntensity: 3.0,
        roughness: 0.15,
        metalness: 0.55
      });
      const jewel = new THREE.Mesh(new THREE.SphereGeometry(0.008, 14, 10), jewelMaterial);
      jewel.scale.set(1.0, 1.35, 0.62);
      jewel.position.z = 0.006;
      group.add(jewel);

      const haloMaterial = new THREE.MeshBasicMaterial({
        color: 0xffdf33,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0
      });
      const halo = new THREE.Mesh(new THREE.RingGeometry(0.010, 0.021, 24), haloMaterial);
      halo.position.z = 0.007;
      group.add(halo);

      group.position.z = 0.028;
      this.guitarModel.add(group);
      this.fretMarkers.push({ group, pad, jewel, halo });
    }
  }

  _getStringXAtY(index, y) {
    const t = (y + 0.285) / (0.64 + 0.285);
    return (-0.042 + index * 0.0165) + t * ((-0.026 + index * 0.0105) - (-0.042 + index * 0.0165));
  }

  _buildPick() {
    const group = new THREE.Group();
    group.position.set(0, -0.12, 0.074);
    const shape = new THREE.Shape();
    shape.moveTo(0, -0.020);
    shape.bezierCurveTo(0.016, -0.006, 0.015, 0.012, 0, 0.020);
    shape.bezierCurveTo(-0.015, 0.012, -0.016, -0.006, 0, -0.020);
    const mesh = new THREE.Mesh(new THREE.ExtrudeGeometry(shape, { depth: 0.002, bevelEnabled: false }), this.pickMaterial);
    mesh.rotation.z = 0.12;
    group.add(mesh);
    this.pickGroup = group;
    this.guitarModel.add(group);
  }

  onNoteOn(midiPitch, velocity = 0.8) {
    const vel = Math.max(0.25, Math.min(1, velocity));
    let stringIndex = 0;
    let fret = 0;
    let smallestDistance = Infinity;
    // Prefer the lowest possible fret, as a guitarist would, instead of
    // always choosing the nearest open-string pitch.
    for (let i = 5; i >= 0; i--) {
      const candidateFret = midiPitch - this.stringTuningMidi[i];
      if (candidateFret >= 0 && candidateFret <= 20 && candidateFret < smallestDistance) {
        smallestDistance = candidateFret;
        stringIndex = i;
        fret = candidateFret;
      }
    }

    const marker = this.fretMarkers?.[stringIndex];
    if (marker && fret > 0 && this.fretYPositions[fret] !== undefined) {
      const fretY = (this.fretYPositions[fret - 1] + this.fretYPositions[fret]) * 0.5;
      const fretX = this._getStringXAtY(stringIndex, fretY);
      marker.group.position.x = fretX;
      marker.group.position.y = fretY;
      marker.group.visible = true;
      marker.group.scale.set(1.8, 1.8, 1.8);
      marker.pad.material.emissiveIntensity = 1.6 * vel;
      marker.jewel.material.emissiveIntensity = 2.8 * vel;
      marker.halo.material.opacity = 0.75 * vel;
      gsap.killTweensOf(marker.group.scale);
      gsap.killTweensOf(marker.pad.material);
      gsap.killTweensOf(marker.jewel.material);
      gsap.killTweensOf(marker.halo.material);
      gsap.to(marker.group.scale, { x: 1, y: 1, z: 1, duration: 0.14, ease: 'back.out(2.6)' });
      gsap.timeline()
        .to(marker.jewel.material, { emissiveIntensity: 1.25 * vel, duration: 0.26 })
        .to(marker.jewel.material, { emissiveIntensity: 0, duration: 0.42, ease: 'power2.out' });
      gsap.to(marker.pad.material, { emissiveIntensity: 0, duration: 0.68, ease: 'power2.out' });
      gsap.to(marker.halo.material, {
        opacity: 0,
        duration: 0.68,
        ease: 'power2.out',
        onComplete: () => { marker.group.visible = false; }
      });
    }

    if (this.pickGroup) {
      const x = this._getStringXAtY(stringIndex, -0.12);
      this.strumDir = -this.strumDir;
      gsap.killTweensOf(this.pickGroup.position);
      gsap.killTweensOf(this.pickGroup.rotation);
      gsap.timeline()
        .to(this.pickGroup.position, { x, y: -0.12 + this.strumDir * 0.014, z: 0.063, duration: 0.045, ease: 'power2.in' })
        .to(this.pickGroup.rotation, { z: this.strumDir * 0.42, duration: 0.045, ease: 'power2.in' }, 0)
        .to(this.pickGroup.position, { y: -0.12, z: 0.074, duration: 0.16, ease: 'power1.out' })
        .to(this.pickGroup.rotation, { z: 0, duration: 0.16, ease: 'power1.out' }, '-=0.16');
    }

    const string = this.strings[stringIndex];
    if (string) {
      string.material.emissive.setHex(0xffd36a);
      string.material.emissiveIntensity = 1.7 * vel;
      string.vibrationAmp = 0.012 * vel;
      gsap.killTweensOf(string);
      gsap.killTweensOf(string.material);
      gsap.to(string, { vibrationAmp: 0, duration: 0.65, ease: 'power2.out' });
      gsap.to(string.material, { emissiveIntensity: 0, duration: 0.65, ease: 'power2.out' });
    }
  }

  onNotePrepare() {}
  onNoteOff() {}

  update(delta) {
    this.strings.forEach(string => {
      if (string.vibrationAmp > 0.0001) {
        string.phase += string.vibrationSpeed * delta;
        string.mesh.position.z = string.baseZ + Math.sin(string.phase) * string.vibrationAmp;
      } else {
        string.mesh.position.z = string.baseZ;
      }
    });
  }
}
