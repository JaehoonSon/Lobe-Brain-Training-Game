# Database & Logic Design: Brain Training App

> **Status**: DRAFT (Iterative Refinement)  
> **Goal**: Establish a robust, scalable architecture for both "Static" (Curated) and "Procedural" (Runtime) games, including detailed performance analytics.

---

## 1. Core Philosophy: The Hybrid Content Model

To avoid database bloat while maintaining data integrity, we divide games into two architectural categories.

### A. The "Schemaless" Content Column
We rely heavily on `JSONB` columns (`questions.content`, `game_answers.user_response`, `game_answers.generated_content`). This allows infinite flexibility for new game types without Schema Migrations.

### B. Game Categories & Storage Strategy

| Game Type | Storage Strategy | Why? |
| :--- | :--- | :--- |
| **Static / Editorial**<br>(e.g., Language, Trivia, Emotion Rec) | **Database (`questions`)** | Content is "Intellectual Property". Requires curation, translation, and validation. |
| **Procedural / Infinite**<br>(e.g., Memory Matrix, Mental Math) | **Runtime Only** | Content is disposable math/randomness. Storing `2+2` or a random grid is wasteful pollution. |
| **Hybrid / Template**<br>(e.g., Logic Patterns, Word Search) | **Database** (Template) + **Runtime** (Instantiation) | Store the "Rule" or "Word List" in DB; generate the actual Puzzle at runtime. |

---

## 2. Table Schema Breakdown

### `games` (Metadata)
*   **Purpose**: The catalog of available games.
*   **Key Fields**: `id` (slug), `name`, `config` (JSONB - *New Proposal*).
*   **Usage**: The frontend pulls this to render the Game Menu.

### `questions` (Static Content Library)
*   **Purpose**: Storage for **Static** games only.
*   **Key Fields**:
    *   `content` (JSONB): The specific puzzle data (e.g., `{ "sentence": "He _ fast.", "answer": "runs" }`).
    *   `difficulty` (1.0 - 10.0): Fixed difficulty rating.

### `game_sessions` (The Context Container)
*   **Purpose**: Groups a series of questions into a single "Round" or "Workout". Crucial for analytics.
*   **Key Fields**:
    *   `difficulty_level`: The user's Rating *at the start* of the session.
    *   `session_metrics` (JSONB - *Proposed*): Summary of this session (e.g., `{ "avg_speed": 430ms, "accuracy": 0.85 }`).
    *   `metadata` (JSONB - *New Proposal*): Tags for the session context (e.g., `{ "context": "daily_challenge", "challenge_date": "2024-01-01" }`). This allows grouping independent sessions into a larger "Workout".

> [!NOTE] Design Rationale: The Snapshot Pattern
> We store `difficulty_level` here (instead of joining `user_performance`) to create a **Historical Snapshot**. 
> *   **Analytics**: Allows us to graph "Difficulty vs Time" easily without complex temporal joins.
> *   **Auditing**: Serves as a "Receipt" for the score. We know exactly how hard the game was *at that specific moment*, even if the user's rating changes later.

### `game_answers` (The Granular Event Log)
*   **Purpose**: The "Black Box" recording of every single move.
*   **Key Fields**:
    *   `question_id` (Nullable FK): **NULL** for Procedural games. Links to `questions` for Static games.
    *   `generated_content` (JSONB): **CRITICAL**. For procedural games, this stores the ephemeral parameters (e.g., the specific Grid Layout used). *Allows Replayability.*
    *   `user_response` (JSONB): Stores the **Result Metrics**, NOT just the click.

---

## 3. Metric Strategy: Beyond "Is Correct"

We move away from binary pass/fail for complex games.

**The Problem**:
In a 9x9 Memory Matrix (81 cells), missing 1 cell should not be treated the same as missing 40 cells. `is_correct = false` loses this nuance.

**The Solution**:
Use `user_response` (JSONB) to store rich telemetry.

#### Schema for `user_response`:
```json
// Example: Memory Matrix
{
  "raw_input": [ { "r": 1, "c": 2 }, { "r": 3, "c": 4 } ],  // What they clicked
  "metrics": {
    "accuracy_score": 0.98,      // (Score vs Total Possible)
    "error_margin": 1,           // "Missed by 1 cell"
    "completion_time_ms": 3400,  // Speed
    "hesitation_count": 0        // "Did they click and unclick?"
  }
}
```

#### The `is_correct` boolean:
*   Remains as a "High Level Pass/Fail" flag for simple queries.
*   **Rule**: `is_correct` is TRUE only if `accuracy_score >= threshold` (e.g., 100% for Math, >90% for Memory).

---

## 4. Adaptive Difficulty Logic

Difficulty is handled differently for the two game types.

### A. Static Games (Database Driven)
*   **Logic**: Query the DB.
    ```sql
    SELECT * FROM questions
    WHERE difficulty BETWEEN (UserRating - 1) AND (UserRating + 1)
    ORDER BY RANDOM() LIMIT 10
    ```

### B. Procedural Games (Code Driven)
*   **Logic**: Interpolate configuration.
*   **Code Example** (Frontend):
    ```typescript
    const LEVEL_CONFIG = {
      1: { gridSize: 3, targets: 3 },
      5: { gridSize: 5, targets: 7 },
      10: { gridSize: 8, targets: 15 }
    };

    function generate(userRating: number) {
      // Logic to interpolate between Levels based on Rating
      const config = getInterpolatedConfig(LEVEL_CONFIG, userRating);
      return createRandomGrid(config);
    }
    ```

### C. Intra-Session Flow (Inside one game)
How does difficulty change *during* the 2 minutes of play?

**Strategy 1: The "Training Curve" (Default)**
*Best for standard workouts. Difficulty is pre-charted based on User Rating.*
*   **Warmup (20%)**: Rating - 1.0 (Build confidence)
*   **Work (60%)**: Rating (The challenge zone)
*   **Reach (20%)**: Rating + 0.5 (Testing limits)
*   **Failure Logic**: We do **NOT** drop difficulty immediately if they miss a question. We stick to the curve to maintain rhythm. Failed "work" questions simply result in the User Rating not increasing for the next session.

**Strategy 2: The "Survival Ladder" (Endless Mode)**
*Best for high-score challenges.*
*   **Start**: Level 1.
*   **Correct**: Level + 1.
*   **Wrong**: Game Over (or Level - 1).
*   *Note: This is strictly reactive.*

### D. The Score Formula (BPI)
We use a **Brain Performance Index (BPI)** to normalize scores across different games.

**Formula**:
`BPI = BaseScore + (DifficultyBonus * Difficulty) + SpeedBonus`

1.  **BaseScore**: Variable based on accuracy (e.g., `CorrectItems * PointsPerItem`).
    *   *Example*: 8/10 correct = 80 points.
2.  **DifficultyBonus**: `Level * 50`.
3.  **SpeedBonus**: `Max(0, TargetTime - ActualTime) * Multiplier`.
    *   **Condition**: Only awarded if Accuracy > Threshold (e.g. 50%). Prevents "speed spamming" with low accuracy.

**Example: Memory Matrix (Visual Memory)**
*   **Context**: 
    *   **Level 5** (5x5 Grid, 7 Targets). 
    *   **Target Time**: 5000ms (5s).
    *   **User Performance**: Found all 7 targets correctly in 3.5s.

*   **Calculation**:
    1.  **Base Score**: 100 points (Perfect Accuracy).
    2.  **Difficulty Bonus**: `50 * Level 5` = 250 points.
    3.  **Speed Bonus**:
        *   User saved 1.5s (1500ms).
        *   Multiplier = 0.1 points/ms.
        *   `1500 * 0.1` = 150 points.
    
*   **Total Q-Score**: `100 + 250 + 150 = 500 BPI`

*   **Session Total**:
    *   If the user plays 5 rounds and scores `[500, 480, 510, 500, 490]`.
    *   **Final Session Score**: `Avg(496)` -> Updates their "Memory Rating".

> [!NOTE] Implementation Detail
> *   **Session Score**: Stored in `game_sessions.score` (Integer).
> *   **Per-Question Score**: Stored inside `game_answers.user_response` JSONB (e.g., `{ "bpi": 500 }`). 
> *   *Future Consideration*: If we find ourselves querying "Show me all high-scoring questions" frequently, we may want to promote `bpi_score` to a dedicated column in `game_answers` to speed up indexing.

---

## 6. Advanced Meta-Game Architecture

### A. Category-Level Analytics
**Problem**: How do we calculate a user's overall "Memory Score" when they play 5 different Memory games?

**Strategy**: Real-time Aggregation (No Schema Change).
Instead of storing a separate "Category Score", we compute it on the fly by aggregating `user_performance`.

```sql
-- "My Memory Score"
SELECT AVG(current_rating)
FROM user_performance up
JOIN games g ON up.game_id = g.id
WHERE up.user_id = :userId AND g.category_id = 'memory';
```
*Why this is robust*: It automatically adapts when you add new games. You don't need to maintain sync between tables.

### B. Daily Challenges (Multi-Game Flows)
**Problem**: A Daily Challenge is a playlist (e.g., Memory -> Math -> Focus). How do we track this "Container" without losing the granularity of the individual games?

**Strategy**: Context Tagging via `metadata`.
We treat "Daily Challenge" as a **Metadata Context**, not a separate Game ID.

1.  **The Playlist**: The app Logic (or a config file) defines Today's Playlist: `['memory_matrix', 'mental_math', 'stroop']`.
2.  **The Execution**: The user plays 3 separate sessions.
3.  **The Linking**: Each session is saved with metadata:
    ```json
    // In game_sessions.metadata
    {
      "context": "daily_challenge",
      "date": "2024-01-07",
      "playlist_index": 0
    }
    ```
4.  **Completion Check**:
    To see if they finished today's challenge, we query:
    > "Find distinct game_ids played by User today where context='daily_challenge'". If count == 3, Challenge Complete.

### C. The Metric Supply Chain (Hierarchy)
How do we go from a single click to a "Global Brain Score"?

1.  **Level 1: Session BPI** (The specific instance)
    *   *Source*: Calculated at end of game.
    *   *Value*: `550` (Speed + Accuracy + Difficulty).

2.  **Level 2: Game Rating** (The Skill)
    *   *Source*: `user_performance` table.
    *   *Logic*: Moving Average of recent Session BPIs.
    *   *Value*: `Memory Matrix Rating: 505`.

3.  **Level 3: Category Score** (The Domain)
    *   *Source*: Calculated on fly (SQL).
    *   *Logic*: `AVG(Game Ratings)` for that category.
    *   *Value*: `Memory Category: 452`.
    *   *Why Average?*: Prevents a category with 10 games from looking "bigger" than one with 2 games.

4.  **Level 4: Overall Brain Index** (The Global Metric)
    *   *Source*: Client/Dashboard.
    *   *Logic*: `AVG(Category Scores)`.
    *   *Value*: `(Memory + Math + Focus) / 3`.
    *   *Insight*: This encourages users to be well-rounded. You can't just spam Memory games to boost your Global Score; you MUST play Math games to raise the Math component of the average.

> *   *Future Consideration*: If we find ourselves querying "Show me all high-scoring questions" frequently, we may want to promote `bpi_score` to a dedicated column in `game_answers` to speed up indexing.

---

## 7. Implementation Strategy: Runtime Generation
*How do we build the "Infinite" games?*

### A. The Generator Pattern
We do not call an API. We use pure TypeScript functions on the client.
*   **Location**: `lib/generators/` (e.g., `lib/generators/memoryMatrix.ts`).
*   **Structure**:
    1.  **Level Config**: A map defining parameters for each level.
        ```typescript
        const LEVELS = { 1: { gridSize: 3 }, 5: { gridSize: 5 } };
        ```
    2.  **Generate Function**: `(level: number) => GameData`.
        *   Interpolates between levels if needed (e.g., Level 4.5).
        *   Returns the randomized initial state.

### B. The "Referee" Lifecycle (`useGameSession`)
The Client (App) acts as the authority.
1.  **Setup**: Calls Generator -> Gets Data.
2.  **Play**: Tracks clicks and timing in React State.
3.  **Finish**: 
    1.  Calculates BPI locally.
    2.  **Syncs** to Database:
        *   `game_sessions` row (Score, Difficulty Snapshots).
        *   `game_answers` rows (The detailed logs).
          *   *Crucial*: `question_id` is NULL. `generated_content` stores the Level params used.

---

## 8. Topic for Discussion: Offline & Sync
*   **Procedural Games**: Work 100% offline naturally.
*   **Static Games**: Need a "Content Sync" strategy (downloading question packs) if we want offline support.
*   **Syncing Results**: `game_answers` are stored in SQLite (local) and pushed to Supabase when online.
