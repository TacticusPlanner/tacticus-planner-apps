import { useTranslation } from "react-i18next"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import { Tabs, TabsList, TabsTrigger } from "@workspace/ui/components/tabs"

/**
 * Switches between the XP-Mode team-size variants (3 / 4 / 5). Rendered inline as a segmented
 * control on desktop and as a compact `Select` on mobile. Renders nothing when there is only one
 * variant (Power Mode, or a pool that supports only the minimum size).
 */
export function ArenaVariantSwitcher({
  sizes,
  activeSize,
  onSizeChange,
  layout,
}: {
  sizes: readonly number[]
  activeSize: number
  onSizeChange: (size: number) => void
  layout: "inline" | "compact"
}) {
  const { t } = useTranslation("arena")
  if (sizes.length < 2) return null

  if (layout === "compact") {
    return (
      <Select
        value={String(activeSize)}
        onValueChange={(value) => onSizeChange(Number(value))}
      >
        <SelectTrigger
          className="w-40"
          aria-label={t("variant.label")}
          data-testid="arena-variant-switcher"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {sizes.map((size) => (
            <SelectItem key={size} value={String(size)}>
              {t("variant.option", { count: size })}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    )
  }

  return (
    <Tabs
      value={String(activeSize)}
      onValueChange={(value) => onSizeChange(Number(value))}
    >
      <TabsList
        aria-label={t("variant.label")}
        data-testid="arena-variant-switcher"
      >
        {sizes.map((size) => (
          <TabsTrigger key={size} value={String(size)}>
            {t("variant.option", { count: size })}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  )
}
