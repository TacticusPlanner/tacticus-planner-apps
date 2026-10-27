import { datamineAssetUrl, gameAssetUrl } from "./asset-path"

// Ability ids whose game icon is spelled differently, or sits in the game's misspelled `abilties/`.
const abilityIconOverrides: Record<string, string> = {
  DaemonfleshPlate: "abilities/ui_icon_ability2_DaemonFleshPlate.webp",
  EctoplasmaCannon: "abilties/ui_icon_ability2_EctoplasmaCannon.webp",
  NetherRealmCasket: "abilities/ui_icon_ability2_NetherrealmCasket.webp",
}

/**
 * Ability icon URL, derived directly from the ability id (`AdaptiveStrategy` →
 * `ui_icon_ability2_AdaptiveStrategy.webp`). A handful of ids have no shipped asset — the game itself
 * has none for them — so callers render through `EntityIcon`, which drops a missing image.
 */
export function abilityIcon(id: string): string {
  // The game ships this one as `LionHelmRelic`; until it is mapped, the planner's own copy is used.
  if (id === "LionHelm") {
    return gameAssetUrl(`abilities/ui_icon_ability2_LionHelm.webp`)
  }
  return datamineAssetUrl(
    abilityIconOverrides[id] ?? `abilities/ui_icon_ability2_${id}.webp`
  )
}
