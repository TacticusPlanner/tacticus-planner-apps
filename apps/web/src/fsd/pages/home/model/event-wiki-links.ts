// Static, definition-level links to the Tacticus Fandom wiki — not backend data, since this is a purely
// presentational concern (which reference page best explains this event), same as icon/color resolution
// elsewhere in this feature. Only definitions with a real, existing wiki article are listed here; the
// rest render without a link rather than guessing at a URL that doesn't exist (verified against the live
// wiki, not assumed from a definition's name — e.g. no Home Screen Event article exists at all).
const wikiUrlByDefinitionId: Partial<Record<string, string>> = {
  "campaign-event": "https://tacticus.fandom.com/wiki/Campaign",
  incursion: "https://tacticus.fandom.com/wiki/Incursion",
  "legendary-event":
    "https://tacticus.fandom.com/wiki/Legendary_Character_Events",
  "battle-pass": "https://tacticus.fandom.com/wiki/BattlePass",
  quest: "https://tacticus.fandom.com/wiki/Quest",
  "guild-raid-season": "https://tacticus.fandom.com/wiki/Guild_Raid",
  "guild-war-season": "https://tacticus.fandom.com/wiki/Guild_War",
  "new-character-event":
    "https://tacticus.fandom.com/wiki/New_Character_Events",
  "ta-faction-war": "https://tacticus.fandom.com/wiki/Tournament_Arena",
  "ta-power-ups": "https://tacticus.fandom.com/wiki/Tournament_Arena",
  "ta-conquest": "https://tacticus.fandom.com/wiki/Tournament_Arena",
  "ta-draft-power-ups": "https://tacticus.fandom.com/wiki/Tournament_Arena",
  "ta-infested-power-ups": "https://tacticus.fandom.com/wiki/Tournament_Arena",
  "hse-warp-surge": "https://tacticus.wiki.gg/wiki/Warp_Surge",
  "hse-training-rush": "https://tacticus.wiki.gg/wiki/Training_Rush",
  "hse-global-conflict-operations":
    "https://tacticus.wiki.gg/wiki/Conflict_Operations",
  "hse-arsenal-of-war": "https://tacticus.wiki.gg/wiki/Arsenal_of_War",
  "hse-machine-hunt": "https://tacticus.wiki.gg/wiki/Machine_Hunt",
  "hse-faction-boost": "https://tacticus.wiki.gg/wiki/Faction_Boost",
  "always-double-xp-sunday": "https://tacticus.fandom.com/wiki/HDTW_XP",
}

export function resolveEventWikiUrl(definitionId: string): string | undefined {
  return wikiUrlByDefinitionId[definitionId]
}
