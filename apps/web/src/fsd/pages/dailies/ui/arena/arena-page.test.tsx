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
const regenerate = vi.fn()
const retry = vi.fn()

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
  initReactI18next: { type: "3rdParty", init: vi.fn() },
}))
vi.mock("@/shared/tour", () => ({ useTourPageSteps: vi.fn() }))
vi.mock("@workspace/ui/hooks/use-mobile", () => ({
  useIsMobile: () => isMobileValue,
}))
vi.mock("@workspace/game-catalog", () => ({
  characterIcon: (id: string) => `/icons/${id}.png`,
}))
vi.mock("../../model/use-arena-recommendations", () => ({
  useArenaRecommendations: () => view,
}))

const member = (unitId: string) => ({
  unitId: unitIdSchema.parse(unitId),
  rationale: { kind: "random" as const },
})

const readyRecommendations: ArenaRecommendations = {
  categories: [
    {
      id: "active-project",
      poolUsed: "active-project",
      broadened: false,
      includedCappedCharacters: false,
      variants: [
        {
          size: 3,
          isPrimary: true,
          members: [member("a"), member("b"), member("c")],
        },
        {
          size: 4,
          isPrimary: false,
          members: [member("a"), member("b"), member("c"), member("d")],
        },
      ],
    },
    {
      id: "overall-goals",
      poolUsed: "overall-goals",
      broadened: false,
      includedCappedCharacters: false,
      emptyReason: "no-active-goals",
      variants: [],
    },
    {
      id: "random",
      poolUsed: "full-roster",
      broadened: false,
      includedCappedCharacters: false,
      variants: [
        {
          size: 5,
          isPrimary: true,
          members: ["a", "b", "c", "d", "e"].map(member),
        },
      ],
    },
  ],
}

const readyView = (): ArenaRecommendationsViewModel => ({
  status: "ready",
  mode: "xp",
  setMode,
  regenerate,
  recommendations: readyRecommendations,
})

beforeEach(() => {
  vi.clearAllMocks()
  isMobileValue = false
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

  it("renders every category, the empty state, and the primary team", () => {
    render(<ArenaPage />)
    expect(
      screen.getByTestId("arena-category-active-project")
    ).toBeInTheDocument()
    expect(
      screen.getByTestId("arena-category-overall-goals")
    ).toBeInTheDocument()
    expect(screen.getByTestId("arena-category-random")).toBeInTheDocument()
    expect(screen.getByTestId("arena-empty-overall-goals")).toBeInTheDocument()
    expect(
      within(screen.getByTestId("arena-team-active-project")).getAllByRole(
        "listitem"
      )
    ).toHaveLength(3)
  })

  it("switches mode through the toggle", async () => {
    render(<ArenaPage />)
    await userEvent.click(screen.getByRole("tab", { name: "mode.power" }))
    expect(setMode).toHaveBeenCalledWith("power")
  })

  it("regenerates only from the random category", async () => {
    render(<ArenaPage />)
    const randomSection = screen.getByTestId("arena-category-random")
    await userEvent.click(
      within(randomSection).getByTestId("arena-random-regenerate")
    )
    expect(regenerate).toHaveBeenCalledOnce()
    expect(
      within(screen.getByTestId("arena-category-active-project")).queryByTestId(
        "arena-random-regenerate"
      )
    ).not.toBeInTheDocument()
  })

  it("renders the same categories and team members on desktop and mobile", () => {
    const { unmount } = render(<ArenaPage />)
    const desktopNames = within(screen.getByTestId("arena-desktop"))
      .getAllByRole("listitem")
      .map((item) => item.textContent)
    expect(screen.getByTestId("arena-variant-switcher")).toBeInTheDocument()
    unmount()

    isMobileValue = true
    render(<ArenaPage />)
    const mobileNames = within(screen.getByTestId("arena-mobile"))
      .getAllByRole("listitem")
      .map((item) => item.textContent)
    expect(screen.getByTestId("arena-variant-switcher")).toBeInTheDocument()
    expect(mobileNames).toEqual(desktopNames)
  })

  it("exposes every Joyride tour target in the ready state", () => {
    render(<ArenaPage />)
    for (const testId of [
      "arena-page",
      "arena-mode-toggle",
      "arena-category-active-project",
      "arena-variant-switcher",
      "arena-random-regenerate",
    ]) {
      expect(screen.getByTestId(testId)).toBeInTheDocument()
    }
  })
})
