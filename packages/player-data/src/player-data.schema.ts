import { z } from "zod"
import {
  Rank,
  progressionOrder,
  type Progression,
} from "@workspace/game-catalog"

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

const progressionSchema = z.enum(
  progressionOrder as unknown as [Progression, ...Progression[]]
)

// Shared fields for a character or a MoW. MoWs have no rank and no equipment slots, so those are
// only added on `playerCharacterSchema` below (mirrors the backend's `PlayerBaseUnitRecord` split
// into `PlayerCharacterRecord`/`PlayerMowRecord`). Name/faction/grandAlliance are intentionally
// absent — the catalog already knows them for a given unit id, so they aren't duplicated here.
const playerUnitBaseSchema = {
  unitId: z.string(),
  progressionIndex: progressionSchema,
  xp: z.number(),
  xpLevel: z.number(),
  shards: z.number(),
  mythicShards: z.number(),
  abilities: z.array(
    z.looseObject({ abilityId: z.string(), level: z.number() })
  ),
  appliedUpgradeSlots: z.array(z.number()),
}

const playerCharacterSchema = z.looseObject({
  ...playerUnitBaseSchema,
  rank: z.enum(Rank),
  equippedItems: z.array(
    z.looseObject({
      slotId: z.string(),
      equipmentId: z.string(),
      level: z.number(),
    })
  ),
})

const playerMowSchema = z.looseObject({ ...playerUnitBaseSchema })

const inventoryUpgradeSchema = z.looseObject({
  upgradeId: z.string(),
  amount: z.number(),
})

const inventoryItemSchema = z.looseObject({
  itemId: z.string(),
  level: z.number(),
  amount: z.number(),
})

const componentAmountSchema = z.looseObject({
  amount: z.number(),
})

// Mow components have no per-item identity worth tracking — just the total count per grand
// alliance, mirroring how Orbs/AbilityBadges are already split.
const mowComponentsSchema = z.looseObject({
  imperial: componentAmountSchema,
  xenos: componentAmountSchema,
  chaos: componentAmountSchema,
})

// Regular + mythic shard progress toward a unit not yet unlocked, merged into a single record keyed
// by `unitId` (the Tacticus API returns these as two separate lists; a unit absent from one list just
// reads back 0 for that side, rather than requiring a matching entry in both). Only covers units
// absent from `characters`/`mows` — an already-unlocked unit's shard counts live on its own record
// instead (see `playerUnitBaseSchema`'s `shards`/`mythicShards`), never duplicated here.
const inventoryShardSchema = z.looseObject({
  unitId: z.string(),
  amount: z.number(),
  mythicAmount: z.number(),
})

const inventorySchema = z.looseObject({
  xpBooks: z.array(z.looseObject({ xpBookId: z.string(), amount: z.number() })),
  abilityBadges: z.looseObject({
    imperial: z.array(rarityAmountSchema),
    xenos: z.array(rarityAmountSchema),
    chaos: z.array(rarityAmountSchema),
  }),
  components: mowComponentsSchema,
  forgeBadges: z.array(rarityAmountSchema),
  orbs: z.looseObject({
    imperial: z.array(rarityAmountSchema),
    xenos: z.array(rarityAmountSchema),
    chaos: z.array(rarityAmountSchema),
  }),
  requisitionOrdersRegular: z.number(),
  requisitionOrdersBlessed: z.number(),
  resetStones: z.number(),
})

// One campaign's progress identity — used by both the `campaign-progress` (standard/mirror/elite/
// elite-mirror) and `campaign-events-progress` (limited-time campaign events) chunks.
// `tacticusCampaignId` is unconditionally also the static catalog's campaign group id (e.g.
// "campaign1", "mirror1", "elite1", "eliteMirror1", "eventCampaign6") — every Tacticus campaign id
// now has a matching catalog group, so no separate cross-reference field is needed. Per-battle
// attempt data lives in the `live-progress` chunk instead (it changes far more often than this
// identity/high-water-mark record does).
const campaignProgressSchema = z.looseObject({
  tacticusCampaignId: z.string(),
  type: z.string(),
  highestCompletedBattleIndex: z.number(),
})

const tokenBucketOrNullSchema = tokenBucketSchema.nullable()

const gameModeTokensSchema = z.looseObject({
  arena: tokenBucketOrNullSchema,
  guildRaid: z
    .looseObject({ tokens: tokenBucketSchema, bombTokens: tokenBucketSchema })
    .nullable(),
  onslaught: tokenBucketOrNullSchema,
  salvageRun: tokenBucketOrNullSchema,
})

// Often-changing data kept in its own chunk (`live-progress`) so it can be re-synced/re-stored
// independently of the much-less-volatile roster/inventory/campaign-identity chunks.
const liveProgressSchema = z.looseObject({
  battleAttempts: z.array(
    z.looseObject({
      tacticusCampaignId: z.string(),
      battleIndex: z.number(),
      attemptsLeft: z.number(),
      attemptsUsed: z.number(),
    })
  ),
  activeCampaignEventId: z.string().nullable(),
  gameModeTokens: gameModeTokensSchema,
})

const lreTrackProgressSchema = z.looseObject({
  encounters: z.array(
    z.looseObject({
      objectivesCleared: z.array(z.number()),
      highScore: z.number(),
      encounterPoints: z.number(),
    })
  ),
})

// One Legendary Release Event's player progress. Track shape mirrors the catalog's `GameCatalogLreView`
// named Alpha/Beta/Gamma properties (Tacticus's lane ids 1/2/3) rather than a generic indexed list.
const lreProgressSchema = z.looseObject({
  id: z.string(),
  alpha: lreTrackProgressSchema.nullable(),
  beta: lreTrackProgressSchema.nullable(),
  gamma: lreTrackProgressSchema.nullable(),
  currentPoints: z.number(),
  currentCurrency: z.number(),
  currentShards: z.number(),
  currentClaimedChestIndex: z.number(),
  currentEventRun: z.number().nullable(),
  currentEventTokens: tokenBucketOrNullSchema,
  hasUsedAdForExtraTokenToday: z.boolean().nullable(),
  extraCurrencyPerPayout: z.number().nullable(),
})

// Per-chunk payload schema, keyed the same way as the served chunk keys.
export const playerDataChunkPayloadSchemas = {
  "player-details": playerDetailsSchema,
  characters: z.array(playerCharacterSchema),
  mows: z.array(playerMowSchema),
  "inventory-upgrades": z.array(inventoryUpgradeSchema),
  "inventory-items": z.array(inventoryItemSchema),
  "inventory-shards": z.array(inventoryShardSchema),
  inventory: inventorySchema,
  "campaign-progress": z.array(campaignProgressSchema),
  "campaign-events-progress": z.array(campaignProgressSchema),
  "live-progress": liveProgressSchema,
  "lre-progress": z.array(lreProgressSchema),
} as const
