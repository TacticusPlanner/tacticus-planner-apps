import { useId, useMemo } from "react"
import { cn } from "@workspace/ui/lib/utils"

import { BOARD_ART_SIZE, boardOverlay } from "../../model/board-overlay"
import type { BoardHexKind, GuildWarBoard } from "../../model/board-overlay"

const hexClasses: Record<BoardHexKind, string> = {
  attacker: "fill-(--guild-war-attacker)/45",
  defender: "fill-(--guild-war-defender)/45",
  blocked: "fill-(--guild-war-blocked)/55",
  open: "fill-transparent",
}

/**
 * A map-pool board's art cropped to its battle grid, with each hex outlined and the attacker's and
 * defender's deployment hexes and the blocked hexes filled, so it reads like the game's deploy
 * screen. `fit` "cover" fills a square tile (the picker), "contain" shows the whole grid (the zoomed
 * view). Without a board grid (or one whose art size has no fit), the plain art.
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
  const { x, y, width, height } = overlay.viewBox
  return (
    <svg
      aria-label={alt || undefined}
      aria-hidden={alt ? undefined : true}
      className={className}
      data-testid="guild-war-board-grid"
      preserveAspectRatio={fit === "cover" ? "xMidYMid slice" : "xMidYMid meet"}
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
        {overlay.hexes.map((hex) => (
          <polygon
            className={cn("stroke-(--guild-war-grid)/75", hexClasses[hex.kind])}
            data-hex={hex.kind}
            data-testid="guild-war-board-hex"
            key={`${hex.column}:${hex.row}`}
            points={hex.points}
            strokeLinejoin="round"
            strokeWidth={1}
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
  { kind: "attacker", className: "bg-(--guild-war-attacker)/45" },
  { kind: "defender", className: "bg-(--guild-war-defender)/45" },
  { kind: "blocked", className: "bg-(--guild-war-blocked)/55" },
]

/** What the filled hexes of `BoardPicture` mean. */
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
          <span
            aria-hidden
            className={cn("size-3 rounded-sm ring-1 ring-border", className)}
          />
          {labels[kind]}
        </li>
      ))}
    </ul>
  )
}
