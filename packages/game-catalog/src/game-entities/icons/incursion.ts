import { curatedAssetUrl, datamineAssetUrl } from "./asset-path"
import { battleBoardImage } from "./battle-board"

// The run-map enhancement icons, keyed by the `type` an Incursion enhancement carries.
const enhancementIconFiles: Record<string, string> = {
  AddTrait: "add_trait",
  CritBoost: "critboost",
  DamageBoost: "damage_boost",
  Heal: "heal",
  HitBoost: "hitboost",
  LifeSteal: "lifesteal",
  PierceBoost: "pierce_boost",
  Regeneration: "regeneration",
  Resurrect: "resurrect",
  Summons: "summon",
}

/** The game's run-map icon for an Incursion enhancement type, or `undefined` for one it has none for. */
export function incursionEnhancementIcon(type: string): string | undefined {
  const file = enhancementIconFiles[type]
  return file
    ? datamineAssetUrl(`atlases/ui_icon_enhancement_${file}_01.webp`)
    : undefined
}

/** The Machines of War event's run token. */
export function incursionTokenIcon(): string {
  return datamineAssetUrl("liveevents/ui_icon_battle_token_mow.webp")
}

/**
 * An Incursion battle's board: the annotated board (spawn zones marked) when one ships, else the
 * game's plain board art, downscaled into curated/incursion_boards for every board Incursions use.
 */
export function incursionBoardImage(boardId: string): string {
  return (
    battleBoardImage(boardId) ??
    curatedAssetUrl(`incursion_boards/${boardId}.webp`)
  )
}
