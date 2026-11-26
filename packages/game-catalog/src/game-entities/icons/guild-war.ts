import { curatedAssetUrl, datamineAssetUrl } from "./asset-path"

// Guild War art: the zone pictures of the war map (by a zone's `visualId`), the buff badges (by the
// buff's effect, the part of its id between `Env` and the scope), the attack token, and the boards of
// the seasons' map pools.

/** The boards of every Guild War season's map pool, shipped as the game's board art
 *  (`sprites/boards/{boardId}_Visual.webp`) downscaled into curated/guild_war_boards/{boardId}.webp.
 *  `guild-war.test.ts` fails when this list and the directory drift apart. */
export const GUILD_WAR_BOARD_IDS: ReadonlySet<string> = new Set([
  "C1_15",
  "C1_18",
  "C1_23",
  "C1_37",
  "C1_70",
  "CE2_06",
  "EC1_09",
  "EMC1_06",
  "LE1_15",
  "LE1_21",
  "LHE_Desert_02",
  "LHE_Desert_03",
  "LHE_Desert_04",
  "LHE_Desert_05",
  "LHE_Desert_06",
  "MC1_11",
  "MC1_31",
  "PVP_desert_10",
])

const zoneFiles: Record<string, string> = {
  antiAirBattery: "antiair",
  armory: "amory",
  artilleryPosition: "artilelry",
  bunker: "bunker",
  fieldHospital: "fieldhospital",
  hq: "headquarters",
  landingPad: "landing_pad",
  radarStation: "radar_station",
  supplyDump: "supply",
  trenches: "trenches",
}

const buffFiles: Record<string, string> = {
  AngelsOfDeath: "angelsofdeath",
  ArmourSupplies: "armoursupplies",
  ArtillerySupport: "artillerysupport",
  DefenderHealthBuff: "defender_health_buff",
  FlakFire: "flakfire",
  Fortified: "fortified",
  Garrison: "garrison",
  ThinVeil: "thinveil",
  ValkyrieStrike: "valkyriestrike",
}

/** A Guild War zone's picture on the war map, by the zone's `visualId`; undefined for one the game
 *  ships no picture for. */
export function guildWarZoneIcon(visualId: string): string | undefined {
  const file = zoneFiles[visualId]
  return file
    ? datamineAssetUrl(`ui/ui_guild_wars_zones_${file}_perspective.webp`)
    : undefined
}

/** A Guild War buff's badge, by its id (`EnvFlakFire_Regional`); the game's generic Guild War buff
 *  badge for one without its own. */
export function guildWarBuffIcon(buffId: string): string {
  const effect = /^Env(.+?)\d*(?:_[A-Za-z]+)?$/.exec(buffId)?.[1]
  const file = (effect && buffFiles[effect]) ?? "guildwar_generic_buff"
  return datamineAssetUrl(`atlases/ui_icon_uniteffect_${file}_01.webp`)
}

/** The Guild War attack token. */
export function guildWarTokenIcon(): string {
  return datamineAssetUrl("ui/ui_icon_resource_token_guildwars.webp")
}

/** A Guild War map-pool board's picture; undefined for a board with none shipped yet (a season the
 *  game added after the last refresh), so the caller shows a placeholder instead of a broken image. */
export function guildWarBoardImage(boardId: string): string | undefined {
  return GUILD_WAR_BOARD_IDS.has(boardId)
    ? curatedAssetUrl(`guild_war_boards/${boardId}.webp`)
    : undefined
}
