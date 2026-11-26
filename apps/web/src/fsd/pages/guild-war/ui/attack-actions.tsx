import { useTranslation } from "react-i18next"
import { Pencil, Trash2 } from "lucide-react"
import { IconButton } from "@workspace/ui/components/icon-button"

/** An attack row's actions: Edit, and Delete where an attack may still be removed. */
export function AttackActions({
  onEdit,
  onDelete,
  deleting = false,
}: {
  onEdit: () => void
  onDelete?: () => void
  deleting?: boolean
}) {
  const { t } = useTranslation("guildWar")
  return (
    <span className="flex items-center gap-1">
      <IconButton
        label={t("attackLog.edit")}
        onClick={onEdit}
        size="icon-sm"
        variant="ghost"
      >
        <Pencil />
      </IconButton>
      {onDelete ? (
        <IconButton
          disabled={deleting}
          label={t("attackLog.delete")}
          onClick={onDelete}
          size="icon-sm"
          variant="ghost"
        >
          <Trash2 />
        </IconButton>
      ) : null}
    </span>
  )
}
