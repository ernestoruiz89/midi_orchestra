import * as THREE from 'three';
import gsap from 'gsap';

/**
 * Saxophone3D: Highly Detailed, Realistic Alto/Tenor Saxophone with:
 * - Authentic conical bore body in hand-polished gold brass lacquer
 * - Curved S-neck (tudel) with cork, octave key mechanism, ebonite mouthpiece, ligature, and cane reed
 * - Lower U-bow bend with protective wire rib guard
 * - Graceful exponential flared bell with rolled rim bead and low key guards
 * - Full mechanical keywork: 6 pearl inlay key cups, side chromatic rods, and octave lever
 * - Professional stage stand with dual padded cradles (yoke and bow cradle)
 * - Realistic key cup depression and acoustic bell recoil on note-on
 */
export class Saxophone3D {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();
    // Positioned front-right stage with space from guitar and trumpet
    this.group.position.set(3.4, 1.25, 1.8);
    // Natural playing angle
    this.group.rotation.set(0.06, -Math.PI * 0.32, 0.08);

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
      color: 0xebb12c,
      roughness: 0.16,
      metalness: 0.88,
      clearcoat: 0.85,
      clearcoatRoughness: 0.06
    });

    // Inner bell shaded gold
    this.innerBellMaterial = new THREE.MeshStandardMaterial({
      color: 0xcf9820,
      roughness: 0.32,
      metalness: 0.82,
      side: THREE.BackSide
    });

    // Mother of pearl key buttons
    this.pearlMaterial = new THREE.MeshStandardMaterial({
      color: 0xfffcf5,
      roughness: 0.22,
      metalness: 0.06
    });

    // Chrome/nickel rods, octave key, and hardware
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
      roughness: 0.6,
      metalness: 0.2
    });
  }

  _buildStand() {
    const stand = new THREE.Group();
    stand.position.set(0, -1.25, 0);

    // Central mast
    const pole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.014, 0.014, 1.20, 12),
      this.standMaterial
    );
    pole.position.y = 0.60;
    stand.add(pole);

    // Tripod Base with 3 legs
    for (let i = 0; i < 3; i++) {
      const angle = (i * Math.PI * 2) / 3;
      const legGroup = new THREE.Group();
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

    // Lower Padded Bow Cradle
    const lowerCradle = new THREE.Mesh(
      new THREE.TorusGeometry(0.075, 0.014, 8, 16, Math.PI),
      this.standMaterial
    );
    lowerCradle.position.set(0, 0.40, 0.08);
    lowerCradle.rotation.x = Math.PI / 2;
    stand.add(lowerCradle);

    // Upper Padded Body Yoke Cradle
    const upperYoke = new THREE.Mesh(
      new THREE.TorusGeometry(0.055, 0.012, 8, 16, Math.PI),
      this.standMaterial
    );
    upperYoke.position.set(0, 0.95, -0.04);
    upperYoke.rotation.x = Math.PI / 2;
    stand.add(upperYoke);

    this.group.add(stand);
  }

  _buildSaxophone() {
    const sax = new THREE.Group();
    this.saxBody = sax;

    // ==========================================
    // 1. CONICAL MAIN BODY TUBE
    // ==========================================
    // Tapers from top collar (r = 0.022) to bottom (r = 0.046), height = 0.68
    const bodyHeight = 0.68;
    const mainBody = new THREE.Mesh(
      new THREE.CylinderGeometry(0.022, 0.046, bodyHeight, 24),
      this.brassMaterial
    );
    mainBody.position.set(0, 0, 0);
    mainBody.castShadow = true;
    sax.add(mainBody);

    // Top neck tenon collar ring
    const topCollar = new THREE.Mesh(
      new THREE.CylinderGeometry(0.025, 0.025, 0.022, 20),
      this.brassMaterial
    );
    topCollar.position.y = bodyHeight / 2 + 0.01;
    sax.add(topCollar);

    // Tenon screw clamp
    const tenonScrew = new THREE.Mesh(
      new THREE.BoxGeometry(0.008, 0.012, 0.018),
      this.chromeMaterial
    );
    tenonScrew.position.set(0.026, bodyHeight / 2 + 0.01, 0);
    sax.add(tenonScrew);

    // ==========================================
    // 2. CURVED S-NECK (TUDEL) & MOUTHPIECE
    // ==========================================
    const neckGroup = new THREE.Group();
    neckGroup.position.set(0, bodyHeight / 2 + 0.02, 0);

    // Smooth arched tube for neck
    const neckCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 0.06, -0.01),
      new THREE.Vector3(0, 0.12, -0.04),
      new THREE.Vector3(0, 0.16, -0.10),
      new THREE.Vector3(0, 0.17, -0.17)
    ]);
    const neckGeom = new THREE.TubeGeometry(neckCurve, 20, 0.013, 12, false);
    const neckMesh = new THREE.Mesh(neckGeom, this.brassMaterial);
    neckGroup.add(neckMesh);

    // Octave key mechanism on top of neck
    const octaveKey = new THREE.Mesh(
      new THREE.CylinderGeometry(0.002, 0.002, 0.12, 8).rotateX(Math.PI * 0.40),
      this.chromeMaterial
    );
    octaveKey.position.set(0, 0.15, -0.07);
    neckGroup.add(octaveKey);

    // Octave pip pad
    const octavePad = new THREE.Mesh(
      new THREE.CylinderGeometry(0.005, 0.005, 0.004, 10),
      this.brassMaterial
    );
    octavePad.position.set(0, 0.175, -0.12);
    neckGroup.add(octavePad);

    // Natural Cork Sleeve at tip of neck
    const cork = new THREE.Mesh(
      new THREE.CylinderGeometry(0.011, 0.011, 0.038, 16).rotateX(Math.PI / 2),
      this.corkMaterial
    );
    cork.position.set(0, 0.17, -0.18);
    neckGroup.add(cork);

    // Ebonite Black Mouthpiece
    const mpBeak = new THREE.Mesh(
      new THREE.CylinderGeometry(0.010, 0.012, 0.065, 14).rotateX(Math.PI / 2),
      this.eboniteMaterial
    );
    mpBeak.position.set(0, 0.17, -0.23);
    neckGroup.add(mpBeak);

    // Wooden Cane Reed underneath
    const reed = new THREE.Mesh(
      new THREE.BoxGeometry(0.013, 0.003, 0.055),
      this.reedMaterial
    );
    reed.position.set(0, 0.16, -0.23);
    neckGroup.add(reed);

    // Gold Brass Ligature collar with tightening screws
    const ligature = new THREE.Mesh(
      new THREE.CylinderGeometry(0.013, 0.013, 0.024, 14).rotateX(Math.PI / 2),
      this.brassMaterial
    );
    ligature.position.set(0, 0.17, -0.22);
    neckGroup.add(ligature);

    sax.add(neckGroup);

    // ==========================================
    // 3. LOWER U-BOW (ELBOW BEND)
    // ==========================================
    const bowRadius = 0.088;
    const bowTubeRadius = 0.042;
    const bowGeom = new THREE.TorusGeometry(bowRadius, bowTubeRadius, 14, 28, Math.PI);
    bowGeom.rotateY(Math.PI / 2);
    const bow = new THREE.Mesh(bowGeom, this.brassMaterial);
    bow.position.set(0, -bodyHeight / 2, bowRadius);
    bow.castShadow = true;
    sax.add(bow);

    // Protective Bow Wire Guard (runs along bottom spine of U-bow)
    const guardGeom = new THREE.TorusGeometry(bowRadius + 0.018, 0.0035, 8, 24, Math.PI);
    guardGeom.rotateY(Math.PI / 2);
    const bowGuard = new THREE.Mesh(guardGeom, this.brassMaterial);
    bowGuard.position.set(0, -bodyHeight / 2, bowRadius);
    sax.add(bowGuard);

    // ==========================================
    // 4. UPTURNED FLARING BELL
    // ==========================================
    const bellGroup = new THREE.Group();
    // Positioned at the end of the U-bow: x = 0, y = -bodyHeight/2, z = bowRadius * 2
    bellGroup.position.set(0, -bodyHeight / 2, bowRadius * 2);
    // Angled forward and upward ~ 18°
    bellGroup.rotation.x = 0.32;

    // Conical bell ascending tube
    const bellStraight = new THREE.Mesh(
      new THREE.CylinderGeometry(0.058, 0.045, 0.32, 20),
      this.brassMaterial
    );
    bellStraight.position.y = 0.16;
    bellStraight.castShadow = true;
    bellGroup.add(bellStraight);

    // Smooth Exponential Bell Flare using LatheGeometry
    const bellFlarePoints = [];
    const segments = 16;
    const startR = 0.058;
    const endR = 0.105; // 21cm wide authentic flared bell opening
    const flareH = 0.18;

    for (let j = 0; j <= segments; j++) {
      const t = j / segments;
      const r = startR + (endR - startR) * Math.pow(t, 2.5);
      const y = t * flareH;
      bellFlarePoints.push(new THREE.Vector2(r, y));
    }

    const bellFlareGeom = new THREE.LatheGeometry(bellFlarePoints, 32);
    const bellOuter = new THREE.Mesh(bellFlareGeom, this.brassMaterial);
    bellOuter.position.y = 0.32;
    bellOuter.castShadow = true;
    bellGroup.add(bellOuter);
    this.bellMesh = bellOuter;

    const bellInner = new THREE.Mesh(bellFlareGeom, this.innerBellMaterial);
    bellInner.position.y = 0.32;
    bellGroup.add(bellInner);

    // Rolled Bell Rim Bead (Outer brass ring)
    const bellRim = new THREE.Mesh(
      new THREE.TorusGeometry(endR, 0.0035, 10, 36).rotateX(Math.PI / 2),
      this.brassMaterial
    );
    bellRim.position.y = 0.32 + flareH;
    bellGroup.add(bellRim);

    // Low B/Bb Key Guard wire on front/side of bell
    const lowKeyGuard = new THREE.Mesh(
      new THREE.CylinderGeometry(0.003, 0.003, 0.22, 8),
      this.brassMaterial
    );
    lowKeyGuard.position.set(0.05, 0.22, 0.06);
    lowKeyGuard.rotation.z = 0.15;
    bellGroup.add(lowKeyGuard);

    sax.add(bellGroup);

    // ==========================================
    // 5. KEYWORK, CHIMNEYS, PEARLS & MECHANISMS
    // ==========================================
    // 6 Front Mother-of-Pearl Finger Keys down the body
    const keyYPositions = [0.24, 0.16, 0.08, -0.06, -0.14, -0.22];

    keyYPositions.forEach((y, idx) => {
      const keyGroup = new THREE.Group();
      // Positioned on the front face of the conical body facing audience
      const bodyR = 0.022 + (0.046 - 0.022) * ((bodyHeight / 2 - y) / bodyHeight);
      keyGroup.position.set(-0.016, y, bodyR * 0.85);
      keyGroup.rotation.y = -0.35;

      // Brass Key Cup
      const cup = new THREE.Mesh(
        new THREE.CylinderGeometry(0.014, 0.014, 0.006, 16).rotateX(Math.PI / 2),
        this.brassMaterial
      );
      keyGroup.add(cup);

      // Pearl Button Inlay
      const pearl = new THREE.Mesh(
        new THREE.CylinderGeometry(0.011, 0.011, 0.003, 16).rotateX(Math.PI / 2),
        this.pearlMaterial
      );
      pearl.position.z = 0.003;
      keyGroup.add(pearl);

      sax.add(keyGroup);

      this.keyPads.push({
        group: keyGroup,
        baseZ: keyGroup.position.z,
        index: idx
      });
    });

    // Longitudinal Chrome Key Rods along the spine (ribs & hinge tubes)
    const rod1 = new THREE.Mesh(
      new THREE.CylinderGeometry(0.003, 0.003, 0.55, 8),
      this.chromeMaterial
    );
    rod1.position.set(0.038, 0, 0.01);
    sax.add(rod1);

    const rod2 = new THREE.Mesh(
      new THREE.CylinderGeometry(0.003, 0.003, 0.50, 8),
      this.chromeMaterial
    );
    rod2.position.set(-0.038, -0.04, 0.01);
    sax.add(rod2);

    // Ergonomic Brass Thumb Hook on the back
    const thumbHook = new THREE.Mesh(
      new THREE.TorusGeometry(0.012, 0.003, 8, 16, Math.PI * 0.75),
      this.brassMaterial
    );
    thumbHook.position.set(0, 0.04, 0.035);
    thumbHook.rotation.y = Math.PI / 2;
    sax.add(thumbHook);

    this.group.add(sax);
  }

  _buildShockwaveRings() {
    for (let i = 0; i < 4; i++) {
      const ringGeom = new THREE.TorusGeometry(0.10, 0.009, 8, 24).rotateX(Math.PI / 2);
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0xffcc00,
        transparent: true,
        opacity: 0
      });
      const ring = new THREE.Mesh(ringGeom, ringMat);
      // Positioned near bell flare opening
      ring.position.set(0, 0.12, 0.28);
      this.group.add(ring);
      this.shockwaveRings.push(ring);
    }
  }

  onNoteOn(midiPitch, velocity = 0.8) {
    const vel = Math.max(0.3, Math.min(1.0, velocity));

    // 1. Realistic Saxophone Key Cup Depression
    const pressedCount = (midiPitch % 6) + 1;
    this.keyPads.forEach((k, idx) => {
      const isDown = idx < pressedCount;
      const targetZ = isDown ? k.baseZ + 0.008 : k.baseZ;

      gsap.killTweensOf(k.group.position);
      gsap.to(k.group.position, {
        z: targetZ,
        duration: 0.04,
        ease: 'power2.out',
        onComplete: () => {
          gsap.to(k.group.position, {
            z: k.baseZ,
            duration: 0.14,
            delay: 0.05,
            ease: 'power1.in'
          });
        }
      });
    });

    // 2. Acoustic Bell & Body Sway
    if (this.saxBody) {
      gsap.killTweensOf(this.saxBody.position);
      gsap.killTweensOf(this.saxBody.rotation);

      gsap.to(this.saxBody.position, {
        y: 0.012 * vel,
        z: -0.015 * vel,
        duration: 0.06,
        ease: 'power2.out',
        yoyo: true,
        repeat: 1
      });

      gsap.to(this.saxBody.rotation, {
        x: -0.035 * vel,
        duration: 0.07,
        ease: 'power2.out',
        yoyo: true,
        repeat: 1
      });
    }

    // 3. Acoustic Shockwave Ring Emission
    const idleRing = this.shockwaveRings.find(r => r.material.opacity <= 0.05);
    if (idleRing) {
      idleRing.position.set(0, 0.12, 0.28);
      idleRing.scale.set(1, 1, 1);
      idleRing.material.opacity = 0.85 * vel;

      gsap.killTweensOf(idleRing.position);
      gsap.killTweensOf(idleRing.scale);
      gsap.killTweensOf(idleRing.material);

      gsap.to(idleRing.position, {
        y: 0.8,
        z: 1.2,
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
    // Gentle idle acoustic sway
    if (this.saxBody) {
      this.saxBody.rotation.y = Math.sin(Date.now() * 0.0016) * 0.012;
    }
  }
}
