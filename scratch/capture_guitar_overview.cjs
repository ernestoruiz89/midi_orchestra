const path = require('path');
const puppeteer = require(path.resolve(process.cwd(), 'node_modules/puppeteer'));

(async () => {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 960, height: 720 });

    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle0', timeout: 30000 });
    await new Promise(r => setTimeout(r, 1500));

    // Recreate the scene setup with sax, guitar, acousticGuitar, and acousticGuitar_2
    await page.evaluate(() => {
      const app = window.app;
      const activeList = ['sax', 'guitar', 'acousticGuitar', 'acousticGuitar_2'];
      app.sceneManager.syncAssignedInstruments(activeList);
      app.sceneManager.layoutInstruments(activeList, {}, false);
      app.sceneManager.setVisibleInstruments(activeList);

      // Low-angle perspective looking across the stage floor and riser
      app.sceneManager.camera.position.set(1.8, 1.2, 3.8);
      app.sceneManager.cameraController.controls.target.set(0.5, 0.7, 0.0);
      app.sceneManager.camera.lookAt(0.5, 0.7, 0.0);
      app.sceneManager.cameraController.controls.update();
    });

    await new Promise(r => setTimeout(r, 800));

    await page.screenshot({
      path: 'C:/Users/Ernesto/.gemini/antigravity/brain/8bf76c65-3686-4335-a842-186bbe68ed81/guitar_stand_base_stage_overview.png'
    });
    console.log('Saved guitar_stand_base_stage_overview.png');

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await browser.close();
  }
})();
