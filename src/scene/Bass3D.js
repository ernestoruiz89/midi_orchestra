import * as THREE from 'three';
import gsap from 'gsap';

/**
 * Bass3D builds a pro-tier, photorealistic Fender Precision Bass:
 * - Hand-contoured P-Bass alder body with offset waist and deep cutaways.
 * - Multi-stage High-Gloss Metallic Midnight Blue / Deep Emerald finish with clearcoat.
 * - Contoured 3-ply tortoise / parchment pickguard.
 * - Split-coil Precision Bass pickups with staggered magnetic pole pieces.
 * - Heavy-duty chrome vintage top-load bridge with 4 threaded barrel saddles.
 * - Knurled chrome dome volume and tone knobs, recessed output jack.
 * - Long 34" scale maple neck, dark rosewood fretboard, 20 medium-jumbo frets.
 * - Classic Fender bass headstock with 4 cloverleaf (elephant-ear) open-gear tuners.
 * - 4 heavy-gauge 3D metallic wound bass strings with real-time vibration.
 * - Real-time active fretboard LED finger markers (digitaciones) on note-on.
 */
export class Bass3D {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();
    // Positioned stage left of drums with clear space from piano
    this.group.position.set(-2.0, 0.95, -0.1);
    this.group.rotation.set(0.06, 0.20, -0.22); // Natural stage stand lean

    this.strings = [];
    this.fretYPositions = [];
    this.fretMarkers = [];
    this.stringTuningMidi = [28, 33, 38, 43]; // E1, A1, D2, G2

    this._buildMaterials();
    this._buildBassStand();
    this._buildBassBody();
    this._buildNeckAndHeadstock();
    this._buildPickguardAndHardware();
    this._buildFretMarkers();
    this._buildStrings();
    this._buildFloatingPlectrum();

    this.scene.add(this.group);
  }

  _buildMaterials() {
    // Metallic Midnight Sapphire Blue with Deep Automotive Clearcoat
    this.bodyMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x092244,
      roughness: 0.12,
      metalness: 0.6,
      clearcoat: 1.0,
      clearcoatRoughness: 0.06,
      reflectivity: 0.9
    });

    // 3-Ply Parchment Pickguard
    this.pickguardMaterial = new THREE.MeshStandardMaterial({
      color: 0xf3eee5,
      roughness: 0.28,
      metalness: 0.05
    });

    // Mirror Polished Chrome
    this.chromeMaterial = new THREE.MeshStandardMaterial({
      color: 0xfbfbfb,
      roughness: 0.06,
      metalness: 0.98
    });

    // Black Pickup Covers
    this.pickupPlasticMaterial = new THREE.MeshStandardMaterial({
      color: 0x141416,
      roughness: 0.4,
      metalness: 0.05
    });

    // Maple Neck
    this.mapleNeckMaterial = new THREE.MeshStandardMaterial({
      color: 0xead0ac,
      roughness: 0.35,
      metalness: 0.02
    });

    // Dark Rosewood Fretboard
    this.rosewoodMaterial = new THREE.MeshStandardMaterial({
      color: 0x27150c,
      roughness: 0.65,
      metalness: 0.02
    });

    // Mother-of-Pearl Inlay
    this.pearlMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      side: THREE.DoubleSide
    });
  }

  _buildBassStand() {
    const standGroup = new THREE.Group();
    standGroup.position.set(0, -0.97, 0);

    const base = new THREE.Mesh(
      new THREE.CylinderGeometry(0.012, 0.012, 0.54, 12),
      this.chromeMaterial
    );
    base.rotation.x = Math.PI / 2;
    standGroup.add(base);

    const mast = new THREE.Mesh(
      new THREE.CylinderGeometry(0.014, 0.014, 0.95, 12),
      this.chromeMaterial
    );
    mast.position.y = 0.48;
    standGroup.add(mast);

    const cradle = new THREE.Mesh(
      new THREE.TorusGeometry(0.12, 0.012, 8, 24, Math.PI),
      new THREE.MeshStandardMaterial({ color: 0x18181a, roughness: 0.7 })
    );
    cradle.position.set(0, 0.50, -0.04);
    standGroup.add(cradle);

    this.group.add(standGroup);
  }

  _buildBassBody() {
    // Authentic Precision Bass Silhouette
    const shape = new THREE.Shape();
    shape.moveTo(0, -0.42);
    // Lower bass bout
    shape.bezierCurveTo(-0.16, -0.42, -0.20, -0.29, -0.19, -0.18);
    // Bass waist
    shape.bezierCurveTo(-0.18, -0.07, -0.14, -0.03, -0.14, 0.06);
    // Long upper bass horn (reaching ~12th fret)
    shape.bezierCurveTo(-0.14, 0.17, -0.17, 0.32, -0.145, 0.37);
    shape.bezierCurveTo(-0.125, 0.38, -0.09, 0.32, -0.07, 0.23);
    // Neck pocket
    shape.lineTo(-0.046, 0.16);
    shape.lineTo(-0.046, 0.22);
    shape.lineTo(0.046, 0.22);
    shape.lineTo(0.046, 0.16);
    // Short treble horn (deep cutaway)
    shape.lineTo(0.07, 0.16);
    shape.bezierCurveTo(0.09, 0.23, 0.125, 0.26, 0.145, 0.23);
    shape.bezierCurveTo(0.16, 0.18, 0.13, 0.12, 0.13, 0.05);
    // Treble waist
    shape.bezierCurveTo(0.135, -0.03, 0.17, -0.07, 0.18, -0.18);
    // Lower treble bout
    shape.bezierCurveTo(0.19, -0.29, 0.16, -0.42, 0, -0.42);

    const extrudeSettings = {
      depth: 0.044,
      bevelEnabled: true,
      bevelSegments: 6,
      bevelSize: 0.016,
      bevelThickness: 0.016
    };

    const bodyGeom = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    bodyGeom.center();
    const bodyMesh = new THREE.Mesh(bodyGeom, this.bodyMaterial);
    bodyMesh.castShadow = true;
    bodyMesh.receiveShadow = true;
    bodyMesh.position.set(0, -0.16, 0.005);
    this.group.add(bodyMesh);

    // Chrome Neck Plate on back with 4 screws
    const neckPlate = new THREE.Mesh(
      new THREE.BoxGeometry(0.058, 0.072, 0.004),
      this.chromeMaterial
    );
    neckPlate.position.set(0, 0.04, -0.038);
    this.group.add(neckPlate);

    // Chrome Strap Buttons
    const strapUpper = new THREE.Mesh(
      new THREE.CylinderGeometry(0.007, 0.005, 0.014, 12),
      this.chromeMaterial
    );
    strapUpper.position.set(-0.145, 0.23, 0.005);
    strapUpper.rotation.z = 0.8;
    this.group.add(strapUpper);

    const strapLower = new THREE.Mesh(
      new THREE.CylinderGeometry(0.007, 0.005, 0.014, 12),
      this.chromeMaterial
    );
    strapLower.position.set(0, -0.56, 0.005);
    this.group.add(strapLower);
  }

  _buildPickguardAndHardware() {
    // 1. Contoured P-Bass Pickguard
    const pgShape = new THREE.Shape();
    pgShape.moveTo(-0.042, 0.15);
    pgShape.bezierCurveTo(-0.07, 0.21, -0.11, 0.30, -0.125, 0.31);
    pgShape.bezierCurveTo(-0.14, 0.31, -0.145, 0.26, -0.13, 0.19);
    pgShape.bezierCurveTo(-0.115, 0.11, -0.11, 0.04, -0.11, -0.04);
    pgShape.bezierCurveTo(-0.11, -0.11, -0.14, -0.17, -0.145, -0.23);
    pgShape.bezierCurveTo(-0.145, -0.29, -0.09, -0.34, 0, -0.34);
    pgShape.bezierCurveTo(0.08, -0.34, 0.13, -0.28, 0.14, -0.21);
    pgShape.bezierCurveTo(0.145, -0.14, 0.115, -0.08, 0.11, 0.01);
    pgShape.bezierCurveTo(0.105, 0.07, 0.12, 0.13, 0.105, 0.15);
    pgShape.bezierCurveTo(0.09, 0.17, 0.06, 0.15, 0.042, 0.15);
    pgShape.closePath();

    const pgGeom = new THREE.ExtrudeGeometry(pgShape, {
      depth: 0.005,
      bevelEnabled: true,
      bevelSize: 0.002,
      bevelThickness: 0.002,
      bevelSegments: 2
    });
    pgGeom.center();
    const pickguard = new THREE.Mesh(pgGeom, this.pickguardMaterial);
    pickguard.position.set(-0.005, -0.09, 0.044);
    this.group.add(pickguard);

    // 2. Split-Coil Precision Bass Pickups (staggered pair)
    [[-0.018, -0.03], [0.018, -0.07]].forEach(([px, py]) => {
      const pu = new THREE.Mesh(
        new THREE.BoxGeometry(0.042, 0.024, 0.014),
        this.pickupPlasticMaterial
      );
      pu.position.set(px, py, 0.048);

      // 2 Chrome Pole Pieces per half
      [-0.010, 0.010].forEach(poleX => {
        const pole = new THREE.Mesh(
          new THREE.CylinderGeometry(0.004, 0.004, 0.006, 8),
          this.chromeMaterial
        );
        pole.rotation.x = Math.PI / 2;
        pole.position.set(poleX, 0, 0.008);
        pu.add(pole);
      });

      this.group.add(pu);
    });

    // 3. Heavy-Duty Chrome Vintage Bass Bridge
    const bridge = new THREE.Mesh(
      new THREE.BoxGeometry(0.075, 0.052, 0.010),
      this.chromeMaterial
    );
    bridge.position.set(0, -0.24, 0.046);
    this.group.add(bridge);

    // 4 Threaded Chrome Barrel Saddles
    for (let s = 0; s < 4; s++) {
      const sx = -0.027 + s * 0.018;
      const saddle = new THREE.Mesh(
        new THREE.CylinderGeometry(0.004, 0.004, 0.014, 8),
        this.chromeMaterial
      );
      saddle.rotation.z = Math.PI / 2;
      saddle.position.set(sx, -0.23, 0.054);
      this.group.add(saddle);
    }

    // 4. Knurled Chrome Dome Knobs (Volume & Tone)
    [[0.08, -0.19], [0.08, -0.27]].forEach(([kx, ky]) => {
      const knob = new THREE.Mesh(
        new THREE.CylinderGeometry(0.012, 0.012, 0.014, 16),
        this.chromeMaterial
      );
      knob.rotation.x = Math.PI / 2;
      knob.position.set(kx, ky, 0.051);
      this.group.add(knob);
    });

    // 5. Chrome Output Jack
    const jack = new THREE.Mesh(
      new THREE.CylinderGeometry(0.008, 0.008, 0.006, 8),
      this.chromeMaterial
    );
    jack.position.set(0.11, -0.32, 0.044);
    this.group.add(jack);
  }

  _buildNeckAndHeadstock() {
    // 34" Long-Scale Bass Neck: Nut at y = 0.52, Bridge at y = -0.23 (Scale length = 0.75m)
    const neckLength = 0.62;
    const neckCore = new THREE.Mesh(
      new THREE.BoxGeometry(0.060, neckLength, 0.024),
      this.mapleNeckMaterial
    );
    neckCore.position.set(0, 0.21, 0.033);
    neckCore.castShadow = true;
    this.group.add(neckCore);

    // Dark Rosewood Fretboard slab
    const fretboard = new THREE.Mesh(
      new THREE.BoxGeometry(0.062, neckLength, 0.006),
      this.rosewoodMaterial
    );
    fretboard.position.set(0, 0.21, 0.047);
    this.group.add(fretboard);

    const nutY = 0.52;
    this.fretYPositions[0] = nutY; // Fret 0 = Nut

    // Bone Nut
    const nut = new THREE.Mesh(
      new THREE.BoxGeometry(0.062, 0.010, 0.014),
      new THREE.MeshStandardMaterial({ color: 0xf9f7f2, roughness: 0.3 })
    );
    nut.position.set(0, nutY, 0.052);
    this.group.add(nut);

    // 20 Medium-Jumbo Nickel Frets
    for (let f = 1; f <= 20; f++) {
      const dist = 0.54 * (1 - Math.pow(2, -f / 12));
      const fretY = nutY - dist;
      this.fretYPositions[f] = fretY;

      const fretGeom = new THREE.BoxGeometry(0.060, 0.003, 0.006);
      const fret = new THREE.Mesh(fretGeom, this.chromeMaterial);
      fret.position.set(0, fretY, 0.051);
      this.group.add(fret);
    }

    // Inlay dots on frets 3, 5, 7, 9, 12, 15, 17, 19
    const inlayFrets = [3, 5, 7, 9, 12, 15, 17, 19];
    inlayFrets.forEach(f => {
      const dotY = (this.fretYPositions[f - 1] + this.fretYPositions[f]) * 0.5;
      if (f === 12) {
        [-0.014, 0.014].forEach(dx => {
          const dot = new THREE.Mesh(new THREE.CircleGeometry(0.0035, 16), this.pearlMaterial);
          dot.position.set(dx, dotY, 0.051);
          this.group.add(dot);
        });
      } else {
        const dot = new THREE.Mesh(new THREE.CircleGeometry(0.004, 16), this.pearlMaterial);
        dot.position.set(0, dotY, 0.051);
        this.group.add(dot);
      }
    });

    // Classic Fender Bass Headstock
    const headShape = new THREE.Shape();
    headShape.moveTo(-0.028, 0);
    headShape.lineTo(0.028, 0);
    headShape.bezierCurveTo(0.038, 0.09, 0.052, 0.18, 0.048, 0.25);
    headShape.bezierCurveTo(0.040, 0.28, 0.012, 0.28, -0.006, 0.25);
    headShape.bezierCurveTo(-0.020, 0.22, -0.025, 0.18, -0.028, 0.13);
    headShape.closePath();

    const headGeom = new THREE.ExtrudeGeometry(headShape, { depth: 0.018, bevelEnabled: false });
    const headMesh = new THREE.Mesh(headGeom, this.mapleNeckMaterial);
    headMesh.position.set(0, 0.52, 0.025);
    this.group.add(headMesh);

    // 4 Clover-Leaf (Elephant Ear) Open-Gear Tuners
    for (let p = 0; p < 4; p++) {
      const py = 0.56 + p * 0.040;
      const px = 0.030 + p * 0.003;

      // Chrome post
      const post = new THREE.Mesh(
        new THREE.CylinderGeometry(0.0045, 0.0045, 0.018, 8),
        this.chromeMaterial
      );
      post.rotation.x = Math.PI / 2;
      post.position.set(px, py, 0.042);
      this.group.add(post);

      // Clover / Elephant-Ear key
      const clover = new THREE.Mesh(
        new THREE.CylinderGeometry(0.010, 0.010, 0.003, 16),
        this.chromeMaterial
      );
      clover.position.set(px + 0.024, py, 0.034);
      clover.scale.set(1.4, 0.8, 1.0);
      this.group.add(clover);
    }
  }

  _buildFretMarkers() {
    // 4 Active Finger Press Indicators for Bass
    for (let s = 0; s < 4; s++) {
      const markerGroup = new THREE.Group();
      markerGroup.visible = false;

      const fretPad = new THREE.Mesh(
        new THREE.BoxGeometry(0.022, 0.028, 0.004),
        new THREE.MeshStandardMaterial({
          color: 0xff0055,
          emissive: 0xff0055,
          emissiveIntensity: 1.8,
          transparent: true,
          opacity: 0.85
        })
      );
      markerGroup.add(fretPad);

      const jewel = new THREE.Mesh(
        new THREE.SphereGeometry(0.012, 16, 16),
        new THREE.MeshStandardMaterial({
          color: 0xff3366,
          emissive: 0xff0055,
          emissiveIntensity: 3.0,
          roughness: 0.1,
          metalness: 0.8
        })
      );
      jewel.scale.set(1.0, 1.3, 0.6);
      jewel.position.z = 0.008;
      markerGroup.add(jewel);

      const halo = new THREE.Mesh(
        new THREE.RingGeometry(0.014, 0.028, 24),
        new THREE.MeshBasicMaterial({
          color: 0xff0055,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.85
        })
      );
      halo.position.z = 0.010;
      markerGroup.add(halo);

      markerGroup.position.set(0, 0, 0.054);
      this.group.add(markerGroup);

      this.fretMarkers.push({
        group: markerGroup,
        fretPad: fretPad,
        jewel: jewel,
        halo: halo,
        active: false
      });
    }
  }

  _buildStrings() {
    const stringCount = 4;
    const bridgeY = -0.23;
    const nutY = 0.52;
    const length = nutY - bridgeY;

    // Heavy Gauge Bass Strings (.105, .085, .065, .045)
    const stringRadii = [0.0034, 0.0028, 0.0022, 0.0017];

    for (let i = 0; i < stringCount; i++) {
      const xPos = -0.022 + i * 0.0145;
      const radius = stringRadii[i];

      const geom = new THREE.CylinderGeometry(radius, radius, length, 10);
      const mat = new THREE.MeshStandardMaterial({
        color: 0xf5f5f5,
        metalness: 0.98,
        roughness: 0.12,
        emissive: 0x000000,
        emissiveIntensity: 0
      });

      const mesh = new THREE.Mesh(geom, mat);
      mesh.position.set(xPos, (bridgeY + nutY) / 2, 0.055);
      this.group.add(mesh);

      this.strings.push({
        mesh: mesh,
        material: mat,
        defaultPos: mesh.position.clone(),
        xPos: xPos,
        vibrationAmp: 0,
        vibrationFreq: 28 + i * 18,
        stringIndex: i
      });
    }
  }

  _buildFloatingPlectrum() {
    const pGroup = new THREE.Group();
    // Heavy bass pick shape
    const shape = new THREE.Shape();
    shape.moveTo(0, 0.020);
    shape.bezierCurveTo(0.013, 0.020, 0.015, 0.005, 0.004, -0.020);
    shape.lineTo(-0.004, -0.020);
    shape.bezierCurveTo(-0.015, 0.005, -0.013, 0.020, 0, 0.020);

    const geom = new THREE.ExtrudeGeometry(shape, { depth: 0.0028, bevelEnabled: true, bevelThickness: 0.001, bevelSize: 0.001 });
    const mat = new THREE.MeshStandardMaterial({
      color: 0xff0055,
      roughness: 0.2,
      metalness: 0.5,
      emissive: 0x660022,
      emissiveIntensity: 0.9
    });
    this.plectrum = new THREE.Mesh(geom, mat);
    pGroup.add(this.plectrum);
    // Floating near bridge saddles
    pGroup.position.set(0, -0.22, 0.078);
    pGroup.rotation.set(0.12, 0, 0);
    this.group.add(pGroup);
    this.plectrumGroup = pGroup;
    this.strumDir = 1;
  }

  _getStringXAtY(stringIndex, y) {
    const bridgeY = -0.23;
    const nutY = 0.52;
    const t = Math.max(0, Math.min(1, (y - bridgeY) / (nutY - bridgeY)));
    const bridgeX = -0.022 + stringIndex * 0.0145;
    const nutX = -0.018 + stringIndex * 0.012;
    return THREE.MathUtils.lerp(bridgeX, nutX, t);
  }

  onNoteOn(midiPitch, velocity = 0.8) {
    const vel = Math.max(0.3, Math.min(1.0, velocity));

    let bestString = -1;
    let bestFret = -1;
    let bestScore = 999;

    for (let s = 0; s < 4; s++) {
      const f = midiPitch - this.stringTuningMidi[s];
      if (f >= 0 && f <= 20) {
        const score = Math.abs(f - 4) + (4 - s) * 0.5;
        if (score < bestScore) {
          bestScore = score;
          bestString = s;
          bestFret = f;
        }
      }
    }

    if (bestString === -1) {
      bestString = midiPitch < 35 ? 0 : 3;
      bestFret = Math.max(0, Math.min(20, midiPitch - this.stringTuningMidi[bestString]));
    }

    // 0. Autonomous Bass Pick / Thumb Pluck
    if (this.plectrumGroup) {
      const stringX = this._getStringXAtY(bestString, -0.22);
      this.strumDir = -this.strumDir;
      gsap.killTweensOf(this.plectrumGroup.position);
      gsap.killTweensOf(this.plectrumGroup.rotation);
      gsap.timeline()
        .to(this.plectrumGroup.position, {
          x: stringX,
          y: -0.22 + this.strumDir * 0.015,
          z: 0.064,
          duration: 0.038,
          ease: 'power2.in'
        })
        .to(this.plectrumGroup.rotation, {
          z: this.strumDir * 0.38,
          duration: 0.038,
          ease: 'power2.in'
        }, 0)
        .to(this.plectrumGroup.position, {
          y: -0.22,
          z: 0.078,
          duration: 0.16,
          ease: 'power1.out'
        })
        .to(this.plectrumGroup.rotation, {
          z: 0,
          duration: 0.16,
          ease: 'power1.out'
        }, '-=0.16');
    }

    const str = this.strings[bestString];
    if (str) {
      str.material.emissive.setHex(0xff0055);
      str.material.emissiveIntensity = 1.4 * vel;
      gsap.killTweensOf(str.material);
      gsap.to(str.material, {
        emissiveIntensity: 0,
        duration: 0.8 + vel * 0.4,
        ease: 'power2.out'
      });

      str.vibrationAmp = 0.020 * vel;
      gsap.killTweensOf(str);
      gsap.to(str, {
        vibrationAmp: 0,
        duration: 0.8 + vel * 0.5,
        ease: 'power2.out'
      });
    }

    const marker = this.fretMarkers[bestString];
    if (marker) {
      if (bestFret > 0) {
        const fretY = (this.fretYPositions[bestFret - 1] + this.fretYPositions[bestFret]) * 0.5;
        const fretX = this._getStringXAtY(bestString, fretY);

        marker.group.position.set(fretX, fretY, 0.054);
        marker.group.visible = true;
        marker.active = true;

        marker.group.scale.set(2.2, 2.2, 2.2);
        gsap.killTweensOf(marker.group.scale);
        gsap.to(marker.group.scale, {
          x: 1.0,
          y: 1.0,
          z: 1.0,
          duration: 0.16,
          ease: 'back.out(3.0)'
        });

        marker.jewel.material.emissiveIntensity = 3.0 * vel;
        marker.fretPad.material.emissiveIntensity = 1.8 * vel;
        marker.halo.material.opacity = 0.9 * vel;

        gsap.killTweensOf(marker.jewel.material);
        gsap.killTweensOf(marker.fretPad.material);
        gsap.killTweensOf(marker.halo.material);

        gsap.timeline()
          .to(marker.jewel.material, { emissiveIntensity: 1.2, duration: 0.3 })
          .to(marker.jewel.material, { emissiveIntensity: 0, duration: 0.4 })
          .call(() => {
            marker.group.visible = false;
            marker.active = false;
          });

        gsap.to(marker.fretPad.material, {
          emissiveIntensity: 0,
          duration: 0.7,
          ease: 'power2.out'
        });

        gsap.to(marker.halo.material, {
          opacity: 0,
          duration: 0.7,
          ease: 'power2.out'
        });
      } else {
        marker.group.visible = false;
      }
    }

    this.bodyMaterial.emissive = new THREE.Color(0x001133);
    this.bodyMaterial.emissiveIntensity = 0.4 * vel;
    gsap.to(this.bodyMaterial, {
      emissiveIntensity: 0,
      duration: 0.35
    });
  }

  onNoteOff() {}

  update(delta) {
    const time = performance.now() * 0.001;

    this.strings.forEach(str => {
      if (str.vibrationAmp > 0.0003) {
        const offset = Math.sin(time * str.vibrationFreq) * str.vibrationAmp;
        str.mesh.position.z = str.defaultPos.z + offset;
      } else {
        str.mesh.position.z = str.defaultPos.z;
      }
    });
  }
}
