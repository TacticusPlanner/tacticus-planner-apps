import { describe, expect, it } from "vitest"

import {
  adjacentHomeScreenEventKeys,
  groupHomeScreenEventInstances,
} from "./home-screen-event-switcher"
import type { HomeScreenEventInstance } from "./select-active-home-screen-event"

const instance = (
  key: string,
  status: HomeScreenEventInstance<never>["status"]
) =>
  ({
    key,
    status,
    entry: { definitionId: key, startUtc: "", endUtc: "" },
  }) as HomeScreenEventInstance<{
    definitionId: string
    startUtc: string
    endUtc: string
  }>

// Chronological, as listHomeScreenEventInstances returns them.
const instances = [
  instance("hunt", "past"),
  instance("rush", "past"),
  instance("tide", "past"),
  instance("focus", "running"),
  instance("imperator", "running"),
  instance("psyker", "upcoming"),
  instance("warp", "upcoming"),
]

describe("groupHomeScreenEventInstances", () => {
  it("groups Running and Upcoming by start and Past newest first", () => {
    const groups = groupHomeScreenEventInstances(instances)
    expect(groups.running.map((item) => item.key)).toEqual([
      "focus",
      "imperator",
    ])
    expect(groups.upcoming.map((item) => item.key)).toEqual(["psyker", "warp"])
    expect(groups.past.map((item) => item.key)).toEqual([
      "tide",
      "rush",
      "hunt",
    ])
  })

  it("has empty groups with no instances", () => {
    expect(groupHomeScreenEventInstances([])).toEqual({
      running: [],
      upcoming: [],
      past: [],
    })
  })
})

describe("adjacentHomeScreenEventKeys", () => {
  it("steps to the closest earlier and later start", () => {
    expect(adjacentHomeScreenEventKeys(instances, "focus")).toEqual({
      previous: "tide",
      next: "imperator",
    })
  })

  it("has no previous at the first and no next at the last instance", () => {
    expect(adjacentHomeScreenEventKeys(instances, "hunt").previous).toBeNull()
    expect(adjacentHomeScreenEventKeys(instances, "warp").next).toBeNull()
  })

  it("offers the latest instance as previous when nothing is shown", () => {
    expect(adjacentHomeScreenEventKeys(instances, null)).toEqual({
      previous: "warp",
      next: null,
    })
    expect(adjacentHomeScreenEventKeys([], null)).toEqual({
      previous: null,
      next: null,
    })
  })
})
