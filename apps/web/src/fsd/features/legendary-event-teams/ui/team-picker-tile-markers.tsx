import { useTranslation } from "react-i18next"
import { traitIcon } from "@workspace/game-catalog"
import { cn } from "@workspace/ui/lib/utils"

import { tierToneClass } from "@/entities/legendary-event"
import { EntityIcon } from "@/shared/ui"

/** The support traits a picker tile marks, in display order. */
const SUPPORT_TRAITS = ["Healer", "Mechanic"] as const

/**
 * A picker tile's top-left markers, mirroring the reserve button: the horde-mode tier badge in its
 * tier colour, then an icon per support trait (Healer, Mechanic) stacked below it. Renders nothing
 * for an untiered unit with neither trait. Decorative to pointer input: a tap reaches the tile.
 */
export function TeamPickerTileMarkers({
  tier,
  traits,
}: {
  tier: string | null
  traits: readonly string[]
}) {
  const { t } = useTranslation(["legendaryEvents", "traits"])
  const supports = SUPPORT_TRAITS.filter((trait) => traits.includes(trait))
  if (!tier && supports.length === 0) return null
  return (
    <span
      className="pointer-events-none absolute top-0.5 left-0.5 flex flex-col items-center gap-0.5"
      data-testid="team-picker-markers"
    >
      {tier ? (
        <span
          className={cn(
            "flex size-5 items-center justify-center rounded-md border text-[10px] leading-none font-bold",
            tierToneClass(tier)
          )}
          data-testid="team-picker-tier"
          data-tier={tier}
          title={t("teams.picker.tier", { tier })}
        >
          <span aria-hidden="true">{tier}</span>
          <span className="sr-only">{t("teams.picker.tier", { tier })}</span>
        </span>
      ) : null}
      {supports.map((trait) => {
        const label = t(`traits:${trait}`, { defaultValue: trait })
        return (
          <span
            className="inline-flex"
            data-testid="team-picker-trait"
            data-trait={trait}
            key={trait}
            title={label}
          >
            <EntityIcon alt="" className="size-4" src={traitIcon(trait)} />
            <span className="sr-only">{label}</span>
          </span>
        )
      })}
    </span>
  )
}
