import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { useIsAuthenticated } from "@azure/msal-react"
import { Accordion } from "@workspace/ui/components/accordion"
import { Alert, AlertDescription } from "@workspace/ui/components/alert"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { Spinner } from "@workspace/ui/components/spinner"

import {
  incursionProgressQueries,
  playerDataOverrideKey,
  updateIncursionProgressOverrides,
} from "@/entities/player-data-override"
import { useRevisionedDraft } from "@/shared/api"
import { UnsavedChangesBar, UnsavedChangesGuard } from "@/shared/ui"

import {
  sameIncursionProgress,
  toIncursionProgressDraft,
  toIncursionProgressPayload,
} from "../model/incursion-progress.model"
import { orderIncursions } from "../model/incursions.model"
import { useIncursionsData } from "../model/use-incursions-data"
import { IncursionItem } from "./incursions/incursion-item"

const SECONDS_PER_HOUR = 3600

type Message = {
  tone: "success" | "info" | "error"
  key: "saved" | "conflict" | "saveError"
}

/**
 * The Incursion page: the event's rules, then one row per Machine of War (newest first) with its
 * allowed factions and, per tier, the run map with every battle's enemies and rewards, straight from
 * the `incursions` catalog dataset. A signed-in player also records the tiers cleared per MoW (a
 * manual player-data override, since the game API does not sync it) and sees the shards left.
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
  const progress = isAuthenticated ? progressDraft.draft : undefined
  const loaded = useIncursionsData()
  const data = loaded.status === "ready" ? loaded.data : undefined
  const incursions = useMemo(
    () => (data ? orderIncursions(data.incursions) : []),
    [data]
  )

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
  if (!data) {
    return (
      <div className="flex min-h-64 items-center justify-center">
        <Spinner className="size-8" />
      </div>
    )
  }
  const rules = incursions[0]

  const save = async () => {
    setMessage(null)
    const outcome = await progressDraft.save()
    setMessage(
      outcome === "saved"
        ? { tone: "success", key: "saved" }
        : outcome === "conflict"
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
      {rules ? (
        <Card data-testid="incursions-rules">
          <CardHeader>
            <CardTitle>{t("rules.title")}</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
              <li>
                {t("rules.tokens", {
                  start: rules.tokens.start,
                  max: rules.tokens.max,
                  hours: Math.round(
                    rules.tokens.regenSeconds /
                      rules.tokens.regenAmount /
                      SECONDS_PER_HOUR
                  ),
                  cost: rules.tokens.costPerRun,
                })}
              </li>
              <li>
                {t("rules.team", {
                  count: rules.minUnitsOfGrandAllianceNeeded,
                })}
              </li>
              <li>{t("rules.progress")}</li>
            </ul>
          </CardContent>
        </Card>
      ) : (
        <p className="text-muted-foreground" data-testid="incursions-empty">
          {t("empty")}
        </p>
      )}
      {incursions.length > 0 ? (
        <Accordion type="multiple" data-testid="incursions-list">
          {incursions.map((incursion) => (
            <IncursionItem
              key={incursion.mowId}
              incursion={incursion}
              owned={data.ownedMowIds.has(incursion.mowId)}
              npcsById={data.npcsById}
              progress={
                progress
                  ? {
                      tiersCleared: progress[incursion.mowId] ?? 0,
                      onChange: (tiersCleared) => {
                        progressDraft.update((current) => ({
                          ...current,
                          [incursion.mowId]: tiersCleared,
                        }))
                        setMessage(null)
                      },
                    }
                  : undefined
              }
            />
          ))}
        </Accordion>
      ) : null}
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
      />
    </div>
  )
}
