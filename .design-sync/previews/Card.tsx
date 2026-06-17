import {
  Button,
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@workspace/ui'

export function Default() {
  return (
    <Card style={{ width: 360 }}>
      <CardHeader>
        <CardTitle>Deploy a new project</CardTitle>
        <CardDescription>Spin up a fresh environment in seconds.</CardDescription>
      </CardHeader>
      <CardContent>
        <p style={{ fontSize: 14, color: 'var(--muted-foreground)' }}>
          Your project will be created in the EU-West region with the default
          runtime. You can change these settings later.
        </p>
      </CardContent>
      <CardFooter style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <Button variant="ghost">Cancel</Button>
        <Button>Deploy</Button>
      </CardFooter>
    </Card>
  )
}

export function WithAction() {
  return (
    <Card style={{ width: 360 }}>
      <CardHeader>
        <CardTitle>Team plan</CardTitle>
        <CardDescription>Billed monthly · renews May 1</CardDescription>
        <CardAction>
          <Button size="sm" variant="outline">
            Manage
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        <div style={{ fontSize: 28, fontWeight: 600 }}>
          $29<span style={{ fontSize: 14, color: 'var(--muted-foreground)' }}>/mo</span>
        </div>
      </CardContent>
    </Card>
  )
}

export function Compact() {
  return (
    <Card size="sm" style={{ width: 300 }}>
      <CardHeader>
        <CardTitle>Storage</CardTitle>
        <CardDescription>18.2 GB of 50 GB used</CardDescription>
      </CardHeader>
    </Card>
  )
}
