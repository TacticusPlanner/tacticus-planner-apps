import { useTranslation } from "react-i18next"
import { Pencil, Trash2 } from "lucide-react"
import { IconButton } from "@workspace/ui/components/icon-button"
import { cn } from "@workspace/ui/lib/utils"

import type { Team } from "@/entities/team"

/** What a card or row can do with its team; moving is by its drag grip. */
export interface TeamActions {
  /** Opens the editor on the team as it is now; the editor keeps it if the team is deleted meanwhile. */
  onEdit: (team: Team) => void
  onDelete: (team: Team) => void
}

/**
 * A team's Edit and Delete, always visible on its card or row as labelled icon buttons (32px with
 * a mouse, 48px on touch). Edit is the only way into the editor; Delete asks first.
 */
export function TeamActionButtons({
  team,
  actions,
  className,
}: {
  team: Team
  actions: TeamActions
  className?: string
}) {
  const { t } = useTranslation("teams")
  const edit = t("card.editTeam", { name: team.name })
  const remove = t("card.deleteTeam", { name: team.name })
  return (
    <span
      className={cn("relative z-10 flex shrink-0 items-center", className)}
      data-testid="team-actions"
    >
      <IconButton
        className="text-muted-foreground hover:text-foreground pointer-coarse:size-12"
        label={edit}
        onClick={() => actions.onEdit(team)}
        size="icon-sm"
        type="button"
      >
        <Pencil />
      </IconButton>
      <IconButton
        className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive pointer-coarse:size-12"
        label={remove}
        onClick={() => actions.onDelete(team)}
        size="icon-sm"
        type="button"
      >
        <Trash2 />
      </IconButton>
    </span>
  )
}
