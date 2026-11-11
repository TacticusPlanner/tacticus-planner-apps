import type { TFunction } from "i18next"
import { describe, expect, it } from "vitest"

import { ApiError } from "@/shared/api"

import { goalCreateErrorText } from "./goal-create-error"

// Echoes the key (plus options) so each branch is identifiable without loading translations.
const t = ((key: string, options?: Record<string, unknown>) =>
  options && "max" in options ? `${key}:${String(options.max)}` : key) as TFunction
const unitName = () => "Bellator"

describe("goalCreateErrorText", () => {
  it("reads a server error as a retryable server failure, not raw status text", () => {
    expect(
      goalCreateErrorText(
        t,
        new ApiError(503, "API request failed with status 503"),
        unitName
      )
    ).toBe("goals.create.serverError")
  })

  it("reads a rate limit and a network failure the same way", () => {
    expect(goalCreateErrorText(t, new ApiError(429, "slow down"), unitName)).toBe(
      "goals.create.serverError"
    )
    expect(
      goalCreateErrorText(t, new TypeError("Failed to fetch"), unitName)
    ).toBe("goals.create.serverError")
  })

  it("keeps a validation failure's own sentence", () => {
    expect(
      goalCreateErrorText(
        t,
        new ApiError(400, "The selected unit is already unlocked."),
        unitName
      )
    ).toBe("The selected unit is already unlocked.")
  })

  it("translates the per-type goal cap", () => {
    expect(
      goalCreateErrorText(
        t,
        new ApiError(400, "server text", { issueCode: "goalLimitReached" }),
        unitName
      )
    ).toBe("goals.limits.goalLimitReachedGeneric:200")
  })

  it("names the existing goal on a slot conflict", () => {
    const text = goalCreateErrorText(
      t,
      new ApiError(409, "occupied", {
        issueCode: "slotOccupied",
        current: {
          goalId: "goal-existing",
          entityType: "Character",
          entityId: "bellator",
          goalType: "Ascension",
          config: {},
        },
      }),
      unitName
    )
    expect(text).not.toBe("occupied")
    expect(text).toMatch(/^goals\.project\./)
  })

  it("falls back to the generic copy for anything else", () => {
    expect(goalCreateErrorText(t, new Error("boom"), unitName)).toBe(
      "goals.create.genericError"
    )
  })
})
