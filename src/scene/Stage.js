import * as THREE from 'three';
import { StageMonitor3D } from './StageMonitor3D.js';

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
    this.monitors = [];
    this.dustParticles = null;
    this.lightShowEnabled = false;  // Light animation toggle
    this.lightShowTime = 0;         // Accumulated time for light animation
    this.musicEnergy = 0;
    this.showPulse = 0;
    this.showColor = new THREE.Color(0xffdeb1);
    this.showAccent = new THREE.Color(0x9bcee2);
    this.showPalettes = [
      [new THREE.Color(0xffbb70), new THREE.Color(0x55caff)],
      [new THREE.Color(0xb58aff), new THREE.Color(0x48dfc4)],
      [new THREE.Color(0xff809e), new THREE.Color(0xffce70)]
    ];
    // Reusable sweep math avoids allocating vectors/quaternions every frame.
    this._lightSweepTarget = new THREE.Vector3();
    this._lightLocalTarget = new THREE.Vector3();
    this._lightDown = new THREE.Vector3(0, -1, 0);
    this._lightAimQuaternion = new THREE.Quaternion();
    this._lightWorldOrigin = new THREE.Vector3();
    this._lightBaseColor = new THREE.Color();
    this._showSpots = [];

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
      spot.beam.visible = false;
    });
    this._selectShowSpots();
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
    this.riserHeight = 0.20;
    this.defaultRiserBounds = { minX: -2.40, maxX: 2.40, minZ: -2.35, maxZ: 1.45 };
    this.riserBounds = { ...this.defaultRiserBounds };

    const initialWidth = this.riserBounds.maxX - this.riserBounds.minX;
    const initialDepth = this.riserBounds.maxZ - this.riserBounds.minZ;
    const initialCenterX = (this.riserBounds.minX + this.riserBounds.maxX) / 2;
    const initialCenterZ = (this.riserBounds.minZ + this.riserBounds.maxZ) / 2;

    const riserGeom = new THREE.BoxGeometry(initialWidth, this.riserHeight, initialDepth);
    this.drumRiser = new THREE.Mesh(riserGeom, this.stageTrimMaterial);
    this.drumRiser.position.set(initialCenterX, this.riserHeight / 2, initialCenterZ);
    this.drumRiser.receiveShadow = true;
    this.group.add(this.drumRiser);

    // Clean edge trims for the riser platform ("borde del cuadro")
    this.riserTrimMaterial = new THREE.MeshStandardMaterial({
      color: 0x444450,
      roughness: 0.3,
      metalness: 0.8
    });

    // Front edge trim
    this.drumRiserFrontTrim = new THREE.Mesh(
      new THREE.BoxGeometry(initialWidth, 0.02, 0.03),
      this.riserTrimMaterial
    );
    this.drumRiserFrontTrim.position.set(initialCenterX, this.riserHeight + 0.01, initialCenterZ + initialDepth / 2);
    this.group.add(this.drumRiserFrontTrim);

    // Left edge trim
    this.drumRiserLeftTrim = new THREE.Mesh(
      new THREE.BoxGeometry(0.03, 0.02, initialDepth),
      this.riserTrimMaterial
    );
    this.drumRiserLeftTrim.position.set(initialCenterX - initialWidth / 2, this.riserHeight + 0.01, initialCenterZ);
    this.group.add(this.drumRiserLeftTrim);

    // Right edge trim
    this.drumRiserRightTrim = new THREE.Mesh(
      new THREE.BoxGeometry(0.03, 0.02, initialDepth),
      this.riserTrimMaterial
    );
    this.drumRiserRightTrim.position.set(initialCenterX + initialWidth / 2, this.riserHeight + 0.01, initialCenterZ);
    this.group.add(this.drumRiserRightTrim);
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
    // Fixtures serve instrument families; only a small selection emits show beams.
    const spotConfigs = [
      { x: -5.5, z: 3.2, target: [-3.6, 0.70, 0.35], color: 0xffe6d0, intensity: 22, penumbra: 0.85, name: 'piano_spot' },
      { x: -2.0, z: 3.2, target: [-2.4, 1.4, -0.4], color: 0xff007f, name: 'bass_spot' },
      { x: 0.0, z: 3.2, target: [0, 1.2, 0.20], color: 0xffaa00, name: 'drum_spot', steady: true },
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

      const lens = new THREE.Mesh(
        new THREE.CircleGeometry(0.145, 20),
        new THREE.MeshBasicMaterial({ color: cfg.color, toneMapped: false, side: THREE.DoubleSide })
      );
      lens.rotation.x = Math.PI / 2;
      lens.position.y = -0.18;
      head.add(lens);
      lens.visible = false;

      // Three.js SpotLight with customizable intensity and penumbra
      const intensity = cfg.intensity !== undefined ? cfg.intensity : 45;
      const penumbra = cfg.penumbra !== undefined ? cfg.penumbra : 0.4;
      const spotLight = new THREE.SpotLight(cfg.color, intensity, 18, Math.PI / 5, penumbra, 1.2);
      // Mobile enables at most two show lights in addition to the shared washes.
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
      const beamGeom = new THREE.ConeGeometry(1, 1, 24, 12, true);
      beamGeom.translate(0, -0.5, 0);
      // Additive vertex shading fades the ends instead of a hard solid cone.
      const beamColors = new Float32Array(beamGeom.attributes.position.count * 3);
      for (let i = 0; i < beamGeom.attributes.position.count; i++) {
        const t = THREE.MathUtils.clamp(-beamGeom.attributes.position.getY(i), 0, 1);
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
      beamMesh.visible = false; // Hidden by default; shown when Light Show is enabled
      spotGroup.add(beamMesh);

      this.group.add(spotGroup);

      this.spotlights.push({
        group: spotGroup,
        head,
        lens,
        light: spotLight,
        beam: beamMesh,
        target: targetObj,
        baseTarget: targetObj.position.clone(),
        baseColor: cfg.color,
        baseIntensity: intensity,
        active: Boolean(cfg.steady),
        steady: Boolean(cfg.steady),
        notePulse: 0,
        noteHold: 0,
        showRank: -1,
        name: cfg.name
      });
    });
  }



  _buildStageProps() {
    // Stage Wedge Monitor Speakers (Tour-grade floor foldback monitors)
    // Inner pair and outer pair are mirrored for realistic acoustic symmetry
    // Positioned forward at double the distance from the drum riser (riser front maxZ: 1.45m -> dist: 1.90m -> z: 3.35m)
    const monitorZ = 3.35;
    const monitorConfigs = [
      [-4.0, 0, monitorZ, -0.25, false],
      [-1.8, 0, monitorZ, -0.08, true],
      [1.8, 0, monitorZ, 0.08, false],
      [4.0, 0, monitorZ, 0.25, true]
    ];

    this.monitors = monitorConfigs.map(([mx, my, mz, rotY, mirror]) => {
      const monitor = new StageMonitor3D({ faceAudience: true, mirrorLayout: Boolean(mirror) });
      monitor.group.position.set(mx, my, mz);
      monitor.group.rotation.y = rotY;
      this.group.add(monitor.group);
      return monitor;
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
      drum_spot: ['drums', 'xylophone', 'cabasa', 'timbales', 'bongoCongas', 'tambourine', 'triangle', 'maracas', 'guiro', 'whistle'],
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
        const isVisible = spot.steady || (Array.isArray(inst)
          ? inst.some(name => activeFamilies.has(name))
          : activeFamilies.has(inst));
        spot.active = isVisible;
        if (!isVisible) {
          spot.light.intensity = 0;
          spot.notePulse = 0;
          spot.noteHold = 0;
        }
        // Beam cones only visible when Light Show is enabled AND instrument is active
        if (!isVisible) spot.beam.visible = false;
      }
    });
    this._selectShowSpots();
  }

  _selectShowSpots() {
    // A stable, evenly spaced selection avoids a cone for every MIDI family.
    const candidates = this.spotlights.filter(spot => !spot.steady && spot.active && spot.noteHold > 0)
      .sort((a, b) => a.group.position.x - b.group.position.x);
    const count = Math.min(candidates.length, this.mobilePerformanceMode ? 1 : 4);
    this._showSpots.length = 0;
    this.spotlights.forEach(spot => { spot.showRank = -1; });
    for (let rank = 0; rank < count; rank++) {
      const index = count === 1 ? 0 : Math.round(rank * (candidates.length - 1) / (count - 1));
      const spot = candidates[index];
      spot.showRank = rank;
      this._showSpots.push(spot);
    }
  }

  _aimSpotlight(spot) {
    this._lightLocalTarget.copy(spot.target.position);
    spot.group.worldToLocal(this._lightLocalTarget);
    this._lightLocalTarget.sub(spot.head.position).normalize();
    this._lightAimQuaternion.setFromUnitVectors(this._lightDown, this._lightLocalTarget);
    spot.head.quaternion.copy(this._lightAimQuaternion);
    // The actual light and cone originate at the illuminated lens.
    spot.light.position.copy(this._lightLocalTarget).multiplyScalar(0.18).add(spot.head.position);
    spot.beam.position.copy(spot.light.position);
    spot.beam.quaternion.copy(this._lightAimQuaternion);
    spot.light.getWorldPosition(this._lightWorldOrigin);
    this._lightSweepTarget.copy(spot.target.position).sub(this._lightWorldOrigin).normalize();
    const length = THREE.MathUtils.clamp(
      (this._lightWorldOrigin.y - 0.025) / Math.max(0.1, -this._lightSweepTarget.y), 0.1, 16
    );
    // Show only the central shaft in the haze; the wider light softly washes
    // the surrounding instruments, as in the original stage lighting.
    const radius = Math.tan(Math.min(0.23, spot.light.angle)) * length;
    spot.beam.scale.set(radius, length, radius);
  }

  updateInstrumentLayout(positionMap) {
    const spotFamilies = {
      piano_spot: ['piano', 'synth'],
      bass_spot: ['bass', 'doubleBass'],
      drum_spot: ['drums', 'xylophone', 'cabasa', 'timbales', 'bongoCongas', 'tambourine', 'triangle', 'maracas', 'guiro', 'whistle'],
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
      // The central wash always covers the riser, regardless of MIDI mapping.
      if (spot.steady) return;
      const families = spotFamilies[spot.name] || [];
      const match = [...positionMap.entries()].find(([key]) =>
        families.includes(key.replace(/_\d+$/, ''))
      );
      if (!match) return;

      const target = match[1];
      spot.target.position.copy(target);
      spot.baseTarget.copy(target);

      this._aimSpotlight(spot);
    });
  }

  /**
   * The drum riser platform (tarima de la batería) maintains its authentic, original fixed dimensions
   * (width: 4.80m, depth: 3.80m). All instruments placed on it are strictly constrained to fit inside.
   */
  updateRiserBounds(minX, maxX, minZ, maxZ) {
    this.riserBounds = { ...this.defaultRiserBounds };
  }

  resetRiserBounds() {
    this.riserBounds = { ...this.defaultRiserBounds };
  }

  pulseInstrumentSpotlight(instrumentName, velocity = 0.8, duration = 0.5) {
    const spot = this.spotlights.find(s => s.name === instrumentName + '_spot');
    if (!spot?.active) return;
    // A single envelope owns each light; dense notes cannot stack tweens.
    spot.notePulse = Math.max(spot.notePulse, THREE.MathUtils.clamp(velocity, 0, 1));
    const wasPlaying = spot.noteHold > 0;
    spot.noteHold = Math.max(spot.noteHold, Math.max(0, Number(duration) || 0.5) + 1.2);
    if (!wasPlaying) this._selectShowSpots();
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
        spot.target.position.copy(spot.baseTarget);
        this._aimSpotlight(spot);
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
    this.showPulse = THREE.MathUtils.lerp(this.showPulse, pulse, smooth);
    if (this.lightShowEnabled && this.effectsEnabled) {
      this.lightShowTime += delta;
    }

    let selectionChanged = false;
    this.spotlights.forEach(spot => {
      const wasPlaying = spot.noteHold > 0;
      spot.noteHold = playing ? Math.max(0, spot.noteHold - delta) : 0;
      selectionChanged ||= wasPlaying !== (spot.noteHold > 0);
    });
    if (selectionChanged) this._selectShowSpots();

    this.spotlights.forEach((spot, i) => {
      spot.notePulse *= Math.exp(-delta / 0.3);
      if (spot.steady) {
        // Steady stage illumination must not follow note envelopes or show cues.
        spot.light.visible = true;
        spot.light.intensity = spot.baseIntensity;
        spot.light.color.setHex(spot.baseColor);
        // A slow sweep stays over the riser, including during musical pauses.
        // Move the real light and its cone together without pulsing brightness.
        this._lightSweepTarget.copy(spot.baseTarget);
        if (this.lightShowEnabled && this.effectsEnabled) {
          const phase = this.lightShowTime * Math.PI / 6;
          this._lightSweepTarget.x += Math.sin(phase) * 0.9;
          this._lightSweepTarget.z += Math.sin(phase * 2) * 0.3;
        }
        spot.target.position.lerp(this._lightSweepTarget, smooth);
        spot.beam.visible = this.lightShowEnabled && this.effectsEnabled;
        spot.beam.material.opacity = spot.beam.visible ? 0.18 : 0;
        spot.beam.material.color.copy(spot.light.color);
        spot.lens.visible = true;
        spot.lens.material.color.copy(spot.light.color);
        this._aimSpotlight(spot);
        return;
      }
      const show = this.lightShowEnabled && spot.active;
      const beamShow = show && spot.showRank >= 0 && playing;
      // Mobile uses one moving light plus the steady central wash, without shadows.
      spot.light.visible = !this.mobilePerformanceMode || (beamShow && this.effectsEnabled);
      // Lift quiet passages without adding a constant glow during silence.
      const energy = Math.sqrt(this.musicEnergy);
      if (show) {
        const color = i % 2 ? this.showAccent : this.showColor;
        spot.light.color.lerp(color, smooth);
        spot.beam.material.color.copy(spot.light.color);
      } else {
        spot.light.color.lerp(this._lightBaseColor.setHex(spot.baseColor), smooth);
      }
      const intensity = spot.active
        ? spot.baseIntensity * (1 + (show ? energy * (0.6 + this.showPulse * 0.9) : 0) + spot.notePulse * 0.3)
        : 0;
      spot.light.intensity = THREE.MathUtils.lerp(spot.light.intensity, intensity, smooth);
      // Keep the volumetric cones readable against the dark stage.  The
      // additive material needs a stronger envelope than the spot intensity
      // to remain visible, especially on mobile displays.
      const opacity = beamShow && this.effectsEnabled && spot.light.visible
        ? energy * Math.min(1, spot.noteHold / 0.8) * (0.075 + 0.12 * this.showPulse + 0.085 * spot.notePulse)
        : 0;
      spot.beam.material.opacity = THREE.MathUtils.lerp(spot.beam.material.opacity, opacity, smooth);
      spot.beam.visible = beamShow && this.effectsEnabled && spot.light.visible && spot.beam.material.opacity > 0.001;
      spot.lens.visible = spot.active && spot.light.visible && spot.light.intensity > 0.1;
      spot.lens.material.color.copy(spot.light.color);

      // One musical phase drives a mirrored sweep across the stage.
      const motion = beamShow && this.effectsEnabled ? 0.35 + energy * 0.65 : 0;
      const sweepPhase = beat * Math.PI / 8;
      const direction = spot.group.position.x < 0 ? -1 : 1;
      const sweepWidth = motion * 0.8;
      const sweepDepth = motion * 0.45;
      const targetX = motion ? THREE.MathUtils.clamp(spot.baseTarget.x + Math.sin(sweepPhase) * sweepWidth * direction, -7, 7) : spot.baseTarget.x;
      const targetY = spot.baseTarget.y;
      const targetZ = motion ? THREE.MathUtils.clamp(spot.baseTarget.z + Math.cos(sweepPhase) * sweepDepth, -4, 2.5) : spot.baseTarget.z;
      this._lightSweepTarget.set(targetX, targetY, targetZ);
      spot.target.position.lerp(this._lightSweepTarget, smooth);

      // Keep the decorative cone aligned with the same moving aim point as
      // the real SpotLight.  Recomputing in fixture-local space also honors
      // any dynamic instrument layout updates.
      this._aimSpotlight(spot);
    });

    if (this.monitors && this.monitors.length) {
      this.monitors.forEach(mon => mon.update(delta, this.musicEnergy, this.showPulse));
    }
  }
}
