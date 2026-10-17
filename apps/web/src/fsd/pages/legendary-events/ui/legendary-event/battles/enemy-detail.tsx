import { useTranslation } from "react-i18next"
import { Link } from "react-router"
import { Button } from "@workspace/ui/components/button"

import { NpcPortrait, NpcStatSummary } from "@/entities/npc"

import type { EnemyTileViewModel } from "./battles.view-model"
import { useEnemyLabels } from "./enemy-label"

/**
 * The body shared by the desktop popover and the mobile sheet: the NPC's stat summary at the
 * resolved row, "Level unknown" when the row could not be resolved (no stats), and the Library link
 * only for variations the Library lists.
 */
export function EnemyDetail({ tile }: { tile: EnemyTileViewModel }) {
  const { t } = useTranslation("legendaryEvents")
  const { enemyName } = useEnemyLabels()
  const name = enemyName(tile)
  return (
    <div
      className="flex min-w-0 flex-col gap-3"
      data-testid="battle-enemy-detail"
    >
      {tile.npc ? (
        <NpcStatSummary npc={tile.npc} row={tile.row} />
      ) : (
        <div className="flex min-w-0 items-center gap-3">
          <NpcPortrait
            className="size-12"
            name={name}
            variationId={tile.npcId}
          />
          <p className="truncate font-semibold">{name}</p>
        </div>
      )}
      {tile.row ? null : (
        <p
          className="text-sm text-muted-foreground"
          data-testid="battle-enemy-level-unknown"
        >
          {tile.level === "pending"
            ? t("battles.enemy.npcsLoading")
            : t("battles.enemy.levelUnknown")}
        </p>
      )}
      {tile.libraryHref ? (
        <Button asChild size="sm" variant="outline">
          <Link data-testid="battle-enemy-library-link" to={tile.libraryHref}>
            {t("battles.enemy.openInLibrary")}
          </Link>
        </Button>
      ) : null}
    </div>
  )
}
