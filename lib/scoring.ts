interface ScoreInputs {
  accuracy: number;        // 0..1
  difficulty: number;      // 0..10 (avg_question_difficulty)
  targetTimeMs?: number;   // per-question target time
  actualTimeMs?: number;   // per-question actual (avg)
  guessRate?: number;      // 0.25, 0.5...
  useSpeed?: boolean;
}

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));

export function calculateBPI({
  accuracy,
  difficulty,
  targetTimeMs,
  actualTimeMs,
  guessRate = 0,
  useSpeed = false,
}: ScoreInputs): number {
  const A = clamp01(accuracy);

  // Optional bounded speed ratio (0..1)
  let S = 0;
  if (useSpeed && targetTimeMs && actualTimeMs && A > guessRate + 0.1) {
    S = clamp01((targetTimeMs - actualTimeMs) / targetTimeMs);
  }

  // Base skill (0..1)
  const base = useSpeed ? (0.85 * A + 0.15 * S) : A;

  // Difficulty gate: easy content caps your score
  const dNorm = clamp01(difficulty / 10);
  const difficultyGate = 0.35 + 0.65 * Math.pow(dNorm, 1.7); // 0.35..1.0

  // Combined performance (0..1)
  const p = clamp01(base * difficultyGate);

  // Competitive ladder: makes 1800–2000 very hard
  const ladder = 2000 * Math.pow(p, 1.9);

  return Math.round(ladder) + 100;
}
