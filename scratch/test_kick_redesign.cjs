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

    // Prototype the grounded bass drum, spurs touching the floor, and realistic kick pedal with footboard animation
    await page.evaluate(() => {
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

      // Find bassGroup
      let bassGroup = null;
      drums.group.children.forEach(c => {
        if (c.isGroup && c.children.length >= 10 && Math.abs(c.position.y - 0.50) < 0.05) {
          bassGroup = c;
        }
      });

      console.log('Found bassGroup?', !!bassGroup);
      if (!bassGroup) return;

      // Bass drum center height: lower slightly so the bottom hoop sits 2cm above the floor
      const radius = 0.43;
      const depth = 0.40;
      const bassY = radius + 0.025; // 0.455m center height
      bassGroup.position.set(0, bassY, -depth / 2);
      drums.drumRecoilNodes.kick = { node: bassGroup, baseY: bassGroup.position.y };

      // Rebuild spurs so their feet sit solidly on the floor (y = 0 in world = y = -bassY in bassGroup)
      // Remove old spurs (they were added as meshes in bassGroup)
      // Old spurs: brackets were at side*(radius+0.005), -0.12, depth*0.22
      const toRemove = [];
      bassGroup.children.forEach(child => {
        // Find old pedalGroup
        if (child.isGroup && child.children.some(ch => ch.geometry && ch.geometry.type === 'BoxGeometry' && ch.position.z === 0.02)) {
          toRemove.push(child);
        }
      });
      toRemove.forEach(c => bassGroup.remove(c));

      // Also adjust existing spur meshes if found, or add new grounded spurs
      // Let's find spur legs and update their position
      bassGroup.children.forEach(child => {
        if (child.isMesh && child.geometry && child.geometry.type === 'CylinderGeometry') {
          // Check if it's a spur leg (radius ~ 0.01)
          if (child.geometry.parameters && child.geometry.parameters.radiusTop === 0.01) {
            toRemove.push(child);
          }
          if (child.geometry.parameters && child.geometry.parameters.radiusTop === 0.016) {
            toRemove.push(child); // rubber foot
          }
        }
      });
      toRemove.forEach(c => bassGroup.remove(c));

      const chromeMat = drums.chromeMaterial;
      const blackMat = drums.blackTrimMaterial;
      const footboardMat = drums.footboardMaterial;
      const accentMat = drums.pedalAccentMaterial;

      // Add correctly grounded spurs
      [-1, 1].forEach(side => {
        // Bracket on shell
        const bracketPos = new THREE.Vector3(side * (radius + 0.005), -0.08, depth * 0.22);
        
        // Foot position on the platform floor! (y = -bassY + 0.012 inside bassGroup = 0.012 on floor)
        const floorY = -bassY + 0.012;
        const footPos = new THREE.Vector3(side * (radius + 0.18), floorY, depth * 0.38);

        const spurVec = new THREE.Vector3().subVectors(footPos, bracketPos);
        const spurLen = spurVec.length();

        const spur = new THREE.Mesh(
          new THREE.CylinderGeometry(0.010, 0.009, spurLen, 12),
          chromeMat
        );
        spur.position.copy(bracketPos).add(footPos).multiplyScalar(0.5);
        spur.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), spurVec.clone().normalize());
        spur.castShadow = true;
        bassGroup.add(spur);

        // Molded heavy rubber foot resting firmly ON the floor
        const foot = new THREE.Mesh(
          new THREE.CylinderGeometry(0.016, 0.022, 0.024, 12),
          blackMat
        );
        foot.position.copy(footPos);
        foot.castShadow = true;
        bassGroup.add(foot);
      });

      // -------------------------------------------------------------
      // New High-End Grounded Bass Drum Pedal Assembly
      // -------------------------------------------------------------
      const pedalGroup = new THREE.Group();
      // Grounded on floor at y = -bassY in bassGroup (which is y = 0 in world!)
      pedalGroup.position.set(0, -bassY, depth / 2 + 0.04);
      bassGroup.add(pedalGroup);

      // 1. Cast Baseplate on floor
      const baseplateLen = 0.30;
      const baseplateWidth = 0.13;
      const basePlate = new THREE.Mesh(
        new THREE.BoxGeometry(baseplateWidth, 0.010, baseplateLen),
        chromeMat
      );
      basePlate.position.set(0, 0.005, 0.10);
      basePlate.castShadow = true;
      pedalGroup.add(basePlate);

      // Rubber floor grip mat under baseplate
      const baseRubber = new THREE.Mesh(
        new THREE.BoxGeometry(baseplateWidth + 0.006, 0.003, baseplateLen + 0.006),
        blackMat
      );
      baseRubber.position.set(0, 0.0015, 0.10);
      pedalGroup.add(baseRubber);

      // Hoop Clamp Bracket locking pedal to bass drum rim
      const hoopClamp = new THREE.Mesh(
        new THREE.BoxGeometry(0.048, 0.020, 0.055),
        chromeMat
      );
      hoopClamp.position.set(0, 0.016, -0.035);
      pedalGroup.add(hoopClamp);

      const clampWingBolt = new THREE.Mesh(
        new THREE.BoxGeometry(0.028, 0.008, 0.008),
        chromeMat
      );
      clampWingBolt.position.set(0.032, 0.016, -0.035);
      pedalGroup.add(clampWingBolt);

      // 2. Dual Upright Frame Towers (Towers support axle and beater)
      const towerHeight = 0.19;
      [-0.052, 0.052].forEach(tx => {
        // Upright post
        const tower = new THREE.Mesh(
          new THREE.BoxGeometry(0.016, towerHeight, 0.018),
          chromeMat
        );
        tower.position.set(tx, towerHeight / 2 + 0.008, 0.015);
        tower.castShadow = true;
        pedalGroup.add(tower);

        // Diagonal rear brace
        const braceDir = new THREE.Vector3(0, -towerHeight, 0.06);
        const braceLen = braceDir.length();
        const brace = new THREE.Mesh(
          new THREE.CylinderGeometry(0.005, 0.005, braceLen, 8),
          chromeMat
        );
        brace.position.set(tx, towerHeight * 0.45, 0.045);
        brace.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), braceDir.normalize());
        pedalGroup.add(brace);

        // Top bearing housing cap
        const cap = new THREE.Mesh(
          new THREE.CylinderGeometry(0.014, 0.014, 0.022, 12),
          chromeMat
        );
        cap.rotation.z = Math.PI / 2;
        cap.position.set(tx, towerHeight + 0.008, 0.015);
        pedalGroup.add(cap);
      });

      // Cross Axle through bearing caps
      const axle = new THREE.Mesh(
        new THREE.CylinderGeometry(0.008, 0.008, 0.135, 12),
        chromeMat
      );
      axle.rotation.z = Math.PI / 2;
      axle.position.set(0, towerHeight + 0.008, 0.015);
      pedalGroup.add(axle);

      // Right Side Spring Tension Assembly
      const springGroup = new THREE.Group();
      springGroup.position.set(0.062, towerHeight * 0.55, 0.015);

      const rockerArm = new THREE.Mesh(
        new THREE.BoxGeometry(0.008, 0.035, 0.008),
        chromeMat
      );
      rockerArm.position.set(0, towerHeight * 0.35, 0);
      springGroup.add(rockerArm);

      const spring = new THREE.Mesh(
        new THREE.CylinderGeometry(0.006, 0.006, 0.075, 10),
        blackMat
      );
      spring.position.set(0, 0, 0);
      springGroup.add(spring);

      const springNut = new THREE.Mesh(
        new THREE.CylinderGeometry(0.008, 0.008, 0.014, 10),
        chromeMat
      );
      springNut.position.set(0, -0.045, 0);
      springGroup.add(springNut);
      pedalGroup.add(springGroup);

      // 3. Drive Cam on Center of Axle
      const cam = new THREE.Mesh(
        new THREE.CylinderGeometry(0.020, 0.020, 0.022, 14),
        blackMat
      );
      cam.rotation.z = Math.PI / 2;
      cam.position.set(0, towerHeight + 0.008, 0.015);
      pedalGroup.add(cam);

      // 4. Heel Plate Assembly at rear of baseplate
      const heelZ = 0.22;
      const heelPlate = new THREE.Mesh(
        new THREE.BoxGeometry(0.075, 0.014, 0.055),
        chromeMat
      );
      heelPlate.position.set(0, 0.012, heelZ);
      pedalGroup.add(heelPlate);

      const heelTread = new THREE.Mesh(
        new THREE.BoxGeometry(0.055, 0.003, 0.035),
        accentMat
      );
      heelTread.position.set(0, 0.020, heelZ);
      pedalGroup.add(heelTread);

      // Hinge posts & axle pin
      [-0.030, 0.030].forEach(px => {
        const post = new THREE.Mesh(
          new THREE.BoxGeometry(0.010, 0.018, 0.014),
          chromeMat
        );
        post.position.set(px, 0.022, heelZ - 0.024);
        pedalGroup.add(post);
      });

      const hingePin = new THREE.Mesh(
        new THREE.CylinderGeometry(0.004, 0.004, 0.072, 10),
        chromeMat
      );
      hingePin.rotation.z = Math.PI / 2;
      hingePin.position.set(0, 0.026, heelZ - 0.024);
      pedalGroup.add(hingePin);

      // 5. ANIMATED FOOTBOARD (Pivots from heel: "de arriba hacia abajo")
      const footboardPivot = new THREE.Group();
      footboardPivot.position.set(0, 0.026, heelZ - 0.024);

      // Tapered extruded footboard plate (pointing along -Z towards the drum!)
      const fl = 0.195;
      const shape = new THREE.Shape();
      shape.moveTo(-0.024, 0);
      shape.lineTo(-0.024, 0.025);
      shape.lineTo(-0.036, fl * 0.65);
      shape.lineTo(-0.032, fl * 0.90);
      shape.quadraticCurveTo(-0.016, fl, 0, fl + 0.004);
      shape.quadraticCurveTo(0.016, fl, 0.032, fl * 0.90);
      shape.lineTo(0.036, fl * 0.65);
      shape.lineTo(0.024, 0.025);
      shape.lineTo(0.024, 0);
      shape.closePath();

      const extrudeSettings = {
        steps: 1,
        depth: 0.007,
        bevelEnabled: true,
        bevelThickness: 0.002,
        bevelSize: 0.002,
        bevelSegments: 3
      };

      const footboardGeom = new THREE.ExtrudeGeometry(shape, extrudeSettings);
      footboardGeom.rotateX(-Math.PI / 2); // points along -Z towards drum!

      const footboardMesh = new THREE.Mesh(footboardGeom, footboardMat);
      footboardMesh.castShadow = true;
      footboardPivot.add(footboardMesh);

      // Traction ridges on footboard
      for (let i = 0; i < 5; i++) {
        const rz = -0.05 - i * 0.025;
        const rw = 0.042 + i * 0.003;
        const ridge = new THREE.Mesh(
          new THREE.BoxGeometry(rw, 0.0025, 0.006),
          accentMat
        );
        ridge.position.set(0, 0.008, rz);
        footboardPivot.add(ridge);
      }

      const centerStripe = new THREE.Mesh(
        new THREE.BoxGeometry(0.006, 0.002, 0.11),
        accentMat
      );
      centerStripe.position.set(0, 0.008, -0.10);
      footboardPivot.add(centerStripe);

      // Chain connecting toe to cam
      const toeChain = new THREE.Mesh(
        new THREE.BoxGeometry(0.010, 0.045, 0.006),
        chromeMat
      );
      toeChain.position.set(0, 0.026, -fl + 0.008);
      footboardPivot.add(toeChain);

      // Rest angle: footboard angled up at ~10 degrees
      footboardPivot.rotation.x = -0.18;
      pedalGroup.add(footboardPivot);
      drums.kickFootboard = footboardPivot;

      // 6. BEATER ASSEMBLY (Clamped to axle at y = towerHeight + 0.008)
      const beaterPivot = new THREE.Group();
      beaterPivot.position.set(0, towerHeight + 0.008, 0.015);

      // Chrome Shaft
      const rodLen = 0.18;
      const beaterRod = new THREE.Mesh(
        new THREE.CylinderGeometry(0.004, 0.004, rodLen, 10),
        chromeMat
      );
      beaterRod.position.y = rodLen / 2;
      beaterPivot.add(beaterRod);

      // Counterweight collar on shaft
      const counterweight = new THREE.Mesh(
        new THREE.CylinderGeometry(0.009, 0.009, 0.012, 12),
        chromeMat
      );
      counterweight.position.y = rodLen * 0.55;
      beaterPivot.add(counterweight);

      // Dual-surface Reversible Beater Head (felt face towards drum, plastic face away)
      const headGroup = new THREE.Group();
      headGroup.position.set(0, rodLen, 0);

      // Main core
      const beaterCore = new THREE.Mesh(
        new THREE.CylinderGeometry(0.018, 0.018, 0.038, 16),
        blackMat
      );
      beaterCore.rotation.x = Math.PI / 2;
      headGroup.add(beaterCore);

      // White high-density felt impact face
      const feltImpactFace = new THREE.Mesh(
        new THREE.CylinderGeometry(0.017, 0.017, 0.008, 16),
        new THREE.MeshStandardMaterial({ color: 0xf0ede6, roughness: 0.7 })
      );
      feltImpactFace.rotation.x = Math.PI / 2;
      feltImpactFace.position.z = -0.020;
      headGroup.add(feltImpactFace);

      beaterPivot.add(headGroup);

      // Rest angle: beater pulled back towards drummer at ~48 degrees
      beaterPivot.rotation.x = 0.82;
      pedalGroup.add(beaterPivot);
      drums.beaterPivot = beaterPivot;

      // Update animateKick to animate BOTH footboard and beater with realistic top-to-bottom physics!
      drums._animateKick = function(vel) {
        // 1. Footboard snaps DOWN ("de arriba hacia abajo")
        if (drums.kickFootboard) {
          gsap.killTweensOf(drums.kickFootboard.rotation);
          gsap.timeline()
            .to(drums.kickFootboard.rotation, {
              x: -0.03, // downstroke
              duration: 0.038,
              ease: 'power4.in'
            })
            .to(drums.kickFootboard.rotation, {
              x: -0.18, // elastic rebound back up
              duration: 0.14,
              ease: 'elastic.out(1, 0.4)'
            });
        }

        // 2. Beater strikes flush against drumhead
        if (drums.beaterPivot) {
          gsap.killTweensOf(drums.beaterPivot.rotation);
          gsap.timeline()
            .to(drums.beaterPivot.rotation, {
              x: -0.04, // impact flush with head
              duration: 0.038,
              ease: 'power4.in'
            })
            .to(drums.beaterPivot.rotation, {
              x: 0.82, // rebound back to ready
              duration: 0.16,
              ease: 'elastic.out(1, 0.4)'
            });
        }

        // 3. Subtle horizontal punch recoil on bass drum (instead of floating up-down bounce)
        if (bassGroup) {
          gsap.killTweensOf(bassGroup.position);
          const kickRecoilZ = -depth / 2 - 0.012 * vel;
          gsap.timeline()
            .to(bassGroup.position, {
              z: kickRecoilZ,
              duration: 0.035,
              ease: 'power3.in'
            })
            .to(bassGroup.position, {
              z: -depth / 2,
              duration: 0.18,
              ease: 'power2.out'
            });
        }

        if (drums.drumHeads.kickFront) {
          drums._flashDrumHead(drums.drumHeads.kickFront, 0xffe600, vel);
        }
      };
    });

    console.log('Kick redesign prototype injected.');

    // Screenshot 1: Side view showing spurs and pedal firmly flat on the floor (NO FLOATING)
    await page.evaluate(() => {
      const app = window.app;
      const drums = app.sceneManager.allInstruments['drums'];
      const drumPos = drums.group.position;

      app.sceneManager.camera.position.set(drumPos.x + 1.2, drumPos.y + 0.35, drumPos.z + 0.45);
      app.sceneManager.cameraController.controls.target.set(drumPos.x, drumPos.y + 0.18, drumPos.z);
      app.sceneManager.camera.lookAt(drumPos.x, drumPos.y + 0.18, drumPos.z);
      app.sceneManager.cameraController.controls.update();
    });

    await new Promise(r => setTimeout(r, 600));
    await page.screenshot({ path: `${artifactDir}/kick_grounded_side.png` });
    console.log('Saved kick_grounded_side.png');

    // Screenshot 2: Front view of the new pedal resting on the floor
    await page.evaluate(() => {
      const app = window.app;
      const drums = app.sceneManager.allInstruments['drums'];
      const drumPos = drums.group.position;

      app.sceneManager.camera.position.set(drumPos.x, drumPos.y + 0.35, drumPos.z + 1.2);
      app.sceneManager.cameraController.controls.target.set(drumPos.x, drumPos.y + 0.18, drumPos.z);
      app.sceneManager.camera.lookAt(drumPos.x, drumPos.y + 0.18, drumPos.z);
      app.sceneManager.cameraController.controls.update();
    });

    await new Promise(r => setTimeout(r, 600));
    await page.screenshot({ path: `${artifactDir}/kick_pedal_rest_view.png` });
    console.log('Saved kick_pedal_rest_view.png');

    // Screenshot 3: Trigger hit and capture mid-stroke
    await page.evaluate(() => {
      const drums = window.app.sceneManager.allInstruments['drums'];
      drums._animateKick(1.0);
    });
    await new Promise(r => setTimeout(r, 38)); // capture at exact impact
    await page.screenshot({ path: `${artifactDir}/kick_pedal_impact_view.png` });
    console.log('Saved kick_pedal_impact_view.png');

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await browser.close();
  }
})();
