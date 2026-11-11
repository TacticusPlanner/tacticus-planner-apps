import { useState } from "react"
import { useTranslation } from "react-i18next"
import { useQueryClient } from "@tanstack/react-query"

import { createCombinedGoals, goalQueries } from "@/entities/goal"
import { projectQueries } from "@/entities/project"
import { useAnalyticsActions } from "@/shared/analytics"
import { useUnitName } from "@/shared/unit-name"

import { goalCreateErrorText } from "../goal-create-error"
import { bulkUnitKey, type BulkUnitPlan } from "./bulk-goal-plan"
import { sendBulkPlans, type BulkUnitStatus } from "./bulk-goal-submit"

/**
 * Creates the plans' goals one unit at a time, keeping each unit's status for the dialog. Retry
 * failed sends only the units whose request failed. Resolves to true when every unit sent was done.
 */
export function useBulkGoalSubmit() {
  const { t } = useTranslation()
  const getUnitName = useUnitName()
  const queryClient = useQueryClient()
  const { captureEvent } = useAnalyticsActions()
  const [statuses, setStatuses] = useState<ReadonlyMap<string, BulkUnitStatus>>(
    () => new Map()
  )
  const [running, setRunning] = useState(false)

  const describeError = (error: unknown) =>
    goalCreateErrorText(t, error, getUnitName)

  const run = async (
    plans: readonly BulkUnitPlan[],
    projectId: string | undefined,
    only?: ReadonlySet<string>
  ) => {
    setRunning(true)
    try {
      const { sent, failed } = await sendBulkPlans({
        plans,
        projectId,
        only,
        send: createCombinedGoals,
        describeError,
        onStatus: (key, status) =>
          setStatuses((previous) => new Map(previous).set(key, status)),
      })
      captureEvent({
        type: "collection_bulk_goals_created",
        unitCount: sent.length,
        goalCount: sent.reduce((sum, plan) => sum + plan.specs.length, 0),
        failedUnitCount: failed,
      })
      return failed === 0
    } finally {
      void queryClient.invalidateQueries({ queryKey: goalQueries.lists() })
      void queryClient.invalidateQueries({
        queryKey: projectQueries.list().queryKey,
      })
      setRunning(false)
    }
  }

  const failedKeys = new Set(
    [...statuses]
      .filter(([, status]) => status.status === "failed")
      .map(([key]) => key)
  )

  return {
    statuses,
    running,
    /** Whether a submit has started (the dialog then shows statuses, not the editor). */
    started: statuses.size > 0,
    failedCount: failedKeys.size,
    submit: (plans: readonly BulkUnitPlan[], projectId: string | undefined) =>
      run(plans, projectId),
    retryFailed: (
      plans: readonly BulkUnitPlan[],
      projectId: string | undefined
    ) =>
      run(
        plans.filter((plan) => failedKeys.has(bulkUnitKey(plan.unit))),
        projectId,
        failedKeys
      ),
    reset: () => setStatuses(new Map()),
  }
}
