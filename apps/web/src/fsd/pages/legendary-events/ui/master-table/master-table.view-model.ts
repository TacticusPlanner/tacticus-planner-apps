import {
  laneBattlePowers,
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

/** Whether each unit set can be chosen: Unlocked needs a roster, In teams the plan list. */
export interface UnitSetAvailability {
  unlocked: "ready" | "noRoster"
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
  /** The URL asked for Estimated, which is unavailable: Remaining shows with a note. */
  estimatedFallback: boolean
  /** An event id among the selected ones; null sorts by the total. */
  sort: string | null
  q: string
}

/**
 * The controls' effective values (design D2, D4): the URL query with defaults and fallbacks. The
 * default selection is every active and upcoming event in hub order; an unknown id is dropped (a
 * query left with no known id falls back to the default); the unit set defaults to In teams when a
 * selected event's plan has a team, else All, and an unavailable set falls back to All; the points
 * mode defaults to Remaining, and Estimated while it is unavailable shows Remaining.
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

  const available = (set: MasterTableUnitSet) =>
    set === "all" ||
    (set === "unlocked" && unitSets.unlocked === "ready") ||
    (set === "inTeams" && unitSets.inTeams === "ready")
  const derivedUnitSet: MasterTableUnitSet =
    unitSets.inTeams === "ready" && hasTeams(selectedEventIds)
      ? "inTeams"
      : "all"
  const unitSet =
    query.units === null
      ? derivedUnitSet
      : available(query.units)
        ? query.units
        : "all"

  const estimatedFallback =
    query.points === "estimated" &&
    (estimated === "unavailable" || estimated === "noRoster")
  return {
    selectedEventIds,
    unitSet,
    points: estimatedFallback ? "remaining" : (query.points ?? "remaining"),
    estimatedFallback,
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

/** Estimated availability from the reads it needs. */
export function estimatedAvailability({
  config,
  battles,
  rosterKnown,
  events,
}: {
  config: ClearEstimateConfigState
  battles: Record<string, LegendaryEventBattle[]> | "loading" | "error"
  rosterKnown: boolean
  events: readonly Pick<LegendaryEvent, "id" | LegendaryEventLaneId>[]
}): EstimatedAvailability {
  if (!rosterKnown) return "noRoster"
  if (config.status === "failed" || battles === "error") return "unavailable"
  if (config.status === "loading" || battles === "loading") return "loading"
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
}: {
  events: readonly LegendaryEvent[]
  /** Undefined while the list loads or failed (no teams). */
  plans: readonly LegendaryEventPlan[] | undefined
  /** Undefined when progress failed (nothing cleared). */
  progress: readonly LegendaryEventProgress[] | undefined
  battles: Record<string, LegendaryEventBattle[]> | undefined
}): MasterTableEventInput[] {
  return events.map((event) => ({
    event,
    plan: plans?.find((plan) => plan.eventId === event.id),
    progress: progress?.find((entry) => entry.id === event.id),
    battlePowers: battles
      ? Object.fromEntries(
          LEGENDARY_EVENT_LANE_IDS.map((laneId) => [
            laneId,
            laneBattlePowers(event[laneId].battleIds, battles[event.id] ?? []),
          ])
        )
      : undefined,
  }))
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
