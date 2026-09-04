import * as THREE from 'three';
import gsap from 'gsap';

/**
 * DoubleBass3D: Photorealistic Concert Double Bass / Upright Acoustic Bass (Contrabajo)
 * Inspired by MIDIsJam & classical/jazz concert upright basses:
 * - Hand-carved spruce soundboard with sloped "gamboid" shoulders & vintage dark tobacco oil varnish.
 * - Deep resonant flamed maple ribs (fajas profundas ~22cm) and curved back plate.
 * - Authentic brass machine-head tuning gears (engranajes de latón, tornillos sinfín y paletas) on scroll.
 * - Carved aged maple bridge with dual brass height-adjuster thumbwheels.
 * - Cantilevered solid African ebony fingerboard with real-time glowing finger stop marker.
 * - Heavy ebony tailpiece with steel tailgut cable and chrome endpin (pica) to stage floor.
 * - 4 heavy wound metallic strings: E1 (28), A1 (33), D2 (38), G2 (43).
 * - Dual Animation Engine:
 *   - PIZZICATO (Default for GM 32 Acoustic Bass): string physical wave pluck oscillation & flash.
 *   - ARCO (For GM 43 Contrabass): heavy contrabass flying bow with continuous sustained strokes.
 */
export class DoubleBass3D {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();
    // Positioned left-mid stage near bass guitar and cello
    this.group.position.set(-2.9, 1.25, -0.7);
    this.group.rotation.set(0.12, Math.PI * 0.16, -0.04);

    this.strings = [];
    this.stringTuningMidi = [28, 33, 38, 43]; // E1, A1, D2, G2

    // Bow physical state & continuous bowing engine
    this.isArcoMode = false;
    this.bowStrokeDir = 1;      // +1 = down-bow, -1 = up-bow
    this.bowStrokePos = 0;
    this.bowCurrentX = 0;
    this.bowTargetX = 0;
    this.bowCurrentZ = 0.145;
    this.bowTargetZ = 0.145;
    this.bowSpeed = 0.70;
    this.bowWristTurn = 0;

    // Active sustained note tracking
    this.activeNote = null;
    this.activeStringIndex = 1;
    this.vibratoPhase = 0;
    this.bodyPulse = 0;

    this._buildMaterials();
    this._buildDoubleBassBody();
    this._buildNeckAndScroll();
    this._buildStrings();
    this._buildEndpin();
    this._buildFlyingBow();

    this.scene.add(this.group);
  }

  _buildMaterials() {
    // Varnished European Spruce Soundboard (Deep warm amber-tobacco sunburst with clearcoat)
    this.varnishMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x5a230c,
      emissive: 0x160702,
      emissiveIntensity: 0.14,
      roughness: 0.28,
      metalness: 0.04,
      clearcoat: 0.88,
      clearcoatRoughness: 0.12
    });

    // Flamed Maple Back Plate & Deep Ribs (Fondo y aros profundos de arce)
    this.flamedMapleMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x3e1707,
      emissive: 0x100501,
      roughness: 0.32,
      metalness: 0.05,
      clearcoat: 0.80,
      clearcoatRoughness: 0.15
    });

    // Solid African Ebony (Fingerboard, Tailpiece, Nut, Endpin Collar)
    this.ebonyMaterial = new THREE.MeshStandardMaterial({
      color: 0x121215,
      roughness: 0.24,
      metalness: 0.06
    });

    // Aged Carved Maple (Tall Double Bass Bridge)
    this.bridgeMaterial = new THREE.MeshStandardMaterial({
      color: 0xc8aa7e,
      roughness: 0.60,
      metalness: 0.02
    });

    // Solid Brass (Tuning machine gears, worm screws, bridge adjuster wheels)
    this.brassMaterial = new THREE.MeshStandardMaterial({
      color: 0xd4af37,
      roughness: 0.22,
      metalness: 0.90
    });

    // Pernambuco Heavy Contrabass Bow Wood
    this.bowWoodMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x381005,
      roughness: 0.20,
      metalness: 0.10,
      clearcoat: 0.80
    });

    // Natural Mixed Horsehair Ribbon
    this.bowHairMaterial = new THREE.MeshStandardMaterial({
      color: 0xf0ece2,
      roughness: 0.48,
      metalness: 0.02
    });

    // Chrome / Nickel Steel (Endpin, Machine plates, Strings)
    this.chromeMaterial = new THREE.MeshStandardMaterial({
      color: 0xd0d0d5,
      roughness: 0.15,
      metalness: 0.92
    });

    // Dark Acoustic Interior Cavity
    this.darkCavityMaterial = new THREE.MeshBasicMaterial({
      color: 0x060403
    });

    // Rubber Stopper Foot
    this.rubberMaterial = new THREE.MeshStandardMaterial({
      color: 0x111111,
      roughness: 0.92,
      metalness: 0.02
    });
  }

  /**
   * Generates authentic Gamboid / Violone Double Bass silhouette
   * Features sloping shoulders, pronounced C-bouts, and broad resonant lower bouts (~1.15m body)
   */
  _createDoubleBassShape(scale = 1.0) {
    const s = new THREE.Shape();
    // Neck joint at top center
    s.moveTo(0, 0.520 * scale);

    // Sloped gamboid shoulder (diagonal drop allows reaching upper thumb positions)
    s.lineTo(0.075 * scale, 0.520 * scale);
    s.bezierCurveTo(0.120 * scale, 0.480 * scale, 0.210 * scale, 0.360 * scale, 0.245 * scale, 0.260 * scale);
    s.bezierCurveTo(0.255 * scale, 0.180 * scale, 0.235 * scale, 0.140 * scale, 0.215 * scale, 0.110 * scale);

    // Upper corner block tip
    s.lineTo(0.235 * scale, 0.100 * scale);

    // Deep C-bout waist curve
    s.bezierCurveTo(0.150 * scale, 0.050 * scale, 0.150 * scale, -0.110 * scale, 0.225 * scale, -0.190 * scale);

    // Lower corner block tip
    s.lineTo(0.245 * scale, -0.200 * scale);

    // Lower bout right curve (very broad and deep)
    s.bezierCurveTo(0.280 * scale, -0.260 * scale, 0.340 * scale, -0.360 * scale, 0.340 * scale, -0.490 * scale);
    s.bezierCurveTo(0.340 * scale, -0.620 * scale, 0.180 * scale, -0.700 * scale, 0, -0.700 * scale);

    // Lower bout left curve
    s.bezierCurveTo(-0.180 * scale, -0.700 * scale, -0.340 * scale, -0.620 * scale, -0.340 * scale, -0.490 * scale);
    s.bezierCurveTo(-0.340 * scale, -0.360 * scale, -0.280 * scale, -0.260 * scale, -0.245 * scale, -0.200 * scale);

    // Lower left corner
    s.lineTo(-0.225 * scale, -0.190 * scale);

    // Left C-bout
    s.bezierCurveTo(-0.150 * scale, -0.110 * scale, -0.150 * scale, 0.050 * scale, -0.235 * scale, 0.100 * scale);
    s.lineTo(-0.215 * scale, 0.110 * scale);

    // Left sloped gamboid shoulder
    s.bezierCurveTo(-0.235 * scale, 0.140 * scale, -0.255 * scale, 0.180 * scale, -0.245 * scale, 0.260 * scale);
    s.bezierCurveTo(-0.210 * scale, 0.360 * scale, -0.120 * scale, 0.480 * scale, -0.075 * scale, 0.520 * scale);
    s.lineTo(0, 0.520 * scale);

    return s;
  }

  _buildDoubleBassBody() {
    this.bodyGroup = new THREE.Group();

    // 1. Arched Soundboard Top Plate (Tapa armónica de abeto)
    const topShape = this._createDoubleBassShape(1.0);
    const topGeom = new THREE.ExtrudeGeometry(topShape, {
      depth: 0.007,
      bevelEnabled: true,
      bevelSegments: 5,
      steps: 1,
      bevelSize: 0.008,
      bevelThickness: 0.014
    });
    this.topBelly = new THREE.Mesh(topGeom, this.varnishMaterial);
    this.topBelly.position.set(0, 0, 0.055);
    this.topBelly.castShadow = true;
    this.bodyGroup.add(this.topBelly);

    // 2. Arched/Sloped Back Plate (Fondo de arce flameado)
    const backGeom = new THREE.ExtrudeGeometry(topShape, {
      depth: 0.007,
      bevelEnabled: true,
      bevelSegments: 5,
      steps: 1,
      bevelSize: 0.008,
      bevelThickness: 0.014
    });
    const backPlate = new THREE.Mesh(backGeom, this.flamedMapleMaterial);
    backPlate.position.set(0, 0, -0.085);
    backPlate.castShadow = true;
    this.bodyGroup.add(backPlate);

    // 3. Deep Resonant Ribs (Aros y fajas profundas ~14cm)
    const ribShape = this._createDoubleBassShape(0.985);
    const ribGeom = new THREE.ExtrudeGeometry(ribShape, {
      depth: 0.130,
      bevelEnabled: false,
      steps: 1
    });
    const ribs = new THREE.Mesh(ribGeom, this.flamedMapleMaterial);
    ribs.position.set(0, 0, -0.065);
    this.bodyGroup.add(ribs);

    // 4. Carved Deep F-Holes (Efes de contrabajo)
    [-1, 1].forEach(side => {
      const fGroup = new THREE.Group();
      fGroup.position.set(side * 0.105, -0.080, 0.077);

      // F stem
      const fStem = new THREE.Mesh(new THREE.CylinderGeometry(0.0045, 0.006, 0.145, 8), this.darkCavityMaterial);
      fStem.rotation.z = side * -0.18;
      fGroup.add(fStem);

      // Upper and lower eyes
      const upperEye = new THREE.Mesh(new THREE.CircleGeometry(0.0095, 12), this.darkCavityMaterial);
      upperEye.position.set(side * -0.009, 0.070, 0.001);
      fGroup.add(upperEye);

      const lowerEye = new THREE.Mesh(new THREE.CircleGeometry(0.0125, 12), this.darkCavityMaterial);
      lowerEye.position.set(side * 0.016, -0.070, 0.001);
      fGroup.add(lowerEye);

      // Center nicks (muescas de la f)
      const nick = new THREE.Mesh(new THREE.BoxGeometry(0.007, 0.004, 0.002), this.darkCavityMaterial);
      nick.position.set(side * 0.004, 0, 0.001);
      fGroup.add(nick);

      this.bodyGroup.add(fGroup);
    });

    // 5. Tall Carved Maple Double Bass Bridge with Brass Adjuster Wheels
    const bridgeGroup = new THREE.Group();
    bridgeGroup.position.set(0, -0.060, 0.077);

    // Arched crown where 4 thick strings pass
    const crownGeom = new THREE.BoxGeometry(0.098, 0.008, 0.082);
    const crownMesh = new THREE.Mesh(crownGeom, this.bridgeMaterial);
    crownMesh.position.set(0, 0.065, 0.028);
    crownMesh.rotation.x = -0.04;
    bridgeGroup.add(crownMesh);

    // Dual Bridge Legs & Feet
    [-0.036, 0.036].forEach(fx => {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.022, 0.055, 0.009), this.bridgeMaterial);
      leg.position.set(fx, 0.030, 0.006);
      bridgeGroup.add(leg);

      // Brass Height-Adjustment Wheels (Ruedas de ajuste de altura de latón)
      const adjWheel = new THREE.Mesh(new THREE.CylinderGeometry(0.010, 0.010, 0.005, 12), this.brassMaterial);
      adjWheel.rotation.z = Math.PI / 2;
      adjWheel.position.set(fx, 0.010, 0.006);
      bridgeGroup.add(adjWheel);

      const foot = new THREE.Mesh(new THREE.BoxGeometry(0.024, 0.010, 0.012), this.bridgeMaterial);
      foot.position.set(fx, 0.004, 0.006);
      bridgeGroup.add(foot);
    });

    // Center decorative acoustic heart cutout
    const heartHole = new THREE.Mesh(new THREE.CircleGeometry(0.011, 12), this.darkCavityMaterial);
    heartHole.position.set(0, 0.045, 0.035);
    bridgeGroup.add(heartHole);

    this.bodyGroup.add(bridgeGroup);

    // 6. Heavy African Ebony Tailpiece (Cordal de ébano)
    const tailGroup = new THREE.Group();
    tailGroup.position.set(0, -0.380, 0.072);

    const tailShape = new THREE.Shape();
    tailShape.moveTo(-0.045, 0.220);
    tailShape.lineTo(0.045, 0.220);
    tailShape.lineTo(0.024, 0);
    tailShape.lineTo(-0.024, 0);
    tailShape.closePath();

    const tailGeom = new THREE.ExtrudeGeometry(tailShape, {
      depth: 0.012,
      bevelEnabled: true,
      bevelSegments: 3,
      bevelSize: 0.004,
      bevelThickness: 0.005
    });
    const tailMesh = new THREE.Mesh(tailGeom, this.ebonyMaterial);
    tailMesh.castShadow = true;
    tailGroup.add(tailMesh);

    // Thick Steel Cable Tailgut (Alambre tiracordal)
    [-0.012, 0.012].forEach(tx => {
      const cable = new THREE.Mesh(new THREE.CylinderGeometry(0.002, 0.002, 0.290, 6), this.chromeMaterial);
      cable.position.set(tx, -0.145, 0.005);
      tailGroup.add(cable);
    });

    // Ebony Saddle (Cejuela inferior)
    const saddle = new THREE.Mesh(new THREE.BoxGeometry(0.060, 0.016, 0.018), this.ebonyMaterial);
    saddle.position.set(0, -0.290, 0.002);
    tailGroup.add(saddle);

    this.bodyGroup.add(tailGroup);
    this.group.add(this.bodyGroup);
  }

  _buildNeckAndScroll() {
    this.neckGroup = new THREE.Group();
    this.neckGroup.position.set(0, 0.520, 0.035);

    // 1. Solid Flamed Maple Neck (Mástil grueso de arce)
    const neckLength = 0.520;
    const neckGeom = new THREE.CylinderGeometry(0.024, 0.032, neckLength, 12);
    const neck = new THREE.Mesh(neckGeom, this.flamedMapleMaterial);
    neck.position.set(0, neckLength / 2, -0.012);
    neck.rotation.x = -0.03; // Backward rake angle
    this.neckGroup.add(neck);

    // 2. Heavy African Ebony Fingerboard (Diapasón curvado de ébano)
    const fbLength = 0.780;
    const fbGeom = new THREE.BoxGeometry(0.062, fbLength, 0.016);
    this.fingerboard = new THREE.Mesh(fbGeom, this.ebonyMaterial);
    this.fingerboard.position.set(0, 0.160, 0.024);
    this.fingerboard.rotation.x = -0.045; // Cantilevers gracefully over body
    this.fingerboard.castShadow = true;
    this.neckGroup.add(this.fingerboard);

    // 3. MIDIsJam Active Finger Stop Marker & Active Pluck Glow
    const markerGeom = new THREE.CylinderGeometry(0.010, 0.010, 0.005, 12);
    const markerMat = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
      transparent: true,
      opacity: 0.90
    });
    this.fingerMarker = new THREE.Mesh(markerGeom, markerMat);
    this.fingerMarker.rotation.x = Math.PI / 2;
    this.fingerMarker.visible = false;
    this.neckGroup.add(this.fingerMarker);

    // 4. Ebony Upper Nut (Cejuela superior)
    const nutGeom = new THREE.BoxGeometry(0.052, 0.014, 0.018);
    const nut = new THREE.Mesh(nutGeom, this.ebonyMaterial);
    nut.position.set(0, neckLength - 0.010, 0.018);
    this.neckGroup.add(nut);

    // 5. Classic Double Bass Headstock Pegbox & Carved Scroll (Clavijero y Voluta)
    const pegboxLength = 0.260;
    const pegboxGeom = new THREE.BoxGeometry(0.056, pegboxLength, 0.075);
    const pegbox = new THREE.Mesh(pegboxGeom, this.flamedMapleMaterial);
    pegbox.position.set(0, neckLength + pegboxLength / 2 - 0.005, -0.022);
    this.neckGroup.add(pegbox);

    // Volute / Scroll spiral block at top
    const scrollGeom = new THREE.CylinderGeometry(0.040, 0.040, 0.054, 16);
    const scroll = new THREE.Mesh(scrollGeom, this.flamedMapleMaterial);
    scroll.rotation.z = Math.PI / 2;
    scroll.position.set(0, neckLength + pegboxLength + 0.035, -0.035);
    this.neckGroup.add(scroll);

    // 6. Authentic Brass Machine Head Tuning Gears (Clavijeros mecánicos con ruedas dentadas)
    // Double basses use geared brass tuners with worm gears and cloverleaf keys
    const tunerYOffsets = [0.045, 0.105, 0.165, 0.225];
    [-1, 1].forEach((side, sIdx) => {
      // Brass Mounting Sideplate
      const plate = new THREE.Mesh(new THREE.BoxGeometry(0.004, 0.230, 0.030), this.brassMaterial);
      plate.position.set(side * 0.030, neckLength + 0.130, -0.022);
      this.neckGroup.add(plate);

      // 2 tuners per side (4 total)
      const pairs = sIdx === 0 ? [0, 2] : [1, 3];
      pairs.forEach(idx => {
        const py = neckLength + tunerYOffsets[idx];
        const tGroup = new THREE.Group();
        tGroup.position.set(side * 0.032, py, -0.022);

        // Brass Worm Gear Wheel (Rueda dentada de latón)
        const gear = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.006, 14), this.brassMaterial);
        gear.rotation.z = Math.PI / 2;
        tGroup.add(gear);

        // Worm shaft
        const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.003, 0.003, 0.024, 8), this.chromeMaterial);
        shaft.position.set(side * 0.008, 0, 0);
        shaft.rotation.z = Math.PI / 2;
        tGroup.add(shaft);

        // Large Brass Cloverleaf / Paddle Key (Paleta de afinación)
        const paddleGeom = new THREE.CylinderGeometry(0.014, 0.014, 0.003, 8);
        const paddle = new THREE.Mesh(paddleGeom, this.brassMaterial);
        paddle.position.set(side * 0.024, 0, 0);
        paddle.rotation.x = Math.PI / 2;
        tGroup.add(paddle);

        this.neckGroup.add(tGroup);
      });
    });

    this.group.add(this.neckGroup);
  }

  _buildStrings() {
    this.stringsGroup = new THREE.Group();

    // 4 Heavy Wound Steel Strings: E1 (28), A1 (33), D2 (38), G2 (43)
    // Thicker than cello strings: 0.0038, 0.0030, 0.0024, 0.0018 radius
    const stringData = [
      { midi: 28, x: -0.028, r: 0.0036, name: 'E1' },
      { midi: 33, x: -0.009, r: 0.0030, name: 'A1' },
      { midi: 38, x:  0.009, r: 0.0024, name: 'D2' },
      { midi: 43, x:  0.028, r: 0.0018, name: 'G2' }
    ];

    const stringLength = 1.35; // Double bass vibrating string length (~105 cm scale)
    const bridgeY = -0.060;
    const nutY = 0.520 + 0.520 - 0.010; // ~1.03m

    stringData.forEach((sd, idx) => {
      const geom = new THREE.CylinderGeometry(sd.r, sd.r, stringLength, 8);
      const mat = new THREE.MeshStandardMaterial({
        color: 0xcccccc,
        roughness: 0.20,
        metalness: 0.92,
        emissive: 0x000000,
        emissiveIntensity: 0
      });

      const mesh = new THREE.Mesh(geom, mat);
      // Position from bridge up towards nut
      const midY = (bridgeY + nutY) / 2;
      const midZ = 0.098;
      mesh.position.set(sd.x, midY, midZ);
      mesh.rotation.x = -0.048; // String plane angle
      mesh.castShadow = true;

      this.stringsGroup.add(mesh);

      this.strings.push({
        index: idx,
        midi: sd.midi,
        name: sd.name,
        mesh: mesh,
        material: mat,
        defaultX: sd.x,
        defaultZ: midZ,
        radius: sd.r,
        vibrationAmp: 0
      });
    });

    // Active String Segment Glow Mesh (Visual highlight along stopped segment)
    const segGeom = new THREE.CylinderGeometry(0.005, 0.005, 1.0, 8);
    const segMat = new THREE.MeshBasicMaterial({
      color: 0xffea00,
      transparent: true,
      opacity: 0.75
    });
    this.activeStringGlowMesh = new THREE.Mesh(segGeom, segMat);
    this.activeStringGlowMesh.visible = false;
    this.stringsGroup.add(this.activeStringGlowMesh);

    // Pluck Impact Flash Ring (Pizzicato pulse wave effect)
    const pluckGeom = new THREE.RingGeometry(0.006, 0.022, 16);
    const pluckMat = new THREE.MeshBasicMaterial({
      color: 0x00ffff,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide
    });
    this.pluckPulseRing = new THREE.Mesh(pluckGeom, pluckMat);
    this.pluckPulseRing.position.set(0, 0.18, 0.115);
    this.pluckPulseRing.rotation.x = Math.PI / 2;
    this.stringsGroup.add(this.pluckPulseRing);

    this.group.add(this.stringsGroup);
  }

  _buildEndpin() {
    const endpinGroup = new THREE.Group();
    // Mounted at bottom bout base: y = -0.70
    endpinGroup.position.set(0, -0.700, 0.005);

    // Heavy African Ebony Collar Socket
    const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.024, 0.035, 12), this.ebonyMaterial);
    endpinGroup.add(collar);

    // Brass Collar Thumbscrew
    const thumbScrew = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.018, 8), this.brassMaterial);
    thumbScrew.rotation.z = Math.PI / 2;
    thumbScrew.position.set(0.022, 0, 0);
    endpinGroup.add(thumbScrew);

    // Thick Stainless Steel Rod extending down to stage floor (length ~0.55m)
    const rodLength = 0.55;
    const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.009, 0.009, rodLength, 12), this.chromeMaterial);
    rod.position.set(0, -rodLength / 2, 0);
    endpinGroup.add(rod);

    // Heavy Rubber Stopper Foot on floor
    const stopper = new THREE.Mesh(new THREE.CylinderGeometry(0.020, 0.025, 0.035, 12), this.rubberMaterial);
    stopper.position.set(0, -rodLength - 0.015, 0);
    endpinGroup.add(stopper);

    this.group.add(endpinGroup);
  }

  _buildFlyingBow() {
    this.bowGroup = new THREE.Group();
    // Heavy German/French contrabass bow: ~0.76m long
    const bowLength = 0.76;

    // Thick Pernambuco Wood Stick with camber
    const stickGeom = new THREE.CylinderGeometry(0.005, 0.0065, bowLength, 8);
    const stick = new THREE.Mesh(stickGeom, this.bowWoodMaterial);
    stick.rotation.z = Math.PI / 2;
    stick.position.set(0, 0.018, 0);
    stick.castShadow = true;
    this.bowGroup.add(stick);

    // Wide Black/Bleached Horsehair Ribbon (~2.4cm wide)
    const hairGeom = new THREE.BoxGeometry(bowLength - 0.05, 0.0025, 0.022);
    const hair = new THREE.Mesh(hairGeom, this.bowHairMaterial);
    hair.position.set(0, 0, 0);
    this.bowGroup.add(hair);

    // Contrabass Heavy Ebony Frog (Talón pesado)
    const frog = new THREE.Mesh(new THREE.BoxGeometry(0.052, 0.022, 0.024), this.ebonyMaterial);
    frog.position.set(-bowLength / 2 + 0.032, 0.010, 0);
    this.bowGroup.add(frog);

    // Brass & Mother of Pearl Inlays
    const eye = new THREE.Mesh(new THREE.CircleGeometry(0.005, 8), this.brassMaterial);
    eye.position.set(-bowLength / 2 + 0.032, 0.010, 0.013);
    this.bowGroup.add(eye);

    // Initial resting position (elevated above strings)
    this.bowGroup.position.set(0, 0.025, 0.145);
    this.bowGroup.rotation.set(0.08, 0, 0);
    this.bowGroup.visible = false; // Hidden until Arco mode active or sustained note

    this.group.add(this.bowGroup);
  }

  /**
   * Note-On Trigger: Plays either Pizzicato pluck wave or Arco sustained bowing
   */
  onNoteOn(midiPitch, velocity = 0.8, eventTime = null, trackIndex = null, duration = 0.5) {
    const vel = Math.max(0.2, Math.min(1.0, velocity));
    const noteDur = Math.max(0.1, duration || 0.5);

    // 1. Find the best matching string on the Double Bass (E1=28, A1=33, D2=38, G2=43)
    let bestString = 0;
    let minDiff = 999;
    for (let i = this.stringTuningMidi.length - 1; i >= 0; i--) {
      const diff = midiPitch - this.stringTuningMidi[i];
      if (diff >= 0 && diff < minDiff) {
        minDiff = diff;
        bestString = i;
      }
    }
    if (minDiff === 999) {
      bestString = 0;
      minDiff = Math.max(0, midiPitch - this.stringTuningMidi[0]);
    }

    this.activeStringIndex = bestString;
    this.activeNote = {
      midiPitch,
      velocity: vel,
      duration: noteDur,
      elapsed: 0,
      stringIndex: bestString,
      active: true
    };

    const str = this.strings[bestString];

    // Determine playing technique:
    // Notes longer than 1.8s or explicit contrabass arco mode use bow;
    // Fast or medium notes in rock/jazz (like Highway to Hell!) use PIZZICATO pluck!
    const isArco = this.isArcoMode || noteDur > 1.8;

    if (isArco) {
      // --- ARCO BOWING ---
      this.bowGroup.visible = true;
      this.bowStrokeDir = -this.bowStrokeDir;
      this.bowSpeed = noteDur < 0.4 ? 2.0 * vel : Math.max(0.35, 1.2 / Math.min(noteDur, 2.5));
      this.bowTargetX = str.defaultX;
      this.bowTargetZ = 0.108; // Touch string crown

      if (str) {
        str.material.emissive.setHex(0xd4af37);
        str.material.emissiveIntensity = 2.0 * vel;
        str.vibrationAmp = 0.0055 * vel;
      }
    } else {
      // --- PIZZICATO PLUCKING (Highway to Hell / Acoustic Bass) ---
      if (str) {
        // High-energy golden-cyan pluck flash
        str.material.emissive.setHex(0x00f0ff);
        str.material.emissiveIntensity = 3.0 * vel;
        str.vibrationAmp = 0.0075 * vel;

        // Visual plucking impulse ring expanding over the string
        if (this.pluckPulseRing) {
          this.pluckPulseRing.position.set(str.defaultX, 0.18, 0.115);
          this.pluckPulseRing.scale.set(1, 1, 1);
          this.pluckPulseRing.material.opacity = 0.85 * vel;

          gsap.killTweensOf(this.pluckPulseRing.scale);
          gsap.killTweensOf(this.pluckPulseRing.material);

          gsap.to(this.pluckPulseRing.scale, {
            x: 2.4,
            y: 2.4,
            duration: 0.22,
            ease: 'power2.out'
          });
          gsap.to(this.pluckPulseRing.material, {
            opacity: 0,
            duration: 0.22,
            ease: 'power2.in'
          });
        }
      }

      // Hide bow during pure pizzicato passage to keep stage clean
      if (this.bowGroup) this.bowGroup.visible = false;
    }

    // 2. MIDIsJam Finger Position Marker on Fingerboard
    const bridgeY = -0.060;
    let stopY = 0.520 + 0.520 - 0.010;
    if (minDiff > 0) {
      const semitones = Math.min(24, minDiff);
      stopY = 0.900 - (semitones * 0.024);
      if (this.fingerMarker) {
        const fingerZ = str.defaultZ + 0.004 + (stopY - 0.20) * Math.tan(0.045);
        this.fingerMarker.position.set(str.defaultX, stopY, fingerZ);
        this.fingerMarker.visible = true;
        this.fingerBaseY = stopY;
      }
    } else if (this.fingerMarker) {
      this.fingerMarker.visible = false;
    }

    // 3. String Segment Highlight Mesh
    if (this.activeStringGlowMesh) {
      const segLength = Math.max(0.08, stopY - bridgeY);
      const baseZ = str.defaultZ + 0.002 + (bridgeY - 0.20) * Math.tan(0.045);
      this.activeStringGlowMesh.position.set(str.defaultX, bridgeY + segLength / 2, baseZ);
      this.activeStringGlowMesh.scale.set(1.0, segLength, 1.0);
      this.activeStringGlowMesh.visible = true;
    }

    // 4. Upright Bass Body Groove Pulse
    if (this.bodyGroup) {
      gsap.killTweensOf(this.bodyGroup.scale);
      this.bodyGroup.scale.set(1.025, 1.025, 1.025);
      gsap.to(this.bodyGroup.scale, {
        x: 1.0,
        y: 1.0,
        z: 1.0,
        duration: 0.28,
        ease: 'elastic.out(1, 0.4)'
      });
    }

    // 5. Soundboard Resonance Flash
    if (this.varnishMaterial) {
      this.varnishMaterial.emissiveIntensity = 0.32 * vel;
      gsap.killTweensOf(this.varnishMaterial);
      gsap.to(this.varnishMaterial, {
        emissiveIntensity: 0.14,
        duration: 0.45,
        ease: 'power2.out'
      });
    }
  }

  onNoteOff(midiPitch, force = false) {
    if (this.activeNote && (this.activeNote.midiPitch === midiPitch || force)) {
      this.activeNote.active = false;
      this.bowTargetZ = 0.145;

      if (this.fingerMarker) {
        this.fingerMarker.visible = false;
      }
      if (this.activeStringGlowMesh) {
        this.activeStringGlowMesh.visible = false;
      }
    }
  }

  update(delta) {
    const dt = Math.min(0.1, Math.max(0.001, delta));
    this.vibratoPhase += dt * 26.0; // ~4.1 Hz deep acoustic bass vibrato

    if (this.activeNote && this.activeNote.active) {
      this.activeNote.elapsed += dt;

      // 1. Bowing Motion (When bow is visible / arco)
      if (this.bowGroup && this.bowGroup.visible) {
        this.bowStrokePos += this.bowStrokeDir * this.bowSpeed * dt;

        if (this.bowStrokePos >= 0.82 && this.bowStrokeDir > 0) {
          this.bowStrokeDir = -1;
          this.bowWristTurn = 0.040;
        } else if (this.bowStrokePos <= -0.82 && this.bowStrokeDir < 0) {
          this.bowStrokeDir = 1;
          this.bowWristTurn = -0.040;
        }

        this.bowWristTurn = THREE.MathUtils.lerp(this.bowWristTurn, 0, dt * 6.0);

        const strokeHalfSpan = 0.26;
        const targetLocalX = this.bowTargetX + (this.bowStrokePos * strokeHalfSpan);

        this.bowCurrentX = THREE.MathUtils.lerp(this.bowCurrentX, targetLocalX, dt * 16.0);
        this.bowCurrentZ = THREE.MathUtils.lerp(this.bowCurrentZ, this.bowTargetZ, dt * 18.0);

        this.bowGroup.position.x = this.bowCurrentX;
        this.bowGroup.position.y = 0.025;
        this.bowGroup.position.z = Math.max(0.098, this.bowCurrentZ);
        this.bowGroup.rotation.z = this.bowWristTurn;
      }

      // 2. Left-hand finger position vibrato
      if (this.fingerMarker && this.fingerMarker.visible && this.fingerBaseY !== undefined) {
        const fingerVibrato = Math.sin(this.vibratoPhase) * 0.0025;
        this.fingerMarker.position.y = this.fingerBaseY + fingerVibrato;
      }

      // 3. String Physical Wave Oscillation
      const activeStr = this.strings[this.activeStringIndex];
      if (activeStr) {
        const osc = Math.sin(this.vibratoPhase * 1.5) * activeStr.vibrationAmp;
        activeStr.mesh.position.x = activeStr.defaultX + osc;
      }

      if (this.activeNote.elapsed >= this.activeNote.duration) {
        this.onNoteOff(this.activeNote.midiPitch);
      }
    } else {
      // Return bow to ready rest height
      if (this.bowGroup && this.bowGroup.visible) {
        this.bowCurrentZ = THREE.MathUtils.lerp(this.bowCurrentZ, 0.145, dt * 8.0);
        this.bowGroup.position.z = this.bowCurrentZ;
      }

      // Decay string vibration and glow
      this.strings.forEach(str => {
        if (str.vibrationAmp > 0.0001) {
          str.vibrationAmp = THREE.MathUtils.lerp(str.vibrationAmp, 0, dt * 7.0);
          const osc = Math.sin(this.vibratoPhase * 1.5) * str.vibrationAmp;
          str.mesh.position.x = str.defaultX + osc;
        }
        if (str.material.emissiveIntensity > 0.01) {
          str.material.emissiveIntensity = THREE.MathUtils.lerp(str.material.emissiveIntensity, 0, dt * 4.0);
        }
      });
    }
  }
}
