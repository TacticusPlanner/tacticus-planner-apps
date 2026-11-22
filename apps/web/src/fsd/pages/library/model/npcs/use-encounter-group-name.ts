import { useCallback } from "react"
import { useTranslation } from "react-i18next"
import type { CampaignId } from "@workspace/game-domain"
import { campaignDescriptor } from "@workspace/game-catalog"

import type { NpcEncounter } from "@/entities/npc"
import { useRaidBossLabels } from "@/entities/raid-boss"
import { useCampaignDisplay } from "@/shared/lib"
import { useUnitName } from "@/shared/unit-name"

import { survivalSeasonName } from "./survival-season-name"

/** The localized name of an encounter's group: its row name and its Location filter option. */
export function useEncounterGroupName() {
  const { t, i18n } = useTranslation("library")
  const { name: campaignName, fullLabel } = useCampaignDisplay()
  const unitName = useUnitName()
  const { bossName } = useRaidBossLabels()

  return useCallback(
    (encounter: NpcEncounter): string => {
      switch (encounter.source) {
        case "campaign":
        case "campaignEvent": {
          const descriptor = campaignDescriptor(
            encounter.groupId as CampaignId,
            encounter.battles[0]?.track ?? "Standard"
          )
          if (!descriptor) return encounter.groupId
          return encounter.source === "campaign"
            ? fullLabel(descriptor)
            : campaignName(descriptor)
        }
        case "legendaryEvent":
        case "questEvent":
          return unitName("Character", encounter.groupId)
        case "incursion":
          return unitName("Mow", encounter.groupId)
        case "guildRaid":
          return bossName(encounter.groupId)
        case "survival":
          return t(`npcs.encounters.survivalSeason.${encounter.groupId}`, {
            defaultValue:
              survivalSeasonName(encounter.groupId, i18n.language) ??
              encounter.groupId,
          })
        case "onslaught":
          return t("npcs.encounters.source.onslaught")
      }
    },
    [bossName, campaignName, fullLabel, i18n.language, t, unitName]
  )
}
