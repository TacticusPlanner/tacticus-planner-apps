import type { TFunction } from "i18next"
import { describe, expect, it } from "vitest"

import { blockerReasonText, computeGoalBlockers } from "./goal-blockers"

const t = ((key: string, options?: Record<string, unknown>) =>
  options ? `${key}:${JSON.stringify(options)}` : key) as unknown as TFunction

describe("computeGoalBlockers", () => {
  it("carries each unreached prerequisite's label into its reason", () => {
    const blockers = computeGoalBlockers({
      estimateReason: undefined,
      unreachedPrerequisites: [
        {
          goalId: "goal-2",
          prerequisite: { unitName: "Bellator", goalType: "Unlock" },
        },
        { goalId: "goal-3" },
      ],
      playerDataUnavailable: false,
      catalogDataUnavailable: false,
    })

    expect(blockers).toEqual({
      isBlocked: true,
      reasons: [
        {
          kind: "PrerequisiteNotReached",
          goalId: "goal-2",
          prerequisite: { unitName: "Bellator", goalType: "Unlock" },
        },
        {
          kind: "PrerequisiteNotReached",
          goalId: "goal-3",
          prerequisite: undefined,
        },
      ],
    })
  })
})

describe("blockerReasonText", () => {
  it("names the prerequisite goal's unit and kind once it is known", () => {
    expect(
      blockerReasonText(t, {
        kind: "PrerequisiteNotReached",
        goalId: "goal-2",
        prerequisite: { unitName: "Calgar", goalType: "Ascension" },
      })
    ).toBe(
      'goals.blocked.reasons.PrerequisiteNotReachedNamed:{"unit":"Calgar","goalType":"goals.create.goalTypes.Ascension"}'
    )
  })

  it("falls back to the generic sentence while the prerequisite is still loading", () => {
    expect(
      blockerReasonText(t, { kind: "PrerequisiteNotReached", goalId: "goal-2" })
    ).toBe("goals.blocked.reasons.PrerequisiteNotReached")
  })
})
