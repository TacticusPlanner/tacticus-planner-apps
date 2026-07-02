import type { CharacterId, CampaignGroupId, UpgradeId } from "./ids"
import type { Rank } from "./rank"
import type { Rarity } from "./rarity"
import { characterIconOverrides } from "./character-icon-overrides"
import { rarityStarsIndex, type RarityStars } from "./unit-stats"

// All asset paths are relative to the web app's /public/snowprint_assets/ root.
// These helpers return URL strings; the actual files live in apps/web/public/snowprint_assets/.
// ASSET_BASE_PATH is the single source of truth for that root — change it here to relocate assets.
export const ASSET_BASE_PATH = "/snowprint_assets"

export const upgradeIconFallback = `${ASSET_BASE_PATH}/upgrade_materials/ui_icon_upgrade_unknown.png`

export function upgradeIcon(id: UpgradeId): string {
  return `${ASSET_BASE_PATH}/upgrade_materials/ui_icon_upgrade_${id}.png`
}

// Background plate rendered behind every upgrade material icon (see V1's upgrade-image.tsx).
export const upgradeUnderlay = `${ASSET_BASE_PATH}/frames/ui_underlay_upgrades.png`

// Rarity-colored border rendered on top of the upgrade material icon.
export function upgradeFrameIcon(rarity: Rarity): string {
  return `${ASSET_BASE_PATH}/frames/ui_frame_upgrades_${rarity.toLowerCase()}.png`
}

// Badge overlaid on the bottom-left corner of a crafted (non-base) upgrade's icon.
export const craftedUpgradeBadge = "/icons/upgrade-crafted-badge.png"

// Rarity badge icon (not a Snowprint asset — a custom app icon, same as V1's rarity/resized/*.png).
export function rarityIcon(rarity: Rarity): string {
  return `/icons/rarity/${rarity.toLowerCase()}.png`
}

// All rank assets are named by Rank value (lowercase): stone1.png … adamantine3.png.
export function rankIcon(id: Rank): string {
  return `${ASSET_BASE_PATH}/ranks/${id.toLowerCase()}.png`
}

function camelToSnake(id: string): string {
  return id.replace(/([A-Z])/g, "_$1").toLowerCase()
}

export function characterIcon(id: CharacterId): string | undefined {
  const slug = characterIconOverrides[id] ?? camelToSnake(id)
  return `${ASSET_BASE_PATH}/characters/ui_image_RoundPortrait_${slug}_01.png`
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
    return `${ASSET_BASE_PATH}/campaigns/${standardName}${suffix}.png`
  }
  const faction = eventCampaignFaction[groupId]
  if (faction) {
    const difficultySuffix = eventDifficultySuffix[difficulty]
    if (!difficultySuffix) return undefined
    return `${ASSET_BASE_PATH}/campaigns/${faction} ${difficultySuffix}.png`
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

export type CampaignDifficultyToken =
  | "standard"
  | "elite"
  | "eventStandard"
  | "eventStandardChallenge"
  | "eventExtremis"
  | "eventExtremisChallenge"

const eventDifficultyToken: Record<string, CampaignDifficultyToken> = {
  eventStandard: "eventStandard",
  eventStandardChallenge: "eventStandardChallenge",
  eventExtremis: "eventExtremis",
  eventExtremisChallenge: "eventExtremisChallenge",
}

/**
 * Ids/tokens describing a campaign group + difficulty, for the caller to resolve into translated
 * display text (`campaigns`/`campaignDifficulties`/`campaignDifficultyCodes` i18n namespaces) — this
 * package holds no display strings, only the game-data structure.
 */
export interface CampaignDescriptor {
  /** Key into the `campaigns` i18n namespace for the campaign/event's base display name. */
  nameKey: string
  difficultyToken: CampaignDifficultyToken
  /** True for the "-mirror" variant of a standard campaign. */
  isMirror: boolean
  isEvent: boolean
  /** Event "Challenge" tiers — the caller appends a "B" to each node number for these. */
  challenge: boolean
}

export function campaignDescriptor(
  groupId: CampaignGroupId,
  difficulty: string
): CampaignDescriptor | undefined {
  if (standardCampaigns[groupId]) {
    const isMirror = groupId.endsWith("-mirror")
    const nameKey = isMirror ? groupId.slice(0, -"-mirror".length) : groupId
    return {
      nameKey,
      difficultyToken: difficulty === "elite" ? "elite" : "standard",
      isMirror,
      isEvent: false,
      challenge: false,
    }
  }
  const faction = eventCampaignDisplayFaction[groupId]
  if (faction) {
    const difficultyToken = eventDifficultyToken[difficulty]
    if (!difficultyToken) return undefined
    return {
      nameKey: groupId,
      difficultyToken,
      isMirror: false,
      isEvent: true,
      challenge: difficulty.endsWith("Challenge"),
    }
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
  return `${ASSET_BASE_PATH}/traits/ui_icon_trait_${slug}_01.png`
}

// ---- Damage type icons --------------------------------------------------------------------------

// Damage type strings on characters (meleeDamage/rangedDamage/activeAbilityDamage/
// passiveAbilityDamage) already match the shipped asset filenames verbatim (PascalCase), so — unlike
// traits/equipment — no override map is needed here.
export function damageTypeIcon(type: string): string {
  return `${ASSET_BASE_PATH}/damage_icons/ui_icon_damage_profile2_${type}.png`
}

// ---- Equipment slot icons -----------------------------------------------------------------------

// Slot codes are free-form strings on the character record (e.g. "I_Crit") — there is no closed
// enum server-side, so unrecognized codes fall back to `undefined` rather than throwing.
const equipmentSlotInfo: Record<string, { slug: string }> = {
  I_Crit: { slug: "crit" },
  I_Block: { slug: "block" },
  I_Booster_Crit: { slug: "booster_crit" },
  I_Booster_Block: { slug: "booster_block" },
  I_Defensive: { slug: "defensive" },
}

export function equipmentSlotIcon(slot: string): string | undefined {
  const info = equipmentSlotInfo[slot]
  return info
    ? `${ASSET_BASE_PATH}/equipment/ui_icon_itemtype_${info.slug}.png`
    : undefined
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
  return `${ASSET_BASE_PATH}/stat_icons/${statIconFile[kind]}`
}

// ---- Progression (rarity + stars) icons -----------------------------------------------------

// Gold/red stars aren't Snowprint assets (V1 sources them from its own app icon set); the blue
// star and mythic wings are (V1's `snowprintIcons.blueStar`/`.mythicWings`).
const goldStarIcon = "/icons/stars/gold.png"
const redStarIcon = "/icons/stars/red.png"
const blueStarIcon = `${ASSET_BASE_PATH}/stars/ui_icon_star_legendary_large.png`
const mythicWingsIcon = `${ASSET_BASE_PATH}/stars/ui_icon_star_mythic.png`

export type ProgressionVisual =
  | { kind: "none" }
  | { kind: "stars"; icon: string; count: number }
  | { kind: "wings"; icon: string }

// Ported from V1's stars.icon.tsx: None renders as plain text (no icon); 1-5 stars are gold,
// 6-10 are red, 11-13 are blue, and the max step (14) renders as a single wings image instead of
// 14 individual stars.
export function progressionVisual(value: RarityStars): ProgressionVisual {
  const index = rarityStarsIndex(value)
  if (index === 0) return { kind: "none" }
  if (index <= 5) return { kind: "stars", icon: goldStarIcon, count: index }
  if (index <= 10) {
    return { kind: "stars", icon: redStarIcon, count: index - 5 }
  }
  if (index <= 13) {
    return { kind: "stars", icon: blueStarIcon, count: index - 10 }
  }
  return { kind: "wings", icon: mythicWingsIcon }
}
