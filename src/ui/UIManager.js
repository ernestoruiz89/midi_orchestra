import { DemoSongs } from '../audio/DemoSongs.js';
import { GM_PROGRAM_MAP } from '../audio/SoundEngine.js';
import { i18n } from '../i18n/I18nManager.js';

/**
 * UIManager handles DOM interactions, playback controls, modals,
 * drag-and-drop file imports, audio mixer sliders, and keyboard shortcuts.
 */
export class UIManager {
  constructor(soundEngine, midiPlayer, sceneManager) {
    this.soundEngine = soundEngine;
    this.midiPlayer = midiPlayer;
    this.sceneManager = sceneManager;

    this.isSeeking = false;
    this.isMutedMaster = false;
    this.previousMasterVolume = soundEngine.masterVolume;
    this.showAllInstruments = localStorage.getItem('midi_orchestra_instrument_visibility') === 'all';

    this._cacheDOM();
    this._bindPlaybackControls();
    this._bindCameraToolbar();
    this._bindVirtualBandStrip();
    this._bindDemoSongsModal();
    this._bindFileUploadAndDropzone();
    this._bindMixerDrawer();
    this._bindMidiOutputSelector();
    this._bindTrackInspectorModal();
    this._bindHelpModal();
    this._bindQualitySettings();
    this._bindLanguageSwitcher();
    this._bindGlobalKeyboardShortcuts();
    this._bindMidiPlayerCallbacks();
    this.midiPlayer.setAlwaysShowInstruments(this.showAllInstruments);
    this._updateInstrumentVisibilityButton();
  }

  _cacheDOM() {
    this.dom = {
      // Playback
      btnPlay: document.getElementById('btn-play'),
      btnStop: document.getElementById('btn-stop'),
      btnLoop: document.getElementById('btn-loop'),
      iconPlay: document.getElementById('icon-play'),
      iconPause: document.getElementById('icon-pause'),
      seekSlider: document.getElementById('seek-slider'),
      seekFill: document.getElementById('seek-progress-fill'),
      timeCurrent: document.getElementById('time-current'),
      timeTotal: document.getElementById('time-total'),
      speedPills: document.querySelectorAll('.speed-pill'),
      masterVolume: document.getElementById('master-volume'),
      btnMasterMute: document.getElementById('btn-master-mute'),

      // Header Meta
      songTitle: document.getElementById('current-song-title'),
      songBpm: document.getElementById('current-song-bpm'),

      // Header Buttons
      btnToggleLang: document.getElementById('btn-toggle-lang'),
      btnOpenSongs: document.getElementById('btn-open-songs'),
      fileInput: document.getElementById('file-input'),
      btnOpenTracks: document.getElementById('btn-open-tracks'),
      btnToggleMixer: document.getElementById('btn-toggle-mixer'),
      btnOpenHelp: document.getElementById('btn-open-help'),

      // Camera
      btnDirectorMode: document.getElementById('btn-director-mode'),
      camButtons: document.querySelectorAll('.cam-btn[data-preset]'),
      btnAutoRotate: document.getElementById('btn-auto-rotate'),
      btnLightShow: document.getElementById('btn-light-show'),
      btnInstrumentVisibility: document.getElementById('btn-instrument-visibility'),

      // MIDIJam Virtual Band Strip
      bandCards: document.querySelectorAll('.band-inst-card'),
      soloButtons: document.querySelectorAll('.solo-btn'),
      muteButtons: document.querySelectorAll('.mute-btn'),
      vuBars: {
        piano: document.getElementById('vu-piano'),
        drums: document.getElementById('vu-drums'),
        guitar: document.getElementById('vu-guitar'),
        acousticGuitar: document.getElementById('vu-acousticGuitar'),
        bass: document.getElementById('vu-bass'),
        trumpet: document.getElementById('vu-trumpet'),
        sax: document.getElementById('vu-sax'),
        violin: document.getElementById('vu-violin'),
        flute: document.getElementById('vu-flute'),
        xylophone: document.getElementById('vu-xylophone'),
        synth: document.getElementById('vu-synth')
      },

      // Modals & Drawers
      modalSongs: document.getElementById('modal-songs'),
      btnCloseSongs: document.getElementById('btn-close-songs'),
      demoSongsList: document.getElementById('demo-songs-list'),

      drawerMixer: document.getElementById('drawer-mixer'),
      btnCloseMixer: document.getElementById('btn-close-mixer'),
      selectMidiOut: document.getElementById('select-midi-out'),

      modalTracks: document.getElementById('modal-tracks'),
      btnCloseTracks: document.getElementById('btn-close-tracks'),
      tracksTableBody: document.getElementById('tracks-table-body'),

      modalHelp: document.getElementById('modal-help'),
      btnCloseHelp: document.getElementById('btn-close-help'),

      dropzoneOverlay: document.getElementById('dropzone-overlay'),
      toast: document.getElementById('toast'),
      toastMessage: document.getElementById('toast-message')
    };
  }

  _bindQualitySettings() {
    const button = document.getElementById('btn-open-quality');
    const modal = document.getElementById('modal-quality');
    const select = document.getElementById('select-quality');
    const closeButton = document.getElementById('btn-close-quality');
    const description = document.getElementById('quality-description');
    const refresh = () => {
      select.value = this.sceneManager.quality;
      description.textContent = i18n.t(`quality.${select.value}Description`);
    };
    const close = () => {
      modal.classList.add('hidden');
      button.focus();
    };
    button.addEventListener('click', () => {
      refresh();
      modal.classList.remove('hidden');
      select.focus();
    });
    closeButton.addEventListener('click', close);
    modal.addEventListener('click', event => {
      if (event.target === modal) close();
    });
    modal.addEventListener('keydown', event => {
      event.stopPropagation();
      if (event.key === 'Escape') close();
      if (event.key === 'Tab') {
        event.preventDefault();
        (document.activeElement === select ? closeButton : select).focus();
      }
    });
    select.addEventListener('change', () => {
      this.sceneManager.setQuality(select.value);
      refresh();
    });
    i18n.onLocaleChange(refresh);
    refresh();
  }

  _bindPlaybackControls() {
    // Browsers can restore a previous range-input value after a live reload.
    // Keep the UI in sync with the newly constructed audio engine so an old
    // 100% master fader cannot make the fresh calibrated mix look unchanged.
    this.dom.masterVolume.value = this.soundEngine.masterVolume;

    // Play / Pause
    this.dom.btnPlay.addEventListener('click', async () => {
      if (this.midiPlayer.isPlaying) {
        this.midiPlayer.pause();
      } else {
        const needsAudioLoad = !this.soundEngine.initialized || (
          !this.soundEngine.gmSynthReady && !this.soundEngine.gmSynthFailed
        );
        if (needsAudioLoad) this.showToast(i18n.t('toasts.loadingGmSoundfont'));

        this.dom.btnPlay.disabled = true;
        try {
          await this.midiPlayer.play();
        } finally {
          this.dom.btnPlay.disabled = false;
        }
      }
    });

    // Stop
    this.dom.btnStop.addEventListener('click', () => {
      this.midiPlayer.stop();
    });

    // Loop
    this.dom.btnLoop.addEventListener('click', () => {
      const isLoop = !this.midiPlayer.isLooping;
      this.midiPlayer.setLooping(isLoop);
      this.dom.btnLoop.classList.toggle('active', isLoop);
      this.showToast(isLoop ? i18n.t('toasts.loopOn') : i18n.t('toasts.loopOff'));
    });

    // Seek Slider
    this.dom.seekSlider.addEventListener('input', (e) => {
      this.isSeeking = true;
      const val = parseFloat(e.target.value);
      const targetTime = (val / 100) * this.midiPlayer.duration;
      this.dom.timeCurrent.textContent = this._formatTime(targetTime);
    });

    this.dom.seekSlider.addEventListener('change', (e) => {
      const val = parseFloat(e.target.value);
      const targetTime = (val / 100) * this.midiPlayer.duration;
      this.midiPlayer.seek(targetTime);
      this.isSeeking = false;
    });

    // Speed Pills
    this.dom.speedPills.forEach(pill => {
      pill.addEventListener('click', () => {
        this.dom.speedPills.forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        const speed = parseFloat(pill.dataset.speed);
        this.midiPlayer.setPlaybackRate(speed);
        this.showToast(i18n.t('toasts.speed', speed));
      });
    });

    // Master Volume
    this.dom.masterVolume.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      this.soundEngine.setMasterVolume(val);
      this.isMutedMaster = val === 0;
      if (val > 0) this.previousMasterVolume = val;
    });

    this.dom.btnMasterMute.addEventListener('click', () => {
      this.isMutedMaster = !this.isMutedMaster;
      if (this.isMutedMaster) {
        this.previousMasterVolume = this.soundEngine.masterVolume || this.previousMasterVolume;
        this.soundEngine.setMasterVolume(0);
        this.dom.masterVolume.value = 0;
        this.showToast(i18n.t('toasts.mute'));
      } else {
        this.soundEngine.setMasterVolume(this.previousMasterVolume);
        this.dom.masterVolume.value = this.previousMasterVolume;
        this.showToast(i18n.t('toasts.unmute'));
      }
    });
  }

  _bindCameraToolbar() {
    // Keep each instrument's numbered instances together, in numeric order.
    // Move the actual buttons so keyboard focus follows the visual order too.
    const cameraGroups = new Map();
    this.dom.camButtons.forEach(button => {
      const type = button.dataset.preset.replace(/_\d+$/, '');
      if (!cameraGroups.has(type)) cameraGroups.set(type, []);
      cameraGroups.get(type).push(button);
    });
    const cameraButtons = [...this.dom.camButtons];
    const lastCameraButton = cameraButtons[cameraButtons.length - 1];
    const toolbar = lastCameraButton?.parentNode;
    const afterCameras = lastCameraButton?.nextSibling;
    for (const buttons of cameraGroups.values()) {
      buttons.sort((a, b) => {
        const instance = button => Number(button.dataset.preset.match(/_(\d+)$/)?.[1] || 1);
        return instance(a) - instance(b);
      });
      buttons.forEach(button => toolbar.insertBefore(button, afterCameras));
    }
    this.dom.camButtons = document.querySelectorAll('.cam-btn[data-preset]');

    if (this.dom.btnDirectorMode) {
      this.dom.btnDirectorMode.addEventListener('click', () => {
        const active = this.sceneManager.cameraController.toggleDirectorMode();
        this.dom.btnDirectorMode.classList.toggle('active', active);
        if (active) {
          this.dom.camButtons.forEach(b => b.classList.remove('active'));
          this.showToast(i18n.t('toasts.directorOn'));
        } else {
          this.showToast(i18n.t('toasts.directorOff'));
        }
      });
    }

    this.dom.camButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        if (this.sceneManager.cameraController.directorMode) {
          this.sceneManager.cameraController.directorMode = false;
          if (this.dom.btnDirectorMode) this.dom.btnDirectorMode.classList.remove('active');
        }
        this.dom.camButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const preset = btn.dataset.preset;
        this.sceneManager.cameraController.setPreset(preset);
      });
    });

    this.dom.btnAutoRotate.addEventListener('click', () => {
      const active = this.sceneManager.cameraController.toggleAutoRotate();
      this.dom.btnAutoRotate.classList.toggle('active', active);
      this.showToast(active ? i18n.t('toasts.orbitOn') : i18n.t('toasts.orbitOff'));
    });

    // Light Show Toggle
    if (this.dom.btnLightShow) {
      this.dom.btnLightShow.addEventListener('click', () => {
        const active = this.sceneManager.stage.toggleLightShow();
        this.dom.btnLightShow.classList.toggle('active', active);
        this.showToast(active ? i18n.t('toasts.lightShowOn') : i18n.t('toasts.lightShowOff'));
      });
    }

    if (this.dom.btnInstrumentVisibility) {
      this.dom.btnInstrumentVisibility.addEventListener('click', () => {
        this.showAllInstruments = !this.showAllInstruments;
        localStorage.setItem(
          'midi_orchestra_instrument_visibility',
          this.showAllInstruments ? 'all' : 'dynamic'
        );
        this.midiPlayer.setAlwaysShowInstruments(this.showAllInstruments);
        this._updateInstrumentVisibilityButton();
        this.showToast(i18n.t(
          this.showAllInstruments ? 'toasts.instrumentsAll' : 'toasts.instrumentsDynamic'
        ));
      });
    }
  }

  _updateInstrumentVisibilityButton() {
    const button = this.dom?.btnInstrumentVisibility;
    if (!button) return;

    button.classList.toggle('active', this.showAllInstruments);
    button.textContent = i18n.t(
      this.showAllInstruments ? 'camera.instrumentsAll' : 'camera.instrumentsDynamic'
    );
    button.title = i18n.t(
      this.showAllInstruments ? 'camera.instrumentsAllTitle' : 'camera.instrumentsDynamicTitle'
    );
    button.setAttribute('aria-pressed', String(this.showAllInstruments));
  }

  _bindVirtualBandStrip() {
    this.soloedInstrument = null;
    this.mutedInstruments = new Set();

    // Click instrument card to view instrument
    this.dom.bandCards.forEach(card => {
      card.addEventListener('click', (e) => {
        if (e.target.closest('.track-btn')) return;
        const inst = card.dataset.inst;
        if (this.sceneManager.cameraController.directorMode) {
          this.sceneManager.cameraController.directorMode = false;
          if (this.dom.btnDirectorMode) this.dom.btnDirectorMode.classList.remove('active');
        }
        this.dom.camButtons.forEach(b => b.classList.toggle('active', b.dataset.preset === inst));
        this.sceneManager.cameraController.setPreset(inst);
      });
    });

    // Solo buttons (S)
    this.dom.soloButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const inst = btn.dataset.inst;
        const allInsts = [
          'piano', 'drums', 'guitar', 'acousticGuitar', 'bass', 'doubleBass',
          'trumpet', 'frenchHorn', 'sax', 'clarinet', 'violin', 'cello', 'flute',
          'xylophone', 'synth', 'cabasa', 'congas', 'timbales',
          'tambourine', 'maracas', 'whistle', 'guiro', 'triangle',
          'harp', 'harmonica', 'accordion'
        ];
        const instLabel = i18n.t('instruments.' + inst) || inst;
        if (this.soloedInstrument === inst) {
          // Un-solo
          this.soloedInstrument = null;
          this.dom.soloButtons.forEach(b => b.classList.remove('active'));
          allInsts.forEach(i => {
            this.soundEngine.setChannelVolume(i, this.mutedInstruments.has(i) ? 0 : (this.soundEngine.volumes[i] ?? 0.85));
          });
          this.showToast(i18n.t('toasts.soloOff'));
        } else {
          // Solo this instrument
          this.soloedInstrument = inst;
          this.dom.soloButtons.forEach(b => b.classList.toggle('active', b.dataset.inst === inst));
          allInsts.forEach(i => {
            this.soundEngine.setChannelVolume(i, i === inst ? (this.soundEngine.volumes[i] ?? 0.85) : 0);
          });
          this.showToast(i18n.t('toasts.soloOn', instLabel.toUpperCase()));
        }
      });
    });

    // Mute buttons (M)
    this.dom.muteButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const inst = btn.dataset.inst;
        const isMuted = this.mutedInstruments.has(inst);
        const instLabel = i18n.t('instruments.' + inst) || inst;
        if (isMuted) {
          this.mutedInstruments.delete(inst);
          btn.classList.remove('active');
          if (!this.soloedInstrument || this.soloedInstrument === inst) {
            this.soundEngine.setChannelVolume(inst, this.soundEngine.volumes[inst]);
          }
          this.showToast(i18n.t('toasts.instUnmute', instLabel.toUpperCase()));
        } else {
          this.mutedInstruments.add(inst);
          btn.classList.add('active');
          this.soundEngine.setChannelVolume(inst, 0);
          this.showToast(i18n.t('toasts.instMute', instLabel.toUpperCase()));
        }
      });
    });
  }

  _bindDemoSongsModal() {
    // Populate demo list
    const songs = DemoSongs.getSongsList();
    this.dom.demoSongsList.innerHTML = '';

    songs.forEach(song => {
      const card = document.createElement('div');
      card.className = 'demo-song-card';
      card.innerHTML = `
        <div class="song-info">
          <h4>${song.name}</h4>
          <div class="song-tags">
            <span class="song-genre">${song.genre}</span>
            <span class="song-bpm-tag">${song.bpm} BPM</span>
          </div>
        </div>
        <div class="play-badge">▶ ${i18n.getLocale() === 'es' ? 'Reproducir' : 'Play'}</div>
      `;

      card.addEventListener('click', async () => {
        this.dom.modalSongs.classList.add('hidden');
        await this.loadDemoSong(song.id);
      });

      this.dom.demoSongsList.appendChild(card);
    });

    this.dom.btnOpenSongs.addEventListener('click', () => {
      this.dom.modalSongs.classList.remove('hidden');
    });

    this.dom.btnCloseSongs.addEventListener('click', () => {
      this.dom.modalSongs.classList.add('hidden');
    });
  }

  async loadDemoSong(songId, { autoplay = true } = {}) {
    const song = DemoSongs.getSongsList().find(item => item.id === songId);
    this.midiPlayer.stop();

    try {
      if (song?.file) {
        this.showToast(i18n.t('toasts.processingFile', song.name));
        const response = await fetch(song.file);
        if (!response.ok) {
          throw new Error(`Unable to load demo MIDI (${response.status})`);
        }
        await this.midiPlayer.loadMidiData(await response.arrayBuffer(), decodeURIComponent(song.file.split('/').pop()));
        this.midiPlayer.songName = song.name;
      } else {
        const songData = DemoSongs.getSongData(songId);
        this.midiPlayer.loadSongPreset(`demo:${songId}`);
        this.midiPlayer.midiData = songData;
        this.midiPlayer.songName = songData.name;
        this.midiPlayer.duration = songData.duration;
        this.midiPlayer.bpm = songData.header.tempos[0].bpm;

        this.midiPlayer._processTracks(songData);
      }
    } catch (err) {
      console.error('Failed to load demo MIDI:', err);
      this.showToast(i18n.t('toasts.fileError'));
      return;
    }

    this._applyActiveInstruments(this.midiPlayer.getActiveInstruments());

    this.dom.songTitle.textContent = this.midiPlayer.songName;
    this.dom.songBpm.textContent = `${this.midiPlayer.bpm} BPM`;
    this.dom.timeTotal.textContent = this._formatTime(this.midiPlayer.duration);

    // Always reset to Stage Overview by default
    this.sceneManager.cameraController.setPreset('overview', 0.8);
    this.dom.camButtons.forEach(b => b.classList.toggle('active', b.dataset.preset === 'overview'));
    if (this.dom.btnDirectorMode) this.dom.btnDirectorMode.classList.remove('active');

    this.showToast(i18n.t('toasts.songLoaded', this.midiPlayer.songName));
    if (autoplay) await this.midiPlayer.play();
  }

  _bindFileUploadAndDropzone() {
    // Standard file input
    this.dom.fileInput.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (file) {
        await this._handleFile(file);
      }
    });

    // Drag and Drop
    let dragCounter = 0;

    window.addEventListener('dragenter', (e) => {
      e.preventDefault();
      dragCounter++;
      this.dom.dropzoneOverlay.classList.remove('hidden');
    });

    window.addEventListener('dragleave', (e) => {
      e.preventDefault();
      dragCounter--;
      if (dragCounter <= 0) {
        this.dom.dropzoneOverlay.classList.add('hidden');
        dragCounter = 0;
      }
    });

    window.addEventListener('dragover', (e) => {
      e.preventDefault();
    });

    window.addEventListener('drop', async (e) => {
      e.preventDefault();
      dragCounter = 0;
      this.dom.dropzoneOverlay.classList.add('hidden');

      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        const file = e.dataTransfer.files[0];
        await this._handleFile(file);
      }
    });
  }

  async _handleFile(file) {
    if (!file.name.match(/\.(mid|midi|kar)$/i)) {
      this.showToast(i18n.t('toasts.invalidFile'));
      return;
    }

    try {
      this.showToast(i18n.t('toasts.processingFile', file.name));
      const buffer = await file.arrayBuffer();
      await this.midiPlayer.loadMidiData(buffer, file.name);

      this.dom.songTitle.textContent = file.name.replace(/\.[^/.]+$/, '');
      this.dom.songBpm.textContent = `${this.midiPlayer.bpm} BPM`;
      this.dom.timeTotal.textContent = this._formatTime(this.midiPlayer.duration);

      // Always reset to Stage Overview by default
      this.sceneManager.cameraController.setPreset('overview', 0.8);
      this.dom.camButtons.forEach(b => b.classList.toggle('active', b.dataset.preset === 'overview'));
      if (this.dom.btnDirectorMode) this.dom.btnDirectorMode.classList.remove('active');

      this.showToast(i18n.t('toasts.fileLoaded', this.midiPlayer.trackInfos.length));
      await this.midiPlayer.play();
    } catch (err) {
      console.error('Error al cargar archivo MIDI:', err);
      this.showToast(i18n.t('toasts.fileError'));
    }
  }

  _bindMixerDrawer() {
    document.getElementById('btn-reset-mixer').addEventListener('click', async () => {
      await this.midiPlayer.resetSongPreset();
      this._refreshMixerControls();
    });
    this.dom.btnToggleMixer.addEventListener('click', () => {
      this.dom.drawerMixer.classList.toggle('hidden');
    });

    this.dom.btnCloseMixer.addEventListener('click', () => {
      this.dom.drawerMixer.classList.add('hidden');
    });

    // Volume sliders and Mute / Solo buttons for available mixer channels.
    this.dom.mixerVuBars = {};
    const strips = this.dom.drawerMixer.querySelectorAll('.mixer-strip');
    strips.forEach(strip => {
      const inst = strip.dataset.inst;
      const slider = strip.querySelector('.vertical-slider');
      slider.max = '2';
      slider.setAttribute('aria-label', inst);
      const readout = document.createElement('output');
      readout.className = 'mixer-level';
      slider.after(readout);
      const btnMute = strip.querySelector('.btn-mute');
      const btnSolo = strip.querySelector('.btn-solo');
      const vu = strip.querySelector('.vu-fill');

      if (vu) {
        this.dom.mixerVuBars[inst] = vu;
      }

      if (this.soundEngine.volumes[inst] !== undefined) {
        slider.value = this.soundEngine.volumes[inst];
      }

      slider.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        this.soundEngine.setInstrumentVolume(inst, val);
        readout.textContent = `${Math.round(val * 100)}%`;
        this.midiPlayer.saveSongPreset();
      });

      btnMute.addEventListener('click', () => {
        const isMuted = !btnMute.classList.contains('active');
        btnMute.classList.toggle('active', isMuted);
        this.soundEngine.setMute(inst, isMuted);
        this.midiPlayer.saveSongPreset();
      });

      btnSolo.addEventListener('click', () => {
        const isSolo = !btnSolo.classList.contains('active');
        btnSolo.classList.toggle('active', isSolo);
        this.soundEngine.setSolo(inst, isSolo);
        this.midiPlayer.saveSongPreset();
      });
    });
    this._refreshMixerControls();
  }

  _refreshMixerControls() {
    this.dom.drawerMixer.querySelectorAll('.mixer-strip').forEach(strip => {
      const inst = strip.dataset.inst;
      const value = this.soundEngine.volumes[inst] ?? 1;
      strip.querySelector('.vertical-slider').value = value;
      const readout = strip.querySelector('.mixer-level');
      if (readout) readout.textContent = `${Math.round(value * 100)}%`;
      strip.querySelector('.btn-mute').classList.toggle('active', !!this.soundEngine.muted[inst]);
      strip.querySelector('.btn-solo').classList.toggle('active', !!this.soundEngine.solo[inst]);
    });
    // The compact dock's temporary mute/solo state must not cross song loads.
    if (!Object.values(this.soundEngine.gmTemporaryMuted).some(Boolean)) {
      this.mutedInstruments.clear();
      this.soloedInstrument = null;
      this.dom.muteButtons.forEach(button => button.classList.remove('active'));
      this.dom.soloButtons.forEach(button => button.classList.remove('active'));
    }
  }

  _bindMidiOutputSelector() {
    if (!this.dom.selectMidiOut) return;

    const updateDropdown = (outputs) => {
      const currentVal = this.dom.selectMidiOut.value || 'internal';
      this.dom.selectMidiOut.innerHTML = `
        <option value="internal">🔊 Web Studio (GeneralUser GS)</option>
      `;
      if (outputs && outputs.length > 0) {
        outputs.forEach(out => {
          const opt = document.createElement('option');
          opt.value = out.id;
          opt.textContent = `🎛️ MIDI Out: ${out.name}`;
          this.dom.selectMidiOut.appendChild(opt);
        });
      }
      this.dom.selectMidiOut.value = currentVal;
    };

    // Callback when MIDI devices connect or disconnect
    this.soundEngine.onMidiOutputsChanged = (outputs) => {
      updateDropdown(outputs);
    };

    // Initial check
    if (this.soundEngine.initWebMidi) {
      this.soundEngine.initWebMidi().then(outputs => {
        updateDropdown(outputs);
      });
    }

    this.dom.selectMidiOut.addEventListener('change', (e) => {
      const val = e.target.value;
      this.soundEngine.setMidiOutput(val);
      if (val === 'internal') {
        this.showToast(i18n.t('toasts.webStudioAudio'));
      } else {
        const selected = (this.soundEngine.midiOutputs || []).find(o => o.id === val);
        const name = selected ? selected.name : 'Windows MIDI Synth';
        this.showToast(i18n.t('toasts.midijamMode', name));
      }
    });
  }

  _bindTrackInspectorModal() {
    this.dom.btnOpenTracks.addEventListener('click', () => {
      this._renderTracksTable();
      this.dom.modalTracks.classList.remove('hidden');
    });

    this.dom.btnCloseTracks.addEventListener('click', () => {
      this.dom.modalTracks.classList.add('hidden');
    });
  }

  _renderTracksTable() {
    const tracks = this.midiPlayer.trackInfos;
    this.dom.tracksTableBody.innerHTML = '';
    const isEs = i18n.getLocale() === 'es';

    if (tracks.length === 0) {
      this.dom.tracksTableBody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:#888;">${isEs ? 'No hay pistas cargadas' : 'No tracks loaded'}</td></tr>`;
      return;
    }

    const availableInstruments = [
      { id: 'piano', label: isEs ? '🎹 Piano de Cola' : '🎹 Grand Piano' },
      { id: 'drums', label: isEs ? '🥁 Batería Acústica' : '🥁 Acoustic Drums' },
      { id: 'bass', label: isEs ? '🎸 Bajo Eléctrico' : '🎸 Electric Bass' },
      { id: 'doubleBass', label: isEs ? '🎻 Contrabajo / Bajo Acústico' : '🎻 Double Bass / Upright Bass' },
      { id: 'guitar', label: isEs ? '🎸 Guitarra Eléctrica' : '🎸 Electric Guitar' },
      { id: 'acousticGuitar', label: isEs ? '🎼 Guitarra Acústica' : '🎼 Acoustic Guitar' },
      { id: 'trumpet', label: isEs ? '🎺 Trompeta / Metales' : '🎺 Trumpet / Brass' },
      { id: 'frenchHorn', label: isEs ? '📯 Corno Francés' : '📯 French Horn' },
      { id: 'sax', label: isEs ? '🎷 Saxofón Tenor/Alto' : '🎷 Tenor/Alto Saxophone' },
      { id: 'clarinet', label: isEs ? '🪵 Clarinete' : '🪵 Clarinet' },
      { id: 'violin', label: isEs ? '🎻 Violín de Concierto' : '🎻 Concert Violin' },
      { id: 'cello', label: isEs ? '🎻 Violonchelo de Concierto' : '🎻 Concert Cello' },
      { id: 'flute', label: isEs ? '🪈 Flauta Travesera' : '🪈 Concert Flute' },
      { id: 'xylophone', label: isEs ? '🪵 Xilófono / Marimba' : '🪵 Xylophone / Marimba' },
      { id: 'synth', label: isEs ? '🎹 Sintetizador Workstation' : '🎹 Synthesizer Workstation' },
      { id: 'cabasa', label: isEs ? '🪇 Cabasa / Percusión Latina' : '🪇 Cabasa / Latin Percussion' },
      { id: 'tambourine', label: isEs ? '🪘 Pandereta' : '🪘 Tambourine' },
      { id: 'maracas', label: isEs ? '🪇 Maracas' : '🪇 Maracas' },
      { id: 'guiro', label: isEs ? '🪵 Güiro' : '🪵 Guiro' },
      { id: 'whistle', label: isEs ? '📯 Silbato de Samba' : '📯 Samba Whistle' },
      { id: 'triangle', label: isEs ? '🔺 Triángulo' : '🔺 Triangle' },
      { id: 'congas', label: isEs ? '🪘 Bongó y Congas' : '🪘 Bongos & Congas' },
      { id: 'timbales', label: isEs ? '🪘 Timbales y Agogô' : '🪘 Timbales & Agogô' },
      { id: 'harp', label: isEs ? '🪕 Arpa de Concierto' : '🪕 Concert Grand Harp' },
      { id: 'harmonica', label: isEs ? '🎷 Armónica' : '🎷 Harmonica' },
      { id: 'accordion', label: isEs ? '🪗 Acordeón' : '🪗 Accordion' }
    ];

    tracks.forEach((track, idx) => {
      const row = document.createElement('tr');

      let selectHtml = `<select class="inst-select" data-track-index="${track.index}">`;
      availableInstruments.forEach(inst => {
        const selected = inst.id === track.instrument ? 'selected' : '';
        selectHtml += `<option value="${inst.id}" ${selected}>${inst.label}</option>`;
      });
      selectHtml += `</select>`;

      const instanceTag = track.instanceIndex > 0 ? `<span style="color:#00f0ff; font-size:0.75rem; margin-left:6px; background:rgba(0,240,255,0.15); padding:2px 6px; border-radius:4px;">(${isEs ? 'Instancia' : 'Instance'} ${track.instanceIndex + 1})</span>` : '';
      const midiCode = Number.isInteger(track.programNumber) ? track.programNumber : '-';
      const midiInstrumentName = this._getMidiProgramName(track, isEs);

      row.innerHTML = `
        <td>${idx + 1}</td>
        <td><strong>${track.name}</strong>${instanceTag}</td>
        <td>${track.channel !== undefined ? track.channel : '-'}</td>
        <td><code class="midi-code" title="${midiInstrumentName}" aria-label="${midiInstrumentName}">${midiCode}</code></td>
        <td>${track.noteCount}</td>
        <td>${selectHtml}</td>
      `;

      const selectElem = row.querySelector('.inst-select');
      selectElem.addEventListener('change', (e) => {
        const newInst = e.target.value;
        this.midiPlayer.setTrackInstrument(track.index, newInst);
        this._renderTracksTable();
        const instLabel = i18n.t('instruments.' + newInst) || newInst;
        this.showToast(i18n.t('toasts.trackAssigned', track.name, instLabel.toUpperCase()));
      });

      this.dom.tracksTableBody.appendChild(row);
    });
  }

  _getMidiProgramName(track, isEs) {
    if (track.channel === 9 || track.instrument === 'drums') {
      return isEs ? 'Kit de percusión (canal MIDI 10)' : 'Percussion kit (MIDI channel 10)';
    }

    const program = Number.isInteger(track.programNumber) ? track.programNumber : null;
    const soundfontName = program !== null ? GM_PROGRAM_MAP[program]?.sf : null;
    if (!soundfontName) {
      return isEs ? 'Programa MIDI desconocido' : 'Unknown MIDI program';
    }

    return soundfontName
      .split(/_+/)
      .filter(Boolean)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  _bindHelpModal() {
    this.dom.btnOpenHelp.addEventListener('click', () => {
      this.dom.modalHelp.classList.remove('hidden');
    });

    this.dom.btnCloseHelp.addEventListener('click', () => {
      this.dom.modalHelp.classList.add('hidden');
    });
  }

  _bindLanguageSwitcher() {
    if (this.dom.btnToggleLang) {
      this.dom.btnToggleLang.addEventListener('click', () => {
        const newLang = i18n.toggleLocale();
        this.showToast(newLang === 'es' ? '🌐 Idioma: Español' : '🌐 Language: English');
      });
    }

    i18n.onLocaleChange((locale) => {
      this._onLocaleChanged(locale);
    });

    // Initial DOM translation
    i18n.updateDOM();
  }

  _onLocaleChanged(locale) {
    this._bindDemoSongsModal();
    this._updateInstrumentVisibilityButton();
    if (this.midiPlayer && this.midiPlayer.trackInfos && this.midiPlayer.trackInfos.length > 0) {
      this._renderTracksTable();
    }
  }

  _bindGlobalKeyboardShortcuts() {
    window.addEventListener('keydown', (e) => {
      if (['INPUT', 'SELECT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;
      if (e.ctrlKey || e.metaKey || e.altKey || e.repeat) return;

      const cameraNumber = e.code.match(/^(?:Digit|Numpad)([1-7])$/);
      if (cameraNumber) {
        e.preventDefault();
        this._selectNumberedInstrument(Number(cameraNumber[1]) - 1);
        return;
      }

      switch (e.code) {
        case 'Space':
          e.preventDefault();
          this.dom.btnPlay.click();
          break;
        case 'KeyR':
          this.midiPlayer.seek(0);
          this.midiPlayer.play();
          this.showToast(i18n.t('toasts.songRestarted'));
          break;
        case 'KeyL':
          this.dom.btnLoop.click();
          break;
        case 'KeyM':
          this.dom.btnMasterMute.click();
          break;
        case 'KeyC':
          this.dom.btnDirectorMode?.click();
          break;
        case 'KeyO':
          this.dom.btnAutoRotate?.click();
          break;
        case 'KeyV':
          this.dom.btnInstrumentVisibility?.click();
          break;
        case 'KeyH':
          this.dom.modalHelp.classList.toggle('hidden');
          break;
        case 'Escape':
          this.dom.modalSongs.classList.add('hidden');
          this.dom.modalTracks.classList.add('hidden');
          this.dom.modalHelp.classList.add('hidden');
          this.dom.drawerMixer.classList.add('hidden');
          break;
      }
    });
  }

  _selectNumberedInstrument(slotIndex) {
    const visible = this.midiPlayer.getVisibleInstruments();
    const assigned = this.midiPlayer.getActiveInstruments();
    const ordered = [...new Set([...visible, ...assigned])];
    const instrument = ordered[slotIndex];

    if (!instrument) {
      this.showToast(i18n.t('toasts.cameraSlotEmpty', slotIndex + 1));
      return;
    }

    this._selectCameraPreset(instrument);
    const translationKey = `instruments.${instrument}`;
    const translatedLabel = i18n.t(translationKey);
    const label = translatedLabel === translationKey ? instrument : translatedLabel;
    this.showToast(i18n.t('toasts.cameraShortcut', slotIndex + 1, label));
  }

  _selectCameraPreset(preset) {
    const button = [...this.dom.camButtons].find(btn => btn.dataset.preset === preset);
    if (button) {
      button.click();
      return;
    }

    const basePreset = preset.split('_')[0];
    const resolvedPreset = this.sceneManager.cameraController.presets[preset]
      ? preset
      : basePreset;
    if (!this.sceneManager.cameraController.presets[resolvedPreset]) return;

    this.sceneManager.cameraController.toggleDirectorMode(false);
    this.dom.btnDirectorMode?.classList.remove('active');
    this.dom.camButtons.forEach(btn => btn.classList.remove('active'));
    this.sceneManager.cameraController.setPreset(resolvedPreset);
  }

  _bindMidiPlayerCallbacks() {
    this.midiPlayer.onPresetStorageError = () => this.showToast(i18n.t('mixer.storageError'));
    // Progress
    this.midiPlayer.onProgress = (current, total, percent) => {
      if (!this.isSeeking) {
        this.dom.seekSlider.value = percent;
        this.dom.timeCurrent.textContent = this._formatTime(current);
      }
    };

    // State Change (Play/Pause/Stop)
    this.midiPlayer.onStateChange = (isPlaying, isPaused) => {
      if (isPlaying) {
        this.dom.iconPlay.style.display = 'none';
        this.dom.iconPause.style.display = 'block';
      } else {
        this.dom.iconPlay.style.display = 'block';
        this.dom.iconPause.style.display = 'none';
      }
    };

    // Visual preparation -> 3D scene only. MIDI audio still starts at Note On.
    this.midiPlayer.onNotePrepare = (instrument, midiPitch, noteName, velocity, duration, instanceId, instanceIndex, eventTime, trackIndex) => {
      this.sceneManager.handleNotePrepare(instrument, midiPitch, noteName, velocity, duration, instanceId, eventTime, trackIndex);
    };

    // Note On -> 3D scene dispatch (routed to specific duplicate instance)
    this.midiPlayer.onNoteOn = (instrument, midiPitch, noteName, velocity, duration, instanceId, instanceIndex, eventTime, trackIndex) => {
      this.sceneManager.handleNoteOn(instrument, midiPitch, noteName, velocity, duration, instanceId, eventTime, trackIndex);
    };

    // Note Off -> 3D scene dispatch (routed to specific duplicate instance)
    this.midiPlayer.onNoteOff = (instrument, midiPitch, noteName, force = false, instanceId = null) => {
      this.sceneManager.handleNoteOff(instrument, midiPitch, noteName, force, instanceId);
    };

    // Real-time VU meter updates from MidiPlayer activity decay (MIDIJam style)
    this.midiPlayer.onActivityUpdate = (activityMap) => {
      for (const inst in this.dom.vuBars) {
        const bar = this.dom.vuBars[inst];
        const act = activityMap[inst] || 0;
        if (bar) {
          bar.style.width = `${Math.min(100, Math.round(act * 100))}%`;
        }
      }
      if (this.dom.mixerVuBars) {
        for (const inst in this.dom.mixerVuBars) {
          const mixerBar = this.dom.mixerVuBars[inst];
          const baseInst = inst.split('_')[0];
          const act = activityMap[inst] !== undefined ? activityMap[inst] : (activityMap[baseInst] || 0);
          if (mixerBar) {
            mixerBar.style.height = `${Math.min(100, Math.round(act * 100))}%`;
          }
        }
      }
    };

    // Automatically show only instruments present in loaded song
    this.midiPlayer.onActiveInstrumentsChanged = (activeList) => {
      this._applyActiveInstruments(activeList);
      this._refreshMixerControls();
      this.sceneManager.updatePianoMidiPrograms(this.midiPlayer.trackInfos);
    };
    this.midiPlayer.onTrackUpdate = (tracks) => {
      this._renderTracksTable();
      this.sceneManager.updatePianoMidiPrograms(tracks);
    };

    // MIDIs2Jam2-style stage density: the dock keeps every assigned track
    // available, while the 3D stage only shows instruments near an actual
    // performance window.
    this.midiPlayer.onVisibleInstrumentsChanged = (visibleList) => {
      if (this.sceneManager && typeof this.sceneManager.setVisibleInstruments === 'function') {
        this.sceneManager.setVisibleInstruments(visibleList);
      }
    };

    // Highlight active instruments when song is loaded
    this.midiPlayer.onSongLoaded = (songInfo) => {
      this._refreshMixerControls();
      this.dom.songTitle.textContent = songInfo.name;
      this.dom.songBpm.textContent = `${songInfo.bpm} BPM`;
      this.dom.timeTotal.textContent = this._formatTime(songInfo.duration);

      this._applyActiveInstruments(this.midiPlayer.getActiveInstruments());
    };
  }

  // Show only instruments assigned to tracks in current MIDI song
  _applyActiveInstruments(activeInstrumentsList) {
    const activeList = activeInstrumentsList || this.midiPlayer.getActiveInstruments();
    const activeSet = new Set(activeList);

    // 1. Arrange assigned instruments once per song/assignment. Dynamic
    // visibility during rests must not cause the stage to keep reshuffling.
    if (this.sceneManager && typeof this.sceneManager.layoutInstruments === 'function') {
      const prominenceByInstrument = this.midiPlayer.trackInfos.reduce((scores, track) => {
        if (track.instanceId) {
          scores[track.instanceId] = (scores[track.instanceId] || 0) + (track.noteCount || 0);
        }
        return scores;
      }, {});
      this.sceneManager.layoutInstruments(activeList, prominenceByInstrument);
    }

    // 2. Update the 3D stage using the current musical time. Assigned
    // instruments remain available in the UI even while resting off-stage.
    if (this.sceneManager && typeof this.sceneManager.setVisibleInstruments === 'function') {
      this.sceneManager.setVisibleInstruments(this.midiPlayer.getVisibleInstruments());
    }

    // 3. Update JAM BAND dock: hide cards for instruments not in this song
    this.dom.bandCards.forEach(card => {
      const inst = card.dataset.inst;
      const isPresent = activeSet.has(inst);
      card.style.display = isPresent ? 'flex' : 'none';
    });

    // 4. Update Camera toolbar: hide buttons for instruments not on stage
    this.dom.camButtons.forEach(btn => {
      const preset = btn.dataset.preset;
      if (preset === 'overview' || preset === 'conductor') {
        btn.style.display = 'inline-flex';
      } else {
        const isPresent = activeSet.has(preset) || (preset === 'guitar_neck' && activeSet.has('guitar'));
        btn.style.display = isPresent ? 'inline-flex' : 'none';
      }
    });

    // 5. Update Mixer Drawer: show only channels that are actually assigned
    // to a MIDI track, including any duplicate instrument instances.
    if (this.dom.drawerMixer) {
      const strips = this.dom.drawerMixer.querySelectorAll('.mixer-strip');
      strips.forEach(strip => {
        const inst = strip.dataset.inst;
        const isAssigned = activeSet.has(inst);
        strip.style.display = isAssigned ? 'flex' : 'none';
        strip.classList.remove('channel-inactive');
      });
    }
  }

  _formatTime(seconds) {
    const s = Math.max(0, Math.floor(seconds || 0));
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  showToast(msg) {
    this.dom.toastMessage.textContent = msg;
    this.dom.toast.classList.remove('hidden');

    if (this._toastTimeout) clearTimeout(this._toastTimeout);
    this._toastTimeout = setTimeout(() => {
      this.dom.toast.classList.add('hidden');
    }, 2800);
  }
}
