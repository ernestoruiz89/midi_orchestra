# MIDI Orchestra

Web-based MIDI player with an interactive 3D orchestra. It turns MIDI tracks into visible instruments, lets you focus the camera on each performer, and provides per-instrument mixing controls.

## Features

- 3D scene with piano, drums, electric and acoustic guitars, bass, brass, strings, and more instruments.
- Synchronized animations for keys, frets, percussion, drumsticks, and bass drum pedal.
- Mixer with per-instrument volume, mute, and solo controls.
- General MIDI playback through GeneralUser GS, including program, volume, expression, pan, and pitch-bend MIDI controls.
- Internal Web Audio output or browser-available MIDI devices.

## Saved mixes

The mixer starts at 100% (unity gain), preserving the MIDI file's channel volume, expression, and note velocities. Adjustments from 0–200%, Mute/Solo settings, and instrument reassignments are saved in this browser for the exact file name, including its extension and capitalization. Files with the same name share a preset. **Reset Default** removes that file's preset and restores its original instruments and mix. Browser data clearing also removes saved presets.

## Run locally

Requires Node.js 18 or later.

```bash
npm install
npm run dev
```

Open the address shown by Vite, usually `http://localhost:5173`.

To create a production build:

```bash
npm run build
```

## Inspiration and acknowledgments

This project is inspired by [midis2jam2](https://github.com/wyskoj/midis2jam2) by Wyskoj and draws on some of its ideas, including visualizing MIDI tracks as a 3D band or orchestra, animating instruments in sync with the music, and showing instruments as they become active during a performance. Credit for these reference ideas goes to midis2jam2 and its contributors.

MIDI Orchestra adapts these ideas for an independent web implementation. Its audio engine uses Web Audio and SpessaSynth to run directly in the browser.

## License

MIDI Orchestra's original source code is released under the [MIT License](LICENSE).

Third-party dependencies, sound banks, and demo music remain subject to their respective licenses and rights; they are not relicensed under MIT.

## Audio credits and licenses

The bundled GeneralUser GS sound bank retains its license in [GENERALUSER-LICENSE.txt](public/soundfonts/GENERALUSER-LICENSE.txt). The bundled SpessaSynth processor for Web Audio retains its Apache 2.0 license in [SPESSASYNTH-LICENSE.txt](public/audio/SPESSASYNTH-LICENSE.txt).
