import { z } from "zod"

// Where each NPC is fought (npc-encounters dataset): one record per (npcId, source, groupId), mirroring the
// API's served `GameCatalogNpcEncounter`. Ids and numbers only — the client resolves names, links and timing.
// `groupId` is the campaign group (campaign / campaignEvent), the event's featured unit (legendaryEvent: the
// lreId; questEvent: the featured character), the MoW (incursion), the raid boss / prime unit set (guildRaid),
// the Survival battle set key (survival) or "onslaught".

export const npcEncounterSources = [
  "campaign",
  "campaignEvent",
  "legendaryEvent",
  "questEvent",
  "incursion",
  "guildRaid",
  "survival",
  "onslaught",
] as const

export type NpcEncounterSource = (typeof npcEncounterSources)[number]

const npcEncounterRoles = ["enemy", "boss", "prime"] as const

// One place within the group. Every field is always served; the ones a source has no value for are null
// (or [] for `rounds`): battleId (campaign, campaignEvent, legendaryEvent, incursion), track (campaignEvent:
// Standard/Extremis; legendaryEvent: alpha/beta/gamma), tier (incursion: the served tier index; onslaught:
// 1-based), number (campaign node, LE / quest battle number), rounds (survival: the entry's one round; onslaught),
// count (how many of the NPC the place spawns; for onslaught the most in any one wave of the tier, because a tier
// draws from a pool of waves; null for guildRaid, which names no count).
// One level of an NPC in a place: servedIndex is the position in its served stats (the NPC Library's level), or
// null when the source's index points past the ladder.
const npcEncounterLevelSchema = z.looseObject({
  servedIndex: z.number().int().nonnegative().nullable(),
  count: z.number().int().positive(),
})

const npcEncounterBattleSchema = z.looseObject({
  battleId: z.string().nullable(),
  track: z.string().nullable(),
  tier: z.number().int().nullable(),
  number: z.number().int().nullable(),
  challenge: z.boolean(),
  role: z.enum(npcEncounterRoles),
  rounds: z.array(z.number().int()),
  count: z.number().int().positive().nullable(),
  levels: z.array(npcEncounterLevelSchema),
})

export const npcEncounterSchema = z.looseObject({
  npcId: z.string().min(1),
  source: z.enum(npcEncounterSources),
  groupId: z.string().min(1),
  battles: z.array(npcEncounterBattleSchema).min(1),
})

const knownSources = new Set<string>(npcEncounterSources)
const knownRoles = new Set<string>(npcEncounterRoles)
const namedEncounterSchema = z.looseObject({
  source: z.string(),
  battles: z.array(z.looseObject({ role: z.string() })),
})

// A newer API can add a source or a role this build has no words for. The dataset is optional and validated as
// a whole, so those records are skipped rather than costing every client the rest. Anything else that is wrong
// stays in the payload for the schema to reject.
function withoutUnknownEncounters(records: unknown): unknown {
  if (!Array.isArray(records)) return records
  return records.flatMap((record: unknown): unknown[] => {
    const named = namedEncounterSchema.safeParse(record)
    if (!named.success) return [record]
    if (!knownSources.has(named.data.source)) return []
    const battles = named.data.battles.filter(({ role }) =>
      knownRoles.has(role)
    )
    if (battles.length === named.data.battles.length) return [record]
    return battles.length > 0 ? [{ ...named.data, battles }] : []
  })
}

export const npcEncountersPayloadSchema = z.preprocess(
  withoutUnknownEncounters,
  z.array(npcEncounterSchema)
)

export type NpcEncounterBattle = z.infer<typeof npcEncounterBattleSchema>
export type NpcEncounterLevel = z.infer<typeof npcEncounterLevelSchema>
