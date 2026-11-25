import { useState } from "react"
import { useTranslation } from "react-i18next"
import type { Rarity } from "@workspace/game-domain"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@workspace/ui/components/accordion"
import { Button } from "@workspace/ui/components/button"

import { TeamUnitPortrait } from "@/entities/team"
import type { TeamRoster } from "@/entities/team"
import type { PickerUnit } from "@/features/team-editor"
import {
  ResponsiveDialog,
  ResponsiveDialogBody,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  SegmentedControl,
} from "@/shared/ui"
import { useUnitName } from "@/shared/unit-name"

import type { GuildWarSeason } from "../../lib/season"
import { cappedView } from "../../model/capped-view"
import { EMPTY_ENEMY, enemyFields } from "../../model/enemy-draft"
import type { EnemyDraft } from "../../model/enemy-draft"
import { lineupUnit } from "../../model/offense"
import type { Selection } from "../../model/offense"
import type {
  GuildWarAttackFields,
  GuildWarLineupUnit,
} from "../../model/types"
import { useGuildWarNames } from "../../model/use-guild-war-names"
import { EnemyDetails } from "./enemy-details"

type ResultChoice = "none" | "won" | "lost"
type LostChoice = "0" | "1" | "2"

/** The attack the dialog sends: the lineup from the roster, the target, the result and the enemy. */
function attackFields({
  selection,
  roster,
  zoneId,
  slot,
  result,
  lost,
  enemy,
}: {
  selection: Selection
  roster: TeamRoster | null
  zoneId: string
  slot: number
  result: ResultChoice
  lost: LostChoice
  enemy: EnemyDraft
}): GuildWarAttackFields {
  const lineup = [...selection].flatMap(([id, kind]) => {
    const unit = lineupUnit(roster, kind, id)
    return unit ? [{ kind, unit }] : []
  })
  const ofKind = (kind: "character" | "mow"): GuildWarLineupUnit[] =>
    lineup.filter((entry) => entry.kind === kind).map((entry) => entry.unit)
  return {
    zoneId,
    slot,
    characters: ofKind("character"),
    mow: ofKind("mow")[0] ?? null,
    result: result === "none" ? null : result,
    unitsLost: result === "won" ? Number(lost) : null,
    enemy: enemyFields(enemy),
  }
}

/**
 * Log attack (a bottom sheet on phones): the lineup at the slot's cap, the zone and slot, an
 * optional result, and the collapsed optional Enemy details.
 */
export function LogAttackDialog({
  open,
  onOpenChange,
  selection,
  roster,
  units,
  season,
  zoneId,
  slot,
  rarityCap,
  pending,
  error,
  onSave,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  selection: Selection
  roster: TeamRoster | null
  units: readonly PickerUnit[]
  season: GuildWarSeason | undefined
  zoneId: string
  slot: number
  rarityCap: Rarity | undefined
  pending: boolean
  error: string | null
  onSave: (fields: GuildWarAttackFields) => void
}) {
  const { t } = useTranslation("guildWar")
  const unitName = useUnitName()
  const { zoneName } = useGuildWarNames()
  const [result, setResult] = useState<ResultChoice>("none")
  const [lost, setLost] = useState<LostChoice>("0")
  const [enemy, setEnemy] = useState<EnemyDraft>(EMPTY_ENEMY)

  return (
    <ResponsiveDialog
      data-testid="guild-war-log-dialog"
      onOpenChange={onOpenChange}
      open={open}
      width="form"
    >
      <ResponsiveDialogHeader>
        <ResponsiveDialogTitle>{t("log.title")}</ResponsiveDialogTitle>
        <ResponsiveDialogDescription>
          {t("attack.target", {
            zone: zoneName(season, zoneId),
            slot: slot + 1,
          })}
        </ResponsiveDialogDescription>
      </ResponsiveDialogHeader>
      <ResponsiveDialogBody className="gap-5">
        <ul aria-label={t("attack.lineup")} className="flex flex-wrap gap-2">
          {[...selection].map(([id, kind]) => (
            <li
              aria-label={unitName(kind === "mow" ? "Mow" : "Character", id)}
              key={id}
            >
              <TeamUnitPortrait
                size="portrait-md"
                unit={
                  rarityCap
                    ? cappedView(kind, id, roster, rarityCap)
                    : { kind, unitId: id, owned: undefined }
                }
              />
            </li>
          ))}
        </ul>
        <div className="flex flex-col gap-3">
          <SegmentedControl
            label={t("log.result")}
            onValueChange={setResult}
            options={[
              { value: "none", label: t("log.resultNone") },
              { value: "won", label: t("log.resultWon") },
              { value: "lost", label: t("log.resultLost") },
            ]}
            testId="guild-war-log-result"
            value={result}
          />
          {result === "won" ? (
            <SegmentedControl
              label={t("log.unitsLost")}
              onValueChange={setLost}
              options={[
                { value: "0", label: "0" },
                { value: "1", label: "1" },
                { value: "2", label: t("log.twoOrMore") },
              ]}
              testId="guild-war-log-lost"
              value={lost}
            />
          ) : null}
        </div>
        <Accordion collapsible type="single">
          <AccordionItem value="enemy">
            <AccordionTrigger data-testid="guild-war-enemy-toggle">
              {t("log.enemyDetails")}
            </AccordionTrigger>
            <AccordionContent>
              <EnemyDetails
                onChange={setEnemy}
                season={season}
                units={units}
                value={enemy}
              />
            </AccordionContent>
          </AccordionItem>
        </Accordion>
        {error ? (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}
      </ResponsiveDialogBody>
      <ResponsiveDialogFooter>
        <Button onClick={() => onOpenChange(false)} variant="outline">
          {t("log.cancel")}
        </Button>
        <Button
          data-testid="guild-war-log-save"
          disabled={pending}
          onClick={() =>
            onSave(
              attackFields({
                selection,
                roster,
                zoneId,
                slot,
                result,
                lost,
                enemy,
              })
            )
          }
        >
          {t("log.save")}
        </Button>
      </ResponsiveDialogFooter>
    </ResponsiveDialog>
  )
}
