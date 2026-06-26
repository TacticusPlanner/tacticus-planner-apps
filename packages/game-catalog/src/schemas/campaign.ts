import { z } from "zod"

export const campaignGuaranteedRewardSchema = z.looseObject({
  id: z.string(),
  min: z.number().nullish(),
  max: z.number().nullish(),
})

export const campaignPotentialRewardViewSchema = z.looseObject({
  id: z.string(),
  chanceId: z.string().nullish(),
  rewardKind: z.string().nullish(),
  numerator: z.number().nullish(),
  denominator: z.number().nullish(),
  effectiveRate: z.number().nullish(),
})

export const campaignRewardsViewSchema = z.looseObject({
  guaranteed: z.array(campaignGuaranteedRewardSchema),
  potential: z.array(campaignPotentialRewardViewSchema),
})

export const campaignDetailedEnemySchema = z.looseObject({
  id: z.string(),
  name: z.string(),
  count: z.number(),
  stars: z.number(),
  rank: z.string(),
})

export const campaignBattleViewSchema = z.looseObject({
  id: z.string(),
  campaignGroupId: z.string(),
  difficulty: z.string(),
  energyCost: z.number(),
  nodeNumber: z.number(),
  slots: z.number(),
  rewards: campaignRewardsViewSchema,
  enemyPower: z.number(),
  enemiesAlliances: z.array(z.string()),
  enemiesFactions: z.array(z.string()),
  enemiesTotal: z.number(),
  enemiesTypes: z.array(z.string()),
  detailedEnemyTypes: z.array(campaignDetailedEnemySchema),
})

// A campaign group's definition: metadata plus the ids of the battles in the campaign-battles dataset.
export const campaignDefinitionSchema = z.looseObject({
  groupId: z.string(),
  faction: z.string(),
  releaseType: z.string(),
  coreCharacters: z.array(z.string()),
  difficulties: z.array(z.string()),
  battleIds: z.array(z.string()),
})
