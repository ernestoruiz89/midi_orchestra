# MIDI Orchestra

Reproductor MIDI web con una orquesta 3D interactiva. Convierte las pistas de un archivo MIDI en instrumentos visibles, permite enfocar la cámara en cada músico y ofrece controles de mezcla por instrumento.

## Funciones

- Escena 3D con piano, batería, guitarras eléctricas y acústicas, bajo, metales, cuerdas y más instrumentos.
- Animaciones sincronizadas para teclas, trastes, percusión, baquetas y pedal de bombo.
- Mezclador con volumen, silencio y solo por instrumento.
- Reproducción General MIDI mediante GeneralUser GS y controles MIDI de programa, volumen, expresión, panorámica y pitch bend.
- Salida interna Web Audio o dispositivos MIDI disponibles en el navegador.

## Ejecutar localmente

Requiere Node.js 18 o posterior.

```bash
npm install
npm run dev
```

Abre la dirección que muestra Vite, normalmente `http://localhost:5173`.

Para crear una versión de producción:

```bash
npm run build
```

## Inspiración

Este proyecto está inspirado en [MIDI2JAM2](https://github.com/wyskoj/midis2jam2), de Wyskoj: especialmente en su idea de visualizar una interpretación MIDI como una banda/orquesta y en la expresividad de sus animaciones.

MIDI Orchestra es una implementación web independiente; no reutiliza el código de MIDI2JAM2. Su motor de audio se basa en Web Audio y SpessaSynth para funcionar directamente en el navegador.

## Créditos y licencias de audio

El banco GeneralUser GS incluido en `public/soundfonts/` conserva su licencia en [GENERALUSER-LICENSE.txt](public/soundfonts/GENERALUSER-LICENSE.txt). El procesador de SpessaSynth incluido para Web Audio conserva la licencia Apache 2.0 en [SPESSASYNTH-LICENSE.txt](public/audio/SPESSASYNTH-LICENSE.txt).
