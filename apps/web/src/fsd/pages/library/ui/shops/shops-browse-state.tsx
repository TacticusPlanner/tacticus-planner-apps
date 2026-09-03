import { useTranslation } from "react-i18next"
import { Button } from "@workspace/ui/components/button"
import { Card, CardContent } from "@workspace/ui/components/card"
import { Spinner } from "@workspace/ui/components/spinner"

export function ShopsBrowseState({
  state,
  onRetry,
}: {
  state: "loading" | "error" | "empty"
  onRetry?: () => void
}) {
  const { t } = useTranslation("library")

  if (state === "loading") {
    return (
      <div
        className="flex min-h-48 items-center justify-center"
        data-testid="shops-browse-loading"
      >
        <Spinner className="size-8" />
      </div>
    )
  }

  return (
    <Card data-testid={`shops-browse-${state}`}>
      <CardContent className="grid justify-items-center gap-4 py-10 text-center text-muted-foreground">
        <p>
          {t(state === "error" ? "shops.state.error" : "shops.state.empty")}
        </p>
        {state === "error" && onRetry ? (
          <Button variant="outline" onClick={onRetry}>
            {t("shops.state.retry")}
          </Button>
        ) : null}
      </CardContent>
    </Card>
  )
}
