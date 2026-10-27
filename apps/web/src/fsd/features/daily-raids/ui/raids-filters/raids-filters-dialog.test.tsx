import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { fireEvent, render, screen, waitFor, within } from "@/test/render"
import { seedGameCatalog } from "@/test/seed"

import { emptyRaidsFilters } from "../../model/raids-filters/raids-filters.domain"
import { useRaidsFilters } from "../../model/raids-filters/use-raids-filters"
import { RaidsFiltersTrigger } from "./raids-filters-trigger"

const { useIsMobileMock } = vi.hoisted(() => ({
  useIsMobileMock: vi.fn(() => false),
}))

vi.mock("@workspace/ui/hooks/use-mobile", () => ({
  useIsMobile: () => useIsMobileMock(),
}))
const battle = (
  id: string,
  enemiesTotal: number,
  enemiesTypes: string[],
  enemyIds: string[] = []
) => ({
  id,
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

// The data-derived fields stay disabled until the seeded battles and npcs have loaded.
async function open(testId: string) {
  const field = await screen.findByTestId(testId)
  await waitFor(() =>
    expect(screen.getByTestId("raids-filters-enemy-traits")).toBeEnabled()
  )
  fireEvent.click(field)
}
const pick = (id: string) => fireEvent.click(screen.getByTestId(`option-${id}`))

describe("Raids Filters trigger and dialog", () => {
  beforeEach(async () => {
    useIsMobileMock.mockReturnValue(false)
    await seedGameCatalog({
      "campaign-battles": [
        battle("b1", 10, ["Grot"], ["bot"]),
        battle("b2", 4, ["Ork Boy", "Grot"], ["imp", "bot"]),
      ],
      npcs: [
        { id: "bot", traits: ["Mechanical", "Flying"] },
        { id: "imp", traits: ["Daemon", "PermaDeath"] },
        { id: "unused", traits: ["Healer"] },
      ],
      factions: [
        { id: "Orks", alliance: "Xenos" },
        { id: "Necrons", alliance: "Xenos" },
        { id: "Ultramarines", alliance: "Imperial" },
      ],
    })
    window.localStorage.clear()
  })

  it("shows the label on desktop", () => {
    renderTrigger()
    expect(screen.getByTestId("raids-filters")).toHaveTextContent(
      "Raids Filters"
    )
  })

  it("is icon-only with an accessible name on mobile", () => {
    useIsMobileMock.mockReturnValue(true)
    renderTrigger()
    const mobile = screen.getByTestId("raids-filters")
    expect(mobile).toHaveAccessibleName("Raids Filters")
    expect(mobile).not.toHaveTextContent("Raids Filters")
  })

  it("renders the four sections in order with a Close, Reset and Apply footer", async () => {
    renderTrigger()
    const user = userEvent.setup()
    await user.click(screen.getByTestId("raids-filters"))

    const dialog = await screen.findByTestId("raids-filters-dialog")
    const headings = within(dialog)
      .getAllByRole("heading", { level: 3 })
      .map((heading) => heading.textContent)
    expect(headings).toEqual(["Allies", "Enemies", "Locations", "Upgrades"])
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
      "All slots"
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
      "Raids Filters, 2 active"
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
    // Every faction is offered until the factions mapping to alliances have loaded.
    await waitFor(() =>
      expect(optionIds()).not.toContain("option-Ultramarines")
    )
    expect(optionIds()).toContain("option-Orks")
    expect(optionIds()).toContain("option-Necrons")
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
      "No limit"
    )
  })

  it("disables the data-derived fields while battles load, leaving the rest usable", async () => {
    renderTrigger()
    // A synchronous click: the dialog's live queries cannot have resolved before these assertions.
    fireEvent.click(screen.getByTestId("raids-filters"))

    expect(screen.getByTestId("raids-filters-enemies-min")).toBeDisabled()
    expect(screen.getByTestId("raids-filters-enemies-max")).toBeDisabled()
    expect(screen.getByTestId("raids-filters-enemy-types")).toBeDisabled()
    expect(screen.getByTestId("raids-filters-enemy-traits")).toBeDisabled()
    expect(screen.getByTestId("raids-filters-slots")).toBeEnabled()
    expect(screen.getByTestId("raids-filters-rarities")).toBeEnabled()
    // Once the seeded battles load, the data-derived fields unlock.
    await waitFor(() =>
      expect(screen.getByTestId("raids-filters-enemy-types")).toBeEnabled()
    )
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
      "Mechanical"
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
