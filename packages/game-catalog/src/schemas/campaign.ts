import { z } from "zod"
import {
  Alliance,
  battleIdSchema,
  campaignIdSchema,
  factionIdSchema,
  Rank,
  unitIdSchema,
} from "@workspace/game-domain"

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

const campaignRewardsViewSchema = z.looseObject({
  guaranteed: z.array(campaignGuaranteedRewardSchema),
  potential: z.array(campaignPotentialRewardViewSchema),
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
  slots: z.number(),
  rewards: campaignRewardsViewSchema,
  enemyPower: z.number(),
  enemiesAlliances: z.array(z.enum(Alliance)),
  enemiesFactions: z.array(factionIdSchema),
  enemiesTotal: z.number(),
  enemiesTypes: z.array(z.string()),
  detailedEnemyTypes: z.array(campaignDetailedEnemySchema),
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
