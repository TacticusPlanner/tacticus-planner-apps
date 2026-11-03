import { useId, useState } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { BookmarkPlus, Pencil, Trash2 } from "lucide-react"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@workspace/ui/components/sheet"
import { Switch } from "@workspace/ui/components/switch"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip"

import { usePlanningSettings } from "@/entities/planning-setting"
import {
  formatSnapshotDate,
  snapshotLabel,
  useDeleteRosterSnapshot,
  useKeepRosterSnapshot,
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

import { canKeep, manageSections } from "../../../model/manage-snapshots"
import { isValidSnapshotRename } from "../../../model/take-snapshot"
import { useSourceLabels } from "../../../model/use-source-labels"

/**
 * The personal snapshots newest first (never Legendary Event rosters) in two sections (design D3):
 * manual ones with V1 imports, then automatic ones with their quota, the setting and Keep. Each row
 * has an inline rename (Enter or blur saves, Escape cancels) and a confirmed permanent delete.
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
  const sections = manageSections(list)
  const keepable = canKeep(list)

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
          <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto px-4 pb-4">
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
                <p className="text-xs text-muted-foreground">
                  {t("myGame.collection.snapshots.autoHint", {
                    limit: list.autoLimit,
                  })}
                </p>
              ) : null}
              {/* Only needs the settings, so it stays usable when the list fails to load. */}
              <AutoSnapshotsSetting />
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

/** The account-wide `autoRosterSnapshots` setting; sends only that field, so other settings keep
 *  their stored values. */
function AutoSnapshotsSetting() {
  const { t } = useTranslation("common")
  const id = useId()
  const { settings, loading, failed, retry, save } = usePlanningSettings()
  const [saving, setSaving] = useState(false)
  const { captureEvent } = useAnalyticsActions()

  const change = async (enabled: boolean) => {
    setSaving(true)
    try {
      await save({
        dailyEnergy: settings.dailyEnergy,
        xpBookRarity: settings.xpBookRarity,
        revision: settings.revision,
        autoRosterSnapshots: enabled,
      })
      captureEvent({ type: "roster_auto_snapshots_toggled", enabled })
    } catch {
      toast.error(t("myGame.collection.snapshots.autoSettingFailed"))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Switch
        id={id}
        checked={settings.autoRosterSnapshots}
        // A failed read leaves defaults in `settings`; saving them would overwrite the stored values.
        disabled={loading || saving || failed}
        onCheckedChange={(enabled) => void change(enabled)}
        data-testid="auto-snapshots-setting"
      />
      <Label htmlFor={id}>{t("myGame.collection.snapshots.autoSetting")}</Label>
      {failed ? (
        <Button
          variant="link"
          size="sm"
          className="ml-auto h-auto p-0"
          onClick={retry}
          data-testid="auto-snapshots-setting-retry"
        >
          {t("myGame.collection.snapshots.autoSettingRetry")}
        </Button>
      ) : null}
    </div>
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
            name: snapshot
              ? snapshotLabel(snapshot, i18n.language, labels)
              : "",
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
