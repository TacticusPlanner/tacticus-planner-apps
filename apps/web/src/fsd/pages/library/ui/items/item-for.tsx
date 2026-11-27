import { Link } from "react-router"
import { characterIcon, factionIcon } from "@workspace/game-catalog"
import type {
  CharacterStorageModel,
  EquipmentStorageModel,
} from "@workspace/game-catalog"

import { UnitPortrait, unitLibraryPath } from "@/entities/unit"
import { EntityIcon } from "@/shared/ui"
import { useUnitName } from "@/shared/unit-name"

/**
 * Who can use an item: a relic's characters (each linking to its Library page) or the item's
 * factions. `compact` shows icons only, up to three, for a list card; nothing when the item is for
 * every faction or for no one. An item with no factions and no characters can't be worn by anyone
 * (the catalog gives a character an item only through one of the two lists).
 */
export function ItemFor({
  item,
  charactersById,
  factionName,
  factionCount,
  compact = false,
  everyoneLabel,
  nobodyLabel,
}: {
  item: EquipmentStorageModel
  charactersById: ReadonlyMap<string, CharacterStorageModel>
  factionName: (id: string) => string
  factionCount: number
  compact?: boolean
  everyoneLabel?: string
  nobodyLabel?: string
}) {
  const unitName = useUnitName()
  const limit = compact ? 3 : Infinity
  if (item.allowedUnits.length > 0) {
    const shown = item.allowedUnits.slice(0, limit)
    return (
      <ul
        className={
          compact ? "flex items-center gap-1" : "flex flex-wrap gap-x-4 gap-y-2"
        }
      >
        {shown.map((id) => {
          const portrait = (
            <UnitPortrait
              alt={compact ? unitName("Character", id) : ""}
              rarity={charactersById.get(id)?.initialRarity}
              size="portrait-sm"
              src={characterIcon(id) ?? ""}
            />
          )
          return (
            <li className="flex items-center gap-2 text-sm" key={id}>
              {compact ? (
                portrait
              ) : (
                <Link
                  className="flex items-center gap-2 rounded-sm underline-offset-2 hover:underline"
                  to={unitLibraryPath("character", id)}
                >
                  {portrait}
                  {unitName("Character", id)}
                </Link>
              )}
            </li>
          )
        })}
        {item.allowedUnits.length > shown.length ? (
          <li className="text-xs text-muted-foreground tabular-nums">
            +{item.allowedUnits.length - shown.length}
          </li>
        ) : null}
      </ul>
    )
  }
  if (item.allowedFactions.length === 0) {
    return nobodyLabel ? (
      <p className="text-sm text-muted-foreground">{nobodyLabel}</p>
    ) : null
  }
  if (item.allowedFactions.length >= factionCount) {
    return everyoneLabel ? (
      <p className="text-sm text-muted-foreground">{everyoneLabel}</p>
    ) : null
  }
  const shown = item.allowedFactions.slice(0, limit)
  return (
    <ul
      className={
        compact ? "flex items-center gap-1" : "flex flex-wrap gap-x-4 gap-y-2"
      }
    >
      {shown.map((id) => (
        <li className="flex items-center gap-1.5 text-sm" key={id}>
          <EntityIcon
            alt={compact ? factionName(id) : ""}
            size="icon"
            src={factionIcon(id)}
          />
          {compact ? null : factionName(id)}
        </li>
      ))}
      {item.allowedFactions.length > shown.length ? (
        <li className="text-xs text-muted-foreground tabular-nums">
          +{item.allowedFactions.length - shown.length}
        </li>
      ) : null}
    </ul>
  )
}
