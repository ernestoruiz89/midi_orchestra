import assert from 'node:assert/strict';
import puppeteer from 'puppeteer';

const browser = await puppeteer.launch({ headless: true });
const errors = [];
try {
  const page = await browser.newPage();
  page.on('pageerror', error => errors.push(error.message));
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
  await page.goto(process.env.TEST_URL || 'http://localhost:5173/', { waitUntil: 'networkidle2' });
  await page.waitForFunction(() => window.app?.midiPlayer.duration > 0);
  const initial = await page.evaluate(() => {
    const { sceneManager: scene, midiPlayer: midi } = window.app;
    let meshes = 0;
    scene.scene.traverse(object => { if (object.isMesh) meshes++; });
    const lights = [];
    scene.scene.traverseVisible(object => { if (object.isLight) lights.push(object.type); });
    return { assigned: midi.getActiveInstruments().sort(), created: Object.keys(scene.allInstruments).sort(), meshes, lights };
  });
  assert.deepEqual(initial.created, initial.assigned);
  assert.equal(initial.lights.includes('SpotLight'), false);
  assert.equal(initial.lights.includes('PointLight'), false);
  console.log('Initial scene:', initial);

  // Rest visibility must not unload/rebuild models belonging to this song.
  assert.equal(await page.evaluate(() => {
    const scene = window.app.sceneManager;
    const piano = scene.allInstruments.piano;
    scene.setVisibleInstruments([]);
    scene.setVisibleInstruments(window.app.midiPlayer.getActiveInstruments());
    return piano === scene.allInstruments.piano;
  }), true);

  // Reassign an actual MIDI track, exercising UI callbacks and camera layout.
  const reassigned = await page.evaluate(() => {
    const { midiPlayer: midi, sceneManager: scene } = window.app;
    const track = midi.trackInfos.find(track => track.instrument === 'harmonica');
    midi.setTrackInstrument(track.index, 'sax');
    return { sax: !!scene.allInstruments.sax, harmonica: !!scene.allInstruments.harmonica, camera: !!scene.cameraController.presets.sax };
  });
  assert.deepEqual(reassigned, { sax: true, harmonica: false, camera: true });

  // Sub-pixel details return with exactly the same layers and visibility.
  const detail = await page.evaluate(() => {
    const scene = window.app.sceneManager;
    scene.scene.updateMatrixWorld(true);
    const lod = scene.instrumentDetails.get('drums');
    const camera = scene.camera.clone();
    camera.position.set(0, 20, 80);
    const visibility = lod.parts.map(part => part.mesh.visible);
    lod.update(camera, 844);
    const distantHidden = lod.parts.filter(part => part.hidden).length;
    lod.update(camera, 844, true);
    return {
      distantHidden,
      restored: lod.parts.every(part => !part.hidden && part.mesh.layers.mask === part.mask),
      sameVisibility: lod.parts.every((part, i) => part.mesh.visible === visibility[i])
    };
  });
  assert.ok(detail.distantHidden > 0);
  assert.equal(detail.restored && detail.sameVisibility, true);
  console.log('Distance detail:', detail);

  // Replacing the song releases old resources and creates only the new set.
  await page.evaluate(() => window.app.uiManager.loadDemoSong('cordelia_juan_arenosa', { autoplay: false }));
  const replacement = await page.evaluate(() => ({
    assigned: window.app.midiPlayer.getActiveInstruments().sort(),
    created: Object.keys(window.app.sceneManager.allInstruments).sort(),
    groups: window.app.sceneManager.scene.children.filter(object => object.userData.instrumentKey).length
  }));
  assert.deepEqual(replacement.created, replacement.assigned);
  assert.equal(replacement.groups, replacement.created.length);

  // Every supported factory works independently, even a duplicate without tier 1.
  const factoryCount = await page.evaluate(async () => {
    const { instrumentFactories } = await import('/src/scene/InstrumentFactory.js');
    const scene = window.app.sceneManager;
    for (const key of Object.keys(instrumentFactories)) {
      scene.layoutInstruments([key], {}, false);
      if (Object.keys(scene.allInstruments).join() !== key) throw Error(`Factory mismatch: ${key}`);
      scene.setVisibleInstruments([key]);
      scene.handleNoteOn(key.replace(/_\d+$/, ''), 60, 'C4', 0.8, 0.15, key);
      scene.handleNoteOff(key.replace(/_\d+$/, ''), 60, 'C4', true, key);
    }
    scene.layoutInstruments([], {}, false);
    return Object.keys(instrumentFactories).length;
  });
  assert.equal(factoryCount, 46);
  assert.deepEqual(errors, []);
  console.log('PASS: assignment, visibility, LOD restoration, song changes and 46 isolated factories.');
} finally {
  await browser.close();
}
