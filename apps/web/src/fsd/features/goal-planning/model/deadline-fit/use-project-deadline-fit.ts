import { useMemo } from "react"

import { useProjectDeadline, useProjectDeadlines } from "@/entities/project"
import type {
  ProjectDeadline,
  ProjectSummary,
  ProjectTarget,
} from "@/entities/project"
import type { EstimateOutcome } from "@/entities/goal-farming"

import { useGoalAttainmentState } from "../attainment/use-goal-attainment"
import { useGoalsOverviewMetrics } from "../attainment/use-goals-overview-metrics"
import { projectCompletion } from "../project-cards/project-card-progress"
import type { ProjectCompletion } from "../project-cards/project-card-progress"
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

const LOADING: ProjectFitCount = { status: "loading" }

/** A targeted card's fit count from a resolved deadline, or null when the fit has none. */
function cardFitCount(
  project: Pick<ProjectSummary, "goalIds"> & { target: ProjectTarget },
  deadline: ProjectDeadline,
  goalsById: ReadonlyMap<string, GoalRow>,
  estimates: ReadonlyMap<string, EstimateOutcome>,
  attainmentByGoalId: ReadonlyMap<string, { reached: boolean }>
): ProjectFitCount | null {
  const rows = project.goalIds.flatMap((goalId) => {
    const goal = goalsById.get(goalId)
    return goal ? [goal] : []
  })
  const reached = new Map(
    project.goalIds.map((goalId) => [
      goalId,
      attainmentByGoalId.get(goalId)?.reached ?? false,
    ])
  )
  const fit = projectDeadlineFit(
    project.target,
    deadline,
    rows,
    estimates,
    reached.size > 0 ? reached : EMPTY_REACHED
  )
  return fit.status === "ready"
    ? { status: "ready", summary: fit.summary }
    : null
}

/** A live project card's progress (project-management: "Every live project card shows the same
 *  facts"): reached and blocked goals, and its "Done by" from the global run (null when the run
 *  failed). */
export type ProjectCardProgress =
  | { status: "loading" }
  | {
      status: "ready"
      reached: number
      blocked: number
      completion: ProjectCompletion | null
    }

/**
 * Every live project card's progress and, for targeted ones, its deadline fit count (Projects page
 * and home widget), keyed by project id, from one global-plan run. Archived projects get neither.
 * The run is computed only when a live project holds a goal. A failed run hides the fit counts and
 * the dates.
 */
export function useProjectCardOutlooks(projects: readonly ProjectSummary[]): {
  fitCounts: ReadonlyMap<string, ProjectFitCount>
  progress: ReadonlyMap<string, ProjectCardProgress>
} {
  const liveProjects = projects.filter(
    (project) => project.status !== "Archived"
  )
  const targeted = liveProjects.flatMap((project) =>
    project.target ? [{ ...project, target: project.target }] : []
  )
  const deadlines = useProjectDeadlines(targeted)
  const live = targeted.filter((project) => {
    const deadline = deadlines.get(project.projectId)
    return (
      deadline?.status === "loading" ||
      (deadline?.status === "ready" && !deadline.ended)
    )
  })
  // Kept by content: the metrics below recompute (and re-stabilise) on a new array identity.
  const memberKey = [
    ...new Set(liveProjects.flatMap((project) => project.goalIds)),
  ].join(",")
  const memberIds = useMemo(
    () => (memberKey === "" ? [] : memberKey.split(",")),
    [memberKey]
  )
  // An empty scope makes the run a no-op, so the page pays for it only when a card can use it.
  const insights = usePlanInsights(memberIds.length > 0 ? null : [])
  const goals = useGoals()
  const attainment = useGoalAttainmentState(memberIds)
  const metrics = useGoalsOverviewMetrics(memberIds, insights.result.estimates)

  const fitCounts = new Map<string, ProjectFitCount>()
  const progress = new Map<string, ProjectCardProgress>()
  if (goals.fetchState.status === "error") return { fitCounts, progress }
  const goalsById =
    goals.fetchState.status === "success"
      ? new Map(goals.fetchState.goals.map((goal) => [goal.goalId, goal]))
      : null
  const loading = insights.loading || !goalsById || attainment.pending

  for (const project of liveProjects) {
    if (loading) {
      progress.set(project.projectId, { status: "loading" })
      continue
    }
    progress.set(project.projectId, {
      status: "ready",
      reached: project.goalIds.filter(
        (goalId) => attainment.byGoalId.get(goalId)?.reached
      ).length,
      blocked: project.goalIds.filter(
        (goalId) => metrics.get(goalId)?.blockers.isBlocked
      ).length,
      completion: insights.isError
        ? null
        : projectCompletion(project.goalIds, insights.result),
    })
  }

  if (insights.isError) return { fitCounts, progress }
  for (const project of live) {
    const deadline = deadlines.get(project.projectId)
    const count =
      deadline?.status === "ready" && !loading
        ? cardFitCount(
            project,
            deadline,
            goalsById,
            insights.result.estimates,
            attainment.byGoalId
          )
        : LOADING
    if (count) fitCounts.set(project.projectId, count)
  }
  return { fitCounts, progress }
}
