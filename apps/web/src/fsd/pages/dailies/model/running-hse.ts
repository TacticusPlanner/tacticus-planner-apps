import {
  hseRestrictionPasses,
  parseHseConfig,
  resolveHseVariant,
} from "@workspace/game-catalog"
import type {
  GameCatalogHseTracker,
  GameCatalogHseVariant,
} from "@workspace/game-catalog"

import { hseScoresInHreMode } from "@/features/team-recommendations"
import type { HreTeamPlan } from "@/entities/hre-mission"
import { compareCodeUnits, firstDifference } from "@/shared/lib"

/** A stat boost the HSE gives its units, e.g. Faction Boost's +20% in Arena. */
type HseStatBoost = Extract<
  GameCatalogHseVariant["modifiers"][number],
  { kind: "StatBoost" }
>

export type RunningHse = {
  /** The event's localized name, e.g. "Faction Boost: Dark Angels". */
  name: string
  trackers: readonly GameCatalogHseTracker[]
  /** Its stat boosts (Faction Boost: health, damage and armour in some modes). */
  statBoosts: readonly HseStatBoost[]
}

type RunningInstance = {
  status: string
  entry: {
    definitionId: string
    startUtc: string
    parameters?: Record<string, unknown> | null
  }
}

/**
 * Every running personal Home Screen Event with its resolved variant's trackers, the latest start
 * first. A Global event is left out: its points are not the player's own (issue 12: it ran beside
 * Faction Boost: World Eaters in Nov 2026).
 */
export function runningPersonalHses<T extends RunningInstance>(
  instances: readonly T[],
  configOf: (definitionId: string) => unknown,
  nameOf: (instance: T) => string
): RunningHse[] {
  return instances
    .filter((instance) => instance.status === "running")
    .toSorted((a, b) =>
      firstDifference(
        Date.parse(b.entry.startUtc) - Date.parse(a.entry.startUtc),
        compareCodeUnits(a.entry.definitionId, b.entry.definitionId)
      )
    )
    .flatMap((instance) => {
      const config = parseHseConfig(configOf(instance.entry.definitionId))
      const variant = config
        ? resolveHseVariant(config, instance.entry.parameters)
        : null
      if (!variant || variant.scope === "Global") return []
      return [
        {
          name: nameOf(instance),
          trackers: variant.trackers,
          statBoosts: variant.modifiers.filter(
            (modifier): modifier is HseStatBoost =>
              modifier.kind === "StatBoost"
          ),
        },
      ]
    })
}

/** The running personal HSE that scores in an HRE team's mode, or null (none does, or Guild Raid). */
export function runningHseFor(
  hses: readonly RunningHse[],
  mode: HreTeamPlan["mode"]
): RunningHse | null {
  return hses.find((hse) => hseScoresInHreMode(hse.trackers, mode)) ?? null
}

/** The HSE game mode of each HRE token mode that can carry a stat boost. */
const BOOST_MODES: Partial<Record<HreTeamPlan["mode"], string>> = {
  arena: "Arena",
  onslaught: "Onslaught",
  salvageRun: "SalvageRun",
}

/** The HSE's stat boost in an HRE team's mode (Faction Boost: +20% in Arena), or null. */
export function hseStatBoostFor(
  hse: RunningHse,
  mode: HreTeamPlan["mode"]
): { health: number; damage: number; armour: number } | null {
  const hseMode = BOOST_MODES[mode]
  const boost = hseMode
    ? hse.statBoosts.find((item) =>
        hseRestrictionPasses(item.gameModes, hseMode)
      )
    : undefined
  return boost
    ? {
        health: boost.healthPct,
        damage: boost.damagePct,
        armour: boost.armourPct,
      }
    : null
}
