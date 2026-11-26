import { useTranslation } from "react-i18next"
import { ScrollText } from "lucide-react"
import { guildWarTokenIcon } from "@workspace/game-catalog"
import { Button } from "@workspace/ui/components/button"

import { EntityIcon } from "@/shared/ui"

import { maxAttempts } from "../../lib/season"
import { useGuildWarContext } from "../../model/guild-war-context"
import { attackResults } from "../../model/war-stats"

/** The war at a glance: tokens used of the season's attempts and attacks won and lost, and once
 *  there are attacks, Attack log (N), which jumps to the log at the foot of the page. */
export function WarSummary({
  children,
  onShowLog,
}: {
  children?: React.ReactNode
  onShowLog: () => void
}) {
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
          <EntityIcon alt="" size="icon" src={guildWarTokenIcon()} />
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
      {war && war.attacks.length > 0 ? (
        <div className="flex self-center sm:ml-auto">
          <Button
            data-testid="guild-war-show-log"
            onClick={onShowLog}
            variant="outline"
          >
            <ScrollText data-icon="inline-start" />
            {t("summary.attackLog", { count: war.attacks.length })}
          </Button>
        </div>
      ) : null}
    </dl>
  )
}
