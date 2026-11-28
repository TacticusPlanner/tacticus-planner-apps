import { describe, expect, it } from "vitest"

import type { CrossLaneLeaderboardRow } from "@/entities/legendary-event"

import { nextCrossLaneSort, sortCrossLaneRows } from "./cross-lane-sort"

const row = (
  id: string,
  extra: Partial<CrossLaneLeaderboardRow>,
  alpha?: number
): CrossLaneLeaderboardRow =>
  ({
    unit: { id },
    ownership: "owned",
    satisfiedKeys: [],
    lanes: {
      alpha:
        alpha === undefined
          ? undefined
          : { pointsPerBattle: alpha, remainingPoints: alpha * 10 },
      beta: undefined,
      gamma: undefined,
    },
    ...extra,
  }) as CrossLaneLeaderboardRow

const ids = (rows: readonly CrossLaneLeaderboardRow[]) =>
  rows.map((r) => r.unit.id)

describe("sortCrossLaneRows", () => {
  const rows = [
    row("a", { rank: "Iron1", progression: "Epic:RedTwoStars" }, 50),
    row("b", { rank: "Diamond3", progression: "Rare:FourStars" }, 90),
    row("locked", { ownership: "locked" }),
    row("c", { rank: "Gold2", progression: "Mythic:OneBlueStar" }, 70),
  ]

  it("keeps the default order without a sort", () => {
    expect(ids(sortCrossLaneRows(rows, null, "remaining"))).toEqual([
      "a",
      "b",
      "locked",
      "c",
    ])
  })

  it("orders by rank, progression or a lane, keeping valueless rows last", () => {
    expect(
      ids(
        sortCrossLaneRows(rows, { key: "rank", direction: "desc" }, "remaining")
      )
    ).toEqual(["b", "c", "a", "locked"])
    expect(
      ids(
        sortCrossLaneRows(
          rows,
          { key: "progression", direction: "asc" },
          "remaining"
        )
      )
    ).toEqual(["b", "a", "c", "locked"])
    expect(
      ids(
        sortCrossLaneRows(
          rows,
          { key: "alpha", direction: "desc" },
          "perBattle"
        )
      )
    ).toEqual(["b", "c", "a", "locked"])
  })
})

describe("nextCrossLaneSort", () => {
  it("cycles a column through descending, ascending and the default order", () => {
    const first = nextCrossLaneSort(null, "rank")
    expect(first).toEqual({ key: "rank", direction: "desc" })
    const second = nextCrossLaneSort(first, "rank")
    expect(second).toEqual({ key: "rank", direction: "asc" })
    expect(nextCrossLaneSort(second, "rank")).toBeNull()
    expect(nextCrossLaneSort(second, "beta")).toEqual({
      key: "beta",
      direction: "desc",
    })
  })
})
