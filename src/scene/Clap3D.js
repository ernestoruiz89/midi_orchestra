import * as THREE from 'three';
import gsap from 'gsap';

/**
 * Clap3D: Concert 3D Hand Clap Percussion Instrument
 * - Features anatomically sculpted realistic hands adapted from BongoCongas3D.
 * - Warm caramel organic skin tone with subsurface sheen, extruded fingernails,
 *   and athletic dark wristbands.
 * - Natural concert clap orientation facing the audience with visible palms.
 * - Dynamic clapping kinematics (inward strike snap, elastic rebound recoil).
 * - Glowing sonic shockwave ring and kinetic sparkle burst on impact.
 */
export class Clap3D {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();

    // Default position: centered at the front edge of the percussion tarima
    this.group.position.set(0.0, 1.20, 1.28);

    this.leftPivot = null;
    this.rightPivot = null;
    this.leftHand = null;
    this.rightHand = null;

    this.shockwave = null;
    this.sparkleParticles = [];
    this.idleTime = 0;

    this._buildMaterials();
    this._buildHands();
    this._buildShockwave();
    this._buildParticles();

    this.scene.add(this.group);
  }

  _buildMaterials() {
    // 1. Organic Warm Caramel Skin Tone (Identical to Latin percussionist hands)
    this.skinMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xc88e68,
      roughness: 0.58,
      metalness: 0.02,
      sheen: 0.35,
      sheenColor: 0xffd2b0,
      clearcoat: 0.08,
      clearcoatRoughness: 0.25
    });

    // 2. Fingernails with glossy protective clearcoat
    this.nailMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xdeb89e,
      roughness: 0.32,
      metalness: 0.02,
      clearcoat: 0.45
    });

    // 3. Black Elastic Athletic Sweatband (Wristband cuff)
    this.cuffMaterial = new THREE.MeshStandardMaterial({
      color: 0x1a1a20,
      roughness: 0.82,
      metalness: 0.12
    });

    // 4. Sonic Shockwave Ring (translucent golden-cyan acoustic ripple)
    this.shockwaveMaterial = new THREE.MeshBasicMaterial({
      color: 0xffe890,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
      depthWrite: false
    });

    // 5. Sparkle particle material
    this.sparkleMaterial = new THREE.MeshBasicMaterial({
      color: 0xfffae0,
      transparent: true,
      opacity: 0,
      depthWrite: false
    });
  }

  _buildHands() {
    // Left & Right hand pivot groups allowing independent clapping travel
    this.leftPivot = new THREE.Group();
    this.leftPivot.position.set(-0.065, 0, 0);

    this.rightPivot = new THREE.Group();
    this.rightPivot.position.set(0.065, 0, 0);

    // Build sculpted left hand
    this.leftHand = this._createHandMesh(true);
    // Orient left hand: palm faces right (+X), fingers point up & forward (+Y/+Z), thumb points towards audience (+Z)
    this.leftHand.rotation.set(1.82, 0.15, 1.57);
    this.leftPivot.add(this.leftHand);

    // Build sculpted right hand
    this.rightHand = this._createHandMesh(false);
    // Orient right hand: palm faces left (-X), fingers point up & forward (+Y/+Z), thumb points towards audience (+Z)
    this.rightHand.rotation.set(1.82, -0.15, -1.57);
    this.rightPivot.add(this.rightHand);

    this.group.add(this.leftPivot);
    this.group.add(this.rightPivot);
  }

  _createHandMesh(isLeft) {
    const handGroup = new THREE.Group();
    const sign = isLeft ? 1 : -1;

    const palmThick = 0.016;
    const fingerThick = 0.012;
    const bvl = {
      bevelEnabled: true,
      bevelThickness: 0.0025,
      bevelSize: 0.0025,
      bevelSegments: 3
    };

    // ── 1. PALM ── Single extruded solid body ──
    const hwW = 0.028;   // half-width at wrist
    const hwK = 0.036;   // half-width at knuckle line
    const pLen = 0.076;  // palm length (wrist to knuckle)
    const cr = 0.007;    // corner radius

    const ps = new THREE.Shape();
    ps.moveTo(-hwW + cr, 0);
    ps.lineTo(hwW - cr, 0);
    ps.quadraticCurveTo(hwW, 0, hwW, cr);
    ps.lineTo(hwK, pLen - cr);
    ps.quadraticCurveTo(hwK, pLen, hwK - cr, pLen);
    ps.lineTo(-(hwK - cr), pLen);
    ps.quadraticCurveTo(-hwK, pLen, -hwK, pLen - cr);
    ps.lineTo(-hwW, cr);
    ps.quadraticCurveTo(-hwW, 0, -(hwW - cr), 0);

    const palmGeom = new THREE.ExtrudeGeometry(ps, { depth: palmThick, ...bvl });
    palmGeom.rotateX(-Math.PI / 2);
    palmGeom.translate(0, -palmThick * 0.3, 0);
    palmGeom.computeVertexNormals();

    const palm = new THREE.Mesh(palmGeom, this.skinMaterial);
    palm.castShadow = true;
    palm.receiveShadow = true;
    handGroup.add(palm);

    // ── 2. FINGERS ── Each is ONE extruded tapered body with rounded tip ──
    const fingerConfigs = [
      { x: -0.027 * sign, len: 0.046, bw: 0.0115, tw: 0.0080, droop: -0.12 },
      { x: -0.009 * sign, len: 0.056, bw: 0.0125, tw: 0.0090, droop: -0.08 },
      { x:  0.009 * sign, len: 0.063, bw: 0.0135, tw: 0.0095, droop: -0.06 },
      { x:  0.027 * sign, len: 0.054, bw: 0.0125, tw: 0.0090, droop: -0.09 }
    ];

    fingerConfigs.forEach(f => {
      const fGroup = new THREE.Group();
      fGroup.position.set(f.x, 0, -pLen);
      fGroup.rotation.x = f.droop;

      // Tapered finger outline with smooth rounded tip
      const hbw = f.bw / 2;
      const htw = f.tw / 2;
      const tipR = htw;

      const fs = new THREE.Shape();
      fs.moveTo(-hbw, 0);
      fs.lineTo(hbw, 0);
      fs.lineTo(htw, f.len - tipR);
      // Rounded fingertip arc
      fs.bezierCurveTo(
        htw, f.len - tipR * 0.3,
        htw * 0.5, f.len + tipR * 0.15,
        0, f.len + tipR * 0.2
      );
      fs.bezierCurveTo(
        -htw * 0.5, f.len + tipR * 0.15,
        -htw, f.len - tipR * 0.3,
        -htw, f.len - tipR
      );
      fs.closePath();

      const fGeom = new THREE.ExtrudeGeometry(fs, { depth: fingerThick, ...bvl });
      fGeom.rotateX(-Math.PI / 2);
      fGeom.translate(0, -fingerThick * 0.3, 0);
      fGeom.computeVertexNormals();

      const finger = new THREE.Mesh(fGeom, this.skinMaterial);
      finger.castShadow = true;
      fGroup.add(finger);

      // Fingernail — small flat extruded piece on dorsal side
      const nW = f.tw * 0.75;
      const nD = f.tw * 0.50;
      const nShape = new THREE.Shape();
      nShape.moveTo(-nW / 2, 0);
      nShape.lineTo(nW / 2, 0);
      nShape.lineTo(nW / 2, nD * 0.7);
      nShape.quadraticCurveTo(0, nD * 1.3, -nW / 2, nD * 0.7);
      nShape.closePath();

      const nGeom = new THREE.ExtrudeGeometry(nShape, {
        depth: 0.0012,
        bevelEnabled: true,
        bevelThickness: 0.0004,
        bevelSize: 0.0004,
        bevelSegments: 1
      });
      nGeom.rotateX(-Math.PI / 2);
      nGeom.computeVertexNormals();

      const nail = new THREE.Mesh(nGeom, this.nailMaterial);
      nail.position.set(0, fingerThick * 0.7 - fingerThick * 0.3, -(f.len - nD * 0.3));
      fGroup.add(nail);

      handGroup.add(fGroup);
    });

    // ── 3. THUMB ── Single extruded tapered body, extended outward ──
    const thumbGroup = new THREE.Group();
    thumbGroup.position.set(0.032 * sign, -0.0012, -0.014);
    thumbGroup.rotation.set(0.0, -0.30 * sign, 0.0);

    const tLen = 0.046;
    const tBW = 0.014;
    const tTW = 0.011;
    const tHBW = tBW / 2;
    const tHTW = tTW / 2;
    const tTipR = tHTW;

    const ts = new THREE.Shape();
    ts.moveTo(-tHBW, 0);
    ts.lineTo(tHBW, 0);
    ts.lineTo(tHTW, tLen - tTipR);
    ts.bezierCurveTo(
      tHTW, tLen - tTipR * 0.3,
      tHTW * 0.5, tLen + tTipR * 0.15,
      0, tLen + tTipR * 0.2
    );
    ts.bezierCurveTo(
      -tHTW * 0.5, tLen + tTipR * 0.15,
      -tHTW, tLen - tTipR * 0.3,
      -tHTW, tLen - tTipR
    );
    ts.closePath();

    const tThick = fingerThick * 1.15;
    const tGeom = new THREE.ExtrudeGeometry(ts, { depth: tThick, ...bvl });
    tGeom.rotateX(-Math.PI / 2);
    tGeom.translate(0, -tThick * 0.3, 0);
    tGeom.computeVertexNormals();

    const thumb = new THREE.Mesh(tGeom, this.skinMaterial);
    thumb.castShadow = true;
    thumbGroup.add(thumb);

    // Thumb nail
    const tnW = tTW * 0.72;
    const tnD = tTW * 0.45;
    const tnShape = new THREE.Shape();
    tnShape.moveTo(-tnW / 2, 0);
    tnShape.lineTo(tnW / 2, 0);
    tnShape.lineTo(tnW / 2, tnD * 0.7);
    tnShape.quadraticCurveTo(0, tnD * 1.3, -tnW / 2, tnD * 0.7);
    tnShape.closePath();

    const tnGeom = new THREE.ExtrudeGeometry(tnShape, {
      depth: 0.0012,
      bevelEnabled: true,
      bevelThickness: 0.0004,
      bevelSize: 0.0004,
      bevelSegments: 1
    });
    tnGeom.rotateX(-Math.PI / 2);
    tnGeom.computeVertexNormals();

    const thumbNail = new THREE.Mesh(tnGeom, this.nailMaterial);
    thumbNail.position.set(0, tThick * 0.7 - tThick * 0.3, -(tLen - tnD * 0.3));
    thumbGroup.add(thumbNail);

    handGroup.add(thumbGroup);

    // ── 4. WRIST & FOREARM CUFF ──
    // Tapered anatomical wrist section extending back along +Z
    const wristLength = 0.042;
    const ws = new THREE.Shape();
    const wsW = hwW * 0.95;
    const wsR = 0.005;
    ws.moveTo(-wsW + wsR, 0);
    ws.lineTo(wsW - wsR, 0);
    ws.quadraticCurveTo(wsW, 0, wsW, -wsR);
    ws.lineTo(wsW * 0.90, -(wristLength - wsR));
    ws.quadraticCurveTo(wsW * 0.90, -wristLength, wsW * 0.90 - wsR, -wristLength);
    ws.lineTo(-(wsW * 0.90 - wsR), -wristLength);
    ws.quadraticCurveTo(-wsW * 0.90, -wristLength, -wsW * 0.90, -(wristLength - wsR));
    ws.lineTo(-wsW, -wsR);
    ws.quadraticCurveTo(-wsW, 0, -(wsW - wsR), 0);

    const wristGeom = new THREE.ExtrudeGeometry(ws, { depth: palmThick * 0.92, ...bvl });
    wristGeom.rotateX(-Math.PI / 2);
    wristGeom.translate(0, -palmThick * 0.28, 0);
    wristGeom.computeVertexNormals();

    const wrist = new THREE.Mesh(wristGeom, this.skinMaterial);
    wrist.castShadow = true;
    wrist.receiveShadow = true;
    handGroup.add(wrist);

    // Athletic wristband (dark sweatband cuff around the wrist base)
    const cuffGeom = new THREE.CylinderGeometry(hwW * 1.02, hwW * 0.98, 0.020, 24);
    cuffGeom.scale(1.0, 1.0, (palmThick * 1.15) / (hwW * 1.9));
    cuffGeom.rotateX(Math.PI / 2);
    const cuff = new THREE.Mesh(cuffGeom, this.cuffMaterial);
    cuff.position.set(0, 0.002, wristLength * 0.65);
    cuff.castShadow = true;
    handGroup.add(cuff);

    return handGroup;
  }

  _buildShockwave() {
    // Sonic ripple ring in YZ plane positioned at clapping contact plane (X = 0)
    const ringGeom = new THREE.RingGeometry(0.015, 0.085, 32);
    ringGeom.rotateY(Math.PI / 2);

    this.shockwave = new THREE.Mesh(ringGeom, this.shockwaveMaterial);
    this.shockwave.position.set(0, 0.02, 0);
    this.shockwave.visible = false;
    this.group.add(this.shockwave);
  }

  _buildParticles() {
    const particleGeom = new THREE.SphereGeometry(0.0035, 8, 8);
    const count = 14;

    for (let i = 0; i < count; i++) {
      const mesh = new THREE.Mesh(particleGeom, this.sparkleMaterial.clone());
      mesh.visible = false;
      this.group.add(mesh);
      this.sparkleParticles.push({
        mesh,
        vel: new THREE.Vector3()
      });
    }
  }

  onNoteOn(midiPitch = 39, velocity = 0.85) {
    const vel = Math.max(0.3, Math.min(1.0, velocity));

    if (!this.leftPivot || !this.rightPivot) return;

    // Interrupt any ongoing tween for instant, crisp re-strike
    gsap.killTweensOf(this.leftPivot.position);
    gsap.killTweensOf(this.rightPivot.position);
    gsap.killTweensOf(this.leftHand.rotation);
    gsap.killTweensOf(this.rightHand.rotation);

    const restX = 0.068;
    const impactX = 0.006; // Close proximity where palms meet

    // Rapid inward attack strike (takes 32ms)
    gsap.to(this.leftPivot.position, {
      x: -impactX,
      duration: 0.032,
      ease: 'power3.in',
      onComplete: () => {
        // Impact moment: trigger sonic shockwave and sparkle spray
        this._triggerImpactEffects(vel);

        // Elastic rebound recoil back to rest position
        gsap.to(this.leftPivot.position, {
          x: -restX,
          duration: 0.22,
          ease: 'elastic.out(1.15, 0.35)'
        });
      }
    });

    gsap.to(this.rightPivot.position, {
      x: impactX,
      duration: 0.032,
      ease: 'power3.in',
      onComplete: () => {
        gsap.to(this.rightPivot.position, {
          x: restX,
          duration: 0.22,
          ease: 'elastic.out(1.15, 0.35)'
        });
      }
    });

    // Subtle pitch flex of the hands upon impact
    const baseRotL = { x: Math.PI * 0.65, y: 0.15, z: Math.PI * 0.45 };
    const baseRotR = { x: Math.PI * 0.65, y: -0.15, z: -Math.PI * 0.45 };

    gsap.to(this.leftHand.rotation, {
      z: baseRotL.z - 0.08 * vel,
      duration: 0.032,
      ease: 'power3.in',
      onComplete: () => {
        gsap.to(this.leftHand.rotation, {
          z: baseRotL.z,
          duration: 0.18,
          ease: 'power2.out'
        });
      }
    });

    gsap.to(this.rightHand.rotation, {
      z: baseRotR.z + 0.08 * vel,
      duration: 0.032,
      ease: 'power3.in',
      onComplete: () => {
        gsap.to(this.rightHand.rotation, {
          z: baseRotR.z,
          duration: 0.18,
          ease: 'power2.out'
        });
      }
    });
  }

  onNoteOff() {
    // Staccato auxiliary percussion instrument
  }

  _triggerImpactEffects(vel) {
    // 1. Expand and fade sonic shockwave ring
    if (this.shockwave) {
      this.shockwave.visible = true;
      this.shockwave.scale.set(0.3, 0.3, 0.3);
      this.shockwave.material.opacity = 0.85 * vel;

      gsap.killTweensOf(this.shockwave.scale);
      gsap.killTweensOf(this.shockwave.material);

      gsap.to(this.shockwave.scale, {
        x: 1.6 * vel,
        y: 1.6 * vel,
        z: 1.6 * vel,
        duration: 0.24,
        ease: 'power2.out'
      });

      gsap.to(this.shockwave.material, {
        opacity: 0,
        duration: 0.24,
        ease: 'power2.out',
        onComplete: () => {
          this.shockwave.visible = false;
        }
      });
    }

    // 2. Disperse sparkle burst particles
    this.sparkleParticles.forEach(p => {
      p.mesh.position.set(
        (Math.random() - 0.5) * 0.015,
        0.02 + (Math.random() - 0.5) * 0.02,
        (Math.random() - 0.5) * 0.02
      );
      p.mesh.material.opacity = 0.9 * vel;
      p.mesh.visible = true;

      const angle = Math.random() * Math.PI * 2;
      const speed = (0.04 + Math.random() * 0.08) * vel;
      p.vel.set(
        (Math.random() - 0.5) * 0.02,
        Math.sin(angle) * speed,
        Math.cos(angle) * speed
      );

      gsap.killTweensOf(p.mesh.material);
      gsap.to(p.mesh.material, {
        opacity: 0,
        duration: 0.22 + Math.random() * 0.12,
        ease: 'power2.out',
        onComplete: () => {
          p.mesh.visible = false;
        }
      });
    });
  }

  update(delta) {
    // Ambient breathing oscillation
    this.idleTime += delta;
    const breathe = Math.sin(this.idleTime * 2.2) * 0.002;
    if (this.leftPivot && this.rightPivot) {
      this.leftPivot.position.y = breathe;
      this.rightPivot.position.y = breathe;
    }

    // Update kinetic sparkle particles
    this.sparkleParticles.forEach(p => {
      if (p.mesh.visible) {
        p.mesh.position.addScaledVector(p.vel, delta * 60);
      }
    });
  }

  dispose() {
    if (this.group && this.scene) {
      this.scene.remove(this.group);
    }
  }
}
