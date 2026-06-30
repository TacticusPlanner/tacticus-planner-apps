import type { CharacterId, CampaignGroupId, UpgradeId } from "./ids"
import type { RankId } from "./rank"
import { characterIconOverrides } from "./character-icon-overrides"

// All asset paths are relative to the web app's /public/snowprint_assets/ root.
// These helpers return URL strings; the actual files live in apps/web/public/snowprint_assets/.

export const upgradeIconFallback =
  "/snowprint_assets/upgrade_materials/ui_icon_upgrade_unknown.png"

export function upgradeIcon(id: UpgradeId): string {
  return `/snowprint_assets/upgrade_materials/ui_icon_upgrade_${id}.png`
}

// All rank assets are named by RankId (lowercase): stone1.png … adamantine3.png.
export function rankIcon(id: RankId): string {
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
