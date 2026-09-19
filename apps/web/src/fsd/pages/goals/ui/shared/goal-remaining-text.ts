import type { TFunction } from "i18next"

import type { ResourceNeed } from "@/features/goal-farming"
import type { GoalProgress } from "../../model/attainment/goal-progress"

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
    (sum, count) => sum + (count ?? 0),
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
  const fmt = (value: number) => new Intl.NumberFormat(language).format(value)

  if (progress.kind === "Level") {
    const count = progress.target - progress.current
    if (count <= 0) return null
    return progress.remainingXp
      ? t("goals.overview.remainingText.levelsWithXp", {
          count: fmt(count),
          xp: fmt(progress.remainingXp),
        })
      : t("goals.overview.remainingText.levels", { count: fmt(count) })
  }
  if (progress.kind === "Rank") {
    const slots = remaining?.upgradeSlotsRemaining
    if (!slots || slots <= 0) return null
    return energy !== undefined
      ? t("goals.overview.remainingText.rankWithEnergy", {
          slots: fmt(slots),
          energy: fmt(energy),
        })
      : t("goals.overview.remainingText.rank", { slots: fmt(slots) })
  }
  if (progress.kind === "Unlock") {
    const shards = remaining?.shards ?? 0
    return shards > 0
      ? t("goals.overview.remainingText.shards", { count: fmt(shards) })
      : null
  }

  return formatGenericRemainingText(t, remaining, energy)
}
