# MIDI Orchestra

Web-based MIDI player with an interactive 3D orchestra. It turns MIDI tracks into visible instruments, lets you focus the camera on each performer, and provides per-instrument mixing controls.

## Features

- 3D scene with piano, drums, electric and acoustic guitars, bass, brass, strings, and more instruments.
- Synchronized animations for keys, frets, percussion, drumsticks, and bass drum pedal.
- Mixer with per-instrument volume, mute, and solo controls.
- General MIDI playback through GeneralUser GS, including program, volume, expression, pan, and pitch-bend MIDI controls.
- Internal Web Audio output or browser-available MIDI devices.

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

## Inspiration

This project is inspired by [MIDI2JAM2](https://github.com/wyskoj/midis2jam2) by Wyskoj, especially its idea of visualizing a MIDI performance as a band or orchestra and the expressiveness of its animations.

MIDI Orchestra is an independent web implementation and does not reuse MIDI2JAM2 code. Its audio engine uses Web Audio and SpessaSynth to run directly in the browser.

## License

MIDI Orchestra's original source code is released under the [MIT License](LICENSE).

Third-party dependencies, sound banks, and demo music remain subject to their respective licenses and rights; they are not relicensed under MIT.

## Audio credits and licenses

The bundled GeneralUser GS sound bank retains its license in [GENERALUSER-LICENSE.txt](public/soundfonts/GENERALUSER-LICENSE.txt). The bundled SpessaSynth processor for Web Audio retains its Apache 2.0 license in [SPESSASYNTH-LICENSE.txt](public/audio/SPESSASYNTH-LICENSE.txt).
