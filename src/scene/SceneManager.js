import * as THREE from 'three';
import gsap from 'gsap';
import { Stage } from './Stage.js';
import { Piano3D } from './Piano3D.js';
import { DrumKit3D } from './DrumKit3D.js';
import { Guitar3D } from './Guitar3D.js';
import { AcousticGuitar3D } from './AcousticGuitar3D.js';
import { Bass3D } from './Bass3D.js';
import { Trumpet3D } from './Trumpet3D.js';
import { Saxophone3D } from './Saxophone3D.js';
import { FrenchHorn3D } from './FrenchHorn3D.js';
import { Clarinet3D } from './Clarinet3D.js';
import { Cabasa3D } from './Cabasa3D.js';
import { Tambourine3D } from './Tambourine3D.js';
import { Maracas3D } from './Maracas3D.js';
import { Guiro3D } from './Guiro3D.js';
import { Whistle3D } from './Whistle3D.js';
import { Triangle3D } from './Triangle3D.js';
import { BongoCongas3D } from './BongoCongas3D.js';
import { Timbales3D } from './Timbales3D.js';
import { Violin3D } from './Violin3D.js';
import { Cello3D } from './Cello3D.js';
import { DoubleBass3D } from './DoubleBass3D.js';
import { Flute3D } from './Flute3D.js';
import { Xylophone3D } from './Xylophone3D.js';
import { Synth3D } from './Synth3D.js';
import { Harp3D } from './Harp3D.js';
import { Harmonica3D } from './Harmonica3D.js';
import { Accordion3D } from './Accordion3D.js';
import { CameraController } from './CameraController.js';

/**
 * SceneManager orchestrates the Three.js 3D world, lighting, rendering loop,
 * and passes MIDI events to all 3D musical instruments.
 */
export class SceneManager {
  constructor(canvasContainer, soundEngine) {
    this.container = canvasContainer;
    this.soundEngine = soundEngine;
    const reportedMemory = Number(navigator.deviceMemory) || 8;
    this.isMobilePerformanceMode = window.matchMedia('(max-width: 900px), (pointer: coarse)').matches || reportedMemory <= 4;
    let savedQuality;
    try { savedQuality = localStorage.getItem('midi_orchestra_mobile_quality'); } catch {}
    this.quality = this.isMobilePerformanceMode
      ? (['low', 'medium', 'high'].includes(savedQuality) ? savedQuality : 'low')
      : 'high';
    this.mobilePixelRatio = Math.min(window.devicePixelRatio || 1, 1.5);
    this.minimumRenderInterval = 0;
    this.lastRenderTimestamp = 0;

    // Core Three.js components
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x060608);
    this.scene.fog = new THREE.FogExp2(0x060608, 0.035);

    this.camera = new THREE.PerspectiveCamera(
      48,
      window.innerWidth / window.innerHeight,
      0.1,
      100
    );
    this.camera.position.set(0, 5.0, 11.5);

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight, false);
    this.renderer.setPixelRatio(this.isMobilePerformanceMode ? this.mobilePixelRatio : Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;

    this.container.appendChild(this.renderer.domElement);
    this.renderer.domElement.dataset.performanceProfile = this.isMobilePerformanceMode ? 'mobile' : 'desktop';

    // Build scene elements
    this._setupGlobalLighting();

    this.stage = new Stage(this.scene, { mobilePerformanceMode: this.isMobilePerformanceMode });
    this.setQuality(this.quality, false);

    // Primary instruments
    this.piano = new Piano3D(this.scene, { tier: 1, hasStand: true });
    this.drums = new DrumKit3D(this.scene);
    this.guitar = new Guitar3D(this.scene, { index: 1 });
    this.guitar.group.position.set(1.65, 1.25, 0.95);
    this.acousticGuitar = new AcousticGuitar3D(this.scene, { index: 1 });
    this.acousticGuitar.group.position.set(1.05, 1.17, 1.45);
    this.bass = new Bass3D(this.scene);
    this.doubleBass = new DoubleBass3D(this.scene);
    this.trumpet = new Trumpet3D(this.scene);
    this.frenchHorn = new FrenchHorn3D(this.scene);
    this.sax = new Saxophone3D(this.scene);
    this.clarinet = new Clarinet3D(this.scene);
    this.violin = new Violin3D(this.scene);
    this.cello = new Cello3D(this.scene);
    this.flute = new Flute3D(this.scene);
    this.xylophone = new Xylophone3D(this.scene);
    this.xylophone.group.rotation.copy(this.piano.group.rotation);
    this.cabasa = new Cabasa3D(this.scene);
    this.tambourine = new Tambourine3D(this.scene);
    this.maracas = new Maracas3D(this.scene);
    this.guiro = new Guiro3D(this.scene);
    this.whistle = new Whistle3D(this.scene);
    this.triangle = new Triangle3D(this.scene);
    this.congas = new BongoCongas3D(this.scene);
    this.timbales = new Timbales3D(this.scene);
    this.synth = new Synth3D(this.scene, { tier: 1, hasStand: true });
    this.synth.group.rotation.copy(this.piano.group.rotation);
    this.harp = new Harp3D(this.scene);
    this.harmonica = new Harmonica3D(this.scene);
    this.accordion = new Accordion3D(this.scene);

    // Duplicate instruments (MIDIJam multi-track band duplication)
    // 4 Stratocasters stacked diagonally across stage right
    this.guitar_2 = new Guitar3D(this.scene, { index: 2 });
    this.guitar_2.group.position.set(1.90, 1.15, 0.65);
    this.guitar_2.group.visible = false;

    this.guitar_3 = new Guitar3D(this.scene, { index: 3 });
    this.guitar_3.group.position.set(2.15, 1.05, 0.35);
    this.guitar_3.group.visible = false;

    this.guitar_4 = new Guitar3D(this.scene, { index: 4 });
    this.guitar_4.group.position.set(2.40, 0.95, 0.05);
    this.guitar_4.group.visible = false;

    // Acoustic guitars occupy a separate front-right position so an acoustic
    // track can coexist with an electric guitar without hiding either one.
    this.acousticGuitar_2 = new AcousticGuitar3D(this.scene, { index: 2 });
    this.acousticGuitar_2.group.position.set(1.28, 1.08, 1.20);
    this.acousticGuitar_2.group.visible = false;

    this.acousticGuitar_3 = new AcousticGuitar3D(this.scene, { index: 3 });
    this.acousticGuitar_3.group.position.set(1.50, 0.99, 0.95);
    this.acousticGuitar_3.group.visible = false;

    this.acousticGuitar_4 = new AcousticGuitar3D(this.scene, { index: 4 });
    this.acousticGuitar_4.group.position.set(1.72, 0.90, 0.70);
    this.acousticGuitar_4.group.visible = false;

    this.trumpet_2 = new Trumpet3D(this.scene);
    this.trumpet_2.group.position.set(4.85, 1.40, 0.75);
    this.trumpet_2.group.rotation.copy(this.trumpet.group.rotation);
    this.trumpet_2.brassMaterial.color.setHex(0xd0d8e4); // Chrome/Silver Trumpet
    this.trumpet_2.group.visible = false;

    this.sax_2 = new Saxophone3D(this.scene);
    this.sax_2.group.position.set(3.85, 1.25, 2.35);
    this.sax_2.group.rotation.copy(this.sax.group.rotation);
    this.sax_2.brassMaterial.color.setHex(0xc2c8d2); // Vintage Nickel Alto Sax
    this.sax_2.group.visible = false;

    this.violin_2 = new Violin3D(this.scene);
    this.violin_2.group.position.set(-5.1, 1.30, -2.6);
    this.violin_2.group.rotation.set(0.12, Math.PI * 0.18, -0.06);
    this.violin_2.varnishMaterial.color.setHex(0x421d0d); // Dark Antique Violin
    this.violin_2.group.visible = false;

    this.cello_2 = new Cello3D(this.scene);
    this.cello_2.group.position.set(-3.7, 1.15, -1.6);
    this.cello_2.group.rotation.set(0.14, Math.PI * 0.18, -0.05);
    this.cello_2.varnishMaterial.color.setHex(0x522210); // Darker vintage varnish
    this.cello_2.group.visible = false;

    this.doubleBass_2 = new DoubleBass3D(this.scene);
    this.doubleBass_2.group.position.set(-3.1, 1.25, -0.35);
    this.doubleBass_2.group.rotation.set(0.12, Math.PI * 0.16, -0.04);
    this.doubleBass_2.varnishMaterial.color.setHex(0x421808); // Dark antique varnish
    this.doubleBass_2.group.visible = false;

    this.flute_2 = new Flute3D(this.scene);
    this.flute_2.group.position.set(2.3, 1.30, 2.4);
    this.flute_2.group.rotation.copy(this.flute.group.rotation);
    this.flute_2.silverMaterial.color.setHex(0xe8b898); // Rose Gold Concert Flute
    this.flute_2.group.visible = false;

    this.bass_2 = new Bass3D(this.scene);
    this.bass_2.group.position.set(-2.9, 0.95, -1.0);
    this.bass_2.group.rotation.y = 0.38;
    this.bass_2.bodyMaterial.color.setHex(0x1a1a20); // Matte Black Precision Bass
    this.bass_2.group.visible = false;

    this.synth_2 = new Synth3D(this.scene, { tier: 2, hasStand: false });
    this.synth_2.group.position.copy(this.synth.group.position);
    this.synth_2.group.rotation.copy(this.synth.group.rotation);
    this.synth_2.group.visible = false;

    this.synth_3 = new Synth3D(this.scene, { tier: 3, hasStand: false });
    this.synth_3.group.position.copy(this.synth.group.position);
    this.synth_3.group.rotation.copy(this.synth.group.rotation);
    this.synth_3.group.visible = false;

    this.synth_4 = new Synth3D(this.scene, { tier: 4, hasStand: false });
    this.synth_4.group.position.copy(this.synth.group.position);
    this.synth_4.group.rotation.copy(this.synth.group.rotation);
    this.synth_4.group.visible = false;

    this.piano_2 = new Piano3D(this.scene, { tier: 2, hasStand: false });
    this.piano_2.group.position.copy(this.piano.group.position);
    this.piano_2.group.rotation.y = this.piano.group.rotation.y;
    this.piano_2.group.visible = false;

    this.piano_3 = new Piano3D(this.scene, { tier: 3, hasStand: false });
    this.piano_3.group.position.copy(this.piano.group.position);
    this.piano_3.group.rotation.y = this.piano.group.rotation.y;
    this.piano_3.group.visible = false;

    this.piano_4 = new Piano3D(this.scene, { tier: 4, hasStand: false });
    this.piano_4.group.position.copy(this.piano.group.position);
    this.piano_4.group.rotation.y = this.piano.group.rotation.y;
    this.piano_4.group.visible = false;

    this.xylophone_2 = new Xylophone3D(this.scene);
    this.xylophone_2.group.position.set(0.9, 0.95, 2.6);
    this.xylophone_2.group.rotation.copy(this.xylophone.group.rotation);
    this.xylophone_2.group.visible = false;

    this.allInstruments = {
      piano: this.piano,
      drums: this.drums,
      guitar: this.guitar,
      acousticGuitar: this.acousticGuitar,
      bass: this.bass,
      doubleBass: this.doubleBass,
      trumpet: this.trumpet,
      frenchHorn: this.frenchHorn,
      sax: this.sax,
      clarinet: this.clarinet,
      violin: this.violin,
      cello: this.cello,
      flute: this.flute,
      xylophone: this.xylophone,
      synth: this.synth,
      cabasa: this.cabasa,
      tambourine: this.tambourine,
      maracas: this.maracas,
      guiro: this.guiro,
      whistle: this.whistle,
      triangle: this.triangle,
      congas: this.congas,
      timbales: this.timbales,
      harp: this.harp,
      harmonica: this.harmonica,
      accordion: this.accordion,
      piano_2: this.piano_2,
      piano_3: this.piano_3,
      piano_4: this.piano_4,
      guitar_2: this.guitar_2,
      guitar_3: this.guitar_3,
      guitar_4: this.guitar_4,
      acousticGuitar_2: this.acousticGuitar_2,
      acousticGuitar_3: this.acousticGuitar_3,
      acousticGuitar_4: this.acousticGuitar_4,
      bass_2: this.bass_2,
      doubleBass_2: this.doubleBass_2,
      trumpet_2: this.trumpet_2,
      sax_2: this.sax_2,
      violin_2: this.violin_2,
      cello_2: this.cello_2,
      flute_2: this.flute_2,
      xylophone_2: this.xylophone_2,
      synth_2: this.synth_2,
      synth_3: this.synth_3,
      synth_4: this.synth_4
    };

    // Keep the original height of every model unless a specialized stacked
    // layout supplies an explicit tier height.
    this.instrumentHomeTransforms = new Map(
      Object.entries(this.allInstruments).map(([key, instrument]) => [key, {
        y: instrument.group.position.y
      }])
    );
    this._instrumentLayoutSignature = null;

    this.cameraController = new CameraController(
      this.camera,
      this.renderer.domElement,
      this.scene
    );
    this.visibleInstrumentNames = new Set();
    this.cameraController.onPresetChange = () => this._applyInstrumentVisibility();

    // Immediately initialize exact camera presets for every instrument at home position
    Object.entries(this.allInstruments).forEach(([key, instrument]) => {
      instrument.group.updateWorldMatrix(true, true);
      const box = new THREE.Box3().setFromObject(instrument.group);
      const size = box.getSize(new THREE.Vector3());
      this.cameraController.updateInstrumentPreset(
        key,
        instrument.group.position,
        size,
        instrument.group,
        instrument.group.position
      );
    });

    // Clock
    this.clock = new THREE.Clock();

    // Event listeners
    window.addEventListener('resize', () => this._onResize());
    // Mobile browser chrome and rotation can settle after the window event.
    this.viewportObserver = new ResizeObserver(() => this._onResize());
    this.viewportObserver.observe(this.container);

    // Start render loop
    this._animate();
  }

  _getInstrumentFamily(key) {
    return key.replace(/_\d+$/, '');
  }

  setQuality(quality, persist = true) {
    const profiles = {
      low: { pixelRatio: 1, fps: 30, shadows: false },
      medium: { pixelRatio: 1.5, fps: 0, shadows: true },
      high: { pixelRatio: 2, fps: 0, shadows: true }
    };
    const profile = profiles[quality];
    if (!profile) return;
    this.quality = quality;
    this.pixelRatioLimit = profile.pixelRatio;
    this.minimumRenderInterval = profile.fps ? 1000 / profile.fps : 0;
    this.lastRenderTimestamp = 0;
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, profile.pixelRatio));
    this.renderer.shadowMap.enabled = profile.shadows;
    this.frontWash.castShadow = profile.shadows;
    const shadowSize = quality === 'high' ? 2048 : 1024;
    if (this.frontWash.shadow.mapSize.width !== shadowSize) {
      this.frontWash.shadow.map?.dispose();
      this.frontWash.shadow.map = null;
      this.frontWash.shadow.mapSize.set(shadowSize, shadowSize);
    }
    this.stage.setQuality(quality);
    this.renderer.domElement.dataset.quality = quality;
    if (persist) {
      try { localStorage.setItem('midi_orchestra_mobile_quality', quality); } catch {}
    }
  }

  getStageFloorElevation(x, z) {
    // Drum Riser Platform Deck boundaries on stage:
    // Center at (0, -0.45), Width 4.8 (X: -2.40 to +2.40), Depth 3.8 (Z: -2.35 to +1.45)
    // Top deck elevation = 0.20m above main stage floor
    const onRiser = x >= -2.45 && x <= 2.45 && z >= -2.40 && z <= 1.50;
    return onRiser ? 0.20 : 0.0;
  }

  _getLayoutFootprint(family) {
    const footprints = {
      piano: { width: 3.5, depth: 2.1, priority: 95 },
      drums: { width: 4.4, depth: 3.1, priority: 100 },
      synth: { width: 1.8, depth: 1.8, priority: 88 },
      xylophone: { width: 1.8, depth: 1.7, priority: 84 },
      acousticGuitar: { width: 3.5, depth: 1.8, priority: 74 },
      guitar: { width: 1.65, depth: 1.3, priority: 72 },
      bass: { width: 1.7, depth: 1.3, priority: 70 },
      doubleBass: { width: 1.85, depth: 1.45, priority: 82 },
      cello: { width: 1.8, depth: 1.4, priority: 80 },
      flute: { width: 1.85, depth: 1.05, priority: 56 },
      violin: { width: 1.7, depth: 1.1, priority: 62 },
      trumpet: { width: 1.65, depth: 1.05, priority: 54 },
      frenchHorn: { width: 1.6, depth: 1.2, priority: 55 },
      sax: { width: 1.55, depth: 1.1, priority: 58 },
      clarinet: { width: 1.4, depth: 1.1, priority: 57 },
      cabasa: { width: 1.2, depth: 1.0, priority: 50 },
      tambourine: { width: 1.1, depth: 1.0, priority: 50 },
      maracas: { width: 1.1, depth: 1.0, priority: 50 },
      guiro: { width: 1.1, depth: 1.0, priority: 50 },
      whistle: { width: 1.0, depth: 0.9, priority: 48 },
      triangle: { width: 1.0, depth: 0.9, priority: 48 },
      congas: { width: 1.5, depth: 1.3, priority: 65 },
      timbales: { width: 1.4, depth: 1.1, priority: 64 },
      harp: { width: 2.1, depth: 1.8, priority: 85 },
      accordion: { width: 1.6, depth: 1.4, priority: 70 },
      harmonica: { width: 1.3, depth: 1.1, priority: 52 }
    };
    return footprints[family] || { width: 1.8, depth: 1.2, priority: 50 };
  }

  _buildLayoutUnits(activeKeys, prominenceByInstrument = {}) {
    const units = new Map();

    activeKeys.forEach((key) => {
      if (!this.allInstruments[key]) return;
      const family = this._getInstrumentFamily(key);

      // Piano and synth duplicates are physical keyboard tiers sharing a
      // stand, so they intentionally remain at the same stage anchor.
      const unitId = family === 'piano' || family === 'synth' ? family : key;
      if (!units.has(unitId)) {
        units.set(unitId, {
          id: unitId,
          family,
          keys: [],
          prominence: 0,
          ...this._getLayoutFootprint(family)
        });
      }
      const unit = units.get(unitId);
      unit.keys.push(key);
      unit.prominence += prominenceByInstrument[key] || 0;
    });

    return [...units.values()];
  }

  _packLayoutRows(items, maxWidth, gap = 0.65) {
    const ordered = [...items].sort((a, b) => {
      // A piano always takes the left-most available place in its row.
      if (a.family === 'piano' && b.family !== 'piano') return -1;
      if (b.family === 'piano' && a.family !== 'piano') return 1;
      return b.prominence - a.prominence || b.priority - a.priority || b.width - a.width;
    });
    const rows = [];

    ordered.forEach((item) => {
      let row = rows[rows.length - 1];
      const nextWidth = row ? row.width + gap + item.width : item.width;
      if (!row || (row.items.length > 0 && nextWidth > maxWidth)) {
        row = { items: [], width: 0, depth: 0 };
        rows.push(row);
      }
      row.width += (row.items.length ? gap : 0) + item.width;
      row.depth = Math.max(row.depth, item.depth);
      row.items.push(item);
    });

    return rows;
  }

  _measureSectionWidth(items, maxWidth = 5.45, itemGap = 0.65) {
    if (!items.length) return 0;
    return Math.max(...this._packLayoutRows(items, maxWidth, itemGap).map(row => row.width));
  }

  _placeInstrumentSection(items, placements, options = {}) {
    if (!items.length) return { backEdge: options.frontEdge ?? 1.65, width: 0 };

    const itemGap = options.itemGap ?? 0.65;
    const rowGap = options.rowGap ?? 0.5;
    const maxWidth = options.maxWidth || 5.45;
    const rows = this._packLayoutRows(items, maxWidth, itemGap);
    const sectionWidth = Math.max(...rows.map(row => row.width));
    let frontEdge = options.frontEdge ?? 1.65;

    rows.forEach((row, rowIndex) => {
      const rowStagger = rowIndex % 2 === 1 ? (options.rowStagger || 0) : 0;
      let cursorX;
      if (options.align === 'right') {
        cursorX = options.edgeX - row.width - rowStagger;
      } else if (options.align === 'left') {
        cursorX = options.edgeX + rowStagger;
      } else {
        cursorX = options.centerX - row.width / 2 + rowStagger;
      }
      const rowZ = frontEdge - row.depth / 2;

      row.items.forEach((item) => {
        placements.set(item.id, {
          x: cursorX + item.width / 2,
          z: rowZ
        });
        cursorX += item.width + itemGap;
      });

      frontEdge -= row.depth + rowGap;
    });

    return { backEdge: frontEdge, width: sectionWidth };
  }

  _placeInstrumentCascade(items, placements, options = {}) {
    if (!items.length) return { backEdge: options.frontEdge ?? 1.65, width: 0 };

    const frontEdge = options.frontEdge ?? 1.65;
    const lateralStep = options.lateralStep ?? 0.42;
    const depthStep = options.depthStep ?? 0.58;
    const verticalStep = options.verticalStep ?? 0;
    const trailingGap = options.trailingGap ?? 0.35;
    const direction = options.align === 'right' ? -1 : 1;
    const widestItem = Math.max(...items.map(item => item.width));
    const firstCenterX = options.edgeX + direction * widestItem / 2;
    let rearEdge = frontEdge;

    items.forEach((item, index) => {
      const z = frontEdge - item.depth / 2 - depthStep * index;
      placements.set(item.id, {
        x: firstCenterX + direction * lateralStep * index,
        z,
        ...(options.baseY !== undefined
          ? { y: options.baseY + verticalStep * index }
          : {})
      });
      rearEdge = Math.min(rearEdge, z - item.depth / 2);
    });

    return {
      backEdge: rearEdge - trailingGap,
      width: widestItem + lateralStep * Math.max(0, items.length - 1)
    };
  }

  _constrainPlacementsToStage(units, placements) {
    // Keep a margin inside the 20 x 12 stage deck. The front limit also keeps
    // every performer behind the floor monitors at z = 2.4.
    const limits = { left: -9.35, right: 9.35, back: -5.55, front: 1.75 };

    units.forEach((unit) => {
      const placement = placements.get(unit.id);
      if (!placement) return;

      let minOffsetX = -unit.width / 2;
      let maxOffsetX = unit.width / 2;
      let minOffsetZ = -unit.depth / 2;
      let maxOffsetZ = unit.depth / 2;

      unit.keys.forEach((key) => {
        const group = this.allInstruments[key].group;
        group.updateWorldMatrix(true, true);
        const box = new THREE.Box3().setFromObject(group);
        minOffsetX = Math.min(minOffsetX, box.min.x - group.position.x);
        maxOffsetX = Math.max(maxOffsetX, box.max.x - group.position.x);
        minOffsetZ = Math.min(minOffsetZ, box.min.z - group.position.z);
        maxOffsetZ = Math.max(maxOffsetZ, box.max.z - group.position.z);
      });

      const minAllowedX = limits.left - minOffsetX;
      const maxAllowedX = limits.right - maxOffsetX;
      const minAllowedZ = limits.back - minOffsetZ;
      const maxAllowedZ = limits.front - maxOffsetZ;

      placement.x = minAllowedX <= maxAllowedX
        ? THREE.MathUtils.clamp(placement.x, minAllowedX, maxAllowedX)
        : (minAllowedX + maxAllowedX) / 2;
      placement.z = minAllowedZ <= maxAllowedZ
        ? THREE.MathUtils.clamp(placement.z, minAllowedZ, maxAllowedZ)
        : (minAllowedZ + maxAllowedZ) / 2;
    });
  }

  /**
   * Calculate a compact, collision-aware stage arrangement for the instruments
   * assigned to the song. It is called on load/reassignment, not while an
   * instrument temporarily disappears during a rest.
   */
  layoutInstruments(activeInstrumentNames, prominenceByInstrument = {}, animate = true) {
    const activeKeys = [...new Set(activeInstrumentNames || [])]
      .filter(key => this.allInstruments[key]);
    const signature = [...activeKeys]
      .sort()
      .map(key => `${key}:${prominenceByInstrument[key] || 0}`)
      .join('|');
    if (!signature || signature === this._instrumentLayoutSignature) return;
    this._instrumentLayoutSignature = signature;

    const units = this._buildLayoutUnits(activeKeys, prominenceByInstrument);
    const placements = new Map();
    const drumUnit = units.find(unit => unit.family === 'drums');
    const remaining = units.filter(unit => unit !== drumUnit);

    // Dedicated percussion section: timbales, congas/bongos, cabasa, tambourine, maracas, guiro, whistle, triangle
    const percussionFamilies = ['timbales', 'congas', 'cabasa', 'tambourine', 'maracas', 'guiro', 'whistle', 'triangle'];
    const timbalesUnits = remaining.filter(unit => unit.family === 'timbales');
    const congasUnits = remaining.filter(unit => unit.family === 'congas');
    const cabasaUnits = remaining.filter(unit => unit.family === 'cabasa');
    const tambourineUnits = remaining.filter(unit => unit.family === 'tambourine');
    const triangleUnits = remaining.filter(unit => unit.family === 'triangle');
    const maracasUnits = remaining.filter(unit => unit.family === 'maracas');
    const guiroUnits = remaining.filter(unit => unit.family === 'guiro');
    const whistleUnits = remaining.filter(unit => unit.family === 'whistle');

    const placePercussion = () => {
      // 1. Timbales: Left behind drums on the riser platform
      timbalesUnits.forEach((unit, idx) => {
        placements.set(unit.id, {
          x: -1.65 - idx * 0.40,
          z: -1.15 - idx * 0.35,
          y: 0.20
        });
      });

      // 2. Bongó y Congas: Right behind drums on the riser platform
      congasUnits.forEach((unit, idx) => {
        placements.set(unit.id, {
          x: 1.65 + idx * 0.40,
          z: -1.15 - idx * 0.35,
          y: 0.20
        });
      });

      // 3. Left wing (hi-hat / crash side) floating auxiliary percussion
      cabasaUnits.forEach((unit, idx) => {
        placements.set(unit.id, {
          x: -1.35 - idx * 0.28,
          z: 0.65 + idx * 0.15,
          y: 1.05
        });
      });

      tambourineUnits.forEach((unit, idx) => {
        placements.set(unit.id, {
          x: -1.65 - idx * 0.28,
          z: 0.15 + idx * 0.15,
          y: 1.15
        });
      });

      // Triangle placed forward-left in open air, completely clear of cymbals
      triangleUnits.forEach((unit, idx) => {
        placements.set(unit.id, {
          x: -1.28 - idx * 0.25,
          z: 1.05 + idx * 0.15,
          y: 1.28
        });
      });

      // 4. Right wing (ride / floor tom side) floating auxiliary percussion
      maracasUnits.forEach((unit, idx) => {
        placements.set(unit.id, {
          x: 1.35 + idx * 0.28,
          z: 0.65 + idx * 0.15,
          y: 1.05
        });
      });

      guiroUnits.forEach((unit, idx) => {
        placements.set(unit.id, {
          x: 1.65 + idx * 0.28,
          z: 0.15 + idx * 0.15,
          y: 1.12
        });
      });

      // Whistle placed forward-right in open air, completely clear of cymbals
      whistleUnits.forEach((unit, idx) => {
        placements.set(unit.id, {
          x: 1.28 + idx * 0.25,
          z: 1.05 + idx * 0.15,
          y: 1.28
        });
      });
    };

    const melodicUnits = remaining.filter(unit => !percussionFamilies.includes(unit.family));
    const keyboards = melodicUnits.filter(unit => ['piano', 'synth', 'xylophone', 'accordion'].includes(unit.family));
    const strings = melodicUnits.filter(unit => ['violin', 'cello', 'doubleBass', 'harp'].includes(unit.family));
    const electricGuitars = melodicUnits.filter(unit => unit.family === 'guitar');
    const acousticGuitars = melodicUnits.filter(unit => unit.family === 'acousticGuitar');
    const basses = melodicUnits.filter(unit => unit.family === 'bass');
    const guitars = [...electricGuitars, ...acousticGuitars];
    const winds = melodicUnits.filter(unit => ['trumpet', 'sax', 'flute', 'frenchHorn', 'clarinet', 'harmonica'].includes(unit.family));
    const auxiliaries = melodicUnits.filter(unit =>
      !keyboards.includes(unit) && !strings.includes(unit) &&
      !guitars.includes(unit) && !basses.includes(unit) && !winds.includes(unit)
    );

    const leftCount = basses.length + keyboards.length + strings.length;
    const rightCount = guitars.length + winds.length;
    const leftAuxiliaries = leftCount <= rightCount ? auxiliaries : [];
    const rightAuxiliaries = leftCount > rightCount ? auxiliaries : [];
    // Match the keyboard-tier idea: all guitars in one family share the same
    // horizontal anchor. Each additional instrument rises and moves slightly
    // toward the back, instead of spreading sideways.
    const electricCascadeOptions = {
      lateralStep: 0,
      depthStep: 0.42,
      verticalStep: 0.28,
      baseY: 0.78
    };
    const acousticCascadeOptions = {
      lateralStep: 0,
      depthStep: 0.42,
      verticalStep: 0.28,
      baseY: 0.9
    };
    // Compare the strongest individual part in each guitar family. Summing a
    // handful of sparse electric tracks could otherwise push a genuinely lead
    // acoustic guitar behind them.
    const electricProminence = Math.max(0, ...electricGuitars.map(unit => unit.prominence));
    const acousticProminence = Math.max(0, ...acousticGuitars.map(unit => unit.prominence));
    const acousticGuitarsFirst = acousticGuitars.length > 0 &&
      (electricGuitars.length === 0 || acousticProminence > electricProminence);
    const byProminence = (a, b) =>
      b.prominence - a.prominence || b.priority - a.priority || b.width - a.width;
    const primaryGuitars = acousticGuitarsFirst ? acousticGuitars : electricGuitars;
    const secondaryGuitars = acousticGuitarsFirst ? electricGuitars : acousticGuitars;
    const orderedPrimaryGuitars = primaryGuitars.sort(byProminence);
    const orderedSecondaryGuitars = secondaryGuitars.sort(byProminence);
    const orderedWinds = [...winds].sort(byProminence);

    const placeGuitarSections = (align, edgeX) => {
      const primaryIsAcoustic = orderedPrimaryGuitars[0]?.family === 'acousticGuitar';
      const primaryLayout = this._placeInstrumentCascade(orderedPrimaryGuitars, placements, {
        ...(primaryIsAcoustic ? acousticCascadeOptions : electricCascadeOptions),
        align,
        edgeX,
        frontEdge: 1.65
      });
      const secondaryLayout = this._placeInstrumentCascade(orderedSecondaryGuitars, placements, {
        ...(primaryIsAcoustic ? electricCascadeOptions : acousticCascadeOptions),
        align,
        edgeX,
        frontEdge: orderedPrimaryGuitars.length ? primaryLayout.backEdge - 0.2 : 1.65
      });

      return {
        backEdge: orderedSecondaryGuitars.length ? secondaryLayout.backEdge : primaryLayout.backEdge,
        hasInstruments: orderedPrimaryGuitars.length > 0 || orderedSecondaryGuitars.length > 0
      };
    };

    const placeBasses = (align, edgeX, frontEdge = 1.65) => this._placeInstrumentSection(basses, placements, {
      align,
      edgeX,
      frontEdge,
      maxWidth: 3.75,
      itemGap: 0.3,
      rowGap: 0.35
    });

    const placeWinds = (align, edgeX, frontEdge) => this._placeInstrumentCascade(
      orderedWinds,
      placements,
      {
        align,
        edgeX,
        frontEdge,
        lateralStep: 0.22,
        depthStep: 0.58,
        trailingGap: 0.35
      }
    );

    if (drumUnit) {
      // The drum kit is the anchor: moved forward on the riser towards +Z
      placements.set(drumUnit.id, { x: 0, z: 0.20, y: 0.20 });
      placePercussion();
      const leftEdge = -(drumUnit.width / 2 + 0.55);
      const rightEdge = drumUnit.width / 2 + 0.55;
      // Put the electric bass at the front-left corner of the drum riser. A
      // deliberately forward front edge lets the stage-boundary pass place
      // the complete model as close to the corner as its real geometry allows.
      // The bass model leans outward from its group origin, so its packing edge
      // must overlap the riser footprint slightly for the visible body and
      // stand to land exactly beside the front corner.
      const bassCornerEdge = -(drumUnit.width / 2 - 0.4);
      const bassLayout = placeBasses('right', bassCornerEdge, 2.2);
      const keyboardEdge = leftEdge;
      const keyboardFront = basses.length ? bassLayout.backEdge - 0.2 : 1.65;

      const keyboardLayout = this._placeInstrumentSection(keyboards, placements, {
        align: 'right', edgeX: keyboardEdge, frontEdge: keyboardFront,
        maxWidth: 3.85, itemGap: 0.25
      });
      // Orchestral strings occupy the same stage-left section, one row behind
      // the piano/keyboard players.
      const stringsFront = keyboards.length ? keyboardLayout.backEdge - 0.2 : 1.65;
      const stringLayout = this._placeInstrumentSection(strings, placements, {
        align: 'right', edgeX: keyboardEdge, frontEdge: stringsFront
      });
      this._placeInstrumentSection(leftAuxiliaries, placements, {
        align: 'right', edgeX: keyboardEdge,
        frontEdge: Math.min(keyboardLayout.backEdge, stringLayout.backEdge) - 0.2
      });

      // Mirror the bass's visual corner correction on stage-right so the
      // guitar stack sits beside the riser instead of floating far away.
      const guitarCornerEdge = drumUnit.width / 2 - 0.4;
      const guitarLayout = placeGuitarSections('left', guitarCornerEdge);
      const windsFront = guitarLayout.hasInstruments ? guitarLayout.backEdge - 0.2 : 1.65;
      const windLayout = placeWinds('left', rightEdge, windsFront);
      this._placeInstrumentSection(rightAuxiliaries, placements, {
        align: 'left', edgeX: rightEdge,
        frontEdge: Math.min(guitarLayout.backEdge, windLayout.backEdge) - 0.2
      });
    } else {
      placePercussion();
      const leftItems = [...basses, ...keyboards, ...strings, ...leftAuxiliaries];
      const rightItems = [...guitars, ...winds, ...rightAuxiliaries];
      const bassWidth = this._measureSectionWidth(basses, 3.75, 0.3);
      const keyboardAreaWidth = Math.max(
        this._measureSectionWidth(keyboards, 3.85, 0.25),
        this._measureSectionWidth(strings),
        this._measureSectionWidth(leftAuxiliaries)
      );
      const leftWidth = Math.max(bassWidth, keyboardAreaWidth);
      const rightWidth = Math.max(
        guitars.length
          ? Math.max(...guitars.map(unit => unit.width))
          : 0,
        orderedWinds.length
          ? Math.max(...orderedWinds.map(unit => unit.width)) +
            0.22 * (orderedWinds.length - 1)
          : 0,
        this._measureSectionWidth(rightAuxiliaries)
      );
      const hasBothSides = leftItems.length > 0 && rightItems.length > 0;
      const leftEdge = hasBothSides ? -0.45 : leftWidth / 2 - (keyboards.length ? 0.8 : 0);
      const rightEdge = hasBothSides ? 0.45 : -rightWidth / 2;
      const bassLayout = placeBasses('right', leftEdge);
      const keyboardEdge = leftEdge;
      const keyboardFront = basses.length ? bassLayout.backEdge - 0.2 : 1.65;

      const keyboardLayout = this._placeInstrumentSection(keyboards, placements, {
        align: 'right', edgeX: keyboardEdge, frontEdge: keyboardFront,
        maxWidth: 3.85, itemGap: 0.25
      });
      const stringLayout = this._placeInstrumentSection(strings, placements, {
        align: 'right', edgeX: keyboardEdge,
        frontEdge: keyboards.length ? keyboardLayout.backEdge - 0.2 : 1.65
      });
      this._placeInstrumentSection(leftAuxiliaries, placements, {
        align: 'right', edgeX: keyboardEdge,
        frontEdge: Math.min(keyboardLayout.backEdge, stringLayout.backEdge) - 0.2
      });

      const guitarLayout = placeGuitarSections('left', rightEdge);
      const windLayout = placeWinds(
        'left',
        rightEdge,
        guitarLayout.hasInstruments ? guitarLayout.backEdge - 0.2 : 1.65
      );
      this._placeInstrumentSection(rightAuxiliaries, placements, {
        align: 'left', edgeX: rightEdge,
        frontEdge: Math.min(guitarLayout.backEdge, windLayout.backEdge) - 0.2
      });
    }

    this._constrainPlacementsToStage(units, placements);

    const cameraTargets = new Map();
    const layoutBounds = new THREE.Box3();

    units.forEach((unit) => {
      const placement = placements.get(unit.id);
      if (!placement) return;

      unit.keys.forEach((key) => {
        const instrument = this.allInstruments[key];
        const home = this.instrumentHomeTransforms.get(key);
        // Elevate instruments resting on the drum riser platform so feet, stands,
        // and sustain pedals sit on top of the deck rather than being buried 0.20m underneath.
        const riserPercussion = ['drums', 'timbales', 'congas', 'cabasa', 'tambourine', 'maracas', 'guiro', 'whistle', 'triangle'];
        const riserElevation = riserPercussion.includes(this._getInstrumentFamily(key))
          ? 0
          : this.getStageFloorElevation(placement.x, placement.z);
        const baseY = (placement.y !== undefined ? placement.y : home.y) + riserElevation;
        const targetPosition = new THREE.Vector3(
          placement.x,
          baseY,
          placement.z
        );

        instrument.group.updateWorldMatrix(true, true);
        const box = new THREE.Box3().setFromObject(instrument.group);
        const size = box.getSize(new THREE.Vector3());
        const centerOffset = box.getCenter(new THREE.Vector3()).sub(instrument.group.position);
        const finalCenter = targetPosition.clone().add(centerOffset);
        cameraTargets.set(key, finalCenter);
        layoutBounds.expandByPoint(finalCenter.clone().sub(size.clone().multiplyScalar(0.5)));
        layoutBounds.expandByPoint(finalCenter.clone().add(size.clone().multiplyScalar(0.5)));

        if (this.cameraController) {
          this.cameraController.updateInstrumentPreset(key, finalCenter, size, instrument.group, targetPosition);
        }

        gsap.killTweensOf(instrument.group.position);
        if (animate) {
          gsap.to(instrument.group.position, {
            x: targetPosition.x,
            y: targetPosition.y,
            z: targetPosition.z,
            duration: 0.72,
            ease: 'power2.inOut'
          });
        } else {
          instrument.group.position.copy(targetPosition);
        }
      });
    });

    if (this.cameraController && !layoutBounds.isEmpty()) {
      this.cameraController.updateOverviewPreset(layoutBounds);
    }
    if (this.stage && typeof this.stage.updateInstrumentLayout === 'function') {
      this.stage.updateInstrumentLayout(cameraTargets);
    }
  }

  _setupGlobalLighting() {
    // Ambient concert hall lighting
    const ambientLight = new THREE.AmbientLight(0x1a1a2e, 1.2);
    this.scene.add(ambientLight);

    // Subtle Hemisphere Light for natural bounce
    const hemiLight = new THREE.HemisphereLight(0x3a3a5e, 0x111116, 0.8);
    this.scene.add(hemiLight);

    // Front stage wash light
    const frontWash = new THREE.DirectionalLight(0x7099ff, 1.2);
    this.frontWash = frontWash;
    frontWash.position.set(0, 8, 12);
    frontWash.castShadow = true;
    frontWash.shadow.mapSize.width = this.isMobilePerformanceMode ? 1024 : 2048;
    frontWash.shadow.mapSize.height = this.isMobilePerformanceMode ? 1024 : 2048;
    frontWash.shadow.bias = -0.0005;
    this.scene.add(frontWash);
  }

  // Dynamically show or hide 3D instruments based on MIDI song assignment
  setVisibleInstruments(activeInstrumentNames) {
    const activeSet = new Set(activeInstrumentNames);
    this.visibleInstrumentNames = activeSet;

    this._applyInstrumentVisibility();

    // Update Camera Controller with current visible instruments
    if (this.cameraController) {
      this.cameraController.setActiveInstruments(activeSet);
    }

    // Update Stage spotlights
    if (this.stage && typeof this.stage.updateSpotlightsForActiveInstruments === 'function') {
      this.stage.updateSpotlightsForActiveInstruments(activeSet);
    }
  }

  _applyInstrumentVisibility() {
    const activeSet = this.visibleInstrumentNames || new Set();
    const presetName = this.cameraController?.currentPreset || 'overview';
    const widePresets = new Set(['overview', 'conductor', 'stage_wing_left', 'stage_wing_right']);
    let focusedInstrument = null;

    if (!widePresets.has(presetName)) {
      // Match longer instance IDs first, e.g. guitar_2 before guitar, then
      // accept its derived views such as guitar_2_closeup.
      focusedInstrument = Object.keys(this.allInstruments)
        .sort((a, b) => b.length - a.length)
        .find(key => presetName === key || presetName.startsWith(`${key}_`)) || null;
    }

    for (const key in this.allInstruments) {
      const instObj = this.allInstruments[key];
      if (instObj && instObj.group) {
        instObj.group.visible = activeSet.has(key) || key === focusedInstrument;
      }
    }
  }

  // Handle Note-On for 3D Instruments (supporting duplicate instances)
  handleNotePrepare(instrument, midiPitch, noteName, velocity = 0.8, duration = 0.5, instanceId = null, eventTime = null, trackIndex = null) {
    const targetKey = (instanceId && this.allInstruments[instanceId]) ? instanceId : instrument;
    const instObj = this.allInstruments[targetKey];

    if (instObj && typeof instObj.onNotePrepare === 'function') {
      instObj.onNotePrepare(midiPitch, velocity, duration, eventTime, trackIndex);
    }
  }

  // Handle Note-On for 3D Instruments (supporting duplicate instances)
  handleNoteOn(instrument, midiPitch, noteName, velocity = 0.8, duration = 0.5, instanceId = null, eventTime = null, trackIndex = null) {
    const targetKey = (instanceId && this.allInstruments[instanceId]) ? instanceId : instrument;
    const instObj = this.allInstruments[targetKey];

    if (instObj && typeof instObj.onNoteOn === 'function') {
      instObj.onNoteOn(midiPitch, velocity, eventTime, trackIndex, duration);
    }

    const baseInst = instrument.split('_')[0];
    const spotMap = {
      piano: 'piano',
      drums: 'drum',
      guitar: 'guitar',
      acousticGuitar: 'guitar',
      bass: 'bass',
      doubleBass: 'bass',
      trumpet: 'trumpet',
      frenchHorn: 'trumpet',
      sax: 'trumpet',
      clarinet: 'flute',
      violin: 'violin',
      cello: 'cello',
      flute: 'flute',
      xylophone: 'piano',
      synth: 'piano',
      cabasa: 'drum',
      tambourine: 'drum',
      maracas: 'drum',
      guiro: 'drum',
      whistle: 'drum',
      triangle: 'drum',
      congas: 'drum',
      timbales: 'drum',
      harp: 'harp',
      harmonica: 'harmonica',
      accordion: 'accordion'
    };
    const spotName = spotMap[baseInst] || 'piano';
    this.stage.pulseInstrumentSpotlight(spotName, velocity);
  }

  // Handle Note-Off for 3D Instruments (supporting duplicate instances)
  handleNoteOff(instrument, midiPitch, noteName, force = false, instanceId = null) {
    const targetKey = (instanceId && this.allInstruments[instanceId]) ? instanceId : instrument;
    const instObj = this.allInstruments[targetKey];

    if (instObj && typeof instObj.onNoteOff === 'function') {
      instObj.onNoteOff(midiPitch, force);
    }
  }

  _onResize() {
    // innerWidth can include the previous landscape canvas overflow on mobile.
    // CSS owns the canvas layout; only resize its drawing buffer here.
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    if (!width || !height) return;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    if (this.cameraController) {
      this.cameraController.setViewportAspect(this.camera.aspect);
    }

    this.renderer.setSize(width, height, false);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, this.pixelRatioLimit));
  }

  _animate(timestamp = performance.now()) {
    requestAnimationFrame((nextTimestamp) => this._animate(nextTimestamp));

    if (
      this.minimumRenderInterval > 0 &&
      timestamp - this.lastRenderTimestamp < this.minimumRenderInterval - 0.5
    ) {
      return;
    }
    const elapsed = timestamp - this.lastRenderTimestamp;
    this.lastRenderTimestamp = this.minimumRenderInterval && elapsed >= this.minimumRenderInterval
      ? timestamp - (elapsed % this.minimumRenderInterval)
      : timestamp;

    const delta = Math.min(this.clock.getDelta(), 0.05);

    // Get real-time audio visualizer spectrum
    const visData = this.soundEngine ? this.soundEngine.getVisualizerData() : null;

    // Update 3D components
    this.cameraController.update(delta);
    this.stage.update(delta, visData);

    // Update only visible instruments for peak performance
    for (const key in this.allInstruments) {
      const instObj = this.allInstruments[key];
      if (instObj && instObj.group?.visible && typeof instObj.update === 'function') {
        instObj.update(delta);
      }
    }

    // Render frame
    this.renderer.render(this.scene, this.camera);
  }
}
