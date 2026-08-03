import { useEffect, useState } from "react"
import { useQueries } from "@tanstack/react-query"
import { useIsAuthenticated } from "@azure/msal-react"
import { unitIdSchema, type UnitId } from "@workspace/game-domain"
import {
  getInventoryShard,
  getPlayerCharacter,
  getPlayerMow,
} from "@workspace/player-data/queries"

import { goalQueries, type GoalDetail } from "@/entities/goal"
import { projectQueries } from "@/entities/project"

import { estimateNewGoalsForProject } from ".//per-project-estimate"
import type { EstimateOutcome } from "@/features/goal-farming"
import { useGoalCatalog } from "../shared/use-goal-catalog"

// Mirrors use-plan-insights.ts's own ACTIVE_STATUSES — only these statuses represent resources a
// project's queue still needs to acquire, so only they compete for shared inventory/energy with the
// goal(s) about to be created.
const ACTIVE_STATUSES = new Set(["Draft", "Active", "Paused"])

export type PerProjectEstimate =
  | { status: "loading" }
  | { status: "unavailable" }
  | { status: "outcome"; outcome: EstimateOutcome }

/**
 * Per selected project, the estimated duration for the goal(s) about to be created (plan: per-project
 * duration in "What will be created", replacing the single combined estimate removed from
 * "Resources needed"). For each project, folds `newDetails` in alongside that project's real active
 * member goals — at the user's typed priority when given, else appended after that project's current
 * max priority (same fallback `GetNextPriorityAsync` uses server-side) — and reuses the exact
 * priority-shared engine the Insights view runs (`estimateNewGoalsForProject`/`computePlanInsights`).
 * Batch-fetches each selected project's members, their full goal details (shared react-query cache
 * with the Insights view's own per-project fetch), and per-entity player/inventory data — the same
 * three-stage shape `use-plan-insights.ts` uses, just fanned out over several projects instead of one.
 */
export function usePerProjectEstimates({
  selectedProjectIds,
  projectPriorities,
  newDetails,
  dailyEnergy,
  inventoryUpgrades,
  enabled,
}: {
  selectedProjectIds: string[]
  /** Raw (possibly blank) priority input text per projectId — parsed here, with blank/invalid
   * falling back to "append after this project's current goals". */
  projectPriorities: Record<string, string>
  newDetails: GoalDetail[]
  dailyEnergy: number
  inventoryUpgrades: readonly { upgradeId: string; amount: number }[]
  enabled: boolean
}): ReadonlyMap<string, PerProjectEstimate> {
  const isAuthenticated = useIsAuthenticated()
  const {
    charactersById,
    mowsById,
    upgradesById,
    battlesById,
    ascensionCostsById,
    unlockShardCostsById,
    releaseTypeByGroupId,
    getCharacter,
  } = useGoalCatalog()

  const hasQuery = enabled && isAuthenticated && selectedProjectIds.length > 0

  const projectGoalsQueries = useQueries({
    queries: hasQuery
      ? selectedProjectIds.map((projectId) => projectQueries.goals(projectId))
      : [],
  })

  const activeMembersByProject = new Map<
    string,
    { goalId: string; priority: number }[]
  >()
  selectedProjectIds.forEach((projectId, index) => {
    const members = projectGoalsQueries[index]?.data?.goals ?? []
    activeMembersByProject.set(
      projectId,
      members
        .filter((member) => ACTIVE_STATUSES.has(member.goal.status))
        .map((member) => ({
          goalId: member.goal.goalId,
          priority: member.priority,
        }))
    )
  })
  const memberGoalIds = [
    ...new Set(
      [...activeMembersByProject.values()].flatMap((members) =>
        members.map((member) => member.goalId)
      )
    ),
  ]

  const projectGoalsReady =
    !hasQuery || projectGoalsQueries.every((query) => query.isSuccess)

  const goalDetailQueries = useQueries({
    queries: projectGoalsReady
      ? memberGoalIds.map((goalId) => goalQueries.detail(goalId))
      : [],
  })
  const detailsReady =
    goalDetailQueries.length === memberGoalIds.length &&
    goalDetailQueries.every((query) => query.isSuccess)

  const catalogReady =
    !!charactersById &&
    !!mowsById &&
    !!ascensionCostsById &&
    !!unlockShardCostsById

  const memberKey = [...activeMembersByProject.entries()]
    .map(
      ([projectId, members]) =>
        `${projectId}:${members.map((m) => `${m.goalId}:${m.priority}`).join(",")}`
    )
    .join("|")
  // Includes each preview goal's full `config` (not just its id/type) — a preview goal's id/type
  // stay fixed across renders for the same entity + enabled goal kinds (see buildPreviewGoalDetails),
  // so without the config's content here, changing e.g. the selected shard-farming locations or a
  // rank/progression target wouldn't invalidate the cached estimate below.
  const newDetailsKey = newDetails
    .map(
      (detail) =>
        `${detail.goalId}:${detail.goalType}:${JSON.stringify(detail.config)}`
    )
    .join(",")
  const prioritiesKey = selectedProjectIds
    .map((projectId) => `${projectId}:${projectPriorities[projectId] ?? ""}`)
    .join(",")
  const currentKey = `${memberKey}|${newDetailsKey}|${prioritiesKey}`

  const [state, setState] = useState<{
    key: string
    results: ReadonlyMap<string, PerProjectEstimate>
  }>({ key: "", results: new Map() })

  useEffect(() => {
    if (
      !hasQuery ||
      !projectGoalsReady ||
      !detailsReady ||
      !catalogReady ||
      newDetails.length === 0
    ) {
      // Nothing to estimate (no costed goal about to be created, or prerequisites not ready yet) —
      // the render-time fallback below already reads this as "nothing to show" without needing a
      // state update from here.
      return undefined
    }

    let active = true
    const existingDetails = goalDetailQueries.flatMap((query) =>
      query.data ? [query.data] : []
    )
    const entityIds = [
      ...new Set(
        [...existingDetails, ...newDetails].map((detail) => detail.entityId)
      ),
    ]

    // Promise.resolve(...) wraps each call rather than chaining .then() directly onto it — Dexie's
    // real queries always return a promise, but this stays defensive against a test double that
    // hands back a bare value synchronously (mirrors how the dexie-react-hooks useLiveQuery mock
    // elsewhere in this codebase tolerates both shapes).
    void Promise.all([
      Promise.all(
        entityIds.map((id) =>
          Promise.resolve(
            getPlayerCharacter(unitIdSchema.parse(id) as UnitId)
          ).then((data) => [id, data] as const)
        )
      ),
      Promise.all(
        entityIds.map((id) =>
          Promise.resolve(getPlayerMow(unitIdSchema.parse(id) as UnitId)).then(
            (data) => [id, data] as const
          )
        )
      ),
      Promise.all(
        entityIds.map((id) =>
          Promise.resolve(
            getInventoryShard(unitIdSchema.parse(id) as UnitId)
          ).then((data) => [id, data] as const)
        )
      ),
    ])
      .then(([characterEntries, mowEntries, shardEntries]) => {
        if (!active) return

        const playerCharacterById = new Map(characterEntries)
        const playerMowById = new Map(mowEntries)
        const inventoryShardById = new Map(shardEntries)

        const results = new Map<string, PerProjectEstimate>()
        for (const projectId of selectedProjectIds) {
          const members = activeMembersByProject.get(projectId) ?? []
          const projectDetails = existingDetails.filter((detail) =>
            members.some((member) => member.goalId === detail.goalId)
          )
          const existingPriorities = new Map(
            members.map((member) => [member.goalId, member.priority])
          )
          const maxExistingPriority = members.reduce(
            (max, member) => Math.max(max, member.priority),
            0
          )
          const rawPriority = Number.parseInt(
            projectPriorities[projectId] ?? "",
            10
          )
          const newBasePriority =
            Number.isFinite(rawPriority) && rawPriority > 0
              ? rawPriority
              : maxExistingPriority + 1

          const outcome = estimateNewGoalsForProject({
            existingDetails: projectDetails,
            existingPriorities,
            newDetails,
            newBasePriority,
            playerCharacterById,
            playerMowById,
            inventoryShardById,
            inventoryUpgrades,
            upgradesById,
            battlesById,
            charactersById: charactersById!,
            mowsById: mowsById!,
            ascensionCostsById: ascensionCostsById!,
            unlockShardCostsById: unlockShardCostsById!,
            releaseTypeByGroupId,
            getCharacter,
            dailyEnergy,
          })

          results.set(
            projectId,
            outcome ? { status: "outcome", outcome } : { status: "unavailable" }
          )
        }

        setState({ key: currentKey, results })
      })
      .catch(() => {
        if (!active) return
        setState({ key: currentKey, results: new Map() })
      })

    return () => {
      active = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    hasQuery,
    projectGoalsReady,
    detailsReady,
    catalogReady,
    memberKey,
    newDetailsKey,
    prioritiesKey,
    dailyEnergy,
  ])

  if (!hasQuery || newDetails.length === 0) return new Map()

  if (state.key !== currentKey) {
    return new Map(
      selectedProjectIds.map((projectId) => [projectId, { status: "loading" }])
    )
  }
  return state.results
}
