import * as THREE from 'three';
import gsap from 'gsap';

/**
 * Xylophone3D: High-End Concert Grand Xylophone / Marimba
 * - Hand-selected Honduras Rosewood (Palisandro) tuned acoustic bars (3 Octaves, 37 notes).
 * - Tapered concert chassis with sculpted walnut endboards and 4 longitudinal suspension rails.
 * - Braided nodal suspension cord passing through real drilled nodal holes with rubber guide posts.
 * - Dual banks of graduated gold brass resonator tubes with cathedral curve and bell mouths.
 * - Heavy-duty studio stand with height-adjustment handwheels and 4 swivel locking casters.
 * - Concert yarn-wound mallets with tapered rattan shafts, rubber cores, and dynamic wrist whip strike.
 * - Velocity-reactive acoustic bar vibration and subsurface resonant bloom.
 */
export class Xylophone3D {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();
    // Positioned front-center stage with natural stage angle
    this.group.position.set(0, 0.95, 1.6);
    this.group.rotation.set(0, Math.PI * 0.14, 0);

    this.bars = {};
    this.resonatorTubes = {};
    this.malletPool = [];
    this.preparedStrikes = new Map();
    this.malletDefaults = {};

    // Dimension constants (dramatically tapered concert trapezoid chassis)
    this.totalLength = 1.38;       // Overall length along X (Bass to Treble)
    this.bassWidth = 0.76;         // Chassis depth at bass end (Z span) - wide
    this.trebleWidth = 0.32;       // Chassis depth at treble end (Z span) - narrow
    this.bassX = -this.totalLength / 2;
    this.trebleX = this.totalLength / 2;

    this._buildMaterials();
    this._buildChassisAndStand();
    this._buildTunedBarsAndSuspension();
    this._buildResonatorBanks();
    this._buildConcertMallets();

    this.scene.add(this.group);
  }

  _buildMaterials() {
    // 1. Honduras Rosewood (Palisandro de Concierto): Rich deep grain with satin lacquer clearcoat
    this.rosewoodMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x4a1c0d,
      emissive: 0x120402,
      emissiveIntensity: 0.15,
      roughness: 0.28,
      metalness: 0.05,
      clearcoat: 0.85,
      clearcoatRoughness: 0.12,
      reflectivity: 0.7
    });

    // 2. High-Polish Lacquered Gold Brass Resonators
    this.goldResonatorMaterial = new THREE.MeshStandardMaterial({
      color: 0xdeb338,
      roughness: 0.18,
      metalness: 0.88
    });

    // 3. Dark Sculpted Walnut / Ebonized Maple for Endboards & Rails
    this.walnutEndboardMaterial = new THREE.MeshStandardMaterial({
      color: 0x1f140e,
      roughness: 0.38,
      metalness: 0.08
    });

    // 4. Matte Black Powder-Coated Steel Chassis / Legs
    this.steelChassisMaterial = new THREE.MeshStandardMaterial({
      color: 0x1a1a1e,
      roughness: 0.45,
      metalness: 0.85
    });

    // 5. Mirror Chrome Hardware (Tension springs, adjustment handwheels, caster forks)
    this.chromeMaterial = new THREE.MeshStandardMaterial({
      color: 0xf4f5f8,
      roughness: 0.12,
      metalness: 0.96
    });

    // 6. Braided Nodal Suspension Cord (Cream/Ivory nylon cord)
    this.cordMaterial = new THREE.MeshStandardMaterial({
      color: 0xd8cca8,
      roughness: 0.65,
      metalness: 0.02
    });

    // 7. Neoprene Rubber Guide Post Sleeves (Isolators between bars)
    this.postRubberMaterial = new THREE.MeshStandardMaterial({
      color: 0x141416,
      roughness: 0.85,
      metalness: 0.05
    });

    // 8. Tapered Rattan / Birch Mallet Shafts
    this.rattanMaterial = new THREE.MeshStandardMaterial({
      color: 0xebd9b4,
      roughness: 0.32,
      metalness: 0.05
    });

    // 9. Black Rubber Grip on Mallet Handles
    this.malletGripMaterial = new THREE.MeshStandardMaterial({
      color: 0x16161a,
      roughness: 0.6,
      metalness: 0.1
    });

    // 10. Concert Yarn-Wound Mallet Heads (Royal Sapphire with Gold Accent Ring)
    this.yarnHeadMaterial = new THREE.MeshStandardMaterial({
      color: 0x1a5bb8,
      roughness: 0.72,
      metalness: 0.08
    });

    this.yarnGoldAccentMaterial = new THREE.MeshStandardMaterial({
      color: 0xd4af37,
      roughness: 0.45,
      metalness: 0.85
    });
  }

  _createAngledRail(x1, z1, x2, z2, y, material, height = 0.026, thickness = 0.022) {
    const p1 = new THREE.Vector3(x1, y, z1);
    const p2 = new THREE.Vector3(x2, y, z2);
    const dir = new THREE.Vector3().subVectors(p2, p1);
    const length = dir.length();

    const geom = new THREE.BoxGeometry(length, height, thickness);
    const mesh = new THREE.Mesh(geom, material);
    mesh.position.copy(p1).addScaledVector(dir, 0.5);
    mesh.quaternion.setFromUnitVectors(new THREE.Vector3(1, 0, 0), dir.clone().normalize());
    return mesh;
  }

  _buildChassisAndStand() {
    const chassis = new THREE.Group();

    // --- A. Sculpted Hardwood Endboards (Mejillas Laterales) ---
    // Left Endboard (Bass - Wide: 0.76m depth)
    const bassCheek = this._createContouredEndboard(this.bassWidth, 0.095, 0.040);
    bassCheek.position.set(this.bassX - 0.02, -0.015, 0);
    chassis.add(bassCheek);

    // Right Endboard (Treble - Narrow: 0.28m depth)
    const trebleCheek = this._createContouredEndboard(this.trebleWidth, 0.080, 0.040);
    trebleCheek.position.set(this.trebleX + 0.02, -0.015, 0);
    chassis.add(trebleCheek);

    // Brass Maker's Plate on Bass Endboard
    const badgeGeom = new THREE.BoxGeometry(0.003, 0.024, 0.08);
    const badge = new THREE.Mesh(badgeGeom, this.chromeMaterial);
    badge.position.set(this.bassX - 0.04, -0.01, 0);
    chassis.add(badge);

    // --- B. Four Angled Longitudinal Suspension Rails (Trapezoidal taper) ---
    // Lower Front Rail (under outer nodes of natural keys): from Z=+0.295 down to Z=+0.110
    const lowerFrontRail = this._createAngledRail(
      this.bassX, 0.295, this.trebleX, 0.110, -0.02, this.walnutEndboardMaterial
    );
    chassis.add(lowerFrontRail);

    // Lower Back Rail (under inner nodes of natural keys): from Z=+0.075 down to Z=+0.024
    const lowerBackRail = this._createAngledRail(
      this.bassX, 0.075, this.trebleX, 0.024, -0.02, this.walnutEndboardMaterial
    );
    chassis.add(lowerBackRail);

    // Upper Front Rail (under inner nodes of accidental keys): from Z=-0.065 down to Z=-0.020
    const upperFrontRail = this._createAngledRail(
      this.bassX, -0.065, this.trebleX, -0.020, 0.008, this.walnutEndboardMaterial
    );
    chassis.add(upperFrontRail);

    // Upper Back Rail (under outer nodes of accidental keys): from Z=-0.265 down to Z=-0.095
    const upperBackRail = this._createAngledRail(
      this.bassX, -0.265, this.trebleX, -0.095, 0.008, this.walnutEndboardMaterial
    );
    chassis.add(upperBackRail);

    // Angled Felt Isolation Bedding strips along tops of rails
    const feltMat = new THREE.MeshStandardMaterial({ color: 0x3a3a42, roughness: 0.9 });
    chassis.add(this._createAngledRail(this.bassX, 0.295, this.trebleX, 0.110, -0.006, feltMat, 0.004, 0.016));
    chassis.add(this._createAngledRail(this.bassX, 0.075, this.trebleX, 0.024, -0.006, feltMat, 0.004, 0.016));
    chassis.add(this._createAngledRail(this.bassX, -0.065, this.trebleX, -0.020, 0.022, feltMat, 0.004, 0.016));
    chassis.add(this._createAngledRail(this.bassX, -0.265, this.trebleX, -0.095, 0.022, feltMat, 0.004, 0.016));

    // --- C. Heavy-Duty Studio Stand with Dual Pillars & Height Adjusters ---
    [
      { x: this.bassX + 0.08, zSpan: 0.54, footSpan: 0.60 },
      { x: this.trebleX - 0.08, zSpan: 0.22, footSpan: 0.34 }
    ].forEach(legCfg => {
      const legGroup = new THREE.Group();
      legGroup.position.x = legCfg.x;

      // Top Crossbar under rails
      const topBarGeom = new THREE.BoxGeometry(0.045, 0.035, legCfg.zSpan + 0.08);
      const topBar = new THREE.Mesh(topBarGeom, this.steelChassisMaterial);
      topBar.position.set(0, -0.045, 0);
      legGroup.add(topBar);

      // Height-Adjustment Chrome Threaded Column
      const colGeom = new THREE.CylinderGeometry(0.018, 0.018, 0.22, 16);
      const col = new THREE.Mesh(colGeom, this.chromeMaterial);
      col.position.set(0, -0.16, 0);
      legGroup.add(col);

      // Height Adjuster Mechanical Handwheel (Fluted Star Knob)
      const knobGeom = new THREE.CylinderGeometry(0.045, 0.042, 0.025, 12);
      const knob = new THREE.Mesh(knobGeom, this.chromeMaterial);
      knob.position.set(0, -0.15, 0);
      legGroup.add(knob);

      // Lower Telescoping Receiver Housing
      const recGeom = new THREE.BoxGeometry(0.055, 0.42, 0.055);
      const rec = new THREE.Mesh(recGeom, this.steelChassisMaterial);
      rec.position.set(0, -0.42, 0);
      legGroup.add(rec);

      // Dual Splay Legs (Bottom feet bar)
      const footBarGeom = new THREE.BoxGeometry(0.045, 0.04, legCfg.footSpan);
      const footBar = new THREE.Mesh(footBarGeom, this.steelChassisMaterial);
      footBar.position.set(0, -0.64, 0);
      legGroup.add(footBar);

      // Studio Swivel Casters with Locking Brakes (2 per side)
      [-legCfg.footSpan / 2 + 0.03, legCfg.footSpan / 2 - 0.03].forEach(cz => {
        const casterGroup = new THREE.Group();
        casterGroup.position.set(0, -0.66, cz);

        // Chrome Swivel Fork
        const forkGeom = new THREE.CylinderGeometry(0.014, 0.014, 0.04, 12);
        const fork = new THREE.Mesh(forkGeom, this.chromeMaterial);
        fork.position.y = -0.02;
        casterGroup.add(fork);

        // Heavy Rubber Wheel with Chrome Hub
        const wheelGeom = new THREE.CylinderGeometry(0.034, 0.034, 0.022, 18);
        wheelGeom.rotateZ(Math.PI / 2);
        const wheel = new THREE.Mesh(wheelGeom, this.steelChassisMaterial);
        wheel.position.set(0, -0.055, 0);
        casterGroup.add(wheel);

        // Locking Brake Lever
        const brakeGeom = new THREE.BoxGeometry(0.008, 0.026, 0.022);
        const brake = new THREE.Mesh(brakeGeom, this.chromeMaterial);
        brake.position.set(0.02, -0.04, 0);
        brake.rotation.z = -0.4;
        casterGroup.add(brake);

        legGroup.add(casterGroup);
      });

      chassis.add(legGroup);
    });

    // Central Horizontal Truss / Stabilizer Bar connecting the legs
    const trussLength = this.totalLength - 0.20;
    const centerTrussGeom = new THREE.CylinderGeometry(0.018, 0.018, trussLength, 16);
    centerTrussGeom.rotateZ(Math.PI / 2);
    const centerTruss = new THREE.Mesh(centerTrussGeom, this.steelChassisMaterial);
    centerTruss.position.set(0, -0.58, 0);
    chassis.add(centerTruss);

    // Center Clamp Collar
    const collarGeom = new THREE.CylinderGeometry(0.028, 0.028, 0.06, 12);
    collarGeom.rotateZ(Math.PI / 2);
    const collar = new THREE.Mesh(collarGeom, this.chromeMaterial);
    collar.position.set(0, -0.58, 0);
    chassis.add(collar);

    this.group.add(chassis);
  }

  _createContouredEndboard(depth, height, thickness) {
    const group = new THREE.Group();

    // Solid hardwood contoured cheek
    const shape = new THREE.Shape();
    const halfD = depth / 2;
    const halfH = height / 2;

    shape.moveTo(-halfD, -halfH);
    shape.lineTo(halfD, -halfH);
    shape.quadraticCurveTo(halfD + 0.02, 0, halfD, halfH);
    shape.lineTo(-halfD, halfH);
    shape.quadraticCurveTo(-halfD - 0.02, 0, -halfD, -halfH);

    const extrudeSettings = {
      steps: 1,
      depth: thickness,
      bevelEnabled: true,
      bevelThickness: 0.006,
      bevelSize: 0.006,
      bevelSegments: 3
    };

    const geom = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    geom.rotateY(Math.PI / 2);
    geom.translate(-thickness / 2, 0, 0);

    const mesh = new THREE.Mesh(geom, this.walnutEndboardMaterial);
    mesh.castShadow = true;
    group.add(mesh);

    // Chrome End Tension Pins for suspension cord
    [-halfD * 0.7, halfD * 0.7].forEach(pz => {
      const pinGeom = new THREE.CylinderGeometry(0.004, 0.004, 0.024, 8);
      const pin = new THREE.Mesh(pinGeom, this.chromeMaterial);
      pin.position.set(0, halfH + 0.008, pz);
      group.add(pin);
    });

    return group;
  }

  _buildResonatorBanks() {
    const resonatorsGroup = new THREE.Group();

    // Place a tuned acoustic resonator tube directly beneath EVERY bar in this.bars!
    // This automatically creates groups of 2 and 3 with matching gaps under the accidental tier.
    Object.values(this.bars).forEach(bar => {
      const frac = (bar.midi - 60) / (96 - 60);

      // Acoustic exponential length taper with cathedral curve arch
      const baseLen = bar.isBlack ? 0.36 : 0.42;
      const minLen = bar.isBlack ? 0.06 : 0.07;
      const tubeLen = baseLen * Math.pow(minLen / baseLen, Math.pow(frac, 0.85));

      // Graduated tube diameters (Bass ~36mm, Treble ~20mm)
      const diameter = THREE.MathUtils.lerp(0.018, 0.010, frac);

      const tubeGroup = new THREE.Group();
      tubeGroup.position.set(bar.x, -0.045, bar.z);

      // Main cylindrical tube body
      const tubeGeom = new THREE.CylinderGeometry(diameter, diameter, tubeLen, 16, 1, false);
      tubeGeom.translate(0, -tubeLen / 2, 0);
      const tubeMat = this.goldResonatorMaterial.clone();
      const tube = new THREE.Mesh(tubeGeom, tubeMat);
      tube.castShadow = true;
      tubeGroup.add(tube);
      this.resonatorTubes[bar.midi] = tube;

      // Flanged Bell Mouth at Top
      const bellGeom = new THREE.CylinderGeometry(diameter * 1.25, diameter, 0.015, 16);
      const bell = new THREE.Mesh(bellGeom, tubeMat);
      bell.position.y = -0.0075;
      tubeGroup.add(bell);

      // Sealed Resonance Cap at Bottom with tuning plug ring
      const capGeom = new THREE.CylinderGeometry(diameter * 1.05, diameter * 1.05, 0.008, 16);
      const cap = new THREE.Mesh(capGeom, tubeMat);
      cap.position.y = -tubeLen;
      tubeGroup.add(cap);

      resonatorsGroup.add(tubeGroup);
    });

    // Angled aluminum mounting arch rails supporting diatonic and accidental banks
    // Lower bank (natural notes): follows center line from Z = +0.178 down to Z = +0.068
    resonatorsGroup.add(this._createAngledRail(
      this.bassX + 0.06, 0.178, this.trebleX - 0.06, 0.068, -0.042, this.steelChassisMaterial, 0.012, 0.016
    ));
    // Upper bank (accidental notes): follows center line from Z = -0.158 down to Z = -0.058
    resonatorsGroup.add(this._createAngledRail(
      this.bassX + 0.06, -0.158, this.trebleX - 0.06, -0.058, -0.042, this.steelChassisMaterial, 0.012, 0.016
    ));

    this.group.add(resonatorsGroup);
  }

  _buildTunedBarsAndSuspension() {
    // Standard 3-Octave Concert Xylophone starting on C4 (MIDI 60 to 96) - 37 notes
    // Iconic 2 and 3 piano grouping: [2] -> [3] -> [2] -> [3] -> [2] -> [3]
    const startMidi = 60;
    const endMidi = 96;

    // 1. Separate into White (Diatonic) and Black (Accidental) notes
    const whiteNotes = [];
    const blackNotes = [];
    for (let m = startMidi; m <= endMidi; m++) {
      const isBlack = [1, 3, 6, 8, 10].includes(m % 12);
      if (isBlack) blackNotes.push(m);
      else whiteNotes.push(m);
    }

    // 2. Position all 22 White Keys continuously along X with gentle taper
    const whiteCount = whiteNotes.length;
    const whiteStartX = this.bassX + 0.08;
    const whiteEndX = this.trebleX - 0.08;
    const whitePositions = {};

    whiteNotes.forEach((midi, idx) => {
      const x = THREE.MathUtils.lerp(whiteStartX, whiteEndX, idx / (whiteCount - 1));
      whitePositions[midi] = x;
    });

    // 3. Position each Black Key exactly at the midpoint of its adjacent white keys!
    // Starting from C4, this creates the classic piano groupings:
    // [C#4, D#4] (2) -> GAP -> [F#4, G#4, A#4] (3) -> GAP -> [C#5, D#5] (2) ...
    const blackPositions = {};
    blackNotes.forEach(midi => {
      const prevX = whitePositions[midi - 1];
      const nextX = whitePositions[midi + 1];
      if (prevX !== undefined && nextX !== undefined) {
        blackPositions[midi] = (prevX + nextX) / 2;
      } else if (prevX !== undefined) {
        blackPositions[midi] = prevX + 0.045;
      } else {
        blackPositions[midi] = nextX - 0.045;
      }
    });

    const cordPointsLowerFront = [];
    const cordPointsLowerBack = [];

    // 4. Build all 37 Bars with tapered trapezoidal layout matching real concert instruments
    // Centerline is at Z = 0 with a 24mm ergonomic overlap between natural and accidental tiers.
    // Both tiers taper outwards from the center: long bars at bass, shorter bars at treble.
    for (let midi = startMidi; midi <= endMidi; midi++) {
      const isBlack = [1, 3, 6, 8, 10].includes(midi % 12);
      const noteProgress = (midi - startMidi) / (endMidi - startMidi);

      let barLen, barWidth, xPos, zPos, yPos;
      if (!isBlack) {
        // Natural keys: inner end at Z = -0.012, extending forward toward player (+Z)
        barLen = THREE.MathUtils.lerp(0.38, 0.16, noteProgress);
        barWidth = THREE.MathUtils.lerp(0.046, 0.030, noteProgress);
        xPos = whitePositions[midi];
        zPos = -0.012 + (barLen / 2);
        yPos = 0.010;
      } else {
        // Accidental keys: inner end at Z = +0.012, extending backward away from player (-Z)
        barLen = THREE.MathUtils.lerp(0.34, 0.14, noteProgress);
        barWidth = THREE.MathUtils.lerp(0.042, 0.028, noteProgress);
        xPos = blackPositions[midi];
        zPos = 0.012 - (barLen / 2);
        yPos = 0.038; // Upper tier elevated above white keys
      }

      const barHeight = 0.018;
      const barGroup = new THREE.Group();
      barGroup.position.set(xPos, yPos, zPos);

      // Main Top Bar with chamfered look
      const barGeom = new THREE.BoxGeometry(barWidth, barHeight, barLen);
      const barMat = this.rosewoodMaterial.clone();
      const barMesh = new THREE.Mesh(barGeom, barMat);
      barMesh.castShadow = true;
      barMesh.receiveShadow = true;
      barGroup.add(barMesh);

      // Underside Acoustic Tuning Arch (carved undercut)
      const archGeom = new THREE.BoxGeometry(barWidth * 0.92, barHeight * 0.35, barLen * 0.55);
      const archMat = new THREE.MeshStandardMaterial({ color: 0x220c06, roughness: 0.65 });
      const archMesh = new THREE.Mesh(archGeom, archMat);
      archMesh.position.y = -barHeight * 0.35;
      barGroup.add(archMesh);

      // Nodal holes (22.4% from each end)
      const nodeOffsetZ = barLen * 0.276;
      [-nodeOffsetZ, nodeOffsetZ].forEach(nz => {
        const holeGeom = new THREE.CylinderGeometry(0.0028, 0.0028, barHeight + 0.004, 8);
        holeGeom.rotateX(Math.PI / 2);
        const holeMat = new THREE.MeshStandardMaterial({ color: 0x140603 });
        const hole = new THREE.Mesh(holeGeom, holeMat);
        hole.position.set(0, 0, nz);
        barGroup.add(hole);
      });

      // Guide Posts (Vertical isolator pins with neoprene sleeves) on each side
      [-barWidth * 0.58, barWidth * 0.58].forEach(px => {
        [-nodeOffsetZ, nodeOffsetZ].forEach(pz => {
          const postGeom = new THREE.CylinderGeometry(0.0022, 0.0022, 0.032, 8);
          const post = new THREE.Mesh(postGeom, this.postRubberMaterial);
          post.position.set(px, -0.006, pz);
          barGroup.add(post);
        });
      });

      this.group.add(barGroup);

      if (!isBlack) {
        cordPointsLowerBack.push(new THREE.Vector3(xPos, yPos, zPos - nodeOffsetZ));
        cordPointsLowerFront.push(new THREE.Vector3(xPos, yPos, zPos + nodeOffsetZ));
      }

      this.bars[midi] = {
        group: barGroup,
        mesh: barMesh,
        material: barMat,
        x: xPos,
        y: yPos,
        z: zPos,
        baseY: yPos,
        isBlack,
        midi
      };
    }

    // 5. Spacer posts in accidental gaps (between E and F, B and C) to support the rails/cords
    // In range 60-96: gaps are at 64-65 (E4-F4), 71-72 (B4-C5), 76-77 (E5-F5), 83-84 (B5-C6), 88-89 (E6-F6), 95-96 (B6-C7)
    [64, 71, 76, 83, 88, 95].forEach(gapMidi => {
      const pX = whitePositions[gapMidi];
      const nX = whitePositions[gapMidi + 1];
      if (pX !== undefined && nX !== undefined) {
        const xGap = (pX + nX) / 2;
        const frac = (gapMidi - startMidi) / (endMidi - startMidi);
        const pzOuter = THREE.MathUtils.lerp(-0.265, -0.095, frac);
        const pzInner = THREE.MathUtils.lerp(-0.065, -0.020, frac);
        [pzOuter, pzInner].forEach(pz => {
          const postGeom = new THREE.CylinderGeometry(0.003, 0.003, 0.036, 8);
          const post = new THREE.Mesh(postGeom, this.postRubberMaterial);
          post.position.set(xGap, 0.018, pz);
          this.group.add(post);
        });
      }
    });

    // 6. Braided Acoustic Suspension Cords
    // Lower tier continuous cords
    [cordPointsLowerFront, cordPointsLowerBack].forEach(pts => {
      if (pts.length < 2) return;
      const curve = new THREE.CatmullRomCurve3(pts);
      const cordGeom = new THREE.TubeGeometry(curve, pts.length * 4, 0.0022, 6, false);
      const cordMesh = new THREE.Mesh(cordGeom, this.cordMaterial);
      this.group.add(cordMesh);
    });

    // Upper accidental tier suspension cords through each [2] and [3] cluster:
    // [2] -> [3] -> [2] -> [3] -> [2] -> [3]
    const blackGroups = [
      [61, 63],         // 2 (C#4, D#4)
      [66, 68, 70],     // 3 (F#4, G#4, A#4)
      [73, 75],         // 2 (C#5, D#5)
      [78, 80, 82],     // 3 (F#5, G#5, A#5)
      [85, 87],         // 2 (C#6, D#6)
      [90, 92, 94]      // 3 (F#6, G#6, A#6)
    ];

    blackGroups.forEach(grp => {
      const frontPts = [];
      const backPts = [];
      grp.forEach(midi => {
        const bar = this.bars[midi];
        if (bar) {
          const noteProgress = (midi - startMidi) / (endMidi - startMidi);
          const barLen = THREE.MathUtils.lerp(0.34, 0.14, noteProgress);
          const nodeOffsetZ = barLen * 0.276;
          backPts.push(new THREE.Vector3(bar.x, bar.y, bar.z - nodeOffsetZ));
          frontPts.push(new THREE.Vector3(bar.x, bar.y, bar.z + nodeOffsetZ));
        }
      });
      [frontPts, backPts].forEach(pts => {
        if (pts.length < 2) return;
        const curve = new THREE.CatmullRomCurve3(pts);
        const cordGeom = new THREE.TubeGeometry(curve, pts.length * 4, 0.0022, 6, false);
        const cordMesh = new THREE.Mesh(cordGeom, this.cordMaterial);
        this.group.add(cordMesh);
      });
    });
  }

  _buildConcertMallets() {
    this.shaftLength = 0.38;
    this.malletPool = [];

    // Pre-instantiate a concert mallet pool (6 mallets to effortlessly handle chords of any polyphony)
    const poolSize = 6;
    for (let i = 0; i < poolSize; i++) {
      const mallet = this._createMalletInstance(i);
      this.malletPool.push(mallet);
      this.group.add(mallet.pivot);
    }
  }

  get mallets() {
    return {
      left: this.malletPool[0]?.pivot || null,
      right: this.malletPool[1]?.pivot || null
    };
  }

  _createMalletInstance(id) {
    const pivot = new THREE.Group();
    // Initially HIDDEN like DrumKit3D and MIDIsJam (appears dynamically when notes are played)
    pivot.visible = false;

    // Slender Tapered Rattan Shaft (38cm long, pointing forward along -Z towards the bars)
    const shaftGeom = new THREE.CylinderGeometry(0.0035, 0.0055, this.shaftLength, 12);
    shaftGeom.rotateX(Math.PI / 2);
    const shaft = new THREE.Mesh(shaftGeom, this.rattanMaterial);
    shaft.position.z = -this.shaftLength / 2;
    shaft.castShadow = true;
    pivot.add(shaft);

    // Black Handle Grip Wrap (around player's hand at z = 0 to z = -0.10)
    const gripGeom = new THREE.CylinderGeometry(0.0062, 0.0062, 0.11, 12);
    gripGeom.rotateX(Math.PI / 2);
    const grip = new THREE.Mesh(gripGeom, this.malletGripMaterial);
    grip.position.z = -0.045;
    pivot.add(grip);

    // Polished Brass Butt Cap
    const buttGeom = new THREE.CylinderGeometry(0.0068, 0.0068, 0.012, 12);
    buttGeom.rotateX(Math.PI / 2);
    const butt = new THREE.Mesh(buttGeom, this.chromeMaterial);
    butt.position.z = 0.006;
    pivot.add(butt);

    // Concert Yarn-Wound Head Assembly (at striking tip z = -shaftLength)
    const headGroup = new THREE.Group();
    headGroup.position.z = -this.shaftLength;

    // Wool Yarn Spherical Head (Royal Sapphire)
    const headGeom = new THREE.SphereGeometry(0.019, 16, 16);
    headGeom.scale(1.0, 0.92, 1.0);
    const head = new THREE.Mesh(headGeom, this.yarnHeadMaterial);
    head.castShadow = true;
    headGroup.add(head);

    // Gold Equatorial Accent Band
    const bandGeom = new THREE.TorusGeometry(0.0192, 0.0016, 8, 24);
    const band = new THREE.Mesh(bandGeom, this.yarnGoldAccentMaterial);
    headGroup.add(band);

    pivot.add(headGroup);

    return {
      id,
      pivot,
      headGroup,
      isBusy: false,
      currentMidi: null,
      idleTimeout: null,
      lastUsed: 0
    };
  }

  _acquireMallet(targetMidi) {
    const now = performance.now();

    // 1. If a mallet already hovers near targetMidi (within 4 semitones) and is not busy mid-strike, reuse it
    let candidate = null;
    let bestDist = Infinity;
    for (const m of this.malletPool) {
      if (!m.isBusy && m.pivot.visible && m.currentMidi !== null) {
        const dist = Math.abs(m.currentMidi - targetMidi);
        if (dist <= 4 && dist < bestDist) {
          bestDist = dist;
          candidate = m;
        }
      }
    }
    if (candidate) {
      candidate.lastUsed = now;
      return candidate;
    }

    // 2. Find any idle, non-busy mallet from the pool
    for (const m of this.malletPool) {
      if (!m.isBusy) {
        m.lastUsed = now;
        return m;
      }
    }

    // 3. Dynamic expansion: if chords or fast polyphony exceed existing pool, instantiate a new mallet
    const newMallet = this._createMalletInstance(this.malletPool.length);
    newMallet.lastUsed = now;
    this.malletPool.push(newMallet);
    this.group.add(newMallet.pivot);
    return newMallet;
  }

  /**
   * Prepares the mallet with an anticipation backswing before the MIDI note impact,
   * matching midis2jam2 / DrumKit3D anticipation curve.
   */
  onNotePrepare(midiPitch, velocity = 0.8, duration = 0.5, eventTime = null, trackIndex = null) {
    const clampedMidi = Math.max(60, Math.min(96, midiPitch));
    const bar = this.bars[clampedMidi];
    if (!bar) return;

    const vel = Math.max(0.35, Math.min(1.0, velocity));
    const mallet = this._acquireMallet(clampedMidi);
    if (!mallet) return;

    if (mallet.idleTimeout) {
      clearTimeout(mallet.idleTimeout);
      mallet.idleTimeout = null;
    }

    this.preparedStrikes.set(clampedMidi, mallet);

    const L = this.shaftLength;
    const handSign = (clampedMidi < 78) ? 1 : -1;

    // Anticipation wind-up pose: lifted high ready to plunge down onto bar
    const prepAngleX = -0.06 + 0.11 * vel;
    const prepAngleY = handSign * 0.08;

    const prepHeadY = bar.y + 0.085 + (0.04 * vel);
    const prepHeadZ = bar.z + 0.015;

    const prepWristX = bar.x + (handSign * 0.035);
    const prepWristY = prepHeadY - (L * Math.sin(prepAngleX));
    const prepWristZ = prepHeadZ + (L * Math.cos(prepAngleX));

    mallet.pivot.visible = true;
    gsap.killTweensOf(mallet.pivot.position);
    gsap.killTweensOf(mallet.pivot.rotation);

    if (!mallet.currentMidi || !mallet.pivot.visible) {
      // Just appeared: place initially near prep stance
      mallet.pivot.position.set(prepWristX, prepWristY + 0.03, prepWristZ);
      mallet.pivot.rotation.set(prepAngleX + 0.08, prepAngleY, 0);
    }

    gsap.to(mallet.pivot.position, {
      x: prepWristX,
      y: prepWristY,
      z: prepWristZ,
      duration: 0.14,
      ease: 'power2.out'
    });
    gsap.to(mallet.pivot.rotation, {
      x: prepAngleX,
      y: prepAngleY,
      duration: 0.14,
      ease: 'power2.out'
    });
  }

  /**
   * Note-On Event Trigger:
   * 1. Multi-mallet support: plays chords simultaneously with multiple distinct mallets.
   * 2. Visible on hit, elastic rebound, hovering ready posture.
   * 3. Idle timeout: disappears after 1.4s of silence, exactly like MIDIsJam and DrumKit3D.
   */
  onNoteOn(midiPitch, velocity = 0.8, eventTime = null, trackIndex = null) {
    const vel = Math.max(0.3, Math.min(1.0, velocity));
    const clampedMidi = Math.max(60, Math.min(96, midiPitch));
    const bar = this.bars[clampedMidi] || Object.values(this.bars)[0];
    if (!bar) return;

    // Check if we prepared a mallet for this note; otherwise acquire an available mallet
    let mallet = this.preparedStrikes.get(clampedMidi);
    if (mallet) {
      this.preparedStrikes.delete(clampedMidi);
    } else {
      mallet = this._acquireMallet(clampedMidi);
    }
    if (!mallet) return;

    if (mallet.idleTimeout) {
      clearTimeout(mallet.idleTimeout);
      mallet.idleTimeout = null;
    }

    mallet.isBusy = true;
    mallet.currentMidi = clampedMidi;
    mallet.pivot.visible = true;

    gsap.killTweensOf(mallet.pivot.position);
    gsap.killTweensOf(mallet.pivot.rotation);

    const L = this.shaftLength;
    const handSign = (clampedMidi < 78) ? 1 : -1;

    // Impact kinematics: head lands dead-center on top surface of rosewood bar
    const strikeAngleX = -0.22 - (0.07 * vel);
    const strikeAngleY = handSign * 0.09;

    const hitHeadY = bar.y + 0.024;
    const hitHeadZ = bar.z;

    const targetWristX = bar.x;
    const targetWristY = hitHeadY - (L * Math.sin(strikeAngleX));
    const targetWristZ = hitHeadZ + (L * Math.cos(strikeAngleX));

    // Post-impact ready hover pose: floating gracefully over the struck key
    const hoverAngleX = -0.15;
    const hoverAngleY = handSign * 0.06;
    const hoverHeadY = bar.y + 0.052;
    const hoverHeadZ = bar.z + 0.010;
    const hoverWristX = bar.x + (handSign * 0.02);
    const hoverWristY = hoverHeadY - (L * Math.sin(hoverAngleX));
    const hoverWristZ = hoverHeadZ + (L * Math.cos(hoverAngleX));

    const strikeTl = gsap.timeline({
      onComplete: () => {
        mallet.isBusy = false;
        // Schedule idle retreat: if no hit within 1.4s, gracefully retreat and hide
        mallet.idleTimeout = setTimeout(() => {
          if (!mallet.pivot.visible) return;
          gsap.timeline({
            onComplete: () => {
              mallet.pivot.visible = false;
              mallet.currentMidi = null;
            }
          })
          .to(mallet.pivot.position, {
            y: mallet.pivot.position.y - 0.08,
            z: mallet.pivot.position.z + 0.06,
            duration: 0.35,
            ease: 'power2.inOut'
          })
          .to(mallet.pivot.rotation, {
            x: -0.35,
            duration: 0.35,
            ease: 'power2.inOut'
          }, 0);
        }, 1400);
      }
    });

    // Step 1: Snappy accelerating downstroke into contact
    strikeTl.to(mallet.pivot.position, {
      x: targetWristX,
      y: targetWristY,
      z: targetWristZ,
      duration: 0.038,
      ease: 'power3.in'
    })
    .to(mallet.pivot.rotation, {
      x: strikeAngleX,
      y: strikeAngleY,
      duration: 0.038,
      ease: 'power3.in'
    }, 0)

    // Step 2: Elastic bounce (rebound off rosewood bar)
    .to(mallet.pivot.position, {
      y: targetWristY + 0.085 * vel,
      duration: 0.065,
      ease: 'power2.out'
    })
    .to(mallet.pivot.rotation, {
      x: strikeAngleX + 0.16 * vel,
      duration: 0.065,
      ease: 'power2.out'
    }, '<')

    // Step 3: Settle smoothly into hovering ready stance
    .to(mallet.pivot.position, {
      x: hoverWristX,
      y: hoverWristY,
      z: hoverWristZ,
      duration: 0.15,
      ease: 'power2.out'
    })
    .to(mallet.pivot.rotation, {
      x: hoverAngleX,
      y: hoverAngleY,
      duration: 0.15,
      ease: 'power2.out'
    }, '<');

    // Physical Acoustic Bar Vibration & Resonant Energy Flash
    gsap.killTweensOf(bar.group.position);
    gsap.timeline()
      .to(bar.group.position, { y: bar.baseY - (0.009 * vel), duration: 0.03, ease: 'power2.out' })
      .to(bar.group.position, { y: bar.baseY + (0.004 * vel), duration: 0.045, ease: 'sine.inOut' })
      .to(bar.group.position, { y: bar.baseY, duration: 0.08, ease: 'sine.out' });

    // Warm Honduran Rosewood Acoustic Bloom
    bar.material.emissive.setHex(0xffaa44);
    bar.material.emissiveIntensity = 2.8 * vel;
    gsap.killTweensOf(bar.material);
    gsap.to(bar.material, {
      emissiveIntensity: 0.15,
      duration: 0.45,
      ease: 'power2.out',
      onComplete: () => {
        bar.material.emissive.setHex(0x120402);
      }
    });

    // Resonator Acoustic Flash
    const tubeMesh = this.resonatorTubes[clampedMidi];
    if (tubeMesh && tubeMesh.material) {
      tubeMesh.material.emissive.setHex(0xffd700);
      tubeMesh.material.emissiveIntensity = 1.6 * vel;
      gsap.killTweensOf(tubeMesh.material);
      gsap.to(tubeMesh.material, {
        emissiveIntensity: 0.0,
        duration: 0.4,
        ease: 'power2.out'
      });
    }
  }

  onNoteOff(midiPitch) {}

  update(delta) {
    // Subtle organic floating posture for actively hovering mallets
    const time = performance.now() * 0.003;
    this.malletPool.forEach((m, idx) => {
      if (m.pivot.visible && !m.isBusy && !gsap.isTweening(m.pivot.position)) {
        m.pivot.position.y += Math.sin(time + idx * 1.5) * 0.0004;
      }
    });
  }
}
