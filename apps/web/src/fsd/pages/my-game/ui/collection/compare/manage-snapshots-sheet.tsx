import { useState } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { BookmarkPlus, Pencil, Trash2 } from "lucide-react"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Skeleton } from "@workspace/ui/components/skeleton"
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@workspace/ui/components/sheet"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip"

import {
  formatSnapshotDate,
  snapshotLabel,
  useDeleteRosterSnapshot,
  useKeepRosterSnapshot,
  useRenameRosterSnapshot,
} from "@/entities/roster-snapshot"
import type {
  PersonalRosterSnapshot,
  PersonalRosterSnapshotList,
} from "@/entities/roster-snapshot"
import { useAnalyticsActions } from "@/shared/analytics"
import { formatRelativeTime } from "@/shared/lib"
import { ConfirmationDialog } from "@/shared/ui"

import { canKeep, manageSections } from "../../../model/manage-snapshots"
import { isValidSnapshotRename } from "../../../model/take-snapshot"
import { useManageRunRecords } from "../../../model/use-manage-run-records"
import { useSourceLabels } from "../../../model/use-source-labels"

/**
 * The personal snapshots newest first in two sections (design D3): manual ones with V1 imports,
 * then automatic ones with their quota, Keep and when the next one can be taken. Each row has an
 * inline rename (Enter or blur saves, Escape cancels) and a confirmed permanent delete. A third,
 * read-only section lists every Legendary Event roster, planned or not, since those count as
 * recent snapshots and can hold back the automatic one.
 */
export function ManageSnapshotsSheet({
  open,
  onOpenChange,
  list,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  list: PersonalRosterSnapshotList | undefined
}) {
  const { t, i18n } = useTranslation("common")
  const [deleting, setDeleting] = useState<PersonalRosterSnapshot | null>(null)
  const runRecords = useManageRunRecords(open, list)
  const sections = manageSections(list)
  const keepable = canKeep(list)

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          className="sm:data-[side=right]:max-w-md"
          data-testid="manage-snapshots-sheet"
          onOpenAutoFocus={(event) => {
            // Focus the sheet itself, not the first row's keep button, which would show a focus
            // ring on a phone for no reason.
            event.preventDefault()
            if (event.currentTarget instanceof HTMLElement) {
              event.currentTarget.focus()
            }
          }}
        >
          <SheetHeader>
            <SheetTitle>
              {t("myGame.collection.snapshots.manageTitle")}
            </SheetTitle>
            <SheetDescription className="tabular-nums">
              {list
                ? t("myGame.collection.snapshots.usage", {
                    count: list.count,
                    limit: list.limit,
                  })
                : null}
            </SheetDescription>
          </SheetHeader>
          <SheetBody className="flex flex-col gap-6">
            <section data-testid="manage-snapshots-manual">
              {list && sections.manual.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  {t("myGame.collection.snapshots.none")}
                </p>
              ) : null}
              <ul className="flex flex-col divide-y">
                {sections.manual.map((snapshot) => (
                  <SnapshotRow
                    key={snapshot.id}
                    snapshot={snapshot}
                    onDelete={() => setDeleting(snapshot)}
                  />
                ))}
              </ul>
            </section>
            <section
              className="flex flex-col gap-2"
              data-testid="manage-snapshots-auto"
            >
              <div className="flex items-baseline justify-between gap-2">
                <h3 className="text-sm font-semibold">
                  {t("myGame.collection.snapshots.autoTitle")}
                </h3>
                {list ? (
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {t("myGame.collection.snapshots.usage", {
                      count: list.autoCount,
                      limit: list.autoLimit,
                    })}
                  </span>
                ) : null}
              </div>
              {list ? (
                <p className="text-sm text-muted-foreground">
                  {t("myGame.collection.snapshots.autoHint", {
                    limit: list.autoLimit,
                  })}
                </p>
              ) : null}
              {runRecords.status === "ready" ? (
                <p className="text-sm" data-testid="manage-snapshots-next-auto">
                  {runRecords.data.nextAuto.kind === "after"
                    ? t("myGame.collection.snapshots.nextAutoAfter", {
                        date: formatSnapshotDate(
                          new Date(runRecords.data.nextAuto.atMs).toISOString(),
                          i18n.language
                        ),
                      })
                    : t("myGame.collection.snapshots.nextAutoSync")}
                </p>
              ) : null}
              <ul className="flex flex-col divide-y">
                {sections.auto.map((snapshot) => (
                  <SnapshotRow
                    key={snapshot.id}
                    snapshot={snapshot}
                    keepable={keepable}
                    onDelete={() => setDeleting(snapshot)}
                  />
                ))}
              </ul>
            </section>
            <RunRecordsSection read={runRecords} />
          </SheetBody>
        </SheetContent>
      </Sheet>
      <DeleteSnapshotDialog
        snapshot={deleting}
        onClose={() => setDeleting(null)}
      />
    </>
  )
}

function RunRecordsSection({
  read,
}: {
  read: ReturnType<typeof useManageRunRecords>
}) {
  const { t, i18n } = useTranslation("common")
  return (
    <section
      className="flex flex-col gap-2"
      data-testid="manage-snapshots-run-records"
    >
      <h3 className="text-sm font-semibold">
        {t("myGame.collection.snapshots.leTitle")}
      </h3>
      <p className="text-sm text-muted-foreground">
        {t("myGame.collection.snapshots.leHint")}
      </p>
      {read.status === "loading" ? (
        <Skeleton className="h-10 w-full" />
      ) : read.status === "error" ? (
        <div className="flex items-center gap-2">
          <p className="text-sm text-destructive">
            {t("myGame.collection.snapshots.leError")}
          </p>
          <Button onClick={read.retry} size="sm" variant="outline">
            {t("myGame.collection.snapshots.retry")}
          </Button>
        </div>
      ) : read.data.rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {t("myGame.collection.snapshots.leNone")}
        </p>
      ) : (
        <ul className="flex flex-col divide-y">
          {read.data.rows.map((row) => (
            <li
              className="flex min-w-0 flex-col py-2"
              data-testid="manage-run-record-row"
              key={row.id}
            >
              <span className="truncate text-sm font-medium">
                {t("myGame.collection.snapshots.leRow", {
                  event: row.eventName,
                  run: row.run,
                })}
              </span>
              <span className="text-xs text-muted-foreground">
                {formatSnapshotDate(row.takenAt, i18n.language)} ·{" "}
                {formatRelativeTime(Date.parse(row.takenAt), i18n.language)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

function SnapshotRow({
  snapshot,
  keepable = false,
  onDelete,
}: {
  snapshot: PersonalRosterSnapshot
  /** Automatic rows only: Keep has room under the manual limit. */
  keepable?: boolean
  onDelete: () => void
}) {
  const { t, i18n } = useTranslation("common")
  const labels = useSourceLabels()
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(snapshot.name)
  const rename = useRenameRosterSnapshot()
  const keep = useKeepRosterSnapshot()
  const { captureEvent } = useAnalyticsActions()

  const save = () => {
    setEditing(false)
    const name = draft.trim()
    if (name === snapshot.name || !isValidSnapshotRename(name)) {
      setDraft(snapshot.name)
      return
    }
    rename.mutate(
      { snapshotId: snapshot.id, name },
      {
        onSuccess: () => captureEvent({ type: "roster_snapshot_renamed" }),
        onError: () => {
          setDraft(snapshot.name)
          toast.error(t("myGame.collection.snapshots.renameFailed"))
        },
      }
    )
  }

  const keepButton = (
    <Button
      variant="ghost"
      size="icon"
      aria-label={t("myGame.collection.snapshots.keep")}
      disabled={!keepable || keep.isPending}
      onClick={() =>
        keep.mutate(snapshot.id, {
          onSuccess: () => captureEvent({ type: "roster_snapshot_kept" }),
          onError: () =>
            toast.error(t("myGame.collection.snapshots.keepFailed")),
        })
      }
      data-testid="manage-snapshot-keep"
    >
      <BookmarkPlus aria-hidden />
    </Button>
  )

  return (
    <li
      className="flex items-center gap-2 py-2"
      data-testid="manage-snapshot-row"
      data-snapshot={snapshot.id}
    >
      <div className="flex min-w-0 flex-1 flex-col">
        {editing ? (
          <Input
            ref={(input) => input?.focus()}
            value={draft}
            maxLength={60}
            aria-label={t("myGame.collection.snapshots.nameLabel")}
            onChange={(event) => setDraft(event.target.value)}
            onBlur={save}
            onKeyDown={(event) => {
              if (event.key === "Enter") save()
              if (event.key === "Escape") {
                event.preventDefault()
                event.stopPropagation()
                setDraft(snapshot.name)
                setEditing(false)
              }
            }}
            data-testid="manage-snapshot-name-input"
          />
        ) : (
          <span className="flex min-w-0 items-center gap-1.5">
            <span className="truncate text-sm font-medium">
              {rename.isPending
                ? draft
                : snapshotLabel(snapshot, i18n.language, labels)}
            </span>
            {snapshot.source === "manual" ? null : (
              <Badge variant="secondary" data-testid="manage-snapshot-badge">
                {snapshot.source === "auto"
                  ? t("myGame.collection.snapshots.autoBadge")
                  : t("myGame.collection.snapshots.v1ImportBadge")}
              </Badge>
            )}
          </span>
        )}
        <span className="text-xs text-muted-foreground">
          {formatSnapshotDate(snapshot.takenAt, i18n.language)} ·{" "}
          {formatRelativeTime(Date.parse(snapshot.takenAt), i18n.language)}
        </span>
      </div>
      {snapshot.source === "auto" ? (
        keepable ? (
          keepButton
        ) : (
          <Tooltip>
            <TooltipTrigger asChild>
              {/* A disabled button fires no pointer events, so the span carries the tooltip. */}
              <span data-testid="manage-snapshot-keep-limit">{keepButton}</span>
            </TooltipTrigger>
            <TooltipContent>
              {t("myGame.collection.snapshots.keepLimitTooltip")}
            </TooltipContent>
          </Tooltip>
        )
      ) : null}
      <Button
        variant="ghost"
        size="icon"
        aria-label={t("myGame.collection.snapshots.rename")}
        onClick={() => {
          // From the current name, which may have changed since the row mounted.
          setDraft(snapshot.name)
          setEditing(true)
        }}
        disabled={editing || rename.isPending}
        data-testid="manage-snapshot-rename"
      >
        <Pencil aria-hidden />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        aria-label={t("myGame.collection.snapshots.delete")}
        onClick={onDelete}
        data-testid="manage-snapshot-delete"
      >
        <Trash2 aria-hidden />
      </Button>
    </li>
  )
}

function DeleteSnapshotDialog({
  snapshot,
  onClose,
}: {
  snapshot: PersonalRosterSnapshot | null
  onClose: () => void
}) {
  const { t, i18n } = useTranslation("common")
  const labels = useSourceLabels()
  const remove = useDeleteRosterSnapshot()
  const { captureEvent } = useAnalyticsActions()

  return (
    <ConfirmationDialog
      cancelLabel={t("myGame.collection.snapshots.cancel")}
      confirmLabel={t("myGame.collection.snapshots.deleteConfirm")}
      confirmTestId="delete-snapshot-confirm"
      data-testid="delete-snapshot-dialog"
      description={t("myGame.collection.snapshots.deleteBody")}
      onCancel={onClose}
      onConfirm={() => {
        if (!snapshot) return
        remove.mutate(snapshot.id, {
          onSuccess: () => {
            captureEvent({ type: "roster_snapshot_deleted" })
            onClose()
          },
          onError: () =>
            toast.error(t("myGame.collection.snapshots.deleteFailed")),
        })
      }}
      open={snapshot !== null}
      pending={remove.isPending}
      title={t("myGame.collection.snapshots.deleteTitle", {
        name: snapshot ? snapshotLabel(snapshot, i18n.language, labels) : "",
      })}
    />
  )
}
