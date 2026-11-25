import type { ReactNode } from "react"
import { useTranslation } from "react-i18next"
import { Check, X } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { Checkbox } from "@workspace/ui/components/checkbox"

import { FloatingBar } from "@/shared/ui"

/**
 * The Goals selection bar, on the shared `FloatingBar` surface.
 *
 * `top` (desktop): a sticky bar between the toolbar and the list, above every group, like Gmail's.
 * It holds the count, the bulk actions (`children`, disabled until something is picked) and Clear
 * selection. Cards' select mode shows it from the start, with a select-all checkbox (`selectAll`) and
 * Done (`onDone`), which ends the mode. The table shows it only once something is selected; its
 * select-all is the checkbox in the table header.
 *
 * `bottom` (phones): select mode's pill pinned to the bottom of the viewport: the count, Select all,
 * the bulk actions and Done.
 */
export function GoalsSelectBar({
  placement,
  count,
  total,
  selectAll = false,
  onSelectAll,
  onClear,
  onDone,
  children,
}: {
  placement: "top" | "bottom"
  count: number
  /** How many goals the list shows, for the select-all checkbox's state. */
  total: number
  /** The top bar's select-all checkbox, for Cards, which have no header to hold it. */
  selectAll?: boolean
  onSelectAll: () => void
  onClear: () => void
  /** Ends select mode; absent where the checkboxes are always there (the desktop table). */
  onDone?: () => void
  children: ReactNode
}) {
  const { t } = useTranslation()
  const countText = (
    <p
      aria-live="polite"
      className="text-sm font-medium"
      data-testid="goals-select-count"
    >
      {t("goals.bulk.selected", { count })}
    </p>
  )
  const done = onDone ? (
    <Button data-testid="goals-select-done" onClick={onDone}>
      <Check data-icon="inline-start" />
      {t("goals.bulk.selectDone")}
    </Button>
  ) : null

  if (placement === "bottom") {
    return (
      <FloatingBar
        className="sticky bottom-[calc(var(--mobile-nav-height)+0.75rem)] flex flex-wrap items-center gap-3 p-2 pl-4"
        data-testid="goals-select-bar"
      >
        {countText}
        <Button
          data-testid="goals-select-bar-all"
          onClick={onSelectAll}
          variant="ghost"
        >
          {t("goals.bulk.selectAll")}
        </Button>
        <div className="flex flex-1 flex-wrap items-center gap-2">
          {children}
        </div>
        {done}
      </FloatingBar>
    )
  }

  const allSelected = total > 0 && count === total
  return (
    <FloatingBar
      className="sticky top-2 flex min-h-12 flex-wrap items-center gap-2 p-2 pl-4"
      data-testid="goals-select-bar"
      data-placement="top"
    >
      {selectAll ? (
        <Checkbox
          aria-label={t("goals.bulk.selectAll")}
          checked={allSelected ? true : count > 0 ? "indeterminate" : false}
          data-testid="goals-select-all"
          disabled={total === 0}
          onCheckedChange={onSelectAll}
        />
      ) : null}
      {countText}
      <div className="flex flex-1 flex-wrap items-center gap-1">{children}</div>
      <Button
        data-testid="goals-select-clear"
        disabled={count === 0}
        onClick={onClear}
        variant="ghost"
      >
        <X data-icon="inline-start" />
        {t("goals.bulk.clearSelection")}
      </Button>
      {done}
    </FloatingBar>
  )
}
