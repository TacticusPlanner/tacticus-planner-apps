import { useId } from "react"
import { useTranslation } from "react-i18next"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@workspace/ui/components/toggle-group"

import { FILTER_CHIP_CLASS_NAME } from "@/shared/ui"

import {
  collectionQuickFilters,
  isCollectionQuickFilter,
  type CollectionQuickFilter,
} from "../../model/collection-query"
import type { QuickFilterAvailability } from "../../model/use-collection-view"

type Unavailable = Extract<
  QuickFilterAvailability,
  "needsRoster" | "needsInventory" | "failed"
>

const isUnavailable = (
  availability: QuickFilterAvailability
): availability is Unavailable =>
  availability === "needsRoster" ||
  availability === "needsInventory" ||
  availability === "failed"

/**
 * The quick filters as a single-select chip row: selecting a chip selects it, selecting it again
 * clears it. A chip whose data is missing is disabled, and one line per reason below the row says
 * why (each disabled chip points at its line).
 */
export function QuickFilterChips({
  value,
  availability,
  onChange,
}: {
  value: CollectionQuickFilter | null
  availability: Record<CollectionQuickFilter, QuickFilterAvailability>
  onChange: (next: CollectionQuickFilter | null) => void
}) {
  const { t, i18n } = useTranslation("common")
  const noteId = useId()
  const label = (quick: CollectionQuickFilter) =>
    t(`myGame.collection.toolbar.quick.${quick}`)
  const list = new Intl.ListFormat(i18n.language, { type: "conjunction" })

  const byReason = new Map<Unavailable, CollectionQuickFilter[]>()
  for (const quick of collectionQuickFilters) {
    const status = availability[quick]
    if (isUnavailable(status)) {
      byReason.set(status, [...(byReason.get(status) ?? []), quick])
    }
  }
  const notes = [...byReason.entries()].map(([reason, quicks]) => ({
    reason,
    text:
      reason === "needsRoster"
        ? t("myGame.collection.toolbar.quickNeedsRoster")
        : t(
            reason === "needsInventory"
              ? "myGame.collection.toolbar.quickNeedsInventory"
              : "myGame.collection.toolbar.quickFailed",
            { filters: list.format(quicks.map(label)) }
          ),
  }))

  return (
    <div
      className="flex flex-col gap-1.5"
      data-testid="collection-quick-filters"
    >
      {/* A visible caption, so the chip row reads as filters rather than loose buttons. */}
      <span id={`${noteId}-label`} className="text-xs text-muted-foreground">
        {t("myGame.collection.toolbar.quickFilters")}
      </span>
      <ToggleGroup
        type="single"
        variant="outline"
        size="sm"
        spacing={1}
        className="flex-wrap"
        aria-labelledby={`${noteId}-label`}
        value={value ?? ""}
        onValueChange={(next) =>
          onChange(isCollectionQuickFilter(next) ? next : null)
        }
      >
        {collectionQuickFilters.map((quick) => {
          const status = availability[quick]
          return (
            <ToggleGroupItem
              key={quick}
              value={quick}
              className={FILTER_CHIP_CLASS_NAME}
              disabled={isUnavailable(status)}
              title={t(`myGame.collection.toolbar.quickHelp.${quick}`)}
              aria-describedby={
                isUnavailable(status) ? `${noteId}-${status}` : undefined
              }
            >
              {label(quick)}
            </ToggleGroupItem>
          )
        })}
      </ToggleGroup>
      {notes.map((note) => (
        <p
          key={note.reason}
          id={`${noteId}-${note.reason}`}
          className="text-xs text-muted-foreground"
        >
          {note.text}
        </p>
      ))}
    </div>
  )
}
