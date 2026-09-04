import * as Tone from 'tone';
import Soundfont from 'soundfont-player';
import { WorkletSynthesizer } from 'spessasynth_lib';

/**
 * General MIDI (GM) Standard Program Map
 * Maps GM Patch numbers (0 to 127) to FluidR3_GM soundfont names and audio bus channels.
 */
export const GM_PROGRAM_MAP = {
  // Pianos & Keyboards (0-7)
  0: { sf: 'acoustic_grand_piano', bus: 'piano' },
  1: { sf: 'bright_acoustic_piano', bus: 'piano' },
  2: { sf: 'electric_grand_piano', bus: 'piano' },
  3: { sf: 'honkytonk_piano', bus: 'piano' },
  4: { sf: 'electric_piano_1', bus: 'piano' },
  5: { sf: 'electric_piano_2', bus: 'piano' },
  6: { sf: 'harpsichord', bus: 'piano' },
  7: { sf: 'clavinet', bus: 'piano' },

  // Chromatic Percussion / Mallets (8-15)
  8: { sf: 'celesta', bus: 'xylophone' },
  9: { sf: 'glockenspiel', bus: 'xylophone' },
  10: { sf: 'music_box', bus: 'xylophone' },
  11: { sf: 'vibraphone', bus: 'xylophone' },
  12: { sf: 'marimba', bus: 'xylophone' },
  13: { sf: 'xylophone', bus: 'xylophone' },
  14: { sf: 'tubular_bells', bus: 'xylophone' },
  15: { sf: 'dulcimer', bus: 'xylophone' },

  // Organs (16-23)
  16: { sf: 'drawbar_organ', bus: 'piano' },
  17: { sf: 'percussive_organ', bus: 'piano' },
  18: { sf: 'rock_organ', bus: 'piano' },
  19: { sf: 'church_organ', bus: 'piano' },
  20: { sf: 'reed_organ', bus: 'piano' },
  21: { sf: 'accordion', bus: 'piano' },
  22: { sf: 'harmonica', bus: 'flute' },
  23: { sf: 'tango_accordion', bus: 'piano' },

  // Guitars (24-31)
  24: { sf: 'acoustic_guitar_nylon', bus: 'acousticGuitar' },
  25: { sf: 'acoustic_guitar_steel', bus: 'acousticGuitar' },
  26: { sf: 'electric_guitar_jazz', bus: 'guitar' },
  27: { sf: 'electric_guitar_clean', bus: 'guitar' },
  28: { sf: 'electric_guitar_muted', bus: 'guitar' },
  29: { sf: 'overdriven_guitar', bus: 'guitar' },
  30: { sf: 'distortion_guitar', bus: 'guitar' },
  31: { sf: 'guitar_harmonics', bus: 'guitar' },

  // Basses (32-39)
  32: { sf: 'acoustic_bass', bus: 'bass' },
  33: { sf: 'electric_bass_finger', bus: 'bass' },
  34: { sf: 'electric_bass_pick', bus: 'bass' },
  35: { sf: 'fretless_bass', bus: 'bass' },
  36: { sf: 'slap_bass_1', bus: 'bass' },
  37: { sf: 'slap_bass_2', bus: 'bass' },
  38: { sf: 'synth_bass_1', bus: 'bass' },
  39: { sf: 'synth_bass_2', bus: 'bass' },

  // Strings & Orchestral (40-47)
  40: { sf: 'violin', bus: 'violin' },
  41: { sf: 'viola', bus: 'violin' },
  42: { sf: 'cello', bus: 'cello' },
  43: { sf: 'contrabass', bus: 'violin' },
  44: { sf: 'tremolo_strings', bus: 'violin' },
  45: { sf: 'pizzicato_strings', bus: 'violin' },
  46: { sf: 'orchestral_harp', bus: 'violin' },
  47: { sf: 'timpani', bus: 'xylophone' },

  // Ensemble (48-55)
  48: { sf: 'string_ensemble_1', bus: 'violin' },
  49: { sf: 'string_ensemble_2', bus: 'violin' },
  50: { sf: 'synth_strings_1', bus: 'violin' },
  51: { sf: 'synth_strings_2', bus: 'violin' },
  52: { sf: 'choir_aahs', bus: 'flute' },
  53: { sf: 'voice_oohs', bus: 'flute' },
  54: { sf: 'synth_choir', bus: 'synth' },
  55: { sf: 'orchestra_hit', bus: 'trumpet' },

  // Brass (56-63)
  56: { sf: 'trumpet', bus: 'trumpet' },
  57: { sf: 'trombone', bus: 'trumpet' },
  58: { sf: 'tuba', bus: 'trumpet' },
  59: { sf: 'muted_trumpet', bus: 'trumpet' },
  60: { sf: 'french_horn', bus: 'trumpet' },
  61: { sf: 'brass_section', bus: 'trumpet' },
  62: { sf: 'synth_brass_1', bus: 'trumpet' },
  63: { sf: 'synth_brass_2', bus: 'trumpet' },

  // Reeds (64-71)
  64: { sf: 'soprano_sax', bus: 'sax' },
  65: { sf: 'alto_sax', bus: 'sax' },
  66: { sf: 'tenor_sax', bus: 'sax' },
  67: { sf: 'baritone_sax', bus: 'sax' },
  68: { sf: 'oboe', bus: 'flute' },
  69: { sf: 'english_horn', bus: 'flute' },
  70: { sf: 'bassoon', bus: 'flute' },
  71: { sf: 'clarinet', bus: 'sax' },

  // Pipes / Woodwinds (72-79)
  72: { sf: 'piccolo', bus: 'flute' },
  73: { sf: 'flute', bus: 'flute' },
  74: { sf: 'recorder', bus: 'flute' },
  75: { sf: 'pan_flute', bus: 'flute' },
  76: { sf: 'blown_bottle', bus: 'flute' },
  77: { sf: 'shakuhachi', bus: 'flute' },
  78: { sf: 'whistle', bus: 'flute' },
  79: { sf: 'ocarina', bus: 'flute' },

  // Synth Lead (80-87)
  80: { sf: 'lead_1_square', bus: 'synth' },
  81: { sf: 'lead_2_sawtooth', bus: 'synth' },
  82: { sf: 'lead_3_calliope', bus: 'synth' },
  83: { sf: 'lead_4_chiff', bus: 'synth' },
  84: { sf: 'lead_5_charang', bus: 'synth' },
  85: { sf: 'lead_6_voice', bus: 'synth' },
  86: { sf: 'lead_7_fifths', bus: 'synth' },
  87: { sf: 'lead_8_bass__lead', bus: 'synth' },

  // Synth Pad (88-95)
  88: { sf: 'pad_1_new_age', bus: 'synth' },
  89: { sf: 'pad_2_warm', bus: 'synth' },
  90: { sf: 'pad_3_polysynth', bus: 'synth' },
  91: { sf: 'pad_4_choir', bus: 'synth' },
  92: { sf: 'pad_5_bowed', bus: 'synth' },
  93: { sf: 'pad_6_metallic', bus: 'synth' },
  94: { sf: 'pad_7_halo', bus: 'synth' },
  95: { sf: 'pad_8_sweep', bus: 'synth' },

  // Synth Effects (96-103)
  96: { sf: 'fx_1_rain', bus: 'synth' },
  97: { sf: 'fx_2_soundtrack', bus: 'synth' },
  98: { sf: 'fx_3_crystal', bus: 'synth' },
  99: { sf: 'fx_4_atmosphere', bus: 'synth' },
  100: { sf: 'fx_5_brightness', bus: 'synth' },
  101: { sf: 'fx_6_goblins', bus: 'synth' },
  102: { sf: 'fx_7_echoes', bus: 'synth' },
  103: { sf: 'fx_8_sci_fi', bus: 'synth' },

  // Ethnic Instruments (104-111)
  104: { sf: 'sitar', bus: 'guitar' },
  105: { sf: 'banjo', bus: 'guitar' },
  106: { sf: 'shamisen', bus: 'guitar' },
  107: { sf: 'koto', bus: 'guitar' },
  108: { sf: 'kalimba', bus: 'xylophone' },
  109: { sf: 'bagpipe', bus: 'flute' },
  110: { sf: 'fiddle', bus: 'violin' },
  111: { sf: 'shanai', bus: 'flute' },

  // Percussive (112-119)
  112: { sf: 'tinkle_bell', bus: 'xylophone' },
  113: { sf: 'agogo', bus: 'xylophone' },
  114: { sf: 'steel_drums', bus: 'xylophone' },
  115: { sf: 'woodblock', bus: 'xylophone' },
  116: { sf: 'taiko_drum', bus: 'drums' },
  117: { sf: 'melodic_tom', bus: 'drums' },
  118: { sf: 'synth_drum', bus: 'drums' },
  119: { sf: 'reverse_cymbal', bus: 'drums' },

  // Sound Effects (120-127)
  120: { sf: 'guitar_fret_noise', bus: 'guitar' },
  121: { sf: 'breath_noise', bus: 'flute' },
  122: { sf: 'seashore', bus: 'synth' },
  123: { sf: 'bird_tweet', bus: 'synth' },
  124: { sf: 'telephone_ring', bus: 'synth' },
  125: { sf: 'helicopter', bus: 'synth' },
  126: { sf: 'applause', bus: 'synth' },
  127: { sf: 'gunshot', bus: 'drums' }
};

/**
 * SoundEngine provides studio-grade sound matching MIDIJam:
 * 1. Full General MIDI Program Change soundfont routing (Rock Guitars, Organs, Slap Bass, Brass & Strings).
 * 2. High-fidelity acoustic drum PCM modeling for General MIDI Channel 10.
 * 3. Web MIDI API direct hardware output (Microsoft GS Wavetable Synth / Roland SC-55).
 */
export class SoundEngine {
  constructor() {
    this.initialized = false;
    this.isLoadingSoundfonts = false;
    this.soundfontsLoaded = false;
    this.masterVolume = 0.80;

    // Per-instrument channel volumes
    this.volumes = {
      piano: 0.78,
      piano_2: 0.78,
      piano_3: 0.78,
      piano_4: 0.78,
      drums: 0.46,
      bass: 0.72,
      bass_2: 0.72,
      guitar: 0.68,
      guitar_2: 0.68,
      guitar_3: 0.68,
      guitar_4: 0.68,
      acousticGuitar: 0.64,
      acousticGuitar_2: 0.64,
      acousticGuitar_3: 0.64,
      acousticGuitar_4: 0.64,
      trumpet: 0.64,
      trumpet_2: 0.64,
      sax: 0.65,
      sax_2: 0.65,
      violin: 0.68,
      violin_2: 0.68,
      cello: 0.68,
      cello_2: 0.68,
      flute: 0.60,
      flute_2: 0.60,
      xylophone: 0.60,
      xylophone_2: 0.60,
      synth: 0.62,
      synth_2: 0.62,
      synth_3: 0.62,
      synth_4: 0.62
    };

    this.muted = {};
    this.solo = {};

    // Soundfont audio nodes & instances
    this.soundfontPlayers = {};
    this.loadingSoundfonts = new Set();
    this.soundfontLoadPromises = {};
    this.activeSoundfontNodes = {};

    // Primary GM engine. A single SoundFont-backed synthesizer keeps melodic
    // presets and percussion in the same calibrated bank, as MIDI2JAM2 does.
    this.gmSynth = null;
    this.gmSynthReady = false;
    this.gmSynthFailed = false;
    this.gmSynthLoadPromise = null;
    this.gmChannelInputs = [];
    this.gmChannelPanners = [];
    this.gmChannelBuses = new Array(16).fill('piano');
    this.gmChannelBuses[9] = 'drums';
    this.gmChannelInstances = new Array(16).fill(null);
    this.gmTemporaryMuted = {};
    this.gmMasterCompressor = null;
    this.gmMasterGain = null;
    this.gmAnalyser = null;

    // Tone.js nodes
    this.channels = {};
    this.synths = {};
    this.drumAudioBuffers = {};
    this.activeHihatSources = [];
    this.activeDrumSources = [];

    // The procedural kit is normalized first, then balanced piece by piece.
    // These are compensations for this local drum model; MIDI2JAM2 itself
    // relies on the calibration embedded in its GM SoundFont.
    this.drumPieceTrims = {
      kick: 0.78,
      snare: 0.68,
      sideStick: 0.56,
      handClap: 0.56,
      floorTom: 0.70,
      tomLow: 0.69,
      tomMid: 0.67,
      tomHigh: 0.65,
      hihatClosed: 0.46,
      hihatPedal: 0.40,
      hihatOpen: 0.44,
      crash: 0.43,
      chineseCymbal: 0.42,
      splash: 0.39,
      ride: 0.49,
      rideBell: 0.46,
      tambourine: 0.45,
      cowbell: 0.49,
      vibraslap: 0.45,
      bongoHigh: 0.55,
      bongoLow: 0.57,
      congaMuted: 0.52,
      congaHigh: 0.57,
      congaLow: 0.59,
      timbaleHigh: 0.55,
      timbaleLow: 0.57,
      agogoHigh: 0.45,
      agogoLow: 0.47,
      cabasa: 0.38,
      maracas: 0.36,
      whistleShort: 0.34,
      whistleLong: 0.32,
      guiroShort: 0.38,
      guiroLong: 0.36,
      claves: 0.43,
      woodblockHigh: 0.43,
      woodblockLow: 0.45,
      cuicaMuted: 0.42,
      cuicaOpen: 0.40,
      triangleMuted: 0.34,
      triangleOpen: 0.32
    };

    // Web MIDI API state
    this.midiAccess = null;
    this.midiOutputs = [];
    this.activeMidiOutput = null;
    this.currentPrograms = new Array(16).fill(-1);
    this.midiChannelState = this._createDefaultMidiChannelState();

    // Callbacks
    this.onLoadingProgress = null;
    this.onMidiOutputsChanged = null;
  }

  async init() {
    if (this.initialized) return;

    await Tone.start();
    const ctx = Tone.getContext().rawContext;

    // Master studio mastering effects rack
    this.limiter = new Tone.Limiter(-1).toDestination();

    // Studio EQ (Warm lows, rich body, crisp airy highs)
    this.masterEQ = new Tone.EQ3({
      low: 1.2,
      mid: -0.3,
      high: 0.8,
      lowFrequency: 160,
      highFrequency: 4800
    }).connect(this.limiter);

    this.compressor = new Tone.Compressor({
      threshold: -10,
      ratio: 2,
      attack: 0.004,
      release: 0.18
    }).connect(this.masterEQ);

    // Warm Concert Hall Reverb
    this.reverb = new Tone.Reverb({
      decay: 2.2,
      preDelay: 0.015,
      wet: 0.12
    }).connect(this.compressor);
    await this.reverb.generate();

    this.chorus = new Tone.Chorus({
      frequency: 1.2,
      delayTime: 2.8,
      depth: 0.45,
      wet: 0.06
    }).connect(this.reverb);
    this.chorus.start();

    // Analyser for 3D stage visualizer
    this.analyser = new Tone.Analyser('fft', 64);
    this.compressor.connect(this.analyser);

    // Create instrument mixer channels with native Web Audio inputs
    this._buildInstrumentChannels(ctx);

    // Build acoustic drum audio engine
    this._buildStudioDrumEngine(ctx);

    // Build fallback high-quality synth models
    this._buildFallbackSynths();

    // The destination volume is independent of the limiter graph, so apply
    // the configured startup master level explicitly.
    this.setMasterVolume(this.masterVolume);

    this.initialized = true;

    // The unified GM bank is loaded on the first Play action. Keeping this
    // lazy avoids downloading/parsing a 31 MB SoundFont before user input.

    // Attempt to detect Web MIDI API outputs
    this.initWebMidi();
  }

  /**
   * Enumerate and initialize Web MIDI API (Allows routing to Microsoft GS Wavetable Synth)
   */
  async initWebMidi() {
    if (typeof navigator === 'undefined' || !navigator.requestMIDIAccess) {
      console.log('Web MIDI API not supported in this browser environment.');
      return [];
    }

    try {
      this.midiAccess = await navigator.requestMIDIAccess({ sysex: false });
      this._updateMidiOutputList();

      this.midiAccess.onstatechange = () => {
        this._updateMidiOutputList();
      };

      console.log('Web MIDI API available. Outputs detected:', this.midiOutputs);
      return this.midiOutputs;
    } catch (e) {
      console.warn('Web MIDI API initialization note:', e.message);
      return [];
    }
  }

  _updateMidiOutputList() {
    if (!this.midiAccess) return;
    const list = [];
    this.midiAccess.outputs.forEach(output => {
      list.push({
        id: output.id,
        name: output.name || `MIDI Out ${output.id}`,
        manufacturer: output.manufacturer || ''
      });
    });
    this.midiOutputs = list;
    if (this.onMidiOutputsChanged) {
      this.onMidiOutputsChanged(this.midiOutputs);
    }
  }

  setMidiOutput(outputId) {
    if (this.activeMidiOutput) {
      for (let channel = 0; channel < 16; channel++) {
        try {
          this.activeMidiOutput.send([0xB0 | channel, 123, 0]);
          this.activeMidiOutput.send([0xB0 | channel, 120, 0]);
        } catch (e) {}
      }
    }
    if (this.gmSynthReady && this.gmSynth) this.gmSynth.stopAll(true);

    // Program state belongs to the selected synth/output, so force the next
    // note to send its Program Change after switching backends.
    this.currentPrograms.fill(-1);

    if (!this.midiAccess || !outputId || outputId === 'internal') {
      this.activeMidiOutput = null;
      console.log('Audio routing: GeneralUser GS Web Studio');
      return;
    }

    const target = this.midiAccess.outputs.get(outputId);
    if (target) {
      this.activeMidiOutput = target;
      console.log(`Audio routing: Web MIDI Device [${target.name}] (MIDIJam Mode)`);
    } else {
      this.activeMidiOutput = null;
    }
  }

  /**
   * MIDI's normal channel mix defaults. General MIDI uses CC 7 = 100 rather
   * than full-scale, which leaves headroom when several channels play at once.
   */
  _createDefaultMidiChannelState() {
    return Array.from({ length: 16 }, () => ({
      volume: 100 / 127,
      expression: 1,
      pan: 64 / 127,
      sustain: false,
      pitchBend: 0
    }));
  }

  /**
   * Restores the channel state at the beginning of a song or before a seek.
   * User mixer faders are deliberately kept separate from this MIDI mix.
   */
  resetMidiChannelState({ sendToOutput = true } = {}) {
    this.midiChannelState = this._createDefaultMidiChannelState();
    this.currentPrograms.fill(-1);

    if (this.gmSynthReady && this.gmSynth) {
      try {
        this.gmSynth.reset();
        this.gmSynth.setSystemParameter('gain', 0.8);
        this.gmSynth.setSystemParameter('effectsEnabled', false);
        this.gmSynth.midiChannels.forEach((midiChannel, channel) => {
          midiChannel.setDrums(this.gmChannelBuses[channel] === 'drums');
        });
      } catch (e) {
        console.warn('GM synthesizer reset warning:', e);
      }
    }

    if (sendToOutput && this.activeMidiOutput) {
      for (let channel = 0; channel < 16; channel++) {
        try {
          this.activeMidiOutput.send([0xB0 | channel, 121, 0]); // Reset All Controllers
          this.activeMidiOutput.send([0xB0 | channel, 7, 100]); // Channel Volume default
        } catch (e) {
          // A disconnected output is handled by normal Web Audio fallback.
        }
      }
    }
  }

  /**
   * Applies an event embedded in the MIDI file. This mirrors the important
   * part of midis2jam2's sequencer: controller messages travel with the song,
   * instead of replacing the song's own balance with a fixed application mix.
   */
  applyMidiControlChange(channel, controller, value) {
    const ch = Math.max(0, Math.min(15, Number(channel) || 0));
    const cc = Math.max(0, Math.min(127, Math.round(Number(controller) || 0)));
    const ccValue = Math.max(0, Math.min(127, Math.round((Number(value) || 0) * 127)));
    const state = this.midiChannelState[ch] || (this.midiChannelState[ch] = {
      volume: 100 / 127,
      expression: 1,
      pan: 64 / 127,
      sustain: false,
      pitchBend: 0
    });

    if (cc === 7) state.volume = ccValue / 127;
    if (cc === 11) state.expression = ccValue / 127;
    if (cc === 10) state.pan = ccValue / 127;
    if (cc === 64) state.sustain = ccValue >= 64;

    if (this.gmSynthReady && this.gmSynth) {
      try {
        this.gmSynth.controllerChange(ch, cc, ccValue);
      } catch (e) {
        console.warn('GM synthesizer control-change warning:', e);
      }
    }

    if (this.activeMidiOutput) {
      try {
        this.activeMidiOutput.send([0xB0 | ch, cc, ccValue]);
      } catch (e) {
        console.warn('Web MIDI control-change error, continuing with Web Audio:', e);
      }
    }
  }

  applyMidiPitchBend(channel, value) {
    const ch = Math.max(0, Math.min(15, Number(channel) || 0));
    const normalized = Math.max(-1, Math.min(1, Number(value) || 0));
    const bendValue = Math.max(0, Math.min(16383, Math.round((normalized + 1) * 8192)));
    if (this.midiChannelState[ch]) this.midiChannelState[ch].pitchBend = normalized;

    if (this.gmSynthReady && this.gmSynth) {
      try {
        this.gmSynth.pitchWheel(ch, bendValue);
      } catch (e) {
        console.warn('GM synthesizer pitch-bend warning:', e);
      }
    }

    if (this.activeMidiOutput) {
      try {
        this.activeMidiOutput.send([
          0xE0 | ch,
          bendValue & 0x7F,
          (bendValue >> 7) & 0x7F
        ]);
      } catch (e) {
        console.warn('Web MIDI pitch-bend error, continuing with Web Audio:', e);
      }
    }
  }

  _getMidiChannelGain(channel) {
    const ch = Math.max(0, Math.min(15, Number(channel) || 0));
    const state = this.midiChannelState[ch];
    if (!state) return (100 / 127) ** 2;

    // SoundFont/FluidSynth controllers are attenuation modulators rather than
    // linear gain knobs. Squaring their normalized values closely matches the
    // standard concave SF2 response used by GeneralUser GS.
    return (state.volume ** 2) * (state.expression ** 2);
  }

  _getMidiVelocityGain(velocity) {
    const normalized = Math.max(0, Math.min(1, Number(velocity) || 0));
    return normalized ** 2;
  }

  _buildInstrumentChannels(ctx) {
    const instrumentNames = [
      'piano', 'drums', 'bass', 'guitar', 'acousticGuitar', 'trumpet', 'sax', 'violin', 'cello', 'flute', 'xylophone', 'synth'
    ];
    this.nativeInputs = {};

    instrumentNames.forEach(inst => {
      const channel = new Tone.Channel({
        volume: Tone.gainToDb(this.volumes[inst] ?? 0.85),
        pan: this._getStereoPan(inst)
      }).connect(inst === 'drums' || inst === 'bass' ? this.compressor : this.chorus);

      this.channels[inst] = channel;

      // Native Web Audio GainNode connected directly into Tone.js channel
      const nativeGain = ctx.createGain();
      Tone.connect(nativeGain, channel);
      this.nativeInputs[inst] = nativeGain;
    });
  }

  _getStereoPan(inst) {
    switch (inst) {
      case 'piano': return -0.40;
      case 'bass': return -0.20;
      case 'violin': return -0.28;
      case 'cello': return -0.22;
      case 'synth': return -0.35;
      case 'drums': return 0.0;
      case 'xylophone': return 0.05;
      case 'flute': return 0.18;
      case 'guitar': return 0.28;
      case 'acousticGuitar': return 0.12;
      case 'sax': return 0.35;
      case 'trumpet': return 0.45;
      default: return 0;
    }
  }

  /**
   * Loads the same class of audio backend used by MIDI2JAM2: one complete GM
   * synthesizer and one coherent SoundFont for all 16 MIDI channels.
   */
  async _loadUnifiedGmSynth(ctx, trackInfos = []) {
    this._routeGmSynthChannels(trackInfos);

    if (this.gmSynthReady && this.gmSynth) return true;
    if (this.gmSynthFailed) return false;
    if (this.gmSynthLoadPromise) return this.gmSynthLoadPromise;

    this.gmSynthLoadPromise = (async () => {
      // Tone.js uses standardized-audio-context internally. AudioWorkletNode's
      // browser constructor needs the underlying native BaseAudioContext.
      const nativeContext = ctx?._nativeAudioContext || ctx?._nativeContext || ctx;
      if (!nativeContext?.audioWorklet) {
        throw new Error('AudioWorklet is not available in this browser');
      }

      this.isLoadingSoundfonts = true;
      console.log('Loading GeneralUser GS 2.0.2 GM SoundFont...');

      await nativeContext.audioWorklet.addModule('/audio/spessasynth_processor.min.js');

      const response = await fetch('/soundfonts/general_user-2.0.2.sf2');
      if (!response.ok) {
        throw new Error(`SoundFont request failed (${response.status})`);
      }
      const soundBank = await response.arrayBuffer();

      const synth = new WorkletSynthesizer(nativeContext, {
        oneOutput: false,
        eventsEnabled: true
      });

      await synth.isReady;
      await synth.soundBankManager.addSoundBank(soundBank, 'general-user-gs-2.0.2');

      // Enable GM SoundFont Reverb & Chorus DSP matching midis2jam2's Gervill/FluidSynth acoustics
      synth.setSystemParameter('gain', 0.8);
      synth.setSystemParameter('effectsEnabled', true);
      synth.setLogLevel(false, true, false);

      // Native Web Audio mixer for the worklet. This avoids crossing the
      // standardized-audio-context boundary used internally by Tone.js.
      this.gmMasterCompressor = nativeContext.createDynamicsCompressor();
      this.gmMasterCompressor.threshold.value = -4;
      this.gmMasterCompressor.knee.value = 2;
      this.gmMasterCompressor.ratio.value = 8;
      this.gmMasterCompressor.attack.value = 0.002;
      this.gmMasterCompressor.release.value = 0.10;

      this.gmMasterGain = nativeContext.createGain();
      this.gmMasterGain.gain.value = this.masterVolume;

      this.gmAnalyser = nativeContext.createAnalyser();
      this.gmAnalyser.fftSize = 128;
      this.gmAnalyser.smoothingTimeConstant = 0.72;

      this.gmMasterCompressor.connect(this.gmMasterGain);
      this.gmMasterGain.connect(this.gmAnalyser);
      this.gmAnalyser.connect(nativeContext.destination);

      this.gmChannelPanners = [];
      this.gmChannelInputs = Array.from({ length: 16 }, (_, channel) => {
        const input = nativeContext.createGain();
        const panner = nativeContext.createStereoPanner();
        input.connect(panner);
        panner.connect(this.gmMasterCompressor);
        synth.connectChannel(input, channel);
        this.gmChannelPanners[channel] = panner;
        return input;
      });

      this.gmSynth = synth;
      this.gmSynthReady = true;
      this._routeGmSynthChannels(trackInfos);
      console.log('GeneralUser GS GM synthesizer ready.');
      return true;
    })().catch((error) => {
      console.warn('Unified GM synthesizer unavailable; using audio fallback:', error);
      try { this.gmSynth?.destroy(); } catch (e) {}
      this.gmSynth = null;
      this.gmSynthReady = false;
      this.gmSynthFailed = true;
      this.gmChannelInputs = [];
      this.gmChannelPanners = [];
      try { this.gmMasterCompressor?.disconnect(); } catch (e) {}
      try { this.gmMasterGain?.disconnect(); } catch (e) {}
      try { this.gmAnalyser?.disconnect(); } catch (e) {}
      this.gmMasterCompressor = null;
      this.gmMasterGain = null;
      this.gmAnalyser = null;
      return false;
    }).finally(() => {
      this.isLoadingSoundfonts = false;
      this.gmSynthLoadPromise = null;
    });

    return this.gmSynthLoadPromise;
  }

  /**
   * Routes each MIDI channel into the application's existing instrument fader.
   * CC 7/11 stay inside the synth; this routing is only the user's external mix.
   */
  _routeGmSynthChannels(trackInfos = []) {
    const nextBuses = new Array(16).fill('piano');
    nextBuses[9] = 'drums';
    const nextInstances = new Array(16).fill(null);
    nextInstances[9] = 'drums';
    const claimedChannels = new Set();

    trackInfos.forEach(track => {
      const channel = Math.max(0, Math.min(15, Number(track.channel) || 0));
      const baseInstrument = String(track.instrument || 'piano').split('_')[0];
      const bus = this.nativeInputs?.[baseInstrument] ? baseInstrument : 'piano';

      // A standard MIDI channel represents one instrument at a time. If a
      // malformed file shares it between tracks, keep the first stable route.
      if (!claimedChannels.has(channel)) {
        nextBuses[channel] = bus;
        nextInstances[channel] = track.instanceId || bus;
        claimedChannels.add(channel);
      }
    });

    this.gmChannelBuses = nextBuses;
    this.gmChannelInstances = nextInstances;
    if (!this.gmSynthReady || !this.gmSynth) return;

    this.gmChannelInputs.forEach((input, channel) => {
      if (!input) return;
      const bus = nextBuses[channel];
      const panner = this.gmChannelPanners[channel];
      if (panner) panner.pan.value = this._getStereoPan(bus);

      const midiChannel = this.gmSynth.midiChannels[channel];
      if (midiChannel && typeof midiChannel.setDrums === 'function') {
        midiChannel.setDrums(bus === 'drums');
      }
    });

    this._refreshGmMixerLevels();
  }

  _refreshGmMixerLevels() {
    if (!this.gmSynthReady) return;
    const anySolo = Object.values(this.solo).some(Boolean);

    this.gmChannelInputs.forEach((input, channel) => {
      if (!input) return;
      const bus = this.gmChannelBuses[channel] || 'piano';
      const instance = this.gmChannelInstances[channel] || bus;
      const level = this.volumes[instance] ?? this.volumes[bus] ?? 0.80;
      const muted = Boolean(
        this.muted[instance] ||
        this.muted[bus] ||
        this.gmTemporaryMuted[instance] ||
        this.gmTemporaryMuted[bus]
      );
      const soloed = Boolean(this.solo[instance] || this.solo[bus]);
      const target = muted || (anySolo && !soloed) ? 0 : level;
      const now = input.context.currentTime;
      input.gain.cancelScheduledValues(now);
      input.gain.setTargetAtTime(target, now, 0.012);
    });
  }

  /**
   * Load initial core Soundfonts for immediate playback
   */
  async _loadInitialSoundfonts(ctx) {
    if (this.isLoadingSoundfonts || this.soundfontsLoaded) return;
    this.isLoadingSoundfonts = true;

    const coreSoundfonts = [
      { name: 'acoustic_grand_piano', bus: 'piano' },
      { name: 'electric_piano_1', bus: 'piano' },
      { name: 'rock_organ', bus: 'piano' },
      { name: 'electric_guitar_clean', bus: 'guitar' },
      { name: 'distortion_guitar', bus: 'guitar' },
      { name: 'acoustic_guitar_steel', bus: 'acousticGuitar' },
      { name: 'acoustic_guitar_nylon', bus: 'acousticGuitar' },
      { name: 'electric_bass_finger', bus: 'bass' },
      { name: 'slap_bass_1', bus: 'bass' },
      { name: 'trumpet', bus: 'trumpet' },
      { name: 'brass_section', bus: 'trumpet' },
      { name: 'tenor_sax', bus: 'sax' },
      { name: 'violin', bus: 'violin' },
      { name: 'cello', bus: 'cello' },
      { name: 'string_ensemble_1', bus: 'violin' },
      { name: 'flute', bus: 'flute' },
      { name: 'xylophone', bus: 'xylophone' },
      { name: 'lead_1_square', bus: 'synth' },
      { name: 'lead_2_sawtooth', bus: 'synth' }
    ];

    try {
      const promises = coreSoundfonts.map(item => this._loadSingleSoundfont(ctx, item.name, item.bus));
      await Promise.allSettled(promises);
      this.soundfontsLoaded = true;
      console.log('Core Studio Soundfonts successfully loaded!');
    } catch (err) {
      console.warn('Initial soundfonts load error:', err);
    } finally {
      this.isLoadingSoundfonts = false;
    }
  }

  /**
   * Dynamically loads a soundfont on-demand and connects it to the appropriate bus
   */
  async _loadSingleSoundfont(ctx, sfName, busName) {
    if (this.soundfontPlayers[sfName]) {
      return this.soundfontPlayers[sfName];
    }

    if (this.soundfontLoadPromises[sfName]) {
      return this.soundfontLoadPromises[sfName];
    }

    this.loadingSoundfonts.add(sfName);
    const loadPromise = (async () => {
      const dest = this.nativeInputs[busName] || ctx.destination;
      const player = await Soundfont.instrument(ctx, sfName, {
        soundfont: 'FluidR3_GM',
        destination: dest
      });
      this.soundfontPlayers[sfName] = player;
      return player;
    })().catch((e) => {
      console.warn(`Could not load soundfont for ${sfName}:`, e.message);
      return null;
    }).finally(() => {
      this.loadingSoundfonts.delete(sfName);
      delete this.soundfontLoadPromises[sfName];
    });

    this.soundfontLoadPromises[sfName] = loadPromise;
    return loadPromise;
  }

  /**
   * Pre-loads any specific General MIDI programs needed by the active song
   */
  async prepareTrackInstruments(trackInfos) {
    if (!this.initialized) return;
    const ctx = Tone.getContext().rawContext;

    const gmReady = await this._loadUnifiedGmSynth(ctx, trackInfos);
    if (gmReady) return;

    // Compatibility fallback for browsers without AudioWorklet support.
    await this._loadInitialSoundfonts(ctx);

    const neededPrograms = trackInfos
      .map(t => t.programNumber)
      .filter(p => p !== undefined && p >= 0 && GM_PROGRAM_MAP[p]);

    const uniqueP = Array.from(new Set(neededPrograms));
    const promises = uniqueP.map(p => {
      const gm = GM_PROGRAM_MAP[p];
      return this._loadSingleSoundfont(ctx, gm.sf, gm.bus);
    });

    await Promise.allSettled(promises);
  }

  /**
   * Realistic Studio Drum Kit Engine
   * Pre-renders high-fidelity procedural PCM AudioBuffers with authentic physical acoustics:
   * wood shell resonance, metal snare wire buzz, bronze cymbal modes, and hi-hat choke.
   */
  _buildStudioDrumEngine(ctx) {
    const sampleRate = ctx.sampleRate || 44100;

    const createBuffer = (duration, renderFn, targetPeak = 0.92) => {
      const frameCount = Math.floor(sampleRate * duration);
      const buffer = ctx.createBuffer(1, frameCount, sampleRate);
      const data = buffer.getChannelData(0);
      let peak = 0;
      for (let i = 0; i < frameCount; i++) {
        const t = i / sampleRate;
        const rendered = renderFn(t, duration);
        const sample = Number.isFinite(rendered) ? rendered : 0;
        data[i] = sample;
        peak = Math.max(peak, Math.abs(sample));
      }

      // Several original formulas exceeded ±1 before reaching the mixer
      // (especially kick, snare and side stick). Normalize every generated
      // piece so its explicit trim below is the only source of level balance.
      if (peak > 0) {
        const scale = targetPeak / peak;
        for (let i = 0; i < frameCount; i++) {
          data[i] *= scale;
        }
      }
      return buffer;
    };

    this.drumAudioBuffers = {
      // 1. Acoustic 22" Kick: 160Hz -> 50Hz punch + 2.8kHz wooden beater click + 44Hz deep shell resonance
      kick: createBuffer(0.48, (t) => {
        const freq = 46 + 115 * Math.exp(-t * 32);
        const sub = Math.sin(2 * Math.PI * freq * t) * Math.exp(-t * 6.5);
        const click = (Math.random() * 2 - 1) * Math.exp(-t * 180) * 0.65;
        const woodThud = Math.sin(2 * Math.PI * 92 * t) * Math.exp(-t * 22) * 0.35;
        return (sub * 0.90 + woodThud + click) * 1.35;
      }),

      // 2. Acoustic 14" Birch Snare: 185Hz tuned shell resonance + dual-layer high-frequency snappy metal snare wires
      snare: createBuffer(0.36, (t) => {
        const tone1 = Math.sin(2 * Math.PI * (182 * Math.exp(-t * 14)) * t) * Math.exp(-t * 15) * 0.60;
        const tone2 = Math.sin(2 * Math.PI * (340 * Math.exp(-t * 18)) * t) * Math.exp(-t * 20) * 0.25;
        const noise = (Math.random() * 2 - 1) * (
          Math.sin(2 * Math.PI * 3400 * t) * 0.4 +
          Math.sin(2 * Math.PI * 6200 * t) * 0.35 +
          0.25
        ) * Math.exp(-t * 12) * 0.85;
        const snap = (Math.random() * 2 - 1) * Math.exp(-t * 160) * 0.45;
        return (tone1 + tone2 + noise + snap) * 1.25;
      }),

      // 3. Side Stick / Cross-Stick (MIDI 37): Sharp hollow wooden rimshot
      sideStick: createBuffer(0.12, (t) => {
        const wood = Math.sin(2 * Math.PI * 1350 * t) * Math.exp(-t * 45) * 0.85;
        const click = (Math.random() * 2 - 1) * Math.exp(-t * 220) * 0.5;
        return (wood + click) * 1.4;
      }),

      // 4. Closed Hi-Hat (MIDI 42): 6-mode metallic cluster chime + crisp bronze chick (45ms damping)
      hihatClosed: createBuffer(0.055, (t) => {
        const metal = (
          Math.sin(2 * Math.PI * 4500 * t) * 0.2 +
          Math.sin(2 * Math.PI * 6800 * t) * 0.25 +
          Math.sin(2 * Math.PI * 9200 * t) * 0.3 +
          Math.sin(2 * Math.PI * 12500 * t) * 0.2 +
          (Math.random() * 2 - 1) * 1.8
        ) * 0.3;
        return metal * Math.exp(-t * 70);
      }),

      // 5. Pedal Hi-Hat (MIDI 44): Soft foot "chick"
      hihatPedal: createBuffer(0.08, (t) => {
        const metal = (
          Math.sin(2 * Math.PI * 5200 * t) * 0.3 +
          Math.sin(2 * Math.PI * 8100 * t) * 0.3 +
          (Math.random() * 2 - 1) * 1.2
        ) * 0.25;
        return metal * Math.exp(-t * 48);
      }),

      // 6. Open Hi-Hat (MIDI 46): Sizzling bronze wash (650ms)
      hihatOpen: createBuffer(0.65, (t) => {
        const metal = (
          Math.sin(2 * Math.PI * 5400 * t) * 0.25 +
          Math.sin(2 * Math.PI * 7600 * t) * 0.3 +
          Math.sin(2 * Math.PI * 10800 * t) * 0.25 +
          Math.sin(2 * Math.PI * 14200 * t) * 0.15 +
          (Math.random() * 2 - 1) * 1.6
        ) * 0.26;
        return metal * Math.exp(-t * 6.5);
      }),

      // 7. Floor Tom (MIDI 41/43): Deep 78Hz acoustic shell
      floorTom: createBuffer(0.50, (t) => {
        const freq = 74 + 48 * Math.exp(-t * 12);
        return Math.sin(2 * Math.PI * freq * t) * Math.exp(-t * 5.8) * 1.05;
      }),

      // 8. Low Tom (MIDI 45/47): 108Hz tuned tom
      tomLow: createBuffer(0.42, (t) => {
        const freq = 102 + 55 * Math.exp(-t * 14);
        return Math.sin(2 * Math.PI * freq * t) * Math.exp(-t * 6.8) * 1.0;
      }),

      // 9. Mid Tom (MIDI 48): 145Hz tuned tom
      tomMid: createBuffer(0.36, (t) => {
        const freq = 138 + 65 * Math.exp(-t * 16);
        return Math.sin(2 * Math.PI * freq * t) * Math.exp(-t * 7.5) * 0.95;
      }),

      // 10. High Tom (MIDI 50): 185Hz tuned tom
      tomHigh: createBuffer(0.32, (t) => {
        const freq = 175 + 75 * Math.exp(-t * 18);
        return Math.sin(2 * Math.PI * freq * t) * Math.exp(-t * 8.5) * 0.95;
      }),

      // 11. Crash Cymbal 1 & 2 (MIDI 49, 57): Explosive metallic shimmer & air wash (2.4s)
      crash: createBuffer(2.2, (t) => {
        const cluster = (
          Math.sin(2 * Math.PI * 440 * t) * 0.15 +
          Math.sin(2 * Math.PI * 690 * t) * 0.22 +
          Math.sin(2 * Math.PI * 1180 * t) * 0.28 +
          Math.sin(2 * Math.PI * 1840 * t) * 0.25 +
          Math.sin(2 * Math.PI * 3600 * t) * 0.2 +
          Math.sin(2 * Math.PI * 7200 * t) * 0.15 +
          (Math.random() * 2 - 1) * 1.4
        ) * 0.36;
        return cluster * Math.exp(-t * 1.8);
      }),

      // 12. Ride Cymbal (MIDI 51, 59): Clear 620Hz bronze ping + sustaining wash (1.5s)
      ride: createBuffer(1.5, (t) => {
        const ping = Math.sin(2 * Math.PI * 615 * t) * Math.exp(-t * 4.2) * 0.52;
        const wash = (
          Math.sin(2 * Math.PI * 1250 * t) * 0.25 +
          Math.sin(2 * Math.PI * 2600 * t) * 0.25 +
          (Math.random() * 2 - 1) * 0.7
        ) * 0.22 * Math.exp(-t * 2.8);
        return ping + wash;
      }),

      // 13. Ride Bell (MIDI 53): Piercing 880Hz metallic bell tap
      rideBell: createBuffer(0.85, (t) => {
        const bell = (
          Math.sin(2 * Math.PI * 880 * t) * 0.55 +
          Math.sin(2 * Math.PI * 1760 * t) * 0.35 +
          Math.sin(2 * Math.PI * 2640 * t) * 0.15
        ) * Math.exp(-t * 3.8);
        return bell * 1.1;
      }),

      // 14. Hand Clap (MIDI 39): Multi-person handclap burst
      handClap: createBuffer(0.24, (t) => {
        const b1 = (Math.random() * 2 - 1) * (t < 0.012 ? 1 : 0);
        const b2 = (Math.random() * 2 - 1) * (t >= 0.012 && t < 0.024 ? 1.2 : 0);
        const b3 = (Math.random() * 2 - 1) * (t >= 0.024 ? Math.exp(-(t - 0.024) * 22) : 0);
        return (b1 + b2 + b3) * 0.85;
      }),

      // 15. Cowbell (MIDI 56): 587Hz & 845Hz dual tuned metallic bell
      cowbell: createBuffer(0.28, (t) => {
        const tone = (Math.sin(2 * Math.PI * 587 * t) * 0.6 + Math.sin(2 * Math.PI * 845 * t) * 0.4);
        return tone * Math.exp(-t * 16) * 1.2;
      }),

      // 16. Tambourine (MIDI 54): Jingle rattle
      tambourine: createBuffer(0.22, (t) => {
        const rattle = (Math.random() * 2 - 1) * (
          Math.sin(2 * Math.PI * 6500 * t) +
          Math.sin(2 * Math.PI * 11000 * t)
        ) * Math.exp(-t * 20);
        return rattle * 0.75;
      })
    };

    // Remaining General MIDI percussion notes (60-81). Previously every one
    // of these fell back to the snare, making Latin percussion and auxiliary
    // kits both incorrect and much too loud.
    const skinHit = (duration, frequency, decay, click = 0.16) => createBuffer(duration, (t) => {
      const pitch = frequency * (1 + 0.28 * Math.exp(-t * 22));
      const body = Math.sin(2 * Math.PI * pitch * t) * Math.exp(-t * decay);
      const slap = (Math.random() * 2 - 1) * Math.exp(-t * 115) * click;
      return body * 0.88 + slap;
    });

    const bellHit = (duration, frequency, decay) => createBuffer(duration, (t) => {
      const tone = (
        Math.sin(2 * Math.PI * frequency * t) * 0.68 +
        Math.sin(2 * Math.PI * frequency * 1.47 * t) * 0.24 +
        Math.sin(2 * Math.PI * frequency * 2.12 * t) * 0.12
      );
      return tone * Math.exp(-t * decay);
    });

    const shaker = (duration, decay, grainRate) => createBuffer(duration, (t) => {
      const grain = 0.35 + 0.65 * Math.max(0, Math.sin(2 * Math.PI * grainRate * t));
      return (Math.random() * 2 - 1) * grain * Math.exp(-t * decay);
    });

    Object.assign(this.drumAudioBuffers, {
      chineseCymbal: createBuffer(1.75, (t) => {
        const metal = (
          Math.sin(2 * Math.PI * 310 * t) * 0.22 +
          Math.sin(2 * Math.PI * 487 * t) * 0.27 +
          Math.sin(2 * Math.PI * 813 * t) * 0.25 +
          Math.sin(2 * Math.PI * 1510 * t) * 0.18 +
          (Math.random() * 2 - 1) * 0.65
        );
        return metal * Math.exp(-t * 2.1);
      }),
      vibraslap: createBuffer(0.62, (t) => {
        const pulse = Math.max(0, Math.sin(2 * Math.PI * 43 * t));
        const rattle = (Math.random() * 2 - 1) * pulse * Math.exp(-t * 5.4);
        const body = Math.sin(2 * Math.PI * 190 * t) * Math.exp(-t * 12) * 0.24;
        return rattle * 0.72 + body;
      }),
      bongoHigh: skinHit(0.23, 330, 16, 0.20),
      bongoLow: skinHit(0.28, 245, 13.5, 0.18),
      congaMuted: skinHit(0.19, 245, 25, 0.28),
      congaHigh: skinHit(0.38, 218, 10.5, 0.22),
      congaLow: skinHit(0.46, 174, 8.7, 0.20),
      timbaleHigh: skinHit(0.30, 520, 14, 0.26),
      timbaleLow: skinHit(0.34, 410, 12.5, 0.25),
      agogoHigh: bellHit(0.48, 940, 7.5),
      agogoLow: bellHit(0.55, 705, 6.7),
      cabasa: shaker(0.20, 17, 74),
      maracas: shaker(0.16, 25, 58),
      whistleShort: createBuffer(0.18, (t) => {
        const frequency = 1780 + 210 * Math.exp(-t * 18);
        return Math.sin(2 * Math.PI * frequency * t) * Math.exp(-t * 18);
      }),
      whistleLong: createBuffer(0.52, (t) => {
        const frequency = 1510 + 160 * Math.sin(2 * Math.PI * 5.2 * t);
        return Math.sin(2 * Math.PI * frequency * t) * Math.exp(-t * 4.4);
      }),
      guiroShort: createBuffer(0.16, (t) => {
        const teeth = Math.max(0, Math.sin(2 * Math.PI * 64 * t));
        return (Math.random() * 2 - 1) * teeth * Math.exp(-t * 16);
      }),
      guiroLong: createBuffer(0.48, (t) => {
        const teeth = Math.max(0, Math.sin(2 * Math.PI * 51 * t));
        return (Math.random() * 2 - 1) * teeth * Math.exp(-t * 4.2);
      }),
      claves: bellHit(0.14, 2480, 31),
      woodblockHigh: bellHit(0.18, 1760, 24),
      woodblockLow: bellHit(0.21, 1210, 20),
      cuicaMuted: createBuffer(0.24, (t) => {
        const frequency = 410 + 520 * t;
        return Math.sin(2 * Math.PI * frequency * t) * Math.exp(-t * 18);
      }),
      cuicaOpen: createBuffer(0.46, (t) => {
        const frequency = 355 + 390 * Math.sin(Math.min(1, t * 5.5) * Math.PI / 2);
        return Math.sin(2 * Math.PI * frequency * t) * Math.exp(-t * 6.5);
      }),
      triangleMuted: bellHit(0.22, 2750, 18),
      triangleOpen: bellHit(1.15, 2420, 3.1)
    });

    // Aliases
    this.drumAudioBuffers.splash = this.drumAudioBuffers.crash;
  }

  _buildFallbackSynths() {
    // Grand Piano: Rich acoustic partial harmonics with felt hammer attack
    this.synths.piano = new Tone.PolySynth(Tone.Synth, {
      oscillator: {
        type: 'custom',
        partials: [1.0, 0.42, 0.24, 0.14, 0.08, 0.04, 0.02, 0.01]
      },
      envelope: { attack: 0.002, decay: 2.8, sustain: 0.15, release: 1.4 }
    }).connect(this.channels.piano);
    this.synths.piano.volume.value = 2.0;

    // Bass: Warm acoustic/electric finger bass
    this.synths.bass = new Tone.MonoSynth({
      oscillator: { type: 'triangle' },
      filter: { Q: 2, type: 'lowpass', rolloff: -24 },
      envelope: { attack: 0.008, decay: 0.4, sustain: 0.7, release: 0.5 },
      filterEnvelope: { attack: 0.005, decay: 0.25, sustain: 0.3, release: 0.4, baseFrequency: 75, octaves: 2.8 }
    }).connect(this.channels.bass);

    // Guitar: Electric lead
    this.synths.guitar = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'sawtooth6' },
      envelope: { attack: 0.004, decay: 1.4, sustain: 0.25, release: 0.9 }
    }).connect(this.channels.guitar);

    // Trumpet / Brass: Swelling brass FM
    this.synths.trumpet = new Tone.PolySynth(Tone.FMSynth, {
      harmonicity: 1.0,
      modulationIndex: 3.5,
      oscillator: { type: 'sawtooth' },
      modulation: { type: 'sine' },
      envelope: { attack: 0.035, decay: 0.3, sustain: 0.75, release: 0.3 },
      modulationEnvelope: { attack: 0.03, decay: 0.2, sustain: 0.6, release: 0.2 }
    }).connect(this.channels.trumpet);

    // Synth / Leads
    this.synths.synth = new Tone.PolySynth(Tone.AMSynth, {
      harmonicity: 2.0,
      oscillator: { type: 'sawtooth' },
      envelope: { attack: 0.03, decay: 0.6, sustain: 0.7, release: 0.8 }
    }).connect(this.channels.synth);

    // Saxophone: Expressive breathy reed FM
    this.synths.sax = new Tone.PolySynth(Tone.FMSynth, {
      harmonicity: 2.0,
      modulationIndex: 2.5,
      oscillator: { type: 'sawtooth' },
      envelope: { attack: 0.05, decay: 0.4, sustain: 0.8, release: 0.35 }
    }).connect(this.channels.sax);

    // Violin / Strings: Sweet bowed acoustic model
    this.synths.violin = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'sawtooth' },
      envelope: { attack: 0.08, decay: 0.5, sustain: 0.85, release: 0.6 }
    }).connect(this.channels.violin);

    // Cello / Low Strings: Rich warm bowed acoustic cello model
    this.synths.cello = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'sawtooth' },
      envelope: { attack: 0.1, decay: 0.6, sustain: 0.85, release: 0.7 }
    }).connect(this.channels.cello);

    // Flute: Pure breathy sine/triangle model
    this.synths.flute = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'triangle' },
      envelope: { attack: 0.06, decay: 0.3, sustain: 0.8, release: 0.4 }
    }).connect(this.channels.flute);

    // Xylophone / Mallets: Pure acoustic wooden bar chime
    this.synths.xylophone = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'sine' },
      envelope: { attack: 0.001, decay: 1.2, sustain: 0.02, release: 0.8 }
    }).connect(this.channels.xylophone);
  }

  // Trigger Note-On with full General MIDI Program & Channel routing
  triggerNoteOn(instrument, note, velocity = 0.8, time = undefined, program = -1, channel = 0, instanceId = null) {
    if (!this.initialized) return;

    const baseInst = instrument.split('_')[0];
    const instKey = instanceId || instrument;
    if (this.muted[instKey] || this.muted[baseInst]) return;

    // Preserve the MIDI velocity range. A fixed minimum made ghost notes and
    // soft accompaniment much louder than they are in the original file.
    const vel = Math.max(0, Math.min(1.0, velocity));

    // A. Web MIDI API hardware route (Direct to Microsoft GS Wavetable Synth in Windows)
    if (this.activeMidiOutput) {
      try {
        const ch = channel !== undefined ? (channel & 0x0F) : (instrument === 'drums' ? 9 : 0);
        if (program >= 0 && ch !== 9 && this.currentPrograms[ch] !== program) {
          this.activeMidiOutput.send([0xC0 | ch, program & 0x7F]);
          this.currentPrograms[ch] = program;
        }
        const midiPitch = typeof note === 'number' ? note : Tone.Frequency(note).toMidi();
        const velByte = Math.round(Math.max(1, Math.min(127, vel * 127)));
        this.activeMidiOutput.send([0x90 | ch, midiPitch, velByte]);
        return;
      } catch (err) {
        console.warn('Web MIDI send error, falling back to Web Audio:', err);
      }
    }

    try {
      // B. 1. Unified GM SoundFont synth (melodic presets + drum kits)
      if (this.gmSynthReady && this.gmSynth) {
        const ch = channel !== undefined ? (channel & 0x0F) : (instrument === 'drums' ? 9 : 0);
        const midiPitch = typeof note === 'number' ? note : Tone.Frequency(note).toMidi();
        const requestedTime = Number(time);
        const eventOptions = Number.isFinite(requestedTime) ? { time: requestedTime } : undefined;

        if (program >= 0 && this.currentPrograms[ch] !== program) {
          this.gmSynth.programChange(ch, program & 0x7F, eventOptions);
          this.currentPrograms[ch] = program;
        }

        this.gmSynth.noteOn(
          ch,
          Math.max(0, Math.min(127, Math.round(midiPitch))),
          Math.max(0, Math.min(127, Math.round(vel * 127))),
          eventOptions
        );
        return;
      }

      // B. 2. Procedural drums (compatibility fallback)
      if (instrument === 'drums') {
        this._triggerDrumSound(note, vel, time, channel);
        return;
      }

      // B. 3. Per-instrument SoundFonts (compatibility fallback)
      let sfPlayer = null;

      // Check if this specific General MIDI Program has its own soundfont loaded
      if (program >= 0 && GM_PROGRAM_MAP[program]) {
        const specificSfName = GM_PROGRAM_MAP[program].sf;
        sfPlayer = this.soundfontPlayers[specificSfName];
      }

      // Fallback to base instrument soundfont
      if (!sfPlayer) {
        const defaultSfNames = {
          piano: 'acoustic_grand_piano',
          guitar: 'electric_guitar_clean',
          acousticGuitar: 'acoustic_guitar_steel',
          bass: 'electric_bass_finger',
          trumpet: 'trumpet',
          sax: 'tenor_sax',
          violin: 'violin',
          cello: 'cello',
          flute: 'flute',
          xylophone: 'xylophone',
          synth: 'lead_1_square'
        };
        const defaultName = defaultSfNames[baseInst];
        sfPlayer = this.soundfontPlayers[defaultName];
      }

      if (sfPlayer) {
        const audioCtx = Tone.getContext().rawContext;
        const now = audioCtx.currentTime;
        const noteNode = sfPlayer.play(note, now, {
          // The application fader is already applied by the channel bus.
          // Applying it again here previously boosted and squared every
          // instrument's level. CC 7 and CC 11 are the song's own mix.
          gain: this._getMidiVelocityGain(vel) * this._getMidiChannelGain(channel),
          duration: 3.8
        });

        const key = `${instKey}_${note}`;
        this.activeSoundfontNodes[key] = noteNode;
        return;
      }

      // B. 4. Oscillator synths (last-resort fallback)
      const t = time || Tone.now();
      const fallbackVelocity = this._getMidiVelocityGain(vel);
      if (baseInst === 'bass') {
        this.synths.bass.triggerAttack(note, t, fallbackVelocity);
      } else if (this.synths[baseInst]) {
        this.synths[baseInst].triggerAttack(note, t, fallbackVelocity);
      }
    } catch (e) {
      console.warn(`SoundEngine triggerNoteOn error (${instrument}):`, e);
    }
  }

  // Trigger Note-Off
  triggerNoteOff(instrument, note, time = undefined, program = -1, channel = 0, instanceId = null) {
    if (!this.initialized) return;

    // A. Web MIDI API hardware route
    if (this.activeMidiOutput) {
      try {
        const ch = channel !== undefined ? (channel & 0x0F) : (instrument === 'drums' ? 9 : 0);
        const midiPitch = typeof note === 'number' ? note : Tone.Frequency(note).toMidi();
        this.activeMidiOutput.send([0x80 | ch, midiPitch, 0]);
        return;
      } catch (err) {}
    }

    try {
      if (this.gmSynthReady && this.gmSynth) {
        const ch = channel !== undefined ? (channel & 0x0F) : (instrument === 'drums' ? 9 : 0);
        const midiPitch = typeof note === 'number' ? note : Tone.Frequency(note).toMidi();
        const requestedTime = Number(time);
        const eventOptions = Number.isFinite(requestedTime) ? { time: requestedTime } : undefined;
        this.gmSynth.noteOff(
          ch,
          Math.max(0, Math.min(127, Math.round(midiPitch))),
          eventOptions
        );
        return;
      }

      if (instrument === 'drums') return;

      const baseInst = instrument.split('_')[0];
      const instKey = instanceId || instrument;

      const key = `${instKey}_${note}`;
      const sfNode = this.activeSoundfontNodes[key];
      if (sfNode && typeof sfNode.stop === 'function') {
        const audioCtx = Tone.getContext().rawContext;
        sfNode.stop(audioCtx.currentTime + 0.05);
        delete this.activeSoundfontNodes[key];
        return;
      }

      const t = time || Tone.now();
      if (baseInst === 'bass') {
        this.synths.bass.triggerRelease(t);
      } else if (this.synths[baseInst]) {
        this.synths[baseInst].triggerRelease(note, t);
      }
    } catch (e) {
      console.warn(`SoundEngine triggerNoteOff error (${instrument}):`, e);
    }
  }

  _triggerDrumSound(pitchOrPiece, velocity = 0.8, time = undefined, channel = 9) {
    let piece = pitchOrPiece;
    if (typeof pitchOrPiece === 'number') {
      piece = this.midiPitchToDrumPiece(pitchOrPiece);
    } else if (typeof pitchOrPiece === 'string' && !this.drumAudioBuffers[piece]) {
      try {
        const midi = Tone.Frequency(pitchOrPiece).toMidi();
        if (!isNaN(midi)) {
          piece = this.midiPitchToDrumPiece(midi);
        }
      } catch (e) {
        piece = 'snare';
      }
    }

    // Hi-Hat Choke: Closed hi-hat or pedal hi-hat stops open hi-hat immediately
    if (piece === 'hihatClosed' || piece === 'hihatPedal') {
      this.activeHihatSources.forEach(s => {
        try { s.stop(); } catch (e) {}
      });
      this.activeHihatSources = [];
    }

    if (!piece) return;
    const buffer = this.drumAudioBuffers[piece] || this.drumAudioBuffers.snare;
    if (!buffer) return;

    try {
      const ctx = Tone.getContext().rawContext;
      const source = ctx.createBufferSource();
      source.buffer = buffer;

      const gain = ctx.createGain();
      // Drum buffers pass through the drums channel, where the user fader is
      // applied once. No artificial +50% boost: it was the main reason the
      // kit overwhelmed the rest of a MIDI arrangement.
      const pieceTrim = this.drumPieceTrims[piece] ?? 0.50;
      gain.gain.value = this._getMidiVelocityGain(velocity) * this._getMidiChannelGain(channel) * pieceTrim;

      source.connect(gain);
      const dest = this.nativeInputs.drums || ctx.destination;
      gain.connect(dest);

      this.activeDrumSources.push(source);
      source.onended = () => {
        this.activeDrumSources = this.activeDrumSources.filter(active => active !== source);
        this.activeHihatSources = this.activeHihatSources.filter(active => active !== source);
        try { source.disconnect(); } catch (e) {}
        try { gain.disconnect(); } catch (e) {}
      };

      const requestedTime = Number(time);
      source.start(Number.isFinite(requestedTime) ? Math.max(ctx.currentTime, requestedTime) : ctx.currentTime);

      if (piece === 'hihatOpen') {
        this.activeHihatSources.push(source);
      }
    } catch (e) {
      console.warn('Drum audio buffer play error:', e);
    }
  }

  midiPitchToDrumPiece(pitch) {
    if (pitch === 35 || pitch === 36) return 'kick';
    if (pitch === 37) return 'sideStick';
    if (pitch === 38 || pitch === 40) return 'snare';
    if (pitch === 39) return 'handClap';
    if (pitch === 41 || pitch === 43) return 'floorTom';
    if (pitch === 42) return 'hihatClosed';
    if (pitch === 44) return 'hihatPedal';
    if (pitch === 45 || pitch === 47) return 'tomLow';
    if (pitch === 46) return 'hihatOpen';
    if (pitch === 48) return 'tomMid';
    if (pitch === 50) return 'tomHigh';
    if (pitch === 49 || pitch === 57) return 'crash';
    if (pitch === 51 || pitch === 59) return 'ride';
    if (pitch === 52) return 'chineseCymbal';
    if (pitch === 53) return 'rideBell';
    if (pitch === 54) return 'tambourine';
    if (pitch === 55) return 'splash';
    if (pitch === 56) return 'cowbell';
    if (pitch === 58) return 'vibraslap';
    if (pitch === 60) return 'bongoHigh';
    if (pitch === 61) return 'bongoLow';
    if (pitch === 62) return 'congaMuted';
    if (pitch === 63) return 'congaHigh';
    if (pitch === 64) return 'congaLow';
    if (pitch === 65) return 'timbaleHigh';
    if (pitch === 66) return 'timbaleLow';
    if (pitch === 67) return 'agogoHigh';
    if (pitch === 68) return 'agogoLow';
    if (pitch === 69) return 'cabasa';
    if (pitch === 70) return 'maracas';
    if (pitch === 71) return 'whistleShort';
    if (pitch === 72) return 'whistleLong';
    if (pitch === 73) return 'guiroShort';
    if (pitch === 74) return 'guiroLong';
    if (pitch === 75) return 'claves';
    if (pitch === 76) return 'woodblockHigh';
    if (pitch === 77) return 'woodblockLow';
    if (pitch === 78) return 'cuicaMuted';
    if (pitch === 79) return 'cuicaOpen';
    if (pitch === 80) return 'triangleMuted';
    if (pitch === 81) return 'triangleOpen';
    return null;
  }

  setMasterVolume(val) {
    this.masterVolume = Math.max(0, Math.min(1, val));
    if (this.gmMasterGain) {
      const now = this.gmMasterGain.context.currentTime;
      this.gmMasterGain.gain.cancelScheduledValues(now);
      this.gmMasterGain.gain.setTargetAtTime(this.masterVolume, now, 0.012);
    }
    if (this.limiter) {
      Tone.getDestination().volume.rampTo(Tone.gainToDb(this.masterVolume), 0.05);
    }
  }

  setInstrumentVolume(instrument, val) {
    const clamped = Math.max(0, Math.min(1, val));
    this.volumes[instrument] = clamped;
    this._refreshGmMixerLevels();
    const baseInst = instrument.split('_')[0];
    const ch = this.channels[instrument] || this.channels[baseInst];
    if (ch) {
      const isMuted = this.muted[instrument] || this.muted[baseInst];
      const db = isMuted ? -Infinity : Tone.gainToDb(clamped);
      ch.volume.rampTo(db, 0.05);
    }
  }

  /**
   * Temporary channel level used by the compact band controls for mute/solo.
   * Unlike setInstrumentVolume it does not overwrite the user's mixer fader.
   */
  setChannelVolume(instrument, val) {
    const level = Math.max(0, Math.min(1, val));
    this.gmTemporaryMuted[instrument] = level === 0;
    this._refreshGmMixerLevels();

    const baseInst = instrument.split('_')[0];
    const ch = this.channels[instrument] || this.channels[baseInst];
    if (!ch) return;

    ch.volume.rampTo(level === 0 ? -Infinity : Tone.gainToDb(level), 0.05);
  }

  setMute(instrument, isMuted) {
    this.muted[instrument] = isMuted;
    this._refreshGmMixerLevels();
    const baseInst = instrument.split('_')[0];
    const ch = this.channels[instrument] || this.channels[baseInst];
    if (ch) {
      const vol = this.volumes[instrument] !== undefined ? this.volumes[instrument] : (this.volumes[baseInst] ?? 0.85);
      const db = (isMuted || this.muted[baseInst]) ? -Infinity : Tone.gainToDb(vol);
      ch.volume.rampTo(db, 0.05);
    }
  }

  setSolo(instrument, isSolo) {
    this.solo[instrument] = isSolo;
    this._refreshGmMixerLevels();
    const anySolo = Object.values(this.solo).some(s => s);

    Object.keys(this.channels).forEach(inst => {
      let targetDb;
      if (anySolo) {
        targetDb = this.solo[inst] ? Tone.gainToDb(this.volumes[inst]) : -Infinity;
      } else {
        targetDb = this.muted[inst] ? -Infinity : Tone.gainToDb(this.volumes[inst]);
      }
      this.channels[inst].volume.rampTo(targetDb, 0.05);
    });
  }

  getVisualizerData() {
    if (this.gmSynthReady && this.gmAnalyser) {
      const values = new Float32Array(this.gmAnalyser.frequencyBinCount);
      this.gmAnalyser.getFloatFrequencyData(values);
      return values;
    }
    if (!this.analyser) return new Float32Array(64).fill(-100);
    return this.analyser.getValue();
  }

  stopAll() {
    if (!this.initialized) return;
    try {
      // Send MIDI All Notes Off
      if (this.activeMidiOutput) {
        for (let c = 0; c < 16; c++) {
          try {
            this.activeMidiOutput.send([0xB0 | c, 123, 0]); // All Notes Off
            this.activeMidiOutput.send([0xB0 | c, 120, 0]); // All Sound Off
          } catch (e) {}
        }
      }

      if (this.gmSynthReady && this.gmSynth) {
        this.gmSynth.stopAll(true);
      }

      if (this.synths.piano) this.synths.piano.releaseAll();
      if (this.synths.guitar) this.synths.guitar.releaseAll();
      if (this.synths.trumpet) this.synths.trumpet.releaseAll();
      if (this.synths.synth) this.synths.synth.releaseAll();
      if (this.synths.sax) this.synths.sax.releaseAll();
      if (this.synths.violin) this.synths.violin.releaseAll();
      if (this.synths.cello) this.synths.cello.releaseAll();
      if (this.synths.flute) this.synths.flute.releaseAll();
      if (this.synths.xylophone) this.synths.xylophone.releaseAll();
      if (this.synths.bass) this.synths.bass.triggerRelease();

      Object.values(this.activeSoundfontNodes).forEach(node => {
        if (node && typeof node.stop === 'function') {
          node.stop();
        }
      });
      this.activeSoundfontNodes = {};

      this.activeDrumSources.forEach(source => {
        try { source.stop(); } catch (e) {}
      });
      this.activeDrumSources = [];
      this.activeHihatSources = [];
    } catch (e) {
      console.warn('stopAll error:', e);
    }
  }
}
