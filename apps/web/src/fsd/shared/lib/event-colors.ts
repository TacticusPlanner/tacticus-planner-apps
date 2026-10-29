// Calendar color families (home-events-calendar): the game icon carries each event's identity, so
// the calendar only needs a few coarse colors, shown as a tinted fill with a stronger stripe beside it.
// Class names are written out in full so Tailwind's scanner finds them.
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

const familyStripeClass: Record<EventFamily, string> = {
  campaigns: "border-l-[var(--event-family-campaigns)]",
  heroes: "border-l-[var(--event-family-heroes)]",
  pvp: "border-l-[var(--event-family-pvp)]",
  guild: "border-l-[var(--event-family-guild)]",
  passes: "border-l-[var(--event-family-passes)]",
  other: "border-l-border",
}

// A wash of the family color over the card, so an entry reads as its family at a glance rather than
// only by its narrow stripe. Stronger in dark mode, where a light wash disappears into the card;
// `other` keeps the neutral surface.
const familySurfaceClass: Record<EventFamily, string> = {
  campaigns:
    "bg-(--event-family-campaigns)/20 hover:bg-(--event-family-campaigns)/30 dark:bg-(--event-family-campaigns)/30 dark:hover:bg-(--event-family-campaigns)/40",
  heroes:
    "bg-(--event-family-heroes)/20 hover:bg-(--event-family-heroes)/30 dark:bg-(--event-family-heroes)/30 dark:hover:bg-(--event-family-heroes)/40",
  pvp: "bg-(--event-family-pvp)/20 hover:bg-(--event-family-pvp)/30 dark:bg-(--event-family-pvp)/30 dark:hover:bg-(--event-family-pvp)/40",
  guild:
    "bg-(--event-family-guild)/20 hover:bg-(--event-family-guild)/30 dark:bg-(--event-family-guild)/30 dark:hover:bg-(--event-family-guild)/40",
  passes:
    "bg-(--event-family-passes)/20 hover:bg-(--event-family-passes)/30 dark:bg-(--event-family-passes)/30 dark:hover:bg-(--event-family-passes)/40",
  other: "bg-muted/50 hover:bg-muted",
}

/** The entry's tinted fill (with its hover); pair it with the stripe. */
export function eventFamilySurfaceClass(family: EventFamily): string {
  return familySurfaceClass[family]
}

/** A left border stripe in the family's color; pair it with a `border-l-*` width. */
export function eventFamilyStripeClass(family: EventFamily): string {
  return familyStripeClass[family]
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
