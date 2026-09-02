import { useEffect, useState } from "react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { act, fireEvent, render, screen, within } from "@testing-library/react"
import { MemoryRouter, Route, Routes } from "react-router"
import { TooltipProvider } from "@workspace/ui/components/tooltip"

// The page must work for unauthenticated users with no user data — it reads only the public catalog
// by default. Synced player data only ever *adds* a rank/progression prefill on character select
// (see "prefills from synced player data" below); every other test exercises the unauthenticated /
// no-data default path via these mocks' default return values.
vi.mock("@workspace/ui/hooks/use-mobile", () => ({ useIsMobile: () => false }))

// The page registers its own tour steps on mount - irrelevant to these tests, which don't render
// a TourProvider.
vi.mock("@/shared/tour", () => ({ useTourPageSteps: () => {} }))

// A minimal stand-in for dexie-react-hooks' real `useLiveQuery`: runs `querier()` on mount/deps
// change, returns `defaultResult` until it settles, and re-renders once it does — same contract as
// the real hook, just without any actual Dexie/IndexedDB involved. The page's own query fns below are
// mocked directly, so this only needs to handle "querier returns a plain value" (synchronous, no
// re-render needed) and "querier returns a promise" (one microtask later).
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

// rank/progressionIndex are already the catalog's own Rank/Progression string values on the
// synced chunk (see @workspace/player-data's schemas) — no numeric-index fixtures needed.
// appliedUpgradeSlots is optional here since only the "include my upgrades" tests need it —
// every other test never triggers that code path, so leaving it undefined is harmless. Unlike
// appliedUpgradeSlots, progressionIndex is NOT optional: the prefill effect always reads it
// (unconditionally, whenever playerCharacter is truthy) to seed progressionStart.
type PlayerUnitFixture = {
  unitId: string
  rank: string
  progressionIndex: string
  appliedUpgradeSlots?: number[]
}
type InventoryUpgradeFixture = { upgradeId: string; amount: number }

const { useIsAuthenticatedMock, playerChunkMocks, playerChunksMocks } =
  vi.hoisted(() => ({
    useIsAuthenticatedMock: vi.fn(() => false),
    playerChunkMocks: {
      // Always resolves via a real promise, matching `getPlayerCharacter`'s async signature — the
      // page's own code chains `.then()` on it, so this can't be a synchronous stand-in.
      characters: vi.fn<(id: string) => Promise<PlayerUnitFixture | undefined>>(
        () => Promise.resolve(undefined)
      ),
    },
    playerChunksMocks: {
      "inventory-upgrades": vi.fn<() => InventoryUpgradeFixture[] | undefined>(
        () => undefined
      ),
    },
  }))

vi.mock("@azure/msal-react", () => ({
  useIsAuthenticated: () => useIsAuthenticatedMock(),
}))

vi.mock("@workspace/player-data/queries", () => ({
  getPlayerCharacter: (id: string) => playerChunkMocks.characters(id),
  getInventoryUpgrades: () => playerChunksMocks["inventory-upgrades"](),
}))

// Exact-match overrides for keys the code looks up without a `defaultValue` (campaign name/
// difficulty display text now lives only in i18n JSON — see public/locales/en/campaigns.json —
// so this small in-test dictionary stands in for that file, kept in sync with its content for
// the fixtures used below).
const translations: Record<string, string> = {
  "campaigns:names.indomitus": "Indomitus",
  "campaigns:names.death-guard-vs-admech": "Adeptus Mechanicus",
  "campaigns:difficulties.standard": "Standard",
  "campaigns:difficulties.elite": "Elite",
  "campaigns:codes.standard": "S",
  "campaigns:codes.elite": "E",
  "campaigns:codes.eventStandard": "S",
  "campaigns:codes.eventExtremis": "Ext",
  "campaigns:codes.mirror": "M",
}

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, opts?: { defaultValue?: string }) =>
      translations[key] ?? opts?.defaultValue ?? key,
  }),
}))

const records: Record<string, unknown[]> = {
  characters: [
    {
      id: "hero1",
      name: "Hero One",
      faction: "Ultramarines",
      alliance: "Imperial",
      health: 100,
      damage: 20,
      armour: 10,
      meleeDamage: "Physical",
      meleeHits: 3,
      rangedDamage: null,
      rangedHits: null,
      rangeDistance: null,
      movement: 4,
      traits: ["Healer"],
      activeAbilityDamage: [],
      passiveAbilityDamage: [],
      equipmentSlots: ["I_Crit"],
      rankUpUpgrades: [
        {
          rank: "Stone1",
          upgradeIds: ["h1", "h2", "d1", "d2", "a1", "a2", "l1"],
        },
        { rank: "Stone2", upgradeIds: ["h3"] },
      ],
    },
    {
      id: "hero2",
      name: "Hero Two",
      faction: "Ultramarines",
      alliance: "Imperial",
      health: 200,
      damage: 40,
      armour: 20,
      meleeDamage: "Power",
      meleeHits: 2,
      rangedDamage: null,
      rangedHits: null,
      rangeDistance: null,
      movement: 5,
      traits: [],
      activeAbilityDamage: [],
      passiveAbilityDamage: [],
      equipmentSlots: [],
      rankUpUpgrades: [],
    },
  ],
  upgrades: [
    {
      id: "h1",
      label: "Health Base",
      rarity: "Common",
      stat: "Health",
      craftable: false,
      recipe: [],
      farmLocations: [
        {
          battleId: "STD01",
          guaranteed: true,
          effectiveRate: null,
          numerator: null,
          denominator: null,
        },
        {
          battleId: "STD02",
          guaranteed: false,
          effectiveRate: 0.2,
          numerator: null,
          denominator: null,
        },
      ],
    },
    {
      id: "h2",
      label: "Health Two",
      rarity: "Uncommon",
      stat: "Health",
      craftable: false,
      recipe: [],
      farmLocations: [],
    },
    {
      id: "d1",
      label: "Damage Base",
      rarity: "Common",
      stat: "Damage",
      craftable: false,
      recipe: [],
      farmLocations: [],
    },
    {
      id: "d2",
      label: "Damage Two",
      rarity: "Common",
      stat: "Damage",
      craftable: false,
      recipe: [],
      farmLocations: [],
    },
    {
      id: "a1",
      label: "Armour Base",
      rarity: "Rare",
      stat: "Armour",
      craftable: false,
      recipe: [],
      farmLocations: [
        {
          battleId: "EVT01",
          guaranteed: true,
          effectiveRate: null,
          numerator: null,
          denominator: null,
        },
        {
          battleId: "EVT02",
          guaranteed: false,
          effectiveRate: 0.5,
          numerator: null,
          denominator: null,
        },
      ],
    },
    {
      id: "a2",
      label: "Armour Two",
      rarity: "Common",
      stat: "Armour",
      craftable: false,
      recipe: [],
      farmLocations: [],
    },
    {
      id: "h3",
      label: "Point Five Upgrade",
      rarity: "Legendary",
      stat: "Health",
      craftable: false,
      recipe: [],
      farmLocations: [],
    },
    {
      id: "l1",
      label: "Legendary Base",
      rarity: "Legendary",
      stat: "Damage",
      craftable: false,
      recipe: [],
      farmLocations: [
        {
          battleId: "STD01",
          guaranteed: true,
          effectiveRate: null,
          numerator: null,
          denominator: null,
        },
      ],
    },
  ],
  "campaign-battles": [
    {
      id: "STD01",
      campaignGroupId: "campaign1",
      type: "Standard",
      challenge: false,
      nodeNumber: 3,
      energyCost: 6,
    },
    {
      id: "STD02",
      campaignGroupId: "campaign1",
      type: "Standard",
      challenge: false,
      nodeNumber: 7,
      energyCost: 6,
    },
    {
      id: "EVT01",
      campaignGroupId: "eventCampaign1",
      type: "Standard",
      challenge: false,
      nodeNumber: 5,
      energyCost: 5,
    },
    {
      id: "EVT02",
      campaignGroupId: "eventCampaign1",
      type: "Extremis",
      challenge: false,
      nodeNumber: 6,
      energyCost: 7,
    },
  ],
  "campaign-definitions": [
    { id: "campaign1", groupId: "campaign1", releaseType: "standard" },
    {
      id: "eventCampaign1",
      groupId: "eventCampaign1",
      releaseType: "event",
    },
  ],
}

vi.mock("@workspace/game-catalog/queries", () => ({
  getCharacters: () => records.characters ?? [],
  getCharactersMap: () =>
    new Map(
      (records.characters ?? []).map((c) => [(c as { id: string }).id, c])
    ),
  getUpgrades: () => records.upgrades ?? [],
  getCampaignBattles: () => records["campaign-battles"] ?? [],
  getCampaignDefinitions: () => records["campaign-definitions"] ?? [],
}))

import { CharacterLookupPage } from "./character-lookup-page"

function renderPage(initialEntries = ["/"]) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <TooltipProvider>
        <Routes>
          <Route
            path="/library/characters/:entityId?"
            element={<CharacterLookupPage />}
          />
          <Route path="*" element={<CharacterLookupPage />} />
        </Routes>
      </TooltipProvider>
    </MemoryRouter>
  )
}

describe("CharacterLookupPage", () => {
  beforeEach(() => {
    useIsAuthenticatedMock.mockReturnValue(false)
    playerChunkMocks.characters.mockResolvedValue(undefined)
    playerChunksMocks["inventory-upgrades"].mockReturnValue(undefined)
  })

  it("renders publicly and lists the required base upgrades for the default range", () => {
    renderPage()

    expect(screen.getByTestId("character-lookup-page")).toBeInTheDocument()
    // Default character + the Stone1 → Stone2 range surfaces that rank's upgrades as base
    // materials. Scoped to the table since the same labels may also appear in the Insights
    // top-upgrade-by-rarity chips above it.
    const table = within(screen.getByRole("table"))
    expect(table.getByText("Health Base")).toBeInTheDocument()
    expect(table.getByText("Armour Base")).toBeInTheDocument()
  })

  it("takes character identity from a direct Library entity path", () => {
    renderPage(["/library/characters/hero1?rankStart=Bronze1"])

    expect(
      screen.getByRole("combobox", { name: "unitLookup.characterPlaceholder" })
    ).toHaveTextContent("Hero One")
  })

  it("renders the unit profile with movement, melee hits, and current/target Health for the default character", () => {
    renderPage()

    const profile = within(screen.getByTestId("unit-profile"))
    expect(profile.getByText("Hero One")).toBeInTheDocument()
    expect(profile.getByText("4")).toBeInTheDocument() // movement
    expect(profile.getByText("3")).toBeInTheDocument() // melee hits
    // Health at Stone1 (current, 100 * 1.25205^0) and Stone2 (target, 100 * 1.25205^1), no progression.
    expect(profile.getByText("100")).toBeInTheDocument()
    expect(profile.getByText("125")).toBeInTheDocument()
  })

  it("computes current/target Health from independent from/to progression values", () => {
    renderPage(["/?progressionStart=Common:None&progressionEnd=Common:OneStar"])

    const profile = within(screen.getByTestId("unit-profile"))
    // Current: Stone1 at "None" progression → 100 (unchanged).
    expect(profile.getByText("100")).toBeInTheDocument()
    // Target: Stone2 at "OneStar" progression → floor(100 * 1.25205 * 1.1) = 137, not the 125
    // it would be if both ends shared a single progression value.
    expect(profile.getByText("137")).toBeInTheDocument()
    expect(profile.queryByText("125")).not.toBeInTheDocument()
  })

  it("clamps a rank down when its progression is lowered below what the rank requires", () => {
    // Diamond1 needs at least Legendary rarity; Mythic:MythicWings covers it, so it loads as-is
    // (selectionFromParams doesn't itself clamp — only the interactive setters do).
    renderPage([
      "/?rankStart=Stone1&rankEnd=Diamond1&progressionStart=Common:None&progressionEnd=Mythic:MythicWings",
    ])
    expect(screen.getByText("Diamond1")).toBeInTheDocument()

    // Selects, in DOM order: character combobox, progression "From", progression "To".
    const [, , progressionToTrigger] = screen.getAllByRole("combobox")
    fireEvent.click(progressionToTrigger)
    fireEvent.click(screen.getByRole("option", { name: /None/ }))

    // "To" progression is now Common:None, which only unlocks up to Iron1 — rankEnd is pulled
    // back down to it rather than staying at an unreachable Diamond1.
    expect(screen.queryByText("Diamond1")).not.toBeInTheDocument()
    expect(screen.getByText("Iron1")).toBeInTheDocument()
  })

  it("auto-applies immediately when a new character is selected, without needing Apply", () => {
    renderPage()

    const applyButton = screen.getByRole("button", { name: "unitLookup.apply" })
    expect(applyButton).toBeDisabled()
    expect(
      within(screen.getByTestId("unit-profile")).getByText("Hero One")
    ).toBeInTheDocument()

    fireEvent.click(
      screen.getByRole("combobox", { name: "unitLookup.characterPlaceholder" })
    )
    fireEvent.click(screen.getByText("Hero Two"))

    // Results update immediately for the newly selected character...
    expect(
      within(screen.getByTestId("unit-profile")).getByText("Hero Two")
    ).toBeInTheDocument()
    // ...and Apply stays disabled since nothing else is dirty.
    expect(applyButton).toBeDisabled()
  })

  it("prefills the 'from' rank from synced player data when authenticated", async () => {
    useIsAuthenticatedMock.mockReturnValue(true)
    playerChunkMocks.characters.mockImplementation((id) =>
      Promise.resolve(
        id === "hero2"
          ? {
              unitId: "hero2",
              rank: "Iron3",
              progressionIndex: "Rare:RedOneStar",
            }
          : undefined
      )
    )

    renderPage()
    await act(async () => {})

    fireEvent.click(
      screen.getByRole("combobox", { name: "unitLookup.characterPlaceholder" })
    )
    fireEvent.click(screen.getByText("Hero Two"))
    await act(async () => {})

    // "Iron3" is the synced unit's rank, not the firstRank ("Stone1") default. The range's "to"
    // also gets bumped up to match (it defaults below "from" otherwise), so both the "from" and
    // "to" badges read "Iron3" here.
    expect(screen.getAllByText("Iron3").length).toBeGreaterThan(0)
    expect(screen.queryByText("Stone1")).not.toBeInTheDocument()
    expect(screen.queryByText("Stone2")).not.toBeInTheDocument()
  })

  it("keeps the default 'from' rank when authenticated but the selected unit has no synced data", async () => {
    useIsAuthenticatedMock.mockReturnValue(true)
    // The synced chunk simply has no record for "hero2" — this is the single-record read's normal
    // "not found" outcome (`undefined`), the same shape the default mock already returns.
    playerChunkMocks.characters.mockResolvedValue(undefined)

    renderPage()
    await act(async () => {})

    fireEvent.click(
      screen.getByRole("combobox", { name: "unitLookup.characterPlaceholder" })
    )
    fireEvent.click(screen.getByText("Hero Two"))
    await act(async () => {})

    expect(screen.getByText("Stone1")).toBeInTheDocument()
  })

  it("gates recomputation behind the Apply button", () => {
    renderPage()

    // Stone2's upgrade only surfaces via the point-five toggle, which starts off.
    expect(screen.queryByText("Point Five Upgrade")).not.toBeInTheDocument()

    const applyButton = screen.getByRole("button", { name: "unitLookup.apply" })
    expect(applyButton).toBeDisabled()

    fireEvent.click(
      screen.getByRole("switch", { name: "unitLookup.pointFive" })
    )

    // Toggling the switch only edits the draft — results must not change yet.
    expect(screen.queryByText("Point Five Upgrade")).not.toBeInTheDocument()
    expect(applyButton).not.toBeDisabled()

    fireEvent.click(applyButton)

    // Scoped to the table since Legendary-rarity "Point Five Upgrade" also becomes the Insights
    // top-upgrade-by-rarity chip for Legendary once it's included.
    expect(
      within(screen.getByRole("table")).getByText("Point Five Upgrade")
    ).toBeInTheDocument()
    expect(applyButton).toBeDisabled()
  })

  it("renders a top-upgrade-by-rarity chip and ranked useful-campaign insights", () => {
    renderPage()

    // a1 (Rare) is the only base upgrade at that rarity for the default range, so its name shows
    // once in the insights chip and again in the base-upgrades table row.
    expect(screen.getAllByText("Armour Base")).toHaveLength(2)

    // h1 farms from Indomitus (standard, a regular campaign); a1 farms from the
    // death-guard-vs-admech event — each should surface in its own ranked insight list, by full
    // campaign name (distinct from the "Indomitus S 3, 7" short-code location chip text below).
    expect(screen.getByText("Indomitus Standard")).toBeInTheDocument()
    expect(screen.getByText("Adeptus Mechanicus")).toBeInTheDocument()
  })

  it("shows separate Standard/Extremis scores for an event insight merging both tiers", () => {
    renderPage()

    // a1 (Armour Base) drops from both EVT01 (eventStandard) and EVT02 (eventExtremis), so the
    // "Adeptus Mechanicus" event chip merges both tiers and should display two scores.
    const trigger = screen.getByRole("button", { name: /Adeptus Mechanicus/ })
    expect(within(trigger).getByText(/^S /)).toBeInTheDocument()
    expect(within(trigger).getByText(/^Ext /)).toBeInTheDocument()
  })

  it("lists multiple distinct locations for an upgrade without duplicating any", () => {
    renderPage()

    fireEvent.click(screen.getByRole("button", { name: /Adeptus Mechanicus/ }))

    const item = screen
      .getByText("Adeptus Mechanicus")
      .closest('[data-slot="accordion-item"]')
    expect(item).not.toBeNull()
    // Armour Base appears once (deduped) with both of its distinct locations listed.
    expect(
      within(item as HTMLElement).getAllByText(/Armour Base/)
    ).toHaveLength(1)
    expect(
      within(item as HTMLElement).getByText("Adeptus Mechanicus S 5")
    ).toBeInTheDocument()
    expect(
      within(item as HTMLElement).getByText("Adeptus Mechanicus Ext 6")
    ).toBeInTheDocument()
  })

  it("expands a campaign insight row to show the contributing upgrades and locations", () => {
    renderPage()

    fireEvent.click(screen.getByRole("button", { name: /Indomitus Standard/ }))

    // h1 (Health Base) drops from both STD01 and STD02, both grouped under this Indomitus
    // Standard chip — it should appear once (deduped), listing both locations.
    const item = screen
      .getByText("Indomitus Standard")
      .closest('[data-slot="accordion-item"]')
    expect(item).not.toBeNull()
    expect(
      within(item as HTMLElement).getAllByText(/Health Base/)
    ).toHaveLength(1)
    // "Indomitus S 3" (STD01) is shared by both Health Base and Legendary Base; "Indomitus S 7"
    // (STD02) belongs only to Health Base.
    expect(
      within(item as HTMLElement).getAllByText("Indomitus S 3")
    ).toHaveLength(2)
    expect(
      within(item as HTMLElement).getByText("Indomitus S 7")
    ).toBeInTheDocument()

    // Legendary Base (l1) also drops from STD01 in this chip. Rows are ordered Mythic → Common, so
    // the Legendary upgrade must precede the Common "Health Base" row, and no drop-chance
    // percentage should be shown.
    const rows = within(item as HTMLElement).getAllByText(/Base$/)
    expect(rows).toHaveLength(2)
    expect(rows[0].textContent).toContain("Legendary Base")
    expect(rows[1].textContent).toContain("Health Base")
    expect(within(item as HTMLElement).queryByText(/%/)).not.toBeInTheDocument()
  })

  it("scrolls to and highlights the matching base-upgrade row when a top-rarity chip is clicked", () => {
    renderPage()
    const scrollIntoView = window.HTMLElement.prototype
      .scrollIntoView as ReturnType<typeof vi.fn>
    scrollIntoView.mockClear()

    // The insight chip is rendered before the table, so it's the first "Armour Base" match.
    fireEvent.click(screen.getAllByText("Armour Base")[0])

    const targetRow = document.getElementById("base-upgrade-a1")
    expect(targetRow).not.toBeNull()
    expect(scrollIntoView).toHaveBeenCalledWith({
      behavior: "smooth",
      block: "center",
    })
    expect(scrollIntoView.mock.instances[0]).toBe(targetRow)
  })

  it("splits farm locations into campaign and campaign-event columns, labeled by campaign + short code + node numbers", () => {
    renderPage()

    // h1 farms from two nodes (3 and 7) on "indomitus"/"standard", a "standard"
    // campaign-definition, so it must land in the campaign column as a single chip listing both
    // node numbers, not the event column. Scoped to the table since the Insights chips above it
    // repeat the same upgrade labels.
    const table = within(screen.getByRole("table"))
    const healthRow = table.getByText("Health Base").closest("tr")
    expect(healthRow).not.toBeNull()
    expect(healthRow?.textContent).toContain("Indomitus S 3, 7")
    expect(healthRow?.textContent).not.toContain("Adeptus Mechanicus")

    // a1's location is on "death-guard-vs-admech"/"eventStandard" node 5, an "event"
    // campaign-definition, so the reverse must hold.
    const armourRow = table.getByText("Armour Base").closest("tr")
    expect(armourRow).not.toBeNull()
    expect(armourRow?.textContent).toContain("Adeptus Mechanicus S 5")
    expect(armourRow?.textContent).not.toContain("Indomitus")
  })

  describe("include my upgrades toggle", () => {
    it("is visible but disabled, and hides the Owned/Missing columns entirely, for unauthenticated users", () => {
      renderPage()

      const toggle = screen.getByRole("switch", {
        name: "unitLookup.includeOwnedUpgrades",
      })
      expect(toggle).toBeInTheDocument()
      expect(toggle).toBeDisabled()

      // Owned is always 0 and Missing always equals Count while signed out, so both columns are
      // dropped rather than showing that non-information — only Base Upgrade/Name/Count/Rarity/
      // locations remain.
      const row = within(screen.getByRole("table"))
        .getByText("Health Base")
        .closest("tr")
      const cells = within(row as HTMLElement).getAllByRole("cell")
      expect(cells).toHaveLength(6)
      expect(cells[2].textContent).toBe("1") // count
      expect(screen.queryByText("unitLookup.owned")).not.toBeInTheDocument()
      expect(screen.queryByText("unitLookup.missing")).not.toBeInTheDocument()
    })

    it("nets an owned inventory upgrade out of the owned/missing columns once enabled", async () => {
      useIsAuthenticatedMock.mockReturnValue(true)
      playerChunkMocks.characters.mockResolvedValue({
        unitId: "hero1",
        rank: "Stone1",
        progressionIndex: "Common:None",
        appliedUpgradeSlots: [],
      })
      playerChunksMocks["inventory-upgrades"].mockReturnValue([
        { upgradeId: "h1", amount: 1 },
      ])

      renderPage()
      await act(async () => {})

      const toggle = screen.getByRole("switch", {
        name: "unitLookup.includeOwnedUpgrades",
      })
      expect(toggle).not.toBeDisabled()

      fireEvent.click(toggle)

      const table = within(screen.getByRole("table"))

      // Health Base (h1): 1 needed, 1 owned in inventory → fully covered.
      const healthCells = within(
        table.getByText("Health Base").closest("tr") as HTMLElement
      ).getAllByRole("cell")
      expect(healthCells[3].textContent).toBe("1") // owned
      expect(healthCells[4].textContent).toBe("0") // missing

      // Damage Base (d1) has no owned inventory — unaffected.
      const damageCells = within(
        table.getByText("Damage Base").closest("tr") as HTMLElement
      ).getAllByRole("cell")
      expect(damageCells[3].textContent).toBe("0")
      expect(damageCells[4].textContent).toBe("1")
    })

    it("feeds owned-deducted counts into campaign insight contributions once enabled", async () => {
      useIsAuthenticatedMock.mockReturnValue(true)
      playerChunkMocks.characters.mockResolvedValue({
        unitId: "hero1",
        rank: "Stone1",
        progressionIndex: "Common:None",
        appliedUpgradeSlots: [],
      })
      playerChunksMocks["inventory-upgrades"].mockReturnValue([
        { upgradeId: "h1", amount: 1 },
      ])

      renderPage()
      await act(async () => {})
      fireEvent.click(
        screen.getByRole("switch", { name: "unitLookup.includeOwnedUpgrades" })
      )

      fireEvent.click(
        screen.getByRole("button", { name: /Indomitus Standard/ })
      )
      const item = screen
        .getByText("Indomitus Standard")
        .closest('[data-slot="accordion-item"]')
      expect(item).not.toBeNull()

      // Health Base (h1) is fully owned now — its contribution count is 0, not the raw 1 it'd
      // show with the toggle off.
      const healthRow = within(item as HTMLElement)
        .getByText(/Health Base/)
        .closest("span")
      expect(healthRow?.textContent).toContain("×0")
    })

    it("marks upgrades already applied to the character in the per-rank breakdown", async () => {
      useIsAuthenticatedMock.mockReturnValue(true)
      // hero1's rank matches the default range's start (Stone1) unchanged by the prefill, with
      // slot 0 of Stone1's own upgrades (h1 — index 0 of
      // ["h1","h2","d1","d2","a1","a2","l1"]) already applied in preparation for Stone2.
      playerChunkMocks.characters.mockResolvedValue({
        unitId: "hero1",
        rank: "Stone1",
        progressionIndex: "Common:None",
        appliedUpgradeSlots: [0],
      })

      renderPage()
      await act(async () => {})
      fireEvent.click(
        screen.getByRole("switch", { name: "unitLookup.includeOwnedUpgrades" })
      )

      expect(
        screen.getByRole("button", {
          name: "Health Base (unitLookup.alreadyApplied)",
        })
      ).toBeInTheDocument()
      // Damage Base (index 2) isn't one of the applied slots, so it stays unmarked.
      expect(
        screen.getByRole("button", { name: "Damage Base" })
      ).toBeInTheDocument()
    })
  })
})
