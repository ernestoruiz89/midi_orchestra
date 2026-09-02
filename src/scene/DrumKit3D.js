import * as THREE from 'three';
import gsap from 'gsap';

/**
 * DrumKit3D: 100% Authentic MIDIJam Concert Drum Kit
 * - Zero intersection / zero clipping: each drum and cymbal has clean physical air clearance.
 * - Centered horizontally on the drum riser and aligned parallel with the stage platform edge.
 * - 22" Bass drum centered with front-mounted pedal and beater.
 * - 4 Mounted Rack Toms in an iconic crown arc over the bass drum (Tom 1, Tom 2, Tom 3, Tom 4).
 * - 2 Deep Floor Toms on the right (Floor Tom 1, Floor Tom 2).
 * - Snare drum mounted in front-left with clear clearance from bass drum.
 * - Hi-Hat mounted on the lower-left.
 * - 6 Floating Cymbals (Crash 1, Crash 2, Splash, Center Crash, Ride, China with inverted lip) + Hi-Hat.
 * - All drumheads stamped with crisp black 'BLAMO' logo.
 * - Signature resting drumstick diagonally across snare/kick rim.
 * - Active striking drumsticks fanning out radially from the drummer's center.
 */
export class DrumKit3D {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();

    // Centered on the elevated drum riser platform (y = 0.20, z = -0.60)
    this.group.position.set(0, 0.20, -0.60);

    this.cymbals = {};
    this.drumHeads = {};
    this.pieceTargets = {};
    this.pieceSticks = {};
    this.beaterPivot = null;
    this.lastSnareHitTime = 0;
    this.currentSnareIndex = 0;

    this._buildMaterials();
    this._buildBassDrum();
    this._buildRackToms();
    this._buildFloorToms();
    this._buildSnare();
    this._buildHiHat();
    this._buildCymbals();
    this._buildDedicatedPieceSticks();
    this._buildRestingStick();

    this.scene.add(this.group);
  }

  _buildMaterials() {
    // Shell: Iconic MIDIJam Gloss Vermilion Red Lacquer (#e23816)
    this.shellMaterial = new THREE.MeshStandardMaterial({
      color: 0xe23816,
      roughness: 0.22,
      metalness: 0.12
    });

    // Mirror Polished Chrome Hardware (hoops, lugs, pedal, cymbal crowns)
    this.chromeMaterial = new THREE.MeshStandardMaterial({
      color: 0xf5f5f7,
      roughness: 0.06,
      metalness: 0.96
    });

    // Coated White Batter Drumheads
    this.headMaterial = new THREE.MeshStandardMaterial({
      color: 0xf8f8f5,
      roughness: 0.38,
      metalness: 0.02
    });

    // Cast Bronze Cymbals with Warm Lathed Sheen (DoubleSide to prevent culling)
    this.cymbalMaterial = new THREE.MeshStandardMaterial({
      color: 0xf4dd9b,
      roughness: 0.34,
      metalness: 0.65,
      side: THREE.DoubleSide
    });

    // Hickory Wood Drumsticks
    this.stickMaterial = new THREE.MeshStandardMaterial({
      color: 0xd8b584,
      roughness: 0.45,
      metalness: 0.0
    });

    // Black Hardware & Beater Accent
    this.blackTrimMaterial = new THREE.MeshStandardMaterial({
      color: 0x18181c,
      roughness: 0.55,
      metalness: 0.2
    });

    // Pre-create 'MIDI' drumhead textures
    this.midiKickTexture = this._createMidiHeadTexture(56, 160);
    this.midiHeadTexture = this._createMidiHeadTexture(42, 120);
  }

  /**
   * Generates crisp 512x512 Canvas texture with the 'MIDI' logo
   */
  _createMidiHeadTexture(fontSize = 42, textY = 120) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // Clean warm off-white resonant drumhead
    ctx.fillStyle = '#f6f6f2';
    ctx.beginPath();
    ctx.arc(256, 256, 254, 0, Math.PI * 2);
    ctx.fill();

    // Subtle edge perimeter ring
    ctx.strokeStyle = '#d6d6ce';
    ctx.lineWidth = 4;
    ctx.stroke();

    // Bold 'MIDI' Logo
    ctx.fillStyle = '#1c1c22';
    ctx.font = `900 ${fontSize}px "Arial Black", "Trebuchet MS", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('MIDI', 256, textY);

    const texture = new THREE.CanvasTexture(canvas);
    texture.anisotropy = 8;
    return texture;
  }

  /**
   * 22"x18" Bass Drum: Dead-center, aligned parallel with the front platform edge
   */
  _buildBassDrum() {
    const radius = 0.48;
    const depth = 0.44;

    const bassGroup = new THREE.Group();
    bassGroup.position.set(0, 0.50, -depth / 2);
    bassGroup.rotation.y = 0;

    // Shell cylinder running along Z axis
    const shellGeom = new THREE.CylinderGeometry(radius, radius, depth, 36, 1, true);
    shellGeom.rotateX(Math.PI / 2);
    const shell = new THREE.Mesh(shellGeom, this.shellMaterial);
    shell.castShadow = true;
    bassGroup.add(shell);

    // Front & Back Chrome/White Hoops
    [-depth / 2, depth / 2].forEach(z => {
      const hoop = new THREE.Mesh(
        new THREE.TorusGeometry(radius + 0.012, 0.016, 12, 36),
        this.chromeMaterial
      );
      hoop.position.z = z;
      bassGroup.add(hoop);
    });

    // 10 Chrome Tension Lugs
    for (let i = 0; i < 10; i++) {
      const angle = (i * Math.PI * 2) / 10;
      const lx = Math.cos(angle) * (radius + 0.01);
      const ly = Math.sin(angle) * (radius + 0.01);

      const lug = new THREE.Mesh(
        new THREE.BoxGeometry(0.024, 0.024, depth * 0.75),
        this.chromeMaterial
      );
      lug.position.set(lx, ly, 0);
      lug.rotation.z = angle;
      bassGroup.add(lug);
    }

    // Front Resonant Head with 'MIDI' Logo
    const frontHeadMat = new THREE.MeshStandardMaterial({
      map: this.midiKickTexture,
      roughness: 0.35,
      metalness: 0.02
    });
    const frontHeadGeom = new THREE.CircleGeometry(radius - 0.005, 36);
    const frontHead = new THREE.Mesh(frontHeadGeom, frontHeadMat);
    frontHead.position.z = depth / 2 + 0.003;
    bassGroup.add(frontHead);

    // Back Batter Head
    const backHeadGeom = new THREE.CircleGeometry(radius - 0.005, 36);
    backHeadGeom.rotateY(Math.PI);
    const backHead = new THREE.Mesh(backHeadGeom, this.headMaterial.clone());
    backHead.position.z = -depth / 2 - 0.003;
    bassGroup.add(backHead);

    this.drumHeads.kick = frontHead;
    this.drumHeads.kickFront = frontHead;

    // Telescoping Front Spurs / Legs
    [-0.48, 0.48].forEach(xOffset => {
      const spur = new THREE.Mesh(
        new THREE.CylinderGeometry(0.015, 0.012, 0.48, 12),
        this.chromeMaterial
      );
      spur.position.set(xOffset * 1.05, -0.24, depth * 0.28);
      spur.rotation.z = xOffset > 0 ? -0.52 : 0.52;
      spur.rotation.x = -0.32;
      bassGroup.add(spur);

      const foot = new THREE.Mesh(
        new THREE.SphereGeometry(0.022, 8, 8),
        this.blackTrimMaterial
      );
      foot.position.set(xOffset > 0 ? 0.68 : -0.68, -0.46, depth * 0.42);
      bassGroup.add(foot);
    });

    // Front Kick Pedal centered on the front resonant head
    const pedalGroup = new THREE.Group();
    pedalGroup.position.set(0, -0.44, depth / 2 + 0.08);

    const basePlate = new THREE.Mesh(
      new THREE.BoxGeometry(0.14, 0.02, 0.26),
      this.chromeMaterial
    );
    pedalGroup.add(basePlate);

    const uprightL = new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.22, 0.02), this.chromeMaterial);
    uprightL.position.set(-0.06, 0.11, -0.04);
    pedalGroup.add(uprightL);

    const uprightR = new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.22, 0.02), this.chromeMaterial);
    uprightR.position.set(0.06, 0.11, -0.04);
    pedalGroup.add(uprightR);

    const footboard = new THREE.Mesh(new THREE.BoxGeometry(0.10, 0.012, 0.20), this.chromeMaterial);
    footboard.position.set(0, 0.06, 0.04);
    footboard.rotation.x = 0.18;
    pedalGroup.add(footboard);

    // Beater pivot and rod reaching up to strike center of drumhead
    const beaterPivot = new THREE.Group();
    beaterPivot.position.set(0, 0.18, -0.04);

    const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.26, 8), this.chromeMaterial);
    rod.position.y = 0.13;
    beaterPivot.add(rod);

    const hammer = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.04, 16), this.blackTrimMaterial);
    hammer.rotation.z = Math.PI / 2;
    hammer.position.set(0, 0.26, 0);
    beaterPivot.add(hammer);

    // Ready rest angle
    beaterPivot.rotation.x = 0.38;

    pedalGroup.add(beaterPivot);
    bassGroup.add(pedalGroup);
    this.beaterPivot = beaterPivot;

    this.group.add(bassGroup);
    this.pieceTargets.kick = new THREE.Vector3(0, 0.46, 0);
  }

  /**
   * Helper to build a complete drum cylinder with hoops, lugs, and 'BLAMO' head
   */
  _createDrumMesh(radius, depth, hasBottomHead = true) {
    const group = new THREE.Group();

    // Shell
    const shell = new THREE.Mesh(
      new THREE.CylinderGeometry(radius, radius, depth, 28),
      this.shellMaterial
    );
    shell.castShadow = true;
    group.add(shell);

    // Top Batter Head with MIDI logo
    const topHeadMat = new THREE.MeshStandardMaterial({
      map: this.midiHeadTexture,
      roughness: 0.38,
      metalness: 0.02
    });
    const topHead = new THREE.Mesh(
      new THREE.CircleGeometry(radius - 0.003, 28).rotateX(-Math.PI / 2),
      topHeadMat
    );
    topHead.position.y = depth / 2 + 0.002;
    group.add(topHead);

    // Top Chrome Hoop
    const topHoop = new THREE.Mesh(
      new THREE.TorusGeometry(radius + 0.006, 0.008, 8, 28).rotateX(Math.PI / 2),
      this.chromeMaterial
    );
    topHoop.position.y = depth / 2;
    group.add(topHoop);

    // Bottom Hoop and Head
    if (hasBottomHead) {
      const btmHead = new THREE.Mesh(
        new THREE.CircleGeometry(radius - 0.003, 28).rotateX(Math.PI / 2),
        this.headMaterial.clone()
      );
      btmHead.position.y = -depth / 2 - 0.002;
      group.add(btmHead);

      const btmHoop = new THREE.Mesh(
        new THREE.TorusGeometry(radius + 0.006, 0.008, 8, 28).rotateX(Math.PI / 2),
        this.chromeMaterial
      );
      btmHoop.position.y = -depth / 2;
      group.add(btmHoop);
    }

    // 6 Chrome tension lugs around shell
    for (let i = 0; i < 6; i++) {
      const angle = (i * Math.PI * 2) / 6;
      const lx = Math.cos(angle) * (radius + 0.005);
      const lz = Math.sin(angle) * (radius + 0.005);

      const lug = new THREE.Mesh(
        new THREE.BoxGeometry(0.014, depth * 0.7, 0.014),
        this.chromeMaterial
      );
      lug.position.set(lx, 0, lz);
      lug.rotation.y = -angle;
      group.add(lug);
    }

    return { group, head: topHead };
  }

  /**
   * Builds the 4 Crown Mounted Rack Toms with clear air clearance above the bass drum
   */
  _buildRackToms() {
    const tomConfigs = [
      // 1. Tom 1 (Smallest 8" - Far Left, mounted beside bass drum)
      {
        id: 'tom1',
        radius: 0.11,
        depth: 0.13,
        pos: [-0.60, 1.00, -0.06],
        rot: [0.36, 0.40, -0.20]
      },
      // 2. Tom 2 (10" - Left Center above left shoulder of bass drum)
      {
        id: 'tom2',
        radius: 0.14,
        depth: 0.15,
        pos: [-0.32, 1.18, -0.12],
        rot: [0.40, 0.22, -0.12]
      },
      // 3. Tom 3 (12" - Peak Center above bass drum)
      {
        id: 'tom3',
        radius: 0.17,
        depth: 0.16,
        pos: [0.00, 1.24, -0.16],
        rot: [0.42, 0.00, 0.00]
      },
      // 4. Tom 4 (13" - Right Center above right shoulder of bass drum)
      {
        id: 'tom4',
        radius: 0.18,
        depth: 0.18,
        pos: [0.35, 1.16, -0.14],
        rot: [0.38, -0.24, 0.14]
      }
    ];

    tomConfigs.forEach(cfg => {
      const { group, head } = this._createDrumMesh(cfg.radius, cfg.depth, true);
      group.position.set(cfg.pos[0], cfg.pos[1], cfg.pos[2]);
      group.rotation.set(cfg.rot[0], cfg.rot[1], cfg.rot[2]);

      this.group.add(group);
      this.drumHeads[cfg.id] = head;
      this.pieceTargets[cfg.id] = new THREE.Vector3(cfg.pos[0], cfg.pos[1] + 0.08, cfg.pos[2]);
    });
  }

  /**
   * Builds the 2 Deep Floor Toms on the right with clear clearance between each other and bass drum
   */
  _buildFloorToms() {
    const floorConfigs = [
      // 1. Floor Tom 1 (14" - Inner Floor Tom)
      {
        id: 'floorTom1',
        radius: 0.22,
        depth: 0.28,
        pos: [0.66, 0.60, 0.08],
        rot: [0.22, -0.18, 0.10]
      },
      // 2. Floor Tom 2 (16" - Outer Low Floor Tom)
      {
        id: 'floorTom2',
        radius: 0.25,
        depth: 0.34,
        pos: [1.06, 0.50, 0.38],
        rot: [0.18, -0.26, 0.14]
      }
    ];

    floorConfigs.forEach(cfg => {
      const { group, head } = this._createDrumMesh(cfg.radius, cfg.depth, true);
      group.position.set(cfg.pos[0], cfg.pos[1], cfg.pos[2]);
      group.rotation.set(cfg.rot[0], cfg.rot[1], cfg.rot[2]);

      // 3 Chrome Floor Legs with rubber feet
      for (let i = 0; i < 3; i++) {
        const legAngle = (i * Math.PI * 2) / 3 + 0.3;
        const lx = Math.cos(legAngle) * (cfg.radius + 0.02);
        const lz = Math.sin(legAngle) * (cfg.radius + 0.02);

        const leg = new THREE.Mesh(
          new THREE.CylinderGeometry(0.008, 0.008, cfg.depth + 0.28, 8),
          this.chromeMaterial
        );
        leg.position.set(lx, -0.12, lz);
        group.add(leg);

        const foot = new THREE.Mesh(
          new THREE.SphereGeometry(0.016, 8, 8),
          this.blackTrimMaterial
        );
        foot.position.set(lx, -cfg.depth / 2 - 0.24, lz);
        group.add(foot);
      }

      this.group.add(group);
      this.drumHeads[cfg.id] = head;
      this.pieceTargets[cfg.id] = new THREE.Vector3(cfg.pos[0], cfg.pos[1] + 0.12, cfg.pos[2]);
    });
  }

  /**
   * Builds the Snare Drum in front-left with clear space in front of the bass drum
   */
  _buildSnare() {
    const snareGroup = new THREE.Group();
    // Positioned at z = 0.42, well in front of the bass drum (z = 0.00) with zero clipping
    snareGroup.position.set(-0.42, 0.48, 0.42);
    snareGroup.rotation.set(0.24, 0.22, -0.08);

    const radius = 0.20;
    const depth = 0.13;

    const { group: snareMeshGroup, head } = this._createDrumMesh(radius, depth, true);
    snareGroup.add(snareMeshGroup);

    // Chrome Snare Tripod Stand
    const stand = new THREE.Group();
    const centralColumn = new THREE.Mesh(
      new THREE.CylinderGeometry(0.012, 0.012, 0.44, 8),
      this.chromeMaterial
    );
    centralColumn.position.y = -0.26;
    stand.add(centralColumn);

    for (let i = 0; i < 3; i++) {
      const legAngle = (i * Math.PI * 2) / 3;
      const leg = new THREE.Mesh(
        new THREE.CylinderGeometry(0.008, 0.008, 0.30, 8),
        this.chromeMaterial
      );
      leg.position.set(Math.cos(legAngle) * 0.12, -0.38, Math.sin(legAngle) * 0.12);
      leg.rotation.z = Math.cos(legAngle) * 0.5;
      leg.rotation.x = Math.sin(legAngle) * 0.5;
      stand.add(leg);
    }
    snareGroup.add(stand);

    this.group.add(snareGroup);
    this.drumHeads.snare = head;
    this.pieceTargets.snare = new THREE.Vector3(-0.42, 0.55, 0.42);
  }

  /**
   * Builds Hi-Hat cymbals on the far lower-left with clear clearance
   */
  _buildHiHat() {
    const hihatGroup = new THREE.Group();
    hihatGroup.position.set(-0.82, 0.68, 0.35);
    hihatGroup.rotation.set(0.12, 0.32, -0.08);

    // Bottom Cymbal
    const bottom = this._createCymbalMesh(0.22, true);
    hihatGroup.add(bottom);

    // Top Cymbal with clutch
    const topPivot = new THREE.Group();
    topPivot.position.y = 0.025;

    const top = this._createCymbalMesh(0.22, false);
    topPivot.add(top);

    const clutch = new THREE.Mesh(
      new THREE.CylinderGeometry(0.012, 0.012, 0.06, 12),
      this.chromeMaterial
    );
    clutch.position.y = 0.035;
    topPivot.add(clutch);

    hihatGroup.add(topPivot);
    this.cymbals.hihat = topPivot;
    this.pieceTargets.hihat = new THREE.Vector3(-0.82, 0.72, 0.35);

    // Chrome Hi-Hat Stand
    const stand = new THREE.Mesh(
      new THREE.CylinderGeometry(0.012, 0.012, 0.65, 8),
      this.chromeMaterial
    );
    stand.position.y = -0.32;
    hihatGroup.add(stand);

    this.group.add(hihatGroup);
  }

  /**
   * Builds the circular canopy of 6 upper cymbals with clean physical spacing:
   * 1. Crash 1 (Left Mid)
   * 2. Crash 2 (Left High)
   * 3. Splash (Center-Left High)
   * 4. Center-Right Crash (Center-Right High)
   * 5. Ride (Right High)
   * 6. China (Far Right with Inverted Lip)
   */
  _buildCymbals() {
    const cymbalConfigs = [
      // 1. Crash 1 (16" - Left Mid)
      {
        id: 'crash1',
        radius: 0.32,
        pos: [-1.05, 1.25, 0.05],
        rot: [0.28, 0.42, -0.16],
        isChina: false
      },
      // 2. Crash 2 (18" - Left High)
      {
        id: 'crash2',
        radius: 0.34,
        pos: [-0.80, 1.58, -0.28],
        rot: [0.32, 0.28, -0.12],
        isChina: false
      },
      // 3. Splash (8" - Center-Left Small)
      {
        id: 'splash1',
        radius: 0.16,
        pos: [-0.35, 1.68, -0.42],
        rot: [0.28, 0.12, -0.04],
        isChina: false
      },
      // 4. Center-Right Crash (18" - Center-Right High)
      {
        id: 'splash2',
        radius: 0.34,
        pos: [0.28, 1.66, -0.44],
        rot: [0.28, -0.10, 0.04],
        isChina: false
      },
      // 5. Ride (20" - Right High)
      {
        id: 'ride',
        radius: 0.38,
        pos: [0.80, 1.48, -0.22],
        rot: [0.26, -0.26, 0.10],
        isChina: false
      },
      // 6. China / Crash 3 (18" Inverted Flared Edge - Far Right)
      {
        id: 'china',
        radius: 0.36,
        pos: [1.20, 1.20, 0.12],
        rot: [0.24, -0.38, 0.18],
        isChina: true
      }
    ];

    cymbalConfigs.forEach(cfg => {
      const cGroup = new THREE.Group();
      cGroup.position.set(cfg.pos[0], cfg.pos[1], cfg.pos[2]);

      const cPivot = new THREE.Group();
      const cMesh = this._createCymbalMesh(cfg.radius, false, cfg.isChina);
      cMesh.rotation.set(cfg.rot[0], cfg.rot[1], cfg.rot[2]);
      cPivot.add(cMesh);
      cGroup.add(cPivot);

      this.cymbals[cfg.id] = cPivot;
      this.pieceTargets[cfg.id] = new THREE.Vector3(cfg.pos[0], cfg.pos[1] + 0.05, cfg.pos[2]);
      this.group.add(cGroup);
    });
  }

  /**
   * Helper to create shallow cone cymbal mesh with bell dome and optional flared China lip
   */
  _createCymbalMesh(radius, inverted = false, isChina = false) {
    const group = new THREE.Group();

    // Shallow cone body
    const bodyGeom = new THREE.ConeGeometry(radius, 0.038, 36, 1, true);
    if (!inverted) {
      bodyGeom.rotateX(Math.PI);
    }
    const body = new THREE.Mesh(bodyGeom, this.cymbalMaterial);
    group.add(body);

    // Center Bell Dome
    const bellGeom = new THREE.SphereGeometry(radius * 0.24, 18, 12, 0, Math.PI * 2, 0, Math.PI / 2);
    const bell = new THREE.Mesh(bellGeom, this.cymbalMaterial);
    bell.position.y = inverted ? -0.006 : 0.006;
    if (inverted) bell.rotation.x = Math.PI;
    group.add(bell);

    // Inverted flared outer edge for China cymbal
    if (isChina) {
      const chinaLipGeom = new THREE.TorusGeometry(radius, 0.016, 8, 36);
      chinaLipGeom.rotateX(Math.PI / 2);
      const chinaLip = new THREE.Mesh(chinaLipGeom, this.cymbalMaterial);
      chinaLip.position.y = 0.02;
      group.add(chinaLip);
    }

    // Top Chrome Washer & Wingnut
    const washer = new THREE.Mesh(
      new THREE.CylinderGeometry(0.016, 0.016, 0.018, 12),
      this.chromeMaterial
    );
    washer.position.y = 0.022;
    group.add(washer);

    return group;
  }

  /**
   * Dedicated Drumsticks System ("circular hacia el publico y las baquetas tambien"):
   * All drumsticks radiate outward from the drummer's center (0, 0.50, 0.38)
   * pointing outward in a circular fan towards each drumhead and cymbal!
   */
  _buildDedicatedPieceSticks() {
    const drummerOrigin = new THREE.Vector3(0, 0.50, 0.38);

    const pieces = [
      'snare',
      'snare_2',
      'tom1',
      'tom2',
      'tom3',
      'tom4',
      'floorTom1',
      'floorTom2',
      'hihat',
      'crash1',
      'crash2',
      'splash1',
      'splash2',
      'ride',
      'china'
    ];

    pieces.forEach(id => {
      const targetId = (id === 'snare_2') ? 'snare' : id;
      const target = this.pieceTargets[targetId];
      if (!target) return;

      const stickData = this._createDedicatedStickMesh(target, drummerOrigin, id === 'snare_2');
      this.pieceSticks[id] = stickData;
      this.group.add(stickData.pivot);
    });
  }

  _createDedicatedStickMesh(targetPos, drummerOrigin, isAlternateSnare = false) {
    const pivot = new THREE.Group();
    pivot.position.copy(targetPos);

    // Direction vector from drummer center to target
    const dir = new THREE.Vector3().subVectors(targetPos, drummerOrigin).normalize();
    const yaw = Math.atan2(dir.x, dir.z);
    const pitch = 0.36;

    // Rotate pivot so stick points along the radial vector towards the drum
    pivot.rotation.y = yaw;
    pivot.rotation.x = isAlternateSnare ? -pitch * 0.9 : pitch;

    const stickArm = new THREE.Group();

    // Hickory shaft (0.38m length, tapering backward toward the drummer)
    const shaftGeom = new THREE.CylinderGeometry(0.005, 0.012, 0.38, 10);
    shaftGeom.rotateX(Math.PI / 2);
    const shaft = new THREE.Mesh(shaftGeom, this.stickMaterial);
    shaft.position.z = -0.19; // Extends backward toward drummer
    shaft.castShadow = true;
    stickArm.add(shaft);

    // Acorn tip at origin of stickArm
    const tipGeom = new THREE.SphereGeometry(0.009, 8, 8);
    const tip = new THREE.Mesh(tipGeom, this.stickMaterial);
    stickArm.add(tip);

    pivot.add(stickArm);

    // Hidden until struck
    pivot.visible = false;

    return {
      pivot,
      stickArm,
      initialPitch: pitch
    };
  }

  /**
   * Signature MIDIJam Resting Stick (matching media_1788369383722.png):
   * Resting gently on the snare rim pointing diagonally toward the kick pedal
   */
  _buildRestingStick() {
    const restingGroup = new THREE.Group();
    restingGroup.position.set(-0.24, 0.44, 0.28);
    restingGroup.rotation.set(0.32, -0.62, 0.52);

    const shaftGeom = new THREE.CylinderGeometry(0.006, 0.012, 0.38, 10);
    shaftGeom.rotateX(Math.PI / 2);
    const shaft = new THREE.Mesh(shaftGeom, this.stickMaterial);
    shaft.position.z = -0.19;
    shaft.castShadow = true;
    restingGroup.add(shaft);

    // Red ring trim detail near butt end
    const ringGeom = new THREE.CylinderGeometry(0.0125, 0.0125, 0.012, 10);
    ringGeom.rotateX(Math.PI / 2);
    const ring = new THREE.Mesh(ringGeom, new THREE.MeshStandardMaterial({ color: 0xcc2222 }));
    ring.position.z = -0.32;
    restingGroup.add(ring);

    const tipGeom = new THREE.SphereGeometry(0.009, 8, 8);
    const tip = new THREE.Mesh(tipGeom, this.stickMaterial);
    restingGroup.add(tip);

    this.group.add(restingGroup);
  }

  /**
   * Note-On Event Trigger: triggers dedicated stick strike and piece feedback
   */
  onNoteOn(pitchOrPiece, velocity = 0.8) {
    let piece = pitchOrPiece;
    if (typeof pitchOrPiece === 'number') {
      piece = this._mapPitchToPiece(pitchOrPiece);
    }

    const vel = Math.max(0.4, Math.min(1.0, velocity));

    if (piece === 'kick') {
      this._animateKick(vel);
      return;
    }

    // Alternate hands for rapid snare rolls
    let stickKey = piece;
    if (piece === 'snare') {
      const now = performance.now();
      if (now - this.lastSnareHitTime < 240) {
        this.currentSnareIndex = 1 - this.currentSnareIndex;
        stickKey = this.currentSnareIndex === 1 ? 'snare_2' : 'snare';
      } else {
        this.currentSnareIndex = 0;
        stickKey = 'snare';
      }
      this.lastSnareHitTime = now;
    }

    // 1. Strike Down Dedicated Radial Stick
    const stickData = this.pieceSticks[stickKey];
    if (stickData) {
      stickData.pivot.visible = true;
      gsap.killTweensOf(stickData.stickArm.rotation);
      gsap.killTweensOf(stickData.pivot);

      stickData.stickArm.rotation.x = -0.38 * vel;

      gsap.timeline()
        .to(stickData.stickArm.rotation, {
          x: 0.12 * vel,
          duration: 0.038,
          ease: 'power3.in'
        })
        .to(stickData.stickArm.rotation, {
          x: -0.22 * vel,
          duration: 0.08,
          ease: 'power2.out'
        })
        .to(stickData.stickArm.rotation, {
          x: 0,
          duration: 0.12,
          ease: 'power1.inOut'
        })
        .call(() => {
          stickData.pivot.visible = false;
        });
    }

    // 2. Animate Drumhead or Cymbal
    const head = this.drumHeads[piece];
    if (head) {
      this._flashDrumHead(head, 0xfff0aa, vel);
    }

    const cymbal = this.cymbals[piece];
    if (cymbal) {
      this._animateCymbal(cymbal, vel);
    }
  }

  _animateCymbal(cymbalGroup, vel) {
    gsap.killTweensOf(cymbalGroup.rotation);
    const tilt = 0.26 * vel;
    gsap.timeline()
      .to(cymbalGroup.rotation, { x: tilt, z: tilt * 0.45, duration: 0.045, ease: 'power2.out' })
      .to(cymbalGroup.rotation, { x: -tilt * 0.7, z: -tilt * 0.3, duration: 0.09, ease: 'sine.inOut' })
      .to(cymbalGroup.rotation, { x: tilt * 0.4, z: tilt * 0.15, duration: 0.14, ease: 'sine.inOut' })
      .to(cymbalGroup.rotation, { x: 0, z: 0, duration: 0.45, ease: 'elastic.out(1, 0.4)' });
  }

  /**
   * Maps standard General MIDI drum note numbers to MIDIJam kit pieces
   */
  _mapPitchToPiece(pitch) {
    if (pitch === 35 || pitch === 36) return 'kick';
    if (pitch === 38 || pitch === 40 || pitch === 37) return 'snare';
    if (pitch === 42 || pitch === 44 || pitch === 46) return 'hihat';
    if (pitch === 41) return 'floorTom2';
    if (pitch === 43) return 'floorTom1';
    if (pitch === 45) return 'tom4';
    if (pitch === 47) return 'tom3';
    if (pitch === 48) return 'tom2';
    if (pitch === 50) return 'tom1';
    if (pitch === 49) return 'crash1';
    if (pitch === 57) return 'crash2';
    if (pitch === 55) return 'splash1';
    if (pitch === 52) return 'china';
    if (pitch === 51 || pitch === 59 || pitch === 53) return 'ride';

    return 'snare';
  }

  _animateKick(vel) {
    if (this.beaterPivot) {
      gsap.killTweensOf(this.beaterPivot.rotation);
      gsap.timeline()
        .to(this.beaterPivot.rotation, { x: -0.15, duration: 0.045, ease: 'power3.in' })
        .to(this.beaterPivot.rotation, { x: 0.38, duration: 0.12, ease: 'elastic.out(1, 0.4)' });
    }

    if (this.drumHeads.kickFront) {
      this._flashDrumHead(this.drumHeads.kickFront, 0xffe600, vel);
    }
  }

  _flashDrumHead(mesh, hexColor, vel) {
    if (!mesh || !mesh.material) return;
    mesh.material.emissive.setHex(hexColor);
    mesh.material.emissiveIntensity = 0.85 * vel;
    gsap.to(mesh.material, {
      emissiveIntensity: 0,
      duration: 0.18,
      ease: 'power1.out'
    });
  }

  onNoteOff() {}

  update() {}
}
