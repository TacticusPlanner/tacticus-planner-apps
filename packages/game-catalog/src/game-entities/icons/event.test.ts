import { describe, expect, it } from "vitest"

import {
  countdownIcon,
  eventIcon,
  homeScreenEventBanner,
  homeScreenEventPointsIcon,
} from "./event"

const base = "/game_catalog/datamines"

describe("eventIcon", () => {
  it("uses a Home Screen Event's own medallion", () => {
    expect(eventIcon("hse-warp-surge", "HomeScreenEvent")).toBe(
      `${base}/liveevents/ui_gamemodeicon_warpsurge.webp`
    )
    expect(eventIcon("hse-purge-order", "HomeScreenEvent")).toBe(
      `${base}/liveevents/ui_gamemodeicon_killtyranids.webp`
    )
  })

  it("picks a Faction Boost medallion by the boosted faction", () => {
    expect(
      eventIcon("hse-faction-boost", "HomeScreenEvent", {
        targetFactionId: "SpaceWolves",
      })
    ).toBe(`${base}/liveevents/ui_gamemodeicon_faction_boost_space_wolves.webp`)
  })

  it("falls back to the faction emblem for a boosted faction without a medallion", () => {
    expect(
      eventIcon("hse-faction-boost", "HomeScreenEvent", {
        targetFactionId: "Tau",
      })
    ).toBe(`${base}/atlases/ui_icon_faction_tau_01.webp`)
    expect(eventIcon("hse-faction-boost", "HomeScreenEvent")).toBeUndefined()
  })

  it("tells the two standing modifiers apart by id", () => {
    expect(eventIcon("always-double-xp-sunday", "StandingModifier")).toBe(
      `${base}/liveevents/event_icon_extraxp.webp`
    )
    expect(eventIcon("always-double-gold-saturday", "StandingModifier")).toBe(
      `${base}/liveevents/event_icon_goldtemple.webp`
    )
  })

  it("falls back to the definition type", () => {
    expect(eventIcon("guild-raid-season", "GuildRaidSeason")).toBe(
      `${base}/atlases/ui_icon_menu_guildboss.webp`
    )
    expect(eventIcon("legendary-event", "LegendaryEvent")).toBe(
      `${base}/atlases/ui_icon_event_lhe.webp`
    )
  })

  it("has no icon where the game has none", () => {
    expect(eventIcon("hse-against-the-tide", "HomeScreenEvent")).toBeUndefined()
    expect(eventIcon("something-new", undefined)).toBeUndefined()
  })
})

describe("homeScreenEventBanner", () => {
  it("returns the interstitial banner when the game ships one", () => {
    expect(homeScreenEventBanner("hse-faction-focus")).toBe(
      `${base}/liveevents/ui_interstitial_factionfocus.webp`
    )
    expect(
      homeScreenEventBanner("hse-faction-boost", {
        targetFactionId: "DarkAngels",
      })
    ).toBe(`${base}/liveevents/ui_interstitial_dark_angels.webp`)
  })

  it("is undefined without a banner", () => {
    expect(homeScreenEventBanner("hse-warp-surge")).toBeUndefined()
    expect(homeScreenEventBanner("battle-pass")).toBeUndefined()
  })
})

describe("countdownIcon", () => {
  it("is the game's timer icon", () => {
    expect(countdownIcon()).toBe(`${base}/atlases/ui_icon_timer.webp`)
  })
})

describe("homeScreenEventPointsIcon", () => {
  it("uses the event's own points currency", () => {
    expect(homeScreenEventPointsIcon("hse-purge-order")).toBe(
      `${base}/liveevents/ui_icon_resource_event_killtyranids.webp`
    )
    expect(
      homeScreenEventPointsIcon("hse-faction-boost", {
        targetFactionId: "DarkAngels",
      })
    ).toBe(
      `${base}/liveevents/ui_icon_resource_event_faction_boost_dark_angels.webp`
    )
  })

  it("falls back to the generic event points icon", () => {
    expect(
      homeScreenEventPointsIcon("hse-faction-boost", { targetFactionId: "Tau" })
    ).toBe(`${base}/liveevents/ui_icon_resource_event_points_generic.webp`)
    expect(homeScreenEventPointsIcon("hse-against-the-tide")).toBe(
      `${base}/liveevents/ui_icon_resource_event_points_generic.webp`
    )
  })
})
