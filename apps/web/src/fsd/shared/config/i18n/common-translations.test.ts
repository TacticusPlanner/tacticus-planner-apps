import { describe, expect, it } from "vitest"

import de from "../../../../../public/locales/de/common.json"
import en from "../../../../../public/locales/en/common.json"
import es from "../../../../../public/locales/es/common.json"
import fr from "../../../../../public/locales/fr/common.json"

/** Every leaf key path of a nested translation object, e.g. `goals.edit.title`. */
function keyPaths(node: unknown, prefix = ""): string[] {
  return node !== null && typeof node === "object"
    ? Object.entries(node).flatMap(([key, value]) =>
        keyPaths(value, prefix ? `${prefix}.${key}` : key)
      )
    : [prefix]
}

const enKeys = keyPaths(en).sort()

describe("common namespace locale parity", () => {
  it.each([
    ["de", de],
    ["es", es],
    ["fr", fr],
  ])("%s has exactly the English keys", (_, locale) => {
    expect(keyPaths(locale).sort()).toEqual(enKeys)
  })

  it.each([
    ["de", de],
    ["es", es],
    ["fr", fr],
  ])(
    "%s translates the Edit goal dialog copy instead of copying English",
    (_, locale) => {
      for (const path of ["title", "save", "errors.stale", "priority.hint"]) {
        const pick = (root: typeof en) =>
          path
            .split(".")
            .reduce<unknown>(
              (node, key) => (node as Record<string, unknown>)[key],
              root.goals.edit
            )
        expect(pick(locale), path).not.toBe(pick(en))
      }
      expect(locale.tour.editGoal.steps.priority.content).not.toBe(
        en.tour.editGoal.steps.priority.content
      )
    }
  )

  it.each([
    ["de", de],
    ["es", es],
    ["fr", fr],
  ])(
    "%s translates the HSE live indicator and Home card copy",
    (lng, locale) => {
      expect(locale.nav.eventLive).not.toBe(en.nav.eventLive)
      // "LIVE" is the same word in German, and German keeps the loanword "Events" for the card
      // title (as in "Startbildschirm-Events"); every other card string must differ from English.
      if (lng !== "de") {
        expect(locale.home.events.title).not.toBe(en.home.events.title)
      }
      for (const key of [
        "run",
        "sourceFailed",
        "openHse",
        "openLegendaryEvents",
        "endsIn",
        "startsIn",
        "empty",
        "error",
        "loading",
      ] as const) {
        expect(locale.home.events[key], key).not.toBe(en.home.events[key])
      }
      expect(locale.home.events.endsIn).toContain("{{when}}")
      expect(locale.home.events.startsIn).toContain("{{when}}")
      expect(locale.home.events.sourceFailed).toContain("{{type}}")
      // "points" is also the French word, so only the placeholder is checked.
      expect(locale.home.events.points).toContain("{{points}}")
    }
  )

  it.each([
    ["de", de],
    ["es", es],
    ["fr", fr],
  ])(
    "%s translates the Legendary Events section navigation copy",
    (lng, locale) => {
      // German keeps "Events" (as in "Legendäre Events"); the label must still be translated.
      expect(locale.nav.legendaryEvents, lng).not.toBe(en.nav.legendaryEvents)
      expect(locale.nav.legendaryEventsDescription).not.toBe(
        en.nav.legendaryEventsDescription
      )
      for (const key of [
        "allEvents",
        "allEventsDescription",
        "activeEventDescription",
      ] as const) {
        expect(locale.legendaryEvents.tabs[key], key).not.toBe(
          en.legendaryEvents.tabs[key]
        )
      }
      expect(locale.tour.steps.navigation.content).not.toContain(
        "Events for Legendary Events"
      )
    }
  )

  it.each([
    ["de", de],
    ["es", es],
    ["fr", fr],
  ])(
    "%s translates the Legendary Event run inputs and marks import copy",
    (_, locale) => {
      const le = locale.goals.v1Import.legendaryEvents
      const enLe = en.goals.v1Import.legendaryEvents
      expect(
        locale.goals.v1Import.partDescriptions.legendaryEventPlans
      ).not.toBe(en.goals.v1Import.partDescriptions.legendaryEventPlans)
      expect(le.runs_other).not.toBe(enLe.runs_other)
      expect(le.reasons.inputs_imported).not.toBe(enLe.reasons.inputs_imported)
      for (const key of [
        "run_input_clamped",
        "unknown_run",
        "existing_run_inputs_kept",
        "unknown_battle",
        "existing_annotations_kept_other",
        "unknown_objective_mark",
        "unknown_lane_mark",
      ] as const) {
        expect(le.issues[key], key).not.toBe(enLe.issues[key])
      }
    }
  )

  it("describes run inputs and marks in the Legendary Event part", () => {
    const description = en.goals.v1Import.partDescriptions.legendaryEventPlans
    expect(description).toMatch(/inputs/)
    expect(description).toMatch(/Maybe clear/)
    expect(description).toMatch(/not imported/)
  })

  it.each([
    ["de", de],
    ["es", es],
    ["fr", fr],
  ])(
    "%s translates My Game, the Collection page, unit tiles and the Collection tour",
    (_, locale) => {
      expect(locale.nav.myGame).not.toBe(en.nav.myGame)
      expect(locale.nav.myGameDescription).not.toBe(en.nav.myGameDescription)
      expect(locale.myGame.tabs.collectionDescription).not.toBe(
        en.myGame.tabs.collectionDescription
      )
      for (const [key, value] of Object.entries(en.myGame.collection)) {
        expect(
          locale.myGame.collection[key as keyof typeof en.myGame.collection],
          key
        ).not.toBe(value)
      }
      for (const [key, value] of Object.entries(en.unitTile)) {
        expect(locale.unitTile[key as keyof typeof en.unitTile], key).not.toBe(
          value
        )
      }
      for (const [step, copy] of Object.entries(en.tour.collection.steps)) {
        const translated =
          locale.tour.collection.steps[
            step as keyof typeof en.tour.collection.steps
          ]
        expect(translated.title, step).not.toBe(copy.title)
        expect(translated.content, step).not.toBe(copy.content)
      }
      expect(locale.myGame.collection.summary).toContain("{{owned}}")
      expect(locale.myGame.collection.summary).toContain("{{total}}")
      expect(locale.unitTile.shardsToUnlock_other).toContain("{{required}}")
      // The general tour now points at My Game instead of Progress.
      expect(locale.tour.steps.bottomNavigationGroup.content).toContain(
        locale.nav.myGame
      )
    }
  )

  it.each([
    ["de", de],
    ["es", es],
    ["fr", fr],
  ])("%s translates the too-small team import reason", (_, locale) => {
    const issues = locale.goals.v1Import.legendaryEvents.issues
    const english = en.goals.v1Import.legendaryEvents.issues
    expect(issues.team_too_small_one).not.toBe(english.team_too_small_one)
    expect(issues.team_too_small_other).not.toBe(english.team_too_small_other)
  })
})
