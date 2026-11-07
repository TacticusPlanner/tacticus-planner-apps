import { useTranslation } from "react-i18next"
import { characterIcon } from "@workspace/game-catalog"
import type { UnitId } from "@workspace/game-domain"

import { useDateLocale } from "@/shared/lib"
import {
  EntityIcon,
  EventIcon,
  EventInstanceSwitcher,
  formatEventWindow,
} from "@/shared/ui"

import type { HreInstance } from "../model/hre-instance"
import type { HreFeaturedHero } from "../model/use-hre-instance"

/**
 * Picks which Hero Release Event the HRE tab shows: the shared event switcher (a select grouped
 * Running / Upcoming / Past between Previous / Next buttons), each option the featured hero's icon,
 * localized name and the event's date range. A hero id that does not resolve shows the raw id.
 */
export function HreEventSwitcher({
  instances,
  heroes,
  selectedKey,
  onSelect,
  className,
}: {
  instances: readonly HreInstance[]
  heroes: ReadonlyMap<string, HreFeaturedHero>
  selectedKey: string | null
  onSelect: (key: string) => void
  className?: string
}) {
  const { t } = useTranslation(["hre", "characters"])
  const dateLocale = useDateLocale()

  return (
    <EventInstanceSwitcher
      className={className}
      instances={instances}
      labels={{
        label: t("hre:switcher.label"),
        placeholder: t("hre:switcher.placeholder"),
        empty: t("hre:switcher.empty"),
        previous: t("hre:switcher.previous"),
        next: t("hre:switcher.next"),
        groups: {
          running: t("hre:switcher.groups.running"),
          upcoming: t("hre:switcher.groups.upcoming"),
          past: t("hre:switcher.groups.past"),
        },
      }}
      onSelect={onSelect}
      renderOption={(instance) => {
        const hero = instance.featuredCharacterId
          ? heroes.get(instance.featuredCharacterId)
          : undefined
        const name = hero
          ? t(`characters:${hero.id}`, { defaultValue: hero.name })
          : (instance.featuredCharacterId ?? t("hre:status.unknownHero"))
        return (
          <>
            {hero ? (
              <EntityIcon
                alt=""
                className="size-6 shrink-0 rounded-full"
                src={characterIcon(hero.id as UnitId)}
              />
            ) : (
              <EventIcon
                className="size-6 shrink-0"
                definitionId={instance.entry.definitionId}
                definitionType="NewCharacterEvent"
              />
            )}
            {t("hre:switcher.option", {
              name,
              dates: formatEventWindow(instance.entry, dateLocale),
            })}
          </>
        )
      }}
      selectedKey={selectedKey}
      testIdPrefix="hre-event"
    />
  )
}
