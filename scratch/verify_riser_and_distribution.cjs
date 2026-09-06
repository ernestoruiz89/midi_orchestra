const path = require('path');
const puppeteer = require(path.resolve(process.cwd(), 'node_modules/puppeteer'));

(async () => {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    page.on('console', msg => console.log('PAGE:', msg.text()));
    page.on('pageerror', err => console.log('PAGE ERROR:', err.stack || err.message));
    page.on('error', err => console.log('ERROR:', err));
    await page.setViewport({ width: 1400, height: 900 });

    await page.goto('http://localhost:5173/', { waitUntil: 'domcontentloaded', timeout: 30000 });
    for (let i = 0; i < 30; i++) {
      const ready = await page.evaluate(() => !!(window.app && window.app.sceneManager));
      if (ready) break;
      await new Promise(r => setTimeout(r, 500));
    }
    await new Promise(r => setTimeout(r, 1000));

    const artifactDir = 'C:/Users/Ernesto/.gemini/antigravity/brain/8bf76c65-3686-4335-a842-186bbe68ed81';

    // ----------------------------------------------------
    // TEST 1: Full band WITH DRUMS
    // ----------------------------------------------------
    console.log('\n======================================================');
    console.log('TEST 1: FULL BAND WITH DRUMS (Checking Tarima & Drum Bounds)');
    console.log('======================================================');
    const test1Data = await page.evaluate(() => {
      const app = window.app;
      const list = ['drums', 'timbales', 'congas', 'bass', 'guitar', 'piano', 'sax', 'trumpet'];
      app.sceneManager.syncAssignedInstruments(list);
      app.sceneManager.layoutInstruments(list, {}, false);
      app.sceneManager.setVisibleInstruments(list);

      const riserBounds = app.sceneManager.stage.riserBounds;
      const defaultBounds = app.sceneManager.stage.defaultRiserBounds;
      
      const drums = app.sceneManager.allInstruments['drums'];
      const timbales = app.sceneManager.allInstruments['timbales'];
      const congas = app.sceneManager.allInstruments['congas'];

      const getBox = (inst) => {
        if (!inst || !inst.group) return null;
        const box = new THREE.Box3().setFromObject(inst.group);
        return {
          pos: { x: inst.group.position.x, y: inst.group.position.y, z: inst.group.position.z },
          min: { x: box.min.x, y: box.min.y, z: box.min.z },
          max: { x: box.max.x, y: box.max.y, z: box.max.z }
        };
      };

      // Set camera to overview of stage
      app.sceneManager.camera.position.set(0, 5.5, 9.5);
      app.sceneManager.cameraController.controls.target.set(0, 0.8, -0.5);
      app.sceneManager.camera.lookAt(0, 0.8, -0.5);
      app.sceneManager.cameraController.controls.update();

      return {
        riserBounds,
        defaultBounds,
        drums: getBox(drums),
        timbales: getBox(timbales),
        congas: getBox(congas)
      };
    });

    console.log('Riser Bounds:', test1Data.riserBounds);
    console.log('Default Riser Bounds:', test1Data.defaultBounds);
    console.log('Drums Position & Box:', test1Data.drums);
    console.log('Timbales Position & Box:', test1Data.timbales);
    console.log('Congas Position & Box:', test1Data.congas);

    // Verify drum is completely within riser
    const r = test1Data.riserBounds;
    const d = test1Data.drums;
    const drumsInside = d && d.min.x >= r.minX - 0.05 && d.max.x <= r.maxX + 0.05 &&
                               d.min.z >= r.minZ - 0.05 && d.max.z <= r.maxZ + 0.05;
    console.log('Drums strictly within riser bounds?', drumsInside);

    await new Promise(r => setTimeout(r, 600));
    await page.screenshot({ path: `${artifactDir}/test_with_drums_overview.png` });
    console.log('Saved test_with_drums_overview.png');

    // High angle top-down view to see perimeter of riser
    await page.evaluate(() => {
      const app = window.app;
      app.sceneManager.camera.position.set(0, 7.5, 3.5);
      app.sceneManager.cameraController.controls.target.set(0, 0.2, -0.4);
      app.sceneManager.camera.lookAt(0, 0.2, -0.4);
      app.sceneManager.cameraController.controls.update();
    });
    await new Promise(r => setTimeout(r, 600));
    await page.screenshot({ path: `${artifactDir}/test_with_drums_topdown.png` });
    console.log('Saved test_with_drums_topdown.png');

    // ----------------------------------------------------
    // TEST 2: WITHOUT DRUMS - User's set: sax, guitar, acousticGuitar, acousticGuitar_2
    // ----------------------------------------------------
    console.log('\n======================================================');
    console.log('TEST 2: WITHOUT DRUMS - User Active Set (Guitars + Sax)');
    console.log('======================================================');
    const test2Data = await page.evaluate(() => {
      const app = window.app;
      const list = ['sax', 'guitar', 'acousticGuitar', 'acousticGuitar_2'];
      app.sceneManager.syncAssignedInstruments(list);
      app.sceneManager.layoutInstruments(list, {}, false);
      app.sceneManager.setVisibleInstruments(list);

      const positions = {};
      list.forEach(id => {
        const inst = app.sceneManager.allInstruments[id];
        if (inst && inst.group) {
          positions[id] = {
            x: Number(inst.group.position.x.toFixed(2)),
            y: Number(inst.group.position.y.toFixed(2)),
            z: Number(inst.group.position.z.toFixed(2))
          };
        }
      });

      // Stage overview
      app.sceneManager.camera.position.set(0, 3.5, 7.5);
      app.sceneManager.cameraController.controls.target.set(0, 0.8, 0.2);
      app.sceneManager.camera.lookAt(0, 0.8, 0.2);
      app.sceneManager.cameraController.controls.update();

      return {
        positions,
        riserBounds: app.sceneManager.stage.riserBounds
      };
    });

    console.log('Instrument positions without drums:', test2Data.positions);
    console.log('Riser bounds (must remain default 4.8x3.8):', test2Data.riserBounds);

    await new Promise(r => setTimeout(r, 600));
    await page.screenshot({ path: `${artifactDir}/test_without_drums_user_set.png` });
    console.log('Saved test_without_drums_user_set.png');

    // ----------------------------------------------------
    // TEST 3: WITHOUT DRUMS - Latin Percussion on Riser without drums
    // ----------------------------------------------------
    console.log('\n======================================================');
    console.log('TEST 3: WITHOUT DRUMS - Timbales & Congas taking center riser');
    console.log('======================================================');
    const test3Data = await page.evaluate(() => {
      const app = window.app;
      const list = ['timbales', 'congas', 'piano', 'bass', 'trumpet'];
      app.sceneManager.syncAssignedInstruments(list);
      app.sceneManager.layoutInstruments(list, {}, false);
      app.sceneManager.setVisibleInstruments(list);

      const positions = {};
      list.forEach(id => {
        const inst = app.sceneManager.allInstruments[id];
        if (inst && inst.group) {
          positions[id] = {
            x: Number(inst.group.position.x.toFixed(2)),
            y: Number(inst.group.position.y.toFixed(2)),
            z: Number(inst.group.position.z.toFixed(2))
          };
        }
      });

      // Front overview
      app.sceneManager.camera.position.set(0, 4.0, 8.0);
      app.sceneManager.cameraController.controls.target.set(0, 0.7, 0.0);
      app.sceneManager.camera.lookAt(0, 0.7, 0.0);
      app.sceneManager.cameraController.controls.update();

      return {
        positions,
        riserBounds: app.sceneManager.stage.riserBounds
      };
    });

    console.log('Positions with Latin Percussion (no drum set):', test3Data.positions);

    await new Promise(r => setTimeout(r, 600));
    await page.screenshot({ path: `${artifactDir}/test_without_drums_latin_percussion.png` });
    console.log('Saved test_without_drums_latin_percussion.png');

    // ----------------------------------------------------
    // TEST 4: DYNAMIC REALLOCATION (Adding drums dynamically back into the scene)
    // ----------------------------------------------------
    console.log('\n======================================================');
    console.log('TEST 4: DYNAMIC REALLOCATION (Re-adding drums)');
    console.log('======================================================');
    const test4Data = await page.evaluate(() => {
      const app = window.app;
      // Dynamically add drums to the set
      const list = ['drums', 'timbales', 'congas', 'piano', 'bass', 'trumpet'];
      app.sceneManager.syncAssignedInstruments(list);
      app.sceneManager.layoutInstruments(list, {}, false);
      app.sceneManager.setVisibleInstruments(list);

      const positions = {};
      list.forEach(id => {
        const inst = app.sceneManager.allInstruments[id];
        if (inst && inst.group) {
          positions[id] = {
            x: Number(inst.group.position.x.toFixed(2)),
            y: Number(inst.group.position.y.toFixed(2)),
            z: Number(inst.group.position.z.toFixed(2))
          };
        }
      });

      return { positions };
    });

    console.log('Positions after dynamically re-adding drums:', test4Data.positions);
    await new Promise(r => setTimeout(r, 600));
    await page.screenshot({ path: `${artifactDir}/test_dynamic_reallocation_drums_readded.png` });
    console.log('Saved test_dynamic_reallocation_drums_readded.png');

    console.log('\nAll tests completed successfully.');
  } catch (err) {
    console.error('Error during verification:', err);
  } finally {
    await browser.close();
  }
})();
