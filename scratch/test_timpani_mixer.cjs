const path = require('path');
const puppeteer = require(path.resolve(process.cwd(), 'node_modules/puppeteer'));

(async () => {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1400, height: 900 });

    await page.goto('http://localhost:5173/?song=zarathustra_timpani&camera=timpani', {
      waitUntil: 'domcontentloaded',
      timeout: 30000
    });

    for (let i = 0; i < 40; i++) {
      const ready = await page.evaluate(() => !!(window.app && window.app.uiManager));
      if (ready) break;
      await new Promise(r => setTimeout(r, 500));
    }
    await new Promise(r => setTimeout(r, 1000));

    const artifactDir = 'C:/Users/Ernesto/.gemini/antigravity/brain/8bf76c65-3686-4335-a842-186bbe68ed81';

    // Switch to Spanish and open mixer
    await page.evaluate(() => {
      window.app.uiManager.setLanguage('es');
      const mixerBtn = document.getElementById('btn-mixer');
      if (mixerBtn) mixerBtn.click();
    });
    await new Promise(r => setTimeout(r, 800));

    await page.screenshot({ path: path.join(artifactDir, 'timpani_mixer_es.png') });
    console.log('Saved timpani_mixer_es.png');

  } catch (err) {
    console.error('Mixer test error:', err);
  } finally {
    await browser.close();
  }
})();
