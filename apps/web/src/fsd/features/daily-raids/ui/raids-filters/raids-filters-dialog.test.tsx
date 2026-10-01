import { fireEvent, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { render, screen } from "@/test/render"

import { emptyRaidsFilters } from "../../model/raids-filters/raids-filters.domain"
import { useRaidsFilters } from "../../model/raids-filters/use-raids-filters"
import { RaidsFiltersTrigger } from "./raids-filters-trigger"

const { useIsMobileMock, catalog } = vi.hoisted(() => ({
  useIsMobileMock: vi.fn(() => false),
  catalog: {
    battles: undefined as unknown,
    characters: undefined as unknown,
    npcs: undefined as unknown,
  },
}))

vi.mock("react-i18next", () => ({
  initReactI18next: { type: "3rdParty", init: vi.fn() },
  useTranslation: () => ({
    t: (key: string, values?: Record<string, unknown>) =>
      values && "count" in values ? `${key}:${values.count}` : key,
  }),
}))
vi.mock("@workspace/ui/hooks/use-mobile", () => ({
  useIsMobile: () => useIsMobileMock(),
}))
vi.mock("@workspace/game-catalog/queries", () => ({
  getCampaignBattles: () => catalog.battles,
  getCharactersMap: () => catalog.characters,
  getNpcsMap: () => catalog.npcs,
}))
vi.mock("dexie-react-hooks", () => ({
  useLiveQuery: (querier: () => unknown) => querier(),
}))

const battle = (
  enemiesTotal: number,
  enemiesTypes: string[],
  enemyIds: string[] = []
) => ({
  enemiesTotal,
  enemiesTypes,
  detailedEnemyTypes: enemyIds.map((id) => ({ id, count: 1 })),
})

function Probe() {
  const [filters] = useRaidsFilters()
  return <output data-testid="applied">{JSON.stringify(filters)}</output>
}

function renderTrigger() {
  return render(
    <>
      <RaidsFiltersTrigger />
      <Probe />
    </>
  )
}
const applied = () =>
  JSON.parse(screen.getByTestId("applied").textContent ?? "{}")
const optionIds = () =>
  screen
    .getAllByRole("option")
    .map((option) => option.getAttribute("data-testid"))

async function open(testId: string) {
  fireEvent.click(await screen.findByTestId(testId))
}
const pick = (id: string) => fireEvent.click(screen.getByTestId(`option-${id}`))

describe("Raids Filters trigger and dialog", () => {
  beforeEach(() => {
    useIsMobileMock.mockReturnValue(false)
    catalog.battles = [
      battle(10, ["Grot"], ["bot"]),
      battle(4, ["Ork Boy", "Grot"], ["imp", "bot"]),
    ]
    catalog.npcs = new Map([
      ["bot", { traits: ["Mechanical", "Flying"] }],
      ["imp", { traits: ["Daemon", "PermaDeath"] }],
      ["unused", { traits: ["Healer"] }],
    ])
    catalog.characters = new Map([
      ["a", { faction: "Orks", alliance: "Xenos" }],
      ["b", { faction: "Necrons", alliance: "Xenos" }],
      ["c", { faction: "Ultramarines", alliance: "Imperial" }],
    ])
    window.localStorage.clear()
  })

  it("shows the label on desktop", () => {
    renderTrigger()
    expect(screen.getByTestId("raids-filters")).toHaveTextContent(
      "raidsFilters.trigger"
    )
  })

  it("is icon-only with an accessible name on mobile", () => {
    useIsMobileMock.mockReturnValue(true)
    renderTrigger()
    const mobile = screen.getByTestId("raids-filters")
    expect(mobile).toHaveAccessibleName("raidsFilters.trigger")
    expect(mobile).not.toHaveTextContent("raidsFilters.trigger")
  })

  it("renders the four sections in order with a Close, Reset and Apply footer", async () => {
    renderTrigger()
    const user = userEvent.setup()
    await user.click(screen.getByTestId("raids-filters"))

    const dialog = await screen.findByTestId("raids-filters-dialog")
    const headings = within(dialog)
      .getAllByRole("heading", { level: 3 })
      .map((heading) => heading.textContent)
    expect(headings).toEqual([
      "dailies:raidsFilters.sections.allies",
      "dailies:raidsFilters.sections.enemies",
      "dailies:raidsFilters.sections.locations",
      "dailies:raidsFilters.sections.upgrades",
    ])
    for (const id of ["close", "reset", "apply"]) {
      expect(screen.getByTestId(`raids-filters-${id}`)).toBeInTheDocument()
    }
  })

  it("keeps edits as a draft: Close discards, Apply writes, the badge counts groups", async () => {
    renderTrigger()
    const user = userEvent.setup()
    await user.click(screen.getByTestId("raids-filters"))
    await open("raids-filters-slots")
    pick("5")
    await user.keyboard("{Escape}")
    await user.click(screen.getByTestId("raids-filters-close"))
    expect(applied().slots).toEqual([])
    expect(screen.queryByTestId("raids-filters-badge")).toBeNull()

    // Reopening shows the applied (empty) values, not the discarded draft.
    await user.click(screen.getByTestId("raids-filters"))
    expect(screen.getByTestId("raids-filters-slots")).toHaveTextContent(
      "raidsFilters.placeholders.allSlots"
    )
    await open("raids-filters-slots")
    pick("5")
    await user.keyboard("{Escape}")
    await open("raids-filters-enemy-types")
    pick("Grot")
    await user.keyboard("{Escape}")
    await user.click(screen.getByTestId("raids-filters-apply"))

    expect(applied()).toMatchObject({ slots: [5], enemiesTypes: ["Grot"] })
    expect(screen.queryByTestId("raids-filters-dialog")).toBeNull()
    expect(screen.getByTestId("raids-filters-badge")).toHaveTextContent("2")
    expect(screen.getByTestId("raids-filters")).toHaveAccessibleName(
      "raidsFilters.triggerActive:2"
    )
  })

  it("Reset clears every applied field and closes", async () => {
    renderTrigger()
    const user = userEvent.setup()
    await user.click(screen.getByTestId("raids-filters"))
    await open("raids-filters-slots")
    pick("4")
    await user.keyboard("{Escape}")
    await user.click(screen.getByTestId("raids-filters-apply"))
    expect(applied().slots).toEqual([4])

    await user.click(screen.getByTestId("raids-filters"))
    await user.click(screen.getByTestId("raids-filters-reset"))
    expect(applied()).toEqual(emptyRaidsFilters)
    expect(screen.queryByTestId("raids-filters-dialog")).toBeNull()
    expect(screen.queryByTestId("raids-filters-badge")).toBeNull()
  })

  it("limits faction options to the alliances selected in the same group", async () => {
    renderTrigger()
    const user = userEvent.setup()
    await user.click(screen.getByTestId("raids-filters"))

    await open("raids-filters-enemies-alliances")
    pick("Xenos")
    await user.keyboard("{Escape}")

    await open("raids-filters-enemies-factions")
    expect(optionIds()).toContain("option-Orks")
    expect(optionIds()).toContain("option-Necrons")
    expect(optionIds()).not.toContain("option-Ultramarines")
    await user.keyboard("{Escape}")

    // The allies group is independent and still offers every faction.
    await open("raids-filters-allies-factions")
    expect(optionIds()).toContain("option-Ultramarines")
    expect(optionIds()).toContain("option-Orks")
  })

  it("offers Common to Mythic only: no shard rarities", async () => {
    renderTrigger()
    const user = userEvent.setup()
    await user.click(screen.getByTestId("raids-filters"))
    await open("raids-filters-rarities")
    expect(optionIds()).toEqual(
      ["Common", "Uncommon", "Rare", "Epic", "Legendary", "Mythic"].map(
        (rarity) => `option-${rarity}`
      )
    )
  })

  it("offers the distinct enemy totals descending and clears a bound back to no limit", async () => {
    renderTrigger()
    const user = userEvent.setup()
    await user.click(screen.getByTestId("raids-filters"))
    await open("raids-filters-enemies-min")
    expect(optionIds()).toEqual(["option-10", "option-4"])
    pick("10")
    expect(screen.getByTestId("raids-filters-enemies-min")).toHaveTextContent(
      "10"
    )

    await user.click(screen.getByTestId("raids-filters-enemies-min-clear"))
    expect(screen.getByTestId("raids-filters-enemies-min")).toHaveTextContent(
      "raidsFilters.placeholders.noLimit"
    )
  })

  it("disables the data-derived fields while battles load, leaving the rest usable", async () => {
    catalog.battles = undefined
    renderTrigger()
    const user = userEvent.setup()
    await user.click(screen.getByTestId("raids-filters"))

    expect(screen.getByTestId("raids-filters-enemies-min")).toBeDisabled()
    expect(screen.getByTestId("raids-filters-enemies-max")).toBeDisabled()
    expect(screen.getByTestId("raids-filters-enemy-types")).toBeDisabled()
    expect(screen.getByTestId("raids-filters-enemy-traits")).toBeDisabled()
    expect(screen.getByTestId("raids-filters-slots")).toBeEnabled()
    expect(screen.getByTestId("raids-filters-rarities")).toBeEnabled()
  })

  it("offers only traits present on campaign-battle enemies and applies the selection", async () => {
    renderTrigger()
    const user = userEvent.setup()
    await user.click(screen.getByTestId("raids-filters"))
    await open("raids-filters-enemy-traits")
    // Healer sits on an npc no battle uses, so it is not offered.
    expect(optionIds()).toEqual([
      "option-Daemon",
      "option-Flying",
      "option-Mechanical",
      "option-PermaDeath",
    ])
    expect(screen.getByTestId("option-Mechanical")).toHaveTextContent(
      "traits:Mechanical"
    )
    pick("Mechanical")
    await user.keyboard("{Escape}")
    await user.click(screen.getByTestId("raids-filters-apply"))
    expect(applied().enemiesTraits).toEqual(["Mechanical"])
    expect(screen.getByTestId("raids-filters-badge")).toHaveTextContent("1")

    await user.click(screen.getByTestId("raids-filters"))
    await user.click(screen.getByTestId("raids-filters-reset"))
    expect(applied().enemiesTraits).toEqual([])
  })

  it("renders the dialog as a sheet on mobile with the same sections and footer", async () => {
    useIsMobileMock.mockReturnValue(true)
    renderTrigger()
    const user = userEvent.setup()
    await user.click(screen.getByTestId("raids-filters"))

    const sheet = await screen.findByTestId("raids-filters-dialog")
    expect(sheet).toHaveAttribute("data-slot", "sheet-content")
    expect(screen.getByTestId("raids-filters-apply")).toBeInTheDocument()
  })
})
