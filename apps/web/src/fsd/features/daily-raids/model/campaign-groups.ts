import type { BattleId } from "@workspace/game-domain"

import type { DailyRaidLocationViewModel } from "./daily-raids.domain"

/** Rows that share one campaign (with its difficulty), shown under a single campaign header. */
export type CampaignGroup<Item> = {
  /** Stable React key: the campaign plus the first row's own key. */
  key: string
  /** `undefined` for a row whose battle the catalog cannot place in a campaign (its own group). */
  campaignKey: string | undefined
  items: Item[]
}

/**
 * Groups an ordered list by campaign without reordering it: each run of consecutive rows in the same
 * campaign becomes one group. A row with no known campaign is a group of its own. Used by the lists
 * that are one row per battle (HSE, HRE, Home) so a list's order is the order its groups and rows
 * show in.
 */
export function groupConsecutiveByCampaign<Item>(
  items: readonly Item[],
  campaignOf: (item: Item) => string | undefined,
  keyOf: (item: Item) => string
): CampaignGroup<Item>[] {
  const groups: CampaignGroup<Item>[] = []
  for (const item of items) {
    const campaignKey = campaignOf(item)
    const last = groups.at(-1)
    if (last && campaignKey !== undefined && last.campaignKey === campaignKey) {
      last.items.push(item)
      continue
    }
    groups.push({
      key: `${campaignKey ?? "none"}:${keyOf(item)}`,
      campaignKey,
      items: [item],
    })
  }
  return groups
}

/** One battle row of Today's schedule, with the upgrade it farms there. */
export type ScheduleCampaignRow<Entry extends { battleId: BattleId }> = {
  resourceId: string
  entry: Entry
  /** Every entry of the row's upgrade, for its need badge. */
  resourceEntries: Entry[]
}

/**
 * Today's schedule as campaign groups. `resources` is the schedule's upgrade order (longest to finish
 * first, same-campaign upgrades of similar energy already pulled together by `clusterByCampaign`),
 * each with its planned locations. A run of consecutive upgrades is one cluster while each next
 * upgrade is farmed (at any of its locations) in a campaign the cluster already holds: an upgrade at
 * Saim-Hann Elite 33, then one at Indomitus Mirror Elite 12 and Saim-Hann Elite 11, form one
 * cluster. Within a cluster, every location joins its campaign's group, groups in the order their campaign first
 * appears and rows in the upgrades' order: two upgrades farmed at Saim-Hann Elite 38 and 37, each
 * also at a Saim-Hann Mirror Elite node, read as a Saim-Hann Elite group then a Saim-Hann Mirror
 * Elite group. A location of a later cluster is never pulled up into an earlier group: it starts a
 * group of its own, which only joins the group right before it when that is the same campaign.
 * `isRowVisible` drops a row (an exhausted location) after the clusters are formed, and a location
 * listed twice for one upgrade shows once.
 */
export function groupScheduleByCampaign<Entry extends { battleId: BattleId }>(
  resources: readonly { resourceId: string; entries: Entry[] }[],
  campaignOf: (battleId: BattleId) => string | undefined,
  isRowVisible: (entry: Entry) => boolean = () => true
): CampaignGroup<ScheduleCampaignRow<Entry>>[] {
  const clusters: (typeof resources)[number][][] = []
  // Every campaign the current cluster's upgrades are farmed in.
  let clusterCampaigns = new Set<string>()
  for (const resource of resources) {
    const campaigns = new Set<string>()
    for (const entry of resource.entries) {
      const campaign = campaignOf(entry.battleId)
      if (campaign !== undefined) campaigns.add(campaign)
    }
    const current = clusters.at(-1)
    if (current && [...campaigns].some((c) => clusterCampaigns.has(c))) {
      current.push(resource)
      for (const campaign of campaigns) clusterCampaigns.add(campaign)
    } else {
      clusters.push([resource])
      clusterCampaigns = campaigns
    }
  }

  const groups: CampaignGroup<ScheduleCampaignRow<Entry>>[] = []
  // Combine goals lists an upgrade's location once per goal that farms it there: one row is enough.
  const seen = new Set<string>()
  for (const cluster of clusters) {
    const byCampaign = new Map<string, ScheduleCampaignRow<Entry>[]>()
    const clusterGroups: CampaignGroup<ScheduleCampaignRow<Entry>>[] = []
    for (const { resourceId, entries } of cluster) {
      for (const entry of entries) {
        const rowKey = `${entry.battleId}:${resourceId}`
        if (seen.has(rowKey) || !isRowVisible(entry)) continue
        seen.add(rowKey)
        const row = { resourceId, entry, resourceEntries: entries }
        const campaignKey = campaignOf(entry.battleId)
        const rows =
          campaignKey === undefined ? undefined : byCampaign.get(campaignKey)
        if (rows) {
          rows.push(row)
          continue
        }
        const items = [row]
        if (campaignKey !== undefined) byCampaign.set(campaignKey, items)
        clusterGroups.push({
          key: `${campaignKey ?? "none"}:${entry.battleId}:${resourceId}`,
          campaignKey,
          items,
        })
      }
    }
    for (const group of clusterGroups) {
      const last = groups.at(-1)
      if (
        last &&
        group.campaignKey !== undefined &&
        last.campaignKey === group.campaignKey
      ) {
        last.items.push(...group.items)
      } else {
        groups.push(group)
      }
    }
  }
  return groups
}

/**
 * A one-row-per-battle list that follows the schedule's upgrade order (the Home widget) grouped the
 * way Today groups it (`groupScheduleByCampaign`): each run of consecutive rows for one upgrade is
 * that upgrade's locations, so a list reads the same on Home as on Today.
 */
export function groupRowsByUpgradeCampaign<
  Row extends { battleId: BattleId; resourceId: string },
>(
  rows: readonly Row[],
  campaignOf: (battleId: BattleId) => string | undefined
): CampaignGroup<Row>[] {
  const resources: { resourceId: string; entries: Row[] }[] = []
  for (const row of rows) {
    const last = resources.at(-1)
    if (last && last.resourceId === row.resourceId) last.entries.push(row)
    else resources.push({ resourceId: row.resourceId, entries: [row] })
  }
  return groupScheduleByCampaign(resources, campaignOf).map((group) => ({
    ...group,
    items: group.items.map(({ entry }) => entry),
  }))
}

/**
 * A location's node with no difficulty word ("36", "12B"), for a row under its campaign's header.
 * `undefined` when the catalog has no node label for it.
 */
export function locationNodeNumber(
  location: Pick<DailyRaidLocationViewModel, "nodeLabel" | "difficultyLabel">
): string | undefined {
  const { nodeLabel, difficultyLabel } = location
  const node =
    difficultyLabel && nodeLabel.startsWith(difficultyLabel)
      ? nodeLabel.slice(difficultyLabel.length).trim()
      : nodeLabel.trim()
  return node === "" ? undefined : node
}
