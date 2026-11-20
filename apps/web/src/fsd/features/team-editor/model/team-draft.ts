import type { Rarity } from "@workspace/game-domain"

import {
  EXCLUSIVE_MODES,
  SIZE_LIMITED_MODES,
  TEAM_LIMITS,
  coreCount,
  coreMowCount,
} from "@/entities/team"
import type { Team, TeamFields, TeamMode, TeamRuleFacts } from "@/entities/team"

/** The team being edited: the request fields, with notes as typed. */
export interface TeamDraft {
  name: string
  notes: string
  modes: TeamMode[]
  characterIds: string[]
  /** Index of the first flex character; null when every character is core. */
  flexStartIndex: number | null
  /** Core MoWs first, then flex ones. */
  mowIds: string[]
  /** Index of the first flex MoW; null when every MoW is core, 0 when every MoW is flex. */
  mowFlexStartIndex: number | null
  campaignGroupId: string | null
  incursionMowIds: string[]
  /** The rarity the team is prepared for, saved with it; null when it has none. */
  rarityCap: Rarity | null
}

export function emptyDraft(): TeamDraft {
  return {
    name: "",
    notes: "",
    modes: [],
    characterIds: [],
    flexStartIndex: null,
    mowIds: [],
    mowFlexStartIndex: null,
    campaignGroupId: null,
    incursionMowIds: [],
    rarityCap: null,
  }
}

/** A saved team as the editor starts from it, exactly as saved (an imported team's issues too). */
export function draftFromTeam(team: Team): TeamDraft {
  return {
    name: team.name,
    notes: team.notes ?? "",
    modes: [...team.modes],
    characterIds: [...team.characterIds],
    flexStartIndex: team.flexStartIndex,
    mowIds: [...team.mowIds],
    mowFlexStartIndex: team.mowFlexStartIndex,
    campaignGroupId: team.campaignGroupId,
    incursionMowIds: [...team.incursionMowIds],
    rarityCap: team.rarityCap,
  }
}

/** The request body: the name trimmed, blank notes as null. */
export function draftToFields(draft: TeamDraft): TeamFields {
  const notes = draft.notes.trim()
  return {
    name: draft.name.trim(),
    notes: notes === "" ? null : notes,
    modes: [...draft.modes],
    characterIds: [...draft.characterIds],
    flexStartIndex: draft.flexStartIndex,
    mowIds: [...draft.mowIds],
    mowFlexStartIndex: draft.mowFlexStartIndex,
    campaignGroupId: draft.campaignGroupId,
    incursionMowIds: [...draft.incursionMowIds],
    rarityCap: draft.rarityCap,
  }
}

/** The core and flex characters of a lineup. */
export function lineupSections(
  draft: Pick<TeamDraft, "characterIds" | "flexStartIndex">
) {
  const split = coreCount(draft)
  return {
    core: draft.characterIds.slice(0, split),
    flex: draft.characterIds.slice(split),
  }
}

/** Rebuilds the lineup from its sections; a team with no flex character saves a null index. */
function withSections(
  draft: TeamDraft,
  core: readonly string[],
  flex: readonly string[]
): TeamDraft {
  return {
    ...draft,
    characterIds: [...core, ...flex],
    flexStartIndex: flex.length > 0 ? core.length : null,
  }
}

/** Whether a selected mode caps the core (5 characters, 1 MoW). */
function sizeLimited(draft: Pick<TeamDraft, "modes">) {
  return draft.modes.some((mode) => SIZE_LIMITED_MODES.includes(mode))
}

/** Where a unit added now would go (design D12): core while the selected modes leave room. */
export function nextPlacement(
  draft: TeamDraft,
  kind: "character" | "mow"
): "core" | "flex" {
  if (!sizeLimited(draft)) return "core"
  return kind === "character"
    ? lineupSections(draft).core.length < TEAM_LIMITS.maxWarCoreCharacters
      ? "core"
      : "flex"
    : mowSections(draft).core.length < TEAM_LIMITS.maxWarCoreMows
      ? "core"
      : "flex"
}

/**
 * Adds a character: last in core while the selected modes leave room, else first in flex. Flex
 * characters stay flex.
 */
export function addCharacter(draft: TeamDraft, unitId: string): TeamDraft {
  if (draft.characterIds.includes(unitId)) return draft
  const { core, flex } = lineupSections(draft)
  return nextPlacement(draft, "character") === "core"
    ? withSections(draft, [...core, unitId], flex)
    : withSections(draft, core, [unitId, ...flex])
}

export function removeCharacter(draft: TeamDraft, unitId: string): TeamDraft {
  const { core, flex } = lineupSections(draft)
  return withSections(
    draft,
    core.filter((id) => id !== unitId),
    flex.filter((id) => id !== unitId)
  )
}

/** Moves a core character to the front of the flex section. */
export function makeFlex(draft: TeamDraft, unitId: string): TeamDraft {
  const { core, flex } = lineupSections(draft)
  if (!core.includes(unitId)) return draft
  return withSections(
    draft,
    core.filter((id) => id !== unitId),
    [unitId, ...flex]
  )
}

/** Moves a flex character to the end of the core. */
export function makeCore(draft: TeamDraft, unitId: string): TeamDraft {
  const { core, flex } = lineupSections(draft)
  if (!flex.includes(unitId)) return draft
  return withSections(
    draft,
    [...core, unitId],
    flex.filter((id) => id !== unitId)
  )
}

/** Whether a core character can be made flex: the API needs at least one core character. */
export function canMakeFlex(draft: TeamDraft, unitId: string) {
  const { core } = lineupSections(draft)
  return core.includes(unitId) && core.length > 1
}

/** The core and flex MoWs of a lineup. */
export function mowSections(
  draft: Pick<TeamDraft, "mowIds" | "mowFlexStartIndex">
) {
  const split = coreMowCount(draft)
  return {
    core: draft.mowIds.slice(0, split),
    flex: draft.mowIds.slice(split),
  }
}

/** Rebuilds the MoWs from their sections; no flex MoW saves a null index, all flex saves 0. */
function withMowSections(
  draft: TeamDraft,
  core: readonly string[],
  flex: readonly string[]
): TeamDraft {
  return {
    ...draft,
    mowIds: [...core, ...flex],
    mowFlexStartIndex: flex.length > 0 ? core.length : null,
  }
}

/** Adds a MoW: to core while no core MoW is present in a war draft, else first in flex. */
function addMow(draft: TeamDraft, unitId: string): TeamDraft {
  if (draft.mowIds.includes(unitId)) return draft
  const { core, flex } = mowSections(draft)
  return nextPlacement(draft, "mow") === "core"
    ? withMowSections(draft, [...core, unitId], flex)
    : withMowSections(draft, core, [unitId, ...flex])
}

export function removeMow(draft: TeamDraft, unitId: string): TeamDraft {
  const { core, flex } = mowSections(draft)
  return withMowSections(
    draft,
    core.filter((id) => id !== unitId),
    flex.filter((id) => id !== unitId)
  )
}

/** Moves a core MoW to the front of the flex MoWs; every MoW may be flex. */
export function makeMowFlex(draft: TeamDraft, unitId: string): TeamDraft {
  const { core, flex } = mowSections(draft)
  if (!core.includes(unitId)) return draft
  return withMowSections(
    draft,
    core.filter((id) => id !== unitId),
    [unitId, ...flex]
  )
}

/** Moves a flex MoW to the end of the core MoWs. */
export function makeMowCore(draft: TeamDraft, unitId: string): TeamDraft {
  const { core, flex } = mowSections(draft)
  if (!flex.includes(unitId)) return draft
  return withMowSections(
    draft,
    [...core, unitId],
    flex.filter((id) => id !== unitId)
  )
}

export function toggleMow(draft: TeamDraft, unitId: string): TeamDraft {
  return draft.mowIds.includes(unitId)
    ? removeMow(draft, unitId)
    : addMow(draft, unitId)
}

/**
 * Selects or clears a mode. Selecting Campaign or Incursion clears the MoWs (their teams have
 * none); clearing Campaign clears the campaign, and clearing Incursion its Incursions.
 */
export function toggleMode(draft: TeamDraft, mode: TeamMode): TeamDraft {
  if (draft.modes.includes(mode)) {
    return {
      ...draft,
      modes: draft.modes.filter((entry) => entry !== mode),
      campaignGroupId: mode === "campaign" ? null : draft.campaignGroupId,
      incursionMowIds: mode === "incursion" ? [] : draft.incursionMowIds,
    }
  }
  const exclusive = EXCLUSIVE_MODES.includes(mode)
  return {
    ...draft,
    modes: [...draft.modes, mode],
    mowIds: exclusive ? [] : draft.mowIds,
    mowFlexStartIndex: exclusive ? null : draft.mowFlexStartIndex,
  }
}

/** Chooses a campaign: the lineup becomes its core characters, all core. */
export function chooseCampaign(
  draft: TeamDraft,
  groupId: string,
  facts: TeamRuleFacts
): TeamDraft {
  const core = facts.campaigns.get(groupId)?.coreCharacterIds ?? []
  return {
    ...draft,
    campaignGroupId: groupId,
    characterIds: [...core],
    flexStartIndex: null,
  }
}

/** Sets the Incursions the team is for; changing them clears the lineup. */
export function setIncursions(
  draft: TeamDraft,
  incursionMowIds: readonly string[]
): TeamDraft {
  return {
    ...draft,
    incursionMowIds: [...incursionMowIds],
    characterIds: [],
    flexStartIndex: null,
  }
}

/** Why a mode cannot be selected right now; null when it can (or is selected). */
export type ModeBlock =
  | { reason: "exclusive"; mode: TeamMode }
  | { reason: "exclusiveBlocked"; mode: TeamMode }
  | { reason: "tooManyCore" }
  | { reason: "tooManyCoreMows" }

export function modeBlock(draft: TeamDraft, mode: TeamMode): ModeBlock | null {
  if (draft.modes.includes(mode)) return null
  const selectedExclusive = draft.modes.find((entry) =>
    EXCLUSIVE_MODES.includes(entry)
  )
  if (selectedExclusive) return { reason: "exclusive", mode: selectedExclusive }
  if (EXCLUSIVE_MODES.includes(mode) && draft.modes.length > 0) {
    return { reason: "exclusiveBlocked", mode }
  }
  if (SIZE_LIMITED_MODES.includes(mode)) {
    if (coreCount(draft) > TEAM_LIMITS.maxWarCoreCharacters) {
      return { reason: "tooManyCore" }
    }
    if (coreMowCount(draft) > TEAM_LIMITS.maxWarCoreMows) {
      return { reason: "tooManyCoreMows" }
    }
  }
  return null
}

/** Whether the team takes MoWs at all: Campaign and Incursion teams have none. */
export function takesMows(draft: Pick<TeamDraft, "modes">) {
  return draft.modes.every((mode) => !EXCLUSIVE_MODES.includes(mode))
}

/** The id of the divider between core and flex in the lineup band's sortable order. */
export const FLEX_DIVIDER = "__flex__"

/**
 * Applies a lineup band order: the units before `FLEX_DIVIDER` are core, the ones after it flex.
 * Refused (the draft is returned as it was) when it would leave no core character, or put a chosen
 * campaign's core character in flex.
 */
export function arrangeCharacters(
  draft: TeamDraft,
  order: readonly string[],
  lockedIds: ReadonlySet<string> = new Set()
): TeamDraft {
  const split = order.indexOf(FLEX_DIVIDER)
  if (split < 1) return draft
  const core = order.slice(0, split)
  const flex = order.slice(split + 1)
  if (flex.some((id) => lockedIds.has(id))) return draft
  return withSections(draft, core, flex)
}

/** Applies a lineup band order to the MoWs; every MoW may be flex. */
export function arrangeMows(
  draft: TeamDraft,
  order: readonly string[]
): TeamDraft {
  const split = order.indexOf(FLEX_DIVIDER)
  if (split < 0) return draft
  const core = order.slice(0, split)
  const flex = order.slice(split + 1)
  return {
    ...draft,
    mowIds: [...core, ...flex],
    mowFlexStartIndex: flex.length > 0 ? core.length : null,
  }
}

/** Where a unit is in the draft's lineup, or null when it is not in it. */
export function unitPlacement(
  draft: TeamDraft,
  kind: "character" | "mow",
  unitId: string
): "core" | "flex" | null {
  const sections =
    kind === "character" ? lineupSections(draft) : mowSections(draft)
  if (sections.core.includes(unitId)) return "core"
  if (sections.flex.includes(unitId)) return "flex"
  return null
}
