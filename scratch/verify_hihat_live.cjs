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
    page.on('pageerror', err => console.log('PAGE ERROR:', err.message));
    await page.setViewport({ width: 1400, height: 1000 });

    await page.goto('http://localhost:5173/', { waitUntil: 'domcontentloaded', timeout: 30000 });
    for (let i = 0; i < 30; i++) {
      const ready = await page.evaluate(() => !!(window.app && window.app.sceneManager));
      if (ready) break;
      await new Promise(r => setTimeout(r, 500));
    }
    await new Promise(r => setTimeout(r, 1000));

    const artifactDir = 'C:/Users/Ernesto/.gemini/antigravity/brain/8bf76c65-3686-4335-a842-186bbe68ed81';

    // 1. Check live hi-hat pedal and stand in actual production code
    console.log('\n--- TEST 1: Hi-Hat Pedal Live Close-up ---');
    const liveData = await page.evaluate(() => {
      const app = window.app;
      const drums = app.sceneManager.allInstruments['drums'];
      const drumPos = drums.group.position;
      const hihatWorldX = drumPos.x - 0.82;
      const hihatWorldY = drumPos.y;
      const hihatWorldZ = drumPos.z + 0.35;

      // Ensure camera controls don't override
      app.sceneManager.cameraController.directorMode = false;
      app.sceneManager.cameraController.autoRotate = false;
      window.gsap.killTweensOf(app.sceneManager.camera.position);
      window.gsap.killTweensOf(app.sceneManager.cameraController.controls.target);

      app.sceneManager.cameraController.isTransitioning = false;
      app.sceneManager.cameraController.controls.enabled = true;

      // Close-up angle framing the pedal, stand base, and chain
      app.sceneManager.cameraController.controls.target.set(hihatWorldX + 0.10, hihatWorldY + 0.05, hihatWorldZ + 0.14);
      app.sceneManager.camera.position.set(hihatWorldX + 0.34, hihatWorldY + 0.34, hihatWorldZ + 0.42);
      app.sceneManager.camera.lookAt(hihatWorldX + 0.10, hihatWorldY + 0.05, hihatWorldZ + 0.14);
      app.sceneManager.cameraController.controls.update();

      const box = new THREE.Box3().setFromObject(drums.group);
      const riser = app.sceneManager.stage.riserBounds;

      return {
        hasFootboard: !!drums.hihatPedalFootboard,
        footboardRotX: drums.hihatPedalFootboard ? drums.hihatPedalFootboard.rotation.x : null,
        kitBounds: { min: box.min, max: box.max },
        riserBounds: riser
      };
    });

    console.log('Live Data:', liveData);

    await new Promise(r => setTimeout(r, 600));
    await page.screenshot({ path: `${artifactDir}/hihat_pedal_final_closeup.png` });
    console.log('Saved hihat_pedal_final_closeup.png');

    // 2. Drummer's Point of View (looking down-forward at the pedals)
    console.log('\n--- TEST 2: Drummer POV ---');
    await page.evaluate(() => {
      const app = window.app;
      const drums = app.sceneManager.allInstruments['drums'];
      const drumPos = drums.group.position;
      const hihatWorldX = drumPos.x - 0.82;
      const hihatWorldY = drumPos.y;
      const hihatWorldZ = drumPos.z + 0.35;

      // Drummer seat perspective
      app.sceneManager.cameraController.controls.target.set(drumPos.x - 0.35, drumPos.y + 0.20, drumPos.z + 0.30);
      app.sceneManager.camera.position.set(drumPos.x, drumPos.y + 1.20, drumPos.z + 0.95);
      app.sceneManager.camera.lookAt(drumPos.x - 0.35, drumPos.y + 0.20, drumPos.z + 0.30);
      app.sceneManager.cameraController.controls.update();
    });

    await new Promise(r => setTimeout(r, 600));
    await page.screenshot({ path: `${artifactDir}/hihat_pedal_final_drummer_view.png` });
    console.log('Saved hihat_pedal_final_drummer_view.png');

    // 3. Test Pedal Animation
    console.log('\n--- TEST 3: Trigger Hi-Hat Pedal Stroke ---');
    await page.evaluate(() => {
      const drums = window.app.sceneManager.allInstruments['drums'];
      if (drums) {
        drums.onNoteOn('hihatPedal', 0.9);
      }
    });
    await new Promise(r => setTimeout(r, 100)); // capture mid-stroke
    await page.screenshot({ path: `${artifactDir}/hihat_pedal_final_action.png` });
    console.log('Saved hihat_pedal_final_action.png');

    // 4. Macro View of Pedal Mechanism
    console.log('\n--- TEST 4: Macro Mechanism View ---');
    await page.evaluate(() => {
      const app = window.app;
      const drums = app.sceneManager.allInstruments['drums'];
      const drumPos = drums.group.position;
      const hihatWorldX = drumPos.x - 0.82;
      const hihatWorldY = drumPos.y;
      const hihatWorldZ = drumPos.z + 0.35;

      app.sceneManager.camera.position.set(hihatWorldX + 0.18, hihatWorldY + 0.18, hihatWorldZ + 0.26);
      app.sceneManager.cameraController.controls.target.set(hihatWorldX + 0.09, hihatWorldY + 0.03, hihatWorldZ + 0.13);
      app.sceneManager.camera.lookAt(hihatWorldX + 0.09, hihatWorldY + 0.03, hihatWorldZ + 0.13);
      app.sceneManager.cameraController.controls.update();
    });
    await new Promise(r => setTimeout(r, 500));
    await page.screenshot({ path: `${artifactDir}/hihat_pedal_final_macro.png` });
    console.log('Saved hihat_pedal_final_macro.png');

    console.log('\nAll live tests finished successfully!');
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await browser.close();
  }
})();
