# User stats aggregation proposal

## Goal

Shift stats computation off the client by maintaining per-game aggregates (including difficulty rating). This prevents full-session scans, keeps stats consistent as session volume grows, and supports adaptive difficulty.

## Current issues

- `useUserStats` queries all `game_sessions` then recomputes averages client-side.
- `user_performance` is not maintained anywhere (no trigger/RPC), so it cannot be a source of truth.
- Aggregates are split across two tables (`game_sessions` for averages, `user_performance` for highs/counts), which can diverge.

## Proposed data model

### Keep `game_sessions`

- Raw event log. No changes required.

### Add `user_game_performance` for per-game difficulty rating (and optional stats)

**Primary key**: `(user_id, game_id)`

**Fields**

- `difficulty_rating` (float, 1-10)
- `games_played_count` (optional)
- `highest_score` (optional)
- `total_score` (optional)
- `average_score` (optional)
- `last_played_at` (optional)

## Write path (authoritative)

On every `game_sessions` insert, update per-game aggregates and difficulty rating.

### Option A: DB trigger (recommended)

- Trigger on `game_sessions` insert.
- Look up `game_id -> category_id` and update:
  - `user_game_performance`
- Update `difficulty_rating` for the game using a simple, bounded rule.

**Pros**

- Guarantees aggregate updates even if client changes.
- No app-side duplication.

**Cons**

- Harder to debug without DB tooling.

### Option B: RPC (call a single function)

- Client calls `record_game_session` RPC that inserts the session and updates aggregates + per-game difficulty rating.

**Pros**

- All logic in one place and explicit.
- Easy to test in isolation.

**Cons**

- Requires all clients to migrate to RPC path.

## Read path

- Category breakdowns are derived by grouping `user_game_performance` rows by category.
- Overall BPI can be computed from grouped category aggregates.
- Game start uses `user_game_performance.difficulty_rating` to select question difficulty for that game.

## Migration plan

1. Create `user_game_performance` table + RLS policy.
2. Add `difficulty_rating` column (default 3.0) to `user_game_performance`.
3. Add trigger/RPC to update aggregates and difficulty on insert.
4. Backfill aggregates from historical `game_sessions` (difficulty_rating defaults).
5. Update `useUserStats` to read aggregates (category + global).

## Critique / risks

- **Data correctness**: If you keep `average_score`, it can diverge if updates are partial. Prefer storing totals and computing averages on read.
- **Category lookup**: Grouping by category requires a join to `games`; missing category should be handled explicitly.
- **Backfill**: Without a backfill, existing users will have empty stats. Plan for a migration step.
- **Difficulty drift**: If the update rule is too aggressive, difficulty can oscillate. Use small deltas and clamp 1-10.

## Open questions

- Should averages be stored or derived on read?
- What's the canonical definition of BPI for category/overall (mean of category means vs weighted by games played)?
- Do we still need recent sessions on the stats page, or can we drop them to avoid session scans?
- What difficulty update rule should we use (target BPI band vs EMA on BPI)?

## Example flow

1. Game start
   - Load `user_game_performance.difficulty_rating` for the game (default 3.0).
   - Set target question difficulty to that rating (clamped 1-10).
2. During play
   - Generate questions around the target (e.g., target +/- 1).
   - Optionally adjust the target within the session based on recent answers.
3. End game
   - Compute BPI for the session.
   - Insert a `game_sessions` row with `score` and `difficulty_level`.
   - Insert `game_answers` rows for per-question logs (optional for stats).
4. Aggregation update (trigger/RPC)
   - Upsert `user_game_performance`:
     - increment `games_played_count`
     - update `highest_score`, `total_score`
     - update `difficulty_rating` using a bounded rule
   - Optionally update global totals in `user_performance`.
5. Stats display
   - Group `user_game_performance` by category (join `games`) for category cards.
   - Compute overall BPI from grouped categories.
