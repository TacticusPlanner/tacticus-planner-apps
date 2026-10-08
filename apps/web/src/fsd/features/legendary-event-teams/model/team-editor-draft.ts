import {
  derivedTeamCoverage,
  reconcileCoverage,
  teamDepthForRun,
  type LegendaryEventLane,
  type LegendaryEventRun,
  type LegendaryEventTeam,
  type LegendaryEventUnit,
} from "@/entities/legendary-event"

import type { TeamDraft } from "./plan-patches"

export const MAX_TEAM_MEMBERS = 5
export const TEAM_NAME_MAX_LENGTH = 60

type CoverageLane = Pick<
  LegendaryEventLane,
  "allowedUnitsFilter" | "unitsRestrictions"
>

/**
 * The editor's working state (design D3): `derived` is the coverage the current members derive,
 * `excluded` the derived objectives the user unticked. The checked chips — and what is saved — are
 * `derived − excluded`. `name` is null while the user has not typed one (the default name shows).
 */
export interface TeamEditorDraft {
  name: string | null
  memberUnitIds: string[]
  reserveUnitId: string | null
  derived: number[]
  excluded: number[]
  depth: number | null
}

export interface CoverageContext {
  lane: CoverageLane
  units: readonly LegendaryEventUnit[]
}

/** The checked objectives: derived and not unticked. */
export function checkedObjectives(draft: TeamEditorDraft): number[] {
  return draft.derived.filter((index) => !draft.excluded.includes(index))
}

/** A new team's draft, or a saved team's: the opt-outs are recovered as the objectives the stored
 *  members derive but the team does not store. */
export function initialEditorDraft(
  team: LegendaryEventTeam | undefined,
  run: LegendaryEventRun,
  context: CoverageContext
): TeamEditorDraft {
  if (!team) {
    return {
      name: null,
      memberUnitIds: [],
      reserveUnitId: null,
      derived: [],
      excluded: [],
      depth: null,
    }
  }
  const derived = derivedTeamCoverage(
    team.memberUnitIds,
    context.lane,
    context.units
  )
  return {
    name: team.name,
    memberUnitIds: [...team.memberUnitIds],
    reserveUnitId: team.reserveUnitId,
    derived,
    excluded: derived.filter((index) => !team.objectiveIndexes.includes(index)),
    depth: teamDepthForRun(team, run)?.expectedBattleClears ?? null,
  }
}

/** The draft with new members, its coverage reconciled against the previous derivation. */
function withMembers(
  draft: TeamEditorDraft,
  memberUnitIds: string[],
  context: CoverageContext
): TeamEditorDraft {
  const derived = derivedTeamCoverage(
    memberUnitIds,
    context.lane,
    context.units
  )
  const checked = reconcileCoverage(
    checkedObjectives(draft),
    draft.derived,
    derived
  )
  return {
    ...draft,
    memberUnitIds,
    derived,
    excluded: derived.filter((index) => !checked.includes(index)),
  }
}

/**
 * Adds the unit as the last member or removes it. A sixth member is refused (`refused`, draft
 * unchanged); adding the reserve moves it into the members.
 */
export function toggleMember(
  draft: TeamEditorDraft,
  unitId: string,
  context: CoverageContext
): { draft: TeamEditorDraft; refused: boolean } {
  if (draft.memberUnitIds.includes(unitId)) {
    return {
      draft: withMembers(
        draft,
        draft.memberUnitIds.filter((id) => id !== unitId),
        context
      ),
      refused: false,
    }
  }
  if (draft.memberUnitIds.length >= MAX_TEAM_MEMBERS) {
    return { draft, refused: true }
  }
  const next = withMembers(draft, [...draft.memberUnitIds, unitId], context)
  return {
    draft: {
      ...next,
      reserveUnitId:
        draft.reserveUnitId === unitId ? null : draft.reserveUnitId,
    },
    refused: false,
  }
}

/** Sets the unit as the reserve (leaving the members if it was one), or clears it when it already
 *  is the reserve. The reserve never affects coverage. */
export function toggleReserve(
  draft: TeamEditorDraft,
  unitId: string,
  context: CoverageContext
): TeamEditorDraft {
  if (draft.reserveUnitId === unitId) return { ...draft, reserveUnitId: null }
  const base = draft.memberUnitIds.includes(unitId)
    ? withMembers(
        draft,
        draft.memberUnitIds.filter((id) => id !== unitId),
        context
      )
    : draft
  return { ...base, reserveUnitId: unitId }
}

/** Unticks a checked derived objective or ticks it again. */
export function toggleObjective(
  draft: TeamEditorDraft,
  index: number
): TeamEditorDraft {
  if (!draft.derived.includes(index)) return draft
  return {
    ...draft,
    excluded: draft.excluded.includes(index)
      ? draft.excluded.filter((entry) => entry !== index)
      : [...draft.excluded, index],
  }
}

/** The default name: the checked objectives' labels joined by " · " (cut to the name limit), or
 *  the fallback ("Team N") when nothing is checked. */
export function defaultTeamName(
  checkedLabels: readonly string[],
  fallback: string
): string {
  const joined = checkedLabels.join(" · ")
  return (joined || fallback).slice(0, TEAM_NAME_MAX_LENGTH).trim()
}

/** The name that would be saved: the typed one, else (untouched or emptied) the default. */
export function effectiveTeamName(
  draft: TeamEditorDraft,
  defaultName: string
): string {
  return (draft.name ?? "").trim() || defaultName
}

/** Save needs at least one member and a 1–60 character name. */
export function canSaveDraft(draft: TeamEditorDraft, name: string): boolean {
  return (
    draft.memberUnitIds.length > 0 &&
    name.length > 0 &&
    name.length <= TEAM_NAME_MAX_LENGTH
  )
}

/** The submitted draft. */
export function toTeamDraft(draft: TeamEditorDraft, name: string): TeamDraft {
  return {
    name,
    memberUnitIds: draft.memberUnitIds,
    reserveUnitId: draft.reserveUnitId,
    objectiveIndexes: checkedObjectives(draft),
    expectedBattleClears: draft.depth,
  }
}
