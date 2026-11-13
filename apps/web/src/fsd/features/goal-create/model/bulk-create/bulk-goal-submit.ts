import type { CreateCombinedGoalsRequest } from "@/entities/goal"

import { bulkUnitKey, type BulkUnitPlan } from "./bulk-goal-plan"

export type BulkUnitStatus =
  | { status: "pending" }
  | { status: "done" }
  | { status: "failed"; error: string }

/** The create request for one unit's plan: appended to the order, in `projectIds` (none: Default). */
export function bulkCreateRequest(
  plan: BulkUnitPlan,
  projectIds: readonly string[]
): CreateCombinedGoalsRequest {
  return {
    entityType: plan.unit.kind === "character" ? "Character" : "Mow",
    entityId: plan.unit.unitId,
    projects:
      projectIds.length > 0
        ? projectIds.map((projectId) => ({ projectId }))
        : null,
    goals: plan.specs,
  }
}

/**
 * Sends each plan with goals, one at a time in order, reporting each unit's status as it goes. A
 * failure is recorded (`describeError`) and the next unit still goes. With `only`, units outside it
 * are left alone (Retry failed). Resolves to the number of units that failed.
 */
export async function sendBulkPlans({
  plans,
  projectIds,
  only,
  send,
  describeError,
  onStatus,
}: {
  plans: readonly BulkUnitPlan[]
  projectIds: readonly string[]
  only?: ReadonlySet<string>
  send: (request: CreateCombinedGoalsRequest) => Promise<unknown>
  describeError: (error: unknown) => string
  onStatus: (key: string, status: BulkUnitStatus) => void
}): Promise<{ sent: BulkUnitPlan[]; failed: number }> {
  const sent = plans.filter(
    (plan) =>
      plan.specs.length > 0 && (!only || only.has(bulkUnitKey(plan.unit)))
  )
  for (const plan of sent)
    onStatus(bulkUnitKey(plan.unit), { status: "pending" })
  let failed = 0
  for (const plan of sent) {
    const key = bulkUnitKey(plan.unit)
    try {
      await send(bulkCreateRequest(plan, projectIds))
      onStatus(key, { status: "done" })
    } catch (error) {
      failed += 1
      onStatus(key, { status: "failed", error: describeError(error) })
    }
  }
  return { sent, failed }
}
