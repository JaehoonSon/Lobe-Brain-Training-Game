# Database Schema Design for Adaptive Difficulty

## Goal

Design a database structure that supports adaptive difficulty for brain training games. The system needs to:

1.  Store questions with varying difficulty levels.
2.  Track user performance (Game Results).
3.  Maintain a "baseline" or skill rating for each user to adjust difficulty dynamically.

## User Review Required

> [!IMPORTANT]
> This design assumes using Supabase (PostgreSQL). We will use `jsonb` for question content to support flexible formats (text, multiple choice, grids).

## Proposed Schema

### 1. `categories` Table

_Broad domains of cognitive training._

- **id**: `text` (Primary Key)
  - _Slug: 'memory', 'speed', 'logic', 'focus'_
- **name**: `text` (Not Null)
  - _Display: "Memory", "Processing Speed"_
- **description**: `text`
- **theme**: `jsonb`
  - _UI Config: `{ "color_hex": "#FF5733", "icon_key": "brain" }`_
- **created_at**: `timestamptz` (Default: `now()`)

### 2. `games` Table

_Metadata for the games themselves (assets, descriptions)._

- **id**: `text` (Primary Key)
  - _Slug ID like 'memory_matrix', 'arithmetic'_
- **category_id**: `text` (FK -> `categories.id`)
- **name**: `text` (Not Null)
  - _Display name e.g., "Memory Matrix"_
- **description**: `text`
- **instructions**: `text`
- **icon_url**: `text`
- **banner_url**: `text`
- **is_active**: `boolean` (Default: `true`)
- **created_at**: `timestamptz` (Default: `now()`)

### 3. `questions` Table

_Stores the library of all available puzzles._

- **id**: `uuid` (Primary Key, Default: `gen_random_uuid()`)
- **game_id**: `text` (FK -> `games.id`)
- **difficulty**: `float4` (Not Null)
  - _Rating 1.0 - 10.0_
- **content**: `jsonb` (Not Null)
  - _The actual puzzle data (see JSON Structure section)_
- **created_at**: `timestamptz` (Default: `now()`)
- **Indexes**: `(game_id, difficulty)` for efficient progression queries.

### Content JSON Structure

We will use a **Discriminated Union** pattern. Every JSON object must have a `type` field.

#### 1. mental_arithmetic

```json
{
  "type": "mental_arithmetic",
  "operandRange": [1, 25],
  "operators": ["+", "-"]
}
```

#### 2. Memory Matrix (Visual Memory)

```json
{
  "type": "memory_matrix",
  "grid_size": { "rows": 4, "cols": 4 },
  "target_count": 5, // Client generates 5 random distinct cells
  "display_time_ms": 2000 // for now
}
```

#### 3. Sequence / Pattern (Logic, Math)

Used for: mental_language_discrimination

```json
{
  "type": "mental_language_discrimination",
  "sentenceParts": ["She left her keys over ", "."],
  "options": ["there", "their"],
  "answer": "there"
}
```

#### 4. Matching / Pairs (Memory)

```json
{
  "type": "card_matching",
  "items": [
    { "id": "1", "content": "Cat", "match_id": "m1" },
    { "id": "2", "content": "Chat", "match_id": "m1" },
    { "id": "3", "content": "Dog", "match_id": "m2" },
    { "id": "4", "content": "Chien", "match_id": "m2" }
  ]
}
```

#### 5. Stroop Clash (Focus)

```json
{
  "type": "stroop_clash",
  "word": "RED", // The text shown (uppercase color name)
  "ink": "#0000FF", // Hex color the word is rendered in
  "task": "INK", // "INK" = identify ink color, "WORD" = identify text
  "cue": "COLOR", // Display cue: "COLOR" or "TEXT"
  "options": ["Red", "Blue", "Green", "Yellow"], // Button labels
  "targetTimeMs": 2800 // Optimal response time for scoring
}
```

### 4. `game_sessions` Table

_Represents one full "round" of a game played by a user._

- **id**: `uuid` (Primary Key)
- **user_id**: `uuid` (FK -> `auth.users`, On Delete: Cascade)
- **game_id**: `text` (FK -> `games.id`)
- **difficulty_level**: `float4`
  - _The user's rating at the START of this session_
- **total_questions**: `int2` (e.g., 10)
- **correct_count**: `int2` (e.g., 8)
- **duration_seconds**: `int4` (Total time for the round)
- **score**: `int4`
  - _Computed score based on difficulty _ correctness\*
- **created_at**: `timestamptz`

### 5. `game_answers` Table

_Tracks every single question answered. Essential for detailed analytics and "Show me what I missed"._

- **id**: `uuid` (Primary Key)
- **session_id**: `uuid` (FK -> `game_sessions`, On Delete: Cascade)
- **question_id**: `uuid` (FK -> `questions`, **Nullable** for procedural games)
- **is_correct**: `boolean` (Not Null)
- **response_time_ms**: `int4`
  - _Time taken for this specific question_
- **user_response**: `jsonb`
  - _Optional: Store exactly what they clicked/typed. e.g. `{ "selected_option_id": "a" }`_
- **generated_content**: `jsonb`
  - _For procedural games: stores the ephemeral puzzle params_

### 6. `user_performance` Table

_The "Save File" for a user's skill level._

- **user_id**: `uuid` (FK -> `auth.users`)
- **game_id**: `text` (FK -> `games.id`)
- **current_rating**: `float4` (Default: 1.0)
  - _Starts at 1.0, scales up to 10.0+_
- **highest_score**: `int4`
- **games_played_count**: `int4` (Default: 0)
- **last_played_at**: `timestamptz`
- **created_at**: `timestamptz` (Default: `now()`)
- **Primary Key**: `(user_id, game_id)`

---

## Strategy: Difficulty Control & Progression

### "Start Easy to Hard" (Intra-Game Progression)

For a single game session consisting of $N$ questions:

1.  Fetch the user's current `rating` from `user_performance`.
2.  Select questions using a **Progression Curve**:
    - **Start**: Rating - 1.0 (Warm-up)
    - **Middle**: Rating (Challenge)
    - **End**: Rating + 0.5 (Reach)
3.  **Query Example**:
    ```sql
    select * from questions
    where game_id = 'arithmetic'
    and difficulty between (user_rating - 1.0) and (user_rating + 1.0)
    order by difficulty asc
    limit 10;
    ```

### Controlling Difficulty (Inter-Game Adaptation)

After every `game_result` is saved:

1.  Calculate **Performance Score** based on accuracy and speed.
    - _Perfect_: Rating increases (+0.2).
    - _Struggled_: Rating decreases (-0.1) or stays same.
2.  Update `user_performance.rating`.
3.  Next game will automatically query harder/easier questions.
