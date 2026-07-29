import { useMemo, useState } from "react"
import { useIsAuthenticated } from "@azure/msal-react"
import { useLiveQuery } from "dexie-react-hooks"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import {
  getCampaignBattles,
  getCampaignDefinitions,
} from "@workspace/game-catalog/queries"
import {
  getCampaignEventProgress,
  getPlayerCharacters,
} from "@workspace/player-data/queries"
import { Alert, AlertDescription } from "@workspace/ui/components/alert"
import { Button } from "@workspace/ui/components/button"
import { Spinner } from "@workspace/ui/components/spinner"

import {
  campaignEventProgressQueries,
  updateCampaignEventProgressOverrides,
  type CampaignEventProgressOverride,
} from "@/entities/player-data-override"
import { ApiError } from "@/shared/api"

import {
  buildEvents,
  cloneOverrides,
  keyOf,
  type EventType,
} from "../model/campaign-events.model"
import { EventCard } from "./event-card"

export function CampaignEventsPage() {
  const { t } = useTranslation(["common", "campaigns"])
  const isAuthenticated = useIsAuthenticated()
  const queryClient = useQueryClient()
  const catalogData = useLiveQuery(async () => {
    const [definitions, battles, synced, characters] = await Promise.all([
      getCampaignDefinitions(),
      getCampaignBattles(),
      getCampaignEventProgress(),
      getPlayerCharacters(),
    ])
    return { definitions, battles, synced, characters }
  }, [])
  const overrideQuery = useQuery({
    ...campaignEventProgressQueries.current(),
    enabled: isAuthenticated,
  })
  const saveMutation = useMutation({
    mutationFn: updateCampaignEventProgressOverrides,
  })
  const [draftOverride, setDraftOverride] = useState<
    CampaignEventProgressOverride[] | null
  >(null)
  const [message, setMessage] = useState<string | null>(null)
  const draft =
    draftOverride ??
    (overrideQuery.data ? cloneOverrides(overrideQuery.data.progress) : null)
  const dirty = draftOverride !== null

  const events = useMemo(
    () => (catalogData ? buildEvents(catalogData) : []),
    [catalogData]
  )
  if (!catalogData || overrideQuery.isPending || draft === null)
    return <Loading />
  if (!catalogData.synced || overrideQuery.isError) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{t("progress.loadError")}</AlertDescription>
      </Alert>
    )
  }

  const syncedByKey = new Map(
    catalogData.synced.map((entry) => [
      keyOf(entry.tacticusCampaignId, entry.type),
      entry,
    ])
  )
  const draftByKey = new Map(
    draft.map((entry) => [keyOf(entry.campaignGroupId, entry.type), entry])
  )

  const update = (
    groupId: string,
    type: EventType,
    patch: Partial<
      Pick<
        CampaignEventProgressOverride,
        "completedBattleCount" | "completedChallengeBattlesIds"
      >
    >
  ) => {
    setDraftOverride((current) => {
      const source =
        current ??
        (overrideQuery.data
          ? cloneOverrides(overrideQuery.data.progress)
          : null)
      if (!source) return current
      const index = source.findIndex(
        (entry) => entry.campaignGroupId === groupId && entry.type === type
      )
      const existing =
        index >= 0
          ? source[index]
          : {
              campaignGroupId: groupId,
              type,
              completedBattleCount: null,
              completedChallengeBattlesIds: null,
            }
      const next = { ...existing, ...patch }
      const result = [...source]
      if (
        next.completedBattleCount === null &&
        next.completedChallengeBattlesIds === null
      ) {
        return index >= 0
          ? result.filter((_, itemIndex) => itemIndex !== index)
          : result
      }
      if (index >= 0) result[index] = next
      else result.push(next)
      return result
    })
    setMessage(null)
  }

  const save = async () => {
    if (!overrideQuery.data || !draft) return
    setMessage(null)
    try {
      const saved = await saveMutation.mutateAsync({
        progress: draft,
        revision: overrideQuery.data.revision,
      })
      queryClient.setQueryData(
        campaignEventProgressQueries.current().queryKey,
        saved
      )
      setDraftOverride(null)
      setMessage(t("progress.events.saved"))
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) {
        try {
          await queryClient.fetchQuery(campaignEventProgressQueries.current())
          setDraftOverride(null)
          saveMutation.reset()
          setMessage(t("progress.events.conflict"))
          return
        } catch {
          /* use general failure below */
        }
      }
      setMessage(
        error instanceof ApiError
          ? error.message
          : t("progress.events.saveError")
      )
    }
  }

  return (
    <div className="space-y-8" data-testid="campaign-events-page">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <h2 className="text-xl font-semibold">
            {t("progress.events.title")}
          </h2>
          <p className="text-sm text-muted-foreground">
            {t("progress.events.description")}
          </p>
        </div>
        <Button
          disabled={!dirty || saveMutation.isPending}
          onClick={() => void save()}
        >
          {saveMutation.isPending ? <Spinner /> : null}
          {t("progress.events.save")}
        </Button>
      </header>
      {message ? (
        <Alert>
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      ) : null}
      <div className="space-y-5">
        {events.map((event) => (
          <EventCard
            key={event.definition.groupId}
            event={event}
            syncedByKey={syncedByKey}
            draftByKey={draftByKey}
            update={update}
          />
        ))}
      </div>
    </div>
  )
}

const Loading = () => (
  <div className="flex min-h-64 items-center justify-center">
    <Spinner className="size-8" />
  </div>
)
