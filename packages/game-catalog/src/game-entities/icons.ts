import type { CharacterId, CampaignGroupId, UpgradeId } from "./ids"
import type { Rank } from "./rank"
import type { Rarity } from "./rarity"
import { characterIconOverrides } from "./character-icon-overrides"
import { rarityStarsIndex, type RarityStars } from "./unit-stats"

// All asset paths (including the app's own custom icons — rarity badges, gold/red stars, the
// crafted-upgrade badge) are relative to the web app's /public/game_catalog/ root. These
// helpers return URL strings; the actual files live in apps/web/public/game_catalog/.
// ASSET_BASE_PATH is the single source of truth for that root — change it here to relocate assets.
export const ASSET_BASE_PATH = "/game_catalog"

// ---- Upgrade icons ------------------------------------------------------------------------------

export const UpgradeIcons = {
  fallback: `${ASSET_BASE_PATH}/upgrade_materials/ui_icon_upgrade_unknown.png`,
  // Background plate rendered behind every upgrade material icon (see V1's upgrade-image.tsx).
  underlay: `${ASSET_BASE_PATH}/frames/ui_underlay_upgrades.png`,
  // Badge overlaid on the bottom-left corner of a crafted (non-base) upgrade's icon.
  craftedBadge: `${ASSET_BASE_PATH}/upgrade-crafted-badge.png`,
  icon(id: UpgradeId): string {
    return `${ASSET_BASE_PATH}/upgrade_materials/ui_icon_upgrade_${id}.png`
  },
  // Rarity-colored border rendered on top of the upgrade material icon.
  frame(rarity: Rarity): string {
    return `${ASSET_BASE_PATH}/frames/ui_frame_upgrades_${rarity.toLowerCase()}.png`
  },
} as const

// Rarity badge icon (not a Snowprint asset — a custom app icon, same as V1's rarity/resized/*.png).
export function rarityIcon(rarity: Rarity): string {
  return `${ASSET_BASE_PATH}/rarity/${rarity.toLowerCase()}.png`
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

// ---- Campaign icon + descriptor -------------------------------------------------------------

// Storyline base names, indexed 1-4 — the asset/i18n-name-key stem shared by all four of a
// storyline's tiers (`campaign1`/`mirror1`/`elite1`/`eliteMirror1` all name-key to "indomitus").
// Matches Tacticus's own campaign-progress ids (see ADR 0007 / GameCatalogDatasets in the API
// repo); ordering confirmed against the catalog's own campaign-battles source files.
const storylineNames: Record<string, string> = {
  "1": "indomitus",
  "2": "fall-of-cadia",
  "3": "octarius",
  "4": "saim-hann",
}

// Campaign-event group ids (one group per event, per Tacticus's own reporting model — events
// report one id with multiple `type` values instead of separate ids per tier). Mapping confirmed
// via V1's `campaign-mapper-service.ts` ordinal event-id mapping, cross-checked against each
// event's own faction/enemy-faction fields.
const eventNames: Record<string, string> = {
  "1": "death-guard-vs-admech",
  "2": "ultramarines-vs-tyranids",
  "3": "genestealers-vs-tau-empire",
  "4": "adepta-sororitas-vs-death-guard",
  "5": "world-eaters-vs-adepta-sororitas",
  "6": "necrons-vs-dark-angels",
}

const STORYLINE_GROUP_ID = /^(campaign|mirror|elite|eliteMirror)([1-4])$/
const EVENT_GROUP_ID = /^eventCampaign([1-6])$/

export type CampaignDifficultyToken =
  "standard" | "elite" | "eventStandard" | "eventExtremis"

/**
 * Ids/tokens describing a campaign group + tier, for the caller to resolve into translated
 * display text (`campaigns` i18n namespace) — this package holds no display strings, only the
 * game-data structure.
 */
export interface CampaignDescriptor {
  /** Key into the `campaigns` i18n namespace for the campaign/event's base display name. */
  nameKey: string
  difficultyToken: CampaignDifficultyToken
  /** True for the `mirror{n}`/`eliteMirror{n}` groups. */
  isMirror: boolean
  isEvent: boolean
  /** Event "Challenge" tiers — the caller appends a "B" to each node number for these. */
  challenge: boolean
}

/**
 * `type`/`challenge` come off the battle record (Tacticus's own vocabulary: `Standard`/`Mirror`/
 * `Elite`/`EliteMirror` for storylines, `Standard`/`Extremis` + a separate `challenge` flag for
 * events — see the catalog's `campaign-battles`/`campaign-definitions` datasets). Storyline
 * groups now carry their tier (Mirror/Elite/EliteMirror) in the groupId itself
 * (`mirror1`/`elite1`/`eliteMirror1`), so `isMirror`/the elite-ness of the token are derived from
 * the groupId shape rather than the battle's own `type` string.
 */
export function campaignDescriptor(
  groupId: CampaignGroupId,
  type: string,
  challenge = false
): CampaignDescriptor | undefined {
  const storylineMatch = STORYLINE_GROUP_ID.exec(groupId)
  if (storylineMatch) {
    const [, kind, index] = storylineMatch
    const nameKey = storylineNames[index]
    if (!nameKey) return undefined
    const isMirror = kind === "mirror" || kind === "eliteMirror"
    const isElite = kind === "elite" || kind === "eliteMirror"
    return {
      nameKey,
      difficultyToken: isElite ? "elite" : "standard",
      isMirror,
      isEvent: false,
      challenge: false, // storyline battles never carry the challenge tier
    }
  }

  const eventMatch = EVENT_GROUP_ID.exec(groupId)
  if (eventMatch) {
    const nameKey = eventNames[eventMatch[1]]
    if (!nameKey) return undefined
    if (type !== "Standard" && type !== "Extremis") return undefined
    return {
      nameKey,
      difficultyToken: type === "Standard" ? "eventStandard" : "eventExtremis",
      isMirror: false,
      isEvent: true,
      challenge,
    }
  }

  return undefined
}

// Filenames follow "{nameKey}[-mirror]-{difficultyToken}.png" for storylines (e.g.
// "indomitus-standard.png", "indomitus-mirror-elite.png") and "{nameKey}-{difficultyToken}.png"
// for events (e.g. "death-guard-vs-admech-eventExtremis.png"); challenge tiers reuse their base
// Standard/Extremis image (see `campaignDescriptor`'s `challenge` flag).
export function campaignIcon(
  groupId: CampaignGroupId,
  type: string,
  challenge = false
): string | undefined {
  const descriptor = campaignDescriptor(groupId, type, challenge)
  if (!descriptor) return undefined
  const stem = descriptor.isEvent
    ? descriptor.nameKey
    : descriptor.isMirror
      ? `${descriptor.nameKey}-mirror`
      : descriptor.nameKey
  return `${ASSET_BASE_PATH}/campaigns/${stem}-${descriptor.difficultyToken}.png`
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
const goldStarIcon = `${ASSET_BASE_PATH}/stars/gold.png`
const redStarIcon = `${ASSET_BASE_PATH}/stars/red.png`
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
