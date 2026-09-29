import { z } from "zod"

import { amountByRaritySchema } from "./shared"

// One rung of the shared character ability cost ladder: the gold and ability badges to raise a
// character's ability to `level` (the ladder starts at level 2; level 1 is free). One ladder serves
// every character and both ability tracks.
export const characterAbilityCostSchema = z.looseObject({
  level: z.number(),
  gold: z.number(),
  badges: amountByRaritySchema,
})
