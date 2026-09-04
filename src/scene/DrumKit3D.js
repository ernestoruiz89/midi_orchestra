import * as THREE from 'three';
import gsap from 'gsap';

const DRUMSTICK_LENGTH = 0.38;
const DRUMSTICK_WRIST_HEIGHT = 0.22;
const DRUMSTICK_GRIP_LIFT = 0.085;
const DRUMSTICK_GRIP_READY = 0.045;
const DRUMSTICK_GRIP_REBOUND = 0.070;
const DRUMSTICK_CONTACT_CLEARANCE = 0.016;
const DRUMSTICK_HAND_CONTACT_OFFSET = 0.045;
const DRUMSTICK_HAND_WRIST_OFFSET = 0.10;
const DRUMSTICK_SIMULTANEOUS_WINDOW = 0.025;
const DRUM_RECOIL_DISTANCE = 0.016;
const BASS_DRUM_RECOIL_DISTANCE = 0.024;
const DRUMSTICK_LIFT_ANGLE = 0.42;
const DRUMSTICK_READY_ANGLE = 0.14;
const DRUMSTICK_IMPACT_ANGLE = 0.0;
const DRUMSTICK_REBOUND_ANGLE = 0.22;
const DRUMSTICK_IDLE_TIMEOUT_MS = 1600;

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
 * - Dedicated active drumsticks that appear only for the instrument being hit.
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
    this.drumRecoilNodes = {};
    this.pieceTargets = {};
    this.pieceTargetTangents = {};
    this.pieceSticks = {};
    this.beaterPivot = null;
    this.preparedStrikes = new Map();
    this.stickSelectionState = new Map();

    this._buildMaterials();
    this._buildBassDrum();
    this._buildRackToms();
    this._buildFloorToms();
    this._buildSnare();
    this._buildHiHat();
    this._buildCymbals();
    this._buildDedicatedPieceSticks();

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

    // Hickory / Rock Maple Wood Drumsticks (Authentic Natural Studio Finish)
    this.stickMaterial = new THREE.MeshStandardMaterial({
      color: 0xecd5ad,
      roughness: 0.30,
      metalness: 0.02
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
   * 20"x16" Bass Drum: Dead-center, aligned parallel with the front platform edge
   */
  _buildBassDrum() {
    const radius = 0.43;
    const depth = 0.40;

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
    this.drumRecoilNodes.kick = { node: bassGroup, baseY: bassGroup.position.y };

    // Telescoping Front Spurs / Legs
    [-radius, radius].forEach(xOffset => {
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
      foot.position.set(xOffset > 0 ? radius + 0.20 : -radius - 0.20, -0.46, depth * 0.42);
      bassGroup.add(foot);
    });

    // Front kick pedal centered on the resonant head. The construction uses
    // the same visual cues as a real single pedal: a long heel/toe plate,
    // twin side frames, cross axle, cam and a padded beater.
    const pedalGroup = new THREE.Group();
    pedalGroup.position.set(0, -0.44, depth / 2 + 0.08);

    const basePlate = new THREE.Mesh(
      new THREE.BoxGeometry(0.18, 0.024, 0.34),
      this.chromeMaterial
    );
    basePlate.position.set(0, 0.012, 0.02);
    basePlate.rotation.x = 0.08;
    basePlate.castShadow = true;
    pedalGroup.add(basePlate);

    // Raised heel and toe sections make the footboard read as a machined
    // pedal rather than a floating rectangular slab.
    const heelBlock = new THREE.Mesh(
      new THREE.BoxGeometry(0.16, 0.028, 0.065),
      this.chromeMaterial
    );
    heelBlock.position.set(0, 0.034, -0.115);
    heelBlock.rotation.x = 0.08;
    pedalGroup.add(heelBlock);

    const toePad = new THREE.Mesh(
      new THREE.BoxGeometry(0.14, 0.018, 0.105),
      this.chromeMaterial
    );
    toePad.position.set(0, 0.052, 0.112);
    toePad.rotation.x = 0.08;
    toePad.castShadow = true;
    pedalGroup.add(toePad);

    const toeGrip = new THREE.Mesh(
      new THREE.BoxGeometry(0.125, 0.008, 0.052),
      this.blackTrimMaterial
    );
    toeGrip.position.set(0, 0.066, 0.13);
    toeGrip.rotation.x = 0.08;
    pedalGroup.add(toeGrip);

    // Helper for the square/round side-frame members. It keeps all members
    // aligned between their real endpoints while preserving the pedal's
    // compact proportions.
    const addPedalBeam = (start, end, radius = 0.008, material = this.chromeMaterial) => {
      const direction = new THREE.Vector3().subVectors(end, start);
      const beam = new THREE.Mesh(
        new THREE.CylinderGeometry(radius, radius, direction.length(), 8),
        material
      );
      beam.position.copy(start).add(end).multiplyScalar(0.5);
      beam.quaternion.setFromUnitVectors(
        new THREE.Vector3(0, 1, 0),
        direction.normalize()
      );
      beam.castShadow = true;
      pedalGroup.add(beam);
      return beam;
    };

    [-1, 1].forEach(side => {
      const x = side * 0.073;
      // Rear upright and forward brace form the two triangular side frames.
      addPedalBeam(new THREE.Vector3(x, 0.035, -0.115), new THREE.Vector3(x, 0.225, -0.075));
      addPedalBeam(new THREE.Vector3(x, 0.045, 0.105), new THREE.Vector3(x, 0.225, -0.075), 0.006);
      const frameCap = new THREE.Mesh(
        new THREE.CylinderGeometry(0.014, 0.014, 0.022, 10),
        this.chromeMaterial
      );
      frameCap.rotation.z = Math.PI / 2;
      frameCap.position.set(x, 0.225, -0.075);
      pedalGroup.add(frameCap);
    });

    // Heel hinge and the upper axle run across both side frames.
    const hinge = new THREE.Mesh(
      new THREE.CylinderGeometry(0.014, 0.014, 0.15, 12),
      this.chromeMaterial
    );
    hinge.rotation.z = Math.PI / 2;
    hinge.position.set(0, 0.045, -0.115);
    pedalGroup.add(hinge);

    const axle = new THREE.Mesh(
      new THREE.CylinderGeometry(0.018, 0.018, 0.19, 12),
      this.chromeMaterial
    );
    axle.rotation.z = Math.PI / 2;
    axle.position.set(0, 0.225, -0.075);
    pedalGroup.add(axle);

    const cam = new THREE.Mesh(
      new THREE.CylinderGeometry(0.034, 0.034, 0.052, 12),
      this.blackTrimMaterial
    );
    cam.rotation.z = Math.PI / 2;
    cam.position.set(0, 0.225, -0.055);
    pedalGroup.add(cam);

    // Beater pivot and rod reaching up to strike center of drumhead
    const beaterPivot = new THREE.Group();
    beaterPivot.position.set(0, 0.18, -0.04);

    const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.26, 8), this.chromeMaterial);
    rod.position.y = 0.13;
    beaterPivot.add(rod);

    const hammer = new THREE.Mesh(new THREE.BoxGeometry(0.075, 0.075, 0.065), this.blackTrimMaterial);
    hammer.position.set(0, 0.26, 0);
    hammer.rotation.x = -0.12;
    beaterPivot.add(hammer);

    // Ready rest angle
    beaterPivot.rotation.x = 0.38;

    pedalGroup.add(beaterPivot);
    bassGroup.add(pedalGroup);
    this.beaterPivot = beaterPivot;

    this.group.add(bassGroup);
    this.pieceTargets.kick = new THREE.Vector3(0, radius - 0.02, 0);
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
        // Midis2jam2's high tom is pitched toward the drummer, not flat
        // across the bass drum (about 50° down toward the playing position).
        rot: [0.87, 0.70, 0.00]
      },
      // 2. Tom 2 (10" - Left Center above left shoulder of bass drum)
      {
        id: 'tom2',
        radius: 0.14,
        depth: 0.15,
        pos: [-0.32, 1.18, -0.12],
        rot: [1.05, 0.35, 0.00]
      },
      // 3. Tom 3 (12" - Peak Center above bass drum)
      {
        id: 'tom3',
        radius: 0.17,
        depth: 0.16,
        pos: [0.00, 1.24, -0.16],
        rot: [1.05, 0.00, 0.00]
      },
      // 4. Tom 4 (13" - Right Center above right shoulder of bass drum)
      {
        id: 'tom4',
        radius: 0.18,
        depth: 0.18,
        pos: [0.35, 1.16, -0.14],
        rot: [1.05, -0.52, 0.00]
      }
    ];

    tomConfigs.forEach(cfg => {
      const { group, head } = this._createDrumMesh(cfg.radius, cfg.depth, true);
      group.position.set(cfg.pos[0], cfg.pos[1], cfg.pos[2]);
      group.rotation.set(cfg.rot[0], cfg.rot[1], cfg.rot[2]);

      this.group.add(group);
      this.drumHeads[cfg.id] = head;
      this.drumRecoilNodes[cfg.id] = { node: group, baseY: group.position.y };
      // Match the actual rotated top-head surface instead of approximating it
      // with the shell center. This prevents the tip from starting inside a
      // tom when the head is tilted.
      const headPoint = new THREE.Vector3(0, cfg.depth / 2 + DRUMSTICK_CONTACT_CLEARANCE, 0)
        .applyEuler(new THREE.Euler(cfg.rot[0], cfg.rot[1], cfg.rot[2]));
      this.pieceTargets[cfg.id] = new THREE.Vector3(cfg.pos[0], cfg.pos[1], cfg.pos[2]).add(headPoint);
      this.pieceTargetTangents[cfg.id] = new THREE.Vector3(1, 0, 0)
        .applyEuler(new THREE.Euler(cfg.rot[0], cfg.rot[1], cfg.rot[2]))
        .normalize();
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
      this.drumRecoilNodes[cfg.id] = { node: group, baseY: group.position.y };
      const headPoint = new THREE.Vector3(0, cfg.depth / 2 + DRUMSTICK_CONTACT_CLEARANCE, 0)
        .applyEuler(new THREE.Euler(cfg.rot[0], cfg.rot[1], cfg.rot[2]));
      this.pieceTargets[cfg.id] = new THREE.Vector3(cfg.pos[0], cfg.pos[1], cfg.pos[2]).add(headPoint);
      this.pieceTargetTangents[cfg.id] = new THREE.Vector3(1, 0, 0)
        .applyEuler(new THREE.Euler(cfg.rot[0], cfg.rot[1], cfg.rot[2]))
        .normalize();
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
    this.drumRecoilNodes.snare = { node: snareGroup, baseY: snareGroup.position.y };
    const snareHeadPoint = new THREE.Vector3(0, depth / 2 + DRUMSTICK_CONTACT_CLEARANCE, 0)
      .applyEuler(snareGroup.rotation);
    this.pieceTargets.snare = snareGroup.position.clone().add(snareHeadPoint);
    this.pieceTargetTangents.snare = new THREE.Vector3(1, 0, 0)
      .applyEuler(snareGroup.rotation)
      .normalize();
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
    const hihatTopPoint = new THREE.Vector3(0, 0.025 + 0.019 + DRUMSTICK_CONTACT_CLEARANCE, 0)
      .applyEuler(hihatGroup.rotation);
    this.pieceTargets.hihat = hihatGroup.position.clone().add(hihatTopPoint);
    this.pieceTargetTangents.hihat = new THREE.Vector3(1, 0, 0)
      .applyEuler(hihatGroup.rotation)
      .normalize();

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
      const cymbalPoint = new THREE.Vector3(0, 0.019 + DRUMSTICK_CONTACT_CLEARANCE, 0)
        .applyEuler(new THREE.Euler(cfg.rot[0], cfg.rot[1], cfg.rot[2]));
      this.pieceTargets[cfg.id] = new THREE.Vector3(cfg.pos[0], cfg.pos[1], cfg.pos[2]).add(cymbalPoint);
      this.pieceTargetTangents[cfg.id] = new THREE.Vector3(1, 0, 0)
        .applyEuler(new THREE.Euler(cfg.rot[0], cfg.rot[1], cfg.rot[2]))
        .normalize();
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

    pieces.forEach(piece => {
      const target = this.pieceTargets[piece];
      if (!target) return;

      const tangent = this.pieceTargetTangents[piece] || new THREE.Vector3(1, 0, 0);
      [-1, 1].forEach(handSide => {
        const handIndex = handSide > 0 ? 1 : 0;
        const stickKey = handIndex === 0 ? piece : `${piece}_2`;
        const handTarget = target.clone()
          .addScaledVector(tangent, DRUMSTICK_HAND_CONTACT_OFFSET * handSide);
        const handOrigin = drummerOrigin.clone()
          .addScaledVector(tangent, DRUMSTICK_HAND_WRIST_OFFSET * handSide);
        const stickData = this._createDedicatedStickMesh(handTarget, handOrigin);
        stickData.piece = piece;
        stickData.handIndex = handIndex;
        this.pieceSticks[stickKey] = stickData;
        this.group.add(stickData.pivot);
      });
    });
  }

  _createDedicatedStickMesh(targetPos, drummerOrigin) {
    const pivot = new THREE.Group();

    // The pivot is the drummer's wrist/fulcrum, not the point of impact. Keep
    // that wrist above the head and behind it, so the whole visible stick
    // starts high and can descend in an arc instead of falling as a straight
    // vertical pole.
    const radial = new THREE.Vector3(
      targetPos.x - drummerOrigin.x,
      0,
      targetPos.z - drummerOrigin.z
    );
    if (radial.lengthSq() < 0.0001) radial.set(0, 0, 1);
    radial.normalize();
    const horizontalSpan = Math.sqrt(
      Math.max(0.0001, DRUMSTICK_LENGTH ** 2 - DRUMSTICK_WRIST_HEIGHT ** 2)
    );
    pivot.position.copy(targetPos)
      .addScaledVector(radial, -horizontalSpan);
    pivot.position.y += DRUMSTICK_WRIST_HEIGHT;

    const dir = new THREE.Vector3().subVectors(targetPos, pivot.position).normalize();

    // Local +Z points from the wrist to the drumhead. A quaternion avoids the
    // yaw/pitch Euler-order drift that previously put inclined-kit sticks
    // below or beside their target.
    pivot.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), dir);

    // Determine which local-X direction raises the tip after this 3D aim. The
    // sign varies with the radial direction, especially on the floor toms.
    const neutralTip = new THREE.Vector3(0, 0, DRUMSTICK_LENGTH)
      .applyQuaternion(pivot.quaternion);
    const positiveTestTip = new THREE.Vector3(0, 0, DRUMSTICK_LENGTH)
      .applyAxisAngle(new THREE.Vector3(1, 0, 0), 0.1)
      .applyQuaternion(pivot.quaternion);
    const arcSign = positiveTestTip.y > neutralTip.y ? 1 : -1;

    const stickArm = new THREE.Group();

    // 1. Smooth rounded butt cap at the wrist grip
    const buttGeom = new THREE.SphereGeometry(0.0075, 12, 12);
    const butt = new THREE.Mesh(buttGeom, this.stickMaterial);
    butt.position.z = 0.004;
    stickArm.add(butt);

    // 2. Main cylindrical handle & grip section (length 0.21m, radius ~7.2mm)
    const handleGeom = new THREE.CylinderGeometry(0.0070, 0.0075, 0.21, 14);
    handleGeom.rotateX(Math.PI / 2);
    const handle = new THREE.Mesh(handleGeom, this.stickMaterial);
    handle.position.z = 0.11;
    handle.castShadow = true;
    stickArm.add(handle);

    // 3. Gracefully tapered shoulder down to the slim neck (0.13m, radius 7.0mm -> 3.6mm)
    const taperGeom = new THREE.CylinderGeometry(0.0036, 0.0070, 0.13, 14);
    taperGeom.rotateX(Math.PI / 2);
    const taper = new THREE.Mesh(taperGeom, this.stickMaterial);
    taper.position.z = 0.28;
    taper.castShadow = true;
    stickArm.add(taper);

    // 4. Authentic oval acorn drumstick tip bead (at z = DRUMSTICK_LENGTH)
    const tipNeckGeom = new THREE.CylinderGeometry(0.0055, 0.0036, 0.016, 14);
    tipNeckGeom.rotateX(Math.PI / 2);
    const tipNeck = new THREE.Mesh(tipNeckGeom, this.stickMaterial);
    tipNeck.position.z = 0.355;
    stickArm.add(tipNeck);

    const tipHeadGeom = new THREE.SphereGeometry(0.0055, 12, 12);
    tipHeadGeom.scale(1, 1, 1.4);
    const tipHead = new THREE.Mesh(tipHeadGeom, this.stickMaterial);
    tipHead.position.z = DRUMSTICK_LENGTH;
    stickArm.add(tipHead);

    pivot.add(stickArm);

    // Hidden until struck
    pivot.visible = false;

    return {
      pivot,
      stickArm,
      arcSign,
      basePivotY: pivot.position.y,
      idleTimeout: null
    };
  }

  _selectStickKey(piece, eventTime = null, trackIndex = null) {
    const alternateKey = `${piece}_2`;
    if (!this.pieceSticks[alternateKey]) return piece;

    const currentTime = Number.isFinite(eventTime) ? eventTime : performance.now() / 1000;
    const sourceTrack = trackIndex ?? 'manual';
    const previous = this.stickSelectionState.get(piece);

    // In midis2jam2: simultaneous notes OR rapid successive notes (< 0.38s, rolls/grooves)
    // alternate naturally between left and right hands!
    let handIndex = 0;
    if (previous) {
      const dt = Math.abs(currentTime - previous.time);
      if (dt <= 0.38 || (previous.track !== sourceTrack && dt <= DRUMSTICK_SIMULTANEOUS_WINDOW)) {
        handIndex = 1 - previous.handIndex;
      } else {
        handIndex = 0;
      }
    }
    this.stickSelectionState.set(piece, { time: currentTime, track: sourceTrack, handIndex });
    return handIndex === 1 ? alternateKey : piece;
  }

  _queuePreparedStrike(piece, preparedStrike) {
    const queue = this.preparedStrikes.get(piece) || [];
    queue.push(preparedStrike);
    this.preparedStrikes.set(piece, queue);
  }

  _takePreparedStrike(piece) {
    const queue = this.preparedStrikes.get(piece);
    if (!queue || queue.length === 0) return null;

    const prepared = queue.shift();
    if (queue.length === 0) this.preparedStrikes.delete(piece);
    return prepared;
  }

  _arcAngle(stickData, baseAngle, velocity = 1.0) {
    return baseAngle * stickData.arcSign * velocity;
  }

  /**
   * Starts the physical lift before the MIDI note.
   * Matches midis2jam2's Striker anticipation curve.
   */
  onNotePrepare(pitchOrPiece, velocity = 0.8, duration = 0.5, eventTime = null, trackIndex = null) {
    let piece = pitchOrPiece;
    if (typeof pitchOrPiece === 'number') {
      piece = this._mapPitchToPiece(pitchOrPiece);
    }
    if (piece === 'kick') return;

    const vel = Math.max(0.35, Math.min(1.0, velocity));
    const stickKey = this._selectStickKey(piece, eventTime, trackIndex);
    const stickData = this.pieceSticks[stickKey];
    if (!stickData) return;

    this._queuePreparedStrike(piece, { stickKey, velocity: vel });

    // Cancel pending idle hide timeout for this stick
    if (stickData.idleTimeout) {
      clearTimeout(stickData.idleTimeout);
      stickData.idleTimeout = null;
    }

    stickData.pivot.visible = true;
    gsap.killTweensOf(stickData.stickArm.rotation);
    gsap.killTweensOf(stickData.pivot.position);

    // Anticipation: dynamic wind-up backswing (higher lift for forte)
    const liftAngle = DRUMSTICK_READY_ANGLE + DRUMSTICK_LIFT_ANGLE * vel;
    const liftY = stickData.basePivotY + DRUMSTICK_GRIP_LIFT * vel;

    gsap.to(stickData.stickArm.rotation, {
      x: this._arcAngle(stickData, liftAngle, 1.0),
      duration: 0.18,
      ease: 'power2.out'
    });
    gsap.to(stickData.pivot.position, {
      y: liftY,
      duration: 0.18,
      ease: 'power2.out'
    });
  }

  /**
   * Note-On Event Trigger: executes the snappy downward strike, instant elastic rebound,
   * settles into hovering ready position, and maintains persistent visibility like midis2jam2.
   */
  onNoteOn(pitchOrPiece, velocity = 0.8, eventTime = null, trackIndex = null) {
    let piece = pitchOrPiece;
    if (typeof pitchOrPiece === 'number') {
      piece = this._mapPitchToPiece(pitchOrPiece);
    }

    const vel = Math.max(0.35, Math.min(1.0, velocity));

    if (piece === 'kick') {
      this._animateKick(vel);
      return;
    }

    const prepared = this._takePreparedStrike(piece);
    const stickKey = prepared ? prepared.stickKey : this._selectStickKey(piece, eventTime, trackIndex);
    const stickVelocity = prepared ? prepared.velocity : vel;

    const stickData = this.pieceSticks[stickKey];
    if (stickData) {
      if (stickData.idleTimeout) {
        clearTimeout(stickData.idleTimeout);
        stickData.idleTimeout = null;
      }

      stickData.pivot.visible = true;
      gsap.killTweensOf(stickData.stickArm.rotation);
      gsap.killTweensOf(stickData.pivot.position);

      const strike = gsap.timeline();

      // 1. FAST ACCELERATING DOWNSTROKE onto head
      strike.to(stickData.stickArm.rotation, {
        x: this._arcAngle(stickData, DRUMSTICK_IMPACT_ANGLE, 1.0),
        duration: 0.042,
        ease: 'power4.in'
      })
      .to(stickData.pivot.position, {
        y: stickData.basePivotY,
        duration: 0.042,
        ease: 'power4.in'
      }, '<')

      // 2. ELASTIC REBOUND (The signature midis2jam bounce!)
      .to(stickData.stickArm.rotation, {
        x: this._arcAngle(stickData, DRUMSTICK_REBOUND_ANGLE * (0.65 + 0.35 * stickVelocity), 1.0),
        duration: 0.085,
        ease: 'power3.out'
      })
      .to(stickData.pivot.position, {
        y: stickData.basePivotY + DRUMSTICK_GRIP_REBOUND * stickVelocity,
        duration: 0.085,
        ease: 'power3.out'
      }, '<')

      // 3. SETTLE INTO HOVERING READY POSTURE (ready for next beat!)
      .to(stickData.stickArm.rotation, {
        x: this._arcAngle(stickData, DRUMSTICK_READY_ANGLE, 1.0),
        duration: 0.16,
        ease: 'power2.out'
      })
      .to(stickData.pivot.position, {
        y: stickData.basePivotY + DRUMSTICK_GRIP_READY,
        duration: 0.16,
        ease: 'power2.out'
      }, '<');

      // 4. PERSISTENT HOVER / STICKINESS:
      // Stay visible hovering above the piece as long as notes continue playing!
      // Only if no hits occur for DRUMSTICK_IDLE_TIMEOUT_MS does the stick gently lower and hide.
      stickData.idleTimeout = setTimeout(() => {
        if (!stickData.pivot.visible) return;
        gsap.to(stickData.stickArm.rotation, {
          x: 0,
          duration: 0.35,
          ease: 'power2.inOut'
        });
        gsap.to(stickData.pivot.position, {
          y: stickData.basePivotY,
          duration: 0.35,
          ease: 'power2.inOut',
          onComplete: () => {
            stickData.pivot.visible = false;
          }
        });
      }, DRUMSTICK_IDLE_TIMEOUT_MS);
    }

    // 2. Animate Drumhead or Cymbal
    const head = this.drumHeads[piece];
    if (head) {
      this._animateDrumRecoil(piece, vel);
      this._flashDrumHead(head, 0xfff0aa, vel);
    }

    const cymbal = this.cymbals[piece];
    if (cymbal) {
      this._animateCymbal(cymbal, vel);
    }
  }

  _animateDrumRecoil(piece, vel) {
    const recoil = this.drumRecoilNodes[piece];
    if (!recoil) return;

    const dampening = Math.sqrt(Math.max(0, Math.min(1, vel)));
    const distance = (piece === 'kick' ? BASS_DRUM_RECOIL_DISTANCE : DRUM_RECOIL_DISTANCE) * dampening;
    const { node, baseY } = recoil;

    gsap.killTweensOf(node.position);
    // A fresh hit starts from the rest height, then compresses downward and
    // returns without an upward overshoot, matching midis2jam2's recoilDrum.
    node.position.y = baseY;
    gsap.timeline()
      .to(node.position, {
        y: baseY - distance,
        duration: 0.035,
        ease: 'power4.in'
      })
      .to(node.position, {
        y: baseY,
        duration: 0.22,
        ease: 'power2.out'
      });
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
    this._animateDrumRecoil('kick', vel);
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

  onNoteOff(pitchOrPiece, force = false) {
    if (!force) return;

    this.preparedStrikes.clear();
    this.stickSelectionState.clear();
    Object.values(this.drumRecoilNodes).forEach(({ node, baseY }) => {
      gsap.killTweensOf(node.position);
      node.position.y = baseY;
    });
    Object.values(this.pieceSticks).forEach(stickData => {
      if (stickData.idleTimeout) {
        clearTimeout(stickData.idleTimeout);
        stickData.idleTimeout = null;
      }
      gsap.killTweensOf(stickData.stickArm.rotation);
      gsap.killTweensOf(stickData.pivot.position);
      stickData.stickArm.rotation.x = 0;
      stickData.stickArm.position.set(0, 0, 0);
      stickData.pivot.position.y = stickData.basePivotY;
      stickData.pivot.visible = false;
    });
  }

  update() {}
}
