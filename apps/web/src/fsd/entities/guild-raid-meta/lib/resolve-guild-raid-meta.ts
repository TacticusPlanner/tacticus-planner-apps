import {
  characterIcon,
  mowIcon,
  type GameCatalogGuildRaidMeta,
  type GameCatalogGuildRaidMetaBoss,
  type GameCatalogGuildRaidMetaHeroSlot,
  type GameCatalogGuildRaidMetaRecommendation,
} from "@workspace/game-catalog"
import type { UnitId } from "@workspace/game-domain"

const terminusMaximusSourceId = "terminus-maximus-guild-raid-boss-meta"

export const guildRaidMetaSourceUrl =
  "https://terminusmaximus.com/guild-raid/boss-meta/"

type CatalogUnit = { id: string; name: string }

export type GuildRaidMetaUnitPresentation = {
  id: string
  name: string
  portraitUrl?: string
  kind: "character" | "mow" | "unknown"
}

export type GuildRaidMetaSourcePresentation = {
  sourceId: string
  name: string
  url?: string
}

export type GuildRaidMetaBossPresentation = {
  boss: GameCatalogGuildRaidMetaBoss | null
  name: string
}

export type GuildRaidMetaRolePresentation = {
  id: string
  label: string
}

/** A recommendation's `kind` is a free-form archetype id ("meta", "lavistodes", "admech", …) — there is
 * no fixed set. Resolved through the exact same known-id/readable-fallback pattern as `roleId`. */
export type GuildRaidMetaKindPresentation = {
  id: string
  label: string
}

export type GuildRaidMetaHeroSlotPresentation = {
  slot: GameCatalogGuildRaidMetaHeroSlot
  hero: GuildRaidMetaUnitPresentation
  role: GuildRaidMetaRolePresentation
  replacements: GuildRaidMetaUnitPresentation[]
}

export type GuildRaidMetaRecommendationPresentation = {
  recommendation: GameCatalogGuildRaidMetaRecommendation
  kind: GuildRaidMetaKindPresentation
  heroes: GuildRaidMetaUnitPresentation[]
  heroSlots: GuildRaidMetaHeroSlotPresentation[]
  mow: GuildRaidMetaUnitPresentation
  mowReplacements: GuildRaidMetaUnitPresentation[]
  comps: Array<{
    id: string
    signature: GuildRaidMetaUnitPresentation
  }>
}

export type GuildRaidMetaPresentationResolver = {
  resolveBoss: (bossUnitSetId: string) => GuildRaidMetaBossPresentation
  resolveCharacter: (characterId: string) => GuildRaidMetaUnitPresentation
  resolveMow: (mowId: string) => GuildRaidMetaUnitPresentation
  resolveSignature: (unitId: string) => GuildRaidMetaUnitPresentation
  resolveRole: (roleId: string) => GuildRaidMetaRolePresentation
  resolveKind: (kind: string) => GuildRaidMetaKindPresentation
  resolveRecommendation: (
    recommendation: GameCatalogGuildRaidMetaRecommendation
  ) => GuildRaidMetaRecommendationPresentation
  resolveSource: (sourceId: string) => GuildRaidMetaSourcePresentation
}

function readableFallback(id: string): string {
  return id
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .trim()
}

function unknownUnit(id: string): GuildRaidMetaUnitPresentation {
  return { id, name: readableFallback(id), kind: "unknown" }
}

/**
 * Presentation stays at the entity boundary: curated data remains id-only in the catalog, while
 * callers get readable names and only receive an image URL when the matching local unit exists.
 */
export function createGuildRaidMetaPresentationResolver({
  meta,
  charactersById,
  mowsById,
  bossName,
  roleLabel,
  kindLabel,
}: {
  meta: GameCatalogGuildRaidMeta
  charactersById: ReadonlyMap<string, CatalogUnit>
  mowsById: ReadonlyMap<string, CatalogUnit>
  bossName: (bossUnitSetId: string, fallback: string) => string
  roleLabel: (roleId: string, fallback: string) => string
  kindLabel: (kind: string, fallback: string) => string
}): GuildRaidMetaPresentationResolver {
  const resolveCharacter = (
    characterId: string
  ): GuildRaidMetaUnitPresentation => {
    const character = charactersById.get(characterId)
    return character
      ? {
          id: characterId,
          name: character.name,
          portraitUrl: characterIcon(characterId as UnitId),
          kind: "character",
        }
      : unknownUnit(characterId)
  }

  const resolveMow = (mowId: string): GuildRaidMetaUnitPresentation => {
    const mow = mowsById.get(mowId)
    return mow
      ? {
          id: mowId,
          name: mow.name,
          portraitUrl: mowIcon(mowId as UnitId),
          kind: "mow",
        }
      : unknownUnit(mowId)
  }

  const resolveSignature = (unitId: string) =>
    charactersById.has(unitId)
      ? resolveCharacter(unitId)
      : mowsById.has(unitId)
        ? resolveMow(unitId)
        : unknownUnit(unitId)

  const resolveRole = (roleId: string): GuildRaidMetaRolePresentation => ({
    id: roleId,
    label: roleLabel(roleId, readableFallback(roleId)),
  })

  const resolveKind = (kind: string): GuildRaidMetaKindPresentation => ({
    id: kind,
    label: kindLabel(kind, readableFallback(kind)),
  })

  const resolveHeroSlot = (
    slot: GameCatalogGuildRaidMetaHeroSlot
  ): GuildRaidMetaHeroSlotPresentation => ({
    slot,
    hero: resolveCharacter(slot.heroId),
    role: resolveRole(slot.roleId),
    replacements: slot.replacementCharacterIds.map(resolveCharacter),
  })

  return {
    resolveBoss: (bossUnitSetId) => {
      const boss = meta.bosses.find(
        (group) => group.bossUnitSetId === bossUnitSetId
      )
      const fallback = readableFallback(bossUnitSetId)
      return { boss: boss ?? null, name: bossName(bossUnitSetId, fallback) }
    },
    resolveCharacter,
    resolveMow,
    // Comp signatures are authored as a unit id. Today they are characters, but accepting an MoW
    // keeps the contract truthful and retains the same readable fallback for either kind.
    resolveSignature,
    resolveRole,
    resolveKind,
    resolveRecommendation: (recommendation) => ({
      recommendation,
      kind: resolveKind(recommendation.kind),
      heroes: (recommendation.heroSlots ?? []).map((slot) =>
        resolveCharacter(slot.heroId)
      ),
      // A recommendation cached before variant rules existed carries neither field at runtime even
      // though the current type declares them required — fall back to empty rather than crash while
      // that stale row is still on screen, mid-rollout.
      heroSlots: (recommendation.heroSlots ?? []).map(resolveHeroSlot),
      mow: resolveMow(recommendation.mowId),
      mowReplacements: (recommendation.mowReplacementIds ?? []).map(resolveMow),
      comps: recommendation.compIds.map((compId) => {
        const comp = meta.comps.find((candidate) => candidate.id === compId)
        return {
          id: compId,
          signature: comp
            ? resolveSignature(comp.signatureUnitId)
            : unknownUnit(compId),
        }
      }),
    }),
    resolveSource: (sourceId) =>
      sourceId === terminusMaximusSourceId
        ? {
            sourceId,
            name: "Terminus Maximus",
            url: guildRaidMetaSourceUrl,
          }
        : { sourceId, name: readableFallback(sourceId) },
  }
}
