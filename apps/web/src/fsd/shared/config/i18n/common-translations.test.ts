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
        expect(pick(locale as typeof en), path).not.toBe(pick(en))
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
  ])("%s translates the HSE live indicator and Home card copy", (_, locale) => {
    expect(locale.nav.eventLive).not.toBe(en.nav.eventLive)
    // "LIVE" is the same word in German; every other card string must differ from English.
    for (const key of [
      "title",
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
  })
})
