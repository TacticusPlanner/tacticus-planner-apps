import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import type { Rarity } from "@workspace/game-domain"
import { Button } from "@workspace/ui/components/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@workspace/ui/components/sheet"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { useIsMobile } from "@workspace/ui/hooks/use-mobile"

import { useDailyRaids } from "@/features/daily-raids"
import { GoalEditDialog } from "@/features/goal-create"
import {
  BattleList,
  battlesByTier,
  crateTrack,
  objectiveCounts,
  QuestHeader,
  QuestPicker,
  QuestSummary,
  questShards,
  questTokenPlan,
  RewardsCard,
  ScoreEntry,
  scoreQuest,
  shardMeaning,
  TokenPlanCard,
  useQuestCatalog,
  useQuestInstance,
  useQuestProgress,
  useQuestPlan,
  questTeamView,
  questVerdict,
  projectQuest,
  QuestEstimateBlock,
  type QuestVerdict,
  QuestTeamSection,
  questTierCap,
  type QuestBattle,
  type QuestHeroOwnership,
} from "@/features/quest-event"
import { useCreateGoalLauncher, useGlobalGoalPlan } from "@/entities/goal"
import { useNpcsById } from "@/entities/npc"
import { toById, useCatalogDataset, usePlayerChunk } from "@/shared/local-data"
import type { EnemyNpcs } from "@/widgets/battle-preview"

import { questDropNeed } from "../model/quest-drop-need"
import { questGoalAction } from "../model/quest-goal-action"

import { QuestBattleDetail } from "./quest/quest-battle-detail"
import { useQuestTutorial } from "./quest-page.tutorial"

const NO_FACTIONS: readonly string[] = []
const EMPTY_ENTRIES: ReturnType<typeof useQuestProgress>["entries"] = {}
const byUnitId = <T extends { unitId: string }>(records: T[] | null) =>
  new Map<string, T>((records ?? []).map((record) => [record.unitId, record]))

/**
 * Dailies > Quest (design D6): the running quest (or the one in its claim window, or the next one as a
 * read-only preview), its 17 battles by tier with the player's best attempt per battle, the points and
 * crates they add up to, and the selected battle's detail. A picker browses any catalog quest
 * read-only. Desktop: header, then summary and battle list on the left and the detail on the right.
 * Mobile: one column with tier disclosures; a battle opens in a bottom sheet with its score inputs.
 */
export function QuestPage() {
  const { t } = useTranslation(["quest", "characters"])
  const isMobile = useIsMobile()
  const state = useQuestInstance()
  const { quests, crates } = useQuestCatalog()
  const instance = state.status === "ready" ? state.instance : null
  const [browsedHero, setBrowsedHero] = useState<string | null>(null)
  const currentHero = instance?.featuredCharacterId ?? null
  const browsing = browsedHero !== null && browsedHero !== currentHero
  const heroId = browsing ? browsedHero : currentHero

  const questsById = quests.status === "ready" ? quests.data : undefined
  const quest = heroId ? questsById?.get(heroId) : undefined
  const battles = useMemo(() => quest?.battles ?? [], [quest])
  const counts = useMemo(() => objectiveCounts(battles), [battles])
  const editable =
    !browsing && (instance?.phase === "running" || instance?.phase === "claim")
  const progress = useQuestProgress(editable ? instance.key : null, counts)
  const entries = editable ? progress.entries : EMPTY_ENTRIES
  const crateList = crates.status === "ready" ? crates.data : undefined
  const score = useMemo(
    () => (quest ? scoreQuest(battles, entries, crateList ?? []) : null),
    [quest, battles, entries, crateList]
  )

  const characters = useCatalogDataset("characters", toById)
  const charactersById =
    characters.status === "ready" ? characters.data : undefined
  const heroName = (id: string | null) =>
    id ? charactersById?.get(id)?.name : undefined
  const shownHeroLabel = heroId
    ? t(`characters:${heroId}`, { defaultValue: heroName(heroId) ?? heroId })
    : ""
  const playerCharacters = usePlayerChunk("characters", byUnitId)
  const playerShards = usePlayerChunk("inventory-shards", byUnitId)
  const ownership: QuestHeroOwnership = (() => {
    if (!heroId) return null
    if (playerCharacters.status !== "ready" || playerShards.status !== "ready")
      return null
    if (playerCharacters.data.size === 0 && playerShards.data.size === 0)
      return null
    const owned = playerCharacters.data.get(heroId)
    return owned
      ? { owned: true, shards: owned.shards }
      : { owned: false, shards: playerShards.data.get(heroId)?.amount ?? 0 }
  })()

  const npcsRead = useNpcsById()
  const npcs: EnemyNpcs =
    npcsRead.status === "ready"
      ? npcsRead.data
      : npcsRead.status === "error"
        ? "unavailable"
        : "pending"
  const upgrades = useCatalogDataset("upgrades", toById)
  const upgradesById = upgrades.status === "ready" ? upgrades.data : undefined
  const equipment = useCatalogDataset("equipment")
  const raids = useDailyRaids()

  const [picked, setPicked] = useState<number | null>(null)
  // Editing a battle pins it as the selection, so the default (the battle with the most points
  // left) never moves the detail away while the player types.
  const editActions = useMemo(
    () => ({
      setMedals: (battle: number, medals: number) => {
        setPicked(battle)
        progress.actions.setMedals(battle, medals)
      },
      setLightning: (battle: number, points: number) => {
        setPicked(battle)
        progress.actions.setLightning(battle, points)
      },
      setObjective: (battle: number, index: number, ticked: boolean) => {
        setPicked(battle)
        progress.actions.setObjective(battle, index, ticked)
      },
      setBundle: progress.actions.setBundle,
      setTokens: progress.actions.setTokens,
    }),
    [progress.actions]
  )
  const hasScore = !!score && score.total > 0
  const defaultBattle = hasScore
    ? (score.pointsLeft[0]?.number ?? battles[0]?.number ?? null)
    : (battles[0]?.number ?? null)
  const selectedNumber =
    picked !== null && battles.some((battle) => battle.number === picked)
      ? picked
      : defaultBattle
  const selected = battles.find((battle) => battle.number === selectedNumber)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [boardOpen, setBoardOpen] = useState(false)
  const equipmentList =
    equipment.status === "ready" ? equipment.data : undefined
  const plan = useQuestPlan({
    battles,
    featuredCharacterId: heroId,
    allowedFactionIds: quest?.allowedFactionIds ?? NO_FACTIONS,
    equipment: equipmentList,
  })
  const teamView = questTeamView(plan, selected?.number ?? null)
  const selectedPlan =
    plan.status === "ready" && selected
      ? plan.battles.get(selected.number)
      : undefined
  // Verdicts show a dash while loading, and nothing when no estimate can be made.
  const estimates = new Map(
    plan.status === "ready"
      ? [...plan.battles].flatMap(([number, entry]) =>
          entry.estimate ? [[number, entry.estimate] as const] : []
        )
      : []
  )
  const verdicts: ReadonlyMap<number, QuestVerdict> | undefined =
    plan.status === "loading"
      ? new Map(battles.map((battle) => [battle.number, "pending" as const]))
      : estimates.size > 0
        ? new Map(
            [...estimates].map(([number, estimate]) => [
              number,
              questVerdict(estimate),
            ])
          )
        : undefined
  // A projection needs entered scores: none in a preview or a browsed quest.
  const projection =
    editable && estimates.size > 0
      ? projectQuest(battles, entries, estimates, crateList ?? [])
      : null
  const unitName = (id: string) =>
    t(`characters:${id}` as never, {
      defaultValue: heroName(id) ?? id,
    }) as string
  const firstOpenTier = useMemo(() => {
    const groups = battlesByTier(battles)
    return (
      groups.find((group) => {
        const tier = score?.tiers.find((entry) => entry.tier === group.tier)
        return !tier || tier.points < tier.max
      })?.tier ??
      groups[0]?.tier ??
      null
    )
  }, [battles, score])
  const [toggledTiers, setToggledTiers] = useState<ReadonlySet<Rarity> | null>(
    null
  )
  const openTiers =
    toggledTiers ?? new Set(firstOpenTier ? [firstOpenTier] : [])
  const toggleTier = (tier: Rarity) => {
    const next = new Set(openTiers)
    if (next.has(tier)) next.delete(tier)
    else next.add(tier)
    setToggledTiers(next)
  }
  const select = (battle: number) => {
    setPicked(battle)
    if (isMobile) setSheetOpen(true)
  }
  const pickHero = (id: string) => {
    setBrowsedHero(id === currentHero ? null : id)
    setPicked(null)
    setToggledTiers(null)
  }

  const unlockCosts = useCatalogDataset("unlock-shard-costs", toById)
  const ascensionCosts = useCatalogDataset("ascension-costs", toById)
  const goalPlan = useGlobalGoalPlan()
  const launchCreateGoal = useCreateGoalLauncher()
  const [editGoalId, setEditGoalId] = useState<string | null>(null)
  const [rewardsOpen, setRewardsOpen] = useState(false)
  const heroRecord = heroId ? charactersById?.get(heroId) : undefined
  const medals = battles.map((battle) => entries[battle.number]?.medals ?? 0)
  const bundle = editable && progress.bundle
  const shards = questShards(medals, bundle)
  const ownedRecord =
    heroId && playerCharacters.status === "ready"
      ? playerCharacters.data.get(heroId)
      : undefined
  const meaning = shardMeaning({
    shards,
    owned: ownedRecord
      ? {
          progression: ownedRecord.progressionIndex,
          shards: ownedRecord.shards,
        }
      : null,
    notOwnedShards: ownership && !ownership.owned ? ownership.shards : null,
    initialRarity: heroRecord?.initialRarity,
    unlockCostByRarity:
      unlockCosts.status === "ready" ? unlockCosts.data : undefined,
    ascensionCostByProgression:
      ascensionCosts.status === "ready" ? ascensionCosts.data : undefined,
  })
  const goalAction = heroId
    ? questGoalAction({
        heroId,
        owned: !!ownedRecord,
        meaning,
        goals: goalPlan.active,
        currentProgression: ownedRecord?.progressionIndex,
      })
    : null
  const tokenPlan =
    instance && state.status === "ready" && !browsing && score
      ? questTokenPlan({
          phase: instance.phase,
          startMs: Date.parse(instance.entry.startUtc),
          endMs: Date.parse(instance.entry.endUtc),
          nowMs: state.nowMs,
          tokens: editable ? progress.tokens : null,
          battlesToImprove: score.pointsLeft.length,
        })
      : null

  useQuestTutorial({
    hasBattles: battles.length > 0,
    editable,
    browsing,
    hasTokens: !!tokenPlan,
    hasEstimate: !!selectedPlan?.estimate,
  })

  const heroes = useMemo(
    () =>
      [...(questsById?.keys() ?? [])].map((id) => ({
        id,
        name: charactersById?.get(id)?.name,
      })),
    [questsById, charactersById]
  )
  const picker = (
    <QuestPicker
      heroes={heroes}
      isMobile={isMobile}
      onChange={pickHero}
      value={heroId}
    />
  )
  const team = (
    <>
      <QuestTeamSection nameOf={unitName} view={teamView} />
      {selected ? (
        <QuestEstimateBlock
          estimate={selectedPlan?.estimate ?? null}
          nameOf={unitName}
          objectives={selected.objectives}
        />
      ) : null}
    </>
  )
  // Without a roster only the featured hero's own verdicts hold.
  const badges =
    teamView.status === "ready"
      ? teamView.team.badges
      : teamView.status === "unsynced"
        ? teamView.team.badges.map((badge) =>
            badge.kind === "unreachable" || badge.kind === "dependsOnPlay"
              ? badge
              : { kind: "none" as const }
          )
        : undefined
  const detail = (battle: QuestBattle) => (
    <QuestBattleDetail
      battle={battle}
      boardOpen={boardOpen}
      badges={badges}
      cap={questTierCap(battle.tier, equipmentList)}
      heroName={shownHeroLabel}
      isMobile={isMobile}
      need={questDropNeed(raids, battle.loot.upgradeId)}
      npcs={npcs}
      onBoardOpenChange={setBoardOpen}
      retryNpcs={npcsRead.status === "error" ? npcsRead.retry : undefined}
      team={isMobile ? null : team}
      upgrade={upgradesById?.get(battle.loot.upgradeId)}
    />
  )
  // A browsed quest shows no inputs at all; a preview shows them read-only.
  const scoreEntry = (battle: QuestBattle) =>
    browsing ? null : (
      <ScoreEntry
        actions={editable ? editActions : null}
        battle={battle}
        entry={entries[battle.number]}
      />
    )

  const battleArea = (() => {
    if (!heroId) return null
    if (quests.status === "loading") {
      return (
        <div data-testid="quest-battles-loading">
          <span className="sr-only">{t("quest:battles.loading")}</span>
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      )
    }
    if (quests.status === "error") {
      return (
        <div
          className="flex flex-col items-start gap-2"
          data-testid="quest-battles-error"
        >
          <p className="text-sm text-destructive">{t("quest:battles.error")}</p>
          <Button onClick={quests.retry} variant="outline">
            {t("quest:status.retry")}
          </Button>
        </div>
      )
    }
    if (!quest || battles.length === 0) {
      return (
        <p
          className="text-sm text-muted-foreground"
          data-testid="quest-battles-empty"
        >
          {t("quest:battles.noData")}
        </p>
      )
    }
    const summary =
      !browsing && score ? (
        <QuestSummary
          crateCount={crateList ? crateList.length : null}
          onSelect={select}
          projected={projection?.score ?? null}
          saveFailed={progress.saveFailed}
          score={score}
        />
      ) : null
    const tokensCard = tokenPlan ? (
      <TokenPlanCard
        onTokensChange={
          editable && instance.phase === "running"
            ? (count) =>
                progress.actions.setTokens(count, new Date().toISOString())
            : null
        }
        plan={tokenPlan}
        tokens={editable ? progress.tokens : null}
      />
    ) : null
    const rewardsCard = (
      <RewardsCard
        alliance={heroRecord?.alliance ?? null}
        bundle={bundle}
        crates={crateList && score ? crateTrack(crateList, score) : null}
        goalAction={
          goalAction ? (
            <Button
              onClick={() =>
                goalAction.kind === "open"
                  ? setEditGoalId(goalAction.goalId)
                  : launchCreateGoal(goalAction.prefill)
              }
              size="sm"
              variant="outline"
            >
              {goalAction.kind === "open"
                ? t("quest:rewards.openGoal")
                : t("quest:rewards.createGoal")}
            </Button>
          ) : null
        }
        hero={shownHeroLabel}
        isMobile={isMobile}
        meaning={meaning}
        onBundleChange={editable ? progress.actions.setBundle : null}
        onOpenChange={setRewardsOpen}
        open={rewardsOpen}
        projectedShards={
          projection ? questShards([projection.medals], bundle).earned : null
        }
        retryCrates={crates.retry}
        shards={shards}
      />
    )
    const list = (
      <BattleList
        battles={battles}
        isMobile={isMobile}
        onSelect={select}
        onToggleTier={toggleTier}
        openTiers={openTiers}
        score={browsing ? null : score}
        selected={selectedNumber}
        upgradesById={upgradesById}
        verdicts={verdicts}
      />
    )
    if (isMobile) {
      return (
        <div className="space-y-5" data-testid="quest-sections">
          {summary}
          {tokensCard}
          {rewardsCard}
          {list}
          <Sheet onOpenChange={setSheetOpen} open={sheetOpen && !!selected}>
            <SheetContent data-testid="quest-battle-sheet" side="bottom">
              <SheetHeader>
                <SheetTitle>
                  {selected
                    ? t("quest:battles.battle", { number: selected.number })
                    : null}
                </SheetTitle>
                <SheetDescription className="sr-only">
                  {t("quest:entry.title")}
                </SheetDescription>
              </SheetHeader>
              {selected ? (
                <div className="flex flex-col gap-4 overflow-y-auto px-4 pb-4">
                  {scoreEntry(selected)}
                  {team}
                  {detail(selected)}
                </div>
              ) : null}
            </SheetContent>
          </Sheet>
        </div>
      )
    }
    return (
      <div
        className="grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)] items-start gap-6"
        data-testid="quest-sections"
      >
        <div className="space-y-5">
          {summary}
          {tokensCard}
          {list}
        </div>
        <div className="space-y-5">
          {selected ? (
            <div className="space-y-4" data-testid="quest-selected">
              {scoreEntry(selected)}
              {detail(selected)}
            </div>
          ) : null}
          {rewardsCard}
        </div>
      </div>
    )
  })()

  return (
    <section className="space-y-5" data-testid="quest-page">
      <h2 className="text-lg font-semibold">{t("quest:title")}</h2>
      <div data-testid="quest-status">
        <QuestHeader
          allowedFactionIds={quest?.allowedFactionIds ?? []}
          browsing={browsing}
          enemyFactionIds={
            quest?.enemyFactionIds ??
            (typeof instance?.entry.parameters?.enemyFactionId === "string"
              ? [instance.entry.parameters.enemyFactionId]
              : [])
          }
          heroId={heroId}
          heroName={heroName(heroId)}
          ownership={ownership}
          picker={picker}
          state={state}
        />
      </div>
      {browsing ? (
        <div
          className="flex flex-wrap items-center gap-3"
          data-testid="quest-browsing"
        >
          <p className="text-sm text-muted-foreground">
            {t("quest:picker.browsing")}
          </p>
          {currentHero ? (
            <Button
              onClick={() => pickHero(currentHero)}
              size="sm"
              variant="outline"
            >
              {t("quest:picker.back")}
            </Button>
          ) : null}
        </div>
      ) : instance?.phase === "preview" ? (
        <p
          className="text-sm text-muted-foreground"
          data-testid="quest-preview-note"
        >
          {t("quest:status.previewNote")}
        </p>
      ) : null}
      {battleArea}
      <GoalEditDialog
        goalId={editGoalId}
        onOpenChange={(open) => !open && setEditGoalId(null)}
      />
    </section>
  )
}
