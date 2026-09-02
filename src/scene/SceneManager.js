import * as THREE from 'three';
import { Stage } from './Stage.js';
import { Piano3D } from './Piano3D.js';
import { DrumKit3D } from './DrumKit3D.js';
import { Guitar3D } from './Guitar3D.js';
import { Bass3D } from './Bass3D.js';
import { Trumpet3D } from './Trumpet3D.js';
import { Saxophone3D } from './Saxophone3D.js';
import { Violin3D } from './Violin3D.js';
import { Flute3D } from './Flute3D.js';
import { Xylophone3D } from './Xylophone3D.js';
import { Synth3D } from './Synth3D.js';
import { CameraController } from './CameraController.js';

/**
 * SceneManager orchestrates the Three.js 3D world, lighting, rendering loop,
 * and passes MIDI events to all 3D musical instruments.
 */
export class SceneManager {
  constructor(canvasContainer, soundEngine) {
    this.container = canvasContainer;
    this.soundEngine = soundEngine;

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
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;

    this.container.appendChild(this.renderer.domElement);

    // Build scene elements
    this._setupGlobalLighting();

    this.stage = new Stage(this.scene);

    // Primary instruments
    this.piano = new Piano3D(this.scene, { tier: 1, hasStand: true });
    this.drums = new DrumKit3D(this.scene);
    this.guitar = new Guitar3D(this.scene, { index: 1 });
    this.guitar.group.position.set(1.65, 1.25, 0.95);
    this.bass = new Bass3D(this.scene);
    this.trumpet = new Trumpet3D(this.scene);
    this.sax = new Saxophone3D(this.scene);
    this.violin = new Violin3D(this.scene);
    this.flute = new Flute3D(this.scene);
    this.xylophone = new Xylophone3D(this.scene);
    this.synth = new Synth3D(this.scene, { tier: 1, hasStand: true });

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

    this.trumpet_2 = new Trumpet3D(this.scene);
    this.trumpet_2.group.position.set(4.9, 1.5, 1.1);
    this.trumpet_2.group.rotation.y = -0.42;
    this.trumpet_2.brassMaterial.color.setHex(0xd0d8e4); // Chrome/Silver Trumpet
    this.trumpet_2.group.visible = false;

    this.sax_2 = new Saxophone3D(this.scene);
    this.sax_2.group.position.set(4.4, 1.25, 2.2);
    this.sax_2.group.rotation.y = -0.52;
    this.sax_2.brassMaterial.color.setHex(0xc2c8d2); // Vintage Nickel Alto Sax
    this.sax_2.group.visible = false;

    this.violin_2 = new Violin3D(this.scene);
    this.violin_2.group.position.set(-5.1, 1.30, -2.6);
    this.violin_2.group.rotation.set(0.12, Math.PI * 0.18, -0.06);
    this.violin_2.varnishMaterial.color.setHex(0x421d0d); // Dark Antique Violin
    this.violin_2.group.visible = false;

    this.flute_2 = new Flute3D(this.scene);
    this.flute_2.group.position.set(2.3, 1.30, 2.4);
    this.flute_2.group.rotation.y = -0.28;
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
    this.xylophone_2.group.rotation.y = -0.25;
    this.xylophone_2.group.visible = false;

    this.allInstruments = {
      piano: this.piano,
      drums: this.drums,
      guitar: this.guitar,
      bass: this.bass,
      trumpet: this.trumpet,
      sax: this.sax,
      violin: this.violin,
      flute: this.flute,
      xylophone: this.xylophone,
      synth: this.synth,
      piano_2: this.piano_2,
      piano_3: this.piano_3,
      piano_4: this.piano_4,
      guitar_2: this.guitar_2,
      guitar_3: this.guitar_3,
      guitar_4: this.guitar_4,
      bass_2: this.bass_2,
      trumpet_2: this.trumpet_2,
      sax_2: this.sax_2,
      violin_2: this.violin_2,
      flute_2: this.flute_2,
      xylophone_2: this.xylophone_2,
      synth_2: this.synth_2,
      synth_3: this.synth_3,
      synth_4: this.synth_4
    };

    this.cameraController = new CameraController(
      this.camera,
      this.renderer.domElement,
      this.scene
    );

    // Clock
    this.clock = new THREE.Clock();

    // Event listeners
    window.addEventListener('resize', () => this._onResize());

    // Start render loop
    this._animate();
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
    frontWash.position.set(0, 8, 12);
    frontWash.castShadow = true;
    frontWash.shadow.mapSize.width = 2048;
    frontWash.shadow.mapSize.height = 2048;
    frontWash.shadow.bias = -0.0005;
    this.scene.add(frontWash);
  }

  // Dynamically show or hide 3D instruments based on MIDI song assignment
  setVisibleInstruments(activeInstrumentNames) {
    const activeSet = new Set(activeInstrumentNames);

    for (const key in this.allInstruments) {
      const instObj = this.allInstruments[key];
      if (instObj && instObj.group) {
        instObj.group.visible = activeSet.has(key);
      }
    }

    // Update Camera Controller with current visible instruments
    if (this.cameraController) {
      this.cameraController.setActiveInstruments(activeSet);
    }

    // Update Stage spotlights
    if (this.stage && typeof this.stage.updateSpotlightsForActiveInstruments === 'function') {
      this.stage.updateSpotlightsForActiveInstruments(activeSet);
    }
  }

  // Handle Note-On for 3D Instruments (supporting duplicate instances)
  handleNoteOn(instrument, midiPitch, noteName, velocity = 0.8, duration = 0.5, instanceId = null) {
    const targetKey = (instanceId && this.allInstruments[instanceId]) ? instanceId : instrument;
    const instObj = this.allInstruments[targetKey];

    if (instObj && typeof instObj.onNoteOn === 'function') {
      instObj.onNoteOn(midiPitch, velocity);
    }

    const baseInst = instrument.split('_')[0];
    const spotMap = {
      piano: 'piano',
      drums: 'drum',
      guitar: 'guitar',
      bass: 'bass',
      trumpet: 'trumpet',
      sax: 'trumpet',
      violin: 'bass',
      flute: 'guitar',
      xylophone: 'drum',
      synth: 'piano'
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
    const width = window.innerWidth;
    const height = window.innerHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  }

  _animate() {
    requestAnimationFrame(() => this._animate());

    const delta = this.clock.getDelta();

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
