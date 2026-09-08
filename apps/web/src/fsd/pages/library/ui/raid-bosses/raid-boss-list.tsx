import { useTranslation } from "react-i18next"
import { cn } from "@workspace/ui/lib/utils"

import { RaidBossPortrait, type RaidBossListItem } from "@/entities/raid-boss"

function Section({
  title,
  items,
  selectedId,
  onSelect,
  testId,
}: {
  title: string
  items: RaidBossListItem[]
  selectedId: string | undefined
  onSelect: (id: string) => void
  testId: string
}) {
  if (items.length === 0) return null

  return (
    <section className="flex flex-col gap-2" data-testid={testId}>
      <h2 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
        {title}
      </h2>
      <div className="flex flex-wrap gap-2">
        {items.map((item) => (
          <button
            key={item.unitSetId}
            type="button"
            onClick={() => onSelect(item.unitSetId)}
            aria-pressed={item.unitSetId === selectedId}
            className={cn(
              "flex w-24 flex-col items-center gap-1.5 rounded-lg border p-2 text-center transition-colors",
              "hover:bg-accent focus-visible:outline-2 focus-visible:outline-primary",
              item.unitSetId === selectedId
                ? "border-primary bg-accent"
                : "border-border"
            )}
          >
            <RaidBossPortrait name={item.name} className="size-14" />
            <span className="line-clamp-2 text-xs font-medium">
              {item.name}
            </span>
          </button>
        ))}
      </div>
    </section>
  )
}

export function RaidBossList({
  bosses,
  primes,
  selectedId,
  onSelect,
}: {
  bosses: RaidBossListItem[]
  primes: RaidBossListItem[]
  selectedId: string | undefined
  onSelect: (id: string) => void
}) {
  const { t } = useTranslation("library")

  return (
    <div className="flex flex-col gap-5">
      <Section
        title={t("raidBosses.bosses")}
        items={bosses}
        selectedId={selectedId}
        onSelect={onSelect}
        testId="raid-boss-list-bosses"
      />
      <Section
        title={t("raidBosses.primes")}
        items={primes}
        selectedId={selectedId}
        onSelect={onSelect}
        testId="raid-boss-list-primes"
      />
    </div>
  )
}
