import type { RaidBossesPageViewProps } from "../raid-bosses-page.view-model"
import { RaidBossDetail } from "../raid-boss-detail"
import { RaidBossList } from "../raid-boss-list"

export function RaidBossesDesktopPage({
  bosses,
  primes,
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
    <div className="grid gap-6 lg:grid-cols-[minmax(13.75rem,18.75rem)_1fr]">
      <div className="lg:sticky lg:top-4 lg:self-start">
        <RaidBossList
          bosses={bosses}
          primes={primes}
          selectedId={selectedId}
          onSelect={onSelect}
        />
      </div>
      <div className="min-w-0">
        {selectedUnit ? (
          <RaidBossDetail
            unit={selectedUnit}
            name={selectedName}
            stepIndex={stepIndex}
            onStepChange={onStepChange}
            modifierContext={modifierContext}
            fieldEnemies={fieldEnemies}
            adjusted={adjusted}
          />
        ) : null}
      </div>
    </div>
  )
}
