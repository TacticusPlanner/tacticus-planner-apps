// Upgrade-material icons map directly from the upgrade id. Missing assets fall back to the generic
// "unknown" icon (resolve via an <img onError> in the UI).
export const upgradeIconFallback =
  "/snowprint_assets/upgrade_materials/ui_icon_upgrade_unknown.png"

export function upgradeIcon(id: string): string {
  return `/snowprint_assets/upgrade_materials/ui_icon_upgrade_${id}.png`
}
