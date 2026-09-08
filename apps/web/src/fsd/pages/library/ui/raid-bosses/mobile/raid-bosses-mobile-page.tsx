import type { RaidBossesPageViewProps } from "../raid-bosses-page.view-model"
import { RaidBossDetail } from "../raid-boss-detail"
import { RaidBossList } from "../raid-boss-list"

export function RaidBossesMobilePage({
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
    <div className="flex flex-col gap-6">
      <RaidBossList
        bosses={bosses}
        primes={primes}
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
            encounters={encounters}
            compact
          />
        </div>
      ) : null}
    </div>
  )
}
