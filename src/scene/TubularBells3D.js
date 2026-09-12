import * as THREE from 'three';
import gsap from 'gsap';

/**
 * TubularBells3D: Professional Concert Orchestral Tubular Bells / Chimes (Campanas Tubulares)
 * 
 * - Standard 1.5 Octave Symphonic Chime Rack: C4 to F5 (18 tuned brass tubes, MIDI 60 - 77).
 * - Physical Construction:
 *   - Stately matte black powder-coated steel concert frame with dual uprights, floor sleds,
 *     stabilizer crossbars, diagonal gussets, and 4 heavy-duty locking casters.
 *   - Heavy upper hanger beam with chrome suspension pegs and wire guides.
 *   - 18 graduated high-resonance orchestral brass tubes (natural keys front row, chromatic accidentals raised rear row).
 *   - Solid nickel/steel top strike caps with bevelled edges on every tube.
 *   - Braided steel suspension cables passing through drilled acoustic nodal holes.
 *   - Felt-lined mechanical damper bar at mid-height with vertical linkage rod and cast foot pedal.
 *   - Dual concert chime hammers (turned hardwood handles with rawhide/polyurethane cylindrical heads).
 *   - Realistic pendulum recoil sway and resonant metallic bloom upon impact.
 *   - Dynamic note preparation, whip downstroke, elastic bounce, and CC64 damper pedal support.
 */
export class TubularBells3D {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();

    // Default stage placement: Floor elevation y = 0.0
    this.group.position.set(2.85, 0.0, 1.45);
    this.group.rotation.set(0, -Math.PI * 0.12, 0);

    this.tubes = {};          // Map: midiPitch -> tube data object
    this.malletPool = [];     // 2 chime hammers for polyphony & alternating strikes
    this.preparedStrikes = new Map();
    this.isSustained = false;
    this.activeNoteCount = 0;

    // Dimensions
    this.frameWidth = 1.24;
    this.frameHeight = 1.94;
    this.frameDepth = 0.58;

    this._buildMaterials();
    this._buildConcertFrame();
    this._buildDamperSystem();
    this._buildTubes();
    this._buildChimeHammers();

    this.scene.add(this.group);
  }

  /* ------------------------------------------------------------------ */
  /*  MATERIALS                                                         */
  /* ------------------------------------------------------------------ */

  _buildMaterials() {
    // 1. High-Lustre Symphonic Brass Chime Tubes
    this.brassMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xdfb443,
      emissive: 0x221703,
      emissiveIntensity: 0.15,
      roughness: 0.19,
      metalness: 0.88,
      clearcoat: 0.75,
      clearcoatRoughness: 0.15,
      reflectivity: 0.85
    });

    // 2. Heavy-Duty Matte Black Powder-Coated Concert Frame
    this.frameSteelMaterial = new THREE.MeshStandardMaterial({
      color: 0x18181c,
      roughness: 0.42,
      metalness: 0.82
    });

    // 3. Mirror Chrome Hardware (Suspension pins, linkage rods, pedal, caster forks)
    this.chromeMaterial = new THREE.MeshStandardMaterial({
      color: 0xf5f7fb,
      roughness: 0.12,
      metalness: 0.95
    });

    // 4. Solid Steel Strike Caps on Tube Tops
    this.steelCapMaterial = new THREE.MeshStandardMaterial({
      color: 0xc8cdd5,
      roughness: 0.22,
      metalness: 0.92
    });

    // 5. Braided Stainless Steel Suspension Cable
    this.cableMaterial = new THREE.MeshStandardMaterial({
      color: 0x9fa4ab,
      roughness: 0.5,
      metalness: 0.7
    });

    // 6. Thick Acoustic Wool Felt for Damper Bar (Dark Charcoal / Burgundy)
    this.feltMaterial = new THREE.MeshStandardMaterial({
      color: 0x3d1418,
      roughness: 0.92,
      metalness: 0.04
    });

    // 7. Natural Beech Wood for Kolberg Damper Panel (Light Scandinavian Beech)
    this.beechWoodMaterial = new THREE.MeshStandardMaterial({
      color: 0xd4b278,
      roughness: 0.45,
      metalness: 0.06
    });

    // 8. Dark Kolberg Emblem Badge
    this.badgeMaterial = new THREE.MeshStandardMaterial({
      color: 0x18181c,
      roughness: 0.45,
      metalness: 0.4
    });

    // 9. Hollow Tube Inner Bore (dark acoustic depth)
    this.innerBoreMaterial = new THREE.MeshStandardMaterial({
      color: 0x3e3212,
      roughness: 0.65,
      metalness: 0.75,
      side: THREE.BackSide
    });

    // 10. Turned Hardwood Mallet Handles (Select Hickory / Maple)
    this.woodHandleMaterial = new THREE.MeshStandardMaterial({
      color: 0xcead7a,
      roughness: 0.38,
      metalness: 0.05
    });

    // 11. Chime Mallet Head (Dense Rawhide / Ivory Polyurethane with Brass Endcaps)
    this.malletHeadMaterial = new THREE.MeshStandardMaterial({
      color: 0xe8e2d4,
      roughness: 0.35,
      metalness: 0.12
    });

    // 12. Black Rubber Grips & Casters
    this.rubberMaterial = new THREE.MeshStandardMaterial({
      color: 0x121214,
      roughness: 0.88,
      metalness: 0.08
    });
  }

  /* ------------------------------------------------------------------ */
  /*  FRAME & CASTERS (KOLBERG OPEN SUSPENSION DESIGN)                  */
  /* ------------------------------------------------------------------ */

  _buildConcertFrame() {
    const frame = new THREE.Group();
    const halfW = this.frameWidth * 0.5;

    // Upright Vertical Columns (Left & Right rectangular steel tubing)
    const uprightGeom = new THREE.BoxGeometry(0.042, this.frameHeight, 0.042);
    const leftUpright = new THREE.Mesh(uprightGeom, this.frameSteelMaterial);
    leftUpright.position.set(-halfW, this.frameHeight * 0.5, 0);
    leftUpright.castShadow = true;
    frame.add(leftUpright);

    const rightUpright = new THREE.Mesh(uprightGeom, this.frameSteelMaterial);
    rightUpright.position.set(halfW, this.frameHeight * 0.5, 0);
    rightUpright.castShadow = true;
    frame.add(rightUpright);

    // Upright Chrome Top Finial Caps
    const finialGeom = new THREE.SphereGeometry(0.028, 16, 16);
    const leftFinial = new THREE.Mesh(finialGeom, this.chromeMaterial);
    leftFinial.position.set(-halfW, this.frameHeight + 0.015, 0);
    frame.add(leftFinial);

    const rightFinial = new THREE.Mesh(finialGeom, this.chromeMaterial);
    rightFinial.position.set(halfW, this.frameHeight + 0.015, 0);
    frame.add(rightFinial);

    // Floor Base Sleds (Left & Right running along Z with triangular gussets)
    const sledGeom = new THREE.BoxGeometry(0.048, 0.045, this.frameDepth);
    const leftSled = new THREE.Mesh(sledGeom, this.frameSteelMaterial);
    leftSled.position.set(-halfW, 0.065, 0);
    leftSled.castShadow = true;
    frame.add(leftSled);

    const rightSled = new THREE.Mesh(sledGeom, this.frameSteelMaterial);
    rightSled.position.set(halfW, 0.065, 0);
    rightSled.castShadow = true;
    frame.add(rightSled);

    // Triangular Gussets at Base Corners
    const gussetGeom = new THREE.BoxGeometry(0.018, 0.18, 0.18);
    const leftGusset = new THREE.Mesh(gussetGeom, this.frameSteelMaterial);
    leftGusset.rotation.x = Math.PI * 0.25;
    leftGusset.position.set(-halfW, 0.13, -0.06);
    frame.add(leftGusset);

    const rightGusset = new THREE.Mesh(gussetGeom, this.frameSteelMaterial);
    rightGusset.rotation.x = Math.PI * 0.25;
    rightGusset.position.set(halfW, 0.13, -0.06);
    frame.add(rightGusset);

    // Lower Structural Crossbar
    const lowerCrossGeom = new THREE.CylinderGeometry(0.016, 0.016, this.frameWidth, 14);
    const lowerCross = new THREE.Mesh(lowerCrossGeom, this.frameSteelMaterial);
    lowerCross.rotation.z = Math.PI * 0.5;
    lowerCross.position.set(0, 0.10, -0.02);
    frame.add(lowerCross);

    // Mid-Height Rear Stabilizer Crossbar
    const midCross = new THREE.Mesh(lowerCrossGeom, this.frameSteelMaterial);
    midCross.rotation.z = Math.PI * 0.5;
    midCross.position.set(0, 0.72, -0.06);
    frame.add(midCross);

    // ------------------------------------------------------------------
    // OPEN SUSPENSION RACK (BEHIND THE TUBES - NO COVERING ROOF/BEAM)
    // ------------------------------------------------------------------
    // 1. Rear Upper Suspension Rail (for chromatic accidental tubes)
    const upperRailGeom = new THREE.BoxGeometry(this.frameWidth - 0.04, 0.028, 0.028);
    const upperRail = new THREE.Mesh(upperRailGeom, this.frameSteelMaterial);
    upperRail.position.set(0, 1.84, -0.065);
    upperRail.castShadow = true;
    frame.add(upperRail);

    // Cantilever brackets connecting upper rail to side uprights
    const upperBracketGeom = new THREE.BoxGeometry(0.036, 0.028, 0.075);
    [-halfW + 0.018, halfW - 0.018].forEach(bx => {
      const bMesh = new THREE.Mesh(upperBracketGeom, this.frameSteelMaterial);
      bMesh.position.set(bx, 1.84, -0.032);
      frame.add(bMesh);
    });

    // 2. Front Lower Suspension Rail (for diatonic natural tubes)
    const lowerRailGeom = new THREE.BoxGeometry(this.frameWidth - 0.04, 0.028, 0.028);
    const lowerRail = new THREE.Mesh(lowerRailGeom, this.frameSteelMaterial);
    lowerRail.position.set(0, 1.70, 0.015);
    lowerRail.castShadow = true;
    frame.add(lowerRail);

    // Forward cantilever brackets connecting lower rail to side uprights
    const lowerBracketGeom = new THREE.BoxGeometry(0.036, 0.028, 0.045);
    [-halfW + 0.018, halfW - 0.018].forEach(bx => {
      const bMesh = new THREE.Mesh(lowerBracketGeom, this.frameSteelMaterial);
      bMesh.position.set(bx, 1.70, 0.008);
      frame.add(bMesh);
    });

    // Four Swivel Locking Casters (wheels flush with floor y = 0.0)
    const casterPositions = [
      [-halfW, 0.032, -this.frameDepth * 0.42],
      [-halfW, 0.032,  this.frameDepth * 0.42],
      [ halfW, 0.032, -this.frameDepth * 0.42],
      [ halfW, 0.032,  this.frameDepth * 0.42]
    ];
    const wheelGeom = new THREE.CylinderGeometry(0.032, 0.032, 0.024, 16);
    const forkGeom = new THREE.BoxGeometry(0.032, 0.038, 0.032);

    casterPositions.forEach(([cx, cy, cz]) => {
      const casterGroup = new THREE.Group();
      casterGroup.position.set(cx, cy, cz);

      const fork = new THREE.Mesh(forkGeom, this.chromeMaterial);
      fork.position.set(0, 0.012, 0);
      casterGroup.add(fork);

      const wheel = new THREE.Mesh(wheelGeom, this.rubberMaterial);
      wheel.rotation.z = Math.PI * 0.5;
      wheel.position.set(0, -0.002, 0);
      casterGroup.add(wheel);

      frame.add(casterGroup);
    });

    this.group.add(frame);
  }

  /* ------------------------------------------------------------------ */
  /*  KOLBERG TAPERED BEECHWOOD DAMPER BOX & PEDAL FRAME                */
  /* ------------------------------------------------------------------ */

  _buildDamperSystem() {
    // 1. Static Wooden Damper Housing (Firmly fixed to frame uprights - NEVER moves)
    this.damperHousing = new THREE.Group();
    this.damperHousing.position.set(0, 1.10, 0.0);

    // Tapered blonde beechwood front fascia panel (taller on bass, narrower on treble)
    const shape = new THREE.Shape();
    const panelHalfW = 0.58;
    shape.moveTo(-panelHalfW, 0.12);  // top left
    shape.lineTo(panelHalfW, 0.12);   // top right
    shape.lineTo(panelHalfW, -0.04);  // bottom right (narrower, following short treble tubes)
    shape.lineTo(-panelHalfW, -0.15); // bottom left (taller, following long bass tubes)
    shape.closePath();

    const extrudeSettings = { depth: 0.020, bevelEnabled: true, bevelSegments: 2, steps: 1, bevelSize: 0.003, bevelThickness: 0.003 };
    const fasciaGeom = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    fasciaGeom.center();
    const fasciaMesh = new THREE.Mesh(fasciaGeom, this.beechWoodMaterial);
    fasciaMesh.position.set(0, 0, 0.075); // Permanently in front of natural tubes (tubes front edge is at 0.059)
    fasciaMesh.castShadow = true;
    this.damperHousing.add(fasciaMesh);

    // Kolberg Dark Emblem Badge on Center of Wooden Panel
    const badgeGeom = new THREE.BoxGeometry(0.13, 0.028, 0.004);
    const badge = new THREE.Mesh(badgeGeom, this.badgeMaterial);
    badge.position.set(0, 0.01, 0.088);
    this.damperHousing.add(badge);

    // Top Wooden Cover Shelf of Damper Box (connecting front and rear)
    const topPlankGeom = new THREE.BoxGeometry(panelHalfW * 2, 0.016, 0.17);
    const topPlank = new THREE.Mesh(topPlankGeom, this.beechWoodMaterial);
    topPlank.position.set(0, 0.12, 0.0);
    topPlank.castShadow = true;
    this.damperHousing.add(topPlank);

    // Rear Wooden Fascia Panel (enclosing rear accidental tubes)
    const rearGeom = new THREE.BoxGeometry(panelHalfW * 2, 0.20, 0.018);
    const rearMesh = new THREE.Mesh(rearGeom, this.beechWoodMaterial);
    rearMesh.position.set(0, 0.02, -0.075);
    this.damperHousing.add(rearMesh);

    // Left & Right wooden side endcaps
    const sideGeom = new THREE.BoxGeometry(0.018, 0.22, 0.17);
    [-panelHalfW + 0.009, panelHalfW - 0.009].forEach(sx => {
      const sideCap = new THREE.Mesh(sideGeom, this.beechWoodMaterial);
      sideCap.position.set(sx, 0.01, 0.0);
      this.damperHousing.add(sideCap);
    });

    // Internal Steel Support Beam
    const innerBeamGeom = new THREE.BoxGeometry(panelHalfW * 2, 0.036, 0.08);
    const innerBeam = new THREE.Mesh(innerBeamGeom, this.frameSteelMaterial);
    innerBeam.position.set(0, 0, 0.0);
    this.damperHousing.add(innerBeam);

    this.group.add(this.damperHousing);

    // 2. Moving Internal Damper Felt Assembly (inside the box, releases tubes without moving the wooden box)
    this.internalDamperGroup = new THREE.Group();
    this.internalDamperGroup.position.set(0, 1.10, 0.0);

    const feltGeom = new THREE.BoxGeometry(panelHalfW * 2 - 0.04, 0.030, 0.016);
    const feltFront = new THREE.Mesh(feltGeom, this.feltMaterial);
    feltFront.position.set(0, 0, 0.013); // Rests against back edge of natural tubes
    this.internalDamperGroup.add(feltFront);

    const feltRear = new THREE.Mesh(feltGeom, this.feltMaterial);
    feltRear.position.set(0, 0, -0.013); // Rests against front edge of accidental tubes
    this.internalDamperGroup.add(feltRear);

    this.group.add(this.internalDamperGroup);

    // Dual Vertical Steel Damper Pull Cables (running down to foot pedal)
    this.linkageCables = new THREE.Group();
    const cableGeom = new THREE.CylinderGeometry(0.0025, 0.0025, 0.98, 8);

    [-0.24, 0.24].forEach(cx => {
      const cableMesh = new THREE.Mesh(cableGeom, this.cableMaterial);
      cableMesh.position.set(cx, 0.54, 0.02);
      this.linkageCables.add(cableMesh);

      // Bottom chrome tension spring / turnbuckle
      const springGeom = new THREE.CylinderGeometry(0.008, 0.008, 0.08, 10);
      const springMesh = new THREE.Mesh(springGeom, this.chromeMaterial);
      springMesh.position.set(cx, 0.14, 0.02);
      this.linkageCables.add(springMesh);
    });

    this.group.add(this.linkageCables);

    // Kolberg U-Shaped Tubular Steel Foot Pedal
    this.pedalGroup = new THREE.Group();
    this.pedalGroup.position.set(0, 0.05, 0.04);
    this.pedalGroup.rotation.x = -0.10;

    const pedalWidth = 0.48;
    const pedalDepth = 0.20;
    const tubePedalGeom = new THREE.CylinderGeometry(0.011, 0.011, pedalWidth, 12);

    // Front horizontal bar (where foot steps)
    const frontBar = new THREE.Mesh(tubePedalGeom, this.frameSteelMaterial);
    frontBar.rotation.z = Math.PI * 0.5;
    frontBar.position.set(0, 0, pedalDepth);
    this.pedalGroup.add(frontBar);

    // Rubber foot tread pad
    const treadGeom = new THREE.CylinderGeometry(0.014, 0.014, 0.16, 12);
    const tread = new THREE.Mesh(treadGeom, this.rubberMaterial);
    tread.rotation.z = Math.PI * 0.5;
    tread.position.set(0, 0, pedalDepth);
    this.pedalGroup.add(tread);

    // Left & Right longitudinal side arms
    const sideArmGeom = new THREE.CylinderGeometry(0.011, 0.011, pedalDepth, 12);
    [-pedalWidth * 0.5, pedalWidth * 0.5].forEach(px => {
      const arm = new THREE.Mesh(sideArmGeom, this.frameSteelMaterial);
      arm.rotation.x = Math.PI * 0.5;
      arm.position.set(px, 0, pedalDepth * 0.5);
      this.pedalGroup.add(arm);

      // Cable attachment eyelet
      const eyeletGeom = new THREE.CylinderGeometry(0.005, 0.005, 0.025, 8);
      const eyelet = new THREE.Mesh(eyeletGeom, this.chromeMaterial);
      eyelet.position.set(px * 0.95, 0.015, pedalDepth * 0.35);
      this.pedalGroup.add(eyelet);
    });

    // Rear pivot axle
    const axleGeom = new THREE.CylinderGeometry(0.012, 0.012, pedalWidth + 0.04, 12);
    const axle = new THREE.Mesh(axleGeom, this.frameSteelMaterial);
    axle.rotation.z = Math.PI * 0.5;
    axle.position.set(0, 0, 0);
    this.pedalGroup.add(axle);

    this.group.add(this.pedalGroup);
  }

  /* ------------------------------------------------------------------ */
  /*  18 GRADUATED BRASS CHIME TUBES                                    */
  /* ------------------------------------------------------------------ */

  _buildTubes() {
    // 19 Notes: B3 (59) to F5 (77) - Standard Full Concert Chimes Range
    // Naturals: 59 (B3), 60 (C4), 62 (D4), 64 (E4), 65 (F4), 67 (G4), 69 (A4), 71 (B4), 72 (C5), 74 (D5), 76 (E5), 77 (F5) = 12 notes (Front Row)
    // Accidentals: 61 (C#4), 63 (D#4), 66 (F#4), 68 (G#4), 70 (A#4), 73 (C#5), 75 (D#5) = 7 notes (Rear Row)
    const naturalPitches = [59, 60, 62, 64, 65, 67, 69, 71, 72, 74, 76, 77];
    const accidentalPitches = [61, 63, 66, 68, 70, 73, 75];

    const noteNames = {
      59: 'B',
      60: 'C',
      61: 'C#',
      62: 'D',
      63: 'D#',
      64: 'E',
      65: 'F',
      66: 'F#',
      67: 'G',
      68: 'G#',
      69: 'A',
      70: 'A#',
      71: 'B',
      72: 'C',
      73: 'C#',
      74: 'D',
      75: 'D#',
      76: 'E',
      77: 'F'
    };

    const minPitch = 59;
    const maxPitch = 77;
    const maxLen = 1.54;   // B3 length ~1.54m (longest bass chime)
    const minLen = 0.74;   // F5 length ~0.74m
    const tubeRadius = 0.019; // 38mm outer diameter
    const wallThickness = 0.0035; // 3.5mm thick wall
    const innerRadius = tubeRadius - wallThickness;

    // Calculate natural tube X positions evenly spaced
    const naturalCount = naturalPitches.length; // 12 notes
    const naturalSpan = 1.04;
    const naturalStartX = -naturalSpan * 0.5;
    const naturalSpacing = naturalSpan / (naturalCount - 1);

    const naturalPositions = {};
    naturalPitches.forEach((pitch, i) => {
      naturalPositions[pitch] = naturalStartX + (i * naturalSpacing);
    });

    // Accidentals positioned halfway between corresponding naturals
    const accidentalPairs = {
      61: [60, 62],
      63: [62, 64],
      66: [65, 67],
      68: [67, 69],
      70: [69, 71],
      73: [72, 74],
      75: [74, 76]
    };

    // Kolberg configuration:
    // Natural tubes top rim at y = 1.76; Chromatic tubes top rim at y = 1.88
    const diatonicTopRimY = 1.76;
    const chromaticTopRimY = 1.88;

    for (let pitch = minPitch; pitch <= maxPitch; pitch++) {
      const isAccidental = accidentalPitches.includes(pitch);
      let posX = 0;
      let posZ = 0;
      let topRimY = 0;

      if (isAccidental) {
        const pair = accidentalPairs[pitch];
        posX = (naturalPositions[pair[0]] + naturalPositions[pair[1]]) * 0.5;
        posZ = -0.040; // Rear chromatic row
        topRimY = chromaticTopRimY;
      } else {
        posX = naturalPositions[pitch];
        posZ = 0.040;  // Front diatonic row
        topRimY = diatonicTopRimY;
      }

      // Length calculation based on acoustic graduation
      const t = (pitch - minPitch) / (maxPitch - minPitch);
      const tubeLength = maxLen - Math.pow(t, 0.88) * (maxLen - minLen);

      // Tube Assembly Group (origin at open top circular rim)
      const tubeGroup = new THREE.Group();
      tubeGroup.position.set(posX, topRimY, posZ);

      // Unique material instance per tube for individual resonant bloom
      const tubeMat = this.brassMaterial.clone();

      // 1. Main Hollow Cylindrical Brass Tube (openEnded: true, completely open top and bottom)
      const tubeGeom = new THREE.CylinderGeometry(tubeRadius, tubeRadius, tubeLength, 24, 1, true);
      tubeGeom.translate(0, -tubeLength * 0.5, 0);
      const tubeMesh = new THREE.Mesh(tubeGeom, tubeMat);
      tubeMesh.castShadow = true;
      tubeMesh.receiveShadow = true;
      tubeGroup.add(tubeMesh);

      // 2. Interior Bore Cylinder (dark acoustic interior depth visible into open top)
      const boreLen = Math.min(tubeLength, 0.28);
      const boreGeom = new THREE.CylinderGeometry(innerRadius, innerRadius, boreLen, 20, 1, true);
      boreGeom.translate(0, -boreLen * 0.5, 0);
      const boreMesh = new THREE.Mesh(boreGeom, this.innerBoreMaterial);
      tubeGroup.add(boreMesh);

      // 3. Open Top Annular Striking Rim (RingGeometry: open center, thick circular brass rim)
      const rimGeom = new THREE.RingGeometry(innerRadius, tubeRadius, 24);
      rimGeom.rotateX(-Math.PI * 0.5); // Flat horizontal ring facing up
      const collarMat = this.steelCapMaterial.clone();
      const rimMesh = new THREE.Mesh(rimGeom, collarMat);
      rimMesh.position.set(0, 0, 0);
      tubeGroup.add(rimMesh);

      // 4. Striking Reinforcement Collar (authentic Kolberg open sleeve on top 28mm)
      const collarHeight = 0.028;
      const collarGeom = new THREE.CylinderGeometry(tubeRadius * 1.04, tubeRadius * 1.04, collarHeight, 24, 1, true);
      collarGeom.translate(0, -collarHeight * 0.5, 0);
      const collarMesh = new THREE.Mesh(collarGeom, collarMat);
      collarMesh.castShadow = true;
      tubeGroup.add(collarMesh);

      // Collar decorative bottom groove ring
      const ringGeom = new THREE.TorusGeometry(tubeRadius * 1.025, 0.0015, 8, 24);
      ringGeom.rotateX(Math.PI * 0.5);
      ringGeom.translate(0, -collarHeight, 0);
      const ringMesh = new THREE.Mesh(ringGeom, collarMat);
      tubeGroup.add(ringMesh);

      // Engraved Note Letter Stamp on Front Face of Collar (matching orchestral chimes)
      const badge = this._createNoteBadge(noteNames[pitch] || '');
      badge.position.set(0, -collarHeight * 0.5, tubeRadius * 1.045);
      tubeGroup.add(badge);

      // 5. Nodal Suspension Cross-Pin (at acoustic nodal point y = -0.038)
      const pinGeom = new THREE.CylinderGeometry(0.002, 0.002, tubeRadius * 2.3, 10);
      pinGeom.rotateZ(Math.PI * 0.5);
      const pinMesh = new THREE.Mesh(pinGeom, this.chromeMaterial);
      pinMesh.position.set(0, -0.038, 0);
      tubeGroup.add(pinMesh);

      // 6. Braided Steel Cable Suspension Loops (hanging tube to rear suspension rail)
      const railZ = isAccidental ? -0.065 : 0.015;
      const railY = isAccidental ? 1.84 : 1.70;
      const dz = railZ - posZ;
      const dy = railY - topRimY;

      // Chrome suspension pin on the rail
      const railPegGeom = new THREE.CylinderGeometry(0.003, 0.003, 0.025, 8);
      railPegGeom.rotateX(Math.PI * 0.5);
      const railPegMesh = new THREE.Mesh(railPegGeom, this.chromeMaterial);
      railPegMesh.position.set(posX, railY, railZ + 0.012);
      this.group.add(railPegMesh);

      // Suspension cable loop connecting tube pin to rail peg
      const cableLen = Math.sqrt(dz * dz + (dy + 0.038) * (dy + 0.038));
      const cableAngleX = Math.atan2(dz, -(dy + 0.038));
      const singleCableGeom = new THREE.CylinderGeometry(0.0012, 0.0012, cableLen, 6);

      [-tubeRadius * 0.75, tubeRadius * 0.75].forEach(cx => {
        const cMesh = new THREE.Mesh(singleCableGeom, this.cableMaterial);
        cMesh.position.set(cx, -0.038 + (dy + 0.038) * 0.5, dz * 0.5);
        cMesh.rotation.x = cableAngleX;
        tubeGroup.add(cMesh);
      });

      this.group.add(tubeGroup);

      // Strike Target Coordinates in local instrument space:
      // Mallet lands right onto the open top circular rim
      const strikePoint = new THREE.Vector3(posX, topRimY, posZ);

      this.tubes[pitch] = {
        pitch,
        noteName: noteNames[pitch],
        group: tubeGroup,
        mesh: tubeMesh,
        rimMesh: rimMesh,
        collarMesh: collarMesh,
        material: tubeMat,
        length: tubeLength,
        strikePoint,
        isAccidental
      };
    }
  }

  _createNoteBadge(noteName) {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, 128, 128);

    // Engraved metallic relief font
    ctx.font = 'bold 76px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Embossed shadow
    ctx.fillStyle = 'rgba(25, 18, 5, 0.9)';
    ctx.fillText(noteName, 66, 66);

    // Golden metallic face
    ctx.fillStyle = '#ffefa6';
    ctx.fillText(noteName, 63, 63);

    const texture = new THREE.CanvasTexture(canvas);
    const badgeMat = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      depthWrite: false
    });

    const badgeGeom = new THREE.PlaneGeometry(0.022, 0.022);
    const badgeMesh = new THREE.Mesh(badgeGeom, badgeMat);
    return badgeMesh;
  }

  /* ------------------------------------------------------------------ */
  /*  CONCERT CHIME HAMMERS (MALLETS)                                   */
  /* ------------------------------------------------------------------ */

  _buildChimeHammers() {
    this.shaftLength = 0.34;
    const headRadius = 0.020;  // 40mm diameter striking head
    const headHeight = 0.052;  // 52mm tall vertical cylinder (standing upright along Y)
    const handleAngle = 0.60;  // ~34.4° downward slope towards player's hands

    for (let i = 0; i < 2; i++) {
      const malletPivot = new THREE.Group();
      malletPivot.visible = false;

      // Mallet Model Group: head centered at (0,0,0), shaft angling down and back towards player
      const modelGroup = new THREE.Group();

      // 1. Vertical Rawhide/Polyurethane Mallet Head (standing upright along Y - NOT lying flat on its side!)
      const headGeom = new THREE.CylinderGeometry(headRadius, headRadius, headHeight, 24);
      const headMesh = new THREE.Mesh(headGeom, this.malletHeadMaterial);
      headMesh.castShadow = true;
      modelGroup.add(headMesh);

      // 2. High-Impact Striking Face Pad on Bottom (lands squarely on open tube rim)
      const strikingPadGeom = new THREE.CylinderGeometry(headRadius * 0.98, headRadius * 0.98, 0.005, 24);
      strikingPadGeom.translate(0, -headHeight * 0.5 + 0.0025, 0);
      const strikingPad = new THREE.Mesh(strikingPadGeom, this.malletHeadMaterial);
      modelGroup.add(strikingPad);

      // Bottom Brass Retaining Rim Ring
      const botRingGeom = new THREE.TorusGeometry(headRadius * 0.96, 0.0018, 8, 24);
      botRingGeom.rotateX(Math.PI * 0.5);
      botRingGeom.translate(0, -headHeight * 0.5 + 0.005, 0);
      const botRing = new THREE.Mesh(botRingGeom, this.brassMaterial);
      modelGroup.add(botRing);

      // 3. Polished Brass Top Crown & Fastener Nut (visible from above)
      const topCapGeom = new THREE.CylinderGeometry(headRadius * 0.96, headRadius * 0.96, 0.006, 24);
      topCapGeom.translate(0, headHeight * 0.5 - 0.003, 0);
      const topCap = new THREE.Mesh(topCapGeom, this.brassMaterial);
      modelGroup.add(topCap);

      const nutGeom = new THREE.CylinderGeometry(0.006, 0.006, 0.008, 12);
      nutGeom.translate(0, headHeight * 0.5 + 0.004, 0);
      const nutMesh = new THREE.Mesh(nutGeom, this.chromeMaterial);
      modelGroup.add(nutMesh);

      // 4. Central Brass Ferrule / Sleeve where handle connects
      const ferruleGeom = new THREE.CylinderGeometry(headRadius * 1.03, headRadius * 1.03, 0.016, 24);
      const ferruleMesh = new THREE.Mesh(ferruleGeom, this.brassMaterial);
      modelGroup.add(ferruleMesh);

      // 5. Turned Hardwood Handle (sloping DOWNWARDS and BACKWARDS towards player's hands)
      const shaftGeom = new THREE.CylinderGeometry(0.0065, 0.0052, this.shaftLength, 14);
      shaftGeom.rotateX(Math.PI * 0.5 + handleAngle);
      shaftGeom.translate(
        0,
        -Math.sin(handleAngle) * this.shaftLength * 0.5,
        Math.cos(handleAngle) * this.shaftLength * 0.5
      );
      const shaftMesh = new THREE.Mesh(shaftGeom, this.woodHandleMaterial);
      shaftMesh.castShadow = true;
      modelGroup.add(shaftMesh);

      // 6. Textured Rubber Grip at the Handle Tail
      const gripLen = 0.11;
      const gripGeom = new THREE.CylinderGeometry(0.0085, 0.0085, gripLen, 14);
      gripGeom.rotateX(Math.PI * 0.5 + handleAngle);
      const gripOffset = this.shaftLength - gripLen * 0.5;
      gripGeom.translate(
        0,
        -Math.sin(handleAngle) * gripOffset,
        Math.cos(handleAngle) * gripOffset
      );
      const gripMesh = new THREE.Mesh(gripGeom, this.rubberMaterial);
      modelGroup.add(gripMesh);

      // Chrome Butt Cap
      const buttGeom = new THREE.SphereGeometry(0.009, 12, 12);
      const buttOffset = this.shaftLength;
      buttGeom.translate(
        0,
        -Math.sin(handleAngle) * buttOffset,
        Math.cos(handleAngle) * buttOffset
      );
      const buttMesh = new THREE.Mesh(buttGeom, this.chromeMaterial);
      modelGroup.add(buttMesh);

      malletPivot.add(modelGroup);
      this.group.add(malletPivot);

      this.malletPool.push({
        id: i,
        pivot: malletPivot,
        model: modelGroup,
        isBusy: false,
        currentPitch: null,
        idleTimeout: null
      });
    }
  }

  _acquireMallet(targetPitch) {
    let available = this.malletPool.find(m => !m.isBusy && !m.pivot.visible);
    if (available) return available;

    available = this.malletPool.find(m => !m.isBusy);
    if (available) return available;

    return this.malletPool[targetPitch % this.malletPool.length];
  }

  /* ------------------------------------------------------------------ */
  /*  NOTE EVENTS & ANIMATION                                           */
  /* ------------------------------------------------------------------ */

  /**
   * Lookahead Note Preparation:
   * Smoothly raises the chime hammer above the target tube strike cap.
   */
  onNotePrepare(midiPitch, velocity = 0.8) {
    const clampedPitch = Math.max(59, Math.min(77, midiPitch));
    const tube = this.tubes[clampedPitch] || this.tubes[59];
    if (!tube) return;

    const mallet = this._acquireMallet(clampedPitch);
    if (!mallet) return;

    this.preparedStrikes.set(clampedPitch, mallet);

    if (mallet.idleTimeout) {
      clearTimeout(mallet.idleTimeout);
      mallet.idleTimeout = null;
    }

    mallet.pivot.visible = true;
    gsap.killTweensOf(mallet.pivot.position);
    gsap.killTweensOf(mallet.pivot.rotation);

    const target = tube.strikePoint;
    const handSign = (clampedPitch < 69) ? 1 : -1;

    // Wind-up pose: hammer head raised above rim, tilted back ready to plunge down
    const prepX = target.x + handSign * 0.015;
    const prepY = target.y + 0.095 + (0.04 * velocity);
    const prepZ = target.z + 0.022;

    const prepRotX = -0.24 - (0.10 * velocity);
    const prepRotY = handSign * 0.06;
    const prepRotZ = -handSign * 0.04;

    gsap.to(mallet.pivot.position, {
      x: prepX,
      y: prepY,
      z: prepZ,
      duration: 0.12,
      ease: 'power2.out'
    });

    gsap.to(mallet.pivot.rotation, {
      x: prepRotX,
      y: prepRotY,
      z: prepRotZ,
      duration: 0.12,
      ease: 'power2.out'
    });
  }

  /**
   * Note-On Trigger:
   * 1. Snappy whip downstroke onto the top open circular rim.
   * 2. Elastic bounce & float.
   * 3. Chime tube pendulum recoil sway & warm metallic resonant bloom.
   * 4. Damper bar release & pedal press.
   */
  onNoteOn(midiPitch, velocity = 0.8, eventTime = null, trackIndex = null) {
    const vel = Math.max(0.3, Math.min(1.0, velocity));
    const clampedPitch = Math.max(59, Math.min(77, midiPitch));
    const tube = this.tubes[clampedPitch] || this.tubes[59];
    if (!tube) return;

    let mallet = this.preparedStrikes.get(clampedPitch);
    if (mallet) {
      this.preparedStrikes.delete(clampedPitch);
    } else {
      mallet = this._acquireMallet(clampedPitch);
    }
    if (!mallet) return;

    if (mallet.idleTimeout) {
      clearTimeout(mallet.idleTimeout);
      mallet.idleTimeout = null;
    }

    mallet.isBusy = true;
    mallet.currentPitch = clampedPitch;
    mallet.pivot.visible = true;

    gsap.killTweensOf(mallet.pivot.position);
    gsap.killTweensOf(mallet.pivot.rotation);

    const target = tube.strikePoint;
    const handSign = (clampedPitch < 69) ? 1 : -1;

    // Contact strike pose: bottom striking face of vertical head lands squarely on open circular rim
    const hitX = target.x;
    const hitY = target.y + 0.026; // Head height is 0.052, so bottom face (-0.026) touches target.y
    const hitZ = target.z;

    const hitRotX = 0.02;
    const hitRotY = handSign * 0.04;
    const hitRotZ = 0;

    // Post-impact ready hover pose: floating poised over the open rim
    const hoverX = target.x + handSign * 0.012;
    const hoverY = target.y + 0.058;
    const hoverZ = target.z + 0.018;

    const hoverRotX = -0.08;
    const hoverRotY = handSign * 0.05;
    const hoverRotZ = 0;

    const strikeTl = gsap.timeline({
      onComplete: () => {
        mallet.isBusy = false;
        // Idle retreat: if no strike within 1.6s, smoothly retract down towards player and hide
        mallet.idleTimeout = setTimeout(() => {
          if (!mallet.pivot.visible) return;
          gsap.timeline({
            onComplete: () => {
              mallet.pivot.visible = false;
              mallet.currentPitch = null;
            }
          })
          .to(mallet.pivot.position, {
            y: mallet.pivot.position.y - 0.16,
            z: mallet.pivot.position.z + 0.14,
            duration: 0.35,
            ease: 'power2.inOut'
          })
          .to(mallet.pivot.rotation, {
            x: -0.35,
            duration: 0.35,
            ease: 'power2.inOut'
          }, 0);
        }, 1600);
      }
    });

    // Step 1: Rapid accelerating downstroke into impact
    strikeTl.to(mallet.pivot.position, {
      x: hitX,
      y: hitY,
      z: hitZ,
      duration: 0.038,
      ease: 'power3.in'
    })
    .to(mallet.pivot.rotation, {
      x: hitRotX,
      y: hitRotY,
      z: hitRotZ,
      duration: 0.038,
      ease: 'power3.in'
    }, 0)

    // Step 2: Immediate elastic recoil rebound
    .to(mallet.pivot.position, {
      y: hitY + 0.075 * vel,
      duration: 0.065,
      ease: 'power2.out'
    })
    .to(mallet.pivot.rotation, {
      x: -0.22 * vel,
      duration: 0.065,
      ease: 'power2.out'
    }, '<')

    // Step 3: Settle smoothly into hovering ready stance
    .to(mallet.pivot.position, {
      x: hoverX,
      y: hoverY,
      z: hoverZ,
      duration: 0.16,
      ease: 'power2.out'
    })
    .to(mallet.pivot.rotation, {
      x: hoverRotX,
      y: hoverRotY,
      z: hoverRotZ,
      duration: 0.16,
      ease: 'power2.out'
    }, '<');

    // Physical Tube Recoil Sway (pendulum swing about suspension point)
    this._animateTubeImpact(tube, vel);

    // Damper Bar & Pedal Action
    this.activeNoteCount++;
    this._setDamperOpen(true);
  }

  /**
   * Note-Off Trigger:
   * Decrements active note count and allows damper to return if not sustained by pedal.
   */
  onNoteOff(midiPitch) {
    this.activeNoteCount = Math.max(0, this.activeNoteCount - 1);
    if (this.activeNoteCount === 0 && !this.isSustained) {
      this._setDamperOpen(false);
    }
  }

  /**
   * Damper / Sustain Pedal (CC 64)
   */
  onControlChange(controller, value) {
    if (controller === 64) {
      this.isSustained = value >= 64;
      this._setDamperOpen(this.isSustained || this.activeNoteCount > 0);
    }
  }

  _setDamperOpen(open) {
    const pedalRotX = open ? -0.22 : -0.10;
    const cableOffsetY = open ? -0.018 : 0.0;
    const feltOffsetY = open ? -0.015 : 0.0;

    if (this.pedalGroup) {
      gsap.killTweensOf(this.pedalGroup.rotation);
      gsap.to(this.pedalGroup.rotation, {
        x: pedalRotX,
        duration: 0.16,
        ease: 'power2.out'
      });
    }

    if (this.linkageCables) {
      gsap.killTweensOf(this.linkageCables.position);
      gsap.to(this.linkageCables.position, {
        y: cableOffsetY,
        duration: 0.16,
        ease: 'power2.out'
      });
    }

    if (this.internalDamperGroup) {
      gsap.killTweensOf(this.internalDamperGroup.position);
      gsap.to(this.internalDamperGroup.position, {
        y: 1.10 + feltOffsetY,
        duration: 0.16,
        ease: 'power2.out'
      });
    }
  }

  _animateTubeImpact(tube, velocity) {
    const swayAngle = -0.016 * velocity;

    gsap.killTweensOf(tube.group.rotation);
    gsap.timeline()
      .to(tube.group.rotation, { x: swayAngle, duration: 0.06, ease: 'power2.out' })
      .to(tube.group.rotation, { x: -swayAngle * 0.65, duration: 0.18, ease: 'sine.inOut' })
      .to(tube.group.rotation, { x: swayAngle * 0.35, duration: 0.28, ease: 'sine.inOut' })
      .to(tube.group.rotation, { x: 0, duration: 0.40, ease: 'sine.out' });

    // High-Energy Golden Brass Bloom
    tube.material.emissive.setHex(0xffdf66);
    tube.material.emissiveIntensity = 2.6 * velocity;
    gsap.killTweensOf(tube.material);
    gsap.to(tube.material, {
      emissiveIntensity: 0.15,
      duration: 1.1,
      ease: 'power2.out',
      onComplete: () => {
        tube.material.emissive.setHex(0x221703);
      }
    });

    // Flash on Top Striking Collar & Rim
    if (tube.collarMesh) {
      tube.collarMesh.material.emissive.setHex(0xffffff);
      tube.collarMesh.material.emissiveIntensity = 1.8 * velocity;
      gsap.killTweensOf(tube.collarMesh.material);
      gsap.to(tube.collarMesh.material, {
        emissiveIntensity: 0.0,
        duration: 0.3,
        ease: 'power2.out'
      });
    }
  }

  /* ------------------------------------------------------------------ */
  /*  LIFECYCLE & UPDATE                                                */
  /* ------------------------------------------------------------------ */

  update(delta) {
    // Subtle organic hovering motion for ready mallets
    const time = performance.now() * 0.003;
    this.malletPool.forEach((m, idx) => {
      if (m.pivot.visible && !m.isBusy && !gsap.isTweening(m.pivot.position)) {
        m.pivot.position.y += Math.sin(time + idx * 1.6) * 0.0003;
      }
    });
  }

  reset() {
    this.malletPool.forEach(m => {
      if (m.idleTimeout) clearTimeout(m.idleTimeout);
      m.idleTimeout = null;
      m.isBusy = false;
      m.currentPitch = null;
      m.pivot.visible = false;
      gsap.killTweensOf(m.pivot.position);
      gsap.killTweensOf(m.pivot.rotation);
    });
    this.preparedStrikes.clear();
    this.activeNoteCount = 0;
    this.isSustained = false;
    this._setDamperOpen(false);

    if (this.internalDamperGroup) {
      gsap.killTweensOf(this.internalDamperGroup.position);
      this.internalDamperGroup.position.set(0, 1.10, 0);
    }
    if (this.linkageCables) {
      gsap.killTweensOf(this.linkageCables.position);
      this.linkageCables.position.set(0, 0, 0);
    }
    if (this.pedalGroup) {
      gsap.killTweensOf(this.pedalGroup.rotation);
      this.pedalGroup.rotation.set(-0.10, 0, 0);
    }

    Object.values(this.tubes).forEach(tube => {
      gsap.killTweensOf(tube.group.rotation);
      tube.group.rotation.set(0, 0, 0);
      gsap.killTweensOf(tube.material);
      tube.material.emissive.setHex(0x221703);
      tube.material.emissiveIntensity = 0.15;
    });
  }

  dispose() {
    this.reset();
    if (this.group.parent) {
      this.group.parent.remove(this.group);
    }
    this.group.traverse(child => {
      if (child.geometry) child.geometry.dispose();
      if (child.material) {
        if (Array.isArray(child.material)) child.material.forEach(m => m.dispose());
        else child.material.dispose();
      }
    });
  }
}
