import { useTranslation } from "react-i18next"
import { Alert, AlertDescription } from "@workspace/ui/components/alert"
import { Button } from "@workspace/ui/components/button"

import type { EventShopController } from "./use-event-shop-controller"

/** The cart's state notices: loading, load failure, save failure, reload after a conflict, removed
 *  entries; and the sync notice without player data. */
export function EventShopNotices({
  controller,
}: {
  controller: EventShopController
}) {
  const { t } = useTranslation("eventShops")
  const { cart, roster } = controller
  return (
    <div className="flex flex-col gap-2 empty:hidden">
      {roster.lockContext === null ? (
        <Alert data-testid="event-shop-unsynced">
          <AlertDescription>{t("states.unsynced")}</AlertDescription>
        </Alert>
      ) : null}
      {cart.status === "loading" ? (
        <p
          className="text-sm text-muted-foreground"
          data-testid="event-shop-plan-loading"
        >
          {t("states.planLoading")}
        </p>
      ) : null}
      {cart.status === "error" ? (
        <Alert data-testid="event-shop-plan-error" variant="destructive">
          <AlertDescription className="flex flex-wrap items-center justify-between gap-2">
            <span>{t("states.planError")}</span>
            <Button onClick={cart.retry} size="sm" variant="outline">
              {t("states.retry")}
            </Button>
          </AlertDescription>
        </Alert>
      ) : null}
      {cart.status === "ready" && cart.saveFailed ? (
        <Alert data-testid="event-shop-save-error" variant="destructive">
          <AlertDescription className="flex flex-wrap items-center justify-between gap-2">
            <span>{t("states.saveError")}</span>
            <Button onClick={cart.retrySave} size="sm" variant="outline">
              {t("states.retry")}
            </Button>
          </AlertDescription>
        </Alert>
      ) : null}
      {cart.status === "ready" && cart.notice ? (
        <Alert data-testid={`event-shop-notice-${cart.notice.kind}`}>
          <AlertDescription className="flex flex-wrap items-center justify-between gap-2">
            <span>
              {cart.notice.kind === "reloaded"
                ? t("states.reloaded")
                : t("states.removed", { count: cart.notice.count })}
            </span>
            <Button onClick={cart.dismissNotice} size="sm" variant="ghost">
              {t("states.dismiss")}
            </Button>
          </AlertDescription>
        </Alert>
      ) : null}
    </div>
  )
}
