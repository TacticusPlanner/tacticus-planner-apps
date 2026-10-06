import { afterEach, describe, expect, it, vi } from "vitest"

import {
  selectActiveHomeScreenEvent,
  selectHomeScreenEventListTarget,
} from "./select-active-home-screen-event"

const definitions = new Map(
  [
    "hse-machine-hunt",
    "hse-warp-surge",
    "hse-training-rush",
    "hse-arsenal-of-war",
    "hse-faction-boost",
  ].map((id) => [id, { type: "HomeScreenEvent" }])
)
definitions.set("campaign-event", { type: "CampaignEvent" })
const entry = (definitionId: string, startUtc: string, endUtc: string) => ({
  definitionId,
  startUtc,
  endUtc,
})
const machineHunt = entry(
  "hse-machine-hunt",
  "2026-10-02T08:00:00Z",
  "2026-10-06T08:00:00Z"
)
const at = (iso: string) => Date.parse(iso)
const activeOf = (
  entries: ReturnType<typeof entry>[],
  now: string
): ReturnType<typeof entry> | null =>
  selectActiveHomeScreenEvent(entries, definitions, at(now)).active

describe("selectActiveHomeScreenEvent", () => {
  afterEach(() => vi.unstubAllEnvs())

  it("is active up to the last instant before the exclusive end", () => {
    expect(activeOf([machineHunt], "2026-10-06T07:59:59Z")).toBe(machineHunt)
    expect(activeOf([machineHunt], "2026-10-06T08:00:00Z")).toBeNull()
  })

  it("is active at the inclusive start", () => {
    expect(activeOf([machineHunt], "2026-10-02T08:00:00Z")).toBe(machineHunt)
  })

  it.each(["UTC", "Pacific/Honolulu", "Asia/Tokyo"])(
    "ignores the device timezone (%s)",
    (timeZone) => {
      vi.stubEnv("TZ", timeZone)
      // 2026-10-01 22:00 in UTC-10 is 2026-10-02T08:00Z.
      expect(activeOf([machineHunt], "2026-10-02T08:00:00Z")).toBe(machineHunt)
      expect(activeOf([machineHunt], "2026-10-02T07:59:59Z")).toBeNull()
    }
  )

  it("picks the latest-starting of two overlapping rule-bearing events", () => {
    const warp = entry(
      "hse-warp-surge",
      "2026-08-09T00:00:00Z",
      "2026-08-15T00:00:00Z"
    )
    const hunt = entry(
      "hse-machine-hunt",
      "2026-08-11T00:00:00Z",
      "2026-08-14T00:00:00Z"
    )
    expect(activeOf([warp, hunt], "2026-08-12T00:00:00Z")).toBe(hunt)
  })

  it("prefers a rule-bearing event over a later-starting one without a rule", () => {
    const warp = entry(
      "hse-warp-surge",
      "2026-08-09T00:00:00Z",
      "2026-08-15T00:00:00Z"
    )
    const arsenal = entry(
      "hse-arsenal-of-war",
      "2026-08-10T00:00:00Z",
      "2026-08-15T00:00:00Z"
    )
    expect(activeOf([arsenal, warp], "2026-08-12T00:00:00Z")).toBe(warp)
  })

  it("breaks a same-start tie by the lowest definition id", () => {
    const training = entry(
      "hse-training-rush",
      "2026-08-09T00:00:00Z",
      "2026-08-15T00:00:00Z"
    )
    const warp = entry(
      "hse-warp-surge",
      "2026-08-09T00:00:00Z",
      "2026-08-15T00:00:00Z"
    )
    expect(activeOf([warp, training], "2026-08-12T00:00:00Z")).toBe(training)
  })

  it("reports an active event without a rule", () => {
    const boost = entry(
      "hse-faction-boost",
      "2026-09-01T00:00:00Z",
      "2026-09-04T00:00:00Z"
    )
    expect(activeOf([boost], "2026-09-02T00:00:00Z")).toBe(boost)
  })

  it("selects the earliest not-yet-started event as next, ignoring non-HSE entries", () => {
    const later = entry(
      "hse-warp-surge",
      "2026-10-20T00:00:00Z",
      "2026-10-23T00:00:00Z"
    )
    const campaign = entry(
      "campaign-event",
      "2026-10-01T12:00:00Z",
      "2026-10-30T00:00:00Z"
    )
    const selection = selectActiveHomeScreenEvent(
      [later, campaign, machineHunt],
      definitions,
      at("2026-10-01T10:00:00Z")
    )
    expect(selection.active).toBeNull()
    expect(selection.next).toBe(machineHunt)
  })

  it("has neither with an empty calendar or only unknown definitions", () => {
    expect(selectActiveHomeScreenEvent([], definitions, 0)).toEqual({
      active: null,
      next: null,
      upcoming: [],
    })
    const mystery = entry(
      "mystery",
      "2026-01-01T00:00:00Z",
      "2027-01-01T00:00:00Z"
    )
    expect(activeOf([mystery], "2026-06-01T00:00:00Z")).toBeNull()
  })

  it("lists upcoming events ascending by start, excluding the active one, with next as the first", () => {
    const warp = entry(
      "hse-warp-surge",
      "2026-10-20T00:00:00Z",
      "2026-10-23T00:00:00Z"
    )
    const training = entry(
      "hse-training-rush",
      "2026-10-09T08:00:00Z",
      "2026-10-12T08:00:00Z"
    )
    const selection = selectActiveHomeScreenEvent(
      [warp, training, machineHunt],
      definitions,
      at("2026-10-03T00:00:00Z")
    )
    expect(selection.active).toBe(machineHunt)
    expect(selection.upcoming).toEqual([training, warp])
    expect(selection.next).toBe(selection.upcoming[0])
  })
})

describe("selectHomeScreenEventListTarget", () => {
  const warp = entry(
    "hse-warp-surge",
    "2026-10-10T08:00:00Z",
    "2026-10-14T08:00:00Z"
  )
  const faction = entry(
    "hse-faction-boost",
    "2026-10-10T08:00:00Z",
    "2026-10-14T08:00:00Z"
  )
  const targetAt = (entries: ReturnType<typeof entry>[], now: string) =>
    selectHomeScreenEventListTarget(
      selectActiveHomeScreenEvent(entries, definitions, at(now))
    )

  it("picks the running event as live", () => {
    expect(targetAt([machineHunt, warp], "2026-10-03T00:00:00Z")).toEqual({
      entry: machineHunt,
      live: true,
    })
  })

  it("previews the next rule-bearing event when none is running", () => {
    expect(targetAt([machineHunt, warp], "2026-10-07T00:00:00Z")).toEqual({
      entry: warp,
      live: false,
    })
  })

  it("previews the earliest upcoming event, not a later one", () => {
    expect(targetAt([warp, machineHunt], "2026-10-01T00:00:00Z")).toEqual({
      entry: machineHunt,
      live: false,
    })
  })

  it("has no lists for an upcoming event without a rule, even when a later one has one", () => {
    const earlyFaction = entry(
      "hse-faction-boost",
      "2026-10-08T08:00:00Z",
      "2026-10-09T08:00:00Z"
    )
    expect(targetAt([earlyFaction, warp], "2026-10-07T00:00:00Z")).toBeNull()
    expect(targetAt([faction], "2026-10-07T00:00:00Z")).toBeNull()
  })

  it("has no lists for a running event without a rule", () => {
    expect(targetAt([faction], "2026-10-11T00:00:00Z")).toBeNull()
  })

  it("has no lists with nothing scheduled", () => {
    expect(targetAt([machineHunt], "2026-11-01T00:00:00Z")).toBeNull()
  })
})
