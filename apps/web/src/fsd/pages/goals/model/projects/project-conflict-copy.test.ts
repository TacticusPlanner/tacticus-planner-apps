import { describe, expect, it } from "vitest"
import type { TFunction } from "i18next"

import de from "../../../../../../public/locales/de/common.json"
import en from "../../../../../../public/locales/en/common.json"
import es from "../../../../../../public/locales/es/common.json"
import fr from "../../../../../../public/locales/fr/common.json"

import { ApiError } from "@/shared/api"

import {
  membershipErrorText,
  projectConflictText,
  rankTargetKeyLabel,
} from "./project-conflict-copy"

// Echoes the key and options so the test sees which message was chosen; a rank lookup returns its
// `defaultValue` (the rank name), like the real `progression` namespace fallback.
const t = ((key: string, options?: Record<string, unknown>) =>
  options && "defaultValue" in options
    ? String(options.defaultValue)
    : options
      ? `${key}:${JSON.stringify(options)}`
      : key) as unknown as TFunction

describe("rankTargetKeyLabel", () => {
  it("names the rank, adding the applied slots for a partial target", () => {
    expect(rankTargetKeyLabel(t, "11:0")).toBe("Silver3")
    expect(rankTargetKeyLabel(t, "12:3")).toBe("Gold1 (3/6)")
  })

  it("is null for a malformed key", () => {
    expect(rankTargetKeyLabel(t, "nonsense")).toBeNull()
  })
})

describe("projectConflictText", () => {
  it("names the exact Rank target for a Rank conflict", () => {
    expect(projectConflictText(t, "Plan B", ["Rank"], "11:0")).toBe(
      'goals.project.membershipConflictRank:{"project":"Plan B","target":"Silver3"}'
    )
  })

  it("keeps the goal-type wording for every other goal type", () => {
    expect(projectConflictText(t, "Plan B", ["Ascension"])).toContain(
      "goals.project.membershipConflict:"
    )
    expect(projectConflictText(t, "Plan B", ["Ascension"])).not.toContain(
      "Rank"
    )
  })
})

describe("Rank milestone copy in every locale", () => {
  it.each([
    ["de", de],
    ["es", es],
    ["fr", fr],
  ])(
    "%s translates the target-specific conflict and tour copy",
    (_, locale) => {
      for (const key of [
        "assemblyRankTargetTaken",
        "membershipConflictRank",
      ] as const) {
        expect(locale.goals.project[key]).toBeTruthy()
        expect(locale.goals.project[key]).not.toBe(en.goals.project[key])
      }
      expect(locale.goals.project.membershipConflictRank).toContain(
        "{{target}}"
      )
      expect(locale.tour.overview.steps.projectScope.content).not.toBe(
        en.tour.overview.steps.projectScope.content
      )
    }
  )

  it("names the target in the English conflict copy", () => {
    expect(en.goals.project.assemblyRankTargetTaken).toContain("{{target}}")
    expect(en.tour.overview.steps.list.content).toMatch(/Rank goals/)
  })
})

describe("membershipErrorText", () => {
  it("names the project and goal type for an occupied slot", () => {
    const error = new ApiError(409, "Occupied", {
      issueCode: "projectGoalSlotOccupied",
      message: "Occupied",
      projectId: "p1",
      projectName: "Event Prep",
      entityType: "Character",
      entityId: "hero1",
      goalType: "Ascension",
      existingGoalId: "goal-9",
    })
    expect(membershipErrorText(t, error)).toBe(
      'goals.project.membershipConflict:{"project":"Event Prep","types":"goals.create.goalTypes.Ascension"}'
    )
  })

  it("explains a removal that would leave a goal in no project", () => {
    const error = new ApiError(400, "Only project", {
      issueCode: "lastProjectMembership",
      message: "Only project",
      blockedGoalIds: ["goal-1"],
    })
    expect(membershipErrorText(t, error)).toBe(
      "goals.project.removeLastMembership"
    )
  })

  it("falls back to the server message, then the generic error", () => {
    expect(membershipErrorText(t, new ApiError(500, "Boom"))).toBe("Boom")
    expect(membershipErrorText(t, new Error("network"))).toBe(
      "goals.toasts.actionError"
    )
  })
})
