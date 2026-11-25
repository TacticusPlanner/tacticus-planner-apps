import { Suspense } from "react"
import i18next from "i18next"
import type { BackendModule, i18n as I18n, ReadCallback } from "i18next"
import { I18nextProvider, initReactI18next } from "react-i18next"
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest"

import { useCatalogDataset } from "@/shared/local-data"
import { createTestI18n, i18nWrapper } from "@/test/i18n"
import { act, render, screen, waitFor, within } from "@/test/render"
import { seedGameCatalog } from "@/test/seed"
import { setViewportWidth } from "@/test/viewport"
import { lysanderBattleNpcs } from "@/test/fixtures/lysander-battles"
import dailiesEn from "../../../../../public/locales/en/dailies.json"

import { useCampaignBattleDialog } from "../model/campaign-battle-dialog-store"
import type { CampaignBattleDialogStore } from "../model/campaign-battle-dialog-store"
import {
  CampaignBattleDialog,
  CampaignBattleDialogHost,
} from "./campaign-battle-dialog"

// Archimatos's served ladder opens at rank 5 / 5 stars, then rank 8 (Bronze III) / 5 stars.
const battle = {
  id: "indomitusElite40",
  campaignGroupId: "elite1",
  type: "Elite",
  challenge: false,
  nodeNumber: 40,
  battleIndex: 39,
  slots: 5,
  dailyAttempts: 6,
  energyCost: 10,
  enemyPower: 12_345,
  enemiesTotal: 4,
  detailedEnemyTypes: [
    {
      id: "blackBossPossession",
      name: "Archimatos",
      count: 3,
      rank: "Bronze3",
      stars: 5,
    },
    { id: "unknownNpc", name: "Unknown", count: 1, rank: "Stone1", stars: 0 },
  ],
}

let i18n: I18n

/** A page that lists raids and hosts the dialog, reporting each of its renders. */
function RaidsPage({
  onRender,
}: {
  onRender: (dialog: CampaignBattleDialogStore) => void
}) {
  const dialog = useCampaignBattleDialog()
  onRender(dialog)
  return <CampaignBattleDialogHost dialog={dialog} />
}

/** A page hosting the dialog beside its own content, as Today's plan does. */
function PlanPage({
  onDialog,
}: {
  onDialog: (dialog: CampaignBattleDialogStore) => void
}) {
  const dialog = useCampaignBattleDialog()
  onDialog(dialog)
  // The battle read the dialog shares: once ready, the enemy tiles render and read their copy.
  const battles = useCatalogDataset("campaign-battles")
  return (
    <>
      <p>Today's plan</p>
      {battles.status === "ready" ? <p>Battles read</p> : null}
      <CampaignBattleDialogHost dialog={dialog} />
    </>
  )
}

describe("CampaignBattleDialog", () => {
  beforeAll(async () => {
    i18n = await createTestI18n("en", { en: { dailies: dailiesEn } })
  })
  beforeEach(async () => {
    vi.unstubAllGlobals()
    setViewportWidth(1280)
    await seedGameCatalog({
      "campaign-battles": [battle],
      npcs: lysanderBattleNpcs,
    })
  })

  it("shows the location's energy, slots, power and enemies with their level", async () => {
    render(
      <CampaignBattleDialog
        onClose={() => {}}
        target={{
          battleId: battle.id,
          title: {
            campaignName: "Indomitus",
            difficultyLabel: "Elite",
            nodeLabel: "Elite 40",
          },
        }}
      />,
      { route: "/", wrapper: i18nWrapper(i18n) }
    )

    const dialog = await screen.findByRole("dialog")
    expect(within(dialog).getByRole("heading", { level: 2 })).toHaveTextContent(
      "Indomitus Elite 40"
    )
    const summary = await within(dialog).findByTestId("campaign-battle-summary")
    expect(summary).toHaveTextContent("10 energy")
    expect(summary).toHaveTextContent("5 unit slots")
    expect(summary).toHaveTextContent("Enemy power 12,345")
    expect(
      within(dialog).getByTestId("campaign-battle-enemies")
    ).toHaveTextContent("Enemies 4 enemies")

    const tiles = await within(dialog).findAllByTestId("battle-enemy-tile")
    expect(
      tiles.map((tile) => [
        tile.getAttribute("data-npc"),
        tile.getAttribute("data-level"),
      ])
    ).toEqual([
      ["blackBossPossession", "resolved"],
      ["unknownNpc", "unknownLevel"],
    ])
  })

  it("opens as a content-height details sheet on a phone", async () => {
    setViewportWidth(390)
    render(
      <CampaignBattleDialog
        onClose={() => {}}
        target={{
          battleId: battle.id,
          title: { campaignName: "Indomitus", nodeLabel: "Elite 40" },
        }}
      />,
      { route: "/", wrapper: i18nWrapper(i18n) }
    )

    const dialog = await screen.findByRole("dialog")
    expect(dialog).toHaveAttribute("data-slot", "drawer-content")
    expect(within(dialog).getByRole("heading", { level: 2 })).toHaveTextContent(
      "Indomitus Elite 40"
    )
    expect(
      await within(dialog).findByTestId("campaign-battle-summary")
    ).toHaveTextContent("10 energy")
    expect(
      await within(dialog).findAllByTestId("battle-enemy-tile")
    ).toHaveLength(2)
  })

  it("says so when the battle is not in the game data", async () => {
    render(
      <CampaignBattleDialog
        onClose={() => {}}
        target={{ battleId: "missing", title: { campaignName: "missing" } }}
      />,
      { route: "/", wrapper: i18nWrapper(i18n) }
    )

    expect(
      await screen.findByText("This battle isn't in the game data.")
    ).toBeInTheDocument()
  })

  it("renders nothing while no location is picked", () => {
    render(<CampaignBattleDialog onClose={() => {}} target={null} />, {
      route: "/",
      wrapper: i18nWrapper(i18n),
    })
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
  })

  it("opens and closes from its host without re-rendering the page that lists the raids", async () => {
    let pageRenders = 0
    let dialog: CampaignBattleDialogStore | undefined
    render(
      <RaidsPage
        onRender={(store) => {
          pageRenders += 1
          dialog = store
        }}
      />,
      { route: "/", wrapper: i18nWrapper(i18n) }
    )
    const settled = pageRenders

    act(() =>
      dialog!.show({
        battleId: battle.id,
        title: { campaignName: "Indomitus", nodeLabel: "Elite 40" },
      })
    )
    expect(await screen.findByRole("dialog")).toBeInTheDocument()
    act(() => dialog!.close())
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull())
    expect(pageRenders).toBe(settled)
  })

  it("keeps the page mounted while the dialog's copy is still loading", async () => {
    // A real suspending i18n, as in the app: `dailies` is preloaded, the enemy tiles' copy is not.
    const pending: ReadCallback[] = []
    const backend: BackendModule = {
      type: "backend",
      init: () => {},
      read: (_language, namespace, callback) => {
        if (namespace === "dailies") callback(null, dailiesEn)
        else pending.push(callback)
      },
    }
    const suspending = i18next.createInstance()
    await suspending
      .use(backend)
      .use(initReactI18next)
      .init({
        lng: "en",
        fallbackLng: false,
        ns: ["dailies"],
        defaultNS: "dailies",
        interpolation: { escapeValue: false },
        react: { useSuspense: true },
      })
    const page: { dialog?: CampaignBattleDialogStore } = {}
    render(
      <I18nextProvider i18n={suspending}>
        <Suspense fallback={<p>Route loading</p>}>
          <PlanPage onDialog={(dialog) => (page.dialog = dialog)} />
        </Suspense>
      </I18nextProvider>,
      { route: "/" }
    )

    act(() =>
      page.dialog?.show({
        battleId: battle.id,
        title: { campaignName: "Indomitus", nodeLabel: "Elite 40" },
      })
    )

    expect(await screen.findByRole("dialog")).toBeInTheDocument()
    await screen.findByText("Battles read")
    // The dialog's own boundary shows its loading skeleton (the suspended body stays, hidden).
    const loading = screen.getAllByTestId("campaign-battle-loading")
    expect(loading.at(-1)).toBeVisible()
    expect(screen.getByText("Today's plan")).toBeVisible()
    expect(screen.queryByText("Route loading")).toBeNull()

    // Each namespace the tiles read arrives; later reads may ask for more.
    await waitFor(() => {
      act(() => {
        for (const callback of pending.splice(0)) callback(null, {})
      })
      expect(screen.getByTestId("campaign-battle-summary")).toHaveTextContent(
        "10 energy"
      )
    })
    expect(screen.getByText("Today's plan")).toBeInTheDocument()
  })
})
