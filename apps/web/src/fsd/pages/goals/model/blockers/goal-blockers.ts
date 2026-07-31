import type { TFunction } from "i18next"

import type { EstimateBlockedReason } from "../estimate/estimate.domain"

// Structured blocker reasons (plan §4) — a goal stays Active/Paused while blocked; blocking is a
// derived, calculated collection of reasons, never a manually-set flag or a `Locked` status (V1's
// approach, explicitly not carried over). `isBlocked` is a summary derived from `reasons`, never the
// other way around.

type BlockerReason =
  /** The isolated/plan estimate for this goal came back `Blocked` — see `EstimateBlockedReason` for
   *  the specific farming-availability cause (no accessible node, daily energy too low, the
   *  selected-locations override excludes every viable node, or the day-by-day simulation couldn't
   *  finish within its horizon). Only present where an estimate was actually computed for this goal
   *  (the project-scoped Insights view, or a goal's own detail sheet) — the flat cross-project
   *  overview has no per-goal estimate to check (see `use-goals-overview-metrics.ts`). */
  | { kind: "EstimateBlocked"; reason: EstimateBlockedReason }
  /** A goal this one `dependsOn` hasn't reached its own target yet. */
  | { kind: "PrerequisiteNotReached"; goalId: string }
  /** The synced player record this goal's kind needs (character/MoW/inventory) hasn't loaded yet. */
  | { kind: "PlayerDataUnavailable" }
  /** The static game catalog (characters, upgrades, costs) this goal needs hasn't loaded yet. */
  | { kind: "CatalogDataUnavailable" }

export type GoalBlockers = {
  reasons: BlockerReason[]
  isBlocked: boolean
}

export function computeGoalBlockers(params: {
  estimateReason: EstimateBlockedReason | undefined
  unreachedPrerequisiteGoalIds: readonly string[]
  playerDataUnavailable: boolean
  catalogDataUnavailable: boolean
}): GoalBlockers {
  const reasons: BlockerReason[] = []

  if (params.catalogDataUnavailable) {
    reasons.push({ kind: "CatalogDataUnavailable" })
  }
  if (params.playerDataUnavailable) {
    reasons.push({ kind: "PlayerDataUnavailable" })
  }
  for (const goalId of params.unreachedPrerequisiteGoalIds) {
    reasons.push({ kind: "PrerequisiteNotReached", goalId })
  }
  if (params.estimateReason) {
    reasons.push({ kind: "EstimateBlocked", reason: params.estimateReason })
  }

  return { reasons, isBlocked: reasons.length > 0 }
}

/** A blocker reason's display text — shared by `BlockedIndicator`'s tooltip (a joined one-liner) and
 * the detail view's full "Blockers" list (plan §5). `t` is passed in rather than called via
 * `useTranslation` here so this stays a plain function (mirrors `project-marker.ts`'s
 * `projectMarkerSuffix` for the same react-refresh only-export-components reason). */
export function blockerReasonText(t: TFunction, reason: BlockerReason): string {
  switch (reason.kind) {
    case "EstimateBlocked":
      return t(`goals.estimate.blocked.${reason.reason}`)
    case "PrerequisiteNotReached":
      return t("goals.blocked.reasons.PrerequisiteNotReached")
    case "PlayerDataUnavailable":
      return t("goals.blocked.reasons.PlayerDataUnavailable")
    case "CatalogDataUnavailable":
      return t("goals.blocked.reasons.CatalogDataUnavailable")
  }
}
