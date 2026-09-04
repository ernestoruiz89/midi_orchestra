import * as THREE from 'three';
import gsap from 'gsap';

/**
 * Cello3D: Photorealistic Concert Cello (Violoncello)
 * Inspired by MIDIsJam & classical acoustic concert cellos:
 * - Carved European spruce soundboard with warm amber honey varnish & clearcoat.
 * - Flamed maple back plate and wide ribs with authentic Stradivarius C-bouts.
 * - Carved tall maple bridge with feet and heart/kidney cutouts.
 * - Long cantilevered African ebony fingerboard with real-time glowing finger position marker.
 * - French ebony tailpiece with 4 gold fine-tuners, tailgut, and saddle.
 * - Chrome steel endpin (pica) extending to the stage floor with rubber stopper.
 * - 4 heavy wound metallic strings: C2 (36), G2 (43), D3 (50), A3 (57).
 * - Autonomous Flying Cello Bow with continuous sustained bowing dynamics and zero clipping.
 */
export class Cello3D {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();
    // Positioned left-mid stage near violin and piano
    this.group.position.set(-3.3, 1.15, -1.2);
    this.group.rotation.set(0.14, Math.PI * 0.18, -0.05);

    this.strings = [];
    this.stringTuningMidi = [36, 43, 50, 57]; // C2, G2, D3, A3

    // Bow physical state & continuous bowing engine
    this.bowStrokeDir = 1;      // +1 = down-bow (towards tip), -1 = up-bow (towards frog)
    this.bowStrokePos = 0;      // -0.85 (frog) to +0.85 (tip)
    this.bowCurrentX = 0;
    this.bowTargetX = 0;
    this.bowCurrentZ = 0.105;
    this.bowTargetZ = 0.105;
    this.bowSpeed = 0.80;       // Normalized units/sec
    this.bowWristTurn = 0;

    // Active sustained note tracking
    this.activeNote = null;
    this.activeStringIndex = 1;
    this.vibratoPhase = 0;

    this._buildMaterials();
    this._buildCelloBody();
    this._buildNeckAndScroll();
    this._buildStrings();
    this._buildEndpin();
    this._buildFlyingBow();

    this.scene.add(this.group);
  }

  _buildMaterials() {
    // Varnished European Spruce Soundboard (Warm Golden Honey Amber with rich clearcoat)
    this.varnishMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xc46222,
      emissive: 0x1e0b02,
      emissiveIntensity: 0.15,
      roughness: 0.25,
      metalness: 0.04,
      clearcoat: 0.90,
      clearcoatRoughness: 0.10
    });

    // Flamed Maple Back Plate & Wide Ribs (Aros y Fondo de Arce)
    this.flamedMapleMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x84350c,
      emissive: 0x140602,
      roughness: 0.30,
      metalness: 0.06,
      clearcoat: 0.82,
      clearcoatRoughness: 0.14
    });

    // Solid African Ebony (Fingerboard, Tailpiece, Pegs, Nut, Endpin Collar)
    this.ebonyMaterial = new THREE.MeshStandardMaterial({
      color: 0x141416,
      roughness: 0.25,
      metalness: 0.05
    });

    // Aged Carved Maple (Tall Bridge)
    this.bridgeMaterial = new THREE.MeshStandardMaterial({
      color: 0xd4b88d,
      roughness: 0.58,
      metalness: 0.02
    });

    // Pernambuco Bow Stick Wood
    this.bowWoodMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x541808,
      roughness: 0.18,
      metalness: 0.12,
      clearcoat: 0.85
    });

    // Bleached Mongolian Horsehair Ribbon
    this.bowHairMaterial = new THREE.MeshStandardMaterial({
      color: 0xf5f2ea,
      roughness: 0.45,
      metalness: 0.02
    });

    // Chrome Steel (Endpin Rod, Bow Ferrule, Adjuster)
    this.chromeMaterial = new THREE.MeshStandardMaterial({
      color: 0xcccccc,
      roughness: 0.12,
      metalness: 0.92
    });

    // Polished Brass / Gold (Fine-Tuners, Collar Rings)
    this.goldMaterial = new THREE.MeshStandardMaterial({
      color: 0xdfb44a,
      roughness: 0.20,
      metalness: 0.90
    });

    // Dark Acoustic Interior Cavity & Purfling
    this.darkCavityMaterial = new THREE.MeshBasicMaterial({
      color: 0x080503
    });

    // Rubber Stopper at bottom of endpin
    this.rubberMaterial = new THREE.MeshStandardMaterial({
      color: 0x111111,
      roughness: 0.90,
      metalness: 0.02
    });
  }

  /**
   * Generates authentic Stradivarius / Montagnana cello silhouette (scale ~0.75m body length)
   */
  _createCelloShape(scale = 1.0) {
    const s = new THREE.Shape();
    // Neck joint at top center
    s.moveTo(0, 0.360 * scale);
    // Upper bout right curve (smooth, rounded Stradivarius shoulders)
    s.bezierCurveTo(0.080 * scale, 0.360 * scale, 0.170 * scale, 0.330 * scale, 0.190 * scale, 0.240 * scale);
    s.bezierCurveTo(0.200 * scale, 0.170 * scale, 0.180 * scale, 0.120 * scale, 0.165 * scale, 0.090 * scale);
    // Upper corner block tip
    s.lineTo(0.180 * scale, 0.080 * scale);
    // C-bout (concave waist curve)
    s.bezierCurveTo(0.120 * scale, 0.040 * scale, 0.120 * scale, -0.080 * scale, 0.175 * scale, -0.140 * scale);
    // Lower corner block tip
    s.lineTo(0.190 * scale, -0.150 * scale);
    // Lower bout right curve (broad and resonant)
    s.bezierCurveTo(0.210 * scale, -0.190 * scale, 0.245 * scale, -0.240 * scale, 0.245 * scale, -0.320 * scale);
    s.bezierCurveTo(0.245 * scale, -0.410 * scale, 0.135 * scale, -0.460 * scale, 0, -0.460 * scale);

    // Lower bout left curve (bass side)
    s.bezierCurveTo(-0.135 * scale, -0.460 * scale, -0.245 * scale, -0.410 * scale, -0.245 * scale, -0.320 * scale);
    s.bezierCurveTo(-0.245 * scale, -0.240 * scale, -0.210 * scale, -0.190 * scale, -0.190 * scale, -0.150 * scale);
    s.lineTo(-0.175 * scale, -0.140 * scale);
    // C-bout left
    s.bezierCurveTo(-0.120 * scale, -0.080 * scale, -0.120 * scale, 0.040 * scale, -0.180 * scale, 0.080 * scale);
    s.lineTo(-0.165 * scale, 0.090 * scale);
    // Upper bout left curve
    s.bezierCurveTo(-0.180 * scale, 0.120 * scale, -0.200 * scale, 0.170 * scale, -0.190 * scale, 0.240 * scale);
    s.bezierCurveTo(-0.170 * scale, 0.330 * scale, -0.080 * scale, 0.360 * scale, 0, 0.360 * scale);

    return s;
  }

  _buildCelloBody() {
    const bodyGroup = new THREE.Group();

    // 1. Arched Soundboard (Tapa Armónica de Abeto Europeo)
    const topShape = this._createCelloShape(1.0);
    const topGeom = new THREE.ExtrudeGeometry(topShape, {
      depth: 0.005,
      bevelEnabled: true,
      bevelSegments: 5,
      steps: 1,
      bevelSize: 0.006,
      bevelThickness: 0.010
    });
    this.topBelly = new THREE.Mesh(topGeom, this.varnishMaterial);
    this.topBelly.position.set(0, 0, 0.035);
    this.topBelly.castShadow = true;
    bodyGroup.add(this.topBelly);

    // 2. Back Plate (Fondo de Arce Flameado)
    const backGeom = new THREE.ExtrudeGeometry(topShape, {
      depth: 0.005,
      bevelEnabled: true,
      bevelSegments: 5,
      steps: 1,
      bevelSize: 0.006,
      bevelThickness: 0.010
    });
    const backPlate = new THREE.Mesh(backGeom, this.flamedMapleMaterial);
    backPlate.position.set(0, 0, -0.055);
    backPlate.castShadow = true;
    bodyGroup.add(backPlate);

    // 3. Wide Resonant Ribs (Aros / Fajas laterales, depth ~12cm)
    const ribShape = this._createCelloShape(0.985);
    const ribGeom = new THREE.ExtrudeGeometry(ribShape, {
      depth: 0.082,
      bevelEnabled: false,
      steps: 1
    });
    const ribs = new THREE.Mesh(ribGeom, this.flamedMapleMaterial);
    ribs.position.set(0, 0, -0.041);
    bodyGroup.add(ribs);

    // 4. Carved F-Holes (Efes Italianas talladas)
    [-1, 1].forEach(side => {
      const fGroup = new THREE.Group();
      fGroup.position.set(side * 0.072, -0.045, 0.051);

      // F stem
      const fStem = new THREE.Mesh(new THREE.CylinderGeometry(0.0035, 0.0045, 0.095, 8), this.darkCavityMaterial);
      fStem.rotation.z = side * -0.15;
      fGroup.add(fStem);

      // Upper and lower soundhole eye cutouts
      const upperEye = new THREE.Mesh(new THREE.CircleGeometry(0.0065, 12), this.darkCavityMaterial);
      upperEye.position.set(side * -0.006, 0.045, 0.001);
      fGroup.add(upperEye);

      const lowerEye = new THREE.Mesh(new THREE.CircleGeometry(0.0085, 12), this.darkCavityMaterial);
      lowerEye.position.set(side * 0.012, -0.045, 0.001);
      fGroup.add(lowerEye);

      bodyGroup.add(fGroup);
    });

    // 5. Tall Carved Maple Belgian Bridge (Puente de Arce) at y = -0.035
    const bridgeGroup = new THREE.Group();
    bridgeGroup.position.set(0, -0.035, 0.051);

    // Arched crown where the 4 strings rest
    const crownGeom = new THREE.BoxGeometry(0.068, 0.006, 0.058);
    const crownMesh = new THREE.Mesh(crownGeom, this.bridgeMaterial);
    crownMesh.position.set(0, 0.045, 0.020);
    crownMesh.rotation.x = -0.04;
    bridgeGroup.add(crownMesh);

    // Bridge dual feet resting on soundboard
    [-0.024, 0.024].forEach(fx => {
      const foot = new THREE.Mesh(new THREE.BoxGeometry(0.016, 0.045, 0.007), this.bridgeMaterial);
      foot.position.set(fx, 0.022, 0.004);
      bridgeGroup.add(foot);
    });

    // Center decorative acoustic cutout
    const heartHole = new THREE.Mesh(new THREE.CircleGeometry(0.0075, 12), this.darkCavityMaterial);
    heartHole.position.set(0, 0.032, 0.025);
    bridgeGroup.add(heartHole);

    bodyGroup.add(bridgeGroup);

    // 6. French Ebony Tailpiece with 4 Gold Fine-Tuners (Cordal de Ébano)
    const tailpieceGroup = new THREE.Group();
    tailpieceGroup.position.set(0, -0.260, 0.052);

    const tailGeom = new THREE.ConeGeometry(0.034, 0.175, 4);
    tailGeom.rotateY(Math.PI / 4);
    const tailMesh = new THREE.Mesh(tailGeom, this.ebonyMaterial);
    tailMesh.scale.set(1.0, 1.0, 0.45);
    tailMesh.rotation.x = 0.14;
    tailpieceGroup.add(tailMesh);

    // 4 Gold fine-tuner screws on tailpiece crown
    [-0.016, -0.005, 0.005, 0.016].forEach(tx => {
      const screw = new THREE.Mesh(new THREE.CylinderGeometry(0.0028, 0.0028, 0.006, 8), this.goldMaterial);
      screw.position.set(tx, 0.075, 0.012);
      tailpieceGroup.add(screw);
    });

    bodyGroup.add(tailpieceGroup);

    this.group.add(bodyGroup);
  }

  _buildNeckAndScroll() {
    const neckGroup = new THREE.Group();

    // 1. Maple Neck Root & Heel
    const neckGeom = new THREE.CylinderGeometry(0.018, 0.024, 0.34, 12);
    const neck = new THREE.Mesh(neckGeom, this.flamedMapleMaterial);
    neck.position.set(0, 0.46, 0.030);
    neck.rotation.x = 0.08;
    neckGroup.add(neck);

    // 2. Long Ebony Fingerboard (Diapasón voladizo ahusado)
    const fbGeom = new THREE.BoxGeometry(0.052, 0.58, 0.014);
    const fb = new THREE.Mesh(fbGeom, this.ebonyMaterial);
    fb.position.set(0, 0.22, 0.068);
    fb.rotation.x = 0.075;
    neckGroup.add(fb);

    // Bone Nut at upper end of fingerboard
    const nut = new THREE.Mesh(new THREE.BoxGeometry(0.046, 0.008, 0.009), this.bridgeMaterial);
    nut.position.set(0, 0.505, 0.054);
    neckGroup.add(nut);

    // 3. Pegbox (Clavijero) & 4 Ebony Pegs
    const pegbox = new THREE.Mesh(new THREE.BoxGeometry(0.042, 0.13, 0.048), this.flamedMapleMaterial);
    pegbox.position.set(0, 0.58, 0.040);
    neckGroup.add(pegbox);

    const pegHeights = [0.54, 0.57, 0.60, 0.63];
    pegHeights.forEach((py, i) => {
      const side = (i % 2 === 0) ? -1 : 1;
      const pegShaft = new THREE.Mesh(new THREE.CylinderGeometry(0.0035, 0.0035, 0.065, 8), this.ebonyMaterial);
      pegShaft.rotation.z = Math.PI / 2;
      pegShaft.position.set(0, py, 0.040);
      neckGroup.add(pegShaft);

      const pegHead = new THREE.Mesh(new THREE.SphereGeometry(0.009, 8, 8), this.ebonyMaterial);
      pegHead.scale.set(0.5, 1.4, 1.0);
      pegHead.position.set(side * 0.036, py, 0.040);
      neckGroup.add(pegHead);
    });

    // 4. Carved Spiral Volute Scroll (Voluta Clásica)
    const scroll = new THREE.Mesh(new THREE.TorusGeometry(0.026, 0.012, 10, 24, Math.PI * 1.6), this.flamedMapleMaterial);
    scroll.rotation.y = Math.PI / 2;
    scroll.position.set(0, 0.68, 0.035);
    neckGroup.add(scroll);

    this.group.add(neckGroup);
  }

  _buildStrings() {
    this.strings = [];

    // Cello String Setup: [C2 (36), G2 (43), D3 (50), A3 (57)]
    const stringSpecs = [
      { name: 'C2', gauge: 0.0028, color: 0xccd4e0, xBridge: -0.022, z: 0.075 }, // Heavy tungsten wound
      { name: 'G2', gauge: 0.0022, color: 0xd8dee8, xBridge: -0.0075, z: 0.079 }, // Silver wound
      { name: 'D3', gauge: 0.0017, color: 0xe2e6ee, xBridge:  0.0075, z: 0.079 }, // Aluminum wound
      { name: 'A3', gauge: 0.0013, color: 0xf5f0dc, xBridge:  0.022, z: 0.075 }  // Steel core
    ];

    stringSpecs.forEach(sd => {
      const geom = new THREE.CylinderGeometry(sd.gauge, sd.gauge, 0.88, 8);
      const mat = new THREE.MeshStandardMaterial({
        color: sd.color,
        metalness: 0.95,
        roughness: 0.12,
        emissive: new THREE.Color(0x000000),
        emissiveIntensity: 0.0
      });
      const strMesh = new THREE.Mesh(geom, mat);
      // Spanning from tailpiece over bridge to pegbox
      strMesh.position.set(sd.xBridge, 0.16, sd.z);
      strMesh.rotation.x = 0.05;
      this.group.add(strMesh);

      this.strings.push({
        mesh: strMesh,
        material: mat,
        defaultX: sd.xBridge,
        defaultZ: sd.z,
        vibrationAmp: 0
      });
    });
    // Dedicated MIDIsJam Glowing Active String Highlight (Segment from finger to bridge)
    const glowGeom = new THREE.CylinderGeometry(0.0035, 0.0035, 1.0, 8);
    glowGeom.translate(0, 0.5, 0); // Origin at bottom, extending up along +Y
    const glowMat = new THREE.MeshBasicMaterial({
      color: 0xffea00
    });
    this.activeStringGlowMesh = new THREE.Mesh(glowGeom, glowMat);
    this.activeStringGlowMesh.rotation.x = 0.05;
    this.activeStringGlowMesh.visible = false;
    this.group.add(this.activeStringGlowMesh);

    // Glowing MIDIsJam Finger Position Marker on Fingerboard
    const markerGeom = new THREE.SphereGeometry(0.009, 14, 14);
    const markerMat = new THREE.MeshBasicMaterial({
      color: 0xffee00 // Pure unshaded MIDIsJam glowing yellow dot
    });
    this.fingerMarker = new THREE.Mesh(markerGeom, markerMat);
    this.fingerMarker.scale.set(1.0, 0.6, 1.0);
    this.fingerMarker.visible = false;
    this.group.add(this.fingerMarker);
  }

  _buildEndpin() {
    // Chrome Steel Endpin (Pica de violonchelo) firmly reaching stage floor
    const endpinGroup = new THREE.Group();
    endpinGroup.position.set(0, -0.460, 0);

    // Endpin ebony collar block
    const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.016, 0.025, 12), this.ebonyMaterial);
    endpinGroup.add(collar);

    // Tightening thumb screw
    const screw = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.005, 0.008), this.goldMaterial);
    screw.position.set(0, 0, 0.015);
    endpinGroup.add(screw);

    // Telescopic chrome steel rod extending to floor (length ~0.68m)
    const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.0055, 0.0055, 0.68, 12), this.chromeMaterial);
    rod.position.set(0, -0.34, -0.01);
    endpinGroup.add(rod);

    // Black rubber foot stopper touching stage floor at world y = 0
    const stopper = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.008, 0.030, 12), this.rubberMaterial);
    stopper.position.set(0, -0.685, -0.01);
    endpinGroup.add(stopper);

    this.group.add(endpinGroup);
  }

  _buildFlyingBow() {
    const bowGroup = new THREE.Group();

    // 1. Bleached White Mongolian Horsehair Ribbon (touches strings at local z = 0)
    // Cello bow ribbon is 68 cm long, 8 mm wide across Y, and 1.5 mm thick in Z
    const hairGeom = new THREE.BoxGeometry(0.68, 0.008, 0.0015);
    const hair = new THREE.Mesh(hairGeom, this.bowHairMaterial);
    hair.position.set(0.015, 0, 0.0008);
    bowGroup.add(hair);

    // 2. Pernambuco Bow Stick (72 cm) - lifted in front at local z = +0.016
    const stickGeom = new THREE.CylinderGeometry(0.0035, 0.0052, 0.72, 12);
    stickGeom.rotateZ(Math.PI / 2);
    const stick = new THREE.Mesh(stickGeom, this.bowWoodMaterial);
    stick.position.set(0.015, 0.004, 0.016);
    stick.castShadow = true;
    bowGroup.add(stick);

    // 3. Ivory / Bone Cello Head Tip at x = +0.35
    const tipHeadGeom = new THREE.BoxGeometry(0.024, 0.008, 0.018);
    const tipHead = new THREE.Mesh(tipHeadGeom, this.bridgeMaterial);
    tipHead.position.set(0.350, 0.002, 0.009);
    bowGroup.add(tipHead);

    // 4. Carved Ebony Frog with Nickel Ferrule & Parisian Eye at x = -0.32
    const frogGroup = new THREE.Group();
    frogGroup.position.set(-0.32, 0.002, 0.008);

    const frogBody = new THREE.Mesh(new THREE.BoxGeometry(0.048, 0.015, 0.016), this.ebonyMaterial);
    frogGroup.add(frogBody);

    const ferrule = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.009, 0.007), this.chromeMaterial);
    ferrule.position.set(0.022, -0.002, -0.004);
    frogGroup.add(ferrule);

    // Parisian eye
    [-0.008, 0.008].forEach(py => {
      const eyeRing = new THREE.Mesh(new THREE.RingGeometry(0.0018, 0.0032, 12), this.goldMaterial);
      eyeRing.position.set(-0.004, py, 0.001);
      eyeRing.rotation.x = py > 0 ? -Math.PI / 2 : Math.PI / 2;
      frogGroup.add(eyeRing);
    });

    const adjuster = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.005, 0.020, 10), this.chromeMaterial);
    adjuster.rotation.z = Math.PI / 2;
    adjuster.position.set(-0.032, 0.002, 0.008);
    frogGroup.add(adjuster);

    bowGroup.add(frogGroup);

    // Initial hovering position: contact zone at y = 0.015, resting height at z = 0.105
    bowGroup.position.set(0, 0.015, 0.105);
    bowGroup.rotation.x = 0.08; // subtle tilt towards fingerboard
    this.group.add(bowGroup);
    this.bowGroup = bowGroup;
  }

  /**
   * Note-On Trigger: Places bow on active string and engages continuous bowing
   */
  onNoteOn(midiPitch, velocity = 0.8, eventTime = null, trackIndex = null, duration = 0.5) {
    const vel = Math.max(0.3, Math.min(1.0, velocity));
    let noteDur = 0.5;
    if (typeof duration === 'number' && duration > 0.05) {
      noteDur = duration;
    } else if (typeof eventTime === 'number' && eventTime > 0.05 && trackIndex === undefined) {
      noteDur = eventTime;
    }

    // 1. Determine active string [C2=36, G2=43, D3=50, A3=57]
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

    // 3. Alternate bow stroke direction
    this.bowStrokeDir = -this.bowStrokeDir;

    // Speed scales with note duration
    if (noteDur < 0.35) {
      this.bowSpeed = 2.2 * vel;
    } else if (noteDur < 1.2) {
      this.bowSpeed = 1.2 * vel;
    } else {
      this.bowSpeed = Math.max(0.40, Math.min(0.90, 1.3 / Math.min(noteDur, 2.5)));
    }

    // Target bow alignment for active string
    const str = this.strings[bestString];
    this.bowTargetX = str.defaultX;
    // Hair rests right on string crown
    this.bowTargetZ = str.defaultZ + 0.001;

    // 4. Initial String Excitation Glow (MIDIsJam style yellow/gold)
    if (str) {
      str.material.emissive.setHex(0xffcc00);
      str.material.emissiveIntensity = 2.4 * vel;
      str.vibrationAmp = 0.0045 * vel;
    }

    // 5. MIDIsJam Active String Segment Highlight & Finger Marker
    const bridgeY = -0.015; // Crown of the bridge
    let stopY = 0.490;      // Open string nut position
    if (minDiff > 0) {
      const semitones = Math.min(24, minDiff);
      stopY = 0.470 - (semitones * 0.0165);
      if (this.fingerMarker) {
        const fingerZ = str.defaultZ + 0.003 + (stopY - 0.16) * Math.tan(0.05);
        this.fingerMarker.position.set(str.defaultX, stopY, fingerZ);
        this.fingerMarker.visible = true;
        this.fingerBaseY = stopY;
      }
    } else if (this.fingerMarker) {
      this.fingerMarker.visible = false;
    }

    if (this.activeStringGlowMesh) {
      const segLength = Math.max(0.05, stopY - bridgeY);
      const baseZ = str.defaultZ + 0.002 + (bridgeY - 0.16) * Math.tan(0.05);
      this.activeStringGlowMesh.position.set(str.defaultX, bridgeY, baseZ);
      this.activeStringGlowMesh.scale.set(1.0, segLength, 1.0);
      this.activeStringGlowMesh.visible = true;
    }

    // 6. Subtle Soundboard Resonance Flash
    if (this.varnishMaterial) {
      this.varnishMaterial.emissiveIntensity = 0.35 * vel;
      gsap.killTweensOf(this.varnishMaterial);
      gsap.to(this.varnishMaterial, {
        emissiveIntensity: 0.15,
        duration: 0.5,
        ease: 'power2.out'
      });
    }
  }

  /**
   * Note-Off Trigger: Smooth bow lift and string release
   */
  onNoteOff(midiPitch, force = false) {
    if (this.activeNote && (this.activeNote.midiPitch === midiPitch || force)) {
      this.activeNote.active = false;
      // Lift bow slightly into ready rest position above strings
      this.bowTargetZ = 0.105;

      if (this.fingerMarker) {
        this.fingerMarker.visible = false;
      }

      if (this.activeStringGlowMesh) {
        this.activeStringGlowMesh.visible = false;
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
    this.vibratoPhase += dt * 32.0; // ~5.1 Hz cello vibrato

    if (this.activeNote && this.activeNote.active) {
      this.activeNote.elapsed += dt;

      // --- 1. CONTINUOUS BOW STROKE MOTION ---
      this.bowStrokePos += this.bowStrokeDir * this.bowSpeed * dt;

      // Bow turnaround at frog or tip (cambio de arco)
      if (this.bowStrokePos >= 0.82 && this.bowStrokeDir > 0) {
        this.bowStrokeDir = -1;
        this.bowWristTurn = 0.035;
      } else if (this.bowStrokePos <= -0.82 && this.bowStrokeDir < 0) {
        this.bowStrokeDir = 1;
        this.bowWristTurn = -0.035;
      }

      this.bowWristTurn = THREE.MathUtils.lerp(this.bowWristTurn, 0, dt * 6.0);

      // Micro-vibrato on bow contact point
      const strokeHalfSpan = 0.23;
      const bowVibrato = Math.sin(this.vibratoPhase) * 0.0015;
      const targetLocalX = this.bowTargetX + (this.bowStrokePos * strokeHalfSpan) + bowVibrato;

      this.bowCurrentX = THREE.MathUtils.lerp(this.bowCurrentX, targetLocalX, dt * 18.0);
      this.bowCurrentZ = THREE.MathUtils.lerp(this.bowCurrentZ, this.bowTargetZ, dt * 20.0);

      // Rigid safety clamp: Bow can NEVER penetrate below string clearance level
      this.bowGroup.position.x = this.bowCurrentX;
      this.bowGroup.position.y = 0.058;
      this.bowGroup.position.z = Math.max(0.076, this.bowCurrentZ);

      this.bowGroup.rotation.x = 0.08;
      this.bowGroup.rotation.y = 0.0; // Strictly 0: stays parallel to bridge, zero clipping
      this.bowGroup.rotation.z = this.bowWristTurn;

      // --- 2. LEFT-HAND FINGER VIBRATO ---
      if (this.fingerMarker && this.fingerMarker.visible && this.fingerBaseY !== undefined) {
        const fingerVibrato = Math.sin(this.vibratoPhase) * 0.002;
        this.fingerMarker.position.y = this.fingerBaseY + fingerVibrato;
      }

      // --- 3. STRING PHYSICAL OSCILLATION ---
      const activeStr = this.strings[this.activeStringIndex];
      if (activeStr) {
        const osc = Math.sin(this.vibratoPhase * 1.8) * activeStr.vibrationAmp;
        activeStr.mesh.position.x = activeStr.defaultX + osc;
      }

      // --- 4. DURATION TIMEOUT CHECK ---
      if (this.activeNote.elapsed >= this.activeNote.duration) {
        this.onNoteOff(this.activeNote.midiPitch);
      }
    } else {
      // Note released: return bow to ready rest height
      this.bowCurrentZ = THREE.MathUtils.lerp(this.bowCurrentZ, 0.105, dt * 8.0);
      this.bowGroup.position.x = this.bowCurrentX;
      this.bowGroup.position.y = 0.058;
      this.bowGroup.position.z = Math.max(0.076, this.bowCurrentZ);
      this.bowGroup.rotation.x = 0.08;
      this.bowGroup.rotation.y = 0.0;
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
