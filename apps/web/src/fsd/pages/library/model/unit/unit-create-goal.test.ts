import { describe, expect, it } from "vitest"
import type { UnitId } from "@workspace/game-domain"

import { unitCreateGoalPrefill } from "./unit-create-goal"

const tigurius = "ultraTigurius" as UnitId

describe("unitCreateGoalPrefill", () => {
  it("starts a unit the roster doesn't hold on Unlock", () => {
    expect(unitCreateGoalPrefill("Character", tigurius, "notOwned")).toEqual({
      entityType: "Character",
      entityId: tigurius,
      goalType: "Unlock",
    })
  })

  it.each(["owned", "noRoster", "loading"] as const)(
    "selects only the unit when ownership is %s",
    (ownership) => {
      expect(unitCreateGoalPrefill("Mow", tigurius, ownership)).toEqual({
        entityType: "Mow",
        entityId: tigurius,
      })
    }
  )
})
