import {
  buildLanePointsModel,
  derivedTeamCoverage,
  isCompleteTeam,
  objectiveClearedThrough,
  teamDepthForRun,
  teamEffectiveDepth,
  teamPower,
  type ClearEstimate,
  type ClearEstimateRoster,
  type LanePointsModel,
  type LaneProgressView,
  type LegendaryEventLane,
  type LegendaryEventLaneId,
  type LegendaryEventPlan,
  type LegendaryEventRosterUnit,
  type LegendaryEventRun,
  type LegendaryEventTeam,
  type LegendaryEventUnit,
} from "@/entities/legendary-event"
import { teamPointsLeft } from "../../../lib/team-points"

import type { PickerGoalsPreview } from "@/features/legendary-event-plan"
import type { UnitPowerContext } from "@/shared/unit-power"

import type {
  ClearEstimatesViewModel,
  ReadValue,
} from "../legendary-event-page.view-model"

export interface TeamCardMember {
  unitId: string
  /** `undefined` when the roster could not be read. */
  owned: boolean | undefined
}

interface TeamCardCoverage {
  index: number
  /** Whether the current members still derive the stored objective (false after a catalog
   *  change): a derived one counts in points, one no longer derived shows muted. */
  derived: boolean
  points: number
  /** Cleared in every battle 1..the displayed depth (spec: covered objectives already cleared
   *  through the depth are marked): shown with the cleared mark, earning nothing. */
  clearedThrough: boolean
}

/** The canonical team card (design D4). */
export interface TeamCardViewModel {
  id: string
  name: string
  team: LegendaryEventTeam
  members: TeamCardMember[]
  reserve: TeamCardMember | null
  memberCount: number
  /** Fewer than three members (spec: a stored team below three characters is incomplete): the
   *  card warns, shows no depth and no calculation plays the team. */
  incomplete: boolean
  coverage: TeamCardCoverage[]
  /** The points this team alone can still earn over battles 1..`displayedDepth`, net of the synced
   *  progress (spec: a team card shows the points it has left within its depth); null without a
   *  displayed depth. */
  pointsLeft: number | null
  /** The current run's manual depth; null when that run has none. */
  expectedBattleClears: number | null
  /** The team's clear estimate on the lane; null when estimates are unavailable, no member is
   *  owned (design D3, D6) or the team is incomplete. */
  estimate: ClearEstimate | null
  /** What the card shows (design D2): the manual depth, else the estimate; null shows "Set depth"
   *  (an incomplete team shows none: its stored depth is kept for when it is completed). */
  displayedDepth: number | null
  /** Members (reserve excluded) the roster does not hold; 0 when ownership is unknown. */
  lockedMemberCount: number
  /** The non-reserve members' in-game power summed, items included and without horde-mode
   *  multipliers (a locked member adds 0); null when the roster could not be read or any owned
   *  member's power data is unavailable, never a partial sum. */
  teamPower: number | null
  /** Why `teamPower` is (or is not) shown: `pending` while the power data loads (a placeholder
   *  dash), `noRoster` when the roster is not synced or unreadable (its own reason, not "power
   *  unavailable"), `unavailable` when the power data is absent or failed. */
  teamPowerStatus: TeamPowerStatus
  sortOrder: number
}

type TeamPowerStatus = "ready" | "pending" | "noRoster" | "unavailable"

/** The power data the card total reads: the context (null when the `unit-power` dataset is
 *  absent), or its read state. */
export type TeamPowerSource = ReadValue<UnitPowerContext | null>

/** A lane's team estimator: the estimate for a set of non-reserve members. */
export type TeamEstimator = (
  memberUnitIds: readonly string[]
) => ClearEstimate | null

type CardLane = Pick<
  LegendaryEventLane,
  | "allowedUnitsFilter"
  | "unitsRestrictions"
  | "killPoints"
  | "battleIds"
  | "battlesPoints"
  | "defeatAll"
>

/**
 * A team's card (design D3, D4): members in position order with ownership, its stored objectives
 * reconciled against the current catalog (an objective the members no longer derive stays visible
 * but muted and out of the points), points per battle over the covered objectives, the current
 * run's manual depth only, and its clear estimate (calculated, never stored). An incomplete team
 * keeps its stored depth but has no estimate and no displayed depth.
 */
export function buildTeamCardViewModel(
  team: LegendaryEventTeam,
  lane: CardLane,
  units: readonly LegendaryEventUnit[],
  roster: readonly LegendaryEventRosterUnit[] | undefined,
  currentRun: LegendaryEventRun,
  estimateTeam?: TeamEstimator,
  powerSource: TeamPowerSource = null,
  /** `roster` keyed by unit id; the section builds it once for all its cards. */
  rosterById: ClearEstimateRoster | undefined = roster && rosterMap(roster),
  /** The lane's synced progress; undefined while it loads or failed (nothing counts as cleared). */
  progress: LaneProgressView | undefined = undefined,
  /** The lane's points model; the section builds it once for all its cards. */
  model: LanePointsModel = buildLanePointsModel(lane)
): TeamCardViewModel {
  const member = (unitId: string): TeamCardMember => ({
    unitId,
    owned: rosterById ? rosterById.has(unitId) : undefined,
  })
  const derived = new Set(derivedTeamCoverage(team.memberUnitIds, lane, units))
  const stored = new Set(team.objectiveIndexes)
  const members = team.memberUnitIds.map(member)
  const expectedBattleClears =
    teamDepthForRun(team, currentRun)?.expectedBattleClears ?? null
  const incomplete = !isCompleteTeam(team)
  const estimate = incomplete
    ? null
    : (estimateTeam?.(team.memberUnitIds) ?? null)
  const displayedDepth = incomplete
    ? null
    : teamEffectiveDepth(expectedBattleClears, estimate)
  const coverage = [...lane.unitsRestrictions]
    .sort((a, b) => a.index - b.index)
    .filter((objective) => stored.has(objective.index))
    .map((objective) => ({
      index: objective.index,
      derived: derived.has(objective.index),
      points: objective.points,
      clearedThrough:
        displayedDepth !== null &&
        objectiveClearedThrough(
          model,
          progress,
          objective.index,
          displayedDepth
        ),
    }))
  return {
    id: team.id,
    name: team.name,
    team,
    members,
    reserve: team.reserveUnitId ? member(team.reserveUnitId) : null,
    memberCount: team.memberUnitIds.length,
    incomplete,
    coverage,
    pointsLeft:
      displayedDepth === null
        ? null
        : teamPointsLeft(model, progress, {
            depth: displayedDepth,
            coveredObjectiveIndexes: coverage
              .filter((entry) => entry.derived)
              .map((entry) => entry.index),
          }),
    expectedBattleClears,
    estimate,
    displayedDepth,
    lockedMemberCount: members.filter((entry) => entry.owned === false).length,
    ...cardTeamPower(team.memberUnitIds, rosterById, powerSource),
    sortOrder: team.sortOrder,
  }
}

/** The roster keyed by unit id, as the card's ownership and power read it. */
export function rosterMap(
  roster: readonly LegendaryEventRosterUnit[]
): ClearEstimateRoster {
  return new Map(roster.map((unit) => [unit.unitId as string, unit]))
}

function cardTeamPower(
  memberUnitIds: readonly string[],
  rosterById: ClearEstimateRoster | undefined,
  powerSource: TeamPowerSource
): Pick<TeamCardViewModel, "teamPower" | "teamPowerStatus"> {
  if (!rosterById) return { teamPower: null, teamPowerStatus: "noRoster" }
  if (powerSource === "loading") {
    return { teamPower: null, teamPowerStatus: "pending" }
  }
  if (powerSource === "error" || powerSource === null) {
    return { teamPower: null, teamPowerStatus: "unavailable" }
  }
  const power = teamPower(memberUnitIds, rosterById, powerSource)
  return {
    teamPower: power,
    teamPowerStatus: power === null ? "unavailable" : "ready",
  }
}

/** The Teams section body (design D5): hidden when signed out, a skeleton while the plan, the
 *  catalog units or the synced progress (which picks the current run) load, an inline error whose
 *  Retry re-reads whichever failed, or the plan. Waiting on the progress keeps depth edits and the
 *  editor from capturing the run-1 default before the synced run is known. */
export type TeamsSectionState =
  | { kind: "hidden" }
  | { kind: "loading" }
  | { kind: "error"; retry: () => void }
  | {
      kind: "ready"
      plan: LegendaryEventPlan
      units: LegendaryEventUnit[]
      roster: LegendaryEventRosterUnit[] | undefined
    }

export function buildTeamsSectionState({
  enabled,
  query,
  units,
  retryUnits,
  roster,
  runPending,
}: {
  enabled: boolean
  query: {
    status: "pending" | "error" | "success"
    data: LegendaryEventPlan | undefined
    refetch: () => unknown
  }
  units: ReadValue<LegendaryEventUnit[]>
  retryUnits: () => void
  roster: ReadValue<LegendaryEventRosterUnit[] | undefined>
  /** The synced progress (hence the current run) is still loading. */
  runPending: boolean
}): TeamsSectionState {
  if (!enabled) return { kind: "hidden" }
  const planFailed = query.status === "error"
  const unitsFailed = units === "error"
  if (planFailed || unitsFailed) {
    const retry = () => {
      if (planFailed) void query.refetch()
      if (unitsFailed) retryUnits()
    }
    return { kind: "error", retry }
  }
  if (
    !query.data ||
    units === "loading" ||
    roster === "loading" ||
    runPending
  ) {
    return { kind: "loading" }
  }
  return {
    kind: "ready",
    plan: query.data,
    units,
    roster: roster === "error" ? undefined : roster,
  }
}

/** Move up / Move down availability on mobile: hidden at the ends. */
export function moveTargets(
  ids: readonly string[],
  id: string
): { up: string[] | null; down: string[] | null } {
  const index = ids.indexOf(id)
  const swap = (other: number) => {
    const next = [...ids]
    next[index] = ids[other]!
    next[other] = id
    return next
  }
  return {
    up: index > 0 ? swap(index - 1) : null,
    down: index >= 0 && index < ids.length - 1 ? swap(index + 1) : null,
  }
}

/** The editor picker's Goals Preview for one lane (Stage 6): the page's switch value, the preview
 *  roster when one exists, and the lane's estimated clears on it. */
export function pickerGoalsPreview(
  laneId: LegendaryEventLaneId,
  {
    enabled,
    available,
    preview,
    estimates,
    onToggle,
  }: {
    enabled: boolean
    available: boolean
    preview:
      | {
          roster: readonly LegendaryEventRosterUnit[]
          previewed: ReadonlySet<string>
        }
      | undefined
    estimates: ClearEstimatesViewModel | undefined
    onToggle: (enabled: boolean) => void
  }
): PickerGoalsPreview {
  const estimator =
    estimates?.kind === "ready" ? estimates.byLane[laneId] : undefined
  return {
    enabled,
    available: available && preview !== undefined,
    roster: preview?.roster,
    previewed: preview?.previewed ?? new Set(),
    clearsOf: estimator
      ? (unitId) => estimator.unit(unitId)?.depth ?? null
      : undefined,
    onToggle,
  }
}
