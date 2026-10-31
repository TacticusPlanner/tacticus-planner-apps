import {
  MIN_TEAM_MEMBERS,
  derivedTeamCoverage,
  teamDepthForRun,
  withLanePrefix,
  type LegendaryEventLane,
  type LegendaryEventLaneId,
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
 * The editor's working state: `derived` is the coverage the current members derive, and it is
 * what the team covers and saves. `name` is null while the user has not typed one (the default
 * name shows).
 */
export interface TeamEditorDraft {
  name: string | null
  memberUnitIds: string[]
  reserveUnitId: string | null
  derived: number[]
  depth: number | null
}

export interface CoverageContext {
  lane: CoverageLane
  units: readonly LegendaryEventUnit[]
}

/** The covered objectives: everything the members derive. */
export function checkedObjectives(draft: TeamEditorDraft): number[] {
  return draft.derived
}

/** An empty new-team draft: no members or reserve, the name unset (the derived default shows)
 *  and no depth. Save and add another resets to it for the next team (design D3). */
export function emptyEditorDraft(): TeamEditorDraft {
  return {
    name: null,
    memberUnitIds: [],
    reserveUnitId: null,
    derived: [],
    depth: null,
  }
}

/** A new team's draft (empty, or from a suggestion's members in order), or a saved team's. Either
 *  way the coverage is what the members derive, whatever the saved team stored. A saved team's name field starts from `displayName` (the
 *  readable name of a team stored under its lane id, spec: editing offers the readable name), else
 *  its stored name. */
export function initialEditorDraft(
  team: LegendaryEventTeam | undefined,
  run: LegendaryEventRun,
  context: CoverageContext,
  initialMemberUnitIds: readonly string[] = [],
  displayName?: string
): TeamEditorDraft {
  if (!team) {
    return withMembers(
      emptyEditorDraft(),
      initialMemberUnitIds.slice(0, MAX_TEAM_MEMBERS),
      context
    )
  }
  return {
    name: displayName ?? team.name,
    memberUnitIds: [...team.memberUnitIds],
    reserveUnitId: team.reserveUnitId,
    derived: derivedTeamCoverage(
      team.memberUnitIds,
      context.lane,
      context.units
    ),
    depth: teamDepthForRun(team, run)?.expectedBattleClears ?? null,
  }
}

/** The draft with new members and the coverage they derive. */
function withMembers(
  draft: TeamEditorDraft,
  memberUnitIds: string[],
  context: CoverageContext
): TeamEditorDraft {
  return {
    ...draft,
    memberUnitIds,
    derived: derivedTeamCoverage(memberUnitIds, context.lane, context.units),
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

/** The default name: the lane's Greek letter, then the checked objectives' labels joined by
 *  " · ", or the fallback ("Team N") when nothing is checked (cut to the name limit). */
export function defaultTeamName(
  laneId: LegendaryEventLaneId,
  checkedLabels: readonly string[],
  fallback: string
): string {
  const joined = checkedLabels.join(" · ")
  return withLanePrefix(laneId, joined || fallback)
    .slice(0, TEAM_NAME_MAX_LENGTH)
    .trim()
}

/** The name that would be saved: the typed one, else (untouched or emptied) the default. */
export function effectiveTeamName(
  draft: TeamEditorDraft,
  defaultName: string
): string {
  return (draft.name ?? "").trim() || defaultName
}

/** Whether the draft has too few members to be a team (spec: a team needs at least three
 *  characters); the reserve does not count. */
export function draftNeedsMembers(draft: TeamEditorDraft): boolean {
  return draft.memberUnitIds.length < MIN_TEAM_MEMBERS
}

/** Save needs at least three members (the reserve aside) and a 1–60 character name. */
export function canSaveDraft(draft: TeamEditorDraft, name: string): boolean {
  return (
    !draftNeedsMembers(draft) &&
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
