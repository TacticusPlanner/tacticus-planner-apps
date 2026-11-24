import { useTranslation } from "react-i18next"
import { Pencil } from "lucide-react"
import { IconButton } from "@workspace/ui/components/icon-button"

/** Shortcut beside the shown account name, so changing it is one tap from the account menu. */
export function EditDisplayNameButton({ onClick }: { onClick: () => void }) {
  const { t } = useTranslation()

  return (
    <IconButton
      className="shrink-0 text-muted-foreground"
      data-testid="auth-edit-display-name"
      label={t("auth.editDisplayName")}
      onClick={onClick}
      size="icon-xs"
      type="button"
    >
      <Pencil />
    </IconButton>
  )
}
