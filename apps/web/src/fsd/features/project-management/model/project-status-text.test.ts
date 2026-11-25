import type { TFunction } from "i18next"
import { describe, expect, it } from "vitest"

import {
  completionText,
  fitCountText,
  homeProjectFactsText,
} from "./project-status-text"

// Readable stand-ins for the en strings these facts use.
const STRINGS: Record<
  string,
  (options: Record<string, string | number>) => string
> = {
  "goals.deadlineFit.header.separator": () => " · ",
  "goals.deadlineFit.header.count": (o) => `${o.fit} of ${o.total} fit`,
  "goals.deadlineFit.header.allDone": (o) => `All ${o.count} done`,
  "goals.deadlineFit.header.notEstimated": (o) => `${o.count} not estimated`,
  "goals.project.completionSummary": (o) => `Done by ${o.date}`,
  "goals.project.noDate": () => "No date",
  "goals.project.goalCount": (o) => `${o.count} goals`,
}
const t = ((key: string, options: Record<string, string | number> = {}) =>
  STRINGS[key]?.(options) ?? key) as unknown as TFunction

const fit = { fit: 2, total: 4, notEstimated: 0, allDone: false }

describe("fitCountText", () => {
  it("counts the fitting goals, then the unestimated ones", () => {
    expect(fitCountText(t, fit)).toBe("2 of 4 fit")
    expect(fitCountText(t, { ...fit, notEstimated: 1 })).toBe(
      "2 of 4 fit · 1 not estimated"
    )
  })

  it("reads All N done only when every goal is done and estimated", () => {
    expect(fitCountText(t, { ...fit, allDone: true })).toBe("All 4 done")
    expect(fitCountText(t, { ...fit, allDone: true, notEstimated: 1 })).toBe(
      "2 of 4 fit · 1 not estimated"
    )
  })
})

describe("completionText", () => {
  const completion = { completionDate: "2026-12-26", unestimatedGoalCount: 2 }

  it("gives Done by with the unestimated count", () => {
    expect(completionText(t, completion, "en-US")).toBe(
      "Done by Dec 26 · 2 not estimated"
    )
  })

  it("reads No date without a completion date, and can leave out the count", () => {
    expect(
      completionText(t, { ...completion, completionDate: null }, "en-US", {
        withUnestimated: false,
      })
    ).toBe("No date")
  })
})

describe("homeProjectFactsText", () => {
  const completion = { completionDate: "2026-12-26", unestimatedGoalCount: 1 }

  it("puts the fit count first and says the unestimated count once", () => {
    expect(
      homeProjectFactsText(t, {
        goals: 4,
        fit: { ...fit, notEstimated: 1 },
        completion,
        dateLocale: "en-US",
      })
    ).toBe("2 of 4 fit · 1 not estimated · Done by Dec 26 · 4 goals")
  })

  it("gives an untargeted project's Done by and goal count", () => {
    expect(
      homeProjectFactsText(t, {
        goals: 4,
        fit: null,
        completion,
        dateLocale: "en-US",
      })
    ).toBe("Done by Dec 26 · 1 not estimated · 4 goals")
  })

  it("gives only the goal count before the plan runs or without goals", () => {
    expect(
      homeProjectFactsText(t, {
        goals: 3,
        fit: null,
        completion: null,
        dateLocale: "en-US",
      })
    ).toBe("3 goals")
    expect(
      homeProjectFactsText(t, {
        goals: 0,
        fit: null,
        completion,
        dateLocale: "en-US",
      })
    ).toBe("0 goals")
  })
})
