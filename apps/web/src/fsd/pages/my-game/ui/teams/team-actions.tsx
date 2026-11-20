import { useTranslation } from "react-i18next"
import { Pencil, Trash2 } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"

import type { Team } from "@/entities/team"

/** What a card or row can do with its team; moving is by its drag grip. */
export interface TeamActions {
  onEdit: (teamId: string) => void
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
      <Button
        aria-label={edit}
        className="text-muted-foreground hover:text-foreground pointer-coarse:size-12"
        data-testid="team-actions-edit"
        onClick={() => actions.onEdit(team.id)}
        size="icon-sm"
        title={edit}
        type="button"
        variant="ghost"
      >
        <Pencil />
      </Button>
      <Button
        aria-label={remove}
        className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive pointer-coarse:size-12"
        data-testid="team-actions-delete"
        onClick={() => actions.onDelete(team)}
        size="icon-sm"
        title={remove}
        type="button"
        variant="ghost"
      >
        <Trash2 />
      </Button>
    </span>
  )
}
