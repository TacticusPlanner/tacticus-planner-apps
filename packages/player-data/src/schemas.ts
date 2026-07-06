import { z } from "zod"

// Envelope/manifest shapes mirror @workspace/game-catalog's zod schemas: loose objects so additive
// (server-added) fields don't break validation on older deployed clients.

export const playerDataManifestChunkSchema = z.looseObject({
  key: z.string(),
  hash: z.string(),
  url: z.string(),
})

export const playerDataManifestSchema = z.looseObject({
  schemaVersion: z.number(),
  gameConfigHash: z.string(),
  sourceHash: z.string(),
  syncedAt: z.string(),
  chunks: z.array(playerDataManifestChunkSchema),
})

// Chunk-envelope metadata; `data` is validated separately by the per-key payload schema below.
export const playerDataChunkEnvelopeMetaSchema = z.looseObject({
  schemaVersion: z.number(),
  gameConfigHash: z.string(),
  sourceHash: z.string(),
  chunkKey: z.string(),
  chunkHash: z.string(),
  data: z.unknown(),
})

const namedRarityAmountSchema = z.looseObject({
  name: z.string(),
  rarity: z.string(),
  amount: z.number(),
})

const rarityAmountSchema = z.looseObject({
  rarity: z.string(),
  amount: z.number(),
})

const tokenBucketSchema = z.looseObject({
  current: z.number(),
  max: z.number(),
  nextTokenInSeconds: z.number(),
  regenDelayInSeconds: z.number(),
})

const playerDetailsSchema = z.looseObject({
  name: z.string(),
  powerLevel: z.number(),
})

const playerUnitSchema = z.looseObject({
  unitId: z.string(),
  name: z.string(),
  faction: z.string(),
  grandAlliance: z.string(),
  progressionIndex: z.number(),
  xp: z.number(),
  xpLevel: z.number(),
  rank: z.number(),
  shards: z.number(),
  mythicShards: z.number(),
  abilities: z.array(
    z.looseObject({ abilityId: z.string(), level: z.number() })
  ),
  appliedUpgradeSlots: z.array(z.number()),
  equippedItems: z.array(
    z.looseObject({
      slotId: z.string(),
      equipmentId: z.string(),
      name: z.string(),
      rarity: z.string(),
      level: z.number(),
    })
  ),
})

const inventoryUpgradeSchema = z.looseObject({
  upgradeId: z.string(),
  name: z.string(),
  amount: z.number(),
})

const inventoryItemSchema = z.looseObject({
  itemId: z.string(),
  name: z.string(),
  level: z.number(),
  amount: z.number(),
})

const inventorySchema = z.looseObject({
  shards: z.array(
    z.looseObject({ shardId: z.string(), name: z.string(), amount: z.number() })
  ),
  mythicShards: z.array(
    z.looseObject({ shardId: z.string(), name: z.string(), amount: z.number() })
  ),
  xpBooks: z.array(
    z.looseObject({
      xpBookId: z.string(),
      rarity: z.string(),
      amount: z.number(),
    })
  ),
  abilityBadges: z.looseObject({
    imperial: z.array(namedRarityAmountSchema),
    xenos: z.array(namedRarityAmountSchema),
    chaos: z.array(namedRarityAmountSchema),
  }),
  components: z.array(
    z.looseObject({
      name: z.string(),
      grandAlliance: z.string(),
      amount: z.number(),
    })
  ),
  forgeBadges: z.array(namedRarityAmountSchema),
  orbs: z.looseObject({
    imperial: z.array(rarityAmountSchema),
    xenos: z.array(rarityAmountSchema),
    chaos: z.array(rarityAmountSchema),
  }),
  requisitionOrdersRegular: z.number(),
  requisitionOrdersBlessed: z.number(),
  resetStones: z.number(),
})

const campaignProgressSchema = z.looseObject({
  tacticusCampaignId: z.string(),
  catalogCampaignGroupId: z.string().nullable(),
  name: z.string(),
  type: z.string(),
  battles: z.array(
    z.looseObject({
      battleIndex: z.number(),
      attemptsLeft: z.number(),
      attemptsUsed: z.number(),
    })
  ),
  highestObservedBattleIndex: z.number(),
})

const gameModeTokensSchema = z.looseObject({
  arena: tokenBucketSchema.nullable(),
  guildRaid: z
    .looseObject({ tokens: tokenBucketSchema, bombTokens: tokenBucketSchema })
    .nullable(),
  onslaught: tokenBucketSchema.nullable(),
  salvageRun: tokenBucketSchema.nullable(),
})

const lreProgressSchema = z.looseObject({
  eventId: z.string(),
  lanes: z.array(
    z.looseObject({
      laneId: z.number(),
      name: z.string(),
      encounters: z.array(
        z.looseObject({
          objectivesCleared: z.array(z.number()),
          highScore: z.number(),
          encounterPoints: z.number(),
        })
      ),
    })
  ),
  currentPoints: z.number(),
  currentCurrency: z.number(),
  currentShards: z.number(),
  currentClaimedChestIndex: z.number(),
  currentEventRun: z.number().nullable(),
  currentEventTokens: tokenBucketSchema.nullable(),
  hasUsedAdForExtraTokenToday: z.boolean().nullable(),
  extraCurrencyPerPayout: z.number().nullable(),
})

// Per-chunk payload schema, keyed the same way as the served chunk keys.
export const playerDataChunkPayloadSchemas = {
  "player-details": playerDetailsSchema,
  characters: z.array(playerUnitSchema),
  mows: z.array(playerUnitSchema),
  "inventory-upgrades": z.array(inventoryUpgradeSchema),
  "inventory-items": z.array(inventoryItemSchema),
  inventory: inventorySchema,
  "campaign-progress": z.array(campaignProgressSchema),
  "campaign-events-progress": z.array(campaignProgressSchema),
  "game-mode-tokens": gameModeTokensSchema,
  "lre-progress": z.array(lreProgressSchema),
} as const
