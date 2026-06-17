import { Button, Spinner } from '@workspace/ui'

export function Sizes() {
  return (
    <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
      <Spinner className="size-4" />
      <Spinner className="size-6" />
      <Spinner className="size-8" />
    </div>
  )
}

export function InButton() {
  return (
    <Button disabled>
      <Spinner /> Saving…
    </Button>
  )
}
