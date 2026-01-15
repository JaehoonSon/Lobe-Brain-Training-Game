import { z } from "zod";

// 1. Mental Arithmetic
export const MentalArithmeticContentSchema = z.object({
  type: z.literal("mental_arithmetic"),
  operandRange: z.tuple([z.number(), z.number()]).optional(), // [min, max]
  operators: z.array(z.enum(["+", "-", "x", "*", "/"])).optional(),
});

// 2. Memory Matrix
export const MemoryMatrixContentSchema = z.object({
  type: z.literal("memory_matrix"),
  grid_size: z.object({
    rows: z.number(),
    cols: z.number(),
  }),
  target_count: z.number(),
  display_time_ms: z.number(),
});

// 3. Mental Language Discrimination
export const MentalLanguageDiscriminationContentSchema = z.object({
  type: z.literal("mental_language_discrimination"),
  sentenceParts: z.array(z.string()),
  options: z.array(z.string()),
  answer: z.string(),
});

// 4. Wordle
export const WordleContentSchema = z.object({
  type: z.literal("wordle"),
  word: z.string(),
  max_guesses: z.number(),
});

// 5. Ball Sort
export const BallSortContentSchema = z
  .object({
    type: z.literal("ball_sort"),
    tubeCount: z.number().int().min(2, "Need at least 2 tubes"),
    capacityPerTube: z
      .number()
      .int()
      .min(2, "Each tube should hold at least 2 balls")
      .max(12, "Tubes taller than 12 are usually impractical"),
    colorCount: z.number().int().min(1, "Need at least one color"),
  })
  .superRefine((data, ctx) => {
    // Must have at least one extra tube to be able to move anything
    if (data.tubeCount <= data.colorCount) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Need at least ${data.colorCount + 1} tubes to sort (${data.colorCount} colors)`,
        path: ["tubeCount"],
      });
    }

    // Very strong recommendation (not hard requirement)
    if (data.tubeCount < data.colorCount + 2) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Most fun & solvable games use 2 extra tubes",
        path: ["tubeCount"],
      });
    }

    // Prevent nonsense
    if (data.colorCount >= data.tubeCount) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Can't have more colors than tubes",
        path: ["colorCount"],
      });
    }
  });

// 6. Word Unscramble
export const WordUnscrambleContentSchema = z.object({
  type: z.literal("word_unscramble"),
  word: z.string(),
  hint: z.string().optional(),
});

// Union Schema for all game content
export const GameContentSchema = z.discriminatedUnion("type", [
  MentalArithmeticContentSchema,
  MemoryMatrixContentSchema,
  MentalLanguageDiscriminationContentSchema,
  WordleContentSchema,
  BallSortContentSchema,
  WordUnscrambleContentSchema,
]);

export type MentalArithmeticContent = z.infer<typeof MentalArithmeticContentSchema>;
export type MemoryMatrixContent = z.infer<typeof MemoryMatrixContentSchema>;
export type MentalLanguageDiscriminationContent = z.infer<
  typeof MentalLanguageDiscriminationContentSchema
>;
export type WordleContent = z.infer<typeof WordleContentSchema>;
export type BallSortContent = z.infer<typeof BallSortContentSchema>;
export type WordUnscrambleContent = z.infer<typeof WordUnscrambleContentSchema>;
export type GameContent = z.infer<typeof GameContentSchema>;
