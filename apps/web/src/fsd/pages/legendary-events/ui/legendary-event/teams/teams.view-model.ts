import {
  derivedTeamCoverage,
  teamDepthForRun,
  teamPointsPerBattle,
  type LegendaryEventLane,
  type LegendaryEventPlan,
  type LegendaryEventRosterUnit,
  type LegendaryEventRun,
  type LegendaryEventTeam,
  type LegendaryEventUnit,
} from "@/entities/legendary-event"

import type { ReadValue } from "../legendary-event-page.view-model"

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
}

/** The canonical team card (design D4). */
export interface TeamCardViewModel {
  id: string
  name: string
  team: LegendaryEventTeam
  members: TeamCardMember[]
  reserve: TeamCardMember | null
  memberCount: number
  coverage: TeamCardCoverage[]
  pointsPerBattle: number
  /** The current run's depth; null when that run has none ("Set depth"). */
  expectedBattleClears: number | null
  sortOrder: number
}

type CardLane = Pick<
  LegendaryEventLane,
  "allowedUnitsFilter" | "unitsRestrictions" | "killPoints"
>

/**
 * A team's card (design D3, D4): members in position order with ownership, its stored objectives
 * reconciled against the current catalog (an objective the members no longer derive stays visible
 * but muted and out of the points), points per battle over the covered objectives, and the
 * current run's depth only.
 */
export function buildTeamCardViewModel(
  team: LegendaryEventTeam,
  lane: CardLane,
  units: readonly LegendaryEventUnit[],
  roster: readonly LegendaryEventRosterUnit[] | undefined,
  currentRun: LegendaryEventRun
): TeamCardViewModel {
  const owned = roster
    ? new Set(roster.map((entry) => entry.unitId as string))
    : undefined
  const member = (unitId: string): TeamCardMember => ({
    unitId,
    owned: owned ? owned.has(unitId) : undefined,
  })
  const derived = new Set(derivedTeamCoverage(team.memberUnitIds, lane, units))
  const stored = new Set(team.objectiveIndexes)
  const coverage = [...lane.unitsRestrictions]
    .sort((a, b) => a.index - b.index)
    .filter((objective) => stored.has(objective.index))
    .map((objective) => ({
      index: objective.index,
      derived: derived.has(objective.index),
      points: objective.points,
    }))
  return {
    id: team.id,
    name: team.name,
    team,
    members: team.memberUnitIds.map(member),
    reserve: team.reserveUnitId ? member(team.reserveUnitId) : null,
    memberCount: team.memberUnitIds.length,
    coverage,
    pointsPerBattle: teamPointsPerBattle(
      lane,
      coverage.filter((entry) => entry.derived).map((entry) => entry.index)
    ),
    expectedBattleClears:
      teamDepthForRun(team, currentRun)?.expectedBattleClears ?? null,
    sortOrder: team.sortOrder,
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
