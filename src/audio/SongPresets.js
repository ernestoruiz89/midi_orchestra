// Exact file names (including extension/case) identify presets, not MIDI titles.
export const songPresetKey = name => `midi_orchestra_song_preset_v1:${encodeURIComponent(name)}`;

export function readSongPreset(name) {
  try {
    const preset = JSON.parse(localStorage.getItem(songPresetKey(name)) || 'null');
    return preset?.version === 1 ? preset : {};
  } catch {
    return {};
  }
}

export function writeSongPreset(name, preset) {
  if (!name) return true;
  try {
    localStorage.setItem(songPresetKey(name), JSON.stringify({ ...preset, version: 1 }));
    return true;
  } catch {
    return false;
  }
}

export function deleteSongPreset(name) {
  if (!name) return true;
  try {
    localStorage.removeItem(songPresetKey(name));
    return true;
  } catch {
    return false;
  }
}
