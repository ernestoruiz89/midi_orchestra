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
    await page.setViewport({ width: 1200, height: 900 });

    await page.goto('http://localhost:5173/', { waitUntil: 'domcontentloaded', timeout: 30000 });
    for (let i = 0; i < 30; i++) {
      const ready = await page.evaluate(() => !!(window.app && window.app.sceneManager));
      if (ready) break;
      await new Promise(r => setTimeout(r, 500));
    }
    await new Promise(r => setTimeout(r, 1000));

    const artifactDir = 'C:/Users/Ernesto/.gemini/antigravity/brain/8bf76c65-3686-4335-a842-186bbe68ed81';

    // Position camera close to the hi-hat pedal
    await page.evaluate(() => {
      const app = window.app;
      const list = ['drums'];
      app.sceneManager.syncAssignedInstruments(list);
      app.sceneManager.layoutInstruments(list, {}, false);
      app.sceneManager.setVisibleInstruments(list);

      const drums = app.sceneManager.allInstruments['drums'];
      // Hihat pos in DrumKit3D is (-0.82, 0, 0.35) relative to drums group
      const drumPos = drums.group.position;
      const hihatWorldX = drumPos.x - 0.82;
      const hihatWorldY = drumPos.y;
      const hihatWorldZ = drumPos.z + 0.35;

      app.sceneManager.cameraController.directorMode = false;
      app.sceneManager.cameraController.autoRotate = false;
      window.gsap.killTweensOf(app.sceneManager.camera.position);
      window.gsap.killTweensOf(app.sceneManager.cameraController.controls.target);

      app.sceneManager.cameraController.isTransitioning = false;
      app.sceneManager.cameraController.controls.enabled = true;
      app.sceneManager.cameraController.controls.target.set(hihatWorldX + 0.05, hihatWorldY + 0.06, hihatWorldZ + 0.10);
      app.sceneManager.camera.position.set(hihatWorldX + 0.28, hihatWorldY + 0.30, hihatWorldZ + 0.38);
      app.sceneManager.camera.lookAt(hihatWorldX + 0.05, hihatWorldY + 0.06, hihatWorldZ + 0.10);
      app.sceneManager.cameraController.controls.update();
    });

    await new Promise(r => setTimeout(r, 800));
    await page.screenshot({ path: `${artifactDir}/hihat_pedal_before.png` });
    console.log('Saved hihat_pedal_before.png');

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await browser.close();
  }
})();
