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

    // Inspect the bass drum and pedal
    const data = await page.evaluate(() => {
      const app = window.app;
      const drums = app.sceneManager.allInstruments['drums'];
      const drumPos = drums.group.position;

      // Disable director/autoRotate
      app.sceneManager.cameraController.directorMode = false;
      app.sceneManager.cameraController.autoRotate = false;
      window.gsap.killTweensOf(app.sceneManager.camera.position);
      window.gsap.killTweensOf(app.sceneManager.cameraController.controls.target);

      app.sceneManager.cameraController.isTransitioning = false;
      app.sceneManager.cameraController.controls.enabled = true;

      // Find bass drum group
      let bassGroup = null;
      drums.group.children.forEach(c => {
        if (c.isGroup && c.children.length >= 10 && c.position.y === 0.50) {
          bassGroup = c;
        }
      });

      // Front view of bass drum
      app.sceneManager.cameraController.controls.target.set(drumPos.x, drumPos.y + 0.50, drumPos.z);
      app.sceneManager.camera.position.set(drumPos.x, drumPos.y + 0.60, drumPos.z + 2.4);
      app.sceneManager.camera.lookAt(drumPos.x, drumPos.y + 0.50, drumPos.z);
      app.sceneManager.cameraController.controls.update();

      return {
        drumPos,
        beaterPivotExists: !!drums.beaterPivot,
        beaterRot: drums.beaterPivot ? { x: drums.beaterPivot.rotation.x, y: drums.beaterPivot.rotation.y, z: drums.beaterPivot.rotation.z } : null
      };
    });

    console.log('Bass drum data:', data);

    await new Promise(r => setTimeout(r, 500));
    await page.screenshot({ path: `${artifactDir}/kick_front_rest.png` });
    console.log('Saved kick_front_rest.png');

    // Trigger kick hit and take screenshot immediately at hit point
    await page.evaluate(() => {
      const drums = window.app.sceneManager.allInstruments['drums'];
      drums.onNoteOn('kick', 1.0);
    });
    await new Promise(r => setTimeout(r, 45)); // at peak strike duration 0.045
    await page.screenshot({ path: `${artifactDir}/kick_front_strike.png` });
    console.log('Saved kick_front_strike.png');

    // Side view of kick pedal and bass drum to see ground level and spurs
    await page.evaluate(() => {
      const app = window.app;
      const drums = app.sceneManager.allInstruments['drums'];
      const drumPos = drums.group.position;

      app.sceneManager.cameraController.controls.target.set(drumPos.x, drumPos.y + 0.20, drumPos.z);
      app.sceneManager.camera.position.set(drumPos.x + 1.8, drumPos.y + 0.35, drumPos.z + 0.4);
      app.sceneManager.camera.lookAt(drumPos.x, drumPos.y + 0.20, drumPos.z);
      app.sceneManager.cameraController.controls.update();
    });

    await new Promise(r => setTimeout(r, 500));
    await page.screenshot({ path: `${artifactDir}/kick_side_view.png` });
    console.log('Saved kick_side_view.png');

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await browser.close();
  }
})();
