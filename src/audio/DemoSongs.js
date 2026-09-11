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
        id: 'ccr_have_you_ever_seen_the_rain',
        name: 'Creedence Clearwater Revival - Have You Ever Seen The Rain',
        genre: 'Classic Rock',
        bpm: 116,
        file: '/midi/creedence-clearwater-revival-have-you-ever-seen-the-rain.kar'
      },
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
      { id: 'latin_fiesta', name: '💃 Salsa Brava & Mambo Caliente', genre: 'Latino / Salsa', bpm: 118 },
      { id: 'tango_fantasy', name: '🪗 Libertango & Celtic Harp Fantasy', genre: 'World / Fusion', bpm: 120 },
      { id: 'bluegrass_banjo', name: '🪕 Bluegrass Banjo Breakdown & Hoedown', genre: 'Country / Bluegrass', bpm: 136 },
      { id: 'zarathustra_timpani', name: '🪘 Strauss - Also sprach Zarathustra (Timpani Solo Fanfare)', genre: 'Sinfónico / Clásica', bpm: 96 },
      { id: 'baroque_recorder', name: '🪈 Vivaldi - Baroque Concerto & Celtic Dance (Flauta Dulce)', genre: 'Barroco / Celta', bpm: 124 }
    ];
  }

  static getSongData(songId) {
    switch (songId) {
      case 'baroque_recorder':
        return this.createBaroqueRecorder();
      case 'zarathustra_timpani':
        return this.createZarathustraTimpani();
      case 'bluegrass_banjo':
        return this.createBluegrassBanjo();
      case 'tango_fantasy':
        return this.createTangoFantasy();
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

      // Hand Claps (39) syncopated mambo claps
      if (bar % 2 === 1) {
        drums.push({ time: barStart + 1.0 * beat, duration: 0.12, midi: 39, name: 'Hand Clap', velocity: 0.88 });
        drums.push({ time: barStart + 2.5 * beat, duration: 0.12, midi: 39, name: 'Hand Clap', velocity: 0.86 });
        drums.push({ time: barStart + 3.0 * beat, duration: 0.12, midi: 39, name: 'Hand Clap', velocity: 0.90 });
      } else {
        drums.push({ time: barStart + 1.0 * beat, duration: 0.12, midi: 39, name: 'Hand Clap', velocity: 0.86 });
        drums.push({ time: barStart + 3.0 * beat, duration: 0.12, midi: 39, name: 'Hand Clap', velocity: 0.88 });
      }

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

  /**
   * 6. LIBERTANGO & CELTIC HARP FANTASY (Showcase for Accordion, Harp & Harmonica)
   */
  static createTangoFantasy() {
    const bpm = 120;
    const beat = 60 / bpm;
    const totalBars = 12;
    const totalDuration = totalBars * 4 * beat;

    const tracks = [
      { name: 'Acordeón de Concierto', instrument: 'accordion', channel: 0, programNumber: 21, notes: [] },
      { name: 'Arpa de Concierto Celta', instrument: 'harp', channel: 1, programNumber: 46, notes: [] },
      { name: 'Armónica Solista', instrument: 'harmonica', channel: 2, programNumber: 22, notes: [] },
      { name: 'Contrabajo Clásico', instrument: 'doubleBass', channel: 3, programNumber: 43, notes: [] },
      { name: 'Batería y Percusión', instrument: 'drums', channel: 9, notes: [] }
    ];

    const [accordion, harp, harmonica, doubleBass, drums] = tracks.map(t => t.notes);

    // Chord progressions in A minor / D minor:
    // Bars 0-3: Am | Bars 4-5: Dm | Bars 6-7: E7 | Bars 8-11: Am - F - E7 - Am
    const progressions = [
      { root: 'A2', chordNotes: ['A3', 'C4', 'E4'], harpArp: ['A2', 'E3', 'A3', 'C4', 'E4', 'A4', 'C5', 'E5'] },
      { root: 'A2', chordNotes: ['A3', 'C4', 'E4'], harpArp: ['C3', 'E3', 'A3', 'C4', 'E4', 'A4', 'C5', 'A4'] },
      { root: 'A2', chordNotes: ['A3', 'C4', 'E4'], harpArp: ['E3', 'A3', 'C4', 'E4', 'A4', 'C5', 'E5', 'C5'] },
      { root: 'A2', chordNotes: ['A3', 'C4', 'E4'], harpArp: ['A3', 'C4', 'E4', 'A4', 'C5', 'E5', 'A5', 'E5'] },
      { root: 'D2', chordNotes: ['D3', 'F3', 'A3'], harpArp: ['D3', 'F3', 'A3', 'D4', 'F4', 'A4', 'D5', 'A4'] },
      { root: 'D2', chordNotes: ['D3', 'F3', 'A3'], harpArp: ['F3', 'A3', 'D4', 'F4', 'A4', 'D5', 'F5', 'D5'] },
      { root: 'E2', chordNotes: ['E3', 'G#3', 'B3'], harpArp: ['E3', 'G#3', 'B3', 'E4', 'G#4', 'B4', 'E5', 'B4'] },
      { root: 'E2', chordNotes: ['E3', 'G#3', 'D4'], harpArp: ['G#3', 'B3', 'D4', 'E4', 'G#4', 'B4', 'D5', 'B4'] },
      { root: 'A2', chordNotes: ['A3', 'C4', 'E4'], harpArp: ['A2', 'C3', 'E3', 'A3', 'C4', 'E4', 'A4', 'E4'] },
      { root: 'F2', chordNotes: ['F3', 'A3', 'C4'], harpArp: ['F2', 'A2', 'C3', 'F3', 'A3', 'C4', 'F4', 'C4'] },
      { root: 'E2', chordNotes: ['E3', 'G#3', 'B3'], harpArp: ['E2', 'G#2', 'B2', 'E3', 'G#3', 'B3', 'E4', 'B3'] },
      { root: 'A2', chordNotes: ['A3', 'C4', 'E4'], harpArp: ['A2', 'E3', 'A3', 'C4', 'E4', 'A4', 'C5', 'A5'] }
    ];

    // Harmonica soulful melody line
    const harmonicaMelody = [
      // Bar 0
      { t: 0.0, d: 1.8, n: 'E5' }, { t: 2.0, d: 1.8, n: 'A5' },
      // Bar 1
      { t: 4.0, d: 0.9, n: 'B5' }, { t: 5.0, d: 0.9, n: 'C6' }, { t: 6.0, d: 1.8, n: 'B5' },
      // Bar 2
      { t: 8.0, d: 0.9, n: 'A5' }, { t: 9.0, d: 0.9, n: 'G#5' }, { t: 10.0, d: 1.8, n: 'A5' },
      // Bar 3
      { t: 12.0, d: 3.5, n: 'E5' },
      // Bar 4 (Dm)
      { t: 16.0, d: 1.8, n: 'F5' }, { t: 18.0, d: 1.8, n: 'A5' },
      // Bar 5
      { t: 20.0, d: 1.8, n: 'D6' }, { t: 22.0, d: 1.8, n: 'C6' },
      // Bar 6 (E7)
      { t: 24.0, d: 1.8, n: 'B5' }, { t: 26.0, d: 1.8, n: 'G#5' },
      // Bar 7
      { t: 28.0, d: 3.6, n: 'E5' },
      // Bar 8-11: Climax
      { t: 32.0, d: 0.8, n: 'A5' }, { t: 33.0, d: 0.8, n: 'B5' }, { t: 34.0, d: 1.6, n: 'C6' },
      { t: 36.0, d: 0.8, n: 'D6' }, { t: 37.0, d: 0.8, n: 'C6' }, { t: 38.0, d: 1.6, n: 'B5' },
      { t: 40.0, d: 1.8, n: 'G#5' }, { t: 42.0, d: 1.8, n: 'B5' },
      { t: 44.0, d: 3.8, n: 'A5' }
    ];

    harmonicaMelody.forEach(hm => {
      harmonica.push({
        time: hm.t * beat,
        duration: hm.d * beat,
        midi: noteToMidi(hm.n),
        name: hm.n,
        velocity: 0.88
      });
    });

    for (let bar = 0; bar < totalBars; bar++) {
      const barStart = bar * 4 * beat;
      const prog = progressions[bar % progressions.length];

      // 1. CONTRABAJO (Tango Habanera Syncopated Bass: 1, and-of-2, 3, 4)
      const bassRhythm = [0.0, 1.5, 2.0, 3.0];
      bassRhythm.forEach((bt, bIdx) => {
        const rootMidi = noteToMidi(prog.root);
        const pitch = bIdx === 2 ? rootMidi + 7 : rootMidi; // 5th on beat 3
        doubleBass.push({
          time: barStart + bt * beat,
          duration: 0.45 * beat,
          midi: pitch,
          name: midiToNote(pitch),
          velocity: 0.85
        });
      });

      // 2. ACORDEÓN (Right hand tango syncopated stabs + left hand chords)
      // Beats 0.5, 1.5, 2.5, 3.5
      [0.5, 1.5, 2.5, 3.5].forEach(bt => {
        prog.chordNotes.forEach(cn => {
          const m = noteToMidi(cn);
          accordion.push({
            time: barStart + bt * beat,
            duration: 0.35 * beat,
            midi: m,
            name: cn,
            velocity: 0.82
          });
        });
      });

      // 3. ARPA (Fluid 8-note sweeping arpeggio across the entire bar)
      prog.harpArp.forEach((hn, hIdx) => {
        const hMidi = noteToMidi(hn);
        harp.push({
          time: barStart + (hIdx * 0.5) * beat,
          duration: 0.85 * beat,
          midi: hMidi,
          name: hn,
          velocity: 0.80 + (hIdx % 2 === 0 ? 0.12 : 0)
        });
      });

      // 4. DRUMS & PERCUSSION (Light Tango Rhythm with brushes, rimshot and shaker)
      // Rimshot / Snare on 2 and 4
      drums.push({ time: barStart + 1 * beat, duration: 0.2, midi: 37, name: 'C#1', velocity: 0.80 });
      drums.push({ time: barStart + 3 * beat, duration: 0.2, midi: 37, name: 'C#1', velocity: 0.88 });

      // Kick on 1 and 3.5
      drums.push({ time: barStart + 0 * beat, duration: 0.2, midi: 36, name: 'C1', velocity: 0.85 });
      drums.push({ time: barStart + 2.5 * beat, duration: 0.2, midi: 36, name: 'C1', velocity: 0.78 });

      // Hi-Hat / Brushes 8th notes
      for (let i = 0; i < 8; i++) {
        drums.push({
          time: barStart + i * 0.5 * beat,
          duration: 0.15,
          midi: 42,
          name: 'F#1',
          velocity: i % 2 === 0 ? 0.75 : 0.55
        });
      }
    }

    return this._formatMidiStructure('🪗 Libertango & Celtic Harp Fantasy', bpm, totalDuration, tracks);
  }

  /**
   * 7. BLUEGRASS BANJO BREAKDOWN & HOEDOWN
   * Authentic Foggy Mountain / Scruggs 3-finger roll style banjo showcase
   */
  static createBluegrassBanjo() {
    const bpm = 136;
    const beat = 60 / bpm;
    const totalBars = 16;
    const totalDuration = totalBars * 4 * beat;

    const tracks = [
      { name: 'Banjo de 5 Cuerdas Solista', instrument: 'banjo', channel: 0, programNumber: 105, notes: [] },
      { name: 'Guitarra Acústica Rítmica', instrument: 'acousticGuitar', channel: 1, programNumber: 25, notes: [] },
      { name: 'Contrabajo Acústico', instrument: 'doubleBass', channel: 2, programNumber: 32, notes: [] },
      { name: 'Violín de Concierto / Fiddle', instrument: 'violin', channel: 3, programNumber: 40, notes: [] },
      { name: 'Batería Acústica & Washboard', instrument: 'drums', channel: 9, notes: [] }
    ];

    const [banjo, guitar, bass, fiddle, drums] = tracks.map(t => t.notes);

    // Scruggs forward & backward 16th-note roll patterns for Banjo
    // Chord progression: ||: G | G | C | G | G | Em | D7 | G :|| x 2
    const chordRoots = [
      { root: 'G', midi: 55, notes: [67, 59, 62, 67, 71, 74] }, // G: G3, B3, D4, G4, B4, D5
      { root: 'G', midi: 55, notes: [67, 59, 62, 67, 71, 74] },
      { root: 'C', midi: 60, notes: [60, 64, 67, 72, 76] },     // C: C4, E4, G4, C5, E5
      { root: 'G', midi: 55, notes: [67, 59, 62, 67, 71, 74] },
      { root: 'G', midi: 55, notes: [67, 59, 62, 67, 71, 74] },
      { root: 'Em', midi: 52, notes: [64, 59, 67, 71, 76] },    // Em
      { root: 'D', midi: 50, notes: [62, 66, 69, 72, 74] },     // D7: D4, F#4, A4, C5, D5
      { root: 'G', midi: 55, notes: [67, 59, 62, 67, 71, 79] }  // G Tag
    ];

    for (let bar = 0; bar < totalBars; bar++) {
      const barStart = bar * 4 * beat;
      const chord = chordRoots[bar % chordRoots.length];

      // 1. BANJO: High-speed 16th-note Scruggs-style rolls
      for (let s = 0; s < 16; s++) {
        const time = barStart + (s * 0.25) * beat;
        let noteMidi;
        let vel = 0.85;

        // Scruggs roll thumb-index-middle permutation
        if (s % 8 === 0) {
          noteMidi = chord.notes[0]; // Thumb hit bass root/drone
          vel = 0.95;
        } else if (s % 8 === 1) {
          noteMidi = chord.notes[1]; // Index
          vel = 0.82;
        } else if (s % 8 === 2) {
          noteMidi = chord.notes[2]; // Middle
          vel = 0.90;
        } else if (s % 8 === 3) {
          noteMidi = 67; // 5th string drone (G4)
          vel = 0.85;
        } else if (s % 8 === 4) {
          noteMidi = chord.notes[1]; // Index
          vel = 0.80;
        } else if (s % 8 === 5) {
          noteMidi = chord.notes[3] || chord.notes[0]; // Thumb
          vel = 0.88;
        } else if (s % 8 === 6) {
          noteMidi = chord.notes[2]; // Middle
          vel = 0.92;
        } else {
          noteMidi = 67; // 5th string drone
          vel = 0.82;
        }

        // Add melodic hammer-ons on bars 3, 7, 11, 15
        if ((bar % 4 === 3) && (s >= 10 && s <= 14)) {
          noteMidi += 2;
        }

        banjo.push({
          time,
          duration: 0.18,
          midi: noteMidi,
          name: midiToNote(noteMidi),
          velocity: Math.min(1, vel + (Math.random() * 0.08 - 0.04))
        });
      }

      // 2. ACOUSTIC GUITAR: Traditional "boom-chick" country rhythm
      // Boom (bass note on 1 and 3)
      guitar.push({
        time: barStart + 0 * beat,
        duration: 0.28,
        midi: chord.midi,
        name: midiToNote(chord.midi),
        velocity: 0.88
      });
      guitar.push({
        time: barStart + 2 * beat,
        duration: 0.28,
        midi: chord.midi + 7,
        name: midiToNote(chord.midi + 7),
        velocity: 0.82
      });

      // Chick (strum on 2 and 4)
      [1, 3].forEach(b => {
        chord.notes.slice(1, 4).forEach(m => {
          guitar.push({
            time: barStart + b * beat,
            duration: 0.22,
            midi: m,
            name: midiToNote(m),
            velocity: 0.78
          });
        });
      });

      // 3. DOUBLE BASS: Driving 2-step country walking line
      const bassNotes = [chord.midi - 12, chord.midi - 5];
      bass.push({
        time: barStart + 0 * beat,
        duration: 0.45 * beat,
        midi: bassNotes[0],
        name: midiToNote(bassNotes[0]),
        velocity: 0.92
      });
      bass.push({
        time: barStart + 2 * beat,
        duration: 0.45 * beat,
        midi: bassNotes[1],
        name: midiToNote(bassNotes[1]),
        velocity: 0.86
      });

      // 4. FIDDLE (VIOLIN): Lively Bluegrass call-and-response
      if (bar % 2 === 1) {
        const fiddleRiff = [71, 74, 76, 79]; // B4, D5, E5, G5
        fiddleRiff.forEach((m, idx) => {
          fiddle.push({
            time: barStart + (2 + idx * 0.5) * beat,
            duration: 0.42 * beat,
            midi: m,
            name: midiToNote(m),
            velocity: 0.85
          });
        });
      } else {
        // Sustained harmony double-stop
        fiddle.push({
          time: barStart + 0.25 * beat,
          duration: 1.6 * beat,
          midi: chord.midi + 12,
          name: midiToNote(chord.midi + 12),
          velocity: 0.72
        });
      }

      // 5. DRUMS: Crisp acoustic train-beat
      // Kick on 1 and 3
      drums.push({ time: barStart + 0 * beat, duration: 0.18, midi: 36, name: 'C1', velocity: 0.88 });
      drums.push({ time: barStart + 2 * beat, duration: 0.18, midi: 36, name: 'C1', velocity: 0.84 });

      // Snare / Rim train shuffle
      for (let s = 0; s < 8; s++) {
        const isAccent = (s === 2 || s === 6);
        drums.push({
          time: barStart + s * 0.5 * beat,
          duration: 0.12,
          midi: 38,
          name: 'D1',
          velocity: isAccent ? 0.92 : 0.48
        });
      }

      // Tambourine / Hi-hat 8ths
      for (let i = 0; i < 8; i++) {
        drums.push({
          time: barStart + i * 0.5 * beat,
          duration: 0.10,
          midi: 42,
          name: 'F#1',
          velocity: i % 2 === 1 ? 0.75 : 0.45
        });
      }
    }

    return this._formatMidiStructure('🪕 Bluegrass Banjo Breakdown & Hoedown', bpm, totalDuration, tracks);
  }

  /**
   * 8. RICHARD STRAUSS - ALSO SPRACH ZARATHUSTRA (SUNRISE FANFARE)
   * Grand orchestral masterpiece showcasing thunderous Timpani solos,
   * majestic brass motifs, soaring string harmonies and concert harp sweeps.
   */
  static createZarathustraTimpani() {
    const bpm = 96;
    const beat = 60 / bpm; // 0.625s per beat
    const bar = 4 * beat;   // 2.5s per measure
    const totalBars = 19;
    const totalDuration = totalBars * bar + 2.0;

    const timpani = [];
    const trumpet = [];
    const frenchHorn = [];
    const violin = [];
    const bass = [];
    const harp = [];

    const tracks = [
      { name: 'Timbales Sinfónicos / Timpani', instrument: 'timpani', channel: 0, notes: timpani },
      { name: 'Trompeta Solista', instrument: 'trumpet', channel: 1, notes: trumpet },
      { name: 'Cornos Franceses', instrument: 'frenchHorn', channel: 2, notes: frenchHorn },
      { name: 'Violines Sinfónicos', instrument: 'violin', channel: 3, notes: violin },
      { name: 'Contrabajo & Violonchelo', instrument: 'doubleBass', channel: 4, notes: bass },
      { name: 'Arpa de Concierto', instrument: 'harp', channel: 5, notes: harp }
    ];

    // Helper to push a note
    const addNote = (trackArray, timeSec, durSec, midiPitch, vel = 0.85) => {
      trackArray.push({
        time: timeSec,
        duration: durSec,
        midi: midiPitch,
        name: midiToNote(midiPitch),
        velocity: vel
      });
    };

    // =========================================================================
    // SECTION 1: MYSTERIOUS DAWN (Bars 0 - 2)
    // Deep sustained C pedal in contrabass & cello
    // =========================================================================
    addNote(bass, 0.0, 3 * bar, 24, 0.72); // C1 sub-bass
    addNote(bass, 0.0, 3 * bar, 36, 0.78); // C2

    // Soft mysterious timpani pulse on 32" drum
    addNote(timpani, 1.0 * bar, 0.8, 36, 0.55);
    addNote(timpani, 2.0 * bar, 0.8, 36, 0.60);

    // =========================================================================
    // CYCLE 1: FIRST SUNRISE FANFARE (Bars 3 - 7)
    // =========================================================================
    // 1. Trumpet Solo Motif: C3 -> G3 -> C4
    const c1Start = 3.0 * bar;
    addNote(trumpet, c1Start + 0 * beat, 1.8 * beat, 48, 0.84); // C3
    addNote(trumpet, c1Start + 2 * beat, 1.8 * beat, 55, 0.88); // G3
    addNote(trumpet, c1Start + 4 * beat, 3.8 * beat, 60, 0.94); // C4

    // 2. Orchestral Chord Burst: C Major shifting to C Minor (Bar 5)
    const chord1Start = 5.0 * bar;
    // C Major (beats 0-2)
    [48, 55, 60, 64, 67].forEach(m => {
      addNote(frenchHorn, chord1Start, 1.9 * beat, m, 0.85);
      addNote(violin, chord1Start, 1.9 * beat, m + 12, 0.82);
    });
    addNote(bass, chord1Start, 3.8 * beat, 36, 0.88);

    // Harp arpeggio sweeping up
    [48, 52, 55, 60, 64, 67, 72].forEach((m, idx) => {
      addNote(harp, chord1Start + idx * 0.12 * beat, 0.8 * beat, m, 0.75);
    });

    // Sudden shift to C Minor (beats 2-4)
    [48, 55, 60, 63, 67].forEach(m => {
      addNote(frenchHorn, chord1Start + 2 * beat, 1.9 * beat, m, 0.90);
      addNote(violin, chord1Start + 2 * beat, 1.9 * beat, m + 12, 0.86);
    });

    // 3. FIRST THUNDER OF TIMPANI (Solo in silence, Bars 6 - 7)
    // Bar 6: Alternating 4 majestic strikes (32" C2 and 29" G2)
    const timpSolo1 = 6.0 * bar;
    addNote(timpani, timpSolo1 + 0 * beat, 0.55 * beat, 36, 0.90); // C2 (32")
    addNote(timpani, timpSolo1 + 1 * beat, 0.55 * beat, 43, 0.92); // G2 (29")
    addNote(timpani, timpSolo1 + 2 * beat, 0.55 * beat, 36, 0.94); // C2
    addNote(timpani, timpSolo1 + 3 * beat, 0.55 * beat, 43, 0.96); // G2

    // Bar 7: Rapid roll build-up on C2
    const roll1Start = 7.0 * bar;
    addNote(timpani, roll1Start + 0 * beat, 0.45 * beat, 36, 0.92);
    addNote(timpani, roll1Start + 0.5 * beat, 0.45 * beat, 43, 0.94);
    addNote(timpani, roll1Start + 1.0 * beat, 0.45 * beat, 36, 0.96);
    addNote(timpani, roll1Start + 1.5 * beat, 0.45 * beat, 43, 0.98);

    // 16th-note roll crescendos into the pause
    for (let r = 0; r < 8; r++) {
      addNote(timpani, roll1Start + (2 + r * 0.25) * beat, 0.22 * beat, 36, 0.78 + r * 0.03);
    }

    // =========================================================================
    // CYCLE 2: SECOND SUNRISE FANFARE (Higher, Louder - Bars 8 - 12)
    // =========================================================================
    const c2Start = 8.0 * bar;
    addNote(bass, c2Start, 3 * bar, 24, 0.75);
    addNote(bass, c2Start, 3 * bar, 36, 0.82);

    addNote(trumpet, c2Start + 0 * beat, 1.8 * beat, 48, 0.88); // C3
    addNote(trumpet, c2Start + 2 * beat, 1.8 * beat, 55, 0.92); // G3
    addNote(trumpet, c2Start + 4 * beat, 3.8 * beat, 60, 0.98); // C4

    // Orchestral Chord Burst: C Minor shifting to C Major (Bar 10)
    const chord2Start = 10.0 * bar;
    // C Minor (beats 0-2)
    [48, 55, 60, 63, 67].forEach(m => {
      addNote(frenchHorn, chord2Start, 1.9 * beat, m, 0.88);
      addNote(violin, chord2Start, 1.9 * beat, m + 12, 0.86);
    });

    // Harp arpeggio minor
    [48, 51, 55, 60, 63, 67, 72].forEach((m, idx) => {
      addNote(harp, chord2Start + idx * 0.12 * beat, 0.8 * beat, m, 0.78);
    });

    // Shift to C Major (beats 2-4)
    [48, 55, 60, 64, 67].forEach(m => {
      addNote(frenchHorn, chord2Start + 2 * beat, 1.9 * beat, m, 0.94);
      addNote(violin, chord2Start + 2 * beat, 1.9 * beat, m + 12, 0.92);
    });

    // SECOND TIMPANI SOLO (Bars 11 - 12)
    const timpSolo2 = 11.0 * bar;
    addNote(timpani, timpSolo2 + 0 * beat, 0.55 * beat, 36, 0.94);
    addNote(timpani, timpSolo2 + 1 * beat, 0.55 * beat, 43, 0.96);
    addNote(timpani, timpSolo2 + 2 * beat, 0.55 * beat, 36, 0.96);
    addNote(timpani, timpSolo2 + 3 * beat, 0.55 * beat, 43, 0.98);

    // Bar 12: Alternating 8th notes leading into powerful accent
    const roll2Start = 12.0 * bar;
    for (let i = 0; i < 6; i++) {
      const pitch = i % 2 === 0 ? 36 : 43;
      addNote(timpani, roll2Start + i * 0.5 * beat, 0.42 * beat, pitch, 0.92 + i * 0.015);
    }
    addNote(timpani, roll2Start + 3.0 * beat, 0.9 * beat, 36, 1.0); // Fortissimo hit

    // =========================================================================
    // CYCLE 3: THE GLORIOUS CLIMAX & ORGAN/TIMPANI OUTBURST (Bars 13 - 18)
    // =========================================================================
    const c3Start = 13.0 * bar;
    addNote(trumpet, c3Start + 0 * beat, 1.8 * beat, 48, 0.92); // C3
    addNote(trumpet, c3Start + 2 * beat, 1.8 * beat, 55, 0.96); // G3
    addNote(trumpet, c3Start + 4 * beat, 2.8 * beat, 60, 1.00); // C4
    addNote(trumpet, c3Start + 7 * beat, 0.9 * beat, 64, 0.96); // E4

    // Full Symphony Outburst (Bars 15 - 18)
    const climaxStart = 15.0 * bar;
    // Trumpet high melody
    addNote(trumpet, climaxStart + 0 * beat, 3.8 * beat, 67, 1.0); // G4
    addNote(trumpet, climaxStart + 4 * beat, 7.5 * beat, 72, 1.0); // High C5 triumph!

    // French Horns grand fanfare
    [48, 55, 60, 64, 67].forEach(m => {
      addNote(frenchHorn, climaxStart, 4.0 * bar, m, 0.96);
    });

    // Strings soaring
    [60, 64, 67, 72, 76, 79].forEach(m => {
      addNote(violin, climaxStart, 4.0 * bar, m, 0.95);
    });

    // Bass pedal
    addNote(bass, climaxStart, 4.0 * bar, 24, 1.0);
    addNote(bass, climaxStart, 4.0 * bar, 36, 1.0);

    // Harp grand glissandi across whole climax
    for (let g = 0; g < 3; g++) {
      const gOffset = climaxStart + g * 1.2 * bar;
      [48, 52, 55, 60, 64, 67, 72, 76, 79, 84].forEach((m, idx) => {
        addNote(harp, gOffset + idx * 0.08 * beat, 0.6 * beat, m, 0.85);
      });
    }

    // CLIMACTIC TIMPANI ROLL & FINALE
    // Heavy punctuation on downbeats
    addNote(timpani, climaxStart + 0 * beat, 0.8 * beat, 36, 1.0);
    addNote(timpani, climaxStart + 2 * beat, 0.8 * beat, 43, 0.98);
    addNote(timpani, climaxStart + 4 * beat, 0.8 * beat, 36, 1.0);

    // Thunderous two-handed Timpani Tremolo Roll on C2 (32") from bar 16.5 to 18
    const finalRollStart = climaxStart + 6 * beat;
    for (let r = 0; r < 20; r++) {
      addNote(timpani, finalRollStart + r * 0.20 * beat, 0.25 * beat, 36, 0.85 + Math.min(0.15, r * 0.01));
    }

    // Final fortissimo hammer blows
    const finalHits = climaxStart + 10.5 * beat;
    addNote(timpani, finalHits + 0 * beat, 0.6 * beat, 36, 1.0);
    addNote(timpani, finalHits + 1 * beat, 0.6 * beat, 43, 1.0);
    addNote(timpani, finalHits + 2 * beat, 1.8 * beat, 36, 1.0);

    return this._formatMidiStructure('🪘 Strauss - Also sprach Zarathustra (Timpani Solo Fanfare)', bpm, totalDuration, tracks);
  }

  /**
   * 9. VIVALDI & CELTIC DANCE (BAROQUE SOPRANO RECORDER SHOWCASE)
   * High-spirited Baroque Concerto in D Minor & Celtic Allegro showcasing
   * rapid fingerwork, ornamentation, and acoustic breath dynamics on the Flauta Dulce.
   */
  static createBaroqueRecorder() {
    const bpm = 124;
    const beat = 60 / bpm; // ~0.484s per beat
    const bar = 4 * beat;   // ~1.935s per measure
    const totalBars = 16;
    const totalDuration = totalBars * bar + 1.5;

    const recorder = [];
    const cello = [];
    const violin = [];
    const harp = [];
    const tamb = [];

    const tracks = [
      { name: 'Flauta Dulce Barroca Solista', instrument: 'recorder', channel: 0, programNumber: 74, notes: recorder },
      { name: 'Violonchelo Basso Continuo', instrument: 'cello', channel: 1, programNumber: 42, notes: cello },
      { name: 'Violines Ripieno', instrument: 'violin', channel: 2, programNumber: 40, notes: violin },
      { name: 'Arpa / Clavecín Barroco', instrument: 'harp', channel: 3, programNumber: 46, notes: harp },
      { name: 'Pandereta Tradicional', instrument: 'tambourine', channel: 9, notes: tamb }
    ];

    const addNote = (trackArray, timeSec, durSec, midiPitch, vel = 0.85) => {
      trackArray.push({
        time: timeSec,
        duration: durSec,
        midi: midiPitch,
        name: midiToNote(midiPitch),
        velocity: vel
      });
    };

    // =========================================================================
    // SECTION 1: BAROQUE RITORNELLO (Bars 0 - 3) - Allegro D Minor
    // =========================================================================
    for (let b = 0; b < 4; b++) {
      const bStart = b * bar;
      // Cello Basso Continuo: driving 8th-note walking bass
      const bassRoots = [38, 41, 45, 38]; // D2, F2, A2, D2
      const root = bassRoots[b];
      for (let i = 0; i < 4; i++) {
        addNote(cello, bStart + i * beat, 0.45 * beat, root, 0.78);
        addNote(cello, bStart + (i + 0.5) * beat, 0.45 * beat, root + (i % 2 === 0 ? 7 : 0), 0.72);
      }

      // Harp broken chord continuo on every quarter beat
      const harpChords = [
        [50, 57, 62, 65], // Dm
        [53, 57, 60, 65], // F
        [57, 60, 64, 69], // Am
        [50, 57, 62, 65]  // Dm
      ][b];
      for (let q = 0; q < 4; q++) {
        harpChords.forEach((p, idx) => {
          addNote(harp, bStart + q * beat + idx * 0.05 * beat, 0.75 * beat, p, 0.65);
        });
      }

      // Tambourine pulse on beats 2 & 4 with 8th-note shake
      addNote(tamb, bStart + 1 * beat, 0.4 * beat, 54, 0.70);
      addNote(tamb, bStart + 1.5 * beat, 0.3 * beat, 54, 0.55);
      addNote(tamb, bStart + 3 * beat, 0.4 * beat, 54, 0.75);
      addNote(tamb, bStart + 3.5 * beat, 0.3 * beat, 54, 0.58);
    }

    // Recorder Ritornello Melody (D5 to A6, Vivaldi style triadic motif)
    // Bar 0: D5 -> F5 -> A5 -> D6 arpeggio and run
    const m0 = 0 * bar;
    addNote(recorder, m0 + 0 * beat, 0.45 * beat, 74, 0.88);    // D5
    addNote(recorder, m0 + 0.5 * beat, 0.45 * beat, 77, 0.88);  // F5
    addNote(recorder, m0 + 1.0 * beat, 0.45 * beat, 81, 0.92);  // A5
    addNote(recorder, m0 + 1.5 * beat, 0.45 * beat, 86, 0.96);  // D6
    // 16th-note descent: C6 -> Bb5 -> A5 -> G5
    addNote(recorder, m0 + 2.0 * beat, 0.22 * beat, 84, 0.86);  // C6
    addNote(recorder, m0 + 2.25 * beat, 0.22 * beat, 82, 0.84); // Bb5
    addNote(recorder, m0 + 2.5 * beat, 0.22 * beat, 81, 0.84);  // A5
    addNote(recorder, m0 + 2.75 * beat, 0.22 * beat, 79, 0.82); // G5
    addNote(recorder, m0 + 3.0 * beat, 0.90 * beat, 81, 0.90);  // A5 hold

    // Bar 1: F Major response
    const m1 = 1 * bar;
    addNote(recorder, m1 + 0 * beat, 0.45 * beat, 77, 0.86);    // F5
    addNote(recorder, m1 + 0.5 * beat, 0.45 * beat, 81, 0.88);  // A5
    addNote(recorder, m1 + 1.0 * beat, 0.45 * beat, 84, 0.92);  // C6
    addNote(recorder, m1 + 1.5 * beat, 0.45 * beat, 89, 0.96);  // F6 high
    addNote(recorder, m1 + 2.0 * beat, 0.22 * beat, 88, 0.86);  // E6
    addNote(recorder, m1 + 2.25 * beat, 0.22 * beat, 86, 0.84); // D6
    addNote(recorder, m1 + 2.5 * beat, 0.22 * beat, 84, 0.84);  // C6
    addNote(recorder, m1 + 2.75 * beat, 0.22 * beat, 82, 0.82); // Bb5
    addNote(recorder, m1 + 3.0 * beat, 0.90 * beat, 84, 0.90);  // C6

    // Bar 2: Rapid 16th-note baroque sequential run
    const m2 = 2 * bar;
    const runNotes = [81, 79, 81, 82, 81, 79, 77, 76, 77, 79, 77, 76, 74, 73, 74, 76];
    runNotes.forEach((p, idx) => {
      addNote(recorder, m2 + idx * 0.25 * beat, 0.22 * beat, p, 0.82 + (idx % 4 === 0 ? 0.1 : 0));
    });

    // Bar 3: Cadence in D Minor with expressive trill
    const m3 = 3 * bar;
    addNote(recorder, m3 + 0 * beat, 0.9 * beat, 77, 0.90);     // F5
    addNote(recorder, m3 + 1 * beat, 0.9 * beat, 76, 0.88);     // E5
    // Trill on E5 (alternating E5 & F5)
    for (let t = 0; t < 4; t++) {
      addNote(recorder, m3 + (2 + t * 0.25) * beat, 0.22 * beat, t % 2 === 0 ? 76 : 77, 0.84);
    }
    addNote(recorder, m3 + 3 * beat, 0.95 * beat, 74, 0.95);    // D5 resolution

    // =========================================================================
    // SECTION 2: VIRTUOSO SOLO & CELTIC JUMP (Bars 4 - 7)
    // =========================================================================
    for (let b = 4; b < 8; b++) {
      const bStart = b * bar;
      // Staccato cello pulses
      const root = [43, 38, 40, 45][b - 4]; // G2, D2, E2, A2
      for (let i = 0; i < 4; i++) {
        addNote(cello, bStart + i * beat, 0.35 * beat, root, 0.72);
      }
      // Violins harmony answering
      [62, 65, 69].forEach(p => addNote(violin, bStart + 1 * beat, 0.8 * beat, p, 0.65));
      [60, 64, 69].forEach(p => addNote(violin, bStart + 3 * beat, 0.8 * beat, p, 0.65));

      // Celtic tambourine lively 16th pulse
      for (let s = 0; s < 8; s++) {
        addNote(tamb, bStart + s * 0.5 * beat, 0.25 * beat, 54, s % 2 === 0 ? 0.75 : 0.45);
      }
    }

    // High energetic Celtic leaps on Recorder (Bar 4-7)
    const m4 = 4 * bar;
    [86, 84, 82, 81, 79, 81, 82, 84].forEach((p, idx) => {
      addNote(recorder, m4 + idx * 0.5 * beat, 0.42 * beat, p, 0.90);
    });

    const m5 = 5 * bar;
    [86, 89, 86, 84, 82, 81, 79, 77].forEach((p, idx) => {
      addNote(recorder, m5 + idx * 0.5 * beat, 0.42 * beat, p, 0.92);
    });

    const m6 = 6 * bar;
    // Fast triplets / 16ths in Celtic reel style
    const reel = [79, 81, 82, 81, 79, 77, 76, 77, 79, 81, 82, 84, 86, 88, 89, 91];
    reel.forEach((p, idx) => {
      addNote(recorder, m6 + idx * 0.25 * beat, 0.22 * beat, p, 0.86);
    });

    const m7 = 7 * bar;
    addNote(recorder, m7 + 0 * beat, 0.9 * beat, 89, 0.94);     // F6
    addNote(recorder, m7 + 1 * beat, 0.9 * beat, 88, 0.92);     // E6
    addNote(recorder, m7 + 2 * beat, 0.45 * beat, 86, 0.90);    // D6
    addNote(recorder, m7 + 2.5 * beat, 0.45 * beat, 84, 0.88);  // C#6 (85)
    addNote(recorder, m7 + 3 * beat, 0.95 * beat, 86, 0.96);    // D6

    // =========================================================================
    // SECTION 3: GRAND BAROQUE TUTTI CADENZA & FINALE (Bars 8 - 15)
    // =========================================================================
    for (let b = 8; b < 16; b++) {
      const bStart = b * bar;
      const cadenceRoots = [38, 41, 43, 45, 38, 41, 45, 38];
      const root = cadenceRoots[b - 8];
      for (let i = 0; i < 4; i++) {
        addNote(cello, bStart + i * beat, 0.45 * beat, root, 0.82);
        addNote(cello, bStart + (i + 0.5) * beat, 0.45 * beat, root + 12, 0.76);
      }

      // Violins playing full baroque ripieno harmonies
      const vChords = [
        [62, 65, 69], // Dm
        [65, 69, 72], // F
        [67, 71, 74], // G
        [69, 73, 76], // A
        [62, 65, 69], // Dm
        [65, 69, 72], // F
        [69, 73, 76], // A Major dominant
        [62, 66, 69]  // D Major Picardy third
      ][b - 8];
      for (let q = 0; q < 4; q++) {
        vChords.forEach(p => addNote(violin, bStart + q * beat, 0.85 * beat, p, 0.72));
      }

      // Harp arpeggios cascading
      vChords.forEach((p, idx) => {
        addNote(harp, bStart + (idx * 0.25) * beat, 1.2 * beat, p - 12, 0.74);
        addNote(harp, bStart + (1 + idx * 0.25) * beat, 1.2 * beat, p, 0.76);
      });

      // Tambourine lively accompaniment
      for (let s = 0; s < 4; s++) {
        addNote(tamb, bStart + s * beat, 0.35 * beat, 54, 0.78);
        addNote(tamb, bStart + (s + 0.5) * beat, 0.25 * beat, 54, 0.60);
      }
    }

    // Recorder virtuoso lines across Bars 8-15
    const m8 = 8 * bar;
    [74, 77, 81, 86, 84, 82, 81, 79].forEach((p, idx) => {
      addNote(recorder, m8 + idx * 0.5 * beat, 0.45 * beat, p, 0.90);
    });

    const m9 = 9 * bar;
    [77, 81, 84, 89, 88, 86, 84, 82].forEach((p, idx) => {
      addNote(recorder, m9 + idx * 0.5 * beat, 0.45 * beat, p, 0.92);
    });

    const m10 = 10 * bar;
    [79, 82, 86, 91, 89, 88, 86, 84].forEach((p, idx) => {
      addNote(recorder, m10 + idx * 0.5 * beat, 0.45 * beat, p, 0.94);
    });

    const m11 = 11 * bar;
    // High Baroque trill on A6
    addNote(recorder, m11 + 0 * beat, 1.8 * beat, 88, 0.95);
    for (let t = 0; t < 8; t++) {
      addNote(recorder, m11 + (2 + t * 0.25) * beat, 0.22 * beat, t % 2 === 0 ? 88 : 89, 0.92);
    }

    const m12 = 12 * bar;
    [86, 84, 82, 81, 79, 77, 76, 74].forEach((p, idx) => {
      addNote(recorder, m12 + idx * 0.5 * beat, 0.45 * beat, p, 0.92);
    });

    const m13 = 13 * bar;
    // Rapid ascending scale to F6
    const ascScale = [74, 76, 77, 79, 81, 82, 84, 86, 88, 89, 91, 93];
    ascScale.forEach((p, idx) => {
      addNote(recorder, m13 + idx * 0.3 * beat, 0.26 * beat, p, 0.94);
    });

    const m14 = 14 * bar;
    // Dominant preparation with trill on C#6 (MIDI 85)
    addNote(recorder, m14 + 0 * beat, 0.9 * beat, 89, 0.95);    // F6
    addNote(recorder, m14 + 1 * beat, 0.9 * beat, 88, 0.94);    // E6
    for (let t = 0; t < 8; t++) {
      addNote(recorder, m14 + (2 + t * 0.25) * beat, 0.22 * beat, t % 2 === 0 ? 85 : 86, 0.92);
    }

    const m15 = 15 * bar;
    // Final triumphant sustained Picardy resolution on D6 (MIDI 86) with bell tone
    addNote(recorder, m15 + 0 * beat, 3.8 * beat, 86, 1.0);     // D6 grand finale hold
    addNote(recorder, m15 + 3.8 * beat, 0.8 * beat, 86, 0.85);

    return this._formatMidiStructure('🪈 Vivaldi - Baroque Concerto & Celtic Dance (Flauta Dulce)', bpm, totalDuration, tracks);
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
