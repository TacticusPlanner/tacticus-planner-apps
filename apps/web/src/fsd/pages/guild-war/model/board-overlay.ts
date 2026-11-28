import type { GuildWarSeason } from "../lib/season"

export type GuildWarBoard = NonNullable<GuildWarSeason["maps"][number]["board"]>

/** The board art is square; the overlay works on it at this width, whatever size it is shipped at. */
export const BOARD_ART_SIZE = 512

/**
 * How the game's board art draws its grid, by the visual board's size (`columns`x`rows`): a hex at
 * world x, z sits at `originX + x * scaleX`, `originZ - z * scaleZ` on the art. The camera looks
 * down at an angle, so the two scales differ. Fitted by hand to the Guild War pool's boards (water
 * and dry-bush hexes against the art), at `BOARD_ART_SIZE`. A size not listed gets no overlay.
 */
const ART_FITS: Record<
  string,
  { scaleX: number; originX: number; scaleZ: number; originZ: number }
> = {
  "13x14": { scaleX: 9.75, originX: 14, scaleZ: 11.5, originZ: 506 },
  "13x15": { scaleX: 9, originX: 26, scaleZ: 9.75, originZ: 491 },
}

// The game's hex grid in world units: pointy-top hexes 4 wide (apothem 2), odd visual rows shifted
// half a hex right, row 0 at the bottom (the attacker's side).
const APOTHEM = 2
const RADIUS = (2 * APOTHEM) / Math.sqrt(3)
const ROW_SPACING = 1.5 * RADIUS
// Elevation 2 is the ground; the angled camera draws each level above it about this much higher.
const GROUND = 2
const RISE_PER_LEVEL = 0.9
// The picture is cropped to the grid plus half a hex on every side.
const MARGIN_HEXES = 0.5

/** What a hex shows: where each side deploys, a hex no unit can stand on, or an open hex. */
export type BoardHexKind = "attacker" | "defender" | "blocked" | "open"

interface BoardHex {
  column: number
  row: number
  kind: BoardHexKind
  /** The hex outline as SVG polygon points, on the art at `BOARD_ART_SIZE`. */
  points: string
}

export interface BoardOverlay {
  /** The part of the art to show: the grid and its margin, at `BOARD_ART_SIZE`. */
  viewBox: { x: number; y: number; width: number; height: number }
  hexes: BoardHex[]
}

const cellKey = (column: number, row: number) => `${column}:${row}`

const round = (value: number) => Math.round(value * 10) / 10

/**
 * Where a board's battle grid falls on its art: each hex's outline and kind, and the crop that
 * frames the grid. Undefined for a board whose art size has no fit, so the caller shows the plain
 * picture.
 */
export function boardOverlay(board: GuildWarBoard): BoardOverlay | undefined {
  const fit = ART_FITS[`${board.visualColumns}x${board.visualRows}`]
  if (!fit) return undefined

  const attackers = new Set(
    board.attackerSpawns.map((cell) => cellKey(cell.column, cell.row))
  )
  const defenders = new Set(
    board.defenderSpawns.map((cell) => cellKey(cell.column, cell.row))
  )
  const kindOf = (tile: GuildWarBoard["tiles"][number]): BoardHexKind => {
    const key = cellKey(tile.column, tile.row)
    if (attackers.has(key)) return "attacker"
    if (defenders.has(key)) return "defender"
    return tile.blocked ? "blocked" : "open"
  }

  const toArt = (x: number, z: number): [number, number] => [
    fit.originX + x * fit.scaleX,
    fit.originZ - z * fit.scaleZ,
  ]
  const corners = (column: number, row: number, elevation: number) => {
    const visualColumn = column + board.visualFirstColumn
    const visualRow = row + board.visualFirstRow
    const x = 2 * APOTHEM * visualColumn + (visualRow % 2 === 1 ? APOTHEM : 0)
    const z = ROW_SPACING * visualRow + (elevation - GROUND) * RISE_PER_LEVEL
    return [
      toArt(x, z + RADIUS),
      toArt(x + APOTHEM, z + RADIUS / 2),
      toArt(x + APOTHEM, z - RADIUS / 2),
      toArt(x, z - RADIUS),
      toArt(x - APOTHEM, z - RADIUS / 2),
      toArt(x - APOTHEM, z + RADIUS / 2),
    ]
  }

  const hexes = board.tiles.map((tile) => ({
    column: tile.column,
    row: tile.row,
    kind: kindOf(tile),
    corners: corners(tile.column, tile.row, tile.elevation),
  }))

  const xs = hexes.flatMap((hex) => hex.corners.map(([x]) => x))
  const ys = hexes.flatMap((hex) => hex.corners.map(([, y]) => y))
  const marginX = MARGIN_HEXES * 2 * APOTHEM * fit.scaleX
  const marginY = MARGIN_HEXES * 2 * RADIUS * fit.scaleZ
  const left = Math.max(0, Math.min(...xs) - marginX)
  const top = Math.max(0, Math.min(...ys) - marginY)
  const right = Math.min(BOARD_ART_SIZE, Math.max(...xs) + marginX)
  const bottom = Math.min(BOARD_ART_SIZE, Math.max(...ys) + marginY)

  return {
    viewBox: {
      x: round(left),
      y: round(top),
      width: round(right - left),
      height: round(bottom - top),
    },
    hexes: hexes.map(({ corners: points, ...hex }) => ({
      ...hex,
      points: points.map(([x, y]) => `${round(x)},${round(y)}`).join(" "),
    })),
  }
}

/**
 * A square part of the art around a crop, for a square tile: as tall or wide as the crop and
 * centred on it, so the whole grid shows with the art around it filling the sides (no letterbox),
 * kept on the art.
 */
export function squareViewBox(
  viewBox: BoardOverlay["viewBox"]
): BoardOverlay["viewBox"] {
  const side = Math.min(BOARD_ART_SIZE, Math.max(viewBox.width, viewBox.height))
  const clamp = (start: number) =>
    Math.min(BOARD_ART_SIZE - side, Math.max(0, start))
  return {
    x: round(clamp(viewBox.x + (viewBox.width - side) / 2)),
    y: round(clamp(viewBox.y + (viewBox.height - side) / 2)),
    width: round(side),
    height: round(side),
  }
}
