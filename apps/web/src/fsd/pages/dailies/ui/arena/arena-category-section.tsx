import { useState } from "react"
import { RefreshCw } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"

import type { ArenaCategory } from "../../model/arena-recommendations.types"
import { ArenaTeam } from "./arena-team"
import { ArenaVariantSwitcher } from "./arena-variant-switcher"

/**
 * One recommended-team category: its title/description, any "broadened" / "capped included" note,
 * an empty state when the category has no basis, and otherwise the team-size switcher plus the
 * active team. The Random category also gets a Regenerate control.
 */
export function ArenaCategorySection({
  category,
  switcherLayout,
  onRegenerate,
}: {
  category: ArenaCategory
  switcherLayout: "inline" | "compact"
  onRegenerate?: () => void
}) {
  const { t } = useTranslation("arena")
  const [preferredSize, setPreferredSize] = useState<number | null>(null)

  const sizes = category.variants.map((variant) => variant.size)
  const activeVariant =
    category.variants.find((variant) => variant.size === preferredSize) ??
    category.variants.find((variant) => variant.isPrimary) ??
    category.variants[0]

  return (
    <Card data-testid={`arena-category-${category.id}`}>
      <CardHeader>
        <CardTitle>{t(`category.${category.id}.title`)}</CardTitle>
        <CardDescription>
          {t(`category.${category.id}.description`)}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {category.emptyReason ? (
          <p
            className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground"
            data-testid={`arena-empty-${category.id}`}
          >
            {t(`empty.${category.emptyReason}`)}
          </p>
        ) : activeVariant ? (
          <>
            {category.broadened ? (
              <p className="text-xs text-muted-foreground">
                {t("category.broadenedNote")}
              </p>
            ) : null}
            {category.includedCappedCharacters ? (
              <p className="text-xs text-muted-foreground">
                {t("category.cappedNote")}
              </p>
            ) : null}
            <div className="flex flex-wrap items-center gap-2">
              <ArenaVariantSwitcher
                sizes={sizes}
                activeSize={activeVariant.size}
                onSizeChange={setPreferredSize}
                layout={switcherLayout}
              />
              {onRegenerate ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onRegenerate}
                  data-testid="arena-random-regenerate"
                >
                  <RefreshCw className="size-4" />
                  {t("regenerate")}
                </Button>
              ) : null}
            </div>
            <ArenaTeam
              members={activeVariant.members}
              testId={`arena-team-${category.id}`}
            />
          </>
        ) : null}
      </CardContent>
    </Card>
  )
}
