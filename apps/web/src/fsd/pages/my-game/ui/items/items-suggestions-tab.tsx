import { useCallback, useMemo } from "react"
import { useTranslation } from "react-i18next"
import { Button } from "@workspace/ui/components/button"

import { useItemName, useItemSlotName } from "@/shared/equipment"
import { EmptyState } from "@/shared/ui"
import { useUnitName } from "@/shared/unit-name"

import {
  suggestionsQueryNarrows,
  visibleSuggestions,
} from "../../model/items/suggestions-query"
import { useSuggestionsQuery } from "../../model/items/use-suggestions-query"
import { useItemsOutlet } from "./items-outlet"
import { SuggestionsToolbar } from "./suggestions/suggestions-toolbar"
import { SuggestionCard, UnwornRelics } from "./suggestions/suggestion-cards"
import type { SuggestionsContext } from "./suggestions/suggestion-cards"

/**
 * My game > Items > Suggestions: what to equip with the spares already held. One card per character
 * with an empty slot or a better spare, the ones gaining most first, each row saying why; then the
 * spare relics with who could wear them.
 */
export function ItemsSuggestionsTab() {
  const { t, i18n } = useTranslation(["myItems", "factions"])
  const { owned, suggestions, itemsById } = useItemsOutlet()
  const { query, update } = useSuggestionsQuery()
  const itemName = useItemName()
  const slotName = useItemSlotName()
  const unitNameOf = useUnitName()
  const unitName = useCallback(
    (id: string) => unitNameOf("Character", id),
    [unitNameOf]
  )

  const context: SuggestionsContext = useMemo(() => {
    const rarities = new Map(owned.characters.map((c) => [c.id, c.rarity]))
    return {
      itemOf: (id) => itemsById.get(id),
      itemName,
      slotName,
      unitName,
      rarityOf: (id) => rarities.get(id),
    }
  }, [owned.characters, itemsById, itemName, slotName, unitName])

  const factions = useMemo(
    () =>
      [...new Set(suggestions.characters.map((entry) => entry.faction))]
        .map((id) => ({ id, name: t(`factions:${id}`, { defaultValue: id }) }))
        .toSorted((a, b) => a.name.localeCompare(b.name, i18n.language)),
    [suggestions.characters, t, i18n.language]
  )

  const visible = useMemo(
    () =>
      visibleSuggestions(suggestions.characters, query, {
        nameOf: unitName,
        locale: i18n.language,
      }),
    [suggestions.characters, query, unitName, i18n.language]
  )

  const narrowed = suggestionsQueryNarrows(query)
  return (
    <div className="flex flex-col gap-4">
      <SuggestionsToolbar factions={factions} query={query} update={update} />
      {visible.length > 0 ? (
        <ul className="grid grid-cols-[repeat(auto-fill,minmax(20rem,1fr))] gap-2">
          {visible.map((entry) => (
            <li key={entry.characterId}>
              <SuggestionCard context={context} entry={entry} />
            </li>
          ))}
        </ul>
      ) : narrowed ? (
        <EmptyState
          actions={
            <Button
              onClick={() =>
                update(
                  query.faction.length > 0 ? { q: "", faction: [] } : { q: "" }
                )
              }
              variant="outline"
            >
              {query.faction.length > 0
                ? t("suggestions.toolbar.clearFilters")
                : t("suggestions.noMatch.clearSearch")}
            </Button>
          }
          description={t("suggestions.noMatch.description")}
          testId="items-suggestions-no-match"
          title={t("suggestions.noMatch.title")}
          variant="no-match"
        />
      ) : (
        <EmptyState
          description={t("suggestions.none.description")}
          testId="items-suggestions-none"
          title={t("suggestions.none.title")}
        />
      )}
      <UnwornRelics context={context} relics={suggestions.relics} />
    </div>
  )
}
