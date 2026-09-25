import { useState } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { useQueryClient } from "@tanstack/react-query"
import { useIsAuthenticated } from "@azure/msal-react"

import {
  goalQueries,
  goalRankTargetKey,
  updateGoalProjects,
  type GoalKind,
} from "@/entities/goal"
import {
  projectQueries,
  useProjects,
  type ProjectSummary,
} from "@/entities/project"
import { ApiError } from "@/shared/api"
import { useUnitName } from "@/shared/unit-name"

import type { GoalRow } from "../shared/types"
import { projectConflictText } from "./project-conflict-copy"
import { projectGoalSlotConflictDetails } from "./project-membership"
import {
  planProjectRemoval,
  type ProjectRemovalPlan,
  type ProjectRemovalUnavailableReason,
} from "./project-removal"

/**
 * The goal row's own project-removal action (`rework-goal-project-move-action`). When the goal has
 * another membership besides the viewed project, `remove()` just leaves it — no destination needed.
 * When the viewed project is the goal's only membership, the row instead offers "Move to project":
 * `otherProjects()` lists the account's other non-archived projects for a picker, and `moveToExisting()`
 * relocates there once the user picks one (or a project they just created). Both `remove()` and
 * `moveToExisting()` share `submit()`, which pre-flights the destination's goal-type slot before the
 * mutation so a collision is explained rather than surfacing as a raw 409 (the 409 handler stays as
 * the backstop for the race between the two).
 */
export function useMoveGoalFromProject() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const isAuthenticated = useIsAuthenticated()
  const getUnitName = useUnitName()
  const { projects, defaultProjectId } = useProjects()
  const defaultProject = projects.find(
    (project) => project.projectId === defaultProjectId
  )
  const [pendingGoalId, setPendingGoalId] = useState<string | null>(null)

  const goalLabel = (goal: GoalRow) =>
    `${getUnitName(goal.entityType, goal.entityId)} · ${t(`goals.create.goalTypes.${goal.goalType}`)}`

  const unavailableMessage = (reason: ProjectRemovalUnavailableReason) =>
    reason === "lastMembershipIsDefault"
      ? t("goals.project.removeLastMembership")
      : t("goals.project.removeDestinationUnknown")

  const conflictMessage = (
    projectName: string,
    goalTypes: GoalKind[],
    rankTargetKey?: string | null
  ) => projectConflictText(t, projectName, goalTypes, rankTargetKey)

  /** What the row renders with: membership as the row carries it, checked against the Default
   *  project — used only to decide the row's affordance (plain Remove vs. Move to project vs.
   *  disabled-while-loading), never to submit a mutation. */
  const planFor = (goal: GoalRow, projectId: string): ProjectRemovalPlan =>
    planProjectRemoval({
      memberships: (goal.projects ?? []).map((project) => project.projectId),
      projectId,
      destination: defaultProject,
      goal,
    })

  /** The account's other non-archived projects besides `projectId`, for the "Move to project" picker.
   *  Current plan is included — nothing about being Current plan makes a project an invalid
   *  destination. */
  const otherProjects = (projectId: string) =>
    projects.filter(
      (project) =>
        project.status !== "Archived" && project.projectId !== projectId
    )

  const submit = async (
    goal: GoalRow,
    project: ProjectSummary,
    destination: ProjectSummary | undefined
  ) => {
    if (!isAuthenticated) return false
    setPendingGoalId(goal.goalId)
    try {
      // `PUT /me/goals/{goalId}/projects` replaces the whole list, so membership is read as it stands
      // now rather than trusted from the rendered row — otherwise a membership added elsewhere since
      // this view loaded would be silently dropped by this removal.
      const detail = await queryClient.fetchQuery(
        goalQueries.detail(goal.goalId)
      )
      const memberships = detail.projectIds
      const relocating = memberships.every((id) => id === project.projectId)
      const destinationGoals =
        relocating && destination && destination.projectId !== project.projectId
          ? (
              await queryClient.fetchQuery(
                projectQueries.goals(destination.projectId)
              )
            ).goals
          : []
      // A Rank goal only collides with an exact same-target Rank goal at the destination, so read the
      // destination's in-flight Rank goals' targets (cached details, fetched when missing).
      const movingKey = goalRankTargetKey(detail)
      const rankKeyByGoalId = new Map<string, string>()
      if (movingKey) {
        const destinationRanks = destinationGoals.filter(
          (entry) =>
            entry.goal.entityType === goal.entityType &&
            entry.goal.entityId === goal.entityId &&
            entry.goal.goalType === "Rank" &&
            entry.goal.goalId !== goal.goalId &&
            (entry.goal.status === "Active" || entry.goal.status === "Paused")
        )
        for (const entry of destinationRanks) {
          const rankDetail = await queryClient.fetchQuery(
            goalQueries.detail(entry.goal.goalId)
          )
          const key = goalRankTargetKey(rankDetail)
          if (key) rankKeyByGoalId.set(entry.goal.goalId, key)
        }
      }
      const plan = planProjectRemoval({
        memberships,
        projectId: project.projectId,
        destination,
        goal,
        destinationGoals,
        rankTargetKey: movingKey,
        rankKeyByGoalId,
      })

      if (plan.kind === "unavailable") {
        toast.error(unavailableMessage(plan.reason))
        return false
      }
      if (plan.kind === "conflict") {
        toast.error(
          conflictMessage(
            plan.destination.name,
            plan.conflict.goalTypes,
            plan.conflict.rankTargetKey
          )
        )
        return false
      }

      await updateGoalProjects(goal.goalId, plan.projectIds)
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: goalQueries.all() }),
        queryClient.invalidateQueries({ queryKey: projectQueries.all() }),
      ])
      toast.success(
        plan.kind === "relocate"
          ? t("goals.toasts.goalRelocated", {
              goal: goalLabel(goal),
              project: plan.destination.name,
            })
          : t("goals.toasts.goalRemovedFromProject", {
              goal: goalLabel(goal),
              project: project.name,
            })
      )
      return true
    } catch (error) {
      const conflict =
        error instanceof ApiError
          ? projectGoalSlotConflictDetails(error.details)
          : null
      toast.error(
        conflict
          ? conflictMessage(
              conflict.projectName,
              [conflict.goalType as GoalKind],
              conflict.normalizedTarget
            )
          : error instanceof ApiError
            ? error.message
            : t("goals.toasts.actionError")
      )
      return false
    } finally {
      setPendingGoalId(null)
    }
  }

  /** Plain removal from the viewed project — no destination needed. If a race turns out to have made
   *  this the goal's last membership after all (its other memberships were removed elsewhere since
   *  this view loaded), falls back to the Default project, same as the membership editor does. */
  const remove = (goal: GoalRow, project: ProjectSummary) =>
    submit(goal, project, defaultProject)

  /** Relocates the goal (whose viewed project is its only membership) to a user-chosen destination —
   *  an existing project, or one just created via the "Create new project…" flow. */
  const moveToExisting = (
    goal: GoalRow,
    project: ProjectSummary,
    destination: ProjectSummary
  ) => submit(goal, project, destination)

  return {
    planFor,
    otherProjects,
    remove,
    moveToExisting,
    pendingGoalId,
  }
}
