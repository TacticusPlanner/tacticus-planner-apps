import { useTranslation } from "react-i18next"
import { campaignDescriptor } from "@workspace/game-catalog"
import type { CampaignId } from "@workspace/game-domain"

import { useCampaignDisplay } from "@/shared/lib"
import { useUnitName } from "@/shared/unit-name"

import type { HomeEventRow } from "../../model/select-home-events"

/** A Home event's display name: the featured hero for a Legendary Event, the running campaign (else
 *  "Campaign Event") for a Campaign Event, Incursion, "Quest: <hero>" for a Quest Event, "New
 *  Character Event: <hero>" for a Hero Release Event, the shop's name for an event shop, else the
 *  HSE's name. */
export function useHomeEventName(): (row: HomeEventRow) => string {
  const { t } = useTranslation(["events", "eventMissions"])
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
  // Reads like the events calendar's "New Character Event: <hero>".
  const hreName = (featuredCharacterId: string | null) =>
    featuredCharacterId
      ? t("withCharacter", {
          name: t("definitions.new-character-event"),
          character: unitName("Character", featuredCharacterId),
        })
      : t("definitions.new-character-event")
  // An undated shop has no calendar definition yet: it takes the game's own event name.
  const eventShopName = (definitionId: string | null, eventKey: string) =>
    definitionId === null
      ? t(`eventMissions:events.${eventKey}` as never, {
          defaultValue: eventKey,
        })
      : t(`definitions.${definitionId}` as never, {
          defaultValue: definitionId,
        })
  return (row) => {
    switch (row.type) {
      case "legendaryEvent": {
        return unitName("Character", row.unitId)
      }
      case "campaignEvent": {
        return campaignEventName(row.campaignId)
      }
      case "incursion": {
        return t("definitions.incursion")
      }
      case "quest": {
        return questName(row.featuredCharacterId)
      }
      case "hre": {
        return hreName(row.featuredCharacterId)
      }
      case "eventShop": {
        return eventShopName(row.definitionId, row.eventKey)
      }
      case "homeScreen": {
        return t(`definitions.${row.definitionId}` as never, {
          defaultValue: row.definitionId,
        })
      }
    }
  }
}
