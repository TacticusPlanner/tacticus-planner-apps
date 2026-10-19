import { useCallback, useEffect, useMemo, useState } from "react"

import {
  runInputValues,
  type AscensionStep,
  type LegendaryEventRun,
  type LegendaryEventRunInputValues,
  type UpgradeStep,
  useTeamDisplayName,
} from "@/entities/legendary-event"
import { stepInGoals } from "@/features/legendary-event-goals"

import { draftTokenView, stepTargets } from "./plan-ceiling"
import {
  chainRequest,
  goalChains,
  recommendationsFor,
  targetOptions,
  toggleRecommendation,
} from "./plan-draft"
import {
  NO_TEAM_ADJUSTMENTS,
  createPlanEvaluator,
  type TeamAdjustments,
} from "./plan-evaluator"
import {
  PLAN_LANE_IDS,
  planRuns,
  type PlanEconomy,
  type PlanInputs,
} from "./plan-inputs"
import type { DraftTeam } from "./plan-teams"
import {
  chosenFrom,
  recommendUpgrades,
  type UpgradeRecommendation,
} from "./plan-upgrades"
import type { PlanSource } from "./use-plan-source"
import { useUpgradeFarmingDays } from "./use-upgrade-farming-days"

type ReadySource = Extract<PlanSource, { status: "ready" }>

export type RecommendationsState =
  | { status: "estimating" }
  | { status: "unavailable" }
  | {
      status: "running" | "done"
      recommendations: UpgradeRecommendation[]
      /** The ceiling with every recommendation (the final one once done). */
      upgradedCeiling: number
    }

/** Upgrade recommendations explored to the cap on the draft's economy, one round per task so the
 *  page stays responsive (design: worker-friendly batch). `job` changes whenever the exploration
 *  restarts, so ticks made on an earlier list are dropped. */
function useRecommendations(
  source: ReadySource,
  economy: PlanEconomy,
  syncedCeiling: number | null
): { state: RecommendationsState; job: object | null } {
  const farming = useUpgradeFarmingDays()
  const { inputs, goalTargets, masterTotal, hordeMultiplier } = source
  const job = useMemo(() => {
    if (farming.status !== "ready" || syncedCeiling === null) return null
    const rosterById = new Map(
      inputs.roster.map((unit) => [unit.unitId as string, unit])
    )
    return {
      syncedCeiling,
      start: () =>
        recommendUpgrades({
          inputs,
          evaluator: createPlanEvaluator(inputs, economy),
          targetPoints: Number.POSITIVE_INFINITY,
          farmingDays: (unitId, steps) =>
            farming.estimate(
              chainRequest(unitId, rosterById.get(unitId), steps)
            )?.days ?? null,
          alreadyPlanned: (unitId: string, step: UpgradeStep) =>
            stepInGoals(step, goalTargets.get(unitId)),
          masterTotal,
          hordeMultiplier,
        }),
    }
  }, [
    farming,
    inputs,
    economy,
    syncedCeiling,
    goalTargets,
    masterTotal,
    hordeMultiplier,
  ])
  const [progress, setProgress] = useState<{
    job: object
    state: RecommendationsState
  } | null>(null)
  useEffect(() => {
    if (!job) return undefined
    const iterator = job.start()
    let timer: number | undefined
    const step = () => {
      const next = iterator.next()
      if (next.done) {
        setProgress({
          job,
          state: {
            status: "done",
            recommendations: next.value.recommendations,
            upgradedCeiling: next.value.final.ceiling ?? job.syncedCeiling,
          },
        })
        return
      }
      setProgress({
        job,
        state: {
          status: "running",
          recommendations: next.value,
          upgradedCeiling: next.value.at(-1)?.ceilingAfter ?? job.syncedCeiling,
        },
      })
      timer = window.setTimeout(step, 0)
    }
    timer = window.setTimeout(step, 0)
    return () => window.clearTimeout(timer)
  }, [job])

  const farmingStatus = farming.status
  // Memoised so the draft's derived values only recompute when the exploration advances.
  return useMemo(() => {
    if (!job) {
      return {
        job: null,
        state: {
          status: farmingStatus === "loading" ? "estimating" : "unavailable",
        },
      }
    }
    if (progress?.job === job) return { job, state: progress.state }
    return {
      job,
      state: {
        status: "running",
        recommendations: [],
        upgradedCeiling: job.syncedCeiling,
      },
    }
  }, [job, progress, farmingStatus])
}

/** Each draft team's display name by draft key (spec: a team shows a readable name): its stored
 *  name, else its objectives, else "Team N" by its place in the lane. */
function useDraftTeamNames(
  inputs: PlanInputs,
  teams: readonly DraftTeam[]
): (key: string) => string {
  const displayName = useTeamDisplayName()
  return useMemo(() => {
    const names = new Map<string, string>()
    for (const laneId of PLAN_LANE_IDS) {
      const laneTeams = teams.filter((team) => team.laneId === laneId)
      const order = laneTeams.map((_, sortOrder) => ({ laneId, sortOrder }))
      laneTeams.forEach((team, sortOrder) =>
        names.set(
          team.key,
          displayName({ ...team, sortOrder }, inputs.event[laneId], order)
        )
      )
    }
    return (key: string) => names.get(key) ?? ""
  }, [displayName, inputs.event, teams])
}

function initialEconomy(source: ReadySource): PlanEconomy {
  return {
    runs: source.inputs.plan.runs ?? [],
    showPaidOptions: source.inputs.plan.showPaidOptions,
  }
}

/**
 * The wizard's draft (spec: five steps with a preview before anything is written): the target,
 * the ticked upgrades, the team adjustments and the edited run inputs, and everything derived from
 * them. Nothing here writes.
 */
export function usePlanDraft(
  source: ReadySource,
  initialTarget: AscensionStep | null
) {
  const { inputs } = source
  const [economy, setEconomy] = useState(() => initialEconomy(source))
  const [target, setTarget] = useState<AscensionStep | null>(initialTarget)
  // The user's ticks on one exploration's list; null until they tick something.
  const [userTicks, setTicked] = useState<{
    job: object | null
    set: ReadonlySet<number>
  } | null>(null)
  const [adjustments, setAdjustments] =
    useState<TeamAdjustments>(NO_TEAM_ADJUSTMENTS)
  const [dirty, setDirty] = useState(false)

  const syncedCeiling = useMemo(
    () => createPlanEvaluator(inputs, economy).evaluate([]).ceiling,
    [inputs, economy]
  )
  const { state: recommendations, job } = useRecommendations(
    source,
    economy,
    syncedCeiling
  )
  const targets = useMemo(() => stepTargets(inputs, economy), [inputs, economy])
  const upgradedCeiling =
    "upgradedCeiling" in recommendations
      ? recommendations.upgradedCeiling
      : (syncedCeiling ?? 0)
  const options = useMemo(
    () => targetOptions(targets, syncedCeiling ?? 0, upgradedCeiling),
    [targets, syncedCeiling, upgradedCeiling]
  )
  // No choice yet, or a step no longer offered: the next step.
  const chosenTarget =
    targets.find((entry) => entry.step === target) ?? targets[0]
  const list = useMemo(
    () =>
      "recommendations" in recommendations
        ? recommendations.recommendations
        : [],
    [recommendations]
  )
  const ticked = userTicks?.job === job ? userTicks.set : null
  // Until the user ticks something, the target's prefix is ticked.
  const defaultCount = recommendationsFor(
    list,
    chosenTarget,
    syncedCeiling ?? 0
  )
  const tickedSet = useMemo(
    () => ticked ?? new Set(Array.from({ length: defaultCount }, (_, i) => i)),
    [ticked, defaultCount]
  )
  const tickedRecommendations = useMemo(
    () => list.filter((_, index) => tickedSet.has(index)),
    [list, tickedSet]
  )
  const evaluation = useMemo(
    () =>
      createPlanEvaluator(inputs, economy, adjustments).evaluate(
        chosenFrom(tickedRecommendations, inputs.nowMs)
      ),
    [inputs, economy, adjustments, tickedRecommendations]
  )
  const teamName = useDraftTeamNames(inputs, evaluation.teams)
  const tokenView = useMemo(
    () =>
      draftTokenView(inputs, evaluation.teams, economy, (team) =>
        teamName(team.id)
      ),
    [inputs, evaluation, economy, teamName]
  )
  const chains = useMemo(
    () => goalChains(list, tickedSet, inputs.roster),
    [list, tickedSet, inputs.roster]
  )

  const markDirty = useCallback(() => setDirty(true), [])

  return {
    inputs,
    runs: planRuns(inputs.resolution),
    economy,
    target: chosenTarget?.step ?? null,
    targets,
    options,
    chosenTarget,
    syncedCeiling,
    recommendations,
    ticked: tickedSet,
    chains,
    adjustments,
    evaluation,
    tokenView,
    teamName,
    dirty,
    chooseTarget: (step: AscensionStep) => {
      setTarget(step)
      setTicked(null)
      markDirty()
    },
    toggle: (index: number) => {
      setTicked({ job, set: toggleRecommendation(list, tickedSet, index) })
      markDirty()
    },
    adjustTeams: (change: (current: TeamAdjustments) => TeamAdjustments) => {
      setAdjustments(change)
      markDirty()
    },
    runValues: (run: LegendaryEventRun): LegendaryEventRunInputValues =>
      runInputValues(economy.runs, run),
    changeRun: (
      run: LegendaryEventRun,
      patch: Partial<LegendaryEventRunInputValues>
    ) => {
      setEconomy((current) => {
        const values = { ...runInputValues(current.runs, run), ...patch }
        return {
          ...current,
          runs: [
            ...current.runs.filter((entry) => entry.run !== run),
            { run, ...values, updatedAt: "" },
          ].sort((a, b) => a.run - b.run),
        }
      })
      markDirty()
    },
    setShowPaidOptions: (on: boolean) => {
      setEconomy((current) => ({ ...current, showPaidOptions: on }))
      markDirty()
    },
  }
}

export type PlanDraft = ReturnType<typeof usePlanDraft>
