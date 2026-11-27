import { z } from "zod"

import {
  eventShopMissionChainSchema,
  eventShopMissionSchema,
  eventShopRewardRangeSchema,
  eventShopRewardTierSchema,
} from "./event-shops"

// Mirrors the API's served Survival event (TacticusPlanner.GameCatalog `GameCatalogSurvivalEvent`): one
// record per seasonal event with Survival, ids and numbers only. Dates come from the calendar's
// `survival` occurrence and are null while the calendar does not date the event. Rewards, ladders and
// missions reuse the event shop shapes.

const countSchema = z.number().int().nonnegative()

// An NPC at a 1-based stats row (`npcId:N`) and how many of it.
const survivalUnitCountSchema = z.looseObject({
  npcId: z.string().min(1),
  statsIndex: z.number().int().positive(),
  count: z.number().int().positive(),
})

// A power-up granted after a wave; a summon also names the NPC that spawns and its stats row.
const survivalPowerUpSchema = z.looseObject({
  id: z.string().min(1),
  npcId: z.string().min(1).optional(),
  statsIndex: z.number().int().positive().optional(),
  count: z.number().int().positive(),
})

const survivalWaveSchema = z.looseObject({
  wave: z.number().int().positive(),
  round: z.number().int().positive(),
  power: countSchema,
  score: countSchema,
  // Clone waves only: the player's team, cloned at this share of its health.
  cloneHealthPct: countSchema.optional(),
  enemies: z.array(survivalUnitCountSchema),
  enemyRarityOnClear: z.string().min(1).optional(),
  powerUpsOnClear: z.array(survivalPowerUpSchema),
})

const survivalRulesSchema = z.looseObject({
  allowedFactionIds: z.array(z.string().min(1)),
  mowsAllowed: z.boolean(),
  maxCharacters: z.number().int().positive(),
  stamina: z.looseObject({
    start: countSchema,
    max: countSchema,
    regenSeconds: countSchema,
    regenAmount: countSchema,
  }),
  statBoostPct: countSchema,
  statBoostStats: z.array(z.string()),
  lastStand: z
    .looseObject({
      buffId: z.string().min(1),
      strategicMultiplier: countSchema,
    })
    .optional(),
  summon: z
    .looseObject({
      unitId: z.string().min(1),
      levels: z.array(
        z.looseObject({ rarityCap: z.string(), abilityLevel: countSchema })
      ),
    })
    .optional(),
  persistentRarityUps: z.array(
    z.looseObject({ rarity: z.string(), wave: z.number().int().positive() })
  ),
  featuredHeroStats: z.array(
    z.looseObject({
      rarity: z.string(),
      critChance: countSchema,
      critDamage: countSchema,
      blockChance: countSchema,
      blockDamage: countSchema,
    })
  ),
})

const survivalScoringSchema = z.looseObject({
  medals: z.array(
    z.looseObject({
      medal: z.string().min(1),
      wave: z.number().int().positive(),
      rewards: z.array(eventShopRewardRangeSchema),
    })
  ),
  killScores: z.array(
    z.looseObject({
      npcId: z.string().min(1),
      statsIndex: z.number().int().positive(),
      score: countSchema,
    })
  ),
  cloneWaveScore: countSchema.optional(),
  skippedTurnScore: countSchema,
  rarityMilestones: z.array(
    z.looseObject({
      rarity: z.string(),
      rewards: z.array(eventShopRewardRangeSchema),
    })
  ),
})

export const survivalEventSchema = z.looseObject({
  // december-2026, crescendo-a, ...
  id: z.string().min(1),
  eventKey: z.string().min(1),
  definitionId: z.string().min(1).nullable(),
  startUtc: z.string().min(1).nullable(),
  endUtc: z.string().min(1).nullable(),
  featuredCharacterId: z.string().min(1),
  currency: z.string().min(1),
  rules: survivalRulesSchema,
  waves: z.array(survivalWaveSchema).min(1),
  scoring: survivalScoringSchema,
  // The most event points the event pays, and the most from each source.
  points: z.looseObject({
    max: countSchema,
    freeMissions: countSchema,
    premiumMissions: countSchema,
    survivalFree: countSchema,
    survivalPremium: countSchema,
  }),
  milestones: z.array(eventShopRewardTierSchema),
  chests: z.array(
    z.looseObject({
      level: z.number().int().positive(),
      cost: z.looseObject({ type: z.string().min(1), amount: countSchema }),
      rewards: z.array(eventShopRewardRangeSchema),
    })
  ),
  missions: z.looseObject({
    daily: z.array(eventShopMissionSchema),
    free: z.array(eventShopMissionChainSchema),
    premium: z.array(eventShopMissionChainSchema),
  }),
  // Real-money offers: `kind` is the offer id's last segment (pass, playmore), the price is the US
  // store price in cents.
  offers: z.array(
    z.looseObject({
      id: z.string().min(1),
      kind: z.string().min(1),
      priceCents: countSchema,
      maxPurchases: z.number().int().positive().optional(),
      rewards: z.array(eventShopRewardRangeSchema),
    })
  ),
})
