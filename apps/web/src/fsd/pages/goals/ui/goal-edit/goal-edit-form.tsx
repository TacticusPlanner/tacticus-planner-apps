import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { useQuery } from "@tanstack/react-query"
import { useIsAuthenticated } from "@azure/msal-react"
import { Button } from "@workspace/ui/components/button"
import { Spinner } from "@workspace/ui/components/spinner"

import {
  goalRankTargetKey,
  useGlobalGoalPlan,
  type GoalDetail,
} from "@/entities/goal"
import { usePlanningSettings } from "@/entities/planning-setting"
import { projectQueries } from "@/entities/project"
import { ResponsiveDialogBody, ResponsiveDialogFooter } from "@/shared/ui"

import {
  baselineGoalEditDraft,
  buildEditGoalRequest,
  goalEditChanges,
  isGoalEditDirty,
  type GoalEditDraft,
} from "../../model/goal-edit/goal-edit-draft"
import { useGoalEditAcquisition } from "../../model/goal-edit/use-goal-edit-acquisition"
import { useGoalEditSave } from "../../model/goal-edit/use-goal-edit-save"
import { useGoalLocationGroups } from "../../model/farming/use-goal-location-groups"
import { useProjectGoalConflicts } from "../../model/projects/use-project-goal-conflicts"
import { useGoalCatalog } from "../../model/shared/use-goal-catalog"
import { getGoalTargetIssue } from "../../model/target-edit/goal-target-edit"
import { GoalProjectsField } from "../projects/goal-projects-field"
import { GoalEditError } from "./goal-edit-error"
import { GoalEditFarmingFields, GoalEditNotesField } from "./goal-edit-fields"
import { GoalEditPriorityField } from "./goal-edit-priority-field"
import { GoalEditTarget } from "./goal-edit-target"

/**
 * The Edit goal form (body + footer): one `GoalEditDraft` for every editable field and one Save that
 * submits only the changed sections in a single request. `edits` holds just what the owner touched, laid
 * over the goal as loaded, so untouched fields follow the goal and a "refresh and retry" after a stale
 * revision keeps the owner's edits. Mounted only once the goal (and, for source pickers, the catalog)
 * has loaded, so the acquisition picker seeds from the saved goal.
 */
export function GoalEditForm({
  detail,
  portalContainer,
  onDirtyChange,
  onRequestClose,
  onSaved,
}: {
  detail: GoalDetail
  portalContainer: HTMLElement | null
  onDirtyChange: (dirty: boolean) => void
  onRequestClose: () => void
  onSaved: () => void
}) {
  const { t } = useTranslation()
  const isAuthenticated = useIsAuthenticated()
  const catalog = useGoalCatalog()
  const { settings: planningSettings } = usePlanningSettings()
  const plan = useGlobalGoalPlan()
  const projectsQuery = useQuery({
    ...projectQueries.list(),
    enabled: isAuthenticated,
  })
  const projects = projectsQuery.data?.projects ?? []
  const acquisition = useGoalEditAcquisition({
    detail,
    charactersById: catalog.charactersById,
    unlockShardCostsById: catalog.unlockShardCostsById,
    battlesById: catalog.battlesById,
    dailyEnergy: planningSettings.dailyEnergy,
  })
  const saver = useGoalEditSave({ goalId: detail.goalId, onSaved })

  const inFlightIds = plan.inFlight.map((goal) => goal.goalId)
  const currentPosition = inFlightIds.indexOf(detail.goalId) + 1
  const total = inFlightIds.length
  // No select until the order has loaded, and none for a goal that holds no global position.
  const position = !plan.loading && currentPosition > 0 ? currentPosition : null

  const baseline = baselineGoalEditDraft(detail, {
    acquisitionSources: acquisition.baselineSources,
    priorityPosition: position,
  })
  const [edits, setEdits] = useState<Partial<GoalEditDraft>>({})
  const draft: GoalEditDraft = {
    ...baseline,
    ...edits,
    acquisitionSources: acquisition.sources,
  }
  const edit = (patch: Partial<GoalEditDraft>) =>
    setEdits((current) => ({ ...current, ...patch }))

  const membershipConflicts = useProjectGoalConflicts({
    projects,
    selectedProjectIds: draft.projectIds,
    entityType: detail.entityType,
    entityId: detail.entityId,
    goalTypes: [detail.goalType],
    excludeGoalId: detail.goalId,
    // A Rank goal only conflicts with an exact same-target Rank goal in a selected project.
    rankTargetKey: goalRankTargetKey(detail),
    enabled: true,
  })
  const projectsValid =
    draft.projectIds.length > 0 &&
    !membershipConflicts.loading &&
    membershipConflicts.conflicts.length === 0
  const { allLocations, overrideValid } = useGoalLocationGroups(
    detail,
    catalog.upgradesById,
    catalog.charactersById,
    draft.farmingLocationIds
  )
  const targetIssue = draft.target
    ? getGoalTargetIssue(detail, draft.target)
    : null

  const changes = goalEditChanges(baseline, draft)
  const dirty = isGoalEditDirty(changes)
  useEffect(() => onDirtyChange(dirty), [dirty, onDirtyChange])
  const canSave =
    dirty &&
    !saver.isSaving &&
    targetIssue === null &&
    overrideValid &&
    projectsValid

  const save = () =>
    void saver.save(
      buildEditGoalRequest(detail, draft, changes, plan.orderRevision)
    )
  const reloadOrder = () => {
    if (saver.error?.kind !== "order") return
    const { order } = saver.error
    saver.reloadOrder(order)
    // The reloaded list may be shorter than the position the owner picked.
    if (edits.priorityPosition != null) {
      edit({
        priorityPosition: Math.min(
          edits.priorityPosition,
          order.goalIds.length
        ),
      })
    }
  }

  return (
    <>
      <ResponsiveDialogBody>
        <div
          className="grid content-start gap-6 pb-6 text-sm @2xl:grid-cols-2"
          data-testid="goal-edit-form"
        >
          {draft.target ? (
            <div className="col-span-full">
              <GoalEditTarget
                detail={detail}
                draft={draft.target}
                onChange={(target) => edit({ target })}
                portalContainer={portalContainer}
                upgradesById={catalog.upgradesById}
              />
            </div>
          ) : null}

          {draft.priorityPosition !== null ? (
            <GoalEditPriorityField
              onChange={(priorityPosition) => edit({ priorityPosition })}
              portalContainer={portalContainer}
              position={draft.priorityPosition}
              total={total}
            />
          ) : null}

          <GoalEditNotesField
            notes={draft.notes}
            onChange={(notes) => edit({ notes })}
          />

          <GoalProjectsField
            conflicts={membershipConflicts.conflicts}
            onSelectionChange={(projectIds) => edit({ projectIds })}
            portalContainer={portalContainer}
            projects={projects}
            projectsValid={projectsValid}
            selectedProjectIds={draft.projectIds}
            testIdPrefix="goal-edit"
          />

          <GoalEditFarmingFields
            acquisition={acquisition}
            allLocations={allLocations}
            battlesById={catalog.battlesById}
            detail={detail}
            farmingStrategy={draft.farmingStrategy}
            onFarmingStrategyChange={(farmingStrategy) =>
              edit({ farmingStrategy })
            }
            onLocationsChange={(farmingLocationIds) =>
              edit({ farmingLocationIds })
            }
            overrideValid={overrideValid}
            selectedLocations={draft.farmingLocationIds}
          />
        </div>
      </ResponsiveDialogBody>

      <ResponsiveDialogFooter>
        {saver.error ? (
          <div className="md:mr-auto">
            <GoalEditError
              error={saver.error}
              onRefreshGoal={() => {
                if (saver.error?.kind === "stale") {
                  saver.refreshGoal(saver.error.current)
                }
              }}
              onReloadOrder={reloadOrder}
            />
          </div>
        ) : null}
        <Button data-testid="goal-edit-save" disabled={!canSave} onClick={save}>
          {saver.isSaving ? <Spinner /> : null}
          {t("goals.edit.save")}
        </Button>
        <Button
          data-testid="goal-edit-cancel"
          onClick={onRequestClose}
          variant="outline"
        >
          {t("goals.edit.cancel")}
        </Button>
      </ResponsiveDialogFooter>
    </>
  )
}
