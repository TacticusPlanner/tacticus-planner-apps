import { useTranslation } from "react-i18next"
import { Checkbox } from "@workspace/ui/components/checkbox"

import { InfoHint } from "../shared/info-hint"

/**
 * Checkbox list of a goal's farmable locations — either upgrade farm nodes (most costed goal types)
 * or a character's shard-drop nodes (Unlock, picked via `isUnlock`). Split out of
 * the edit form to keep that file under this repo's max-lines rule, mirroring how
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
    <section className="grid gap-1.5" data-testid="goal-edit-locations">
      <h3 className="flex items-center gap-1.5 font-semibold">
        {t(isUnlock ? "goals.detail.shardsTitle" : "goals.detail.farmingTitle")}
        <InfoHint
          text={t(
            isUnlock
              ? "goals.detail.shardsDescription"
              : "goals.detail.farmingDescription"
          )}
        />
      </h3>
      <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
        {allLocations.map((battleId) => (
          <label className="flex items-center gap-2" key={battleId}>
            <Checkbox
              checked={selectedLocations.includes(battleId)}
              onCheckedChange={(checked) =>
                onToggle(battleId, checked === true)
              }
            />
            {battleId}
          </label>
        ))}
      </div>
      {!overrideValid ? (
        <p className="text-destructive">{t("goals.detail.farmingInvalid")}</p>
      ) : null}
    </section>
  )
}
