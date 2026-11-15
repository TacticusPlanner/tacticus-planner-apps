import { describe, expect, it } from "vitest"

import {
  addOffer,
  clearWeek,
  dropUnbought,
  dropUnresolvable,
  markAllBought,
  markDayBought,
  removeEntry,
  setBought,
  setDraftAlliance,
  setQuantity,
  undoBought,
} from "./cart"
import { entry, testEvent, workedCart } from "./test-event.fixture"

const thuYarrick = { week: 1, day: "THU", slotIndex: 0 } as const

describe("cart operations", () => {
  it("adds one pack of an offer", () => {
    const result = addOffer([], {
      ...thuYarrick,
      rewardType: "shards_astraYarrick",
    })

    expect(result).toEqual({
      status: "added",
      cart: [entry("THU", 0, "shards_astraYarrick", 1)],
    })
  })

  it("plans the given quantity, the day's max as the page adds it", () => {
    const result = addOffer([], {
      ...thuYarrick,
      rewardType: "shards_astraYarrick",
      quantity: 5,
    })

    expect(result).toEqual({
      status: "added",
      cart: [entry("THU", 0, "shards_astraYarrick", 5)],
    })
  })

  it("asks before replacing another reward of the same slot and day", () => {
    const cart = [entry("TUE", 0, "upgDmgL025C", 2)]
    const offer = {
      week: 1,
      day: "TUE",
      slotIndex: 0,
      rewardType: "shards_astraYarrick",
    } as const

    expect(addOffer(cart, offer)).toEqual({
      status: "confirmReplace",
      current: cart[0],
    })
    expect(addOffer(cart, offer, { replace: true })).toEqual({
      status: "added",
      cart: [entry("TUE", 0, "shards_astraYarrick", 1)],
    })
  })

  it("keeps a draft reward's alliance and drops it on other rewards", () => {
    const added = addOffer([], {
      week: 1,
      day: "MON",
      slotIndex: 5,
      rewardType: "draft_ascensionOrbsEpic",
      draftAlliance: "xenos",
    })
    expect(added.status === "added" && added.cart[0]?.draftAlliance).toBe(
      "xenos"
    )

    const plain = addOffer([], {
      ...thuYarrick,
      rewardType: "shards_astraYarrick",
      draftAlliance: "xenos",
    })
    expect(plain.status === "added" && plain.cart[0]?.draftAlliance).toBeNull()

    const cart = [entry("MON", 5, "draft_ascensionOrbsEpic", 1, 0, "xenos")]
    const changed = setDraftAlliance(
      cart,
      { week: 1, day: "MON", slotIndex: 5 },
      "chaos"
    )
    expect(changed[0]?.draftAlliance).toBe("chaos")
  })

  it("clamps the quantity to 1..cap and keeps bought within it", () => {
    const cart = [entry("THU", 0, "shards_astraYarrick", 4, 4)]

    expect(setQuantity(cart, thuYarrick, 9, 5)[0]?.quantity).toBe(5)
    expect(setQuantity(cart, thuYarrick, 0, 5)[0]?.quantity).toBe(1)
    expect(setQuantity(cart, thuYarrick, 2, 5)[0]).toMatchObject({
      quantity: 2,
      purchasedQuantity: 2,
    })
  })

  it("marks all bought, sets fewer bought and undoes", () => {
    const cart = [entry("THU", 0, "shards_astraYarrick", 3, 0)]

    const bought = markAllBought(cart, thuYarrick)
    expect(bought[0]?.purchasedQuantity).toBe(3)
    expect(setBought(bought, thuYarrick, 1)[0]?.purchasedQuantity).toBe(1)
    expect(setBought(bought, thuYarrick, 7)[0]?.purchasedQuantity).toBe(3)
    expect(undoBought(bought, thuYarrick)[0]?.purchasedQuantity).toBe(0)
  })

  it("removes an entry", () => {
    expect(removeEntry(workedCart, thuYarrick)).toHaveLength(4)
  })

  it("Missed keeps the bought packs and drops an entry with none", () => {
    const tuesday = { week: 1, day: "TUE", slotIndex: 1 } as const
    const wednesday = { week: 1, day: "WED", slotIndex: 2 } as const

    expect(
      dropUnbought(workedCart, tuesday).find((e) => e.day === "TUE")
    ).toMatchObject({ quantity: 1, purchasedQuantity: 1 })
    expect(
      dropUnbought(workedCart, wednesday).find((e) => e.day === "WED")
    ).toBeUndefined()
  })

  it("marks every entry of one day bought", () => {
    const cart = [
      entry("THU", 0, "shards_astraYarrick", 2, 0),
      entry("THU", 1, "upgArmL021C", 3, 1),
      entry("FRI", 1, "upgArmL021C", 1, 0),
    ]

    expect(
      markDayBought(testEvent, cart, 3).map((e) => e.purchasedQuantity)
    ).toEqual([2, 3, 0])
  })

  it("Clear week keeps every bought pack", () => {
    // a done 2 of 2, b past 1 of 3, c past 0 of 1, d today 0 of 2 (spec scenario).
    const cleared = clearWeek(workedCart.slice(0, 4), 1)

    expect(cleared).toEqual([
      entry("MON", 0, "shards_astraYarrick", 2, 2),
      entry("TUE", 1, "upgArmL021C", 1, 1),
    ])
  })

  it("drops entries the catalog no longer has", () => {
    const cart = [
      ...workedCart,
      entry("TUE", 0, "shards_astraYarrick", 1),
      entry("MON", 9, "gold", 1),
    ]

    expect(dropUnresolvable(testEvent, cart)).toEqual({
      cart: workedCart,
      removed: 2,
    })
  })
})
