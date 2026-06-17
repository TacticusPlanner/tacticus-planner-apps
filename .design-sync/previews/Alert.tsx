import { Alert, AlertAction, AlertDescription, AlertTitle, Button } from '@workspace/ui'
import { CheckCircle2Icon, AlertTriangleIcon } from 'lucide-react'

export function Default() {
  return (
    <Alert style={{ maxWidth: 460 }}>
      <CheckCircle2Icon />
      <AlertTitle>Changes saved</AlertTitle>
      <AlertDescription>
        Your project settings have been updated successfully.
      </AlertDescription>
    </Alert>
  )
}

export function Destructive() {
  return (
    <Alert variant="destructive" style={{ maxWidth: 460 }}>
      <AlertTriangleIcon />
      <AlertTitle>Unable to process payment</AlertTitle>
      <AlertDescription>
        Your card was declined. Please update your billing details and try again.
      </AlertDescription>
    </Alert>
  )
}

export function WithAction() {
  return (
    <Alert style={{ maxWidth: 460 }}>
      <AlertTriangleIcon />
      <AlertTitle>Storage almost full</AlertTitle>
      <AlertDescription>You have used 92% of your available storage.</AlertDescription>
      <AlertAction>
        <Button size="xs" variant="outline">
          Upgrade
        </Button>
      </AlertAction>
    </Alert>
  )
}
