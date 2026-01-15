# Game Creation Guideline

This guide outlines the process for adding a new game to the Brain App. Follow these steps to ensure all components are correctly integrated.

## Steps

### 1. Understand the intent of the game

Before writing any code, clearly define:

- **Game Logic**: What is the core mechanic?
- **Difficulty Progression**: How does the game get harder (levels 1-10)?
- **Data Structure**: What data does the frontend need to render a round?

### 2. Generate questions on `scripts/generate-questions.ts`

You need to teach the AI how to generate levels for your game.

1.  Open `scripts/generate-questions.ts`.
2.  **Define the Zod Schema**: Create a new schema (e.g., `NewGameSchema`) that matches your game's data structure.
3.  **Update Mappings**:
    - Add your schema to `GameSchemas`.
    - `type GameId` will automatically update, but ensure you use the correct key.
4.  **Implement Prompt Logic**:
    - In `buildPrompt()`, add a new `case` for your game ID.
    - Write a prompt that instructs the LLM to generate unique configurations for a given `count` and `difficulty`.
    - **Crucial**: Include a "Difficulty Guide" in the prompt to ensure levels 1-10 scale appropriately.
5.  **Test Generation**:
    Run the script to verify it produces valid JSON output in `scripts/output/`.
    ```bash
    npx tsx scripts/generate-questions.ts --game <your_game_id> --count 5
    ```

### 3. Add the validators on `lib/validators`

The app uses shared validators to ensure type safety across the frontend and backend.

1.  Navigate to `lib/validators`.
2.  Open or create the relevant validation file (usually `lib/validators/game-content.ts`).
3.  Export a Zod schema that matches the structure you defined in step 2.
    - _Note: This prevents runtime errors when the app consumes the generated questions._

### 4. Add the games on `components/games`

Create the React component that players will interact with.

1.  Go to `components/games`.
2.  Create a new file, e.g., `YourGameName.tsx`.
3.  scaffold the component. It should likely accept props for the current level's content.
4.  Implement the game logic, UI, and win/loss states.

---

## Database & Deployment

When you are ready to persist your changes and new questions to the database, you must follow this **Two-Step Migration Process** to avoid foreign key constraint errors.

### 1. Create the Game Migration

First, you must create the game entry in the `games` table.

```bash
supabase migrations new seed_<game_name>_game
```

In this migration file, write the SQL to `INSERT` your new game into the `games` table.

### 2. Push Game to Database

Push this migration _before_ adding questions.

```bash
npm run db:push
```

### 3. Generate Questions & Seed Migration

Now that the game exists, you can generate the questions and the seeding migration.

1.  Run the question generation script (e.g., `npx tsx scripts/generate-questions.ts ...`).
2.  Create a separate migration for questions:
    ```bash
    supabase migrations new seed_<game_name>_questions
    ```
3.  Run the seed generation script (e.g., `npx tsx scripts/generate-seed-sql.ts`) pointing to this new migration file.

### 4. Push Questions to Database

Finally, push the questions.

```bash
npm run db:push
```
