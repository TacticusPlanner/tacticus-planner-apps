import { useMemo, useState } from "react"
import { useIsAuthenticated } from "@azure/msal-react"

import {
  LEGENDARY_EVENT_LANE_IDS,
  buildLanePointsModel,
  buildMasterTable,
  buildSyncedLaneProgress,
  laneBattlePowers,
  resolveLegendaryEventRunsAt,
  unitHordeMultiplier,
  useClearEstimateConfig,
  useLegendaryEvent,
  useLegendaryEventBattles,
  useLegendaryEventProgress,
  useLegendaryEventRoster,
  useLegendaryEventSyncTimes,
  useLegendaryEventUnits,
  useLegendaryEvents,
  usePlanWriteQueue,
  type LegendaryEvent,
  type LegendaryEventLifecycle,
  type LegendaryEventGoalTarget,
} from "@/entities/legendary-event"
import {
  legendaryEventRunDates,
  type LegendaryEventRunDates,
} from "../../lib/run-dates"
import { useLegendaryEventGoalTargets } from "@/features/legendary-event-goals"
import { useUnitName } from "@/shared/unit-name"
import { useUnitPowerContext } from "@/shared/unit-power"

import { stepTargets } from "./plan-ceiling"
import type { PlanInputs } from "./plan-inputs"

// One instance: the draft keys its upgrade exploration on the goal targets.
const NO_GOAL_TARGETS: ReadonlyMap<string, LegendaryEventGoalTarget> = new Map()

const sameLifecycle = (
  a: LegendaryEventLifecycle | undefined,
  b: LegendaryEventLifecycle | undefined
) =>
  a?.state === b?.state &&
  a?.runStartMs === b?.runStartMs &&
  a?.runEndMs === b?.runEndMs

/** What the wizard plans from, by data state (spec: wizard data states are distinct). */
export type PlanSource =
  | { status: "loading" }
  | { status: "error"; retry: () => void }
  /** The event id is not in the catalog. */
  | { status: "missing" }
  | { status: "signedOut" }
  /** The event is archived or finished: nothing to plan. */
  | { status: "finished"; event: LegendaryEvent }
  | {
      status: "noEstimates"
      event: LegendaryEvent
      /** The datasets clear estimates need that are missing. */
      missing: ("unitPower" | "hordeModeTiers")[]
    }
  /** The event unit has no step left to reach, or the event has no reward ladder. */
  | {
      status: "nothingToReach"
      event: LegendaryEvent
      reason: "fullyAscended" | "noLadder"
    }
  | {
      status: "ready"
      event: LegendaryEvent
      inputs: PlanInputs
      runDates: LegendaryEventRunDates
      masterTotal: (unitId: string) => number
      hordeMultiplier: (unitId: string) => number
      goalTargets: ReadonlyMap<string, LegendaryEventGoalTarget>
    }

function useAllowedUnitIds(event: LegendaryEvent | undefined) {
  return useMemo(
    () =>
      new Set(
        event
          ? LEGENDARY_EVENT_LANE_IDS.flatMap(
              (laneId) => event[laneId].availableUnitIds
            )
          : []
      ),
    [event]
  )
}

/**
 * Every read the 1-click plan needs (catalog event and events, synced progress and roster, unit
 * power, battles, the stored plan, goal targets), gathered into the generation's inputs once they
 * have settled. The clock is frozen when the wizard opens so the plan does not regenerate every
 * minute.
 */
export function usePlanSource(eventId: string): PlanSource {
  const isAuthenticated = useIsAuthenticated()
  const event = useLegendaryEvent(eventId)
  const events = useLegendaryEvents()
  const progress = useLegendaryEventProgress(eventId)
  const units = useLegendaryEventUnits()
  const roster = useLegendaryEventRoster()
  const battles = useLegendaryEventBattles(eventId)
  const syncTimes = useLegendaryEventSyncTimes()
  const config = useClearEstimateConfig(useUnitPowerContext())
  const { query: plan } = usePlanWriteQueue(eventId)
  const unitName = useUnitName()
  const eventData = event.status === "ready" ? event.data : undefined
  const goalTargets = useLegendaryEventGoalTargets(useAllowedUnitIds(eventData))
  const [nowMs] = useState(() => Date.now())

  const reads = [event, events, progress, units, roster, battles] as const
  const failed = reads.find((read) => read.status === "error")
  const settled =
    reads.every((read) => read.status === "ready") &&
    config.status !== "loading" &&
    plan.status !== "pending" &&
    goalTargets.status !== "loading"

  // The reads hand out a new state object every render; the memo keys on their data, which only
  // changes when the underlying query does. `settled` says the reads are ready: progress and the
  // roster read as undefined until synced (an upcoming event has no progress yet).
  const eventsData = events.status === "ready" ? events.data : undefined
  const unitsData = units.status === "ready" ? units.data : undefined
  const rosterData = roster.status === "ready" ? roster.data : undefined
  const battlesData = battles.status === "ready" ? battles.data : undefined
  const progressData = progress.status === "ready" ? progress.data : undefined
  const progressObservedAtMs =
    syncTimes.status === "ready" ? syncTimes.data.progressObservedAtMs : null
  // Re-derived every minute; kept while its window is unchanged so the draft does not restart.
  const [lifecycle, setLifecycle] = useState(event.lifecycle)
  if (!sameLifecycle(lifecycle, event.lifecycle)) setLifecycle(event.lifecycle)
  const ready = useMemo(() => {
    if (
      !settled ||
      !eventData ||
      !lifecycle ||
      !eventsData ||
      !unitsData ||
      !battlesData ||
      config.status !== "ready" ||
      !plan.data
    ) {
      return null
    }
    const synced = typeof progressData === "object" ? progressData : undefined
    const rosterUnits = rosterData ?? []
    const resolution = resolveLegendaryEventRunsAt(eventData, synced, nowMs)
    const runDates = legendaryEventRunDates(eventData)
    const unitsById = new Map(unitsData.map((unit) => [unit.id, unit]))
    const inputs: PlanInputs = {
      event: eventData,
      lanes: LEGENDARY_EVENT_LANE_IDS.map((laneId) => {
        const model = buildLanePointsModel(eventData[laneId])
        return {
          laneId,
          lane: eventData[laneId],
          model,
          progress: buildSyncedLaneProgress(model, synced?.[laneId]),
          battlePowers:
            laneBattlePowers(eventData[laneId].battleIds, battlesData) ?? [],
        }
      }),
      units: unitsData,
      roster: rosterUnits,
      config: config.config,
      lifecycle,
      resolution,
      nowMs,
      progress: synced,
      progressObservedAtMs,
      eventUnit: rosterUnits.find((unit) => unit.unitId === eventData.id),
      plan: plan.data,
      runStarts: runDates.starts,
      initialRarityOf: (unitId) =>
        unitsById.get(unitId as never)?.initialRarity,
      nameOf: (unitId) => unitName("Character", unitId),
    }
    const masterTable = buildMasterTable({
      events: eventsData.map((entry) => ({ event: entry })),
      units: unitsData,
      roster: rosterUnits,
      unitSet: "all",
      pointsMode: "all",
    })
    const totals = new Map(
      masterTable.rows.map((row) => [row.unitId, row.total])
    )
    return {
      inputs,
      runDates,
      masterTotal: (unitId: string) => totals.get(unitId) ?? 0,
      hordeMultiplier: (unitId: string) =>
        unitHordeMultiplier(config.config, unitId),
    }
  }, [
    settled,
    eventData,
    lifecycle,
    eventsData,
    unitsData,
    rosterData,
    battlesData,
    progressData,
    config,
    plan.data,
    progressObservedAtMs,
    nowMs,
    unitName,
  ])

  // The first complete inputs are kept for the life of the page, like the clock: a refetch or a
  // late translation load would otherwise restart the upgrade search (spec: the search restarts
  // only when its inputs change). Create still writes on the latest stored revision.
  const [frozen, setFrozen] = useState<Extract<
    PlanSource,
    { status: "ready" }
  > | null>(null)
  const plannable =
    event.lifecycle?.state !== undefined &&
    event.lifecycle.state !== "archived" &&
    config.status === "ready" &&
    Boolean(config.config.unitPower)
  if (
    !frozen &&
    plannable &&
    ready &&
    eventData &&
    goalTargets.status !== "loading"
  ) {
    setFrozen({
      status: "ready",
      event: eventData,
      ...ready,
      goalTargets:
        goalTargets.status === "ready" ? goalTargets.byUnit : NO_GOAL_TARGETS,
    })
  }

  if (!isAuthenticated) return { status: "signedOut" }
  if (frozen) {
    const { inputs } = frozen
    const economy = {
      runs: inputs.plan.runs ?? [],
      showPaidOptions: inputs.plan.showPaidOptions,
    }
    if (stepTargets(inputs, economy).length === 0) {
      return {
        status: "nothingToReach",
        event: frozen.event,
        reason: inputs.event.rewards ? "fullyAscended" : "noLadder",
      }
    }
    return frozen
  }
  if (failed || plan.status === "error") {
    return {
      status: "error",
      retry: () => {
        event.retry?.()
        void plan.refetch()
      },
    }
  }
  if (event.status === "ready" && !event.data && event.catalogSynced) {
    return { status: "missing" }
  }
  if (!eventData || !event.lifecycle) return { status: "loading" }
  if (event.lifecycle.state === "archived") {
    return { status: "finished", event: eventData }
  }
  if (config.status === "failed") {
    return { status: "noEstimates", event: eventData, missing: config.missing }
  }
  if (config.status === "ready" && !config.config.unitPower) {
    return { status: "noEstimates", event: eventData, missing: ["unitPower"] }
  }
  if (!ready || goalTargets.status !== "ready") {
    // A failed goal read plans without reusing goals rather than blocking the wizard.
    if (ready && goalTargets.status === "failed") {
      return {
        status: "ready",
        event: eventData,
        ...ready,
        goalTargets: NO_GOAL_TARGETS,
      }
    }
    return { status: "loading" }
  }
  return {
    status: "ready",
    event: eventData,
    ...ready,
    goalTargets: goalTargets.byUnit,
  }
}
