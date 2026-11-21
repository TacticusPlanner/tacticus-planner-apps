import { datamineAssetUrl } from "./asset-path"

// The game's hex-tile glyphs, for the hex effects and terrain ability text names (and the Decoy
// trait, which the game draws as a tile). Grass and broken
// ice (`Tile_Grass`, `Tile_Floe`) ship no glyph, so they have none here.
const tileFiles = {
  contaminated: "ui_icon_tile_effect_contaminated",
  decoy: "ui_icon_trait_tile_decoy",
  despoiledGround: "ui_icon_tile_effect_despoiled_ground",
  fire: "ui_icon_tile_effect_fire",
  ice: "ui_icon_tile_ice",
  trench: "ui_icon_trait_tile_trench",
} as const

export type TileIcon = keyof typeof tileFiles

/** A hex tile's glyph (a terrain or a hex effect). */
export function tileIcon(tile: TileIcon): string {
  return datamineAssetUrl(`atlases/${tileFiles[tile]}.webp`)
}
