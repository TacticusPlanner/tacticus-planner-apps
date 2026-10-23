import { gameAssetUrl } from "./asset-path"

// Damage type strings on characters (meleeDamage/rangedDamage/activeAbilityDamage/
// passiveAbilityDamage) already match the shipped asset filenames verbatim (PascalCase), so — unlike
// traits/equipment — no override map is needed here.
export function damageTypeIcon(type: string): string {
  return gameAssetUrl(`damage_icons/ui_icon_damage_profile2_${type}.webp`)
}
