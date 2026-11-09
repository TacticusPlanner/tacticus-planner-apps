import { useTranslation } from "react-i18next"
import { Check, ListChecks, Target, X } from "lucide-react"
import { Button } from "@workspace/ui/components/button"

/**
 * Select mode's bar, pinned to the bottom of the viewport: the selected count, Select all shown,
 * Clear, Create goals and Done (player-collection spec).
 */
export function CollectionSelectBar({
  count,
  onSelectAll,
  onClear,
  onCreate,
  onDone,
}: {
  count: number
  onSelectAll: () => void
  onClear: () => void
  onCreate: () => void
  onDone: () => void
}) {
  const { t } = useTranslation("common")
  return (
    <div
      className="sticky bottom-3 z-20 flex flex-wrap items-center gap-2 rounded-2xl border bg-card p-2 pl-4 shadow-lg"
      data-testid="collection-select-bar"
    >
      <p
        aria-live="polite"
        className="mr-auto text-sm text-muted-foreground"
        data-testid="collection-select-count"
      >
        {t("myGame.collection.select.count", { count })}
      </p>
      <Button
        data-testid="collection-select-all"
        onClick={onSelectAll}
        size="sm"
        variant="ghost"
      >
        <ListChecks aria-hidden />
        {t("myGame.collection.select.selectAll")}
      </Button>
      <Button
        data-testid="collection-select-clear"
        disabled={count === 0}
        onClick={onClear}
        size="sm"
        variant="ghost"
      >
        <X aria-hidden />
        {t("myGame.collection.select.clear")}
      </Button>
      <Button
        data-testid="collection-select-create"
        disabled={count === 0}
        onClick={onCreate}
        size="sm"
      >
        <Target aria-hidden />
        {t("myGame.collection.select.createGoals")}
      </Button>
      <Button
        data-testid="collection-select-done"
        onClick={onDone}
        size="sm"
        variant="outline"
      >
        <Check aria-hidden />
        {t("myGame.collection.select.done")}
      </Button>
    </div>
  )
}
