import { render, screen } from "@/test/render"
import { describe, expect, it, vi } from "vitest"

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, unknown>) =>
      opts ? `${key}:${JSON.stringify(opts)}` : key,
    i18n: { resolvedLanguage: "en" },
  }),
}))

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
      'goals.create.level.booksNeeded:{"count":1,"rarity":"progression:rarities.Legendary:{\\"defaultValue\\":\\"Legendary\\"}"}'
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
      'goals.create.level.booksNeeded:{"count":5,"rarity":"progression:rarities.Epic:{\\"defaultValue\\":\\"Epic\\"}"}'
    )
  })

  it("renders nothing without a preview", () => {
    render(<LevelRequirementNote preview={undefined} />)
    expect(
      screen.queryByTestId("create-goal-level-requirement")
    ).not.toBeInTheDocument()
  })
})
