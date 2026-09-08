import { describe, expect, it } from "vitest"

import arenaDe from "../../../../../public/locales/de/arena.json"
import arenaEn from "../../../../../public/locales/en/arena.json"
import arenaEs from "../../../../../public/locales/es/arena.json"
import arenaFr from "../../../../../public/locales/fr/arena.json"
import teamRecsDe from "../../../../../public/locales/de/teamRecs.json"
import teamRecsEn from "../../../../../public/locales/en/teamRecs.json"
import teamRecsEs from "../../../../../public/locales/es/teamRecs.json"
import teamRecsFr from "../../../../../public/locales/fr/teamRecs.json"
import salvageRunDe from "../../../../../public/locales/de/salvageRun.json"
import salvageRunEn from "../../../../../public/locales/en/salvageRun.json"
import salvageRunEs from "../../../../../public/locales/es/salvageRun.json"
import salvageRunFr from "../../../../../public/locales/fr/salvageRun.json"

function leafKeys(value: unknown, prefix = ""): string[] {
  if (typeof value !== "object" || value === null) return [prefix]
  return Object.entries(value).flatMap(([key, child]) =>
    leafKeys(child, prefix ? `${prefix}.${key}` : key)
  )
}

describe("Dailies team-recommendation translations", () => {
  it.each([
    ["arena", arenaEn, { de: arenaDe, es: arenaEs, fr: arenaFr }],
    [
      "teamRecs",
      teamRecsEn,
      { de: teamRecsDe, es: teamRecsEs, fr: teamRecsFr },
    ],
    [
      "salvageRun",
      salvageRunEn,
      { de: salvageRunDe, es: salvageRunEs, fr: salvageRunFr },
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

  it("provides the page title and the full tour in arena", () => {
    for (const locale of [arenaEn, arenaDe, arenaEs, arenaFr]) {
      expect(locale.title).toBeTruthy()
      expect(locale.subtitle).toBeTruthy()
      expect(Object.keys(locale.tour.arena.steps).sort()).toEqual([
        "locks",
        "mode",
        "plan",
        "preferences",
        "project",
        "purpose",
        "regenerate",
        "teamSize",
      ])
    }
  })

  it("provides the track copy and the full tour in salvageRun", () => {
    for (const locale of [
      salvageRunEn,
      salvageRunDe,
      salvageRunEs,
      salvageRunFr,
    ]) {
      expect(locale.title).toBeTruthy()
      expect(locale.subtitle).toBeTruthy()
      expect(locale.track.label).toBeTruthy()
      expect(locale.track.imperial).toBeTruthy()
      expect(locale.track.chaos).toBeTruthy()
      expect(locale.track.xenos).toBeTruthy()
      expect(locale.track.shortfallTitle).toContain("{{track}}")
      expect(locale.track.shortfall).toContain("{{owned}}")
      expect(locale.track.shortfall).toContain("{{needed}}")
      expect(Object.keys(locale.tour.salvageRun.steps).sort()).toEqual([
        "locks",
        "mode",
        "plan",
        "preferences",
        "project",
        "purpose",
        "regenerate",
        "teamSize",
        "track",
      ])
    }
  })
})
