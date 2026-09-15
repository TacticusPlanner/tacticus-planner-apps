import { z } from "zod"

// Structural contract for the curated, id-only Guild Raid guidance. Presentation remains a client
// concern: the API deliberately supplies no names, portraits, source URL, or localized role labels.
const unitIdSchema = z.string().min(1)

export const guildRaidMetaCompSchema = z.looseObject({
  id: unitIdSchema,
  signatureUnitId: unitIdSchema,
  coreCharacterIds: z.array(unitIdSchema),
  flexCharacterIds: z.array(unitIdSchema),
  mowIds: z.array(unitIdSchema),
})

// One exact hero slot's explicit, authored substitution rule. `roleId` is a stable token interpreted by
// the client (see entities/guild-raid-meta); an id the current client does not recognize still passes
// here and falls back to a readable label rather than being rejected.
export const guildRaidMetaHeroSlotSchema = z
  .looseObject({
    heroId: unitIdSchema,
    roleId: unitIdSchema,
    essential: z.boolean(),
    replacementCharacterIds: z.array(unitIdSchema),
  })
  .refine(
    (slot) => !slot.replacementCharacterIds.includes(slot.heroId),
    "replacementCharacterIds must not include the slot's own heroId."
  )
  .refine(
    (slot) =>
      new Set(slot.replacementCharacterIds).size ===
      slot.replacementCharacterIds.length,
    "replacementCharacterIds must not contain duplicates."
  )

// `kind` is a free-form archetype id (e.g. "lavistodes", "neuro", "meta", "alternate") — there is no
// fixed set or fixed count of recommendations per boss/prime group; a source authors as many as it
// documents. Uniqueness within one group is enforced on the owning boss/prime schema below.
export const guildRaidMetaRecommendationSchema = z
  .looseObject({
    id: unitIdSchema,
    kind: unitIdSchema,
    heroSlots: z.array(guildRaidMetaHeroSlotSchema).length(5),
    mowId: unitIdSchema,
    mowReplacementIds: z.array(unitIdSchema),
    compIds: z.array(unitIdSchema),
    // Relative within its own boss/prime group only: the weakest recommendation in a group anchors at
    // 1, a stronger one exceeds it. Never comparable across different bosses or primes.
    efficiency: z.number().positive(),
  })
  .refine(
    (recommendation) =>
      !recommendation.mowReplacementIds.includes(recommendation.mowId),
    "mowReplacementIds must not include the recommendation's own mowId."
  )
  .refine(
    (recommendation) =>
      new Set(recommendation.mowReplacementIds).size ===
      recommendation.mowReplacementIds.length,
    "mowReplacementIds must not contain duplicates."
  )

function uniqueKinds(recommendations: { kind: string }[]) {
  const kinds = recommendations.map((recommendation) => recommendation.kind)
  return new Set(kinds).size === kinds.length
}

export const guildRaidMetaBossSchema = z
  .looseObject({
    bossUnitSetId: unitIdSchema,
    // Zero or more prime raid-bosses unit-set ids fought alongside this boss. A prime listed here may
    // or may not also have its own curated recommendations in the payload's top-level `primes[]`.
    primeUnitSetIds: z.array(unitIdSchema),
    recommendations: z.array(guildRaidMetaRecommendationSchema).nonempty(),
  })
  .refine(
    (boss) => uniqueKinds(boss.recommendations),
    "Recommendation kind must be unique within a boss group."
  )

// A prime's own curated recommendations, using exactly the same recommendation shape as a boss group.
// A prime referenced by a boss's primeUnitSetIds but absent from this array simply has no curated
// comp yet — a valid state, not an error.
export const guildRaidMetaPrimeSchema = z
  .looseObject({
    primeUnitSetId: unitIdSchema,
    recommendations: z.array(guildRaidMetaRecommendationSchema).nonempty(),
  })
  .refine(
    (prime) => uniqueKinds(prime.recommendations),
    "Recommendation kind must be unique within a prime group."
  )

// A complete payload is one persisted IndexedDB row. Keep authored array order intact: a later
// feature chooses how to display it, but must never rank or reorder this curated guidance.
export const guildRaidMetaPayloadSchema = z
  .looseObject({
    sourceId: unitIdSchema,
    updatedOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    comps: z.array(guildRaidMetaCompSchema),
    bosses: z.array(guildRaidMetaBossSchema),
    primes: z.array(guildRaidMetaPrimeSchema),
  })
  .refine((payload) => {
    const ids = [
      ...payload.bosses.flatMap((boss) =>
        boss.recommendations.map((recommendation) => recommendation.id)
      ),
      ...payload.primes.flatMap((prime) =>
        prime.recommendations.map((recommendation) => recommendation.id)
      ),
    ]
    return new Set(ids).size === ids.length
  }, "Recommendation ids must be globally unique across the dataset.")
