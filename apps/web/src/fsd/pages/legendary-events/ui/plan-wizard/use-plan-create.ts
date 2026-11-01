import { useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { useQueryClient } from "@tanstack/react-query"

import {
  createCombinedGoals,
  goalQueries,
  isGoalLimitError,
  MAX_GOALS_PER_TYPE,
} from "@/entities/goal"
import {
  createLegendaryEventTeam,
  deleteLegendaryEventTeam,
  teamDepthForRun,
  updateLegendaryEventPlan,
  updateLegendaryEventTeam,
  updateLegendaryEventRunInputs,
  usePlanWriteQueue,
  type LegendaryEventPlan,
  type LegendaryEventRun,
  type LegendaryEventTeam,
} from "@/entities/legendary-event"
import {
  createProject,
  isProjectLimitError,
  MAX_PROJECTS,
  projectQueries,
} from "@/entities/project"
import { assertLaneHasRoom } from "@/features/legendary-event-plan"
import { ApiError } from "@/shared/api"

import { upgradeChainGoalSpecs } from "./farming-days"
import { type PlanDestination, type PlanWrites } from "./plan-create"
import { memberKey, type DraftTeam } from "./plan-teams"

export type CreateItemStatus = "pending" | "done" | "failed"

/** One line of the creation checklist (spec: each item shows pending, done or failed). */
export interface CreateItem {
  key: string
  kind: "project" | "goals" | "teams" | "runs"
  /** The unit (goals) or lane (teams) the item is about. */
  subject?: string
  status: CreateItemStatus
  error?: string
}

const errorText = (error: unknown) =>
  error instanceof ApiError || error instanceof Error ? error.message : ""

const sortedObjectives = (indexes: readonly number[]) =>
  [...indexes].sort((a, b) => a - b)

/** The first plan run's depth fields of a team write: the depth the user set, else none. */
function firstRunDepth(team: DraftTeam, runs: readonly LegendaryEventRun[]) {
  const depth = team.depthOverride ?? null
  return {
    run: runs[0] ?? 1,
    expectedBattleClears: depth,
    expectedBattleClearsSource: depth === null ? null : ("manual" as const),
  }
}

/** Saves the depth the user set in the wizard as the manual depth of every plan run that does not
 *  hold it yet (a retry skips the runs already written). */
async function writeDepthOverride(
  eventId: string,
  base: LegendaryEventPlan,
  teamId: string,
  team: DraftTeam,
  runs: readonly LegendaryEventRun[]
): Promise<LegendaryEventPlan> {
  const depth = team.depthOverride
  if (depth == null) return base
  let plan = base
  for (const run of runs) {
    const stored = plan.teams.find((entry) => entry.id === teamId)
    if (!stored) return plan
    const recorded = teamDepthForRun(stored, run)
    if (
      recorded?.expectedBattleClears === depth &&
      recorded.expectedBattleClearsSource === "manual"
    ) {
      continue
    }
    plan = await updateLegendaryEventTeam(eventId, teamId, {
      name: stored.name,
      memberUnitIds: stored.memberUnitIds,
      reserveUnitId: stored.reserveUnitId,
      objectiveIndexes: stored.objectiveIndexes,
      expectedRevision: plan.revision,
      run,
      expectedBattleClears: depth,
      expectedBattleClearsSource: "manual",
    })
  }
  return plan
}

/** Sends one lane's removals, updates and new teams in order, each on the revision the previous
 *  returned. */
export async function writeLane(
  eventId: string,
  base: LegendaryEventPlan,
  lane: PlanWrites["lanes"][number],
  runs: readonly LegendaryEventRun[],
  teamName: (team: DraftTeam) => string
): Promise<LegendaryEventPlan> {
  let plan = base
  // A retry skips what an earlier attempt already wrote.
  for (const teamId of lane.remove) {
    if (!plan.teams.some((team) => team.id === teamId)) continue
    plan = await deleteLegendaryEventTeam(eventId, teamId, plan.revision)
  }
  for (const team of lane.update) {
    const name = teamName(team)
    const objectives = sortedObjectives(team.objectiveIndexes)
    const stored = plan.teams.find((entry) => entry.id === team.storedId)
    if (!stored) continue
    if (
      stored.name !== name ||
      memberKey(stored.memberUnitIds) !== memberKey(team.memberUnitIds) ||
      stored.reserveUnitId !== team.reserveUnitId ||
      stored.objectiveIndexes.join() !== objectives.join()
    ) {
      // New members make the stored depth stale: it is left to the live estimate, like a new team,
      // unless the user set the depth in the wizard.
      plan = await updateLegendaryEventTeam(eventId, stored.id, {
        name,
        memberUnitIds: team.memberUnitIds,
        reserveUnitId: team.reserveUnitId,
        objectiveIndexes: objectives,
        expectedRevision: plan.revision,
        ...firstRunDepth(team, runs),
      })
    }
    plan = await writeDepthOverride(eventId, plan, stored.id, team, runs)
  }
  for (const team of lane.create) {
    const members = memberKey(team.memberUnitIds)
    const sameMembers = (entry: LegendaryEventTeam) =>
      entry.laneId === lane.laneId && memberKey(entry.memberUnitIds) === members
    if (!plan.teams.some(sameMembers)) {
      // The wizard writes past the shared editor, so it applies the editor's full-lane guard itself.
      assertLaneHasRoom(plan, lane.laneId)
      // The first plan run reads the live estimate; later runs are left unrecorded too, so a
      // projected depth that assumed upgrades never outlives goals that slipped (design D5). A depth
      // the user set in the wizard is saved for every plan run instead.
      plan = await createLegendaryEventTeam(eventId, {
        name: teamName(team),
        memberUnitIds: team.memberUnitIds,
        reserveUnitId: team.reserveUnitId,
        objectiveIndexes: sortedObjectives(team.objectiveIndexes),
        expectedRevision: plan.revision,
        laneId: lane.laneId,
        ...firstRunDepth(team, runs),
      })
    }
    const created = plan.teams.find(sameMembers)
    if (created) {
      plan = await writeDepthOverride(eventId, plan, created.id, team, runs)
    }
  }
  return plan
}

/**
 * Create (spec: creation files goals in a project targeting the event): the project when new, each
 * unit's goals in one combined creation into it, each lane's team writes through the plan's write
 * queue, then the edited run inputs. Every item reports its own result; Retry resends only the
 * failed ones. Nothing is rolled back.
 */
export function usePlanCreate(eventId: string) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const { enqueue } = usePlanWriteQueue(eventId)
  const [items, setItems] = useState<CreateItem[]>([])
  const [running, setRunning] = useState(false)
  const projectId = useRef<string | null>(null)

  const setStatus = (key: string, status: CreateItemStatus, error?: string) =>
    setItems((current) =>
      current.map((item) =>
        item.key === key ? { ...item, status, error } : item
      )
    )

  const run = async ({
    writes,
    destination,
    targetEventId,
    runs,
    teamName,
    onlyFailed,
  }: {
    writes: PlanWrites
    destination: PlanDestination
    targetEventId: string
    runs: readonly LegendaryEventRun[]
    teamName: (team: DraftTeam) => string
    onlyFailed: boolean
  }): Promise<{ ok: boolean; projectId: string | null }> => {
    const planned: CreateItem[] = [
      ...(destination.kind === "new"
        ? [
            {
              key: "project",
              kind: "project" as const,
              status: "pending" as const,
            },
          ]
        : []),
      ...writes.goals.map((chain) => ({
        key: `goals:${chain.unitId}`,
        kind: "goals" as const,
        subject: chain.unitId,
        status: "pending" as const,
      })),
      ...writes.lanes.map((lane) => ({
        key: `teams:${lane.laneId}`,
        kind: "teams" as const,
        subject: lane.laneId,
        status: "pending" as const,
      })),
      ...(writes.runs.length > 0 || writes.showPaidOptions !== null
        ? [{ key: "runs", kind: "runs" as const, status: "pending" as const }]
        : []),
    ]
    const previous = new Map(items.map((item) => [item.key, item.status]))
    const todo = new Set(
      planned
        .filter((item) => !onlyFailed || previous.get(item.key) !== "done")
        .map((item) => item.key)
    )
    setItems(
      planned.map((item) =>
        todo.has(item.key) ? item : { ...item, status: "done" }
      )
    )
    setRunning(true)
    let ok = true
    const attempt = async (key: string, send: () => Promise<unknown>) => {
      if (!todo.has(key)) return true
      try {
        await send()
        setStatus(key, "done")
        return true
      } catch (error) {
        // The account caps read as translated copy; other failures keep the server's text.
        setStatus(
          key,
          "failed",
          isGoalLimitError(error)
            ? t("goals.limits.goalLimitReachedGeneric", {
                max: MAX_GOALS_PER_TYPE,
              })
            : isProjectLimitError(error)
              ? t("goals.limits.projectLimitReached", { max: MAX_PROJECTS })
              : errorText(error)
        )
        ok = false
        return false
      }
    }

    if (destination.kind === "existing")
      projectId.current = destination.projectId
    const projectOk = await attempt("project", async () => {
      const project = await createProject({
        name: destination.kind === "new" ? destination.name : "",
        description: null,
        color: null,
        target: { kind: "legendaryEvent", eventId: targetEventId },
      })
      projectId.current = project.projectId
    })
    if (projectOk && projectId.current) {
      for (const chain of writes.goals) {
        const first = chain.steps[0]
        await attempt(`goals:${chain.unitId}`, () =>
          createCombinedGoals({
            entityType: "Character",
            entityId: chain.unitId,
            projects: [{ projectId: projectId.current! }],
            goals: upgradeChainGoalSpecs(
              chain.request,
              first?.kind === "unlock" ? first.unit.progressionIndex : undefined
            ),
          })
        )
      }
    } else {
      for (const chain of writes.goals) {
        if (todo.has(`goals:${chain.unitId}`)) {
          setStatus(`goals:${chain.unitId}`, "failed")
        }
      }
      ok = false
    }
    void queryClient.invalidateQueries({ queryKey: goalQueries.lists() })
    // The wizard's project gained the new goals (its `goalIds`).
    void queryClient.invalidateQueries({
      queryKey: projectQueries.list().queryKey,
    })

    for (const lane of writes.lanes) {
      await attempt(`teams:${lane.laneId}`, async () => {
        const outcome = await enqueue({
          send: (base) => writeLane(eventId, base, lane, runs, teamName),
        })
        if (outcome !== "saved") throw new Error(outcome)
      })
    }
    await attempt("runs", async () => {
      for (const entry of writes.runs) {
        const outcome = await enqueue({
          send: (base) =>
            updateLegendaryEventRunInputs(eventId, entry.run, {
              expectedRevision: base.revision,
              ...entry.values,
            }),
        })
        if (outcome !== "saved" && outcome !== "skipped") {
          throw new Error(outcome)
        }
      }
      if (writes.showPaidOptions !== null) {
        const on = writes.showPaidOptions
        const outcome = await enqueue({
          send: (base) =>
            updateLegendaryEventPlan(eventId, {
              expectedRevision: base.revision,
              notes: base.notes,
              showPaidOptions: on,
            }),
        })
        if (outcome !== "saved" && outcome !== "skipped") {
          throw new Error(outcome)
        }
      }
    })
    setRunning(false)
    return { ok, projectId: projectId.current }
  }

  return { items, running, run }
}
