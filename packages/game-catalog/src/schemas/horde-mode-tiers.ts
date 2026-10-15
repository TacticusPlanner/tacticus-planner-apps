import { z } from "zod"

// The curated horde-mode tier list (horde-mode-tiers dataset): a single record. `tiers` holds each
// tier's power multiplier (S, A, B, C in that order); a character absent from `characters` is untiered
// (multiplier 1.0).
export const hordeModeTiersSchema = z.looseObject({
  id: z.string(),
  tiers: z.array(
    z.looseObject({
      tier: z.string(),
      multiplier: z.number().positive(),
    })
  ),
  characters: z.array(
    z.looseObject({
      unitId: z.string(),
      tier: z.string(),
    })
  ),
})
