import { z } from "zod"
import { Rarity } from "@workspace/game-domain"
import {
  factionIdSchema,
  unitIdSchema,
  upgradeIdSchema,
} from "@workspace/game-domain/schemas"

// One Quest Event (quest-events dataset), keyed by its featured hero. The server flattens V1's tiers
// into 17 `battles` in play order, each with its tier, position in the tier and deploy slots.
// `enemies` are grouped by (id, ladderIndex) with a `count`; board power-ups (loot-object NPCs) are
// served among them. `power` is the in-game battle power, null where it was not recorded.
// An objective's `target` is always a string (`MaxHits` 3 → "3"), null for types without one.
const questEnemySchema = z.looseObject({
  id: z.string(),
  ladderIndex: z.number().int(),
  count: z.number().int().positive(),
})

const questObjectiveSchema = z.looseObject({
  type: z.string(),
  target: z.string().nullish(),
  score: z.number().int(),
})

const questBattleSchema = z.looseObject({
  number: z.number().int(),
  tier: z.enum(Rarity),
  tierPosition: z.number().int(),
  deploySlots: z.number().int().positive(),
  boardId: z.string(),
  spawnPointsSet: z.number().int(),
  lightningVictoryTurns: z.number().int(),
  power: z.number().int().nullish(),
  enemies: z.array(questEnemySchema),
  objectives: z.array(questObjectiveSchema),
  loot: z.looseObject({
    upgradeId: upgradeIdSchema,
    chanceNumerator: z.number().int(),
    chanceDenominator: z.number().int().positive(),
  }),
})

export const questEventSchema = z.looseObject({
  featuredCharacterId: unitIdSchema,
  allowedFactionIds: z.array(factionIdSchema),
  enemyFactionIds: z.array(factionIdSchema),
  battles: z.array(questBattleSchema),
})

// The 17-crate reward track shared by every quest (quest-crates dataset), keyed by `number`.
// A reward's amount is the range `min`..`max`; `maxRarity` marks a random badge across a rarity range
// (Common to Uncommon). Badges and orbs are for the featured hero's alliance, which the client resolves.
const questCrateRewardTypes = [
  "Coins",
  "RaidTicket",
  "XpBook",
  "AbilityBadge",
  "AscensionOrb",
] as const

export const questCrateSchema = z.looseObject({
  number: z.number().int(),
  points: z.number().int(),
  rewards: z.array(
    z.looseObject({
      type: z.enum(questCrateRewardTypes),
      min: z.number().int(),
      max: z.number().int(),
      rarity: z.enum(Rarity).nullish(),
      maxRarity: z.enum(Rarity).nullish(),
    })
  ),
})
