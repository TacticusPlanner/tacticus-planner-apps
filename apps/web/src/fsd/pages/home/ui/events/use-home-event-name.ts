import { useTranslation } from "react-i18next"
import { campaignDescriptor } from "@workspace/game-catalog"
import type { CampaignId } from "@workspace/game-domain"

import { useCampaignDisplay } from "@/shared/lib"
import { useUnitName } from "@/shared/unit-name"

import type { HomeEventRow } from "../../model/select-home-events"

/** A Home event's display name: the featured hero for a Legendary Event, the running campaign (else
 *  "Campaign Event") for a Campaign Event, Incursion, else the HSE's name. */
export function useHomeEventName(): (row: HomeEventRow) => string {
  const { t } = useTranslation("events")
  const unitName = useUnitName()
  const campaign = useCampaignDisplay()
  const campaignEventName = (campaignId: string | null) => {
    // Synced player data may name a campaign before a catalog release does.
    const descriptor = campaignId
      ? campaignDescriptor(campaignId as CampaignId, "Standard")
      : undefined
    return descriptor
      ? campaign.name(descriptor)
      : t("definitions.campaign-event")
  }
  return (row) =>
    row.type === "legendaryEvent"
      ? unitName("Character", row.unitId)
      : row.type === "campaignEvent"
        ? campaignEventName(row.campaignId)
        : row.type === "incursion"
          ? t("definitions.incursion")
          : t(`definitions.${row.definitionId}`, {
              defaultValue: row.definitionId,
            })
}
