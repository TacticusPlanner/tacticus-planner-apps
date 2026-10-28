import { datamineAssetUrl } from "./asset-path"

// The game's own menu and tab art for its screens and modes, for places that name a mode or a
// section rather than an event or an entity.
const gameMenuIconFiles = {
  heroes: "atlases/ui_icon_tabs_heroes",
  battle: "atlases/ui_icon_tabs_battle",
  shop: "atlases/ui_icon_tabs_shop",
  guild: "atlases/ui_icon_tabs_social",
  guildRaid: "atlases/ui_icon_menu_guildboss",
  onslaught: "atlases/ui_icon_menu_battle_onslaught",
  quests: "atlases/ui_icon_menu_quests",
  raids: "fonts/raids",
  machinesOfWar: "liveevents/ui_gamemodeicon_mow",
  campaignEvent: "ui/ui_gamemodeicon_ce_generic",
  legendaryEvent: "atlases/ui_icon_event_lhe",
  heroReleaseEvent: "atlases/ui_icon_event_HRE",
  homeScreenEvent: "liveevents/ui_icon_resource_event_points_generic",
} as const

export type GameMenuIcon = keyof typeof gameMenuIconFiles

export function gameMenuIcon(key: GameMenuIcon): string {
  return datamineAssetUrl(`${gameMenuIconFiles[key]}.webp`)
}

// The four shops the planner covers, keyed by its shop ids. Guild War has no shop glyph; its
// emblem stands in.
const shopIconFiles: Record<string, string> = {
  guild: "fonts/GuildShop",
  war: "atlases/ui_icon_guildwars",
  "rogue-trader": "fonts/ElderShop",
  crusade: "fonts/crusadeShop",
}

/** A shop's icon, or `undefined` for a shop id the game has no art for. */
export function shopIcon(shopId: string): string | undefined {
  const file = shopIconFiles[shopId]
  return file ? datamineAssetUrl(`${file}.webp`) : undefined
}

/** The game's padlock, for a unit or slot that is not unlocked yet. */
export function lockIcon(): string {
  return datamineAssetUrl("atlases/ui_icon_lock.webp")
}

/** The game's power-level fist. */
export function powerIcon(): string {
  return datamineAssetUrl("fonts/power_level.webp")
}

/** The game's die, for a chance or a random roll. */
export function chanceIcon(): string {
  return datamineAssetUrl("fonts/chance.webp")
}
