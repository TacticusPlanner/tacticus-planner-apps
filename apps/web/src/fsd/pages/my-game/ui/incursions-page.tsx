import { Suspense, useMemo, useState } from "react"
import { Outlet } from "react-router"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { useIsAuthenticated } from "@azure/msal-react"
import { Alert, AlertDescription } from "@workspace/ui/components/alert"
import { Button } from "@workspace/ui/components/button"
import { Spinner } from "@workspace/ui/components/spinner"

import {
  incursionProgressQueries,
  playerDataOverrideKey,
  updateIncursionProgressOverrides,
} from "@/entities/player-data-override"
import { useRevisionedDraft } from "@/shared/api"
import { UnsavedChangesBar, UnsavedChangesGuard } from "@/shared/ui"

import {
  battleKey,
  sameIncursionProgress,
  starsFor,
  tierStarsPatch,
  toIncursionProgressDraft,
  toIncursionProgressPayload,
} from "../model/incursion-progress.model"
import { orderIncursions } from "../model/incursions.model"
import { useIncursionPlans } from "../model/use-incursion-plans"
import { useIncursionsData } from "../model/use-incursions-data"
import {
  INCURSIONS_PATH,
  type IncursionProgress,
  type IncursionsOutlet,
} from "./incursions/incursions-outlet"

const Loading = () => (
  <div className="flex min-h-64 items-center justify-center">
    <Spinner className="size-8" />
  </div>
)

/** What a save that didn't go through needs the player to know; a successful save is a toast. */
type Message = {
  tone: "info" | "error"
  key: "conflict" | "saveError"
}

/**
 * The Incursion section: loads the `incursions` catalog dataset, the suggested teams and the
 * player's battle stars once, and hands them to its pages (the MoW list, a MoW's tiers, one tier's
 * run map) through the outlet. Stars are a manual player-data override, since the game API does not
 * sync them; unsaved edits carry across the section's pages and are saved from the bar here.
 */
export function IncursionsPage() {
  const { t } = useTranslation("incursions")
  const isAuthenticated = useIsAuthenticated()
  const progressDraft = useRevisionedDraft({
    query: incursionProgressQueries.current(),
    enabled: isAuthenticated,
    toDraft: toIncursionProgressDraft,
    toPayload: toIncursionProgressPayload,
    save: updateIncursionProgressOverrides,
    isEqual: sameIncursionProgress,
    sharedRevisionKey: playerDataOverrideKey,
  })
  const [message, setMessage] = useState<Message | null>(null)
  const draft = isAuthenticated ? progressDraft.draft : undefined
  const loaded = useIncursionsData()
  const data = loaded.status === "ready" ? loaded.data : undefined
  const incursions = useMemo(
    () => (data ? orderIncursions(data.incursions) : []),
    [data]
  )
  const plans = useIncursionPlans(incursions, data?.npcsById)
  const update = progressDraft.update
  const progress: IncursionProgress | undefined = useMemo(() => {
    if (!draft) return undefined
    const patch = (entries: Record<string, number>) => {
      update((current) => ({ ...current, ...entries }))
      setMessage(null)
    }
    return {
      starsOf: (mowId) => starsFor(draft, mowId),
      setBattleStars: (mowId, tierIndex, battleId, stars) =>
        patch({ [battleKey(mowId, tierIndex, battleId)]: stars }),
      setTierStars: (mowId, tier, stars) =>
        patch(tierStarsPatch(mowId, tier, stars)),
    }
  }, [draft, update])

  if (loaded.status === "error") {
    return (
      <Alert variant="destructive" data-testid="incursions-load-error">
        <AlertDescription className="flex flex-wrap items-center gap-3">
          {t("loadError")}
          <Button size="sm" variant="outline" onClick={loaded.retry}>
            {t("retry")}
          </Button>
        </AlertDescription>
      </Alert>
    )
  }
  if (!data) return <Loading />
  const save = async () => {
    setMessage(null)
    const outcome = await progressDraft.save()
    if (outcome === "saved") {
      toast.success(t("progress.saved"))
      return
    }
    setMessage(
      outcome === "conflict"
        ? { tone: "info", key: "conflict" }
        : { tone: "error", key: "saveError" }
    )
  }

  return (
    <div className="flex flex-col gap-6" data-testid="incursions-page">
      {message ? (
        <Alert
          variant={message.tone === "error" ? "destructive" : "default"}
          data-testid="incursions-message"
        >
          <AlertDescription>{t(`progress.${message.key}`)}</AlertDescription>
        </Alert>
      ) : null}
      {isAuthenticated && progressDraft.query.isError ? (
        <Alert variant="destructive" data-testid="incursions-progress-error">
          <AlertDescription>{t("progress.loadError")}</AlertDescription>
        </Alert>
      ) : null}
      <Suspense fallback={<Loading />}>
        <Outlet
          context={
            {
              incursions,
              npcsById: data.npcsById,
              ownedMowIds: data.ownedMowIds,
              plans,
              progress,
            } satisfies IncursionsOutlet
          }
        />
      </Suspense>
      {isAuthenticated ? null : (
        <p
          className="text-sm text-muted-foreground"
          data-testid="incursions-sign-in"
        >
          {t("progress.signIn")}
        </p>
      )}

      <UnsavedChangesBar
        open={progressDraft.isDirty}
        isSaving={progressDraft.isSaving}
        message={t("progress.unsaved.message")}
        saveLabel={t("progress.unsaved.save")}
        discardLabel={t("progress.unsaved.discard")}
        onSave={() => void save()}
        onDiscard={() => {
          progressDraft.discard()
          setMessage(null)
        }}
      />
      <UnsavedChangesGuard
        when={progressDraft.isDirty}
        title={t("progress.leave.title")}
        description={t("progress.leave.description")}
        stayLabel={t("progress.leave.stay")}
        leaveLabel={t("progress.leave.leave")}
        scope={INCURSIONS_PATH}
      />
    </div>
  )
}
