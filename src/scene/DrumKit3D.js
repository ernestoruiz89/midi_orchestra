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

const HIHAT_CLOSED_Y = 0.013;
const HIHAT_OPEN_Y = 0.038;
const HIHAT_PEDAL_UP_ANGLE = -0.16;
const HIHAT_PEDAL_DOWN_ANGLE = -0.04;

/**
 * DrumKit3D: 100% Authentic MIDIJam Concert Drum Kit
 * - Zero intersection / zero clipping: each drum and cymbal has clean physical air clearance.
 * - Centered horizontally on the drum riser and aligned parallel with the stage platform edge.
 * - 22" Bass drum centered with front-mounted pedal and beater.
 * - 4 Mounted Rack Toms in an iconic crown arc over the bass drum (Tom 1, Tom 2, Tom 3, Tom 4).
 * - 2 Deep Floor Toms on the right (Floor Tom 1, Floor Tom 2).
 * - Snare drum mounted in front-left with clear clearance from bass drum.
 * - Hi-Hat mounted on the lower-left with dual cymbals, clutch, and pedal.
 * - 6 Floating Cymbals (Crash 1, Crash 2, Splash, Center Crash, Ride, China with inverted lip) + Hi-Hat.
 * - All drumheads stamped with crisp black 'BLAMO' logo.
 * - Dedicated active drumsticks that appear only for the instrument being hit.
 * - Active striking drumsticks fanning out radially from the drummer's center.
 */
export class DrumKit3D {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();

    // Moved forward on the elevated drum riser platform (y = 0.20, z = 0.20)
    this.group.position.set(0, 0.20, 0.20);

    this.cymbals = {};
    this.drumHeads = {};
    this.drumRecoilNodes = {};
    this.pieceTargets = {};
    this.pieceTargetTangents = {};
    this.pieceSticks = {};
    this.beaterPivot = null;
    this.preparedStrikes = new Map();
    this.stickSelectionState = new Map();

    // Hi-Hat State & Components
    this.hihatState = 'closed';
    this.hihatCloseTimer = null;
    this.hihatTopPivot = null;
    this.hihatPedalFootboard = null;

    // Reverse Cymbal swell state (midis2jam2 exponential wobble & crescendo roll on crash2)
    this.activeReverseCymbals = [];
    this.reverseCymbalPiece = 'crash2';

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

    // Mirror Polished Chrome Hardware (hoops, lugs, pedal, cymbal crowns, clutch)
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

    // Cast B20 Bronze Cymbals with Warm Lathed Sheen and Concentric Grooves
    this.cymbalTexture = this._createCymbalTexture();
    this.cymbalMaterial = new THREE.MeshStandardMaterial({
      map: this.cymbalTexture,
      roughness: 0.28,
      metalness: 0.88,
      side: THREE.DoubleSide
    });

    // Dark Charcoal Felt for Cymbal Washers and Hi-Hat Clutch
    this.feltMaterial = new THREE.MeshStandardMaterial({
      color: 0x242428,
      roughness: 0.94,
      metalness: 0.04
    });

    // Hickory / Rock Maple Wood Drumsticks (Authentic Natural Studio Finish)
    this.stickMaterial = new THREE.MeshStandardMaterial({
      color: 0xecd5ad,
      roughness: 0.30,
      metalness: 0.02
    });

    // Seamless continuous LatheGeometry for authentic 5A wood drumsticks (Zero gaps, zero seams)
    const stickPoints = [
      new THREE.Vector2(0.0000, 0.000), // rounded butt center
      new THREE.Vector2(0.0050, 0.002), // butt curvature
      new THREE.Vector2(0.0072, 0.006), // butt to handle
      new THREE.Vector2(0.0072, 0.180), // cylindrical handle grip
      new THREE.Vector2(0.0070, 0.220), // shoulder start
      new THREE.Vector2(0.0052, 0.300), // smooth taper
      new THREE.Vector2(0.0036, 0.348), // slim neck
      new THREE.Vector2(0.0035, 0.356), // bead collar
      new THREE.Vector2(0.0054, 0.366), // acorn tip bead belly
      new THREE.Vector2(0.0044, 0.375), // tip taper
      new THREE.Vector2(0.0000, DRUMSTICK_LENGTH) // tip apex (0.380)
    ];
    this.stickGeometry = new THREE.LatheGeometry(stickPoints, 20);
    this.stickGeometry.rotateX(Math.PI / 2);
    this.stickGeometry.computeVertexNormals();

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
   * Generates high-fidelity 512x512 procedural B20 bronze cymbal texture:
   * warm radial gradient, dense fine concentric lathing rings, and subtle hammered dimples.
   */
  _createCymbalTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    const cx = 256;
    const cy = 256;

    // 1. Base radial gradient with authentic B20 cast bronze tones
    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 256);
    grad.addColorStop(0.00, '#f9e2aa'); // bright polished bell hole
    grad.addColorStop(0.06, '#f3cf88'); // inner bell cup
    grad.addColorStop(0.18, '#e6b965'); // bell shoulder
    grad.addColorStop(0.24, '#c99138'); // bell-to-bow crease shadow
    grad.addColorStop(0.32, '#eec578'); // inner bow
    grad.addColorStop(0.60, '#dfa84a'); // mid bow
    grad.addColorStop(0.85, '#cc8e32'); // outer bow
    grad.addColorStop(0.96, '#dfa94e'); // outer edge highlight
    grad.addColorStop(1.00, '#8c591c'); // dark bevel edge
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 512);

    // 2. Fine concentric lathing grooves (tonal rings)
    for (let r = 18; r < 254; r += 1.8) {
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      const isAccent = (Math.floor(r * 10) % 7 === 0);
      ctx.strokeStyle = isAccent ? 'rgba(80, 45, 10, 0.18)' : 'rgba(255, 230, 160, 0.12)';
      ctx.lineWidth = isAccent ? 1.4 : 0.8;
      ctx.stroke();
    }

    // 3. Subtle hand-hammering dimples across the bow (characteristic of B20 cast bronze)
    const dimpleRings = [65, 95, 125, 155, 185, 215, 238];
    dimpleRings.forEach((ringR, ringIdx) => {
      const count = Math.floor(ringR * 0.18);
      const angleStep = (Math.PI * 2) / count;
      const ringOffset = ringIdx * 0.35;
      for (let i = 0; i < count; i++) {
        const angle = i * angleStep + ringOffset + (Math.sin(i * 3.7) * 0.08);
        const radiusJitter = ringR + (Math.cos(i * 4.3) * 6);
        const px = cx + Math.cos(angle) * radiusJitter;
        const py = cy + Math.sin(angle) * radiusJitter;
        const dimpleRadius = 3.5 + (Math.sin(i * 2.1) * 1.5);

        // Shadow side of dimple
        ctx.beginPath();
        ctx.arc(px, py, dimpleRadius, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(70, 35, 5, 0.13)';
        ctx.fill();

        // Highlight side of dimple
        ctx.beginPath();
        ctx.arc(px - 1, py - 1, dimpleRadius * 0.65, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 240, 190, 0.16)';
        ctx.fill();
      }
    });

    // 4. Bell accent groove
    ctx.beginPath();
    ctx.arc(cx, cy, 54, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(60, 30, 5, 0.35)';
    ctx.lineWidth = 2.0;
    ctx.stroke();

    const texture = new THREE.CanvasTexture(canvas);
    texture.anisotropy = 8;
    return texture;
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
    [-1, 1].forEach(side => {
      const xOffset = side * radius;

      // Heavy-duty cast chrome bracket on bass drum shell
      const bracket = new THREE.Mesh(
        new THREE.BoxGeometry(0.028, 0.038, 0.024),
        this.chromeMaterial
      );
      bracket.position.set(side * (radius + 0.005), -0.12, depth * 0.22);
      bassGroup.add(bracket);

      const wingBolt = new THREE.Mesh(
        new THREE.BoxGeometry(0.024, 0.006, 0.006),
        this.chromeMaterial
      );
      wingBolt.position.set(side * (radius + 0.020), -0.12, depth * 0.22);
      bassGroup.add(wingBolt);

      // Spur leg rod connecting bracket down to floor (y = -0.368 in bassGroup = y = 0.012 on floor)
      const footPos = new THREE.Vector3(side * (radius + 0.16), -0.368, depth * 0.40);
      const bracketPos = new THREE.Vector3(side * (radius + 0.005), -0.12, depth * 0.22);
      const spurVec = new THREE.Vector3().subVectors(footPos, bracketPos);
      const spurLen = spurVec.length();

      const spur = new THREE.Mesh(
        new THREE.CylinderGeometry(0.010, 0.009, spurLen, 12),
        this.chromeMaterial
      );
      spur.position.copy(bracketPos).add(footPos).multiplyScalar(0.5);
      spur.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), spurVec.clone().normalize());
      spur.castShadow = true;
      bassGroup.add(spur);

      // Molded heavy black rubber foot resting flat on the riser floor
      const foot = new THREE.Mesh(
        new THREE.CylinderGeometry(0.016, 0.022, 0.024, 12),
        this.blackTrimMaterial
      );
      foot.position.copy(footPos);
      foot.castShadow = true;
      bassGroup.add(foot);
    });

    // Front kick pedal centered on the resonant head, resting flat on the floor
    const pedalGroup = new THREE.Group();
    pedalGroup.position.set(0, -0.368, depth / 2 + 0.08);

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
   * Builds an authentic, heavy-duty double-braced drum hardware tripod base.
   * Rests strictly vertical at y = 0 on the drum riser floor.
   * Perfect 120-degree radial symmetry prevents Euler angle shearing and chaotic overlaps.
   */
  _createHardwareTripodBase(radius = 0.24, legHeight = 0.18, baseAngle = 0) {
    const baseGroup = new THREE.Group();

    // 1. Lower Central Column Tube (Chrome)
    const lowerColumnHeight = legHeight + 0.14;
    const lowerColumn = new THREE.Mesh(
      new THREE.CylinderGeometry(0.013, 0.013, lowerColumnHeight, 14),
      this.chromeMaterial
    );
    lowerColumn.position.y = lowerColumnHeight / 2;
    lowerColumn.castShadow = true;
    baseGroup.add(lowerColumn);

    // Bottom base end cap resting flat on floor (y = 0)
    const bottomCap = new THREE.Mesh(
      new THREE.CylinderGeometry(0.015, 0.015, 0.014, 14),
      this.blackTrimMaterial
    );
    bottomCap.position.y = 0.007;
    baseGroup.add(bottomCap);

    // 2. Lower Strut Spreader Collar (Chrome)
    const lowerCollarY = 0.065;
    const lowerCollar = new THREE.Mesh(
      new THREE.CylinderGeometry(0.017, 0.017, 0.020, 14),
      this.chromeMaterial
    );
    lowerCollar.position.y = lowerCollarY;
    baseGroup.add(lowerCollar);

    // 3. Upper Leg Hinge Collar (Chrome) with wing T-bolt
    const upperCollarY = legHeight;
    const upperCollar = new THREE.Mesh(
      new THREE.CylinderGeometry(0.018, 0.018, 0.024, 14),
      this.chromeMaterial
    );
    upperCollar.position.y = upperCollarY;
    baseGroup.add(upperCollar);

    const wingBolt = new THREE.Mesh(
      new THREE.BoxGeometry(0.026, 0.008, 0.008),
      this.chromeMaterial
    );
    wingBolt.position.set(0.018, upperCollarY, 0);
    baseGroup.add(wingBolt);

    // 4. Memory lock clamp at top of lower tube
    const memoryLock = new THREE.Mesh(
      new THREE.CylinderGeometry(0.017, 0.017, 0.016, 14),
      this.chromeMaterial
    );
    memoryLock.position.y = lowerColumnHeight - 0.01;
    baseGroup.add(memoryLock);

    // Helper to connect a strut cylinder directly between two 3D points
    const addStrut = (start, end, r = 0.006) => {
      const dir = new THREE.Vector3().subVectors(end, start);
      const len = dir.length();
      const strut = new THREE.Mesh(
        new THREE.CylinderGeometry(r, r, len, 10),
        this.chromeMaterial
      );
      strut.position.copy(start).add(end).multiplyScalar(0.5);
      strut.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
      strut.castShadow = true;
      baseGroup.add(strut);
      return strut;
    };

    // 5. 3 Symmetrical Double-Braced Legs (spaced at exact 120° intervals)
    for (let i = 0; i < 3; i++) {
      const legAngle = baseAngle + (i * Math.PI * 2) / 3;
      const cosA = Math.cos(legAngle);
      const sinA = Math.sin(legAngle);

      // Foot resting flat on the riser floor at y = 0
      const footPos = new THREE.Vector3(cosA * radius, 0.012, sinA * radius);

      // Upper collar hinge point
      const upperHinge = new THREE.Vector3(cosA * 0.018, upperCollarY, sinA * 0.018);

      // Main diagonal leg from upper collar to foot
      addStrut(upperHinge, footPos, 0.007);

      // Lower collar hinge point
      const lowerHinge = new THREE.Vector3(cosA * 0.017, lowerCollarY, sinA * 0.017);

      // Strut attaches to midpoint of main leg
      const midLegPoint = new THREE.Vector3().copy(upperHinge).add(footPos).multiplyScalar(0.5);
      addStrut(lowerHinge, midLegPoint, 0.005);

      // Molded heavy rubber foot resting flat on the floor at y = 0
      const foot = new THREE.Mesh(
        new THREE.CylinderGeometry(0.014, 0.018, 0.024, 12),
        this.blackTrimMaterial
      );
      foot.position.copy(footPos);
      foot.castShadow = true;
      baseGroup.add(foot);
    }

    return baseGroup;
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

      // 3 Heavy-duty Chrome Floor Legs with Brackets and Molded Rubber Feet
      for (let i = 0; i < 3; i++) {
        const legAngle = (i * Math.PI * 2) / 3 + 0.45;
        // Bracket on shell (lower third of drum shell)
        const bx = Math.cos(legAngle) * (cfg.radius + 0.006);
        const by = -cfg.depth * 0.20;
        const bz = Math.sin(legAngle) * (cfg.radius + 0.006);

        const bracket = new THREE.Mesh(
          new THREE.BoxGeometry(0.024, 0.035, 0.020),
          this.chromeMaterial
        );
        bracket.position.set(bx, by, bz);
        bracket.rotation.y = -legAngle;
        group.add(bracket);

        const wingBolt = new THREE.Mesh(
          new THREE.BoxGeometry(0.024, 0.006, 0.006),
          this.chromeMaterial
        );
        wingBolt.position.set(bx * 1.05, by, bz * 1.05);
        group.add(wingBolt);

        // Compute bracket in kit coordinates
        const localBracketPos = new THREE.Vector3(bx, by, bz)
          .applyEuler(new THREE.Euler(cfg.rot[0], cfg.rot[1], cfg.rot[2]));
        const worldBracketPos = new THREE.Vector3(cfg.pos[0], cfg.pos[1], cfg.pos[2]).add(localBracketPos);

        // Rubber foot on floor (y = 0.012) splayed outward
        const radX = worldBracketPos.x - cfg.pos[0];
        const radZ = worldBracketPos.z - cfg.pos[2];
        const radLen = Math.sqrt(radX * radX + radZ * radZ) || 1;
        const footX = worldBracketPos.x + (radX / radLen) * 0.09;
        const footZ = worldBracketPos.z + (radZ / radLen) * 0.09;
        const footY = 0.012;

        const legStart = worldBracketPos.clone().add(new THREE.Vector3(0, 0.05, 0));
        const legEnd = new THREE.Vector3(footX, footY, footZ);
        const legVec = new THREE.Vector3().subVectors(legEnd, legStart);
        const legLen = legVec.length();

        const legMesh = new THREE.Mesh(
          new THREE.CylinderGeometry(0.006, 0.006, legLen, 10),
          this.chromeMaterial
        );
        legMesh.position.copy(legStart).add(legEnd).multiplyScalar(0.5);
        legMesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), legVec.clone().normalize());
        legMesh.castShadow = true;
        this.group.add(legMesh);

        // Molded heavy rubber foot resting flat on the riser floor
        const foot = new THREE.Mesh(
          new THREE.CylinderGeometry(0.014, 0.018, 0.024, 12),
          this.blackTrimMaterial
        );
        foot.position.set(footX, 0.012, footZ);
        foot.castShadow = true;
        this.group.add(foot);
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
    const radius = 0.20;
    const depth = 0.13;
    const snareRot = new THREE.Euler(0.24, 0.22, -0.08);

    // 1. Snare Drum Shell & Batter Head (Tilted and animated on hits)
    const snareGroup = new THREE.Group();
    snareGroup.position.set(-0.42, 0.48, 0.42);
    snareGroup.rotation.copy(snareRot);

    const { group: snareMeshGroup, head } = this._createDrumMesh(radius, depth, true);
    snareGroup.add(snareMeshGroup);
    this.group.add(snareGroup);

    // 2. Heavy-Duty Double-Braced Snare Tripod Stand (sitting flat on the riser floor at y = 0)
    const standGroup = new THREE.Group();
    standGroup.position.set(-0.42, 0, 0.42);

    // Grounded symmetrical tripod base (radius 0.22m, collar height 0.16m)
    const tripodBase = this._createHardwareTripodBase(0.22, 0.16, 0.4);
    standGroup.add(tripodBase);

    // Central chrome upright column extending to tilter knuckle at y = 0.35
    const upperColumn = new THREE.Mesh(
      new THREE.CylinderGeometry(0.010, 0.010, 0.18, 12),
      this.chromeMaterial
    );
    upperColumn.position.y = 0.26;
    upperColumn.castShadow = true;
    standGroup.add(upperColumn);

    // Height adjustment collar & memory lock
    const collar = new THREE.Mesh(
      new THREE.CylinderGeometry(0.015, 0.015, 0.022, 14),
      this.chromeMaterial
    );
    collar.position.y = 0.33;
    standGroup.add(collar);

    // Tilter ball-joint knuckle housing
    const tilterJoint = new THREE.Mesh(
      new THREE.SphereGeometry(0.015, 12, 12),
      this.chromeMaterial
    );
    tilterJoint.position.y = 0.35;
    standGroup.add(tilterJoint);

    const tilterHandle = new THREE.Mesh(
      new THREE.CylinderGeometry(0.005, 0.005, 0.038, 8),
      this.chromeMaterial
    );
    tilterHandle.rotation.z = Math.PI / 2;
    tilterHandle.position.set(0.016, 0.35, 0);
    standGroup.add(tilterHandle);

    // Tilter Basket Pivot: Tilts to match snare angle to cradle the drum
    const basketPivot = new THREE.Group();
    basketPivot.position.y = 0.35;
    basketPivot.rotation.copy(snareRot);

    // Central basket shaft and tightening adjustment nut
    const basketShaft = new THREE.Mesh(
      new THREE.CylinderGeometry(0.009, 0.009, 0.065, 10),
      this.chromeMaterial
    );
    basketShaft.position.y = 0.032;
    basketPivot.add(basketShaft);

    const basketWheel = new THREE.Mesh(
      new THREE.CylinderGeometry(0.020, 0.020, 0.012, 16),
      this.chromeMaterial
    );
    basketWheel.position.y = 0.028;
    basketPivot.add(basketWheel);

    // 3 Rubber-Tipped Basket Arms cradling the bottom rim of the snare
    for (let i = 0; i < 3; i++) {
      const armAngle = (i * Math.PI * 2) / 3 + 0.55;
      const armGroup = new THREE.Group();
      armGroup.rotation.y = armAngle;

      // Horizontal chrome arm reaching out past drum radius
      const arm = new THREE.Mesh(
        new THREE.BoxGeometry(radius + 0.015, 0.008, 0.010),
        this.chromeMaterial
      );
      arm.position.set((radius + 0.015) / 2, 0.058, 0);
      armGroup.add(arm);

      // Upright claw
      const claw = new THREE.Mesh(
        new THREE.BoxGeometry(0.008, 0.045, 0.010),
        this.chromeMaterial
      );
      claw.position.set(radius + 0.015, 0.078, 0);
      armGroup.add(claw);

      // Molded black rubber gripper tip cradling bottom hoop
      const rubberTip = new THREE.Mesh(
        new THREE.BoxGeometry(0.014, 0.020, 0.016),
        this.blackTrimMaterial
      );
      rubberTip.position.set(radius + 0.015, 0.095, 0);
      armGroup.add(rubberTip);

      basketPivot.add(armGroup);
    }
    standGroup.add(basketPivot);
    this.group.add(standGroup);

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
   * Builds Hi-Hat cymbals on the far lower-left with authentic dual-cymbal clutch and foot pedal
   */
  _buildHiHat() {
    const hihatPos = new THREE.Vector3(-0.82, 0, 0.35);
    const cymbalsHeight = 0.70;

    // 1. Heavy-Duty Double-Braced Hi-Hat Tripod Stand (flat on the riser floor at y = 0)
    const standGroup = new THREE.Group();
    standGroup.position.copy(hihatPos);

    // Grounded symmetrical tripod base (radius 0.24m, collar height 0.18m)
    const tripodBase = this._createHardwareTripodBase(0.24, 0.18, -0.3);
    standGroup.add(tripodBase);

    // Central Chrome Stand Outer Column
    const lowerColumn = new THREE.Mesh(
      new THREE.CylinderGeometry(0.013, 0.013, 0.44, 14),
      this.chromeMaterial
    );
    lowerColumn.position.y = 0.22;
    lowerColumn.castShadow = true;
    standGroup.add(lowerColumn);

    // Height Adjustment Clamp Collar & Memory Lock
    const collar = new THREE.Mesh(
      new THREE.CylinderGeometry(0.017, 0.017, 0.024, 14),
      this.chromeMaterial
    );
    collar.position.y = 0.44;
    standGroup.add(collar);

    const clampScrew = new THREE.Mesh(
      new THREE.BoxGeometry(0.026, 0.008, 0.008),
      this.chromeMaterial
    );
    clampScrew.position.set(0.016, 0.44, 0);
    standGroup.add(clampScrew);

    // Telescoping Upper Chrome Tube extending to cymbal seat
    const upperColumn = new THREE.Mesh(
      new THREE.CylinderGeometry(0.010, 0.010, 0.28, 14),
      this.chromeMaterial
    );
    upperColumn.position.y = 0.58;
    upperColumn.castShadow = true;
    standGroup.add(upperColumn);

    // Center Chrome Pull Rod extending through entire stand
    const pullRod = new THREE.Mesh(
      new THREE.CylinderGeometry(0.004, 0.004, 0.82, 8),
      this.chromeMaterial
    );
    pullRod.position.y = 0.42;
    standGroup.add(pullRod);

    // 2. Foot Pedal Assembly (Sitting flat on the floor at y = 0)
    const pedalBase = new THREE.Group();
    pedalBase.position.set(0.05, 0, 0.09); // offset towards drummer
    pedalBase.rotation.y = 0.35; // facing drummer

    // Heel plate flat on floor
    const heelPlate = new THREE.Mesh(
      new THREE.BoxGeometry(0.08, 0.012, 0.06),
      this.blackTrimMaterial
    );
    heelPlate.position.set(0, 0.006, 0);
    pedalBase.add(heelPlate);

    // Footboard pivot at heel
    const footboardPivot = new THREE.Group();
    footboardPivot.position.set(0, 0.008, 0.03); // hinge point

    const footboard = new THREE.Mesh(
      new THREE.BoxGeometry(0.075, 0.010, 0.20),
      this.blackTrimMaterial
    );
    footboard.position.set(0, 0.005, 0.10);
    footboardPivot.add(footboard);

    // Chrome toe guard / pedal frame resting flat on floor
    const pedalFrame = new THREE.Mesh(
      new THREE.BoxGeometry(0.09, 0.014, 0.04),
      this.chromeMaterial
    );
    pedalFrame.position.set(0, 0.007, 0.21);
    pedalBase.add(pedalFrame);

    // Linkage connecting footboard toe to stand pull rod
    const linkage = new THREE.Mesh(
      new THREE.CylinderGeometry(0.003, 0.003, 0.06, 6),
      this.chromeMaterial
    );
    linkage.position.set(0, 0.035, 0.19);
    pedalBase.add(linkage);

    // Default angle: closed (pedal held down)
    footboardPivot.rotation.x = HIHAT_PEDAL_DOWN_ANGLE;
    pedalBase.add(footboardPivot);
    standGroup.add(pedalBase);
    this.hihatPedalFootboard = footboardPivot;

    // 3. Cymbals Assembly atop Stand
    const cymbalsGroup = new THREE.Group();
    cymbalsGroup.position.set(0, cymbalsHeight, 0);

    // Bottom Cymbal Seat Felt Washer
    const bottomSeatFelt = new THREE.Mesh(
      new THREE.CylinderGeometry(0.024, 0.024, 0.012, 16),
      this.feltMaterial
    );
    bottomSeatFelt.position.y = -0.012;
    cymbalsGroup.add(bottomSeatFelt);

    // Bottom Cymbal (Inverted, stationary on felt seat)
    const bottomCymbal = this._createCymbalMesh(0.22, true);
    bottomCymbal.position.y = 0.00;
    cymbalsGroup.add(bottomCymbal);

    // Top Cymbal with Clutch (attached to pull rod, moves up/down)
    const topPivot = new THREE.Group();
    topPivot.position.y = HIHAT_CLOSED_Y;

    const topCymbal = this._createCymbalMesh(0.22, false);
    topPivot.add(topCymbal);

    // Hi-Hat Clutch Assembly on top cymbal
    const clutchGroup = new THREE.Group();
    const clutchBarrel = new THREE.Mesh(
      new THREE.CylinderGeometry(0.011, 0.011, 0.055, 12),
      this.chromeMaterial
    );
    clutchBarrel.position.y = 0.038;
    clutchGroup.add(clutchBarrel);

    const tScrew = new THREE.Mesh(
      new THREE.BoxGeometry(0.028, 0.006, 0.008),
      this.chromeMaterial
    );
    tScrew.position.set(0.014, 0.052, 0);
    clutchGroup.add(tScrew);

    const clutchTopFelt = new THREE.Mesh(
      new THREE.CylinderGeometry(0.018, 0.018, 0.008, 16),
      this.feltMaterial
    );
    clutchTopFelt.position.y = 0.028;
    clutchGroup.add(clutchTopFelt);

    const clutchBottomFelt = new THREE.Mesh(
      new THREE.CylinderGeometry(0.018, 0.018, 0.008, 16),
      this.feltMaterial
    );
    clutchBottomFelt.position.y = 0.018;
    clutchGroup.add(clutchBottomFelt);

    topPivot.add(clutchGroup);
    cymbalsGroup.add(topPivot);
    this.hihatTopPivot = topPivot;

    standGroup.add(cymbalsGroup);
    this.group.add(standGroup);

    // Hit target for drumstick strikes
    this.pieceTargets.hihat = new THREE.Vector3(
      hihatPos.x,
      cymbalsHeight + HIHAT_CLOSED_Y + 0.020 + DRUMSTICK_CONTACT_CLEARANCE,
      hihatPos.z
    );
    this.pieceTargetTangents.hihat = new THREE.Vector3(1, 0, 0);
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
   * Helper to create realistic B20 cast bronze cymbal using LatheGeometry with thickness,
   * raised bell cup, concave bow, tapered rim, felt washers, and chrome butterfly wingnut.
   */
  _createCymbalMesh(radius, inverted = false, isChina = false) {
    const group = new THREE.Group();

    let points = [];
    if (isChina) {
      // China cymbal profile with inverted conical bell, steep bow, and reverse flared outer lip
      points = [
        new THREE.Vector2(0.007, 0.024),
        new THREE.Vector2(0.016, 0.026),
        new THREE.Vector2(radius * 0.16, 0.020),
        new THREE.Vector2(radius * 0.30, 0.012),
        new THREE.Vector2(radius * 0.55, 0.000),
        new THREE.Vector2(radius * 0.74, -0.010), // trough of reverse bend
        new THREE.Vector2(radius * 0.88, 0.008),  // flared upward
        new THREE.Vector2(radius * 0.98, 0.024),  // outer lip
        new THREE.Vector2(radius, 0.025),         // rim edge
        new THREE.Vector2(radius * 0.98, 0.022),  // return underside
        new THREE.Vector2(radius * 0.88, 0.006),
        new THREE.Vector2(radius * 0.74, -0.012),
        new THREE.Vector2(radius * 0.55, -0.002),
        new THREE.Vector2(radius * 0.30, 0.010),
        new THREE.Vector2(radius * 0.16, 0.018),
        new THREE.Vector2(0.016, 0.024),
        new THREE.Vector2(0.007, 0.022)
      ].reverse();
    } else {
      // Standard Cymbal profile with raised bell cup, concave bow, and rim thickness
      points = [
        new THREE.Vector2(0.007, 0.025),          // mounting hole top
        new THREE.Vector2(0.012, 0.026),          // bell crown
        new THREE.Vector2(radius * 0.15, 0.021),  // bell dome
        new THREE.Vector2(radius * 0.22, 0.013),  // bell shoulder transition
        new THREE.Vector2(radius * 0.45, 0.007),  // upper bow
        new THREE.Vector2(radius * 0.75, 0.003),  // mid bow
        new THREE.Vector2(radius * 0.95, 0.0008), // outer bow
        new THREE.Vector2(radius, 0.0000),        // rim top
        new THREE.Vector2(radius, -0.0018),       // rim outer edge (1.8mm thickness)
        new THREE.Vector2(radius * 0.95, -0.0010),// outer underside
        new THREE.Vector2(radius * 0.75, 0.0012), // mid underside
        new THREE.Vector2(radius * 0.45, 0.0052), // upper underside
        new THREE.Vector2(radius * 0.22, 0.0112), // bell shoulder underside
        new THREE.Vector2(radius * 0.15, 0.0192), // bell dome underside
        new THREE.Vector2(0.012, 0.0242),         // bell crown underside
        new THREE.Vector2(0.007, 0.0232)          // mounting hole bottom
      ].reverse();
    }

    const cymbalGeom = new THREE.LatheGeometry(points, 48);

    // Apply planar polar UV mapping so lathe texture maps concentric rings onto cymbal
    const pos = cymbalGeom.attributes.position;
    const uvs = new Float32Array(pos.count * 2);
    for (let i = 0; i < pos.count; i++) {
      const vx = pos.getX(i);
      const vz = pos.getZ(i);
      uvs[i * 2] = (vx / (radius * 2.05)) + 0.5;
      uvs[i * 2 + 1] = (vz / (radius * 2.05)) + 0.5;
    }
    cymbalGeom.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
    cymbalGeom.computeVertexNormals();

    if (inverted) {
      cymbalGeom.rotateX(Math.PI);
    }

    const cymbalMesh = new THREE.Mesh(cymbalGeom, this.cymbalMaterial);
    cymbalMesh.castShadow = true;
    cymbalMesh.receiveShadow = true;
    group.add(cymbalMesh);

    // Mounting Hardware (Felt washers, chrome sleeve, and butterfly wingnut)
    // Inverted cymbals (hi-hat bottom) do not have top wingnuts
    if (!inverted) {
      // --- Top Mounting Hardware ---
      // 1. Felt washer on bell
      const topFelt = new THREE.Mesh(
        new THREE.CylinderGeometry(0.018, 0.018, 0.010, 16),
        this.feltMaterial
      );
      topFelt.position.y = 0.028;
      group.add(topFelt);

      // 2. Chrome washer
      const topWasher = new THREE.Mesh(
        new THREE.CylinderGeometry(0.015, 0.015, 0.003, 16),
        this.chromeMaterial
      );
      topWasher.position.y = 0.034;
      group.add(topWasher);

      // 3. Central threaded spindle
      const centerPin = new THREE.Mesh(
        new THREE.CylinderGeometry(0.005, 0.005, 0.046, 12),
        this.chromeMaterial
      );
      centerPin.position.y = 0.025;
      group.add(centerPin);

      // 4. Chrome butterfly wingnut
      const wingnut = new THREE.Group();
      wingnut.position.y = 0.038;

      const collar = new THREE.Mesh(
        new THREE.CylinderGeometry(0.007, 0.007, 0.009, 12),
        this.chromeMaterial
      );
      wingnut.add(collar);

      const wingGeom = new THREE.BoxGeometry(0.003, 0.012, 0.014);
      const leftWing = new THREE.Mesh(wingGeom, this.chromeMaterial);
      leftWing.position.set(-0.010, 0.004, 0);
      leftWing.rotation.z = 0.28;
      wingnut.add(leftWing);

      const rightWing = new THREE.Mesh(wingGeom, this.chromeMaterial);
      rightWing.position.set(0.010, 0.004, 0);
      rightWing.rotation.z = -0.28;
      wingnut.add(rightWing);

      group.add(wingnut);

      // --- Bottom Mounting Hardware (CONCENTRIC UNDER BELL CUP) ---
      // 5. Bottom Felt washer supporting underside of the cymbal bell cup
      const bottomFelt = new THREE.Mesh(
        new THREE.CylinderGeometry(0.018, 0.018, 0.010, 16),
        this.feltMaterial
      );
      bottomFelt.position.y = 0.014;
      group.add(bottomFelt);

      // 6. Bottom Chrome cup washer supporting the bottom felt
      const bottomCup = new THREE.Mesh(
        new THREE.CylinderGeometry(0.016, 0.016, 0.004, 16),
        this.chromeMaterial
      );
      bottomCup.position.y = 0.007;
      group.add(bottomCup);

      // 7. Protective chrome cymbal sleeve / bushing
      const sleeve = new THREE.Mesh(
        new THREE.CylinderGeometry(0.007, 0.007, 0.024, 12),
        this.chromeMaterial
      );
      sleeve.position.y = 0.018;
      group.add(sleeve);

      // 8. Chrome Tilter Knuckle Joint (concentric on cymbal axis)
      const tilterKnuckle = new THREE.Mesh(
        new THREE.CylinderGeometry(0.011, 0.011, 0.024, 12),
        this.chromeMaterial
      );
      tilterKnuckle.rotation.z = Math.PI / 2;
      tilterKnuckle.position.y = -0.006;
      group.add(tilterKnuckle);

      // Tilter clamp wing-bolt
      const tilterBolt = new THREE.Mesh(
        new THREE.BoxGeometry(0.020, 0.006, 0.006),
        this.chromeMaterial
      );
      tilterBolt.position.set(-0.013, -0.006, 0);
      group.add(tilterBolt);

      // Tilter downward collar socket
      const tilterSocket = new THREE.Mesh(
        new THREE.CylinderGeometry(0.009, 0.009, 0.020, 12),
        this.chromeMaterial
      );
      tilterSocket.position.y = -0.020;
      group.add(tilterSocket);
    }

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

      const stickData = this._createDedicatedStickMesh(target, drummerOrigin);
      stickData.piece = piece;
      this.pieceSticks[piece] = stickData;
      this.group.add(stickData.pivot);
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

    // Unified seamless drumstick (single solid body from butt to acorn tip with zero gaps)
    const stickMesh = new THREE.Mesh(this.stickGeometry, this.stickMaterial);
    stickMesh.castShadow = true;
    stickArm.add(stickMesh);

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

  _selectStickKey(piece) {
    return piece;
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
    } else if (piece === 'hihat') {
      piece = 'hihatClosed';
    }

    // Foot-operated actions (Kick and Pedal Hi-Hat) do NOT use drumsticks!
    if (piece === 'kick' || piece === 'hihatPedal') return;

    // Closed and open hi-hat strikes share the physical 'hihat' stick
    const stickPiece = (piece === 'hihatClosed' || piece === 'hihatOpen') ? 'hihat' : piece;

    const vel = Math.max(0.35, Math.min(1.0, velocity));
    const stickKey = this._selectStickKey(stickPiece, eventTime, trackIndex);
    const stickData = this.pieceSticks[stickKey];
    if (!stickData) return;

    this._queuePreparedStrike(stickPiece, { stickKey, velocity: vel });

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
   * Note-On Event Trigger: executes snappy strike, elastic rebound,
   * settles into hovering ready position, and maintains persistent visibility like midis2jam2.
   * Also supports reverse cymbal exponential swell wobble on crash2!
   */
  onNoteOn(pitchOrPiece, velocity = 0.8, eventTime = null, trackIndex = null, duration = 1.5) {
    let piece = pitchOrPiece;
    if (typeof pitchOrPiece === 'number') {
      piece = this._mapPitchToPiece(pitchOrPiece);
    } else if (piece === 'hihat') {
      piece = 'hihatClosed';
    }

    const vel = Math.max(0.35, Math.min(1.0, velocity));

    if (piece === 'reverseCymbal') {
      this._triggerReverseCymbal(this.reverseCymbalPiece, vel, duration);
      return;
    }

    if (piece === 'kick') {
      this._animateKick(vel);
      return;
    }

    // Pedal Hi-Hat: cymbals clamp together via foot pedal, NO drumstick!
    if (piece === 'hihatPedal') {
      this._animateHiHatPedal(vel);
      return;
    }

    // Closed or Open Hi-Hat: drumstick hit + cymbal vibration
    if (piece === 'hihatClosed' || piece === 'hihatOpen') {
      this._animateHiHatStickHit(piece, vel, eventTime, trackIndex);
      return;
    }

    const prepared = this._takePreparedStrike(piece);
    const stickKey = prepared ? prepared.stickKey : this._selectStickKey(piece, eventTime, trackIndex);
    const stickVelocity = prepared ? prepared.velocity : vel;

    this._executeStickStrike(stickKey, stickVelocity);

    // Animate Drumhead or Cymbal
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

  /**
   * Executes realistic drumstick strike physics:
   * 1. Fast accelerating downstroke
   * 2. Elastic bounce / rebound
   * 3. Settle into hovering ready posture
   * 4. Persistent hover with idle timeout
   */
  _executeStickStrike(stickKey, stickVelocity) {
    const stickData = this.pieceSticks[stickKey];
    if (!stickData) return;

    if (stickData.idleTimeout) {
      clearTimeout(stickData.idleTimeout);
      stickData.idleTimeout = null;
    }

    stickData.pivot.visible = true;
    gsap.killTweensOf(stickData.stickArm.rotation);
    gsap.killTweensOf(stickData.pivot.position);

    const strike = gsap.timeline();

    // 1. FAST ACCELERATING DOWNSTROKE onto head/cymbal
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

    // 3. SETTLE INTO HOVERING READY POSTURE
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

    // 4. PERSISTENT HOVER / STICKINESS
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

  /**
   * Hi-Hat Pedal (MIDI Note 44):
   * Foot pedal action ONLY. Top cymbal snaps down against bottom cymbal and clamps shut,
   * canceling any active wobble. NO drumsticks are used.
   */
  _animateHiHatPedal(vel) {
    if (this.hihatCloseTimer) {
      clearTimeout(this.hihatCloseTimer);
      this.hihatCloseTimer = null;
    }
    this.hihatState = 'closed';

    // 1. Footboard snaps down with pedal stroke
    if (this.hihatPedalFootboard) {
      gsap.killTweensOf(this.hihatPedalFootboard.rotation);
      gsap.timeline()
        .to(this.hihatPedalFootboard.rotation, {
          x: HIHAT_PEDAL_DOWN_ANGLE - 0.02 * vel,
          duration: 0.032,
          ease: 'power4.in'
        })
        .to(this.hihatPedalFootboard.rotation, {
          x: HIHAT_PEDAL_DOWN_ANGLE,
          duration: 0.08,
          ease: 'elastic.out(1, 0.4)'
        });
    }

    // 2. Top cymbal snaps down against bottom cymbal with metallic contact impact
    if (this.hihatTopPivot) {
      gsap.killTweensOf(this.hihatTopPivot.position);
      gsap.killTweensOf(this.hihatTopPivot.rotation);

      gsap.timeline()
        .to(this.hihatTopPivot.position, {
          y: HIHAT_CLOSED_Y,
          duration: 0.032,
          ease: 'power4.in'
        })
        .to(this.hihatTopPivot.position, {
          y: HIHAT_CLOSED_Y + 0.0035 * vel,
          duration: 0.030,
          ease: 'power2.out'
        })
        .to(this.hihatTopPivot.position, {
          y: HIHAT_CLOSED_Y,
          duration: 0.045,
          ease: 'power3.in'
        });

      // Sharp metallic clamp/shudder, canceling wobble
      gsap.timeline()
        .to(this.hihatTopPivot.rotation, {
          x: 0.030 * vel,
          z: -0.012 * vel,
          duration: 0.025,
          ease: 'power3.out'
        })
        .to(this.hihatTopPivot.rotation, {
          x: 0,
          z: 0,
          duration: 0.05,
          ease: 'power2.out'
        });
    }
  }

  /**
   * Hi-Hat Stick Hit (Closed Note 42 or Open Note 46):
   * Dedicated drumstick strikes the hi-hat. If open, cymbals separate and sizzle loosely.
   * If closed, cymbals remain clamped with tight damped click response.
   */
  _animateHiHatStickHit(type, vel, eventTime, trackIndex) {
    const prepared = this._takePreparedStrike('hihat');
    const stickKey = prepared ? prepared.stickKey : this._selectStickKey('hihat', eventTime, trackIndex);
    const stickVelocity = prepared ? prepared.velocity : vel;

    // 1. Drumstick strike
    this._executeStickStrike(stickKey, stickVelocity);

    // 2. Cymbal dynamics
    if (type === 'hihatOpen') {
      this.hihatState = 'open';

      // Pedal footboard lifts up
      if (this.hihatPedalFootboard) {
        gsap.killTweensOf(this.hihatPedalFootboard.rotation);
        gsap.to(this.hihatPedalFootboard.rotation, {
          x: HIHAT_PEDAL_UP_ANGLE,
          duration: 0.08,
          ease: 'power2.out'
        });
      }

      // Top cymbal separates and oscillates loosely with open sizzle swing
      if (this.hihatTopPivot) {
        gsap.killTweensOf(this.hihatTopPivot.position);
        gsap.killTweensOf(this.hihatTopPivot.rotation);

        const tilt = 0.20 * vel;
        gsap.timeline()
          .to(this.hihatTopPivot.position, {
            y: HIHAT_OPEN_Y,
            duration: 0.045,
            ease: 'power2.out'
          })
          .to(this.hihatTopPivot.rotation, {
            x: tilt,
            z: tilt * 0.38,
            duration: 0.045,
            ease: 'power2.out'
          }, '<')
          .to(this.hihatTopPivot.rotation, {
            x: -tilt * 0.65,
            z: -tilt * 0.22,
            duration: 0.09,
            ease: 'sine.inOut'
          })
          .to(this.hihatTopPivot.rotation, {
            x: tilt * 0.32,
            z: tilt * 0.10,
            duration: 0.13,
            ease: 'sine.inOut'
          })
          .to(this.hihatTopPivot.rotation, {
            x: 0,
            z: 0,
            duration: 0.38,
            ease: 'elastic.out(1, 0.4)'
          });
      }

      // Automatically relax back to closed after the open sizzle ring expires
      if (this.hihatCloseTimer) clearTimeout(this.hihatCloseTimer);
      this.hihatCloseTimer = setTimeout(() => {
        if (this.hihatState === 'open') {
          this.hihatState = 'closed';
          if (this.hihatTopPivot) {
            gsap.to(this.hihatTopPivot.position, {
              y: HIHAT_CLOSED_Y,
              duration: 0.14,
              ease: 'power2.inOut'
            });
          }
          if (this.hihatPedalFootboard) {
            gsap.to(this.hihatPedalFootboard.rotation, {
              x: HIHAT_PEDAL_DOWN_ANGLE,
              duration: 0.14,
              ease: 'power2.inOut'
            });
          }
        }
      }, 700);

    } else {
      // hihatClosed: cymbals clamped tightly, small damped click
      if (this.hihatCloseTimer) {
        clearTimeout(this.hihatCloseTimer);
        this.hihatCloseTimer = null;
      }
      this.hihatState = 'closed';

      if (this.hihatPedalFootboard) {
        gsap.killTweensOf(this.hihatPedalFootboard.rotation);
        gsap.to(this.hihatPedalFootboard.rotation, {
          x: HIHAT_PEDAL_DOWN_ANGLE,
          duration: 0.04,
          ease: 'power3.out'
        });
      }

      if (this.hihatTopPivot) {
        gsap.killTweensOf(this.hihatTopPivot.position);
        gsap.killTweensOf(this.hihatTopPivot.rotation);

        const tilt = 0.055 * vel;
        gsap.timeline()
          .to(this.hihatTopPivot.position, {
            y: HIHAT_CLOSED_Y,
            duration: 0.03,
            ease: 'power3.out'
          })
          .to(this.hihatTopPivot.rotation, {
            x: tilt,
            z: tilt * 0.25,
            duration: 0.035,
            ease: 'power3.out'
          }, '<')
          .to(this.hihatTopPivot.rotation, {
            x: -tilt * 0.35,
            z: -tilt * 0.08,
            duration: 0.045,
            ease: 'power2.inOut'
          })
          .to(this.hihatTopPivot.rotation, {
            x: 0,
            z: 0,
            duration: 0.06,
            ease: 'power2.out'
          });
      }
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
   * Maps standard General MIDI drum note numbers to MIDIJam kit pieces:
   * 42 -> Closed Hi-Hat (stick strike on closed cymbals)
   * 44 -> Pedal Hi-Hat (foot pedal snap down, NO stick)
   * 46 -> Open Hi-Hat (stick strike on separated cymbals with loose sizzle)
   */
  _mapPitchToPiece(pitch) {
    if (pitch === 'reverseCymbal' || pitch === 'reverse_cymbal' || pitch === 119) return 'reverseCymbal';
    if (pitch === 35 || pitch === 36) return 'kick';
    if (pitch === 38 || pitch === 40 || pitch === 37) return 'snare';
    if (pitch === 42) return 'hihatClosed';
    if (pitch === 44) return 'hihatPedal';
    if (pitch === 46) return 'hihatOpen';
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

  /**
   * Reverse Cymbal Swell: Continuous physical crescendo roll & wobble
   * executed on crash2 using midis2jam2's reverse crescendo equation.
   * Completely mechanical WITHOUT glowing rings or shockwaves.
   */
  _triggerReverseCymbal(cymbalPiece = 'crash2', velocity = 0.8, duration = 1.5) {
    const vel = Math.max(0.35, Math.min(1.0, velocity));
    const noteDuration = Math.max(0.4, Math.min(8.0, duration || 1.5));
    const targetCymbal = this.cymbals[cymbalPiece] || this.cymbals.crash2;
    const stickData = this.pieceSticks[cymbalPiece] || this.pieceSticks.crash2;

    if (!targetCymbal || !stickData) return;

    // Reset current tweens on target cymbal and stick
    gsap.killTweensOf(targetCymbal.rotation);
    gsap.killTweensOf(stickData.stickArm.rotation);
    gsap.killTweensOf(stickData.pivot.position);

    if (stickData.idleTimeout) {
      clearTimeout(stickData.idleTimeout);
      stickData.idleTimeout = null;
    }
    stickData.pivot.visible = true;

    // Remove any existing active swell for this cymbal
    this.activeReverseCymbals = this.activeReverseCymbals.filter(s => s.piece !== cymbalPiece);

    this.activeReverseCymbals.push({
      piece: cymbalPiece,
      cymbal: targetCymbal,
      stickData: stickData,
      startTime: performance.now(),
      duration: noteDuration,
      velocity: vel
    });
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
    if (force) {
      // Force cancel all active reverse cymbal swells
      this.activeReverseCymbals.forEach(swell => {
        gsap.killTweensOf(swell.cymbal.rotation);
        swell.cymbal.rotation.set(0, 0, 0);
      });
      this.activeReverseCymbals = [];

      if (this.hihatCloseTimer) {
        clearTimeout(this.hihatCloseTimer);
        this.hihatCloseTimer = null;
      }
      this.hihatState = 'closed';
      if (this.hihatTopPivot) {
        gsap.killTweensOf(this.hihatTopPivot.position);
        gsap.killTweensOf(this.hihatTopPivot.rotation);
        this.hihatTopPivot.position.y = HIHAT_CLOSED_Y;
        this.hihatTopPivot.rotation.set(0, 0, 0);
      }
      if (this.hihatPedalFootboard) {
        gsap.killTweensOf(this.hihatPedalFootboard.rotation);
        this.hihatPedalFootboard.rotation.x = HIHAT_PEDAL_DOWN_ANGLE;
      }

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
      return;
    }

    // Natural note-off event: if a reverse cymbal was swelling, trigger its climax hit cleanly
    let piece = pitchOrPiece;
    if (typeof pitchOrPiece === 'number') piece = this._mapPitchToPiece(pitchOrPiece);
    if (piece === 'reverseCymbal') {
      const idx = this.activeReverseCymbals.findIndex(s => s.piece === this.reverseCymbalPiece);
      if (idx !== -1) {
        const swell = this.activeReverseCymbals.splice(idx, 1)[0];
        this._executeStickStrike(swell.piece, swell.velocity);
        this._animateCymbal(swell.cymbal, swell.velocity);
      }
    }
  }

  /**
   * Real-time frame loop: updates active reverse cymbal swell wobbles and drumstick rolls
   */
  update(delta) {
    if (this.activeReverseCymbals.length === 0) return;

    const now = performance.now();
    for (let i = this.activeReverseCymbals.length - 1; i >= 0; i--) {
      const swell = this.activeReverseCymbals[i];
      const elapsed = (now - swell.startTime) / 1000;
      const remaining = Math.max(0, swell.duration - elapsed);

      // Check if swell reached climax (at the end of duration)
      if (elapsed >= swell.duration) {
        this.activeReverseCymbals.splice(i, 1);
        this._executeStickStrike(swell.piece, swell.velocity);
        this._animateCymbal(swell.cymbal, swell.velocity);
        continue;
      }

      // Normalized progress (0.0 to 1.0)
      const progress = Math.min(1.0, elapsed / swell.duration);

      // --- Reverse Cymbal Physical Wobble Formula (midis2jam2 ReverseCymbal.kt) ---
      // Pure mechanical wobble WITHOUT glowing rings
      const AMPLITUDE = 0.28 * swell.velocity;
      const WOBBLE_SPEED = 4.5;
      const DAMPENING = 1.5;
      const s = remaining;
      const denom = 3.0 + Math.pow(s, 3.0) * WOBBLE_SPEED * DAMPENING * Math.PI;
      const wobbleAngle = AMPLITUDE * (Math.cos(s * WOBBLE_SPEED * Math.PI) / denom);

      // Precession tilt on the drumkit's crash cymbal
      swell.cymbal.rotation.x = wobbleAngle;
      swell.cymbal.rotation.z = wobbleAngle * 0.40 * Math.sin(elapsed * 9.0);

      // --- Accelerating Drumstick Roll / Scrape Swell ---
      const rollFreq = 16 + progress * 24;
      const rollAmp = 0.012 + 0.018 * Math.pow(progress, 2.0);
      const stickVibe = Math.sin(elapsed * rollFreq * Math.PI * 2) * rollAmp;

      swell.stickData.pivot.visible = true;
      swell.stickData.stickArm.rotation.x = (progress * 0.08 * swell.stickData.arcSign) + stickVibe;
      swell.stickData.pivot.position.y = swell.stickData.basePivotY - (progress * 0.012);
    }
  }
}
