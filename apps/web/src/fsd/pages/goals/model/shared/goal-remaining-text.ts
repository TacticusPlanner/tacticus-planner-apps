import type { TFunction } from "i18next"

import type { ResourceNeed } from "@/entities/goal-farming"
import type { GoalProgress } from "@/features/goal-planning"
import { numberFormat } from "@/shared/lib"

/** The generic material/shard/orb/energy breakdown `formatGoalRemainingText` falls back to for a
 *  goal kind with no dedicated formatter (Ascension, Ability, Upgrade) — unchanged from the
 *  pre-redesign `GoalRemainingSummary`/`GoalEnergyRemainingSummary` output, just joined into one
 *  line instead of two. */
export function formatGenericRemainingText(
  t: TFunction,
  remaining: ResourceNeed | null,
  energy: number | undefined
): string | null {
  if (!remaining)
    return energy !== undefined ? formatEnergyOnly(t, energy) : null

  const upgradeCount = remaining.upgrades.reduce(
    (sum, need) => sum + need.count,
    0
  )
  const orbCount = Object.values(remaining.orbsByType).reduce(
    (sum, count) => sum + count,
    0
  )
  const parts = [
    remaining.upgradeSlotsRemaining !== null
      ? remaining.upgradeSlotsRemaining > 0
        ? t("goals.overview.remaining.upgradeSlots", {
            count: remaining.upgradeSlotsRemaining,
          })
        : null
      : upgradeCount > 0
        ? t("goals.overview.remaining.upgrades", { count: upgradeCount })
        : null,
    remaining.shards > 0
      ? t("goals.overview.remaining.shards", { count: remaining.shards })
      : null,
    remaining.mythicShards > 0
      ? t("goals.overview.remaining.mythicShards", {
          count: remaining.mythicShards,
        })
      : null,
    orbCount > 0
      ? t("goals.overview.remaining.orbs", { count: orbCount })
      : null,
    energy !== undefined
      ? t("goals.overview.remaining.energy", { energy })
      : null,
  ].filter((part): part is string => part !== null)

  return parts.length > 0 ? parts.join(" · ") : null
}

function formatEnergyOnly(t: TFunction, energy: number): string {
  return t("goals.overview.remaining.energy", { energy })
}

/** Per-goal-kind "how much is left" text (fix-goal-progress-consistency's `GoalRemainingSummary`/
 *  `GoalEnergyRemainingSummary` replaced by one line per kind) — shared by the desktop Remaining
 *  column, the always-reachable tooltip on `GoalProgressDisplay`'s percent readout, and the mobile
 *  card footer line. Falls back to the generic material/orb/energy breakdown for a kind with no
 *  dedicated formatter (Ascension, Ability, Upgrade), preserving their pre-redesign display. */
export function formatGoalRemainingText(
  t: TFunction,
  language: string | undefined,
  progress: GoalProgress,
  remaining: ResourceNeed | null,
  energy: number | undefined
): string | null {
  const fmt = (value: number) => numberFormat(language).format(value)

  if (progress.kind === "LevelRequirement") {
    const count = progress.target - progress.current
    if (count <= 0) return null
    return t("goals.overview.remainingText.levels", { count: fmt(count) })
  }
  if (progress.kind === "Rank") {
    if (remaining?.coveredByEarlierGoal)
      return t("goals.overview.remainingText.coveredByEarlierGoal")
    // No upgrade-slot count: the slots are not a resource, energy is the readable cost.
    return energy !== undefined && energy > 0
      ? t("goals.overview.remainingText.rankEnergy", { energy: fmt(energy) })
      : null
  }
  if (progress.kind === "Unlock") {
    const shards = remaining?.shards ?? 0
    return shards > 0
      ? t("goals.overview.remainingText.shards", { count: fmt(shards) })
      : null
  }

  return formatGenericRemainingText(t, remaining, energy)
}

/** The percent readout's tooltip on `GoalProgressDisplay`: the goal's remaining text plus the per-goal
 *  figures the Actual/Potential explanation used to carry in each row's own "i" popover, now that the
 *  explanation is one shared key per list. A Rank goal leads with its upgrade slots left on the
 *  current rank; a level requirement ends with its XP still to earn. */
export function formatProgressTooltipText(
  t: TFunction,
  language: string | undefined,
  progress: GoalProgress,
  remaining: ResourceNeed | null,
  energy: number | undefined
): string | null {
  const fmt = (value: number) => numberFormat(language).format(value)
  const base = formatGoalRemainingText(t, language, progress, remaining, energy)
  const slots = remaining?.coveredByEarlierGoal
    ? 0
    : (remaining?.upgradeSlotsRemaining ?? 0)
  const parts = [
    progress.kind === "Rank" && slots > 0
      ? t("goals.overview.remainingText.upgradeSlots", { count: slots })
      : null,
    base,
    progress.kind === "LevelRequirement" && progress.remainingXp > 0
      ? t("goals.overview.remainingText.xp", { xp: fmt(progress.remainingXp) })
      : null,
  ].filter((part): part is string => part !== null)
  return parts.length > 0 ? parts.join(" · ") : null
}
