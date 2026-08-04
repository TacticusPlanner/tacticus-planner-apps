import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Button } from "@workspace/ui/components/button"
import { Card, CardContent } from "@workspace/ui/components/card"

import { EntityIcon } from "@/shared/ui"

import {
  recordXpIncomeFeatureInterest,
  xpIncomeFeatureInterest,
} from "../model/xp-income-feature-interest"

const legendaryXpBookUrl =
  "/game_catalog/books/ui_icon_consumable_xp_book_4.png"

export function XpIncomePlaceholderPage() {
  const { t } = useTranslation()
  const [interestSubmitted, setInterestSubmitted] = useState(false)

  const submitInterest = () => {
    if (interestSubmitted) return
    recordXpIncomeFeatureInterest(xpIncomeFeatureInterest)
    setInterestSubmitted(true)
  }

  return (
    <div
      className="flex min-h-[28rem] items-center justify-center py-8"
      data-testid="xp-income-placeholder-page"
    >
      <Card className="w-full max-w-2xl">
        <CardContent className="flex flex-col items-center gap-5 px-6 py-10 text-center sm:px-12">
          <div className="rounded-3xl bg-primary/10 p-4">
            <EntityIcon
              src={legendaryXpBookUrl}
              alt={t("progress.xpIncome.bookAlt")}
              className="size-20"
            />
          </div>
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              {t("progress.xpIncome.comingSoon")}
            </p>
          </div>
          <Button disabled={interestSubmitted} onClick={submitInterest}>
            {t(
              interestSubmitted
                ? "progress.xpIncome.interestRecorded"
                : "progress.xpIncome.interestButton"
            )}
          </Button>
          <p
            className="min-h-5 text-sm text-muted-foreground"
            aria-live="polite"
          >
            {interestSubmitted
              ? t("progress.xpIncome.interestAcknowledgement")
              : null}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
