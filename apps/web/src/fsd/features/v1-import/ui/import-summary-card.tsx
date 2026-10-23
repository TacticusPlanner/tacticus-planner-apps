import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { CircleCheck } from "lucide-react"

import type { ImportV1ProfileResult } from "@/entities/account"

import { importSummary, isEmptySummary } from "../model/import-summary"

const PART_KEYS = {
  personalTacticusApiKey: "goals.v1Import.summary.parts.personalTacticusApiKey",
  tacticusUserId: "goals.v1Import.summary.parts.tacticusUserId",
  guildApiToken: "goals.v1Import.summary.parts.guildApiToken",
  onslaughtProgress: "goals.v1Import.summary.parts.onslaughtProgress",
  campaignEventProgress: "goals.v1Import.summary.parts.campaignEventProgress",
} as const

/** What an import brought across, in a few lines, ahead of its full report. */
export function ImportSummaryCard({
  result,
}: {
  result: ImportV1ProfileResult
}) {
  const { t } = useTranslation()
  const summary = useMemo(() => importSummary(result), [result])

  if (isEmptySummary(summary)) {
    return (
      <p
        className="rounded-xl border p-3 text-sm text-muted-foreground"
        data-testid="v1-import-summary-empty"
      >
        {t("goals.v1Import.summary.empty")}
      </p>
    )
  }

  const lines = [
    summary.goals > 0
      ? t("goals.v1Import.summary.goals", { count: summary.goals })
      : null,
    summary.legendaryEvents > 0
      ? t("goals.v1Import.summary.legendaryEvents", {
          count: summary.legendaryEvents,
        })
      : null,
    ...summary.parts.map((key) => t(PART_KEYS[key])),
  ].filter((line) => line !== null)

  return (
    <section
      className="grid gap-2 rounded-xl border p-3 text-sm"
      data-testid="v1-import-summary"
    >
      <p className="font-medium">{t("goals.v1Import.summary.title")}</p>
      <ul className="grid gap-1">
        {lines.map((line) => (
          <li className="flex items-center gap-2" key={line}>
            <CircleCheck aria-hidden className="size-4 text-primary" />
            {line}
          </li>
        ))}
      </ul>
    </section>
  )
}
