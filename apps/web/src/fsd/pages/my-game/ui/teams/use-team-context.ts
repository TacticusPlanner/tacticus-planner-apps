import { useCallback } from "react"
import { useTranslation } from "react-i18next"
import { campaignDescriptor } from "@workspace/game-catalog"
import { campaignIdSchema } from "@workspace/game-domain"

import { useSurvivalEventName } from "@/entities/team"
import type { Team } from "@/entities/team"
import { useCampaignDisplay } from "@/shared/lib"
import { useUnitName } from "@/shared/unit-name"

/**
 * What a Campaign, Incursion or Survival team is for, as one line: "Campaign: Indomitus",
 * "Incursions: Rukkatrukk, Tson'ji" or "Survival: December 2026". Null for any other team.
 */
export function useTeamContext() {
  const { t, i18n } = useTranslation("teams")
  const { campaignName } = useCampaignDisplay()
  const unitName = useUnitName()
  const survivalEventName = useSurvivalEventName()
  return useCallback(
    (
      team: Pick<Team, "campaignGroupId" | "incursionMowIds"> &
        Partial<Pick<Team, "survivalEventKey">>
    ) => {
      if (team.survivalEventKey) {
        return t("card.survival", {
          name: survivalEventName(team.survivalEventKey),
        })
      }
      if (team.campaignGroupId) {
        const descriptor = campaignDescriptor(
          campaignIdSchema.parse(team.campaignGroupId),
          "Standard"
        )
        return t("card.campaign", {
          name: descriptor ? campaignName(descriptor) : team.campaignGroupId,
        })
      }
      if (team.incursionMowIds.length > 0) {
        const names = new Intl.ListFormat(i18n.language, {
          type: "unit",
          style: "short",
        }).format(team.incursionMowIds.map((id) => unitName("Mow", id)))
        return t("card.incursions", { names })
      }
      return null
    },
    [t, i18n.language, campaignName, unitName, survivalEventName]
  )
}
