import { AlertCircle, CheckCircle2 } from "lucide-react"

import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@workspace/ui/components/alert"
import { Badge } from "@workspace/ui/components/badge"
import { Progress } from "@workspace/ui/components/progress"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { Spinner } from "@workspace/ui/components/spinner"

import { UiKitShowcaseCard } from "./ui-kit-showcase-card"

export function FeedbackShowcase() {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <UiKitShowcaseCard title="Status">
        <div className="flex flex-col gap-4" data-testid="feedback-status">
          <Alert>
            <CheckCircle2 />
            <AlertTitle>Ready</AlertTitle>
            <AlertDescription>
              The UI kit uses installed shadcn components only.
            </AlertDescription>
          </Alert>
          <Alert variant="destructive">
            <AlertCircle />
            <AlertTitle>Needs attention</AlertTitle>
            <AlertDescription>
              Destructive alerts are available for blocking states.
            </AlertDescription>
          </Alert>
          <div className="flex flex-wrap gap-2">
            <Badge>Default</Badge>
            <Badge variant="secondary">Secondary</Badge>
            <Badge variant="outline">Outline</Badge>
            <Badge variant="destructive">Destructive</Badge>
          </div>
        </div>
      </UiKitShowcaseCard>

      <UiKitShowcaseCard title="Loading and progress">
        <div className="flex flex-col gap-4" data-testid="feedback-loading">
          <div className="flex items-center gap-3">
            <Spinner />
            <span className="text-sm text-muted-foreground">
              Loading preview
            </span>
          </div>
          <Progress value={72} />
          <div className="flex flex-col gap-2">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        </div>
      </UiKitShowcaseCard>
    </div>
  )
}
