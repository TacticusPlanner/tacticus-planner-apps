import { ASSET_BASE_PATH } from "./asset-path"

/**
 * Ability icon URL, derived directly from the ability id (`AdaptiveStrategy` →
 * `ui_icon_ability2_AdaptiveStrategy.png`). A handful of ids have no shipped asset — the game itself
 * has none for them — so callers render through `EntityIcon`, which drops a missing image.
 */
export function abilityIcon(id: string): string {
  return `${ASSET_BASE_PATH}/abilities/ui_icon_ability2_${id}.png`
}
