import { Construction } from "lucide-react"
import { Card, CardContent } from "@workspace/ui/components/card"

export function UnderConstruction({
  title,
  description,
  testId = "under-construction",
}: {
  title: string
  description: string
  testId?: string
}) {
  return (
    <div
      className="flex min-h-[28rem] items-center justify-center py-8"
      data-testid={testId}
    >
      <Card className="w-full max-w-xl">
        <CardContent className="flex flex-col items-center gap-4 px-6 py-10 text-center">
          <span className="rounded-full bg-primary/10 p-4 text-primary">
            <Construction className="size-10" aria-hidden="true" />
          </span>
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold">{title}</h2>
            <p className="text-muted-foreground">{description}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
