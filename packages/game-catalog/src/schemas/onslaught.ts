import { z } from "zod"

const onslaughtRewardRangeSchema = z
  .object({
    min: z.number().int().positive(),
    max: z.number().int().positive(),
  })
  .refine(
    (range) => range.max >= range.min,
    "Reward maximum must be at least its minimum."
  )

export const onslaughtRewardSchema = z.object({
  id: z.string().min(1),
  sector: z.enum([
    "Stone",
    "Iron",
    "Bronze",
    "Silver",
    "Gold",
    "Diamond",
    "Adamantine",
  ]),
  tier: z.number().int().min(1).max(3),
  regular: z.array(onslaughtRewardRangeSchema).length(5),
  mythic: onslaughtRewardRangeSchema,
})
