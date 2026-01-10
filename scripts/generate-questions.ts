import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { z } from 'zod';
import { generateText, Output } from 'ai';

/* -------------------------------------------------------------------------- */
/*                                   Config                                   */
/* -------------------------------------------------------------------------- */

const MODEL = 'deepseek/deepseek-v3.2';

/* -------------------------------------------------------------------------- */
/*                                   Schemas                                  */
/* -------------------------------------------------------------------------- */

// 1. Mental Arithmetic
const MentalArithmeticSchema = z.object({
  type: z.literal('mental_arithmetic'),
  operandRange: z.tuple([z.number(), z.number()]),
  operators: z.array(z.enum(['+', '-', '*', '/'])),
});

// 2. Memory Matrix
const MemoryMatrixSchema = z.object({
  type: z.literal('memory_matrix'),
  grid_size: z.object({
    rows: z.number(),
    cols: z.number(),
  }),
  target_count: z.number(),
  display_time_ms: z.number(),
});

// 3. Mental Language Discrimination
const MentalLanguageDiscriminationSchema = z.object({
  type: z.literal('mental_language_discrimination'),
  sentenceParts: z.tuple([z.string(), z.string()]),
  options: z.array(z.string()),
  answer: z.string(),
});

// 4. Wordle
const WordleSchema = z.object({
  type: z.literal('wordle'),
  word: z.string(),
  max_guesses: z.number(),
});

// 5. Ball Sort
const BallSortSchema = z.object({
  type: z.literal('ball_sort'),
  tubeCount: z.number(),
  capacityPerTube: z.number(),
  colorCount: z.number(),
});

/* -------------------------------------------------------------------------- */
/*                         Game → Schema Type Mapping                          */
/* -------------------------------------------------------------------------- */

const GameSchemas = {
  mental_arithmetic: MentalArithmeticSchema,
  memory_matrix: MemoryMatrixSchema,
  mental_language_discrimination: MentalLanguageDiscriminationSchema,
  wordle: WordleSchema,
  ball_sort: BallSortSchema,
} as const;

type GameId = keyof typeof GameSchemas;
type GameContent<G extends GameId> = z.infer<(typeof GameSchemas)[G]>;

/* -------------------------------------------------------------------------- */
/*                                   Models                                   */
/* -------------------------------------------------------------------------- */

interface Question<G extends GameId> {
  id: string;
  game_id: G;
  difficulty: number;
  content: GameContent<G>;
}

interface ScriptConfig<G extends GameId = GameId> {
  game: G;
  difficulty: number;
  count: number;
}

/* -------------------------------------------------------------------------- */
/*                               Arg Parsing                                  */
/* -------------------------------------------------------------------------- */

function parseArgs(): ScriptConfig {
  const args = process.argv.slice(2);
  const config: Partial<ScriptConfig> = {};

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--game':
        config.game = args[i + 1] as GameId;
        i++;
        break;
      case '--difficulty':
        config.difficulty = Number(args[i + 1]);
        i++;
        break;
      case '--count':
        config.count = Number(args[i + 1]);
        i++;
        break;
    }
  }

  if (!config.game || !config.count) {
    console.error(
      'Usage: npx tsx scripts/generate-questions.ts --game <game_id> --count <number>'
    );
    process.exit(1);
  }

  return config as ScriptConfig;
}

/* -------------------------------------------------------------------------- */
/*                          Prompt / Schema Builders                           */
/* -------------------------------------------------------------------------- */

function buildOutputSchema<G extends GameId>(game: G) {
  return z.object({
    questions: z.array(GameSchemas[game]),
  });
}

type OutputPayload<G extends GameId> = {
  questions: GameContent<G>[];
};

function buildPrompt(game: GameId, count: number, difficulty: number): string {
  switch (game) {
    case 'mental_arithmetic':
      return `
    Generate ${count} unique mental arithmetic configurations for difficulty ${difficulty}/10.

    CRITICAL: For this difficulty, generate a mix of distinct configuration profiles. Do NOT use the same range/operators for all.
    
    Examples of profiles to mix (adapt for difficulty ${difficulty}):
    - [Focus: Addition/Subtraction]: Larger numbers, basic operators.
    - [Focus: Multiplication/Division]: Smaller numbers, advanced operators.
    - [Focus: Mixed]: Moderate numbers, multiple operators.

    Constraints:
    - Ensure EVERY configuration is mentally solvable within 5-10 seconds.
    - NEVER combine 3-digit numbers with multiplication/division.
    - If ops include '*' or '/', max range should be small (e.g. 1-12 or 1-20 depending on difficulty).

    Difficulty guide:
    - 1: Single digit addition/subtraction (e.g. 5+3)
    - 5: Double digit addition/subtraction (e.g. 45-12), OR Single digit mixed (e.g. 5*6+2)
    - 10: Triple digit addition/subtraction (e.g. 450-125), OR Double digit mixed (e.g. 12*5+10)

    Output ONLY valid JSON.
    `;

    case 'memory_matrix':
      return `
    Generate ${count} unique memory matrix configurations for difficulty ${difficulty}/10.

    CRITICAL: Create VARIETY in the "difficulty profile". Do not just linearly increase grid size.
    
    Mix these profiles:
    1. "Flash": Smaller grid, very short display time (requires fast perception).
    2. "Endurance": Larger grid, longer display time, many targets (requires capacity).
    3. "Density": Medium grid, high ratio of targets to cells.

    Difficulty guide:
    - 1: 3x3 grid, ~3 targets, 2-3s display time.
    - 5: 5x5 grid, ~6-8 targets, ~1.5s/0.8s depending on profile.
    - 10: 8x8 to 10x10 grid, 15-25 targets, fast display times (<0.5s for Flash, <2s for Endurance).

    Output ONLY valid JSON.
    `;

    case 'mental_language_discrimination':
      return `
    Generate ${count} unique language discrimination questions for difficulty ${difficulty}/10.

    CRITICAL: Ensure variety in the LINGUISTIC CATEGORY. Do not stick to one type (like homophones).
    
    Include a mix of:
    - Homophones/Confusing Words (e.g. affect/effect, principle/principal).
    - Semantic Nuance (e.g. selecting the word with the correct connotation for the tone).
    - Grammatical Precision (e.g. tense markers, prepositions).
    - Collocations (words that naturally go together).

    Context:
    - "sentenceParts" splits the sentence around the missing word
    - "options" are candidate words (distractors must be plausible)
    - "answer" must be one of the options

    Difficulty guide:
    - 1: Common homophones, simple sentences.
    - 5: Professional vocabulary, subtle distinction in meaning.
    - 10: Advanced/Literary vocabulary, highly sensitive context-dependent choices.

    Output ONLY valid JSON.
    `;

    case 'wordle': {
      const wordLength = difficulty <= 4 ? 5 : difficulty <= 6 ? 6 : difficulty <= 8 ? 7 : 8;
      const maxGuesses = difficulty >= 7 ? 5 : 6;

      return `
    Generate ${count} unique ${wordLength}-letter words for a Wordle game at difficulty ${difficulty}/10.

    RULES:
    - Every word must be EXACTLY ${wordLength} letters.
    - All words must be valid English dictionary words.
    - No proper nouns, abbreviations, or slang.
    - Ensure variety: mix different starting letters, vowel patterns.
    - Words should be in UPPERCASE.

    DIFFICULTY GUIDE:
    - 1-2: Common 5-letter words (household items, common verbs). max_guesses: 6
    - 3-4: Moderate 5-letter vocabulary. max_guesses: 6
    - 5-6: Standard 6-letter vocabulary. max_guesses: 6
    - 7-8: Less common 6-7 letter words. max_guesses: 5
    - 9-10: Advanced/rare 7-8 letter words. max_guesses: 5

    For this request:
    - word_length: ${wordLength}
    - max_guesses: ${maxGuesses}

    Output ONLY valid JSON.
    `;
    }

    case 'ball_sort': {
      // Logic for scaling difficulty
      // Diff 1-3: Easy (Extra empty tubes, few colors)
      // Diff 4-7: Medium
      // Diff 8-10: Hard (Minimal empty tubes, many colors)
      
      return `
      Generate ${count} unique Ball Sort game configurations for difficulty ${difficulty}/10.

      Constraints:
      - capacityPerTube: ALWAYS 4 (standard for this game).
      - tubeCount MUST be > colorCount.
      
      Difficulty Guide:
      - 1-2: 4 tubes, 2 colors (2 empty tubes). Very easy.
      - 3-4: 5 tubes, 3 colors (2 empty tubes).
      - 5-6: 7 tubes, 5 colors (2 empty tubes).
      - 7-8: 9 tubes, 7 colors (2 empty tubes).
      - 9-10: 12 tubes, 10 colors (2 empty tubes) OR 11 tubes, 10 colors (1 empty tube - very hard).

      Ensure valid configurations where the game is solvable (having at least 1-2 empty tubes is key).

      Output ONLY valid JSON.
      `;
    }

    default:
      game satisfies never;
      return '';
  }
}

/* -------------------------------------------------------------------------- */
/*                                   Main                                     */
/* -------------------------------------------------------------------------- */

async function main() {
  const { game, count } = parseArgs();

  if (!process.env.AI_GATEWAY_API_KEY) {
    console.error('Error: AI_GATEWAY_API_KEY is not set.');
    process.exit(1);
  }

  const outputDir = path.join(process.cwd(), 'scripts', 'output');
  fs.mkdirSync(outputDir, { recursive: true });

  const difficulties = Array.from({ length: 10 }, (_, i) => i + 1);
  // const difficulties = [1];

  await Promise.all(
    difficulties.map(async (difficulty) => {
      const outputFile = path.join(outputDir, `${game}_${difficulty}.json`);

      let existingQuestions: Question<typeof game>[] = [];
      if (fs.existsSync(outputFile)) {
        try {
          existingQuestions = JSON.parse(fs.readFileSync(outputFile, 'utf-8'));
        } catch (e) {
          console.warn(
            `Warning: Could not parse existing questions file for diff ${difficulty}, starting fresh.`
          );
        }
      }

      // Since we are now splitting files by difficulty, existingQuestions length is the count for this difficulty
      const existingCount = existingQuestions.length;

      console.log(
        `[Difficulty ${difficulty}] Found ${existingCount} existing questions. Requested: ${count}.`
      );

      if (existingCount >= count) {
        console.log(
          `[Difficulty ${difficulty}] Skipping generation: Have enough questions (${existingCount} >= ${count}).`
        );
        return;
      }

      const schema = buildOutputSchema(game);
      const prompt = buildPrompt(game, count, difficulty);

      console.log(
        `[Difficulty ${difficulty}] Generating ${count} NEW questions for ${game}...`
      );

      try {
        const result = await generateText({
          model: MODEL,
          prompt,
          output: Output.object({ schema }),
        });

        const payload = result.output as OutputPayload<typeof game>;

        const newQuestions: Question<typeof game>[] = payload.questions.map(
          (content) => ({
            id: crypto.randomUUID(),
            game_id: game,
            difficulty,
            content,
          })
        );

        // Overwrite the file with the new complete set
        fs.writeFileSync(outputFile, JSON.stringify(newQuestions, null, 2));

        console.log(
          `[Difficulty ${difficulty}] Success: Saved ${newQuestions.length} questions to ${path.basename(
            outputFile
          )}`
        );
      } catch (error) {
        console.error(
          `[Difficulty ${difficulty}] Error generating questions:`,
          error
        );
      }
    })
  );
}

/* -------------------------------------------------------------------------- */

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
