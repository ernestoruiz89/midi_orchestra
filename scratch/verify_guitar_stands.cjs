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
    await page.setViewport({ width: 1200, height: 800 });

    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle0', timeout: 30000 });
    await new Promise(r => setTimeout(r, 1500));

    // TEST 1: The user's active set ['sax', 'guitar', 'acousticGuitar', 'acousticGuitar_2']
    // Framing Acoustic Guitars clearly from the side/front showing stand base on the floor
    console.log('\n--- TEST 1: Acoustic Guitars Stand Bases ---');
    await page.evaluate(() => {
      const app = window.app;
      const activeList = ['sax', 'guitar', 'acousticGuitar', 'acousticGuitar_2'];
      app.sceneManager.syncAssignedInstruments(activeList);
      app.sceneManager.layoutInstruments(activeList, {}, false);
      app.sceneManager.setVisibleInstruments(activeList);

      const ag = app.sceneManager.allInstruments['acousticGuitar'];
      const targetX = ag ? ag.group.position.x : 3.46;
      const targetZ = ag ? ag.group.position.z : -1.10;

      // Position camera to get a clear low-angle view of the base of both acoustic guitars
      app.sceneManager.camera.position.set(targetX + 1.6, 0.65, targetZ + 2.2);
      app.sceneManager.cameraController.controls.target.set(targetX, 0.45, targetZ);
      app.sceneManager.camera.lookAt(targetX, 0.45, targetZ);
      app.sceneManager.cameraController.controls.update();
    });

    await new Promise(r => setTimeout(r, 800));

    await page.screenshot({
      path: 'C:/Users/Ernesto/.gemini/antigravity/brain/8bf76c65-3686-4335-a842-186bbe68ed81/acoustic_guitars_base_verified.png'
    });
    console.log('Saved acoustic_guitars_base_verified.png');

    // TEST 2: Electric Guitar Stand Base on Floor
    console.log('\n--- TEST 2: Electric Guitar Stand Base ---');
    await page.evaluate(() => {
      const app = window.app;
      const eg = app.sceneManager.allInstruments['guitar'];
      const targetX = eg ? eg.group.position.x : -3.20;
      const targetZ = eg ? eg.group.position.z : 1.0;

      app.sceneManager.camera.position.set(targetX + 1.2, 0.55, targetZ + 1.8);
      app.sceneManager.cameraController.controls.target.set(targetX, 0.40, targetZ);
      app.sceneManager.camera.lookAt(targetX, 0.40, targetZ);
      app.sceneManager.cameraController.controls.update();
    });

    await new Promise(r => setTimeout(r, 800));

    await page.screenshot({
      path: 'C:/Users/Ernesto/.gemini/antigravity/brain/8bf76c65-3686-4335-a842-186bbe68ed81/electric_guitar_base_verified.png'
    });
    console.log('Saved electric_guitar_base_verified.png');

    // TEST 3: Guitars placed ON the elevated platform (riser elevation = 0.20)
    console.log('\n--- TEST 3: Guitars on Elevated Platform ---');
    await page.evaluate(() => {
      const app = window.app;
      const eg = app.sceneManager.allInstruments['guitar'];
      const ag = app.sceneManager.allInstruments['acousticGuitar'];

      // Intentionally place them on the riser platform (x=0, z=0 is on the riser deck where elevation = 0.20)
      if (eg) eg.group.position.set(-0.8, 0.98, 0.0);
      if (ag) ag.group.position.set(0.8, 1.10, 0.0);

      // Frame both on the riser platform from low angle
      app.sceneManager.camera.position.set(0, 0.65, 2.5);
      app.sceneManager.cameraController.controls.target.set(0, 0.50, 0.0);
      app.sceneManager.camera.lookAt(0, 0.50, 0.0);
      app.sceneManager.cameraController.controls.update();
    });

    await new Promise(r => setTimeout(r, 800));

    await page.screenshot({
      path: 'C:/Users/Ernesto/.gemini/antigravity/brain/8bf76c65-3686-4335-a842-186bbe68ed81/guitars_on_riser_verified.png'
    });
    console.log('Saved guitars_on_riser_verified.png');

    // TEST 4: Load Creedence Clearwater Revival (default demo song) full stage overview
    console.log('\n--- TEST 4: CCR Default Demo Stage View ---');
    await page.evaluate(async () => {
      await window.app.uiManager.loadDemoSong('ccr_have_you_ever_seen_the_rain', { autoplay: false });
      const btn = document.querySelector('[data-preset="stage"]');
      if (btn) btn.click();
    });

    await new Promise(r => setTimeout(r, 1200));

    await page.screenshot({
      path: 'C:/Users/Ernesto/.gemini/antigravity/brain/8bf76c65-3686-4335-a842-186bbe68ed81/ccr_stage_guitars_verified.png'
    });
    console.log('Saved ccr_stage_guitars_verified.png');

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await browser.close();
  }
})();
