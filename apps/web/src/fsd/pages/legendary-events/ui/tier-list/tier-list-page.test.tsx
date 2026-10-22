import { useState, useSyncExternalStore } from "react"
import { MemoryRouter, Route, Routes, useLocation } from "react-router"
import type { i18n as I18n } from "i18next"
import {
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest"

import enEquipmentItems from "../../../../../../public/locales/en/equipmentItems.json"
import { hordeModeTiers } from "@/test/fixtures/horde-mode-tiers"
import { spyOnIndexedDbReads } from "@/test/fixtures/indexeddb-failure"
import { legendaryEventCharacters } from "@/test/fixtures/legendary-event-characters"
import { createTestI18n, i18nWrapper } from "@/test/i18n"
import { fireEvent, render, screen, waitFor, within } from "@/test/render"
import {
  resetTestDatabases,
  seedGameCatalog,
  seedPlayerData,
} from "@/test/seed"
import { setViewportWidth } from "@/test/viewport"

import { TierListPage } from "./tier-list-page"

// While held, the roster read reports loading: a real IndexedDB read cannot be paused.
const rosterHold = vi.hoisted(() => {
  let held = false
  const listeners = new Set<() => void>()
  return {
    held: () => held,
    set(value: boolean) {
      held = value
      listeners.forEach((listener) => listener())
    },
    subscribe(listener: () => void) {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },
  }
})
// The catalog character read cannot fail on its own in IndexedDB: `useUnitName` reads the same
// store, and an unguarded failure there would take the whole page down. Set before render, a
// failure latches for that mount until Retry, which re-issues the real read (counted in
// `reissued`: Dexie's live-query cache may answer it without a store read).
const unitsFailure = vi.hoisted(() => ({ next: false, reissued: 0 }))
vi.mock("@/entities/legendary-event", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/entities/legendary-event")>()
  return {
    ...actual,
    useLegendaryEventRoster: () => {
      const held = useSyncExternalStore(rosterHold.subscribe, rosterHold.held)
      const read = actual.useLegendaryEventRoster()
      return held ? { status: "loading" as const, retry: read.retry } : read
    },
    useLegendaryEventUnits: () => {
      const [failed, setFailed] = useState(() => unitsFailure.next)
      const read = actual.useLegendaryEventUnits()
      if (!failed) return read
      return {
        status: "error" as const,
        retry: () => {
          setFailed(unitsFailure.next)
          unitsFailure.reissued += 1
          read.retry()
        },
      }
    },
  }
})
const tour = vi.hoisted(() => ({ steps: undefined as unknown }))
vi.mock("@/shared/tour", () => ({
  useTourPageSteps: (steps: unknown) => {
    tour.steps = steps
  },
}))
const analytics = vi.hoisted(() => ({ captureEvent: vi.fn() }))
vi.mock("@/shared/analytics", () => ({
  useAnalyticsActions: () => analytics,
}))

const calgar = {
  unitId: "ultraCalgar",
  rank: "Gold1",
  progressionIndex: "Legendary:RedFourStars",
}

let i18n: I18n
let reads: ReturnType<typeof spyOnIndexedDbReads>

const seedCatalog = (tiers: unknown = hordeModeTiers) =>
  seedGameCatalog({
    characters: legendaryEventCharacters,
    ...(tiers ? { "horde-mode-tiers": [tiers] } : {}),
  })
const seedRoster = (roster: unknown[]) => seedPlayerData({ characters: roster })

function LocationProbe() {
  const { search } = useLocation()
  return <span data-testid="search">{search}</span>
}

function renderPage(entry = "/legendary-events/tier-list") {
  return render(
    <MemoryRouter initialEntries={[entry]}>
      <LocationProbe />
      <Routes>
        <Route element={<TierListPage />} path="/legendary-events/tier-list" />
        <Route
          element={<div data-testid="library-page" />}
          path="/library/characters/:id"
        />
      </Routes>
    </MemoryRouter>,
    { wrapper: i18nWrapper(i18n) }
  )
}

const ready = () => screen.findByTestId("tier-list")
const row = (tier: string) => screen.getByTestId(`tier-list-row-${tier}`)
const tileNames = (container: HTMLElement) =>
  within(container)
    .queryAllByTestId("tier-tile-name")
    .map((node) => node.textContent)
const tileOf = (container: HTMLElement, name: string) => {
  const tile = within(container)
    .getAllByTestId("tier-list-tile")
    .find(
      (node) => within(node).getByTestId("tier-tile-name").textContent === name
    )
  if (!tile) throw new Error(`No tile ${name}`)
  return tile
}

const FORMS = [
  { form: "desktop", width: 1280 },
  { form: "mobile", width: 390 },
] as const

describe("TierListPage", () => {
  beforeAll(async () => {
    i18n = await createTestI18n("en", {
      en: { equipmentItems: enEquipmentItems },
    })
  })
  beforeEach(async () => {
    await seedCatalog()
    await seedRoster([calgar])
    reads = spyOnIndexedDbReads()
    rosterHold.set(false)
    Object.assign(unitsFailure, { next: false, reissued: 0 })
    analytics.captureEvent.mockReset()
    tour.steps = undefined
  })
  afterEach(() => {
    reads.restore()
    vi.unstubAllGlobals()
  })

  describe.each(FORMS)("$form form", ({ form, width }) => {
    const isMobile = form === "mobile"
    beforeEach(() => setViewportWidth(width))

    /** On mobile the Only owned switch and the alliance filter sit in the Filters sheet. */
    const openFilters = () => {
      if (isMobile) fireEvent.click(screen.getByTestId("tier-list-filters"))
    }

    it("renders tier S of the worked example in order, with the override marks", async () => {
      renderPage()
      await ready()

      expect(
        screen
          .getAllByTestId("tier-list-row-label")
          .slice(0, 5)
          .map((node) => node.textContent)
      ).toEqual(["S · 1.9×", "A · 1.7×", "B · 1.45×", "C · 1.2×", "D · 1.0×"])
      const s = row("S")
      expect(s).toHaveAttribute("data-layout", isMobile ? "section" : "band")
      expect(tileNames(s)).toEqual([
        "Kariyan",
        "Isabella",
        "Nauseous",
        "Aleph-Null",
        "Re'vas",
        "Maladus",
        "Tyrant Guard",
        "Tan Gi'da",
        "Snotflogga",
        "Jaeger",
      ])
      expect(
        within(s)
          .getAllByTestId("tier-tile-multiplier")
          .map((node) => node.textContent)
      ).toEqual([
        "2.0×",
        "1.98×",
        "1.96×",
        "1.94×",
        "1.92×",
        "1.9×",
        "1.88×",
        "1.86×",
        "1.83×",
        "1.81×",
      ])
      expect(
        within(s)
          .getAllByTestId("tier-list-tile")
          .map((node) => node.dataset.overridden)
      ).toEqual([
        "true",
        "true",
        "true",
        "true",
        "true",
        "false",
        "true",
        "true",
        "true",
        "true",
      ])
      expect(
        within(tileOf(s, "Maladus")).queryByTestId("tier-tile-override")
      ).toBeNull()
      expect(
        within(tileOf(s, "Kariyan")).getByTestId("tier-tile-override")
      ).toBeInTheDocument()
    })

    it("shows the tier multiplier without an override mark for a character with no multiplier", async () => {
      await seedCatalog({
        ...hordeModeTiers,
        characters: hordeModeTiers.characters.map((entry) =>
          entry.unitId === "blackPossession"
            ? { unitId: entry.unitId, tier: entry.tier }
            : entry
        ),
      })
      renderPage()
      await ready()

      const tile = within(row("B"))
        .getAllByTestId("tier-list-tile")
        .find((node) => node.dataset.unitId === "blackPossession")!
      expect(
        within(tile).getByTestId("tier-tile-multiplier")
      ).toHaveTextContent(/^1\.45×$/)
      expect(tile).toHaveAttribute("data-overridden", "false")
      expect(within(tile).queryByTestId("tier-tile-override")).toBeNull()
    })

    it("collapses Untiered with its count and lists it by name when opened", async () => {
      renderPage()
      await ready()

      const untiered = screen.getByTestId("tier-list-untiered")
      const toggle = within(untiered).getByTestId("tier-list-untiered-toggle")
      expect(toggle).toHaveAttribute("aria-expanded", "false")
      expect(toggle).toHaveTextContent("Untiered · 1.0×")
      // The fixture catalog has 118 characters, 47 of them tiered.
      expect(
        within(untiered).getByTestId("tier-list-untiered-count")
      ).toHaveTextContent("71")
      expect(within(untiered).queryAllByTestId("tier-list-tile")).toHaveLength(
        0
      )

      fireEvent.click(toggle)
      expect(toggle).toHaveAttribute("aria-expanded", "true")
      const names = tileNames(untiered) as string[]
      expect(names).toHaveLength(71)
      expect(names).toEqual(names.toSorted((a, b) => a.localeCompare(b, "en")))
      for (const tile of within(untiered).getAllByTestId("tier-list-tile")) {
        expect(
          within(tile).getByTestId("tier-tile-multiplier")
        ).toHaveTextContent(/^1\.0×$/)
      }
    })

    it("mutes unowned tiles and hides them with Only owned, writing owned=1", async () => {
      renderPage()
      await ready()

      expect(tileOf(row("S"), "Kariyan")).toHaveAttribute("data-muted", "true")
      expect(tileOf(row("A"), "Calgar")).toHaveAttribute("data-muted", "false")

      openFilters()
      fireEvent.click(screen.getByTestId("tier-list-only-owned"))

      await waitFor(() =>
        expect(screen.getByTestId("search")).toHaveTextContent("owned=1")
      )
      expect(tileNames(row("A"))).toEqual(["Calgar"])
      expect(tileNames(row("S"))).toEqual([])
      expect(
        within(row("S")).getByTestId("tier-list-row-empty")
      ).toHaveTextContent("No character")
    })

    it("reads Only owned from the URL", async () => {
      renderPage("/legendary-events/tier-list?owned=1")
      await ready()

      await waitFor(() => expect(tileNames(row("S"))).toEqual([]))
      expect(tileNames(row("A"))).toEqual(["Calgar"])
      openFilters()
      expect(screen.getByTestId("tier-list-only-owned")).toBeChecked()
    })

    it("waits for the roster on an owned=1 link: loading with the switch on, never the unfiltered list", async () => {
      rosterHold.set(true)
      renderPage("/legendary-events/tier-list?owned=1")

      // The catalog is ready (the filters render) but the roster is not.
      await screen.findByTestId(
        isMobile ? "tier-list-filters" : "tier-list-only-owned"
      )
      expect(screen.getByTestId("tier-list-loading")).toBeInTheDocument()
      expect(screen.queryByTestId("tier-list")).toBeNull()
      expect(screen.queryAllByTestId("tier-list-tile")).toHaveLength(0)
      openFilters()
      expect(screen.getByTestId("tier-list-only-owned")).toBeChecked()

      rosterHold.set(false)
      await ready()
      expect(tileNames(row("S"))).toEqual([])
      expect(tileNames(row("A"))).toEqual(["Calgar"])
    })

    it("opens Untiered by itself when a search matches only untiered characters", async () => {
      renderPage()
      await ready()
      const toggle = screen.getByTestId("tier-list-untiered-toggle")
      expect(toggle).toHaveAttribute("aria-expanded", "false")

      fireEvent.change(screen.getByTestId("tier-list-search"), {
        target: { value: "dante" },
      })
      await waitFor(() =>
        expect(toggle).toHaveAttribute("aria-expanded", "true")
      )
      expect(tileNames(screen.getByTestId("tier-list-untiered"))).toEqual([
        "Dante",
      ])

      // The reader can still collapse it, and a search matching a tier leaves it closed.
      fireEvent.click(toggle)
      expect(toggle).toHaveAttribute("aria-expanded", "false")
      fireEvent.change(screen.getByTestId("tier-list-search"), {
        target: { value: "calg" },
      })
      await waitFor(() => expect(tileNames(row("A"))).toEqual(["Calgar"]))
      expect(toggle).toHaveAttribute("aria-expanded", "false")
    })

    it("keeps only Xenos characters when Xenos is picked", async () => {
      renderPage()
      await ready()

      openFilters()
      fireEvent.click(
        within(screen.getByTestId("tier-list-alliance")).getByRole("radio", {
          name: "Xenos",
        })
      )

      await waitFor(() =>
        expect(screen.getByTestId("search")).toHaveTextContent("alliance=xenos")
      )
      expect(tileNames(row("S"))).toEqual([
        "Aleph-Null",
        "Re'vas",
        "Tyrant Guard",
        "Snotflogga",
      ])
      expect(
        within(row("C")).getByTestId("tier-list-row-empty")
      ).toHaveTextContent("No character")
    })

    it("opens a tile's details with its tier, multipliers, owned state and Library link", async () => {
      renderPage()
      await ready()

      fireEvent.click(tileOf(row("S"), "Kariyan"))

      const container = await screen.findByTestId(
        isMobile ? "tier-tile-details-sheet" : "tier-tile-details-popover"
      )
      const details = within(container)
      expect(details.getByTestId("tier-detail-name")).toHaveTextContent(
        "Kariyan"
      )
      expect(details.getByTestId("tier-detail-tier")).toHaveTextContent("S")
      expect(details.getByTestId("tier-detail-multiplier")).toHaveTextContent(
        "2.0×"
      )
      expect(details.getByTestId("tier-detail-tier-default")).toHaveTextContent(
        "1.9×"
      )
      expect(details.getByTestId("tier-detail-owned")).toHaveTextContent(
        "Not unlocked"
      )
      expect(details.getByTestId("tier-detail-library-link")).toHaveAttribute(
        "href",
        "/library/characters/custoBladeChampion"
      )
      expect(analytics.captureEvent).toHaveBeenCalledWith({
        type: "legendary_event_tier_list_unit_opened",
        unitId: "custoBladeChampion",
        tier: "S",
      })

      fireEvent.click(details.getByTestId("tier-detail-library-link"))
      expect(screen.getByTestId("library-page")).toBeInTheDocument()
    })

    it("shows an owned character's rarity and rank, and no tier default without an override", async () => {
      await seedRoster([
        calgar,
        {
          unitId: "deathBlightlord",
          rank: "Diamond1",
          progressionIndex: "Legendary:RedFiveStars",
        },
      ])
      renderPage()
      await ready()

      fireEvent.click(tileOf(row("S"), "Maladus"))

      const details = within(await screen.findByTestId("tier-tile-details"))
      expect(details.queryByTestId("tier-detail-tier-default")).toBeNull()
      const owned = details.getByTestId("tier-detail-owned")
      expect(
        within(owned).getByRole("img", { name: "Legendary" })
      ).toBeVisible()
      expect(owned).toHaveTextContent("Diamond I")
    })

    it("marks a relic-rated tile and lists the relic as equipped in its details", async () => {
      await seedRoster([
        calgar,
        {
          unitId: "tauCrisis",
          rank: "Diamond1",
          progressionIndex: "Legendary:RedFiveStars",
          equippedItems: [
            {
              slotId: "relic",
              equipmentId: "R_Crit_Dw02AdvancedBurstCannon",
              level: 1,
            },
          ],
        },
      ])
      renderPage()
      await ready()

      const revas = tileOf(row("S"), "Re'vas")
      expect(
        within(revas).getByTestId("tier-tile-multiplier")
      ).toHaveTextContent("1.92×")
      expect(within(revas).getByTestId("tier-tile-relic")).toBeInTheDocument()
      expect(revas).toHaveAccessibleName(/Relic rating/)
      expect(
        within(tileOf(row("S"), "Kariyan")).queryByTestId("tier-tile-relic")
      ).toBeNull()

      fireEvent.click(revas)
      const details = within(await screen.findByTestId("tier-tile-details"))
      const relic = details.getByTestId("tier-detail-relic")
      expect(relic.parentElement).toHaveTextContent(
        "DW-02 Advanced Burst Cannon"
      )
      expect(relic).toHaveTextContent("1.98×")
      expect(
        within(relic).getByTestId("tier-detail-relic-equipped")
      ).toHaveTextContent("Equipped")
    })

    it("lists a relic without an equipped state when the roster is unknown", async () => {
      reads.fail("tacticus-planner-player-data/characters")
      renderPage()
      await ready()

      fireEvent.click(tileOf(row("S"), "Re'vas"))
      const details = within(await screen.findByTestId("tier-tile-details"))
      expect(details.getByTestId("tier-detail-relic")).toHaveTextContent(
        "1.98×"
      )
      expect(details.queryByTestId("tier-detail-relic-equipped")).toBeNull()
    })

    it("expands a tile's Strategy section with its text, teammates in order and relic advice", async () => {
      renderPage()
      await ready()

      fireEvent.click(tileOf(row("A"), "Angrax"))

      const details = within(await screen.findByTestId("tier-tile-details"))
      expect(details.queryByTestId("tier-strategy-content")).toBeNull()
      fireEvent.click(details.getByTestId("tier-strategy-toggle"))

      expect(details.getByTestId("tier-strategy-strengths")).toHaveTextContent(
        "clearing entire waves automatically"
      )
      expect(details.getByTestId("tier-strategy-how-to-use")).toHaveTextContent(
        "Deep Strike near enemy spawn points."
      )
      const teammates = details.getAllByTestId("tier-strategy-teammate")
      expect(teammates.map((link) => link.textContent)).toEqual([
        "Nauseous",
        "Wrask",
        "Abaddon",
      ])
      expect(teammates[0]).toHaveAttribute(
        "href",
        "/library/characters/deathRotbone"
      )
      expect(details.getByTestId("tier-strategy-relic")).toHaveTextContent(
        "Daemonflesh Plate"
      )
    })

    it("shows text without teammates for a character with no synergies", async () => {
      renderPage()
      await ready()

      fireEvent.click(tileOf(row("S"), "Kariyan"))

      const details = within(await screen.findByTestId("tier-tile-details"))
      fireEvent.click(details.getByTestId("tier-strategy-toggle"))
      expect(details.getByTestId("tier-strategy-strengths")).toBeVisible()
      expect(details.queryByTestId("tier-strategy-teammates")).toBeNull()
      expect(details.queryByTestId("tier-strategy-relic")).toBeNull()
    })

    it("records an untiered tile's opening as untiered", async () => {
      renderPage()
      await ready()

      const untiered = screen.getByTestId("tier-list-untiered")
      fireEvent.click(within(untiered).getByTestId("tier-list-untiered-toggle"))
      const [first] = within(untiered).getAllByTestId("tier-list-tile")
      fireEvent.click(first!)

      const details = within(await screen.findByTestId("tier-tile-details"))
      expect(details.getByTestId("tier-detail-tier")).toHaveTextContent(
        "Untiered"
      )
      expect(details.queryByTestId("tier-detail-tier-default")).toBeNull()
      expect(details.queryByTestId("tier-strategy")).toBeNull()
      expect(analytics.captureEvent).toHaveBeenCalledWith({
        type: "legendary_event_tier_list_unit_opened",
        unitId: first!.dataset.unitId,
        tier: "untiered",
      })
    })

    it("shows 'Tier list not available yet' and no Untiered row when the dataset is absent", async () => {
      await resetTestDatabases()
      await seedCatalog(null)
      await seedRoster([calgar])
      renderPage()

      expect(
        await screen.findByTestId("tier-list-unavailable")
      ).toHaveTextContent("Tier list not available yet")
      expect(screen.queryByTestId("tier-list-untiered")).toBeNull()
      expect(screen.queryByTestId("tier-list-row-S")).toBeNull()
    })

    it("disables Only owned with 'Sync your roster' and leaves tiles unmuted when the roster is unknown", async () => {
      reads.fail("tacticus-planner-player-data/characters")
      renderPage("/legendary-events/tier-list?owned=1")
      await ready()

      await waitFor(() => {
        openFilters()
        expect(
          screen.getByTestId("tier-list-roster-unknown")
        ).toHaveTextContent("Sync your roster")
      })
      const onlyOwned = screen.getByTestId("tier-list-only-owned")
      expect(onlyOwned).toBeDisabled()
      expect(onlyOwned).not.toBeChecked()
      // owned=1 is ignored while ownership is unknown.
      expect(tileNames(row("S"))).toHaveLength(10)
      for (const tile of screen.getAllByTestId("tier-list-tile")) {
        expect(tile).toHaveAttribute("data-muted", "false")
      }
    })

    it("treats a never-synced roster as unknown", async () => {
      // No characters chunk has synced.
      await resetTestDatabases()
      await seedCatalog()
      renderPage()
      await ready()

      openFilters()
      expect(
        await screen.findByTestId("tier-list-roster-unknown")
      ).toBeInTheDocument()
      expect(screen.getByTestId("tier-list-only-owned")).toBeDisabled()
    })

    it("shows skeleton rows while the catalog loads", () => {
      // The first render precedes the asynchronous catalog read.
      renderPage()

      expect(screen.getByTestId("tier-list-loading")).toBeInTheDocument()
      expect(screen.queryByTestId("tier-list-row-S")).toBeNull()
    })

    it("shows the error with Retry when the catalog read fails, and Retry re-issues it", async () => {
      unitsFailure.next = true
      renderPage()
      const error = await screen.findByTestId("tier-list-error")
      expect(error).toHaveTextContent("Couldn't load the tier list.")
      const callsBefore = unitsFailure.reissued

      unitsFailure.next = false
      fireEvent.click(within(error).getByRole("button", { name: "Retry" }))

      await ready()
      expect(unitsFailure.reissued).toBeGreaterThan(callsBefore)
    })

    it("shows 'No character matches' with Clear filters when nothing is left", async () => {
      renderPage("/legendary-events/tier-list?q=zzz&alliance=chaos")
      const empty = await screen.findByTestId("tier-list-no-match")
      expect(empty).toHaveTextContent("No character matches")

      fireEvent.click(
        within(empty).getByRole("button", { name: "Clear filters" })
      )

      await ready()
      expect(screen.getByTestId("search")).toHaveTextContent(/^$/)
      expect(tileNames(row("S"))).toHaveLength(10)
    })

    it("filters every row by name, Untiered included", async () => {
      renderPage()
      await ready()

      fireEvent.change(screen.getByTestId("tier-list-search"), {
        target: { value: "calg" },
      })

      await waitFor(() =>
        expect(screen.getByTestId("search")).toHaveTextContent("q=calg")
      )
      expect(tileNames(row("A"))).toEqual(["Calgar"])
      expect(tileNames(row("S"))).toEqual([])
      expect(
        within(screen.getByTestId("tier-list-untiered")).getByTestId(
          "tier-list-untiered-count"
        )
      ).toHaveTextContent("0")
    })

    it("records the page view once", async () => {
      renderPage()
      await ready()
      // Filter changes re-render the page without a new view.
      fireEvent.change(screen.getByTestId("tier-list-search"), {
        target: { value: "kar" },
      })
      await waitFor(() => expect(tileNames(row("S"))).toEqual(["Kariyan"]))

      const views = analytics.captureEvent.mock.calls.filter(
        ([event]) =>
          (event as { type: string }).type ===
          "legendary_event_tier_list_viewed"
      )
      expect(views).toHaveLength(1)
    })

    it("registers the tour: S row, first tile, filters, each rendered", async () => {
      renderPage()
      await ready()

      const steps = tour.steps as {
        desktop: { target: string }[]
        mobile: { target: string }[]
      }
      for (const list of [steps.desktop, steps.mobile]) {
        expect(list.map((step) => step.target)).toEqual([
          '[data-testid="tier-list-row-S"]',
          '[data-testid="tier-list-first-tile"]',
          '[data-testid="tier-list-filters"]',
        ])
      }
      const current = isMobile ? steps.mobile : steps.desktop
      for (const step of current) {
        expect(document.querySelector(step.target)).not.toBeNull()
      }
      expect(
        within(
          document.querySelector<HTMLElement>(
            '[data-testid="tier-list-first-tile"]'
          )!
        ).getByTestId("tier-tile-name")
      ).toHaveTextContent("Kariyan")
      const filters = document.querySelector(
        '[data-testid="tier-list-filters"]'
      )!
      expect(filters.tagName).toBe(isMobile ? "BUTTON" : "DIV")
    })
  })

  describe("tour without rendered rows", () => {
    it("leaves out the row and tile steps when the filters match nothing", async () => {
      renderPage("/legendary-events/tier-list?q=zzz")
      await screen.findByTestId("tier-list-no-match")

      const steps = tour.steps as {
        desktop: { target: string }[]
        mobile: { target: string }[]
      }
      for (const list of [steps.desktop, steps.mobile]) {
        expect(list.map((step) => step.target)).toEqual([
          '[data-testid="tier-list-filters"]',
        ])
        for (const step of list) {
          expect(document.querySelector(step.target)).not.toBeNull()
        }
      }
    })
  })

  describe("layout", () => {
    it("lays tiers out as bands with a fixed-width coloured label cell at 1280px", async () => {
      setViewportWidth(1280)
      renderPage()
      await ready()

      const label = within(row("S")).getByTestId("tier-list-row-label")
      expect(label).toHaveClass("w-24", "bg-chart-4/20")
      expect(within(row("S")).getByTestId("tier-list-tiles")).toHaveClass(
        "flex-wrap"
      )
      // Search, Only owned and alliance share one row.
      const filters = screen.getByTestId("tier-list-filters")
      expect(within(filters).getByTestId("tier-list-search")).toBeVisible()
      expect(within(filters).getByTestId("tier-list-only-owned")).toBeVisible()
      expect(within(filters).getByTestId("tier-list-alliance")).toBeVisible()
    })

    it("marks the selected alliance chip with the thick primary border, tint and checked state", async () => {
      setViewportWidth(1280)
      renderPage("/legendary-events/tier-list?alliance=chaos")
      await ready()

      const alliance = screen.getByTestId("tier-list-alliance")
      const chaos = within(alliance).getByRole("radio", { name: "Chaos" })
      expect(chaos).toHaveAttribute("data-state", "on")
      expect(chaos).toHaveAttribute("aria-checked", "true")
      expect(chaos).toHaveClass(
        "data-[state=on]:border-2",
        "data-[state=on]:border-primary",
        "data-[state=on]:bg-primary/10"
      )
      for (const name of ["All", "Imperial", "Xenos"]) {
        expect(within(alliance).getByRole("radio", { name })).toHaveAttribute(
          "aria-checked",
          "false"
        )
      }
    })

    it("stacks full-width sections with a four-column grid and 44px tiles at 390px", async () => {
      setViewportWidth(390)
      const { container } = renderPage()
      await ready()

      expect(within(row("S")).getByTestId("tier-list-tiles")).toHaveClass(
        "grid",
        "grid-cols-4"
      )
      for (const tile of within(row("S")).getAllByTestId("tier-list-tile")) {
        expect(tile).toHaveClass("min-h-11", "min-w-0")
        expect(within(tile).getByTestId("tier-tile-name")).toHaveClass(
          "truncate"
        )
      }
      // Only owned and alliance live in the Filters sheet.
      expect(screen.queryByTestId("tier-list-only-owned")).toBeNull()
      expect(container.querySelector('[class*="overflow-x"]')).toBeNull()
      expect(container.querySelector('[class*="min-w-["]')).toBeNull()
    })
  })
})
