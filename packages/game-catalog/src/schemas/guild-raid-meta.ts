import { z } from "zod"

// Structural contract for the curated, id-only Guild Raid guidance. Presentation remains a client
// concern: the API deliberately supplies no names, portraits, or source URL.
const unitIdSchema = z.string().min(1)

const guildRaidMetaEvidenceSchema = z.looseObject({
  replayCount: z.number().int().nonnegative(),
  averageDamage: z.number().nonnegative(),
  maximumDamage: z.number().nonnegative(),
})

export const guildRaidMetaCompSchema = z.looseObject({
  id: unitIdSchema,
  signatureUnitId: unitIdSchema,
  coreCharacterIds: z.array(unitIdSchema),
  flexCharacterIds: z.array(unitIdSchema),
  mowIds: z.array(unitIdSchema),
})

export const guildRaidMetaRecommendationSchema = z.looseObject({
  kind: z.enum(["meta", "alternate"]),
  heroIds: z.array(unitIdSchema).length(5),
  mowId: unitIdSchema,
  compIds: z.array(unitIdSchema),
  evidence: guildRaidMetaEvidenceSchema.optional(),
})

export const guildRaidMetaBossSchema = z.looseObject({
  bossUnitSetId: unitIdSchema,
  recommendations: z.array(guildRaidMetaRecommendationSchema),
})

// A complete payload is one persisted IndexedDB row. Keep authored array order intact: a later
// feature chooses how to display it, but must never rank or reorder this curated guidance.
export const guildRaidMetaPayloadSchema = z.looseObject({
  sourceId: unitIdSchema,
  updatedOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  comps: z.array(guildRaidMetaCompSchema),
  bosses: z.array(guildRaidMetaBossSchema),
})
