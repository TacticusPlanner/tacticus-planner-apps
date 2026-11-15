import { useTranslation } from "react-i18next"
import { campaignDescriptor } from "@workspace/game-catalog"
import type { CampaignId } from "@workspace/game-domain"

import { useCampaignDisplay } from "@/shared/lib"
import { useUnitName } from "@/shared/unit-name"

import type { HomeEventRow } from "../../model/select-home-events"

/** A Home event's display name: the featured hero for a Legendary Event, the running campaign (else
 *  "Campaign Event") for a Campaign Event, Incursion, "Quest: <hero>" for a Quest Event, else the
 *  HSE's name. */
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
  // Reads like the events calendar's "Quest: <hero>".
  const questName = (featuredCharacterId: string | null) =>
    featuredCharacterId
      ? t("withCharacter", {
          name: t("definitions.quest"),
          character: unitName("Character", featuredCharacterId),
        })
      : t("definitions.quest")
  return (row) =>
    row.type === "legendaryEvent"
      ? unitName("Character", row.unitId)
      : row.type === "campaignEvent"
        ? campaignEventName(row.campaignId)
        : row.type === "incursion"
          ? t("definitions.incursion")
          : row.type === "quest"
            ? questName(row.featuredCharacterId)
            : t(`definitions.${row.definitionId}`, {
                defaultValue: row.definitionId,
              })
}
