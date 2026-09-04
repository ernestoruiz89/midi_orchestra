import * as THREE from 'three';
import gsap from 'gsap';

/**
 * Guiro3D: Professional Concert Latin Güiro with Dedicated Scraper Stick
 * - Authentic tapered carved gourd / hardwood body with flared mouth
 * - 24 precision-carved serrated cáscara ridges on the front belly
 * - Dual rear finger grip/resonance sound holes
 * - Dedicated wooden raspador (scraper stick) hovering in playing readiness
 * - Dynamic scraping animation (short stroke MIDI 73 vs long sweeping double-stroke MIDI 74)
 * - Micro-recoil body vibration and fine rasp sparkle particles
 */
export class Guiro3D {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();

    // Floating right wing beside ride cymbal / floor toms
    this.group.position.set(1.15, 1.06, 0.10);
    this.group.rotation.set(0.24, -0.32, 0.15);

    this.guiroBody = null;
    this.scraperPivot = null;
    this.sparkleParticles = [];

    this._buildMaterials();
    this._buildGuiro();
    this._buildScraper();
    this._buildParticles();

    this.scene.add(this.group);
  }

  _buildMaterials() {
    // 1. Natural dried calabash / caramel hardwood body with satin sheen
    this.gourdMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x985222,
      roughness: 0.32,
      metalness: 0.05,
      clearcoat: 0.75,
      clearcoatRoughness: 0.09
    });

    // 2. Carved ridges (slightly lighter raw interior wood)
    this.ridgeMaterial = new THREE.MeshStandardMaterial({
      color: 0xd28e46,
      roughness: 0.40,
      metalness: 0.02
    });

    // 3. Dark resonance hole interior
    this.darkInteriorMaterial = new THREE.MeshBasicMaterial({
      color: 0x120804
    });

    // 4. Turned maple scraper stick (raspador)
    this.scraperMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xeed4a6,
      roughness: 0.28,
      metalness: 0.02,
      clearcoat: 0.65
    });
  }

  _buildGuiro() {
    const bodyGroup = new THREE.Group();
    this.guiroBody = bodyGroup;

    // A. Main tapered gourd body
    const bodyLength = 0.36;
    const bodyRadius = 0.046;
    const taperRadius = 0.028;

    const bodyGeom = new THREE.CylinderGeometry(
      taperRadius,
      bodyRadius,
      bodyLength,
      28,
      1,
      false
    );
    const bodyMesh = new THREE.Mesh(bodyGeom, this.gourdMaterial);
    bodyMesh.rotation.z = Math.PI / 2;
    bodyMesh.castShadow = true;
    bodyMesh.receiveShadow = true;
    bodyGroup.add(bodyMesh);

    // Rounded ends (closed tail and open flared bell)
    const tailGeom = new THREE.SphereGeometry(taperRadius, 20, 16);
    const tail = new THREE.Mesh(tailGeom, this.gourdMaterial);
    tail.position.x = -bodyLength / 2;
    tail.scale.set(0.9, 1.0, 1.0);
    bodyGroup.add(tail);

    const bellGeom = new THREE.CylinderGeometry(bodyRadius * 1.08, bodyRadius, 0.025, 28, 1, true);
    const bell = new THREE.Mesh(bellGeom, this.gourdMaterial);
    bell.rotation.z = Math.PI / 2;
    bell.position.x = bodyLength / 2 + 0.012;
    bodyGroup.add(bell);

    // Dark open mouth inside bell
    const mouthGeom = new THREE.CircleGeometry(bodyRadius * 0.92, 24);
    const mouth = new THREE.Mesh(mouthGeom, this.darkInteriorMaterial);
    mouth.rotation.y = Math.PI / 2;
    mouth.position.x = bodyLength / 2 + 0.024;
    bodyGroup.add(mouth);

    // B. 24 Precision Serrated Ridges (Cáscara ribs on front belly)
    const ridgeCount = 24;
    const startX = -0.11;
    const endX = 0.12;
    const step = (endX - startX) / ridgeCount;

    for (let i = 0; i < ridgeCount; i++) {
      const rx = startX + i * step;
      // Interpolate radius along tapered body
      const t = (rx + bodyLength / 2) / bodyLength;
      const rAtX = taperRadius + (bodyRadius - taperRadius) * t;

      const ribGeom = new THREE.TorusGeometry(rAtX + 0.0018, 0.0022, 6, 24, Math.PI * 0.72);
      const rib = new THREE.Mesh(ribGeom, this.ridgeMaterial);
      rib.rotation.y = Math.PI / 2;
      rib.rotation.z = -Math.PI * 0.36;
      rib.position.set(rx, 0, 0);
      bodyGroup.add(rib);
    }

    // C. Rear Grip / Resonance Sound Holes (two oval holes on back)
    [-0.03, 0.04].forEach(hx => {
      const holeGeom = new THREE.CylinderGeometry(0.012, 0.012, 0.005, 16);
      const hole = new THREE.Mesh(holeGeom, this.darkInteriorMaterial);
      hole.rotation.x = Math.PI / 2;
      hole.position.set(hx, 0, -bodyRadius);
      bodyGroup.add(hole);
    });

    this.group.add(bodyGroup);
  }

  _buildScraper() {
    const pivot = new THREE.Group();
    this.scraperPivot = pivot;

    // Resting position: scraper held in front against middle ridges
    pivot.position.set(0.0, 0.065, 0.045);
    pivot.rotation.set(0.20, 0.10, 0.45);

    // Wooden scraper stick (raspador)
    const scraperLength = 0.22;
    const stickGeom = new THREE.CylinderGeometry(0.004, 0.004, scraperLength, 12);
    const stick = new THREE.Mesh(stickGeom, this.scraperMaterial);
    stick.castShadow = true;
    pivot.add(stick);

    // Ergonomic rounded handle at one end
    const handleGeom = new THREE.CylinderGeometry(0.008, 0.006, 0.07, 14);
    const handle = new THREE.Mesh(handleGeom, this.scraperMaterial);
    handle.position.y = scraperLength / 2 - 0.035;
    pivot.add(handle);

    this.group.add(pivot);
  }

  _buildParticles() {
    const pCount = 14;
    const pGeom = new THREE.SphereGeometry(0.003, 6, 6);
    const pMat = new THREE.MeshBasicMaterial({
      color: 0xf6ba72,
      transparent: true,
      opacity: 0
    });

    for (let i = 0; i < pCount; i++) {
      const p = new THREE.Mesh(pGeom, pMat.clone());
      p.visible = false;
      this.group.add(p);
      this.sparkleParticles.push({
        mesh: p,
        vel: new THREE.Vector3()
      });
    }
  }

  onNoteOn(midiPitch = 73, velocity = 0.8) {
    const vel = Math.max(0.2, Math.min(1.0, velocity));
    const isLong = (midiPitch === 74 || midiPitch % 2 === 0);

    if (this.scraperPivot && this.guiroBody) {
      gsap.killTweensOf(this.scraperPivot.position);
      gsap.killTweensOf(this.scraperPivot.rotation);
      gsap.killTweensOf(this.guiroBody.rotation);

      if (isLong) {
        // Long Güiro Scrape (MIDI 74): sweeping down and up stroke across ridges
        gsap.timeline()
          .to(this.scraperPivot.position, {
            x: -0.09 * vel,
            y: 0.055,
            duration: 0.09,
            ease: 'power1.inOut'
          })
          .to(this.scraperPivot.position, {
            x: 0.10 * vel,
            y: 0.058,
            duration: 0.14,
            ease: 'power1.inOut'
          })
          .to(this.scraperPivot.position, {
            x: 0.0,
            y: 0.065,
            duration: 0.18,
            ease: 'power2.out'
          });
      } else {
        // Short Güiro Scrape (MIDI 73): crisp staccato downward stroke
        gsap.timeline()
          .to(this.scraperPivot.position, {
            x: -0.06 * vel,
            y: 0.056,
            duration: 0.05,
            ease: 'power3.in'
          })
          .to(this.scraperPivot.position, {
            x: 0.0,
            y: 0.065,
            duration: 0.12,
            ease: 'power2.out'
          });
      }

      // Güiro body subtle counter-vibration
      gsap.to(this.guiroBody.rotation, {
        z: 0.03 * vel,
        duration: 0.05,
        yoyo: true,
        repeat: isLong ? 3 : 1,
        ease: 'power1.inOut',
        onComplete: () => {
          this.guiroBody.rotation.z = 0;
        }
      });
    }

    this._triggerSparkles(vel);
  }

  onNoteOff() {
    // Staccato auxiliary instrument
  }

  _triggerSparkles(vel) {
    this.sparkleParticles.forEach((p, idx) => {
      const spreadX = (Math.random() - 0.5) * 0.14;
      p.mesh.position.set(
        spreadX,
        0.055 + Math.random() * 0.02,
        0.045 + Math.random() * 0.02
      );
      p.mesh.material.opacity = 0.85 * vel;
      p.mesh.visible = true;

      p.vel.set(
        (Math.random() - 0.5) * 0.04,
        0.04 + Math.random() * 0.05,
        0.03 + Math.random() * 0.04
      );

      gsap.killTweensOf(p.mesh.material);
      gsap.to(p.mesh.material, {
        opacity: 0,
        duration: 0.28 + Math.random() * 0.12,
        ease: 'power2.out',
        onComplete: () => {
          p.mesh.visible = false;
        }
      });
    });
  }

  update(delta) {
    this.sparkleParticles.forEach(p => {
      if (p.mesh.visible) {
        p.mesh.position.addScaledVector(p.vel, delta * 2.0);
      }
    });
  }
}
