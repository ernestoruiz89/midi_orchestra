import * as THREE from 'three';
import gsap from 'gsap';

const HAND_IDLE_TIMEOUT_MS = 1600;

/**
 * BongoCongas3D: Professional Latin Percussion Combo Set on Stand
 * - 2 Congas: Left Quinto (11" High Conga) and Right Tumba (12.5" Low Conga)
 *   with realistic parabolic stave wood bodies, unbleached rawhide heads,
 *   black comfort-curve counterhoops, chrome tension lugs, teardrop side plates
 *   and bottom protector rings.
 * - 2 Bongos: Left Macho (7" High Bongo) and Right Hembra (8.5" Low Bongo)
 *   mounted elevated above the congas on a central extension tilter column,
 *   tilted forward towards the player.
 * - Double-braced black tripod stand with chrome telescoping mast, conga spreader
 *   cradle bar, and bongo tilter clamp.
 * - Physical animation: Membrane deflection, elastic spring shell recoil,
 *   distinct decay dynamics for muted slaps vs open resonant tones.
 */
export class BongoCongas3D {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();

    // Stage position: percussion section on drum riser, behind drums to the right
    this.group.position.set(1.65, 0.20, -1.15);
    this.group.rotation.y = -0.12;

    // Component references
    this.quintoGroup = null;
    this.tumbaGroup = null;
    this.bongoSetGroup = null;
    this.machoGroup = null;
    this.hembraGroup = null;

    this.quintoHead = null;
    this.tumbaHead = null;
    this.machoHead = null;
    this.hembraHead = null;

    // Resting transforms for physics & tweens
    this.restTransforms = {
      quinto: { y: 0.70, rx: 0, rz: 0 },
      tumba: { y: 0.70, rx: 0, rz: 0 },
      bongoSet: { y: 1.14, z: -0.22, rx: 0.20, rz: 0 },
      quintoHead: { y: 0.358 },
      tumbaHead: { y: 0.358 },
      machoHead: { y: 0.082 },
      hembraHead: { y: 0.082 }
    };

    this.hands = null;
    this.hoverTime = 0;

    this._buildMaterials();
    this._buildStand();
    this._buildCongas();
    this._buildBongos();
    this._buildHands();

    this.scene.add(this.group);
  }

  /* ------------------------------------------------------------------ */
  /*  PROCEDURAL TEXTURES & MATERIALS                                   */
  /* ------------------------------------------------------------------ */

  _buildMaterials() {
    // 1. Procedural Oak Stave Wood Texture
    this.woodTexture = this._createOakWoodTexture();

    // High-gloss clearcoat amber wood (Thai Oak finish)
    this.woodMaterial = new THREE.MeshPhysicalMaterial({
      map: this.woodTexture,
      roughness: 0.24,
      metalness: 0.04,
      clearcoat: 0.75,
      clearcoatRoughness: 0.08
    });

    // Solid dark-stained hardwood connector block
    this.woodBlockMaterial = new THREE.MeshStandardMaterial({
      color: 0x4e2510,
      roughness: 0.45,
      metalness: 0.04
    });

    // 2. Procedural Natural Rawhide Drumhead Texture
    this.headTexture = this._createRawhideTexture();

    this.drumheadMaterial = new THREE.MeshStandardMaterial({
      map: this.headTexture,
      roughness: 0.65,
      metalness: 0.02
    });

    // 3. Black Powder-Coated Metal (rims, brackets, stand base)
    this.blackMetalMaterial = new THREE.MeshStandardMaterial({
      color: 0x1a1a1c,
      roughness: 0.32,
      metalness: 0.85
    });

    // 4. Polished Chrome (tension rods, upper mast, wing screws)
    this.chromeMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xdde4ec,
      roughness: 0.12,
      metalness: 0.95,
      clearcoat: 0.90
    });

    // 5. Heavy Rubber (tripod feet, rim protectors)
    this.rubberMaterial = new THREE.MeshStandardMaterial({
      color: 0x111111,
      roughness: 0.92,
      metalness: 0.02
    });

    // 6. Brass / Gold Brand Badge
    this.badgeMaterial = new THREE.MeshStandardMaterial({
      color: 0xc8a850,
      roughness: 0.28,
      metalness: 0.92
    });

    // 7. Organic Warm Caramel Skin Tone (Realistic Latin Percussionist Hands)
    this.skinMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xc88e68,
      roughness: 0.58,
      metalness: 0.02,
      sheen: 0.35,
      sheenColor: 0xffd2b0,
      clearcoat: 0.08,
      clearcoatRoughness: 0.25
    });

    // 8. Black Elastic Athletic Sweatband (Wristband)
    this.wristbandMaterial = new THREE.MeshStandardMaterial({
      color: 0x18181c,
      roughness: 0.85,
      metalness: 0.08
    });

    // 9. Fingernails
    this.nailMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xdeb89e,
      roughness: 0.32,
      metalness: 0.02,
      clearcoat: 0.45
    });
  }

  _createOakWoodTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // Warm amber honey gradient base
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
    gradient.addColorStop(0.00, '#8c3d11');
    gradient.addColorStop(0.20, '#b85e20');
    gradient.addColorStop(0.50, '#d1782c');
    gradient.addColorStop(0.80, '#b85e20');
    gradient.addColorStop(1.00, '#8c3d11');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Vertical stave seams (congas are built from glued longitudinal wooden staves)
    const staveCount = 18;
    const staveWidth = canvas.width / staveCount;
    for (let s = 0; s < staveCount; s++) {
      const sx = s * staveWidth;
      // Stave shading
      const staveGrad = ctx.createLinearGradient(sx, 0, sx + staveWidth, 0);
      staveGrad.addColorStop(0.0, 'rgba(40, 15, 5, 0.28)');
      staveGrad.addColorStop(0.08, 'rgba(255, 255, 255, 0.08)');
      staveGrad.addColorStop(0.85, 'rgba(0, 0, 0, 0.0)');
      staveGrad.addColorStop(1.0, 'rgba(30, 10, 5, 0.32)');
      ctx.fillStyle = staveGrad;
      ctx.fillRect(sx, 0, staveWidth, canvas.height);

      // Fine wood grain lines inside each stave
      ctx.strokeStyle = 'rgba(70, 25, 8, 0.12)';
      ctx.lineWidth = 0.6;
      for (let g = 0; g < 6; g++) {
        const gx = sx + 2 + Math.random() * (staveWidth - 4);
        ctx.beginPath();
        for (let y = 0; y <= canvas.height; y += 16) {
          const wav = Math.sin(y * 0.03 + s * 1.5) * 1.2;
          if (y === 0) ctx.moveTo(gx + wav, y);
          else ctx.lineTo(gx + wav, y);
        }
        ctx.stroke();
      }
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    return texture;
  }

  _createRawhideTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    // Natural calfskin/rawhide radial gradient (darker amber near perimeter edge)
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const grad = ctx.createRadialGradient(cx, cy, 10, cx, cy, cx);
    grad.addColorStop(0.0, '#f2e6d2');
    grad.addColorStop(0.7, '#e4d3b6');
    grad.addColorStop(0.92, '#c8b08e');
    grad.addColorStop(1.0, '#a88f6c');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Subtle skin grain speckles
    for (let i = 0; i < 400; i++) {
      const rx = Math.random() * canvas.width;
      const ry = Math.random() * canvas.height;
      const dist = Math.hypot(rx - cx, ry - cy);
      if (dist < cx - 4) {
        ctx.fillStyle = Math.random() > 0.5 ? 'rgba(120, 95, 65, 0.08)' : 'rgba(255, 255, 255, 0.12)';
        ctx.beginPath();
        ctx.arc(rx, ry, Math.random() * 1.5 + 0.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }

  /* ------------------------------------------------------------------ */
  /*  STAND & MOUNTING HARDWARE                                         */
  /* ------------------------------------------------------------------ */

  _buildStand() {
    const stand = new THREE.Group();

    // 1. Heavy-Duty Double-Braced Conga & Bongo Tripod Base (Matching Snare / Redoblante Stand)
    const tripodRadius = 0.38;
    const upperCollarY = 0.28;
    const lowerCollarY = 0.09;
    const baseAngle = -Math.PI / 2;

    // Helper to connect a strut cylinder directly between two 3D points
    const addStrut = (start, end, r = 0.006, mat = this.chromeMaterial) => {
      const dir = new THREE.Vector3().subVectors(end, start);
      const len = dir.length();
      const strut = new THREE.Mesh(
        new THREE.CylinderGeometry(r, r, len, 10),
        mat
      );
      strut.position.copy(start).add(end).multiplyScalar(0.5);
      strut.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
      strut.castShadow = true;
      stand.add(strut);
      return strut;
    };

    // Central lower mast tube running from floor (y = 0) up to height collar (y = 0.58)
    const lowerMastHeight = 0.58;
    const lowerMast = new THREE.Mesh(
      new THREE.CylinderGeometry(0.016, 0.016, lowerMastHeight, 16),
      this.chromeMaterial
    );
    lowerMast.position.y = lowerMastHeight / 2;
    lowerMast.castShadow = true;
    stand.add(lowerMast);

    // Bottom base end cap resting flat on floor (y = 0)
    const bottomCap = new THREE.Mesh(
      new THREE.CylinderGeometry(0.019, 0.019, 0.014, 16),
      this.blackMetalMaterial
    );
    bottomCap.position.y = 0.007;
    stand.add(bottomCap);

    // Lower Strut Spreader Collar (Chrome)
    const lowerCollar = new THREE.Mesh(
      new THREE.CylinderGeometry(0.021, 0.021, 0.024, 16),
      this.chromeMaterial
    );
    lowerCollar.position.y = lowerCollarY;
    stand.add(lowerCollar);

    // Upper Leg Hinge Collar (Chrome) with wing T-bolt
    const upperCollar = new THREE.Mesh(
      new THREE.CylinderGeometry(0.022, 0.022, 0.028, 16),
      this.chromeMaterial
    );
    upperCollar.position.y = upperCollarY;
    stand.add(upperCollar);

    const wingBolt = this._createWingScrew();
    wingBolt.position.set(0.024, upperCollarY, 0);
    wingBolt.rotation.z = Math.PI / 2;
    stand.add(wingBolt);

    // 3 Symmetrical Double-Braced Legs (spaced at exact 120° intervals)
    for (let i = 0; i < 3; i++) {
      const legAngle = baseAngle + (i * Math.PI * 2) / 3;
      const cosA = Math.cos(legAngle);
      const sinA = Math.sin(legAngle);

      // Orthogonal lateral vector for parallel double-braced bars
      const perpX = -sinA;
      const perpZ = cosA;
      const barSpacing = 0.0065; // ±6.5mm lateral separation for heavy-duty dual bars

      // Foot resting flat on the riser floor at y = 0
      const footPos = new THREE.Vector3(cosA * tripodRadius, 0.014, sinA * tripodRadius);

      // Upper collar hinge point
      const upperHinge = new THREE.Vector3(cosA * 0.022, upperCollarY, sinA * 0.022);

      // Dual parallel chrome leg bars running from upper collar to foot
      const legOffset1 = new THREE.Vector3(perpX * barSpacing, 0, perpZ * barSpacing);
      const legOffset2 = new THREE.Vector3(-perpX * barSpacing, 0, -perpZ * barSpacing);

      addStrut(
        new THREE.Vector3().copy(upperHinge).add(legOffset1),
        new THREE.Vector3().copy(footPos).add(legOffset1),
        0.0055,
        this.chromeMaterial
      );
      addStrut(
        new THREE.Vector3().copy(upperHinge).add(legOffset2),
        new THREE.Vector3().copy(footPos).add(legOffset2),
        0.0055,
        this.chromeMaterial
      );

      // Lower collar hinge point
      const lowerHinge = new THREE.Vector3(cosA * 0.021, lowerCollarY, sinA * 0.021);

      // Strut attaches between the two bars at the midpoint of the main leg
      const midLegPoint = new THREE.Vector3().copy(upperHinge).add(footPos).multiplyScalar(0.50);
      addStrut(lowerHinge, midLegPoint, 0.005, this.chromeMaterial);

      // Chrome foot knuckle bracket uniting the dual bars at the bottom
      const footBracket = new THREE.Mesh(
        new THREE.BoxGeometry(0.020, 0.018, 0.020),
        this.chromeMaterial
      );
      footBracket.position.set(footPos.x, footPos.y + 0.012, footPos.z);
      footBracket.rotation.y = -legAngle;
      stand.add(footBracket);

      // Heavy molded ribbed rubber foot resting firmly on the floor at y = 0
      const foot = new THREE.Mesh(
        new THREE.CylinderGeometry(0.015, 0.022, 0.026, 14),
        this.rubberMaterial
      );
      foot.position.copy(footPos);
      foot.castShadow = true;
      stand.add(foot);
    }

    // Height Adjustment Clamp with Chrome T-bolt Wing Screw
    const clampGeom = new THREE.CylinderGeometry(0.022, 0.022, 0.038, 16);
    const clamp = new THREE.Mesh(clampGeom, this.chromeMaterial);
    clamp.position.y = 0.58;
    stand.add(clamp);

    const mastWingScrew = this._createWingScrew();
    mastWingScrew.position.set(0.026, 0.58, 0);
    mastWingScrew.rotation.z = Math.PI / 2;
    stand.add(mastWingScrew);

    // 2. Upper Telescoping Mast (Chrome)
    const upperMastGeom = new THREE.CylinderGeometry(0.013, 0.013, 0.16, 16);
    const upperMast = new THREE.Mesh(upperMastGeom, this.chromeMaterial);
    upperMast.position.y = 0.62;
    upperMast.castShadow = true;
    stand.add(upperMast);

    // 4. Horizontal Conga Spreader Bar & Cradle Mounting Brackets
    const crossBarGroup = new THREE.Group();
    crossBarGroup.position.y = 0.68;

    // Central clamp block
    const centerBracket = new THREE.Mesh(
      new THREE.BoxGeometry(0.06, 0.05, 0.05),
      this.blackMetalMaterial
    );
    crossBarGroup.add(centerBracket);

    // Horizontal heavy cross tube
    const crossBar = new THREE.Mesh(
      new THREE.CylinderGeometry(0.014, 0.014, 0.44, 16),
      this.blackMetalMaterial
    );
    crossBar.rotation.z = Math.PI / 2;
    crossBarGroup.add(crossBar);

    // Left & Right Conga Cradles (Curved padded brackets)
    [-0.22, 0.22].forEach((xPos, idx) => {
      const cradleGroup = new THREE.Group();
      cradleGroup.position.set(xPos, 0, 0);

      // Support collar
      const cradleCollar = new THREE.Mesh(
        new THREE.CylinderGeometry(0.022, 0.022, 0.04, 12),
        this.blackMetalMaterial
      );
      cradleCollar.position.y = 0.01;
      cradleGroup.add(cradleCollar);

      // Semicircular padded steel band holding conga shell
      const bandRadius = idx === 0 ? 0.165 : 0.185;
      const bandGeom = new THREE.TorusGeometry(bandRadius, 0.010, 8, 24, Math.PI);
      const band = new THREE.Mesh(bandGeom, this.blackMetalMaterial);
      band.rotation.x = Math.PI / 2;
      band.position.set(0, 0.02, 0);
      cradleGroup.add(band);

      // Rubber cushions on the cradle
      [-0.08, 0.08].forEach(cz => {
        const pad = new THREE.Mesh(
          new THREE.BoxGeometry(0.02, 0.035, 0.025),
          this.rubberMaterial
        );
        pad.position.set(idx === 0 ? 0.08 : -0.08, 0.02, cz);
        cradleGroup.add(pad);
      });

      crossBarGroup.add(cradleGroup);
    });

    stand.add(crossBarGroup);

    // 5. Bongo Extension Column & Tilter (set back along -Z behind congas)
    // Horizontal setback arm connecting central bracket to rear vertical mast
    const setbackArmGeom = new THREE.CylinderGeometry(0.013, 0.013, 0.22, 12);
    const setbackArm = new THREE.Mesh(setbackArmGeom, this.blackMetalMaterial);
    setbackArm.rotation.x = Math.PI / 2;
    setbackArm.position.set(0, 0.68, -0.11);
    setbackArm.castShadow = true;
    stand.add(setbackArm);

    // Rear vertical socket clamp
    const rearSocket = new THREE.Mesh(
      new THREE.CylinderGeometry(0.020, 0.020, 0.05, 12),
      this.blackMetalMaterial
    );
    rearSocket.position.set(0, 0.69, -0.22);
    stand.add(rearSocket);

    // Chrome extension mast rising to tilter
    const bongoExtensionGeom = new THREE.CylinderGeometry(0.012, 0.012, 0.44, 14);
    const bongoExtension = new THREE.Mesh(bongoExtensionGeom, this.chromeMaterial);
    bongoExtension.position.set(0, 0.90, -0.22);
    bongoExtension.castShadow = true;
    stand.add(bongoExtension);

    // Bongo Tilter Bracket
    const tilterClamp = new THREE.Mesh(
      new THREE.BoxGeometry(0.05, 0.05, 0.06),
      this.blackMetalMaterial
    );
    tilterClamp.position.set(0, 1.14, -0.22);
    stand.add(tilterClamp);

    const bongoWingScrew = this._createWingScrew();
    bongoWingScrew.position.set(0.032, 1.14, -0.22);
    bongoWingScrew.rotation.z = Math.PI / 2;
    stand.add(bongoWingScrew);

    this.group.add(stand);
  }

  _createWingScrew() {
    const group = new THREE.Group();
    const shaft = new THREE.Mesh(
      new THREE.CylinderGeometry(0.005, 0.005, 0.028, 8),
      this.chromeMaterial
    );
    group.add(shaft);

    const wings = new THREE.Mesh(
      new THREE.BoxGeometry(0.028, 0.010, 0.006),
      this.chromeMaterial
    );
    wings.position.y = 0.014;
    group.add(wings);
    return group;
  }

  /* ------------------------------------------------------------------ */
  /*  CONGAS: QUINTO (LEFT) & TUMBA (RIGHT)                             */
  /* ------------------------------------------------------------------ */

  _buildCongas() {
    // 1. Quinto (High Conga, ~11" top head)
    this.quintoGroup = new THREE.Group();
    this.quintoGroup.position.set(-0.22, this.restTransforms.quinto.y, 0.0);
    this._assembleCongaDrum(this.quintoGroup, {
      name: 'quinto',
      headRadius: 0.140,
      bellyRadius: 0.170,
      baseRadius: 0.105,
      height: 0.72,
      lugCount: 5
    });
    this.group.add(this.quintoGroup);

    // 2. Tumba (Low Conga, ~12.5" top head)
    this.tumbaGroup = new THREE.Group();
    this.tumbaGroup.position.set(0.22, this.restTransforms.tumba.y, 0.0);
    this._assembleCongaDrum(this.tumbaGroup, {
      name: 'tumba',
      headRadius: 0.155,
      bellyRadius: 0.190,
      baseRadius: 0.118,
      height: 0.72,
      lugCount: 6
    });
    this.group.add(this.tumbaGroup);
  }

  _assembleCongaDrum(parentGroup, config) {
    const { name, headRadius, bellyRadius, baseRadius, height, lugCount } = config;
    const halfH = height / 2;

    // A. Parabolic Lathe Shell Geometry
    const lathePoints = [];
    const steps = 22;
    for (let i = 0; i <= steps; i++) {
      const t = i / steps; // 0 (bottom) to 1 (top)
      const y = -halfH + t * height;
      // Parabolic belly curve: peak belly bulge at ~62% of height
      let r;
      if (t < 0.62) {
        const st = t / 0.62;
        r = baseRadius + (bellyRadius - baseRadius) * Math.sin(st * Math.PI * 0.5);
      } else {
        const st = (t - 0.62) / 0.38;
        r = bellyRadius - (bellyRadius - headRadius) * Math.sin(st * Math.PI * 0.5);
      }
      lathePoints.push(new THREE.Vector2(r, y));
    }

    const shellGeom = new THREE.LatheGeometry(lathePoints, 28);
    const shell = new THREE.Mesh(shellGeom, this.woodMaterial);
    shell.castShadow = true;
    shell.receiveShadow = true;
    parentGroup.add(shell);

    // B. Natural Rawhide Drumhead
    const headGeom = new THREE.CircleGeometry(headRadius * 0.98, 28);
    const head = new THREE.Mesh(headGeom, this.drumheadMaterial);
    head.rotation.x = -Math.PI / 2;
    head.position.y = halfH - 0.002;
    head.receiveShadow = true;
    parentGroup.add(head);

    if (name === 'quinto') {
      this.quintoHead = head;
    } else {
      this.tumbaHead = head;
    }

    // C. Traditional Black Comfort Curve Counterhoop Rim
    const rimGeom = new THREE.TorusGeometry(headRadius + 0.006, 0.012, 10, 32);
    const rim = new THREE.Mesh(rimGeom, this.blackMetalMaterial);
    rim.rotation.x = Math.PI / 2;
    rim.position.y = halfH + 0.004;
    rim.castShadow = true;
    parentGroup.add(rim);

    // Inner crown ring
    const crownRing = new THREE.Mesh(
      new THREE.CylinderGeometry(headRadius + 0.008, headRadius + 0.008, 0.024, 28, 1, true),
      this.blackMetalMaterial
    );
    crownRing.position.y = halfH - 0.006;
    parentGroup.add(crownRing);

    // D. Black Protective Bottom Steel Ring
    const bottomRing = new THREE.Mesh(
      new THREE.CylinderGeometry(baseRadius + 0.008, baseRadius + 0.008, 0.022, 28),
      this.blackMetalMaterial
    );
    bottomRing.position.y = -halfH + 0.011;
    bottomRing.castShadow = true;
    parentGroup.add(bottomRing);

    // Rubber base protector lip
    const rubberLip = new THREE.Mesh(
      new THREE.CylinderGeometry(baseRadius + 0.011, baseRadius + 0.011, 0.008, 28),
      this.rubberMaterial
    );
    rubberLip.position.y = -halfH + 0.004;
    parentGroup.add(rubberLip);

    // E. Chrome Tuning Tension Lugs & Teardrop Side Plates
    for (let i = 0; i < lugCount; i++) {
      const angle = (i * Math.PI * 2) / lugCount;
      const cosA = Math.cos(angle);
      const sinA = Math.sin(angle);

      // Side-plate position on the shell upper belly (around y = +0.15)
      const plateY = 0.15;
      const shellR = bellyRadius * 0.99;
      const plateX = cosA * shellR;
      const plateZ = sinA * shellR;

      // Teardrop / Shield side plate
      const plate = new THREE.Mesh(
        new THREE.BoxGeometry(0.022, 0.055, 0.010),
        this.blackMetalMaterial
      );
      plate.position.set(plateX, plateY, plateZ);
      plate.rotation.y = -angle + Math.PI / 2;
      parentGroup.add(plate);

      // Hex mounting bolts on plate
      [-0.018, 0.018].forEach(by => {
        const bolt = new THREE.Mesh(
          new THREE.CylinderGeometry(0.004, 0.004, 0.006, 6),
          this.chromeMaterial
        );
        bolt.rotation.x = Math.PI / 2;
        bolt.position.set(0, by, 0.006);
        plate.add(bolt);
      });

      // Chrome tension hook lug: runs from rim hook (halfH + 0.004) down to side plate
      const lugLength = (halfH + 0.004) - plateY;
      const lugGeom = new THREE.CylinderGeometry(0.004, 0.004, lugLength, 8);
      const lug = new THREE.Mesh(lugGeom, this.chromeMaterial);
      const lugR = headRadius + 0.012;
      lug.position.set(cosA * lugR, plateY + lugLength / 2, sinA * lugR);
      lug.castShadow = true;
      parentGroup.add(lug);

      // Top curved hook gripping the rim
      const hook = new THREE.Mesh(
        new THREE.TorusGeometry(0.008, 0.004, 6, 12, Math.PI),
        this.chromeMaterial
      );
      hook.rotation.y = -angle + Math.PI / 2;
      hook.rotation.z = Math.PI / 2;
      hook.position.set(cosA * (lugR - 0.003), halfH + 0.007, sinA * (lugR - 0.003));
      parentGroup.add(hook);

      // Bottom tuning nut
      const nut = new THREE.Mesh(
        new THREE.CylinderGeometry(0.006, 0.006, 0.014, 6),
        this.chromeMaterial
      );
      nut.position.set(cosA * (lugR + 0.001), plateY - 0.012, sinA * (lugR + 0.001));
      parentGroup.add(nut);
    }

    // F. Oval Pearl-Style Metal Brand Badge (Front facing: +Z)
    const badgeGeom = new THREE.CylinderGeometry(0.024, 0.024, 0.004, 16);
    const badge = new THREE.Mesh(badgeGeom, this.badgeMaterial);
    badge.rotation.x = Math.PI / 2;
    badge.scale.set(1.4, 0.75, 1.0);
    badge.position.set(0, 0.04, bellyRadius + 0.003);
    parentGroup.add(badge);
  }

  /* ------------------------------------------------------------------ */
  /*  BONGOS: MACHO (LEFT) & HEMBRA (RIGHT) ON TILTER ARM               */
  /* ------------------------------------------------------------------ */

  _buildBongos() {
    this.bongoSetGroup = new THREE.Group();
    this.bongoSetGroup.position.set(0, this.restTransforms.bongoSet.y, this.restTransforms.bongoSet.z);
    // Ergonomic forward tilt towards player
    this.bongoSetGroup.rotation.x = this.restTransforms.bongoSet.rx;

    // Solid Hardwood Center Connecting Block
    const blockGeom = new THREE.BoxGeometry(0.07, 0.09, 0.055);
    const centerBlock = new THREE.Mesh(blockGeom, this.woodBlockMaterial);
    centerBlock.position.set(0, 0.03, 0);
    centerBlock.castShadow = true;
    this.bongoSetGroup.add(centerBlock);

    // Steel center through-bolt with chrome washers
    const throughBolt = new THREE.Mesh(
      new THREE.CylinderGeometry(0.006, 0.006, 0.09, 8),
      this.chromeMaterial
    );
    throughBolt.rotation.z = Math.PI / 2;
    throughBolt.position.set(0, 0.03, 0);
    this.bongoSetGroup.add(throughBolt);

    // 1. Macho (High Bongo, smaller drum ~7")
    this.machoGroup = new THREE.Group();
    this.machoGroup.position.set(-0.135, 0.03, 0);
    this._assembleBongoDrum(this.machoGroup, {
      name: 'macho',
      topRadius: 0.088,
      bottomRadius: 0.066,
      height: 0.165,
      lugCount: 4
    });
    this.bongoSetGroup.add(this.machoGroup);

    // 2. Hembra (Low Bongo, larger drum ~8.5")
    this.hembraGroup = new THREE.Group();
    this.hembraGroup.position.set(0.135, 0.03, 0);
    this._assembleBongoDrum(this.hembraGroup, {
      name: 'hembra',
      topRadius: 0.108,
      bottomRadius: 0.082,
      height: 0.165,
      lugCount: 4
    });
    this.bongoSetGroup.add(this.hembraGroup);

    this.group.add(this.bongoSetGroup);
  }

  _assembleBongoDrum(parentGroup, config) {
    const { name, topRadius, bottomRadius, height, lugCount } = config;
    const halfH = height / 2;

    // A. Tapered Wooden Shell
    const shellGeom = new THREE.CylinderGeometry(topRadius, bottomRadius, height, 24);
    const shell = new THREE.Mesh(shellGeom, this.woodMaterial);
    shell.castShadow = true;
    shell.receiveShadow = true;
    parentGroup.add(shell);

    // B. Natural Rawhide Drumhead
    const headGeom = new THREE.CircleGeometry(topRadius * 0.98, 24);
    const head = new THREE.Mesh(headGeom, this.drumheadMaterial);
    head.rotation.x = -Math.PI / 2;
    head.position.y = halfH - 0.001;
    head.receiveShadow = true;
    parentGroup.add(head);

    if (name === 'macho') {
      this.machoHead = head;
    } else {
      this.hembraHead = head;
    }

    // C. Traditional Black Counterhoop Rim
    const rimGeom = new THREE.TorusGeometry(topRadius + 0.005, 0.009, 8, 24);
    const rim = new THREE.Mesh(rimGeom, this.blackMetalMaterial);
    rim.rotation.x = Math.PI / 2;
    rim.position.y = halfH + 0.003;
    rim.castShadow = true;
    parentGroup.add(rim);

    // D. Chrome / Black Bottom Half-Moon Base Ring
    const bottomRing = new THREE.Mesh(
      new THREE.CylinderGeometry(bottomRadius + 0.006, bottomRadius + 0.006, 0.016, 24),
      this.chromeMaterial
    );
    bottomRing.position.y = -halfH + 0.008;
    bottomRing.castShadow = true;
    parentGroup.add(bottomRing);

    // E. Chrome Tuning Rods & Side Brackets
    for (let i = 0; i < lugCount; i++) {
      const angle = (i * Math.PI * 2) / lugCount + Math.PI / 4;
      const cosA = Math.cos(angle);
      const sinA = Math.sin(angle);

      // Rod
      const rodR = (topRadius + bottomRadius) / 2 + 0.010;
      const rodGeom = new THREE.CylinderGeometry(0.0035, 0.0035, height * 0.88, 8);
      const rod = new THREE.Mesh(rodGeom, this.chromeMaterial);
      rod.position.set(cosA * rodR, 0, sinA * rodR);
      rod.castShadow = true;
      parentGroup.add(rod);

      // Top hook over rim
      const hook = new THREE.Mesh(
        new THREE.TorusGeometry(0.006, 0.0035, 6, 10, Math.PI),
        this.chromeMaterial
      );
      hook.rotation.y = -angle + Math.PI / 2;
      hook.rotation.z = Math.PI / 2;
      hook.position.set(cosA * (rodR - 0.003), halfH + 0.005, sinA * (rodR - 0.003));
      parentGroup.add(hook);

      // Bottom tuning nut
      const nut = new THREE.Mesh(
        new THREE.CylinderGeometry(0.005, 0.005, 0.012, 6),
        this.chromeMaterial
      );
      nut.position.set(cosA * rodR, -halfH + 0.006, sinA * rodR);
      parentGroup.add(nut);
    }

    // F. Small Front Metal Badge
    const badgeGeom = new THREE.CylinderGeometry(0.015, 0.015, 0.003, 14);
    const badge = new THREE.Mesh(badgeGeom, this.badgeMaterial);
    badge.rotation.x = Math.PI / 2;
    badge.scale.set(1.3, 0.7, 1.0);
    badge.position.set(0, 0, (topRadius + bottomRadius) / 2 + 0.003);
    parentGroup.add(badge);
  }

  /* ------------------------------------------------------------------ */
  /*  PERCUSSIONIST HANDS (LEFT & RIGHT)                                */
  /* ------------------------------------------------------------------ */

  _buildHands() {
    this.hands = {
      left: {
        mesh: null,
        targetPiece: 'quinto',
        homePiece: 'quinto',
        idleTimer: null,
        rest: {
          x: -0.22,
          y: 1.15,
          z: 0.12,
          rx: -0.32,
          ry: 0.10,
          rz: -0.08
        },
        bongoTarget: {
          x: -0.135,
          y: 1.33,
          z: -0.14,
          rx: -0.15,
          ry: 0.15,
          rz: -0.05
        }
      },
      right: {
        mesh: null,
        targetPiece: 'tumba',
        homePiece: 'tumba',
        idleTimer: null,
        rest: {
          x: 0.22,
          y: 1.15,
          z: 0.12,
          rx: -0.32,
          ry: -0.10,
          rz: 0.08
        },
        bongoTarget: {
          x: 0.135,
          y: 1.33,
          z: -0.14,
          rx: -0.15,
          ry: -0.15,
          rz: 0.05
        }
      }
    };

    // Build Left Hand (Quinto conga & Macho bongo)
    const leftHand = this._createHandMesh(true);
    leftHand.position.set(this.hands.left.rest.x, this.hands.left.rest.y, this.hands.left.rest.z);
    leftHand.rotation.set(this.hands.left.rest.rx, this.hands.left.rest.ry, this.hands.left.rest.rz);
    this.hands.left.mesh = leftHand;
    leftHand.visible = false;
    this.group.add(leftHand);

    // Build Right Hand (Tumba conga & Hembra bongo)
    const rightHand = this._createHandMesh(false);
    rightHand.position.set(this.hands.right.rest.x, this.hands.right.rest.y, this.hands.right.rest.z);
    rightHand.rotation.set(this.hands.right.rest.rx, this.hands.right.rest.ry, this.hands.right.rest.rz);
    this.hands.right.mesh = rightHand;
    rightHand.visible = false;
    this.group.add(rightHand);
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
    // Shape drawn in XY: X = hand width, Y = wrist→knuckle direction
    // After rotateX(-π/2): Y becomes palm thickness, -Z becomes finger direction
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

    // ── 3. THUMB ── Single extruded tapered body, extended outward (visible) ──
    const thumbGroup = new THREE.Group();
    // Keep the thumb on the dorsal/visible side of the palm. The previous
    // rotation sent it inward beneath the hand for both mirrored meshes.
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

    return handGroup;
  }

  _strikeHand(handKey, piece, vel, isMuted = false) {
    const hand = this.hands?.[handKey];
    if (!hand || !hand.mesh) return;

    if (hand.idleTimer) {
      clearTimeout(hand.idleTimer);
      hand.idleTimer = null;
    }
    hand.mesh.visible = true;

    const isBongo = (piece === 'macho' || piece === 'hembra');
    const targetBase = isBongo ? hand.bongoTarget : hand.rest;

    gsap.killTweensOf(hand.mesh.position);
    gsap.killTweensOf(hand.mesh.rotation);

    // Strike depth: downward stroke dipping toward drumhead surface
    const strikeDepth = (isMuted ? 0.036 : 0.048) * vel;
    const strikePitch = (isMuted ? -0.24 : -0.16) * vel;

    const hitY = targetBase.y - strikeDepth;
    const hitRx = targetBase.rx + strikePitch;

    // Downward attack stroke
    gsap.to(hand.mesh.position, {
      x: targetBase.x,
      z: targetBase.z,
      y: hitY,
      duration: 0.042,
      ease: 'power3.in',
      onComplete: () => {
        // Elastic rebound
        const reboundDuration = isMuted ? 0.12 : (0.22 + vel * 0.10);
        const reboundEase = isMuted ? 'power2.out' : 'elastic.out(1.18, 0.32)';

        gsap.to(hand.mesh.position, {
          y: targetBase.y,
          duration: reboundDuration,
          ease: reboundEase
        });

        gsap.to(hand.mesh.rotation, {
          x: targetBase.rx,
          y: targetBase.ry,
          z: targetBase.rz,
          duration: reboundDuration,
          ease: reboundEase
        });
      }
    });

    gsap.to(hand.mesh.rotation, {
      x: hitRx,
      duration: 0.042,
      ease: 'power3.in'
    });

    // Match the drumsticks: remain ready briefly, withdraw, then disappear
    // until the next prepared strike.
    hand.idleTimer = setTimeout(() => {
      gsap.to(hand.mesh.rotation, {
        x: targetBase.rx - 0.18,
        y: targetBase.ry,
        z: targetBase.rz,
        duration: 0.30,
        ease: 'power2.inOut'
      });
      gsap.to(hand.mesh.position, {
        y: targetBase.y + 0.055,
        duration: 0.30,
        ease: 'power2.inOut',
        onComplete: () => {
          hand.mesh.visible = false;
          hand.mesh.position.set(hand.rest.x, hand.rest.y, hand.rest.z);
          hand.mesh.rotation.set(hand.rest.rx, hand.rest.ry, hand.rest.rz);
        }
      });
    }, HAND_IDLE_TIMEOUT_MS);
  }

  /* ------------------------------------------------------------------ */
  /*  PHYSICAL NOTE ANIMATION & SPRING RECOIL                           */
  /* ------------------------------------------------------------------ */

  /**
   * Shows and raises the correct hand shortly before the MIDI note, matching
   * the anticipation used by the drum kit's sticks.
   */
  onNotePrepare(midiPitch, velocity = 0.8) {
    const vel = Math.max(0.2, Math.min(1.0, velocity));
    const isLeft = midiPitch === 60 || midiPitch === 62 || midiPitch === 63 || midiPitch > 64;
    const isBongo = midiPitch === 60 || midiPitch === 61;
    const hand = this.hands?.[isLeft ? 'left' : 'right'];
    if (!hand?.mesh) return;

    if (hand.idleTimer) {
      clearTimeout(hand.idleTimer);
      hand.idleTimer = null;
    }

    const target = isBongo ? hand.bongoTarget : hand.rest;
    hand.mesh.visible = true;
    gsap.killTweensOf(hand.mesh.position);
    gsap.killTweensOf(hand.mesh.rotation);
    gsap.to(hand.mesh.position, {
      x: target.x,
      y: target.y + 0.065 * vel,
      z: target.z,
      duration: 0.18,
      ease: 'power2.out'
    });
    gsap.to(hand.mesh.rotation, {
      x: target.rx - 0.22 * vel,
      y: target.ry,
      z: target.rz,
      duration: 0.18,
      ease: 'power2.out'
    });
  }

  /**
   * Called when a note begins playing.
   * General MIDI Percussion Map:
   * 60: High Bongo (Macho)
   * 61: Low Bongo (Hembra)
   * 62: Mute Hi Conga (Quinto Slap)
   * 63: Open Hi Conga (Quinto Open)
   * 64: Low Conga (Tumba Open)
   */
  onNoteOn(midiPitch, velocity = 0.8, eventTime = null, trackIndex = null, duration = 0.5) {
    const vel = Math.max(0.2, Math.min(1.0, velocity));

    // Determine target drum piece
    let piece = 'tumba';
    let isMuted = false;

    if (midiPitch === 60) {
      piece = 'macho';
    } else if (midiPitch === 61) {
      piece = 'hembra';
    } else if (midiPitch === 62) {
      piece = 'quinto';
      isMuted = true;
    } else if (midiPitch === 63) {
      piece = 'quinto';
    } else if (midiPitch === 64) {
      piece = 'tumba';
    } else if (midiPitch < 62) {
      // Fallback for lower pitches
      piece = 'tumba';
    } else {
      // Fallback for higher pitches
      piece = 'quinto';
    }

    this._triggerDrumPhysics(piece, vel, isMuted);
  }

  _triggerDrumPhysics(piece, vel, isMuted = false) {
    switch (piece) {
      case 'macho':
        this._strikeBongo(this.machoHead, this.restTransforms.machoHead.y, vel, true);
        this._strikeHand('left', 'macho', vel, false);
        break;
      case 'hembra':
        this._strikeBongo(this.hembraHead, this.restTransforms.hembraHead.y, vel, false);
        this._strikeHand('right', 'hembra', vel, false);
        break;
      case 'quinto':
        this._strikeConga(this.quintoGroup, this.quintoHead, this.restTransforms.quinto, this.restTransforms.quintoHead.y, vel, true, isMuted);
        this._strikeHand('left', 'quinto', vel, isMuted);
        break;
      case 'tumba':
        this._strikeConga(this.tumbaGroup, this.tumbaHead, this.restTransforms.tumba, this.restTransforms.tumbaHead.y, vel, false, false);
        this._strikeHand('right', 'tumba', vel, false);
        break;
    }
  }

  _strikeConga(congaGroup, headMesh, restPos, restHeadY, vel, isLeft, isMuted) {
    if (!congaGroup || !headMesh) return;

    // 1. Membrane instantaneous depression & elastic rebound
    gsap.killTweensOf(headMesh.position);
    const depression = isMuted ? 0.005 * vel : 0.0085 * vel;
    headMesh.position.y = restHeadY - depression;

    gsap.to(headMesh.position, {
      y: restHeadY,
      duration: isMuted ? 0.10 : 0.22,
      ease: 'elastic.out(1.2, 0.35)'
    });

    // 2. Physical Conga Shell Sway on Stand Cradle
    gsap.killTweensOf(congaGroup.rotation);
    gsap.killTweensOf(congaGroup.position);

    const tiltX = -0.045 * vel; // Rocks backward away from strike
    const tiltZ = (isLeft ? -0.035 : 0.035) * vel; // Tilts slightly outward
    const dropY = restPos.y - 0.006 * vel;

    congaGroup.position.y = dropY;
    congaGroup.rotation.x = tiltX;
    congaGroup.rotation.z = tiltZ;

    // Elastic spring oscillation returning to rest
    const decayDuration = isMuted ? 0.18 : (0.35 + vel * 0.25);
    const easeType = isMuted ? 'power2.out' : 'elastic.out(1.1, 0.38)';

    gsap.to(congaGroup.position, {
      y: restPos.y,
      duration: decayDuration,
      ease: easeType
    });

    gsap.to(congaGroup.rotation, {
      x: restPos.rx,
      z: restPos.rz,
      duration: decayDuration,
      ease: easeType
    });
  }

  _strikeBongo(headMesh, restHeadY, vel, isMacho) {
    if (!headMesh || !this.bongoSetGroup) return;

    // 1. Membrane depression
    gsap.killTweensOf(headMesh.position);
    const depression = 0.007 * vel;
    headMesh.position.y = restHeadY - depression;

    gsap.to(headMesh.position, {
      y: restHeadY,
      duration: 0.14,
      ease: 'elastic.out(1.2, 0.3)'
    });

    // 2. Bongo Stand Tilter Arm Nod & Recoil
    gsap.killTweensOf(this.bongoSetGroup.rotation);
    const rest = this.restTransforms.bongoSet;

    const nodX = rest.rx + (isMacho ? 0.032 : 0.038) * vel;
    const rollZ = (isMacho ? -0.024 : 0.024) * vel;

    this.bongoSetGroup.rotation.x = nodX;
    this.bongoSetGroup.rotation.z = rollZ;

    gsap.to(this.bongoSetGroup.rotation, {
      x: rest.rx,
      z: rest.rz,
      duration: 0.28,
      ease: 'elastic.out(1.15, 0.32)'
    });
  }

  onNoteOff(midiPitch, force = false) {
    // Hand percussion is impulsive; damp quickly if forced
    if (force) {
      if (this.quintoGroup) gsap.killTweensOf(this.quintoGroup.rotation);
      if (this.tumbaGroup) gsap.killTweensOf(this.tumbaGroup.rotation);
      if (this.bongoSetGroup) gsap.killTweensOf(this.bongoSetGroup.rotation);

      if (this.quintoGroup) this.quintoGroup.rotation.set(0, 0, 0);
      if (this.tumbaGroup) this.tumbaGroup.rotation.set(0, 0, 0);
      if (this.bongoSetGroup) this.bongoSetGroup.rotation.set(this.restTransforms.bongoSet.rx, 0, 0);

      if (this.hands) {
        Object.values(this.hands).forEach(hand => {
          if (!hand?.mesh) return;
          if (hand.idleTimer) clearTimeout(hand.idleTimer);
          hand.idleTimer = null;
          gsap.killTweensOf(hand.mesh.position);
          gsap.killTweensOf(hand.mesh.rotation);
          hand.mesh.visible = false;
          hand.mesh.position.set(hand.rest.x, hand.rest.y, hand.rest.z);
          hand.mesh.rotation.set(hand.rest.rx, hand.rest.ry, hand.rest.rz);
        });
      }
    }
  }

  update(delta) {
    if (!this.group.visible) return;
    this.hoverTime = (this.hoverTime || 0) + delta * 2.2;
    const breath = Math.sin(this.hoverTime) * 0.0025;
    if (this.hands) {
      ['left', 'right'].forEach(key => {
        const h = this.hands[key];
        if (h?.mesh && !gsap.isTweening(h.mesh.position)) {
          const isNearBongo = Math.abs(h.mesh.position.z - h.bongoTarget.z) < 0.05;
          const targetBaseY = isNearBongo ? h.bongoTarget.y : h.rest.y;
          h.mesh.position.y = targetBaseY + breath;
        }
      });
    }
  }
}
