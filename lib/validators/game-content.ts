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

// Union Schema for all game content
export const GameContentSchema = z.discriminatedUnion("type", [
  MentalArithmeticContentSchema,
  MemoryMatrixContentSchema,
  MentalLanguageDiscriminationContentSchema,
]);

export type MentalArithmeticContent = z.infer<typeof MentalArithmeticContentSchema>;
export type MemoryMatrixContent = z.infer<typeof MemoryMatrixContentSchema>;
export type MentalLanguageDiscriminationContent = z.infer<
  typeof MentalLanguageDiscriminationContentSchema
>;
export type GameContent = z.infer<typeof GameContentSchema>;
