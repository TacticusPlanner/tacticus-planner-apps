import {
  chanceIcon,
  damageTypeIcon,
  energyIcon,
  factionIcon,
  goldIcon,
  mowAmmoIcon,
  onslaughtAllianceIcon,
  statIcon,
  tileIcon,
  traitIcon,
  unitEffectIcon,
} from "@workspace/game-catalog"
import type {
  OnslaughtAllianceIcon,
  StatIconKind,
  TileIcon,
  UnitEffectIcon,
} from "@workspace/game-catalog"

// The inline game icon that goes in front of a styled ability-text token (V1 drew the same set from
// its own bundled images; V2 uses the datamine sprites). A style with no icon here renders as
// coloured text only.

const STAT_STYLES: Record<string, StatIconKind> = {
  Stat_Armor: "armour",
  Stat_Block: "block",
  Stat_Crit: "critDamage",
  Stat_CritDamage: "critDamage",
  Stat_Damage: "damage",
  Stat_Health: "health",
  Stat_Hits: "hits",
  Stat_Melee: "melee",
  Stat_Movement: "movement",
  Stat_Range: "ranged",
}

const CHANCE_STYLES = new Set(["Stat_Chance", "Stat_CritChance"])

// Style names that differ from the damage-type ids the sprites are named after.
const DAMAGE_STYLE_ALIASES: Record<string, string> = {
  Direct: "DirectDamage",
  Heavy: "HeavyRound",
}

const KNOWN_DAMAGE_TYPES = new Set([
  "Acid",
  "Bio",
  "Blast",
  "Bolter",
  "Chain",
  "DirectDamage",
  "Energy",
  "Enmitic",
  "Eviscerate",
  "Flame",
  "Gauss",
  "HeavyRound",
  "Las",
  "Melta",
  "Particle",
  "Physical",
  "Piercing",
  "Plasma",
  "Power",
  "Projectile",
  "Psychic",
  "Pulse",
  "Toxic",
])

const ALLIANCES: Record<string, OnslaughtAllianceIcon> = {
  Chaos: "Chaos",
  Imperial: "Imperial",
  Xenos: "Xenos",
}

const EFFECT_STYLES: Record<string, UnitEffectIcon> = {
  BUFF_no_underscore: "buffed",
  Buff_Infiltrate: "infiltrate",
  Buff_MachineVengeance: "machineVengeance",
  Buff_Overwatching: "overwatching",
  Buff_Shield: "shield",
  Debuff_Markerlight: "markerlight",
  Debuff_Neuroparasite: "neuroparasite",
  Debuff_Pinned: "pinned",
  Debuff_Poisoned: "poisoned",
  Debuff_Revealed: "revealed",
  Debuff_Stunned: "stunned",
  Debuff_Taunted: "taunted",
}

const TILE_STYLES: Record<string, TileIcon> = {
  Decoy: "decoy",
  Effect_Fire: "fire",
  Effect_Ice: "ice",
  Tile_Contamination: "contaminated",
  Tile_DespoiledGround: "despoiledGround",
  Tile_Trench: "trench",
}

// Trait style names whose catalog trait id is spelled differently.
const TRAIT_STYLES: Record<string, string> = {
  Act_Of_Faith: "ActOfFaith",
  Battle_Fatigue: "BattleFatigue",
  Big_Target: "BigTarget",
  BlessingsOfKhorne: "BlessingsOfKhorne",
  Camouflage: "Camouflage",
  ContagionsOfNurgle: "ContagionsOfNurgle",
  CrushingStrike: "CrushingStrike",
  Daemon: "Daemon",
  Dakka: "Dakka",
  Emplacement: "Emplacement",
  Explodes: "Explodes",
  FinalJustice: "FinalJustice",
  Flying: "Flying",
  GetStuckIn: "GetStuckIn",
  Healer: "Healer",
  Heavy_Weapon: "HeavyWeapon",
  Immune: "Immune",
  Indirect_Fire: "IndirectFire",
  Infiltrate: "Infiltrate",
  Instinctive_Behaviour: "InstinctiveBehaviour",
  Living_Metal: "LivingMetal",
  Mechanic: "Mechanic",
  Mechanical: "Mechanical",
  Mk_Gravis: "MkXGravis",
  Overwatch: "Overwatch",
  Parry: "Parry",
  PrioritisedEfficiency: "PrioritisedEfficiency",
  Psyker: "Psyker",
  RangedSpecialist: "RangedSpecialist",
  RapidAssault: "RapidAssault",
  Resilient: "Resilient",
  Shadow_In_The_Warp: "ShadowInTheWarp",
  Steppable: "Steppable",
  Summon: "Summon",
  Summon2: "Summon",
  Suppressive_Fire: "SuppressiveFire",
  Synapse: "Synapse",
  Teleport_Strike: "TeleportStrike",
  Teleport_Strike_short: "TeleportStrike",
  Terminator_Armor: "TerminatorArmour",
  ThrillSeekers: "ThrillSeekers",
  Unstoppable: "Unstoppable",
  Vehicle: "Vehicle",
  WeaverOfFate: "WeaverOfFate",
}

const RESOURCE_STYLES: Record<string, () => string> = {
  Resource_Gold: goldIcon,
  Resource_MachinesOfWarAmmo: mowAmmoIcon,
  Resource_Stamina: energyIcon,
}

/** The icon URL drawn before a token in `styleName`, or `undefined` for a style that has none. */
export function styleIcon(styleName: string): string | undefined {
  if (styleName.startsWith("Faction_")) {
    return factionIcon(styleName.slice("Faction_".length))
  }
  if (styleName.startsWith("Aliance_")) {
    const alliance = ALLIANCES[styleName.slice("Aliance_".length)]
    return alliance ? onslaughtAllianceIcon(alliance) : undefined
  }
  if (styleName.startsWith("DMG_")) {
    const raw = styleName.slice("DMG_".length)
    const type = DAMAGE_STYLE_ALIASES[raw] ?? raw
    return KNOWN_DAMAGE_TYPES.has(type) ? damageTypeIcon(type) : undefined
  }
  const stat = STAT_STYLES[styleName]
  if (stat) return statIcon(stat)
  if (CHANCE_STYLES.has(styleName)) return chanceIcon()
  const effect = EFFECT_STYLES[styleName]
  if (effect) return unitEffectIcon(effect)
  const tile = TILE_STYLES[styleName]
  if (tile) return tileIcon(tile)
  const trait = TRAIT_STYLES[styleName]
  if (trait) return traitIcon(trait)
  return RESOURCE_STYLES[styleName]?.()
}
