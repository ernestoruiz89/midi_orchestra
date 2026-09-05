import * as THREE from 'three';

/**
 * Stage builds the concert hall environment: reflective stage floor,
 * aluminum truss, moving-head spotlights with volumetric light beams,
 * LED visualizer backdrop wall, stage monitors, and atmospheric particles.
 */
export class Stage {
  constructor(scene, { mobilePerformanceMode = false } = {}) {
    this.scene = scene;
    this.mobilePerformanceMode = mobilePerformanceMode;
    this.effectsEnabled = true;
    this.group = new THREE.Group();

    this.spotlights = [];
    this.equalizerBars = [];
    this.dustParticles = null;
    this.lightShowEnabled = false;  // Light animation toggle
    this.lightShowTime = 0;         // Accumulated time for light animation
    this.musicEnergy = 0;
    this.showColor = new THREE.Color(0xffdeb1);
    this.showAccent = new THREE.Color(0x9bcee2);
    this.showPalettes = [
      [new THREE.Color(0xffdeb1), new THREE.Color(0x9bcee2)],
      [new THREE.Color(0xc2b6e8), new THREE.Color(0x92d8d0)],
      [new THREE.Color(0xefbdb6), new THREE.Color(0xffdfac)]
    ];

    this._buildMaterials();
    this._buildStageFloor();
    this._buildTrussRigging();
    this._buildMovingHeadSpotlights();
    this._buildStageProps();
    this._buildAtmosphericDust();

    this.scene.add(this.group);
  }

  _buildMaterials() {
    // Charcoal deck with diffuse reflection so it separates from the backdrop.
    this.floorMaterial = new THREE.MeshStandardMaterial({
      color: 0x353840,
      roughness: 0.6,
      metalness: 0.12
    });

    this.stageTrimMaterial = new THREE.MeshStandardMaterial({
      color: 0x48434a,
      roughness: 0.55,
      metalness: 0.18
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

  setQuality(quality) {
    this.effectsEnabled = quality !== 'low';
    this.dustParticles.visible = this.effectsEnabled;
    this.spotlights.forEach(spot => {
      spot.light.castShadow = quality === 'high' && !this.mobilePerformanceMode;
      spot.light.shadow.mapSize.set(1024, 1024);
      if (!spot.light.castShadow && spot.light.shadow.map) {
        spot.light.shadow.map.dispose();
        spot.light.shadow.map = null;
      }
      spot.beam.visible = this.effectsEnabled && this.lightShowEnabled && spot.active;
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

    // Drum Riser Platform (Elevated platform for drum kit & percussion section)
    const riserWidth = 4.8;
    const riserHeight = 0.20;
    const riserDepth = 3.8;
    const riserGeom = new THREE.BoxGeometry(riserWidth, riserHeight, riserDepth);
    const riser = new THREE.Mesh(riserGeom, this.stageTrimMaterial);
    riser.position.set(0, riserHeight / 2, -0.45);
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
    frontTrim.position.set(0, riserHeight + 0.01, -0.45 + riserDepth / 2);
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
      { x: 0.0, z: 3.2, target: [0, 1.2, 0.20], color: 0xffaa00, name: 'drum_spot' },
      { x: 2.2, z: 3.2, target: [2.8, 1.4, 0.6], color: 0xffeedd, name: 'guitar_spot' },
      { x: 5.5, z: 3.2, target: [4.2, 1.5, 0.4], color: 0xffea00, name: 'trumpet_spot' },
      { x: -3.8, z: 2.2, target: [-4.2, 1.25, -1.8], color: 0xffbe76, name: 'violin_spot' },
      { x: -2.8, z: 2.4, target: [-3.3, 1.15, -1.2], color: 0xff9f43, name: 'cello_spot' },
      { x: 2.0, z: 2.8, target: [1.6, 1.30, 1.8], color: 0x70f5ff, name: 'flute_spot' },
      { x: -1.75, z: 3.2, target: [-1.75, 1.15, 1.95], color: 0xfff4d0, intensity: 32, penumbra: 0.6, name: 'accordion_spot' },
      { x: -3.8, z: 3.2, target: [-4.20, 1.10, -0.40], color: 0xffdf80, intensity: 32, penumbra: 0.6, name: 'harp_spot' },
      { x: 1.15, z: 3.2, target: [1.15, 1.25, 2.30], color: 0xffeedd, intensity: 34, penumbra: 0.65, name: 'harmonica_spot' }
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
      // Keep animated beam meshes, but mobile surfaces use the shared washes.
      spotLight.visible = !this.mobilePerformanceMode;
      spotLight.position.set(0, -0.25, 0);
      spotLight.castShadow = !this.mobilePerformanceMode;
      spotLight.shadow.mapSize.width = this.mobilePerformanceMode ? 512 : 1024;
      spotLight.shadow.mapSize.height = this.mobilePerformanceMode ? 512 : 1024;
      spotLight.shadow.camera.near = 1;
      spotLight.shadow.camera.far = 18;

      const targetObj = new THREE.Object3D();
      targetObj.position.set(cfg.target[0], cfg.target[1], cfg.target[2]);
      this.scene.add(targetObj);
      spotLight.target = targetObj;

      spotGroup.add(spotLight);

      // Volumetric Faux-Light Beam Cone
      const beamGeom = new THREE.ConeGeometry(1.35, 7.5, 24, 8, true);
      beamGeom.translate(0, -3.75, 0);
      // Additive vertex shading fades the ends instead of a hard solid cone.
      const beamColors = new Float32Array(beamGeom.attributes.position.count * 3);
      for (let i = 0; i < beamGeom.attributes.position.count; i++) {
        const t = THREE.MathUtils.clamp(-beamGeom.attributes.position.getY(i) / 7.5, 0, 1);
        const fade = Math.sin(Math.PI * t) * 0.65;
        beamColors.set([fade, fade, fade], i * 3);
      }
      beamGeom.setAttribute('color', new THREE.BufferAttribute(beamColors, 3));

      const beamMat = new THREE.MeshBasicMaterial({
        color: cfg.color,
        transparent: true,
        opacity: 0,
        vertexColors: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        side: THREE.FrontSide
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
        active: false,
        notePulse: 0,
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
    const particleCount = this.mobilePerformanceMode ? 36 : 80;
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
      size: this.mobilePerformanceMode ? 0.018 : 0.024,
      transparent: true,
      opacity: this.mobilePerformanceMode ? 0.12 : 0.18,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.dustParticles = new THREE.Points(geom, mat);
    this.group.add(this.dustParticles);
  }

  updateSpotlightsForActiveInstruments(activeSet) {
    const spotMap = {
      piano_spot: ['piano', 'synth'],
      bass_spot: ['bass', 'doubleBass'],
      drum_spot: ['drums', 'xylophone', 'cabasa'],
      guitar_spot: ['guitar', 'acousticGuitar'],
      trumpet_spot: ['trumpet', 'sax', 'frenchHorn'],
      violin_spot: 'violin',
      cello_spot: 'cello',
      flute_spot: ['flute', 'clarinet'],
      accordion_spot: 'accordion',
      harp_spot: 'harp',
      harmonica_spot: 'harmonica'
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
        spot.active = isVisible;
        if (!isVisible) {
          spot.light.intensity = 0;
          spot.notePulse = 0;
        }
        // Beam cones only visible when Light Show is enabled AND instrument is active
        spot.beam.visible = this.effectsEnabled && this.lightShowEnabled && isVisible;
      }
    });
  }

  updateInstrumentLayout(positionMap) {
    const spotFamilies = {
      piano_spot: ['piano', 'synth'],
      bass_spot: ['bass', 'doubleBass'],
      drum_spot: ['drums', 'xylophone', 'cabasa'],
      guitar_spot: ['guitar', 'acousticGuitar'],
      trumpet_spot: ['trumpet', 'sax', 'frenchHorn'],
      violin_spot: ['violin'],
      cello_spot: ['cello'],
      flute_spot: ['flute', 'clarinet'],
      accordion_spot: ['accordion'],
      harp_spot: ['harp'],
      harmonica_spot: ['harmonica']
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
    const spot = this.spotlights.find(s => s.name === instrumentName + '_spot');
    if (!spot?.active) return;
    // A single envelope owns each light; dense notes cannot stack tweens.
    spot.notePulse = Math.max(spot.notePulse, THREE.MathUtils.clamp(velocity, 0, 1));
  }

  toggleLightShow() {
    this.lightShowEnabled = !this.lightShowEnabled;
    if (!this.lightShowEnabled) {
      this.musicEnergy = 0;
      this.spotlights.forEach(spot => {
        spot.light.color.setHex(spot.baseColor);
        spot.light.intensity = spot.active ? spot.baseIntensity : 0;
        spot.beam.material.color.setHex(spot.baseColor);
        spot.beam.material.opacity = 0;
        spot.beam.visible = false;
        spot.group.rotation.set(0, 0, 0);
      });
    }
    return this.lightShowEnabled;
  }

  update(delta, visualizerData = null, transport = {}) {
    if (this.dustParticles?.visible) {
      const pos = this.dustParticles.geometry.attributes.position.array;
      const time = performance.now() * 0.0005;
      for (let i = 0; i < pos.length / 3; i++) {
        pos[i * 3 + 1] += Math.sin(time + i) * delta * 0.12;
        pos[i * 3] += Math.cos(time + i) * delta * 0.08;
      }
      this.dustParticles.geometry.attributes.position.needsUpdate = true;
    }

    const playing = Boolean(transport.isPlaying);
    const bpm = Math.max(30, Number(transport.bpm) || 120);
    const beat = (Number(transport.currentTime) || 0) * bpm / 60;
    const noteEnergy = this.spotlights.reduce((peak, spot) => Math.max(peak, spot.notePulse), 0);
    let amplitude = 0;
    if (playing && visualizerData?.length) {
      // Frequency values are dB. Average linear amplitude avoids noisy peaks.
      for (const db of visualizerData) {
        if (Number.isFinite(db)) amplitude += Math.pow(10, db / 20);
      }
      amplitude = THREE.MathUtils.clamp(amplitude / visualizerData.length * 6, 0, 1);
    }
    const targetEnergy = playing ? Math.max(amplitude, noteEnergy * 0.6) : 0;
    const energyResponse = 1 - Math.exp(-delta / (targetEnergy > this.musicEnergy ? 0.12 : 0.55));
    this.musicEnergy = THREE.MathUtils.lerp(this.musicEnergy, targetEnergy, energyResponse);

    // Paired colors progress together over musical phrases, not random timers.
    const phrase = beat / 32;
    const paletteIndex = Math.floor(phrase) % this.showPalettes.length;
    const palette = this.showPalettes[paletteIndex];
    const next = this.showPalettes[(paletteIndex + 1) % this.showPalettes.length];
    const blend = THREE.MathUtils.smoothstep(phrase % 1, 0.75, 1);
    this.showColor.lerpColors(palette[0], next[0], blend);
    this.showAccent.lerpColors(palette[1], next[1], blend);
    const pulse = Math.pow((1 + Math.cos(beat * Math.PI * 2)) / 2, 3);
    const smooth = 1 - Math.exp(-delta / 0.18);

    this.spotlights.forEach((spot, i) => {
      spot.notePulse *= Math.exp(-delta / 0.3);
      const show = this.lightShowEnabled && spot.active;
      const energy = this.musicEnergy;
      if (show) {
        const color = i % 2 ? this.showAccent : this.showColor;
        spot.light.color.lerp(color, smooth);
        spot.beam.material.color.copy(spot.light.color);
      }
      const intensity = spot.active
        ? spot.baseIntensity * (1 + (show ? energy * (0.2 + pulse * 0.3) : 0) + spot.notePulse * 0.3)
        : 0;
      spot.light.intensity = THREE.MathUtils.lerp(spot.light.intensity, intensity, smooth);
      const opacity = show && this.effectsEnabled
        ? energy * (0.012 + 0.018 * pulse + 0.025 * spot.notePulse)
        : 0;
      spot.beam.material.opacity = THREE.MathUtils.lerp(spot.beam.material.opacity, opacity, smooth);
      spot.beam.visible = show && this.effectsEnabled && spot.beam.material.opacity > 0.001;
      const sway = show ? energy : 0;
      const direction = spot.group.position.x < 0 ? -1 : 1;
      spot.group.rotation.x = THREE.MathUtils.lerp(spot.group.rotation.x, Math.sin(beat * Math.PI / 8) * 0.015 * sway, smooth);
      spot.group.rotation.z = THREE.MathUtils.lerp(spot.group.rotation.z, Math.sin(beat * Math.PI / 16) * 0.02 * sway * direction, smooth);
    });
  }
}
