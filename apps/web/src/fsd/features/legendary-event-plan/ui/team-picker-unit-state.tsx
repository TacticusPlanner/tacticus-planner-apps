import { useTranslation } from "react-i18next"
import { Eye } from "lucide-react"
import { progressionRarity } from "@workspace/game-domain"

import type { LegendaryEventRosterUnit } from "@/entities/legendary-event"
import { RankBadge, RarityIcon } from "@/shared/ui"

/** An owned tile's strength line (spec: picker tiles show each owned unit's strength): rarity,
 *  rank and estimated clears ("~n", a dash while estimates load), plus the Goals Preview marker
 *  when the unit is previewed. */
export function TeamPickerUnitState({
  unit,
  clears,
  previewed,
}: {
  unit: Pick<LegendaryEventRosterUnit, "progressionIndex" | "rank">
  clears: number | null | "pending"
  previewed: boolean
}) {
  const { t } = useTranslation("legendaryEvents")
  return (
    <span
      className="flex items-center gap-1 text-xs text-muted-foreground tabular-nums"
      data-testid="team-picker-unit-state"
    >
      <RarityIcon
        className="size-4"
        rarity={progressionRarity(unit.progressionIndex)}
      />
      <RankBadge iconClassName="size-4" rank={unit.rank} showLabel={false} />
      {clears === "pending" ? (
        <span data-testid="team-picker-clears">
          <span aria-hidden>–</span>
          <span className="sr-only">{t("teams.picker.estimating")}</span>
        </span>
      ) : clears === null ? null : (
        <span data-testid="team-picker-clears">
          {t("estimates.clearsEstimate", { depth: clears })}
        </span>
      )}
      {previewed ? (
        <Eye
          aria-label={t("goalsPreview.marker")}
          className="size-3.5 text-primary"
          data-testid="team-picker-preview-marker"
        />
      ) : null}
    </span>
  )
}
