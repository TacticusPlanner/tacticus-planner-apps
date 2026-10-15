import { useMemo, useState } from "react"
import { useIsAuthenticated } from "@azure/msal-react"
import { useLiveQuery } from "dexie-react-hooks"
import { useTranslation } from "react-i18next"
import { Accordion } from "@workspace/ui/components/accordion"
import { Alert, AlertDescription } from "@workspace/ui/components/alert"
import { Button } from "@workspace/ui/components/button"
import { Label } from "@workspace/ui/components/label"
import { Spinner } from "@workspace/ui/components/spinner"
import { Switch } from "@workspace/ui/components/switch"

import {
  buildEffectiveCampaignEventProgress,
  campaignEventProgressQueries,
  updateCampaignEventProgressOverrides,
  type CampaignEventProgressOverride,
  type CampaignEventProgressOverrides,
} from "@/entities/player-data-override"
import { useRevisionedDraft } from "@/shared/api"
import { usePersistedSelection } from "@/shared/lib"
import { UnsavedChangesBar, UnsavedChangesGuard } from "@/shared/ui"

import {
  applyOverridePatch,
  buildEventViews,
  buildEvents,
  normalizeOverrides,
} from "../model/campaign-events.model"
import { loadCampaignEventsData } from "../model/load-campaign-events-data"
import { useCampaignEventsTutorial } from "./campaign-events-page.tutorial"
import { CurrentEventCard, EventListItem } from "./event-card"
import type { PatchTrack } from "./event-track-editor"

type Message = { tone: "success" | "info" | "error"; key: MessageKey }
type MessageKey =
  | "progress.events.saved"
  | "progress.events.conflict"
  | "progress.events.saveError"

const HIDE_COMPLETED_KEY = "progress.campaign-events.hide-completed"
const isOnOff = (value: unknown): value is "on" | "off" =>
  value === "on" || value === "off"

const toDraft = (saved: CampaignEventProgressOverrides) =>
  normalizeOverrides(saved.progress)
const toPayload = (
  draft: CampaignEventProgressOverride[],
  saved: CampaignEventProgressOverrides
): CampaignEventProgressOverrides => ({
  progress: draft,
  revision: saved.revision,
})

export function CampaignEventsPage() {
  const { t } = useTranslation()
  const isAuthenticated = useIsAuthenticated()
  const loaded = useLiveQuery(loadCampaignEventsData, [])
  const catalogData = loaded?.status === "ready" ? loaded.data : undefined
  const overrides = useRevisionedDraft({
    query: campaignEventProgressQueries.current(),
    enabled: isAuthenticated,
    toDraft,
    toPayload,
    save: updateCampaignEventProgressOverrides,
  })
  const [message, setMessage] = useState<Message | null>(null)
  const [hideCompleted, setHideCompleted] = usePersistedSelection(
    HIDE_COMPLETED_KEY,
    isOnOff,
    "off"
  )

  const events = useMemo(
    () => (catalogData ? buildEvents(catalogData) : []),
    [catalogData]
  )
  const views = useMemo(
    () =>
      buildEventViews(
        events,
        buildEffectiveCampaignEventProgress(
          // No synced chunk means the player has never synced — not a failure; every track then
          // shows "No synced data" and can still be set manually.
          catalogData?.synced ?? [],
          overrides.draft ?? []
        ),
        catalogData?.liveProgress?.activeCampaignEventId
      ),
    [events, catalogData, overrides.draft]
  )
  const listed =
    hideCompleted === "on"
      ? views.list.filter((view) => !view.completed)
      : views.list

  useCampaignEventsTutorial({
    hasCurrentEvent: Boolean(views.current),
    hasList: views.list.length > 0,
    firstListEventId: listed[0]?.event.definition.groupId,
  })

  // Only a first load with nothing saved replaces the page. A later query error (e.g. the reload
  // after a 409 failing) keeps the editors and any unsaved draft; save() reports it inline.
  const overridesUnavailable =
    overrides.query.isError && overrides.query.data === undefined
  if (overridesUnavailable || loaded?.status === "error") return <LoadError />
  if (!catalogData || overrides.draft === undefined) return <Loading />

  const patch: PatchTrack = (groupId, type, value) => {
    overrides.update((draft) => applyOverridePatch(draft, groupId, type, value))
    setMessage(null)
  }

  const save = async () => {
    setMessage(null)
    const outcome = await overrides.save()
    setMessage(
      outcome === "saved"
        ? { tone: "success", key: "progress.events.saved" }
        : outcome === "conflict"
          ? { tone: "info", key: "progress.events.conflict" }
          : { tone: "error", key: "progress.events.saveError" }
    )
  }

  return (
    <div className="flex flex-col gap-6" data-testid="campaign-events-page">
      {message ? (
        <Alert
          variant={message.tone === "error" ? "destructive" : "default"}
          data-testid="campaign-events-message"
        >
          <AlertDescription>{t(message.key)}</AlertDescription>
        </Alert>
      ) : null}

      {events.length === 0 ? (
        <p
          className="text-muted-foreground"
          data-testid="campaign-events-empty"
        >
          {t("progress.events.noEvents")}
        </p>
      ) : null}

      {views.current ? (
        <CurrentEventCard view={views.current} onPatch={patch} />
      ) : null}

      {views.list.length > 0 ? (
        <section className="space-y-3" data-testid="campaign-events-list">
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
            <div className="space-y-0.5">
              <h2 className="font-semibold">
                {t("progress.events.allEvents")}
              </h2>
              <p
                className="text-xs text-muted-foreground"
                data-testid="campaign-events-save-hint"
              >
                {t("progress.events.saveHint")}
              </p>
            </div>
            <div
              className="flex items-center gap-2"
              data-testid="hide-completed-toggle"
            >
              <Switch
                id="hide-completed-events"
                checked={hideCompleted === "on"}
                onCheckedChange={(checked) =>
                  setHideCompleted(checked ? "on" : "off")
                }
              />
              <Label htmlFor="hide-completed-events">
                {t("progress.events.hideCompleted")}
              </Label>
            </div>
          </div>
          {listed.length > 0 ? (
            <Accordion type="multiple">
              {listed.map((view) => (
                <EventListItem
                  key={view.event.definition.groupId}
                  view={view}
                  onPatch={patch}
                />
              ))}
            </Accordion>
          ) : (
            <div
              className="flex flex-wrap items-center gap-3 rounded-xl border p-4 text-sm"
              data-testid="campaign-events-all-completed"
            >
              <span className="flex-1">
                {t("progress.events.allCompleted")}
              </span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setHideCompleted("off")}
              >
                {t("progress.events.showCompleted")}
              </Button>
            </div>
          )}
        </section>
      ) : null}

      <UnsavedChangesBar
        open={overrides.isDirty}
        isSaving={overrides.isSaving}
        message={t("progress.events.unsaved.message")}
        saveLabel={t("progress.events.unsaved.save")}
        discardLabel={t("progress.events.unsaved.discard")}
        onSave={() => void save()}
        onDiscard={() => {
          overrides.discard()
          setMessage(null)
        }}
      />
      <UnsavedChangesGuard
        when={overrides.isDirty}
        title={t("progress.events.leave.title")}
        description={t("progress.events.leave.description")}
        stayLabel={t("progress.events.leave.stay")}
        leaveLabel={t("progress.events.leave.leave")}
      />
    </div>
  )
}

function LoadError() {
  const { t } = useTranslation()
  return (
    <Alert variant="destructive" data-testid="campaign-events-load-error">
      <AlertDescription>{t("progress.loadError")}</AlertDescription>
    </Alert>
  )
}

const Loading = () => (
  <div className="flex min-h-64 items-center justify-center">
    <Spinner className="size-8" />
  </div>
)
