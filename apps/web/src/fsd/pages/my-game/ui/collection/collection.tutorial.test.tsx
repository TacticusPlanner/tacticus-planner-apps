import type { ReactNode } from "react"
import { renderHook } from "@testing-library/react"
import type { i18n as I18n } from "i18next"
import { I18nextProvider } from "react-i18next"
import { beforeAll, describe, expect, it } from "vitest"

import { createTestI18n } from "@/test/i18n"

import deCommon from "../../../../../../public/locales/de/common.json"
import enCommon from "../../../../../../public/locales/en/common.json"
import esCommon from "../../../../../../public/locales/es/common.json"
import frCommon from "../../../../../../public/locales/fr/common.json"
import { useCollectionTutorial } from "./collection.tutorial"

let i18n: I18n
beforeAll(async () => {
  i18n = await createTestI18n("en")
})

function steps(flags: {
  hasSummary: boolean
  hasOwned: boolean
  hasUnowned: boolean
}) {
  const wrapper = ({ children }: { children: ReactNode }) => (
    <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
  )
  return renderHook(() => useCollectionTutorial(flags), { wrapper }).result
    .current
}

const tileTargets = new Set([
  '[data-testid="collection-owned-tile"]',
  '[data-testid="collection-unowned-tile"]',
])

describe("useCollectionTutorial", () => {
  it.each([
    [
      "a synced roster with owned and unowned units",
      { hasSummary: true, hasOwned: true, hasUnowned: true },
      ["summary", "faction-group", "owned-tile", "unowned-tile"],
    ],
    [
      "a player who owns every unit",
      { hasSummary: true, hasOwned: true, hasUnowned: false },
      ["summary", "faction-group", "owned-tile"],
    ],
    [
      "a signed-out visitor",
      { hasSummary: false, hasOwned: false, hasUnowned: true },
      ["faction-group", "unowned-tile"],
    ],
  ])(
    "with %s, every tile step says a tile opens the Library",
    (_, flags, targets) => {
      const tour = steps(flags)

      for (const form of ["desktop", "mobile"] as const) {
        const formSteps = tour[form] ?? []
        expect(formSteps.map((step) => step.target)).toEqual(
          targets.map((target) => `[data-testid="collection-${target}"]`)
        )
        const tileSteps = formSteps.filter((step) =>
          tileTargets.has(step.target as string)
        )
        expect(tileSteps.length).toBeGreaterThan(0)
        for (const step of tileSteps) {
          expect(step.content).toContain(
            "Select a unit to open its details in the Library."
          )
        }
      }
    }
  )

  it.each([
    ["en", enCommon, "Library"],
    ["de", deCommon, "Bibliothek"],
    ["es", esCommon, "Biblioteca"],
    ["fr", frCommon, "Bibliothèque"],
  ])(
    "tells the player in %s that a tile opens the Library",
    (_, common, library) => {
      const { owned, unowned } = common.tour.collection.steps
      expect(owned.content).toContain(library)
      expect(unowned.content).toContain(library)
    }
  )
})
