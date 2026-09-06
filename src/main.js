import * as THREE from 'three';
import gsap from 'gsap';
import { SoundEngine } from './audio/SoundEngine.js';
import { MidiPlayer } from './audio/MidiPlayer.js';
import { SceneManager } from './scene/SceneManager.js';
import { UIManager } from './ui/UIManager.js';
import { i18n } from './i18n/I18nManager.js';

// Application Bootstrap
async function bootstrap() {
  const canvasContainer = document.getElementById('canvas-container');

  // 1. Initialize Audio Engine & MIDI Player
  const soundEngine = new SoundEngine();
  const midiPlayer = new MidiPlayer(soundEngine);

  // 2. Initialize 3D Three.js Scene
  const sceneManager = new SceneManager(canvasContainer, soundEngine);

  // 3. Initialize UI & Event Handlers
  const uiManager = new UIManager(soundEngine, midiPlayer, sceneManager);

  // Expose global app and THREE for interaction and debugging
  window.THREE = THREE;
  window.gsap = gsap;
  window.app = { soundEngine, midiPlayer, sceneManager, uiManager, i18n };

  // 4. Preload the default demo without starting audio. Playback must always
  // follow an explicit Play click or demo-song selection.
  await uiManager.loadDemoSong('ccr_have_you_ever_seen_the_rain', { autoplay: false });

  // Show welcome toast
  uiManager.showToast(i18n.t('toasts.welcome'));
}

if (document.readyState === 'loading') {
  window.addEventListener('DOMContentLoaded', bootstrap);
} else {
  bootstrap();
}
