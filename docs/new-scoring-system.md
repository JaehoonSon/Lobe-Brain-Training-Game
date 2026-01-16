# BPI v2: Two-layer scoring (Ability + Rank)

## Layer 1 — Ability BPI (your main 0–2000 number)

This should behave like an “IQ-style” standardized score:

* **Mean = 1000** (within a reference group)
* **1 SD = 200 points** (tunable)
* Linear in z-score, not percentile-based

**Per game (and optionally age band):**

1. Maintain a latent skill estimate `θ` (theta) and uncertainty `σ` for each user:

* `θ_user_game` (ability)
* `σ_user_game` (confidence / uncertainty)

2. Each day compute population norms of theta:

* `μ_pop_game_age`, `σ_pop_game_age` (robust + smoothed)

3. Display ability score:

```text
z = (θ_user_game - μ_pop_game_age) / max(σ_pop_game_age, σ_floor)
z = clamp(z, -zMax, zMax)

BPI_ability_game = round(clamp(0, 2000, 1000 + 200 * z))
```

**Why this fixes your “680 → 55” issue:**
Because you’re *not* converting to percentile and then re-scaling. Being 1.7 SD below average becomes ~660, not ~50.

---

## Layer 2 — Competitive rank (separate on purpose)

Competitive rank should be explicitly ranky:

* `percentile = Φ(z)` (normal CDF) or empirical percentile
* Optionally a **rank score** for leaderboards:

```text
BPI_rank_game = round(2000 * clamp(percentile, 0.001, 0.999))
```

**UI recommendation:** show both clearly:

* **Brain Index (Ability): 1120**
* **Percentile: 67th** (or “Top 33%”)

This avoids the classic trap of “percentile disguised as score”.

---

# The core measurement engine (scientific + implementable)

You want to update `θ` online as the user answers items. The standard approach is IRT-ish; we can do a very practical “IRT-lite” that works even if items are procedurally generated.

## A) Accuracy model (IRT-lite)

For each question/item:

* correctness `x ∈ {0,1}`
* difficulty `D ∈ [0,10]` from your generator
  Map difficulty to an IRT difficulty parameter `b`:

```text
b = (D - 5) / 2.5     // D=0→b=-2, D=10→b=+2
```

Probability correct:

```text
p = sigmoid(a * (θ - b))
```

* Start with `a = 1.2` (discrimination). Later you can fit per-game or per-item-template `a`.

### Online update (fast, stable)

Maintain `θ ~ Normal(μ, σ²)`. For each item:

```text
p = sigmoid(a*(μ - b))
g = a * (x - p)                    // gradient
h = -a^2 * p * (1 - p)             // Hessian (negative)

σ_new² = 1 / (1/σ² - h)
μ_new  = μ + σ_new² * g
```

This is a Laplace / EKF-style update: simple, fast, and “real measurement”.

### Anti-guess / low effort

If you detect guessing/disengagement, **downweight** the item:

* Multiply `g` and `h` by `w ∈ [0,1]`
* e.g. `w=0.2` for suspicious items, `w=0` to ignore

Simple guess heuristics (works well in practice):

* `rt < 300ms` (or game-specific) AND wrong → likely spam
* bursts of near-min RT across many items
* accuracy near chance with ultra-fast RT

---

## B) Speed model (separate latent trait)

Speed shouldn’t be a random bonus. Treat speed as its own trait `θ_speed`.

For items where speed matters:

* Work in `log(rt)` (more normal/stable)
* Maintain per game+bucket norms for RT: `median_logrt(D)`, `mad_logrt(D)` (or mean/std)

Compute a standardized speed observation (higher is better):

```text
y = (median_logrt(D) - log(rt)) / mad_logrt(D)   // like a robust z
```

Then update `θ_speed` with a simple normal-normal (Kalman) update:

```text
// prior: θ_speed ~ N(μs, σs²), observation y ~ N(θ_speed, σ_obs²)
K = σs² / (σs² + σ_obs²)
μs_new = μs + K*(y - μs)
σs_new² = (1 - K)*σs²
```

* `σ_obs` ~ 1.0 is a good start
* Only use speed updates when correctness indicates real effort (e.g., correct OR accuracy above a threshold)

---

## C) Combine accuracy + speed into one per-game ability

Each game declares weights:

* memory span games: mostly accuracy (`wA=1, wS=0`)
* reaction speed games: mostly speed (`wA=0, wS=1`)
* mixed games: `wA=0.7, wS=0.3` etc.

```text
θ_game = wA * θ_acc + wS * θ_speed
σ_game = combine uncertainties (practically: treat as separate and combine at display-time)
```

---

# Adaptive difficulty that levels people up fast (but safely)

This is where your current system is slow. The best “standard” approach is: **target a success probability**.

Pick a target:

* `p_target = 0.75` (sweet spot: engaging + informative)

Given current `θ` and discrimination `a`, solve for next item difficulty `b_next`:

```text
p_target = sigmoid(a*(θ - b_next))
=> b_next = θ - logit(p_target)/a
```

Then map back to D:

```text
D_next = clamp(0..10, 5 + 2.5*b_next)
```

### Make onboarding fast

Your biggest goal: strong users escape easy content quickly. Use uncertainty:

* If `σ` is high (new user), you can jump faster.

Example rule:

```text
D_next += k * σ * sign(accuracy - p_target)
```

* `k = 1.0–1.5` early
* decay k as sessions accumulate

### “Fast track” rule (simple and effective)

If you’re at easy difficulty and the user is crushing it:

* if `D ≤ 3` AND `accuracy ≥ 0.90` for last N items → `D += 1.5`
  This moves them up in a couple sessions without gaming.

---

# Category + Global scoring (rigorous aggregation)

Don’t average raw scores equally; weigh by **confidence**.

For each game you have uncertainty `σ_game`. Define reliability weight:

```text
w_game = 1 / (σ_game² + ε)
```

**Category score (theta space):**

```text
θ_category = weighted_avg(θ_game, w_game over games in category)
```

**Global score:**

```text
θ_global = weighted_avg(θ_category, w_category)
```

Then apply the same ability BPI mapping (0–2000) at category/global.

This does two good things:

* New games a user barely played don’t distort their global score
* You can show “confidence / provisional” to build trust

---

# Norming that won’t whiplash people

Instead of your current “90-day window + seed mean/std + percentile CDF”, do:

### 1) Norm on theta, not on a ladder score

Each day per game + age band:

* compute robust `μ_pop`, `σ_pop` of `θ_game` among active users

  * use median + MAD (or winsorized mean/std)
* enforce floors:

  * `σ_pop = max(σ_pop, 0.6)` (theta units) to avoid tiny-std explosions

### 2) Smooth norms (prevents daily drops)

```text
μ_t = (1-α)*μ_{t-1} + α*μ_window
σ_t = (1-α)*σ_{t-1} + α*σ_window
```

* `α = 0.05–0.15` feels good (slow drift, no shocks)

### 3) Age-adjusted

Compute norms by age bands (and a fallback “all ages”):

* 13–17, 18–24, 25–34, 35–44, 45–54, 55–64, 65+

If age unknown: use all-age norms.

---

# Database / pipeline (fits your current architecture)

### Real-time tables (new / updated)

**`user_game_rating`**

* `user_id`, `game_id`
* `theta_acc`, `sigma_acc`
* `theta_speed`, `sigma_speed`
* `items_seen`, `last_updated`

**`game_session_items`** (optional but ideal for rigor)

* `session_id`, `item_id` (or template + params hash), `difficulty`, `correct`, `rt_ms`, `flags`

If you can’t store per-item, store bucket aggregates per session:

* counts correct/total by difficulty bucket + rt stats

### Daily cron tables (like you already have)

**`game_theta_norms`** (per game + age band)

* `mu_theta`, `sigma_theta`, `sample_size`, `smoothed_mu`, `smoothed_sigma`

**`user_game_scores`**

* `BPI_ability_game`, `percentile_game`, `BPI_rank_game` (optional)
* history snapshots

Then your category/global tables become weighted theta aggregates → BPI.

---

# Migration from your current system (no risky big bang)

1. Keep writing your existing `rawBPI` for continuity.
2. Start logging per-item or per-bucket stats (needed for serious measurement).
3. Run the θ-engine in parallel and store `theta_*` in `user_game_rating`.
4. For 1–2 weeks, show internal dashboards comparing:

   * old display_score vs new BPI_ability
   * user sentiment metrics (drop complaints, “feels fair”)
5. Flip UI to:

   * **Ability BPI** as primary
   * **Percentile** as secondary competitive stat

---

# What you get vs your current system

### Fixes “crushing”

* No more percentile→0–2000 as the main score
* Ability is linear in z, so it stays sane

### Levels users up faster

* Adaptive difficulty targets p=0.75
* Uncertainty-aware jumps early
* Fast-track rule for easy tiers

### Feels “real”

* Clear statistical meaning: “1000 is average for your group”
* Confidence/provisional status makes it trustworthy
* Competitive rank exists, but it’s labeled as rank
