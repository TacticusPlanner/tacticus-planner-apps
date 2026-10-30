import type { GameCatalogGuildRaidMetaRecommendation } from "@workspace/game-catalog"

import { matchGuildRaidCandidates } from "./match-guild-raid-candidates"
import {
  resolveGuildRaidHeroReadiness,
  resolveGuildRaidMowReadiness,
  type GuildRaidInvestmentFacts,
} from "./resolve-guild-raid-investment-readiness"
import type { GuildRaidInvestmentThreshold } from "./resolve-guild-raid-investment-threshold"
import { resolveGuildRaidTeamReadiness } from "./resolve-guild-raid-team-readiness"

export type GuildRaidReadinessRoster = {
  ownedCharacterIds: ReadonlySet<string>
  ownedMowIds: ReadonlySet<string>
  investmentByCharacterId: ReadonlyMap<string, GuildRaidInvestmentFacts>
  investmentByMowId: ReadonlyMap<string, GuildRaidInvestmentFacts>
}

/**
 * Why an option is or isn't the slot's pick: `picked` fills this slot, `inTeam` is owned but already
 * fills another slot of the same lineup, `available` is owned and free but lost to a better pick, and
 * `notOwned` is not on the roster.
 */
export type GuildRaidLineupOptionState =
  "picked" | "inTeam" | "available" | "notOwned"

type GuildRaidLineupOption = {
  unitId: string
  isIdeal: boolean
  owned: boolean
  state: GuildRaidLineupOptionState
  /** Index into the lineup's `slots` of the slot this unit fills instead, when `state` is `inTeam`. */
  inTeamSlotIndex?: number
  /** `undefined` when no investment threshold is available. */
  readiness?: number
}

type GuildRaidLineupSlot = {
  kind: "hero" | "mow"
  /** The curated ideal unit for this slot. */
  idealUnitId: string
  /** `undefined` for the Machine of War, which carries no authored role. */
  roleId?: string
  essential: boolean
  /** The unit that fills this slot from the roster: the ideal when owned, else the best owned
   * substitute, else `null`. */
  pickedUnitId: string | null
  isSubstitute: boolean
  /** The picked unit's readiness, `0` when the slot is empty; `undefined` without a threshold. */
  readiness?: number
  /** The ideal unit first, then every authored substitute in authored order. */
  options: GuildRaidLineupOption[]
}

/**
 * One team status for the lineup, from the substitutes actually picked: `ready` when every slot holds
 * its ideal unit, `missingEssentials` when an essential hero slot has no owned option at all, and
 * `substitutes` for everything in between.
 */
export type GuildRaidLineupStatus =
  "ready" | "substitutes" | "missingEssentials"

export type GuildRaidLineup = {
  recommendation: GameCatalogGuildRaidMetaRecommendation
  status: GuildRaidLineupStatus
  /** `undefined` when no investment threshold is available. */
  teamReadiness?: number
  /** The five hero slots in authored order, then the Machine of War. */
  slots: GuildRaidLineupSlot[]
}

function optionsFor(params: {
  ideal: string
  substitutes: readonly string[]
  owned: ReadonlySet<string>
  pickedUnitId: string | null
  slotIndexByPickedId: ReadonlyMap<string, number>
  readinessOf?: (unitId: string) => number
}): GuildRaidLineupOption[] {
  const {
    ideal,
    substitutes,
    owned,
    pickedUnitId,
    slotIndexByPickedId,
    readinessOf,
  } = params
  const seen = new Set<string>()
  const options: GuildRaidLineupOption[] = []

  for (const unitId of [ideal, ...substitutes]) {
    if (seen.has(unitId)) continue
    seen.add(unitId)

    const isOwned = owned.has(unitId)
    const inTeamSlotIndex = slotIndexByPickedId.get(unitId)
    let state: GuildRaidLineupOptionState = "available"
    if (!isOwned) state = "notOwned"
    else if (unitId === pickedUnitId) state = "picked"
    else if (inTeamSlotIndex !== undefined) state = "inTeam"

    options.push({
      unitId,
      isIdeal: unitId === ideal,
      owned: isOwned,
      state,
      ...(state === "inTeam" ? { inTeamSlotIndex } : {}),
      ...(readinessOf ? { readiness: readinessOf(unitId) } : {}),
    })
  }

  return options
}

/**
 * Fills one curated lineup from the player's roster and scores it. Hero slots go through the
 * constrained matcher (an owned ideal is locked; other slots draw on their own authored substitutes,
 * never a unit already used elsewhere). The Machine of War takes its ideal when owned, else its
 * highest-readiness owned authored substitute.
 *
 * Without a `threshold` the picks and status are still resolved, from ownership alone (ties broken in
 * authored order), but no percentage is reported, so a missing live guild status never shows a
 * fabricated number.
 */
export function resolveGuildRaidLineup(params: {
  recommendation: GameCatalogGuildRaidMetaRecommendation
  roster: GuildRaidReadinessRoster
  threshold: GuildRaidInvestmentThreshold | null
}): GuildRaidLineup {
  const { recommendation, roster, threshold } = params
  const heroSlots = recommendation.heroSlots ?? []
  const mowSubstitutes = recommendation.mowReplacementIds ?? []

  const characterReadiness = threshold
    ? (characterId: string) =>
        resolveGuildRaidHeroReadiness({
          owned: roster.ownedCharacterIds.has(characterId),
          investment: roster.investmentByCharacterId.get(characterId),
          threshold,
        })
    : undefined
  const mowReadiness = threshold
    ? (mowId: string) =>
        resolveGuildRaidMowReadiness({
          owned: roster.ownedMowIds.has(mowId),
          progression: roster.investmentByMowId.get(mowId)?.progression,
          threshold,
        })
    : undefined

  const { assignments } = matchGuildRaidCandidates({
    slots: heroSlots,
    ownedCharacterIds: roster.ownedCharacterIds,
    readinessOf: characterReadiness ?? (() => 0),
  })

  const slotIndexByPickedHeroId = new Map<string, number>()
  assignments.forEach((assignment, index) => {
    if (assignment) slotIndexByPickedHeroId.set(assignment.characterId, index)
  })

  const heroLineupSlots = heroSlots.map((slot, index): GuildRaidLineupSlot => {
    const assignment = assignments[index] ?? null
    const pickedUnitId = assignment?.characterId ?? null
    return {
      kind: "hero",
      idealUnitId: slot.heroId,
      roleId: slot.roleId,
      essential: slot.essential,
      pickedUnitId,
      isSubstitute: assignment !== null && !assignment.isIdeal,
      ...(characterReadiness
        ? {
            readiness: pickedUnitId ? characterReadiness(pickedUnitId) : 0,
          }
        : {}),
      options: optionsFor({
        ideal: slot.heroId,
        substitutes: slot.replacementCharacterIds,
        owned: roster.ownedCharacterIds,
        pickedUnitId,
        slotIndexByPickedId: slotIndexByPickedHeroId,
        readinessOf: characterReadiness,
      }),
    }
  })

  const ownedMowSubstitutes = mowSubstitutes.filter((mowId) =>
    roster.ownedMowIds.has(mowId)
  )
  let pickedMowId: string | null = roster.ownedMowIds.has(recommendation.mowId)
    ? recommendation.mowId
    : null
  if (!pickedMowId) {
    for (const mowId of ownedMowSubstitutes) {
      if (
        pickedMowId === null ||
        (mowReadiness && mowReadiness(mowId) > mowReadiness(pickedMowId))
      ) {
        pickedMowId = mowId
      }
    }
  }

  const mowSlotIndex = heroLineupSlots.length
  const mowLineupSlot: GuildRaidLineupSlot = {
    kind: "mow",
    idealUnitId: recommendation.mowId,
    essential: false,
    pickedUnitId: pickedMowId,
    isSubstitute: pickedMowId !== null && pickedMowId !== recommendation.mowId,
    ...(mowReadiness
      ? { readiness: pickedMowId ? mowReadiness(pickedMowId) : 0 }
      : {}),
    options: optionsFor({
      ideal: recommendation.mowId,
      substitutes: mowSubstitutes,
      owned: roster.ownedMowIds,
      pickedUnitId: pickedMowId,
      slotIndexByPickedId: new Map(
        pickedMowId ? [[pickedMowId, mowSlotIndex]] : []
      ),
      readinessOf: mowReadiness,
    }),
  }

  const slots = [...heroLineupSlots, mowLineupSlot]

  let status: GuildRaidLineupStatus = "substitutes"
  if (
    heroLineupSlots.some((slot) => slot.essential && slot.pickedUnitId === null)
  ) {
    status = "missingEssentials"
  } else if (
    slots.every((slot) => slot.pickedUnitId !== null && !slot.isSubstitute)
  ) {
    status = "ready"
  }

  return {
    recommendation,
    status,
    ...(threshold
      ? {
          teamReadiness: resolveGuildRaidTeamReadiness(
            heroLineupSlots.map((slot) => ({
              readiness: slot.readiness ?? 0,
              essential: slot.essential,
            })),
            mowLineupSlot.readiness ?? 0
          ),
        }
      : {}),
    slots,
  }
}
