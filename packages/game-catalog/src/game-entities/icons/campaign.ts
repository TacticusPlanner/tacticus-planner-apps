import type { CampaignId } from "@workspace/game-domain"

import { curatedAssetUrl, datamineAssetUrl } from "./asset-path"
import { factionIcon } from "./faction"

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

// The faction an event's Standard tier shows: the second side of its name.
const eventStandardFactions: Record<string, string> = {
  "death-guard-vs-admech": "AdeptusMechanicus",
  "ultramarines-vs-tyranids": "Tyranids",
  "genestealers-vs-tau-empire": "Tau",
  "adepta-sororitas-vs-death-guard": "DeathGuard",
  "world-eaters-vs-adepta-sororitas": "Sisterhood",
  "necrons-vs-dark-angels": "DarkAngels",
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
  groupId: CampaignId,
  type: string,
  challenge = false
): CampaignDescriptor | undefined {
  const storylineMatch = STORYLINE_GROUP_ID.exec(groupId)
  if (storylineMatch) {
    const [, kind, index] = storylineMatch
    const nameKey = index === undefined ? undefined : storylineNames[index]
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
    const eventIndex = eventMatch[1]
    const nameKey =
      eventIndex === undefined ? undefined : eventNames[eventIndex]
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

// Storylines use the game's own campaign icons, `atlases/ui_icon_campaign_0<n>[_mirror][_elite]`.
// An event's Standard tier is its faction's emblem; its Extremis icon has no game file, so the
// planner's copy `curated/campaigns/<nameKey>-eventExtremis.webp` is used. Challenge tiers reuse
// their base Standard/Extremis image (see `campaignDescriptor`'s `challenge` flag).
export function campaignIcon(
  groupId: CampaignId,
  type: string,
  challenge = false
): string | undefined {
  const descriptor = campaignDescriptor(groupId, type, challenge)
  if (!descriptor) return undefined
  if (descriptor.isEvent) {
    return descriptor.difficultyToken === "eventStandard"
      ? factionIcon(eventStandardFactions[descriptor.nameKey] ?? "")
      : curatedAssetUrl(`campaigns/${descriptor.nameKey}-eventExtremis.webp`)
  }
  const index = STORYLINE_GROUP_ID.exec(groupId)?.[2]
  const mirror = descriptor.isMirror ? "_mirror" : ""
  const elite = descriptor.difficultyToken === "elite" ? "_elite" : ""
  return datamineAssetUrl(
    `atlases/ui_icon_campaign_0${index}${mirror}${elite}.webp`
  )
}
