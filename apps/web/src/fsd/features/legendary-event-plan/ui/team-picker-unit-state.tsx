import { useTranslation } from "react-i18next"
import { Eye } from "lucide-react"

/** An owned tile's strength line under its unit chip (spec: picker tiles show each owned unit's
 *  strength; the chip shows rarity, stars, rank and ability levels): estimated clears ("~n", a
 *  dash while estimates load), plus the Goals Preview marker when the unit is previewed. */
export function TeamPickerUnitState({
  clears,
  previewed,
}: {
  clears: number | null | "pending"
  previewed: boolean
}) {
  const { t } = useTranslation("legendaryEvents")
  return (
    <span
      className="flex items-center gap-1 text-xs text-muted-foreground tabular-nums"
      data-testid="team-picker-unit-state"
    >
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
