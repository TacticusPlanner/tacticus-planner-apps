import { useTranslation } from "react-i18next"

import { MedalStats } from "@/features/daily-raids"
import type { TrackMedalStats } from "@/features/daily-raids"
import { HintTrigger } from "@/shared/ui"
import { numberFormat } from "@/shared/lib"

/** A headline progress block: percent, battles done, tracks cleared and medal stats. With
 *  `completion`, the percent names what it counts (medals and Lightning Victories, or battles). */
export function ProgressSummary({
  label,
  done,
  total,
  percent,
  cleared,
  medals,
  completion,
  testId,
}: {
  label: string
  done: number
  total: number
  percent: number
  cleared: number
  medals: TrackMedalStats | undefined
  completion?: { done: number; total: number; basis: "medals" | "battles" }
  testId?: string
}) {
  const { t, i18n } = useTranslation()
  const number = (value: number) =>
    numberFormat(i18n.resolvedLanguage).format(value)
  const percentText = `${percent}%`
  return (
    <div data-testid={testId}>
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      {completion ? (
        <HintTrigger
          className="text-3xl font-bold tabular-nums"
          data-testid={testId ? `${testId}-percent` : undefined}
          hint={t(
            completion.basis === "medals"
              ? "progress.campaigns.percentBasisMedals"
              : "progress.campaigns.percentBasisBattles",
            { done: number(completion.done), total: number(completion.total) }
          )}
          label={`${label}: ${percentText}`}
        >
          {percentText}
        </HintTrigger>
      ) : (
        <p className="text-3xl font-bold tabular-nums">{percentText}</p>
      )}
      <p className="text-xs text-muted-foreground">
        {done}/{total} · {cleared} cleared
      </p>
      {medals ? (
        <p className="mt-1 text-muted-foreground">
          <MedalStats stats={medals} />
        </p>
      ) : null}
    </div>
  )
}
