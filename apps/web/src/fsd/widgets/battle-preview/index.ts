// The battle preview pieces shared by the Legendary Event Battles section and the Quest Event battle
// detail: the board image with its mobile disclosure, the enemy tiles with their level and detail
// (popover on desktop, bottom sheet on mobile), and the enemy list. Copy stays in the
// `legendaryEvents` namespace (`battles.*`), where it was written.
export {
  buildEnemyTile,
  type EnemyNpcs,
  type EnemyTileViewModel,
} from "./model/enemy-tile"
export { BoardMap } from "./ui/board-map"
export { EnemyList } from "./ui/enemy-list"
export { EnemyTile } from "./ui/enemy-tile"
export { useEnemyLabels } from "./ui/enemy-label"
