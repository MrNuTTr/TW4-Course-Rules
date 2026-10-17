// Thin localStorage wrapper. Saved state is discarded on any read or write failure
// (private mode, blocked storage, corrupt data) so the app always falls back to a fresh start.
const PREFIX = 'tw4:';

export function loadSaved(key, version) {
  try {
    const raw = window.localStorage.getItem(PREFIX + key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.version === version ? parsed.data : null;
  } catch {
    return null;
  }
}

export function save(key, version, data) {
  try {
    window.localStorage.setItem(PREFIX + key, JSON.stringify({ version, data }));
  } catch {
    // Storage unavailable or full; progress simply won't persist.
  }
}

export function clearSaved(key) {
  try {
    window.localStorage.removeItem(PREFIX + key);
  } catch {
    // Nothing to clear.
  }
}
