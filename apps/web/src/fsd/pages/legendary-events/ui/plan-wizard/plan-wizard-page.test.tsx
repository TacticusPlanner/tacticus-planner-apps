import type { i18n as I18n } from "i18next"
import { createMemoryRouter, RouterProvider } from "react-router"
import { beforeAll, describe, expect, it, vi } from "vitest"

import { utharEvent } from "@/test/fixtures/legendary-events"
import { createTestI18n, i18nWrapper } from "@/test/i18n"
import { render, screen } from "@/test/render"

import { PlanWizardPage } from "./plan-wizard-page"
import type { PlanSource } from "./use-plan-source"

let source: PlanSource = { status: "loading" }
vi.mock("./use-plan-source", () => ({ usePlanSource: () => source }))
vi.mock("@/shared/unit-name", () => ({
  useUnitName: () => () => "Uthar",
}))

let i18n: I18n
beforeAll(async () => {
  i18n = await createTestI18n("en")
})

function renderPage() {
  const router = createMemoryRouter(
    [{ path: "/legendary-events/:eventId/plan", element: <PlanWizardPage /> }],
    { initialEntries: [`/legendary-events/${utharEvent.id}/plan`] }
  )
  render(<RouterProvider router={router} />, { wrapper: i18nWrapper(i18n) })
}

describe("PlanWizardPage", () => {
  it("says the event unit has no step left to reach, with a link back", () => {
    source = {
      status: "nothingToReach",
      event: utharEvent,
      reason: "fullyAscended",
    }
    renderPage()
    expect(
      screen.getByTestId("plan-wizard-nothing-to-reach")
    ).toHaveTextContent("Uthar has no step left to reach in this event.")
    expect(
      screen.getByRole("link", { name: "Back to the event" })
    ).toHaveAttribute("href", `/legendary-events/${utharEvent.id}`)
    expect(screen.queryByTestId("plan-wizard-stepper")).not.toBeInTheDocument()
  })

  it("names the missing dataset when clear estimates are unavailable", () => {
    source = {
      status: "noEstimates",
      event: utharEvent,
      missing: ["unitPower"],
    }
    renderPage()
    expect(screen.getByTestId("plan-wizard-no-estimates")).toHaveTextContent(
      "The 1-click plan needs clear estimates. Missing: unit power."
    )
  })
})
