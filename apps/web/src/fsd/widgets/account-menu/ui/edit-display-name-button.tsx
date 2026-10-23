import { useTranslation } from "react-i18next"
import { Pencil } from "lucide-react"
import { Button } from "@workspace/ui/components/button"

/** Shortcut beside the shown account name, so changing it is one tap from the account menu. */
export function EditDisplayNameButton({ onClick }: { onClick: () => void }) {
  const { t } = useTranslation()

  return (
    <Button
      aria-label={t("auth.editDisplayName")}
      className="shrink-0 text-muted-foreground"
      data-testid="auth-edit-display-name"
      onClick={onClick}
      size="icon-xs"
      title={t("auth.editDisplayName")}
      type="button"
      variant="ghost"
    >
      <Pencil />
    </Button>
  )
}
