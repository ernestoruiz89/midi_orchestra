import * as THREE from 'three';
import gsap from 'gsap';

/**
 * Stage builds the concert hall environment: reflective stage floor,
 * aluminum truss, moving-head spotlights with volumetric light beams,
 * LED visualizer backdrop wall, stage monitors, and atmospheric particles.
 */
export class Stage {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();

    this.spotlights = [];
    this.equalizerBars = [];
    this.dustParticles = null;
    this.lightShowEnabled = false;  // Light animation toggle
    this.lightShowTime = 0;         // Accumulated time for light animation

    this._buildMaterials();
    this._buildStageFloor();
    this._buildTrussRigging();
    this._buildMovingHeadSpotlights();
    this._buildStageProps();
    this._buildAtmosphericDust();

    this.scene.add(this.group);
  }

  _buildMaterials() {
    // Glossy Reflective Stage Wood Floor
    this.floorMaterial = new THREE.MeshStandardMaterial({
      color: 0x141416,
      roughness: 0.25,
      metalness: 0.4
    });

    this.stageTrimMaterial = new THREE.MeshStandardMaterial({
      color: 0x222226,
      roughness: 0.5,
      metalness: 0.3
    });

    this.trussMaterial = new THREE.MeshStandardMaterial({
      color: 0x666670,
      roughness: 0.3,
      metalness: 0.9
    });

    this.spotHousingMaterial = new THREE.MeshStandardMaterial({
      color: 0x111111,
      roughness: 0.2,
      metalness: 0.8
    });
  }

  _buildStageFloor() {
    // Main Stage Deck
    const stageWidth = 20;
    const stageDepth = 12;
    const stageHeight = 0.5;

    const floorGeom = new THREE.BoxGeometry(stageWidth, stageHeight, stageDepth);
    const floorMesh = new THREE.Mesh(floorGeom, this.floorMaterial);
    floorMesh.position.set(0, -stageHeight / 2, 0);
    floorMesh.receiveShadow = true;
    this.group.add(floorMesh);

    // Front Edge Neon Accent Line
    const neonLineGeom = new THREE.BoxGeometry(stageWidth, 0.04, 0.04);
    const neonLineMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff });
    const neonLine = new THREE.Mesh(neonLineGeom, neonLineMat);
    neonLine.position.set(0, 0.02, stageDepth / 2);
    this.group.add(neonLine);

    // Drum Riser Platform (Elevated platform for drum kit)
    const riserWidth = 4.6;
    const riserHeight = 0.20;
    const riserDepth = 3.6;
    const riserGeom = new THREE.BoxGeometry(riserWidth, riserHeight, riserDepth);
    const riser = new THREE.Mesh(riserGeom, this.stageTrimMaterial);
    riser.position.set(0, riserHeight / 2, -0.60);
    riser.receiveShadow = true;
    this.group.add(riser);

    // Clean front edge trim for the riser platform ("borde del cuadro")
    const frontTrimGeom = new THREE.BoxGeometry(riserWidth, 0.02, 0.03);
    const frontTrimMat = new THREE.MeshStandardMaterial({
      color: 0x444450,
      roughness: 0.3,
      metalness: 0.8
    });
    const frontTrim = new THREE.Mesh(frontTrimGeom, frontTrimMat);
    frontTrim.position.set(0, riserHeight + 0.01, -0.60 + riserDepth / 2);
    this.group.add(frontTrim);
  }

  _buildTrussRigging() {
    const trussGroup = new THREE.Group();

    // Overhead Front Truss Beam
    const frontBeam = this._createTrussSegment(18, 0.3, 0.3);
    frontBeam.position.set(0, 6.5, 3.5);
    trussGroup.add(frontBeam);

    // Overhead Back Truss Beam
    const backBeam = this._createTrussSegment(18, 0.3, 0.3);
    backBeam.position.set(0, 6.5, -4.5);
    trussGroup.add(backBeam);

    // 4 Vertical Truss Pillars
    [[-8.5, 3.5], [8.5, 3.5], [-8.5, -4.5], [8.5, -4.5]].forEach(([px, pz]) => {
      const pillar = this._createTrussPillar(6.5);
      pillar.position.set(px, 3.25, pz);
      trussGroup.add(pillar);
    });

    this.group.add(trussGroup);
  }

  _createTrussSegment(length, width, height) {
    const group = new THREE.Group();
    // 4 Main corner tubes
    const tubeRadius = 0.025;
    [
      [-width / 2, -height / 2],
      [width / 2, -height / 2],
      [-width / 2, height / 2],
      [width / 2, height / 2]
    ].forEach(([cy, cz]) => {
      const tube = new THREE.Mesh(new THREE.CylinderGeometry(tubeRadius, tubeRadius, length, 8), this.trussMaterial);
      tube.rotation.z = Math.PI / 2;
      tube.position.set(0, cy, cz);
      group.add(tube);
    });

    return group;
  }

  _createTrussPillar(height) {
    const group = new THREE.Group();
    const tubeRadius = 0.025;
    const w = 0.3;
    [
      [-w / 2, -w / 2],
      [w / 2, -w / 2],
      [-w / 2, w / 2],
      [w / 2, w / 2]
    ].forEach(([cx, cz]) => {
      const tube = new THREE.Mesh(new THREE.CylinderGeometry(tubeRadius, tubeRadius, height, 8), this.trussMaterial);
      tube.position.set(cx, 0, cz);
      group.add(tube);
    });
    return group;
  }

  _buildMovingHeadSpotlights() {
    // 6 Moving-head spotlights targeting different instruments
    const spotConfigs = [
      { x: -5.5, z: 3.2, target: [-3.6, 0.70, 0.35], color: 0xffe6d0, intensity: 22, penumbra: 0.85, name: 'piano_spot' },
      { x: -2.0, z: 3.2, target: [-2.4, 1.4, -0.4], color: 0xff007f, name: 'bass_spot' },
      { x: 0.0, z: 3.2, target: [0, 1.2, -1.2], color: 0xffaa00, name: 'drum_spot' },
      { x: 2.2, z: 3.2, target: [2.8, 1.4, 0.6], color: 0xffeedd, name: 'guitar_spot' },
      { x: 5.5, z: 3.2, target: [4.2, 1.5, 0.4], color: 0xffea00, name: 'trumpet_spot' },
      { x: -3.8, z: 2.2, target: [-4.2, 1.25, -1.8], color: 0xffbe76, name: 'violin_spot' },
      { x: -2.8, z: 2.4, target: [-3.3, 1.15, -1.2], color: 0xff9f43, name: 'cello_spot' },
      { x: 2.0, z: 2.8, target: [1.6, 1.30, 1.8], color: 0x70f5ff, name: 'flute_spot' }
    ];

    spotConfigs.forEach((cfg) => {
      const spotGroup = new THREE.Group();
      spotGroup.position.set(cfg.x, 6.3, cfg.z);

      // Fixture Yoke & Housing
      const yoke = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.2, 12), this.spotHousingMaterial);
      spotGroup.add(yoke);

      const head = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.18, 0.35, 16), this.spotHousingMaterial);
      head.position.y = -0.22;
      spotGroup.add(head);

      // Three.js SpotLight with customizable intensity and penumbra
      const intensity = cfg.intensity !== undefined ? cfg.intensity : 45;
      const penumbra = cfg.penumbra !== undefined ? cfg.penumbra : 0.4;
      const spotLight = new THREE.SpotLight(cfg.color, intensity, 18, Math.PI / 5, penumbra, 1.2);
      spotLight.position.set(0, -0.25, 0);
      spotLight.castShadow = true;
      spotLight.shadow.mapSize.width = 1024;
      spotLight.shadow.mapSize.height = 1024;
      spotLight.shadow.camera.near = 1;
      spotLight.shadow.camera.far = 18;

      const targetObj = new THREE.Object3D();
      targetObj.position.set(cfg.target[0], cfg.target[1], cfg.target[2]);
      this.scene.add(targetObj);
      spotLight.target = targetObj;

      spotGroup.add(spotLight);

      // Volumetric Faux-Light Beam Cone
      const beamGeom = new THREE.ConeGeometry(1.6, 7.5, 24, 1, true);
      beamGeom.translate(0, -3.75, 0);

      const beamMat = new THREE.MeshBasicMaterial({
        color: cfg.color,
        transparent: true,
        opacity: 0.18,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide
      });

      const beamMesh = new THREE.Mesh(beamGeom, beamMat);
      beamMesh.lookAt(targetObj.position);
      beamMesh.rotation.x -= Math.PI / 2;
      beamMesh.visible = false; // Hidden by default; shown when Light Show is enabled
      spotGroup.add(beamMesh);

      this.group.add(spotGroup);

      this.spotlights.push({
        group: spotGroup,
        light: spotLight,
        beam: beamMesh,
        target: targetObj,
        baseColor: cfg.color,
        baseIntensity: intensity,
        name: cfg.name
      });
    });
  }



  _buildStageProps() {
    // Stage Wedge Monitor Speakers (Floor foldbacks)
    const monitorPositions = [
      [-4.0, 0, 2.4, -0.3],
      [-1.8, 0, 2.4, -0.1],
      [1.8, 0, 2.4, 0.1],
      [4.0, 0, 2.4, 0.3]
    ];

    monitorPositions.forEach(([mx, my, mz, rotY]) => {
      const monGroup = new THREE.Group();
      monGroup.position.set(mx, my, mz);
      monGroup.rotation.y = rotY;

      const wedgeGeom = new THREE.BoxGeometry(0.7, 0.35, 0.5);
      const wedge = new THREE.Mesh(wedgeGeom, this.stageTrimMaterial);
      wedge.rotation.x = -Math.PI * 0.18;
      wedge.position.y = 0.15;
      wedge.castShadow = true;
      monGroup.add(wedge);

      this.group.add(monGroup);
    });
  }

  _buildAtmosphericDust() {
    const particleCount = 200;
    const geom = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 18;
      positions[i * 3 + 1] = Math.random() * 6.5;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 12;
    }

    geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const mat = new THREE.PointsMaterial({
      color: 0x99ccff,
      size: 0.04,
      transparent: true,
      opacity: 0.45,
      blending: THREE.AdditiveBlending
    });

    this.dustParticles = new THREE.Points(geom, mat);
    this.group.add(this.dustParticles);
  }

  updateSpotlightsForActiveInstruments(activeSet) {
    const spotMap = {
      piano_spot: ['piano', 'synth'],
      bass_spot: ['bass', 'doubleBass'],
      drum_spot: ['drums', 'xylophone'],
      guitar_spot: ['guitar', 'acousticGuitar'],
      trumpet_spot: ['trumpet', 'sax'],
      violin_spot: 'violin',
      cello_spot: 'cello',
      flute_spot: 'flute'
    };

    const activeFamilies = new Set(
      [...activeSet].map(key => key.replace(/_\d+$/, ''))
    );

    this.spotlights.forEach(spot => {
      const inst = spotMap[spot.name];
      if (inst) {
        const isVisible = Array.isArray(inst)
          ? inst.some(name => activeFamilies.has(name))
          : activeFamilies.has(inst);
        spot.light.intensity = isVisible ? spot.baseIntensity : 0;
        // Beam cones only visible when Light Show is enabled AND instrument is active
        spot.beam.visible = this.lightShowEnabled && isVisible;
      }
    });
  }

  updateInstrumentLayout(positionMap) {
    const spotFamilies = {
      piano_spot: ['piano', 'synth'],
      bass_spot: ['bass', 'doubleBass'],
      drum_spot: ['drums', 'xylophone'],
      guitar_spot: ['guitar', 'acousticGuitar'],
      trumpet_spot: ['trumpet', 'sax'],
      violin_spot: ['violin'],
      cello_spot: ['cello'],
      flute_spot: ['flute']
    };

    this.spotlights.forEach((spot) => {
      const families = spotFamilies[spot.name] || [];
      const match = [...positionMap.entries()].find(([key]) =>
        families.includes(key.replace(/_\d+$/, ''))
      );
      if (!match) return;

      const target = match[1];
      spot.target.position.copy(target);

      // The decorative cone is local to the overhead fixture. Reorient its
      // -Y axis to the new world-space instrument target.
      const localTarget = spot.group.worldToLocal(target.clone());
      if (localTarget.lengthSq() > 0.0001) {
        spot.beam.quaternion.setFromUnitVectors(
          new THREE.Vector3(0, -1, 0),
          localTarget.normalize()
        );
      }
    });
  }

  pulseInstrumentSpotlight(instrumentName, velocity = 0.8) {
    const spot = this.spotlights.find(s => s.name.includes(instrumentName));
    if (!spot || spot.light.intensity === 0) return;

    gsap.killTweensOf(spot.light);
    gsap.killTweensOf(spot.beam.material);

    const targetIntensity = spot.baseIntensity * (1.0 + velocity * 1.5);
    const targetOpacity = Math.min(0.6, 0.2 + velocity * 0.4);

    gsap.timeline()
      .to(spot.light, { intensity: targetIntensity, duration: 0.04 })
      .to(spot.light, { intensity: spot.baseIntensity, duration: 0.35, ease: 'power2.out' });

    gsap.timeline()
      .to(spot.beam.material, { opacity: targetOpacity, duration: 0.04 })
      .to(spot.beam.material, { opacity: 0.18, duration: 0.35, ease: 'power2.out' });
  }

  /**
   * Toggle the animated light show on/off.
   * When enabled, spotlights cycle colors, breathe intensity and gently sway.
   * @returns {boolean} new state
   */
  toggleLightShow() {
    this.lightShowEnabled = !this.lightShowEnabled;

    if (this.lightShowEnabled) {
      // Show beam cones for spots that have their light on
      this.spotlights.forEach(spot => {
        if (spot.light.intensity > 0) {
          spot.beam.visible = true;
        }
      });
    } else {
      // Reset every spotlight back to its original static state and hide beams
      this.spotlights.forEach(spot => {
        const c = new THREE.Color(spot.baseColor);
        spot.light.color.copy(c);
        spot.light.intensity = spot.beam.visible ? spot.baseIntensity : 0;
        spot.beam.material.color.copy(c);
        spot.beam.material.opacity = 0.18;
        spot.beam.visible = false;
        spot.group.rotation.x = 0;
        spot.group.rotation.z = 0;
      });
    }

    return this.lightShowEnabled;
  }

  update(delta, visualizerData = null) {
    // 1. Animate Atmospheric Dust Particles
    if (this.dustParticles) {
      const pos = this.dustParticles.geometry.attributes.position.array;
      const count = pos.length / 3;
      const time = performance.now() * 0.0005;

      for (let i = 0; i < count; i++) {
        pos[i * 3 + 1] += Math.sin(time + i) * 0.005;
        pos[i * 3] += Math.cos(time + i) * 0.003;
      }
      this.dustParticles.geometry.attributes.position.needsUpdate = true;
    }

    // 2. Animated Light Show (when enabled)
    if (this.lightShowEnabled) {
      this.lightShowTime += delta;
      const t = this.lightShowTime;

      this.spotlights.forEach((spot, i) => {
        if (!spot.beam.visible) return;

        // Color cycling: each spot has its own phase offset
        const hue = ((t * 0.12) + (i * 0.125)) % 1.0;
        const color = new THREE.Color().setHSL(hue, 0.9, 0.55);
        spot.light.color.copy(color);
        spot.beam.material.color.copy(color);

        // Intensity breathing
        const breathe = 0.7 + 0.3 * Math.sin(t * 2.5 + i * 1.2);
        spot.light.intensity = spot.baseIntensity * breathe;

        // Beam opacity pulsing
        spot.beam.material.opacity = 0.12 + 0.10 * Math.sin(t * 3.0 + i * 0.9);

        // Gentle fixture sway (small rotation of the whole spotlight group)
        spot.group.rotation.x = Math.sin(t * 0.8 + i * 1.5) * 0.04;
        spot.group.rotation.z = Math.cos(t * 0.6 + i * 1.1) * 0.03;
      });
    }

  }
}
