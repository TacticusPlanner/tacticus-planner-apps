import { useCallback, useEffect, useMemo, useRef, useState } from "react"

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
  recommendationKey,
  recommendationsFor,
  targetOptions,
  toggleRecommendation,
} from "./plan-draft"
import {
  NO_TEAM_ADJUSTMENTS,
  createPlanEvaluator,
  type PlanEvaluator,
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
import { browserSliceClock, runSliced, type SlicedRun } from "./run-sliced"
import type { PlanSource } from "./use-plan-source"
import { useDebouncedValue } from "./use-debounced-value"
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

/** How long run-input edits wait before they reach the verdicts and the search (spec: run-input
 *  edits settle before they are planned). */
export const ECONOMY_SETTLE_MS = 400

/** Upgrade recommendations explored to the cap on the settled economy, in time slices so the page
 *  stays responsive (spec: the search runs in slices). Only rounds re-render; `lowerPriority`
 *  moves the rest of the search to idle time. */
function useRecommendations(
  source: ReadySource,
  evaluator: PlanEvaluator,
  syncedCeiling: number | null
): { state: RecommendationsState; lowerPriority: () => void } {
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
          evaluator,
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
    evaluator,
    syncedCeiling,
    goalTargets,
    masterTotal,
    hordeMultiplier,
  ])
  const [progress, setProgress] = useState<{
    job: object
    state: RecommendationsState
  } | null>(null)
  const run = useRef<SlicedRun | null>(null)
  useEffect(() => {
    if (!job) return undefined
    const sliced = runSliced(job.start(), {
      clock: browserSliceClock(),
      onYield: (step) => {
        if (step.kind !== "round") return
        setProgress({
          job,
          state: {
            status: "running",
            recommendations: step.recommendations,
            upgradedCeiling:
              step.recommendations.at(-1)?.ceilingAfter ?? job.syncedCeiling,
          },
        })
      },
      onDone: (result) =>
        setProgress({
          job,
          state: {
            status: "done",
            recommendations: result.recommendations,
            upgradedCeiling: result.final.ceiling ?? job.syncedCeiling,
          },
        }),
    })
    run.current = sliced
    return () => {
      sliced.cancel()
      if (run.current === sliced) run.current = null
    }
  }, [job])
  const lowerPriority = useCallback(() => run.current?.lowerPriority(), [])

  const farmingStatus = farming.status
  // Memoised so the draft's derived values only recompute when the exploration advances.
  const state = useMemo((): RecommendationsState => {
    if (!job) {
      return {
        status: farmingStatus === "loading" ? "estimating" : "unavailable",
      }
    }
    if (progress?.job === job) return progress.state
    return {
      status: "running",
      recommendations: [],
      upgradedCeiling: job.syncedCeiling,
    }
  }, [job, progress, farmingStatus])
  return { state, lowerPriority }
}

/** Whether the chosen target's recommendations are final (spec: a step's recommendations are final
 *  once they reach it): never while run inputs settle; otherwise once it is reachable now, once a
 *  found recommendation reaches it, or once the search is over. */
export function isTargetSettled({
  settling,
  recommendations,
  target,
  syncedCeiling,
}: {
  settling: boolean
  recommendations: RecommendationsState
  target:
    { kind: "points"; points: number } | { kind: "unreachable" } | undefined
  syncedCeiling: number | null
}): boolean {
  if (settling) return false
  if (
    recommendations.status === "done" ||
    recommendations.status === "unavailable"
  ) {
    return true
  }
  if (target?.kind !== "points") return false
  if (syncedCeiling !== null && target.points <= syncedCeiling) return true
  return (
    "recommendations" in recommendations &&
    recommendations.recommendations.some(
      (recommendation) => recommendation.ceilingAfter >= target.points
    )
  )
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
  // The user's ticks by recommendation key, so they survive a re-exploration that finds the same
  // recommendations; null until they tick something.
  const [userTicks, setTicked] = useState<ReadonlySet<string> | null>(null)
  const [adjustments, setAdjustments] =
    useState<TeamAdjustments>(NO_TEAM_ADJUSTMENTS)
  const [dirty, setDirty] = useState(false)
  // Kept teams whose swap offer the user declined (Keep).
  const [skippedSwaps, setSkippedSwaps] = useState<ReadonlySet<string>>(
    () => new Set()
  )

  // The verdicts and the search plan on the run inputs once they settle; the form shows them live.
  const planEconomy = useDebouncedValue(economy, ECONOMY_SETTLE_MS)
  const settling = planEconomy !== economy
  // One evaluator (and its lane cache) per settled economy, shared by the synced ceiling, the search
  // and the draft's evaluations on the default team adjustments.
  const evaluator = useMemo(
    () => createPlanEvaluator(inputs, planEconomy),
    [inputs, planEconomy]
  )
  const draftEvaluator = useMemo(
    () =>
      adjustments === NO_TEAM_ADJUSTMENTS
        ? evaluator
        : createPlanEvaluator(inputs, planEconomy, adjustments),
    [evaluator, inputs, planEconomy, adjustments]
  )
  const syncedCeiling = useMemo(
    () => evaluator.evaluate([]).ceiling,
    [evaluator]
  )
  const { state: recommendations, lowerPriority } = useRecommendations(
    source,
    evaluator,
    syncedCeiling
  )
  const targets = useMemo(
    () => stepTargets(inputs, planEconomy),
    [inputs, planEconomy]
  )
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
  const keys = useMemo(() => list.map(recommendationKey), [list])
  // Until the user ticks something, the target's prefix is ticked.
  const defaultCount = recommendationsFor(
    list,
    chosenTarget,
    syncedCeiling ?? 0
  )
  const tickedSet = useMemo(
    () =>
      userTicks
        ? new Set(
            keys.flatMap((key, index) => (userTicks.has(key) ? [index] : []))
          )
        : new Set(Array.from({ length: defaultCount }, (_, i) => i)),
    [userTicks, keys, defaultCount]
  )
  const tickedRecommendations = useMemo(
    () => list.filter((_, index) => tickedSet.has(index)),
    [list, tickedSet]
  )
  const evaluation = useMemo(
    () =>
      draftEvaluator.evaluate(chosenFrom(tickedRecommendations, inputs.nowMs)),
    [draftEvaluator, inputs.nowMs, tickedRecommendations]
  )
  const targetSettled = isTargetSettled({
    settling,
    recommendations,
    target: chosenTarget,
    syncedCeiling,
  })
  // The rest of the search only settles the other steps' verdicts: it runs in idle time.
  useEffect(() => {
    if (targetSettled) lowerPriority()
  }, [targetSettled, lowerPriority, recommendations])
  // Each step's verdict from the last search that ended on settled inputs, shown dimmed while
  // the verdicts are rechecked (spec: verdicts being rechecked keep their last value).
  const [lastSettled, setLastSettled] = useState(options)
  if (
    recommendations.status !== "running" &&
    recommendations.status !== "estimating" &&
    !settling &&
    lastSettled !== options
  ) {
    setLastSettled(options)
  }
  const teamName = useDraftTeamNames(inputs, evaluation.teams)
  const tokenView = useMemo(
    () =>
      draftTokenView(inputs, evaluation.teams, planEconomy, (team) =>
        teamName(team.id)
      ),
    [inputs, evaluation, planEconomy, teamName]
  )
  const chains = useMemo(
    () =>
      goalChains(list, tickedSet, inputs.roster, (unitId, step) =>
        stepInGoals(step, source.goalTargets.get(unitId))
      ),
    [list, tickedSet, inputs.roster, source.goalTargets]
  )

  const runs = useMemo(() => planRuns(inputs.resolution), [inputs.resolution])
  const markDirty = useCallback(() => setDirty(true), [])

  return {
    inputs,
    runs,
    /** The run inputs as edited (the form and the writes). */
    economy,
    /** The run inputs the verdicts and the search use: `economy` once it has settled. */
    planEconomy,
    /** Run-input edits have not reached the verdicts yet. */
    settling,
    /** The chosen target's recommendations are final: Create may run. */
    targetSettled,
    target: chosenTarget?.step ?? null,
    targets,
    options,
    /** The verdicts as of the last search that ended on settled inputs. */
    lastSettledOptions: lastSettled,
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
      const next = toggleRecommendation(list, tickedSet, index)
      setTicked(new Set([...next].map((entry) => keys[entry]!)))
      markDirty()
    },
    skippedSwaps,
    skipSwap: (key: string) =>
      setSkippedSwaps((current) => new Set([...current, key])),
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
