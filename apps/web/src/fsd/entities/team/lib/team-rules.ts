import {
  EXCLUSIVE_MODES,
  SIZE_LIMITED_MODES,
  TEAM_LIMITS,
  TEAM_RULE_CODES,
} from "../model/team-modes"
import type { TeamFields, TeamRuleCode } from "../model/types"

/** A campaign a team can be built for: its allowed factions and the characters it starts with. */
export interface TeamCampaignFacts {
  alliesFactions: ReadonlySet<string>
  coreCharacterIds: readonly string[]
}

/** The catalog facts the rules read, built from the served catalog by `useTeamRuleFacts`. */
export interface TeamRuleFacts {
  /** Every catalog character's faction. */
  characterFactions: ReadonlyMap<string, string>
  mowIds: ReadonlySet<string>
  /** The non-Elite campaign groups, by group id. */
  campaigns: ReadonlyMap<string, TeamCampaignFacts>
  /** Each Incursion's allowed factions, by its MoW. */
  incursionFactionsByMowId: ReadonlyMap<string, ReadonlySet<string>>
}

/** The fields the rules read; a draft in the editor and a saved team both fit. */
export type TeamRuleInput = Pick<
  TeamFields,
  | "name"
  | "modes"
  | "characterIds"
  | "flexStartIndex"
  | "mowIds"
  | "mowFlexStartIndex"
  | "campaignGroupId"
  | "incursionMowIds"
>

/** How many of the lineup's characters are core: those before the flex section. */
export function coreCount(
  team: Pick<TeamFields, "characterIds" | "flexStartIndex">
) {
  return team.flexStartIndex ?? team.characterIds.length
}

/** How many of the lineup's MoWs are core: those before the MoW flex section (0 = all flex). */
export function coreMowCount(
  team: Pick<TeamFields, "mowIds" | "mowFlexStartIndex">
) {
  return team.mowFlexStartIndex ?? team.mowIds.length
}

/** The factions every chosen Incursion allows; undefined when no known Incursion is chosen. */
export function sharedIncursionFactions(
  incursionMowIds: readonly string[],
  facts: TeamRuleFacts
): ReadonlySet<string> | undefined {
  let shared: Set<string> | undefined
  for (const mowId of incursionMowIds) {
    const factions = facts.incursionFactionsByMowId.get(mowId)
    if (!factions) continue
    shared = shared
      ? new Set([...shared].filter((faction) => factions.has(faction)))
      : new Set(factions)
  }
  return shared
}

/** The factions the team's characters must come from, or undefined when any faction is allowed. */
export function allowedFactions(
  team: Pick<TeamFields, "modes" | "campaignGroupId" | "incursionMowIds">,
  facts: TeamRuleFacts
): ReadonlySet<string> | undefined {
  if (team.modes.includes("campaign") && team.campaignGroupId) {
    return facts.campaigns.get(team.campaignGroupId)?.alliesFactions
  }
  if (team.modes.includes("incursion")) {
    return sharedIncursionFactions(team.incursionMowIds, facts)
  }
  return undefined
}

type Broken = Set<TeamRuleCode>

/** Whether every known character is of an allowed faction; unknown ones are `unknownUnit`. */
function fromFactions(
  team: TeamRuleInput,
  facts: TeamRuleFacts,
  allowed: ReadonlySet<string>
) {
  return team.characterIds.every((id) => {
    const faction = facts.characterFactions.get(id)
    return faction === undefined || allowed.has(faction)
  })
}

function evaluateShape(
  team: TeamRuleInput,
  facts: TeamRuleFacts,
  broken: Broken
) {
  const modes = new Set(team.modes)
  const nameLength = team.name.trim().length
  if (
    nameLength < TEAM_LIMITS.minNameLength ||
    nameLength > TEAM_LIMITS.maxNameLength
  ) {
    broken.add("nameLength")
  }
  if (modes.size === 0) broken.add("noMode")
  if (team.characterIds.length < TEAM_LIMITS.minCharacters) {
    broken.add("tooFewCharacters")
  }
  if (
    team.characterIds.some((id) => !facts.characterFactions.has(id)) ||
    team.mowIds.some((id) => !facts.mowIds.has(id))
  ) {
    broken.add("unknownUnit")
  }
  const exclusive = EXCLUSIVE_MODES.some((mode) => modes.has(mode))
  if (exclusive && modes.size > 1) broken.add("modeNotCombinable")
  if (SIZE_LIMITED_MODES.some((mode) => modes.has(mode))) {
    if (coreCount(team) > TEAM_LIMITS.maxWarCoreCharacters) {
      broken.add("tooManyCoreCharacters")
    }
    if (coreMowCount(team) > TEAM_LIMITS.maxWarCoreMows) {
      broken.add("tooManyCoreMows")
    }
  }
  if (exclusive && team.mowIds.length > 0) broken.add("mowsNotAllowed")
}

function evaluateCampaign(
  team: TeamRuleInput,
  facts: TeamRuleFacts,
  broken: Broken
) {
  const campaign = team.modes.includes("campaign")
  if (campaign !== (team.campaignGroupId !== null)) {
    broken.add("campaignRequired")
  }
  if (team.campaignGroupId === null) return
  const group = facts.campaigns.get(team.campaignGroupId)
  if (!group) {
    broken.add("unknownCampaign")
    return
  }
  if (!campaign) return
  const core = new Set(team.characterIds.slice(0, coreCount(team)))
  if (group.coreCharacterIds.some((id) => !core.has(id))) {
    broken.add("coreCharacterMissing")
  }
  if (!fromFactions(team, facts, group.alliesFactions)) {
    broken.add("factionNotAllowed")
  }
}

function evaluateIncursion(
  team: TeamRuleInput,
  facts: TeamRuleFacts,
  broken: Broken
) {
  const incursion = team.modes.includes("incursion")
  if (incursion !== team.incursionMowIds.length > 0) {
    broken.add("incursionRequired")
  }
  if (team.incursionMowIds.length === 0) return
  if (
    team.incursionMowIds.some(
      (mowId) => !facts.incursionFactionsByMowId.has(mowId)
    )
  ) {
    broken.add("unknownIncursion")
  }
  const shared = sharedIncursionFactions(team.incursionMowIds, facts)
  if (!shared) return
  if (shared.size === 0) broken.add("noSharedIncursionFaction")
  if (incursion && !fromFactions(team, facts, shared)) {
    broken.add("factionNotAllowed")
  }
}

/**
 * The rules a team breaks, in the API's order (design D3): the same evaluation the API runs on
 * every save and read, so the editor can say why Save is unavailable before the API is asked.
 * The API stays the authority. Locked and unowned units never matter.
 */
export function evaluateTeamRules(
  team: TeamRuleInput,
  facts: TeamRuleFacts
): TeamRuleCode[] {
  const broken: Broken = new Set()
  evaluateShape(team, facts, broken)
  evaluateCampaign(team, facts, broken)
  evaluateIncursion(team, facts, broken)
  return TEAM_RULE_CODES.filter((code) => broken.has(code))
}

/**
 * The lineup characters a rule is about, so the editor can mark them: those outside the allowed
 * factions for `factionNotAllowed`, and the campaign's core characters missing from the core for
 * `coreCharacterMissing` (they may sit in the flex section).
 */
export function charactersConcerned(
  team: TeamRuleInput,
  facts: TeamRuleFacts
): { notAllowed: Set<string>; missingCore: Set<string> } {
  const notAllowed = new Set<string>()
  const missingCore = new Set<string>()
  const allowed = allowedFactions(team, facts)
  if (allowed) {
    for (const id of team.characterIds) {
      const faction = facts.characterFactions.get(id)
      if (faction !== undefined && !allowed.has(faction)) notAllowed.add(id)
    }
  }
  const group =
    team.modes.includes("campaign") && team.campaignGroupId
      ? facts.campaigns.get(team.campaignGroupId)
      : undefined
  if (group) {
    const core = new Set(team.characterIds.slice(0, coreCount(team)))
    for (const id of group.coreCharacterIds) {
      if (!core.has(id)) missingCore.add(id)
    }
  }
  return { notAllowed, missingCore }
}
