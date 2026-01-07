/**
 * Brain Performance Index (BPI) Calculator
 *
 * This function standardizes scoring across all game types.
 *
 * Formula:
 * BPI = BaseScore + DifficultyBonus + SpeedBonus
 *
 * 1. BaseScore: accuracy * 100 (Variable based on performance)
 * 2. DifficultyBonus: difficulty * 50
 * 3. SpeedBonus: (targetTime - actualTime) * 0.1
 *    - ONLY if accuracy > 0.5 (Prevents "speed spamming")
 */

interface ScoreInputs {
  accuracy: number; // 0.0 to 1.0 (e.g., 0.8 for 8/10)
  difficulty: number; // 1 to 10
  targetTimeMs: number; // From GeneratedContent
  actualTimeMs: number; // Measured by Hook
}

export function calculateBPI({
  accuracy,
  difficulty,
  targetTimeMs,
  actualTimeMs,
}: ScoreInputs): number {
  // 1. Base Score
  // Full points (100) only for perfect accuracy.
  // 8/10 correct = 80 points.
  const baseScore = 100 * accuracy;

  // 2. Difficulty Bonus
  // Fixed multiplier. Level 5 is worth 250 points.
  const difficultyBonus = difficulty * 50;

  // 3. Speed Bonus (Conditional)
  let speedBonus = 0;

  // Cheat Protection: No speed bonus if you are guessing (User must be > 50% accurate)
  if (accuracy > 0.5) {
    const timeSaved = Math.max(0, targetTimeMs - actualTimeMs);
    const speedMultiplier = 0.1; // 100 points per second saved
    speedBonus = timeSaved * speedMultiplier;
  }

  // 4. Final Calculation
  const totalScore = baseScore + difficultyBonus + speedBonus;

  // Ensure no negative scores (though formula makes it unlikely) and round
  return Math.max(0, Math.round(totalScore));
}
