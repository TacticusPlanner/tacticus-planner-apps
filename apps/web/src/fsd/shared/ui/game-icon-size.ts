/**
 * Game icon sizes are the app's icon and portrait tokens (ui-sizing skill, Icons). An item icon,
 * emblem or badge takes an `icon-*` step; a portrait takes a `portrait-*` step. No game icon is
 * below 16px, so `icon-xs` is not a game icon size.
 */

/** An `icon-*` step a game icon can take (16–48px). */
export type GameIconSize =
  "icon-sm" | "icon" | "icon-md" | "icon-lg" | "icon-xl" | "icon-2xl"

/** A `portrait-*` step (40, 64, 96, 128px). */
export type PortraitSize =
  "portrait-sm" | "portrait-md" | "portrait-lg" | "portrait-xl"

/** An `EntityIcon` size: an icon step, or a portrait step for a bare (ringless) portrait. A ringed
 *  unit portrait is `UnitPortrait`. */
export type EntityIconSize = GameIconSize | PortraitSize

// Literal class names, so Tailwind's scanner sees every one.
const CLASS_NAMES: Record<EntityIconSize, string> = {
  "icon-sm": "size-icon-sm",
  icon: "size-icon",
  "icon-md": "size-icon-md",
  "icon-lg": "size-icon-lg",
  "icon-xl": "size-icon-xl",
  "icon-2xl": "size-icon-2xl",
  "portrait-sm": "size-portrait-sm",
  "portrait-md": "size-portrait-md",
  "portrait-lg": "size-portrait-lg",
  "portrait-xl": "size-portrait-xl",
}

// A badge over a portrait is a third of it, never below 16px.
const BADGE_SIZES: Record<PortraitSize, GameIconSize> = {
  "portrait-sm": "icon-sm",
  "portrait-md": "icon",
  "portrait-lg": "icon-lg",
  "portrait-xl": "icon-xl",
}

/** The Tailwind size class for an `EntityIcon` size. */
export function entityIconClassName(size: EntityIconSize): string {
  return CLASS_NAMES[size]
}

/** The Tailwind size class for a unit portrait. */
export function portraitClassName(size: PortraitSize): string {
  return CLASS_NAMES[size]
}

/** The size of a badge (rank, rarity, lock, faction) on a portrait of this size. */
export function portraitBadgeSize(size: PortraitSize): GameIconSize {
  return BADGE_SIZES[size]
}
