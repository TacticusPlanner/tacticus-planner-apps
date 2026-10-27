import { z } from "zod"
import { progressionOrder, Rank, Rarity } from "@workspace/game-domain"

const levelSchema = z.number().int().positive()

// One XP book: the XP it gives and the gold it costs to apply.
const xpBookSchema = z.looseObject({
  id: z.string(),
  rarity: z.enum(Rarity),
  xpIncrease: z.number().int().positive(),
  gold: z.number().int().positive(),
})

// The XP level each of a rank's six upgrade slots needs, in the game's slot order, keyed by the rank
// the upgrades are applied at.
const upgradeSlotRankSchema = z.looseObject({
  rank: z.enum(Rank),
  xpLevelRequirements: z.array(levelSchema).length(6),
})

// One hero ascension step and the caps it allows. `maxRank` is a game rank id, which can name a rank
// past the planner's own ladder (Adamantine3).
const heroProgressionRuleSchema = z.looseObject({
  step: z.number().int().nonnegative(),
  progression: z.enum(progressionOrder),
  rarity: z.enum(Rarity),
  stars: z.number().int().nonnegative(),
  maxXpLevel: levelSchema,
  maxRank: z.string(),
  unitStatMultiplierPct: z.number().int(),
  abilityStatMultiplierPct: z.number().int(),
  hreShards: z.number().int().nullable(),
})

// One MoW ascension step; the mythic multiplier is null below Mythic.
const mowProgressionRuleSchema = z.looseObject({
  step: z.number().int().nonnegative(),
  progression: z.enum(progressionOrder),
  rarity: z.enum(Rarity),
  stars: z.number().int().nonnegative(),
  maxAbilityLevel: levelSchema,
  abilityStatMultiplierPct: z.number().int(),
  mythicAbilityStatMultiplierPct: z.number().int().nullable(),
})

// The single progression-rules record (datamine units/xpLevels, consumables, units/upgradeSlots and
// the hero/MoW progression steps). `xpLevels[i]` is the total XP a unit needs to reach level i + 2.
export const progressionRulesSchema = z.looseObject({
  xpLevels: z.array(z.number().int().positive()).min(1),
  xpBooks: z.array(xpBookSchema),
  upgradeSlots: z.array(upgradeSlotRankSchema),
  heroProgressionSteps: z.array(heroProgressionRuleSchema),
  mowProgressionSteps: z.array(mowProgressionRuleSchema),
})
