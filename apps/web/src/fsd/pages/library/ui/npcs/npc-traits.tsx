import { useTranslation } from "react-i18next"
import { traitIcon } from "@workspace/game-catalog"
import type { Rarity } from "@workspace/game-domain"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@workspace/ui/components/popover"

import { useNpcTraitText } from "@/entities/npc"
import { AbilityText } from "@/shared/ability-text"
import { EntityIcon } from "@/shared/ui"

/**
 * Trait chips: icon + localized name, always visible — an icon-only chip is unreadable on touch.
 *
 * A trait with rules text opens it in a popover anchored to the chip. The traits row is a wrapping
 * tag cloud, so expanding a chip in place would reflow every chip after it; a popover leaves the row
 * untouched, and unlike the previous hover tooltip it works on touch. Trait values are global
 * constants rather than per-level tables, so the text does not change with the selected level.
 */
function TraitChip({ trait, rarity }: { trait: string; rarity: Rarity }) {
  const { t } = useTranslation(["library", "traits"])
  const traitText = useNpcTraitText()
  const label = t(`traits:${trait}`, { defaultValue: trait })
  const text = traitText(trait)

  const chipClass =
    "flex items-center gap-1.5 rounded-lg border bg-card px-2 py-1.5 text-sm"
  const chip = (
    <>
      <EntityIcon src={traitIcon(trait)} alt="" className="size-6" />
      <span>{label}</span>
    </>
  )

  if (!text) {
    return (
      <li className={chipClass} data-testid={`npc-trait-${trait}`}>
        {chip}
      </li>
    )
  }

  return (
    <li data-testid={`npc-trait-${trait}`}>
      <Popover>
        <PopoverTrigger asChild>
          <button
            type="button"
            aria-label={label}
            className={`${chipClass} hover:bg-accent focus-visible:outline-2 focus-visible:outline-primary`}
          >
            {chip}
          </button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-72">
          <p className="mb-1 text-sm font-medium">{label}</p>
          <AbilityText
            text={text.description}
            level={1}
            variables={text.variables}
            rarity={rarity}
          />
        </PopoverContent>
      </Popover>
    </li>
  )
}

export function NpcTraits({
  traits,
  rarity,
}: {
  traits: readonly string[]
  /** Only used for rarity-scaled tokens; trait values are global constants. */
  rarity: Rarity
}) {
  const { t } = useTranslation("library")

  return (
    <section className="flex flex-col gap-2" data-testid="npc-traits">
      <h3 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
        {t("npcs.traits")}
      </h3>
      {traits.length === 0 ? (
        <p
          className="rounded-lg border border-dashed px-3 py-4 text-center text-sm text-muted-foreground"
          data-testid="npc-traits-empty"
        >
          {t("npcs.noTraits")}
        </p>
      ) : (
        <ul className="flex flex-wrap gap-2">
          {traits.map((trait) => (
            <TraitChip key={trait} trait={trait} rarity={rarity} />
          ))}
        </ul>
      )}
    </section>
  )
}
