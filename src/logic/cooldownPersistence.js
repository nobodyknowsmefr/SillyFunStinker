/**
 * Cooldown & Persistence — localStorage-based fortune state management.
 * 30-second cooldown between fortune generations.
 */

const STORAGE_KEY = 'shapestore_fortune_state';
const COOLDOWN_MS = 30 * 1000; // 30 seconds

/**
 * Save the current fortune state to localStorage.
 */
export function saveCurrentFortuneState({ sequence, prophecy, seed, shorthandCode, assemblyList }) {
  const now = Date.now();
  const state = {
    sequence,
    prophecy,
    seed,
    shorthandCode,
    assemblyList,
    generatedAt: now,
    cooldownExpires: now + COOLDOWN_MS,
  };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.warn('Could not save fortune state:', e);
  }
  return state;
}

/**
 * Load the current fortune state from localStorage.
 * Returns null if no state exists.
 */
export function loadCurrentFortuneState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    console.warn('Could not load fortune state:', e);
    return null;
  }
}

/**
 * Clear the saved fortune state.
 */
export function clearFortuneState() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    console.warn('Could not clear fortune state:', e);
  }
}

/**
 * Check if a new fortune can be generated (cooldown expired).
 */
export function canGenerateFortune() {
  const state = loadCurrentFortuneState();
  if (!state) return true;
  return Date.now() >= state.cooldownExpires;
}

/**
 * Get remaining cooldown time in milliseconds.
 * Returns 0 if cooldown is expired or no state exists.
 */
export function getCooldownRemaining() {
  const state = loadCurrentFortuneState();
  if (!state) return 0;
  const remaining = state.cooldownExpires - Date.now();
  return Math.max(0, remaining);
}

/**
 * Check if there is an active (non-expired) fortune to display.
 */
export function hasActiveFortune() {
  const state = loadCurrentFortuneState();
  return state !== null && state.sequence && state.prophecy;
}
