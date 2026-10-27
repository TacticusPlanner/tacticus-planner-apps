import { useTranslation } from "react-i18next"
import { Button } from "@workspace/ui/components/button"
import { Checkbox } from "@workspace/ui/components/checkbox"
import { Label } from "@workspace/ui/components/label"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@workspace/ui/components/toggle-group"

import { NumberStepper } from "@/shared/ui"

import type { QuestBattle } from "../model/quest-battles"
import type { QuestProgressActions } from "../model/use-quest-progress"
import {
  EMPTY_BATTLE_ENTRY,
  MAX_MEDALS,
  type QuestBattleEntry,
  type QuestScoring,
} from "../model/quest-score"
import { useObjectiveWording } from "./use-objective-wording"

const MEDAL_VALUES = Array.from({ length: MAX_MEDALS + 1 }, (_, value) => value)

/**
 * The player's best attempt at one battle: medals 0 to 3, Lightning Victory points 0 to the served
 * maximum with a "Full HP" shortcut, and a tick per objective. With 0 medals the battle is not won, so the Lightning
 * Victory entry and ticks are disabled (and kept). `actions` null renders it read-only.
 */
export function ScoreEntry({
  battle,
  entry = EMPTY_BATTLE_ENTRY,
  scoring,
  actions,
}: {
  battle: QuestBattle
  entry?: QuestBattleEntry
  scoring: QuestScoring
  actions: QuestProgressActions | null
}) {
  const maxLightning = scoring.maxPointsForLightningVictory
  const { t, i18n } = useTranslation("quest")
  const word = useObjectiveWording()
  const number = new Intl.NumberFormat(i18n.language)
  const readOnly = actions === null
  const won = entry.medals > 0
  const idBase = `quest-battle-${battle.number}`
  return (
    <fieldset
      className="flex min-w-0 flex-col gap-3 rounded-xl border p-3"
      data-testid="quest-score-entry"
      disabled={readOnly}
    >
      <legend className="px-1 text-sm font-semibold">{t("entry.title")}</legend>
      <div className="flex flex-col gap-1.5">
        <span className="text-sm font-medium" id={`${idBase}-medals`}>
          {t("entry.medals")}
        </span>
        <ToggleGroup
          aria-labelledby={`${idBase}-medals`}
          className="w-fit"
          disabled={readOnly}
          onValueChange={(value) => {
            if (value !== "") actions?.setMedals(battle.number, Number(value))
          }}
          type="single"
          value={String(entry.medals)}
          variant="outline"
        >
          {MEDAL_VALUES.map((value) => (
            <ToggleGroupItem
              aria-label={t("entry.medalsValue", { count: value })}
              className="min-h-11 min-w-11"
              key={value}
              value={String(value)}
            >
              {value}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>
      <div className="flex flex-col gap-1.5">
        <span className="text-sm font-medium">{t("entry.lightning")}</span>
        <div className="flex flex-wrap items-center gap-2">
          <NumberStepper
            disabled={readOnly || !won}
            labels={{
              value: t("entry.lightning"),
              decrease: t("entry.lightningDecrease"),
              increase: t("entry.lightningIncrease"),
            }}
            max={maxLightning}
            min={0}
            onChange={(value) =>
              actions?.setLightning(battle.number, value ?? 0)
            }
            step={10}
            touch
            value={entry.lightning}
          />
          <Button
            disabled={readOnly || !won}
            onClick={() => actions?.setLightning(battle.number, maxLightning)}
            size="sm"
            type="button"
            variant="outline"
          >
            {t("entry.fullHp")}
          </Button>
        </div>
      </div>
      {battle.objectives.length > 0 ? (
        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-medium">{t("entry.objectives")}</span>
          <ul className="flex flex-col gap-2">
            {battle.objectives.map((objective, index) => {
              const id = `${idBase}-objective-${index}`
              return (
                <li className="flex items-start gap-2" key={id}>
                  <Checkbox
                    checked={entry.objectives[index] === true}
                    className="mt-0.5"
                    disabled={readOnly || !won}
                    id={id}
                    onCheckedChange={(checked) =>
                      actions?.setObjective(
                        battle.number,
                        index,
                        checked === true
                      )
                    }
                  />
                  <Label className="text-sm font-normal" htmlFor={id}>
                    {word(objective)}
                    <span className="text-muted-foreground tabular-nums">
                      {" · "}
                      {number.format(objective.score)}
                    </span>
                  </Label>
                </li>
              )
            })}
          </ul>
        </div>
      ) : null}
      {!won && !readOnly ? (
        <p className="text-xs text-muted-foreground">{t("entry.notWon")}</p>
      ) : null}
    </fieldset>
  )
}
