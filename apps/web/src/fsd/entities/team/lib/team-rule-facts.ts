import type { TeamCampaignFacts, TeamRuleFacts } from "./team-rules"

/** Elite and Elite Mirror are difficulties of a storyline, not campaigns a team can name. */
export function isEliteCampaign(definition: { types: readonly string[] }) {
  return definition.types.some(
    (type) => type === "Elite" || type === "EliteMirror"
  )
}

/** Builds the rule facts from the served catalog, as the API builds its own (design D3). */
export function buildTeamRuleFacts(datasets: {
  characters: readonly { id: string; faction: string }[]
  mows: readonly { id: string }[]
  campaignDefinitions: readonly {
    groupId: string
    types: readonly string[]
    coreCharacters: readonly string[]
  }[]
  campaignBattles: readonly {
    campaignGroupId: string
    alliesFactions: readonly string[]
  }[]
  incursions: readonly { mowId: string; allowedFactions: readonly string[] }[]
  survivalEvents: readonly {
    id: string
    featuredCharacterId: string
    rules: {
      allowedFactionIds: readonly string[]
      mowsAllowed: boolean
      maxCharacters: number
    }
  }[]
}): TeamRuleFacts {
  // The served definition carries no factions; every battle of a group carries the same copy, so
  // the group's factions are read from its battles.
  const factionsByGroup = new Map<string, Set<string>>()
  for (const battle of datasets.campaignBattles) {
    const factions = factionsByGroup.get(battle.campaignGroupId) ?? new Set()
    for (const faction of battle.alliesFactions) factions.add(faction)
    factionsByGroup.set(battle.campaignGroupId, factions)
  }
  const campaigns = new Map<string, TeamCampaignFacts>()
  for (const definition of datasets.campaignDefinitions) {
    if (isEliteCampaign(definition)) continue
    campaigns.set(definition.groupId, {
      alliesFactions: factionsByGroup.get(definition.groupId) ?? new Set(),
      coreCharacterIds: [...definition.coreCharacters],
    })
  }
  return {
    characterFactions: new Map(
      datasets.characters.map((character) => [character.id, character.faction])
    ),
    mowIds: new Set(datasets.mows.map((mow) => mow.id)),
    campaigns,
    incursionFactionsByMowId: new Map(
      datasets.incursions.map((incursion) => [
        incursion.mowId,
        new Set(incursion.allowedFactions),
      ])
    ),
    survivalEvents: new Map(
      datasets.survivalEvents.map((survival) => [
        survival.id,
        {
          featuredCharacterId: survival.featuredCharacterId,
          allowedFactions: new Set(survival.rules.allowedFactionIds),
          maxCharacters: survival.rules.maxCharacters,
          mowsAllowed: survival.rules.mowsAllowed,
        },
      ])
    ),
  }
}
