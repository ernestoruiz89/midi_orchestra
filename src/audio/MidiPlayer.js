import * as toneMidi from '@tonejs/midi';
const Midi = toneMidi.Midi || toneMidi.default?.Midi || toneMidi.default || toneMidi;

// Kept separate from audio scheduling: drumstick motion should prepare the
// visual hit before the note, but the sound must remain sample-accurate.
const DRUM_STICK_ANTICIPATION_SECONDS = 0.22;

// MIDIs2Jam2 visibility rules: reveal shortly before the next performance,
// keep an instrument on stage through brief musical rests, and remove it once
// it has genuinely become inactive.
const INSTRUMENT_SHOW_BEFORE_SECONDS = 1;
const INSTRUMENT_SHOW_BETWEEN_SECONDS = 7;
const INSTRUMENT_SHOW_AFTER_SECONDS = 2;

// requestAnimationFrame is intentionally paused by browsers for hidden tabs.
// MIDI audio must use its own timer or every event accumulated in the hidden
// interval will fire in one noisy burst when the tab becomes visible again.
const AUDIO_TIMER_INTERVAL_MS = 25;
const MAX_AUDIO_CATCH_UP_SECONDS = 0.2;
const MAX_VISUAL_CATCH_UP_SECONDS = 0.2;

const DEFAULT_GM_PROGRAMS = {
  piano: 0,
  drums: 0,
  guitar: 27,
  acousticGuitar: 25,
  bass: 33,
  doubleBass: 32,
  trumpet: 56,
  frenchHorn: 60,
  sax: 66,
  clarinet: 71,
  violin: 40,
  cello: 42,
  flute: 73,
  xylophone: 13,
  synth: 80,
  cabasa: 69,
  congas: 63,
  timbales: 65,
  tambourine: 54,
  maracas: 70,
  whistle: 71,
  guiro: 73,
  triangle: 81
};

/**
 * Authoritative General MIDI Level 1 (GM1) Program Map (0-127).
 * Replicates MIDIsJam's instrument visualizer routing for standard GM sound banks.
 */
export const GM_PROGRAM_TO_INSTRUMENT = {
  // 0-7: Piano
  0: 'piano', 1: 'piano', 2: 'piano', 3: 'piano', 4: 'piano', 5: 'piano', 6: 'piano', 7: 'piano',
  // 8-15: Chromatic Percussion
  8: 'xylophone', 9: 'xylophone', 10: 'xylophone', 11: 'xylophone', 12: 'xylophone', 13: 'xylophone', 14: 'xylophone', 15: 'xylophone',
  // 16-23: Organ, Accordion & Harmonica
  16: 'piano', 17: 'piano', 18: 'piano', 19: 'piano', 20: 'piano', 21: 'accordion', 22: 'harmonica', 23: 'accordion',
  // 24-31: Guitar
  24: 'acousticGuitar', 25: 'acousticGuitar', 26: 'guitar', 27: 'guitar', 28: 'guitar', 29: 'guitar', 30: 'guitar', 31: 'guitar',
  // 32-39: Bass
  32: 'doubleBass', 33: 'bass', 34: 'bass', 35: 'bass', 36: 'bass', 37: 'bass', 38: 'synth', 39: 'synth',
  // 40-47: Strings & Orchestral Harp
  40: 'violin', 41: 'violin', 42: 'cello', 43: 'doubleBass', 44: 'violin', 45: 'violin', 46: 'harp', 47: 'drums',
  // 48-55: Ensemble
  48: 'violin', 49: 'violin', 50: 'synth', 51: 'synth', 52: 'flute', 53: 'flute', 54: 'synth', 55: 'drums',
  // 56-63: Brass
  56: 'trumpet', 57: 'trumpet', 58: 'trumpet', 59: 'trumpet', 60: 'frenchHorn', 61: 'trumpet', 62: 'trumpet', 63: 'trumpet',
  // 64-71: Reed
  64: 'sax', 65: 'sax', 66: 'sax', 67: 'sax',
  68: 'flute', 69: 'flute', 70: 'flute', 71: 'clarinet',
  // 72-79: Pipes / Woodwinds
  72: 'flute', 73: 'flute', 74: 'flute', 75: 'flute', 76: 'flute', 77: 'flute', 78: 'flute', 79: 'flute',
  // 80-87: Synth Lead
  80: 'synth', 81: 'synth', 82: 'synth', 83: 'synth', 84: 'synth', 85: 'synth', 86: 'synth', 87: 'synth',
  // 88-95: Synth Pad
  88: 'synth', 89: 'synth', 90: 'synth', 91: 'synth', 92: 'synth', 93: 'synth', 94: 'synth', 95: 'synth',
  // 96-103: Synth Effects
  96: 'synth', 97: 'synth', 98: 'synth', 99: 'synth', 100: 'synth', 101: 'synth', 102: 'synth', 103: 'synth',
  // 104-111: Ethnic
  104: 'guitar', 105: 'guitar', 106: 'guitar', 107: 'guitar', 108: 'xylophone', 109: 'flute', 110: 'violin', 111: 'flute',
  // 112-119: Percussive & Drums (113 = Agogo -> timbales set, 119 = Reverse Cymbal -> played on drum kit cymbal)
  112: 'xylophone', 113: 'timbales', 114: 'xylophone', 115: 'xylophone', 116: 'drums', 117: 'drums', 118: 'drums', 119: 'drums',
  // 120-127: Sound Effects
  120: 'guitar', 121: 'flute', 122: 'synth', 123: 'synth', 124: 'synth', 125: 'synth', 126: 'synth', 127: 'drums'
};

const VALID_3D_INSTRUMENTS = new Set([
  'piano', 'drums', 'bass', 'doubleBass', 'guitar', 'acousticGuitar',
  'trumpet', 'frenchHorn', 'sax', 'clarinet', 'violin', 'cello', 'flute', 'xylophone', 'synth', 'cabasa', 'congas', 'timbales',
  'tambourine', 'maracas', 'whistle', 'guiro', 'triangle', 'harp', 'harmonica', 'accordion'
]);

/**
 * MidiPlayer parses and schedules MIDI events, coordinates sound synthesis
 * and 3D visual animations in real-time.
 */
export class MidiPlayer {
  constructor(soundEngine) {
    this.soundEngine = soundEngine;
    this.midiData = null;
    this.songName = 'No song loaded';
    this.duration = 0;
    this.bpm = 120;

    // Playback state
    this.isPlaying = false;
    this.isPaused = false;
    this.currentTime = 0;
    this.playbackRate = 1.0;
    this.isLooping = false;
    this.alwaysShowInstruments = false;

    // Animation frame / timing
    this.lastFrameTime = 0;
    this.rafId = null;
    this.audioTimerId = null;
    this.audioProcessedTime = 0;
    this.visualProcessedTime = 0;
    this.playbackAnchorTime = 0;
    this.playbackAnchorSongTime = 0;

    // Pre-processed unified note event list
    this.events = [];
    this.activeNoteEvents = new Set();
    this.trackInfos = [];
    this.totalNoteCount = 0;
    this.instrumentVisibilityWindows = new Map();
    this.lastVisibleInstrumentSignature = null;

    // Callbacks
    this.onNotePrepare = null;  // (instrument, noteNumber, noteName, velocity, duration) => {}
    this.onNoteOn = null;       // (instrument, noteNumber, noteName, velocity, duration) => {}
    this.onNoteOff = null;      // (instrument, noteNumber, noteName) => {}
    this.onProgress = null;     // (currentTime, duration, percent) => {}
    this.onSongLoaded = null;   // (songInfo) => {}
    this.onStateChange = null;  // (isPlaying, isPaused) => {}
    this.onTrackUpdate = null;  // (trackInfos) => {}
    this.onActivityUpdate = null; // (activityMap) => {}
    this.onActiveInstrumentsChanged = null; // (activeInstrumentsList) => {}
    this.onVisibleInstrumentsChanged = null; // (currentlyVisibleInstanceIds) => {}

    // Real-time instrument activity (0.0 to 1.0) for MIDIJam HUD meters and Director Cam
    this.instrumentActivity = {
      piano: 0,
      drums: 0,
      guitar: 0,
      acousticGuitar: 0,
      bass: 0,
      doubleBass: 0,
      trumpet: 0,
      sax: 0,
      violin: 0,
      cello: 0,
      flute: 0,
      xylophone: 0,
      synth: 0,
      frenchHorn: 0,
      clarinet: 0,
      cabasa: 0,
      congas: 0,
      timbales: 0,
      tambourine: 0,
      maracas: 0,
      whistle: 0,
      guiro: 0,
      triangle: 0
    };
  }

  /**
   * Load MIDI from ArrayBuffer or raw binary string
   */
  async loadMidiData(arrayBuffer, name = 'Imported Song') {
    this.stop();

    try {
      const midi = new Midi(arrayBuffer);
      this.midiData = midi;
      this.songName = midi.name || name;
      this.duration = midi.duration || 0;
      this.bpm = midi.header.tempos.length > 0 ? Math.round(midi.header.tempos[0].bpm) : 120;

      // Extract and map all tracks
      this._processTracks(midi);

      if (this.onSongLoaded) {
        this.onSongLoaded({
          name: this.songName,
          duration: this.duration,
          bpm: this.bpm,
          trackCount: this.trackInfos.length,
          totalNotes: this.totalNoteCount,
          tracks: this.trackInfos
        });
      }

      return true;
    } catch (err) {
      console.error('Failed to parse MIDI file:', err);
      throw err;
    }
  }

  _processTracks(midi) {
    this.events = [];
    this.trackInfos = [];

    let totalNoteCount = 0;

    const instCounts = {};

    midi.tracks.forEach((track, index) => {
      const channel = track.channel !== undefined ? track.channel : 0;

      // Control changes are part of the MIDI performance, not UI metadata.
      // A CC 7 (channel volume) or CC 11 (expression) may live in a track
      // without notes, so capture it before skipping empty visual tracks.
      Object.entries(track.controlChanges || {}).forEach(([controller, changes]) => {
        if (!Array.isArray(changes)) return;
        changes.forEach(change => {
          this.events.push({
            type: 'cc',
            time: change.time,
            controller: Number(controller),
            value: change.value,
            channel
          });
        });
      });

      (track.pitchBends || []).forEach(change => {
        this.events.push({
          type: 'pitchBend',
          time: change.time,
          value: change.value,
          channel
        });
      });

      if (track.notes.length === 0) return;

      const detectedInstrument = this._classifyTrackInstrument(track, index);
      let instanceIndex = 0;
      let instanceId = detectedInstrument;

      if (detectedInstrument !== 'drums') {
        const count = instCounts[detectedInstrument] || 0;
        instCounts[detectedInstrument] = count + 1;
        instanceIndex = count;
        instanceId = count === 0 ? detectedInstrument : `${detectedInstrument}_${count + 1}`;
      } else {
        // Drums NEVER duplicate; all drum tracks regardless of channel feed into the single master kit
        instanceIndex = 0;
        instanceId = 'drums';
      }

      const trackInfo = {
        index: index,
        name: track.name || `Pista ${index + 1}`,
        channel,
        instrument: detectedInstrument,
        instanceIndex: instanceIndex,
        instanceId: instanceId,
        noteCount: track.notes.length,
        programNumber: Number.isInteger(track.instrument?.number)
          ? track.instrument.number
          : (DEFAULT_GM_PROGRAMS[detectedInstrument] ?? 0)
      };
      this.trackInfos.push(trackInfo);

      track.notes.forEach(note => {
        totalNoteCount++;
        const eventDetails = {
          duration: note.duration,
          midi: note.midi,
          name: note.name,
          velocity: note.velocity,
          trackIndex: index,
          instrument: detectedInstrument,
          instanceId: instanceId,
          instanceIndex: instanceIndex,
          programNumber: trackInfo.programNumber,
          channel: trackInfo.channel !== undefined ? trackInfo.channel : (detectedInstrument === 'drums' ? 9 : 0)
        };

        // Percussion needs a readable physical preparation. This event is
        // visual-only, so it never reaches the synthesizer before the note.
        if (detectedInstrument === 'drums' || detectedInstrument === 'timbales' || detectedInstrument === 'congas') {
          this.events.push({
            type: 'prepare',
            time: Math.max(0, note.time - DRUM_STICK_ANTICIPATION_SECONDS),
            noteTime: note.time,
            ...eventDetails
          });
        }

        // Note ON event
        this.events.push({
          type: 'on',
          time: note.time,
          ...eventDetails
        });

        // Note OFF event
        this.events.push({
          type: 'off',
          time: note.time + note.duration,
          ...eventDetails,
          velocity: 0
        });
      });
    });

    this.totalNoteCount = totalNoteCount;

    // Sort all events by time for fast sequential cursor processing. A
    // controller event at the same instant as a note must reach the synth
    // first, just as it does in a standard MIDI sequencer.
    const eventPriority = { cc: 0, pitchBend: 1, prepare: 2, off: 3, on: 4 };
    this.events.sort((a, b) => a.time - b.time || eventPriority[a.type] - eventPriority[b.type]);

    // If no tracks had notes, set fallback duration
    if (this.duration === 0 && this.events.length > 0) {
      this.duration = this.events[this.events.length - 1].time;
    }

    this._rebuildInstrumentVisibilityWindows();

    // Pre-load accurate General MIDI soundfonts for this song
    if (this.soundEngine && typeof this.soundEngine.prepareTrackInstruments === 'function') {
      this.soundEngine.prepareTrackInstruments(this.trackInfos);
    }

    // Notify listeners of the instruments active in this song
    if (this.onActiveInstrumentsChanged) {
      this.onActiveInstrumentsChanged(this.getActiveInstruments());
    }
  }

  _classifyTrackInstrument(track, index) {
    // 1. Dedicated GM Percussion / Drum Kit: Channel 10 (zero-indexed 9)
    if (track.channel === 9) {
      return 'drums';
    }

    // 2. Direct valid string instrument (e.g. from studio DemoSongs)
    if (typeof track.instrument === 'string' && VALID_3D_INSTRUMENTS.has(track.instrument)) {
      return track.instrument;
    }

    const trackName = (track.name || '').toLowerCase();
    const prog = track.instrument && typeof track.instrument.number === 'number' ? track.instrument.number : -1;

    // 3. Authoritative MIDI Program Code Assignment (GM 1-127)
    // When a track contains an explicit non-zero program code, it reflects the composer's
    // deliberate GM instrument choice (e.g. 32 Acoustic Bass -> doubleBass, 35 Fretless Bass -> bass).
    if (prog > 0 && prog <= 127 && GM_PROGRAM_TO_INSTRUMENT[prog]) {
      return GM_PROGRAM_TO_INSTRUMENT[prog];
    }

    // 4. High-Precision Track Name Inspection (Arranger Intent for Program 0 or unassigned tracks)
    // A. Double Bass / Contrabajo:
    if (/\b(contrabajo|double\s*bass|upright\s*bass|acoustic\s*bass|bajo\s*ac[uú]stico|standup\s*bass)\b/i.test(trackName)) {
      return 'doubleBass';
    }

    // B. Cello / Violonchelo:
    if (/\b(cello|violoncello|violonchelo|chelo)\b/i.test(trackName)) {
      return 'cello';
    }

    // C. Piano / Keyboard / Organ:
    if (/\b(piano|pno|grand\s*piano|keyboard|teclado|rhodes|wurlitzer|clavinet|clavi|harpsichord|organ[oó]?|hammond|accordion|acorde[oó]n)\b/i.test(trackName)) {
      return 'piano';
    }

    // D. Drums / Percussion:
    if (/\b(cabasa|afuche)\b/i.test(trackName)) {
      return 'cabasa';
    }
    if (/\b(tambourine|pandereta)\b/i.test(trackName)) {
      return 'tambourine';
    }
    if (/\b(maracas?)\b/i.test(trackName)) {
      return 'maracas';
    }
    if (/\b(whistle|silbato|apito)\b/i.test(trackName)) {
      return 'whistle';
    }
    if (/\b(guiro|güiro)\b/i.test(trackName)) {
      return 'guiro';
    }
    if (/\b(triangle|triangulo)\b/i.test(trackName)) {
      return 'triangle';
    }
    if (/\b(bongo|bongos|bong[oó]s?|conga|congas|tumbadora|tumbadoras|quinto|tumba|latin\s*perc(ussion)?)\b/i.test(trackName)) {
      return 'congas';
    }
    if (/\b(timbal|timbale|timbales|pailas?|agogo|cencerro|mambo\s*bell)\b/i.test(trackName)) {
      return 'timbales';
    }
    if (/\b(reverse\s*cymbal|rev\s*cymbal|platillo\s*invertido|cymbal\s*reverse)\b/i.test(trackName)) {
      return 'drums';
    }
    if (/\b(drums?|drumkit|bater[ií]a|percussion|perc|caja|bombo|hi-?hat)\b/i.test(trackName) && !/steel\s*drum/i.test(trackName)) {
      return 'drums';
    }

    // E. Bass (Electric / Generic):
    if (/\b(bass|bajo|fretless)\b/i.test(trackName) && !/\b(brass|bassoon)\b/i.test(trackName)) {
      return 'bass';
    }

    // F. Acoustic Guitar (requires explicit acoustic indicator alongside guitar, never standalone 'acoustic'):
    if (
      /\b(acoustic\s*guitar|guitarra\s*ac[uú]stica|nylon\s*guitar|steel\s*guitar|spanish\s*guitar|classical\s*guitar|ac[uú]stic[ao]\s*gtr|ac\.?\s*gtr|guitarra\s*espa[ñn]ola)\b/i.test(trackName) ||
      (/\b(guitar|guitarra|gtr)\b/i.test(trackName) && /\b(acoustic|ac[uú]stic[ao]|nylon|steel|cl[aá]sic[ao]|folk|spanish|espa[ñn]ol[ao]?)\b/i.test(trackName))
    ) {
      return 'acousticGuitar';
    }

    // G. Electric Guitar:
    if (/\b(guitar|guitarra|gtr|strat|les\s*paul|telecaster|overdrive|distortion|riff)\b/i.test(trackName)) {
      return 'guitar';
    }

    // H. Saxophone:
    if (/\b(sax|saxo|saxophone|saxof[oó]n|alto\s*sax|tenor\s*sax|soprano\s*sax|baritone\s*sax)\b/i.test(trackName)) {
      return 'sax';
    }

    // French Horn / Corno:
    if (/\b(french\s*horn|corno|cor\s*fran[cç]ais|cor\s*d['\s]harmonie|waldhorn)\b/i.test(trackName)) {
      return 'frenchHorn';
    }

    // I. Trumpet / Brass:
    if (/\b(trumpet|trompeta|brass|horns?|tuba|trombone|tromb[oó]n|cornet|metales)\b/i.test(trackName)) {
      return 'trumpet';
    }

    // J. Violin / Strings Section:
    if (/\b(violin|viol[ií]n|viola|strings?|cuerdas?|fiddle|harp|arpa|orchestra|orquesta)\b/i.test(trackName)) {
      return 'violin';
    }

    // Clarinet / Clarinete:
    if (/\b(clarinet|clarinete|clarinette|klarinette)\b/i.test(trackName)) {
      return 'clarinet';
    }

    // K. Flute / Woodwinds:
    if (/\b(flute|flauta|piccolo|recorder|pan\s*flute|oboe|bassoon|fagot|whistle|ocarina|woodwinds?)\b/i.test(trackName)) {
      return 'flute';
    }

    // L. Xylophone / Chromatic Mallets:
    if (/\b(xylo(phone)?|xil[oó]fono|marimba|vibra(phone)?|glockenspiel|glock|bells?|campanas?|celesta|dulcimer|chimes?|steel\s*drums?)\b/i.test(trackName)) {
      return 'xylophone';
    }

    // M. Synthesizer:
    if (/\b(synth|sintetizador|synthesizer|lead|pad|saw|square|techno|moog|sequencer)\b/i.test(trackName)) {
      return 'synth';
    }

    // 5. If program code is explicitly 0 (Acoustic Grand Piano):
    if (prog === 0) {
      return 'piano';
    }

    // 6. Tone.js Instrument Family & Name Fallback
    const instFamily = (track.instrument?.family || '').toLowerCase();
    const instName = (track.instrument?.name || '').toLowerCase();

    if (instFamily.includes('piano') || instFamily.includes('organ')) {
      return 'piano';
    }
    if (instFamily.includes('guitar')) {
      if (instName.includes('nylon') || instName.includes('steel') || (instName.includes('acoustic') && instName.includes('guitar'))) {
        return 'acousticGuitar';
      }
      return 'guitar';
    }
    if (instFamily.includes('bass')) {
      if (instName.includes('acoustic') || instName.includes('upright') || instName.includes('contrabass')) {
        return 'doubleBass';
      }
      return 'bass';
    }
    if (instFamily.includes('strings') || instFamily.includes('orchestral')) {
      if (instName.includes('cello')) return 'cello';
      if (instName.includes('contrabass') || instName.includes('double bass')) return 'doubleBass';
      return 'violin';
    }
    if (instFamily.includes('brass')) {
      if (instName.includes('horn') || instName.includes('french')) return 'frenchHorn';
      return 'trumpet';
    }
    if (instFamily.includes('reed')) {
      if (instName.includes('sax')) return 'sax';
      if (instName.includes('clarinet')) return 'clarinet';
      return 'flute';
    }
    if (instFamily.includes('pipe') || instFamily.includes('woodwind')) {
      return 'flute';
    }
    if (instFamily.includes('synth')) {
      return 'synth';
    }
    if (instFamily.includes('chromatic') || instFamily.includes('mallet')) {
      return 'xylophone';
    }
    if (instFamily.includes('percuss') || instFamily.includes('drum')) {
      return 'drums';
    }

    // 7. Default Fallback: General MIDI specification defaults unassigned tracks to Program 0 (Acoustic Grand Piano)
    return 'piano';
  }

  getActiveInstruments() {
    const list = new Set(this.trackInfos.map(t => t.instanceId).filter(Boolean));
    const hasCabasaNote = this.events.some(e => (e.instrument === 'drums' && e.midi === 69) || e.instrument === 'cabasa');
    if (hasCabasaNote) {
      list.add('cabasa');
    }
    const hasCongasNote = this.events.some(e => (e.instrument === 'drums' && e.midi >= 60 && e.midi <= 64) || e.instrument === 'congas');
    if (hasCongasNote) {
      list.add('congas');
    }
    const hasTimbalesNote = this.events.some(e => (e.instrument === 'drums' && (e.midi === 56 || (e.midi >= 65 && e.midi <= 68))) || e.instrument === 'timbales');
    if (hasTimbalesNote) {
      list.add('timbales');
    }
    const hasTambourineNote = this.events.some(e => (e.instrument === 'drums' && e.midi === 54) || e.instrument === 'tambourine');
    if (hasTambourineNote) {
      list.add('tambourine');
    }
    const hasMaracasNote = this.events.some(e => (e.instrument === 'drums' && e.midi === 70) || e.instrument === 'maracas');
    if (hasMaracasNote) {
      list.add('maracas');
    }
    const hasWhistleNote = this.events.some(e => (e.instrument === 'drums' && (e.midi === 71 || e.midi === 72)) || e.instrument === 'whistle');
    if (hasWhistleNote) {
      list.add('whistle');
    }
    const hasGuiroNote = this.events.some(e => (e.instrument === 'drums' && (e.midi === 73 || e.midi === 74)) || e.instrument === 'guiro');
    if (hasGuiroNote) {
      list.add('guiro');
    }
    const hasTriangleNote = this.events.some(e => (e.instrument === 'drums' && (e.midi === 80 || e.midi === 81)) || e.instrument === 'triangle');
    if (hasTriangleNote) {
      list.add('triangle');
    }
    return Array.from(list);
  }

  /**
   * Builds merged activity windows for every instrument instance. Sustained
   * notes remain visible until their Note Off, while short rests of up to the
   * MIDIs2Jam2 seven-second threshold do not make the model flicker.
   */
  _rebuildInstrumentVisibilityWindows() {
    const notesByInstance = new Map();

    this.events.forEach(event => {
      if (event.type !== 'on') return;
      const instanceId = event.instanceId || event.instrument;
      if (!instanceId) return;
      if (!notesByInstance.has(instanceId)) notesByInstance.set(instanceId, []);
      notesByInstance.get(instanceId).push({
        start: event.time,
        end: event.time + Math.max(0, event.duration || 0)
      });
      if (event.instrument === 'drums' && event.midi === 69) {
        if (!notesByInstance.has('cabasa')) notesByInstance.set('cabasa', []);
        notesByInstance.get('cabasa').push({
          start: event.time,
          end: event.time + Math.max(0, event.duration || 0.1)
        });
      }
      if (event.instrument === 'drums' && event.midi === 54) {
        if (!notesByInstance.has('tambourine')) notesByInstance.set('tambourine', []);
        notesByInstance.get('tambourine').push({
          start: event.time,
          end: event.time + Math.max(0, event.duration || 0.1)
        });
      }
      if (event.instrument === 'drums' && event.midi === 70) {
        if (!notesByInstance.has('maracas')) notesByInstance.set('maracas', []);
        notesByInstance.get('maracas').push({
          start: event.time,
          end: event.time + Math.max(0, event.duration || 0.1)
        });
      }
      if (event.instrument === 'drums' && (event.midi === 71 || event.midi === 72)) {
        if (!notesByInstance.has('whistle')) notesByInstance.set('whistle', []);
        notesByInstance.get('whistle').push({
          start: event.time,
          end: event.time + Math.max(0, event.duration || 0.1)
        });
      }
      if (event.instrument === 'drums' && (event.midi === 73 || event.midi === 74)) {
        if (!notesByInstance.has('guiro')) notesByInstance.set('guiro', []);
        notesByInstance.get('guiro').push({
          start: event.time,
          end: event.time + Math.max(0, event.duration || 0.1)
        });
      }
      if (event.instrument === 'drums' && (event.midi === 80 || event.midi === 81)) {
        if (!notesByInstance.has('triangle')) notesByInstance.set('triangle', []);
        notesByInstance.get('triangle').push({
          start: event.time,
          end: event.time + Math.max(0, event.duration || 0.1)
        });
      }
      if (event.instrument === 'drums' && event.midi >= 60 && event.midi <= 64) {
        if (!notesByInstance.has('congas')) notesByInstance.set('congas', []);
        notesByInstance.get('congas').push({
          start: event.time,
          end: event.time + Math.max(0, event.duration || 0.1)
        });
      }
      if (event.instrument === 'drums' && (event.midi === 56 || (event.midi >= 65 && event.midi <= 68))) {
        if (!notesByInstance.has('timbales')) notesByInstance.set('timbales', []);
        notesByInstance.get('timbales').push({
          start: event.time,
          end: event.time + Math.max(0, event.duration || 0.1)
        });
      }
    });

    this.instrumentVisibilityWindows = new Map();
    notesByInstance.forEach((notes, instanceId) => {
      notes.sort((a, b) => a.start - b.start || a.end - b.end);
      const windows = [];

      notes.forEach(note => {
        const previous = windows[windows.length - 1];
        const windowStart = Math.max(0, note.start - INSTRUMENT_SHOW_BEFORE_SECONDS);
        const windowEnd = note.end + INSTRUMENT_SHOW_AFTER_SECONDS;

        if (previous && note.start - previous.lastActivityEnd <= INSTRUMENT_SHOW_BETWEEN_SECONDS) {
          previous.end = Math.max(previous.end, windowEnd);
          previous.lastActivityEnd = Math.max(previous.lastActivityEnd, note.end);
        } else {
          windows.push({
            start: windowStart,
            end: windowEnd,
            lastActivityEnd: note.end
          });
        }
      });

      this.instrumentVisibilityWindows.set(
        instanceId,
        windows.map(({ start, end }) => ({ start, end }))
      );
    });

    this.lastVisibleInstrumentSignature = null;
  }

  getVisibleInstruments(time = this.currentTime) {
    if (this.alwaysShowInstruments) return this.getActiveInstruments();

    return this.getActiveInstruments().filter(instanceId => {
      const windows = this.instrumentVisibilityWindows.get(instanceId) || [];
      return windows.some(window => time >= window.start && time <= window.end);
    });
  }

  setAlwaysShowInstruments(alwaysShow) {
    this.alwaysShowInstruments = Boolean(alwaysShow);
    this._emitVisibleInstruments(this.currentTime, true);
  }

  _emitVisibleInstruments(time = this.currentTime, force = false) {
    const visible = this.getVisibleInstruments(time);
    const signature = [...visible].sort().join('|');
    if (!force && signature === this.lastVisibleInstrumentSignature) return;

    this.lastVisibleInstrumentSignature = signature;
    if (this.onVisibleInstrumentsChanged) {
      this.onVisibleInstrumentsChanged(visible);
    }
  }

  setTrackInstrument(trackIndex, newInstrument) {
    const trackInfo = this.trackInfos.find(t => t.index === trackIndex);
    if (trackInfo) {
      trackInfo.instrument = newInstrument;
      if (DEFAULT_GM_PROGRAMS[newInstrument] !== undefined) {
        trackInfo.programNumber = DEFAULT_GM_PROGRAMS[newInstrument];
        trackInfo.channel = newInstrument === 'drums' ? 9 : (trackInfo.channel === 9 ? 0 : trackInfo.channel);
      }

      // Re-calculate instance numbering for all tracks
      const counts = {};
      this.trackInfos.forEach(t => {
        const inst = t.instrument;
        if (inst === 'drums') {
          // Drums NEVER duplicate; all drum tracks feed into single master kit
          t.instanceIndex = 0;
          t.instanceId = 'drums';
        } else {
          const count = counts[inst] || 0;
          counts[inst] = count + 1;
          t.instanceIndex = count;
          t.instanceId = count === 0 ? inst : `${inst}_${count + 1}`;
        }
      });

      // Update all events with recalculated instanceId, programNumber, channel
      this.events.forEach(ev => {
        const t = this.trackInfos.find(ti => ti.index === ev.trackIndex);
        if (t) {
          ev.instrument = t.instrument;
          ev.instanceIndex = t.instanceIndex;
          ev.instanceId = t.instanceId;
          ev.programNumber = t.programNumber;
          ev.channel = t.channel;
        }
      });

      this._rebuildInstrumentVisibilityWindows();

      if (this.soundEngine && typeof this.soundEngine.prepareTrackInstruments === 'function') {
        this.soundEngine.prepareTrackInstruments(this.trackInfos);
      }

      if (this.onTrackUpdate) {
        this.onTrackUpdate(this.trackInfos);
      }
      if (this.onActiveInstrumentsChanged) {
        this.onActiveInstrumentsChanged(this.getActiveInstruments());
      }
    }
  }

  async play() {
    if (this.events.length === 0) return;

    if (!this.soundEngine.initialized) {
      await this.soundEngine.init();
    }

    // Wait for the actual GM programs used by this song. Playing immediately
    // used to fall back to simple oscillators while soundfonts loaded, so the
    // opening of a song could have a noticeably different quality.
    if (typeof this.soundEngine.prepareTrackInstruments === 'function') {
      await this.soundEngine.prepareTrackInstruments(this.trackInfos);
    }

    if (this.currentTime >= this.duration) {
      this.currentTime = 0;
    }

    const isResuming = this.isPaused;
    if (!isResuming) {
      this._syncMidiControllersAt(this.currentTime);
    }

    this.isPlaying = true;
    this.isPaused = false;
    this.lastFrameTime = performance.now();
    this.playbackAnchorTime = this.lastFrameTime;
    this.playbackAnchorSongTime = this.currentTime;
    this.audioProcessedTime = this.currentTime - 0.000001;
    this.visualProcessedTime = this.currentTime - 0.000001;

    if (this.onStateChange) this.onStateChange(true, false);

    this._emitVisibleInstruments(this.currentTime, true);

    this._startLoop();
  }

  pause() {
    if (!this.isPlaying) return;
    this.isPlaying = false;
    this.isPaused = true;
    this._cancelLoop();
    this.soundEngine.stopAll();
    this._releaseAllVisuals();

    this._emitVisibleInstruments(this.currentTime, true);

    if (this.onStateChange) this.onStateChange(false, true);
  }

  stop() {
    this.isPlaying = false;
    this.isPaused = false;
    this.currentTime = 0;
    this._cancelLoop();
    this.soundEngine.stopAll();
    if (typeof this.soundEngine.resetMidiChannelState === 'function') {
      this.soundEngine.resetMidiChannelState();
    }
    this._releaseAllVisuals();

    this._emitVisibleInstruments(0, true);

    if (this.onProgress) this.onProgress(0, this.duration, 0);
    if (this.onStateChange) this.onStateChange(false, false);
  }

  seek(targetTime) {
    const clampedTime = Math.max(0, Math.min(this.duration, targetTime));
    const wasPlaying = this.isPlaying;

    if (wasPlaying) {
      this.pause();
    }

    this.soundEngine.stopAll();
    this._releaseAllVisuals();
    this.currentTime = clampedTime;
    this._syncMidiControllersAt(clampedTime);
    this._emitVisibleInstruments(clampedTime, true);

    const percent = this.duration > 0 ? (this.currentTime / this.duration) * 100 : 0;
    if (this.onProgress) this.onProgress(this.currentTime, this.duration, percent);

    if (wasPlaying) {
      this.play();
    }
  }

  setPlaybackRate(rate) {
    if (this.isPlaying) {
      const now = performance.now();
      this.currentTime = this._getPlaybackTime(now);
      this.playbackAnchorTime = now;
      this.playbackAnchorSongTime = this.currentTime;
      this.audioProcessedTime = this.currentTime;
      this.visualProcessedTime = this.currentTime;
    }
    this.playbackRate = Math.max(0.25, Math.min(3.0, rate));
  }

  setLooping(isLooping) {
    this.isLooping = isLooping;
  }

  _startLoop() {
    this._cancelLoop();
    this._startAudioTimer();

    const loop = (now) => {
      if (!this.isPlaying) return;

      const previousVisualTime = this.visualProcessedTime;
      const nextTime = this._getPlaybackTime(now);
      const visualDelta = nextTime - previousVisualTime;
      this.lastFrameTime = now;
      this.currentTime = nextTime;
      this.visualProcessedTime = nextTime;

      // Visual callbacks stay on animation frames. If the browser suspended
      // rendering, discard stale animations instead of replaying them at once.
      if (visualDelta >= 0 && visualDelta <= MAX_VISUAL_CATCH_UP_SECONDS) {
        this._processEventsWindow(previousVisualTime, this.currentTime, {
          audio: false,
          visual: true
        });
      } else if (visualDelta > MAX_VISUAL_CATCH_UP_SECONDS) {
        this._releaseAllVisuals();
      }
      this._emitVisibleInstruments(this.currentTime);

      // Smooth decay of instrument activity meters for VU meters and Director Camera
      for (const inst in this.instrumentActivity) {
        this.instrumentActivity[inst] *= 0.91;
        if (this.instrumentActivity[inst] < 0.01) this.instrumentActivity[inst] = 0;
      }
      if (this.onActivityUpdate) {
        this.onActivityUpdate(this.instrumentActivity);
      }

      const percent = this.duration > 0 ? (this.currentTime / this.duration) * 100 : 0;
      if (this.onProgress) {
        this.onProgress(this.currentTime, this.duration, percent);
      }

      // Check for song completion
      if (this.currentTime >= this.duration) {
        if (this.isLooping) {
          this.seek(0);
          this.play();
          return;
        } else {
          this.stop();
          return;
        }
      }

      this.rafId = requestAnimationFrame(loop);
    };

    this.lastFrameTime = performance.now();
    this.rafId = requestAnimationFrame(loop);
  }

  _cancelLoop() {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    if (this.audioTimerId) {
      clearInterval(this.audioTimerId);
      this.audioTimerId = null;
    }
  }

  _getPlaybackTime(now = performance.now()) {
    if (!this.isPlaying) return this.currentTime;
    const elapsed = Math.max(0, now - this.playbackAnchorTime) / 1000;
    return Math.min(this.duration, this.playbackAnchorSongTime + elapsed * this.playbackRate);
  }

  _startAudioTimer() {
    const tick = () => {
      if (!this.isPlaying) return;

      const songTime = this._getPlaybackTime();
      const elapsed = songTime - this.audioProcessedTime;

      if (elapsed > MAX_AUDIO_CATCH_UP_SECONDS) {
        // A heavily throttled or sleeping browser must never replay its entire
        // backlog. Reconstruct MIDI controller state and continue from "now".
        this.soundEngine.stopAll();
        this._syncMidiControllersAt(songTime);
        this.audioProcessedTime = songTime;
      } else if (elapsed >= 0) {
        this._processEventsWindow(this.audioProcessedTime, songTime, {
          audio: true,
          visual: false
        });
        this.audioProcessedTime = songTime;
      }

      // Keep transport state accurate while rendering is suspended.
      this.currentTime = songTime;
      if (songTime >= this.duration) {
        if (this.isLooping) {
          this.seek(0);
        } else {
          this.stop();
        }
      }
    };

    tick();
    this.audioTimerId = setInterval(tick, AUDIO_TIMER_INTERVAL_MS);
  }

  _processEventsWindow(startTime, endTime, { audio = true, visual = true } = {}) {
    for (let i = 0; i < this.events.length; i++) {
      const ev = this.events[i];

      // Optimization: events are sorted by time
      // The start of a window is exclusive so adjacent timer ticks cannot
      // trigger the same MIDI event twice.
      if (ev.time <= startTime) continue;
      if (ev.time > endTime) break;

      if (ev.type === 'cc') {
        if (audio) this.soundEngine.applyMidiControlChange(ev.channel, ev.controller, ev.value);
      } else if (ev.type === 'pitchBend') {
        if (audio) this.soundEngine.applyMidiPitchBend(ev.channel, ev.value);
      } else if (ev.type === 'prepare') {
        // A preparatory drumstick motion is deliberately visual-only.
        if (visual && this.onNotePrepare) {
          this.onNotePrepare(
            ev.instrument,
            ev.midi,
            ev.name,
            ev.velocity,
            ev.duration,
            ev.instanceId,
            ev.instanceIndex,
            ev.noteTime ?? ev.time,
            ev.trackIndex
          );
          if (ev.instrument === 'drums' && ev.midi >= 60 && ev.midi <= 64) {
            this.onNotePrepare(
              'congas',
              ev.midi,
              ev.name || 'Congas',
              ev.velocity,
              ev.duration,
              'congas',
              0,
              ev.noteTime ?? ev.time,
              ev.trackIndex
            );
          }
        }
      } else if (ev.type === 'on') {
        // Register real-time activity for MIDIJam Director and HUD VU meters
        if (visual && this.instrumentActivity[ev.instrument] !== undefined) {
          this.instrumentActivity[ev.instrument] = Math.max(
            this.instrumentActivity[ev.instrument],
            ev.velocity
          );
        }

        // Trigger Audio with exact General MIDI Program and Channel routing
        const noteParam = ev.instrument === 'drums' ? ev.midi : ev.name;
        if (audio) {
          this.soundEngine.triggerNoteOn(
            ev.instrument,
            noteParam,
            ev.velocity,
            undefined,
            ev.programNumber,
            ev.channel,
            ev.instanceId
          );
        }
        // Trigger 3D Visuals
        if (visual && this.onNoteOn) {
          const visualPitch = (ev.instrument === 'drums' && (ev.programNumber === 119 || ev.midi === 119))
            ? 'reverseCymbal'
            : ev.midi;
          this.onNoteOn(
            ev.instrument,
            visualPitch,
            ev.name,
            ev.velocity,
            ev.duration,
            ev.instanceId,
            ev.instanceIndex,
            ev.time,
            ev.trackIndex
          );
          if (ev.instrument === 'drums' && ev.midi === 69) {
            if (this.instrumentActivity['cabasa'] !== undefined) {
              this.instrumentActivity['cabasa'] = Math.max(this.instrumentActivity['cabasa'], ev.velocity);
            }
            this.onNoteOn('cabasa', 69, 'Cabasa', ev.velocity, ev.duration, 'cabasa', 0, ev.time, ev.trackIndex);
          }
          if (ev.instrument === 'drums' && ev.midi >= 60 && ev.midi <= 64) {
            if (this.instrumentActivity['congas'] !== undefined) {
              this.instrumentActivity['congas'] = Math.max(this.instrumentActivity['congas'], ev.velocity);
            }
            this.onNoteOn('congas', ev.midi, ev.name || 'Congas', ev.velocity, ev.duration, 'congas', 0, ev.time, ev.trackIndex);
          }
          if (ev.instrument === 'drums' && (ev.midi === 56 || (ev.midi >= 65 && ev.midi <= 68))) {
            if (this.instrumentActivity['timbales'] !== undefined) {
              this.instrumentActivity['timbales'] = Math.max(this.instrumentActivity['timbales'], ev.velocity);
            }
            this.onNoteOn('timbales', ev.midi, ev.name || 'Timbales', ev.velocity, ev.duration, 'timbales', 0, ev.time, ev.trackIndex);
          }
          if (ev.instrument === 'drums' && ev.midi === 54) {
            if (this.instrumentActivity['tambourine'] !== undefined) {
              this.instrumentActivity['tambourine'] = Math.max(this.instrumentActivity['tambourine'], ev.velocity);
            }
            this.onNoteOn('tambourine', 54, 'Tambourine', ev.velocity, ev.duration, 'tambourine', 0, ev.time, ev.trackIndex);
          }
          if (ev.instrument === 'drums' && ev.midi === 70) {
            if (this.instrumentActivity['maracas'] !== undefined) {
              this.instrumentActivity['maracas'] = Math.max(this.instrumentActivity['maracas'], ev.velocity);
            }
            this.onNoteOn('maracas', 70, 'Maracas', ev.velocity, ev.duration, 'maracas', 0, ev.time, ev.trackIndex);
          }
          if (ev.instrument === 'drums' && (ev.midi === 71 || ev.midi === 72)) {
            if (this.instrumentActivity['whistle'] !== undefined) {
              this.instrumentActivity['whistle'] = Math.max(this.instrumentActivity['whistle'], ev.velocity);
            }
            this.onNoteOn('whistle', ev.midi, 'Whistle', ev.velocity, ev.duration, 'whistle', 0, ev.time, ev.trackIndex);
          }
          if (ev.instrument === 'drums' && (ev.midi === 73 || ev.midi === 74)) {
            if (this.instrumentActivity['guiro'] !== undefined) {
              this.instrumentActivity['guiro'] = Math.max(this.instrumentActivity['guiro'], ev.velocity);
            }
            this.onNoteOn('guiro', ev.midi, 'Guiro', ev.velocity, ev.duration, 'guiro', 0, ev.time, ev.trackIndex);
          }
          if (ev.instrument === 'drums' && (ev.midi === 80 || ev.midi === 81)) {
            if (this.instrumentActivity['triangle'] !== undefined) {
              this.instrumentActivity['triangle'] = Math.max(this.instrumentActivity['triangle'], ev.velocity);
            }
            this.onNoteOn('triangle', ev.midi, 'Triangle', ev.velocity, ev.duration, 'triangle', 0, ev.time, ev.trackIndex);
          }
        }
      } else if (ev.type === 'off') {
        // Release Audio
        const noteParamOff = ev.instrument === 'drums' ? ev.midi : ev.name;
        if (audio) {
          this.soundEngine.triggerNoteOff(
            ev.instrument,
            noteParamOff,
            undefined,
            ev.programNumber,
            ev.channel,
            ev.instanceId
          );
        }
        // Release 3D Visuals
        if (visual && this.onNoteOff) {
          const visualPitchOff = (ev.instrument === 'drums' && (ev.programNumber === 119 || ev.midi === 119))
            ? 'reverseCymbal'
            : ev.midi;
          this.onNoteOff(ev.instrument, visualPitchOff, ev.name, false, ev.instanceId, ev.instanceIndex);
          if (ev.instrument === 'drums' && ev.midi === 69) {
            this.onNoteOff('cabasa', 69, 'Cabasa', false, 'cabasa', 0);
          }
          if (ev.instrument === 'drums' && ev.midi >= 60 && ev.midi <= 64) {
            this.onNoteOff('congas', ev.midi, ev.name || 'Congas', false, 'congas', 0);
          }
          if (ev.instrument === 'drums' && (ev.midi === 56 || (ev.midi >= 65 && ev.midi <= 68))) {
            this.onNoteOff('timbales', ev.midi, ev.name || 'Timbales', false, 'timbales', 0);
          }
          if (ev.instrument === 'drums' && ev.midi === 54) {
            this.onNoteOff('tambourine', 54, 'Tambourine', false, 'tambourine', 0);
          }
          if (ev.instrument === 'drums' && ev.midi === 70) {
            this.onNoteOff('maracas', 70, 'Maracas', false, 'maracas', 0);
          }
          if (ev.instrument === 'drums' && (ev.midi === 71 || ev.midi === 72)) {
            this.onNoteOff('whistle', ev.midi, 'Whistle', false, 'whistle', 0);
          }
          if (ev.instrument === 'drums' && (ev.midi === 73 || ev.midi === 74)) {
            this.onNoteOff('guiro', ev.midi, 'Guiro', false, 'guiro', 0);
          }
          if (ev.instrument === 'drums' && (ev.midi === 80 || ev.midi === 81)) {
            this.onNoteOff('triangle', ev.midi, 'Triangle', false, 'triangle', 0);
          }
        }
      }
    }
  }

  /**
   * Reconstructs the stateful MIDI controllers when starting from the middle
   * of a song. Without this, seeking past a CC 7/11 event made the next notes
   * ignore the mix embedded in the MIDI file.
   */
  _syncMidiControllersAt(time) {
    if (!this.soundEngine || typeof this.soundEngine.resetMidiChannelState !== 'function') return;

    this.soundEngine.resetMidiChannelState();
    this.events.forEach(event => {
      if (event.time > time) return;
      if (event.type === 'cc') {
        this.soundEngine.applyMidiControlChange(event.channel, event.controller, event.value);
      } else if (event.type === 'pitchBend') {
        this.soundEngine.applyMidiPitchBend(event.channel, event.value);
      }
    });
  }

  _releaseAllVisuals() {
    if (this.onNoteOff) {
      const allInsts = [
        'piano', 'drums', 'guitar', 'bass', 'doubleBass', 'trumpet', 'frenchHorn', 'sax', 'clarinet', 'violin', 'cello', 'flute', 'xylophone', 'synth', 'cabasa', 'congas', 'timbales',
        'tambourine', 'maracas', 'whistle', 'guiro', 'triangle',
        'acousticGuitar', 'piano_2', 'piano_3', 'piano_4', 'guitar_2', 'guitar_3', 'guitar_4',
        'acousticGuitar_2', 'acousticGuitar_3', 'acousticGuitar_4',
        'bass_2', 'doubleBass_2', 'trumpet_2', 'frenchHorn_2', 'sax_2', 'clarinet_2', 'violin_2', 'cello_2', 'flute_2', 'xylophone_2',
        'synth_2', 'synth_3', 'synth_4', 'cabasa_2'
      ];
      for (let note = 21; note <= 108; note++) {
        allInsts.forEach(inst => this.onNoteOff(inst, note, '', true, inst, 0));
      }
      this.onNoteOff('drums', 0, 'all', true, 'drums', 0);
    }
  }
}
