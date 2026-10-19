import { renderHook } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { utharEvent } from "@/test/fixtures/legendary-events"
import { createTestI18n, i18nWrapper } from "@/test/i18n"

import { eventMissions, type LegendaryEventMission } from "../lib/missions"
import { useMissionLabel } from "./use-mission-label"

const regular = eventMissions(utharEvent, "regular")
const premium = eventMissions(utharEvent, "premium")

async function labelsIn(
  lng: "en" | "de",
  missions: readonly LegendaryEventMission[]
) {
  const i18n = await createTestI18n(lng)
  const { result } = renderHook(() => useMissionLabel(), {
    wrapper: i18nWrapper(i18n),
  })
  return missions.map((mission) => result.current(mission))
}

describe("useMissionLabel", () => {
  it("labels each kind from its parameters", async () => {
    expect(await labelsIn("en", [...regular, ...premium])).toEqual([
      "Defeat 5 waves in any battle",
      "Defeat 30 Necrons",
      "Defeat 75 Adeptus Mechanicus",
      "Defeat 100 Death Guard",
      "Use abilities 15 times with Imperial units",
      "Use abilities 20 times with Chaos units",
      "Use abilities 25 times with Xenos units",
      "Deal Piercing damage over 15 waves",
      "Deal Psychic damage over 15 waves",
      "Deal Bolter damage over 15 waves",
      "Win 1 battle without summoning any units",
      "Defeat 30 enemies with Chaos units",
      "Defeat 75 enemies with Imperial units",
      "Defeat 100 enemies with Xenos units",
      "Win 5 battles without deploying any Big Target characters",
      "Win 5 battles without deploying any Resilient characters",
      "Win 5 battles without deploying any Ambush characters",
      "Defeat 75 enemies with Bolter damage",
      "Defeat 75 enemies with Power damage",
      "Defeat 75 enemies with Piercing damage",
    ])
  })

  it("translates the template into the active language", async () => {
    expect(await labelsIn("de", [regular[1]!])).toEqual(["Besiege 30 Necrons"])
  })

  it("names a trait-based enemy mission by its trait", async () => {
    const daemons = { ...regular[1]!, faction: null, trait: "Daemon" }
    expect(await labelsIn("en", [daemons])).toEqual([
      "Defeat 30 Daemon enemies",
    ])
  })

  it("falls back to the served text for an unknown kind", async () => {
    const unknown = { ...regular[1]!, kind: "somethingNew", text: "Do a thing" }
    expect(await labelsIn("en", [unknown])).toEqual(["Do a thing"])
  })
})
