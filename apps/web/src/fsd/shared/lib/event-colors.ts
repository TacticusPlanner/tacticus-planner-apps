// Color-per-category, mirroring @workspace/game-catalog's `rarityClass` convention: one CSS custom
// property pair (light/dark values live in packages/ui/src/styles/globals.css) per category, resolved
// here to Tailwind arbitrary-value classes. Used for the colored icon tiles of event headers (HSE,
// HRE); the home calendar uses the coarser families below.
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
  | "shop"
  | "crusade"
  | "default"

// Every class string below is written out in full (not composed via string interpolation) because
// Tailwind's content scanner matches literal substrings in source files — a template-built class name
// like `` `bg-[var(--event-${key})]` `` never appears verbatim anywhere, so no CSS would be generated
// for it. Solid colored tile: background + a foreground guaranteed to contrast it.
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
  shop: "bg-[var(--event-shop)] text-[var(--event-bar-foreground)]",
  crusade: "bg-[var(--event-crusade)] text-[var(--event-bar-foreground)]",
  default: "bg-muted text-muted-foreground",
}

export function eventBarClass(colorKey: EventColorKey): string {
  return barClassByColorKey[colorKey]
}

// Calendar color families (home-events-calendar): the game icon carries each event's identity, so
// the calendar only needs a few coarse colors, shown as a stripe or swatch beside it.
export type EventFamily =
  "campaigns" | "heroes" | "pvp" | "guild" | "passes" | "other"

const familyByDefinitionType: Record<string, EventFamily> = {
  CampaignEvent: "campaigns",
  Incursion: "campaigns",
  Quest: "campaigns",
  LegendaryEvent: "heroes",
  NewCharacterEvent: "heroes",
  HomeScreenEvent: "heroes",
  TournamentArena: "pvp",
  GuildRaidSeason: "guild",
  GuildWarSeason: "guild",
  CrusadeSeason: "guild",
  BattlePass: "passes",
  ShopEvent: "passes",
  GameVersionRelease: "passes",
  StandingModifier: "passes",
}

export function resolveEventFamily(
  definitionType: string | undefined
): EventFamily {
  return (
    (definitionType ? familyByDefinitionType[definitionType] : undefined) ??
    "other"
  )
}

// Written out in full for Tailwind's scanner (see above).
const familyStripeClass: Record<EventFamily, string> = {
  campaigns: "border-l-[var(--event-family-campaigns)]",
  heroes: "border-l-[var(--event-family-heroes)]",
  pvp: "border-l-[var(--event-family-pvp)]",
  guild: "border-l-[var(--event-family-guild)]",
  passes: "border-l-[var(--event-family-passes)]",
  other: "border-l-border",
}

const familySwatchClass: Record<EventFamily, string> = {
  campaigns: "bg-[var(--event-family-campaigns)]",
  heroes: "bg-[var(--event-family-heroes)]",
  pvp: "bg-[var(--event-family-pvp)]",
  guild: "bg-[var(--event-family-guild)]",
  passes: "bg-[var(--event-family-passes)]",
  other: "bg-muted-foreground/40",
}

/** A left border stripe in the family's color; pair it with a `border-l-*` width. */
export function eventFamilyStripeClass(family: EventFamily): string {
  return familyStripeClass[family]
}

export function eventFamilySwatchClass(family: EventFamily): string {
  return familySwatchClass[family]
}

/** Legend order: recurring content first, the smaller irregular events last. */
export const EVENT_FAMILIES_IN_LEGEND_ORDER: readonly EventFamily[] = [
  "campaigns",
  "heroes",
  "pvp",
  "guild",
  "passes",
  "other",
]
