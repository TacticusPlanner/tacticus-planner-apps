// Color-per-category, mirroring @workspace/game-catalog's `rarityClass` convention: one CSS custom
// property pair (light/dark values live in packages/ui/src/styles/globals.css) per category, resolved
// here to Tailwind arbitrary-value classes. Keyed coarser than `definitionId` (one key per visual
// "family") so the legend stays as compact as the reference calendars' — a handful of colors, not one
// per definition.
export type EventColorKey =
  | "campaign"
  | "incursion"
  | "legendary"
  | "homeScreen"
  | "tournament"
  | "quest"
  | "guildWar"
  | "guildRaid"
  | "battlePass"
  | "newCharacter"
  | "gameVersion"
  | "doubleXp"
  | "doubleGold"
  | "default"

// Two definitions share the `StandingModifier` type but are visually distinct in every reference
// calendar (Double XP vs Double Gold), so they're keyed by id rather than type.
const colorKeyByDefinitionId: Partial<Record<string, EventColorKey>> = {
  "always-double-xp-sunday": "doubleXp",
  "always-double-gold-saturday": "doubleGold",
}

const colorKeyByDefinitionType: Record<string, EventColorKey> = {
  CampaignEvent: "campaign",
  Incursion: "incursion",
  LegendaryEvent: "legendary",
  HomeScreenEvent: "homeScreen",
  TournamentArena: "tournament",
  Quest: "quest",
  GuildWarSeason: "guildWar",
  GuildRaidSeason: "guildRaid",
  BattlePass: "battlePass",
  NewCharacterEvent: "newCharacter",
  GameVersionRelease: "gameVersion",
}

export function resolveEventColorKey(
  definitionId: string,
  definitionType: string | undefined
): EventColorKey {
  return (
    colorKeyByDefinitionId[definitionId] ??
    (definitionType && colorKeyByDefinitionType[definitionType]) ??
    "default"
  )
}

// Every class string below is written out in full (not composed via string interpolation) because
// Tailwind's content scanner matches literal substrings in source files — a template-built class name
// like `` `bg-[var(--event-${key})]` `` never appears verbatim anywhere, so no CSS would be generated
// for it. Solid colored bar/chip (desktop Gantt lanes): background + a foreground guaranteed to
// contrast it.
const barClassByColorKey: Record<EventColorKey, string> = {
  campaign: "bg-[var(--event-campaign)] text-[var(--event-bar-foreground)]",
  incursion: "bg-[var(--event-incursion)] text-[var(--event-bar-foreground)]",
  legendary: "bg-[var(--event-legendary)] text-[var(--event-bar-foreground)]",
  homeScreen:
    "bg-[var(--event-home-screen)] text-[var(--event-bar-foreground)]",
  tournament: "bg-[var(--event-tournament)] text-[var(--event-bar-foreground)]",
  quest: "bg-[var(--event-quest)] text-[var(--event-bar-foreground)]",
  guildWar: "bg-[var(--event-guild-war)] text-[var(--event-bar-foreground)]",
  guildRaid: "bg-[var(--event-guild-raid)] text-[var(--event-bar-foreground)]",
  battlePass:
    "bg-[var(--event-battle-pass)] text-[var(--event-bar-foreground)]",
  newCharacter:
    "bg-[var(--event-new-character)] text-[var(--event-bar-foreground)]",
  gameVersion:
    "bg-[var(--event-game-version)] text-[var(--event-bar-foreground)]",
  doubleXp: "bg-[var(--event-double-xp)] text-[var(--event-bar-foreground)]",
  doubleGold:
    "bg-[var(--event-double-gold)] text-[var(--event-bar-foreground)]",
  default: "bg-muted text-muted-foreground",
}

/** Left-accent tint (mobile list cards): a colored border stripe, card background stays neutral. */
const accentClassByColorKey: Record<EventColorKey, string> = {
  campaign: "border-l-[var(--event-campaign)]",
  incursion: "border-l-[var(--event-incursion)]",
  legendary: "border-l-[var(--event-legendary)]",
  homeScreen: "border-l-[var(--event-home-screen)]",
  tournament: "border-l-[var(--event-tournament)]",
  quest: "border-l-[var(--event-quest)]",
  guildWar: "border-l-[var(--event-guild-war)]",
  guildRaid: "border-l-[var(--event-guild-raid)]",
  battlePass: "border-l-[var(--event-battle-pass)]",
  newCharacter: "border-l-[var(--event-new-character)]",
  gameVersion: "border-l-[var(--event-game-version)]",
  doubleXp: "border-l-[var(--event-double-xp)]",
  doubleGold: "border-l-[var(--event-double-gold)]",
  default: "border-l-border",
}

export function eventBarClass(colorKey: EventColorKey): string {
  return barClassByColorKey[colorKey]
}

export function eventAccentClass(colorKey: EventColorKey): string {
  return accentClassByColorKey[colorKey]
}

// Every color key in legend display order (matches the reference calendars' left-to-right ordering:
// broad recurring content first, then the smaller irregular events, then standing modifiers last).
export const EVENT_COLOR_KEYS_IN_LEGEND_ORDER: EventColorKey[] = [
  "campaign",
  "incursion",
  "legendary",
  "battlePass",
  "guildWar",
  "guildRaid",
  "tournament",
  "homeScreen",
  "quest",
  "newCharacter",
  "gameVersion",
  "doubleXp",
  "doubleGold",
  "default",
]
