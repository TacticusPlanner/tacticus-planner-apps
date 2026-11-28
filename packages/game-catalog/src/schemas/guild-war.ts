import { z } from "zod"

const countSchema = z.number().int().nonnegative()

// A game rarity by the game's name (Common … Mythic).
const raritySchema = z.string()

// A zone of the battlefield in layout order: `visualId` names its kind (armory, trenches…), `buffId`
// is the buff it gives the defenders, `row`/`column` place it on the map.
const guildWarZoneSchema = z.looseObject({
  id: z.string(),
  visualId: z.string(),
  buffId: z.string().nullable(),
  canBeMoved: z.boolean(),
  score: countSchema,
  row: countSchema,
  column: countSchema,
})

// A zone tier (Trooper, Veteran, Elite, Hero) and the rarity cap of each of its five defender slots.
const guildWarTierSchema = z.looseObject({
  id: z.string(),
  rarityCaps: z.array(raritySchema).length(5),
})

// A battlefield level: the per-attempt debuff, the score factor (null on level 0) and each zone's tier.
const guildWarLevelSchema = z.looseObject({
  battlefieldLevel: countSchema,
  attemptDebuffPercent: countSchema,
  scoreFactorPercent: countSchema.nullable(),
  zones: z.array(z.looseObject({ zoneId: z.string(), tierId: z.string() })),
})

// A buff with its scope and the abilities it applies (one per rarity when the game keys them so).
const guildWarBuffSchema = z.looseObject({
  id: z.string(),
  scope: z.string(),
  abilities: z.array(
    z.looseObject({
      abilityId: z.string(),
      rarity: raritySchema.nullable(),
      variables: z.record(z.string(), z.array(z.number())),
    })
  ),
})

// A hex of a board's logical grid: column and row (row 0 on the attacker's side).
const guildWarCellSchema = z.looseObject({
  column: countSchema,
  row: countSchema,
})

// A map-pool board's battle grid: the logical grid (`columns` × `rows`, every hex playable unless
// `blocked`) placed on the game's visual board (`visualColumns` × `visualRows`, the art's grid) at
// `visualFirstColumn`/`visualFirstRow`, the terrain and elevation of each hex, and the hexes each
// side deploys on for this map's spawn set.
const guildWarBoardSchema = z.looseObject({
  columns: z.number().int().positive(),
  rows: z.number().int().positive(),
  visualColumns: z.number().int().positive(),
  visualRows: z.number().int().positive(),
  visualFirstColumn: countSchema,
  visualFirstRow: countSchema,
  tiles: z.array(
    guildWarCellSchema.extend({
      terrain: z.string(),
      elevation: z.number().int(),
      blocked: z.boolean(),
    })
  ),
  attackerSpawns: z.array(guildWarCellSchema),
  defenderSpawns: z.array(guildWarCellSchema),
})

// One Guild War season (`guildWarSeasonA` …) as the `guild-war` dataset serves it.
export const guildWarSeasonSchema = z.looseObject({
  id: z.string(),
  nextSeasonId: z.string(),
  maxAttempts: z.number().int().positive(),
  zones: z.array(guildWarZoneSchema),
  tiers: z.array(guildWarTierSchema),
  levels: z.array(guildWarLevelSchema),
  buffs: z.array(guildWarBuffSchema),
  maps: z.array(
    z.looseObject({
      boardId: z.string(),
      spawnPointsSet: countSchema,
      // Optional so a client that ships before the API serves it still reads the season.
      board: guildWarBoardSchema.optional(),
    })
  ),
  scoring: z.looseObject({
    unitKilled: countSchema,
    lineupEliminated: z.array(
      z.looseObject({
        maxAttempts: countSchema,
        maxUnitsLost: countSchema,
        score: countSchema,
      })
    ),
  }),
  powerCaps: z.array(
    z.looseObject({ rarity: raritySchema, maxPower: countSchema })
  ),
})
