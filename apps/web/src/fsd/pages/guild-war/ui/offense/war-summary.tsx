import { useTranslation } from "react-i18next"
import { guildWarTokenIcon } from "@workspace/game-catalog"

import { EntityIcon } from "@/shared/ui"

import { maxAttempts } from "../../lib/season"

import { useGuildWarContext } from "../../model/guild-war-context"
import { attackResults } from "../../model/war-stats"

/** The war at a glance: tokens used of the season's attempts and attacks won and lost. */
export function WarSummary({ children }: { children?: React.ReactNode }) {
  const { t } = useTranslation("guildWar")
  const { war, season } = useGuildWarContext()
  const { won, lost } = attackResults(war?.attacks ?? [])
  return (
    <dl
      className="flex flex-wrap items-start gap-x-8 gap-y-3 rounded-xl border bg-card p-4"
      data-testid="guild-war-summary"
    >
      <div className="flex flex-col gap-0.5">
        <dt className="text-xs text-muted-foreground">{t("summary.tokens")}</dt>
        <dd className="flex items-center gap-1.5 text-xl font-semibold tabular-nums">
          <EntityIcon alt="" size="icon-md" src={guildWarTokenIcon()} />
          {t("summary.tokensValue", {
            used: war?.tokensUsed ?? 0,
            max: maxAttempts(season),
          })}
        </dd>
      </div>
      <div className="flex flex-col gap-0.5">
        <dt className="text-xs text-muted-foreground">
          {t("summary.results")}
        </dt>
        <dd className="text-xl font-semibold tabular-nums">
          {t("summary.resultsValue", { won, lost })}
        </dd>
      </div>
      {children}
    </dl>
  )
}
