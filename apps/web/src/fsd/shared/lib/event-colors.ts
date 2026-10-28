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
