import { AlertCircle, CheckCircle2 } from "lucide-react"
import { toast } from "sonner"

import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@workspace/ui/components/alert"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
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

      <UiKitShowcaseCard title="Toast notifications">
        <div className="flex flex-wrap gap-2" data-testid="feedback-toasts">
          <Button
            data-testid="toast-default-trigger"
            onClick={() => toast("Upgrade plan saved.")}
            variant="outline"
          >
            Default toast
          </Button>
          <Button
            data-testid="toast-success-trigger"
            onClick={() => toast.success("Roster sync complete.")}
            variant="outline"
          >
            Success toast
          </Button>
          <Button
            data-testid="toast-error-trigger"
            onClick={() => toast.error("Battle import failed.")}
            variant="outline"
          >
            Error toast
          </Button>
          <Button
            data-testid="toast-action-trigger"
            onClick={() =>
              toast("Inventory item archived.", {
                action: {
                  label: "Undo",
                  onClick: () => toast("Archive undone."),
                },
              })
            }
          >
            Action toast
          </Button>
        </div>
      </UiKitShowcaseCard>
    </div>
  )
}
