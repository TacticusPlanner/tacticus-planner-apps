import { useId, type ReactNode } from "react"
import { useTranslation } from "react-i18next"
import {
  abilityBadgeIcon,
  forgeBadgeIcon,
  goldIcon,
  mowComponentIcon,
  salvageIcon,
  type GameIcon,
} from "@workspace/game-catalog"
import {
  rarityOrder,
  type Rarity,
  type UpgradeId,
} from "@workspace/game-domain"
import { Label } from "@workspace/ui/components/label"
import { Switch } from "@workspace/ui/components/switch"
import { cn } from "@workspace/ui/lib/utils"

import type { UpgradeWithFarmLocations } from "@/features/rank-lookup"
import { EntityIcon, UpgradeIcon } from "@/shared/ui"

import { LevelSelect, RecipeIcons } from "./mow-upgrades-controls"
import {
  MOW_ABILITIES,
  type MowAbility,
  type MowLevelRanges,
  type MowUpgradesResult,
} from "./mow-upgrades.model"

/**
 * The Ability upgrades tab (V1's MoW Lookup): From/To levels per ability, Include owned materials,
 * and the range's Total needed, Upgrade materials and Per level breakdown. Recalculates on every
 * change; every figure derives from `result`.
 */
export function MowUpgradesTab({
  alliance,
  abilityNames,
  ranges,
  maxLevel,
  onFromChange,
  onToChange,
  result,
  includeOwned,
  onIncludeOwnedChange,
  upgradesById,
  isMobile,
}: {
  alliance: string
  abilityNames: Record<MowAbility, string>
  ranges: MowLevelRanges
  maxLevel: number
  onFromChange: (ability: MowAbility, level: number) => void
  onToChange: (ability: MowAbility, level: number) => void
  result: MowUpgradesResult
  /** `undefined` hides the toggle (signed out, or no synced inventory). */
  includeOwned: boolean | undefined
  onIncludeOwnedChange: (value: boolean) => void
  upgradesById: ReadonlyMap<UpgradeId, UpgradeWithFarmLocations>
  isMobile: boolean
}) {
  const { t, i18n } = useTranslation(["library", "progression", "upgrades"])
  const includeOwnedId = useId()
  const format = new Intl.NumberFormat(i18n.language)
  const allianceName = t(`npcs.alliances.${alliance}`, {
    defaultValue: alliance,
  })
  const rarityName = (rarity: Rarity) =>
    t(`progression:rarities.${rarity}`, { defaultValue: rarity })
  const totals = includeOwned ? result.remaining : result.needed
  const upgradeName = (id: UpgradeId) =>
    t(`upgrades:${id}`, { defaultValue: upgradesById.get(id)?.label ?? id })
  const hasSteps = result.steps.length > 0

  const boxes: { key: string; icon: GameIcon; label: string; value: number }[] =
    [
      {
        key: "gold",
        icon: goldIcon(),
        label: t("mowUnit.upgrades.gold"),
        value: totals.gold,
      },
      {
        key: "salvage",
        icon: salvageIcon(),
        label: t("mowUnit.upgrades.salvage"),
        value: totals.salvage,
      },
      {
        key: "components",
        icon: mowComponentIcon(alliance),
        label: t("mowUnit.upgrades.components", { alliance: allianceName }),
        value: totals.components,
      },
      ...rarityOrder
        .filter((rarity) => result.needed.badges[rarity] !== undefined)
        .map((rarity) => ({
          key: `badges-${rarity}`,
          icon: abilityBadgeIcon(rarity, alliance),
          label: t("mowUnit.upgrades.badges", {
            rarity: rarityName(rarity),
            alliance: allianceName,
          }),
          value: totals.badges[rarity] ?? 0,
        })),
      ...rarityOrder
        .filter((rarity) => result.needed.forgeBadges[rarity] !== undefined)
        .map((rarity) => ({
          key: `forge-${rarity}`,
          icon: forgeBadgeIcon(rarity),
          label: t("mowUnit.upgrades.forgeBadges", {
            rarity: rarityName(rarity),
          }),
          value: totals.forgeBadges[rarity] ?? 0,
        })),
    ]

  return (
    <div className="flex flex-col gap-5" data-testid="mow-upgrades">
      <div
        className={cn(
          "grid gap-4",
          isMobile
            ? "grid-cols-1"
            : "grid-cols-[repeat(auto-fit,minmax(min(380px,100%),1fr))]"
        )}
        data-testid="mow-upgrades-ranges"
      >
        {MOW_ABILITIES.map((ability) => (
          <fieldset
            key={ability}
            className="flex flex-col gap-3 rounded-lg border p-4"
            data-testid={`mow-range-${ability}`}
          >
            <legend className="px-1 text-sm font-semibold">
              {t(`mowUnit.abilities.${ability}`)} · {abilityNames[ability]}
            </legend>
            <div className="grid grid-cols-2 gap-3">
              <LevelSelect
                label={t("mowUnit.upgrades.from")}
                value={ranges[ability].from}
                min={1}
                max={maxLevel}
                onChange={(level) => onFromChange(ability, level)}
                data-testid={`mow-range-${ability}-from`}
              />
              <LevelSelect
                label={t("mowUnit.upgrades.to")}
                value={ranges[ability].to}
                min={ranges[ability].from}
                max={maxLevel}
                onChange={(level) => onToChange(ability, level)}
                data-testid={`mow-range-${ability}-to`}
              />
            </div>
          </fieldset>
        ))}
      </div>

      {includeOwned !== undefined ? (
        <div className="flex flex-wrap items-center gap-3">
          {/* The same switch as the character calculator's Include owned control. */}
          <div className="flex items-center gap-2">
            <Switch
              id={includeOwnedId}
              checked={includeOwned}
              onCheckedChange={onIncludeOwnedChange}
              data-testid="mow-include-owned"
            />
            <Label htmlFor={includeOwnedId}>
              {t("mowUnit.upgrades.includeOwned")}
            </Label>
          </div>
          <p className="text-sm text-muted-foreground">
            {includeOwned
              ? t("mowUnit.upgrades.includeOwnedOn")
              : t("mowUnit.upgrades.includeOwnedOff")}
          </p>
        </div>
      ) : null}

      <Card
        title={t("mowUnit.upgrades.totalTitle")}
        testId="mow-upgrades-totals"
      >
        <dl
          className={cn(
            "grid gap-2",
            isMobile
              ? "grid-cols-2"
              : "grid-cols-[repeat(auto-fit,minmax(150px,1fr))]"
          )}
        >
          {boxes.map((box) => (
            <div
              key={box.key}
              className="flex flex-col gap-1 rounded-md border p-3"
              data-testid={`mow-total-${box.key}`}
            >
              <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <EntityIcon src={box.icon} alt="" className="size-5" />
                {box.label}
              </dt>
              <dd className="text-xl font-bold tabular-nums">
                {format.format(box.value)}
              </dd>
            </div>
          ))}
        </dl>
      </Card>

      <Card
        title={t("mowUnit.upgrades.materialsTitle")}
        testId="mow-upgrades-materials"
      >
        {result.materials.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {t("mowUnit.upgrades.nothing")}
          </p>
        ) : (
          <ul className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-2">
            {result.materials.map((line) => {
              const count = includeOwned ? line.remaining : line.needed
              const covered = includeOwned && line.remaining === 0
              return (
                <li
                  key={line.id}
                  className="flex items-center gap-2 text-sm"
                  data-testid={`mow-material-${line.id}`}
                >
                  <UpgradeIcon
                    id={line.id}
                    rarity={line.rarity}
                    className="size-8 shrink-0"
                  />
                  <span className="min-w-0 flex-1 truncate">
                    {upgradeName(line.id)}
                  </span>
                  {covered ? (
                    <span className="text-xs font-semibold text-muted-foreground">
                      {t("mowUnit.upgrades.covered")}
                    </span>
                  ) : (
                    <span className="font-semibold tabular-nums">
                      {format.format(count)}
                    </span>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </Card>

      <Card
        title={t("mowUnit.upgrades.perLevelTitle")}
        testId="mow-upgrades-per-level"
      >
        {hasSteps ? (
          <div className="overflow-x-auto" data-testid="mow-upgrades-table-box">
            <table className="w-full min-w-[640px] text-sm tabular-nums">
              <thead>
                <tr className="text-left text-xs text-muted-foreground">
                  {(
                    [
                      "level",
                      "gold",
                      "salvage",
                      "badges",
                      "forgeBadges",
                      "components",
                      "materials",
                    ] as const
                  ).map((column) => (
                    <th key={column} scope="col" className="py-2 pr-3">
                      {t(`mowUnit.upgrades.columns.${column}`)}
                    </th>
                  ))}
                </tr>
              </thead>
              {MOW_ABILITIES.map((ability) => {
                const steps = result.steps.filter(
                  (step) => step.ability === ability
                )
                if (steps.length === 0) return null
                return (
                  <tbody key={ability} data-testid={`mow-steps-${ability}`}>
                    <tr>
                      <th
                        scope="rowgroup"
                        colSpan={7}
                        className="border-t py-2 text-left font-semibold"
                      >
                        {t(`mowUnit.abilities.${ability}`)} ·{" "}
                        {abilityNames[ability]}
                      </th>
                    </tr>
                    {steps.map((step) => (
                      <tr key={step.from} className="border-t">
                        <th scope="row" className="py-2 pr-3 font-medium">
                          {t("mowUnit.upgrades.step", {
                            from: step.from,
                            to: step.to,
                          })}
                        </th>
                        <td className="py-2 pr-3">
                          {format.format(step.gold)}
                        </td>
                        <td className="py-2 pr-3">
                          {format.format(step.salvage)}
                        </td>
                        <td className="py-2 pr-3">
                          {step.badges
                            ? `${format.format(step.badges.amount)} ${rarityName(step.badges.rarity)}`
                            : "0"}
                        </td>
                        <td className="py-2 pr-3">
                          {step.forgeBadges
                            ? `${format.format(step.forgeBadges.amount)} ${rarityName(step.forgeBadges.rarity)}`
                            : "0"}
                        </td>
                        <td className="py-2 pr-3">
                          {format.format(step.components)}
                        </td>
                        <td className="py-2 pr-3">
                          <RecipeIcons
                            recipe={step.recipe}
                            upgradesById={upgradesById}
                            nameOf={upgradeName}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                )
              })}
            </table>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            {t("mowUnit.upgrades.nothing")}
          </p>
        )}
      </Card>
    </div>
  )
}

function Card({
  title,
  testId,
  children,
}: {
  title: string
  testId: string
  children: ReactNode
}) {
  return (
    <section
      className="flex flex-col gap-3 rounded-lg border bg-card p-4"
      data-testid={testId}
    >
      <h2 className="font-heading text-base font-bold">{title}</h2>
      {children}
    </section>
  )
}
