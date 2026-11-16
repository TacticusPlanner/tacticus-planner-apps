import { describe, expect, it } from "vitest"

import {
  eventShopIdForOccurrence,
  resolveEventPlannerPath,
} from "./event-planner-links"
import type { PlannerLinkEntry } from "./event-planner-links"

const entry = (
  definitionType: string | undefined,
  overrides: Partial<PlannerLinkEntry> = {}
): PlannerLinkEntry => ({
  definitionId: "some-event",
  definitionType,
  occurrenceId: null,
  startUtc: "2026-11-22T08:00:00Z",
  parameters: null,
  ...overrides,
})

describe("resolveEventPlannerPath", () => {
  it("opens the HSE and HRE tabs on the occurrence", () => {
    expect(
      resolveEventPlannerPath(
        entry("HomeScreenEvent", {
          occurrenceId: "occ-2026-11-22-hse-global-blood-tithe",
        })
      )
    ).toBe("/dailies/hse?event=occ-2026-11-22-hse-global-blood-tithe")
    expect(
      resolveEventPlannerPath(
        entry("NewCharacterEvent", { definitionId: "new-character-event" })
      )
    ).toBe(
      `/dailies/hre?event=${encodeURIComponent("new-character-event@2026-11-22T08:00:00Z")}`
    )
  })

  it("links a Quest, Campaign Event, Incursion and Guild Raid season to their pages", () => {
    expect(resolveEventPlannerPath(entry("Quest"))).toBe("/dailies/quest")
    expect(resolveEventPlannerPath(entry("CampaignEvent"))).toBe(
      "/my-game/campaign-events"
    )
    expect(resolveEventPlannerPath(entry("Incursion"))).toBe(
      "/my-game/incursions"
    )
    expect(resolveEventPlannerPath(entry("GuildRaidSeason"))).toBe(
      "/dailies/guild-raids"
    )
  })

  it("opens a Legendary Event's own page when the occurrence names its hero", () => {
    expect(
      resolveEventPlannerPath(
        entry("LegendaryEvent", {
          parameters: { featuredCharacterId: "astarLysander" },
        })
      )
    ).toBe("/legendary-events/astarLysander")
    expect(resolveEventPlannerPath(entry("LegendaryEvent"))).toBe(
      "/legendary-events"
    )
  })

  it("opens an event shop on its shop, else the Event shop tab", () => {
    expect(resolveEventPlannerPath(entry("ShopEvent"), "november-2026")).toBe(
      "/dailies/event-shop/november-2026"
    )
    expect(resolveEventPlannerPath(entry("ShopEvent"))).toBe(
      "/dailies/event-shop"
    )
  })

  it("has no link for an event without a planner page", () => {
    expect(resolveEventPlannerPath(entry("BattlePass"))).toBeUndefined()
    expect(resolveEventPlannerPath(entry("TournamentArena"))).toBeUndefined()
    expect(resolveEventPlannerPath(entry(undefined))).toBeUndefined()
  })
})

describe("eventShopIdForOccurrence", () => {
  const shops = [
    {
      id: "october-2026",
      eventKey: "October2026",
      definitionId: "armageddon-shop",
      startUtc: "2026-10-12T00:00:00Z",
      dayCount: 14,
    },
    {
      id: "november-2026",
      eventKey: "November2026",
      definitionId: "skull-harvest-shop",
      startUtc: "2026-11-23T00:00:00Z",
      dayCount: 14,
    },
    {
      id: "december-2026",
      eventKey: "December2026",
      definitionId: null,
      startUtc: null,
      dayCount: 14,
    },
  ]

  it("finds the shop of the same definition whose days cover the occurrence", () => {
    // The calendar dates each shop week on its own; week 2 still belongs to the same shop.
    expect(
      eventShopIdForOccurrence(
        {
          definitionId: "skull-harvest-shop",
          startUtc: "2026-11-30T00:00:00Z",
        },
        shops
      )
    ).toBe("november-2026")
  })

  it("matches nothing outside the shop's days or for another definition", () => {
    expect(
      eventShopIdForOccurrence(
        {
          definitionId: "skull-harvest-shop",
          startUtc: "2026-12-07T00:00:00Z",
        },
        shops
      )
    ).toBeUndefined()
    expect(
      eventShopIdForOccurrence(
        { definitionId: "anniversary-event", startUtc: "2026-11-23T00:00:00Z" },
        shops
      )
    ).toBeUndefined()
  })
})
