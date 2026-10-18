import { describe, expect, it } from "vitest"

import de from "../../../../../public/locales/de/dailies.json"
import deCommon from "../../../../../public/locales/de/common.json"
import en from "../../../../../public/locales/en/dailies.json"
import enCommon from "../../../../../public/locales/en/common.json"
import es from "../../../../../public/locales/es/dailies.json"
import esCommon from "../../../../../public/locales/es/common.json"
import fr from "../../../../../public/locales/fr/dailies.json"
import frCommon from "../../../../../public/locales/fr/common.json"

function leafKeys(value: unknown, prefix = ""): string[] {
  if (typeof value !== "object" || value === null) return [prefix]
  return Object.entries(value).flatMap(([key, child]) =>
    leafKeys(child, prefix ? `${prefix}.${key}` : key)
  )
}

describe("Dailies translations", () => {
  it.each([
    ["de", de],
    ["es", es],
    ["fr", fr],
  ])("keeps the %s namespace aligned with English", (_locale, resource) => {
    expect(leafKeys(resource).sort()).toEqual(leafKeys(en).sort())
  })

  it.each([
    ["en", enCommon],
    ["de", deCommon],
    ["es", esCommon],
    ["fr", frCommon],
  ])("removes legacy Dailies keys from %s/common.json", (_locale, common) => {
    expect(common).not.toHaveProperty("dailies")
  })

  it.each([
    ["de", deCommon],
    ["es", esCommon],
    ["fr", frCommon],
  ])(
    "keeps the shared Guild copy aligned in %s/common.json",
    (_locale, common) => {
      expect(leafKeys(common.guild).sort()).toEqual(
        leafKeys(enCommon.guild).sort()
      )
    }
  )

  it.each([
    ["en", en],
    ["de", de],
    ["es", es],
    ["fr", fr],
  ])("provides the HSE event teams copy and tour step in %s", (_locale, r) => {
    const teams = r.hse.teams
    expect(teams.title).toBeTruthy()
    expect(teams.description).toBeTruthy()
    expect(teams.modeLabel).toBeTruthy()
    expect(teams.anyUnit).toBeTruthy()
    expect(teams.broadened).toBeTruthy()
    expect(teams.broadenedNone).toBeTruthy()
    expect(teams.broadenedFaction).toContain("{{faction}}")
    expect(teams.faction).toContain("{{faction}}")
    expect(teams.hints.allowed).toContain("{{enemies}}")
    expect(teams.hints.excluded).toContain("{{enemies}}")
    expect(teams.hints.allowedExcluded).toContain("{{enemies}}")
    expect(teams.hints.allowedExcluded).toContain("{{excluded}}")
    expect(teams.hints.units).toContain("{{units}}")
    expect(r.tour.hse.steps.teams.title).toBeTruthy()
    expect(r.tour.hse.steps.teams.content).toBeTruthy()
  })

  it.each([
    ["en", en],
    ["de", de],
    ["es", es],
    ["fr", fr],
  ])("templates the HSE joins and the unknown-sync note in %s", (_l, r) => {
    const projection = r.hse.projection
    expect(projection.finalReachedRepeats).toContain("{{final}}")
    expect(projection.finalReachedRepeats).toContain("{{repeats}}")
    expect(projection.pointsNone).toBeTruthy()
    expect(projection.notes.syncUnknown).toBeTruthy()
    expect(projection.notes.syncUnknown).not.toContain("{{when}}")
    expect(r.hse.details.milestoneQuantity).toContain("{{quantity}}")
    expect(r.hse.details.descriptionLine).toContain("{{line}}")
  })
})
