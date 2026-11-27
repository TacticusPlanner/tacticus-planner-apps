/** The Inventory page's tabs, each its own route under `/my-game/inventory`. */
export const INVENTORY_TABS = ["upgrades", "ascension"] as const

export type InventoryTab = (typeof INVENTORY_TABS)[number]

export const isInventoryTab = (value: unknown): value is InventoryTab =>
  (INVENTORY_TABS as readonly unknown[]).includes(value)

export const inventoryTabPath = (tab: InventoryTab) =>
  `/my-game/inventory/${tab}`
