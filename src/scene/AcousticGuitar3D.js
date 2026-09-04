import * as THREE from 'three';
import gsap from 'gsap';

/**
 * AcousticGuitar3D is a compact steel-string acoustic guitar for the MIDI
 * stage.  The model is intentionally built from simple, warm materials so it
 * remains readable beside the larger drum kit while still showing the details
 * that identify an acoustic guitar: spruce top, dark sides, rosette, bridge,
 * six strings and a slotted headstock.
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

    // Held-across-the-body posture: the guitar faces the audience while the
    // neck rises naturally instead of sitting perfectly horizontal.
    this.guitarModel.rotation.set(-0.20, -0.08, -1.20);
    this.guitarModel.position.y = -0.045;
    this.group.add(this.guitarModel);
    this._buildGuitarStand();
    this.scene.add(this.group);
  }

  _buildMaterials() {
    const variants = [0x98501f, 0x7f3f1a, 0xa85c25, 0x6f3519];
    const topColor = variants[(this.index - 1) % variants.length];
    this.spruceTexture = this._createSpruceTexture(topColor);
    this.topMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      map: this.spruceTexture,
      roughness: 0.46,
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
      color: 0x784522,
      roughness: 0.63,
      metalness: 0.0
    });
    this.creamMaterial = new THREE.MeshStandardMaterial({
      color: 0xf2e1b7,
      roughness: 0.38,
      metalness: 0.02
    });
    this.bindingMaterial = new THREE.MeshStandardMaterial({
      color: 0xe9d19b,
      roughness: 0.32,
      metalness: 0.02
    });
    this.rosetteMaterial = new THREE.MeshStandardMaterial({
      color: 0x6d2a14,
      roughness: 0.46,
      metalness: 0.06
    });
    this.rosetteAccentMaterial = new THREE.MeshStandardMaterial({
      color: 0xc28b34,
      roughness: 0.34,
      metalness: 0.18
    });
    this.headstockMaterial = new THREE.MeshStandardMaterial({
      color: 0x4a2418,
      roughness: 0.58,
      metalness: 0.0
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
      color: 0xd7c9ae,
      roughness: 0.30,
      metalness: 0.58,
      emissive: 0x000000,
      emissiveIntensity: 0
    });
    this.pickMaterial = new THREE.MeshStandardMaterial({
      color: 0xc17a38,
      roughness: 0.34,
      metalness: 0.08
    });
  }

  _buildGuitarStand() {
    const stand = new THREE.Group();

    // Use the same clean weighted-base language as the electric guitars.
    const base = new THREE.Mesh(
      new THREE.CylinderGeometry(0.14, 0.16, 0.04, 32),
      this.blackMaterial
    );
    base.position.y = 0.02;
    base.castShadow = true;
    base.receiveShadow = true;
    stand.add(base);

    const mast = new THREE.Mesh(
      new THREE.CylinderGeometry(0.014, 0.017, 1, 12),
      this.chromeMaterial
    );
    mast.castShadow = true;
    stand.add(mast);

    const cradle = new THREE.Group();
    // Follow the neck's rise while keeping both contacts on the asymmetric
    // lower bout; the waist-side contact must sit much closer to the mast.
    cradle.rotation.z = 0.36;

    const cradleBar = new THREE.Mesh(
      new THREE.CylinderGeometry(0.012, 0.012, 0.30, 10),
      this.chromeMaterial
    );
    cradleBar.rotation.z = Math.PI / 2;
    cradleBar.position.set(-0.10, 0, -0.08);
    cradle.add(cradleBar);

    [-0.23, 0.03].forEach((x) => {
      const paddedArm = new THREE.Mesh(
        new THREE.CylinderGeometry(0.021, 0.021, 0.19, 12),
        this.blackMaterial
      );
      paddedArm.rotation.x = Math.PI / 2;
      paddedArm.position.set(x, 0.03, 0.015);
      cradle.add(paddedArm);

      const stop = new THREE.Mesh(
        new THREE.SphereGeometry(0.028, 12, 8),
        this.blackMaterial
      );
      stop.scale.set(0.82, 1.2, 0.82);
      stop.position.set(x, 0.03, 0.11);
      cradle.add(stop);
    });

    stand.add(cradle);
    this.standGroup = stand;
    this.standMast = mast;
    this.standCradle = cradle;
    this.group.add(stand);
    this._syncGuitarStand();
  }

  _syncGuitarStand() {
    if (!this.standGroup) return;

    const floorY = 0.04;
    const cradleY = Math.max(0.44, this.group.position.y - 0.355);
    const mastHeight = cradleY - floorY;

    this.standGroup.position.y = -this.group.position.y;
    this.standMast.scale.y = mastHeight;
    this.standMast.position.set(0, floorY + mastHeight * 0.5, -0.08);
    this.standCradle.position.y = cradleY;
  }

  _createSpruceTexture(color) {
    const canvas = document.createElement('canvas');
    canvas.width = 384;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    const base = new THREE.Color(color);
    const light = base.clone().lerp(new THREE.Color(0xd58a3c), 0.24);
    const dark = base.clone().lerp(new THREE.Color(0x3f1b0b), 0.34);
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
    gradient.addColorStop(0, `#${dark.getHexString()}`);
    gradient.addColorStop(0.12, `#${base.getHexString()}`);
    gradient.addColorStop(0.50, `#${light.getHexString()}`);
    gradient.addColorStop(0.88, `#${base.getHexString()}`);
    gradient.addColorStop(1, `#${dark.getHexString()}`);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Long, slightly irregular grain lines make the soundboard look like
    // bookmatched spruce instead of a flat painted surface.
    for (let i = 0; i < 120; i++) {
      const normalized = (i / 119) * 2 - 1;
      const x = canvas.width * 0.5 + normalized * normalized * normalized * canvas.width * 0.48;
      const alpha = 0.035 + (Math.abs(normalized) * 0.075);
      ctx.strokeStyle = `rgba(82, 39, 12, ${alpha})`;
      ctx.lineWidth = i % 7 === 0 ? 1.3 : 0.55;
      ctx.beginPath();
      for (let y = 0; y <= canvas.height; y += 12) {
        const wave = Math.sin(y * 0.028 + i * 1.71) * (1.4 + Math.abs(normalized) * 2.6);
        if (y === 0) ctx.moveTo(x + wave, y);
        else ctx.lineTo(x + wave, y);
      }
      ctx.stroke();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.wrapS = THREE.ClampToEdgeWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    return texture;
  }

  _bodyShape() {
    const shape = new THREE.Shape();
    // Smooth dreadnought silhouette: broad lower bout, gentle waist and a
    // rounded upper bout instead of the pointed electric-guitar horns.
    shape.moveTo(0, -0.47);
    shape.bezierCurveTo(0.18, -0.47, 0.275, -0.36, 0.275, -0.23);
    shape.bezierCurveTo(0.275, -0.12, 0.225, -0.052, 0.170, -0.008);
    shape.bezierCurveTo(0.145, 0.024, 0.145, 0.072, 0.170, 0.112);
    // The upper bouts flow into a short, straight neck pocket. This mirrors
    // the uninterrupted rounded shoulders of a classical acoustic body.
    shape.bezierCurveTo(0.222, 0.170, 0.210, 0.250, 0.145, 0.292);
    shape.bezierCurveTo(0.105, 0.319, 0.070, 0.335, 0.039, 0.326);
    shape.lineTo(-0.039, 0.326);
    shape.bezierCurveTo(-0.070, 0.335, -0.105, 0.319, -0.145, 0.292);
    shape.bezierCurveTo(-0.210, 0.250, -0.222, 0.170, -0.170, 0.112);
    shape.bezierCurveTo(-0.145, 0.072, -0.145, 0.024, -0.170, -0.008);
    shape.bezierCurveTo(-0.225, -0.052, -0.275, -0.12, -0.275, -0.23);
    shape.bezierCurveTo(-0.275, -0.36, -0.18, -0.47, 0, -0.47);
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

    // Cream binding separates the spruce top from the darker sides and makes
    // the silhouette readable at the wide stage camera angle.
    const binding = new THREE.Mesh(new THREE.ExtrudeGeometry(shape, {
      depth: 0.006,
      bevelEnabled: false
    }), this.bindingMaterial);
    binding.position.z = 0.034;
    binding.scale.set(0.992, 0.992, 1);
    binding.castShadow = true;
    this.guitarModel.add(binding);

    // Thin spruce soundboard inset from the dark sides/back.
    const top = new THREE.Mesh(new THREE.ExtrudeGeometry(shape, {
      depth: 0.010,
      bevelEnabled: true,
      bevelSegments: 2,
      bevelSize: 0.004,
      bevelThickness: 0.002
    }), this.topMaterial);
    top.position.z = 0.041;
    top.scale.set(0.968, 0.968, 1);
    top.castShadow = true;
    this.guitarModel.add(top);

    const back = new THREE.Mesh(new THREE.ExtrudeGeometry(shape, { depth: 0.012, bevelEnabled: false }), this.backMaterial);
    back.position.z = -0.060;
    back.scale.set(0.965, 0.965, 1);
    this.guitarModel.add(back);

    // The end pin gives the body a small but recognizable physical detail
    // without introducing a distracting object under the guitar.
    const endPin = new THREE.Mesh(new THREE.CylinderGeometry(0.009, 0.012, 0.018, 12), this.chromeMaterial);
    endPin.position.set(0, -0.474, -0.006);
    this.guitarModel.add(endPin);
  }

  _buildNeckAndHeadstock() {
    const neckStartY = 0.18;
    const nutY = 0.80;
    const neckLength = nutY - neckStartY;
    const neckBack = new THREE.Mesh(new THREE.BoxGeometry(0.060, neckLength, 0.028), this.neckMaterial);
    // The neck overlaps the soundboard near its heel, so it must sit on top
    // of the body rather than disappear behind the front face.
    neckBack.position.set(0, (neckStartY + nutY) * 0.5, 0.040);
    neckBack.castShadow = true;
    this.guitarModel.add(neckBack);

    // A gently rounded heel transitions from the body into the neck, avoiding
    // the blocky join characteristic of the previous simplified model.
    const heel = new THREE.Mesh(new THREE.SphereGeometry(0.052, 16, 10), this.neckMaterial);
    heel.scale.set(0.74, 1.06, 0.50);
    heel.position.set(0, neckStartY - 0.010, 0.034);
    heel.castShadow = true;
    this.guitarModel.add(heel);

    const fretboardShape = new THREE.Shape();
    fretboardShape.moveTo(-0.039, neckStartY);
    fretboardShape.lineTo(0.039, neckStartY);
    fretboardShape.lineTo(0.032, nutY);
    fretboardShape.lineTo(-0.032, nutY);
    fretboardShape.closePath();
    const fretboard = new THREE.Mesh(new THREE.ExtrudeGeometry(fretboardShape, {
      depth: 0.008,
      bevelEnabled: false
    }), this.fretboardMaterial);
    fretboard.position.z = 0.054;
    this.guitarModel.add(fretboard);

    const fretWireMaterial = new THREE.MeshStandardMaterial({ color: 0xc9c6bd, roughness: 0.26, metalness: 0.8 });
    this.fretYPositions[0] = nutY;
    for (let fret = 1; fret <= 20; fret++) {
      const distance = neckLength * (1 - Math.pow(2, -fret / 12));
      const y = nutY - distance;
      this.fretYPositions[fret] = y;
      const progress = (y - neckStartY) / neckLength;
      const wireWidth = 0.064 + progress * 0.012;
      const wire = new THREE.Mesh(new THREE.BoxGeometry(wireWidth, 0.0025, 0.003), fretWireMaterial);
      wire.position.set(0, y, 0.064);
      this.guitarModel.add(wire);
    }

    [3, 5, 7, 9, 12, 15, 17, 19].forEach(fret => {
      const y = (this.fretYPositions[fret - 1] + this.fretYPositions[fret]) * 0.5;
      const dot = new THREE.Mesh(new THREE.CircleGeometry(0.005, 14), this.creamMaterial);
      dot.position.set(fret === 12 ? 0.016 : 0, y, 0.066);
      this.guitarModel.add(dot);
    });

    const nut = new THREE.Mesh(new THREE.BoxGeometry(0.070, 0.009, 0.010), this.creamMaterial);
    nut.position.set(0, nutY, 0.066);
    this.guitarModel.add(nut);

    // Classical 3 + 3 headstock, slightly wider than the nut and rounded at
    // the crown so it reads clearly in the vertical close-up.
    const headShape = new THREE.Shape();
    headShape.moveTo(-0.034, 0);
    headShape.lineTo(-0.052, 0.17);
    headShape.bezierCurveTo(-0.048, 0.225, -0.018, 0.255, 0, 0.268);
    headShape.bezierCurveTo(0.018, 0.255, 0.048, 0.225, 0.052, 0.17);
    headShape.lineTo(0.034, 0);
    headShape.closePath();
    const head = new THREE.Mesh(new THREE.ExtrudeGeometry(headShape, { depth: 0.034, bevelEnabled: true, bevelSize: 0.004, bevelThickness: 0.003 }), this.headstockMaterial);
    head.position.set(0, nutY, 0.035);
    this.guitarModel.add(head);

    // The two dark slots and the string runs make this unmistakably a
    // classical-style 3 + 3 headstock rather than a solid paddle.
    [-1, 1].forEach(side => {
      const slot = new THREE.Mesh(new THREE.BoxGeometry(0.014, 0.135, 0.003), this.blackMaterial);
      slot.position.set(side * 0.021, nutY + 0.135, 0.071);
      this.guitarModel.add(slot);
    });

    [-1, 1].forEach(side => {
      for (let i = 0; i < 3; i++) {
        const y = nutY + 0.052 + i * 0.055;
        const post = new THREE.Mesh(new THREE.CylinderGeometry(0.0035, 0.0035, 0.028, 10), this.chromeMaterial);
        post.rotation.x = Math.PI / 2;
        post.position.set(side * 0.047, y, 0.057);
        this.guitarModel.add(post);
        const key = new THREE.Mesh(new THREE.SphereGeometry(0.010, 12, 8), this.creamMaterial);
        key.scale.set(0.72, 1.18, 0.52);
        key.position.set(side * 0.060, y, 0.057);
        this.guitarModel.add(key);
      }
    });

    for (let stringIndex = 0; stringIndex < 6; stringIndex++) {
      const side = stringIndex < 3 ? -1 : 1;
      const keyIndex = stringIndex % 3;
      const startX = -0.026 + stringIndex * 0.0105;
      const startY = nutY + 0.007;
      const endX = side * 0.047;
      const endY = nutY + 0.052 + keyIndex * 0.055;
      const length = Math.hypot(endX - startX, endY - startY);
      const run = new THREE.Mesh(
        new THREE.CylinderGeometry(0.0011, 0.0011, length, 8),
        this.stringMaterial.clone()
      );
      run.position.set((startX + endX) * 0.5, (startY + endY) * 0.5, 0.076);
      run.rotation.z = -Math.atan2(endX - startX, endY - startY);
      this.guitarModel.add(run);
    }
  }

  _buildHardware() {
    // Soundhole and decorative rosette.
    const soundhole = new THREE.Mesh(new THREE.CircleGeometry(0.092, 40), this.blackMaterial);
    soundhole.position.set(0, -0.045, 0.058);
    this.guitarModel.add(soundhole);
    [
      [0.103, this.creamMaterial],
      [0.108, this.rosetteMaterial],
      [0.114, this.rosetteAccentMaterial],
      [0.120, this.rosetteMaterial]
    ].forEach(([radius, material], index) => {
      const ring = new THREE.Mesh(new THREE.RingGeometry(radius - 0.003, radius, 48), material);
      ring.position.set(0, -0.045, 0.060 + index * 0.001);
      this.guitarModel.add(ring);
    });

    // Small radial inlays between the rings echo a traditional classical
    // guitar rosette without covering the soundboard.
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2;
      const ornament = new THREE.Mesh(
        new THREE.BoxGeometry(0.006, 0.018, 0.003),
        i % 2 === 0 ? this.rosetteAccentMaterial : this.rosetteMaterial
      );
      ornament.position.set(
        Math.cos(angle) * 0.114,
        -0.045 + Math.sin(angle) * 0.114,
        0.064
      );
      ornament.rotation.z = angle;
      this.guitarModel.add(ornament);
    }

    const bridge = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.040, 0.012), this.blackMaterial);
    bridge.position.set(0, -0.305, 0.058);
    this.guitarModel.add(bridge);
    const saddle = new THREE.Mesh(new THREE.BoxGeometry(0.116, 0.006, 0.006), this.creamMaterial);
    saddle.position.set(0, -0.305, 0.067);
    this.guitarModel.add(saddle);
    for (let pin = 0; pin < 6; pin++) {
      const pinMesh = new THREE.Mesh(new THREE.SphereGeometry(0.005, 10, 8), this.creamMaterial);
      pinMesh.position.set(-0.050 + pin * 0.020, -0.320, 0.067);
      this.guitarModel.add(pinMesh);
    }
  }

  _buildStrings() {
    const bridgeY = -0.305;
    const nutY = 0.80;
    // A real string plane follows the neck angle: it sits a little higher at
    // the bridge, then comes down to just clear the frets at the nut. Keeping
    // it horizontal made the neck look recessed from the strings.
    const bridgeZ = 0.078;
    const nutZ = 0.073;
    const spanY = nutY - bridgeY;
    const gauges = [0.0034, 0.0028, 0.0023, 0.0017, 0.00135, 0.0011];
    for (let s = 0; s < 6; s++) {
      const bridgeX = -0.042 + s * 0.0165;
      const nutX = -0.026 + s * 0.0105;
      const midX = (bridgeX + nutX) * 0.5;
      const length = Math.hypot(nutX - bridgeX, spanY, nutZ - bridgeZ);
      const mesh = new THREE.Mesh(new THREE.CylinderGeometry(gauges[s], gauges[s], length, 8), this.stringMaterial.clone());
      mesh.position.set(midX, (bridgeY + nutY) * 0.5, (bridgeZ + nutZ) * 0.5);
      mesh.quaternion.setFromUnitVectors(
        new THREE.Vector3(0, 1, 0),
        new THREE.Vector3(nutX - bridgeX, spanY, nutZ - bridgeZ).normalize()
      );
      this.guitarModel.add(mesh);
      this.strings.push({ mesh, material: mesh.material, baseZ: (bridgeZ + nutZ) * 0.5, vibrationAmp: 0, vibrationSpeed: 42 + s * 11, phase: Math.random() * Math.PI * 2 });
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

      group.position.z = 0.067;
      this.guitarModel.add(group);
      this.fretMarkers.push({ group, pad, jewel, halo });
    }
  }

  _getStringXAtY(index, y) {
    const bridgeY = -0.305;
    const nutY = 0.80;
    const t = (y - bridgeY) / (nutY - bridgeY);
    return (-0.042 + index * 0.0165) + t * ((-0.026 + index * 0.0105) - (-0.042 + index * 0.0165));
  }

  _buildPick() {
    const group = new THREE.Group();
    group.position.set(0, -0.115, 0.092);
    const shape = new THREE.Shape();
    shape.moveTo(0, -0.016);
    shape.bezierCurveTo(0.012, -0.008, 0.015, 0.006, 0.006, 0.015);
    shape.bezierCurveTo(0.001, 0.021, -0.006, 0.014, -0.012, 0.005);
    shape.bezierCurveTo(-0.016, -0.003, -0.009, -0.012, 0, -0.016);
    const mesh = new THREE.Mesh(new THREE.ExtrudeGeometry(shape, { depth: 0.002, bevelEnabled: false }), this.pickMaterial);
    mesh.rotation.z = 0.12;
    group.add(mesh);
    group.visible = false;
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
      this.pickGroup.visible = true;
      this.pickTimeline?.kill();
      gsap.killTweensOf(this.pickGroup.position);
      gsap.killTweensOf(this.pickGroup.rotation);
      this.pickTimeline = gsap.timeline()
        .to(this.pickGroup.position, { x, y: -0.115 + this.strumDir * 0.014, z: 0.082, duration: 0.045, ease: 'power2.in' })
        .to(this.pickGroup.rotation, { z: this.strumDir * 0.42, duration: 0.045, ease: 'power2.in' }, 0)
        .to(this.pickGroup.position, { y: -0.115, z: 0.092, duration: 0.16, ease: 'power1.out' })
        .to(this.pickGroup.rotation, { z: 0, duration: 0.16, ease: 'power1.out' }, '-=0.16')
        .call(() => { this.pickGroup.visible = false; });
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
    this._syncGuitarStand();

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
