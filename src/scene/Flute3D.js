import * as THREE from 'three';
import gsap from 'gsap';

/**
 * Flute3D: Photorealistic Custom Concert Grand Flute (Boehm System)
 * - Solid Sterling Silver (.925) body, headjoint, and footjoint.
 * - 14k Gold Lip Plate with ergonomic chin contour and beveled embouchure hole.
 * - Turned silver crown with gold medallion and internal natural cork stopper.
 * - 16 animated key cups with French pointed arms (bras pointus), pads, and gold resonators.
 * - Steel axle rods, soldered posts, ribs, trill spatulas, and thumb levers.
 * - Authentic Boehm acoustic column fingering engine (C4 to C7).
 * - Continuous helical breath vortex and resonant acoustic column dynamics during sustained notes.
 * - Professional weighted concert floor stand with velvet-cushioned dual horizontal cradles.
 */
export class Flute3D {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();
    // Positioned front-right inner stage
    this.group.position.set(1.6, 1.30, 1.8);
    // A transverse flute is presented horizontally across the stage, with its
    // body pointing to audience-right rather than projecting like a trumpet.
    this.group.rotation.set(-0.04, 0, -0.04);

    this.keys = [];
    this.breathParticles = [];
    this.breathIntakeOrigin = new THREE.Vector3(-0.25, 0.018, 0);
    this.airOutputRings = [];
    this.airOutputOrigin = new THREE.Vector3(0.354, 0, 0);
    this.airOutputDirection = new THREE.Vector3(1, 0, 0);
    this.activeNote = null;
    this.resonancePhase = 0;

    this._buildMaterials();
    this._buildStand();
    this._buildHeadjoint();
    this._buildBodyJoint();
    this._buildFootjoint();
    this._buildKeyMechanism();
    this._buildBreathDynamics();

    this.scene.add(this.group);
  }

  _buildMaterials() {
    // Mirror-Polished Sterling Silver (.925)
    this.silverMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xf0f2f5,
      emissive: 0x051525,
      emissiveIntensity: 0.12,
      roughness: 0.08,
      metalness: 0.98,
      clearcoat: 1.0,
      clearcoatRoughness: 0.04
    });

    // 14k Solid Gold (Lip Plate, Riser, Crown Medallion, Key Resonator Washers)
    this.gold14kMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xf5ca5d,
      emissive: 0x221503,
      emissiveIntensity: 0.18,
      roughness: 0.10,
      metalness: 0.92,
      clearcoat: 0.95,
      clearcoatRoughness: 0.05
    });

    // Hardened Surgical Steel (Axle Rods, Pivot Screws)
    this.steelRodMaterial = new THREE.MeshStandardMaterial({
      color: 0xdde2e8,
      roughness: 0.16,
      metalness: 0.94
    });

    // Natural Portuguese Cork Stopper
    this.corkMaterial = new THREE.MeshStandardMaterial({
      color: 0xc49a6c,
      roughness: 0.85,
      metalness: 0.02
    });

    // Yellow Felt / Bladder Acoustic Pads
    this.padMaterial = new THREE.MeshStandardMaterial({
      color: 0xfff8dc,
      roughness: 0.60,
      metalness: 0.05
    });

    // Dark Acoustic Interior Cavity (Bore & Embouchure Chimney)
    this.boreInteriorMaterial = new THREE.MeshBasicMaterial({
      color: 0x0a0d12
    });

    // Black Velvet Cushioning for Stand Cradles
    this.velvetMaterial = new THREE.MeshStandardMaterial({
      color: 0x111115,
      roughness: 0.95,
      metalness: 0.02
    });

    // Chrome Base & Stand Column
    this.chromeStandMaterial = new THREE.MeshStandardMaterial({
      color: 0xd8d8d8,
      roughness: 0.14,
      metalness: 0.92
    });
  }

  _buildStand() {
    const stand = new THREE.Group();
    stand.position.set(0, -1.30, 0);

    // 1. Heavy cast round chrome base with beveled edge and rubber feet
    const baseGeom = new THREE.CylinderGeometry(0.18, 0.21, 0.032, 24);
    const base = new THREE.Mesh(baseGeom, this.chromeStandMaterial);
    stand.add(base);

    // 3 Black rubber feet underneath
    for (let i = 0; i < 3; i++) {
      const angle = (i * Math.PI * 2) / 3;
      const foot = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.008, 12), this.velvetMaterial);
      foot.position.set(Math.cos(angle) * 0.17, -0.018, Math.sin(angle) * 0.17);
      stand.add(foot);
    }

    // 2. Telescopic central column with knurled collar
    const lowerPole = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.65, 12), this.chromeStandMaterial);
    lowerPole.position.y = 0.32;
    stand.add(lowerPole);

    const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.035, 16), this.gold14kMaterial);
    collar.position.y = 0.65;
    stand.add(collar);

    const upperPole = new THREE.Mesh(new THREE.CylinderGeometry(0.009, 0.009, 0.62, 12), this.chromeStandMaterial);
    upperPole.position.y = 0.96;
    stand.add(upperPole);

    // 3. Horizontal T-bar carrying dual velvet support cradles
    const tBar = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.014, 0.014), this.chromeStandMaterial);
    tBar.position.set(0.03, 1.25, 0);
    stand.add(tBar);

    // Headjoint support cradle (left side, x = -0.19)
    const leftCradle = this._createCradle(-0.19);
    stand.add(leftCradle);

    // Footjoint support cradle (right side, x = +0.25)
    const rightCradle = this._createCradle(0.25);
    stand.add(rightCradle);

    this.group.add(stand);
  }

  _createCradle(xPos) {
    const cg = new THREE.Group();
    cg.position.set(xPos, 1.25, 0);

    // Vertical riser pin
    const pin = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.028, 8), this.chromeStandMaterial);
    pin.position.y = 0.014;
    cg.add(pin);

    // U-shaped metal cradle prong
    const uProng = new THREE.Mesh(new THREE.TorusGeometry(0.014, 0.0035, 8, 16, Math.PI), this.chromeStandMaterial);
    uProng.position.y = 0.028;
    uProng.rotation.x = Math.PI / 2;
    cg.add(uProng);

    // Inner velvet cushion strip lining the cradle
    const velvetLining = new THREE.Mesh(new THREE.TorusGeometry(0.0125, 0.0032, 6, 16, Math.PI * 0.9), this.velvetMaterial);
    velvetLining.position.y = 0.028;
    velvetLining.rotation.x = Math.PI / 2;
    cg.add(velvetLining);

    return cg;
  }

  _buildHeadjoint() {
    const headGroup = new THREE.Group();

    // 1. Headjoint Main Tube (parabolic taper from crown x=-0.33 to barrel x=-0.15)
    const headTubeGeom = new THREE.CylinderGeometry(0.0095, 0.0092, 0.18, 24);
    headTubeGeom.rotateZ(Math.PI / 2);
    const headTube = new THREE.Mesh(headTubeGeom, this.silverMaterial);
    headTube.position.set(-0.24, 0, 0);
    headTube.castShadow = true;
    headGroup.add(headTube);

    // 2. Headjoint-to-Body Tenon Connecting Barrel Ring at x = -0.15
    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.0102, 0.0102, 0.016, 24), this.silverMaterial);
    barrel.rotation.z = Math.PI / 2;
    barrel.position.set(-0.15, 0, 0);
    headGroup.add(barrel);

    // Decorative fine-cut gold barrel ring
    const barrelGoldRing = new THREE.Mesh(new THREE.CylinderGeometry(0.0104, 0.0104, 0.003, 24), this.gold14kMaterial);
    barrelGoldRing.rotation.z = Math.PI / 2;
    barrelGoldRing.position.set(-0.15, 0, 0);
    headGroup.add(barrelGoldRing);

    // 3. Turned Silver & 14k Gold Crown Assembly at x = -0.34
    const crownGroup = new THREE.Group();
    crownGroup.position.set(-0.332, 0, 0);

    // Crown outer collar with knurled grip
    const crownBody = new THREE.Mesh(new THREE.CylinderGeometry(0.0108, 0.0094, 0.018, 24), this.silverMaterial);
    crownBody.rotation.z = Math.PI / 2;
    crownGroup.add(crownBody);

    // Gold decorative accent band
    const crownBand = new THREE.Mesh(new THREE.CylinderGeometry(0.0110, 0.0110, 0.0035, 24), this.gold14kMaterial);
    crownBand.rotation.z = Math.PI / 2;
    crownBand.position.x = -0.004;
    crownGroup.add(crownBand);

    // Polished gold dome medallion at crown tip
    const crownCap = new THREE.Mesh(new THREE.SphereGeometry(0.0095, 16, 8, 0, Math.PI * 2, 0, Math.PI * 0.5), this.gold14kMaterial);
    crownCap.rotation.z = Math.PI / 2;
    crownCap.position.x = -0.009;
    crownGroup.add(crownCap);

    // Natural cork stopper interior
    const cork = new THREE.Mesh(new THREE.CylinderGeometry(0.0084, 0.0084, 0.012, 16), this.corkMaterial);
    cork.rotation.z = Math.PI / 2;
    cork.position.x = 0.012;
    crownGroup.add(cork);

    headGroup.add(crownGroup);

    // 4. Solid 14k Gold Lip Plate & Embouchure Chimney Assembly at x = -0.25
    const lipGroup = new THREE.Group();
    lipGroup.position.set(-0.25, 0, 0);

    // Gold Riser / Chimney connecting tube to lip plate
    const riserGeom = new THREE.CylinderGeometry(0.0085, 0.0085, 0.0045, 20);
    const riser = new THREE.Mesh(riserGeom, this.gold14kMaterial);
    riser.position.set(0, 0.0105, 0);
    lipGroup.add(riser);

    // Anatomical Lip Plate (curved silver/gold plate shaped for player's lower lip)
    const lipShape = new THREE.Shape();
    lipShape.moveTo(-0.016, -0.011);
    lipShape.bezierCurveTo(-0.016, 0.009, -0.008, 0.013, 0, 0.013);
    lipShape.bezierCurveTo(0.008, 0.013, 0.016, 0.009, 0.016, -0.011);
    lipShape.bezierCurveTo(0.008, -0.013, -0.008, -0.013, -0.016, -0.011);

    const lipExtrude = new THREE.ExtrudeGeometry(lipShape, {
      depth: 0.0022,
      bevelEnabled: true,
      bevelSegments: 4,
      steps: 1,
      bevelSize: 0.0018,
      bevelThickness: 0.0018
    });
    const lipMesh = new THREE.Mesh(lipExtrude, this.gold14kMaterial);
    lipMesh.rotation.x = -Math.PI / 2;
    lipMesh.position.set(0, 0.0135, 0);
    lipGroup.add(lipMesh);

    // Precision Oval Embouchure Hole with dark acoustic bore view
    const holeGeom = new THREE.CylinderGeometry(0.0042, 0.0042, 0.007, 16);
    holeGeom.scale(1.25, 1.0, 0.95);
    const holeInterior = new THREE.Mesh(holeGeom, this.boreInteriorMaterial);
    holeInterior.position.set(0, 0.0125, 0);
    lipGroup.add(holeInterior);

    // Beveled gold embouchure blowing edge ring
    const edgeRing = new THREE.Mesh(new THREE.TorusGeometry(0.0045, 0.0009, 8, 20), this.gold14kMaterial);
    edgeRing.rotation.x = Math.PI / 2;
    edgeRing.scale.set(1.25, 0.95, 1.0);
    edgeRing.position.set(0, 0.0152, 0);
    lipGroup.add(edgeRing);

    headGroup.add(lipGroup);
    this.group.add(headGroup);
    this.lipGroup = lipGroup;
  }

  _buildBodyJoint() {
    const bodyGroup = new THREE.Group();

    // 1. Sterling Silver Body Tube (x = -0.15 to +0.21, length 0.36m, diameter 0.019m)
    const bodyTubeGeom = new THREE.CylinderGeometry(0.0095, 0.0095, 0.36, 28);
    bodyTubeGeom.rotateZ(Math.PI / 2);
    const bodyTube = new THREE.Mesh(bodyTubeGeom, this.silverMaterial);
    bodyTube.position.set(0.03, 0, 0);
    bodyTube.castShadow = true;
    bodyGroup.add(bodyTube);

    // 2. Long Steel Axle Rod System & Soldered Mounting Posts
    // Main long rod running parallel along the upper-rear side of the flute
    const mainRod = new THREE.Mesh(new THREE.CylinderGeometry(0.0014, 0.0014, 0.35, 10), this.steelRodMaterial);
    mainRod.rotation.z = Math.PI / 2;
    mainRod.position.set(0.035, 0.0105, 0.0085);
    bodyGroup.add(mainRod);

    // Secondary parallel rod for trill and G-offset mechanism
    const secRod = new THREE.Mesh(new THREE.CylinderGeometry(0.0012, 0.0012, 0.18, 8), this.steelRodMaterial);
    secRod.rotation.z = Math.PI / 2;
    secRod.position.set(-0.02, 0.0125, 0.0075);
    bodyGroup.add(secRod);

    // 6 Soldered Solid Silver Mounting Posts (Pilarcillos)
    const postPositions = [-0.13, -0.07, -0.01, 0.06, 0.13, 0.19];
    postPositions.forEach(px => {
      const postGroup = new THREE.Group();
      postGroup.position.set(px, 0, 0);

      // Solder flange foot onto tube
      const foot = new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.002, 0.006), this.silverMaterial);
      foot.position.set(0, 0.0092, 0.007);
      postGroup.add(foot);

      // Upright post pillar
      const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.002, 0.0024, 0.007, 8), this.silverMaterial);
      pillar.position.set(0, 0.012, 0.008);
      postGroup.add(pillar);

      // Steel pivot screw head
      const screw = new THREE.Mesh(new THREE.CylinderGeometry(0.0018, 0.0018, 0.001, 8), this.steelRodMaterial);
      screw.rotation.z = Math.PI / 2;
      screw.position.set(0.002, 0.012, 0.0085);
      postGroup.add(screw);

      bodyGroup.add(postGroup);
    });

    // 3. Thumb Keys Mechanism on Rear of Flute (Left Thumb B and Bb levers)
    const thumbGroup = new THREE.Group();
    thumbGroup.position.set(-0.115, 0, -0.011);

    const thumbRod = new THREE.Mesh(new THREE.CylinderGeometry(0.0012, 0.0012, 0.035, 8), this.steelRodMaterial);
    thumbRod.rotation.z = Math.PI / 2;
    thumbGroup.add(thumbRod);

    // Thumb spatula paddles
    [-0.010, 0.008].forEach(tx => {
      const spatula = new THREE.Mesh(new THREE.BoxGeometry(0.014, 0.0025, 0.008), this.silverMaterial);
      spatula.position.set(tx, -0.003, -0.004);
      spatula.rotation.y = 0.15;
      thumbGroup.add(spatula);
    });
    bodyGroup.add(thumbGroup);

    this.group.add(bodyGroup);
  }

  _buildFootjoint() {
    const footGroup = new THREE.Group();

    // 1. Footjoint Barrel Ring at x = +0.21
    const footBarrel = new THREE.Mesh(new THREE.CylinderGeometry(0.0102, 0.0102, 0.014, 24), this.silverMaterial);
    footBarrel.rotation.z = Math.PI / 2;
    footBarrel.position.set(0.21, 0, 0);
    footGroup.add(footBarrel);

    const footGoldRing = new THREE.Mesh(new THREE.CylinderGeometry(0.0104, 0.0104, 0.003, 24), this.gold14kMaterial);
    footGoldRing.rotation.z = Math.PI / 2;
    footGoldRing.position.set(0.21, 0, 0);
    footGroup.add(footGoldRing);

    // 2. Footjoint Tube (C-Foot, x = +0.21 to +0.35, length 0.14m)
    const footTubeGeom = new THREE.CylinderGeometry(0.0095, 0.0095, 0.14, 24);
    footTubeGeom.rotateZ(Math.PI / 2);
    const footTube = new THREE.Mesh(footTubeGeom, this.silverMaterial);
    footTube.position.set(0.28, 0, 0);
    footTube.castShadow = true;
    footGroup.add(footTube);

    // 3. Open Foot Flare with acoustic internal bevel
    const flare = new THREE.Mesh(new THREE.CylinderGeometry(0.0102, 0.0095, 0.008, 24), this.silverMaterial);
    flare.rotation.z = Math.PI / 2;
    flare.position.set(0.35, 0, 0);
    footGroup.add(flare);

    // Dark acoustic bore depth
    const boreEnd = new THREE.Mesh(new THREE.CircleGeometry(0.0088, 20), this.boreInteriorMaterial);
    boreEnd.rotation.y = Math.PI / 2;
    boreEnd.position.set(0.351, 0, 0);
    footGroup.add(boreEnd);

    // 4. Footjoint Steel Rod & Posts
    const footRod = new THREE.Mesh(new THREE.CylinderGeometry(0.0013, 0.0013, 0.11, 8), this.steelRodMaterial);
    footRod.rotation.z = Math.PI / 2;
    footRod.position.set(0.28, 0.0105, 0.0085);
    footGroup.add(footRod);

    [0.23, 0.33].forEach(px => {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.0018, 0.0022, 0.006, 8), this.silverMaterial);
      post.position.set(px, 0.011, 0.008);
      footGroup.add(post);
    });

    this.group.add(footGroup);
  }

  _buildKeyMechanism() {
    this.keys = [];

    // Comprehensive Boehm Flute Key Specification:
    // 16 animated key assemblies with French pointed arms, pads, and tone hole chimneys
    const keySpecs = [
      // Left Hand & Upper Stack:
      { name: 'ThB',  x: -0.125, z: 0.000, isThumb: true,  role: 'thumb' },
      { name: 'ThBb', x: -0.108, z: 0.000, isThumb: true,  role: 'thumb' },
      { name: 'L1',   x: -0.090, z: 0.000, openHole: true, role: 'left' },
      { name: 'Tr1',  x: -0.075, z: 0.006, isTrill: true,  role: 'trill' }, // D trill
      { name: 'L2',   x: -0.060, z: 0.000, openHole: true, role: 'left' },
      { name: 'Tr2',  x: -0.045, z: 0.006, isTrill: true,  role: 'trill' }, // D# trill
      { name: 'L3',   x: -0.030, z: 0.000, openHole: true, role: 'left' },
      { name: 'LG#',  x: -0.012, z: 0.008, isOffset: true, role: 'left' }, // Offset G key

      // Right Hand & Lower Stack:
      { name: 'R1',   x:  0.025, z: 0.000, openHole: true, role: 'right' },
      { name: 'R2',   x:  0.055, z: 0.000, openHole: true, role: 'right' },
      { name: 'R3',   x:  0.085, z: 0.000, openHole: true, role: 'right' },
      { name: 'R4',   x:  0.115, z: 0.000, openHole: true, role: 'right' },
      { name: 'RD#',  x:  0.155, z: 0.007, isPinky: true,  role: 'right' }, // Right pinky spatula

      // Footjoint Keys (C-Foot):
      { name: 'FC#',  x:  0.245, z: 0.000, isFoot: true,   role: 'foot' },
      { name: 'FC',   x:  0.278, z: 0.000, isFoot: true,   role: 'foot' },
      { name: 'Flow', x:  0.310, z: 0.005, isRoller: true, role: 'foot' }  // Low C roller spatula
    ];

    keySpecs.forEach((ks, i) => {
      const keyGroup = new THREE.Group();
      const baseY = 0.0135;
      keyGroup.position.set(ks.x, baseY, ks.z);

      // 1. Drawn Tone Hole Chimney on tube body
      const chimneyGeom = new THREE.CylinderGeometry(0.0068, 0.0072, 0.0035, 16);
      const chimney = new THREE.Mesh(chimneyGeom, this.silverMaterial);
      chimney.position.set(0, -0.0025, 0);
      keyGroup.add(chimney);

      // Tone hole dark acoustic cavity
      const holeMesh = new THREE.Mesh(new THREE.CircleGeometry(0.0058, 16), this.boreInteriorMaterial);
      holeMesh.rotation.x = -Math.PI / 2;
      holeMesh.position.set(0, -0.0006, 0);
      keyGroup.add(holeMesh);

      // 2. Moving Cup Assembly (animates down onto chimney)
      const cupGroup = new THREE.Group();

      // Sterling silver cup body
      const cupGeom = new THREE.CylinderGeometry(0.0074, 0.0074, 0.0028, 20);
      const cup = new THREE.Mesh(cupGeom, this.silverMaterial);
      cupGroup.add(cup);

      // Gold acoustic resonator washer on top of cup
      const washer = new THREE.Mesh(new THREE.RingGeometry(0.0022, 0.0055, 16), this.gold14kMaterial);
      washer.rotation.x = -Math.PI / 2;
      washer.position.y = 0.0015;
      cupGroup.add(washer);

      // French Open-Hole perforation (for concert open-hole keys)
      if (ks.openHole) {
        const centerPerforation = new THREE.Mesh(new THREE.CircleGeometry(0.0021, 16), this.boreInteriorMaterial);
        centerPerforation.rotation.x = -Math.PI / 2;
        centerPerforation.position.y = 0.0016;
        cupGroup.add(centerPerforation);
      }

      // Yellow bladder acoustic pad underneath cup
      const pad = new THREE.Mesh(new THREE.CylinderGeometry(0.0068, 0.0068, 0.0015, 16), this.padMaterial);
      pad.position.y = -0.0018;
      cupGroup.add(pad);

      // 3. French Pointed Key Arm (Bras Pointu) reaching from rear hinge to cup center
      const armGeom = new THREE.ConeGeometry(0.0022, 0.013, 6);
      armGeom.rotateX(Math.PI / 2);
      const pointedArm = new THREE.Mesh(armGeom, this.silverMaterial);
      pointedArm.position.set(0, 0.001, 0.006);
      pointedArm.scale.set(0.9, 0.6, 1.0);
      cupGroup.add(pointedArm);

      // Hinge collar connecting arm to steel axle rod
      const hinge = new THREE.Mesh(new THREE.CylinderGeometry(0.0025, 0.0025, 0.006, 10), this.silverMaterial);
      hinge.rotation.z = Math.PI / 2;
      hinge.position.set(0, 0.0005, 0.0105 - ks.z);
      cupGroup.add(hinge);

      // Footjoint ergonomic roller on spatulas
      if (ks.isRoller || ks.isPinky) {
        const roller = new THREE.Mesh(new THREE.CylinderGeometry(0.0025, 0.0025, 0.008, 10), this.gold14kMaterial);
        roller.rotation.z = Math.PI / 2;
        roller.position.set(0.004, 0.002, 0.003);
        cupGroup.add(roller);
      }

      keyGroup.add(cupGroup);
      this.group.add(keyGroup);

      this.keys.push({
        name: ks.name,
        group: cupGroup,
        baseY: 0,
        index: i,
        role: ks.role,
        isPressed: false
      });
    });
  }

  _buildBreathDynamics() {
    this.breathParticles = [];

    // Small helical intake stream entering through the embouchure.
    const particleCount = 14;
    for (let i = 0; i < particleCount; i++) {
      const geom = new THREE.TorusGeometry(0.0032 + i * 0.0006, 0.0008, 8, 16);
      const mat = new THREE.MeshBasicMaterial({
        color: 0x38e2ff,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      });
      const ring = new THREE.Mesh(geom, mat);
      ring.position.copy(this.breathIntakeOrigin);
      ring.rotation.x = Math.PI * 0.45;
      this.group.add(ring);

      this.breathParticles.push({
        mesh: ring,
        material: mat,
        baseScale: 0.5 + (i * 0.08),
        offsetTime: (i / particleCount) * 1.0,
        active: false
      });
    }

    // Larger acoustic waves leaving the open footjoint.
    this.airOutputRings = [];
    const outputRingCount = 9;
    for (let i = 0; i < outputRingCount; i++) {
      const geom = new THREE.TorusGeometry(0.014, 0.0015, 10, 28);
      const mat = new THREE.MeshBasicMaterial({
        color: 0x38e2ff,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      });
      const ring = new THREE.Mesh(geom, mat);
      ring.position.copy(this.airOutputOrigin);
      ring.quaternion.setFromUnitVectors(
        new THREE.Vector3(0, 0, 1),
        this.airOutputDirection
      );
      this.group.add(ring);

      this.airOutputRings.push({
        mesh: ring,
        material: mat,
        baseScale: 0.82 + (i * 0.025),
        offsetTime: (i / outputRingCount) * 1.0,
        active: false
      });
    }

    // Footjoint Acoustic Pulse Ring (expanding at open end x = +0.35)
    const footPulseGeom = new THREE.TorusGeometry(0.014, 0.003, 8, 16);
    footPulseGeom.rotateY(Math.PI / 2);
    this.footVentMaterial = new THREE.MeshBasicMaterial({
      color: 0x70e8ff,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    this.footVent = new THREE.Mesh(footPulseGeom, this.footVentMaterial);
    this.footVent.position.set(0.354, 0, 0);
    this.group.add(this.footVent);
  }

  /**
   * Boehm Fingering Engine: Map MIDI pitch (C4 = 60 to C7 = 96)
   * to realistic tone-hole closures and acoustic air column shortening
   */
  _getBoehmFingering(midiPitch) {
    // Normalise to pitch range C4 (60) to C7 (96)
    const clampedPitch = Math.max(60, Math.min(96, midiPitch));
    const semitonesFromC = clampedPitch % 12;
    const octave = Math.floor(clampedPitch / 12);

    // Active key names that should be closed (depressed)
    const closed = new Set();

    // Fundamental chromatic Boehm fingering logic:
    // C4 (all closed) -> C5 (open column) -> harmonics
    switch (semitonesFromC) {
      case 0: // C: all keys closed
        ['ThB', 'L1', 'L2', 'L3', 'R1', 'R2', 'R3', 'R4', 'FC#', 'FC'].forEach(k => closed.add(k));
        break;
      case 1: // C#: Foot keys open
        ['ThB', 'L1', 'L2', 'L3', 'R1', 'R2', 'R3', 'R4', 'FC#'].forEach(k => closed.add(k));
        break;
      case 2: // D: RD# pressed, foot keys open
        ['ThB', 'L1', 'L2', 'L3', 'R1', 'R2', 'R3', 'RD#'].forEach(k => closed.add(k));
        break;
      case 3: // D# / Eb: RD# pressed
        ['ThB', 'L1', 'L2', 'L3', 'R1', 'R2', 'R3', 'R4', 'RD#'].forEach(k => closed.add(k));
        break;
      case 4: // E: R3 opens
        ['ThB', 'L1', 'L2', 'L3', 'R1', 'R2', 'RD#'].forEach(k => closed.add(k));
        break;
      case 5: // F: R2 opens
        ['ThB', 'L1', 'L2', 'L3', 'R1', 'RD#'].forEach(k => closed.add(k));
        break;
      case 6: // F#: R2 closed, R3 opens
        ['ThB', 'L1', 'L2', 'L3', 'R3', 'RD#'].forEach(k => closed.add(k));
        break;
      case 7: // G: R1 opens
        ['ThB', 'L1', 'L2', 'L3', 'RD#'].forEach(k => closed.add(k));
        break;
      case 8: // G#: LG# lever opens
        ['ThB', 'L1', 'L2', 'L3', 'LG#', 'RD#'].forEach(k => closed.add(k));
        break;
      case 9: // A: L3 opens
        ['ThB', 'L1', 'L2', 'RD#'].forEach(k => closed.add(k));
        break;
      case 10: // A# / Bb: Thumb Bb lever closes
        ['ThBb', 'L1', 'R1', 'RD#'].forEach(k => closed.add(k));
        break;
      case 11: // B: L2 opens
        ['ThB', 'L1', 'RD#'].forEach(k => closed.add(k));
        break;
    }

    // High register harmonic venting modifications:
    if (octave >= 6) {
      closed.delete('L1'); // L1 vented for octave harmonic register
      if (semitonesFromC === 2) closed.add('Tr1'); // Trill key for high D
      if (semitonesFromC === 3) closed.add('Tr2'); // Trill key for high D#
    }

    return closed;
  }

  /**
   * Note-On Event: Engages Boehm key depression and continuous breath airflow
   */
  onNoteOn(midiPitch, velocity = 0.8, eventTime = null, trackIndex = null, duration = 0.5) {
    const vel = Math.max(0.3, Math.min(1.0, velocity));
    let noteDur = 0.5;
    if (typeof duration === 'number' && duration > 0.05) {
      noteDur = duration;
    } else if (typeof eventTime === 'number' && eventTime > 0.05 && trackIndex === undefined) {
      noteDur = eventTime;
    }

    // 1. Setup continuous active note state for sustained phrases
    this.activeNote = {
      midiPitch,
      velocity: vel,
      duration: noteDur,
      elapsed: 0,
      active: true
    };

    // 2. Boehm Key Depressions with cushioned pad travel
    const closedKeys = this._getBoehmFingering(midiPitch);
    const keyTravelY = -0.0032; // 3.2mm realistic pad seal travel

    this.keys.forEach(k => {
      const shouldClose = closedKeys.has(k.name);
      k.isPressed = shouldClose;

      const targetY = shouldClose ? keyTravelY : 0;
      gsap.killTweensOf(k.group.position);
      gsap.to(k.group.position, {
        y: targetY,
        duration: shouldClose ? 0.038 : 0.065,
        ease: shouldClose ? 'power2.out' : 'elastic.out(1.1, 0.4)'
      });
    });

    // 3. Initiate Breath Dynamics
    this.breathParticles.forEach(bp => {
      bp.active = true;
    });
    this.airOutputRings.forEach(ring => {
      ring.active = true;
    });

    // 4. Silver & Gold Resonant Sheen Flash
    if (this.silverMaterial) {
      this.silverMaterial.emissiveIntensity = 0.42 * vel;
      gsap.killTweensOf(this.silverMaterial);
      gsap.to(this.silverMaterial, {
        emissiveIntensity: 0.12,
        duration: 0.45,
        ease: 'power2.out'
      });
    }

    // 5. Footjoint Acoustic Vent Pulse
    if (this.footVentMaterial) {
      this.footVentMaterial.opacity = 0.6 * vel;
      this.footVent.scale.set(1.0, 1.0, 1.0);
      gsap.killTweensOf(this.footVentMaterial);
      gsap.killTweensOf(this.footVent.scale);

      gsap.to(this.footVent.scale, {
        x: 2.5,
        y: 2.5,
        z: 2.5,
        duration: 0.5,
        ease: 'power1.out'
      });
      gsap.to(this.footVentMaterial, {
        opacity: 0,
        duration: 0.5,
        ease: 'power2.in'
      });
    }
  }

  /**
   * Note-Off Event: Graceful release of keys and breath dissipation
   */
  onNoteOff(midiPitch, force = false) {
    if (this.activeNote && (this.activeNote.midiPitch === midiPitch || force)) {
      this.activeNote.active = false;

      // Spring-loaded key release with pad bounce
      this.keys.forEach(k => {
        k.isPressed = false;
        gsap.killTweensOf(k.group.position);
        gsap.to(k.group.position, {
          y: 0,
          duration: 0.085,
          ease: 'power1.out'
        });
      });

      // Fade out breath particles
      this.breathParticles.forEach(bp => {
        bp.active = false;
        gsap.to(bp.material, {
          opacity: 0,
          duration: 0.25,
          ease: 'power2.in'
        });
      });
      this.airOutputRings.forEach(ring => {
        ring.active = false;
        gsap.to(ring.material, {
          opacity: 0,
          duration: 0.25,
          ease: 'power2.in'
        });
      });

      // Foot vent fade
      if (this.footVentMaterial) {
        gsap.to(this.footVentMaterial, {
          opacity: 0,
          duration: 0.3
        });
      }
    }
  }

  /**
   * Continuous Real-Time Animation Loop (Called Every Frame)
   * Keeps air stream and acoustic resonance fluid during sustained notes!
   */
  update(delta) {
    const dt = Math.min(0.1, Math.max(0.001, delta));
    this.resonancePhase += dt * 38.0; // ~6 Hz vibrato acoustic pulsation

    if (this.activeNote && this.activeNote.active) {
      this.activeNote.elapsed += dt;

      // --- 1. CONTINUOUS BREATH VORTEX ANIMATION ---
      const vel = this.activeNote.velocity;
      const breathSpeed = 1.4;

      this.breathParticles.forEach(bp => {
        // Cyclic progress along helical stream
        const cycleTime = 1.0;
        const progress = ((this.activeNote.elapsed * breathSpeed + bp.offsetTime) % cycleTime) / cycleTime;

        // Visible spiraling jet entering the embouchure.
        const spiralAngle = progress * Math.PI * 4.0;
        const spiralRadius = 0.005 + progress * 0.018;

        bp.mesh.position.x = -0.25 + (progress * 0.06) + Math.cos(spiralAngle) * spiralRadius;
        bp.mesh.position.y = 0.016 + (progress * 0.08) + Math.sin(spiralAngle) * spiralRadius;
        bp.mesh.position.z = progress * 0.025;

        const currentScale = bp.baseScale * (0.9 + progress * 1.8);
        bp.mesh.scale.set(currentScale, currentScale, currentScale);
        bp.mesh.rotation.z += dt * 3.5;

        let alpha = 0;
        if (progress < 0.2) {
          alpha = (progress / 0.2) * 0.65 * vel;
        } else {
          alpha = (1.0 - (progress - 0.2) / 0.8) * 0.65 * vel;
        }
        bp.material.opacity = alpha;
      });

      this.airOutputRings.forEach(ring => {
        const progress = ((this.activeNote.elapsed * breathSpeed + ring.offsetTime) % 1.0);
        const travel = 0.008 + progress * 0.34;
        ring.mesh.position.copy(this.airOutputOrigin).addScaledVector(this.airOutputDirection, travel);

        const currentScale = ring.baseScale * (0.85 + progress * 3.4);
        ring.mesh.scale.set(currentScale, currentScale, currentScale);

        ring.material.opacity = progress < 0.14
          ? (progress / 0.14) * 0.58 * vel
          : (1.0 - (progress - 0.14) / 0.86) * 0.58 * vel;
      });

      // --- 2. ACOUSTIC STANDING WAVE VIBRATO PULSATION ---
      const vibratoWave = Math.sin(this.resonancePhase) * 0.05 * vel;
      if (this.silverMaterial) {
        this.silverMaterial.emissiveIntensity = 0.12 + vibratoWave;
      }

      // --- 3. DURATION TIMEOUT CHECK ---
      if (this.activeNote.elapsed >= this.activeNote.duration) {
        this.onNoteOff(this.activeNote.midiPitch);
      }
    } else {
      // Natural resting state decay
      if (this.silverMaterial && this.silverMaterial.emissiveIntensity > 0.12) {
        this.silverMaterial.emissiveIntensity = THREE.MathUtils.lerp(this.silverMaterial.emissiveIntensity, 0.12, dt * 6.0);
      }
    }
  }
}
