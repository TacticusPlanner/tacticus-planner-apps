import { renderHook } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import type { UnitId, UpgradeId } from "@workspace/game-domain"

import { useCreateGoalPrefill } from ".//use-create-goal-prefill"
import type { CreateGoalPrefill } from ".//create-goal-launcher-context"

const unitId = "test-unit" as UnitId

const fns = {
  handleEntityChange: vi.fn(),
  setEntityType: vi.fn(),
  setEnabledTypes: vi.fn(),
  selectProjects: vi.fn(),
  setProgressionEnd: vi.fn(),
  setRankEnd: vi.fn(),
  addUpgradeTarget: vi.fn(),
}

const ladderQuantities = new Map([["upgHpC001" as UpgradeId, 4]])

function render(
  prefill: CreateGoalPrefill | undefined,
  entityId?: UnitId,
  catalogLoaded = true
) {
  return renderHook(
    ({ quantities }) =>
      useCreateGoalPrefill({
        open: true,
        prefill,
        entityId,
        playerEntity: {},
        ...fns,
        targetSetters: fns,
        upgradeFields: {
          state: {
            addUpgradeTarget: fns.addUpgradeTarget,
            remainingLadderQuantities: quantities,
          },
        },
      }),
    {
      initialProps: {
        quantities: catalogLoaded
          ? (ladderQuantities as ReadonlyMap<UpgradeId, number> | undefined)
          : undefined,
      },
    }
  )
}

describe("useCreateGoalPrefill", () => {
  beforeEach(() => vi.clearAllMocks())

  it("applies a project-only prefill without touching entity or goal type", () => {
    render({ projectIds: ["p1"] })

    expect(fns.selectProjects).toHaveBeenCalledWith(["p1"])
    expect(fns.handleEntityChange).not.toHaveBeenCalled()
    expect(fns.setEntityType).not.toHaveBeenCalled()
    expect(fns.setEnabledTypes).not.toHaveBeenCalled()
    expect(fns.setProgressionEnd).not.toHaveBeenCalled()
  })

  it("does not apply anything without a prefill", () => {
    render(undefined)

    expect(fns.selectProjects).not.toHaveBeenCalled()
  })

  it("still applies the progression target for an Ascension prefill", () => {
    render(
      {
        entityType: "Mow",
        entityId: unitId,
        goalType: "Ascension",
        requiredProgression: "Rare:FourStars",
        projectIds: ["p2"],
      },
      unitId
    )

    expect(fns.setEnabledTypes).toHaveBeenCalledWith(new Set(["Ascension"]))
    expect(fns.selectProjects).toHaveBeenCalledWith(["p2"])
    expect(fns.setProgressionEnd).toHaveBeenCalledWith("Rare:FourStars")
  })

  it("applies entity and projects for an Unlock prefill with no target", () => {
    render(
      {
        entityType: "Character",
        entityId: unitId,
        goalType: "Unlock",
        projectIds: ["p3"],
      },
      unitId
    )

    expect(fns.setEnabledTypes).toHaveBeenCalledWith(new Set(["Unlock"]))
    expect(fns.selectProjects).toHaveBeenCalledWith(["p3"])
    expect(fns.setProgressionEnd).not.toHaveBeenCalled()
  })

  it("applies the target rank for a Rank prefill", () => {
    render(
      {
        entityType: "Character",
        entityId: unitId,
        goalType: "Rank",
        rankEnd: "Silver3",
      },
      unitId
    )

    expect(fns.setEnabledTypes).toHaveBeenCalledWith(new Set(["Rank"]))
    expect(fns.setRankEnd).toHaveBeenCalledWith("Silver3")
    expect(fns.setProgressionEnd).not.toHaveBeenCalled()
  })

  it("adds the material target for an Upgrade prefill", () => {
    render(
      {
        entityType: "Character",
        entityId: unitId,
        goalType: "Upgrade",
        upgradeId: "upgHpC001" as UpgradeId,
      },
      unitId
    )

    expect(fns.setEnabledTypes).toHaveBeenCalledWith(new Set(["Upgrade"]))
    expect(fns.addUpgradeTarget).toHaveBeenCalledWith("upgHpC001", 4)
    expect(fns.setRankEnd).not.toHaveBeenCalled()
  })

  it("uses an Upgrade prefill's own quantity over the ladder hint", () => {
    render(
      {
        entityType: "Character",
        entityId: unitId,
        goalType: "Upgrade",
        upgradeId: "upgHpC001" as UpgradeId,
        quantity: 10,
      },
      unitId
    )

    expect(fns.addUpgradeTarget).toHaveBeenCalledWith("upgHpC001", 10)
  })

  it("holds an Upgrade prefill until the ladder quantities have loaded", () => {
    const { rerender } = render(
      {
        entityType: "Character",
        entityId: unitId,
        goalType: "Upgrade",
        upgradeId: "upgHpC001" as UpgradeId,
      },
      unitId,
      false
    )

    expect(fns.addUpgradeTarget).not.toHaveBeenCalled()

    rerender({ quantities: ladderQuantities })

    expect(fns.addUpgradeTarget).toHaveBeenCalledOnce()
    expect(fns.addUpgradeTarget).toHaveBeenCalledWith("upgHpC001", 4)
  })

  it("selects only the unit for a unit-only prefill and keeps the project fallback", () => {
    render({ entityType: "Character", entityId: unitId }, unitId)

    expect(fns.handleEntityChange).toHaveBeenCalledWith(unitId)
    expect(fns.setEnabledTypes).toHaveBeenCalledWith(new Set())
    expect(fns.selectProjects).not.toHaveBeenCalled()
    expect(fns.setRankEnd).not.toHaveBeenCalled()
    expect(fns.setProgressionEnd).not.toHaveBeenCalled()
  })
})
