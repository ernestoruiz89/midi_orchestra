import * as THREE from 'three';
import gsap from 'gsap';

/**
 * Saxophone3D: Perfectly Centered & Symmetrical Alto Saxophone
 * - 100% Centered geometry: Body, Neck, U-Bow, and Bell (Trompa) all share the EXACT same central axis (x = 0)
 * - From above, the neck and the bell are in 100% straight coaxial alignment with the body (zero skew, zero offset)
 * - Clean curved neck (tudel) with black mouthpiece, gold ligature, and natural cork
 * - Flared bell rising directly centered in front of the body with rolled rim bead
 * - 6 mother-of-pearl finger buttons in their true ergonomic positions:
 *   - Upper stack (Left hand): Keys 1, 2, 3 (B, A, G)
 *   - Lower stack (Right hand): Keys 4, 5, 6 (F, E, D)
 * - Clean stage stand with padded cradles
 * - Realistic key depression and acoustic recoil on note-on
 */
export class Saxophone3D {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();
    // Positioned front-right stage
    this.group.position.set(3.4, 1.25, 1.8);
    // Bell faces the audience (+Z direction)
    this.group.rotation.set(0.04, -Math.PI * 0.18, 0.06);

    this.keyPads = [];
    this.bellMesh = null;
    this.saxBody = null;
    this.shockwaveRings = [];

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
      roughness: 0.15,
      metalness: 0.88,
      clearcoat: 0.85,
      clearcoatRoughness: 0.06
    });

    // Darker warm gold inner bell shade
    this.innerBellMaterial = new THREE.MeshStandardMaterial({
      color: 0xcf9820,
      roughness: 0.30,
      metalness: 0.82,
      side: THREE.BackSide
    });

    // Mother-of-pearl finger buttons
    this.pearlMaterial = new THREE.MeshStandardMaterial({
      color: 0xfffcf6,
      roughness: 0.22,
      metalness: 0.06
    });

    // Chrome hardware
    this.chromeMaterial = new THREE.MeshStandardMaterial({
      color: 0xd6d8de,
      roughness: 0.14,
      metalness: 0.92
    });

    // Black ebonite mouthpiece
    this.eboniteMaterial = new THREE.MeshStandardMaterial({
      color: 0x141416,
      roughness: 0.28,
      metalness: 0.15
    });

    // Cane reed
    this.reedMaterial = new THREE.MeshStandardMaterial({
      color: 0xdeb887,
      roughness: 0.65,
      metalness: 0.05
    });

    // Natural neck cork
    this.corkMaterial = new THREE.MeshStandardMaterial({
      color: 0xc8a165,
      roughness: 0.80,
      metalness: 0.02
    });

    // Black satin stand
    this.standMaterial = new THREE.MeshStandardMaterial({
      color: 0x1c1c20,
      roughness: 0.60,
      metalness: 0.25
    });
  }

  _buildStand() {
    const stand = new THREE.Group();
    stand.position.set(0, -1.25, 0);

    // Central mast centered at x = 0
    const pole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.014, 0.014, 1.20, 12),
      this.standMaterial
    );
    pole.position.set(0, 0.60, -0.04);
    stand.add(pole);

    // Tripod Base with 3 legs
    for (let i = 0; i < 3; i++) {
      const angle = (i * Math.PI * 2) / 3;
      const legGroup = new THREE.Group();
      legGroup.position.set(0, 0, -0.04);
      legGroup.rotation.y = angle;

      const leg = new THREE.Mesh(
        new THREE.CylinderGeometry(0.009, 0.009, 0.40, 8),
        this.standMaterial
      );
      leg.position.set(0.18, 0.09, 0);
      leg.rotation.z = -Math.PI * 0.35;
      legGroup.add(leg);

      const foot = new THREE.Mesh(
        new THREE.SphereGeometry(0.016, 8, 8),
        this.standMaterial
      );
      foot.position.set(0.33, 0.015, 0);
      legGroup.add(foot);

      stand.add(legGroup);
    }

    // Lower Padded Bow Cradle centered at x = 0
    const lowerCradle = new THREE.Mesh(
      new THREE.TorusGeometry(0.075, 0.014, 8, 16, Math.PI),
      this.standMaterial
    );
    lowerCradle.position.set(0, 0.38, 0.06);
    lowerCradle.rotation.x = Math.PI / 2;
    stand.add(lowerCradle);

    // Upper Padded Body Yoke Cradle centered at x = 0
    const upperYoke = new THREE.Mesh(
      new THREE.TorusGeometry(0.045, 0.012, 8, 16, Math.PI),
      this.standMaterial
    );
    upperYoke.position.set(0, 0.90, -0.04);
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
    // 1. STRAIGHT CONICAL BODY TUBE (Centered at x = 0, z = 0)
    // ==========================================
    const mainBody = new THREE.Mesh(
      new THREE.CylinderGeometry(rTop, rBot, bodyHeight, 28),
      this.brassMaterial
    );
    mainBody.position.set(0, 0, 0);
    mainBody.castShadow = true;
    sax.add(mainBody);

    // Top neck collar ring centered at x = 0, z = 0
    const topCollar = new THREE.Mesh(
      new THREE.CylinderGeometry(0.024, 0.024, 0.020, 20),
      this.brassMaterial
    );
    topCollar.position.set(0, bodyHeight / 2 + 0.010, 0);
    sax.add(topCollar);

    // ==========================================
    // 2. NECK (TUDEL) & MOUTHPIECE (Centered at x = 0, curves straight along -Z)
    // ==========================================
    const neckY_start = bodyHeight / 2 + 0.020;
    const neckY_apex = bodyHeight / 2 + 0.145;
    const neckZ_end = -0.150;

    // Smooth continuous curve in the YZ plane (strictly x = 0!)
    const neckCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, neckY_start, 0.000),
      new THREE.Vector3(0, neckY_start + 0.060, -0.015),
      new THREE.Vector3(0, neckY_start + 0.105, -0.045),
      new THREE.Vector3(0, neckY_apex, -0.095),
      new THREE.Vector3(0, neckY_apex, neckZ_end) // Strictly horizontal exit tangent along -Z!
    ]);

    const neckMesh = new THREE.Mesh(
      new THREE.TubeGeometry(neckCurve, 20, 0.011, 16, false),
      this.brassMaterial
    );
    neckMesh.castShadow = true;
    sax.add(neckMesh);

    // Natural Neck Cork: Perfectly coaxial cylinder along Z at x = 0
    const corkLen = 0.032;
    const corkZ = neckZ_end - corkLen / 2;
    const cork = new THREE.Mesh(
      new THREE.CylinderGeometry(0.0098, 0.0098, corkLen, 16).rotateX(Math.PI / 2),
      this.corkMaterial
    );
    cork.position.set(0, neckY_apex, corkZ);
    sax.add(cork);

    // Ebonite Black Mouthpiece: Perfectly coaxial along Z at x = 0
    const mpLen = 0.058;
    const mpZ = neckZ_end - corkLen - mpLen / 2;
    const mpMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.0095, 0.0118, mpLen, 16).rotateX(Math.PI / 2),
      this.eboniteMaterial
    );
    mpMesh.position.set(0, neckY_apex, mpZ);
    sax.add(mpMesh);

    // Cane Reed underneath mouthpiece at x = 0
    const reed = new THREE.Mesh(
      new THREE.BoxGeometry(0.012, 0.003, mpLen * 0.85),
      this.reedMaterial
    );
    reed.position.set(0, neckY_apex - 0.010, mpZ);
    sax.add(reed);

    // Gold Brass Ligature collar holding reed at x = 0
    const ligature = new THREE.Mesh(
      new THREE.CylinderGeometry(0.0122, 0.0122, 0.018, 16).rotateX(Math.PI / 2),
      this.brassMaterial
    );
    ligature.position.set(0, neckY_apex, mpZ + 0.010);
    sax.add(ligature);

    // ==========================================
    // 3. LOWER U-BOW (Centered at x = 0, curves smoothly forward along +Z)
    // ==========================================
    const bowZ_end = 0.130;
    const bowCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, -bodyHeight / 2, 0.000),
      new THREE.Vector3(0, -bodyHeight / 2 - 0.080, 0.020),
      new THREE.Vector3(0, -bodyHeight / 2 - 0.105, 0.065),
      new THREE.Vector3(0, -bodyHeight / 2 - 0.080, 0.110),
      new THREE.Vector3(0, -bodyHeight / 2, bowZ_end)
    ]);
    const bowMesh = new THREE.Mesh(
      new THREE.TubeGeometry(bowCurve, 24, 0.038, 18, false),
      this.brassMaterial
    );
    bowMesh.castShadow = true;
    sax.add(bowMesh);

    // ==========================================
    // 4. BELL ("LA TROMPA") - 100% CENTERED AT x = 0!
    // Directly aligned in front of the body along the Z-axis
    // ==========================================
    const bellGroup = new THREE.Group();
    // Positioned at end of U-bow: x = 0, y = -bodyHeight/2, z = bowZ_end
    bellGroup.position.set(0, -bodyHeight / 2, bowZ_end);
    // Tilted slightly forward (~14°) for natural acoustic projection
    bellGroup.rotation.x = 0.24;

    // Ascending bell tube centered at x = 0
    const bellTube = new THREE.Mesh(
      new THREE.CylinderGeometry(0.054, 0.038, 0.22, 22),
      this.brassMaterial
    );
    bellTube.position.y = 0.11;
    bellTube.castShadow = true;
    bellGroup.add(bellTube);

    // Smooth Exponential Bell Flare centered at x = 0
    const bellFlarePoints = [];
    const segments = 20;
    const startR = 0.054;
    const endR = 0.092; // 18.4cm authentic flared horn opening
    const flareH = 0.16;

    for (let j = 0; j <= segments; j++) {
      const t = j / segments;
      const r = startR + (endR - startR) * Math.pow(t, 2.5);
      const y = t * flareH;
      bellFlarePoints.push(new THREE.Vector2(r, y));
    }

    const bellFlareGeom = new THREE.LatheGeometry(bellFlarePoints, 32);
    const bellOuter = new THREE.Mesh(bellFlareGeom, this.brassMaterial);
    bellOuter.position.y = 0.22;
    bellOuter.castShadow = true;
    bellGroup.add(bellOuter);
    this.bellMesh = bellOuter;

    const bellInner = new THREE.Mesh(bellFlareGeom, this.innerBellMaterial);
    bellInner.position.y = 0.22;
    bellGroup.add(bellInner);

    // Rolled Bell Rim Bead at opening
    const bellRim = new THREE.Mesh(
      new THREE.TorusGeometry(endR, 0.0030, 10, 36).rotateX(Math.PI / 2),
      this.brassMaterial
    );
    bellRim.position.y = 0.22 + flareH;
    bellGroup.add(bellRim);

    // Low Key Cups on the bell
    const lowKey1 = new THREE.Mesh(
      new THREE.CylinderGeometry(0.016, 0.016, 0.006, 14).rotateY(Math.PI / 2),
      this.brassMaterial
    );
    lowKey1.position.set(0.046, 0.15, 0);
    bellGroup.add(lowKey1);

    const lowKey2 = new THREE.Mesh(
      new THREE.CylinderGeometry(0.018, 0.018, 0.006, 14).rotateY(Math.PI / 2),
      this.brassMaterial
    );
    lowKey2.position.set(-0.046, 0.10, 0);
    bellGroup.add(lowKey2);

    sax.add(bellGroup);

    // ==========================================
    // 5. ANATOMICAL PEARL FINGER BUTTONS (On the body tube)
    // ==========================================
    // Left Hand (Upper Stack): 3 main pearl buttons (B, A, G)
    // Right Hand (Lower Stack): 3 main pearl buttons (F, E, D)
    // Angled slightly (~22°) to player's left so they are clearly visible alongside the bell
    const fingerKeyPositions = [
      // Upper stack (Left hand)
      { y: 0.135, name: 'B' },
      { y: 0.085, name: 'A' },
      { y: 0.035, name: 'G' },
      // Lower stack (Right hand)
      { y: -0.065, name: 'F' },
      { y: -0.115, name: 'E' },
      { y: -0.165, name: 'D' }
    ];

    const keyAngle = 0.38; // 22° offset for ergonomic side visibility
    fingerKeyPositions.forEach((k, idx) => {
      const keyGroup = new THREE.Group();

      const tNorm = (bodyHeight / 2 - k.y) / bodyHeight;
      const bodyRadiusAtY = rTop + (rBot - rTop) * tNorm;

      const kx = Math.sin(keyAngle) * (bodyRadiusAtY + 0.003);
      const kz = Math.cos(keyAngle) * (bodyRadiusAtY + 0.003);

      keyGroup.position.set(kx, k.y, kz);
      keyGroup.rotation.y = keyAngle;

      // Gold Brass Key Cup
      const cup = new THREE.Mesh(
        new THREE.CylinderGeometry(0.0135, 0.0135, 0.005, 18).rotateX(Math.PI / 2),
        this.brassMaterial
      );
      keyGroup.add(cup);

      // Mother-of-Pearl Button Inlay
      const pearl = new THREE.Mesh(
        new THREE.CylinderGeometry(0.0105, 0.0105, 0.003, 18).rotateX(Math.PI / 2),
        this.pearlMaterial
      );
      pearl.position.z = 0.003;
      keyGroup.add(pearl);

      sax.add(keyGroup);

      this.keyPads.push({
        group: keyGroup,
        baseZ: keyGroup.position.z,
        baseX: keyGroup.position.x,
        index: idx
      });
    });

    // Ergonomic Thumb Hook on the back (-Z) for player's right thumb at x = 0
    const thumbRest = new THREE.Mesh(
      new THREE.TorusGeometry(0.010, 0.003, 8, 14, Math.PI * 0.75).rotateY(Math.PI / 2),
      this.brassMaterial
    );
    thumbRest.position.set(0, -0.015, -0.035);
    sax.add(thumbRest);

    this.group.add(sax);
  }

  _buildShockwaveRings() {
    for (let i = 0; i < 4; i++) {
      const ringGeom = new THREE.TorusGeometry(0.10, 0.008, 8, 24).rotateX(Math.PI / 2);
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0xffcc00,
        transparent: true,
        opacity: 0
      });
      const ring = new THREE.Mesh(ringGeom, ringMat);
      // Located at the opening of the centered bell flare
      ring.position.set(0, 0.06, 0.18);
      this.group.add(ring);
      this.shockwaveRings.push(ring);
    }
  }

  onNoteOn(midiPitch, velocity = 0.8) {
    const vel = Math.max(0.3, Math.min(1.0, velocity));

    // Realistic Saxophone Key Cup Depression
    const pressedCount = (midiPitch % 6) + 1;
    this.keyPads.forEach((k, idx) => {
      const isDown = idx < pressedCount;
      const targetZ = isDown ? k.baseZ - 0.006 : k.baseZ;
      const targetX = isDown ? k.baseX - 0.003 : k.baseX;

      gsap.killTweensOf(k.group.position);
      gsap.to(k.group.position, {
        z: targetZ,
        x: targetX,
        duration: 0.04,
        ease: 'power2.out',
        onComplete: () => {
          gsap.to(k.group.position, {
            z: k.baseZ,
            x: k.baseX,
            duration: 0.14,
            delay: 0.05,
            ease: 'power1.in'
          });
        }
      });
    });

    // Acoustic Bell & Body Recoil
    if (this.saxBody) {
      gsap.killTweensOf(this.saxBody.position);
      gsap.killTweensOf(this.saxBody.rotation);

      gsap.to(this.saxBody.position, {
        y: 0.010 * vel,
        duration: 0.06,
        ease: 'power2.out',
        yoyo: true,
        repeat: 1
      });

      gsap.to(this.saxBody.rotation, {
        x: -0.020 * vel,
        duration: 0.07,
        ease: 'power2.out',
        yoyo: true,
        repeat: 1
      });
    }

    // Acoustic Shockwave Ring Emission
    const idleRing = this.shockwaveRings.find(r => r.material.opacity <= 0.05);
    if (idleRing) {
      idleRing.position.set(0, 0.06, 0.18);
      idleRing.scale.set(1, 1, 1);
      idleRing.material.opacity = 0.85 * vel;

      gsap.killTweensOf(idleRing.position);
      gsap.killTweensOf(idleRing.scale);
      gsap.killTweensOf(idleRing.material);

      gsap.to(idleRing.position, {
        y: 0.7,
        z: 0.9,
        duration: 0.60,
        ease: 'power1.out'
      });
      gsap.to(idleRing.scale, {
        x: 3.5,
        y: 3.5,
        z: 3.5,
        duration: 0.60,
        ease: 'power1.out'
      });
      gsap.to(idleRing.material, {
        opacity: 0,
        duration: 0.60,
        ease: 'power2.in'
      });
    }
  }

  onNoteOff(midiPitch) {
    // Smooth reset
  }

  update(delta) {
    // Gentle idle acoustic stage sway
    if (this.saxBody) {
      this.saxBody.rotation.y = Math.sin(Date.now() * 0.0016) * 0.012;
    }
  }
}
