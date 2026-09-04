/**
 * DemoSongs provides rich, studio-arranged musical pieces
 * designed to highlight realistic multi-instrument playback in 3D.
 */

function noteToMidi(noteName) {
  const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const match = noteName.match(/^([A-G]#?)(-?\d+)$/);
  if (!match) return 60;
  const name = match[1];
  const oct = parseInt(match[2], 10);
  const semitone = notes.indexOf(name);
  return (oct + 1) * 12 + semitone;
}

function midiToNote(midi) {
  const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const oct = Math.floor(midi / 12) - 1;
  const name = notes[midi % 12];
  return `${name}${oct}`;
}

export class DemoSongs {
  static getSongsList() {
    return [
      {
        id: 'abba_winner_takes_it_all',
        name: 'ABBA - The Winner Takes It All',
        genre: 'Pop',
        bpm: 123,
        file: '/midi/abba-the-winner-takes-it-all.mid'
      },
      {
        id: 'roxette_it_must_have_been_love',
        name: 'Roxette - It Must Have Been Love',
        genre: 'Pop Rock',
        bpm: 86,
        file: '/midi/roxette-it-must-have-been-love.mid'
      },
      {
        id: 'rhcp_californication',
        name: 'Red Hot Chili Peppers - Californication',
        genre: 'Alternative Rock',
        bpm: 96,
        file: '/midi/red-hot-chili-peppers-californication.mid'
      },
      {
        id: 'al_stewart_year_of_the_cat',
        name: 'Al Stewart - Year of the Cat',
        genre: 'Soft Rock',
        bpm: 113,
        file: '/midi/al-stewart-year-of-the-cat.mid'
      },
      {
        id: 'cordelia_juan_arenosa',
        name: 'Cordelia - Juan Arenosa (Piano)',
        genre: 'Piano',
        bpm: 170,
        file: '/midi/cordelia-juan-arenosa-piano.mid'
      },
      { id: 'funk_fusion', name: '🎺 Funk & Soul Groove Jam', genre: 'Funk / Jazz', bpm: 114 },
      { id: 'rock_anthem', name: '🎸 Hard Rock Stadium Power', genre: 'Classic Rock', bpm: 128 },
      { id: 'mozart_turca', name: '🎹 Mozart - Rondo Alla Turca (Rock Orquesta)', genre: 'Clásica Fusión', bpm: 125 },
      { id: 'synthwave_80s', name: '🕹️ Retro Synthwave 80s Drive', genre: 'Synthwave', bpm: 120 },
      { id: 'latin_fiesta', name: '💃 Salsa Brava & Mambo Caliente', genre: 'Latino / Salsa', bpm: 118 }
    ];
  }

  static getSongData(songId) {
    switch (songId) {
      case 'rock_anthem':
        return this.createRockAnthem();
      case 'mozart_turca':
        return this.createMozartTurca();
      case 'synthwave_80s':
        return this.createSynthwave();
      case 'latin_fiesta':
        return this.createLatinFiesta();
      case 'funk_fusion':
      default:
        return this.createFunkFusion();
    }
  }

  /**
   * 1. FUNK & SOUL GROOVE JAM
   */
  static createFunkFusion() {
    const bpm = 114;
    const beat = 60 / bpm;
    const totalBars = 8;
    const totalDuration = totalBars * 4 * beat;

    const tracks = [
      { name: 'Batería Acústica Studio', instrument: 'drums', channel: 9, notes: [] },
      { name: 'Bajo Slap Fender', instrument: 'bass', channel: 1, notes: [] },
      { name: 'Guitarra Rítmica Funky', instrument: 'guitar', channel: 2, notes: [] },
      { name: 'Guitarra Solista Wah', instrument: 'guitar', channel: 4, notes: [] },
      { name: 'Piano Rhodes & Acústico', instrument: 'piano', channel: 0, notes: [] },
      { name: 'Trompeta Solista', instrument: 'trumpet', channel: 3, notes: [] }
    ];

    const [drums, bass, guitar, guitar2, piano, trumpet] = tracks.map(t => t.notes);

    for (let bar = 0; bar < totalBars; bar++) {
      const barStart = bar * 4 * beat;

      // DRUMS: Punchy acoustic groove
      // Kick
      drums.push({ time: barStart + 0 * beat, duration: 0.2, midi: 36, name: 'C1', velocity: 0.95 });
      drums.push({ time: barStart + 1.75 * beat, duration: 0.2, midi: 36, name: 'C1', velocity: 0.85 });
      drums.push({ time: barStart + 2.5 * beat, duration: 0.2, midi: 36, name: 'C1', velocity: 0.9 });
      if (bar % 2 === 1) {
        drums.push({ time: barStart + 3.5 * beat, duration: 0.2, midi: 36, name: 'C1', velocity: 0.8 });
      }

      // Snare on 2 and 4
      drums.push({ time: barStart + 1.0 * beat, duration: 0.15, midi: 38, name: 'D1', velocity: 0.95 });
      drums.push({ time: barStart + 3.0 * beat, duration: 0.15, midi: 38, name: 'D1', velocity: 0.95 });

      // Hi-Hats
      for (let s = 0; s < 16; s++) {
        const hhTime = barStart + (s * 0.25) * beat;
        if (s === 6 || s === 14) {
          drums.push({ time: hhTime, duration: 0.25, midi: 46, name: 'A#1', velocity: 0.8 });
        } else {
          drums.push({ time: hhTime, duration: 0.08, midi: 42, name: 'F#1', velocity: s % 2 === 0 ? 0.7 : 0.4 });
        }
      }

      if (bar === 0 || bar === 4) {
        drums.push({ time: barStart, duration: 1.5, midi: 49, name: 'C#2', velocity: 0.85 });
      }

      // BASS: Dm7 -> G7 -> Cmaj7 -> A7
      const progression = [
        ['D2', 'F2', 'G2', 'G#2', 'A2', 'C3'],
        ['G1', 'B1', 'D2', 'F2', 'G2', 'B2'],
        ['C2', 'E2', 'G2', 'B2', 'C3', 'E3'],
        ['A1', 'C#2', 'E2', 'G2', 'A2', 'C#3']
      ];
      const rootNotes = progression[bar % 4];

      bass.push({ time: barStart + 0 * beat, duration: 0.35 * beat, midi: noteToMidi(rootNotes[0]), name: rootNotes[0], velocity: 0.9 });
      bass.push({ time: barStart + 0.75 * beat, duration: 0.25 * beat, midi: noteToMidi(rootNotes[1]), name: rootNotes[1], velocity: 0.75 });
      bass.push({ time: barStart + 1.5 * beat, duration: 0.35 * beat, midi: noteToMidi(rootNotes[2]), name: rootNotes[2], velocity: 0.85 });
      bass.push({ time: barStart + 2.25 * beat, duration: 0.25 * beat, midi: noteToMidi(rootNotes[3]), name: rootNotes[3], velocity: 0.75 });
      bass.push({ time: barStart + 2.75 * beat, duration: 0.25 * beat, midi: noteToMidi(rootNotes[4]), name: rootNotes[4], velocity: 0.8 });
      bass.push({ time: barStart + 3.5 * beat, duration: 0.35 * beat, midi: noteToMidi(rootNotes[5]), name: rootNotes[5], velocity: 0.85 });

      // PIANO: Warm jazz/funk voicing
      const pianoChords = bar % 4 === 0 ? ['F4', 'A4', 'C5', 'E5'] :
                          bar % 4 === 1 ? ['F4', 'A4', 'B4', 'E5'] :
                          bar % 4 === 2 ? ['E4', 'G4', 'B4', 'D5'] :
                                          ['E4', 'G4', 'A4', 'C#5'];

      [0.5, 1.25, 2.0, 3.25].forEach((ht, idx) => {
        pianoChords.forEach(pNote => {
          piano.push({
            time: barStart + ht * beat,
            duration: 0.45 * beat,
            midi: noteToMidi(pNote),
            name: pNote,
            velocity: idx % 2 === 0 ? 0.8 : 0.65
          });
        });
      });

      // GUITAR: Funky rhythmic chops
      const gtrChords = bar % 4 === 0 ? ['D4', 'F4', 'A4', 'C5'] :
                        bar % 4 === 1 ? ['D4', 'F4', 'G4', 'B4'] :
                        bar % 4 === 2 ? ['C4', 'E4', 'G4', 'B4'] :
                                        ['C#4', 'E4', 'G4', 'A4'];

      [0.25, 0.75, 1.75, 2.25, 2.75, 3.75].forEach(gOff => {
        gtrChords.forEach(gNote => {
          guitar.push({
            time: barStart + gOff * beat,
            duration: 0.18 * beat,
            midi: noteToMidi(gNote),
            name: gNote,
            velocity: 0.75
          });
        });
      });

      // GUITAR 2: Funk Lead Riffs & Wah Fills
      const funkFills = [
        [{ n: 'D5', t: 0.5, d: 0.35 }, { n: 'F5', t: 1.0, d: 0.35 }, { n: 'G5', t: 1.5, d: 0.5 }, { n: 'A5', t: 2.5, d: 0.8 }],
        [{ n: 'C6', t: 0.5, d: 0.4 }, { n: 'A5', t: 1.25, d: 0.4 }, { n: 'G5', t: 2.0, d: 0.5 }, { n: 'D5', t: 3.0, d: 0.6 }],
        [{ n: 'F5', t: 0.5, d: 0.35 }, { n: 'G5', t: 1.0, d: 0.4 }, { n: 'D5', t: 1.5, d: 0.4 }, { n: 'C5', t: 2.25, d: 0.7 }],
        [{ n: 'A5', t: 0.5, d: 0.4 }, { n: 'C6', t: 1.25, d: 0.5 }, { n: 'D6', t: 2.0, d: 1.2 }]
      ];
      const fMel = funkFills[bar % funkFills.length];
      fMel.forEach(m => {
        guitar2.push({
          time: barStart + m.t * beat,
          duration: m.d * beat,
          midi: noteToMidi(m.n),
          name: m.n,
          velocity: 0.88
        });
      });

      // TRUMPET: Expressive horn melody
      if (bar >= 1) {
        const melodies = [
          [{ n: 'A5', t: 0.5, d: 0.7 }, { n: 'G5', t: 1.5, d: 0.4 }, { n: 'F5', t: 2.0, d: 0.5 }, { n: 'D5', t: 2.75, d: 0.9 }],
          [{ n: 'E5', t: 0.5, d: 0.5 }, { n: 'G5', t: 1.25, d: 0.5 }, { n: 'B5', t: 2.0, d: 0.7 }, { n: 'A5', t: 3.0, d: 0.8 }],
          [{ n: 'C6', t: 0.25, d: 0.5 }, { n: 'B5', t: 1.0, d: 0.4 }, { n: 'G5', t: 1.5, d: 0.4 }, { n: 'E5', t: 2.25, d: 1.1 }],
          [{ n: 'A5', t: 0.5, d: 0.5 }, { n: 'C6', t: 1.25, d: 0.4 }, { n: 'D6', t: 2.0, d: 1.5 }]
        ];
        const mel = melodies[(bar - 1) % melodies.length];
        mel.forEach(m => {
          trumpet.push({
            time: barStart + m.t * beat,
            duration: m.d * beat,
            midi: noteToMidi(m.n),
            name: m.n,
            velocity: 0.88
          });
        });
      }
    }

    return this._formatMidiStructure('🎺 Funk & Soul Groove Jam', bpm, totalDuration, tracks);
  }

  /**
   * 2. MOZART - RONDO ALLA TURCA (ROCK ORQUESTA FUSIÓN)
   */
  static createMozartTurca() {
    const bpm = 125;
    const beat = 60 / bpm;
    const totalBars = 8;
    const totalDuration = totalBars * 4 * beat;

    const tracks = [
      { name: 'Batería Rock & Percusión', instrument: 'drums', channel: 9, notes: [] },
      { name: 'Bajo Eléctrico Virtuoso', instrument: 'bass', channel: 1, notes: [] },
      { name: 'Piano de Cola Steinway', instrument: 'piano', channel: 0, notes: [] },
      { name: 'Guitarra Eléctrica Neo-Clásica', instrument: 'guitar', channel: 2, notes: [] },
      { name: 'Trompeta Real', instrument: 'trumpet', channel: 3, notes: [] }
    ];

    const [drums, bass, piano, guitar, trumpet] = tracks.map(t => t.notes);

    // Famous Alla Turca Theme notes: (B-A-G#-A-C)
    const phraseA = [
      { n: 'B4', t: 0 }, { n: 'A4', t: 0.25 }, { n: 'G#4', t: 0.5 }, { n: 'A4', t: 0.75 },
      { n: 'C5', t: 1.0, d: 0.8 },
      { n: 'D5', t: 2.0 }, { n: 'C5', t: 2.25 }, { n: 'B4', t: 2.5 }, { n: 'C5', t: 2.75 },
      { n: 'E5', t: 3.0, d: 0.8 }
    ];

    const phraseB = [
      { n: 'F5', t: 0 }, { n: 'E5', t: 0.25 }, { n: 'D#5', t: 0.5 }, { n: 'E5', t: 0.75 },
      { n: 'B5', t: 1.0 }, { n: 'A5', t: 1.25 }, { n: 'G#5', t: 1.5 }, { n: 'A5', t: 1.75 },
      { n: 'B5', t: 2.0 }, { n: 'A5', t: 2.25 }, { n: 'G#5', t: 2.5 }, { n: 'A5', t: 2.75 },
      { n: 'C6', t: 3.0, d: 0.8 }
    ];

    for (let bar = 0; bar < totalBars; bar++) {
      const barStart = bar * 4 * beat;

      // Drums
      drums.push({ time: barStart + 0 * beat, duration: 0.2, midi: 36, name: 'C1', velocity: 0.95 });
      drums.push({ time: barStart + 2.0 * beat, duration: 0.2, midi: 36, name: 'C1', velocity: 0.9 });
      drums.push({ time: barStart + 1.0 * beat, duration: 0.15, midi: 38, name: 'D1', velocity: 0.95 });
      drums.push({ time: barStart + 3.0 * beat, duration: 0.15, midi: 38, name: 'D1', velocity: 0.95 });

      for (let h = 0; h < 8; h++) {
        drums.push({ time: barStart + (h * 0.5) * beat, duration: 0.1, midi: 42, name: 'F#1', velocity: 0.7 });
      }

      if (bar === 0 || bar === 4) {
        drums.push({ time: barStart, duration: 1.5, midi: 49, name: 'C#2', velocity: 0.9 });
      }

      // Bass: Driving classical progression in Am
      const root = bar % 2 === 0 ? 'A2' : 'E2';
      for (let b = 0; b < 4; b++) {
        bass.push({
          time: barStart + b * beat,
          duration: 0.7 * beat,
          midi: noteToMidi(root),
          name: root,
          velocity: 0.88
        });
      }

      // Piano: Alla Turca Theme
      const melody = bar % 2 === 0 ? phraseA : phraseB;
      melody.forEach(m => {
        piano.push({
          time: barStart + m.t * beat,
          duration: (m.d || 0.22) * beat,
          midi: noteToMidi(m.n),
          name: m.n,
          velocity: 0.88
        });
      });

      // Guitar: Harmony doubling
      melody.forEach(m => {
        guitar.push({
          time: barStart + m.t * beat,
          duration: (m.d || 0.22) * beat,
          midi: noteToMidi(m.n) - 12,
          name: midiToNote(noteToMidi(m.n) - 12),
          velocity: 0.78
        });
      });

      // Trumpet: Fanfare accents
      if (bar % 2 === 1) {
        trumpet.push({ time: barStart + 1.0 * beat, duration: 0.4 * beat, midi: noteToMidi('E5'), name: 'E5', velocity: 0.9 });
        trumpet.push({ time: barStart + 3.0 * beat, duration: 0.8 * beat, midi: noteToMidi('A5'), name: 'A5', velocity: 0.95 });
      }
    }

    return this._formatMidiStructure('🎹 Mozart - Rondo Alla Turca (Rock Orquesta)', bpm, totalDuration, tracks);
  }

  /**
   * 3. HARD ROCK STADIUM POWER
   */
  static createRockAnthem() {
    const bpm = 128;
    const beat = 60 / bpm;
    const totalBars = 8;
    const totalDuration = totalBars * 4 * beat;

    const tracks = [
      { name: 'Batería Heavy Rock', instrument: 'drums', channel: 9, notes: [] },
      { name: 'Bajo Rock Pesado', instrument: 'bass', channel: 1, notes: [] },
      { name: 'Guitarra Rítmica (Rhythm)', instrument: 'guitar', channel: 2, notes: [] },
      { name: 'Guitarra Solista (Lead)', instrument: 'guitar', channel: 4, notes: [] },
      { name: 'Piano & Órgano', instrument: 'piano', channel: 0, notes: [] },
      { name: 'Metales & Horns', instrument: 'trumpet', channel: 3, notes: [] }
    ];

    const [drums, bass, guitar, guitar2, piano, trumpet] = tracks.map(t => t.notes);

    for (let bar = 0; bar < totalBars; bar++) {
      const barStart = bar * 4 * beat;

      drums.push({ time: barStart + 0 * beat, duration: 0.2, midi: 36, name: 'C1', velocity: 1.0 });
      drums.push({ time: barStart + 1.5 * beat, duration: 0.2, midi: 36, name: 'C1', velocity: 0.9 });
      drums.push({ time: barStart + 2.0 * beat, duration: 0.2, midi: 36, name: 'C1', velocity: 0.95 });

      if (bar === 3 || bar === 7) {
        drums.push({ time: barStart + 3.0 * beat, duration: 0.15, midi: 48, name: 'C3', velocity: 0.9 });
        drums.push({ time: barStart + 3.25 * beat, duration: 0.15, midi: 45, name: 'A2', velocity: 0.9 });
        drums.push({ time: barStart + 3.5 * beat, duration: 0.15, midi: 41, name: 'F2', velocity: 0.95 });
        drums.push({ time: barStart + 3.75 * beat, duration: 0.15, midi: 41, name: 'F2', velocity: 1.0 });
      } else {
        drums.push({ time: barStart + 1.0 * beat, duration: 0.2, midi: 38, name: 'D1', velocity: 1.0 });
        drums.push({ time: barStart + 3.0 * beat, duration: 0.2, midi: 38, name: 'D1', velocity: 1.0 });
      }

      drums.push({ time: barStart + 0 * beat, duration: 1.0, midi: 49, name: 'C#2', velocity: 0.85 });
      for (let e = 1; e < 8; e++) {
        drums.push({ time: barStart + (e * 0.5) * beat, duration: 0.3, midi: 51, name: 'D#2', velocity: 0.7 });
      }

      // Bass 8th notes (E - G - A - C)
      const roots = bar % 4 === 0 ? 'E2' : bar % 4 === 1 ? 'G2' : bar % 4 === 2 ? 'A2' : 'C2';
      for (let i = 0; i < 8; i++) {
        bass.push({
          time: barStart + (i * 0.5) * beat,
          duration: 0.45 * beat,
          midi: noteToMidi(roots),
          name: roots,
          velocity: 0.95
        });
      }

      // Guitar Power Chords (E5, G5, A5, C5)
      const powerChordNotes = bar % 4 === 0 ? ['E3', 'B3', 'E4'] :
                              bar % 4 === 1 ? ['G3', 'D4', 'G4'] :
                              bar % 4 === 2 ? ['A3', 'E4', 'A4'] :
                                              ['C3', 'G3', 'C4'];

      [0, 0.75, 1.5, 2.25, 3.0].forEach(pOff => {
        powerChordNotes.forEach(pNote => {
          guitar.push({
            time: barStart + pOff * beat,
            duration: 0.6 * beat,
            midi: noteToMidi(pNote),
            name: pNote,
            velocity: 0.95
          });
        });
      });

      // Guitar 2 Lead Solo Riffs (Dual Guitar Harmonized Rock Solo)
      const soloNotes = [
        [{ n: 'E5', t: 0.5, d: 0.4 }, { n: 'G5', t: 1.0, d: 0.4 }, { n: 'A5', t: 1.5, d: 0.8 }, { n: 'B5', t: 2.5, d: 1.2 }],
        [{ n: 'D6', t: 0.5, d: 0.5 }, { n: 'B5', t: 1.25, d: 0.4 }, { n: 'A5', t: 1.75, d: 0.5 }, { n: 'G5', t: 2.5, d: 1.0 }],
        [{ n: 'E5', t: 0.25, d: 0.4 }, { n: 'G5', t: 0.75, d: 0.4 }, { n: 'A5', t: 1.25, d: 0.6 }, { n: 'E6', t: 2.0, d: 1.5 }],
        [{ n: 'G6', t: 0.5, d: 0.6 }, { n: 'E6', t: 1.25, d: 0.4 }, { n: 'D6', t: 1.75, d: 0.5 }, { n: 'B5', t: 2.5, d: 1.2 }]
      ];
      const sMel = soloNotes[bar % soloNotes.length];
      sMel.forEach(m => {
        guitar2.push({
          time: barStart + m.t * beat,
          duration: m.d * beat,
          midi: noteToMidi(m.n),
          name: m.n,
          velocity: 0.98
        });
      });

      // Piano Chords
      powerChordNotes.forEach(pNote => {
        piano.push({
          time: barStart,
          duration: 1.8 * beat,
          midi: noteToMidi(pNote) + 12,
          name: midiToNote(noteToMidi(pNote) + 12),
          velocity: 0.8
        });
        piano.push({
          time: barStart + 2.0 * beat,
          duration: 1.8 * beat,
          midi: noteToMidi(pNote) + 12,
          name: midiToNote(noteToMidi(pNote) + 12),
          velocity: 0.8
        });
      });

      // Trumpet Stabs
      ['B4', 'E5'].forEach(bNote => {
        trumpet.push({
          time: barStart + 1.5 * beat,
          duration: 0.3 * beat,
          midi: noteToMidi(bNote),
          name: bNote,
          velocity: 0.88
        });
        trumpet.push({
          time: barStart + 3.5 * beat,
          duration: 0.4 * beat,
          midi: noteToMidi(bNote),
          name: bNote,
          velocity: 0.92
        });
      });
    }

    return this._formatMidiStructure('🎸 Hard Rock Stadium Power', bpm, totalDuration, tracks);
  }

  /**
   * 4. RETRO SYNTHWAVE 80s DRIVE
   */
  static createSynthwave() {
    const bpm = 120;
    const beat = 60 / bpm;
    const totalBars = 8;
    const totalDuration = totalBars * 4 * beat;

    const tracks = [
      { name: 'Batería Electrónica 80s', instrument: 'drums', channel: 9, notes: [] },
      { name: 'Bajo Arpegiado Synth', instrument: 'bass', channel: 1, notes: [] },
      { name: 'Piano & Pads Synth', instrument: 'piano', channel: 0, notes: [] },
      { name: 'Guitarra Synth Lead', instrument: 'guitar', channel: 2, notes: [] },
      { name: 'Metales Synthwave', instrument: 'trumpet', channel: 3, notes: [] }
    ];

    const [drums, bass, piano, guitar, trumpet] = tracks.map(t => t.notes);

    for (let bar = 0; bar < totalBars; bar++) {
      const barStart = bar * 4 * beat;

      for (let b = 0; b < 4; b++) {
        drums.push({ time: barStart + b * beat, duration: 0.2, midi: 36, name: 'C1', velocity: 0.95 });
        if (b === 1 || b === 3) {
          drums.push({ time: barStart + b * beat, duration: 0.25, midi: 38, name: 'D1', velocity: 0.95 });
        }
      }
      for (let off = 0; off < 4; off++) {
        drums.push({ time: barStart + (off + 0.5) * beat, duration: 0.15, midi: 46, name: 'A#1', velocity: 0.75 });
      }

      // Rolling 16ths Bass
      const baseMidi = bar % 4 === 0 ? 33 : bar % 4 === 1 ? 29 : bar % 4 === 2 ? 36 : 31;
      for (let s = 0; s < 16; s++) {
        const octaveShift = s % 2 === 0 ? 0 : 12;
        const midiVal = baseMidi + octaveShift;
        bass.push({
          time: barStart + (s * 0.25) * beat,
          duration: 0.2 * beat,
          midi: midiVal,
          name: midiToNote(midiVal),
          velocity: s % 4 === 0 ? 0.9 : 0.7
        });
      }

      // Piano chords
      const padChords = bar % 4 === 0 ? ['A3', 'C4', 'E4', 'G4'] :
                        bar % 4 === 1 ? ['F3', 'A3', 'C4', 'E4'] :
                        bar % 4 === 2 ? ['C3', 'E3', 'G3', 'B3'] :
                                        ['G3', 'B3', 'D4', 'F4'];
      padChords.forEach(pNote => {
        piano.push({
          time: barStart,
          duration: 3.8 * beat,
          midi: noteToMidi(pNote),
          name: pNote,
          velocity: 0.75
        });
      });

      // Lead Melody
      const leadMelody = bar % 2 === 0 ?
        [{ n: 'E5', t: 0, d: 1.0 }, { n: 'G5', t: 1.0, d: 0.5 }, { n: 'A5', t: 1.5, d: 1.0 }, { n: 'B5', t: 3.0, d: 1.0 }] :
        [{ n: 'C6', t: 0, d: 0.75 }, { n: 'B5', t: 1.0, d: 0.5 }, { n: 'G5', t: 1.5, d: 0.75 }, { n: 'E5', t: 2.5, d: 1.5 }];

      leadMelody.forEach(lm => {
        guitar.push({
          time: barStart + lm.t * beat,
          duration: lm.d * beat,
          midi: noteToMidi(lm.n),
          name: lm.n,
          velocity: 0.88
        });
        trumpet.push({
          time: barStart + lm.t * beat,
          duration: lm.d * beat,
          midi: noteToMidi(lm.n) - 12,
          name: midiToNote(noteToMidi(lm.n) - 12),
          velocity: 0.8
        });
      });
    }

    return this._formatMidiStructure('🕹️ Retro Synthwave 80s Drive', bpm, totalDuration, tracks);
  }

  /**
   * 5. SALSA BRAVA & MAMBO CALIENTE
   */
  static createLatinFiesta() {
    const bpm = 118;
    const beat = 60 / bpm;
    const totalBars = 8;
    const totalDuration = totalBars * 4 * beat;

    const tracks = [
      { name: 'Percusión Latina / Timbales', instrument: 'drums', channel: 9, notes: [] },
      { name: 'Bajo Baby Bass', instrument: 'bass', channel: 1, notes: [] },
      { name: 'Piano Montuno', instrument: 'piano', channel: 0, notes: [] },
      { name: 'Guitarra Tres / Acústica', instrument: 'guitar', channel: 2, notes: [] },
      { name: 'Trompeta Mambo Caliente', instrument: 'trumpet', channel: 3, notes: [] }
    ];

    const [drums, bass, piano, guitar, trumpet] = tracks.map(t => t.notes);

    for (let bar = 0; bar < totalBars; bar++) {
      const barStart = bar * 4 * beat;

      const claveHits = bar % 2 === 0 ? [1.0, 2.5] : [0, 1.5, 3.0];
      claveHits.forEach(ch => {
        drums.push({ time: barStart + ch * beat, duration: 0.15, midi: 38, name: 'D1', velocity: 0.9 });
      });

      drums.push({ time: barStart + 1.5 * beat, duration: 0.2, midi: 36, name: 'C1', velocity: 0.85 });
      drums.push({ time: barStart + 3.5 * beat, duration: 0.2, midi: 36, name: 'C1', velocity: 0.9 });

      for (let h = 0; h < 8; h++) {
        drums.push({ time: barStart + (h * 0.5) * beat, duration: 0.1, midi: 42, name: 'F#1', velocity: 0.7 });
      }

      // Mambo Campana / Cowbell & Timbales Cáscara (MIDI 56, 65, 66)
      const bellPattern = [0, 1.0, 1.75, 2.0, 3.0, 3.5];
      bellPattern.forEach(bp => {
        drums.push({ time: barStart + bp * beat, duration: 0.15, midi: 56, name: 'Cowbell', velocity: 0.88 });
      });

      // Timbales accents and fills
      if (bar % 2 === 1) {
        drums.push({ time: barStart + 3.0 * beat, duration: 0.12, midi: 65, name: 'High Timbale', velocity: 0.92 });
        drums.push({ time: barStart + 3.5 * beat, duration: 0.12, midi: 66, name: 'Low Timbale', velocity: 0.95 });
      }

      // Maracas (70) & Cabasa (69) latin shaker groove
      [0.5, 1.5, 2.5, 3.5].forEach(t => {
        drums.push({ time: barStart + t * beat, duration: 0.1, midi: 70, name: 'Maracas', velocity: 0.78 });
      });
      [0.0, 2.0].forEach(t => {
        drums.push({ time: barStart + t * beat, duration: 0.12, midi: 69, name: 'Cabasa', velocity: 0.8 });
      });

      // Guiro (73 Short, 74 Long) scraping rhythm
      [0.0, 1.0, 2.0, 3.0].forEach(t => {
        drums.push({ time: barStart + t * beat, duration: 0.2, midi: 74, name: 'Long Guiro', velocity: 0.82 });
        drums.push({ time: barStart + (t + 0.75) * beat, duration: 0.1, midi: 73, name: 'Short Guiro', velocity: 0.76 });
      });

      // Tambourine (54) backbeat accents
      [1.0, 3.0].forEach(t => {
        drums.push({ time: barStart + t * beat, duration: 0.12, midi: 54, name: 'Tambourine', velocity: 0.84 });
      });

      // Triangle (80 Muted, 81 Open)
      drums.push({ time: barStart + 0.0 * beat, duration: 0.25, midi: 81, name: 'Open Triangle', velocity: 0.8 });
      drums.push({ time: barStart + 2.0 * beat, duration: 0.15, midi: 80, name: 'Muted Triangle', velocity: 0.75 });

      // Samba Whistle (71 Short, 72 Long) call and breaks
      if (bar === 0 || bar === 4) {
        drums.push({ time: barStart + 0.0 * beat, duration: 0.15, midi: 71, name: 'Short Whistle', velocity: 0.95 });
        drums.push({ time: barStart + 0.5 * beat, duration: 0.15, midi: 71, name: 'Short Whistle', velocity: 0.95 });
        drums.push({ time: barStart + 1.0 * beat, duration: 0.35, midi: 72, name: 'Long Whistle', velocity: 1.0 });
      } else if (bar === 7) {
        drums.push({ time: barStart + 3.0 * beat, duration: 0.12, midi: 71, name: 'Short Whistle', velocity: 0.95 });
        drums.push({ time: barStart + 3.5 * beat, duration: 0.25, midi: 72, name: 'Long Whistle', velocity: 1.0 });
      }

      // Bass Tumbao
      const root = bar % 4 === 0 ? 'G2' : bar % 4 === 1 ? 'C3' : bar % 4 === 2 ? 'D3' : 'G2';
      bass.push({ time: barStart + 1.5 * beat, duration: 0.4 * beat, midi: noteToMidi(root), name: root, velocity: 0.9 });
      bass.push({ time: barStart + 3.0 * beat, duration: 0.8 * beat, midi: noteToMidi(root), name: root, velocity: 0.95 });

      // Piano Montuno
      const montuno = bar % 2 === 0 ?
        ['G4', 'B4', 'D5', 'G5', 'D5', 'B4', 'G4', 'B4'] :
        ['C4', 'E4', 'G4', 'C5', 'G4', 'E4', 'C4', 'E4'];

      montuno.forEach((mn, idx) => {
        piano.push({
          time: barStart + (idx * 0.5) * beat,
          duration: 0.35 * beat,
          midi: noteToMidi(mn),
          name: mn,
          velocity: 0.85
        });
        guitar.push({
          time: barStart + (idx * 0.5) * beat,
          duration: 0.3 * beat,
          midi: noteToMidi(mn) - 12,
          name: midiToNote(noteToMidi(mn) - 12),
          velocity: 0.75
        });
      });

      // Trumpet Mambo
      const mamboNotes = [
        { n: 'D5', t: 0.5, d: 0.3 }, { n: 'G5', t: 1.0, d: 0.4 }, { n: 'B5', t: 1.5, d: 0.6 },
        { n: 'A5', t: 2.5, d: 0.4 }, { n: 'G5', t: 3.0, d: 0.9 }
      ];
      mamboNotes.forEach(mb => {
        trumpet.push({
          time: barStart + mb.t * beat,
          duration: mb.d * beat,
          midi: noteToMidi(mb.n),
          name: mb.n,
          velocity: 0.92
        });
      });
    }

    return this._formatMidiStructure('💃 Salsa Brava & Mambo Caliente', bpm, totalDuration, tracks);
  }

  static _formatMidiStructure(name, bpm, duration, tracks) {
    return {
      name: name,
      bpm: bpm,
      header: {
        tempos: [{ bpm: bpm }],
        timeSignatures: [{ timeSignature: [4, 4] }]
      },
      duration: duration,
      tracks: tracks
    };
  }
}
