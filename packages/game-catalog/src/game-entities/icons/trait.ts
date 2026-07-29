import { ASSET_BASE_PATH } from "./asset-path"

// Trait ids come off the characters dataset as PascalCase keys (e.g. "ActOfFaith",
// "TeleportStrike"), while the shipped asset filenames are snake_case — mostly a direct
// transliteration, but a handful carry irregular names/spellings from Snowprint's own files and
// need an explicit override (ported from V1's trait-image.tsx traitFileOverrides).
const traitIconOverrides: Record<string, string> = {
  BeastSnagga: "beast_slayer",
  BlessingsOfKhorne: "blessing_of_khorne",
  CloseCombatWeakness: "combat_weakness",
  ContagionsOfNurgle: "contagions",
  Daemon: "daemonic",
  TeleportStrike: "teleport_strike",
  Diminutive: "diminuitive",
  FinalJustice: "only_in_death",
  LivingMetal: "livingmetall",
  MartialKatah: "martial_katah",
  MkXGravis: "mk_gravis",
  Psyker: "psychic",
  SuppressiveFire: "supressive_fire",
  TerminatorArmour: "terminator_amour",
  TwoManTeam: "2_man_team",
  WeaverOfFate: "weavers_of_fate",
  Unstoppable: "unknown",
  GetStuckIn: "unknown",
}

function pascalToSnake(id: string): string {
  return id.replace(/([a-z0-9])([A-Z])/g, "$1_$2").toLowerCase()
}

export function traitIcon(id: string): string {
  const slug = traitIconOverrides[id] ?? pascalToSnake(id)
  return `${ASSET_BASE_PATH}/traits/ui_icon_trait_${slug}_01.png`
}
