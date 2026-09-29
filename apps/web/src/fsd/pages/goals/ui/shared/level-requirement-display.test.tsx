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
import {
  LevelRequirementProgressBar,
  LevelRequirementRemaining,
  LevelRequirementTarget,
} from "./level-requirement-display"

const requirement: LevelRequirementProgress = {
  kind: "LevelRequirement",
  current: 31,
  target: 32,
  ratio: 30 / 31,
  reachableRatio: null,
  reachableLevel: null,
  remainingXp: 12_200,
}

describe("level requirement display", () => {
  it("shows the current -> required level, potential-only progress, and the remaining levels and XP", () => {
    render(
      <>
        <LevelRequirementTarget levelRequirement={requirement} />
        <LevelRequirementProgressBar
          levelRequirement={requirement}
          potentialRatio={1}
        />
        <LevelRequirementRemaining levelRequirement={requirement} />
      </>
    )

    expect(screen.getByTestId("level-requirement-target")).toHaveTextContent(
      'goals.overview.levelProgress:{"current":31,"target":32}'
    )
    expect(screen.getByTestId("level-requirement-progress")).toBeInTheDocument()
    expect(screen.getByTestId("level-requirement-remaining")).toHaveTextContent(
      'goals.overview.remainingText.levelsWithXp:{"count":"1","xp":"12,200"}'
    )
  })

  it("appends the available/needed XP-book count to the raw remaining text (worked pool example)", () => {
    render(
      <LevelRequirementRemaining
        availableBookCount={8}
        levelRequirement={requirement}
        neededBookCount={1}
        xpBookRarity="Legendary"
      />
    )

    const text = screen.getByTestId("level-requirement-remaining")
    expect(text).toHaveTextContent(
      'goals.overview.remainingText.levelsWithXp:{"count":"1","xp":"12,200"}'
    )
    expect(text).toHaveTextContent(
      'goals.overview.remainingText.bookAvailability:{"available":8,"needed":1,"rarity":"progression:rarities.Legendary:{\\"defaultValue\\":\\"Legendary\\"}"}'
    )
  })

  it("shows an available count below the needed count when the pool is only partial", () => {
    render(
      <LevelRequirementRemaining
        availableBookCount={0}
        levelRequirement={requirement}
        neededBookCount={1}
        xpBookRarity="Legendary"
      />
    )

    expect(screen.getByTestId("level-requirement-remaining")).toHaveTextContent(
      'goals.overview.remainingText.bookAvailability:{"available":0,"needed":1,"rarity":"progression:rarities.Legendary:{\\"defaultValue\\":\\"Legendary\\"}"}'
    )
  })

  it("shows nothing extra once the goal needs no further books", () => {
    render(
      <LevelRequirementRemaining
        availableBookCount={8}
        levelRequirement={requirement}
        neededBookCount={0}
        xpBookRarity="Legendary"
      />
    )

    expect(
      screen.getByTestId("level-requirement-remaining")
    ).not.toHaveTextContent("bookAvailability")
  })

  it("renders nothing once the character's level is sufficient", () => {
    render(
      <>
        <LevelRequirementTarget levelRequirement={null} />
        <LevelRequirementProgressBar
          levelRequirement={undefined}
          potentialRatio={undefined}
        />
        <LevelRequirementRemaining levelRequirement={null} />
      </>
    )

    expect(screen.queryByTestId("level-requirement-target")).toBeNull()
    expect(screen.queryByTestId("level-requirement-progress")).toBeNull()
    expect(screen.queryByTestId("level-requirement-remaining")).toBeNull()
  })
})
