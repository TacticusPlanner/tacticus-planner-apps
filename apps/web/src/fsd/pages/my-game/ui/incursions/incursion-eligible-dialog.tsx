import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Check } from "lucide-react"
import {
  battleGlyphIcon,
  characterIcon,
  factionIcon,
  powerIcon,
  traitIcon,
} from "@workspace/game-catalog"
import type { UnitId } from "@workspace/game-domain"
import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"

import {
  CompactProgression,
  EntityIcon,
  RankBadge,
  ResponsiveDialog,
  ResponsiveDialogBody,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@/shared/ui"

import {
  hasSustain,
  teamPowerOf,
  toggleTeamMember,
} from "../../model/incursion-plan.model"
import type { IncursionCandidate } from "../../model/incursion-plan.model"
import type { Incursion } from "../../model/incursions.model"

const SUPPORT_TRAITS = ["Healer", "Mechanic"] as const

/**
 * Every hero of the MoW's allowed factions, strongest first, to try out a team against the tiers'
 * enemy power. Starts from the suggested team; picks are not saved.
 */
export function IncursionEligibleDialog({
  open,
  onOpenChange,
  incursion,
  eligible,
  suggested,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  incursion: Incursion
  eligible: readonly IncursionCandidate[]
  suggested: readonly IncursionCandidate[]
}) {
  const { t, i18n } = useTranslation([
    "incursions",
    "characters",
    "factions",
    "mows",
  ])
  const [picked, setPicked] = useState<string[]>(() =>
    suggested.map((member) => member.id)
  )
  const number = new Intl.NumberFormat(i18n.language)
  const team = eligible.filter((unit) => picked.includes(unit.id))
  const mowName = t(`mows:${incursion.mowId}`, {
    defaultValue: incursion.mowId,
  })

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={onOpenChange}
      width="form"
      data-testid="incursion-eligible-dialog"
    >
      <ResponsiveDialogHeader>
        <ResponsiveDialogTitle>
          {t("eligible.title", { mow: mowName })}
        </ResponsiveDialogTitle>
        <ResponsiveDialogDescription>
          {t("eligible.hint")}
        </ResponsiveDialogDescription>
      </ResponsiveDialogHeader>
      <ResponsiveDialogBody>
        <ol className="grid gap-1.5 @xl:grid-cols-2">
          {eligible.map((unit, at) => {
            const name = t(`characters:${unit.id}`, { defaultValue: unit.id })
            const selected = picked.includes(unit.id)
            return (
              <li key={unit.id}>
                <button
                  type="button"
                  aria-pressed={selected}
                  onClick={() =>
                    setPicked((current) => toggleTeamMember(current, unit.id))
                  }
                  className={cn(
                    "flex w-full items-center gap-2 rounded-md border interactive-surface px-2 py-1.5 text-left text-sm",
                    selected && "border-primary/60 bg-primary/10"
                  )}
                  data-testid={`incursion-eligible-${unit.id}`}
                >
                  <span className="flex w-6 shrink-0 justify-end text-xs text-muted-foreground tabular-nums">
                    {selected ? (
                      <Check
                        className="size-icon-sm text-(--primary)"
                        aria-hidden="true"
                        data-testid="incursion-eligible-selected"
                      />
                    ) : (
                      at + 1
                    )}
                  </span>
                  <EntityIcon
                    size="portrait-sm"
                    src={characterIcon(unit.id as UnitId)}
                    alt=""
                    className="shrink-0 rounded-sm"
                  />
                  <span className="min-w-0 flex-1 space-y-0.5">
                    <span className="block truncate">{name}</span>
                    {unit.progression || unit.rank ? (
                      <span className="flex items-center gap-2">
                        {unit.progression ? (
                          <CompactProgression value={unit.progression} />
                        ) : null}
                        {unit.rank ? (
                          <RankBadge
                            rank={unit.rank}
                            showLabel={false}
                            tooltip
                          />
                        ) : null}
                      </span>
                    ) : null}
                  </span>
                  {SUPPORT_TRAITS.filter((trait) =>
                    unit.traits.includes(trait)
                  ).map((trait) => (
                    <EntityIcon
                      size="inline"
                      key={trait}
                      src={traitIcon(trait)}
                      alt={trait}
                      className="shrink-0"
                    />
                  ))}
                  <EntityIcon
                    size="inline"
                    src={factionIcon(unit.faction)}
                    alt={t(`factions:${unit.faction}`, {
                      defaultValue: unit.faction,
                    })}
                    className="shrink-0"
                  />
                  <span className="flex w-24 shrink-0 items-center justify-end gap-1 tabular-nums">
                    <EntityIcon size="inline" src={powerIcon()} alt="" />
                    {number.format(Math.round(unit.power))}
                  </span>
                </button>
              </li>
            )
          })}
        </ol>
      </ResponsiveDialogBody>
      <ResponsiveDialogFooter>
        <p
          className="inline-flex flex-wrap items-center gap-1 text-sm tabular-nums max-md:basis-full md:mr-auto"
          data-testid="incursion-eligible-power"
        >
          <EntityIcon size="inline" alt="" src={powerIcon()} />
          {t("eligible.selected", {
            count: team.length,
            power: number.format(Math.round(teamPowerOf(team))),
          })}
          {hasSustain(team) ? (
            <>
              {" · "}
              <EntityIcon size="inline" alt="" src={battleGlyphIcon("heal")} />
              {t("team.sustain")}
            </>
          ) : null}
        </p>
        <Button
          variant="ghost"
          onClick={() => setPicked(suggested.map((member) => member.id))}
        >
          {t("eligible.reset")}
        </Button>
        <Button onClick={() => onOpenChange(false)}>
          {t("eligible.done")}
        </Button>
      </ResponsiveDialogFooter>
    </ResponsiveDialog>
  )
}
