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
      piano: { pos: new THREE.Vector3(-2.4, 2.10, 2.50), target: new THREE.Vector3(-3.6, 1.20, 0.05) },
      piano_sweep: { pos: new THREE.Vector3(-2.2, 1.45, 1.35), target: new THREE.Vector3(-3.6, 0.95, 0.35) },
      drums: { pos: new THREE.Vector3(0.00, 2.05, 2.15), target: new THREE.Vector3(0.00, 0.95, -0.25) },
      drums_overhead: { pos: new THREE.Vector3(0, 3.2, 0.7), target: new THREE.Vector3(0, 0.8, -0.3) },
      guitar: { pos: new THREE.Vector3(2.10, 1.55, 2.35), target: new THREE.Vector3(1.75, 1.25, 0.90) },
      guitar_neck: { pos: new THREE.Vector3(2.45, 1.50, 1.55), target: new THREE.Vector3(2.05, 1.35, 0.95) },
      bass: { pos: new THREE.Vector3(-1.65, 1.15, 1.35), target: new THREE.Vector3(-2.0, 0.95, -0.1) },
      trumpet: { pos: new THREE.Vector3(4.4, 1.55, 1.4), target: new THREE.Vector3(4.4, 1.40, 0.4) },
      sax: { pos: new THREE.Vector3(2.1, 1.55, 3.2), target: new THREE.Vector3(3.4, 1.15, 1.8) },
      violin: { pos: new THREE.Vector3(-3.2, 1.75, -0.4), target: new THREE.Vector3(-4.2, 1.25, -1.8) },
      flute: { pos: new THREE.Vector3(1.4, 1.45, 2.85), target: new THREE.Vector3(1.6, 1.30, 1.8) },
      xylophone: { pos: new THREE.Vector3(0, 1.85, 3.25), target: new THREE.Vector3(0, 0.95, 1.6) },
      synth: { pos: new THREE.Vector3(-3.0, 2.15, 3.75), target: new THREE.Vector3(-4.0, 1.30, 1.70) },
      guitar_2: { pos: new THREE.Vector3(2.35, 1.45, 2.05), target: new THREE.Vector3(2.00, 1.15, 0.60) },
      guitar_3: { pos: new THREE.Vector3(2.60, 1.35, 1.75), target: new THREE.Vector3(2.25, 1.05, 0.30) },
      guitar_4: { pos: new THREE.Vector3(2.85, 1.25, 1.45), target: new THREE.Vector3(2.50, 0.95, 0.00) },
      trumpet_2: { pos: new THREE.Vector3(5.1, 1.8, 2.4), target: new THREE.Vector3(4.9, 1.5, 1.1) },
      sax_2: { pos: new THREE.Vector3(4.9, 1.55, 3.4), target: new THREE.Vector3(4.4, 1.25, 2.2) },
      violin_2: { pos: new THREE.Vector3(-4.0, 1.80, -1.1), target: new THREE.Vector3(-5.1, 1.30, -2.6) },
      flute_2: { pos: new THREE.Vector3(2.1, 1.55, 3.5), target: new THREE.Vector3(2.3, 1.30, 2.4) },
      bass_2: { pos: new THREE.Vector3(-2.4, 1.2, 0.3), target: new THREE.Vector3(-2.9, 0.95, -1.0) },
      synth_2: { pos: new THREE.Vector3(-3.0, 2.15, 3.75), target: new THREE.Vector3(-4.0, 1.30, 1.70) },
      synth_3: { pos: new THREE.Vector3(-3.0, 2.25, 3.70), target: new THREE.Vector3(-4.0, 1.40, 1.65) },
      synth_4: { pos: new THREE.Vector3(-3.0, 2.35, 3.65), target: new THREE.Vector3(-4.0, 1.50, 1.60) },
      piano_2: { pos: new THREE.Vector3(-2.4, 2.10, 2.50), target: new THREE.Vector3(-3.6, 1.20, 0.05) },
      piano_3: { pos: new THREE.Vector3(-2.4, 2.20, 2.45), target: new THREE.Vector3(-3.6, 1.30, 0.00) },
      piano_4: { pos: new THREE.Vector3(-2.4, 2.30, 2.40), target: new THREE.Vector3(-3.6, 1.40, -0.05) },
      conductor: { pos: new THREE.Vector3(0, 1.8, 5.8), target: new THREE.Vector3(0, 1.8, 0) }
    };

    this.currentPreset = 'overview';
    this.isTransitioning = false;
    this.autoRotate = false;

    // MIDIJam Autonomous Director Mode (off by default so Stage Overview is always default)
    this.directorMode = false;
    this.shotTimer = 0;
    this.currentDirectorInstrument = null;
    this.activeInstruments = null; // Set of instruments currently in song

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
    this.isTransitioning = true;
    this.controls.enabled = false;

    const currentPos = this.camera.position.clone();
    const currentTarget = this.controls.target.clone();

    gsap.killTweensOf(currentPos);
    gsap.killTweensOf(currentTarget);

    gsap.to(currentPos, {
      x: preset.pos.x,
      y: preset.pos.y,
      z: preset.pos.z,
      duration: duration,
      ease: 'power2.inOut',
      onUpdate: () => {
        this.camera.position.copy(currentPos);
      }
    });

    gsap.to(currentTarget, {
      x: preset.target.x,
      y: preset.target.y,
      z: preset.target.z,
      duration: duration,
      ease: 'power2.inOut',
      onUpdate: () => {
        this.controls.target.copy(currentTarget);
      },
      onComplete: () => {
        this.controls.enabled = true;
        this.isTransitioning = false;
      }
    });
  }

  toggleDirectorMode(enable = undefined) {
    this.directorMode = enable !== undefined ? enable : !this.directorMode;
    this.shotTimer = 0;
    this.currentDirectorInstrument = null;
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
      this.keysPressed[e.key.toLowerCase()] = true;
    });

    window.addEventListener('keyup', (e) => {
      this.keysPressed[e.key.toLowerCase()] = false;
    });
  }

  setActiveInstruments(activeSet) {
    this.activeInstruments = activeSet;
    // If the currently viewed instrument is no longer on stage, smoothly return to overview
    if (this.currentPreset !== 'overview' && this.currentPreset !== 'conductor') {
      const basePreset = this.currentPreset.split('_')[0];
      if (this.activeInstruments && !this.activeInstruments.has(basePreset)) {
        this.setPreset('overview', 1.2);
      }
    }
  }

  update(delta) {
    this.controls.update();

    // 1. Autonomous MIDIJam Director Mode (Auto Jam Cam)
    if (this.directorMode && window.app?.midiPlayer?.isPlaying && !this.isTransitioning) {
      this.shotTimer += delta;
      const activity = window.app?.midiPlayer?.instrumentActivity || {};

      // Detect top active solo/lead instrument (ONLY from instruments currently on stage!)
      let topInst = null;
      let maxAct = 0.12; // Activation threshold
      for (const inst in activity) {
        if (this.activeInstruments && !this.activeInstruments.has(inst)) continue;
        if (activity[inst] > maxAct) {
          maxAct = activity[inst];
          topInst = inst;
        }
      }

      // Musical shot timing:
      // Minimum hold: 3.5 seconds
      // Maximum hold: 8.0 seconds
      const minDuration = 3.5;
      const maxDuration = 8.0;

      const shouldSwitch = 
        (this.shotTimer >= minDuration && topInst && topInst !== this.currentDirectorInstrument) ||
        (this.shotTimer >= maxDuration);

      if (shouldSwitch) {
        this.shotTimer = 0;
        let nextPreset = 'overview';

        if (topInst) {
          this.currentDirectorInstrument = topInst;
          if (topInst === 'guitar') {
            nextPreset = Math.random() > 0.4 ? 'guitar' : 'guitar_neck';
          } else if (topInst === 'drums') {
            nextPreset = Math.random() > 0.4 ? 'drums' : 'drums_overhead';
          } else if (topInst === 'piano') {
            nextPreset = Math.random() > 0.4 ? 'piano' : 'piano_sweep';
          } else {
            nextPreset = topInst;
          }
        } else {
          this.currentDirectorInstrument = null;
          nextPreset = 'overview';
        }

        this.setPreset(nextPreset, 1.4);
      } else {
        // Subtle cinematic handheld/crane drift while holding shot
        const t = performance.now() * 0.0006;
        this.camera.position.x += Math.sin(t) * 0.0012;
        this.camera.position.y += Math.cos(t * 0.8) * 0.0008;
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
