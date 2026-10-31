import { z } from "zod"
import { Alliance, Rank } from "@workspace/game-domain"
import {
  battleIdSchema,
  campaignIdSchema,
  factionIdSchema,
  unitIdSchema,
} from "@workspace/game-domain/schemas"

const campaignGuaranteedRewardSchema = z.looseObject({
  id: z.string(),
  min: z.number(),
  max: z.number(),
})

const campaignPotentialRewardViewSchema = z.looseObject({
  id: z.string(),
  chanceId: z.string().nullable(),
  rewardKind: z.string().nullable(),
  numerator: z.number().nullable(),
  denominator: z.number().nullable(),
  effectiveRate: z.number().nullable(),
})

// One-time reward for the first win with 1, 2 or 3 medals.
const campaignMedalRewardSchema = z.looseObject({
  medals: z.number().int().min(1).max(3),
  id: z.string(),
  min: z.number(),
  max: z.number(),
})

// One-time campaign-event milestone reward (Extremis battles have Gold only).
const campaignMilestoneRewardSchema = z.looseObject({
  milestone: z.enum(["Bronze", "Silver", "Gold"]),
  id: z.string(),
  min: z.number(),
  max: z.number(),
})

const campaignRewardsViewSchema = z.looseObject({
  guaranteed: z.array(campaignGuaranteedRewardSchema),
  potential: z.array(campaignPotentialRewardViewSchema),
  // Defaulted so a catalog served before the API imported them still parses.
  medals: z.array(campaignMedalRewardSchema).default([]),
  milestones: z.array(campaignMilestoneRewardSchema).default([]),
})

const campaignDetailedEnemySchema = z.looseObject({
  id: unitIdSchema,
  name: z.string(),
  count: z.number(),
  stars: z.number(),
  rank: z.enum(Rank),
})

export const campaignBattleViewSchema = z.looseObject({
  id: battleIdSchema,
  campaignGroupId: campaignIdSchema,
  type: z.string(),
  challenge: z.boolean(),
  energyCost: z.number(),
  nodeNumber: z.number(),
  // Zero-based index used by Tacticus's own campaign-progress/battle-attempt payloads, assigned
  // independently within each {campaignGroupId, type} track. Unlike nodeNumber, this distinguishes a
  // challenge battle from the regular battle it shares a node number with.
  battleIndex: z.number(),
  slots: z.number(),
  // Daily attempt cap for this battle, derived server-side from its type (Elite/EliteMirror = 6,
  // everything else = 10) — see the API's CampaignDenormalizer.DailyAttemptsForType.
  dailyAttempts: z.number(),
  rewards: campaignRewardsViewSchema,
  enemyPower: z.number(),
  // The allied side of the campaign group, copied onto every battle by the API (V1's hardcoded
  // per-campaign allies table lives server-side now).
  alliesAlliance: z.enum(Alliance),
  alliesFactions: z.array(factionIdSchema),
  enemiesAlliances: z.array(z.enum(Alliance)),
  enemiesFactions: z.array(factionIdSchema),
  enemiesTotal: z.number(),
  enemiesTypes: z.array(z.string()),
  detailedEnemyTypes: z.array(campaignDetailedEnemySchema),
  // The turn limit of the battle's lightning victory, or null when it has none (early Indomitus nodes).
  lightningVictoryTurns: z.number().int().positive().nullable(),
})

// A campaign group's definition: metadata plus the ids of the battles in the campaign-battles dataset.
export const campaignDefinitionSchema = z.looseObject({
  groupId: campaignIdSchema,
  faction: factionIdSchema,
  releaseType: z.string(),
  coreCharacters: z.array(unitIdSchema),
  types: z.array(z.string()),
  battleIds: z.array(battleIdSchema),
})
