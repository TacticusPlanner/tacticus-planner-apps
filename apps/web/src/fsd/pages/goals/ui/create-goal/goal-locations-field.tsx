import { useTranslation } from "react-i18next"
import { Checkbox } from "@workspace/ui/components/checkbox"

/**
 * Checkbox list of a goal's farmable locations — either upgrade farm nodes (most costed goal types)
 * or a character's shard-drop nodes (Unlock, picked via `isUnlock`). Split out of
 * goal-detail-sheet.tsx to keep that file under this repo's max-lines rule, mirroring how
 * goal-projects-field.tsx was split out for the same reason.
 */
export function GoalLocationsField({
  isUnlock,
  allLocations,
  selectedLocations,
  overrideValid,
  onToggle,
}: {
  isUnlock: boolean
  allLocations: string[]
  selectedLocations: string[]
  overrideValid: boolean
  onToggle: (battleId: string, checked: boolean) => void
}) {
  const { t } = useTranslation()

  return (
    <section className="grid gap-2" data-testid="goal-detail-locations">
      <h3 className="font-semibold">
        {t(isUnlock ? "goals.detail.shardsTitle" : "goals.detail.farmingTitle")}
      </h3>
      <p className="text-muted-foreground">
        {t(
          isUnlock
            ? "goals.detail.shardsDescription"
            : "goals.detail.farmingDescription"
        )}
      </p>
      {allLocations.map((battleId) => (
        <label className="flex items-center gap-2" key={battleId}>
          <Checkbox
            checked={selectedLocations.includes(battleId)}
            onCheckedChange={(checked) => onToggle(battleId, checked === true)}
          />
          {battleId}
        </label>
      ))}
      {!overrideValid ? (
        <p className="text-destructive">{t("goals.detail.farmingInvalid")}</p>
      ) : null}
    </section>
  )
}
