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

  it("redirects to Raids Today and routes every primary tab to its own placeholder", async () => {
    const user = userEvent.setup()
    renderDailies()

    expect(await screen.findByTestId("dailies-no-farmable")).toBeInTheDocument()
    expect(
      screen.getByRole("tab", { name: "raids.tabs.today" })
    ).toHaveAttribute("data-state", "active")
    for (const tab of [
      "tabs.shops",
      "tabs.onslaught",
      "tabs.salvage-run",
      "tabs.arena",
      "tabs.guild-raids",
    ]) {
      await user.click(screen.getByRole("tab", { name: tab }))
      expect(
        await screen.findByTestId("dailies-placeholder-page")
      ).toBeInTheDocument()
    }
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
