import { useEffect, useId, useState } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { AlertTriangle } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"

import {
  useCreateRosterSnapshot,
  type PersonalRosterSnapshot,
} from "@/entities/roster-snapshot"
import { useAnalyticsActions } from "@/shared/analytics"
import { formatRelativeTime } from "@/shared/lib"
import { usePlayerDataStatus } from "@/shared/player-data-status"
import {
  ResponsiveDialog,
  ResponsiveDialogBody,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@/shared/ui"

import { snapshotNameError, takeFailure } from "../../../model/take-snapshot"

export interface TakeSnapshotDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  count: number
  limit: number
  /** Opens compare mode with the new snapshot (the success toast's action). */
  onCompare: (snapshot: PersonalRosterSnapshot) => void
}

/**
 * Takes a snapshot after a fresh sync (spec: "The user takes a snapshot from a fresh sync"). A
 * failed sync offers Retry and, once the user has synced before, "Take from last sync".
 */
export function TakeSnapshotDialog({
  open,
  onOpenChange,
  count,
  limit,
  onCompare,
}: TakeSnapshotDialogProps) {
  const { t, i18n } = useTranslation("common")
  const nameId = useId()
  const [name, setName] = useState("")
  const create = useCreateRosterSnapshot()
  const { captureEvent } = useAnalyticsActions()
  const { lastSyncedAt, syncNow } = usePlayerDataStatus()
  const nameError = snapshotNameError(name)
  const failure = create.error ? takeFailure(create.error) : null
  // When a 429's Retry-After window ends, measured from the response's arrival.
  const [retryAt, setRetryAt] = useState<number | null>(null)

  useEffect(() => {
    if (retryAt === null) return
    const timer = setTimeout(
      () => setRetryAt(null),
      Math.max(0, retryAt - Date.now())
    )
    return () => clearTimeout(timer)
  }, [retryAt])

  const close = (next: boolean) => {
    // The request cannot be aborted, so the dialog stays until it settles.
    if (!next && create.isPending) return
    if (!next) {
      setRetryAt(null)
      create.reset()
      setName("")
    }
    onOpenChange(next)
  }

  const take = (fromLastSync: boolean) => {
    if (nameError) return
    create.mutate(
      { name, fromLastSync },
      {
        onSuccess: (snapshot) => {
          captureEvent({
            type: "roster_snapshot_taken",
            fromLastSync,
            count: count + 1,
          })
          // A fresh sync wrote the server's copy; pull it into this device's roster too.
          if (!fromLastSync) syncNow()
          close(false)
          toast(t("myGame.collection.snapshots.taken"), {
            action: {
              label: t("myGame.collection.snapshots.compare"),
              onClick: () => onCompare(snapshot),
            },
          })
        },
        onError: (error) => {
          const failed = takeFailure(error)
          if (
            failed.kind === "rateLimited" &&
            failed.retryAfterSeconds !== undefined
          ) {
            setRetryAt(Date.now() + failed.retryAfterSeconds * 1000)
          }
        },
      }
    )
  }

  const lastSync = lastSyncedAt
    ? formatRelativeTime(Date.parse(lastSyncedAt), i18n.language)
    : null
  const retryIn =
    failure?.kind === "rateLimited" && retryAt !== null
      ? formatRelativeTime(retryAt, i18n.language)
      : null

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={close}
      desktopClassName="sm:max-w-md"
      data-testid="take-snapshot-dialog"
    >
      <ResponsiveDialogHeader>
        <ResponsiveDialogTitle>
          {t("myGame.collection.snapshots.dialogTitle")}
        </ResponsiveDialogTitle>
        <p className="text-sm text-muted-foreground">
          {t("myGame.collection.snapshots.dialogBody")}
        </p>
      </ResponsiveDialogHeader>
      <ResponsiveDialogBody className="gap-3 py-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={nameId}>
            {t("myGame.collection.snapshots.name")}
          </Label>
          <Input
            id={nameId}
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder={t("myGame.collection.snapshots.namePlaceholder")}
            aria-invalid={nameError ? true : undefined}
            disabled={create.isPending}
            data-testid="take-snapshot-name"
          />
          {nameError ? (
            <p className="text-xs text-destructive" role="alert">
              {t("myGame.collection.snapshots.nameTooLong", {
                max: nameError.max,
              })}
            </p>
          ) : null}
        </div>
        <p
          className="text-xs text-muted-foreground tabular-nums"
          data-testid="take-snapshot-usage"
        >
          {t("myGame.collection.snapshots.usage", { count, limit })}
        </p>
        {failure ? (
          <div
            className="flex flex-col gap-2 rounded-lg border border-destructive/40 p-3 text-sm"
            role="alert"
            data-testid="take-snapshot-error"
          >
            <p className="flex items-start gap-2">
              <AlertTriangle
                aria-hidden
                className="mt-0.5 size-4 shrink-0 text-destructive"
              />
              <span>
                {failure.kind === "limitReached"
                  ? t("myGame.collection.snapshots.limitTooltip")
                  : failure.kind === "notSynced"
                    ? t("myGame.collection.snapshots.notSynced")
                    : failure.kind === "rateLimited"
                      ? retryIn
                        ? t("myGame.collection.snapshots.rateLimited", {
                            time: retryIn,
                          })
                        : t("myGame.collection.snapshots.rateLimitedSoon")
                      : t("myGame.collection.snapshots.syncFailed")}
              </span>
            </p>
            {failure.canFallBack && lastSync ? (
              <Button
                variant="outline"
                size="sm"
                className="self-start"
                disabled={create.isPending}
                onClick={() => take(true)}
                data-testid="take-snapshot-from-last-sync"
              >
                {t("myGame.collection.snapshots.fromLastSync", {
                  time: lastSync,
                })}
              </Button>
            ) : null}
          </div>
        ) : null}
      </ResponsiveDialogBody>
      <ResponsiveDialogFooter>
        <Button
          variant="outline"
          disabled={create.isPending}
          onClick={() => close(false)}
        >
          {t("myGame.collection.snapshots.cancel")}
        </Button>
        <Button
          onClick={() => take(false)}
          disabled={
            create.isPending ||
            retryAt !== null ||
            nameError !== null ||
            failure?.kind === "limitReached"
          }
          data-testid="take-snapshot-confirm"
        >
          {create.isPending
            ? t("myGame.collection.snapshots.syncing")
            : failure && failure.kind !== "limitReached"
              ? t("myGame.collection.snapshots.retry")
              : t("myGame.collection.snapshots.confirm")}
        </Button>
      </ResponsiveDialogFooter>
    </ResponsiveDialog>
  )
}
