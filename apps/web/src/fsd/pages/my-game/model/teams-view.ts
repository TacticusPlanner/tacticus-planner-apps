import { TEAM_MODES, isTeamMode, unitModesClash } from "@/entities/team"
import type { TeamMode } from "@/entities/team"

/** The Mode filter: every team, or the teams with one mode. */
export type TeamsModeFilter = "all" | TeamMode

export function isTeamsModeFilter(value: unknown): value is TeamsModeFilter {
  return value === "all" || isTeamMode(value)
}

/** The teams the filter lists, in their saved order. */
export function filterTeamsByMode<T extends { modes: readonly TeamMode[] }>(
  teams: readonly T[],
  mode: TeamsModeFilter
): T[] {
  return mode === "all"
    ? [...teams]
    : teams.filter((team) => team.modes.includes(mode))
}

/**
 * The full order after the listed teams were rearranged (design D5, as V1's `Teams2` reducer):
 * only the slots the listed teams hold are rewritten, in their new order, so a team hidden by the
 * filter keeps its position. With A (Horde), B (Guild Raid), C (Horde) and Horde listed, moving C
 * above A gives C, B, A.
 */
export function reorderListedSlots(
  allIds: readonly string[],
  listedInNewOrder: readonly string[]
): string[] {
  const listed = new Set(listedInNewOrder)
  const queue = [...listedInNewOrder]
  return allIds.map((id) => (listed.has(id) ? (queue.shift() ?? id) : id))
}

/** The page layout (personal-teams): cards or a table; on a phone the table shows as a list. */
export type TeamsLayout = "cards" | "table"

export function isTeamsLayout(value: unknown): value is TeamsLayout {
  return value === "cards" || value === "table"
}

/** Group by: one list in play order, or a section per mode. */
export type TeamsGroupBy = "none" | "mode"

export function isTeamsGroupBy(value: unknown): value is TeamsGroupBy {
  return value === "none" || value === "mode"
}

/** A mode's section when grouped: its teams, in play order. */
export interface TeamsModeSection<T> {
  mode: TeamMode
  teams: T[]
}

/**
 * The teams grouped by mode in the page's mode order, skipping modes with no team. A team appears
 * once, under the first of its modes in that order; its other modes stay on its badges.
 */
export function groupTeamsByMode<T extends { modes: readonly TeamMode[] }>(
  teams: readonly T[]
): TeamsModeSection<T>[] {
  const sections = TEAM_MODES.map((mode) => ({ mode, teams: [] as T[] }))
  for (const team of teams) {
    const section = sections.find((entry) => team.modes.includes(entry.mode))
    section?.teams.push(team)
  }
  return sections.filter((section) => section.teams.length > 0)
}

type LineupTeam = {
  id: string
  name: string
  modes: readonly TeamMode[]
  characterIds: readonly string[]
  mowIds: readonly string[]
}

/** Names a lineup unit for the search: a character or a MoW, by id. */
export type TeamsUnitName = (
  kind: "Character" | "Mow",
  unitId: string
) => string

/**
 * The teams whose name or any unit's name (core and flex, characters and MoWs) contains the query,
 * ignoring case; every team for a blank query.
 */
export function searchTeams<T extends LineupTeam>(
  teams: readonly T[],
  query: string,
  unitName: TeamsUnitName,
  locale?: string
): T[] {
  const needle = query.trim().toLocaleLowerCase(locale)
  if (needle === "") return [...teams]
  const matches = (text: string) =>
    text.toLocaleLowerCase(locale).includes(needle)
  return teams.filter(
    (team) =>
      matches(team.name) ||
      team.characterIds.some((id) => matches(unitName("Character", id))) ||
      team.mowIds.some((id) => matches(unitName("Mow", id)))
  )
}

/**
 * For each team, the units it shares with another team that has a mode in common, core and flex,
 * in lineup order. A team sharing nothing is absent.
 */
export function sharedUnitsByTeam<T extends LineupTeam>(
  teams: readonly T[]
): ReadonlyMap<string, string[]> {
  const shared = new Map<string, string[]>()
  for (const team of teams) {
    const units = [...team.characterIds, ...team.mowIds]
    const found = units.filter((unitId) =>
      teams.some(
        (other) =>
          other.id !== team.id &&
          unitModesClash(team.modes, other.modes) &&
          (other.characterIds.includes(unitId) || other.mowIds.includes(unitId))
      )
    )
    if (found.length > 0) shared.set(team.id, found)
  }
  return shared
}

/** A lineup unit, by kind and id. */
export interface TeamLineupUnit {
  kind: "character" | "mow"
  id: string
}

/**
 * A team's lineup as cards and rows show it: the core characters, the flex units (characters,
 * then MoWs) and the core MoWs.
 */
export function teamLineup(team: {
  characterIds: readonly string[]
  flexStartIndex: number | null
  mowIds: readonly string[]
  mowFlexStartIndex: number | null
}) {
  const coreSplit = team.flexStartIndex ?? team.characterIds.length
  const mowSplit = team.mowFlexStartIndex ?? team.mowIds.length
  const unit =
    (kind: TeamLineupUnit["kind"]) =>
    (id: string): TeamLineupUnit => ({ kind, id })
  return {
    core: team.characterIds.slice(0, coreSplit).map(unit("character")),
    flex: [
      ...team.characterIds.slice(coreSplit).map(unit("character")),
      ...team.mowIds.slice(mowSplit).map(unit("mow")),
    ],
    coreMows: team.mowIds.slice(0, mowSplit).map(unit("mow")),
  }
}
