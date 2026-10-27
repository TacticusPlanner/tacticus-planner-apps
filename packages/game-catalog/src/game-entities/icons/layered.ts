/** One sprite of a layered icon, placed in the icon's square box by percent of its side. */
export interface IconLayer {
  src: string
  left: number
  top: number
  width: number
  height: number
}

/**
 * An icon the game draws by stacking sprites (an ability badge is a rarity frame with the alliance
 * emblem on top). The layers are drawn in order; nothing combined is committed, so every file stays a
 * copy of the game's own.
 */
export interface LayeredIcon {
  layers: readonly IconLayer[]
}

/** A single image URL, or a layered icon. */
export type GameIcon = string | LayeredIcon
