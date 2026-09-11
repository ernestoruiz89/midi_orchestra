import * as THREE from 'three';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import gsap from 'gsap';

/**
 * Banjo3D represents an authentic 5-string Bluegrass/Folk Banjo for the 3D MIDI Orchestra,
 * inspired by and utilizing the Eastman EBJ-WL Whyte Laydie banjo model.
 * 
 * Anatomy & Features:
 * - High-fidelity Eastman Whyte Laydie pot, scalloped bracket band, 24 bracket hooks.
 * - Frosted white Mylar skin drum head with tone ring.
 * - Maple neck with dark ebony fingerboard, pearl cloud/star inlays, and 22 frets.
 * - 5th-string geared tuner peg at Fret 5 on the bass side of the neck.
 * - 4 planetary tuning pegs on the traditional double-cut peghead.
 * - Floating 3-footed bridge & Presto tailpiece.
 * - 5 real-time vibrating strings (Open G tuning: G4, D3, G3, B3, D4; 5th string begins at Fret 5).
 * - Dynamic glowing fret position gemstones upon MIDI notes.
 * - Bluegrass fingerpicking stroke animation.
 * - Weighted chrome studio stand with automatic floor elevation syncing.
 */
// Authentic Eastman EBJ-WL 5-String Banjo Anchors
const BANJO_STRINGS = [
  {
    // String 0: 5th drone string (G4 = 67, begins at 5th fret pip on bass side -X)
    tail: new THREE.Vector3(-0.0220, -0.1588, 0.0460),
    bridge: new THREE.Vector3(-0.0238, -0.0275, 0.0488),
    top: new THREE.Vector3(-0.0205, 0.5450, 0.0090), // 5th fret pip on fingerboard
    peg: new THREE.Vector3(-0.0300, 0.5410, -0.0030), // 5th geared tuning peg shaft on neck under white button
    radius: 0.00062,
    openPitch: 67,
    isFifth: true
  },
  {
    // String 1: 4th bass wound string (D3 = 50)
    tail: new THREE.Vector3(-0.0110, -0.1588, 0.0465),
    bridge: new THREE.Vector3(-0.0119, -0.0275, 0.0490),
    top: new THREE.Vector3(-0.0120, 0.6814, -0.0040),  // Nut slot (bass)
    peg: new THREE.Vector3(-0.0170, 0.7096, -0.0150), // Bottom-left headstock peg post
    radius: 0.00095,
    openPitch: 50,
    isFifth: false
  },
  {
    // String 2: 3rd string (G3 = 55)
    tail: new THREE.Vector3(0.0000, -0.1588, 0.0470),
    bridge: new THREE.Vector3(0.0000, -0.0275, 0.0492),
    top: new THREE.Vector3(-0.0040, 0.6814, -0.0040), // Nut slot
    peg: new THREE.Vector3(-0.0225, 0.7557, -0.0270), // Top-left headstock peg post
    radius: 0.00080,
    openPitch: 55,
    isFifth: false
  },
  {
    // String 3: 2nd string (B3 = 59)
    tail: new THREE.Vector3(0.0110, -0.1588, 0.0465),
    bridge: new THREE.Vector3(0.0119, -0.0275, 0.0490),
    top: new THREE.Vector3(0.0040, 0.6814, -0.0040),  // Nut slot
    peg: new THREE.Vector3(0.0160, 0.7557, -0.0330), // Top-right headstock peg post
    radius: 0.00070,
    openPitch: 59,
    isFifth: false
  },
  {
    // String 4: 1st treble string (D4 = 62)
    tail: new THREE.Vector3(0.0220, -0.1588, 0.0460),
    bridge: new THREE.Vector3(0.0238, -0.0275, 0.0488),
    top: new THREE.Vector3(0.0120, 0.6814, -0.0040),  // Nut slot (treble)
    peg: new THREE.Vector3(0.0150, 0.7096, -0.0190), // Bottom-right headstock peg post
    radius: 0.00062,
    openPitch: 62,
    isFifth: false
  }
];

function createCylinderSegment(p1, p2, radius, material) {
  const dir = new THREE.Vector3().subVectors(p2, p1);
  const len = dir.length();
  const geo = new THREE.CylinderGeometry(radius, radius, len, 8);
  const mesh = new THREE.Mesh(geo, material);
  mesh.position.addVectors(p1, p2).multiplyScalar(0.5);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
  mesh.castShadow = true;
  return mesh;
}

export class Banjo3D {
  constructor(scene, options = {}) {
    this.scene = scene;
    this.index = options.index || 1;
    this.group = new THREE.Group();
    this.banjoModel = new THREE.Group();
    this.strings = [];
    this.fretYPositions = [];
    // 5-String Banjo Open G Tuning:
    // String 0 (5th string / short drone): G4 = 67 (starts at 5th fret pip)
    // String 1 (4th string / bass):        D3 = 50
    // String 2 (3rd string):               G3 = 55
    // String 3 (2nd string):               B3 = 59
    // String 4 (1st string / treble):      D4 = 62
    this.stringTuningMidi = [67, 50, 55, 59, 62];
    this.strumDir = 1;
    this.floorElevation = 0;

    this.bridgeY = -0.0275;
    this.nutY = 0.6814;

    this._buildMaterials();
    this._loadEastmanModel();
    this._buildFretsAndMarkers();
    this._buildStrings();
    this._buildPick();

    // Natural performance posture: banjo faces the audience while the neck
    // rises gracefully to the musician's left.
    this.banjoModel.rotation.set(-0.18, -0.06, -1.18);
    this.banjoModel.position.set(0, 0.05, 0);
    this.group.add(this.banjoModel);

    this._buildBanjoStand();
    this.scene.add(this.group);
  }

  _buildMaterials() {
    const textureLoader = new THREE.TextureLoader();

    // Eastman EBJ-WL Authentic Textures
    const baseColorMap = textureLoader.load('/textures/banjo/None_Base_Color.jpg');
    baseColorMap.colorSpace = THREE.SRGBColorSpace;

    this.eastmanMaterial = new THREE.MeshStandardMaterial({
      map: baseColorMap,
      roughness: 0.48,
      metalness: 0.32
    });

    // Silver steel strings with emissive sheen
    this.stringMaterial = new THREE.MeshStandardMaterial({
      color: 0xe5eaf2,
      roughness: 0.20,
      metalness: 0.90,
      emissive: 0x000000,
      emissiveIntensity: 0
    });

    // Studio stand cast chrome
    this.chromeMaterial = new THREE.MeshStandardMaterial({
      color: 0xd8dce6,
      roughness: 0.16,
      metalness: 0.92
    });

    this.standBaseMaterial = new THREE.MeshStandardMaterial({
      color: 0xd4d8df,
      roughness: 0.14,
      metalness: 0.94
    });

    this.ebonyMaterial = new THREE.MeshStandardMaterial({
      color: 0x1a1818,
      roughness: 0.65,
      metalness: 0.05
    });

    // Pick material
    this.pickMaterial = new THREE.MeshStandardMaterial({
      color: 0x2563eb,
      roughness: 0.32,
      metalness: 0.08
    });
  }

  _loadEastmanModel() {
    this.bodyContainer = new THREE.Group();
    this.banjoModel.add(this.bodyContainer);

    // Initial procedural placeholder while OBJ is parsed
    const tempPot = new THREE.Mesh(
      new THREE.CylinderGeometry(0.17, 0.17, 0.05, 32).rotateX(Math.PI / 2),
      new THREE.MeshStandardMaterial({ color: 0x7c3016, roughness: 0.5 })
    );
    this.bodyContainer.add(tempPot);

    const tempHead = new THREE.Mesh(
      new THREE.CylinderGeometry(0.142, 0.142, 0.005, 32).rotateX(Math.PI / 2),
      new THREE.MeshStandardMaterial({ color: 0xf5f3ea, roughness: 0.8 })
    );
    tempHead.position.z = 0.026;
    this.bodyContainer.add(tempHead);

    const tempNeck = new THREE.Mesh(
      new THREE.BoxGeometry(0.038, 0.45, 0.022),
      new THREE.MeshStandardMaterial({ color: 0x6e3518, roughness: 0.6 })
    );
    tempNeck.position.set(0, 0.35, 0.01);
    this.bodyContainer.add(tempNeck);

    // Load indexed, aligned Eastman EBJ-WL OBJ model
    const objLoader = new OBJLoader();
    objLoader.load(
      '/models/banjo/banjo.obj',
      (obj) => {
        // Remove temp placeholder
        while (this.bodyContainer.children.length > 0) {
          this.bodyContainer.remove(this.bodyContainer.children[0]);
        }

        obj.traverse((child) => {
          if (child.isMesh) {
            child.material = this.eastmanMaterial;
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });

        this.bodyContainer.add(obj);
        this.eastmanMesh = obj;
      },
      undefined,
      (err) => {
        console.warn('Could not load Eastman Banjo OBJ model, retaining procedural fallback:', err);
      }
    );
  }

  _buildFretsAndMarkers() {
    // 22 Frets exactly matching the Eastman EBJ-WL physical fingerboard frets from banjo.obj
    this.fretYPositions = [
      0.6814, // Nut (Fret 0)
      0.6451, // Fret 1
      0.6102, // Fret 2
      0.5765, // Fret 3
      0.5445, // Fret 4
      0.5142, // Fret 5
      0.4855, // Fret 6
      0.4585, // Fret 7
      0.4323, // Fret 8
      0.4078, // Fret 9
      0.3843, // Fret 10
      0.3623, // Fret 11
      0.3407, // Fret 12
      0.3215, // Fret 13
      0.3023, // Fret 14
      0.2843, // Fret 15
      0.2673, // Fret 16
      0.2511, // Fret 17
      0.2362, // Fret 18
      0.2214, // Fret 19
      0.2078, // Fret 20
      0.1952, // Fret 21
      0.1827  // Fret 22
    ];

    // Dynamic Fret Gemstones (illuminated finger indicators during play)
    this.fretMarkers = [];
    for (let s = 0; s < 5; s++) {
      const markerGroup = new THREE.Group();
      markerGroup.visible = false;

      const padMaterial = new THREE.MeshStandardMaterial({
        color: 0xffa000,
        emissive: 0xff7700,
        emissiveIntensity: 1.8,
        transparent: true,
        opacity: 0.85
      });
      const pad = new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.014, 0.003), padMaterial);
      markerGroup.add(pad);

      const jewelMaterial = new THREE.MeshStandardMaterial({
        color: 0xffe277,
        emissive: 0xffaa00,
        emissiveIntensity: 2.8,
        roughness: 0.15,
        metalness: 0.5
      });
      const jewel = new THREE.Mesh(new THREE.SphereGeometry(0.0055, 12, 8), jewelMaterial);
      jewel.scale.set(1.0, 1.25, 0.6);
      jewel.position.z = 0.004;
      markerGroup.add(jewel);

      const haloMaterial = new THREE.MeshBasicMaterial({
        color: 0xffd033,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0
      });
      const halo = new THREE.Mesh(new THREE.RingGeometry(0.006, 0.015, 18), haloMaterial);
      halo.position.z = 0.005;
      markerGroup.add(halo);

      this.banjoModel.add(markerGroup);
      this.fretMarkers.push({ group: markerGroup, pad, jewel, halo });
    }
  }

  _getStringPositionAtY(stringIndex, y) {
    const cfg = BANJO_STRINGS[stringIndex];
    if (!cfg) return new THREE.Vector3();

    if (y <= cfg.bridge.y) {
      const t = Math.max(0, Math.min(1, (y - cfg.tail.y) / (cfg.bridge.y - cfg.tail.y)));
      return new THREE.Vector3().lerpVectors(cfg.tail, cfg.bridge, t);
    }

    if (y >= cfg.top.y) {
      const span = cfg.peg.y - cfg.top.y;
      if (Math.abs(span) < 0.0001) return cfg.top.clone();
      const t = Math.max(0, Math.min(1, (y - cfg.top.y) / span));
      return new THREE.Vector3().lerpVectors(cfg.top, cfg.peg, t);
    }

    const t = Math.max(0, Math.min(1, (y - cfg.bridge.y) / (cfg.top.y - cfg.bridge.y)));
    return new THREE.Vector3().lerpVectors(cfg.bridge, cfg.top, t);
  }

  _getStringXAtY(stringIndex, y) {
    return this._getStringPositionAtY(stringIndex, y).x;
  }

  _getStringZAtY(stringIndex, y) {
    return this._getStringPositionAtY(stringIndex, y).z;
  }

  _buildStrings() {
    this.strings = [];

    BANJO_STRINGS.forEach((cfg, s) => {
      const mat = this.stringMaterial.clone();

      // 1. Active Playing / Vibrating Segment (Bridge notch to Nut slot / 5th Fret Pip)
      const playMesh = createCylinderSegment(cfg.bridge, cfg.top, cfg.radius, mat);
      this.banjoModel.add(playMesh);

      // 2. Tailpiece Segment (Tailpiece anchor to Bridge notch)
      const tailMesh = createCylinderSegment(cfg.tail, cfg.bridge, cfg.radius, mat);
      this.banjoModel.add(tailMesh);

      // 3. Peghead Segment (Nut / Pip to Tuning Peg shaft)
      const pegMesh = createCylinderSegment(cfg.top, cfg.peg, cfg.radius * 0.9, mat);
      this.banjoModel.add(pegMesh);

      this.strings.push({
        mesh: playMesh,
        tailMesh,
        pegMesh,
        material: mat,
        basePosition: playMesh.position.clone(),
        baseZ: playMesh.position.z,
        vibrationAmp: 0,
        vibrationSpeed: 52 + s * 14,
        phase: Math.random() * Math.PI * 2
      });
    });
  }

  _buildPick() {
    const pickGroup = new THREE.Group();
    const p0 = this._getStringPositionAtY(1, -0.0275 + 0.035);
    pickGroup.position.set(p0.x, p0.y, p0.z + 0.004);

    const pickShape = new THREE.Shape();
    pickShape.moveTo(0, -0.011);
    pickShape.bezierCurveTo(0.008, -0.005, 0.011, 0.004, 0.004, 0.011);
    pickShape.bezierCurveTo(0.001, 0.015, -0.004, 0.010, -0.008, 0.003);
    pickShape.bezierCurveTo(-0.011, -0.002, -0.006, -0.008, 0, -0.011);

    const pickMesh = new THREE.Mesh(
      new THREE.ExtrudeGeometry(pickShape, { depth: 0.0018, bevelEnabled: false }),
      this.pickMaterial
    );
    pickMesh.rotation.z = 0.15;
    pickGroup.add(pickMesh);
    pickGroup.visible = false;

    this.pickGroup = pickGroup;
    this.banjoModel.add(pickGroup);
  }

  _buildBanjoStand() {
    const stand = new THREE.Group();

    // Weighted circular cast studio chrome base plate
    const base = new THREE.Mesh(
      new THREE.CylinderGeometry(0.14, 0.16, 0.04, 32),
      this.standBaseMaterial
    );
    base.position.y = 0.02;
    base.castShadow = true;
    base.receiveShadow = true;
    stand.add(base);

    // Chrome vertical mast
    const mast = new THREE.Mesh(
      new THREE.CylinderGeometry(0.014, 0.016, 1.0, 16),
      this.chromeMaterial
    );
    mast.castShadow = true;
    stand.add(mast);

    // Cradle holding the circular banjo pot securely
    const cradle = new THREE.Group();
    cradle.rotation.z = 0.32;

    const cradleBar = new THREE.Mesh(
      new THREE.CylinderGeometry(0.012, 0.012, 0.26, 12),
      this.chromeMaterial
    );
    cradleBar.rotation.z = Math.PI / 2;
    cradleBar.position.set(0, 0, -0.04);
    cradle.add(cradleBar);

    [-0.10, 0.10].forEach(x => {
      const paddedProng = new THREE.Mesh(
        new THREE.CylinderGeometry(0.016, 0.016, 0.16, 12),
        this.ebonyMaterial
      );
      paddedProng.rotation.x = Math.PI / 2;
      paddedProng.position.set(x, 0.02, 0.03);
      cradle.add(paddedProng);

      const prongTip = new THREE.Mesh(
        new THREE.SphereGeometry(0.020, 12, 8),
        this.ebonyMaterial
      );
      prongTip.position.set(x, 0.02, 0.11);
      cradle.add(prongTip);
    });

    stand.add(cradle);
    this.standGroup = stand;
    this.standMast = mast;
    this.standCradle = cradle;
    this.group.add(stand);
    this._syncBanjoStand();
  }

  _getFloorElevation() {
    const sceneMgr = this.scene?.userData?.sceneManager || window.app?.sceneManager;
    if (sceneMgr && typeof sceneMgr.getStageFloorElevation === 'function') {
      return sceneMgr.getStageFloorElevation(this.group.position.x, this.group.position.z);
    }
    return this.floorElevation ?? 0;
  }

  setFloorElevation(elevation) {
    this.floorElevation = elevation;
    this._syncBanjoStand();
  }

  _syncBanjoStand() {
    if (!this.standGroup) return;
    const floorElevation = this._getFloorElevation();
    const baseDiscThickness = 0.04;
    const cradleWorldY = Math.max(floorElevation + 0.35, this.group.position.y - 0.12);
    const cradleLocalY = cradleWorldY - floorElevation;
    const mastHeight = Math.max(0.15, cradleLocalY - baseDiscThickness);

    this.standGroup.position.y = floorElevation - this.group.position.y;
    this.standMast.scale.y = mastHeight;
    this.standMast.position.set(0, baseDiscThickness + mastHeight * 0.5, -0.04);
    this.standCradle.position.y = cradleLocalY;
  }

  onNoteOn(midiPitch, velocity = 0.8, eventTime, trackIndex, duration = 0.25) {
    const vel = Math.max(0.25, Math.min(1, velocity));
    const holdDuration = Math.max(0.08, Math.min(0.40, duration));

    // Calculate best banjo string & fret for incoming MIDI pitch:
    let bestString = 1;
    let bestFret = 0;
    let smallestFretDist = Infinity;

    for (let i = 4; i >= 0; i--) {
      const openPitch = this.stringTuningMidi[i];
      const candidateFret = midiPitch - openPitch;
      const maxFret = i === 0 ? 17 : 22;
      if (candidateFret >= 0 && candidateFret <= maxFret && candidateFret < smallestFretDist) {
        smallestFretDist = candidateFret;
        bestString = i;
        bestFret = candidateFret;
      }
    }

    // Light up fret finger press indicator
    const marker = this.fretMarkers?.[bestString];
    const absoluteFret = bestString === 0 ? bestFret + 5 : bestFret;
    if (marker && absoluteFret > 0 && this.fretYPositions[absoluteFret] !== undefined) {
      const fretY = (this.fretYPositions[absoluteFret - 1] + this.fretYPositions[absoluteFret]) * 0.5;
      const strPos = this._getStringPositionAtY(bestString, fretY);
      marker.group.position.set(strPos.x, fretY, strPos.z + 0.003);
      marker.group.visible = true;
      marker.group.scale.set(1.8, 1.8, 1.8);
      marker.pad.material.emissiveIntensity = 1.6 * vel;
      marker.jewel.material.emissiveIntensity = 2.8 * vel;
      marker.halo.material.opacity = 0.8 * vel;

      gsap.killTweensOf(marker.group.scale);
      gsap.killTweensOf(marker.pad.material);
      gsap.killTweensOf(marker.jewel.material);
      gsap.killTweensOf(marker.halo.material);

      gsap.to(marker.group.scale, { x: 1, y: 1, z: 1, duration: 0.12, ease: 'back.out(2.4)' });
      gsap.timeline()
        .to(marker.jewel.material, { emissiveIntensity: 1.2 * vel, duration: 0.22 })
        .to(marker.jewel.material, { emissiveIntensity: 0, duration: 0.38, ease: 'power2.out' });
      gsap.to(marker.pad.material, { emissiveIntensity: 0, duration: holdDuration + 0.35, ease: 'power2.out' });
      gsap.to(marker.halo.material, {
        opacity: 0,
        duration: holdDuration + 0.35,
        ease: 'power2.out',
        onComplete: () => { marker.group.visible = false; }
      });
    }

    // Animate fingerpick stroke
    if (this.pickGroup) {
      const pickY = -0.0275 + 0.035;
      const pickPos = this._getStringPositionAtY(bestString, pickY);
      this.strumDir = -this.strumDir;
      this.pickGroup.visible = true;
      gsap.killTweensOf(this.pickGroup.position);
      gsap.killTweensOf(this.pickGroup.rotation);

      gsap.timeline()
        .to(this.pickGroup.position, {
          x: pickPos.x,
          y: pickPos.y + this.strumDir * 0.010,
          z: pickPos.z + 0.002,
          duration: 0.04,
          ease: 'power2.in'
        })
        .to(this.pickGroup.rotation, { z: this.strumDir * 0.35, duration: 0.04, ease: 'power2.in' }, 0)
        .to(this.pickGroup.position, { y: pickPos.y, z: pickPos.z + 0.005, duration: 0.14, ease: 'power1.out' })
        .to(this.pickGroup.rotation, { z: 0, duration: 0.14, ease: 'power1.out' }, '-=0.14')
        .call(() => { this.pickGroup.visible = false; });
    }

    // Vibrate plucked string with warm golden emissive shimmer
    const string = this.strings[bestString];
    if (string) {
      string.material.emissive.setHex(0xffaa22);
      string.material.emissiveIntensity = 1.6 * vel;
      string.vibrationAmp = 0.0035 * vel;

      gsap.killTweensOf(string);
      gsap.killTweensOf(string.material);
      gsap.to(string, { vibrationAmp: 0, duration: holdDuration + 0.45, ease: 'power2.out' });
      gsap.to(string.material, { emissiveIntensity: 0, duration: holdDuration + 0.45, ease: 'power2.out' });
    }
  }

  onNotePrepare() {}
  onNoteOff() {}

  update(delta) {
    this._syncBanjoStand();

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
