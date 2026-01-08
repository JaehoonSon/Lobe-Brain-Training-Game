# Game Architecture Specifications & Implementation Plan

## 1. Overview
This document defines the technical specifications for the "Hybrid" game architecture, enabling both procedural (Memory Matrix, Math) and static (Language) games to coexist under a unified scoring and analytics system.

---

## 2. Core Engines (The "Specs")

### A. Generator Interface
We use a **Client-Side Generator Pattern**. All games must implement this interface to ensure the "Referees" (Hooks) can run them.

```typescript
// lib/generators/types.ts

export type DifficultyLevel = number; // 1 to 10

export interface GeneratorConfig {
  difficulty: DifficultyLevel; // The requested difficulty
  seed?: string;               // For deterministic replay functionality
}

export interface GeneratedContent {
  // Common Metadata
  difficulty: DifficultyLevel;
  targetTimeMs: number;       // The "Par" time for speed bonuses
  
  // Game-Specific Payload
  // e.g., grid_size, targets, operands, equation_string
  [key: string]: any;
}

export type GameGenerator = (config: GeneratorConfig) => GeneratedContent;
```

### B. BPI Scoring Engine
The **Brain Performance Index (BPI)** is the unified currency of the app.

**Function Signature**:
```typescript
// lib/scoring.ts

interface ScoreInputs {
  accuracy: number;     // 0.0 to 1.0 (e.g., 0.8 for 8/10)
  difficulty: number;   // 1 to 10
  targetTimeMs: number; // From GeneratedContent
  actualTimeMs: number; // Measured by Hook
}

export function calculateBPI({ accuracy, difficulty, targetTimeMs, actualTimeMs }: ScoreInputs): number {
  // 1. Base Score (Variable based on Accuracy)
  // Standard full points = 100.
  const baseScore = 100 * accuracy; 
  
  // 2. Difficulty Bonus
  // Logarithmic or Linear scale. Linear for now:
  const difficultyBonus = difficulty * 50;
  
  // 3. Speed Bonus (Conditional)
  // Only awarded if Accuracy > 50% to prevent spamming
  let speedBonus = 0;
  if (accuracy > 0.5) {
      const timeSaved = Math.max(0, targetTimeMs - actualTimeMs);
      const speedMultiplier = 0.1; // 100 points per second saved
      speedBonus = timeSaved * speedMultiplier;
  }
  
  // 4. Final Calculation
  // We scale the ENTIRE pot by accuracy to punish high-difficulty failures
  // UPDATE: Per discussion, we use the Additive Model with Variable Base.
  // Formula: Base + Diff + Speed
  // BUT: If accuracy is low, the "value" of the difficulty is effectively lost because Base is low.
  
  // Revised Formula for consistency with user request:
  // Total = Base(Scaled) + Difficulty(Fixed) + Speed(Conditional)
  // WAIT: User's last request wanted: BPI = Base + Diff + Speed.
  // Implementation:
  // Base = 100 * accuracy
  // Diff = 50 * difficulty
  // Speed = (timeSaved * 0.1) IF accuracy > 0.5
  
  return Math.round(baseScore + difficultyBonus + speedBonus);
}
```

---

## 3. Data Strategy

### A. The "Template" Pattern (Procedural Games)
We do NOT store every unique generated question in the DB. We store **Templates**.

1.  **`questions` Table**:
    *   `id`: `template_lvl_5_uuid`
    *   `content`: `{ "gridSize": 5, "targets": 7 }` (The Recipe)
    *   `difficulty`: 5

2.  **Runtime**:
    *   Client downloads Template.
    *   Client runs `generate(gridSize: 5)`.
    *   User plays.

3.  **`game_answers` Table (The Save)**:
    *   `question_id`: `template_lvl_5_uuid` (Links to the Recipe)
    *   `generated_content`: `{ "targets": [[0,1], [2,2]] }` (Stores the specific instance for replay)
    *   `user_response`: `{ "clicks": [...], "time": 3200 }`

### B. Session Analytics
The `game_sessions` table acts as the high-level log.
*   `score`: The calculated BPI.
*   `difficulty_level`: Snapshot of the difficulty play (Critical for graphs).
*   `metadata`: Context tags (e.g., `{ "context": "daily_challenge" }`).

---

## 4. Implementation Checklist

### Phase 1: Logic & Types (`feature/game-architecture`)
- [ ] Create `lib/generators/types.ts` (Interfaces)
- [ ] Create `lib/generators/memoryMatrix.ts` (Logic)
- [ ] Create `lib/scoring.ts` (BPI Calculation)
- [ ] Create tests for `memoryMatrix` and `scoring`.

### Phase 2: Hooks & State
- [ ] Create `hooks/useGameSession.ts`
    - [ ] `startGame(templateId)`
    - [ ] `submitAnswer(response)` -> triggers BPI Calc
    - [ ] `saveSession()` -> Supabase interaction

### Phase 3: Analytics
- [ ] Implement `hooks/useCategoryScore.ts` (The Aggregator)
- [ ] Implement `hooks/useDailyProgress.ts` (The Graph Data)

---

## 5. Directory Structure
```
/lib
  /generators
    types.ts
    memoryMatrix.ts
    mentalMath.ts
  scoring.ts
/hooks
  useGameSession.ts
  useGameGenerator.ts
```
