/**
 * Shape Inventory — canonical source of truth.
 * Every valid necklace contains exactly these pieces.
 */

export const COLORS = ['red', 'blue', 'green', 'yellow', 'purple', 'orange'];

export const COLOR_HEX = {
  red: '#D63230',
  blue: '#1B4DE4',
  green: '#2D936C',
  yellow: '#F5B700',
  purple: '#7B2D8E',
  orange: '#E8590C',
};

export const SHAPE_TYPES = {
  CUBE: 'cube',
  ROUND: 'round',
  STAR: 'star',
};

/**
 * Shorthand codes:
 *   First letter of color (uppercase) + first letter of shape (uppercase)
 *   e.g. Red Cube = RC, Blue Round = BR, Yellow Star = YS
 */
function makeShorthand(color, type) {
  return color[0].toUpperCase() + type[0].toUpperCase();
}

function makeLabel(color, type) {
  const cap = (s) => s[0].toUpperCase() + s.slice(1);
  return `${cap(color)} ${cap(type)}`;
}

/**
 * Build the full canonical inventory pool.
 * Returns an array of bead descriptor objects (25 total).
 */
export function buildInventoryPool() {
  const pool = [];
  let id = 0;

  // 2 cubes of each of 6 colors = 12 cubes
  for (const color of COLORS) {
    for (let i = 0; i < 2; i++) {
      pool.push({
        id: id++,
        type: SHAPE_TYPES.CUBE,
        color,
        hex: COLOR_HEX[color],
        label: makeLabel(color, 'cube'),
        shorthand: makeShorthand(color, 'cube'),
      });
    }
  }

  // 2 rounds of each of 6 colors = 12 rounds
  for (const color of COLORS) {
    for (let i = 0; i < 2; i++) {
      pool.push({
        id: id++,
        type: SHAPE_TYPES.ROUND,
        color,
        hex: COLOR_HEX[color],
        label: makeLabel(color, 'round'),
        shorthand: makeShorthand(color, 'round'),
      });
    }
  }

  // 1 yellow star
  pool.push({
    id: id++,
    type: SHAPE_TYPES.STAR,
    color: 'yellow',
    hex: COLOR_HEX.yellow,
    label: 'Yellow Star',
    shorthand: 'YS',
  });

  return pool;
}

/**
 * Validate that a sequence is a legal necklace.
 */
export function validateSequence(sequence) {
  if (sequence.length !== 25) return false;

  const counts = {};
  for (const bead of sequence) {
    const key = `${bead.color}_${bead.type}`;
    counts[key] = (counts[key] || 0) + 1;
  }

  // Check cubes: 2 of each color
  for (const color of COLORS) {
    if (counts[`${color}_cube`] !== 2) return false;
  }
  // Check rounds: 2 of each color
  for (const color of COLORS) {
    if (counts[`${color}_round`] !== 2) return false;
  }
  // Check star: exactly 1 yellow star
  if (counts['yellow_star'] !== 1) return false;

  // No other stars
  for (const color of COLORS) {
    if (color !== 'yellow' && counts[`${color}_star`]) return false;
  }

  return true;
}

export const TOTAL_BEADS = 25; // 12 cubes + 12 rounds + 1 star
