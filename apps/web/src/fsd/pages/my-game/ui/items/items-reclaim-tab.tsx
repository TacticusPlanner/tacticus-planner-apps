import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { Button } from "@workspace/ui/components/button"

import { useItemName, useItemSlotName } from "@/shared/equipment"
import { EmptyState } from "@/shared/ui"

import { planReclaim } from "../../model/items/reclaim"
import {
  filterReclaimStacks,
  groupReclaimStacks,
} from "../../model/items/reclaim-query"
import { suggestedCopies } from "../../model/items/suggestions"
import { useReclaimQuery } from "../../model/items/use-reclaim-query"
import { useItemsOutlet } from "./items-outlet"
import { ReclaimList, ReclaimSummary } from "./reclaim/reclaim-list"
import { ReclaimToolbar } from "./reclaim/reclaim-toolbar"

/**
 * My game > Items > Reclaim: the spare copies safe to turn into salvage (row 10 B), what they'd
 * return, and why each stack is or isn't safe. It only advises: the player reclaims in the game.
 */
export function ItemsReclaimTab() {
  const { t, i18n } = useTranslation("myItems")
  const { owned, suggestions, itemsById, charactersById } = useItemsOutlet()
  const { query, update } = useReclaimQuery()
  const itemName = useItemName()
  const slotName = useItemSlotName()

  const plan = useMemo(
    () =>
      planReclaim({
        owned,
        catalogCharacters: charactersById,
        itemsById,
        reserved: suggestedCopies(suggestions),
      }),
    [owned, charactersById, itemsById, suggestions]
  )
  const groups = useMemo(
    () =>
      groupReclaimStacks(
        filterReclaimStacks(plan.stacks, query, {
          nameOf: itemName,
          locale: i18n.language,
        })
      ),
    [plan.stacks, query, itemName, i18n.language]
  )

  return (
    <div className="flex flex-col gap-4">
      <ReclaimToolbar query={query} update={update} />
      <ReclaimSummary plan={plan} />
      {groups.length > 0 ? (
        <ReclaimList groups={groups} itemName={itemName} slotName={slotName} />
      ) : query.q.trim() === "" ? (
        <EmptyState
          actions={
            query.safe ? (
              <Button onClick={() => update({ safe: false })} variant="outline">
                {t("reclaim.none.showAll")}
              </Button>
            ) : undefined
          }
          description={t("reclaim.none.description")}
          testId="items-reclaim-none"
          title={t("reclaim.none.title")}
        />
      ) : (
        <EmptyState
          actions={
            <Button onClick={() => update({ q: "" })} variant="outline">
              {t("reclaim.noMatch.clearSearch")}
            </Button>
          }
          description={t("reclaim.noMatch.description")}
          testId="items-reclaim-no-match"
          title={t("reclaim.noMatch.title")}
          variant="no-match"
        />
      )}
    </div>
  )
}
