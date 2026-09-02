import * as THREE from 'three';
import gsap from 'gsap';

/**
 * Xylophone3D: Concert Rosewood Marimba/Xylophone with:
 * - 28 tuned wooden bars arranged in lower diatonic and upper accidental tiers.
 * - Golden acoustic resonator tubes hanging beneath each bar.
 * - Autonomous Flying Mallets (Animusic / MIDIJam style):
 *   Twin rubber-headed mallets travel dynamically across the bars and strike!
 * - Velocity-reactive bar vibration and neon LED strike flash.
 */
export class Xylophone3D {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();
    // Positioned front-center stage
    this.group.position.set(0, 0.95, 1.6);
    this.group.rotation.set(0.04, 0, 0);

    this.bars = {};
    this.mallets = { left: null, right: null };
    this.malletDefaults = { left: null, right: null };
    this.lastMalletUsed = 'left';

    this._buildMaterials();
    this._buildFrameAndResonators();
    this._buildTunedBars();
    this._buildDualMallets();

    this.scene.add(this.group);
  }

  _buildMaterials() {
    // Polished Honduras Rosewood
    this.rosewoodMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x542312,
      emissive: 0x140502,
      roughness: 0.22,
      metalness: 0.1,
      clearcoat: 0.85
    });

    // Gold Brass Resonator Tubes
    this.goldTubeMaterial = new THREE.MeshStandardMaterial({
      color: 0xe6b835,
      roughness: 0.2,
      metalness: 0.9
    });

    // Birch Mallet Handle
    this.birchMaterial = new THREE.MeshStandardMaterial({
      color: 0xdfcbab,
      roughness: 0.4
    });

    // Rubber/Yarn Mallet Head
    this.malletHeadMaterial = new THREE.MeshStandardMaterial({
      color: 0x00f0ff,
      roughness: 0.35,
      emissive: 0x004466,
      emissiveIntensity: 0.6
    });

    this.frameMaterial = new THREE.MeshStandardMaterial({
      color: 0x1c1c20,
      roughness: 0.4
    });
  }

  _buildFrameAndResonators() {
    const frame = new THREE.Group();

    // Studio Stand Legs (4 black steel legs on casters)
    [[-0.55, -0.15], [0.55, -0.15], [-0.55, 0.15], [0.55, 0.15]].forEach(([lx, lz]) => {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.90, 8), this.frameMaterial);
      leg.position.set(lx, -0.45, lz);
      frame.add(leg);

      const caster = new THREE.Mesh(new THREE.SphereGeometry(0.024, 8, 8), this.frameMaterial);
      caster.position.set(lx, -0.90, lz);
      frame.add(caster);
    });

    // Horizontal rails
    [-0.14, 0.14].forEach(rz => {
      const rail = new THREE.Mesh(new THREE.BoxGeometry(1.25, 0.03, 0.025), this.frameMaterial);
      rail.position.set(0, -0.02, rz);
      frame.add(rail);
    });

    // Golden Resonator Tubes (Tapered lengths underneath)
    for (let i = 0; i < 18; i++) {
      const x = -0.52 + i * 0.062;
      const tubeLen = 0.38 - (i * 0.016); // Longer in bass, shorter in treble
      const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, tubeLen, 12), this.goldTubeMaterial);
      tube.position.set(x, -0.04 - (tubeLen / 2), 0.08);
      frame.add(tube);

      const upperTube = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, tubeLen * 0.85, 12), this.goldTubeMaterial);
      upperTube.position.set(x, -0.04 - (tubeLen * 0.85 / 2), -0.08);
      frame.add(upperTube);
    }

    this.group.add(frame);
  }

  _buildTunedBars() {
    // 2.5 Octaves: MIDI 60 (C4) to 88 (E6)
    const baseMidi = 60;
    const totalSemis = 28;

    let diatonicIdx = 0;
    let accidentalIdx = 0;

    for (let s = 0; s < totalSemis; s++) {
      const midi = baseMidi + s;
      const isBlack = [1, 3, 6, 8, 10].includes(midi % 12);

      // Bars taper in length from 0.28m (bass) to 0.16m (treble)
      const barLen = 0.28 - (s * 0.0042);
      const barWidth = 0.032;
      const barHeight = 0.016;

      const geom = new THREE.BoxGeometry(barWidth, barHeight, barLen);
      const mat = this.rosewoodMaterial.clone();
      const mesh = new THREE.Mesh(geom, mat);
      mesh.castShadow = true;

      let xPos, zPos;
      if (!isBlack) {
        // Lower diatonic tier (white keys equivalent)
        xPos = -0.52 + diatonicIdx * 0.065;
        zPos = 0.08;
        diatonicIdx++;
      } else {
        // Upper accidental tier (black keys equivalent)
        xPos = -0.49 + accidentalIdx * 0.065;
        zPos = -0.08;
        accidentalIdx++;
      }

      mesh.position.set(xPos, 0, zPos);
      this.group.add(mesh);

      this.bars[midi] = {
        mesh,
        material: mat,
        x: xPos,
        z: zPos,
        baseY: 0
      };
    }
  }

  _buildDualMallets() {
    ['left', 'right'].forEach(hand => {
      const pivot = new THREE.Group();

      // Flexible birch handle (length 38cm, angled pointing forward)
      const handleGeom = new THREE.CylinderGeometry(0.004, 0.005, 0.38, 8);
      handleGeom.rotateX(Math.PI / 2);
      const handle = new THREE.Mesh(handleGeom, this.birchMaterial);
      handle.position.z = 0.19;
      pivot.add(handle);

      // Cyan Rubber/Yarn Head
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.018, 12, 12), this.malletHeadMaterial);
      head.position.z = 0.38;
      pivot.add(head);

      const startX = hand === 'left' ? -0.22 : 0.22;
      pivot.position.set(startX, 0.18, 0.40);
      pivot.rotation.set(-0.25, hand === 'left' ? 0.2 : -0.2, 0);

      this.group.add(pivot);
      this.mallets[hand] = pivot;
      this.malletDefaults[hand] = {
        pos: pivot.position.clone(),
        rot: pivot.rotation.clone()
      };
    });
  }

  onNoteOn(midiPitch, velocity = 0.8) {
    const vel = Math.max(0.3, Math.min(1.0, velocity));

    // Clamp MIDI to available bars
    const clampedMidi = Math.max(60, Math.min(87, midiPitch));
    const bar = this.bars[clampedMidi] || Object.values(this.bars)[0];
    if (!bar) return;

    // Alternate left/right mallets
    const hand = this.lastMalletUsed === 'left' ? 'right' : 'left';
    this.lastMalletUsed = hand;

    const mallet = this.mallets[hand];
    const def = this.malletDefaults[hand];

    // 1. Autonomous Mallet Strike (Translates to bar and whips down onto bar)
    if (mallet) {
      gsap.killTweensOf(mallet.position);
      gsap.killTweensOf(mallet.rotation);

      gsap.timeline()
        .to(mallet.position, {
          x: bar.x,
          y: 0.03, // Downward hit right on top of bar
          z: bar.z + 0.36,
          duration: 0.045,
          ease: 'power3.in'
        })
        .to(mallet.rotation, {
          x: -0.42 * vel,
          duration: 0.045,
          ease: 'power3.in'
        }, 0)
        .to(mallet.position, {
          y: 0.18,
          duration: 0.08,
          ease: 'power1.out'
        })
        .to(mallet.position, {
          x: def.pos.x,
          z: def.pos.z,
          duration: 0.14,
          ease: 'sine.out'
        })
        .to(mallet.rotation, {
          x: def.rot.x,
          y: def.rot.y,
          z: def.rot.z,
          duration: 0.14,
          ease: 'sine.out'
        }, '-=0.14');
    }

    // 2. Bar Vibration & Neon Strike Glow
    gsap.killTweensOf(bar.mesh.position);
    gsap.timeline()
      .to(bar.mesh.position, { y: -0.012 * vel, duration: 0.035, ease: 'power2.out' })
      .to(bar.mesh.position, { y: 0.006 * vel, duration: 0.05, ease: 'sine.inOut' })
      .to(bar.mesh.position, { y: 0, duration: 0.08, ease: 'sine.out' });

    bar.material.emissive = new THREE.Color(0x00f0ff);
    bar.material.emissiveIntensity = 2.4 * vel;
    gsap.killTweensOf(bar.material);
    gsap.to(bar.material, {
      emissiveIntensity: 0,
      duration: 0.5,
      ease: 'power2.out'
    });
  }

  onNoteOff(midiPitch) {}

  update(delta) {}
}
