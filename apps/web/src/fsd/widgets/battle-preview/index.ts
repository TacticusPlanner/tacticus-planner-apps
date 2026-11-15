// The battle preview pieces shared by the Legendary Event Battles section and the Quest Event battle
// detail: the board image with its mobile disclosure, the enemy tiles with their level and detail
// (popover on desktop, bottom sheet on mobile), and the enemy list. Copy stays in the
// `legendaryEvents` namespace (`battles.*`), where it was written. The campaign battle dialog a
// planned raid location opens (Today, Home) reuses the enemy list; its own copy is in `dailies`.
export {
  buildEnemyTile,
  type EnemyNpcs,
  type EnemyTileViewModel,
} from "./model/enemy-tile"
export { BoardMap } from "./ui/board-map"
export { CampaignBattleDialog } from "./ui/campaign-battle-dialog"
export { EnemyList } from "./ui/enemy-list"
