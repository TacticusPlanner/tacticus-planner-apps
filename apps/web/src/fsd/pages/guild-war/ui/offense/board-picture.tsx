import { useId, useMemo } from "react"
import { cn } from "@workspace/ui/lib/utils"

import {
  BOARD_ART_SIZE,
  boardOverlay,
  squareViewBox,
} from "../../model/board-overlay"
import type { BoardHexKind, GuildWarBoard } from "../../model/board-overlay"

// Kept light, as the game's own deploy screen is: a faint grid, the attacker's deployment hexes
// outlined in the game's blue, the defender's in a thinner red and blocked hexes only shaded, so
// the board art stays readable underneath.
const hexStyles: Record<BoardHexKind, { className: string; width: number }> = {
  open: {
    className: "fill-transparent stroke-(--guild-war-grid)/35",
    width: 1,
  },
  blocked: {
    className: "fill-(--guild-war-blocked)/30 stroke-(--guild-war-grid)/20",
    width: 1,
  },
  defender: {
    className:
      "fill-(--guild-war-defender)/10 stroke-(--guild-war-defender)/80",
    width: 1.5,
  },
  attacker: {
    className: "fill-(--guild-war-attacker)/20 stroke-(--guild-war-attacker)",
    width: 2.5,
  },
}

// Coloured outlines are drawn last, so a neighbour's grid line never covers them.
const drawOrder: BoardHexKind[] = ["open", "blocked", "defender", "attacker"]

/**
 * A map-pool board's art cropped to its battle grid, with a faint hex grid, the attacker's and
 * defender's deployment hexes outlined and the blocked hexes shaded, so it reads like the game's
 * deploy screen. `fit` "cover" fills a square tile (the picker) with the grid and the art around it,
 * marking only the deployment and blocked hexes; "contain" shows the whole grid (the zoomed view). Without a board grid (or one whose art size has no fit), the plain art.
 */
export function BoardPicture({
  src,
  board,
  alt,
  fit,
  className,
  lazy = false,
}: {
  src: string
  board: GuildWarBoard | undefined
  alt: string
  fit: "cover" | "contain"
  className?: string
  lazy?: boolean
}) {
  const clipId = useId()
  const overlay = useMemo(
    () => (board ? boardOverlay(board) : undefined),
    [board]
  )
  if (!overlay) {
    return (
      <img
        alt={alt}
        className={cn(
          fit === "cover" ? "object-cover" : "object-contain",
          className
        )}
        decoding="async"
        loading={lazy ? "lazy" : undefined}
        src={src}
      />
    )
  }
  // A tile is too small for the whole grid: it shows only the marked hexes, with thinner lines,
  // on a square around the grid.
  const tile = fit === "cover"
  const { x, y, width, height } = tile
    ? squareViewBox(overlay.viewBox)
    : overlay.viewBox
  const hexes = overlay.hexes
    .filter((hex) => !tile || hex.kind !== "open")
    .toSorted((a, b) => drawOrder.indexOf(a.kind) - drawOrder.indexOf(b.kind))
  return (
    <svg
      aria-label={alt || undefined}
      aria-hidden={alt ? undefined : true}
      className={className}
      data-testid="guild-war-board-grid"
      preserveAspectRatio="xMidYMid meet"
      role={alt ? "img" : undefined}
      viewBox={`${x} ${y} ${width} ${height}`}
    >
      {/* "contain" letterboxes the crop: clip to it so the rest of the art stays hidden. */}
      <clipPath id={clipId}>
        <rect height={height} width={width} x={x} y={y} />
      </clipPath>
      <g clipPath={`url(#${clipId})`}>
        <rect
          className="fill-(--guild-war-water)"
          height={height}
          width={width}
          x={x}
          y={y}
        />
        <image
          data-testid="guild-war-board-art"
          height={BOARD_ART_SIZE}
          href={src}
          preserveAspectRatio="none"
          width={BOARD_ART_SIZE}
        />
        {hexes.map((hex) => (
          <polygon
            className={hexStyles[hex.kind].className}
            data-hex={hex.kind}
            data-testid="guild-war-board-hex"
            key={`${hex.column}:${hex.row}`}
            points={hex.points}
            strokeLinejoin="round"
            strokeWidth={hexStyles[hex.kind].width * (tile ? 0.6 : 1)}
            vectorEffect="non-scaling-stroke"
          />
        ))}
      </g>
    </svg>
  )
}

const legendSwatches: {
  kind: Exclude<BoardHexKind, "open">
  className: string
}[] = [
  {
    kind: "attacker",
    className:
      "border-2 border-(--guild-war-attacker) bg-(--guild-war-attacker)/20",
  },
  {
    kind: "defender",
    className:
      "border border-(--guild-war-defender)/80 bg-(--guild-war-defender)/10",
  },
  {
    kind: "blocked",
    className: "border border-border bg-(--guild-war-blocked)/30",
  },
]

/** What the marked hexes of `BoardPicture` mean. */
export function BoardLegend({
  labels,
}: {
  labels: Record<Exclude<BoardHexKind, "open">, string>
}) {
  return (
    <ul
      className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground"
      data-testid="guild-war-board-legend"
    >
      {legendSwatches.map(({ kind, className }) => (
        <li className="flex items-center gap-1.5" key={kind}>
          <span aria-hidden className={cn("size-3 rounded-sm", className)} />
          {labels[kind]}
        </li>
      ))}
    </ul>
  )
}
