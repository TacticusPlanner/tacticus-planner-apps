import { z } from "zod"

const countSchema = z.number().int().nonnegative()

// A game reward string: "type", "type:N" or "type:N-M" (see ../incursions/incursion-rewards.ts).
const rewardSchema = z.string()

// A battle enemy group: `count` copies of `npcId` at `level`.
const incursionEnemySchema = z.looseObject({
  npcId: z.string(),
  level: countSchema,
  count: z.number().int().positive(),
})

// One battle of a tier: `starRewards` are the 1-, 2- and 3-star rewards (each earned once),
// `baseRewards` come with every win.
const incursionBattleSchema = z.looseObject({
  id: z.string(),
  boardId: z.string(),
  challenge: z.boolean(),
  difficultyMultiplier: z.number().int().positive(),
  lightningVictoryTurns: z.number().int().nullable(),
  baseRewards: z.array(rewardSchema),
  starRewards: z.array(rewardSchema).length(3),
  enemies: z.array(incursionEnemySchema),
})

const incursionChestSchema = z.looseObject({
  id: z.string(),
  type: z.string(),
  rewards: z.array(rewardSchema),
})

// One node of a tier's run map (a DAG walked from depth 0): exactly the id matching its `kind` is
// set. It opens once any node in `unlockedBy` is done; picking it locks `exclusiveWith`.
const incursionNodeSchema = z.looseObject({
  index: countSchema,
  depth: countSchema,
  kind: z.enum(["battle", "enhancement", "chest"]),
  name: z.string(),
  battleId: z.string().nullable(),
  enhancementId: z.string().nullable(),
  chest: incursionChestSchema.nullable(),
  unlockedBy: z.array(countSchema),
  exclusiveWith: z.array(countSchema),
})

const incursionTierSchema = z.looseObject({
  index: countSchema,
  rarity: z.string(),
  battles: z.array(incursionBattleSchema),
  nodes: z.array(incursionNodeSchema),
})

const incursionEnhancementSchema = z.looseObject({
  type: z.string(),
  abilityId: z.string().nullable(),
  unitAmount: z.number().int().nullable(),
  stacks: z.boolean(),
})

// One Machine of War Incursion as the game defines it (`incursions` dataset): when it first ran,
// the hero factions a run may bring, the run tokens, the enhancements its run maps use, and per
// difficulty tier its battles and run map.
export const incursionSchema = z.looseObject({
  mowId: z.string(),
  availableFromUtc: z.string(),
  new: z.boolean(),
  updated: z.boolean(),
  allowedFactions: z.array(z.string()),
  tokens: z.looseObject({
    start: countSchema,
    max: z.number().int().positive(),
    regenSeconds: z.number().int().positive(),
    regenAmount: z.number().int().positive(),
    costPerRun: z.number().int().positive(),
  }),
  minUnitsOfGrandAllianceNeeded: countSchema,
  ohSoCloseOffer: z.looseObject({}),
  enhancements: z.record(z.string(), incursionEnhancementSchema),
  tiers: z.array(incursionTierSchema),
})
