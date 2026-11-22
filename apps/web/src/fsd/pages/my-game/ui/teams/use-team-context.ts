import { useCallback } from "react"
import { useTranslation } from "react-i18next"
import { campaignDescriptor } from "@workspace/game-catalog"
import { campaignIdSchema } from "@workspace/game-domain"

import type { Team } from "@/entities/team"
import { useCampaignDisplay } from "@/shared/lib"
import { useUnitName } from "@/shared/unit-name"

/**
 * What a Campaign or Incursion team is for, as one line: "Campaign: Indomitus" or "Incursions:
 * Rukkatrukk, Tson'ji". Null for a team of any other mode.
 */
export function useTeamContext() {
  const { t, i18n } = useTranslation("teams")
  const { campaignName } = useCampaignDisplay()
  const unitName = useUnitName()
  return useCallback(
    (team: Pick<Team, "campaignGroupId" | "incursionMowIds">) => {
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
    [t, i18n.language, campaignName, unitName]
  )
}
