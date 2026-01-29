# Norm-Referenced Scoring Plan

## Decisions
- Rolling window: 90 days
- Update cadence: daily cron
- Category/global weighting: equal weight (balances categories)
- Percentiles: hidden; display competitive score only
- Cache user percentiles: yes (daily refresh)

## Goals
- Make displayed scores relative to population (competition-first).
- Preserve existing per-session BPI calculation as raw input.
- Provide game → category → overall brain index on a unified 0–2000 scale.

## Architecture Fit (Current)
- Keep `lib/scoring.ts` as the raw session score calculator.
- Use `game_sessions.score` as the population distribution source.
- Keep `user_game_performance` for per-user aggregates and lightweight weighting.

## Data Model Additions
### 1) `game_norms`
Population stats per game for the rolling window.
- `game_id` (pk)
- `mean_score`
- `std_score`
- `p50`, `p90`, `p99`
- `sample_size`
- `window_start`, `window_end`
- `updated_at`

### 2) `user_game_percentiles` (cache)
Cached per-user, per-game competitive score.
- `user_id`
- `game_id`
- `last_score_raw`
- `percentile` (stored but not displayed)
- `display_score` (0–2000)
- `updated_at`

### 3) `user_category_scores`
Equal-weighted category score per user.
- `user_id`
- `category_id`
- `display_score`
- `updated_at`

### 4) `user_global_scores`
Equal-weighted global score per user.
- `user_id`
- `display_score`
- `updated_at`

## Norm-Referenced Scoring Formula
### Step 1: Z-score from population norms
```
z = (score_raw - mean_blended) / std_blended
```

### Step 2: Hidden percentile
```
p = CDF(z)
```

### Step 3: Displayed competitive score
```
score_display = round(2000 * p^1.25)
```

Target profile (approx):
- Median ≈ 1200
- 90th ≈ 1700
- 99th ≈ 1950

## Cold-Start / Low Sample Handling
Use seeded priors and blend until enough real data exists.

Seed values:
- `seed_mean = 1000`
- `seed_std = 250`
- `k = 500` (prior strength)
- `n_min = 200` (switch to fully real stats)

Blend formulas:
```
mean_blended = (mean*n + seed_mean*k) / (n + k)
std_blended  = (std*n  + seed_std*k)  / (n + k)
```

## Aggregation Rules
### Per-game
- Use the latest session score as `last_score_raw`.
- Optional future improvement: use a short rolling average of recent sessions.

### Category (equal weight)
- Compute the mean of per-game display scores within the category.

### Global (equal weight)
- Compute the mean of per-category display scores.

## Daily Cron Pipeline
1) Recompute `game_norms` from `game_sessions` (last 90 days).
2) Update `user_game_percentiles` from latest session scores.
3) Refresh `user_category_scores` using equal-weighted category averages.
4) Refresh `user_global_scores` using equal-weighted category averages.

## UI/UX
- Display only the competitive score (no percentile).
- Use the same 0–2000 scale across game/category/global.
- Optional tooltip: “Score reflects your performance vs other players.”

## Implementation Steps
1) Add new tables (`game_norms`, `user_game_percentiles`, `user_category_scores`, `user_global_scores`).
2) Create SQL functions for norm updates and user rollups.
3) Schedule daily cron job to refresh norms and caches.
4) Update read paths to use cached competitive scores.
