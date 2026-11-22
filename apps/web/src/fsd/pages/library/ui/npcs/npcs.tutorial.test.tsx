import { describe, expect, it } from "vitest"

import { renderHook } from "@/test/render"

import { useNpcsTutorial } from "./npcs.tutorial"

describe("useNpcsTutorial", () => {
  it("covers the toolbar and the tiles on the list, the same on both forms", () => {
    const { result } = renderHook(() => useNpcsTutorial(false))

    expect(result.current.desktop.map((step) => step.target)).toEqual([
      '[data-testid="npcs-toolbar"]',
      '[data-testid="npcs-list"]',
    ])
    expect(result.current.desktop[0]?.title).toBe("Filter the roster")
    expect(result.current.mobile).toEqual(result.current.desktop)
  })

  it("covers the selectors, stats and encounters on an NPC's page", () => {
    const { result } = renderHook(() => useNpcsTutorial(true))

    expect(result.current.desktop.map((step) => step.target)).toEqual([
      '[data-testid="npcs-variation-select"]',
      '[data-testid="npcs-level-select"]',
      '[data-testid="npcs-stats"]',
      '[data-testid="npc-encounters"]',
    ])
    expect(result.current.desktop.at(-1)?.title).toBe("Where it is fought")
    expect(result.current.mobile).toEqual(result.current.desktop)
  })
})
