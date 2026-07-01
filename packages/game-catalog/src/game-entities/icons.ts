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
