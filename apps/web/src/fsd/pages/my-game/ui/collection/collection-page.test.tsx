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
import { MemoryRouter, Route, Routes, useLocation } from "react-router"
import type { Rarity, UnitId } from "@workspace/game-domain"
import type { PlayerDataChunkDto } from "@workspace/player-data"

import { readUnitOrigin } from "@/entities/unit"
import type { TourPageSteps } from "@/shared/tour"
import { createTestI18n } from "@/test/i18n"
import { fireEvent, render, screen, waitFor, within } from "@/test/render"
import { setViewportWidth } from "@/test/viewport"

import type { CollectionQuery } from "../../model/collection-query"
import {
  buildCollectionView,
  type CollectionCatalog,
  type CollectionRoster,
} from "../../model/collection-view"
import type {
  CollectionViewState,
  QuickFilterAvailability,
} from "../../model/use-collection-view"

// `build` lists the page's own query, so toolbar changes reach the rendered list.
const viewState = vi.hoisted(() => ({
  current: { status: "loading" } as CollectionViewState,
  build: undefined as
    ((query: CollectionQuery) => CollectionViewState) | undefined,
}))
vi.mock("../../model/use-collection-view", () => ({
  useCollectionView: (query: CollectionQuery) =>
    viewState.build?.(query) ?? viewState.current,
}))

vi.mock("../../model/use-collection-factions", () => ({
  useCollectionFactions: () => [
    { id: "Ultramarines", name: "Ultramarines", alliance: "Imperial" },
    { id: "BlackLegion", name: "Black Legion", alliance: "Chaos" },
  ],
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

const labels = {
  unitName: (_kind: string, id: string) => names[id] ?? id,
  factionName: (id: string) =>
    ({ Ultramarines: "Ultramarines", BlackLegion: "Black Legion" })[id] ?? id,
  locale: "en",
}

type QuickFilters = Extract<
  CollectionViewState,
  { status: "ready" }
>["quickFilters"]

function quickFilters(
  availability: QuickFilterAvailability,
  overrides: Partial<QuickFilters> = {}
): QuickFilters {
  return {
    readyToRankUp: availability,
    needToAscend: availability,
    canAscend: availability,
    needToLevel: availability,
    blueStarReady: availability,
    ...overrides,
  }
}

function ready(
  roster: CollectionRoster,
  quick: QuickFilters = quickFilters(
    roster.state === "signedIn" && roster.characters && roster.mows
      ? "available"
      : "needsRoster"
  )
) {
  const state = {
    status: "ready" as const,
    retry: vi.fn(),
    quickFilters: quick,
    view: buildCollectionView(catalog, roster, labels),
  }
  viewState.current = state
  viewState.build = (query) => ({
    ...state,
    view: buildCollectionView(catalog, roster, labels, query),
  })
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
  viewState.build = undefined
  localStorage.clear()
  tour.steps = undefined
  sync.isSyncing = false
  sync.syncNow.mockReset()
  msal.loginRedirect.mockReset().mockResolvedValue(undefined)
})
afterEach(() => {
  vi.unstubAllGlobals()
})

function UnitPageProbe() {
  const location = useLocation()
  return (
    <p data-testid="unit-page">
      {location.pathname}|{JSON.stringify(readUnitOrigin(location.state))}
    </p>
  )
}

function renderPage(width: number, entry = "/my-game/collection") {
  setViewportWidth(width)
  return render(
    <I18nextProvider i18n={i18n}>
      <MemoryRouter initialEntries={[entry]}>
        <Routes>
          <Route path="/my-game/collection" element={<CollectionPage />} />
          <Route path="/library/*" element={<UnitPageProbe />} />
        </Routes>
      </MemoryRouter>
    </I18nextProvider>
  )
}

function openedUnit() {
  const [path, origin] = screen.getByTestId("unit-page").textContent!.split("|")
  return { path, origin: JSON.parse(origin!) as unknown }
}

function expectTourTargetsExist(form: "desktop" | "mobile") {
  const steps = tour.steps?.[form] ?? []
  expect(steps.length).toBeGreaterThan(0)
  for (const step of steps) {
    expect(
      document.querySelector(step.target as string),
      step.target as string
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
      within(groups[0]!).getByTestId("collection-faction-owned")
    ).toHaveTextContent("1/3")
    expect(
      ultramarines
        .getAllByRole("link")
        .map((tile) => [tile.getAttribute("title"), tile.dataset.state])
    ).toEqual([
      ["Titus", "owned"],
      // Nearest to unlock first: Calgar has a target, the Machine of War has none.
      ["Marneus Calgar", "unowned"],
      ["Galatian", "unowned"],
    ])
    expect(
      ultramarines.getByRole("link", { name: /^Marneus Calgar,/ })
    ).toHaveTextContent("75/400")
    expect(
      screen.queryByTestId("collection-sync-prompt")
    ).not.toBeInTheDocument()
  })

  it("points every tour step at an element on the page", () => {
    ready(synced)
    renderPage(width)

    expectTourTargetsExist(form)
    expect(tour.steps?.[form]?.map((step) => step.target)).toEqual([
      '[data-testid="collection-toolbar"]',
      '[data-testid="collection-quick-filters"]',
      '[data-testid="collection-summary"]',
      '[data-testid="collection-faction-group"]',
      '[data-testid="collection-owned-tile"]',
      '[data-testid="collection-unowned-tile"]',
    ])
  })

  it("leaves out the unowned tour step when the player owns every unit", () => {
    ready({
      ...synced,
      characters: ["ultraTitus", "ultraCalgar", "blackHaarken"].map(
        (unitId) => ({ ...titus, unitId: unitId as UnitId })
      ),
      mows: [
        {
          unitId: "ultraDreadnought",
          progressionIndex: "Epic:RedTwoStars",
          shards: 0,
          mythicShards: 0,
          abilities: [],
        } as unknown as PlayerDataChunkDto<"mows">[number],
      ],
    })
    renderPage(width)

    expect(screen.queryByTestId("collection-unowned-tile")).toBeNull()
    expectTourTargetsExist(form)
    expect(tour.steps?.[form]?.map((step) => step.target)).toEqual([
      '[data-testid="collection-toolbar"]',
      '[data-testid="collection-quick-filters"]',
      '[data-testid="collection-summary"]',
      '[data-testid="collection-faction-group"]',
      '[data-testid="collection-owned-tile"]',
    ])
  })

  it("greys out every unit and asks an anonymous visitor to sign in", () => {
    ready({ state: "anonymous" })
    renderPage(width)

    expect(screen.getByTestId("collection-sign-in-prompt")).toHaveTextContent(
      "Sign in to see your collection"
    )
    expect(screen.queryByTestId("collection-summary")).not.toBeInTheDocument()
    const tiles = screen.getAllByRole("link")
    expect(tiles).toHaveLength(4)
    expect(tiles.every((tile) => tile.dataset.state === "unowned")).toBe(true)
    expect(screen.queryByTestId("unit-tile-shards")).not.toBeInTheDocument()
    expect(
      screen.queryByTestId("collection-faction-owned")
    ).not.toBeInTheDocument()

    fireEvent.click(screen.getByTestId("collection-sign-in"))
    expect(msal.loginRedirect).toHaveBeenCalledTimes(1)

    // Without a roster the summary and owned-tile steps are left out.
    expectTourTargetsExist(form)
    expect(tour.steps?.[form]?.map((step) => step.target)).toEqual([
      '[data-testid="collection-toolbar"]',
      '[data-testid="collection-quick-filters"]',
      '[data-testid="collection-faction-group"]',
      '[data-testid="collection-unowned-tile"]',
    ])
  })
})

describe("CollectionPage tile links", () => {
  it("links each tile to its unit's Library page", () => {
    ready(synced)
    renderPage(1280)

    expect(screen.getByRole("link", { name: /^Titus,/ })).toHaveAttribute(
      "href",
      "/library/characters/ultraTitus"
    )
    expect(
      screen.getByRole("link", { name: /^Marneus Calgar,/ })
    ).toHaveAttribute("href", "/library/characters/ultraCalgar")
    expect(screen.getByRole("link", { name: /^Galatian,/ })).toHaveAttribute(
      "href",
      "/library/machines-of-war/ultraDreadnought"
    )
  })

  it("opens a character with Collection's character order, without Machines of War", () => {
    ready(synced)
    renderPage(1280)

    fireEvent.click(screen.getByRole("link", { name: /^Marneus Calgar,/ }))

    expect(openedUnit()).toEqual({
      path: "/library/characters/ultraCalgar",
      origin: {
        kind: "collection",
        ids: ["ultraTitus", "ultraCalgar", "blackHaarken"],
      },
    })
  })

  it("opens a Machine of War with Collection's Machine of War order", () => {
    ready(synced)
    renderPage(1280)

    fireEvent.click(screen.getByRole("link", { name: /^Galatian,/ }))

    expect(openedUnit()).toEqual({
      path: "/library/machines-of-war/ultraDreadnought",
      origin: { kind: "collection", ids: ["ultraDreadnought"] },
    })
  })

  it.each([
    ["signed out", { state: "anonymous" } as CollectionRoster],
    [
      "not synced",
      {
        state: "signedIn",
        characters: undefined,
        mows: undefined,
        shards: undefined,
      } as CollectionRoster,
    ],
    ["roster read failure", { state: "error" } as CollectionRoster],
  ])("still links every greyed-out tile when %s", (_, roster) => {
    ready(roster)
    renderPage(1280)

    const links = screen.getAllByRole("link")
    expect(links).toHaveLength(4)
    fireEvent.click(screen.getByRole("link", { name: /^Haarken,/ }))
    expect(openedUnit().path).toBe("/library/characters/blackHaarken")
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
        .getAllByRole("link")
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
    expect(screen.queryByRole("link")).not.toBeInTheDocument()
    expect(
      screen
        .getByTestId("collection-loading")
        .querySelector("[aria-busy='true']")
    ).not.toBeNull()
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
    expect(screen.getAllByRole("link")).toHaveLength(4)
    fireEvent.click(within(alert).getByRole("button", { name: "Try again" }))
    expect(
      viewState.current.status === "ready" && viewState.current.retry
    ).toHaveBeenCalledTimes(1)
  })
})

const factionsShown = () =>
  screen
    .queryAllByTestId("collection-faction-group")
    .map((group) => group.getAttribute("data-faction"))

describe("CollectionPage toolbar on desktop", () => {
  it("keeps search, Sort and Filters on one row with the filters collapsed", () => {
    ready(synced)
    renderPage(1280)

    const toolbar = screen.getByRole("search", {
      name: "Search, sort and filter units",
    })
    expect(
      within(toolbar).getByRole("searchbox", { name: "Search units" })
    ).toBeInTheDocument()
    expect(
      within(toolbar).getByRole("combobox", { name: "Sort: Rarity" })
    ).toBeInTheDocument()
    const filters = within(toolbar).getByRole("button", { name: "Filters" })
    expect(filters).toHaveAttribute("aria-expanded", "false")
    expect(
      screen.queryByRole("group", { name: "Filters" })
    ).not.toBeInTheDocument()

    fireEvent.click(filters)

    expect(filters).toHaveAttribute("aria-expanded", "true")
    const fields = screen.getByRole("group", { name: "Filters" })
    expect(within(fields).getByText("Alliance")).toBeInTheDocument()
    expect(within(fields).getByText("Unit type")).toBeInTheDocument()
  })

  it("applies a chosen sort and remembers it for the next visit", () => {
    ready(synced)
    renderPage(1280)

    const sort = screen.getByRole("combobox", { name: "Sort: Rarity" })
    sort.focus()
    fireEvent.keyDown(sort, { key: "Enter" })
    fireEvent.click(screen.getByRole("option", { name: "Rank" }))

    expect(
      screen.getByRole("combobox", { name: "Sort: Rank" })
    ).toBeInTheDocument()
    expect(localStorage.getItem("collection.sort")).toBe("rank")
  })

  it("opens the filters when a standalone filter is already set", () => {
    ready(synced)
    renderPage(1280, "/my-game/collection?alliance=Imperial")

    expect(screen.getByRole("group", { name: "Filters" })).toBeInTheDocument()
  })

  it("reports the active filters and clears them in one action, keeping the sort", () => {
    ready(synced)
    renderPage(
      1280,
      "/my-game/collection?q=ti&alliance=Imperial&quick=needToLevel&sort=rank"
    )

    expect(
      screen.getByRole("button", { name: "Filters (3)" })
    ).toBeInTheDocument()
    expect(screen.getAllByRole("link")).toHaveLength(1)

    fireEvent.click(screen.getByRole("button", { name: "Clear filters" }))

    expect(screen.getByRole("button", { name: "Filters" })).toBeInTheDocument()
    expect(
      screen.queryByRole("button", { name: "Clear filters" })
    ).not.toBeInTheDocument()
    expect(screen.getByRole("searchbox", { name: "Search units" })).toHaveValue(
      ""
    )
    expect(
      screen.getByRole("combobox", { name: "Sort: Rank" })
    ).toBeInTheDocument()
    expect(screen.getAllByRole("link")).toHaveLength(4)
    expect(screen.getByTestId("collection-summary")).toHaveTextContent(
      "1 of 4 units owned"
    )
  })

  it("counts only matching units and hides factions without a match", () => {
    ready(synced)
    renderPage(1280, "/my-game/collection?alliance=Imperial")

    expect(screen.getByTestId("collection-summary")).toHaveTextContent(
      "1 of 3 matching units owned"
    )
    expect(factionsShown()).toEqual(["Ultramarines"])
  })

  it("narrows the list once the user pauses typing a name", async () => {
    ready(synced)
    renderPage(1280)

    const search = screen.getByRole("searchbox", { name: "Search units" })
    fireEvent.change(search, { target: { value: "HAAR" } })

    // The text shows at once; the list follows when typing pauses.
    expect(search).toHaveValue("HAAR")
    expect(screen.getAllByRole("link")).toHaveLength(4)
    await waitFor(() => expect(screen.getAllByRole("link")).toHaveLength(1))
    expect(factionsShown()).toEqual(["BlackLegion"])
    expect(search).toHaveValue("HAAR")

    // Clear filters, a change from outside the box, replaces the typed text.
    fireEvent.click(screen.getByRole("button", { name: "Clear filters" }))
    expect(search).toHaveValue("")
    expect(screen.getAllByRole("link")).toHaveLength(4)
  })

  it("shows an empty state with Clear filters instead of a blank page", () => {
    ready(synced)
    renderPage(1280, "/my-game/collection?q=zzz")

    const empty = screen.getByTestId("collection-empty")
    expect(empty).toHaveTextContent("No unit matches these filters")
    expect(screen.queryByTestId("collection-summary")).not.toBeInTheDocument()
    expect(screen.queryByRole("link")).not.toBeInTheDocument()

    fireEvent.click(
      within(empty).getByRole("button", { name: "Clear filters" })
    )

    expect(screen.getAllByRole("link")).toHaveLength(4)
  })

  it("selects one quick filter at a time and clears it when selected again", () => {
    ready(synced)
    renderPage(1280)

    const quick = screen.getByRole("radiogroup", { name: "Quick filters" })
    const needToLevel = within(quick).getByRole("radio", {
      name: "Need to level",
    })
    fireEvent.click(within(quick).getByRole("radio", { name: "Can ascend" }))
    fireEvent.click(needToLevel)

    expect(needToLevel).toHaveAttribute("aria-checked", "true")
    expect(
      within(quick).getByRole("radio", { name: "Can ascend" })
    ).toHaveAttribute("aria-checked", "false")
    expect(screen.getAllByRole("link")).toHaveLength(1)

    fireEvent.click(needToLevel)

    expect(needToLevel).toHaveAttribute("aria-checked", "false")
    expect(screen.getAllByRole("link")).toHaveLength(4)
  })

  it("disables the roster-dependent controls without a roster and says why", () => {
    ready({ state: "anonymous" })
    renderPage(1280, "/my-game/collection?quick=canAscend&alliance=Imperial")

    const quick = screen.getByRole("radiogroup", { name: "Quick filters" })
    for (const chip of within(quick).getAllByRole("radio")) {
      expect(chip).toBeDisabled()
      expect(chip).toHaveAccessibleDescription(
        "Quick filters need a synced roster."
      )
    }
    // The alliance applies; the quick filter from the link does not.
    expect(factionsShown()).toEqual(["Ultramarines"])
    expect(screen.getAllByRole("link")).toHaveLength(3)
    expect(
      within(quick).getByRole("radio", { name: "Can ascend" })
    ).toHaveAttribute("aria-checked", "false")
    expect(
      screen.getByRole("button", { name: "Filters (1)" })
    ).toBeInTheDocument()

    const fields = screen.getByRole("group", { name: "Filters" })
    expect(
      within(fields).getByRole("group", { name: "Rank range" })
    ).toHaveAccessibleDescription(
      "Rank and ownership filters need a synced roster."
    )
    expect(
      within(fields).getByRole("combobox", { name: "Lowest rank" })
    ).toBeDisabled()
    expect(within(fields).getByLabelText("Ownership")).toBeDisabled()
  })

  it("explains a quick filter that needs the synced inventory", () => {
    ready(
      synced,
      quickFilters("available", {
        readyToRankUp: "needsInventory",
        blueStarReady: "failed",
      })
    )
    renderPage(1280)

    const quick = screen.getByRole("radiogroup", { name: "Quick filters" })
    expect(
      within(quick).getByRole("radio", { name: "Ready to rank up" })
    ).toHaveAccessibleDescription(
      "Ready to rank up: needs your synced inventory."
    )
    expect(
      within(quick).getByRole("radio", { name: "Blue star ready" })
    ).toHaveAccessibleDescription(
      "Blue star ready: its game data couldn't be loaded."
    )
    expect(
      within(quick).getByRole("radio", { name: "Can ascend" })
    ).toBeEnabled()

    fireEvent.click(screen.getByRole("button", { name: "Try again" }))
    expect(
      viewState.current.status === "ready" && viewState.current.retry
    ).toHaveBeenCalledOnce()
  })

  it("keeps a chip disabled while its data is still loading", () => {
    ready(synced, quickFilters("available", { canAscend: "loading" }))
    renderPage(1280)

    const quick = screen.getByRole("radiogroup", { name: "Quick filters" })
    expect(
      within(quick).getByRole("radio", { name: "Can ascend" })
    ).toBeDisabled()
    expect(
      within(quick).getByRole("radio", { name: "Need to level" })
    ).toBeEnabled()
    expect(
      screen.queryByRole("button", { name: "Try again" })
    ).not.toBeInTheDocument()
  })

  it("shows no toolbar while loading or after a catalog failure", () => {
    viewState.current = { status: "loading" }
    const { unmount } = renderPage(1280)
    expect(screen.queryByRole("search")).not.toBeInTheDocument()
    unmount()

    viewState.current = { status: "catalogError", retry: vi.fn() }
    renderPage(1280)
    expect(screen.queryByRole("search")).not.toBeInTheDocument()
  })
})

describe("CollectionPage toolbar on mobile", () => {
  it("stacks the toolbar and opens the filters in a sheet", () => {
    ready(synced)
    renderPage(420)

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole("button", { name: "Filters" }))

    const sheet = screen.getByRole("dialog", { name: "Filters" })
    expect(within(sheet).getByText("Alliance")).toBeInTheDocument()

    fireEvent.click(within(sheet).getByRole("button", { name: "Done" }))

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
  })

  it("narrows the list by a rarity set in the sheet", () => {
    ready(synced)
    renderPage(420)

    fireEvent.click(screen.getByRole("button", { name: "Filters" }))
    const sheet = screen.getByRole("dialog", { name: "Filters" })
    fireEvent.click(within(sheet).getByRole("combobox", { name: "Rarity" }))
    fireEvent.click(screen.getByRole("option", { name: /Legendary/ }))
    fireEvent.click(within(sheet).getByRole("button", { name: "Done" }))

    // Titus is owned at Legendary; Calgar is unowned but starts Legendary.
    expect(screen.getAllByRole("link")).toHaveLength(2)
    expect(
      screen.getByRole("button", { name: "Filters (1)" })
    ).toBeInTheDocument()
  })
})
