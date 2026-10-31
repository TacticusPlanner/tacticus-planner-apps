import { useState } from "react"
import { Check, Copy, Gift, X } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Button } from "@workspace/ui/components/button"

import {
  BETA_PROMO_CODE,
  BETA_PROMO_LAST_DAY,
  useBetaPromo,
} from "../../model/beta-promo"

type CopyState = "idle" | "copied" | "failed"

/** The beta launch promo code, at the top of Right now until it expires or is dismissed. */
export function BetaPromoTile() {
  const { t, i18n } = useTranslation("common")
  const promo = useBetaPromo()
  const [copyState, setCopyState] = useState<CopyState>("idle")

  if (!promo.show) return null

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(BETA_PROMO_CODE)
      setCopyState("copied")
    } catch {
      setCopyState("failed")
    }
  }

  const lastDay = new Intl.DateTimeFormat(i18n.language, {
    day: "numeric",
    month: "long",
  }).format(BETA_PROMO_LAST_DAY)

  return (
    <div
      className="flex flex-col gap-3 rounded-xl border border-primary/40 bg-primary/5 p-3 sm:flex-row sm:items-center lg:col-span-2"
      data-testid="home-beta-promo"
    >
      <Gift
        aria-hidden="true"
        className="hidden size-8 shrink-0 text-primary sm:block"
      />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <h3 className="text-sm font-medium">{t("home.betaPromo.title")}</h3>
        <p className="text-sm text-muted-foreground">
          {t("home.betaPromo.body", { date: lastDay })}
        </p>
        <code
          className="w-fit rounded-md border bg-background px-2 py-1 font-mono text-sm font-semibold tracking-wider"
          data-testid="home-beta-promo-code"
        >
          {BETA_PROMO_CODE}
        </code>
      </div>
      <div className="flex shrink-0 gap-2">
        <Button onClick={() => void copy()} size="sm">
          {copyState === "copied" ? (
            <Check aria-hidden="true" />
          ) : (
            <Copy aria-hidden="true" />
          )}
          {copyState === "copied"
            ? t("home.betaPromo.copied")
            : copyState === "failed"
              ? t("home.betaPromo.copyFailed")
              : t("home.betaPromo.copy")}
        </Button>
        <Button
          aria-label={t("home.betaPromo.dismiss")}
          onClick={promo.dismiss}
          size="icon-sm"
          variant="ghost"
        >
          <X aria-hidden="true" />
        </Button>
      </div>
    </div>
  )
}
