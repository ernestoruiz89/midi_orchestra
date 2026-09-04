import * as THREE from 'three';
import gsap from 'gsap';

const DRUMSTICK_LENGTH = 0.38;
const DRUMSTICK_WRIST_HEIGHT = 0.20;
const DRUMSTICK_GRIP_LIFT = 0.085;
const DRUMSTICK_GRIP_READY = 0.045;
const DRUMSTICK_GRIP_REBOUND = 0.070;
const DRUMSTICK_LIFT_ANGLE = 0.42;
const DRUMSTICK_READY_ANGLE = 0.14;
const DRUMSTICK_IMPACT_ANGLE = 0.0;
const DRUMSTICK_REBOUND_ANGLE = 0.22;
const DRUMSTICK_IDLE_TIMEOUT_MS = 1600;

/**
 * Timbales3D: Professional Concert Latin Timbales with Agogô & Mambo Bell Set
 * - 2 Single-Headed Metal Timbales:
 *   - Macho (Left, 13" diameter, smoked black chrome / black nickel shell)
 *   - Hembra (Right, 14.5" diameter, smoked black chrome / black nickel shell)
 *   - 3 characteristic rolled ribs on each shell for authentic cascara resonance
 *   - Low-profile steel counterhoops with square-head tuning bolts
 *   - Smooth white Mylar drumheads
 * - Mounted Bell Assembly:
 *   - Central black steel mambo cowbell & agogô bell pair mounted on chrome post
 * - Stand:
 *   - Heavy-duty double-braced all-chrome tripod stand with memory locks
 * - Dedicated Timbalero Drumsticks:
 *   - Authentic wooden timbale sticks radiating from timbalero toward each piece,
 *     with anticipation backswing, high-speed impact downstroke, and elastic bounce.
 * - Physical animation:
 *   - Drumhead strike deflection, bright timbale shell rattle/vibration,
 *     and snappy bell nodding recoil on agogô/cowbell hits.
 */
export class Timbales3D {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();

    // Stage position: percussion section on drum riser, behind drums to the left
    this.group.position.set(-1.65, 0.20, -1.15);
    this.group.rotation.y = 0.12;

    // Component references
    this.machoGroup = null;
    this.hembraGroup = null;
    this.bellGroup = null;
    this.cowbellMesh = null;
    this.highAgogoMesh = null;
    this.lowAgogoMesh = null;

    this.machoHead = null;
    this.hembraHead = null;

    // Dedicated Drumsticks system (matching DrumKit3D)
    this.pieceTargets = {};
    this.pieceSticks = {};
    this.preparedStrikes = new Map();

    // Resting transforms for physics & tweens
    this.restTransforms = {
      macho: { y: 0.98, rx: 0, rz: 0 },
      hembra: { y: 0.98, rx: 0, rz: 0 },
      bells: { y: 1.20, rx: 0.06, rz: 0 },
      machoHead: { y: 0.082 },
      hembraHead: { y: 0.082 }
    };

    this._buildMaterials();
    this._buildStand();
    this._buildTimbales();
    this._buildBells();
    this._buildDedicatedPieceSticks();

    this.scene.add(this.group);
  }

  /* ------------------------------------------------------------------ */
  /*  MATERIALS                                                         */
  /* ------------------------------------------------------------------ */

  _buildMaterials() {
    // 1. Smoked Black Chrome / Black Nickel for Timbale Shells
    this.shellMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x363940,
      roughness: 0.14,
      metalness: 0.94,
      clearcoat: 0.95,
      clearcoatRoughness: 0.05
    });

    // 2. Mirror-Polished Bright Chrome for Stand, Rims, Tension Hardware
    this.chromeMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xe2e8f0,
      roughness: 0.10,
      metalness: 0.98,
      clearcoat: 1.0,
      clearcoatRoughness: 0.04
    });

    // 3. Smooth White Mylar Drumhead (Authentic Remo Ambassador style)
    this.drumheadMaterial = new THREE.MeshStandardMaterial({
      color: 0xf2f4f7,
      roughness: 0.38,
      metalness: 0.04
    });

    // 4. Dark Satin Gunmetal / Graphite Steel for Mambo Cowbell & Agogô Bells
    this.blackBellMaterial = new THREE.MeshStandardMaterial({
      color: 0x3c4048,
      roughness: 0.28,
      metalness: 0.82
    });

    // 5. Open Bell Cavity Interior Material
    this.bellCavityMaterial = new THREE.MeshBasicMaterial({
      color: 0x08080a
    });

    // 6. Heavy Molded Rubber for Tripod Feet
    this.rubberMaterial = new THREE.MeshStandardMaterial({
      color: 0x111111,
      roughness: 0.92,
      metalness: 0.02
    });

    // 7. Brass Brand Badge
    this.badgeMaterial = new THREE.MeshStandardMaterial({
      color: 0xc8a850,
      roughness: 0.28,
      metalness: 0.92
    });

    // 8. Hickory / Maple Wood Timbale Sticks (Authentic Natural Studio Finish)
    this.stickMaterial = new THREE.MeshStandardMaterial({
      color: 0xecd5ad,
      roughness: 0.30,
      metalness: 0.02
    });

    // Seamless continuous LatheGeometry for authentic Latin timbale sticks
    const stickPoints = [
      new THREE.Vector2(0.0000, 0.000), // rounded butt apex
      new THREE.Vector2(0.0050, 0.002), // butt curvature
      new THREE.Vector2(0.0068, 0.006), // butt to handle
      new THREE.Vector2(0.0068, 0.190), // cylindrical grip
      new THREE.Vector2(0.0065, 0.240), // subtle taper
      new THREE.Vector2(0.0052, 0.310), // taper
      new THREE.Vector2(0.0040, 0.355), // neck
      new THREE.Vector2(0.0052, 0.368), // tip bead belly
      new THREE.Vector2(0.0042, 0.375), // tip taper
      new THREE.Vector2(0.0000, DRUMSTICK_LENGTH) // tip apex (0.380)
    ];
    this.stickGeometry = new THREE.LatheGeometry(stickPoints, 18);
    this.stickGeometry.rotateX(Math.PI / 2);
    this.stickGeometry.computeVertexNormals();
  }

  /* ------------------------------------------------------------------ */
  /*  CHROME TRIPOD STAND                                               */
  /* ------------------------------------------------------------------ */

  _buildStand() {
    const stand = new THREE.Group();

    // 1. Double-braced chrome tripod base
    const legCount = 3;
    const legRadius = 0.35;
    const footHeight = 0.025;

    for (let i = 0; i < legCount; i++) {
      const angle = (i * Math.PI * 2) / legCount;
      const legGroup = new THREE.Group();
      legGroup.rotation.y = angle;

      // Chrome leg bar
      const legGeom = new THREE.CylinderGeometry(0.007, 0.007, 0.44, 10);
      const leg = new THREE.Mesh(legGeom, this.chromeMaterial);
      leg.rotation.z = -0.68;
      leg.position.set(0.16, 0.20, 0);
      leg.castShadow = true;
      legGroup.add(leg);

      // Chrome brace strut
      const strutGeom = new THREE.CylinderGeometry(0.005, 0.005, 0.26, 8);
      const strut = new THREE.Mesh(strutGeom, this.chromeMaterial);
      strut.rotation.z = 0.72;
      strut.position.set(0.15, 0.10, 0);
      strut.castShadow = true;
      legGroup.add(strut);

      // Molded ribbed rubber foot
      const footGeom = new THREE.CylinderGeometry(0.016, 0.022, footHeight, 10);
      const foot = new THREE.Mesh(footGeom, this.rubberMaterial);
      foot.position.set(legRadius, footHeight / 2, 0);
      foot.castShadow = true;
      legGroup.add(foot);

      stand.add(legGroup);
    }

    // Lower Hubs
    const hubGeom = new THREE.CylinderGeometry(0.026, 0.026, 0.045, 16);
    const collar = new THREE.Mesh(hubGeom, this.chromeMaterial);
    collar.position.y = 0.09;
    stand.add(collar);

    const mainHub = new THREE.Mesh(hubGeom, this.chromeMaterial);
    mainHub.position.y = 0.38;
    stand.add(mainHub);

    // 2. Lower Chrome Mast
    const lowerMastGeom = new THREE.CylinderGeometry(0.018, 0.018, 0.52, 16);
    const lowerMast = new THREE.Mesh(lowerMastGeom, this.chromeMaterial);
    lowerMast.position.y = 0.34;
    lowerMast.castShadow = true;
    stand.add(lowerMast);

    // Height Adjustment Collar with Wing Bolt
    const clampGeom = new THREE.CylinderGeometry(0.024, 0.024, 0.038, 16);
    const clamp = new THREE.Mesh(clampGeom, this.chromeMaterial);
    clamp.position.y = 0.58;
    stand.add(clamp);

    const wingScrew = this._createWingScrew();
    wingScrew.position.set(0.026, 0.58, 0);
    wingScrew.rotation.z = Math.PI / 2;
    stand.add(wingScrew);

    // 3. Upper Chrome Telescoping Mast
    const upperMastGeom = new THREE.CylinderGeometry(0.014, 0.014, 0.42, 16);
    const upperMast = new THREE.Mesh(upperMastGeom, this.chromeMaterial);
    upperMast.position.y = 0.77;
    upperMast.castShadow = true;
    stand.add(upperMast);

    // Memory Lock Collar
    const memLock = new THREE.Mesh(
      new THREE.CylinderGeometry(0.020, 0.020, 0.025, 14),
      this.chromeMaterial
    );
    memLock.position.y = 0.90;
    stand.add(memLock);

    // 4. Central Timbale Mounting Block (Black Steel)
    const blockGeom = new THREE.BoxGeometry(0.065, 0.045, 0.06);
    const mountBlock = new THREE.Mesh(blockGeom, this.blackBellMaterial);
    mountBlock.position.set(0, 0.96, 0);
    stand.add(mountBlock);

    // Left and Right mounting arms to timbale shells
    [-0.20, 0.20].forEach((xPos) => {
      const arm = new THREE.Mesh(
        new THREE.CylinderGeometry(0.010, 0.010, 0.18, 12),
        this.chromeMaterial
      );
      arm.rotation.z = Math.PI / 2;
      arm.position.set(xPos / 2, 0.96, 0);
      stand.add(arm);
    });

    this.group.add(stand);
  }

  _createWingScrew() {
    const group = new THREE.Group();
    const shaft = new THREE.Mesh(
      new THREE.CylinderGeometry(0.005, 0.005, 0.026, 8),
      this.chromeMaterial
    );
    group.add(shaft);

    const wings = new THREE.Mesh(
      new THREE.BoxGeometry(0.026, 0.009, 0.005),
      this.chromeMaterial
    );
    wings.position.y = 0.013;
    group.add(wings);
    return group;
  }

  /* ------------------------------------------------------------------ */
  /*  TIMBALES: MACHO (LEFT, 13") & HEMBRA (RIGHT, 14.5")               */
  /* ------------------------------------------------------------------ */

  _buildTimbales() {
    // 1. Macho (High Timbale, ~13" / radius 0.165m, height 0.165m)
    this.machoGroup = new THREE.Group();
    this.machoGroup.position.set(-0.21, this.restTransforms.macho.y, 0.0);
    this._assembleTimbaleDrum(this.machoGroup, {
      name: 'macho',
      radius: 0.165,
      height: 0.165,
      lugCount: 6
    });
    this.group.add(this.machoGroup);

    // 2. Hembra (Low Timbale, ~14.5" / radius 0.185m, height 0.165m)
    this.hembraGroup = new THREE.Group();
    this.hembraGroup.position.set(0.21, this.restTransforms.hembra.y, 0.0);
    this._assembleTimbaleDrum(this.hembraGroup, {
      name: 'hembra',
      radius: 0.185,
      height: 0.165,
      lugCount: 6
    });
    this.group.add(this.hembraGroup);
  }

  _assembleTimbaleDrum(parentGroup, config) {
    const { name, radius, height, lugCount } = config;
    const halfH = height / 2;

    // A. Smoked Black Chrome Shell (Bottomless single-headed cylinder)
    const shellGeom = new THREE.CylinderGeometry(radius, radius, height, 32, 1, true);
    const shell = new THREE.Mesh(shellGeom, this.shellMaterial);
    shell.castShadow = true;
    shell.receiveShadow = true;
    parentGroup.add(shell);

    // B. Three Rolled Reinforcing Ribs (Characteristic cascara beads)
    const ribOffsets = [-0.035, 0.0, 0.035];
    ribOffsets.forEach(ry => {
      const ribGeom = new THREE.TorusGeometry(radius + 0.002, 0.0035, 8, 32);
      const rib = new THREE.Mesh(ribGeom, this.shellMaterial);
      rib.rotation.x = Math.PI / 2;
      rib.position.y = ry;
      parentGroup.add(rib);
    });

    // C. Smooth White Mylar Drumhead
    const headGeom = new THREE.CircleGeometry(radius * 0.985, 32);
    const head = new THREE.Mesh(headGeom, this.drumheadMaterial);
    head.rotation.x = -Math.PI / 2;
    head.position.y = halfH - 0.001;
    head.receiveShadow = true;
    parentGroup.add(head);

    if (name === 'macho') {
      this.machoHead = head;
    } else {
      this.hembraHead = head;
    }

    // D. Low-Profile Steel Counterhoop Rim
    const rimGeom = new THREE.TorusGeometry(radius + 0.005, 0.008, 8, 32);
    const rim = new THREE.Mesh(rimGeom, this.chromeMaterial);
    rim.rotation.x = Math.PI / 2;
    rim.position.y = halfH + 0.003;
    rim.castShadow = true;
    parentGroup.add(rim);

    // Bottom rolled bearing lip
    const bottomLipGeom = new THREE.TorusGeometry(radius + 0.002, 0.003, 8, 32);
    const bottomLip = new THREE.Mesh(bottomLipGeom, this.chromeMaterial);
    bottomLip.rotation.x = Math.PI / 2;
    bottomLip.position.y = -halfH;
    parentGroup.add(bottomLip);

    // E. Tuning Lugs & Key Bolts
    for (let i = 0; i < lugCount; i++) {
      const angle = (i * Math.PI * 2) / lugCount + Math.PI / 6;
      const cosA = Math.cos(angle);
      const sinA = Math.sin(angle);

      // Casing block on shell
      const casing = new THREE.Mesh(
        new THREE.BoxGeometry(0.016, 0.024, 0.012),
        this.chromeMaterial
      );
      casing.position.set(cosA * (radius + 0.006), 0.02, sinA * (radius + 0.006));
      casing.rotation.y = -angle + Math.PI / 2;
      parentGroup.add(casing);

      // Tension rod from rim through casing
      const rod = new THREE.Mesh(
        new THREE.CylinderGeometry(0.003, 0.003, 0.075, 8),
        this.chromeMaterial
      );
      rod.position.set(cosA * (radius + 0.008), 0.045, sinA * (radius + 0.008));
      parentGroup.add(rod);

      // Square drum key head bolt at top
      const bolt = new THREE.Mesh(
        new THREE.BoxGeometry(0.007, 0.009, 0.007),
        this.chromeMaterial
      );
      bolt.position.set(cosA * (radius + 0.008), halfH + 0.008, sinA * (radius + 0.008));
      parentGroup.add(bolt);
    }

    // F. Front Oval Brand Badge
    const badgeGeom = new THREE.CylinderGeometry(0.020, 0.020, 0.003, 16);
    const badge = new THREE.Mesh(badgeGeom, this.badgeMaterial);
    badge.rotation.x = Math.PI / 2;
    badge.scale.set(1.4, 0.75, 1.0);
    badge.position.set(0, -0.02, radius + 0.002);
    parentGroup.add(badge);
  }

  /* ------------------------------------------------------------------ */
  /*  BELL ASSEMBLY: MAMBO COWBELL & AGOGÔ BELLS                        */
  /* ------------------------------------------------------------------ */

  /* ------------------------------------------------------------------ */
  /*  BELL ASSEMBLY: MAMBO COWBELL & AGOGÔ BELLS                        */
  /* ------------------------------------------------------------------ */

  _buildBells() {
    this.bellGroup = new THREE.Group();
    this.bellGroup.position.set(0, this.restTransforms.bells.y, -0.01);
    this.bellGroup.rotation.x = this.restTransforms.bells.rx;

    // 1. Chrome Central Mounting Post (from mounting block up past bells)
    const postGeom = new THREE.CylinderGeometry(0.007, 0.007, 0.28, 12);
    const post = new THREE.Mesh(postGeom, this.chromeMaterial);
    post.position.set(0, 0.02, 0);
    this.bellGroup.add(post);

    // Eyebolt clamp collar on post
    const clamp = new THREE.Mesh(
      new THREE.BoxGeometry(0.032, 0.024, 0.032),
      this.chromeMaterial
    );
    clamp.position.set(0, 0.03, 0);
    this.bellGroup.add(clamp);

    const wingScrew = this._createWingScrew();
    wingScrew.position.set(0, 0.03, -0.022);
    wingScrew.rotation.x = Math.PI / 2;
    this.bellGroup.add(wingScrew);

    // 2. MAMBO COWBELL (Pitch 56 / 68) - Mounted on angled chrome L-rod
    this.cowbellMesh = this._buildMamboCowbell();
    this.cowbellMesh.position.set(0.065, 0.05, 0.01);
    this.cowbellMesh.rotation.set(0.12, 0.12, -0.04);
    this.bellGroup.add(this.cowbellMesh);

    // Cowbell mounting arm (L-rod from post)
    const cowArmGeom = new THREE.CylinderGeometry(0.005, 0.005, 0.08, 8);
    const cowArm = new THREE.Mesh(cowArmGeom, this.chromeMaterial);
    cowArm.rotation.z = -Math.PI / 3;
    cowArm.position.set(0.032, 0.04, 0.0);
    this.bellGroup.add(cowArm);

    // 3. AGOGÔ BELL SET (High Pitch 67 & Low Pitch 68) - Mounted to the left
    const agogoAssembly = this._buildAgogoSet();
    agogoAssembly.position.set(-0.075, 0.04, 0.01);
    agogoAssembly.rotation.set(0.10, -0.15, 0.04);
    this.bellGroup.add(agogoAssembly);

    // Agogo mounting arm from post clamp
    const agogoArmGeom = new THREE.CylinderGeometry(0.005, 0.005, 0.07, 8);
    const agogoArm = new THREE.Mesh(agogoArmGeom, this.chromeMaterial);
    agogoArm.rotation.z = Math.PI / 3;
    agogoArm.position.set(-0.035, 0.038, 0.0);
    this.bellGroup.add(agogoArm);

    this.group.add(this.bellGroup);
  }

  _buildMamboCowbell() {
    const group = new THREE.Group();
    const length = 0.17;
    const mouthW = 0.082;
    const mouthH = 0.052;
    const baseW = 0.038;
    const baseH = 0.024;

    // Custom tapered box shape for cowbell
    const bellGeom = new THREE.BoxGeometry(1, 1, 1);
    const pos = bellGeom.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const z = pos.getZ(i); // -0.5 to +0.5
      const t = z + 0.5; // 0 (base) to 1 (mouth)
      const w = baseW + (mouthW - baseW) * t;
      const h = baseH + (mouthH - baseH) * t;
      pos.setX(i, pos.getX(i) * w);
      pos.setY(i, pos.getY(i) * h);
      pos.setZ(i, z * length);
    }
    bellGeom.computeVertexNormals();

    const body = new THREE.Mesh(bellGeom, this.blackBellMaterial);
    body.castShadow = true;
    group.add(body);

    // Recessed dark interior mouth face
    const cavityGeom = new THREE.PlaneGeometry(mouthW * 0.88, mouthH * 0.85);
    const cavity = new THREE.Mesh(cavityGeom, this.bellCavityMaterial);
    cavity.position.set(0, 0, length / 2 + 0.001);
    group.add(cavity);

    // Chrome/steel rim collar around the mouth opening
    const lipGeom = new THREE.BoxGeometry(mouthW * 1.02, mouthH * 1.02, 0.006);
    const lip = new THREE.Mesh(lipGeom, this.chromeMaterial);
    lip.position.set(0, 0, length / 2);
    group.add(lip);

    // Side weld seams for authentic fabricated steel look
    [-mouthW / 2, mouthW / 2].forEach(x => {
      const seamGeom = new THREE.CylinderGeometry(0.0018, 0.0018, length, 6);
      const seam = new THREE.Mesh(seamGeom, this.chromeMaterial);
      seam.rotation.x = Math.PI / 2;
      seam.position.set(x, 0, 0);
      group.add(seam);
    });

    return group;
  }

  _buildAgogoSet() {
    const setGroup = new THREE.Group();

    // 1. High Agogô Bell (Pitch 67, small conical/pyramidal)
    this.highAgogoMesh = this._createAgogoBell(0.048, 0.034, 0.115);
    this.highAgogoMesh.position.set(-0.022, 0.045, 0.0);
    this.highAgogoMesh.rotation.set(-0.06, 0.05, 0.08);
    setGroup.add(this.highAgogoMesh);

    // 2. Low Agogô Bell (Pitch 68, larger conical/pyramidal)
    this.lowAgogoMesh = this._createAgogoBell(0.062, 0.044, 0.155);
    this.lowAgogoMesh.position.set(0.022, -0.015, 0.01);
    this.lowAgogoMesh.rotation.set(0.04, -0.04, -0.06);
    setGroup.add(this.lowAgogoMesh);

    // 3. Arched U-shaped flexible spring steel handle connecting both bells
    const handleGeom = new THREE.TorusGeometry(0.026, 0.0035, 8, 24, Math.PI);
    const handle = new THREE.Mesh(handleGeom, this.chromeMaterial);
    handle.rotation.z = Math.PI / 2;
    handle.rotation.y = Math.PI / 2;
    handle.position.set(0, 0.015, -0.085);
    setGroup.add(handle);

    return setGroup;
  }

  _createAgogoBell(mouthW, mouthH, length) {
    const group = new THREE.Group();
    const baseW = 0.014;
    const baseH = 0.012;

    const geom = new THREE.BoxGeometry(1, 1, 1);
    const pos = geom.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const z = pos.getZ(i);
      const t = z + 0.5; // 0 to 1
      const w = baseW + (mouthW - baseW) * t;
      const h = baseH + (mouthH - baseH) * t;
      pos.setX(i, pos.getX(i) * w);
      pos.setY(i, pos.getY(i) * h);
      pos.setZ(i, z * length);
    }
    geom.computeVertexNormals();

    const mesh = new THREE.Mesh(geom, this.blackBellMaterial);
    mesh.castShadow = true;
    group.add(mesh);

    // Recessed dark mouth cavity
    const cavity = new THREE.Mesh(
      new THREE.PlaneGeometry(mouthW * 0.86, mouthH * 0.84),
      this.bellCavityMaterial
    );
    cavity.position.set(0, 0, length / 2 + 0.001);
    group.add(cavity);

    // Chrome lip highlight
    const lip = new THREE.Mesh(
      new THREE.BoxGeometry(mouthW * 1.03, mouthH * 1.03, 0.004),
      this.chromeMaterial
    );
    lip.position.set(0, 0, length / 2);
    group.add(lip);

    return group;
  }

  /* ------------------------------------------------------------------ */
  /*  DEDICATED DRUMSTICKS SYSTEM (Matching DrumKit3D)                  */
  /* ------------------------------------------------------------------ */

  _buildDedicatedPieceSticks() {
    // Ergonomic playing positions: timbalero standing in front of the timbales (+Z foreground) facing the set
    const handOrigins = {
      macho: new THREE.Vector3(-0.16, 1.04, 0.39),
      highAgogo: new THREE.Vector3(-0.12, 1.04, 0.32),
      lowAgogo: new THREE.Vector3(0.08, 1.04, 0.34),
      cowbell: new THREE.Vector3(0.12, 1.04, 0.35),
      hembra: new THREE.Vector3(0.16, 1.04, 0.39)
    };

    this.pieceTargets = {
      macho: new THREE.Vector3(-0.21, this.restTransforms.macho.y + this.restTransforms.machoHead.y + 0.006, 0.02),
      hembra: new THREE.Vector3(0.21, this.restTransforms.hembra.y + this.restTransforms.hembraHead.y + 0.006, 0.02),
      cowbell: new THREE.Vector3(0.065, this.restTransforms.bells.y + 0.065, 0.04),
      highAgogo: new THREE.Vector3(-0.095, this.restTransforms.bells.y + 0.085, 0.02),
      lowAgogo: new THREE.Vector3(-0.055, this.restTransforms.bells.y + 0.025, 0.03)
    };

    Object.entries(this.pieceTargets).forEach(([piece, targetPos]) => {
      const handOrigin = handOrigins[piece] || new THREE.Vector3(0, 1.04, 0.38);
      const stickData = this._createDedicatedStickMesh(targetPos, handOrigin);
      stickData.piece = piece;
      this.pieceSticks[piece] = stickData;
      this.group.add(stickData.pivot);
    });
  }

  _createDedicatedStickMesh(targetPos, handOrigin) {
    const pivot = new THREE.Group();

    // Stick points from hand in front directly to target on drum/bell
    const dir = new THREE.Vector3().subVectors(targetPos, handOrigin).normalize();
    pivot.position.copy(targetPos).addScaledVector(dir, -DRUMSTICK_LENGTH);

    // Orthonormal basis with horizontal X axis for natural vertical wrist hinge
    const localZ = dir.clone().normalize();
    let localX = new THREE.Vector3(-localZ.z, 0, localZ.x).normalize();
    if (localX.lengthSq() < 0.0001) localX.set(1, 0, 0);
    let localY = new THREE.Vector3().crossVectors(localZ, localX).normalize();
    if (localY.y < 0) {
      localX.negate();
      localY.negate();
    }

    const mat = new THREE.Matrix4().makeBasis(localX, localY, localZ);
    pivot.quaternion.setFromRotationMatrix(mat);

    const neutralTip = new THREE.Vector3(0, 0, DRUMSTICK_LENGTH).applyQuaternion(pivot.quaternion);
    const positiveTestTip = new THREE.Vector3(0, 0, DRUMSTICK_LENGTH)
      .applyAxisAngle(new THREE.Vector3(1, 0, 0), 0.1)
      .applyQuaternion(pivot.quaternion);
    const arcSign = positiveTestTip.y > neutralTip.y ? 1 : -1;

    const stickArm = new THREE.Group();
    const stickMesh = new THREE.Mesh(this.stickGeometry, this.stickMaterial);
    stickMesh.castShadow = true;
    stickArm.add(stickMesh);

    pivot.add(stickArm);
    pivot.visible = false;

    return {
      pivot,
      stickArm,
      arcSign,
      basePivotY: pivot.position.y,
      idleTimeout: null
    };
  }

  _mapPitchToPiece(midiPitch) {
    if (midiPitch === 56) return 'cowbell';
    if (midiPitch === 65) return 'macho';
    if (midiPitch === 66) return 'hembra';
    if (midiPitch === 67) return 'highAgogo';
    if (midiPitch === 68) return 'lowAgogo';
    if (midiPitch < 66) return 'hembra';
    return 'macho';
  }

  _arcAngle(stickData, baseAngle, velocity = 1.0) {
    return baseAngle * stickData.arcSign * velocity;
  }

  _queuePreparedStrike(piece, preparedStrike) {
    const queue = this.preparedStrikes.get(piece) || [];
    queue.push(preparedStrike);
    this.preparedStrikes.set(piece, queue);
  }

  _takePreparedStrike(piece) {
    const queue = this.preparedStrikes.get(piece);
    if (!queue || queue.length === 0) return null;
    return queue.shift();
  }

  /* ------------------------------------------------------------------ */
  /*  PHYSICAL NOTE ANIMATION & SPRING RECOIL                           */
  /* ------------------------------------------------------------------ */

  /**
   * Anticipation backswing wind-up before the note impact (matches midis2jam2 / DrumKit3D).
   */
  onNotePrepare(midiPitch, velocity = 0.8, duration = 0.5, eventTime = null, trackIndex = null) {
    const piece = this._mapPitchToPiece(midiPitch);
    const stickData = this.pieceSticks[piece];
    if (!stickData) return;

    const vel = Math.max(0.35, Math.min(1.0, velocity));
    this._queuePreparedStrike(piece, { velocity: vel });

    if (stickData.idleTimeout) {
      clearTimeout(stickData.idleTimeout);
      stickData.idleTimeout = null;
    }

    stickData.pivot.visible = true;
    gsap.killTweensOf(stickData.stickArm.rotation);
    gsap.killTweensOf(stickData.pivot.position);

    // Anticipation: dynamic wind-up backswing
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
   * Note-On Event Trigger: executes snappy downstroke, elastic bounce,
   * settles into hovering ready posture, and maintains persistent hover.
   */
  onNoteOn(midiPitch, velocity = 0.8, eventTime = null, trackIndex = null, duration = 0.4) {
    const vel = Math.max(0.2, Math.min(1.0, velocity));
    const piece = this._mapPitchToPiece(midiPitch);

    const prepared = this._takePreparedStrike(piece);
    const stickVelocity = prepared ? prepared.velocity : vel;

    // 1. Execute drumstick strike animation
    this._executeStickStrike(piece, stickVelocity);

    // 2. Animate piece vibration & deflection
    if (piece === 'macho') {
      this._strikeTimbale(this.machoGroup, this.machoHead, this.restTransforms.macho, this.restTransforms.machoHead.y, vel, true);
    } else if (piece === 'hembra') {
      this._strikeTimbale(this.hembraGroup, this.hembraHead, this.restTransforms.hembra, this.restTransforms.hembraHead.y, vel, false);
    } else if (piece === 'cowbell') {
      this._strikeBell(this.cowbellMesh, vel, 0.0);
    } else if (piece === 'highAgogo') {
      this._strikeBell(this.highAgogoMesh, vel, -0.04);
    } else if (piece === 'lowAgogo') {
      this._strikeBell(this.lowAgogoMesh, vel, 0.04);
    }
  }

  _executeStickStrike(piece, stickVelocity) {
    const stickData = this.pieceSticks[piece];
    if (!stickData) return;

    if (stickData.idleTimeout) {
      clearTimeout(stickData.idleTimeout);
      stickData.idleTimeout = null;
    }

    stickData.pivot.visible = true;
    gsap.killTweensOf(stickData.stickArm.rotation);
    gsap.killTweensOf(stickData.pivot.position);

    const strike = gsap.timeline();

    // 1. FAST ACCELERATING DOWNSTROKE onto head/bell
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

    // 4. PERSISTENT HOVER / IDLE TIMEOUT
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

  _strikeTimbale(timbaleGroup, headMesh, restPos, restHeadY, vel, isMacho) {
    if (!timbaleGroup || !headMesh) return;

    // 1. Instantaneous membrane deflection & rapid snap recovery
    gsap.killTweensOf(headMesh.position);
    headMesh.position.y = restHeadY - 0.007 * vel;

    gsap.to(headMesh.position, {
      y: restHeadY,
      duration: 0.12,
      ease: 'elastic.out(1.3, 0.28)'
    });

    // 2. High-energy rimshot / cascara shell tilt & rapid vibration
    gsap.killTweensOf(timbaleGroup.rotation);
    gsap.killTweensOf(timbaleGroup.position);

    const tiltX = -0.038 * vel;
    const tiltZ = (isMacho ? -0.028 : 0.028) * vel;

    timbaleGroup.position.y = restPos.y - 0.004 * vel;
    timbaleGroup.rotation.x = tiltX;
    timbaleGroup.rotation.z = tiltZ;

    gsap.to(timbaleGroup.position, {
      y: restPos.y,
      duration: 0.22,
      ease: 'elastic.out(1.2, 0.35)'
    });

    gsap.to(timbaleGroup.rotation, {
      x: restPos.rx,
      z: restPos.rz,
      duration: 0.22,
      ease: 'elastic.out(1.2, 0.35)'
    });
  }

  _strikeBell(bellMesh, vel, rollZAmount = 0.0) {
    if (!bellMesh || !this.bellGroup) return;

    // 1. Individual Bell Snappy Recoil
    gsap.killTweensOf(bellMesh.rotation);
    const nodX = (bellMesh === this.cowbellMesh ? 0.085 : 0.065) * vel;
    if (!bellMesh.userData) bellMesh.userData = {};
    if (!bellMesh.userData.restRot) {
      bellMesh.userData.restRot = {
        x: bellMesh.rotation.x,
        y: bellMesh.rotation.y,
        z: bellMesh.rotation.z
      };
    }
    const restRot = bellMesh.userData.restRot;

    bellMesh.rotation.x = restRot.x + nodX;
    bellMesh.rotation.z = restRot.z + rollZAmount * vel;

    gsap.to(bellMesh.rotation, {
      x: restRot.x,
      z: restRot.z,
      duration: 0.22,
      ease: 'elastic.out(1.3, 0.32)'
    });

    // 2. Center Post Subtle Vibration
    gsap.killTweensOf(this.bellGroup.rotation);
    const postRest = this.restTransforms.bells;
    this.bellGroup.rotation.x = postRest.rx + 0.018 * vel;

    gsap.to(this.bellGroup.rotation, {
      x: postRest.rx,
      duration: 0.18,
      ease: 'power2.out'
    });
  }

  onNoteOff(midiPitch, force = false) {
    if (force) {
      if (this.machoGroup) gsap.killTweensOf(this.machoGroup.rotation);
      if (this.hembraGroup) gsap.killTweensOf(this.hembraGroup.rotation);
      if (this.bellGroup) gsap.killTweensOf(this.bellGroup.rotation);

      if (this.machoGroup) this.machoGroup.rotation.set(0, 0, 0);
      if (this.hembraGroup) this.hembraGroup.rotation.set(0, 0, 0);
      if (this.bellGroup) this.bellGroup.rotation.set(this.restTransforms.bells.rx, 0, 0);

      Object.values(this.pieceSticks).forEach(stickData => {
        if (stickData.idleTimeout) {
          clearTimeout(stickData.idleTimeout);
          stickData.idleTimeout = null;
        }
        gsap.killTweensOf(stickData.stickArm.rotation);
        gsap.killTweensOf(stickData.pivot.position);
        stickData.pivot.visible = false;
      });
      this.preparedStrikes.clear();
    }
  }

  update(delta) {
    // Animation frame hook
  }
}
