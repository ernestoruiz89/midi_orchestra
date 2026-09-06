const path = require('path');
const puppeteer = require(path.resolve(process.cwd(), 'node_modules/puppeteer'));

(async () => {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    await page.setViewport({ width: 720, height: 720 });

    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle0', timeout: 30000 });
    await new Promise(r => setTimeout(r, 1500));

    await page.evaluate(() => {
      const app = window.app;
      const activeList = ['sax', 'guitar', 'acousticGuitar', 'acousticGuitar_2'];
      app.sceneManager.syncAssignedInstruments(activeList);
      app.sceneManager.layoutInstruments(activeList, {}, false);
      app.sceneManager.setVisibleInstruments(activeList);

      ['guitar', 'acousticGuitar', 'acousticGuitar_2'].forEach(k => {
        const inst = app.sceneManager.allInstruments[k];
        if (!inst) return;
        const floorElev = app.sceneManager.getStageFloorElevation(inst.group.position.x, inst.group.position.z);
        console.log(`INSTRUMENT ${k}: pos=(${inst.group.position.x.toFixed(2)}, ${inst.group.position.y.toFixed(2)}, ${inst.group.position.z.toFixed(2)}), floorElev=${floorElev}`);
      });

      // Camera view matching the user's uploaded photo framing
      app.sceneManager.camera.position.set(0.6, 1.8, 3.2);
      app.sceneManager.cameraController.controls.target.set(0.8, 1.0, 0.4);
      app.sceneManager.camera.lookAt(0.8, 1.0, 0.4);
      app.sceneManager.cameraController.controls.update();
    });

    await new Promise(r => setTimeout(r, 800));

    await page.screenshot({
      path: 'C:/Users/Ernesto/.gemini/antigravity/brain/8bf76c65-3686-4335-a842-186bbe68ed81/test_reproduce_after.png'
    });
    console.log('Saved test_reproduce_after.png');

  } catch (err) {
    console.error(err);
  } finally {
    await browser.close();
  }
})();
