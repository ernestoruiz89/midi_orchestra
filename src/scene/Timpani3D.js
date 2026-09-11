import * as THREE from 'three';
import gsap from 'gsap';

const MALLET_SHAFT_LENGTH = 0.36;
const MALLET_HEAD_RADIUS = 0.024;
const MALLET_WRIST_HEIGHT = 0.15;
const MALLET_IMPACT_ANGLE = 0.0;
const MALLET_REBOUND_ANGLE = 0.22;
const MALLET_READY_ANGLE = 0.10;
const MALLET_IDLE_TIMEOUT_MS = 1800;

/**
 * Timpani3D: Professional Concert Symphonic Timpani Set (4 Kettle Drums)
 * 
 * - Standard 4-kettle Continental/Orchestral setup:
 *   1. Timpano 1 (32", Bass / Grave): D2 - A2 (MIDI 36-42)
 *   2. Timpano 2 (29", Mid-Low / Mediano Grave): F2 - C3 (MIDI 43-47)
 *   3. Timpano 3 (26", Mid-High / Mediano Agudo): Bb2 - F3 (MIDI 48-52)
 *   4. Timpano 4 (23", High / Agudo): D3 - A3 (MIDI 53-60)
 * 
 * - Physical Construction:
 *   - Lustrous hammered polished copper parabolic bowls (calderos) with PBR specular shine
 *   - Heavy cast chrome counterhoops with 6 square-head tuning tension bolts
 *   - Polished chrome tension struts (spider) connecting hoop down to base
 *   - Cast spider base with tubular legs and rubber-wheeled casters
 *   - Mechanical tuning foot pedal on player's side with linkage rods
 *   - Lettered pitch tuning gauge on player's rim with active indicator needle
 *   - Translucent synthetic mylar drumheads with sweet-spot playing rings
 *   - Dual felt mallets (Left / Right) striking at ~1/3 radius (acoustic nodal sweet spot)
 *   - Elastic membrane deflection, dynamic rebound, and alternating hand rolls
 */
export class Timpani3D {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();

    // Stage placement default (elevation 0.0 at floor level)
    this.group.position.set(0.0, 0.0, -0.80);

    // Drum instances and mallet storage
    this.drums = [];
    this.malletsByDrum = [];
    this.lastHandByDrum = [0, 0, 0, 0]; // 0 = left, 1 = right

    this._buildMaterials();
    this._buildEnsemble();

    this.scene.add(this.group);
  }

  /* ------------------------------------------------------------------ */
  /*  MATERIALS                                                         */
  /* ------------------------------------------------------------------ */

  _buildMaterials() {
    // 1. Lustrous Polished Symphonic Copper Bowl
    this.copperMaterial = new THREE.MeshStandardMaterial({
      color: 0xcc6228,
      roughness: 0.18,
      metalness: 0.90
    });

    // 2. Heavy Cast Chrome Counterhoop, Struts & Pedal Linkages
    this.chromeMaterial = new THREE.MeshStandardMaterial({
      color: 0xf0f4f8,
      roughness: 0.14,
      metalness: 0.96
    });

    // 3. Cast Iron / Dark Steel Base Structure
    this.baseIronMaterial = new THREE.MeshStandardMaterial({
      color: 0x22252a,
      roughness: 0.55,
      metalness: 0.70
    });

    // 4. Translucent Parchment / Mylar Drumhead
    this.headMaterial = new THREE.MeshStandardMaterial({
      color: 0xf7f3ea,
      roughness: 0.40,
      metalness: 0.04,
      transparent: true,
      opacity: 0.93,
      side: THREE.DoubleSide
    });

    // 5. Sweet-spot Acoustic Resonance Ring (1/3 radius guideline)
    this.ringMaterial = new THREE.MeshStandardMaterial({
      color: 0xb5afa2,
      roughness: 0.50,
      metalness: 0.05,
      transparent: true,
      opacity: 0.45,
      side: THREE.DoubleSide
    });

    // 6. Turned Maple Mallet Shaft
    this.woodMaterial = new THREE.MeshStandardMaterial({
      color: 0xdeb887,
      roughness: 0.48,
      metalness: 0.06
    });

    // 7. Compressed Ivory White Felt Mallet Head
    this.feltMaterial = new THREE.MeshStandardMaterial({
      color: 0xf8f6f0,
      roughness: 0.85,
      metalness: 0.02
    });

    // 8. Tuning Gauge Plate (Enamel white) & Indicator Needle (Vibrant red)
    this.gaugePlateMaterial = new THREE.MeshStandardMaterial({
      color: 0xededed,
      roughness: 0.35,
      metalness: 0.10
    });

    this.needleMaterial = new THREE.MeshStandardMaterial({
      color: 0xd92626,
      roughness: 0.30,
      metalness: 0.40
    });
  }

  /* ------------------------------------------------------------------ */
  /*  GEOMETRY GENERATION                                               */
  /* ------------------------------------------------------------------ */

  /**
   * Generates a smooth parabolic symphonic kettle bowl with LatheGeometry
   */
  _createKettleGeometry(radius, depth) {
    const points = [];
    const segments = 24;
    const baseRadius = 0.07;
    const baseHeight = 0.28;

    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      // Parabolic expansion curve
      const y = baseHeight + depth * Math.pow(t, 1.45);
      const r = baseRadius + (radius - baseRadius) * Math.sin(t * (Math.PI * 0.5));
      points.push(new THREE.Vector2(r, y));
    }

    return new THREE.LatheGeometry(points, 36);
  }

  /* ------------------------------------------------------------------ */
  /*  ENSEMBLE BUILDER                                                  */
  /* ------------------------------------------------------------------ */

  _buildEnsemble() {
    // 4 Timpani Configurations with generous acoustic clearances (no rim or spider overlap):
    // Radius in meters, bowl depth, pitch label, note range, explicit (x, z) on stage arc
    const drumConfigs = [
      {
        id: 0,
        name: 'Timpano 32" (Bass)',
        radius: 0.405, // 32" diameter
        depth: 0.52,
        minMidi: 0,
        maxMidi: 42,
        basePitchMidi: 38, // D2
        posX: -1.26,
        posZ: -0.28,
        rotY: -0.55,
        tiltX: -0.07       // Tilt forward so audience/camera sees head
      },
      {
        id: 1,
        name: 'Timpano 29" (Mid-Low)',
        radius: 0.368, // 29" diameter
        depth: 0.49,
        minMidi: 43,
        maxMidi: 47,
        basePitchMidi: 43, // G2
        posX: -0.42,
        posZ: 0.12,
        rotY: -0.18,
        tiltX: -0.07
      },
      {
        id: 2,
        name: 'Timpano 26" (Mid-High)',
        radius: 0.330, // 26" diameter
        depth: 0.46,
        minMidi: 48,
        maxMidi: 52,
        basePitchMidi: 48, // C3
        posX: 0.42,
        posZ: 0.12,
        rotY: 0.18,
        tiltX: -0.07
      },
      {
        id: 3,
        name: 'Timpano 23" (High)',
        radius: 0.292, // 23" diameter
        depth: 0.43,
        minMidi: 53,
        maxMidi: 127,
        basePitchMidi: 53, // F3
        posX: 1.18,
        posZ: -0.24,
        rotY: 0.52,
        tiltX: -0.07
      }
    ];

    drumConfigs.forEach((cfg) => {
      const drumGroup = new THREE.Group();
      drumGroup.position.set(cfg.posX, 0, cfg.posZ);
      drumGroup.rotation.y = cfg.rotY;

      // Build single timpano structure inside this drumGroup
      const drumData = this._buildTimpano(drumGroup, cfg);
      this.drums.push(drumData);

      // Build Left and Right mallets for this drum
      const mallets = this._buildMalletsForDrum(drumGroup, cfg, drumData.headWorldY);
      this.malletsByDrum.push(mallets);

      this.group.add(drumGroup);
    });
  }

  /**
   * Builds an individual Kettle Drum (Bowl, hoop, tension struts, pedal, base, head, gauge)
   */
  _buildTimpano(parentGroup, cfg) {
    const { radius, depth, tiltX } = cfg;
    const rimY = 0.28 + depth;

    // Tilting kettle sub-assembly (for ergonomic audience visibility)
    const kettleAssembly = new THREE.Group();
    kettleAssembly.rotation.x = tiltX;
    parentGroup.add(kettleAssembly);

    // 1. Polished Copper Bowl
    const bowlGeo = this._createKettleGeometry(radius, depth);
    const bowlMesh = new THREE.Mesh(bowlGeo, this.copperMaterial);
    bowlMesh.castShadow = true;
    bowlMesh.receiveShadow = true;
    kettleAssembly.add(bowlMesh);

    // 2. Counterhoop (Rim)
    const hoopGeo = new THREE.CylinderGeometry(radius + 0.016, radius + 0.016, 0.026, 36, 1, true);
    const hoopMesh = new THREE.Mesh(hoopGeo, this.chromeMaterial);
    hoopMesh.position.y = rimY;
    hoopMesh.castShadow = true;
    kettleAssembly.add(hoopMesh);

    // Top rim ring cover
    const rimLipGeo = new THREE.TorusGeometry(radius + 0.008, 0.010, 10, 36);
    rimLipGeo.rotateX(Math.PI * 0.5);
    const rimLipMesh = new THREE.Mesh(rimLipGeo, this.chromeMaterial);
    rimLipMesh.position.y = rimY + 0.012;
    kettleAssembly.add(rimLipMesh);

    // 3. Drumhead (Membrane)
    const headGeo = new THREE.CircleGeometry(radius - 0.004, 36);
    headGeo.rotateX(-Math.PI * 0.5);
    const headMesh = new THREE.Mesh(headGeo, this.headMaterial);
    headMesh.position.y = rimY + 0.009;
    headMesh.receiveShadow = true;
    kettleAssembly.add(headMesh);

    // Sweet-spot striking circle guideline (~1/3 radius from edge = 0.68 of radius)
    const sweetSpotRadius = radius * 0.68;
    const ringGeo = new THREE.RingGeometry(sweetSpotRadius - 0.007, sweetSpotRadius + 0.007, 36);
    ringGeo.rotateX(-Math.PI * 0.5);
    const ringMesh = new THREE.Mesh(ringGeo, this.ringMaterial);
    ringMesh.position.y = rimY + 0.0095;
    kettleAssembly.add(ringMesh);

    // 4. Tension Struts (Spider Mechanism - 6 rods)
    const strutCount = 6;
    const strutRadius = 0.0055;
    const spiderRingRadius = radius * 0.45;
    const spiderY = 0.25;

    for (let i = 0; i < strutCount; i++) {
      const angle = (i / strutCount) * Math.PI * 2;
      const topX = (radius + 0.016) * Math.cos(angle);
      const topZ = (radius + 0.016) * Math.sin(angle);
      const botX = spiderRingRadius * Math.cos(angle);
      const botZ = spiderRingRadius * Math.sin(angle);

      // Tension Lug Bracket on counterhoop
      const lugGeo = new THREE.BoxGeometry(0.024, 0.028, 0.022);
      const lug = new THREE.Mesh(lugGeo, this.chromeMaterial);
      lug.position.set(topX, rimY - 0.01, topZ);
      lug.lookAt(0, rimY - 0.01, 0);
      kettleAssembly.add(lug);

      // Square-head tuning key bolt atop bracket
      const boltGeo = new THREE.CylinderGeometry(0.004, 0.004, 0.022, 8);
      const bolt = new THREE.Mesh(boltGeo, this.chromeMaterial);
      bolt.position.set(topX, rimY + 0.016, topZ);
      kettleAssembly.add(bolt);

      // Connecting rod
      const rodLength = Math.hypot(topX - botX, rimY - spiderY, topZ - botZ);
      const rodGeo = new THREE.CylinderGeometry(strutRadius, strutRadius, rodLength, 10);
      const rod = new THREE.Mesh(rodGeo, this.chromeMaterial);
      rod.position.set((topX + botX) * 0.5, (rimY + spiderY) * 0.5, (topZ + botZ) * 0.5);
      rod.quaternion.setFromUnitVectors(
        new THREE.Vector3(0, 1, 0),
        new THREE.Vector3(topX - botX, rimY - spiderY, topZ - botZ).normalize()
      );
      kettleAssembly.add(rod);
    }

    // Spider Base Ring
    const spiderRingGeo = new THREE.TorusGeometry(spiderRingRadius, 0.014, 10, 28);
    spiderRingGeo.rotateX(Math.PI * 0.5);
    const spiderRing = new THREE.Mesh(spiderRingGeo, this.chromeMaterial);
    spiderRing.position.y = spiderY;
    kettleAssembly.add(spiderRing);

    // 5. Heavy Stand & Casters (Non-tilted base)
    const baseGroup = new THREE.Group();
    parentGroup.add(baseGroup);

    // Center vertical cylinder
    const centerColGeo = new THREE.CylinderGeometry(0.045, 0.055, 0.28, 16);
    const centerCol = new THREE.Mesh(centerColGeo, this.baseIronMaterial);
    centerCol.position.y = 0.14;
    centerCol.castShadow = true;
    baseGroup.add(centerCol);

    // 3 Curved Legs with Caster Wheels
    const legCount = 3;
    const legReach = radius * 0.85;
    for (let i = 0; i < legCount; i++) {
      const angle = (i / legCount) * Math.PI * 2 + Math.PI * 0.15;
      const legGroup = new THREE.Group();
      legGroup.rotation.y = angle;

      const legGeo = new THREE.BoxGeometry(0.032, 0.024, legReach);
      const leg = new THREE.Mesh(legGeo, this.baseIronMaterial);
      leg.position.set(0, 0.07, legReach * 0.5);
      leg.castShadow = true;
      legGroup.add(leg);

      // Caster wheel assembly at tip
      const casterStemGeo = new THREE.CylinderGeometry(0.008, 0.008, 0.045, 8);
      const casterStem = new THREE.Mesh(casterStemGeo, this.chromeMaterial);
      casterStem.position.set(0, 0.04, legReach);
      legGroup.add(casterStem);

      const wheelGeo = new THREE.CylinderGeometry(0.022, 0.022, 0.016, 12);
      wheelGeo.rotateZ(Math.PI * 0.5);
      const wheel = new THREE.Mesh(wheelGeo, this.baseIronMaterial);
      wheel.position.set(0, 0.022, legReach);
      legGroup.add(wheel);

      baseGroup.add(legGroup);
    }

    // 6. Tuning Pedal Mechanism (Facing player, -Z direction)
    const pedalAssembly = new THREE.Group();
    pedalAssembly.position.set(0, 0.02, -0.12);

    const pedalArmGeo = new THREE.BoxGeometry(0.05, 0.018, 0.24);
    const pedalArm = new THREE.Mesh(pedalArmGeo, this.chromeMaterial);
    pedalArm.position.set(0, 0.035, -0.10);
    pedalArm.rotation.x = 0.10;
    pedalArm.castShadow = true;
    pedalAssembly.add(pedalArm);

    // Foot tread plate
    const treadGeo = new THREE.BoxGeometry(0.07, 0.012, 0.11);
    const tread = new THREE.Mesh(treadGeo, this.baseIronMaterial);
    tread.position.set(0, 0.05, -0.18);
    tread.rotation.x = 0.10;
    pedalAssembly.add(tread);

    // Linkage rod extending into kettle center
    const linkRodGeo = new THREE.CylinderGeometry(0.006, 0.006, 0.22, 8);
    const linkRod = new THREE.Mesh(linkRodGeo, this.chromeMaterial);
    linkRod.position.set(0, 0.14, -0.04);
    linkRod.rotation.x = -0.25;
    pedalAssembly.add(linkRod);

    baseGroup.add(pedalAssembly);

    // 7. Pitch Tuning Gauge on player's rim side (-Z)
    const gaugeGroup = new THREE.Group();
    gaugeGroup.position.set(0, rimY + 0.02, -radius - 0.025);

    // Curved plate
    const plateGeo = new THREE.BoxGeometry(0.12, 0.028, 0.010);
    const plate = new THREE.Mesh(plateGeo, this.gaugePlateMaterial);
    gaugeGroup.add(plate);

    // Pointer needle
    const needleGeo = new THREE.ConeGeometry(0.004, 0.024, 6);
    needleGeo.rotateZ(Math.PI);
    const needle = new THREE.Mesh(needleGeo, this.needleMaterial);
    needle.position.set(0, 0.005, -0.008);
    gaugeGroup.add(needle);

    kettleAssembly.add(gaugeGroup);

    return {
      cfg,
      kettleAssembly,
      headMesh,
      sweetSpotRadius,
      rimY,
      headWorldY: rimY + 0.009,
      needle,
      pedalArm,
      restHeadY: headMesh.position.y
    };
  }

  /* ------------------------------------------------------------------ */
  /*  MALLETS SYSTEM                                                    */
  /* ------------------------------------------------------------------ */

  _buildMalletsForDrum(parentGroup, cfg, headHeight) {
    const mallets = [];
    const sweetR = cfg.radius * 0.68;

    // 2 Mallets per drum: 0 = Left Hand, 1 = Right Hand
    // The timpanist stands at -Z, striking the sweet spot at -Z on the membrane
    const handOffsets = [-0.07, 0.07]; // Lateral spacing between mallets

    handOffsets.forEach((offsetX, handIdx) => {
      const isLeft = handIdx === 0;

      // Strike target point exactly on the sweet-spot ring at radius sweetR (-Z)
      const strikeX = offsetX;
      const strikeZ = -Math.sqrt(Math.max(0.01, sweetR * sweetR - strikeX * strikeX));
      const strikeY = headHeight;

      // Wrist position back near the timpanist
      const wristX = strikeX * 0.85 + (isLeft ? -0.04 : 0.04);
      const wristY = headHeight + MALLET_WRIST_HEIGHT;
      const wristZ = strikeZ - MALLET_SHAFT_LENGTH * 0.78;

      const pivotGroup = new THREE.Group();
      pivotGroup.position.set(wristX, wristY, wristZ);
      pivotGroup.visible = false; // Becomes visible upon note hit, stays during active play

      // Mallet arm rotating inside pivot
      const stickArm = new THREE.Group();
      pivotGroup.add(stickArm);

      // Distance from pivot to strike point
      const distToTarget = Math.hypot(strikeX - wristX, strikeY - wristY, strikeZ - wristZ);

      // Shaft pointing along local +Z towards the strike target
      const shaftGeo = new THREE.CylinderGeometry(0.0045, 0.0035, distToTarget, 10);
      shaftGeo.rotateX(Math.PI * 0.5);
      const shaft = new THREE.Mesh(shaftGeo, this.woodMaterial);
      shaft.position.set(0, 0, distToTarget * 0.5);
      shaft.castShadow = true;
      stickArm.add(shaft);

      // Felt Ball Head at tip
      const feltGeo = new THREE.SphereGeometry(MALLET_HEAD_RADIUS, 14, 12);
      const feltHead = new THREE.Mesh(feltGeo, this.feltMaterial);
      feltHead.position.set(0, 0, distToTarget);
      feltHead.castShadow = true;
      stickArm.add(feltHead);

      // Orient pivot to point directly at the strike location on the drumhead
      const targetLocal = new THREE.Vector3(strikeX, strikeY, strikeZ);
      pivotGroup.lookAt(targetLocal);

      parentGroup.add(pivotGroup);

      mallets.push({
        isLeft,
        pivot: pivotGroup,
        stickArm,
        basePivotY: wristY,
        idleTimeout: null
      });
    });

    return mallets;
  }

  /* ------------------------------------------------------------------ */
  /*  MIDI NOTE PLAYBACK & ANIMATION                                    */
  /* ------------------------------------------------------------------ */

  /**
   * Find the most appropriate timpano drum for a given MIDI pitch
   */
  _getDrumIndexForMidi(midiPitch) {
    if (midiPitch === undefined || midiPitch === null) return 1;
    if (midiPitch <= 42) return 0; // 32" Bass
    if (midiPitch <= 47) return 1; // 29" Mid-Low
    if (midiPitch <= 52) return 2; // 26" Mid-High
    return 3;                      // 23" High
  }

  onNoteOn(midiPitch, vel = 0.8) {
    const drumIdx = this._getDrumIndexForMidi(midiPitch);
    const drum = this.drums[drumIdx];
    const mallets = this.malletsByDrum[drumIdx];
    if (!drum || !mallets) return;

    // 1. Alternate Left / Right Mallet
    const hand = this.lastHandByDrum[drumIdx];
    this.lastHandByDrum[drumIdx] = hand === 0 ? 1 : 0;
    const mallet = mallets[hand];

    // 2. Execute Mallet Strike
    this._executeMalletStrike(mallet, vel);

    // 3. Elastic Drumhead Deflection & Ripple Recovery
    this._animateDrumheadStrike(drum, vel);

    // 4. Subtle Dynamic Pitch Gauge Needle Deflection
    this._animateGauge(drum, midiPitch);
  }

  _executeMalletStrike(mallet, vel) {
    if (!mallet) return;

    if (mallet.idleTimeout) {
      clearTimeout(mallet.idleTimeout);
      mallet.idleTimeout = null;
    }

    mallet.pivot.visible = true;
    gsap.killTweensOf(mallet.stickArm.rotation);
    gsap.killTweensOf(mallet.pivot.position);

    const timeline = gsap.timeline();

    // 1. Rapid Accelerating Downstroke (power4.in)
    timeline.to(mallet.stickArm.rotation, {
      x: MALLET_IMPACT_ANGLE,
      duration: 0.038,
      ease: 'power4.in'
    })
    .to(mallet.pivot.position, {
      y: mallet.basePivotY,
      duration: 0.038,
      ease: 'power4.in'
    }, '<')

    // 2. Elastic Rebound Bounce (Signature Timpani Physics)
    .to(mallet.stickArm.rotation, {
      x: -MALLET_REBOUND_ANGLE * (0.65 + 0.35 * vel),
      duration: 0.088,
      ease: 'power3.out'
    })
    .to(mallet.pivot.position, {
      y: mallet.basePivotY + 0.065 * vel,
      duration: 0.088,
      ease: 'power3.out'
    }, '<')

    // 3. Hovering Ready Posture
    .to(mallet.stickArm.rotation, {
      x: -MALLET_READY_ANGLE,
      duration: 0.15,
      ease: 'power2.out'
    })
    .to(mallet.pivot.position, {
      y: mallet.basePivotY + 0.035,
      duration: 0.15,
      ease: 'power2.out'
    }, '<');

    // 4. Persistent Hover with Smooth Return on Inactivity
    mallet.idleTimeout = setTimeout(() => {
      if (!mallet.pivot.visible) return;
      gsap.to(mallet.stickArm.rotation, {
        x: 0,
        duration: 0.35,
        ease: 'power2.inOut'
      });
      gsap.to(mallet.pivot.position, {
        y: mallet.basePivotY,
        duration: 0.35,
        ease: 'power2.inOut',
        onComplete: () => {
          mallet.pivot.visible = false;
        }
      });
    }, MALLET_IDLE_TIMEOUT_MS);
  }

  _animateDrumheadStrike(drum, vel) {
    const head = drum.headMesh;
    if (!head) return;

    gsap.killTweensOf(head.position);
    gsap.killTweensOf(drum.kettleAssembly.rotation);

    // Instant downward membrane deflection
    head.position.y = drum.restHeadY - 0.009 * vel;

    // Elastic oscillation bounce
    gsap.to(head.position, {
      y: drum.restHeadY,
      duration: 0.16,
      ease: 'elastic.out(1.4, 0.25)'
    });

    // Heavy forte strikes slightly shake the kettle assembly
    if (vel > 0.65) {
      const shakeAmt = 0.014 * vel;
      drum.kettleAssembly.rotation.x = drum.cfg.tiltX + shakeAmt;
      gsap.to(drum.kettleAssembly.rotation, {
        x: drum.cfg.tiltX,
        duration: 0.22,
        ease: 'elastic.out(1.2, 0.32)'
      });
    }
  }

  _animateGauge(drum, midiPitch) {
    if (!drum.needle) return;

    // Normalize pitch within drum range (-0.04 to +0.04 m on the plate)
    const minM = drum.cfg.minMidi || 36;
    const maxM = drum.cfg.maxMidi || 60;
    const fraction = THREE.MathUtils.clamp((midiPitch - minM) / (maxM - minM), 0, 1);
    const targetX = (fraction - 0.5) * 0.08;

    gsap.to(drum.needle.position, {
      x: targetX,
      duration: 0.18,
      ease: 'power2.out'
    });
  }

  onNoteOff(midiPitch, force = false) {
    if (force) {
      this.drums.forEach(drum => {
        if (drum.headMesh) {
          gsap.killTweensOf(drum.headMesh.position);
          drum.headMesh.position.y = drum.restHeadY;
        }
        if (drum.kettleAssembly) {
          gsap.killTweensOf(drum.kettleAssembly.rotation);
          drum.kettleAssembly.rotation.x = drum.cfg.tiltX;
        }
      });

      this.malletsByDrum.forEach(mallets => {
        mallets.forEach(mallet => {
          if (mallet.idleTimeout) {
            clearTimeout(mallet.idleTimeout);
            mallet.idleTimeout = null;
          }
          gsap.killTweensOf(mallet.stickArm.rotation);
          gsap.killTweensOf(mallet.pivot.position);
          mallet.pivot.visible = false;
        });
      });
    }
  }

  update(delta) {
    // Animation frame tick
  }

  dispose() {
    this.onNoteOff(0, true);
    if (this.group && this.group.parent) {
      this.group.parent.remove(this.group);
    }
  }
}
