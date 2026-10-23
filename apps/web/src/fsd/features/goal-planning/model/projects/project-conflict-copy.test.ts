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

const rankGoal = {
  goalType: "Rank",
  config: {
    rank: {
      start: 0,
      startPointFive: false,
      startAppliedUpgrades: 0,
      end: 11,
      endPointFive: false,
      endAppliedUpgrades: 0,
    },
  },
} as never

describe("projectConflictText", () => {
  it("names the existing goal's unit and exact Rank target, never a project", () => {
    expect(projectConflictText(t, rankGoal, "Ragnar")).toBe(
      'goals.project.membershipConflictRank:{"unit":"Ragnar","target":"Silver3"}'
    )
  })

  it("names the unit and goal kind for every other goal type", () => {
    expect(
      projectConflictText(
        t,
        { goalType: "Ascension", config: {} } as never,
        "Ragnar"
      )
    ).toBe(
      'goals.project.membershipConflict:{"unit":"Ragnar","type":"goals.create.goalTypes.Ascension"}'
    )
  })
})

describe("goal-naming conflict copy in every locale", () => {
  it.each([
    ["de", de],
    ["es", es],
    ["fr", fr],
  ])("%s translates the conflict and status-conflict copy", (_, locale) => {
    for (const key of [
      "membershipConflict",
      "membershipConflictRank",
    ] as const) {
      expect(locale.goals.project[key]).toContain("{{unit}}")
      expect(locale.goals.project[key]).not.toBe(en.goals.project[key])
    }
    expect(locale.goals.project.membershipConflictRank).toContain("{{target}}")
    expect(locale.goals.toasts.statusConflict).toContain("{{goal}}")
    expect(locale.goals.toasts.statusConflict).toContain("{{reason}}")
    expect(locale.goals.toasts.statusConflict).not.toBe(
      en.goals.toasts.statusConflict
    )
    expect(locale.tour.overview.steps.projectScope.content).not.toBe(
      en.tour.overview.steps.projectScope.content
    )
  })

  it("no longer names a project in the English conflict copy", () => {
    expect(en.goals.project.membershipConflict).not.toContain("{{project}}")
    expect(en.tour.overview.steps.list.content).toMatch(/Rank goals/)
  })
})

describe("membershipErrorText", () => {
  it("explains a removal that would leave a goal in no project", () => {
    const error = new ApiError(400, "Only project", {
      issueCode: "lastProjectMembership",
      extensions: { blockedGoalIds: ["goal-1"] },
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
