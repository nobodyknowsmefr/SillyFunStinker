/**
 * Sequence Generator — produces valid randomized necklace sequences.
 * Uses seedrandom for deterministic output when a seed is provided.
 */

import seedrandom from 'seedrandom';
import { buildInventoryPool, validateSequence } from './shapeInventory';

/**
 * Fisher-Yates shuffle using a seeded RNG.
 */
function seededShuffle(array, rng) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Generate a valid necklace sequence.
 * @param {string} [seed] — optional seed for deterministic output
 * @returns {{ sequence: Array, seed: string, shorthandCode: string, assemblyList: string[] }}
 */
export function generateValidSequence(seed) {
  const usedSeed = seed || `shape-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const rng = seedrandom(usedSeed);

  const pool = buildInventoryPool();
  const shuffled = seededShuffle(pool, rng);

  // Pull the star out, shuffle the rest, then place star at center (index 12)
  const starIndex = shuffled.findIndex((b) => b.type === 'star');
  const star = shuffled.splice(starIndex, 1)[0];
  const nonStar = seededShuffle(shuffled, rng);
  const sequence = [
    ...nonStar.slice(0, 12),
    star,
    ...nonStar.slice(12),
  ];

  // Re-index after arrangement
  const indexed = sequence.map((bead, i) => ({
    ...bead,
    index: i,
  }));

  // Validate (should always pass, but safety check)
  if (!validateSequence(indexed)) {
    throw new Error('Generated sequence failed validation — this should never happen.');
  }

  const shorthandCode = indexed.map((b) => b.shorthand).join('-');
  const assemblyList = indexed.map((b, i) => `${i + 1}. ${b.label} (${b.shorthand})`);

  return {
    sequence: indexed,
    seed: usedSeed,
    shorthandCode,
    assemblyList,
  };
}

/**
 * Get the star position in a sequence (0-indexed).
 */
export function getStarPosition(sequence) {
  return sequence.findIndex((b) => b.type === 'star');
}

/**
 * Analyze sequence regions: opening (first 8), midpoint (9-16), ending (17-25).
 */
export function analyzeRegions(sequence) {
  return {
    opening: sequence.slice(0, 8),
    midpoint: sequence.slice(8, 17),
    ending: sequence.slice(17),
  };
}

/**
 * Detect adjacent pairs of same color or same type.
 */
export function detectPatterns(sequence) {
  const adjacentSameColor = [];
  const adjacentSameType = [];

  for (let i = 0; i < sequence.length - 1; i++) {
    if (sequence[i].color === sequence[i + 1].color) {
      adjacentSameColor.push({ index: i, color: sequence[i].color });
    }
    if (sequence[i].type === sequence[i + 1].type) {
      adjacentSameType.push({ index: i, type: sequence[i].type });
    }
  }

  return { adjacentSameColor, adjacentSameType };
}
