import { useTranslation } from "react-i18next"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"

import {
  RaidBossPortrait,
  type ResolvedRaidBossEncounterLocation,
} from "@/entities/raid-boss"

import type { RaidBossSeasonReferenceViewModel } from "./raid-boss-season-reference.view-model"

export function RaidBossSeasonReference({
  viewModel,
  seasonIds,
  onSeasonChange,
  onEncounterSelect,
}: {
  viewModel: RaidBossSeasonReferenceViewModel
  seasonIds: string[]
  onSeasonChange: (seasonId: string) => void
  onEncounterSelect: (location: ResolvedRaidBossEncounterLocation) => void
}) {
  const { t } = useTranslation("library")

  return (
    <div
      className="flex flex-col gap-6"
      data-testid="raid-boss-season-reference"
    >
      <label
        className="flex flex-wrap items-center gap-3 text-sm"
        data-testid="raid-boss-season-selector"
      >
        <span className="text-muted-foreground">{t("raidBosses.season")}</span>
        <Select value={viewModel.seasonId} onValueChange={onSeasonChange}>
          <SelectTrigger className="w-56">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {seasonIds.map((id, index) => (
              <SelectItem key={id} value={id}>
                {t("raidBosses.seasonLabel", { season: index + 1 })}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </label>

      {viewModel.tiers.map((tier) => (
        <section
          key={tier.tier}
          className="flex flex-col gap-4 rounded-lg border p-4"
          data-testid={`raid-boss-season-tier-${tier.tier}`}
        >
          <h2 className="text-lg font-semibold">
            {t("raidBosses.tier", { tier: tier.tier })}
          </h2>
          <div className="flex flex-col gap-4">
            {tier.sets.map((set) => (
              <div
                key={set.set}
                className="flex flex-col gap-2"
                data-testid={`raid-boss-season-set-${set.set}`}
              >
                <h3 className="text-sm font-medium text-muted-foreground">
                  {t("raidBosses.set", { set: set.set })}
                </h3>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:flex lg:flex-wrap">
                  {set.encounters.map((located) => (
                    <button
                      key={located.encounterIndex}
                      type="button"
                      aria-label={located.item.name}
                      onClick={() => onEncounterSelect(located)}
                      className="flex min-h-24 flex-col items-center justify-center gap-1 rounded-lg border p-2 text-center transition-colors hover:bg-accent focus-visible:outline-2 focus-visible:outline-primary"
                    >
                      <RaidBossPortrait
                        name={located.item.name}
                        src={located.item.portraitSrc}
                        className="size-14"
                      />
                      <span className="line-clamp-2 text-xs font-medium">
                        {located.item.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}
