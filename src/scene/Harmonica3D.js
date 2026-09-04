import * as THREE from 'three';
import gsap from 'gsap';

/**
 * Harmonica3D: Professional 12-Hole Chromatic Concert Harmonica
 * - Mirror-polished stainless steel cover plates with acoustic sound vents.
 * - Pearwood / black resin comb with 12 precision-beveled air chamber blow/draw holes.
 * - Solid brass reed plates with individual micro-reeds.
 * - Spring-loaded chromatic slide button on right cheek (depresses on sharps/flats).
 * - Studio isolation cradle stand with satin chrome gooseneck and shockmount rings.
 * - Physical animation: Concentric translucent breath wave rings pulsing from active chamber hole,
 *   chromatic slide button action, and acoustic "wah-wah" hand cup resonance sway.
 */
export class Harmonica3D {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();

    // Stage position: Front-right melodic section near winds & acoustic guitar
    this.group.position.set(1.15, 1.22, 2.30);
    this.group.rotation.set(-0.06, -0.22, 0.04);

    this.holes = [];
    this.breathRings = [];
    this.activeNotes = new Map();
    this.vibratoPhase = 0;

    this._buildMaterials();
    this._buildStand();
    this._buildComb();
    this._buildCoverPlates();
    this._buildSlideButton();
    this._buildBreathRings();

    this.scene.add(this.group);
  }

  _buildMaterials() {
    // 1. Mirror Chrome Stainless Steel (Cover Plates, Screws, Slide Button)
    this.chromeMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xf4f6f9,
      emissive: 0x050d18,
      emissiveIntensity: 0.12,
      roughness: 0.06,
      metalness: 0.98,
      clearcoat: 1.0,
      clearcoatRoughness: 0.03
    });

    // 2. High-Grade Black Pearwood / Polished Acetoid Comb (Peine)
    this.combMaterial = new THREE.MeshStandardMaterial({
      color: 0x161413,
      roughness: 0.45,
      metalness: 0.08
    });

    // 3. Acoustic Chamber Dark Interior
    this.chamberInteriorMaterial = new THREE.MeshBasicMaterial({
      color: 0x080605
    });

    // 4. Solid Bell Brass (Reed Plates & Micro Reeds)
    this.brassMaterial = new THREE.MeshStandardMaterial({
      color: 0xe5bf54,
      roughness: 0.22,
      metalness: 0.90
    });

    // 5. Studio Stand Satin Chrome & Shockmount Rubber
    this.standChromeMaterial = new THREE.MeshStandardMaterial({
      color: 0xccd3dc,
      roughness: 0.28,
      metalness: 0.88
    });

    this.rubberMaterial = new THREE.MeshStandardMaterial({
      color: 0x1a1a1d,
      roughness: 0.90,
      metalness: 0.02
    });

    // 6. Translucent Breath Wave Ring Material
    this.breathMaterial = new THREE.MeshBasicMaterial({
      color: 0x88ddff,
      transparent: true,
      opacity: 0.0,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending
    });

    // 7. Active Chamber Glow Material
    this.glowMaterial = new THREE.MeshBasicMaterial({
      color: 0x44bbff,
      transparent: true,
      opacity: 0.0,
      blending: THREE.AdditiveBlending
    });
  }

  /* ------------------------------------------------------------------ */
  /*  STUDIO ISOLATION CRADLE STAND                                     */
  /* ------------------------------------------------------------------ */
  _buildStand() {
    this.standGroup = new THREE.Group();

    // Telescoping Chrome Mast from floor deck up to cradle
    const mastGeom = new THREE.CylinderGeometry(0.014, 0.018, 1.15, 16);
    const mast = new THREE.Mesh(mastGeom, this.standChromeMaterial);
    mast.position.set(0, -0.60, -0.04);
    mast.castShadow = true;
    this.standGroup.add(mast);

    // Tripod Base on floor
    const tripodHubGeom = new THREE.CylinderGeometry(0.038, 0.045, 0.04, 16);
    const tripodHub = new THREE.Mesh(tripodHubGeom, this.rubberMaterial);
    tripodHub.position.set(0, -1.18, -0.04);
    this.standGroup.add(tripodHub);

    for (let i = 0; i < 3; i++) {
      const angle = (i / 3) * Math.PI * 2;
      const legGeom = new THREE.CylinderGeometry(0.010, 0.010, 0.38, 12);
      const leg = new THREE.Mesh(legGeom, this.standChromeMaterial);
      leg.rotation.z = Math.PI / 2 - 0.22;
      leg.rotation.y = angle;
      leg.position.set(Math.cos(angle) * 0.18, -1.21, -0.04 + Math.sin(angle) * 0.18);
      this.standGroup.add(leg);
    }

    // Swivel Knuckle Joint
    const jointGeom = new THREE.SphereGeometry(0.022, 14, 10);
    const joint = new THREE.Mesh(jointGeom, this.standChromeMaterial);
    joint.position.set(0, -0.04, -0.04);
    this.standGroup.add(joint);

    // Dual Cradle Claws holding harmonica body gently from underneath
    [-0.075, 0.075].forEach(cx => {
      const clawGeom = new THREE.TorusGeometry(0.032, 0.005, 8, 16, Math.PI);
      const claw = new THREE.Mesh(clawGeom, this.standChromeMaterial);
      claw.rotation.x = Math.PI / 2;
      claw.position.set(cx, -0.012, 0);
      this.standGroup.add(claw);

      const cushionGeom = new THREE.BoxGeometry(0.016, 0.008, 0.035);
      const cushion = new THREE.Mesh(cushionGeom, this.rubberMaterial);
      cushion.position.set(cx, -0.022, 0);
      this.standGroup.add(cushion);
    });

    this.group.add(this.standGroup);
  }

  /* ------------------------------------------------------------------ */
  /*  PEINE (COMB) & 12 AIR CHAMBER HOLES                               */
  /* ------------------------------------------------------------------ */
  _buildComb() {
    this.bodyGroup = new THREE.Group();

    // Harmonica overall dimensions: Width 0.26m (26cm), Height 0.036m (3.6cm), Depth 0.052m (5.2cm)
    const combGeom = new THREE.BoxGeometry(0.24, 0.024, 0.046);
    const combMesh = new THREE.Mesh(combGeom, this.combMaterial);
    combMesh.castShadow = true;
    combMesh.receiveShadow = true;
    this.bodyGroup.add(combMesh);

    // Upper and Lower Brass Reed Plates
    [-0.0125, 0.0125].forEach(ry => {
      const plateGeom = new THREE.BoxGeometry(0.242, 0.0022, 0.047);
      const plateMesh = new THREE.Mesh(plateGeom, this.brassMaterial);
      plateMesh.position.y = ry;
      plateMesh.castShadow = true;
      this.bodyGroup.add(plateMesh);
    });

    // 12 Precision Air Chamber Holes (Mouthpiece Front Face: Z = +0.023)
    const numHoles = 12;
    const holeSpan = 0.20;
    const holeWidth = 0.011;
    const holeHeight = 0.013;
    const startX = -holeSpan / 2 + holeWidth / 2;
    const stepX = holeSpan / (numHoles - 1);

    for (let i = 0; i < numHoles; i++) {
      const hx = startX + i * stepX;
      // Hole frame aperture (recessed dark chamber)
      const hGeom = new THREE.BoxGeometry(holeWidth, holeHeight, 0.008);
      const hMesh = new THREE.Mesh(hGeom, this.chamberInteriorMaterial);
      hMesh.position.set(hx, 0, 0.023);
      this.bodyGroup.add(hMesh);

      // Brass divider separator teeth between holes
      if (i < numHoles - 1) {
        const divGeom = new THREE.BoxGeometry(stepX - holeWidth, holeHeight + 0.004, 0.006);
        const divMesh = new THREE.Mesh(divGeom, this.combMaterial);
        divMesh.position.set(hx + stepX / 2, 0, 0.024);
        this.bodyGroup.add(divMesh);
      }

      // Chamber active glow plane
      const glowGeom = new THREE.PlaneGeometry(holeWidth * 1.4, holeHeight * 1.4);
      const glowMesh = new THREE.Mesh(glowGeom, this.glowMaterial.clone());
      glowMesh.position.set(hx, 0, 0.025);
      glowMesh.visible = false;
      this.bodyGroup.add(glowMesh);

      // Map hole to pitch range:
      // Hole 0 corresponds to C4 (#60), Hole 11 to D7 (#98)
      // Base MIDI note for each hole in standard C chromatic tuning
      const baseNote = 60 + Math.round((i / 11) * 36);

      this.holes.push({
        index: i,
        x: hx,
        baseNote,
        glowMesh,
        origin: new THREE.Vector3(hx, 0, 0.026)
      });
    }

    // Mouthpiece Beveled Chrome Guide Bar along front edge
    const mouthBarGeom = new THREE.BoxGeometry(0.246, 0.005, 0.008);
    [0.012, -0.012].forEach(my => {
      const bar = new THREE.Mesh(mouthBarGeom, this.chromeMaterial);
      bar.position.set(0, my, 0.024);
      this.bodyGroup.add(bar);
    });

    this.group.add(this.bodyGroup);
  }

  /* ------------------------------------------------------------------ */
  /*  COVER PLATES (MIRROR CHROME TOP & BOTTOM WITH ACOUSTIC VENTS)     */
  /* ------------------------------------------------------------------ */
  _buildCoverPlates() {
    this.coversGroup = new THREE.Group();

    // Top Cover Plate (Curved aerodynamic chrome shell)
    const plateShape = new THREE.Shape();
    plateShape.moveTo(-0.125, -0.024);
    plateShape.lineTo(0.125, -0.024);
    plateShape.quadraticCurveTo(0.125, 0.024, 0.120, 0.024);
    plateShape.lineTo(-0.120, 0.024);
    plateShape.quadraticCurveTo(-0.125, 0.024, -0.125, -0.024);

    // Top cover with embossed arch
    const topCoverGeom = new THREE.CylinderGeometry(0.046, 0.046, 0.245, 24, 1, false, 0, Math.PI * 0.42);
    topCoverGeom.rotateZ(Math.PI / 2);
    topCoverGeom.rotateY(Math.PI);

    const topCover = new THREE.Mesh(topCoverGeom, this.chromeMaterial);
    topCover.position.set(0, 0.013, -0.002);
    topCover.scale.set(1.0, 0.55, 0.95);
    topCover.castShadow = true;
    this.coversGroup.add(topCover);

    // Bottom Cover Plate (Mirrored underside shell)
    const bottomCover = topCover.clone();
    bottomCover.rotation.x = Math.PI;
    bottomCover.position.set(0, -0.013, -0.002);
    this.coversGroup.add(bottomCover);

    // Rear Acoustic Sound Exhaust Vents (5 elongated vents on rear side)
    for (let i = -2; i <= 2; i++) {
      const ventGeom = new THREE.BoxGeometry(0.034, 0.012, 0.004);
      const vent = new THREE.Mesh(ventGeom, this.chamberInteriorMaterial);
      vent.position.set(i * 0.045, 0, -0.024);
      this.coversGroup.add(vent);
    }

    // Left and Right End Cheek Caps
    [-0.123, 0.123].forEach(cx => {
      const capGeom = new THREE.BoxGeometry(0.006, 0.032, 0.048);
      const cap = new THREE.Mesh(capGeom, this.chromeMaterial);
      cap.position.set(cx, 0, 0);
      this.coversGroup.add(cap);

      // Fastener Screws
      [0.009, -0.009].forEach(sy => {
        const screwGeom = new THREE.CylinderGeometry(0.0028, 0.0028, 0.002, 10);
        const screw = new THREE.Mesh(screwGeom, this.brassMaterial);
        screw.rotation.z = Math.PI / 2;
        screw.position.set(cx + (cx > 0 ? 0.003 : -0.003), sy, 0);
        this.coversGroup.add(screw);
      });
    });

    this.group.add(this.coversGroup);
  }

  /* ------------------------------------------------------------------ */
  /*  CHROMATIC SPRING SLIDE BUTTON (RIGHT SIDE CHEEK)                  */
  /* ------------------------------------------------------------------ */
  _buildSlideButton() {
    this.slideGroup = new THREE.Group();
    // Rest position: protruding 0.018m to the right (+X)
    this.slideGroup.position.set(0.126, 0, 0.012);

    // Chrome Slider Stem
    const stemGeom = new THREE.CylinderGeometry(0.0032, 0.0032, 0.022, 12);
    const stem = new THREE.Mesh(stemGeom, this.chromeMaterial);
    stem.rotation.z = Math.PI / 2;
    stem.position.set(0.011, 0, 0);
    this.slideGroup.add(stem);

    // Ergonomic Knurled Push Button Cap
    const btnGeom = new THREE.CylinderGeometry(0.0075, 0.0075, 0.010, 16);
    const btn = new THREE.Mesh(btnGeom, this.chromeMaterial);
    btn.rotation.z = Math.PI / 2;
    btn.position.set(0.022, 0, 0);
    btn.castShadow = true;
    this.slideGroup.add(btn);

    this.restSlideX = this.slideGroup.position.x;
    this.group.add(this.slideGroup);
  }

  /* ------------------------------------------------------------------ */
  /*  BREATH WAVE PULSES (Acoustic Air Rings)                           */
  /* ------------------------------------------------------------------ */
  _buildBreathRings() {
    this.fxGroup = new THREE.Group();
    for (let i = 0; i < 10; i++) {
      const ringGeom = new THREE.RingGeometry(0.008, 0.024, 18);
      const ringMesh = new THREE.Mesh(ringGeom, this.breathMaterial.clone());
      ringMesh.visible = false;
      this.fxGroup.add(ringMesh);
      this.breathRings.push(ringMesh);
    }
    this.group.add(this.fxGroup);
  }

  _triggerBreathRing(holeObj, vel) {
    const ring = this.breathRings.find(r => !r.visible) || this.breathRings[0];
    if (!ring) return;

    ring.position.copy(holeObj.origin);
    ring.scale.set(0.2, 0.2, 0.2);
    ring.material.opacity = 0.90;
    ring.visible = true;

    gsap.killTweensOf(ring.position);
    gsap.killTweensOf(ring.scale);
    gsap.killTweensOf(ring.material);

    // Expand forward in Z towards audience
    gsap.to(ring.position, {
      z: holeObj.origin.z + 0.16 + vel * 0.10,
      y: holeObj.origin.y + (Math.random() - 0.5) * 0.02,
      duration: 0.42,
      ease: 'power1.out'
    });

    gsap.to(ring.scale, {
      x: 2.2 + vel * 1.2,
      y: 2.2 + vel * 1.2,
      duration: 0.42,
      ease: 'power2.out'
    });

    gsap.to(ring.material, {
      opacity: 0,
      duration: 0.42,
      ease: 'power2.out',
      onComplete: () => {
        ring.visible = false;
      }
    });
  }

  /* ------------------------------------------------------------------ */
  /*  NOTE PLAYBACK & BREATH DYNAMICS                                   */
  /* ------------------------------------------------------------------ */
  onNoteOn(midiPitch, velocity = 0.8) {
    const vel = Math.max(0.2, Math.min(1.0, velocity));

    // 1. Find best matching hole
    let bestHole = this.holes[0];
    let minDiff = 999;
    for (const h of this.holes) {
      const diff = Math.abs(h.baseNote - midiPitch);
      if (diff < minDiff) {
        minDiff = diff;
        bestHole = h;
      }
    }

    // 2. Chromatic slide button press for accidentals (C#, D#, F#, G#, A#)
    const semitone = midiPitch % 12;
    const isSharp = [1, 3, 6, 8, 10].includes(semitone);

    if (isSharp && this.slideGroup) {
      gsap.killTweensOf(this.slideGroup.position);
      // Press inward by 0.009m
      this.slideGroup.position.x = this.restSlideX - 0.009;
      gsap.to(this.slideGroup.position, {
        x: this.restSlideX,
        duration: 0.28,
        ease: 'elastic.out(1.4, 0.3)'
      });
    }

    // 3. Trigger Acoustic Breath Ring
    this._triggerBreathRing(bestHole, vel);

    // 4. Chamber Glow
    if (bestHole.glowMesh) {
      bestHole.glowMesh.visible = true;
      bestHole.glowMesh.material.opacity = 0.85;
      gsap.killTweensOf(bestHole.glowMesh.material);
      gsap.to(bestHole.glowMesh.material, {
        opacity: 0,
        duration: 0.35,
        ease: 'power2.out',
        onComplete: () => {
          bestHole.glowMesh.visible = false;
        }
      });
    }

    // 5. Acoustic "Wah-Wah" Hand Cupping Vibrato Tilt
    gsap.killTweensOf(this.group.rotation);
    const wahX = -0.06 + (Math.sin(midiPitch) * 0.035) * vel;
    const wahZ = 0.04 + (Math.cos(midiPitch) * 0.045) * vel;

    gsap.to(this.group.rotation, {
      x: wahX,
      z: wahZ,
      duration: 0.08,
      ease: 'power2.out',
      onComplete: () => {
        gsap.to(this.group.rotation, {
          x: -0.06,
          z: 0.04,
          duration: 0.38,
          ease: 'power2.out'
        });
      }
    });

    this.activeNotes.set(midiPitch, {
      hole: bestHole,
      time: performance.now()
    });
  }

  onNoteOff(midiPitch) {
    this.activeNotes.delete(midiPitch);
  }

  update(delta) {
    if (!this.group.visible) return;
    this.vibratoPhase += delta * 2.0;
  }
}
