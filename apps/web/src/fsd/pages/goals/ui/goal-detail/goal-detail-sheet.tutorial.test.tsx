import { renderHook } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import de from "../../../../../../public/locales/de/common.json"
import en from "../../../../../../public/locales/en/common.json"
import es from "../../../../../../public/locales/es/common.json"
import fr from "../../../../../../public/locales/fr/common.json"
import { useGoalDetailSheetTutorial } from "./goal-detail-sheet.tutorial"

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => `localized:${key}` }),
}))

describe("useGoalDetailSheetTutorial", () => {
  it("targets the Edit target action with localized copy at both breakpoints", () => {
    const { result } = renderHook(() => useGoalDetailSheetTutorial())

    expect(result.current.desktop).toEqual(result.current.mobile)
    const [step] = result.current.desktop
    expect(step.target).toBe('[data-testid="goal-detail-edit-target"]')
    expect(step.title).toBe("localized:tour.goalDetail.steps.editTarget.title")
    expect(step.content).toBe(
      "localized:tour.goalDetail.steps.editTarget.content"
    )
  })
})

describe("target editor and tour copy", () => {
  it.each([
    ["de", de],
    ["es", es],
    ["fr", fr],
  ])("%s has every English key, translated rather than copied", (_, locale) => {
    expect(Object.keys(locale.goals.target).sort()).toEqual(
      Object.keys(en.goals.target).sort()
    )
    expect(Object.keys(locale.goals.target.issues).sort()).toEqual(
      Object.keys(en.goals.target.issues).sort()
    )
    expect(locale.goals.target.save).not.toBe(en.goals.target.save)
    expect(locale.tour.goalDetail.steps.editTarget.content).not.toBe(
      en.tour.goalDetail.steps.editTarget.content
    )
    expect(locale.tour.overview.steps.list.content).not.toBe(
      en.tour.overview.steps.list.content
    )
  })

  it("mentions in-place target editing in the Goals list step", () => {
    expect(en.tour.overview.steps.list.content).toMatch(/target/i)
    expect(en.tour.goalDetail.steps.editTarget.title).toBeTruthy()
  })
})
