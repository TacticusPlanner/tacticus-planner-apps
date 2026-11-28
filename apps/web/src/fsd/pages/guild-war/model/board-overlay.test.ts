import { describe, expect, it } from "vitest"
import { guildWarFixture } from "@workspace/game-catalog/testing"

import { required } from "@/shared/lib"

import { boardOverlay, squareViewBox } from "./board-overlay"
import type { GuildWarBoard } from "./board-overlay"

const seasonA = required(guildWarFixture[0], "season A")
const fixtureBoard = (boardId: string) =>
  required(
    seasonA.maps.find((map) => map.boardId === boardId)?.board,
    `board ${boardId}`
  )

// A 2x2 grid on a 13x14 visual board at the game's usual offset, all ground level.
const board = (overrides: Partial<GuildWarBoard> = {}): GuildWarBoard => ({
  columns: 2,
  rows: 2,
  visualColumns: 13,
  visualRows: 14,
  visualFirstColumn: 3,
  visualFirstRow: 2,
  tiles: [0, 1].flatMap((row) =>
    [0, 1].map((column) => ({
      column,
      row,
      terrain: "Grass",
      elevation: 2,
      blocked: false,
    }))
  ),
  attackerSpawns: [{ column: 0, row: 0 }],
  defenderSpawns: [{ column: 1, row: 1 }],
  ...overrides,
})

/** A hex's centre on the art: the mean of its six corners. */
function centre(points: string): [number, number] {
  const corners = points.split(" ").map((point) => point.split(",").map(Number))
  const mean = (axis: 0 | 1) =>
    corners.reduce((sum, corner) => sum + (corner[axis] ?? 0), 0) /
    corners.length
  return [mean(0), mean(1)]
}

const hexAt = (
  overlay: ReturnType<typeof boardOverlay>,
  column: number,
  row: number
) =>
  required(
    overlay?.hexes.find((hex) => hex.column === column && hex.row === row),
    `hex ${column},${row}`
  )

describe("guild war board overlay", () => {
  it("places the grid's first hex on the art by the board size's fit", () => {
    const overlay = boardOverlay(board())
    // Visual column 3, row 2: world x 12, z 2 * 3.464; on the 13x14 art 14 + x * 9.75, 506 - z * 11.5.
    const [x, y] = centre(hexAt(overlay, 0, 0).points)
    expect(x).toBeCloseTo(131, 0)
    expect(y).toBeCloseTo(426.3, 0)
  })

  it("shifts odd visual rows half a hex right and draws higher rows further up", () => {
    const overlay = boardOverlay(board())
    const [x0, y0] = centre(hexAt(overlay, 0, 0).points)
    const [x1, y1] = centre(hexAt(overlay, 0, 1).points)
    expect(x1 - x0).toBeCloseTo(2 * 9.75, 0)
    expect(y0 - y1).toBeCloseTo(3.464 * 11.5, 0)
  })

  it("draws a raised hex higher, as the angled camera shows it", () => {
    const flat = boardOverlay(board())
    const raised = boardOverlay(
      board({
        tiles: board().tiles.map((tile) =>
          tile.column === 1 && tile.row === 0 ? { ...tile, elevation: 4 } : tile
        ),
      })
    )
    const [, flatY] = centre(hexAt(flat, 1, 0).points)
    const [, raisedY] = centre(hexAt(raised, 1, 0).points)
    expect(flatY - raisedY).toBeCloseTo(2 * 0.9 * 11.5, 0)
  })

  it("marks deployment hexes before blocked ones", () => {
    const overlay = boardOverlay(
      board({
        tiles: board().tiles.map((tile) => ({
          ...tile,
          blocked: tile.row === 0,
        })),
      })
    )
    expect(overlay?.hexes.map((hex) => hex.kind)).toEqual([
      "attacker",
      "blocked",
      "open",
      "defender",
    ])
  })

  it("crops the art to the grid with half a hex of margin", () => {
    const overlay = boardOverlay(fixtureBoard("EC1_09"))
    expect(overlay?.hexes).toHaveLength(63)
    const box = required(overlay?.viewBox, "view box")
    expect(box.x).toBeGreaterThan(0)
    expect(box.x + box.width).toBeLessThanOrEqual(512)
    // Seven hexes and a half-hex offset of 4 world units each, plus half a hex either side.
    expect(box.width).toBeCloseTo((7 * 4 + 2 + 4) * 9.75, 0)
  })

  it("serves the deploy screen's hexes of a pool board", () => {
    const kinds = boardOverlay(fixtureBoard("EC1_09"))?.hexes.map(
      (hex) => hex.kind
    )
    expect(kinds?.filter((kind) => kind === "attacker")).toHaveLength(5)
    expect(kinds?.filter((kind) => kind === "defender")).toHaveLength(20)
  })

  it("leaves a board whose art size has no fit without an overlay", () => {
    expect(boardOverlay(board({ visualColumns: 15, visualRows: 15 }))).toBe(
      undefined
    )
  })

  it("squares a crop around its centre, kept on the art", () => {
    expect(squareViewBox({ x: 100, y: 50, width: 300, height: 400 })).toEqual({
      x: 50,
      y: 50,
      width: 400,
      height: 400,
    })
    expect(squareViewBox({ x: 10, y: 0, width: 200, height: 500 })).toEqual({
      x: 0,
      y: 0,
      width: 500,
      height: 500,
    })
  })
})
