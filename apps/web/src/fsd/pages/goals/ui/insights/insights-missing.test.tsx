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
  it("lists only the resources still missing, grouped by alliance", () => {
    render(
      <InsightsMissing
        missing={{
          ...empty,
          abilityBadges: { Xenos: { Epic: 7 } },
          orbs: { Chaos: { Legendary: 12 } },
          components: { Imperial: 3 },
          xp: 25_000,
          xpBooks: { rarity: "Legendary", count: 2 },
        }}
      />
    )

    const rows = screen.getAllByTestId("insights-missing-row")
    expect(rows.map((row) => row.querySelector("dt")?.textContent)).toEqual([
      "Xenos ability badges",
      "Chaos orbs",
      "Machine of War components",
      "XP books · 25,000 XP",
    ])
    expect(
      within(rows[0]!).getByLabelText("Epic ability badges: 7")
    ).toBeInTheDocument()
    expect(
      within(rows[3]!).getByLabelText("Legendary XP books: 2")
    ).toBeInTheDocument()
  })

  it("says so when the inventory covers everything", () => {
    render(<InsightsMissing missing={empty} />)

    expect(screen.queryByTestId("insights-missing-row")).not.toBeInTheDocument()
    expect(screen.getByTestId("insights-missing")).toHaveTextContent(
      "Your inventory covers"
    )
  })
})
