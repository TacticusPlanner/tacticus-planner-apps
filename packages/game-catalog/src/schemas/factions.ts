import { z } from "zod"
import { Alliance } from "@workspace/game-domain"
import { factionIdSchema } from "@workspace/game-domain/schemas"

// One faction from the game's `units/factions.json` (factions dataset). `unlockDateUtc` is the game's
// unlock timestamp as an ISO instant; `collectionFaction` marks a faction that groups units of other
// factions in the collection screen (Adeptus Astartes, The Lost and the Damned).
export const factionSchema = z.looseObject({
  id: factionIdSchema,
  alliance: z.enum(Alliance),
  unlockDateUtc: z.string(),
  collectionFaction: z.boolean(),
})

// One damage type from the game's `units/damageProfiles.json` (damage-types dataset). `piercingRatio`
// is the percentage of a hit that ignores armour; `traits` are the hit's extra effects (Flame ->
// OnFire), in game order.
export const damageTypeSchema = z.looseObject({
  id: z.string(),
  piercingRatio: z.number().int().min(0).max(100),
  traits: z.array(z.string()),
})
