import { beforeEach, describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"

import { unitIdSchema, type FactionGroup } from "@workspace/game-domain"

vi.mock("../character-lookup-controls", () => ({
  CharacterLookupControls: ({ onApply }: { onApply: () => void }) => (
    <button data-testid="controls-apply" onClick={onApply}>
      Apply
    </button>
  ),
}))
vi.mock("../character-lookup-results", () => ({
  CharacterLookupResults: () => <div data-testid="results-stub" />,
}))
vi.mock("../unit-profile", () => ({
  UnitProfile: () => <div data-testid="unit-profile-stub" />,
}))

import { CharacterLookupMobilePage } from "./character-lookup-mobile-page"

const characterGroups: FactionGroup[] = []

function baseProps() {
  return {
    characterGroups,
    characterId: unitIdSchema.parse("cato"),
    rankStart: "Stone1" as const,
    rankEnd: "Iron1" as const,
    progressionStart: "Common:None" as const,
    progressionEnd: "Common:None" as const,
    pointFive: false,
    pointFiveDisabled: false,
    includeOwned: false,
    includeOwnedDisabled: false,
    loading: false,
    profile: undefined,
    baseUpgrades: [],
    groups: [],
    campaignInsights: [],
    eventInsights: [],
    onCharacterChange: vi.fn(),
    onRangeChange: vi.fn(),
    onProgressionRangeChange: vi.fn(),
    onPointFiveChange: vi.fn(),
    onIncludeOwnedChange: vi.fn(),
    onApply: vi.fn(),
    applyDisabled: false,
  }
}

describe("CharacterLookupMobilePage", () => {
  beforeEach(() => {
    ;(
      window.HTMLElement.prototype.scrollIntoView as ReturnType<typeof vi.fn>
    ).mockClear?.()
  })

  it("shows skeletons instead of content while loading", () => {
    render(<CharacterLookupMobilePage {...baseProps()} loading />)

    expect(screen.queryByTestId("lookup-results")).not.toBeInTheDocument()
    expect(screen.queryByTestId("controls-apply")).not.toBeInTheDocument()
  })

  it("omits the unit profile when there is none yet, but still renders results", () => {
    render(<CharacterLookupMobilePage {...baseProps()} />)

    expect(screen.queryByTestId("unit-profile-stub")).not.toBeInTheDocument()
    expect(screen.getByTestId("results-stub")).toBeInTheDocument()
  })

  it("renders the unit profile once one is available", () => {
    render(
      <CharacterLookupMobilePage
        {...baseProps()}
        profile={{
          id: unitIdSchema.parse("cato"),
          name: "Cato Sicarius",
          faction: "Ultramarines",
          movement: 4,
          meleeHits: 3,
          meleeDamageType: "Physical",
          damageTypes: ["Physical"],
          equipmentSlots: [],
          traits: [],
          health: { current: 100, target: 100 },
          damage: { current: 10, target: 10 },
          armour: { current: 5, target: 5 },
        }}
      />
    )

    expect(screen.getByTestId("unit-profile-stub")).toBeInTheDocument()
  })

  it("scrolls the results into view once Apply is clicked and results change, but not on unrelated re-renders", () => {
    const onApply = vi.fn()
    const { rerender } = render(
      <CharacterLookupMobilePage {...baseProps()} onApply={onApply} />
    )
    const scrollIntoView = window.HTMLElement.prototype
      .scrollIntoView as ReturnType<typeof vi.fn>

    screen.getByTestId("controls-apply").click()
    expect(onApply).toHaveBeenCalledTimes(1)
    expect(scrollIntoView).not.toHaveBeenCalled()

    // Simulate the parent recomputing results in response to onApply.
    rerender(
      <CharacterLookupMobilePage
        {...baseProps()}
        onApply={onApply}
        groups={[]}
        baseUpgrades={[{ id: "new-upgrade" } as never]}
      />
    )
    expect(scrollIntoView).toHaveBeenCalledTimes(1)

    // A later, unrelated re-render (no Apply in between) must not scroll again.
    rerender(
      <CharacterLookupMobilePage
        {...baseProps()}
        onApply={onApply}
        groups={[]}
        baseUpgrades={[{ id: "another-upgrade" } as never]}
      />
    )
    expect(scrollIntoView).toHaveBeenCalledTimes(1)
  })
})
