import type { CampaignId } from "@workspace/game-domain"

import { ASSET_BASE_PATH } from "./asset-path"

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
  groupId: CampaignId,
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
  groupId: CampaignId,
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
