import type { TFunction } from "i18next"
import type { ReactNode } from "react"

import { RankBadge } from "@/shared/ui"

import type { GoalProgress } from "../../model/attainment/goal-progress"

function reasonSuffix(
  t: TFunction,
  limitedBy: "rarity" | "level" | "both"
): ReactNode {
  const reasonKey =
    limitedBy === "rarity"
      ? "goals.overview.reachableCeilingReasonRarity"
      : limitedBy === "level"
        ? "goals.overview.reachableCeilingReasonLevel"
        : "goals.overview.reachableCeilingReasonBoth"
  return <span className="opacity-75">({t(reasonKey)})</span>
}

/** "Currently reachable: <rank/level> (capped by rarity/level/both)" content for a Rank/Level goal
 *  currently capped below its target — shared by the progress bar's ceiling marker tooltip
 *  (`goal-progress-visuals.tsx`) and the "Restricted" badge's tooltip (`status-badge.tsx`), which
 *  name the same underlying condition through two different UI surfaces. `null` when the goal isn't
 *  currently restricted, or isn't a Rank/Level goal. */
export function reachableCeilingLabel(
  t: TFunction,
  progress: GoalProgress
): ReactNode | null {
  if (
    progress.kind === "Rank" &&
    progress.reachableRank &&
    progress.reachableRankLimitedBy
  ) {
    return (
      <span className="flex flex-wrap items-center gap-1.5">
        {t("goals.overview.reachableCeilingLabel")}
        <RankBadge rank={progress.reachableRank} />
        {progress.reachableAppliedSlots !== null ? (
          <span>({progress.reachableAppliedSlots}/6)</span>
        ) : null}
        {reasonSuffix(t, progress.reachableRankLimitedBy)}
      </span>
    )
  }
  if (progress.kind === "Level" && progress.reachableLevel !== null) {
    // A Level goal's own ceiling has no separate "level" axis to be limited by (it's the
    // character's level being capped) — rarity is always the reason, unlike Rank's two independent
    // axes above.
    return (
      <span className="flex flex-wrap items-center gap-1.5">
        {t("goals.overview.reachableCeilingLevelLabel", {
          level: progress.reachableLevel,
        })}
        {reasonSuffix(t, "rarity")}
      </span>
    )
  }
  return null
}
