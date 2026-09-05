import assert from 'node:assert/strict';
import puppeteer from 'puppeteer';
import { createRequire } from 'node:module';
const { Midi } = createRequire(import.meta.url)('@tonejs/midi');

const midi = new Midi();
midi.name = 'Same embedded song title';
for (const [channel, program, volume] of [[0, 0, 32 / 127], [1, 4, 100 / 127], [2, 21, 80 / 127]]) {
  const track = midi.addTrack();
  track.channel = channel;
  track.instrument.number = program;
  track.addCC({ number: 7, value: volume, time: 0 });
  track.addCC({ number: 11, value: 90 / 127, time: 0 });
  track.addNote({ midi: 60 + channel, time: 0, duration: 12, velocity: 0.7 });
}
const bytes = [...midi.toArray()];
const browser = await puppeteer.launch({ headless: true });
try {
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  const url = process.env.TEST_URL || 'http://localhost:5173/';
  const ready = () => page.waitForFunction(() => window.app?.midiPlayer.duration > 0);
  const load = name => page.evaluate((data, name) => app.midiPlayer.loadMidiData(new Uint8Array(data).buffer, name), bytes, name);
  const state = () => page.evaluate(() => ({
    volumes: app.soundEngine.volumes, muted: app.soundEngine.muted, solo: app.soundEngine.solo,
    tracks: app.midiPlayer.trackInfos.map(t => [t.instrument, t.programNumber]),
    sliders: [...document.querySelectorAll('.mixer-strip')].map(s => [s.dataset.inst, Number(s.querySelector('input').value)]),
    overrides: app.midiPlayer.trackInstrumentOverrides
  }));
  const slider = (inst, value) => page.evaluate((inst, value) => {
    const input = document.querySelector(`.mixer-strip[data-inst="${inst}"] input`);
    input.value = value;
    input.dispatchEvent(new Event('input', { bubbles: true }));
  }, inst, value);

  await page.goto(url, { waitUntil: 'networkidle2' });
  await ready();
  await load('Preset A.mid');
  const original = await state();
  assert.ok(Object.values(original.volumes).every(v => v === 1));
  assert.deepEqual(original.tracks, [['piano', 0], ['piano', 4], ['accordion', 21]]);
  await slider('piano', 0.4);
  await slider('piano_2', 1.5);
  await page.evaluate(() => {
    document.querySelector('.mixer-strip[data-inst="piano"] .btn-mute').click();
    app.uiManager._renderTracksTable();
    const select = document.querySelector('.inst-select[data-track-index="2"]');
    select.value = 'harmonica';
    select.dispatchEvent(new Event('change', { bubbles: true }));
  });
  await slider('harmonica', 0.6);
  assert.deepEqual((await state()).tracks[2], ['harmonica', 22]);

  // Same embedded MIDI title, different file name: no settings leak.
  await load('Preset B.mid');
  const other = await state();
  assert.ok(Object.values(other.volumes).every(v => v === 1));
  assert.ok(Object.values(other.muted).every(v => !v));
  assert.deepEqual(other.tracks, original.tracks);

  await page.reload({ waitUntil: 'networkidle2' });
  await ready();
  await load('Preset A.mid');
  const restored = await state();
  assert.equal(restored.volumes.piano, 0.4);
  assert.equal(restored.volumes.piano_2, 1.5);
  assert.equal(restored.volumes.harmonica, 0.6);
  assert.equal(restored.muted.piano, true);
  assert.equal(restored.muted.piano_2, false);
  assert.deepEqual(restored.tracks[2], ['harmonica', 22]);
  assert.equal(Object.fromEntries(restored.sliders).piano_2, 1.5);

  // Exercise the real GM graph: faders multiply the file's CC state.
  await page.click('#btn-play');
  await page.waitForFunction(() => app.soundEngine.gmSynthReady && app.midiPlayer.currentTime > 0.3);
  const audio = await page.evaluate(() => {
    const s = app.soundEngine;
    return { gains: s.gmChannelInputs.slice(0, 3).map(g => g.gain.value), cc: s.midiChannelState.slice(0, 3) };
  });
  assert.ok(audio.gains[0] < 0.01);
  assert.ok(Math.abs(audio.gains[1] - 1.5) < 0.01);
  assert.ok(Math.abs(audio.cc[0].volume - 32 / 127) < 0.001);
  assert.ok(Math.abs(audio.cc[1].volume - 100 / 127) < 0.001);

  // Reset during playback restores original instruments and keeps playback going.
  await page.evaluate(() => app.midiPlayer.resetSongPreset());
  assert.equal(await page.evaluate(() => app.midiPlayer.isPlaying), true);
  await page.evaluate(() => app.midiPlayer.pause());
  const reset = await state();
  assert.deepEqual(reset.tracks, original.tracks);
  assert.ok(Object.values(reset.volumes).every(v => v === 1));
  assert.ok(Object.values(reset.muted).every(v => !v));
  assert.equal(await page.evaluate(() => localStorage.getItem('midi_orchestra_song_preset_v1:Preset%20A.mid')), null);
  await load('Preset A.mid');
  assert.deepEqual((await state()).tracks, original.tracks);
  assert.ok(Object.values((await state()).volumes).every(v => v === 1));

  // Invalid browser data cannot poison gain values or instrument factories.
  await page.evaluate(() => localStorage.setItem('midi_orchestra_song_preset_v1:Broken.mid', '{invalid'));
  await load('Broken.mid');
  assert.ok(Object.values((await state()).volumes).every(v => v === 1));
  assert.deepEqual(errors, []);
  console.log('PASS: unity defaults, per-file persistence, reload, instrument mapping, boost, independent mute, MIDI CCs, reset during playback and invalid storage.');
} finally {
  await browser.close();
}
