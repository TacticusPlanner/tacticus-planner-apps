import type { ReactNode } from "react"
import { useTranslation } from "react-i18next"
import { Check } from "lucide-react"
import { Button } from "@workspace/ui/components/button"

/** Select mode's bar, pinned to the bottom of the viewport like Collection's select bar: the count,
 *  Select all, the bulk actions (`children`) and Done, which ends select mode. */
export function GoalsSelectBar({
  count,
  onSelectAll,
  onDone,
  children,
}: {
  count: number
  onSelectAll: () => void
  onDone: () => void
  children: ReactNode
}) {
  const { t } = useTranslation()
  return (
    <div
      className="sticky bottom-3 z-20 flex flex-wrap items-center gap-3 rounded-2xl border bg-card p-2 pl-4 shadow-lg"
      data-testid="goals-select-bar"
    >
      <p
        aria-live="polite"
        className="text-sm text-muted-foreground"
        data-testid="goals-select-count"
      >
        {t("goals.bulk.selected", { count })}
      </p>
      <Button
        data-testid="goals-select-bar-all"
        onClick={onSelectAll}
        variant="ghost"
      >
        {t("goals.bulk.selectAll")}
      </Button>
      <div className="flex flex-1 flex-wrap items-center gap-2">{children}</div>
      <Button data-testid="goals-select-done" onClick={onDone}>
        <Check data-icon="inline-start" />
        {t("goals.bulk.selectDone")}
      </Button>
    </div>
  )
}
