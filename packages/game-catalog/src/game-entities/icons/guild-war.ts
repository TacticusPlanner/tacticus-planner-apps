import { datamineAssetUrl } from "./asset-path"

// Guild War art: the zone pictures of the war map (by a zone's `visualId`), the buff badges (by the
// buff's effect, the part of its id between `Env` and the scope), and the attack token.

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
