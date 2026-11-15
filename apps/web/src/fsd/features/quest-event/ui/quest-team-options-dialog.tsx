import { useState, type ReactNode } from "react"
import { useTranslation } from "react-i18next"
import { Check, Pin } from "lucide-react"
import { characterIcon, powerIcon } from "@workspace/game-catalog"
import type { UnitId } from "@workspace/game-domain"
import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"

import {
  EntityIcon,
  ResponsiveDialog,
  ResponsiveDialogBody,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@/shared/ui"

import {
  questPickedPower,
  toggleQuestPick,
  type QuestTeam,
} from "../model/quest-team"

/**
 * Every unit eligible for a quest battle, strongest first at the tier cap, with the featured hero
 * pinned on top. Starts from the suggested team; picks only compare power and are not saved.
 */
export function QuestTeamOptionsDialog({
  open,
  onOpenChange,
  team,
  battleNumber,
  nameOf,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  team: QuestTeam
  battleNumber: number | null
  nameOf: (unitId: string) => string
}) {
  const { t, i18n } = useTranslation("quest")
  const number = new Intl.NumberFormat(i18n.language)
  const featured = team.members.find((member) => member.featured)
  const suggested = team.members
    .filter((member) => !member.featured)
    .map((member) => member.unitId)
  const [picked, setPicked] = useState<string[]>(suggested)
  const power = questPickedPower(featured?.power ?? null, team.eligible, picked)

  return (
    <ResponsiveDialog
      data-testid="quest-team-options"
      desktopClassName="sm:max-w-xl"
      onOpenChange={onOpenChange}
      open={open}
    >
      <ResponsiveDialogHeader>
        <ResponsiveDialogTitle>
          {t("team.optionsTitle", { number: battleNumber ?? "" })}
        </ResponsiveDialogTitle>
        <p className="text-sm text-muted-foreground">{t("team.optionsHint")}</p>
      </ResponsiveDialogHeader>
      <ResponsiveDialogBody className="pb-3">
        <ol className="flex flex-col gap-1.5">
          {featured ? (
            <li>
              <OptionRow
                atCap={featured.atCap}
                lead={<Pin aria-hidden className="size-4 text-(--primary)" />}
                name={`${nameOf(featured.unitId)} · ${t("team.featured")}`}
                power={featured.power}
                selected
                unitId={featured.unitId}
              />
            </li>
          ) : null}
          {team.eligible.map((option, index) => {
            const selected = picked.includes(option.unitId)
            return (
              <li key={option.unitId}>
                <OptionRow
                  atCap={option.atCap}
                  lead={
                    selected ? (
                      <Check
                        aria-hidden
                        className="size-4 text-(--primary)"
                        data-testid="quest-team-option-selected"
                      />
                    ) : (
                      index + 1
                    )
                  }
                  name={nameOf(option.unitId)}
                  onPress={() =>
                    setPicked((current) =>
                      toggleQuestPick(current, option.unitId, team.openSlots)
                    )
                  }
                  power={option.power}
                  selected={selected}
                  unitId={option.unitId}
                />
              </li>
            )
          })}
        </ol>
      </ResponsiveDialogBody>
      <ResponsiveDialogFooter className="border-t md:justify-between">
        <p
          className="inline-flex items-center gap-1 text-sm tabular-nums"
          data-testid="quest-team-options-power"
        >
          <EntityIcon alt="" className="size-4" src={powerIcon()} />
          {t("team.optionsSelected", {
            count: picked.length,
            slots: team.openSlots,
            power: power === null ? "–" : number.format(power),
          })}
        </p>
        <div className="flex gap-2">
          <Button onClick={() => setPicked(suggested)} variant="outline">
            {t("team.optionsReset")}
          </Button>
          <Button onClick={() => onOpenChange(false)}>
            {t("team.optionsClose")}
          </Button>
        </div>
      </ResponsiveDialogFooter>
    </ResponsiveDialog>
  )
}

function OptionRow({
  unitId,
  name,
  power,
  atCap,
  selected,
  lead,
  onPress,
}: {
  unitId: string
  name: string
  power: number | null
  atCap: boolean
  selected: boolean
  lead: ReactNode
  onPress?: () => void
}) {
  const { t, i18n } = useTranslation("quest")
  const number = new Intl.NumberFormat(i18n.language)
  const body = (
    <>
      <span className="flex w-6 shrink-0 justify-end text-xs text-muted-foreground tabular-nums">
        {lead}
      </span>
      <EntityIcon
        alt=""
        className="size-8 shrink-0 rounded-full bg-portrait"
        src={characterIcon(unitId as UnitId)}
      />
      <span className="min-w-0 flex-1 truncate">{name}</span>
      {power === null ? null : (
        <span className="inline-flex items-center gap-1 tabular-nums">
          <EntityIcon alt="" className="size-4" src={powerIcon()} />
          {number.format(power)}
        </span>
      )}
      <span className="w-16 shrink-0 text-right text-xs text-muted-foreground">
        {atCap ? t("team.atCap") : t("team.belowCap")}
      </span>
    </>
  )
  const className = cn(
    "flex w-full items-center gap-2 rounded-md border px-2 py-1.5 text-left text-sm",
    selected && "border-primary/60 bg-primary/10"
  )
  if (!onPress) {
    return (
      <div className={className} data-testid="quest-team-option">
        {body}
      </div>
    )
  }
  return (
    <button
      aria-pressed={selected}
      className={cn(
        className,
        "transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
      )}
      data-testid="quest-team-option"
      data-unit={unitId}
      onClick={onPress}
      type="button"
    >
      {body}
    </button>
  )
}
