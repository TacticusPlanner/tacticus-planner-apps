import { Suspense } from "react"
import { createMemoryRouter, RouterProvider } from "react-router"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { render, screen } from "@/test/render"

import { routes } from "../route"
import { DailiesLayout } from "./dailies-layout"

const useDailyRaids = vi.fn<(projectId?: string) => { status: "no-farmable" }>(
  () => ({ status: "no-farmable" })
)

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
  initReactI18next: { type: "3rdParty", init: vi.fn() },
}))
vi.mock("@/entities/project", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/entities/project")>()
  return {
    ...actual,
    useProjects: () => ({
      projects: [
        {
          projectId: "p1",
          name: "Active project",
          color: null,
          status: "Active",
          isActivePlan: true,
          isDefault: false,
        },
        {
          projectId: "p2",
          name: "Other project",
          color: null,
          status: "Active",
          isActivePlan: false,
          isDefault: true,
        },
      ],
      activeProjectId: "p1",
      defaultProjectId: "p2",
      fetchState: { status: "success" },
      loading: false,
    }),
  }
})
vi.mock("../model/use-daily-raids", () => ({
  useDailyRaids: (projectId: string | undefined) => useDailyRaids(projectId),
}))
vi.mock("../model/use-shop-recommendations", () => ({
  useShopRecommendations: () => ({ status: "ready", sections: [] }),
}))
vi.mock("@/shared/tour", () => ({ useTourPageSteps: vi.fn() }))

function renderDailies(path = "/dailies") {
  const router = createMemoryRouter(
    [{ path: "/dailies", element: <DailiesLayout />, children: routes }],
    { initialEntries: [path] }
  )
  return render(
    <Suspense fallback={<div>loading</div>}>
      <RouterProvider router={router} />
    </Suspense>
  )
}

describe("Dailies navigation", () => {
  beforeEach(() => useDailyRaids.mockClear())

  it("redirects /dailies to Raids Today", async () => {
    renderDailies()

    expect(await screen.findByTestId("dailies-no-farmable")).toBeInTheDocument()
    expect(
      screen.getByRole("tab", { name: "raids.tabs.today" })
    ).toHaveAttribute("data-state", "active")
  })

  // Primary tab navigation itself (Raids/Shops/Onslaught/Salvage Run/Arena/Guild Raids) now lives
  // in the shared app-shell header's section-tabs row, not in DailiesLayout - see
  // section-tabs.test.tsx. This only confirms each still-under-construction route renders its
  // placeholder page.
  it.each([
    "/dailies/onslaught",
    "/dailies/salvage-run",
    "/dailies/arena",
    "/dailies/guild-raids",
  ])("routes %s to its own placeholder page", async (path) => {
    renderDailies(path)

    expect(
      await screen.findByTestId("dailies-placeholder-page")
    ).toBeInTheDocument()
  })

  it("routes /dailies/shops to the Shops recommendations page", async () => {
    renderDailies("/dailies/shops")

    expect(await screen.findByTestId("shops-page")).toBeInTheDocument()
  })

  it("keeps the selected project when switching from Today to Plan", async () => {
    const user = userEvent.setup()
    renderDailies("/dailies/raids/today")
    expect(
      await screen.findByTestId("dailies-project-select")
    ).toBeInTheDocument()

    await user.click(screen.getByTestId("dailies-project-select"))
    await user.click(
      await screen.findByRole("option", { name: /Other project/ })
    )
    await user.click(screen.getByRole("tab", { name: "raids.tabs.plan" }))
    await screen.findByTestId("dailies-no-farmable")
    expect(useDailyRaids).toHaveBeenLastCalledWith("p2")
  })
})
