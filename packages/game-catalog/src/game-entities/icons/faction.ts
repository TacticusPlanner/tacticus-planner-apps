import { datamineAssetUrl } from "./asset-path"

// The game's emblem file per faction id (`atlases/ui_icon_faction_<key>_01.webp`); the keys don't
// follow the ids (`Ultramarines` -> `ultramarine`, `Sisterhood` -> `adeptas`).
const factionIconKeys: Record<string, string> = {
  AdeptusAstartes: "adeptus_astartes",
  AdeptusMechanicus: "adeptus_mechanicus",
  Aeldari: "aeldari",
  AstraMilitarum: "astra_militarum",
  BlackLegion: "black_legion",
  BlackTemplars: "black_templars",
  BloodAngels: "blood_angels",
  Custodes: "custodes",
  DarkAngels: "dark_angels",
  DeathGuard: "death_guard",
  EmperorsChildren: "emperors_children",
  Genestealers: "genestealers",
  LeaguesOfVotann: "votann",
  Necrons: "necron",
  Orks: "orks",
  Sisterhood: "adeptas",
  SpaceWolves: "space_wolves",
  Tau: "tau",
  TheLostAndTheDamned: "the_lost_and_the_damned",
  ThousandSons: "thousand_sons",
  Tyranids: "tyranids",
  Ultramarines: "ultramarine",
  WorldEaters: "world_eaters",
}

/** A faction's emblem, or `undefined` for an id with none (the faction-less NPC bucket `Objects`). */
export function factionIcon(factionId: string): string | undefined {
  const key = factionIconKeys[factionId]
  return key
    ? datamineAssetUrl(`atlases/ui_icon_faction_${key}_01.webp`)
    : undefined
}
