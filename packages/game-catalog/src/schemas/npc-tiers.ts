import { z } from "zod"

// The curated enemy NPC tier list (npc-tiers dataset): a single record. `tiers` holds each tier's power
// multiplier (S, A, B, C, D in that order), applied to an NPC's power in Legendary Event clear
// estimates; an NPC's optional `multiplier` overrides its tier's, and an NPC absent from `npcs` is
// untiered (multiplier 1.0).
export const npcTiersSchema = z.looseObject({
  id: z.string(),
  tiers: z.array(
    z.looseObject({
      tier: z.string(),
      multiplier: z.number().positive(),
    })
  ),
  npcs: z.array(
    z.looseObject({
      npcId: z.string(),
      tier: z.string(),
      multiplier: z.number().positive().optional(),
    })
  ),
})
