import { renderHook } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import type { UnitId } from "@workspace/game-domain"

import { useCreateGoalPrefill } from ".//use-create-goal-prefill"
import type { CreateGoalPrefill } from ".//create-goal-launcher-context"

const unitId = "test-unit" as UnitId

const fns = {
  handleEntityChange: vi.fn(),
  setEntityType: vi.fn(),
  setEnabledTypes: vi.fn(),
  selectProjects: vi.fn(),
  setProgressionEnd: vi.fn(),
}

function render(prefill: CreateGoalPrefill | undefined, entityId?: UnitId) {
  return renderHook(() =>
    useCreateGoalPrefill({
      open: true,
      prefill,
      entityId,
      playerEntity: {},
      ...fns,
    })
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
})
