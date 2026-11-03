import { useState } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { Pencil, Trash2 } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@workspace/ui/components/sheet"

import {
  useDeleteRosterSnapshot,
  useRenameRosterSnapshot,
  type PersonalRosterSnapshot,
  type PersonalRosterSnapshotList,
} from "@/entities/roster-snapshot"
import { useAnalyticsActions } from "@/shared/analytics"
import { formatRelativeTime } from "@/shared/lib"
import {
  ResponsiveDialog,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@/shared/ui"

import { formatSourceDate } from "../../../model/compare-labels"
import { isValidSnapshotRename } from "../../../model/take-snapshot"

/**
 * Lists the personal snapshots newest first (never Legendary Event rosters) with usage, an inline
 * rename (Enter or blur saves, Escape cancels) and a confirmed permanent delete.
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
  const { t } = useTranslation("common")
  const [deleting, setDeleting] = useState<PersonalRosterSnapshot | null>(null)

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent data-testid="manage-snapshots-sheet">
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
          <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4">
            {list && list.items.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {t("myGame.collection.snapshots.none")}
              </p>
            ) : null}
            <ul className="flex flex-col divide-y">
              {list?.items.map((snapshot) => (
                <SnapshotRow
                  key={snapshot.id}
                  snapshot={snapshot}
                  onDelete={() => setDeleting(snapshot)}
                />
              ))}
            </ul>
          </div>
        </SheetContent>
      </Sheet>
      <DeleteSnapshotDialog
        snapshot={deleting}
        onClose={() => setDeleting(null)}
      />
    </>
  )
}

function SnapshotRow({
  snapshot,
  onDelete,
}: {
  snapshot: PersonalRosterSnapshot
  onDelete: () => void
}) {
  const { t, i18n } = useTranslation("common")
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(snapshot.name)
  const rename = useRenameRosterSnapshot()
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
          <span className="truncate text-sm font-medium">
            {rename.isPending ? draft : snapshot.name}
          </span>
        )}
        <span className="text-xs text-muted-foreground">
          {formatSourceDate(snapshot.takenAt, i18n.language)} ·{" "}
          {formatRelativeTime(Date.parse(snapshot.takenAt), i18n.language)}
        </span>
      </div>
      <Button
        variant="ghost"
        size="icon"
        aria-label={t("myGame.collection.snapshots.rename")}
        onClick={() => setEditing(true)}
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
  const { t } = useTranslation("common")
  const remove = useDeleteRosterSnapshot()
  const { captureEvent } = useAnalyticsActions()

  return (
    <ResponsiveDialog
      open={snapshot !== null}
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
      desktopClassName="sm:max-w-md"
      data-testid="delete-snapshot-dialog"
    >
      <ResponsiveDialogHeader>
        <ResponsiveDialogTitle>
          {t("myGame.collection.snapshots.deleteTitle", {
            name: snapshot?.name ?? "",
          })}
        </ResponsiveDialogTitle>
        <p className="text-sm text-muted-foreground">
          {t("myGame.collection.snapshots.deleteBody")}
        </p>
      </ResponsiveDialogHeader>
      <ResponsiveDialogFooter>
        <Button variant="outline" onClick={onClose}>
          {t("myGame.collection.snapshots.cancel")}
        </Button>
        <Button
          variant="destructive"
          disabled={remove.isPending}
          onClick={() => {
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
          data-testid="delete-snapshot-confirm"
        >
          {t("myGame.collection.snapshots.deleteConfirm")}
        </Button>
      </ResponsiveDialogFooter>
    </ResponsiveDialog>
  )
}
