import * as toneMidi from '@tonejs/midi';
const Midi = toneMidi.Midi || toneMidi.default?.Midi || toneMidi.default || toneMidi;

// Kept separate from audio scheduling: drumstick motion should prepare the
// visual hit before the note, but the sound must remain sample-accurate.
const DRUM_STICK_ANTICIPATION_SECONDS = 0.22;

const DEFAULT_GM_PROGRAMS = {
  piano: 0,
  drums: 0,
  guitar: 27,
  acousticGuitar: 25,
  bass: 33,
  trumpet: 56,
  sax: 66,
  violin: 40,
  cello: 42,
  flute: 73,
  xylophone: 13,
  synth: 80
};

/**
 * Authoritative General MIDI Level 1 (GM1) Program Map (0-127).
 * Replicates MIDIsJam's instrument visualizer routing for standard GM sound banks.
 */
export const GM_PROGRAM_TO_INSTRUMENT = {
  // 0-7: Piano
  0: 'piano', 1: 'piano', 2: 'piano', 3: 'piano', 4: 'piano', 5: 'piano', 6: 'piano', 7: 'piano',
  // 8-15: Chromatic Percussion / Mallets
  8: 'xylophone', 9: 'xylophone', 10: 'xylophone', 11: 'xylophone', 12: 'xylophone', 13: 'xylophone', 14: 'xylophone', 15: 'xylophone',
  // 16-23: Organ & Accordion
  16: 'piano', 17: 'piano', 18: 'piano', 19: 'piano', 20: 'piano', 21: 'piano', 22: 'flute', 23: 'piano',
  // 24-25: Acoustic Guitar
  24: 'acousticGuitar', 25: 'acousticGuitar',
  // 26-31: Electric Guitar
  26: 'guitar', 27: 'guitar', 28: 'guitar', 29: 'guitar', 30: 'guitar', 31: 'guitar',
  // 32-39: Bass
  32: 'bass', 33: 'bass', 34: 'bass', 35: 'bass', 36: 'bass', 37: 'bass', 38: 'bass', 39: 'bass',
  // 40-47: Solo Strings & Timpani
  40: 'violin', 41: 'violin', 42: 'cello', 43: 'violin', 44: 'violin', 45: 'violin', 46: 'violin', 47: 'xylophone',
  // 48-55: Ensemble & Choir & Orchestra Hit
  48: 'violin', 49: 'violin', 50: 'violin', 51: 'violin', 52: 'synth', 53: 'synth', 54: 'synth', 55: 'synth',
  // 56-63: Brass
  56: 'trumpet', 57: 'trumpet', 58: 'trumpet', 59: 'trumpet', 60: 'trumpet', 61: 'trumpet', 62: 'trumpet', 63: 'trumpet',
  // 64-67: Saxophone
  64: 'sax', 65: 'sax', 66: 'sax', 67: 'sax',
  // 68-71: Woodwind Reeds
  68: 'flute', 69: 'flute', 70: 'flute', 71: 'flute',
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
  // 112-119: Percussive & Drums
  112: 'xylophone', 113: 'xylophone', 114: 'xylophone', 115: 'xylophone', 116: 'drums', 117: 'drums', 118: 'drums', 119: 'drums',
  // 120-127: Sound Effects
  120: 'guitar', 121: 'flute', 122: 'synth', 123: 'synth', 124: 'synth', 125: 'synth', 126: 'synth', 127: 'drums'
};

const VALID_3D_INSTRUMENTS = new Set([
  'piano', 'drums', 'bass', 'guitar', 'acousticGuitar',
  'trumpet', 'sax', 'violin', 'cello', 'flute', 'xylophone', 'synth'
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

    // Animation frame / timing
    this.lastFrameTime = 0;
    this.rafId = null;

    // Pre-processed unified note event list
    this.events = [];
    this.activeNoteEvents = new Set();
    this.trackInfos = [];
    this.totalNoteCount = 0;

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

    // Real-time instrument activity (0.0 to 1.0) for MIDIJam HUD meters and Director Cam
    this.instrumentActivity = {
      piano: 0,
      drums: 0,
      guitar: 0,
      acousticGuitar: 0,
      bass: 0,
      trumpet: 0,
      sax: 0,
      violin: 0,
      cello: 0,
      flute: 0,
      xylophone: 0,
      synth: 0
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
        if (detectedInstrument === 'drums') {
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

    // 3. High-Precision Track Name Inspection (Arranger Intent)
    // A. Piano / Keyboard / Organ:
    if (/\b(piano|pno|grand\s*piano|keyboard|teclado|rhodes|wurlitzer|clavinet|clavi|harpsichord|organ[oó]?|hammond|accordion|acorde[oó]n)\b/i.test(trackName)) {
      return 'piano';
    }

    // B. Drums / Percussion:
    if (/\b(drums?|drumkit|bater[ií]a|percussion|perc|timbales|caja|bombo|hi-?hat)\b/i.test(trackName) && !/steel\s*drum/i.test(trackName)) {
      return 'drums';
    }

    // C. Bass:
    if (/\b(bass|bajo|contrabajo|fretless)\b/i.test(trackName) && !/\b(brass|bassoon)\b/i.test(trackName)) {
      return 'bass';
    }

    // D. Acoustic Guitar (requires explicit acoustic indicator alongside guitar, never standalone 'acoustic'):
    if (
      /\b(acoustic\s*guitar|guitarra\s*ac[uú]stica|nylon\s*guitar|steel\s*guitar|spanish\s*guitar|classical\s*guitar|ac[uú]stic[ao]\s*gtr|ac\.?\s*gtr|guitarra\s*espa[ñn]ola)\b/i.test(trackName) ||
      (/\b(guitar|guitarra|gtr)\b/i.test(trackName) && /\b(acoustic|ac[uú]stic[ao]|nylon|steel|cl[aá]sic[ao]|folk|spanish|espa[ñn]ol[ao]?)\b/i.test(trackName))
    ) {
      return 'acousticGuitar';
    }

    // E. Electric Guitar:
    if (/\b(guitar|guitarra|gtr|strat|les\s*paul|telecaster|overdrive|distortion|riff)\b/i.test(trackName)) {
      return 'guitar';
    }

    // F. Saxophone:
    if (/\b(sax|saxo|saxophone|saxof[oó]n|alto\s*sax|tenor\s*sax|soprano\s*sax|baritone\s*sax)\b/i.test(trackName)) {
      return 'sax';
    }

    // G. Trumpet / Brass:
    if (/\b(trumpet|trompeta|brass|horns?|tuba|trombone|tromb[oó]n|cornet|metales)\b/i.test(trackName)) {
      return 'trumpet';
    }

    // H. Cello / Violonchelo:
    if (/\b(cello|violoncello|violonchelo|chelo)\b/i.test(trackName)) {
      return 'cello';
    }

    // I. Violin / Strings Section:
    if (/\b(violin|viol[ií]n|viola|strings?|cuerdas?|fiddle|harp|arpa|orchestra|orquesta)\b/i.test(trackName)) {
      return 'violin';
    }

    // I. Flute / Woodwinds:
    if (/\b(flute|flauta|piccolo|recorder|pan\s*flute|clarinet|clarinete|oboe|bassoon|fagot|whistle|ocarina|woodwinds?)\b/i.test(trackName)) {
      return 'flute';
    }

    // J. Xylophone / Chromatic Mallets:
    if (/\b(xylo(phone)?|xil[oó]fono|marimba|vibra(phone)?|glockenspiel|glock|bells?|campanas?|celesta|dulcimer|chimes?|steel\s*drums?)\b/i.test(trackName)) {
      return 'xylophone';
    }

    // K. Synthesizer:
    if (/\b(synth|sintetizador|synthesizer|lead|pad|saw|square|techno|moog|sequencer)\b/i.test(trackName)) {
      return 'synth';
    }

    // 4. Authoritative General MIDI Level 1 Program Map (0-127)
    const prog = track.instrument && typeof track.instrument.number === 'number' ? track.instrument.number : -1;
    if (prog >= 0 && prog <= 127 && GM_PROGRAM_TO_INSTRUMENT[prog]) {
      return GM_PROGRAM_TO_INSTRUMENT[prog];
    }

    // 5. Tone.js Instrument Family & Name Fallback
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
      return 'bass';
    }
    if (instFamily.includes('strings') || instFamily.includes('orchestral')) {
      return 'violin';
    }
    if (instFamily.includes('brass')) {
      return 'trumpet';
    }
    if (instFamily.includes('reed')) {
      return instName.includes('sax') ? 'sax' : 'flute';
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

    // 6. Default Fallback: General MIDI specification defaults unassigned tracks to Program 0 (Acoustic Grand Piano)
    return 'piano';
  }

  getActiveInstruments() {
    return Array.from(new Set(this.trackInfos.map(t => t.instanceId).filter(Boolean)));
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

    if (this.onStateChange) this.onStateChange(true, false);

    this._startLoop();
  }

  pause() {
    if (!this.isPlaying) return;
    this.isPlaying = false;
    this.isPaused = true;
    this._cancelLoop();
    this.soundEngine.stopAll();
    this._releaseAllVisuals();

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

    const percent = this.duration > 0 ? (this.currentTime / this.duration) * 100 : 0;
    if (this.onProgress) this.onProgress(this.currentTime, this.duration, percent);

    if (wasPlaying) {
      this.play();
    }
  }

  setPlaybackRate(rate) {
    this.playbackRate = Math.max(0.25, Math.min(3.0, rate));
  }

  setLooping(isLooping) {
    this.isLooping = isLooping;
  }

  _startLoop() {
    this._cancelLoop();

    const loop = (now) => {
      if (!this.isPlaying) return;

      const deltaMs = now - this.lastFrameTime;
      this.lastFrameTime = now;

      const deltaSec = (deltaMs / 1000) * this.playbackRate;
      const prevTime = this.currentTime;
      this.currentTime += deltaSec;

      // Trigger events occurring between prevTime and currentTime
      this._processEventsWindow(prevTime, this.currentTime);

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
  }

  _processEventsWindow(startTime, endTime) {
    for (let i = 0; i < this.events.length; i++) {
      const ev = this.events[i];

      // Optimization: events are sorted by time
      if (ev.time < startTime) continue;
      if (ev.time > endTime) break;

      if (ev.type === 'cc') {
        this.soundEngine.applyMidiControlChange(ev.channel, ev.controller, ev.value);
      } else if (ev.type === 'pitchBend') {
        this.soundEngine.applyMidiPitchBend(ev.channel, ev.value);
      } else if (ev.type === 'prepare') {
        // A preparatory drumstick motion is deliberately visual-only.
        if (this.onNotePrepare) {
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
        }
      } else if (ev.type === 'on') {
        // Register real-time activity for MIDIJam Director and HUD VU meters
        if (this.instrumentActivity[ev.instrument] !== undefined) {
          this.instrumentActivity[ev.instrument] = Math.max(
            this.instrumentActivity[ev.instrument],
            ev.velocity
          );
        }

        // Trigger Audio with exact General MIDI Program and Channel routing
        const noteParam = ev.instrument === 'drums' ? ev.midi : ev.name;
        this.soundEngine.triggerNoteOn(
          ev.instrument,
          noteParam,
          ev.velocity,
          undefined,
          ev.programNumber,
          ev.channel,
          ev.instanceId
        );
        // Trigger 3D Visuals
        if (this.onNoteOn) {
          this.onNoteOn(
            ev.instrument,
            ev.midi,
            ev.name,
            ev.velocity,
            ev.duration,
            ev.instanceId,
            ev.instanceIndex,
            ev.time,
            ev.trackIndex
          );
        }
      } else if (ev.type === 'off') {
        // Release Audio
        const noteParamOff = ev.instrument === 'drums' ? ev.midi : ev.name;
        this.soundEngine.triggerNoteOff(
          ev.instrument,
          noteParamOff,
          undefined,
          ev.programNumber,
          ev.channel,
          ev.instanceId
        );
        // Release 3D Visuals
        if (this.onNoteOff) {
          this.onNoteOff(ev.instrument, ev.midi, ev.name, false, ev.instanceId, ev.instanceIndex);
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
        'piano', 'drums', 'guitar', 'bass', 'trumpet', 'sax', 'violin', 'cello', 'flute', 'xylophone', 'synth',
        'acousticGuitar', 'piano_2', 'piano_3', 'piano_4', 'guitar_2', 'guitar_3', 'guitar_4',
        'acousticGuitar_2', 'acousticGuitar_3', 'acousticGuitar_4',
        'bass_2', 'trumpet_2', 'sax_2', 'violin_2', 'cello_2', 'flute_2', 'xylophone_2',
        'synth_2', 'synth_3', 'synth_4'
      ];
      for (let note = 21; note <= 108; note++) {
        allInsts.forEach(inst => this.onNoteOff(inst, note, '', true, inst, 0));
      }
      this.onNoteOff('drums', 0, 'all', true, 'drums', 0);
    }
  }
}
