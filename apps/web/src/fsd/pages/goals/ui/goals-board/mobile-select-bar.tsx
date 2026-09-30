import type { ReactNode } from "react"
import { useTranslation } from "react-i18next"
import { Check } from "lucide-react"
import { Button } from "@workspace/ui/components/button"

/** The select mode's bottom bar, pinned to the viewport like `MobileReorderBar` (feature-level order
 *  UI; this is selection UI, so it lives in the page slice). `children` is the compact bulk-action strip. */
export function MobileSelectBar({
  count,
  onDone,
  children,
}: {
  count: number
  onDone: () => void
  children: ReactNode
}) {
  const { t } = useTranslation()
  return (
    <div
      className="sticky bottom-3 z-20 flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-card p-2 pl-4 shadow-lg"
      data-testid="mobile-select-bar"
    >
      <p
        aria-live="polite"
        className="text-sm text-muted-foreground"
        data-testid="mobile-select-count"
      >
        {t("goals.bulk.selected", { count })}
      </p>
      {children}
      <Button
        className="min-h-11 min-w-24"
        data-testid="mobile-select-done"
        onClick={onDone}
        size="lg"
      >
        <Check aria-hidden />
        {t("goals.bulk.selectDone")}
      </Button>
    </div>
  )
}
