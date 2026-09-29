import type { RaidBossesPageViewProps } from "../raid-bosses-page.view-model"
import { RaidBossDetail } from "../raid-boss-detail"
import { RaidBossMobilePicker } from "./raid-boss-mobile-picker"

export function RaidBossesMobilePage({
  rosterGroups,
  selectedUnit,
  selectedName,
  selectedId,
  onSelect,
  stepIndex,
  onStepChange,
  modifierContext,
  fieldEnemies,
  adjusted,
}: RaidBossesPageViewProps) {
  return (
    <div className="flex flex-col gap-6">
      <RaidBossMobilePicker
        rosterGroups={rosterGroups}
        selectedId={selectedId}
        onSelect={onSelect}
      />
      {selectedUnit ? (
        <div className="rounded-lg border p-4">
          <RaidBossDetail
            unit={selectedUnit}
            name={selectedName}
            stepIndex={stepIndex}
            onStepChange={onStepChange}
            modifierContext={modifierContext}
            fieldEnemies={fieldEnemies}
            adjusted={adjusted}
            compact
          />
        </div>
      ) : null}
    </div>
  )
}
