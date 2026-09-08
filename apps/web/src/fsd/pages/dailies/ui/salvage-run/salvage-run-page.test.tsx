import { beforeEach, describe, expect, it, vi } from "vitest"
import userEvent from "@testing-library/user-event"

import { unitIdSchema } from "@workspace/game-domain"

import { render, screen, within } from "@/test/render"

import type {
  SalvageRecommendations,
  SalvageRecommendationsViewModel,
} from "../../model/salvage-recommendations.types"
import { SalvageRunPage } from "./salvage-run-page"

let view: SalvageRecommendationsViewModel
let isMobileValue = false
const setTrack = vi.fn()
const setMode = vi.fn()
const setTeamSize = vi.fn()
const setPreferences = vi.fn()
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
  traitIcon: (trait: string) => `/traits/${trait}.png`,
  damageTypeIcon: (type: string) => `/damage/${type}.png`,
  onslaughtAllianceIcon: (alliance: string) => `/alliance/${alliance}.png`,
}))
vi.mock("../../model/use-salvage-recommendations", () => ({
  useSalvageRecommendations: () => view,
}))

const member = (unitId: string, over: Record<string, unknown> = {}) => ({
  unitId: unitIdSchema.parse(unitId),
  rank: "Stone1" as const,
  rarity: "Common" as const,
  locked: false,
  rationale: { kind: "random" as const },
  ...over,
})

const readyRecommendations: SalvageRecommendations = {
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

const readyView = (): SalvageRecommendationsViewModel => ({
  status: "ready",
  track: "Imperial",
  setTrack,
  mode: "xp",
  setMode,
  teamSize: 3,
  setTeamSize,
  availableSizes: [3, 4, 5],
  preferences: {},
  setPreferences,
  availableTraits: ["Flying"],
  availableDamageTypes: ["Bolter"],
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

describe("SalvageRunPage", () => {
  it("shows the loading state", () => {
    view = { status: "loading" }
    render(<SalvageRunPage />)
    expect(screen.getByTestId("salvage-loading")).toBeInTheDocument()
  })

  it("shows a retryable error state", async () => {
    view = { status: "error", retry }
    render(<SalvageRunPage />)
    await userEvent.click(screen.getByRole("button", { name: "state.retry" }))
    expect(retry).toHaveBeenCalledOnce()
  })

  it("renders the track selector, the Plan and Random categories, and the controls", () => {
    render(<SalvageRunPage />)
    expect(screen.getByTestId("salvage-track-selector")).toBeInTheDocument()
    expect(screen.getByTestId("salvage-category-plan")).toBeInTheDocument()
    expect(screen.getByTestId("salvage-category-random")).toBeInTheDocument()
    expect(screen.getByTestId("salvage-mode-toggle")).toBeInTheDocument()
    expect(screen.getByTestId("salvage-team-size")).toBeInTheDocument()
    expect(screen.getByTestId("salvage-preferences")).toBeInTheDocument()
    expect(
      within(screen.getByTestId("salvage-team-plan")).getAllByRole("listitem")
    ).toHaveLength(3)
  })

  it("switches the track through the selector", async () => {
    render(<SalvageRunPage />)
    await userEvent.click(screen.getByTestId("salvage-track-chaos"))
    expect(setTrack).toHaveBeenCalledWith("Chaos")
  })

  it("switches mode through the toggle", async () => {
    render(<SalvageRunPage />)
    await userEvent.click(screen.getByRole("tab", { name: "mode.power" }))
    expect(setMode).toHaveBeenCalledWith("power")
  })

  it("shows the per-track shortfall with the eligible characters and no category sections", () => {
    view = {
      status: "insufficient-track",
      track: "Chaos",
      setTrack,
      ownedCount: 2,
      needed: 1,
      eligible: [
        { unitId: unitIdSchema.parse("x"), rank: "Stone1", rarity: "Common" },
        { unitId: unitIdSchema.parse("y"), rank: "Iron1", rarity: "Uncommon" },
      ],
    }
    render(<SalvageRunPage />)
    expect(screen.getByTestId("salvage-track-selector")).toBeInTheDocument()
    expect(screen.getByTestId("salvage-insufficient-track")).toBeInTheDocument()
    expect(
      within(screen.getByTestId("salvage-eligible-list")).getAllByRole(
        "listitem"
      )
    ).toHaveLength(2)
    expect(
      screen.queryByTestId("salvage-category-plan")
    ).not.toBeInTheDocument()
    expect(
      screen.queryByTestId("salvage-category-random")
    ).not.toBeInTheDocument()
  })

  it("regenerates only from the random category", async () => {
    render(<SalvageRunPage />)
    await userEvent.click(
      within(screen.getByTestId("salvage-category-random")).getByTestId(
        "salvage-random-regenerate"
      )
    )
    expect(regenerate).toHaveBeenCalledOnce()
  })

  it("toggles a lock from the random team only", async () => {
    render(<SalvageRunPage />)
    expect(
      within(screen.getByTestId("salvage-team-plan")).queryByTestId(
        "salvage-lock-a"
      )
    ).not.toBeInTheDocument()
    await userEvent.click(
      within(screen.getByTestId("salvage-team-random")).getByTestId(
        "salvage-lock-a"
      )
    )
    expect(toggleRandomLock).toHaveBeenCalledWith(unitIdSchema.parse("a"))
  })

  it("renders the same categories, members, and controls on desktop and mobile", () => {
    const { unmount } = render(<SalvageRunPage />)
    const desktopNames = within(screen.getByTestId("salvage-desktop"))
      .getAllByRole("listitem")
      .map((item) => item.textContent)
    unmount()

    isMobileValue = true
    render(<SalvageRunPage />)
    const mobileNames = within(screen.getByTestId("salvage-mobile"))
      .getAllByRole("listitem")
      .map((item) => item.textContent)
    expect(screen.getByTestId("salvage-track-selector")).toBeInTheDocument()
    expect(mobileNames).toEqual(desktopNames)
  })

  it("exposes every Joyride tour target in the ready state", () => {
    render(<SalvageRunPage />)
    for (const testId of [
      "salvage-run-page",
      "salvage-track-selector",
      "salvage-mode-toggle",
      "salvage-project-select",
      "salvage-team-size",
      "salvage-preferences",
      "salvage-category-plan",
      "salvage-category-random",
      "salvage-random-regenerate",
    ]) {
      expect(screen.getByTestId(testId)).toBeInTheDocument()
    }
  })
})
