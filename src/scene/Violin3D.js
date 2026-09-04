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
    // String tilt angles (roll in radians) to clear adjacent strings:
    // G: -21 deg, D: -7 deg, A: +7 deg, E: +21 deg
    this.stringTilts = [-0.36, -0.12, 0.12, 0.36];

    // Bow physical state & continuous bowing engine
    this.bowStrokeDir = 1;      // +1 = down-bow (hacia punta), -1 = up-bow (hacia talón)
    this.bowStrokePos = 0;      // -0.85 (frog) to +0.85 (tip)
    this.bowCurrentX = 0;
    this.bowTargetX = 0;
    this.bowCurrentZ = 0.068;
    this.bowTargetZ = 0.068;
    this.bowCurrentTilt = 0;
    this.bowTargetTilt = 0;
    this.bowSpeed = 0.85;       // Normalized units/sec
    this.bowWristTurn = 0;

    // Active sustained note tracking
    this.activeNote = null;
    this.activeStringIndex = 2;
    this.vibratoPhase = 0;

    this._buildMaterials();
    this._buildStand();
    this._buildViolinBody();
    this._buildNeckAndScroll();
    this._buildStrings();
    this._buildFlyingBow();

    this.scene.add(this.group);
  }

  _buildMaterials() {
    // Varnished European Spruce Top Plate (Golden Amber with deep clearcoat)
    this.varnishMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x944012,
      emissive: 0x1a0902,
      emissiveIntensity: 0.2,
      roughness: 0.16,
      metalness: 0.05,
      clearcoat: 0.95,
      clearcoatRoughness: 0.06
    });

    // Varnished Two-Piece Flamed Maple (Back Plate & Ribs)
    this.flamedMapleMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x7c320d,
      emissive: 0x140601,
      roughness: 0.20,
      metalness: 0.08,
      clearcoat: 0.90,
      clearcoatRoughness: 0.08
    });

    // Solid African Ebony (Fingerboard, Tailpiece, Pegs, Chinrest, Nut, Endpin)
    this.ebonyMaterial = new THREE.MeshStandardMaterial({
      color: 0x121215,
      roughness: 0.24,
      metalness: 0.05
    });

    // Natural Aged Maple (Bridge)
    this.bridgeMaterial = new THREE.MeshStandardMaterial({
      color: 0xd6b98f,
      roughness: 0.55,
      metalness: 0.02
    });

    // Pernambuco Bow Stick Wood
    this.bowWoodMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x56180a,
      roughness: 0.18,
      metalness: 0.12,
      clearcoat: 0.85
    });

    // Bleached Mongolian Horsehair Ribbon
    this.bowHairMaterial = new THREE.MeshStandardMaterial({
      color: 0xf6f3ea,
      roughness: 0.45,
      metalness: 0.02
    });

    // Chrome / Nickel-Silver (Hill Chinrest Brackets, Bow Ferrule, Adjuster)
    this.chromeMaterial = new THREE.MeshStandardMaterial({
      color: 0xcccccc,
      roughness: 0.12,
      metalness: 0.92
    });

    // Polished Gold / Brass (Tailpiece Fine-Tuner Screws & Peg Collar Rings)
    this.goldMaterial = new THREE.MeshStandardMaterial({
      color: 0xdfb44a,
      roughness: 0.20,
      metalness: 0.90
    });

    // Mother-of-Pearl (Parisian Eye on Bow Frog & Tailpiece Inlay)
    this.pearlMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xf0ede8,
      roughness: 0.15,
      metalness: 0.10,
      clearcoat: 0.80
    });

    // Dark Acoustic Cavity / Purfling
    this.darkCavityMaterial = new THREE.MeshBasicMaterial({
      color: 0x070402
    });
  }

  _buildStand() {
    const stand = new THREE.Group();
    stand.position.set(0, -1.20, 0);

    // Heavy studio cast chrome base
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.25, 0.035, 24), this.chromeMaterial);
    stand.add(base);

    // Telescopic support column placed behind the instrument (z = -0.065)
    const lowerPole = new THREE.Mesh(new THREE.CylinderGeometry(0.013, 0.013, 0.65, 12), this.chromeMaterial);
    lowerPole.position.set(0, 0.32, -0.065);
    stand.add(lowerPole);

    const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.017, 0.017, 0.035, 12), this.chromeMaterial);
    collar.position.set(0, 0.65, -0.065);
    stand.add(collar);

    const upperPole = new THREE.Mesh(new THREE.CylinderGeometry(0.010, 0.010, 0.85, 12), this.chromeMaterial);
    upperPole.position.set(0, 1.05, -0.065);
    stand.add(upperPole);

    // Bottom padded dual-prong cradle supporting lower bout from underneath
    const lowerCradleGroup = new THREE.Group();
    lowerCradleGroup.position.set(0, 0.98, -0.045);

    const crossbar = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.012, 0.016), this.chromeMaterial);
    lowerCradleGroup.add(crossbar);

    [-0.07, 0.07].forEach(px => {
      const prong = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.055, 10), this.ebonyMaterial);
      prong.position.set(px, 0.022, 0.022);
      prong.rotation.x = Math.PI * 0.22;
      lowerCradleGroup.add(prong);
    });
    stand.add(lowerCradleGroup);

    // Upper neck cradle holding below the scroll (y = +0.35 relative to violin)
    const upperCradle = new THREE.Mesh(new THREE.TorusGeometry(0.024, 0.006, 8, 16, Math.PI), this.ebonyMaterial);
    upperCradle.position.set(0, 1.55, -0.028);
    upperCradle.rotation.x = Math.PI / 2;
    stand.add(upperCradle);

    this.group.add(stand);
  }

  /**
   * Generates authentic Stradivarius violin perimeter silhouette
   */
  _createViolinShape(scale = 1.0) {
    const s = new THREE.Shape();
    // Neck joint at top center
    s.moveTo(0, 0.165 * scale);
    // Upper bout right curve
    s.bezierCurveTo(0.045 * scale, 0.165 * scale, 0.0825 * scale, 0.135 * scale, 0.0825 * scale, 0.085 * scale);
    s.bezierCurveTo(0.0825 * scale, 0.055 * scale, 0.075 * scale, 0.040 * scale, 0.070 * scale, 0.035 * scale);
    // Upper corner block tip
    s.lineTo(0.075 * scale, 0.033 * scale);
    // C-bout (concave waist)
    s.bezierCurveTo(0.052 * scale, 0.015 * scale, 0.052 * scale, -0.040 * scale, 0.078 * scale, -0.063 * scale);
    // Lower corner block tip
    s.lineTo(0.083 * scale, -0.067 * scale);
    // Lower bout right curve
    s.bezierCurveTo(0.087 * scale, -0.080 * scale, 0.103 * scale, -0.095 * scale, 0.103 * scale, -0.130 * scale);
    s.bezierCurveTo(0.103 * scale, -0.170 * scale, 0.055 * scale, -0.190 * scale, 0, -0.190 * scale);

    // Lower bout left curve (bass side)
    s.bezierCurveTo(-0.055 * scale, -0.190 * scale, -0.103 * scale, -0.170 * scale, -0.103 * scale, -0.130 * scale);
    s.bezierCurveTo(-0.103 * scale, -0.095 * scale, -0.087 * scale, -0.080 * scale, -0.083 * scale, -0.067 * scale);
    s.lineTo(-0.078 * scale, -0.063 * scale);
    // C-bout left
    s.bezierCurveTo(-0.052 * scale, -0.040 * scale, -0.052 * scale, 0.015 * scale, -0.075 * scale, 0.033 * scale);
    s.lineTo(-0.070 * scale, 0.035 * scale);
    // Upper bout left curve
    s.bezierCurveTo(-0.075 * scale, 0.040 * scale, -0.0825 * scale, 0.055 * scale, -0.0825 * scale, 0.085 * scale);
    s.bezierCurveTo(-0.0825 * scale, 0.135 * scale, -0.045 * scale, 0.165 * scale, 0, 0.165 * scale);

    return s;
  }

  _buildViolinBody() {
    const bodyGroup = new THREE.Group();

    // 1. Arched Soundboard (Tapa Armónica) with bevel and purfling edge
    const topShape = this._createViolinShape(1.0);
    const topGeom = new THREE.ExtrudeGeometry(topShape, {
      depth: 0.003,
      bevelEnabled: true,
      bevelSegments: 5,
      steps: 1,
      bevelSize: 0.0035,
      bevelThickness: 0.0055
    });
    this.topBelly = new THREE.Mesh(topGeom, this.varnishMaterial);
    this.topBelly.position.set(0, 0, 0.016);
    this.topBelly.castShadow = true;
    bodyGroup.add(this.topBelly);

    // 2. Back Plate (Fondo de Arce) with matching Stradivarius arching
    const backGeom = new THREE.ExtrudeGeometry(topShape, {
      depth: 0.003,
      bevelEnabled: true,
      bevelSegments: 5,
      steps: 1,
      bevelSize: 0.0035,
      bevelThickness: 0.0055
    });
    const backPlate = new THREE.Mesh(backGeom, this.flamedMapleMaterial);
    backPlate.position.set(0, 0, -0.024);
    backPlate.castShadow = true;
    bodyGroup.add(backPlate);

    // 3. Ribs (Aros / Fajas) connecting top and back plates
    const ribShape = this._createViolinShape(0.985);
    const ribGeom = new THREE.ExtrudeGeometry(ribShape, {
      depth: 0.034,
      bevelEnabled: false,
      steps: 1
    });
    const ribs = new THREE.Mesh(ribGeom, this.flamedMapleMaterial);
    ribs.position.set(0, 0, -0.017);
    ribs.castShadow = true;
    bodyGroup.add(ribs);

    // 4. Symmetrical Classical Italian F-Holes (Efes de Concierto)
    const fHoleGroup = new THREE.Group();
    [-1, 1].forEach(side => {
      const sx = side * 0.038;
      // Upper round eye
      const eyeUp = new THREE.Mesh(new THREE.CircleGeometry(0.0042, 16), this.darkCavityMaterial);
      eyeUp.position.set(side * 0.026, 0.030, 0.025);
      fHoleGroup.add(eyeUp);

      // Lower round eye (larger)
      const eyeDown = new THREE.Mesh(new THREE.CircleGeometry(0.0058, 16), this.darkCavityMaterial);
      eyeDown.position.set(side * 0.046, -0.052, 0.025);
      fHoleGroup.add(eyeDown);

      // S-curved main slit
      const slitGeom = new THREE.CylinderGeometry(0.0030, 0.0032, 0.074, 12);
      const slit = new THREE.Mesh(slitGeom, this.darkCavityMaterial);
      slit.position.set(sx, -0.010, 0.025);
      slit.rotation.z = side * -0.22;
      fHoleGroup.add(slit);

      // Center notch (muesca de alineación del puente)
      const notchGeom = new THREE.ConeGeometry(0.0028, 0.005, 4);
      const notch = new THREE.Mesh(notchGeom, this.darkCavityMaterial);
      notch.position.set(side * 0.039, -0.010, 0.025);
      notch.rotation.z = side * (Math.PI / 2);
      fHoleGroup.add(notch);
    });
    bodyGroup.add(fHoleGroup);

    // 5. Aubert Mirecourt Carved Maple Bridge (Puente Francés)
    const bridgeGroup = new THREE.Group();
    bridgeGroup.position.set(0, -0.010, 0.024);

    // Crown: curved top arch supporting the 4 strings
    const crownGeom = new THREE.CylinderGeometry(0.046, 0.046, 0.004, 16, 1, false, Math.PI * 0.25, Math.PI * 0.5);
    crownGeom.rotateZ(Math.PI);
    const crown = new THREE.Mesh(crownGeom, this.bridgeMaterial);
    crown.scale.set(0.48, 0.30, 1.0);
    crown.position.set(0, 0.026, 0);
    bridgeGroup.add(crown);

    // Main bridge body plate
    const bridgePlate = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.028, 0.004), this.bridgeMaterial);
    bridgePlate.position.set(0, 0.014, 0);
    bridgePlate.castShadow = true;
    bridgeGroup.add(bridgePlate);

    // Center heart cutout & side kidneys (decorative dark carvings)
    const bridgeCutout1 = new THREE.Mesh(new THREE.CylinderGeometry(0.003, 0.003, 0.005, 8), this.darkCavityMaterial);
    bridgeCutout1.position.set(0, 0.017, 0);
    bridgeCutout1.rotation.x = Math.PI / 2;
    bridgeGroup.add(bridgeCutout1);

    [-0.014, 0.014].forEach(bx => {
      const kidney = new THREE.Mesh(new THREE.BoxGeometry(0.004, 0.009, 0.005), this.darkCavityMaterial);
      kidney.position.set(bx, 0.013, 0);
      bridgeGroup.add(kidney);
    });

    // 2 Arched Bridge Feet resting on soundboard
    [-0.015, 0.015].forEach(fx => {
      const foot = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.004, 0.0045), this.bridgeMaterial);
      foot.position.set(fx, 0.001, 0);
      bridgeGroup.add(foot);
    });

    bodyGroup.add(bridgeGroup);

    // 6. French Ebony Tailpiece with 4 Gold Fine-Tuners (Cordal y Microafinadores)
    const tailpieceGroup = new THREE.Group();
    tailpieceGroup.position.set(0, -0.115, 0.028);

    const tailpieceGeom = new THREE.ConeGeometry(0.024, 0.12, 4);
    tailpieceGeom.rotateY(Math.PI * 0.25);
    const tailpiece = new THREE.Mesh(tailpieceGeom, this.ebonyMaterial);
    tailpiece.scale.set(1.0, 1.0, 0.30);
    tailpiece.castShadow = true;
    tailpieceGroup.add(tailpiece);

    // 4 Miniature Gold Fine-Tuner Screws
    for (let i = 0; i < 4; i++) {
      const tx = -0.011 + i * 0.0073;
      const tunerScrew = new THREE.Mesh(new THREE.CylinderGeometry(0.0016, 0.0016, 0.006, 8), this.goldMaterial);
      tunerScrew.position.set(tx, 0.048, 0.004);
      tailpieceGroup.add(tunerScrew);

      const thumbWheel = new THREE.Mesh(new THREE.CylinderGeometry(0.0028, 0.0028, 0.002, 10), this.goldMaterial);
      thumbWheel.position.set(tx, 0.051, 0.004);
      tailpieceGroup.add(thumbWheel);
    }

    // Saddle loop & ebony endpin button
    const endpin = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.004, 0.022, 12), this.ebonyMaterial);
    endpin.position.set(0, -0.085, -0.006);
    tailpieceGroup.add(endpin);

    bodyGroup.add(tailpieceGroup);

    // 7. Ergonomic Guarneri-Style Ebony Chinrest with Chrome Hill Clamps (Barbada)
    const chinrestGroup = new THREE.Group();
    chinrestGroup.position.set(-0.048, -0.150, 0.031);

    const chinCupGeom = new THREE.CylinderGeometry(0.038, 0.042, 0.014, 16);
    chinCupGeom.scale(0.85, 0.60, 1.15);
    const chinCup = new THREE.Mesh(chinCupGeom, this.ebonyMaterial);
    chinCup.rotation.z = 0.22;
    chinCup.castShadow = true;
    chinrestGroup.add(chinCup);

    // Dual chrome Hill mounting brackets
    [-0.016, 0.016].forEach(cx => {
      const clamp = new THREE.Mesh(new THREE.CylinderGeometry(0.0022, 0.0022, 0.048, 8), this.chromeMaterial);
      clamp.position.set(cx, -0.030, -0.025);
      chinrestGroup.add(clamp);
    });

    bodyGroup.add(chinrestGroup);

    this.group.add(bodyGroup);
  }

  _buildNeckAndScroll() {
    const neckGroup = new THREE.Group();

    // 1. Sculpted Flamed Maple Neck & Heel
    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.013, 0.016, 0.24, 12), this.flamedMapleMaterial);
    neck.position.set(0, 0.275, 0.008);
    neck.scale.set(0.9, 1.0, 0.7);
    neck.castShadow = true;
    neckGroup.add(neck);

    // Neck Heel connecting to back plate
    const heel = new THREE.Mesh(new THREE.ConeGeometry(0.018, 0.045, 10), this.flamedMapleMaterial);
    heel.position.set(0, 0.165, -0.005);
    heel.rotation.x = Math.PI;
    neckGroup.add(heel);

    // 2. Cantilevered Tapered Ebony Fingerboard (Diapasón de Ébano)
    // Tapers from 24mm wide at bone nut to 42mm at body end
    const fbGeom = new THREE.BoxGeometry(0.030, 0.315, 0.009);
    const fingerboard = new THREE.Mesh(fbGeom, this.ebonyMaterial);
    fingerboard.position.set(0, 0.235, 0.026);
    fingerboard.castShadow = true;
    neckGroup.add(fingerboard);

    // Polished Bone Nut (Cejuela) at neck top
    const nut = new THREE.Mesh(new THREE.BoxGeometry(0.024, 0.006, 0.008), this.pearlMaterial);
    nut.position.set(0, 0.392, 0.026);
    neckGroup.add(nut);

    // 3. Hollowed Pegbox (Clavijero Vaciado)
    const pegboxGroup = new THREE.Group();
    pegboxGroup.position.set(0, 0.435, 0.012);

    // Pegbox outer cheeks
    const cheekLeft = new THREE.Mesh(new THREE.BoxGeometry(0.005, 0.082, 0.026), this.flamedMapleMaterial);
    cheekLeft.position.set(-0.012, 0, 0);
    pegboxGroup.add(cheekLeft);

    const cheekRight = new THREE.Mesh(new THREE.BoxGeometry(0.005, 0.082, 0.026), this.flamedMapleMaterial);
    cheekRight.position.set(0.012, 0, 0);
    pegboxGroup.add(cheekRight);

    const pegboxBack = new THREE.Mesh(new THREE.BoxGeometry(0.020, 0.082, 0.005), this.flamedMapleMaterial);
    pegboxBack.position.set(0, 0, -0.011);
    pegboxGroup.add(pegboxBack);

    // 4 Pear-shaped Ebony Tuning Pegs with Gold Collars
    const pegYPositions = [-0.025, -0.008, 0.010, 0.027];
    for (let i = 0; i < 4; i++) {
      const side = (i % 2 === 0) ? -1 : 1;
      const py = pegYPositions[i];

      // Shaft passing through pegbox
      const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.0024, 0.0022, 0.038, 8), this.ebonyMaterial);
      shaft.rotation.z = Math.PI / 2;
      shaft.position.set(0, py, 0.002);
      pegboxGroup.add(shaft);

      // Gold collar ring
      const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.0036, 0.0036, 0.002, 10), this.goldMaterial);
      collar.rotation.z = Math.PI / 2;
      collar.position.set(side * 0.017, py, 0.002);
      pegboxGroup.add(collar);

      // Heart / pear head
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.0055, 10, 10), this.ebonyMaterial);
      head.scale.set(0.5, 1.2, 1.0);
      head.position.set(side * 0.023, py, 0.002);
      pegboxGroup.add(head);
    }
    neckGroup.add(pegboxGroup);

    // 4. Carved Classical Spiral Volute Scroll (Voluta 3D Stradivari)
    const scrollGroup = new THREE.Group();
    scrollGroup.position.set(0, 0.495, 0.010);

    const outerTurn = new THREE.Mesh(new THREE.TorusGeometry(0.020, 0.0085, 10, 24, Math.PI * 1.6), this.flamedMapleMaterial);
    outerTurn.rotation.y = Math.PI / 2;
    scrollGroup.add(outerTurn);

    const innerTurn = new THREE.Mesh(new THREE.TorusGeometry(0.011, 0.0065, 8, 20, Math.PI * 1.4), this.flamedMapleMaterial);
    innerTurn.rotation.y = Math.PI / 2;
    innerTurn.position.set(0, 0.005, 0.004);
    scrollGroup.add(innerTurn);

    const scrollEye = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.024, 12), this.flamedMapleMaterial);
    scrollEye.rotation.z = Math.PI / 2;
    scrollEye.position.set(0, 0.008, 0.006);
    scrollGroup.add(scrollEye);

    neckGroup.add(scrollGroup);

    this.group.add(neckGroup);
  }

  _buildStrings() {
    this.strings = [];

    // String specifications: [G3, D4, A4, E5]
    const stringData = [
      { name: 'G3', gauge: 0.0015, color: 0xe0d6c0, xBridge: -0.0125, xNut: -0.0085, z: 0.046 }, // Warm Silver wound
      { name: 'D4', gauge: 0.0012, color: 0xd8dde4, xBridge: -0.0042, xNut: -0.0028, z: 0.049 }, // Aluminum wound
      { name: 'A4', gauge: 0.0010, color: 0xe8ecf2, xBridge: 0.0042, xNut: 0.0028, z: 0.049 },  // Synthetic aluminum
      { name: 'E5', gauge: 0.00075, color: 0xf6f0d8, xBridge: 0.0125, xNut: 0.0085, z: 0.046 }  // Gold steel wire
    ];

    stringData.forEach((sd, i) => {
      const geom = new THREE.CylinderGeometry(sd.gauge, sd.gauge, 0.58, 8);
      const mat = new THREE.MeshStandardMaterial({
        color: sd.color,
        metalness: 0.95,
        roughness: 0.12,
        emissive: new THREE.Color(0x000000),
        emissiveIntensity: 0.0
      });
      const strMesh = new THREE.Mesh(geom, mat);

      // Spanning from tailpiece bridge crown through nut to pegbox
      strMesh.position.set(sd.xBridge, 0.135, sd.z);
      this.group.add(strMesh);

      this.strings.push({
        mesh: strMesh,
        material: mat,
        defaultX: sd.xBridge,
        defaultZ: sd.z,
        tilt: this.stringTilts[i],
        vibrationAmp: 0
      });
    });

    // High-visibility left-hand finger marker on ebony fingerboard
    const markerGeom = new THREE.SphereGeometry(0.0045, 12, 12);
    const markerMat = new THREE.MeshStandardMaterial({
      color: 0x00f0ff,
      emissive: 0x00f0ff,
      emissiveIntensity: 2.2
    });
    this.fingerMarker = new THREE.Mesh(markerGeom, markerMat);
    this.fingerMarker.scale.set(1.0, 0.6, 1.0);
    this.fingerMarker.visible = false;
    this.group.add(this.fingerMarker);
  }

  _buildFlyingBow() {
    const bowGroup = new THREE.Group();

    // 1. Pernambuco Bow Stick (72 cm) with natural reverse camber (concave curve towards hair)
    const stickGeom = new THREE.CylinderGeometry(0.0035, 0.0055, 0.72, 10);
    stickGeom.rotateZ(Math.PI / 2);
    const stick = new THREE.Mesh(stickGeom, this.bowWoodMaterial);
    stick.castShadow = true;
    bowGroup.add(stick);

    // 2. Bleached White Mongolian Horsehair Ribbon
    const hairGeom = new THREE.BoxGeometry(0.70, 0.0025, 0.0065);
    const hair = new THREE.Mesh(hairGeom, this.bowHairMaterial);
    hair.position.y = -0.015;
    bowGroup.add(hair);

    // 3. Pointed Ivory / Bone Tip (Head) at bow point
    const tipHead = new THREE.Mesh(new THREE.ConeGeometry(0.006, 0.020, 8), this.pearlMaterial);
    tipHead.rotation.z = Math.PI * 0.75;
    tipHead.position.set(0.355, -0.008, 0);
    bowGroup.add(tipHead);

    // 4. Carved Ebony Frog with Nickel Ferrule & Parisian Eye (Nuez del Arco)
    const frogGroup = new THREE.Group();
    frogGroup.position.set(-0.315, -0.008, 0);

    const frogBody = new THREE.Mesh(new THREE.BoxGeometry(0.042, 0.016, 0.012), this.ebonyMaterial);
    frogGroup.add(frogBody);

    // Nickel-silver ferrule wrapping hair at the frog
    const ferrule = new THREE.Mesh(new THREE.BoxGeometry(0.010, 0.006, 0.013), this.chromeMaterial);
    ferrule.position.set(0.018, -0.006, 0);
    frogGroup.add(ferrule);

    // Parisian eye (Mother-of-pearl center dot with brass ring) on both sides
    [-0.0065, 0.0065].forEach(pz => {
      const eyeRing = new THREE.Mesh(new THREE.RingGeometry(0.0016, 0.0028, 12), this.goldMaterial);
      eyeRing.position.set(-0.002, 0.001, pz);
      eyeRing.rotation.y = pz > 0 ? 0 : Math.PI;
      frogGroup.add(eyeRing);

      const eyeDot = new THREE.Mesh(new THREE.CircleGeometry(0.0015, 12), this.pearlMaterial);
      eyeDot.position.set(-0.002, 0.001, pz);
      eyeDot.rotation.y = pz > 0 ? 0 : Math.PI;
      frogGroup.add(eyeDot);
    });

    // Silver/Ebony Adjuster Button at the heel
    const adjuster = new THREE.Mesh(new THREE.CylinderGeometry(0.0045, 0.0045, 0.018, 10), this.chromeMaterial);
    adjuster.rotation.z = Math.PI / 2;
    adjuster.position.set(-0.028, 0.008, 0);
    frogGroup.add(adjuster);

    bowGroup.add(frogGroup);

    // Place bow initially hovering horizontally in ready position over the strings
    // Contact zone is between bridge (y = -0.010) and fingerboard end (y = +0.090) -> y = +0.022
    bowGroup.position.set(0, 0.022, 0.068);
    this.group.add(bowGroup);
    this.bowGroup = bowGroup;
  }

  /**
   * Note-On Trigger with Extended Note Bowing Support
   */
  onNoteOn(midiPitch, velocity = 0.8, eventTime = null, trackIndex = null, duration = 0.5) {
    const vel = Math.max(0.3, Math.min(1.0, velocity));
    // Determine note length in seconds for continuous bowing
    let noteDur = 0.5;
    if (typeof duration === 'number' && duration > 0.05) {
      noteDur = duration;
    } else if (typeof eventTime === 'number' && eventTime > 0.05 && trackIndex === undefined) {
      // Fallback if caller passed duration as 3rd parameter
      noteDur = eventTime;
    }

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
    this.activeStringIndex = bestString;

    // 2. Setup continuous active note state
    this.activeNote = {
      midiPitch,
      velocity: vel,
      duration: noteDur,
      elapsed: 0,
      stringIndex: bestString,
      active: true
    };

    // 3. Alternate bow stroke direction for realism (down-bow vs up-bow)
    this.bowStrokeDir = -this.bowStrokeDir;

    // Speed scales with note duration: fast for staccato, steady gliding for long sustained notes
    if (noteDur < 0.35) {
      this.bowSpeed = 2.4 * vel;
    } else if (noteDur < 1.2) {
      this.bowSpeed = 1.3 * vel;
    } else {
      // Sustained note: slow, expressive stroke with turnaround capability
      this.bowSpeed = Math.max(0.45, Math.min(0.95, 1.4 / Math.min(noteDur, 2.5)));
    }

    // Target bow alignment for the active string
    const str = this.strings[bestString];
    this.bowTargetX = str.defaultX;
    // Contact depth: hair presses down onto string crown (bridge crown is ~0.046 to 0.049)
    this.bowTargetZ = str.defaultZ + 0.001;
    this.bowTargetTilt = str.tilt;

    // 4. Initial String Excitation Glow
    if (str) {
      str.material.emissive.setHex(0x00f0ff);
      str.material.emissiveIntensity = 1.8 * vel;
      str.vibrationAmp = 0.0035 * vel;
    }

    // 5. Left-Hand Finger Position Indicator on Fingerboard
    if (this.fingerMarker && minDiff > 0) {
      const semitones = Math.min(24, minDiff);
      // Realistic acoustic string stop distance: y goes from nut (0.385) towards bridge
      const fingerY = 0.370 - (semitones * 0.0125);
      this.fingerMarker.position.set(str.defaultX, fingerY, 0.034);
      this.fingerMarker.visible = true;
      this.fingerMarker.material.emissiveIntensity = 2.8 * vel;
      this.fingerBaseY = fingerY;
    } else if (minDiff === 0 && this.fingerMarker) {
      // Open string: no left finger pressed
      this.fingerMarker.visible = false;
    }

    // 6. Subtle Soundboard Resonance Flash
    if (this.varnishMaterial) {
      this.varnishMaterial.emissiveIntensity = 0.45 * vel;
      gsap.killTweensOf(this.varnishMaterial);
      gsap.to(this.varnishMaterial, {
        emissiveIntensity: 0.18,
        duration: 0.5,
        ease: 'power2.out'
      });
    }
  }

  /**
   * Note-Off Trigger: Smooth Bow Release
   */
  onNoteOff(midiPitch, force = false) {
    if (this.activeNote && (this.activeNote.midiPitch === midiPitch || force)) {
      this.activeNote.active = false;
      // Lift bow slightly into ready rest position above strings
      this.bowTargetZ = 0.068;

      if (this.fingerMarker) {
        gsap.killTweensOf(this.fingerMarker.material);
        gsap.to(this.fingerMarker.material, {
          emissiveIntensity: 0,
          duration: 0.35,
          onComplete: () => {
            if (!this.activeNote || !this.activeNote.active) {
              this.fingerMarker.visible = false;
            }
          }
        });
      }
    }
  }

  /**
   * Real-Time Physics & Animation Loop (Called Every Frame)
   * Keeps bow in continuous motion during sustained notes!
   */
  update(delta) {
    if (!this.bowGroup) return;

    const dt = Math.min(0.1, Math.max(0.001, delta));
    this.vibratoPhase += dt * 34.0; // ~5.4 Hz vibrato oscillation

    if (this.activeNote && this.activeNote.active) {
      this.activeNote.elapsed += dt;

      // --- 1. CONTINUOUS BOW STROKE MOTION ---
      this.bowStrokePos += this.bowStrokeDir * this.bowSpeed * dt;

      // Check for bow turnaround at frog or tip (cambio de arco)
      // When sustained note exceeds stroke length, smoothly reverse direction!
      if (this.bowStrokePos >= 0.82 && this.bowStrokeDir > 0) {
        this.bowStrokeDir = -1;
        this.bowWristTurn = 0.04; // subtle wrist flex on up-bow start
      } else if (this.bowStrokePos <= -0.82 && this.bowStrokeDir < 0) {
        this.bowStrokeDir = 1;
        this.bowWristTurn = -0.04; // subtle wrist flex on down-bow start
      }

      // Smooth wrist flex decay
      this.bowWristTurn = THREE.MathUtils.lerp(this.bowWristTurn, 0, dt * 6.0);

      // Micro-vibrato on bow contact point while sustaining
      const strokeHalfSpan = 0.24;
      const bowVibrato = Math.sin(this.vibratoPhase) * 0.0015;
      const targetLocalX = this.bowTargetX + (this.bowStrokePos * strokeHalfSpan) + bowVibrato;

      // Smoothly track string position and contact depth
      this.bowCurrentX = THREE.MathUtils.lerp(this.bowCurrentX, targetLocalX, dt * 18.0);
      this.bowCurrentZ = THREE.MathUtils.lerp(this.bowCurrentZ, this.bowTargetZ, dt * 20.0);
      this.bowCurrentTilt = THREE.MathUtils.lerp(this.bowCurrentTilt, this.bowTargetTilt, dt * 14.0);

      this.bowGroup.position.x = this.bowCurrentX;
      this.bowGroup.position.z = this.bowCurrentZ;
      this.bowGroup.rotation.y = this.bowCurrentTilt;
      this.bowGroup.rotation.z = this.bowWristTurn;

      // --- 2. LEFT-HAND FINGER VIBRATO ---
      if (this.fingerMarker && this.fingerMarker.visible && this.fingerBaseY !== undefined) {
        const fingerVibrato = Math.sin(this.vibratoPhase) * 0.0016;
        this.fingerMarker.position.y = this.fingerBaseY + fingerVibrato;
      }

      // --- 3. STRING PHYSICAL OSCILLATION ---
      const activeStr = this.strings[this.activeStringIndex];
      if (activeStr) {
        const osc = Math.sin(this.vibratoPhase * 1.8) * activeStr.vibrationAmp;
        activeStr.mesh.position.x = activeStr.defaultX + osc;
      }

      // --- 4. CHECK NOMINAL DURATION TIMEOUT ---
      if (this.activeNote.elapsed >= this.activeNote.duration) {
        this.onNoteOff(this.activeNote.midiPitch);
      }
    } else {
      // Note released: gracefully return bow towards rest height
      this.bowCurrentZ = THREE.MathUtils.lerp(this.bowCurrentZ, 0.068, dt * 8.0);
      this.bowGroup.position.z = this.bowCurrentZ;
      this.bowWristTurn = THREE.MathUtils.lerp(this.bowWristTurn, 0, dt * 6.0);
      this.bowGroup.rotation.z = this.bowWristTurn;

      // Decay string vibration and glow
      this.strings.forEach(str => {
        if (str.vibrationAmp > 0.0001) {
          str.vibrationAmp = THREE.MathUtils.lerp(str.vibrationAmp, 0, dt * 8.0);
          const osc = Math.sin(this.vibratoPhase * 1.8) * str.vibrationAmp;
          str.mesh.position.x = str.defaultX + osc;
        }
        if (str.material.emissiveIntensity > 0.01) {
          str.material.emissiveIntensity = THREE.MathUtils.lerp(str.material.emissiveIntensity, 0, dt * 4.0);
        }
      });
    }
  }
}
