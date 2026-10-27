import overrides from "./ability-icon-overrides.json"
import { curatedAssetUrl, datamineAssetUrl } from "./asset-path"

// Ability ids whose game icon is spelled differently, or sits in the game's misspelled `abilties/`.
// A JSON file so apps/web's ability-text generator checks icons against the same paths.
const abilityIconOverrides: Record<string, string> = overrides

/**
 * Ability icon URL, derived directly from the ability id (`AdaptiveStrategy` →
 * `ui_icon_ability2_AdaptiveStrategy.webp`). A handful of ids have no shipped asset — the game itself
 * has none for them — so callers render through `EntityIcon`, which drops a missing image.
 */
export function abilityIcon(id: string): string {
  // The game's `LionHelmRelic` icon is different art; the planner keeps its own copy of this one.
  if (id === "LionHelm") {
    return curatedAssetUrl(`abilities/ui_icon_ability2_LionHelm.webp`)
  }
  return datamineAssetUrl(
    abilityIconOverrides[id] ?? `abilities/ui_icon_ability2_${id}.webp`
  )
}
