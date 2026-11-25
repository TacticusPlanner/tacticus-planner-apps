import userEvent from "@testing-library/user-event"
import { describe, expect, it } from "vitest"

import type { PlanUpgradeMaterial } from "@/features/goal-planning"
import { render, screen, within } from "@/test/render"

import { InsightsMissing } from "./insights-missing"

const empty = {
  abilityBadges: {},
  orbs: {},
  forgeBadges: {},
  components: {},
  xp: 0,
  xpBooks: null,
  gold: 0,
}

const upgrade = (
  id: string,
  rarity: string,
  required: number,
  missing: number,
  days = 0,
  energyToClear = 0
) =>
  ({
    id,
    label: id,
    rarity,
    required,
    missing,
    days,
    energyToClear,
    goalIds: ["g1"],
  }) as PlanUpgradeMaterial

describe("InsightsMissing", () => {
  it("groups the missing resources by kind, then by alliance", () => {
    render(
      <InsightsMissing
        missing={{
          ...empty,
          abilityBadges: {
            Imperial: { Rare: 4 },
            Xenos: { Epic: 7, Legendary: 1_000 },
          },
          orbs: { Chaos: { Legendary: 12 } },
          forgeBadges: { Epic: 5 },
          components: { Imperial: 3 },
          xp: 25_000,
          xpBooks: { rarity: "Legendary", count: 2 },
          gold: 42_000,
        }}
      />
    )

    const groups = screen.getAllByTestId("insights-missing-group")
    expect(
      groups.map((group) => group.querySelector("h3")?.textContent)
    ).toEqual([
      "Ability badges1,011 total",
      "Orbs12 total",
      "Machine of War materials",
      "XP books & gold",
    ])

    const rowTitles = (group: HTMLElement) =>
      within(group)
        .getAllByTestId("insights-missing-row")
        .map((row) => row.querySelector("dt")?.textContent)
    expect(rowTitles(groups[0]!)).toEqual(["Imperial", "Xenos"])
    expect(rowTitles(groups[1]!)).toEqual(["Chaos"])
    expect(rowTitles(groups[2]!)).toEqual(["Forge badges", "Components"])
    expect(rowTitles(groups[3]!)).toEqual(["25,000 XP", "Gold"])

    expect(
      within(groups[0]!).getByLabelText("Epic ability badges: 7")
    ).toBeInTheDocument()
    expect(
      within(groups[2]!).getByLabelText(
        "Machine of War components (Imperial): 3"
      )
    ).toBeInTheDocument()
    expect(
      within(groups[3]!).getByLabelText("Legendary XP books: 2")
    ).toBeInTheDocument()
    expect(
      within(groups[3]!).getByLabelText("Gold: 42,000")
    ).toBeInTheDocument()
  })

  it("names the group for gold alone when no XP books are missing", () => {
    render(<InsightsMissing missing={{ ...empty, gold: 500 }} />)

    expect(
      screen
        .getAllByTestId("insights-missing-group")
        .map((group) => group.querySelector("h3 > span")?.textContent)
    ).toEqual(["Gold"])
  })

  it("leads with the farmed upgrades one by one, then the shards still to get", () => {
    render(
      <InsightsMissing
        goalInfoById={
          new Map([
            [
              "g1",
              { entityType: "Character", entityId: "calgar", goalType: "Rank" },
            ],
          ])
        }
        missing={empty}
        totals={{ upgradesByRarity: {}, shards: 30, mythicShards: 0 }}
        upgrades={[
          upgrade("plasma", "Epic", 6, 6, 4.2, 900),
          upgrade("purity", "Common", 40, 12, 2, 420),
          upgrade("seal", "Common", 10, 0),
        ]}
      />
    )

    const upgrades = screen.getByTestId("insights-upgrades")
    expect(
      within(upgrades)
        .getAllByRole("region")
        .map((group) => group.getAttribute("aria-label"))
    ).toEqual(["Epic upgrades", "Common upgrades"])
    expect(screen.getByTestId("insights-upgrade-plasma")).toHaveTextContent(
      "plasma65 d · 900 energy"
    )
    expect(screen.getByTestId("insights-upgrade-purity")).toHaveTextContent(
      "purity122 d · 420 energy"
    )
    expect(
      screen.queryByTestId("insights-upgrade-seal")
    ).not.toBeInTheDocument()

    const farmed = screen.getByTestId("insights-missing-group")
    expect(
      within(farmed).getByRole("heading", { name: /Farmed resources/ })
    ).toBeInTheDocument()
    expect(within(farmed).getByLabelText("Shards: 30")).toBeInTheDocument()
    expect(
      within(farmed).queryByLabelText(/Mythic shards/)
    ).not.toBeInTheDocument()
  })

  it("shows what the goals require, with what is still missing, and remembers the choice", async () => {
    const user = userEvent.setup()
    const props = {
      missing: { ...empty, gold: 500 },
      upgrades: [
        upgrade("purity", "Common", 40, 12, 2, 420),
        upgrade("seal", "Common", 10, 0),
      ],
    }
    const { unmount } = render(<InsightsMissing {...props} />)

    await user.click(screen.getByRole("radio", { name: "Required" }))
    expect(screen.getByTestId("insights-missing")).toHaveTextContent(
      "Total required"
    )
    expect(screen.getByTestId("insights-upgrade-purity")).toHaveTextContent(
      "purity4012 missing2 d · 420 energy"
    )
    expect(screen.getByTestId("insights-upgrade-seal")).toHaveTextContent(
      "seal10"
    )
    // Gold and the other kinds show under Missing only.
    expect(
      screen.queryByTestId("insights-missing-group")
    ).not.toBeInTheDocument()

    unmount()
    render(<InsightsMissing {...props} />)
    expect(screen.getByRole("radio", { name: "Required" })).toBeChecked()
  })

  it("shows the spare upgrades, ten per rarity before Show more", async () => {
    const user = userEvent.setup()
    render(
      <InsightsMissing
        missing={empty}
        spareUpgrades={Array.from({ length: 12 }, (_, index) => ({
          id: `spare${index}` as never,
          label: `spare${index}`,
          rarity: "Rare" as never,
          spare: 20 - index,
        }))}
      />
    )

    await user.click(screen.getByRole("radio", { name: "Spare" }))
    const rare = screen.getByTestId("insights-upgrades-Rare")
    expect(within(rare).getAllByRole("listitem")).toHaveLength(10)
    await user.click(within(rare).getByRole("button", { name: "Show 2 more" }))
    expect(within(rare).getAllByRole("listitem")).toHaveLength(12)
    expect(screen.getByTestId("insights-upgrade-spare0")).toHaveTextContent(
      "spare020"
    )
  })

  it("leaves out groups with nothing missing", () => {
    render(
      <InsightsMissing missing={{ ...empty, orbs: { Xenos: { Rare: 1 } } }} />
    )

    expect(
      screen
        .getAllByTestId("insights-missing-group")
        .map((group) => group.querySelector("h3 > span")?.textContent)
    ).toEqual(["Orbs"])
  })

  it("says so when the inventory covers everything", () => {
    render(<InsightsMissing missing={empty} />)

    expect(
      screen.queryByTestId("insights-missing-group")
    ).not.toBeInTheDocument()
    expect(screen.getByTestId("insights-missing")).toHaveTextContent(
      "Your inventory covers"
    )
  })
})
