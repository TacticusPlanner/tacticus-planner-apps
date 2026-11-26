import { useEffect, useState } from "react"
import { Trans, useTranslation } from "react-i18next"
import { toast } from "sonner"
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

import { TEAM_EDITOR_NAMESPACES, usePickerUnits } from "@/features/team-editor"
import type { PickerUnit } from "@/features/team-editor"
import { formatDateRange } from "@/shared/lib"
import { useCatalogDataset } from "@/shared/local-data"
import { EmptyState, EntityIcon } from "@/shared/ui"

import type { GuildWarSeason } from "../../lib/season"
import { attackSaveError, freshAttack } from "../../model/guild-war-errors"
import { historyTotals } from "../../model/history-totals"
import type {
  GuildWar,
  GuildWarAttack,
  GuildWarAttackFields,
} from "../../model/types"
import {
  usePastGuildWars,
  useUpdateGuildWarAttack,
} from "../../model/use-guild-war"
import { useSeasonName } from "../../model/use-season-name"
import { attackResults } from "../../model/war-stats"
import { AttackActions } from "../attack-actions"
import { AttackRow } from "../attack-row"
import { useGuildWarTutorial } from "../guild-war.tutorial"
import { LogAttackDialog } from "../offense/log-attack-dialog"
import { HistoryTotals } from "./history-totals"

const NO_SEASONS: readonly GuildWarSeason[] = []
const NO_UNITS: readonly PickerUnit[] = []

/** One ended war, expanding in place to its attacks (oldest first, as they were logged), each with
 *  Edit. An ended war's attacks are not deleted, so its token count stays. */
function PastWar({
  war,
  season,
  onEdit,
}: {
  war: GuildWar
  season: GuildWarSeason | undefined
  onEdit: (attack: GuildWarAttack) => void
}) {
  const { t, i18n } = useTranslation("guildWar")
  const { seasonName } = useSeasonName()
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
            <Trans
              components={{
                token: (
                  <EntityIcon alt="" size="icon" src={guildWarTokenIcon()} />
                ),
              }}
              i18nKey="history.warSummary"
              ns="guildWar"
              values={{
                season: seasonName(war.seasonId, war.startedAt),
                level: war.battlefieldLevel,
                tokens: war.tokensUsed,
                won,
                lost,
              }}
            />
          </span>
        </span>
      </AccordionTrigger>
      <AccordionContent className="px-4">
        {war.attacks.length > 0 ? (
          <ol className="flex flex-col gap-2">
            {war.attacks.map((attack) => (
              <AttackRow
                actions={<AttackActions onEdit={() => onEdit(attack)} />}
                attack={attack}
                key={attack.id}
                locale={i18n.language}
                season={season}
              />
            ))}
          </ol>
        ) : (
          <EmptyState title={t("history.noAttacks")} variant="empty" />
        )}
      </AccordionContent>
    </AccordionItem>
  )
}

/**
 * Guild War History: totals across the loaded wars, then the ended wars newest first, each
 * expanding to its attacks (with Edit), with more on demand.
 */
export function HistoryPage() {
  const { t, i18n } = useTranslation("guildWar")
  const past = usePastGuildWars()
  const seasons = useCatalogDataset("guild-war")
  const picker = usePickerUnits()
  const updateAttack = useUpdateGuildWarAttack()
  const [editing, setEditing] = useState<{
    war: GuildWar
    attack: GuildWarAttack
  } | null>(null)
  const [editError, setEditError] = useState<string | null>(null)
  useGuildWarTutorial("history")
  // The enemy pickers' faction names load with the page.
  useEffect(() => {
    void i18n.loadNamespaces([...TEAM_EDITOR_NAMESPACES])
  }, [i18n])
  const seasonList = seasons.status === "ready" ? seasons.data : NO_SEASONS
  const wars = past.wars ?? []
  const seasonOf = (war: GuildWar) =>
    seasonList.find((entry) => entry.id === war.seasonId)

  const closeEdit = () => {
    setEditing(null)
    setEditError(null)
  }
  const saveEdit = (
    war: GuildWar,
    attack: GuildWarAttack,
    fields: GuildWarAttackFields
  ) => {
    setEditError(null)
    updateAttack.mutate(
      { warId: war.id, attack, fields },
      {
        onSuccess: () => {
          closeEdit()
          toast.success(t("log.saved"))
        },
        onError: (error) => {
          // The dialog keeps the player's changes; saving again goes over the attack as it is now.
          const fresh = freshAttack(error, attack.id)
          if (fresh) setEditing({ war, attack: fresh })
          setEditError(t(`log.errors.${attackSaveError(error)}`))
        },
      }
    )
  }

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
                onEdit={(attack) => {
                  setEditError(null)
                  setEditing({ war, attack })
                }}
                season={seasonOf(war)}
                war={war}
              />
            ))}
          </Accordion>
          {past.hasNextPage ? (
            <Button
              className="self-center"
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
      {editing ? (
        <LogAttackDialog
          battlefieldLevel={editing.war.battlefieldLevel}
          error={editError}
          onOpenChange={(open) => {
            if (!open) closeEdit()
          }}
          onSave={(fields) => saveEdit(editing.war, editing.attack, fields)}
          open
          deployed={new Set(editing.war.deployedUnitIds)}
          pending={updateAttack.isPending}
          roster={picker.status === "ready" ? picker.data.roster : null}
          season={seasonOf(editing.war)}
          subject={{ kind: "edit", attack: editing.attack }}
          units={picker.status === "ready" ? picker.data.units : NO_UNITS}
        />
      ) : null}
    </div>
  )
}
