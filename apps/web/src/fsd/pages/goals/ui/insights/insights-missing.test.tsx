import { render, screen, within } from "@/test/render"
import { describe, expect, it } from "vitest"

import { InsightsMissing } from "./insights-missing"

const empty = {
  abilityBadges: {},
  orbs: {},
  forgeBadges: {},
  components: {},
  xp: 0,
  xpBooks: null,
}

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
      "XP books",
    ])

    const rowTitles = (group: HTMLElement) =>
      within(group)
        .getAllByTestId("insights-missing-row")
        .map((row) => row.querySelector("dt")?.textContent)
    expect(rowTitles(groups[0]!)).toEqual(["Imperial", "Xenos"])
    expect(rowTitles(groups[1]!)).toEqual(["Chaos"])
    expect(rowTitles(groups[2]!)).toEqual(["Forge badges", "Components"])
    expect(rowTitles(groups[3]!)).toEqual(["25,000 XP"])

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
