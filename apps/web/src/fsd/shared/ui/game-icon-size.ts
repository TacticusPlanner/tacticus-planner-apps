/**
 * The game icon size scale from the UI style guide (rule 6). Every datamine or curated icon is drawn
 * at one of these sizes, picked by its role rather than by the page.
 *
 * Two ramps: item icons (`inline`, `emblem`, `row`, `tile`) and unit portraits (`sm`, `md`, `lg`, and `hero`
 * only for a unit page's header). A badge over a portrait is a third of that portrait, never below
 * 16px, so its size names the portrait it sits on.
 */

export type PortraitSize = "sm" | "md" | "lg" | "hero"

/** An `EntityIcon` size: an item role, a badge on a portrait of that size, or a bare (ringless)
 *  portrait of that size. A ringed unit portrait is `UnitPortrait`. */
export type EntityIconSize =
  | "inline"
  | "emblem"
  | "row"
  | "tile"
  | `badge-${PortraitSize}`
  | `portrait-${PortraitSize}`

const PORTRAIT_CLASS_NAMES: Record<PortraitSize, string> = {
  sm: "size-10",
  md: "size-16",
  lg: "size-24",
  hero: "size-32",
}

const ENTITY_ICON_CLASS_NAMES: Record<EntityIconSize, string> = {
  // Next to text or a number: the 20px icon baseline, on every pointer.
  inline: "size-icon",
  // A solid emblem (the rarity hexagon) in a list or table row beside rank emblems: their open art
  // reads smaller than its box, so the solid one is drawn a step smaller to match.
  emblem: "size-6",
  // An item in a list or table row.
  row: "size-8",
  // An item in a card or grid.
  tile: "size-12",
  // A third of the portrait, at least 16px.
  "badge-sm": "size-4",
  "badge-md": "size-5",
  "badge-lg": "size-8",
  "badge-hero": "size-11",
  "portrait-sm": PORTRAIT_CLASS_NAMES.sm,
  "portrait-md": PORTRAIT_CLASS_NAMES.md,
  "portrait-lg": PORTRAIT_CLASS_NAMES.lg,
  "portrait-hero": PORTRAIT_CLASS_NAMES.hero,
}

/** The Tailwind size classes for an `EntityIcon` size. */
export function entityIconClassName(size: EntityIconSize): string {
  return ENTITY_ICON_CLASS_NAMES[size]
}

/** The Tailwind size classes for a unit portrait. */
export function portraitClassName(size: PortraitSize): string {
  return PORTRAIT_CLASS_NAMES[size]
}
