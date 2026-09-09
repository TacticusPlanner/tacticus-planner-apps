import { z } from "zod"

// Loose objects preserve unknown (server-added) fields and only fail on genuine shape/type breaks,
// matching the rest of this package's schemas (see shared.ts). Mirrors the API's served
// `GameCatalogRaidBossesView` (TacticusPlanner.GameCatalog): structural / identity fields only — no
// display names, portraits, or icon ids. The client resolves every boss/prime/ability/trait/faction/
// npc name and image from its id.

const raidBossStatStepSchema = z.looseObject({
  health: z.number(),
  damage: z.number(),
  fixedArmor: z.number(),
  rank: z.number(),
  starLevel: z.number(),
  baseRarity: z.string(),
  progressionIndex: z.number(),
  abilityLevel: z.number(),
  relicAbilityLevel: z.number().optional(),
  blockChance: z.number().optional(),
  blockDamage: z.number().optional(),
  critChance: z.number().optional(),
  critDamage: z.number().optional(),
})

const raidBossWeaponSchema = z.looseObject({
  hits: z.number(),
  damageProfile: z.string(),
  range: z.number().optional(),
})

export const raidBossSchema = z.looseObject({
  unitSetId: z.string().min(1),
  kind: z.enum(["boss", "prime"]),
  isPrimarch: z.boolean(),
  factionId: z.string(),
  movement: z.number(),
  statProgression: z.array(raidBossStatStepSchema),
  weapons: z.array(raidBossWeaponSchema).optional(),
  activeAbilityIds: z.array(z.string()).optional(),
  passiveAbilityIds: z.array(z.string()).optional(),
  relicAbilityIds: z.array(z.string()).optional(),
  traitIds: z.array(z.string()).optional(),
  // The canonical npc id this unit set represents (served since add-raid-boss-portraits); the client
  // resolves its portrait. Absent when the source omits it.
  questUnitId: z.string().optional(),
})

// An encounter modifier with its definition inlined (server-resolved). `hpLost` is the boss-HP-lost
// threshold at which it activates.
const raidBossEncounterModifierSchema = z.looseObject({
  hpLost: z.number(),
  modifierId: z.string(),
  type: z.string(),
  target: z.string(),
  subtarget: z.string().optional(),
  amount: z.number(),
})

const raidBossEncounterSchema = z.looseObject({
  encounterIndex: z.number(),
  encounterType: z.string(),
  boardId: z.string(),
  maxNrOfTurns: z.number(),
  // The referenced unit-set id (raw `unitId` with its `:N` suffix stripped) and that 1-based index.
  unitSetId: z.string(),
  progressionIndex: z.number(),
  bossType: z.string().optional(),
  fieldNpcIds: z.array(z.string()),
  disallowedFactionIds: z.array(z.string()),
  modifiers: z.array(raidBossEncounterModifierSchema),
})

const raidBossSetSchema = z.looseObject({
  set: z.number(),
  chestId: z.string(),
  guildXp: z.number(),
  encounters: z.array(raidBossEncounterSchema),
})

const raidBossTierSchema = z.looseObject({
  tier: z.number(),
  sets: z.array(raidBossSetSchema),
})

export const raidBossSeasonSchema = z.looseObject({
  seasonConfigId: z.string(),
  tiers: z.array(raidBossTierSchema),
})

// The served `raid-bosses` payload — an object, not a plain array (like `events-calendar`, the other
// exception to this package's "every payload is an array" convention). Stored as a single IndexedDB
// row (see game-catalog.mapper.ts) since the Library reads it whole; the per-record type is this same
// object and `StorageModel<"raid-bosses">` adds the storage-managed `id` (a fixed `"raid-bosses"`).
export const raidBossesPayloadSchema = z.looseObject({
  seasonConfigRotation: z.array(z.string()),
  bosses: z.array(raidBossSchema),
  primes: z.array(raidBossSchema),
  seasons: z.record(z.string(), raidBossSeasonSchema),
})
