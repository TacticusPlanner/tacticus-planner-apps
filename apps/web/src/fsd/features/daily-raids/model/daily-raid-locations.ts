import {
  campaignDescriptor,
  campaignIcon,
  type CampaignDescriptor,
} from "@workspace/game-catalog"
import type { BattleId } from "@workspace/game-domain"

import type { Battle } from "@/shared/lib"

import {
  campaignLocationLabels,
  type DailyRaidLocationViewModel,
} from "./daily-raids.domain"

/**
 * Display view model of every catalog battle, keyed by battle id: the campaign's name, tier + node
 * label, the compact chip label and the campaign icon. Shared by the raid schedules and the Home
 * Screen Event location lists so a node reads the same everywhere.
 */
export function buildLocationsByBattleId(
  battlesById: ReadonlyMap<BattleId, Battle>,
  display: {
    name: (descriptor: CampaignDescriptor) => string
    tierLabel: (descriptor: CampaignDescriptor) => string
    shortLabel: (descriptor: CampaignDescriptor) => {
      name: string
      code: string
      challenge: boolean
    }
  }
): ReadonlyMap<BattleId, DailyRaidLocationViewModel> {
  return new Map(
    [...battlesById].map(([battleId, battle]) => {
      const descriptor = campaignDescriptor(
        battle.campaignGroupId,
        battle.type,
        battle.challenge
      )
      const short = descriptor ? display.shortLabel(descriptor) : null
      return [
        battleId,
        {
          id: battleId,
          ...campaignLocationLabels(battleId, battle, descriptor, display),
          shortLabel: short
            ? `${short.name} ${short.code} ${battle.nodeNumber}${short.challenge ? "B" : ""}`
            : battle.campaignGroupId,
          challenge: battle.challenge,
          icon: campaignIcon(
            battle.campaignGroupId,
            battle.type,
            battle.challenge
          ),
        },
      ] as const
    })
  )
}
