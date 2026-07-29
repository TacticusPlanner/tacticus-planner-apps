import { ASSET_BASE_PATH } from "./asset-path"

const statIconFile = {
  health: "ui_icon_stat_health_01.png",
  damage: "ui_icon_stat_dmg_01.png",
  armour: "ui_icon_stat_armor_01.png",
  movement: "ui_icon_stat_move_01.png",
  melee: "ui_icon_stat_melee_01.png",
  ranged: "ui_icon_stat_rangedattack_01.png",
  hits: "ui_icon_stat_hit_01.png",
} satisfies Record<string, string>

export type StatIconKind = keyof typeof statIconFile

export function statIcon(kind: StatIconKind): string {
  return `${ASSET_BASE_PATH}/stat_icons/${statIconFile[kind]}`
}
