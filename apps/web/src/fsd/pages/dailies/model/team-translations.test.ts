import { describe, expect, it } from "vitest"

import teamRecsDe from "../../../../../public/locales/de/teamRecs.json"
import teamRecsEn from "../../../../../public/locales/en/teamRecs.json"
import teamRecsEs from "../../../../../public/locales/es/teamRecs.json"
import teamRecsFr from "../../../../../public/locales/fr/teamRecs.json"

function leafKeys(value: unknown, prefix = ""): string[] {
  if (typeof value !== "object" || value === null) return [prefix]
  return Object.entries(value).flatMap(([key, child]) =>
    leafKeys(child, prefix ? `${prefix}.${key}` : key)
  )
}

describe("Dailies team-recommendation translations", () => {
  it.each([
    [
      "teamRecs",
      teamRecsEn,
      { de: teamRecsDe, es: teamRecsEs, fr: teamRecsFr },
    ],
  ] as const)(
    "keeps every locale of %s aligned with English",
    (_ns, en, rest) => {
      for (const resource of Object.values(rest)) {
        expect(leafKeys(resource).sort()).toEqual(leafKeys(en).sort())
      }
    }
  )

  it("provides the shared control, state, and rationale copy in teamRecs", () => {
    for (const locale of [teamRecsEn, teamRecsDe, teamRecsEs, teamRecsFr]) {
      expect(locale.mode.xp).toBeTruthy()
      expect(locale.mode.power).toBeTruthy()
      expect(locale.project.label).toBeTruthy()
      expect(locale.teamSize.label).toBeTruthy()
      expect(locale.preferences.trait).toBeTruthy()
      expect(locale.preferences.damageType).toBeTruthy()
      expect(locale.preferences.any).toBeTruthy()
      expect(locale.preferences.matchesTrait).toContain("{{attribute}}")
      expect(locale.preferences.matchesDamageType).toContain("{{attribute}}")
      expect(locale.preferences.missingTrait).toContain("{{attribute}}")
      expect(locale.preferences.missingDamageType).toContain("{{attribute}}")
      expect(locale.rationale.onslaughtGoal).toBeTruthy()
      expect(locale.rationale.eventUnit).toContain("{{match}}")
      expect(locale.rationale.eventUnitAny).toBeTruthy()
      expect(locale.category.plan.title).toBeTruthy()
      expect(locale.category.random.title).toBeTruthy()
      expect(locale.category.fewerThanRequested).toContain("{{delivered}}")
      expect(locale.category.fewerThanRequested).toContain("{{requested}}")
      expect(locale.lock.lock).toBeTruthy()
      expect(locale.lock.unlock).toBeTruthy()
      expect(locale.rationale.strength).toContain("{{power}}")
      expect(locale.state.error).toBeTruthy()
    }
  })

  it("provides the alliance-track shortfall copy in teamRecs", () => {
    for (const locale of [teamRecsEn, teamRecsDe, teamRecsEs, teamRecsFr]) {
      expect(locale.track.shortfallTitle).toContain("{{track}}")
      expect(locale.track.shortfall).toContain("{{owned}}")
      expect(locale.track.shortfall).toContain("{{needed}}")
    }
  })
})
