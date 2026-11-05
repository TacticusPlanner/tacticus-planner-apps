import { afterEach, describe, expect, it, vi } from "vitest"

import { fixtureCharacter } from "@/test/fixtures/legendary-event-characters"
import { renderHook, waitFor } from "@/test/render"
import { seedGameCatalog } from "@/test/seed"

import { useHreInstance } from "./use-hre-instance"

const entry = (occurrenceId: string, startUtc: string, endUtc: string) => ({
  occurrenceId,
  definitionId: "new-character-event",
  startUtc,
  endUtc,
  parameters: { featuredCharacterId: "astarLysander" },
})
const past = entry("occ-past", "2026-09-20T00:00:00Z", "2026-10-04T00:00:00Z")
const running = entry(
  "occ-running",
  "2026-10-18T00:00:00Z",
  "2026-11-01T00:00:00Z"
)

async function seed() {
  await seedGameCatalog({
    characters: [fixtureCharacter("astarLysander")],
    "event-definitions": [
      { id: "new-character-event", type: "NewCharacterEvent" },
    ],
    "events-calendar": {
      [past.startUtc.slice(0, 10)]: [past],
      [running.startUtc.slice(0, 10)]: [running],
    },
  })
  vi.useFakeTimers({ shouldAdvanceTime: true })
  vi.setSystemTime(new Date("2026-10-20T00:00:00Z"))
}

afterEach(() => {
  vi.useRealTimers()
})

describe("useHreInstance", () => {
  it("defaults to the running event and lists every instance with its hero", async () => {
    await seed()
    const { result } = renderHook(() => useHreInstance())
    await waitFor(() => expect(result.current.status).toBe("ready"))
    const state = result.current
    if (state.status !== "ready") throw new Error("not ready")
    expect(state.instance?.key).toBe("occ-running")
    expect(state.defaultKey).toBe("occ-running")
    expect(state.stale).toBe(false)
    expect(
      state.instances.map((instance) => [instance.key, instance.status])
    ).toEqual([
      ["occ-past", "past"],
      ["occ-running", "running"],
    ])
    expect(state.hero?.id).toBe("astarLysander")
    expect(state.heroes.has("astarLysander")).toBe(true)
  })

  it("shows a requested past event and flags a key that no longer resolves", async () => {
    await seed()
    const { result, rerender } = renderHook(
      ({ key }: { key: string | null }) => useHreInstance(key),
      { initialProps: { key: "occ-past" as string | null } }
    )
    await waitFor(() => expect(result.current.status).toBe("ready"))
    expect(
      result.current.status === "ready" && result.current.instance?.status
    ).toBe("past")

    rerender({ key: "gone" })
    await waitFor(() =>
      expect(result.current.status === "ready" && result.current.stale).toBe(
        true
      )
    )
    expect(
      result.current.status === "ready" && result.current.instance?.key
    ).toBe("occ-running")
  })
})
