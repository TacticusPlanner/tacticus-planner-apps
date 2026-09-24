import { useEffect, useState } from "react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MemoryRouter, Route, Routes, useLocation } from "react-router"

import { render } from "@/test/render"

import type { NpcRecord, NpcStatRow } from "@/entities/npc"

const { isMobileMock, useIsMobileMock } = vi.hoisted(() => {
  const isMobileMock = { value: false }
  const useIsMobileMock = vi.fn(() => isMobileMock.value)
  return { isMobileMock, useIsMobileMock }
})

vi.mock("@workspace/ui/hooks/use-mobile", () => ({
  useIsMobile: useIsMobileMock,
}))
vi.mock("@/shared/tour", () => ({ useTourPageSteps: () => {} }))

// Minimal stand-in for dexie-react-hooks' useLiveQuery (see raid-bosses-page.test.tsx).
vi.mock("dexie-react-hooks", () => ({
  useLiveQuery: (
    querier: () => unknown,
    deps: unknown[] = [],
    defaultResult?: unknown
  ) => {
    const [value, setValue] = useState<unknown>(defaultResult)
    useEffect(() => {
      const result = querier()
      if (result instanceof Promise) {
        let active = true
        void result.then((resolved) => {
          if (active) setValue(resolved)
        })
        return () => {
          active = false
        }
      }
      setValue(result)
      return undefined
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, deps)
    return value
  },
}))

const { getNpcsMock, metadataMock } = vi.hoisted(() => ({
  getNpcsMock: vi.fn(),
  metadataMock: vi.fn(),
}))
vi.mock("@workspace/game-catalog/queries", () => ({ getNpcs: getNpcsMock }))
vi.mock("@workspace/game-catalog", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@workspace/game-catalog")>()),
  getGameCatalogMetadata: metadataMock,
}))
const syncedMetadata = new Map([["npcs", { key: "npcs" }]])

// Resolve i18n keys to the key itself (or the defaultValue) so assertions can match on keys.
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, unknown>) =>
      opts && Object.keys(opts).filter((k) => k !== "defaultValue").length
        ? `${key} ${JSON.stringify(opts)}`
        : ((opts?.defaultValue as string) ?? key),
    i18n: {
      exists: (key: string) => key.startsWith("abilities:"),
      language: "en",
      // No rules text in this fixture: every ability renders as a plain chip.
      getResource: () => undefined,
    },
  }),
}))

import { NpcsPage } from "./npcs-page"

function Location() {
  const location = useLocation()
  return (
    <output data-testid="location">{`${location.pathname}${location.search}`}</output>
  )
}

function renderPage(entry: string) {
  return render(
    <MemoryRouter initialEntries={[entry]}>
      <Routes>
        <Route
          path="/library/npcs/:entityId?"
          element={
            <>
              <NpcsPage />
              <Location />
            </>
          }
        />
        <Route path="/library/characters" element={<p>characters</p>} />
      </Routes>
    </MemoryRouter>
  )
}

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
    getNpcsMock.mockReset()
    getNpcsMock.mockResolvedValue(dataset)
    metadataMock.mockReset()
    metadataMock.mockResolvedValue(syncedMetadata)
  })

  it("shows the loading state and does not redirect while the dataset loads", () => {
    getNpcsMock.mockReturnValue(new Promise(() => {}))
    renderPage("/library/npcs")

    expect(screen.getByText("library:loading")).toBeVisible()
    expect(location()).toBe("/library/npcs")
  })

  it("keeps a direct link while the first catalog sync is still running", async () => {
    // Cold catalog: the table is empty and no npcs metadata exists yet.
    getNpcsMock.mockResolvedValue([])
    metadataMock.mockResolvedValue(new Map())
    renderPage("/library/npcs/makhotep")

    expect(await screen.findByText("library:loading")).toBeVisible()
    await new Promise((resolve) => setTimeout(resolve, 50))
    expect(location()).toBe("/library/npcs/makhotep")
    expect(screen.queryByText("library:collections.noRecords")).toBeNull()
  })

  it("shows the no-records state only once the dataset has synced empty", async () => {
    getNpcsMock.mockResolvedValue([])
    renderPage("/library/npcs")

    expect(
      await screen.findByText("library:collections.noRecords")
    ).toBeVisible()
    expect(location()).toBe("/library/npcs")
  })

  it("shows a retry-able failure state when the dataset read throws", async () => {
    getNpcsMock.mockRejectedValueOnce(new Error("boom"))
    renderPage("/library/npcs")

    expect(await screen.findByTestId("npcs-load-failed")).toBeVisible()
    expect(location()).toBe("/library/npcs")
  })

  it("redirects the collection URL to the first listed NPC", async () => {
    renderPage("/library/npcs")

    await waitFor(() => expect(location()).toBe("/library/npcs/makhotep"))
    expect(screen.getByTestId("npc-name")).toHaveTextContent("Makhotep")
  })

  it("replaces an unknown group id with the first listed NPC", async () => {
    renderPage("/library/npcs/not-a-real-npc?variation=x")

    await waitFor(() =>
      expect(location()).toBe("/library/npcs/makhotep?variation=x")
    )
  })

  it("excludes Machines of War and loot objects from the list", async () => {
    renderPage("/library/npcs/makhotep")

    const list = await screen.findByTestId("npcs-list")
    const names = within(list)
      .getAllByRole("button")
      .map((tile) => tile.textContent)
    expect(names).toEqual(["Makhotep", "Imospekh", "Termagant", "Havoc"])
  })

  it("restores NPC, variation, and level from a direct link", async () => {
    renderPage("/library/npcs/makhotep?variation=necroBossWardenLHE&level=1")

    expect(await screen.findByTestId("npc-name")).toHaveTextContent("Makhotep")
    expect(screen.getByTestId("npcs-variation-select")).toHaveTextContent("lhe")
    // served index 1 of the LHE ladder is rank 18 / 13 stars, health 8000
    expect(screen.getByTestId("npc-stat-health")).toHaveTextContent(
      numberText(8000)
    )
    expect(location()).toBe(
      "/library/npcs/makhotep?variation=necroBossWardenLHE&level=1"
    )
  })

  it("selects the default variation and first level without writing them back to the URL", async () => {
    renderPage("/library/npcs/makhotep")

    expect(await screen.findByTestId("npc-name")).toHaveTextContent("Makhotep")
    expect(screen.getByTestId("npcs-variation-select")).toHaveTextContent(
      "standard"
    )
    // necroNpcWarden's first row in display order: rank 1 / 1 star, health 117
    expect(screen.getByTestId("npc-stat-health")).toHaveTextContent("117")
    expect(location()).toBe("/library/npcs/makhotep")
  })

  it("falls back to the default for an unknown variation, leaving the URL unchanged", async () => {
    renderPage("/library/npcs/makhotep?variation=doesNotExist")

    expect(await screen.findByTestId("npc-name")).toHaveTextContent("Makhotep")
    expect(screen.getByTestId("npc-stat-health")).toHaveTextContent("117")
    expect(location()).toBe("/library/npcs/makhotep?variation=doesNotExist")
  })

  it("falls back to the first level in display order for an out-of-range level", async () => {
    renderPage("/library/npcs/makhotep?variation=necroBossWarden&level=9")

    expect(await screen.findByTestId("npc-name")).toHaveTextContent("Makhotep")
    // necroBossWarden serves rank 2 first, but display order puts rank 1 / 2 stars (health 140) first
    expect(screen.getByTestId("npc-stat-health")).toHaveTextContent("140")
  })

  it("selecting another NPC drops variation and level", async () => {
    const user = userEvent.setup()
    renderPage("/library/npcs/makhotep?variation=necroBossWardenLHE&level=1")
    await screen.findByTestId("npc-name")

    await user.click(screen.getByTestId("npc-tile-imospekh"))

    await waitFor(() => expect(location()).toBe("/library/npcs/imospekh"))
    expect(screen.getByTestId("npc-name")).toHaveTextContent("Imospekh")
  })

  it("changing the variation replaces `variation` and drops `level`", async () => {
    const user = userEvent.setup()
    renderPage("/library/npcs/makhotep?variation=necroBossWardenLHE&level=1")
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
    renderPage("/library/npcs/havoc")
    await screen.findByTestId("npc-name")

    await user.click(screen.getByTestId("npcs-level-select"))
    const options = await screen.findAllByRole("option")
    expect(options).toHaveLength(3)
    expect(options[2]).toHaveTextContent(/library:npcs.healthAtLevel/)
    expect(options[2]).toHaveTextContent(numberText(1_729_700))
    await user.click(options[2])

    await waitFor(() => expect(location()).toBe("/library/npcs/havoc?level=2"))
    expect(screen.getByTestId("npc-stat-health")).toHaveTextContent(
      numberText(1_729_700)
    )
  })

  it("disables the variation selector for a single-variation NPC", async () => {
    renderPage("/library/npcs/termagant")

    expect(await screen.findByTestId("npc-name")).toHaveTextContent("Termagant")
    expect(screen.getByTestId("npcs-variation-select")).toBeDisabled()
    expect(screen.getByTestId("npc-attack-ranged")).toHaveTextContent(
      'library:npcs.attacks.range {"range":2}'
    )
  })

  it("lists the variation's abilities, unchanged by the selected level", async () => {
    const user = userEvent.setup()
    renderPage("/library/npcs/makhotep?variation=necroBossWarden")
    await screen.findByTestId("npc-name")

    expect(screen.getByTestId("npc-abilities-active")).toHaveTextContent(
      "AdaptiveStrategy"
    )
    expect(screen.getByTestId("npc-abilities-passive")).toHaveTextContent(
      "RelentlessMarch"
    )

    await user.click(screen.getByTestId("npcs-level-select"))
    const options = await screen.findAllByRole("option")
    await user.click(options[options.length - 1])

    await waitFor(() => expect(location()).toContain("level="))
    expect(screen.getByTestId("npc-abilities-active")).toHaveTextContent(
      "AdaptiveStrategy"
    )
  })

  it("renders no abilities section for a variation with none", async () => {
    renderPage("/library/npcs/havoc")
    await screen.findByTestId("npc-name")

    expect(screen.queryByTestId("npc-abilities")).toBeNull()
  })

  it("shows the empty-traits state and only a melee row for a plain unit", async () => {
    renderPage("/library/npcs/havoc")

    expect(await screen.findByTestId("npc-traits-empty")).toBeVisible()
    expect(screen.getByTestId("npc-attack-melee")).toBeVisible()
    expect(screen.queryByTestId("npc-attack-ranged")).not.toBeInTheDocument()
  })

  it("filters the list by search without touching the selected URL", async () => {
    const user = userEvent.setup()
    renderPage("/library/npcs/makhotep")
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
    renderPage("/library/npcs/makhotep")
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
    getNpcsMock.mockResolvedValue([
      ...makhotepRecords.map((r) =>
        r.id === "necroNpcWarden"
          ? { ...r, traits: ["LivingMetal", "Mechanical", "Boss"] }
          : r
      ),
      imospekh,
    ])
    renderPage("/library/npcs/makhotep?variation=necroBossWardenLHE&level=1")
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
    renderPage("/library/npcs/makhotep")
    await screen.findByTestId("npc-name")

    await openFilters(user)
    await user.click(screen.getByTestId("npcs-trait-filter"))
    await user.click(await screen.findByRole("option", { name: /Swarm/ }))

    expect(
      await screen.findByTestId("npcs-no-matching-variation")
    ).toBeVisible()
    expect(location()).toBe("/library/npcs/makhotep")
  })

  it("resets filters when the user leaves and returns", async () => {
    const user = userEvent.setup()
    const view = renderPage("/library/npcs/makhotep")
    await screen.findByTestId("npc-name")
    await openFilters(user)
    await user.type(screen.getByTestId("npcs-search"), "term")
    expect(
      within(screen.getByTestId("npcs-list")).getAllByRole("button")
    ).toHaveLength(1)

    view.unmount()
    renderPage("/library/npcs/makhotep")
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
      renderPage("/library/npcs/makhotep")
      await screen.findByTestId("npc-name")

      expect(screen.queryByTestId("npcs-list")).not.toBeInTheDocument()
      const combobox = within(screen.getByTestId("npcs-combobox")).getByRole(
        "combobox"
      )
      expect(combobox).toHaveTextContent("Makhotep")

      await user.click(combobox)
      await user.type(screen.getByPlaceholderText("npcs.selectNpc"), "makh")
      const options = await screen.findAllByRole("option")
      expect(options).toHaveLength(1)
      await user.click(options[0])

      await waitFor(() => expect(location()).toBe("/library/npcs/makhotep"))
    })

    it("stacks the detail with the compact stat grid and full-width selectors", async () => {
      renderPage("/library/npcs/makhotep")

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
    getNpcsMock.mockReset()
    getNpcsMock.mockResolvedValue(dataset)
    metadataMock.mockReset()
    metadataMock.mockResolvedValue(syncedMetadata)
  })

  it("marks the selected tile pressed and renders the list beside the detail", async () => {
    renderPage("/library/npcs/imospekh")
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
    renderPage("/library/npcs/makhotep")
    await screen.findByTestId("npc-name")

    // Search is usable without opening the panel, and is not counted as a filter.
    expect(screen.queryByTestId("npcs-filter-bar")).toBeNull()
    await user.type(screen.getByTestId("npcs-search"), "term")

    expect(
      within(screen.getByTestId("npcs-list")).getAllByRole("button")
    ).toHaveLength(1)
    expect(screen.getByTestId("npcs-filters-toggle")).toHaveTextContent(
      "npcs.filters"
    )
  })

  it("narrows by alliance and by attack type", async () => {
    const user = userEvent.setup()
    renderPage("/library/npcs/makhotep")
    await screen.findByTestId("npc-name")
    await openFilters(user)

    await user.click(screen.getByTestId("npcs-alliance-filter"))
    await user.click(await screen.findByRole("option", { name: /Xenos/ }))
    const afterAlliance = within(screen.getByTestId("npcs-list")).getAllByRole(
      "button"
    ).length
    expect(afterAlliance).toBeGreaterThan(0)

    await user.click(screen.getByTestId("npcs-attack-filter"))
    await user.click(
      await screen.findByRole("option", { name: /meleeOnly|Melee/ })
    )
    expect(screen.getByTestId("npcs-filters-toggle")).toHaveTextContent(
      '{"count":2}'
    )
  })

  it("clears one multi-select without touching the others", async () => {
    const user = userEvent.setup()
    renderPage("/library/npcs/makhotep")
    await screen.findByTestId("npc-name")
    await openFilters(user)

    await user.click(screen.getByTestId("npcs-damage-type-filter"))
    await user.click(await screen.findByRole("option", { name: "Gauss" }))
    await user.click(screen.getByTestId("npcs-trait-filter"))
    await user.click(await screen.findByRole("option", { name: "LivingMetal" }))
    expect(screen.getByTestId("npcs-filters-toggle")).toHaveTextContent(
      '{"count":2}'
    )

    await user.click(screen.getByTestId("npcs-damage-type-filter-clear"))

    // Only the damage-type facet is reset; the trait facet survives.
    expect(screen.getByTestId("npcs-filters-toggle")).toHaveTextContent(
      '{"count":1}'
    )
    expect(screen.queryByTestId("npcs-damage-type-filter-clear")).toBeNull()
    expect(screen.getByTestId("npcs-trait-filter-clear")).toBeVisible()
  })

  it("offers no blank damage-type option for a unit served without a damage profile", async () => {
    const user = userEvent.setup()
    getNpcsMock.mockResolvedValue([
      ...dataset,
      npcRecord("darkaNpc4Watcher", "Watcher", {
        factionId: "DarkAngels",
        meleeDamage: "",
        meleeHits: 0,
        traits: ["Immune"],
        stats: [statRow(0, 0, 50)],
      }),
    ])
    renderPage("/library/npcs/watcher")
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
    renderPage("/library/npcs/makhotep")
    await screen.findByTestId("npc-name")

    await openFilters(user)
    await user.click(screen.getByTestId("npcs-faction-filter"))
    await user.click(await screen.findByRole("option", { name: "Tyranids" }))
    expect(
      within(screen.getByTestId("npcs-list")).getAllByRole("button")
    ).toHaveLength(1)
    expect(screen.getByTestId("npcs-filters-toggle")).toHaveTextContent(
      '{"count":1}'
    )

    await user.click(screen.getByTestId("npcs-damage-type-filter"))
    await user.click(await screen.findByRole("option", { name: "Piercing" }))
    expect(screen.getByTestId("npcs-filters-toggle")).toHaveTextContent(
      '{"count":2}'
    )

    await user.click(screen.getByTestId("npcs-clear-filters"))
    expect(
      within(screen.getByTestId("npcs-list")).getAllByRole("button")
    ).toHaveLength(4)
    expect(screen.getByTestId("npcs-clear-filters")).toBeDisabled()
  })
})
