import type { EnemyTileViewModel } from "../model/enemy-tile"
import { EnemyTile } from "./enemy-tile"

/** A battle's (or wave's) enemy tiles in served order, in a grid whose columns follow the list's own
 *  width (a container query), so a narrow column beside a board keeps names readable. */
export function EnemyList({
  tiles,
  isMobile,
}: {
  tiles: readonly EnemyTileViewModel[]
  isMobile: boolean
}) {
  return (
    <div className="@container min-w-0" data-testid="battle-enemy-list">
      <ul className="grid min-w-0 grid-cols-1 gap-2 @md:grid-cols-2 @2xl:grid-cols-3">
        {tiles.map((tile) => (
          <li className="min-w-0" key={tile.key}>
            <EnemyTile isMobile={isMobile} tile={tile} />
          </li>
        ))}
      </ul>
    </div>
  )
}
