import * as THREE from 'three';
import gsap from 'gsap';

/**
 * Violin3D: Photorealistic Classical Concert Violin with:
 * - Flamed maple carved body, F-holes, bridge, tailpiece, chinrest, and scroll.
 * - 4 high-definition metallic strings (G3, D4, A4, E5).
 * - Autonomous Flying Violin Bow (Animusic / MIDIJam style):
 *   Transfers to active string and performs down-bow / up-bow gliding strokes!
 * - Real-time finger position glow markers along the ebony fingerboard.
 */
export class Violin3D {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();
    // Positioned rear-left stage: in the background behind the keyboards
    this.group.position.set(-4.2, 1.25, -1.8);
    this.group.rotation.set(0.12, Math.PI * 0.16, -0.06);

    this.strings = [];
    this.stringTuningMidi = [55, 62, 69, 76]; // G3, D4, A4, E5
    this.fingerMarkers = [];
    this.bowDirection = 1;

    this._buildMaterials();
    this._buildStand();
    this._buildViolinBody();
    this._buildNeckAndScroll();
    this._buildStrings();
    this._buildFlyingBow();

    this.scene.add(this.group);
  }

  _buildMaterials() {
    // Varnished Flamed Maple with deep clearcoat
    this.varnishMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x823b12,
      emissive: 0x1f0b02,
      roughness: 0.18,
      metalness: 0.1,
      clearcoat: 0.9,
      clearcoatRoughness: 0.08
    });

    // Solid African Ebony (Fingerboard, Tailpiece, Pegs, Chinrest)
    this.ebonyMaterial = new THREE.MeshStandardMaterial({
      color: 0x141416,
      roughness: 0.3,
      metalness: 0.05
    });

    // Maple Bridge
    this.bridgeMaterial = new THREE.MeshStandardMaterial({
      color: 0xd2b48c,
      roughness: 0.6,
      metalness: 0.02
    });

    // Pernambuco Bow Wood
    this.bowWoodMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x5c1d0c,
      roughness: 0.22,
      metalness: 0.15,
      clearcoat: 0.8
    });

    // White Bow Horsehair
    this.bowHairMaterial = new THREE.MeshStandardMaterial({
      color: 0xfaf8f2,
      roughness: 0.4,
      metalness: 0.0
    });

    this.chromeMaterial = new THREE.MeshStandardMaterial({
      color: 0xcccccc,
      roughness: 0.15,
      metalness: 0.9
    });
  }

  _buildStand() {
    const stand = new THREE.Group();
    stand.position.set(0, -1.20, 0);

    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 0.04, 16), this.chromeMaterial);
    stand.add(base);

    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 1.15, 8), this.chromeMaterial);
    pole.position.y = 0.58;
    stand.add(pole);

    const cradle = new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.012, 8, 16, Math.PI), this.chromeMaterial);
    cradle.position.y = 1.15;
    cradle.rotation.x = Math.PI / 2;
    stand.add(cradle);

    this.group.add(stand);
  }

  _buildViolinBody() {
    const bodyGroup = new THREE.Group();

    // Upper bout
    const upperGeom = new THREE.CylinderGeometry(0.082, 0.082, 0.040, 20);
    upperGeom.rotateX(Math.PI / 2);
    const upperBout = new THREE.Mesh(upperGeom, this.varnishMaterial);
    upperBout.position.set(0, 0.10, 0);
    upperBout.castShadow = true;
    bodyGroup.add(upperBout);

    // C-Bouts (waist)
    const waistGeom = new THREE.BoxGeometry(0.115, 0.10, 0.038);
    const waist = new THREE.Mesh(waistGeom, this.varnishMaterial);
    waist.position.set(0, 0, 0);
    waist.castShadow = true;
    bodyGroup.add(waist);

    // Lower bout
    const lowerGeom = new THREE.CylinderGeometry(0.105, 0.105, 0.040, 20);
    lowerGeom.rotateX(Math.PI / 2);
    const lowerBout = new THREE.Mesh(lowerGeom, this.varnishMaterial);
    lowerBout.position.set(0, -0.11, 0);
    lowerBout.castShadow = true;
    bodyGroup.add(lowerBout);

    // Carved Maple Bridge
    const bridge = new THREE.Mesh(new THREE.BoxGeometry(0.046, 0.026, 0.005), this.bridgeMaterial);
    bridge.position.set(0, -0.02, 0.035);
    bodyGroup.add(bridge);

    // Ebony Tailpiece
    const tailpiece = new THREE.Mesh(new THREE.ConeGeometry(0.028, 0.13, 12), this.ebonyMaterial);
    tailpiece.rotation.x = -Math.PI / 2;
    tailpiece.position.set(0, -0.16, 0.028);
    bodyGroup.add(tailpiece);

    // Ebony Chinrest
    const chinrest = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.045, 0.016), this.ebonyMaterial);
    chinrest.position.set(-0.065, -0.22, 0.032);
    bodyGroup.add(chinrest);

    // F-Holes (Decorative dark slots)
    [-0.042, 0.042].forEach(fx => {
      const fHole = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.07, 8), this.ebonyMaterial);
      fHole.position.set(fx, -0.01, 0.024);
      fHole.rotation.z = fx < 0 ? -0.18 : 0.18;
      bodyGroup.add(fHole);
    });

    this.group.add(bodyGroup);
  }

  _buildNeckAndScroll() {
    const neckGroup = new THREE.Group();

    // Maple Neck
    const neck = new THREE.Mesh(new THREE.BoxGeometry(0.026, 0.22, 0.024), this.varnishMaterial);
    neck.position.set(0, 0.28, 0.01);
    neckGroup.add(neck);

    // Ebony Fingerboard (Extending over the body)
    const fingerboard = new THREE.Mesh(new THREE.BoxGeometry(0.032, 0.32, 0.008), this.ebonyMaterial);
    fingerboard.position.set(0, 0.22, 0.026);
    neckGroup.add(fingerboard);

    // Pegbox & 4 Tuning Pegs
    const pegbox = new THREE.Mesh(new THREE.BoxGeometry(0.024, 0.08, 0.026), this.varnishMaterial);
    pegbox.position.set(0, 0.42, 0.01);
    neckGroup.add(pegbox);

    [-0.024, 0.024].forEach(px => {
      [0.40, 0.43].forEach(py => {
        const peg = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.04, 8), this.ebonyMaterial);
        peg.rotation.z = Math.PI / 2;
        peg.position.set(px, py, 0.01);
        neckGroup.add(peg);
      });
    });

    // Carved Classical Scroll Volute
    const scroll = new THREE.Mesh(new THREE.TorusGeometry(0.022, 0.010, 8, 16, Math.PI * 1.5), this.varnishMaterial);
    scroll.rotation.y = Math.PI / 2;
    scroll.position.set(0, 0.48, 0.01);
    neckGroup.add(scroll);

    this.group.add(neckGroup);
  }

  _buildStrings() {
    // 4 strings (G, D, A, E)
    for (let i = 0; i < 4; i++) {
      const x = -0.012 + i * 0.008;
      const geom = new THREE.CylinderGeometry(0.0012, 0.0012, 0.58, 6);
      const mat = new THREE.MeshStandardMaterial({
        color: 0xdddddd,
        metalness: 0.95,
        roughness: 0.15
      });
      const str = new THREE.Mesh(geom, mat);
      str.position.set(x, 0.12, 0.034);
      this.group.add(str);

      this.strings.push({
        mesh: str,
        material: mat,
        defaultX: x,
        vibrationAmp: 0
      });
    }

    // Glowing finger press indicator
    const markerGeom = new THREE.SphereGeometry(0.006, 12, 12);
    const markerMat = new THREE.MeshStandardMaterial({
      color: 0x00f0ff,
      emissive: 0x00f0ff,
      emissiveIntensity: 2.0
    });
    this.fingerMarker = new THREE.Mesh(markerGeom, markerMat);
    this.fingerMarker.visible = false;
    this.group.add(this.fingerMarker);
  }

  _buildFlyingBow() {
    const bowGroup = new THREE.Group();

    // Pernambuco Bow Stick (68 cm length)
    const stickGeom = new THREE.CylinderGeometry(0.004, 0.006, 0.68, 8);
    stickGeom.rotateZ(Math.PI / 2);
    const stick = new THREE.Mesh(stickGeom, this.bowWoodMaterial);
    bowGroup.add(stick);

    // Horsehair Ribbon running parallel under stick
    const hairGeom = new THREE.BoxGeometry(0.66, 0.003, 0.006);
    const hair = new THREE.Mesh(hairGeom, this.bowHairMaterial);
    hair.position.y = -0.016;
    bowGroup.add(hair);

    // Ebony Frog at heel
    const frog = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.02, 0.014), this.ebonyMaterial);
    frog.position.set(-0.30, -0.008, 0);
    bowGroup.add(frog);

    // Position bow floating horizontally across strings near the bridge
    bowGroup.position.set(0, -0.04, 0.065);
    this.group.add(bowGroup);
    this.bowGroup = bowGroup;
  }

  onNoteOn(midiPitch, velocity = 0.8) {
    const vel = Math.max(0.3, Math.min(1.0, velocity));

    // 1. Determine active string
    let bestString = 0;
    let minDiff = 999;
    for (let s = 0; s < 4; s++) {
      const diff = midiPitch - this.stringTuningMidi[s];
      if (diff >= 0 && diff < minDiff) {
        minDiff = diff;
        bestString = s;
      }
    }

    // 2. Animate Autonomous Flying Bow (Stroke back and forth)
    if (this.bowGroup) {
      const activeX = this.strings[bestString].defaultX;
      this.bowDirection = -this.bowDirection;
      const strokeDistance = 0.22 * vel;

      gsap.killTweensOf(this.bowGroup.position);
      gsap.timeline()
        .to(this.bowGroup.position, {
          x: activeX + (this.bowDirection * strokeDistance * 0.5),
          z: 0.042, // Press against string
          duration: 0.06,
          ease: 'power2.in'
        })
        .to(this.bowGroup.position, {
          x: activeX - (this.bowDirection * strokeDistance * 0.5),
          duration: 0.25,
          ease: 'sine.inOut'
        })
        .to(this.bowGroup.position, {
          z: 0.062, // Float slightly back up
          duration: 0.15,
          ease: 'power1.out'
        });
    }

    // 3. Vibrate & Glow String
    const str = this.strings[bestString];
    if (str) {
      str.material.emissive.setHex(0x00f0ff);
      str.material.emissiveIntensity = 1.6 * vel;
      gsap.killTweensOf(str.material);
      gsap.to(str.material, {
        emissiveIntensity: 0,
        duration: 0.7,
        ease: 'power2.out'
      });
    }

    // 4. Finger Marker on Fingerboard
    if (this.fingerMarker && minDiff > 0) {
      const fingerY = 0.36 - Math.min(0.24, minDiff * 0.015);
      this.fingerMarker.position.set(str.defaultX, fingerY, 0.034);
      this.fingerMarker.visible = true;
      gsap.killTweensOf(this.fingerMarker.material);
      this.fingerMarker.material.emissiveIntensity = 2.5 * vel;
      gsap.to(this.fingerMarker.material, {
        emissiveIntensity: 0,
        duration: 0.5,
        onComplete: () => {
          this.fingerMarker.visible = false;
        }
      });
    }

    // 5. Body Emissive Flash
    this.varnishMaterial.emissive = new THREE.Color(0x331405);
    this.varnishMaterial.emissiveIntensity = 0.5 * vel;
    gsap.to(this.varnishMaterial, {
      emissiveIntensity: 0,
      duration: 0.4
    });
  }

  onNoteOff(midiPitch) {}

  update(delta) {}
}
