import { datamineAssetUrl } from "./asset-path"

// The game's status-effect badges (`atlases/ui_icon_uniteffect_*`), keyed by the effect name the
// ability text uses after `Buff_` / `Debuff_`. The files don't follow those names (Pinned is the
// game's "supressed" badge, Revealed is "reveal"), and one ships without the `_01` suffix.
const unitEffectFiles = {
  buffed: "buffed_01",
  infiltrate: "infiltrate_01",
  machineVengeance: "machine_vengeance_01",
  markerlight: "markerlight_01",
  neuroparasite: "neuroparasite_01",
  overwatching: "overwatch_01",
  pinned: "supressed_01",
  poisoned: "poisoned",
  revealed: "reveal_01",
  shield: "shield_01",
  stunned: "stunned_01",
  taunted: "taunted_01",
} as const

export type UnitEffectIcon = keyof typeof unitEffectFiles

/** A status effect's badge (a buff or debuff on a unit). */
export function unitEffectIcon(effect: UnitEffectIcon): string {
  return datamineAssetUrl(
    `atlases/ui_icon_uniteffect_${unitEffectFiles[effect]}.webp`
  )
}
