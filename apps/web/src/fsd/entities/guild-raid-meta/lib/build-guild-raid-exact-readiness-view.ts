import type { GameCatalogGuildRaidMeta } from "@workspace/game-catalog"
import type { Progression, Rank } from "@workspace/game-domain"

import type { GuildRaidInvestmentThreshold } from "./resolve-guild-raid-investment-threshold"
import {
  resolveGuildRaidLineup,
  type GuildRaidLineupOptionState,
  type GuildRaidLineupStatus,
} from "./resolve-guild-raid-lineup"
import type {
  GuildRaidMetaPresentationResolver,
  GuildRaidMetaSourcePresentation,
  GuildRaidMetaUnitPresentation,
} from "./resolve-guild-raid-meta"

// A superset of `GuildRaidInvestmentFacts` (adds `xpLevel`, for display) — deliberately using the same
// field name `progression` for the same `Progression` value, not the roster schema's own confusingly-
// named `progressionIndex` field (which holds a `Progression` string, not a numeric index — see
// `GuildRaidRosterUnit` below), so this type is directly usable as investment-readiness input with no
// adapter.
export type GuildRaidExactReadinessInvestment = {
  xpLevel: number
  rank?: Rank
  progression: Progression
  activeAbilityLevel: number
  passiveAbilityLevel: number
}

/** The synced-roster fields this entity actually reads, independent of whether the caller is a
 * character or a Machine of War record (MoWs simply have no `rank`). Field name `progressionIndex`
 * matches the roster schema's own (confusingly-named — it holds a `Progression` string, not a numeric
 * index) field verbatim. */
type GuildRaidRosterUnit = {
  unitId: string
  xpLevel: number
  rank?: Rank
  progressionIndex: Progression
  abilities: { level: number }[]
}

/**
 * Maps the synced owned roster into the two shapes this entity's readiness calculators need: the
 * plain owned-id sets `resolveGuildRaidExactReadiness` compares against, and the per-unit investment
 * facts `resolveGuildRaidHeroReadiness`/`resolveGuildRaidMowReadiness` compare against the boss's
 * threshold. `abilities[0]` is a unit's active-ability record and `abilities[1]` its passive, mirroring
 * the same ordering convention already used by the Dailies team engine (`team-recommendations.ts`);
 * a unit missing either defaults to level 1 rather than 0, matching that same convention.
 */
export function buildGuildRaidRosterInvestment(roster: {
  characters: readonly GuildRaidRosterUnit[]
  mows: readonly GuildRaidRosterUnit[]
}): {
  ownedCharacterIds: ReadonlySet<string>
  ownedMowIds: ReadonlySet<string>
  investmentByCharacterId: ReadonlyMap<
    string,
    GuildRaidExactReadinessInvestment
  >
  investmentByMowId: ReadonlyMap<string, GuildRaidExactReadinessInvestment>
} {
  const toInvestment = (
    unit: GuildRaidRosterUnit
  ): GuildRaidExactReadinessInvestment => ({
    xpLevel: unit.xpLevel,
    rank: unit.rank,
    progression: unit.progressionIndex,
    activeAbilityLevel: unit.abilities[0]?.level ?? 1,
    passiveAbilityLevel: unit.abilities[1]?.level ?? 1,
  })

  return {
    ownedCharacterIds: new Set(roster.characters.map((unit) => unit.unitId)),
    ownedMowIds: new Set(roster.mows.map((unit) => unit.unitId)),
    investmentByCharacterId: new Map(
      roster.characters.map((unit) => [unit.unitId, toInvestment(unit)])
    ),
    investmentByMowId: new Map(
      roster.mows.map((unit) => [unit.unitId, toInvestment(unit)])
    ),
  }
}

export type GuildRaidExactReadinessUnitView = GuildRaidMetaUnitPresentation & {
  /** `undefined` when the player's roster is unavailable — ownership is withheld, not inferred. */
  owned?: boolean
  investment?: GuildRaidExactReadinessInvestment
}

export type GuildRaidExactReadinessOptionView = {
  unit: GuildRaidExactReadinessUnitView
  isIdeal: boolean
  /** `undefined` when the player's roster is unavailable. */
  state?: GuildRaidLineupOptionState
  /** Index of the slot this unit fills instead, when `state` is `inTeam`. */
  inTeamSlotIndex?: number
  readiness?: number
}

export type GuildRaidExactReadinessSlotView = {
  kind: "hero" | "mow"
  /** `undefined` for the Machine of War. */
  role?: { id: string; label: string }
  essential: boolean
  ideal: GuildRaidExactReadinessUnitView
  /** The unit the player would field here; `null` when nothing owned fits or the roster is
   * unavailable. */
  picked: GuildRaidExactReadinessUnitView | null
  isSubstitute: boolean
  readiness?: number
  options: GuildRaidExactReadinessOptionView[]
}

export type GuildRaidExactReadinessRecommendationView = {
  id: string
  kind: { id: string; label: string }
  efficiency: number
  comps: Array<{ id: string; signature: GuildRaidMetaUnitPresentation }>
  /** `undefined` when the player's roster is unavailable. */
  status?: GuildRaidLineupStatus
  /** `undefined` when the roster or the live investment threshold is unavailable. */
  teamReadiness?: number
  /** Five hero slots in authored order, then the Machine of War. */
  slots: GuildRaidExactReadinessSlotView[]
}

type GuildRaidExactReadinessPopulatedView = {
  source: GuildRaidMetaSourcePresentation
  updatedOn: string
  /** The investment target every percentage is scored against; `null` without a live guild status. */
  threshold: GuildRaidInvestmentThreshold | null
  recommendations: GuildRaidExactReadinessRecommendationView[]
}

export type GuildRaidExactReadinessView =
  | { status: "absentMeta" }
  | { status: "noBossRecommendation" }
  | ({ status: "missingRoster" } & GuildRaidExactReadinessPopulatedView)
  | ({ status: "populated" } & GuildRaidExactReadinessPopulatedView)

type GuildRaidExactReadinessRoster = ReturnType<
  typeof buildGuildRaidRosterInvestment
>

/**
 * Resolves the active boss's curated lineups into display-ready slot views: each slot's ideal unit,
 * the unit the player would actually field (via `resolveGuildRaidLineup`), and every authored option
 * with its name, portrait, ownership and readiness. Recommendations keep their authored order; nothing
 * here sorts or ranks them. Without a roster the ideal lineups are still shown, with ownership and
 * readiness withheld.
 */
export function buildGuildRaidExactReadinessView(params: {
  bossUnitSetId: string
  meta: GameCatalogGuildRaidMeta | null
  presentation: GuildRaidMetaPresentationResolver
  roster: GuildRaidExactReadinessRoster | undefined
  threshold: GuildRaidInvestmentThreshold | null
}): GuildRaidExactReadinessView {
  const { bossUnitSetId, meta, presentation, roster, threshold } = params

  if (!meta) return { status: "absentMeta" }

  const boss = meta.bosses.find(
    (candidate) => candidate.bossUnitSetId === bossUnitSetId
  )
  if (!boss || boss.recommendations.length === 0) {
    return { status: "noBossRecommendation" }
  }

  const unitView = (
    unit: GuildRaidMetaUnitPresentation,
    kind: "hero" | "mow"
  ): GuildRaidExactReadinessUnitView => {
    if (!roster) return unit
    const owned =
      kind === "hero"
        ? roster.ownedCharacterIds.has(unit.id)
        : roster.ownedMowIds.has(unit.id)
    const investment =
      kind === "hero"
        ? roster.investmentByCharacterId.get(unit.id)
        : roster.investmentByMowId.get(unit.id)
    return { ...unit, owned, ...(investment ? { investment } : {}) }
  }

  const recommendations = boss.recommendations.map(
    (recommendation): GuildRaidExactReadinessRecommendationView => {
      const resolved = presentation.resolveRecommendation(recommendation)
      const base = {
        id: recommendation.id,
        kind: resolved.kind,
        efficiency: recommendation.efficiency,
        comps: resolved.comps,
      }
      const resolveUnit = (unitId: string, kind: "hero" | "mow") =>
        unitView(
          kind === "hero"
            ? presentation.resolveCharacter(unitId)
            : presentation.resolveMow(unitId),
          kind
        )

      if (!roster) {
        return {
          ...base,
          slots: [
            ...resolved.heroSlots.map(
              (slot): GuildRaidExactReadinessSlotView => ({
                kind: "hero",
                role: slot.role,
                essential: slot.slot.essential,
                ideal: slot.hero,
                picked: null,
                isSubstitute: false,
                options: [slot.hero, ...slot.replacements].map(
                  (unit, index) => ({ unit, isIdeal: index === 0 })
                ),
              })
            ),
            {
              kind: "mow",
              essential: false,
              ideal: resolved.mow,
              picked: null,
              isSubstitute: false,
              options: [resolved.mow, ...resolved.mowReplacements].map(
                (unit, index) => ({ unit, isIdeal: index === 0 })
              ),
            },
          ],
        }
      }

      const lineup = resolveGuildRaidLineup({
        recommendation,
        roster,
        threshold,
      })

      return {
        ...base,
        status: lineup.status,
        ...(lineup.teamReadiness === undefined
          ? {}
          : { teamReadiness: lineup.teamReadiness }),
        slots: lineup.slots.map((slot): GuildRaidExactReadinessSlotView => ({
          kind: slot.kind,
          ...(slot.roleId
            ? { role: presentation.resolveRole(slot.roleId) }
            : {}),
          essential: slot.essential,
          ideal: resolveUnit(slot.idealUnitId, slot.kind),
          picked: slot.pickedUnitId
            ? resolveUnit(slot.pickedUnitId, slot.kind)
            : null,
          isSubstitute: slot.isSubstitute,
          ...(slot.readiness === undefined
            ? {}
            : { readiness: slot.readiness }),
          options: slot.options.map((option) => ({
            unit: resolveUnit(option.unitId, slot.kind),
            isIdeal: option.isIdeal,
            state: option.state,
            ...(option.inTeamSlotIndex === undefined
              ? {}
              : { inTeamSlotIndex: option.inTeamSlotIndex }),
            ...(option.readiness === undefined
              ? {}
              : { readiness: option.readiness }),
          })),
        })),
      }
    }
  )

  return {
    status: roster ? "populated" : "missingRoster",
    source: presentation.resolveSource(meta.sourceId),
    updatedOn: meta.updatedOn,
    threshold: roster ? threshold : null,
    recommendations,
  }
}
