import { Midi } from '@tonejs/midi';

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

    // Callbacks
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
      bass: 0,
      trumpet: 0,
      sax: 0,
      violin: 0,
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
          totalNotes: this.events.length / 2,
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
        channel: track.channel,
        instrument: detectedInstrument,
        instanceIndex: instanceIndex,
        instanceId: instanceId,
        noteCount: track.notes.length,
        programNumber: track.instrument ? track.instrument.number : -1
      };
      this.trackInfos.push(trackInfo);

      track.notes.forEach(note => {
        totalNoteCount++;
        // Note ON event
        this.events.push({
          type: 'on',
          time: note.time,
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
        });

        // Note OFF event
        this.events.push({
          type: 'off',
          time: note.time + note.duration,
          duration: note.duration,
          midi: note.midi,
          name: note.name,
          velocity: 0,
          trackIndex: index,
          instrument: detectedInstrument,
          instanceId: instanceId,
          instanceIndex: instanceIndex,
          programNumber: trackInfo.programNumber,
          channel: trackInfo.channel !== undefined ? trackInfo.channel : (detectedInstrument === 'drums' ? 9 : 0)
        });
      });
    });

    // Sort all events by time for fast sequential cursor processing
    this.events.sort((a, b) => a.time - b.time);

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
    const trackName = (track.name || '').toLowerCase();
    const instFamily = (track.instrument?.family || '').toLowerCase();
    const instName = (track.instrument?.name || '').toLowerCase();
    const prog = track.instrument ? track.instrument.number : -1;
    const channel = track.channel;

    // 1. Drums / Percussion (Channel 10 or Percussive GM)
    if (
      channel === 9 || channel === 10 ||
      trackName.includes('drum') || trackName.includes('bater') || trackName.includes('perc') ||
      trackName.includes('kit') || trackName.includes('beat') || instFamily.includes('percussive') ||
      instFamily.includes('drums') || (prog >= 112 && prog <= 127)
    ) {
      return 'drums';
    }

    // 2. Bass (Prog 32-39)
    if (
      trackName.includes('bass') || trackName.includes('bajo') ||
      (prog >= 32 && prog <= 39) || instFamily.includes('bass')
    ) {
      return 'bass';
    }

    // 3. Saxophone (Prog 64-67)
    if (
      trackName.includes('sax') || trackName.includes('saxo') ||
      (prog >= 64 && prog <= 67)
    ) {
      return 'sax';
    }

    // 4. Trumpet / Brass / Horns (Prog 56-63)
    if (
      trackName.includes('trumpet') || trackName.includes('tromp') || trackName.includes('brass') ||
      trackName.includes('horn') || trackName.includes('tuba') || trackName.includes('trombone') ||
      (prog >= 56 && prog <= 63) || instFamily.includes('brass')
    ) {
      return 'trumpet';
    }

    // 5. Violin / Strings Section (Prog 40-51, 110)
    if (
      trackName.includes('viol') || trackName.includes('cello') || trackName.includes('string') ||
      trackName.includes('cuerda') || trackName.includes('fiddle') || trackName.includes('harp') ||
      trackName.includes('arpa') || (prog >= 40 && prog <= 51) || prog === 110 ||
      instFamily.includes('strings')
    ) {
      return 'violin';
    }

    // 6. Flute / Woodwinds (Prog 68-79)
    if (
      trackName.includes('flut') || trackName.includes('flaut') || trackName.includes('recorder') ||
      trackName.includes('whistle') || trackName.includes('clarin') || trackName.includes('oboe') ||
      trackName.includes('bassoon') || trackName.includes('ocarina') || trackName.includes('wind') ||
      (prog >= 68 && prog <= 79) || instFamily.includes('woodwind')
    ) {
      return 'flute';
    }

    // 7. Xylophone / Chromatic Mallets (Prog 8-15)
    if (
      trackName.includes('xylo') || trackName.includes('marimb') || trackName.includes('vibra') ||
      trackName.includes('glock') || trackName.includes('bell') || trackName.includes('campan') ||
      trackName.includes('celesta') || trackName.includes('dulcimer') ||
      (prog >= 8 && prog <= 15)
    ) {
      return 'xylophone';
    }

    // 8. Guitar (Prog 24-31)
    if (
      trackName.includes('guitar') || trackName.includes('gtr') || trackName.includes('pluk') ||
      (prog >= 24 && prog <= 31) || instFamily.includes('guitar')
    ) {
      return 'guitar';
    }

    // 9. Synthesizer / Electro Leads & Pads (Prog 80-103)
    if (
      trackName.includes('synth') || trackName.includes('lead') || trackName.includes('pad') ||
      trackName.includes('saw') || trackName.includes('square') || trackName.includes('techno') ||
      trackName.includes('electro') || (prog >= 80 && prog <= 103) || instFamily.includes('synth')
    ) {
      return 'synth';
    }

    // 10. Piano / Keyboards / Organs (Prog 0-7, 16-23)
    if (
      trackName.includes('piano') || trackName.includes('key') || trackName.includes('organ') ||
      trackName.includes('clav') || (prog >= 0 && prog <= 7) || (prog >= 16 && prog <= 23) ||
      instFamily.includes('piano') || instFamily.includes('organ')
    ) {
      return 'piano';
    }

    // Fallback default: In General MIDI standard, unassigned tracks default to acoustic piano
    return 'piano';
  }

  getActiveInstruments() {
    return Array.from(new Set(this.trackInfos.map(t => t.instanceId).filter(Boolean)));
  }

  setTrackInstrument(trackIndex, newInstrument) {
    const trackInfo = this.trackInfos.find(t => t.index === trackIndex);
    if (trackInfo) {
      const defaultPrograms = {
        piano: 0,
        drums: 0,
        guitar: 27,
        bass: 33,
        trumpet: 56,
        sax: 66,
        violin: 40,
        flute: 73,
        xylophone: 13,
        synth: 80
      };
      if (defaultPrograms[newInstrument] !== undefined) {
        trackInfo.programNumber = defaultPrograms[newInstrument];
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

    if (this.currentTime >= this.duration) {
      this.currentTime = 0;
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

      if (ev.type === 'on') {
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
            ev.instanceIndex
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

  _releaseAllVisuals() {
    if (this.onNoteOff) {
      const allInsts = [
        'piano', 'drums', 'guitar', 'bass', 'trumpet', 'sax', 'violin', 'flute', 'xylophone', 'synth',
        'piano_2', 'piano_3', 'piano_4', 'guitar_2', 'guitar_3', 'guitar_4',
        'bass_2', 'trumpet_2', 'sax_2', 'violin_2', 'flute_2', 'xylophone_2',
        'synth_2', 'synth_3', 'synth_4'
      ];
      for (let note = 21; note <= 108; note++) {
        allInsts.forEach(inst => this.onNoteOff(inst, note, '', true, inst, 0));
      }
      this.onNoteOff('drums', 0, 'all', true, 'drums', 0);
    }
  }
}
