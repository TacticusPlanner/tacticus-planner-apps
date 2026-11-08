import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import userEvent from "@testing-library/user-event"
import { useLocation } from "react-router"

import { incursionsFixture } from "@workspace/game-catalog/testing"

import { holdNamespaceLoads, requestedNamespaces } from "@/test/i18n-instance"
import { act, render, screen, waitFor, within } from "@/test/render"
import { seedGameCatalog } from "@/test/seed"

import type { NpcRecord, NpcStatRow } from "@/entities/npc"
import type { ReadState } from "@/shared/lib"
import { refreshLocalDataAfterSync } from "@/shared/local-data"
import {
  buildUnitPowerContext,
  npcPowerAt,
  type UnitPowerContext,
} from "@/shared/unit-power"
import { unitPowerCatalog } from "@/test/fixtures/unit-power"

function at<T>(xs: readonly T[] | undefined, index: number): T {
  const value = xs?.[index]
  if (value === undefined) throw new Error(`expected an item at index ${index}`)
  return value
}

const { isMobileMock, useIsMobileMock } = vi.hoisted(() => {
  const isMobileMock = { value: false }
  const useIsMobileMock = vi.fn(() => isMobileMock.value)
  return { isMobileMock, useIsMobileMock }
})

vi.mock("@workspace/ui/hooks/use-mobile", () => ({
  useIsMobile: useIsMobileMock,
}))
vi.mock("@/shared/tour", () => ({ useTourPageSteps: () => {} }))

const powerMock = vi.hoisted(() => ({
  state: { status: "loading" },
}))
vi.mock("@/shared/unit-power", async (importOriginal) => ({
  ...(await importOriginal<object>()),
  useUnitPowerContext: () => powerMock.state,
}))

import { NpcsPage } from "./npcs-page"

function Location() {
  const location = useLocation()
  return (
    <output data-testid="location">{`${location.pathname}${location.search}`}</output>
  )
}

// The catalog rows `renderPage` seeds; `null` leaves the dataset unsynced.
let seededNpcs: unknown[] | null = null

async function renderPage(entry: string) {
  if (seededNpcs) {
    await seedGameCatalog({ npcs: seededNpcs })
  }
  return render(
    <>
      <NpcsPage />
      <Location />
    </>,
    { route: "/library/npcs/:entityId?", initialEntries: [entry] }
  )
}

afterEach(() => {
  vi.restoreAllMocks()
})

// Page-local builders (the entity keeps its own fixtures behind its public API).
const statRow = (rank: number, stars: number, health = 100): NpcStatRow => ({
  abilityLevel: 1,
  damage: 10,
  armour: 5,
  health,
  progressionIndex: 0,
  rank,
  stars,
})
const zeroRow = { ...statRow(0, 0, 0), damage: 0, armour: 0 }
const npcRecord = (
  id: string,
  name: string,
  overrides: Partial<NpcRecord> = {}
): NpcRecord => ({
  id,
  name,
  factionId: "Necrons",
  alliance: "Xenos",
  kind: "unit",
  meleeDamage: "Physical",
  meleeHits: 1,
  rangedDamage: null,
  rangedHits: null,
  distance: null,
  movement: 3,
  traits: [],
  activeAbilityDamage: [],
  activeAbilities: [],
  passiveAbilityDamage: [],
  passiveAbilities: [],
  stats: [statRow(0, 0)],
  ...overrides,
})
const warden = (id: string, stats: NpcStatRow[]) =>
  npcRecord(id, "Makhotep", {
    rangedDamage: "Gauss",
    rangedHits: 2,
    distance: 3,
    traits: ["LivingMetal", "Mechanical"],
    activeAbilities: ["AdaptiveStrategy"],
    passiveAbilities: ["RelentlessMarch"],
    stats,
  })
const makhotepRecords: NpcRecord[] = [
  warden("necroNpcWarden", [
    statRow(1, 1, 117),
    statRow(2, 1, 130),
    statRow(19, 12, 9000),
  ]),
  // Served out of progression order on purpose (rank 2 before rank 1).
  warden("necroBossWarden", [
    statRow(2, 2, 160),
    statRow(1, 2, 140),
    statRow(9, 6, 1028),
  ]),
  warden("necroBossWardenLHE", [statRow(3, 2, 200), statRow(18, 13, 8000)]),
  warden("necroBossWardenLEG", [statRow(11, 10, 2014), statRow(14, 11, 4000)]),
  warden("necroBossC1Warden", [statRow(2, 2, 160), statRow(9, 6, 1028)]),
]

const imospekh = npcRecord("necroNpcDestroyer", "Imospekh", {
  traits: ["LivingMetal"],
  stats: [statRow(0, 0, 90), statRow(3, 2, 300)],
})
const termagant = npcRecord("tyranNpc3Termagant", "Termagant", {
  factionId: "Tyranids",
  rangedDamage: "Piercing",
  rangedHits: 1,
  distance: 2,
  traits: ["Swarm"],
  stats: [statRow(0, 0, 20)],
})
const crawler = npcRecord("deathNpcMoWCrawler", "Plagueburst Crawler", {
  kind: "machineOfWar",
  factionId: "DeathGuard",
  traits: ["MachineOfWar"],
  stats: [zeroRow],
})
const ammoBox = npcRecord("LootObj_AmmoBox", "Ammo Box", {
  kind: "object",
  factionId: "Objects",
  stats: [zeroRow],
})
const havoc = npcRecord("blackNpc4HavocSurv", "Havoc", {
  factionId: "BlackLegion",
  stats: [
    statRow(20, 14, 34_594),
    statRow(20, 14, 172_970),
    statRow(20, 14, 1_729_700),
  ],
})

const dataset = [
  ...makhotepRecords,
  imospekh,
  termagant,
  crawler,
  ammoBox,
  havoc,
]

const location = () => screen.getByTestId("location").textContent

// The catalog's Dark Angels Infiltrator (the spec's worked example) and a unit with no attacks.
const infiltratorNpc = unitPowerCatalog.npcs.find(
  (npc) => npc.id === "darkaNpc1Infiltrator"
)!
const infiltrator = npcRecord("darkaNpc1Infiltrator", "Infiltrator", {
  factionId: "DarkAngels",
  alliance: "Imperial",
  meleeDamage: infiltratorNpc.meleeDamage,
  meleeHits: infiltratorNpc.meleeHits,
  rangedDamage: infiltratorNpc.rangedDamage,
  rangedHits: infiltratorNpc.rangedHits,
  distance: infiltratorNpc.distance,
  traits: [...infiltratorNpc.traits],
  stats: infiltratorNpc.stats,
})
const watcher = npcRecord("tyranNpcWatcher", "Watcher", {
  factionId: "Tyranids",
  meleeDamage: "",
  meleeHits: 0,
  traits: ["Swarm"],
  activeAbilities: ["WatcherGaze"],
  stats: [{ ...statRow(1, 1, 50), abilityLevel: 3, progressionIndex: 1 }],
})
const powerContext = buildUnitPowerContext({
  ...unitPowerCatalog,
  npcs: [
    ...unitPowerCatalog.npcs,
    watcher as unknown as (typeof unitPowerCatalog.npcs)[number],
  ],
})!
const powerReady = {
  status: "ready",
  data: powerContext,
  retry: () => {},
} satisfies ReadState<UnitPowerContext | null>
const powerCard = () => screen.getByTestId("npc-stat-power")
const powerValue = () => screen.getByTestId("npc-stat-power-value")

/** Filters are collapsed behind a toggle on both platforms; open them before driving a control. */
const openFilters = (user: ReturnType<typeof userEvent.setup>) =>
  user.click(screen.getByTestId("npcs-filters-toggle"))

/** `toLocaleString` grouping differs per machine locale; match digits regardless of separators. */
const numberText = (value: number) =>
  new RegExp(
    String(value).replace(/\B(?=(\d{3})+(?!\d))/g, "[\\s,.\\u00a0\\u202f]?")
  )

describe("NpcsPage", () => {
  beforeEach(() => {
    isMobileMock.value = false
    seededNpcs = dataset
    powerMock.state = powerReady
  })

  it("shows the loading state and does not redirect while the dataset loads", async () => {
    await renderPage("/library/npcs")

    expect(screen.getByText("Loading Library records…")).toBeVisible()
    expect(location()).toBe("/library/npcs")
  })

  it("keeps a direct link while the first catalog sync is still running", async () => {
    // Cold catalog: the table is empty and no npcs metadata exists yet.
    seededNpcs = null
    await renderPage("/library/npcs/makhotep")

    expect(await screen.findByText("Loading Library records…")).toBeVisible()
    await new Promise((resolve) => setTimeout(resolve, 50))
    expect(location()).toBe("/library/npcs/makhotep")
    expect(
      screen.queryByText("No selectable entities are available.")
    ).toBeNull()
  })

  it("shows the no-records state only once the dataset has synced empty", async () => {
    seededNpcs = []
    await renderPage("/library/npcs")

    expect(
      await screen.findByText("No selectable entities are available.")
    ).toBeVisible()
    expect(location()).toBe("/library/npcs")
  })

  it("shows a retry-able failure state when the dataset read throws", async () => {
    vi.spyOn(IDBObjectStore.prototype, "getAll").mockImplementation(() => {
      throw new Error("boom")
    })
    await renderPage("/library/npcs")

    expect(await screen.findByTestId("npcs-load-failed")).toBeVisible()
    expect(location()).toBe("/library/npcs")
  })

  it("redirects the collection URL to the first listed NPC", async () => {
    await renderPage("/library/npcs")

    // The catalog store returns rows by id, so `blackNpc4HavocSurv` lists first.
    await waitFor(() => expect(location()).toBe("/library/npcs/havoc"))
    expect(screen.getByTestId("npc-name")).toHaveTextContent("Havoc")
  })

  it("replaces an unknown group id with the first listed NPC", async () => {
    await renderPage("/library/npcs/not-a-real-npc?variation=x")

    await waitFor(() =>
      expect(location()).toBe("/library/npcs/havoc?variation=x")
    )
  })

  it("excludes Machines of War and loot objects from the list", async () => {
    await renderPage("/library/npcs/makhotep")

    const list = await screen.findByTestId("npcs-list")
    const names = within(list)
      .getAllByRole("button")
      .map((tile) => tile.textContent)
    // Store order (by id) and localized names from the `npcs` namespace.
    expect(names).toEqual([
      "Havoc",
      "Royal Warden Makhotep",
      "Hexmark Destroyer Imospekh",
      "Termagant",
    ])
  })

  it("restores NPC, variation, and level from a direct link", async () => {
    await renderPage(
      "/library/npcs/makhotep?variation=necroBossWardenLHE&level=1"
    )

    expect(await screen.findByTestId("npc-name")).toHaveTextContent("Makhotep")
    expect(screen.getByTestId("npcs-variation-select")).toHaveTextContent(
      "Quest Event"
    )
    // served index 1 of the LHE ladder is rank 18 / 13 stars, health 8000
    expect(screen.getByTestId("npc-stat-health")).toHaveTextContent(
      numberText(8000)
    )
    expect(location()).toBe(
      "/library/npcs/makhotep?variation=necroBossWardenLHE&level=1"
    )
  })

  it("selects the default variation and first level without writing them back to the URL", async () => {
    await renderPage("/library/npcs/makhotep")

    expect(await screen.findByTestId("npc-name")).toHaveTextContent("Makhotep")
    expect(screen.getByTestId("npcs-variation-select")).toHaveTextContent(
      "Standard"
    )
    // necroNpcWarden's first row in display order: rank 1 / 1 star, health 117
    expect(screen.getByTestId("npc-stat-health")).toHaveTextContent("117")
    expect(location()).toBe("/library/npcs/makhotep")
  })

  it("falls back to the default for an unknown variation, leaving the URL unchanged", async () => {
    await renderPage("/library/npcs/makhotep?variation=doesNotExist")

    expect(await screen.findByTestId("npc-name")).toHaveTextContent("Makhotep")
    expect(screen.getByTestId("npc-stat-health")).toHaveTextContent("117")
    expect(location()).toBe("/library/npcs/makhotep?variation=doesNotExist")
  })

  it("falls back to the first level in display order for an out-of-range level", async () => {
    await renderPage("/library/npcs/makhotep?variation=necroBossWarden&level=9")

    expect(await screen.findByTestId("npc-name")).toHaveTextContent("Makhotep")
    // necroBossWarden serves rank 2 first, but display order puts rank 1 / 2 stars (health 140) first
    expect(screen.getByTestId("npc-stat-health")).toHaveTextContent("140")
  })

  it("selecting another NPC drops variation and level", async () => {
    const user = userEvent.setup()
    await renderPage(
      "/library/npcs/makhotep?variation=necroBossWardenLHE&level=1"
    )
    await screen.findByTestId("npc-name")

    await user.click(screen.getByTestId("npc-tile-imospekh"))

    await waitFor(() => expect(location()).toBe("/library/npcs/imospekh"))
    expect(screen.getByTestId("npc-name")).toHaveTextContent("Imospekh")
  })

  it("changing the variation replaces `variation` and drops `level`", async () => {
    const user = userEvent.setup()
    await renderPage(
      "/library/npcs/makhotep?variation=necroBossWardenLHE&level=1"
    )
    await screen.findByTestId("npc-name")

    await user.click(screen.getByTestId("npcs-variation-select"))
    const options = await screen.findAllByRole("option")
    expect(options).toHaveLength(5)
    await user.click(
      options.find((o) => o.textContent?.includes("necroBossWardenLEG"))!
    )

    await waitFor(() =>
      expect(location()).toBe(
        "/library/npcs/makhotep?variation=necroBossWardenLEG"
      )
    )
    expect(screen.getByTestId("npc-stat-health")).toHaveTextContent(
      numberText(2014)
    )
  })

  it("changing the level writes the served index, and ties show health in the options", async () => {
    const user = userEvent.setup()
    await renderPage("/library/npcs/havoc")
    await screen.findByTestId("npc-name")

    await user.click(screen.getByTestId("npcs-level-select"))
    const options = await screen.findAllByRole("option")
    expect(options).toHaveLength(3)
    expect(options[2]).toHaveTextContent(/ HP$/)
    expect(options[2]).toHaveTextContent(numberText(1_729_700))
    await user.click(at(options, 2))

    await waitFor(() => expect(location()).toBe("/library/npcs/havoc?level=2"))
    expect(screen.getByTestId("npc-stat-health")).toHaveTextContent(
      numberText(1_729_700)
    )
  })

  it("disables the variation selector for a single-variation NPC", async () => {
    await renderPage("/library/npcs/termagant")

    expect(await screen.findByTestId("npc-name")).toHaveTextContent("Termagant")
    expect(screen.getByTestId("npcs-variation-select")).toBeDisabled()
    expect(screen.getByTestId("npc-attack-ranged")).toHaveTextContent("Range 2")
  })

  it("lists the variation's abilities, unchanged by the selected level", async () => {
    const user = userEvent.setup()
    await renderPage("/library/npcs/makhotep?variation=necroBossWarden")
    await screen.findByTestId("npc-name")

    expect(screen.getByTestId("npc-abilities-active")).toHaveTextContent(
      "Adaptive Strategy"
    )
    expect(screen.getByTestId("npc-abilities-passive")).toHaveTextContent(
      "Relentless March"
    )

    await user.click(screen.getByTestId("npcs-level-select"))
    const options = await screen.findAllByRole("option")
    await user.click(at(options, options.length - 1))

    await waitFor(() => expect(location()).toContain("level="))
    expect(screen.getByTestId("npc-abilities-active")).toHaveTextContent(
      "Adaptive Strategy"
    )
  })

  it("paints the NPC before its rules text arrives and fetches only its abilities", async () => {
    const user = userEvent.setup()
    requestedNamespaces.length = 0
    const release = holdNamespaceLoads()
    await renderPage("/library/npcs/makhotep?variation=necroBossWarden")
    expect(await screen.findByTestId("npc-name")).toHaveTextContent("Makhotep")

    await user.click(screen.getByRole("button", { name: /Adaptive Strategy/ }))
    expect(
      screen.getByTestId("npc-ability-AdaptiveStrategy-text-loading")
    ).toHaveTextContent("Loading rules text…")

    act(release)
    await waitFor(() =>
      expect(
        screen.queryByTestId("npc-ability-AdaptiveStrategy-text-loading")
      ).toBeNull()
    )
    expect(
      requestedNamespaces.filter((key) => key.includes("AbilityText/")).sort()
    ).toEqual([
      "en/npcAbilityText/AdaptiveStrategy",
      "en/npcAbilityText/RelentlessMarch",
    ])
  })

  it("renders no abilities section for a variation with none", async () => {
    await renderPage("/library/npcs/havoc")
    await screen.findByTestId("npc-name")

    expect(screen.queryByTestId("npc-abilities")).toBeNull()
  })

  it("shows the empty-traits state and only a melee row for a plain unit", async () => {
    await renderPage("/library/npcs/havoc")

    expect(await screen.findByTestId("npc-traits-empty")).toBeVisible()
    expect(screen.getByTestId("npc-attack-melee")).toBeVisible()
    expect(screen.queryByTestId("npc-attack-ranged")).not.toBeInTheDocument()
  })

  it("filters the list by search without touching the selected URL", async () => {
    const user = userEvent.setup()
    await renderPage("/library/npcs/makhotep")
    await screen.findByTestId("npc-name")

    await openFilters(user)
    await user.type(screen.getByTestId("npcs-search"), "term")

    const list = screen.getByTestId("npcs-list")
    expect(within(list).getAllByRole("button")).toHaveLength(1)
    expect(location()).toBe("/library/npcs/makhotep")
    expect(screen.getByTestId("npc-name")).toHaveTextContent("Makhotep")
  })

  it("shows the no-matching-NPCs state with a clear control", async () => {
    const user = userEvent.setup()
    await renderPage("/library/npcs/makhotep")
    await screen.findByTestId("npc-name")

    await openFilters(user)
    await user.type(screen.getByTestId("npcs-search"), "zzz")
    expect(screen.getByTestId("npcs-no-matching")).toBeVisible()

    await user.click(
      within(screen.getByTestId("npcs-no-matching")).getByRole("button")
    )
    expect(
      within(screen.getByTestId("npcs-list")).getAllByRole("button")
    ).toHaveLength(4)
  })

  it("moves the URL to the first matching variation when the selected one stops matching", async () => {
    const user = userEvent.setup()
    // Only necroNpcWarden has rank 1 / 1 star... use faction filter: every Makhotep variation is
    // Necrons, so filter by trait instead — give the LHE variation a unique trait via the fixture.
    seededNpcs = [
      ...makhotepRecords.map((r) =>
        r.id === "necroNpcWarden"
          ? { ...r, traits: ["LivingMetal", "Mechanical", "Boss"] }
          : r
      ),
      imospekh,
    ]
    await renderPage(
      "/library/npcs/makhotep?variation=necroBossWardenLHE&level=1"
    )
    await screen.findByTestId("npc-name")

    await openFilters(user)
    await user.click(screen.getByTestId("npcs-trait-filter"))
    await user.click(await screen.findByRole("option", { name: /Boss/ }))

    await waitFor(() =>
      expect(location()).toBe("/library/npcs/makhotep?variation=necroNpcWarden")
    )
  })

  it("shows the no-matching-variation state when filters exclude every variation of the selected NPC", async () => {
    const user = userEvent.setup()
    await renderPage("/library/npcs/makhotep")
    await screen.findByTestId("npc-name")

    await openFilters(user)
    await user.click(screen.getByTestId("npcs-trait-filter"))
    await user.click(await screen.findByRole("option", { name: /Swarm/ }))

    expect(
      await screen.findByTestId("npcs-no-matching-variation")
    ).toBeVisible()
    expect(location()).toBe("/library/npcs/makhotep")
  })

  it("links an open filter combobox to its listbox via aria-controls", async () => {
    const user = userEvent.setup()
    await renderPage("/library/npcs/makhotep")
    await screen.findByTestId("npc-name")

    await openFilters(user)
    const trigger = screen.getByTestId("npcs-trait-filter")
    expect(trigger).not.toHaveAttribute("aria-controls")
    await user.click(trigger)

    expect(trigger).toHaveAttribute("aria-expanded", "true")
    expect(
      document.getElementById(trigger.getAttribute("aria-controls") ?? "")
    ).toBe(await screen.findByRole("listbox"))
  })

  it("resets filters when the user leaves and returns", async () => {
    const user = userEvent.setup()
    const view = await renderPage("/library/npcs/makhotep")
    await screen.findByTestId("npc-name")
    await openFilters(user)
    await user.type(screen.getByTestId("npcs-search"), "term")
    expect(
      within(screen.getByTestId("npcs-list")).getAllByRole("button")
    ).toHaveLength(1)

    view.unmount()
    await renderPage("/library/npcs/makhotep")
    await screen.findByTestId("npc-name")

    expect(
      within(screen.getByTestId("npcs-list")).getAllByRole("button")
    ).toHaveLength(4)
  })

  describe("mobile", () => {
    beforeEach(() => {
      isMobileMock.value = true
    })

    it("renders the combobox instead of the tile list and navigates on pick", async () => {
      const user = userEvent.setup()
      await renderPage("/library/npcs/makhotep")
      await screen.findByTestId("npc-name")

      expect(screen.queryByTestId("npcs-list")).not.toBeInTheDocument()
      const combobox = within(screen.getByTestId("npcs-combobox")).getByRole(
        "combobox"
      )
      expect(combobox).toHaveTextContent("Makhotep")

      await user.click(combobox)
      await user.type(screen.getByPlaceholderText("Select an NPC"), "makh")
      const options = await screen.findAllByRole("option")
      expect(options).toHaveLength(1)
      await user.click(at(options, 0))

      await waitFor(() => expect(location()).toBe("/library/npcs/makhotep"))
    })

    it("stacks the detail with the compact stat grid and full-width selectors", async () => {
      await renderPage("/library/npcs/makhotep")

      expect(await screen.findByTestId("npcs-mobile-page")).toBeVisible()
      expect(screen.getByTestId("npcs-stats")).toHaveClass("grid-cols-2")
      expect(screen.getByTestId("npcs-variation-select")).toBeVisible()
      expect(screen.getByTestId("npcs-level-select")).toBeVisible()
    })
  })
})

describe("NpcsPage desktop layout and filters", () => {
  beforeEach(() => {
    isMobileMock.value = false
    seededNpcs = dataset
  })

  it("marks the selected tile pressed and renders the list beside the detail", async () => {
    await renderPage("/library/npcs/imospekh")
    await screen.findByTestId("npc-name")

    expect(screen.getByTestId("npc-tile-imospekh")).toHaveAttribute(
      "aria-pressed",
      "true"
    )
    expect(screen.getByTestId("npc-tile-makhotep")).toHaveAttribute(
      "aria-pressed",
      "false"
    )
    expect(screen.getByTestId("npcs-desktop-page")).toBeVisible()
    const columns = screen.getByTestId("npcs-columns")
    expect(within(columns).getByTestId("npcs-list")).toBeVisible()
    expect(within(columns).getByTestId("npc-detail")).toBeVisible()
  })

  it("keeps name search outside the collapsible filters", async () => {
    const user = userEvent.setup()
    await renderPage("/library/npcs/makhotep")
    await screen.findByTestId("npc-name")

    // Search is usable without opening the panel, and is not counted as a filter.
    expect(screen.queryByTestId("npcs-filter-bar")).toBeNull()
    await user.type(screen.getByTestId("npcs-search"), "term")

    expect(
      within(screen.getByTestId("npcs-list")).getAllByRole("button")
    ).toHaveLength(1)
    expect(screen.getByTestId("npcs-filters-toggle")).toHaveTextContent(
      "Filters"
    )
  })

  it("narrows by alliance and by attack type", async () => {
    const user = userEvent.setup()
    await renderPage("/library/npcs/makhotep")
    await screen.findByTestId("npc-name")
    await openFilters(user)

    await user.click(screen.getByTestId("npcs-alliance-filter"))
    await user.click(await screen.findByRole("option", { name: /Xenos/ }))
    const afterAlliance = within(screen.getByTestId("npcs-list")).getAllByRole(
      "button"
    ).length
    expect(afterAlliance).toBeGreaterThan(0)

    await user.click(screen.getByTestId("npcs-attack-filter"))
    await user.click(await screen.findByRole("option", { name: "Melee only" }))
    expect(screen.getByTestId("npcs-filters-toggle")).toHaveTextContent(
      "Filters (2)"
    )
  })

  it("clears one multi-select without touching the others", async () => {
    const user = userEvent.setup()
    await renderPage("/library/npcs/makhotep")
    await screen.findByTestId("npc-name")
    await openFilters(user)

    await user.click(screen.getByTestId("npcs-damage-type-filter"))
    await user.click(await screen.findByRole("option", { name: "Gauss" }))
    await user.click(screen.getByTestId("npcs-trait-filter"))
    await user.click(
      await screen.findByRole("option", { name: "Living Metal" })
    )
    expect(screen.getByTestId("npcs-filters-toggle")).toHaveTextContent(
      "Filters (2)"
    )

    await user.click(screen.getByTestId("npcs-damage-type-filter-clear"))

    // Only the damage-type facet is reset; the trait facet survives.
    expect(screen.getByTestId("npcs-filters-toggle")).toHaveTextContent(
      "Filters (1)"
    )
    expect(screen.queryByTestId("npcs-damage-type-filter-clear")).toBeNull()
    expect(screen.getByTestId("npcs-trait-filter-clear")).toBeVisible()
  })

  it("offers no blank damage-type option for a unit served without a damage profile", async () => {
    const user = userEvent.setup()
    seededNpcs = [
      ...dataset,
      npcRecord("darkaNpc4Watcher", "Watcher", {
        factionId: "DarkAngels",
        meleeDamage: "",
        meleeHits: 0,
        traits: ["Immune"],
        stats: [statRow(0, 0, 50)],
      }),
    ]
    await renderPage("/library/npcs/watcher")
    await screen.findByTestId("npc-name")

    // No attacks at all rather than a phantom melee chip.
    expect(screen.getByTestId("npc-attacks-empty")).toBeVisible()
    expect(screen.queryByTestId("npc-attack-melee")).toBeNull()

    await openFilters(user)
    await user.click(screen.getByTestId("npcs-damage-type-filter"))
    const options = await screen.findAllByRole("option")
    expect(options.every((o) => o.textContent?.trim() !== "")).toBe(true)
  })

  it("narrows by faction and by damage type, and the clear button reports the active count", async () => {
    const user = userEvent.setup()
    await renderPage("/library/npcs/makhotep")
    await screen.findByTestId("npc-name")

    await openFilters(user)
    await user.click(screen.getByTestId("npcs-faction-filter"))
    await user.click(await screen.findByRole("option", { name: "Tyranids" }))
    expect(
      within(screen.getByTestId("npcs-list")).getAllByRole("button")
    ).toHaveLength(1)
    expect(screen.getByTestId("npcs-filters-toggle")).toHaveTextContent(
      "Filters (1)"
    )

    await user.click(screen.getByTestId("npcs-damage-type-filter"))
    await user.click(await screen.findByRole("option", { name: "Piercing" }))
    expect(screen.getByTestId("npcs-filters-toggle")).toHaveTextContent(
      "Filters (2)"
    )

    await user.click(screen.getByTestId("npcs-clear-filters"))
    expect(
      within(screen.getByTestId("npcs-list")).getAllByRole("button")
    ).toHaveLength(4)
    expect(screen.getByTestId("npcs-clear-filters")).toBeDisabled()
  })
})

describe("NpcsPage power card", () => {
  beforeEach(() => {
    isMobileMock.value = false
    seededNpcs = [...dataset, infiltrator, watcher]
    powerMock.state = powerReady
  })

  it("shows the selected level row's power and follows the level", async () => {
    const user = userEvent.setup()
    await renderPage("/library/npcs/infiltrator?level=2")
    await screen.findByTestId("npc-name")
    // Third served row: health 76, damage 34, armour 22 → 45.
    expect(screen.getByTestId("npc-stat-health")).toHaveTextContent("76")
    expect(powerValue()).toHaveTextContent(/^45$/)
    expect(powerCard()).toHaveTextContent("Power")

    await user.click(screen.getByTestId("npcs-level-select"))
    const options = await screen.findAllByRole("option")
    await user.click(at(options, 5))
    await waitFor(() => expect(location()).not.toMatch(/level=2$/))
    const level = Number(
      new URLSearchParams(location().split("?")[1]).get("level")
    )
    const expected = npcPowerAt(
      "darkaNpc1Infiltrator",
      at(infiltratorNpc.stats, level),
      powerContext
    )!
    expect(expected).not.toBe(45)
    expect(powerValue()).toHaveTextContent(numberText(expected))
  })

  it("shows a unit with no attacks at 10 plus its ability power, not an error", async () => {
    await renderPage("/library/npcs/watcher")
    await screen.findByTestId("npc-name")
    const expected = npcPowerAt(
      "tyranNpcWatcher",
      at(watcher.stats, 0),
      powerContext
    )!
    expect(expected).toBeGreaterThan(10)
    expect(powerValue()).toHaveTextContent(numberText(expected))
  })

  it("opens the estimate note on focus", async () => {
    await renderPage("/library/npcs/infiltrator")
    await screen.findByTestId("npc-name")
    screen.getByTestId("npc-stat-power-note").focus()
    expect(
      await screen.findByTestId("npc-stat-power-note-content")
    ).toHaveTextContent("Estimated from the listed stats.")
  })

  it("closes the estimate note with Escape and keeps it closed", async () => {
    const user = userEvent.setup()
    await renderPage("/library/npcs/infiltrator")
    await screen.findByTestId("npc-name")
    const trigger = screen.getByTestId("npc-stat-power-note")
    trigger.focus()
    await screen.findByTestId("npc-stat-power-note-content")
    await user.keyboard("{Escape}")
    await waitFor(() =>
      expect(screen.queryByTestId("npc-stat-power-note-content")).toBeNull()
    )
    // Focus is not handed back to the trigger, so its onFocus does not reopen the note.
    await new Promise((resolve) => setTimeout(resolve, 50))
    expect(screen.queryByTestId("npc-stat-power-note-content")).toBeNull()
  })

  it("opens the estimate note on hover without moving focus, and closes it on leave", async () => {
    const user = userEvent.setup()
    await renderPage("/library/npcs/infiltrator")
    await screen.findByTestId("npc-name")
    const trigger = screen.getByTestId("npc-stat-power-note")
    await user.hover(trigger)
    const content = await screen.findByTestId("npc-stat-power-note-content")
    expect(content).not.toContainElement(
      document.activeElement as HTMLElement | null
    )
    await user.unhover(trigger)
    await waitFor(() =>
      expect(screen.queryByTestId("npc-stat-power-note-content")).toBeNull()
    )
    await new Promise((resolve) => setTimeout(resolve, 50))
    expect(screen.queryByTestId("npc-stat-power-note-content")).toBeNull()
  })

  it("opens the estimate note on tap", async () => {
    const user = userEvent.setup()
    await renderPage("/library/npcs/infiltrator")
    await screen.findByTestId("npc-name")
    await user.click(screen.getByTestId("npc-stat-power-note"))
    expect(
      await screen.findByTestId("npc-stat-power-note-content")
    ).toBeVisible()
  })

  it("shows a placeholder while the power data loads", async () => {
    powerMock.state = { status: "loading" }
    await renderPage("/library/npcs/infiltrator")
    await screen.findByTestId("npc-name")
    expect(screen.getByTestId("npc-stat-power-loading")).toBeInTheDocument()
  })

  it("leaves out the power card and keeps the other stats when the data failed", async () => {
    powerMock.state = { status: "error" }
    await renderPage("/library/npcs/infiltrator?level=2")
    await screen.findByTestId("npc-name")
    expect(screen.queryByTestId("npc-stat-power")).not.toBeInTheDocument()
    expect(screen.getByTestId("npc-stat-health")).toHaveTextContent("76")
    expect(screen.getByTestId("npc-stat-armour")).toHaveTextContent("22")
    expect(screen.getByTestId("npc-stat-damage")).toHaveTextContent("34")
  })

  it("is in the compact mobile stat grid", async () => {
    isMobileMock.value = true
    await renderPage("/library/npcs/infiltrator?level=2")
    await screen.findByTestId("npc-name")
    expect(
      within(screen.getByTestId("npcs-stats")).getByTestId("npc-stat-power")
    ).toHaveTextContent(/45/)
  })
})

describe("NpcsPage encounters", () => {
  type Battle = {
    battleId: string | null
    track: string | null
    tier: number | null
    number: number | null
    challenge: boolean
    role: "enemy" | "boss" | "prime"
    rounds: number[]
    count: number | null
    levels: { servedIndex: number | null; count: number }[]
  }
  const battle = (overrides: Partial<Battle> = {}): Battle => ({
    battleId: null,
    track: null,
    tier: null,
    number: null,
    challenge: false,
    role: "enemy",
    rounds: [],
    count: 1,
    levels: [],
    ...overrides,
  })
  const encounter = (
    npcId: string,
    source: string,
    groupId: string,
    battles: Battle[]
  ) => ({ npcId, source, groupId, battles })

  // necroNpcWarden is Makhotep's default variation; only the LEG variation fights in Survival.
  const wardenEncounters = [
    encounter(
      "necroNpcWarden",
      "onslaught",
      "onslaught",
      Array.from({ length: 21 }, (_, i) =>
        battle({ tier: i + 1, rounds: [1, 2] })
      )
    ),
    encounter("necroNpcWarden", "campaign", "campaign1", [
      battle({ battleId: "I03", number: 3 }),
      battle({ battleId: "I07", number: 7 }),
    ]),
    encounter("necroNpcWarden", "legendaryEvent", "astarLysander", [
      battle({ battleId: "astarLysander-alpha-1", track: "alpha", number: 1 }),
      battle({ battleId: "astarLysander-alpha-2", track: "alpha", number: 2 }),
      battle({ battleId: "astarLysander-alpha-3", track: "alpha", number: 3 }),
      battle({ battleId: "astarLysander-beta-7", track: "beta", number: 7 }),
    ]),
    encounter("necroNpcWarden", "questEvent", "astarCyrus", [
      battle({ number: 1 }),
    ]),
    encounter(
      "necroNpcWarden",
      "guildRaid",
      "GuildBoss1Boss1TyranTervigonLeviathan",
      [battle({ count: null })]
    ),
    encounter("necroBossWardenLEG", "survival", "survival_crescendo_01", [
      battle({ rounds: [1] }),
      battle({ rounds: [3] }),
    ]),
  ]
  // Far in the future, so the run is "next" whatever day the test runs.
  const lysanderRun = {
    "2099-01-08": [
      {
        occurrenceId: "occ-2099-01-08-legendary-event-lysander",
        definitionId: "legendary-event",
        confirmed: true,
        startUtc: "2099-01-08T00:00:00Z",
        endUtc: "2099-01-15T00:00:00Z",
        parameters: { featuredCharacterId: "astarLysander" },
      },
    ],
  }

  beforeEach(() => {
    isMobileMock.value = false
    seededNpcs = dataset
    powerMock.state = powerReady
  })

  async function renderWithEncounters(
    entry: string,
    encounters: unknown[] | null = wardenEncounters,
    calendar: unknown = lysanderRun
  ) {
    await seedGameCatalog({
      ...(encounters ? { "npc-encounters": encounters } : {}),
      ...(calendar ? { "events-calendar": calendar } : {}),
    })
    const view = await renderPage(entry)
    await screen.findByTestId("npc-name")
    return view
  }

  it("groups the selected variation's encounters by source in the fixed order", async () => {
    await renderWithEncounters("/library/npcs/makhotep")

    const section = await screen.findByTestId("npc-encounters")
    await within(section).findByTestId("npc-encounters-campaign")
    const blocks = within(section)
      .getAllByTestId(/^npc-encounters-[a-zA-Z]+$/)
      .map((block) => block.dataset.testid)
    expect(blocks).toEqual([
      "npc-encounters-campaign",
      "npc-encounters-legendaryEvent",
      "npc-encounters-questEvent",
      "npc-encounters-guildRaid",
      "npc-encounters-onslaught",
    ])
    expect(
      screen.getByTestId("npc-encounter-campaign-campaign1-location")
    ).toHaveTextContent("Battles 3, 7")
  })

  it("shows a Legendary Event's tracks, its next run and a link to the event", async () => {
    await renderWithEncounters("/library/npcs/makhotep")

    const id = "npc-encounter-legendaryEvent-astarLysander"
    await screen.findByTestId(id)
    expect(screen.getByTestId(`${id}-location`)).toHaveTextContent(
      "Alpha 1–3 · Beta 7"
    )
    expect(screen.getByTestId(`${id}-timing`)).toHaveTextContent(
      /^Next run (Jan 8|8 Jan)/
    )
    expect(screen.getByTestId(`${id}-link`)).toHaveAttribute(
      "href",
      "/legendary-events/astarLysander"
    )
  })

  it("shows a Quest Event with no scheduled run and no link", async () => {
    await renderWithEncounters("/library/npcs/makhotep")

    const quest = await screen.findByTestId(
      "npc-encounter-questEvent-astarCyrus"
    )
    expect(quest).toHaveTextContent("No scheduled run")
    expect(within(quest).queryByRole("link")).not.toBeInTheDocument()
  })

  it("shows a guild raid field unit alongside its boss, rotating, linked to the boss", async () => {
    await renderWithEncounters("/library/npcs/makhotep")

    const raid = await screen.findByTestId(
      "npc-encounter-guildRaid-GuildBoss1Boss1TyranTervigonLeviathan"
    )
    expect(raid).toHaveTextContent("Fights alongside this boss")
    expect(raid).toHaveTextContent("Rotating")
    expect(within(raid).getByRole("link")).toHaveAttribute(
      "href",
      "/library/raid-bosses/GuildBoss1Boss1TyranTervigonLeviathan"
    )
  })

  it("shows Onslaught tiers as a range that is always available", async () => {
    await renderWithEncounters("/library/npcs/makhotep")

    const onslaught = await screen.findByTestId(
      "npc-encounter-onslaught-onslaught"
    )
    expect(onslaught).toHaveTextContent("Can appear in tiers 1–21")
    expect(onslaught).toHaveTextContent("Always available")
    expect(within(onslaught).getByRole("link")).toHaveAttribute(
      "href",
      "/my-game/onslaught"
    )
  })

  it("names an incursion by its MoW and a Survival season by its label, with tiers 1-based", async () => {
    await renderWithEncounters("/library/npcs/imospekh", [
      encounter("necroNpcDestroyer", "incursion", "tauBroadside", [
        battle({ battleId: "1", tier: 0 }),
        battle({ battleId: "2", tier: 0 }),
        battle({ battleId: "1", tier: 1 }),
        battle({ battleId: "2", tier: 1 }),
      ]),
      encounter("necroNpcDestroyer", "survival", "survival_crescendo_01", [
        battle({ rounds: [1, 3, 4, 5] }),
      ]),
    ])

    const incursion = await screen.findByTestId(
      "npc-encounter-incursion-tauBroadside"
    )
    expect(within(incursion).getByRole("link")).toHaveTextContent("Tson'ji")
    expect(incursion).toHaveTextContent("Tiers 1–2: battles 1–2")
    const survival = screen.getByTestId(
      "npc-encounter-survival-survival_crescendo_01"
    )
    expect(survival).toHaveTextContent("Crescendo")
    expect(survival).toHaveTextContent("Rounds 1, 3–5")
    expect(within(survival).queryByRole("link")).not.toBeInTheDocument()
  })

  it("says no encounters are recorded when the data names the variation nowhere", async () => {
    await renderWithEncounters("/library/npcs/imospekh")

    const none = await screen.findByTestId("npc-encounters-none")
    expect(none).toHaveTextContent(
      "No encounters are recorded for this variation."
    )
    expect(none).toHaveTextContent("may still be met elsewhere")
  })

  it("shows the rows without timing while the calendar is unavailable", async () => {
    await renderWithEncounters("/library/npcs/makhotep", wardenEncounters, null)

    const id = "npc-encounter-legendaryEvent-astarLysander"
    await screen.findByTestId(id)
    expect(screen.getByTestId(`${id}-location`)).toHaveTextContent(
      "Alpha 1–3 · Beta 7"
    )
    expect(screen.queryByTestId(`${id}-timing`)).not.toBeInTheDocument()
    expect(screen.getByTestId(`${id}-link`)).toBeInTheDocument()
  })

  it("shows the unavailable note and no game-mode filter without encounter data", async () => {
    const user = userEvent.setup()
    await renderWithEncounters("/library/npcs/makhotep", null)

    expect(
      await screen.findByTestId("npc-encounters-unavailable")
    ).toHaveTextContent("Encounter data is not available yet.")
    expect(screen.getByTestId("npc-stat-health")).toBeVisible()
    await openFilters(user)
    expect(screen.getByTestId("npcs-faction-filter")).toBeVisible()
    expect(
      screen.queryByTestId("npcs-game-mode-filter")
    ).not.toBeInTheDocument()
  })

  it("narrows the list and the variations by game mode, counting it as a filter", async () => {
    const user = userEvent.setup()
    await renderWithEncounters("/library/npcs/makhotep")
    await screen.findByTestId("npc-encounter-campaign-campaign1")
    await openFilters(user)

    await user.click(screen.getByTestId("npcs-game-mode-filter"))
    await user.click(await screen.findByRole("option", { name: "Survival" }))

    expect(screen.getByTestId("npcs-filters-toggle")).toHaveTextContent(
      "Filters (1)"
    )
    expect(
      within(screen.getByTestId("npcs-list")).getAllByRole("button")
    ).toHaveLength(1)
    await waitFor(() =>
      expect(screen.getByTestId("npcs-variation-select")).toHaveTextContent(
        "necroBossWardenLEG"
      )
    )
    expect(screen.getByTestId("npcs-variation-select")).toBeDisabled()
  })

  it("offers the locations of the chosen game mode and clears them with it", async () => {
    const user = userEvent.setup()
    await renderWithEncounters("/library/npcs/makhotep", [
      ...wardenEncounters,
      encounter("necroBossWardenLEG", "campaign", "elite1", [
        battle({ battleId: "E01", number: 1 }),
      ]),
    ])
    await screen.findByTestId("npc-encounter-campaign-campaign1")
    await openFilters(user)
    expect(screen.queryByTestId("npcs-location-filter")).not.toBeInTheDocument()

    await user.click(screen.getByTestId("npcs-game-mode-filter"))
    await user.click(await screen.findByRole("option", { name: "Campaign" }))
    await user.click(screen.getByTestId("npcs-location-filter"))
    const [any, ...locations] = await screen.findAllByRole("option")
    expect(any).toHaveTextContent("Any location")
    expect(locations).toHaveLength(2)
    const elite = locations.find((option) =>
      /elite/i.test(option.textContent ?? "")
    )
    await user.click(elite as HTMLElement)

    expect(screen.getByTestId("npcs-filters-toggle")).toHaveTextContent(
      "Filters (2)"
    )
    await waitFor(() =>
      expect(screen.getByTestId("npcs-variation-select")).toHaveTextContent(
        "necroBossWardenLEG"
      )
    )

    await user.click(screen.getByTestId("npcs-game-mode-filter"))
    await user.click(await screen.findByRole("option", { name: "Survival" }))
    expect(screen.getByTestId("npcs-filters-toggle")).toHaveTextContent(
      "Filters (1)"
    )
  })

  it("keeps other game modes out of the section when a game mode and a count are set", async () => {
    const user = userEvent.setup()
    await renderWithEncounters("/library/npcs/makhotep", [
      encounter("necroNpcWarden", "campaign", "campaign1", [
        battle({ battleId: "I03", number: 3, count: 5 }),
      ]),
      encounter("necroNpcWarden", "legendaryEvent", "astarLysander", [
        battle({
          battleId: "astarLysander-alpha-1",
          track: "alpha",
          number: 1,
          count: 5,
        }),
      ]),
    ])
    await screen.findByTestId("npc-encounter-campaign-campaign1")
    await openFilters(user)
    await user.click(screen.getByTestId("npcs-game-mode-filter"))
    await user.click(await screen.findByRole("option", { name: "Campaign" }))
    await user.type(screen.getByTestId("npcs-min-count-filter"), "5")

    await waitFor(() =>
      expect(
        screen.queryByTestId("npc-encounter-legendaryEvent-astarLysander")
      ).not.toBeInTheDocument()
    )
    expect(
      screen.getByTestId("npc-encounter-campaign-campaign1")
    ).toBeInTheDocument()
  })

  it("clears filters that exclude the variation a chip opens, and keeps its level", async () => {
    const user = userEvent.setup()
    await renderWithEncounters("/library/npcs/makhotep", [
      encounter("necroNpcWarden", "campaign", "campaign1", [
        battle({
          battleId: "I03",
          number: 3,
          count: 5,
          levels: [{ servedIndex: 0, count: 5 }],
        }),
        battle({ battleId: "I07", number: 7, count: 5 }),
      ]),
      encounter("necroBossWardenLEG", "campaign", "campaign1", [
        battle({
          battleId: "I03",
          number: 3,
          count: 2,
          levels: [{ servedIndex: 0, count: 2 }],
        }),
      ]),
    ])
    const id = "npc-encounter-campaign-campaign1"
    await screen.findByTestId(id)
    await openFilters(user)
    await user.type(screen.getByTestId("npcs-min-count-filter"), "5")
    await user.click(await screen.findByTestId(`${id}-toggle`))
    await user.click(screen.getByTestId(`${id}-place-I03`))

    const chip = within(screen.getByTestId(`${id}-place-I03-npcs`))
      .getAllByRole("link")
      .find((link) =>
        link.getAttribute("href")?.includes("variation=necroBossWardenLEG")
      )
    await user.click(chip as HTMLElement)

    await waitFor(() =>
      expect(location()).toContain("variation=necroBossWardenLEG&level=0")
    )
    expect(screen.getByTestId("npcs-filters-toggle")).not.toHaveTextContent("(")
    expect(screen.getByTestId("npcs-variation-select")).toHaveTextContent(
      "necroBossWardenLEG"
    )
  })

  it("keeps the filters when a chip is opened in a new tab", async () => {
    const user = userEvent.setup()
    await renderWithEncounters("/library/npcs/makhotep", [
      encounter("necroNpcWarden", "campaign", "campaign1", [
        battle({ battleId: "I03", number: 3, count: 5 }),
        battle({ battleId: "I07", number: 7, count: 5 }),
      ]),
      encounter("necroBossWardenLEG", "campaign", "campaign1", [
        battle({ battleId: "I03", number: 3, count: 2 }),
      ]),
    ])
    const id = "npc-encounter-campaign-campaign1"
    await screen.findByTestId(id)
    await openFilters(user)
    await user.type(screen.getByTestId("npcs-min-count-filter"), "5")
    await user.click(await screen.findByTestId(`${id}-toggle`))
    await user.click(screen.getByTestId(`${id}-place-I03`))
    const chip = within(screen.getByTestId(`${id}-place-I03-npcs`))
      .getAllByRole("link")
      .find((link) =>
        link.getAttribute("href")?.includes("variation=necroBossWardenLEG")
      )
    const urlBefore = location()

    await user.keyboard("{Control>}")
    await user.click(chip as HTMLElement)
    await user.keyboard("{/Control}")

    expect(screen.getByTestId("npcs-filters-toggle")).toHaveTextContent(
      "Filters (1)"
    )
    expect(location()).toBe(urlBefore)
  })

  it("drops a chosen game mode that refreshed data no longer offers", async () => {
    const user = userEvent.setup()
    const { queryClient } = await renderWithEncounters("/library/npcs/makhotep")
    await screen.findByTestId("npc-encounter-campaign-campaign1")
    await openFilters(user)
    await user.click(screen.getByTestId("npcs-game-mode-filter"))
    await user.click(await screen.findByRole("option", { name: "Survival" }))
    expect(screen.getByTestId("npcs-filters-toggle")).toHaveTextContent(
      "Filters (1)"
    )

    await seedGameCatalog({
      "npc-encounters": wardenEncounters.filter(
        ({ source }) => source !== "survival"
      ),
    })
    act(() =>
      refreshLocalDataAfterSync(queryClient, "catalog", ["npc-encounters"])
    )

    await waitFor(() =>
      expect(screen.getByTestId("npcs-filters-toggle")).not.toHaveTextContent(
        "("
      )
    )
    expect(screen.getByTestId("npc-name")).toBeInTheDocument()
  })

  it("drops a chosen location that refreshed data no longer offers", async () => {
    const user = userEvent.setup()
    const { queryClient } = await renderWithEncounters(
      "/library/npcs/makhotep",
      [
        ...wardenEncounters,
        encounter("necroBossWardenLEG", "campaign", "elite1", [
          battle({ battleId: "E01", number: 1 }),
        ]),
      ]
    )
    await screen.findByTestId("npc-encounter-campaign-campaign1")
    await openFilters(user)
    await user.click(screen.getByTestId("npcs-game-mode-filter"))
    await user.click(await screen.findByRole("option", { name: "Campaign" }))
    await user.click(screen.getByTestId("npcs-location-filter"))
    const options = await screen.findAllByRole("option")
    const elite = options.find((option) =>
      /elite/i.test(option.textContent ?? "")
    )
    await user.click(elite as HTMLElement)
    expect(screen.getByTestId("npcs-filters-toggle")).toHaveTextContent(
      "Filters (2)"
    )

    await seedGameCatalog({ "npc-encounters": wardenEncounters })
    act(() =>
      refreshLocalDataAfterSync(queryClient, "catalog", ["npc-encounters"])
    )

    await waitFor(() =>
      expect(screen.getByTestId("npcs-filters-toggle")).toHaveTextContent(
        "Filters (1)"
      )
    )
    expect(screen.queryByTestId("npcs-location-filter")).not.toBeInTheDocument()
  })

  it("hides the location filter for a game mode with one location", async () => {
    const user = userEvent.setup()
    await renderWithEncounters("/library/npcs/makhotep")
    await screen.findByTestId("npc-encounter-campaign-campaign1")
    await openFilters(user)

    await user.click(screen.getByTestId("npcs-game-mode-filter"))
    await user.click(await screen.findByRole("option", { name: "Onslaught" }))
    expect(screen.queryByTestId("npcs-location-filter")).not.toBeInTheDocument()
  })

  it("narrows the list to NPCs in something running now", async () => {
    const user = userEvent.setup()
    await renderWithEncounters("/library/npcs/makhotep", wardenEncounters, {
      "2000-01-01": [
        {
          occurrenceId: "occ-long-running-lysander",
          definitionId: "legendary-event",
          confirmed: true,
          startUtc: "2000-01-01T00:00:00Z",
          endUtc: "2099-01-01T00:00:00Z",
          parameters: { featuredCharacterId: "astarLysander" },
        },
      ],
    })
    await screen.findByTestId("npc-encounter-campaign-campaign1")
    await openFilters(user)

    await user.click(screen.getByTestId("npcs-running-filter"))
    expect(screen.getByTestId("npcs-filters-toggle")).toHaveTextContent(
      "Filters (1)"
    )
    expect(
      within(screen.getByTestId("npcs-list")).getAllByRole("button")
    ).toHaveLength(1)
  })

  it("narrows the list and the encounters to battles meeting a mission count", async () => {
    const user = userEvent.setup()
    await renderWithEncounters("/library/npcs/makhotep", [
      ...wardenEncounters,
      encounter("necroBossWardenLEG", "campaign", "elite1", [
        battle({ battleId: "E01", number: 1, count: 6 }),
        battle({ battleId: "E02", number: 2, count: 1 }),
      ]),
    ])
    await screen.findByTestId("npc-encounter-campaign-campaign1")
    await openFilters(user)

    await user.type(screen.getByTestId("npcs-min-count-filter"), "5")
    expect(screen.getByTestId("npcs-filters-toggle")).toHaveTextContent(
      "Filters (1)"
    )
    await waitFor(() =>
      expect(screen.getByTestId("npcs-variation-select")).toHaveTextContent(
        "necroBossWardenLEG"
      )
    )

    const id = "npc-encounter-campaign-elite1"
    expect(
      screen.queryByTestId("npc-encounter-survival-survival_crescendo_01")
    ).not.toBeInTheDocument()
    expect(screen.getByTestId(`${id}-location`)).toHaveTextContent(
      "1 matching battle"
    )
    await user.click(screen.getByTestId(`${id}-toggle`))
    expect(screen.getByTestId(`${id}-place-E01`)).toBeVisible()
    expect(screen.queryByTestId(`${id}-place-E02`)).not.toBeInTheDocument()
  })

  it("hides the running-now filter without a calendar", async () => {
    const user = userEvent.setup()
    await renderWithEncounters("/library/npcs/makhotep", wardenEncounters, null)
    await screen.findByTestId("npc-encounter-campaign-campaign1")
    await openFilters(user)
    expect(screen.getByTestId("npcs-game-mode-filter")).toBeVisible()
    expect(screen.queryByTestId("npcs-running-filter")).not.toBeInTheDocument()
  })

  it("offers only the game modes the data has, in source order", async () => {
    const user = userEvent.setup()
    await renderWithEncounters("/library/npcs/makhotep")
    await screen.findByTestId("npc-encounter-campaign-campaign1")
    await openFilters(user)

    await user.click(screen.getByTestId("npcs-game-mode-filter"))
    const options = (await screen.findAllByRole("option")).map(
      (option) => option.textContent
    )
    expect(options).toEqual([
      "Any game mode",
      "Campaign",
      "Legendary Event",
      "Quest Event",
      "Guild Raid",
      "Survival",
      "Onslaught",
    ])
  })

  it("opens a row to its battles and a battle to every NPC fought there", async () => {
    const user = userEvent.setup()
    await renderWithEncounters("/library/npcs/makhotep", [
      ...wardenEncounters,
      encounter("necroNpcDestroyer", "campaign", "campaign1", [
        battle({ battleId: "I03", number: 3, count: 4 }),
      ]),
    ])

    const id = "npc-encounter-campaign-campaign1"
    const toggle = await screen.findByTestId(`${id}-toggle`)
    expect(toggle).toHaveAttribute("aria-expanded", "false")
    expect(screen.queryByTestId(`${id}-place-I03`)).not.toBeInTheDocument()

    await user.click(toggle)
    expect(toggle).toHaveAttribute("aria-expanded", "true")
    const third = screen.getByTestId(`${id}-place-I03`)
    expect(third).toHaveTextContent("Battle 3")
    expect(screen.getByTestId(`${id}-place-I07`)).toHaveTextContent("Battle 7")

    await user.click(third)
    const npcs = within(screen.getByTestId(`${id}-place-I03-npcs`))
    expect(npcs.getAllByRole("listitem")).toHaveLength(2)
    expect(
      npcs.getAllByTestId("npc-encounter-count").map((c) => c.textContent)
    ).toEqual(["×4", "×1"])
    // Every chip links; the selected NPC is only marked.
    expect(
      npcs.getAllByRole("link").map((link) => link.getAttribute("href"))
    ).toEqual([
      expect.stringContaining("variation=necroNpcDestroyer"),
      expect.stringContaining("variation=necroNpcWarden"),
    ])
    expect(
      within(screen.getByTestId(`${id}-place-I03-npcs`))
        .getAllByRole("listitem")
        .some((item) => item.querySelector("[aria-current='true']"))
    ).toBe(true)
  })

  it("shows one chip per level, each opening that variation at that level", async () => {
    const user = userEvent.setup()
    await renderWithEncounters("/library/npcs/makhotep", [
      encounter("necroNpcWarden", "campaign", "campaign1", [
        battle({
          battleId: "I03",
          number: 3,
          count: 3,
          levels: [
            { servedIndex: 0, count: 2 },
            { servedIndex: 1, count: 1 },
          ],
        }),
        battle({ battleId: "I07", number: 7 }),
      ]),
    ])

    const id = "npc-encounter-campaign-campaign1"
    await user.click(await screen.findByTestId(`${id}-toggle`))
    await user.click(screen.getByTestId(`${id}-place-I03`))

    const chips = within(
      screen.getByTestId(`${id}-place-I03-npcs`)
    ).getAllByRole("link")
    expect(chips.map((chip) => chip.getAttribute("href"))).toEqual([
      expect.stringContaining("variation=necroNpcWarden&level=0"),
      expect.stringContaining("variation=necroNpcWarden&level=1"),
    ])
    expect(
      chips.map(
        (chip) => within(chip).getByTestId("npc-encounter-count").textContent
      )
    ).toEqual(["×2", "×1"])

    await user.click(at(chips, 1))
    await waitFor(() =>
      expect(location()).toContain("variation=necroNpcWarden&level=1")
    )
    expect(screen.getByTestId(`${id}-place-I03-npcs`)).toBeVisible()
  })

  it("nests an Incursion's battles under its tiers", async () => {
    const user = userEvent.setup()
    await renderWithEncounters("/library/npcs/makhotep", [
      encounter("necroNpcWarden", "incursion", "tauBroadside", [
        battle({ battleId: "1", tier: 0 }),
        battle({ battleId: "2", tier: 0 }),
        battle({ battleId: "3", tier: 0, challenge: true }),
        battle({ battleId: "3", tier: 1, challenge: true }),
      ]),
    ])

    const id = "npc-encounter-incursion-tauBroadside"
    await user.click(await screen.findByTestId(`${id}-toggle`))
    const firstTier = screen.getByTestId(`${id}-group-0`)
    expect(firstTier).toHaveTextContent("Tier 1")
    expect(firstTier).toHaveTextContent("Battles 1–2 · Challenge 3")
    expect(screen.getByTestId(`${id}-group-1`)).toHaveTextContent("Tier 2")
    expect(screen.queryByTestId(`${id}-place-0|1`)).not.toBeInTheDocument()

    await user.click(firstTier)
    const firstBattle = screen.getByTestId(`${id}-place-0|1`)
    expect(firstBattle).toHaveTextContent("Battle 1")
    expect(screen.queryByTestId(`${id}-place-1|3`)).not.toBeInTheDocument()

    await user.click(firstBattle)
    expect(screen.getByTestId(`${id}-place-0|1-npcs`)).toBeVisible()

    await user.click(screen.getByTestId(`${id}-group-1`))
    expect(screen.getByTestId(`${id}-place-1|3`)).toHaveTextContent(
      "Challenge 3"
    )
  })

  it("does not read a battle without an id as battle 0", async () => {
    const user = userEvent.setup()
    await renderWithEncounters("/library/npcs/makhotep", [
      encounter("necroNpcWarden", "incursion", "tauBroadside", [
        battle({ battleId: "1", tier: 0 }),
        battle({ battleId: null, tier: 0 }),
        battle({ battleId: "2", tier: 1 }),
      ]),
    ])

    const id = "npc-encounter-incursion-tauBroadside"
    await user.click(await screen.findByTestId(`${id}-toggle`))
    expect(screen.getByTestId(`${id}-group-0`)).toHaveTextContent("Battles 1")
    expect(screen.getByTestId(`${id}-group-0`)).not.toHaveTextContent(
      "Battles 0"
    )
    expect(screen.getByTestId(id)).not.toHaveTextContent(/battles 0/i)
  })

  it("names and colours Incursion tiers by rarity, as the Incursions page does", async () => {
    const user = userEvent.setup()
    await seedGameCatalog({
      incursions: incursionsFixture,
      "npc-encounters": [
        encounter("necroNpcWarden", "incursion", "tauBroadside", [
          battle({ battleId: "1", tier: 0 }),
          battle({ battleId: "2", tier: 0 }),
          // The fixture's Mythic tier has index 12.
          battle({ battleId: "1", tier: 12 }),
        ]),
      ],
    })
    await renderPage("/library/npcs/makhotep")

    const id = "npc-encounter-incursion-tauBroadside"
    await waitFor(() =>
      expect(screen.getByTestId(`${id}-location`)).toHaveTextContent(
        "Common 1: battles 1–2 · Mythic 1: battles 1"
      )
    )
    await user.click(screen.getByTestId(`${id}-toggle`))
    const mythic = screen.getByTestId(`${id}-group-12`)
    expect(mythic).toHaveTextContent("Mythic 1")
    expect(within(mythic).getByText("Mythic 1")).toHaveClass(
      "text-(--rarity-mythic)"
    )
  })

  it("nests event battles under their tracks, opening a lone track", async () => {
    const user = userEvent.setup()
    await renderWithEncounters("/library/npcs/makhotep")

    const id = "npc-encounter-legendaryEvent-astarLysander"
    await user.click(await screen.findByTestId(`${id}-toggle`))
    const alpha = screen.getByTestId(`${id}-group-alpha`)
    expect(alpha).toHaveTextContent("Alpha")
    expect(alpha).toHaveTextContent("Battles 1–3")
    expect(alpha).toHaveAttribute("aria-expanded", "false")
    expect(screen.getByTestId(`${id}-group-beta`)).toHaveTextContent("Beta")

    await user.click(alpha)
    expect(
      screen.getByTestId(`${id}-place-astarLysander-alpha-2`)
    ).toHaveTextContent("Battle 2")
  })

  it("opens the only track of a row straight away", async () => {
    const user = userEvent.setup()
    await renderWithEncounters("/library/npcs/makhotep", [
      encounter("necroNpcWarden", "legendaryEvent", "astarLysander", [
        battle({
          battleId: "astarLysander-alpha-1",
          track: "alpha",
          number: 1,
        }),
        battle({
          battleId: "astarLysander-alpha-2",
          track: "alpha",
          number: 2,
        }),
      ]),
    ])

    const id = "npc-encounter-legendaryEvent-astarLysander"
    await user.click(await screen.findByTestId(`${id}-toggle`))
    expect(screen.getByTestId(`${id}-group-alpha`)).toHaveAttribute(
      "aria-expanded",
      "true"
    )
    expect(
      screen.getByTestId(`${id}-place-astarLysander-alpha-1`)
    ).toBeVisible()
  })

  it("opens a single-place group straight to its NPCs", async () => {
    const user = userEvent.setup()
    await renderWithEncounters("/library/npcs/makhotep")

    const id = "npc-encounter-guildRaid-GuildBoss1Boss1TyranTervigonLeviathan"
    await user.click(await screen.findByTestId(`${id}-toggle`))
    const npcs = screen.getByTestId(`${id}-npcs`)
    expect(npcs).toBeVisible()
    // A Guild Raid names no count.
    expect(
      within(npcs).queryByTestId("npc-encounter-count")
    ).not.toBeInTheDocument()
  })

  it("shows an Onslaught count as a ceiling", async () => {
    const user = userEvent.setup()
    await renderWithEncounters("/library/npcs/makhotep", [
      encounter("necroNpcWarden", "onslaught", "onslaught", [
        battle({ tier: 1, rounds: [1, 2], count: 3 }),
        battle({ tier: 2, rounds: [1], count: 5 }),
      ]),
    ])

    const id = "npc-encounter-onslaught-onslaught"
    await user.click(await screen.findByTestId(`${id}-toggle`))
    await user.click(screen.getByTestId(`${id}-place-2`))
    expect(
      within(screen.getByTestId(`${id}-place-2-npcs`)).getByTestId(
        "npc-encounter-count"
      )
    ).toHaveTextContent("up to 5")
  })

  it("stacks the encounter rows on mobile and wraps long text instead of overflowing", async () => {
    isMobileMock.value = true
    await renderWithEncounters("/library/npcs/makhotep")

    expect(await screen.findByTestId("npcs-mobile-page")).toBeVisible()
    const id = "npc-encounter-legendaryEvent-astarLysander"
    // Column on narrow screens; the row only goes horizontal from md (768px) up.
    await screen.findByTestId(id)
    expect(screen.getByTestId(`${id}-toggle`)).toHaveClass(
      "flex-col",
      "md:flex-row"
    )
    expect(screen.getByTestId(`${id}-location`)).toHaveClass(
      "min-w-0",
      "wrap-break-word"
    )
    expect(screen.getByTestId("npc-encounters")).toHaveClass("min-w-0")
  })
})
