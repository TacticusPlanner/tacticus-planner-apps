import type { TeamMode, TeamRuleCode } from "./types"

/** Every mode, in the order the page and the editor list them. */
export const TEAM_MODES = [
  "warOffense",
  "warDefense",
  "guildRaid",
  "tournamentArena",
  "horde",
  "campaign",
  "incursion",
] as const satisfies readonly TeamMode[]

/** Every rule code in the API's order, which is the order issues are listed in. */
export const TEAM_RULE_CODES = [
  "nameLength",
  "noMode",
  "tooFewCharacters",
  "unknownUnit",
  "modeNotCombinable",
  "tooManyCoreCharacters",
  "tooManyCoreMows",
  "mowsNotAllowed",
  "campaignRequired",
  "unknownCampaign",
  "coreCharacterMissing",
  "factionNotAllowed",
  "incursionRequired",
  "unknownIncursion",
  "noSharedIncursionFaction",
] as const satisfies readonly TeamRuleCode[]

export function isTeamMode(value: unknown): value is TeamMode {
  return (TEAM_MODES as readonly unknown[]).includes(value)
}

/** The API's limits (personal-teams): the rules mirror them, the API enforces them. */
export const TEAM_LIMITS = {
  minNameLength: 3,
  maxNameLength: 40,
  maxNotesLength: 300,
  maxTeams: 20,
  /** Every mode: MoWs do not count. */
  minCharacters: 3,
  maxWarCoreCharacters: 5,
  /** Core MoWs only: flex MoWs do not count. */
  maxWarCoreMows: 1,
} as const

/** Modes whose lineup is capped at 5 core characters and 1 core MoW. */
export const SIZE_LIMITED_MODES: readonly TeamMode[] = [
  "warOffense",
  "warDefense",
  "tournamentArena",
]

/**
 * Modes where a unit can be in only one team: Guild War offense and defense, each on its own. A
 * unit can be in an offense team and a defense team, and in any number of teams of other modes.
 */
const EXCLUSIVE_UNIT_MODES: readonly TeamMode[] = ["warOffense", "warDefense"]

/** Whether two teams' mode lists put a shared unit in conflict: a Guild War mode both have. */
export function unitModesClash(
  a: readonly TeamMode[],
  b: readonly TeamMode[]
): boolean {
  return EXCLUSIVE_UNIT_MODES.some(
    (mode) => a.includes(mode) && b.includes(mode)
  )
}

/** Modes a team can only have on their own. */
export const EXCLUSIVE_MODES: readonly TeamMode[] = ["campaign", "incursion"]
