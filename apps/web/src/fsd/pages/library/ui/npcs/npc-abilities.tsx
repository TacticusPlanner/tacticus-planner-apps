import { useState } from "react"
import { useTranslation } from "react-i18next"
import { ChevronDown } from "lucide-react"
import { abilityIcon } from "@workspace/game-catalog"
import { cn } from "@workspace/ui/lib/utils"

import type { Rarity } from "@workspace/game-domain"

import { useNpcAbilityText } from "@/entities/npc"
import { AbilityText } from "@/shared/ability-text"
import { EntityIcon } from "@/shared/ui"

/**
 * The variation's abilities as name + icon chips in an Active / Passive column pair — 81% of units
 * have exactly one of each, so the kind is stated once per column rather than repeated per chip. A
 * column with nothing to show is omitted, which leaves a one-sided unit reading as a single labelled
 * list. Mobile stacks the columns.
 *
 * An ability whose rules text resolves completely (see `useNpcAbilityText`) is expandable: the text
 * is rendered for the selected level's `abilityLevel`, so it rescales with the Level selector. The
 * rest are plain chips — rather than show a half-substituted description. An id the game leaves
 * unnamed is an internal engine marker and is dropped rather than surfaced as a raw id.
 */
function AbilityChip({
  id,
  abilityLevel,
  unitName,
  rarity,
}: {
  id: string
  abilityLevel: number
  unitName: string
  rarity: Rarity
}) {
  const { t } = useTranslation("abilities")
  const abilityText = useNpcAbilityText()
  const [open, setOpen] = useState(false)
  const text = abilityText(id)
  const name = t(id)

  const chip = (
    <span className="flex items-center gap-1.5">
      <EntityIcon src={abilityIcon(id)} alt="" className="size-6 shrink-0" />
      <span className="truncate">{name}</span>
    </span>
  )
  // The chip is the card: expanding grows this one bordered box downward rather than dropping a
  // second box beneath it, so an open ability still reads as a single object in the column.
  const cardClass = "w-full overflow-hidden rounded-lg border bg-card text-sm"
  const rowClass = "flex w-full items-center gap-1.5 px-2 py-1.5 text-left"

  if (!text) {
    return (
      <li className={cn(cardClass, rowClass)} data-testid={`npc-ability-${id}`}>
        {chip}
      </li>
    )
  }

  return (
    <li className={cardClass} data-testid={`npc-ability-${id}`}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className={cn(
          rowClass,
          "hover:bg-accent focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary"
        )}
      >
        {chip}
        <ChevronDown
          aria-hidden
          className={cn(
            "ml-auto size-4 shrink-0 text-muted-foreground transition-transform",
            open && "rotate-180"
          )}
        />
      </button>
      {open ? (
        <div className="border-t px-2 py-1.5">
          <AbilityText
            text={text.description}
            level={abilityLevel}
            variables={text.variables}
            constants={text.constants}
            scaledVariableNames={text.scaled}
            rarity={rarity}
            unitName={unitName}
          />
        </div>
      ) : null}
    </li>
  )
}

function AbilityColumn({
  label,
  ids,
  testId,
  abilityLevel,
  unitName,
  rarity,
}: {
  label: string
  ids: readonly string[]
  testId: string
  abilityLevel: number
  unitName: string
  rarity: Rarity
}) {
  if (ids.length === 0) return null

  return (
    <div className="flex min-w-0 flex-col gap-1.5" data-testid={testId}>
      <h4 className="text-xs text-muted-foreground">{label}</h4>
      <ul className="flex flex-col gap-1.5">
        {ids.map((id) => (
          <AbilityChip
            key={id}
            id={id}
            abilityLevel={abilityLevel}
            unitName={unitName}
            rarity={rarity}
          />
        ))}
      </ul>
    </div>
  )
}

export function NpcAbilities({
  activeAbilities,
  passiveAbilities,
  abilityLevel,
  unitName,
  rarity,
  compact = false,
}: {
  activeAbilities: readonly string[]
  passiveAbilities: readonly string[]
  /** The selected level's ability level; rules text is resolved at this level. */
  abilityLevel: number
  unitName: string
  /** Derived from the selected level's star index; scales rarity-affected ability variables. */
  rarity: Rarity
  /** Mobile: stack the two columns instead of placing them side by side. */
  compact?: boolean
}) {
  const { t, i18n } = useTranslation(["library", "abilities"])
  const named = (ids: readonly string[]) =>
    ids.filter((id) => i18n.exists(`abilities:${id}`))
  const active = named(activeAbilities)
  const passive = named(passiveAbilities)

  if (active.length === 0 && passive.length === 0) return null

  return (
    <section className="flex flex-col gap-2" data-testid="npc-abilities">
      <h3 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
        {t("library:npcs.abilities.title")}
      </h3>
      <div
        className={cn(
          "grid items-start gap-x-6 gap-y-4",
          compact ? "grid-cols-1" : "grid-cols-2"
        )}
      >
        <AbilityColumn
          label={t("library:npcs.abilities.active")}
          ids={active}
          testId="npc-abilities-active"
          abilityLevel={abilityLevel}
          unitName={unitName}
          rarity={rarity}
        />
        <AbilityColumn
          label={t("library:npcs.abilities.passive")}
          ids={passive}
          testId="npc-abilities-passive"
          abilityLevel={abilityLevel}
          unitName={unitName}
          rarity={rarity}
        />
      </div>
    </section>
  )
}
