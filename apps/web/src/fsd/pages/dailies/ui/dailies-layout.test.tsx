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
vi.mock("../model/use-arena-recommendations", () => ({
  useArenaRecommendations: () => ({ status: "no-characters" }),
}))
vi.mock("../model/use-salvage-recommendations", () => ({
  useSalvageRecommendations: () => ({ status: "loading" }),
}))
vi.mock("../model/use-onslaught-recommendations", () => ({
  useOnslaughtRecommendations: () => ({ status: "loading" }),
}))
vi.mock("@/shared/tour", () => ({ useTourPageSteps: vi.fn() }))
vi.mock("@/features/guild-access", () => ({
  GuildAccessBoundary: () => <div data-testid="guild-unregistered" />,
}))

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

function findRouteContent(testId: string) {
  return screen.findByTestId(testId, {}, { timeout: 5_000 })
}

describe("Dailies navigation", () => {
  beforeEach(() => useDailyRaids.mockClear())

  it("redirects /dailies to Raids Today", async () => {
    renderDailies()

    expect(await findRouteContent("dailies-no-farmable")).toBeInTheDocument()
    expect(
      screen.getByRole("tab", { name: "raids.tabs.today" })
    ).toHaveAttribute("data-state", "active")
  })

  it("routes Guild Raids to its access-aware page", async () => {
    renderDailies("/dailies/guild-raids")

    expect(
      await findRouteContent("guild-raids-desktop-shell")
    ).toBeInTheDocument()
    expect(screen.getByTestId("guild-unregistered")).toBeInTheDocument()
    expect(
      screen.queryByTestId("dailies-placeholder-page")
    ).not.toBeInTheDocument()
  })

  it("routes /dailies/salvage-run to the Salvage Run recommendations page", async () => {
    renderDailies("/dailies/salvage-run")

    expect(await findRouteContent("salvage-run-page")).toBeInTheDocument()
    expect(
      screen.queryByTestId("dailies-placeholder-page")
    ).not.toBeInTheDocument()
  })

  it("routes /dailies/onslaught to the Onslaught recommendations page", async () => {
    renderDailies("/dailies/onslaught")

    expect(await findRouteContent("onslaught-page")).toBeInTheDocument()
    expect(
      screen.queryByTestId("dailies-placeholder-page")
    ).not.toBeInTheDocument()
  })

  it("routes /dailies/shops to the Shops recommendations page", async () => {
    renderDailies("/dailies/shops")

    expect(await findRouteContent("shops-page")).toBeInTheDocument()
  })

  it("routes /dailies/arena to the Arena recommendations page, not the placeholder", async () => {
    renderDailies("/dailies/arena")

    expect(await findRouteContent("arena-page")).toBeInTheDocument()
    expect(
      screen.queryByTestId("dailies-placeholder-page")
    ).not.toBeInTheDocument()
  })

  it("keeps the selected project when switching from Today to Plan", async () => {
    const user = userEvent.setup()
    renderDailies("/dailies/raids/today")
    expect(await findRouteContent("dailies-project-select")).toBeInTheDocument()

    await user.click(screen.getByTestId("dailies-project-select"))
    await user.click(
      await screen.findByRole("option", { name: /Other project/ })
    )
    await user.click(screen.getByRole("tab", { name: "raids.tabs.plan" }))
    await findRouteContent("dailies-no-farmable")
    expect(useDailyRaids).toHaveBeenLastCalledWith("p2")
  })
})
