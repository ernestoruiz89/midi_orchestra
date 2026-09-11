import * as THREE from 'three';
import gsap from 'gsap';
import { AirIntakeEffect } from './AirIntakeEffect.js';

/**
 * Custom continuous C1 curve for the Saxophone U-bow (Codo).
 * Generates a straight vertical segment inside the body tube,
 * a mathematically perfect 180-degree circular arc with uniform radius,
 * and a straight vertical segment ascending into the bell tube.
 */
class SaxBowCurve extends THREE.Curve {
  constructor(yJoint = -0.33, zBody = 0.0, zBell = 0.176, extension = 0.035) {
    super();
    this.yJoint = yJoint;
    this.zBody = zBody;
    this.zBell = zBell;
    this.radius = (zBell - zBody) / 2; // 0.088m uniform bend radius
    this.zCenter = (zBody + zBell) / 2; // 0.088m
    this.ext = extension;
    this.l1 = this.ext;
    this.l2 = Math.PI * this.radius;
    this.l3 = this.ext;
    this.total = this.l1 + this.l2 + this.l3;
  }

  getPoint(t, optionalTarget = new THREE.Vector3()) {
    const s = t * this.total;
    if (s < this.l1) {
      // Straight vertical descent inside body cylinder (guarantees (0, -1, 0) tangent at joint)
      const fraction = s / this.l1;
      const y = (this.yJoint + this.ext) - fraction * this.ext;
      return optionalTarget.set(0, y, this.zBody);
    } else if (s < this.l1 + this.l2) {
      // Perfectly circular 180° U-arc (no pinch, no kinks, uniform curvature)
      const theta = ((s - this.l1) / this.l2) * Math.PI;
      const y = this.yJoint - this.radius * Math.sin(theta);
      const z = this.zCenter - this.radius * Math.cos(theta);
      return optionalTarget.set(0, y, z);
    } else {
      // Straight vertical ascent inside bell cylinder (guarantees (0, 1, 0) tangent at joint)
      const fraction = (s - this.l1 - this.l2) / this.l3;
      const y = this.yJoint + fraction * this.ext;
      return optionalTarget.set(0, y, this.zBell);
    }
  }
}

/**
 * Saxophone3D: High-Fidelity Professional Concert Alto Saxophone
 * Handcrafted Selmer Mark VI / Yamaha Custom Z aesthetic
 * - Proportional conical body tube with rib bands, tenon socket & clamp screw
 * - Ergonomic neck (tudel) with underslung strengthening rib & articulated octave mechanism
 * - Sculpted ebonite mouthpiece with beveled beak, cane reed & dual-screw brass ligature
 * - Full mechanical keywork: 4 nickel axle rods, posts, extruded tone-hole chimneys,
 *   cazoletas with leather pads & concave mother-of-pearl touches (LH: B, A, G; RH: F, E, D)
 * - Palm keys (D, Eb, F), side chromatic keys (Bb, C, high E), pinky tables with rollers & front F
 * - Flawless 180° circular U-bow (codo) with zero gaps, seamless tangents & gold brass skid guard
 * - Structural body-to-bell brace connecting body to bell
 * - Flared bell with rolled rim bead, low B/Bb key cups & sculpted wire key guard with green felt bumpers
 * - Procedural hand-engraved floral acanthus & maker crest bump map
 * - Concert stage stand with cushioned horizontal velvet roller rest and weighted base
 * - AirIntakeEffect breath dynamics, pitch-sensitive key articulation & acoustic bell resonance
 */
export class Saxophone3D {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();

    // Positioned front-right stage (Woodwind / Sax section)
    this.group.position.set(3.4, 1.25, 1.8);
    // Angled to project sound toward the conductor and audience (body on left, keys & bell on right)
    this.group.rotation.set(0.04, Math.PI * 0.38, 0.02);

    this.keyPads = [];
    this.auxKeys = [];
    this.octaveKey = null;
    this.bellMesh = null;
    this.saxBody = null;
    this.bellGroup = null;
    this.shockwaveRings = [];
    this.airIntake = null;
    this.bellOpeningHeight = 0.385;
    this.bellOpeningRadius = 0.1065;

    this._buildMaterials();
    this._buildStand();
    this._buildSaxophone();
    this._buildShockwaveRings();

    this.scene.add(this.group);
  }

  _buildMaterials() {
    // Rich vintage gold brass lacquer with high-gloss clearcoat
    this.brassMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xedba32,
      roughness: 0.13,
      metalness: 0.90,
      clearcoat: 0.92,
      clearcoatRoughness: 0.05
    });

    // Darker warm gold inner bell finish
    this.innerBellMaterial = new THREE.MeshStandardMaterial({
      color: 0xc48c18,
      roughness: 0.32,
      metalness: 0.85,
      side: THREE.BackSide
    });

    // Engraved bell outer lacquer with procedural floral bump map
    const engravingBump = this._createEngravingTexture();
    this.engravedBellMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xedba32,
      roughness: 0.13,
      metalness: 0.90,
      clearcoat: 0.92,
      clearcoatRoughness: 0.05,
      bumpMap: engravingBump,
      bumpScale: 0.006
    });

    // Mother-of-pearl finger button inlays with authentic iridescence and pearl luster
    this.pearlMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xfbf8f0,
      roughness: 0.15,
      metalness: 0.04,
      clearcoat: 0.95,
      clearcoatRoughness: 0.08,
      iridescence: 0.85,
      iridescenceIOR: 1.33,
      iridescenceThicknessRange: [100, 380]
    });

    // Dark interior bore for tone hole chimneys
    this.boreMaterial = new THREE.MeshBasicMaterial({
      color: 0x0a0a0d
    });

    // Tempered blued-steel needle springs
    this.springMaterial = new THREE.MeshStandardMaterial({
      color: 0x222a3a,
      roughness: 0.30,
      metalness: 0.90
    });

    // Mechanical axle rods and pivot screws (Polished Nickel / Chrome)
    this.nickelRodsMaterial = new THREE.MeshStandardMaterial({
      color: 0xd8dade,
      roughness: 0.16,
      metalness: 0.94
    });

    // Chrome hardware for stand and bracing
    this.chromeMaterial = new THREE.MeshStandardMaterial({
      color: 0xe0e2e8,
      roughness: 0.12,
      metalness: 0.95
    });

    // Soft Italian leather tone hole pads
    this.padMaterial = new THREE.MeshStandardMaterial({
      color: 0xe8dfcb,
      roughness: 0.72,
      metalness: 0.06
    });

    // Black ebonite (hard vulcanized rubber) mouthpiece
    this.eboniteMaterial = new THREE.MeshStandardMaterial({
      color: 0x141416,
      roughness: 0.24,
      metalness: 0.12
    });

    // Natural Arundo Donax cane reed
    this.reedMaterial = new THREE.MeshStandardMaterial({
      color: 0xdeb887,
      roughness: 0.65,
      metalness: 0.04
    });

    // Natural neck tenon cork
    this.corkMaterial = new THREE.MeshStandardMaterial({
      color: 0xc8a165,
      roughness: 0.82,
      metalness: 0.02
    });

    // Satin black stand metalwork
    this.standMaterial = new THREE.MeshStandardMaterial({
      color: 0x18181c,
      roughness: 0.60,
      metalness: 0.30
    });

    // Black velvet cradle padding
    this.velvetMaterial = new THREE.MeshStandardMaterial({
      color: 0x0e0e11,
      roughness: 0.92,
      metalness: 0.05
    });

    // Emerald green key bumper felts
    this.feltGreenMaterial = new THREE.MeshStandardMaterial({
      color: 0x1b5e20,
      roughness: 0.85,
      metalness: 0.02
    });
  }

  _createPearlGeometry(radius, depth) {
    const points = [];
    const segments = 16;
    // Flat bottom base
    points.push(new THREE.Vector2(0, 0.0000));
    points.push(new THREE.Vector2(radius, 0.0000));
    // Outer beveled edge
    points.push(new THREE.Vector2(radius * 1.02, 0.0008));
    points.push(new THREE.Vector2(radius, depth + 0.0005));
    // Smooth concave spherical bowl dipping down to center (y = 0.0005 at center)
    for (let i = segments; i >= 0; i--) {
      const t = i / segments;
      const r = radius * t;
      const y = 0.0005 + depth * (t * t);
      points.push(new THREE.Vector2(r, y));
    }
    const geom = new THREE.LatheGeometry(points, 28);
    geom.rotateX(Math.PI / 2);
    geom.computeVertexNormals();
    return geom;
  }

  _createBarrelRollerGeometry(length = 0.0122, midRadius = 0.0019, endRadius = 0.00155) {
    const points = [];
    const halfLen = length / 2;
    const segments = 14;
    points.push(new THREE.Vector2(0, -halfLen));
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const y = -halfLen + length * t;
      const factor = 4 * t * (1 - t);
      const r = endRadius + (midRadius - endRadius) * factor;
      points.push(new THREE.Vector2(r, y));
    }
    points.push(new THREE.Vector2(0, halfLen));
    const geom = new THREE.LatheGeometry(points, 20);
    geom.computeVertexNormals();
    return geom;
  }

  _createEbSpatulaShape() {
    // Upper crescent with convex top dome, carved pocket & wrapping bracket ears for roller
    const s = new THREE.Shape();
    const rollerAngle = -0.349;
    const slope = Math.tan(rollerAngle);
    const rollerMidX = 0.0145;

    s.moveTo(0.0035, 0.0025);
    s.quadraticCurveTo(0.0060, 0.0065, 0.0125, 0.0125);
    s.quadraticCurveTo(0.0210, 0.0090, 0.0245, 0.0035);
    s.quadraticCurveTo(0.0255, -0.0020, 0.0240, -0.0055);
    s.lineTo(0.0210, -0.0055);
    s.lineTo(0.0210, (0.0210 - rollerMidX) * slope + 0.0024);
    s.lineTo(0.0080, (0.0080 - rollerMidX) * slope + 0.0024);
    s.lineTo(0.0080, 0.000);
    s.lineTo(0.0035, 0.000);
    s.closePath();
    return s;
  }

  _createCSpatulaShape() {
    // Lower crescent with convex bottom dome, carved pocket & wrapping bracket ears for roller
    const s = new THREE.Shape();
    const rollerAngle = -0.349;
    const slope = Math.tan(rollerAngle);
    const rollerMidX = 0.0145;

    s.moveTo(0.0035, 0.000);
    s.lineTo(0.0080, 0.000);
    s.lineTo(0.0080, (0.0080 - rollerMidX) * slope - 0.0024);
    s.lineTo(0.0210, (0.0210 - rollerMidX) * slope - 0.0024);
    s.lineTo(0.0210, -0.0015);
    s.lineTo(0.0240, -0.0015);
    s.quadraticCurveTo(0.0255, -0.0060, 0.0210, -0.0115);
    s.quadraticCurveTo(0.0125, -0.0150, 0.0060, -0.0080);
    s.lineTo(0.0035, -0.0025);
    s.closePath();
    return s;
  }

  _createEngravingTexture() {
    if (typeof document === 'undefined') return null;
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    ctx.fillStyle = '#808080';
    ctx.fillRect(0, 0, 512, 512);

    // Decorative borders
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.strokeRect(30, 20, 452, 472);
    ctx.strokeStyle = '#202020';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(36, 26, 440, 460);

    // Floral acanthus leaf scrolls
    ctx.save();
    ctx.translate(256, 280);

    const drawLeaf = (angle, scale) => {
      ctx.save();
      ctx.rotate(angle);
      ctx.scale(scale, scale);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.bezierCurveTo(-25, -60, -70, -120, 0, -180);
      ctx.bezierCurveTo(70, -120, 25, -60, 0, 0);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3;
      ctx.stroke();

      // Veins
      for (let i = -140; i < -20; i += 25) {
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(-20, i + 15);
        ctx.moveTo(0, i);
        ctx.lineTo(20, i + 15);
        ctx.strokeStyle = '#e0e0e0';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
      ctx.restore();
    };

    drawLeaf(0, 0.9);
    drawLeaf(-0.45, 0.7);
    drawLeaf(0.45, 0.7);
    drawLeaf(-0.85, 0.5);
    drawLeaf(0.85, 0.5);

    // Maker Emblem Banner
    ctx.fillStyle = '#222222';
    ctx.fillRect(-140, -220, 280, 52);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.strokeRect(-140, -220, 280, 52);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 20px serif';
    ctx.textAlign = 'center';
    ctx.fillText('CUSTOM ALTO', 0, -196);
    ctx.font = 'italic 13px serif';
    ctx.fillText('CONCERT ARTISAN', 0, -178);

    ctx.restore();

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.ClampToEdgeWrapping;
    tex.repeat.set(1.5, 1);
    return tex;
  }

  _buildStand() {
    const stand = new THREE.Group();
    // Positioned so feet rest exactly on the stage floor (y = 0 in world coords)
    stand.position.set(0, -1.25, 0);

    // Heavy weighted cast base
    const base = new THREE.Mesh(
      new THREE.CylinderGeometry(0.22, 0.25, 0.035, 32),
      this.chromeMaterial
    );
    base.position.z = -0.04;
    stand.add(base);

    // 3 rubber leveling feet
    for (let i = 0; i < 3; i++) {
      const angle = (i * Math.PI * 2) / 3;
      const foot = new THREE.Mesh(
        new THREE.CylinderGeometry(0.018, 0.018, 0.010, 16),
        this.standMaterial
      );
      foot.position.set(
        Math.cos(angle) * 0.20,
        -0.018,
        Math.sin(angle) * 0.20 - 0.04
      );
      stand.add(foot);
    }

    // Telescopic lower column
    const lowerPole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.014, 0.014, 0.60, 16),
      this.chromeMaterial
    );
    lowerPole.position.set(0, 0.30, -0.04);
    stand.add(lowerPole);

    // Adjustment collar & wing nut
    const collar = new THREE.Mesh(
      new THREE.CylinderGeometry(0.022, 0.022, 0.045, 16),
      this.chromeMaterial
    );
    collar.position.set(0, 0.60, -0.04);
    stand.add(collar);

    const wingNut = new THREE.Mesh(
      new THREE.BoxGeometry(0.038, 0.012, 0.010),
      this.chromeMaterial
    );
    wingNut.position.set(0.022, 0.60, -0.04);
    stand.add(wingNut);

    const upperPole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.010, 0.010, 0.52, 16),
      this.chromeMaterial
    );
    upperPole.position.set(0, 0.86, -0.04);
    stand.add(upperPole);

    // --- Lower Support Cradle (Padded horizontal shelf underneath bow) ---
    // Bow apex is at y = -0.418 in group space (which is 1.25 - 0.418 = 0.832 above stand base).
    // Bottom of outer brass is at y = 0.832 - 0.044 = 0.788.
    const lowerArm = new THREE.Mesh(
      new THREE.CylinderGeometry(0.007, 0.007, 0.13, 12).rotateX(Math.PI / 2),
      this.chromeMaterial
    );
    lowerArm.position.set(0, 0.748, 0.025);
    stand.add(lowerArm);

    // Chrome vertical riser bracket
    const lowerBracket = new THREE.Mesh(
      new THREE.CylinderGeometry(0.0065, 0.0065, 0.045, 12),
      this.chromeMaterial
    );
    lowerBracket.position.set(0, 0.760, 0.088);
    stand.add(lowerBracket);

    // Cushioned horizontal velvet roller rest supporting bow from underneath
    // Width 9cm, thickness 2.2cm. Sits directly under bow without penetrating!
    const lowerRest = new THREE.Mesh(
      new THREE.CylinderGeometry(0.011, 0.011, 0.090, 20).rotateZ(Math.PI / 2),
      this.velvetMaterial
    );
    lowerRest.position.set(0, 0.776, 0.088);
    stand.add(lowerRest);

    // Chrome protective end caps on the roller
    [-0.046, 0.046].forEach(capX => {
      const cap = new THREE.Mesh(
        new THREE.CylinderGeometry(0.0135, 0.0135, 0.005, 16).rotateZ(Math.PI / 2),
        this.chromeMaterial
      );
      cap.position.set(capX, 0.776, 0.088);
      stand.add(cap);
    });

    // --- Upper Cradle: Cradles lower body tube cleanly below pinky spatulas and keys ---
    const upperYokeBracket = new THREE.Mesh(
      new THREE.CylinderGeometry(0.008, 0.008, 0.06, 12).rotateX(Math.PI / 2),
      this.chromeMaterial
    );
    upperYokeBracket.position.set(0, 0.94, -0.035);
    stand.add(upperYokeBracket);

    const upperYoke = new THREE.Mesh(
      new THREE.TorusGeometry(0.048, 0.010, 10, 24, Math.PI),
      this.velvetMaterial
    );
    upperYoke.position.set(0, 0.94, -0.012);
    upperYoke.rotation.x = Math.PI / 2;
    stand.add(upperYoke);

    this.group.add(stand);
  }

  _buildSaxophone() {
    const sax = new THREE.Group();
    this.saxBody = sax;

    const bodyHeight = 0.66;
    const rTop = 0.021;
    const rBot = 0.042;

    // ==========================================
    // 1. CONICAL BODY TUBE WITH RIB BANDS & COLLAR
    // ==========================================
    const mainBody = new THREE.Mesh(
      new THREE.CylinderGeometry(rTop, rBot, bodyHeight, 32),
      this.brassMaterial
    );
    mainBody.position.set(0, 0, 0);
    mainBody.castShadow = true;
    mainBody.receiveShadow = true;
    sax.add(mainBody);

    // Reinforcing soldered ribs (longitudinal brass strips for key posts)
    const ribGeom = new THREE.BoxGeometry(0.004, bodyHeight * 0.82, 0.004);
    const leftRib = new THREE.Mesh(ribGeom, this.brassMaterial);
    leftRib.position.set(-0.034, 0, 0.006);
    sax.add(leftRib);

    const rightRib = new THREE.Mesh(ribGeom, this.brassMaterial);
    rightRib.position.set(0.034, 0, 0.006);
    sax.add(rightRib);

    // Top neck socket receiver (tenon collar)
    const topCollar = new THREE.Mesh(
      new THREE.CylinderGeometry(0.0245, 0.0245, 0.024, 24),
      this.brassMaterial
    );
    topCollar.position.set(0, bodyHeight / 2 + 0.012, 0);
    sax.add(topCollar);

    // Neck receiver clamp screw with wing nut
    const clampScrew = new THREE.Mesh(
      new THREE.CylinderGeometry(0.0035, 0.0035, 0.020, 12).rotateZ(Math.PI / 2),
      this.brassMaterial
    );
    clampScrew.position.set(0.025, bodyHeight / 2 + 0.016, -0.004);
    sax.add(clampScrew);

    const clampWing = new THREE.Mesh(
      new THREE.BoxGeometry(0.014, 0.008, 0.003),
      this.brassMaterial
    );
    clampWing.position.set(0.035, bodyHeight / 2 + 0.016, -0.004);
    sax.add(clampWing);

    // ==========================================
    // 2. ERGONOMIC NECK (TUDEL) & OCTAVE MECHANISM
    // ==========================================
    const neckY_start = bodyHeight / 2 + 0.024;
    const neckY_apex = bodyHeight / 2 + 0.150;
    const neckZ_end = -0.155;

    // Curved neck centerline
    const neckCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, neckY_start, 0.000),
      new THREE.Vector3(0, neckY_start + 0.065, -0.016),
      new THREE.Vector3(0, neckY_start + 0.110, -0.048),
      new THREE.Vector3(0, neckY_apex, -0.098),
      new THREE.Vector3(0, neckY_apex, neckZ_end)
    ]);

    const neckGeometry = new THREE.TubeGeometry(neckCurve, 28, 0.0112, 20, false);
    const neckPosition = neckGeometry.attributes.position;
    const center = new THREE.Vector3();
    const vertex = new THREE.Vector3();
    for (let ring = 0; ring <= 28; ring++) {
      const t = ring / 28;
      neckCurve.getPointAt(t, center);
      const taper = THREE.MathUtils.lerp(1.8, 1, t);
      for (let side = 0; side <= 20; side++) {
        const index = ring * 21 + side;
        vertex.fromBufferAttribute(neckPosition, index).sub(center).multiplyScalar(taper).add(center);
        neckPosition.setXYZ(index, vertex.x, vertex.y, vertex.z);
      }
    }
    neckGeometry.computeVertexNormals();

    const neckMesh = new THREE.Mesh(neckGeometry, this.brassMaterial);
    neckMesh.castShadow = true;
    sax.add(neckMesh);

    // Underslung neck reinforcing rib (crescent brace under neck arch)
    const neckBraceCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, neckY_start + 0.015, -0.008),
      new THREE.Vector3(0, neckY_start + 0.055, -0.028),
      new THREE.Vector3(0, neckY_apex - 0.018, -0.075)
    ]);
    const neckBrace = new THREE.Mesh(
      new THREE.TubeGeometry(neckBraceCurve, 16, 0.0035, 10, false),
      this.brassMaterial
    );
    sax.add(neckBrace);

    // Octave Pip (chimney on top of neck arch)
    const octavePip = new THREE.Mesh(
      new THREE.CylinderGeometry(0.004, 0.004, 0.007, 14),
      this.brassMaterial
    );
    octavePip.position.set(0, neckY_apex + 0.012, -0.095);
    sax.add(octavePip);

    // Articulated Octave Key Lever & Pad
    const octaveKeyGroup = new THREE.Group();
    octaveKeyGroup.position.set(0, neckY_apex + 0.013, -0.095);

    const octaveCup = new THREE.Mesh(
      new THREE.CylinderGeometry(0.0065, 0.0065, 0.003, 14),
      this.brassMaterial
    );
    octaveCup.position.set(0, 0.003, 0);
    octaveKeyGroup.add(octaveCup);

    const octavePad = new THREE.Mesh(
      new THREE.CylinderGeometry(0.0055, 0.0055, 0.002, 12),
      this.padMaterial
    );
    octavePad.position.set(0, 0.0005, 0);
    octaveKeyGroup.add(octavePad);

    const octaveBarCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0.003, 0),
      new THREE.Vector3(0, 0.006, 0.035),
      new THREE.Vector3(0, -0.045, 0.075),
      new THREE.Vector3(0, -0.105, 0.092)
    ]);
    const octaveBar = new THREE.Mesh(
      new THREE.TubeGeometry(octaveBarCurve, 16, 0.0022, 10, false),
      this.brassMaterial
    );
    octaveKeyGroup.add(octaveBar);

    const octaveHoop = new THREE.Mesh(
      new THREE.TorusGeometry(0.014, 0.002, 8, 16, Math.PI).rotateX(Math.PI / 2),
      this.brassMaterial
    );
    octaveHoop.position.set(0, -0.105, 0.092);
    octaveKeyGroup.add(octaveHoop);

    sax.add(octaveKeyGroup);
    this.octaveKey = octaveKeyGroup;

    // Natural Neck Cork: Beveled wrap along -Z
    const corkLen = 0.035;
    const corkZ = neckZ_end - corkLen / 2;
    const cork = new THREE.Mesh(
      new THREE.CylinderGeometry(0.0102, 0.0102, corkLen, 20).rotateX(Math.PI / 2),
      this.corkMaterial
    );
    cork.position.set(0, neckY_apex, corkZ);
    sax.add(cork);

    // Ebonite Black Mouthpiece with Beveled Beak
    const mpLen = 0.062;
    const mpZ = neckZ_end - corkLen - mpLen / 2;
    const mpBody = new THREE.Mesh(
      new THREE.CylinderGeometry(0.0096, 0.0122, mpLen, 20).rotateX(Math.PI / 2),
      this.eboniteMaterial
    );
    mpBody.position.set(0, neckY_apex, mpZ);
    sax.add(mpBody);

    // Beveled wedge beak (angled bite surface on top)
    const beak = new THREE.Mesh(
      new THREE.CylinderGeometry(0.0035, 0.010, 0.028, 16).rotateX(Math.PI / 2),
      this.eboniteMaterial
    );
    beak.position.set(0, neckY_apex + 0.005, mpZ - 0.016);
    sax.add(beak);

    // Natural Cane Reed on bottom flat table
    const reed = new THREE.Mesh(
      new THREE.BoxGeometry(0.0125, 0.0028, mpLen * 0.88),
      this.reedMaterial
    );
    reed.position.set(0, neckY_apex - 0.0105, mpZ);
    sax.add(reed);

    // Dual-Screw Gold Brass Ligature
    const ligature = new THREE.Mesh(
      new THREE.CylinderGeometry(0.0128, 0.0130, 0.022, 20).rotateX(Math.PI / 2),
      this.brassMaterial
    );
    ligature.position.set(0, neckY_apex, mpZ + 0.008);
    sax.add(ligature);

    // 2 knurled brass tightening screws on top of ligature
    for (let s = 0; s < 2; s++) {
      const screwZ = mpZ + 0.003 + s * 0.010;
      const screw = new THREE.Mesh(
        new THREE.CylinderGeometry(0.0025, 0.0025, 0.008, 10),
        this.brassMaterial
      );
      screw.position.set(0, neckY_apex + 0.014, screwZ);
      sax.add(screw);

      const screwHead = new THREE.Mesh(
        new THREE.BoxGeometry(0.008, 0.003, 0.003),
        this.brassMaterial
      );
      screwHead.position.set(0, neckY_apex + 0.018, screwZ);
      sax.add(screwHead);
    }

    // AirIntakeEffect at the tip of the mouthpiece
    this.airIntake = new AirIntakeEffect(sax, {
      origin: new THREE.Vector3(0, neckY_apex, mpZ - mpLen / 2),
      outwardDirection: new THREE.Vector3(0, 0, -1),
      distance: 0.16
    });

    // ==========================================
    // 3. FLAWLESS 180° CIRCULAR U-BOW (CODO)
    // ==========================================
    // Mathematical 180° circular bend with uniform R=0.088m, perfectly tangential (0,-1,0) at body
    // and (0,1,0) at bell, with seamless vertical extensions inside both cylinders.
    const bowZ_end = 0.176;
    const bowCurve = new SaxBowCurve(-bodyHeight / 2, 0.0, bowZ_end, 0.035);

    const bowTubularSegments = 48;
    const bowRadialSegments = 32;
    const bowBaseRadius = 0.042;
    const bowGeometry = new THREE.TubeGeometry(bowCurve, bowTubularSegments, bowBaseRadius, bowRadialSegments, false);
    const bowPos = bowGeometry.attributes.position;
    const bCenter = new THREE.Vector3();
    const bVert = new THREE.Vector3();

    for (let ring = 0; ring <= bowTubularSegments; ring++) {
      const t = ring / bowTubularSegments;
      bowCurve.getPointAt(t, bCenter);
      // Smooth continuous cone expansion from body (0.042) to bell (0.045)
      const taper = THREE.MathUtils.lerp(1.0, 1.072, t);
      for (let side = 0; side <= bowRadialSegments; side++) {
        const idx = ring * (bowRadialSegments + 1) + side;
        bVert.fromBufferAttribute(bowPos, idx).sub(bCenter).multiplyScalar(taper).add(bCenter);
        bowPos.setXYZ(idx, bVert.x, bVert.y, bVert.z);
      }
    }
    bowGeometry.computeVertexNormals();

    const bowMesh = new THREE.Mesh(bowGeometry, this.brassMaterial);
    bowMesh.castShadow = true;
    bowMesh.receiveShadow = true;
    sax.add(bowMesh);

    // --- Body-to-Bow Joining Ferrule (Clamping Collar) ---
    // Wraps cleanly over the joint plane (y = -0.33, z = 0) with zero gap
    const bodyBowFerrule = new THREE.Mesh(
      new THREE.CylinderGeometry(0.0442, 0.0442, 0.024, 32),
      this.brassMaterial
    );
    bodyBowFerrule.position.set(0, -bodyHeight / 2, 0);
    sax.add(bodyBowFerrule);

    const bodyBowBead = new THREE.Mesh(
      new THREE.TorusGeometry(0.0448, 0.0022, 10, 32).rotateX(Math.PI / 2),
      this.brassMaterial
    );
    bodyBowBead.position.set(0, -bodyHeight / 2, 0);
    sax.add(bodyBowBead);

    // Clamping lug on the side
    const bodyBowLug = new THREE.Mesh(
      new THREE.BoxGeometry(0.008, 0.016, 0.006),
      this.brassMaterial
    );
    bodyBowLug.position.set(0.045, -bodyHeight / 2, 0);
    sax.add(bodyBowLug);

    // --- Polished Gold Brass Protective Bow Skid Guard ---
    // Beautiful curved brass strip following the bottom outer arc of the U-bow
    const skidPoints = [];
    const skidR = 0.088 + bowBaseRadius + 0.002; // R = 0.132m
    for (let k = 0; k <= 16; k++) {
      const theta = 0.40 + (k / 16) * (Math.PI - 0.80);
      const sy = -bodyHeight / 2 - skidR * Math.sin(theta);
      const sz = 0.088 - skidR * Math.cos(theta);
      skidPoints.push(new THREE.Vector3(0, sy, sz));
    }
    const bowSkidCurve = new THREE.CatmullRomCurve3(skidPoints);
    const bowSkid = new THREE.Mesh(
      new THREE.TubeGeometry(bowSkidCurve, 20, 0.0038, 12, false),
      this.brassMaterial
    );
    sax.add(bowSkid);

    // Skid guard solder mounting tabs
    [0.55, Math.PI - 0.55].forEach(theta => {
      const tabY = -bodyHeight / 2 - skidR * Math.sin(theta) + 0.002;
      const tabZ = 0.088 - skidR * Math.cos(theta);
      const tab = new THREE.Mesh(
        new THREE.CylinderGeometry(0.003, 0.003, 0.008, 10).rotateZ(Math.PI / 2),
        this.brassMaterial
      );
      tab.position.set(0, tabY, tabZ);
      sax.add(tab);
    });

    // ==========================================
    // 4. FLARED BELL WITH ENGRAVING, KEY GUARD & LOW KEYS
    // ==========================================
    const bellGroup = new THREE.Group();
    // Centered at bow-to-bell junction plane
    bellGroup.position.set(0, -bodyHeight / 2, bowZ_end);
    // Forward tilt (~6.5°) for acoustic projection
    bellGroup.rotation.x = 0.11;

    // --- Bow-to-Bell Joining Ferrule (Decorative Clamping Collar) ---
    const bowBellFerrule = new THREE.Mesh(
      new THREE.CylinderGeometry(0.0482, 0.0482, 0.024, 32),
      this.brassMaterial
    );
    bowBellFerrule.position.set(0, 0.008, 0);
    bellGroup.add(bowBellFerrule);

    const bowBellBead = new THREE.Mesh(
      new THREE.TorusGeometry(0.0488, 0.0022, 10, 32).rotateX(Math.PI / 2),
      this.brassMaterial
    );
    bowBellBead.position.set(0, 0.008, 0);
    bellGroup.add(bowBellBead);

    // Continuous hollow bell profile expanding upward
    const bellFlarePoints = [];
    const innerPoints = [];
    const segments = 32;
    const bellHeight = 0.385;
    const endR = 0.1065;

    for (let j = 0; j <= segments; j++) {
      const t = j / segments;
      const r = 0.046 + 0.016 * t + 0.0445 * Math.pow(t, 3.8);
      const y = t * bellHeight;
      bellFlarePoints.push(new THREE.Vector2(r, y));
      innerPoints.push(new THREE.Vector2(r - 0.0015, y));
    }

    const bellFlareGeom = new THREE.LatheGeometry(bellFlarePoints, 36);
    const bellOuter = new THREE.Mesh(bellFlareGeom, this.engravedBellMaterial);
    bellOuter.castShadow = true;
    bellGroup.add(bellOuter);
    this.bellMesh = bellOuter;

    const bellInner = new THREE.Mesh(new THREE.LatheGeometry(innerPoints, 36), this.innerBellMaterial);
    bellGroup.add(bellInner);

    const throat = new THREE.Mesh(
      new THREE.CircleGeometry(0.044, 24),
      new THREE.MeshStandardMaterial({ color: 0x39200c, roughness: 0.9, side: THREE.DoubleSide })
    );
    throat.rotation.x = -Math.PI / 2;
    throat.position.y = 0.008;
    bellGroup.add(throat);

    // Rolled Bell Rim Bead
    const bellRim = new THREE.Mesh(
      new THREE.TorusGeometry(endR, 0.0034, 12, 40).rotateX(Math.PI / 2),
      this.brassMaterial
    );
    bellRim.position.y = bellHeight;
    bellGroup.add(bellRim);
    this.bellGroup = bellGroup;
    this.bellOpeningHeight = bellHeight;
    this.bellOpeningRadius = endR;

    // --- Modern Side-Mounted Low B and Low Bb Keys (Right Side of Bell) ---
    const bellKeys = [
      { id: 'lowB', x: 0.052, y: 0.16, z: 0.015, radius: 0.017 },
      { id: 'lowBb', x: 0.056, y: 0.09, z: 0.012, radius: 0.019 }
    ];

    bellKeys.forEach(bk => {
      const chimney = new THREE.Mesh(
        new THREE.CylinderGeometry(bk.radius, bk.radius, 0.008, 18).rotateZ(Math.PI / 2),
        this.brassMaterial
      );
      chimney.position.set(bk.x * 0.90, bk.y, bk.z);
      bellGroup.add(chimney);

      const keyGroup = new THREE.Group();
      keyGroup.position.set(bk.x, bk.y, bk.z);

      const cup = new THREE.Mesh(
        new THREE.CylinderGeometry(bk.radius * 1.05, bk.radius * 1.05, 0.0045, 18).rotateZ(Math.PI / 2),
        this.brassMaterial
      );
      keyGroup.add(cup);

      const pad = new THREE.Mesh(
        new THREE.CylinderGeometry(bk.radius * 0.95, bk.radius * 0.95, 0.003, 16).rotateZ(Math.PI / 2),
        this.padMaterial
      );
      pad.position.set(-0.002, 0, 0);
      keyGroup.add(pad);

      bellGroup.add(keyGroup);
      this.auxKeys.push({ id: bk.id, group: keyGroup, baseX: bk.x, isBellKey: true });
    });

    // --- Sculptural Wire Key Guard protecting Low B and Bb ---
    const keyGuard = new THREE.Group();
    const guardSpineCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.072, 0.04, 0.010),
      new THREE.Vector3(0.076, 0.12, 0.014),
      new THREE.Vector3(0.070, 0.20, 0.018)
    ]);
    const guardSpine = new THREE.Mesh(
      new THREE.TubeGeometry(guardSpineCurve, 16, 0.0024, 10, false),
      this.brassMaterial
    );
    keyGuard.add(guardSpine);

    // Cross brace struts anchoring to bell wall
    [0.05, 0.12, 0.19].forEach((sy) => {
      const strut = new THREE.Mesh(
        new THREE.CylinderGeometry(0.0018, 0.0018, 0.024, 8).rotateZ(Math.PI / 2),
        this.brassMaterial
      );
      strut.position.set(0.062, sy, 0.014);
      keyGuard.add(strut);

      const foot = new THREE.Mesh(
        new THREE.CylinderGeometry(0.004, 0.004, 0.003, 12).rotateZ(Math.PI / 2),
        this.brassMaterial
      );
      foot.position.set(0.050, sy, 0.014);
      keyGuard.add(foot);
    });

    // Emerald Green Felt Adjustment Bumpers
    [0.09, 0.16].forEach(by => {
      const feltBumper = new THREE.Mesh(
        new THREE.CylinderGeometry(0.005, 0.005, 0.006, 12).rotateZ(Math.PI / 2),
        this.feltGreenMaterial
      );
      feltBumper.position.set(0.064, by, 0.014);
      keyGuard.add(feltBumper);
    });
    bellGroup.add(keyGuard);

    sax.add(bellGroup);

    // ==========================================
    // 5. MECHANICAL KEYWORK: AXLE RODS & PRECISION POSTS
    // ==========================================
    // Helper to calculate body radius at any height y
    const getSaxRadius = (y) => {
      const tNorm = Math.max(0, Math.min(1, (bodyHeight / 2 - y) / bodyHeight));
      return rTop + (rBot - rTop) * tNorm;
    };

    // Helper to build a precision turned post connecting body tube to a rod
    const buildPost = (rodPos, postY) => {
      const postGroup = new THREE.Group();
      const rAtY = getSaxRadius(postY);
      const rodDist = Math.hypot(rodPos.x, rodPos.z);
      const postLen = Math.max(0.005, rodDist - rAtY);
      const angle = Math.atan2(rodPos.x, rodPos.z);

      // Solder mounting foot plate on sax tube
      const foot = new THREE.Mesh(
        new THREE.BoxGeometry(0.008, 0.005, 0.003),
        this.brassMaterial
      );
      foot.position.set(Math.sin(angle) * (rAtY + 0.0015), postY, Math.cos(angle) * (rAtY + 0.0015));
      foot.rotation.y = angle;
      postGroup.add(foot);

      // Turned pillar stem
      const stem = new THREE.Mesh(
        new THREE.CylinderGeometry(0.0022, 0.0032, postLen, 10).rotateZ(Math.PI / 2),
        this.brassMaterial
      );
      const midDist = rAtY + postLen * 0.5;
      stem.position.set(Math.sin(angle) * midDist, postY, Math.cos(angle) * midDist);
      stem.rotation.y = angle;
      postGroup.add(stem);

      // Transverse pivot head at the rod
      const head = new THREE.Mesh(
        new THREE.CylinderGeometry(0.0036, 0.0036, 0.0065, 12),
        this.brassMaterial
      );
      head.position.set(rodPos.x, postY, rodPos.z);
      postGroup.add(head);

      // Nickel pivot screw
      const screw = new THREE.Mesh(
        new THREE.CylinderGeometry(0.0020, 0.0020, 0.008, 8),
        this.nickelRodsMaterial
      );
      screw.position.set(rodPos.x, postY, rodPos.z);
      postGroup.add(screw);

      sax.add(postGroup);
    };

    // Upper Stack Hinge Rod (Mano Izquierda)
    const upperRodPos = { x: 0.033, z: 0.013 };
    const upperRodLen = 0.165;
    const upperRodY = 0.092;
    const upperRod = new THREE.Mesh(
      new THREE.CylinderGeometry(0.0018, 0.0018, upperRodLen, 12),
      this.nickelRodsMaterial
    );
    upperRod.position.set(upperRodPos.x, upperRodY, upperRodPos.z);
    sax.add(upperRod);
    [0.015, 0.092, 0.170].forEach(py => buildPost(upperRodPos, py));

    // Lower Stack Hinge Rod (Mano Derecha - Termina limpio en la llave de Re para despejar la sección del meñique)
    const lowerRodPos = { x: -0.034, z: 0.016 };
    const lowerRodLen = 0.135;
    const lowerRodY = -0.112;
    const lowerRod = new THREE.Mesh(
      new THREE.CylinderGeometry(0.0018, 0.0018, lowerRodLen, 12),
      this.nickelRodsMaterial
    );
    lowerRod.position.set(lowerRodPos.x, lowerRodY, lowerRodPos.z);
    sax.add(lowerRod);
    [-0.050, -0.115, -0.175].forEach(py => buildPost(lowerRodPos, py));

    // Left Palm Keys Rod
    const palmRodPos = { x: -0.032, z: 0.010 };
    const palmRod = new THREE.Mesh(
      new THREE.CylinderGeometry(0.0018, 0.0018, 0.090, 12),
      this.nickelRodsMaterial
    );
    palmRod.position.set(palmRodPos.x, 0.200, palmRodPos.z);
    sax.add(palmRod);
    [0.165, 0.235].forEach(py => buildPost(palmRodPos, py));

    // Right Side Keys Rod
    const sideRodPos = { x: 0.042, z: -0.006 };
    const sideRod = new THREE.Mesh(
      new THREE.CylinderGeometry(0.0018, 0.0018, 0.130, 12),
      this.nickelRodsMaterial
    );
    sideRod.position.set(sideRodPos.x, -0.020, sideRodPos.z);
    sax.add(sideRod);
    [-0.075, 0.035].forEach(py => buildPost(sideRodPos, py));

    // ==========================================
    // 7. PRIMARY FINGER BUTTONS & ARTICULATED MECHANISM
    // ==========================================
    const upperKeyAngle = 0.36; // Radian azimuth angle of front upper finger stack (mano izquierda)
    const lowerKeyAngle = -0.36; // Radian azimuth angle of lower finger stack in white box (mano derecha)

    const stackKeys = [
      // UPPER STACK (Left Hand: B, Bis, A, G) - rod a la derecha, apertura hacia fuera con rotación positiva amplificada
      { id: 'B',   name: 'B',      y: 0.140, midiThresh: 71, cupR: 0.0132, pearlR: 0.0105, rod: upperRodPos, angle: upperKeyAngle, restAngle: 0.200, pressedAngle: 0.000, isBis: false },
      { id: 'Bis', name: 'Bis Bb', y: 0.115, midiThresh: 70, cupR: 0.0084, pearlR: 0.0068, rod: upperRodPos, angle: upperKeyAngle, restAngle: 0.200, pressedAngle: 0.000, isBis: true },
      { id: 'A',   name: 'A',      y: 0.090, midiThresh: 69, cupR: 0.0136, pearlR: 0.0105, rod: upperRodPos, angle: upperKeyAngle, restAngle: 0.200, pressedAngle: 0.000, isBis: false },
      { id: 'G',   name: 'G',      y: 0.040, midiThresh: 67, cupR: 0.0142, pearlR: 0.0105, rod: upperRodPos, angle: upperKeyAngle, restAngle: 0.200, pressedAngle: 0.000, isBis: false },
      // LOWER STACK (Right Hand: F, E, D) - apertura hacia fuera con rotación negativa amplificada (4mm de recorrido)
      { id: 'F',   name: 'F',      y: -0.065, midiThresh: 65, cupR: 0.0148, pearlR: 0.0110, rod: lowerRodPos, angle: lowerKeyAngle, restAngle: -0.200, pressedAngle: 0.000, isBis: false },
      { id: 'E',   name: 'E',      y: -0.115, midiThresh: 64, cupR: 0.0152, pearlR: 0.0110, rod: lowerRodPos, angle: lowerKeyAngle, restAngle: -0.200, pressedAngle: 0.000, isBis: false },
      { id: 'D',   name: 'D',      y: -0.165, midiThresh: 62, cupR: 0.0158, pearlR: 0.0110, rod: lowerRodPos, angle: lowerKeyAngle, restAngle: -0.200, pressedAngle: 0.000, isBis: false }
    ];

    stackKeys.forEach((k, idx) => {
      const rBody = getSaxRadius(k.y);
      const ux = Math.sin(k.angle);
      const uz = Math.cos(k.angle);

      // --- 1. STATIONARY TONE HOLE CHIMNEY (Firmly Soldered to Sax Body) ---
      const chBaseX = ux * rBody;
      const chBaseZ = uz * rBody;

      // Chimney tube wall
      const chimney = new THREE.Mesh(
        new THREE.CylinderGeometry(k.cupR * 0.90, k.cupR * 0.90, 0.0055, 22).rotateX(Math.PI / 2),
        this.brassMaterial
      );
      chimney.position.set(chBaseX + ux * 0.00275, k.y, chBaseZ + uz * 0.00275);
      chimney.rotation.y = k.angle;
      sax.add(chimney);

      // Turned sealing rim lip at top of chimney
      const chimneyLip = new THREE.Mesh(
        new THREE.TorusGeometry(k.cupR * 0.90, 0.0008, 8, 22),
        this.brassMaterial
      );
      chimneyLip.position.set(chBaseX + ux * 0.0055, k.y, chBaseZ + uz * 0.0055);
      chimneyLip.rotation.y = k.angle;
      sax.add(chimneyLip);

      // Dark acoustic bore disc inside the chimney
      const boreDisc = new THREE.Mesh(
        new THREE.CircleGeometry(k.cupR * 0.86, 18),
        this.boreMaterial
      );
      boreDisc.position.set(chBaseX + ux * 0.0012, k.y, chBaseZ + uz * 0.0012);
      boreDisc.rotation.y = k.angle;
      sax.add(boreDisc);

      // --- 2. ARTICULATED KEY MECHANISM (Rotates on Axle Rod) ---
      const keyGroup = new THREE.Group();
      keyGroup.position.set(k.rod.x, k.y, k.rod.z);

      // Resting open position (lifts pad outward from body)
      keyGroup.rotation.y = k.restAngle;

      // Cup coordinates in closed state (when rotation.y = 0)
      const cupWorldX = ux * (rBody + 0.0070);
      const cupWorldZ = uz * (rBody + 0.0070);
      const lx = cupWorldX - k.rod.x;
      const lz = cupWorldZ - k.rod.z;
      const armLen = Math.hypot(lx, lz);
      const armAngle = Math.atan2(lx, lz);

      // Hinge Barrel (Brass sleeve wrapping around the nickel axle rod)
      const barrel = new THREE.Mesh(
        new THREE.CylinderGeometry(0.0032, 0.0032, 0.018, 16),
        this.brassMaterial
      );
      keyGroup.add(barrel);

      // Needle Spring Wire (Tempered blued steel)
      const spring = new THREE.Mesh(
        new THREE.CylinderGeometry(0.0005, 0.0005, 0.020, 6).rotateZ(0.25),
        this.springMaterial
      );
      spring.position.set(-0.0025, 0, 0.001);
      keyGroup.add(spring);

      // Sculpted Key Arm (Solid brass bar connecting barrel to the RIM of the cup)
      const barLen = Math.max(0.006, armLen - k.cupR * 0.98);
      const midDist = barLen * 0.5;
      const arm = new THREE.Mesh(
        new THREE.BoxGeometry(0.0032, 0.0028, barLen),
        this.brassMaterial
      );
      arm.position.set(Math.sin(armAngle) * midDist, 0, Math.cos(armAngle) * midDist);
      arm.rotation.y = armAngle;
      keyGroup.add(arm);

      // Reinforcement gusset at barrel junction
      const gusset = new THREE.Mesh(
        new THREE.CylinderGeometry(0.0038, 0.0030, 0.006, 10).rotateX(Math.PI / 2),
        this.brassMaterial
      );
      gusset.position.set(Math.sin(armAngle) * 0.004, 0, Math.cos(armAngle) * 0.004);
      gusset.rotation.y = armAngle;
      keyGroup.add(gusset);

      // Cup & Touch Assembly (Rotated to align with tone hole face)
      const cupGroup = new THREE.Group();
      cupGroup.position.set(lx, 0, lz);
      cupGroup.rotation.y = k.angle;

      // Brass Key Cup (Turned exterior cup body, spans z: -0.0018 to +0.0018)
      const cup = new THREE.Mesh(
        new THREE.CylinderGeometry(k.cupR, k.cupR * 0.96, 0.0036, 24).rotateX(Math.PI / 2),
        this.brassMaterial
      );
      cupGroup.add(cup);

      // Soft Italian Leather Tone Hole Pad (faces inwards towards tone hole chimney)
      const pad = new THREE.Mesh(
        new THREE.CylinderGeometry(k.cupR * 0.92, k.cupR * 0.92, 0.0020, 20).rotateX(Math.PI / 2),
        this.padMaterial
      );
      pad.position.z = -0.0016;
      cupGroup.add(pad);

      // Acoustic Domed Brass Resonator seated on the leather pad (facing chimney in -Z)
      const resonator = new THREE.Mesh(
        new THREE.CylinderGeometry(k.cupR * 0.52, k.cupR * 0.50, 0.0006, 18).rotateX(Math.PI / 2),
        this.brassMaterial
      );
      resonator.position.z = -0.0028;
      cupGroup.add(resonator);

      const rivet = new THREE.Mesh(
        new THREE.CylinderGeometry(0.0012, 0.0012, 0.0008, 10).rotateX(Math.PI / 2),
        this.nickelRodsMaterial
      );
      rivet.position.z = -0.0033;
      cupGroup.add(rivet);

      // Raised Gold Brass Bezel Collar encircling the mother-of-pearl touchpiece
      const collar = new THREE.Mesh(
        new THREE.TorusGeometry(k.pearlR * 1.01, 0.0010, 8, 24),
        this.brassMaterial
      );
      collar.position.z = 0.0026;
      cupGroup.add(collar);

      // Concave Mother-of-Pearl Finger Button Inlay (Pure iridescent pearl bowl with independent touch luminescence)
      const pearlMat = this.pearlMaterial.clone();
      const pearl = new THREE.Mesh(
        this._createPearlGeometry(k.pearlR, 0.0014),
        pearlMat
      );
      pearl.position.z = 0.0020; // Elevated safely in front of cup face
      cupGroup.add(pearl);

      keyGroup.add(cupGroup);
      sax.add(keyGroup);

      // Register for musical MIDI animation
      this.keyPads.push({
        id: k.id,
        group: keyGroup,
        pearlMesh: pearl,
        restAngle: k.restAngle,
        pressedAngle: k.pressedAngle,
        rotAxis: 'y',
        baseZ: keyGroup.position.z,
        baseX: keyGroup.position.x,
        midiThresh: k.midiThresh,
        index: idx
      });
    });

    // ==========================================
    // 8. AUXILIARY KEYS: PALM, SIDE & PINKY TABLES
    // ==========================================
    // High Palm Keys (Left Hand: D, Eb, High F)
    const palmKeyData = [
      { y: 0.235, angle: 0.18, len: 0.026 },
      { y: 0.200, angle: 0.00, len: 0.024 },
      { y: 0.165, angle: -0.18, len: 0.022 }
    ];
    palmKeyData.forEach((pk, i) => {
      const palmGroup = new THREE.Group();
      palmGroup.position.set(-0.032, pk.y, 0.010);
      palmGroup.rotation.z = pk.angle;

      // Hinge sleeve on palm rod
      const barrel = new THREE.Mesh(
        new THREE.CylinderGeometry(0.0028, 0.0028, 0.014, 12),
        this.brassMaterial
      );
      palmGroup.add(barrel);

      // Sculpted spoon touch
      const spoon = new THREE.Mesh(
        new THREE.CylinderGeometry(0.006, 0.009, pk.len, 14),
        this.brassMaterial
      );
      spoon.position.set(-0.008, 0, 0.004);
      palmGroup.add(spoon);

      const arm = new THREE.Mesh(
        new THREE.BoxGeometry(0.014, 0.003, 0.004),
        this.brassMaterial
      );
      arm.position.set(-0.005, 0, 0.002);
      palmGroup.add(arm);

      sax.add(palmGroup);
      this.auxKeys.push({ id: 'palm_' + i, group: palmGroup, baseX: -0.032 });
    });

    // Right Hand Side Keys (Bb, C, High E)
    const sideKeyYs = [0.030, -0.020, -0.070];
    sideKeyYs.forEach((sy) => {
      const sideGroup = new THREE.Group();
      sideGroup.position.set(0.042, sy, -0.006);

      const barrel = new THREE.Mesh(
        new THREE.CylinderGeometry(0.0026, 0.0026, 0.016, 12),
        this.brassMaterial
      );
      sideGroup.add(barrel);

      const spatula = new THREE.Mesh(
        new THREE.BoxGeometry(0.004, 0.026, 0.008),
        this.brassMaterial
      );
      spatula.position.set(0.003, 0, 0.010);
      sideGroup.add(spatula);

      sax.add(sideGroup);
    });

    // Left Pinky Table Cluster (Low Bb, B, C#, G#) with brass rollers
    const pinkyTableGroup = new THREE.Group();
    pinkyTableGroup.position.set(-0.038, 0.02, 0.022);

    for (let r = 0; r < 2; r++) {
      const spatula = new THREE.Mesh(
        new THREE.BoxGeometry(0.010, 0.018, 0.003),
        this.brassMaterial
      );
      spatula.position.set(r * 0.011, 0, 0);
      pinkyTableGroup.add(spatula);

      const roller = new THREE.Mesh(
        new THREE.CylinderGeometry(0.002, 0.002, 0.014, 10).rotateZ(Math.PI / 2),
        this.brassMaterial
      );
      roller.position.set(r * 0.011, -0.011, 0.002);
      pinkyTableGroup.add(roller);
    }
    sax.add(pinkyTableGroup);

    // ==========================================
    // RIGHT HAND PINKY TABLE: LOW Eb & LOW C SPATULAS & CUPS
    // (Sculpted to photo reference & MIDIs2Jam2 oval pair silhouette)
    // ==========================================
    const rightPinkyGroup = new THREE.Group();
    // Positioned in the RED BOX on the left flank below D key (y = -0.204, azimuth = -1.80)
    const pinkyAzimuth = -1.80;
    const pinkyY = -0.204;
    const rTubePinky = getSaxRadius(pinkyY);
    const cosPA = Math.cos(pinkyAzimuth);
    const sinPA = Math.sin(pinkyAzimuth);
    const baseSaxX = rTubePinky * sinPA;
    const baseSaxZ = rTubePinky * cosPA;
    const baseRotX = -0.0155 * cosPA + (-0.017) * sinPA;
    const baseRotZ = -(-0.0155) * sinPA + (-0.017) * cosPA;
    rightPinkyGroup.position.set(baseSaxX - baseRotX, pinkyY, baseSaxZ - baseRotZ);
    rightPinkyGroup.rotation.y = pinkyAzimuth;

    const spatulaExtrudeSettings = {
      depth: 0.0022,
      bevelEnabled: true,
      bevelSegments: 4,
      steps: 1,
      bevelSize: 0.0006,
      bevelThickness: 0.0006
    };

    // Hinge axle is situated on the left of the spatulas
    const hingeX = -0.0155;
    const postTopY = 0.021; // Level with D button center (y = -0.165)
    const postBotY = -0.025;

    // 1. Turned Brass Mounting Standoff soldered to body tube with Spherical Ball Finial
    const topStandoff = new THREE.Mesh(
      new THREE.CylinderGeometry(0.0024, 0.0028, 0.017, 12).rotateX(Math.PI / 2),
      this.brassMaterial
    );
    topStandoff.position.set(hingeX, postTopY, -0.0085);
    rightPinkyGroup.add(topStandoff);

    // Turned spherical ball finial on top of the post
    const ballFinial = new THREE.Mesh(
      new THREE.SphereGeometry(0.0036, 16, 16),
      this.brassMaterial
    );
    ballFinial.position.set(hingeX, postTopY + 0.0036, 0);
    rightPinkyGroup.add(ballFinial);

    // Turned neck/collar under the ball
    const finialCollar = new THREE.Mesh(
      new THREE.CylinderGeometry(0.0030, 0.0030, 0.0020, 14),
      this.brassMaterial
    );
    finialCollar.position.set(hingeX, postTopY + 0.0010, 0);
    rightPinkyGroup.add(finialCollar);

    // Hinge top socket
    const topSocket = new THREE.Mesh(
      new THREE.CylinderGeometry(0.0034, 0.0034, 0.0032, 14),
      this.brassMaterial
    );
    topSocket.position.set(hingeX, postTopY - 0.0016, 0);
    rightPinkyGroup.add(topSocket);

    // Bottom horizontal standoff arm from body cone to lower post
    const botStandoff = new THREE.Mesh(
      new THREE.CylinderGeometry(0.0024, 0.0028, 0.017, 12).rotateX(Math.PI / 2),
      this.brassMaterial
    );
    botStandoff.position.set(hingeX, postBotY, -0.0085);
    rightPinkyGroup.add(botStandoff);

    // Bottom acorn cap / socket
    const botCap = new THREE.Mesh(
      new THREE.CylinderGeometry(0.0034, 0.0024, 0.0038, 14),
      this.brassMaterial
    );
    botCap.position.set(hingeX, postBotY - 0.0019, 0);
    rightPinkyGroup.add(botCap);

    // 2. Vertical Mechanical Pivot Axle Rod (Polished Nickel)
    const pinkyAxle = new THREE.Mesh(
      new THREE.CylinderGeometry(0.0015, 0.0015, postTopY - postBotY + 0.006, 12),
      this.nickelRodsMaterial
    );
    pinkyAxle.position.set(hingeX, (postTopY + postBotY) / 2, 0);
    rightPinkyGroup.add(pinkyAxle);

    // 3. Tempered Blued-Steel Needle Spring running vertically behind the spatulas
    const pinkySpring = new THREE.Mesh(
      new THREE.CylinderGeometry(0.00045, 0.00045, 0.038, 6),
      this.springMaterial
    );
    pinkySpring.position.set(hingeX + 0.0036, 0.002, -0.0025);
    rightPinkyGroup.add(pinkySpring);

    // Spring catch pin with miniature ball tip extending from lower sleeve
    const springCatchPin = new THREE.Mesh(
      new THREE.CylinderGeometry(0.0008, 0.0008, 0.0045, 8).rotateX(Math.PI / 2),
      this.brassMaterial
    );
    springCatchPin.position.set(hingeX + 0.0025, -0.012, -0.002);
    rightPinkyGroup.add(springCatchPin);

    const springCatchBall = new THREE.Mesh(
      new THREE.SphereGeometry(0.0011, 8, 8),
      this.brassMaterial
    );
    springCatchBall.position.set(hingeX + 0.0025, -0.012, -0.0042);
    rightPinkyGroup.add(springCatchBall);

    // Common roller direction vector (tilted -20° downwards to the right)
    const rollerAngle = -0.349;
    const rollerDir = new THREE.Vector3(Math.cos(rollerAngle), Math.sin(rollerAngle), 0).normalize();
    const rollerQuat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), rollerDir);
    const rollerLen = 0.0122;
    const rollerR = 0.0019;
    const rollerMidX = 0.0145; // Offset from hinge sleeve

    // 4. Low Eb Spatula Group (Upper spatula with upper barrel roller)
    const ebSpatulaGroup = new THREE.Group();
    ebSpatulaGroup.position.set(hingeX, 0.0048, 0);

    // Upper hinge sleeve wrapping around vertical axle
    const ebSleeve = new THREE.Mesh(
      new THREE.CylinderGeometry(0.0033, 0.0033, 0.0088, 14),
      this.brassMaterial
    );
    ebSpatulaGroup.add(ebSleeve);

    // Beveled brass spatula blade
    const ebGeom = new THREE.ExtrudeGeometry(this._createEbSpatulaShape(), spatulaExtrudeSettings);
    ebGeom.computeVertexNormals();
    const ebMesh = new THREE.Mesh(ebGeom, this.brassMaterial);
    ebMesh.position.set(0, 0, 0.0006);
    ebSpatulaGroup.add(ebMesh);

    // Upper Black Ebonite Barrel Roller
    const ebRollerGeom = this._createBarrelRollerGeometry(rollerLen, rollerR, rollerR * 0.82);
    const ebRoller = new THREE.Mesh(ebRollerGeom, this.eboniteMaterial.clone());
    ebRoller.quaternion.copy(rollerQuat);
    ebRoller.position.set(rollerMidX, -0.0018, 0.0028);
    ebSpatulaGroup.add(ebRoller);

    // Roller axle pin (Nickel)
    const ebRollerPin = new THREE.Mesh(
      new THREE.CylinderGeometry(0.0006, 0.0006, rollerLen + 0.003, 8),
      this.nickelRodsMaterial
    );
    ebRollerPin.quaternion.copy(rollerQuat);
    ebRollerPin.position.set(rollerMidX, -0.0018, 0.0028);
    ebSpatulaGroup.add(ebRollerPin);

    rightPinkyGroup.add(ebSpatulaGroup);

    // Spacer collar between the two sleeves
    const midSpacer = new THREE.Mesh(
      new THREE.CylinderGeometry(0.0026, 0.0026, 0.0016, 12),
      this.brassMaterial
    );
    midSpacer.position.set(hingeX, 0.000, 0);
    rightPinkyGroup.add(midSpacer);

    // 5. Low C Spatula Group (Lower spatula with lower barrel roller)
    const cSpatulaGroup = new THREE.Group();
    cSpatulaGroup.position.set(hingeX, -0.0048, 0);

    // Lower hinge sleeve wrapping around vertical axle
    const cSleeve = new THREE.Mesh(
      new THREE.CylinderGeometry(0.0033, 0.0033, 0.0088, 14),
      this.brassMaterial
    );
    cSpatulaGroup.add(cSleeve);

    // Beveled brass spatula blade
    const cGeom = new THREE.ExtrudeGeometry(this._createCSpatulaShape(), spatulaExtrudeSettings);
    cGeom.computeVertexNormals();
    const cMesh = new THREE.Mesh(cGeom, this.brassMaterial);
    cMesh.position.set(0, 0, 0.0006);
    cSpatulaGroup.add(cMesh);

    // Lower Black Ebonite Barrel Roller (Parallel to upper roller, snug 0.8mm clearance)
    const cRollerGeom = this._createBarrelRollerGeometry(rollerLen, rollerR, rollerR * 0.82);
    const cRoller = new THREE.Mesh(cRollerGeom, this.eboniteMaterial.clone());
    cRoller.quaternion.copy(rollerQuat);
    cRoller.position.set(rollerMidX, 0.0018, 0.0028);
    cSpatulaGroup.add(cRoller);

    // Roller axle pin (Nickel)
    const cRollerPin = new THREE.Mesh(
      new THREE.CylinderGeometry(0.0006, 0.0006, rollerLen + 0.003, 8),
      this.nickelRodsMaterial
    );
    cRollerPin.quaternion.copy(rollerQuat);
    cRollerPin.position.set(rollerMidX, 0.0018, 0.0028);
    cSpatulaGroup.add(cRollerPin);

    rightPinkyGroup.add(cSpatulaGroup);

    sax.add(rightPinkyGroup);

    // --- Low Eb and Low C Tone Hole Chimneys & Articulated Key Cups ---
    const lowerBodyKeys = [
      { id: 'lowEb', y: -0.208, x: 0.041, z: 0.014, radius: 0.0155, midiThresh: 63, spatulaGroup: ebSpatulaGroup, roller: ebRoller },
      { id: 'lowC',  y: -0.252, x: 0.044, z: 0.016, radius: 0.0170, midiThresh: 60, spatulaGroup: cSpatulaGroup, roller: cRoller }
    ];

    lowerBodyKeys.forEach(lbk => {
      // 1. Stationary Tone Hole Chimney on lower body wall
      const chimney = new THREE.Mesh(
        new THREE.CylinderGeometry(lbk.radius * 0.92, lbk.radius * 0.92, 0.006, 20).rotateZ(Math.PI / 2),
        this.brassMaterial
      );
      chimney.position.set(lbk.x * 0.88, lbk.y, lbk.z);
      sax.add(chimney);

      const rim = new THREE.Mesh(
        new THREE.TorusGeometry(lbk.radius * 0.92, 0.0008, 8, 20).rotateY(Math.PI / 2),
        this.brassMaterial
      );
      rim.position.set(lbk.x * 0.94, lbk.y, lbk.z);
      sax.add(rim);

      // 2. Articulated Key Cup
      const cupGroup = new THREE.Group();
      cupGroup.position.set(lbk.x, lbk.y, lbk.z);

      const cup = new THREE.Mesh(
        new THREE.CylinderGeometry(lbk.radius, lbk.radius * 0.95, 0.0042, 22).rotateZ(Math.PI / 2),
        this.brassMaterial
      );
      cupGroup.add(cup);

      const pad = new THREE.Mesh(
        new THREE.CylinderGeometry(lbk.radius * 0.92, lbk.radius * 0.92, 0.0022, 18).rotateZ(Math.PI / 2),
        this.padMaterial
      );
      pad.position.set(-0.0016, 0, 0);
      cupGroup.add(pad);

      // Brass resonator
      const resonator = new THREE.Mesh(
        new THREE.CylinderGeometry(lbk.radius * 0.50, lbk.radius * 0.50, 0.0006, 16).rotateZ(Math.PI / 2),
        this.brassMaterial
      );
      resonator.position.set(-0.0028, 0, 0);
      cupGroup.add(resonator);

      // Linkage arm from lower stack rod
      const arm = new THREE.Mesh(
        new THREE.CylinderGeometry(0.0016, 0.0016, 0.018, 8).rotateZ(0.35),
        this.brassMaterial
      );
      arm.position.set(-0.006, 0.004, 0);
      cupGroup.add(arm);

      sax.add(cupGroup);
      this.auxKeys.push({
        id: lbk.id,
        group: cupGroup,
        spatulaGroup: lbk.spatulaGroup,
        rollerMesh: lbk.roller,
        baseX: lbk.x,
        midiThresh: lbk.midiThresh,
        isLowerBodyKey: true
      });
    });

    // Sculpted Brass Key Guard protecting Low Eb and Low C cups
    const lowerGuardGroup = new THREE.Group();
    const guardCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.055, -0.188, 0.013),
      new THREE.Vector3(0.060, -0.230, 0.016),
      new THREE.Vector3(0.056, -0.272, 0.018)
    ]);
    const guardRail = new THREE.Mesh(
      new THREE.TubeGeometry(guardCurve, 16, 0.0022, 8, false),
      this.brassMaterial
    );
    lowerGuardGroup.add(guardRail);

    // Anchor mounting struts
    [-0.190, -0.270].forEach(sy => {
      const strut = new THREE.Mesh(
        new THREE.CylinderGeometry(0.0016, 0.0016, 0.020, 8).rotateZ(Math.PI / 2),
        this.brassMaterial
      );
      strut.position.set(0.048, sy, 0.015);
      lowerGuardGroup.add(strut);
    });

    // Emerald Green Felt Adjustment Bumpers
    [-0.208, -0.252].forEach(by => {
      const bumper = new THREE.Mesh(
        new THREE.CylinderGeometry(0.004, 0.004, 0.005, 10).rotateZ(Math.PI / 2),
        this.feltGreenMaterial
      );
      bumper.position.set(0.052, by, 0.015);
      lowerGuardGroup.add(bumper);
    });
    sax.add(lowerGuardGroup);

    // Front F Key (High auxiliary pearl touch attached via contoured brass arm)
    const frontFGroup = new THREE.Group();
    frontFGroup.position.set(upperRodPos.x, 0.170, upperRodPos.z);

    // Hinge sleeve on upper rod
    const fBarrel = new THREE.Mesh(
      new THREE.CylinderGeometry(0.0028, 0.0028, 0.012, 12),
      this.brassMaterial
    );
    frontFGroup.add(fBarrel);

    // Contoured brass lever arm reaching over to front-center
    const fArm = new THREE.Mesh(
      new THREE.BoxGeometry(0.0026, 0.0024, 0.024),
      this.brassMaterial
    );
    const fArmAngle = Math.atan2(-0.022, 0.012);
    fArm.position.set(-0.011, 0.003, 0.006);
    fArm.rotation.y = fArmAngle;
    frontFGroup.add(fArm);

    // Touch cup & pearl
    const fCupGroup = new THREE.Group();
    fCupGroup.position.set(-0.022, 0.006, 0.012);
    fCupGroup.rotation.y = upperKeyAngle;

    const fCup = new THREE.Mesh(
      new THREE.CylinderGeometry(0.0065, 0.0060, 0.0032, 18).rotateX(Math.PI / 2),
      this.brassMaterial
    );
    fCupGroup.add(fCup);

    const fPearl = new THREE.Mesh(
      this._createPearlGeometry(0.0055, 0.0009),
      this.pearlMaterial
    );
    fPearl.position.z = 0.0016;
    fCupGroup.add(fPearl);

    frontFGroup.add(fCupGroup);
    sax.add(frontFGroup);

    // ==========================================
    // 9. REAR RESTS: THUMB HOOK, THUMB REST & STRAP RING
    // ==========================================
    const leftThumbRest = new THREE.Mesh(
      new THREE.CylinderGeometry(0.012, 0.012, 0.004, 18).rotateX(Math.PI / 2),
      this.eboniteMaterial
    );
    leftThumbRest.position.set(0, 0.160, -0.027);
    sax.add(leftThumbRest);

    const octaveThumbLever = new THREE.Mesh(
      new THREE.BoxGeometry(0.007, 0.024, 0.003),
      this.brassMaterial
    );
    octaveThumbLever.position.set(-0.008, 0.180, -0.028);
    sax.add(octaveThumbLever);

    const strapRing = new THREE.Mesh(
      new THREE.TorusGeometry(0.006, 0.002, 8, 14).rotateY(Math.PI / 2),
      this.brassMaterial
    );
    strapRing.position.set(0, 0.010, -0.038);
    sax.add(strapRing);

    const thumbHook = new THREE.Mesh(
      new THREE.TorusGeometry(0.011, 0.0035, 10, 16, Math.PI * 0.8).rotateY(Math.PI / 2),
      this.brassMaterial
    );
    thumbHook.position.set(0, -0.075, -0.040);
    sax.add(thumbHook);

    this.group.add(sax);
  }

  _buildShockwaveRings() {
    for (let i = 0; i < 4; i++) {
      const ringGeom = new THREE.TorusGeometry(this.bellOpeningRadius, 0.0025, 6, 28).rotateX(Math.PI / 2);
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0xffcc00,
        transparent: true,
        opacity: 0,
        depthWrite: false
      });
      const ring = new THREE.Mesh(ringGeom, ringMat);
      ring.position.set(0, this.bellOpeningHeight, 0);
      this.bellGroup.add(ring);
      this.shockwaveRings.push(ring);
    }
  }

  _getFingering(midiPitch) {
    let p = midiPitch;
    while (p < 58) p += 12;
    while (p > 90) p -= 12;

    const isOctave = p >= 73; // D5 and above uses octave key
    const pitchInOctave = p % 12;

    const active = {
      B: false,
      Bis: false,
      A: false,
      G: false,
      F: false,
      E: false,
      D: false,
      lowC: false,
      lowEb: false,
      octave: isOctave,
      bellKeys: p < 60,
      palmKeys: p >= 86
    };

    if (p < 60) {
      // Low Bb / Low B: all finger keys + low C + bell keys
      active.B = active.A = active.G = active.F = active.E = active.D = true;
      active.lowC = true;
      active.bellKeys = true;
    } else if (p === 60) {
      // Low C: all finger keys + low C spatula
      active.B = active.A = active.G = active.F = active.E = active.D = true;
      active.lowC = true;
    } else if (p === 61) {
      // Low C#: open
    } else if (p >= 86) {
      // Altissimo / Palm register
      active.palmKeys = true;
      if (p >= 88) active.B = true;
    } else {
      // Standard chromatic saxophone fingerings (replicated in octaves 4 & 5):
      switch (pitchInOctave) {
        case 2: // D (62, 74)
          active.B = active.A = active.G = active.F = active.E = active.D = true;
          break;
        case 3: // Eb (63, 75)
          active.B = active.A = active.G = active.F = active.E = active.D = true;
          active.lowEb = true;
          break;
        case 4: // E (64, 76)
          active.B = active.A = active.G = active.F = active.E = true;
          break;
        case 5: // F (65, 77)
          active.B = active.A = active.G = active.F = true;
          break;
        case 6: // F# (66, 78)
          active.B = active.A = active.G = active.E = true;
          break;
        case 7: // G (67, 79)
          active.B = active.A = active.G = true;
          break;
        case 8: // G# (68, 80)
          active.B = active.A = active.G = true;
          break;
        case 9: // A (69, 81)
          active.B = active.A = true;
          break;
        case 10: // Bb (70, 82)
          active.B = active.Bis = true;
          break;
        case 11: // B (71, 83)
          active.B = true;
          break;
        case 0: // C (72, 84)
          active.A = true; // Middle finger C
          break;
        case 1: // C# (73, 85)
          // Open
          break;
      }
    }

    return active;
  }

  onNoteOn(midiPitch, velocity = 0.8, eventTime = null, trackIndex = null, duration = 0.5) {
    const vel = Math.max(0.3, Math.min(1.0, velocity));
    const holdDuration = Math.max(0.18, Math.min(1.4, duration ? duration * 0.82 : 0.38));

    if (this.airIntake) {
      this.airIntake.start(vel);
    }

    const fingering = this._getFingering(midiPitch);

    if (this.octaveKey) {
      gsap.killTweensOf(this.octaveKey.rotation);
      gsap.to(this.octaveKey.rotation, {
        x: fingering.octave ? -0.26 : 0,
        duration: 0.04,
        ease: 'power2.out',
        onComplete: () => {
          gsap.to(this.octaveKey.rotation, {
            x: 0,
            duration: 0.12,
            delay: holdDuration,
            ease: 'power1.in'
          });
        }
      });
    }

    this.keyPads.forEach((k) => {
      const isDown = !!fingering[k.id];
      const targetRot = isDown ? k.pressedAngle : k.restAngle;

      gsap.killTweensOf(k.group.rotation);
      gsap.to(k.group.rotation, {
        y: targetRot,
        duration: 0.035,
        ease: 'power2.out',
        onComplete: () => {
          gsap.to(k.group.rotation, {
            y: k.restAngle,
            duration: 0.14,
            delay: holdDuration,
            ease: 'power1.in'
          });
        }
      });

      // Pearl button touch luminescence / golden iridescent sheen
      if (k.pearlMesh && k.pearlMesh.material) {
        gsap.killTweensOf(k.pearlMesh.material);
        if (isDown) {
          k.pearlMesh.material.emissive.setHex(0xffaa22);
          k.pearlMesh.material.emissiveIntensity = 1.6 * vel;
          gsap.to(k.pearlMesh.material, {
            emissiveIntensity: 0.0,
            duration: 0.16,
            delay: holdDuration,
            ease: 'power1.in'
          });
        } else {
          k.pearlMesh.material.emissiveIntensity = 0.0;
        }
      }
    });

    this.auxKeys.forEach(ak => {
      if (ak.isBellKey) {
        const isClosed = fingering.bellKeys;
        const targetX = isClosed ? ak.baseX * 0.93 : ak.baseX;
        gsap.killTweensOf(ak.group.position);
        gsap.to(ak.group.position, {
          x: targetX,
          duration: 0.04,
          ease: 'power2.out',
          onComplete: () => {
            gsap.to(ak.group.position, {
              x: ak.baseX,
              duration: 0.14,
              delay: holdDuration,
              ease: 'power1.in'
            });
          }
        });
      } else if (ak.isLowerBodyKey) {
        const isClosed = ak.id === 'lowC' ? fingering.lowC : (ak.id === 'lowEb' ? fingering.lowEb : false);
        const targetX = isClosed ? ak.baseX * 0.93 : ak.baseX;
        gsap.killTweensOf(ak.group.position);
        gsap.to(ak.group.position, {
          x: targetX,
          duration: 0.04,
          ease: 'power2.out',
          onComplete: () => {
            gsap.to(ak.group.position, {
              x: ak.baseX,
              duration: 0.14,
              delay: holdDuration,
              ease: 'power1.in'
            });
          }
        });

        // Spatula inward physical depression (-0.28 rad / 4mm travel)
        if (ak.spatulaGroup) {
          gsap.killTweensOf(ak.spatulaGroup.rotation);
          const targetSpatulaRot = isClosed ? -0.28 : 0.0;
          gsap.to(ak.spatulaGroup.rotation, {
            y: targetSpatulaRot,
            duration: 0.04,
            ease: 'power2.out',
            onComplete: () => {
              gsap.to(ak.spatulaGroup.rotation, {
                y: 0.0,
                duration: 0.14,
                delay: holdDuration,
                ease: 'power1.in'
              });
            }
          });
        }

        // Roller touch sheen highlight
        if (ak.rollerMesh && ak.rollerMesh.material) {
          gsap.killTweensOf(ak.rollerMesh.material);
          if (isClosed) {
            ak.rollerMesh.material.emissive.setHex(0xffaa22);
            ak.rollerMesh.material.emissiveIntensity = 1.5 * vel;
            gsap.to(ak.rollerMesh.material, {
              emissiveIntensity: 0.0,
              duration: 0.16,
              delay: holdDuration,
              ease: 'power1.in'
            });
          } else {
            ak.rollerMesh.material.emissiveIntensity = 0.0;
          }
        }
      }
    });

    if (this.saxBody) {
      gsap.killTweensOf(this.saxBody.position);
      gsap.killTweensOf(this.saxBody.rotation);

      gsap.to(this.saxBody.position, {
        y: 0.012 * vel,
        duration: 0.05,
        ease: 'power2.out',
        yoyo: true,
        repeat: 1
      });

      gsap.to(this.saxBody.rotation, {
        x: -0.024 * vel,
        duration: 0.06,
        ease: 'power2.out',
        yoyo: true,
        repeat: 1
      });
    }

    const idleRing = this.shockwaveRings.find(r => r.material.opacity <= 0.05);
    if (idleRing) {
      idleRing.position.set(0, this.bellOpeningHeight, 0);
      idleRing.scale.set(1, 1, 1);
      idleRing.material.opacity = 0.38 * vel;

      gsap.killTweensOf(idleRing.position);
      gsap.killTweensOf(idleRing.scale);
      gsap.killTweensOf(idleRing.material);

      gsap.to(idleRing.position, {
        y: this.bellOpeningHeight + 0.50,
        duration: 0.58,
        ease: 'power1.out'
      });
      gsap.to(idleRing.scale, {
        x: 2.8,
        y: 2.8,
        z: 2.8,
        duration: 0.58,
        ease: 'power1.out'
      });
      gsap.to(idleRing.material, {
        opacity: 0,
        duration: 0.58,
        ease: 'power2.in'
      });
    }
  }

  onNoteOff(midiPitch, force = false) {
    if (this.airIntake) {
      this.airIntake.stop();
    }
    if (this.octaveKey) {
      gsap.to(this.octaveKey.rotation, {
        x: 0,
        duration: 0.10,
        ease: 'power1.out'
      });
    }
    this.keyPads.forEach(k => {
      gsap.to(k.group.rotation, {
        y: k.restAngle,
        duration: 0.10,
        ease: 'power1.out'
      });
      if (k.pearlMesh && k.pearlMesh.material) {
        gsap.to(k.pearlMesh.material, {
          emissiveIntensity: 0.0,
          duration: 0.12,
          ease: 'power1.out'
        });
      }
    });
    this.auxKeys.forEach(ak => {
      if (ak.isLowerBodyKey) {
        gsap.to(ak.group.position, {
          x: ak.baseX,
          duration: 0.10,
          ease: 'power1.out'
        });
        if (ak.spatulaGroup) {
          gsap.to(ak.spatulaGroup.rotation, {
            y: 0,
            duration: 0.10,
            ease: 'power1.out'
          });
        }
        if (ak.rollerMesh && ak.rollerMesh.material) {
          gsap.to(ak.rollerMesh.material, {
            emissiveIntensity: 0.0,
            duration: 0.10,
            ease: 'power1.out'
          });
        }
      } else if (ak.isBellKey) {
        gsap.to(ak.group.position, {
          x: ak.baseX,
          duration: 0.10,
          ease: 'power1.out'
        });
      }
    });
  }

  update(delta) {
    if (this.airIntake) {
      this.airIntake.update(delta);
    }
    if (this.saxBody) {
      this.saxBody.rotation.y = Math.sin(Date.now() * 0.0016) * 0.010;
    }
  }
}
