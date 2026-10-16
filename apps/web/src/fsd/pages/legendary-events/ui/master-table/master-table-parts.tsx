import { useTranslation } from "react-i18next"
import { Lock } from "lucide-react"
import { characterIcon } from "@workspace/game-catalog"
import { progressionRarity } from "@workspace/game-domain"
import { cn } from "@workspace/ui/lib/utils"

import type { MasterTableRow } from "@/entities/legendary-event"
import { EntityIcon, RankBadge, RarityIcon } from "@/shared/ui"

/** Portrait, localized name, rarity and rank (owned units), or the locked marker. */
export function MasterTableUnit({
  row,
  name,
}: {
  row: MasterTableRow
  name: string
}) {
  const { t } = useTranslation("legendaryEvents")
  return (
    <span className="flex min-w-0 items-center gap-2">
      <EntityIcon
        alt=""
        className={cn(
          "size-8 shrink-0 rounded-full",
          row.owned === false && "opacity-50 grayscale"
        )}
        src={characterIcon(row.unit.id)}
      />
      <span className="flex min-w-0 flex-col">
        <span
          className="truncate font-medium"
          data-testid="master-table-unit-name"
        >
          {name}
        </span>
        <span className="flex items-center gap-1 text-xs text-muted-foreground">
          {row.progression ? (
            <RarityIcon
              className="size-4"
              rarity={progressionRarity(row.progression)}
            />
          ) : null}
          {row.rank ? (
            <RankBadge
              iconClassName="size-4"
              rank={row.rank}
              showLabel={false}
              tooltip
            />
          ) : null}
          {row.owned === false ? (
            <span
              className="inline-flex items-center gap-1"
              data-testid="master-table-locked"
            >
              <Lock aria-hidden="true" className="size-3" />
              {t("leaderboard.locked")}
            </span>
          ) : null}
        </span>
      </span>
    </span>
  )
}
