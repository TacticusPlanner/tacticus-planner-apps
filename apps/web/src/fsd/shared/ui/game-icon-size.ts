/**
 * The game icon size scale from the UI style guide (rule 6). Every datamine or curated icon is drawn
 * at one of these sizes, picked by its role rather than by the page.
 *
 * Two ramps: item icons (`inline`, `row`, `tile`) and unit portraits (`sm`, `md`, `lg`, and `hero`
 * only for a unit page's header). A badge over a portrait is a third of that portrait, never below
 * 16px, so its size names the portrait it sits on.
 */

export type PortraitSize = "sm" | "md" | "lg" | "hero"

export type ItemIconSize = "inline" | "row" | "tile" | `badge-${PortraitSize}`

const ITEM_ICON_CLASS_NAMES: Record<ItemIconSize, string> = {
  // Next to text or a number: 16px with a mouse, 20px on touch.
  inline: "size-4 pointer-coarse:size-5",
  // An item in a list or table row.
  row: "size-8",
  // An item in a card or grid.
  tile: "size-12",
  // A third of the portrait, at least 16px.
  "badge-sm": "size-4",
  "badge-md": "size-5",
  "badge-lg": "size-8",
  "badge-hero": "size-11",
}

const PORTRAIT_CLASS_NAMES: Record<PortraitSize, string> = {
  sm: "size-10",
  md: "size-16",
  lg: "size-24",
  hero: "size-32",
}

/** The Tailwind size classes for an item icon role. */
export function itemIconClassName(size: ItemIconSize): string {
  return ITEM_ICON_CLASS_NAMES[size]
}

/** The Tailwind size classes for a unit portrait. */
export function portraitClassName(size: PortraitSize): string {
  return PORTRAIT_CLASS_NAMES[size]
}
