import { useMemo } from "react"

import { useProjectDeadline, useProjectDeadlines } from "@/entities/project"
import type {
  ProjectDeadline,
  ProjectSummary,
  ProjectTarget,
} from "@/entities/project"
import type { EstimateOutcome } from "@/entities/goal-farming"

import { useGoalAttainmentState } from "../attainment/use-goal-attainment"
import { usePlanInsights } from "../insights/use-plan-insights"
import { useGoals } from "../goals-data/use-goals"
import type { GoalRow } from "../shared/types"
import { computeDeadlineFits, deadlineFitSummary } from "./deadline-fit"
import type { DeadlineFitSummary, DeadlineGoalFit } from "./deadline-fit"

/** A resolved, usable deadline. */
type ReadyProjectDeadline = Extract<ProjectDeadline, { status: "ready" }>

/**
 * The one canonical deadline fit of a scoped project (project-deadline-fit): the header, labels,
 * divider and card count all derive from it. `off` for no project or an untargeted one.
 */
export type ProjectDeadlineFit =
  | { status: "off" }
  | { status: "loading" | "unavailable"; target: ProjectTarget }
  | { status: "ended"; target: ProjectTarget; deadline: ReadyProjectDeadline }
  | {
      status: "ready"
      target: ProjectTarget
      deadline: ReadyProjectDeadline
      byGoalId: ReadonlyMap<string, DeadlineGoalFit>
      summary: DeadlineFitSummary
    }

type FitRow = Pick<GoalRow, "goalId" | "status" | "goalType" | "entityType">

const OFF: ProjectDeadlineFit = { status: "off" }

/** The fit from a resolved deadline, the project's rows and the global-plan estimates. */
function projectDeadlineFit(
  target: ProjectTarget,
  deadline: ProjectDeadline,
  rows: readonly FitRow[],
  estimates: ReadonlyMap<string, EstimateOutcome> | undefined,
  reachedByGoalId: ReadonlyMap<string, boolean>
): ProjectDeadlineFit {
  if (deadline.status !== "ready") return { status: deadline.status, target }
  if (deadline.ended) return { status: "ended", target, deadline }
  if (!estimates) return { status: "loading", target }
  const byGoalId = computeDeadlineFits(
    rows,
    estimates,
    reachedByGoalId,
    deadline
  )
  return {
    status: "ready",
    target,
    deadline,
    byGoalId,
    summary: deadlineFitSummary(rows, byGoalId, reachedByGoalId),
  }
}

/**
 * The scoped project's deadline fit on the Goals page. `rows` are the project's goals (any status),
 * `estimates` the global-plan estimates, undefined while they load.
 */
export function useProjectDeadlineFit(
  project: Pick<ProjectSummary, "projectId" | "target"> | undefined,
  rows: readonly GoalRow[],
  estimates: ReadonlyMap<string, EstimateOutcome> | undefined,
  reachedByGoalId: ReadonlyMap<string, boolean>
): ProjectDeadlineFit {
  const deadline = useProjectDeadline(project)
  const target = project?.target
  return useMemo(
    () =>
      target && deadline
        ? projectDeadlineFit(target, deadline, rows, estimates, reachedByGoalId)
        : OFF,
    [target, deadline, rows, estimates, reachedByGoalId]
  )
}

/** A project card's fit count: a skeleton while the run loads, then the summary. */
export type ProjectFitCount =
  { status: "loading" } | { status: "ready"; summary: DeadlineFitSummary }

const EMPTY_REACHED: ReadonlyMap<string, boolean> = new Map()

/**
 * Fit counts for project cards (Projects page and home widget), keyed by project id. Only
 * non-archived projects with a resolvable, not-ended target get one; the one global-plan run is
 * computed only when such a project exists. A failed run hides the counts.
 */
export function useProjectFitCounts(
  projects: readonly ProjectSummary[]
): ReadonlyMap<string, ProjectFitCount> {
  const targeted = projects.flatMap((project) =>
    project.status !== "Archived" && project.target
      ? [{ ...project, target: project.target }]
      : []
  )
  const deadlines = useProjectDeadlines(targeted)
  const live = targeted.filter((project) => {
    const deadline = deadlines.get(project.projectId)
    return (
      deadline?.status === "loading" ||
      (deadline?.status === "ready" && !deadline.ended)
    )
  })
  // An empty scope makes the run a no-op, so the page pays for it only when a count can show.
  const insights = usePlanInsights(live.length > 0 ? null : [])
  const goals = useGoals()
  const memberIds = live.flatMap((project) => project.goalIds)
  const attainment = useGoalAttainmentState(memberIds)

  const counts = new Map<string, ProjectFitCount>()
  if (insights.isError || goals.fetchState.status === "error") return counts
  const goalsById =
    goals.fetchState.status === "success"
      ? new Map(goals.fetchState.goals.map((goal) => [goal.goalId, goal]))
      : null
  for (const project of live) {
    const deadline = deadlines.get(project.projectId)
    if (
      deadline?.status !== "ready" ||
      insights.loading ||
      !goalsById ||
      attainment.pending
    ) {
      counts.set(project.projectId, { status: "loading" })
      continue
    }
    const rows = project.goalIds.flatMap((goalId) => {
      const goal = goalsById.get(goalId)
      return goal ? [goal] : []
    })
    const reached = new Map(
      project.goalIds.map((goalId) => [
        goalId,
        attainment.byGoalId.get(goalId)?.reached ?? false,
      ])
    )
    const fit = projectDeadlineFit(
      project.target,
      deadline,
      rows,
      insights.result.estimates,
      reached.size > 0 ? reached : EMPTY_REACHED
    )
    if (fit.status === "ready") {
      counts.set(project.projectId, { status: "ready", summary: fit.summary })
    }
  }
  return counts
}
