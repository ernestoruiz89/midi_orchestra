const path = require('path');
const puppeteer = require(path.resolve(process.cwd(), 'node_modules/puppeteer'));

(async () => {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    const consoleLogs = [];
    page.on('console', msg => consoleLogs.push(`[${msg.type()}] ${msg.text()}`));
    page.on('pageerror', err => console.log('PAGE ERROR:', err.stack || err.message));
    page.on('error', err => console.log('ERROR:', err));
    await page.setViewport({ width: 1400, height: 900 });

    console.log('Loading app at http://localhost:5173/?song=zarathustra_timpani&camera=timpani ...');
    await page.goto('http://localhost:5173/?song=zarathustra_timpani&camera=timpani', {
      waitUntil: 'domcontentloaded',
      timeout: 30000
    });

    for (let i = 0; i < 40; i++) {
      const ready = await page.evaluate(() => !!(window.app && window.app.sceneManager && window.app.midiPlayer));
      if (ready) break;
      await new Promise(r => setTimeout(r, 500));
    }
    await new Promise(r => setTimeout(r, 1500));

    const artifactDir = 'C:/Users/Ernesto/.gemini/antigravity/brain/8bf76c65-3686-4335-a842-186bbe68ed81';

    // 1. Inspect Timpani instance
    const timpaniInfo = await page.evaluate(() => {
      const app = window.app;
      const timpani = app.sceneManager.allInstruments['timpani'];
      if (!timpani) return { found: false };

      const drumPositions = timpani.drums.map((d, i) => ({
        id: i,
        name: d.cfg.name,
        radius: d.cfg.radius,
        minMidi: d.cfg.minMidi,
        maxMidi: d.cfg.maxMidi,
        basePitchMidi: d.cfg.basePitchMidi,
        arcAngle: d.cfg.arcAngle
      }));

      const groupPos = {
        x: timpani.group.position.x,
        y: timpani.group.position.y,
        z: timpani.group.position.z
      };

      const malletsCount = timpani.malletsByDrum.length;

      return {
        found: true,
        groupPos,
        drumCount: timpani.drums.length,
        malletsCount,
        drumPositions
      };
    });

    console.log('Timpani 3D Info:', JSON.stringify(timpaniInfo, null, 2));

    // Capture resting view
    await page.screenshot({ path: path.join(artifactDir, 'timpani_idle.png') });
    console.log('Saved timpani_idle.png');

    // Switch to topdown camera
    await page.evaluate(() => {
      window.app.sceneManager.cameraController.setPreset('timpani_topdown');
    });
    await new Promise(r => setTimeout(r, 1200));
    await page.screenshot({ path: path.join(artifactDir, 'timpani_topdown.png') });
    console.log('Saved timpani_topdown.png');

    // Switch to closeup camera
    await page.evaluate(() => {
      window.app.sceneManager.cameraController.setPreset('timpani_closeup');
    });
    await new Promise(r => setTimeout(r, 1200));
    await page.screenshot({ path: path.join(artifactDir, 'timpani_closeup.png') });
    console.log('Saved timpani_closeup.png');

    // Switch back to timpani perspective and trigger live strikes
    await page.evaluate(() => {
      window.app.sceneManager.cameraController.setPreset('timpani');
      const timpani = window.app.sceneManager.allInstruments['timpani'];
      // Strike alternating C2 (36) and G2 (43) on 32" and 29" kettles
      timpani.onNoteOn(36, 0.95);
      setTimeout(() => timpani.onNoteOn(43, 0.95), 80);
      setTimeout(() => timpani.onNoteOn(36, 0.98), 160);
      setTimeout(() => timpani.onNoteOn(43, 0.98), 240);
    });
    await new Promise(r => setTimeout(r, 180));
    await page.screenshot({ path: path.join(artifactDir, 'timpani_playing.png') });
    console.log('Saved timpani_playing.png');

    // Also test close-up playing action
    await page.evaluate(() => {
      window.app.sceneManager.cameraController.setPreset('timpani_closeup');
      const timpani = window.app.sceneManager.allInstruments['timpani'];
      timpani.onNoteOn(36, 1.0);
      setTimeout(() => timpani.onNoteOn(43, 1.0), 90);
    });
    await new Promise(r => setTimeout(r, 1200));
    await page.evaluate(() => {
      const timpani = window.app.sceneManager.allInstruments['timpani'];
      timpani.onNoteOn(36, 1.0);
    });
    await new Promise(r => setTimeout(r, 45));
    await page.screenshot({ path: path.join(artifactDir, 'timpani_closeup_strike.png') });
    console.log('Saved timpani_closeup_strike.png');

    // Check console logs for any errors
    const errors = consoleLogs.filter(l => l.includes('[error]') || l.includes('Error') || l.includes('THREE.WebGLProgram'));
    console.log(`\nTotal console messages: ${consoleLogs.length}`);
    if (errors.length > 0) {
      console.log('Console errors found:');
      errors.forEach(e => console.log('  ', e));
    } else {
      console.log('Zero console errors detected!');
    }

  } catch (err) {
    console.error('Test error:', err);
  } finally {
    await browser.close();
  }
})();
