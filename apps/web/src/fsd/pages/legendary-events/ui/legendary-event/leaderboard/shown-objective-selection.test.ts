import { describe, expect, it } from "vitest"

import { objectiveFilterKey } from "@/entities/legendary-event"
import { lysanderEvent } from "@/test/fixtures/legendary-events"

import { shownObjectiveSelection } from "./leaderboard.view-model"

const keyOf = (lane: "alpha" | "beta" | "gamma", position: number) =>
  objectiveFilterKey(lysanderEvent[lane].unitsRestrictions[position]!.filter)

describe("shownObjectiveSelection", () => {
  it("drops a hidden lane's objective keys and keeps the shown lanes' ones", () => {
    const alpha = keyOf("alpha", 0)
    const beta = keyOf("beta", 0)
    const selected = new Set([alpha, beta])

    expect([
      ...shownObjectiveSelection(lysanderEvent, ["beta"], selected),
    ]).toEqual([beta])
  })

  it("returns the selection itself when every key is shown", () => {
    const selected = new Set([keyOf("alpha", 1)])
    expect(
      shownObjectiveSelection(lysanderEvent, ["alpha", "gamma"], selected)
    ).toBe(selected)
  })
})
