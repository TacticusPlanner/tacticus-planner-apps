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
  encounters,
}: RaidBossesPageViewProps) {
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(220px,300px)_1fr]">
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
            encounters={encounters}
          />
        ) : null}
      </div>
    </div>
  )
}
