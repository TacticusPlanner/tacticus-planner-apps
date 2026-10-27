import { datamineAssetUrl } from "./asset-path"

// Damage type strings on characters (meleeDamage/rangedDamage/activeAbilityDamage/
// passiveAbilityDamage) already match the shipped asset filenames verbatim (PascalCase), so — unlike
// traits/equipment — no override map is needed here.
export function damageTypeIcon(type: string): string {
  return datamineAssetUrl(
    `damage_profiles2/ui_icon_damage_profile2_${type}.webp`
  )
}
