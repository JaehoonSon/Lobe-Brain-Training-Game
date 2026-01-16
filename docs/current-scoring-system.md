# Brain Index (BPI) & Scoring Pipeline — Current System

This document describes the current scoring system end-to-end, from raw in-game performance to the norm-referenced Brain Index (BPI) shown in the UI. It reflects the implementation in the repo as of today and is intended as a reference for future refinements.

## 1) Raw Session Score (BPI)
**Source:** `lib/scoring.ts`

A session BPI is computed after each round using accuracy, difficulty, and (optionally) speed. The resulting raw score is in the range **100–2100**.

### Inputs
- `accuracy` (A): 0..1
- `difficulty` (D): 0..10 (average question difficulty)
- `targetTimeMs` / `actualTimeMs` (optional)
- `guessRate` (optional, default 0)
- `useSpeed` (optional)

### Calculation
1) **Clamp accuracy**
```
A = clamp01(accuracy)
```

2) **Speed factor (optional)**
```
S = clamp01((targetTimeMs - actualTimeMs) / targetTimeMs)
```
Only used when `useSpeed` is true and `A > guessRate + 0.1`.

3) **Base skill**
```
base = useSpeed ? (0.85 * A + 0.15 * S) : A
```

4) **Difficulty gate** (caps easy content)
```
dNorm = clamp01(difficulty / 10)
Gdiff = 0.35 + 0.65 * (dNorm ^ 1.7)    // 0.35..1.0
```

5) **Combined performance**
```
P = clamp01(base * Gdiff)
```

6) **Ladder mapping**
```
rawBPI = round(2000 * (P ^ 1.9)) + 100
```

### Per-game speed targets
**Source:** `contexts/GameSessionContext.tsx`
- `mental_arithmetic`: 6000ms
- `mental_language_discrimination`: 9000ms
- `memory_matrix`: no speed bonus
- `wordle`: no speed bonus

## 2) Session Persistence
**Source:** `contexts/GameSessionContext.tsx`

On round end, the raw BPI is written to `game_sessions` along with:
- `difficulty_rating_used`
- `avg_question_difficulty`
- `avg_response_time_ms`
- `correct_count` / `total_questions`
- `duration_seconds`

## 3) Immediate Aggregate Updates (Per-Game)
**Source:** `supabase/migrations/20260108173000_add_user_game_performance.sql`

A DB trigger updates `user_game_performance` for each session:
- `highest_score`
- `games_played_count`
- `total_score`
- `difficulty_rating`

### Difficulty rating update
```
normalized_rating = clamp(1..10, rawBPI / 70.0)
new_rating = (old_rating * 0.8) + (normalized_rating * 0.2)
```

This creates a slow-moving EMA where new performance contributes 20%.

## 4) Norm-Referenced Scoring (Daily Cron)
**Source:** `supabase/migrations/20260110225000_norm_referenced_scoring.sql`

A daily job computes population norms and updates competitive scores.

### 4.1) Game norms (90‑day window)
Table: `game_norms`

Computed from `game_sessions` in the last 90 days:
- `mean_score`
- `std_score`
- `p50`, `p90`, `p99`
- `sample_size`
- `window_start`, `window_end`

### 4.2) Seed blending (cold start)
To prevent unstable norms with small samples:
- `seed_mean = 1000`
- `seed_std = 250`
- `seed_k = 500`

```
mean_blended = (mean * n + seed_mean * k) / (n + k)
std_blended  = (std * n + seed_std  * k) / (n + k)
```

### 4.3) Percentile (logistic CDF)
For each user’s **latest session score** in a game:
```
z = (score_raw - mean_blended) / std_blended
p = 1 / (1 + exp(-1.702 * z))
```

### 4.4) Display score (competitive)
```
display_score = round(2000 * (p ^ 1.25))
```

### 4.5) Tables updated
- `user_game_percentiles` (per-user, per-game display score)
- `user_game_score_history` (daily snapshot)
- `user_category_scores` (per-user, per-category average)
- `user_global_scores` (per-user overall average)

## 5) Aggregation Rules
**Source:** `supabase/migrations/20260110225000_norm_referenced_scoring.sql`

1) **Game → Category**
```
category_score = round(avg(display_score))
```

2) **Category → Global**
```
global_score = round(avg(category_score))
```

## 6) UI Consumption
**Source:** `contexts/UserStatsContext.tsx`

The UI reads:
- `user_game_percentiles` → per-game display scores
- `user_category_scores` → category tiles
- `user_global_scores` → overall Brain Index
- `user_game_score_history` → history charts

`MAX_EXPECTED_BPI = 2000` is used to normalize progress bars.

## 7) Why Scores Can Drop
Even if a user performs well, competitive scores can decrease because:
- **Seed blending** keeps the mean near 1000 until sample sizes grow.
- **Population shifts** change norms daily as more users play.
- **Rolling window** drops older sessions after 90 days.

## 8) Known Sensitivities
- Small `sample_size` values can make early scores feel low because the seed dominates.
- The `p^1.25` mapping compresses low percentiles and stretches high percentiles.
- Difficulty rating progression is slow (EMA 0.2), keeping players at low difficulty longer.

## 9) Key Files
- `lib/scoring.ts`
- `contexts/GameSessionContext.tsx`
- `contexts/UserStatsContext.tsx`
- `supabase/migrations/20260108173000_add_user_game_performance.sql`
- `supabase/migrations/20260110225000_norm_referenced_scoring.sql`
- `supabase/migrations/20260110233000_add_user_game_score_history.sql`
- `docs/norm-referenced-scoring-plan.md`
