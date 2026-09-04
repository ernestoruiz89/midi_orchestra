import * as THREE from 'three';
import gsap from 'gsap';

/**
 * Cabasa3D: Professional Concert Afuche-Cabasa Percussion Instrument
 * - Horizontally grooved / corrugated stainless steel cylinder core
 * - Steel ball-bearing bead chain loops wrapped around cylinder
 * - Turned mahogany hardwood circular top and bottom end-caps
 * - Ergonomic contoured wooden handle with chrome cap
 * - Professional percussion floor stand with velvet-cushioned cradle
 * - Authentic high-velocity twist & scrape rotational recoil on note-on
 */
export class Cabasa3D {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();

    // Positioned in the auxiliary percussion section (adjacent to drum riser and xylophone)
    this.group.position.set(-1.2, 1.15, 1.9);
    // Tilted slightly up and towards audience for optimal visibility
    this.group.rotation.set(0.18, Math.PI * 0.22, -0.12);

    this.cabasaModel = null;
    this.beadCylinder = null;
    this.sparkleRings = [];
    this.twistDirection = 1;

    this._buildMaterials();
    this._buildStand();
    this._buildCabasa();
    this._buildSparkleRings();

    this.scene.add(this.group);
  }

  _buildMaterials() {
    // Rich turned mahogany hardwood with clear varnish
    this.woodMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x5a2312,
      roughness: 0.28,
      metalness: 0.05,
      clearcoat: 0.65,
      clearcoatRoughness: 0.08
    });

    // Mirror-polished stainless steel (corrugated core & hardware)
    this.steelMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xe8ecf0,
      roughness: 0.12,
      metalness: 0.95,
      clearcoat: 0.90
    });

    // Brilliant chrome for steel bead ball chains
    this.beadMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xf5f7fa,
      roughness: 0.08,
      metalness: 0.98,
      clearcoat: 1.0,
      clearcoatRoughness: 0.03
    });

    // Dark grooves in the corrugated steel cylinder
    this.grooveMaterial = new THREE.MeshStandardMaterial({
      color: 0x2c3038,
      roughness: 0.40,
      metalness: 0.85
    });

    // Stand materials: Heavy studio cast chrome base matching flute and violin
    this.chromeMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xe8ecf2,
      roughness: 0.12,
      metalness: 0.95,
      clearcoat: 0.90,
      clearcoatRoughness: 0.05
    });

    this.standMaterial = new THREE.MeshStandardMaterial({
      color: 0x18181c,
      roughness: 0.85,
      metalness: 0.05
    });
  }

  _buildStand() {
    const stand = new THREE.Group();
    stand.position.set(0, -1.15, 0);

    // 1. Heavy cast round chrome base with beveled edge matching flute and violin
    const base = new THREE.Mesh(
      new THREE.CylinderGeometry(0.16, 0.19, 0.030, 24),
      this.chromeMaterial
    );
    base.position.y = 0.015;
    stand.add(base);

    // 3 Black rubber feet underneath
    for (let i = 0; i < 3; i++) {
      const angle = (i * Math.PI * 2) / 3;
      const foot = new THREE.Mesh(
        new THREE.CylinderGeometry(0.014, 0.014, 0.008, 12),
        this.standMaterial
      );
      foot.position.set(Math.cos(angle) * 0.15, -0.004, Math.sin(angle) * 0.15);
      stand.add(foot);
    }

    // 2. Telescopic central chrome column with locking collar
    const lowerPole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.013, 0.013, 0.60, 14),
      this.chromeMaterial
    );
    lowerPole.position.y = 0.30;
    stand.add(lowerPole);

    const collar = new THREE.Mesh(
      new THREE.CylinderGeometry(0.019, 0.019, 0.038, 16),
      this.chromeMaterial
    );
    collar.position.y = 0.60;
    stand.add(collar);

    const upperPole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.009, 0.009, 0.50, 14),
      this.chromeMaterial
    );
    upperPole.position.y = 0.85;
    stand.add(upperPole);

    // Velvet-padded cradle holding the cabasa handle & base
    const cradle = new THREE.Mesh(
      new THREE.TorusGeometry(0.040, 0.009, 8, 18, Math.PI),
      this.standMaterial
    );
    cradle.position.set(0, 1.05, 0);
    cradle.rotation.x = Math.PI / 2;
    stand.add(cradle);

    this.group.add(stand);
  }

  _buildCabasa() {
    const cabasa = new THREE.Group();
    this.cabasaModel = cabasa;
    cabasa.position.set(0, 0, 0);

    const cylRadius = 0.052; // ~10.4cm diameter
    const cylHeight = 0.125; // ~12.5cm bead cylinder height

    // 1. Turned Hardwood Handle (Extending downward)
    const handleHeight = 0.155;
    const handleGroup = new THREE.Group();
    handleGroup.position.y = -handleHeight / 2 - 0.02;

    // Ergonomically contoured handle
    const handleSegments = [
      { rTop: 0.013, rBot: 0.015, h: 0.04, y: 0.05 },
      { rTop: 0.015, rBot: 0.018, h: 0.05, y: 0.005 }, // Palm swell
      { rTop: 0.018, rBot: 0.014, h: 0.04, y: -0.04 },
      { rTop: 0.014, rBot: 0.016, h: 0.025, y: -0.07 } // Flared pommel
    ];

    handleSegments.forEach(s => {
      const part = new THREE.Mesh(
        new THREE.CylinderGeometry(s.rTop, s.rBot, s.h, 20),
        this.woodMaterial
      );
      part.position.y = s.y;
      handleGroup.add(part);
    });

    // Chrome end cap at bottom of handle
    const handleEndCap = new THREE.Mesh(
      new THREE.CylinderGeometry(0.0165, 0.0165, 0.008, 20),
      this.chromeMaterial
    );
    handleEndCap.position.y = -0.086;
    handleGroup.add(handleEndCap);

    cabasa.add(handleGroup);

    // 2. Bottom Hardwood Flange Disc
    const bottomDisc = new THREE.Mesh(
      new THREE.CylinderGeometry(cylRadius * 1.15, cylRadius * 1.10, 0.024, 32),
      this.woodMaterial
    );
    bottomDisc.position.y = -0.012;
    cabasa.add(bottomDisc);

    // Chrome washer ring above bottom disc
    const washerBottom = new THREE.Mesh(
      new THREE.CylinderGeometry(cylRadius * 1.05, cylRadius * 1.05, 0.006, 28),
      this.steelMaterial
    );
    washerBottom.position.y = 0.003;
    cabasa.add(washerBottom);

    // 3. Rotating Bead & Cylinder Core Group (Rotates during twist-scrape)
    const coreGroup = new THREE.Group();
    this.beadCylinder = coreGroup;
    coreGroup.position.y = cylHeight / 2 + 0.006;

    // Stainless steel central cylinder with horizontal rib serrations
    const coreCylinder = new THREE.Mesh(
      new THREE.CylinderGeometry(cylRadius, cylRadius, cylHeight, 36),
      this.steelMaterial
    );
    coreGroup.add(coreCylinder);

    // Corrugated horizontal metal ridges/ribs
    const numRibs = 14;
    for (let r = 0; r < numRibs; r++) {
      const ribY = -cylHeight / 2 + (r + 0.5) * (cylHeight / numRibs);
      const rib = new THREE.Mesh(
        new THREE.TorusGeometry(cylRadius + 0.0008, 0.0012, 6, 32),
        this.grooveMaterial
      );
      rib.position.y = ribY;
      rib.rotation.x = Math.PI / 2;
      coreGroup.add(rib);
    }

    // Wrapped Steel Ball-Bearing Bead Chain Loops
    // Multiple concentric rings of steel beads that rattle against the ridges
    const numBeadRings = 10;
    const beadsPerRing = 26;
    const beadRadius = 0.0038;

    for (let ring = 0; ring < numBeadRings; ring++) {
      const ringY = -cylHeight / 2 + 0.012 + ring * ((cylHeight - 0.024) / (numBeadRings - 1));
      const ringGroup = new THREE.Group();
      ringGroup.position.y = ringY;

      // Stagger alternating rows for realistic interlocking bead mesh
      const angleOffset = (ring % 2) * (Math.PI / beadsPerRing);

      for (let b = 0; b < beadsPerRing; b++) {
        const theta = (b * Math.PI * 2) / beadsPerRing + angleOffset;
        const bead = new THREE.Mesh(
          new THREE.SphereGeometry(beadRadius, 8, 8),
          this.beadMaterial
        );
        bead.position.set(
          Math.cos(theta) * (cylRadius + beadRadius * 0.95),
          0,
          Math.sin(theta) * (cylRadius + beadRadius * 0.95)
        );
        ringGroup.add(bead);
      }
      coreGroup.add(ringGroup);
    }

    cabasa.add(coreGroup);

    // 4. Top Hardwood Flange Disc & Dome Cap
    const topDiscY = cylHeight + 0.012;
    const topDisc = new THREE.Mesh(
      new THREE.CylinderGeometry(cylRadius * 1.10, cylRadius * 1.15, 0.024, 32),
      this.woodMaterial
    );
    topDisc.position.y = topDiscY;
    cabasa.add(topDisc);

    // Turned dome finial on top of hardwood cap
    const topFinial = new THREE.Mesh(
      new THREE.SphereGeometry(0.018, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2),
      this.woodMaterial
    );
    topFinial.position.y = topDiscY + 0.012;
    cabasa.add(topFinial);

    // Decorative chrome center bolt
    const topBolt = new THREE.Mesh(
      new THREE.CylinderGeometry(0.006, 0.006, 0.005, 12),
      this.chromeMaterial
    );
    topBolt.position.y = topDiscY + 0.028;
    cabasa.add(topBolt);

    this.group.add(cabasa);
  }

  _buildSparkleRings() {
    for (let i = 0; i < 4; i++) {
      const ring = new THREE.Mesh(
        new THREE.RingGeometry(0.055, 0.085, 20),
        new THREE.MeshBasicMaterial({
          color: 0xffeeaa,
          transparent: true,
          opacity: 0,
          side: THREE.DoubleSide
        })
      );
      ring.position.set(0, 0.08, 0);
      ring.rotation.x = Math.PI / 2;
      this.group.add(ring);
      this.sparkleRings.push(ring);
    }
  }

  onNoteOn(midiPitch = 69, velocity = 0.8, eventTime = null, trackIndex = null, duration = 0.3) {
    const vel = Math.min(1.0, Math.max(0.25, velocity));

    // Alternate twist direction for authentic rasping sound
    this.twistDirection *= -1;
    const twistAngle = 0.55 * vel * this.twistDirection;

    // 1. Rapid twist-scrape rotation of the bead cylinder
    if (this.beadCylinder) {
      gsap.killTweensOf(this.beadCylinder.rotation);
      gsap.to(this.beadCylinder.rotation, {
        y: this.beadCylinder.rotation.y + twistAngle,
        duration: 0.06,
        ease: 'power2.out',
        onComplete: () => {
          gsap.to(this.beadCylinder.rotation, {
            y: this.beadCylinder.rotation.y - twistAngle * 0.35,
            duration: 0.12,
            ease: 'power1.out'
          });
        }
      });
    }

    // 2. Physical shake & acoustic recoil kick of entire instrument
    if (this.cabasaModel) {
      gsap.killTweensOf(this.cabasaModel.position);
      gsap.killTweensOf(this.cabasaModel.rotation);

      gsap.to(this.cabasaModel.position, {
        y: 0.016 * vel,
        z: 0.010 * vel * this.twistDirection,
        duration: 0.04,
        ease: 'power2.out',
        yoyo: true,
        repeat: 1,
        onComplete: () => {
          this.cabasaModel.position.set(0, 0, 0);
        }
      });

      gsap.to(this.cabasaModel.rotation, {
        z: -0.06 * vel * this.twistDirection,
        duration: 0.05,
        ease: 'power2.out',
        yoyo: true,
        repeat: 1
      });
    }

    // 3. Metallic bead rasp sparkle emission
    const idleRing = this.sparkleRings.find(r => r.material.opacity <= 0.05);
    if (idleRing) {
      idleRing.position.set(0, 0.08, 0);
      idleRing.scale.set(1, 1, 1);
      idleRing.material.opacity = 0.85 * vel;

      gsap.killTweensOf(idleRing.position);
      gsap.killTweensOf(idleRing.scale);
      gsap.killTweensOf(idleRing.material);

      gsap.to(idleRing.position, {
        y: 0.24,
        duration: 0.42,
        ease: 'power1.out'
      });
      gsap.to(idleRing.scale, {
        x: 2.2,
        y: 2.2,
        z: 2.2,
        duration: 0.42,
        ease: 'power1.out'
      });
      gsap.to(idleRing.material, {
        opacity: 0,
        duration: 0.42,
        ease: 'power2.in'
      });
    }
  }

  onNoteOff(midiPitch) {
    // Cabasa is a percussive scrape instrument; note-off settles any residue
  }

  update(delta) {
    // Gentle idle ambient sway
    if (this.cabasaModel) {
      this.cabasaModel.rotation.y = Math.sin(Date.now() * 0.0015) * 0.010;
    }
  }
}
