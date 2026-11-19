// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import type { Progression, Rank, UnitId } from "@workspace/game-domain"

import { useRankFields } from "./use-create-goal-form"
import { useEntityPrefill } from "./use-entity-prefill"

const incisus = "spaceIncisus" as UnitId
const synced = {
  progressionIndex: "Rare:FourStars" as Progression,
  abilities: [{ level: 11 }, { level: 11 }],
}

function renderPrefill() {
  const ascensionPrefill = vi.fn()
  const abilityPrefill = vi.fn()
  const hook = renderHook(() => {
    const rankFields = useRankFields()
    const { resetPrefillGuard } = useEntityPrefill({
      entityId: incisus,
      playerEntity: synced,
      rank: "Bronze2" as Rank,
      rankFields,
      upgradeFields: { prefillFrom: vi.fn() },
      ascensionFields: { prefillFrom: ascensionPrefill },
      abilityFields: { prefillFrom: abilityPrefill },
      setEnabledTypes: vi.fn(),
    })
    return { rankFields, resetPrefillGuard }
  })
  return { ...hook, ascensionPrefill, abilityPrefill }
}

describe("useEntityPrefill", () => {
  it("prefills the start fields from the synced unit", () => {
    const { result, ascensionPrefill, abilityPrefill } = renderPrefill()

    expect(result.current.rankFields.state.rankStart).toBe("Bronze2")
    expect(ascensionPrefill).toHaveBeenCalledWith("Rare:FourStars")
    expect(abilityPrefill).toHaveBeenCalledWith(11, 11)
  })

  it("does not prefill again on a re-render without a reset", () => {
    const { rerender, abilityPrefill } = renderPrefill()

    rerender()

    expect(abilityPrefill).toHaveBeenCalledTimes(1)
  })

  it("prefills again when the same unit is picked again after a reset", () => {
    const { result, abilityPrefill } = renderPrefill()

    // What handleEntityChange does when the already-selected unit is picked again (or the sheet
    // is reopened for it): the fields go back to their defaults and the guard is cleared, while
    // the entity id and its synced data stay the same.
    act(() => {
      result.current.rankFields.reset()
      result.current.resetPrefillGuard()
    })

    expect(result.current.rankFields.state.rankStart).toBe("Bronze2")
    expect(abilityPrefill).toHaveBeenCalledTimes(2)
  })
})
