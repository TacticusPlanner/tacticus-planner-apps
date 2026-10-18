import {
  currentLegendaryEventRun,
  laneBattlePowers,
  resolveLegendaryEventRunsAt,
  LEGENDARY_EVENT_LANE_IDS,
  type ClearEstimateConfigState,
  type LegendaryEvent,
  type LegendaryEventBattle,
  type LegendaryEventLaneId,
  type LegendaryEventPlan,
  type LegendaryEventProgress,
  type MasterTableEventInput,
  type MasterTablePointsMode,
  type MasterTableRow,
  type MasterTableUnitSet,
} from "@/entities/legendary-event"

export const UNIT_SETS = [
  "all",
  "unlocked",
  "inTeams",
] as const satisfies readonly MasterTableUnitSet[]
export const POINTS_MODES = [
  "remaining",
  "all",
  "estimated",
] as const satisfies readonly MasterTablePointsMode[]

/** The URL query as read (design D2): `events` null when absent (default selection), [] when the
 *  user unticked every event; the other fields null when absent or invalid. */
export interface MasterTableQuery {
  events: string[] | null
  units: MasterTableUnitSet | null
  points: MasterTablePointsMode | null
  sort: string | null
  q: string
}

const oneOf = <T extends string>(values: readonly T[], value: string | null) =>
  values.find((entry) => entry === value) ?? null

export function parseMasterTableQuery(
  params: URLSearchParams
): MasterTableQuery {
  const events = params.get("events")
  return {
    events:
      events === null
        ? null
        : events
            .split(",")
            .map((id) => id.trim())
            .filter(Boolean),
    units: oneOf(UNIT_SETS, params.get("units")),
    points: oneOf(POINTS_MODES, params.get("points")),
    sort: params.get("sort") || null,
    q: params.get("q") ?? "",
  }
}

/** One picker entry, in hub order; `archived` entries sit below the divider. */
export interface MasterTablePickerEvent {
  id: string
  archived: boolean
}

/** The roster read as the master table sees it: `noRoster` when it failed or never synced. */
export type RosterAvailability = "ready" | "loading" | "noRoster"

/** Whether each unit set can be chosen: Unlocked needs a roster, In teams the plan list. */
export interface UnitSetAvailability {
  unlocked: RosterAvailability
  inTeams: "ready" | "loading" | "failed"
}

/** Estimated needs clear estimates (config and every selected event's battle powers) and a
 *  roster (design D4). */
export type EstimatedAvailability =
  "ready" | "loading" | "unavailable" | "noRoster"

export interface MasterTableState {
  selectedEventIds: string[]
  unitSet: MasterTableUnitSet
  points: MasterTablePointsMode
  /** The URL asked for Estimated, which is unavailable: Remaining shows with a note naming the
   *  cause; null otherwise. */
  estimatedFallback: "unavailable" | "noRoster" | null
  /** An input the effective unit set or points mode depends on is still loading: the table shows
   *  a skeleton rather than rows that flip once it settles. */
  pending: boolean
  /** An event id among the selected ones; null sorts by the total. */
  sort: string | null
  q: string
}

/**
 * The controls' effective values (design D2, D4): the URL query with defaults and fallbacks. The
 * default selection is every active and upcoming event in hub order; an unknown id is dropped (a
 * query left with no known id falls back to the default); the unit set defaults to In teams when a
 * selected event's plan has a team, else All, and an unavailable set falls back to All; the points
 * mode defaults to Remaining, and Estimated while it is unavailable shows Remaining. A requested
 * set or mode whose input is still loading is kept (with `pending`), never swapped for the fallback
 * until that input settled.
 */
export function resolveMasterTableState({
  query,
  pickerEvents,
  hasTeams,
  unitSets,
  estimated,
}: {
  query: MasterTableQuery
  pickerEvents: readonly MasterTablePickerEvent[]
  /** Whether any plan of the given events has a team; false while plans load or failed. */
  hasTeams: (eventIds: readonly string[]) => boolean
  unitSets: UnitSetAvailability
  estimated: EstimatedAvailability
}): MasterTableState {
  const known = new Set(pickerEvents.map((event) => event.id))
  const defaultSelection = pickerEvents
    .filter((event) => !event.archived)
    .map((event) => event.id)
  const requested = query.events?.filter((id) => known.has(id))
  const selectedEventIds =
    query.events === null ||
    (requested?.length === 0 && query.events.length > 0)
      ? defaultSelection
      : // Picker order, whatever order the link listed them in.
        pickerEvents
          .map((event) => event.id)
          .filter((id) => requested?.includes(id))

  const availability = (set: MasterTableUnitSet) =>
    set === "all"
      ? "ready"
      : set === "unlocked"
        ? unitSets.unlocked
        : unitSets.inTeams
  const derivedUnitSet: MasterTableUnitSet =
    unitSets.inTeams === "ready" && hasTeams(selectedEventIds)
      ? "inTeams"
      : "all"
  const unitSetLoading =
    query.units === null
      ? // The default depends on the plans: All now could turn into In teams.
        unitSets.inTeams === "loading"
      : availability(query.units) === "loading"
  const unitSet =
    query.units === null
      ? derivedUnitSet
      : availability(query.units) === "ready" || unitSetLoading
        ? query.units
        : "all"

  const estimatedFallback =
    query.points === "estimated" &&
    (estimated === "unavailable" || estimated === "noRoster")
      ? estimated
      : null
  const points =
    estimatedFallback === null ? (query.points ?? "remaining") : "remaining"
  return {
    selectedEventIds,
    unitSet,
    points,
    estimatedFallback,
    pending:
      unitSetLoading || (points === "estimated" && estimated === "loading"),
    sort:
      query.sort !== null && selectedEventIds.includes(query.sort)
        ? query.sort
        : null,
    q: query.q,
  }
}

/** The search params after one control change; a null value removes the parameter. */
export function nextMasterTableParams(
  params: URLSearchParams,
  changes: Partial<
    Record<"events" | "units" | "points" | "sort" | "q", string | null>
  >
): URLSearchParams {
  const next = new URLSearchParams(params)
  for (const [key, value] of Object.entries(changes)) {
    if (value === null || value === undefined || value === "") {
      // An empty selection must survive: it is the "pick at least one event" state.
      if (key === "events" && value === "") next.set(key, "")
      else next.delete(key)
    } else {
      next.set(key, value)
    }
  }
  return next
}

/** Estimated availability from the reads it needs: unavailable without power data (the
 *  `unit-power` dataset absent) as when a read failed. */
export function estimatedAvailability({
  config,
  battles,
  roster,
  events,
}: {
  config: ClearEstimateConfigState
  battles: Record<string, LegendaryEventBattle[]> | "loading" | "error"
  roster: RosterAvailability
  events: readonly Pick<LegendaryEvent, "id" | LegendaryEventLaneId>[]
}): EstimatedAvailability {
  if (roster === "noRoster") return "noRoster"
  if (config.status === "failed" || battles === "error") return "unavailable"
  if (
    roster === "loading" ||
    config.status === "loading" ||
    battles === "loading"
  ) {
    return "loading"
  }
  if (!config.config.unitPower) return "unavailable"
  const allPowers = events.every((event) =>
    LEGENDARY_EVENT_LANE_IDS.every(
      (laneId) =>
        laneBattlePowers(event[laneId].battleIds, battles[event.id] ?? []) !==
        null
    )
  )
  return allPowers ? "ready" : "unavailable"
}

/** The `buildMasterTable` event inputs for the selected events, in selection order. */
export function masterTableEventInputs({
  events,
  plans,
  progress,
  battles,
  nowMs,
}: {
  events: readonly LegendaryEvent[]
  /** Undefined while the list loads or failed (no teams). */
  plans: readonly LegendaryEventPlan[] | undefined
  /** Undefined when progress failed (nothing cleared). */
  progress: readonly LegendaryEventProgress[] | undefined
  battles: Record<string, LegendaryEventBattle[]> | undefined
  /** The clock the run each event's depths are read for is resolved at. */
  nowMs: number
}): MasterTableEventInput[] {
  return events.map((event) => {
    const entry = progress?.find((candidate) => candidate.id === event.id)
    return {
      event,
      plan: plans?.find((plan) => plan.eventId === event.id),
      progress: entry,
      run: currentLegendaryEventRun(
        resolveLegendaryEventRunsAt(event, entry, nowMs)
      ),
      battlePowers: battles
        ? Object.fromEntries(
            LEGENDARY_EVENT_LANE_IDS.map((laneId) => [
              laneId,
              laneBattlePowers(
                event[laneId].battleIds,
                battles[event.id] ?? []
              ),
            ])
          )
        : undefined,
    }
  })
}

/** The Total group's second figure: Σ objectives (All, Unlocked) or Σ teams (In teams). */
export function rowDetailTotal(
  row: MasterTableRow,
  eventIds: readonly string[],
  unitSet: MasterTableUnitSet
): number {
  return eventIds.reduce((sum, eventId) => {
    const cell = row.cells[eventId]
    if (!cell) return sum
    return sum + (unitSet === "inTeams" ? cell.teamCount : cell.objectivesCount)
  }, 0)
}

type ReadStatus = "loading" | "ready" | "error"

/**
 * Whether the page has settled enough to record `legendary_event_master_table_viewed`: the
 * catalog (events, units) is ready and the plans, roster and clear-estimate config are no longer
 * loading (a failure counts as settled: the fallback is what the user sees), nor are the battles
 * while Estimated is selected, and the effective unit set and points mode are not pending.
 */
export function masterTableViewSettled({
  events,
  units,
  plans,
  roster,
  config,
  battles,
  state,
}: {
  events: ReadStatus
  units: ReadStatus
  plans: ReadStatus
  roster: ReadStatus
  config: ClearEstimateConfigState["status"]
  battles: ReadStatus
  state: Pick<MasterTableState, "points" | "pending">
}): boolean {
  return (
    events === "ready" &&
    units === "ready" &&
    plans !== "loading" &&
    roster !== "loading" &&
    config !== "loading" &&
    (state.points !== "estimated" || battles !== "loading") &&
    !state.pending
  )
}
