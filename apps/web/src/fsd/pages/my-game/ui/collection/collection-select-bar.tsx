import { useTranslation } from "react-i18next"
import { Check, ListChecks, Target, X } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { useIsMobile } from "@workspace/ui/hooks/use-mobile"
import { cn } from "@workspace/ui/lib/utils"

/**
 * Select mode's bar, pinned to the bottom of the viewport: the selected count, Select all shown,
 * Clear, Create goals and Done (player-collection spec). On mobile it sits above the fixed bottom nav
 * and leaves the scroll-to-top button's column free, like `UnsavedChangesBar`.
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
  const isMobile = useIsMobile()
  return (
    <div
      className={cn(
        "sticky z-20 flex flex-wrap items-center gap-2 rounded-2xl border bg-card p-2 pl-4 shadow-lg",
        isMobile
          ? "bottom-[calc(var(--mobile-nav-height)+1rem)] mr-14"
          : "bottom-3"
      )}
      data-mobile={isMobile ? "true" : undefined}
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
