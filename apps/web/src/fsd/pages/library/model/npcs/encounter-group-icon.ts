import type { CampaignId, UnitId } from "@workspace/game-domain"
import {
  campaignIcon,
  characterIcon,
  mowIcon,
  onslaughtTokenIcon,
  raidBossPortrait,
} from "@workspace/game-catalog"

import type { NpcEncounter } from "@/entities/npc"

/**
 * The game icon that leads an encounter's row: the campaign's or event's own icon, the event hero or
 * Machine of War's portrait, the raid boss, or the Onslaught token. `undefined` where the game has
 * none (Survival), so the row keeps its name alone.
 */
export function encounterGroupIcon(
  encounter: Pick<NpcEncounter, "source" | "groupId" | "battles">
): string | undefined {
  switch (encounter.source) {
    case "campaign":
    case "campaignEvent":
      return campaignIcon(
        encounter.groupId as CampaignId,
        encounter.battles[0]?.track ?? "Standard"
      )
    case "legendaryEvent":
    case "questEvent":
      return characterIcon(encounter.groupId as UnitId)
    case "incursion":
      return mowIcon(encounter.groupId as UnitId)
    case "guildRaid":
      return raidBossPortrait(encounter.groupId)
    case "onslaught":
      return onslaughtTokenIcon()
    case "survival":
      return undefined
  }
}
