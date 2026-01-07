import { GameGenerator, GeneratedContent, GeneratorConfig } from './types';

// --- Types ---

export interface MemoryMatrixTemplate {
  gridSize: number;    // Size of the grid (NxN)
  targetCount: number; // Number of tiles to memorize
  timeMs: number;      // Memorization time allowed
}

export interface MemoryMatrixInstance extends GeneratedContent {
  gridSize: number;
  targets: Array<{ row: number; col: number }>; // The specific red tiles
}

// --- Configuration ---

// Balanced progression curve
export const MEMORY_MATRIX_LEVELS: Record<number, MemoryMatrixTemplate> = {
  1: { gridSize: 3, targetCount: 3, timeMs: 2000 },
  2: { gridSize: 3, targetCount: 4, timeMs: 2000 },
  3: { gridSize: 4, targetCount: 4, timeMs: 2500 },
  4: { gridSize: 4, targetCount: 5, timeMs: 3000 },
  5: { gridSize: 5, targetCount: 6, timeMs: 4000 },
  6: { gridSize: 5, targetCount: 7, timeMs: 4500 },
  7: { gridSize: 6, targetCount: 8, timeMs: 5000 },
  8: { gridSize: 6, targetCount: 9, timeMs: 5500 },
  9: { gridSize: 7, targetCount: 10, timeMs: 6000 },
  10: { gridSize: 7, targetCount: 12, timeMs: 7000 },
};

// --- Logic ---

/**
 * Generates a random Memory Matrix puzzle.
 * Pure function: Deterministic if we added a seed (omitted for MVP).
 */
export const generateMemoryMatrix: GameGenerator<MemoryMatrixInstance> = (
  config: GeneratorConfig
) => {
  // 1. Get Template (Static Config)
  const level = Math.max(1, Math.min(10, Math.round(config.difficulty)));
  const template = MEMORY_MATRIX_LEVELS[level];

  // 2. Generate Unique Targets
  const targets = new Set<string>();
  const targetList: Array<{ row: number; col: number }> = [];

  while (targets.size < template.targetCount) {
    const r = Math.floor(Math.random() * template.gridSize);
    const c = Math.floor(Math.random() * template.gridSize);
    const key = `${r},${c}`;

    if (!targets.has(key)) {
      targets.add(key);
      targetList.push({ row: r, col: c });
    }
  }

  // 3. Return Payload
  return {
    difficulty: level,
    targetTimeMs: template.timeMs,
    gridSize: template.gridSize,
    targets: targetList,
  };
};
