import { beforeEach, describe, expect, it, vi } from "vitest"
import userEvent from "@testing-library/user-event"

import { unitIdSchema } from "@workspace/game-domain"

import { render, screen, within } from "@/test/render"

import type {
  OnslaughtRecommendations,
  OnslaughtRecommendationsViewModel,
} from "../../model/onslaught-recommendations.types"
import type { OnslaughtShardRecipientResult } from "../../model/onslaught-shard-recipient"
import { OnslaughtPage } from "./onslaught-page"

let view: OnslaughtRecommendationsViewModel
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
  mowIcon: (id: string) => `/mows/${id}.png`,
  rankIcon: (rank: string) => `/ranks/${rank}.png`,
  rarityIcon: (rarity: string) => `/rarities/${rarity}.png`,
  traitIcon: (trait: string) => `/traits/${trait}.png`,
  damageTypeIcon: (type: string) => `/damage/${type}.png`,
  onslaughtAllianceIcon: (alliance: string) => `/alliance/${alliance}.png`,
}))
vi.mock("../../model/use-onslaught-recommendations", () => ({
  useOnslaughtRecommendations: () => view,
}))

const member = (unitId: string, over: Record<string, unknown> = {}) => ({
  unitId: unitIdSchema.parse(unitId),
  rank: "Stone1" as const,
  rarity: "Common" as const,
  locked: false,
  rationale: { kind: "random" as const },
  ...over,
})

const readyRecommendations: OnslaughtRecommendations = {
  categories: [
    {
      id: "plan",
      poolUsed: "onslaught-ascension",
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

const noneRecipient: OnslaughtShardRecipientResult = { status: "none" }
const readyRecipient: OnslaughtShardRecipientResult = {
  status: "ready",
  recipient: {
    unitId: "raxRax",
    unitName: "Rax",
    unitKind: "mow",
    goalId: "g1",
    currentRarity: "Rare",
    targetRarity: "Epic",
    currentShards: 5,
    requiredShards: 45,
    remainingShards: 40,
    reason: "inSelectedProject",
    projectId: "p1",
  },
  alternates: [],
}

const readyView = (
  shardRecipient: OnslaughtShardRecipientResult = noneRecipient
): OnslaughtRecommendationsViewModel => ({
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
  shardRecipient,
})

beforeEach(() => {
  vi.clearAllMocks()
  isMobileValue = false
  outletContext.projectId = "p1"
  view = readyView()
})

describe("OnslaughtPage", () => {
  it("shows the loading state", () => {
    view = { status: "loading" }
    render(<OnslaughtPage />)
    expect(screen.getByTestId("onslaught-loading")).toBeInTheDocument()
  })

  it("shows a retryable error state", async () => {
    view = { status: "error", retry }
    render(<OnslaughtPage />)
    await userEvent.click(screen.getByRole("button", { name: "state.retry" }))
    expect(retry).toHaveBeenCalledOnce()
  })

  it("renders the track selector, both categories, the controls, and the shard recipient panel", () => {
    render(<OnslaughtPage />)
    expect(screen.getByTestId("onslaught-track-selector")).toBeInTheDocument()
    expect(screen.getByTestId("onslaught-category-plan")).toBeInTheDocument()
    expect(screen.getByTestId("onslaught-category-random")).toBeInTheDocument()
    expect(screen.getByTestId("onslaught-mode-toggle")).toBeInTheDocument()
    expect(screen.getByTestId("onslaught-team-size")).toBeInTheDocument()
    expect(screen.getByTestId("onslaught-preferences")).toBeInTheDocument()
    expect(screen.getByTestId("onslaught-shard-recipient")).toBeInTheDocument()
    expect(
      within(screen.getByTestId("onslaught-team-plan")).getAllByRole("listitem")
    ).toHaveLength(3)
  })

  it("shows the 'no shard target' copy when there is no recipient", () => {
    view = readyView(noneRecipient)
    render(<OnslaughtPage />)
    expect(
      within(screen.getByTestId("onslaught-shard-recipient")).getByText(
        "recipient.none"
      )
    ).toBeInTheDocument()
  })

  it("shows the recommended recipient with its unit kind, shards, and reason", () => {
    view = readyView(readyRecipient)
    render(<OnslaughtPage />)
    const panel = within(screen.getByTestId("onslaught-shard-recipient"))
    expect(panel.getByText("Rax")).toBeInTheDocument()
    expect(panel.getByText("recipient.unitKind.mow")).toBeInTheDocument()
    expect(panel.getByText("40")).toBeInTheDocument()
    expect(
      panel.getByText("recipient.reason.inSelectedProject")
    ).toBeInTheDocument()
  })

  it("switches the track through the selector", async () => {
    render(<OnslaughtPage />)
    await userEvent.click(screen.getByTestId("onslaught-track-chaos"))
    expect(setTrack).toHaveBeenCalledWith("Chaos")
  })

  it("switches mode through the toggle", async () => {
    render(<OnslaughtPage />)
    await userEvent.click(screen.getByRole("tab", { name: "mode.power" }))
    expect(setMode).toHaveBeenCalledWith("power")
  })

  it("shows the shortfall and the shard recipient but no category sections when a track is short", () => {
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
      shardRecipient: readyRecipient,
    }
    render(<OnslaughtPage />)
    expect(
      screen.getByTestId("onslaught-insufficient-track")
    ).toBeInTheDocument()
    expect(screen.getByTestId("onslaught-shard-recipient")).toBeInTheDocument()
    expect(
      screen.queryByTestId("onslaught-category-plan")
    ).not.toBeInTheDocument()
    expect(
      screen.queryByTestId("onslaught-category-random")
    ).not.toBeInTheDocument()
  })

  it("regenerates only from the random category", async () => {
    render(<OnslaughtPage />)
    await userEvent.click(
      within(screen.getByTestId("onslaught-category-random")).getByTestId(
        "onslaught-random-regenerate"
      )
    )
    expect(regenerate).toHaveBeenCalledOnce()
  })

  it("renders the same categories and members on desktop and mobile", () => {
    const { unmount } = render(<OnslaughtPage />)
    const desktopNames = within(screen.getByTestId("onslaught-desktop"))
      .getAllByRole("listitem")
      .map((item) => item.textContent)
    unmount()

    isMobileValue = true
    render(<OnslaughtPage />)
    const mobileNames = within(screen.getByTestId("onslaught-mobile"))
      .getAllByRole("listitem")
      .map((item) => item.textContent)
    expect(screen.getByTestId("onslaught-shard-recipient")).toBeInTheDocument()
    expect(mobileNames).toEqual(desktopNames)
  })

  it("exposes every Joyride tour target in the ready state", () => {
    render(<OnslaughtPage />)
    for (const testId of [
      "onslaught-page",
      "onslaught-track-selector",
      "onslaught-mode-toggle",
      "onslaught-project-select",
      "onslaught-team-size",
      "onslaught-preferences",
      "onslaught-category-plan",
      "onslaught-shard-recipient",
      "onslaught-category-random",
      "onslaught-random-regenerate",
    ]) {
      expect(screen.getByTestId(testId)).toBeInTheDocument()
    }
  })
})
