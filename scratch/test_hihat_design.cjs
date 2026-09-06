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
    await page.setViewport({ width: 1400, height: 1000 });

    await page.goto('http://localhost:5173/', { waitUntil: 'domcontentloaded', timeout: 30000 });
    for (let i = 0; i < 30; i++) {
      const ready = await page.evaluate(() => !!(window.app && window.app.sceneManager));
      if (ready) break;
      await new Promise(r => setTimeout(r, 500));
    }
    await new Promise(r => setTimeout(r, 1000));

    const artifactDir = 'C:/Users/Ernesto/.gemini/antigravity/brain/8bf76c65-3686-4335-a842-186bbe68ed81';

    // Inject prototype and test animation
    await page.evaluate(() => {
      const app = window.app;
      const drums = app.sceneManager.allInstruments['drums'];
      const drumPos = drums.group.position;
      const hihatWorldX = drumPos.x - 0.82;
      const hihatWorldY = drumPos.y;
      const hihatWorldZ = drumPos.z + 0.35;

      let standGroup = null;
      drums.group.traverse(child => {
        if (child.isGroup && Math.abs(child.position.x - (-0.82)) < 0.01 && Math.abs(child.position.z - 0.35) < 0.01) {
          standGroup = child;
        }
      });

      if (standGroup) {
        standGroup.children.forEach(c => {
          if (c.isGroup && c.children.length > 5) {
            c.rotation.y = 2.20; // optimal clearance for tripod legs
          }
        });

        const toRemove = [];
        standGroup.children.forEach(c => {
          if (c.isGroup && c.position.y === 0 && (c.position.x > 0.01 || c.children.length === 5)) {
            toRemove.push(c);
          }
        });
        toRemove.forEach(c => standGroup.remove(c));

        const chromeMat = drums.chromeMaterial;
        const blackMat = drums.blackTrimMaterial;

        const footboardMat = new THREE.MeshStandardMaterial({
          color: 0xdde2ea,
          metalness: 0.88,
          roughness: 0.20,
          envMapIntensity: 1.2
        });

        const accentMat = new THREE.MeshStandardMaterial({
          color: 0x22252a,
          metalness: 0.6,
          roughness: 0.45
        });

        // 1. Stand Base Collar & Spring Tension Housing at (0, 0, 0)
        const baseCollar = new THREE.Mesh(
          new THREE.CylinderGeometry(0.018, 0.018, 0.042, 16),
          chromeMat
        );
        baseCollar.position.y = 0.028;
        standGroup.add(baseCollar);

        const pedalAngle = 0.72; // rad (~41 deg), perfect angle towards drummer's left foot
        const springHousing = new THREE.Group();
        springHousing.rotation.y = pedalAngle;

        const springCylinder = new THREE.Mesh(
          new THREE.CylinderGeometry(0.014, 0.014, 0.045, 14),
          chromeMat
        );
        springCylinder.position.set(0, 0.038, 0.022);
        springHousing.add(springCylinder);

        const knurledDial = new THREE.Mesh(
          new THREE.CylinderGeometry(0.017, 0.017, 0.010, 16),
          blackMat
        );
        knurledDial.position.set(0, 0.062, 0.022);
        springHousing.add(knurledDial);

        const chainGuide = new THREE.Mesh(
          new THREE.BoxGeometry(0.016, 0.018, 0.014),
          chromeMat
        );
        chainGuide.position.set(0, 0.015, 0.022);
        springHousing.add(chainGuide);

        standGroup.add(springHousing);

        // 2. Pedal Assembly
        const heelDist = 0.29;
        const heelX = Math.sin(pedalAngle) * heelDist;
        const heelZ = Math.cos(pedalAngle) * heelDist;

        const pedalGroup = new THREE.Group();
        pedalGroup.position.set(heelX, 0, heelZ);
        pedalGroup.rotation.y = pedalAngle + Math.PI;
        standGroup.add(pedalGroup);

        // Radius Rods
        [-0.030, 0.030].forEach(rx => {
          const rodLen = heelDist - 0.03;
          const rod = new THREE.Mesh(
            new THREE.CylinderGeometry(0.0035, 0.0035, rodLen, 8),
            chromeMat
          );
          rod.rotation.x = Math.PI / 2;
          rod.position.set(rx, 0.008, rodLen / 2 + 0.015);
          pedalGroup.add(rod);

          const clampLug = new THREE.Mesh(
            new THREE.BoxGeometry(0.010, 0.014, 0.014),
            chromeMat
          );
          clampLug.position.set(rx, 0.010, rodLen + 0.015);
          pedalGroup.add(clampLug);
        });

        // Die-cast Heel Plate
        const heelPlateGroup = new THREE.Group();
        const heelRubber = new THREE.Mesh(
          new THREE.BoxGeometry(0.080, 0.004, 0.065),
          blackMat
        );
        heelRubber.position.set(0, 0.002, 0.015);
        heelPlateGroup.add(heelRubber);

        const heelMetal = new THREE.Mesh(
          new THREE.BoxGeometry(0.076, 0.010, 0.060),
          chromeMat
        );
        heelMetal.position.set(0, 0.008, 0.015);
        heelPlateGroup.add(heelMetal);

        const heelTread = new THREE.Mesh(
          new THREE.BoxGeometry(0.056, 0.003, 0.038),
          accentMat
        );
        heelTread.position.set(0, 0.014, 0.015);
        heelPlateGroup.add(heelTread);

        [-0.032, 0.032].forEach(px => {
          const post = new THREE.Mesh(
            new THREE.BoxGeometry(0.011, 0.018, 0.016),
            chromeMat
          );
          post.position.set(px, 0.016, 0.042);
          heelPlateGroup.add(post);
        });

        const axlePin = new THREE.Mesh(
          new THREE.CylinderGeometry(0.0045, 0.0045, 0.076, 10),
          chromeMat
        );
        axlePin.rotation.z = Math.PI / 2;
        axlePin.position.set(0, 0.019, 0.042);
        heelPlateGroup.add(axlePin);

        pedalGroup.add(heelPlateGroup);

        // 3. Footboard Pivot & Extruded Tapered Pedal Plate
        const footboardPivot = new THREE.Group();
        footboardPivot.position.set(0, 0.019, 0.042);

        const shape = new THREE.Shape();
        const fl = 0.205;
        shape.moveTo(-0.026, 0);
        shape.lineTo(-0.026, 0.03);
        shape.lineTo(-0.037, fl * 0.65);
        shape.lineTo(-0.033, fl * 0.90);
        shape.quadraticCurveTo(-0.018, fl, 0, fl + 0.005);
        shape.quadraticCurveTo(0.018, fl, 0.033, fl * 0.90);
        shape.lineTo(0.037, fl * 0.65);
        shape.lineTo(0.026, 0.03);
        shape.lineTo(0.026, 0);
        shape.closePath();

        const extrudeSettings = {
          steps: 1,
          depth: 0.007,
          bevelEnabled: true,
          bevelThickness: 0.0025,
          bevelSize: 0.002,
          bevelSegments: 3
        };

        const footboardGeom = new THREE.ExtrudeGeometry(shape, extrudeSettings);
        footboardGeom.rotateX(Math.PI / 2);

        const footboardMesh = new THREE.Mesh(footboardGeom, footboardMat);
        footboardMesh.castShadow = true;
        footboardPivot.add(footboardMesh);

        // Traction Ridges
        for (let i = 0; i < 6; i++) {
          const rz = 0.05 + i * 0.024;
          const rw = 0.044 + (i * 0.0035);
          const ridge = new THREE.Mesh(
            new THREE.BoxGeometry(rw, 0.0025, 0.006),
            accentMat
          );
          ridge.position.set(0, 0.008, rz);
          footboardPivot.add(ridge);
        }

        const centerStripe = new THREE.Mesh(
          new THREE.BoxGeometry(0.006, 0.002, 0.12),
          accentMat
        );
        centerStripe.position.set(0, 0.008, 0.10);
        footboardPivot.add(centerStripe);

        const toeStopper = new THREE.Mesh(
          new THREE.BoxGeometry(0.036, 0.018, 0.006),
          chromeMat
        );
        toeStopper.position.set(0, 0.014, fl - 0.006);
        toeStopper.rotation.x = -0.15;
        footboardPivot.add(toeStopper);

        const chainClevis = new THREE.Mesh(
          new THREE.BoxGeometry(0.014, 0.012, 0.016),
          chromeMat
        );
        chainClevis.position.set(0, 0.004, fl);
        footboardPivot.add(chainClevis);

        // Chain
        const chainGroup = new THREE.Group();
        const linkCount = 7;
        for (let i = 0; i < linkCount; i++) {
          const t = i / (linkCount - 1);
          const cy = 0.008 + Math.pow(t, 1.4) * 0.024;
          const cz = fl + t * 0.025;
          const link = new THREE.Mesh(
            new THREE.BoxGeometry(0.008, 0.005, 0.006),
            chromeMat
          );
          link.position.set(0, cy, cz);
          chainGroup.add(link);

          const pin = new THREE.Mesh(
            new THREE.CylinderGeometry(0.002, 0.002, 0.012, 6),
            accentMat
          );
          pin.rotation.z = Math.PI / 2;
          pin.position.set(0, cy, cz);
          chainGroup.add(pin);
        }
        footboardPivot.add(chainGroup);

        footboardPivot.rotation.x = -0.04;
        pedalGroup.add(footboardPivot);

        drums.hihatPedalFootboard = footboardPivot;
      }

      // Camera
      app.sceneManager.cameraController.directorMode = false;
      app.sceneManager.cameraController.autoRotate = false;
      window.gsap.killTweensOf(app.sceneManager.camera.position);
      window.gsap.killTweensOf(app.sceneManager.cameraController.controls.target);

      app.sceneManager.cameraController.isTransitioning = false;
      app.sceneManager.cameraController.controls.enabled = true;
      app.sceneManager.cameraController.controls.target.set(hihatWorldX + 0.10, hihatWorldY + 0.05, hihatWorldZ + 0.14);
      app.sceneManager.camera.position.set(hihatWorldX + 0.34, hihatWorldY + 0.34, hihatWorldZ + 0.42);
      app.sceneManager.camera.lookAt(hihatWorldX + 0.10, hihatWorldY + 0.05, hihatWorldZ + 0.14);
      app.sceneManager.cameraController.controls.update();
    });

    await new Promise(r => setTimeout(r, 600));
    await page.screenshot({ path: `${artifactDir}/hihat_pedal_closed.png` });
    console.log('Saved hihat_pedal_closed.png');

    // Test OPEN state (pedal up)
    await page.evaluate(() => {
      const drums = window.app.sceneManager.allInstruments['drums'];
      if (drums && drums.hihatPedalFootboard) {
        drums.hihatPedalFootboard.rotation.x = -0.16;
      }
    });
    await new Promise(r => setTimeout(r, 400));
    await page.screenshot({ path: `${artifactDir}/hihat_pedal_open.png` });
    console.log('Saved hihat_pedal_open.png');

    // Macro close-up
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
    await page.screenshot({ path: `${artifactDir}/hihat_pedal_macro.png` });
    console.log('Saved hihat_pedal_macro.png');

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await browser.close();
  }
})();
