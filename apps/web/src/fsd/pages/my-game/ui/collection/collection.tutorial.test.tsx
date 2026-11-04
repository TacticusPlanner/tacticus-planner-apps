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
  view?: "cards" | "roster"
  hasSummary: boolean
  hasGroups?: boolean
  hasOwned: boolean
  hasUnowned: boolean
}) {
  const wrapper = ({ children }: { children: ReactNode }) => (
    <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
  )
  return renderHook(
    () => useCollectionTutorial({ hasGroups: true, ...flags }),
    { wrapper }
  ).result.current
}

const toolbar = ["toolbar", "view-switch", "quick-filters"]

const tileTargets = new Set([
  '[data-testid="collection-owned-tile"]',
  '[data-testid="collection-unowned-tile"]',
])

describe("useCollectionTutorial", () => {
  it.each([
    [
      "a synced roster with owned and unowned units",
      { hasSummary: true, hasOwned: true, hasUnowned: true },
      [...toolbar, "summary", "faction-group", "owned-tile", "unowned-tile"],
    ],
    [
      "a player who owns every unit",
      { hasSummary: true, hasOwned: true, hasUnowned: false },
      [...toolbar, "summary", "faction-group", "owned-tile"],
    ],
    [
      "a signed-out visitor",
      { hasSummary: false, hasOwned: false, hasUnowned: true },
      [...toolbar, "faction-group", "unowned-tile"],
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

  it("points the faction and unit steps at the Roster view's sections and rows", () => {
    const tour = steps({
      view: "roster",
      hasSummary: true,
      hasOwned: true,
      hasUnowned: true,
    })

    for (const form of ["desktop", "mobile"] as const) {
      expect((tour[form] ?? []).map((step) => step.target)).toEqual(
        [
          ...toolbar,
          "summary",
          "roster-section",
          "owned-row",
          "unowned-row",
        ].map((target) => `[data-testid="collection-${target}"]`)
      )
    }
    const unitSteps = (form: "desktop" | "mobile") =>
      (tour[form] ?? []).filter((step) =>
        (step.target as string).endsWith('-row"]')
      )
    for (const step of unitSteps("desktop")) {
      expect(step.content).toContain(
        "Select a row to open its details in the Library."
      )
    }
    for (const step of unitSteps("mobile")) {
      expect(step.content).toMatch(
        /^.*Tap a row .* in the Library from there\.$/
      )
    }
    expect(
      (tour.desktop ?? []).find((step) =>
        (step.target as string).includes("roster-section")
      )?.content
    ).toContain("Each section")
  })

  it("leaves out the faction step while units are not grouped by faction", () => {
    for (const view of ["cards", "roster"] as const) {
      const wrapper = ({ children }: { children: ReactNode }) => (
        <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
      )
      const tour = renderHook(
        () =>
          useCollectionTutorial({
            view,
            grouped: false,
            hasSummary: true,
            hasGroups: true,
            hasOwned: true,
            hasUnowned: true,
          }),
        { wrapper }
      ).result.current
      const unit = view === "roster" ? "row" : "tile"
      for (const form of ["desktop", "mobile"] as const) {
        expect((tour[form] ?? []).map((step) => step.target)).toEqual(
          [...toolbar, "summary", `owned-${unit}`, `unowned-${unit}`].map(
            (target) => `[data-testid="collection-${target}"]`
          )
        )
      }
    }
  })

  it("leaves out the unowned step while unowned units are hidden", () => {
    const tour = steps({
      view: "roster",
      hasSummary: true,
      hasOwned: true,
      hasUnowned: false,
    })
    expect(
      (tour.mobile ?? []).map((step) => step.target as string)
    ).not.toContain('[data-testid="collection-unowned-row"]')
  })

  it("covers only the toolbar and quick filters when the filters match nothing", () => {
    const tour = steps({
      hasSummary: false,
      hasGroups: false,
      hasOwned: true,
      hasUnowned: true,
    })

    for (const form of ["desktop", "mobile"] as const) {
      expect((tour[form] ?? []).map((step) => step.target)).toEqual(
        toolbar.map((target) => `[data-testid="collection-${target}"]`)
      )
    }
  })

  it.each([
    ["en", enCommon],
    ["de", deCommon],
    ["es", esCommon],
    ["fr", frCommon],
  ])(
    "has translated toolbar, view and quick-filter steps in %s",
    (lang, common) => {
      const steps = common.tour.collection.steps
      const keys = [
        "toolbar",
        "view",
        "quickFilters",
        "factionRoster",
        "ownedRoster",
        "ownedRosterMobile",
        "unownedRoster",
        "unownedRosterMobile",
      ] as const
      for (const key of keys) {
        expect(steps[key].title.length).toBeGreaterThan(0)
        expect(steps[key].content.length).toBeGreaterThan(0)
        if (lang !== "en") {
          expect(steps[key].content).not.toBe(
            enCommon.tour.collection.steps[key].content
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
      const steps = common.tour.collection.steps
      for (const step of [
        steps.owned,
        steps.unowned,
        steps.ownedRoster,
        steps.ownedRosterMobile,
        steps.unownedRoster,
        steps.unownedRosterMobile,
      ]) {
        expect(step.content).toContain(library)
      }
    }
  )
})
