import {
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest"
import type { i18n as I18n } from "i18next"
import { I18nextProvider } from "react-i18next"
import type { Rarity, UnitId } from "@workspace/game-domain"
import type { PlayerDataChunkDto } from "@workspace/player-data"

import type { TourPageSteps } from "@/shared/tour"
import { createTestI18n } from "@/test/i18n"
import { fireEvent, render, screen, within } from "@/test/render"
import { setViewportWidth } from "@/test/viewport"

import {
  buildCollectionView,
  type CollectionCatalog,
  type CollectionRoster,
} from "../../model/collection-view"
import type { CollectionViewState } from "../../model/use-collection-view"

const viewState = vi.hoisted(() => ({
  current: { status: "loading" } as CollectionViewState,
}))
vi.mock("../../model/use-collection-view", () => ({
  useCollectionView: () => viewState.current,
}))

const sync = vi.hoisted(() => ({
  isSyncing: false,
  statusText: "Never synced",
  syncNow: vi.fn(),
}))
vi.mock("@/features/player-data-sync", () => ({
  usePlayerDataSyncStatus: () => sync,
}))

const msal = vi.hoisted(() => ({ loginRedirect: vi.fn() }))
vi.mock("@azure/msal-react", () => ({
  useMsal: () => ({ instance: { loginRedirect: msal.loginRedirect } }),
}))

const tour = vi.hoisted(() => ({
  steps: undefined as TourPageSteps | undefined,
}))
vi.mock("@/shared/tour", () => ({
  useTourPageSteps: (steps: TourPageSteps) => {
    tour.steps = steps
  },
}))

import { CollectionPage } from "./collection-page"

type PlayerCharacter = PlayerDataChunkDto<"characters">[number]

const catalog = {
  characters: [
    {
      id: "ultraTitus",
      faction: "Ultramarines",
      alliance: "Imperial",
      initialRarity: "Epic",
    },
    {
      id: "ultraCalgar",
      faction: "Ultramarines",
      alliance: "Imperial",
      initialRarity: "Legendary",
    },
    {
      id: "blackHaarken",
      faction: "BlackLegion",
      alliance: "Chaos",
      initialRarity: "Epic",
    },
  ],
  mows: [
    { id: "ultraDreadnought", faction: "Ultramarines", alliance: "Imperial" },
  ],
  unlockShardCosts: [
    { rarity: "Epic" as Rarity, shards: 250 },
    { rarity: "Legendary" as Rarity, shards: 400 },
  ],
  equipmentRarity: new Map(),
} as unknown as CollectionCatalog

const names: Record<string, string> = {
  ultraTitus: "Titus",
  ultraCalgar: "Marneus Calgar",
  blackHaarken: "Haarken",
  ultraDreadnought: "Galatian",
}

const titus = {
  unitId: "ultraTitus" as UnitId,
  progressionIndex: "Legendary:RedFourStars",
  rank: "Gold1",
  xp: 0,
  xpLevel: 45,
  shards: 120,
  mythicShards: 4,
  abilities: [
    { abilityId: "a", level: 40 },
    { abilityId: "p", level: 38 },
  ],
  appliedUpgradeSlots: [],
  equippedItems: [],
} as unknown as PlayerCharacter

function ready(roster: CollectionRoster) {
  viewState.current = {
    status: "ready",
    retry: vi.fn(),
    view: buildCollectionView(catalog, roster, {
      unitName: (_kind, id) => names[id] ?? id,
      factionName: (id) =>
        ({ Ultramarines: "Ultramarines", BlackLegion: "Black Legion" })[id] ??
        id,
      locale: "en",
    }),
  }
}

const synced: CollectionRoster = {
  state: "signedIn",
  characters: [titus],
  mows: [],
  shards: [{ unitId: "ultraCalgar" as UnitId, amount: 75, mythicAmount: 0 }],
}

let i18n: I18n
beforeAll(async () => {
  i18n = await createTestI18n("en")
})
beforeEach(() => {
  tour.steps = undefined
  sync.isSyncing = false
  sync.syncNow.mockReset()
  msal.loginRedirect.mockReset().mockResolvedValue(undefined)
})
afterEach(() => {
  vi.unstubAllGlobals()
})

function renderPage(width: number) {
  setViewportWidth(width)
  return render(
    <I18nextProvider i18n={i18n}>
      <CollectionPage />
    </I18nextProvider>
  )
}

function expectTourTargetsExist(form: "desktop" | "mobile") {
  const steps = tour.steps?.[form] ?? []
  expect(steps.length).toBeGreaterThan(0)
  for (const step of steps) {
    expect(
      document.querySelector(step.target as string),
      String(step.target)
    ).not.toBeNull()
  }
}

describe.each([
  ["desktop", 1280],
  ["mobile", 420],
] as const)("CollectionPage on %s", (form, width) => {
  it("shows owned and greyed-out unowned units grouped by faction, with the summary", () => {
    ready(synced)
    renderPage(width)

    expect(screen.getByTestId("collection-summary")).toHaveTextContent(
      "1 of 4 units owned"
    )
    const groups = screen.getAllByTestId("collection-faction-group")
    expect(groups.map((group) => group.dataset.faction)).toEqual([
      "Ultramarines",
      "BlackLegion",
    ])
    const ultramarines = within(groups[0]!)
    expect(
      ultramarines.getByRole("heading", { name: "Ultramarines" })
    ).toBeVisible()
    expect(
      ultramarines
        .getAllByRole("group")
        .map((tile) => [tile.getAttribute("aria-label"), tile.dataset.state])
    ).toEqual([
      ["Titus", "owned"],
      ["Galatian", "unowned"],
      ["Marneus Calgar", "unowned"],
    ])
    expect(
      ultramarines.getByRole("group", { name: "Marneus Calgar" })
    ).toHaveTextContent("75/400")
    expect(
      screen.queryByTestId("collection-sync-prompt")
    ).not.toBeInTheDocument()
  })

  it("points every tour step at an element on the page", () => {
    ready(synced)
    renderPage(width)

    expectTourTargetsExist(form)
    expect(tour.steps?.[form].map((step) => step.target)).toEqual([
      '[data-testid="collection-summary"]',
      '[data-testid="collection-faction-group"]',
      '[data-testid="collection-owned-tile"]',
      '[data-testid="collection-unowned-tile"]',
    ])
  })

  it("greys out every unit and asks an anonymous visitor to sign in", () => {
    ready({ state: "anonymous" })
    renderPage(width)

    expect(screen.getByTestId("collection-sign-in-prompt")).toHaveTextContent(
      "Sign in to see your collection"
    )
    expect(screen.queryByTestId("collection-summary")).not.toBeInTheDocument()
    const tiles = screen.getAllByRole("group")
    expect(tiles).toHaveLength(4)
    expect(tiles.every((tile) => tile.dataset.state === "unowned")).toBe(true)
    expect(screen.queryByTestId("unit-tile-shards")).not.toBeInTheDocument()

    fireEvent.click(screen.getByTestId("collection-sign-in"))
    expect(msal.loginRedirect).toHaveBeenCalledTimes(1)

    // Without a roster the summary and owned-tile steps are left out.
    expectTourTargetsExist(form)
    expect(tour.steps?.[form].map((step) => step.target)).toEqual([
      '[data-testid="collection-faction-group"]',
      '[data-testid="collection-unowned-tile"]',
    ])
  })
})

describe("CollectionPage states", () => {
  it("offers the Sync with Tacticus action to a signed-in user who has not synced", () => {
    ready({
      state: "signedIn",
      characters: undefined,
      mows: undefined,
      shards: undefined,
    })
    renderPage(1280)

    const prompt = screen.getByTestId("collection-sync-prompt")
    expect(prompt).toHaveTextContent("Sync to see your collection")
    expect(prompt).toHaveTextContent("Never synced")
    fireEvent.click(
      within(prompt).getByRole("button", { name: "Sync with Tacticus" })
    )
    expect(sync.syncNow).toHaveBeenCalledTimes(1)
    expect(
      screen
        .getAllByRole("group")
        .every((tile) => tile.dataset.state === "unowned")
    ).toBe(true)
  })

  it("disables the sync action while a sync is running", () => {
    sync.isSyncing = true
    ready({
      state: "signedIn",
      characters: undefined,
      mows: undefined,
      shards: undefined,
    })
    renderPage(1280)

    expect(screen.getByTestId("collection-sync")).toBeDisabled()
  })

  it("shows a loading state with no tiles or prompts", () => {
    viewState.current = { status: "loading" }
    renderPage(1280)

    expect(screen.getByTestId("collection-loading")).toHaveTextContent(
      "Loading your collection"
    )
    expect(screen.queryByRole("group")).not.toBeInTheDocument()
    expect(
      screen.queryByTestId("collection-sign-in-prompt")
    ).not.toBeInTheDocument()
  })

  it("shows a retryable error when the catalog fails, never an empty list", () => {
    const retry = vi.fn()
    viewState.current = { status: "catalogError", retry }
    renderPage(1280)

    expect(screen.getByTestId("collection-catalog-error")).toHaveTextContent(
      "The unit catalog couldn't be loaded"
    )
    expect(screen.queryByTestId("collection-page")).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole("button", { name: "Try again" }))
    expect(retry).toHaveBeenCalledTimes(1)
  })

  it("keeps the greyed catalog with a retryable error when the roster fails", () => {
    ready({ state: "error" })
    renderPage(1280)

    const alert = screen.getByTestId("collection-roster-error")
    expect(alert).toHaveTextContent("Your roster couldn't be loaded")
    expect(
      screen.queryByTestId("collection-sync-prompt")
    ).not.toBeInTheDocument()
    expect(screen.getAllByRole("group")).toHaveLength(4)
    fireEvent.click(within(alert).getByRole("button", { name: "Try again" }))
    expect(
      viewState.current.status === "ready" && viewState.current.retry
    ).toHaveBeenCalledTimes(1)
  })
})
