import { Suspense } from "react"
import { createMemoryRouter, RouterProvider } from "react-router"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { render, screen } from "@/test/render"

import { routes } from "../route"
import { DailiesLayout } from "./dailies-layout"

const useDailyRaids = vi.fn<(projectId?: string) => { status: "no-farmable" }>(
  () => ({
    status: "no-farmable",
  })
)

const useShopRecommendations = vi.fn<
  (projectId: string | undefined) => { status: "ready"; sections: never[] }
>(() => ({ status: "ready", sections: [] }))

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
  initReactI18next: { type: "3rdParty", init: vi.fn() },
}))
const save = vi.fn()
vi.mock("@/entities/planning-setting", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/entities/planning-setting")>()
  return {
    ...actual,
    dailyEnergyTiers: [288, 378, 438, 538, 638, 738, 838, 938],
    usePlanningSettings: () => ({
      settings: { dailyEnergy: 288, revision: 1 },
      save,
    }),
  }
})
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
          isDefault: false,
        },
        {
          projectId: "p2",
          name: "Other project",
          color: null,
          status: "Active",
          isDefault: true,
        },
      ],
      defaultProjectId: "p2",
      fetchState: { status: "success" },
      loading: false,
    }),
  }
})
vi.mock("@/features/daily-raids", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/features/daily-raids")>()
  return {
    ...actual,
    useDailyRaids: (projectId?: string) => useDailyRaids(projectId),
  }
})
vi.mock("../model/use-shop-recommendations", () => ({
  useShopRecommendations: (projectId: string | undefined) =>
    useShopRecommendations(projectId),
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
  beforeEach(() => {
    useDailyRaids.mockClear()
    save.mockClear()
  })

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
  }, 10_000)

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

  it("starts with no project selected, so Shops covers every Active goal", async () => {
    renderDailies("/dailies/shops")

    expect(await findRouteContent("shops-page")).toBeInTheDocument()
    expect(useShopRecommendations).toHaveBeenCalledWith(undefined)
    expect(useShopRecommendations).not.toHaveBeenCalledWith("p1")
    expect(useShopRecommendations).not.toHaveBeenCalledWith("p2")
  })

  it("routes /dailies/arena to the Arena recommendations page, not the placeholder", async () => {
    renderDailies("/dailies/arena")

    expect(await findRouteContent("arena-page")).toBeInTheDocument()
    expect(
      screen.queryByTestId("dailies-placeholder-page")
    ).not.toBeInTheDocument()
  })

  it("plans the whole account on Today and Plan, with the project selector defaulting to all goals", async () => {
    const user = userEvent.setup()
    renderDailies("/dailies/raids/today")
    await findRouteContent("dailies-no-farmable")
    expect(screen.getByTestId("raids-project-select")).toBeInTheDocument()
    expect(useDailyRaids).toHaveBeenLastCalledWith(undefined)

    await user.click(screen.getByRole("tab", { name: "raids.tabs.plan" }))
    await findRouteContent("dailies-no-farmable")
    expect(screen.getByTestId("raids-project-select")).toBeInTheDocument()
    expect(useDailyRaids).toHaveBeenLastCalledWith(undefined)
  })

  it("narrows Today to the picked project and keeps it on Plan", async () => {
    const user = userEvent.setup()
    renderDailies("/dailies/raids/today")
    await findRouteContent("dailies-no-farmable")

    await user.click(screen.getByTestId("raids-project-select"))
    await user.click(
      await screen.findByRole("option", { name: /Active project/ })
    )
    expect(useDailyRaids).toHaveBeenLastCalledWith("p1")

    await user.click(screen.getByRole("tab", { name: "raids.tabs.plan" }))
    await findRouteContent("dailies-no-farmable")
    expect(useDailyRaids).toHaveBeenLastCalledWith("p1")
  })

  it("exposes the shared Planning Settings action trailing the project selector on Today and Plan", async () => {
    const user = userEvent.setup()
    renderDailies("/dailies/raids/today")
    await findRouteContent("dailies-no-farmable")

    const settingsButton = screen.getByTestId("raids-planning-settings")
    expect(settingsButton).toHaveAccessibleName("goals.planningSettings.button")
    expect(screen.getByTestId("raids-project-select")).toBeInTheDocument()

    await user.click(screen.getByRole("tab", { name: "raids.tabs.plan" }))
    await findRouteContent("dailies-no-farmable")
    expect(screen.getByTestId("raids-planning-settings")).toHaveAccessibleName(
      "goals.planningSettings.button"
    )
  })

  it("opens the shared Planning Settings dialog from Raids", async () => {
    const user = userEvent.setup()
    renderDailies("/dailies/raids/today")
    await findRouteContent("dailies-no-farmable")

    await user.click(screen.getByTestId("raids-planning-settings"))
    const dialog = await screen.findByTestId("planning-settings-dialog")
    expect(dialog).toBeInTheDocument()
    // The dialog's own save/persist behavior against the shared `usePlanningSettings` hook is
    // covered by planning-settings-dialog.test.tsx; this test only verifies Raids reaches the one
    // shared dialog, not the dialog's internals again.
    expect(
      screen.getByTestId("planning-settings-energy-value")
    ).toHaveTextContent("288")
  })

  it("opens the Planning Settings dialog via keyboard activation", async () => {
    const user = userEvent.setup()
    renderDailies("/dailies/raids/today")
    await findRouteContent("dailies-no-farmable")

    const settingsButton = screen.getByTestId("raids-planning-settings")
    settingsButton.focus()
    expect(settingsButton).toHaveFocus()

    await user.keyboard("{Enter}")
    expect(
      await screen.findByTestId("planning-settings-dialog")
    ).toBeInTheDocument()
  })
})
