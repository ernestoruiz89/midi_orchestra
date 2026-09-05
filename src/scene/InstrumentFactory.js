import { Piano3D } from './Piano3D.js';
import { DrumKit3D } from './DrumKit3D.js';
import { Guitar3D } from './Guitar3D.js';
import { AcousticGuitar3D } from './AcousticGuitar3D.js';
import { Bass3D } from './Bass3D.js';
import { Trumpet3D } from './Trumpet3D.js';
import { Saxophone3D } from './Saxophone3D.js';
import { FrenchHorn3D } from './FrenchHorn3D.js';
import { Clarinet3D } from './Clarinet3D.js';
import { Cabasa3D } from './Cabasa3D.js';
import { Tambourine3D } from './Tambourine3D.js';
import { Maracas3D } from './Maracas3D.js';
import { Guiro3D } from './Guiro3D.js';
import { Whistle3D } from './Whistle3D.js';
import { Triangle3D } from './Triangle3D.js';
import { BongoCongas3D } from './BongoCongas3D.js';
import { Timbales3D } from './Timbales3D.js';
import { Violin3D } from './Violin3D.js';
import { Cello3D } from './Cello3D.js';
import { DoubleBass3D } from './DoubleBass3D.js';
import { Flute3D } from './Flute3D.js';
import { Xylophone3D } from './Xylophone3D.js';
import { Synth3D } from './Synth3D.js';
import { Harp3D } from './Harp3D.js';
import { Harmonica3D } from './Harmonica3D.js';
import { Accordion3D } from './Accordion3D.js';

// Models are constructed only for assigned MIDI instances.
export const instrumentFactories = {
  piano: (scene) => {
    const instrument = new Piano3D(scene, { tier: 1, hasStand: true });
    return instrument;
  },
  drums: (scene) => {
    const instrument = new DrumKit3D(scene);
    return instrument;
  },
  guitar: (scene) => {
    const instrument = new Guitar3D(scene, { index: 1 });
    instrument.group.position.set(1.65, 1.25, 0.95);
    return instrument;
  },
  acousticGuitar: (scene) => {
    const instrument = new AcousticGuitar3D(scene, { index: 1 });
    instrument.group.position.set(1.05, 1.17, 1.45);
    return instrument;
  },
  bass: (scene) => {
    const instrument = new Bass3D(scene);
    return instrument;
  },
  doubleBass: (scene) => {
    const instrument = new DoubleBass3D(scene);
    return instrument;
  },
  trumpet: (scene) => {
    const instrument = new Trumpet3D(scene);
    return instrument;
  },
  frenchHorn: (scene) => {
    const instrument = new FrenchHorn3D(scene);
    return instrument;
  },
  sax: (scene) => {
    const instrument = new Saxophone3D(scene);
    return instrument;
  },
  clarinet: (scene) => {
    const instrument = new Clarinet3D(scene);
    return instrument;
  },
  violin: (scene) => {
    const instrument = new Violin3D(scene);
    return instrument;
  },
  cello: (scene) => {
    const instrument = new Cello3D(scene);
    return instrument;
  },
  flute: (scene) => {
    const instrument = new Flute3D(scene);
    return instrument;
  },
  xylophone: (scene) => {
    const instrument = new Xylophone3D(scene);
    instrument.group.rotation.y = Math.PI * 0.14;
    return instrument;
  },
  cabasa: (scene) => {
    const instrument = new Cabasa3D(scene);
    return instrument;
  },
  tambourine: (scene) => {
    const instrument = new Tambourine3D(scene);
    return instrument;
  },
  maracas: (scene) => {
    const instrument = new Maracas3D(scene);
    return instrument;
  },
  guiro: (scene) => {
    const instrument = new Guiro3D(scene);
    return instrument;
  },
  whistle: (scene) => {
    const instrument = new Whistle3D(scene);
    return instrument;
  },
  triangle: (scene) => {
    const instrument = new Triangle3D(scene);
    return instrument;
  },
  congas: (scene) => {
    const instrument = new BongoCongas3D(scene);
    return instrument;
  },
  timbales: (scene) => {
    const instrument = new Timbales3D(scene);
    return instrument;
  },
  synth: (scene) => {
    const instrument = new Synth3D(scene, { tier: 1, hasStand: true });
    instrument.group.rotation.y = Math.PI * 0.14;
    return instrument;
  },
  harp: (scene) => {
    const instrument = new Harp3D(scene);
    return instrument;
  },
  harmonica: (scene) => {
    const instrument = new Harmonica3D(scene);
    return instrument;
  },
  accordion: (scene) => {
    const instrument = new Accordion3D(scene);
    return instrument;
  },
  guitar_2: (scene) => {
    const instrument = new Guitar3D(scene, { index: 2 });
    instrument.group.position.set(1.90, 1.15, 0.65);
    instrument.group.visible = false;
    return instrument;
  },
  guitar_3: (scene) => {
    const instrument = new Guitar3D(scene, { index: 3 });
    instrument.group.position.set(2.15, 1.05, 0.35);
    instrument.group.visible = false;
    return instrument;
  },
  guitar_4: (scene) => {
    const instrument = new Guitar3D(scene, { index: 4 });
    instrument.group.position.set(2.40, 0.95, 0.05);
    instrument.group.visible = false;
    return instrument;
  },
  acousticGuitar_2: (scene) => {
    const instrument = new AcousticGuitar3D(scene, { index: 2 });
    instrument.group.position.set(1.28, 1.08, 1.20);
    instrument.group.visible = false;
    return instrument;
  },
  acousticGuitar_3: (scene) => {
    const instrument = new AcousticGuitar3D(scene, { index: 3 });
    instrument.group.position.set(1.50, 0.99, 0.95);
    instrument.group.visible = false;
    return instrument;
  },
  acousticGuitar_4: (scene) => {
    const instrument = new AcousticGuitar3D(scene, { index: 4 });
    instrument.group.position.set(1.72, 0.90, 0.70);
    instrument.group.visible = false;
    return instrument;
  },
  trumpet_2: (scene) => {
    const instrument = new Trumpet3D(scene);
    instrument.group.position.set(4.85, 1.40, 0.75);
    instrument.brassMaterial.color.setHex(0xd0d8e4); // Chrome/Silver Trumpet
    instrument.group.visible = false;
    return instrument;
  },
  sax_2: (scene) => {
    const instrument = new Saxophone3D(scene);
    instrument.group.position.set(3.85, 1.25, 2.35);
    instrument.brassMaterial.color.setHex(0xc2c8d2); // Vintage Nickel Alto Sax
    instrument.group.visible = false;
    return instrument;
  },
  violin_2: (scene) => {
    const instrument = new Violin3D(scene);
    instrument.group.position.set(-5.1, 1.30, -2.6);
    instrument.group.rotation.set(0.12, Math.PI * 0.18, -0.06);
    instrument.varnishMaterial.color.setHex(0x421d0d); // Dark Antique Violin
    instrument.group.visible = false;
    return instrument;
  },
  cello_2: (scene) => {
    const instrument = new Cello3D(scene);
    instrument.group.position.set(-3.7, 1.15, -1.6);
    instrument.group.rotation.set(0.14, Math.PI * 0.18, -0.05);
    instrument.varnishMaterial.color.setHex(0x522210); // Darker vintage varnish
    instrument.group.visible = false;
    return instrument;
  },
  doubleBass_2: (scene) => {
    const instrument = new DoubleBass3D(scene);
    instrument.group.position.set(-3.1, 1.25, -0.35);
    instrument.group.rotation.set(0.12, Math.PI * 0.16, -0.04);
    instrument.varnishMaterial.color.setHex(0x421808); // Dark antique varnish
    instrument.group.visible = false;
    return instrument;
  },
  flute_2: (scene) => {
    const instrument = new Flute3D(scene);
    instrument.group.position.set(2.3, 1.30, 2.4);
    instrument.silverMaterial.color.setHex(0xe8b898); // Rose Gold Concert Flute
    instrument.group.visible = false;
    return instrument;
  },
  bass_2: (scene) => {
    const instrument = new Bass3D(scene);
    instrument.group.position.set(-2.9, 0.95, -1.0);
    instrument.group.rotation.y = 0.38;
    instrument.bodyMaterial.color.setHex(0x1a1a20); // Matte Black Precision Bass
    instrument.group.visible = false;
    return instrument;
  },
  synth_2: (scene) => {
    const instrument = new Synth3D(scene, { tier: 2, hasStand: false });
    instrument.group.visible = false;
    instrument.group.rotation.y = Math.PI * 0.14;
    return instrument;
  },
  synth_3: (scene) => {
    const instrument = new Synth3D(scene, { tier: 3, hasStand: false });
    instrument.group.visible = false;
    instrument.group.rotation.y = Math.PI * 0.14;
    return instrument;
  },
  synth_4: (scene) => {
    const instrument = new Synth3D(scene, { tier: 4, hasStand: false });
    instrument.group.visible = false;
    instrument.group.rotation.y = Math.PI * 0.14;
    return instrument;
  },
  piano_2: (scene) => {
    const instrument = new Piano3D(scene, { tier: 2, hasStand: false });
    instrument.group.visible = false;
    return instrument;
  },
  piano_3: (scene) => {
    const instrument = new Piano3D(scene, { tier: 3, hasStand: false });
    instrument.group.visible = false;
    return instrument;
  },
  piano_4: (scene) => {
    const instrument = new Piano3D(scene, { tier: 4, hasStand: false });
    instrument.group.visible = false;
    return instrument;
  },
  xylophone_2: (scene) => {
    const instrument = new Xylophone3D(scene);
    instrument.group.position.set(0.9, 0.95, 2.6);
    instrument.group.visible = false;
    instrument.group.rotation.y = Math.PI * 0.14;
    return instrument;
  },
};

