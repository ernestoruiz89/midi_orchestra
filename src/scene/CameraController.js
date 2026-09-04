import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import gsap from 'gsap';

/**
 * CameraController provides buttery smooth OrbitControls, cinematic camera presets,
 * click-to-focus raycasting, auto-rotation, and WASD free fly navigation.
 */
export class CameraController {
  constructor(camera, domElement, scene) {
    this.camera = camera;
    this.domElement = domElement;
    this.scene = scene;

    this.controls = new OrbitControls(this.camera, this.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.maxDistance = 25;
    this.controls.minDistance = 1.0;
    this.controls.maxPolarAngle = Math.PI / 2 - 0.02; // Don't clip below stage floor
    this.controls.target.set(0, 1.5, 0);

    // Camera Presets (Including dynamic MIDIJam cinematography angles for all 10 instruments)
    this.presets = {
      overview: { pos: new THREE.Vector3(0, 4.8, 11.0), target: new THREE.Vector3(0, 1.5, 0) },
      piano: { pos: new THREE.Vector3(-3.00, 1.76, 1.51), target: new THREE.Vector3(-3.54, 0.96, 0.38) },
      piano_topdown: { pos: new THREE.Vector3(-3.37, 2.33, 0.74), target: new THREE.Vector3(-3.54, 0.96, 0.38) },
      piano_closeup: { pos: new THREE.Vector3(-3.23, 1.33, 1.04), target: new THREE.Vector3(-3.54, 0.96, 0.38) },
      piano_sweep: { pos: new THREE.Vector3(-2.11, 1.43, 0.81), target: new THREE.Vector3(-3.71, 0.96, 0.46) },
      drums: { pos: new THREE.Vector3(0.00, 2.30, 4.05), target: new THREE.Vector3(0.00, 0.95, 0.20) },
      drums_overhead: { pos: new THREE.Vector3(0.00, 3.40, 1.35), target: new THREE.Vector3(0.00, 0.85, 0.20) },
      drums_side: { pos: new THREE.Vector3(-2.45, 1.65, 2.15), target: new THREE.Vector3(0.00, 0.95, 0.20) },
      guitar: { pos: new THREE.Vector3(2.85, 1.45, 3.85), target: new THREE.Vector3(2.80, 1.25, 0.95) },
      guitar_neck: { pos: new THREE.Vector3(3.10, 1.45, 2.45), target: new THREE.Vector3(2.95, 1.30, 0.95) },
      guitar_closeup: { pos: new THREE.Vector3(2.45, 1.35, 2.45), target: new THREE.Vector3(2.55, 1.20, 0.95) },
      acousticGuitar: { pos: new THREE.Vector3(1.25, 1.45, 3.90), target: new THREE.Vector3(1.20, 1.25, 1.42) },
      acousticGuitar_neck: { pos: new THREE.Vector3(1.50, 1.45, 2.85), target: new THREE.Vector3(1.35, 1.30, 1.42) },
      acousticGuitar_closeup: { pos: new THREE.Vector3(0.95, 1.35, 2.85), target: new THREE.Vector3(1.05, 1.20, 1.42) },
      acousticGuitar_2: { pos: new THREE.Vector3(1.48, 1.40, 3.65), target: new THREE.Vector3(1.42, 1.18, 1.20) },
      acousticGuitar_3: { pos: new THREE.Vector3(1.70, 1.35, 3.40), target: new THREE.Vector3(1.65, 1.10, 0.95) },
      acousticGuitar_4: { pos: new THREE.Vector3(1.92, 1.30, 3.15), target: new THREE.Vector3(1.88, 1.05, 0.70) },
      bass: { pos: new THREE.Vector3(-2.00, 1.35, 2.75), target: new THREE.Vector3(-2.00, 1.25, -0.10) },
      bass_closeup: { pos: new THREE.Vector3(-2.15, 1.25, 1.45), target: new THREE.Vector3(-2.05, 1.15, -0.10) },
      doubleBass: { pos: new THREE.Vector3(-2.85, 1.45, 3.15), target: new THREE.Vector3(-2.85, 1.20, -0.70) },
      doubleBass_closeup: { pos: new THREE.Vector3(-2.70, 1.30, 1.15), target: new THREE.Vector3(-2.85, 1.15, -0.70) },
      doubleBass_2: { pos: new THREE.Vector3(-3.10, 1.45, 2.85), target: new THREE.Vector3(-3.10, 1.20, -0.35) },
      trumpet: { pos: new THREE.Vector3(4.10, 1.52, 1.55), target: new THREE.Vector3(4.45, 1.45, 0.40) },
      trumpet_closeup: { pos: new THREE.Vector3(3.95, 1.48, 1.25), target: new THREE.Vector3(4.40, 1.45, 0.40) },
      frenchHorn: { pos: new THREE.Vector3(4.35, 1.51, 2.45), target: new THREE.Vector3(4.16, 1.29, 1.22) },
      frenchHorn_closeup: { pos: new THREE.Vector3(4.30, 1.45, 2.05), target: new THREE.Vector3(4.16, 1.29, 1.22) },
      sax: { pos: new THREE.Vector3(3.15, 1.45, 3.35), target: new THREE.Vector3(3.40, 1.35, 1.80) },
      sax_closeup: { pos: new THREE.Vector3(3.05, 1.40, 2.85), target: new THREE.Vector3(3.40, 1.35, 1.80) },
      clarinet: { pos: new THREE.Vector3(3.55, 1.47, 3.19), target: new THREE.Vector3(2.35, 1.30, 2.20) },
      clarinet_closeup: { pos: new THREE.Vector3(3.18, 1.41, 2.85), target: new THREE.Vector3(2.38, 1.31, 2.22) },
      violin: { pos: new THREE.Vector3(-4.12, 1.45, 0.05), target: new THREE.Vector3(-4.15, 1.38, -1.80) },
      violin_closeup: { pos: new THREE.Vector3(-4.15, 1.40, -0.55), target: new THREE.Vector3(-4.15, 1.38, -1.80) },
      cello: { pos: new THREE.Vector3(-3.10, 1.45, 1.15), target: new THREE.Vector3(-3.30, 1.25, -1.20) },
      cello_closeup: { pos: new THREE.Vector3(-3.15, 1.35, 0.30), target: new THREE.Vector3(-3.30, 1.25, -1.20) },
      flute: { pos: new THREE.Vector3(1.60, 1.52, 3.05), target: new THREE.Vector3(1.60, 1.46, 1.80) },
      flute_closeup: { pos: new THREE.Vector3(1.60, 1.50, 2.65), target: new THREE.Vector3(1.60, 1.46, 1.80) },
      xylophone: { pos: new THREE.Vector3(-3.00, 1.78, 2.10), target: new THREE.Vector3(-3.54, 0.96, 0.38) },
      xylophone_topdown: { pos: new THREE.Vector3(-3.37, 2.45, 0.70), target: new THREE.Vector3(-3.54, 0.96, 0.38) },
      xylophone_closeup: { pos: new THREE.Vector3(-3.23, 1.30, 1.15), target: new THREE.Vector3(-3.54, 0.96, 0.38) },
      cabasa: { pos: new THREE.Vector3(-1.35, 1.25, 1.55), target: new THREE.Vector3(-1.35, 1.05, 0.65) },
      cabasa_closeup: { pos: new THREE.Vector3(-1.35, 1.15, 1.15), target: new THREE.Vector3(-1.35, 1.05, 0.65) },
      tambourine: { pos: new THREE.Vector3(-2.15, 1.35, 0.75), target: new THREE.Vector3(-1.65, 1.15, 0.15) },
      tambourine_closeup: { pos: new THREE.Vector3(-2.00, 1.25, 0.50), target: new THREE.Vector3(-1.65, 1.15, 0.15) },
      triangle: { pos: new THREE.Vector3(-1.28, 1.45, 1.85), target: new THREE.Vector3(-1.28, 1.28, 1.05) },
      triangle_closeup: { pos: new THREE.Vector3(-1.28, 1.36, 1.50), target: new THREE.Vector3(-1.28, 1.28, 1.05) },
      maracas: { pos: new THREE.Vector3(1.35, 1.25, 1.55), target: new THREE.Vector3(1.35, 1.05, 0.65) },
      maracas_closeup: { pos: new THREE.Vector3(1.35, 1.15, 1.15), target: new THREE.Vector3(1.35, 1.05, 0.65) },
      guiro: { pos: new THREE.Vector3(2.15, 1.35, 0.75), target: new THREE.Vector3(1.65, 1.12, 0.15) },
      guiro_closeup: { pos: new THREE.Vector3(2.00, 1.25, 0.50), target: new THREE.Vector3(1.65, 1.12, 0.15) },
      whistle: { pos: new THREE.Vector3(1.28, 1.45, 1.85), target: new THREE.Vector3(1.28, 1.28, 1.05) },
      whistle_closeup: { pos: new THREE.Vector3(1.28, 1.36, 1.50), target: new THREE.Vector3(1.28, 1.28, 1.05) },
      congas: { pos: new THREE.Vector3(1.65, 1.65, 0.25), target: new THREE.Vector3(1.65, 1.25, -1.15) },
      congas_closeup: { pos: new THREE.Vector3(1.65, 1.55, -0.15), target: new THREE.Vector3(1.65, 1.30, -1.15) },
      timbales: { pos: new THREE.Vector3(-1.65, 1.65, 0.25), target: new THREE.Vector3(-1.65, 1.25, -1.15) },
      timbales_closeup: { pos: new THREE.Vector3(-1.65, 1.55, -0.15), target: new THREE.Vector3(-1.65, 1.30, -1.15) },
      synth: { pos: new THREE.Vector3(-3.00, 1.75, 3.15), target: new THREE.Vector3(-3.54, 1.00, 2.00) },
      synth_topdown: { pos: new THREE.Vector3(-3.37, 2.40, 2.38), target: new THREE.Vector3(-3.54, 1.00, 2.00) },
      synth_closeup: { pos: new THREE.Vector3(-3.23, 1.35, 2.75), target: new THREE.Vector3(-3.54, 1.00, 2.00) },
      stage_wing_left: { pos: new THREE.Vector3(-6.2, 3.4, 6.2), target: new THREE.Vector3(0.6, 1.25, -0.4) },
      stage_wing_right: { pos: new THREE.Vector3(6.2, 3.4, 6.2), target: new THREE.Vector3(-0.6, 1.25, -0.4) },
      conductor: { pos: new THREE.Vector3(0, 1.8, 5.8), target: new THREE.Vector3(0, 1.8, 0) }
    };

    this.currentPreset = 'overview';
    this.isTransitioning = false;
    this.autoRotate = false;

    // Intelligent Autonomous Director Mode (Auto Jam Cam)
    this.directorMode = false;
    this.shotTimer = 0;
    this.targetShotDuration = 4.0;
    this.currentDirectorInstrument = null;
    this.activeInstruments = null; // Set of instruments currently in song
    this.recentShots = []; // Queue of recent presets to prevent repetition
    this.consecutiveInstrumentCount = 0;
    this.driftDirection = 1; // Orbit drift direction
    this.shotsSinceEnsemble = 0;

    // Keyboard WASD Fly movement state
    this.keysPressed = {};
    this.enableKeyboardFly = true;

    this._setupRaycasting();
    this._setupKeyboard();
  }

  setPreset(name, duration = 1.2) {
    const preset = this.presets[name];
    if (!preset) return;

    this.currentPreset = name;

    gsap.killTweensOf(this.camera.position);
    gsap.killTweensOf(this.controls.target);

    if (duration <= 0) {
      this.camera.position.copy(preset.pos);
      this.controls.target.copy(preset.target);
      this.camera.lookAt(preset.target);
      this.controls.update();
      this.controls.enabled = true;
      this.isTransitioning = false;
      return;
    }

    this.isTransitioning = true;
    this.controls.enabled = false;

    gsap.to(this.camera.position, {
      x: preset.pos.x,
      y: preset.pos.y,
      z: preset.pos.z,
      duration: duration,
      ease: 'power2.inOut'
    });

    gsap.to(this.controls.target, {
      x: preset.target.x,
      y: preset.target.y,
      z: preset.target.z,
      duration: duration,
      ease: 'power2.inOut',
      onComplete: () => {
        this.controls.enabled = true;
        this.isTransitioning = false;
      }
    });
  }

  updateInstrumentPreset(name, target, size = new THREE.Vector3(1, 1, 1), instrumentGroup = null, origin = null) {
    const rotY = instrumentGroup ? instrumentGroup.rotation.y : 0;
    const cos = Math.cos(rotY);
    const sin = Math.sin(rotY);

    const basePos = origin || target;
    const localToWorld = (lx, ly, lz) => new THREE.Vector3(
      basePos.x + (lx * cos + lz * sin),
      basePos.y + ly,
      basePos.z + (-lx * sin + lz * cos)
    );

    if (name.startsWith('piano')) {
      const tierMatch = name.match(/piano_(\d+)/);
      const tier = tierMatch ? parseInt(tierMatch[1], 10) : 1;
      const tierConfigs = {
        1: { y: 0.88, z: 0.05 },
        2: { y: 1.15, z: -0.16 },
        3: { y: 1.42, z: -0.37 },
        4: { y: 1.70, z: -0.58 }
      };
      const tCfg = tierConfigs[tier] || tierConfigs[1];

      // Main overhead concert view: straight overhead angled at ~31 deg, perfectly horizontal keyboard
      this.presets[name] = {
        pos: localToWorld(0.045, tCfg.y + 0.80, tCfg.z + 1.25),
        target: localToWorld(0.045, tCfg.y, tCfg.z)
      };

      // Top-down bird's-eye view looking directly down at keys
      this.presets[`${name}_topdown`] = {
        pos: localToWorld(0.045, tCfg.y + 1.42, tCfg.z + 0.40),
        target: localToWorld(0.045, tCfg.y, tCfg.z)
      };

      // Close-up centered on keybed and OLED console
      this.presets[`${name}_closeup`] = {
        pos: localToWorld(0.045, tCfg.y + 0.38, tCfg.z + 0.75),
        target: localToWorld(0.045, tCfg.y, tCfg.z)
      };

      // 3/4 sweep profile
      this.presets[`${name}_sweep`] = {
        pos: localToWorld(1.15, tCfg.y + 0.45, tCfg.z + 1.00),
        target: localToWorld(-0.15, tCfg.y, tCfg.z)
      };
      return;
    }

    if (name.startsWith('synth')) {
      const tierMatch = name.match(/synth_(\d+)/);
      const tier = tierMatch ? parseInt(tierMatch[1], 10) : 1;
      // In Synth3D, group.position.y is already at ~0.95m; keyboard tiers are y: 0.05, 0.33, etc.
      const tierConfigs = {
        1: { y: 0.05, z: 0.00 },
        2: { y: 0.33, z: -0.16 },
        3: { y: 0.61, z: -0.32 },
        4: { y: 0.89, z: -0.48 }
      };
      const tCfg = tierConfigs[tier] || tierConfigs[1];

      // Main overhead concert view: angled at ~32 deg down, keyboard perfectly centered
      this.presets[name] = {
        pos: localToWorld(0.0, tCfg.y + 0.80, tCfg.z + 1.20),
        target: localToWorld(0.0, tCfg.y, tCfg.z)
      };
      this.presets[`${name}_topdown`] = {
        pos: localToWorld(0.0, tCfg.y + 1.45, tCfg.z + 0.38),
        target: localToWorld(0.0, tCfg.y, tCfg.z)
      };
      this.presets[`${name}_closeup`] = {
        pos: localToWorld(0.0, tCfg.y + 0.38, tCfg.z + 0.75),
        target: localToWorld(0.0, tCfg.y, tCfg.z)
      };
      return;
    }

    if (name.startsWith('xylophone')) {
      // In Xylophone3D, group.position.y is already at ~0.95m; bars are at local y: 0.02
      // Full overhead concert view: frames the entire wooden keyboard from bass to treble with clean margins
      this.presets[name] = {
        pos: localToWorld(0.0, 1.10, 1.75),
        target: localToWorld(0.0, 0.02, 0.05)
      };
      this.presets[`${name}_topdown`] = {
        pos: localToWorld(0.0, 1.60, 0.40),
        target: localToWorld(0.0, 0.02, 0.05)
      };
      this.presets[`${name}_closeup`] = {
        pos: localToWorld(0.0, 0.65, 1.10),
        target: localToWorld(0.0, 0.02, 0.05)
      };
      return;
    }

    if (name === 'drums') {
      // Entire drum kit: all 7 cymbals, 4 rack toms, 2 floor toms, snare, 22" bass drum, pedals and stands
      this.presets.drums = {
        pos: new THREE.Vector3(basePos.x, 2.30, basePos.z + 3.85),
        target: new THREE.Vector3(basePos.x, 0.95, basePos.z)
      };
      this.presets.drums_overhead = {
        pos: new THREE.Vector3(basePos.x, 3.40, basePos.z + 1.15),
        target: new THREE.Vector3(basePos.x, 0.85, basePos.z)
      };
      this.presets.drums_side = {
        pos: new THREE.Vector3(basePos.x - 2.45, 1.65, basePos.z + 1.95),
        target: new THREE.Vector3(basePos.x, 0.95, basePos.z)
      };
      return;
    }

    if (name.startsWith('guitar')) {
      // Entire guitar section: headstock, neck, body, pickups, and stand fully framed
      this.presets[name] = {
        pos: localToWorld(0.18, 0.25, 2.65),
        target: localToWorld(0.18, 0.10, 0.0)
      };
      this.presets[`${name}_neck`] = {
        pos: localToWorld(0.48, 0.25, 1.65),
        target: localToWorld(0.35, 0.15, 0.0)
      };
      this.presets[`${name}_closeup`] = {
        pos: localToWorld(-0.10, 0.18, 1.65),
        target: localToWorld(-0.05, 0.08, 0.0)
      };
      return;
    }

    if (name.startsWith('acousticGuitar')) {
      this.presets[name] = {
        pos: localToWorld(0.15, 0.25, 2.60),
        target: localToWorld(0.15, 0.10, 0.0)
      };
      this.presets[`${name}_neck`] = {
        pos: localToWorld(0.45, 0.25, 1.65),
        target: localToWorld(0.30, 0.15, 0.0)
      };
      this.presets[`${name}_closeup`] = {
        pos: localToWorld(-0.10, 0.18, 1.65),
        target: localToWorld(-0.05, 0.08, 0.0)
      };
      return;
    }

    if (name.startsWith('bass')) {
      // Entire bass guitar: top peg, headstock, neck, pickups, body, stand fully framed
      this.presets[name] = {
        pos: localToWorld(0.0, 0.35, 2.75),
        target: localToWorld(0.0, 0.25, 0.0)
      };
      this.presets[`${name}_closeup`] = {
        pos: localToWorld(-0.15, 0.20, 1.55),
        target: localToWorld(-0.05, 0.12, 0.0)
      };
      return;
    }

    if (name.startsWith('doubleBass')) {
      // Entire double bass: scroll, neck, body, bridge, and endpin centered with clean margins
      this.presets[name] = {
        pos: localToWorld(0.0, 0.35, 3.75),
        target: localToWorld(0.0, 0.15, 0.0)
      };
      this.presets[`${name}_closeup`] = {
        pos: localToWorld(0.15, 0.18, 1.85),
        target: localToWorld(0.0, 0.10, 0.0)
      };
      return;
    }

    if (name.startsWith('trumpet')) {
      // Hero concert framing: gleaming brass bell, pistons, and mouthpipe fill the frame
      this.presets[name] = {
        pos: localToWorld(-0.15, 0.08, 1.15),
        target: localToWorld(0.05, 0.0, 0.0)
      };
      this.presets[`${name}_closeup`] = {
        pos: localToWorld(-0.25, 0.06, 0.85),
        target: localToWorld(0.0, 0.0, 0.0)
      };
      return;
    }

    if (name.startsWith('violin')) {
      // Entire violin: scroll, complete bow span, f-holes, bridge, and chinrest framed
      this.presets[name] = {
        pos: localToWorld(0.02, 0.14, 1.80),
        target: localToWorld(0.02, 0.08, 0.0)
      };
      this.presets[`${name}_closeup`] = {
        pos: localToWorld(0.02, 0.12, 1.25),
        target: localToWorld(0.02, 0.08, 0.0)
      };
      return;
    }

    if (name.startsWith('sax')) {
      // 3/4 golden profile concert framing: mouthpiece with comfortable headroom, flared bell, pearl keys, body and U-bow
      this.presets[name] = {
        pos: localToWorld(1.20, 0.20, 1.55),
        target: localToWorld(-0.04, 0.10, 0.05)
      };
      this.presets[`${name}_closeup`] = {
        pos: localToWorld(0.85, 0.18, 1.15),
        target: localToWorld(-0.04, 0.10, 0.05)
      };
      return;
    }

    if (name.startsWith('cello')) {
      this.presets[name] = {
        pos: localToWorld(0.08, 0.25, 2.30),
        target: localToWorld(0.0, 0.15, 0.0)
      };
      this.presets[`${name}_closeup`] = {
        pos: localToWorld(0.05, 0.20, 1.50),
        target: localToWorld(0.0, 0.15, 0.0)
      };
      return;
    }

    if (name.startsWith('flute')) {
      this.presets[name] = {
        pos: localToWorld(0.0, 0.08, 1.05),
        target: localToWorld(0.0, 0.0, 0.0)
      };
      this.presets[`${name}_closeup`] = {
        pos: localToWorld(0.0, 0.06, 0.75),
        target: localToWorld(0.0, 0.0, 0.0)
      };
      return;
    }

    if (name.startsWith('frenchHorn')) {
      // 3/4 golden perspective: wide flared bell, circular hoop, 4-rotor valve cluster & double-S loop
      this.presets[name] = {
        pos: localToWorld(0.25, 0.16, 1.25),
        target: localToWorld(0.06, -0.06, 0.02)
      };
      this.presets[`${name}_closeup`] = {
        pos: localToWorld(0.20, 0.10, 0.85),
        target: localToWorld(0.06, -0.06, 0.02)
      };
      return;
    }

    if (name.startsWith('clarinet')) {
      // 3/4 concert framing showcasing both the Boehm keywork and the ~37° forward playing angle
      this.presets[name] = {
        pos: localToWorld(0.70, 0.22, 1.35),
        target: localToWorld(-0.05, 0.05, 0.0)
      };
      this.presets[`${name}_closeup`] = {
        pos: localToWorld(0.48, 0.16, 0.95),
        target: localToWorld(-0.02, 0.06, 0.02)
      };
      return;
    }

    if (name.startsWith('cabasa') || name.startsWith('tambourine') || name.startsWith('maracas') || name.startsWith('guiro')) {
      const isLeft = instrumentGroup ? instrumentGroup.position.x < 0 : name === 'cabasa' || name === 'tambourine';
      const xOff = isLeft ? -0.16 : 0.16;
      this.presets[name] = {
        pos: localToWorld(xOff, 0.16, 0.85),
        target: localToWorld(0.0, 0.0, 0.0)
      };
      this.presets[`${name}_closeup`] = {
        pos: localToWorld(xOff * 0.7, 0.08, 0.52),
        target: localToWorld(0.0, 0.02, 0.0)
      };
      return;
    }

    if (name.startsWith('triangle') || name.startsWith('whistle')) {
      const isLeft = instrumentGroup ? instrumentGroup.position.x < 0 : name === 'triangle';
      const xOff = isLeft ? -0.15 : 0.15;
      this.presets[name] = {
        pos: localToWorld(xOff, 0.12, 0.75),
        target: localToWorld(0.0, 0.0, 0.0)
      };
      this.presets[`${name}_closeup`] = {
        pos: localToWorld(xOff * 0.6, 0.06, 0.45),
        target: localToWorld(0.0, 0.0, 0.0)
      };
      return;
    }

    if (name.startsWith('congas')) {
      // Bongo & Conga combo set on stand
      this.presets[name] = {
        pos: localToWorld(0.0, 1.45, 1.50),
        target: localToWorld(0.0, 1.05, 0.0)
      };
      this.presets[`${name}_closeup`] = {
        pos: localToWorld(0.0, 1.35, 1.10),
        target: localToWorld(0.0, 1.10, 0.0)
      };
      return;
    }

    if (name.startsWith('timbales')) {
      // Concert Timbales & Agogô percussion set on stand
      this.presets[name] = {
        pos: localToWorld(0.0, 1.45, 1.40),
        target: localToWorld(0.0, 1.05, 0.0)
      };
      this.presets[`${name}_closeup`] = {
        pos: localToWorld(0.0, 1.35, 1.00),
        target: localToWorld(0.0, 1.10, 0.0)
      };
      return;
    }

    // Default for any other instrument:
    const span = Math.max(size.x, size.y, size.z, 1);
    const distance = THREE.MathUtils.clamp(span * 0.82 + 1.3, 2.35, 5.6);
    const height = Math.max(0.45, Math.min(1.35, size.y * 0.18));

    this.presets[name] = {
      pos: localToWorld(0.0, height, distance),
      target: localToWorld(0.0, height * 0.3, 0.0)
    };
    this.presets[`${name}_closeup`] = {
      pos: localToWorld(0.0, height * 0.8, distance * 0.6),
      target: localToWorld(0.0, height * 0.3, 0.0)
    };
  }

  updateOverviewPreset(bounds) {
    const center = bounds.getCenter(new THREE.Vector3());
    const size = bounds.getSize(new THREE.Vector3());
    const verticalFov = THREE.MathUtils.degToRad(this.camera.fov);
    const horizontalFov = 2 * Math.atan(Math.tan(verticalFov / 2) * this.camera.aspect);
    const widthDistance = size.x / (2 * Math.tan(horizontalFov / 2));
    const depthAllowance = Math.max(0, size.z * 0.42);
    const distance = THREE.MathUtils.clamp(widthDistance + depthAllowance + 2.2, 8.5, 15.5);

    this.presets.overview = {
      pos: new THREE.Vector3(center.x, 4.7 + Math.min(1.4, size.z * 0.16), center.z + distance),
      target: new THREE.Vector3(center.x, 1.35, center.z - Math.min(0.5, size.z * 0.08))
    };
    this.presets.conductor = {
      pos: new THREE.Vector3(center.x, 1.9, center.z + Math.min(7.2, distance * 0.58)),
      target: new THREE.Vector3(center.x, 1.55, center.z)
    };
    this.presets.stage_wing_left = {
      pos: new THREE.Vector3(center.x - Math.max(5.5, size.x * 0.72), 3.4, center.z + distance * 0.52),
      target: new THREE.Vector3(center.x + 0.6, 1.25, center.z - 0.4)
    };
    this.presets.stage_wing_right = {
      pos: new THREE.Vector3(center.x + Math.max(5.5, size.x * 0.72), 3.4, center.z + distance * 0.52),
      target: new THREE.Vector3(center.x - 0.6, 1.25, center.z - 0.4)
    };
  }

  toggleDirectorMode(enable = undefined) {
    this.directorMode = enable !== undefined ? enable : !this.directorMode;
    this.shotTimer = 0;
    this.targetShotDuration = 3.5;
    this.currentDirectorInstrument = null;
    this.recentShots = [];
    this.consecutiveInstrumentCount = 0;
    this.shotsSinceEnsemble = 0;
    if (this.directorMode) {
      this.directorCut();
    }
    return this.directorMode;
  }

  toggleAutoRotate(enable = undefined) {
    this.autoRotate = enable !== undefined ? enable : !this.autoRotate;
    this.controls.autoRotate = this.autoRotate;
    this.controls.autoRotateSpeed = 0.8;
    return this.autoRotate;
  }

  _setupRaycasting() {
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();

    let clickStartX = 0;
    let clickStartY = 0;

    this.domElement.addEventListener('pointerdown', (e) => {
      clickStartX = e.clientX;
      clickStartY = e.clientY;
    });

    this.domElement.addEventListener('pointerup', (e) => {
      // Check if it was a genuine click rather than a drag orbit
      const dist = Math.hypot(e.clientX - clickStartX, e.clientY - clickStartY);
      if (dist > 8) return;

      const rect = this.domElement.getBoundingClientRect();
      this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      this.raycaster.setFromCamera(this.mouse, this.camera);
      const intersects = this.raycaster.intersectObjects(this.scene.children, true);

      if (intersects.length > 0) {
        // Trace hit object upward to find parent instrument group
        let hitObj = intersects[0].object;
        while (hitObj && hitObj !== this.scene) {
          if (hitObj.name === 'piano_body' || (hitObj.position && hitObj.position.x < -3.5)) {
            this.setPreset('piano');
            return;
          }
          if (hitObj.position && hitObj.position.x > 2.0 && hitObj.position.x < 3.5) {
            this.setPreset('guitar');
            return;
          }
          if (hitObj.position && hitObj.position.x >= 3.5) {
            this.setPreset('trumpet');
            return;
          }
          if (hitObj.position && hitObj.position.z < -0.8 && Math.abs(hitObj.position.x) < 1.8) {
            this.setPreset('drums');
            return;
          }
          if (hitObj.position && hitObj.position.x < -1.8 && hitObj.position.x >= -3.5) {
            this.setPreset('bass');
            return;
          }
          hitObj = hitObj.parent;
        }
      }
    });
  }

  _setupKeyboard() {
    window.addEventListener('keydown', (e) => {
      // Don't capture keys if typing in an input
      if (['INPUT', 'SELECT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
      }
      this.keysPressed[e.key.toLowerCase()] = true;
    });

    window.addEventListener('keyup', (e) => {
      this.keysPressed[e.key.toLowerCase()] = false;
    });
  }

  setActiveInstruments(activeSet) {
    this.activeInstruments = activeSet;
    // If the currently viewed instrument is no longer on stage, smoothly return to overview
    const widePresets = new Set(['overview', 'conductor', 'stage_wing_left', 'stage_wing_right']);
    if (this.currentPreset && !widePresets.has(this.currentPreset)) {
      const basePreset = this.currentPreset.split('_')[0];
      const isVisible = this.activeInstruments && (
        this.activeInstruments.has(this.currentPreset) ||
        this.activeInstruments.has(basePreset) ||
        (this.currentPreset.startsWith('guitar') && this.activeInstruments.has('guitar')) ||
        (this.currentPreset.startsWith('piano') && this.activeInstruments.has('piano'))
      );
      if (this.activeInstruments && !isVisible) {
        this.setPreset('overview', 1.2);
      }
    }
  }

  directorCut() {
    this.shotTimer = 0;
    const isPlaying = window.app?.midiPlayer?.isPlaying;
    const bpm = window.app?.midiPlayer?.bpm || 120;
    const beatSec = 60 / Math.max(40, Math.min(220, bpm));
    const barSec = beatSec * 4;

    // Musical shot duration: typically 2 bars (approx 3.5s - 5.5s), occasionally 1.5 or 3 bars
    const barCadence = Math.random() < 0.6 ? 2 : (Math.random() < 0.65 ? 3 : 1.5);
    this.targetShotDuration = THREE.MathUtils.clamp(barSec * barCadence, 3.2, 7.2);
    this.driftDirection = Math.random() < 0.5 ? 1 : -1;

    // Wide ensemble shots pool
    const ensembleShots = ['overview', 'conductor', 'stage_wing_left', 'stage_wing_right'].filter(
      p => this.presets[p] !== undefined
    );

    // If music is paused, cycle through pleasant overview and instrument shots every 6s
    if (!isPlaying) {
      this.targetShotDuration = 6.0;
      const idlePresets = [...ensembleShots];
      if (this.activeInstruments) {
        for (const inst of this.activeInstruments) {
          if (this.presets[inst]) idlePresets.push(inst);
        }
      }
      const available = idlePresets.filter(p => !this.recentShots.includes(p));
      const pool = available.length > 0 ? available : idlePresets;
      const next = pool[Math.floor(Math.random() * pool.length)];
      this._pushRecentShot(next);
      this.setPreset(next, 1.8);
      return;
    }

    const activity = window.app?.midiPlayer?.instrumentActivity || {};
    const candidates = [];
    let highActivityCount = 0;

    for (const inst in activity) {
      if (this.activeInstruments && !this.activeInstruments.has(inst)) continue;
      const val = activity[inst];
      if (val > 0.08) {
        candidates.push({ inst, val });
        if (val > 0.28) highActivityCount++;
      }
    }

    candidates.sort((a, b) => b.val - a.val);

    let chosenPreset = null;

    // Decision 1: Tutti / Climax / Chorus
    // If 3+ instruments are playing strongly together, or if we haven't done a wide shot in a while
    const shouldCutToEnsemble = (highActivityCount >= 3 && Math.random() < 0.45) ||
                                (this.shotsSinceEnsemble >= 4);

    if (shouldCutToEnsemble && ensembleShots.length > 0) {
      const available = ensembleShots.filter(p => !this.recentShots.includes(p));
      const pool = available.length > 0 ? available : ensembleShots;
      chosenPreset = pool[Math.floor(Math.random() * pool.length)];
      this.shotsSinceEnsemble = 0;
      this.currentDirectorInstrument = null;
      this.consecutiveInstrumentCount = 0;
    } else if (candidates.length > 0) {
      this.shotsSinceEnsemble = (this.shotsSinceEnsemble || 0) + 1;

      // Decision 2: Select soloist / lead instrument
      let chosenInst = candidates[0].inst;

      // If this instrument has already been featured 2 times in a row, prefer the 2nd active instrument
      if (chosenInst === this.currentDirectorInstrument && this.consecutiveInstrumentCount >= 2) {
        if (candidates.length > 1) {
          chosenInst = candidates[1].inst;
        } else {
          // No other active instrument: cut to an ensemble shot to give visual variety
          const available = ensembleShots.filter(p => !this.recentShots.includes(p));
          const pool = available.length > 0 ? available : ensembleShots;
          chosenPreset = pool[Math.floor(Math.random() * pool.length)];
          this.shotsSinceEnsemble = 0;
          this.currentDirectorInstrument = null;
          this.consecutiveInstrumentCount = 0;
        }
      }

      if (!chosenPreset) {
        if (chosenInst === this.currentDirectorInstrument) {
          this.consecutiveInstrumentCount++;
        } else {
          this.currentDirectorInstrument = chosenInst;
          this.consecutiveInstrumentCount = 1;
        }

        // Decision 3: Pick dynamic angle from this instrument's angle pool
        const anglePool = this._getAnglePoolForInstrument(chosenInst);
        const availableAngles = anglePool.filter(p => !this.recentShots.includes(p));
        const pool = availableAngles.length > 0 ? availableAngles : anglePool;
        chosenPreset = pool[Math.floor(Math.random() * pool.length)];
      }
    } else {
      // Fallback: overview
      chosenPreset = 'overview';
      this.shotsSinceEnsemble = 0;
      this.currentDirectorInstrument = null;
      this.consecutiveInstrumentCount = 0;
    }

    if (chosenPreset) {
      this._pushRecentShot(chosenPreset);
      // Solo closeups use snappy cuts (1.15s), wide panoramas use sweeping cuts (1.5s)
      const isWide = ensembleShots.includes(chosenPreset);
      const transitionDuration = isWide ? 1.5 : 1.15;
      this.setPreset(chosenPreset, transitionDuration);
    }
  }

  _getAnglePoolForInstrument(inst) {
    const base = inst;
    const candidates = [
      base,
      `${base}_topdown`,
      `${base}_closeup`,
      `${base}_sweep`,
      `${base}_neck`,
      `${base}_overhead`,
      `${base}_side`
    ];
    const available = candidates.filter(k => this.presets[k] !== undefined);
    return available.length > 0 ? available : [base];
  }

  _pushRecentShot(name) {
    this.recentShots.push(name);
    if (this.recentShots.length > 4) {
      this.recentShots.shift();
    }
  }

  update(delta) {
    this.controls.update();

    // 1. Intelligent Autonomous Director Mode (Auto Jam Cam)
    if (this.directorMode && !this.isTransitioning) {
      this.shotTimer += delta;

      if (this.shotTimer >= this.targetShotDuration) {
        this.directorCut();
      } else {
        // Subtle cinematic steadicam / crane drift while holding shot
        const orbitSpeed = 0.018 * this.driftDirection;
        const offset = this.camera.position.clone().sub(this.controls.target);
        offset.applyAxisAngle(new THREE.Vector3(0, 1, 0), orbitSpeed * delta);
        const t = performance.now() * 0.0006;
        offset.y += Math.sin(t) * 0.0004;
        this.camera.position.copy(this.controls.target).add(offset);
      }
    }

    // 2. WASD keyboard fly movement
    if (this.enableKeyboardFly && !this.isTransitioning) {
      const speed = 6.0 * delta;
      const forward = new THREE.Vector3();
      this.camera.getWorldDirection(forward);
      forward.y = 0;
      forward.normalize();

      const side = new THREE.Vector3(-forward.z, 0, forward.x);

      let moved = false;
      const moveVec = new THREE.Vector3();

      if (this.keysPressed['w'] || this.keysPressed['arrowup']) {
        moveVec.addScaledVector(forward, speed);
        moved = true;
      }
      if (this.keysPressed['s'] || this.keysPressed['arrowdown']) {
        moveVec.addScaledVector(forward, -speed);
        moved = true;
      }
      if (this.keysPressed['a'] || this.keysPressed['arrowleft']) {
        moveVec.addScaledVector(side, -speed);
        moved = true;
      }
      if (this.keysPressed['d'] || this.keysPressed['arrowright']) {
        moveVec.addScaledVector(side, speed);
        moved = true;
      }
      if (this.keysPressed['q'] || this.keysPressed['e']) {
        const yDir = this.keysPressed['e'] ? speed : -speed;
        moveVec.y += yDir;
        moved = true;
      }

      if (moved) {
        // Pause director mode if user manually flies camera
        this.directorMode = false;
        this.camera.position.add(moveVec);
        this.controls.target.add(moveVec);
      }
    }
  }
}
