export type DifficultyLevel = number; // 1 to 10

/**
 * Common configuration passed to all generators.
 * Can be extended for specific games (e.g., GridSize).
 */
export interface GeneratorConfig {
  difficulty: DifficultyLevel;
  // Optional seed for deterministic replay (future proofing)
  seed?: string; 
}

/**
 * The output of a generator.
 * Must be JSON-serializable to store in `generated_content`.
 */
export interface GeneratedContent {
  // Common metadata
  difficulty: DifficultyLevel;
  targetTimeMs: number;
  
  // Game-specific data (Open structure)
  [key: string]: any;
}

/**
 * The standard function signature for ALL game generators.
 */
export type GameGenerator<T extends GeneratedContent = GeneratedContent> = (
  config: GeneratorConfig
) => T;
