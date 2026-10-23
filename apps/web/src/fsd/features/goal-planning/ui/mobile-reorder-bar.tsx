import { useTranslation } from "react-i18next"
import { Check, Loader2 } from "lucide-react"
import { Button } from "@workspace/ui/components/button"

/**
 * The exit control of the mobile reorder mode, pinned to the bottom of the viewport so it stays in
 * reach while lower rows are dragged — the header's toggle may be scrolled far out of view by then.
 * "Done" only leaves the mode: each drop is saved as it completes. The status line beside it is a
 * polite live region, so a save in flight is perceivable next to the list.
 */
export function MobileReorderBar({
  onDone,
  pending,
}: {
  onDone: () => void
  pending: boolean
}) {
  const { t } = useTranslation()
  return (
    <div
      className="sticky bottom-3 z-20 flex items-center justify-between gap-3 rounded-2xl border bg-card p-2 pl-4 shadow-lg"
      data-testid="mobile-reorder-bar"
    >
      <p
        aria-live="polite"
        className="flex items-center gap-2 text-sm text-muted-foreground"
        data-testid="mobile-reorder-status"
      >
        {pending ? (
          <>
            <Loader2 aria-hidden className="size-4 animate-spin" />
            {t("goals.order.saving")}
          </>
        ) : (
          t("goals.order.dragHint")
        )}
      </p>
      <Button
        className="min-h-11 min-w-24"
        data-testid="mobile-reorder-done"
        onClick={onDone}
        size="lg"
      >
        <Check aria-hidden />
        {t("goals.project.reorderDone")}
      </Button>
    </div>
  )
}
