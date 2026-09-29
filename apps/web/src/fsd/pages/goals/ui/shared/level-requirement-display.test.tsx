import { render, screen } from "@/test/render"
import { describe, expect, it, vi } from "vitest"

vi.mock("react-i18next", () => ({
  initReactI18next: { type: "3rdParty", init: vi.fn() },
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, unknown>) =>
      opts ? `${key}:${JSON.stringify(opts)}` : key,
    i18n: { resolvedLanguage: "en" },
  }),
}))

vi.mock("@workspace/ui/hooks/use-mobile", () => ({ useIsMobile: () => false }))

import type { LevelRequirementProgress } from "../../model/attainment/level-requirement-progress"
import { LevelRequirementLine } from "./level-requirement-display"

const requirement: LevelRequirementProgress = {
  kind: "LevelRequirement",
  current: 31,
  target: 32,
  ratio: 30 / 31,
  reachableRatio: null,
  reachableLevel: null,
  remainingXp: 12_200,
}

describe("LevelRequirementLine", () => {
  it("shows the level target, the XP-book figure and the potential-only bar on one line, with no levels or XP text", () => {
    render(
      <LevelRequirementLine
        levelRequirement={requirement}
        potentialRatio={1}
        xpBooks={{ needed: 6, available: 4, rarity: "Legendary" }}
      />
    )

    const line = screen.getByTestId("level-requirement-line")
    expect(screen.getByTestId("level-requirement-target")).toHaveTextContent(
      'goals.overview.levelProgress:{"current":31,"target":32}'
    )
    expect(line).toContainElement(
      screen.getByTestId("level-requirement-progress")
    )
    expect(screen.getByTestId("level-requirement-books")).toHaveTextContent(
      'goals.resourceChips.xpBooksValue:{"available":"4","needed":"6"}'
    )
    expect(line).not.toHaveTextContent("remainingText.levels")
    expect(line).not.toHaveTextContent("XP remaining")
  })

  it("omits the book figure when no books are needed", () => {
    render(
      <LevelRequirementLine
        levelRequirement={requirement}
        potentialRatio={1}
        xpBooks={{ needed: 0, available: 8, rarity: "Legendary" }}
      />
    )

    expect(screen.getByTestId("level-requirement-target")).toBeInTheDocument()
    expect(screen.queryByTestId("level-requirement-books")).toBeNull()
  })

  it("renders nothing once the character's level is sufficient", () => {
    render(
      <LevelRequirementLine
        levelRequirement={null}
        potentialRatio={undefined}
      />
    )

    expect(screen.queryByTestId("level-requirement-line")).toBeNull()
  })
})
