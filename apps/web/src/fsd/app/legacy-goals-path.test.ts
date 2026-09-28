import { describe, expect, it } from "vitest"

import { mapLegacyGoalsPath } from "./legacy-goals-path"

describe("mapLegacyGoalsPath", () => {
  it.each([
    ["/goals", "/plan/goals"],
    ["/goals/", "/plan/goals"],
    ["/goals/overview", "/plan/goals"],
    ["/goals/plan", "/plan/goals"],
    ["/goals/projects", "/plan/projects"],
    ["/goals/projects/abc-123", "/plan/projects/abc-123"],
    ["/goals/insights", "/plan/insights"],
    ["/goals/overview?status=paused#top", "/plan/goals?status=paused#top"],
    ["/goals?x=1", "/plan/goals?x=1"],
    ["/goals/projects/abc#notes", "/plan/projects/abc#notes"],
  ])("maps %s to %s", (legacy, expected) => {
    expect(mapLegacyGoalsPath(legacy)).toBe(expected)
  })

  it.each(["/home", "/plan/goals", "/goalsfoo", "/dailies/goals"])(
    "leaves %s alone",
    (path) => {
      expect(mapLegacyGoalsPath(path)).toBe(path)
    }
  )
})
