import { useTranslation } from "react-i18next"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@workspace/ui/components/accordion"
import { Alert, AlertDescription } from "@workspace/ui/components/alert"
import { Button } from "@workspace/ui/components/button"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { guildWarTokenIcon } from "@workspace/game-catalog"

import { formatDateRange } from "@/shared/lib"
import { useCatalogDataset } from "@/shared/local-data"
import { EmptyState, EntityIcon } from "@/shared/ui"

import type { GuildWarSeason } from "../../lib/season"
import { historyTotals } from "../../model/history-totals"
import type { GuildWar } from "../../model/types"
import { usePastGuildWars } from "../../model/use-guild-war"
import { useGuildWarNames } from "../../model/use-guild-war-names"
import { attackResults } from "../../model/war-stats"
import { AttackRow } from "../attack-row"
import { useGuildWarTutorial } from "../guild-war.tutorial"
import { HistoryTotals } from "./history-totals"

const NO_SEASONS: readonly GuildWarSeason[] = []

/** One ended war, expanding in place to its attacks (oldest first, as they were logged). */
function PastWar({
  war,
  season,
}: {
  war: GuildWar
  season: GuildWarSeason | undefined
}) {
  const { t, i18n } = useTranslation("guildWar")
  const { seasonName } = useGuildWarNames()
  const { won, lost } = attackResults(war.attacks)
  return (
    <AccordionItem data-testid="guild-war-past-war" value={war.id}>
      <AccordionTrigger className="px-4">
        <span className="flex min-w-0 flex-col gap-0.5 text-left">
          <span className="font-medium">
            {formatDateRange(
              war.startedAt,
              war.endedAt ?? war.startedAt,
              i18n.language
            )}
          </span>
          <span className="flex flex-wrap items-center gap-1 text-xs font-normal text-muted-foreground">
            {t("history.warSummary", {
              season: seasonName(war.seasonId),
              level: war.battlefieldLevel,
            })}
            <EntityIcon alt="" size="icon-sm" src={guildWarTokenIcon()} />
            {t("history.warResults", {
              tokens: war.tokensUsed,
              won,
              lost,
            })}
          </span>
        </span>
      </AccordionTrigger>
      <AccordionContent className="px-4">
        {war.attacks.length > 0 ? (
          <ol className="flex flex-col gap-2">
            {war.attacks.map((attack) => (
              <AttackRow
                attack={attack}
                key={attack.id}
                locale={i18n.language}
                season={season}
              />
            ))}
          </ol>
        ) : (
          <p className="text-sm text-muted-foreground">
            {t("history.noAttacks")}
          </p>
        )}
      </AccordionContent>
    </AccordionItem>
  )
}

/**
 * Guild War History: totals across the loaded wars, then the ended wars newest first, each
 * expanding to its attacks, with more on demand.
 */
export function HistoryPage() {
  const { t } = useTranslation("guildWar")
  const past = usePastGuildWars()
  const seasons = useCatalogDataset("guild-war")
  useGuildWarTutorial("history")
  const seasonList = seasons.status === "ready" ? seasons.data : NO_SEASONS
  const wars = past.wars ?? []

  let content
  if (past.isPending) {
    content = (
      <div
        aria-label={t("history.loading")}
        className="flex flex-col gap-3"
        role="status"
      >
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
      </div>
    )
  } else if (past.isError && past.wars === undefined) {
    content = (
      <Alert data-testid="guild-war-history-error" variant="destructive">
        <AlertDescription className="flex flex-wrap items-center gap-3">
          {t("history.loadError")}
          <Button
            onClick={() => void past.refetch()}
            size="sm"
            variant="outline"
          >
            {t("page.retry")}
          </Button>
        </AlertDescription>
      </Alert>
    )
  } else if (wars.length === 0) {
    content = (
      <EmptyState
        description={t("history.emptyDescription")}
        testId="guild-war-history-empty"
        title={t("history.empty")}
        variant="empty"
      />
    )
  } else {
    content = (
      <>
        <HistoryTotals
          seasons={seasonList}
          totals={historyTotals(wars, seasonList)}
        />
        <section
          aria-labelledby="guild-war-past-heading"
          className="flex flex-col gap-2"
          data-testid="guild-war-past-wars"
        >
          <h2 className="text-sm font-medium" id="guild-war-past-heading">
            {t("history.heading")}
          </h2>
          <Accordion type="multiple">
            {wars.map((war) => (
              <PastWar
                key={war.id}
                season={seasonList.find((entry) => entry.id === war.seasonId)}
                war={war}
              />
            ))}
          </Accordion>
          {past.hasNextPage ? (
            <Button
              className="self-center"
              data-testid="guild-war-load-more"
              disabled={past.isFetchingNextPage}
              onClick={() => void past.fetchNextPage()}
              variant="outline"
            >
              {t("history.loadMore")}
            </Button>
          ) : null}
        </section>
      </>
    )
  }

  return (
    <div className="flex flex-col gap-5" data-testid="guild-war-history">
      {content}
    </div>
  )
}
