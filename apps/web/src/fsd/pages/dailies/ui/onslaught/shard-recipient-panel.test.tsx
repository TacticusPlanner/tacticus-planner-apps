import { describe, expect, it, vi } from "vitest"

import { render, screen } from "@/test/render"

import type { OnslaughtShardRecipientResult } from "../../model/onslaught-shard-recipient"
import { ShardRecipientPanel } from "./shard-recipient-panel"

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, unknown>) => {
      if (opts && typeof opts.defaultValue === "string")
        return opts.defaultValue
      return opts ? `${key}:${JSON.stringify(opts)}` : key
    },
  }),
  initReactI18next: { type: "3rdParty", init: vi.fn() },
}))
vi.mock("@workspace/game-catalog", () => ({
  characterIcon: (id: string) => `/icons/${id}.png`,
  mowIcon: (id: string) => `/mows/${id}.png`,
  rarityIcon: (rarity: string) => `/rarities/${rarity}.png`,
}))

const ready = (
  over: Partial<
    Extract<OnslaughtShardRecipientResult, { status: "ready" }>["recipient"]
  > = {}
): OnslaughtShardRecipientResult => ({
  status: "ready",
  recipient: {
    unitId: "impHero",
    unitName: "Imp Hero",
    unitKind: "character",
    goalId: "g1",
    currentRarity: "Rare",
    targetRarity: "Epic",
    currentShards: 10,
    requiredShards: 60,
    remainingShards: 50,
    reason: "fewestRemainingShards",
    ...over,
  },
  alternates: [],
})

describe("ShardRecipientPanel", () => {
  it("renders the 'no target configured' copy when there is no recipient", () => {
    render(
      <ShardRecipientPanel
        result={{ status: "none" }}
        testIdPrefix="onslaught"
      />
    )
    expect(screen.getByText("recipient.none")).toBeInTheDocument()
  })

  it("renders the recipient's name, kind, shard counts, and reason", () => {
    render(<ShardRecipientPanel result={ready()} testIdPrefix="onslaught" />)
    expect(screen.getByText("Imp Hero")).toBeInTheDocument()
    expect(screen.getByText("recipient.unitKind.character")).toBeInTheDocument()
    expect(screen.getByText("10")).toBeInTheDocument()
    expect(screen.getByText("60")).toBeInTheDocument()
    expect(screen.getByText("50")).toBeInTheDocument()
    expect(
      screen.getByText("recipient.reason.fewestRemainingShards")
    ).toBeInTheDocument()
  })

  it("labels a Machine of War recipient with the mow unit kind", () => {
    render(
      <ShardRecipientPanel
        result={ready({ unitKind: "mow", unitName: "Rax" })}
        testIdPrefix="onslaught"
      />
    )
    expect(screen.getByText("recipient.unitKind.mow")).toBeInTheDocument()
  })
})
