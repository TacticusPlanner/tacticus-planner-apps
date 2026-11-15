/** What to draw when a game sprite fails to load (e.g. a unit the current datamine ships no art for). */
export type IconPlaceholderKind = "unit" | "ability" | "trait" | "generic"

// Icon helpers in @workspace/game-catalog build every URL from the game's own file names, so the
// kind of sprite can be read off the URL. Order matters: the first match wins.
const kindPatterns: ReadonlyArray<[RegExp, IconPlaceholderKind]> = [
  [/_RoundPortrait_|ui_image_portrait_|\/avatars\//i, "unit"],
  [/ui_icon_ability2?_/i, "ability"],
  [/ui_icon_trait_/i, "trait"],
]

/** Placeholder kind for a sprite URL; `generic` when the URL matches no known sprite family. */
export function placeholderKindForIcon(src: string): IconPlaceholderKind {
  for (const [pattern, kind] of kindPatterns) {
    if (pattern.test(src)) return kind
  }
  return "generic"
}
