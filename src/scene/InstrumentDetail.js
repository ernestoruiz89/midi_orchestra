import * as THREE from 'three';
import gsap from 'gsap';

// Hide only sub-pixel hardware at a distance. Keep the original geometry,
// transforms, materials and animation visibility intact for close-ups.
export class InstrumentDetail {
  constructor(group) {
    this.group = group;
    this.parts = [];
    this.center = new THREE.Vector3();
    this.scale = new THREE.Vector3();
    group.updateWorldMatrix(true, true);
    group.traverse(mesh => {
      if (!mesh.isMesh || !mesh.geometry || Array.isArray(mesh.material)) return;
      // Translucent note markers, air effects and glows must keep animating.
      if (mesh.material.transparent || mesh.material.isMeshBasicMaterial) return;
      const geometry = mesh.geometry;
      if (!geometry.boundingSphere) geometry.computeBoundingSphere();
      mesh.getWorldScale(this.scale);
      const diameter = geometry.boundingSphere.radius * 2 * Math.max(...this.scale.toArray());
      // Long strings, sticks, keys and instrument bodies are not micro-detail.
      if (diameter > 0 && diameter < 0.12) {
        this.parts.push({ mesh, sphere: geometry.boundingSphere, mask: mesh.layers.mask, hidden: false });
      }
    });
  }

  update(camera, viewportHeight, forceFullDetail = false) {
    const pixelsPerUnit = viewportHeight / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)));
    for (const part of this.parts) {
      const { mesh, sphere } = part;
      this.center.copy(sphere.center).applyMatrix4(mesh.matrixWorld);
      this.scale.setFromMatrixScale(mesh.matrixWorld);
      const diameter = sphere.radius * 2 * Math.max(this.scale.x, this.scale.y, this.scale.z);
      const pixels = diameter * pixelsPerUnit / Math.max(0.1, camera.position.distanceTo(this.center));
      // Hysteresis avoids flickering while orbiting near the detail threshold.
      const hidden = !forceFullDetail && pixels < (part.hidden ? 3.5 : 2.5);
      if (hidden !== part.hidden) {
        mesh.layers.mask = hidden ? 0 : part.mask;
        part.hidden = hidden;
      }
    }
  }
}

// Dispose resources owned by an unassigned instrument, preserving any shared
// geometry/material/texture still referenced by the remaining scene.
export function releaseInstrument(instrument, scene) {
  const geometries = new Set();
  const materials = new Set();
  const textures = new Set();
  const collect = (root, remove = false) => root.traverse(object => {
    const operation = remove ? 'delete' : 'add';
    if (object.geometry) geometries[operation](object.geometry);
    const mats = Array.isArray(object.material) ? object.material : [object.material];
    mats.filter(Boolean).forEach(material => {
      materials[operation](material);
      Object.values(material).forEach(value => {
        if (value?.isTexture) textures[operation](value);
      });
    });
  });
  instrument.group.traverse(object => {
    gsap.killTweensOf([object, object.position, object.rotation, object.scale, object.quaternion]);
    const mats = Array.isArray(object.material) ? object.material : [object.material];
    mats.filter(Boolean).forEach(material => gsap.killTweensOf([material, material.color, material.emissive].filter(Boolean)));
  });
  gsap.killTweensOf(instrument);
  instrument.group.removeFromParent();
  collect(instrument.group);
  collect(scene, true);
  geometries.forEach(resource => resource.dispose());
  materials.forEach(resource => resource.dispose());
  textures.forEach(resource => resource.dispose());
}
