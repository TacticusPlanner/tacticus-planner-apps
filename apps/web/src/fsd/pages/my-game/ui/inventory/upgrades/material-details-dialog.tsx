import { useTranslation } from "react-i18next"
import { Link } from "react-router"
import { Info } from "lucide-react"
import {
  campaignDescriptor,
  characterIcon,
  mowIcon,
} from "@workspace/game-catalog"
import type {
  BattleId,
  Rarity,
  UnitId,
  UpgradeId,
} from "@workspace/game-domain"
import { Button } from "@workspace/ui/components/button"

import { goalTypeIcon, useGlobalGoalPlan } from "@/entities/goal"
import type { GoalDetail } from "@/entities/goal"
import { useCampaignDisplay } from "@/shared/lib"
import type { Battle } from "@/shared/lib"
import {
  CampaignLocationName,
  EntityIcon,
  energyIconUrl,
  HintTrigger,
  ResponsiveDialog,
  ResponsiveDialogBody,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  TruncatedText,
  UpgradeIcon,
} from "@/shared/ui"
import { useUnitName } from "@/shared/unit-name"

import { bestFarmSpots, recipeTree } from "../../../model/inventory-upgrades"
import type {
  InventoryUpgradeRow,
  InventoryUpgradeSource,
  RecipeNode,
} from "../../../model/inventory-upgrades"

type DetailsProps = {
  row: InventoryUpgradeRow | undefined
  onOpenChange: (open: boolean) => void
  held: ReadonlyMap<UpgradeId, number>
  upgradesById: ReadonlyMap<UpgradeId, InventoryUpgradeSource>
  battlesById: ReadonlyMap<BattleId, Battle> | undefined
  /** The campaign battles read, so a failed read is not shown as "no farm locations". */
  battles: { status: "loading" | "ready" | "error"; retry: () => void }
  onCloseAutoFocus?: (event: Event) => void
  name: (id: UpgradeId, fallback: string) => string
  needsReady: boolean
}

/**
 * One material's details (opened from a tile or row, kept in `?material=`): have / need / short, its
 * recipe as a tree with what is held of each part and how many can be crafted now, its cheapest farm
 * locations by energy per drop, and the goals that need it, each opening that goal.
 */
export function MaterialDetailsDialog(props: DetailsProps) {
  const { row, onOpenChange, onCloseAutoFocus } = props
  return (
    <ResponsiveDialog
      data-testid="inventory-material-details"
      onCloseAutoFocus={onCloseAutoFocus}
      onOpenChange={onOpenChange}
      open={row !== undefined}
      width="form"
    >
      {row ? <DetailsContent {...props} row={row} /> : null}
    </ResponsiveDialog>
  )
}

function DetailsContent({
  row,
  onOpenChange,
  held,
  upgradesById,
  battlesById,
  battles,
  name,
  needsReady,
}: DetailsProps & { row: InventoryUpgradeRow }) {
  const { t, i18n } = useTranslation(["inventory", "progression"])
  const format = (value: number) => value.toLocaleString(i18n.language)
  const upgrade = upgradesById.get(row.id)
  const recipe = recipeTree(row.id, held, upgradesById)

  return (
    <>
      <ResponsiveDialogHeader className="flex-row items-center gap-3">
        <UpgradeIcon
          crafted={row.crafted}
          id={row.id}
          rarity={row.rarity}
          size="icon-2xl"
        />
        <div className="flex min-w-0 flex-col gap-1">
          <ResponsiveDialogTitle>{row.name}</ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            {t("upgrades.details.description", {
              rarity: t(`progression:rarities.${row.rarity}`, {
                defaultValue: row.rarity,
              }),
              stat: t(`upgrades.stats.${row.stat}`, { defaultValue: row.stat }),
              kind: t(
                `upgrades.toolbar.kinds.${row.crafted ? "crafted" : "basic"}`
              ),
            })}
          </ResponsiveDialogDescription>
        </div>
      </ResponsiveDialogHeader>
      <ResponsiveDialogBody className="gap-5">
        <dl className="grid grid-cols-3 gap-2 text-center">
          <Stat label={t("upgrades.details.have")} value={format(row.have)} />
          <Stat
            label={t("upgrades.details.need")}
            value={needsReady ? format(row.need) : "…"}
          />
          <Stat
            label={t("upgrades.details.short")}
            tone={needsReady && row.short > 0 ? "short" : undefined}
            value={needsReady ? format(row.short) : "…"}
          />
        </dl>

        {recipe.length > 0 ? (
          <section
            className="flex flex-col gap-2"
            data-testid="inventory-material-recipe"
          >
            <h3 className="text-sm font-semibold">
              {t("upgrades.details.recipe")}
            </h3>
            <RecipeList
              format={format}
              describe={(id) => {
                const part = upgradesById.get(id)
                return {
                  name: name(id, part?.label ?? id),
                  rarity: part?.rarity,
                  crafted: part?.crafted,
                }
              }}
              nodes={recipe}
            />
            <p className="text-sm text-muted-foreground">
              {row.canCraft !== null && row.canCraft > 0
                ? t("upgrades.details.canCraft", {
                    amount: format(row.canCraft),
                  })
                : t("upgrades.details.cannotCraft")}
            </p>
          </section>
        ) : null}

        {row.crafted ? null : (
          <FarmSpots
            battles={battles}
            battlesById={battlesById}
            farmLocations={upgrade?.farmLocations ?? []}
          />
        )}

        <MaterialGoals goalIds={row.goalIds} needsReady={needsReady} />
      </ResponsiveDialogBody>
      <ResponsiveDialogFooter>
        <Button onClick={() => onOpenChange(false)} variant="outline">
          {t("upgrades.details.close")}
        </Button>
      </ResponsiveDialogFooter>
    </>
  )
}

/** Where a basic material drops, cheapest energy per drop first; a loading or retry line while the
 *  campaign battles are read, so a failed read never reads as "no campaign battle drops it". */
function FarmSpots({
  farmLocations,
  battles,
  battlesById,
}: {
  farmLocations: InventoryUpgradeSource["farmLocations"]
  battles: DetailsProps["battles"]
  battlesById: DetailsProps["battlesById"]
}) {
  const { t, i18n } = useTranslation("inventory")
  const spots = bestFarmSpots(
    farmLocations,
    (battleId) => battlesById?.get(battleId)?.energyCost
  )
  return (
    <section
      className="flex flex-col gap-2"
      data-testid="inventory-material-farm"
    >
      <h3 className="flex items-center gap-1 text-sm font-semibold">
        {t("upgrades.details.farm")}
        <HintTrigger label={t("upgrades.details.energyHint")}>
          <Info aria-hidden className="size-icon-sm text-muted-foreground" />
        </HintTrigger>
      </h3>
      {battles.status === "loading" ? (
        <p className="text-sm text-muted-foreground" role="status">
          {t("upgrades.details.farmLoading")}
        </p>
      ) : battles.status === "error" ? (
        <p
          className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground"
          role="status"
        >
          {t("upgrades.details.farmFailed")}
          <Button onClick={battles.retry} size="sm" variant="outline">
            {t("upgrades.retry")}
          </Button>
        </p>
      ) : spots.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {t("upgrades.details.noFarm")}
        </p>
      ) : (
        <ul className="flex flex-col gap-1.5 text-sm">
          {spots.map((spot) => (
            <li
              className="flex flex-wrap items-center justify-between gap-x-3"
              key={spot.battleId}
            >
              <span className="font-medium">
                <BattleName battle={battlesById?.get(spot.battleId)} />
              </span>
              <span className="flex items-center gap-1 text-muted-foreground tabular-nums">
                <EntityIcon alt="" size="icon" src={energyIconUrl} />
                {t("upgrades.details.energyPerItem", {
                  energy: spot.energyPerItem.toLocaleString(i18n.language, {
                    maximumFractionDigits: 1,
                  }),
                })}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string
  value: string
  tone?: "short"
}) {
  return (
    <div className="flex flex-col gap-0.5 rounded-lg border p-2">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd
        className={
          tone === "short"
            ? "text-lg font-semibold text-destructive tabular-nums"
            : "text-lg font-semibold tabular-nums"
        }
      >
        {value}
      </dd>
    </div>
  )
}

/** A recipe's parts, each with its own parts nested below it when it is crafted. */
function RecipeList({
  nodes,
  describe,
  format,
}: {
  nodes: readonly RecipeNode[]
  describe: (id: UpgradeId) => {
    name: string
    rarity: Rarity | undefined
    crafted: boolean | undefined
  }
  format: (value: number) => string
}) {
  const { t } = useTranslation("inventory")
  return (
    <ul className="flex flex-col gap-1.5">
      {nodes.map((node, index) => {
        const part = describe(node.id)
        return (
          <li className="flex flex-col gap-1.5" key={`${node.id}-${index}`}>
            <span className="flex items-center gap-2 text-sm">
              <UpgradeIcon
                crafted={part.crafted}
                id={node.id}
                rarity={part.rarity}
              />
              <span className="tabular-nums">{node.count} ×</span>
              <span className="min-w-0 font-medium">{part.name}</span>
              <span className="ms-auto shrink-0 text-muted-foreground tabular-nums">
                {t("upgrades.details.partHave", { have: format(node.have) })}
              </span>
            </span>
            {node.parts.length > 0 ? (
              <div className="ms-4 border-s ps-3">
                <RecipeList
                  describe={describe}
                  format={format}
                  nodes={node.parts}
                />
              </div>
            ) : null}
          </li>
        )
      })}
    </ul>
  )
}

/** A campaign battle in the app's one location format ("Fall of Cadia *Elite* 22"). */
function BattleName({ battle }: { battle: Battle | undefined }) {
  const { t } = useTranslation("inventory")
  const { campaignName, difficultyLabel } = useCampaignDisplay()
  const descriptor = battle
    ? campaignDescriptor(battle.campaignGroupId, battle.type, battle.challenge)
    : undefined
  // A battle or campaign the catalog doesn't know yet: never show its raw id.
  if (!battle || !descriptor) return t("upgrades.details.unknownBattle")
  const difficulty = difficultyLabel(descriptor)
  const node = `${battle.nodeNumber}${battle.challenge ? "B" : ""}`
  return (
    <CampaignLocationName
      campaignName={campaignName(descriptor)}
      difficultyLabel={difficulty}
      nodeLabel={difficulty ? `${difficulty} ${node}` : node}
    />
  )
}

/** The goals that need the material, each a chip opening that goal on the Goals list. */
function MaterialGoals({
  goalIds,
  needsReady,
}: {
  goalIds: readonly string[]
  needsReady: boolean
}) {
  const { t } = useTranslation(["inventory", "common"])
  const { goals } = useGlobalGoalPlan()
  const unitName = useUnitName()
  if (!needsReady) return null
  const byId = new Map(goals.map((goal) => [goal.goalId, goal]))
  return (
    <section
      className="flex flex-col gap-2"
      data-testid="inventory-material-goals"
    >
      <h3 className="text-sm font-semibold">{t("upgrades.details.goals")}</h3>
      {goalIds.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {t("upgrades.details.noGoals")}
        </p>
      ) : (
        <ul className="flex flex-wrap gap-1.5">
          {goalIds.map((goalId) => {
            const goal = byId.get(goalId)
            return (
              <li key={goalId}>
                <GoalChip
                  goal={goal}
                  goalId={goalId}
                  label={
                    goal
                      ? t("upgrades.details.goalLabel", {
                          name: unitName(goal.entityType, goal.entityId),
                          goalType: t(
                            `common:goals.create.goalTypes.${goal.goalType}`,
                            { defaultValue: goal.goalType }
                          ),
                        })
                      : t("upgrades.details.unknownGoal")
                  }
                />
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}

function GoalChip({
  goal,
  goalId,
  label,
}: {
  goal: GoalDetail | undefined
  goalId: string
  label: string
}) {
  const portrait =
    goal?.entityType === "Character"
      ? characterIcon(goal.entityId as UnitId)
      : goal?.entityType === "Mow"
        ? mowIcon(goal.entityId as UnitId)
        : undefined
  return (
    <Link
      className="relative flex min-w-0 items-center gap-1.5 rounded-full border bg-muted/40 interactive-surface p-0.5 pr-2.5 text-xs"
      to={`/plan/goals?goal=${encodeURIComponent(goalId)}`}
    >
      {portrait ? (
        <EntityIcon
          alt=""
          className="shrink-0 rounded-full"
          size="portrait-sm"
          src={portrait}
        />
      ) : null}
      <TruncatedText className="min-w-0">{label}</TruncatedText>
      {goal ? (
        <EntityIcon
          alt=""
          className="shrink-0"
          size="icon"
          src={goalTypeIcon(goal.goalType, goal.entityType)}
        />
      ) : null}
    </Link>
  )
}
