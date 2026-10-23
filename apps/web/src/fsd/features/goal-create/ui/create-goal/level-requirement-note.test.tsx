import { render, screen } from "@/test/render"
import { describe, expect, it } from "vitest"

import { LevelRequirementNote } from "./level-requirement-note"

const preview = {
  requiredLevel: 32,
  currentLevel: 31,
  remainingXp: 12_200,
  cost: { books: 1, gold: 500 },
}

describe("LevelRequirementNote", () => {
  it("names the default Legendary rarity when none is passed (today's behavior)", () => {
    render(<LevelRequirementNote preview={preview} />)

    expect(screen.getByTestId("create-goal-level-cost")).toHaveTextContent(
      "≈ 1 Legendary XP Book"
    )
  })

  it("names the selected rarity, matching the book count the setting already changed (worked Epic example)", () => {
    render(
      <LevelRequirementNote
        preview={{ ...preview, cost: { books: 5, gold: 2_500 } }}
        xpBookRarity="Epic"
      />
    )

    expect(screen.getByTestId("create-goal-level-cost")).toHaveTextContent(
      "≈ 5 Epic XP Books"
    )
  })

  it("renders nothing without a preview", () => {
    render(<LevelRequirementNote preview={undefined} />)
    expect(
      screen.queryByTestId("create-goal-level-requirement")
    ).not.toBeInTheDocument()
  })
})
