import {
  campaignIcon,
  characterIcon,
  eventIcon,
  gameMenuIcon,
} from "@workspace/game-catalog"
import type { CampaignId, UnitId } from "@workspace/game-domain"

import { EntityIcon, EventIcon } from "@/shared/ui"
import type { EntityIconSize } from "@/shared/ui"

import type { HomeEventRow } from "../../model/select-home-events"

/** A Home event's picture: the featured hero's portrait for a Legendary Event, the running
 *  campaign's icon (else the Campaign Events menu icon) for a Campaign Event, Incursion's icon, the
 *  featured hero's portrait (else the Quests menu icon) for a Quest Event, the featured hero's
 *  portrait (else the HRE icon) for a Hero Release Event, the event shop icon for an event shop, the Guild War icon for a Guild War phase, else
 *  the Home Screen Event's game medallion. Decorative; the row names the event. */
export function HomeEventVisual({
  row,
  size,
}: {
  row: HomeEventRow
  size: EntityIconSize
}) {
  if (row.type === "legendaryEvent") {
    return (
      <EntityIcon
        alt=""
        size={size}
        className="shrink-0 rounded-full ring-2 ring-(--event-family-heroes)"
        src={characterIcon(row.unitId as UnitId)}
      />
    )
  }
  if (row.type === "campaignEvent") {
    return (
      <EntityIcon
        alt=""
        size={size}
        className="shrink-0"
        src={
          row.campaignId
            ? campaignIcon(row.campaignId as CampaignId, "Standard")
            : gameMenuIcon("campaignEvent")
        }
      />
    )
  }
  if (row.type === "quest") {
    return row.featuredCharacterId ? (
      <EntityIcon
        alt=""
        size={size}
        className="shrink-0 rounded-full ring-2 ring-(--event-family-campaigns)"
        src={characterIcon(row.featuredCharacterId as UnitId)}
      />
    ) : (
      <EntityIcon
        alt=""
        size={size}
        className="shrink-0"
        src={gameMenuIcon("quests")}
      />
    )
  }
  if (row.type === "hre") {
    return row.featuredCharacterId ? (
      <EntityIcon
        alt=""
        size={size}
        className="shrink-0 rounded-full ring-2 ring-(--event-family-heroes)"
        src={characterIcon(row.featuredCharacterId as UnitId)}
      />
    ) : (
      <EventIcon
        size={size}
        className="shrink-0"
        definitionId="new-character-event"
        definitionType="NewCharacterEvent"
      />
    )
  }
  if (row.type === "eventShop") {
    return (
      <EventIcon
        size={size}
        className="shrink-0"
        definitionId={row.definitionId ?? ""}
        definitionType="ShopEvent"
      />
    )
  }
  if (row.type === "guildWar") {
    return (
      <EventIcon
        size={size}
        className="shrink-0"
        definitionId="guild-war-season"
        definitionType="GuildWarSeason"
      />
    )
  }
  if (row.type === "incursion") {
    return (
      <EntityIcon
        alt=""
        size={size}
        className="shrink-0"
        src={eventIcon("incursion", "Incursion")}
      />
    )
  }
  return (
    <EventIcon
      size={size}
      className="shrink-0"
      definitionId={row.definitionId}
      definitionType="HomeScreenEvent"
      parameters={row.parameters}
    />
  )
}
