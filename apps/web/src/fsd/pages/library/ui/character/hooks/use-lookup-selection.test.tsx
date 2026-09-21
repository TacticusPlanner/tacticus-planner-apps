import { act, renderHook } from "@testing-library/react"
import { MemoryRouter } from "react-router"
import { describe, expect, it } from "vitest"
import { unitIdSchema } from "@workspace/game-domain"

import { useLookupSelection } from "./use-lookup-selection"

function renderSelection(initialEntry = "/", characterId?: string) {
  return renderHook(() => useLookupSelection(characterId), {
    wrapper: ({ children }) => (
      <MemoryRouter initialEntries={[initialEntry]}>{children}</MemoryRouter>
    ),
  })
}

describe("useLookupSelection's rank range", () => {
  it("derives an advancing default rank and progression range", () => {
    const { result } = renderSelection()

    expect(result.current.draft).toMatchObject({
      rankStart: "Stone1",
      rankEnd: "Stone2",
      progressionStart: "Common:None",
      progressionEnd: "Common:OneStar",
    })
  })

  it("advances progression past a rarity boundary required by the target rank", () => {
    const characterId = unitIdSchema.parse("cato")
    const { result } = renderSelection("/", characterId)

    act(() => {
      result.current.applyPlayerPrefill(characterId, {
        rankStart: "Iron1",
        progressionStart: "Common:OneStar",
      })
    })

    expect(result.current.draft).toMatchObject({
      rankStart: "Iron1",
      rankEnd: "Iron2",
      progressionStart: "Common:OneStar",
      progressionEnd: "Uncommon:TwoStars",
    })
  })

  it("backs each range away from its maximum endpoint", () => {
    const characterId = unitIdSchema.parse("cato")
    const { result } = renderSelection("/", characterId)

    act(() => {
      result.current.applyPlayerPrefill(characterId, {
        rankStart: "Adamantine2",
        progressionStart: "Mythic:MythicWings",
      })
    })

    expect(result.current.draft).toMatchObject({
      rankStart: "Adamantine1",
      rankEnd: "Adamantine2",
      progressionStart: "Mythic:ThreeBlueStars",
      progressionEnd: "Mythic:MythicWings",
    })
  })

  it("keeps a complete valid URL range when player data arrives", () => {
    const characterId = unitIdSchema.parse("cato")
    const { result } = renderSelection(
      "/?rankStart=Stone1&rankEnd=Bronze1&progressionStart=Common:None&progressionEnd=Uncommon:TwoStars",
      characterId
    )

    act(() => {
      result.current.applyPlayerPrefill(characterId, {
        rankStart: "Iron1",
        progressionStart: "Common:OneStar",
      })
    })

    expect(result.current.draft).toMatchObject({
      rankStart: "Stone1",
      rankEnd: "Bronze1",
      progressionStart: "Common:None",
      progressionEnd: "Uncommon:TwoStars",
    })
  })

  it("keeps a user-edited range when player data arrives", () => {
    const characterId = unitIdSchema.parse("cato")
    const { result } = renderSelection("/", characterId)

    act(() => {
      result.current.setDraftRange("Bronze1", "Bronze2")
    })

    act(() => {
      result.current.applyPlayerPrefill(characterId, {
        rankStart: "Iron1",
        progressionStart: "Common:OneStar",
      })
    })

    expect(result.current.draft.rankStart).toBe("Bronze1")
    expect(result.current.draft.rankEnd).toBe("Bronze2")
  })

  it("auto-advances 'to' to 'from' + 1 when only 'from' changes", () => {
    const { result } = renderSelection()

    act(() => {
      result.current.setDraftRange("Bronze1", result.current.draft.rankEnd)
    })

    expect(result.current.draft.rankStart).toBe("Bronze1")
    expect(result.current.draft.rankEnd).toBe("Bronze2")
  })

  it("leaves 'to' alone when it was set explicitly (both values change together)", () => {
    const { result } = renderSelection()

    act(() => {
      result.current.setDraftRange("Bronze1", "Gold1")
    })

    expect(result.current.draft.rankStart).toBe("Bronze1")
    expect(result.current.draft.rankEnd).toBe("Gold1")
  })

  it("auto-retreats 'from' to 'to' - 1 when only 'to' changes", () => {
    const { result } = renderSelection()

    act(() => {
      result.current.setDraftRange(result.current.draft.rankStart, "Gold2")
    })

    expect(result.current.draft.rankEnd).toBe("Gold2")
    expect(result.current.draft.rankStart).toBe("Gold1")
  })

  it("pulls 'from' back one step instead of colliding with 'to' at the ladder's maximum rank", () => {
    const { result } = renderSelection()

    act(() => {
      result.current.setDraftRange("Adamantine2", result.current.draft.rankEnd)
    })

    expect(result.current.draft.rankEnd).toBe("Adamantine2")
    expect(result.current.draft.rankStart).toBe("Adamantine1")
  })

  it("pushes 'to' forward one step instead of colliding with 'from' at the ladder's minimum rank", () => {
    const { result } = renderSelection()

    // Move away from the floor first so the assertion below can't be satisfied by coincidence
    // with the default range.
    act(() => {
      result.current.setDraftRange("Iron1", result.current.draft.rankEnd)
    })
    expect(result.current.draft).toMatchObject({
      rankStart: "Iron1",
      rankEnd: "Iron2",
    })

    act(() => {
      result.current.setDraftRange(result.current.draft.rankStart, "Stone1")
    })

    expect(result.current.draft.rankStart).toBe("Stone1")
    expect(result.current.draft.rankEnd).toBe("Stone2")
  })

  // No "clamps Adamantine3 down to Adamantine2" cases here for now: Adamantine3 is currently removed
  // from the Rank ladder entirely (see rank.ts's lastRank comment), so there's no longer a rank value
  // beyond the ceiling to clamp — `clampToCurrentMax`/lastRank-capping in useLookupSelection is a
  // no-op today, kept so this file needs no changes once Adamantine3 ships. Reinstate cases like
  // these (an out-of-range rank via setDraftRange, and via the URL) at that point.

  it("ignores an unrecognized rank supplied via the URL and falls back to the default", () => {
    const { result } = renderSelection(
      "/?rankStart=Adamantine2&rankEnd=NotARealRank"
    )

    expect(result.current.applied.rankStart).toBe("Adamantine1")
    expect(result.current.applied.rankEnd).toBe("Adamantine2")
  })
})
