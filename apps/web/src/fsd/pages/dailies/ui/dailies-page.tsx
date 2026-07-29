import { Construction } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Card, CardContent } from "@workspace/ui/components/card"

export function DailiesPage() {
  const { t } = useTranslation()

  return (
    <div
      className="flex min-h-[60vh] items-center justify-center px-4 py-8"
      data-testid="dailies-page"
    >
      <Card className="w-full max-w-xl">
        <CardContent className="flex flex-col items-center gap-4 px-6 py-10 text-center">
          <span className="rounded-full bg-primary/10 p-4 text-primary">
            <Construction className="size-10" aria-hidden="true" />
          </span>
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold">{t("dailies.title")}</h2>
            <p className="text-muted-foreground">{t("dailies.description")}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
