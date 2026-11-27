import { useCallback, useMemo } from "react"
import { useTranslation } from "react-i18next"
import { Button } from "@workspace/ui/components/button"

import { useItemName, useItemSlotName } from "@/shared/equipment"
import { EmptyState } from "@/shared/ui"
import { useUnitName } from "@/shared/unit-name"

import {
  CLEARED_PIECES_FILTERS,
  filterPieces,
  groupPieces,
  piecesQueryNarrows,
} from "../../model/items/pieces-query"
import type { PiecesCharacterIndex } from "../../model/items/pieces-query"
import { usePiecesQuery } from "../../model/items/use-pieces-query"
import { useItemsOutlet } from "./items-outlet"
import { PieceDetailsDialog } from "./pieces/piece-details-dialog"
import { PiecesList } from "./pieces/pieces-list"
import type { PiecesListContext } from "./pieces/pieces-list"
import { PiecesToolbar } from "./pieces/pieces-toolbar"
import type { PiecesFilterOptions } from "./pieces/pieces-toolbar"
import { SyncNowButton } from "./sync-now-button"

/**
 * My game > Items > Pieces: every item the player holds or a character wears, one card (or table
 * row) per item with each owned level, its spares and its wearers. A card opens the item's details.
 */
export function ItemsPiecesTab() {
  const { t, i18n } = useTranslation(["myItems", "factions"])
  const { owned, itemsById } = useItemsOutlet()
  const { query, update } = usePiecesQuery()
  const itemName = useItemName()
  const slotName = useItemSlotName()
  const unitNameOf = useUnitName()
  const unitName = useCallback(
    (id: string) => unitNameOf("Character", id),
    [unitNameOf]
  )
  const factionName = useCallback(
    (id: string) => t(`factions:${id}`, { defaultValue: id }),
    [t]
  )

  const characters: PiecesCharacterIndex = useMemo(
    () =>
      new Map(
        owned.characters.map((character) => [
          character.id,
          {
            faction: character.faction,
            eligible: new Set(character.eligible.flatMap((slot) => [...slot])),
          },
        ])
      ),
    [owned.characters]
  )

  const context: PiecesListContext = useMemo(() => {
    const rarities = new Map(
      owned.characters.map((character) => [character.id, character.rarity])
    )
    const factions = new Set(
      [...itemsById.values()].flatMap((item) => item.allowedFactions)
    )
    return {
      itemName,
      slotName,
      unitName,
      factionName,
      rarityOf: (id) => rarities.get(id),
      factionCount: factions.size,
    }
  }, [owned.characters, itemsById, itemName, slotName, unitName, factionName])

  const options: PiecesFilterOptions = useMemo(() => {
    const byName = (a: { name: string }, b: { name: string }) =>
      a.name.localeCompare(b.name, i18n.language)
    return {
      factions: [...new Set(owned.characters.map((c) => c.faction))]
        .map((id) => ({ id, name: factionName(id) }))
        .toSorted(byName),
      characters: owned.characters
        .map((c) => ({ id: c.id, name: unitName(c.id) }))
        .toSorted(byName),
    }
  }, [owned.characters, factionName, unitName, i18n.language])

  const groups = useMemo(
    () =>
      groupPieces(
        filterPieces(owned.pieces, query, {
          nameOf: itemName,
          characters,
          locale: i18n.language,
        }),
        query.group
      ),
    [owned.pieces, query, itemName, characters, i18n.language]
  )
  const selected = query.piece
    ? owned.pieces.find((piece) => piece.item.id === query.piece)
    : undefined

  if (owned.pieces.length === 0) {
    return (
      <EmptyState
        actions={<SyncNowButton />}
        description={t("pieces.none.description")}
        testId="items-pieces-none"
        title={t("pieces.none.title")}
      />
    )
  }

  const searchOnly = !piecesQueryNarrows({ ...query, q: "" })
  return (
    <div className="flex flex-col gap-4">
      <PiecesToolbar options={options} query={query} update={update} />
      {groups.length === 0 ? (
        <EmptyState
          actions={
            <Button
              onClick={() =>
                update(searchOnly ? { q: "" } : CLEARED_PIECES_FILTERS)
              }
              variant="outline"
            >
              {searchOnly
                ? t("pieces.noMatch.clearSearch")
                : t("pieces.toolbar.clearFilters")}
            </Button>
          }
          description={t("pieces.noMatch.description")}
          testId="items-pieces-no-match"
          title={t("pieces.noMatch.title")}
          variant="no-match"
        />
      ) : (
        <PiecesList
          context={context}
          group={query.group}
          groups={groups}
          layout={query.layout}
          onOpen={(piece) => update({ piece: piece.item.id })}
        />
      )}
      {owned.unknownCopies > 0 ? (
        <p
          className="text-xs text-muted-foreground"
          data-testid="items-unknown-copies"
        >
          {t("pieces.unknown", { count: owned.unknownCopies })}
        </p>
      ) : null}
      <PieceDetailsDialog
        context={context}
        onOpenChange={(open) => {
          if (!open) update({ piece: null })
        }}
        piece={selected}
      />
    </div>
  )
}
