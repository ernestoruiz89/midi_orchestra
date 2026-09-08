import * as THREE from 'three';
import gsap from 'gsap';
import { SoundEngine } from './audio/SoundEngine.js';
import { MidiPlayer } from './audio/MidiPlayer.js';
import { SceneManager } from './scene/SceneManager.js';
import { UIManager } from './ui/UIManager.js';
import { i18n } from './i18n/I18nManager.js';
import { DemoSongs } from './audio/DemoSongs.js';

const DEFAULT_DEMO_ID = 'ccr_have_you_ever_seen_the_rain';

function normalizeSongToken(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]/g, '');
}

function resolveDemoSongId(rawSongId) {
  const songs = DemoSongs.getSongsList();
  let raw = rawSongId || '';
  try {
    raw = decodeURIComponent(raw);
  } catch (err) {
    // Keep the original value if the URL parameter is not strictly encoded.
    raw = String(raw);
  }

  raw = raw.trim();
  if (!raw) return DEFAULT_DEMO_ID;

  const normalizedRaw = normalizeSongToken(raw);

  const byId = songs.find(song => normalizeSongToken(song.id) === normalizedRaw);
  if (byId) return byId.id;

  const byNameOrFile = songs.find(song => {
    const fileSlug = song.file ? normalizeSongToken(song.file.split('/').pop().replace(/\.[^/.]+$/, '')) : '';
    const songName = normalizeSongToken(song.name || '');
    return fileSlug === normalizedRaw || songName === normalizedRaw;
  });

  return byNameOrFile ? byNameOrFile.id : DEFAULT_DEMO_ID;
}

function parseShareTime(rawTime) {
  if (typeof rawTime !== 'string') return null;
  const value = rawTime.trim();
  if (!value) return null;

  const mmss = value.match(/^(\d+):(\d{1,2})$/);
  if (mmss) {
    const mins = Number(mmss[1]);
    const secs = Number(mmss[2]);
    return Number.isFinite(mins) && Number.isFinite(secs) ? mins * 60 + secs : null;
  }

  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

function resolveRemoteMidiUrl(rawUrl) {
  if (typeof rawUrl !== 'string' || !rawUrl.trim()) return null;

  try {
    const url = new URL(rawUrl.trim());
    return ['http:', 'https:'].includes(url.protocol) ? url.toString() : null;
  } catch (err) {
    return null;
  }
}

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

  const searchParams = new URLSearchParams(window.location.search);
  const requestedSong = resolveDemoSongId(searchParams.get('song') || searchParams.get('demo'));
  const requestedMidiUrl = resolveRemoteMidiUrl(searchParams.get('midi'));
  const requestedTime = parseShareTime(searchParams.get('t'));

  // 4. Preload the default demo without starting audio. Playback must always
  // follow an explicit Play click or demo-song selection.
  if (requestedMidiUrl) {
    const loaded = await uiManager.loadMidiFromUrl(requestedMidiUrl, {
      autoplay: false,
      startTime: requestedTime
    });
    if (!loaded) {
      await uiManager.loadDemoSong(DEFAULT_DEMO_ID, { autoplay: false });
    }
  } else {
    await uiManager.loadDemoSong(requestedSong, {
      autoplay: false,
      startTime: requestedTime
    });
  }

  // Show welcome toast
  uiManager.showToast(i18n.t('toasts.welcome'));
}

if (document.readyState === 'loading') {
  window.addEventListener('DOMContentLoaded', bootstrap);
} else {
  bootstrap();
}
