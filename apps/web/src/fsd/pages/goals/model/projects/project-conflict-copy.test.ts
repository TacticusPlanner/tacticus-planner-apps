import { describe, expect, it } from "vitest"
import type { TFunction } from "i18next"

import de from "../../../../../../public/locales/de/common.json"
import en from "../../../../../../public/locales/en/common.json"
import es from "../../../../../../public/locales/es/common.json"
import fr from "../../../../../../public/locales/fr/common.json"

import {
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
      expect(locale.tour.projectDetail.steps.addGoals.content).not.toBe(
        en.tour.projectDetail.steps.addGoals.content
      )
      expect(locale.tour.projectDetail.steps.goals.content).not.toBe(
        en.tour.projectDetail.steps.goals.content
      )
    }
  )

  it("names the target in the English conflict copy", () => {
    expect(en.goals.project.assemblyRankTargetTaken).toContain("{{target}}")
    expect(en.tour.overview.steps.list.content).toMatch(/Rank goals/)
  })
})
