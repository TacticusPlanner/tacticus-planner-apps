import { beforeEach, describe, expect, it, vi } from "vitest"
import userEvent from "@testing-library/user-event"

import { unitIdSchema } from "@workspace/game-domain"

import { render, screen, within } from "@/test/render"

import type {
  ArenaRecommendations,
  ArenaRecommendationsViewModel,
} from "../../model/arena-recommendations.types"
import { ArenaPage } from "./arena-page"

let view: ArenaRecommendationsViewModel
let isMobileValue = false
const setMode = vi.fn()
const setTeamSize = vi.fn()
const toggleRandomLock = vi.fn()
const regenerate = vi.fn()
const retry = vi.fn()
const setProjectId = vi.fn()

const outletContext = {
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
  projectId: "p1" as string | undefined,
  setProjectId,
  projectsUnavailable: false,
  projectsError: false,
  retryProjects: vi.fn(),
}

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
  initReactI18next: { type: "3rdParty", init: vi.fn() },
}))
vi.mock("react-router", async (importOriginal) => ({
  ...(await importOriginal<typeof import("react-router")>()),
  useOutletContext: () => outletContext,
}))
vi.mock("@/shared/tour", () => ({ useTourPageSteps: vi.fn() }))
vi.mock("@workspace/ui/hooks/use-mobile", () => ({
  useIsMobile: () => isMobileValue,
}))
vi.mock("@workspace/game-catalog", () => ({
  characterIcon: (id: string) => `/icons/${id}.png`,
  rankIcon: (rank: string) => `/ranks/${rank}.png`,
  rarityIcon: (rarity: string) => `/rarities/${rarity}.png`,
}))
vi.mock("../../model/use-arena-recommendations", () => ({
  useArenaRecommendations: () => view,
}))

const member = (unitId: string, over: Record<string, unknown> = {}) => ({
  unitId: unitIdSchema.parse(unitId),
  rank: "Stone1" as const,
  rarity: "Common" as const,
  locked: false,
  rationale: { kind: "random" as const },
  ...over,
})

const readyRecommendations: ArenaRecommendations = {
  categories: [
    {
      id: "plan",
      poolUsed: "active-project",
      broadened: false,
      includedCappedCharacters: false,
      requestedSize: 3,
      deliveredSize: 3,
      members: [member("a"), member("b"), member("c")],
    },
    {
      id: "random",
      poolUsed: "full-roster",
      broadened: false,
      includedCappedCharacters: false,
      requestedSize: 5,
      deliveredSize: 5,
      members: ["a", "b", "c", "d", "e"].map((unit) => member(unit)),
    },
  ],
}

const readyView = (): ArenaRecommendationsViewModel => ({
  status: "ready",
  mode: "xp",
  setMode,
  teamSize: 3,
  setTeamSize,
  availableSizes: [3, 4, 5],
  toggleRandomLock,
  lockedRandomUnitIds: [],
  regenerate,
  recommendations: readyRecommendations,
})

beforeEach(() => {
  vi.clearAllMocks()
  isMobileValue = false
  outletContext.projectId = "p1"
  view = readyView()
})

describe("ArenaPage", () => {
  it("shows the loading state", () => {
    view = { status: "loading" }
    render(<ArenaPage />)
    expect(screen.getByTestId("arena-loading")).toBeInTheDocument()
  })

  it("shows a retryable error state", async () => {
    view = { status: "error", retry }
    render(<ArenaPage />)
    await userEvent.click(screen.getByRole("button", { name: "state.retry" }))
    expect(retry).toHaveBeenCalledOnce()
  })

  it("shows the not-enough-characters state", () => {
    view = { status: "no-characters" }
    render(<ArenaPage />)
    expect(screen.getByTestId("arena-no-characters")).toBeInTheDocument()
  })

  it("renders the Plan and Random categories with the team", () => {
    render(<ArenaPage />)
    expect(screen.getByTestId("arena-category-plan")).toBeInTheDocument()
    expect(screen.getByTestId("arena-category-random")).toBeInTheDocument()
    expect(
      screen.queryByTestId("arena-category-overall-goals")
    ).not.toBeInTheDocument()
    expect(
      within(screen.getByTestId("arena-team-plan")).getAllByRole("listitem")
    ).toHaveLength(3)
  })

  it("switches mode through the toggle", async () => {
    render(<ArenaPage />)
    await userEvent.click(screen.getByRole("tab", { name: "mode.power" }))
    expect(setMode).toHaveBeenCalledWith("power")
  })

  it("reports a team-size change from the radio group", async () => {
    render(<ArenaPage />)
    await userEvent.click(screen.getByTestId("arena-team-size-5"))
    expect(setTeamSize).toHaveBeenCalledWith(5)
  })

  it("regenerates only from the random category", async () => {
    render(<ArenaPage />)
    await userEvent.click(
      within(screen.getByTestId("arena-category-random")).getByTestId(
        "arena-random-regenerate"
      )
    )
    expect(regenerate).toHaveBeenCalledOnce()
    expect(
      within(screen.getByTestId("arena-category-plan")).queryByTestId(
        "arena-random-regenerate"
      )
    ).not.toBeInTheDocument()
  })

  it("toggles a lock from the random team only", async () => {
    render(<ArenaPage />)
    // The lock control exists for the random team, not the plan team.
    expect(
      within(screen.getByTestId("arena-team-plan")).queryByTestId(
        "arena-lock-a"
      )
    ).not.toBeInTheDocument()
    await userEvent.click(
      within(screen.getByTestId("arena-team-random")).getByTestId(
        "arena-lock-a"
      )
    )
    expect(toggleRandomLock).toHaveBeenCalledWith(unitIdSchema.parse("a"))
  })

  it("changes the driving project through the selector", async () => {
    render(<ArenaPage />)
    await userEvent.click(screen.getByTestId("arena-project-select"))
    await userEvent.click(
      await screen.findByRole("option", { name: /Other project/ })
    )
    expect(setProjectId).toHaveBeenCalledWith("p2")
  })

  it("renders the same categories, team members, and controls on desktop and mobile", () => {
    const { unmount } = render(<ArenaPage />)
    const desktopNames = within(screen.getByTestId("arena-desktop"))
      .getAllByRole("listitem")
      .map((item) => item.textContent)
    expect(screen.getByTestId("arena-team-size")).toBeInTheDocument()
    unmount()

    isMobileValue = true
    render(<ArenaPage />)
    const mobileNames = within(screen.getByTestId("arena-mobile"))
      .getAllByRole("listitem")
      .map((item) => item.textContent)
    expect(screen.getByTestId("arena-team-size")).toBeInTheDocument()
    expect(mobileNames).toEqual(desktopNames)
  })

  it("exposes every Joyride tour target in the ready state", () => {
    render(<ArenaPage />)
    for (const testId of [
      "arena-page",
      "arena-mode-toggle",
      "arena-project-select",
      "arena-team-size",
      "arena-category-plan",
      "arena-category-random",
      "arena-random-regenerate",
    ]) {
      expect(screen.getByTestId(testId)).toBeInTheDocument()
    }
  })
})
