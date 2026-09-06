import * as THREE from 'three';

/**
 * Shared procedural textures and materials for StageMonitor3D
 * to minimize draw calls and GPU memory footprint across multiple monitors.
 */
let sharedMaterials = null;

function getSharedMaterials() {
  if (sharedMaterials) return sharedMaterials;

  // Procedural perforated steel mesh texture
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#222226';
  ctx.fillRect(0, 0, 256, 256);
  ctx.fillStyle = '#050507';
  const step = 8;
  const rad = 2.4;
  for (let y = 0; y < 256; y += step) {
    const offset = (y / step % 2) * (step / 2);
    for (let x = 0; x < 256; x += step) {
      ctx.beginPath();
      ctx.arc(x + offset, y, rad, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  const grilleTex = new THREE.CanvasTexture(canvas);
  grilleTex.wrapS = THREE.RepeatWrapping;
  grilleTex.wrapT = THREE.RepeatWrapping;
  grilleTex.repeat.set(5, 3);

  sharedMaterials = {
    // Road-ready textured polyurea / DuraFlex cabinet
    cabinet: new THREE.MeshStandardMaterial({
      color: 0x1e1e22,
      roughness: 0.82,
      metalness: 0.15,
      shadowSide: THREE.DoubleSide
    }),
    // Front baffle plate under drivers
    bafflePlate: new THREE.MeshStandardMaterial({
      color: 0x141417,
      roughness: 0.68,
      metalness: 0.2,
      shadowSide: THREE.DoubleSide
    }),
    // Perforated steel protective mesh grille
    grille: new THREE.MeshStandardMaterial({
      color: 0x36363d,
      roughness: 0.32,
      metalness: 0.82,
      map: grilleTex,
      transparent: true,
      opacity: 0.86
    }),
    // Steel framing & chassis
    steel: new THREE.MeshStandardMaterial({
      color: 0x33333a,
      roughness: 0.28,
      metalness: 0.88
    }),
    // Bright chrome hardware & hex bolts
    chrome: new THREE.MeshStandardMaterial({
      color: 0xeeeeee,
      roughness: 0.12,
      metalness: 0.98
    }),
    // Molded vulcanized rubber for feet and woofer surround
    rubber: new THREE.MeshStandardMaterial({
      color: 0x151518,
      roughness: 0.9,
      metalness: 0.05
    }),
    // Woofer ribbed cone paper/composite
    cone: new THREE.MeshStandardMaterial({
      color: 0x343742,
      roughness: 0.38,
      metalness: 0.22,
      side: THREE.DoubleSide
    }),
    // Glossy rubber roll surround
    surround: new THREE.MeshStandardMaterial({
      color: 0x141418,
      roughness: 0.22,
      metalness: 0.45
    }),
    // Horn waveguide throat
    horn: new THREE.MeshStandardMaterial({
      color: 0x18181c,
      roughness: 0.32,
      metalness: 0.7
    }),
    // Speakon connector blue collar
    speakon: new THREE.MeshStandardMaterial({
      color: 0x0055cc,
      roughness: 0.32,
      metalness: 0.6
    }),
    // Cyan logo strip
    cyanAccent: new THREE.MeshBasicMaterial({
      color: 0x00f0ff
    }),
    // Active Signal / Power LED
    ledActive: new THREE.MeshBasicMaterial({
      color: 0x00ffaa
    })
  };

  return sharedMaterials;
}

/**
 * StageMonitor3D creates a tour-grade stage wedge foldback monitor speaker:
 * - Extruded asymmetrical wedge cabinet with side cheeks & recessed baffle
 * - 4 non-slip rubber feet resting flush on floor
 * - 12" high-excursion low-frequency woofer with cast chassis & hex bolts
 * - High-frequency exponential compression horn
 * - Dual tuned bass-reflex acoustic ports
 * - Clean open baffle for maximum visibility of vibrating cone
 * - Recessed side carry handles & rear Neutrik Speakon dish
 * - Dynamic audio-reactive woofer cone excursion animation
 */
export class StageMonitor3D {
  constructor({ faceAudience = true, mirrorLayout = false } = {}) {
    this.group = new THREE.Group();
    this.mats = getSharedMaterials();
    this.mirrorLayout = mirrorLayout;

    this.wooferCone = null;
    this.signalLed = null;
    this.currentExcursion = 0;

    this._buildCabinet();
    this._buildBaffleAndDrivers();
    this._buildHandlesAndHardware();

    if (!faceAudience) {
      this.group.rotation.y = Math.PI;
    }
  }

  _buildCabinet() {
    // Dimensions of tour-grade trapezoidal wedge cabinet
    const frontWidth = 0.58;
    const backWidth = 0.42;
    const zFront = 0.18;
    const zBack = -0.17;
    const totalDepth = zFront - zBack; // 0.35m

    const yFloor = 0.002;
    const yLip = 0.052;
    const yTop = 0.315;

    const zBaffleTop = -0.075;
    const zTopBack = -0.125;

    this.hw = function(z) {
      const t = (z - zBack) / totalDepth;
      return (backWidth + t * (frontWidth - backWidth)) / 2;
    };

    const wall = 0.022; // Side cheek thickness
    const lipRecess = 0.020;
    const topRecess = 0.018;

    const pos = [];
    const norm = [];

    // Helper to add a triangle with computed outward normal
    function addTri(p0, p1, p2) {
      const vA = new THREE.Vector3(...p0);
      const vB = new THREE.Vector3(...p1);
      const vC = new THREE.Vector3(...p2);
      const n = new THREE.Vector3().crossVectors(
        new THREE.Vector3().subVectors(vB, vA),
        new THREE.Vector3().subVectors(vC, vA)
      ).normalize();
      [vA, vB, vC].forEach(v => {
        pos.push(v.x, v.y, v.z);
        norm.push(n.x, n.y, n.z);
      });
    }

    function addQuad(p0, p1, p2, p3) {
      addTri(p0, p1, p2);
      addTri(p0, p2, p3);
    }

    const wFront = this.hw(zFront);
    const wBack = this.hw(zBack);
    const wBaffleTop = this.hw(zBaffleTop);
    const wTopBack = this.hw(zTopBack);

    // Outer hull points:
    const p_BF_L = [-wFront, yFloor, zFront];
    const p_BF_R = [ wFront, yFloor, zFront];
    const p_BB_L = [-wBack, yFloor, zBack];
    const p_BB_R = [ wBack, yFloor, zBack];

    const p_LF_L = [-wFront, yLip, zFront];
    const p_LF_R = [ wFront, yLip, zFront];

    const p_TO_L = [-wBaffleTop, yTop, zBaffleTop];
    const p_TO_R = [ wBaffleTop, yTop, zBaffleTop];

    const p_TB_L = [-wTopBack, yTop, zTopBack];
    const p_TB_R = [ wTopBack, yTop, zTopBack];

    // 1. Bottom Face (Y = yFloor, normal pointing down -Y)
    addQuad(p_BF_R, p_BF_L, p_BB_L, p_BB_R);

    // 2. Front Lip Outer Face (Z = zFront, normal pointing +Z)
    addQuad(p_BF_L, p_BF_R, p_LF_R, p_LF_L);

    // 3. Rear Sloped Face (angled ~50°, normal pointing -Z/-Y)
    addQuad(p_BB_R, p_BB_L, p_TB_L, p_TB_R);

    // 4. Top Flat Bevel Plate (normal pointing +Y)
    addQuad(p_TO_L, p_TO_R, p_TB_R, p_TB_L);

    // 5. Left Side Cheek (Tapered outer cheek, normal pointing -X)
    addTri(p_BF_L, p_LF_L, p_TO_L);
    addTri(p_BF_L, p_TO_L, p_TB_L);
    addTri(p_BF_L, p_TB_L, p_BB_L);

    // 6. Right Side Cheek (Tapered outer cheek, normal pointing +X)
    addTri(p_BF_R, p_TO_R, p_LF_R);
    addTri(p_BF_R, p_TB_R, p_TO_R);
    addTri(p_BF_R, p_BB_R, p_TB_R);

    // Recessed Inner Baffle Steps (Side cheek inner walls):
    const in_LF_L = [-wFront + wall, yLip, zFront - lipRecess];
    const in_LF_R = [ wFront - wall, yLip, zFront - lipRecess];
    const in_TO_L = [-wBaffleTop + wall, yTop - 0.015, zBaffleTop + topRecess];
    const in_TO_R = [ wBaffleTop - wall, yTop - 0.015, zBaffleTop + topRecess];

    this.baffleBounds = { in_LF_L, in_LF_R, in_TO_L, in_TO_R };

    // Front lip top ledge (step back)
    addQuad(p_LF_L, p_LF_R, in_LF_R, in_LF_L);

    // Top bevel underside ledge (step forward)
    addQuad(in_TO_L, in_TO_R, p_TO_R, p_TO_L);

    // Left cheek inner face
    addQuad(p_LF_L, in_LF_L, in_TO_L, p_TO_L);

    // Right cheek inner face
    addQuad(p_LF_R, p_TO_R, in_TO_R, in_LF_R);

    const cabGeom = new THREE.BufferGeometry();
    cabGeom.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    cabGeom.setAttribute('normal', new THREE.Float32BufferAttribute(norm, 3));

    const cabMesh = new THREE.Mesh(cabGeom, this.mats.cabinet);
    cabMesh.castShadow = true;
    cabMesh.receiveShadow = true;
    this.group.add(cabMesh);

    // 4 Vulcanized Rubber Feet resting flush at floor level
    const footGeom = new THREE.CylinderGeometry(0.016, 0.018, 0.004, 16);
    const zF = 0.15;
    const zB = -0.14;
    const feetPos = [
      [-this.hw(zB) + 0.04, 0.002, zB],
      [ this.hw(zB) - 0.04, 0.002, zB],
      [-this.hw(zF) + 0.04, 0.002, zF],
      [ this.hw(zF) - 0.04, 0.002, zF]
    ];
    feetPos.forEach(([fx, fy, fz]) => {
      const foot = new THREE.Mesh(footGeom, this.mats.rubber);
      foot.position.set(fx, fy, fz);
      foot.castShadow = true;
      this.group.add(foot);
    });
  }

  _buildBaffleAndDrivers() {
    const { in_LF_L, in_LF_R, in_TO_L, in_TO_R } = this.baffleBounds;

    // Recessed Baffle Plate (spanning between inner lip and top edges - solid front panel of box)
    const bafflePos = [];
    const baffleNorm = [];
    function addBaffleQuad(p0, p1, p2, p3) {
      const vA = new THREE.Vector3(...p0);
      const vB = new THREE.Vector3(...p1);
      const vC = new THREE.Vector3(...p2);
      const vD = new THREE.Vector3(...p3);
      const n = new THREE.Vector3().crossVectors(
        new THREE.Vector3().subVectors(vB, vA),
        new THREE.Vector3().subVectors(vC, vA)
      ).normalize();
      [vA, vB, vC, vA, vC, vD].forEach(v => {
        bafflePos.push(v.x, v.y, v.z);
        baffleNorm.push(n.x, n.y, n.z);
      });
    }
    addBaffleQuad(in_LF_L, in_LF_R, in_TO_R, in_TO_L);
    const baffleGeom = new THREE.BufferGeometry();
    baffleGeom.setAttribute('position', new THREE.Float32BufferAttribute(bafflePos, 3));
    baffleGeom.setAttribute('normal', new THREE.Float32BufferAttribute(baffleNorm, 3));

    const bafflePlate = new THREE.Mesh(baffleGeom, this.mats.bafflePlate);
    bafflePlate.castShadow = true;
    bafflePlate.receiveShadow = true;
    this.group.add(bafflePlate);

    // Compute baffle center and tilt angle
    const baffleCenter = new THREE.Vector3()
      .addVectors(new THREE.Vector3(...in_LF_L), new THREE.Vector3(...in_TO_R))
      .multiplyScalar(0.5);
    const deltaY = in_TO_L[1] - in_LF_L[1];
    const deltaZ = in_TO_L[2] - in_LF_L[2];
    const baffleAngle = Math.atan2(deltaY, -deltaZ);

    const baffleGroup = new THREE.Group();
    baffleGroup.position.copy(baffleCenter);
    baffleGroup.rotation.x = -(Math.PI / 2 - baffleAngle);
    this.group.add(baffleGroup);

    const sign = this.mirrorLayout ? -1 : 1;

    // 12" LOW-FREQUENCY WOOFER (internal driver components do NOT cast shadows outside the box)
    const wooferGroup = new THREE.Group();
    wooferGroup.position.set(-0.095 * sign, -0.005, 0.005);
    baffleGroup.add(wooferGroup);

    // Cast Chassis Basket Ring
    const basketRing = new THREE.Mesh(new THREE.TorusGeometry(0.108, 0.008, 10, 32), this.mats.steel);
    basketRing.castShadow = false;
    basketRing.receiveShadow = true;
    wooferGroup.add(basketRing);

    // Hex Mounting Bolts (6 bolts around circumference)
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      const bolt = new THREE.Mesh(new THREE.CylinderGeometry(0.003, 0.003, 0.005, 6), this.mats.chrome);
      bolt.rotation.x = Math.PI / 2;
      bolt.position.set(Math.cos(a) * 0.11, Math.sin(a) * 0.11, 0.005);
      bolt.castShadow = false;
      wooferGroup.add(bolt);
    }

    // Flexible Rubber Roll Surround
    const surround = new THREE.Mesh(new THREE.TorusGeometry(0.096, 0.008, 12, 36), this.mats.surround);
    surround.position.z = 0.005;
    surround.castShadow = false;
    wooferGroup.add(surround);

    // Dynamic vibrating woofer assembly (cone + dust cap)
    this.wooferCone = new THREE.Group();
    wooferGroup.add(this.wooferCone);

    const coneGeom = new THREE.CylinderGeometry(0.088, 0.030, 0.024, 32, 1, true);
    coneGeom.rotateX(Math.PI / 2);
    coneGeom.translate(0, 0, -0.007);
    const coneMesh = new THREE.Mesh(coneGeom, this.mats.cone);
    coneMesh.castShadow = false;
    this.wooferCone.add(coneMesh);

    const capGeom = new THREE.SphereGeometry(0.032, 20, 14, 0, Math.PI * 2, 0, Math.PI * 0.35);
    capGeom.rotateX(Math.PI / 2);
    capGeom.translate(0, 0, -0.033);
    const cap = new THREE.Mesh(capGeom, this.mats.surround);
    cap.castShadow = false;
    this.wooferCone.add(cap);

    // HIGH-FREQUENCY COMPRESSION HORN (Tweeter)
    const hornGroup = new THREE.Group();
    hornGroup.position.set(0.115 * sign, 0.035, 0.005);
    baffleGroup.add(hornGroup);

    const hornFlare = new THREE.Mesh(new THREE.BoxGeometry(0.115, 0.080, 0.010), this.mats.horn);
    hornFlare.castShadow = false;
    hornFlare.receiveShadow = true;
    hornGroup.add(hornFlare);

    const hornBezel = new THREE.Mesh(new THREE.RingGeometry(0.032, 0.040, 24), this.mats.steel);
    hornBezel.position.z = 0.006;
    hornBezel.castShadow = false;
    hornGroup.add(hornBezel);

    const bullet = new THREE.Mesh(new THREE.ConeGeometry(0.012, 0.016, 16), this.mats.chrome);
    bullet.rotation.x = Math.PI / 2;
    bullet.position.z = 0.002;
    bullet.castShadow = false;
    hornGroup.add(bullet);

    // DUAL TUNED BASS REFLEX PORTS
    [ [0.085, -0.07], [0.145, -0.07] ].forEach(([px, py]) => {
      const rim = new THREE.Mesh(new THREE.TorusGeometry(0.020, 0.0035, 8, 18), this.mats.steel);
      rim.position.set(px * sign, py, 0.005);
      rim.castShadow = false;
      baffleGroup.add(rim);

      const hole = new THREE.Mesh(new THREE.CircleGeometry(0.018, 18), new THREE.MeshBasicMaterial({ color: 0x030304 }));
      hole.position.set(px * sign, py, 0.004);
      baffleGroup.add(hole);
    });

    // PRO AUDIO BRAND BADGE
    const badge = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.016, 0.004), this.mats.chrome);
    badge.position.set(0, -0.11, 0.005);
    badge.castShadow = false;
    baffleGroup.add(badge);

    const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.066, 0.002, 0.005), this.mats.cyanAccent);
    stripe.position.set(0, -0.114, 0.007);
    baffleGroup.add(stripe);

    // ACTIVE STATUS LED
    this.signalLed = new THREE.Mesh(new THREE.SphereGeometry(0.003, 10, 10), this.mats.ledActive);
    this.signalLed.position.set((-0.17) * sign, -0.11, 0.005);
    baffleGroup.add(this.signalLed);
  }

  _buildHandlesAndHardware() {
    // Rear Speakon connection dish on angled back panel (no external shadows)
    const zB_val = -0.17;
    const zTB_val = -0.125;
    const yF_val = 0.012;
    const yT_val = 0.315;
    const rearZ = zB_val + 0.018;
    const rearY = yF_val + 0.075;

    const rearDish = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.065, 0.006), this.mats.steel);
    rearDish.position.set(0, rearY, rearZ);
    rearDish.castShadow = false;
    const rearSlope = Math.atan2(yT_val - yF_val, zTB_val - zB_val);
    rearDish.rotation.x = Math.PI / 2 - rearSlope;
    this.group.add(rearDish);

    [-0.03, 0.03].forEach(bx => {
      const sp = new THREE.Mesh(new THREE.TorusGeometry(0.010, 0.0025, 8, 14), this.mats.speakon);
      sp.position.set(bx, rearY, rearZ - 0.003);
      sp.rotation.copy(rearDish.rotation);
      sp.castShadow = false;
      this.group.add(sp);
    });
  }

  /**
   * Update audio-reactive vibration of the woofer cone.
   * Excursion pulses along normal of baffle during bass beats.
   */
  update(delta, musicEnergy = 0, showPulse = 0) {
    if (!this.wooferCone) return;

    // Target excursion amplitude (0 to 10 mm max travel)
    const targetExcursion = Math.min(0.010, musicEnergy * 0.0075 + showPulse * 0.004);
    const smooth = 1 - Math.exp(-delta / 0.05);
    this.currentExcursion = THREE.MathUtils.lerp(this.currentExcursion, targetExcursion, smooth);

    // Rest position is 0 in woofer local Z
    this.wooferCone.position.z = this.currentExcursion;
  }
}
