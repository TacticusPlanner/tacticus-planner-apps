import type { EnemyTileViewModel } from "../model/enemy-tile"
import { EnemyTile } from "./enemy-tile"

/** A battle's (or wave's) enemy tiles in served order, in a responsive grid. */
export function EnemyList({
  tiles,
  isMobile,
}: {
  tiles: readonly EnemyTileViewModel[]
  isMobile: boolean
}) {
  return (
    <ul className="grid min-w-0 grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
      {tiles.map((tile) => (
        <li className="min-w-0" key={tile.key}>
          <EnemyTile isMobile={isMobile} tile={tile} />
        </li>
      ))}
    </ul>
  )
}
