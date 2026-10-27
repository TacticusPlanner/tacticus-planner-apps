import { datamineAssetUrl } from "./asset-path"

const statIconFile = {
  health: "ui_icon_stat_health_01.webp",
  damage: "ui_icon_stat_dmg_01.webp",
  armour: "ui_icon_stat_armor_01.webp",
  movement: "ui_icon_stat_move_01.webp",
  melee: "ui_icon_stat_melee_01.webp",
  ranged: "ui_icon_stat_rangedattack_01.webp",
  hits: "ui_icon_stat_hit_01.webp",
} satisfies Record<string, string>

export type StatIconKind = keyof typeof statIconFile

export function statIcon(kind: StatIconKind): string {
  return datamineAssetUrl(`atlases/${statIconFile[kind]}`)
}
