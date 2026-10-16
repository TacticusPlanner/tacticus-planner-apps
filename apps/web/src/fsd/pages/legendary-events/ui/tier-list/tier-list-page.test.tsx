import { useEffect, useState } from "react"
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

import { hordeModeTiers } from "@/test/fixtures/horde-mode-tiers"
import { legendaryEventCharacters } from "@/test/fixtures/legendary-event-characters"
import { createTestI18n, i18nWrapper } from "@/test/i18n"
import { fireEvent, render, screen, waitFor, within } from "@/test/render"
import { setViewportWidth } from "@/test/viewport"

import { TierListPage } from "./tier-list-page"

vi.mock("dexie-react-hooks", () => ({
  useLiveQuery: <T,>(querier: () => Promise<T>, deps: unknown[]) => {
    const [value, setValue] = useState<T>()
    useEffect(() => {
      void querier().then(setValue)
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, deps)
    return value
  },
}))

const data = vi.hoisted(() => ({
  characters: [] as unknown[],
  charactersFail: false,
  charactersPending: false,
  charactersCalls: 0,
  tiers: null as unknown,
  roster: undefined as unknown[] | undefined,
  rosterFail: false,
}))
vi.mock("@workspace/game-catalog/queries", () => ({
  getCharacters: () => {
    data.charactersCalls += 1
    if (data.charactersPending) return new Promise(() => {})
    return data.charactersFail
      ? Promise.reject(new Error("catalog"))
      : Promise.resolve(data.characters)
  },
  getHordeModeTiers: () => Promise.resolve(data.tiers),
  getCharactersMap: async () => new Map(),
  getMowsMap: async () => new Map(),
}))
vi.mock("@workspace/player-data/queries", () => ({
  getPlayerCharacters: () =>
    data.rosterFail
      ? Promise.reject(new Error("player data"))
      : Promise.resolve(data.roster),
}))
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
    i18n = await createTestI18n("en")
  })
  beforeEach(() => {
    Object.assign(data, {
      characters: legendaryEventCharacters,
      charactersFail: false,
      charactersPending: false,
      charactersCalls: 0,
      tiers: hordeModeTiers,
      roster: [calgar],
      rosterFail: false,
    })
    analytics.captureEvent.mockReset()
    tour.steps = undefined
  })
  afterEach(() => {
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
          .slice(0, 4)
          .map((node) => node.textContent)
      ).toEqual(["S · 1.85×", "A · 1.55×", "B · 1.25×", "C · 1.05×"])
      const s = row("S")
      expect(s).toHaveAttribute("data-layout", isMobile ? "section" : "band")
      expect(tileNames(s)).toEqual([
        "Kariyan",
        "Isabella",
        "Sho'syl",
        "Bellator",
        "Aleph-Null",
        "Tan Gi'da",
      ])
      expect(
        within(s)
          .getAllByTestId("tier-tile-multiplier")
          .map((node) => node.textContent)
      ).toEqual(["2.0×", "1.95×", "1.9×", "1.85×", "1.8×", "1.75×"])
      expect(
        within(s)
          .getAllByTestId("tier-list-tile")
          .map((node) => node.dataset.overridden)
      ).toEqual(["true", "true", "true", "false", "true", "true"])
      expect(
        within(tileOf(s, "Bellator")).queryByTestId("tier-tile-override")
      ).toBeNull()
      expect(
        within(tileOf(s, "Kariyan")).getByTestId("tier-tile-override")
      ).toBeInTheDocument()
    })

    it("shows the tier multiplier without an override mark for a character with no multiplier", async () => {
      data.tiers = {
        ...hordeModeTiers,
        characters: hordeModeTiers.characters.map((entry) =>
          entry.unitId === "blackPossession"
            ? { unitId: entry.unitId, tier: entry.tier }
            : entry
        ),
      }
      renderPage()
      await ready()

      const tile = within(row("B"))
        .getAllByTestId("tier-list-tile")
        .find((node) => node.dataset.unitId === "blackPossession")!
      expect(
        within(tile).getByTestId("tier-tile-multiplier")
      ).toHaveTextContent(/^1\.25×$/)
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
      // The fixture catalog has 118 characters, 21 of them tiered.
      expect(
        within(untiered).getByTestId("tier-list-untiered-count")
      ).toHaveTextContent("97")
      expect(within(untiered).queryAllByTestId("tier-list-tile")).toHaveLength(
        0
      )

      fireEvent.click(toggle)
      expect(toggle).toHaveAttribute("aria-expanded", "true")
      const names = tileNames(untiered) as string[]
      expect(names).toHaveLength(97)
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
      expect(tileNames(row("S"))).toEqual(["Sho'syl", "Aleph-Null"])
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
        "1.85×"
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
      data.roster = [
        calgar,
        {
          unitId: "ultraInceptorSgt",
          rank: "Diamond1",
          progressionIndex: "Legendary:RedFiveStars",
        },
      ]
      renderPage()
      await ready()

      fireEvent.click(tileOf(row("S"), "Bellator"))

      const details = within(await screen.findByTestId("tier-tile-details"))
      expect(details.queryByTestId("tier-detail-tier-default")).toBeNull()
      const owned = details.getByTestId("tier-detail-owned")
      expect(
        within(owned).getByRole("img", { name: "Legendary" })
      ).toBeVisible()
      expect(owned).toHaveTextContent("Diamond I")
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
      expect(analytics.captureEvent).toHaveBeenCalledWith({
        type: "legendary_event_tier_list_unit_opened",
        unitId: first!.dataset.unitId,
        tier: "untiered",
      })
    })

    it("shows 'Tier list not available yet' and no Untiered row when the dataset is absent", async () => {
      data.tiers = null
      renderPage()

      expect(
        await screen.findByTestId("tier-list-unavailable")
      ).toHaveTextContent("Tier list not available yet")
      expect(screen.queryByTestId("tier-list-untiered")).toBeNull()
      expect(screen.queryByTestId("tier-list-row-S")).toBeNull()
    })

    it("disables Only owned with 'Sync your roster' and leaves tiles unmuted when the roster is unknown", async () => {
      data.rosterFail = true
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
      expect(tileNames(row("S"))).toHaveLength(6)
      for (const tile of screen.getAllByTestId("tier-list-tile")) {
        expect(tile).toHaveAttribute("data-muted", "false")
      }
    })

    it("treats a never-synced roster as unknown", async () => {
      data.roster = undefined
      renderPage()
      await ready()

      openFilters()
      expect(
        await screen.findByTestId("tier-list-roster-unknown")
      ).toBeInTheDocument()
      expect(screen.getByTestId("tier-list-only-owned")).toBeDisabled()
    })

    it("shows skeleton rows while the catalog loads", () => {
      data.charactersPending = true
      renderPage()

      expect(screen.getByTestId("tier-list-loading")).toBeInTheDocument()
      expect(screen.queryByTestId("tier-list-row-S")).toBeNull()
    })

    it("shows the error with Retry when the catalog read fails, and Retry re-issues it", async () => {
      data.charactersFail = true
      renderPage()
      const error = await screen.findByTestId("tier-list-error")
      expect(error).toHaveTextContent("Couldn't load the tier list.")
      const callsBefore = data.charactersCalls

      data.charactersFail = false
      fireEvent.click(within(error).getByRole("button", { name: "Retry" }))

      await ready()
      expect(data.charactersCalls).toBeGreaterThan(callsBefore)
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
      expect(tileNames(row("S"))).toHaveLength(6)
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
