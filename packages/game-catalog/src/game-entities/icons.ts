import type { CharacterId, CampaignGroupId, UpgradeId } from "./ids"
import type { Rank } from "./rank"
import type { Rarity } from "./rarity"
import { characterIconOverrides } from "./character-icon-overrides"

// All asset paths are relative to the web app's /public/snowprint_assets/ root.
// These helpers return URL strings; the actual files live in apps/web/public/snowprint_assets/.

export const upgradeIconFallback =
  "/snowprint_assets/upgrade_materials/ui_icon_upgrade_unknown.png"

export function upgradeIcon(id: UpgradeId): string {
  return `/snowprint_assets/upgrade_materials/ui_icon_upgrade_${id}.png`
}

// Background plate rendered behind every upgrade material icon (see V1's upgrade-image.tsx).
export const upgradeUnderlay =
  "/snowprint_assets/frames/ui_underlay_upgrades.png"

// Rarity-colored border rendered on top of the upgrade material icon.
export function upgradeFrameIcon(rarity: Rarity): string {
  return `/snowprint_assets/frames/ui_frame_upgrades_${rarity.toLowerCase()}.png`
}

// Badge overlaid on the bottom-left corner of a crafted (non-base) upgrade's icon.
export const craftedUpgradeBadge = "/icons/upgrade-crafted-badge.png"

// Rarity badge icon (not a Snowprint asset — a custom app icon, same as V1's rarity/resized/*.png).
export function rarityIcon(rarity: Rarity): string {
  return `/icons/rarity/${rarity.toLowerCase()}.png`
}

// All rank assets are named by Rank value (lowercase): stone1.png … adamantine3.png.
export function rankIcon(id: Rank): string {
  return `/snowprint_assets/ranks/${id.toLowerCase()}.png`
}

function camelToSnake(id: string): string {
  return id.replace(/([A-Z])/g, "_$1").toLowerCase()
}

export function characterIcon(id: CharacterId): string | undefined {
  const slug = characterIconOverrides[id] ?? camelToSnake(id)
  return `/snowprint_assets/characters/ui_image_RoundPortrait_${slug}_01.png`
}

// Standard campaign name map: groupId → display name used in the filename.
const standardCampaigns: Record<CampaignGroupId, string> = {
  indomitus: "Indomitus",
  "indomitus-mirror": "Indomitus Mirror",
  octarius: "Octarius",
  "octarius-mirror": "Octarius Mirror",
  "saim-hann": "Saim-Hann",
  "saim-hann-mirror": "Saim-Hann Mirror",
  "fall-of-cadia": "Fall of Cadia",
  "fall-of-cadia-mirror": "Fall of Cadia Mirror",
}

// Event campaign image shows the defending (second) faction. Difficulty maps to image suffix.
// Format: "{FactionName} {Standard|Extremis} {Challenge}.png"
const eventCampaignFaction: Record<CampaignGroupId, string> = {
  "adepta-sororitas-vs-death-guard": "Death Guard",
  "death-guard-vs-admech": "Adeptus Mechanicus",
  "genestealers-vs-tau-empire": "T'au Empire",
  "necrons-vs-dark-angels": "Dark Angels",
  "ultramarines-vs-tyranids": "Tyranids",
  "world-eaters-vs-adepta-sororitas": "Adeptus Sororitas",
}

const eventDifficultySuffix: Record<string, string> = {
  eventStandard: "Standard",
  eventStandardChallenge: "Standard Challenge",
  eventExtremis: "Extremis",
  eventExtremisChallenge: "Extremis Challenge",
}

export function campaignIcon(
  groupId: CampaignGroupId,
  difficulty: string
): string | undefined {
  const standardName = standardCampaigns[groupId]
  if (standardName) {
    const suffix = difficulty === "elite" ? " Elite" : ""
    return `/snowprint_assets/campaigns/${standardName}${suffix}.png`
  }
  const faction = eventCampaignFaction[groupId]
  if (faction) {
    const difficultySuffix = eventDifficultySuffix[difficulty]
    if (!difficultySuffix) return undefined
    return `/snowprint_assets/campaigns/${faction} ${difficultySuffix}.png`
  }
  return undefined
}

// Display names for campaign group + difficulty (farm-location labels). These intentionally
// differ from the filename maps above in a couple of spots — e.g. "T'au" not "T'au Empire",
// "Adepta Sororitas" not "Adeptus Sororitas" — matching the in-game campaign names rather than
// the shipped asset filenames.
const eventCampaignDisplayFaction: Record<CampaignGroupId, string> = {
  "adepta-sororitas-vs-death-guard": "Death Guard",
  "death-guard-vs-admech": "Adeptus Mechanicus",
  "genestealers-vs-tau-empire": "T'au",
  "necrons-vs-dark-angels": "Dark Angels",
  "ultramarines-vs-tyranids": "Tyranids",
  "world-eaters-vs-adepta-sororitas": "Adepta Sororitas",
}

export function campaignLabel(
  groupId: CampaignGroupId,
  difficulty: string
): string | undefined {
  const standardName = standardCampaigns[groupId]
  if (standardName) {
    if (difficulty === "elite") return `${standardName} Elite`
    // The "-mirror" groups are already distinguished by name; the base group needs "Standard"
    // spelled out to distinguish it from its own Elite tier.
    return groupId.endsWith("-mirror")
      ? standardName
      : `${standardName} Standard`
  }
  const faction = eventCampaignDisplayFaction[groupId]
  if (faction) {
    const difficultyWord = eventDifficultySuffix[difficulty]
    return difficultyWord ? `${faction} ${difficultyWord}` : undefined
  }
  return undefined
}

// ---- Trait icons ------------------------------------------------------------------------------

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
  return `/snowprint_assets/traits/ui_icon_trait_${slug}_01.png`
}

// ---- Damage type icons --------------------------------------------------------------------------

// Damage type strings on characters (meleeDamage/rangedDamage/activeAbilityDamage/
// passiveAbilityDamage) already match the shipped asset filenames verbatim (PascalCase), so — unlike
// traits/equipment — no override map is needed here.
export function damageTypeIcon(type: string): string {
  return `/snowprint_assets/damage_icons/ui_icon_damage_profile2_${type}.png`
}

// Derives a readable label from the PascalCase damage type id, e.g. "HeavyRound" → "Heavy Round".
export function damageTypeLabel(type: string): string {
  return type.replace(/([a-z0-9])([A-Z])/g, "$1 $2")
}

// ---- Equipment slot icons -----------------------------------------------------------------------

// Slot codes are free-form strings on the character record (e.g. "I_Crit") — there is no closed
// enum server-side, so unrecognized codes fall back to `undefined`/the raw code rather than throwing.
const equipmentSlotInfo: Record<string, { slug: string; label: string }> = {
  I_Crit: { slug: "crit", label: "Crit" },
  I_Block: { slug: "block", label: "Block" },
  I_Booster_Crit: { slug: "booster_crit", label: "Crit Booster" },
  I_Booster_Block: { slug: "booster_block", label: "Block Booster" },
  I_Defensive: { slug: "defensive", label: "Defensive" },
}

export function equipmentSlotIcon(slot: string): string | undefined {
  const info = equipmentSlotInfo[slot]
  return info
    ? `/snowprint_assets/equipment/ui_icon_itemtype_${info.slug}.png`
    : undefined
}

export function equipmentSlotLabel(slot: string): string {
  return equipmentSlotInfo[slot]?.label ?? slot
}

// ---- Stat icons ----------------------------------------------------------------------------------

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
  return `/snowprint_assets/stat_icons/${statIconFile[kind]}`
}

export type CampaignShortLabel = {
  /** Campaign/event name, without any difficulty wording. */
  name: string
  /** Short difficulty code: Standard/Elite are "S"/"E", mirror groups prefix "M", events use
   *  "S"/"Ext" for Standard/Extremis. */
  code: string
  /** Event "Challenge" tiers — the caller appends a "B" to each node number for these. */
  challenge: boolean
}

/**
 * Compact form of `campaignLabel` for farm-location chips, e.g. "Fall of Cadia S", "Indomitus ME",
 * "Adeptus Mechanicus Ext" (+ node numbers, "B"-suffixed when `challenge`). Same group/difficulty
 * matching as `campaignLabel` — returns undefined for the same unrecognized inputs.
 */
export function campaignShortLabel(
  groupId: CampaignGroupId,
  difficulty: string
): CampaignShortLabel | undefined {
  const standardName = standardCampaigns[groupId]
  if (standardName) {
    const isMirror = groupId.endsWith("-mirror")
    const name = isMirror ? standardName.replace(/ Mirror$/, "") : standardName
    const code = `${isMirror ? "M" : ""}${difficulty === "elite" ? "E" : "S"}`
    return { name, code, challenge: false }
  }
  const faction = eventCampaignDisplayFaction[groupId]
  if (faction) {
    const difficultyWord = eventDifficultySuffix[difficulty]
    if (!difficultyWord) return undefined
    const code = difficultyWord.startsWith("Extremis") ? "Ext" : "S"
    return { name: faction, code, challenge: difficulty.endsWith("Challenge") }
  }
  return undefined
}
