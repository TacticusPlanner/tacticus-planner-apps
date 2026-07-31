import type { GoalBlockers } from "../blockers/goal-blockers"
import type { GoalProgress } from "./goal-progress"

/** Shared "nothing computed yet" fallbacks for `GoalOverviewMetrics` — split into their own
 * dependency-free module so UI components can reuse them without pulling in
 * `use-goals-overview-metrics.ts`'s full data-fetching hook (TanStack Query, Dexie, `entities/goal`)
 * just for two constants. */
export const UNKNOWN_PROGRESS: GoalProgress = { kind: "Unknown" }
export const NO_BLOCKERS: GoalBlockers = { reasons: [], isBlocked: false }
