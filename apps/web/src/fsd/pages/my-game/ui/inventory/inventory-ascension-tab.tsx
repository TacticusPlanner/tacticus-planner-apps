import { useState } from "react"
import type { ReactNode } from "react"
import { useTranslation } from "react-i18next"
import {
  abilityBadgeIcon,
  allianceOrbIcon,
  forgeBadgeIcon,
  mowComponentIcon,
  onslaughtAllianceIcon,
  requisitionOrderIcon,
  resetStoneIcon,
  xpBookIcon,
} from "@workspace/game-catalog"
import type { GameIcon } from "@workspace/game-catalog"
import type { Rarity } from "@workspace/game-domain"
import type { PlayerDataChunkDto } from "@workspace/player-data"
import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"

import { numberFormat } from "@/shared/lib"
import { useLevelRules } from "@/entities/goal-farming"
import {
  PlanningSettingsDialog,
  normalizeXpBookRarity,
  usePlanningSettings,
} from "@/entities/planning-setting"
import { usePlanItemNeeds } from "@/features/goal-planning"
import { usePlayerChunk } from "@/shared/local-data"
import { EntityIcon, HintTrigger, RarityIcon } from "@/shared/ui"

import {
  allianceRarityCounts,
  componentCounts,
  ORB_RARITIES,
  rarityCounts,
  xpBooksView,
} from "../../model/inventory-ascension"
import type {
  Alliance,
  AscensionCount,
  XpBooksView,
} from "../../model/inventory-ascension"
import { InventoryReadGate } from "./inventory-read-gate"
import { useInventoryTutorial } from "./inventory.tutorial"
import type { InventoryTabStep } from "./inventory.tutorial"

const TOUR_STEPS: readonly InventoryTabStep[] = [
  { target: "inventory-xp-books", key: "ascensionXp" },
  { target: "inventory-ability-badges", key: "ascensionResources" },
]

type Inventory = PlayerDataChunkDto<"inventory">

/** Inventory > Ascension: XP books, ability badges, orbs, forge badges, Machine of War components,
 *  requisition orders and reset stones, each with what the goals need. */
export function InventoryAscensionTab() {
  useInventoryTutorial(TOUR_STEPS)
  const read = usePlayerChunk("inventory")
  return (
    <InventoryReadGate read={read}>
      {(inventory) => <AscensionContent inventory={inventory} />}
    </InventoryReadGate>
  )
}

function AscensionContent({ inventory }: { inventory: Inventory }) {
  const { t } = useTranslation("inventory")
  const plan = usePlanItemNeeds()
  const needsReady = !plan.loading && !plan.isError
  const { needs } = plan

  return (
    <div className="flex flex-col gap-4">
      {plan.isError ? (
        <p
          className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground"
          role="status"
        >
          {t("upgrades.needsFailed")}
          <Button onClick={plan.retry} size="sm" variant="outline">
            {t("upgrades.retry")}
          </Button>
        </p>
      ) : needsReady ? null : (
        <p className="text-sm text-muted-foreground" role="status">
          {t("upgrades.needsLoading")}
        </p>
      )}
      <XpBooks
        inventory={inventory}
        needsReady={needsReady}
        xpNeed={needs.xp}
      />
      <AllianceRaritySection
        icon={abilityBadgeIcon}
        itemKey="abilityBadge"
        needsReady={needsReady}
        rows={allianceRarityCounts(
          inventory.abilityBadges,
          needs.abilityBadges
        )}
        testId="inventory-ability-badges"
        title={t("ascension.sections.abilityBadges")}
      />
      <AllianceRaritySection
        icon={allianceOrbIcon}
        itemKey="orb"
        needsReady={needsReady}
        rows={allianceRarityCounts(inventory.orbs, needs.orbs, ORB_RARITIES)}
        testId="inventory-orbs"
        title={t("ascension.sections.orbs")}
      />
      <div className="grid gap-4 lg:grid-cols-2">
        <ForgeBadges
          counts={rarityCounts(inventory.forgeBadges, needs.forgeBadges)}
          needsReady={needsReady}
        />
        <Components
          counts={componentCounts(inventory.components, needs.components)}
          needsReady={needsReady}
        />
      </div>
      <Section
        testId="inventory-other-resources"
        title={t("ascension.sections.other")}
      >
        <ul className="flex flex-wrap gap-2">
          <ResourceCell
            count={{
              have: inventory.requisitionOrdersRegular,
              need: 0,
              short: 0,
            }}
            icon={requisitionOrderIcon()}
            label={t("ascension.items.regular")}
            needsReady={needsReady}
            showName
          />
          <ResourceCell
            count={{
              have: inventory.requisitionOrdersBlessed,
              need: 0,
              short: 0,
            }}
            icon={requisitionOrderIcon(true)}
            label={t("ascension.items.blessed")}
            needsReady={needsReady}
            showName
          />
          <ResourceCell
            count={{ have: inventory.resetStones, need: 0, short: 0 }}
            icon={resetStoneIcon()}
            label={t("ascension.items.resetStones")}
            needsReady={needsReady}
            showName
          />
        </ul>
      </Section>
    </div>
  )
}

function Section({
  title,
  testId,
  children,
  aside,
}: {
  title: string
  testId: string
  children: ReactNode
  aside?: ReactNode
}) {
  return (
    <section
      className="flex min-w-0 flex-col gap-3 rounded-xl border bg-card p-4"
      data-testid={testId}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold">{title}</h2>
        {aside}
      </div>
      {children}
    </section>
  )
}

function useFormat() {
  const { i18n } = useTranslation()
  return (value: number) => numberFormat(i18n.language).format(value)
}

/**
 * One resource: its icon (named by a hint that keyboard and touch reach too), what is held and, while the
 * goals need it, "have / need" and what is short.
 */
function ResourceCell({
  icon,
  label,
  count,
  needsReady,
  showName = false,
  as: Tag = "li",
}: {
  icon: GameIcon | undefined
  label: string
  count: AscensionCount
  needsReady: boolean
  /** Shows the name beside the icon, for a resource its icon alone doesn't tell apart. */
  showName?: boolean
  as?: "li" | "td"
}) {
  const { t } = useTranslation("inventory")
  const format = useFormat()
  const needed = needsReady && count.need > 0
  return (
    <Tag className={cn("min-w-0", Tag === "td" && "p-1")}>
      <div
        className={cn(
          "flex items-center gap-2",
          showName
            ? "rounded-lg border p-2 pe-3"
            : "flex-col gap-1 text-center",
          count.have === 0 && !needed && "text-muted-foreground"
        )}
      >
        <HintTrigger className="shrink-0" label={label}>
          <EntityIcon alt="" size="icon-2xl" src={icon} />
        </HintTrigger>
        <span className={cn("flex flex-col", !showName && "items-center")}>
          <span className={showName ? "text-sm" : "sr-only"}>{label}</span>
          <span className="text-sm font-semibold tabular-nums">
            {needed
              ? t("count.haveNeed", {
                  have: format(count.have),
                  need: format(count.need),
                })
              : format(count.have)}
          </span>
          {needed && count.short > 0 ? (
            <span className="text-xs font-medium text-destructive tabular-nums">
              {t("count.short", { amount: format(count.short) })}
            </span>
          ) : null}
        </span>
      </div>
    </Tag>
  )
}

/** The six XP books, the XP they add up to, the goals' XP need and what is short in the planned
 *  book rarity (changed in the planning settings). */
function XpBooks({
  inventory,
  needsReady,
  xpNeed,
}: {
  inventory: Inventory
  needsReady: boolean
  /** The goals' XP need from the page's one plan run. */
  xpNeed: { need: number; short: number }
}) {
  const { t } = useTranslation(["inventory", "progression"])
  const format = useFormat()
  const levelRules = useLevelRules()
  const { settings } = usePlanningSettings()
  const [settingsOpen, setSettingsOpen] = useState(false)
  const rarityName = (rarity: Rarity) =>
    t(`progression:rarities.${rarity}`, { defaultValue: rarity })

  const view = levelRules
    ? xpBooksView({
        inventory: inventory.xpBooks,
        books: levelRules.xpBooks,
        xpNeed,
        bookRarity: normalizeXpBookRarity(settings.xpBookRarity),
      })
    : undefined

  return (
    <Section
      aside={
        <Button
          onClick={() => setSettingsOpen(true)}
          size="sm"
          variant="outline"
        >
          {t("ascension.xp.change")}
        </Button>
      }
      testId="inventory-xp-books"
      title={t("ascension.sections.xpBooks")}
    >
      {view ? (
        <>
          <ul className="grid grid-cols-3 gap-2 sm:grid-cols-6">
            {view.books.map((book) => (
              <ResourceCell
                count={{ have: book.have, need: 0, short: 0 }}
                icon={xpBookIcon(book.rarity)}
                key={book.rarity}
                label={t("ascension.items.xpBook", {
                  rarity: rarityName(book.rarity),
                })}
                needsReady={needsReady}
              />
            ))}
          </ul>
          <dl className="grid grid-cols-3 gap-2 text-center">
            <XpStat
              label={t("ascension.xp.total")}
              value={format(view.totalXp)}
            />
            <XpStat
              label={t("ascension.xp.need")}
              value={needsReady ? format(view.xp.need) : "…"}
            />
            <XpStat
              label={t("ascension.xp.short")}
              tone={needsReady && view.xp.short > 0 ? "short" : undefined}
              value={needsReady ? format(view.xp.short) : "…"}
            />
          </dl>
          <XpNote needsReady={needsReady} view={view} />
        </>
      ) : null}
      <PlanningSettingsDialog
        onOpenChange={setSettingsOpen}
        open={settingsOpen}
      />
    </Section>
  )
}

/** What is short as books of the planned rarity (or that the books cover it), then that rarity. */
function XpNote({
  view,
  needsReady,
}: {
  view: XpBooksView
  needsReady: boolean
}) {
  const { t } = useTranslation(["inventory", "progression"])
  const format = useFormat()
  const rarity = t(`progression:rarities.${view.bookRarity}`, {
    defaultValue: view.bookRarity,
  })
  const lead = !needsReady
    ? null
    : view.xp.short > 0
      ? t("ascension.xp.booksShort", {
          books: format(view.booksShort),
          rarity,
        })
      : view.xp.need > 0
        ? t("ascension.xp.covered")
        : null
  return (
    <p className="text-sm text-muted-foreground">
      {lead ? `${lead} ` : null}
      {t("ascension.xp.bookRarity", { rarity })}
    </p>
  )
}

function XpStat({
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
        className={cn(
          "text-lg font-semibold tabular-nums",
          tone === "short" && "text-destructive"
        )}
      >
        {value}
      </dd>
    </div>
  )
}

/** Ability badges or orbs: a row per alliance and a column per rarity; it scrolls sideways when the
 *  screen is too narrow for six columns. */
function AllianceRaritySection({
  title,
  testId,
  rows,
  icon,
  itemKey,
  needsReady,
}: {
  title: string
  testId: string
  rows: ReturnType<typeof allianceRarityCounts>
  icon: (rarity: Rarity, alliance: string) => GameIcon
  itemKey: "abilityBadge" | "orb"
  needsReady: boolean
}) {
  const { t } = useTranslation(["inventory", "progression", "common"])
  return (
    <Section testId={testId} title={title}>
      <div className="-mx-4 overflow-x-auto px-4">
        <table className="w-full min-w-max border-separate border-spacing-0">
          <caption className="sr-only">{title}</caption>
          <thead>
            <tr>
              <th
                className="p-1 text-start text-xs font-normal text-muted-foreground"
                scope="col"
              >
                {t("ascension.alliance")}
              </th>
              {(rows[0]?.cells ?? []).map(({ rarity }) => (
                <th className="p-1" key={rarity} scope="col">
                  <span className="flex justify-center">
                    <RarityIcon rarity={rarity} />
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.alliance}>
                <th className="p-1 text-start" scope="row">
                  <AllianceName alliance={row.alliance} />
                </th>
                {row.cells.map((cell) => (
                  <ResourceCell
                    as="td"
                    count={cell.count}
                    icon={icon(cell.rarity, row.alliance)}
                    key={cell.rarity}
                    label={t(`ascension.items.${itemKey}`, {
                      rarity: t(`progression:rarities.${cell.rarity}`, {
                        defaultValue: cell.rarity,
                      }),
                      alliance: t(`common:alliances.${row.alliance}`),
                    })}
                    needsReady={needsReady}
                  />
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Section>
  )
}

function AllianceName({ alliance }: { alliance: Alliance }) {
  const { t } = useTranslation("common")
  return (
    <span className="flex items-center gap-2 text-sm font-medium">
      <EntityIcon alt="" size="icon" src={onslaughtAllianceIcon(alliance)} />
      {t(`alliances.${alliance}`)}
    </span>
  )
}

function ForgeBadges({
  counts,
  needsReady,
}: {
  counts: ReturnType<typeof rarityCounts>
  needsReady: boolean
}) {
  const { t } = useTranslation(["inventory", "progression"])
  return (
    <Section
      testId="inventory-forge-badges"
      title={t("ascension.sections.forgeBadges")}
    >
      <ul className="grid grid-cols-3 gap-2 sm:grid-cols-6">
        {counts.map(({ rarity, count }) => (
          <ResourceCell
            count={count}
            icon={forgeBadgeIcon(rarity)}
            key={rarity}
            label={t("ascension.items.forgeBadge", {
              rarity: t(`progression:rarities.${rarity}`, {
                defaultValue: rarity,
              }),
            })}
            needsReady={needsReady}
          />
        ))}
      </ul>
    </Section>
  )
}

function Components({
  counts,
  needsReady,
}: {
  counts: ReturnType<typeof componentCounts>
  needsReady: boolean
}) {
  const { t } = useTranslation(["inventory", "common"])
  return (
    <Section
      testId="inventory-components"
      title={t("ascension.sections.components")}
    >
      <ul className="grid grid-cols-3 gap-2">
        {counts.map(({ alliance, count }) => (
          <ResourceCell
            count={count}
            icon={mowComponentIcon(alliance)}
            key={alliance}
            label={t("ascension.items.component", {
              alliance: t(`common:alliances.${alliance}`),
            })}
            needsReady={needsReady}
          />
        ))}
      </ul>
    </Section>
  )
}
