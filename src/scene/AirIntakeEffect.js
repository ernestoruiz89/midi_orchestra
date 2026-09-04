import * as THREE from 'three';

/**
 * Small animated air stream travelling from outside into an instrument's
 * mouthpiece. The effect is parented to the mouthpiece so it follows every
 * instrument transform and recoil animation.
 */
export class AirIntakeEffect {
  constructor(parent, {
    origin = new THREE.Vector3(),
    outwardDirection = new THREE.Vector3(0, 1, 0),
    distance = 0.14,
    color = 0x38e2ff,
    count = 10
  } = {}) {
    this.origin = origin.clone();
    this.direction = outwardDirection.clone().normalize();
    this.distance = distance;
    this.active = false;
    this.elapsed = 0;
    this.velocity = 0.8;
    this.rings = [];

    const ringOrientation = new THREE.Quaternion().setFromUnitVectors(
      new THREE.Vector3(0, 0, 1),
      this.direction
    );

    for (let i = 0; i < count; i++) {
      const material = new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      });
      const mesh = new THREE.Mesh(
        new THREE.TorusGeometry(0.0042, 0.0009, 8, 18),
        material
      );
      mesh.position.copy(this.origin);
      mesh.quaternion.copy(ringOrientation);
      parent.add(mesh);

      this.rings.push({
        mesh,
        material,
        offset: i / count,
        scale: 0.72 + i * 0.035
      });
    }
  }

  start(velocity = 0.8) {
    this.active = true;
    this.velocity = THREE.MathUtils.clamp(velocity, 0.25, 1);
  }

  stop() {
    this.active = false;
  }

  update(delta) {
    const dt = Math.min(0.1, Math.max(0.001, delta));

    if (!this.active) {
      this.rings.forEach(({ material }) => {
        material.opacity = THREE.MathUtils.lerp(material.opacity, 0, dt * 10);
      });
      return;
    }

    this.elapsed += dt;
    this.rings.forEach((ring) => {
      const progress = (this.elapsed * 1.55 + ring.offset) % 1;
      const distanceFromMouth = this.distance * (1 - progress);

      ring.mesh.position.copy(this.origin).addScaledVector(this.direction, distanceFromMouth);
      const size = ring.scale * (0.62 + (1 - progress) * 1.45);
      ring.mesh.scale.setScalar(size);

      const fadeIn = Math.min(1, progress / 0.16);
      const fadeOut = Math.min(1, (1 - progress) / 0.22);
      ring.material.opacity = Math.min(fadeIn, fadeOut) * 0.58 * this.velocity;
    });
  }
}
