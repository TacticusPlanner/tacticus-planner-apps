import type { ReactNode } from "react"
import { useTranslation } from "react-i18next"
import { Spinner } from "@workspace/ui/components/spinner"

export type PreviewState = "loading" | "failed" | "empty" | "content"

/**
 * A "Resources needed" box that always states what it has (goal-creation: every preview section states
 * what it has): loading, failed, not applicable with `emptyText` as the reason, or its content. Never an
 * empty box.
 */
export function PreviewSection({
  state,
  emptyText,
  testId,
  title,
  className,
  children,
}: {
  state: PreviewState
  emptyText: string
  testId: string
  title?: string
  className?: string
  children?: ReactNode
}) {
  const { t } = useTranslation()

  return (
    <div
      className={className ?? "grid gap-1 rounded-2xl border p-3 text-sm"}
      data-state={state}
      data-testid={testId}
    >
      <p className="font-medium">{title ?? t("goals.create.previewTitle")}</p>
      {state === "loading" ? (
        <p className="flex items-center gap-1.5 text-muted-foreground">
          <Spinner />
          {t("goals.create.previewLoading")}
        </p>
      ) : state === "failed" ? (
        <p className="text-destructive">{t("goals.create.previewFailed")}</p>
      ) : state === "empty" ? (
        <p className="text-muted-foreground">{emptyText}</p>
      ) : (
        children
      )}
    </div>
  )
}
